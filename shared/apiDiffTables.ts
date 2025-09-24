/**
 * Live API Diff Tracker - Database Schema
 * Empire-Grade, Migration-Proof, Billion-Dollar Standards
 * 
 * Complete database schema for real-time API change detection,
 * monitoring, alerting, and versioning system
 */

import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, real, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ================================
// API SCHEMAS & ENDPOINTS TRACKING
// ================================

/**
 * API Schema Snapshots - Complete API schema versioning
 */
export const apiSchemaSnapshots = pgTable('api_schema_snapshots', {
  id: serial('id').primaryKey(),
  schema_hash: varchar('schema_hash', { length: 64 }).notNull().unique(),
  version: varchar('version', { length: 50 }).notNull(),
  module_name: varchar('module_name', { length: 100 }).notNull(),
  neuron_id: varchar('neuron_id', { length: 100 }),
  schema_type: varchar('schema_type', { length: 20 }).notNull(), // 'openapi', 'graphql', 'typescript', 'custom'
  schema_content: jsonb('schema_content').notNull(), // Full schema definition
  endpoints_count: integer('endpoints_count').notNull().default(0),
  metadata: jsonb('metadata'), // Deploy hash, author, commit info
  created_at: timestamp('created_at').defaultNow().notNull(),
  created_by: varchar('created_by', { length: 100 }),
  deploy_hash: varchar('deploy_hash', { length: 64 }),
  environment: varchar('environment', { length: 20 }).default('production'),
  is_active: boolean('is_active').default(true).notNull()
}, (table) => ({
  moduleVersionIdx: index('idx_api_schema_module_version').on(table.module_name, table.version),
  hashIdx: uniqueIndex('idx_api_schema_hash').on(table.schema_hash),
  activeIdx: index('idx_api_schema_active').on(table.is_active, table.created_at),
  neuronIdx: index('idx_api_schema_neuron').on(table.neuron_id)
}));

/**
 * API Endpoints Registry - Individual endpoint tracking
 */
export const apiEndpoints = pgTable('api_endpoints', {
  id: text('id').primaryKey(),
  endpoint_hash: varchar('endpoint_hash', { length: 64 }).notNull(),
  snapshot_id: integer('snapshot_id').references(() => apiSchemaSnapshots.id),
  path: varchar('path', { length: 500 }).notNull(),
  method: varchar('method', { length: 10 }).notNull(), // GET, POST, PUT, DELETE, etc.
  description: text('description'),
  parameters: jsonb('parameters'), // Parameters schema
  request_body: jsonb('request_body'), // Request body schema
  responses: jsonb('responses'), // Response schemas
  authentication: jsonb('authentication'), // Auth requirements
  middleware: jsonb('middleware'), // Applied middleware
  rate_limits: jsonb('rate_limits'), // Rate limiting config
  permissions: jsonb('permissions'), // Required permissions
  tags: jsonb('tags'), // Endpoint tags/categories
  is_deprecated: boolean('is_deprecated').default(false).notNull(),
  is_internal: boolean('is_internal').default(false).notNull(),
  last_modified: timestamp('last_modified').defaultNow().notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  endpointHashIdx: index('idx_api_endpoint_hash').on(table.endpoint_hash),
  snapshotIdx: index('idx_api_endpoint_snapshot').on(table.snapshot_id),
  pathMethodIdx: index('idx_api_endpoint_path_method').on(table.path, table.method),
  deprecatedIdx: index('idx_api_endpoint_deprecated').on(table.is_deprecated)
}));

// ================================
// API DIFF TRACKING & ANALYSIS
// ================================

/**
 * API Diffs - Complete change tracking between versions
 */
