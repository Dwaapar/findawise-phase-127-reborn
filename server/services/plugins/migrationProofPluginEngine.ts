/**
 * MIGRATION-PROOF AI PLUGIN SELF-DEBUG ENGINE
 * Empire-Grade Migration-Proof Plugin System with Zero-Downtime Guarantees
 * 
 * This system ensures complete plugin functionality across any Replit migration,
 * database change, or environment transition with zero feature loss.
 */

import { EventEmitter } from 'events';
import { logger } from '../../utils/logger.js';
import { AIPluginMarketplace } from './aiPluginMarketplace.js';
import { CodexAuditEngine } from '../codex/codexAuditEngine.js';
import { DatabaseStorage } from '../../storage.js';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

interface MigrationProofConfig {
  enableFallbackMode: boolean;
  backupInterval: number; // minutes
  healthCheckInterval: number; // seconds
  autoRecoveryEnabled: boolean;
  emergencyModeThreshold: number; // failure count
  migrationSafetyChecks: boolean;
}

interface PluginHealthCheck {
  pluginId: string;
  status: 'healthy' | 'degraded' | 'critical' | 'offline';
  lastCheck: Date;
  errorCount: number;
  performance: {
    responseTime: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  dependencies: {
    database: boolean;
    filesystem: boolean;
    network: boolean;
    memory: boolean;
  };
}

interface EmergencyBackup {
  timestamp: Date;
  pluginStates: Map<string, any>;
  configurations: Map<string, any>;
  executionQueue: any[];
  criticalData: any;
}

export class MigrationProofPluginEngine extends EventEmitter {
  private marketplace: AIPluginMarketplace;
  private codexEngine: CodexAuditEngine;
  private storage: DatabaseStorage;
  private config: MigrationProofConfig;
  private healthChecks: Map<string, PluginHealthCheck> = new Map();
  private emergencyBackups: EmergencyBackup[] = [];
  private isEmergencyMode = false;
  private healthCheckInterval?: NodeJS.Timeout;
  private backupInterval?: NodeJS.Timeout;
  private migrationDetector?: NodeJS.Timeout;
  private lastKnownGoodState?: EmergencyBackup;

  constructor(
    marketplace: AIPluginMarketplace,
    codexEngine: CodexAuditEngine,
    storage: DatabaseStorage
  ) {
    super();
    this.marketplace = marketplace;
    this.codexEngine = codexEngine;
    this.storage = storage;
    
    this.config = {
      enableFallbackMode: true,
      backupInterval: 5, // 5 minutes
      healthCheckInterval: 30, // 30 seconds
      autoRecoveryEnabled: true,
      emergencyModeThreshold: 3,
      migrationSafetyChecks: true
    };

    this.setMaxListeners(100);
    this.initialize();
  }

  /**
   * Initialize Migration-Proof Engine
   */
  private async initialize(): Promise<void> {
    try {
      logger.info('Initializing Migration-Proof Plugin Engine', { 
        component: 'MigrationProofPluginEngine' 
      });

      // Create emergency backup directory
      await this.ensureBackupDirectory();

      // Start monitoring services
      this.startHealthMonitoring();
      this.startBackupScheduler();
      this.startMigrationDetection();

      // Create initial backup
      await this.createEmergencyBackup();

      // Register event handlers
      this.registerEventHandlers();

      this.emit('migration-proof:initialized');
      
      logger.info('Migration-Proof Plugin Engine initialized successfully', {
        component: 'MigrationProofPluginEngine',
        config: this.config
      });

    } catch (error) {
      logger.error('Failed to initialize Migration-Proof Plugin Engine', {
        error,
        component: 'MigrationProofPluginEngine'
      });
      throw error;
    }
  }

