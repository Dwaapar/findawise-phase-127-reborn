import { db } from '../../db';
import { 
  promptTemplates,
  agentMemories,
  workflowExecutions,
  type PromptTemplate,
  type NewPromptTemplate
} from '@shared/schema';
import { eq, desc, and, gte, count, avg, sum, like } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { llmBrainRouter, type TaskRequest, type TaskResponse } from './llmBrainRouter';

export interface PromptNode {
  id: string;
  type: 'input' | 'prompt' | 'conditional' | 'loop' | 'merge' | 'output';
  name: string;
  description?: string;
  config: {
    template?: string;
    variables?: Record<string, any>;
    conditions?: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
    loopConfig?: {
      maxIterations: number;
      breakCondition: string;
    };
    mergeStrategy?: 'concatenate' | 'summarize' | 'vote' | 'best_quality';
  };
  position: { x: number; y: number };
}

export interface PromptConnection {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourcePort: string;
  targetPort: string;
  condition?: {
    field: string;
    operator: string;
    value: any;
  };
}

export interface PromptGraph {
  id: string;
  name: string;
  description?: string;
  nodes: PromptNode[];
  connections: PromptConnection[];
  variables: Record<string, {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    defaultValue?: any;
    description?: string;
    required: boolean;
  }>;
  metadata: {
    version: string;
    createdBy: number;
    tags: string[];
    category: string;
  };
}

export interface ExecutionContext {
  executionId: string;
  variables: Record<string, any>;
  nodeResults: Map<string, any>;
  currentNode: string;
  visitedNodes: Set<string>;
  iterationCounts: Map<string, number>;
  startTime: Date;
  costAccumulator: number;
  tokensUsed: number;
  metadata: Record<string, any>;
}

export interface GraphExecutionResult {
  executionId: string;
  success: boolean;
  output: any;
  executionTrace: Array<{
    nodeId: string;
    nodeName: string;
    input: any;
    output: any;
    duration: number;
    cost: number;
    tokensUsed: number;
    timestamp: Date;
  }>;
  totalDuration: number;
  totalCost: number;
  totalTokens: number;
  variables: Record<string, any>;
  error?: string;
}

export class PromptGraphCompiler {
  private compiledGraphs: Map<string, PromptGraph> = new Map();
  private activeExecutions: Map<string, ExecutionContext> = new Map();
  private templates: Map<string, PromptTemplate> = new Map();
  
  private config = {
    maxExecutionTime: parseInt(process.env.PROMPT_GRAPH_MAX_EXECUTION_TIME || '600000'), // 10 minutes
    maxIterations: parseInt(process.env.PROMPT_GRAPH_MAX_ITERATIONS || '100'),
    enableCaching: process.env.PROMPT_GRAPH_ENABLE_CACHING !== 'false',
    enableParallelization: process.env.PROMPT_GRAPH_ENABLE_PARALLELIZATION !== 'false',
    maxParallelNodes: parseInt(process.env.PROMPT_GRAPH_MAX_PARALLEL_NODES || '5')
  };

  constructor() {
    this.initializeCompiler();
    this.loadPromptTemplates();
  }

  private initializeCompiler(): void {
    console.log('📝 Prompt Graph Compiler initialized');
  }

  private async loadPromptTemplates(): Promise<void> {
    try {
      const templates = await db.select().from(promptTemplates);
      for (const template of templates) {
        this.templates.set(template.templateId, template);
      }
      console.log(`📚 Loaded ${templates.length} prompt templates`);
    } catch (error) {
      console.error('Failed to load prompt templates:', error);
    }
  }

  /**
   * Create a new prompt template
   */
  async createTemplate(template: {
    name: string;
    description?: string;
    category: string;
    template: string;
    variables: Record<string, any>;
    supportedAgents: string[];
    createdBy: number;
  }): Promise<string> {
    try {
      const [newTemplate] = await db.insert(promptTemplates).values({
        name: template.name,
        description: template.description,
        category: template.category,
        template: template.template,
        variables: template.variables,
        supportedAgents: template.supportedAgents,
        averageTokens: this.estimateTokens(template.template),
        successRate: 1.0,
        usageCount: 0,
        createdBy: template.createdBy,
        version: '1.0',
        status: 'active',
        metadata: {}
      }).returning();

      this.templates.set(newTemplate.templateId, newTemplate);
      console.log(`📝 Created prompt template: ${template.name} (${newTemplate.templateId})`);
      return newTemplate.templateId;
    } catch (error) {
      console.error('Failed to create template:', error);
      throw error;
    }
  }

