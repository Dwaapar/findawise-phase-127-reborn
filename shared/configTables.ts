import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, uuid, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ==========================================
// CENTRAL CONFIG ENGINE - ENTERPRISE SCHEMA
// ==========================================

// Core Configuration Registry
export const configRegistry = pgTable("config_registry", {
  id: serial("id").primaryKey(),
  configId: varchar("config_id", { length: 255 }).notNull().unique(),
  version: varchar("version", { length: 50 }).notNull(),
  
  // Meta Information
  vertical: varchar("vertical", { length: 100 }), // finance, health, saas, travel, security
  locale: varchar("locale", { length: 10 }).default("en-US"),
  userPersona: varchar("user_persona", { length: 100 }), // archetype classification
  intentCluster: varchar("intent_cluster", { length: 100 }), // user intent grouping
  
  // Layout & UI Configuration
  layoutType: varchar("layout_type", { length: 50 }).default("standard"), // standard, minimal, premium
  featureFlags: jsonb("feature_flags").default({}),
  abTestVariant: varchar("ab_test_variant", { length: 100 }),
  
  // Configuration Data
  configData: jsonb("config_data").notNull(),
  schema: jsonb("schema"), // JSON Schema for validation
  
  // Metadata
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  tags: jsonb("tags").default([]),
  category: varchar("category", { length: 100 }),
  
  // Status & Control
  isActive: boolean("is_active").default(true),
  isLocked: boolean("is_locked").default(false),
  deprecated: boolean("deprecated").default(false),
  
  // Change Tracking
  author: varchar("author", { length: 255 }),
  lastModifiedBy: varchar("last_modified_by", { length: 255 }),
  notes: text("notes"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastDeployedAt: timestamp("last_deployed_at"),
});

// Configuration Change History
export const configChangeHistory = pgTable("config_change_history", {
  id: serial("id").primaryKey(),
  changeId: uuid("change_id").defaultRandom(),
  configId: varchar("config_id", { length: 255 }).notNull(),
  
  // Change Details
  changeType: varchar("change_type", { length: 50 }).notNull(), // create, update, delete, rollback
  previousVersion: varchar("previous_version", { length: 50 }),
  newVersion: varchar("new_version", { length: 50 }),
  
  // Change Data
  previousData: jsonb("previous_data"),
  newData: jsonb("new_data"),
  diff: jsonb("diff"), // computed difference
  
  // Change Context
  reason: text("reason"),
  rollbackId: varchar("rollback_id", { length: 255 }), // links to config snapshot
  
  // Author Information
  userId: varchar("user_id", { length: 255 }),
  username: varchar("username", { length: 255 }),
  userRole: varchar("user_role", { length: 100 }),
  
  // Source Information
  source: varchar("source", { length: 100 }).default("manual"), // manual, api, automation, migration
  sourceDetails: jsonb("source_details"),
  
  // Approval Workflow
  requiresApproval: boolean("requires_approval").default(false),
  approvedBy: varchar("approved_by", { length: 255 }),
  approvedAt: timestamp("approved_at"),
  approvalNotes: text("approval_notes"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
});

// Configuration Snapshots for Rollback
export const configSnapshots = pgTable("config_snapshots", {
  id: serial("id").primaryKey(),
  snapshotId: varchar("snapshot_id", { length: 255 }).notNull().unique(),
  configId: varchar("config_id", { length: 255 }).notNull(),
  version: varchar("version", { length: 50 }).notNull(),
  
  // Snapshot Data
  configData: jsonb("config_data").notNull(),
  metadata: jsonb("metadata"),
  
  // Snapshot Context
  snapshotType: varchar("snapshot_type", { length: 50 }).default("manual"), // manual, auto, pre-deploy
  description: text("description"),
  
  // Validation Status
  isValid: boolean("is_valid").default(true),
  validationErrors: jsonb("validation_errors"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // for automatic cleanup
});

// Configuration Access Control
export const configPermissions = pgTable("config_permissions", {
  id: serial("id").primaryKey(),
  configId: varchar("config_id", { length: 255 }).notNull(),
  
  // Access Control
  userId: varchar("user_id", { length: 255 }),
  userRole: varchar("user_role", { length: 100 }),
  teamId: varchar("team_id", { length: 255 }),
  
  // Permissions
  canRead: boolean("can_read").default(true),
  canWrite: boolean("can_write").default(false),
  canDelete: boolean("can_delete").default(false),
  canApprove: boolean("can_approve").default(false),
  canRollback: boolean("can_rollback").default(false),
  
  // Scope Restrictions
  allowedEnvironments: jsonb("allowed_environments").default(["development"]),
  allowedVerticals: jsonb("allowed_verticals"),
  allowedLocales: jsonb("allowed_locales"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Configuration Federation Sync
export const configFederationSync = pgTable("config_federation_sync", {
  id: serial("id").primaryKey(),
  syncId: uuid("sync_id").defaultRandom(),
  configId: varchar("config_id", { length: 255 }).notNull(),
  
  // Neuron Information
  neuronId: varchar("neuron_id", { length: 255 }).notNull(),
  neuronType: varchar("neuron_type", { length: 100 }),
  neuronVersion: varchar("neuron_version", { length: 50 }),
  
  // Sync Details
  syncType: varchar("sync_type", { length: 50 }).notNull(), // push, pull, subscribe
  syncStatus: varchar("sync_status", { length: 50 }).default("pending"), // pending, success, failed, partial
  
  // Sync Data
  configVersion: varchar("config_version", { length: 50 }),
  syncedData: jsonb("synced_data"),
  overrides: jsonb("overrides"), // neuron-specific overrides
  
  // Conflict Resolution
  conflicts: jsonb("conflicts"),
  conflictResolution: varchar("conflict_resolution", { length: 50 }), // auto, manual, skip
  
  // Performance Tracking
  syncDuration: integer("sync_duration"), // milliseconds
  retryCount: integer("retry_count").default(0),
  lastError: text("last_error"),
  
  // Timestamps
  syncStartedAt: timestamp("sync_started_at").defaultNow(),
  syncCompletedAt: timestamp("sync_completed_at"),
  nextSyncAt: timestamp("next_sync_at"),
});

// Configuration Performance Metrics
export const configPerformanceMetrics = pgTable("config_performance_metrics", {
  id: serial("id").primaryKey(),
  metricId: uuid("metric_id").defaultRandom(),
  configId: varchar("config_id", { length: 255 }).notNull(),
  
  // Performance Data
  loadTime: real("load_time"), // milliseconds
  cacheHitRate: real("cache_hit_rate"), // percentage
  validationTime: real("validation_time"), // milliseconds
  syncTime: real("sync_time"), // milliseconds
  
  // Usage Statistics
  accessCount: integer("access_count").default(0),
  updateCount: integer("update_count").default(0),
  errorCount: integer("error_count").default(0),
  
  // Resource Usage
  memoryUsage: integer("memory_usage"), // bytes
  cpuUsage: real("cpu_usage"), // percentage
  networkUsage: integer("network_usage"), // bytes
  
  // Context Information
  environment: varchar("environment", { length: 50 }),
  userAgent: varchar("user_agent", { length: 255 }),
  region: varchar("region", { length: 50 }),
  
  // Timestamps
  recordedAt: timestamp("recorded_at").defaultNow(),
  dayBucket: varchar("day_bucket", { length: 10 }), // YYYY-MM-DD for aggregation
});

// Configuration Validation Rules
export const configValidationRules = pgTable("config_validation_rules", {
  id: serial("id").primaryKey(),
  ruleId: varchar("rule_id", { length: 255 }).notNull().unique(),
  
  // Rule Definition
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  
  // Rule Logic
  ruleType: varchar("rule_type", { length: 50 }).notNull(), // schema, business, security, performance
  ruleDefinition: jsonb("rule_definition").notNull(),
  severity: varchar("severity", { length: 50 }).default("error"), // error, warning, info
  
  // Applicability
  appliesTo: jsonb("applies_to"), // config types, verticals, etc.
  conditions: jsonb("conditions"), // when to apply the rule
  
  // Status
  isActive: boolean("is_active").default(true),
  isBuiltIn: boolean("is_built_in").default(false),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI/LLM Integration Fields
export const configAiMetadata = pgTable("config_ai_metadata", {
  id: serial("id").primaryKey(),
  configId: varchar("config_id", { length: 255 }).notNull(),
  
  // AI Context
  promptSnippets: jsonb("prompt_snippets"), // LLM prompt templates
  ragContext: jsonb("rag_context"), // RAG retrieval context
  aiAssistMetadata: jsonb("ai_assist_metadata"), // AI assistance data
  
  // Training Data
  trainingTags: jsonb("training_tags"), // for AI training
  trainingExamples: jsonb("training_examples"), // example configurations
  feedbackData: jsonb("feedback_data"), // user feedback for AI improvement
  
  // AI-Generated Content
  aiGeneratedFields: jsonb("ai_generated_fields"), // tracks AI-generated content
  confidenceScores: jsonb("confidence_scores"), // AI confidence in suggestions
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ==========================================
// SCHEMA EXPORTS FOR VALIDATION
// ==========================================

export const insertConfigRegistrySchema = createInsertSchema(configRegistry).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertConfigChangeHistorySchema = createInsertSchema(configChangeHistory).omit({
  id: true,
  changeId: true,
  createdAt: true,
});

export const insertConfigSnapshotSchema = createInsertSchema(configSnapshots).omit({
  id: true,
  createdAt: true,
});

export const insertConfigPermissionSchema = createInsertSchema(configPermissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertConfigFederationSyncSchema = createInsertSchema(configFederationSync).omit({
  id: true,
  syncId: true,
  syncStartedAt: true,
});

export const insertConfigPerformanceMetricSchema = createInsertSchema(configPerformanceMetrics).omit({
  id: true,
  metricId: true,
  recordedAt: true,
});

export const insertConfigValidationRuleSchema = createInsertSchema(configValidationRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertConfigAiMetadataSchema = createInsertSchema(configAiMetadata).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ==========================================
// TYPE EXPORTS
// ==========================================

export type ConfigRegistry = typeof configRegistry.$inferSelect;
export type InsertConfigRegistry = z.infer<typeof insertConfigRegistrySchema>;

export type ConfigChangeHistory = typeof configChangeHistory.$inferSelect;
export type InsertConfigChangeHistory = z.infer<typeof insertConfigChangeHistorySchema>;

export type ConfigSnapshot = typeof configSnapshots.$inferSelect;
export type InsertConfigSnapshot = z.infer<typeof insertConfigSnapshotSchema>;

export type ConfigPermission = typeof configPermissions.$inferSelect;
export type InsertConfigPermission = z.infer<typeof insertConfigPermissionSchema>;

export type ConfigFederationSync = typeof configFederationSync.$inferSelect;
export type InsertConfigFederationSync = z.infer<typeof insertConfigFederationSyncSchema>;

export type ConfigPerformanceMetric = typeof configPerformanceMetrics.$inferSelect;
export type InsertConfigPerformanceMetric = z.infer<typeof insertConfigPerformanceMetricSchema>;

export type ConfigValidationRule = typeof configValidationRules.$inferSelect;
export type InsertConfigValidationRule = z.infer<typeof insertConfigValidationRuleSchema>;

export type ConfigAiMetadata = typeof configAiMetadata.$inferSelect;
export type InsertConfigAiMetadata = z.infer<typeof insertConfigAiMetadataSchema>;