import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, real, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ==========================================
// AI-NATIVE OPERATING SYSTEM TABLES
// ==========================================

// LLM Brain Router - Agent Registry
export const llmAgents = pgTable("llm_agents", {
  id: serial("id").primaryKey(),
  agentId: uuid("agent_id").defaultRandom().notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 100 }).notNull(), // 'openai', 'claude', 'ollama', 'localai', 'custom'
  model: varchar("model", { length: 255 }).notNull(), // 'gpt-4', 'claude-3', 'llama-2-70b', etc.
  apiEndpoint: text("api_endpoint").notNull(),
  apiKey: text("api_key"), // encrypted
  status: varchar("status", { length: 20 }).default("active").notNull(), // 'active', 'inactive', 'degraded', 'maintenance'
  capabilities: jsonb("capabilities").notNull(), // task specialties array
  costPerToken: real("cost_per_token").default(0).notNull(),
  rateLimit: integer("rate_limit").default(0).notNull(), // requests per minute
  maxTokens: integer("max_tokens").default(4096).notNull(),
  latencyMs: integer("latency_ms").default(0).notNull(), // average response time
  successRate: real("success_rate").default(1.0).notNull(), // 0.0 to 1.0
  quotaDaily: integer("quota_daily").default(0).notNull(), // 0 = unlimited
  quotaUsed: integer("quota_used").default(0).notNull(),
  lastUsed: timestamp("last_used"),
  config: jsonb("config").default({}).notNull(), // provider-specific config
  metadata: jsonb("metadata").default({}).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Task Router History & Learning
export const taskRoutingHistory = pgTable("task_routing_history", {
  id: serial("id").primaryKey(),
  taskId: uuid("task_id").defaultRandom().notNull().unique(),
  taskType: varchar("task_type", { length: 100 }).notNull(),
  taskComplexity: varchar("task_complexity", { length: 20 }).notNull(), // 'simple', 'medium', 'complex'
  originalAgentId: uuid("original_agent_id").notNull(),
  finalAgentId: uuid("final_agent_id").notNull(),
  fallbackCount: integer("fallback_count").default(0).notNull(),
  routingReason: text("routing_reason").notNull(),
  inputTokens: integer("input_tokens").default(0).notNull(),
  outputTokens: integer("output_tokens").default(0).notNull(),
  totalCost: real("total_cost").default(0).notNull(),
  latencyMs: integer("latency_ms").notNull(),
  success: boolean("success").notNull(),
  errorMessage: text("error_message"),
  qualityScore: real("quality_score"), // 0.0 to 1.0, human or auto feedback
  conversionImpact: real("conversion_impact"), // business impact metric
  contextSize: integer("context_size").default(0).notNull(),
  parallelRoutes: jsonb("parallel_routes").default([]).notNull(), // if split routing used
  executedAt: timestamp("executed_at").defaultNow().notNull(),
  metadata: jsonb("metadata").default({}).notNull()
});

// Agent Memory & Skills
export const agentMemories = pgTable("agent_memories", {
  id: serial("id").primaryKey(),
  memoryId: uuid("memory_id").defaultRandom().notNull().unique(),
  agentId: uuid("agent_id").notNull(),
  taskType: varchar("task_type", { length: 100 }).notNull(),
  prompt: text("prompt").notNull(),
  response: text("response").notNull(),
  context: jsonb("context").default({}).notNull(),
  embedding: jsonb("embedding"), // vector embedding for similarity search
  tags: jsonb("tags").default([]).notNull(),
  qualityScore: real("quality_score"), // feedback score
  usageCount: integer("usage_count").default(1).notNull(),
  lastUsed: timestamp("last_used").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"), // auto-cleanup old memories
  metadata: jsonb("metadata").default({}).notNull()
});

