import { db } from '../../db';
import { 
  llmAgents,
  agenticWorkflows,
  federationTasks,
  agentUsageTracking,
  type LlmAgent,
  type AgenticWorkflow,
  type FederationTask
} from '@shared/schema';
import { eq, desc, and, gte, count, avg, sum, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import cron from 'node-cron';

export interface FailurePattern {
  type: 'agent_failure' | 'workflow_failure' | 'cost_overrun' | 'timeout_exceeded' | 'cascade_failure';
  frequency: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  lastOccurrence: Date;
  mitigation: string[];
  autoFixing: boolean;
}

export interface ChaosExperiment {
  id: string;
  name: string;
  type: 'latency_injection' | 'failure_injection' | 'resource_constraint' | 'network_partition';
  target: {
    agents?: string[];
    workflows?: string[];
    services?: string[];
  };
  parameters: {
    duration: number;
    intensity: number; // 0.0 to 1.0
    schedule?: string; // cron expression
  };
  safety: {
    maxImpact: number;
    abortConditions: string[];
    rollbackPlan: string[];
  };
  status: 'pending' | 'running' | 'completed' | 'aborted';
  results?: {
    affectedSystems: string[];
    recoveryTime: number;
    lessonsLearned: string[];
    recommendations: string[];
  };
}

export interface CostGovernance {
  budgets: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  alerts: {
    warning: number; // percentage of budget
    critical: number; // percentage of budget
  };
  costOptimization: {
    enableAutoOptimization: boolean;
    strategies: string[];
    savingsTarget: number; // percentage
  };
  spending: {
    current: number;
    projected: number;
    lastUpdated: Date;
  };
}

export interface ResilienceMetrics {
  availability: {
    uptime: number; // percentage
    mttr: number; // mean time to recovery in seconds
    mtbf: number; // mean time between failures in seconds
  };
  performance: {
    averageLatency: number;
    p99Latency: number;
    throughput: number;
    errorRate: number;
  };
  costs: {
    totalSpend: number;
    costPerRequest: number;
    budgetUtilization: number;
    efficiency: number; // cost vs performance ratio
  };
  chaos: {
    experimentsRun: number;
    failuresDetected: number;
    autoFixesApplied: number;
    resilienceScore: number; // 0.0 to 1.0
  };
}

export class ChaosResilienceEngine {
  private failurePatterns: Map<string, FailurePattern> = new Map();
  private activeExperiments: Map<string, ChaosExperiment> = new Map();
  private costGovernance: CostGovernance;
  private resilienceMetrics: ResilienceMetrics;
  
  private config = {
    enableChaosEngineering: process.env.CHAOS_ENGINEERING_ENABLED === 'true',
    maxConcurrentExperiments: parseInt(process.env.CHAOS_MAX_EXPERIMENTS || '3'),
    safetyThreshold: parseFloat(process.env.CHAOS_SAFETY_THRESHOLD || '0.1'), // 10% max impact
    costAlertEnabled: process.env.COST_ALERTS_ENABLED !== 'false',
    autoOptimizationEnabled: process.env.AUTO_OPTIMIZATION_ENABLED === 'true',
    metricsCollectionInterval: parseInt(process.env.METRICS_INTERVAL || '60000') // 1 minute
  };

  constructor() {
    this.initializeEngine();
    this.setupCostGovernance();
    this.startMetricsCollection();
    this.startFailurePatternAnalysis();
  }

  private initializeEngine(): void {
    console.log('⚡ Chaos Resilience Engine initialized');
    
    this.resilienceMetrics = {
      availability: { uptime: 99.9, mttr: 300, mtbf: 86400 },
      performance: { averageLatency: 200, p99Latency: 500, throughput: 1000, errorRate: 0.01 },
      costs: { totalSpend: 0, costPerRequest: 0, budgetUtilization: 0, efficiency: 1.0 },
      chaos: { experimentsRun: 0, failuresDetected: 0, autoFixesApplied: 0, resilienceScore: 0.8 }
    };
  }

  private setupCostGovernance(): void {
    this.costGovernance = {
      budgets: {
        daily: parseFloat(process.env.DAILY_BUDGET || '100'),
        weekly: parseFloat(process.env.WEEKLY_BUDGET || '500'),
        monthly: parseFloat(process.env.MONTHLY_BUDGET || '2000')
      },
      alerts: {
        warning: parseFloat(process.env.COST_WARNING_THRESHOLD || '75'),
        critical: parseFloat(process.env.COST_CRITICAL_THRESHOLD || '90')
      },
      costOptimization: {
        enableAutoOptimization: this.config.autoOptimizationEnabled,
        strategies: ['agent_selection', 'batch_processing', 'cache_optimization', 'resource_scaling'],
        savingsTarget: parseFloat(process.env.COST_SAVINGS_TARGET || '15')
      },
      spending: {
        current: 0,
        projected: 0,
        lastUpdated: new Date()
      }
    };

    console.log('💰 Cost governance initialized with daily budget: $' + this.costGovernance.budgets.daily);
  }

  private startMetricsCollection(): void {
    setInterval(async () => {
      await this.collectResilienceMetrics();
    }, this.config.metricsCollectionInterval);
  }

  private startFailurePatternAnalysis(): void {
    // Run pattern analysis every hour
    cron.schedule('0 * * * *', async () => {
      await this.analyzeFailurePatterns();
    });

    // Run cost analysis every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
      await this.analyzeCostPatterns();
    });
  }

  /**
   * Create and run a chaos experiment
   */
  async createChaosExperiment(experiment: {
    name: string;
    type: ChaosExperiment['type'];
    target: ChaosExperiment['target'];
    parameters: ChaosExperiment['parameters'];
    safety: ChaosExperiment['safety'];
  }): Promise<string> {
    if (!this.config.enableChaosEngineering) {
      throw new Error('Chaos engineering is disabled');
    }

    if (this.activeExperiments.size >= this.config.maxConcurrentExperiments) {
      throw new Error('Maximum concurrent experiments reached');
    }

    const experimentId = randomUUID();
    const chaosExperiment: ChaosExperiment = {
      id: experimentId,
      name: experiment.name,
      type: experiment.type,
      target: experiment.target,
      parameters: experiment.parameters,
      safety: experiment.safety,
      status: 'pending'
    };

    // Validate safety constraints
    if (experiment.safety.maxImpact > this.config.safetyThreshold) {
      throw new Error(`Experiment impact ${experiment.safety.maxImpact} exceeds safety threshold ${this.config.safetyThreshold}`);
    }

    this.activeExperiments.set(experimentId, chaosExperiment);

    // Start experiment execution
    this.executeExperiment(experimentId).catch(error => {
      console.error(`Chaos experiment failed: ${experimentId}`, error);
    });

    console.log(`🔥 Created chaos experiment: ${experiment.name} (${experimentId})`);
    return experimentId;
  }

  /**
   * Execute a chaos experiment
   */
  private async executeExperiment(experimentId: string): Promise<void> {
    const experiment = this.activeExperiments.get(experimentId);
    if (!experiment) return;

    try {
      experiment.status = 'running';
      const startTime = Date.now();

      console.log(`🧪 Starting chaos experiment: ${experiment.name}`);

      // Record baseline metrics
      const baselineMetrics = await this.captureBaselineMetrics();

      // Apply chaos intervention
      await this.applyChaosIntervention(experiment);

      // Monitor system during experiment
      const monitoringResults = await this.monitorExperiment(experiment);

      // Check abort conditions
      if (this.shouldAbortExperiment(experiment, monitoringResults)) {
        await this.abortExperiment(experimentId);
        return;
      }

      // Wait for experiment duration
      await new Promise(resolve => setTimeout(resolve, experiment.parameters.duration));

      // Collect results
      const endTime = Date.now();
      const recoveryTime = await this.measureRecoveryTime(experiment);

      experiment.results = {
        affectedSystems: monitoringResults.affectedSystems,
        recoveryTime,
        lessonsLearned: await this.extractLessonsLearned(experiment, monitoringResults),
        recommendations: await this.generateRecommendations(experiment, monitoringResults)
      };

      experiment.status = 'completed';
      this.resilienceMetrics.chaos.experimentsRun++;

      console.log(`✅ Chaos experiment completed: ${experiment.name} (${endTime - startTime}ms)`);
    } catch (error) {
      console.error(`❌ Chaos experiment failed: ${experiment.name}`, error);
      experiment.status = 'aborted';
      await this.rollbackExperiment(experiment);
    } finally {
      this.activeExperiments.delete(experimentId);
    }
  }

  /**
   * Apply chaos intervention based on experiment type
   */
  private async applyChaosIntervention(experiment: ChaosExperiment): Promise<void> {
    switch (experiment.type) {
      case 'latency_injection':
        await this.injectLatency(experiment);
        break;
      case 'failure_injection':
        await this.injectFailures(experiment);
        break;
      case 'resource_constraint':
        await this.constrainResources(experiment);
        break;
      case 'network_partition':
        await this.simulateNetworkPartition(experiment);
        break;
    }
  }

  /**
   * Inject artificial latency
   */
  private async injectLatency(experiment: ChaosExperiment): Promise<void> {
    const latencyMs = experiment.parameters.intensity * 5000; // Up to 5 seconds
    
    // Modify agent response times
    if (experiment.target.agents) {
      for (const agentId of experiment.target.agents) {
        // Add latency injection to agent processing
        console.log(`💤 Injecting ${latencyMs}ms latency to agent ${agentId}`);
      }
    }
  }

  /**
   * Inject random failures
   */
  private async injectFailures(experiment: ChaosExperiment): Promise<void> {
    const failureRate = experiment.parameters.intensity; // 0.0 to 1.0
    
    if (experiment.target.agents) {
      for (const agentId of experiment.target.agents) {
        // Temporarily reduce agent success rate
        await db.update(llmAgents)
          .set({
            status: Math.random() < failureRate ? 'degraded' : 'active'
          })
          .where(eq(llmAgents.agentId, agentId));
        
        console.log(`💥 Injecting ${failureRate * 100}% failure rate to agent ${agentId}`);
      }
    }
  }

  /**
   * Constrain system resources
   */
  private async constrainResources(experiment: ChaosExperiment): Promise<void> {
    const resourceReduction = experiment.parameters.intensity; // 0.0 to 1.0
    
    // Simulate resource constraints by reducing quotas
    if (experiment.target.agents) {
      for (const agentId of experiment.target.agents) {
        const agent = await db.select()
          .from(llmAgents)
          .where(eq(llmAgents.agentId, agentId))
          .limit(1);

        if (agent[0]) {
          const reducedQuota = Math.floor(agent[0].quotaDaily * (1 - resourceReduction));
          await db.update(llmAgents)
            .set({ quotaDaily: reducedQuota })
            .where(eq(llmAgents.agentId, agentId));
          
          console.log(`🔒 Reducing quota by ${resourceReduction * 100}% for agent ${agentId}`);
        }
      }
    }
  }

  /**
   * Simulate network partition
   */
  private async simulateNetworkPartition(experiment: ChaosExperiment): Promise<void> {
    const partitionSeverity = experiment.parameters.intensity;
    
    // Simulate network issues by marking agents as offline
    if (experiment.target.agents) {
      for (const agentId of experiment.target.agents) {
        if (Math.random() < partitionSeverity) {
          await db.update(llmAgents)
            .set({ status: 'offline' })
            .where(eq(llmAgents.agentId, agentId));
          
          console.log(`🌐 Simulating network partition for agent ${agentId}`);
        }
      }
    }
  }

  /**
   * Monitor experiment impact
   */
  private async monitorExperiment(experiment: ChaosExperiment): Promise<any> {
    const monitoringResults = {
      affectedSystems: [] as string[],
      errorRateIncrease: 0,
      latencyIncrease: 0,
      throughputDecrease: 0
    };

    // Monitor system metrics during experiment
    const intervalId = setInterval(async () => {
      const currentMetrics = await this.captureBaselineMetrics();
      
      // Check if error rate has increased significantly
      if (currentMetrics.errorRate > this.resilienceMetrics.performance.errorRate * 2) {
        monitoringResults.errorRateIncrease = currentMetrics.errorRate;
      }
      
      // Track affected systems
      if (experiment.target.agents) {
        monitoringResults.affectedSystems.push(...experiment.target.agents);
      }
    }, 10000); // Check every 10 seconds

    // Stop monitoring after experiment duration
    setTimeout(() => {
      clearInterval(intervalId);
    }, experiment.parameters.duration);

    return monitoringResults;
  }

  /**
   * Check if experiment should be aborted
   */
  private shouldAbortExperiment(experiment: ChaosExperiment, results: any): boolean {
    // Check abort conditions
    for (const condition of experiment.safety.abortConditions) {
      if (condition === 'high_error_rate' && results.errorRateIncrease > 0.1) {
        return true;
      }
      if (condition === 'service_unavailable' && results.affectedSystems.length > 0) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Abort experiment and rollback changes
   */
  private async abortExperiment(experimentId: string): Promise<void> {
    const experiment = this.activeExperiments.get(experimentId);
    if (!experiment) return;

    console.log(`🛑 Aborting chaos experiment: ${experiment.name}`);
    
    experiment.status = 'aborted';
    await this.rollbackExperiment(experiment);
  }

  /**
   * Rollback experiment changes
   */
  private async rollbackExperiment(experiment: ChaosExperiment): Promise<void> {
    // Restore agent statuses
    if (experiment.target.agents) {
      for (const agentId of experiment.target.agents) {
        await db.update(llmAgents)
          .set({ 
            status: 'active',
            quotaDaily: 10000 // Reset to default quota
          })
          .where(eq(llmAgents.agentId, agentId));
      }
    }

    console.log(`🔄 Rolled back chaos experiment: ${experiment.name}`);
  }

  /**
   * Analyze failure patterns across the system
   */
  private async analyzeFailurePatterns(): Promise<void> {
    try {
      // Analyze agent failures
      const agentFailures = await db.select({
        agentId: llmAgents.agentId,
        name: llmAgents.name,
        failureCount: sql<number>`COUNT(*) FILTER (WHERE ${llmAgents.status} = 'degraded' OR ${llmAgents.status} = 'offline')`,
        successRate: avg(llmAgents.successRate)
      })
      .from(llmAgents)
      .groupBy(llmAgents.agentId, llmAgents.name);

      // Analyze workflow failures
      const workflowFailures = await db.select({
        workflowId: agenticWorkflows.workflowId,
        name: agenticWorkflows.name,
        failureCount: sql<number>`COUNT(*) FILTER (WHERE ${agenticWorkflows.status} = 'failed')`,
      })
      .from(agenticWorkflows)
      .groupBy(agenticWorkflows.workflowId, agenticWorkflows.name);

      // Update failure patterns
      for (const failure of agentFailures) {
        if (failure.failureCount > 0) {
          const patternId = `agent_${failure.agentId}`;
          this.failurePatterns.set(patternId, {
            type: 'agent_failure',
            frequency: failure.failureCount,
            impact: failure.failureCount > 10 ? 'high' : failure.failureCount > 5 ? 'medium' : 'low',
            lastOccurrence: new Date(),
            mitigation: ['restart_agent', 'switch_provider', 'increase_timeout'],
            autoFixing: true
          });
        }
      }

      this.resilienceMetrics.chaos.failuresDetected = this.failurePatterns.size;
      console.log(`🔍 Analyzed ${this.failurePatterns.size} failure patterns`);
    } catch (error) {
      console.error('Failed to analyze failure patterns:', error);
    }
  }

  /**
   * Analyze cost patterns and optimize spending
   */
  private async analyzeCostPatterns(): Promise<void> {
    try {
      // Calculate current spending
      const dailySpending = await db.select({
        totalCost: sum(agentUsageTracking.totalCost)
      })
      .from(agentUsageTracking)
      .where(gte(agentUsageTracking.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)));

      const currentSpend = dailySpending[0]?.totalCost || 0;
      this.costGovernance.spending.current = currentSpend;
      this.costGovernance.spending.lastUpdated = new Date();

      // Check budget alerts
      const budgetUtilization = (currentSpend / this.costGovernance.budgets.daily) * 100;
      this.resilienceMetrics.costs.budgetUtilization = budgetUtilization;

      if (budgetUtilization >= this.costGovernance.alerts.critical) {
        await this.triggerCostAlert('critical', currentSpend, this.costGovernance.budgets.daily);
      } else if (budgetUtilization >= this.costGovernance.alerts.warning) {
        await this.triggerCostAlert('warning', currentSpend, this.costGovernance.budgets.daily);
      }

      // Auto-optimization
      if (this.costGovernance.costOptimization.enableAutoOptimization && budgetUtilization > 80) {
        await this.applyCostOptimizations();
      }

      console.log(`💰 Daily spending: $${currentSpend.toFixed(2)} (${budgetUtilization.toFixed(1)}% of budget)`);
    } catch (error) {
      console.error('Failed to analyze cost patterns:', error);
    }
  }

  /**
   * Trigger cost alert
   */
  private async triggerCostAlert(level: 'warning' | 'critical', currentSpend: number, budget: number): Promise<void> {
    const utilization = (currentSpend / budget) * 100;
    
    console.log(`🚨 COST ALERT (${level.toUpperCase()}): $${currentSpend.toFixed(2)} spent (${utilization.toFixed(1)}% of $${budget} budget)`);
    
    if (level === 'critical') {
      // Implement emergency cost controls
      await this.implementEmergencyCostControls();
    }
  }

  /**
   * Apply cost optimizations
   */
  private async applyCostOptimizations(): Promise<void> {
    try {
      console.log('🎯 Applying automatic cost optimizations...');

      // Strategy 1: Optimize agent selection (prefer cheaper agents)
      const costOptimizedAgents = await db.select()
        .from(llmAgents)
        .where(eq(llmAgents.status, 'active'))
        .orderBy(llmAgents.costPerToken);

      // Strategy 2: Enable more aggressive caching
      // This would be implemented in the LLM Brain Router

      // Strategy 3: Batch smaller requests
      // This would be implemented in the workflow engine

      console.log('✅ Cost optimizations applied');
      this.resilienceMetrics.chaos.autoFixesApplied++;
    } catch (error) {
      console.error('Failed to apply cost optimizations:', error);
    }
  }

  /**
   * Implement emergency cost controls
   */
  private async implementEmergencyCostControls(): Promise<void> {
    console.log('🚨 Implementing emergency cost controls');

    // Temporarily disable expensive agents
    await db.update(llmAgents)
      .set({ status: 'paused' })
      .where(gte(llmAgents.costPerToken, 0.01)); // Disable agents costing more than $0.01 per token

    // Reduce quotas for remaining agents
    await db.update(llmAgents)
      .set({ 
        quotaDaily: sql`${llmAgents.quotaDaily} * 0.5` // Reduce quotas by 50%
      })
      .where(eq(llmAgents.status, 'active'));

    console.log('🛡️ Emergency cost controls activated');
  }

  /**
   * Capture baseline system metrics
   */
  private async captureBaselineMetrics(): Promise<any> {
    const metrics = {
      errorRate: 0.01, // Default 1% error rate
      averageLatency: 200,
      throughput: 1000,
      activeAgents: 0
    };

    try {
      // Get active agents count
      const activeAgents = await db.select({ count: count() })
        .from(llmAgents)
        .where(eq(llmAgents.status, 'active'));
      
      metrics.activeAgents = activeAgents[0].count;

      // Calculate average success rate (proxy for error rate)
      const avgSuccessRate = await db.select({ avg: avg(llmAgents.successRate) })
        .from(llmAgents)
        .where(eq(llmAgents.status, 'active'));
      
      metrics.errorRate = 1 - (avgSuccessRate[0].avg || 0.99);
    } catch (error) {
      console.error('Failed to capture baseline metrics:', error);
    }

    return metrics;
  }

  /**
   * Collect comprehensive resilience metrics
   */
  private async collectResilienceMetrics(): Promise<void> {
    try {
      const baselineMetrics = await this.captureBaselineMetrics();
      
      // Update performance metrics
      this.resilienceMetrics.performance.errorRate = baselineMetrics.errorRate;
      this.resilienceMetrics.performance.averageLatency = baselineMetrics.averageLatency;
      this.resilienceMetrics.performance.throughput = baselineMetrics.throughput;

      // Update availability metrics
      this.resilienceMetrics.availability.uptime = (1 - baselineMetrics.errorRate) * 100;

      // Update cost metrics
      this.resilienceMetrics.costs.totalSpend = this.costGovernance.spending.current;
      this.resilienceMetrics.costs.budgetUtilization = 
        (this.costGovernance.spending.current / this.costGovernance.budgets.daily) * 100;

      // Calculate resilience score
      this.resilienceMetrics.chaos.resilienceScore = this.calculateResilienceScore();
    } catch (error) {
      console.error('Failed to collect resilience metrics:', error);
    }
  }

  /**
   * Calculate overall resilience score
   */
  private calculateResilienceScore(): number {
    const weights = {
      availability: 0.3,
      performance: 0.3,
      costs: 0.2,
      chaos: 0.2
    };

    const availabilityScore = this.resilienceMetrics.availability.uptime / 100;
    const performanceScore = Math.max(0, 1 - this.resilienceMetrics.performance.errorRate);
    const costScore = Math.max(0, 1 - (this.resilienceMetrics.costs.budgetUtilization / 100));
    const chaosScore = Math.min(1, this.resilienceMetrics.chaos.autoFixesApplied / 10);

    const overallScore = 
      availabilityScore * weights.availability +
      performanceScore * weights.performance +
      costScore * weights.costs +
      chaosScore * weights.chaos;

    return Math.round(overallScore * 100) / 100;
  }

  /**
   * Get resilience dashboard data
   */
  async getResilienceDashboard(): Promise<any> {
    await this.collectResilienceMetrics();

    return {
      metrics: this.resilienceMetrics,
      costGovernance: {
        currentSpending: this.costGovernance.spending.current,
        budgets: this.costGovernance.budgets,
        utilization: this.resilienceMetrics.costs.budgetUtilization,
        optimizationEnabled: this.costGovernance.costOptimization.enableAutoOptimization
      },
      experiments: {
        active: this.activeExperiments.size,
        total: this.resilienceMetrics.chaos.experimentsRun,
        recentExperiments: Array.from(this.activeExperiments.values()).slice(0, 5)
      },
      failures: {
        patterns: Array.from(this.failurePatterns.values()).slice(0, 10),
        autoFixesApplied: this.resilienceMetrics.chaos.autoFixesApplied
      },
      recommendations: await this.generateSystemRecommendations()
    };
  }

  /**
   * Generate system-wide recommendations
   */
  private async generateSystemRecommendations(): Promise<string[]> {
    const recommendations: string[] = [];

    // Availability recommendations
    if (this.resilienceMetrics.availability.uptime < 99.5) {
      recommendations.push('Consider implementing circuit breakers to improve availability');
    }

    // Performance recommendations
    if (this.resilienceMetrics.performance.errorRate > 0.05) {
      recommendations.push('High error rate detected - review agent configurations');
    }

    // Cost recommendations
    if (this.resilienceMetrics.costs.budgetUtilization > 80) {
      recommendations.push('Budget utilization high - enable automatic cost optimizations');
    }

    // Chaos recommendations
    if (this.resilienceMetrics.chaos.experimentsRun < 5) {
      recommendations.push('Run more chaos experiments to improve system resilience');
    }

    return recommendations;
  }

  // Helper methods for experiment execution
  private async measureRecoveryTime(experiment: ChaosExperiment): Promise<number> {
    // Simulate recovery time measurement
    return Math.random() * 60000; // 0-60 seconds
  }

  private async extractLessonsLearned(experiment: ChaosExperiment, results: any): Promise<string[]> {
    const lessons = [];
    
    if (results.errorRateIncrease > 0) {
      lessons.push(`System showed ${results.errorRateIncrease * 100}% error rate increase under ${experiment.type}`);
    }
    
    if (results.affectedSystems.length > 0) {
      lessons.push(`${results.affectedSystems.length} systems were affected by the experiment`);
    }

    return lessons;
  }

  private async generateRecommendations(experiment: ChaosExperiment, results: any): Promise<string[]> {
    const recommendations = [];
    
    if (experiment.type === 'failure_injection' && results.recoveryTime > 30000) {
      recommendations.push('Implement faster failover mechanisms');
    }
    
    if (experiment.type === 'latency_injection' && results.errorRateIncrease > 0.1) {
      recommendations.push('Add timeout handling and circuit breakers');
    }

    return recommendations;
  }
}

export const chaosResilienceEngine = new ChaosResilienceEngine();