import { Router, Request, Response } from "express";
import { z } from "zod";
import { vectorEngine } from "../services/semantic/vectorEngine";
import { vectorDatabaseManager } from "../services/semantic/vectorDatabaseAdapter";
import { db } from "../db";
import { eq, and, or, sql, desc, asc, inArray, gt, lt } from "drizzle-orm";
import {
  vectorEmbeddingModels,
  vectorEmbeddings,
  vectorSearchQueries,
  vectorRecommendations,
  vectorSearchAnalytics,
  vectorIndexingJobs,
  vectorDatabaseAdapters,
  vectorSimilarityCache,
  type InsertVectorEmbedding,
  type InsertVectorSearchQuery,
  type InsertVectorRecommendation,
  type InsertVectorIndexingJob,
} from "@shared/vectorSearchTables";

const router = Router();

/**
 * ENGINE MANAGEMENT API
 */

// Vector engine status
router.get("/engine/status", async (req: Request, res: Response) => {
  try {
    const status = await vectorEngine.getEngineStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error("Error getting engine status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get engine status"
    });
  }
});

// Initialize vector engine
router.post("/engine/initialize", async (req: Request, res: Response) => {
  try {
    await vectorEngine.initialize();
    
    res.json({
      success: true,
      message: "Vector engine initialized successfully"
    });
  } catch (error) {
    console.error("Error initializing engine:", error);
    res.status(500).json({
      success: false,
      error: "Failed to initialize engine"
    });
  }
});

// Get storage statistics
router.get("/storage/stats", async (req: Request, res: Response) => {
  try {
    const stats = await vectorDatabaseManager.getStorageStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error("Error getting storage stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get storage stats"
    });
  }
});

/**
 * VECTOR EMBEDDINGS API
 */

// Generate single embedding
router.post("/embeddings/generate", async (req: Request, res: Response) => {
  try {
    const { text, modelName, contentId, contentType, metadata } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: "Text is required and must be a string"
      });
    }

    const embedding = await vectorEngine.generateEmbedding(text, modelName, {
      contentId,
      contentType,
      metadata,
    });

    res.json({
      success: true,
      data: {
        embedding,
        dimensions: embedding.length,
        model: modelName || 'default',
        contentId,
      }
    });

  } catch (error) {
    console.error("Error generating embedding:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate embedding"
    });
  }
});

// Batch embedding generation
router.post("/embeddings/batch", async (req: Request, res: Response) => {
  try {
    const { texts, modelName, batchId } = req.body;

    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Texts must be a non-empty array"
      });
    }

    if (texts.length > 100) {
      return res.status(400).json({
        success: false,
        error: "Batch size cannot exceed 100 texts"
      });
    }

    const embeddings = [];
    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      const embedding = await vectorEngine.generateEmbedding(text, modelName);
      embeddings.push({
        index: i,
        text,
        embedding,
        dimensions: embedding.length,
      });
    }

    res.json({
      success: true,
      data: {
        embeddings,
        batchId,
        total: embeddings.length,
        model: modelName || 'default',
      }
    });

  } catch (error) {
    console.error("Error generating batch embeddings:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate batch embeddings"
    });
  }
});

/**
 * VECTOR SEARCH API
 */

// Semantic search by text
router.post("/search/semantic", async (req: Request, res: Response) => {
  try {
    const {
      query,
      topK = 10,
      threshold = 0.3,
      contentTypes,
      filters,
      userId,
      sessionId,
    } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: "Query is required and must be a string"
      });
    }

    const startTime = Date.now();
    
    const results = await vectorEngine.searchSimilar(query, {
      topK: Math.min(topK, 100),
      threshold: Math.max(0, Math.min(1, threshold)),
      contentTypes,
      filters,
      userId,
      sessionId,
    });

    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        query,
        results,
        resultCount: results.length,
        responseTime,
        parameters: {
          topK,
          threshold,
          contentTypes,
        }
      }
    });

  } catch (error) {
    console.error("Error in semantic search:", error);
    res.status(500).json({
      success: false,
      error: "Failed to perform semantic search"
    });
  }
});

