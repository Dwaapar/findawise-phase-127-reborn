/**
 * Smart Funnel Generator Database Schema
 * Billion-Dollar Empire Grade Universal Funnel Engine
 */

import { pgTable, text, integer, timestamp, jsonb, boolean, uuid, decimal, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// =====================================================
// FUNNEL BLUEPRINTS & CONFIGURATIONS
// =====================================================

export const funnelBlueprints = pgTable('funnel_blueprints', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  vertical: text('vertical').notNull(), // finance, health, saas, travel, etc.
  type: text('type').notNull(), // lead_magnet, product_review, exit_intent, etc.
  description: text('description'),
  config: jsonb('config').notNull().$type<{
    blocks: Array<{
      id: string;
      type: 'quiz' | 'content' | 'cta' | 'form' | 'offer' | 'milestone' | 'social' | 'video';
      position: number;
      config: Record<string, any>;
      conditions?: Array<{
        field: string;
        operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
        value: any;
      }>;
    }>;
    triggers: Array<{
      type: 'page_load' | 'scroll_depth' | 'time_on_page' | 'exit_intent' | 'click' | 'quiz_complete';
      conditions: Record<string, any>;
    }>;
    branching: Record<string, {
      conditions: Array<{ field: string; operator: string; value: any }>;
      next_block: string;
    }>;
    analytics: {
      track_events: string[];
      conversion_goals: string[];
    };
  }>(),
  status: text('status').notNull().default('draft'), // draft, active, paused, archived
  priority: integer('priority').notNull().default(100),
  created_by: text('created_by'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  verticalIdx: index('funnel_blueprints_vertical_idx').on(table.vertical),
  typeIdx: index('funnel_blueprints_type_idx').on(table.type),
  statusIdx: index('funnel_blueprints_status_idx').on(table.status),
}));

// =====================================================
// FUNNEL INSTANCES & USER JOURNEYS
// =====================================================

export const funnelInstances = pgTable('funnel_instances', {
  id: uuid('id').primaryKey().defaultRandom(),
  blueprint_id: uuid('blueprint_id').references(() => funnelBlueprints.id).notNull(),
  session_id: text('session_id').notNull(),
  user_id: text('user_id'),
  variant_id: text('variant_id'), // For A/B testing
  entry_point: text('entry_point').notNull(), // page_url, popup, exit_intent, etc.
  current_block: text('current_block'),
  status: text('status').notNull().default('active'), // active, completed, abandoned
  personalization_data: jsonb('personalization_data').$type<{
    persona?: string;
    quiz_results?: Record<string, any>;
    emotion_state?: string;
    device_type?: string;
    location?: string;
    previous_interactions?: any[];
  }>(),
  analytics_data: jsonb('analytics_data').$type<{
    time_spent: number;
    blocks_viewed: string[];
    interactions: Array<{
      block_id: string;
      action: string;
      timestamp: string;
      data?: any;
    }>;
    conversion_events: string[];
  }>(),
  started_at: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  completed_at: timestamp('completed_at', { withTimezone: true }),
  last_activity: timestamp('last_activity', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  sessionIdx: index('funnel_instances_session_idx').on(table.session_id),
  userIdx: index('funnel_instances_user_idx').on(table.user_id),
  blueprintIdx: index('funnel_instances_blueprint_idx').on(table.blueprint_id),
  statusIdx: index('funnel_instances_status_idx').on(table.status),
}));

// =====================================================
// FUNNEL EVENTS & INTERACTIONS
// =====================================================

export const funnelEvents = pgTable('funnel_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  instance_id: uuid('instance_id').references(() => funnelInstances.id).notNull(),
  block_id: text('block_id').notNull(),
  event_type: text('event_type').notNull(), // view, click, submit, skip, complete
  event_data: jsonb('event_data').$type<{
    action?: string;
    value?: any;
    context?: Record<string, any>;
    timing?: {
      time_on_block: number;
      scroll_depth: number;
      interactions_count: number;
    };
  }>(),
  metadata: jsonb('metadata').$type<{
    user_agent?: string;
    referrer?: string;
    viewport?: { width: number; height: number };
    device_info?: Record<string, any>;
  }>(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  instanceIdx: index('funnel_events_instance_idx').on(table.instance_id),
  typeIdx: index('funnel_events_type_idx').on(table.event_type),
  createdIdx: index('funnel_events_created_idx').on(table.created_at),
}));

// =====================================================
// A/B/N TESTING & EXPERIMENTS
// =====================================================

