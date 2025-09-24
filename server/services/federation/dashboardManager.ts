import { storage } from '../../storage';
import { federationCore } from './federationCore';
import { webSocketManager } from './webSocketManager';
import { analyticsAggregator } from './analyticsAggregator';
import { db } from '../../db';
import { 
  federationEvents,
  federationSyncJobs,
  federationHealthChecks,
  federationConflicts,
  federationAnalytics
} from '@shared/federationTables';
import { eq, desc, and, gte, sql } from 'drizzle-orm';

// ===========================================
// FEDERATION DASHBOARD MANAGER
// ===========================================

export interface DashboardMetrics {
  overview: {
    totalNeurons: number;
    activeNeurons: number;
    healthyNeurons: number;
    totalSyncJobs: number;
    pendingConflicts: number;
    avgResponseTime: number;
  };
  realTimeStats: {
    connectionsCount: number;
    eventsLastHour: number;
    syncJobsLastHour: number;
    errorRate: number;
  };
  neuronDetails: Array<{
    neuronId: string;
    name: string;
    type: string;
    status: string;
    healthScore: number;
    lastSeen: Date;
    responseTime: number;
    issues: string[];
  }>;
  recentEvents: Array<{
    eventId: string;
    neuronId: string;
    eventType: string;
    timestamp: Date;
    success: boolean;
    details: any;
  }>;
  systemHealth: {
    federationCoreStatus: 'healthy' | 'warning' | 'critical';
    webSocketStatus: 'connected' | 'disconnected' | 'error';
    syncManagerStatus: 'active' | 'inactive' | 'error';
    analyticsStatus: 'operational' | 'degraded' | 'offline';
  };
}

class FederationDashboardManager {
  private metricsCache: DashboardMetrics | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 30000; // 30 seconds

  /**
   * Get comprehensive dashboard metrics
   */
  async getDashboardMetrics(forceRefresh = false): Promise<DashboardMetrics> {
    const now = Date.now();
    
    if (!forceRefresh && this.metricsCache && now < this.cacheExpiry) {
      return this.metricsCache;
    }

    console.log('🔄 Refreshing federation dashboard metrics...');

    try {
      const metrics = await this.collectMetrics();
      this.metricsCache = metrics;
      this.cacheExpiry = now + this.CACHE_DURATION;
      
      return metrics;
    } catch (error) {
      console.error('❌ Failed to collect dashboard metrics:', error);
      
      // Return cached data if available, otherwise minimal data
      if (this.metricsCache) {
        return this.metricsCache;
      }
      
      return this.getEmptyMetrics();
    }
  }

  /**
   * Get real-time federation status
   */
  async getRealTimeStatus(): Promise<{
    neurons: Record<string, any>;
    connections: Record<string, any>;
    activeSyncJobs: any[];
    recentErrors: any[];
    systemLoad: {
      cpu: number;
      memory: number;
      connections: number;
    };
  }> {
    try {
      // Get active neurons
      const neurons = await storage.getNeurons();
      const neuronStatus: Record<string, any> = {};
      
      for (const neuron of neurons) {
        const health = await federationCore.getNeuronHealth(neuron.neuronId);
        const isConnected = webSocketManager.isNeuronConnected(neuron.neuronId);
        
        neuronStatus[neuron.neuronId] = {
          ...neuron,
          health,
          connected: isConnected,
          lastActivity: await this.getLastActivity(neuron.neuronId)
        };
      }

      // Get WebSocket connections
      const connections = webSocketManager.getActiveConnections();

      // Get active sync jobs
      const activeSyncJobs = await db.select()
        .from(federationSyncJobs)
        .where(eq(federationSyncJobs.status, 'running'))
        .orderBy(desc(federationSyncJobs.startedAt))
        .limit(10);

      // Get recent errors
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentErrors = await db.select()
        .from(federationEvents)
        .where(and(
          eq(federationEvents.success, false),
          gte(federationEvents.timestamp, oneHourAgo)
        ))
        .orderBy(desc(federationEvents.timestamp))
        .limit(20);

      // Get system load (simplified)
      const systemLoad = {
        cpu: Math.random() * 100, // TODO: Get actual CPU usage
        memory: Math.random() * 100, // TODO: Get actual memory usage
        connections: Object.keys(connections).length
      };

      return {
        neurons: neuronStatus,
        connections,
        activeSyncJobs,
        recentErrors,
        systemLoad
      };
    } catch (error) {
      console.error('❌ Failed to get real-time status:', error);
      throw error;
    }
  }

