/**
 * Real-Time Layout Mutation Engine Database Schema
 * Billion-Dollar Empire Grade - Complete table definitions for layout management
 */

import { 
  pgTable, text, integer, timestamp, json, boolean, uuid, numeric, 
  varchar, serial, index, primaryKey, foreignKey 
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// Layout Templates - Base templates for different layout types
export const layoutTemplates = pgTable('layout_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }).notNull(), // 'landing', 'dashboard', 'product', etc.
  elements: json('elements').notNull(), // Array of LayoutElement objects
  defaultRules: json('default_rules'), // Default mutation rules for this template
  metadata: json('metadata'), // Template-specific metadata
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: varchar('created_by', { length: 255 }),
  version: varchar('version', { length: 50 }).default('1.0.0')
}, (table) => ({
  categoryIdx: index('layout_templates_category_idx').on(table.category),
  activeIdx: index('layout_templates_active_idx').on(table.isActive),
  nameIdx: index('layout_templates_name_idx').on(table.name)
}));

// Layout Instances - Generated personalized layouts for users/sessions
export const layoutInstances = pgTable('layout_instances', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: uuid('template_id').notNull().references(() => layoutTemplates.id),
  userId: varchar('user_id', { length: 255 }), // Optional - for logged-in users
  sessionId: varchar('session_id', { length: 255 }).notNull(),
  deviceType: varchar('device_type', { length: 50 }).notNull(), // 'mobile', 'tablet', 'desktop'
  screenSize: json('screen_size'), // { width: number, height: number }
  elements: json('elements').notNull(), // Current state of layout elements
  personalizations: json('personalizations'), // Applied personalizations
  appliedRules: json('applied_rules'), // Rules that were applied
  abTestSegment: varchar('ab_test_segment', { length: 50 }),
  generatedAt: timestamp('generated_at').defaultNow(),
  lastMutated: timestamp('last_mutated'),
  isActive: boolean('is_active').default(true),
  confidenceScore: numeric('confidence_score', { precision: 3, scale: 2 }).default('0.50'),
  conversionGoal: varchar('conversion_goal', { length: 255 }),
  metadata: json('metadata')
}, (table) => ({
  templateIdx: index('layout_instances_template_idx').on(table.templateId),
  sessionIdx: index('layout_instances_session_idx').on(table.sessionId),
  userIdx: index('layout_instances_user_idx').on(table.userId),
  deviceIdx: index('layout_instances_device_idx').on(table.deviceType),
  activeIdx: index('layout_instances_active_idx').on(table.isActive),
  generatedAtIdx: index('layout_instances_generated_at_idx').on(table.generatedAt)
}));

// Layout Mutations - Track all mutations applied to layouts
export const layoutMutations = pgTable('layout_mutations', {
  id: uuid('id').primaryKey().defaultRandom(),
  instanceId: uuid('instance_id').notNull().references(() => layoutInstances.id),
  elementId: varchar('element_id', { length: 255 }).notNull(),
  mutationType: varchar('mutation_type', { length: 50 }).notNull(), // 'move', 'resize', 'replace', etc.
  mutationData: json('mutation_data').notNull(), // Mutation details
  triggerType: varchar('trigger_type', { length: 50 }), // 'device', 'behavior', 'time', etc.
  triggerData: json('trigger_data'), // What triggered this mutation
  appliedAt: timestamp('applied_at').defaultNow(),
  success: boolean('success').default(true),
  errorMessage: text('error_message'),
  performanceImpact: numeric('performance_impact', { precision: 5, scale: 2 }), // milliseconds
  reverted: boolean('reverted').default(false),
  revertedAt: timestamp('reverted_at')
}, (table) => ({
  instanceIdx: index('layout_mutations_instance_idx').on(table.instanceId),
  elementIdx: index('layout_mutations_element_idx').on(table.elementId),
  typeIdx: index('layout_mutations_type_idx').on(table.mutationType),
  appliedAtIdx: index('layout_mutations_applied_at_idx').on(table.appliedAt),
  triggerIdx: index('layout_mutations_trigger_idx').on(table.triggerType)
}));

