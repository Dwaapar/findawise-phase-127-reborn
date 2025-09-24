import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, real, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// OFFLINE AI SYNC ENGINE + EDGE AI DEVICE RESILIENCE - BILLION-DOLLAR GRADE
// ============================================================================
// Complete local-first storage & sync architecture for empire-wide offline operation
// Handles: user profiles, quiz flows, session analytics, AI personalization, 
// content caching, offer tracking, and real-time deferred sync

// Offline Sync Queue - Universal event queue for all offline operations
export const offlineSyncQueue = pgTable("offline_sync_queue", {
  id: serial("id").primaryKey(),
  queueId: uuid("queue_id").defaultRandom().notNull().unique(),
  deviceId: varchar("device_id", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }),
  sessionId: varchar("session_id", { length: 255 }),
  
  // Event classification and metadata
  eventType: varchar("event_type", { length: 100 }).notNull(), // 'user_action', 'quiz_progress', 'cta_click', 'profile_update', 'analytics_event'
  moduleId: varchar("module_id", { length: 100 }).notNull(), // 'quiz', 'affiliate', 'personalization', 'analytics', 'content'
  entityType: varchar("entity_type", { length: 100 }), // 'quiz_response', 'affiliate_click', 'user_preference', 'session_data'
  entityId: varchar("entity_id", { length: 255 }),
  
  // Event data and context
  eventData: jsonb("event_data").notNull(), // Complete event payload
  contextData: jsonb("context_data"), // Browser state, device info, user context
  priority: integer("priority").default(5), // 1-10, higher = more important
  
  // Sync management
  syncStatus: varchar("sync_status", { length: 50 }).default("pending"), // 'pending', 'syncing', 'synced', 'failed', 'conflict'
  syncAttempts: integer("sync_attempts").default(0),
  lastSyncAttempt: timestamp("last_sync_attempt"),
  syncedAt: timestamp("synced_at"),
  
  // Conflict resolution
  conflictData: jsonb("conflict_data"), // Server vs local data conflicts
  conflictResolution: varchar("conflict_resolution", { length: 50 }), // 'server_wins', 'local_wins', 'merge', 'manual'
  isResolved: boolean("is_resolved").default(false),
  
  // Data integrity and security
  eventHash: varchar("event_hash", { length: 64 }), // SHA-256 hash for tampering detection
  encryptionKey: varchar("encryption_key", { length: 255 }), // Key reference for encrypted data
  isEncrypted: boolean("is_encrypted").default(false),
  
  // Timestamps and metadata
  clientTimestamp: timestamp("client_timestamp").notNull(), // When event occurred on client
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // Auto-cleanup old events
});