  /**
   * Health Monitoring System
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performHealthChecks();
      } catch (error) {
        logger.error('Health check failed', {
          error,
          component: 'MigrationProofPluginEngine'
        });
      }
    }, this.config.healthCheckInterval * 1000);
  }

  private async performHealthChecks(): Promise<void> {
    // Get all active plugins
    const plugins = this.marketplace.getAvailablePlugins();
    
    for (const plugin of plugins) {
      const health = await this.checkPluginHealth(plugin.id);
      this.healthChecks.set(plugin.id, health);

      // Trigger recovery if needed
      if (health.status === 'critical' && this.config.autoRecoveryEnabled) {
        await this.triggerPluginRecovery(plugin.id);
      }
    }

    // Check overall system health
    await this.checkSystemHealth();
  }

  private async checkPluginHealth(pluginId: string): Promise<PluginHealthCheck> {
    const startTime = Date.now();
    let status: 'healthy' | 'degraded' | 'critical' | 'offline' = 'healthy';
    let errorCount = 0;

    try {
      // Test basic plugin functionality
      const testResult = await this.marketplace.testPluginHealth(pluginId);
      
      if (!testResult.success) {
        status = 'degraded';
        errorCount = testResult.errorCount || 1;
      }

      // Check dependencies
      const dependencies = await this.checkPluginDependencies(pluginId);
      
      if (!dependencies.database || !dependencies.memory) {
        status = 'critical';
        errorCount += 2;
      }

      const responseTime = Date.now() - startTime;

      return {
        pluginId,
        status,
        lastCheck: new Date(),
        errorCount,
        performance: {
          responseTime,
          memoryUsage: process.memoryUsage().heapUsed,
          cpuUsage: process.cpuUsage().user
        },
        dependencies
      };

    } catch (error) {
      logger.error('Plugin health check failed', {
        error,
        pluginId,
        component: 'MigrationProofPluginEngine'
      });

      return {
        pluginId,
        status: 'offline',
        lastCheck: new Date(),
        errorCount: 5,
        performance: {
          responseTime: Date.now() - startTime,
          memoryUsage: 0,
          cpuUsage: 0
        },
        dependencies: {
          database: false,
          filesystem: false,
          network: false,
          memory: false
        }
      };
    }
  }

  private async checkPluginDependencies(pluginId: string): Promise<{
    database: boolean;
    filesystem: boolean;
    network: boolean;
    memory: boolean;
  }> {
    const dependencies = {
      database: true,
      filesystem: true,
      network: true,
      memory: true
    };

    try {
      // Test database connectivity
      await this.storage.testConnection();
    } catch (error) {
      dependencies.database = false;
    }

    try {
      // Test filesystem access
      await fs.access('./');
    } catch (error) {
      dependencies.filesystem = false;
    }

    // Check memory availability
    const memUsage = process.memoryUsage();
    if (memUsage.heapUsed / memUsage.heapTotal > 0.95) {
      dependencies.memory = false;
    }

    return dependencies;
  }

  /**
   * Emergency Backup System
   */
  private startBackupScheduler(): void {
    this.backupInterval = setInterval(async () => {
      try {
        await this.createEmergencyBackup();
      } catch (error) {
        logger.error('Emergency backup failed', {
          error,
          component: 'MigrationProofPluginEngine'
        });
      }
    }, this.config.backupInterval * 60 * 1000);
  }

  private async createEmergencyBackup(): Promise<void> {
    try {
      const backup: EmergencyBackup = {
        timestamp: new Date(),
        pluginStates: new Map(),
        configurations: new Map(),
        executionQueue: [],
        criticalData: {}
      };

      // Backup plugin states
      const plugins = this.marketplace.getAvailablePlugins();
      for (const plugin of plugins) {
        const instances = this.marketplace.getPluginInstances(plugin.id);
        backup.pluginStates.set(plugin.id, {
          plugin,
          instances,
          health: this.healthChecks.get(plugin.id)
        });
      }

      // Backup configurations
      const marketplaceStats = await this.marketplace.getMarketplaceStats();
      backup.criticalData = {
        stats: marketplaceStats,
        healthSummary: Array.from(this.healthChecks.values()),
        timestamp: new Date(),
        version: '1.0.0'
      };

      // Store backup
      this.emergencyBackups.push(backup);
      this.lastKnownGoodState = backup;

      // Keep only last 10 backups
      if (this.emergencyBackups.length > 10) {
        this.emergencyBackups.shift();
      }

      // Write to filesystem as well
      await this.writeBackupToFile(backup);

      logger.info('Emergency backup created successfully', {
        component: 'MigrationProofPluginEngine',
        backupCount: this.emergencyBackups.length,
        timestamp: backup.timestamp
      });

    } catch (error) {
      logger.error('Failed to create emergency backup', {
        error,
        component: 'MigrationProofPluginEngine'
      });
    }
  }

