/**
 * PLUGIN MARKETPLACE + CODEX SELF-DEBUG INTEGRATION ENGINE
 * Empire-Grade AI Plugin Marketplace with Self-Debug Capabilities
 * 
 * This integration provides seamless interaction between the AI Plugin Marketplace
 * and the Codex Auto-Audit Engine for continuous quality assurance and healing.
 */

import { EventEmitter } from 'events';
import { logger } from '../../utils/logger.js';
import { AIPluginMarketplace } from './aiPluginMarketplace.js';
import { CodexAuditEngine } from '../codex/codexAuditEngine.js';
import { MigrationProofPluginEngine } from './migrationProofPluginEngine.js';
import { DatabaseStorage } from '../../storage.js';

interface PluginAuditConfig {
  enableContinuousAudit: boolean;
  auditInterval: number; // minutes
  autoFixEnabled: boolean;
  criticalIssueThreshold: number;
  auditScope: 'all' | 'active-only' | 'critical-only';
  notificationLevel: 'silent' | 'warnings' | 'all';
}

interface PluginSelfHealingEvent {
  pluginId: string;
  instanceId?: string;
  issueType: 'performance' | 'security' | 'compatibility' | 'corruption';
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: 'audit' | 'repair' | 'restart' | 'isolate' | 'remove';
  timestamp: Date;
  success: boolean;
  details: any;
}

export class PluginCodexIntegration extends EventEmitter {
  private marketplace: AIPluginMarketplace;
  private codexEngine: CodexAuditEngine;
  private migrationEngine: MigrationProofPluginEngine;
  private storage: DatabaseStorage;
  private config: PluginAuditConfig;
  private auditInterval?: NodeJS.Timeout;
  private selfHealingEvents: PluginSelfHealingEvent[] = [];
  private pluginHealthMap: Map<string, any> = new Map();

  constructor(
    marketplace: AIPluginMarketplace,
    codexEngine: CodexAuditEngine,
    migrationEngine: MigrationProofPluginEngine,
    storage: DatabaseStorage
  ) {
    super();
    this.marketplace = marketplace;
    this.codexEngine = codexEngine;
    this.migrationEngine = migrationEngine;
    this.storage = storage;
    
    this.config = {
      enableContinuousAudit: true,
      auditInterval: 15, // 15 minutes
      autoFixEnabled: true,
      criticalIssueThreshold: 3,
      auditScope: 'active-only',
      notificationLevel: 'warnings'
    };

    this.setMaxListeners(100);
    this.initialize();
  }

  /**
   * Initialize Integration Engine
   */
  private async initialize(): Promise<void> {
    try {
      logger.info('Initializing Plugin-Codex Integration Engine', { 
        component: 'PluginCodexIntegration' 
      });

      // Register event handlers
      this.registerEventHandlers();

      // Start continuous audit system
      if (this.config.enableContinuousAudit) {
        this.startContinuousAudit();
      }

      // Perform initial health assessment
      await this.performInitialHealthAssessment();

      this.emit('integration:initialized');
      
      logger.info('Plugin-Codex Integration Engine initialized successfully', {
        component: 'PluginCodexIntegration',
        config: this.config
      });

    } catch (error) {
      logger.error('Failed to initialize Plugin-Codex Integration Engine', {
        error,
        component: 'PluginCodexIntegration'
      });
      throw error;
    }
  }

  /**
   * Event Handler Registration
   */
  private registerEventHandlers(): void {
    // Marketplace events
    this.marketplace.on('plugin:installed', (data) => {
      this.handlePluginInstalled(data);
    });

    this.marketplace.on('plugin:execution:failed', (data) => {
      this.handlePluginExecutionFailed(data);
    });

    this.marketplace.on('plugin:error', (data) => {
      this.handlePluginError(data);
    });

    // Migration engine events
    this.migrationEngine.on('migration-proof:emergency-mode', (data) => {
      this.handleEmergencyMode(data);
    });

    this.migrationEngine.on('migration-proof:health-check', (data) => {
      this.handleHealthCheckUpdate(data);
    });

    // Note: CodexAuditEngine doesn't emit events, so we'll use direct method calls instead
    // Integration is handled through direct audit calls in the performContinuousAudit method
  }