export const funnelExperiments = pgTable('funnel_experiments', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  blueprint_id: uuid('blueprint_id').references(() => funnelBlueprints.id).notNull(),
  status: text('status').notNull().default('draft'), // draft, running, paused, completed
  experiment_type: text('experiment_type').notNull().default('ab_test'), // ab_test, multivariate, multi_armed_bandit
  variants: jsonb('variants').notNull().$type<Array<{
    id: string;
    name: string;
    weight: number;
    config_overrides: Record<string, any>;
    is_control: boolean;
  }>>(),
  targeting: jsonb('targeting').$type<{
    audience_filters?: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
    traffic_allocation: number;
    geo_targeting?: string[];
    device_targeting?: string[];
  }>(),
  success_metrics: jsonb('success_metrics').$type<{
    primary_metric: string;
    secondary_metrics: string[];
    conversion_goals: string[];
    statistical_significance_threshold: number;
  }>(),
  results: jsonb('results').$type<{
    participants: number;
    conversions: number;
    conversion_rate: number;
    statistical_significance: number;
    winner_variant?: string;
    variant_performance: Record<string, {
      participants: number;
      conversions: number;
      conversion_rate: number;
      confidence_interval: [number, number];
    }>;
  }>(),
  start_date: timestamp('start_date', { withTimezone: true }),
  end_date: timestamp('end_date', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  blueprintIdx: index('funnel_experiments_blueprint_idx').on(table.blueprint_id),
  statusIdx: index('funnel_experiments_status_idx').on(table.status),
}));

// =====================================================
// FUNNEL ANALYTICS & PERFORMANCE
// =====================================================

export const funnelAnalytics = pgTable('funnel_analytics', {
  id: uuid('id').primaryKey().defaultRandom(),
  blueprint_id: uuid('blueprint_id').references(() => funnelBlueprints.id).notNull(),
  date: text('date').notNull(), // YYYY-MM-DD format
  period_type: text('period_type').notNull().default('daily'), // hourly, daily, weekly, monthly
  metrics: jsonb('metrics').notNull().$type<{
    total_views: number;
    unique_visitors: number;
    total_starts: number;
    total_completions: number;
    completion_rate: number;
    average_time_spent: number;
    bounce_rate: number;
    block_performance: Record<string, {
      views: number;
      interactions: number;
      completion_rate: number;
      drop_off_rate: number;
      average_time: number;
    }>;
    conversion_funnel: Array<{
      step: string;
      visitors: number;
      conversion_rate: number;
    }>;
    revenue_metrics?: {
      total_revenue: number;
      average_order_value: number;
      revenue_per_visitor: number;
    };
  }>(),
  segments: jsonb('segments').$type<{
    by_persona: Record<string, { visitors: number; conversion_rate: number }>;
    by_device: Record<string, { visitors: number; conversion_rate: number }>;
    by_traffic_source: Record<string, { visitors: number; conversion_rate: number }>;
    by_geography: Record<string, { visitors: number; conversion_rate: number }>;
  }>(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  blueprintIdx: index('funnel_analytics_blueprint_idx').on(table.blueprint_id),
  dateIdx: index('funnel_analytics_date_idx').on(table.date),
  periodIdx: index('funnel_analytics_period_idx').on(table.period_type),
}));

// =====================================================
// FUNNEL LIFECYCLE INTEGRATIONS
// =====================================================

export const funnelLifecycleIntegrations = pgTable('funnel_lifecycle_integrations', {
  id: uuid('id').primaryKey().defaultRandom(),
  blueprint_id: uuid('blueprint_id').references(() => funnelBlueprints.id).notNull(),
  integration_type: text('integration_type').notNull(), // email, push, sms, webhook
  trigger_conditions: jsonb('trigger_conditions').notNull().$type<{
    funnel_events: string[];
    completion_status: string[];
    time_delays: Array<{
      after_event: string;
      delay_minutes: number;
    }>;
    user_segments: string[];
  }>(),
  action_config: jsonb('action_config').notNull().$type<{
    email?: {
      template_id: string;
      subject_line: string;
      personalization_fields: string[];
    };
    push?: {
      title: string;
      body: string;
      action_url: string;
    };
    webhook?: {
      url: string;
      method: string;
      headers: Record<string, string>;
      payload_template: Record<string, any>;
    };
  }>(),
  status: text('status').notNull().default('active'), // active, paused, archived
  performance_stats: jsonb('performance_stats').$type<{
    total_triggered: number;
    successful_deliveries: number;
    engagement_rate: number;
    conversion_rate: number;
    revenue_generated: number;
  }>(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  blueprintIdx: index('funnel_lifecycle_integrations_blueprint_idx').on(table.blueprint_id),
  typeIdx: index('funnel_lifecycle_integrations_type_idx').on(table.integration_type),
}));

