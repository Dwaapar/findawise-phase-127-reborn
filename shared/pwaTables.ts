import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// PWA Installation tracking
export const pwaInstalls = pgTable("pwa_installs", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }),
  userAgent: text("user_agent"),
  platform: varchar("platform", { length: 50 }), // Android, iOS, Desktop
  installSource: varchar("install_source", { length: 50 }), // banner, manual, share
  engagementScore: integer("engagement_score").default(0),
  deviceInfo: jsonb("device_info"),
  installedAt: timestamp("installed_at").defaultNow(),
  uninstalledAt: timestamp("uninstalled_at"),
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata")
});

// Push subscription management
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  topics: jsonb("topics").default([]), // Array of subscribed topics
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastNotificationAt: timestamp("last_notification_at"),
  metadata: jsonb("metadata")
});

// PWA notification campaigns and delivery tracking
export const pwaNotificationCampaigns = pgTable("pwa_notification_campaigns", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  topics: jsonb("topics").default([]), // Target topics
  targetedUsers: integer("targeted_users").default(0),
  deliveredCount: integer("delivered_count").default(0),
  clickedCount: integer("clicked_count").default(0),
  status: varchar("status", { length: 50 }).default("pending"), // pending, sending, completed, failed
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  metadata: jsonb("metadata") // urgency, action buttons, data payload
});

// PWA configuration and feature flags
export const pwaConfig = pgTable("pwa_config", {
  id: serial("id").primaryKey(),
  vapidPublicKey: text("vapid_public_key"),
  notificationTopics: jsonb("notification_topics").default([]),
  cacheStrategy: varchar("cache_strategy", { length: 50 }).default("networkFirst"),
  offlinePages: jsonb("offline_pages").default([]),
  installPromptConfig: jsonb("install_prompt_config"),
  features: jsonb("features"), // backgroundSync, pushNotifications, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// PWA usage analytics
export const pwaUsageStats = pgTable("pwa_usage_stats", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }),
  date: timestamp("date").defaultNow(),
  isStandalone: boolean("is_standalone").default(false),
  isOffline: boolean("is_offline").default(false),
  pageViews: integer("page_views").default(0),
  sessionDuration: integer("session_duration").default(0), // in seconds
  featuresUsed: jsonb("features_used").default([]),
  errors: jsonb("errors").default([]),
  performance: jsonb("performance"), // load times, cache hits, etc.
  metadata: jsonb("metadata")
});

// Offline queue for background sync
export const offlineQueue = pgTable("offline_queue", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }),
  action: varchar("action", { length: 100 }).notNull(), // form_submit, api_call, etc.
  endpoint: varchar("endpoint", { length: 255 }),
  method: varchar("method", { length: 10 }).default("POST"),
  data: jsonb("data"),
  status: varchar("status", { length: 50 }).default("pending"), // pending, processing, completed, failed
  retryCount: integer("retry_count").default(0),
  maxRetries: integer("max_retries").default(3),
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
  metadata: jsonb("metadata")
});

// Create Zod schemas for validation
export const insertPWAInstallSchema = createInsertSchema(pwaInstalls).omit({
  id: true,
  installedAt: true
});

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertPWANotificationCampaignSchema = createInsertSchema(pwaNotificationCampaigns).omit({
  id: true,
  createdAt: true,
  completedAt: true
});

export const insertPWAUsageStatsSchema = createInsertSchema(pwaUsageStats).omit({
  id: true,
  date: true
});

export const insertOfflineQueueSchema = createInsertSchema(offlineQueue).omit({
  id: true,
  createdAt: true,
  processedAt: true
});

// Empire-Grade Mobile Optimization Extensions

// App Store Optimization (ASO) tracking
export const pwaAsoMetrics = pgTable("pwa_aso_metrics", {
  id: serial("id").primaryKey(),
  appName: varchar("app_name", { length: 255 }).notNull(),
  platform: varchar("platform", { length: 50 }).notNull(), // ios, android, web
  keyword: varchar("keyword", { length: 255 }),
  ranking: integer("ranking"),
  searchVolume: integer("search_volume"),
  conversionRate: real("conversion_rate"),
  impressions: integer("impressions").default(0),
  installs: integer("installs").default(0),
  date: timestamp("date").defaultNow(),
  metadata: jsonb("metadata")
});

// Device capability tracking for optimization
export const deviceCapabilities = pgTable("device_capabilities", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }),
  deviceType: varchar("device_type", { length: 50 }), // mobile, tablet, desktop
  operatingSystem: varchar("operating_system", { length: 50 }),
  osVersion: varchar("os_version", { length: 50 }),
  browserEngine: varchar("browser_engine", { length: 50 }),
  screenResolution: varchar("screen_resolution", { length: 50 }),
  colorDepth: integer("color_depth"),
  pixelRatio: real("pixel_ratio"),
  touchSupport: boolean("touch_support").default(false),
  gpuInfo: jsonb("gpu_info"),
  networkType: varchar("network_type", { length: 20 }), // 4g, 5g, wifi, ethernet
  batteryLevel: real("battery_level"),
  memoryGB: real("memory_gb"),
  storageGB: real("storage_gb"),
  supportedFeatures: jsonb("supported_features"), // WebGL, WebRTC, etc.
  performanceMetrics: jsonb("performance_metrics"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Deep link tracking and attribution
export const deepLinkAnalytics = pgTable("deep_link_analytics", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }),
  linkType: varchar("link_type", { length: 50 }), // universal, custom, branch, firebase
  sourceUrl: text("source_url"),
  targetPath: varchar("target_path", { length: 500 }),
  campaignSource: varchar("campaign_source", { length: 100 }),
  campaignMedium: varchar("campaign_medium", { length: 100 }),
  campaignName: varchar("campaign_name", { length: 100 }),
  referrer: text("referrer"),
  userAgent: text("user_agent"),
  isSuccess: boolean("is_success").default(true),
  errorMessage: text("error_message"),
  conversionValue: real("conversion_value"),
  timestamp: timestamp("timestamp").defaultNow(),
  metadata: jsonb("metadata")
});