// Edge AI Models - Local AI models and configurations for offline operation
export const edgeAiModels = pgTable("edge_ai_models", {
  id: serial("id").primaryKey(),
  modelId: varchar("model_id", { length: 100 }).notNull().unique(),
  modelName: varchar("model_name", { length: 255 }).notNull(),
  modelType: varchar("model_type", { length: 100 }).notNull(), // 'personalization', 'intent_classifier', 'content_scorer', 'recommendation'
  
  // Model configuration and metadata
  modelVersion: varchar("model_version", { length: 50 }).notNull(),
  runtime: varchar("runtime", { length: 50 }).notNull(), // 'tensorflow_js', 'onnx', 'wasm', 'webgl', 'webgpu'
  deviceCapability: varchar("device_capability", { length: 50 }), // 'high_end', 'mid_range', 'low_end', 'mobile'
  
  // Model data and performance
  modelData: jsonb("model_data").notNull(), // Model weights, config, or reference URL
  modelSize: integer("model_size"), // Size in bytes
  loadTime: integer("load_time"), // Average load time in milliseconds
  inferenceTime: integer("inference_time"), // Average inference time in milliseconds
  accuracy: real("accuracy"), // Model accuracy percentage (0-100)
  
  // Deployment and caching
  deploymentStrategy: varchar("deployment_strategy", { length: 50 }).default("lazy"), // 'eager', 'lazy', 'on_demand'
  cacheStrategy: varchar("cache_strategy", { length: 50 }).default("memory"), // 'memory', 'indexeddb', 'localstorage'
  maxCacheSize: integer("max_cache_size").default(50), // MB
  
  // Model lifecycle
  isActive: boolean("is_active").default(true),
  isDeprecated: boolean("is_deprecated").default(false),
  deprecationDate: timestamp("deprecation_date"),
  
  // Security and validation
  modelHash: varchar("model_hash", { length: 64 }), // SHA-256 hash for integrity
  signature: text("signature"), // Digital signature for verification
  isVerified: boolean("is_verified").default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Device Sync State - Track sync state and capabilities for each device
export const deviceSyncState = pgTable("device_sync_state", {
  id: serial("id").primaryKey(),
  deviceId: varchar("device_id", { length: 255 }).notNull().unique(),
  userId: varchar("user_id", { length: 255 }),
  
  // Device identification and capabilities
  deviceType: varchar("device_type", { length: 50 }), // 'desktop', 'mobile', 'tablet', 'pwa'
  platform: varchar("platform", { length: 50 }), // 'chrome', 'firefox', 'safari', 'ios', 'android'
  userAgent: text("user_agent"),
  
  // Device capabilities for AI and offline features
  capabilities: jsonb("capabilities").notNull(), // WebGL, WebAssembly, IndexedDB, ServiceWorker support
  storageQuota: integer("storage_quota"), // Available storage in MB
  storageUsed: integer("storage_used"), // Used storage in MB
  
  // Network and connectivity
  connectionType: varchar("connection_type", { length: 50 }), // '4g', 'wifi', '3g', '2g', 'offline'
  isOnline: boolean("is_online").default(true),
  lastOnlineAt: timestamp("last_online_at").defaultNow(),
  networkQuality: varchar("network_quality", { length: 50 }), // 'high', 'medium', 'low', 'unstable'
  
  // Sync status and metrics
  lastSyncAt: timestamp("last_sync_at"),
  syncVersion: integer("sync_version").default(1),
  pendingEvents: integer("pending_events").default(0),
  syncErrors: integer("sync_errors").default(0),
  
  // Performance and optimization
  avgSyncTime: integer("avg_sync_time"), // Average sync time in milliseconds
  batteryLevel: real("battery_level"), // Battery percentage (0-100)
  isLowPowerMode: boolean("is_low_power_mode").default(false),
  
  // Security and authentication
  deviceFingerprint: varchar("device_fingerprint", { length: 255 }), // Unique device fingerprint
  encryptionSupported: boolean("encryption_supported").default(false),
  isCompromised: boolean("is_compromised").default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Offline Analytics Buffer - Store analytics events for batch sync
export const offlineAnalyticsBuffer = pgTable("offline_analytics_buffer", {
  id: serial("id").primaryKey(),
  bufferId: uuid("buffer_id").defaultRandom().notNull().unique(),
  deviceId: varchar("device_id", { length: 255 }).notNull(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  
  // Analytics event data
  eventType: varchar("event_type", { length: 100 }).notNull(), // 'page_view', 'click', 'scroll', 'form_submit', 'quiz_answer'
  eventCategory: varchar("event_category", { length: 100 }), // 'engagement', 'conversion', 'navigation', 'error'
  eventAction: varchar("event_action", { length: 100 }),
  eventLabel: varchar("event_label", { length: 255 }),
  eventValue: real("event_value"),
  
  // Event context and metadata
  pageUrl: text("page_url"),
  referrer: text("referrer"),
  screenResolution: varchar("screen_resolution", { length: 50 }),
  userAgent: text("user_agent"),
  
  // Custom dimensions and metrics
  customDimensions: jsonb("custom_dimensions"),
  customMetrics: jsonb("custom_metrics"),
  
  // Timing and performance
  clientTimestamp: timestamp("client_timestamp").notNull(),
  serverTimestamp: timestamp("server_timestamp").defaultNow(),
  pageLoadTime: integer("page_load_time"),
  
  // Batch processing
  batchId: varchar("batch_id", { length: 255 }),
  isBatched: boolean("is_batched").default(false),
  batchedAt: timestamp("batched_at"),
  
  // Sync status
  syncStatus: varchar("sync_status", { length: 50 }).default("pending"),
  syncAttempts: integer("sync_attempts").default(0),
  syncedAt: timestamp("synced_at"),
  
  // Data quality and deduplication
  eventHash: varchar("event_hash", { length: 64 }), // For deduplication
  isDuplicate: boolean("is_duplicate").default(false),
  qualityScore: real("quality_score").default(100), // Data quality score (0-100)
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Offline Content Cache - Cache content, offers, and configurations for offline access
export const offlineContentCache = pgTable("offline_content_cache", {
  id: serial("id").primaryKey(),
  cacheId: varchar("cache_id", { length: 255 }).notNull().unique(),
  deviceId: varchar("device_id", { length: 255 }).notNull(),
  
  // Content identification
  contentType: varchar("content_type", { length: 100 }).notNull(), // 'page', 'quiz', 'offer', 'image', 'config', 'model'
  contentId: varchar("content_id", { length: 255 }).notNull(),
  contentUrl: text("content_url"),
  
  // Content data and metadata
  contentData: jsonb("content_data"), // Actual content or reference
  contentSize: integer("content_size"), // Size in bytes
  mimeType: varchar("mime_type", { length: 100 }),
  encoding: varchar("encoding", { length: 50 }),
  
  // Caching strategy and priority
  priority: integer("priority").default(5), // 1-10, higher = more important
  accessFrequency: integer("access_frequency").default(0),
  lastAccessedAt: timestamp("last_accessed_at"),
  
  // Cache management
  expiresAt: timestamp("expires_at"),
  isCompressed: boolean("is_compressed").default(false),
  compressionRatio: real("compression_ratio"),
  
  // Sync and validation
  sourceVersion: varchar("source_version", { length: 50 }),
  localVersion: varchar("local_version", { length: 50 }),
  isStale: boolean("is_stale").default(false),
  lastUpdatedAt: timestamp("last_updated_at"),
  
  // Security and integrity
  contentHash: varchar("content_hash", { length: 64 }), // SHA-256 hash
  isEncrypted: boolean("is_encrypted").default(false),
  encryptionKey: varchar("encryption_key", { length: 255 }),
  
  // Storage management
  storageType: varchar("storage_type", { length: 50 }).default("indexeddb"), // 'memory', 'indexeddb', 'localstorage'
  isPreloaded: boolean("is_preloaded").default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Conflict Resolution Log - Track and resolve data conflicts between offline and online
export const conflictResolutionLog = pgTable("conflict_resolution_log", {
  id: serial("id").primaryKey(),
  conflictId: uuid("conflict_id").defaultRandom().notNull().unique(),
  
  // Conflict context
  deviceId: varchar("device_id", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }),
  sessionId: varchar("session_id", { length: 255 }),
  
  // Conflict details
  conflictType: varchar("conflict_type", { length: 100 }).notNull(), // 'data_mismatch', 'version_conflict', 'schema_change', 'concurrent_edit'
  entityType: varchar("entity_type", { length: 100 }).notNull(), // 'user_profile', 'quiz_progress', 'preferences', 'analytics'
  entityId: varchar("entity_id", { length: 255 }).notNull(),
  
  // Conflict data
  localData: jsonb("local_data").notNull(), // Local version of data
  serverData: jsonb("server_data").notNull(), // Server version of data
  mergedData: jsonb("merged_data"), // Final resolved data
  
  // Resolution strategy and outcome
  resolutionStrategy: varchar("resolution_strategy", { length: 50 }).notNull(), // 'server_wins', 'local_wins', 'merge', 'manual'
  resolutionReason: text("resolution_reason"),
  isAutoResolved: boolean("is_auto_resolved").default(true),
  resolvedBy: varchar("resolved_by", { length: 255 }), // User ID or 'system'
  
  // Conflict metadata
  conflictSeverity: varchar("conflict_severity", { length: 50 }), // 'low', 'medium', 'high', 'critical'
  dataLossRisk: boolean("data_loss_risk").default(false),
  userNotified: boolean("user_notified").default(false),
  
  // Timestamps
  conflictDetectedAt: timestamp("conflict_detected_at").notNull(),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Type exports for TypeScript
export type OfflineSyncQueue = typeof offlineSyncQueue.$inferSelect;
export type InsertOfflineSyncQueue = typeof offlineSyncQueue.$inferInsert;
export type EdgeAiModel = typeof edgeAiModels.$inferSelect;
export type InsertEdgeAiModel = typeof edgeAiModels.$inferInsert;
export type DeviceSyncState = typeof deviceSyncState.$inferSelect;
export type InsertDeviceSyncState = typeof deviceSyncState.$inferInsert;
export type OfflineAnalyticsBuffer = typeof offlineAnalyticsBuffer.$inferSelect;
export type InsertOfflineAnalyticsBuffer = typeof offlineAnalyticsBuffer.$inferInsert;
export type OfflineContentCache = typeof offlineContentCache.$inferSelect;
export type InsertOfflineContentCache = typeof offlineContentCache.$inferInsert;
export type ConflictResolutionLog = typeof conflictResolutionLog.$inferSelect;
export type InsertConflictResolutionLog = typeof conflictResolutionLog.$inferInsert;

// Zod schemas for validation
export const insertOfflineSyncQueueSchema = createInsertSchema(offlineSyncQueue);
export const insertEdgeAiModelSchema = createInsertSchema(edgeAiModels);
export const insertDeviceSyncStateSchema = createInsertSchema(deviceSyncState);
export const insertOfflineAnalyticsBufferSchema = createInsertSchema(offlineAnalyticsBuffer);
export const insertOfflineContentCacheSchema = createInsertSchema(offlineContentCache);
export const insertConflictResolutionLogSchema = createInsertSchema(conflictResolutionLog);