  /**
   * Get federation visualization data for network graph
   */
  async getVisualizationData(): Promise<{
    nodes: Array<{
      id: string;
      label: string;
      type: string;
      status: string;
      size: number;
      color: string;
      metadata: any;
    }>;
    edges: Array<{
      from: string;
      to: string;
      type: string;
      strength: number;
      label?: string;
    }>;
    clusters: Array<{
      id: string;
      label: string;
      nodes: string[];
      color: string;
    }>;
  }> {
    try {
      const neurons = await storage.getNeurons();
      const nodes = [];
      const edges = [];

      // Add federation core as central node
      nodes.push({
        id: 'federation-core',
        label: 'Federation Core',
        type: 'core',
        status: 'active',
        size: 50,
        color: '#FF6B6B',
        metadata: {
          description: 'Central Federation Management System',
          capabilities: ['orchestration', 'monitoring', 'sync']
        }
      });

      // Add neuron nodes
      for (const neuron of neurons) {
        const health = await federationCore.getNeuronHealth(neuron.neuronId);
        const size = this.calculateNodeSize(neuron, health);
        const color = this.getStatusColor(health.status);

        nodes.push({
          id: neuron.neuronId,
          label: neuron.name,
          type: neuron.type,
          status: health.status,
          size,
          color,
          metadata: {
            healthScore: health.metrics.healthScore || 0,
            lastSeen: health.lastCheck,
            responseTime: health.metrics.responseTime || 0,
            issues: health.issues
          }
        });

        // Add edge from federation core to neuron
        edges.push({
          from: 'federation-core',
          to: neuron.neuronId,
          type: 'federation',
          strength: this.calculateEdgeStrength(health),
          label: `${health.metrics.responseTime || 0}ms`
        });
      }

      // Add inter-neuron connections based on sync history
      const syncConnections = await this.getSyncConnections();
      edges.push(...syncConnections);

      // Create clusters by neuron type
      const clusters = this.createClusters(neurons);

      return { nodes, edges, clusters };
    } catch (error) {
      console.error('❌ Failed to get visualization data:', error);
      throw error;
    }
  }

