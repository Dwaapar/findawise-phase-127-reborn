/**
 * Real-Time Layout Mutation Engine Database Schema
 * Enterprise-grade tables for dynamic layout mutations and personalization
 */

import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, real, index } from "drizzle-orm/pg-core";

// Layout templates table - master layout templates
export const layoutTemplates = pgTable("layout_templates", {
  id: serial("id").primaryKey(),
  templateId: varchar("template_id", { length: 100 }).notNull().unique(),
  templateName: text("template_name").notNull(),
  templateType: varchar("template_type", { length: 50 }).notNull(), // ecommerce, lead_gen, content, blog, etc.
  templateCategory: varchar("template_category", { length: 50 }).notNull(), // marketing, sales, support, etc.
  industry: varchar("industry", { length: 100 }), // Target industry
  layoutBlocks: jsonb("layout_blocks").notNull(), // Array of layout blocks
  defaultSettings: jsonb("default_settings"), // Default configuration
  deviceSupport: jsonb("device_support").default('["desktop", "tablet", "mobile"]'), // Supported devices
  browserSupport: jsonb("browser_support"), // Browser compatibility
  culturalAdaptations: jsonb("cultural_adaptations"), // Built-in cultural adaptations
  accessibilityFeatures: jsonb("accessibility_features"), // A11y features
  seoOptimized: boolean("seo_optimized").default(true),
  conversionOptimized: boolean("conversion_optimized").default(true),
  loadingPerformance: real("loading_performance").default(0.8), // Performance score 0-1
  version: varchar("version", { length: 20 }).default("1.0"),
  status: varchar("status", { length: 20 }).default("active"), // active, deprecated, testing
  usage_count: integer("usage_count").default(0),
  averageConversionRate: real("average_conversion_rate"),
  businessImpact: jsonb("business_impact"),
  userFeedback: jsonb("user_feedback"),
  createdBy: varchar("created_by", { length: 255 }),
  tags: jsonb("tags"), // For categorization and search
  description: text("description"),
  previewImage: text("preview_image"),
  documentationUrl: text("documentation_url"),
  isPublic: boolean("is_public").default(false), // Can be shared across empire
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  templateIdIdx: index("layout_templates_template_id_idx").on(table.templateId),
  templateTypeIdx: index("layout_templates_template_type_idx").on(table.templateType),
  statusIdx: index("layout_templates_status_idx").on(table.status),
  industryIdx: index("layout_templates_industry_idx").on(table.industry),
}));

// Layout blocks table - individual layout components
export const layoutBlocks = pgTable("layout_blocks", {
  id: serial("id").primaryKey(),
  blockId: varchar("block_id", { length: 100 }).notNull().unique(),
  blockName: text("block_name").notNull(),
  blockType: varchar("block_type", { length: 50 }).notNull(), // header, content, cta, sidebar, footer, etc.
  blockCategory: varchar("block_category", { length: 50 }).notNull(), // ui, marketing, conversion, etc.
  content: jsonb("content").notNull(), // Block content structure
  position: jsonb("position").notNull(), // {x, y, z} coordinates
  dimensions: jsonb("dimensions").notNull(), // {width, height} in percentage or pixels
  styles: jsonb("styles").notNull(), // CSS styles object
  animations: jsonb("animations"), // Animation configurations
  interactivityRules: jsonb("interactivity_rules"), // User interaction rules
  visibilityConditions: jsonb("visibility_conditions"), // When to show/hide
  responsiveSettings: jsonb("responsive_settings"), // Device-specific settings
  accessibilityAttributes: jsonb("accessibility_attributes"), // A11y attributes
  priority: integer("priority").default(5), // Rendering priority 1-10
  version: varchar("version", { length: 20 }).default("1.0"),
  isReusable: boolean("is_reusable").default(true), // Can be reused in other templates
  performanceImpact: real("performance_impact").default(0.1), // Performance cost 0-1
  mutabilityLevel: varchar("mutability_level", { length: 20 }).default("flexible"), // fixed, flexible, dynamic
  aiOptimizable: boolean("ai_optimizable").default(true), // Can AI modify this block
  culturalSensitive: boolean("cultural_sensitive").default(false), // Needs cultural adaptation
  businessCritical: boolean("business_critical").default(false), // Critical for business goals
  testingCompliant: boolean("testing_compliant").default(true), // Can be A/B tested
  createdBy: varchar("created_by", { length: 255 }),
  tags: jsonb("tags"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  blockIdIdx: index("layout_blocks_block_id_idx").on(table.blockId),
  blockTypeIdx: index("layout_blocks_block_type_idx").on(table.blockType),
  priorityIdx: index("layout_blocks_priority_idx").on(table.priority),
  mutabilityIdx: index("layout_blocks_mutability_level_idx").on(table.mutabilityLevel),
}));

