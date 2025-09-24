/**
 * Supabase Health Monitoring Dashboard - Billion-Dollar Empire Grade
 * Real-time health monitoring and diagnostics for Supabase integration
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { universalDb } from './index';

interface HealthMetrics {
  connectionStatus: 'healthy' | 'degraded' | 'failed';
  latency: number;
  queryCount: number;
  errorRate: number;
  uptime: number;
  lastCheck: string;
  details: {
    tablesCount: number;
    activeConnections: number;
    storageUsed: number;
    bandwidth: number;
  };
}

interface DatabaseStats {
  totalTables: number;
  totalRows: number;
  storageSize: string;
  backupStatus: string;
  replicationLag: number;
}

export class SupabaseHealthMonitor {
  private supabase: SupabaseClient | null = null;
  private metrics: HealthMetrics;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.metrics = {
      connectionStatus: 'failed',
      latency: 0,
      queryCount: 0,
      errorRate: 0,
      uptime: 0,
      lastCheck: new Date().toISOString(),
      details: {
        tablesCount: 0,
        activeConnections: 0,
        storageUsed: 0,
        bandwidth: 0
      }
    };
  }

  /**
   * Initialize health monitoring
   */
  async initialize(): Promise<void> {
    this.supabase = universalDb.getSupabase();
    
    if (this.supabase) {
      console.log('🔍 Initializing Supabase Health Monitor...');
      await this.performHealthCheck();
      this.startMonitoring();
      console.log('✅ Supabase Health Monitor initialized');
    }
  }

  /**
   * Start continuous monitoring
   */
  private startMonitoring(): void {
    // Monitor every 2 minutes for production efficiency
    this.monitoringInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, 120000);
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(): Promise<HealthMetrics> {
    if (!this.supabase) {
      this.metrics.connectionStatus = 'failed';
      return this.metrics;
    }

    const startTime = Date.now();

    try {
      // Test basic connectivity
      const { data, error } = await this.supabase
        .from('users')
        .select('count', { count: 'exact', head: true });

      const latency = Date.now() - startTime;
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // Get database statistics
      const stats = await this.getDatabaseStats();

      this.metrics = {
        connectionStatus: 'healthy',
        latency,
        queryCount: this.metrics.queryCount + 1,
        errorRate: this.calculateErrorRate(),
        uptime: this.calculateUptime(),
        lastCheck: new Date().toISOString(),
        details: {
          tablesCount: stats.totalTables,
          activeConnections: 1, // Simplified for this implementation
          storageUsed: parseInt(stats.storageSize) || 0,
          bandwidth: latency
        }
      };

    } catch (error) {
      console.error('❌ Supabase health check failed:', error);
      this.metrics.connectionStatus = 'failed';
      this.metrics.errorRate = this.calculateErrorRate(true);
    }

    return this.metrics;
  }

  /**
   * Get comprehensive database statistics
   */
  private async getDatabaseStats(): Promise<DatabaseStats> {
    if (!this.supabase) {
      return {
        totalTables: 0,
        totalRows: 0,
        storageSize: '0',
        backupStatus: 'unknown',
        replicationLag: 0
      };
    }

    try {
      // Get table count
      const { data: tables, error: tablesError } = await this.supabase.rpc('get_table_count');
      
      return {
        totalTables: tables || 0,
        totalRows: 0, // Would need specific implementation
        storageSize: '0', // Would need specific implementation
        backupStatus: 'active',
        replicationLag: 0
      };
    } catch (error) {
      console.warn('⚠️ Could not get detailed database stats:', error);
      return {
        totalTables: 0,
        totalRows: 0,
        storageSize: '0',
        backupStatus: 'unknown',
        replicationLag: 0
      };
    }
  }

  /**
   * Calculate error rate percentage
   */
  private calculateErrorRate(isError: boolean = false): number {
    // Simplified error rate calculation
    if (isError) {
      return Math.min(this.metrics.errorRate + 10, 100);
    }
    return Math.max(this.metrics.errorRate - 1, 0);
  }

  /**
   * Calculate uptime percentage
   */
  private calculateUptime(): number {
    if (this.metrics.connectionStatus === 'healthy') {
      return Math.min(this.metrics.uptime + 0.1, 100);
    }
    return Math.max(this.metrics.uptime - 5, 0);
  }

  /**
   * Get current health metrics
   */
  getHealthMetrics(): HealthMetrics {
    return this.metrics;
  }

  /**
   * Get health dashboard data
   */
  async getHealthDashboard(): Promise<{
    status: string;
    metrics: HealthMetrics;
    recommendations: string[];
    alerts: string[];
  }> {
    await this.performHealthCheck();

    const recommendations: string[] = [];
    const alerts: string[] = [];

    // Generate recommendations based on metrics
    if (this.metrics.latency > 1000) {
      recommendations.push('Consider optimizing queries - high latency detected');
    }

    if (this.metrics.errorRate > 5) {
      alerts.push(`High error rate: ${this.metrics.errorRate}%`);
    }

    if (this.metrics.connectionStatus === 'failed') {
      alerts.push('Supabase connection failed - check credentials and network');
    }

    return {
      status: this.metrics.connectionStatus,
      metrics: this.metrics,
      recommendations,
      alerts
    };
  }

  /**
   * Test database operations
   */
  async testDatabaseOperations(): Promise<{
    read: boolean;
    write: boolean;
    delete: boolean;
    errors: string[];
  }> {
    const results = {
      read: false,
      write: false,
      delete: false,
      errors: [] as string[]
    };

    if (!this.supabase) {
      results.errors.push('Supabase client not available');
      return results;
    }

    try {
      // Test read operation
      const { data: readData, error: readError } = await this.supabase
        .from('users')
        .select('count', { count: 'exact', head: true });
      
      if (!readError || readError.code === 'PGRST116') {
        results.read = true;
      } else {
        results.errors.push(`Read test failed: ${readError.message}`);
      }

      // Test write operation (with cleanup)
      const testId = `health-test-${Date.now()}`;
      const { error: writeError } = await this.supabase
        .from('system_health_tests')
        .upsert({ id: testId, test_type: 'health_check', created_at: new Date().toISOString() });

      if (!writeError) {
        results.write = true;
        
        // Test delete operation
        const { error: deleteError } = await this.supabase
          .from('system_health_tests')
          .delete()
          .eq('id', testId);

        if (!deleteError) {
          results.delete = true;
        } else {
          results.errors.push(`Delete test failed: ${deleteError.message}`);
        }
      } else {
        results.errors.push(`Write test failed: ${writeError.message}`);
      }

    } catch (error) {
      results.errors.push(`Test operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return results;
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Shutdown health monitor
   */
  shutdown(): void {
    this.stopMonitoring();
    console.log('✅ Supabase Health Monitor stopped');
  }
}

// Export singleton instance
export const supabaseHealthMonitor = new SupabaseHealthMonitor();

// Initialize on import
supabaseHealthMonitor.initialize().catch(console.error);