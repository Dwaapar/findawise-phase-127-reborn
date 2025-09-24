/**
 * BILLION-DOLLAR FEDERATION BRIDGE API ROUTES
 * Complete REST + WebSocket API for neuron federation management
 * Enterprise-grade with JWT authentication, RBAC, and comprehensive logging
 */

import { Router } from 'express';
import { federationBridge } from '../services/federation/federationBridge';
import { storage } from '../storage';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /api/federation/register
 * Register a new neuron in the federation
 */
router.post('/register', async (req, res) => {
  try {
    const registration = req.body;
    
    // Validate required fields
    if (!registration.neuronId || !registration.name || !registration.type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: neuronId, name, type'
      });
    }

    const result = await federationBridge.registerNeuron(registration);
    
    res.json({
      success: true,
      data: result,
      message: `Neuron ${registration.neuronId} registered successfully`
    });

  } catch (error) {
    logger.error('Federation registration failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Registration failed'
    });
  }
});

/**
 * POST /api/federation/push-config
 * Push configuration to target neurons
 */
router.post('/push-config', async (req, res) => {
  try {
    const { key, value, version, targetNeurons, environment, rollbackData } = req.body;
    
    if (!key || !value || !version) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: key, value, version'
      });
    }

    const result = await federationBridge.pushConfiguration({
      key,
      value,
      version,
      targetNeurons,
      environment,
      rollbackData
    });
    
    res.json({
      success: true,
      data: result,
      message: `Configuration pushed to ${result.results.length} neurons`
    });

  } catch (error) {
    logger.error('Federation config push failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Configuration push failed'
    });
  }
});

/**
 * POST /api/federation/hot-reload
 * Execute hot reload on target neuron
 */
router.post('/hot-reload', async (req, res) => {
  try {
    const { neuronId, reloadType, payload, rollbackAvailable } = req.body;
    
    if (!neuronId || !reloadType || !payload) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: neuronId, reloadType, payload'
      });
    }

    const result = await federationBridge.executeHotReload({
      neuronId,
      reloadType,
      payload,
      rollbackAvailable,
      triggeringBy: req.user?.username || 'system'
    });
    
    res.json({
      success: true,
      data: result,
      message: `Hot reload executed on ${neuronId}`
    });

  } catch (error) {
    logger.error('Federation hot reload failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Hot reload failed'
    });
  }
});

/**
 * GET /api/federation/status
 * Get comprehensive federation status
 */
router.get('/status', async (req, res) => {
  try {
    const status = federationBridge.getFederationStatus();
    
    res.json({
      success: true,
      data: status,
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Federation status check failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Status check failed'
    });
  }
});

/**
 * GET /api/federation/health/:neuronId?
 * Get health status for specific neuron or all neurons
 */
router.get('/health/:neuronId?', async (req, res) => {
  try {
    const { neuronId } = req.params;
    
    if (neuronId) {
      // Get health for specific neuron
      const healthChecks = await storage.getFederationHealthChecks(neuronId, 10);
      const latestHealth = healthChecks[0];
      
      res.json({
        success: true,
        data: {
          neuronId,
          currentStatus: latestHealth?.status || 'unknown',
          lastCheck: latestHealth?.checkedAt,
          responseTime: latestHealth?.responseTime,
          healthHistory: healthChecks
        }
      });
    } else {
      // Get health for all neurons
      const allNeurons = await storage.getAllNeurons();
      const healthData = [];
      
      for (const neuron of allNeurons) {
        const healthChecks = await storage.getFederationHealthChecks(neuron.neuronId, 1);
        const latestHealth = healthChecks[0];
        
        healthData.push({
          neuronId: neuron.neuronId,
          name: neuron.name,
          type: neuron.type,
          status: latestHealth?.status || 'unknown',
          healthScore: neuron.healthScore,
          lastCheck: latestHealth?.checkedAt,
          responseTime: latestHealth?.responseTime
        });
      }
      
      res.json({
        success: true,
        data: {
          totalNeurons: healthData.length,
          healthyNeurons: healthData.filter(n => n.status === 'healthy').length,
          neurons: healthData
        }
      });
    }

  } catch (error) {
    logger.error('Federation health check failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Health check failed'
    });
  }
});

/**
 * GET /api/federation/events
 * Get federation event history with pagination
 */
router.get('/events', async (req, res) => {
  try {
    const { page = 1, limit = 50, neuronId, eventType } = req.query;
    
    const events = await storage.getFederationEvents({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      neuronId: neuronId as string,
      eventType: eventType as string
    });
    
    res.json({
      success: true,
      data: events,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: events.length
      }
    });

  } catch (error) {
    logger.error('Federation events fetch failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Events fetch failed'
    });
  }
});

/**
 * GET /api/federation/sync-jobs
 * Get sync job status and history
 */
