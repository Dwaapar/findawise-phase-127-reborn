/**
 * PLUGIN MARKETPLACE & SELF-DEBUG API ROUTES
 * Empire-Grade AI Plugin Marketplace with Integrated Self-Debug Capabilities
 * 
 * Complete API suite for plugin management, marketplace operations,
 * and integrated self-debug functionality.
 */

import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { logger } from '../utils/logger.js';
import { requireAuth } from '../middleware/auth';
import { AIPluginMarketplace } from '../services/plugins/aiPluginMarketplace';
import { MigrationProofPluginEngine } from '../services/plugins/migrationProofPluginEngine';
import { PluginCodexIntegration } from '../services/plugins/pluginCodexIntegration';
import { CodexAuditEngine } from '../services/codex/codexAuditEngine';

const router = Router();

// Initialize services
const marketplace = new AIPluginMarketplace(storage);
const codexEngine = new CodexAuditEngine(storage);
const migrationEngine = new MigrationProofPluginEngine(marketplace, codexEngine, storage);
const integration = new PluginCodexIntegration(marketplace, codexEngine, migrationEngine, storage);

// Initialize services
Promise.all([
  marketplace.initialize(),
  codexEngine.initialize?.() || Promise.resolve(),
  migrationEngine.initialize?.() || Promise.resolve(),
  integration.initialize?.() || Promise.resolve()
]).then(() => {
  logger.info('All plugin services initialized successfully');
}).catch(error => {
  logger.error('Failed to initialize plugin services', { error });
});

// ====================================================================
// PLUGIN MARKETPLACE ROUTES
// ====================================================================

/**
 * Get all available plugins from marketplace
 */
router.get('/marketplace', requireAuth, async (req, res) => {
  try {
    const { category, neuronType, search, limit, offset } = req.query;
    
    const plugins = marketplace.getAvailablePlugins(
      category as string, 
      neuronType as string
    );

    // Apply search filter
    let filteredPlugins = plugins;
    if (search) {
      const searchTerm = (search as string).toLowerCase();
      filteredPlugins = plugins.filter(plugin => 
        plugin.name.toLowerCase().includes(searchTerm) ||
        plugin.description.toLowerCase().includes(searchTerm) ||
        plugin.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    // Apply pagination
    const limitNum = parseInt(limit as string) || 50;
    const offsetNum = parseInt(offset as string) || 0;
    const paginatedPlugins = filteredPlugins.slice(offsetNum, offsetNum + limitNum);

    res.json({
      success: true,
      data: {
        plugins: paginatedPlugins,
        total: filteredPlugins.length,
        limit: limitNum,
        offset: offsetNum
      }
    });

  } catch (error: any) {
    logger.error('Error getting marketplace plugins', { error, component: 'PluginAPI' });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get marketplace plugins' 
    });
  }
});

/**
 * Get plugin details by ID
 */
router.get('/marketplace/:pluginId', requireAuth, async (req, res) => {
  try {
    const { pluginId } = req.params;
    
    const plugin = marketplace.getPlugin(pluginId);
    if (!plugin) {
      return res.status(404).json({
        success: false,
        error: 'Plugin not found'
      });
    }

    // Get plugin analytics
    const analytics = await marketplace.getPluginAnalytics(pluginId);
    
    // Get plugin health
    const health = await marketplace.testPluginHealth(pluginId);

    res.json({
      success: true,
      data: {
        plugin,
        analytics,
        health
      }
    });

  } catch (error: any) {
    logger.error('Error getting plugin details', { error, component: 'PluginAPI' });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get plugin details' 
    });
  }
});

/**
 * Install plugin for neuron
 */
router.post('/install', requireAuth, async (req, res) => {
  try {
    const installRequest = z.object({
      pluginId: z.string(),
      neuronId: z.string(),
      configuration: z.object({}).optional()
    }).parse(req.body);

    const instanceId = await marketplace.installPlugin(
      installRequest.pluginId, 
      installRequest.neuronId, 
      installRequest.configuration || {}
    );

    // Trigger initial audit for new installation
    setTimeout(async () => {
      try {
        await integration.auditPlugin(installRequest.pluginId);
      } catch (error) {
        logger.error('Failed to audit newly installed plugin', { error, pluginId: installRequest.pluginId });
      }
    }, 5000); // Audit after 5 seconds

    res.json({
      success: true,
      data: { 
        instanceId, 
        pluginId: installRequest.pluginId, 
        neuronId: installRequest.neuronId 
      }
    });

  } catch (error: any) {
    logger.error('Error installing plugin', { error, component: 'PluginAPI' });
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to install plugin' 
    });
  }
});

