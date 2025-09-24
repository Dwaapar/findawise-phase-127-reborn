import { Router } from "express";
import { eq, desc, and, count, sql } from "drizzle-orm";
import { db } from "../db";
import { 
  offlineSyncQueue, 
  edgeAiModels, 
  deviceSyncState, 
  offlineAnalyticsBuffer, 
  offlineContentCache, 
  conflictResolutionLog,
  insertOfflineSyncQueueSchema,
  insertEdgeAiModelSchema,
  insertDeviceSyncStateSchema,
  insertOfflineAnalyticsBufferSchema,
  insertOfflineContentCacheSchema,
  insertConflictResolutionLogSchema
} from "../../shared/offlineAiTables";
import { offlineAiSyncEngine } from "../services/offline-ai/offlineAiSyncEngine";

const router = Router();

// ============================================================================
// OFFLINE AI SYNC ENGINE API ROUTES - BILLION-DOLLAR EMPIRE GRADE
// ============================================================================
// Complete REST API for offline-first architecture with AI personalization,
// content caching, deferred sync, conflict resolution, and edge AI capabilities

// Device Management Routes
router.post('/device/register', async (req, res) => {
  try {
    const deviceData = insertDeviceSyncStateSchema.parse(req.body);
    const deviceId = await offlineAiSyncEngine.registerDevice(deviceData);
    
    res.json({ 
      success: true, 
      data: { deviceId },
      message: "Device registered successfully"
    });
  } catch (error) {
    console.error('Device registration failed:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to register device',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/device/:deviceId/status', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const status = await offlineAiSyncEngine.getDeviceSyncStatus(deviceId);
    
    if (!status) {
      return res.status(404).json({ 
        success: false, 
        error: 'Device not found' 
      });
    }
    
    res.json({ 
      success: true, 
      data: status 
    });
  } catch (error) {
    console.error('Failed to get device status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get device status' 
    });
  }
});

router.put('/device/:deviceId/online-status', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { isOnline } = req.body;
    
    await db.update(deviceSyncState)
      .set({ 
        isOnline,
        lastOnlineAt: isOnline ? new Date() : undefined,
        updatedAt: new Date()
      })
      .where(eq(deviceSyncState.deviceId, deviceId));
    
    // Update global sync engine status
    offlineAiSyncEngine.setOnlineStatus(isOnline);
    
    res.json({ 
      success: true, 
      message: `Device marked as ${isOnline ? 'online' : 'offline'}` 
    });
  } catch (error) {
    console.error('Failed to update online status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update online status' 
    });
  }
});

// Event Queue Management Routes
router.post('/events/queue', async (req, res) => {
  try {
    const eventData = insertOfflineSyncQueueSchema.parse(req.body);
    const queueId = await offlineAiSyncEngine.queueEvent(eventData);
    
    res.json({ 
      success: true, 
      data: { queueId },
      message: "Event queued successfully"
    });
  } catch (error) {
    console.error('Event queueing failed:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to queue event' 
    });
  }
});

router.post('/events/sync/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    await offlineAiSyncEngine.syncPendingEvents(deviceId);
    
    res.json({ 
      success: true, 
      message: "Sync initiated for device"
    });
  } catch (error) {
    console.error('Sync initiation failed:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to initiate sync' 
    });
  }
});

router.get('/events/:deviceId/pending', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const pendingEvents = await db.select()
      .from(offlineSyncQueue)
      .where(
        and(
          eq(offlineSyncQueue.deviceId, deviceId),
          eq(offlineSyncQueue.syncStatus, "pending")
        )
      )
      .orderBy(desc(offlineSyncQueue.priority), offlineSyncQueue.clientTimestamp)
      .limit(Number(limit))
      .offset(Number(offset));
    
    const [totalCount] = await db.select({ count: count() })
      .from(offlineSyncQueue)
      .where(
        and(
          eq(offlineSyncQueue.deviceId, deviceId),
          eq(offlineSyncQueue.syncStatus, "pending")
        )
      );
    
    res.json({ 
      success: true, 
      data: {
        events: pendingEvents,
        total: totalCount.count,
        limit: Number(limit),
        offset: Number(offset)
      }
    });
  } catch (error) {
    console.error('Failed to get pending events:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get pending events' 
    });
  }
});

router.get('/events/:deviceId/history', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { limit = 100, status } = req.query;
    
    let query = db.select()
      .from(offlineSyncQueue)
      .where(eq(offlineSyncQueue.deviceId, deviceId));
    
    if (status) {
      query = query.where(
        and(
          eq(offlineSyncQueue.deviceId, deviceId),
          eq(offlineSyncQueue.syncStatus, status as string)
        )
      );
    }
    
    const events = await query
      .orderBy(desc(offlineSyncQueue.createdAt))
      .limit(Number(limit));
    
    res.json({ 
      success: true, 
      data: events 
    });
  } catch (error) {
    console.error('Failed to get event history:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get event history' 
    });
  }
});