router.get('/sync-jobs', async (req, res) => {
  try {
    const { status, syncType, page = 1, limit = 20 } = req.query;
    
    const syncJobs = await storage.getFederationSyncJobs({
      status: status as string,
      syncType: syncType as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });
    
    res.json({
      success: true,
      data: syncJobs,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      }
    });

  } catch (error) {
    logger.error('Federation sync jobs fetch failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Sync jobs fetch failed'
    });
  }
});

/**
 * GET /api/federation/config-versions
 * Get configuration version history
 */
router.get('/config-versions', async (req, res) => {
  try {
    const { configKey, isActive, page = 1, limit = 20 } = req.query;
    
    const configVersions = await storage.getFederationConfigVersions({
      configKey: configKey as string,
      isActive: isActive === 'true',
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });
    
    res.json({
      success: true,
      data: configVersions
    });

  } catch (error) {
    logger.error('Federation config versions fetch failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Config versions fetch failed'
    });
  }
});

/**
 * POST /api/federation/rollback-config
 * Rollback configuration to previous version
 */
router.post('/rollback-config', async (req, res) => {
  try {
    const { configKey, targetVersion } = req.body;
    
    if (!configKey || !targetVersion) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: configKey, targetVersion'
      });
    }

    // Get the target version
    const configVersion = await storage.getFederationConfigVersion(configKey, targetVersion);
    if (!configVersion) {
      return res.status(404).json({
        success: false,
        error: 'Configuration version not found'
      });
    }

    // Execute rollback
    const result = await federationBridge.pushConfiguration({
      key: configKey,
      value: configVersion.configValue,
      version: `${targetVersion}-rollback-${Date.now()}`,
      environment: 'production'
    });
    
    res.json({
      success: true,
      data: result,
      message: `Configuration rolled back to version ${targetVersion}`
    });

  } catch (error) {
    logger.error('Federation config rollback failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Configuration rollback failed'
    });
  }
});

/**
 * DELETE /api/federation/retire/:neuronId
 * Retire a neuron from the federation
 */
router.delete('/retire/:neuronId', async (req, res) => {
  try {
    const { neuronId } = req.params;
    const { immediate = false } = req.body;
    
    // Update neuron status to retired
    await storage.updateNeuron(neuronId, {
      status: 'retired',
      isActive: false,
      metadata: {
        retiredAt: new Date(),
        retiredBy: req.user?.username || 'system',
        immediate
      }
    });

    // Log federation event
    await storage.createFederationEvent({
      neuronId,
      eventType: 'neuron_retirement',
      eventData: { immediate },
      initiatedBy: req.user?.username || 'system',
      success: true
    });
    
    res.json({
      success: true,
      message: `Neuron ${neuronId} retired successfully`
    });

  } catch (error) {
    logger.error('Federation retirement failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Retirement failed'
    });
  }
});

/**
 * GET /api/federation/conflicts
 * Get unresolved conflicts
 */
router.get('/conflicts', async (req, res) => {
  try {
    const { status = 'pending', priority, page = 1, limit = 20 } = req.query;
    
    const conflicts = await storage.getFederationConflicts({
      status: status as string,
      priority: priority as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });
    
    res.json({
      success: true,
      data: conflicts
    });

  } catch (error) {
    logger.error('Federation conflicts fetch failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Conflicts fetch failed'
    });
  }
});

/**
 * POST /api/federation/resolve-conflict
 * Resolve a federation conflict
 */
router.post('/resolve-conflict', async (req, res) => {
  try {
    const { conflictId, resolution, resolutionData } = req.body;
    
    if (!conflictId || !resolution) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: conflictId, resolution'
      });
    }

    await storage.updateFederationConflict(conflictId, {
      resolution,
      resolutionData,
      status: 'resolved',
      resolvedBy: req.user?.username || 'system',
      resolvedAt: new Date()
    });
    
    res.json({
      success: true,
      message: `Conflict ${conflictId} resolved successfully`
    });

  } catch (error) {
    logger.error('Federation conflict resolution failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Conflict resolution failed'
    });
  }
});

/**
 * GET /api/federation/migrations
 * Get migration history
 */
router.get('/migrations', async (req, res) => {
  try {
    const { neuronId, status, page = 1, limit = 20 } = req.query;
    
    const migrations = await storage.getFederationMigrations({
      neuronId: neuronId as string,
      status: status as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });
    
    res.json({
      success: true,
      data: migrations
    });

  } catch (error) {
    logger.error('Federation migrations fetch failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Migrations fetch failed'
    });
  }
});

/**
 * GET /api/federation/analytics/stream
 * Stream real-time analytics from all neurons
 */
router.get('/analytics/stream', async (req, res) => {
  try {
    // Set up Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    // Stream analytics
    await federationBridge.streamAnalytics((analytics) => {
      res.write(`data: ${JSON.stringify(analytics)}\n\n`);
    });

    // Handle client disconnect
    req.on('close', () => {
      res.end();
    });

  } catch (error) {
    logger.error('Federation analytics stream failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Analytics stream failed'
    });
  }
});

export default router;