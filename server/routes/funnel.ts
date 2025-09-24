import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { 
  funnelTemplates,
  funnelBlocks,
  userFunnelSessions,
  funnelEvents,
  funnelAnalytics,
  funnelABTests,
  funnelTriggers,
  funnelIntegrations,
  insertFunnelTemplateSchema,
  insertFunnelBlockSchema,
  insertUserFunnelSessionSchema,
  insertFunnelEventSchema,
  insertFunnelAnalyticsSchema,
  insertFunnelABTestSchema,
  insertFunnelTriggerSchema,
  insertFunnelIntegrationSchema
} from "@shared/schema";
import { eq, desc, count, and, gte, lte, sql, asc } from "drizzle-orm";
import { smartFunnelOrchestrator } from "../services/smartFunnelOrchestrator";

const router = Router();

// ===========================================
// FUNNEL TEMPLATE MANAGEMENT
// ===========================================

// Get all funnel templates
router.get("/api/funnel/templates", async (req, res) => {
  try {
    const { category, isPublic, isActive } = req.query;
    
    let query = db.select().from(funnelTemplates);
    
    if (category) {
      query = query.where(eq(funnelTemplates.category, category as string));
    }
    if (isPublic !== undefined) {
      query = query.where(eq(funnelTemplates.isPublic, isPublic === 'true'));
    }
    if (isActive !== undefined) {
      query = query.where(eq(funnelTemplates.isActive, isActive === 'true'));
    }
    
    const templates = await query.orderBy(desc(funnelTemplates.updatedAt));
    
    res.json({
      success: true,
      data: templates
    });
    
  } catch (error) {
    console.error("Error fetching funnel templates:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch funnel templates" 
    });
  }
});

// Get specific funnel template
router.get("/api/funnel/templates/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const [template] = await db
      .select()
      .from(funnelTemplates)
      .where(eq(funnelTemplates.id, id))
      .limit(1);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: "Funnel template not found"
      });
    }
    
    res.json({
      success: true,
      data: template
    });
    
  } catch (error) {
    console.error("Error fetching funnel template:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch funnel template" 
    });
  }
});

// Create funnel template
router.post("/api/funnel/templates", async (req, res) => {
  try {
    const templateData = insertFunnelTemplateSchema.parse(req.body);
    
    const [template] = await db
      .insert(funnelTemplates)
      .values({
        ...templateData,
        createdBy: req.user?.id || 'system',
        updatedAt: new Date()
      })
      .returning();
    
    res.status(201).json({
      success: true,
      data: template
    });
    
  } catch (error) {
    console.error("Error creating funnel template:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to create funnel template" 
    });
  }
});

// Update funnel template
router.put("/api/funnel/templates/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updateData = insertFunnelTemplateSchema.partial().parse(req.body);
    
    const [template] = await db
      .update(funnelTemplates)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(funnelTemplates.id, id))
      .returning();
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: "Funnel template not found"
      });
    }
    
    res.json({
      success: true,
      data: template
    });
    
  } catch (error) {
    console.error("Error updating funnel template:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to update funnel template" 
    });
  }
});

// Clone funnel template
router.post("/api/funnel/templates/:id/clone", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, slug } = req.body;
    
    const [originalTemplate] = await db
      .select()
      .from(funnelTemplates)
      .where(eq(funnelTemplates.id, id))
      .limit(1);
    
    if (!originalTemplate) {
      return res.status(404).json({
        success: false,
        error: "Funnel template not found"
      });
    }
    
    const [clonedTemplate] = await db
      .insert(funnelTemplates)
      .values({
        ...originalTemplate,
        id: undefined,
        name: name || `${originalTemplate.name} (Copy)`,
        slug: slug || `${originalTemplate.slug}-copy-${Date.now()}`,
        createdBy: req.user?.id || 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    res.status(201).json({
      success: true,
      data: clonedTemplate
    });
    
  } catch (error) {
    console.error("Error cloning funnel template:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to clone funnel template" 
    });
  }
});

// ===========================================
// FUNNEL BLOCK MANAGEMENT
// ===========================================

// Get all funnel blocks
router.get("/api/funnel/blocks", async (req, res) => {
  try {
    const { type, category, isReusable } = req.query;
    
    let query = db.select().from(funnelBlocks);
    
    if (type) {
      query = query.where(eq(funnelBlocks.type, type as string));
    }
    if (category) {
      query = query.where(eq(funnelBlocks.category, category as string));
    }
    if (isReusable !== undefined) {
      query = query.where(eq(funnelBlocks.isReusable, isReusable === 'true'));
    }
    
    const blocks = await query.orderBy(asc(funnelBlocks.name));
    
    res.json({
      success: true,
      data: blocks
    });
    
  } catch (error) {
    console.error("Error fetching funnel blocks:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch funnel blocks" 
    });
  }
});