  /**
   * Create a new prompt graph
   */
  async createGraph(graph: {
    name: string;
    description?: string;
    nodes: PromptNode[];
    connections: PromptConnection[];
    variables: Record<string, any>;
    createdBy: number;
    category: string;
    tags: string[];
  }): Promise<string> {
    try {
      // Validate graph structure
      this.validateGraph(graph);

      const graphId = randomUUID();
      const promptGraph: PromptGraph = {
        id: graphId,
        name: graph.name,
        description: graph.description,
        nodes: graph.nodes,
        connections: graph.connections,
        variables: graph.variables,
        metadata: {
          version: '1.0',
          createdBy: graph.createdBy,
          tags: graph.tags,
          category: graph.category
        }
      };

      // Compile and cache the graph
      this.compiledGraphs.set(graphId, promptGraph);

      console.log(`🔧 Created prompt graph: ${graph.name} (${graphId})`);
      console.log(`   Nodes: ${graph.nodes.length}, Connections: ${graph.connections.length}`);
      return graphId;
    } catch (error) {
      console.error('Failed to create graph:', error);
      throw error;
    }
  }

  /**
   * Execute a prompt graph
   */
  async executeGraph(
    graphId: string,
    input: Record<string, any>,
    options: {
      userId?: number;
      priority?: 'low' | 'normal' | 'high';
      maxCost?: number;
      timeout?: number;
      parallelExecution?: boolean;
    } = {}
  ): Promise<GraphExecutionResult> {
    const executionId = randomUUID();
    const startTime = new Date();

    try {
      const graph = this.compiledGraphs.get(graphId);
      if (!graph) {
        throw new Error(`Graph not found: ${graphId}`);
      }

      // Initialize execution context
      const context: ExecutionContext = {
        executionId,
        variables: { ...graph.variables, ...input },
        nodeResults: new Map(),
        currentNode: '',
        visitedNodes: new Set(),
        iterationCounts: new Map(),
        startTime,
        costAccumulator: 0,
        tokensUsed: 0,
        metadata: {
          graphId,
          userId: options.userId,
          priority: options.priority || 'normal'
        }
      };

      this.activeExecutions.set(executionId, context);

      // Execute the graph
      const result = await this.executeGraphNodes(graph, context, options);

      // Clean up
      this.activeExecutions.delete(executionId);

      const totalDuration = Date.now() - startTime.getTime();

      return {
        executionId,
        success: true,
        output: result.output,
        executionTrace: result.trace,
        totalDuration,
        totalCost: context.costAccumulator,
        totalTokens: context.tokensUsed,
        variables: context.variables,
      };
    } catch (error) {
      this.activeExecutions.delete(executionId);
      const totalDuration = Date.now() - startTime.getTime();

      return {
        executionId,
        success: false,
        output: null,
        executionTrace: [],
        totalDuration,
        totalCost: 0,
        totalTokens: 0,
        variables: input,
        error: error.message
      };
    }
  }