  /**
   * Continuous Audit System
   */
  private startContinuousAudit(): void {
    this.auditInterval = setInterval(async () => {
      try {
        await this.performContinuousAudit();
      } catch (error) {
        logger.error('Continuous audit failed', {
          error,
          component: 'PluginCodexIntegration'
        });
      }
    }, this.config.auditInterval * 60 * 1000);

    logger.info('Continuous audit system started', {
      interval: this.config.auditInterval,
      component: 'PluginCodexIntegration'
    });
  }

  private async performContinuousAudit(): Promise<void> {
    try {
      const plugins = this.getPluginsForAudit();
      
      for (const plugin of plugins) {
        await this.auditPlugin(plugin.id);
      }

      // Audit overall marketplace health
      await this.auditMarketplaceHealth();

      logger.info('Continuous audit completed', {
        pluginsAudited: plugins.length,
        component: 'PluginCodexIntegration'
      });

    } catch (error) {
      logger.error('Continuous audit failed', {
        error,
        component: 'PluginCodexIntegration'
      });
    }
  }

  private getPluginsForAudit(): any[] {
    const allPlugins = this.marketplace.getAvailablePlugins();
    
    switch (this.config.auditScope) {
      case 'active-only':
        return allPlugins.filter(plugin => {
          const instances = this.marketplace.getPluginInstances(plugin.id);
          return instances.some(instance => instance.status === 'active');
        });
      
      case 'critical-only':
        return allPlugins.filter(plugin => {
          const health = this.pluginHealthMap.get(plugin.id);
          return health && (health.status === 'critical' || health.status === 'degraded');
        });
      
      case 'all':
      default:
        return allPlugins;
    }
  }

  /**
   * Plugin Auditing
   */
  async auditPlugin(pluginId: string): Promise<{
    auditId: string;
    issuesFound: number;
    criticalIssues: number;
    autoFixesApplied: number;
    recommendations: string[];
  }> {
    try {
      logger.info('Starting plugin audit', {
        pluginId,
        component: 'PluginCodexIntegration'
      });

      // 1. Security audit
      const securityAudit = await this.codexEngine.runAudit({
        auditType: 'security',
        scope: `plugin-${pluginId}`,
        priority: 'high',
        autoFix: this.config.autoFixEnabled,
        triggeredBy: 'continuous-audit'
      });

      // 2. Performance audit
      const performanceAudit = await this.codexEngine.runAudit({
        auditType: 'performance',
        scope: `plugin-${pluginId}`,
        priority: 'medium',
        autoFix: this.config.autoFixEnabled,
        triggeredBy: 'continuous-audit'
      });

      // 3. Code quality audit
      const codeAudit = await this.codexEngine.runAudit({
        auditType: 'code',
        scope: `plugin-${pluginId}`,
        priority: 'medium',
        autoFix: this.config.autoFixEnabled,
        triggeredBy: 'continuous-audit'
      });

      // Aggregate results
      const totalIssues = securityAudit.summary.totalIssues + 
                         performanceAudit.summary.totalIssues + 
                         codeAudit.summary.totalIssues;

      const criticalIssues = securityAudit.summary.criticalIssues + 
                            performanceAudit.summary.criticalIssues + 
                            codeAudit.summary.criticalIssues;

      const autoFixesApplied = securityAudit.summary.autoFixesApplied + 
                              performanceAudit.summary.autoFixesApplied + 
                              codeAudit.summary.autoFixesApplied;

      // Generate recommendations
      const recommendations = this.generatePluginRecommendations(
        pluginId, 
        securityAudit, 
        performanceAudit, 
        codeAudit
      );

      // Check if self-healing is needed
      if (criticalIssues >= this.config.criticalIssueThreshold) {
        await this.triggerPluginSelfHealing(pluginId, 'critical', {
          criticalIssues,
          audits: [securityAudit, performanceAudit, codeAudit]
        });
      }

      // Update plugin health map
      this.updatePluginHealth(pluginId, {
        lastAudit: new Date(),
        totalIssues,
        criticalIssues,
        autoFixesApplied,
        healthScore: this.calculateHealthScore(totalIssues, criticalIssues)
      });

      const result = {
        auditId: securityAudit.audit.auditId,
        issuesFound: totalIssues,
        criticalIssues,
        autoFixesApplied,
        recommendations
      };

      this.emit('plugin:audit:completed', { pluginId, result });

      return result;

    } catch (error) {
      logger.error('Plugin audit failed', {
        error,
        pluginId,
        component: 'PluginCodexIntegration'
      });
      throw error;
    }
  }