// Create funnel block
router.post("/api/funnel/blocks", async (req, res) => {
  try {
    const blockData = insertFunnelBlockSchema.parse(req.body);
    
    const [block] = await db
      .insert(funnelBlocks)
      .values({
        ...blockData,
        createdBy: req.user?.id || 'system',
        updatedAt: new Date()
      })
      .returning();
    
    res.status(201).json({
      success: true,
      data: block
    });
    
  } catch (error) {
    console.error("Error creating funnel block:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to create funnel block" 
    });
  }
});

// ===========================================
// FUNNEL SESSION MANAGEMENT
// ===========================================

// Start funnel session
router.post("/api/funnel/sessions/start", async (req, res) => {
  try {
    const schema = z.object({
      funnelId: z.number(),
      sessionId: z.string(),
      userId: z.string().optional(),
      userVector: z.any().optional(),
      deviceInfo: z.any().optional(),
      geoLocation: z.any().optional(),
      referralSource: z.string().optional()
    });
    
    const sessionData = schema.parse(req.body);
    
    // Check if session already exists
    const [existingSession] = await db
      .select()
      .from(userFunnelSessions)
      .where(and(
        eq(userFunnelSessions.sessionId, sessionData.sessionId),
        eq(userFunnelSessions.funnelId, sessionData.funnelId)
      ))
      .limit(1);
    
    if (existingSession) {
      // Resume existing session
      const [updatedSession] = await db
        .update(userFunnelSessions)
        .set({
          lastActivityAt: new Date(),
          status: 'active'
        })
        .where(eq(userFunnelSessions.id, existingSession.id))
        .returning();
      
      return res.json({
        success: true,
        data: updatedSession,
        resumed: true
      });
    }
    
    // Create new session
    const [session] = await db
      .insert(userFunnelSessions)
      .values({
        ...sessionData,
        resumeToken: `${sessionData.sessionId}_${Date.now()}`
      })
      .returning();
    
    res.status(201).json({
      success: true,
      data: session,
      resumed: false
    });
    
  } catch (error) {
    console.error("Error starting funnel session:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to start funnel session" 
    });
  }
});

// Update funnel session
router.put("/api/funnel/sessions/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updateData = insertUserFunnelSessionSchema.partial().parse(req.body);
    
    const [session] = await db
      .update(userFunnelSessions)
      .set({
        ...updateData,
        lastActivityAt: new Date()
      })
      .where(eq(userFunnelSessions.id, id))
      .returning();
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: "Funnel session not found"
      });
    }
    
    res.json({
      success: true,
      data: session
    });
    
  } catch (error) {
    console.error("Error updating funnel session:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to update funnel session" 
    });
  }
});

// Complete funnel session
router.post("/api/funnel/sessions/:id/complete", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { conversionData, integrationTriggers } = req.body;
    
    const [session] = await db
      .update(userFunnelSessions)
      .set({
        status: 'completed',
        completedAt: new Date(),
        lastActivityAt: new Date(),
        metadata: sql`COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify({ conversionData })}`
      })
      .where(eq(userFunnelSessions.id, id))
      .returning();
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: "Funnel session not found"
      });
    }
    
    // Trigger integrations if specified
    if (integrationTriggers && integrationTriggers.length > 0) {
      // Process integration triggers asynchronously
      processIntegrationTriggers(session, integrationTriggers);
    }
    
    res.json({
      success: true,
      data: session
    });
    
  } catch (error) {
    console.error("Error completing funnel session:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to complete funnel session" 
    });
  }
});

// ===========================================
// FUNNEL EVENT TRACKING
// ===========================================

// Track funnel event
router.post("/api/funnel/events", async (req, res) => {
  try {
    const eventData = insertFunnelEventSchema.parse(req.body);
    
    const [event] = await db
      .insert(funnelEvents)
      .values(eventData)
      .returning();
    
    // Process event for real-time personalization
    processEventForPersonalization(event);
    
    res.status(201).json({
      success: true,
      data: event
    });
    
  } catch (error) {
    console.error("Error tracking funnel event:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to track funnel event" 
    });
  }
});