export const apiDiffs = pgTable('api_diffs', {
  id: serial('id').primaryKey(),
  diff_hash: varchar('diff_hash', { length: 64 }).notNull().unique(),
  from_snapshot_id: integer('from_snapshot_id').references(() => apiSchemaSnapshots.id).notNull(),
  to_snapshot_id: integer('to_snapshot_id').references(() => apiSchemaSnapshots.id).notNull(),
  module_name: varchar('module_name', { length: 100 }).notNull(),
  version_from: varchar('version_from', { length: 50 }).notNull(),
  version_to: varchar('version_to', { length: 50 }).notNull(),
  
  // Change Statistics
  added_endpoints_count: integer('added_endpoints_count').default(0).notNull(),
  removed_endpoints_count: integer('removed_endpoints_count').default(0).notNull(),
  modified_endpoints_count: integer('modified_endpoints_count').default(0).notNull(),
  breaking_changes_count: integer('breaking_changes_count').default(0).notNull(),
  
  // Change Details
  added_endpoints: jsonb('added_endpoints'), // Array of added endpoint details
  removed_endpoints: jsonb('removed_endpoints'), // Array of removed endpoint details
  modified_endpoints: jsonb('modified_endpoints'), // Array of modified endpoint details
  breaking_changes: jsonb('breaking_changes'), // Array of breaking change details
  
  // Risk Assessment
  risk_level: varchar('risk_level', { length: 20 }).notNull(), // 'low', 'medium', 'high', 'critical'
  impact_score: real('impact_score').notNull().default(0), // 0-100 impact score
  compatibility_score: real('compatibility_score').notNull().default(100), // 0-100 compatibility score
  
  // Analysis Results
  analysis_summary: text('analysis_summary'),
  ai_summary: text('ai_summary'), // LLM-generated summary
  recommendations: jsonb('recommendations'), // Recommended actions
  affected_modules: jsonb('affected_modules'), // Cross-module impact analysis
  
  // Metadata
  created_at: timestamp('created_at').defaultNow().notNull(),
  created_by: varchar('created_by', { length: 100 }),
  deploy_hash: varchar('deploy_hash', { length: 64 }),
  commit_hash: varchar('commit_hash', { length: 64 }),
  author: varchar('author', { length: 100 }),
  reviewed: boolean('reviewed').default(false).notNull(),
  reviewed_by: varchar('reviewed_by', { length: 100 }),
  reviewed_at: timestamp('reviewed_at')
}, (table) => ({
  diffHashIdx: uniqueIndex('idx_api_diff_hash').on(table.diff_hash),
  moduleIdx: index('idx_api_diff_module').on(table.module_name, table.created_at),
  riskIdx: index('idx_api_diff_risk').on(table.risk_level, table.impact_score),
  versionsIdx: index('idx_api_diff_versions').on(table.version_from, table.version_to),
  reviewedIdx: index('idx_api_diff_reviewed').on(table.reviewed)
}));

/**
 * API Change Events - Real-time change event stream
 */
export const apiChangeEvents = pgTable('api_change_events', {
  id: text('id').primaryKey(),
  event_id: varchar('event_id', { length: 64 }).notNull().unique(),
  diff_id: integer('diff_id').references(() => apiDiffs.id),
  event_type: varchar('event_type', { length: 50 }).notNull(), // 'endpoint_added', 'endpoint_removed', 'schema_changed', etc.
  severity: varchar('severity', { length: 20 }).notNull(), // 'info', 'warning', 'error', 'critical'
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  details: jsonb('details'), // Event-specific details
  affected_endpoint: varchar('affected_endpoint', { length: 500 }),
  change_data: jsonb('change_data'), // Before/after data
  
  // Notification Tracking
  notifications_sent: boolean('notifications_sent').default(false).notNull(),
  notification_channels: jsonb('notification_channels'), // Channels notified
  notification_attempts: integer('notification_attempts').default(0).notNull(),
  last_notification_at: timestamp('last_notification_at'),
  
  // Resolution Tracking
  is_resolved: boolean('is_resolved').default(false).notNull(),
  resolved_by: varchar('resolved_by', { length: 100 }),
  resolved_at: timestamp('resolved_at'),
  resolution_notes: text('resolution_notes'),
  
  created_at: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  eventIdIdx: uniqueIndex('idx_api_change_event_id').on(table.event_id),
  diffIdx: index('idx_api_change_diff').on(table.diff_id),
  severityIdx: index('idx_api_change_severity').on(table.severity, table.created_at),
  resolvedIdx: index('idx_api_change_resolved').on(table.is_resolved),
  notificationIdx: index('idx_api_change_notification').on(table.notifications_sent)
}));

// ================================
// MONITORING & ALERTING
// ================================

/**
 * API Monitoring Rules - Configurable monitoring and alerting rules
 */