// =====================================================
// FUNNEL OPTIMIZATION & AI INSIGHTS
// =====================================================

export const funnelOptimizations = pgTable('funnel_optimizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  blueprint_id: uuid('blueprint_id').references(() => funnelBlueprints.id).notNull(),
  optimization_type: text('optimization_type').notNull(), // ai_suggestion, manual_tweak, auto_adjustment
  category: text('category').notNull(), // cta_placement, block_order, timing, targeting
  current_config: jsonb('current_config').notNull(),
  suggested_config: jsonb('suggested_config').notNull(),
  reasoning: text('reasoning').notNull(),
  confidence_score: decimal('confidence_score', { precision: 5, scale: 4 }),
  expected_impact: jsonb('expected_impact').$type<{
    conversion_rate_lift: number;
    engagement_improvement: number;
    revenue_impact: number;
    confidence_interval: [number, number];
  }>(),
  status: text('status').notNull().default('pending'), // pending, approved, rejected, implemented, testing
  implementation_date: timestamp('implementation_date', { withTimezone: true }),
  results: jsonb('results').$type<{
    actual_impact: {
      conversion_rate_change: number;
      engagement_change: number;
      revenue_change: number;
    };
    test_duration_days: number;
    statistical_significance: number;
  }>(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  blueprintIdx: index('funnel_optimizations_blueprint_idx').on(table.blueprint_id),
  statusIdx: index('funnel_optimizations_status_idx').on(table.status),
  typeIdx: index('funnel_optimizations_type_idx').on(table.optimization_type),
}));

// =====================================================
// ZOD SCHEMAS FOR VALIDATION
// =====================================================

export const insertFunnelBlueprintSchema = createInsertSchema(funnelBlueprints);
export const selectFunnelBlueprintSchema = createSelectSchema(funnelBlueprints);

export const insertFunnelInstanceSchema = createInsertSchema(funnelInstances);
export const selectFunnelInstanceSchema = createSelectSchema(funnelInstances);

export const insertFunnelEventSchema = createInsertSchema(funnelEvents);
export const selectFunnelEventSchema = createSelectSchema(funnelEvents);

export const insertFunnelExperimentSchema = createInsertSchema(funnelExperiments);
export const selectFunnelExperimentSchema = createSelectSchema(funnelExperiments);

export const insertFunnelAnalyticsSchema = createInsertSchema(funnelAnalytics);
export const selectFunnelAnalyticsSchema = createSelectSchema(funnelAnalytics);

export const insertFunnelLifecycleIntegrationSchema = createInsertSchema(funnelLifecycleIntegrations);
export const selectFunnelLifecycleIntegrationSchema = createSelectSchema(funnelLifecycleIntegrations);

export const insertFunnelOptimizationSchema = createInsertSchema(funnelOptimizations);
export const selectFunnelOptimizationSchema = createSelectSchema(funnelOptimizations);

// =====================================================
// TYPE EXPORTS
// =====================================================

export type FunnelBlueprint = typeof funnelBlueprints.$inferSelect;
export type InsertFunnelBlueprint = typeof funnelBlueprints.$inferInsert;

export type FunnelInstance = typeof funnelInstances.$inferSelect;
export type InsertFunnelInstance = typeof funnelInstances.$inferInsert;

export type FunnelEvent = typeof funnelEvents.$inferSelect;
export type InsertFunnelEvent = typeof funnelEvents.$inferInsert;

export type FunnelExperiment = typeof funnelExperiments.$inferSelect;
export type InsertFunnelExperiment = typeof funnelExperiments.$inferInsert;

export type FunnelAnalytics = typeof funnelAnalytics.$inferSelect;
export type InsertFunnelAnalytics = typeof funnelAnalytics.$inferInsert;

export type FunnelLifecycleIntegration = typeof funnelLifecycleIntegrations.$inferSelect;
export type InsertFunnelLifecycleIntegration = typeof funnelLifecycleIntegrations.$inferInsert;

export type FunnelOptimization = typeof funnelOptimizations.$inferSelect;
export type InsertFunnelOptimization = typeof funnelOptimizations.$inferInsert;