// Prompt Templates & Skills
export const promptTemplates = pgTable("prompt_templates", {
  id: serial("id").primaryKey(),
  templateId: uuid("template_id").defaultRandom().notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(),
  template: text("template").notNull(), // prompt template with variables
  variables: jsonb("variables").default({}).notNull(), // variable definitions
  supportedAgents: jsonb("supported_agents").default([]).notNull(), // compatible agent types
  averageTokens: integer("average_tokens").default(0).notNull(),
  successRate: real("success_rate").default(1.0).notNull(),
  usageCount: integer("usage_count").default(0).notNull(),
  lastUsed: timestamp("last_used"),
  createdBy: integer("created_by").notNull(),
  version: varchar("version", { length: 20 }).default("1.0").notNull(),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  metadata: jsonb("metadata").default({}).notNull()
});

// Agentic Workflows
export const agenticWorkflows = pgTable("agentic_workflows", {
  id: serial("id").primaryKey(),
  workflowId: uuid("workflow_id").defaultRandom().notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(),
  definition: jsonb("definition").notNull(), // workflow graph/steps
  status: varchar("status", { length: 20 }).default("draft").notNull(), // 'draft', 'active', 'paused', 'archived'
  trigger: jsonb("trigger").notNull(), // schedule, webhook, event, manual
  inputSchema: jsonb("input_schema").default({}).notNull(),
  outputSchema: jsonb("output_schema").default({}).notNull(),
  maxExecutionTime: integer("max_execution_time").default(300).notNull(), // seconds
  retryPolicy: jsonb("retry_policy").default({}).notNull(),
  costBudget: real("cost_budget").default(0).notNull(), // max cost per execution
  executionCount: integer("execution_count").default(0).notNull(),
  successCount: integer("success_count").default(0).notNull(),
  averageDuration: integer("average_duration").default(0).notNull(), // milliseconds
  averageCost: real("average_cost").default(0).notNull(),
  lastExecuted: timestamp("last_executed"),
  createdBy: integer("created_by").notNull(),
  version: varchar("version", { length: 20 }).default("1.0").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  metadata: jsonb("metadata").default({}).notNull()
});

// Workflow Executions
export const workflowExecutions = pgTable("workflow_executions", {
  id: serial("id").primaryKey(),
  executionId: uuid("execution_id").defaultRandom().notNull().unique(),
  workflowId: uuid("workflow_id").notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // 'pending', 'running', 'completed', 'failed', 'cancelled'
  progress: integer("progress").default(0).notNull(), // 0-100
  currentStep: varchar("current_step", { length: 255 }),
  input: jsonb("input").notNull(),
  output: jsonb("output"),
  steps: jsonb("steps").default([]).notNull(), // detailed step execution log
  errors: jsonb("errors").default([]).notNull(),
  totalCost: real("total_cost").default(0).notNull(),
  totalTokens: integer("total_tokens").default(0).notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  triggeredBy: varchar("triggered_by", { length: 100 }).notNull(), // 'user', 'schedule', 'webhook', 'event'
  userId: integer("user_id"),
  metadata: jsonb("metadata").default({}).notNull()
});

// Adaptive Router Learning
export const routerLearning = pgTable("router_learning", {
  id: serial("id").primaryKey(),
  learningId: uuid("learning_id").defaultRandom().notNull().unique(),
  taskType: varchar("task_type", { length: 100 }).notNull(),
  complexity: varchar("complexity", { length: 20 }).notNull(),
  contextPatterns: jsonb("context_patterns").notNull(), // features extracted from context
  bestAgentId: uuid("best_agent_id").notNull(),
  alternativeAgents: jsonb("alternative_agents").default([]).notNull(),
  successRate: real("success_rate").notNull(),
  averageCost: real("average_cost").notNull(),
  averageLatency: integer("average_latency").notNull(),
  confidence: real("confidence").default(0.0).notNull(), // learning confidence 0.0-1.0
  sampleSize: integer("sample_size").default(1).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  modelVersion: varchar("model_version", { length: 50 }).default("1.0").notNull(),
  trainingData: jsonb("training_data"), // features for model training
  metadata: jsonb("metadata").default({}).notNull()
});

