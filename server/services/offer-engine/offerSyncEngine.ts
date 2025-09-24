/**
 * Offer Sync Engine - Billion Dollar Empire Grade
 * Comprehensive synchronization engine for all affiliate networks
 */

import { db } from "../../db";
import { offerSources, offerFeed, offerSyncHistory } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { adapterRegistry } from './affiliateAdapters/adapterRegistry';
import { offerEngineCore } from './offerEngineCore';

export interface SyncResult {
  sourceId: number;
  sourceName: string;
  batchId: string;
  success: boolean;
  offersProcessed: number;
  offersAdded: number;
  offersUpdated: number;
  errors: string[];
  duration: number;
}

export class OfferSyncEngine {
  private static instance: OfferSyncEngine;
  private syncInProgress = new Set<number>();

  static getInstance(): OfferSyncEngine {
    if (!OfferSyncEngine.instance) {
      OfferSyncEngine.instance = new OfferSyncEngine();
    }
    return OfferSyncEngine.instance;
  }

  /**
   * Sync all active offer sources
   */
  async syncAllSources(): Promise<SyncResult[]> {
    console.log('🔄 Starting sync for all active offer sources...');
    
    try {
      // Get all active sources
      const activeSources = await db.select()
        .from(offerSources)
        .where(eq(offerSources.isActive, true));

      if (activeSources.length === 0) {
        console.log('⏸️ No active sources to sync');
        return [];
      }

      console.log(`📊 Found ${activeSources.length} active sources to sync`);

      // Sync each source
      const syncPromises = activeSources.map(source => this.syncSource(source.id));
      const results = await Promise.allSettled(syncPromises);

      // Process results
      const syncResults: SyncResult[] = [];
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const source = activeSources[i];
        
        if (result.status === 'fulfilled') {
          syncResults.push(result.value);
        } else {
          console.error(`Failed to sync source ${source.name}:`, result.reason);
          syncResults.push({
            sourceId: source.id,
            sourceName: source.name,
            batchId: randomUUID(),
            success: false,
            offersProcessed: 0,
            offersAdded: 0,
            offersUpdated: 0,
            errors: [result.reason?.message || 'Unknown error'],
            duration: 0
          });
        }
      }

      const successCount = syncResults.filter(r => r.success).length;
      console.log(`✅ Sync completed: ${successCount}/${syncResults.length} sources successful`);

      return syncResults;
    } catch (error) {
      console.error('Failed to sync all sources:', error);
      throw error;
    }
  }

  /**
   * Sync a specific offer source
   */
  async syncSource(sourceId: number): Promise<SyncResult> {
    const startTime = Date.now();
    const batchId = randomUUID();

    // Check if sync is already in progress
    if (this.syncInProgress.has(sourceId)) {
      throw new Error(`Sync already in progress for source ${sourceId}`);
    }

    try {
      this.syncInProgress.add(sourceId);

      // Get source details
      const [source] = await db.select()
        .from(offerSources)
        .where(eq(offerSources.id, sourceId));

      if (!source) {
        throw new Error(`Source not found: ${sourceId}`);
      }

      if (!source.isActive) {
        throw new Error(`Source is not active: ${source.name}`);
      }

      console.log(`🔄 Starting sync for ${source.name} (${source.slug})`);

      // Create sync history record
      const [syncRecord] = await db.insert(offerSyncHistory).values({
        sourceId,
        batchId,
        syncType: 'scheduled',
        status: 'running',
        offersProcessed: 0,
        offersAdded: 0,
        offersUpdated: 0,
        startedAt: new Date()
      }).returning();

      let offersProcessed = 0;
      let offersAdded = 0;
      let offersUpdated = 0;
      const errors: string[] = [];

      try {
        // Get adapter for this source
        const adapter = await adapterRegistry.getAdapter(source.slug);
        if (!adapter) {
          throw new Error(`No adapter found for source: ${source.slug}`);
        }

        // Validate credentials
        if (!source.credentials || Object.keys(source.credentials).length === 0) {
          throw new Error(`No credentials configured for source: ${source.name}`);
        }

        // Test adapter connection
        const testResult = await adapterRegistry.testAdapter(source.slug, source.credentials);
        if (!testResult.success) {
          throw new Error(`Adapter test failed: ${testResult.error}`);
        }

        // Fetch offers from adapter
        console.log(`📊 Fetching offers from ${source.name}...`);
        const fetchResult = await adapter.fetchOffers(source.credentials);
        
        if (!fetchResult.success) {
          throw new Error(`Failed to fetch offers: ${fetchResult.error}`);
        }

        console.log(`📦 Received ${fetchResult.offers.length} offers from ${source.name}`);

        // Process and save offers
        if (fetchResult.offers.length > 0) {
          const upsertResult = await offerEngineCore.bulkUpsertOffers(
            fetchResult.offers.map(offer => ({
              ...offer,
              sourceId,
              batchId,
              lastSyncAt: new Date()
            }))
          );

          offersProcessed = fetchResult.offers.length;
          offersAdded = upsertResult.inserted;
          offersUpdated = upsertResult.updated;

          if (upsertResult.errors > 0) {
            errors.push(`${upsertResult.errors} offers failed to save`);
          }

          // Update source last sync
          await db.update(offerSources)
            .set({
              lastSync: new Date(),
              errorCount: 0,
              updatedAt: new Date()
            })
            .where(eq(offerSources.id, sourceId));

          console.log(`✅ ${source.name}: ${offersAdded} added, ${offersUpdated} updated`);
        }

        // Update sync record with success
        await db.update(offerSyncHistory)
          .set({
            status: 'completed',
            offersProcessed,
            offersAdded,
            offersUpdated,
            completedAt: new Date()
          })
          .where(eq(offerSyncHistory.id, syncRecord.id));

        const duration = Date.now() - startTime;
        console.log(`✅ Sync completed for ${source.name} in ${duration}ms`);

        return {
          sourceId,
          sourceName: source.name,
          batchId,
          success: true,
          offersProcessed,
          offersAdded,
          offersUpdated,
          errors,
          duration
        };

      } catch (error) {
        console.error(`❌ Sync failed for ${source.name}:`, error);
        
        // Update sync record with failure
        await db.update(offerSyncHistory)
          .set({
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : String(error),
            completedAt: new Date()
          })
          .where(eq(offerSyncHistory.id, syncRecord.id));

        // Update source error count
        await db.update(offerSources)
          .set({
            errorCount: source.errorCount + 1,
            updatedAt: new Date()
          })
          .where(eq(offerSources.id, sourceId));

        throw error;
      }

    } finally {
      this.syncInProgress.delete(sourceId);
    }
  }

  /**
   * Get sync status for all sources
   */
  async getSyncStatus(): Promise<Array<{
    sourceId: number;
    sourceName: string;
    isActive: boolean;
    lastSync: Date | null;
    errorCount: number;
    isCurrentlySyncing: boolean;
    nextSyncDue: Date | null;
  }>> {
    try {
      const sources = await db.select()
        .from(offerSources)
        .orderBy(offerSources.name);

      return sources.map(source => ({
        sourceId: source.id,
        sourceName: source.name,
        isActive: source.isActive,
        lastSync: source.lastSync,
        errorCount: source.errorCount,
        isCurrentlySyncing: this.syncInProgress.has(source.id),
        nextSyncDue: this.calculateNextSyncDue(source.syncFrequency, source.lastSync)
      }));
    } catch (error) {
      console.error('Failed to get sync status:', error);
      return [];
    }
  }

  /**
   * Calculate next sync due time based on frequency
   */
  private calculateNextSyncDue(frequency: string, lastSync: Date | null): Date | null {
    if (!lastSync) return new Date(); // Sync immediately if never synced

    const now = new Date();
    const lastSyncTime = new Date(lastSync);

    switch (frequency) {
      case 'hourly':
        return new Date(lastSyncTime.getTime() + 60 * 60 * 1000);
      case 'twice_daily':
        return new Date(lastSyncTime.getTime() + 12 * 60 * 60 * 1000);
      case 'daily':
        return new Date(lastSyncTime.getTime() + 24 * 60 * 60 * 1000);
      case 'weekly':
        return new Date(lastSyncTime.getTime() + 7 * 24 * 60 * 60 * 1000);
      default:
        return new Date(lastSyncTime.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Check if any sources are due for sync
   */
  async getSourcesDueForSync(): Promise<number[]> {
    try {
      const sources = await db.select()
        .from(offerSources)
        .where(eq(offerSources.isActive, true));

      const dueSourceIds: number[] = [];
      const now = new Date();

      for (const source of sources) {
        if (this.syncInProgress.has(source.id)) {
          continue; // Skip if already syncing
        }

        const nextDue = this.calculateNextSyncDue(source.syncFrequency, source.lastSync);
        if (nextDue && nextDue <= now) {
          dueSourceIds.push(source.id);
        }
      }

      return dueSourceIds;
    } catch (error) {
      console.error('Failed to check sources due for sync:', error);
      return [];
    }
  }

  /**
   * Start background sync scheduler (cron-like functionality)
   */
  startScheduler(): void {
    console.log('🕐 Starting offer sync scheduler...');

    // Check for due syncs every 5 minutes
    setInterval(async () => {
      try {
        const dueSourceIds = await this.getSourcesDueForSync();
        
        if (dueSourceIds.length > 0) {
          console.log(`🔄 Found ${dueSourceIds.length} sources due for sync`);
          
          // Sync each due source
          for (const sourceId of dueSourceIds) {
            try {
              await this.syncSource(sourceId);
            } catch (error) {
              console.error(`Scheduled sync failed for source ${sourceId}:`, error);
            }
            
            // Add small delay between syncs to avoid overwhelming APIs
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      } catch (error) {
        console.error('Sync scheduler error:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    console.log('✅ Offer sync scheduler started');
  }

  /**
   * Force sync specific source (ignore frequency limits)
   */
  async forceSyncSource(sourceId: number): Promise<SyncResult> {
    console.log(`🔄 Force syncing source ${sourceId}...`);
    return await this.syncSource(sourceId);
  }

  /**
   * Get detailed sync statistics
   */
  async getSyncStatistics(): Promise<{
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    avgSyncDuration: number;
    totalOffersProcessed: number;
    totalOffersAdded: number;
    totalOffersUpdated: number;
    sourceStats: Array<{
      sourceName: string;
      totalSyncs: number;
      successRate: number;
      avgDuration: number;
    }>;
  }> {
    try {
      const allSyncs = await db.select({
        sourceId: offerSyncHistory.sourceId,
        sourceName: offerSources.name,
        status: offerSyncHistory.status,
        offersProcessed: offerSyncHistory.offersProcessed,
        offersAdded: offerSyncHistory.offersAdded,
        offersUpdated: offerSyncHistory.offersUpdated,
        startedAt: offerSyncHistory.startedAt,
        completedAt: offerSyncHistory.completedAt
      })
      .from(offerSyncHistory)
      .leftJoin(offerSources, eq(offerSyncHistory.sourceId, offerSources.id));

      const totalSyncs = allSyncs.length;
      const successfulSyncs = allSyncs.filter(s => s.status === 'completed').length;
      const failedSyncs = allSyncs.filter(s => s.status === 'failed').length;
      
      const completedSyncs = allSyncs.filter(s => s.completedAt && s.startedAt);
      const avgSyncDuration = completedSyncs.length > 0 
        ? completedSyncs.reduce((sum, s) => {
            const duration = s.completedAt!.getTime() - s.startedAt.getTime();
            return sum + duration;
          }, 0) / completedSyncs.length
        : 0;

      const totalOffersProcessed = allSyncs.reduce((sum, s) => sum + (s.offersProcessed || 0), 0);
      const totalOffersAdded = allSyncs.reduce((sum, s) => sum + (s.offersAdded || 0), 0);
      const totalOffersUpdated = allSyncs.reduce((sum, s) => sum + (s.offersUpdated || 0), 0);

      // Calculate per-source statistics
      const sourceMap = new Map<string, any>();
      for (const sync of allSyncs) {
        const sourceName = sync.sourceName || 'Unknown';
        if (!sourceMap.has(sourceName)) {
          sourceMap.set(sourceName, {
            sourceName,
            syncs: [],
            totalSyncs: 0,
            successfulSyncs: 0
          });
        }
        
        const sourceData = sourceMap.get(sourceName);
        sourceData.syncs.push(sync);
        sourceData.totalSyncs++;
        if (sync.status === 'completed') {
          sourceData.successfulSyncs++;
        }
      }

      const sourceStats = Array.from(sourceMap.values()).map(sourceData => {
        const completedSourceSyncs = sourceData.syncs.filter((s: any) => s.completedAt && s.startedAt);
        const avgDuration = completedSourceSyncs.length > 0
          ? completedSourceSyncs.reduce((sum: number, s: any) => {
              const duration = s.completedAt.getTime() - s.startedAt.getTime();
              return sum + duration;
            }, 0) / completedSourceSyncs.length
          : 0;

        return {
          sourceName: sourceData.sourceName,
          totalSyncs: sourceData.totalSyncs,
          successRate: sourceData.totalSyncs > 0 
            ? (sourceData.successfulSyncs / sourceData.totalSyncs) * 100 
            : 0,
          avgDuration
        };
      });

      return {
        totalSyncs,
        successfulSyncs,
        failedSyncs,
        avgSyncDuration,
        totalOffersProcessed,
        totalOffersAdded,
        totalOffersUpdated,
        sourceStats
      };
    } catch (error) {
      console.error('Failed to get sync statistics:', error);
      return {
        totalSyncs: 0,
        successfulSyncs: 0,
        failedSyncs: 0,
        avgSyncDuration: 0,
        totalOffersProcessed: 0,
        totalOffersAdded: 0,
        totalOffersUpdated: 0,
        sourceStats: []
      };
    }
  }
}

// Export singleton instance
export const offerSyncEngine = OfferSyncEngine.getInstance();