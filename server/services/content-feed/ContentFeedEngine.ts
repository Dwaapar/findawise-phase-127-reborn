// Content & Offer Feed Engine - Core Service
import { EventEmitter } from 'events';
import cron from 'node-cron';
import { DatabaseStorage } from '../../storage';
import { ContentFeedSource, ContentFeed, InsertContentFeed, InsertContentFeedSyncLog } from '@shared/contentFeedTables';
import { logger } from '../../utils/logger';

export interface FeedConnector {
  sourceType: string;
  connect(): Promise<void>;
  fetchContent(source: ContentFeedSource, lastSync?: Date): Promise<any[]>;
  normalizeContent(rawData: any, source: ContentFeedSource): Partial<InsertContentFeed>;
  disconnect(): Promise<void>;
}

export class ContentFeedEngine extends EventEmitter {
  private storage: DatabaseStorage;
  private connectors: Map<string, FeedConnector> = new Map();
  private activeSyncs: Map<number, boolean> = new Map();
  private scheduledJobs: Map<number, cron.ScheduledTask> = new Map();

  constructor(storage: DatabaseStorage) {
    super();
    this.storage = storage;
    this.setupEventHandlers();
  }

  // Register a new feed connector
  registerConnector(connector: FeedConnector): void {
    this.connectors.set(connector.sourceType, connector);
    logger.info(`Registered content feed connector: ${connector.sourceType}`);
  }

  // Initialize and start all active sources
  async initialize(): Promise<void> {
    try {
      const sources = await this.storage.getActiveFeedSources();
      
      for (const source of sources) {
        await this.scheduleSync(source);
      }

      // Start cleanup job for expired content
      this.scheduleCleanup();
      
      logger.info(`Content Feed Engine initialized with ${sources.length} sources`);
    } catch (error) {
      logger.error('Failed to initialize Content Feed Engine:', error);
      throw error;
    }
  }

