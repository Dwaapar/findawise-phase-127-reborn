/**
 * Cultural Emotion Map Engine Database Schema
 * Enterprise-grade tables for cultural emotion mapping and personalization
 */

import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, real, index } from "drizzle-orm/pg-core";

// Cultural mappings table - master cultural data
export const culturalMappings = pgTable("cultural_mappings", {
  id: serial("id").primaryKey(),
  countryCode: varchar("country_code", { length: 3 }).notNull().unique(),
  countryName: text("country_name").notNull(),
  region: varchar("region", { length: 100 }).notNull(),
  communicationStyle: varchar("communication_style", { length: 50 }).notNull(),
  colorPsychology: jsonb("color_psychology").notNull(),
  trustIndicators: jsonb("trust_indicators").notNull(),
  conversionTriggers: jsonb("conversion_triggers").notNull(),
  emotionPatterns: jsonb("emotion_patterns").notNull(),
  culturalContext: jsonb("cultural_context"),
  marketingPreferences: jsonb("marketing_preferences"),
  decisionMakingStyle: varchar("decision_making_style", { length: 50 }),
  collectivismScore: real("collectivism_score").default(0.5), // 0-1 scale
  uncertaintyAvoidance: real("uncertainty_avoidance").default(0.5), // 0-1 scale
  powerDistance: real("power_distance").default(0.5), // 0-1 scale
  masculinityIndex: real("masculinity_index").default(0.5), // 0-1 scale
  longTermOrientation: real("long_term_orientation").default(0.5), // 0-1 scale
  indulgenceLevel: real("indulgence_level").default(0.5), // 0-1 scale
  isActive: boolean("is_active").default(true),
  dataQuality: integer("data_quality").default(85), // Quality score 0-100
  lastValidated: timestamp("last_validated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  countryCodeIdx: index("cultural_mappings_country_code_idx").on(table.countryCode),
  regionIdx: index("cultural_mappings_region_idx").on(table.region),
  activeIdx: index("cultural_mappings_active_idx").on(table.isActive),
}));

// Emotion profiles table - detailed emotion definitions
export const emotionProfiles = pgTable("emotion_profiles", {
  id: serial("id").primaryKey(),
  emotionId: varchar("emotion_id", { length: 100 }).notNull().unique(),
  emotionName: text("emotion_name").notNull(),
  category: varchar("category", { length: 50 }).notNull(), // primary, secondary, complex
  intensity: real("intensity").default(0.5), // 0-1 scale
  culturalVariance: real("cultural_variance").default(0.3), // How much this emotion varies by culture
  universality: real("universality").default(0.7), // How universal this emotion is
  behavioralTriggers: jsonb("behavioral_triggers").notNull(),
  responsePatterns: jsonb("response_patterns").notNull(),
  neuralSignals: jsonb("neural_signals"), // For advanced emotion detection
  colorAssociations: jsonb("color_associations"),
  contextualModifiers: jsonb("contextual_modifiers"),
  oppositeEmotions: jsonb("opposite_emotions"),
  complementaryEmotions: jsonb("complementary_emotions"),
  psychologicalBasis: text("psychological_basis"),
  marketingApplication: jsonb("marketing_application"),
  conversionImpact: real("conversion_impact").default(0.5), // Impact on conversion rates
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  emotionIdIdx: index("emotion_profiles_emotion_id_idx").on(table.emotionId),
  categoryIdx: index("emotion_profiles_category_idx").on(table.category),
  intensityIdx: index("emotion_profiles_intensity_idx").on(table.intensity),
}));

// User emotion tracking table - real-time emotion analysis
export const userEmotionTracking = pgTable("user_emotion_tracking", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }),
  countryCode: varchar("country_code", { length: 3 }).notNull(),
  detectedEmotions: jsonb("detected_emotions").notNull(), // Real-time emotion scores
  dominantEmotion: varchar("dominant_emotion", { length: 100 }),
  emotionIntensity: real("emotion_intensity").default(0.5),
  culturalAlignment: real("cultural_alignment").default(0.5),
  behaviorContext: jsonb("behavior_context"), // Context that influenced emotion detection
  deviceType: varchar("device_type", { length: 50 }),
  interactionType: varchar("interaction_type", { length: 100 }), // page_view, click, scroll, etc.
  timeOnPage: integer("time_on_page").default(0), // milliseconds
  emotionConfidence: real("emotion_confidence").default(0.7), // Confidence in emotion detection
  biometricData: jsonb("biometric_data"), // For advanced emotion detection (if available)
  previousEmotions: jsonb("previous_emotions"), // Emotion journey
  culturalModifiers: jsonb("cultural_modifiers"), // Applied cultural adjustments
  personalizationApplied: jsonb("personalization_applied"), // What personalizations were triggered
  conversionProbability: real("conversion_probability"), // Predicted conversion likelihood
  optimizationSuggestions: jsonb("optimization_suggestions"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  sessionIdIdx: index("user_emotion_tracking_session_id_idx").on(table.sessionId),
  userIdIdx: index("user_emotion_tracking_user_id_idx").on(table.userId),
  countryCodeIdx: index("user_emotion_tracking_country_code_idx").on(table.countryCode),
  dominantEmotionIdx: index("user_emotion_tracking_dominant_emotion_idx").on(table.dominantEmotion),
  timestampIdx: index("user_emotion_tracking_timestamp_idx").on(table.timestamp),
}));

