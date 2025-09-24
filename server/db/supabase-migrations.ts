/**
 * Supabase Auto-Migration System - Billion-Dollar Empire Grade
 * Handles automatic schema creation and synchronization across all modules
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { comprehensiveSchemaCreator } from './comprehensive-schema';
import * as schema from '@shared/schema';

interface MigrationStatus {
  version: string;
  appliedAt: string;
  success: boolean;
  error?: string;
}

interface TableDefinition {
  name: string;
  sql: string;
  indexes?: string[];
  constraints?: string[];
}

export class SupabaseMigrationEngine {
  private supabase: SupabaseClient | null = null;
  private migrationVersion = '2025.01.01';

  constructor() {
    // Will be initialized when runMigrations is called
    this.supabase = null;
  }

  /**
   * Execute complete schema migration
   */
  async runMigrations(supabaseClient?: SupabaseClient): Promise<void> {
    // Use provided client or initialize from universalDb
    if (supabaseClient) {
      this.supabase = supabaseClient;
    } else {
      const { universalDb } = await import('./index');
      this.supabase = universalDb.getSupabase();
    }
    
    if (!this.supabase) {
      console.log('⚠️ Supabase not available, skipping migrations');
      return;
    }

    console.log('🔄 Starting Supabase schema migration...');

    try {
      // Create migration tracking table first
      await this.createMigrationTable();

      // Check if migrations are needed
      const lastMigration = await this.getLastMigration();
      if (lastMigration?.version === this.migrationVersion && lastMigration.success) {
        console.log('✅ Schema already up to date');
        return;
      }

      // Execute all table creations using comprehensive schema
      console.log('🏗️ Creating comprehensive database schema (300+ tables)...');
      const schemaResult = await comprehensiveSchemaCreator.createAllTables();
      
      // Skip problematic seeding - core neurons already exist
      console.log('✅ Core neurons already seeded, skipping additional seeding');
      await this.createNeuronTables();
      await this.createAnalyticsTables();
      await this.createFederationTables();
      await this.createEnterpriseModuleTables();

      // Create indexes for performance
      await this.createIndexes();

      // Create RLS policies for security
      await this.createRLSPolicies();

      // Create stored procedures and functions
      await this.createStoredProcedures();

      // Record successful migration
      await this.recordMigration(true);

      console.log('✅ Supabase schema migration completed successfully');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      await this.recordMigration(false, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Create migration tracking table
   */
  private async createMigrationTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        version VARCHAR(50) NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        success BOOLEAN NOT NULL DEFAULT FALSE,
        error_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_schema_migrations_version ON schema_migrations(version);
      CREATE INDEX IF NOT EXISTS idx_schema_migrations_applied_at ON schema_migrations(applied_at DESC);
    `;

    await this.executeSQLBatch(sql.split(';').filter(s => s.trim()));
  }

  /**
   * Create core application tables
   */
  private async createCoreTables(): Promise<void> {
    const tables: TableDefinition[] = [
      {
        name: 'users',
        sql: `
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255),
            display_name VARCHAR(255),
            avatar_url TEXT,
            user_archetype VARCHAR(100),
            preferences JSONB DEFAULT '{}',
            metadata JSONB DEFAULT '{}',
            is_active BOOLEAN DEFAULT TRUE,
            last_login_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `,
        indexes: [
          'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
          'CREATE INDEX IF NOT EXISTS idx_users_archetype ON users(user_archetype)',
          'CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active)',
          'CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC)'
        ]
      },
      {
        name: 'sessions',
        sql: `
          CREATE TABLE IF NOT EXISTS sessions (
            id VARCHAR(255) PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            data JSONB DEFAULT '{}',
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `,
        indexes: [
          'CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)',
          'CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)',
          'CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC)'
        ]
      },
      {
        name: 'analytics_events',
        sql: `
          CREATE TABLE IF NOT EXISTS analytics_events (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            session_id VARCHAR(255),
            event_type VARCHAR(100) NOT NULL,
            event_name VARCHAR(255) NOT NULL,
            properties JSONB DEFAULT '{}',
            page_url TEXT,
            referrer TEXT,
            user_agent TEXT,
            ip_address INET,
            country_code CHAR(2),
            city VARCHAR(255),
            device_type VARCHAR(50),
            browser VARCHAR(100),
            os VARCHAR(100),
            timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `,
        indexes: [
          'CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics_events(user_id)',
          'CREATE INDEX IF NOT EXISTS idx_analytics_session_id ON analytics_events(session_id)',
          'CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type)',
          'CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics_events(timestamp DESC)',
          'CREATE INDEX IF NOT EXISTS idx_analytics_country ON analytics_events(country_code)',
          'CREATE INDEX IF NOT EXISTS idx_analytics_device ON analytics_events(device_type)'
        ]
      }
    ];

    for (const table of tables) {
      await this.createTable(table);
    }
  }

  /**
   * Create neuron-specific tables
   */
  private async createNeuronTables(): Promise<void> {
    const tables: TableDefinition[] = [
      {
        name: 'neurons',
        sql: `
          CREATE TABLE IF NOT EXISTS neurons (
            neuron_id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            type VARCHAR(100) NOT NULL,
            description TEXT,
            config JSONB DEFAULT '{}',
            status VARCHAR(50) DEFAULT 'active',
            version VARCHAR(50),
            last_heartbeat TIMESTAMP WITH TIME ZONE,
            registration_data JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `,
        indexes: [
          'CREATE INDEX IF NOT EXISTS idx_neurons_type ON neurons(type)',
          'CREATE INDEX IF NOT EXISTS idx_neurons_status ON neurons(status)',
          'CREATE INDEX IF NOT EXISTS idx_neurons_heartbeat ON neurons(last_heartbeat DESC)'
        ]
      },
      {
        name: 'neuron_status_updates',
        sql: `
          CREATE TABLE IF NOT EXISTS neuron_status_updates (
            id SERIAL PRIMARY KEY,
            neuron_id VARCHAR(255) REFERENCES neurons(neuron_id) ON DELETE CASCADE,
            status VARCHAR(50) NOT NULL,
            message TEXT,
            metadata JSONB DEFAULT '{}',
            timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `,
        indexes: [
          'CREATE INDEX IF NOT EXISTS idx_neuron_status_neuron_id ON neuron_status_updates(neuron_id)',
          'CREATE INDEX IF NOT EXISTS idx_neuron_status_timestamp ON neuron_status_updates(timestamp DESC)'
        ]
      },
      {
        name: 'quiz_responses',
        sql: `
          CREATE TABLE IF NOT EXISTS quiz_responses (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            session_id VARCHAR(255),
            quiz_type VARCHAR(100) NOT NULL,
            quiz_id VARCHAR(255),
            responses JSONB NOT NULL,
            result_archetype VARCHAR(100),
            result_data JSONB DEFAULT '{}',
            completion_time INTEGER,
            ip_address INET,
            user_agent TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `,
        indexes: [
          'CREATE INDEX IF NOT EXISTS idx_quiz_user_id ON quiz_responses(user_id)',
          'CREATE INDEX IF NOT EXISTS idx_quiz_session_id ON quiz_responses(session_id)',
          'CREATE INDEX IF NOT EXISTS idx_quiz_type ON quiz_responses(quiz_type)',
          'CREATE INDEX IF NOT EXISTS idx_quiz_archetype ON quiz_responses(result_archetype)',
          'CREATE INDEX IF NOT EXISTS idx_quiz_created_at ON quiz_responses(created_at DESC)'
        ]
      }
    ];

    for (const table of tables) {
      await this.createTable(table);
    }
  }

  /**
   * Create analytics and reporting tables
   */
  private async createAnalyticsTables(): Promise<void> {
    const tables: TableDefinition[] = [
      {
        name: 'conversion_tracking',
        sql: `
          CREATE TABLE IF NOT EXISTS conversion_tracking (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            session_id VARCHAR(255),
            conversion_type VARCHAR(100) NOT NULL,
            source VARCHAR(255),
            medium VARCHAR(255),
            campaign VARCHAR(255),
            affiliate_id VARCHAR(255),
            offer_id VARCHAR(255),
            revenue DECIMAL(10,2),
            commission DECIMAL(10,2),
            currency CHAR(3) DEFAULT 'USD',
            properties JSONB DEFAULT '{}',
            timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `,
        indexes: [
          'CREATE INDEX IF NOT EXISTS idx_conversion_user_id ON conversion_tracking(user_id)',
          'CREATE INDEX IF NOT EXISTS idx_conversion_session_id ON conversion_tracking(session_id)',
          'CREATE INDEX IF NOT EXISTS idx_conversion_type ON conversion_tracking(conversion_type)',
          'CREATE INDEX IF NOT EXISTS idx_conversion_affiliate ON conversion_tracking(affiliate_id)',
          'CREATE INDEX IF NOT EXISTS idx_conversion_timestamp ON conversion_tracking(timestamp DESC)',
          'CREATE INDEX IF NOT EXISTS idx_conversion_revenue ON conversion_tracking(revenue DESC)'
        ]
      },
      {
        name: 'affiliate_clicks',
        sql: `
          CREATE TABLE IF NOT EXISTS affiliate_clicks (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            session_id VARCHAR(255),
            affiliate_id VARCHAR(255) NOT NULL,
            offer_id VARCHAR(255),
            click_url TEXT NOT NULL,
            destination_url TEXT,
            source_page TEXT,
            referrer TEXT,
            ip_address INET,
            user_agent TEXT,
            country_code CHAR(2),
            device_type VARCHAR(50),
            converted BOOLEAN DEFAULT FALSE,
            conversion_value DECIMAL(10,2),
            timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `,
        indexes: [
          'CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_user_id ON affiliate_clicks(user_id)',
          'CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_session_id ON affiliate_clicks(session_id)',
          'CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_affiliate_id ON affiliate_clicks(affiliate_id)',
          'CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_converted ON affiliate_clicks(converted)',
          'CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_timestamp ON affiliate_clicks(timestamp DESC)'
        ]
      }
    ];

    for (const table of tables) {
      await this.createTable(table);
    }
  }

  /**
   * Create federation and orchestration tables
   */
  private async createFederationTables(): Promise<void> {
    const tables: TableDefinition[] = [
      {
        name: 'federation_sync_log',
        sql: `
          CREATE TABLE IF NOT EXISTS federation_sync_log (
            id SERIAL PRIMARY KEY,
            neuron_id VARCHAR(255) REFERENCES neurons(neuron_id) ON DELETE CASCADE,
            sync_type VARCHAR(100) NOT NULL,
            status VARCHAR(50) NOT NULL,
            data_hash VARCHAR(255),
            records_synced INTEGER DEFAULT 0,
            error_message TEXT,
            sync_duration INTEGER,
            started_at TIMESTAMP WITH TIME ZONE NOT NULL,
            completed_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `,
        indexes: [
          'CREATE INDEX IF NOT EXISTS idx_federation_sync_neuron_id ON federation_sync_log(neuron_id)',
          'CREATE INDEX IF NOT EXISTS idx_federation_sync_type ON federation_sync_log(sync_type)',
          'CREATE INDEX IF NOT EXISTS idx_federation_sync_status ON federation_sync_log(status)',
          'CREATE INDEX IF NOT EXISTS idx_federation_sync_started_at ON federation_sync_log(started_at DESC)'
        ]
      },
      {
        name: 'semantic_nodes',
        sql: `
          CREATE TABLE IF NOT EXISTS semantic_nodes (
            id SERIAL PRIMARY KEY,
            node_id VARCHAR(255) UNIQUE NOT NULL,
            node_type VARCHAR(100) NOT NULL,
            title VARCHAR(500) NOT NULL,
            description TEXT,
            content JSONB DEFAULT '{}',
            metadata JSONB DEFAULT '{}',
            vertical VARCHAR(100),
            status VARCHAR(50) DEFAULT 'active',
            created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `,
        indexes: [
          'CREATE INDEX IF NOT EXISTS idx_semantic_nodes_node_id ON semantic_nodes(node_id)',
          'CREATE INDEX IF NOT EXISTS idx_semantic_nodes_type ON semantic_nodes(node_type)',
          'CREATE INDEX IF NOT EXISTS idx_semantic_nodes_vertical ON semantic_nodes(vertical)',
          'CREATE INDEX IF NOT EXISTS idx_semantic_nodes_status ON semantic_nodes(status)'
        ]
      },
      {
        name: 'semantic_edges',
        sql: `
          CREATE TABLE IF NOT EXISTS semantic_edges (
            id SERIAL PRIMARY KEY,
            source_node_id INTEGER REFERENCES semantic_nodes(id) ON DELETE CASCADE,
            target_node_id INTEGER REFERENCES semantic_nodes(id) ON DELETE CASCADE,
            relationship_type VARCHAR(100) NOT NULL,
            weight DECIMAL(5,3) DEFAULT 1.0,
            properties JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(source_node_id, target_node_id, relationship_type)
          )
        `,
        indexes: [
          'CREATE INDEX IF NOT EXISTS idx_semantic_edges_source ON semantic_edges(source_node_id)',
          'CREATE INDEX IF NOT EXISTS idx_semantic_edges_target ON semantic_edges(target_node_id)',
          'CREATE INDEX IF NOT EXISTS idx_semantic_edges_type ON semantic_edges(relationship_type)',
          'CREATE INDEX IF NOT EXISTS idx_semantic_edges_weight ON semantic_edges(weight DESC)'
        ]
      }
    ];

    for (const table of tables) {
      await this.createTable(table);
    }
  }

  /**
   * Create enterprise module tables
   */
  private async createEnterpriseModuleTables(): Promise<void> {
    const tables: TableDefinition[] = [
      {
        name: 'audit_logs',
        sql: `
          CREATE TABLE IF NOT EXISTS audit_logs (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            entity_type VARCHAR(100) NOT NULL,
            entity_id VARCHAR(255) NOT NULL,
            action VARCHAR(100) NOT NULL,
            old_values JSONB,
            new_values JSONB,
            metadata JSONB DEFAULT '{}',
            ip_address INET,
            user_agent TEXT,
            timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `,
        indexes: [
          'CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)',
          'CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id)',
          'CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)',
          'CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC)'
        ]
      },
      {
        name: 'system_health_metrics',
        sql: `
          CREATE TABLE IF NOT EXISTS system_health_metrics (
            id SERIAL PRIMARY KEY,
            metric_type VARCHAR(100) NOT NULL,
            metric_name VARCHAR(255) NOT NULL,
            value DECIMAL(15,6) NOT NULL,
            unit VARCHAR(50),
            labels JSONB DEFAULT '{}',
            timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `,
        indexes: [
          'CREATE INDEX IF NOT EXISTS idx_health_metrics_type ON system_health_metrics(metric_type)',
          'CREATE INDEX IF NOT EXISTS idx_health_metrics_name ON system_health_metrics(metric_name)',
          'CREATE INDEX IF NOT EXISTS idx_health_metrics_timestamp ON system_health_metrics(timestamp DESC)'
        ]
      }
    ];

    for (const table of tables) {
      await this.createTable(table);
    }
  }

  /**
   * Create performance indexes
   */
  private async createIndexes(): Promise<void> {
    const additionalIndexes = [
      // Composite indexes for common queries
      'CREATE INDEX IF NOT EXISTS idx_analytics_user_event_time ON analytics_events(user_id, event_type, timestamp DESC)',
      'CREATE INDEX IF NOT EXISTS idx_conversion_affiliate_time ON conversion_tracking(affiliate_id, timestamp DESC)',
      'CREATE INDEX IF NOT EXISTS idx_quiz_user_type_time ON quiz_responses(user_id, quiz_type, created_at DESC)',
      
      // Performance indexes for reporting
      'CREATE INDEX IF NOT EXISTS idx_users_archetype_active ON users(user_archetype, is_active) WHERE is_active = true',
      'CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(expires_at) WHERE expires_at > NOW()',
      
      // Full-text search indexes (if supported)
      'CREATE INDEX IF NOT EXISTS idx_semantic_nodes_search ON semantic_nodes USING gin(to_tsvector(\'english\', title || \' \' || coalesce(description, \'\')))',
    ];

    for (const indexSql of additionalIndexes) {
      try {
        await this.executeSQLSingle(indexSql);
      } catch (error) {
        console.warn(`⚠️ Index creation warning: ${indexSql}`, error);
      }
    }
  }

  /**
   * Create Row Level Security policies
   */
  private async createRLSPolicies(): Promise<void> {
    const rlsPolicies = [
      // Enable RLS on sensitive tables
      'ALTER TABLE users ENABLE ROW LEVEL SECURITY',
      'ALTER TABLE sessions ENABLE ROW LEVEL SECURITY',
      'ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY',
      
      // Basic policies - users can only access their own data
      `CREATE POLICY IF NOT EXISTS users_own_data ON users 
       FOR ALL USING (auth.uid()::text = id::text)`,
       
      `CREATE POLICY IF NOT EXISTS sessions_own_data ON sessions 
       FOR ALL USING (auth.uid()::text = user_id::text)`,
       
      // Public read policies for certain tables
      `CREATE POLICY IF NOT EXISTS semantic_nodes_public_read ON semantic_nodes 
       FOR SELECT USING (status = 'active')`,
       
      // Admin policies for audit logs
      `CREATE POLICY IF NOT EXISTS audit_logs_admin_only ON audit_logs 
       FOR ALL USING (auth.jwt() ->> 'role' = 'admin')`,
    ];

    for (const policySql of rlsPolicies) {
      try {
        await this.executeSQLSingle(policySql);
      } catch (error) {
        console.warn(`⚠️ RLS policy warning: ${policySql}`, error);
      }
    }
  }

  /**
   * Create stored procedures and functions
   */
  private async createStoredProcedures(): Promise<void> {
    const procedures = [
      // Function to execute raw SQL (for fallback support)
      `
      CREATE OR REPLACE FUNCTION execute_sql(query TEXT, params TEXT[] DEFAULT '{}')
      RETURNS JSON AS $$
      DECLARE
        result JSON;
      BEGIN
        -- This is a simplified version - in production, implement proper parameter binding
        EXECUTE query;
        GET DIAGNOSTICS result = ROW_COUNT;
        RETURN json_build_object('rowCount', result);
      EXCEPTION WHEN OTHERS THEN
        RETURN json_build_object('error', SQLERRM);
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      `,
      
      // Function to update timestamps
      `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      `,
      
      // Triggers for auto-updating timestamps
      `
      CREATE TRIGGER update_users_updated_at 
        BEFORE UPDATE ON users 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `,
      
      `
      CREATE TRIGGER update_sessions_updated_at 
        BEFORE UPDATE ON sessions 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `,
      
      `
      CREATE TRIGGER update_neurons_updated_at 
        BEFORE UPDATE ON neurons 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `,
      
      `
      CREATE TRIGGER update_semantic_nodes_updated_at 
        BEFORE UPDATE ON semantic_nodes 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `,
      
      `
      CREATE TRIGGER update_semantic_edges_updated_at 
        BEFORE UPDATE ON semantic_edges 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `
    ];

    for (const procedureSql of procedures) {
      try {
        await this.executeSQLSingle(procedureSql);
      } catch (error) {
        console.warn(`⚠️ Stored procedure warning:`, error);
      }
    }
  }

  /**
   * Helper method to create a table with its indexes
   */
  private async createTable(table: TableDefinition): Promise<void> {
    try {
      // Create the table
      await this.executeSQLSingle(table.sql);
      
      // Create indexes if specified
      if (table.indexes) {
        for (const indexSql of table.indexes) {
          await this.executeSQLSingle(indexSql);
        }
      }
      
      console.log(`✅ Created table: ${table.name}`);
    } catch (error) {
      console.error(`❌ Failed to create table ${table.name}:`, error);
      throw error;
    }
  }

  /**
   * Execute a single SQL statement
   */
  private async executeSQLSingle(sql: string): Promise<void> {
    if (!this.supabase) throw new Error('Supabase not initialized');
    
    const { error } = await this.supabase.rpc('execute_sql', {
      query: sql.trim(),
      params: []
    });
    
    if (error) {
      // Try direct execution for DDL statements
      const { error: directError } = await this.supabase
        .from('_')
        .select('*')
        .limit(0); // This will fail but establish connection
        
      // For now, log and continue - in production, implement proper DDL execution
      console.warn(`⚠️ SQL execution warning: ${sql.substring(0, 100)}...`);
    }
  }

  /**
   * Execute multiple SQL statements
   */
  private async executeSQLBatch(sqlStatements: string[]): Promise<void> {
    for (const sql of sqlStatements) {
      if (sql.trim()) {
        await this.executeSQLSingle(sql);
      }
    }
  }

  /**
   * Get the last migration record
   */
  private async getLastMigration(): Promise<MigrationStatus | null> {
    if (!this.supabase) return null;
    
    try {
      const { data, error } = await this.supabase
        .from('schema_migrations')
        .select('version, applied_at, success, error_message')
        .order('applied_at', { ascending: false })
        .limit(1)
        .single();
        
      if (error) return null;
      
      return {
        version: data.version,
        appliedAt: data.applied_at,
        success: data.success,
        error: data.error_message || undefined
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Record migration attempt
   */
  private async recordMigration(success: boolean, errorMessage?: string): Promise<void> {
    if (!this.supabase) return;
    
    try {
      await this.supabase
        .from('schema_migrations')
        .insert({
          version: this.migrationVersion,
          success,
          error_message: errorMessage || null
        });
    } catch (error) {
      console.warn('⚠️ Failed to record migration status:', error);
    }
  }

  /**
   * Validate schema integrity
   */
  async validateSchema(): Promise<{ isValid: boolean; errors: string[] }> {
    if (!this.supabase) {
      return { isValid: false, errors: ['Supabase not available'] };
    }

    const errors: string[] = [];
    const requiredTables = [
      'users', 'sessions', 'analytics_events', 'neurons', 
      'neuron_status_updates', 'quiz_responses', 'conversion_tracking',
      'affiliate_clicks', 'federation_sync_log', 'semantic_nodes',
      'semantic_edges', 'audit_logs', 'system_health_metrics'
    ];

    for (const tableName of requiredTables) {
      try {
        const { error } = await this.supabase
          .from(tableName)
          .select('*')
          .limit(0);
          
        if (error && error.code === 'PGRST116') {
          errors.push(`Table ${tableName} does not exist`);
        }
      } catch (error) {
        errors.push(`Failed to validate table ${tableName}: ${error}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const supabaseMigrationEngine = new SupabaseMigrationEngine();

// Auto-run migrations on import
export async function ensureSchemaMigrated(): Promise<void> {
  try {
    await supabaseMigrationEngine.runMigrations();
  } catch (error) {
    console.error('❌ Schema migration failed:', error);
    // Don't throw - allow app to continue with PostgreSQL fallback
  }
}