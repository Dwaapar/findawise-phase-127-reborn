/**
 * Disaster Recovery Database Schema
 * Enterprise-grade tables for comprehensive disaster recovery management
 */

import { pgTable, text, integer, jsonb, timestamp, boolean, real, uuid } from 'drizzle-orm/pg-core';

// ================================
// DISASTER RECOVERY SCENARIOS
// ================================

export const disasterRecoveryScenarios = pgTable('disaster_recovery_scenarios', {
  id: uuid('id').defaultRandom().primaryKey(),
  scenario_name: text('scenario_name').notNull(),
  scenario_type: text('scenario_type').notNull(), // 'region_failure', 'network_partition', 'ddos_attack', etc.
  affected_regions: jsonb('affected_regions').notNull(), // Array of region IDs
  backup_regions: jsonb('backup_regions').notNull(), // Array of backup region IDs
  recovery_strategy: jsonb('recovery_strategy').notNull(), // Complete recovery strategy object
  estimated_recovery_time: integer('estimated_recovery_time').notNull().default(0), // in seconds
  data_recovery_method: text('data_recovery_method').notNull().default('async'), // 'sync', 'async', 'manual'
  business_continuity_plan: jsonb('business_continuity_plan').notNull(), // Communication and continuity plans
  created_by: text('created_by').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});