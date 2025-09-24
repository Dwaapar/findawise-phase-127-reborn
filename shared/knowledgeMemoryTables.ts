import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, real, uuid, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ==========================================
// KNOWLEDGE MEMORY GRAPH TABLES
// ==========================================

// Memory Nodes - Core knowledge entities
export const memoryNodes = pgTable("memory_nodes", {
  id: serial("id").primaryKey(),
  nodeId: uuid("node_id").defaultRandom().notNull().unique(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  summary: text("summary"),
  nodeType: varchar("node_type", { length: 100 }).notNull(), // 'blog_post', 'quiz', 'product', 'offer', 'insight', 'experiment', 'user_journey', 'seo_data'
  status: varchar("status", { length: 20 }).default("active").notNull(), // 'active', 'archived', 'pending_approval', 'deprecated'
  
  // Vector and AI data
  embedding: jsonb("embedding"), // vector embedding for similarity search
  embeddingModel: varchar("embedding_model", { length: 100 }).default("text-embedding-ada-002"),
  keywords: jsonb("keywords").default([]).notNull(), // extracted keywords
  entities: jsonb("entities").default([]).notNull(), // NER entities
  
  // User and conversion data
  userArchetype: varchar("user_archetype", { length: 100 }),
  conversionData: jsonb("conversion_data").default({}).notNull(), // clicks, conversions, bounce rates
  usageCount: integer("usage_count").default(0).notNull(),
  lastUsed: timestamp("last_used"),
  
  // Quality and confidence metrics
  qualityScore: real("quality_score").default(0.5).notNull(), // 0.0 to 1.0
  confidenceScore: real("confidence_score").default(0.5).notNull(),
  verificationStatus: varchar("verification_status", { length: 20 }).default("unverified"), // 'verified', 'unverified', 'disputed'
  
  // Metadata and lineage
  sourceType: varchar("source_type", { length: 100 }).notNull(), // 'manual', 'import', 'ai_generated', 'federation_sync'
  sourceId: varchar("source_id", { length: 255 }), // original ID from source system
  parentNodeId: uuid("parent_node_id"), // for versioning/derivation
  version: varchar("version", { length: 20 }).default("1.0").notNull(),
  
  // Temporal data
  contentTimestamp: timestamp("content_timestamp"), // when the actual content was created
  expiresAt: timestamp("expires_at"), // auto-archive date
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by").notNull(),
  
  // Additional metadata
  metadata: jsonb("metadata").default({}).notNull(),
  tags: jsonb("tags").default([]).notNull()
}, (table) => ({
  slugIdx: index("memory_nodes_slug_idx").on(table.slug),
  nodeTypeIdx: index("memory_nodes_type_idx").on(table.nodeType),
  embeddingIdx: index("memory_nodes_embedding_idx").on(table.embedding),
  usageCountIdx: index("memory_nodes_usage_idx").on(table.usageCount),
  qualityScoreIdx: index("memory_nodes_quality_idx").on(table.qualityScore)
}));

// Memory Edges - Relationships between nodes
export const memoryEdges = pgTable("memory_edges", {
  id: serial("id").primaryKey(),
  edgeId: uuid("edge_id").defaultRandom().notNull().unique(),
  sourceNodeId: uuid("source_node_id").notNull(),
  targetNodeId: uuid("target_node_id").notNull(),
  
  // Relationship data
  relationshipType: varchar("relationship_type", { length: 100 }).notNull(), // 'related_to', 'used_in', 'causes', 'contradicts', 'improves', 'leads_to', 'flagged_by', 'supersedes'
  strength: real("strength").default(0.5).notNull(), // 0.0 to 1.0
  direction: varchar("direction", { length: 20 }).default("bidirectional").notNull(), // 'unidirectional', 'bidirectional'
  
  // Context and evidence
  context: text("context"), // why this relationship exists
  evidence: jsonb("evidence").default([]).notNull(), // supporting data
  confidence: real("confidence").default(0.5).notNull(),
  
  // Metadata
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastVerified: timestamp("last_verified"),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  metadata: jsonb("metadata").default({}).notNull()
}, (table) => ({
  sourceNodeIdx: index("memory_edges_source_idx").on(table.sourceNodeId),
  targetNodeIdx: index("memory_edges_target_idx").on(table.targetNodeId),
  relationshipIdx: index("memory_edges_relationship_idx").on(table.relationshipType),
  strengthIdx: index("memory_edges_strength_idx").on(table.strength)
}));

// Prompt Optimizations - Track prompt rewrites and injections
export const promptOptimizations = pgTable("prompt_optimizations", {
  id: serial("id").primaryKey(),
  optimizationId: uuid("optimization_id").defaultRandom().notNull().unique(),
  
  // Prompt data
  originalPrompt: text("original_prompt").notNull(),
  optimizedPrompt: text("optimized_prompt").notNull(),
  injectedNodes: jsonb("injected_nodes").default([]).notNull(), // array of node IDs used
  injectionStrategy: varchar("injection_strategy", { length: 100 }).notNull(), // 'rag_retrieval', 'context_aware', 'user_personalized'
  
  // Context
  taskType: varchar("task_type", { length: 100 }).notNull(),
  userContext: jsonb("user_context").default({}).notNull(),
  sessionId: varchar("session_id", { length: 255 }),
  
  // Performance metrics
  retrievalScore: real("retrieval_score"), // quality of retrieved memory
  promptQuality: real("prompt_quality"), // quality of final prompt
  executionTime: integer("execution_time").notNull(), // milliseconds
  tokensAdded: integer("tokens_added").default(0).notNull(),
  
  // Results and feedback
  outputGenerated: text("output_generated"),
  userSatisfaction: real("user_satisfaction"), // feedback score
  conversionResult: boolean("conversion_result"), // did it lead to conversion?
  
  // Metadata
  agentId: uuid("agent_id"), // which agent was used
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  metadata: jsonb("metadata").default({}).notNull()
}, (table) => ({
  taskTypeIdx: index("prompt_opts_task_type_idx").on(table.taskType),
  timestampIdx: index("prompt_opts_timestamp_idx").on(table.timestamp),
  qualityIdx: index("prompt_opts_quality_idx").on(table.promptQuality)
}));

// Memory Search Sessions - Track search patterns and effectiveness
export const memorySearchSessions = pgTable("memory_search_sessions", {
  id: serial("id").primaryKey(),
  sessionId: uuid("session_id").defaultRandom().notNull().unique(),
  
  // Search data
  query: text("query").notNull(),
  searchType: varchar("search_type", { length: 50 }).notNull(), // 'semantic', 'keyword', 'hybrid', 'graph_traversal'
  filters: jsonb("filters").default({}).notNull(),
  
  // Results
  resultsReturned: integer("results_returned").notNull(),
  topResultIds: jsonb("top_result_ids").default([]).notNull(),
  searchTime: integer("search_time").notNull(), // milliseconds
  
  // User interaction
  userId: integer("user_id"),
  userArchetype: varchar("user_archetype", { length: 100 }),
  clickedResults: jsonb("clicked_results").default([]).notNull(),
  satisfactionScore: real("satisfaction_score"),
  
  // Context
  contextType: varchar("context_type", { length: 100 }), // 'prompt_optimization', 'user_query', 'content_generation'
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  metadata: jsonb("metadata").default({}).notNull()
}, (table) => ({
  queryIdx: index("memory_search_query_idx").on(table.query),
  timestampIdx: index("memory_search_timestamp_idx").on(table.timestamp),
  userIdx: index("memory_search_user_idx").on(table.userId)
}));

// Knowledge Graph Versions - Track changes and enable rollbacks
export const knowledgeGraphVersions = pgTable("knowledge_graph_versions", {
  id: serial("id").primaryKey(),
  versionId: uuid("version_id").defaultRandom().notNull().unique(),
  
  // Version data
  nodeId: uuid("node_id").notNull(),
  changeType: varchar("change_type", { length: 50 }).notNull(), // 'create', 'update', 'delete', 'merge'
  previousData: jsonb("previous_data"),
  newData: jsonb("new_data").notNull(),
  diff: jsonb("diff").notNull(), // detailed change diff
  
  // Change context
  changeReason: text("change_reason"),
  changeSource: varchar("change_source", { length: 100 }).notNull(), // 'manual', 'ai_optimization', 'federation_sync', 'auto_aging'
  approvalStatus: varchar("approval_status", { length: 20 }).default("pending"), // 'pending', 'approved', 'rejected'
  
  // Actor data
  changedBy: integer("changed_by").notNull(),
  approvedBy: integer("approved_by"),
  
  // Temporal data
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  approvedAt: timestamp("approved_at"),
  effectiveAt: timestamp("effective_at").defaultNow().notNull(),
  
  metadata: jsonb("metadata").default({}).notNull()
}, (table) => ({
  nodeIdIdx: index("kg_versions_node_idx").on(table.nodeId),
  timestampIdx: index("kg_versions_timestamp_idx").on(table.timestamp),
  approvalIdx: index("kg_versions_approval_idx").on(table.approvalStatus)
}));

// Memory Usage Analytics - Track how memory is being used
export const memoryUsageAnalytics = pgTable("memory_usage_analytics", {
  id: serial("id").primaryKey(),
  analyticsId: uuid("analytics_id").defaultRandom().notNull().unique(),
  
  // Usage context
  nodeId: uuid("node_id").notNull(),
  usageType: varchar("usage_type", { length: 100 }).notNull(), // 'prompt_injection', 'search_result', 'related_content', 'auto_suggestion'
  contextId: varchar("context_id", { length: 255 }), // reference to prompt, session, etc.
  
  // Performance data
  retrievalTime: integer("retrieval_time"), // milliseconds
  relevanceScore: real("relevance_score"), // 0.0 to 1.0
  userEngagement: jsonb("user_engagement").default({}).notNull(), // clicks, time spent, etc.
  
  // Impact metrics
  conversionImpact: real("conversion_impact"), // measured impact on conversions
  qualityFeedback: real("quality_feedback"), // user or system feedback
  
  // Context
  userId: integer("user_id"),
  sessionId: varchar("session_id", { length: 255 }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  metadata: jsonb("metadata").default({}).notNull()
}, (table) => ({
  nodeIdIdx: index("memory_usage_node_idx").on(table.nodeId),
  timestampIdx: index("memory_usage_timestamp_idx").on(table.timestamp),
  relevanceIdx: index("memory_usage_relevance_idx").on(table.relevanceScore)
}));

// Federation Memory Sync - Track cross-neuron memory sharing
export const federationMemorySync = pgTable("federation_memory_sync", {
  id: serial("id").primaryKey(),
  syncId: uuid("sync_id").defaultRandom().notNull().unique(),
  
  // Sync details
  sourceNeuron: varchar("source_neuron", { length: 100 }).notNull(),
  targetNeuron: varchar("target_neuron", { length: 100 }).notNull(),
  syncType: varchar("sync_type", { length: 50 }).notNull(), // 'push', 'pull', 'bidirectional'
  
  // Data sync
  nodesSynced: jsonb("nodes_synced").default([]).notNull(),
  edgesSynced: jsonb("edges_synced").default([]).notNull(),
  syncStatus: varchar("sync_status", { length: 20 }).default("pending").notNull(), // 'pending', 'in_progress', 'completed', 'failed'
  
  // Results
  successCount: integer("success_count").default(0).notNull(),
  failureCount: integer("failure_count").default(0).notNull(),
  errors: jsonb("errors").default([]).notNull(),
  
  // Performance
  startTime: timestamp("start_time").defaultNow().notNull(),
  endTime: timestamp("end_time"),
  totalTime: integer("total_time"), // milliseconds
  
  // Metadata
  triggeredBy: varchar("triggered_by", { length: 100 }).notNull(), // 'schedule', 'manual', 'event'
  metadata: jsonb("metadata").default({}).notNull()
}, (table) => ({
  sourceNeuronIdx: index("fed_sync_source_idx").on(table.sourceNeuron),
  targetNeuronIdx: index("fed_sync_target_idx").on(table.targetNeuron),
  statusIdx: index("fed_sync_status_idx").on(table.syncStatus),
  timestampIdx: index("fed_sync_timestamp_idx").on(table.startTime)
}));

// Type definitions for TypeScript support
export type MemoryNode = typeof memoryNodes.$inferSelect;
export type NewMemoryNode = typeof memoryNodes.$inferInsert;
export type MemoryEdge = typeof memoryEdges.$inferSelect;
export type NewMemoryEdge = typeof memoryEdges.$inferInsert;
export type PromptOptimization = typeof promptOptimizations.$inferSelect;
export type NewPromptOptimization = typeof promptOptimizations.$inferInsert;
export type MemorySearchSession = typeof memorySearchSessions.$inferSelect;
export type NewMemorySearchSession = typeof memorySearchSessions.$inferInsert;
export type KnowledgeGraphVersion = typeof knowledgeGraphVersions.$inferSelect;
export type NewKnowledgeGraphVersion = typeof knowledgeGraphVersions.$inferInsert;
export type MemoryUsageAnalytics = typeof memoryUsageAnalytics.$inferSelect;
export type NewMemoryUsageAnalytics = typeof memoryUsageAnalytics.$inferInsert;
export type FederationMemorySync = typeof federationMemorySync.$inferSelect;
export type NewFederationMemorySync = typeof federationMemorySync.$inferInsert;

// Schema validations
export const memoryNodeSchema = createInsertSchema(memoryNodes);
export const memoryEdgeSchema = createInsertSchema(memoryEdges);
export const promptOptimizationSchema = createInsertSchema(promptOptimizations);
export const memorySearchSessionSchema = createInsertSchema(memorySearchSessions);
export const knowledgeGraphVersionSchema = createInsertSchema(knowledgeGraphVersions);
export const memoryUsageAnalyticsSchema = createInsertSchema(memoryUsageAnalytics);
export const federationMemorySyncSchema = createInsertSchema(federationMemorySync);