// Mobile app wrapper configurations
export const mobileAppConfigs = pgTable("mobile_app_configs", {
  id: serial("id").primaryKey(),
  platform: varchar("platform", { length: 50 }).notNull(), // ios, android, cordova, capacitor
  appVersion: varchar("app_version", { length: 50 }).notNull(),
  buildNumber: integer("build_number").notNull(),
  manifestConfig: jsonb("manifest_config").notNull(),
  nativePlugins: jsonb("native_plugins"), // camera, geolocation, contacts, etc.
  permissions: jsonb("permissions"), // requested permissions
  storeListingData: jsonb("store_listing_data"), // ASO metadata
  securityConfig: jsonb("security_config"), // SSL pinning, obfuscation, etc.
  performanceConfig: jsonb("performance_config"), // lazy loading, compression, etc.
  complianceSettings: jsonb("compliance_settings"), // GDPR, CCPA, etc.
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Advanced push notification personalization
export const pushPersonalization = pgTable("push_personalization", {
  id: serial("id").primaryKey(),
  subscriptionId: integer("subscription_id").references(() => pushSubscriptions.id),
  sessionId: varchar("session_id", { length: 255 }),
  userArchetype: varchar("user_archetype", { length: 100 }),
  preferredTime: varchar("preferred_time", { length: 20 }), // morning, afternoon, evening, night
  timezone: varchar("timezone", { length: 50 }),
  engagementScore: real("engagement_score").default(0),
  clickThroughRate: real("click_through_rate").default(0),
  unsubscribeRate: real("unsubscribe_rate").default(0),
  contentPreferences: jsonb("content_preferences"), // topics, formats, frequency
  devicePreferences: jsonb("device_preferences"),
  behaviorMetrics: jsonb("behavior_metrics"),
  lastEngagement: timestamp("last_engagement"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// PWA performance monitoring
export const pwaPerformanceMetrics = pgTable("pwa_performance_metrics", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }),
  deviceId: varchar("device_id", { length: 255 }),
  metricType: varchar("metric_type", { length: 50 }), // fcp, lcp, fid, cls, ttfb
  metricValue: real("metric_value").notNull(),
  url: text("url"),
  connectionType: varchar("connection_type", { length: 20 }),
  deviceType: varchar("device_type", { length: 20 }),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow(),
  additionalData: jsonb("additional_data")
});

// Create additional Zod schemas
export const insertPWAAsoMetricsSchema = createInsertSchema(pwaAsoMetrics).omit({
  id: true,
  date: true
});

export const insertDeviceCapabilitiesSchema = createInsertSchema(deviceCapabilities).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertDeepLinkAnalyticsSchema = createInsertSchema(deepLinkAnalytics).omit({
  id: true,
  timestamp: true
});

export const insertMobileAppConfigSchema = createInsertSchema(mobileAppConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertPushPersonalizationSchema = createInsertSchema(pushPersonalization).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertPWAPerformanceMetricsSchema = createInsertSchema(pwaPerformanceMetrics).omit({
  id: true,
  timestamp: true
});

// Type exports
export type PWAInstall = typeof pwaInstalls.$inferSelect;
export type InsertPWAInstall = z.infer<typeof insertPWAInstallSchema>;

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;

export type PWANotificationCampaign = typeof pwaNotificationCampaigns.$inferSelect;
export type InsertPWANotificationCampaign = z.infer<typeof insertPWANotificationCampaignSchema>;

export type PWAUsageStats = typeof pwaUsageStats.$inferSelect;
export type InsertPWAUsageStats = z.infer<typeof insertPWAUsageStatsSchema>;

export type OfflineQueueItem = typeof offlineQueue.$inferSelect;
export type InsertOfflineQueueItem = z.infer<typeof insertOfflineQueueSchema>;

// New empire-grade types
export type PWAAsoMetrics = typeof pwaAsoMetrics.$inferSelect;
export type InsertPWAAsoMetrics = z.infer<typeof insertPWAAsoMetricsSchema>;

export type DeviceCapabilities = typeof deviceCapabilities.$inferSelect;
export type InsertDeviceCapabilities = z.infer<typeof insertDeviceCapabilitiesSchema>;

export type DeepLinkAnalytics = typeof deepLinkAnalytics.$inferSelect;
export type InsertDeepLinkAnalytics = z.infer<typeof insertDeepLinkAnalyticsSchema>;

export type MobileAppConfig = typeof mobileAppConfigs.$inferSelect;
export type InsertMobileAppConfig = z.infer<typeof insertMobileAppConfigSchema>;

export type PushPersonalization = typeof pushPersonalization.$inferSelect;
export type InsertPushPersonalization = z.infer<typeof insertPushPersonalizationSchema>;

export type PWAPerformanceMetrics = typeof pwaPerformanceMetrics.$inferSelect;
export type InsertPWAPerformanceMetrics = z.infer<typeof insertPWAPerformanceMetricsSchema>;