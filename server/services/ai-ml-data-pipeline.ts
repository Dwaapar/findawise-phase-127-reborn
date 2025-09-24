import { db } from '../db';
import { 
  neuronDataPipelines, 
  behaviorEvents,
  userSessions,
  affiliateClicks,
  quizResults,
  experimentResults 
} from '@shared/schema';
import { aiMLAnalytics } from '@shared/aiMLTables';
import { eq, and, gte, desc, count, avg, sum } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export interface NeuronMetrics {
  neuronId: string;
  vertical: string;
  timeframe: {
    start: Date;
    end: Date;
  };
  traffic: {
    sessions: number;
    uniqueUsers: number;
    pageViews: number;
    bounceRate: number;
  };
  engagement: {
    avgTimeOnSite: number;
    interactions: number;
    quizCompletions: number;
    contentViews: number;
  };
  conversions: {
    affiliateClicks: number;
    leads: number;
    revenue: number;
    conversionRate: number;
  };
  experiments: {
    active: number;
    completed: number;
    winningVariants: number;
  };
}

export interface DataQuality {
  completeness: number; // 0-1
  accuracy: number; // 0-1
  consistency: number; // 0-1
  timeliness: number; // 0-1
  overall: number; // 0-1
  issues: string[];
}

export interface PipelineStatus {
  neuronId: string;
  status: 'healthy' | 'degraded' | 'critical' | 'offline';
  lastSync: Date;
  nextSync: Date;
  errorRate: number;
  dataQuality: DataQuality;
  throughput: number; // events per minute
}

class AIMLDataPipeline {
  private syncIntervals: Map<string, NodeJS.Timeout> = new Map();
  private readonly defaultSyncFrequency = 300; // 5 minutes

  constructor() {
    this.initializePipelines();
  }

  private async initializePipelines(): Promise<void> {
    console.log('🔌 Initializing AI/ML Data Pipelines...');

    // Register default neurons
    const defaultNeurons = [
      { id: 'finance', name: 'Finance Calculator', vertical: 'finance' },
      { id: 'health', name: 'Health & Wellness', vertical: 'health' },
      { id: 'saas', name: 'SaaS Directory', vertical: 'saas' },
      { id: 'travel', name: 'Travel Planner', vertical: 'travel' },
      { id: 'security', name: 'Home Security', vertical: 'security' },
      { id: 'education', name: 'Education Platform', vertical: 'education' },
      { id: 'ai-tools', name: 'AI Tools Directory', vertical: 'ai-tools' }
    ];

    for (const neuron of defaultNeurons) {
      await this.registerNeuron(neuron.id, neuron.name, neuron.vertical, 'react');
    }

    console.log('🔌 AI/ML Data Pipelines initialized');
  }

