import { Router } from "express";
import { z } from "zod";
import { offerEngineCore } from "../services/offer-engine/offerEngineCore";
import { offerSyncEngine } from "../services/offer-engine/offerSyncEngine";
import { offerPersonalizationEngine } from "../services/offer-engine/offerPersonalizationEngine";
import {
  insertOfferSourceSchema,
  insertOfferFeedSchema,
  insertOfferAnalyticsSchema,
  insertOfferPersonalizationRuleSchema,
  insertOfferExperimentSchema,
  insertOfferComplianceRuleSchema,
  insertOfferAiOptimizationQueueSchema
} from "@shared/schema";

const router = Router();

// ================================================
// OFFER SOURCE MANAGEMENT ROUTES
// ================================================

// GET /api/offer-engine/sources - Get all offer sources
router.get("/sources", async (req, res) => {
  try {
    const sources = await offerEngineCore.getOfferSources();
    res.json(sources);
  } catch (error) {
    console.error("Error fetching offer sources:", error);
    res.status(500).json({ error: "Failed to fetch offer sources" });
  }
});

// POST /api/offer-engine/sources - Create new offer source
router.post("/sources", async (req, res) => {
  try {
    const sourceData = insertOfferSourceSchema.parse(req.body);
    const source = await offerEngineCore.createOfferSource(sourceData);
    res.status(201).json(source);
  } catch (error) {
    console.error("Error creating offer source:", error);
    res.status(400).json({ error: "Invalid source data" });
  }
});

// GET /api/offer-engine/sources/:slug - Get source by slug
router.get("/sources/:slug", async (req, res) => {
  try {
    const source = await offerEngineCore.getOfferSourceBySlug(req.params.slug);
    if (!source) {
      return res.status(404).json({ error: "Source not found" });
    }
    res.json(source);
  } catch (error) {
    console.error("Error fetching source:", error);
    res.status(500).json({ error: "Failed to fetch source" });
  }
});

// PUT /api/offer-engine/sources/:id - Update source
router.put("/sources/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = insertOfferSourceSchema.partial().parse(req.body);
    const source = await offerEngineCore.updateOfferSource(id, updates);
    res.json(source);
  } catch (error) {
    console.error("Error updating source:", error);
    res.status(400).json({ error: "Failed to update source" });
  }
});

// DELETE /api/offer-engine/sources/:id - Deactivate source
router.delete("/sources/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await offerEngineCore.deactivateOfferSource(id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deactivating source:", error);
    res.status(500).json({ error: "Failed to deactivate source" });
  }
});

// ================================================
// OFFER FEED MANAGEMENT ROUTES
// ================================================

// GET /api/offer-engine/offers - Get offers with filters
router.get("/offers", async (req, res) => {
  try {
    const filters = {
      merchant: req.query.merchant as string,
      category: req.query.category as string,
      emotion: req.query.emotion as string,
      region: req.query.region as string,
      priceMin: req.query.priceMin ? parseFloat(req.query.priceMin as string) : undefined,
      priceMax: req.query.priceMax ? parseFloat(req.query.priceMax as string) : undefined,
      isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
      isExpired: req.query.isExpired ? req.query.isExpired === 'true' : undefined,
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      sortBy: req.query.sortBy as 'relevance' | 'price' | 'ctr' | 'conversion' | 'revenue' | 'updated',
      sortOrder: req.query.sortOrder as 'asc' | 'desc'
    };
    
    const offers = await offerEngineCore.getOffers(filters);
    res.json(offers);
  } catch (error) {
    console.error("Error fetching offers:", error);
    res.status(500).json({ error: "Failed to fetch offers" });
  }
});

// POST /api/offer-engine/offers - Create new offer
router.post("/offers", async (req, res) => {
  try {
    const offerData = insertOfferFeedSchema.parse(req.body);
    const offer = await offerEngineCore.createOffer(offerData);
    res.status(201).json(offer);
  } catch (error) {
    console.error("Error creating offer:", error);
    res.status(400).json({ error: "Invalid offer data" });
  }
});

