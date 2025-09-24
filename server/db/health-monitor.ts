/**
 * EMPIRE-GRADE DATABASE HEALTH MONITOR
 * ===================================
 * 
 * Comprehensive database health monitoring system with real-time
 * diagnostics, automated healing, and enterprise-grade reporting.
 */

import { db } from './index';
import { sql } from 'drizzle-orm';

export interface DatabaseHealthMetrics {
  overall: 'healthy' | 'degraded' | 'critical';
  uptime: number;
  connections: {
    active: number;
    idle: number;
    total: number;
    max: number;
  };
  performance: {
    avgQueryTime: number;
    slowQueries: number;
    cacheHitRate: number;
    totalQueries: number;
  };
  storage: {
    totalSize: string;
    indexSize: string;
    availableSpace: string;
    tableCount: number;
  };
  replication: {
    status: 'up' | 'down' | 'lagging';
    lag: number;
  };
  alerts: Array<{
    level: 'info' | 'warning' | 'critical';
    message: string;
    timestamp: Date;
  }>;
  timestamp: Date;
}

export interface TableHealthInfo {
  name: string;
  rows: number;
  size: string;
  indexCount: number;
  lastVacuum: Date | null;
  lastAnalyze: Date | null;
  health: 'healthy' | 'needs_maintenance' | 'critical';
}

export class DatabaseHealthMonitor {
  private static instance: DatabaseHealthMonitor;
  private healthCache: Map<string, any> = new Map();
  private alertThresholds = {
    connections: { warning: 80, critical: 95 },
    queryTime: { warning: 1000, critical: 5000 },
    cacheHit: { warning: 0.8, critical: 0.6 },
    diskUsage: { warning: 85, critical: 95 }
  };

  static getInstance(): DatabaseHealthMonitor {
    if (!DatabaseHealthMonitor.instance) {
      DatabaseHealthMonitor.instance = new DatabaseHealthMonitor();
    }
    return DatabaseHealthMonitor.instance;
  }

  /**
   * Get comprehensive database health metrics
   */
  async getHealthMetrics(): Promise<DatabaseHealthMetrics> {
    try {
      const [
        connectionMetrics,
        performanceMetrics,
        storageMetrics,
        replicationStatus
      ] = await Promise.all([
        this.getConnectionMetrics(),
        this.getPerformanceMetrics(),
        this.getStorageMetrics(),
        this.getReplicationStatus()
      ]);

      const alerts = await this.generateHealthAlerts({
        connections: connectionMetrics,
        performance: performanceMetrics,
        storage: storageMetrics
      });

      const overall = this.calculateOverallHealth(alerts);

      const metrics: DatabaseHealthMetrics = {
        overall,
        uptime: await this.getDatabaseUptime(),
        connections: connectionMetrics,
        performance: performanceMetrics,
        storage: storageMetrics,
        replication: replicationStatus,
        alerts,
        timestamp: new Date()
      };

      // Cache for 30 seconds
      this.healthCache.set('health_metrics', {
        data: metrics,
        timestamp: Date.now()
      });

      return metrics;
    } catch (error) {
      console.error('Failed to get database health metrics:', error);
      return this.getFailsafeMetrics();
    }
  }

  /**
   * Get connection metrics
   */
  private async getConnectionMetrics(): Promise<DatabaseHealthMetrics['connections']> {
    try {
      const result = await db.execute(sql`
        SELECT 
          count(*) as total,
          count(*) FILTER (WHERE state = 'active') as active,
          count(*) FILTER (WHERE state = 'idle') as idle
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `);

      const stats = result[0] || { total: 0, active: 0, idle: 0 };
      
      return {
        active: Number(stats.active) || 0,
        idle: Number(stats.idle) || 0,
        total: Number(stats.total) || 0,
        max: 100 // PostgreSQL default
      };
    } catch (error) {
      console.error('Failed to get connection metrics:', error);
      return { active: 0, idle: 0, total: 0, max: 100 };
    }
  }

  /**
   * Get performance metrics
   */
  private async getPerformanceMetrics(): Promise<DatabaseHealthMetrics['performance']> {
    try {
      const [queryStats, cacheStats] = await Promise.all([
        db.execute(sql`
          SELECT 
            COALESCE(AVG(mean_exec_time), 0) as avg_query_time,
            COUNT(*) FILTER (WHERE mean_exec_time > 1000) as slow_queries,
            SUM(calls) as total_queries
          FROM pg_stat_statements 
          WHERE queryid IS NOT NULL
        `),
        db.execute(sql`
          SELECT 
            CASE 
              WHEN (blks_hit + blks_read) = 0 THEN 1.0
              ELSE blks_hit::float / (blks_hit + blks_read)
            END as cache_hit_rate
          FROM pg_stat_database 
          WHERE datname = current_database()
        `)
      ]);

      const queryMetrics = queryStats[0] || {};
      const cacheMetrics = cacheStats[0] || {};

      return {
        avgQueryTime: Number(queryMetrics.avg_query_time) || 0,
        slowQueries: Number(queryMetrics.slow_queries) || 0,
        totalQueries: Number(queryMetrics.total_queries) || 0,
        cacheHitRate: Number(cacheMetrics.cache_hit_rate) || 1.0
      };
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      return {
        avgQueryTime: 0,
        slowQueries: 0,
        totalQueries: 0,
        cacheHitRate: 1.0
      };
    }
  }