// Layout Analytics - Performance and engagement metrics for layouts
export const layoutAnalytics = pgTable('layout_analytics', {
  id: uuid('id').primaryKey().defaultRandom(),
  instanceId: uuid('instance_id').notNull().references(() => layoutInstances.id),
  templateId: uuid('template_id').notNull().references(() => layoutTemplates.id),
  sessionId: varchar('session_id', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 255 }),
  pageViews: integer('page_views').default(0),
  timeOnPage: integer('time_on_page').default(0), // seconds
  interactions: json('interactions'), // Click heatmap, scroll depth, etc.
  conversions: json('conversions'), // Conversion events
  elementsEngagement: json('elements_engagement'), // Per-element engagement metrics
  loadTime: numeric('load_time', { precision: 5, scale: 2 }), // milliseconds
  errorCount: integer('error_count').default(0),
  bounceRate: numeric('bounce_rate', { precision: 3, scale: 2 }),
  conversionRate: numeric('conversion_rate', { precision: 5, scale: 4 }),
  satisfactionScore: numeric('satisfaction_score', { precision: 3, scale: 2 }),
  timestamp: timestamp('timestamp').defaultNow(),
  deviceType: varchar('device_type', { length: 50 }),
  browserInfo: json('browser_info'),
  locationData: json('location_data')
}, (table) => ({
  instanceIdx: index('layout_analytics_instance_idx').on(table.instanceId),
  templateIdx: index('layout_analytics_template_idx').on(table.templateId),
  sessionIdx: index('layout_analytics_session_idx').on(table.sessionId),
  timestampIdx: index('layout_analytics_timestamp_idx').on(table.timestamp),
  conversionsIdx: index('layout_analytics_conversions_idx').on(table.conversionRate)
}));

// User Layout Preferences - Store user's layout customizations
export const userLayoutPreferences = pgTable('user_layout_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  layoutId: uuid('layout_id').notNull(), // Can reference templates or instances
  elementId: varchar('element_id', { length: 255 }).notNull(),
  preferences: json('preferences').notNull(), // Position, style, content preferences
  preferenceType: varchar('preference_type', { length: 50 }).notNull(), // 'position', 'style', 'content'
  strength: numeric('strength', { precision: 3, scale: 2 }).default('1.00'), // How strong this preference is
  source: varchar('source', { length: 100 }).default('user_action'), // 'user_action', 'ai_suggestion', 'ab_test'
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  lastUsed: timestamp('last_used').defaultNow(),
  usageCount: integer('usage_count').default(1),
  effectiveness: numeric('effectiveness', { precision: 3, scale: 2 }) // How effective this preference has been
}, (table) => ({
  userIdx: index('user_layout_preferences_user_idx').on(table.userId),
  layoutIdx: index('user_layout_preferences_layout_idx').on(table.layoutId),
  elementIdx: index('user_layout_preferences_element_idx').on(table.elementId),
  typeIdx: index('user_layout_preferences_type_idx').on(table.preferenceType),
  strengthIdx: index('user_layout_preferences_strength_idx').on(table.strength)
}));

// Layout A/B Tests - A/B testing for different layout variations
export const layoutAbTests = pgTable('layout_ab_tests', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  templateId: uuid('template_id').notNull().references(() => layoutTemplates.id),
  variations: json('variations').notNull(), // Array of variation configurations
  trafficSplit: json('traffic_split').notNull(), // How to split traffic between variations
  targetMetric: varchar('target_metric', { length: 100 }).notNull(), // 'conversion_rate', 'engagement', etc.
  hypothesis: text('hypothesis'),
  startDate: timestamp('start_date').defaultNow(),
  endDate: timestamp('end_date'),
  status: varchar('status', { length: 50 }).default('draft'), // 'draft', 'running', 'paused', 'completed'
  participants: integer('participants').default(0),
  results: json('results'), // Test results and statistical analysis
  winnerVariation: varchar('winner_variation', { length: 100 }),
  confidenceLevel: numeric('confidence_level', { precision: 3, scale: 2 }),
  significanceThreshold: numeric('significance_threshold', { precision: 3, scale: 2 }).default('0.95'),
  createdBy: varchar('created_by', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  templateIdx: index('layout_ab_tests_template_idx').on(table.templateId),
  statusIdx: index('layout_ab_tests_status_idx').on(table.status),
  dateIdx: index('layout_ab_tests_date_idx').on(table.startDate, table.endDate),
  metricIdx: index('layout_ab_tests_metric_idx').on(table.targetMetric)
}));

