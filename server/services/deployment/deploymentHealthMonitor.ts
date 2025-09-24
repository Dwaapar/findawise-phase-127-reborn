/**
 * DEPLOYMENT HEALTH MONITOR SERVICE - BILLION DOLLAR EMPIRE GRADE
 * Enterprise-grade health monitoring service for deployment infrastructure
 * Integrates with existing empire infrastructure for comprehensive monitoring
 */

import { deploymentHealthMonitor } from '../../../scripts/deployment-health-monitor';

export class DeploymentHealthMonitorService {
  private static instance: DeploymentHealthMonitorService;
  private monitor = deploymentHealthMonitor;
  private initialized = false;

  constructor() {
    if (DeploymentHealthMonitorService.instance) {
      return DeploymentHealthMonitorService.instance;
    }
    DeploymentHealthMonitorService.instance = this;
  }

  /**
   * Initialize the deployment health monitor
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Setup event handlers
      this.monitor.on('alert', (alert) => {
        console.log(`🚨 Health Alert: ${alert.level} - ${alert.message}`);
      });

      this.monitor.on('execution-log', (log) => {
        console.log(`📋 Deployment Log: [${log.phase}:${log.step}] ${log.message}`);
      });

      // Start monitoring
      await this.monitor.startMonitoring();
      this.initialized = true;

      console.log('✅ Deployment health monitor initialized');
    } catch (error) {
      console.error('❌ Failed to initialize deployment health monitor:', error);
      throw error;
    }
  }

  /**
   * Get health monitor status
   */
  getStatus() {
    return this.monitor.getStatus();
  }

  /**
   * Stop monitoring
   */
  async stop(): Promise<void> {
    if (!this.initialized) return;
    
    await this.monitor.stopMonitoring();
    this.initialized = false;
  }

  /**
   * Get singleton instance
   */
  static getInstance(): DeploymentHealthMonitorService {
    if (!DeploymentHealthMonitorService.instance) {
      DeploymentHealthMonitorService.instance = new DeploymentHealthMonitorService();
    }
    return DeploymentHealthMonitorService.instance;
  }
}

export const deploymentHealthMonitorService = DeploymentHealthMonitorService.getInstance();