// GET /api/offer-engine/offers/:slug - Get offer by slug
router.get("/offers/:slug", async (req, res) => {
  try {
    const offer = await offerEngineCore.getOfferBySlug(req.params.slug);
    if (!offer) {
      return res.status(404).json({ error: "Offer not found" });
    }
    res.json(offer);
  } catch (error) {
    console.error("Error fetching offer:", error);
    res.status(500).json({ error: "Failed to fetch offer" });
  }
});

// PUT /api/offer-engine/offers/:id - Update offer
router.put("/offers/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = insertOfferFeedSchema.partial().parse(req.body);
    const offer = await offerEngineCore.updateOffer(id, updates);
    res.json(offer);
  } catch (error) {
    console.error("Error updating offer:", error);
    res.status(400).json({ error: "Failed to update offer" });
  }
});

// DELETE /api/offer-engine/offers/:id - Delete offer
router.delete("/offers/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await offerEngineCore.deleteOffer(id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting offer:", error);
    res.status(500).json({ error: "Failed to delete offer" });
  }
});

// ================================================
// PERSONALIZATION & SEARCH ROUTES
// ================================================

// POST /api/offer-engine/search - Advanced offer search
router.post("/search", async (req, res) => {
  try {
    const searchQuery = req.body;
    const offers = await offerEngineCore.searchOffers(searchQuery);
    res.json(offers);
  } catch (error) {
    console.error("Error searching offers:", error);
    res.status(500).json({ error: "Failed to search offers" });
  }
});

// GET /api/offer-engine/personalized - Get personalized offers
router.get("/personalized", async (req, res) => {
  try {
    const sessionId = req.query.sessionId as string;
    const neuronId = req.query.neuronId as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }
    
    const context = {
      sessionId,
      neuronId,
      userId: req.query.userId as string,
      geoLocation: req.query.geoLocation as string,
      deviceType: req.query.deviceType as string,
      userAgent: req.headers['user-agent'],
      referrer: req.headers.referer,
      currentPage: req.query.currentPage as string,
      intent: req.query.intent as string,
      emotion: req.query.emotion as string
    };
    
    const offers = await offerPersonalizationEngine.getPersonalizedOffers(context, limit);
    res.json(offers);
  } catch (error) {
    console.error("Error getting personalized offers:", error);
    res.status(500).json({ error: "Failed to get personalized offers" });
  }
});

// GET /api/offer-engine/category/:category - Get offers by category
router.get("/category/:category", async (req, res) => {
  try {
    const offers = await offerEngineCore.getOffersByCategory(req.params.category);
    res.json(offers);
  } catch (error) {
    console.error("Error fetching offers by category:", error);
    res.status(500).json({ error: "Failed to fetch offers by category" });
  }
});

// GET /api/offer-engine/emotion/:emotion - Get offers by emotion
router.get("/emotion/:emotion", async (req, res) => {
  try {
    const offers = await offerEngineCore.getOffersByEmotion(req.params.emotion);
    res.json(offers);
  } catch (error) {
    console.error("Error fetching offers by emotion:", error);
    res.status(500).json({ error: "Failed to fetch offers by emotion" });
  }
});

// GET /api/offer-engine/neuron/:neuronId - Get offers for neuron
router.get("/neuron/:neuronId", async (req, res) => {
  try {
    const offers = await offerEngineCore.getOffersByNeuron(req.params.neuronId);
    res.json(offers);
  } catch (error) {
    console.error("Error fetching offers for neuron:", error);
    res.status(500).json({ error: "Failed to fetch offers for neuron" });
  }
});

// ================================================
// ANALYTICS & TRACKING ROUTES
// ================================================

// POST /api/offer-engine/analytics/track - Track offer analytics
router.post("/analytics/track", async (req, res) => {
  try {
    const analyticsData = insertOfferAnalyticsSchema.parse(req.body);
    const analytics = await offerEngineCore.trackOfferAnalytics(analyticsData);
    res.status(201).json(analytics);
  } catch (error) {
    console.error("Error tracking analytics:", error);
    res.status(400).json({ error: "Invalid analytics data" });
  }
});

