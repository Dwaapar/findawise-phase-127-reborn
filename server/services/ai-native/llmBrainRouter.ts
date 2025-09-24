import { db } from '../../db';
import { 
  llmAgents, 
  taskRoutingHistory, 
  agentMemories, 
  routerLearning,
  agentUsageTracking,
  type LlmAgent,
  type NewTaskRoutingHistory,
  type NewAgentUsageTracking
} from '@shared/schema';
import { eq, desc, and, gte, count, avg, sum, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import OpenAI from 'openai';
import axios from 'axios';

export interface TaskRequest {
  taskId?: string;
  taskType: string;
  complexity: 'simple' | 'medium' | 'complex';
  content: string;
  context?: Record<string, any>;
  maxCost?: number;
  maxLatency?: number;
  preferredProviders?: string[];
  requiresMemory?: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  metadata?: Record<string, any>;
}

export interface TaskResponse {
  taskId: string;
  agentId: string;
  response: string;
  cost: number;
  latencyMs: number;
  tokensUsed: {
    input: number;
    output: number;
  };
  success: boolean;
  qualityScore?: number;
  metadata?: Record<string, any>;
}

export interface AgentCapability {
  taskType: string;
  proficiency: number; // 0.0 to 1.0
  averageCost: number;
  averageLatency: number;
  successRate: number;
}

export interface RoutingDecision {
  selectedAgent: LlmAgent;
  reason: string;
  confidence: number;
  fallbackAgents: LlmAgent[];
  estimatedCost: number;
  estimatedLatency: number;
}

export class LLMBrainRouter {
  private agents: Map<string, LlmAgent> = new Map();
  private providerClients: Map<string, any> = new Map();
  private routingCache: Map<string, RoutingDecision> = new Map();
  private config = {
    maxConcurrentTasks: parseInt(process.env.AI_NATIVE_MAX_CONCURRENT_TASKS || '50'),
    defaultCostBudget: parseFloat(process.env.AI_NATIVE_DEFAULT_COST_BUDGET || '10.0'),
    maxExecutionTime: parseInt(process.env.AI_NATIVE_MAX_EXECUTION_TIME || '300000'),
    enableCaching: process.env.AI_NATIVE_ENABLE_CACHING === 'true',
    enableMemory: process.env.AI_NATIVE_ENABLE_MEMORY === 'true',
    retryAttempts: 3,
    healthCheckInterval: 30000
  };

  constructor() {
    this.initializeProviderClients();
    this.startHealthMonitoring();
  }

  private initializeProviderClients(): void {
    // Initialize OpenAI client
    if (process.env.OPENAI_API_KEY) {
      this.providerClients.set('openai', new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      }));
    }

    // Initialize other provider clients as needed
    console.log('🧠 LLM Brain Router initialized with provider clients');
  }

  private startHealthMonitoring(): void {
    setInterval(async () => {
      await this.performHealthChecks();
    }, this.config.healthCheckInterval);
  }

  /**
   * Register a new LLM agent in the brain router
   */
  async registerAgent(agentConfig: {
    name: string;
    provider: string;
    model: string;
    apiEndpoint: string;
    apiKey: string;
    capabilities: string[];
    costPerToken: number;
    rateLimit: number;
    maxTokens: number;
    config?: Record<string, any>;
    metadata?: Record<string, any>;
  }, userId?: number): Promise<string> {
    try {
      const [newAgent] = await db.insert(llmAgents).values({
        name: agentConfig.name,
        provider: agentConfig.provider,
        model: agentConfig.model,
        apiEndpoint: agentConfig.apiEndpoint,
        apiKey: agentConfig.apiKey, // Should be encrypted in production
        capabilities: agentConfig.capabilities,
        costPerToken: agentConfig.costPerToken,
        rateLimit: agentConfig.rateLimit,
        maxTokens: agentConfig.maxTokens,
        status: 'active',
        latencyMs: 0,
        successRate: 1.0,
        quotaDaily: 0,
        quotaUsed: 0,
        config: {},
        metadata: {}
      }).returning();

      // Cache the agent
      this.agents.set(newAgent.agentId, newAgent);

      console.log(`🤖 Registered new agent: ${agentConfig.name} (${newAgent.agentId})`);
      return newAgent.agentId;
    } catch (error) {
      console.error('Failed to register agent:', error);
      throw error;
    }
  }

  /**
   * Load all agents from database into memory
   */
  async loadAgents(): Promise<void> {
    try {
      const agents = await db.select().from(llmAgents).where(eq(llmAgents.status, 'active'));
      
      this.agents.clear();
      for (const agent of agents) {
        this.agents.set(agent.agentId, agent);
      }

      console.log(`🧠 Loaded ${agents.length} active agents into router`);
    } catch (error) {
      console.error('Failed to load agents:', error);
      throw error;
    }
  }

  /**
   * Route a task to the best available agent
   */
  async routeTask(request: TaskRequest): Promise<TaskResponse> {
    const taskId = request.taskId || randomUUID();
    const startTime = Date.now();

    try {
      // Get routing decision
      const routing = await this.getRoutingDecision(request);
      
      // Execute task with selected agent
      const response = await this.executeTask(routing.selectedAgent, request, taskId);

      // Record routing history
      await this.recordRoutingHistory(taskId, request, routing, response, true);

      // Update agent usage tracking
      await this.recordUsageTracking(routing.selectedAgent.agentId, request, response);

      // Learn from this execution
      await this.updateRoutingLearning(request, routing, response);

      return {
        ...response,
        taskId
      };

    } catch (error) {
      console.error(`Task execution failed for ${taskId}:`, error);
      
      // Record failed routing
      await this.recordRoutingHistory(taskId, request, null, null, false, error.message);

      // Try fallback if available
      return await this.handleFailureWithFallback(request, taskId, error);
    }
  }

  /**
   * Intelligent routing decision based on task characteristics and agent capabilities
   */
  private async getRoutingDecision(request: TaskRequest): Promise<RoutingDecision> {
    const cacheKey = this.generateCacheKey(request);
    
    // Check cache if enabled
    if (this.config.enableCaching && this.routingCache.has(cacheKey)) {
      const cached = this.routingCache.get(cacheKey)!;
      if (this.agents.has(cached.selectedAgent.agentId)) {
        return cached;
      }
    }

    // Get available agents
    const availableAgents = Array.from(this.agents.values()).filter(agent => 
      agent.status === 'active' && this.isAgentCapable(agent, request)
    );

    if (availableAgents.length === 0) {
      throw new Error('No available agents for this task type');
    }

    // Score agents based on multiple factors
    const scoredAgents = await this.scoreAgents(availableAgents, request);
    
    // Select best agent
    const selectedAgent = scoredAgents[0].agent;
    const fallbackAgents = scoredAgents.slice(1, 3).map(s => s.agent);

    const decision: RoutingDecision = {
      selectedAgent,
      reason: `Best match: ${scoredAgents[0].score.toFixed(2)} score`,
      confidence: scoredAgents[0].score,
      fallbackAgents,
      estimatedCost: this.estimateCost(selectedAgent, request),
      estimatedLatency: selectedAgent.latencyMs || 1000
    };

    // Cache decision
    if (this.config.enableCaching) {
      this.routingCache.set(cacheKey, decision);
    }

    return decision;
  }

  /**
   * Score agents based on task requirements and historical performance
   */
  private async scoreAgents(agents: LlmAgent[], request: TaskRequest): Promise<Array<{agent: LlmAgent, score: number}>> {
    const scored = await Promise.all(agents.map(async (agent) => {
      let score = 0;
      
      // Capability match (40% weight)
      const capabilityScore = this.getCapabilityScore(agent, request);
      score += capabilityScore * 0.4;
      
      // Performance history (30% weight)
      const performanceScore = await this.getPerformanceScore(agent, request);
      score += performanceScore * 0.3;
      
      // Cost efficiency (20% weight)
      const costScore = this.getCostScore(agent, request);
      score += costScore * 0.2;
      
      // Availability (10% weight)
      const availabilityScore = this.getAvailabilityScore(agent);
      score += availabilityScore * 0.1;

      return { agent, score };
    }));

    return scored.sort((a, b) => b.score - a.score);
  }

  /**
   * Execute task with selected agent
   */
  private async executeTask(agent: LlmAgent, request: TaskRequest, taskId: string): Promise<TaskResponse> {
    const startTime = Date.now();
    let inputTokens = 0;
    let outputTokens = 0;
    
    try {
      let response: string;
      
      if (agent.provider === 'openai') {
        const client = this.providerClients.get('openai');
        const completion = await client.chat.completions.create({
          model: agent.model,
          messages: [
            { role: 'user', content: request.content }
          ],
          max_tokens: Math.min(request.maxLatency ? 1000 : 2000, agent.maxTokens),
          temperature: 0.7
        });
        
        response = completion.choices[0].message.content || '';
        inputTokens = completion.usage?.prompt_tokens || 0;
        outputTokens = completion.usage?.completion_tokens || 0;
      } else {
        // Handle other providers
        response = await this.executeCustomProvider(agent, request);
        inputTokens = this.estimateTokens(request.content);
        outputTokens = this.estimateTokens(response);
      }

      const latencyMs = Date.now() - startTime;
      const cost = (inputTokens + outputTokens) * agent.costPerToken;

      // Store in memory if enabled
      if (this.config.enableMemory) {
        await this.storeInMemory(agent.agentId, request, response);
      }

      return {
        taskId,
        agentId: agent.agentId,
        response,
        cost,
        latencyMs,
        tokensUsed: { input: inputTokens, output: outputTokens },
        success: true,
        qualityScore: await this.assessQuality(request, response),
        metadata: { provider: agent.provider, model: agent.model }
      };

    } catch (error) {
      const latencyMs = Date.now() - startTime;
      throw new Error(`Agent execution failed: ${error.message}`);
    }
  }

  /**
   * Handle custom provider execution
   */
  private async executeCustomProvider(agent: LlmAgent, request: TaskRequest): Promise<string> {
    try {
      const response = await axios.post(agent.apiEndpoint, {
        model: agent.model,
        prompt: request.content,
        max_tokens: agent.maxTokens,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${agent.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: this.config.maxExecutionTime
      });

      return response.data.choices?.[0]?.text || response.data.response || '';
    } catch (error) {
      throw new Error(`Custom provider request failed: ${error.message}`);
    }
  }

  /**
   * Store successful interactions in agent memory
   */
  private async storeInMemory(agentId: string, request: TaskRequest, response: string): Promise<void> {
    try {
      await db.insert(agentMemories).values({
        agentId,
        taskType: request.taskType,
        prompt: request.content,
        response,
        context: request.context || {},
        tags: [request.taskType, request.complexity],
        qualityScore: null,
        usageCount: 1,
        metadata: request.metadata || {}
      });
    } catch (error) {
      console.error('Failed to store memory:', error);
    }
  }

  /**
   * Record routing history for learning and analytics
   */
  private async recordRoutingHistory(
    taskId: string,
    request: TaskRequest,
    routing: RoutingDecision | null,
    response: TaskResponse | null,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    try {
      const record: NewTaskRoutingHistory = {
        taskId,
        taskType: request.taskType,
        taskComplexity: request.complexity,
        originalAgentId: routing?.selectedAgent.agentId || '',
        finalAgentId: response?.agentId || routing?.selectedAgent.agentId || '',
        fallbackCount: 0,
        routingReason: routing?.reason || 'No routing decision',
        inputTokens: response?.tokensUsed.input || 0,
        outputTokens: response?.tokensUsed.output || 0,
        totalCost: response?.cost || 0,
        latencyMs: response?.latencyMs || 0,
        success,
        errorMessage,
        qualityScore: response?.qualityScore,
        conversionImpact: null,
        contextSize: JSON.stringify(request.context || {}).length,
        parallelRoutes: [],
        metadata: {
          priority: request.priority,
          ...request.metadata
        }
      };

      await db.insert(taskRoutingHistory).values(record);
    } catch (error) {
      console.error('Failed to record routing history:', error);
    }
  }

  /**
   * Record agent usage for cost tracking and analytics
   */
  private async recordUsageTracking(
    agentId: string,
    request: TaskRequest,
    response: TaskResponse
  ): Promise<void> {
    try {
      const record: NewAgentUsageTracking = {
        agentId,
        userId: null,
        projectId: null,
        taskType: request.taskType,
        inputTokens: response.tokensUsed.input,
        outputTokens: response.tokensUsed.output,
        totalCost: response.cost,
        latencyMs: response.latencyMs,
        success: response.success,
        metadata: {
          complexity: request.complexity,
          priority: request.priority,
          ...request.metadata
        }
      };

      await db.insert(agentUsageTracking).values(record);
    } catch (error) {
      console.error('Failed to record usage tracking:', error);
    }
  }

  /**
   * Update routing learning for adaptive intelligence
   */
  private async updateRoutingLearning(
    request: TaskRequest,
    routing: RoutingDecision,
    response: TaskResponse
  ): Promise<void> {
    try {
      // Extract context patterns for learning
      const contextPatterns = {
        taskLength: request.content.length,
        hasContext: !!request.context,
        complexity: request.complexity,
        priority: request.priority,
        keywords: this.extractKeywords(request.content)
      };

      // Check if we have existing learning data for this pattern
      const existing = await db.select()
        .from(routerLearning)
        .where(and(
          eq(routerLearning.taskType, request.taskType),
          eq(routerLearning.complexity, request.complexity)
        ))
        .limit(1);

      if (existing.length > 0) {
        // Update existing learning
        const current = existing[0];
        const newSampleSize = current.sampleSize + 1;
        const newSuccessRate = (current.successRate * current.sampleSize + (response.success ? 1 : 0)) / newSampleSize;
        const newAverageCost = (current.averageCost * current.sampleSize + response.cost) / newSampleSize;
        const newAverageLatency = (current.averageLatency * current.sampleSize + response.latencyMs) / newSampleSize;

        await db.update(routerLearning)
          .set({
            bestAgentId: routing.selectedAgent.agentId, // Update if this was successful
            successRate: newSuccessRate,
            averageCost: newAverageCost,
            averageLatency: newAverageLatency,
            confidence: Math.min(1.0, newSampleSize / 100), // Confidence increases with sample size
            sampleSize: newSampleSize,
            lastUpdated: new Date(),
            trainingData: contextPatterns
          })
          .where(eq(routerLearning.id, current.id));
      } else {
        // Create new learning record
        await db.insert(routerLearning).values({
          taskType: request.taskType,
          complexity: request.complexity,
          contextPatterns,
          bestAgentId: routing.selectedAgent.agentId,
          alternativeAgents: routing.fallbackAgents.map(a => a.agentId),
          successRate: response.success ? 1.0 : 0.0,
          averageCost: response.cost,
          averageLatency: response.latencyMs,
          confidence: 0.1, // Low confidence for first sample
          sampleSize: 1,
          modelVersion: '1.0',
          trainingData: contextPatterns,
          metadata: {}
        });
      }
    } catch (error) {
      console.error('Failed to update routing learning:', error);
    }
  }

  /**
   * Handle failures with intelligent fallback
   */
  private async handleFailureWithFallback(
    request: TaskRequest,
    taskId: string,
    originalError: Error
  ): Promise<TaskResponse> {
    // Try to get fallback agents
    const routing = await this.getRoutingDecision(request);
    
    for (const fallbackAgent of routing.fallbackAgents) {
      try {
        console.log(`🔄 Trying fallback agent: ${fallbackAgent.name}`);
        const response = await this.executeTask(fallbackAgent, request, taskId);
        
        // Record successful fallback
        await this.recordRoutingHistory(taskId, request, routing, response, true);
        
        return {
          ...response,
          metadata: {
            ...response.metadata,
            fallback: true,
            originalError: originalError.message
          }
        };
      } catch (fallbackError) {
        console.error(`Fallback agent failed: ${fallbackError.message}`);
        continue;
      }
    }

    // All agents failed
    throw new Error(`All agents failed. Original error: ${originalError.message}`);
  }

  /**
   * Perform health checks on all agents
   */
  private async performHealthChecks(): Promise<void> {
    const agents = Array.from(this.agents.values());
    const healthPromises = agents.map(agent => this.checkAgentHealth(agent));
    
    await Promise.allSettled(healthPromises);
  }

  /**
   * Check individual agent health
   */
  private async checkAgentHealth(agent: LlmAgent): Promise<void> {
    try {
      const healthCheck: TaskRequest = {
        taskType: 'health_check',
        complexity: 'simple',
        content: 'Health check: respond with "OK"',
        priority: 'low'
      };

      const startTime = Date.now();
      await this.executeTask(agent, healthCheck, `health_${agent.agentId}`);
      const latency = Date.now() - startTime;

      // Update agent health metrics
      await db.update(llmAgents)
        .set({
          status: 'active',
          latencyMs: latency,
          lastUsed: new Date()
        })
        .where(eq(llmAgents.agentId, agent.agentId));

    } catch (error) {
      console.error(`Agent ${agent.name} health check failed:`, error);
      
      // Mark agent as degraded
      await db.update(llmAgents)
        .set({
          status: 'degraded'
        })
        .where(eq(llmAgents.agentId, agent.agentId));
    }
  }

  // Helper methods
  private generateCacheKey(request: TaskRequest): string {
    return `${request.taskType}_${request.complexity}_${this.hashContent(request.content)}`;
  }

  private hashContent(content: string): string {
    // Simple hash for caching - in production use proper hashing
    return content.substring(0, 20).replace(/\s/g, '_');
  }

  private isAgentCapable(agent: LlmAgent, request: TaskRequest): boolean {
    const capabilities = agent.capabilities as string[];
    return capabilities.includes(request.taskType) || capabilities.includes('general');
  }

  private getCapabilityScore(agent: LlmAgent, request: TaskRequest): number {
    const capabilities = agent.capabilities as string[];
    if (capabilities.includes(request.taskType)) return 1.0;
    if (capabilities.includes('general')) return 0.7;
    return 0.0;
  }

  private async getPerformanceScore(agent: LlmAgent, request: TaskRequest): number {
    return agent.successRate || 0.8; // Default to 0.8 if no history
  }

  private getCostScore(agent: LlmAgent, request: TaskRequest): number {
    const maxCost = request.maxCost || this.config.defaultCostBudget;
    const estimatedCost = this.estimateCost(agent, request);
    return Math.max(0, 1 - (estimatedCost / maxCost));
  }

  private getAvailabilityScore(agent: LlmAgent): number {
    if (agent.status === 'active') return 1.0;
    if (agent.status === 'degraded') return 0.5;
    return 0.0;
  }

  private estimateCost(agent: LlmAgent, request: TaskRequest): number {
    const estimatedTokens = this.estimateTokens(request.content) * 2; // Input + output estimate
    return estimatedTokens * agent.costPerToken;
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4); // Rough token estimation
  }

  private async assessQuality(request: TaskRequest, response: string): Promise<number> {
    // Simple quality assessment - in production, use more sophisticated methods
    if (response.length < 10) return 0.3;
    if (response.toLowerCase().includes('error')) return 0.4;
    return 0.8; // Default good quality
  }

  private extractKeywords(text: string): string[] {
    return text.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 10); // Top 10 keywords
  }

  /**
   * Get agent statistics and performance metrics
   */
  async getAgentStats(): Promise<any> {
    const agents = await db.select().from(llmAgents);
    const totalTasks = await db.select({ count: count() }).from(taskRoutingHistory);
    const successfulTasks = await db.select({ count: count() })
      .from(taskRoutingHistory)
      .where(eq(taskRoutingHistory.success, true));

    return {
      totalAgents: agents.length,
      activeAgents: agents.filter(a => a.status === 'active').length,
      totalTasks: totalTasks[0].count,
      successRate: totalTasks[0].count > 0 ? successfulTasks[0].count / totalTasks[0].count : 0,
      agents: agents.map(agent => ({
        id: agent.agentId,
        name: agent.name,
        provider: agent.provider,
        model: agent.model,
        status: agent.status,
        successRate: agent.successRate,
        latencyMs: agent.latencyMs,
        costPerToken: agent.costPerToken
      }))
    };
  }
}

export const llmBrainRouter = new LLMBrainRouter();