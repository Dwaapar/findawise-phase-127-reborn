import { db } from '../../db';
import { 
  federationTasks,
  llmAgents,
  agentUsageTracking,
  type FederationTask,
  type NewFederationTask,
  type LlmAgent
} from '@shared/schema';
import { eq, desc, and, gte, count, avg, sum, inArray, ne } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { llmBrainRouter, type TaskRequest, type TaskResponse } from './llmBrainRouter';
import WebSocket from 'ws';

export interface TaskCapability {
  taskType: string;
  complexity: string[];
  estimatedLatency: number;
  estimatedCost: number;
  successRate: number;
  lastUpdated: Date;
}

export interface NeuronWorker {
  neuronId: string;
  name: string;
  capabilities: TaskCapability[];
  status: 'online' | 'busy' | 'offline';
  currentLoad: number; // 0.0 to 1.0
  maxConcurrentTasks: number;
  activeTasks: string[];
  healthScore: number;
  location?: string;
  lastHeartbeat: Date;
  connection?: WebSocket;
}

export interface TaskAssignment {
  taskId: string;
  assignedNeuron: string;
  assignedAgent?: string;
  priority: number;
  estimatedCompletion: Date;
  backupNeurons: string[];
  routingReason: string;
}

export interface LoadBalancingStrategy {
  strategy: 'round_robin' | 'least_loaded' | 'capability_match' | 'geographic' | 'cost_optimized';
  weights: {
    performance: number;
    cost: number;
    latency: number;
    reliability: number;
  };
}

export class FederationTaskManager {
  private connectedNeurons: Map<string, NeuronWorker> = new Map();
  private taskQueue: Map<string, FederationTask> = new Map();
  private taskAssignments: Map<string, TaskAssignment> = new Map();
  private loadBalancer: LoadBalancingStrategy = {
    strategy: 'capability_match',
    weights: {
      performance: 0.4,
      cost: 0.2,
      latency: 0.3,
      reliability: 0.1
    }
  };
  
  private config = {
    maxQueueSize: parseInt(process.env.FEDERATION_MAX_QUEUE_SIZE || '1000'),
    heartbeatInterval: parseInt(process.env.FEDERATION_HEARTBEAT_INTERVAL || '30000'),
    taskTimeout: parseInt(process.env.FEDERATION_TASK_TIMEOUT || '300000'),
    maxRetries: parseInt(process.env.FEDERATION_MAX_RETRIES || '3'),
    enableIntelligenceSharing: process.env.FEDERATION_ENABLE_INTELLIGENCE_SHARING !== 'false'
  };

  constructor() {
    this.initializeTaskManager();
    this.startHeartbeatMonitoring();
    this.startTaskProcessor();
  }

  private initializeTaskManager(): void {
    console.log('🛰 Federation Task Manager initialized');
    this.loadExistingTasks();
  }

  private async loadExistingTasks(): Promise<void> {
    try {
      const pendingTasks = await db.select()
        .from(federationTasks)
        .where(inArray(federationTasks.status, ['pending', 'assigned', 'running']));

      for (const task of pendingTasks) {
        this.taskQueue.set(task.taskId, task);
      }

      console.log(`📋 Loaded ${pendingTasks.length} pending tasks from database`);
    } catch (error) {
      console.error('Failed to load existing tasks:', error);
    }
  }

  private startHeartbeatMonitoring(): void {
    setInterval(() => {
      this.checkNeuronHealth();
    }, this.config.heartbeatInterval);
  }

  private startTaskProcessor(): void {
    setInterval(() => {
      this.processTaskQueue();
    }, 5000); // Process queue every 5 seconds
  }