// Cost & Usage Tracking
export const agentUsageTracking = pgTable("agent_usage_tracking", {
  id: serial("id").primaryKey(),
  trackingId: uuid("tracking_id").defaultRandom().notNull().unique(),
  agentId: uuid("agent_id").notNull(),
  userId: integer("user_id"),
  projectId: varchar("project_id", { length: 100 }),
  taskType: varchar("task_type", { length: 100 }).notNull(),
  inputTokens: integer("input_tokens").default(0).notNull(),
  outputTokens: integer("output_tokens").default(0).notNull(),
  totalCost: real("total_cost").default(0).notNull(),
  latencyMs: integer("latency_ms").notNull(),
  success: boolean("success").notNull(),
  executedAt: timestamp("executed_at").defaultNow().notNull(),
  metadata: jsonb("metadata").default({}).notNull()
});

// Federation Task Queue
export const federationTasks = pgTable("federation_tasks", {
  id: serial("id").primaryKey(),
  taskId: uuid("task_id").defaultRandom().notNull().unique(),
  sourceNeuron: varchar("source_neuron", { length: 100 }).notNull(),
  targetNeuron: varchar("target_neuron", { length: 100 }),
  taskType: varchar("task_type", { length: 100 }).notNull(),
  priority: varchar("priority", { length: 20 }).default("normal").notNull(), // 'low', 'normal', 'high', 'urgent'
  status: varchar("status", { length: 20 }).default("pending").notNull(), // 'pending', 'assigned', 'running', 'completed', 'failed'
  payload: jsonb("payload").notNull(),
  result: jsonb("result"),
  assignedAgent: uuid("assigned_agent"),
  maxRetries: integer("max_retries").default(3).notNull(),
  retryCount: integer("retry_count").default(0).notNull(),
  costBudget: real("cost_budget").default(0).notNull(),
  costUsed: real("cost_used").default(0).notNull(),
  scheduledAt: timestamp("scheduled_at"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  metadata: jsonb("metadata").default({}).notNull()
});

// Type definitions for better TypeScript support
export type LlmAgent = typeof llmAgents.$inferSelect;
export type NewLlmAgent = typeof llmAgents.$inferInsert;
export type TaskRoutingHistory = typeof taskRoutingHistory.$inferSelect;
export type NewTaskRoutingHistory = typeof taskRoutingHistory.$inferInsert;
export type AgentMemory = typeof agentMemories.$inferSelect;
export type NewAgentMemory = typeof agentMemories.$inferInsert;
export type PromptTemplate = typeof promptTemplates.$inferSelect;
export type NewPromptTemplate = typeof promptTemplates.$inferInsert;
export type AgenticWorkflow = typeof agenticWorkflows.$inferSelect;
export type NewAgenticWorkflow = typeof agenticWorkflows.$inferInsert;
export type WorkflowExecution = typeof workflowExecutions.$inferSelect;
export type NewWorkflowExecution = typeof workflowExecutions.$inferInsert;
export type RouterLearning = typeof routerLearning.$inferSelect;
export type NewRouterLearning = typeof routerLearning.$inferInsert;
export type AgentUsageTracking = typeof agentUsageTracking.$inferSelect;
export type NewAgentUsageTracking = typeof agentUsageTracking.$inferInsert;
export type FederationTask = typeof federationTasks.$inferSelect;
export type NewFederationTask = typeof federationTasks.$inferInsert;

// Schema validations
export const llmAgentSchema = createInsertSchema(llmAgents);
export const taskRoutingHistorySchema = createInsertSchema(taskRoutingHistory);  
export const agentMemorySchema = createInsertSchema(agentMemories);
export const promptTemplateSchema = createInsertSchema(promptTemplates);
export const agenticWorkflowSchema = createInsertSchema(agenticWorkflows);
export const workflowExecutionSchema = createInsertSchema(workflowExecutions);
export const routerLearningSchema = createInsertSchema(routerLearning);
export const agentUsageTrackingSchema = createInsertSchema(agentUsageTracking);
export const federationTaskSchema = createInsertSchema(federationTasks);