  /**
   * Execute graph nodes using topological sorting and parallel execution
   */
  private async executeGraphNodes(
    graph: PromptGraph,
    context: ExecutionContext,
    options: any
  ): Promise<{ output: any; trace: any[] }> {
    const trace: any[] = [];
    const executionQueue: string[] = [];
    const dependencies = new Map<string, Set<string>>();
    const inDegree = new Map<string, number>();

    // Build dependency graph
    for (const node of graph.nodes) {
      dependencies.set(node.id, new Set());
      inDegree.set(node.id, 0);
    }

    for (const connection of graph.connections) {
      dependencies.get(connection.targetNodeId)?.add(connection.sourceNodeId);
      inDegree.set(connection.targetNodeId, (inDegree.get(connection.targetNodeId) || 0) + 1);
    }

    // Find entry points (nodes with no dependencies)
    const entryPoints = graph.nodes.filter(node => inDegree.get(node.id) === 0);
    if (entryPoints.length === 0) {
      throw new Error('No entry points found in graph (circular dependency detected)');
    }

    // Add entry points to queue
    entryPoints.forEach(node => executionQueue.push(node.id));

    // Execute nodes
    while (executionQueue.length > 0) {
      const currentBatch: string[] = [];
      const maxParallel = options.parallelExecution ? 
        Math.min(this.config.maxParallelNodes, executionQueue.length) : 1;

      // Prepare batch for execution
      for (let i = 0; i < maxParallel && executionQueue.length > 0; i++) {
        currentBatch.push(executionQueue.shift()!);
      }

      // Execute batch (parallel or sequential)
      const batchPromises = currentBatch.map(async (nodeId) => {
        const node = graph.nodes.find(n => n.id === nodeId);
        if (!node) return null;

        return await this.executeNode(node, context, graph);
      });

      const batchResults = await Promise.allSettled(batchPromises);

      // Process results and add next nodes to queue
      for (let i = 0; i < batchResults.length; i++) {
        const result = batchResults[i];
        const nodeId = currentBatch[i];
        
        if (result.status === 'fulfilled' && result.value) {
          trace.push(result.value);
          context.nodeResults.set(nodeId, result.value.output);
          context.visitedNodes.add(nodeId);

          // Update cost and token tracking
          context.costAccumulator += result.value.cost || 0;
          context.tokensUsed += result.value.tokensUsed || 0;

          // Check cost limits
          if (options.maxCost && context.costAccumulator > options.maxCost) {
            throw new Error(`Cost limit exceeded: ${context.costAccumulator} > ${options.maxCost}`);
          }

          // Find next nodes to execute
          const nextNodes = graph.connections
            .filter(conn => conn.sourceNodeId === nodeId)
            .map(conn => conn.targetNodeId)
            .filter(nextNodeId => {
              // Check if all dependencies are satisfied
              const deps = dependencies.get(nextNodeId) || new Set();
              return Array.from(deps).every(depId => context.visitedNodes.has(depId));
            })
            .filter(nextNodeId => !context.visitedNodes.has(nextNodeId) && !executionQueue.includes(nextNodeId));

          executionQueue.push(...nextNodes);
        } else if (result.status === 'rejected') {
          throw new Error(`Node execution failed: ${nodeId} - ${result.reason}`);
        }
      }
    }

    // Find output nodes
    const outputNodes = graph.nodes.filter(node => node.type === 'output');
    let finalOutput: any;

    if (outputNodes.length === 1) {
      finalOutput = context.nodeResults.get(outputNodes[0].id);
    } else if (outputNodes.length > 1) {
      // Multiple outputs - combine them
      finalOutput = {};
      for (const outputNode of outputNodes) {
        finalOutput[outputNode.name] = context.nodeResults.get(outputNode.id);
      }
    } else {
      // No explicit output nodes - use the last executed node
      const lastTrace = trace[trace.length - 1];
      finalOutput = lastTrace?.output;
    }

    return {
      output: finalOutput,
      trace
    };
  }

  /**
   * Execute individual node in the graph
   */
  private async executeNode(
    node: PromptNode,
    context: ExecutionContext,
    graph: PromptGraph
  ): Promise<any> {
    const startTime = Date.now();
    
    try {
      let result: any;

      switch (node.type) {
        case 'input':
          result = await this.executeInputNode(node, context);
          break;
        case 'prompt':
          result = await this.executePromptNode(node, context);
          break;
        case 'conditional':
          result = await this.executeConditionalNode(node, context);
          break;
        case 'loop':
          result = await this.executeLoopNode(node, context, graph);
          break;
        case 'merge':
          result = await this.executeMergeNode(node, context);
          break;
        case 'output':
          result = await this.executeOutputNode(node, context);
          break;
        default:
          throw new Error(`Unknown node type: ${node.type}`);
      }

      const duration = Date.now() - startTime;

      return {
        nodeId: node.id,
        nodeName: node.name,
        input: this.getNodeInput(node, context),
        output: result.output,
        duration,
        cost: result.cost || 0,
        tokensUsed: result.tokensUsed || 0,
        timestamp: new Date()
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`Node execution failed: ${node.name} (${node.id})`, error);
      throw error;
    }
  }

