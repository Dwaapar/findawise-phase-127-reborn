import express from 'express';
import { dynamicPageGenerator } from '../services/pages/dynamicPageGenerator';
import { emotionMappingEngine } from '../services/emotion/emotionMappingEngine';
import { contentPointerLogic } from '../services/contentPointer/contentPointerLogic';
import { auditLogger } from '../services/audit/auditLogger';
import { performanceMonitor } from '../services/monitoring/performanceMonitor';
import { logger } from '../utils/logger';

const router = express.Router();

// ==========================================
// EMPIRE GRADE MODULE API ROUTES
// ==========================================

// ===== DYNAMIC PAGE GENERATOR ROUTES =====

router.post('/pages/generate', async (req, res) => {
  const timerId = performanceMonitor.startTimer('api_page_generate');
  
  try {
    const generationRequest = req.body;
    const result = await dynamicPageGenerator.generatePage(generationRequest);
    
    auditLogger.log({
      component: 'EmpireModulesAPI',
      action: 'page_generated',
      metadata: { pageId: result.pageId, success: result.success },
      severity: 'info'
    });
    
    performanceMonitor.endTimer(timerId);
    res.json(result);
  } catch (error) {
    performanceMonitor.endTimer(timerId, { error: true });
    logger.error('Page generation failed', { error: error.message });
    res.status(500).json({ error: 'Page generation failed', details: error.message });
  }
});

router.get('/pages/:pageId', async (req, res) => {
  try {
    const page = await dynamicPageGenerator.getPage(req.params.pageId);
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }
    res.json(page);
  } catch (error) {
    logger.error('Failed to retrieve page', { pageId: req.params.pageId, error: error.message });
    res.status(500).json({ error: 'Failed to retrieve page' });
  }
});

router.put('/pages/:pageId', async (req, res) => {
  try {
    const updates = req.body;
    const result = await dynamicPageGenerator.updatePage(req.params.pageId, updates);
    
    auditLogger.log({
      component: 'EmpireModulesAPI',
      action: 'page_updated',
      metadata: { pageId: req.params.pageId },
      severity: 'info'
    });
    
    res.json(result);
  } catch (error) {
    logger.error('Page update failed', { pageId: req.params.pageId, error: error.message });
    res.status(500).json({ error: 'Page update failed', details: error.message });
  }
});

router.delete('/pages/:pageId', async (req, res) => {
  try {
    const success = await dynamicPageGenerator.deletePage(req.params.pageId);
    
    auditLogger.log({
      component: 'EmpireModulesAPI',
      action: 'page_deleted',
      metadata: { pageId: req.params.pageId, success },
      severity: 'warn'
    });
    
    res.json({ success });
  } catch (error) {
    logger.error('Page deletion failed', { pageId: req.params.pageId, error: error.message });
    res.status(500).json({ error: 'Page deletion failed' });
  }
});

router.get('/pages/:pageId/preview', async (req, res) => {
  try {
    const preview = await dynamicPageGenerator.previewPage(req.params.pageId, req.query as any);
    res.json(preview);
  } catch (error) {
    logger.error('Page preview failed', { pageId: req.params.pageId, error: error.message });
    res.status(500).json({ error: 'Page preview failed' });
  }
});

router.post('/pages/validate', async (req, res) => {
  try {
    const config = req.body;
    const validation = await dynamicPageGenerator.validateConfig(config);
    res.json(validation);
  } catch (error) {
    logger.error('Page validation failed', { error: error.message });
    res.status(500).json({ error: 'Page validation failed' });
  }
});

router.get('/pages/:pageId/analytics', async (req, res) => {
  try {
    const analytics = await dynamicPageGenerator.getPageAnalytics(req.params.pageId);
    res.json(analytics);
  } catch (error) {
    logger.error('Page analytics failed', { pageId: req.params.pageId, error: error.message });
    res.status(500).json({ error: 'Page analytics failed' });
  }
});

router.post('/pages/bulk', async (req, res) => {
  try {
    const { pages } = req.body;
    const results = await dynamicPageGenerator.generateBulkPages(pages);
    
    auditLogger.log({
      component: 'EmpireModulesAPI',
      action: 'bulk_pages_generated',
      metadata: { count: pages.length },
      severity: 'info'
    });
    
    res.json(results);
  } catch (error) {
    logger.error('Bulk page generation failed', { error: error.message });
    res.status(500).json({ error: 'Bulk page generation failed' });
  }
});

// ===== EMOTION MAPPING ENGINE ROUTES =====

router.post('/emotions/analyze', async (req, res) => {
  const timerId = performanceMonitor.startTimer('api_emotion_analyze');
  
  try {
    const { text, context } = req.body;
    const analysis = await emotionMappingEngine.analyzeEmotion(text, context);
    
    auditLogger.log({
      component: 'EmpireModulesAPI',
      action: 'emotion_analyzed',
      metadata: { textLength: text?.length || 0, hasContext: !!context },
      severity: 'info'
    });
    
    performanceMonitor.endTimer(timerId);
    res.json(analysis);
  } catch (error) {
    performanceMonitor.endTimer(timerId, { error: true });
    logger.error('Emotion analysis failed', { error: error.message });
    res.status(500).json({ error: 'Emotion analysis failed', details: error.message });
  }
});

