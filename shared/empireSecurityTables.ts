/**
 * EMPIRE-GRADE SECURITY TABLES
 * Billion-Dollar Migration-Proof JWT Auth + API Key Vault + CDN Cache + LLM Fallback
 * 
 * Features:
 * - Migration-proof persistent storage (Supabase/PostgreSQL compatible)
 * - Auto-healing and self-bootstrapping
 * - Versioned secret management with rotation
 * - Federated CDN cache configuration
 * - Intelligent LLM failover chains
 * 
 * Created: 2025-07-28
 * Quality: A+ Billion-Dollar Empire Grade
 */

import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, real, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// 1. JWT AUTH + API KEY VAULT
// Persistent storage for all JWT secrets, API keys, and auth configs
export const secretsVault = pgTable("secrets_vault", {
  id: serial("id").primaryKey(),
  keyId: varchar("key_id", { length: 255 }).notNull().unique(),
  secretType: varchar("secret_type", { length: 50 }).notNull(), // jwt, api, oauth, webhook, etc.
  value: text("value").notNull(), // Encrypted secret value
  environment: varchar("environment", { length: 50 }).default("production"), // production, staging, development
  description: text("description"),
  version: integer("version").default(1),
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at"), // For automatic rotation
  rotatedAt: timestamp("rotated_at"),
  rotationFrequencyDays: integer("rotation_frequency_days").default(90),
  metadata: jsonb("metadata"), // Additional configuration
  auditTrail: jsonb("audit_trail"), // Rotation and access history
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  secretTypeIdx: index("secrets_vault_type_idx").on(table.secretType),
  activeSecretsIdx: index("secrets_vault_active_idx").on(table.isActive),
  expiryIdx: index("secrets_vault_expiry_idx").on(table.expiresAt),
}));

// Secret rotation history for audit compliance
export const secretRotationHistory = pgTable("secret_rotation_history", {
  id: serial("id").primaryKey(),
  keyId: varchar("key_id", { length: 255 }).notNull(),
  oldValue: text("old_value"), // Encrypted old value for rollback
  newValue: text("new_value"), // Encrypted new value
  rotationType: varchar("rotation_type", { length: 50 }).notNull(), // automatic, manual, emergency
  rotatedBy: varchar("rotated_by", { length: 255 }), // user_id or 'system'
  reason: text("reason"),
  rollbackAvailable: boolean("rollback_available").default(true),
  rotatedAt: timestamp("rotated_at").defaultNow(),
}, (table) => ({
  keyIdIdx: index("rotation_history_key_idx").on(table.keyId),
  rotationDateIdx: index("rotation_history_date_idx").on(table.rotatedAt),
}));

// API access tokens with scopes and rate limiting
export const apiAccessTokens = pgTable("api_access_tokens", {
  id: serial("id").primaryKey(),
  tokenId: varchar("token_id", { length: 255 }).notNull().unique(),
  keyId: varchar("key_id", { length: 255 }).notNull(), // Reference to secrets_vault
  userId: varchar("user_id", { length: 255 }),
  applicationName: varchar("application_name", { length: 255 }),
  scopes: jsonb("scopes"), // Array of allowed scopes
  rateLimitRpm: integer("rate_limit_rpm").default(1000), // Requests per minute
  rateLimitRpd: integer("rate_limit_rpd").default(10000), // Requests per day
  usageStats: jsonb("usage_stats"), // Request counts and patterns
  lastUsedAt: timestamp("last_used_at"),
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  tokenIdIdx: index("api_tokens_token_idx").on(table.tokenId),
  activeTokensIdx: index("api_tokens_active_idx").on(table.isActive),
  expiryIdx: index("api_tokens_expiry_idx").on(table.expiresAt),
}));

// 2. FEDERATED CDN CACHE
// External persistent cache configuration and policies
export const cdnCacheConfig = pgTable("cdn_cache_config", {
  id: serial("id").primaryKey(),
  routeId: varchar("route_id", { length: 255 }).notNull().unique(),
  routePattern: varchar("route_pattern", { length: 500 }).notNull(), // Express route pattern
  cachePolicy: varchar("cache_policy", { length: 100 }).notNull(), // aggressive, conservative, dynamic, no-cache
  ttlSeconds: integer("ttl_seconds").default(3600), // Time to live in seconds
  maxAge: integer("max_age").default(3600), // Browser cache max age
  staleWhileRevalidate: integer("stale_while_revalidate").default(600), // SWR seconds
  varyHeaders: jsonb("vary_headers"), // Headers to vary cache on
  conditions: jsonb("conditions"), // Conditional caching rules
  invalidationTokens: jsonb("invalidation_tokens"), // Tags for cache invalidation
  compressionEnabled: boolean("compression_enabled").default(true),
  preloadRules: jsonb("preload_rules"), // Cache preloading configuration
  geoLocation: jsonb("geo_location"), // Geographic cache rules
  lastUpdated: timestamp("last_updated").defaultNow(),
  lastInvalidated: timestamp("last_invalidated"),
  hitRatio: real("hit_ratio").default(0), // Cache hit ratio percentage
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  routePatternIdx: index("cdn_cache_route_idx").on(table.routePattern),
  policyIdx: index("cdn_cache_policy_idx").on(table.cachePolicy),
  activeConfigIdx: index("cdn_cache_active_idx").on(table.isActive),
}));