  /**
   * Get storage metrics
   */
  private async getStorageMetrics(): Promise<DatabaseHealthMetrics['storage']> {
    try {
      const result = await db.execute(sql`
        SELECT 
          pg_size_pretty(pg_database_size(current_database())) as total_size,
          (SELECT pg_size_pretty(SUM(pg_total_relation_size(indexrelid))) 
           FROM pg_index) as index_size,
          (SELECT COUNT(*) FROM information_schema.tables 
           WHERE table_schema = 'public') as table_count
      `);

      const metrics = result[0] || {};

      return {
        totalSize: String(metrics.total_size) || '0 bytes',
        indexSize: String(metrics.index_size) || '0 bytes',
        availableSpace: 'Unknown', // Would need system-level access
        tableCount: Number(metrics.table_count) || 0
      };
    } catch (error) {
      console.error('Failed to get storage metrics:', error);
      return {
        totalSize: '0 bytes',
        indexSize: '0 bytes',
        availableSpace: 'Unknown',
        tableCount: 0
      };
    }
  }

  /**
   * Get replication status
   */
  private async getReplicationStatus(): Promise<DatabaseHealthMetrics['replication']> {
    try {
      const result = await db.execute(sql`
        SELECT 
          CASE 
            WHEN COUNT(*) > 0 THEN 'up'
            ELSE 'down'
          END as status,
          COALESCE(MAX(EXTRACT(EPOCH FROM replay_lag)), 0) as lag
        FROM pg_stat_replication
      `);

      const replication = result[0] || {};

      return {
        status: String(replication.status) === 'up' ? 'up' : 'down',
        lag: Number(replication.lag) || 0
      };
    } catch (error) {
      // Single database setup - no replication
      return {
        status: 'up',
        lag: 0
      };
    }
  }

