/**
 * Smart Funnel Generator API Routes
 * Billion-Dollar Empire Grade Universal Funnel Engine API
 */

import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { smartFunnelEngine } from "../services/smartFunnel/smartFunnelEngine";
import { smartFunnelOrchestrator } from "../services/smartFunnel/smartFunnelOrchestrator";
import { 
  insertFunnelBlueprintSchema,
  insertFunnelInstanceSchema,
  insertFunnelExperimentSchema
} from "../../shared/smartFunnelTables";

const router = Router();

// =====================================================
// FUNNEL BLUEPRINT MANAGEMENT
// =====================================================

/**
 * Create new funnel blueprint
 */
router.post('/blueprints', async (req, res) => {
  try {
    const validatedData = insertFunnelBlueprintSchema.parse(req.body);
    const blueprint = await storage.createFunnelBlueprint(validatedData);
    
    res.json({
      success: true,
      data: blueprint
    });
  } catch (error) {
    console.error('[SmartFunnel] Error creating blueprint:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create blueprint'
    });
  }
});

/**
 * Get all funnel blueprints
 */
router.get('/blueprints', async (req, res) => {
  try {
    const { vertical, type, status } = req.query;
    const filters = {
      vertical: vertical as string,
      type: type as string,
      status: status as string
    };
    
    const blueprints = await storage.getFunnelBlueprints(filters);
    
    res.json({
      success: true,
      data: blueprints
    });
  } catch (error) {
    console.error('[SmartFunnel] Error getting blueprints:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get blueprints'
    });
  }
});

/**
 * Get specific funnel blueprint
 */
router.get('/blueprints/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const blueprint = await storage.getFunnelBlueprint(id);
    
    if (!blueprint) {
      return res.status(404).json({
        success: false,
        error: 'Blueprint not found'
      });
    }
    
    res.json({
      success: true,
      data: blueprint
    });
  } catch (error) {
    console.error('[SmartFunnel] Error getting blueprint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get blueprint'
    });
  }
});

/**
 * Update funnel blueprint
 */
router.put('/blueprints/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const blueprint = await storage.updateFunnelBlueprint(id, updates);
    
    res.json({
      success: true,
      data: blueprint
    });
  } catch (error) {
    console.error('[SmartFunnel] Error updating blueprint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update blueprint'
    });
  }
});

/**
 * Delete funnel blueprint
 */
router.delete('/blueprints/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await storage.deleteFunnelBlueprint(id);
    
    res.json({
      success: true,
      message: 'Blueprint deleted successfully'
    });
  } catch (error) {
    console.error('[SmartFunnel] Error deleting blueprint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete blueprint'
    });
  }
});

// =====================================================
// FUNNEL INSTANCE MANAGEMENT
// =====================================================

/**
 * Initialize funnel instance
 */
router.post('/instances/initialize', async (req, res) => {
  try {
    const schema = z.object({
      blueprint_id: z.string(),
      session_id: z.string(),
      user_id: z.string().optional(),
      entry_point: z.string(),
      context: z.object({
        persona: z.string().optional(),
        quiz_results: z.record(z.any()).optional(),
        emotion_state: z.string().optional(),
        device_type: z.string().optional(),
        location: z.string().optional(),
        page_context: z.object({
          url: z.string(),
          title: z.string(),
          vertical: z.string()
        }).optional()
      })
    });

    const { blueprint_id, session_id, user_id, entry_point, context } = schema.parse(req.body);

    const instance = await smartFunnelEngine.initializeFunnelInstance(
      blueprint_id,
      {
        sessionId: session_id,
        userId: user_id,
        ...context
      },
      entry_point
    );

    res.json({
      success: true,
      data: instance
    });
  } catch (error) {
    console.error('[SmartFunnel] Error initializing instance:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initialize instance'
    });
  }
});

/**
 * Get next funnel block
 */
router.post('/instances/:sessionId/next-block', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { interaction } = req.body;

    const nextBlock = await smartFunnelEngine.getNextFunnelBlock(
      sessionId,
      interaction
    );

    res.json({
      success: true,
      data: nextBlock
    });
  } catch (error) {
    console.error('[SmartFunnel] Error getting next block:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get next block'
    });
  }
});