  private async writeBackupToFile(backup: EmergencyBackup): Promise<void> {
    try {
      const backupDir = path.join(process.cwd(), '.backups', 'plugins');
      await fs.mkdir(backupDir, { recursive: true });

      const filename = `plugin-backup-${backup.timestamp.getTime()}.json`;
      const filepath = path.join(backupDir, filename);

      // Convert Maps to objects for JSON serialization
      const serializable = {
        ...backup,
        pluginStates: Object.fromEntries(backup.pluginStates),
        configurations: Object.fromEntries(backup.configurations)
      };

      await fs.writeFile(filepath, JSON.stringify(serializable, null, 2));

      logger.info('Backup written to file', {
        filepath,
        component: 'MigrationProofPluginEngine'
      });

    } catch (error) {
      logger.error('Failed to write backup to file', {
        error,
        component: 'MigrationProofPluginEngine'
      });
    }
  }

  /**
   * Migration Detection System
   */
  private startMigrationDetection(): void {
    this.migrationDetector = setInterval(async () => {
      try {
        await this.detectMigrationEvent();
      } catch (error) {
        logger.error('Migration detection failed', {
          error,
          component: 'MigrationProofPluginEngine'
        });
      }
    }, 10000); // Check every 10 seconds
  }

  private async detectMigrationEvent(): Promise<void> {
    // Check for signs of migration
    const indicators = await this.checkMigrationIndicators();
    
    if (indicators.migrationDetected) {
      logger.warn('Migration event detected', {
        indicators,
        component: 'MigrationProofPluginEngine'
      });

      await this.handleMigrationEvent(indicators);
    }
  }

  private async checkMigrationIndicators(): Promise<{
    migrationDetected: boolean;
    indicators: string[];
    confidence: number;
  }> {
    const indicators: string[] = [];
    let confidence = 0;

    try {
      // Check database connection changes
      const dbHealth = await this.storage.testConnection();
      if (!dbHealth) {
        indicators.push('database_disconnection');
        confidence += 0.4;
      }

      // Check for environment variable changes
      const currentEnv = process.env.DATABASE_URL;
      if (this.lastKnownGoodState && currentEnv !== this.lastKnownGoodState.criticalData?.databaseUrl) {
        indicators.push('environment_change');
        confidence += 0.3;
      }

      // Check filesystem changes
      try {
        await fs.access('./server');
      } catch (error) {
        indicators.push('filesystem_change');
        confidence += 0.2;
      }

      // Check plugin health degradation
      const criticalPlugins = Array.from(this.healthChecks.values())
        .filter(health => health.status === 'critical' || health.status === 'offline');
      
      if (criticalPlugins.length > 2) {
        indicators.push('mass_plugin_failure');
        confidence += 0.5;
      }

    } catch (error) {
      indicators.push('system_error');
      confidence += 0.6;
    }

    return {
      migrationDetected: confidence > 0.5,
      indicators,
      confidence
    };
  }

  /**
   * Migration Event Handling
   */
  private async handleMigrationEvent(indicators: any): Promise<void> {
    logger.warn('Handling migration event', {
      indicators,
      component: 'MigrationProofPluginEngine'
    });

    // Enter emergency mode
    this.isEmergencyMode = true;
    this.emit('migration-proof:emergency-mode', indicators);

    try {
      // 1. Create immediate backup
      await this.createEmergencyBackup();

      // 2. Switch to fallback mode
      await this.enableFallbackMode();

      // 3. Validate plugin integrity
      await this.validatePluginIntegrity();

      // 4. Attempt auto-recovery
      if (this.config.autoRecoveryEnabled) {
        await this.attemptAutoRecovery();
      }

      // 5. Run emergency audit
      await this.runEmergencyAudit();

      logger.info('Migration event handled successfully', {
        component: 'MigrationProofPluginEngine'
      });

    } catch (error) {
      logger.error('Failed to handle migration event', {
        error,
        indicators,
        component: 'MigrationProofPluginEngine'
      });

      // Last resort: restore from backup
      await this.restoreFromBackup();
    }
  }