  private generatePluginRecommendations(
    pluginId: string,
    securityAudit: any,
    performanceAudit: any,
    codeAudit: any
  ): string[] {
    const recommendations: string[] = [];

    // Security recommendations
    if (securityAudit.summary.criticalIssues > 0) {
      recommendations.push('Address critical security vulnerabilities immediately');
    }

    // Performance recommendations
    if (performanceAudit.summary.totalIssues > 5) {
      recommendations.push('Optimize plugin performance to reduce resource usage');
    }

    // Code quality recommendations
    if (codeAudit.summary.totalIssues > 10) {
      recommendations.push('Refactor code to improve maintainability and readability');
    }

    // Plugin-specific recommendations
    const instances = this.marketplace.getPluginInstances(pluginId);
    const failingInstances = instances.filter(i => i.status === 'error').length;
    
    if (failingInstances > 0) {
      recommendations.push(`Investigate ${failingInstances} failing plugin instances`);
    }

    if (recommendations.length === 0) {
      recommendations.push('Plugin is healthy - continue monitoring');
    }

    return recommendations;
  }

  /**
   * Self-Healing System
   */
  private async triggerPluginSelfHealing(
    pluginId: string, 
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: any
  ): Promise<void> {
    try {
      logger.warn('Triggering plugin self-healing', {
        pluginId,
        severity,
        details,
        component: 'PluginCodexIntegration'
      });

      let action: 'audit' | 'repair' | 'restart' | 'isolate' | 'remove' = 'audit';
      let success = false;

      // Determine healing action based on severity
      switch (severity) {
        case 'critical':
          if (details.criticalIssues >= 5) {
            action = 'isolate';
            success = await this.isolatePlugin(pluginId);
          } else {
            action = 'repair';
            success = await this.repairPlugin(pluginId);
          }
          break;

        case 'high':
          action = 'restart';
          success = await this.restartPlugin(pluginId);
          break;

        case 'medium':
          action = 'repair';
          success = await this.repairPlugin(pluginId);
          break;

        case 'low':
        default:
          action = 'audit';
          success = true; // Already audited
          break;
      }

      // Record self-healing event
      const healingEvent: PluginSelfHealingEvent = {
        pluginId,
        issueType: 'security', // Default, could be more specific
        severity,
        action,
        timestamp: new Date(),
        success,
        details
      };

      this.selfHealingEvents.push(healingEvent);

      // Keep only last 1000 events
      if (this.selfHealingEvents.length > 1000) {
        this.selfHealingEvents = this.selfHealingEvents.slice(-1000);
      }

      this.emit('plugin:self-healing', healingEvent);

      logger.info('Plugin self-healing completed', {
        pluginId,
        action,
        success,
        component: 'PluginCodexIntegration'
      });

    } catch (error) {
      logger.error('Plugin self-healing failed', {
        error,
        pluginId,
        severity,
        component: 'PluginCodexIntegration'
      });
    }
  }

  private async isolatePlugin(pluginId: string): Promise<boolean> {
    try {
      // Set plugin to safe mode
      await this.marketplace.setPluginSafeMode(pluginId, true);
      
      // Stop all instances
      await this.marketplace.stopPlugin(pluginId);
      
      logger.info('Plugin isolated successfully', {
        pluginId,
        component: 'PluginCodexIntegration'
      });
      
      return true;
    } catch (error) {
      logger.error('Failed to isolate plugin', {
        error,
        pluginId,
        component: 'PluginCodexIntegration'
      });
      return false;
    }
  }

  private async repairPlugin(pluginId: string): Promise<boolean> {
    try {
      await this.marketplace.repairPlugin(pluginId);
      return true;
    } catch (error) {
      logger.error('Failed to repair plugin', {
        error,
        pluginId,
        component: 'PluginCodexIntegration'
      });
      return false;
    }
  }

  private async restartPlugin(pluginId: string): Promise<boolean> {
    try {
      await this.marketplace.stopPlugin(pluginId);
      await this.marketplace.startPlugin(pluginId);
      return true;
    } catch (error) {
      logger.error('Failed to restart plugin', {
        error,
        pluginId,
        component: 'PluginCodexIntegration'
      });
      return false;
    }
  }

