// Content Feed API Routes - REST endpoints for content feed management
import express from 'express';
import { ContentFeedCore } from '../services/content-feed/contentFeedCore';
import { ContentFeedScheduler } from '../services/content-feed/contentFeedScheduler';
import { ContentEnrichmentEngine } from '../services/content-feed/contentEnrichmentEngine';
import { ContentFeedConnectorManager } from '../services/content-feed/connectors/connectorManager';
import { ContentFeedNotificationEngine } from '../services/content-feed/contentFeedNotificationEngine';
import { 
  insertContentFeedSourceSchema,
  insertContentFeedSchema,
  insertContentFeedCategorySchema 
} from '../../shared/contentFeedTables';

const router = express.Router();

// Initialize services
const contentFeedCore = new ContentFeedCore();
const scheduler = new ContentFeedScheduler();
const enrichmentEngine = new ContentEnrichmentEngine();
const connectorManager = new ContentFeedConnectorManager();

// Initialize content feed engine with storage
import { storage } from '../storage';
import { ContentFeedEngine } from '../services/content-feed/ContentFeedEngine';
import { AmazonPAConnector } from '../services/content-feed/connectors/amazonPAConnector';
import { CJAffiliateConnector } from '../services/content-feed/connectors/cjAffiliateConnector';
import { RSSConnector } from '../services/content-feed/connectors/rssConnector';

const feedEngine = new ContentFeedEngine(storage);

// Register connectors
const amazonConnector = new AmazonPAConnector();
const cjConnector = new CJAffiliateConnector();
const rssConnector = new RSSConnector();

feedEngine.registerConnector(amazonConnector);
feedEngine.registerConnector(cjConnector);
feedEngine.registerConnector(rssConnector);

// Initialize the engine
feedEngine.initialize().catch(console.error);
const notificationEngine = new ContentFeedNotificationEngine();

// === CONTENT FEED SOURCES ===

// Get all content sources
router.get('/sources', async (req, res) => {
  try {
    const activeOnly = req.query.active === 'true';
    const sources = await contentFeedCore.getSources(activeOnly);
    
    res.json({
      success: true,
      data: sources,
      count: sources.length
    });
  } catch (error) {
    console.error('Error getting content sources:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get content sources'
    });
  }
});

// Create new content source
router.post('/sources', async (req, res) => {
  try {
    const validatedData = insertContentFeedSourceSchema.parse(req.body);
    const source = await contentFeedCore.createSource(validatedData);
    
    // Schedule the source if it's active
    if (source.isActive && source.refreshInterval) {
      await scheduler.scheduleSource(source.id);
    }
    
    res.status(201).json({
      success: true,
      data: source
    });
  } catch (error) {
    console.error('Error creating content source:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create content source'
    });
  }
});

// Update content source
router.put('/sources/:id', async (req, res) => {
  try {
    const sourceId = parseInt(req.params.id);
    const updates = req.body;
    
    const updatedSource = await contentFeedCore.updateSource(sourceId, updates);
    
    if (!updatedSource) {
      return res.status(404).json({
        success: false,
        error: 'Content source not found'
      });
    }
    
    // Update scheduling if needed
    await scheduler.updateSourceSchedule(sourceId);
    
    res.json({
      success: true,
      data: updatedSource
    });
  } catch (error) {
    console.error('Error updating content source:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update content source'
    });
  }
});

// Delete content source
router.delete('/sources/:id', async (req, res) => {
  try {
    const sourceId = parseInt(req.params.id);
    
    // Unschedule the source
    await scheduler.unscheduleSource(sourceId);
    
    const success = await contentFeedCore.deleteSource(sourceId);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Content source not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Content source deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting content source:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete content source'
    });
  }
});

// Test content source connection
router.post('/sources/:id/test', async (req, res) => {
  try {
    const sourceId = parseInt(req.params.id);
    const sources = await contentFeedCore.getSources();
    const source = sources.find(s => s.id === sourceId);
    
    if (!source) {
      return res.status(404).json({
        success: false,
        error: 'Content source not found'
      });
    }
    
    const testResult = await connectorManager.testConnector(source.sourceType, source);
    
    res.json({
      success: true,
      data: testResult
    });
  } catch (error) {
    console.error('Error testing content source:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test content source'
    });
  }
});