// Vector similarity search (direct vector input)
router.post("/search/similarity", async (req: Request, res: Response) => {
  try {
    const {
      queryVector,
      topK = 10,
      threshold = 0.3,
      algorithm = 'cosine',
      filters,
    } = req.body;

    if (!Array.isArray(queryVector) || queryVector.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Query vector is required and must be a non-empty array"
      });
    }

    const startTime = Date.now();

    const results = await vectorDatabaseManager.searchVectors(
      queryVector,
      Math.min(topK, 100),
      Math.max(0, Math.min(1, threshold)),
      filters
    );

    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        results,
        resultCount: results.length,
        responseTime,
        parameters: {
          dimensions: queryVector.length,
          topK,
          threshold,
          algorithm,
        }
      }
    });

  } catch (error) {
    console.error("Error in similarity search:", error);
    res.status(500).json({
      success: false,
      error: "Failed to perform similarity search"
    });
  }
});

/**
 * RECOMMENDATIONS API
 */

// Get personalized recommendations
router.post("/recommendations/get", async (req: Request, res: Response) => {
  try {
    const {
      userId,
      sessionId,
      recommendationType = 'content',
      sourceContentId,
      topK = 5,
      algorithm = 'hybrid',
    } = req.body;

    const results = await vectorEngine.getRecommendations(userId, sessionId, {
      recommendationType,
      sourceContentId,
      topK: Math.min(topK, 20),
      algorithm,
    });

    res.json({
      success: true,
      data: {
        recommendations: results,
        count: results.length,
        type: recommendationType,
        algorithm,
        userId,
        sessionId,
      }
    });

  } catch (error) {
    console.error("Error getting recommendations:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get recommendations"
    });
  }
});

// Track recommendation feedback
router.post("/recommendations/feedback", async (req: Request, res: Response) => {
  try {
    const {
      recommendationId,
      userId,
      sessionId,
      action, // 'clicked', 'converted', 'dismissed'
      value,
      feedback, // -1, 0, 1
    } = req.body;

    if (!recommendationId) {
      return res.status(400).json({
        success: false,
        error: "Recommendation ID is required"
      });
    }

    // Update recommendation record
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (action === 'clicked') {
      updateData.isClicked = true;
      updateData.clickedAt = new Date();
    } else if (action === 'converted') {
      updateData.isConverted = true;
      updateData.convertedAt = new Date();
      if (value) {
        updateData.conversionValue = value;
      }
    }

    if (feedback !== undefined) {
      updateData.userFeedback = feedback;
    }

    await db.update(vectorRecommendations)
      .set(updateData)
      .where(eq(vectorRecommendations.id, recommendationId));

    res.json({
      success: true,
      data: {
        recommendationId,
        action,
        feedback,
        processed: true,
      }
    });

  } catch (error) {
    console.error("Error tracking recommendation feedback:", error);
    res.status(500).json({
      success: false,
      error: "Failed to track feedback"
    });
  }
});

/**
 * INDEXING & MANAGEMENT API
 */

// Queue indexing job
router.post("/indexing/queue", async (req: Request, res: Response) => {
  try {
    const {
      jobType,
      contentId,
      contentType,
      contentData,
      modelId,
      priority = 5,
      batchId,
    } = req.body;

    if (!jobType || !contentId) {
      return res.status(400).json({
        success: false,
        error: "Job type and content ID are required"
      });
    }

    const job: InsertVectorIndexingJob = {
      jobType,
      contentId,
      contentType,
      contentData,
      modelId: modelId || 1,
      priority: Math.max(1, Math.min(10, priority)),
      batchId,
      status: 'pending',
    };

    const [inserted] = await db.insert(vectorIndexingJobs)
      .values(job)
      .returning();

    res.json({
      success: true,
      data: {
        jobId: inserted.id,
        status: inserted.status,
        priority: inserted.priority,
        scheduledAt: inserted.scheduledAt,
      }
    });

  } catch (error) {
    console.error("Error queuing indexing job:", error);
    res.status(500).json({
      success: false,
      error: "Failed to queue indexing job"
    });
  }
});

// Get indexing job status
router.get("/indexing/status/:jobId", async (req: Request, res: Response) => {
  try {
    const jobId = parseInt(req.params.jobId);

    if (isNaN(jobId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid job ID"
      });
    }

    const job = await db.select()
      .from(vectorIndexingJobs)
      .where(eq(vectorIndexingJobs.id, jobId))
      .limit(1);

    if (job.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Job not found"
      });
    }

    res.json({
      success: true,
      data: job[0]
    });

  } catch (error) {
    console.error("Error getting job status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get job status"
    });
  }
});