  /**
   * Event Handlers
   */
  private async handlePluginInstalled(data: any): Promise<void> {
    try {
      // Run initial audit on newly installed plugins
      await this.auditPlugin(data.pluginId);
      
      logger.info('New plugin audited after installation', {
        pluginId: data.pluginId,
        component: 'PluginCodexIntegration'
      });
    } catch (error) {
      logger.error('Failed to audit newly installed plugin', {
        error,
        pluginId: data.pluginId,
        component: 'PluginCodexIntegration'
      });
    }
  }

  private async handlePluginExecutionFailed(data: any): Promise<void> {
    try {
      const pluginId = data.execution.plugin_id;
      
      // Check if this is a pattern of failures
      const recentFailures = this.selfHealingEvents
        .filter(event => 
          event.pluginId === pluginId && 
          event.timestamp > new Date(Date.now() - 15 * 60 * 1000) // Last 15 minutes
        ).length;

      if (recentFailures >= 3) {
        await this.triggerPluginSelfHealing(pluginId, 'high', {
          recentFailures,
          lastError: data.error
        });
      }
      
    } catch (error) {
      logger.error('Failed to handle plugin execution failure', {
        error,
        component: 'PluginCodexIntegration'
      });
    }
  }

  private async handlePluginError(data: any): Promise<void> {
    try {
      await this.triggerPluginSelfHealing(data.pluginId, 'medium', {
        errorType: 'plugin_error',
        errorDetails: data
      });
    } catch (error) {
      logger.error('Failed to handle plugin error', {
        error,
        component: 'PluginCodexIntegration'
      });
    }
  }

  private async handleEmergencyMode(data: any): Promise<void> {
    try {
      // During emergency mode, audit all critical plugins
      const criticalPlugins = this.marketplace.getAvailablePlugins()
        .filter(plugin => {
          const health = this.pluginHealthMap.get(plugin.id);
          return health && health.healthScore < 50; // Below 50% health
        });

      for (const plugin of criticalPlugins) {
        await this.auditPlugin(plugin.id);
      }
      
      logger.info('Emergency audit completed for critical plugins', {
        criticalPluginCount: criticalPlugins.length,
        component: 'PluginCodexIntegration'
      });
    } catch (error) {
      logger.error('Failed to handle emergency mode', {
        error,
        component: 'PluginCodexIntegration'
      });
    }
  }

  private handleHealthCheckUpdate(data: any): void {
    // Update plugin health based on migration engine health checks
    for (const [pluginId, systemHealth] of Object.entries(data)) {
      const currentHealth = this.pluginHealthMap.get(pluginId) || {};
      
      this.pluginHealthMap.set(pluginId, {
        ...currentHealth,
        systemHealth,
        lastHealthCheck: new Date()
      });
    }
  }

  private async handleAuditCompleted(data: any): Promise<void> {
    try {
      // Process audit results and trigger healing if needed
      if (data.summary.criticalIssues > 0) {
        const pluginId = data.audit.scope.replace('plugin-', '');
        
        await this.triggerPluginSelfHealing(pluginId, 'high', {
          auditResults: data.summary,
          auditType: data.audit.auditType
        });
      }
    } catch (error) {
      logger.error('Failed to handle audit completion', {
        error,
        component: 'PluginCodexIntegration'
      });
    }
  }

  private handleFixApplied(data: any): void {
    // Update plugin health when fixes are applied
    const pluginId = data.fix.filePath?.includes('plugin') 
      ? this.extractPluginIdFromPath(data.fix.filePath) 
      : null;
    
    if (pluginId) {
      const currentHealth = this.pluginHealthMap.get(pluginId) || {};
      
      this.pluginHealthMap.set(pluginId, {
        ...currentHealth,
        lastFixApplied: new Date(),
        autoFixCount: (currentHealth.autoFixCount || 0) + 1
      });
    }
  }

  /**
   * Health Management
   */
  private async performInitialHealthAssessment(): Promise<void> {
    try {
      const plugins = this.marketplace.getAvailablePlugins();
      
      for (const plugin of plugins) {
        const health = await this.marketplace.testPluginHealth(plugin.id);
        
        this.pluginHealthMap.set(plugin.id, {
          lastHealthCheck: new Date(),
          healthScore: health.success ? 100 : 50,
          responseTime: health.responseTime,
          errorCount: health.errorCount,
          details: health.details
        });
      }

      logger.info('Initial health assessment completed', {
        pluginCount: plugins.length,
        component: 'PluginCodexIntegration'
      });

    } catch (error) {
      logger.error('Initial health assessment failed', {
        error,
        component: 'PluginCodexIntegration'
      });
    }
  }