// Layout mutations table - mutation rules and configurations
export const layoutMutations = pgTable("layout_mutations", {
  id: serial("id").primaryKey(),
  mutationId: varchar("mutation_id", { length: 100 }).notNull().unique(),
  mutationName: text("mutation_name").notNull(),
  mutationType: varchar("mutation_type", { length: 50 }).notNull(), // emotion, device, behavior, culture, time
  trigger: varchar("trigger", { length: 100 }).notNull(), // What triggers this mutation
  targetBlocks: jsonb("target_blocks").notNull(), // Array of block IDs to mutate
  mutationRules: jsonb("mutation_rules").notNull(), // What changes to make
  conditions: jsonb("conditions").notNull(), // Conditions that must be met
  priority: integer("priority").default(5), // Mutation priority 1-10
  duration: integer("duration").default(0), // Duration in milliseconds (0 = permanent)
  frequency: varchar("frequency", { length: 50 }).default("once"), // once, repeated, continuous
  cooldownPeriod: integer("cooldown_period").default(0), // Milliseconds before re-triggering
  mutationScope: varchar("mutation_scope", { length: 50 }).default("session"), // session, user, global
  reversible: boolean("reversible").default(true), // Can this mutation be reversed
  autoRevert: boolean("auto_revert").default(false), // Auto-revert after duration
  conflictResolution: varchar("conflict_resolution", { length: 50 }).default("priority"), // priority, merge, reject
  culturalContext: jsonb("cultural_context"), // Cultural considerations
  deviceContext: jsonb("device_context"), // Device-specific considerations
  emotionalContext: jsonb("emotional_context"), // Emotional state considerations
  businessImpact: jsonb("business_impact"), // Expected business impact
  testingPhase: varchar("testing_phase", { length: 50 }).default("production"), // testing, staging, production
  successMetrics: jsonb("success_metrics"), // How to measure success
  failureConditions: jsonb("failure_conditions"), // When to consider it failed
  rollbackStrategy: jsonb("rollback_strategy"), // How to rollback if needed
  isActive: boolean("is_active").default(true),
  applicationCount: integer("application_count").default(0), // Times applied
  successRate: real("success_rate"), // Success rate when applied
  averageImpact: real("average_impact"), // Average conversion impact
  createdBy: varchar("created_by", { length: 255 }),
  approvedBy: varchar("approved_by", { length: 255 }),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  mutationIdIdx: index("layout_mutations_mutation_id_idx").on(table.mutationId),
  mutationTypeIdx: index("layout_mutations_mutation_type_idx").on(table.mutationType),
  triggerIdx: index("layout_mutations_trigger_idx").on(table.trigger),
  priorityIdx: index("layout_mutations_priority_idx").on(table.priority),
  activeIdx: index("layout_mutations_active_idx").on(table.isActive),
}));

// User layout sessions table - track layout usage per user session
export const userLayoutSessions = pgTable("user_layout_sessions", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }),
  templateId: varchar("template_id", { length: 100 }).notNull(),
  layoutVersion: varchar("layout_version", { length: 20 }).default("1.0"),
  currentLayout: jsonb("current_layout").notNull(), // Current layout state
  appliedMutations: jsonb("applied_mutations"), // Array of applied mutations
  userContext: jsonb("user_context").notNull(), // User context at session start
  deviceInfo: jsonb("device_info").notNull(),
  locationInfo: jsonb("location_info"),
  behaviorData: jsonb("behavior_data"), // Real-time behavior data
  emotionProfile: jsonb("emotion_profile"), // Detected emotion state
  personalizationLevel: real("personalization_level").default(0.5), // Level of personalization applied
  conversionGoals: jsonb("conversion_goals"), // What conversions we're optimizing for
  abTestAssignments: jsonb("ab_test_assignments"), // A/B test variations assigned
  performanceMetrics: jsonb("performance_metrics"), // Layout performance data
  userEngagement: jsonb("user_engagement"), // Engagement metrics
  conversionEvents: jsonb("conversion_events"), // Conversion events that occurred
  layoutSatisfaction: real("layout_satisfaction"), // User satisfaction score
  sessionDuration: integer("session_duration"), // Total session duration in ms
  pageViews: integer("page_views").default(0),
  interactionCount: integer("interaction_count").default(0),
  bounceStatus: boolean("bounce_status"), // Did user bounce
  conversionStatus: boolean("conversion_status").default(false),
  errorLogs: jsonb("error_logs"), // Any layout errors encountered
  feedbackSubmitted: jsonb("feedback_submitted"), // User feedback on layout
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  sessionIdIdx: index("user_layout_sessions_session_id_idx").on(table.sessionId),
  userIdIdx: index("user_layout_sessions_user_id_idx").on(table.userId),
  templateIdIdx: index("user_layout_sessions_template_id_idx").on(table.templateId),
  conversionStatusIdx: index("user_layout_sessions_conversion_status_idx").on(table.conversionStatus),
  startedAtIdx: index("user_layout_sessions_started_at_idx").on(table.startedAt),
}));

