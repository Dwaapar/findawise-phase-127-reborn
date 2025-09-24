/**
 * API Neuron Monitoring and Alerting Service
 * ===========================================
 * 
 * Comprehensive monitoring system for API-only neurons including:
 * - Real-time health tracking
 * - Performance monitoring
 * - Automated alerting
 * - SLA tracking
 * - Incident management
 */

import { storage } from '../storage';
import { EventEmitter } from 'events';

// Simple logger for this service
const logger = {
  info: (message: string, meta: any = {}) => console.log(`[INFO] ${message}`, meta),
  warn: (message: string, meta: any = {}) => console.warn(`[WARN] ${message}`, meta),
  error: (message: string, meta: any = {}) => console.error(`[ERROR] ${message}`, meta)
};

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: AlertCondition;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  cooldownMinutes: number;
  notificationChannels: string[];
  actions?: AlertAction[];
}

export interface AlertCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  duration?: number; // minutes
  evaluationWindow?: number; // minutes
}

export interface AlertAction {
  type: 'restart' | 'scale' | 'notification' | 'webhook';
  config: Record<string, any>;
}

export interface Alert {
  id: string;
  ruleId: string;
  neuronId: string;
  severity: string;
  message: string;
  triggeredAt: Date;
  resolvedAt?: Date;
  status: 'active' | 'resolved' | 'suppressed';
  metadata: Record<string, any>;
}

export interface HealthStatus {
  neuronId: string;
  status: 'healthy' | 'degraded' | 'critical' | 'offline';
  healthScore: number;
  lastHeartbeat: Date;
  uptime: number;
  issues: string[];
  metrics: Record<string, number>;
}

export interface SLATarget {
  neuronId: string;
  availability: number; // percentage
  responseTime: number; // milliseconds
  errorRate: number; // percentage
  throughput: number; // requests per minute
}

class ApiNeuronMonitoringService extends EventEmitter {
  private alertRules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private alertCooldowns: Map<string, Date> = new Map();
  private healthStatusCache: Map<string, HealthStatus> = new Map();
  private slaTargets: Map<string, SLATarget> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor() {
    super();
    this.initializeDefaultAlertRules();
  }