  // Manual sync trigger
  async syncSource(sourceId: number, syncType: 'manual' | 'scheduled' = 'manual'): Promise<void> {
    if (this.activeSyncs.get(sourceId)) {
      throw new Error(`Sync already in progress for source ${sourceId}`);
    }

    const source = await this.storage.getFeedSource(sourceId);
    if (!source) {
      throw new Error(`Feed source ${sourceId} not found`);
    }

    const connector = this.connectors.get(source.sourceType);
    if (!connector) {
      throw new Error(`No connector registered for source type: ${source.sourceType}`);
    }

    this.activeSyncs.set(sourceId, true);
    const startTime = Date.now();

    const syncLog: InsertContentFeedSyncLog = {
      sourceId,
      syncType,
      status: 'running',
      itemsProcessed: 0,
      itemsAdded: 0,
      itemsUpdated: 0,
      itemsRemoved: 0,
      duration: 0,
      startedAt: new Date(),
      errors: [],
      metadata: { startedAt: new Date().toISOString() }
    };

    try {
      await connector.connect();

      // Fetch latest content
      const rawContent = await connector.fetchContent(source, source.lastSyncAt || undefined);
      syncLog.itemsProcessed = rawContent.length;

      const results = {
        added: 0,
        updated: 0,
        removed: 0,
        errors: [] as any[]
      };

      // Process each piece of content
      for (const rawItem of rawContent) {
        try {
          const normalizedContent = connector.normalizeContent(rawItem, source);
          
          // Check if content already exists
          const existingContent = await this.storage.getContentByExternalId(
            source.id, 
            normalizedContent.externalId!
          );

          if (existingContent) {
            // Update existing content
            await this.storage.updateContent(existingContent.id, {
              ...normalizedContent,
              syncedAt: new Date()
            });
            results.updated++;
          } else {
            // Create new content
            const newContent = await this.storage.createContent({
              sourceId,
              ...normalizedContent,
              syncedAt: new Date()
            } as InsertContentFeed);
            results.added++;

            // Trigger AI enrichment for new content
            this.emit('contentAdded', newContent);
          }
        } catch (error) {
          results.errors.push({
            item: rawItem,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Remove expired content
      const expiredCount = await this.storage.removeExpiredContent(sourceId);
      results.removed = expiredCount;

      // Update sync log
      syncLog.status = results.errors.length === 0 ? 'success' : 'partial';
      syncLog.itemsAdded = results.added;
      syncLog.itemsUpdated = results.updated;
      syncLog.itemsRemoved = results.removed;
      syncLog.errors = results.errors;
      syncLog.duration = Date.now() - startTime;
      syncLog.completedAt = new Date();

      // Update source last sync time
      await this.storage.updateFeedSource(sourceId, {
        lastSyncAt: new Date(),
        nextSyncAt: this.calculateNextSync(source)
      });

      await connector.disconnect();

      logger.info(`Sync completed for source ${sourceId}:`, {
        added: results.added,
        updated: results.updated,
        removed: results.removed,
        errors: results.errors.length
      });

      this.emit('syncCompleted', { sourceId, results, syncLog });

    } catch (error) {
      syncLog.status = 'failed';
      syncLog.errors = [{ error: error instanceof Error ? error.message : 'Unknown error' }];
      syncLog.duration = Date.now() - startTime;
      syncLog.completedAt = new Date();
      
      logger.error(`Sync failed for source ${sourceId}:`, error);
      this.emit('syncFailed', { sourceId, error, syncLog });
    } finally {
      this.activeSyncs.delete(sourceId);
      await this.storage.createSyncLog(syncLog);
    }
  }

  // Schedule sync for a source
  private async scheduleSync(source: ContentFeedSource): Promise<void> {
    if (!source.isActive || !source.refreshInterval) return;

    // Calculate cron expression from refresh interval
    const intervalMinutes = Math.floor(source.refreshInterval / 60);
    const cronExpression = `*/${intervalMinutes} * * * *`;

    const task = cron.schedule(cronExpression, async () => {
      try {
        await this.syncSource(source.id, 'scheduled');
      } catch (error) {
        logger.error(`Scheduled sync failed for source ${source.id}:`, error);
      }
    }, { scheduled: false });

    this.scheduledJobs.set(source.id, task);
    task.start();

    logger.info(`Scheduled sync for source ${source.id} every ${intervalMinutes} minutes`);
  }

  // Calculate next sync time
  private calculateNextSync(source: ContentFeedSource): Date {
    const now = new Date();
    const nextSync = new Date(now.getTime() + (source.refreshInterval || 3600) * 1000);
    return nextSync;
  }

  // Schedule cleanup job for expired content
  private scheduleCleanup(): void {
    // Run cleanup every hour
    cron.schedule('0 * * * *', async () => {
      try {
        const result = await this.storage.cleanupExpiredContent();
        if (result.removed > 0) {
          logger.info(`Cleaned up ${result.removed} expired content items`);
        }
      } catch (error) {
        logger.error('Failed to cleanup expired content:', error);
      }
    });
  }

  // Setup event handlers
  private setupEventHandlers(): void {
    this.on('contentAdded', async (content: ContentFeed) => {
      // Trigger AI enrichment
      this.emit('enrichmentRequested', content);
    });

    this.on('syncCompleted', async ({ sourceId, results }) => {
      // Send notification for significant changes
      if (results.added > 10 || results.errors.length > 5) {
        await this.storage.createFeedNotification({
          sourceId,
          type: 'sync_summary',
          title: 'Content Sync Completed',
          message: `Added: ${results.added}, Updated: ${results.updated}, Errors: ${results.errors.length}`,
          data: results,
          createdAt: new Date()
        });
      }
    });
  }

  // Get engine status
  getStatus(): any {
    return {
      connectors: Array.from(this.connectors.keys()),
      activeSyncs: Array.from(this.activeSyncs.keys()),
      scheduledJobs: this.scheduledJobs.size,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    };
  }

  // Stop all scheduled jobs
  async shutdown(): Promise<void> {
    for (const [sourceId, task] of this.scheduledJobs) {
      task.stop();
      logger.info(`Stopped scheduled sync for source ${sourceId}`);
    }
    this.scheduledJobs.clear();
    
    // Wait for active syncs to complete
    while (this.activeSyncs.size > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    logger.info('Content Feed Engine shutdown completed');
  }

  // AI Content Enrichment
  async enrichContent(contentId: number): Promise<void> {
    try {
      const content = await this.storage.getContent(contentId);
      if (!content || content.aiEnriched) {
        return;
      }

      // Generate AI enhancements (stub for now - would integrate with AI service)
      const enhancements = {
        seoTitle: this.generateSEOTitle(content.title),
        metaDescription: this.generateMetaDescription(content.description || ''),
        tags: this.extractTags(content.title + ' ' + (content.description || '')),
        qualityFlags: this.assessQuality(content)
      };
      
      // Update content with AI enhancements
      await this.storage.updateContent(contentId, {
        aiEnriched: true,
        aiGeneratedContent: enhancements,
        qualityScore: this.calculateQualityScore(content)
      });

      logger.info(`AI enrichment completed for content ${contentId}`);
      this.emit('contentEnriched', { contentId, enhancements });

    } catch (error) {
      logger.error(`AI enrichment failed for content ${contentId}:`, error);
    }
  }

  // Generate SEO-optimized title
  private generateSEOTitle(originalTitle: string): string {
    // Basic SEO title optimization
    return originalTitle.length > 60 ? originalTitle.substring(0, 57) + '...' : originalTitle;
  }

  // Generate meta description
  private generateMetaDescription(content: string): string {
    const cleaned = content.replace(/<[^>]*>/g, '').trim();
    return cleaned.length > 160 ? cleaned.substring(0, 157) + '...' : cleaned;
  }

  // Extract relevant tags
  private extractTags(text: string): string[] {
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    const words = text.toLowerCase().split(/\W+/).filter(word => 
      word.length > 3 && !commonWords.has(word)
    );
    return [...new Set(words)].slice(0, 10);
  }

  // Assess content quality
  private assessQuality(content: any): string[] {
    const flags = [];
    
    if (!content.description || content.description.length < 50) {
      flags.push('short_description');
    }
    
    if (!content.imageUrl) {
      flags.push('no_image');
    }
    
    if (content.price && content.price <= 0) {
      flags.push('invalid_price');
    }
    
    return flags;
  }

  // Calculate quality score (0-100)
  private calculateQualityScore(content: any): number {
    let score = 50; // Base score
    
    // Title quality
    if (content.title && content.title.length > 20) score += 10;
    
    // Description quality
    if (content.description && content.description.length > 100) score += 15;
    
    // Image presence
    if (content.imageUrl) score += 10;
    
    // Price data
    if (content.price && content.price > 0) score += 10;
    
    // Merchant info
    if (content.merchantName) score += 5;
    
    return Math.min(100, Math.max(0, score));
  }

  // Schedule sync for a source
  private async scheduleSync(source: ContentFeedSource): Promise<void> {
    // Cancel existing job if any
    const existingJob = this.scheduledJobs.get(source.id);
    if (existingJob) {
      existingJob.destroy();
    }

    if (!source.isActive || !source.refreshInterval) {
      return;
    }

    // Convert refresh interval to cron expression
    const cronExpression = this.intervalToCron(source.refreshInterval);
    
    const job = cron.schedule(cronExpression, async () => {
      try {
        await this.syncSource(source.id, 'scheduled');
      } catch (error) {
        logger.error(`Scheduled sync failed for source ${source.id}:`, error);
      }
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    this.scheduledJobs.set(source.id, job);
    logger.info(`Scheduled sync for source ${source.id} with interval ${source.refreshInterval}s`);
  }

  // Convert seconds to cron expression
  private intervalToCron(seconds: number): string {
    if (seconds < 60) {
      // Every X seconds (minimum 5 seconds for cron)
      return `*/${Math.max(5, seconds)} * * * * *`;
    } else if (seconds < 3600) {
      // Every X minutes
      const minutes = Math.floor(seconds / 60);
      return `0 */${minutes} * * * *`;
    } else if (seconds < 86400) {
      // Every X hours
      const hours = Math.floor(seconds / 3600);
      return `0 0 */${hours} * * *`;
    } else {
      // Daily
      return '0 0 0 * * *';
    }
  }

  // Calculate next sync time
  private calculateNextSync(source: ContentFeedSource): Date {
    const now = new Date();
    return new Date(now.getTime() + (source.refreshInterval! * 1000));
  }

  // Schedule cleanup of expired content
  private scheduleCleanup(): void {
    // Run cleanup every hour
    cron.schedule('0 0 * * * *', async () => {
      try {
        const cleanupResults = await this.storage.cleanupExpiredContent();
        if (cleanupResults.removed > 0) {
          logger.info(`Cleanup removed ${cleanupResults.removed} expired content items`);
          this.emit('contentCleaned', cleanupResults);
        }
      } catch (error) {
        logger.error('Content cleanup failed:', error);
      }
    });
  }

  // AI Content Enrichment
  async enrichContent(contentId: number): Promise<void> {
    try {
      const content = await this.storage.getContent(contentId);
      if (!content || content.aiEnriched) {
        return;
      }

      // Generate AI enhancements
      const enhancements = await this.generateAIEnhancements(content);
      
      // Update content with AI enhancements
      await this.storage.updateContent(contentId, {
        aiEnriched: true,
        aiGeneratedContent: enhancements,
        qualityScore: this.calculateQualityScore(content, enhancements)
      });

      logger.info(`AI enrichment completed for content ${contentId}`);
      this.emit('contentEnriched', { contentId, enhancements });

    } catch (error) {
      logger.error(`AI enrichment failed for content ${contentId}:`, error);
    }
  }

  // Generate AI enhancements for content
  private async generateAIEnhancements(content: ContentFeed): Promise<any> {
    // This would integrate with OpenAI/Claude for content enhancement
    // For now, return structured enhancement data
    return {
      seoMeta: {
        title: content.title,
        description: content.description || `${content.title} - Premium ${content.category} content`,
        keywords: content.tags || []
      },
      enhancedDescription: content.description,
      faqs: [],
      comparisonBullets: [],
      generatedAt: new Date().toISOString()
    };
  }

  // Calculate content quality score
  private calculateQualityScore(content: ContentFeed, enhancements: any): number {
    let score = 50; // Base score

    // Content completeness
    if (content.title) score += 10;
    if (content.description && content.description.length > 100) score += 10;
    if (content.imageUrl) score += 5;
    if (content.price) score += 5;
    if (content.rating && content.rating > 4) score += 10;

    // AI enhancements
    if (enhancements.enhancedDescription) score += 5;
    if (enhancements.faqs && enhancements.faqs.length > 0) score += 5;

    return Math.min(100, score);
  }

  // Apply content rules
  async applyRules(contentId: number): Promise<void> {
    const content = await this.storage.getContent(contentId);
    if (!content) return;

    const rules = await this.storage.getActiveRulesForSource(content.sourceId!);

    for (const rule of rules) {
      if (this.evaluateRuleConditions(rule.conditions, content)) {
        await this.executeRuleActions(rule.actions, content);
        await this.storage.incrementRuleApplication(rule.id);
      }
    }
  }

  // Evaluate rule conditions
  private evaluateRuleConditions(conditions: any, content: ContentFeed): boolean {
    // Simple rule evaluation logic
    // This can be expanded to support complex conditions
    return true;
  }

  // Execute rule actions
  private executeRuleActions(actions: any, content: ContentFeed): Promise<void> {
    // Execute rule actions like flagging, prioritizing, etc.
    return Promise.resolve();
  }

  // Setup event handlers
  private setupEventHandlers(): void {
    this.on('contentAdded', async (content: ContentFeed) => {
      // Auto-enrich new content
      setTimeout(() => this.enrichContent(content.id), 1000);
      
      // Apply rules
      setTimeout(() => this.applyRules(content.id), 2000);
    });

    this.on('syncCompleted', async ({ sourceId, results }) => {
      // Send notifications for significant changes
      if (results.added > 0 || results.updated > 10) {
        await this.storage.createFeedNotification({
          sourceId,
          notificationType: 'sync_completed',
          title: 'Content Sync Completed',
          message: `Added ${results.added}, updated ${results.updated} items`,
          severity: 'info',
          metadata: results
        });
      }
    });
  }

  // Get engine status
  getStatus(): any {
    return {
      connectors: Array.from(this.connectors.keys()),
      activeSyncs: Array.from(this.activeSyncs.keys()),
      scheduledJobs: this.scheduledJobs.size,
      uptime: process.uptime()
    };
  }

  // Shutdown engine
  async shutdown(): Promise<void> {
    // Cancel all scheduled jobs
    for (const job of this.scheduledJobs.values()) {
      job.destroy();
    }
    this.scheduledJobs.clear();

    // Disconnect all connectors
    for (const connector of this.connectors.values()) {
      try {
        await connector.disconnect();
      } catch (error) {
        logger.error('Error disconnecting connector:', error);
      }
    }

    logger.info('Content Feed Engine shut down');
  }
}