  /**
   * Execute input node - validates and processes input variables
   */
  private async executeInputNode(node: PromptNode, context: ExecutionContext): Promise<any> {
    const config = node.config;
    const inputData: any = {};

    // Process input variables
    for (const [varName, varConfig] of Object.entries(config.variables || {})) {
      const value = context.variables[varName];
      
      if (varConfig.required && (value === undefined || value === null)) {
        throw new Error(`Required input variable missing: ${varName}`);
      }

      // Type validation and conversion
      if (value !== undefined) {
        inputData[varName] = this.validateAndConvertType(value, varConfig.type);
      } else {
        inputData[varName] = varConfig.defaultValue;
      }
    }

    // Update context variables
    Object.assign(context.variables, inputData);

    return {
      output: inputData,
      cost: 0,
      tokensUsed: 0
    };
  }

  /**
   * Execute prompt node - sends prompt to LLM and processes response
   */
  private async executePromptNode(node: PromptNode, context: ExecutionContext): Promise<any> {
    const config = node.config;
    
    // Interpolate template with variables
    const prompt = this.interpolateTemplate(config.template || '', context.variables);
    
    // Create task request
    const taskRequest: TaskRequest = {
      taskType: 'prompt_execution',
      complexity: 'medium',
      content: prompt,
      context: {
        nodeId: node.id,
        nodeName: node.name,
        graphId: context.metadata.graphId
      },
      priority: context.metadata.priority || 'normal',
      metadata: {
        executionId: context.executionId,
        nodeId: node.id
      }
    };

    // Execute task
    const response = await llmBrainRouter.routeTask(taskRequest);

    // Update prompt template usage stats
    if (config.templateId) {
      await this.updateTemplateStats(config.templateId, response.success);
    }

    // Store result in output variable if specified
    if (config.outputVariable) {
      context.variables[config.outputVariable] = response.response;
    }

    return {
      output: response.response,
      cost: response.cost,
      tokensUsed: response.tokensUsed.input + response.tokensUsed.output,
      agentId: response.agentId,
      qualityScore: response.qualityScore
    };
  }

  /**
   * Execute conditional node - evaluates conditions and routes execution
   */
  private async executeConditionalNode(node: PromptNode, context: ExecutionContext): Promise<any> {
    const config = node.config;
    const conditions = config.conditions || [];
    
    let result = true;
    const evaluations = [];

    for (const condition of conditions) {
      const value = this.getVariableValue(condition.field, context.variables);
      const conditionResult = this.evaluateCondition(value, condition.operator, condition.value);
      
      evaluations.push({
        field: condition.field,
        operator: condition.operator,
        expected: condition.value,
        actual: value,
        result: conditionResult
      });

      result = result && conditionResult;
    }

    return {
      output: {
        result,
        evaluations
      },
      cost: 0,
      tokensUsed: 0
    };
  }

  /**
   * Execute loop node - iterates over data or conditions
   */
  private async executeLoopNode(
    node: PromptNode,
    context: ExecutionContext,
    graph: PromptGraph
  ): Promise<any> {
    const config = node.config.loopConfig || {};
    const maxIterations = Math.min(config.maxIterations || 10, this.config.maxIterations);
    const breakCondition = config.breakCondition;
    
    const iterations = [];
    let iterationCount = 0;
    
    while (iterationCount < maxIterations) {
      iterationCount++;
      context.iterationCounts.set(node.id, iterationCount);
      
      // Set loop variables
      context.variables._iteration = iterationCount;
      context.variables._isFirstIteration = iterationCount === 1;
      context.variables._isLastIteration = iterationCount === maxIterations;
      
      // Execute loop body (this would require sub-graph execution)
      // For now, we'll simulate with a simple prompt execution
      const loopResult = {
        iteration: iterationCount,
        variables: { ...context.variables }
      };
      
      iterations.push(loopResult);
      
      // Check break condition
      if (breakCondition) {
        const shouldBreak = this.evaluateCondition(
          context.variables[breakCondition.field],
          breakCondition.operator,
          breakCondition.value
        );
        
        if (shouldBreak) {
          break;
        }
      }
    }
    
    return {
      output: {
        iterations,
        totalIterations: iterationCount,
        completed: iterationCount < maxIterations
      },
      cost: 0,
      tokensUsed: 0
    };
  }