  /**
   * Register a neuron worker in the federation
   */
  async registerNeuron(neuron: {
    neuronId: string;
    name: string;
    capabilities: TaskCapability[];
    maxConcurrentTasks: number;
    location?: string;
    connection?: WebSocket;
  }): Promise<void> {
    try {
      const worker: NeuronWorker = {
        neuronId: neuron.neuronId,
        name: neuron.name,
        capabilities: neuron.capabilities,
        status: 'online',
        currentLoad: 0,
        maxConcurrentTasks: neuron.maxConcurrentTasks,
        activeTasks: [],
        healthScore: 1.0,
        location: neuron.location,
        lastHeartbeat: new Date(),
        connection: neuron.connection
      };

      this.connectedNeurons.set(neuron.neuronId, worker);

      // Set up WebSocket handlers if connection provided
      if (neuron.connection) {
        this.setupNeuronConnection(neuron.neuronId, neuron.connection);
      }

      console.log(`🔗 Registered neuron worker: ${neuron.name} (${neuron.neuronId})`);
      console.log(`   Capabilities: ${neuron.capabilities.map(c => c.taskType).join(', ')}`);
    } catch (error) {
      console.error('Failed to register neuron:', error);
      throw error;
    }
  }

  private setupNeuronConnection(neuronId: string, connection: WebSocket): void {
    connection.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        await this.handleNeuronMessage(neuronId, message);
      } catch (error) {
        console.error(`Error handling message from ${neuronId}:`, error);
      }
    });

    connection.on('close', () => {
      this.handleNeuronDisconnection(neuronId);
    });

    connection.on('error', (error) => {
      console.error(`WebSocket error for ${neuronId}:`, error);
      this.handleNeuronDisconnection(neuronId);
    });
  }

  private async handleNeuronMessage(neuronId: string, message: any): Promise<void> {
    const neuron = this.connectedNeurons.get(neuronId);
    if (!neuron) return;

    switch (message.type) {
      case 'heartbeat':
        neuron.lastHeartbeat = new Date();
        neuron.currentLoad = message.load || 0;
        neuron.healthScore = message.healthScore || 1.0;
        break;

      case 'task_completed':
        await this.handleTaskCompletion(neuronId, message.taskId, message.result);
        break;

      case 'task_failed':
        await this.handleTaskFailure(neuronId, message.taskId, message.error);
        break;

      case 'capability_update':
        neuron.capabilities = message.capabilities;
        break;

      case 'intelligence_sharing':
        if (this.config.enableIntelligenceSharing) {
          await this.processSharedIntelligence(neuronId, message.data);
        }
        break;
    }
  }

  private handleNeuronDisconnection(neuronId: string): void {
    const neuron = this.connectedNeurons.get(neuronId);
    if (neuron) {
      neuron.status = 'offline';
      console.log(`🔌 Neuron disconnected: ${neuron.name} (${neuronId})`);
      
      // Reassign active tasks to other neurons
      this.reassignActiveTasks(neuronId);
    }
  }

  /**
   * Submit a task to the federation for processing
   */
  async submitTask(task: {
    sourceNeuron: string;
    targetNeuron?: string;
    taskType: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    payload: Record<string, any>;
    maxRetries?: number;
    costBudget?: number;
    deadline?: Date;
    metadata?: Record<string, any>;
  }): Promise<string> {
    try {
      const taskId = randomUUID();
      const federationTask: NewFederationTask = {
        taskId,
        sourceNeuron: task.sourceNeuron,
        targetNeuron: task.targetNeuron,
        taskType: task.taskType,
        priority: task.priority,
        payload: task.payload,
        maxRetries: task.maxRetries || this.config.maxRetries,
        costBudget: task.costBudget || 0,
        expiresAt: task.deadline,
        metadata: task.metadata || {}
      };

      // Save to database
      const [savedTask] = await db.insert(federationTasks).values(federationTask).returning();
      
      // Add to processing queue
      this.taskQueue.set(taskId, savedTask);

      console.log(`📤 Task submitted to federation: ${taskId} (${task.taskType})`);
      return taskId;
    } catch (error) {
      console.error('Failed to submit task:', error);
      throw error;
    }
  }

  /**
   * Process the task queue and assign tasks to available neurons
   */
  private async processTaskQueue(): Promise<void> {
    if (this.taskQueue.size === 0) return;

    const pendingTasks = Array.from(this.taskQueue.values())
      .filter(task => task.status === 'pending')
      .sort((a, b) => this.getPriorityScore(b.priority) - this.getPriorityScore(a.priority));

    for (const task of pendingTasks.slice(0, 10)) { // Process up to 10 tasks at once
      try {
        await this.assignTask(task);
      } catch (error) {
        console.error(`Failed to assign task ${task.taskId}:`, error);
        await this.handleTaskFailure('system', task.taskId, error.message);
      }
    }
  }

  /**
   * Assign a task to the best available neuron
   */
  private async assignTask(task: FederationTask): Promise<void> {
    // Find the best neuron for this task
    const assignment = await this.findBestNeuron(task);
    if (!assignment) {
      console.log(`⏳ No available neurons for task ${task.taskId}, keeping in queue`);
      return;
    }

    // Update task status
    await db.update(federationTasks)
      .set({
        status: 'assigned',
        assignedAgent: assignment.assignedAgent,
        startedAt: new Date()
      })
      .where(eq(federationTasks.taskId, task.taskId));

    // Update neuron load
    const neuron = this.connectedNeurons.get(assignment.assignedNeuron);
    if (neuron) {
      neuron.activeTasks.push(task.taskId);
      neuron.currentLoad = neuron.activeTasks.length / neuron.maxConcurrentTasks;
    }

    // Store assignment
    this.taskAssignments.set(task.taskId, assignment);

    // Send task to neuron
    await this.sendTaskToNeuron(assignment.assignedNeuron, task);

    console.log(`🎯 Task assigned: ${task.taskId} → ${assignment.assignedNeuron} (${assignment.routingReason})`);
  }

  /**
   * Find the best neuron for a given task using intelligent routing
   */
  private async findBestNeuron(task: FederationTask): Promise<TaskAssignment | null> {
    const availableNeurons = Array.from(this.connectedNeurons.values())
      .filter(neuron => 
        neuron.status === 'online' &&
        neuron.currentLoad < 1.0 &&
        this.hasCapability(neuron, task.taskType)
      );

    if (availableNeurons.length === 0) {
      return null;
    }

    // If target neuron specified and available, use it
    if (task.targetNeuron) {
      const targetNeuron = availableNeurons.find(n => n.neuronId === task.targetNeuron);
      if (targetNeuron) {
        return {
          taskId: task.taskId,
          assignedNeuron: task.targetNeuron,
          priority: this.getPriorityScore(task.priority),
          estimatedCompletion: this.estimateCompletion(targetNeuron, task),
          backupNeurons: availableNeurons.filter(n => n.neuronId !== task.targetNeuron).slice(0, 2).map(n => n.neuronId),
          routingReason: 'Target neuron specified'
        };
      }
    }

    // Score and rank neurons
    const scoredNeurons = await this.scoreNeurons(availableNeurons, task);
    const bestNeuron = scoredNeurons[0];

    if (!bestNeuron) {
      return null;
    }

    return {
      taskId: task.taskId,
      assignedNeuron: bestNeuron.neuron.neuronId,
      assignedAgent: bestNeuron.bestAgent?.agentId,
      priority: this.getPriorityScore(task.priority),
      estimatedCompletion: this.estimateCompletion(bestNeuron.neuron, task),
      backupNeurons: scoredNeurons.slice(1, 3).map(s => s.neuron.neuronId),
      routingReason: `Best match: ${bestNeuron.score.toFixed(2)} score`
    };
  }

  /**
   * Score neurons based on task requirements and current state
   */
  private async scoreNeurons(neurons: NeuronWorker[], task: FederationTask): Promise<Array<{
    neuron: NeuronWorker;
    score: number;
    bestAgent?: LlmAgent;
  }>> {
    const scored = await Promise.all(neurons.map(async (neuron) => {
      let score = 0;
      let bestAgent: LlmAgent | undefined;

      // Capability match (40% weight)
      const capability = neuron.capabilities.find(c => c.taskType === task.taskType);
      if (capability) {
        score += capability.successRate * this.loadBalancer.weights.performance * 0.4;
      }

      // Load factor (30% weight)
      const loadScore = (1 - neuron.currentLoad) * 0.3;
      score += loadScore;

      // Health score (20% weight)
      score += neuron.healthScore * 0.2;

      // Get best agent for this task type within the neuron
      const agents = await db.select()
        .from(llmAgents)
        .where(eq(llmAgents.status, 'active'));
      
      const capableAgents = agents.filter(agent => {
        const capabilities = agent.capabilities as string[];
        return capabilities.includes(task.taskType) || capabilities.includes('general');
      });

      if (capableAgents.length > 0) {
        bestAgent = capableAgents.sort((a, b) => (b.successRate || 0) - (a.successRate || 0))[0];
        score += 0.1; // Bonus for having capable agents
      }

      // Priority boost
      if (task.priority === 'urgent') score *= 1.2;
      else if (task.priority === 'high') score *= 1.1;

      return { neuron, score, bestAgent };
    }));

    return scored.sort((a, b) => b.score - a.score);
  }

  /**
   * Send task to assigned neuron
   */
  private async sendTaskToNeuron(neuronId: string, task: FederationTask): Promise<void> {
    const neuron = this.connectedNeurons.get(neuronId);
    if (!neuron || !neuron.connection) {
      throw new Error(`Cannot send task to neuron ${neuronId} - no connection`);
    }

    const message = {
      type: 'task_assignment',
      taskId: task.taskId,
      taskType: task.taskType,
      payload: task.payload,
      priority: task.priority,
      costBudget: task.costBudget,
      maxRetries: task.maxRetries,
      metadata: task.metadata
    };

    try {
      neuron.connection.send(JSON.stringify(message));
    } catch (error) {
      console.error(`Failed to send task to neuron ${neuronId}:`, error);
      throw error;
    }
  }

  /**
   * Handle task completion from neuron
   */
  private async handleTaskCompletion(neuronId: string, taskId: string, result: any): Promise<void> {
    try {
      // Update task in database
      await db.update(federationTasks)
        .set({
          status: 'completed',
          result,
          completedAt: new Date()
        })
        .where(eq(federationTasks.taskId, taskId));

      // Update neuron load
      const neuron = this.connectedNeurons.get(neuronId);
      if (neuron) {
        neuron.activeTasks = neuron.activeTasks.filter(id => id !== taskId);
        neuron.currentLoad = neuron.activeTasks.length / neuron.maxConcurrentTasks;
      }

      // Remove from queue and assignments
      this.taskQueue.delete(taskId);
      this.taskAssignments.delete(taskId);

      console.log(`✅ Task completed: ${taskId} by ${neuronId}`);

      // Update neuron performance metrics
      await this.updateNeuronPerformance(neuronId, taskId, true);
    } catch (error) {
      console.error('Failed to handle task completion:', error);
    }
  }

  /**
   * Handle task failure from neuron
   */
  private async handleTaskFailure(neuronId: string, taskId: string, error: string): Promise<void> {
    try {
      const task = this.taskQueue.get(taskId);
      if (!task) return;

      // Check if we should retry
      if (task.retryCount < task.maxRetries) {
        // Increment retry count and reassign
        await db.update(federationTasks)
          .set({
            retryCount: task.retryCount + 1,
            status: 'pending'
          })
          .where(eq(federationTasks.taskId, taskId));

        console.log(`🔄 Retrying task: ${taskId} (attempt ${task.retryCount + 1}/${task.maxRetries})`);
      } else {
        // Mark as failed
        await db.update(federationTasks)
          .set({
            status: 'failed',
            completedAt: new Date(),
            result: { error }
          })
          .where(eq(federationTasks.taskId, taskId));

        console.log(`❌ Task failed permanently: ${taskId} - ${error}`);
        this.taskQueue.delete(taskId);
      }

      // Update neuron load
      const neuron = this.connectedNeurons.get(neuronId);
      if (neuron) {
        neuron.activeTasks = neuron.activeTasks.filter(id => id !== taskId);
        neuron.currentLoad = neuron.activeTasks.length / neuron.maxConcurrentTasks;
      }

      this.taskAssignments.delete(taskId);

      // Update neuron performance metrics
      await this.updateNeuronPerformance(neuronId, taskId, false);
    } catch (error) {
      console.error('Failed to handle task failure:', error);
    }
  }

  /**
   * Check health of all connected neurons
   */
  private checkNeuronHealth(): void {
    const now = new Date();
    const healthTimeout = this.config.heartbeatInterval * 2; // 2x heartbeat interval

    for (const [neuronId, neuron] of this.connectedNeurons.entries()) {
      const timeSinceHeartbeat = now.getTime() - neuron.lastHeartbeat.getTime();
      
      if (timeSinceHeartbeat > healthTimeout) {
        if (neuron.status === 'online') {
          console.log(`⚠️ Neuron health degraded: ${neuron.name} (${neuronId})`);
          neuron.status = 'offline';
          neuron.healthScore = Math.max(0, neuron.healthScore - 0.1);
          
          // Reassign active tasks
          this.reassignActiveTasks(neuronId);
        }
      } else if (neuron.status === 'offline' && timeSinceHeartbeat <= healthTimeout) {
        console.log(`✅ Neuron health restored: ${neuron.name} (${neuronId})`);
        neuron.status = 'online';
        neuron.healthScore = Math.min(1.0, neuron.healthScore + 0.2);
      }
    }
  }

  /**
   * Reassign active tasks from failed neuron to other available neurons
   */
  private async reassignActiveTasks(failedNeuronId: string): Promise<void> {
    const failedNeuron = this.connectedNeurons.get(failedNeuronId);
    if (!failedNeuron) return;

    for (const taskId of failedNeuron.activeTasks) {
      try {
        // Reset task to pending status
        await db.update(federationTasks)
          .set({
            status: 'pending',
            assignedAgent: null,
            retryCount: 0 // Reset retry count for reassignment
          })
          .where(eq(federationTasks.taskId, taskId));

        // Add back to queue
        const task = await db.select()
          .from(federationTasks)
          .where(eq(federationTasks.taskId, taskId))
          .limit(1);

        if (task[0]) {
          this.taskQueue.set(taskId, task[0]);
          console.log(`🔄 Reassigning task from failed neuron: ${taskId}`);
        }
      } catch (error) {
        console.error(`Failed to reassign task ${taskId}:`, error);
      }
    }

    failedNeuron.activeTasks = [];
    failedNeuron.currentLoad = 0;
  }

  /**
   * Process shared intelligence from neurons
   */
  private async processSharedIntelligence(neuronId: string, intelligence: any): Promise<void> {
    try {
      // Store intelligence for cross-neuron learning
      const neuron = this.connectedNeurons.get(neuronId);
      if (!neuron) return;

      console.log(`🧠 Processing shared intelligence from ${neuron.name}`);

      // Update capabilities based on shared performance data
      if (intelligence.capabilities) {
        neuron.capabilities = intelligence.capabilities;
      }

      // Share insights with other neurons
      if (intelligence.insights) {
        await this.broadcastIntelligence(neuronId, intelligence.insights);
      }
    } catch (error) {
      console.error('Failed to process shared intelligence:', error);
    }
  }

  /**
   * Broadcast intelligence insights to other neurons
   */
  private async broadcastIntelligence(sourceNeuronId: string, insights: any): Promise<void> {
    const message = {
      type: 'intelligence_broadcast',
      source: sourceNeuronId,
      insights,
      timestamp: new Date()
    };

    for (const [neuronId, neuron] of this.connectedNeurons.entries()) {
      if (neuronId !== sourceNeuronId && neuron.connection && neuron.status === 'online') {
        try {
          neuron.connection.send(JSON.stringify(message));
        } catch (error) {
          console.error(`Failed to broadcast intelligence to ${neuronId}:`, error);
        }
      }
    }
  }

  /**
   * Update neuron performance metrics
   */
  private async updateNeuronPerformance(neuronId: string, taskId: string, success: boolean): Promise<void> {
    const neuron = this.connectedNeurons.get(neuronId);
    if (!neuron) return;

    // Update success rate in capabilities
    const task = await db.select()
      .from(federationTasks)
      .where(eq(federationTasks.taskId, taskId))
      .limit(1);

    if (task[0]) {
      const capability = neuron.capabilities.find(c => c.taskType === task[0].taskType);
      if (capability) {
        // Simple moving average update
        const alpha = 0.1; // Learning rate
        capability.successRate = capability.successRate * (1 - alpha) + (success ? 1 : 0) * alpha;
        capability.lastUpdated = new Date();
      }
    }
  }

  /**
   * Get federation statistics
   */
  async getFederationStats(): Promise<any> {
    try {
      const totalNeurons = this.connectedNeurons.size;
      const onlineNeurons = Array.from(this.connectedNeurons.values()).filter(n => n.status === 'online').length;
      const totalTasks = await db.select({ count: count() }).from(federationTasks);
      const completedTasks = await db.select({ count: count() })
        .from(federationTasks)
        .where(eq(federationTasks.status, 'completed'));
      
      const queuedTasks = this.taskQueue.size;
      const activeTasks = Array.from(this.connectedNeurons.values())
        .reduce((sum, neuron) => sum + neuron.activeTasks.length, 0);

      const avgHealthScore = Array.from(this.connectedNeurons.values())
        .reduce((sum, neuron) => sum + neuron.healthScore, 0) / Math.max(1, totalNeurons);

      return {
        federation: {
          totalNeurons,
          onlineNeurons,
          avgHealthScore,
          loadBalancingStrategy: this.loadBalancer.strategy
        },
        tasks: {
          total: totalTasks[0].count,
          completed: completedTasks[0].count,
          queued: queuedTasks,
          active: activeTasks,
          successRate: totalTasks[0].count > 0 ? completedTasks[0].count / totalTasks[0].count : 0
        },
        neurons: Array.from(this.connectedNeurons.values()).map(neuron => ({
          id: neuron.neuronId,
          name: neuron.name,
          status: neuron.status,
          currentLoad: neuron.currentLoad,
          healthScore: neuron.healthScore,
          activeTasks: neuron.activeTasks.length,
          capabilities: neuron.capabilities.map(c => c.taskType)
        }))
      };
    } catch (error) {
      console.error('Failed to get federation stats:', error);
      throw error;
    }
  }

  // Helper methods
  private hasCapability(neuron: NeuronWorker, taskType: string): boolean {
    return neuron.capabilities.some(cap => cap.taskType === taskType || cap.taskType === 'general');
  }

  private getPriorityScore(priority: string): number {
    switch (priority) {
      case 'urgent': return 4;
      case 'high': return 3;
      case 'normal': return 2;
      case 'low': return 1;
      default: return 2;
    }
  }

  private estimateCompletion(neuron: NeuronWorker, task: FederationTask): Date {
    const capability = neuron.capabilities.find(c => c.taskType === task.taskType);
    const estimatedLatency = capability?.estimatedLatency || 30000; // Default 30 seconds
    const queueDelay = neuron.activeTasks.length * 5000; // 5 seconds per queued task
    
    return new Date(Date.now() + estimatedLatency + queueDelay);
  }
}

export const federationTaskManager = new FederationTaskManager();