router.get('/emotions/profile/:userId', async (req, res) => {
  try {
    const profile = await emotionMappingEngine.getUserEmotionProfile(req.params.userId);
    res.json(profile);
  } catch (error) {
    logger.error('Emotion profile retrieval failed', { userId: req.params.userId, error: error.message });
    res.status(500).json({ error: 'Emotion profile retrieval failed' });
  }
});

router.post('/emotions/track', async (req, res) => {
  try {
    const emotionData = req.body;
    const result = await emotionMappingEngine.trackEmotion(emotionData);
    
    auditLogger.log({
      component: 'EmpireModulesAPI',
      action: 'emotion_tracked',
      metadata: { userId: emotionData.userId, emotion: emotionData.emotion },
      severity: 'info'
    });
    
    res.json(result);
  } catch (error) {
    logger.error('Emotion tracking failed', { error: error.message });
    res.status(500).json({ error: 'Emotion tracking failed' });
  }
});

router.get('/emotions/suggestions/:emotion', async (req, res) => {
  try {
    const suggestions = await emotionMappingEngine.getContentSuggestions(req.params.emotion, req.query as any);
    res.json(suggestions);
  } catch (error) {
    logger.error('Emotion suggestions failed', { emotion: req.params.emotion, error: error.message });
    res.status(500).json({ error: 'Emotion suggestions failed' });
  }
});

router.get('/emotions/cultural/:locale', async (req, res) => {
  try {
    const culturalData = await emotionMappingEngine.getCulturalEmotionData(req.params.locale);
    res.json(culturalData);
  } catch (error) {
    logger.error('Cultural emotion data failed', { locale: req.params.locale, error: error.message });
    res.status(500).json({ error: 'Cultural emotion data failed' });
  }
});

router.post('/emotions/personalize', async (req, res) => {
  try {
    const { content, emotionProfile } = req.body;
    const personalized = await emotionMappingEngine.personalizeContent(content, emotionProfile);
    res.json(personalized);
  } catch (error) {
    logger.error('Content personalization failed', { error: error.message });
    res.status(500).json({ error: 'Content personalization failed' });
  }
});

router.get('/emotions/analytics', async (req, res) => {
  try {
    const analytics = await emotionMappingEngine.getEmotionAnalytics();
    res.json(analytics);
  } catch (error) {
    logger.error('Emotion analytics failed', { error: error.message });
    res.status(500).json({ error: 'Emotion analytics failed' });
  }
});

// ===== CONTENT POINTER LOGIC ROUTES =====

router.post('/pointers', async (req, res) => {
  const timerId = performanceMonitor.startTimer('api_pointer_create');
  
  try {
    const pointerData = req.body;
    const pointer = await contentPointerLogic.createPointer(pointerData);
    
    auditLogger.log({
      component: 'EmpireModulesAPI',
      action: 'pointer_created',
      metadata: { pointerId: pointer.id, type: pointer.pointerType },
      severity: 'info'
    });
    
    performanceMonitor.endTimer(timerId);
    res.status(201).json(pointer);
  } catch (error) {
    performanceMonitor.endTimer(timerId, { error: true });
    logger.error('Pointer creation failed', { error: error.message });
    res.status(500).json({ error: 'Pointer creation failed', details: error.message });
  }
});

router.get('/pointers/:pointerId', async (req, res) => {
  try {
    const pointer = contentPointerLogic.getPointer(req.params.pointerId);
    if (!pointer) {
      return res.status(404).json({ error: 'Pointer not found' });
    }
    res.json(pointer);
  } catch (error) {
    logger.error('Pointer retrieval failed', { pointerId: req.params.pointerId, error: error.message });
    res.status(500).json({ error: 'Pointer retrieval failed' });
  }
});

router.put('/pointers/:pointerId', async (req, res) => {
  try {
    const updates = req.body;
    const pointer = await contentPointerLogic.updatePointer(req.params.pointerId, updates);
    
    auditLogger.log({
      component: 'EmpireModulesAPI',
      action: 'pointer_updated',
      metadata: { pointerId: req.params.pointerId, updates: Object.keys(updates) },
      severity: 'info'
    });
    
    res.json(pointer);
  } catch (error) {
    logger.error('Pointer update failed', { pointerId: req.params.pointerId, error: error.message });
    res.status(500).json({ error: 'Pointer update failed', details: error.message });
  }
});

router.delete('/pointers/:pointerId', async (req, res) => {
  try {
    const success = await contentPointerLogic.deletePointer(req.params.pointerId);
    
    auditLogger.log({
      component: 'EmpireModulesAPI',
      action: 'pointer_deleted',
      metadata: { pointerId: req.params.pointerId, success },
      severity: 'warn'
    });
    
    res.json({ success });
  } catch (error) {
    logger.error('Pointer deletion failed', { pointerId: req.params.pointerId, error: error.message });
    res.status(500).json({ error: 'Pointer deletion failed' });
  }
});