// Cultural A/B testing table - culture-specific experiments
export const culturalABTests = pgTable("cultural_ab_tests", {
  id: serial("id").primaryKey(),
  testId: varchar("test_id", { length: 100 }).notNull().unique(),
  testName: text("test_name").notNull(),
  targetCountries: jsonb("target_countries").notNull(), // Array of country codes
  emotionTargets: jsonb("emotion_targets").notNull(), // Which emotions to test
  variants: jsonb("variants").notNull(), // Different cultural variants
  trafficAllocation: jsonb("traffic_allocation").default('{"control": 50, "variant": 50}'),
  status: varchar("status", { length: 20 }).default("draft"), // draft, running, paused, completed
  culturalHypothesis: text("cultural_hypothesis"), // What cultural difference we're testing
  expectedOutcome: text("expected_outcome"),
  metrics: jsonb("metrics").notNull(), // What metrics to track
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  minSampleSize: integer("min_sample_size").default(1000),
  confidenceLevel: real("confidence_level").default(0.95),
  results: jsonb("results"), // Test results and analysis
  culturalInsights: jsonb("cultural_insights"), // Key cultural learnings
  winningVariant: varchar("winning_variant", { length: 100 }),
  statisticalSignificance: real("statistical_significance"),
  culturalSignificance: real("cultural_significance"), // How culturally meaningful the result is
  recommendedActions: jsonb("recommended_actions"),
  createdBy: varchar("created_by", { length: 255 }),
  approvedBy: varchar("approved_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  testIdIdx: index("cultural_ab_tests_test_id_idx").on(table.testId),
  statusIdx: index("cultural_ab_tests_status_idx").on(table.status),
  startDateIdx: index("cultural_ab_tests_start_date_idx").on(table.startDate),
}));

// Cultural personalization rules table - automated personalization logic
export const culturalPersonalizationRules = pgTable("cultural_personalization_rules", {
  id: serial("id").primaryKey(),
  ruleId: varchar("rule_id", { length: 100 }).notNull().unique(),
  ruleName: text("rule_name").notNull(),
  targetCountries: jsonb("target_countries").notNull(),
  emotionTriggers: jsonb("emotion_triggers").notNull(),
  conditions: jsonb("conditions").notNull(), // When to apply this rule
  personalizations: jsonb("personalizations").notNull(), // What changes to make
  priority: integer("priority").default(5), // Rule priority (1-10)
  ruleType: varchar("rule_type", { length: 50 }).notNull(), // layout, content, color, cta, etc.
  culturalReasoning: text("cultural_reasoning"), // Why this rule exists culturally
  expectedImpact: real("expected_impact").default(0.1), // Expected conversion lift
  actualImpact: real("actual_impact"), // Measured impact
  confidence: real("confidence").default(0.8), // Confidence in this rule
  testingPhase: varchar("testing_phase", { length: 50 }).default("production"), // testing, staging, production
  applicationCount: integer("application_count").default(0), // How many times applied
  successRate: real("success_rate"), // Success rate when applied
  culturalFeedback: jsonb("cultural_feedback"), // Feedback from cultural experts
  userFeedback: jsonb("user_feedback"), // User feedback on personalizations
  businessImpact: jsonb("business_impact"), // Revenue/conversion impact
  isActive: boolean("is_active").default(true),
  lastApplied: timestamp("last_applied"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  ruleIdIdx: index("cultural_personalization_rules_rule_id_idx").on(table.ruleId),
  ruleTypeIdx: index("cultural_personalization_rules_rule_type_idx").on(table.ruleType),
  priorityIdx: index("cultural_personalization_rules_priority_idx").on(table.priority),
  activeIdx: index("cultural_personalization_rules_active_idx").on(table.isActive),
}));

