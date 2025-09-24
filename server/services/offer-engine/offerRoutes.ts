/**
 * Offer Engine API Routes - Billion Dollar Empire Grade
 * Complete REST API for affiliate offer management
 */

import { Router } from 'express';
import { offerEngineCore } from './offerEngineCore';
import { offerSyncEngine } from './offerSyncEngine';
import { offerSourcesInitializer } from './offerSourcesInitializer';
import { adapterRegistry } from './affiliateAdapters/adapterRegistry';

const router = Router();

// ====================================================
// OFFER FEED ENDPOINTS
// ====================================================

/**
 * GET /api/offers - Get all offers with filtering
 */
router.get('/offers', async (req, res) => {
  try {
    const {
      category,
      merchant,
      region = 'global',
      emotion,
      isActive = 'true',
      limit = '50',
      offset = '0',
      sortBy = 'priority',
      sortOrder = 'desc'
    } = req.query;

    const filters = {
      category: category as string,
      merchant: merchant as string,
      region: region as string,
      emotion: emotion as string,
      isActive: isActive === 'true',
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc'
    };

    const offers = await offerEngineCore.getOffers(filters);
    const total = await offerEngineCore.getOffersCount(filters);

    res.json({
      success: true,
      data: {
        offers,
        pagination: {
          total,
          limit: filters.limit,
          offset: filters.offset,
          hasMore: filters.offset + filters.limit < total
        }
      }
    });
  } catch (error) {
    console.error('Failed to fetch offers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch offers'
    });
  }
});

/**
 * GET /api/offers/:id - Get single offer
 */
router.get('/offers/:id', async (req, res) => {
  try {
    const offer = await offerEngineCore.getOfferById(parseInt(req.params.id));
    
    if (!offer) {
      return res.status(404).json({
        success: false,
        error: 'Offer not found'
      });
    }

    res.json({
      success: true,
      data: offer
    });
  } catch (error) {
    console.error('Failed to fetch offer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch offer'
    });
  }
});

/**
 * POST /api/offers/:id/track-click - Track offer click
 */
router.post('/offers/:id/track-click', async (req, res) => {
  try {
    const { sessionId, userId, neuronId, pageSlug } = req.body;
    
    await offerEngineCore.trackOfferClick(parseInt(req.params.id), {
      sessionId,
      userId,
      neuronId,
      pageSlug,
      deviceType: req.headers['user-agent'],
      geoLocation: req.ip,
      referrer: req.headers.referer
    });

    res.json({
      success: true,
      message: 'Click tracked successfully'
    });
  } catch (error) {
    console.error('Failed to track click:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track click'
    });
  }
});

/**
 * GET /api/offers/search - Search offers
 */
router.get('/offers/search', async (req, res) => {
  try {
    const { q, limit = '20' } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const offers = await offerEngineCore.searchOffers(q as string, parseInt(limit as string));

    res.json({
      success: true,
      data: offers
    });
  } catch (error) {
    console.error('Failed to search offers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search offers'
    });
  }
});

/**
 * GET /api/offers/featured - Get featured offers
 */
router.get('/offers/featured', async (req, res) => {
  try {
    const { limit = '10' } = req.query;
    
    const offers = await offerEngineCore.getFeaturedOffers(parseInt(limit as string));

    res.json({
      success: true,
      data: offers
    });
  } catch (error) {
    console.error('Failed to fetch featured offers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch featured offers'
    });
  }
});

/**
 * GET /api/offers/categories - Get offer categories
 */
router.get('/offers/categories', async (req, res) => {
  try {
    const categories = await offerEngineCore.getOfferCategories();

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
});

// ====================================================
// OFFER SOURCES MANAGEMENT
// ====================================================

/**
 * GET /api/offers/sources - Get all offer sources
 */
router.get('/sources', async (req, res) => {
  try {
    const sources = await offerEngineCore.getOfferSources();

    res.json({
      success: true,
      data: sources
    });
  } catch (error) {
    console.error('Failed to fetch sources:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sources'
    });
  }
});

/**
 * POST /api/offers/sources/initialize - Initialize all sources
 */
router.post('/sources/initialize', async (req, res) => {
  try {
    await offerSourcesInitializer.initializeAllSources();
    const status = await offerSourcesInitializer.getInitializationStatus();

    res.json({
      success: true,
      data: status,
      message: 'Sources initialized successfully'
    });
  } catch (error) {
    console.error('Failed to initialize sources:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize sources'
    });
  }
});

/**
 * GET /api/offers/sources/status - Get sources initialization status
 */
