/**
 * Supabase Schema Migration System - Billion-Dollar Empire Grade
 * Auto-migration system for all core modules with versioning and rollback
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { universalDb } from './index';

interface MigrationDefinition {
  version: string;
  name: string;
  up: string[];
  down: string[];
  dependencies?: string[];
}

interface MigrationStatus {
  version: string;
  name: string;
  appliedAt: string;
  checksum: string;
}

class SupabaseMigrationSystem {
  private supabase: SupabaseClient | null = null;
  private migrations: MigrationDefinition[] = [];

  constructor() {
    this.setupMigrations();
  }

  /**
   * Initialize migration system
   */
  async initialize(): Promise<void> {
    this.supabase = universalDb.getSupabase();
    
    if (!this.supabase) {
      console.log('⚠️ Supabase not available, skipping migration system');
      return;
    }

    console.log('🔄 Initializing Supabase Migration System...');
    
    // Create migration tracking table
    await this.createMigrationTable();
    
    // Run pending migrations
    await this.runPendingMigrations();
    
    console.log('✅ Supabase Migration System initialized');
  }

  /**
   * Setup all migration definitions
   */
  private setupMigrations(): void {
    this.migrations = [
      {
        version: '001',
        name: 'create_core_tables',
        up: [
          `CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email VARCHAR(255) UNIQUE NOT NULL,
            name VARCHAR(255),
            avatar_url TEXT,
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );`,
          
          `CREATE TABLE IF NOT EXISTS user_sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            session_token VARCHAR(255) UNIQUE NOT NULL,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );`,
          
          `CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);`,
          `CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);`,
        ],
        down: [
          'DROP TABLE IF EXISTS user_sessions;',
          'DROP TABLE IF EXISTS users;',
        ]
      },
      
      {
        version: '002',
        name: 'create_analytics_tables',
        dependencies: ['001'],
        up: [
          `CREATE TABLE IF NOT EXISTS analytics_events (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id) ON DELETE SET NULL,
            session_id UUID REFERENCES user_sessions(id) ON DELETE SET NULL,
            event_type VARCHAR(100) NOT NULL,
            event_data JSONB DEFAULT '{}',
            page_url TEXT,
            user_agent TEXT,
            ip_address INET,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );`,
          
          `CREATE TABLE IF NOT EXISTS analytics_conversions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id) ON DELETE SET NULL,
            event_id UUID REFERENCES analytics_events(id) ON DELETE CASCADE,
            conversion_type VARCHAR(100) NOT NULL,
            value DECIMAL(10,2),
            currency VARCHAR(3) DEFAULT 'USD',
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );`,
          
          `CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);`,
          `CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);`,
          `CREATE INDEX IF NOT EXISTS idx_analytics_conversions_type ON analytics_conversions(conversion_type);`,
        ],
        down: [
          'DROP TABLE IF EXISTS analytics_conversions;',
          'DROP TABLE IF EXISTS analytics_events;',
        ]
      },
      
      {
        version: '003',
        name: 'create_quiz_system_tables',
        dependencies: ['001'],
        up: [
          `CREATE TABLE IF NOT EXISTS quiz_templates (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            vertical VARCHAR(100) NOT NULL,
            questions JSONB NOT NULL DEFAULT '[]',
            scoring_logic JSONB NOT NULL DEFAULT '{}',
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );`,
          
          `CREATE TABLE IF NOT EXISTS quiz_responses (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id) ON DELETE SET NULL,
            quiz_template_id UUID REFERENCES quiz_templates(id) ON DELETE CASCADE,
            responses JSONB NOT NULL DEFAULT '{}',
            score INTEGER,
            archetype VARCHAR(255),
            completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            metadata JSONB DEFAULT '{}'
          );`,
          
          `CREATE INDEX IF NOT EXISTS idx_quiz_responses_user_id ON quiz_responses(user_id);`,
          `CREATE INDEX IF NOT EXISTS idx_quiz_responses_template_id ON quiz_responses(quiz_template_id);`,
          `CREATE INDEX IF NOT EXISTS idx_quiz_responses_archetype ON quiz_responses(archetype);`,
        ],
        down: [
          'DROP TABLE IF EXISTS quiz_responses;',
          'DROP TABLE IF EXISTS quiz_templates;',
        ]
      },
      
      {
        version: '004',
        name: 'create_orchestrator_tables',
        dependencies: ['001'],
        up: [
          `CREATE TABLE IF NOT EXISTS orchestrator_configs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            module_name VARCHAR(255) NOT NULL,
            config_data JSONB NOT NULL DEFAULT '{}',
            version INTEGER DEFAULT 1,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(module_name, version)
          );`,
          
          `CREATE TABLE IF NOT EXISTS orchestrator_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            module_name VARCHAR(255) NOT NULL,
            log_level VARCHAR(50) NOT NULL,
            message TEXT NOT NULL,
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );`,
          
          `CREATE TABLE IF NOT EXISTS ml_training_sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            model_name VARCHAR(255) NOT NULL,
            training_data JSONB NOT NULL,
            results JSONB DEFAULT '{}',
            status VARCHAR(50) DEFAULT 'pending',
            started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            completed_at TIMESTAMP WITH TIME ZONE,
            error_message TEXT
          );`,
          
          `CREATE INDEX IF NOT EXISTS idx_orchestrator_logs_module ON orchestrator_logs(module_name);`,
          `CREATE INDEX IF NOT EXISTS idx_orchestrator_logs_created_at ON orchestrator_logs(created_at);`,
          `CREATE INDEX IF NOT EXISTS idx_ml_training_status ON ml_training_sessions(status);`,
        ],
        down: [
          'DROP TABLE IF EXISTS ml_training_sessions;',
          'DROP TABLE IF EXISTS orchestrator_logs;',
          'DROP TABLE IF EXISTS orchestrator_configs;',
        ]
      },
      
      {
        version: '005',
        name: 'create_offer_system_tables',
        dependencies: ['001'],
        up: [
          `CREATE TABLE IF NOT EXISTS affiliate_offers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            external_id VARCHAR(255),
            title VARCHAR(500) NOT NULL,
            description TEXT,
            price DECIMAL(10,2),
            commission_rate DECIMAL(5,4),
            vertical VARCHAR(100) NOT NULL,
            provider VARCHAR(100) NOT NULL,
            url TEXT NOT NULL,
            image_url TEXT,
            metadata JSONB DEFAULT '{}',
            is_active BOOLEAN DEFAULT true,
            expires_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );`,
          
          `CREATE TABLE IF NOT EXISTS offer_impressions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            offer_id UUID REFERENCES affiliate_offers(id) ON DELETE CASCADE,
            user_id UUID REFERENCES users(id) ON DELETE SET NULL,
            page_url TEXT,
            user_agent TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );`,
          
          `CREATE TABLE IF NOT EXISTS offer_clicks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            offer_id UUID REFERENCES affiliate_offers(id) ON DELETE CASCADE,
            user_id UUID REFERENCES users(id) ON DELETE SET NULL,
            ip_address INET,
            user_agent TEXT,
            referrer TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );`,
          
          `CREATE INDEX IF NOT EXISTS idx_affiliate_offers_vertical ON affiliate_offers(vertical);`,
          `CREATE INDEX IF NOT EXISTS idx_affiliate_offers_provider ON affiliate_offers(provider);`,
          `CREATE INDEX IF NOT EXISTS idx_offer_impressions_offer_id ON offer_impressions(offer_id);`,
          `CREATE INDEX IF NOT EXISTS idx_offer_clicks_offer_id ON offer_clicks(offer_id);`,
        ],
        down: [
          'DROP TABLE IF EXISTS offer_clicks;',
          'DROP TABLE IF EXISTS offer_impressions;',
          'DROP TABLE IF EXISTS affiliate_offers;',
        ]
      },
      
      {
        version: '006',
        name: 'create_federation_tables',
        dependencies: ['001'],
        up: [
          `CREATE TABLE IF NOT EXISTS federation_neurons (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            vertical VARCHAR(100) NOT NULL,
            endpoint_url TEXT NOT NULL,
            api_key VARCHAR(255),
            status VARCHAR(50) DEFAULT 'active',
            last_ping TIMESTAMP WITH TIME ZONE,
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );`,
          
          `CREATE TABLE IF NOT EXISTS federation_sync_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            neuron_id UUID REFERENCES federation_neurons(id) ON DELETE CASCADE,
            sync_type VARCHAR(100) NOT NULL,
            status VARCHAR(50) NOT NULL,
            data JSONB DEFAULT '{}',
            error_message TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );`,
          
          `CREATE INDEX IF NOT EXISTS idx_federation_neurons_vertical ON federation_neurons(vertical);`,
          `CREATE INDEX IF NOT EXISTS idx_federation_neurons_status ON federation_neurons(status);`,
          `CREATE INDEX IF NOT EXISTS idx_federation_sync_logs_neuron_id ON federation_sync_logs(neuron_id);`,
        ],
        down: [
          'DROP TABLE IF EXISTS federation_sync_logs;',
          'DROP TABLE IF EXISTS federation_neurons;',
        ]
      },
      
      {
        version: '007',
        name: 'create_memory_graph_tables',
        dependencies: ['001'],
        up: [
          `CREATE TABLE IF NOT EXISTS memory_nodes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            node_id VARCHAR(255) UNIQUE NOT NULL,
            content_type VARCHAR(100) NOT NULL,
            title VARCHAR(500) NOT NULL,
            content TEXT,
            metadata JSONB DEFAULT '{}',
            embedding VECTOR(1536),
            importance_score DECIMAL(3,2) DEFAULT 0.5,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );`,
          
          `CREATE TABLE IF NOT EXISTS memory_edges (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            from_node_id VARCHAR(255) NOT NULL,
            to_node_id VARCHAR(255) NOT NULL,
            relationship_type VARCHAR(100) NOT NULL,
            weight DECIMAL(3,2) DEFAULT 0.5,
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(from_node_id, to_node_id, relationship_type)
          );`,
          
          `CREATE INDEX IF NOT EXISTS idx_memory_nodes_node_id ON memory_nodes(node_id);`,
          `CREATE INDEX IF NOT EXISTS idx_memory_nodes_content_type ON memory_nodes(content_type);`,
          `CREATE INDEX IF NOT EXISTS idx_memory_edges_from_node ON memory_edges(from_node_id);`,
          `CREATE INDEX IF NOT EXISTS idx_memory_edges_to_node ON memory_edges(to_node_id);`,
        ],
        down: [
          'DROP TABLE IF EXISTS memory_edges;',
          'DROP TABLE IF EXISTS memory_nodes;',
        ]
      }
    ];
  }

  /**
   * Create migration tracking table
   */
  private async createMigrationTable(): Promise<void> {
    if (!this.supabase) return;

    const { error } = await this.supabase.rpc('execute_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          checksum VARCHAR(255) NOT NULL
        );
      `
    });

    if (error) {
      console.error('❌ Failed to create migration table:', error);
      throw error;
    }
  }

  /**
   * Get applied migrations
   */
  private async getAppliedMigrations(): Promise<MigrationStatus[]> {
    if (!this.supabase) return [];

    const { data, error } = await this.supabase
      .from('schema_migrations')
      .select('*')
      .order('version');

    if (error) {
      console.error('❌ Failed to fetch applied migrations:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Calculate migration checksum
   */
  private calculateChecksum(migration: MigrationDefinition): string {
    const content = JSON.stringify({
      up: migration.up,
      down: migration.down,
      dependencies: migration.dependencies
    });
    
    // Simple hash function for demonstration
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  /**
   * Apply a single migration
   */
  private async applyMigration(migration: MigrationDefinition): Promise<void> {
    if (!this.supabase) return;

    console.log(`🔄 Applying migration ${migration.version}: ${migration.name}`);

    try {
      // Execute each SQL statement
      for (const sql of migration.up) {
        const { error } = await this.supabase.rpc('execute_sql', { query: sql });
        if (error) throw error;
      }

      // Record successful migration
      const checksum = this.calculateChecksum(migration);
      const { error } = await this.supabase
        .from('schema_migrations')
        .insert({
          version: migration.version,
          name: migration.name,
          checksum
        });

      if (error) throw error;

      console.log(`✅ Migration ${migration.version} applied successfully`);
    } catch (error) {
      console.error(`❌ Failed to apply migration ${migration.version}:`, error);
      throw error;
    }
  }

  /**
   * Run all pending migrations
   */
  async runPendingMigrations(): Promise<void> {
    if (!this.supabase) return;

    const appliedMigrations = await this.getAppliedMigrations();
    const appliedVersions = new Set(appliedMigrations.map(m => m.version));

    const pendingMigrations = this.migrations.filter(m => !appliedVersions.has(m.version));

    if (pendingMigrations.length === 0) {
      console.log('✅ No pending migrations');
      return;
    }

    console.log(`🔄 Running ${pendingMigrations.length} pending migrations...`);

    // Sort migrations by version
    pendingMigrations.sort((a, b) => a.version.localeCompare(b.version));

    for (const migration of pendingMigrations) {
      // Check dependencies
      if (migration.dependencies) {
        for (const dep of migration.dependencies) {
          if (!appliedVersions.has(dep)) {
            throw new Error(`Migration ${migration.version} depends on ${dep} which is not applied`);
          }
        }
      }

      await this.applyMigration(migration);
      appliedVersions.add(migration.version);
    }

    console.log('✅ All pending migrations applied successfully');
  }

  /**
   * Rollback a migration
   */
  async rollbackMigration(version: string): Promise<void> {
    if (!this.supabase) return;

    const migration = this.migrations.find(m => m.version === version);
    if (!migration) {
      throw new Error(`Migration ${version} not found`);
    }

    console.log(`🔄 Rolling back migration ${version}: ${migration.name}`);

    try {
      // Execute rollback SQL statements
      for (const sql of migration.down) {
        const { error } = await this.supabase.rpc('execute_sql', { query: sql });
        if (error) throw error;
      }

      // Remove migration record
      const { error } = await this.supabase
        .from('schema_migrations')
        .delete()
        .eq('version', version);

      if (error) throw error;

      console.log(`✅ Migration ${version} rolled back successfully`);
    } catch (error) {
      console.error(`❌ Failed to rollback migration ${version}:`, error);
      throw error;
    }
  }

  /**
   * Get migration status
   */
  async getStatus(): Promise<{ applied: MigrationStatus[]; pending: MigrationDefinition[] }> {
    const appliedMigrations = await this.getAppliedMigrations();
    const appliedVersions = new Set(appliedMigrations.map(m => m.version));
    const pendingMigrations = this.migrations.filter(m => !appliedVersions.has(m.version));

    return {
      applied: appliedMigrations,
      pending: pendingMigrations
    };
  }
}

// Singleton instance
export const migrationSystem = new SupabaseMigrationSystem();

// Export types
export type { MigrationDefinition, MigrationStatus };

export default migrationSystem;