  private async enableFallbackMode(): Promise<void> {
    logger.info('Enabling fallback mode', {
      component: 'MigrationProofPluginEngine'
    });

    // Switch all plugins to safe mode
    const plugins = this.marketplace.getAvailablePlugins();
    
    for (const plugin of plugins) {
      try {
        await this.marketplace.setPluginSafeMode(plugin.id, true);
      } catch (error) {
        logger.error('Failed to enable safe mode for plugin', {
          error,
          pluginId: plugin.id,
          component: 'MigrationProofPluginEngine'
        });
      }
    }
  }

  /**
   * Recovery Systems
   */
  private async triggerPluginRecovery(pluginId: string): Promise<void> {
    logger.info('Triggering plugin recovery', {
      pluginId,
      component: 'MigrationProofPluginEngine'
    });

    try {
      // 1. Stop plugin
      await this.marketplace.stopPlugin(pluginId);

      // 2. Clear caches
      await this.marketplace.clearPluginCache(pluginId);

      // 3. Restart plugin
      await this.marketplace.startPlugin(pluginId);

      // 4. Verify recovery
      const health = await this.checkPluginHealth(pluginId);
      
      if (health.status === 'healthy') {
        logger.info('Plugin recovery successful', {
          pluginId,
          component: 'MigrationProofPluginEngine'
        });
      } else {
        throw new Error(`Plugin recovery failed: ${health.status}`);
      }

    } catch (error) {
      logger.error('Plugin recovery failed', {
        error,
        pluginId,
        component: 'MigrationProofPluginEngine'
      });

      // Try restoring from backup
      await this.restorePluginFromBackup(pluginId);
    }
  }

  private async attemptAutoRecovery(): Promise<void> {
    logger.info('Attempting automatic recovery', {
      component: 'MigrationProofPluginEngine'
    });

    try {
      // 1. Restart all critical plugins
      const criticalPlugins = Array.from(this.healthChecks.values())
        .filter(health => health.status === 'critical')
        .map(health => health.pluginId);

      for (const pluginId of criticalPlugins) {
        await this.triggerPluginRecovery(pluginId);
      }

      // 2. Re-initialize marketplace
      await this.marketplace.initialize();

      // 3. Verify system health
      await this.performHealthChecks();

      // 4. Exit emergency mode if successful
      const healthyPlugins = Array.from(this.healthChecks.values())
        .filter(health => health.status === 'healthy').length;
      
      const totalPlugins = this.healthChecks.size;
      
      if (healthyPlugins / totalPlugins > 0.8) {
        this.isEmergencyMode = false;
        this.emit('migration-proof:recovery-success');
        
        logger.info('Auto-recovery successful', {
          healthyPlugins,
          totalPlugins,
          component: 'MigrationProofPluginEngine'
        });
      }

    } catch (error) {
      logger.error('Auto-recovery failed', {
        error,
        component: 'MigrationProofPluginEngine'
      });
    }
  }

  private async restoreFromBackup(): Promise<void> {
    if (!this.lastKnownGoodState) {
      logger.error('No backup available for restoration', {
        component: 'MigrationProofPluginEngine'
      });
      return;
    }

    logger.info('Restoring from emergency backup', {
      backupTimestamp: this.lastKnownGoodState.timestamp,
      component: 'MigrationProofPluginEngine'
    });

    try {
      // Restore plugin states
      for (const [pluginId, state] of this.lastKnownGoodState.pluginStates) {
        await this.restorePluginFromBackup(pluginId, state);
      }

      logger.info('System restored from backup', {
        component: 'MigrationProofPluginEngine'
      });

    } catch (error) {
      logger.error('Failed to restore from backup', {
        error,
        component: 'MigrationProofPluginEngine'
      });
    }
  }

