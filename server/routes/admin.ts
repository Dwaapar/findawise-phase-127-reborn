/**
 * EMPIRE-GRADE ADMIN DASHBOARD ROUTES
 * ==================================
 * 
 * Complete admin dashboard API endpoints for managing the
 * Findawise Empire database infrastructure.
 */

import { Router } from 'express';
import { databaseHealthMonitor } from '../db/health-monitor';
import { backupRestoreSystem } from '../db/backup-restore-system';
import { supabaseManager } from '../config/supabase-config';

const router = Router();

// Database Health Monitoring Routes
router.get('/api/admin/db-health', async (req, res) => {
  try {
    const healthMetrics = await databaseHealthMonitor.getHealthMetrics();
    res.json({
      success: true,
      data: healthMetrics
    });
  } catch (error) {
    console.error('Failed to get database health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve database health metrics'
    });
  }
});

router.get('/api/admin/db-health/tables', async (req, res) => {
  try {
    const tableHealth = await databaseHealthMonitor.getTableHealthInfo();
    res.json({
      success: true,
      data: tableHealth
    });
  } catch (error) {
    console.error('Failed to get table health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve table health information'
    });
  }
});

router.post('/api/admin/db-health/maintenance', async (req, res) => {
  try {
    const result = await databaseHealthMonitor.performMaintenance();
    res.json({
      success: result.success,
      data: result
    });
  } catch (error) {
    console.error('Failed to perform maintenance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform database maintenance'
    });
  }
});

// Backup & Restore Routes
router.get('/api/admin/backups', async (req, res) => {
  try {
    const backups = await backupRestoreSystem.getBackupHistory();
    res.json({
      success: true,
      data: backups
    });
  } catch (error) {
    console.error('Failed to get backup history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve backup history'
    });
  }
});

router.post('/api/admin/backups/create', async (req, res) => {
  try {
    const { type = 'manual' } = req.body;
    const backup = await backupRestoreSystem.createBackup(type);
    res.json({
      success: true,
      data: backup
    });
  } catch (error) {
    console.error('Failed to create backup:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create backup'
    });
  }
});

router.post('/api/admin/backups/restore', async (req, res) => {
  try {
    const options = req.body;
    const result = await backupRestoreSystem.restoreBackup(options);
    res.json({
      success: result.success,
      message: result.message
    });
  } catch (error) {
    console.error('Failed to restore backup:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to restore backup'
    });
  }
});

router.get('/api/admin/backups/status', async (req, res) => {
  try {
    const status = await backupRestoreSystem.getSystemStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Failed to get backup system status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve backup system status'
    });
  }
});

// Supabase Configuration Routes
router.get('/api/admin/supabase/status', async (req, res) => {
  try {
    const healthCheck = await supabaseManager.healthCheck();
    res.json({
      success: true,
      data: healthCheck
    });
  } catch (error) {
    console.error('Failed to get Supabase status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve Supabase status'
    });
  }
});

router.get('/api/admin/supabase/config', async (req, res) => {
  try {
    const config = supabaseManager.getConfig();
    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Supabase configuration not found'
      });
    }

    // Return safe config (without sensitive keys)
    const safeConfig = {
      projectRef: config.projectRef,
      region: config.region,
      url: config.url.replace(/[^/]*$/g, '***'), // Mask URL
      isConfigured: true
    };

    res.json({
      success: true,
      data: safeConfig
    });
  } catch (error) {
    console.error('Failed to get Supabase config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve Supabase configuration'
    });
  }
});

router.post('/api/admin/supabase/test-connection', async (req, res) => {
  try {
    const result = await supabaseManager.validateConnection();
    res.json({
      success: result.success,
      error: result.error
    });
  } catch (error) {
    console.error('Failed to test Supabase connection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test Supabase connection'
    });
  }
});

// System Overview Routes
router.get('/api/admin/system/overview', async (req, res) => {
  try {
    const [dbHealth, backupStatus, supabaseHealth] = await Promise.all([
      databaseHealthMonitor.getHealthMetrics(),
      backupRestoreSystem.getSystemStatus(),
      supabaseManager.healthCheck()
    ]);

    const overview = {
      database: {
        status: dbHealth.overall,
        tables: dbHealth.storage.tableCount,
        uptime: dbHealth.uptime,
        alerts: dbHealth.alerts.length
      },
      backup: {
        status: backupStatus.isHealthy ? 'healthy' : 'unhealthy',
        totalBackups: backupStatus.totalBackups,
        latestBackup: backupStatus.latestBackup?.timestamp || null,
        diskUsage: backupStatus.diskUsage
      },
      supabase: {
        status: supabaseHealth.status,
        configured: !!supabaseManager.getConfig()
      },
      timestamp: new Date()
    };

    res.json({
      success: true,
      data: overview
    });
  } catch (error) {
    console.error('Failed to get system overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve system overview'
    });
  }
});

export default router;