/**
 * Enterprise API Routes - All Critical Modules
 * Cultural Emotion Map, Layout Mutation, Plugin Marketplace, Documentation, Testing
 */

import { Router } from 'express';
import { culturalEmotionMapEngine } from '../../services/cultural/culturalEmotionMap.js';
import { realTimeLayoutMutationEngine } from '../../services/layout/realTimeLayoutMutation.js';
import { aiPluginMarketplace } from '../../services/plugins/aiPluginMarketplace.js';
import { selfUpdatingReadmeEngine } from '../../services/documentation/selfUpdatingReadme.js';
import { llmUnitTestGenerator } from '../../services/testing/llmUnitTestGenerator.js';
import { multiRegionLoadOrchestrator } from '../../services/multiRegion/multiRegionLoadOrchestrator.js';
import { getLocalizationEngine } from '../../services/localization/localizationTranslationEngine.js';
import { requireAuth } from '../../middleware/auth.js';
import { logger } from '../../utils/logger.js';

const router = Router();

// =====================================================================
// CULTURAL EMOTION MAP ROUTES
// =====================================================================

/**
 * Auto-detect cultural context from multiple signals - BILLION-DOLLAR GRADE
 */
router.post('/cultural/auto-detect', requireAuth, async (req, res) => {
  try {
    const detectionRequest = {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      acceptLanguage: req.headers['accept-language'],
      timezone: req.body.timezone,
      userId: req.body.userId,
      sessionId: req.body.sessionId,
      behaviorData: req.body.behaviorData
    };

    const result = await culturalEmotionMapEngine.autoDetectCulturalContext(detectionRequest);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
      detection_confidence: result.confidence
    });

  } catch (error: any) {
    logger.error('Failed to auto-detect cultural context', { error, userId: req.user?.id, component: 'CulturalAPI' });
    res.status(500).json({
      success: false,
      error: 'Failed to auto-detect cultural context',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Analyze user emotion profile based on cultural context - ENHANCED
 */
router.post('/cultural/emotion-profile', requireAuth, async (req, res) => {
  try {
    const { countryCode, behaviorData } = req.body;
    
    if (!countryCode) {
      return res.status(400).json({ 
        success: false, 
        error: 'Country code is required' 
      });
    }

    const emotionProfile = await culturalEmotionMapEngine.analyzeEmotionProfile(
      countryCode, 
      behaviorData || {}
    );

    res.json({
      success: true,
      data: emotionProfile,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Error analyzing emotion profile', { error, component: 'CulturalAPI' });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to analyze emotion profile' 
    });
  }
});

/**
 * Generate culturally personalized content
 */
router.post('/cultural/personalized-content', requireAuth, async (req, res) => {
  try {
    const { countryCode, contentType, baseContent } = req.body;
    
    const personalizedContent = culturalEmotionMapEngine.generatePersonalizedContent(
      countryCode, 
      contentType, 
      baseContent
    );

    res.json({
      success: true,
      data: personalizedContent
    });

  } catch (error: any) {
    logger.error('Error generating personalized content', { error, component: 'CulturalAPI' });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate personalized content' 
    });
  }
});

/**
 * Get emotion scoring for user interaction
 */
router.post('/cultural/emotion-scoring', requireAuth, async (req, res) => {
  try {
    const { countryCode, interactionData } = req.body;
    
    const emotionScoring = culturalEmotionMapEngine.getEmotionScoring(
      countryCode, 
      interactionData || {}
    );

    res.json({
      success: true,
      data: emotionScoring
    });

  } catch (error: any) {
    logger.error('Error getting emotion scoring', { error, component: 'CulturalAPI' });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get emotion scoring' 
    });
  }
});

/**
 * Get A/B test recommendations for cultural adaptation
 */
router.post('/cultural/ab-test-recommendations', requireAuth, async (req, res) => {
  try {
    const { countryCode, sessionId, currentVariant } = req.body;
    
    if (!countryCode || !sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Country code and session ID are required'
      });
    }

    const recommendations = await culturalEmotionMapEngine.getABTestRecommendations(
      countryCode,
      sessionId,
      currentVariant
    );

    res.json({
      success: true,
      data: recommendations,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Error getting A/B test recommendations', { error, component: 'CulturalAPI' });
    res.status(500).json({
      success: false,
      error: 'Failed to get A/B test recommendations'
    });
  }
});

