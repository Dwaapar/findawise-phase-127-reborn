import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, real, uuid, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ==========================================
// RLHF + PERSONA FUSION ENGINE TABLES
// ==========================================

// RLHF Feedback Collection - Explicit & Implicit signals
export const rlhfFeedback = pgTable("rlhf_feedback", {
  id: serial("id").primaryKey(),
  feedbackId: uuid("feedback_id").defaultRandom().notNull().unique(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  userId: integer("user_id"),
  
  // Context binding - what triggered this feedback
  agentId: varchar("agent_id", { length: 255 }),
  promptVersion: varchar("prompt_version", { length: 50 }),
  taskType: varchar("task_type", { length: 100 }).notNull(), // 'content_generation', 'offer_routing', 'quiz_scoring', 'cta_personalization'
  pagePath: varchar("page_path", { length: 500 }),
  userArchetype: varchar("user_archetype", { length: 100 }),
  
  // Feedback signals
  feedbackType: varchar("feedback_type", { length: 50 }).notNull(), // 'explicit', 'implicit'
  signalType: varchar("signal_type", { length: 50 }).notNull(), // 'thumbs_up', 'thumbs_down', 'rating', 'conversion', 'click', 'scroll', 'dwell', 'bounce'
  signalValue: real("signal_value").notNull(), // normalized 0.0 to 1.0
  rawValue: jsonb("raw_value"), // original signal data
  
  // Weighted scoring
  signalWeight: real("signal_weight").default(1.0).notNull(), // importance multiplier
  confidenceScore: real("confidence_score").default(0.5).notNull(),
  qualityScore: real("quality_score").default(0.5).notNull(), // bot detection, anomaly flagging
  
  // Temporal and context data
  interactionDuration: integer("interaction_duration"), // milliseconds
  deviceType: varchar("device_type", { length: 50 }),
  browserInfo: jsonb("browser_info"),
  geoLocation: varchar("geo_location", { length: 100 }),
  
  // Metadata
  metadata: jsonb("metadata").default({}).notNull(),
  processingStatus: varchar("processing_status", { length: 20 }).default("pending"), // 'pending', 'processed', 'ignored', 'flagged'
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  sessionIdx: index("rlhf_feedback_session_idx").on(table.sessionId),
  agentIdx: index("rlhf_feedback_agent_idx").on(table.agentId),
  signalIdx: index("rlhf_feedback_signal_idx").on(table.signalType),
  archetypeIdx: index("rlhf_feedback_archetype_idx").on(table.userArchetype),
  qualityIdx: index("rlhf_feedback_quality_idx").on(table.qualityScore)
}));

