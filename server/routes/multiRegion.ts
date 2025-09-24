/**
 * Multi-Region Load Orchestrator API Routes
 * Billion-Dollar Empire Grade Implementation
 */

import { Router } from 'express';
import { z } from 'zod';
import { multiRegionLoadOrchestrator } from '../services/multiRegion/multiRegionLoadOrchestrator';
import { db } from '../db';
import { regions, regionHealth, loadBalancingRules, trafficDistribution, failoverEvents, routingDecisions } from '../../shared/multiRegionTables';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { logger } from '../utils/logger';

const router = Router();

// ===================================================
// REGION MANAGEMENT ENDPOINTS
// ===================================================

// Get all regions with health status
router.get('/regions', async (req, res) => {
  try {
    const regionsData = multiRegionLoadOrchestrator.getRegions();
    const regionsArray = Array.from(regionsData.values());
    
    res.json({
      success: true,
      data: {
        total_regions: regionsArray.length,
        healthy_regions: regionsArray.filter(r => r.health.status === 'healthy').length,
        regions: regionsArray
      }
    });
    
    logger.info('Regions data retrieved', { 
      component: 'MultiRegionAPI',
      regionCount: regionsArray.length
    });
  } catch (error) {
    logger.error('Failed to get regions', { error, component: 'MultiRegionAPI' });
    res.status(500).json({ success: false, error: 'Failed to retrieve regions' });
  }
});

// Get specific region details
router.get('/regions/:regionId', async (req, res) => {
  try {
    const { regionId } = req.params;
    const region = multiRegionLoadOrchestrator.getRegion(regionId);
    
    if (!region) {
      return res.status(404).json({ success: false, error: 'Region not found' });
    }
    
    // Get recent health metrics for this region
    const healthMetrics = await db.select()
      .from(regionHealth)
      .where(eq(regionHealth.region_id, regionId))
      .orderBy(desc(regionHealth.check_timestamp))
      .limit(100);
    
    res.json({
      success: true,
      data: {
        region,
        health_history: healthMetrics,
        prediction: multiRegionLoadOrchestrator.getRegionPrediction(regionId)
      }
    });
    
    logger.info('Region details retrieved', { 
      component: 'MultiRegionAPI',
      regionId,
      healthRecords: healthMetrics.length
    });
  } catch (error) {
    logger.error('Failed to get region details', { error, component: 'MultiRegionAPI' });
    res.status(500).json({ success: false, error: 'Failed to retrieve region details' });
  }
});

// Update region configuration
const updateRegionSchema = z.object({
  capacity: z.object({
    max_concurrent_users: z.number().min(1),
    max_requests_per_second: z.number().min(1),
    bandwidth_mbps: z.number().min(1)
  }).optional(),
  load_balancing: z.object({
    weight: z.number().min(0).max(100),
    priority: z.number().min(1),
    sticky_sessions: z.boolean()
  }).optional(),
  auto_scaling: z.object({
    enabled: z.boolean(),
    min_instances: z.number().min(1),
    max_instances: z.number().min(1),
    target_cpu: z.number().min(1).max(100),
    target_memory: z.number().min(1).max(100),
    scale_up_threshold: z.number().min(1).max(100),
    scale_down_threshold: z.number().min(1).max(100)
  }).optional()
});

router.put('/regions/:regionId', async (req, res) => {
  try {
    const { regionId } = req.params;
    const updateData = updateRegionSchema.parse(req.body);
    
    const updated = await multiRegionLoadOrchestrator.updateRegionConfig(regionId, updateData);
    
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Region not found' });
    }
    
    res.json({ success: true, data: updated });
    
    logger.info('Region configuration updated', { 
      component: 'MultiRegionAPI',
      regionId,
      updateData
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    
    logger.error('Failed to update region', { error, component: 'MultiRegionAPI' });
    res.status(500).json({ success: false, error: 'Failed to update region' });
  }
});

// ===================================================
// LOAD BALANCING & ROUTING ENDPOINTS
// ===================================================

// Get optimal region for a user request
const routingRequestSchema = z.object({
  user_location: z.object({
    country: z.string().optional(),
    continent: z.string().optional(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number()
    }).optional(),
    ip: z.string().optional(),
    timezone: z.string().optional()
  }),
  user_agent: z.string().optional(),
  session_id: z.string().optional(),
  user_id: z.string().optional(),
  request_type: z.enum(['api', 'static', 'websocket', 'stream']).default('api'),
  preferences: z.object({
    prefer_low_latency: z.boolean().default(true),
    sticky_session: z.boolean().default(false)
  }).optional()
});