  /**
   * Execute merge node - combines outputs from multiple sources
   */
  private async executeMergeNode(node: PromptNode, context: ExecutionContext): Promise<any> {
    const config = node.config;
    const mergeStrategy = config.mergeStrategy || 'concatenate';
    
    // Get inputs from connected nodes
    const inputs = [];
    for (const [nodeId, result] of context.nodeResults.entries()) {
      if (this.isNodeConnectedTo(nodeId, node.id, context)) {
        inputs.push(result);
      }
    }
    
    let mergedOutput: any;
    
    switch (mergeStrategy) {
      case 'concatenate':
        mergedOutput = inputs.join(' ');
        break;
      case 'summarize':
        // Use LLM to summarize multiple inputs
        const summaryPrompt = `Summarize the following content:\n\n${inputs.join('\n\n---\n\n')}`;
        const summaryTask: TaskRequest = {
          taskType: 'summarization',
          complexity: 'medium',
          content: summaryPrompt,
          priority: 'normal',
          metadata: { nodeId: node.id }
        };
        const summaryResponse = await llmBrainRouter.routeTask(summaryTask);
        mergedOutput = summaryResponse.response;
        break;
      case 'vote':
        // Simple voting mechanism - most common output wins
        const votes = new Map();
        for (const input of inputs) {
          votes.set(input, (votes.get(input) || 0) + 1);
        }
        mergedOutput = Array.from(votes.entries()).sort((a, b) => b[1] - a[1])[0][0];
        break;
      case 'best_quality':
        // Choose input with highest quality score (if available)
        mergedOutput = inputs.length > 0 ? inputs[0] : null;
        break;
      default:
        mergedOutput = inputs;
    }
    
    return {
      output: mergedOutput,
      cost: mergeStrategy === 'summarize' ? 0.01 : 0, // Estimated cost for summarization
      tokensUsed: mergeStrategy === 'summarize' ? this.estimateTokens(inputs.join(' ')) : 0
    };
  }

  /**
   * Execute output node - formats and returns final output
   */
  private async executeOutputNode(node: PromptNode, context: ExecutionContext): Promise<any> {
    const config = node.config;
    const outputFormat = config.outputFormat || 'text';
    
    // Get the input for this output node
    const input = this.getNodeInput(node, context);
    
    let formattedOutput: any;
    
    switch (outputFormat) {
      case 'json':
        formattedOutput = typeof input === 'object' ? input : { result: input };
        break;
      case 'text':
        formattedOutput = typeof input === 'string' ? input : String(input);
        break;
      case 'structured':
        formattedOutput = {
          result: input,
          metadata: {
            executionId: context.executionId,
            timestamp: new Date(),
            cost: context.costAccumulator,
            tokensUsed: context.tokensUsed
          }
        };
        break;
      default:
        formattedOutput = input;
    }
    
    return {
      output: formattedOutput,
      cost: 0,
      tokensUsed: 0
    };
  }

  /**
   * Get available prompt templates by category
   */
  async getTemplatesByCategory(category: string): Promise<PromptTemplate[]> {
    try {
      const templates = await db.select()
        .from(promptTemplates)
        .where(and(
          eq(promptTemplates.category, category),
          eq(promptTemplates.status, 'active')
        ));

      return templates;
    } catch (error) {
      console.error('Failed to get templates by category:', error);
      return [];
    }
  }