/**
 * Apply UX adaptations in real-time
 */
router.post('/cultural/apply-adaptations', requireAuth, async (req, res) => {
  try {
    const { sessionId, countryCode, behaviorData } = req.body;
    
    if (!sessionId || !countryCode) {
      return res.status(400).json({
        success: false,
        error: 'Session ID and country code are required'
      });
    }

    const adaptations = await culturalEmotionMapEngine.applyUXAdaptations(
      sessionId,
      countryCode,
      behaviorData || {}
    );

    res.json({
      success: true,
      data: adaptations,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Error applying UX adaptations', { error, component: 'CulturalAPI' });
    res.status(500).json({
      success: false,
      error: 'Failed to apply UX adaptations'
    });
  }
});

/**
 * Get comprehensive analytics dashboard data
 */
router.get('/cultural/analytics', requireAuth, async (req, res) => {
  try {
    const { dateRange, countryCode, metric } = req.query;
    
    const analytics = await culturalEmotionMapEngine.getAnalyticsDashboard({
      dateRange: dateRange ? parseInt(dateRange as string) : 30,
      countryCode: countryCode as string,
      metric: metric as string
    });

    res.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Error getting cultural analytics', { error, component: 'CulturalAPI' });
    res.status(500).json({
      success: false,
      error: 'Failed to get cultural analytics'
    });
  }
});

/**
 * Submit cultural feedback for optimization
 */
router.post('/cultural/feedback', requireAuth, async (req, res) => {
  try {
    const { sessionId, emotionAccuracy, adaptationEffectiveness, userSatisfaction, comments } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    await culturalEmotionMapEngine.submitFeedback({
      sessionId,
      emotionAccuracy: emotionAccuracy || 0,
      adaptationEffectiveness: adaptationEffectiveness || 0,
      userSatisfaction: userSatisfaction || 0,
      comments: comments || '',
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Error submitting cultural feedback', { error, component: 'CulturalAPI' });
    res.status(500).json({
      success: false,
      error: 'Failed to submit cultural feedback'
    });
  }
});

/**
 * Get optimization insights and recommendations
 */
router.get('/cultural/optimization-insights', requireAuth, async (req, res) => {
  try {
    const insights = await culturalEmotionMapEngine.getOptimizationInsights();

    res.json({
      success: true,
      data: insights,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Error getting optimization insights', { error, component: 'CulturalAPI' });
    res.status(500).json({
      success: false,
      error: 'Failed to get optimization insights'
    });
  }
});

/**
 * Get all cultural mappings
 */
router.get('/cultural/mappings', requireAuth, async (req, res) => {
  try {
    const mappings = culturalEmotionMapEngine.getAllMappings();

    res.json({
      success: true,
      data: { mappings, count: mappings.length }
    });

  } catch (error: any) {
    logger.error('Error getting cultural mappings', { error, component: 'CulturalAPI' });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get cultural mappings' 
    });
  }
});

// =====================================================================
// REAL-TIME LAYOUT MUTATION ROUTES
// =====================================================================

/**
 * Get personalized layout based on user context
 */
router.post('/layout/personalized', requireAuth, async (req, res) => {
  try {
    const { templateId, userContext } = req.body;
    
    if (!templateId || !userContext) {
      return res.status(400).json({ 
        success: false, 
        error: 'Template ID and user context are required' 
      });
    }

    const personalizedLayout = realTimeLayoutMutationEngine.getPersonalizedLayout(
      templateId, 
      userContext
    );

    res.json({
      success: true,
      data: { layout: personalizedLayout, templateId }
    });

  } catch (error: any) {
    logger.error('Error getting personalized layout', { error, component: 'LayoutAPI' });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get personalized layout' 
    });
  }
});

/**
 * Apply real-time layout mutation
 */
router.post('/layout/mutation', requireAuth, async (req, res) => {
  try {
    const { sessionId, mutationId, customData } = req.body;
    
    if (!sessionId || !mutationId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Session ID and mutation ID are required' 
      });
    }

    const success = realTimeLayoutMutationEngine.applyRealtimeMutation(
      sessionId, 
      mutationId, 
      customData
    );

    res.json({
      success,
      data: { applied: success, sessionId, mutationId }
    });

  } catch (error: any) {
    logger.error('Error applying layout mutation', { error, component: 'LayoutAPI' });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to apply layout mutation' 
    });
  }
});