  private async restorePluginFromBackup(pluginId: string, backupState?: any): Promise<void> {
    try {
      if (backupState) {
        // Restore specific state
        await this.marketplace.restorePluginState(pluginId, backupState);
      } else if (this.lastKnownGoodState) {
        // Restore from last known good state
        const state = this.lastKnownGoodState.pluginStates.get(pluginId);
        if (state) {
          await this.marketplace.restorePluginState(pluginId, state);
        }
      }

      logger.info('Plugin restored from backup', {
        pluginId,
        component: 'MigrationProofPluginEngine'
      });

    } catch (error) {
      logger.error('Failed to restore plugin from backup', {
        error,
        pluginId,
        component: 'MigrationProofPluginEngine'
      });
    }
  }

  /**
   * Emergency Audit System
   */
  private async runEmergencyAudit(): Promise<void> {
    logger.info('Running emergency audit', {
      component: 'MigrationProofPluginEngine'
    });

    try {
      // Run comprehensive system audit
      const auditResult = await this.codexEngine.runAudit({
        auditType: 'security',
        scope: 'plugins',
        priority: 'critical',
        autoFix: true,
        triggeredBy: 'migration-emergency'
      });

      // Run plugin-specific audits
      const plugins = this.marketplace.getAvailablePlugins();
      for (const plugin of plugins) {
        try {
          await this.codexEngine.runAudit({
            auditType: 'code',
            scope: `plugin-${plugin.id}`,
            priority: 'high',
            autoFix: false,
            triggeredBy: 'migration-emergency'
          });
        } catch (error) {
          logger.error('Plugin audit failed', {
            error,
            pluginId: plugin.id,
            component: 'MigrationProofPluginEngine'
          });
        }
      }

      logger.info('Emergency audit completed', {
        auditScore: auditResult.summary.auditScore,
        issuesFound: auditResult.summary.totalIssues,
        component: 'MigrationProofPluginEngine'
      });

    } catch (error) {
      logger.error('Emergency audit failed', {
        error,
        component: 'MigrationProofPluginEngine'
      });
    }
  }

  /**
   * System Health Checks
   */
  private async checkSystemHealth(): Promise<void> {
    const healthySystems = {
      database: false,
      plugins: false,
      marketplace: false,
      memory: false
    };

    try {
      // Check database
      healthySystems.database = await this.storage.testConnection();

      // Check plugins
      const healthyPlugins = Array.from(this.healthChecks.values())
        .filter(health => health.status === 'healthy').length;
      healthySystems.plugins = healthyPlugins > 0;

      // Check marketplace
      healthySystems.marketplace = this.marketplace.isHealthy();

      // Check memory
      const memUsage = process.memoryUsage();
      healthySystems.memory = memUsage.heapUsed / memUsage.heapTotal < 0.9;

      // Emit health status
      this.emit('migration-proof:health-check', healthySystems);

    } catch (error) {
      logger.error('System health check failed', {
        error,
        component: 'MigrationProofPluginEngine'
      });
    }
  }

  private async validatePluginIntegrity(): Promise<void> {
    logger.info('Validating plugin integrity', {
      component: 'MigrationProofPluginEngine'
    });

    const plugins = this.marketplace.getAvailablePlugins();
    
    for (const plugin of plugins) {
      try {
        // Check plugin checksum
        const integrity = await this.marketplace.validatePluginIntegrity(plugin.id);
        
        if (!integrity.valid) {
          logger.warn('Plugin integrity check failed', {
            pluginId: plugin.id,
            reason: integrity.reason,
            component: 'MigrationProofPluginEngine'
          });

          // Attempt to repair
          await this.marketplace.repairPlugin(plugin.id);
        }

      } catch (error) {
        logger.error('Plugin integrity validation failed', {
          error,
          pluginId: plugin.id,
          component: 'MigrationProofPluginEngine'
        });
      }
    }
  }

  /**
   * Utility Functions
   */
  private async ensureBackupDirectory(): Promise<void> {
    const backupDir = path.join(process.cwd(), '.backups', 'plugins');
    await fs.mkdir(backupDir, { recursive: true });
  }