// Batch track funnel events
router.post("/api/funnel/events/batch", async (req, res) => {
  try {
    const { events } = req.body;
    
    if (!Array.isArray(events)) {
      return res.status(400).json({
        success: false,
        error: "Events must be an array"
      });
    }
    
    const validatedEvents = events.map(event => insertFunnelEventSchema.parse(event));
    
    const insertedEvents = await db
      .insert(funnelEvents)
      .values(validatedEvents)
      .returning();
    
    // Process events for real-time personalization
    insertedEvents.forEach(processEventForPersonalization);
    
    res.status(201).json({
      success: true,
      data: insertedEvents,
      processed: insertedEvents.length
    });
    
  } catch (error) {
    console.error("Error batch tracking funnel events:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to batch track funnel events" 
    });
  }
});

// ===========================================
// FUNNEL ANALYTICS
// ===========================================

// Get funnel analytics
router.get("/api/funnel/analytics/:funnelId", async (req, res) => {
  try {
    const funnelId = parseInt(req.params.funnelId);
    const { 
      startDate, 
      endDate, 
      period = 'daily', 
      blockId,
      segment,
      variant 
    } = req.query;
    
    let query = db
      .select()
      .from(funnelAnalytics)
      .where(eq(funnelAnalytics.funnelId, funnelId));
    
    if (startDate) {
      query = query.where(gte(funnelAnalytics.date, new Date(startDate as string)));
    }
    if (endDate) {
      query = query.where(lte(funnelAnalytics.date, new Date(endDate as string)));
    }
    if (period) {
      query = query.where(eq(funnelAnalytics.period, period as string));
    }
    if (blockId) {
      query = query.where(eq(funnelAnalytics.blockId, parseInt(blockId as string)));
    }
    if (segment) {
      query = query.where(eq(funnelAnalytics.segment, segment as string));
    }
    if (variant) {
      query = query.where(eq(funnelAnalytics.variant, variant as string));
    }
    
    const analytics = await query.orderBy(desc(funnelAnalytics.date));
    
    res.json({
      success: true,
      data: analytics
    });
    
  } catch (error) {
    console.error("Error fetching funnel analytics:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch funnel analytics" 
    });
  }
});

// Get funnel performance summary
router.get("/api/funnel/analytics/:funnelId/summary", async (req, res) => {
  try {
    const funnelId = parseInt(req.params.funnelId);
    const { days = 30 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days as string));
    
    // Get aggregated metrics
    const summary = await db
      .select({
        totalViews: sql<number>`SUM(${funnelAnalytics.views})`,
        totalInteractions: sql<number>`SUM(${funnelAnalytics.interactions})`,
        totalCompletions: sql<number>`SUM(${funnelAnalytics.completions})`,
        totalConversions: sql<number>`SUM(${funnelAnalytics.conversions})`,
        totalRevenue: sql<number>`SUM(${funnelAnalytics.revenue})`,
        avgConversionRate: sql<number>`AVG(${funnelAnalytics.conversionRate})`,
        avgEngagementScore: sql<number>`AVG(${funnelAnalytics.engagementScore})`
      })
      .from(funnelAnalytics)
      .where(and(
        eq(funnelAnalytics.funnelId, funnelId),
        gte(funnelAnalytics.date, startDate)
      ));
    
    res.json({
      success: true,
      data: summary[0] || {
        totalViews: 0,
        totalInteractions: 0,
        totalCompletions: 0,
        totalConversions: 0,
        totalRevenue: 0,
        avgConversionRate: 0,
        avgEngagementScore: 0
      }
    });
    
  } catch (error) {
    console.error("Error fetching funnel summary:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch funnel summary" 
    });
  }
});

// ===========================================
// A/B TESTING MANAGEMENT
// ===========================================

// Create A/B test
router.post("/api/funnel/ab-tests", async (req, res) => {
  try {
    const testData = insertFunnelABTestSchema.parse(req.body);
    
    const [test] = await db
      .insert(funnelABTests)
      .values({
        ...testData,
        createdBy: req.user?.id || 'system'
      })
      .returning();
    
    res.status(201).json({
      success: true,
      data: test
    });
    
  } catch (error) {
    console.error("Error creating A/B test:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to create A/B test" 
    });
  }
});

// Start A/B test
router.post("/api/funnel/ab-tests/:id/start", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const [test] = await db
      .update(funnelABTests)
      .set({
        status: 'running',
        startedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(funnelABTests.id, id))
      .returning();
    
    if (!test) {
      return res.status(404).json({
        success: false,
        error: "A/B test not found"
      });
    }
    
    res.json({
      success: true,
      data: test
    });
    
  } catch (error) {
    console.error("Error starting A/B test:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to start A/B test" 
    });
  }
});