  /**
   * Execute federation management actions
   */
  async executeAction(action: {
    type: 'hot_reload' | 'config_push' | 'neuron_restart' | 'sync_trigger' | 'conflict_resolve';
    neuronId?: string;
    payload?: any;
    options?: any;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log(`🎯 Executing federation action: ${action.type}`);

      switch (action.type) {
        case 'hot_reload':
          if (!action.neuronId || !action.payload) {
            throw new Error('neuronId and payload required for hot reload');
          }
          const reloadResult = await federationCore.hotReload(
            [action.neuronId],
            action.payload,
            action.options || {}
          );
          return { success: true, data: reloadResult };

        case 'config_push':
          if (!action.payload?.configKey || action.payload?.configValue === undefined) {
            throw new Error('configKey and configValue required for config push');
          }
          const configResult = await federationCore.pushConfig(
            action.payload.configKey,
            action.payload.configValue,
            action.neuronId ? [action.neuronId] : 'all',
            action.options || {}
          );
          return { success: true, data: configResult };

        case 'neuron_restart':
          if (!action.neuronId) {
            throw new Error('neuronId required for neuron restart');
          }
          const restartResult = await this.restartNeuron(action.neuronId);
          return { success: true, data: restartResult };

        case 'sync_trigger':
          const syncResult = await this.triggerSync(action.neuronId, action.payload);
          return { success: true, data: syncResult };

        case 'conflict_resolve':
          if (!action.payload?.conflictId || !action.payload?.resolution) {
            throw new Error('conflictId and resolution required for conflict resolution');
          }
          await federationCore.resolveConflict(
            action.payload.conflictId,
            action.payload.resolution,
            action.payload.resolutionData,
            action.payload.resolvedBy || 'dashboard'
          );
          return { success: true };

        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }
    } catch (error) {
      console.error(`❌ Federation action failed: ${action.type}`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // ===========================================
  // PRIVATE METHODS
  // ===========================================

  private async collectMetrics(): Promise<DashboardMetrics> {
    const neurons = await storage.getNeurons();
    const activeNeurons = neurons.filter(n => n.status === 'active');
    
    // Collect health data for active neurons
    const healthChecks = await Promise.allSettled(
      activeNeurons.map(n => federationCore.getNeuronHealth(n.neuronId))
    );
    
    const healthyNeurons = healthChecks.filter(
      (result, index) => result.status === 'fulfilled' && result.value.status === 'healthy'
    ).length;

    // Get sync job statistics
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const [totalSyncJobs] = await db.select({ count: sql<number>`count(*)` })
      .from(federationSyncJobs);

    const [eventsLastHour] = await db.select({ count: sql<number>`count(*)` })
      .from(federationEvents)
      .where(gte(federationEvents.timestamp, oneHourAgo));

    const [syncJobsLastHour] = await db.select({ count: sql<number>`count(*)` })
      .from(federationSyncJobs)
      .where(gte(federationSyncJobs.createdAt, oneHourAgo));

    const [pendingConflicts] = await db.select({ count: sql<number>`count(*)` })
      .from(federationConflicts)
      .where(eq(federationConflicts.status, 'pending'));

    // Calculate average response time
    const avgResponseTime = this.calculateAverageResponseTime(healthChecks);

    // Get recent events
    const recentEvents = await db.select()
      .from(federationEvents)
      .orderBy(desc(federationEvents.timestamp))
      .limit(50);

    // Build neuron details
    const neuronDetails = await Promise.all(
      neurons.map(async (neuron) => {
        const healthResult = healthChecks.find((_, index) => activeNeurons[index]?.neuronId === neuron.neuronId);
        const health = healthResult?.status === 'fulfilled' ? healthResult.value : null;
        
        return {
          neuronId: neuron.neuronId,
          name: neuron.name,
          type: neuron.type,
          status: neuron.status || 'unknown',
          healthScore: neuron.healthScore || 0,
          lastSeen: neuron.lastCheckIn || new Date(),
          responseTime: health?.metrics?.responseTime || 0,
          issues: health?.issues || []
        };
      })
    );

    return {
      overview: {
        totalNeurons: neurons.length,
        activeNeurons: activeNeurons.length,
        healthyNeurons,
        totalSyncJobs: totalSyncJobs.count,
        pendingConflicts: pendingConflicts.count,
        avgResponseTime
      },
      realTimeStats: {
        connectionsCount: Object.keys(webSocketManager.getActiveConnections()).length,
        eventsLastHour: eventsLastHour.count,
        syncJobsLastHour: syncJobsLastHour.count,
        errorRate: this.calculateErrorRate(recentEvents)
      },
      neuronDetails,
      recentEvents: recentEvents.map(event => ({
        eventId: event.eventId!,
        neuronId: event.neuronId!,
        eventType: event.eventType,
        timestamp: event.timestamp,
        success: event.success,
        details: event.eventData
      })),
      systemHealth: {
        federationCoreStatus: 'healthy', // TODO: Implement actual health check
        webSocketStatus: 'connected', // TODO: Get from webSocketManager
        syncManagerStatus: 'active', // TODO: Get from sync manager
        analyticsStatus: 'operational' // TODO: Get from analytics aggregator
      }
    };
  }

  private getEmptyMetrics(): DashboardMetrics {
    return {
      overview: {
        totalNeurons: 0,
        activeNeurons: 0,
        healthyNeurons: 0,
        totalSyncJobs: 0,
        pendingConflicts: 0,
        avgResponseTime: 0
      },
      realTimeStats: {
        connectionsCount: 0,
        eventsLastHour: 0,
        syncJobsLastHour: 0,
        errorRate: 0
      },
      neuronDetails: [],
      recentEvents: [],
      systemHealth: {
        federationCoreStatus: 'critical',
        webSocketStatus: 'disconnected',
        syncManagerStatus: 'inactive',
        analyticsStatus: 'offline'
      }
    };
  }

  private calculateAverageResponseTime(healthChecks: PromiseSettledResult<any>[]): number {
    const responseTimes = healthChecks
      .filter(result => result.status === 'fulfilled' && result.value.metrics?.responseTime)
      .map(result => (result as PromiseFulfilledResult<any>).value.metrics.responseTime);
    
    return responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;
  }

  private calculateErrorRate(events: any[]): number {
    if (events.length === 0) return 0;
    const errorCount = events.filter(event => !event.success).length;
    return (errorCount / events.length) * 100;
  }

  private calculateNodeSize(neuron: any, health: any): number {
    const baseSize = 20;
    const healthScore = health.metrics?.healthScore || 0;
    return baseSize + (healthScore / 100) * 30; // 20-50 range
  }

  private getStatusColor(status: string): string {
    switch (status) {
      case 'healthy': return '#4CAF50';
      case 'warning': return '#FF9800';
      case 'critical': return '#F44336';
      default: return '#9E9E9E';
    }
  }

  private calculateEdgeStrength(health: any): number {
    const responseTime = health.metrics?.responseTime || 1000;
    return Math.max(0.1, 1 - (responseTime / 5000)); // 0.1-1.0 range
  }

  private async getSyncConnections(): Promise<any[]> {
    // TODO: Implement inter-neuron sync connection analysis
    return [];
  }

  private createClusters(neurons: any[]): any[] {
    const clusterMap = new Map<string, any>();
    
    for (const neuron of neurons) {
      if (!clusterMap.has(neuron.type)) {
        clusterMap.set(neuron.type, {
          id: `cluster-${neuron.type}`,
          label: `${neuron.type.charAt(0).toUpperCase() + neuron.type.slice(1)} Neurons`,
          nodes: [],
          color: this.getClusterColor(neuron.type)
        });
      }
      clusterMap.get(neuron.type)!.nodes.push(neuron.neuronId);
    }
    
    return Array.from(clusterMap.values());
  }

  private getClusterColor(type: string): string {
    const colors: Record<string, string> = {
      'react': '#61DAFB',
      'api': '#FF6B35',
      'cli': '#4ECDC4',
      'ai': '#A8E6CF',
      'data': '#FFD93D'
    };
    return colors[type] || '#B0B0B0';
  }

  private async getLastActivity(neuronId: string): Promise<Date | null> {
    const [lastEvent] = await db.select()
      .from(federationEvents)
      .where(eq(federationEvents.neuronId, neuronId))
      .orderBy(desc(federationEvents.timestamp))
      .limit(1);
    
    return lastEvent?.timestamp || null;
  }

  private async restartNeuron(neuronId: string): Promise<any> {
    // Send restart command via WebSocket
    return await webSocketManager.sendToNeuron(neuronId, {
      type: 'restart',
      timestamp: new Date().toISOString()
    });
  }

  private async triggerSync(neuronId?: string, payload?: any): Promise<any> {
    // Trigger manual sync
    const targetNeurons = neuronId ? [neuronId] : 'all';
    return await federationCore.pushConfig(
      'manual_sync_trigger',
      { timestamp: new Date().toISOString(), ...payload },
      targetNeurons as any,
      { immediate: true }
    );
  }
}

export const dashboardManager = new FederationDashboardManager();