  private updatePluginHealth(pluginId: string, healthUpdate: any): void {
    const currentHealth = this.pluginHealthMap.get(pluginId) || {};
    
    this.pluginHealthMap.set(pluginId, {
      ...currentHealth,
      ...healthUpdate
    });
  }

  private calculateHealthScore(totalIssues: number, criticalIssues: number): number {
    // Simple health scoring algorithm
    let score = 100;
    
    score -= totalIssues * 2; // -2 points per issue
    score -= criticalIssues * 10; // -10 points per critical issue
    
    return Math.max(0, Math.min(100, score));
  }

  private async auditMarketplaceHealth(): Promise<void> {
    try {
      // Run marketplace-wide audit
      await this.codexEngine.runAudit({
        auditType: 'performance',
        scope: 'marketplace',
        priority: 'medium',
        autoFix: false,
        triggeredBy: 'continuous-audit'
      });

      // Check migration readiness
      const migrationReadiness = await this.migrationEngine.testMigrationReadiness();
      
      if (!migrationReadiness.ready) {
        logger.warn('Marketplace not ready for migration', {
          issues: migrationReadiness.issues,
          recommendations: migrationReadiness.recommendations,
          component: 'PluginCodexIntegration'
        });
      }

    } catch (error) {
      logger.error('Marketplace health audit failed', {
        error,
        component: 'PluginCodexIntegration'
      });
    }
  }

  /**
   * Utility Functions
   */
  private extractPluginIdFromPath(filePath: string): string | null {
    const match = filePath.match(/plugin-([^/]+)/);
    return match ? match[1] : null;
  }

  /**
   * Public API
   */
  public async getIntegrationStatus(): Promise<{
    continuousAuditEnabled: boolean;
    lastAuditTime?: Date;
    pluginHealthSummary: any;
    selfHealingEvents: number;
    migrationReadiness: any;
  }> {
    try {
      const migrationReadiness = await this.migrationEngine.testMigrationReadiness();
      
      const healthSummary = Array.from(this.pluginHealthMap.entries()).map(([pluginId, health]) => ({
        pluginId,
        healthScore: health.healthScore || 0,
        lastCheck: health.lastHealthCheck,
        status: health.healthScore > 80 ? 'healthy' : health.healthScore > 50 ? 'warning' : 'critical'
      }));

      return {
        continuousAuditEnabled: this.config.enableContinuousAudit,
        lastAuditTime: this.getLastAuditTime(),
        pluginHealthSummary: healthSummary,
        selfHealingEvents: this.selfHealingEvents.length,
        migrationReadiness
      };

    } catch (error) {
      logger.error('Failed to get integration status', {
        error,
        component: 'PluginCodexIntegration'
      });
      throw error;
    }
  }

  public async forceAuditAllPlugins(): Promise<void> {
    const plugins = this.marketplace.getAvailablePlugins();
    
    for (const plugin of plugins) {
      await this.auditPlugin(plugin.id);
    }
  }

  public getRecentSelfHealingEvents(limit: number = 50): PluginSelfHealingEvent[] {
    return this.selfHealingEvents
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  public updateConfig(newConfig: Partial<PluginAuditConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart continuous audit if interval changed
    if (newConfig.auditInterval && this.auditInterval) {
      clearInterval(this.auditInterval);
      this.startContinuousAudit();
    }
  }

  private getLastAuditTime(): Date | undefined {
    const healthEntries = Array.from(this.pluginHealthMap.values());
    const lastAudits = healthEntries
      .map(health => health.lastAudit)
      .filter(date => date)
      .sort((a, b) => b.getTime() - a.getTime());

    return lastAudits[0];
  }

  /**
   * Cleanup
   */
  public async shutdown(): Promise<void> {
    logger.info('Shutting down Plugin-Codex Integration Engine', {
      component: 'PluginCodexIntegration'
    });

    // Clear intervals
    if (this.auditInterval) {
      clearInterval(this.auditInterval);
    }

    // Remove event listeners
    this.removeAllListeners();

    // Clear data
    this.selfHealingEvents = [];
    this.pluginHealthMap.clear();

    logger.info('Plugin-Codex Integration Engine shutdown complete', {
      component: 'PluginCodexIntegration'
    });
  }
}

export { PluginAuditConfig, PluginSelfHealingEvent };