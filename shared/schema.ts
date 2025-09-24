import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Import localization tables
export * from "./localization";

// Import SaaS-specific tables
export * from "./saasTables";

// Import Health & Wellness tables
export * from "./healthTables";

// Import Finance tables
export * from "./financeTables";

// Import Travel tables
export * from "./travelTables";

// Import Education tables
export * from "./educationTables";

// Import AI Tools tables
export * from "./aiToolsTables";

// Import AI/ML Centralization tables
export * from "./aiMLTables";

// Import Central Config Engine tables
export * from "./configTables";

// Import Semantic Graph and Vector Search tables
export * from "./semanticTables";

// Import Vector Search + Embeddings Engine tables
export * from "./vectorSearchTables";

// Import Self-Evolving Offer Engine tables
export * from "./offerEngineTables";

// Import Notification & Email Lifecycle Engine tables
export * from "./notificationTables";

// Import PWA + Mobile App Wrapper tables
export * from "./pwaTables";

// Import Funnel Engine tables
export * from "./funnelTables";

// Import Codex Auto-Audit & Self-Improvement Engine tables
export * from "./codexTables";

// Import Content & Offer Feed Engine tables
export * from "./contentFeedTables";

// Import Advanced Compliance/Privacy/Consent Engine tables
export * from "./complianceTables";

// Import Digital Product Storefront & Checkout Engine tables
export * from "./storefrontTables";

// Import AR/VR/3D CTA Renderer Engine tables
export * from "./ctaRendererTables";

// Import Export/Import Booster & Master Deployment System tables
export * from "./deploymentTables";

// Import AI-Native Operating System tables  
export * from "./aiNativeTables";

// Import Knowledge Memory Graph tables
export * from "./knowledgeMemoryTables";

// Import RLHF + Persona Fusion Engine tables
export * from "./rlhfTables";

// Import Live API Diff Tracker tables
export * from "./apiDiffTables";

// Import Offline AI Sync Engine + Edge AI Device Resilience tables
export * from "./offlineAiTables";

// Import Cultural Emotion Map Engine tables
export * from "./culturalEmotionTables";

// Import Layout Engine tables (includes mutation and template tables)
export * from "./layoutTables";

// Import Multi-Region Load Orchestrator tables
export * from "./multiRegionTables";

// Import Plugin Marketplace tables
export * from "./pluginTables";

// Import Smart Funnel Generator tables (explicit imports to avoid conflicts with funnelTables.ts)
export { 
  funnelBlueprints, 
  funnelInstances, 
  funnelExperiments, 
  funnelLifecycleIntegrations,
  funnelOptimizations
} from "./smartFunnelTables";

// Import Revenue Split Manager & Profit Forecast Engine tables
export * from "./revenueSplitTables";

// Import Federation Bridge tables
export * from "./federationTables";

// Import Empire Security Tables (JWT Auth + API Key Vault + CDN Cache + LLM Fallback)
export * from "./empireSecurityTables";

