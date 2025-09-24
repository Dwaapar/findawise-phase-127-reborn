import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// AI/ML Model Registry - Track all ML models and their performance
export const aiMLModels = pgTable("ai_ml_models", {
  id: serial("id").primaryKey(),
  modelId: varchar("model_id", { length: 255 }).notNull().unique(),
  modelType: varchar("model_type", { length: 100 }).notNull(), // archetype_classifier, content_optimizer, offer_ranker, engagement_predictor
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  version: varchar("version", { length: 50 }).notNull(),
  weights: jsonb("weights").notNull(), // Model weights and configuration
  hyperparameters: jsonb("hyperparameters"), // Training hyperparameters
  architecture: jsonb("architecture"), // Model architecture details
  trainingData: jsonb("training_data").notNull(), // Training dataset metadata
  performance: jsonb("performance").notNull(), // Accuracy, precision, recall, f1-score
  accuracy: decimal("accuracy", { precision: 5, scale: 4 }),
  isActive: boolean("is_active").default(true),
  isProduction: boolean("is_production").default(false),
  trainingStartTime: timestamp("training_start_time"),
  trainingEndTime: timestamp("training_end_time"),
  deployedAt: timestamp("deployed_at"),
  createdBy: varchar("created_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Learning Cycles - Track all AI/ML learning runs
export const learningCycles = pgTable("learning_cycles", {
  id: serial("id").primaryKey(),
  cycleId: varchar("cycle_id", { length: 255 }).notNull().unique(),
  type: varchar("type", { length: 50 }).notNull(), // daily, realtime, manual
  status: varchar("status", { length: 50 }).notNull(), // running, completed, failed, cancelled
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  dataProcessed: jsonb("data_processed").notNull(), // Events, sessions, conversions processed
  discoveries: jsonb("discoveries").notNull(), // Patterns, opportunities discovered
  modelsUpdated: jsonb("models_updated"), // List of models updated
  rulesGenerated: integer("rules_generated").default(0),
  performance: jsonb("performance"), // Expected improvements
  errorMessage: text("error_message"),
  triggeredBy: varchar("triggered_by", { length: 255 }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Personalization Rules - Dynamic rules for content/offer personalization
export const personalizationRules = pgTable("personalization_rules", {
  id: serial("id").primaryKey(),
  ruleId: varchar("rule_id", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  vertical: varchar("vertical", { length: 100 }).notNull(), // finance, health, saas, etc.
  archetype: varchar("archetype", { length: 100 }).notNull(),
  condition: jsonb("condition").notNull(), // Rule condition logic
  action: jsonb("action").notNull(), // Action to take when rule matches
  confidence: decimal("confidence", { precision: 5, scale: 4 }).notNull(),
  impact: decimal("impact", { precision: 5, scale: 4 }),
  priority: integer("priority").default(100),
  isActive: boolean("is_active").default(true),
  isTestMode: boolean("is_test_mode").default(false),
  testResults: jsonb("test_results"), // A/B test results
  appliedCount: integer("applied_count").default(0),
  successCount: integer("success_count").default(0),
  createdBy: varchar("created_by", { length: 255 }),
  learningCycleId: varchar("learning_cycle_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Neuron Data Pipelines - Track data flow from each neuron
export const neuronDataPipelines = pgTable("neuron_data_pipelines", {
  id: serial("id").primaryKey(),
  neuronId: varchar("neuron_id", { length: 255 }).notNull().unique(),
  neuronName: varchar("neuron_name", { length: 255 }).notNull(),
  vertical: varchar("vertical", { length: 100 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // react, api-only
  lastSync: timestamp("last_sync").defaultNow(),
  syncFrequency: integer("sync_frequency").default(300), // seconds
  metricsCollected: jsonb("metrics_collected").notNull(),
  healthScore: decimal("health_score", { precision: 5, scale: 4 }).default("1.0000"),
  configVersion: varchar("config_version", { length: 100 }),
  isActive: boolean("is_active").default(true),
  errorCount: integer("error_count").default(0),
  lastError: text("last_error"),
  lastErrorTime: timestamp("last_error_time"),
  dataQuality: jsonb("data_quality"), // Data quality metrics
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI/ML Experiments - Track A/B tests for AI-generated content
export const aiMLExperiments = pgTable("ai_ml_experiments", {
  id: serial("id").primaryKey(),
  experimentId: varchar("experiment_id", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 100 }).notNull(), // content_optimization, offer_ranking, archetype_targeting
  vertical: varchar("vertical", { length: 100 }),
  modelId: varchar("model_id", { length: 255 }),
  hypothesis: text("hypothesis"),
  variants: jsonb("variants").notNull(), // Experiment variants
  trafficAllocation: integer("traffic_allocation").default(100),
  status: varchar("status", { length: 50 }).default("draft"), // draft, active, paused, completed
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  results: jsonb("results"), // Experiment results and statistics
  winner: varchar("winner", { length: 255 }), // Winning variant
  confidence: decimal("confidence", { precision: 5, scale: 4 }),
  significance: decimal("significance", { precision: 5, scale: 4 }),
  createdBy: varchar("created_by", { length: 255 }),
  learningCycleId: varchar("learning_cycle_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Content Optimization Logs - Track AI-generated and optimized content
export const contentOptimizationLogs = pgTable("content_optimization_logs", {
  id: serial("id").primaryKey(),
  logId: varchar("log_id", { length: 255 }).notNull().unique(),
  contentType: varchar("content_type", { length: 100 }).notNull(), // article, cta, quiz_question, offer_copy
  contentId: varchar("content_id", { length: 255 }).notNull(),
  vertical: varchar("vertical", { length: 100 }).notNull(),
  originalContent: jsonb("original_content"),
  optimizedContent: jsonb("optimized_content").notNull(),
  optimizationType: varchar("optimization_type", { length: 100 }).notNull(), // ml_generated, rule_based, hybrid
  modelUsed: varchar("model_used", { length: 255 }),
  ruleUsed: varchar("rule_used", { length: 255 }),
  confidence: decimal("confidence", { precision: 5, scale: 4 }),
  expectedImprovement: decimal("expected_improvement", { precision: 5, scale: 4 }),
  actualImprovement: decimal("actual_improvement", { precision: 5, scale: 4 }),
  isApplied: boolean("is_applied").default(false),
  appliedAt: timestamp("applied_at"),
  isReverted: boolean("is_reverted").default(false),
  revertedAt: timestamp("reverted_at"),
  performance: jsonb("performance"), // CTR, engagement, conversion metrics
  learningCycleId: varchar("learning_cycle_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// AI/ML Analytics - Aggregated performance metrics
export const aiMLAnalytics = pgTable("ai_ml_analytics", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  vertical: varchar("vertical", { length: 100 }),
  neuronId: varchar("neuron_id", { length: 255 }),
  modelType: varchar("model_type", { length: 100 }),
  metrics: jsonb("metrics").notNull(), // Performance metrics
  predictions: integer("predictions").default(0),
  correctPredictions: integer("correct_predictions").default(0),
  accuracy: decimal("accuracy", { precision: 5, scale: 4 }),
  revenueImpact: decimal("revenue_impact", { precision: 10, scale: 2 }),
  userImpact: integer("user_impact").default(0),
  optimizationsApplied: integer("optimizations_applied").default(0),
  rulesTriggered: integer("rules_triggered").default(0),
  experimentsRunning: integer("experiments_running").default(0),
  dataQuality: decimal("data_quality", { precision: 5, scale: 4 }),
  systemHealth: varchar("system_health", { length: 50 }).default("healthy"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Model Training Jobs - Track model training processes
export const modelTrainingJobs = pgTable("model_training_jobs", {
  id: serial("id").primaryKey(),
  jobId: varchar("job_id", { length: 255 }).notNull().unique(),
  modelId: varchar("model_id", { length: 255 }).notNull(),
  modelType: varchar("model_type", { length: 100 }).notNull(),
  status: varchar("status", { length: 50 }).notNull(), // queued, running, completed, failed
  progress: integer("progress").default(0), // 0-100 percentage
  trainingConfig: jsonb("training_config").notNull(),
  datasetSize: integer("dataset_size"),
  epochs: integer("epochs"),
  currentEpoch: integer("current_epoch").default(0),
  loss: decimal("loss", { precision: 10, scale: 6 }),
  accuracy: decimal("accuracy", { precision: 5, scale: 4 }),
  validationLoss: decimal("validation_loss", { precision: 10, scale: 6 }),
  validationAccuracy: decimal("validation_accuracy", { precision: 5, scale: 4 }),
  trainingLogs: text("training_logs"),
  errorMessage: text("error_message"),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  estimatedCompletionTime: timestamp("estimated_completion_time"),
  resources: jsonb("resources"), // CPU, memory, GPU usage
  learningCycleId: varchar("learning_cycle_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Empire Brain Configuration - Central AI/ML system configuration
export const empireBrainConfig = pgTable("empire_brain_config", {
  id: serial("id").primaryKey(),
  configKey: varchar("config_key", { length: 255 }).notNull().unique(),
  configValue: jsonb("config_value").notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(), // learning, models, personalization, safety, llm
  isActive: boolean("is_active").default(true),
  version: varchar("version", { length: 50 }).default("1.0"),
  updatedBy: varchar("updated_by", { length: 255 }),
  lastApplied: timestamp("last_applied"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI/ML Audit Trail - Complete audit log for all AI/ML operations
export const aiMLAuditTrail = pgTable("ai_ml_audit_trail", {
  id: serial("id").primaryKey(),
  auditId: varchar("audit_id", { length: 255 }).notNull().unique(),
  action: varchar("action", { length: 100 }).notNull(), // model_deploy, rule_create, config_update, experiment_start
  entityType: varchar("entity_type", { length: 100 }).notNull(), // model, rule, config, experiment
  entityId: varchar("entity_id", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }),
  sessionId: varchar("session_id", { length: 255 }),
  oldValue: jsonb("old_value"),
  newValue: jsonb("new_value"),
  changeReason: text("change_reason"),
  impact: jsonb("impact"), // Expected or actual impact
  isAutomatic: boolean("is_automatic").default(false),
  learningCycleId: varchar("learning_cycle_id", { length: 255 }),
  metadata: jsonb("metadata"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Insert Schemas
export const insertAiMLModelSchema = createInsertSchema(aiMLModels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLearningCycleSchema = createInsertSchema(learningCycles).omit({
  id: true,
  createdAt: true,
});

export const insertPersonalizationRuleSchema = createInsertSchema(personalizationRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNeuronDataPipelineSchema = createInsertSchema(neuronDataPipelines).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiMLExperimentSchema = createInsertSchema(aiMLExperiments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContentOptimizationLogSchema = createInsertSchema(contentOptimizationLogs).omit({
  id: true,
  createdAt: true,
});

export const insertAiMLAnalyticsSchema = createInsertSchema(aiMLAnalytics).omit({
  id: true,
  createdAt: true,
});

export const insertModelTrainingJobSchema = createInsertSchema(modelTrainingJobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmpireBrainConfigSchema = createInsertSchema(empireBrainConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiMLAuditTrailSchema = createInsertSchema(aiMLAuditTrail).omit({
  id: true,
  timestamp: true,
});

// Types
export type InsertAiMLModel = z.infer<typeof insertAiMLModelSchema>;
export type AiMLModel = typeof aiMLModels.$inferSelect;

export type InsertLearningCycle = z.infer<typeof insertLearningCycleSchema>;
export type LearningCycle = typeof learningCycles.$inferSelect;

export type InsertPersonalizationRule = z.infer<typeof insertPersonalizationRuleSchema>;
export type PersonalizationRule = typeof personalizationRules.$inferSelect;

export type InsertNeuronDataPipeline = z.infer<typeof insertNeuronDataPipelineSchema>;
export type NeuronDataPipeline = typeof neuronDataPipelines.$inferSelect;

export type InsertAiMLExperiment = z.infer<typeof insertAiMLExperimentSchema>;
export type AiMLExperiment = typeof aiMLExperiments.$inferSelect;

export type InsertContentOptimizationLog = z.infer<typeof insertContentOptimizationLogSchema>;
export type ContentOptimizationLog = typeof contentOptimizationLogs.$inferSelect;

export type InsertAiMLAnalytics = z.infer<typeof insertAiMLAnalyticsSchema>;
export type AiMLAnalytics = typeof aiMLAnalytics.$inferSelect;

export type InsertModelTrainingJob = z.infer<typeof insertModelTrainingJobSchema>;
export type ModelTrainingJob = typeof modelTrainingJobs.$inferSelect;

export type InsertEmpireBrainConfig = z.infer<typeof insertEmpireBrainConfigSchema>;
export type EmpireBrainConfig = typeof empireBrainConfig.$inferSelect;

export type InsertAiMLAuditTrail = z.infer<typeof insertAiMLAuditTrailSchema>;
export type AiMLAuditTrail = typeof aiMLAuditTrail.$inferSelect;