/**
 * ENTERPRISE REAL-TIME MONITORING SYSTEM
 * Production-grade health monitoring, alerts, and observability
 */

import { EventEmitter } from 'events';
import { z } from 'zod';

// Health Check Schema
const HealthCheckSchema = z.object({
  component: z.string(),
  status: z.enum(['healthy', 'degraded', 'unhealthy', 'unknown']),
  responseTime: z.number().min(0),
  timestamp: z.date(),
  details: z.object({
    cpu: z.number().min(0).max(100).optional(),
    memory: z.number().min(0).max(100).optional(),
    connections: z.number().min(0).optional(),
    errors: z.number().min(0).optional(),
    throughput: z.number().min(0).optional()
  }).optional(),
  message: z.string().optional()
});

type HealthCheck = z.infer<typeof HealthCheckSchema>;

// Alert Schema
const AlertSchema = z.object({
  id: z.string(),
  level: z.enum(['info', 'warning', 'error', 'critical']),
  component: z.string(),
  message: z.string(),
  timestamp: z.date(),
  resolved: z.boolean().default(false),
  metadata: z.record(z.any()).optional()
});

type Alert = z.infer<typeof AlertSchema>;

export class EnterpriseMonitoring extends EventEmitter {
  private healthChecks = new Map<string, HealthCheck>();
  private alerts = new Map<string, Alert>();
  private metrics = new Map<string, number>();
  private checkIntervals = new Map<string, NodeJS.Timeout>();

  constructor() {
    super();
    this.initializeSystemMonitoring();
  }

  private initializeSystemMonitoring(): void {
    console.log('🔍 Initializing Enterprise Monitoring System...');
    
    // Optimized monitoring intervals for system stability
    this.registerHealthCheck('database', this.checkDatabaseHealth.bind(this), 180000); // 3 minutes
    this.registerHealthCheck('federation', this.checkFederationHealth.bind(this), 300000); // 5 minutes
    this.registerHealthCheck('ai-ml', this.checkAIMLHealth.bind(this), 600000); // 10 minutes
    this.registerHealthCheck('security', this.checkSecurityHealth.bind(this), 450000); // 7.5 minutes
    
    console.log('✅ Enterprise Monitoring System initialized');
  }

  registerHealthCheck(
    component: string,
    checker: () => Promise<HealthCheck>,
    intervalMs: number = 30000
  ): void {
    // Clear existing interval if any
    if (this.checkIntervals.has(component)) {
      clearInterval(this.checkIntervals.get(component)!);
    }

    // Set up periodic health check
    const interval = setInterval(async () => {
      try {
        const health = await checker();
        this.updateHealthStatus(component, health);
      } catch (error) {
        this.updateHealthStatus(component, {
          component,
          status: 'unhealthy',
          responseTime: 0,
          timestamp: new Date(),
          message: `Health check failed: ${error}`
        });
      }
    }, intervalMs);

    this.checkIntervals.set(component, interval);
    
    // Run initial check
    checker().then(health => this.updateHealthStatus(component, health));
  }

  private async checkDatabaseHealth(): Promise<HealthCheck> {
    const start = Date.now();
    try {
      // Database connection test would go here
      const responseTime = Date.now() - start;
      
      return {
        component: 'database',
        status: responseTime < 100 ? 'healthy' : responseTime < 500 ? 'degraded' : 'unhealthy',
        responseTime,
        timestamp: new Date(),
        details: {
          connections: this.metrics.get('db_connections') || 0,
          errors: this.metrics.get('db_errors') || 0
        }
      };
    } catch (error) {
      return {
        component: 'database',
        status: 'unhealthy',
        responseTime: Date.now() - start,
        timestamp: new Date(),
        message: `Database health check failed: ${error}`
      };
    }
  }

  private async checkFederationHealth(): Promise<HealthCheck> {
    const start = Date.now();
    try {
      const activeNeurons = this.metrics.get('active_neurons') || 0;
      const responseTime = Date.now() - start;
      
      return {
        component: 'federation',
        status: activeNeurons >= 5 ? 'healthy' : activeNeurons >= 2 ? 'degraded' : 'unhealthy',
        responseTime,
        timestamp: new Date(),
        details: {
          connections: activeNeurons,
          throughput: this.metrics.get('federation_throughput') || 0
        }
      };
    } catch (error) {
      return {
        component: 'federation',
        status: 'unhealthy',
        responseTime: Date.now() - start,
        timestamp: new Date(),
        message: `Federation health check failed: ${error}`
      };
    }
  }

