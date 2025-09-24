/**
 * AI Plugin Marketplace Database Tables
 * Enterprise-grade plugin management system with comprehensive tracking
 */

import { 
  pgTable, 
  serial, 
  varchar, 
  text, 
  jsonb, 
  timestamp, 
  integer, 
  boolean, 
  decimal 
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Plugin Manifests - Core plugin definitions and metadata
export const pluginManifests = pgTable("plugin_manifests", {
  id: serial("id").primaryKey(),
  pluginId: varchar("plugin_id", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  version: varchar("version", { length: 50 }).notNull(),
  description: text("description").notNull(),
  author: varchar("author", { length: 255 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(), // 'ai', 'analytics', 'content', 'integration', 'utility', 'security'
  type: varchar("type", { length: 50 }).notNull(), // 'internal', 'external', 'marketplace'
  entryPoint: varchar("entry_point", { length: 500 }).notNull(),
  dependencies: jsonb("dependencies").notNull(), // Array of dependency strings
  permissions: jsonb("permissions").notNull(), // Array of PluginPermission objects
  configurationSchema: jsonb("configuration_schema").notNull(),
  apiEndpoints: jsonb("api_endpoints"), // Array of PluginEndpoint objects
  hooks: jsonb("hooks").notNull(), // Array of PluginHook objects
  compatibility: jsonb("compatibility").notNull(), // Compatibility requirements
  pricing: jsonb("pricing"), // Pricing information
  metadata: jsonb("metadata").notNull(), // Downloads, rating, verified status, etc.
  sourceUrl: text("source_url"), // Git repository or download URL
  documentationUrl: text("documentation_url"),
  supportUrl: text("support_url"),
  licenseType: varchar("license_type", { length: 100 }).default("MIT"),
  minimumSystemRequirements: jsonb("minimum_system_requirements"),
  tags: jsonb("tags"), // Array of searchable tags
  screenshots: jsonb("screenshots"), // Array of screenshot URLs
  changelog: jsonb("changelog"), // Version history
  securityScan: jsonb("security_scan"), // Security scan results
  performanceMetrics: jsonb("performance_metrics"), // Performance benchmarks
  isActive: boolean("is_active").default(true),
  isVerified: boolean("is_verified").default(false),
  isFeatured: boolean("is_featured").default(false),
  downloadCount: integer("download_count").default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  reviewCount: integer("review_count").default(0),
  lastSecurityScan: timestamp("last_security_scan"),
  approvedAt: timestamp("approved_at"),
  approvedBy: varchar("approved_by", { length: 255 }),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Plugin Instances - Installed plugins per neuron
export const pluginInstances = pgTable("plugin_instances", {
  id: serial("id").primaryKey(),
  instanceId: varchar("instance_id", { length: 255 }).notNull().unique(),
  pluginId: varchar("plugin_id", { length: 255 }).notNull(),
  neuronId: varchar("neuron_id", { length: 255 }).notNull(),
  neuronType: varchar("neuron_type", { length: 100 }).notNull(),
  version: varchar("version", { length: 50 }).notNull(),
  configuration: jsonb("configuration").notNull(),
  status: varchar("status", { length: 50 }).default("inactive"), // 'active', 'inactive', 'error', 'updating', 'installing', 'uninstalling'
  health: varchar("health", { length: 50 }).default("unknown"), // 'healthy', 'warning', 'critical', 'unknown'
  lastHealthCheck: timestamp("last_health_check"),
  healthDetails: jsonb("health_details"), // Detailed health information
  usageStats: jsonb("usage_stats").notNull(), // API calls, data processed, errors, uptime
  performanceMetrics: jsonb("performance_metrics"), // Response times, resource usage
  errorLog: jsonb("error_log"), // Recent errors and their frequency
  configuration_override: jsonb("configuration_override"), // Neuron-specific config overrides
  permissions_granted: jsonb("permissions_granted"), // Actual permissions granted to this instance
  resourceUsage: jsonb("resource_usage"), // CPU, memory, storage usage
  billingInfo: jsonb("billing_info"), // Usage-based billing information
  autoUpdateEnabled: boolean("auto_update_enabled").default(true),
  lastUpdateCheck: timestamp("last_update_check"),
  updateAvailable: boolean("update_available").default(false),
  availableVersion: varchar("available_version", { length: 50 }),
  installationMethod: varchar("installation_method", { length: 100 }), // 'marketplace', 'manual', 'api', 'cli'
  installationSource: text("installation_source"), // Source URL or path
  installedBy: varchar("installed_by", { length: 255 }),
  installationNotes: text("installation_notes"),
  customizations: jsonb("customizations"), // Any custom modifications
  backupConfiguration: jsonb("backup_configuration"), // Backup settings
  lastBackup: timestamp("last_backup"),
  maintenanceWindow: jsonb("maintenance_window"), // Scheduled maintenance
  alertSettings: jsonb("alert_settings"), // Alert configuration
  installedAt: timestamp("installed_at").defaultNow(),
  lastUpdated: timestamp("last_updated").defaultNow(),
  lastAccessed: timestamp("last_accessed"),
  uninstalledAt: timestamp("uninstalled_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Plugin Executions - Detailed execution tracking
export const pluginExecutions = pgTable("plugin_executions", {
  id: serial("id").primaryKey(),
  executionId: varchar("execution_id", { length: 255 }).notNull().unique(),
  pluginId: varchar("plugin_id", { length: 255 }).notNull(),
  instanceId: varchar("instance_id", { length: 255 }).notNull(),
  neuronId: varchar("neuron_id", { length: 255 }).notNull(),
  executionType: varchar("execution_type", { length: 100 }).notNull(), // 'api_call', 'hook', 'scheduled_task', 'event_handler'
  functionName: varchar("function_name", { length: 255 }).notNull(),
  endpoint: varchar("endpoint", { length: 500 }), // For API calls
  method: varchar("method", { length: 10 }), // HTTP method for API calls
  input: jsonb("input"), // Input parameters
  output: jsonb("output"), // Execution output
  error: text("error"), // Error message if failed
  stackTrace: text("stack_trace"), // Full stack trace for debugging
  executionTime: integer("execution_time").notNull(), // Milliseconds
  memoryUsage: integer("memory_usage"), // Bytes
  cpuTime: integer("cpu_time"), // Milliseconds
  status: varchar("status", { length: 50 }).notNull(), // 'success', 'error', 'timeout', 'cancelled'
  priority: integer("priority").default(1), // Execution priority
  retryCount: integer("retry_count").default(0),
  maxRetries: integer("max_retries").default(3),
  userId: varchar("user_id", { length: 255 }), // User who triggered execution
  sessionId: varchar("session_id", { length: 255 }), // Session context
  requestId: varchar("request_id", { length: 255 }), // Request tracing
  correlationId: varchar("correlation_id", { length: 255 }), // Cross-service correlation
  parentExecutionId: varchar("parent_execution_id", { length: 255 }), // For nested executions
  tags: jsonb("tags"), // Custom tags for filtering
  metadata: jsonb("metadata"), // Additional execution context
  resourcesAccessed: jsonb("resources_accessed"), // Resources accessed during execution
  cacheHit: boolean("cache_hit").default(false),
  cacheKey: varchar("cache_key", { length: 500 }),
  billingUnits: decimal("billing_units", { precision: 10, scale: 4 }).default("0.0000"), // For usage billing
  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Plugin Reviews - User reviews and ratings
export const pluginReviews = pgTable("plugin_reviews", {
  id: serial("id").primaryKey(),
  reviewId: varchar("review_id", { length: 255 }).notNull().unique(),
  pluginId: varchar("plugin_id", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  neuronId: varchar("neuron_id", { length: 255 }).notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  title: varchar("title", { length: 255 }),
  review: text("review"),
  pros: jsonb("pros"), // Array of positive points
  cons: jsonb("cons"), // Array of negative points
  useCases: jsonb("use_cases"), // How they used the plugin
  recommendation: varchar("recommendation", { length: 50 }), // 'highly_recommend', 'recommend', 'neutral', 'not_recommend'
  verified: boolean("verified").default(false), // Verified purchase/usage
  helpful_votes: integer("helpful_votes").default(0),
  total_votes: integer("total_votes").default(0),
  pluginVersion: varchar("plugin_version", { length: 50 }).notNull(),
  usage_duration: integer("usage_duration"), // Days of usage before review
  performance_rating: integer("performance_rating"), // 1-5
  documentation_rating: integer("documentation_rating"), // 1-5
  support_rating: integer("support_rating"), // 1-5
  value_rating: integer("value_rating"), // 1-5
  response_from_author: text("response_from_author"),
  response_date: timestamp("response_date"),
  is_featured: boolean("is_featured").default(false),
  is_moderated: boolean("is_moderated").default(false),
  moderation_notes: text("moderation_notes"),
  language: varchar("language", { length: 10 }).default("en"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Plugin Analytics - Usage analytics and metrics
export const pluginAnalytics = pgTable("plugin_analytics", {
  id: serial("id").primaryKey(),
  pluginId: varchar("plugin_id", { length: 255 }).notNull(),
  instanceId: varchar("instance_id", { length: 255 }),
  neuronId: varchar("neuron_id", { length: 255 }),
  eventType: varchar("event_type", { length: 100 }).notNull(), // 'install', 'uninstall', 'activation', 'api_call', 'error', 'update'
  eventData: jsonb("event_data").notNull(),
  metrics: jsonb("metrics").notNull(), // Performance and usage metrics
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address", { length: 45 }), // IPv6 compatible
  country: varchar("country", { length: 2 }),
  region: varchar("region", { length: 100 }),
  city: varchar("city", { length: 100 }),
  timezone: varchar("timezone", { length: 50 }),
  deviceType: varchar("device_type", { length: 50 }), // 'desktop', 'mobile', 'tablet', 'server'
  operatingSystem: varchar("operating_system", { length: 50 }),
  browserName: varchar("browser_name", { length: 50 }),
  browserVersion: varchar("browser_version", { length: 50 }),
  screenResolution: varchar("screen_resolution", { length: 20 }),
  sessionId: varchar("session_id", { length: 255 }),
  userId: varchar("user_id", { length: 255 }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  processed: boolean("processed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Plugin Dependencies - Track plugin dependencies
export const pluginDependencies = pgTable("plugin_dependencies", {
  id: serial("id").primaryKey(),
  pluginId: varchar("plugin_id", { length: 255 }).notNull(),
  dependencyType: varchar("dependency_type", { length: 50 }).notNull(), // 'plugin', 'library', 'service', 'system'
  dependencyName: varchar("dependency_name", { length: 255 }).notNull(),
  dependencyVersion: varchar("dependency_version", { length: 50 }),
  versionConstraint: varchar("version_constraint", { length: 100 }), // >=1.0.0, ~2.1.0, etc.
  isOptional: boolean("is_optional").default(false),
  isDevDependency: boolean("is_dev_dependency").default(false),
  status: varchar("status", { length: 50 }).default("unknown"), // 'satisfied', 'missing', 'outdated', 'conflict'
  installedVersion: varchar("installed_version", { length: 50 }),
  lastChecked: timestamp("last_checked"),
  installationPath: text("installation_path"),
  downloadUrl: text("download_url"),
  licenseType: varchar("license_type", { length: 100 }),
  securityIssues: jsonb("security_issues"), // Known security vulnerabilities
  alternativePackages: jsonb("alternative_packages"), // Alternative dependency options
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Plugin Marketplace - External marketplace integrations
export const pluginMarketplace = pgTable("plugin_marketplace", {
  id: serial("id").primaryKey(),
  marketplaceId: varchar("marketplace_id", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  baseUrl: text("base_url").notNull(),
  apiKey: text("api_key"), // Encrypted
  apiSecret: text("api_secret"), // Encrypted
  authType: varchar("auth_type", { length: 50 }).notNull(), // 'api_key', 'oauth', 'jwt', 'basic'
  authConfig: jsonb("auth_config"), // Authentication configuration
  syncInterval: integer("sync_interval").default(3600), // Seconds between syncs
  lastSync: timestamp("last_sync"),
  syncStatus: varchar("sync_status", { length: 50 }).default("pending"), // 'pending', 'syncing', 'completed', 'failed'
  syncErrors: jsonb("sync_errors"), // Last sync errors
  pluginCount: integer("plugin_count").default(0),
  featuredPlugins: jsonb("featured_plugins"), // Array of featured plugin IDs
  categories: jsonb("categories"), // Available categories
  supportedLanguages: jsonb("supported_languages"), // Programming languages supported
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }).default("0.00"),
  totalDownloads: integer("total_downloads").default(0),
  isActive: boolean("is_active").default(true),
  isTrusted: boolean("is_trusted").default(false),
  contactEmail: varchar("contact_email", { length: 255 }),
  supportUrl: text("support_url"),
  termsUrl: text("terms_url"),
  privacyUrl: text("privacy_url"),
  commission: decimal("commission", { precision: 5, scale: 2 }).default("0.00"), // Commission percentage
  paymentMethods: jsonb("payment_methods"), // Supported payment methods
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas for validation
export const insertPluginManifestSchema = createInsertSchema(pluginManifests).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertPluginInstanceSchema = createInsertSchema(pluginInstances).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertPluginExecutionSchema = createInsertSchema(pluginExecutions).omit({
  id: true,
  createdAt: true
});

export const insertPluginReviewSchema = createInsertSchema(pluginReviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertPluginAnalyticsSchema = createInsertSchema(pluginAnalytics).omit({
  id: true,
  createdAt: true
});

export const insertPluginDependencySchema = createInsertSchema(pluginDependencies).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertPluginMarketplaceSchema = createInsertSchema(pluginMarketplace).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// TypeScript types
export type PluginManifest = typeof pluginManifests.$inferSelect;
export type InsertPluginManifest = z.infer<typeof insertPluginManifestSchema>;

export type PluginInstance = typeof pluginInstances.$inferSelect;
export type InsertPluginInstance = z.infer<typeof insertPluginInstanceSchema>;

export type PluginExecution = typeof pluginExecutions.$inferSelect;
export type InsertPluginExecution = z.infer<typeof insertPluginExecutionSchema>;

export type PluginReview = typeof pluginReviews.$inferSelect;
export type InsertPluginReview = z.infer<typeof insertPluginReviewSchema>;

export type PluginAnalytics = typeof pluginAnalytics.$inferSelect;
export type InsertPluginAnalytics = z.infer<typeof insertPluginAnalyticsSchema>;

export type PluginDependency = typeof pluginDependencies.$inferSelect;
export type InsertPluginDependency = z.infer<typeof insertPluginDependencySchema>;

export type PluginMarketplace = typeof pluginMarketplace.$inferSelect;
export type InsertPluginMarketplace = z.infer<typeof insertPluginMarketplaceSchema>;