  /**
   * Get database uptime in seconds
   */
  private async getDatabaseUptime(): Promise<number> {
    try {
      const result = await db.execute(sql`
        SELECT EXTRACT(EPOCH FROM (now() - pg_postmaster_start_time())) as uptime
      `);
      return Number(result[0]?.uptime) || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Generate health alerts based on metrics
   */
  private async generateHealthAlerts(metrics: any): Promise<DatabaseHealthMetrics['alerts']> {
    const alerts: DatabaseHealthMetrics['alerts'] = [];

    // Connection alerts
    const connectionUsage = (metrics.connections.total / metrics.connections.max) * 100;
    if (connectionUsage > this.alertThresholds.connections.critical) {
      alerts.push({
        level: 'critical',
        message: `Critical: Database connections at ${connectionUsage.toFixed(1)}%`,
        timestamp: new Date()
      });
    } else if (connectionUsage > this.alertThresholds.connections.warning) {
      alerts.push({
        level: 'warning',
        message: `Warning: Database connections at ${connectionUsage.toFixed(1)}%`,
        timestamp: new Date()
      });
    }

    // Performance alerts
    if (metrics.performance.avgQueryTime > this.alertThresholds.queryTime.critical) {
      alerts.push({
        level: 'critical',
        message: `Critical: Average query time ${metrics.performance.avgQueryTime.toFixed(1)}ms`,
        timestamp: new Date()
      });
    } else if (metrics.performance.avgQueryTime > this.alertThresholds.queryTime.warning) {
      alerts.push({
        level: 'warning',
        message: `Warning: Average query time ${metrics.performance.avgQueryTime.toFixed(1)}ms`,
        timestamp: new Date()
      });
    }

    // Cache hit rate alerts
    if (metrics.performance.cacheHitRate < this.alertThresholds.cacheHit.critical) {
      alerts.push({
        level: 'critical',
        message: `Critical: Cache hit rate ${(metrics.performance.cacheHitRate * 100).toFixed(1)}%`,
        timestamp: new Date()
      });
    } else if (metrics.performance.cacheHitRate < this.alertThresholds.cacheHit.warning) {
      alerts.push({
        level: 'warning',
        message: `Warning: Cache hit rate ${(metrics.performance.cacheHitRate * 100).toFixed(1)}%`,
        timestamp: new Date()
      });
    }

    return alerts;
  }

  /**
   * Calculate overall health status
   */
  private calculateOverallHealth(alerts: DatabaseHealthMetrics['alerts']): 'healthy' | 'degraded' | 'critical' {
    const criticalAlerts = alerts.filter(alert => alert.level === 'critical');
    const warningAlerts = alerts.filter(alert => alert.level === 'warning');

    if (criticalAlerts.length > 0) {
      return 'critical';
    } else if (warningAlerts.length > 0) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }

  /**
   * Get failsafe metrics when health check fails
   */
  private getFailsafeMetrics(): DatabaseHealthMetrics {
    return {
      overall: 'critical',
      uptime: 0,
      connections: { active: 0, idle: 0, total: 0, max: 100 },
      performance: { avgQueryTime: 0, slowQueries: 0, cacheHitRate: 0, totalQueries: 0 },
      storage: { totalSize: '0 bytes', indexSize: '0 bytes', availableSpace: 'Unknown', tableCount: 0 },
      replication: { status: 'down', lag: 0 },
      alerts: [{
        level: 'critical',
        message: 'Database health check failed - system may be unavailable',
        timestamp: new Date()
      }],
      timestamp: new Date()
    };
  }

  /**
   * Get detailed table health information
   */
  async getTableHealthInfo(): Promise<TableHealthInfo[]> {
    try {
      const result = await db.execute(sql`
        WITH table_stats AS (
          SELECT 
            schemaname,
            tablename,
            n_tup_ins + n_tup_upd + n_tup_del as total_writes,
            n_tup_ins,
            n_tup_upd,
            n_tup_del,
            seq_scan,
            seq_tup_read,
            idx_scan,
            idx_tup_fetch,
            last_vacuum,
            last_autovacuum,
            last_analyze,
            last_autoanalyze
          FROM pg_stat_user_tables
        ),
        table_sizes AS (
          SELECT 
            schemaname,
            tablename,
            pg_total_relation_size(schemaname||'.'||tablename) as total_size,
            pg_relation_size(schemaname||'.'||tablename) as table_size
          FROM pg_tables
          WHERE schemaname = 'public'
        ),
        index_counts AS (
          SELECT 
            schemaname,
            tablename,
            COUNT(*) as index_count
          FROM pg_indexes
          WHERE schemaname = 'public'
          GROUP BY schemaname, tablename
        )
        SELECT 
          ts.tablename as name,
          COALESCE(sz.total_size, 0) as total_size,
          COALESCE(ic.index_count, 0) as index_count,
          ts.last_vacuum,
          ts.last_analyze,
          CASE 
            WHEN ts.seq_scan > ts.idx_scan * 10 AND ts.seq_tup_read > 10000 THEN 'needs_maintenance'
            WHEN ts.last_vacuum < NOW() - INTERVAL '7 days' THEN 'needs_maintenance'
            WHEN sz.total_size > 1073741824 AND ts.last_analyze < NOW() - INTERVAL '1 day' THEN 'needs_maintenance'
            ELSE 'healthy'
          END as health
        FROM table_stats ts
        LEFT JOIN table_sizes sz ON ts.schemaname = sz.schemaname AND ts.tablename = sz.tablename
        LEFT JOIN index_counts ic ON ts.schemaname = ic.schemaname AND ts.tablename = ic.tablename
        ORDER BY sz.total_size DESC NULLS LAST
      `);

      return result.map((row: any) => ({
        name: String(row.name),
        rows: 0, // Would need additional query
        size: this.formatBytes(Number(row.total_size) || 0),
        indexCount: Number(row.index_count) || 0,
        lastVacuum: row.last_vacuum ? new Date(row.last_vacuum) : null,
        lastAnalyze: row.last_analyze ? new Date(row.last_analyze) : null,
        health: String(row.health) as 'healthy' | 'needs_maintenance' | 'critical'
      }));
    } catch (error) {
      console.error('Failed to get table health info:', error);
      return [];
    }
  }

  /**
   * Format bytes to human readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 bytes';
    const k = 1024;
    const sizes = ['bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Execute database maintenance
   */
  async performMaintenance(): Promise<{ success: boolean; operations: string[] }> {
    try {
      const operations: string[] = [];

      // Get tables that need maintenance
      const tables = await this.getTableHealthInfo();
      const tablesNeedingMaintenance = tables.filter(t => t.health === 'needs_maintenance');

      for (const table of tablesNeedingMaintenance) {
        try {
          // Vacuum analyze for tables that need it
          await db.execute(sql.raw(`VACUUM ANALYZE ${table.name}`));
          operations.push(`Vacuumed and analyzed table: ${table.name}`);
        } catch (error) {
          console.error(`Failed to maintain table ${table.name}:`, error);
          operations.push(`Failed to maintain table: ${table.name}`);
        }
      }

      // Update statistics
      await db.execute(sql`ANALYZE`);
      operations.push('Updated database statistics');

      return { success: true, operations };
    } catch (error) {
      console.error('Database maintenance failed:', error);
      return { success: false, operations: ['Maintenance failed'] };
    }
  }
}

export const databaseHealthMonitor = DatabaseHealthMonitor.getInstance();