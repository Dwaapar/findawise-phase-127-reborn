import express from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { centralConfigEngine } from '../services/config/centralConfigEngine';
// import { requireAuth, requireRole } from '../middleware/auth';
// import { validateRequest } from '../middleware/validation';
import { 
  ConfigSchema, 
  PageConfigSchema, 
  EmotionConfigSchema, 
  ModuleConfigSchema, 
  GlobalConfigSchema, 
  AiConfigSchema 
} from '../types/configTypes';

const router = express.Router();

// ==========================================
// RATE LIMITING & MIDDLEWARE
// ==========================================

const configRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many configuration requests from this IP, please try again later.'
  }
});

const writeRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // Limit each IP to 20 write requests per windowMs
  message: {
    error: 'Too many write requests from this IP, please try again later.'
  }
});

// Apply rate limiting to all config routes
router.use(configRateLimit);

// Basic auth middleware (simplified for now)
const requireAuth = (req: any, res: any, next: any) => {
  // For now, just mock auth - implement proper JWT later
  req.user = { id: 'admin', username: 'admin', role: 'admin' };
  next();
};

const requireRole = (roles: string[]) => (req: any, res: any, next: any) => {
  // For now, allow all - implement proper RBAC later
  next();
};

const validateRequest = (schema: any) => (req: any, res: any, next: any) => {
  try {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query
    });
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: result.error.errors
      });
    }
    
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Validation error'
    });
  }
};

// Validation schemas for requests
const createConfigSchema = z.object({
  body: ConfigSchema
});

const updateConfigSchema = z.object({
  params: z.object({
    configId: z.string().min(1)
  }),
  body: z.record(z.any()).optional()
});

const searchConfigSchema = z.object({
  query: z.object({
    vertical: z.string().optional(),
    locale: z.string().optional(),
    category: z.string().optional(),
    tags: z.string().optional(), // comma-separated
    isActive: z.string().transform(val => val === 'true').optional(),
    deprecated: z.string().transform(val => val === 'true').optional(),
    limit: z.string().transform(val => parseInt(val, 10)).optional(),
    offset: z.string().transform(val => parseInt(val, 10)).optional()
  })
});

// ==========================================
// CONFIGURATION CRUD ROUTES
// ==========================================

/**
 * @route   POST /api/config
 * @desc    Create new configuration
 * @access  Private (requires authentication)
 */
router.post('/', 
  writeRateLimit,
  requireAuth,
  validateRequest(createConfigSchema),
  async (req, res) => {
    try {
      const context = {
        userId: req.user?.id,
        username: req.user?.username,
        userRole: req.user?.role,
        source: 'api',
        reason: req.body.reason || 'Configuration created via API'
      };

      const configId = await centralConfigEngine.createConfiguration(req.body, context);

      res.status(201).json({
        success: true,
        message: 'Configuration created successfully',
        data: {
          configId,
          version: req.body.version
        }
      });
    } catch (error) {
      console.error('❌ Create config error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create configuration'
      });
    }
  }
);

/**
 * @route   GET /api/config/:configId
 * @desc    Get configuration by ID
 * @access  Private (requires authentication)
 */
router.get('/:configId',
  requireAuth,
  async (req, res) => {
    try {
      const { configId } = req.params;
      const includeMetadata = req.query.includeMetadata === 'true';

      const config = await centralConfigEngine.getConfiguration(configId, includeMetadata);

      if (!config) {
        return res.status(404).json({
          success: false,
          error: 'Configuration not found'
        });
      }

      res.json({
        success: true,
        data: config
      });
    } catch (error) {
      console.error('❌ Get config error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get configuration'
      });
    }
  }
);

/**
 * @route   PUT /api/config/:configId
 * @desc    Update configuration
 * @access  Private (requires authentication)
 */
router.put('/:configId',
  writeRateLimit,
  requireAuth,
  validateRequest(updateConfigSchema),
  async (req, res) => {
    try {
      const { configId } = req.params;
      const context = {
        userId: req.user?.id,
        username: req.user?.username,
        userRole: req.user?.role,
        source: 'api',
        reason: req.body.reason || 'Configuration updated via API'
      };

      await centralConfigEngine.updateConfiguration(configId, req.body, context);

      res.json({
        success: true,
        message: 'Configuration updated successfully'
      });
    } catch (error) {
      console.error('❌ Update config error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update configuration'
      });
    }
  }
);

/**
 * @route   DELETE /api/config/:configId
 * @desc    Delete configuration
 * @access  Private (requires admin role)
 */
router.delete('/:configId',
  writeRateLimit,
  requireAuth,
  requireRole(['admin', 'config_admin']),
  async (req, res) => {
    try {
      const { configId } = req.params;
      const context = {
        userId: req.user?.id,
        username: req.user?.username,
        userRole: req.user?.role,
        source: 'api',
        reason: req.body.reason || 'Configuration deleted via API'
      };

      await centralConfigEngine.deleteConfiguration(configId, context);

      res.json({
        success: true,
        message: 'Configuration deleted successfully'
      });
    } catch (error) {
      console.error('❌ Delete config error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete configuration'
      });
    }
  }
);