// Edge AI Models Management Routes
router.get('/models', async (req, res) => {
  try {
    const { deviceCapability, runtime, isActive = true } = req.query;
    
    let query = db.select().from(edgeAiModels);
    
    if (deviceCapability || runtime || isActive !== undefined) {
      const conditions = [];
      if (deviceCapability) conditions.push(eq(edgeAiModels.deviceCapability, deviceCapability as string));
      if (runtime) conditions.push(eq(edgeAiModels.runtime, runtime as string));
      if (isActive !== undefined) conditions.push(eq(edgeAiModels.isActive, isActive === 'true'));
      
      query = query.where(and(...conditions));
    }
    
    const models = await query.orderBy(edgeAiModels.modelName);
    
    res.json({ 
      success: true, 
      data: models 
    });
  } catch (error) {
    console.error('Failed to get edge AI models:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get edge AI models' 
    });
  }
});

router.get('/models/:modelId', async (req, res) => {
  try {
    const { modelId } = req.params;
    
    const [model] = await db.select()
      .from(edgeAiModels)
      .where(eq(edgeAiModels.modelId, modelId))
      .limit(1);
    
    if (!model) {
      return res.status(404).json({ 
        success: false, 
        error: 'Model not found' 
      });
    }
    
    res.json({ 
      success: true, 
      data: model 
    });
  } catch (error) {
    console.error('Failed to get edge AI model:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get edge AI model' 
    });
  }
});

router.post('/models', async (req, res) => {
  try {
    const modelData = insertEdgeAiModelSchema.parse(req.body);
    
    const [newModel] = await db.insert(edgeAiModels)
      .values(modelData)
      .returning();
    
    res.status(201).json({ 
      success: true, 
      data: newModel,
      message: "Edge AI model created successfully"
    });
  } catch (error) {
    console.error('Model creation failed:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create edge AI model' 
    });
  }
});

router.put('/models/:modelId', async (req, res) => {
  try {
    const { modelId } = req.params;
    const updateData = req.body;
    
    const [updatedModel] = await db.update(edgeAiModels)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(edgeAiModels.modelId, modelId))
      .returning();
    
    if (!updatedModel) {
      return res.status(404).json({ 
        success: false, 
        error: 'Model not found' 
      });
    }
    
    res.json({ 
      success: true, 
      data: updatedModel,
      message: "Edge AI model updated successfully"
    });
  } catch (error) {
    console.error('Model update failed:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update edge AI model' 
    });
  }
});

// Content Cache Management Routes
router.post('/cache/content', async (req, res) => {
  try {
    const cacheData = insertOfflineContentCacheSchema.parse(req.body);
    const cacheId = await offlineAiSyncEngine.cacheContent(cacheData);
    
    res.status(201).json({ 
      success: true, 
      data: { cacheId },
      message: "Content cached successfully"
    });
  } catch (error) {
    console.error('Content caching failed:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to cache content' 
    });
  }
});

router.get('/cache/:deviceId/:contentType/:contentId', async (req, res) => {
  try {
    const { deviceId, contentType, contentId } = req.params;
    const cached = await offlineAiSyncEngine.getCachedContent(deviceId, contentType, contentId);
    
    if (!cached) {
      return res.status(404).json({ 
        success: false, 
        error: 'Cached content not found' 
      });
    }
    
    res.json({ 
      success: true, 
      data: cached 
    });
  } catch (error) {
    console.error('Failed to get cached content:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get cached content' 
    });
  }
});

router.get('/cache/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { contentType, limit = 50 } = req.query;
    
    let query = db.select()
      .from(offlineContentCache)
      .where(eq(offlineContentCache.deviceId, deviceId));
    
    if (contentType) {
      query = query.where(
        and(
          eq(offlineContentCache.deviceId, deviceId),
          eq(offlineContentCache.contentType, contentType as string)
        )
      );
    }
    
    const cachedContent = await query
      .orderBy(desc(offlineContentCache.lastAccessedAt))
      .limit(Number(limit));
    
    res.json({ 
      success: true, 
      data: cachedContent 
    });
  } catch (error) {
    console.error('Failed to get cached content list:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get cached content list' 
    });
  }
});

router.delete('/cache/:cacheId', async (req, res) => {
  try {
    const { cacheId } = req.params;
    
    await db.delete(offlineContentCache)
      .where(eq(offlineContentCache.cacheId, cacheId));
    
    res.json({ 
      success: true, 
      message: "Cached content deleted successfully"
    });
  } catch (error) {
    console.error('Failed to delete cached content:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete cached content' 
    });
  }
});

// Analytics Buffer Routes
router.post('/analytics/buffer', async (req, res) => {
  try {
    const analyticsData = insertOfflineAnalyticsBufferSchema.parse(req.body);
    
    const [bufferedEvent] = await db.insert(offlineAnalyticsBuffer)
      .values(analyticsData)
      .returning();
    
    res.status(201).json({ 
      success: true, 
      data: bufferedEvent,
      message: "Analytics event buffered successfully"
    });
  } catch (error) {
    console.error('Analytics buffering failed:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to buffer analytics event' 
    });
  }
});