// === CONTENT SYNCHRONIZATION ===

// Manual sync trigger
router.post('/sync', async (req, res) => {
  try {
    const { sourceId, syncType = 'manual', maxItems } = req.body;
    
    const syncResult = await contentFeedCore.syncContent({
      sourceId,
      syncType,
      maxItems
    });
    
    res.json({
      success: true,
      data: syncResult
    });
  } catch (error) {
    console.error('Error syncing content:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync content'
    });
  }
});

// Get sync logs
router.get('/sync/logs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const sourceId = req.query.sourceId ? parseInt(req.query.sourceId as string) : undefined;
    
    const logs = await storage.getSyncLogs(sourceId, limit);
    
    res.json({
      success: true,
      data: logs,
      count: logs.length
    });
  } catch (error) {
    console.error('Error getting sync logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sync logs'
    });
  }
});

// Manual sync trigger
router.post('/sync/:sourceId', async (req, res) => {
  try {
    const sourceId = parseInt(req.params.sourceId);
    const { syncType = 'manual' } = req.body;
    
    // Trigger manual sync
    await feedEngine.syncSource(sourceId, syncType);
    
    res.json({
      success: true,
      message: `Sync initiated for source ${sourceId}`
    });
  } catch (error) {
    console.error('Error triggering sync:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to trigger sync'
    });
  }
});

// Get engine status
router.get('/status', async (req, res) => {
  try {
    const status = feedEngine.getStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting engine status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get engine status'
    });
  }
});

// === CONTENT MANAGEMENT ===

// Get content items
router.get('/content', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const filter = {
      categories: req.query.categories ? (req.query.categories as string).split(',') : undefined,
      contentTypes: req.query.contentTypes ? (req.query.contentTypes as string).split(',') : undefined,
      status: req.query.status ? (req.query.status as string).split(',') : undefined,
      qualityScoreMin: req.query.qualityScoreMin ? parseFloat(req.query.qualityScoreMin as string) : undefined,
      searchQuery: req.query.search as string
    };
    
    const content = await contentFeedCore.getContent(filter, limit, offset);
    
    res.json({
      success: true,
      data: content,
      count: content.length,
      pagination: { limit, offset }
    });
  } catch (error) {
    console.error('Error getting content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get content'
    });
  }
});

// Get single content item
router.get('/content/:id', async (req, res) => {
  try {
    const contentId = parseInt(req.params.id);
    const content = await contentFeedCore.getContentById(contentId);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }
    
    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Error getting content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get content'
    });
  }
});

// Update content item
router.put('/content/:id', async (req, res) => {
  try {
    const contentId = parseInt(req.params.id);
    const updates = req.body;
    
    const updatedContent = await contentFeedCore.updateContent(contentId, updates);
    
    if (!updatedContent) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }
    
    res.json({
      success: true,
      data: updatedContent
    });
  } catch (error) {
    console.error('Error updating content:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update content'
    });
  }
});

// Delete content item
router.delete('/content/:id', async (req, res) => {
  try {
    const contentId = parseInt(req.params.id);
    const success = await contentFeedCore.deleteContent(contentId);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Content deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete content'
    });
  }
});

// === CONTENT ENRICHMENT ===

// Enrich single content item
router.post('/content/:id/enrich', async (req, res) => {
  try {
    const contentId = parseInt(req.params.id);
    const enrichmentResult = await enrichmentEngine.enrichContent(contentId);
    
    if (!enrichmentResult) {
      return res.status(404).json({
        success: false,
        error: 'Content not found or enrichment failed'
      });
    }
    
    res.json({
      success: true,
      data: enrichmentResult
    });
  } catch (error) {
    console.error('Error enriching content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to enrich content'
    });
  }
});

// Batch enrich content
router.post('/content/enrich/batch', async (req, res) => {
  try {
    const { contentIds } = req.body;
    
    if (!Array.isArray(contentIds)) {
      return res.status(400).json({
        success: false,
        error: 'contentIds must be an array'
      });
    }
    
    const result = await enrichmentEngine.batchEnrichContent(contentIds);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error batch enriching content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to batch enrich content'
    });
  }
});