// ==========================================
// CONFIGURATION SEARCH ROUTES
// ==========================================

/**
 * @route   GET /api/config
 * @desc    Search configurations
 * @access  Private (requires authentication)
 */
router.get('/',
  requireAuth,
  validateRequest(searchConfigSchema),
  async (req, res) => {
    try {
      const searchOptions = {
        vertical: req.query.vertical,
        locale: req.query.locale,
        category: req.query.category,
        tags: req.query.tags ? req.query.tags.split(',') : undefined,
        isActive: req.query.isActive,
        deprecated: req.query.deprecated,
        limit: req.query.limit || 50,
        offset: req.query.offset || 0
      };

      const configs = await centralConfigEngine.searchConfigurations(searchOptions);

      res.json({
        success: true,
        data: configs,
        pagination: {
          limit: searchOptions.limit,
          offset: searchOptions.offset,
          total: configs.length
        }
      });
    } catch (error) {
      console.error('❌ Search config error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search configurations'
      });
    }
  }
);

/**
 * @route   GET /api/config/category/:category
 * @desc    Get configurations by category
 * @access  Private (requires authentication)
 */
router.get('/category/:category',
  requireAuth,
  async (req, res) => {
    try {
      const { category } = req.params;
      const configs = await centralConfigEngine.getConfigurationsByCategory(category);

      res.json({
        success: true,
        data: configs
      });
    } catch (error) {
      console.error('❌ Get configs by category error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get configurations by category'
      });
    }
  }
);

/**
 * @route   GET /api/config/vertical/:vertical
 * @desc    Get configurations by vertical
 * @access  Private (requires authentication)
 */
router.get('/vertical/:vertical',
  requireAuth,
  async (req, res) => {
    try {
      const { vertical } = req.params;
      const configs = await centralConfigEngine.getConfigurationsByVertical(vertical);

      res.json({
        success: true,
        data: configs
      });
    } catch (error) {
      console.error('❌ Get configs by vertical error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get configurations by vertical'
      });
    }
  }
);

// ==========================================
// VALIDATION ROUTES
// ==========================================

/**
 * @route   POST /api/config/validate
 * @desc    Validate configuration without saving
 * @access  Private (requires authentication)
 */
router.post('/validate',
  requireAuth,
  async (req, res) => {
    try {
      const validation = await centralConfigEngine.validateConfiguration(req.body);

      res.json({
        success: true,
        data: validation
      });
    } catch (error) {
      console.error('❌ Validate config error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to validate configuration'
      });
    }
  }
);

// ==========================================
// SNAPSHOT & ROLLBACK ROUTES
// ==========================================

/**
 * @route   POST /api/config/:configId/snapshot
 * @desc    Create configuration snapshot
 * @access  Private (requires authentication)
 */
router.post('/:configId/snapshot',
  writeRateLimit,
  requireAuth,
  async (req, res) => {
    try {
      const { configId } = req.params;
      const { snapshotType = 'manual' } = req.body;

      const config = await centralConfigEngine.getConfiguration(configId);
      if (!config) {
        return res.status(404).json({
          success: false,
          error: 'Configuration not found'
        });
      }

      const snapshotId = await centralConfigEngine.createSnapshot(configId, config, snapshotType);

      res.json({
        success: true,
        message: 'Snapshot created successfully',
        data: { snapshotId }
      });
    } catch (error) {
      console.error('❌ Create snapshot error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create snapshot'
      });
    }
  }
);

/**
 * @route   GET /api/config/:configId/snapshots
 * @desc    Get configuration snapshots
 * @access  Private (requires authentication)
 */
router.get('/:configId/snapshots',
  requireAuth,
  async (req, res) => {
    try {
      const { configId } = req.params;
      const snapshots = await centralConfigEngine.getSnapshots(configId);

      res.json({
        success: true,
        data: snapshots
      });
    } catch (error) {
      console.error('❌ Get snapshots error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get snapshots'
      });
    }
  }
);

/**
 * @route   POST /api/config/:configId/rollback
 * @desc    Rollback configuration to snapshot
 * @access  Private (requires admin role)
 */
router.post('/:configId/rollback',
  writeRateLimit,
  requireAuth,
  requireRole(['admin', 'config_admin']),
  async (req, res) => {
    try {
      const { configId } = req.params;
      const { snapshotId, reason } = req.body;

      if (!snapshotId) {
        return res.status(400).json({
          success: false,
          error: 'Snapshot ID is required'
        });
      }

      const context = {
        userId: req.user?.id,
        username: req.user?.username,
        userRole: req.user?.role,
        source: 'api',
        reason: reason || 'Configuration rolled back via API'
      };

      await centralConfigEngine.rollbackToSnapshot(configId, snapshotId, context);

      res.json({
        success: true,
        message: 'Configuration rolled back successfully'
      });
    } catch (error) {
      console.error('❌ Rollback error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to rollback configuration'
      });
    }
  }
);

// ==========================================
// CHANGE HISTORY ROUTES
// ==========================================

/**
 * @route   GET /api/config/:configId/history
 * @desc    Get configuration change history
 * @access  Private (requires authentication)
 */