// Cache invalidation logs for debugging and analytics
export const cacheInvalidationLogs = pgTable("cache_invalidation_logs", {
  id: serial("id").primaryKey(),
  routeId: varchar("route_id", { length: 255 }).notNull(),
  invalidationType: varchar("invalidation_type", { length: 50 }).notNull(), // manual, automatic, scheduled
  invalidationToken: varchar("invalidation_token", { length: 255 }),
  reason: text("reason"),
  triggeredBy: varchar("triggered_by", { length: 255 }), // user_id or 'system'
  affectedRoutes: jsonb("affected_routes"), // Array of affected route patterns
  success: boolean("success").default(true),
  errorMessage: text("error_message"),
  invalidatedAt: timestamp("invalidated_at").defaultNow(),
}, (table) => ({
  routeIdx: index("cache_invalidation_route_idx").on(table.routeId),
  typeIdx: index("cache_invalidation_type_idx").on(table.invalidationType),
  dateIdx: index("cache_invalidation_date_idx").on(table.invalidatedAt),
}));

// Cache performance metrics
export const cachePerformanceMetrics = pgTable("cache_performance_metrics", {
  id: serial("id").primaryKey(),
  routeId: varchar("route_id", { length: 255 }).notNull(),
  date: timestamp("date").notNull(),
  hits: integer("hits").default(0),
  misses: integer("misses").default(0),
  hitRatio: real("hit_ratio").default(0),
  avgResponseTime: real("avg_response_time").default(0), // milliseconds
  bandwidthSaved: integer("bandwidth_saved").default(0), // bytes
  requests: integer("requests").default(0),
  errors: integer("errors").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  routeDateIdx: index("cache_metrics_route_date_idx").on(table.routeId, table.date),
  performanceIdx: index("cache_metrics_performance_idx").on(table.hitRatio, table.avgResponseTime),
}));

// 3. FAILOVER LLM FALLBACK
// Persistent LLM endpoints, credentials, priorities, and fallback chains
export const llmFallbacks = pgTable("llm_fallbacks", {
  id: serial("id").primaryKey(),
  llmId: varchar("llm_id", { length: 255 }).notNull().unique(),
  provider: varchar("provider", { length: 100 }).notNull(), // openai, claude, gemini, cohere, huggingface, etc.
  endpoint: text("endpoint").notNull(), // API endpoint URL
  apiKeyRef: varchar("api_key_ref", { length: 255 }), // Reference to secrets_vault.keyId
  model: varchar("model", { length: 100 }).notNull(), // gpt-4, claude-3, gemini-pro, etc.
  priority: integer("priority").default(100), // Lower = higher priority (1 = primary)
  maxTokens: integer("max_tokens").default(2048),
  temperature: real("temperature").default(0.7),
  timeout: integer("timeout").default(30000), // milliseconds
  rateLimitRpm: integer("rate_limit_rpm").default(60), // Requests per minute
  costPerToken: real("cost_per_token").default(0.0001), // Cost per token
  supportedFeatures: jsonb("supported_features"), // Array of features: ['chat', 'completion', 'embedding']
  configuration: jsonb("configuration"), // Provider-specific config
  healthStatus: varchar("health_status", { length: 50 }).default("healthy"), // healthy, degraded, unhealthy
  lastHealthCheck: timestamp("last_health_check"),
  healthCheckInterval: integer("health_check_interval").default(300), // seconds
  errorCount: integer("error_count").default(0),
  totalRequests: integer("total_requests").default(0),
  successRate: real("success_rate").default(100.0), // percentage
  avgResponseTime: real("avg_response_time").default(0), // milliseconds
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  providerIdx: index("llm_fallbacks_provider_idx").on(table.provider),
  priorityIdx: index("llm_fallbacks_priority_idx").on(table.priority),
  healthIdx: index("llm_fallbacks_health_idx").on(table.healthStatus),
  activeIdx: index("llm_fallbacks_active_idx").on(table.isActive),
}));

// LLM request routing and fallback events for audit and optimization
export const llmFallbackEvents = pgTable("llm_fallback_events", {
  id: serial("id").primaryKey(),
  requestId: varchar("request_id", { length: 255 }).notNull(),
  primaryLlmId: varchar("primary_llm_id", { length: 255 }),
  fallbackLlmId: varchar("fallback_llm_id", { length: 255 }),
  eventType: varchar("event_type", { length: 50 }).notNull(), // success, timeout, error, rate_limit
  errorMessage: text("error_message"),
  responseTime: integer("response_time"), // milliseconds
  tokenCount: integer("token_count"),
  cost: real("cost"),
  retryAttempt: integer("retry_attempt").default(0),
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address", { length: 45 }),
  sessionId: varchar("session_id", { length: 255 }),
  metadata: jsonb("metadata"), // Additional context
  eventAt: timestamp("event_at").defaultNow(),
}, (table) => ({
  requestIdx: index("llm_fallback_request_idx").on(table.requestId),
  typeIdx: index("llm_fallback_type_idx").on(table.eventType),
  llmIdx: index("llm_fallback_llm_idx").on(table.primaryLlmId, table.fallbackLlmId),
  dateIdx: index("llm_fallback_date_idx").on(table.eventAt),
}));

