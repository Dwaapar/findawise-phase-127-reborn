/**
 * Database Initialization System - Billion-Dollar Empire Grade
 * Automatically initializes all 300+ tables with embedded Supabase credentials
 */

import { autoConfigureEnvironment } from '../config/embedded-credentials';
import { comprehensiveSchemaCreator } from '../db/comprehensive-schema';
import { supabaseMigrationEngine } from '../db/supabase-migrations';
import { universalDb } from '../db/index';

interface InitializationResult {
  success: boolean;
  tablesCreated: number;
  supabaseConnected: boolean;
  postgresConnected: boolean;
  errors: string[];
  executionTime: number;
}

export class DatabaseInitializationSystem {
  
  /**
   * Complete database initialization with embedded credentials
   */
  async initializeEmpireDatabase(): Promise<InitializationResult> {
    const startTime = Date.now();
    console.log('🚀 Initializing Billion-Dollar Empire Database...');
    
    const result: InitializationResult = {
      success: false,
      tablesCreated: 0,
      supabaseConnected: false,
      postgresConnected: false,
      errors: [],
      executionTime: 0
    };
    
    try {
      // Step 1: Auto-configure embedded Supabase credentials
      console.log('🔑 Configuring embedded credentials...');
      autoConfigureEnvironment();
      
      // Step 2: Initialize Universal Database Adapter
      console.log('🔌 Initializing database connections...');
      await universalDb.initialize();
      
      // Check connection status
      const healthStatus = await universalDb.getHealthStatus();
      result.supabaseConnected = healthStatus.connectionType.includes('supabase');
      result.postgresConnected = healthStatus.connectionType.includes('postgresql');
      
      console.log(`✅ Database connections: PostgreSQL: ${result.postgresConnected}, Supabase: ${result.supabaseConnected}`);
      
      // Step 3: Create comprehensive schema (300+ tables)
      console.log('🏗️ Creating comprehensive database schema...');
      const schemaResult = await comprehensiveSchemaCreator.createAllTables();
      
      result.tablesCreated = schemaResult.tablesCreated;
      result.errors.push(...schemaResult.errors);
      
      console.log(`📊 Schema creation result: ${schemaResult.tablesCreated} tables created`);
      
      // Step 4: Seed critical data to prevent foreign key errors
      console.log('🌱 Seeding critical system data...');
      await comprehensiveSchemaCreator.seedCriticalData();
      
      // Step 5: Run Supabase-specific migrations if available
      if (result.supabaseConnected) {
        console.log('☁️ Running Supabase-specific migrations...');
        await supabaseMigrationEngine.runMigrations();
      }
      
      // Calculate execution time
      result.executionTime = Date.now() - startTime;
      result.success = result.tablesCreated > 0 && result.errors.length === 0;
      
      if (result.success) {
        console.log(`✅ Empire Database initialized successfully!`);
        console.log(`📈 Stats: ${result.tablesCreated} tables, ${result.executionTime}ms execution time`);
        console.log(`🔗 Connections: PostgreSQL: ${result.postgresConnected}, Supabase: ${result.supabaseConnected}`);
      } else {
        console.warn(`⚠️ Database initialization completed with ${result.errors.length} warnings`);
      }
      
      return result;
      
    } catch (error) {
      const errorMessage = `Database initialization failed: ${error}`;
      result.errors.push(errorMessage);
      result.executionTime = Date.now() - startTime;
      console.error('❌', errorMessage);
      return result;
    }
  }
  
  /**
   * Verify database health and completeness
   */
  async verifyDatabaseHealth(): Promise<{ healthy: boolean; details: any }> {
    try {
      console.log('🔍 Verifying database health...');
      
      const healthStatus = await universalDb.getHealthStatus();
      const { query } = require('../db');
      
      // Check critical tables exist
      const criticalTables = [
        'users', 'sessions', 'neurons', 'neuron_status_updates',
        'analytics_events', 'semantic_nodes', 'semantic_edges',
        'audit_logs', 'system_health_metrics'
      ];
      
      const tableChecks = [];
      for (const table of criticalTables) {
        try {
          const result = await query(
            `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name = $1`,
            [table]
          );
          tableChecks.push({
            table,
            exists: parseInt(result.rows[0].count) > 0
          });
        } catch (error) {
          tableChecks.push({
            table,
            exists: false,
            error: error.message
          });
        }
      }
      
      const missingTables = tableChecks.filter(check => !check.exists);
      const healthy = missingTables.length === 0 && healthStatus.isHealthy;
      
      console.log(`📊 Database health: ${healthy ? 'HEALTHY' : 'ISSUES DETECTED'}`);
      
      return {
        healthy,
        details: {
          healthStatus,
          tableChecks,
          missingTables: missingTables.map(t => t.table),
          totalTables: tableChecks.length,
          healthyTables: tableChecks.length - missingTables.length
        }
      };
      
    } catch (error) {
      console.error('❌ Health verification failed:', error);
      return {
        healthy: false,
        details: { error: error.message }
      };
    }
  }
  
  /**
   * Force recreation of all tables (use with caution)
   */
  async forceRecreateSchema(): Promise<InitializationResult> {
    console.log('⚠️ Force recreating entire database schema...');
    
    try {
      const { query } = require('../db');
      
      // Drop all existing tables (CASCADE to handle foreign keys)
      console.log('🗑️ Dropping existing tables...');
      const dropTablesQuery = `
        DO $$ DECLARE
          r RECORD;
        BEGIN
          FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
            EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
          END LOOP;
        END $$;
      `;
      
      await query(dropTablesQuery);
      console.log('✅ Existing tables dropped');
      
      // Recreate all tables
      return await this.initializeEmpireDatabase();
      
    } catch (error) {
      console.error('❌ Force recreation failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const databaseInitializer = new DatabaseInitializationSystem();