// Cultural analytics table - aggregate cultural insights
export const culturalAnalytics = pgTable("cultural_analytics", {
  id: serial("id").primaryKey(),
  countryCode: varchar("country_code", { length: 3 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD format
  uniqueVisitors: integer("unique_visitors").default(0),
  totalSessions: integer("total_sessions").default(0),
  averageSessionDuration: integer("average_session_duration").default(0), // milliseconds
  emotionDistribution: jsonb("emotion_distribution").notNull(), // Emotion frequency distribution
  dominantEmotions: jsonb("dominant_emotions").notNull(), // Top emotions for the day
  culturalPersonalizationsApplied: integer("cultural_personalizations_applied").default(0),
  personalizationSuccessRate: real("personalization_success_rate").default(0),
  conversionRate: real("conversion_rate").default(0),
  culturalConversionLift: real("cultural_conversion_lift").default(0), // Lift vs generic
  revenuePerVisitor: real("revenue_per_visitor").default(0),
  culturalRevenueImpact: real("cultural_revenue_impact").default(0),
  topPerformingRules: jsonb("top_performing_rules"), // Best performing personalization rules
  culturalInsights: jsonb("cultural_insights"), // Key cultural insights discovered
  qualityScore: real("quality_score").default(0.8), // Data quality score
  dataPoints: integer("data_points").default(0), // Number of data points collected
  culturalTrends: jsonb("cultural_trends"), // Trending cultural behaviors
  seasonalFactors: jsonb("seasonal_factors"), // Seasonal cultural considerations
  localEvents: jsonb("local_events"), // Local events that might affect behavior
  competitorAnalysis: jsonb("competitor_analysis"), // Cultural competitive insights
  recommendedActions: jsonb("recommended_actions"), // AI-generated recommendations
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  countryDateIdx: index("cultural_analytics_country_date_idx").on(table.countryCode, table.date),
  conversionRateIdx: index("cultural_analytics_conversion_rate_idx").on(table.conversionRate),
  qualityScoreIdx: index("cultural_analytics_quality_score_idx").on(table.qualityScore),
}));

// Cultural feedback table - expert and user feedback on cultural adaptations
export const culturalFeedback = pgTable("cultural_feedback", {
  id: serial("id").primaryKey(),
  feedbackId: varchar("feedback_id", { length: 100 }).notNull().unique(),
  feedbackType: varchar("feedback_type", { length: 50 }).notNull(), // expert, user, system
  countryCode: varchar("country_code", { length: 3 }).notNull(),
  culturalElementId: varchar("cultural_element_id", { length: 100 }), // What cultural element this is about
  elementType: varchar("element_type", { length: 50 }), // emotion, color, messaging, layout, etc.
  rating: integer("rating"), // 1-5 star rating
  feedback: text("feedback").notNull(),
  culturalAccuracy: real("cultural_accuracy"), // How culturally accurate (expert feedback)
  offensiveRisk: real("offensive_risk").default(0), // Risk of being culturally offensive
  improvementSuggestions: jsonb("improvement_suggestions"),
  culturalContext: text("cultural_context"), // Additional cultural context
  validationStatus: varchar("validation_status", { length: 20 }).default("pending"), // pending, validated, rejected
  expertValidation: jsonb("expert_validation"), // Expert review and validation
  userImpact: real("user_impact"), // Impact on user experience
  businessImpact: real("business_impact"), // Impact on business metrics
  implementationStatus: varchar("implementation_status", { length: 20 }).default("pending"),
  submittedBy: varchar("submitted_by", { length: 255 }),
  expertReviewer: varchar("expert_reviewer", { length: 255 }),
  reviewNotes: text("review_notes"),
  priority: integer("priority").default(3), // 1-5 priority scale
  resolved: boolean("resolved").default(false),
  resolution: text("resolution"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  feedbackIdIdx: index("cultural_feedback_feedback_id_idx").on(table.feedbackId),
  countryCodeIdx: index("cultural_feedback_country_code_idx").on(table.countryCode),
  feedbackTypeIdx: index("cultural_feedback_feedback_type_idx").on(table.feedbackType),
  validationStatusIdx: index("cultural_feedback_validation_status_idx").on(table.validationStatus),
  priorityIdx: index("cultural_feedback_priority_idx").on(table.priority),
}));