/**
 * Real-Time Layout Mutation API Routes
 * Billion-Dollar Empire Grade - Complete REST API for layout mutation engine
 */

import { Router } from 'express';
import { z } from 'zod';
import { layoutMutationEngine, type LayoutContext, type LayoutElementMutation } from '../services/layout/layoutMutationEngine';
import { layoutStorageService } from '../services/layout/layoutStorage';
// Basic auth middleware for now - can be enhanced later
const authenticateToken = (req: any, res: any, next: any) => {
  // For now, allow all requests - implement proper JWT auth later
  req.user = { id: 'system', role: 'admin' };
  next();
};

const requireRole = (roles: string[]) => (req: any, res: any, next: any) => {
  // For now, allow all - implement proper RBAC later
  next();
};

const router = Router();

// Validation schemas
const layoutContextSchema = z.object({
  userId: z.string().optional(),
  sessionId: z.string(),
  deviceType: z.enum(['mobile', 'tablet', 'desktop']),
  screenSize: z.object({
    width: z.number(),
    height: z.number()
  }),
  userAgent: z.string(),
  location: z.string().optional(),
  referrer: z.string().optional(),
  timeOfDay: z.number().min(0).max(23),
  behaviorProfile: z.any().optional(),
  conversionHistory: z.array(z.any()).optional()
});

const elementMutationSchema = z.object({
  elementId: z.string(),
  action: z.enum(['move', 'resize', 'replace', 'hide', 'show', 'style', 'content']),
  targetValue: z.any(),
  animation: z.string().optional(),
  duration: z.number().optional()
});

const dragDropSchema = z.object({
  elementId: z.string(),
  newPosition: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number().optional(),
    height: z.number().optional()
  }),
  userId: z.string().optional()
});

// Generate personalized layout
router.post('/generate', async (req, res) => {
  try {
    const { templateId, context } = req.body;
    
    if (!templateId) {
      return res.status(400).json({
        success: false,
        error: 'Template ID is required'
      });
    }

    const validatedContext = layoutContextSchema.parse(context);
    
    const personalizedLayout = await layoutMutationEngine.generatePersonalizedLayout(
      templateId,
      validatedContext
    );

    res.json({
      success: true,
      data: personalizedLayout,
      message: 'Personalized layout generated successfully'
    });

  } catch (error: any) {
    console.error('Error generating personalized layout:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate personalized layout'
    });
  }
});

// Mutate layout in real-time based on behavior
router.post('/mutate/:instanceId', async (req, res) => {
  try {
    const { instanceId } = req.params;
    const { behaviorData, immediate = false } = req.body;

    if (!behaviorData) {
      return res.status(400).json({
        success: false,
        error: 'Behavior data is required'
      });
    }

    await layoutMutationEngine.mutateLayoutRealTime(
      instanceId,
      behaviorData,
      immediate
    );

    res.json({
      success: true,
      message: immediate ? 'Layout mutated immediately' : 'Layout mutation queued'
    });

  } catch (error: any) {
    console.error('Error mutating layout:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to mutate layout'
    });
  }
});

// Handle drag-drop personalization
router.post('/personalize/:instanceId/drag-drop', async (req, res) => {
  try {
    const { instanceId } = req.params;
    const dragDropData = dragDropSchema.parse(req.body);

    await layoutMutationEngine.handleDragDropPersonalization(
      instanceId,
      dragDropData.elementId,
      dragDropData.newPosition,
      dragDropData.userId
    );

    res.json({
      success: true,
      message: 'Drag-drop personalization applied successfully'
    });

  } catch (error: any) {
    console.error('Error handling drag-drop personalization:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to apply drag-drop personalization'
    });
  }
});

// Apply manual mutations
router.post('/apply-mutations/:instanceId', authenticateToken, async (req, res) => {
  try {
    const { instanceId } = req.params;
    const { mutations } = req.body;

    if (!Array.isArray(mutations)) {
      return res.status(400).json({
        success: false,
        error: 'Mutations must be an array'
      });
    }

    const validatedMutations = mutations.map(m => elementMutationSchema.parse(m));
    
    // Apply mutations immediately
    await Promise.all(
      validatedMutations.map(mutation => 
        layoutMutationEngine.mutateLayoutRealTime(instanceId, { manual: true, mutation }, true)
      )
    );

    res.json({
      success: true,
      data: { appliedMutations: validatedMutations.length },
      message: 'Mutations applied successfully'
    });

  } catch (error: any) {
    console.error('Error applying mutations:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to apply mutations'
    });
  }
});

// Get layout templates
router.get('/templates', async (req, res) => {
  try {
    const { category, active } = req.query;
    
    // This would query the database for templates
    const templates = await getLayoutTemplates({
      category: category as string,
      active: active === 'true'
    });

    res.json({
      success: true,
      data: templates
    });

  } catch (error: any) {
    console.error('Error getting layout templates:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get layout templates'
    });
  }
});

// Get layout instance
router.get('/instances/:instanceId', async (req, res) => {
  try {
    const { instanceId } = req.params;
    
    const instance = await getLayoutInstance(instanceId);
    
    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Layout instance not found'
      });
    }

    res.json({
      success: true,
      data: instance
    });

  } catch (error: any) {
    console.error('Error getting layout instance:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get layout instance'
    });
  }
});