router.get('/pointers/:pointerId/content', async (req, res) => {
  try {
    const options = {
      useCache: req.query.cache !== 'false',
      timeout: parseInt(req.query.timeout as string) || 5000,
      fallback: req.query.fallback === 'true'
    };
    const content = await contentPointerLogic.fetchContent(req.params.pointerId, options);
    res.json(content);
  } catch (error) {
    logger.error('Content fetch failed', { pointerId: req.params.pointerId, error: error.message });
    res.status(500).json({ error: 'Content fetch failed' });
  }
});

router.post('/pointers/:pointerId/validate', async (req, res) => {
  try {
    const validation = await contentPointerLogic.validatePointer(req.params.pointerId);
    res.json(validation);
  } catch (error) {
    logger.error('Pointer validation failed', { pointerId: req.params.pointerId, error: error.message });
    res.status(500).json({ error: 'Pointer validation failed' });
  }
});

router.get('/pointers/source/:sourceId', async (req, res) => {
  try {
    const pointers = contentPointerLogic.getPointersBySource(req.params.sourceId);
    res.json(pointers);
  } catch (error) {
    logger.error('Source pointers retrieval failed', { sourceId: req.params.sourceId, error: error.message });
    res.status(500).json({ error: 'Source pointers retrieval failed' });
  }
});

router.get('/pointers/target/:targetId', async (req, res) => {
  try {
    const pointers = contentPointerLogic.getPointersByTarget(req.params.targetId);
    res.json(pointers);
  } catch (error) {
    logger.error('Target pointers retrieval failed', { targetId: req.params.targetId, error: error.message });
    res.status(500).json({ error: 'Target pointers retrieval failed' });
  }
});

router.post('/pointers/:sourceId/relationships', async (req, res) => {
  try {
    const options = req.body;
    const relationships = await contentPointerLogic.detectRelationships(req.params.sourceId, options);
    res.json(relationships);
  } catch (error) {
    logger.error('Relationship detection failed', { sourceId: req.params.sourceId, error: error.message });
    res.status(500).json({ error: 'Relationship detection failed' });
  }
});

router.get('/pointers/analytics/broken', async (req, res) => {
  try {
    const brokenPointers = await contentPointerLogic.getBrokenPointers();
    res.json(brokenPointers);
  } catch (error) {
    logger.error('Broken pointers retrieval failed', { error: error.message });
    res.status(500).json({ error: 'Broken pointers retrieval failed' });
  }
});

router.get('/pointers/analytics/duplicates', async (req, res) => {
  try {
    const duplicates = await contentPointerLogic.getDuplicatePointers();
    res.json(duplicates);
  } catch (error) {
    logger.error('Duplicate pointers retrieval failed', { error: error.message });
    res.status(500).json({ error: 'Duplicate pointers retrieval failed' });
  }
});

router.get('/pointers/analytics/overview', async (req, res) => {
  try {
    const analytics = await contentPointerLogic.getPointerAnalytics();
    res.json(analytics);
  } catch (error) {
    logger.error('Pointer analytics failed', { error: error.message });
    res.status(500).json({ error: 'Pointer analytics failed' });
  }
});

// ===== SYSTEM HEALTH & MONITORING =====

router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      modules: {
        dynamicPageGenerator: {
          status: 'active',
          cacheStats: dynamicPageGenerator.getCacheStats?.() || null
        },
        emotionMappingEngine: {
          status: 'active',
          profileCount: emotionMappingEngine.getProfileCount?.() || 0
        },
        contentPointerLogic: {
          status: 'active',
          pointerCount: (await contentPointerLogic.getPointerAnalytics()).totalPointers
        }
      },
      performance: {
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime()
      }
    };
    
    res.json(health);
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(500).json({ error: 'Health check failed' });
  }
});

router.get('/metrics', async (req, res) => {
  try {
    const metrics = {
      performance: performanceMonitor.getMetrics(),
      audit: auditLogger.getEvents().slice(-100), // Last 100 audit events
      timestamp: new Date().toISOString()
    };
    
    res.json(metrics);
  } catch (error) {
    logger.error('Metrics retrieval failed', { error: error.message });
    res.status(500).json({ error: 'Metrics retrieval failed' });
  }
});

// ===== ERROR HANDLING MIDDLEWARE =====

router.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Empire Modules API Error', {
    component: 'EmpireModulesAPI',
    path: req.path,
    method: req.method,
    error: error.message,
    stack: error.stack
  });

  auditLogger.log({
    component: 'EmpireModulesAPI',
    action: 'api_error',
    metadata: { 
      path: req.path, 
      method: req.method, 
      error: error.message 
    },
    severity: 'error'
  });

  if (res.headersSent) {
    return next(error);
  }

  res.status(error.status || 500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

export default router;