router.post('/analytics/batch-sync/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { batchSize = 100 } = req.body;
    
    // Get pending analytics events
    const pendingEvents = await db.select()
      .from(offlineAnalyticsBuffer)
      .where(
        and(
          eq(offlineAnalyticsBuffer.deviceId, deviceId),
          eq(offlineAnalyticsBuffer.syncStatus, "pending")
        )
      )
      .limit(batchSize);
    
    if (pendingEvents.length === 0) {
      return res.json({ 
        success: true, 
        message: "No pending analytics events to sync",
        synced: 0 
      });
    }
    
    // Mark as synced (in a real implementation, you'd process them)
    const eventIds = pendingEvents.map(e => e.id);
    await db.update(offlineAnalyticsBuffer)
      .set({ 
        syncStatus: "synced",
        syncedAt: new Date()
      })
      .where(sql`${offlineAnalyticsBuffer.id} = ANY(${eventIds})`);
    
    res.json({ 
      success: true, 
      message: "Analytics events synced successfully",
      synced: pendingEvents.length 
    });
  } catch (error) {
    console.error('Analytics batch sync failed:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to sync analytics batch' 
    });
  }
});

// Conflict Resolution Routes
router.post('/conflicts/resolve', async (req, res) => {
  try {
    const conflictData = insertConflictResolutionLogSchema.parse(req.body);
    const mergedData = await offlineAiSyncEngine.resolveConflict(conflictData);
    
    res.json({ 
      success: true, 
      data: mergedData,
      message: "Conflict resolved successfully"
    });
  } catch (error) {
    console.error('Conflict resolution failed:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to resolve conflict' 
    });
  }
});

router.get('/conflicts/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { isResolved, limit = 50 } = req.query;
    
    let query = db.select()
      .from(conflictResolutionLog)
      .where(eq(conflictResolutionLog.deviceId, deviceId));
    
    if (isResolved !== undefined) {
      const resolved = isResolved === 'true';
      query = query.where(
        and(
          eq(conflictResolutionLog.deviceId, deviceId),
          resolved ? sql`${conflictResolutionLog.resolvedAt} IS NOT NULL` : sql`${conflictResolutionLog.resolvedAt} IS NULL`
        )
      );
    }
    
    const conflicts = await query
      .orderBy(desc(conflictResolutionLog.conflictDetectedAt))
      .limit(Number(limit));
    
    res.json({ 
      success: true, 
      data: conflicts 
    });
  } catch (error) {
    console.error('Failed to get conflicts:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get conflicts' 
    });
  }
});

// System Status and Management Routes
router.get('/status/overview', async (req, res) => {
  try {
    // Get comprehensive system status
    const [
      totalDevices,
      onlineDevices,
      pendingEvents,
      activeModels,
      cachedContent,
      unresolvedConflicts
    ] = await Promise.all([
      db.select({ count: count() }).from(deviceSyncState),
      db.select({ count: count() }).from(deviceSyncState).where(eq(deviceSyncState.isOnline, true)),
      db.select({ count: count() }).from(offlineSyncQueue).where(eq(offlineSyncQueue.syncStatus, "pending")),
      db.select({ count: count() }).from(edgeAiModels).where(eq(edgeAiModels.isActive, true)),
      db.select({ count: count() }).from(offlineContentCache),
      db.select({ count: count() }).from(conflictResolutionLog).where(sql`${conflictResolutionLog.resolvedAt} IS NULL`)
    ]);
    
    res.json({ 
      success: true, 
      data: {
        devices: {
          total: totalDevices[0].count,
          online: onlineDevices[0].count,
          offline: totalDevices[0].count - onlineDevices[0].count
        },
        sync: {
          pendingEvents: pendingEvents[0].count
        },
        ai: {
          activeModels: activeModels[0].count
        },
        cache: {
          cachedItems: cachedContent[0].count
        },
        conflicts: {
          unresolved: unresolvedConflicts[0].count
        }
      }
    });
  } catch (error) {
    console.error('Failed to get system overview:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get system overview' 
    });
  }
});

router.post('/maintenance/cleanup', async (req, res) => {
  try {
    await offlineAiSyncEngine.cleanupOldData();
    
    res.json({ 
      success: true, 
      message: "Cleanup completed successfully"
    });
  } catch (error) {
    console.error('Cleanup failed:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to perform cleanup' 
    });
  }
});

// Health check route
router.get('/health', async (req, res) => {
  try {
    // Simple health check
    const [deviceCount] = await db.select({ count: count() }).from(deviceSyncState);
    
    res.json({ 
      success: true, 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      data: {
        registeredDevices: deviceCount.count
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ 
      success: false, 
      status: 'unhealthy',
      error: 'Database connection failed' 
    });
  }
});

export default router;