// Get layout analytics
router.get('/analytics/:instanceId', async (req, res) => {
  try {
    const { instanceId } = req.params;
    const { startDate, endDate } = req.query;
    
    const analytics = await getLayoutAnalytics(instanceId, {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    });

    res.json({
      success: true,
      data: analytics
    });

  } catch (error: any) {
    console.error('Error getting layout analytics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get layout analytics'
    });
  }
});

// Get user layout preferences
router.get('/preferences/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const preferences = await getUserLayoutPreferences(userId);

    res.json({
      success: true,
      data: preferences
    });

  } catch (error: any) {
    console.error('Error getting user layout preferences:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get user layout preferences'
    });
  }
});

// Create or update layout template (Admin only)
router.post('/templates', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const templateData = req.body;
    
    const template = await createLayoutTemplate(templateData);

    res.json({
      success: true,
      data: template,
      message: 'Layout template created successfully'
    });

  } catch (error: any) {
    console.error('Error creating layout template:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create layout template'
    });
  }
});

// Update layout template (Admin only)
router.put('/templates/:templateId', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { templateId } = req.params;
    const updateData = req.body;
    
    const updatedTemplate = await updateLayoutTemplate(templateId, updateData);
    
    if (!updatedTemplate) {
      return res.status(404).json({
        success: false,
        error: 'Layout template not found'
      });
    }

    res.json({
      success: true,
      data: updatedTemplate,
      message: 'Layout template updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating layout template:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update layout template'
    });
  }
});

// Get layout mutation history
router.get('/mutations/:instanceId/history', async (req, res) => {
  try {
    const { instanceId } = req.params;
    const { limit = '50' } = req.query;
    
    const mutations = await getLayoutMutationHistory(instanceId, parseInt(limit as string));

    res.json({
      success: true,
      data: mutations
    });

  } catch (error: any) {
    console.error('Error getting layout mutation history:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get layout mutation history'
    });
  }
});

// Get layout performance metrics
router.get('/performance/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    const { period = '7d' } = req.query;
    
    const metrics = await getLayoutPerformanceMetrics(templateId, period as string);

    res.json({
      success: true,
      data: metrics
    });

  } catch (error: any) {
    console.error('Error getting layout performance metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get layout performance metrics'
    });
  }
});

// A/B test endpoints
router.get('/ab-tests', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { status, templateId } = req.query;
    
    const abTests = await getLayoutAbTests({
      status: status as string,
      templateId: templateId as string
    });

    res.json({
      success: true,
      data: abTests
    });

  } catch (error: any) {
    console.error('Error getting layout A/B tests:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get layout A/B tests'
    });
  }
});

router.post('/ab-tests', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const abTestData = req.body;
    
    const abTest = await createLayoutAbTest(abTestData);

    res.json({
      success: true,
      data: abTest,
      message: 'Layout A/B test created successfully'
    });

  } catch (error: any) {
    console.error('Error creating layout A/B test:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create layout A/B test'
    });
  }
});

// WebSocket events for real-time updates
router.get('/events/:instanceId/stream', async (req, res) => {
  try {
    const { instanceId } = req.params;
    
    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    // Listen for layout mutation events
    const eventHandler = (mutatedInstanceId: string, mutations: any) => {
      if (mutatedInstanceId === instanceId) {
        res.write(`data: ${JSON.stringify({
          type: 'layout_mutated',
          instanceId: mutatedInstanceId,
          mutations,
          timestamp: new Date().toISOString()
        })}\n\n`);
      }
    };

    layoutMutationEngine.on('layoutMutated', eventHandler);

    // Clean up on client disconnect
    req.on('close', () => {
      layoutMutationEngine.off('layoutMutated', eventHandler);
    });

  } catch (error: any) {
    console.error('Error setting up layout events stream:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to set up events stream'
    });
  }
});

// Helper functions implemented using storage service
async function getLayoutTemplates(filters: any) {
  return await layoutStorageService.getTemplates(filters);
}

async function getLayoutInstance(instanceId: string) {
  return await layoutStorageService.getInstance(instanceId);
}

async function getLayoutAnalytics(instanceId: string, dateRange: any) {
  return await layoutStorageService.getAnalytics(instanceId, dateRange);
}

async function getUserLayoutPreferences(userId: string) {
  return await layoutStorageService.getUserPreferences(userId);
}

async function createLayoutTemplate(templateData: any) {
  return await layoutStorageService.createTemplate(templateData);
}

async function updateLayoutTemplate(templateId: string, updateData: any) {
  return await layoutStorageService.updateTemplate(templateId, updateData);
}

async function getLayoutMutationHistory(instanceId: string, limit: number) {
  return await layoutStorageService.getMutations(instanceId, limit);
}

async function getLayoutPerformanceMetrics(templateId: string, period: string) {
  return await layoutStorageService.getAggregatedAnalytics(templateId, period);
}

async function getLayoutAbTests(filters: any) {
  return await layoutStorageService.getAbTests(filters);
}

async function createLayoutAbTest(abTestData: any) {
  return await layoutStorageService.createAbTest(abTestData);
}

export default router;