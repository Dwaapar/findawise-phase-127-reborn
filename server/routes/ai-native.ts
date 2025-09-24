import express from 'express';
import { z } from 'zod';
import { llmBrainRouter } from '../services/ai-native/llmBrainRouter';
import { agenticWorkflowEngine } from '../services/ai-native/agenticWorkflowEngine';
import { db } from '../db';
import { 
  llmAgents, 
  agenticWorkflows, 
  workflowExecutions, 
  taskRoutingHistory,
  agentMemories,
  promptTemplates,
  federationTasks,
  agentUsageTracking
} from '../../shared/aiNativeTables';
import { eq, desc, count, sum, avg, sql } from 'drizzle-orm';

const router = express.Router();

// ==========================================
// LLM BRAIN ROUTER API ROUTES
// ==========================================

// Agent Management
const agentConfigSchema = z.object({
  name: z.string().min(1),
  provider: z.enum(['openai', 'claude', 'anthropic', 'ollama', 'localai', 'custom']),
  model: z.string().min(1),
  apiEndpoint: z.string().url(),
  apiKey: z.string().min(1),
  capabilities: z.array(z.string()),
  costPerToken: z.number().min(0),
  rateLimit: z.number().min(0),
  maxTokens: z.number().min(1),
  config: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional()
});