/**
 * Trigger behavior-based mutation
 */
router.post('/layout/behavior-mutation', requireAuth, async (req, res) => {
  try {
    const { sessionId, behaviorEvent } = req.body;
    
    realTimeLayoutMutationEngine.triggerBehaviorMutation(sessionId, behaviorEvent);

    res.json({
      success: true,
      data: { triggered: true, sessionId }
    });

  } catch (error: any) {
    logger.error('Error triggering behavior mutation', { error, component: 'LayoutAPI' });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to trigger behavior mutation' 
    });
  }
});

/**
 * Get layout analytics
 */
router.get('/layout/analytics/:sessionId', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const analytics = realTimeLayoutMutationEngine.getLayoutAnalytics(sessionId);

    res.json({
      success: true,
      data: analytics
    });

  } catch (error: any) {
    logger.error('Error getting layout analytics', { error, component: 'LayoutAPI' });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get layout analytics' 
    });
  }
});

/**
 * Get available layout templates
 */
router.get('/layout/templates', requireAuth, async (req, res) => {
  try {
    const templates = realTimeLayoutMutationEngine.getAvailableTemplates();

    res.json({
      success: true,
      data: { templates }
    });

  } catch (error: any) {
    logger.error('Error getting layout templates', { error, component: 'LayoutAPI' });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get layout templates' 
    });
  }
});

// =====================================================================
// AI PLUGIN MARKETPLACE ROUTES
// =====================================================================

/**
 * Get available plugins from marketplace
 */
router.get('/plugins/marketplace', requireAuth, async (req, res) => {
  try {
    const { category, neuronType } = req.query;
    
    const plugins = aiPluginMarketplace.getAvailablePlugins(
      category as string, 
      neuronType as string
    );

    res.json({
      success: true,
      data: { plugins, count: plugins.length }
    });

  } catch (error: any) {
    logger.error('Error getting marketplace plugins', { error, component: 'PluginAPI' });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get marketplace plugins' 
    });
  }
});

/**
 * Install plugin for neuron
 */
router.post('/plugins/install', requireAuth, async (req, res) => {
  try {
    const { pluginId, neuronId, configuration } = req.body;
    
    if (!pluginId || !neuronId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Plugin ID and neuron ID are required' 
      });
    }

    const instanceId = await aiPluginMarketplace.installPlugin(
      pluginId, 
      neuronId, 
      configuration
    );

    res.json({
      success: true,
      data: { instanceId, pluginId, neuronId }
    });

  } catch (error: any) {
    logger.error('Error installing plugin', { error, component: 'PluginAPI' });
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to install plugin' 
    });
  }
});

/**
 * Execute plugin function
 */
router.post('/plugins/execute', requireAuth, async (req, res) => {
  try {
    const { pluginId, functionName, input } = req.body;
    
    if (!pluginId || !functionName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Plugin ID and function name are required' 
      });
    }

    const result = await aiPluginMarketplace.executePluginFunction(
      pluginId, 
      functionName, 
      input || {}
    );

    res.json({
      success: true,
      data: { result, pluginId, functionName }
    });

  } catch (error: any) {
    logger.error('Error executing plugin function', { error, component: 'PluginAPI' });
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to execute plugin function' 
    });
  }
});

/**
 * Get plugin instances for neuron
 */
router.get('/plugins/instances/:neuronId', requireAuth, async (req, res) => {
  try {
    const { neuronId } = req.params;
    
    const instances = aiPluginMarketplace.getPluginInstances(neuronId);

    res.json({
      success: true,
      data: { instances, count: instances.length }
    });

  } catch (error: any) {
    logger.error('Error getting plugin instances', { error, component: 'PluginAPI' });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get plugin instances' 
    });
  }
});