router.get('/:configId/history',
  requireAuth,
  async (req, res) => {
    try {
      const { configId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      const history = await centralConfigEngine.getChangeHistory(configId, limit);

      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      console.error('❌ Get change history error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get change history'
      });
    }
  }
);

// ==========================================
// PERFORMANCE METRICS ROUTES
// ==========================================

/**
 * @route   GET /api/config/:configId/metrics
 * @desc    Get configuration performance metrics
 * @access  Private (requires authentication)
 */
router.get('/:configId/metrics',
  requireAuth,
  async (req, res) => {
    try {
      const { configId } = req.params;
      const days = parseInt(req.query.days as string) || 7;

      const metrics = await centralConfigEngine.getPerformanceMetrics(configId, days);

      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      console.error('❌ Get performance metrics error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get performance metrics'
      });
    }
  }
);

// ==========================================
// FEDERATION SYNC ROUTES
// ==========================================

/**
 * @route   POST /api/config/:configId/sync
 * @desc    Trigger federation sync for configuration
 * @access  Private (requires admin role)
 */
router.post('/:configId/sync',
  writeRateLimit,
  requireAuth,
  requireRole(['admin', 'config_admin']),
  async (req, res) => {
    try {
      const { configId } = req.params;
      const { syncType = 'push' } = req.body;

      await centralConfigEngine.triggerFederationSync(configId, syncType);

      res.json({
        success: true,
        message: 'Federation sync triggered successfully'
      });
    } catch (error) {
      console.error('❌ Federation sync error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to trigger federation sync'
      });
    }
  }
);

// ==========================================
// SYSTEM STATUS ROUTES
// ==========================================

/**
 * @route   GET /api/config/system/status
 * @desc    Get configuration system status
 * @access  Private (requires authentication)
 */
router.get('/system/status',
  requireAuth,
  async (req, res) => {
    try {
      const status = await centralConfigEngine.getSystemStatus();

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('❌ Get system status error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get system status'
      });
    }
  }
);

/**
 * @route   GET /api/config/system/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/system/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// ==========================================
// BULK OPERATIONS
// ==========================================

/**
 * @route   POST /api/config/bulk/create
 * @desc    Create multiple configurations
 * @access  Private (requires admin role)
 */
router.post('/bulk/create',
  writeRateLimit,
  requireAuth,
  requireRole(['admin', 'config_admin']),
  async (req, res) => {
    try {
      const { configurations, context = {} } = req.body;

      if (!Array.isArray(configurations)) {
        return res.status(400).json({
          success: false,
          error: 'Configurations must be an array'
        });
      }

      const results = [];
      const errors = [];

      const requestContext = {
        userId: req.user?.id,
        username: req.user?.username,
        userRole: req.user?.role,
        source: 'api-bulk',
        ...context
      };

      for (let i = 0; i < configurations.length; i++) {
        try {
          const configId = await centralConfigEngine.createConfiguration(
            configurations[i], 
            requestContext
          );
          results.push({ index: i, configId, success: true });
        } catch (error) {
          errors.push({ 
            index: i, 
            error: error instanceof Error ? error.message : 'Unknown error',
            success: false 
          });
        }
      }

      res.json({
        success: true,
        message: `Bulk create completed: ${results.length} successful, ${errors.length} failed`,
        data: {
          successful: results,
          failed: errors,
          total: configurations.length
        }
      });
    } catch (error) {
      console.error('❌ Bulk create error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create configurations'
      });
    }
  }
);

/**
 * @route   POST /api/config/bulk/update
 * @desc    Update multiple configurations
 * @access  Private (requires admin role)
 */
router.post('/bulk/update',
  writeRateLimit,
  requireAuth,
  requireRole(['admin', 'config_admin']),
  async (req, res) => {
    try {
      const { updates, context = {} } = req.body;

      if (!Array.isArray(updates)) {
        return res.status(400).json({
          success: false,
          error: 'Updates must be an array'
        });
      }

      const results = [];
      const errors = [];

      const requestContext = {
        userId: req.user?.id,
        username: req.user?.username,
        userRole: req.user?.role,
        source: 'api-bulk',
        ...context
      };

      for (let i = 0; i < updates.length; i++) {
        try {
          const { configId, ...updateData } = updates[i];
          await centralConfigEngine.updateConfiguration(configId, updateData, requestContext);
          results.push({ index: i, configId, success: true });
        } catch (error) {
          errors.push({ 
            index: i, 
            configId: updates[i].configId,
            error: error instanceof Error ? error.message : 'Unknown error',
            success: false 
          });
        }
      }

      res.json({
        success: true,
        message: `Bulk update completed: ${results.length} successful, ${errors.length} failed`,
        data: {
          successful: results,
          failed: errors,
          total: updates.length
        }
      });
    } catch (error) {
      console.error('❌ Bulk update error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update configurations'
      });
    }
  }
);

// ==========================================
// ERROR HANDLING MIDDLEWARE
// ==========================================

// Global error handler for config routes
router.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Config route error:', error);
  
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error instanceof Error ? error.message : 'Unknown error',
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
});

export default router;