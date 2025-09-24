import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, real, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Notification Templates - Core templates for all channels
export const notificationTemplates = pgTable("notification_templates", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  channel: varchar("channel", { length: 50 }).notNull(), // email, sms, push, in_app, whatsapp
  type: varchar("type", { length: 100 }).notNull(), // welcome, abandoned_cart, quiz_reminder, etc.
  
  // Template Content
  subject: text("subject"), // for email/push
  bodyTemplate: text("body_template").notNull(), // supports markdown + variables
  htmlTemplate: text("html_template"), // for email
  variables: jsonb("variables"), // available template variables
  
  // Metadata & Settings
  priority: varchar("priority", { length: 20 }).default("normal"), // low, normal, high, urgent
  segment: varchar("segment", { length: 100 }), // target segment
  locale: varchar("locale", { length: 10 }).default("en"), // i18n support
  
  // Personalization
  personalizationRules: jsonb("personalization_rules"), // dynamic content rules
  aiOptimized: boolean("ai_optimized").default(false), // AI-generated content
  
  // Status & Control
  isActive: boolean("is_active").default(true),
  isDefault: boolean("is_default").default(false), // default template for type
  
  // Analytics & Optimization
  testingEnabled: boolean("testing_enabled").default(false), // A/B testing
  conversionGoal: varchar("conversion_goal", { length: 100 }), // primary goal
  
  // Compliance
  requiresConsent: boolean("requires_consent").default(false),
  gdprCompliant: boolean("gdpr_compliant").default(true),
  
  // Metadata
  tags: jsonb("tags"), // organizational tags
  createdBy: varchar("created_by", { length: 255 }),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notification Triggers - Define when notifications are sent
export const notificationTriggers = pgTable("notification_triggers", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  // Trigger Configuration
  triggerType: varchar("trigger_type", { length: 50 }).notNull(), // event, schedule, manual, ai_predicted
  eventName: varchar("event_name", { length: 100 }), // user_signup, quiz_abandoned, etc.
  conditions: jsonb("conditions").notNull(), // trigger conditions
  
  // Timing & Scheduling
  delay: integer("delay").default(0), // delay in minutes
  timeWindow: jsonb("time_window"), // scheduling constraints
  timezone: varchar("timezone", { length: 50 }).default("UTC"),
  
  // Targeting
  targetSegments: jsonb("target_segments"), // user segments
  excludeSegments: jsonb("exclude_segments"), // exclusion rules
  
  // Channel Priority & Fallback
  channelPriority: jsonb("channel_priority").notNull(), // ordered list of channels
  fallbackLogic: jsonb("fallback_logic"), // fallback rules
  
  // Rate Limiting
  maxSendsPerUser: integer("max_sends_per_user").default(1), // per time period
  cooldownPeriod: integer("cooldown_period").default(1440), // minutes between sends
  
  // Status & Control
  isActive: boolean("is_active").default(true),
  pauseAfterFailures: integer("pause_after_failures").default(5),
  
  // Analytics
  priority: varchar("priority", { length: 20 }).default("normal"),
  expectedVolume: integer("expected_volume").default(100), // daily volume estimate
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notification Campaigns - Organize related notifications
export const notificationCampaigns = pgTable("notification_campaigns", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  // Campaign Details
  type: varchar("type", { length: 50 }).notNull(), // drip, blast, triggered, lifecycle
  status: varchar("status", { length: 20 }).default("draft"), // draft, active, paused, completed
  
  // Targeting
  targetAudience: jsonb("target_audience"), // audience definition
  estimatedReach: integer("estimated_reach").default(0),
  
  // Scheduling
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  
  // Goals & Metrics
  primaryGoal: varchar("primary_goal", { length: 100 }), // engagement, conversion, retention
  successMetrics: jsonb("success_metrics"), // KPI definitions
  
  // A/B Testing
  isTestCampaign: boolean("is_test_campaign").default(false),
  testConfiguration: jsonb("test_configuration"),
  
  // Budget & Limits
  budgetLimit: real("budget_limit"), // cost limits
  sendLimit: integer("send_limit"), // volume limits
  
  // Metadata
  tags: jsonb("tags"),
  createdBy: varchar("created_by", { length: 255 }),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notification Queue - Manages outgoing notifications
export const notificationQueue = pgTable("notification_queue", {
  id: serial("id").primaryKey(),
  
  // References
  templateId: integer("template_id").references(() => notificationTemplates.id),
  triggerId: integer("trigger_id").references(() => notificationTriggers.id),
  campaignId: integer("campaign_id").references(() => notificationCampaigns.id),
  
  // Recipient Information
  userId: varchar("user_id", { length: 255 }),
  sessionId: varchar("session_id", { length: 255 }),
  recipientEmail: varchar("recipient_email", { length: 255 }),
  recipientPhone: varchar("recipient_phone", { length: 50 }),
  recipientPushToken: text("recipient_push_token"),
  
  // Channel & Content
  channel: varchar("channel", { length: 50 }).notNull(),
  subject: text("subject"),
  content: text("content").notNull(),
  htmlContent: text("html_content"),
  
  // Personalization Data
  personalizationData: jsonb("personalization_data"),
  renderedAt: timestamp("rendered_at"),
  
  // Delivery Configuration
  priority: varchar("priority", { length: 20 }).default("normal"),
  scheduledFor: timestamp("scheduled_for").defaultNow(),
  retryCount: integer("retry_count").default(0),
  maxRetries: integer("max_retries").default(3),
  
  // Status Tracking
  status: varchar("status", { length: 20 }).default("queued"), // queued, sending, sent, failed, cancelled
  
  // Delivery Tracking
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  failedAt: timestamp("failed_at"),
  errorMessage: text("error_message"),
  providerResponse: jsonb("provider_response"),
  
  // Engagement Tracking
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  convertedAt: timestamp("converted_at"),
  unsubscribedAt: timestamp("unsubscribed_at"),
  
  // Analytics
  deliveryTime: integer("delivery_time"), // milliseconds to deliver
  engagementScore: real("engagement_score"),
  
  // Metadata
  metadata: jsonb("metadata"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userChannelIndex: uniqueIndex("user_channel_queue_idx").on(table.userId, table.channel, table.scheduledFor),
}));

// Notification Analytics - Track performance metrics
export const notificationAnalytics = pgTable("notification_analytics", {
  id: serial("id").primaryKey(),
  
  // References
  templateId: integer("template_id").references(() => notificationTemplates.id),
  triggerId: integer("trigger_id").references(() => notificationTriggers.id),
  campaignId: integer("campaign_id").references(() => notificationCampaigns.id),
  queueId: integer("queue_id").references(() => notificationQueue.id),
  
  // Time Period
  date: timestamp("date").notNull(),
  hour: integer("hour"), // 0-23 for hourly analytics
  
  // Channel & Segment
  channel: varchar("channel", { length: 50 }).notNull(),
  segment: varchar("segment", { length: 100 }),
  
  // Volume Metrics
  queued: integer("queued").default(0),
  sent: integer("sent").default(0),
  delivered: integer("delivered").default(0),
  failed: integer("failed").default(0),
  bounced: integer("bounced").default(0),
  
  // Engagement Metrics
  opened: integer("opened").default(0),
  clicked: integer("clicked").default(0),
  converted: integer("converted").default(0),
  unsubscribed: integer("unsubscribed").default(0),
  
  // Performance Metrics
  avgDeliveryTime: real("avg_delivery_time"), // average delivery time
  openRate: real("open_rate"),
  clickRate: real("click_rate"),
  conversionRate: real("conversion_rate"),
  unsubscribeRate: real("unsubscribe_rate"),
  
  // Cost Metrics
  costPerSend: real("cost_per_send"),
  totalCost: real("total_cost"),
  
  // Quality Metrics
  spamScore: real("spam_score"),
  reputationScore: real("reputation_score"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueAnalyticsIndex: uniqueIndex("unique_analytics_idx").on(table.templateId, table.channel, table.date, table.hour),
}));

// User Notification Preferences - User control over notifications
export const userNotificationPreferences = pgTable("user_notification_preferences", {
  id: serial("id").primaryKey(),
  
  // User Identification
  userId: varchar("user_id", { length: 255 }).notNull(),
  sessionId: varchar("session_id", { length: 255 }),
  email: varchar("email", { length: 255 }),
  
  // Channel Preferences
  emailEnabled: boolean("email_enabled").default(true),
  smsEnabled: boolean("sms_enabled").default(false),
  pushEnabled: boolean("push_enabled").default(true),
  inAppEnabled: boolean("in_app_enabled").default(true),
  whatsappEnabled: boolean("whatsapp_enabled").default(false),
  
  // Category Preferences
  marketingEnabled: boolean("marketing_enabled").default(true),
  transactionalEnabled: boolean("transactional_enabled").default(true),
  securityEnabled: boolean("security_enabled").default(true),
  productupdatesEnabled: boolean("product_updates_enabled").default(true),
  
  // Frequency Preferences
  frequency: varchar("frequency", { length: 20 }).default("normal"), // minimal, normal, frequent
  quietHours: jsonb("quiet_hours"), // do not disturb periods
  timezone: varchar("timezone", { length: 50 }).default("UTC"),
  
  // Personalization Preferences
  personalizationLevel: varchar("personalization_level", { length: 20 }).default("standard"), // minimal, standard, advanced
  aiOptimizationEnabled: boolean("ai_optimization_enabled").default(true),
  
  // Compliance
  consentGiven: boolean("consent_given").default(false),
  consentDate: timestamp("consent_date"),
  gdprCompliant: boolean("gdpr_compliant").default(true),
  
  // Global Controls
  globalOptOut: boolean("global_opt_out").default(false),
  optOutDate: timestamp("opt_out_date"),
  optOutReason: text("opt_out_reason"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueUserIndex: uniqueIndex("unique_user_preferences_idx").on(table.userId),
}));

// Notification Channels Configuration - Provider settings
export const notificationChannels = pgTable("notification_channels", {
  id: serial("id").primaryKey(),
  
  // Channel Details
  channel: varchar("channel", { length: 50 }).notNull().unique(), // email, sms, push, whatsapp
  provider: varchar("provider", { length: 100 }).notNull(), // sendgrid, twilio, fcm, etc.
  
  // Configuration
  config: jsonb("config").notNull(), // provider-specific configuration
  credentials: jsonb("credentials"), // encrypted credentials
  
  // Settings
  isActive: boolean("is_active").default(true),
  isPrimary: boolean("is_primary").default(false), // primary provider for channel
  priority: integer("priority").default(1), // fallback order
  
  // Rate Limiting
  rateLimit: integer("rate_limit").default(1000), // per hour
  dailyLimit: integer("daily_limit").default(10000),
  
  // Health Monitoring
  lastHealthCheck: timestamp("last_health_check"),
  healthStatus: varchar("health_status", { length: 20 }).default("healthy"), // healthy, degraded, unhealthy
  errorRate: real("error_rate").default(0),
  
  // Cost Tracking
  costPerSend: real("cost_per_send").default(0),
  monthlyBudget: real("monthly_budget"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schema exports for Zod validation
export const insertNotificationTemplateSchema = createInsertSchema(notificationTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationTriggerSchema = createInsertSchema(notificationTriggers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationCampaignSchema = createInsertSchema(notificationCampaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationQueueSchema = createInsertSchema(notificationQueue).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserNotificationPreferencesSchema = createInsertSchema(userNotificationPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationChannelSchema = createInsertSchema(notificationChannels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Type exports
export type NotificationTemplate = typeof notificationTemplates.$inferSelect;
export type InsertNotificationTemplate = z.infer<typeof insertNotificationTemplateSchema>;

export type NotificationTrigger = typeof notificationTriggers.$inferSelect;
export type InsertNotificationTrigger = z.infer<typeof insertNotificationTriggerSchema>;

export type NotificationCampaign = typeof notificationCampaigns.$inferSelect;
export type InsertNotificationCampaign = z.infer<typeof insertNotificationCampaignSchema>;

export type NotificationQueue = typeof notificationQueue.$inferSelect;
export type InsertNotificationQueue = z.infer<typeof insertNotificationQueueSchema>;

export type UserNotificationPreferences = typeof userNotificationPreferences.$inferSelect;
export type InsertUserNotificationPreferences = z.infer<typeof insertUserNotificationPreferencesSchema>;

export type NotificationChannel = typeof notificationChannels.$inferSelect;
export type InsertNotificationChannel = z.infer<typeof insertNotificationChannelSchema>;

export type NotificationAnalytics = typeof notificationAnalytics.$inferSelect;