// Bulk reindex content
router.post("/indexing/reindex", async (req: Request, res: Response) => {
  try {
    const {
      contentType,
      modelId,
      batchSize = 100,
      priority = 5,
    } = req.body;

    let query = db.select({
      contentId: vectorEmbeddings.contentId,
      contentType: vectorEmbeddings.contentType,
      textContent: vectorEmbeddings.textContent,
    }).from(vectorEmbeddings);

    if (contentType) {
      query = query.where(eq(vectorEmbeddings.contentType, contentType));
    }

    const content = await query.limit(batchSize);

    const batchId = `reindex_${Date.now()}`;
    const jobs: InsertVectorIndexingJob[] = [];

    for (const item of content) {
      jobs.push({
        jobType: 'reindex',
        contentId: item.contentId,
        contentType: item.contentType,
        contentData: { textContent: item.textContent },
        modelId: modelId || 1,
        priority,
        batchId,
        status: 'pending',
      });
    }

    if (jobs.length > 0) {
      await db.insert(vectorIndexingJobs).values(jobs);
    }

    res.json({
      success: true,
      data: {
        batchId,
        jobsQueued: jobs.length,
        contentType,
        modelId,
      }
    });

  } catch (error) {
    console.error("Error starting reindex:", error);
    res.status(500).json({
      success: false,
      error: "Failed to start reindex"
    });
  }
});

/**
 * ANALYTICS & MONITORING API
 */

// Get search analytics
router.get("/analytics/search", async (req: Request, res: Response) => {
  try {
    const {
      startDate,
      endDate,
      modelId,
      searchType,
      neuronId,
      groupBy = 'date',
    } = req.query;

    let query = db.select().from(vectorSearchAnalytics);

    const conditions = [];
    
    if (startDate) {
      conditions.push(sql`date >= ${startDate}`);
    }
    
    if (endDate) {
      conditions.push(sql`date <= ${endDate}`);
    }
    
    if (modelId) {
      conditions.push(eq(vectorSearchAnalytics.modelId, parseInt(modelId as string)));
    }
    
    if (searchType) {
      conditions.push(eq(vectorSearchAnalytics.searchType, searchType as string));
    }
    
    if (neuronId) {
      conditions.push(eq(vectorSearchAnalytics.neuronId, neuronId as string));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const analytics = await query
      .orderBy(desc(vectorSearchAnalytics.date), desc(vectorSearchAnalytics.hour))
      .limit(100);

    // Calculate summary statistics
    const summary = {
      totalQueries: analytics.reduce((sum, row) => sum + (row.totalQueries || 0), 0),
      totalUsers: analytics.reduce((sum, row) => sum + (row.uniqueUsers || 0), 0),
      avgResponseTime: analytics.length > 0 
        ? analytics.reduce((sum, row) => sum + (row.avgResponseTime || 0), 0) / analytics.length 
        : 0,
      avgClickThroughRate: analytics.length > 0 
        ? analytics.reduce((sum, row) => sum + (row.avgClickThroughRate || 0), 0) / analytics.length 
        : 0,
    };

    res.json({
      success: true,
      data: {
        analytics,
        summary,
        period: { startDate, endDate },
        groupBy,
      }
    });

  } catch (error) {
    console.error("Error getting search analytics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get search analytics"
    });
  }
});

// Get popular search queries
router.get("/analytics/popular-queries", async (req: Request, res: Response) => {
  try {
    const {
      limit = 20,
      timeframe = '7d',
      modelId,
    } = req.query;

    const days = timeframe === '1d' ? 1 : timeframe === '7d' ? 7 : 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    let query = db.select({
      queryText: vectorSearchQueries.queryText,
      count: sql<number>`count(*)`,
      avgSimilarity: sql<number>`avg(
        CASE 
          WHEN jsonb_array_length(result_ids) > 0 
          THEN 1.0 
          ELSE 0.0 
        END
      )`,
      avgResultCount: sql<number>`avg(result_count)`,
    })
    .from(vectorSearchQueries)
    .where(gt(vectorSearchQueries.createdAt, cutoffDate.toISOString()))
    .groupBy(vectorSearchQueries.queryText)
    .orderBy(sql`count(*) DESC`)
    .limit(parseInt(limit as string));

    if (modelId) {
      query = query.where(
        and(
          gt(vectorSearchQueries.createdAt, cutoffDate.toISOString()),
          eq(vectorSearchQueries.modelId, parseInt(modelId as string))
        )
      );
    }

    const popularQueries = await query;

    res.json({
      success: true,
      data: {
        queries: popularQueries,
        timeframe,
        limit: parseInt(limit as string),
      }
    });

  } catch (error) {
    console.error("Error getting popular queries:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get popular queries"
    });
  }
});