export const apiMonitoringRules = pgTable('api_monitoring_rules', {
  id: serial('id').primaryKey(),
  rule_name: varchar('rule_name', { length: 100 }).notNull().unique(),
  module_filter: varchar('module_filter', { length: 100 }), // Module pattern to monitor
  endpoint_filter: varchar('endpoint_filter', { length: 500 }), // Endpoint pattern to monitor
  change_types: jsonb('change_types').notNull(), // Array of change types to monitor
  severity_threshold: varchar('severity_threshold', { length: 20 }).default('warning').notNull(),
  
  // Alert Configuration
  alert_channels: jsonb('alert_channels').notNull(), // Channels to alert (email, slack, webhook, etc.)
  alert_template: text('alert_template'), // Custom alert message template
  cooldown_minutes: integer('cooldown_minutes').default(60).notNull(), // Minimum time between alerts
  
  // Conditions
  conditions: jsonb('conditions'), // Complex conditions for triggering
  aggregation_window: integer('aggregation_window').default(5).notNull(), // Minutes to aggregate events
  
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  created_by: varchar('created_by', { length: 100 }).notNull(),
  last_triggered: timestamp('last_triggered'),
  trigger_count: integer('trigger_count').default(0).notNull()
}, (table) => ({
  ruleNameIdx: uniqueIndex('idx_api_monitoring_rule_name').on(table.rule_name),
  moduleIdx: index('idx_api_monitoring_module').on(table.module_filter),
  activeIdx: index('idx_api_monitoring_active').on(table.is_active)
}));

/**
 * API Alert History - Complete alert tracking
 */
export const apiAlertHistory = pgTable('api_alert_history', {
  id: serial('id').primaryKey(),
  alert_id: varchar('alert_id', { length: 64 }).notNull().unique(),
  rule_id: integer('rule_id').references(() => apiMonitoringRules.id).notNull(),
  diff_id: integer('diff_id').references(() => apiDiffs.id),
  event_id: text('event_id'),
  
  alert_type: varchar('alert_type', { length: 50 }).notNull(),
  severity: varchar('severity', { length: 20 }).notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  message: text('message').notNull(),
  details: jsonb('details'),
  
  // Delivery Tracking
  channels_sent: jsonb('channels_sent'), // Channels the alert was sent to
  delivery_status: jsonb('delivery_status'), // Status per channel
  delivery_attempts: integer('delivery_attempts').default(0).notNull(),
  
  // Response Tracking
  acknowledged: boolean('acknowledged').default(false).notNull(),
  acknowledged_by: varchar('acknowledged_by', { length: 100 }),
  acknowledged_at: timestamp('acknowledged_at'),
  response_time_seconds: integer('response_time_seconds'),
  
  created_at: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  alertIdIdx: uniqueIndex('idx_api_alert_id').on(table.alert_id),
  ruleIdx: index('idx_api_alert_rule').on(table.rule_id, table.created_at),
  severityIdx: index('idx_api_alert_severity').on(table.severity, table.created_at),
  acknowledgedIdx: index('idx_api_alert_acknowledged').on(table.acknowledged)
}));

// ================================
// VERSIONING & ROLLBACK
// ================================

/**
 * API Version History - Complete version management
 */
export const apiVersionHistory = pgTable('api_version_history', {
  id: serial('id').primaryKey(),
  version_id: varchar('version_id', { length: 64 }).notNull().unique(),
  module_name: varchar('module_name', { length: 100 }).notNull(),
  version: varchar('version', { length: 50 }).notNull(),
  previous_version: varchar('previous_version', { length: 50 }),
  
  // Version Metadata
  release_type: varchar('release_type', { length: 20 }).notNull(), // 'major', 'minor', 'patch', 'hotfix'
  release_notes: text('release_notes'),
  changelog: jsonb('changelog'), // Structured changelog
  migration_notes: text('migration_notes'),
  breaking_changes: jsonb('breaking_changes'),
  
  // Archive Data
  schema_archive: jsonb('schema_archive'), // Complete schema at this version
  configuration_archive: jsonb('configuration_archive'), // Configuration at this version
  dependencies_archive: jsonb('dependencies_archive'), // Dependencies at this version
  
  // Rollback Support
  rollback_available: boolean('rollback_available').default(true).notNull(),
  rollback_script: text('rollback_script'), // Automated rollback script
  rollback_notes: text('rollback_notes'),
  
  // Deployment Tracking
  deployed: boolean('deployed').default(false).notNull(),
  deployed_at: timestamp('deployed_at'),
  deployed_by: varchar('deployed_by', { length: 100 }),
  deployment_environment: varchar('deployment_environment', { length: 50 }),
  
  created_at: timestamp('created_at').defaultNow().notNull(),
  created_by: varchar('created_by', { length: 100 }).notNull()
}, (table) => ({
  versionIdIdx: uniqueIndex('idx_api_version_id').on(table.version_id),
  moduleVersionIdx: index('idx_api_version_module').on(table.module_name, table.version),
  deployedIdx: index('idx_api_version_deployed').on(table.deployed, table.deployed_at),
  rollbackIdx: index('idx_api_version_rollback').on(table.rollback_available)
}));

/**
 * API Rollback Operations - Rollback execution tracking
 */