// Mutation history table - track all mutations applied
export const mutationHistory = pgTable("mutation_history", {
  id: serial("id").primaryKey(),
  historyId: varchar("history_id", { length: 100 }).notNull().unique(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  mutationId: varchar("mutation_id", { length: 100 }).notNull(),
  mutationType: varchar("mutation_type", { length: 50 }).notNull(),
  trigger: varchar("trigger", { length: 100 }).notNull(),
  triggerData: jsonb("trigger_data"), // Data that triggered the mutation
  beforeState: jsonb("before_state").notNull(), // Layout state before mutation
  afterState: jsonb("after_state").notNull(), // Layout state after mutation
  mutationDiff: jsonb("mutation_diff"), // Specific changes made
  applicationStatus: varchar("application_status", { length: 20 }).default("applied"), // applied, failed, reverted
  applicationTime: integer("application_time"), // Time taken to apply mutation in ms
  userReaction: jsonb("user_reaction"), // How user reacted to mutation
  performanceImpact: real("performance_impact"), // Performance impact of mutation
  errorDetails: jsonb("error_details"), // Any errors during application
  successMetrics: jsonb("success_metrics"), // Success measurements
  businessOutcome: jsonb("business_outcome"), // Business results from mutation
  revertedAt: timestamp("reverted_at"), // When mutation was reverted (if applicable)
  revertReason: text("revert_reason"), // Why mutation was reverted
  duration: integer("duration"), // How long mutation was active
  userFeedback: jsonb("user_feedback"), // User feedback on this mutation
  automaticRevert: boolean("automatic_revert").default(false), // Was revert automatic
  culturalContext: jsonb("cultural_context"), // Cultural context when applied
  emotionalContext: jsonb("emotional_context"), // Emotional context when applied
  deviceContext: jsonb("device_context"), // Device context when applied
  qualityScore: real("quality_score"), // Quality of mutation application
  learningValue: real("learning_value"), // Value for ML learning
  appliedAt: timestamp("applied_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  historyIdIdx: index("mutation_history_history_id_idx").on(table.historyId),
  sessionIdIdx: index("mutation_history_session_id_idx").on(table.sessionId),
  mutationIdIdx: index("mutation_history_mutation_id_idx").on(table.mutationId),
  applicationStatusIdx: index("mutation_history_application_status_idx").on(table.applicationStatus),
  appliedAtIdx: index("mutation_history_applied_at_idx").on(table.appliedAt),
}));

// Layout performance analytics table - aggregate performance data
export const layoutPerformanceAnalytics = pgTable("layout_performance_analytics", {
  id: serial("id").primaryKey(),
  templateId: varchar("template_id", { length: 100 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD format
  totalSessions: integer("total_sessions").default(0),
  uniqueUsers: integer("unique_users").default(0),
  averageSessionDuration: integer("average_session_duration").default(0), // milliseconds
  averagePageViews: real("average_page_views").default(0),
  bounceRate: real("bounce_rate").default(0),
  conversionRate: real("conversion_rate").default(0),
  mutationApplicationRate: real("mutation_application_rate").default(0), // % sessions with mutations
  mutationSuccessRate: real("mutation_success_rate").default(0), // % successful mutations
  averagePersonalizationLevel: real("average_personalization_level").default(0),
  performanceMetrics: jsonb("performance_metrics").notNull(), // Load times, render times, etc.
  engagementMetrics: jsonb("engagement_metrics").notNull(), // Clicks, scrolls, hovers, etc.
  conversionMetrics: jsonb("conversion_metrics").notNull(), // Conversion funnels and rates
  deviceBreakdown: jsonb("device_breakdown").notNull(), // Performance by device
  culturalBreakdown: jsonb("cultural_breakdown"), // Performance by culture
  emotionalBreakdown: jsonb("emotional_breakdown"), // Performance by emotion
  topPerformingMutations: jsonb("top_performing_mutations"), // Best mutations for this template
  underperformingElements: jsonb("underperforming_elements"), // Elements that need improvement
  optimizationOpportunities: jsonb("optimization_opportunities"), // AI-identified opportunities
  userFeedbackSummary: jsonb("user_feedback_summary"), // Aggregated user feedback
  businessImpact: jsonb("business_impact"), // Revenue and business metrics
  trendsAnalysis: jsonb("trends_analysis"), // Trending patterns
  competitiveAnalysis: jsonb("competitive_analysis"), // How we compare to benchmarks
  recommendedImprovements: jsonb("recommended_improvements"), // AI recommendations
  qualityScore: real("quality_score").default(0.8), // Overall layout quality score
  dataQuality: real("data_quality").default(0.9), // Quality of underlying data
  sampleSize: integer("sample_size").default(0), // Number of data points
  confidenceLevel: real("confidence_level").default(0.95), // Statistical confidence
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  templateDateIdx: index("layout_performance_analytics_template_date_idx").on(table.templateId, table.date),
  conversionRateIdx: index("layout_performance_analytics_conversion_rate_idx").on(table.conversionRate),
  qualityScoreIdx: index("layout_performance_analytics_quality_score_idx").on(table.qualityScore),
}));

// Layout experiments table - A/B testing for layouts
export const layoutExperiments = pgTable("layout_experiments", {
  id: serial("id").primaryKey(),
  experimentId: varchar("experiment_id", { length: 100 }).notNull().unique(),
  experimentName: text("experiment_name").notNull(),
  experimentType: varchar("experiment_type", { length: 50 }).notNull(), // layout, mutation, personalization
  baselineTemplateId: varchar("baseline_template_id", { length: 100 }).notNull(),
  variants: jsonb("variants").notNull(), // Array of variant configurations
  trafficAllocation: jsonb("traffic_allocation").notNull(), // How traffic is split
  targetAudience: jsonb("target_audience"), // Who is included in experiment
  exclusionCriteria: jsonb("exclusion_criteria"), // Who is excluded
  primaryMetric: varchar("primary_metric", { length: 100 }).notNull(), // Main success metric
  secondaryMetrics: jsonb("secondary_metrics"), // Additional metrics to track
  hypotheses: jsonb("hypotheses").notNull(), // What we expect to happen
  culturalConsiderations: jsonb("cultural_considerations"), // Cultural factors
  deviceConsiderations: jsonb("device_considerations"), // Device-specific factors
  emotionalConsiderations: jsonb("emotional_considerations"), // Emotional factors
  status: varchar("status", { length: 20 }).default("draft"), // draft, running, paused, completed
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  plannedDuration: integer("planned_duration"), // Days
  minSampleSize: integer("min_sample_size").default(1000),
  maxSampleSize: integer("max_sample_size"),
  confidenceLevel: real("confidence_level").default(0.95),
  powerLevel: real("power_level").default(0.8), // Statistical power
  minimumDetectableEffect: real("minimum_detectable_effect").default(0.05), // MDE
  currentSampleSize: integer("current_sample_size").default(0),
  results: jsonb("results"), // Experiment results
  statisticalSignificance: real("statistical_significance"),
  practicalSignificance: real("practical_significance"), // Business significance
  winningVariant: varchar("winning_variant", { length: 100 }),
  liftAmount: real("lift_amount"), // Percentage lift
  confidenceInterval: jsonb("confidence_interval"), // CI for lift
  segmentedResults: jsonb("segmented_results"), // Results by segment
  unexpectedOutcomes: jsonb("unexpected_outcomes"), // Surprising findings
  learningsAndInsights: jsonb("learnings_and_insights"), // Key learnings
  recommendedActions: jsonb("recommended_actions"), // What to do next
  riskAssessment: jsonb("risk_assessment"), // Potential risks identified
  businessImpact: jsonb("business_impact"), // Business implications
  followUpExperiments: jsonb("follow_up_experiments"), // Suggested follow-ups
  createdBy: varchar("created_by", { length: 255 }),
  approvedBy: varchar("approved_by", { length: 255 }),
  reviewedBy: varchar("reviewed_by", { length: 255 }),
  stakeholders: jsonb("stakeholders"), // People involved in experiment
  budget: real("budget"), // Experiment budget
  actualCost: real("actual_cost"), // Actual cost incurred
  roi: real("roi"), // Return on investment
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  experimentIdIdx: index("layout_experiments_experiment_id_idx").on(table.experimentId),
  statusIdx: index("layout_experiments_status_idx").on(table.status),
  startDateIdx: index("layout_experiments_start_date_idx").on(table.startDate),
  baselineTemplateIdx: index("layout_experiments_baseline_template_idx").on(table.baselineTemplateId),
}));