router.post('/agents', async (req, res) => {
  try {
    const config = agentConfigSchema.parse(req.body);
    const userId = req.user?.id || 1; // TODO: Get from JWT
    
    const agentId = await llmBrainRouter.registerAgent(config, userId);
    
    res.json({
      success: true,
      data: { agentId },
      message: 'Agent registered successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/agents', async (req, res) => {
  try {
    const agents = await db.select().from(llmAgents).orderBy(desc(llmAgents.createdAt));
    
    // Remove encrypted API keys from response
    const safeAgents = agents.map(agent => ({
      ...agent,
      apiKey: agent.apiKey ? '***encrypted***' : null
    }));
    
    res.json({
      success: true,
      data: safeAgents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/agents/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    
    const [agent] = await db.select()
      .from(llmAgents)
      .where(eq(llmAgents.agentId, agentId));
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        ...agent,
        apiKey: agent.apiKey ? '***encrypted***' : null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.put('/agents/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const updates = agentConfigSchema.partial().parse(req.body);
    
    await llmBrainRouter.updateAgent(agentId, updates);
    
    res.json({
      success: true,
      message: 'Agent updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.delete('/agents/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    
    await llmBrainRouter.deactivateAgent(agentId);
    
    res.json({
      success: true,
      message: 'Agent deactivated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Task Routing
const taskRequestSchema = z.object({
  taskType: z.string().min(1),
  complexity: z.enum(['simple', 'medium', 'complex']),
  input: z.string().min(1),
  context: z.record(z.any()).optional(),
  constraints: z.object({
    maxCost: z.number().optional(),
    maxLatency: z.number().optional(),
    requiredCapabilities: z.array(z.string()).optional(),
    excludeAgents: z.array(z.string()).optional(),
    preferredAgents: z.array(z.string()).optional()
  }).optional(),
  metadata: z.record(z.any()).optional()
});

router.post('/tasks/route', async (req, res) => {
  try {
    const request = taskRequestSchema.parse(req.body);
    
    const response = await llmBrainRouter.routeTask(request);
    
    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/tasks/route-parallel', async (req, res) => {
  try {
    const { agentIds, ...request } = req.body;
    const taskRequest = taskRequestSchema.parse(request);
    
    if (!Array.isArray(agentIds) || agentIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'agentIds array is required for parallel routing'
      });
    }
    
    const response = await llmBrainRouter.routeTaskParallel(taskRequest, agentIds);
    
    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Routing Analytics
router.get('/analytics/routing', async (req, res) => {
  try {
    const { timeframe = '24h', taskType, agentId } = req.query;
    
    let timeFilter = sql`1=1`;
    const now = new Date();
    
    switch (timeframe) {
      case '1h':
        timeFilter = sql`${taskRoutingHistory.executedAt} >= ${new Date(now.getTime() - 60 * 60 * 1000)}`;
        break;
      case '24h':
        timeFilter = sql`${taskRoutingHistory.executedAt} >= ${new Date(now.getTime() - 24 * 60 * 60 * 1000)}`;
        break;
      case '7d':
        timeFilter = sql`${taskRoutingHistory.executedAt} >= ${new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)}`;
        break;
      case '30d':
        timeFilter = sql`${taskRoutingHistory.executedAt} >= ${new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)}`;
        break;
    }
    
    let query = db.select({
      totalTasks: count(),
      successfulTasks: count(sql`CASE WHEN ${taskRoutingHistory.success} THEN 1 END`),
      averageCost: avg(taskRoutingHistory.totalCost),
      averageLatency: avg(taskRoutingHistory.latencyMs),
      totalCost: sum(taskRoutingHistory.totalCost),
      totalTokens: sum(sql`${taskRoutingHistory.inputTokens} + ${taskRoutingHistory.outputTokens}`)
    }).from(taskRoutingHistory).where(timeFilter);
    
    if (taskType) {
      query = query.where(eq(taskRoutingHistory.taskType, taskType as string));
    }
    
    if (agentId) {
      query = query.where(eq(taskRoutingHistory.finalAgentId, agentId as string));
    }
    
    const [analytics] = await query;
    
    res.json({
      success: true,
      data: {
        ...analytics,
        successRate: analytics.totalTasks > 0 ? Number(analytics.successfulTasks) / Number(analytics.totalTasks) : 0,
        timeframe
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Agent Performance Analytics
router.get('/analytics/agents/:agentId/performance', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { timeframe = '24h' } = req.query;
    
    let timeFilter = sql`1=1`;
    const now = new Date();
    
    switch (timeframe) {
      case '1h':
        timeFilter = sql`${agentUsageTracking.executedAt} >= ${new Date(now.getTime() - 60 * 60 * 1000)}`;
        break;
      case '24h':
        timeFilter = sql`${agentUsageTracking.executedAt} >= ${new Date(now.getTime() - 24 * 60 * 60 * 1000)}`;
        break;
      case '7d':
        timeFilter = sql`${agentUsageTracking.executedAt} >= ${new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)}`;
        break;
    }
    
    const [performance] = await db.select({
      totalRequests: count(),
      successfulRequests: count(sql`CASE WHEN ${agentUsageTracking.success} THEN 1 END`),
      averageLatency: avg(agentUsageTracking.latencyMs),
      totalCost: sum(agentUsageTracking.totalCost),
      totalTokens: sum(sql`${agentUsageTracking.inputTokens} + ${agentUsageTracking.outputTokens}`)
    })
    .from(agentUsageTracking)
    .where(sql`${agentUsageTracking.agentId} = ${agentId} AND ${timeFilter}`);
    
    res.json({
      success: true,
      data: {
        ...performance,
        successRate: Number(performance.totalRequests) > 0 ? Number(performance.successfulRequests) / Number(performance.totalRequests) : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==========================================
// AGENTIC WORKFLOW ENGINE API ROUTES
// ==========================================

// Workflow Management
const workflowDefinitionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  version: z.string().default('1.0'),
  steps: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['llm-task', 'api-call', 'data-transform', 'condition', 'parallel', 'wait', 'webhook', 'human-approval']),
    config: z.record(z.any()),
    inputs: z.array(z.string()),
    outputs: z.array(z.string()),
    onSuccess: z.array(z.string()).optional(),
    onFailure: z.array(z.string()).optional(),
    metadata: z.record(z.any()).optional()
  })),
  startStep: z.string(),
  variables: z.record(z.any()),
  settings: z.object({
    maxExecutionTime: z.number().min(1),
    costBudget: z.number().min(0),
    retryPolicy: z.object({
      maxRetries: z.number(),
      backoffMultiplier: z.number(),
      retryableErrors: z.array(z.string())
    }),
    parallelism: z.object({
      maxConcurrency: z.number(),
      resourceLimits: z.record(z.number())
    })
  }),
  triggers: z.array(z.object({
    type: z.enum(['schedule', 'webhook', 'event', 'manual']),
    config: z.record(z.any())
  }))
});

router.post('/workflows', async (req, res) => {
  try {
    const definition = workflowDefinitionSchema.parse(req.body);
    const userId = req.user?.id || 1; // TODO: Get from JWT
    
    const workflowId = await agenticWorkflowEngine.createWorkflow(definition, userId);
    
    res.json({
      success: true,
      data: { workflowId },
      message: 'Workflow created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/workflows', async (req, res) => {
  try {
    const { status, category, limit = 50, offset = 0 } = req.query;
    
    let query = db.select().from(agenticWorkflows);
    
    if (status) {
      query = query.where(eq(agenticWorkflows.status, status as string));
    }
    
    if (category) {
      query = query.where(eq(agenticWorkflows.category, category as string));
    }
    
    const workflows = await query
      .orderBy(desc(agenticWorkflows.createdAt))
      .limit(Number(limit))
      .offset(Number(offset));
    
    res.json({
      success: true,
      data: workflows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/workflows/:workflowId', async (req, res) => {
  try {
    const { workflowId } = req.params;
    
    const [workflow] = await db.select()
      .from(agenticWorkflows)
      .where(eq(agenticWorkflows.workflowId, workflowId));
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found'
      });
    }
    
    res.json({
      success: true,
      data: workflow
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/workflows/:workflowId/activate', async (req, res) => {
  try {
    const { workflowId } = req.params;
    
    await agenticWorkflowEngine.activateWorkflow(workflowId);
    
    res.json({
      success: true,
      message: 'Workflow activated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/workflows/:workflowId/deactivate', async (req, res) => {
  try {
    const { workflowId } = req.params;
    
    await agenticWorkflowEngine.deactivateWorkflow(workflowId);
    
    res.json({
      success: true,
      message: 'Workflow deactivated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Workflow Execution
router.post('/workflows/:workflowId/execute', async (req, res) => {
  try {
    const { workflowId } = req.params;
    const { input = {}, priority = 'normal', metadata = {} } = req.body;
    const userId = req.user?.id;
    
    const result = await agenticWorkflowEngine.executeWorkflow(workflowId, input, {
      userId,
      priority,
      metadata
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/workflows/:workflowId/executions', async (req, res) => {
  try {
    const { workflowId } = req.params;
    const { limit = 50, offset = 0, status } = req.query;
    
    let query = db.select()
      .from(workflowExecutions)
      .where(eq(workflowExecutions.workflowId, workflowId));
    
    if (status) {
      query = query.where(eq(workflowExecutions.status, status as string));
    }
    
    const executions = await query
      .orderBy(desc(workflowExecutions.startedAt))
      .limit(Number(limit))
      .offset(Number(offset));
    
    res.json({
      success: true,
      data: executions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/executions/:executionId', async (req, res) => {
  try {
    const { executionId } = req.params;
    
    const [execution] = await db.select()
      .from(workflowExecutions)
      .where(eq(workflowExecutions.executionId, executionId));
    
    if (!execution) {
      return res.status(404).json({
        success: false,
        error: 'Execution not found'
      });
    }
    
    res.json({
      success: true,
      data: execution
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==========================================
// PROMPT TEMPLATES API ROUTES
// ==========================================

const promptTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().min(1),
  template: z.string().min(1),
  variables: z.record(z.any()).default({}),
  supportedAgents: z.array(z.string()).default([]),
  version: z.string().default('1.0')
});

router.post('/prompt-templates', async (req, res) => {
  try {
    const templateData = promptTemplateSchema.parse(req.body);
    const userId = req.user?.id || 1;
    
    const [template] = await db.insert(promptTemplates).values({
      templateId: crypto.randomUUID(),
      ...templateData,
      createdBy: userId
    }).returning();
    
    res.json({
      success: true,
      data: template,
      message: 'Prompt template created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/prompt-templates', async (req, res) => {
  try {
    const { category, limit = 50, offset = 0 } = req.query;
    
    let query = db.select().from(promptTemplates);
    
    if (category) {
      query = query.where(eq(promptTemplates.category, category as string));
    }
    
    const templates = await query
      .orderBy(desc(promptTemplates.createdAt))
      .limit(Number(limit))
      .offset(Number(offset));
    
    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==========================================
// FEDERATION TASK API ROUTES
// ==========================================

router.post('/federation/tasks', async (req, res) => {
  try {
    const { targetNeuron, taskType, payload, priority = 'normal', costBudget = 0, metadata = {} } = req.body;
    
    if (!targetNeuron || !taskType || !payload) {
      return res.status(400).json({
        success: false,
        error: 'targetNeuron, taskType, and payload are required'
      });
    }
    
    const taskId = await agenticWorkflowEngine.submitFederationTask(targetNeuron, taskType, payload, {
      priority,
      costBudget,
      metadata
    });
    
    res.json({
      success: true,
      data: { taskId },
      message: 'Federation task submitted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/federation/tasks', async (req, res) => {
  try {
    const { status, targetNeuron, limit = 50, offset = 0 } = req.query;
    
    let query = db.select().from(federationTasks);
    
    if (status) {
      query = query.where(eq(federationTasks.status, status as string));
    }
    
    if (targetNeuron) {
      query = query.where(eq(federationTasks.targetNeuron, targetNeuron as string));
    }
    
    const tasks = await query
      .orderBy(desc(federationTasks.createdAt))
      .limit(Number(limit))
      .offset(Number(offset));
    
    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==========================================
// SYSTEM STATUS & HEALTH
// ==========================================

router.get('/status', async (req, res) => {
  try {
    const [
      totalAgents,
      activeAgents,
      totalWorkflows,
      activeWorkflows,
      runningExecutions,
      pendingTasks
    ] = await Promise.all([
      db.select({ count: count() }).from(llmAgents),
      db.select({ count: count() }).from(llmAgents).where(eq(llmAgents.status, 'active')),
      db.select({ count: count() }).from(agenticWorkflows),
      db.select({ count: count() }).from(agenticWorkflows).where(eq(agenticWorkflows.status, 'active')),
      db.select({ count: count() }).from(workflowExecutions).where(eq(workflowExecutions.status, 'running')),
      db.select({ count: count() }).from(federationTasks).where(eq(federationTasks.status, 'pending'))
    ]);
    
    res.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        agents: {
          total: Number(totalAgents[0].count),
          active: Number(activeAgents[0].count)
        },
        workflows: {
          total: Number(totalWorkflows[0].count),
          active: Number(activeWorkflows[0].count)
        },
        executions: {
          running: Number(runningExecutions[0].count)
        },
        federation: {
          pendingTasks: Number(pendingTasks[0].count)
        },
        system: {
          status: 'operational',
          version: '1.0.0'
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;