router.post('/route', async (req, res) => {
  try {
    const requestData = routingRequestSchema.parse(req.body);
    
    const routingDecision = await multiRegionLoadOrchestrator.getOptimalRegion(requestData);
    
    // Store routing decision for analytics
    await db.insert(routingDecisions).values({
      user_id: requestData.user_id,
      session_id: requestData.session_id,
      request_id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_location: requestData.user_location,
      user_agent: requestData.user_agent,
      selected_region: routingDecision.region_id,
      routing_algorithm: routingDecision.algorithm,
      applied_rules: routingDecision.applied_rules,
      decision_factors: routingDecision.factors,
      response_time_prediction: routingDecision.predicted_response_time,
      confidence_score: routingDecision.confidence
    });
    
    res.json({
      success: true,
      data: routingDecision
    });
    
    logger.info('Routing decision made', { 
      component: 'MultiRegionAPI',
      selectedRegion: routingDecision.region_id,
      algorithm: routingDecision.algorithm,
      confidence: routingDecision.confidence
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    
    logger.error('Failed to route request', { error, component: 'MultiRegionAPI' });
    res.status(500).json({ success: false, error: 'Failed to route request' });
  }
});

// Get load balancing rules
router.get('/rules', async (req, res) => {
  try {
    const rules = await db.select()
      .from(loadBalancingRules)
      .orderBy(desc(loadBalancingRules.priority));
    
    const activeRules = multiRegionLoadOrchestrator.getActiveRules();
    
    res.json({
      success: true,
      data: {
        database_rules: rules,
        active_rules: activeRules,
        total_count: rules.length
      }
    });
  } catch (error) {
    logger.error('Failed to get load balancing rules', { error, component: 'MultiRegionAPI' });
    res.status(500).json({ success: false, error: 'Failed to retrieve rules' });
  }
});

// Create new load balancing rule
const createRuleSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(['geo', 'latency', 'capacity', 'custom', 'ai_driven']),
  conditions: z.array(z.object({
    type: z.enum(['country', 'continent', 'latency', 'load', 'time', 'user_type']),
    operator: z.enum(['equals', 'contains', 'greater_than', 'less_than', 'in_range']),
    value: z.any()
  })),
  actions: z.array(z.object({
    type: z.enum(['route_to_region', 'enable_caching', 'adjust_weight', 'failover']),
    parameters: z.any()
  })),
  priority: z.number().min(0).max(100),
  enabled: z.boolean().default(true)
});