/**
 * Process block interaction
 */
router.post('/instances/:sessionId/interactions', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { block_id, action, data } = req.body;

    // Get current instance
    const instance = await storage.getFunnelInstanceBySession(sessionId);
    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Funnel instance not found'
      });
    }

    await smartFunnelEngine.processBlockInteraction(instance, {
      blockId: block_id,
      action,
      data
    });

    res.json({
      success: true,
      message: 'Interaction processed successfully'
    });
  } catch (error) {
    console.error('[SmartFunnel] Error processing interaction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process interaction'
    });
  }
});

/**
 * Complete funnel instance
 */
router.post('/instances/:sessionId/complete', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { completion_data } = req.body;

    await smartFunnelEngine.completeFunnelInstance(sessionId, completion_data);

    res.json({
      success: true,
      message: 'Funnel completed successfully'
    });
  } catch (error) {
    console.error('[SmartFunnel] Error completing funnel:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete funnel'
    });
  }
});

/**
 * Abandon funnel instance
 */
router.post('/instances/:sessionId/abandon', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { reason } = req.body;

    await smartFunnelEngine.abandonFunnelInstance(sessionId, reason);

    res.json({
      success: true,
      message: 'Funnel abandoned successfully'
    });
  } catch (error) {
    console.error('[SmartFunnel] Error abandoning funnel:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to abandon funnel'
    });
  }
});

/**
 * Get funnel instance details
 */
router.get('/instances/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const instance = await storage.getFunnelInstanceBySession(sessionId);

    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Funnel instance not found'
      });
    }

    res.json({
      success: true,
      data: instance
    });
  } catch (error) {
    console.error('[SmartFunnel] Error getting instance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get instance'
    });
  }
});

// =====================================================
// FUNNEL ANALYTICS
// =====================================================

/**
 * Get funnel analytics
 */
router.get('/analytics/:blueprintId', async (req, res) => {
  try {
    const { blueprintId } = req.params;
    const { start_date, end_date, segmentation } = req.query;

    const dateRange = start_date && end_date ? {
      start: new Date(start_date as string),
      end: new Date(end_date as string)
    } : undefined;

    const segmentationArray = segmentation ? 
      (segmentation as string).split(',') : undefined;

    const analytics = await smartFunnelEngine.getFunnelAnalytics(
      blueprintId,
      dateRange,
      segmentationArray
    );

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('[SmartFunnel] Error getting analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics'
    });
  }
});

/**
 * Get funnel performance overview
 */
router.get('/analytics/:blueprintId/overview', async (req, res) => {
  try {
    const { blueprintId } = req.params;
    
    // Get basic funnel stats
    const instances = await storage.getFunnelInstancesByBlueprint(blueprintId);
    const events = await storage.getFunnelEventsByBlueprint(blueprintId);
    
    const totalStarts = instances.length;
    const completions = instances.filter(i => i.status === 'completed').length;
    const abandonments = instances.filter(i => i.status === 'abandoned').length;
    const active = instances.filter(i => i.status === 'active').length;
    
    const completionRate = totalStarts > 0 ? (completions / totalStarts * 100).toFixed(2) : '0';
    const abandonmentRate = totalStarts > 0 ? (abandonments / totalStarts * 100).toFixed(2) : '0';
    
    // Calculate average time to completion
    const completedInstances = instances.filter(i => i.status === 'completed' && i.completed_at);
    const avgTimeToCompletion = completedInstances.length > 0 ?
      completedInstances.reduce((sum, instance) => {
        const duration = new Date(instance.completed_at!).getTime() - new Date(instance.started_at).getTime();
        return sum + duration;
      }, 0) / completedInstances.length / 1000 / 60 : 0; // in minutes

    res.json({
      success: true,
      data: {
        total_starts: totalStarts,
        completions,
        abandonments,
        active,
        completion_rate: parseFloat(completionRate),
        abandonment_rate: parseFloat(abandonmentRate),
        avg_time_to_completion_minutes: Math.round(avgTimeToCompletion),
        total_events: events.length
      }
    });
  } catch (error) {
    console.error('[SmartFunnel] Error getting performance overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get performance overview'
    });
  }
});