/**
 * Update plugin configuration
 */
router.put('/plugins/configure/:instanceId', requireAuth, async (req, res) => {
  try {
    const { instanceId } = req.params;
    const { configuration } = req.body;
    
    const success = await aiPluginMarketplace.updatePluginConfiguration(
      instanceId, 
      configuration
    );

    res.json({
      success,
      data: { updated: success, instanceId }
    });

  } catch (error: any) {
    logger.error('Error updating plugin configuration', { error, component: 'PluginAPI' });
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to update plugin configuration' 
    });
  }
});

/**
 * Uninstall plugin
 */
router.delete('/plugins/uninstall/:instanceId', requireAuth, async (req, res) => {
  try {
    const { instanceId } = req.params;
    
    const success = await aiPluginMarketplace.uninstallPlugin(instanceId);

    res.json({
      success,
      data: { uninstalled: success, instanceId }
    });

  } catch (error: any) {
    logger.error('Error uninstalling plugin', { error, component: 'PluginAPI' });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to uninstall plugin' 
    });
  }
});

/**
 * Get marketplace statistics
 */
router.get('/plugins/stats', requireAuth, async (req, res) => {
  try {
    const stats = aiPluginMarketplace.getMarketplaceStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error: any) {
    logger.error('Error getting marketplace stats', { error, component: 'PluginAPI' });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get marketplace stats' 
    });
  }
});

// =====================================================================
// DOCUMENTATION ROUTES
// =====================================================================

/**
 * Generate module README
 */
router.post('/docs/generate/:moduleId', requireAuth, async (req, res) => {
  try {
    const { moduleId } = req.params;
    
    const readme = await selfUpdatingReadmeEngine.generateModuleReadme(moduleId);

    res.json({
      success: true,
      data: { readme, moduleId }
    });

  } catch (error: any) {
    logger.error('Error generating module README', { error, component: 'DocsAPI' });
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to generate module README' 
    });
  }
});

/**
 * Generate API diff
 */
router.post('/docs/api-diff', requireAuth, async (req, res) => {
  try {
    const { fromVersion, toVersion } = req.body;
    
    if (!fromVersion || !toVersion) {
      return res.status(400).json({ 
        success: false, 
        error: 'From version and to version are required' 
      });
    }

    const diff = await selfUpdatingReadmeEngine.generateAPIDiff(fromVersion, toVersion);

    res.json({
      success: true,
      data: diff
    });

  } catch (error: any) {
    logger.error('Error generating API diff', { error, component: 'DocsAPI' });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate API diff' 
    });
  }
});

/**
 * Update documentation on change
 */
router.post('/docs/update-on-change', requireAuth, async (req, res) => {
  try {
    const { filePath, changeType } = req.body;
    
    await selfUpdatingReadmeEngine.updateDocumentationOnChange(filePath, changeType);

    res.json({
      success: true,
      data: { updated: true, filePath, changeType }
    });

  } catch (error: any) {
    logger.error('Error updating documentation', { error, component: 'DocsAPI' });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update documentation' 
    });
  }
});

/**
 * Generate all documentation
 */
router.post('/docs/generate-all', requireAuth, async (req, res) => {
  try {
    await selfUpdatingReadmeEngine.generateAllDocumentation();

    res.json({
      success: true,
      data: { generated: true }
    });

  } catch (error: any) {
    logger.error('Error generating all documentation', { error, component: 'DocsAPI' });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate all documentation' 
    });
  }
});

/**
 * Get documentation statistics
 */
router.get('/docs/stats', requireAuth, async (req, res) => {
  try {
    const stats = selfUpdatingReadmeEngine.getDocumentationStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error: any) {
    logger.error('Error getting documentation stats', { error, component: 'DocsAPI' });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get documentation stats' 
    });
  }
});

// =====================================================================
// LLM UNIT TEST GENERATOR ROUTES
// =====================================================================

/**
 * Analyze module for testing
 */