router.post('/rules', async (req, res) => {
  try {
    const ruleData = createRuleSchema.parse(req.body);
    
    const newRule = await db.insert(loadBalancingRules).values({
      name: ruleData.name,
      type: ruleData.type,
      conditions: ruleData.conditions,
      actions: ruleData.actions,
      priority: ruleData.priority,
      enabled: ruleData.enabled,
      created_by: 'admin' // TODO: Get from authenticated user
    }).returning();
    
    // Update orchestrator with new rule
    await multiRegionLoadOrchestrator.reloadRules();
    
    res.json({ success: true, data: newRule[0] });
    
    logger.info('Load balancing rule created', { 
      component: 'MultiRegionAPI',
      ruleName: ruleData.name,
      ruleType: ruleData.type
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    
    logger.error('Failed to create rule', { error, component: 'MultiRegionAPI' });
    res.status(500).json({ success: false, error: 'Failed to create rule' });
  }
});

// ===================================================
// FAILOVER & DISASTER RECOVERY ENDPOINTS
// ===================================================

// Get failover events
router.get('/failover/events', async (req, res) => {
  try {
    const { limit = '50', from_date, to_date } = req.query;
    
    let query = db.select().from(failoverEvents);
    
    if (from_date && to_date) {
      query = query.where(and(
        gte(failoverEvents.created_at, new Date(from_date as string)),
        lte(failoverEvents.created_at, new Date(to_date as string))
      ));
    }
    
    const events = await query
      .orderBy(desc(failoverEvents.created_at))
      .limit(parseInt(limit as string));
    
    res.json({
      success: true,
      data: {
        events,
        total_count: events.length
      }
    });
  } catch (error) {
    logger.error('Failed to get failover events', { error, component: 'MultiRegionAPI' });
    res.status(500).json({ success: false, error: 'Failed to retrieve failover events' });
  }
});

// Trigger manual failover
const failoverSchema = z.object({
  from_region: z.string(),
  to_region: z.string(),
  reason: z.string(),
  notify_users: z.boolean().default(true),
  estimated_duration: z.number().optional()
});

router.post('/failover/trigger', async (req, res) => {
  try {
    const failoverData = failoverSchema.parse(req.body);
    
    const result = await multiRegionLoadOrchestrator.triggerFailover(
      failoverData.from_region,
      failoverData.to_region,
      failoverData.reason,
      false // manual failover
    );
    
    res.json({ success: true, data: result });
    
    logger.info('Manual failover triggered', { 
      component: 'MultiRegionAPI',
      fromRegion: failoverData.from_region,
      toRegion: failoverData.to_region,
      reason: failoverData.reason
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    
    logger.error('Failed to trigger failover', { error, component: 'MultiRegionAPI' });
    res.status(500).json({ success: false, error: 'Failed to trigger failover' });
  }
});

// Get disaster recovery plans
router.get('/disaster-recovery/plans', async (req, res) => {
  try {
    const plans = multiRegionLoadOrchestrator.getDisasterRecoveryPlans();
    
    res.json({
      success: true,
      data: {
        plans: Array.from(plans.values()),
        total_count: plans.size
      }
    });
  } catch (error) {
    logger.error('Failed to get disaster recovery plans', { error, component: 'MultiRegionAPI' });
    res.status(500).json({ success: false, error: 'Failed to retrieve disaster recovery plans' });
  }
});

// Test disaster recovery plan
router.post('/disaster-recovery/test/:planId', async (req, res) => {
  try {
    const { planId } = req.params;
    const { simulate_only = true } = req.body;
    
    const testResult = await multiRegionLoadOrchestrator.testDisasterRecoveryPlan(planId, simulate_only);
    
    res.json({ success: true, data: testResult });
    
    logger.info('Disaster recovery plan tested', { 
      component: 'MultiRegionAPI',
      planId,
      simulateOnly: simulate_only,
      success: testResult.success
    });
  } catch (error) {
    logger.error('Failed to test disaster recovery plan', { error, component: 'MultiRegionAPI' });
    res.status(500).json({ success: false, error: 'Failed to test disaster recovery plan' });
  }
});

// ===================================================
// ANALYTICS & MONITORING ENDPOINTS
// ===================================================

// Get traffic distribution analytics
router.get('/analytics/traffic', async (req, res) => {
  try {
    const { timeframe = '24h', region_id } = req.query;
    
    let startDate: Date;
    switch (timeframe) {
      case '1h':
        startDate = new Date(Date.now() - 60 * 60 * 1000);
        break;
      case '6h':
        startDate = new Date(Date.now() - 6 * 60 * 60 * 1000);
        break;
      case '24h':
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    }
    
    let query = db.select().from(trafficDistribution)
      .where(gte(trafficDistribution.timestamp, startDate));
    
    const analytics = await query
      .orderBy(desc(trafficDistribution.timestamp))
      .limit(1000);
    
    // Get current live metrics
    const liveMetrics = multiRegionLoadOrchestrator.getCurrentTrafficDistribution();
    
    res.json({
      success: true,
      data: {
        historical: analytics,
        live: liveMetrics,
        timeframe,
        total_records: analytics.length
      }
    });
  } catch (error) {
    logger.error('Failed to get traffic analytics', { error, component: 'MultiRegionAPI' });
    res.status(500).json({ success: false, error: 'Failed to retrieve traffic analytics' });
  }
});

// Get predictive analytics
router.get('/analytics/predictions', async (req, res) => {
  try {
    const predictions = multiRegionLoadOrchestrator.getPredictiveAnalytics();
    
    res.json({
      success: true,
      data: predictions
    });
  } catch (error) {
    logger.error('Failed to get predictive analytics', { error, component: 'MultiRegionAPI' });
    res.status(500).json({ success: false, error: 'Failed to retrieve predictive analytics' });
  }
});

// Get system health overview
router.get('/health/overview', async (req, res) => {
  try {
    const healthOverview = multiRegionLoadOrchestrator.getSystemHealthOverview();
    
    res.json({
      success: true,
      data: healthOverview
    });
  } catch (error) {
    logger.error('Failed to get health overview', { error, component: 'MultiRegionAPI' });
    res.status(500).json({ success: false, error: 'Failed to retrieve health overview' });
  }
});

// ===================================================
// ADMINISTRATIVE ENDPOINTS
// ===================================================

// Force health check on all regions
router.post('/admin/health-check', async (req, res) => {
  try {
    const healthResults = await multiRegionLoadOrchestrator.performHealthChecks();
    
    res.json({ success: true, data: healthResults });
    
    logger.info('Manual health check performed', { 
      component: 'MultiRegionAPI',
      regionCount: Object.keys(healthResults).length
    });
  } catch (error) {
    logger.error('Failed to perform health check', { error, component: 'MultiRegionAPI' });
    res.status(500).json({ success: false, error: 'Failed to perform health check' });
  }
});

// Get orchestrator status
router.get('/admin/status', async (req, res) => {
  try {
    const status = multiRegionLoadOrchestrator.getOrchestratorStatus();
    
    res.json({ success: true, data: status });
  } catch (error) {
    logger.error('Failed to get orchestrator status', { error, component: 'MultiRegionAPI' });
    res.status(500).json({ success: false, error: 'Failed to retrieve orchestrator status' });
  }
});

export default router;