  public async registerNeuron(
    neuronId: string, 
    neuronName: string, 
    vertical: string, 
    type: 'react' | 'api-only'
  ): Promise<void> {
    try {
      // Check if neuron already exists
      const existing = await db
        .select()
        .from(neuronDataPipelines)
        .where(eq(neuronDataPipelines.neuronId, neuronId))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(neuronDataPipelines).values({
          neuronId,
          neuronName,
          vertical,
          type,
          metricsCollected: {
            clicks: 0,
            conversions: 0,
            sessions: 0,
            revenue: 0
          },
          dataQuality: {
            completeness: 1.0,
            accuracy: 1.0,
            consistency: 1.0,
            timeliness: 1.0,
            overall: 1.0,
            issues: []
          }
        });

        console.log(`🔌 Registered neuron: ${neuronName} (${neuronId})`);
      }

      // Start sync interval
      this.startSyncInterval(neuronId);

    } catch (error) {
      console.error(`❌ Failed to register neuron ${neuronId}:`, error);
    }
  }

  public async unregisterNeuron(neuronId: string): Promise<void> {
    try {
      // Stop sync interval
      this.stopSyncInterval(neuronId);

      // Deactivate pipeline
      await db
        .update(neuronDataPipelines)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(neuronDataPipelines.neuronId, neuronId));

      console.log(`🔌 Unregistered neuron: ${neuronId}`);

    } catch (error) {
      console.error(`❌ Failed to unregister neuron ${neuronId}:`, error);
    }
  }

  private startSyncInterval(neuronId: string): void {
    if (this.syncIntervals.has(neuronId)) {
      clearInterval(this.syncIntervals.get(neuronId)!);
    }

    const interval = setInterval(async () => {
      await this.syncNeuronData(neuronId);
    }, this.defaultSyncFrequency * 1000);

    this.syncIntervals.set(neuronId, interval);
  }

  private stopSyncInterval(neuronId: string): void {
    const interval = this.syncIntervals.get(neuronId);
    if (interval) {
      clearInterval(interval);
      this.syncIntervals.delete(neuronId);
    }
  }

  public async syncNeuronData(neuronId: string): Promise<void> {
    try {
      const pipeline = await this.getPipeline(neuronId);
      if (!pipeline || !pipeline.isActive) {
        return;
      }

      // Collect metrics for the last sync period
      const metrics = await this.collectNeuronMetrics(neuronId, pipeline.vertical);
      
      // Calculate data quality
      const dataQuality = await this.assessDataQuality(neuronId, metrics);

      // Update pipeline status with safe decimal values
      await db
        .update(neuronDataPipelines)
        .set({
          lastSync: new Date(),
          metricsCollected: {
            clicks: Math.min(metrics.conversions.affiliateClicks, 999999),
            conversions: Math.min(metrics.conversions.leads, 999999),
            sessions: Math.min(metrics.traffic.sessions, 999999),
            revenue: Math.min(metrics.conversions.revenue, 999999)
          },
          healthScore: Math.min(9.9999, Math.max(dataQuality.overall * 10, 0)).toFixed(4),
          dataQuality: {
            ...dataQuality,
            completeness: Math.min(0.9999, Math.max(dataQuality.completeness, 0)),
            accuracy: Math.min(0.9999, Math.max(dataQuality.accuracy, 0)),
            consistency: Math.min(0.9999, Math.max(dataQuality.consistency, 0)),
            timeliness: Math.min(0.9999, Math.max(dataQuality.timeliness, 0)),
            overall: Math.min(0.9999, Math.max(dataQuality.overall, 0))
          },
          updatedAt: new Date()
        })
        .where(eq(neuronDataPipelines.neuronId, neuronId));

      // Store analytics
      await this.storeAnalytics(neuronId, pipeline.vertical, metrics, dataQuality);

    } catch (error) {
      console.error(`❌ Sync failed for neuron ${neuronId}:`, error);
      await this.recordSyncError(neuronId, error);
    }
  }

  private async collectNeuronMetrics(neuronId: string, vertical: string): Promise<NeuronMetrics> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Traffic metrics
    const sessionsData = await db
      .select({ 
        count: count(),
        avgTime: avg(userSessions.totalTimeOnSite),
        totalViews: sum(userSessions.pageViews),
        totalInteractions: sum(userSessions.interactions)
      })
      .from(userSessions)
      .where(and(
        gte(userSessions.startTime, oneHourAgo),
        eq(userSessions.segment, vertical)
      ));

    // Behavior events
    const eventsData = await db
      .select({ count: count() })
      .from(behaviorEvents)
      .where(and(
        gte(behaviorEvents.timestamp, oneHourAgo),
        eq(behaviorEvents.pageSlug, vertical)
      ));

    // Affiliate clicks (conversions)
    const clicksData = await db
      .select({ 
        count: count(),
        revenue: count() // Using click count as revenue approximation
      })
      .from(affiliateClicks)
      .where(and(
        gte(affiliateClicks.clickedAt, oneHourAgo)
      ));

    // Quiz completions
    const quizData = await db
      .select({ count: count() })
      .from(quizResults)
      .where(and(
        gte(quizResults.timestamp, oneHourAgo)
      ));

    const sessions = Number(sessionsData[0]?.count) || 0;
    const avgTimeOnSite = Number(sessionsData[0]?.avgTime) || 0;
    const pageViews = Number(sessionsData[0]?.totalViews) || 0;
    const interactions = Number(sessionsData[0]?.totalInteractions) || 0;
    const events = Number(eventsData[0]?.count) || 0;
    const affiliateClicksCount = Number(clicksData[0]?.count) || 0;
    const revenue = Number(clicksData[0]?.revenue) || 0;
    const quizCompletions = Number(quizData[0]?.count) || 0;

    return {
      neuronId,
      vertical,
      timeframe: {
        start: oneHourAgo,
        end: now
      },
      traffic: {
        sessions,
        uniqueUsers: sessions, // Approximation
        pageViews,
        bounceRate: sessions > 0 ? Math.min(0.9999, Math.max(0, (sessions - interactions) / sessions)) : 0
      },
      engagement: {
        avgTimeOnSite,
        interactions,
        quizCompletions,
        contentViews: events
      },
      conversions: {
        affiliateClicks: affiliateClicksCount,
        leads: Math.floor(affiliateClicksCount * 0.3), // Estimate
        revenue,
        conversionRate: sessions > 0 ? Math.min(0.9999, affiliateClicksCount / sessions) : 0
      },
      experiments: {
        active: 0, // To be implemented
        completed: 0,
        winningVariants: 0
      }
    };
  }

  private async assessDataQuality(neuronId: string, metrics: NeuronMetrics): Promise<DataQuality> {
    const issues: string[] = [];
    let completeness = 1.0;
    let accuracy = 1.0;
    let consistency = 1.0;
    let timeliness = 1.0;

    // Completeness check
    if (metrics.traffic.sessions === 0) {
      completeness -= 0.3;
      issues.push('No session data');
    }
    if (metrics.engagement.interactions === 0 && metrics.traffic.sessions > 0) {
      completeness -= 0.2;
      issues.push('Missing interaction data');
    }

    // Accuracy check
    if (metrics.conversions.conversionRate > 1.0) {
      accuracy -= 0.5;
      issues.push('Impossible conversion rate');
    }
    if (metrics.traffic.bounceRate > 1.0) {
      accuracy -= 0.3;
      issues.push('Invalid bounce rate');
    }

    // Consistency check
    if (metrics.engagement.interactions > metrics.traffic.sessions * 10) {
      consistency -= 0.4;
      issues.push('Inconsistent interaction count');
    }

    // Timeliness check
    const dataAge = Date.now() - metrics.timeframe.end.getTime();
    if (dataAge > 10 * 60 * 1000) { // More than 10 minutes old
      timeliness -= 0.2;
      issues.push('Stale data');
    }

    const overall = (completeness + accuracy + consistency + timeliness) / 4;

    return {
      completeness: Math.min(0.9999, Math.max(0, completeness)),
      accuracy: Math.min(0.9999, Math.max(0, accuracy)),
      consistency: Math.min(0.9999, Math.max(0, consistency)),
      timeliness: Math.min(0.9999, Math.max(0, timeliness)),
      overall: Math.min(0.9999, Math.max(0, overall)),
      issues
    };
  }

  private async storeAnalytics(
    neuronId: string, 
    vertical: string, 
    metrics: NeuronMetrics, 
    dataQuality: DataQuality
  ): Promise<void> {
    try {
      await db.insert(aiMLAnalytics).values({
        date: metrics.timeframe.end,
        neuronId,
        vertical,
        metrics: {
          traffic: metrics.traffic,
          engagement: metrics.engagement,
          conversions: metrics.conversions,
          experiments: metrics.experiments
        },
        predictions: 0,
        correctPredictions: 0,
        accuracy: Math.min(9.9999, dataQuality.accuracy).toFixed(4),
        revenueImpact: Math.min(999999, metrics.conversions.revenue).toString(),
        userImpact: metrics.traffic.uniqueUsers,
        optimizationsApplied: 0,
        rulesTriggered: 0,
        experimentsRunning: metrics.experiments.active,
        dataQuality: Math.min(9.9999, dataQuality.overall).toFixed(4),
        systemHealth: this.getSystemHealth(dataQuality.overall)
      });

    } catch (error) {
      console.error('❌ Failed to store analytics:', error);
    }
  }

  private getSystemHealth(dataQuality: number): 'healthy' | 'degraded' | 'critical' {
    if (dataQuality >= 0.8) return 'healthy';
    if (dataQuality >= 0.5) return 'degraded';
    return 'critical';
  }

  private async recordSyncError(neuronId: string, error: any): Promise<void> {
    try {
      await db
        .update(neuronDataPipelines)
        .set({
          errorCount: 1,
          lastError: error instanceof Error ? error.message : String(error),
          lastErrorTime: new Date(),
          updatedAt: new Date()
        })
        .where(eq(neuronDataPipelines.neuronId, neuronId));

    } catch (dbError) {
      console.error('❌ Failed to record sync error:', dbError);
    }
  }

  private async getPipeline(neuronId: string) {
    const result = await db
      .select()
      .from(neuronDataPipelines)
      .where(eq(neuronDataPipelines.neuronId, neuronId))
      .limit(1);

    return result[0] || null;
  }

  // Public API Methods
  public async getAllPipelines(): Promise<PipelineStatus[]> {
    const pipelines = await db
      .select()
      .from(neuronDataPipelines)
      .where(eq(neuronDataPipelines.isActive, true));

    return pipelines.map(p => ({
      neuronId: p.neuronId,
      status: this.calculateStatus(p),
      lastSync: p.lastSync || new Date(0),
      nextSync: new Date((p.lastSync?.getTime() || 0) + (p.syncFrequency || this.defaultSyncFrequency) * 1000),
      errorRate: (p.errorCount || 0) / Math.max(1, Math.floor((Date.now() - (p.createdAt?.getTime() || 0)) / (60 * 1000))),
      dataQuality: p.dataQuality as DataQuality || {
        completeness: 0,
        accuracy: 0,
        consistency: 0,
        timeliness: 0,
        overall: 0,
        issues: []
      },
      throughput: 0 // Calculate based on recent metrics
    }));
  }

  private calculateStatus(pipeline: any): 'healthy' | 'degraded' | 'critical' | 'offline' {
    if (!pipeline.isActive) return 'offline';
    
    const lastSync = pipeline.lastSync ? new Date(pipeline.lastSync) : new Date(0);
    const timeSinceSync = Date.now() - lastSync.getTime();
    const maxSyncGap = (pipeline.syncFrequency || this.defaultSyncFrequency) * 2 * 1000;

    if (timeSinceSync > maxSyncGap) return 'offline';
    if (pipeline.healthScore < 0.5) return 'critical';
    if (pipeline.healthScore < 0.8) return 'degraded';
    return 'healthy';
  }

  public async getNeuronMetrics(neuronId: string, hours: number = 1): Promise<NeuronMetrics | null> {
    const pipeline = await this.getPipeline(neuronId);
    if (!pipeline) return null;

    return await this.collectNeuronMetrics(neuronId, pipeline.vertical);
  }

  public async getAggregatedMetrics(vertical?: string, hours: number = 24): Promise<NeuronMetrics[]> {
    const pipelines = await db
      .select()
      .from(neuronDataPipelines)
      .where(vertical ? eq(neuronDataPipelines.vertical, vertical) : eq(neuronDataPipelines.isActive, true));

    const metrics: NeuronMetrics[] = [];
    for (const pipeline of pipelines) {
      const neuronMetrics = await this.collectNeuronMetrics(pipeline.neuronId, pipeline.vertical);
      metrics.push(neuronMetrics);
    }

    return metrics;
  }

  public async triggerSync(neuronId?: string): Promise<void> {
    if (neuronId) {
      await this.syncNeuronData(neuronId);
    } else {
      const pipelines = await db
        .select()
        .from(neuronDataPipelines)
        .where(eq(neuronDataPipelines.isActive, true));

      for (const pipeline of pipelines) {
        await this.syncNeuronData(pipeline.neuronId);
      }
    }
  }

  public async getDataHealth(): Promise<{
    overall: 'healthy' | 'degraded' | 'critical';
    pipelines: number;
    activePipelines: number;
    avgDataQuality: number;
    issues: string[];
  }> {
    const pipelines = await this.getAllPipelines();
    const activePipelines = pipelines.filter(p => p.status !== 'offline');
    const avgDataQuality = activePipelines.reduce((sum, p) => sum + p.dataQuality.overall, 0) / Math.max(1, activePipelines.length);
    
    const allIssues = activePipelines.flatMap(p => p.dataQuality.issues);
    const uniqueIssues = [...new Set(allIssues)];

    let overall: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (avgDataQuality < 0.5 || activePipelines.length < pipelines.length * 0.5) {
      overall = 'critical';
    } else if (avgDataQuality < 0.8 || activePipelines.length < pipelines.length * 0.8) {
      overall = 'degraded';
    }

    return {
      overall,
      pipelines: pipelines.length,
      activePipelines: activePipelines.length,
      avgDataQuality,
      issues: uniqueIssues
    };
  }
}

export const aiMLDataPipeline = new AIMLDataPipeline();