/**
 * MODEL MANAGEMENT API
 */

// List available embedding models
router.get("/models", async (req: Request, res: Response) => {
  try {
    const models = await db.select()
      .from(vectorEmbeddingModels)
      .where(eq(vectorEmbeddingModels.isActive, true))
      .orderBy(desc(vectorEmbeddingModels.isDefault), asc(vectorEmbeddingModels.modelName));

    res.json({
      success: true,
      data: {
        models,
        total: models.length,
      }
    });

  } catch (error) {
    console.error("Error listing models:", error);
    res.status(500).json({
      success: false,
      error: "Failed to list models"
    });
  }
});

// Get model performance stats
router.get("/models/:modelId/stats", async (req: Request, res: Response) => {
  try {
    const modelId = parseInt(req.params.modelId);

    if (isNaN(modelId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid model ID"
      });
    }

    const model = await db.select()
      .from(vectorEmbeddingModels)
      .where(eq(vectorEmbeddingModels.id, modelId))
      .limit(1);

    if (model.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Model not found"
      });
    }

    // Get usage statistics
    const stats = await db.select({
      totalEmbeddings: sql<number>`count(*)`,
      avgDimensions: sql<number>`avg(dimensions)`,
      totalQueries: sql<number>`count(distinct q.id)`,
    })
    .from(vectorEmbeddings)
    .leftJoin(vectorSearchQueries, eq(vectorSearchQueries.modelId, modelId))
    .where(eq(vectorEmbeddings.modelId, modelId));

    res.json({
      success: true,
      data: {
        model: model[0],
        stats: stats[0],
      }
    });

  } catch (error) {
    console.error("Error getting model stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get model stats"
    });
  }
});

/**
 * SYSTEM STATUS API
 */

// Get vector engine status
router.get("/status", async (req: Request, res: Response) => {
  try {
    const engineStatus = vectorEngine.getEngineStatus();
    const storageStats = await vectorEngine.getStorageStats();
    
    res.json({
      success: true,
      data: {
        engine: engineStatus,
        storage: storageStats,
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error("Error getting vector engine status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get system status"
    });
  }
});

// Get database adapter health
router.get("/adapters/health", async (req: Request, res: Response) => {
  try {
    const adapters = await db.select()
      .from(vectorDatabaseAdapters)
      .orderBy(desc(vectorDatabaseAdapters.isPrimary), asc(vectorDatabaseAdapters.priority));

    const healthStatus = vectorDatabaseManager.getHealthStatus();

    res.json({
      success: true,
      data: {
        adapters,
        health: healthStatus,
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error("Error getting adapter health:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get adapter health"
    });
  }
});

/**
 * CACHE MANAGEMENT API
 */

// Get similarity cache stats
router.get("/cache/similarity/stats", async (req: Request, res: Response) => {
  try {
    const stats = await db.select({
      totalEntries: sql<number>`count(*)`,
      validEntries: sql<number>`count(*) FILTER (WHERE is_valid = true)`,
      avgSimilarity: sql<number>`avg(similarity)`,
      expiredEntries: sql<number>`count(*) FILTER (WHERE expires_at < now())`,
    })
    .from(vectorSimilarityCache);

    res.json({
      success: true,
      data: stats[0]
    });

  } catch (error) {
    console.error("Error getting cache stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get cache stats"
    });
  }
});

// Clear expired cache entries
router.delete("/cache/similarity/expired", async (req: Request, res: Response) => {
  try {
    const deleted = await db.delete(vectorSimilarityCache)
      .where(lt(vectorSimilarityCache.expiresAt, new Date().toISOString()))
      .returning({ id: vectorSimilarityCache.id });

    res.json({
      success: true,
      data: {
        deletedCount: deleted.length,
      }
    });

  } catch (error) {
    console.error("Error clearing expired cache:", error);
    res.status(500).json({
      success: false,
      error: "Failed to clear expired cache"
    });
  }
});

export default router;