// Layout Personalization Rules - AI-driven personalization rules
export const layoutPersonalization = pgTable('layout_personalization', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  ruleType: varchar('rule_type', { length: 50 }).notNull(), // 'behavioral', 'demographic', 'contextual'
  conditions: json('conditions').notNull(), // Conditions that trigger this personalization
  mutations: json('mutations').notNull(), // Layout mutations to apply
  priority: integer('priority').default(100), // Higher number = higher priority
  isActive: boolean('is_active').default(true),
  effectivenessScore: numeric('effectiveness_score', { precision: 3, scale: 2 }),
  applicationCount: integer('application_count').default(0),
  conversionLift: numeric('conversion_lift', { precision: 5, scale: 4 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  lastApplied: timestamp('last_applied'),
  createdBy: varchar('created_by', { length: 255 }),
  tags: json('tags') // For categorization and filtering
}, (table) => ({
  typeIdx: index('layout_personalization_type_idx').on(table.ruleType),
  priorityIdx: index('layout_personalization_priority_idx').on(table.priority),
  activeIdx: index('layout_personalization_active_idx').on(table.isActive),
  effectivenessIdx: index('layout_personalization_effectiveness_idx').on(table.effectivenessScore)
}));

// Define relationships between tables
export const layoutTemplatesRelations = relations(layoutTemplates, ({ many }) => ({
  instances: many(layoutInstances),
  analytics: many(layoutAnalytics),
  abTests: many(layoutAbTests)
}));

export const layoutInstancesRelations = relations(layoutInstances, ({ one, many }) => ({
  template: one(layoutTemplates, {
    fields: [layoutInstances.templateId],
    references: [layoutTemplates.id]
  }),
  mutations: many(layoutMutations),
  analytics: many(layoutAnalytics)
}));

export const layoutMutationsRelations = relations(layoutMutations, ({ one }) => ({
  instance: one(layoutInstances, {
    fields: [layoutMutations.instanceId],
    references: [layoutInstances.id]
  })
}));

export const layoutAnalyticsRelations = relations(layoutAnalytics, ({ one }) => ({
  instance: one(layoutInstances, {
    fields: [layoutAnalytics.instanceId],
    references: [layoutInstances.id]
  }),
  template: one(layoutTemplates, {
    fields: [layoutAnalytics.templateId],
    references: [layoutTemplates.id]
  })
}));

export const layoutAbTestsRelations = relations(layoutAbTests, ({ one }) => ({
  template: one(layoutTemplates, {
    fields: [layoutAbTests.templateId],
    references: [layoutTemplates.id]
  })
}));

// Type definitions for TypeScript
export type LayoutTemplate = typeof layoutTemplates.$inferSelect;
export type NewLayoutTemplate = typeof layoutTemplates.$inferInsert;

export type LayoutInstance = typeof layoutInstances.$inferSelect;
export type NewLayoutInstance = typeof layoutInstances.$inferInsert;

export type LayoutMutation = typeof layoutMutations.$inferSelect;
export type NewLayoutMutation = typeof layoutMutations.$inferInsert;

export type LayoutAnalytics = typeof layoutAnalytics.$inferSelect;
export type NewLayoutAnalytics = typeof layoutAnalytics.$inferInsert;

export type UserLayoutPreference = typeof userLayoutPreferences.$inferSelect;
export type NewUserLayoutPreference = typeof userLayoutPreferences.$inferInsert;

export type LayoutAbTest = typeof layoutAbTests.$inferSelect;
export type NewLayoutAbTest = typeof layoutAbTests.$inferInsert;

export type LayoutPersonalization = typeof layoutPersonalization.$inferSelect;
export type NewLayoutPersonalization = typeof layoutPersonalization.$inferInsert;