  /**
   * Search prompt templates
   */
  async searchTemplates(query: string): Promise<PromptTemplate[]> {
    try {
      const templates = await db.select()
        .from(promptTemplates)
        .where(and(
          like(promptTemplates.name, `%${query}%`),
          eq(promptTemplates.status, 'active')
        ));

      return templates;
    } catch (error) {
      console.error('Failed to search templates:', error);
      return [];
    }
  }

  /**
   * Get graph execution analytics
   */
  async getGraphAnalytics(graphId: string): Promise<any> {
    try {
      // This would typically query a dedicated analytics table
      // For now, return basic metrics
      return {
        totalExecutions: 0,
        successRate: 0,
        averageDuration: 0,
        averageCost: 0,
        popularNodes: [],
        errorPatterns: []
      };
    } catch (error) {
      console.error('Failed to get graph analytics:', error);
      throw error;
    }
  }

  // Helper methods
  private validateGraph(graph: any): void {
    if (!graph.nodes || graph.nodes.length === 0) {
      throw new Error('Graph must contain at least one node');
    }

    // Check for required node types
    const hasInput = graph.nodes.some((n: any) => n.type === 'input');
    const hasOutput = graph.nodes.some((n: any) => n.type === 'output');
    
    if (!hasInput) {
      console.warn('Graph has no input nodes - may not receive external data');
    }
    
    if (!hasOutput) {
      console.warn('Graph has no output nodes - may not return structured results');
    }

    // Validate connections
    for (const connection of graph.connections) {
      const sourceExists = graph.nodes.some((n: any) => n.id === connection.sourceNodeId);
      const targetExists = graph.nodes.some((n: any) => n.id === connection.targetNodeId);
      
      if (!sourceExists || !targetExists) {
        throw new Error(`Invalid connection: ${connection.sourceNodeId} -> ${connection.targetNodeId}`);
      }
    }
  }

  private interpolateTemplate(template: string, variables: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return variables[varName] !== undefined ? String(variables[varName]) : match;
    });
  }

  private validateAndConvertType(value: any, type: string): any {
    switch (type) {
      case 'string':
        return String(value);
      case 'number':
        const num = Number(value);
        if (isNaN(num)) throw new Error(`Cannot convert ${value} to number`);
        return num;
      case 'boolean':
        return Boolean(value);
      case 'array':
        return Array.isArray(value) ? value : [value];
      case 'object':
        return typeof value === 'object' ? value : { value };
      default:
        return value;
    }
  }

  private getVariableValue(fieldPath: string, variables: Record<string, any>): any {
    const parts = fieldPath.split('.');
    let value = variables;

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
      case 'matches':
        return new RegExp(expected).test(String(actual));
      default:
        return false;
    }
  }

  private getNodeInput(node: PromptNode, context: ExecutionContext): any {
    // Get input from connected source nodes
    const inputs: any = {};
    
    for (const [nodeId, result] of context.nodeResults.entries()) {
      if (this.isNodeConnectedTo(nodeId, node.id, context)) {
        inputs[nodeId] = result;
      }
    }
    
    return Object.keys(inputs).length === 1 ? Object.values(inputs)[0] : inputs;
  }

  private isNodeConnectedTo(sourceNodeId: string, targetNodeId: string, context: ExecutionContext): boolean {
    // This would check the graph connections - simplified for now
    return context.nodeResults.has(sourceNodeId);
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4); // Rough estimation
  }

  private async updateTemplateStats(templateId: string, success: boolean): Promise<void> {
    try {
      const template = this.templates.get(templateId);
      if (!template) return;

      const newUsageCount = template.usageCount + 1;
      const newSuccessRate = template.successRate * (template.usageCount / newUsageCount) + 
                           (success ? 1 : 0) * (1 / newUsageCount);

      await db.update(promptTemplates)
        .set({
          usageCount: newUsageCount,
          successRate: newSuccessRate,
          lastUsed: new Date()
        })
        .where(eq(promptTemplates.templateId, templateId));

      // Update cached template
      template.usageCount = newUsageCount;
      template.successRate = newSuccessRate;
      template.lastUsed = new Date();
    } catch (error) {
      console.error('Failed to update template stats:', error);
    }
  }
}

export const promptGraphCompiler = new PromptGraphCompiler();