router.get('/sources/status', async (req, res) => {
  try {
    const status = await offerSourcesInitializer.getInitializationStatus();

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Failed to get sources status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sources status'
    });
  }
});

/**
 * POST /api/offers/sources/:slug/activate - Activate a source
 */
router.post('/sources/:slug/activate', async (req, res) => {
  try {
    const { credentials } = req.body;
    
    if (!credentials) {
      return res.status(400).json({
        success: false,
        error: 'Credentials are required'
      });
    }

    const success = await offerSourcesInitializer.activateSource(req.params.slug, credentials);
    
    if (success) {
      res.json({
        success: true,
        message: 'Source activated successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to activate source'
      });
    }
  } catch (error) {
    console.error('Failed to activate source:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to activate source'
    });
  }
});

/**
 * POST /api/offers/sources/:slug/deactivate - Deactivate a source
 */
router.post('/sources/:slug/deactivate', async (req, res) => {
  try {
    const success = await offerSourcesInitializer.deactivateSource(req.params.slug);
    
    if (success) {
      res.json({
        success: true,
        message: 'Source deactivated successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to deactivate source'
      });
    }
  } catch (error) {
    console.error('Failed to deactivate source:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate source'
    });
  }
});

// ====================================================
// SYNC OPERATIONS
// ====================================================

/**
 * POST /api/offers/sync - Sync all active sources
 */
router.post('/sync', async (req, res) => {
  try {
    const results = await offerSyncEngine.syncAllSources();

    res.json({
      success: true,
      data: results,
      message: `Synced ${results.length} sources`
    });
  } catch (error) {
    console.error('Failed to sync sources:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync sources'
    });
  }
});

/**
 * POST /api/offers/sync/:slug - Sync specific source
 */
router.post('/sync/:slug', async (req, res) => {
  try {
    const sources = await offerEngineCore.getOfferSources();
    const source = sources.find(s => s.slug === req.params.slug);
    
    if (!source) {
      return res.status(404).json({
        success: false,
        error: 'Source not found'
      });
    }

    const result = await offerSyncEngine.syncSource(source);

    res.json({
      success: true,
      data: result,
      message: `Synced ${source.name}`
    });
  } catch (error) {
    console.error('Failed to sync source:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync source'
    });
  }
});

/**
 * GET /api/offers/sync/history - Get sync history
 */
router.get('/sync/history', async (req, res) => {
  try {
    const { limit = '50', offset = '0' } = req.query;
    
    const history = await offerEngineCore.getSyncHistory({
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Failed to fetch sync history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sync history'
    });
  }
});

// ====================================================
// ADAPTER REGISTRY
// ====================================================

/**
 * GET /api/offers/adapters - Get all registered adapters
 */
router.get('/adapters', async (req, res) => {
  try {
    const adapters = await adapterRegistry.getAllAdapters();

    res.json({
      success: true,
      data: adapters
    });
  } catch (error) {
    console.error('Failed to fetch adapters:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch adapters'
    });
  }
});

/**
 * GET /api/offers/adapters/:slug/health - Get adapter health
 */
router.get('/adapters/:slug/health', async (req, res) => {
  try {
    const health = await adapterRegistry.getAdapterHealth(req.params.slug);

    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Failed to get adapter health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get adapter health'
    });
  }
});

/**
 * POST /api/offers/adapters/:slug/test - Test adapter connection
 */
router.post('/adapters/:slug/test', async (req, res) => {
  try {
    const { credentials } = req.body;
    
    const result = await adapterRegistry.testAdapter(req.params.slug, credentials);

    res.json({
      success: result.success,
      data: result,
      message: result.success ? 'Adapter test successful' : 'Adapter test failed'
    });
  } catch (error) {
    console.error('Failed to test adapter:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test adapter'
    });
  }
});

// ====================================================
// ANALYTICS & REPORTING
// ====================================================

/**
 * GET /api/offers/analytics/dashboard - Get offer analytics dashboard
 */
router.get('/analytics/dashboard', async (req, res) => {
  try {
    const analytics = await offerEngineCore.getOfferAnalyticsDashboard();

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics'
    });
  }
});

/**
 * GET /api/offers/analytics/performance - Get performance metrics
 */
router.get('/analytics/performance', async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      groupBy = 'day',
      category,
      merchant 
    } = req.query;

    const metrics = await offerEngineCore.getPerformanceMetrics({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      groupBy: groupBy as string,
      category: category as string,
      merchant: merchant as string
    });

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Failed to fetch performance metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch performance metrics'
    });
  }
});

export { router as offerRoutes };