/**
 * Uninstall plugin instance
 */
router.delete('/uninstall/:instanceId', requireAuth, async (req, res) => {
  try {
    const { instanceId } = req.params;
    
    const success = await marketplace.uninstallPlugin(instanceId);

    res.json({
      success,
      data: { uninstalled: success, instanceId }
    });

  } catch (error: any) {
    logger.error('Error uninstalling plugin', { error, component: 'PluginAPI' });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to uninstall plugin' 
    });
  }
});

/**
 * Execute plugin function
 */
router.post('/execute', requireAuth, async (req, res) => {
  try {
    const executeRequest = z.object({
      pluginId: z.string(),
      functionName: z.string(),
      input: z.any().optional(),
      options: z.object({
        timeout: z.number().optional(),
        priority: z.number().optional(),
        userId: z.string().optional(),
        sessionId: z.string().optional()
      }).optional()
    }).parse(req.body);

    const result = await marketplace.executePluginFunction(
      executeRequest.pluginId, 
      executeRequest.functionName, 
      executeRequest.input || {},
      executeRequest.options
    );

    res.json({
      success: true,
      data: { 
        result, 
        pluginId: executeRequest.pluginId, 
        functionName: executeRequest.functionName 
      }
    });

  } catch (error: any) {
    logger.error('Error executing plugin function', { error, component: 'PluginAPI' });
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to execute plugin function' 
    });
  }
});

/**
 * Get plugin instances for neuron
 */
router.get('/instances/:neuronId', requireAuth, async (req, res) => {
  try {
    const { neuronId } = req.params;
    
    const instances = marketplace.getPluginInstances(neuronId);

    res.json({
      success: true,
      data: { instances, count: instances.length }
    });

  } catch (error: any) {
    logger.error('Error getting plugin instances', { error, component: 'PluginAPI' });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get plugin instances' 
    });
  }
});

/**
 * Update plugin configuration
 */
router.put('/configure/:instanceId', requireAuth, async (req, res) => {
  try {
    const { instanceId } = req.params;
    const { configuration } = req.body;
    
    const success = await marketplace.updatePluginConfiguration(
      instanceId, 
      configuration
    );

    res.json({
      success,
      data: { updated: success, instanceId }
    });

  } catch (error: any) {
    logger.error('Error updating plugin configuration', { error, component: 'PluginAPI' });
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to update plugin configuration' 
    });
  }
});

/**
 * Get marketplace statistics
 */
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const stats = await marketplace.getMarketplaceStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error: any) {
    logger.error('Error getting marketplace stats', { error, component: 'PluginAPI' });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get marketplace stats' 
    });
  }
});

// ====================================================================
// MIGRATION-PROOF ENGINE ROUTES
// ====================================================================

/**
 * Get migration-proof system status
 */
router.get('/migration-proof/status', requireAuth, async (req, res) => {
  try {
    const status = await migrationEngine.getSystemStatus();

    res.json({
      success: true,
      data: status
    });

  } catch (error: any) {
    logger.error('Error getting migration-proof status', { error, component: 'PluginAPI' });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get migration-proof status' 
    });
  }
});

/**
 * Test migration readiness
 */
router.get('/migration-proof/readiness', requireAuth, async (req, res) => {
  try {
    const readiness = await migrationEngine.testMigrationReadiness();

    res.json({
      success: true,
      data: readiness
    });

  } catch (error: any) {
    logger.error('Error testing migration readiness', { error, component: 'PluginAPI' });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to test migration readiness' 
    });
  }
});

/**
 * Force emergency backup
 */
router.post('/migration-proof/backup', requireAuth, async (req, res) => {
  try {
    await migrationEngine.forceBackup();

    res.json({
      success: true,
      data: { message: 'Emergency backup created successfully' }
    });

  } catch (error: any) {
    logger.error('Error creating emergency backup', { error, component: 'PluginAPI' });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create emergency backup' 
    });
  }
});

// ====================================================================
// SELF-DEBUG INTEGRATION ROUTES
// ====================================================================