// =====================================================
// A/B TESTING & EXPERIMENTS
// =====================================================

/**
 * Create A/B test experiment
 */
router.post('/experiments', async (req, res) => {
  try {
    const schema = z.object({
      blueprint_id: z.string(),
      name: z.string(),
      description: z.string().optional(),
      variants: z.array(z.object({
        name: z.string(),
        weight: z.number(),
        config_overrides: z.record(z.any()),
        is_control: z.boolean()
      })),
      targeting: z.record(z.any()).optional(),
      success_metrics: z.record(z.any())
    });

    const experimentConfig = schema.parse(req.body);

    const experiment = await smartFunnelEngine.createFunnelExperiment(
      experimentConfig.blueprint_id,
      experimentConfig
    );

    res.json({
      success: true,
      data: experiment
    });
  } catch (error) {
    console.error('[SmartFunnel] Error creating experiment:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create experiment'
    });
  }
});

/**
 * Get experiments for blueprint
 */
router.get('/experiments/blueprint/:blueprintId', async (req, res) => {
  try {
    const { blueprintId } = req.params;
    const experiments = await storage.getFunnelExperimentsByBlueprint(blueprintId);

    res.json({
      success: true,
      data: experiments
    });
  } catch (error) {
    console.error('[SmartFunnel] Error getting experiments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get experiments'
    });
  }
});

/**
 * Update experiment status
 */
router.put('/experiments/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const experiment = await storage.updateFunnelExperiment(id, { status });

    res.json({
      success: true,
      data: experiment
    });
  } catch (error) {
    console.error('[SmartFunnel] Error updating experiment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update experiment'
    });
  }
});

/**
 * Get experiment results
 */
router.get('/experiments/:id/results', async (req, res) => {
  try {
    const { id } = req.params;
    const experiment = await storage.getFunnelExperiment(id);

    if (!experiment) {
      return res.status(404).json({
        success: false,
        error: 'Experiment not found'
      });
    }

    // Calculate experiment results
    const instances = await storage.getFunnelInstancesByExperiment(id);
    const variants = experiment.variants as any[];
    
    const results = {
      participants: instances.length,
      conversions: instances.filter(i => i.status === 'completed').length,
      conversion_rate: instances.length > 0 ? 
        (instances.filter(i => i.status === 'completed').length / instances.length * 100) : 0,
      variant_performance: {} as Record<string, any>
    };

    // Calculate per-variant performance
    for (const variant of variants) {
      const variantInstances = instances.filter(i => i.variant_id === variant.id);
      const variantConversions = variantInstances.filter(i => i.status === 'completed').length;
      
      results.variant_performance[variant.id] = {
        participants: variantInstances.length,
        conversions: variantConversions,
        conversion_rate: variantInstances.length > 0 ? 
          (variantConversions / variantInstances.length * 100) : 0
      };
    }

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('[SmartFunnel] Error getting experiment results:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get experiment results'
    });
  }
});

// =====================================================
// FUNNEL OPTIMIZATION
// =====================================================

/**
 * Run AI-powered funnel optimization
 */
router.post('/optimization/:blueprintId/analyze', async (req, res) => {
  try {
    const { blueprintId } = req.params;
    
    const optimizations = await smartFunnelEngine.runFunnelOptimization(blueprintId);

    res.json({
      success: true,
      data: optimizations
    });
  } catch (error) {
    console.error('[SmartFunnel] Error running optimization:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run optimization'
    });
  }
});

/**
 * Get optimization suggestions
 */
router.get('/optimization/:blueprintId/suggestions', async (req, res) => {
  try {
    const { blueprintId } = req.params;
    const { status } = req.query;
    
    const optimizations = await storage.getFunnelOptimizations(
      blueprintId,
      status as string
    );

    res.json({
      success: true,
      data: optimizations
    });
  } catch (error) {
    console.error('[SmartFunnel] Error getting optimization suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get optimization suggestions'
    });
  }
});

/**
 * Approve/reject optimization suggestion
 */
router.put('/optimization/:id/decision', async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, notes } = req.body; // 'approved' or 'rejected'

    const optimization = await storage.updateFunnelOptimization(id, {
      status: decision,
      updated_at: new Date()
    });

    res.json({
      success: true,
      data: optimization
    });
  } catch (error) {
    console.error('[SmartFunnel] Error updating optimization decision:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update optimization decision'
    });
  }
});