// ===========================================
// TRIGGER MANAGEMENT
// ===========================================

// Get active triggers
router.get("/api/funnel/triggers", async (req, res) => {
  try {
    const { funnelId, triggerType } = req.query;
    
    let query = db
      .select()
      .from(funnelTriggers)
      .where(eq(funnelTriggers.isActive, true));
    
    if (funnelId) {
      query = query.where(eq(funnelTriggers.funnelId, parseInt(funnelId as string)));
    }
    if (triggerType) {
      query = query.where(eq(funnelTriggers.triggerType, triggerType as string));
    }
    
    const triggers = await query.orderBy(asc(funnelTriggers.priority));
    
    res.json({
      success: true,
      data: triggers
    });
    
  } catch (error) {
    console.error("Error fetching funnel triggers:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch funnel triggers" 
    });
  }
});

// Create trigger
router.post("/api/funnel/triggers", async (req, res) => {
  try {
    const triggerData = insertFunnelTriggerSchema.parse(req.body);
    
    const [trigger] = await db
      .insert(funnelTriggers)
      .values(triggerData)
      .returning();
    
    res.status(201).json({
      success: true,
      data: trigger
    });
    
  } catch (error) {
    console.error("Error creating funnel trigger:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to create funnel trigger" 
    });
  }
});

// ===========================================
// INTEGRATION MANAGEMENT
// ===========================================

// Get integrations
router.get("/api/funnel/integrations", async (req, res) => {
  try {
    const { type, isActive } = req.query;
    
    let query = db.select().from(funnelIntegrations);
    
    if (type) {
      query = query.where(eq(funnelIntegrations.type, type as string));
    }
    if (isActive !== undefined) {
      query = query.where(eq(funnelIntegrations.isActive, isActive === 'true'));
    }
    
    const integrations = await query.orderBy(asc(funnelIntegrations.name));
    
    // Don't return sensitive credentials
    const sanitized = integrations.map(integration => ({
      ...integration,
      credentials: integration.credentials ? '[ENCRYPTED]' : null
    }));
    
    res.json({
      success: true,
      data: sanitized
    });
    
  } catch (error) {
    console.error("Error fetching funnel integrations:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch funnel integrations" 
    });
  }
});

// Create integration
router.post("/api/funnel/integrations", async (req, res) => {
  try {
    const integrationData = insertFunnelIntegrationSchema.parse(req.body);
    
    // Encrypt credentials if provided
    if (integrationData.credentials) {
      // In production, use proper encryption
      integrationData.credentials = { encrypted: true, data: integrationData.credentials };
    }
    
    const [integration] = await db
      .insert(funnelIntegrations)
      .values(integrationData)
      .returning();
    
    res.status(201).json({
      success: true,
      data: {
        ...integration,
        credentials: integration.credentials ? '[ENCRYPTED]' : null
      }
    });
    
  } catch (error) {
    console.error("Error creating funnel integration:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to create funnel integration" 
    });
  }
});

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

async function processEventForPersonalization(event: any) {
  try {
    // Real-time event processing for AI personalization
    // This would integrate with the ML engine for real-time decisions
    console.log(`Processing event for personalization: ${event.eventType}`);
    
    // Update user engagement score
    if (event.funnelSessionId) {
      await db
        .update(userFunnelSessions)
        .set({
          lastActivityAt: new Date(),
          engagementScore: sql`COALESCE(engagement_score, 0) + 1`
        })
        .where(eq(userFunnelSessions.id, event.funnelSessionId));
    }
    
  } catch (error) {
    console.error("Error processing event for personalization:", error);
  }
}

async function processIntegrationTriggers(session: any, triggers: string[]) {
  try {
    // Process integration triggers for completed funnels
    console.log(`Processing integration triggers for session ${session.id}:`, triggers);
    
    // Get active integrations
    const integrations = await db
      .select()
      .from(funnelIntegrations)
      .where(eq(funnelIntegrations.isActive, true));
    
    // Process each trigger
    for (const integrationName of triggers) {
      const integration = integrations.find(i => i.name === integrationName);
      if (integration) {
        // Execute integration webhook/API call
        await executeIntegration(integration, session);
      }
    }
    
  } catch (error) {
    console.error("Error processing integration triggers:", error);
  }
}