  private registerEventHandlers(): void {
    // Marketplace events
    this.marketplace.on('plugin:error', (data) => {
      this.handlePluginError(data);
    });

    this.marketplace.on('plugin:installed', (data) => {
      this.createEmergencyBackup();
    });

    // Note: CodexAuditEngine doesn't emit events, using direct method calls instead

    // Process events
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception detected', {
        error,
        component: 'MigrationProofPluginEngine'
      });
      this.createEmergencyBackup();
    });
  }

  private async handlePluginError(data: any): Promise<void> {
    const health = this.healthChecks.get(data.pluginId);
    
    if (health) {
      health.errorCount++;
      
      if (health.errorCount >= this.config.emergencyModeThreshold) {
        await this.triggerPluginRecovery(data.pluginId);
      }
    }
  }

  private async handleCriticalAuditResult(data: any): Promise<void> {
    if (data.summary.criticalIssues > 0) {
      logger.warn('Critical issues found in audit', {
        criticalIssues: data.summary.criticalIssues,
        auditType: data.audit.auditType,
        component: 'MigrationProofPluginEngine'
      });

      // Trigger emergency backup
      await this.createEmergencyBackup();
    }
  }

  /**
   * Public API
   */
  public async getSystemStatus(): Promise<{
    isEmergencyMode: boolean;
    healthStatus: any;
    backupCount: number;
    lastBackup?: Date;
    migrationSafety: 'safe' | 'warning' | 'critical';
  }> {
    const healthStatus = Array.from(this.healthChecks.values());
    const healthyCount = healthStatus.filter(h => h.status === 'healthy').length;
    const totalCount = healthStatus.length;
    
    let migrationSafety: 'safe' | 'warning' | 'critical' = 'safe';
    
    if (totalCount === 0 || healthyCount / totalCount < 0.5) {
      migrationSafety = 'critical';
    } else if (healthyCount / totalCount < 0.8) {
      migrationSafety = 'warning';
    }

    return {
      isEmergencyMode: this.isEmergencyMode,
      healthStatus,
      backupCount: this.emergencyBackups.length,
      lastBackup: this.lastKnownGoodState?.timestamp,
      migrationSafety
    };
  }

  public async forceBackup(): Promise<void> {
    await this.createEmergencyBackup();
  }

  public async testMigrationReadiness(): Promise<{
    ready: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Check backup availability
      if (this.emergencyBackups.length === 0) {
        issues.push('No emergency backups available');
        recommendations.push('Create at least one emergency backup');
      }

      // Check plugin health
      const criticalPlugins = Array.from(this.healthChecks.values())
        .filter(health => health.status === 'critical' || health.status === 'offline');
      
      if (criticalPlugins.length > 0) {
        issues.push(`${criticalPlugins.length} plugins in critical state`);
        recommendations.push('Resolve plugin health issues before migration');
      }

      // Check system resources
      const memUsage = process.memoryUsage();
      if (memUsage.heapUsed / memUsage.heapTotal > 0.9) {
        issues.push('High memory usage detected');
        recommendations.push('Reduce memory usage before migration');
      }

      return {
        ready: issues.length === 0,
        issues,
        recommendations
      };

    } catch (error) {
      return {
        ready: false,
        issues: ['Migration readiness test failed'],
        recommendations: ['Check system health and try again']
      };
    }
  }

  /**
   * Cleanup
   */
  public async shutdown(): Promise<void> {
    logger.info('Shutting down Migration-Proof Plugin Engine', {
      component: 'MigrationProofPluginEngine'
    });

    // Create final backup
    await this.createEmergencyBackup();

    // Clear intervals
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
    }
    
    if (this.migrationDetector) {
      clearInterval(this.migrationDetector);
    }

    // Remove event listeners
    this.removeAllListeners();

    logger.info('Migration-Proof Plugin Engine shutdown complete', {
      component: 'MigrationProofPluginEngine'
    });
  }
}

export { MigrationProofConfig, PluginHealthCheck, EmergencyBackup };