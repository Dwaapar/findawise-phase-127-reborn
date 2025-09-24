import { db } from '../../db';
import { 
  agenticWorkflows,
  workflowExecutions,
  promptTemplates,
  federationTasks,
  type AgenticWorkflow,
  type WorkflowExecution,
  type NewWorkflowExecution,
  type PromptTemplate
} from '@shared/schema';
import { eq, desc, and, gte, count, avg, sum } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { llmBrainRouter, type TaskRequest, type TaskResponse } from './llmBrainRouter';
import cron from 'node-cron';

export interface WorkflowStep {
  id: string;
  type: 'llm_task' | 'conditional' | 'parallel' | 'delay' | 'webhook' | 'database' | 'approval';
  name: string;
  description?: string;
  config: Record<string, any>;
  dependencies?: string[]; // IDs of steps that must complete first
  errorHandling?: {
    retryCount: number;
    fallbackStep?: string;
    continueOnError: boolean;
  };
  timeout?: number; // milliseconds
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'exists';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface WorkflowDefinition {
  steps: WorkflowStep[];
  connections: Array<{
    from: string;
    to: string;
    condition?: WorkflowCondition[];
  }>;
  errorHandling: {
    globalRetryCount: number;
    rollbackOnFailure: boolean;
    notifyOnError: boolean;
  };
  parallelism: {
    maxConcurrentSteps: number;
    resourceLimits: {
      maxMemory?: number;
      maxCost?: number;
    };
  };
}

export interface WorkflowContext {
  executionId: string;
  variables: Record<string, any>;
  stepResults: Map<string, any>;
  startTime: Date;
  userId?: number;
  triggerData: Record<string, any>;
  metadata: Record<string, any>;
}

export interface ExecutionResult {
  executionId: string;
  status: 'completed' | 'failed' | 'cancelled';
  output: any;
  steps: Array<{
    stepId: string;
    status: 'completed' | 'failed' | 'skipped';
    output: any;
    duration: number;
    cost: number;
    error?: string;
  }>;
  totalDuration: number;
  totalCost: number;
  error?: string;
}

export class AgenticWorkflowEngine {
  private activeExecutions: Map<string, WorkflowExecution> = new Map();
  private scheduledWorkflows: Map<string, cron.ScheduledTask> = new Map();
  private config = {
    maxConcurrentExecutions: parseInt(process.env.WORKFLOW_MAX_CONCURRENT || '20'),
    defaultTimeout: parseInt(process.env.WORKFLOW_DEFAULT_TIMEOUT || '300000'), // 5 minutes
    enablePersistence: true,
    enableAnalytics: true
  };

  constructor() {
    this.initializeScheduler();
  }

  private initializeScheduler(): void {
    console.log('🔁 Agentic Workflow Engine initialized');
  }