async function executeIntegration(integration: any, sessionData: any) {
  try {
    console.log(`Executing integration: ${integration.name}`);
    
    // This would make actual API calls to external systems
    // For now, just log the integration execution
    
    // Update integration stats
    await db
      .update(funnelIntegrations)
      .set({
        lastSync: new Date()
      })
      .where(eq(funnelIntegrations.id, integration.id));
    
  } catch (error) {
    console.error(`Error executing integration ${integration.name}:`, error);
    
    // Update error count
    await db
      .update(funnelIntegrations)
      .set({
        errorCount: sql`error_count + 1`,
        lastError: error.message
      })
      .where(eq(funnelIntegrations.id, integration.id));
  }
}

// ===========================================
// SMART FUNNEL ORCHESTRATION (ADVANCED AI)
// ===========================================

// Orchestrate next funnel step with AI decision-making
router.post("/api/funnel/orchestrate/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { currentBlockId, userInteraction } = req.body;

    const decision = await smartFunnelOrchestrator.orchestrateFunnelStep(
      sessionId,
      currentBlockId,
      userInteraction
    );

    res.json({
      success: true,
      data: decision
    });

  } catch (error) {
    console.error("Error in funnel orchestration:", error);
    res.status(500).json({
      success: false,
      error: "Failed to orchestrate funnel step"
    });
  }
});

// Real-time funnel optimization
router.post("/api/funnel/optimize/:funnelId", async (req, res) => {
  try {
    const funnelId = parseInt(req.params.funnelId);
    
    const result = await smartFunnelOrchestrator.optimizeFunnelFlow(funnelId);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error("Error optimizing funnel:", error);
    res.status(500).json({
      success: false,
      error: "Failed to optimize funnel"
    });
  }
});

// Simulate funnel journeys for testing
router.post("/api/funnel/simulate/:funnelId", async (req, res) => {
  try {
    const funnelId = parseInt(req.params.funnelId);
    const { scenarios } = req.body;

    if (!Array.isArray(scenarios)) {
      return res.status(400).json({
        success: false,
        error: "Scenarios must be an array"
      });
    }

    const results = await smartFunnelOrchestrator.simulateFunnelJourneys(funnelId, scenarios);

    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error("Error simulating funnel journeys:", error);
    res.status(500).json({
      success: false,
      error: "Failed to simulate funnel journeys"
    });
  }
});

// Get AI-powered funnel insights
router.get("/api/funnel/insights/:funnelId", async (req, res) => {
  try {
    const funnelId = parseInt(req.params.funnelId);
    const { days = 30 } = req.query;

    // Get comprehensive funnel analytics
    const analytics = await db
      .select()
      .from(funnelAnalytics)
      .where(and(
        eq(funnelAnalytics.funnelId, funnelId),
        gte(funnelAnalytics.date, new Date(Date.now() - parseInt(days as string) * 24 * 60 * 60 * 1000))
      ))
      .orderBy(desc(funnelAnalytics.date));

    // Generate AI insights
    const insights = {
      conversionTrends: analytics.map(a => ({
        date: a.date,
        conversionRate: a.conversionRate,
        revenue: a.revenue
      })),
      topPerformingBlocks: analytics
        .filter(a => a.blockId)
        .sort((a, b) => b.conversionRate - a.conversionRate)
        .slice(0, 5),
      dropoffAnalysis: analytics
        .filter(a => a.bounceRate > 0.5)
        .map(a => ({
          blockId: a.blockId,
          bounceRate: a.bounceRate,
          suggestions: generateOptimizationSuggestions(a)
        })),
      performanceSummary: {
        totalSessions: analytics.reduce((sum, a) => sum + a.views, 0),
        averageConversionRate: analytics.reduce((sum, a) => sum + a.conversionRate, 0) / analytics.length,
        totalRevenue: analytics.reduce((sum, a) => sum + a.revenue, 0),
        averageEngagement: analytics.reduce((sum, a) => sum + a.engagementScore, 0) / analytics.length
      }
    };

    res.json({
      success: true,
      data: insights
    });

  } catch (error) {
    console.error("Error generating funnel insights:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate funnel insights"
    });
  }
});

// Helper function for generating optimization suggestions
function generateOptimizationSuggestions(analytics: any): string[] {
  const suggestions = [];

  if (analytics.bounceRate > 0.7) {
    suggestions.push("Consider simplifying this block or adding engaging elements");
  }
  if (analytics.averageTimeSpent < 10000) {
    suggestions.push("Add more compelling content to increase engagement");
  }
  if (analytics.conversionRate < 0.05) {
    suggestions.push("Test stronger call-to-action buttons or social proof");
  }

  return suggestions;
}

export default router;