// Agent Reward Scoring - Performance tracking per agent/prompt
export const agentRewards = pgTable("agent_rewards", {
  id: serial("id").primaryKey(),
  rewardId: uuid("reward_id").defaultRandom().notNull().unique(),
  agentId: varchar("agent_id", { length: 255 }).notNull(),
  promptVersion: varchar("prompt_version", { length: 50 }),
  taskType: varchar("task_type", { length: 100 }).notNull(),
  
  // Reward metrics
  rewardScore: real("reward_score").notNull(), // calculated reward from feedback
  performanceScore: real("performance_score").notNull(), // normalized 0.0 to 1.0
  usageCount: integer("usage_count").default(0).notNull(),
  successRate: real("success_rate").default(0.0).notNull(),
  
  // Time-weighted scoring
  recentPerformance: real("recent_performance").default(0.0).notNull(), // last 24h
  weeklyPerformance: real("weekly_performance").default(0.0).notNull(),
  overallPerformance: real("overall_performance").default(0.0).notNull(),
  
  // Context performance breakdown
  personaPerformance: jsonb("persona_performance").default({}).notNull(), // performance by archetype
  devicePerformance: jsonb("device_performance").default({}).notNull(),
  geoPerformance: jsonb("geo_performance").default({}).notNull(),
  
  // Ranking and routing data
  currentRank: integer("current_rank").default(100).notNull(),
  routingWeight: real("routing_weight").default(1.0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  
  // Training metadata
  lastTrainingRun: timestamp("last_training_run"),
  trainingDataCount: integer("training_data_count").default(0).notNull(),
  modelVersion: varchar("model_version", { length: 50 }),
  
  // Temporal data
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  
  // Metadata
  metadata: jsonb("metadata").default({}).notNull()
}, (table) => ({
  agentIdx: index("agent_rewards_agent_idx").on(table.agentId),
  taskIdx: index("agent_rewards_task_idx").on(table.taskType),
  performanceIdx: index("agent_rewards_performance_idx").on(table.performanceScore),
  rankIdx: index("agent_rewards_rank_idx").on(table.currentRank)
}));

// Persona Fusion Profiles - Dynamic user archetypes
export const personaProfiles = pgTable("persona_profiles", {
  id: serial("id").primaryKey(),
  profileId: uuid("profile_id").defaultRandom().notNull().unique(),
  userId: integer("user_id"),
  sessionId: varchar("session_id", { length: 255 }),
  
  // Primary persona data
  primaryPersona: varchar("primary_persona", { length: 100 }).notNull(),
  primaryScore: real("primary_score").notNull(), // 0.0 to 1.0
  
  // Fusion scoring - hybrid personas
  personaScores: jsonb("persona_scores").notNull(), // {persona: score} mapping
  hybridPersonas: jsonb("hybrid_personas").default([]).notNull(), // top persona combinations
  
  // Behavioral traits
  traits: jsonb("traits").default({}).notNull(), // personality traits extracted
  preferences: jsonb("preferences").default({}).notNull(), // content, format, timing preferences
  interests: jsonb("interests").default([]).notNull(), // topic interests
  
  // Evolution tracking
  personaDrift: jsonb("persona_drift").default([]).notNull(), // historical persona changes
  confidenceLevel: real("confidence_level").default(0.5).notNull(),
  stabilityScore: real("stability_score").default(0.5).notNull(), // how stable the persona is
  
  // Learning sources
  quizResults: jsonb("quiz_results").default([]).notNull(),
  behaviorPatterns: jsonb("behavior_patterns").default({}).notNull(),
  engagementHistory: jsonb("engagement_history").default({}).notNull(),
  conversionHistory: jsonb("conversion_history").default({}).notNull(),
  
  // Personalization config
  uiPreferences: jsonb("ui_preferences").default({}).notNull(), // colors, layout, tone
  contentPreferences: jsonb("content_preferences").default({}).notNull(),
  offerPreferences: jsonb("offer_preferences").default({}).notNull(),
  
  // Temporal data
  firstSeen: timestamp("first_seen").defaultNow().notNull(),
  lastActive: timestamp("last_active").defaultNow().notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  
  // Metadata
  version: varchar("version", { length: 20 }).default("1.0").notNull(),
  dataQuality: real("data_quality").default(0.5).notNull(),
  metadata: jsonb("metadata").default({}).notNull()
}, (table) => ({
  userIdx: index("persona_profiles_user_idx").on(table.userId),
  sessionIdx: index("persona_profiles_session_idx").on(table.sessionId),
  primaryIdx: index("persona_profiles_primary_idx").on(table.primaryPersona),
  confidenceIdx: index("persona_profiles_confidence_idx").on(table.confidenceLevel)
}));

// Persona Evolution Tracking - Auto-discovery and clustering
export const personaEvolution = pgTable("persona_evolution", {
  id: serial("id").primaryKey(),
  evolutionId: uuid("evolution_id").defaultRandom().notNull().unique(),
  
  // Evolution type
  evolutionType: varchar("evolution_type", { length: 50 }).notNull(), // 'drift', 'split', 'merge', 'discovery'
  sourcePersona: varchar("source_persona", { length: 100 }),
  targetPersona: varchar("target_persona", { length: 100 }),
  
  // Discovery data for new personas
  clusterData: jsonb("cluster_data"), // ML clustering results
  clusterSize: integer("cluster_size"),
  clusterCohesion: real("cluster_cohesion"), // how tight the cluster is
  
  // Evolution metrics
  evolutionStrength: real("evolution_strength").notNull(), // how significant the change
  affectedUsers: integer("affected_users").default(0).notNull(),
  confidenceScore: real("confidence_score").default(0.5).notNull(),
  
  // Statistical data
  behaviorPatterns: jsonb("behavior_patterns").default({}).notNull(),
  demographicData: jsonb("demographic_data").default({}).notNull(),
  performanceMetrics: jsonb("performance_metrics").default({}).notNull(),
  
  // Approval and validation
  validationStatus: varchar("validation_status", { length: 20 }).default("pending"), // 'pending', 'approved', 'rejected', 'auto_approved'
  validatedBy: integer("validated_by"),
  validationNotes: text("validation_notes"),
  
  // Implementation status
  isImplemented: boolean("is_implemented").default(false).notNull(),
  implementedAt: timestamp("implemented_at"),
  rollbackPlan: jsonb("rollback_plan"),
  
  // Temporal data
  detectedAt: timestamp("detected_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
  
  // Metadata
  algorithmVersion: varchar("algorithm_version", { length: 50 }),
  metadata: jsonb("metadata").default({}).notNull()
}, (table) => ({
  typeIdx: index("persona_evolution_type_idx").on(table.evolutionType),
  sourceIdx: index("persona_evolution_source_idx").on(table.sourcePersona),
  statusIdx: index("persona_evolution_status_idx").on(table.validationStatus),
  strengthIdx: index("persona_evolution_strength_idx").on(table.evolutionStrength)
}));

// RLHF Training Sessions - Batch retraining records
export const rlhfTrainingSessions = pgTable("rlhf_training_sessions", {
  id: serial("id").primaryKey(),
  sessionId: uuid("session_id").defaultRandom().notNull().unique(),
  
  // Training configuration
  trainingType: varchar("training_type", { length: 50 }).notNull(), // 'agent_retrain', 'persona_update', 'routing_optimization'
  targetAgents: jsonb("target_agents").default([]).notNull(),
  targetPersonas: jsonb("target_personas").default([]).notNull(),
  
  // Data sources
  feedbackDataRange: jsonb("feedback_data_range").notNull(), // date range and filters
  trainingDataSize: integer("training_data_size").notNull(),
  dataQualityScore: real("data_quality_score").default(0.5).notNull(),
  
  // Training metrics
  preTrainingMetrics: jsonb("pre_training_metrics").default({}).notNull(),
  postTrainingMetrics: jsonb("post_training_metrics").default({}).notNull(),
  improvementScore: real("improvement_score"),
  
  // Configuration
  hyperparameters: jsonb("hyperparameters").default({}).notNull(),
  algorithmVersion: varchar("algorithm_version", { length: 50 }),
  computeResources: jsonb("compute_resources").default({}).notNull(),
  
  // Status tracking
  status: varchar("status", { length: 20 }).default("queued"), // 'queued', 'running', 'completed', 'failed', 'cancelled'
  progress: integer("progress").default(0).notNull(), // 0-100
  errorDetails: text("error_details"),
  
  // Results
  resultsSummary: jsonb("results_summary").default({}).notNull(),
  modelArtifacts: jsonb("model_artifacts").default({}).notNull(),
  validationResults: jsonb("validation_results").default({}).notNull(),
  
  // Temporal data
  queuedAt: timestamp("queued_at").defaultNow().notNull(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  
  // Metadata
  triggeredBy: integer("triggered_by"), // user who triggered
  automationReason: varchar("automation_reason", { length: 255 }), // if auto-triggered
  metadata: jsonb("metadata").default({}).notNull()
}, (table) => ({
  typeIdx: index("rlhf_training_type_idx").on(table.trainingType),
  statusIdx: index("rlhf_training_status_idx").on(table.status),
  completedIdx: index("rlhf_training_completed_idx").on(table.completedAt)
}));

// Persona Simulation Sessions - Testing and preview mode
export const personaSimulations = pgTable("persona_simulations", {
  id: serial("id").primaryKey(),
  simulationId: uuid("simulation_id").defaultRandom().notNull().unique(),
  
  // Simulation configuration
  simulationType: varchar("simulation_type", { length: 50 }).notNull(), // 'persona_preview', 'ab_test', 'dev_testing'
  targetPersona: varchar("target_persona", { length: 100 }).notNull(),
  personaConfig: jsonb("persona_config").notNull(), // persona settings to simulate
  
  // Test parameters
  testScenarios: jsonb("test_scenarios").default([]).notNull(),
  testDuration: integer("test_duration"), // minutes
  sampleSize: integer("sample_size"),
  
  // Simulation results
  engagementMetrics: jsonb("engagement_metrics").default({}).notNull(),
  conversionMetrics: jsonb("conversion_metrics").default({}).notNull(),
  uiMetrics: jsonb("ui_metrics").default({}).notNull(),
  
  // Comparison data
  baselineMetrics: jsonb("baseline_metrics").default({}).notNull(),
  improvementRatio: real("improvement_ratio"),
  statisticalSignificance: real("statistical_significance"),
  
  // Status and control
  status: varchar("status", { length: 20 }).default("planned"), // 'planned', 'running', 'paused', 'completed', 'cancelled'
  isActive: boolean("is_active").default(false).notNull(),
  
  // User feedback
  userFeedback: jsonb("user_feedback").default([]).notNull(),
  qualitativeNotes: text("qualitative_notes"),
  
  // Temporal data
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  
  // Metadata
  createdBy: integer("created_by").notNull(),
  metadata: jsonb("metadata").default({}).notNull()
}, (table) => ({
  typeIdx: index("persona_simulations_type_idx").on(table.simulationType),
  personaIdx: index("persona_simulations_persona_idx").on(table.targetPersona),
  statusIdx: index("persona_simulations_status_idx").on(table.status)
}));

// Federation RLHF Sync - Cross-neuron learning coordination
export const federationRlhfSync = pgTable("federation_rlhf_sync", {
  id: serial("id").primaryKey(),
  syncId: uuid("sync_id").defaultRandom().notNull().unique(),
  
  // Federation configuration
  sourceNeuron: varchar("source_neuron", { length: 255 }).notNull(),
  targetNeurons: jsonb("target_neurons").default([]).notNull(),
  syncType: varchar("sync_type", { length: 50 }).notNull(), // 'feedback_push', 'persona_pull', 'reward_sync', 'model_share'
  
  // Sync data
  syncData: jsonb("sync_data").notNull(),
  dataType: varchar("data_type", { length: 50 }).notNull(), // 'feedback', 'persona', 'reward', 'model'
  dataSize: integer("data_size").notNull(),
  
  // Quality and validation
  dataQuality: real("data_quality").default(0.5).notNull(),
  validationResults: jsonb("validation_results").default({}).notNull(),
  conflictResolution: jsonb("conflict_resolution").default({}).notNull(),
  
  // Processing status
  status: varchar("status", { length: 20 }).default("pending"), // 'pending', 'processing', 'completed', 'failed', 'partial'
  processedCount: integer("processed_count").default(0).notNull(),
  failedCount: integer("failed_count").default(0).notNull(),
  errorDetails: text("error_details"),
  
  // Federation metadata
  federationVersion: varchar("federation_version", { length: 50 }),
  consensusScore: real("consensus_score"), // how well neurons agree
  priorityLevel: varchar("priority_level", { length: 20 }).default("normal"), // 'low', 'normal', 'high', 'critical'
  
  // Temporal data
  initiatedAt: timestamp("initiated_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
  completedAt: timestamp("completed_at"),
  
  // Metadata
  metadata: jsonb("metadata").default({}).notNull()
}, (table) => ({
  sourceIdx: index("federation_rlhf_source_idx").on(table.sourceNeuron),
  typeIdx: index("federation_rlhf_type_idx").on(table.syncType),
  statusIdx: index("federation_rlhf_status_idx").on(table.status),
  priorityIdx: index("federation_rlhf_priority_idx").on(table.priorityLevel)
}));

// Zod schemas for validation
export const insertRlhfFeedbackSchema = createInsertSchema(rlhfFeedback);
export const insertAgentRewardSchema = createInsertSchema(agentRewards);
export const insertPersonaProfileSchema = createInsertSchema(personaProfiles);
export const insertPersonaEvolutionSchema = createInsertSchema(personaEvolution);
export const insertRlhfTrainingSessionSchema = createInsertSchema(rlhfTrainingSessions);
export const insertPersonaSimulationSchema = createInsertSchema(personaSimulations);
export const insertFederationRlhfSyncSchema = createInsertSchema(federationRlhfSync);

// TypeScript types
export type RlhfFeedback = typeof rlhfFeedback.$inferSelect;
export type NewRlhfFeedback = typeof rlhfFeedback.$inferInsert;
export type AgentReward = typeof agentRewards.$inferSelect;
export type NewAgentReward = typeof agentRewards.$inferInsert;
export type PersonaProfile = typeof personaProfiles.$inferSelect;
export type NewPersonaProfile = typeof personaProfiles.$inferInsert;
export type PersonaEvolution = typeof personaEvolution.$inferSelect;
export type NewPersonaEvolution = typeof personaEvolution.$inferInsert;
export type RlhfTrainingSession = typeof rlhfTrainingSessions.$inferSelect;
export type NewRlhfTrainingSession = typeof rlhfTrainingSessions.$inferInsert;
export type PersonaSimulation = typeof personaSimulations.$inferSelect;
export type NewPersonaSimulation = typeof personaSimulations.$inferInsert;
export type FederationRlhfSync = typeof federationRlhfSync.$inferSelect;
export type NewFederationRlhfSync = typeof federationRlhfSync.$inferInsert;