// GET /api/offer-engine/analytics/:offerId - Get offer analytics
router.get("/analytics/:offerId", async (req, res) => {
  try {
    const offerId = parseInt(req.params.offerId);
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    
    const analytics = await offerEngineCore.getOfferAnalytics(offerId, startDate, endDate);
    res.json(analytics);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// GET /api/offer-engine/analytics/:offerId/performance - Get offer performance stats
router.get("/analytics/:offerId/performance", async (req, res) => {
  try {
    const offerId = parseInt(req.params.offerId);
    const stats = await offerEngineCore.getOfferPerformanceStats(offerId);
    res.json(stats);
  } catch (error) {
    console.error("Error fetching performance stats:", error);
    res.status(500).json({ error: "Failed to fetch performance stats" });
  }
});

// GET /api/offer-engine/analytics/top-performing - Get top performing offers
router.get("/analytics/top-performing", async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const offers = await offerEngineCore.getTopPerformingOffers(limit);
    res.json(offers);
  } catch (error) {
    console.error("Error fetching top performing offers:", error);
    res.status(500).json({ error: "Failed to fetch top performing offers" });
  }
});

// ================================================
// SYNC ENGINE ROUTES
// ================================================

// POST /api/offer-engine/sync/trigger - Trigger manual sync
router.post("/sync/trigger", async (req, res) => {
  try {
    const results = await offerSyncEngine.triggerFullSync();
    res.json(results);
  } catch (error) {
    console.error("Error triggering sync:", error);
    res.status(500).json({ error: "Failed to trigger sync" });
  }
});

// POST /api/offer-engine/sync/source/:slug - Trigger source-specific sync
router.post("/sync/source/:slug", async (req, res) => {
  try {
    const result = await offerSyncEngine.triggerSourceSync(req.params.slug);
    res.json(result);
  } catch (error) {
    console.error("Error triggering source sync:", error);
    res.status(500).json({ error: "Failed to trigger source sync" });
  }
});

// GET /api/offer-engine/sync/history - Get sync history
router.get("/sync/history", async (req, res) => {
  try {
    const sourceId = req.query.sourceId ? parseInt(req.query.sourceId as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    
    const history = await offerEngineCore.getOfferSyncHistory(sourceId, limit);
    res.json(history);
  } catch (error) {
    console.error("Error fetching sync history:", error);
    res.status(500).json({ error: "Failed to fetch sync history" });
  }
});

// ================================================
// PERSONALIZATION RULES ROUTES
// ================================================

// GET /api/offer-engine/personalization/rules - Get personalization rules
router.get("/personalization/rules", async (req, res) => {
  try {
    const rules = await offerPersonalizationEngine.getActivePersonalizationRules();
    res.json(rules);
  } catch (error) {
    console.error("Error fetching personalization rules:", error);
    res.status(500).json({ error: "Failed to fetch personalization rules" });
  }
});

// POST /api/offer-engine/personalization/rules - Create personalization rule
router.post("/personalization/rules", async (req, res) => {
  try {
    const ruleData = insertOfferPersonalizationRuleSchema.parse(req.body);
    const rule = await offerPersonalizationEngine.createPersonalizationRule(ruleData);
    res.status(201).json(rule);
  } catch (error) {
    console.error("Error creating personalization rule:", error);
    res.status(400).json({ error: "Invalid rule data" });
  }
});

// PUT /api/offer-engine/personalization/rules/:id - Update personalization rule
router.put("/personalization/rules/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = insertOfferPersonalizationRuleSchema.partial().parse(req.body);
    const rule = await offerPersonalizationEngine.updatePersonalizationRule(id, updates);
    res.json(rule);
  } catch (error) {
    console.error("Error updating personalization rule:", error);
    res.status(400).json({ error: "Failed to update rule" });
  }
});

// ================================================
// COMPLIANCE ROUTES
// ================================================

// GET /api/offer-engine/compliance/rules - Get compliance rules
router.get("/compliance/rules", async (req, res) => {
  try {
    const rules = await offerEngineCore.getComplianceRules();
    res.json(rules);
  } catch (error) {
    console.error("Error fetching compliance rules:", error);
    res.status(500).json({ error: "Failed to fetch compliance rules" });
  }
});

