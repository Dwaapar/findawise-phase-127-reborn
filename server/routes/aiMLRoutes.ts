import { Router } from 'express';
import { aimlOrchestrator } from '../services/ai-ml-orchestrator';
import { aiMLDataPipeline } from '../services/ai-ml-data-pipeline';
import { db } from '../db';
import { 
  learningCycles, 
  personalizationRules, 
  aiMLModels,
  neuronDataPipelines,
  aiMLAnalytics,
  empireBrainConfig,
  aiMLAuditTrail 
} from '@shared/schema';
import { eq, desc, and, gte, count } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const router = Router();

// AI/ML Orchestrator Management
router.get('/api/ai-ml/status', async (req, res) => {
  try {
    const systemHealth = await aiMLOrchestrator.getSystemHealth();
    const dataHealth = await aiMLDataPipeline.getDataHealth();
    const currentCycle = aiMLOrchestrator.getCurrentCycle();
    const config = aiMLOrchestrator.getConfig();

    res.json({
      success: true,
      data: {
        system: systemHealth,
        data: dataHealth,
        currentCycle,
        config: {
          isEnabled: config.isEnabled,
          silentMode: config.safety.silentMode,
          lastCycle: systemHealth.lastCycle
        }
      }
    });
  } catch (error) {
    console.error('❌ AI/ML status error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

router.get('/api/ai-ml/config', async (req, res) => {
  try {
    const config = aiMLOrchestrator.getConfig();
    res.json({ success: true, data: config });
  } catch (error) {
    console.error('❌ AI/ML config error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

router.put('/api/ai-ml/config', async (req, res) => {
  try {
    const updates = req.body;
    
    // Audit the config change
    await db.insert(aiMLAuditTrail).values({
      auditId: randomUUID(),
      action: 'config_update',
      entityType: 'config',
      entityId: 'empire_brain',
      userId: req.session?.userId || 'system',
      sessionId: req.session?.id || '',
      oldValue: aiMLOrchestrator.getConfig(),
      newValue: updates,
      changeReason: 'Manual configuration update',
      isAutomatic: false
    });

    aiMLOrchestrator.updateConfig(updates);
    
    res.json({ 
      success: true, 
      message: 'Configuration updated successfully' 
    });
  } catch (error) {
    console.error('❌ AI/ML config update error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Learning Cycles
router.post('/api/ai-ml/learning-cycle', async (req, res) => {
  try {
    const cycle = await aiMLOrchestrator.triggerManualLearningCycle();
    
    // Store in database
    await db.insert(learningCycles).values({
      cycleId: cycle.id,
      type: cycle.type,
      status: cycle.status,
      startTime: cycle.startTime,
      endTime: cycle.endTime,
      dataProcessed: cycle.dataProcessed,
      discoveries: cycle.discoveries,
      modelsUpdated: cycle.modelsUpdated,
      rulesGenerated: cycle.rulesGenerated.length,
      performance: cycle.performance,
      errorMessage: cycle.error,
      triggeredBy: req.session?.userId || 'manual'
    });

    res.json({ success: true, data: cycle });
  } catch (error) {
    console.error('❌ Learning cycle trigger error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

router.get('/api/ai-ml/learning-cycles', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const cycles = await db
      .select()
      .from(learningCycles)
      .orderBy(desc(learningCycles.startTime))
      .limit(limit);

    res.json({ success: true, data: cycles });
  } catch (error) {
    console.error('❌ Learning cycles fetch error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

router.get('/api/ai-ml/learning-cycles/:cycleId', async (req, res) => {
  try {
    const { cycleId } = req.params;
    const cycle = await db
      .select()
      .from(learningCycles)
      .where(eq(learningCycles.cycleId, cycleId))
      .limit(1);

    if (cycle.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Learning cycle not found' 
      });
    }

    res.json({ success: true, data: cycle[0] });
  } catch (error) {
    console.error('❌ Learning cycle fetch error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// ML Models
router.get('/api/ai-ml/models', async (req, res) => {
  try {
    const models = await db
      .select()
      .from(aiMLModels)
      .orderBy(desc(aiMLModels.createdAt));

    res.json({ success: true, data: models });
  } catch (error) {
    console.error('❌ Models fetch error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

router.get('/api/ai-ml/models/:modelId', async (req, res) => {
  try {
    const { modelId } = req.params;
    const model = await db
      .select()
      .from(aiMLModels)
      .where(eq(aiMLModels.modelId, modelId))
      .limit(1);

    if (model.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Model not found' 
      });
    }

    res.json({ success: true, data: model[0] });
  } catch (error) {
    console.error('❌ Model fetch error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

router.post('/api/ai-ml/models/:modelId/deploy', async (req, res) => {
  try {
    const { modelId } = req.params;
    
    // Deactivate current production model of same type
    const model = await db
      .select()
      .from(aiMLModels)
      .where(eq(aiMLModels.modelId, modelId))
      .limit(1);

    if (model.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Model not found' 
      });
    }

    const modelType = model[0].modelType;

    // Deactivate other production models of same type
    await db
      .update(aiMLModels)
      .set({ isProduction: false, updatedAt: new Date() })
      .where(and(
        eq(aiMLModels.modelType, modelType),
        eq(aiMLModels.isProduction, true)
      ));

    // Activate this model
    await db
      .update(aiMLModels)
      .set({ 
        isProduction: true, 
        deployedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(aiMLModels.modelId, modelId));

    // Audit the deployment
    await db.insert(aiMLAuditTrail).values({
      auditId: randomUUID(),
      action: 'model_deploy',
      entityType: 'model',
      entityId: modelId,
      userId: req.session?.userId || 'system',
      sessionId: req.session?.id || '',
      newValue: { isProduction: true, deployedAt: new Date() },
      changeReason: 'Manual model deployment',
      isAutomatic: false
    });

    res.json({ 
      success: true, 
      message: 'Model deployed successfully' 
    });
  } catch (error) {
    console.error('❌ Model deployment error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Personalization Rules
router.get('/api/ai-ml/rules', async (req, res) => {
  try {
    const { vertical } = req.query;
    let query = db.select().from(personalizationRules);
    
    if (vertical) {
      query = query.where(eq(personalizationRules.vertical, vertical as string));
    }

    const rules = await query.orderBy(desc(personalizationRules.createdAt));
    res.json({ success: true, data: rules });
  } catch (error) {
    console.error('❌ Rules fetch error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

router.post('/api/ai-ml/rules', async (req, res) => {
  try {
    const ruleData = {
      ...req.body,
      ruleId: randomUUID(),
      createdBy: req.session?.userId || 'manual'
    };

    const rule = await db.insert(personalizationRules).values(ruleData).returning();

    // Audit the rule creation
    await db.insert(aiMLAuditTrail).values({
      auditId: randomUUID(),
      action: 'rule_create',
      entityType: 'rule',
      entityId: rule[0].ruleId,
      userId: req.session?.userId || 'system',
      sessionId: req.session?.id || '',
      newValue: ruleData,
      changeReason: 'Manual rule creation',
      isAutomatic: false
    });

    res.json({ success: true, data: rule[0] });
  } catch (error) {
    console.error('❌ Rule creation error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

router.put('/api/ai-ml/rules/:ruleId', async (req, res) => {
  try {
    const { ruleId } = req.params;
    const updates = req.body;

    // Get old values for audit
    const oldRule = await db
      .select()
      .from(personalizationRules)
      .where(eq(personalizationRules.ruleId, ruleId))
      .limit(1);

    const updatedRule = await db
      .update(personalizationRules)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(personalizationRules.ruleId, ruleId))
      .returning();

    if (updatedRule.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Rule not found' 
      });
    }

    // Audit the rule update
    await db.insert(aiMLAuditTrail).values({
      auditId: randomUUID(),
      action: 'rule_update',
      entityType: 'rule',
      entityId: ruleId,
      userId: req.session?.userId || 'system',
      sessionId: req.session?.id || '',
      oldValue: oldRule[0] || null,
      newValue: updates,
      changeReason: 'Manual rule update',
      isAutomatic: false
    });

    res.json({ success: true, data: updatedRule[0] });
  } catch (error) {
    console.error('❌ Rule update error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

router.delete('/api/ai-ml/rules/:ruleId', async (req, res) => {
  try {
    const { ruleId } = req.params;

    // Get rule for audit before deletion
    const rule = await db
      .select()
      .from(personalizationRules)
      .where(eq(personalizationRules.ruleId, ruleId))
      .limit(1);

    if (rule.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Rule not found' 
      });
    }

    await db
      .update(personalizationRules)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(personalizationRules.ruleId, ruleId));

    // Audit the rule deletion
    await db.insert(aiMLAuditTrail).values({
      auditId: randomUUID(),
      action: 'rule_delete',
      entityType: 'rule',
      entityId: ruleId,
      userId: req.session?.userId || 'system',
      sessionId: req.session?.id || '',
      oldValue: rule[0],
      changeReason: 'Manual rule deletion',
      isAutomatic: false
    });

    res.json({ 
      success: true, 
      message: 'Rule deactivated successfully' 
    });
  } catch (error) {
    console.error('❌ Rule deletion error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Neuron Data Pipelines
router.get('/api/ai-ml/pipelines', async (req, res) => {
  try {
    const pipelines = await aiMLDataPipeline.getAllPipelines();
    res.json({ success: true, data: pipelines });
  } catch (error) {
    console.error('❌ Pipelines fetch error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

router.post('/api/ai-ml/pipelines/:neuronId/sync', async (req, res) => {
  try {
    const { neuronId } = req.params;
    await aiMLDataPipeline.triggerSync(neuronId);
    
    res.json({ 
      success: true, 
      message: 'Sync triggered successfully' 
    });
  } catch (error) {
    console.error('❌ Pipeline sync error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

router.get('/api/ai-ml/pipelines/:neuronId/metrics', async (req, res) => {
  try {
    const { neuronId } = req.params;
    const hours = parseInt(req.query.hours as string) || 1;
    const metrics = await aiMLDataPipeline.getNeuronMetrics(neuronId, hours);
    
    if (!metrics) {
      return res.status(404).json({ 
        success: false, 
        error: 'Neuron not found' 
      });
    }

    res.json({ success: true, data: metrics });
  } catch (error) {
    console.error('❌ Neuron metrics error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Analytics
router.get('/api/ai-ml/analytics', async (req, res) => {
  try {
    const { vertical, days } = req.query;
    const daysBack = parseInt(days as string) || 7;
    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    let query = db
      .select()
      .from(aiMLAnalytics)
      .where(gte(aiMLAnalytics.date, startDate));

    if (vertical) {
      query = query.where(eq(aiMLAnalytics.vertical, vertical as string));
    }

    const analytics = await query.orderBy(desc(aiMLAnalytics.date));
    res.json({ success: true, data: analytics });
  } catch (error) {
    console.error('❌ Analytics fetch error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Audit Trail
router.get('/api/ai-ml/audit', async (req, res) => {
  try {
    const { action, entityType, days } = req.query;
    const daysBack = parseInt(days as string) || 7;
    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    let query = db
      .select()
      .from(aiMLAuditTrail)
      .where(gte(aiMLAuditTrail.timestamp, startDate));

    if (action) {
      query = query.where(eq(aiMLAuditTrail.action, action as string));
    }

    if (entityType) {
      query = query.where(eq(aiMLAuditTrail.entityType, entityType as string));
    }

    const auditLogs = await query
      .orderBy(desc(aiMLAuditTrail.timestamp))
      .limit(100);

    res.json({ success: true, data: auditLogs });
  } catch (error) {
    console.error('❌ Audit trail fetch error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// System Control
router.post('/api/ai-ml/silent-mode', async (req, res) => {
  try {
    const { enabled } = req.body;
    
    if (enabled) {
      aiMLOrchestrator.enableSilentMode();
    } else {
      aiMLOrchestrator.disableSilentMode();
    }

    // Audit the mode change
    await db.insert(aiMLAuditTrail).values({
      auditId: randomUUID(),
      action: 'silent_mode_toggle',
      entityType: 'config',
      entityId: 'empire_brain',
      userId: req.session?.userId || 'system',
      sessionId: req.session?.id || '',
      newValue: { silentMode: enabled },
      changeReason: `Silent mode ${enabled ? 'enabled' : 'disabled'}`,
      isAutomatic: false
    });

    res.json({ 
      success: true, 
      message: `Silent mode ${enabled ? 'enabled' : 'disabled'}` 
    });
  } catch (error) {
    console.error('❌ Silent mode toggle error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Export aggregated metrics
router.get('/api/ai-ml/export', async (req, res) => {
  try {
    const { format, days } = req.query;
    const daysBack = parseInt(days as string) || 30;
    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    // Collect all data for export
    const cycles = await db
      .select()
      .from(learningCycles)
      .where(gte(learningCycles.startTime, startDate));

    const models = await db
      .select()
      .from(aiMLModels)
      .where(gte(aiMLModels.createdAt, startDate));

    const rules = await db
      .select()
      .from(personalizationRules)
      .where(gte(personalizationRules.createdAt, startDate));

    const analytics = await db
      .select()
      .from(aiMLAnalytics)
      .where(gte(aiMLAnalytics.date, startDate));

    const exportData = {
      timestamp: new Date().toISOString(),
      timeframe: {
        start: startDate.toISOString(),
        end: new Date().toISOString(),
        days: daysBack
      },
      learningCycles: cycles,
      models: models,
      personalizationRules: rules,
      analytics: analytics,
      summary: {
        totalCycles: cycles.length,
        successfulCycles: cycles.filter(c => c.status === 'completed').length,
        activeModels: models.filter(m => m.isActive).length,
        productionModels: models.filter(m => m.isProduction).length,
        activeRules: rules.filter(r => r.isActive).length
      }
    };

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=ai-ml-export-${Date.now()}.json`);
      res.json(exportData);
    } else {
      res.json({ success: true, data: exportData });
    }
  } catch (error) {
    console.error('❌ Export error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router;