  /**
   * Create a new workflow definition
   */
  async createWorkflow(workflow: {
    name: string;
    description?: string;
    category: string;
    definition: WorkflowDefinition;
    trigger: {
      type: 'manual' | 'schedule' | 'webhook' | 'event';
      config: Record<string, any>;
    };
    inputSchema: Record<string, any>;
    outputSchema: Record<string, any>;
    maxExecutionTime?: number;
    costBudget?: number;
    createdBy: number;
  }): Promise<string> {
    try {
      const [newWorkflow] = await db.insert(agenticWorkflows).values({
        name: workflow.name,
        description: workflow.description,
        category: workflow.category,
        definition: workflow.definition,
        status: 'draft',
        trigger: workflow.trigger,
        inputSchema: workflow.inputSchema,
        outputSchema: workflow.outputSchema,
        maxExecutionTime: workflow.maxExecutionTime || this.config.defaultTimeout / 1000,
        retryPolicy: workflow.definition.errorHandling,
        costBudget: workflow.costBudget || 0,
        createdBy: workflow.createdBy,
        metadata: {}
      }).returning();

      // Schedule if it's a scheduled workflow
      if (workflow.trigger.type === 'schedule' && workflow.trigger.config.cron) {
        await this.scheduleWorkflow(newWorkflow.workflowId, workflow.trigger.config.cron);
      }

      console.log(`🔁 Created workflow: ${workflow.name} (${newWorkflow.workflowId})`);
      return newWorkflow.workflowId;
    } catch (error) {
      console.error('Failed to create workflow:', error);
      throw error;
    }
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(
    workflowId: string,
    input: Record<string, any>,
    options: {
      userId?: number;
      triggeredBy?: string;
      priority?: 'low' | 'normal' | 'high';
      context?: Record<string, any>;
    } = {}
  ): Promise<string> {
    try {
      // Get workflow definition
      const workflow = await this.getWorkflow(workflowId);
      if (!workflow) {
        throw new Error(`Workflow not found: ${workflowId}`);
      }

      if (workflow.status !== 'active') {
        throw new Error(`Workflow is not active: ${workflow.status}`);
      }

      // Check concurrent execution limits
      const activeCount = this.activeExecutions.size;
      if (activeCount >= this.config.maxConcurrentExecutions) {
        throw new Error(`Maximum concurrent executions reached: ${activeCount}`);
      }

      // Create execution record
      const executionId = randomUUID();
      const execution: NewWorkflowExecution = {
        executionId,
        workflowId,
        status: 'pending',
        progress: 0,
        input,
        steps: [],
        errors: [],
        totalCost: 0,
        totalTokens: 0,
        triggeredBy: options.triggeredBy || 'manual',
        userId: options.userId,
        metadata: options.context || {}
      };

      const [savedExecution] = await db.insert(workflowExecutions).values(execution).returning();
      this.activeExecutions.set(executionId, savedExecution);

      // Start execution asynchronously
      this.runWorkflowExecution(executionId, workflow, input, options).catch(error => {
        console.error(`Workflow execution failed: ${executionId}`, error);
      });

      console.log(`🚀 Started workflow execution: ${executionId}`);
      return executionId;
    } catch (error) {
      console.error('Failed to execute workflow:', error);
      throw error;
    }
  }

  /**
   * Run the actual workflow execution
   */
  private async runWorkflowExecution(
    executionId: string,
    workflow: AgenticWorkflow,
    input: Record<string, any>,
    options: any
  ): Promise<void> {
    const startTime = new Date();
    let context: WorkflowContext = {
      executionId,
      variables: { ...input },
      stepResults: new Map(),
      startTime,
      userId: options.userId,
      triggerData: input,
      metadata: options.context || {}
    };

    try {
      // Update execution status
      await this.updateExecutionStatus(executionId, 'running', 0);

      const definition = workflow.definition as WorkflowDefinition;
      const result = await this.executeSteps(definition, context);

      // Mark as completed
      await this.updateExecutionStatus(executionId, 'completed', 100, result);
      
      console.log(`✅ Workflow execution completed: ${executionId}`);
    } catch (error) {
      console.error(`❌ Workflow execution failed: ${executionId}`, error);
      await this.updateExecutionStatus(executionId, 'failed', context.stepResults.size, null, error.message);
    } finally {
      this.activeExecutions.delete(executionId);
    }
  }

  /**
   * Execute workflow steps
   */
  private async executeSteps(definition: WorkflowDefinition, context: WorkflowContext): Promise<any> {
    const { steps, connections } = definition;
    const completed = new Set<string>();
    const failed = new Set<string>();
    const stepQueue: string[] = [];

    // Find entry points (steps with no dependencies)
    const entryPoints = steps.filter(step => 
      !step.dependencies || step.dependencies.length === 0
    );

    if (entryPoints.length === 0) {
      throw new Error('No entry points found in workflow');
    }

    // Add entry points to queue
    entryPoints.forEach(step => stepQueue.push(step.id));

    const results = new Map<string, any>();
    let totalCost = 0;

    while (stepQueue.length > 0 || this.hasPendingSteps(steps, completed, failed)) {
      const currentBatch: string[] = [];
      const maxParallel = Math.min(
        definition.parallelism.maxConcurrentSteps || 3,
        stepQueue.length
      );

      // Prepare batch for parallel execution
      for (let i = 0; i < maxParallel && stepQueue.length > 0; i++) {
        currentBatch.push(stepQueue.shift()!);
      }

      if (currentBatch.length === 0) break;

      // Execute batch in parallel
      const batchPromises = currentBatch.map(async (stepId) => {
        const step = steps.find(s => s.id === stepId);
        if (!step) return null;

        try {
          const result = await this.executeStep(step, context);
          results.set(stepId, result);
          completed.add(stepId);
          
          if (result.cost) {
            totalCost += result.cost;
          }

          // Update progress
          const progress = Math.round((completed.size / steps.length) * 100);
          await this.updateExecutionStatus(context.executionId, 'running', progress);

          return { stepId, result, success: true };
        } catch (error) {
          failed.add(stepId);
          console.error(`Step failed: ${stepId}`, error);

          // Handle error based on step configuration
          if (step.errorHandling?.continueOnError) {
            completed.add(stepId); // Mark as completed to continue workflow
            return { stepId, result: null, success: false, error: error.message };
          } else {
            throw error; // Stop workflow execution
          }
        }
      });

      // Wait for batch completion
      const batchResults = await Promise.allSettled(batchPromises);

      // Process results and add next steps to queue
      for (const stepResult of batchResults) {
        if (stepResult.status === 'fulfilled' && stepResult.value?.success) {
          const stepId = stepResult.value.stepId;
          
          // Find next steps based on connections
          const nextSteps = connections
            .filter(conn => conn.from === stepId)
            .map(conn => conn.to)
            .filter(nextStepId => {
              const nextStep = steps.find(s => s.id === nextStepId);
              return nextStep && this.areDependenciesMet(nextStep, completed);
            })
            .filter(nextStepId => !completed.has(nextStepId) && !stepQueue.includes(nextStepId));

          stepQueue.push(...nextSteps);
        }
      }
    }

    context.stepResults = results;
    
    // Return final output based on workflow output schema
    return this.generateWorkflowOutput(results, context);
  }

  /**
   * Execute individual workflow step
   */
  private async executeStep(step: WorkflowStep, context: WorkflowContext): Promise<any> {
    const startTime = Date.now();
    
    try {
      let result: any;

      switch (step.type) {
        case 'llm_task':
          result = await this.executeLLMTask(step, context);
          break;
        case 'conditional':
          result = await this.executeConditional(step, context);
          break;
        case 'parallel':
          result = await this.executeParallel(step, context);
          break;
        case 'delay':
          result = await this.executeDelay(step, context);
          break;
        case 'webhook':
          result = await this.executeWebhook(step, context);
          break;
        case 'database':
          result = await this.executeDatabaseTask(step, context);
          break;
        case 'approval':
          result = await this.executeApproval(step, context);
          break;
        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }

      const duration = Date.now() - startTime;
      console.log(`✅ Step completed: ${step.name} (${duration}ms)`);

      return {
        ...result,
        duration,
        stepId: step.id,
        stepName: step.name
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Step failed: ${step.name} (${duration}ms)`, error);
      throw error;
    }
  }

  /**
   * Execute LLM task step
   */
  private async executeLLMTask(step: WorkflowStep, context: WorkflowContext): Promise<any> {
    const config = step.config;
    const taskRequest: TaskRequest = {
      taskType: config.taskType || 'general',
      complexity: config.complexity || 'medium',
      content: this.interpolateVariables(config.prompt || config.content, context),
      context: config.context || {},
      maxCost: config.maxCost,
      maxLatency: config.maxLatency,
      priority: config.priority || 'normal',
      metadata: {
        workflowId: context.executionId,
        stepId: step.id,
        stepName: step.name
      }
    };

    const response = await llmBrainRouter.routeTask(taskRequest);
    
    // Store result in context variables if specified
    if (config.outputVariable) {
      context.variables[config.outputVariable] = response.response;
    }

    return {
      output: response.response,
      cost: response.cost,
      latencyMs: response.latencyMs,
      tokensUsed: response.tokensUsed,
      agentId: response.agentId,
      qualityScore: response.qualityScore
    };
  }

  /**
   * Execute conditional step
   */
  private async executeConditional(step: WorkflowStep, context: WorkflowContext): Promise<any> {
    const config = step.config;
    const conditions = config.conditions as WorkflowCondition[];
    
    let result = true;
    
    for (const condition of conditions) {
      const value = this.getVariableValue(condition.field, context);
      const conditionResult = this.evaluateCondition(value, condition.operator, condition.value);
      
      if (condition.logicalOperator === 'OR') {
        result = result || conditionResult;
      } else {
        result = result && conditionResult;
      }
    }

    return {
      output: result,
      conditionsMet: result,
      evaluatedConditions: conditions.map(c => ({
        field: c.field,
        operator: c.operator,
        expected: c.value,
        actual: this.getVariableValue(c.field, context),
        result: this.evaluateCondition(this.getVariableValue(c.field, context), c.operator, c.value)
      }))
    };
  }

  /**
   * Execute parallel step
   */
  private async executeParallel(step: WorkflowStep, context: WorkflowContext): Promise<any> {
    const config = step.config;
    const parallelTasks = config.tasks || [];
    
    const results = await Promise.allSettled(
      parallelTasks.map(async (task: any, index: number) => {
        const taskRequest: TaskRequest = {
          taskType: task.taskType || 'general',
          complexity: task.complexity || 'medium',
          content: this.interpolateVariables(task.content, context),
          priority: 'normal',
          metadata: {
            workflowId: context.executionId,
            stepId: step.id,
            taskIndex: index
          }
        };

        return await llmBrainRouter.routeTask(taskRequest);
      })
    );

    const outputs = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return {
          index,
          success: true,
          output: result.value.response,
          cost: result.value.cost,
          latencyMs: result.value.latencyMs
        };
      } else {
        return {
          index,
          success: false,
          error: result.reason.message,
          cost: 0,
          latencyMs: 0
        };
      }
    });

    const totalCost = outputs.reduce((sum, output) => sum + output.cost, 0);
    const successCount = outputs.filter(output => output.success).length;

    return {
      output: outputs,
      totalCost,
      successCount,
      failureCount: outputs.length - successCount,
      successRate: successCount / outputs.length
    };
  }

  /**
   * Execute delay step
   */
  private async executeDelay(step: WorkflowStep, context: WorkflowContext): Promise<any> {
    const config = step.config;
    const delayMs = config.delayMs || 1000;
    
    await new Promise(resolve => setTimeout(resolve, delayMs));
    
    return {
      output: `Delayed for ${delayMs}ms`,
      delayMs
    };
  }

  /**
   * Execute webhook step
   */
  private async executeWebhook(step: WorkflowStep, context: WorkflowContext): Promise<any> {
    const config = step.config;
    const url = this.interpolateVariables(config.url, context);
    const method = config.method || 'POST';
    const headers = config.headers || {};
    const body = config.body ? this.interpolateVariables(JSON.stringify(config.body), context) : null;

    const axios = require('axios');
    
    try {
      const response = await axios({
        method,
        url,
        headers,
        data: body ? JSON.parse(body) : undefined,
        timeout: step.timeout || 30000
      });

      return {
        output: response.data,
        statusCode: response.status,
        headers: response.headers
      };
    } catch (error: any) {
      throw new Error(`Webhook request failed: ${error.message}`);
    }
  }

  /**
   * Execute database task step
   */
  private async executeDatabaseTask(step: WorkflowStep, context: WorkflowContext): Promise<any> {
    const config = step.config;
    const operation = config.operation; // 'select', 'insert', 'update', 'delete'
    
    // This would implement database operations based on the config
    // For now, return a placeholder
    return {
      output: `Database operation: ${operation}`,
      operation,
      affected: 1
    };
  }

  /**
   * Execute approval step (human-in-the-loop)
   */
  private async executeApproval(step: WorkflowStep, context: WorkflowContext): Promise<any> {
    const config = step.config;
    
    // Create approval request in federation tasks
    const approvalTask = {
      sourceNeuron: 'workflow-engine',
      taskType: 'human_approval',
      priority: 'normal' as const,
      payload: {
        workflowId: context.executionId,
        stepId: step.id,
        stepName: step.name,
        description: config.description || 'Approval required',
        data: config.data || context.variables,
        approvers: config.approvers || [],
        timeout: config.timeout || 86400000 // 24 hours default
      },
      maxRetries: 0, // No retries for approval
      costBudget: 0
    };

    const [createdTask] = await db.insert(federationTasks).values(approvalTask).returning();

    // Wait for approval (this would be handled by the approval system)
    // For now, auto-approve after a short delay for demo purposes
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      output: 'Auto-approved for demo',
      approvalId: createdTask.taskId,
      approved: true,
      approver: 'system'
    };
  }

  /**
   * Schedule a workflow for automatic execution
   */
  async scheduleWorkflow(workflowId: string, cronExpression: string): Promise<void> {
    try {
      // Remove existing schedule if any
      if (this.scheduledWorkflows.has(workflowId)) {
        this.scheduledWorkflows.get(workflowId)?.destroy();
      }

      // Create new scheduled task
      const task = cron.schedule(cronExpression, async () => {
        try {
          console.log(`🕒 Executing scheduled workflow: ${workflowId}`);
          await this.executeWorkflow(workflowId, {}, { triggeredBy: 'schedule' });
        } catch (error) {
          console.error(`Scheduled workflow execution failed: ${workflowId}`, error);
        }
      }, {
        scheduled: false // Don't start immediately
      });

      this.scheduledWorkflows.set(workflowId, task);
      task.start();

      console.log(`📅 Scheduled workflow: ${workflowId} with cron: ${cronExpression}`);
    } catch (error) {
      console.error('Failed to schedule workflow:', error);
      throw error;
    }
  }

  /**
   * Cancel workflow execution
   */
  async cancelExecution(executionId: string): Promise<void> {
    try {
      await this.updateExecutionStatus(executionId, 'cancelled', 0);
      this.activeExecutions.delete(executionId);
      console.log(`🛑 Cancelled workflow execution: ${executionId}`);
    } catch (error) {
      console.error('Failed to cancel execution:', error);
      throw error;
    }
  }

  /**
   * Get workflow execution status
   */
  async getExecutionStatus(executionId: string): Promise<WorkflowExecution | null> {
    try {
      const execution = await db.select()
        .from(workflowExecutions)
        .where(eq(workflowExecutions.executionId, executionId))
        .limit(1);

      return execution[0] || null;
    } catch (error) {
      console.error('Failed to get execution status:', error);
      return null;
    }
  }

  /**
   * Get workflow analytics
   */
  async getWorkflowAnalytics(workflowId: string): Promise<any> {
    try {
      const executions = await db.select()
        .from(workflowExecutions)
        .where(eq(workflowExecutions.workflowId, workflowId));

      if (executions.length === 0) {
        return {
          totalExecutions: 0,
          successRate: 0,
          averageDuration: 0,
          averageCost: 0,
          recentExecutions: []
        };
      }

      const totalExecutions = executions.length;
      const successfulExecutions = executions.filter(e => e.status === 'completed').length;
      const successRate = successfulExecutions / totalExecutions;

      const completedExecutions = executions.filter(e => e.completedAt);
      const averageDuration = completedExecutions.length > 0
        ? completedExecutions.reduce((sum, e) => {
            const duration = e.completedAt!.getTime() - e.startedAt.getTime();
            return sum + duration;
          }, 0) / completedExecutions.length
        : 0;

      const averageCost = executions.reduce((sum, e) => sum + e.totalCost, 0) / totalExecutions;

      return {
        totalExecutions,
        successRate,
        averageDuration,
        averageCost,
        recentExecutions: executions
          .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
          .slice(0, 10)
          .map(e => ({
            executionId: e.executionId,
            status: e.status,
            startedAt: e.startedAt,
            completedAt: e.completedAt,
            totalCost: e.totalCost,
            duration: e.completedAt 
              ? e.completedAt.getTime() - e.startedAt.getTime()
              : null
          }))
      };
    } catch (error) {
      console.error('Failed to get workflow analytics:', error);
      throw error;
    }
  }

  // Helper methods
  private async getWorkflow(workflowId: string): Promise<AgenticWorkflow | null> {
    const workflows = await db.select()
      .from(agenticWorkflows)
      .where(eq(agenticWorkflows.workflowId, workflowId))
      .limit(1);

    return workflows[0] || null;
  }

  private async updateExecutionStatus(
    executionId: string,
    status: string,
    progress: number,
    output?: any,
    error?: string
  ): Promise<void> {
    const updateData: any = {
      status,
      progress,
      updatedAt: new Date()
    };

    if (output !== undefined) {
      updateData.output = output;
    }

    if (error) {
      updateData.errors = [{ message: error, timestamp: new Date() }];
    }

    if (status === 'completed' || status === 'failed' || status === 'cancelled') {
      updateData.completedAt = new Date();
    }

    await db.update(workflowExecutions)
      .set(updateData)
      .where(eq(workflowExecutions.executionId, executionId));
  }

  private hasPendingSteps(steps: WorkflowStep[], completed: Set<string>, failed: Set<string>): boolean {
    return steps.some(step => 
      !completed.has(step.id) && 
      !failed.has(step.id) && 
      this.areDependenciesMet(step, completed)
    );
  }

  private areDependenciesMet(step: WorkflowStep, completed: Set<string>): boolean {
    if (!step.dependencies || step.dependencies.length === 0) {
      return true;
    }

    return step.dependencies.every(depId => completed.has(depId));
  }

  private interpolateVariables(template: string, context: WorkflowContext): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return context.variables[varName] || match;
    });
  }

  private getVariableValue(fieldPath: string, context: WorkflowContext): any {
    const parts = fieldPath.split('.');
    let value = context.variables;

    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  private evaluateCondition(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'equals':
        return actual === expected;
      case 'not_equals':
        return actual !== expected;
      case 'contains':
        return typeof actual === 'string' && actual.includes(expected);
      case 'greater_than':
        return Number(actual) > Number(expected);
      case 'less_than':
        return Number(actual) < Number(expected);
      case 'exists':
        return actual !== undefined && actual !== null;
      default:
        return false;
    }
  }

  private generateWorkflowOutput(stepResults: Map<string, any>, context: WorkflowContext): any {
    // Generate final output based on step results
    const output: any = {
      executionId: context.executionId,
      variables: context.variables,
      stepResults: Array.from(stepResults.entries()).map(([stepId, result]) => ({
        stepId,
        ...result
      }))
    };

    return output;
  }
}

export const agenticWorkflowEngine = new AgenticWorkflowEngine();