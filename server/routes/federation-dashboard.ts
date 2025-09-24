import { Router } from 'express';
import { dashboardManager } from '../services/federation/dashboardManager';
import { federationCore } from '../services/federation/federationCore';
import { z } from 'zod';

const router = Router();

// ===========================================
// FEDERATION DASHBOARD API ENDPOINTS
// ===========================================

// Get comprehensive dashboard metrics
router.get('/metrics', async (req, res) => {
  try {
    const { refresh = false } = req.query;
    const metrics = await dashboardManager.getDashboardMetrics(refresh === 'true');
    
    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Failed to get dashboard metrics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard metrics' });
  }
});

// Get real-time federation status
router.get('/realtime-status', async (req, res) => {
  try {
    const status = await dashboardManager.getRealTimeStatus();
    
    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Failed to get real-time status:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch real-time status' });
  }
});

// Get federation network visualization data
router.get('/visualization', async (req, res) => {
  try {
    const vizData = await dashboardManager.getVisualizationData();
    
    res.json({
      success: true,
      data: vizData,
      meta: {
        totalNodes: vizData.nodes.length,
        totalEdges: vizData.edges.length,
        totalClusters: vizData.clusters.length
      }
    });
  } catch (error) {
    console.error('❌ Failed to get visualization data:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch visualization data' });
  }
});

// Execute federation management actions
router.post('/actions', async (req, res) => {
  try {
    const actionSchema = z.object({
      type: z.enum(['hot_reload', 'config_push', 'neuron_restart', 'sync_trigger', 'conflict_resolve']),
      neuronId: z.string().optional(),
      payload: z.any().optional(),
      options: z.any().optional()
    });

    const validatedAction = actionSchema.parse(req.body);
    const result = await dashboardManager.executeAction(validatedAction);

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        message: `Action ${validatedAction.type} executed successfully`
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Action execution failed'
      });
    }
  } catch (error) {
    console.error('❌ Dashboard action failed:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
    res.status(500).json({ success: false, error: 'Action execution failed' });
  }
});

export default router;