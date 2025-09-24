// Content Feed Core Engine - Main orchestration and management
import { db } from "../../db";
import { 
  contentFeed, 
  contentFeedSources, 
  contentFeedSyncLogs,
  contentFeedCategories,
  contentFeedRules,
  contentFeedAnalytics,
  contentFeedInteractions,
  contentFeedNotifications,
  type ContentFeed,
  type ContentFeedSource,
  type InsertContentFeed,
  type InsertContentFeedSource,
  type InsertContentFeedSyncLog,
  type ContentFeedSyncLog
} from "../../../shared/contentFeedTables";
import { eq, and, gte, lte, desc, asc, sql, inArray } from "drizzle-orm";
import { ContentEnrichmentEngine } from "./contentEnrichmentEngine";
import { ContentFeedConnectorManager } from "./connectors/connectorManager";
import { ContentFeedNotificationEngine } from "./contentFeedNotificationEngine";

export interface ContentFeedStats {
  totalItems: number;
  activeItems: number;
  expiredItems: number;
  totalSources: number;
  activeSources: number;
  lastSyncAt: Date | null;
  avgQualityScore: number;
  totalViews: number;
  totalClicks: number;
  totalConversions: number;
  avgCTR: number;
  avgConversionRate: number;
}

export interface SyncOptions {
  sourceId?: number;
  syncType?: 'full' | 'incremental' | 'manual';
  forceRefresh?: boolean;
  categories?: string[];
  maxItems?: number;
}

export interface ContentFilter {
  categories?: string[];
  contentTypes?: string[];
  status?: string[];
  qualityScoreMin?: number;
  dateRange?: { start: Date; end: Date };
  searchQuery?: string;
  verticalNeuron?: string;
}

export class ContentFeedCore {
  private enrichmentEngine: ContentEnrichmentEngine;
  private connectorManager: ContentFeedConnectorManager;
  private notificationEngine: ContentFeedNotificationEngine;

  constructor() {
    this.enrichmentEngine = new ContentEnrichmentEngine();
    this.connectorManager = new ContentFeedConnectorManager();
    this.notificationEngine = new ContentFeedNotificationEngine();
  }

  // === SOURCE MANAGEMENT ===

  async createSource(sourceData: InsertContentFeedSource): Promise<ContentFeedSource> {
    try {
      const [source] = await db.insert(contentFeedSources).values(sourceData).returning();
      
      // Initialize first sync scheduling
      if (source.isActive && source.refreshInterval) {
        await this.scheduleNextSync(source.id);
      }

      await this.notificationEngine.createNotification({
        sourceId: source.id,
        notificationType: 'source_created',
        title: `New content source: ${source.name}`,
        message: `Content source ${source.name} (${source.sourceType}) has been created and is ready for syncing.`,
        severity: 'info'
      });

      return source;
    } catch (error) {
      console.error('Error creating content source:', error);
      throw error;
    }
  }

  async getSources(activeOnly: boolean = false): Promise<ContentFeedSource[]> {
    try {
      const query = db.select().from(contentFeedSources);
      
      if (activeOnly) {
        return await query.where(eq(contentFeedSources.isActive, true));
      }
      
      return await query.orderBy(asc(contentFeedSources.name));
    } catch (error) {
      console.error('Error getting content sources:', error);
      return [];
    }
  }