// =====================================================
// LIFECYCLE INTEGRATIONS
// =====================================================

/**
 * Create lifecycle integration
 */
router.post('/integrations', async (req, res) => {
  try {
    const integrationData = req.body;
    const integration = await storage.createFunnelLifecycleIntegration(integrationData);

    res.json({
      success: true,
      data: integration
    });
  } catch (error) {
    console.error('[SmartFunnel] Error creating integration:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to create integration'
    });
  }
});

/**
 * Get integrations for blueprint
 */
router.get('/integrations/blueprint/:blueprintId', async (req, res) => {
  try {
    const { blueprintId } = req.params;
    const integrations = await storage.getFunnelLifecycleIntegrations(blueprintId);

    res.json({
      success: true,
      data: integrations
    });
  } catch (error) {
    console.error('[SmartFunnel] Error getting integrations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get integrations'
    });
  }
});

// =====================================================
// FUNNEL TEMPLATES & PRESETS
// =====================================================

/**
 * Get funnel templates
 */
router.get('/templates', async (req, res) => {
  try {
    const { vertical } = req.query;
    
    // Return predefined funnel templates
    const templates = await getFunnelTemplates(vertical as string);

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('[SmartFunnel] Error getting templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get templates'
    });
  }
});

/**
 * Create blueprint from template
 */
router.post('/templates/:templateId/create-blueprint', async (req, res) => {
  try {
    const { templateId } = req.params;
    const { name, vertical, customizations } = req.body;

    const template = await getFunnelTemplate(templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    // Apply customizations to template
    const blueprintConfig = applyTemplateCustomizations(template, customizations);

    const blueprint = await storage.createFunnelBlueprint({
      name,
      vertical: vertical || template.vertical,
      type: template.type,
      description: template.description,
      config: blueprintConfig,
      status: 'draft'
    });

    res.json({
      success: true,
      data: blueprint
    });
  } catch (error) {
    console.error('[SmartFunnel] Error creating blueprint from template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create blueprint from template'
    });
  }
});

// =====================================================
// HELPER FUNCTIONS
// =====================================================

async function getFunnelTemplates(vertical?: string): Promise<any[]> {
  const templates = [
    {
      id: 'lead_magnet_quiz',
      name: 'Lead Magnet Quiz Funnel',
      vertical: 'universal',
      type: 'lead_magnet',
      description: 'Quiz-based lead capture with personalized results',
      preview_blocks: ['quiz', 'results', 'lead_form', 'thank_you']
    },
    {
      id: 'product_review_cta',
      name: 'Product Review CTA Funnel',
      vertical: 'universal',
      type: 'product_review',
      description: 'Content-driven product recommendation funnel',
      preview_blocks: ['content', 'product_showcase', 'cta', 'checkout']
    },
    {
      id: 'exit_intent_offer',
      name: 'Exit Intent Offer Funnel',
      vertical: 'universal',
      type: 'exit_intent',
      description: 'Last-chance offer for departing visitors',
      preview_blocks: ['offer', 'countdown', 'form', 'confirmation']
    },
    {
      id: 'webinar_registration',
      name: 'Webinar Registration Funnel',
      vertical: 'education',
      type: 'webinar',
      description: 'Event registration with nurture sequence',
      preview_blocks: ['landing', 'form', 'confirmation', 'reminders']
    }
  ];

  return vertical ? 
    templates.filter(t => t.vertical === vertical || t.vertical === 'universal') :
    templates;
}

async function getFunnelTemplate(templateId: string): Promise<any | null> {
  const templates = await getFunnelTemplates();
  return templates.find(t => t.id === templateId) || null;
}

function applyTemplateCustomizations(template: any, customizations: any): any {
  // Apply customizations to template configuration
  return {
    ...template.config,
    ...customizations
  };
}

// =====================================================
// AI ORCHESTRATION & OPTIMIZATION ENDPOINTS
// =====================================================

/**
 * AI-powered funnel step orchestration
 */