// Get quality report
router.get('/content/quality/report', async (req, res) => {
  try {
    const contentIds = req.query.contentIds 
      ? (req.query.contentIds as string).split(',').map(id => parseInt(id))
      : undefined;
    
    const report = await enrichmentEngine.getQualityReport(contentIds);
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error getting quality report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get quality report'
    });
  }
});

// === ANALYTICS & TRACKING ===

// Get content statistics
router.get('/analytics/stats', async (req, res) => {
  try {
    const stats = await contentFeedCore.getContentStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting content stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get content stats'
    });
  }
});

// Track content interaction
router.post('/analytics/interaction', async (req, res) => {
  try {
    const { contentId, sessionId, userId, interactionType, metadata, revenue } = req.body;
    
    await contentFeedCore.trackInteraction({
      contentId,
      sessionId,
      userId,
      interactionType,
      metadata,
      revenue
    });
    
    res.json({
      success: true,
      message: 'Interaction tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking interaction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track interaction'
    });
  }
});

// === SCHEDULING ===

// Get scheduler status
router.get('/scheduler/status', async (req, res) => {
  try {
    const stats = scheduler.getSchedulerStats();
    const jobs = scheduler.getScheduledJobs();
    
    res.json({
      success: true,
      data: {
        stats,
        jobs
      }
    });
  } catch (error) {
    console.error('Error getting scheduler status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get scheduler status'
    });
  }
});

// Pause/resume source sync
router.post('/scheduler/sources/:id/:action', async (req, res) => {
  try {
    const sourceId = parseInt(req.params.id);
    const action = req.params.action;
    
    let success = false;
    
    if (action === 'pause') {
      success = await scheduler.pauseSource(sourceId);
    } else if (action === 'resume') {
      success = await scheduler.resumeSource(sourceId);
    } else if (action === 'trigger') {
      success = await scheduler.triggerManualSync(sourceId);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid action. Use: pause, resume, or trigger'
      });
    }
    
    res.json({
      success,
      message: `Source ${action} ${success ? 'successful' : 'failed'}`
    });
  } catch (error) {
    console.error(`Error ${req.params.action} source:`, error);
    res.status(500).json({
      success: false,
      error: `Failed to ${req.params.action} source`
    });
  }
});

// === NOTIFICATIONS ===

// Get notifications
router.get('/notifications', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const isRead = req.query.isRead === 'true' ? true : req.query.isRead === 'false' ? false : undefined;
    
    const filter = {
      isRead,
      severity: req.query.severity ? (req.query.severity as string).split(',') : undefined,
      notificationType: req.query.type ? (req.query.type as string).split(',') : undefined
    };
    
    const notifications = await notificationEngine.getNotifications(filter, limit);
    
    res.json({
      success: true,
      data: notifications,
      count: notifications.length
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notifications'
    });
  }
});

// Mark notification as read
router.put('/notifications/:id/read', async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    const success = await notificationEngine.markAsRead(notificationId);
    
    res.json({
      success,
      message: success ? 'Notification marked as read' : 'Failed to mark notification as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read'
    });
  }
});

// Mark all notifications as read
router.put('/notifications/read-all', async (req, res) => {
  try {
    const count = await notificationEngine.markAllAsRead();
    
    res.json({
      success: true,
      data: { markedCount: count },
      message: `${count} notifications marked as read`
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read'
    });
  }
});

// Get notification counts
router.get('/notifications/counts', async (req, res) => {
  try {
    const counts = await notificationEngine.getNotificationCounts();
    
    res.json({
      success: true,
      data: counts
    });
  } catch (error) {
    console.error('Error getting notification counts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notification counts'
    });
  }
});

// === CONNECTORS ===

// Get available connectors
router.get('/connectors', async (req, res) => {
  try {
    const availableConnectors = connectorManager.getAvailableConnectors();
    const stats = await connectorManager.getConnectorStats();
    
    res.json({
      success: true,
      data: {
        availableConnectors,
        stats
      }
    });
  } catch (error) {
    console.error('Error getting connectors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get connectors'
    });
  }
});

export default router;