  async updateSource(sourceId: number, updates: Partial<ContentFeedSource>): Promise<ContentFeedSource | null> {
    try {
      const [source] = await db
        .update(contentFeedSources)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(contentFeedSources.id, sourceId))
        .returning();

      if (source && updates.isActive !== undefined) {
        if (updates.isActive) {
          await this.scheduleNextSync(sourceId);
        } else {
          // Cancel scheduled syncs for disabled sources
          await this.cancelScheduledSync(sourceId);
        }
      }

      return source || null;
    } catch (error) {
      console.error('Error updating content source:', error);
      throw error;
    }
  }

  async deleteSource(sourceId: number): Promise<boolean> {
    try {
      // Soft delete by deactivating and removing associated content
      await db.transaction(async (tx) => {
        // Deactivate source
        await tx
          .update(contentFeedSources)
          .set({ isActive: false, updatedAt: new Date() })
          .where(eq(contentFeedSources.id, sourceId));

        // Mark all content from this source as expired
        await tx
          .update(contentFeed)
          .set({ status: 'expired', updatedAt: new Date() })
          .where(eq(contentFeed.sourceId, sourceId));
      });

      await this.notificationEngine.createNotification({
        sourceId,
        notificationType: 'source_deleted',
        title: 'Content source deleted',
        message: `Content source has been deactivated and all associated content marked as expired.`,
        severity: 'warning'
      });

      return true;
    } catch (error) {
      console.error('Error deleting content source:', error);
      return false;
    }
  }

  // === CONTENT SYNCHRONIZATION ===

  async syncContent(options: SyncOptions = {}): Promise<ContentFeedSyncLog> {
    const startTime = Date.now();
    const syncType = options.syncType || 'incremental';
    
    const syncLog: InsertContentFeedSyncLog = {
      sourceId: options.sourceId || null,
      syncType,
      status: 'running',
      itemsProcessed: 0,
      itemsAdded: 0,
      itemsUpdated: 0,
      itemsRemoved: 0,
      errors: [],
      metadata: { options }
    };

    let logId: number;

    try {
      // Create sync log
      const [log] = await db.insert(contentFeedSyncLogs).values(syncLog).returning();
      logId = log.id;

      // Get sources to sync
      const sources = options.sourceId 
        ? await db.select().from(contentFeedSources).where(eq(contentFeedSources.id, options.sourceId))
        : await this.getSources(true);

      let totalProcessed = 0;
      let totalAdded = 0;
      let totalUpdated = 0;
      let totalRemoved = 0;
      const errors: string[] = [];

      // Sync each source
      for (const source of sources) {
        try {
          console.log(`🔄 Syncing content from ${source.name} (${source.sourceType})`);
          
          const connector = this.connectorManager.getConnector(source.sourceType);
          if (!connector) {
            throw new Error(`No connector available for source type: ${source.sourceType}`);
          }

          // Fetch content from external source
          const externalContent = await connector.fetchContent(source, {
            syncType,
            lastSyncAt: source.lastSyncAt,
            maxItems: options.maxItems,
            categories: options.categories
          });

          console.log(`📦 Fetched ${externalContent.length} items from ${source.name}`);

          // Process and normalize content
          for (const item of externalContent) {
            try {
              const processedItem = await this.processContentItem(item, source);
              
              if (processedItem.isNew) {
                totalAdded++;
              } else {
                totalUpdated++;
              }
              
              totalProcessed++;
            } catch (itemError) {
              console.error(`Error processing item from ${source.name}:`, itemError);
              errors.push(`Item processing error: ${(itemError as Error).message}`);
            }
          }

          // Update source last sync time
          await db
            .update(contentFeedSources)
            .set({ 
              lastSyncAt: new Date(),
              nextSyncAt: new Date(Date.now() + (source.refreshInterval || 3600) * 1000)
            })
            .where(eq(contentFeedSources.id, source.id));

        } catch (sourceError) {
          console.error(`Error syncing source ${source.name}:`, sourceError);
          errors.push(`Source sync error for ${source.name}: ${(sourceError as Error).message}`);
        }
      }

      // Remove expired content if this is a full sync
      if (syncType === 'full') {
        const expiredCount = await this.removeExpiredContent();
        totalRemoved = expiredCount;
      }

      // Update sync log with results
      const duration = Date.now() - startTime;
      const finalStatus = errors.length > 0 ? (totalProcessed > 0 ? 'partial' : 'failed') : 'success';

      const [updatedLog] = await db
        .update(contentFeedSyncLogs)
        .set({
          status: finalStatus,
          itemsProcessed: totalProcessed,
          itemsAdded: totalAdded,
          itemsUpdated: totalUpdated,
          itemsRemoved: totalRemoved,
          errors: errors.length > 0 ? errors : null,
          duration,
          completedAt: new Date()
        })
        .where(eq(contentFeedSyncLogs.id, logId))
        .returning();

      // Create notification for sync completion
      await this.notificationEngine.createNotification({
        sourceId: options.sourceId || null,
        notificationType: finalStatus === 'success' ? 'sync_success' : 'sync_error',
        title: `Content sync ${finalStatus}`,
        message: `Sync completed: ${totalProcessed} processed, ${totalAdded} added, ${totalUpdated} updated, ${totalRemoved} removed${errors.length > 0 ? `, ${errors.length} errors` : ''}`,
        severity: finalStatus === 'success' ? 'info' : 'warning',
        metadata: { duration, errors: errors.slice(0, 5) } // Limit error details
      });

      console.log(`✅ Content sync completed: ${finalStatus} (${duration}ms)`);
      return updatedLog;

    } catch (error) {
      console.error('Content sync failed:', error);
      
      // Update log with error
      if (logId!) {
        await db
          .update(contentFeedSyncLogs)
          .set({
            status: 'failed',
            errors: [(error as Error).message],
            duration: Date.now() - startTime,
            completedAt: new Date()
          })
          .where(eq(contentFeedSyncLogs.id, logId));
      }

      throw error;
    }
  }

  private async processContentItem(item: any, source: ContentFeedSource): Promise<{ isNew: boolean; content: ContentFeed }> {
    try {
      // Check if content already exists
      const existingContent = await db
        .select()
        .from(contentFeed)
        .where(
          and(
            eq(contentFeed.sourceId, source.id),
            eq(contentFeed.externalId, item.externalId)
          )
        )
        .limit(1);

      const contentData: InsertContentFeed = {
        sourceId: source.id,
        externalId: item.externalId,
        contentType: item.contentType,
        title: item.title,
        description: item.description,
        content: item.content,
        excerpt: item.excerpt,
        category: item.category,
        tags: item.tags,
        price: item.price,
        originalPrice: item.originalPrice,
        currency: item.currency,
        discount: item.discount,
        couponCode: item.couponCode,
        affiliateUrl: item.affiliateUrl,
        merchantName: item.merchantName,
        author: item.author,
        publishedAt: item.publishedAt,
        imageUrl: item.imageUrl,
        images: item.images,
        rating: item.rating,
        reviewCount: item.reviewCount,
        qualityScore: item.qualityScore || null,
        status: item.status || 'active',
        expiresAt: item.expiresAt,
        syncedAt: new Date()
      };

      let content: ContentFeed;
      let isNew = false;

      if (existingContent.length > 0) {
        // Update existing content
        const [updated] = await db
          .update(contentFeed)
          .set({ ...contentData, updatedAt: new Date() })
          .where(eq(contentFeed.id, existingContent[0].id))
          .returning();
        content = updated;
      } else {
        // Create new content
        const [created] = await db.insert(contentFeed).values(contentData).returning();
        content = created;
        isNew = true;
      }

      // Apply content enrichment
      if (source.settings?.autoEnrich !== false) {
        await this.enrichmentEngine.enrichContent(content.id);
      }

      // Apply filtering rules
      await this.applyContentRules(content.id, source.id);

      return { isNew, content };

    } catch (error) {
      console.error('Error processing content item:', error);
      throw error;
    }
  }

  // === CONTENT MANAGEMENT ===

  async getContent(filter: ContentFilter = {}, limit: number = 50, offset: number = 0): Promise<ContentFeed[]> {
    try {
      let query = db.select().from(contentFeed);
      const conditions = [];

      if (filter.categories?.length) {
        conditions.push(inArray(contentFeed.category, filter.categories));
      }

      if (filter.contentTypes?.length) {
        conditions.push(inArray(contentFeed.contentType, filter.contentTypes));
      }

      if (filter.status?.length) {
        conditions.push(inArray(contentFeed.status, filter.status));
      }

      if (filter.qualityScoreMin) {
        conditions.push(gte(contentFeed.qualityScore, filter.qualityScoreMin.toString()));
      }

      if (filter.dateRange) {
        conditions.push(
          and(
            gte(contentFeed.createdAt, filter.dateRange.start),
            lte(contentFeed.createdAt, filter.dateRange.end)
          )
        );
      }

      if (filter.searchQuery) {
        conditions.push(
          sql`(${contentFeed.title} ILIKE ${'%' + filter.searchQuery + '%'} OR ${contentFeed.description} ILIKE ${'%' + filter.searchQuery + '%'})`
        );
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      return await query
        .orderBy(desc(contentFeed.updatedAt))
        .limit(limit)
        .offset(offset);

    } catch (error) {
      console.error('Error getting content:', error);
      return [];
    }
  }

  async getContentById(contentId: number): Promise<ContentFeed | null> {
    try {
      const [content] = await db
        .select()
        .from(contentFeed)
        .where(eq(contentFeed.id, contentId))
        .limit(1);

      return content || null;
    } catch (error) {
      console.error('Error getting content by ID:', error);
      return null;
    }
  }

  async updateContent(contentId: number, updates: Partial<ContentFeed>): Promise<ContentFeed | null> {
    try {
      const [updated] = await db
        .update(contentFeed)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(contentFeed.id, contentId))
        .returning();

      return updated || null;
    } catch (error) {
      console.error('Error updating content:', error);
      throw error;
    }
  }

  async deleteContent(contentId: number): Promise<boolean> {
    try {
      await db
        .update(contentFeed)
        .set({ status: 'deleted', updatedAt: new Date() })
        .where(eq(contentFeed.id, contentId));

      return true;
    } catch (error) {
      console.error('Error deleting content:', error);
      return false;
    }
  }

  // === ANALYTICS & REPORTING ===

  async getContentStats(): Promise<ContentFeedStats> {
    try {
      const [statsResult] = await db
        .select({
          totalItems: sql<number>`count(*)`,
          activeItems: sql<number>`count(*) filter (where status = 'active')`,
          expiredItems: sql<number>`count(*) filter (where status = 'expired')`,
          avgQualityScore: sql<number>`avg(quality_score)`,
          totalViews: sql<number>`sum(views)`,
          totalClicks: sql<number>`sum(clicks)`,
          totalConversions: sql<number>`sum(conversions)`,
          avgCTR: sql<number>`avg(ctr)`,
          avgConversionRate: sql<number>`avg(conversion_rate)`
        })
        .from(contentFeed);

      const [sourcesResult] = await db
        .select({
          totalSources: sql<number>`count(*)`,
          activeSources: sql<number>`count(*) filter (where is_active = true)`,
          lastSyncAt: sql<Date>`max(last_sync_at)`
        })
        .from(contentFeedSources);

      return {
        totalItems: statsResult.totalItems || 0,
        activeItems: statsResult.activeItems || 0,
        expiredItems: statsResult.expiredItems || 0,
        totalSources: sourcesResult.totalSources || 0,
        activeSources: sourcesResult.activeSources || 0,
        lastSyncAt: sourcesResult.lastSyncAt,
        avgQualityScore: Number(statsResult.avgQualityScore) || 0,
        totalViews: statsResult.totalViews || 0,
        totalClicks: statsResult.totalClicks || 0,
        totalConversions: statsResult.totalConversions || 0,
        avgCTR: Number(statsResult.avgCTR) || 0,
        avgConversionRate: Number(statsResult.avgConversionRate) || 0
      };
    } catch (error) {
      console.error('Error getting content stats:', error);
      return {
        totalItems: 0,
        activeItems: 0,
        expiredItems: 0,
        totalSources: 0,
        activeSources: 0,
        lastSyncAt: null,
        avgQualityScore: 0,
        totalViews: 0,
        totalClicks: 0,
        totalConversions: 0,
        avgCTR: 0,
        avgConversionRate: 0
      };
    }
  }

  async trackInteraction(interaction: {
    contentId: number;
    sessionId?: string;
    userId?: string;
    interactionType: string;
    metadata?: any;
    revenue?: number;
  }): Promise<void> {
    try {
      // Record interaction
      await db.insert(contentFeedInteractions).values({
        contentId: interaction.contentId,
        sessionId: interaction.sessionId,
        userId: interaction.userId,
        interactionType: interaction.interactionType,
        metadata: interaction.metadata,
        revenue: interaction.revenue
      });

      // Update content statistics
      const updateData: any = {};
      
      switch (interaction.interactionType) {
        case 'view':
          updateData.views = sql`views + 1`;
          break;
        case 'click':
          updateData.clicks = sql`clicks + 1`;
          updateData.ctr = sql`CASE WHEN views > 0 THEN (clicks + 1)::decimal / views ELSE 0 END`;
          break;
        case 'convert':
          updateData.conversions = sql`conversions + 1`;
          updateData.conversionRate = sql`CASE WHEN clicks > 0 THEN (conversions + 1)::decimal / clicks ELSE 0 END`;
          break;
      }

      if (Object.keys(updateData).length > 0) {
        await db
          .update(contentFeed)
          .set({ ...updateData, updatedAt: new Date() })
          .where(eq(contentFeed.id, interaction.contentId));
      }

    } catch (error) {
      console.error('Error tracking interaction:', error);
      throw error;
    }
  }

  // === UTILITY METHODS ===

  private async scheduleNextSync(sourceId: number): Promise<void> {
    try {
      const [source] = await db
        .select()
        .from(contentFeedSources)
        .where(eq(contentFeedSources.id, sourceId))
        .limit(1);

      if (source && source.refreshInterval) {
        const nextSyncAt = new Date(Date.now() + source.refreshInterval * 1000);
        
        await db
          .update(contentFeedSources)
          .set({ nextSyncAt })
          .where(eq(contentFeedSources.id, sourceId));
      }
    } catch (error) {
      console.error('Error scheduling next sync:', error);
    }
  }

  private async cancelScheduledSync(sourceId: number): Promise<void> {
    try {
      await db
        .update(contentFeedSources)
        .set({ nextSyncAt: null })
        .where(eq(contentFeedSources.id, sourceId));
    } catch (error) {
      console.error('Error canceling scheduled sync:', error);
    }
  }

  private async removeExpiredContent(): Promise<number> {
    try {
      const result = await db
        .update(contentFeed)
        .set({ status: 'expired', updatedAt: new Date() })
        .where(
          and(
            eq(contentFeed.status, 'active'),
            sql`expires_at < NOW()`
          )
        );

      return result.rowCount || 0;
    } catch (error) {
      console.error('Error removing expired content:', error);
      return 0;
    }
  }

  private async applyContentRules(contentId: number, sourceId: number): Promise<void> {
    try {
      // Get applicable rules for this source
      const rules = await db
        .select()
        .from(contentFeedRules)
        .where(
          and(
            eq(contentFeedRules.sourceId, sourceId),
            eq(contentFeedRules.isActive, true)
          )
        )
        .orderBy(asc(contentFeedRules.priority));

      // Apply each rule
      for (const rule of rules) {
        // Rule application logic would go here
        // For now, just increment the applied count
        await db
          .update(contentFeedRules)
          .set({ appliedCount: sql`applied_count + 1` })
          .where(eq(contentFeedRules.id, rule.id));
      }
    } catch (error) {
      console.error('Error applying content rules:', error);
    }
  }
}