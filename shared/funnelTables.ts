import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, real, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Funnel Templates - Core funnel definitions
export const funnelTemplates = pgTable("funnel_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  category: varchar("category", { length: 100 }), // lead-gen, upsell, onboarding, retention
  isPublic: boolean("is_public").default(false),
  isActive: boolean("is_active").default(true),
  version: varchar("version", { length: 50 }).default("1.0.0"),
  
  // Funnel Structure
  blocks: jsonb("blocks").notNull(), // Array of block configurations
  flowLogic: jsonb("flow_logic").notNull(), // Routing and branching rules
  triggerRules: jsonb("trigger_rules"), // Entry conditions and triggers
  
  // AI/ML Configuration
  personalizationRules: jsonb("personalization_rules"),
  aiOptimizationSettings: jsonb("ai_optimization_settings"),
  mlModelConfig: jsonb("ml_model_config"),
  
  // Analytics & Testing
  conversionGoals: jsonb("conversion_goals"),
  testingConfig: jsonb("testing_config"), // A/B/N test settings
  
  // Metadata
  tags: jsonb("tags").default([]),
  metadata: jsonb("metadata"),
  createdBy: varchar("created_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Funnel Blocks - Reusable components
export const funnelBlocks = pgTable("funnel_blocks", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 100 }).notNull(), // quiz, calculator, content, cta, game, etc.
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  category: varchar("category", { length: 100 }),
  
  // Block Configuration
  config: jsonb("config").notNull(), // Block-specific settings
  content: jsonb("content").notNull(), // Text, media, questions, etc.
  styling: jsonb("styling"), // CSS/theme overrides
  
  // Behavior & Logic
  entryConditions: jsonb("entry_conditions"), // When to show this block
  exitConditions: jsonb("exit_conditions"), // When to advance/skip
  personalizationRules: jsonb("personalization_rules"),
  
  // Analytics
  trackingEvents: jsonb("tracking_events"), // Custom events to track
  
  // Metadata
  isReusable: boolean("is_reusable").default(true),
  isActive: boolean("is_active").default(true),
  tags: jsonb("tags").default([]),
  createdBy: varchar("created_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// User Funnel Sessions - Individual user journeys
export const userFunnelSessions = pgTable("user_funnel_sessions", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }),
  funnelId: integer("funnel_id").references(() => funnelTemplates.id),
  
  // Session State
  currentBlockId: integer("current_block_id"),
  currentStep: integer("current_step").default(0),
  status: varchar("status", { length: 50 }).default("active"), // active, completed, abandoned, paused
  
  // User Context
  userVector: jsonb("user_vector"), // AI-generated user profile
  emotionState: jsonb("emotion_state"), // Current emotional context
  deviceInfo: jsonb("device_info"),
  geoLocation: jsonb("geo_location"),
  referralSource: varchar("referral_source", { length: 255 }),
  
  // Journey Progress
  completedBlocks: jsonb("completed_blocks").default([]),
  skippedBlocks: jsonb("skipped_blocks").default([]),
  blockResponses: jsonb("block_responses").default({}), // User inputs/responses
  
  // Personalization Data
  assignedVariant: varchar("assigned_variant", { length: 100 }), // A/B test variant
  personalizationApplied: jsonb("personalization_applied"),
  aiRecommendations: jsonb("ai_recommendations"),
  
  // Analytics
  engagementScore: real("engagement_score").default(0),
  conversionScore: real("conversion_score").default(0),
  totalTimeSpent: integer("total_time_spent").default(0), // seconds
  
  // Session Management
  startedAt: timestamp("started_at").defaultNow(),
  lastActivityAt: timestamp("last_activity_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  resumeToken: varchar("resume_token", { length: 255 }),
  
  metadata: jsonb("metadata")
});

// Funnel Events - Detailed interaction tracking
export const funnelEvents = pgTable("funnel_events", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  funnelSessionId: integer("funnel_session_id").references(() => userFunnelSessions.id),
  
  // Event Details
  eventType: varchar("event_type", { length: 100 }).notNull(), // view, click, submit, skip, etc.
  blockId: integer("block_id"),
  blockType: varchar("block_type", { length: 100 }),
  
  // Event Data
  eventData: jsonb("event_data"), // Specific event payload
  userInput: jsonb("user_input"), // User responses/interactions
  
  // Context
  timestamp: timestamp("timestamp").defaultNow(),
  timeOnBlock: integer("time_on_block"), // milliseconds
  scrollDepth: real("scroll_depth"), // percentage
  clickPosition: jsonb("click_position"), // x, y coordinates
  
  // AI/ML Data
  emotionDetected: varchar("emotion_detected", { length: 50 }),
  intentScore: real("intent_score"),
  engagementLevel: varchar("engagement_level", { length: 50 }),
  
  metadata: jsonb("metadata")
});

// Funnel Analytics - Aggregated performance data
export const funnelAnalytics = pgTable("funnel_analytics", {
  id: serial("id").primaryKey(),
  funnelId: integer("funnel_id").references(() => funnelTemplates.id),
  blockId: integer("block_id"),
  
  // Time Period
  date: timestamp("date").notNull(),
  period: varchar("period", { length: 20 }).default("daily"), // hourly, daily, weekly, monthly
  
  // Core Metrics
  views: integer("views").default(0),
  interactions: integer("interactions").default(0),
  completions: integer("completions").default(0),
  conversions: integer("conversions").default(0),
  abandons: integer("abandons").default(0),
  
  // Performance Metrics
  averageTimeSpent: real("average_time_spent").default(0),
  bounceRate: real("bounce_rate").default(0),
  conversionRate: real("conversion_rate").default(0),
  engagementScore: real("engagement_score").default(0),
  
  // Revenue & Value
  revenue: real("revenue").default(0),
  avgOrderValue: real("avg_order_value").default(0),
  ltv: real("ltv").default(0), // lifetime value
  
  // A/B Testing
  variant: varchar("variant", { length: 100 }),
  testConfidence: real("test_confidence"),
  
  // Segmentation
  segment: varchar("segment", { length: 100 }),
  demographicData: jsonb("demographic_data"),
  
  metadata: jsonb("metadata")
});