export const apiRollbackOperations = pgTable('api_rollback_operations', {
  id: serial('id').primaryKey(),
  operation_id: varchar('operation_id', { length: 64 }).notNull().unique(),
  version_history_id: integer('version_history_id').references(() => apiVersionHistory.id).notNull(),
  module_name: varchar('module_name', { length: 100 }).notNull(),
  from_version: varchar('from_version', { length: 50 }).notNull(),
  to_version: varchar('to_version', { length: 50 }).notNull(),
  
  // Operation Details
  operation_type: varchar('operation_type', { length: 20 }).notNull(), // 'rollback', 'preview', 'test'
  reason: text('reason'),
  approval_required: boolean('approval_required').default(true).notNull(),
  approved: boolean('approved').default(false).notNull(),
  approved_by: varchar('approved_by', { length: 100 }),
  approved_at: timestamp('approved_at'),
  
  // Execution Tracking
  status: varchar('status', { length: 20 }).default('pending').notNull(), // 'pending', 'executing', 'completed', 'failed', 'cancelled'
  started_at: timestamp('started_at'),
  completed_at: timestamp('completed_at'),
  execution_log: text('execution_log'),
  error_details: text('error_details'),
  
  // Impact Assessment
  affected_endpoints: jsonb('affected_endpoints'),
  impact_assessment: text('impact_assessment'),
  downtime_estimate: integer('downtime_estimate'), // Estimated downtime in seconds
  
  created_at: timestamp('created_at').defaultNow().notNull(),
  created_by: varchar('created_by', { length: 100 }).notNull()
}, (table) => ({
  operationIdIdx: uniqueIndex('idx_api_rollback_operation_id').on(table.operation_id),
  moduleIdx: index('idx_api_rollback_module').on(table.module_name, table.created_at),
  statusIdx: index('idx_api_rollback_status').on(table.status),
  approvedIdx: index('idx_api_rollback_approved').on(table.approved)
}));

// ================================
// EXPORT & COMPLIANCE
// ================================

/**
 * API Export Operations - Data export and compliance tracking
 */
export const apiExportOperations = pgTable('api_export_operations', {
  id: serial('id').primaryKey(),
  export_id: varchar('export_id', { length: 64 }).notNull().unique(),
  export_type: varchar('export_type', { length: 50 }).notNull(), // 'full', 'module', 'diff', 'compliance'
  format: varchar('format', { length: 20 }).notNull(), // 'json', 'pdf', 'markdown', 'csv'
  
  // Export Configuration
  filters: jsonb('filters'), // Export filters and criteria
  modules: jsonb('modules'), // Modules to include
  date_range: jsonb('date_range'), // Date range for export
  include_sensitive: boolean('include_sensitive').default(false).notNull(),
  
  // Export Metadata
  file_path: varchar('file_path', { length: 500 }),
  file_size: integer('file_size'), // File size in bytes
  checksum: varchar('checksum', { length: 64 }), // File integrity checksum
  encryption_used: boolean('encryption_used').default(false).notNull(),
  compression_used: boolean('compression_used').default(false).notNull(),
  
  // Status Tracking
  status: varchar('status', { length: 20 }).default('pending').notNull(), // 'pending', 'processing', 'completed', 'failed'
  progress_percentage: integer('progress_percentage').default(0).notNull(),
  records_exported: integer('records_exported').default(0).notNull(),
  error_message: text('error_message'),
  
  // Access Control
  access_level: varchar('access_level', { length: 20 }).default('private').notNull(), // 'private', 'internal', 'compliance'
  expires_at: timestamp('expires_at'), // Auto-delete timestamp
  download_count: integer('download_count').default(0).notNull(),
  last_downloaded: timestamp('last_downloaded'),
  
  created_at: timestamp('created_at').defaultNow().notNull(),
  created_by: varchar('created_by', { length: 100 }).notNull()
}, (table) => ({
  exportIdIdx: uniqueIndex('idx_api_export_id').on(table.export_id),
  statusIdx: index('idx_api_export_status').on(table.status),
  createdByIdx: index('idx_api_export_created_by').on(table.created_by, table.created_at),
  expiresIdx: index('idx_api_export_expires').on(table.expires_at)
}));

// ================================
// ANALYTICS & REPORTING
// ================================

/**
 * API Analytics Summary - Aggregated analytics data
 */