router.post('/orchestrate/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { currentBlockId, userInteraction } = req.body;

    if (!userInteraction || !userInteraction.action) {
      return res.status(400).json({
        success: false,
        error: 'userInteraction with action is required'
      });
    }

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
    console.error('[SmartFunnel] Error orchestrating funnel step:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to orchestrate funnel step'
    });
  }
});

/**
 * Generate AI insights for funnel optimization
 */
router.get('/insights/:blueprintId', async (req, res) => {
  try {
    const { blueprintId } = req.params;
    
    const insights = await smartFunnelOrchestrator.generateFunnelInsights(blueprintId);
    
    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('[SmartFunnel] Error generating insights:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate insights'
    });
  }
});

/**
 * Simulate user journey for optimization
 */
router.post('/simulate/:blueprintId', async (req, res) => {
  try {
    const { blueprintId } = req.params;
    const { userPersona, scenarios } = req.body;

    if (!userPersona || !scenarios || !Array.isArray(scenarios)) {
      return res.status(400).json({
        success: false,
        error: 'userPersona and scenarios array are required'
      });
    }

    const simulation = await smartFunnelOrchestrator.simulateUserJourney(
      blueprintId,
      userPersona,
      scenarios
    );

    res.json({
      success: true,
      data: simulation
    });
  } catch (error) {
    console.error('[SmartFunnel] Error simulating journey:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to simulate journey'
    });
  }
});

/**
 * Run AI-powered funnel optimization
 */
router.post('/optimize/:blueprintId', async (req, res) => {
  try {
    const { blueprintId } = req.params;
    
    const optimizations = await smartFunnelEngine.runFunnelOptimization(blueprintId);
    
    res.json({
      success: true,
      data: {
        blueprintId,
        optimizations,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[SmartFunnel] Error running optimization:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to run optimization'
    });
  }
});

// =====================================================
// LIFECYCLE INTEGRATION MANAGEMENT
// =====================================================

/**
 * Create lifecycle integration
 */
router.post('/integrations', async (req, res) => {
  try {
    const integration = await storage.createFunnelLifecycleIntegration(req.body);
    
    res.json({
      success: true,
      data: integration
    });
  } catch (error) {
    console.error('[SmartFunnel] Error creating integration:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create integration'
    });
  }
});

/**
 * Get lifecycle integrations for blueprint
 */
router.get('/integrations/:blueprintId', async (req, res) => {
  try {
    const { blueprintId } = req.params;
    const integrations = await storage.getFunnelLifecycleIntegrations(blueprintId);
    
    res.json({
      success: true,
      data: integrations
    });
  } catch (error) {
    console.error('[SmartFunnel] Error getting integrations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get integrations'
    });
  }
});

// =====================================================
// ANALYTICS & REPORTING ENDPOINTS
// =====================================================

/**
 * Get funnel analytics
 */
router.get('/analytics/:blueprintId', async (req, res) => {
  try {
    const { blueprintId } = req.params;
    const { startDate, endDate } = req.query;
    
    let dateRange;
    if (startDate && endDate) {
      dateRange = {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      };
    }
    
    const analytics = await storage.getFunnelAnalytics(blueprintId, dateRange);
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('[SmartFunnel] Error getting analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics'
    });
  }
});

/**
 * Get funnel events for analysis
 */
router.get('/events/:blueprintId', async (req, res) => {
  try {
    const { blueprintId } = req.params;
    const events = await storage.getFunnelEventsByBlueprint(blueprintId);
    
    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('[SmartFunnel] Error getting events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get events'
    });
  }
});

/**
 * Get optimization suggestions
 */
router.get('/optimizations/:blueprintId', async (req, res) => {
  try {
    const { blueprintId } = req.params;
    const { status } = req.query;
    
    const optimizations = await storage.getFunnelOptimizations(blueprintId, status as string);
    
    res.json({
      success: true,
      data: optimizations
    });
  } catch (error) {
    console.error('[SmartFunnel] Error getting optimizations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get optimizations'
    });
  }
});

/**
 * Update optimization status
 */
router.patch('/optimizations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const optimization = await storage.updateFunnelOptimization(id, updates);
    
    res.json({
      success: true,
      data: optimization
    });
  } catch (error) {
    console.error('[SmartFunnel] Error updating optimization:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update optimization'
    });
  }
});

export default router;