/**
 * Get integration status
 */
router.get('/self-debug/status', requireAuth, async (req, res) => {
  try {
    const status = await integration.getIntegrationStatus();

    res.json({
      success: true,
      data: status
    });

  } catch (error: any) {
    logger.error('Error getting integration status', { error, component: 'PluginAPI' });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get integration status' 
    });
  }
});

/**
 * Audit specific plugin
 */
router.post('/self-debug/audit/:pluginId', requireAuth, async (req, res) => {
  try {
    const { pluginId } = req.params;
    
    const auditResult = await integration.auditPlugin(pluginId);

    res.json({
      success: true,
      data: auditResult
    });

  } catch (error: any) {
    logger.error('Error auditing plugin', { error, component: 'PluginAPI' });
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to audit plugin' 
    });
  }
});

/**
 * Force audit all plugins
 */
router.post('/self-debug/audit-all', requireAuth, async (req, res) => {
  try {
    // Run audit asynchronously
    integration.forceAuditAllPlugins().catch(error => {
      logger.error('Force audit all plugins failed', { error });
    });

    res.json({
      success: true,
      data: { message: 'Audit initiated for all plugins' }
    });

  } catch (error: any) {
    logger.error('Error initiating audit for all plugins', { error, component: 'PluginAPI' });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to initiate audit for all plugins' 
    });
  }
});

/**
 * Get recent self-healing events
 */
router.get('/self-debug/healing-events', requireAuth, async (req, res) => {
  try {
    const { limit } = req.query;
    const limitNum = parseInt(limit as string) || 50;
    
    const events = integration.getRecentSelfHealingEvents(limitNum);

    res.json({
      success: true,
      data: { events, count: events.length }
    });

  } catch (error: any) {
    logger.error('Error getting self-healing events', { error, component: 'PluginAPI' });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get self-healing events' 
    });
  }
});

/**
 * Update integration configuration
 */
router.put('/self-debug/config', requireAuth, async (req, res) => {
  try {
    const configRequest = z.object({
      enableContinuousAudit: z.boolean().optional(),
      auditInterval: z.number().min(5).max(1440).optional(), // 5 minutes to 24 hours
      autoFixEnabled: z.boolean().optional(),
      criticalIssueThreshold: z.number().min(1).max(10).optional(),
      auditScope: z.enum(['all', 'active-only', 'critical-only']).optional(),
      notificationLevel: z.enum(['silent', 'warnings', 'all']).optional()
    }).parse(req.body);

    integration.updateConfig(configRequest);

    res.json({
      success: true,
      data: { message: 'Configuration updated successfully' }
    });

  } catch (error: any) {
    logger.error('Error updating integration config', { error, component: 'PluginAPI' });
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to update configuration' 
    });
  }
});

// ====================================================================
// PLUGIN HEALTH AND MANAGEMENT ROUTES
// ====================================================================

/**
 * Test plugin health
 */
router.get('/health/:pluginId', requireAuth, async (req, res) => {
  try {
    const { pluginId } = req.params;
    
    const health = await marketplace.testPluginHealth(pluginId);

    res.json({
      success: true,
      data: health
    });

  } catch (error: any) {
    logger.error('Error testing plugin health', { error, component: 'PluginAPI' });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to test plugin health' 
    });
  }
});

/**
 * Set plugin safe mode
 */
router.put('/safe-mode/:pluginId', requireAuth, async (req, res) => {
  try {
    const { pluginId } = req.params;
    const { enabled } = req.body;
    
    await marketplace.setPluginSafeMode(pluginId, Boolean(enabled));

    res.json({
      success: true,
      data: { pluginId, safeMode: Boolean(enabled) }
    });

  } catch (error: any) {
    logger.error('Error setting plugin safe mode', { error, component: 'PluginAPI' });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to set plugin safe mode' 
    });
  }
});

/**
 * Restart plugin
 */
router.post('/restart/:pluginId', requireAuth, async (req, res) => {
  try {
    const { pluginId } = req.params;
    
    await marketplace.stopPlugin(pluginId);
    await marketplace.startPlugin(pluginId);

    res.json({
      success: true,
      data: { pluginId, restarted: true }
    });

  } catch (error: any) {
    logger.error('Error restarting plugin', { error, component: 'PluginAPI' });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to restart plugin' 
    });
  }
});