export const apiAnalyticsSummary = pgTable('api_analytics_summary', {
  id: serial('id').primaryKey(),
  summary_id: varchar('summary_id', { length: 64 }).notNull().unique(),
  period_type: varchar('period_type', { length: 20 }).notNull(), // 'hourly', 'daily', 'weekly', 'monthly'
  period_start: timestamp('period_start').notNull(),
  period_end: timestamp('period_end').notNull(),
  module_name: varchar('module_name', { length: 100 }),
  
  // Change Statistics
  total_diffs: integer('total_diffs').default(0).notNull(),
  total_changes: integer('total_changes').default(0).notNull(),
  breaking_changes: integer('breaking_changes').default(0).notNull(),
  endpoints_added: integer('endpoints_added').default(0).notNull(),
  endpoints_removed: integer('endpoints_removed').default(0).notNull(),
  endpoints_modified: integer('endpoints_modified').default(0).notNull(),
  
  // Alert Statistics
  alerts_triggered: integer('alerts_triggered').default(0).notNull(),
  critical_alerts: integer('critical_alerts').default(0).notNull(),
  alerts_acknowledged: integer('alerts_acknowledged').default(0).notNull(),
  avg_response_time_seconds: real('avg_response_time_seconds'),
  
  // Quality Metrics
  api_stability_score: real('api_stability_score').default(100).notNull(), // 0-100 stability score
  documentation_coverage: real('documentation_coverage').default(0).notNull(), // 0-100 coverage score
  compatibility_score: real('compatibility_score').default(100).notNull(), // 0-100 compatibility score
  
  // Performance Metrics
  schema_validation_time_ms: real('schema_validation_time_ms'),
  diff_processing_time_ms: real('diff_processing_time_ms'),
  alert_delivery_time_ms: real('alert_delivery_time_ms'),
  
  created_at: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  summaryIdIdx: uniqueIndex('idx_api_analytics_summary_id').on(table.summary_id),
  periodIdx: index('idx_api_analytics_period').on(table.period_type, table.period_start),
  moduleIdx: index('idx_api_analytics_module').on(table.module_name, table.period_start)
}));

// ================================
// ZODS SCHEMAS FOR VALIDATION
// ================================

export const insertApiSchemaSnapshotSchema = createInsertSchema(apiSchemaSnapshots);
export const insertApiEndpointSchema = createInsertSchema(apiEndpoints);
export const insertApiDiffSchema = createInsertSchema(apiDiffs);
export const insertApiChangeEventSchema = createInsertSchema(apiChangeEvents);
export const insertApiMonitoringRuleSchema = createInsertSchema(apiMonitoringRules);
export const insertApiAlertHistorySchema = createInsertSchema(apiAlertHistory);
export const insertApiVersionHistorySchema = createInsertSchema(apiVersionHistory);
export const insertApiRollbackOperationSchema = createInsertSchema(apiRollbackOperations);
export const insertApiExportOperationSchema = createInsertSchema(apiExportOperations);
export const insertApiAnalyticsSummarySchema = createInsertSchema(apiAnalyticsSummary);

// ================================
// TYPE EXPORTS
// ================================

export type ApiSchemaSnapshot = typeof apiSchemaSnapshots.$inferSelect;
export type NewApiSchemaSnapshot = typeof apiSchemaSnapshots.$inferInsert;
export type ApiEndpoint = typeof apiEndpoints.$inferSelect;
export type NewApiEndpoint = typeof apiEndpoints.$inferInsert;
export type ApiDiff = typeof apiDiffs.$inferSelect;
export type NewApiDiff = typeof apiDiffs.$inferInsert;
export type ApiChangeEvent = typeof apiChangeEvents.$inferSelect;
export type NewApiChangeEvent = typeof apiChangeEvents.$inferInsert;
export type ApiMonitoringRule = typeof apiMonitoringRules.$inferSelect;
export type NewApiMonitoringRule = typeof apiMonitoringRules.$inferInsert;
export type ApiAlertHistory = typeof apiAlertHistory.$inferSelect;
export type NewApiAlertHistory = typeof apiAlertHistory.$inferInsert;
export type ApiVersionHistory = typeof apiVersionHistory.$inferSelect;
export type NewApiVersionHistory = typeof apiVersionHistory.$inferInsert;
export type ApiRollbackOperation = typeof apiRollbackOperations.$inferSelect;
export type NewApiRollbackOperation = typeof apiRollbackOperations.$inferInsert;
export type ApiExportOperation = typeof apiExportOperations.$inferSelect;
export type NewApiExportOperation = typeof apiExportOperations.$inferInsert;
export type ApiAnalyticsSummary = typeof apiAnalyticsSummary.$inferSelect;
export type NewApiAnalyticsSummary = typeof apiAnalyticsSummary.$inferInsert;