  /**
   * Initialize default alert rules for common scenarios
   */
  private initializeDefaultAlertRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'neuron-offline',
        name: 'Neuron Offline',
        description: 'Neuron has not sent heartbeat for more than 2 minutes',
        condition: {
          metric: 'heartbeat_age',
          operator: 'gt',
          threshold: 120000, // 2 minutes in milliseconds
          evaluationWindow: 1
        },
        severity: 'critical',
        enabled: true,
        cooldownMinutes: 5,
        notificationChannels: ['email', 'slack'],
        actions: [
          {
            type: 'notification',
            config: { channels: ['email', 'slack'] }
          }
        ]
      },
      {
        id: 'high-error-rate',
        name: 'High Error Rate',
        description: 'Error rate exceeds 10% over 5 minutes',
        condition: {
          metric: 'error_rate',
          operator: 'gt',
          threshold: 10,
          duration: 5,
          evaluationWindow: 5
        },
        severity: 'high',
        enabled: true,
        cooldownMinutes: 10,
        notificationChannels: ['slack'],
        actions: [
          {
            type: 'notification',
            config: { channels: ['slack'] }
          }
        ]
      },
      {
        id: 'low-health-score',
        name: 'Low Health Score',
        description: 'Health score below 70 for more than 3 minutes',
        condition: {
          metric: 'health_score',
          operator: 'lt',
          threshold: 70,
          duration: 3,
          evaluationWindow: 5
        },
        severity: 'medium',
        enabled: true,
        cooldownMinutes: 15,
        notificationChannels: ['slack']
      },
      {
        id: 'high-response-time',
        name: 'High Response Time',
        description: 'Average response time exceeds 5 seconds',
        condition: {
          metric: 'avg_response_time',
          operator: 'gt',
          threshold: 5000,
          duration: 5,
          evaluationWindow: 10
        },
        severity: 'medium',
        enabled: true,
        cooldownMinutes: 10,
        notificationChannels: ['slack']
      },
      {
        id: 'memory-usage-high',
        name: 'High Memory Usage',
        description: 'Memory usage exceeds 90%',
        condition: {
          metric: 'memory_percent',
          operator: 'gt',
          threshold: 90,
          duration: 2,
          evaluationWindow: 5
        },
        severity: 'high',
        enabled: true,
        cooldownMinutes: 10,
        notificationChannels: ['email', 'slack']
      },
      {
        id: 'cpu-usage-high',
        name: 'High CPU Usage',
        description: 'CPU usage exceeds 95% for sustained period',
        condition: {
          metric: 'cpu_percent',
          operator: 'gt',
          threshold: 95,
          duration: 5,
          evaluationWindow: 10
        },
        severity: 'high',
        enabled: true,
        cooldownMinutes: 15,
        notificationChannels: ['slack']
      }
    ];

    defaultRules.forEach(rule => {
      this.alertRules.set(rule.id, rule);
    });

    logger.info('Initialized default alert rules', {
      component: 'ApiNeuronMonitoring',
      rulesCount: defaultRules.length
    });
  }

  /**
   * Start the monitoring service
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Monitoring service already running');
      return;
    }

    this.isRunning = true;
    
    // Start monitoring loop - OPTIMIZED: 5 minutes to reduce memory pressure
    this.monitoringInterval = setInterval(async () => {
      await this.evaluateAllNeurons();
    }, 300000); // Check every 5 minutes for memory optimization

    // Initial evaluation
    await this.evaluateAllNeurons();

    logger.info('API Neuron monitoring service started', {
      component: 'ApiNeuronMonitoring',
      alertRules: this.alertRules.size
    });

    this.emit('monitoring_started');
  }

  /**
   * Stop the monitoring service
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    logger.info('API Neuron monitoring service stopped', {
      component: 'ApiNeuronMonitoring'
    });

    this.emit('monitoring_stopped');
  }

  /**
   * Evaluate all neurons for alerts
   */
  private async evaluateAllNeurons(): Promise<void> {
    try {
      const neurons = await storage.getAllApiNeurons();
      
      for (const neuron of neurons) {
        await this.evaluateNeuron(neuron.neuronId);
      }
    } catch (error) {
      logger.error('Failed to evaluate neurons', {
        component: 'ApiNeuronMonitoring',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Evaluate a specific neuron for alerts
   */
  private async evaluateNeuron(neuronId: string): Promise<void> {
    try {
      const healthStatus = await this.calculateHealthStatus(neuronId);
      this.healthStatusCache.set(neuronId, healthStatus);

      // Evaluate each alert rule
      for (const rule of this.alertRules.values()) {
        if (!rule.enabled) continue;

        await this.evaluateAlertRule(neuronId, rule, healthStatus);
      }
    } catch (error) {
      logger.error('Failed to evaluate neuron', {
        component: 'ApiNeuronMonitoring',
        neuronId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Calculate comprehensive health status for a neuron
   */
  private async calculateHealthStatus(neuronId: string): Promise<HealthStatus> {
    const neuron = await storage.getApiNeuronById(neuronId);
    const lastHeartbeat = await storage.getLatestApiNeuronHeartbeat(neuronId);
    const analytics = await storage.getApiNeuronAnalytics(neuronId, 1);

    if (!neuron) {
      return {
        neuronId,
        status: 'offline',
        healthScore: 0,
        lastHeartbeat: new Date(0),
        uptime: 0,
        issues: ['Neuron not found'],
        metrics: {}
      };
    }

    const now = new Date();
    const issues: string[] = [];
    let healthScore = 100;
    const metrics: Record<string, number> = {};

    // Check heartbeat freshness
    const heartbeatAge = lastHeartbeat 
      ? now.getTime() - new Date(lastHeartbeat.timestamp).getTime()
      : Infinity;
    
    metrics.heartbeat_age = heartbeatAge;

    if (heartbeatAge > 120000) { // 2 minutes
      issues.push('No recent heartbeat');
      healthScore -= 40;
    } else if (heartbeatAge > 90000) { // 1.5 minutes
      issues.push('Delayed heartbeat');
      healthScore -= 20;
    }

    // Analyze recent analytics
    if (analytics.length > 0) {
      const recentAnalytics = analytics[0];
      
      metrics.error_rate = recentAnalytics.errorRate || 0;
      metrics.avg_response_time = recentAnalytics.averageResponseTime || 0;
      metrics.uptime = recentAnalytics.uptime || 0;
      metrics.cpu_percent = recentAnalytics.cpuUsageAvg || 0;
      metrics.memory_percent = recentAnalytics.memoryUsageAvg || 0;
      metrics.health_score = neuron.healthScore || 0;

      // Error rate check
      const errorRate = recentAnalytics.errorRate || 0;
      if (errorRate > 20) {
        issues.push('Very high error rate');
        healthScore -= 30;
      } else if (errorRate > 10) {
        issues.push('High error rate');
        healthScore -= 15;
      }

      // Response time check
      const avgResponseTime = recentAnalytics.averageResponseTime || 0;
      if (avgResponseTime > 10000) {
        issues.push('Very slow response times');
        healthScore -= 25;
      } else if (avgResponseTime > 5000) {
        issues.push('Slow response times');
        healthScore -= 10;
      }

      // Resource usage checks
      const cpuUsage = recentAnalytics.cpuUsageAvg || 0;
      if (cpuUsage > 95) {
        issues.push('Critical CPU usage');
        healthScore -= 20;
      } else if (cpuUsage > 80) {
        issues.push('High CPU usage');
        healthScore -= 10;
      }

      const memoryUsage = recentAnalytics.memoryUsageAvg || 0;
      if (memoryUsage > 95) {
        issues.push('Critical memory usage');
        healthScore -= 20;
      } else if (memoryUsage > 85) {
        issues.push('High memory usage');
        healthScore -= 10;
      }
    }

    // Determine overall status
    let status: HealthStatus['status'];
    if (heartbeatAge > 300000) { // 5 minutes
      status = 'offline';
    } else if (healthScore < 50 || issues.length > 3) {
      status = 'critical';
    } else if (healthScore < 70 || issues.length > 1) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    return {
      neuronId,
      status,
      healthScore: Math.max(0, healthScore),
      lastHeartbeat: lastHeartbeat ? new Date(lastHeartbeat.timestamp) : new Date(0),
      uptime: lastHeartbeat?.uptime || 0,
      issues,
      metrics
    };
  }

  /**
   * Evaluate a specific alert rule against a neuron
   */
  private async evaluateAlertRule(
    neuronId: string, 
    rule: AlertRule, 
    healthStatus: HealthStatus
  ): Promise<void> {
    const alertKey = `${rule.id}-${neuronId}`;
    
    // Check cooldown
    const cooldownExpiry = this.alertCooldowns.get(alertKey);
    if (cooldownExpiry && new Date() < cooldownExpiry) {
      return;
    }

    // Get metric value
    const metricValue = this.getMetricValue(rule.condition.metric, healthStatus);
    if (metricValue === null) {
      return;
    }

    // Evaluate condition
    const isTriggered = this.evaluateCondition(rule.condition, metricValue);
    
    const existingAlert = Array.from(this.activeAlerts.values())
      .find(alert => alert.ruleId === rule.id && alert.neuronId === neuronId);

    if (isTriggered && !existingAlert) {
      // Trigger new alert
      await this.triggerAlert(rule, neuronId, healthStatus, metricValue);
    } else if (!isTriggered && existingAlert && existingAlert.status === 'active') {
      // Resolve existing alert
      await this.resolveAlert(existingAlert.id);
    }
  }

  /**
   * Get metric value from health status
   */
  private getMetricValue(metricName: string, healthStatus: HealthStatus): number | null {
    switch (metricName) {
      case 'heartbeat_age':
        return Date.now() - healthStatus.lastHeartbeat.getTime();
      case 'health_score':
        return healthStatus.healthScore;
      case 'error_rate':
      case 'avg_response_time':
      case 'cpu_percent':
      case 'memory_percent':
      case 'uptime':
        return healthStatus.metrics[metricName] || 0;
      default:
        return healthStatus.metrics[metricName] || null;
    }
  }

  /**
   * Evaluate condition against metric value
   */
  private evaluateCondition(condition: AlertCondition, value: number): boolean {
    switch (condition.operator) {
      case 'gt':
        return value > condition.threshold;
      case 'gte':
        return value >= condition.threshold;
      case 'lt':
        return value < condition.threshold;
      case 'lte':
        return value <= condition.threshold;
      case 'eq':
        return value === condition.threshold;
      default:
        return false;
    }
  }

  /**
   * Trigger a new alert
   */
  private async triggerAlert(
    rule: AlertRule, 
    neuronId: string, 
    healthStatus: HealthStatus, 
    metricValue: number
  ): Promise<void> {
    const alertId = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const alert: Alert = {
      id: alertId,
      ruleId: rule.id,
      neuronId,
      severity: rule.severity,
      message: `${rule.name}: ${rule.description} (current: ${metricValue}, threshold: ${rule.condition.threshold})`,
      triggeredAt: new Date(),
      status: 'active',
      metadata: {
        metricValue,
        threshold: rule.condition.threshold,
        healthStatus: healthStatus.status,
        healthScore: healthStatus.healthScore
      }
    };

    this.activeAlerts.set(alertId, alert);

    // Set cooldown
    const cooldownExpiry = new Date(Date.now() + rule.cooldownMinutes * 60000);
    this.alertCooldowns.set(`${rule.id}-${neuronId}`, cooldownExpiry);

    logger.warn('Alert triggered', {
      component: 'ApiNeuronMonitoring',
      alertId,
      ruleId: rule.id,
      neuronId,
      severity: rule.severity,
      message: alert.message
    });

    // Execute alert actions
    if (rule.actions) {
      for (const action of rule.actions) {
        await this.executeAlertAction(action, alert, rule);
      }
    }

    this.emit('alert_triggered', alert);
  }

  /**
   * Resolve an active alert
   */
  private async resolveAlert(alertId: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return;

    alert.status = 'resolved';
    alert.resolvedAt = new Date();

    logger.info('Alert resolved', {
      component: 'ApiNeuronMonitoring',
      alertId,
      ruleId: alert.ruleId,
      neuronId: alert.neuronId,
      duration: alert.resolvedAt.getTime() - alert.triggeredAt.getTime()
    });

    this.emit('alert_resolved', alert);
  }

  /**
   * Execute alert action
   */
  private async executeAlertAction(
    action: AlertAction, 
    alert: Alert, 
    rule: AlertRule
  ): Promise<void> {
    try {
      switch (action.type) {
        case 'notification':
          await this.sendNotification(alert, rule, action.config);
          break;
        case 'restart':
          await this.restartNeuron(alert.neuronId);
          break;
        case 'webhook':
          await this.callWebhook(alert, action.config);
          break;
        default:
          logger.warn('Unknown alert action type', {
            component: 'ApiNeuronMonitoring',
            actionType: action.type,
            alertId: alert.id
          });
      }
    } catch (error) {
      logger.error('Failed to execute alert action', {
        component: 'ApiNeuronMonitoring',
        actionType: action.type,
        alertId: alert.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Send notification for alert
   */
  private async sendNotification(
    alert: Alert, 
    rule: AlertRule, 
    config: Record<string, any>
  ): Promise<void> {
    // Implementation would depend on notification channels
    logger.info('Alert notification sent', {
      component: 'ApiNeuronMonitoring',
      alertId: alert.id,
      channels: config.channels || rule.notificationChannels,
      severity: alert.severity
    });
  }

  /**
   * Restart neuron via command
   */
  private async restartNeuron(neuronId: string): Promise<void> {
    const command = {
      commandId: `restart-${Date.now()}`,
      neuronId,
      commandType: 'restart',
      commandData: { reason: 'Automated restart due to health alert' },
      issuedBy: 'monitoring-system',
      priority: 'high',
      timeout: 60000
    };

    await storage.issueApiNeuronCommand(command);

    logger.info('Restart command issued', {
      component: 'ApiNeuronMonitoring',
      neuronId
    });
  }

  /**
   * Call webhook for alert
   */
  private async callWebhook(alert: Alert, config: Record<string, any>): Promise<void> {
    // Implementation would make HTTP request to webhook URL
    logger.info('Webhook called for alert', {
      component: 'ApiNeuronMonitoring',
      alertId: alert.id,
      webhookUrl: config.url
    });
  }

  /**
   * Get current health status for all neurons
   */
  async getHealthStatusOverview(): Promise<HealthStatus[]> {
    return Array.from(this.healthStatusCache.values());
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values())
      .filter(alert => alert.status === 'active');
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit: number = 100): Alert[] {
    return Array.from(this.activeAlerts.values())
      .sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime())
      .slice(0, limit);
  }

  /**
   * Add custom alert rule
   */
  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
    
    logger.info('Alert rule added', {
      component: 'ApiNeuronMonitoring',
      ruleId: rule.id,
      ruleName: rule.name
    });
  }

  /**
   * Remove alert rule
   */
  removeAlertRule(ruleId: string): boolean {
    const removed = this.alertRules.delete(ruleId);
    
    if (removed) {
      logger.info('Alert rule removed', {
        component: 'ApiNeuronMonitoring',
        ruleId
      });
    }
    
    return removed;
  }

  /**
   * Update alert rule
   */
  updateAlertRule(ruleId: string, updates: Partial<AlertRule>): boolean {
    const rule = this.alertRules.get(ruleId);
    if (!rule) return false;

    const updatedRule = { ...rule, ...updates };
    this.alertRules.set(ruleId, updatedRule);

    logger.info('Alert rule updated', {
      component: 'ApiNeuronMonitoring',
      ruleId,
      updates: Object.keys(updates)
    });

    return true;
  }

  /**
   * Set SLA targets for a neuron
   */
  setSLATargets(neuronId: string, targets: SLATarget): void {
    this.slaTargets.set(neuronId, targets);
    
    logger.info('SLA targets set', {
      component: 'ApiNeuronMonitoring',
      neuronId,
      targets
    });
  }

  /**
   * Get SLA compliance report
   */
  async getSLAComplianceReport(neuronId: string, days: number = 7): Promise<any> {
    const targets = this.slaTargets.get(neuronId);
    if (!targets) {
      return { error: 'No SLA targets defined for neuron' };
    }

    const analytics = await storage.getApiNeuronAnalytics(neuronId, days);
    const heartbeats = await storage.getApiNeuronHeartbeatHistory(neuronId, days * 24);

    // Calculate SLA metrics
    const totalUptime = analytics.reduce((sum, a) => sum + (a.uptime || 0), 0);
    const totalPossibleUptime = days * 24 * 60 * 60; // seconds
    const availability = (totalUptime / totalPossibleUptime) * 100;

    const avgResponseTime = analytics.reduce((sum, a) => sum + (a.averageResponseTime || 0), 0) / analytics.length;
    const avgErrorRate = analytics.reduce((sum, a) => sum + (a.errorRate || 0), 0) / analytics.length;
    const avgThroughput = analytics.reduce((sum, a) => sum + (a.requestCount || 0), 0) / (days * 24 * 60); // per minute

    return {
      neuronId,
      period: `${days} days`,
      targets,
      actual: {
        availability: Math.round(availability * 100) / 100,
        responseTime: Math.round(avgResponseTime),
        errorRate: Math.round(avgErrorRate * 100) / 100,
        throughput: Math.round(avgThroughput * 100) / 100
      },
      compliance: {
        availability: availability >= targets.availability,
        responseTime: avgResponseTime <= targets.responseTime,
        errorRate: avgErrorRate <= targets.errorRate,
        throughput: avgThroughput >= targets.throughput
      },
      score: this.calculateSLAScore(targets, {
        availability,
        responseTime: avgResponseTime,
        errorRate: avgErrorRate,
        throughput: avgThroughput
      })
    };
  }

  /**
   * Calculate SLA compliance score
   */
  private calculateSLAScore(targets: SLATarget, actual: any): number {
    let score = 0;
    let totalWeight = 4;

    // Availability (weight: 1)
    if (actual.availability >= targets.availability) {
      score += 1;
    } else {
      score += actual.availability / targets.availability;
    }

    // Response time (weight: 1, inverse)
    if (actual.responseTime <= targets.responseTime) {
      score += 1;
    } else {
      score += Math.max(0, 1 - (actual.responseTime - targets.responseTime) / targets.responseTime);
    }

    // Error rate (weight: 1, inverse)
    if (actual.errorRate <= targets.errorRate) {
      score += 1;
    } else {
      score += Math.max(0, 1 - (actual.errorRate - targets.errorRate) / targets.errorRate);
    }

    // Throughput (weight: 1)
    if (actual.throughput >= targets.throughput) {
      score += 1;
    } else {
      score += actual.throughput / targets.throughput;
    }

    return Math.round((score / totalWeight) * 10000) / 100; // percentage with 2 decimal places
  }
}

// Export singleton instance
export const apiNeuronMonitoring = new ApiNeuronMonitoringService();

// Export types for use in other modules
export {
  type AlertRule,
  type AlertCondition,
  type AlertAction,
  type Alert,
  type HealthStatus,
  type SLATarget
};