router.post('/testing/analyze/:filePath', requireAuth, async (req, res) => {
  try {
    const filePath = decodeURIComponent(req.params.filePath);
    
    const analysis = await llmUnitTestGenerator.analyzeModuleForTesting(filePath);

    res.json({
      success: true,
      data: analysis
    });

  } catch (error: any) {
    logger.error('Error analyzing module for testing', { error, component: 'TestingAPI' });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to analyze module for testing' 
    });
  }
});

/**
 * Generate test suite for module
 */
router.post('/testing/generate-suite', requireAuth, async (req, res) => {
  try {
    const { filePath } = req.body;
    
    if (!filePath) {
      return res.status(400).json({ 
        success: false, 
        error: 'File path is required' 
      });
    }

    const testSuite = await llmUnitTestGenerator.generateTestSuite(filePath);

    res.json({
      success: true,
      data: testSuite
    });

  } catch (error: any) {
    logger.error('Error generating test suite', { error, component: 'TestingAPI' });
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to generate test suite' 
    });
  }
});

/**
 * Run tests
 */
router.post('/testing/run-tests', requireAuth, async (req, res) => {
  try {
    const { suiteId } = req.body;
    
    const results = await llmUnitTestGenerator.runTests(suiteId);

    res.json({
      success: true,
      data: results
    });

  } catch (error: any) {
    logger.error('Error running tests', { error, component: 'TestingAPI' });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to run tests' 
    });
  }
});

/**
 * Generate test configuration
 */
router.get('/testing/config', requireAuth, async (req, res) => {
  try {
    const config = llmUnitTestGenerator.generateTestConfig();

    res.json({
      success: true,
      data: { config }
    });

  } catch (error: any) {
    logger.error('Error generating test config', { error, component: 'TestingAPI' });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate test config' 
    });
  }
});

/**
 * Get test statistics
 */
router.get('/testing/stats', requireAuth, async (req, res) => {
  try {
    const stats = llmUnitTestGenerator.getTestStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error: any) {
    logger.error('Error getting test stats', { error, component: 'TestingAPI' });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get test stats' 
    });
  }
});

// =====================================================================
// MULTI-REGION LOAD ORCHESTRATOR ROUTES
// =====================================================================

/**
 * Route request to optimal region
 */
router.post('/regions/route', requireAuth, async (req, res) => {
  try {
    const { userLocation, userAgent } = req.body;
    
    if (!userLocation) {
      return res.status(400).json({ 
        success: false, 
        error: 'User location is required' 
      });
    }

    const routing = multiRegionLoadOrchestrator.routeRequest(userLocation, userAgent);

    res.json({
      success: true,
      data: routing
    });

  } catch (error: any) {
    logger.error('Error routing request', { error, component: 'RegionAPI' });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to route request' 
    });
  }
});

/**
 * Get traffic distribution
 */
router.get('/regions/traffic', requireAuth, async (req, res) => {
  try {
    const distribution = multiRegionLoadOrchestrator.getTrafficDistribution();

    res.json({
      success: true,
      data: distribution
    });

  } catch (error: any) {
    logger.error('Error getting traffic distribution', { error, component: 'RegionAPI' });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get traffic distribution' 
    });
  }
});

/**
 * Get region metrics
 */
router.get('/regions/metrics', requireAuth, async (req, res) => {
  try {
    const metrics = multiRegionLoadOrchestrator.getRegionMetrics();

    res.json({
      success: true,
      data: metrics
    });

  } catch (error: any) {
    logger.error('Error getting region metrics', { error, component: 'RegionAPI' });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get region metrics' 
    });
  }
});

/**
 * Get failover history
 */
router.get('/regions/failover-history', requireAuth, async (req, res) => {
  try {
    const { limit } = req.query;
    
    const history = multiRegionLoadOrchestrator.getFailoverHistory(
      limit ? parseInt(limit as string) : 50
    );

    res.json({
      success: true,
      data: { history, count: history.length }
    });

  } catch (error: any) {
    logger.error('Error getting failover history', { error, component: 'RegionAPI' });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get failover history' 
    });
  }
});

/**
 * Update region configuration
 */
