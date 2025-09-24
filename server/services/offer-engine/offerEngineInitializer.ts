/**
 * Offer Engine Initializer - Billion Dollar Empire Grade
 * Complete initialization system for the affiliate offer engine
 */

import { offerSourcesInitializer } from './offerSourcesInitializer';
import { offerSyncEngine } from './offerSyncEngine';
import { offerEngineCore } from './offerEngineCore';
import { adapterRegistry } from './affiliateAdapters/adapterRegistry';

export class OfferEngineInitializer {
  private static instance: OfferEngineInitializer;
  private isInitialized = false;

  static getInstance(): OfferEngineInitializer {
    if (!OfferEngineInitializer.instance) {
      OfferEngineInitializer.instance = new OfferEngineInitializer();
    }
    return OfferEngineInitializer.instance;
  }

  /**
   * Initialize the complete billion-dollar offer engine system
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      console.log('📋 Offer Engine already initialized');
      return true;
    }

    console.log('🚀 Initializing Billion-Dollar Offer Engine...');

    try {
      // Step 1: Initialize offer sources in database
      console.log('📊 Initializing offer sources...');
      await offerSourcesInitializer.initializeAllSources();

      // Step 2: Initialize adapter registry
      console.log('🔌 Verifying adapter registry...');
      const adapters = await adapterRegistry.getAllAdapters();
      console.log(`✅ ${adapters.length} adapters registered and ready`);

      // Step 3: Initialize sync engine
      console.log('🔄 Initializing sync engine...');
      // The sync engine auto-registers adapters and sets up cron jobs

      // Step 4: Verify core engine functionality
      console.log('🎯 Verifying core engine...');
      const sources = await offerEngineCore.getOfferSources();
      console.log(`✅ ${sources.length} offer sources available`);

      // Step 5: Get initialization status
      const status = await offerSourcesInitializer.getInitializationStatus();
      console.log('📊 Offer Engine Status:');
      console.log(`   • Total Sources: ${status.total}`);
      console.log(`   • Initialized: ${status.initialized}`);
      console.log(`   • Active: ${status.active}`);

      // Step 6: Perform initial sync if we have active sources
      if (status.active > 0) {
        console.log('🔄 Performing initial offer sync...');
        try {
          const syncResults = await offerSyncEngine.syncAllSources();
          const successfulSyncs = syncResults.filter(r => r.success).length;
          console.log(`✅ Initial sync completed: ${successfulSyncs}/${syncResults.length} sources synced successfully`);
        } catch (error) {
          console.warn('⚠️ Initial sync failed, but engine is operational:', error);
        }
      } else {
        console.log('⏸️ No active sources configured - activate sources with credentials to enable syncing');
      }

      this.isInitialized = true;
      console.log('🎉 Billion-Dollar Offer Engine initialized successfully!');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Offer Engine:', error);
      return false;
    }
  }

  /**
   * Get comprehensive system status
   */
  async getSystemStatus(): Promise<{
    isInitialized: boolean;
    sources: {
      total: number;
      initialized: number;
      active: number;
    };
    adapters: {
      total: number;
      healthy: number;
    };
    offers: {
      total: number;
      active: number;
    };
    lastSync: Date | null;
  }> {
    try {
      // Get sources status
      const sourcesStatus = await offerSourcesInitializer.getInitializationStatus();
      
      // Get adapters status
      const adapters = await adapterRegistry.getAllAdapters();
      
      // Get offers count
      const offers = await offerEngineCore.getOffers({ limit: 1 });
      const totalOffers = await offerEngineCore.getOffersCount({});
      const activeOffers = await offerEngineCore.getOffersCount({ isActive: true });

      // Get last sync time
      const sources = await offerEngineCore.getOfferSources();
      const lastSync = sources
        .filter(s => s.lastSync)
        .sort((a, b) => (b.lastSync!.getTime() - a.lastSync!.getTime()))[0]?.lastSync || null;

      return {
        isInitialized: this.isInitialized,
        sources: {
          total: sourcesStatus.total,
          initialized: sourcesStatus.initialized,
          active: sourcesStatus.active
        },
        adapters: {
          total: adapters.length,
          healthy: adapters.filter(a => a.healthStatus === 'healthy').length
        },
        offers: {
          total: totalOffers,
          active: activeOffers
        },
        lastSync
      };
    } catch (error) {
      console.error('Failed to get system status:', error);
      return {
        isInitialized: false,
        sources: { total: 0, initialized: 0, active: 0 },
        adapters: { total: 0, healthy: 0 },
        offers: { total: 0, active: 0 },
        lastSync: null
      };
    }
  }

  /**
   * Activate a source with provided credentials
   */
  async activateSource(slug: string, credentials: Record<string, string>): Promise<{
    success: boolean;
    message: string;
    connectionTest?: boolean;
  }> {
    try {
      // First activate the source
      const activated = await offerSourcesInitializer.activateSource(slug, credentials);
      
      if (!activated) {
        return {
          success: false,
          message: `Failed to activate source: ${slug}`
        };
      }

      // Test the connection
      let connectionTest = false;
      try {
        const testResult = await adapterRegistry.testAdapter(slug, credentials);
        connectionTest = testResult.success;
      } catch (error) {
        console.warn(`Connection test failed for ${slug}:`, error);
      }

      return {
        success: true,
        message: `Source ${slug} activated successfully`,
        connectionTest
      };
    } catch (error) {
      console.error(`Failed to activate source ${slug}:`, error);
      return {
        success: false,
        message: `Error activating source: ${error}`
      };
    }
  }

  /**
   * Trigger manual sync for all active sources
   */
  async triggerManualSync(): Promise<{
    success: boolean;
    results: any[];
    message: string;
  }> {
    try {
      console.log('🔄 Triggering manual sync for all active sources...');
      
      const results = await offerSyncEngine.syncAllSources();
      const successCount = results.filter(r => r.success).length;
      
      return {
        success: true,
        results,
        message: `Manual sync completed: ${successCount}/${results.length} sources synced successfully`
      };
    } catch (error) {
      console.error('Failed to trigger manual sync:', error);
      return {
        success: false,
        results: [],
        message: `Manual sync failed: ${error}`
      };
    }
  }

  /**
   * Reset and reinitialize the entire system
   */
  async reinitialize(): Promise<boolean> {
    console.log('🔄 Reinitializing Offer Engine...');
    
    this.isInitialized = false;
    return await this.initialize();
  }
}

// Export singleton instance
export const offerEngineInitializer = OfferEngineInitializer.getInstance();