// POST /api/offer-engine/compliance/rules - Create compliance rule
router.post("/compliance/rules", async (req, res) => {
  try {
    const ruleData = insertOfferComplianceRuleSchema.parse(req.body);
    const rule = await offerEngineCore.createComplianceRule(ruleData);
    res.status(201).json(rule);
  } catch (error) {
    console.error("Error creating compliance rule:", error);
    res.status(400).json({ error: "Invalid compliance rule data" });
  }
});

// GET /api/offer-engine/compliance/check/:offerId - Check offer compliance
router.get("/compliance/check/:offerId", async (req, res) => {
  try {
    const offerId = parseInt(req.params.offerId);
    const isCompliant = await offerEngineCore.checkOfferCompliance(offerId);
    res.json({ offerId, isCompliant });
  } catch (error) {
    console.error("Error checking compliance:", error);
    res.status(500).json({ error: "Failed to check compliance" });
  }
});

// ================================================
// AI OPTIMIZATION ROUTES
// ================================================

// GET /api/offer-engine/ai-optimization/tasks - Get AI optimization tasks
router.get("/ai-optimization/tasks", async (req, res) => {
  try {
    const status = req.query.status as string;
    const tasks = await offerEngineCore.getAiOptimizationTasks(status);
    res.json(tasks);
  } catch (error) {
    console.error("Error fetching AI optimization tasks:", error);
    res.status(500).json({ error: "Failed to fetch AI optimization tasks" });
  }
});

// POST /api/offer-engine/ai-optimization/tasks - Add AI optimization task
router.post("/ai-optimization/tasks", async (req, res) => {
  try {
    const taskData = insertOfferAiOptimizationQueueSchema.parse(req.body);
    const task = await offerEngineCore.addAiOptimizationTask(taskData);
    res.status(201).json(task);
  } catch (error) {
    console.error("Error adding AI optimization task:", error);
    res.status(400).json({ error: "Invalid task data" });
  }
});

// PUT /api/offer-engine/ai-optimization/tasks/:id - Update AI optimization task
router.put("/ai-optimization/tasks/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = insertOfferAiOptimizationQueueSchema.partial().parse(req.body);
    const task = await offerEngineCore.updateAiOptimizationTask(id, updates);
    res.json(task);
  } catch (error) {
    console.error("Error updating AI optimization task:", error);
    res.status(400).json({ error: "Failed to update task" });
  }
});

// ================================================
// DASHBOARD STATS ROUTES (Billion-Dollar Empire Grade)
// ================================================

// GET /api/offer-engine/dashboard/stats - Comprehensive dashboard statistics
router.get("/dashboard/stats", async (req, res) => {
  try {
    // Get comprehensive stats for admin dashboard
    const totalOffers = await db.select({ count: sql<number>`COUNT(*)` }).from(offerFeed);
    const activeOffers = await db.select({ count: sql<number>`COUNT(*)` }).from(offerFeed)
      .where(and(eq(offerFeed.isActive, true), eq(offerFeed.isExpired, false)));
    
    // Revenue and performance metrics
    const revenueStats = await db.select({
      totalRevenue: sql<number>`COALESCE(SUM(${offerFeed.revenueGenerated}), 0)`,
      avgCtr: sql<number>`COALESCE(AVG(${offerFeed.ctr}), 0)`,
      avgConversionRate: sql<number>`COALESCE(AVG(${offerFeed.conversionRate}), 0)`
    }).from(offerFeed);
    
    // Conversion analytics
    const conversionStats = await db.select({
      totalConversions: sql<number>`COUNT(CASE WHEN ${offerAnalytics.eventType} = 'conversion' THEN 1 END)`
    }).from(offerAnalytics);
    
    const stats = {
      totalOffers: totalOffers[0].count,
      activeOffers: activeOffers[0].count,
      totalRevenue: revenueStats[0].totalRevenue,
      avgCtr: revenueStats[0].avgCtr,
      avgConversionRate: revenueStats[0].avgConversionRate,
      totalConversions: conversionStats[0].totalConversions
    };
    
    res.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
});

export default router;