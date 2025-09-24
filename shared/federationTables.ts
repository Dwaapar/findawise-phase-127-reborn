import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, real, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { neurons } from "./schema";

// ===========================================
// BILLION-DOLLAR FEDERATION BRIDGE TABLES
// ===========================================

// Federation Events (comprehensive audit trail)
export const federationEvents = pgTable("federation_events", {
  id: serial("id").primaryKey(),
  eventId: uuid("event_id").defaultRandom().notNull(),
  neuronId: varchar("neuron_id", { length: 255 }).references(() => neurons.neuronId, { onDelete: "cascade" }),
  eventType: varchar("event_type", { length: 100 }).notNull(), // register, update, config_push, hot_reload, etc.
  eventData: jsonb("event_data").default({}),
  initiatedBy: varchar("initiated_by", { length: 255 }).notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  success: boolean("success").notNull(),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata").default({}),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Federation Sync Jobs (real-time synchronization)
export const federationSyncJobs = pgTable("federation_sync_jobs", {
  id: serial("id").primaryKey(),
  jobId: uuid("job_id").defaultRandom().notNull(),
  syncType: varchar("sync_type", { length: 50 }).notNull(), // config, analytics, offers, experiments
  targetNeurons: jsonb("target_neurons").default([]), // array of neuron IDs
  payload: jsonb("payload").notNull(),
  status: varchar("status", { length: 20 }).default("pending"), // pending, running, completed, failed
  progress: integer("progress").default(0), // 0-100
  successCount: integer("success_count").default(0),
  failureCount: integer("failure_count").default(0),
  errors: jsonb("errors").default([]),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  triggeredBy: varchar("triggered_by", { length: 255 }).notNull(),
  metadata: jsonb("metadata").default({}),
});

// Federation Config Versions (versioned configuration management)
export const federationConfigVersions = pgTable("federation_config_versions", {
  id: serial("id").primaryKey(),
  versionId: uuid("version_id").defaultRandom().notNull(),
  configKey: varchar("config_key", { length: 255 }).notNull(),
  configValue: jsonb("config_value").notNull(),
  version: varchar("version", { length: 50 }).notNull(),
  previousVersion: varchar("previous_version", { length: 50 }),
  changeType: varchar("change_type", { length: 50 }).notNull(), // create, update, delete
  changeReason: text("change_reason"),
  rollbackData: jsonb("rollback_data"),
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  approvedBy: varchar("approved_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  approvedAt: timestamp("approved_at"),
  deployedAt: timestamp("deployed_at"),
  metadata: jsonb("metadata").default({}),
});

// Federation Hot Reload Requests (dynamic updates)
export const federationHotReloads = pgTable("federation_hot_reloads", {
  id: serial("id").primaryKey(),
  reloadId: uuid("reload_id").defaultRandom().notNull(),
  neuronId: varchar("neuron_id", { length: 255 }).references(() => neurons.neuronId, { onDelete: "cascade" }),
  reloadType: varchar("reload_type", { length: 50 }).notNull(), // config, code, assets, full
  payload: jsonb("payload").notNull(),
  status: varchar("status", { length: 20 }).default("pending"),
  acknowledgment: jsonb("acknowledgment"),
  rollbackAvailable: boolean("rollback_available").default(false),
  rollbackData: jsonb("rollback_data"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  triggeredBy: varchar("triggered_by", { length: 255 }).notNull(),
  metadata: jsonb("metadata").default({}),
});

// Federation Health Checks (comprehensive monitoring)
export const federationHealthChecks = pgTable("federation_health_checks", {
  id: serial("id").primaryKey(),
  checkId: uuid("check_id").defaultRandom().notNull(),
  neuronId: varchar("neuron_id", { length: 255 }).references(() => neurons.neuronId, { onDelete: "cascade" }),
  checkType: varchar("check_type", { length: 50 }).notNull(), // heartbeat, deep, performance, security
  status: varchar("status", { length: 20 }).notNull(), // healthy, warning, critical, unknown
  responseTime: integer("response_time"), // milliseconds
  metrics: jsonb("metrics").default({}),
  issues: jsonb("issues").default([]),
  recommendations: jsonb("recommendations").default([]),
  checkedAt: timestamp("checked_at").defaultNow().notNull(),
  nextCheckAt: timestamp("next_check_at"),
  metadata: jsonb("metadata").default({}),
});

// Federation Conflict Resolution (conflict handling)
export const federationConflicts = pgTable("federation_conflicts", {
  id: serial("id").primaryKey(),
  conflictId: uuid("conflict_id").defaultRandom().notNull(),
  neuronId: varchar("neuron_id", { length: 255 }).references(() => neurons.neuronId, { onDelete: "cascade" }),
  conflictType: varchar("conflict_type", { length: 50 }).notNull(), // config, version, data
  sourceData: jsonb("source_data").notNull(),
  targetData: jsonb("target_data").notNull(),
  resolution: varchar("resolution", { length: 50 }), // auto, manual, skip
  resolutionData: jsonb("resolution_data"),
  resolvedBy: varchar("resolved_by", { length: 255 }),
  priority: varchar("priority", { length: 20 }).default("medium"), // low, medium, high, critical
  status: varchar("status", { length: 20 }).default("pending"), // pending, resolved, ignored
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
  metadata: jsonb("metadata").default({}),
});

// Federation Migration Tracking (version migrations)
export const federationMigrations = pgTable("federation_migrations", {
  id: serial("id").primaryKey(),
  migrationId: uuid("migration_id").defaultRandom().notNull(),
  neuronId: varchar("neuron_id", { length: 255 }).references(() => neurons.neuronId, { onDelete: "cascade" }),
  fromVersion: varchar("from_version", { length: 50 }).notNull(),
  toVersion: varchar("to_version", { length: 50 }).notNull(),
  migrationType: varchar("migration_type", { length: 50 }).notNull(), // schema, config, data
  migrationScript: text("migration_script"),
  rollbackScript: text("rollback_script"),
  status: varchar("status", { length: 20 }).default("pending"), // pending, running, completed, failed, rolled_back
  progress: integer("progress").default(0),
  errors: jsonb("errors").default([]),
  backupReference: varchar("backup_reference", { length: 255 }),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  triggeredBy: varchar("triggered_by", { length: 255 }).notNull(),
  metadata: jsonb("metadata").default({}),
});

// Federation Analytics Aggregation (cross-neuron analytics)
export const federationAnalytics = pgTable("federation_analytics", {
  id: serial("id").primaryKey(),
  aggregationId: uuid("aggregation_id").defaultRandom().notNull(),
  timeframe: varchar("timeframe", { length: 20 }).notNull(), // hourly, daily, weekly, monthly
  aggregationType: varchar("aggregation_type", { length: 50 }).notNull(), // global, neuron, category
  neuronId: varchar("neuron_id", { length: 255 }).references(() => neurons.neuronId, { onDelete: "cascade" }),
  metrics: jsonb("metrics").notNull(),
  comparisons: jsonb("comparisons").default({}),
  trends: jsonb("trends").default({}),
  alerts: jsonb("alerts").default([]),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  metadata: jsonb("metadata").default({}),
});

// Federation Security Tokens (JWT and API key management)
export const federationSecurityTokens = pgTable("federation_security_tokens", {
  id: serial("id").primaryKey(),
  tokenId: uuid("token_id").defaultRandom().notNull(),
  neuronId: varchar("neuron_id", { length: 255 }).references(() => neurons.neuronId, { onDelete: "cascade" }),
  tokenType: varchar("token_type", { length: 20 }).notNull(), // jwt, api_key, refresh
  tokenHash: varchar("token_hash", { length: 255 }).notNull(),
  permissions: jsonb("permissions").default([]),
  scope: jsonb("scope").default({}),
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at"),
  lastUsedAt: timestamp("last_used_at"),
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  revokedAt: timestamp("revoked_at"),
  revokedBy: varchar("revoked_by", { length: 255 }),
  metadata: jsonb("metadata").default({}),
});

// ===========================================
// RELATIONS
// ===========================================

export const federationEventsRelations = relations(federationEvents, ({ one }) => ({
  neuron: one(neurons, {
    fields: [federationEvents.neuronId],
    references: [neurons.neuronId],
  }),
}));

export const federationHotReloadsRelations = relations(federationHotReloads, ({ one }) => ({
  neuron: one(neurons, {
    fields: [federationHotReloads.neuronId],
    references: [neurons.neuronId],
  }),
}));

export const federationHealthChecksRelations = relations(federationHealthChecks, ({ one }) => ({
  neuron: one(neurons, {
    fields: [federationHealthChecks.neuronId],
    references: [neurons.neuronId],
  }),
}));

export const federationConflictsRelations = relations(federationConflicts, ({ one }) => ({
  neuron: one(neurons, {
    fields: [federationConflicts.neuronId],
    references: [neurons.neuronId],
  }),
}));

export const federationMigrationsRelations = relations(federationMigrations, ({ one }) => ({
  neuron: one(neurons, {
    fields: [federationMigrations.neuronId],
    references: [neurons.neuronId],
  }),
}));

export const federationAnalyticsRelations = relations(federationAnalytics, ({ one }) => ({
  neuron: one(neurons, {
    fields: [federationAnalytics.neuronId],
    references: [neurons.neuronId],
  }),
}));

export const federationSecurityTokensRelations = relations(federationSecurityTokens, ({ one }) => ({
  neuron: one(neurons, {
    fields: [federationSecurityTokens.neuronId],
    references: [neurons.neuronId],
  }),
}));

// ===========================================
// TYPES
// ===========================================

export type FederationEvent = typeof federationEvents.$inferSelect;
export type FederationSyncJob = typeof federationSyncJobs.$inferSelect;
export type FederationConfigVersion = typeof federationConfigVersions.$inferSelect;
export type FederationHotReload = typeof federationHotReloads.$inferSelect;
export type FederationHealthCheck = typeof federationHealthChecks.$inferSelect;
export type FederationConflict = typeof federationConflicts.$inferSelect;
export type FederationMigration = typeof federationMigrations.$inferSelect;
export type FederationAnalytic = typeof federationAnalytics.$inferSelect;
export type FederationSecurityToken = typeof federationSecurityTokens.$inferSelect;