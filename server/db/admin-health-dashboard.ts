/**
 * Admin Health Dashboard API - Billion-Dollar Empire Grade
 * Real-time database health monitoring endpoints for the admin dashboard
 */

import { Router } from 'express';
import { universalDb } from './index';
import { supabaseHealthMonitor } from './supabase-health-monitor';

const router = Router();

/**
 * GET /admin/db-health - Get comprehensive database health status
 */
router.get('/admin/db-health', async (req, res) => {
  try {
    const universalHealth = await universalDb.healthCheck();
    const supabaseHealth = await supabaseHealthMonitor.getHealthDashboard();

    const healthData = {
      timestamp: new Date().toISOString(),
      overall_status: universalHealth.isHealthy && supabaseHealth.status === 'healthy' ? 'healthy' : 'degraded',
      databases: {
        postgresql: {
          status: universalHealth.errors.some(e => e.includes('PostgreSQL')) ? 'failed' : 'healthy',
          latency: universalHealth.latency,
          connection_type: universalHealth.connectionType,
          last_check: universalHealth.lastCheck
        },
        supabase: {
          status: supabaseHealth.status,
          metrics: supabaseHealth.metrics,
          alerts: supabaseHealth.alerts,
          recommendations: supabaseHealth.recommendations
        }
      },
      universal_adapter: {
        active_connection: universalHealth.connectionType,
        failover_enabled: true,
        health_monitoring: true,
        uptime_percentage: supabaseHealth.metrics.uptime
      }
    };

    res.json({
      success: true,
      data: healthData
    });

  } catch (error) {
    console.error('Health dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get health status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /admin/db-health/test - Test database operations
 */
router.post('/admin/db-health/test', async (req, res) => {
  try {
    const testResults = await supabaseHealthMonitor.testDatabaseOperations();
    
    res.json({
      success: true,
      data: {
        test_completed: new Date().toISOString(),
        results: testResults,
        overall_status: testResults.errors.length === 0 ? 'passed' : 'failed'
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Database test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /admin/db-health/metrics - Get detailed performance metrics
 */
router.get('/admin/db-health/metrics', async (req, res) => {
  try {
    const metrics = supabaseHealthMonitor.getHealthMetrics();
    const universalStatus = universalDb.getHealthStatus();

    res.json({
      success: true,
      data: {
        current_metrics: metrics,
        universal_adapter: universalStatus,
        performance: {
          avg_query_time: metrics.latency,
          error_rate: metrics.errorRate,
          uptime: metrics.uptime,
          connection_health: universalStatus.isHealthy
        },
        recommendations: metrics.latency > 1000 ? [
          'Consider optimizing database queries',
          'Review connection pooling settings',
          'Check network latency to database'
        ] : [
          'Database performance is optimal'
        ]
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /admin/db-health/force-migration - Force run Supabase migrations
 */
router.post('/admin/db-health/force-migration', async (req, res) => {
  try {
    const supabase = universalDb.getSupabase();
    
    if (!supabase) {
      return res.status(400).json({
        success: false,
        error: 'Supabase not available for migration'
      });
    }

    const { SupabaseMigrationEngine } = await import('./supabase-migrations');
    const migrationEngine = new SupabaseMigrationEngine();
    
    await migrationEngine.runMigrations(supabase);

    res.json({
      success: true,
      data: {
        migration_completed: new Date().toISOString(),
        status: 'Migration executed successfully'
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as dbHealthRoutes };