router.put('/regions/config/:regionId', requireAuth, async (req, res) => {
  try {
    const { regionId } = req.params;
    const updates = req.body;
    
    const success = multiRegionLoadOrchestrator.updateRegionConfig(regionId, updates);

    res.json({
      success,
      data: { updated: success, regionId }
    });

  } catch (error: any) {
    logger.error('Error updating region config', { error, component: 'RegionAPI' });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update region config' 
    });
  }
});

// =====================================================================
// LOCALIZATION/TRANSLATION ENGINE ROUTES - BILLION-DOLLAR GRADE
// =====================================================================

/**
 * Auto-detect user language and cultural context
 */
router.post('/localization/auto-detect', async (req, res) => {
  try {
    const detectionRequest = {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      acceptLanguage: req.headers['accept-language'],
      timezone: req.body.timezone,
      userId: req.body.userId,
      sessionId: req.body.sessionId
    };

    const result = await localizationTranslationEngine.autoDetectLanguageAndCulture(detectionRequest);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Failed to auto-detect language', { error, component: 'LocalizationAPI' });
    res.status(500).json({
      success: false,
      error: 'Failed to auto-detect language',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get available languages
 */
router.get('/localization/languages', async (req, res) => {
  try {
    const languages = await localizationTranslationEngine.getLanguages();
    
    res.json({
      success: true,
      data: languages,
      count: languages.length
    });

  } catch (error: any) {
    logger.error('Failed to get languages', { error, component: 'LocalizationAPI' });
    res.status(500).json({
      success: false,
      error: 'Failed to get languages'
    });
  }
});

/**
 * Translate content with basic localization
 */
router.post('/localization/translate', async (req, res) => {
  try {
    const { keyPath, defaultValue, languageCode, context, category, interpolationVars } = req.body;
    
    if (!keyPath || !defaultValue || !languageCode) {
      return res.status(400).json({
        success: false,
        error: 'keyPath, defaultValue, and languageCode are required'
      });
    }

    const result = await localizationTranslationEngine.translateWithCulturalAdaptation({
      keyPath,
      defaultValue,
      languageCode,
      context,
      category,
      interpolationVars,
      culturalAdaptation: false
    });
    
    res.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    logger.error('Failed to translate content', { error, component: 'LocalizationAPI' });
    res.status(500).json({
      success: false,
      error: 'Failed to translate content'
    });
  }
});

/**
 * Translate content with cultural adaptation
 */
router.post('/localization/translate-cultural', async (req, res) => {
  try {
    const { keyPath, defaultValue, languageCode, context, category, interpolationVars } = req.body;
    
    if (!keyPath || !defaultValue || !languageCode) {
      return res.status(400).json({
        success: false,
        error: 'keyPath, defaultValue, and languageCode are required'
      });
    }

    const result = await localizationTranslationEngine.translateWithCulturalAdaptation({
      keyPath,
      defaultValue,
      languageCode,
      context,
      category,
      interpolationVars,
      culturalAdaptation: true
    });
    
    res.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    logger.error('Failed to translate with cultural adaptation', { error, component: 'LocalizationAPI' });
    res.status(500).json({
      success: false,
      error: 'Failed to translate with cultural adaptation'
    });
  }
});

/**
 * Batch translate multiple keys
 */
router.post('/localization/batch-translate', async (req, res) => {
  try {
    const { requests } = req.body;
    
    if (!Array.isArray(requests) || requests.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'requests array is required'
      });
    }

    const results = await localizationTranslationEngine.batchTranslateWithCulturalAdaptation(requests);
    
    res.json({
      success: true,
      data: results,
      count: results.length
    });

  } catch (error: any) {
    logger.error('Failed to batch translate', { error, component: 'LocalizationAPI' });
    res.status(500).json({
      success: false,
      error: 'Failed to batch translate'
    });
  }
});

/**
 * Get missing translations for admin review
 */
router.get('/localization/missing/:languageCode', requireAuth, async (req, res) => {
  try {
    const { languageCode } = req.params;
    const { limit = 100 } = req.query;
    
    const missingTranslations = await localizationTranslationEngine.getMissingTranslations(
      languageCode, 
      parseInt(limit as string)
    );
    
    res.json({
      success: true,
      data: missingTranslations,
      count: missingTranslations.length
    });

  } catch (error: any) {
    logger.error('Failed to get missing translations', { error, component: 'LocalizationAPI' });
    res.status(500).json({
      success: false,
      error: 'Failed to get missing translations'
    });
  }
});

/**
 * Auto-translate missing keys using AI
 */
router.post('/localization/auto-translate/:languageCode', requireAuth, async (req, res) => {
  try {
    const { languageCode } = req.params;
    const { limit = 50 } = req.body;
    
    const result = await localizationTranslationEngine.autoTranslateMissingKeys(
      languageCode, 
      limit
    );
    
    res.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    logger.error('Failed to auto-translate missing keys', { error, component: 'LocalizationAPI' });
    res.status(500).json({
      success: false,
      error: 'Failed to auto-translate missing keys'
    });
  }
});

/**
 * Track localization analytics
 */
router.post('/localization/analytics', async (req, res) => {
  try {
    const analyticsData = req.body;
    
    await localizationTranslationEngine.trackLocalizationEvent(analyticsData);
    
    res.json({
      success: true,
      message: 'Analytics tracked successfully'
    });

  } catch (error: any) {
    logger.warn('Failed to track localization analytics', { error, component: 'LocalizationAPI' });
    // Don't fail the request for analytics
    res.json({
      success: true,
      message: 'Analytics tracking failed but request continued'
    });
  }
});

/**
 * Get localization analytics for admin dashboard
 */
router.get('/localization/analytics', requireAuth, async (req, res) => {
  try {
    const { 
      languageCode, 
      eventType, 
      startDate, 
      endDate, 
      limit = 1000 
    } = req.query;
    
    const options: any = { limit: parseInt(limit as string) };
    
    if (languageCode) options.languageCode = languageCode as string;
    if (eventType) options.eventType = eventType as string;
    
    if (startDate && endDate) {
      options.timeRange = {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      };
    }
    
    const analytics = await localizationTranslationEngine.getLocalizationAnalytics(options);
    
    res.json({
      success: true,
      data: analytics
    });

  } catch (error: any) {
    logger.error('Failed to get localization analytics', { error, component: 'LocalizationAPI' });
    res.status(500).json({
      success: false,
      error: 'Failed to get localization analytics'
    });
  }
});

/**
 * Format values for specific locale (currency, date, number)
 */
router.post('/localization/format', async (req, res) => {
  try {
    const { value, type, languageCode, options } = req.body;
    
    if (!value || !type || !languageCode) {
      return res.status(400).json({
        success: false,
        error: 'value, type, and languageCode are required'
      });
    }

    const formattedValue = localizationTranslationEngine.formatForLocale(
      value, 
      type, 
      languageCode, 
      options
    );
    
    res.json({
      success: true,
      data: {
        originalValue: value,
        formattedValue,
        type,
        languageCode
      }
    });

  } catch (error: any) {
    logger.error('Failed to format value for locale', { error, component: 'LocalizationAPI' });
    res.status(500).json({
      success: false,
      error: 'Failed to format value for locale'
    });
  }
});

/**
 * Clear localization cache
 */
router.post('/localization/clear-cache', requireAuth, async (req, res) => {
  try {
    localizationTranslationEngine.clearCache();
    
    res.json({
      success: true,
      message: 'Localization cache cleared successfully'
    });

  } catch (error: any) {
    logger.error('Failed to clear localization cache', { error, component: 'LocalizationAPI' });
    res.status(500).json({
      success: false,
      error: 'Failed to clear localization cache'
    });
  }
});

/**
 * Get localization engine status
 */
router.get('/localization/status', requireAuth, async (req, res) => {
  try {
    const status = {
      initialized: localizationTranslationEngine.isInitialized(),
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      features: [
        'auto-detection',
        'cultural-adaptation', 
        'real-time-translation',
        'analytics-tracking',
        'cache-optimization',
        'batch-processing'
      ]
    };
    
    res.json({
      success: true,
      data: status
    });

  } catch (error: any) {
    logger.error('Failed to get localization status', { error, component: 'LocalizationAPI' });
    res.status(500).json({
      success: false,
      error: 'Failed to get localization status'
    });
  }
});

export default router;