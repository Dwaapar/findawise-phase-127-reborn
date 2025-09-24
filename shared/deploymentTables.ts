import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, real, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ==========================================
// EXPORT/IMPORT BOOSTER SYSTEM TABLES
// ==========================================

// Export/Import Archive Management
export const exportArchives = pgTable("export_archives", {
  id: serial("id").primaryKey(),
  archiveId: uuid("archive_id").defaultRandom().notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  exportType: varchar("export_type", { length: 50 }).notNull(), // 'full', 'partial', 'neuron', 'config', 'data'
  version: varchar("version", { length: 50 }).notNull(),
  fileSize: integer("file_size").notNull(), // bytes
  checksum: varchar("checksum", { length: 128 }).notNull(),
  filePath: text("file_path").notNull(),
  manifest: jsonb("manifest").notNull(), // detailed manifest of contents
  exportedBy: integer("exported_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"), // auto-cleanup
  status: varchar("status", { length: 20 }).default("active").notNull(), // 'active', 'expired', 'corrupted'
  metadata: jsonb("metadata").default({}).notNull()
});

// Import Operations Tracking
export const importOperations = pgTable("import_operations", {
  id: serial("id").primaryKey(),
  operationId: uuid("operation_id").defaultRandom().notNull().unique(),
  archiveId: uuid("archive_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  importType: varchar("import_type", { length: 50 }).notNull(), // 'full', 'partial', 'merge', 'overwrite'
  status: varchar("status", { length: 20 }).default("pending").notNull(), // 'pending', 'running', 'completed', 'failed', 'rolled_back'
  progress: integer("progress").default(0).notNull(), // 0-100
  totalItems: integer("total_items").default(0).notNull(),
  processedItems: integer("processed_items").default(0).notNull(),
  failedItems: integer("failed_items").default(0).notNull(),
  importConfig: jsonb("import_config").default({}).notNull(), // merge rules, mappings, etc.
  logs: jsonb("logs").default([]).notNull(),
  errors: jsonb("errors").default([]).notNull(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  importedBy: integer("imported_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  rollbackData: jsonb("rollback_data"), // for undo operations
  metadata: jsonb("metadata").default({}).notNull()
});

// Deployment Management
export const deployments = pgTable("deployments", {
  id: serial("id").primaryKey(),
  deploymentId: uuid("deployment_id").defaultRandom().notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  environment: varchar("environment", { length: 50 }).notNull(), // 'dev', 'staging', 'prod', 'dr'
  deploymentType: varchar("deployment_type", { length: 50 }).notNull(), // 'full', 'partial', 'rollback', 'hotfix'
  version: varchar("version", { length: 50 }).notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // 'pending', 'running', 'completed', 'failed', 'rolled_back'
  progress: integer("progress").default(0).notNull(), // 0-100
  totalSteps: integer("total_steps").default(0).notNull(),
  completedSteps: integer("completed_steps").default(0).notNull(),
  failedSteps: integer("failed_steps").default(0).notNull(),
  config: jsonb("config").notNull(), // deployment configuration
  manifest: jsonb("manifest").notNull(), // what's being deployed
  logs: jsonb("logs").default([]).notNull(),
  errors: jsonb("errors").default([]).notNull(),
  healthChecks: jsonb("health_checks").default([]).notNull(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  deployedBy: integer("deployed_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  rollbackData: jsonb("rollback_data"), // for rollback operations
  metadata: jsonb("metadata").default({}).notNull()
});

// Deployment Steps/Tasks
export const deploymentSteps = pgTable("deployment_steps", {
  id: serial("id").primaryKey(),
  deploymentId: uuid("deployment_id").notNull(),
  stepId: varchar("step_id", { length: 100 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  stepType: varchar("step_type", { length: 50 }).notNull(), // 'pre_hook', 'deploy', 'migrate', 'seed', 'health_check', 'post_hook'
  order: integer("order").notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // 'pending', 'running', 'completed', 'failed', 'skipped'
  command: text("command"), // actual command/script executed
  output: text("output"), // command output
  errorOutput: text("error_output"),
  duration: integer("duration"), // execution time in ms
  retryCount: integer("retry_count").default(0).notNull(),
  maxRetries: integer("max_retries").default(3).notNull(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  dependencies: jsonb("dependencies").default([]).notNull(), // step dependencies
  rollbackCommand: text("rollback_command"), // undo command if available
  metadata: jsonb("metadata").default({}).notNull()
});

// Backup Management
export const backups = pgTable("backups", {
  id: serial("id").primaryKey(),
  backupId: uuid("backup_id").defaultRandom().notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  backupType: varchar("backup_type", { length: 50 }).notNull(), // 'scheduled', 'manual', 'pre_deployment', 'disaster_recovery'
  scope: varchar("scope", { length: 50 }).notNull(), // 'full', 'database', 'files', 'config', 'specific_neuron'
  status: varchar("status", { length: 20 }).default("pending").notNull(), // 'pending', 'running', 'completed', 'failed', 'archived'
  fileSize: integer("file_size"), // bytes
  checksum: varchar("checksum", { length: 128 }),
  filePath: text("file_path"),
  storageLocation: varchar("storage_location", { length: 100 }).notNull(), // 'local', 's3', 'gcs', 'azure'
  retentionDays: integer("retention_days").default(90).notNull(),
  metadata: jsonb("metadata").default({}).notNull(), // backup contents info
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isEncrypted: boolean("is_encrypted").default(true).notNull(),
  encryptionKey: varchar("encryption_key", { length: 128 }), // encrypted key reference
  compressionRatio: real("compression_ratio"), // original_size / compressed_size
  tags: jsonb("tags").default([]).notNull()
});

// Disaster Recovery Plans
export const disasterRecoveryPlans = pgTable("disaster_recovery_plans", {
  id: serial("id").primaryKey(),
  planId: uuid("plan_id").defaultRandom().notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  planType: varchar("plan_type", { length: 50 }).notNull(), // 'full_restore', 'partial_restore', 'failover', 'migration'
  priority: varchar("priority", { length: 20 }).default("medium").notNull(), // 'low', 'medium', 'high', 'critical'
  rto: integer("rto").notNull(), // Recovery Time Objective in minutes
  rpo: integer("rpo").notNull(), // Recovery Point Objective in minutes
  steps: jsonb("steps").notNull(), // recovery steps
  dependencies: jsonb("dependencies").default([]).notNull(),
  testResults: jsonb("test_results").default([]).notNull(),
  lastTested: timestamp("last_tested"),
  isActive: boolean("is_active").default(true).notNull(),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  metadata: jsonb("metadata").default({}).notNull()
});

// Deployment Audit Trail
export const deploymentAudit = pgTable("deployment_audit", {
  id: serial("id").primaryKey(),
  auditId: uuid("audit_id").defaultRandom().notNull().unique(),
  resourceType: varchar("resource_type", { length: 50 }).notNull(), // 'deployment', 'backup', 'import', 'export', 'rollback'
  resourceId: varchar("resource_id", { length: 100 }).notNull(),
  action: varchar("action", { length: 50 }).notNull(), // 'create', 'update', 'delete', 'start', 'complete', 'fail'
  userId: integer("user_id"),
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address", { length: 45 }),
  before: jsonb("before"), // state before action
  after: jsonb("after"), // state after action
  changes: jsonb("changes"), // specific changes made
  reason: text("reason"), // reason for action
  outcome: varchar("outcome", { length: 20 }).notNull(), // 'success', 'failure', 'partial'
  duration: integer("duration"), // action duration in ms
  createdAt: timestamp("created_at").defaultNow().notNull(),
  metadata: jsonb("metadata").default({}).notNull()
});

// RBAC for Deployment Operations
export const deploymentPermissions = pgTable("deployment_permissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  role: varchar("role", { length: 50 }).notNull(), // 'viewer', 'operator', 'admin', 'super_admin'
  permissions: jsonb("permissions").notNull(), // specific permissions array
  environments: jsonb("environments").default([]).notNull(), // which environments they can access
  resources: jsonb("resources").default([]).notNull(), // which resources they can manage
  restrictions: jsonb("restrictions").default({}).notNull(), // any restrictions
  isActive: boolean("is_active").default(true).notNull(),
  expiresAt: timestamp("expires_at"),
  grantedBy: integer("granted_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  metadata: jsonb("metadata").default({}).notNull()
});

// Multi-Region Configuration
export const multiRegionConfig = pgTable("multi_region_config", {
  id: serial("id").primaryKey(),
  configId: uuid("config_id").defaultRandom().notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  primaryRegion: varchar("primary_region", { length: 50 }).notNull(),
  regions: jsonb("regions").notNull(), // array of region configurations
  loadBalancing: jsonb("load_balancing").default({}).notNull(),
  failoverConfig: jsonb("failover_config").default({}).notNull(),
  dataReplication: jsonb("data_replication").default({}).notNull(),
  isActive: boolean("is_active").default(false).notNull(),
  healthCheckUrl: text("health_check_url"),
  lastHealthCheck: timestamp("last_health_check"),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  metadata: jsonb("metadata").default({}).notNull()
});

// ==========================================
// ZODS SCHEMAS FOR VALIDATION
// ==========================================

export const insertExportArchiveSchema = createInsertSchema(exportArchives);
export const insertImportOperationSchema = createInsertSchema(importOperations);
export const insertDeploymentSchema = createInsertSchema(deployments);
export const insertDeploymentStepSchema = createInsertSchema(deploymentSteps);
export const insertBackupSchema = createInsertSchema(backups);
export const insertDisasterRecoveryPlanSchema = createInsertSchema(disasterRecoveryPlans);
export const insertDeploymentAuditSchema = createInsertSchema(deploymentAudit);
export const insertDeploymentPermissionSchema = createInsertSchema(deploymentPermissions);
export const insertMultiRegionConfigSchema = createInsertSchema(multiRegionConfig);

// Export type definitions
export type ExportArchive = typeof exportArchives.$inferSelect;
export type NewExportArchive = typeof exportArchives.$inferInsert;
export type ImportOperation = typeof importOperations.$inferSelect;
export type NewImportOperation = typeof importOperations.$inferInsert;
export type Deployment = typeof deployments.$inferSelect;
export type NewDeployment = typeof deployments.$inferInsert;
export type DeploymentStep = typeof deploymentSteps.$inferSelect;
export type NewDeploymentStep = typeof deploymentSteps.$inferInsert;
export type Backup = typeof backups.$inferSelect;
export type NewBackup = typeof backups.$inferInsert;
export type DisasterRecoveryPlan = typeof disasterRecoveryPlans.$inferSelect;
export type NewDisasterRecoveryPlan = typeof disasterRecoveryPlans.$inferInsert;
export type DeploymentAudit = typeof deploymentAudit.$inferSelect;
export type NewDeploymentAudit = typeof deploymentAudit.$inferInsert;
export type DeploymentPermission = typeof deploymentPermissions.$inferSelect;
export type NewDeploymentPermission = typeof deploymentPermissions.$inferInsert;
export type MultiRegionConfig = typeof multiRegionConfig.$inferSelect;
export type NewMultiRegionConfig = typeof multiRegionConfig.$inferInsert;