  private async checkAIMLHealth(): Promise<HealthCheck> {
    const start = Date.now();
    try {
      const modelAccuracy = this.metrics.get('ml_accuracy') || 0;
      const responseTime = Date.now() - start;
      
      return {
        component: 'ai-ml',
        status: modelAccuracy >= 0.85 ? 'healthy' : modelAccuracy >= 0.75 ? 'degraded' : 'unhealthy',
        responseTime,
        timestamp: new Date(),
        details: {
          cpu: this.metrics.get('ai_cpu') || 0,
          memory: this.metrics.get('ai_memory') || 0,
          throughput: this.metrics.get('ai_throughput') || 0
        }
      };
    } catch (error) {
      return {
        component: 'ai-ml',
        status: 'unhealthy',
        responseTime: Date.now() - start,
        timestamp: new Date(),
        message: `AI/ML health check failed: ${error}`
      };
    }
  }

  private async checkSecurityHealth(): Promise<HealthCheck> {
    const start = Date.now();
    try {
      const failedAttempts = this.metrics.get('security_failures') || 0;
      const responseTime = Date.now() - start;
      
      return {
        component: 'security',
        status: failedAttempts < 10 ? 'healthy' : failedAttempts < 50 ? 'degraded' : 'unhealthy',
        responseTime,
        timestamp: new Date(),
        details: {
          errors: failedAttempts,
          throughput: this.metrics.get('security_checks') || 0
        }
      };
    } catch (error) {
      return {
        component: 'security',
        status: 'unhealthy',
        responseTime: Date.now() - start,
        timestamp: new Date(),
        message: `Security health check failed: ${error}`
      };
    }
  }

  updateHealthStatus(component: string, health: HealthCheck): void {
    const validated = HealthCheckSchema.parse(health);
    const previous = this.healthChecks.get(component);
    
    this.healthChecks.set(component, validated);
    
    // Trigger alerts on status changes
    if (previous && previous.status !== validated.status) {
      this.handleStatusChange(component, previous.status, validated.status);
    }
    
    // Emit health update event
    this.emit('healthUpdate', { component, health: validated });
  }

  private handleStatusChange(
    component: string,
    oldStatus: string,
    newStatus: string
  ): void {
    if (newStatus === 'unhealthy' || newStatus === 'degraded') {
      this.createAlert({
        id: `${component}_${Date.now()}`,
        level: newStatus === 'unhealthy' ? 'critical' : 'warning',
        component,
        message: `Component ${component} status changed from ${oldStatus} to ${newStatus}`,
        timestamp: new Date(),
        resolved: false
      });
    } else if (oldStatus === 'unhealthy' && newStatus === 'healthy') {
      this.createAlert({
        id: `${component}_recovery_${Date.now()}`,
        level: 'info',
        component,
        message: `Component ${component} recovered to ${newStatus}`,
        timestamp: new Date(),
        resolved: false
      });
    }
  }

  createAlert(alert: Omit<Alert, 'id'> & { id?: string }): void {
    const alertId = alert.id || `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const validated = AlertSchema.parse({ ...alert, id: alertId });
    
    this.alerts.set(alertId, validated);
    this.emit('alert', validated);
    
    console.log(`🚨 [${validated.level.toUpperCase()}] ${validated.component}: ${validated.message}`);
  }

  updateMetric(name: string, value: number): void {
    this.metrics.set(name, value);
    this.emit('metricUpdate', { name, value });
  }

  getSystemHealth(): {
    overall: string;
    components: Record<string, HealthCheck>;
    alerts: Alert[];
    metrics: Record<string, number>;
  } {
    const components: Record<string, HealthCheck> = {};
    this.healthChecks.forEach((health, component) => {
      components[component] = health;
    });

    const activeAlerts = Array.from(this.alerts.values()).filter(alert => !alert.resolved);
    
    // Calculate overall status
    const statuses = Array.from(this.healthChecks.values()).map(h => h.status);
    const overall = statuses.includes('unhealthy') ? 'unhealthy' :
                   statuses.includes('degraded') ? 'degraded' : 'healthy';

    return {
      overall,
      components,
      alerts: activeAlerts,
      metrics: Object.fromEntries(this.metrics.entries())
    };
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      this.emit('alertResolved', alert);
      return true;
    }
    return false;
  }

  shutdown(): void {
    console.log('🔽 Shutting down Enterprise Monitoring System...');
    
    // Clear all intervals
    this.checkIntervals.forEach(interval => clearInterval(interval));
    this.checkIntervals.clear();
    
    this.removeAllListeners();
    console.log('✅ Enterprise Monitoring System shutdown complete');
  }
}

// Global monitoring instance
export const enterpriseMonitoring = new EnterpriseMonitoring();