// LLM usage analytics and cost tracking
export const llmUsageAnalytics = pgTable("llm_usage_analytics", {
  id: serial("id").primaryKey(),
  llmId: varchar("llm_id", { length: 255 }).notNull(),
  date: timestamp("date").notNull(),
  requests: integer("requests").default(0),
  successfulRequests: integer("successful_requests").default(0),
  failedRequests: integer("failed_requests").default(0),
  totalTokens: integer("total_tokens").default(0),
  avgResponseTime: real("avg_response_time").default(0), // milliseconds
  totalCost: real("total_cost").default(0),
  errorRate: real("error_rate").default(0), // percentage
  uptime: real("uptime").default(100.0), // percentage
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  llmDateIdx: index("llm_usage_llm_date_idx").on(table.llmId, table.date),
  costIdx: index("llm_usage_cost_idx").on(table.totalCost),
  performanceIdx: index("llm_usage_performance_idx").on(table.avgResponseTime, table.errorRate),
}));

// System migration tracking and auto-healing events
export const migrationEvents = pgTable("migration_events", {
  id: serial("id").primaryKey(),
  eventType: varchar("event_type", { length: 50 }).notNull(), // backup, restore, migration, healing
  component: varchar("component", { length: 100 }).notNull(), // secrets, cache, llm, all
  status: varchar("status", { length: 50 }).notNull(), // started, completed, failed
  backupLocation: text("backup_location"), // Where backup was stored
  restoreLocation: text("restore_location"), // Where restored from
  recordsAffected: integer("records_affected").default(0),
  duration: integer("duration"), // milliseconds
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"), // Additional migration data
  triggeredBy: varchar("triggered_by", { length: 255 }), // user_id or 'system'
  eventAt: timestamp("event_at").defaultNow(),
}, (table) => ({
  typeIdx: index("migration_events_type_idx").on(table.eventType),
  componentIdx: index("migration_events_component_idx").on(table.component),
  statusIdx: index("migration_events_status_idx").on(table.status),
  dateIdx: index("migration_events_date_idx").on(table.eventAt),
}));

// Insert schemas for type safety
export const insertSecretsVaultSchema = createInsertSchema(secretsVault);
export const insertSecretRotationHistorySchema = createInsertSchema(secretRotationHistory);
export const insertApiAccessTokensSchema = createInsertSchema(apiAccessTokens);
export const insertCdnCacheConfigSchema = createInsertSchema(cdnCacheConfig);
export const insertCacheInvalidationLogsSchema = createInsertSchema(cacheInvalidationLogs);
export const insertCachePerformanceMetricsSchema = createInsertSchema(cachePerformanceMetrics);
export const insertLlmFallbacksSchema = createInsertSchema(llmFallbacks);
export const insertLlmFallbackEventsSchema = createInsertSchema(llmFallbackEvents);
export const insertLlmUsageAnalyticsSchema = createInsertSchema(llmUsageAnalytics);
export const insertMigrationEventsSchema = createInsertSchema(migrationEvents);

// Export types
export type SecretsVault = typeof secretsVault.$inferSelect;
export type InsertSecretsVault = z.infer<typeof insertSecretsVaultSchema>;
export type SecretRotationHistory = typeof secretRotationHistory.$inferSelect;
export type InsertSecretRotationHistory = z.infer<typeof insertSecretRotationHistorySchema>;
export type ApiAccessTokens = typeof apiAccessTokens.$inferSelect;
export type InsertApiAccessTokens = z.infer<typeof insertApiAccessTokensSchema>;
export type CdnCacheConfig = typeof cdnCacheConfig.$inferSelect;
export type InsertCdnCacheConfig = z.infer<typeof insertCdnCacheConfigSchema>;
export type CacheInvalidationLogs = typeof cacheInvalidationLogs.$inferSelect;
export type InsertCacheInvalidationLogs = z.infer<typeof insertCacheInvalidationLogsSchema>;
export type CachePerformanceMetrics = typeof cachePerformanceMetrics.$inferSelect;
export type InsertCachePerformanceMetrics = z.infer<typeof insertCachePerformanceMetricsSchema>;
export type LlmFallbacks = typeof llmFallbacks.$inferSelect;
export type InsertLlmFallbacks = z.infer<typeof insertLlmFallbacksSchema>;
export type LlmFallbackEvents = typeof llmFallbackEvents.$inferSelect;
export type InsertLlmFallbackEvents = z.infer<typeof insertLlmFallbackEventsSchema>;
export type LlmUsageAnalytics = typeof llmUsageAnalytics.$inferSelect;
export type InsertLlmUsageAnalytics = z.infer<typeof insertLlmUsageAnalyticsSchema>;
export type MigrationEvents = typeof migrationEvents.$inferSelect;
export type InsertMigrationEvents = z.infer<typeof insertMigrationEventsSchema>;