// Funnel A/B Tests - Split testing configuration
export const funnelABTests = pgTable("funnel_ab_tests", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  funnelId: integer("funnel_id").references(() => funnelTemplates.id),
  
  // Test Configuration
  testType: varchar("test_type", { length: 50 }).default("ab"), // ab, multivariate, bandit
  variants: jsonb("variants").notNull(), // Array of test variants
  trafficSplit: jsonb("traffic_split").notNull(), // Percentage allocation
  
  // Test Conditions
  targetAudience: jsonb("target_audience"), // Audience criteria
  startConditions: jsonb("start_conditions"),
  stopConditions: jsonb("stop_conditions"),
  
  // Status & Results
  status: varchar("status", { length: 50 }).default("draft"), // draft, running, paused, completed
  winningVariant: varchar("winning_variant", { length: 100 }),
  confidence: real("confidence"),
  
  // Timing
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  
  // Metadata
  createdBy: varchar("created_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  metadata: jsonb("metadata")
});

// Funnel Triggers - External trigger conditions
export const funnelTriggers = pgTable("funnel_triggers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  funnelId: integer("funnel_id").references(() => funnelTemplates.id),
  
  // Trigger Configuration
  triggerType: varchar("trigger_type", { length: 100 }).notNull(), // page_view, scroll, time, event, api
  conditions: jsonb("conditions").notNull(), // Trigger conditions
  
  // Behavior
  action: varchar("action", { length: 100 }).notNull(), // start_funnel, skip_block, personalize
  actionConfig: jsonb("action_config"),
  
  // Targeting
  audienceRules: jsonb("audience_rules"),
  timingRules: jsonb("timing_rules"),
  frequencyRules: jsonb("frequency_rules"), // How often to trigger
  
  // Status
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(100),
  
  // Analytics
  triggerCount: integer("trigger_count").default(0),
  successRate: real("success_rate").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  metadata: jsonb("metadata")
});

// Funnel Integrations - External system connections
export const funnelIntegrations = pgTable("funnel_integrations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 100 }).notNull(), // webhook, email, crm, analytics, etc.
  
  // Integration Config
  endpoint: varchar("endpoint", { length: 500 }),
  credentials: jsonb("credentials"), // Encrypted credentials
  config: jsonb("config"), // Integration-specific settings
  
  // Mapping
  eventMapping: jsonb("event_mapping"), // Which events to send
  dataMapping: jsonb("data_mapping"), // How to transform data
  
  // Status & Health
  isActive: boolean("is_active").default(true),
  lastSync: timestamp("last_sync"),
  errorCount: integer("error_count").default(0),
  lastError: text("last_error"),
  
  // Security
  rateLimitConfig: jsonb("rate_limit_config"),
  retryConfig: jsonb("retry_config"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  metadata: jsonb("metadata")
});

// Create Zod schemas for validation
export const insertFunnelTemplateSchema = createInsertSchema(funnelTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertFunnelBlockSchema = createInsertSchema(funnelBlocks).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertUserFunnelSessionSchema = createInsertSchema(userFunnelSessions).omit({
  id: true,
  startedAt: true,
  lastActivityAt: true
});

export const insertFunnelEventSchema = createInsertSchema(funnelEvents).omit({
  id: true,
  timestamp: true
});

export const insertFunnelAnalyticsSchema = createInsertSchema(funnelAnalytics).omit({
  id: true
});

export const insertFunnelABTestSchema = createInsertSchema(funnelABTests).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertFunnelTriggerSchema = createInsertSchema(funnelTriggers).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertFunnelIntegrationSchema = createInsertSchema(funnelIntegrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Type exports
export type FunnelTemplate = typeof funnelTemplates.$inferSelect;
export type InsertFunnelTemplate = z.infer<typeof insertFunnelTemplateSchema>;

export type FunnelBlock = typeof funnelBlocks.$inferSelect;
export type InsertFunnelBlock = z.infer<typeof insertFunnelBlockSchema>;

export type UserFunnelSession = typeof userFunnelSessions.$inferSelect;
export type InsertUserFunnelSession = z.infer<typeof insertUserFunnelSessionSchema>;

export type FunnelEvent = typeof funnelEvents.$inferSelect;
export type InsertFunnelEvent = z.infer<typeof insertFunnelEventSchema>;

export type FunnelAnalytics = typeof funnelAnalytics.$inferSelect;
export type InsertFunnelAnalytics = z.infer<typeof insertFunnelAnalyticsSchema>;

export type FunnelABTest = typeof funnelABTests.$inferSelect;
export type InsertFunnelABTest = z.infer<typeof insertFunnelABTestSchema>;

export type FunnelTrigger = typeof funnelTriggers.$inferSelect;
export type InsertFunnelTrigger = z.infer<typeof insertFunnelTriggerSchema>;

export type FunnelIntegration = typeof funnelIntegrations.$inferSelect;
export type InsertFunnelIntegration = z.infer<typeof insertFunnelIntegrationSchema>;