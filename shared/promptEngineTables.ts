import { pgTable, serial, uuid, varchar, text, jsonb, integer, real, timestamp, boolean, index, foreignKey } from "drizzle-orm/pg-core";
import { neurons } from "./schema";

// Core Prompt Templates - Foundation of the engine
export const promptTemplates = pgTable("prompt_templates", {
  id: serial("id").primaryKey(),
  templateId: uuid("template_id").defaultRandom().notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(), // page, blog, quiz, email, cta, seo, localization, etc.
  subcategory: varchar("subcategory", { length: 100 }), // specific type within category
  template: text("template").notNull(), // The actual prompt template with variables
  variables: jsonb("variables").default({}).notNull(), // Variable definitions and defaults
  metadata: jsonb("metadata").default({}).notNull(), // Additional config, constraints, etc.
  
  // LLM Configuration
  supportedModels: jsonb("supported_models").default(["gpt-4", "claude-3", "llama-2"]).notNull(),
  preferredModel: varchar("preferred_model", { length: 50 }).default("gpt-4"),
  maxTokens: integer("max_tokens").default(2000),
  temperature: real("temperature").default(0.7),
  
  // Quality & Performance Metrics
  averageTokens: integer("average_tokens").default(0),
  averageLatency: integer("average_latency").default(0), // milliseconds
  successRate: real("success_rate").default(1.0),
  qualityScore: real("quality_score").default(0.8), // AI-assessed quality
  conversionRate: real("conversion_rate").default(0.0), // business impact
  usageCount: integer("usage_count").default(0),
  
  // Version Control
  version: varchar("version", { length: 20 }).default("1.0.0").notNull(),
  parentTemplateId: uuid("parent_template_id"), // for versioning
  isLatest: boolean("is_latest").default(true),
  
  // Lifecycle Management
  status: varchar("status", { length: 20 }).default("active").notNull(), // active, deprecated, testing, archived
  approvalStatus: varchar("approval_status", { length: 20 }).default("approved").notNull(), // draft, pending, approved, rejected
  createdBy: integer("created_by").notNull(),
  reviewedBy: integer("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  lastUsed: timestamp("last_used"),
  
  // Federation & Security
  neuronId: varchar("neuron_id", { length: 255 }), // which neuron owns this template
  isGlobal: boolean("is_global").default(false), // available to all neurons
  permissions: jsonb("permissions").default({}).notNull(), // RBAC permissions
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => ({
  categoryIdx: index("prompt_templates_category_idx").on(table.category),
  statusIdx: index("prompt_templates_status_idx").on(table.status),
  neuronIdx: index("prompt_templates_neuron_idx").on(table.neuronId),
  usageIdx: index("prompt_templates_usage_idx").on(table.usageCount),
  qualityIdx: index("prompt_templates_quality_idx").on(table.qualityScore),
  versionIdx: index("prompt_templates_version_idx").on(table.version, table.isLatest),
  neuronFk: foreignKey({
    columns: [table.neuronId],
    foreignColumns: [neurons.neuronId],
    name: "prompt_templates_neuron_id_fk"
  })
}));

// Prompt Execution History - Track every generation
export const promptExecutions = pgTable("prompt_executions", {
  id: serial("id").primaryKey(),
  executionId: uuid("execution_id").defaultRandom().notNull().unique(),
  templateId: uuid("template_id").notNull(),
  
  // Input & Output
  inputVariables: jsonb("input_variables").default({}).notNull(),
  finalPrompt: text("final_prompt").notNull(), // template after variable substitution
  generatedContent: text("generated_content"),
  
  // Execution Details
  modelUsed: varchar("model_used", { length: 50 }),
  tokensUsed: integer("tokens_used").default(0),
  latency: integer("latency").default(0), // milliseconds
  cost: real("cost").default(0.0), // USD
  
  // Quality Assessment
  qualityScore: real("quality_score"), // AI-assessed quality (0-1)
  humanRating: integer("human_rating"), // 1-5 stars
  humanFeedback: text("human_feedback"),
  
  // Business Impact
  viewCount: integer("view_count").default(0),
  clickCount: integer("click_count").default(0),
  conversionCount: integer("conversion_count").default(0),
  revenue: real("revenue").default(0.0),
  
  // Context & Attribution
  userId: integer("user_id"),
  sessionId: varchar("session_id", { length: 255 }),
  neuronId: varchar("neuron_id", { length: 255 }),
  requestSource: varchar("request_source", { length: 100 }), // api, dashboard, batch, automation
  
  // Status & Error Handling
  status: varchar("status", { length: 20 }).default("success").notNull(), // success, failed, timeout, cancelled
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0),
  
  executedAt: timestamp("executed_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  templateIdx: index("prompt_executions_template_idx").on(table.templateId),
  statusIdx: index("prompt_executions_status_idx").on(table.status),
  neuronIdx: index("prompt_executions_neuron_idx").on(table.neuronId),
  dateIdx: index("prompt_executions_date_idx").on(table.executedAt),
  qualityIdx: index("prompt_executions_quality_idx").on(table.qualityScore),
  templateFk: foreignKey({
    columns: [table.templateId],
    foreignColumns: [promptTemplates.templateId],
    name: "prompt_executions_template_id_fk"
  }),
  neuronFk: foreignKey({
    columns: [table.neuronId],
    foreignColumns: [neurons.neuronId],
    name: "prompt_executions_neuron_id_fk"
  })
}));

// Prompt Graph Workflows - Chain multiple prompts together
export const promptGraphs = pgTable("prompt_graphs", {
  id: serial("id").primaryKey(),
  graphId: uuid("graph_id").defaultRandom().notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(), // content_generation, analysis, optimization, etc.
  
  // Graph Definition
  nodes: jsonb("nodes").default([]).notNull(), // Array of PromptNode objects
  connections: jsonb("connections").default([]).notNull(), // Array of PromptConnection objects
  configuration: jsonb("configuration").default({}).notNull(), // Global graph settings
  
  // Execution Settings
  maxExecutionTime: integer("max_execution_time").default(300000), // 5 minutes
  parallelExecution: boolean("parallel_execution").default(false),
  errorHandling: varchar("error_handling", { length: 20 }).default("stop"), // stop, continue, retry
  
  // Performance Metrics
  averageExecutionTime: integer("average_execution_time").default(0),
  successRate: real("success_rate").default(1.0),
  executionCount: integer("execution_count").default(0),
  
  // Version Control
  version: varchar("version", { length: 20 }).default("1.0.0").notNull(),
  parentGraphId: uuid("parent_graph_id"),
  isLatest: boolean("is_latest").default(true),
  
  // Lifecycle Management
  status: varchar("status", { length: 20 }).default("active").notNull(),
  createdBy: integer("created_by").notNull(),
  neuronId: varchar("neuron_id", { length: 255 }),
  isGlobal: boolean("is_global").default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => ({
  categoryIdx: index("prompt_graphs_category_idx").on(table.category),
  statusIdx: index("prompt_graphs_status_idx").on(table.status),
  neuronIdx: index("prompt_graphs_neuron_idx").on(table.neuronId),
  parentFk: foreignKey({
    columns: [table.parentGraphId],
    foreignColumns: [table.graphId],
    name: "prompt_graphs_parent_id_fk"
  }),
  neuronFk: foreignKey({
    columns: [table.neuronId],
    foreignColumns: [neurons.neuronId],
    name: "prompt_graphs_neuron_id_fk"
  })
}));

// Prompt Graph Executions - Track workflow runs
export const promptGraphExecutions = pgTable("prompt_graph_executions", {
  id: serial("id").primaryKey(),
  executionId: uuid("execution_id").defaultRandom().notNull().unique(),
  graphId: uuid("graph_id").notNull(),
  
  // Execution Context
  inputData: jsonb("input_data").default({}).notNull(),
  outputData: jsonb("output_data").default({}).notNull(),
  intermediateResults: jsonb("intermediate_results").default({}).notNull(),
  
  // Execution Details
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  duration: integer("duration"), // milliseconds
  
  // Performance Metrics
  totalTokensUsed: integer("total_tokens_used").default(0),
  totalCost: real("total_cost").default(0.0),
  nodeExecutions: integer("node_executions").default(0),
  
  // Status & Error Handling
  status: varchar("status", { length: 20 }).default("running").notNull(), // running, completed, failed, cancelled
  errorMessage: text("error_message"),
  failedNodeId: varchar("failed_node_id", { length: 255 }),
  
  // Context
  userId: integer("user_id"),
  sessionId: varchar("session_id", { length: 255 }),
  neuronId: varchar("neuron_id", { length: 255 }),
  triggerSource: varchar("trigger_source", { length: 100 }), // manual, api, scheduled, event
  
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  graphIdx: index("prompt_graph_executions_graph_idx").on(table.graphId),
  statusIdx: index("prompt_graph_executions_status_idx").on(table.status),
  dateIdx: index("prompt_graph_executions_date_idx").on(table.startedAt),
  neuronIdx: index("prompt_graph_executions_neuron_idx").on(table.neuronId),
  graphFk: foreignKey({
    columns: [table.graphId],
    foreignColumns: [promptGraphs.graphId],
    name: "prompt_graph_executions_graph_id_fk"
  }),
  neuronFk: foreignKey({
    columns: [table.neuronId],
    foreignColumns: [neurons.neuronId],
    name: "prompt_graph_executions_neuron_id_fk"
  })
}));

// Prompt Optimization Records - AI-driven improvements
export const promptOptimizations = pgTable("prompt_optimizations", {
  id: serial("id").primaryKey(),
  optimizationId: uuid("optimization_id").defaultRandom().notNull().unique(),
  templateId: uuid("template_id").notNull(),
  
  // Optimization Details
  optimizationType: varchar("optimization_type", { length: 50 }).notNull(), // performance, quality, cost, conversion
  originalTemplate: text("original_template").notNull(),
  optimizedTemplate: text("optimized_template").notNull(),
  changes: jsonb("changes").default([]).notNull(), // detailed change log
  
  // Performance Comparison
  originalMetrics: jsonb("original_metrics").default({}).notNull(), // before optimization
  optimizedMetrics: jsonb("optimized_metrics").default({}).notNull(), // after optimization
  improvementScore: real("improvement_score").default(0.0), // percentage improvement
  
  // A/B Testing Results
  testExecutions: integer("test_executions").default(0),
  winnerDetermined: boolean("winner_determined").default(false),
  confidenceLevel: real("confidence_level").default(0.0),
  
  // AI Analysis
  aiRecommendations: jsonb("ai_recommendations").default([]).notNull(),
  optimizationReasoning: text("optimization_reasoning"),
  riskAssessment: varchar("risk_assessment", { length: 20 }).default("low"), // low, medium, high
  
  // Lifecycle
  status: varchar("status", { length: 20 }).default("testing").notNull(), // testing, approved, rejected, deployed
  createdBy: varchar("created_by", { length: 20 }).default("ai_optimizer"),
  reviewedBy: integer("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  deployedAt: timestamp("deployed_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => ({
  templateIdx: index("prompt_optimizations_template_idx").on(table.templateId),
  typeIdx: index("prompt_optimizations_type_idx").on(table.optimizationType),
  statusIdx: index("prompt_optimizations_status_idx").on(table.status),
  scoreIdx: index("prompt_optimizations_score_idx").on(table.improvementScore),
  templateFk: foreignKey({
    columns: [table.templateId],
    foreignColumns: [promptTemplates.templateId],
    name: "prompt_optimizations_template_id_fk"
  })
}));

// Prompt Analytics - Business intelligence for prompt performance
export const promptAnalytics = pgTable("prompt_analytics", {
  id: serial("id").primaryKey(),
  analyticsId: uuid("analytics_id").defaultRandom().notNull().unique(),
  
  // Aggregation Scope
  aggregationType: varchar("aggregation_type", { length: 20 }).notNull(), // template, category, neuron, global
  aggregationId: varchar("aggregation_id", { length: 255 }).notNull(), // ID of the aggregated entity
  timeframe: varchar("timeframe", { length: 20 }).notNull(), // hourly, daily, weekly, monthly
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  
  // Usage Metrics
  executionCount: integer("execution_count").default(0),
  uniqueUsers: integer("unique_users").default(0),
  totalTokensUsed: integer("total_tokens_used").default(0),
  totalCost: real("total_cost").default(0.0),
  
  // Performance Metrics
  averageLatency: integer("average_latency").default(0),
  averageQualityScore: real("average_quality_score").default(0.0),
  successRate: real("success_rate").default(1.0),
  errorRate: real("error_rate").default(0.0),
  
  // Business Metrics
  totalViews: integer("total_views").default(0),
  totalClicks: integer("total_clicks").default(0),
  totalConversions: integer("total_conversions").default(0),
  totalRevenue: real("total_revenue").default(0.0),
  conversionRate: real("conversion_rate").default(0.0),
  revenuePerExecution: real("revenue_per_execution").default(0.0),
  
  // Trends & Insights
  trendDirection: varchar("trend_direction", { length: 10 }), // up, down, stable
  trendMagnitude: real("trend_magnitude").default(0.0), // percentage change
  insights: jsonb("insights").default([]).notNull(), // AI-generated insights
  recommendations: jsonb("recommendations").default([]).notNull(), // optimization suggestions
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => ({
  aggregationIdx: index("prompt_analytics_aggregation_idx").on(table.aggregationType, table.aggregationId),
  timeframeIdx: index("prompt_analytics_timeframe_idx").on(table.timeframe, table.periodStart),
  performanceIdx: index("prompt_analytics_performance_idx").on(table.successRate, table.averageQualityScore),
  businessIdx: index("prompt_analytics_business_idx").on(table.conversionRate, table.totalRevenue)
}));

// Prompt Queue - For batch processing and scheduling
export const promptQueue = pgTable("prompt_queue", {
  id: serial("id").primaryKey(),
  queueId: uuid("queue_id").defaultRandom().notNull().unique(),
  
  // Queue Item Details
  templateId: uuid("template_id"),
  graphId: uuid("graph_id"),
  priority: integer("priority").default(5), // 1-10, higher = more urgent
  batchId: uuid("batch_id"), // group related items
  
  // Execution Data
  inputData: jsonb("input_data").default({}).notNull(),
  configuration: jsonb("configuration").default({}).notNull(),
  
  // Scheduling
  scheduleType: varchar("schedule_type", { length: 20 }).default("immediate"), // immediate, scheduled, recurring
  scheduledFor: timestamp("scheduled_for"),
  recurringPattern: varchar("recurring_pattern", { length: 100 }), // cron-like pattern
  maxRetries: integer("max_retries").default(3),
  retryCount: integer("retry_count").default(0),
  
  // Status & Results
  status: varchar("status", { length: 20 }).default("pending"), // pending, processing, completed, failed, cancelled
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  result: jsonb("result").default({}).notNull(),
  errorMessage: text("error_message"),
  
  // Context
  userId: integer("user_id"),
  neuronId: varchar("neuron_id", { length: 255 }),
  requestSource: varchar("request_source", { length: 100 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => ({
  statusIdx: index("prompt_queue_status_idx").on(table.status),
  priorityIdx: index("prompt_queue_priority_idx").on(table.priority, table.scheduledFor),
  batchIdx: index("prompt_queue_batch_idx").on(table.batchId),
  scheduleIdx: index("prompt_queue_schedule_idx").on(table.scheduleType, table.scheduledFor),
  neuronIdx: index("prompt_queue_neuron_idx").on(table.neuronId),
  templateFk: foreignKey({
    columns: [table.templateId],
    foreignColumns: [promptTemplates.templateId],
    name: "prompt_queue_template_id_fk"
  }),
  graphFk: foreignKey({
    columns: [table.graphId],
    foreignColumns: [promptGraphs.graphId],
    name: "prompt_queue_graph_id_fk"
  }),
  neuronFk: foreignKey({
    columns: [table.neuronId],
    foreignColumns: [neurons.neuronId],
    name: "prompt_queue_neuron_id_fk"
  })
}));

// Export all tables and types
export type PromptTemplate = typeof promptTemplates.$inferSelect;
export type NewPromptTemplate = typeof promptTemplates.$inferInsert;
export type PromptExecution = typeof promptExecutions.$inferSelect;
export type NewPromptExecution = typeof promptExecutions.$inferInsert;
export type PromptGraph = typeof promptGraphs.$inferSelect;
export type NewPromptGraph = typeof promptGraphs.$inferInsert;
export type PromptGraphExecution = typeof promptGraphExecutions.$inferSelect;
export type NewPromptGraphExecution = typeof promptGraphExecutions.$inferInsert;
export type PromptOptimization = typeof promptOptimizations.$inferSelect;
export type NewPromptOptimization = typeof promptOptimizations.$inferInsert;
export type PromptAnalytics = typeof promptAnalytics.$inferSelect;
export type NewPromptAnalytics = typeof promptAnalytics.$inferInsert;
export type PromptQueueItem = typeof promptQueue.$inferSelect;
export type NewPromptQueueItem = typeof promptQueue.$inferInsert;