/**
 * Repair plugin
 */
router.post('/repair/:pluginId', requireAuth, async (req, res) => {
  try {
    const { pluginId } = req.params;
    
    await marketplace.repairPlugin(pluginId);

    res.json({
      success: true,
      data: { pluginId, repaired: true }
    });

  } catch (error: any) {
    logger.error('Error repairing plugin', { error, component: 'PluginAPI' });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to repair plugin' 
    });
  }
});

/**
 * Clear plugin cache
 */
router.delete('/cache/:pluginId', requireAuth, async (req, res) => {
  try {
    const { pluginId } = req.params;
    
    await marketplace.clearPluginCache(pluginId);

    res.json({
      success: true,
      data: { pluginId, cacheCleared: true }
    });

  } catch (error: any) {
    logger.error('Error clearing plugin cache', { error, component: 'PluginAPI' });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to clear plugin cache' 
    });
  }
});

/**
 * Validate plugin integrity
 */
router.get('/integrity/:pluginId', requireAuth, async (req, res) => {
  try {
    const { pluginId } = req.params;
    
    const integrity = await marketplace.validatePluginIntegrity(pluginId);

    res.json({
      success: true,
      data: integrity
    });

  } catch (error: any) {
    logger.error('Error validating plugin integrity', { error, component: 'PluginAPI' });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to validate plugin integrity' 
    });
  }
});

// ====================================================================
// MAINTENANCE AND MONITORING ROUTES
// ====================================================================

/**
 * Perform marketplace maintenance
 */
router.post('/maintenance', requireAuth, async (req, res) => {
  try {
    const maintenanceResult = await marketplace.performMaintenance();

    res.json({
      success: true,
      data: maintenanceResult
    });

  } catch (error: any) {
    logger.error('Error performing maintenance', { error, component: 'PluginAPI' });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to perform maintenance' 
    });
  }
});

/**
 * Get overall plugin ecosystem health
 */
router.get('/ecosystem/health', requireAuth, async (req, res) => {
  try {
    const marketplaceStats = await marketplace.getMarketplaceStats();
    const migrationStatus = await migrationEngine.getSystemStatus();
    const integrationStatus = await integration.getIntegrationStatus();

    const ecosystemHealth = {
      marketplace: {
        totalPlugins: marketplaceStats.totalPlugins,
        totalInstances: marketplaceStats.totalInstances,
        healthSummary: marketplaceStats.healthSummary
      },
      migration: {
        isEmergencyMode: migrationStatus.isEmergencyMode,
        migrationSafety: migrationStatus.migrationSafety,
        backupCount: migrationStatus.backupCount
      },
      integration: {
        continuousAuditEnabled: integrationStatus.continuousAuditEnabled,
        selfHealingEvents: integrationStatus.selfHealingEvents,
        pluginHealthSummary: integrationStatus.pluginHealthSummary
      },
      timestamp: new Date()
    };

    res.json({
      success: true,
      data: ecosystemHealth
    });

  } catch (error: any) {
    logger.error('Error getting ecosystem health', { error, component: 'PluginAPI' });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get ecosystem health' 
    });
  }
});

/**
 * Export plugin data
 */
router.get('/export', requireAuth, async (req, res) => {
  try {
    const { format } = req.query;
    
    const marketplaceStats = await marketplace.getMarketplaceStats();
    const integrationStatus = await integration.getIntegrationStatus();
    
    const exportData = {
      timestamp: new Date(),
      marketplace: marketplaceStats,
      integration: integrationStatus,
      plugins: marketplace.getAvailablePlugins(),
      healingEvents: integration.getRecentSelfHealingEvents(1000)
    };

    if (format === 'csv') {
      // Convert to CSV format (simplified)
      const csv = [
        'Plugin ID,Name,Category,Status,Health Score,Last Audit',
        ...integrationStatus.pluginHealthSummary.map((plugin: any) =>
          `${plugin.pluginId},${plugin.pluginId},Unknown,${plugin.status},${plugin.healthScore},${plugin.lastCheck}`
        )
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=plugin-data.csv');
      res.send(csv);
    } else {
      res.json({
        success: true,
        data: exportData
      });
    }

  } catch (error: any) {
    logger.error('Error exporting plugin data', { error, component: 'PluginAPI' });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to export plugin data' 
    });
  }
});

export default router;