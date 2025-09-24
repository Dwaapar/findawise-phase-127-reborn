import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, real, uniqueIndex, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * Vector Search + Embeddings Engine Database Schema
 * Billion-Dollar Empire Grade - Migration-Proof Architecture
 */

// Vector Embedding Models Registry
export const vectorEmbeddingModels = pgTable("vector_embedding_models", {
  id: serial("id").primaryKey(),
  modelName: varchar("model_name", { length: 100 }).notNull().unique(),
  provider: varchar("provider", { length: 50 }).notNull(), // 'huggingface', 'openai', 'local', 'sentence-transformers'
  dimensions: integer("dimensions").notNull(),
  maxInputLength: integer("max_input_length").notNull(),
  isActive: boolean("is_active").default(true),
  isDefault: boolean("is_default").default(false),
  configuration: jsonb("configuration"), // Model-specific config
  performance: jsonb("performance"), // Benchmarks, accuracy, speed metrics
  supportedLanguages: jsonb("supported_languages"), // Array of language codes
  apiEndpoint: text("api_endpoint"), // External API endpoint if applicable
  apiKeyRequired: boolean("api_key_required").default(false),
  costPerToken: real("cost_per_token").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Vector Database Adapters
export const vectorDatabaseAdapters = pgTable("vector_database_adapters", {
  id: serial("id").primaryKey(),
  adapterName: varchar("adapter_name", { length: 100 }).notNull().unique(),
  databaseType: varchar("database_type", { length: 50 }).notNull(), // 'postgres', 'supabase', 'chromadb', 'qdrant', 'pinecone', 'weaviate', 'faiss'
  connectionString: text("connection_string"), // Encrypted connection details
  isActive: boolean("is_active").default(true),
  isPrimary: boolean("is_primary").default(false),
  priority: integer("priority").default(1), // For fallback ordering
  configuration: jsonb("configuration"), // Database-specific settings
  healthStatus: varchar("health_status", { length: 20 }).default("unknown"), // 'healthy', 'degraded', 'down', 'unknown'
  lastHealthCheck: timestamp("last_health_check"),
  performance: jsonb("performance"), // Query speed, index size, etc.
  capacity: jsonb("capacity"), // Storage limits, query limits
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enhanced Vector Embeddings Storage
export const vectorEmbeddings = pgTable("vector_embeddings", {
  id: serial("id").primaryKey(),
  contentId: varchar("content_id", { length: 255 }).notNull(), // Universal content identifier
  contentType: varchar("content_type", { length: 50 }).notNull(), // 'page', 'offer', 'quiz', 'article', 'cta', 'user_profile', 'session'
  contentHash: varchar("content_hash", { length: 64 }), // SHA-256 hash for change detection
  embedding: jsonb("embedding").notNull(), // Vector as JSON array
  modelId: integer("model_id").notNull().references(() => vectorEmbeddingModels.id),
  dimensions: integer("dimensions").notNull(),
  metadata: jsonb("metadata"), // Content-specific metadata
  textContent: text("text_content"), // Original text for re-indexing
  semanticKeywords: jsonb("semantic_keywords"), // Extracted keywords
  language: varchar("language", { length: 10 }).default("en"),
  qualityScore: real("quality_score").default(0.5), // Embedding quality (0-1)
  isStale: boolean("is_stale").default(false), // Needs re-indexing
  version: integer("version").default(1), // For versioning
  neuronId: varchar("neuron_id", { length: 100 }),
  verticalId: varchar("vertical_id", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  contentIdIndex: index("content_id_idx").on(table.contentId),
  contentTypeIndex: index("content_type_idx").on(table.contentType),
  modelIdIndex: index("model_id_idx").on(table.modelId),
  neuronIdIndex: index("neuron_id_idx").on(table.neuronId),
  hashIndex: index("content_hash_idx").on(table.contentHash),
  uniqueContentModel: uniqueIndex("unique_content_model_idx").on(table.contentId, table.modelId),
}));

// Vector Search Queries Log
export const vectorSearchQueries = pgTable("vector_search_queries", {
  id: serial("id").primaryKey(),
  queryText: text("query_text").notNull(),
  queryVector: jsonb("query_vector"),
  userId: varchar("user_id", { length: 255 }),
  sessionId: varchar("session_id", { length: 255 }),
  fingerprint: varchar("fingerprint", { length: 500 }),
  searchType: varchar("search_type", { length: 50 }).notNull(), // 'semantic', 'similarity', 'recommendation'
  filters: jsonb("filters"), // Applied filters
  modelId: integer("model_id").references(() => vectorEmbeddingModels.id),
  topK: integer("top_k").default(10),
  threshold: real("threshold").default(0.3),
  resultCount: integer("result_count").default(0),
  resultIds: jsonb("result_ids"), // Array of result content IDs
  responseTimeMs: integer("response_time_ms"),
  algorithm: varchar("algorithm", { length: 20 }).default("cosine"), // 'cosine', 'euclidean', 'dot'
  qualityScore: real("quality_score"), // User feedback on results
  clickThroughRate: real("click_through_rate").default(0),
  conversionRate: real("conversion_rate").default(0),
  neuronId: varchar("neuron_id", { length: 100 }),
  verticalId: varchar("vertical_id", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIndex: index("user_id_idx").on(table.userId),
  sessionIdIndex: index("session_id_idx").on(table.sessionId),
  searchTypeIndex: index("search_type_idx").on(table.searchType),
  modelIdIndex: index("query_model_id_idx").on(table.modelId),
  createdAtIndex: index("query_created_at_idx").on(table.createdAt),
}));

// Vector Similarity Cache
export const vectorSimilarityCache = pgTable("vector_similarity_cache", {
  id: serial("id").primaryKey(),
  sourceContentId: varchar("source_content_id", { length: 255 }).notNull(),
  targetContentId: varchar("target_content_id", { length: 255 }).notNull(),
  similarity: real("similarity").notNull(),
  algorithm: varchar("algorithm", { length: 20 }).default("cosine"),
  modelId: integer("model_id").notNull().references(() => vectorEmbeddingModels.id),
  isValid: boolean("is_valid").default(true),
  rank: integer("rank"), // Rank among similar items
  lastCalculated: timestamp("last_calculated").defaultNow(),
  expiresAt: timestamp("expires_at"), // Cache expiration
  metadata: jsonb("metadata"), // Additional similarity context
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  sourceIdIndex: index("source_content_id_idx").on(table.sourceContentId),
  targetIdIndex: index("target_content_id_idx").on(table.targetContentId),
  similarityIndex: index("similarity_idx").on(table.similarity),
  modelIdIndex: index("cache_model_id_idx").on(table.modelId),
  uniqueSimilarity: uniqueIndex("unique_similarity_cache_idx").on(table.sourceContentId, table.targetContentId, table.modelId),
}));

// Vector Recommendations Engine
export const vectorRecommendations = pgTable("vector_recommendations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }),
  sessionId: varchar("session_id", { length: 255 }),
  fingerprint: varchar("fingerprint", { length: 500 }),
  recommendationType: varchar("recommendation_type", { length: 50 }).notNull(), // 'content', 'product', 'offer', 'quiz', 'next_step'
  sourceContentId: varchar("source_content_id", { length: 255 }), // What triggered this recommendation
  recommendedContentId: varchar("recommended_content_id", { length: 255 }).notNull(),
  score: real("score").notNull(), // Recommendation confidence (0-1)
  algorithm: varchar("algorithm", { length: 50 }).default("hybrid"), // 'collaborative', 'content_based', 'hybrid', 'deep_learning'
  modelId: integer("model_id").references(() => vectorEmbeddingModels.id),
  reasoning: jsonb("reasoning"), // Why this was recommended
  context: jsonb("context"), // User context at time of recommendation
  isServed: boolean("is_served").default(false),
  isClicked: boolean("is_clicked").default(false),
  isConverted: boolean("is_converted").default(false),
  clickedAt: timestamp("clicked_at"),
  convertedAt: timestamp("converted_at"),
  conversionValue: real("conversion_value"),
  userFeedback: integer("user_feedback"), // -1 (negative), 0 (neutral), 1 (positive)
  expiresAt: timestamp("expires_at"),
  neuronId: varchar("neuron_id", { length: 100 }),
  verticalId: varchar("vertical_id", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIndex: index("rec_user_id_idx").on(table.userId),
  sessionIdIndex: index("rec_session_id_idx").on(table.sessionId),
  typeIndex: index("recommendation_type_idx").on(table.recommendationType),
  scoreIndex: index("recommendation_score_idx").on(table.score),
  isServedIndex: index("is_served_idx").on(table.isServed),
  createdAtIndex: index("rec_created_at_idx").on(table.createdAt),
}));

// Vector Indexing Jobs Queue
export const vectorIndexingJobs = pgTable("vector_indexing_jobs", {
  id: serial("id").primaryKey(),
  jobType: varchar("job_type", { length: 50 }).notNull(), // 'create', 'update', 'delete', 'reindex', 'batch_create'
  contentId: varchar("content_id", { length: 255 }),
  contentType: varchar("content_type", { length: 50 }),
  contentData: jsonb("content_data"), // Content to be indexed
  modelId: integer("model_id").references(() => vectorEmbeddingModels.id),
  priority: integer("priority").default(5), // 1 (highest) to 10 (lowest)
  status: varchar("status", { length: 20 }).default("pending"), // 'pending', 'processing', 'completed', 'failed', 'retrying'
  attemptCount: integer("attempt_count").default(0),
  maxAttempts: integer("max_attempts").default(3),
  scheduledAt: timestamp("scheduled_at").defaultNow(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"),
  processingTimeMs: integer("processing_time_ms"),
  batchId: varchar("batch_id", { length: 100 }), // For batch operations
  metadata: jsonb("metadata"), // Job-specific data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  statusIndex: index("job_status_idx").on(table.status),
  priorityIndex: index("job_priority_idx").on(table.priority),
  scheduledAtIndex: index("job_scheduled_at_idx").on(table.scheduledAt),
  contentIdIndex: index("job_content_id_idx").on(table.contentId),
  batchIdIndex: index("job_batch_id_idx").on(table.batchId),
}));

// Vector Search Analytics
export const vectorSearchAnalytics = pgTable("vector_search_analytics", {
  id: serial("id").primaryKey(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  hour: integer("hour"), // 0-23, null for daily aggregates
  modelId: integer("model_id").references(() => vectorEmbeddingModels.id),
  searchType: varchar("search_type", { length: 50 }),
  totalQueries: integer("total_queries").default(0),
  uniqueUsers: integer("unique_users").default(0),
  avgResponseTime: real("avg_response_time").default(0),
  avgResultCount: real("avg_result_count").default(0),
  avgClickThroughRate: real("avg_click_through_rate").default(0),
  avgConversionRate: real("avg_conversion_rate").default(0),
  topQueries: jsonb("top_queries"), // Array of popular query texts
  topResults: jsonb("top_results"), // Array of popular result content IDs
  errorRate: real("error_rate").default(0),
  neuronId: varchar("neuron_id", { length: 100 }),
  verticalId: varchar("vertical_id", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  dateIndex: index("analytics_date_idx").on(table.date),
  modelIdIndex: index("analytics_model_id_idx").on(table.modelId),
  neuronIdIndex: index("analytics_neuron_id_idx").on(table.neuronId),
  uniqueDateModel: uniqueIndex("unique_date_model_analytics_idx").on(table.date, table.hour, table.modelId, table.searchType),
}));

// Migration and Backup Tracking
export const vectorMigrationLog = pgTable("vector_migration_log", {
  id: serial("id").primaryKey(),
  migrationType: varchar("migration_type", { length: 50 }).notNull(), // 'schema_update', 'model_change', 'database_migration', 'reindex', 'backup', 'restore'
  sourceVersion: varchar("source_version", { length: 20 }),
  targetVersion: varchar("target_version", { length: 20 }),
  status: varchar("status", { length: 20 }).default("in_progress"), // 'in_progress', 'completed', 'failed', 'rolled_back'
  affectedRecords: integer("affected_records").default(0),
  backupLocation: text("backup_location"), // Path or URL to backup
  checksumBefore: varchar("checksum_before", { length: 64 }),
  checksumAfter: varchar("checksum_after", { length: 64 }),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"),
  executedBy: varchar("executed_by", { length: 100 }).default("system"), // 'system', 'admin', 'migration_script'
  rollbackData: jsonb("rollback_data"), // Data needed for rollback
  metadata: jsonb("metadata"), // Migration-specific information
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  typeIndex: index("migration_type_idx").on(table.migrationType),
  statusIndex: index("migration_status_idx").on(table.status),
  startedAtIndex: index("migration_started_at_idx").on(table.startedAt),
}));

// Schema validation and insert schemas
export const insertVectorEmbeddingModelSchema = createInsertSchema(vectorEmbeddingModels);
export const insertVectorDatabaseAdapterSchema = createInsertSchema(vectorDatabaseAdapters);
export const insertVectorEmbeddingSchema = createInsertSchema(vectorEmbeddings);
export const insertVectorSearchQuerySchema = createInsertSchema(vectorSearchQueries);
export const insertVectorSimilarityCacheSchema = createInsertSchema(vectorSimilarityCache);
export const insertVectorRecommendationSchema = createInsertSchema(vectorRecommendations);
export const insertVectorIndexingJobSchema = createInsertSchema(vectorIndexingJobs);
export const insertVectorSearchAnalyticsSchema = createInsertSchema(vectorSearchAnalytics);
export const insertVectorMigrationLogSchema = createInsertSchema(vectorMigrationLog);

// Type exports
export type VectorEmbeddingModel = typeof vectorEmbeddingModels.$inferSelect;
export type InsertVectorEmbeddingModel = typeof vectorEmbeddingModels.$inferInsert;
export type VectorDatabaseAdapter = typeof vectorDatabaseAdapters.$inferSelect;
export type InsertVectorDatabaseAdapter = typeof vectorDatabaseAdapters.$inferInsert;
export type VectorEmbedding = typeof vectorEmbeddings.$inferSelect;
export type InsertVectorEmbedding = typeof vectorEmbeddings.$inferInsert;
export type VectorSearchQuery = typeof vectorSearchQueries.$inferSelect;
export type InsertVectorSearchQuery = typeof vectorSearchQueries.$inferInsert;
export type VectorSimilarityCache = typeof vectorSimilarityCache.$inferSelect;
export type InsertVectorSimilarityCache = typeof vectorSimilarityCache.$inferInsert;
export type VectorRecommendation = typeof vectorRecommendations.$inferSelect;
export type InsertVectorRecommendation = typeof vectorRecommendations.$inferInsert;
export type VectorIndexingJob = typeof vectorIndexingJobs.$inferSelect;
export type InsertVectorIndexingJob = typeof vectorIndexingJobs.$inferInsert;
export type VectorSearchAnalytics = typeof vectorSearchAnalytics.$inferSelect;
export type InsertVectorSearchAnalytics = typeof vectorSearchAnalytics.$inferInsert;
export type VectorMigrationLog = typeof vectorMigrationLog.$inferSelect;
export type InsertVectorMigrationLog = typeof vectorMigrationLog.$inferInsert;