// Import Money/Traffic Growth Engine tables
export * from "./moneyTrafficGrowthTables";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// User Sessions table for behavioral tracking
export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }).notNull().unique(),
  userId: varchar("user_id", { length: 255 }),
  startTime: timestamp("start_time").defaultNow().notNull(),
  lastActivity: timestamp("last_activity").defaultNow().notNull(),
  totalTimeOnSite: integer("total_time_on_site").default(0), // in milliseconds
  pageViews: integer("page_views").default(0),
  interactions: integer("interactions").default(0),
  deviceInfo: jsonb("device_info"),
  location: jsonb("location"),
  preferences: jsonb("preferences"),
  segment: varchar("segment", { length: 50 }).default("new_visitor"),
  personalizationFlags: jsonb("personalization_flags"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Behavior Events table for detailed tracking
export const behaviorEvents = pgTable("behavior_events", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  eventData: jsonb("event_data"),
  pageSlug: varchar("page_slug", { length: 255 }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  userId: varchar("user_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Quiz Results table
export const quizResults = pgTable("quiz_results", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  quizId: varchar("quiz_id", { length: 255 }).notNull(),
  answers: jsonb("answers").notNull(),
  score: integer("score").notNull(),
  result: text("result").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  userId: varchar("user_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Affiliate Networks table - stores affiliate program configurations
export const affiliateNetworks = pgTable("affiliate_networks", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  baseUrl: text("base_url").notNull(),
  trackingParams: jsonb("tracking_params"), // JSON object for tracking parameters
  cookieSettings: jsonb("cookie_settings"), // JSON object for cookie configuration
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Affiliate Offers table - stores individual affiliate offers
export const affiliateOffers = pgTable("affiliate_offers", {
  id: serial("id").primaryKey(),
  networkId: integer("network_id").references(() => affiliateNetworks.id),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  emotion: varchar("emotion", { length: 50 }),
  targetUrl: text("target_url").notNull(),
  ctaText: varchar("cta_text", { length: 100 }),
  commission: varchar("commission", { length: 50 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Affiliate Clicks table - tracks all affiliate link clicks
export const affiliateClicks = pgTable("affiliate_clicks", {
  id: serial("id").primaryKey(),
  offerId: integer("offer_id").references(() => affiliateOffers.id),
  sessionId: varchar("session_id", { length: 255 }),
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address", { length: 45 }),
  referrerUrl: text("referrer_url"),
  sourcePage: varchar("source_page", { length: 255 }),
  clickedAt: timestamp("clicked_at").defaultNow(),
  conversionTracked: boolean("conversion_tracked").default(false),
  metadata: jsonb("metadata"), // Additional tracking data
});

// Page Affiliate Assignments table - links pages to affiliate offers
export const pageAffiliateAssignments = pgTable("page_affiliate_assignments", {
  id: serial("id").primaryKey(),
  pageSlug: varchar("page_slug", { length: 255 }).notNull(),
  offerId: integer("offer_id").references(() => affiliateOffers.id),
  position: varchar("position", { length: 50 }), // header, sidebar, footer, inline, etc.
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertAffiliateNetworkSchema = createInsertSchema(affiliateNetworks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAffiliateOfferSchema = createInsertSchema(affiliateOffers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAffiliateClickSchema = createInsertSchema(affiliateClicks).omit({
  id: true,
  clickedAt: true,
});

export const insertPageAffiliateAssignmentSchema = createInsertSchema(pageAffiliateAssignments).omit({
  id: true,
  createdAt: true,
});

export const insertUserSessionSchema = createInsertSchema(userSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBehaviorEventSchema = createInsertSchema(behaviorEvents).omit({
  id: true,
  createdAt: true,
  timestamp: true,
});

export const insertQuizResultSchema = createInsertSchema(quizResults).omit({
  id: true,
  createdAt: true,
  timestamp: true,
});

// Types
export type InsertAffiliateNetwork = z.infer<typeof insertAffiliateNetworkSchema>;
export type AffiliateNetwork = typeof affiliateNetworks.$inferSelect;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
export type UserSession = typeof userSessions.$inferSelect;
export type InsertBehaviorEvent = z.infer<typeof insertBehaviorEventSchema>;
export type BehaviorEvent = typeof behaviorEvents.$inferSelect;
export type InsertQuizResult = z.infer<typeof insertQuizResultSchema>;
export type QuizResult = typeof quizResults.$inferSelect;

export type InsertAffiliateOffer = z.infer<typeof insertAffiliateOfferSchema>;
export type AffiliateOffer = typeof affiliateOffers.$inferSelect;

export type InsertAffiliateClick = z.infer<typeof insertAffiliateClickSchema>;
export type AffiliateClick = typeof affiliateClicks.$inferSelect;

export type InsertPageAffiliateAssignment = z.infer<typeof insertPageAffiliateAssignmentSchema>;
export type PageAffiliateAssignment = typeof pageAffiliateAssignments.$inferSelect;

// A/B Testing & Experimentation Framework

// Experiments table - defines A/B tests
export const experiments = pgTable("experiments", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).notNull(), // 'page', 'offer', 'cta', 'quiz', 'content'
  targetEntity: varchar("target_entity", { length: 255 }).notNull(), // page slug, offer id, etc.
  trafficAllocation: integer("traffic_allocation").default(100), // percentage of traffic to include
  status: varchar("status", { length: 20 }).default("draft"), // draft, active, paused, completed
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdBy: varchar("created_by", { length: 255 }),
  metadata: jsonb("metadata"), // additional configuration
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Experiment Variants table - different versions in each experiment
export const experimentVariants = pgTable("experiment_variants", {
  id: serial("id").primaryKey(),
  experimentId: integer("experiment_id").references(() => experiments.id),
  slug: varchar("slug", { length: 100 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  trafficPercentage: integer("traffic_percentage").notNull(), // percentage of experiment traffic
  configuration: jsonb("configuration").notNull(), // variant-specific config (text, colors, etc.)
  isControl: boolean("is_control").default(false), // marks the control variant
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User Experiment Assignments table - tracks which variant each user sees
export const userExperimentAssignments = pgTable("user_experiment_assignments", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  experimentId: integer("experiment_id").references(() => experiments.id),
  variantId: integer("variant_id").references(() => experimentVariants.id),
  assignedAt: timestamp("assigned_at").defaultNow(),
  userId: varchar("user_id", { length: 255 }), // if user is logged in
  deviceFingerprint: varchar("device_fingerprint", { length: 255 }), // for cross-session tracking
  isActive: boolean("is_active").default(true),
});

// Experiment Events table - tracks all experiment-related events
export const experimentEvents = pgTable("experiment_events", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  experimentId: integer("experiment_id").references(() => experiments.id),
  variantId: integer("variant_id").references(() => experimentVariants.id),
  eventType: varchar("event_type", { length: 50 }).notNull(), // impression, click, conversion, bounce
  eventValue: varchar("event_value", { length: 255 }), // additional event data
  pageSlug: varchar("page_slug", { length: 255 }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  userId: varchar("user_id", { length: 255 }),
  metadata: jsonb("metadata"), // additional tracking data
});

// Experiment Results table - aggregated metrics per variant
export const experimentResults = pgTable("experiment_results", {
  id: serial("id").primaryKey(),
  experimentId: integer("experiment_id").references(() => experiments.id),
  variantId: integer("variant_id").references(() => experimentVariants.id),
  date: timestamp("date").notNull(),
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  bounces: integer("bounces").default(0),
  uniqueUsers: integer("unique_users").default(0),
  conversionRate: varchar("conversion_rate", { length: 10 }), // stored as percentage string
  clickThroughRate: varchar("click_through_rate", { length: 10 }),
  bounceRate: varchar("bounce_rate", { length: 10 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas for A/B testing
export const insertExperimentSchema = createInsertSchema(experiments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExperimentVariantSchema = createInsertSchema(experimentVariants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserExperimentAssignmentSchema = createInsertSchema(userExperimentAssignments).omit({
  id: true,
  assignedAt: true,
});

export const insertExperimentEventSchema = createInsertSchema(experimentEvents).omit({
  id: true,
  timestamp: true,
});

export const insertExperimentResultSchema = createInsertSchema(experimentResults).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for A/B testing
export type InsertExperiment = z.infer<typeof insertExperimentSchema>;
export type Experiment = typeof experiments.$inferSelect;

export type InsertExperimentVariant = z.infer<typeof insertExperimentVariantSchema>;
export type ExperimentVariant = typeof experimentVariants.$inferSelect;

export type InsertUserExperimentAssignment = z.infer<typeof insertUserExperimentAssignmentSchema>;
export type UserExperimentAssignment = typeof userExperimentAssignments.$inferSelect;

export type InsertExperimentEvent = z.infer<typeof insertExperimentEventSchema>;
export type ExperimentEvent = typeof experimentEvents.$inferSelect;

export type InsertExperimentResult = z.infer<typeof insertExperimentResultSchema>;
export type ExperimentResult = typeof experimentResults.$inferSelect;

// Lead Magnet & Email Capture System

// Lead Magnets table - defines different lead magnets/opt-in offers
export const leadMagnets = pgTable("lead_magnets", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).notNull(), // 'ebook', 'checklist', 'video', 'course', 'toolkit', 'quiz_result'
  deliveryMethod: varchar("delivery_method", { length: 50 }).notNull(), // 'email', 'download', 'redirect', 'webhook'
  deliveryUrl: text("delivery_url"), // URL for download or redirect
  deliveryConfig: jsonb("delivery_config"), // Additional delivery configuration
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Lead Forms table - configures lead capture forms
export const leadForms = pgTable("lead_forms", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  leadMagnetId: integer("lead_magnet_id").references(() => leadMagnets.id),
  formType: varchar("form_type", { length: 50 }).notNull(), // 'popup', 'inline', 'sidebar', 'exit_intent', 'scroll_trigger'
  triggerConfig: jsonb("trigger_config"), // When/how to show the form
  formFields: jsonb("form_fields").notNull(), // Form field configuration
  styling: jsonb("styling"), // Custom styling options
  emotion: varchar("emotion", { length: 50 }), // Emotion theme to use
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Lead Captures table - stores captured leads
export const leadCaptures = pgTable("lead_captures", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  leadFormId: integer("lead_form_id").references(() => leadForms.id),
  leadMagnetId: integer("lead_magnet_id").references(() => leadMagnets.id),
  email: varchar("email", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  additionalData: jsonb("additional_data"), // Extra form fields
  source: varchar("source", { length: 100 }), // Page/source where lead was captured
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address", { length: 45 }),
  referrerUrl: text("referrer_url"),
  utmSource: varchar("utm_source", { length: 100 }),
  utmMedium: varchar("utm_medium", { length: 100 }),
  utmCampaign: varchar("utm_campaign", { length: 100 }),
  utmTerm: varchar("utm_term", { length: 100 }),
  utmContent: varchar("utm_content", { length: 100 }),
  isVerified: boolean("is_verified").default(false),
  isDelivered: boolean("is_delivered").default(false),
  deliveredAt: timestamp("delivered_at"),
  unsubscribedAt: timestamp("unsubscribed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Lead Form Assignments table - links forms to pages/positions
export const leadFormAssignments = pgTable("lead_form_assignments", {
  id: serial("id").primaryKey(),
  leadFormId: integer("lead_form_id").references(() => leadForms.id),
  pageSlug: varchar("page_slug", { length: 255 }), // null means all pages
  position: varchar("position", { length: 50 }).notNull(), // 'header', 'sidebar', 'footer', 'inline', 'popup'
  priority: integer("priority").default(1),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Lead Experiments table - A/B test lead capture forms
export const leadExperiments = pgTable("lead_experiments", {
  id: serial("id").primaryKey(),
  experimentId: integer("experiment_id").references(() => experiments.id),
  leadFormId: integer("lead_form_id").references(() => leadForms.id),
  variantId: integer("variant_id").references(() => experimentVariants.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Lead Activities table - tracks lead interactions
export const leadActivities = pgTable("lead_activities", {
  id: serial("id").primaryKey(),
  leadCaptureId: integer("lead_capture_id").references(() => leadCaptures.id),
  activityType: varchar("activity_type", { length: 50 }).notNull(), // 'email_sent', 'email_opened', 'link_clicked', 'form_submitted', 'page_visited'
  activityData: jsonb("activity_data"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  sessionId: varchar("session_id", { length: 255 }),
  pageSlug: varchar("page_slug", { length: 255 }),
  metadata: jsonb("metadata"),
});

// Email Campaigns table - manage email sequences
export const emailCampaigns = pgTable("email_campaigns", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  leadMagnetId: integer("lead_magnet_id").references(() => leadMagnets.id),
  emailSequence: jsonb("email_sequence").notNull(), // Array of email templates
  triggerType: varchar("trigger_type", { length: 50 }).notNull(), // 'immediate', 'delayed', 'behavior_based'
  triggerConfig: jsonb("trigger_config"), // When to send emails
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas for Lead Capture System
export const insertLeadMagnetSchema = createInsertSchema(leadMagnets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLeadFormSchema = createInsertSchema(leadForms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLeadCaptureSchema = createInsertSchema(leadCaptures).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLeadFormAssignmentSchema = createInsertSchema(leadFormAssignments).omit({
  id: true,
  createdAt: true,
});

export const insertLeadExperimentSchema = createInsertSchema(leadExperiments).omit({
  id: true,
  createdAt: true,
});

export const insertLeadActivitySchema = createInsertSchema(leadActivities).omit({
  id: true,
  timestamp: true,
});

export const insertEmailCampaignSchema = createInsertSchema(emailCampaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for Lead Capture System
export type InsertLeadMagnet = z.infer<typeof insertLeadMagnetSchema>;
export type LeadMagnet = typeof leadMagnets.$inferSelect;

export type InsertLeadForm = z.infer<typeof insertLeadFormSchema>;
export type LeadForm = typeof leadForms.$inferSelect;

export type InsertLeadCapture = z.infer<typeof insertLeadCaptureSchema>;
export type LeadCapture = typeof leadCaptures.$inferSelect;

export type InsertLeadFormAssignment = z.infer<typeof insertLeadFormAssignmentSchema>;
export type LeadFormAssignment = typeof leadFormAssignments.$inferSelect;

export type InsertLeadExperiment = z.infer<typeof insertLeadExperimentSchema>;
export type LeadExperiment = typeof leadExperiments.$inferSelect;

export type InsertLeadActivity = z.infer<typeof insertLeadActivitySchema>;
export type LeadActivity = typeof leadActivities.$inferSelect;

export type InsertEmailCampaign = z.infer<typeof insertEmailCampaignSchema>;
export type EmailCampaign = typeof emailCampaigns.$inferSelect;

// ===========================================
// AI/ML ORCHESTRATOR TABLES
// ===========================================

// ML Models table - stores AI/ML model information and metadata
export const mlModels = pgTable("ml_models", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  version: varchar("version", { length: 50 }).notNull(),
  type: varchar("type", { length: 100 }).notNull(), // 'content_optimizer', 'cta_predictor', 'emotion_classifier', 'user_segmentation'
  algorithm: varchar("algorithm", { length: 100 }).notNull(), // 'random_forest', 'gradient_boosting', 'neural_network', 'transformer'
  purpose: text("purpose").notNull(),
  features: jsonb("features").notNull(), // Array of feature names used by the model
  hyperparameters: jsonb("hyperparameters"), // Model hyperparameters
  performance: jsonb("performance"), // Accuracy, precision, recall, F1 score, etc.
  trainingData: jsonb("training_data"), // Reference to training dataset and metadata
  modelPath: text("model_path"), // Path to saved model file
  isActive: boolean("is_active").default(true),
  isProduction: boolean("is_production").default(false),
  trainedAt: timestamp("trained_at"),
  deployedAt: timestamp("deployed_at"),
  lastUsedAt: timestamp("last_used_at"),
  usageCount: integer("usage_count").default(0),
  createdBy: varchar("created_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ML Training Data table - stores feature vectors and labels for training
export const mlTrainingData = pgTable("ml_training_data", {
  id: serial("id").primaryKey(),
  datasetName: varchar("dataset_name", { length: 255 }).notNull(),
  modelType: varchar("model_type", { length: 100 }).notNull(),
  features: jsonb("features").notNull(), // Feature vector
  labels: jsonb("labels").notNull(), // Target variables
  sourceEntity: varchar("source_entity", { length: 255 }), // page_slug, offer_id, etc.
  sourceType: varchar("source_type", { length: 100 }), // 'page', 'offer', 'cta', 'user_session'
  performanceMetrics: jsonb("performance_metrics"), // CTR, engagement, conversion, etc.
  contextData: jsonb("context_data"), // Additional context like emotion, archetype, etc.
  isValidated: boolean("is_validated").default(false),
  isOutlier: boolean("is_outlier").default(false),
  confidenceScore: integer("confidence_score").default(100), // 0-100
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ML Predictions table - stores model predictions and outcomes
export const mlPredictions = pgTable("ml_predictions", {
  id: serial("id").primaryKey(),
  predictionId: varchar("prediction_id", { length: 36 }).notNull().unique(),
  modelId: integer("model_id").references(() => mlModels.id),
  inputFeatures: jsonb("input_features").notNull(),
  prediction: jsonb("prediction").notNull(), // Predicted values
  confidence: integer("confidence").notNull(), // 0-100
  actualOutcome: jsonb("actual_outcome"), // Actual performance after implementation
  sourceEntity: varchar("source_entity", { length: 255 }),
  sourceType: varchar("source_type", { length: 100 }),
  orchestrationRunId: varchar("orchestration_run_id", { length: 255 }),
  wasImplemented: boolean("was_implemented").default(false),
  implementedAt: timestamp("implemented_at"),
  feedbackReceived: boolean("feedback_received").default(false),
  feedbackData: jsonb("feedback_data"),
  isCorrect: boolean("is_correct"), // Whether prediction was accurate
  predictionAccuracy: integer("prediction_accuracy"), // 0-100
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Orchestration Runs table - enhanced version for AI/ML tracking
export const orchestrationRuns = pgTable("orchestration_runs", {
  id: serial("id").primaryKey(),
  runId: varchar("run_id", { length: 255 }).notNull().unique(),
  status: varchar("status", { length: 50 }).notNull(), // 'running', 'completed', 'failed', 'cancelled', 'pending_approval'
  triggerType: varchar("trigger_type", { length: 50 }).notNull(), // 'manual', 'scheduled', 'threshold', 'llm_suggested'
  triggeredBy: varchar("triggered_by", { length: 255 }),
  orchestrationConfig: jsonb("orchestration_config").notNull(),
  analyticsSnapshot: jsonb("analytics_snapshot"), // Analytics data at time of run
  modelsUsed: jsonb("models_used"), // Array of model IDs used in this run
  changesProposed: jsonb("changes_proposed"), // Array of proposed changes
  changesApplied: jsonb("changes_applied"), // Array of applied changes
  changesRejected: jsonb("changes_rejected"), // Array of rejected changes
  approvalStatus: varchar("approval_status", { length: 50 }).default("auto_approved"), // 'auto_approved', 'pending', 'approved', 'rejected'
  approvedBy: varchar("approved_by", { length: 255 }),
  approvedAt: timestamp("approved_at"),
  backupId: varchar("backup_id", { length: 255 }),
  performanceMetrics: jsonb("performance_metrics"), // Expected vs actual performance
  mlConfidence: integer("ml_confidence"), // Overall ML confidence for this run
  errorLog: text("error_log"),
  executionTime: integer("execution_time"), // milliseconds
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Orchestration Changes table - detailed change tracking
export const orchestrationChanges = pgTable("orchestration_changes", {
  id: serial("id").primaryKey(),
  changeId: varchar("change_id", { length: 255 }).notNull().unique(),
  orchestrationRunId: varchar("orchestration_run_id", { length: 255 }).notNull(),
  changeType: varchar("change_type", { length: 100 }).notNull(), // 'page', 'emotion', 'cta', 'offer', 'module'
  targetEntity: varchar("target_entity", { length: 255 }).notNull(),
  action: varchar("action", { length: 50 }).notNull(), // 'promote', 'demote', 'modify', 'remove', 'create'
  beforeState: jsonb("before_state"),
  afterState: jsonb("after_state"),
  reason: text("reason").notNull(),
  mlPredictionId: varchar("ml_prediction_id", { length: 36 }),
  confidence: integer("confidence").notNull(), // 0-100
  expectedImpact: jsonb("expected_impact"), // Expected metrics improvement
  actualImpact: jsonb("actual_impact"), // Actual metrics after implementation
  status: varchar("status", { length: 50 }).notNull(), // 'proposed', 'approved', 'applied', 'rejected', 'rolled_back'
  appliedAt: timestamp("applied_at"),
  rolledBackAt: timestamp("rolled_back_at"),
  rollbackReason: text("rollback_reason"),
  isReversible: boolean("is_reversible").default(true),
  reverseChangeId: varchar("reverse_change_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// LLM Insights table - stores insights and suggestions from LLM agents
export const llmInsights = pgTable("llm_insights", {
  id: serial("id").primaryKey(),
  insightId: varchar("insight_id", { length: 36 }).notNull().unique(),
  llmProvider: varchar("llm_provider", { length: 100 }).notNull(), // 'openrouter', 'huggingface', 'openai'
  llmModel: varchar("llm_model", { length: 100 }).notNull(), // 'claude-3', 'gpt-4', 'mixtral-8x7b'
  insightType: varchar("insight_type", { length: 100 }).notNull(), // 'content_suggestion', 'cta_optimization', 'experiment_proposal', 'trend_analysis'
  analysisScope: varchar("analysis_scope", { length: 100 }), // 'single_page', 'site_wide', 'archetype_specific'
  targetEntity: varchar("target_entity", { length: 255 }),
  prompt: text("prompt").notNull(),
  response: text("response").notNull(),
  insights: jsonb("insights").notNull(), // Structured insights from LLM
  suggestions: jsonb("suggestions"), // Actionable suggestions
  confidence: integer("confidence"), // LLM's confidence in suggestions
  dataReferences: jsonb("data_references"), // Analytics data used for analysis
  tokenUsage: jsonb("token_usage"), // Token count for cost tracking
  processingTime: integer("processing_time"), // milliseconds
  status: varchar("status", { length: 50 }).default("generated"), // 'generated', 'reviewed', 'implemented', 'discarded'
  implementedChangeIds: jsonb("implemented_change_ids"), // Array of change IDs that resulted from this insight
  reviewedBy: varchar("reviewed_by", { length: 255 }),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// LLM Scheduling table - manages automated LLM analysis scheduling
export const llmScheduling = pgTable("llm_scheduling", {
  id: serial("id").primaryKey(),
  scheduleName: varchar("schedule_name", { length: 255 }).notNull().unique(),
  frequency: varchar("frequency", { length: 50 }).notNull(), // 'daily', 'weekly', 'monthly', 'on_threshold'
  analysisType: varchar("analysis_type", { length: 100 }).notNull(),
  scope: varchar("scope", { length: 100 }), // 'all_pages', 'underperforming', 'top_performing'
  triggerConditions: jsonb("trigger_conditions"), // Conditions that trigger analysis
  llmConfig: jsonb("llm_config").notNull(), // LLM provider, model, and prompt templates
  isActive: boolean("is_active").default(true),
  lastRunAt: timestamp("last_run_at"),
  nextRunAt: timestamp("next_run_at"),
  runCount: integer("run_count").default(0),
  successCount: integer("success_count").default(0),
  failureCount: integer("failure_count").default(0),
  averageExecutionTime: integer("average_execution_time"), // milliseconds
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Model Performance Tracking table - tracks model accuracy over time
export const modelPerformanceTracking = pgTable("model_performance_tracking", {
  id: serial("id").primaryKey(),
  modelId: integer("model_id").references(() => mlModels.id),
  evaluationDate: timestamp("evaluation_date").defaultNow(),
  evaluationType: varchar("evaluation_type", { length: 50 }).notNull(), // 'validation', 'production', 'a_b_test'
  datasetSize: integer("dataset_size"),
  metrics: jsonb("metrics").notNull(), // accuracy, precision, recall, F1, AUC, etc.
  confusionMatrix: jsonb("confusion_matrix"),
  featureImportance: jsonb("feature_importance"),
  predictionDistribution: jsonb("prediction_distribution"),
  driftDetection: jsonb("drift_detection"), // Data drift metrics
  performanceChange: jsonb("performance_change"), // Change from previous evaluation
  isProductionReady: boolean("is_production_ready").default(false),
  recommendedActions: jsonb("recommended_actions"), // Suggested improvements
  evaluatedBy: varchar("evaluated_by", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for AI/ML tables
export const insertMlModelSchema = createInsertSchema(mlModels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMlTrainingDataSchema = createInsertSchema(mlTrainingData).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMlPredictionSchema = createInsertSchema(mlPredictions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrchestrationRunSchema = createInsertSchema(orchestrationRuns).omit({
  id: true,
  createdAt: true,
});

export const insertOrchestrationChangeSchema = createInsertSchema(orchestrationChanges).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLlmInsightSchema = createInsertSchema(llmInsights).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLlmSchedulingSchema = createInsertSchema(llmScheduling).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertModelPerformanceTrackingSchema = createInsertSchema(modelPerformanceTracking).omit({
  id: true,
  createdAt: true,
});

// Types for AI/ML system
export type InsertMlModel = z.infer<typeof insertMlModelSchema>;
export type MlModel = typeof mlModels.$inferSelect;

export type InsertMlTrainingData = z.infer<typeof insertMlTrainingDataSchema>;
export type MlTrainingData = typeof mlTrainingData.$inferSelect;

export type InsertMlPrediction = z.infer<typeof insertMlPredictionSchema>;
export type MlPrediction = typeof mlPredictions.$inferSelect;

export type InsertOrchestrationRun = z.infer<typeof insertOrchestrationRunSchema>;
export type OrchestrationRun = typeof orchestrationRuns.$inferSelect;

export type InsertOrchestrationChange = z.infer<typeof insertOrchestrationChangeSchema>;
export type OrchestrationChange = typeof orchestrationChanges.$inferSelect;

export type InsertLlmInsight = z.infer<typeof insertLlmInsightSchema>;
export type LlmInsight = typeof llmInsights.$inferSelect;

export type InsertLlmScheduling = z.infer<typeof insertLlmSchedulingSchema>;
export type LlmScheduling = typeof llmScheduling.$inferSelect;

export type InsertModelPerformanceTracking = z.infer<typeof insertModelPerformanceTrackingSchema>;
export type ModelPerformanceTracking = typeof modelPerformanceTracking.$inferSelect;

// ===========================================
// CROSS-DEVICE USER PROFILES & FINGERPRINTING
// ===========================================

// Global User Profiles table - master user profiles across all devices
export const globalUserProfiles = pgTable("global_user_profiles", {
  id: serial("id").primaryKey(),
  uuid: varchar("uuid", { length: 36 }).notNull().unique(), // Master UUID for the user
  email: varchar("email", { length: 255 }).unique(), // Primary email for merging
  phone: varchar("phone", { length: 20 }).unique(), // Primary phone for merging
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  mergedFromSessions: jsonb("merged_from_sessions"), // Array of session IDs that were merged into this profile
  totalSessions: integer("total_sessions").default(0),
  totalPageViews: integer("total_page_views").default(0),
  totalInteractions: integer("total_interactions").default(0),
  totalTimeOnSite: integer("total_time_on_site").default(0), // in milliseconds
  firstVisit: timestamp("first_visit"),
  lastVisit: timestamp("last_visit"),
  preferredDeviceType: varchar("preferred_device_type", { length: 50 }), // mobile, desktop, tablet
  preferredBrowser: varchar("preferred_browser", { length: 50 }),
  preferredOS: varchar("preferred_os", { length: 50 }),
  locationData: jsonb("location_data"), // Aggregated location info
  preferences: jsonb("preferences"), // User preferences and settings
  segments: jsonb("segments"), // User segments array
  tags: jsonb("tags"), // User tags array
  customAttributes: jsonb("custom_attributes"), // Additional custom data
  lifetimeValue: integer("lifetime_value").default(0), // in cents
  conversionCount: integer("conversion_count").default(0),
  leadQualityScore: integer("lead_quality_score").default(0), // 0-100
  engagementScore: integer("engagement_score").default(0), // 0-100
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Device Fingerprints table - tracks unique device fingerprints
export const deviceFingerprints = pgTable("device_fingerprints", {
  id: serial("id").primaryKey(),
  fingerprint: varchar("fingerprint", { length: 255 }).notNull().unique(),
  globalUserId: integer("global_user_id").references(() => globalUserProfiles.id),
  deviceInfo: jsonb("device_info").notNull(), // Screen resolution, timezone, language, etc.
  browserInfo: jsonb("browser_info").notNull(), // User agent, plugins, canvas fingerprint
  hardwareInfo: jsonb("hardware_info"), // CPU, GPU, memory info
  networkInfo: jsonb("network_info"), // IP history, connection type
  confidenceScore: integer("confidence_score").default(0), // 0-100, how confident we are in this fingerprint
  sessionCount: integer("session_count").default(0),
  firstSeen: timestamp("first_seen").defaultNow(),
  lastSeen: timestamp("last_seen").defaultNow(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User Profile Merge History table - tracks profile merges
export const userProfileMergeHistory = pgTable("user_profile_merge_history", {
  id: serial("id").primaryKey(),
  masterProfileId: integer("master_profile_id").references(() => globalUserProfiles.id),
  mergedProfileId: integer("merged_profile_id"), // ID of the profile that was merged (now deleted)
  mergedSessionIds: jsonb("merged_session_ids"), // Array of session IDs that were merged
  mergeReason: varchar("merge_reason", { length: 100 }).notNull(), // 'email_match', 'phone_match', 'fingerprint_match', 'manual'
  mergeConfidence: integer("merge_confidence").default(0), // 0-100
  mergeData: jsonb("merge_data"), // Additional merge information
  mergedAt: timestamp("merged_at").defaultNow(),
  mergedBy: varchar("merged_by", { length: 255 }), // System or user ID
});

// Analytics Events table - comprehensive event tracking
export const analyticsEvents = pgTable("analytics_events", {
  id: serial("id").primaryKey(),
  eventId: varchar("event_id", { length: 36 }).notNull().unique(), // UUID for deduplication
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  globalUserId: integer("global_user_id").references(() => globalUserProfiles.id),
  deviceFingerprint: varchar("device_fingerprint", { length: 255 }),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  eventCategory: varchar("event_category", { length: 100 }),
  eventAction: varchar("event_action", { length: 100 }),
  eventLabel: varchar("event_label", { length: 255 }),
  eventValue: integer("event_value"),
  pageSlug: varchar("page_slug", { length: 255 }),
  pageTitle: varchar("page_title", { length: 255 }),
  referrerUrl: text("referrer_url"),
  utmSource: varchar("utm_source", { length: 100 }),
  utmMedium: varchar("utm_medium", { length: 100 }),
  utmCampaign: varchar("utm_campaign", { length: 100 }),
  utmTerm: varchar("utm_term", { length: 100 }),
  utmContent: varchar("utm_content", { length: 100 }),
  deviceType: varchar("device_type", { length: 50 }),
  browserName: varchar("browser_name", { length: 50 }),
  browserVersion: varchar("browser_version", { length: 50 }),
  operatingSystem: varchar("operating_system", { length: 50 }),
  screenResolution: varchar("screen_resolution", { length: 50 }),
  language: varchar("language", { length: 10 }),
  timezone: varchar("timezone", { length: 50 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  country: varchar("country", { length: 5 }),
  region: varchar("region", { length: 100 }),
  city: varchar("city", { length: 100 }),
  coordinates: jsonb("coordinates"), // {lat, lng}
  customData: jsonb("custom_data"), // Additional event-specific data
  serverTimestamp: timestamp("server_timestamp").defaultNow(),
  clientTimestamp: timestamp("client_timestamp"),
  processingDelay: integer("processing_delay"), // milliseconds between client and server
  isProcessed: boolean("is_processed").default(false),
  batchId: varchar("batch_id", { length: 36 }), // For batch processing
  createdAt: timestamp("created_at").defaultNow(),
});

// Session Bridge table - links sessions to global user profiles
export const sessionBridge = pgTable("session_bridge", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }).notNull().unique(),
  globalUserId: integer("global_user_id").references(() => globalUserProfiles.id),
  deviceFingerprint: varchar("device_fingerprint", { length: 255 }),
  linkMethod: varchar("link_method", { length: 50 }).notNull(), // 'email', 'phone', 'fingerprint', 'manual'
  linkConfidence: integer("link_confidence").default(0), // 0-100
  linkData: jsonb("link_data"), // Additional linking information
  linkedAt: timestamp("linked_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

// Analytics Sync Status table - tracks sync status for client-server analytics
export const analyticsSyncStatus = pgTable("analytics_sync_status", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  globalUserId: integer("global_user_id").references(() => globalUserProfiles.id),
  lastSyncAt: timestamp("last_sync_at").defaultNow(),
  lastClientEventId: varchar("last_client_event_id", { length: 36 }),
  lastServerEventId: varchar("last_server_event_id", { length: 36 }),
  pendingEventCount: integer("pending_event_count").default(0),
  syncVersion: varchar("sync_version", { length: 10 }).default("1.0"),
  clientVersion: varchar("client_version", { length: 20 }),
  deviceFingerprint: varchar("device_fingerprint", { length: 255 }),
  syncErrors: jsonb("sync_errors"), // Array of sync errors
  isHealthy: boolean("is_healthy").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas for cross-device system
export const insertGlobalUserProfileSchema = createInsertSchema(globalUserProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDeviceFingerprintSchema = createInsertSchema(deviceFingerprints).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserProfileMergeHistorySchema = createInsertSchema(userProfileMergeHistory).omit({
  id: true,
  mergedAt: true,
});

export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents).omit({
  id: true,
  serverTimestamp: true,
  createdAt: true,
}).extend({
  eventId: z.string().optional(), // Allow eventId to be optional
}).partial({
  globalUserId: true,
  deviceFingerprint: true,
  eventCategory: true,
  eventLabel: true,
  eventValue: true,
  pageTitle: true,
  referrerUrl: true,
  utmSource: true,
  utmMedium: true,
  utmCampaign: true,
  utmTerm: true,
  utmContent: true,
  browserName: true,
  browserVersion: true,
  operatingSystem: true,
  screenResolution: true,
  language: true,
  timezone: true,
  ipAddress: true,
  country: true,
  region: true,
  city: true,
  coordinates: true,
  customData: true,
  processingDelay: true,
  isProcessed: true,
  batchId: true
});

export const insertSessionBridgeSchema = createInsertSchema(sessionBridge).omit({
  id: true,
  linkedAt: true,
});

export const insertAnalyticsSyncStatusSchema = createInsertSchema(analyticsSyncStatus).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for cross-device system
export type InsertGlobalUserProfile = z.infer<typeof insertGlobalUserProfileSchema>;
export type GlobalUserProfile = typeof globalUserProfiles.$inferSelect;

export type InsertDeviceFingerprint = z.infer<typeof insertDeviceFingerprintSchema>;
export type DeviceFingerprint = typeof deviceFingerprints.$inferSelect;

export type InsertUserProfileMergeHistory = z.infer<typeof insertUserProfileMergeHistorySchema>;
export type UserProfileMergeHistory = typeof userProfileMergeHistory.$inferSelect;

export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;

export type InsertSessionBridge = z.infer<typeof insertSessionBridgeSchema>;
export type SessionBridge = typeof sessionBridge.$inferSelect;

export type InsertAnalyticsSyncStatus = z.infer<typeof insertAnalyticsSyncStatusSchema>;
export type AnalyticsSyncStatus = typeof analyticsSyncStatus.$inferSelect;

// ===========================================
// FINDAWISE NEURON FEDERATION SYSTEM - EMPIRE BRAIN
// ===========================================

// Neurons table - registry of all micro-apps in the federation
export const neurons = pgTable("neurons", {
  id: serial("id").primaryKey(),
  neuronId: varchar("neuron_id", { length: 100 }).notNull().unique(), // unique identifier
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 100 }).notNull(), // 'page-generator', 'affiliate', 'analytics', 'blog', etc.
  url: text("url").notNull(), // base URL of the neuron
  status: varchar("status", { length: 50 }).default("active"), // active, inactive, maintenance, error
  version: varchar("version", { length: 50 }),
  supportedFeatures: jsonb("supported_features"), // array of features this neuron supports
  lastCheckIn: timestamp("last_check_in"),
  healthScore: integer("health_score").default(100), // 0-100 health rating
  uptime: integer("uptime").default(0), // uptime in seconds
  registeredAt: timestamp("registered_at").defaultNow(),
  apiKey: varchar("api_key", { length: 255 }).notNull(), // JWT/token for authentication
  metadata: jsonb("metadata"), // additional neuron-specific data
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Neuron Configs table - versioned configurations for each neuron
export const neuronConfigs = pgTable("neuron_configs", {
  id: serial("id").primaryKey(),
  neuronId: varchar("neuron_id", { length: 100 }).references(() => neurons.neuronId),
  configVersion: varchar("config_version", { length: 50 }).notNull(),
  configData: jsonb("config_data").notNull(), // the actual configuration
  deployedAt: timestamp("deployed_at"),
  isActive: boolean("is_active").default(false),
  deployedBy: varchar("deployed_by", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Neuron Status Updates table - heartbeat and status reports from neurons
export const neuronStatusUpdates = pgTable("neuron_status_updates", {
  id: serial("id").primaryKey(),
  neuronId: varchar("neuron_id", { length: 100 }).references(() => neurons.neuronId),
  status: varchar("status", { length: 50 }).notNull(),
  healthScore: integer("health_score"),
  uptime: integer("uptime"),
  stats: jsonb("stats"), // performance stats, metrics, etc.
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  metadata: jsonb("metadata"),
});

// Federation Events table - logs all federation operations and API calls
export const federationEvents = pgTable("federation_events", {
  id: serial("id").primaryKey(),
  neuronId: varchar("neuron_id", { length: 100 }),
  eventType: varchar("event_type", { length: 100 }).notNull(), // 'register', 'config_update', 'status_update', 'api_call'
  eventData: jsonb("event_data"),
  initiatedBy: varchar("initiated_by", { length: 255 }), // user, system, neuron
  success: boolean("success").default(true),
  errorMessage: text("error_message"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Neuron Analytics table - aggregated analytics from all neurons
export const neuronAnalytics = pgTable("neuron_analytics", {
  id: serial("id").primaryKey(),
  neuronId: varchar("neuron_id", { length: 100 }).references(() => neurons.neuronId),
  date: timestamp("date").notNull(),
  pageViews: integer("page_views").default(0),
  uniqueVisitors: integer("unique_visitors").default(0),
  conversions: integer("conversions").default(0),
  revenue: varchar("revenue", { length: 20 }).default("0"), // stored as decimal string
  uptime: integer("uptime").default(0), // seconds of uptime for this day
  errorCount: integer("error_count").default(0),
  averageResponseTime: integer("average_response_time").default(0), // milliseconds
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Global Empire Config table - central configuration for the entire federation
export const empireConfig = pgTable("empire_config", {
  id: serial("id").primaryKey(),
  configKey: varchar("config_key", { length: 255 }).notNull().unique(),
  configValue: jsonb("config_value").notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }), // 'federation', 'analytics', 'security', etc.
  isSecret: boolean("is_secret").default(false), // for sensitive configurations
  version: varchar("version", { length: 50 }).default("1.0"),
  updatedBy: varchar("updated_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// API-Only Neuron Extensions for Phase 4
export const apiOnlyNeurons = pgTable("api_only_neurons", {
  id: serial("id").primaryKey(),
  neuronId: varchar("neuron_id", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 100 }).notNull(), // 'python-scraper', 'go-api', 'node-agent', 'data-processor', etc.
  language: varchar("language", { length: 50 }).notNull(), // 'python', 'go', 'nodejs', 'java', etc.
  version: varchar("version", { length: 50 }).notNull(),
  baseUrl: text("base_url"), // Optional for non-web services
  healthcheckEndpoint: text("healthcheck_endpoint").notNull(),
  apiEndpoints: jsonb("api_endpoints").notNull(), // Array of exposed endpoints
  authentication: jsonb("authentication").notNull(), // Auth config (jwt, api-key, etc.)
  capabilities: jsonb("capabilities").notNull(), // What this neuron can do
  dependencies: jsonb("dependencies"), // External services it depends on
  resourceRequirements: jsonb("resource_requirements"), // CPU, memory, storage needs
  deploymentInfo: jsonb("deployment_info"), // Container, host, scaling info
  status: varchar("status", { length: 50 }).default("inactive"), // inactive, active, maintenance, error, starting
  lastHeartbeat: timestamp("last_heartbeat"),
  healthScore: integer("health_score").default(100), // 0-100 health rating
  uptime: integer("uptime").default(0), // uptime in seconds
  errorCount: integer("error_count").default(0),
  totalRequests: integer("total_requests").default(0),
  successfulRequests: integer("successful_requests").default(0),
  averageResponseTime: integer("average_response_time").default(0), // milliseconds
  lastError: text("last_error"),
  alertThresholds: jsonb("alert_thresholds"), // When to trigger alerts
  autoRestartEnabled: boolean("auto_restart_enabled").default(true),
  maxRestartAttempts: integer("max_restart_attempts").default(3),
  currentRestartAttempts: integer("current_restart_attempts").default(0),
  lastRestartAttempt: timestamp("last_restart_attempt"),
  registeredAt: timestamp("registered_at").defaultNow(),
  apiKey: varchar("api_key", { length: 255 }).notNull(),
  metadata: jsonb("metadata"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// API-Only Neuron Heartbeats - Enhanced heartbeat tracking
export const apiNeuronHeartbeats = pgTable("api_neuron_heartbeats", {
  id: serial("id").primaryKey(),
  neuronId: varchar("neuron_id", { length: 100 }).references(() => apiOnlyNeurons.neuronId),
  status: varchar("status", { length: 50 }).notNull(),
  healthScore: integer("health_score").notNull(),
  uptime: integer("uptime").notNull(),
  processId: varchar("process_id", { length: 100 }),
  hostInfo: jsonb("host_info"), // hostname, IP, container ID, etc.
  systemMetrics: jsonb("system_metrics"), // CPU, memory, disk usage
  applicationMetrics: jsonb("application_metrics"), // App-specific metrics
  dependencyStatus: jsonb("dependency_status"), // Status of external dependencies
  errorLog: text("error_log"),
  warningsLog: jsonb("warnings_log"),
  performanceMetrics: jsonb("performance_metrics"), // Requests/sec, latency, etc.
  configVersion: varchar("config_version", { length: 50 }),
  buildVersion: varchar("build_version", { length: 100 }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// API-Only Neuron Commands - Command queue for remote operations
export const apiNeuronCommands = pgTable("api_neuron_commands", {
  id: serial("id").primaryKey(),
  commandId: varchar("command_id", { length: 36 }).notNull().unique(),
  neuronId: varchar("neuron_id", { length: 100 }).references(() => apiOnlyNeurons.neuronId),
  commandType: varchar("command_type", { length: 100 }).notNull(), // 'config_update', 'restart', 'stop', 'run_task', 'deploy', etc.
  commandData: jsonb("command_data").notNull(),
  priority: integer("priority").default(1), // 1-10, higher is more urgent
  status: varchar("status", { length: 50 }).default("pending"), // pending, sent, acknowledged, completed, failed, timeout
  issuedBy: varchar("issued_by", { length: 255 }).notNull(),
  issuedAt: timestamp("issued_at").defaultNow().notNull(),
  sentAt: timestamp("sent_at"),
  acknowledgedAt: timestamp("acknowledged_at"),
  completedAt: timestamp("completed_at"),
  failedAt: timestamp("failed_at"),
  timeoutAt: timestamp("timeout_at"),
  response: jsonb("response"), // Response from neuron
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0),
  maxRetries: integer("max_retries").default(3),
  metadata: jsonb("metadata"),
});

// API-Only Neuron Analytics - Detailed performance and usage analytics
export const apiNeuronAnalytics = pgTable("api_neuron_analytics", {
  id: serial("id").primaryKey(),
  neuronId: varchar("neuron_id", { length: 100 }).references(() => apiOnlyNeurons.neuronId),
  date: timestamp("date").notNull(),
  requestCount: integer("request_count").default(0),
  successfulRequests: integer("successful_requests").default(0),
  failedRequests: integer("failed_requests").default(0),
  averageResponseTime: integer("average_response_time").default(0), // milliseconds
  p95ResponseTime: integer("p95_response_time").default(0),
  p99ResponseTime: integer("p99_response_time").default(0),
  totalDataProcessed: integer("total_data_processed").default(0), // bytes or records
  errorRate: integer("error_rate").default(0), // percentage * 100
  uptime: integer("uptime").default(0), // seconds
  cpuUsageAvg: integer("cpu_usage_avg").default(0), // percentage * 100
  memoryUsageAvg: integer("memory_usage_avg").default(0), // percentage * 100
  diskUsageAvg: integer("disk_usage_avg").default(0), // percentage * 100
  networkBytesIn: integer("network_bytes_in").default(0),
  networkBytesOut: integer("network_bytes_out").default(0),
  customMetrics: jsonb("custom_metrics"), // Neuron-specific metrics
  alerts: jsonb("alerts"), // Alerts triggered during this period
  events: jsonb("events"), // Notable events (restarts, deployments, etc.)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas for Federation System
export const insertNeuronSchema = createInsertSchema(neurons).omit({
  id: true,
  registeredAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNeuronConfigSchema = createInsertSchema(neuronConfigs).omit({
  id: true,
  createdAt: true,
});

export const insertNeuronStatusUpdateSchema = createInsertSchema(neuronStatusUpdates).omit({
  id: true,
  timestamp: true,
}).extend({
  // Fix float/integer validation issues with robust transformation
  uptime: z.coerce.number().transform(val => Math.floor(Number(val) || 0)),
  healthScore: z.coerce.number().min(0).max(100).transform(val => Math.floor(Number(val) || 100)),
  // Add transformation for stats if needed
  stats: z.any().optional(),
  metadata: z.any().optional()
});

export const insertFederationEventSchema = createInsertSchema(federationEvents).omit({
  id: true,
  timestamp: true,
});

export const insertNeuronAnalyticsSchema = createInsertSchema(neuronAnalytics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmpireConfigSchema = createInsertSchema(empireConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Insert schemas for API-Only Neurons
export const insertApiOnlyNeuronSchema = createInsertSchema(apiOnlyNeurons).omit({
  id: true,
  registeredAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertApiNeuronHeartbeatSchema = createInsertSchema(apiNeuronHeartbeats).omit({
  id: true,
  timestamp: true,
}).extend({
  // Fix float/integer validation issues with robust transformation
  uptime: z.coerce.number().transform(val => Math.floor(Number(val) || 0)),
  healthScore: z.coerce.number().min(0).max(100).transform(val => Math.floor(Number(val) || 100)),
  // Add similar transformations for other potentially problematic numeric fields
  processId: z.string().optional(),
  hostInfo: z.any().optional(),
  systemMetrics: z.any().optional(),
  applicationMetrics: z.any().optional(),
  dependencyStatus: z.any().optional(),
  errorLog: z.string().optional(),
  warningsLog: z.any().optional(),
  performanceMetrics: z.any().optional(),
  configVersion: z.string().optional(),
  buildVersion: z.string().optional()
});

export const insertApiNeuronCommandSchema = createInsertSchema(apiNeuronCommands).omit({
  id: true,
  issuedAt: true,
});

export const insertApiNeuronAnalyticsSchema = createInsertSchema(apiNeuronAnalytics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for Federation System
export type InsertNeuron = z.infer<typeof insertNeuronSchema>;
export type Neuron = typeof neurons.$inferSelect;

export type InsertNeuronConfig = z.infer<typeof insertNeuronConfigSchema>;
export type NeuronConfig = typeof neuronConfigs.$inferSelect;

export type InsertNeuronStatusUpdate = z.infer<typeof insertNeuronStatusUpdateSchema>;
export type NeuronStatusUpdate = typeof neuronStatusUpdates.$inferSelect;

export type InsertFederationEvent = z.infer<typeof insertFederationEventSchema>;
export type FederationEvent = typeof federationEvents.$inferSelect;

export type InsertNeuronAnalytics = z.infer<typeof insertNeuronAnalyticsSchema>;
export type NeuronAnalytics = typeof neuronAnalytics.$inferSelect;

export type InsertEmpireConfig = z.infer<typeof insertEmpireConfigSchema>;
export type EmpireConfig = typeof empireConfig.$inferSelect;

// Types for API-Only Neurons
export type InsertApiOnlyNeuron = z.infer<typeof insertApiOnlyNeuronSchema>;
export type ApiOnlyNeuron = typeof apiOnlyNeurons.$inferSelect;

export type InsertApiNeuronHeartbeat = z.infer<typeof insertApiNeuronHeartbeatSchema>;
export type ApiNeuronHeartbeat = typeof apiNeuronHeartbeats.$inferSelect;

export type InsertApiNeuronCommand = z.infer<typeof insertApiNeuronCommandSchema>;
export type ApiNeuronCommand = typeof apiNeuronCommands.$inferSelect;

export type InsertApiNeuronAnalytics = z.infer<typeof insertApiNeuronAnalyticsSchema>;
export type ApiNeuronAnalytics = typeof apiNeuronAnalytics.$inferSelect;

// Enterprise Monitoring Tables
export const systemMetrics = pgTable("system_metrics", {
  id: serial("id").primaryKey(),
  metricName: varchar("metric_name", { length: 100 }).notNull(),
  value: real("value").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  metadata: text("metadata"),
  source: varchar("source", { length: 50 }).default("system"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const alertRules = pgTable("alert_rules", {
  id: serial("id").primaryKey(),
  ruleId: varchar("rule_id", { length: 100 }).unique().notNull(),
  metric: varchar("metric", { length: 100 }).notNull(),
  threshold: real("threshold").notNull(),
  operator: varchar("operator", { length: 20 }).notNull(),
  severity: varchar("severity", { length: 20 }).notNull(),
  actions: text("actions").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const performanceLogs = pgTable("performance_logs", {
  id: serial("id").primaryKey(),
  level: varchar("level", { length: 20 }).notNull(),
  component: varchar("component", { length: 100 }).notNull(),
  message: text("message").notNull(),
  metadata: text("metadata"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Insert schemas for monitoring tables
export const insertSystemMetricsSchema = createInsertSchema(systemMetrics).omit({
  id: true,
  createdAt: true
});

export const insertAlertRuleSchema = createInsertSchema(alertRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertPerformanceLogSchema = createInsertSchema(performanceLogs).omit({
  id: true,
  createdAt: true
});

// Types for monitoring tables
export type InsertSystemMetric = z.infer<typeof insertSystemMetricsSchema>;
export type SystemMetric = typeof systemMetrics.$inferSelect;

export type InsertAlertRule = z.infer<typeof insertAlertRuleSchema>;
export type AlertRule = typeof alertRules.$inferSelect;

export type InsertPerformanceLog = z.infer<typeof insertPerformanceLogSchema>;
export type PerformanceLog = typeof performanceLogs.$inferSelect;
