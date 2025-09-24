import { Router } from "express";
import { knowledgeMemoryGraph } from "../services/knowledge-memory/knowledgeMemoryGraph";
import { ragEnhancer } from "../services/knowledge-memory/ragEnhancer";
import { federationMemorySync } from "../services/knowledge-memory/federationMemorySync";
import { requireAuth } from "../middleware/auth";
import { db } from "../db";
import { 
  memoryNodes, memoryEdges, promptOptimizations, memorySearchSessions,
  knowledgeGraphVersions, memoryUsageAnalytics, federationMemorySync as federationMemorySyncTable
} from "../../shared/knowledgeMemoryTables";
import { eq, desc, and, sql, like } from "drizzle-orm";

const router = Router();

// ==========================================
// MEMORY NODE MANAGEMENT
// ==========================================

/**
 * Create a new memory node
 */
router.post('/nodes', requireAuth, async (req, res) => {
  try {
    const nodeData = {
      ...req.body,
      createdBy: req.user.id
    };

    const node = await knowledgeMemoryGraph.addMemoryNode(nodeData);
    
    res.json({
      success: true,
      data: node,
      message: 'Memory node created successfully'
    });
  } catch (error) {
    console.error('Error creating memory node:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create memory node',
      details: error.message
    });
  }
});

/**
 * Get all memory nodes with filtering
 */
router.get('/nodes', requireAuth, async (req, res) => {
  try {
    const { 
      nodeType, 
      userArchetype, 
      status = 'active',
      limit = 50,
      offset = 0,
      search 
    } = req.query;

    let query = db.select().from(memoryNodes);
    let whereConditions = [];

    if (status) {
      whereConditions.push(eq(memoryNodes.status, status as string));
    }

    if (nodeType) {
      whereConditions.push(eq(memoryNodes.nodeType, nodeType as string));
    }

    if (userArchetype) {
      whereConditions.push(eq(memoryNodes.userArchetype, userArchetype as string));
    }

    if (search) {
      whereConditions.push(
        sql`(${memoryNodes.title} ILIKE ${`%${search}%`} OR ${memoryNodes.content} ILIKE ${`%${search}%`})`
      );
    }

    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }

    const nodes = await query
      .orderBy(desc(memoryNodes.lastUpdated))
      .limit(Number(limit))
      .offset(Number(offset));

    // Get total count for pagination
    const countQuery = db.select({ count: sql`count(*)` }).from(memoryNodes);
    if (whereConditions.length > 0) {
      countQuery.where(and(...whereConditions));
    }
    const [{ count }] = await countQuery;

    res.json({
      success: true,
      data: {
        nodes,
        pagination: {
          total: Number(count),
          limit: Number(limit),
          offset: Number(offset),
          hasMore: Number(offset) + Number(limit) < Number(count)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching memory nodes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch memory nodes',
      details: error.message
    });
  }
});

/**
 * Get a specific memory node by ID
 */
router.get('/nodes/:nodeId', requireAuth, async (req, res) => {
  try {
    const { nodeId } = req.params;

    const [node] = await db.select()
      .from(memoryNodes)
      .where(eq(memoryNodes.nodeId, nodeId))
      .limit(1);

    if (!node) {
      return res.status(404).json({
        success: false,
        error: 'Memory node not found'
      });
    }

    // Get related nodes
    const relatedNodes = await knowledgeMemoryGraph.getRelatedNodes(nodeId, 1);

    // Track node usage
    await knowledgeMemoryGraph.trackNodeUsage(
      nodeId,
      'admin_view',
      {
        userId: req.user.id,
        taskType: 'node_inspection'
      },
      {
        retrievalTime: 0
      }
    );

    res.json({
      success: true,
      data: {
        node,
        relatedNodes
      }
    });
  } catch (error) {
    console.error('Error fetching memory node:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch memory node',
      details: error.message
    });
  }
});

/**
 * Update a memory node
 */
router.put('/nodes/:nodeId', requireAuth, async (req, res) => {
  try {
    const { nodeId } = req.params;
    const updateData = req.body;

    const [updatedNode] = await db.update(memoryNodes)
      .set({
        ...updateData,
        lastUpdated: new Date()
      })
      .where(eq(memoryNodes.nodeId, nodeId))
      .returning();

    if (!updatedNode) {
      return res.status(404).json({
        success: false,
        error: 'Memory node not found'
      });
    }

    res.json({
      success: true,
      data: updatedNode,
      message: 'Memory node updated successfully'
    });
  } catch (error) {
    console.error('Error updating memory node:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update memory node',
      details: error.message
    });
  }
});

/**
 * Delete a memory node (soft delete)
 */
router.delete('/nodes/:nodeId', requireAuth, async (req, res) => {
  try {
    const { nodeId } = req.params;

    const [deletedNode] = await db.update(memoryNodes)
      .set({
        status: 'archived',
        lastUpdated: new Date()
      })
      .where(eq(memoryNodes.nodeId, nodeId))
      .returning();

    if (!deletedNode) {
      return res.status(404).json({
        success: false,
        error: 'Memory node not found'
      });
    }

    res.json({
      success: true,
      message: 'Memory node archived successfully'
    });
  } catch (error) {
    console.error('Error archiving memory node:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to archive memory node',
      details: error.message
    });
  }
});

// ==========================================
// MEMORY SEARCH & RETRIEVAL
// ==========================================

/**
 * Search memory nodes
 */
router.post('/search', requireAuth, async (req, res) => {
  try {
    const {
      query,
      taskType = 'search',
      userArchetype,
      searchType = 'hybrid',
      limit = 10,
      threshold = 0.7,
      filters = {}
    } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const results = await knowledgeMemoryGraph.searchMemory(
      query,
      {
        userId: req.user.id,
        userArchetype,
        taskType,
        sessionId: req.sessionID
      },
      {
        limit,
        threshold,
        searchType,
        filters
      }
    );

    res.json({
      success: true,
      data: {
        query,
        results,
        searchType,
        totalResults: results.length
      }
    });
  } catch (error) {
    console.error('Error searching memory:', error);
    res.status(500).json({
      success: false,
      error: 'Memory search failed',
      details: error.message
    });
  }
});

/**
 * Get related nodes for a specific node
 */
router.get('/nodes/:nodeId/related', requireAuth, async (req, res) => {
  try {
    const { nodeId } = req.params;
    const { depth = 2, relationshipTypes } = req.query;

    const relatedNodes = await knowledgeMemoryGraph.getRelatedNodes(
      nodeId,
      Number(depth),
      relationshipTypes ? (relationshipTypes as string).split(',') : undefined
    );

    res.json({
      success: true,
      data: {
        nodeId,
        relatedNodes,
        depth: Number(depth)
      }
    });
  } catch (error) {
    console.error('Error fetching related nodes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch related nodes',
      details: error.message
    });
  }
});

// ==========================================
// MEMORY EDGES MANAGEMENT
// ==========================================

/**
 * Create a memory edge (relationship)
 */
router.post('/edges', requireAuth, async (req, res) => {
  try {
    const edgeData = {
      ...req.body,
      createdBy: req.user.id
    };

    const edge = await knowledgeMemoryGraph.createMemoryEdge(edgeData);

    res.json({
      success: true,
      data: edge,
      message: 'Memory edge created successfully'
    });
  } catch (error) {
    console.error('Error creating memory edge:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create memory edge',
      details: error.message
    });
  }
});

/**
 * Get all memory edges
 */
router.get('/edges', requireAuth, async (req, res) => {
  try {
    const {
      sourceNodeId,
      targetNodeId,
      relationshipType,
      limit = 50,
      offset = 0
    } = req.query;

    let query = db.select().from(memoryEdges);
    let whereConditions = [];

    if (sourceNodeId) {
      whereConditions.push(eq(memoryEdges.sourceNodeId, sourceNodeId as string));
    }

    if (targetNodeId) {
      whereConditions.push(eq(memoryEdges.targetNodeId, targetNodeId as string));
    }

    if (relationshipType) {
      whereConditions.push(eq(memoryEdges.relationshipType, relationshipType as string));
    }

    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }

    const edges = await query
      .orderBy(desc(memoryEdges.createdAt))
      .limit(Number(limit))
      .offset(Number(offset));

    res.json({
      success: true,
      data: edges
    });
  } catch (error) {
    console.error('Error fetching memory edges:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch memory edges',
      details: error.message
    });
  }
});

// ==========================================
// RAG ENHANCEMENT & PROMPT OPTIMIZATION
// ==========================================

/**
 * Optimize prompt with RAG enhancement
 */
router.post('/rag/optimize', requireAuth, async (req, res) => {
  try {
    const {
      originalPrompt,
      taskType,
      userArchetype,
      metadata = {}
    } = req.body;

    if (!originalPrompt) {
      return res.status(400).json({
        success: false,
        error: 'Original prompt is required'
      });
    }

    const result = await ragEnhancer.optimizePrompt({
      userId: req.user.id,
      userArchetype,
      sessionId: req.sessionID,
      taskType,
      originalPrompt,
      metadata
    });

    res.json({
      success: true,
      data: result,
      message: 'Prompt optimized successfully'
    });
  } catch (error) {
    console.error('Error optimizing prompt:', error);
    res.status(500).json({
      success: false,
      error: 'Prompt optimization failed',
      details: error.message
    });
  }
});

/**
 * Get prompt optimization history
 */
router.get('/rag/optimizations', requireAuth, async (req, res) => {
  try {
    const {
      taskType,
      limit = 20,
      offset = 0
    } = req.query;

    let query = db.select().from(promptOptimizations);
    
    if (taskType) {
      query = query.where(eq(promptOptimizations.taskType, taskType as string));
    }

    const optimizations = await query
      .orderBy(desc(promptOptimizations.timestamp))
      .limit(Number(limit))
      .offset(Number(offset));

    res.json({
      success: true,
      data: optimizations
    });
  } catch (error) {
    console.error('Error fetching prompt optimizations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch prompt optimizations',
      details: error.message
    });
  }
});

// ==========================================
// FEDERATION MEMORY SYNC
// ==========================================

/**
 * Register a neuron for memory sync
 */
router.post('/federation/register', requireAuth, async (req, res) => {
  try {
    const {
      neuronId,
      baseUrl,
      apiKey,
      permissions = ['receive_nodes', 'receive_edges']
    } = req.body;

    if (!neuronId || !baseUrl || !apiKey) {
      return res.status(400).json({
        success: false,
        error: 'neuronId, baseUrl, and apiKey are required'
      });
    }

    await federationMemorySync.registerNeuron({
      neuronId,
      baseUrl,
      apiKey,
      permissions
    });

    res.json({
      success: true,
      message: `Neuron ${neuronId} registered successfully for memory sync`
    });
  } catch (error) {
    console.error('Error registering neuron:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register neuron',
      details: error.message
    });
  }
});

/**
 * Trigger manual sync with all neurons
 */
router.post('/federation/sync', requireAuth, async (req, res) => {
  try {
    await federationMemorySync.syncWithAllNeurons();

    res.json({
      success: true,
      message: 'Federation memory sync initiated successfully'
    });
  } catch (error) {
    console.error('Error triggering federation sync:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger federation sync',
      details: error.message
    });
  }
});

/**
 * Trigger sync with specific neuron
 */
router.post('/federation/sync/:neuronId', requireAuth, async (req, res) => {
  try {
    const { neuronId } = req.params;
    
    const syncResult = await federationMemorySync.syncWithNeuron(neuronId);

    res.json({
      success: true,
      data: syncResult,
      message: `Sync with ${neuronId} completed successfully`
    });
  } catch (error) {
    console.error(`Error syncing with neuron ${req.params.neuronId}:`, error);
    res.status(500).json({
      success: false,
      error: `Failed to sync with neuron ${req.params.neuronId}`,
      details: error.message
    });
  }
});

/**
 * Get federation sync statistics
 */
router.get('/federation/stats', requireAuth, async (req, res) => {
  try {
    const stats = await federationMemorySync.getSyncStatistics();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching federation stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch federation statistics',
      details: error.message
    });
  }
});

/**
 * Get recent federation sync operations
 */
router.get('/federation/operations', requireAuth, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const operations = await db.select()
      .from(federationMemorySyncTable)
      .orderBy(desc(federationMemorySyncTable.startTime))
      .limit(Number(limit))
      .offset(Number(offset));

    res.json({
      success: true,
      data: operations
    });
  } catch (error) {
    console.error('Error fetching federation operations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch federation operations',
      details: error.message
    });
  }
});

// ==========================================
// SYNC ENDPOINTS FOR EXTERNAL NEURONS
// ==========================================

/**
 * Receive nodes from external neurons
 */
router.post('/sync/receive-nodes', requireAuth, async (req, res) => {
  try {
    const { nodes, sourceNeuron } = req.body;

    if (!nodes || !Array.isArray(nodes)) {
      return res.status(400).json({
        success: false,
        error: 'Nodes array is required'
      });
    }

    let successCount = 0;
    let failureCount = 0;
    const errors = [];

    for (const nodeData of nodes) {
      try {
        await knowledgeMemoryGraph.addMemoryNode({
          ...nodeData,
          sourceType: 'federation_sync',
          sourceId: nodeData.nodeId,
          createdBy: req.user.id,
          metadata: {
            ...nodeData.metadata,
            federationSource: sourceNeuron
          }
        });
        successCount++;
      } catch (nodeError) {
        failureCount++;
        errors.push(`Node ${nodeData.nodeId}: ${nodeError.message}`);
      }
    }

    res.json({
      success: true,
      data: {
        successCount,
        failureCount,
        errors: errors.slice(0, 10) // Limit error array
      },
      message: `Processed ${nodes.length} nodes: ${successCount} successful, ${failureCount} failed`
    });
  } catch (error) {
    console.error('Error receiving nodes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to receive nodes',
      details: error.message
    });
  }
});

/**
 * Receive edges from external neurons
 */
router.post('/sync/receive-edges', requireAuth, async (req, res) => {
  try {
    const { edges, sourceNeuron } = req.body;

    if (!edges || !Array.isArray(edges)) {
      return res.status(400).json({
        success: false,
        error: 'Edges array is required'
      });
    }

    let successCount = 0;
    let failureCount = 0;
    const errors = [];

    for (const edgeData of edges) {
      try {
        await knowledgeMemoryGraph.createMemoryEdge({
          ...edgeData,
          createdBy: req.user.id,
          metadata: {
            ...edgeData.metadata,
            federationSource: sourceNeuron
          }
        });
        successCount++;
      } catch (edgeError) {
        failureCount++;
        errors.push(`Edge ${edgeData.edgeId}: ${edgeError.message}`);
      }
    }

    res.json({
      success: true,
      data: {
        successCount,
        failureCount,
        errors: errors.slice(0, 10)
      },
      message: `Processed ${edges.length} edges: ${successCount} successful, ${failureCount} failed`
    });
  } catch (error) {
    console.error('Error receiving edges:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to receive edges',
      details: error.message
    });
  }
});

/**
 * Export nodes for external neurons
 */
router.get('/sync/export-nodes', requireAuth, async (req, res) => {
  try {
    const { since, limit = 100 } = req.query;

    let query = db.select().from(memoryNodes)
      .where(eq(memoryNodes.status, 'active'));

    if (since) {
      query = query.where(
        and(
          eq(memoryNodes.status, 'active'),
          sql`${memoryNodes.lastUpdated} > ${new Date(since as string)}`
        )
      );
    }

    const nodes = await query
      .orderBy(desc(memoryNodes.lastUpdated))
      .limit(Number(limit));

    res.json({
      success: true,
      data: {
        nodes,
        exportedAt: new Date().toISOString(),
        count: nodes.length
      }
    });
  } catch (error) {
    console.error('Error exporting nodes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export nodes',
      details: error.message
    });
  }
});

/**
 * Export edges for external neurons
 */
router.get('/sync/export-edges', requireAuth, async (req, res) => {
  try {
    const { since, limit = 200 } = req.query;

    let query = db.select().from(memoryEdges)
      .where(eq(memoryEdges.status, 'active'));

    if (since) {
      query = query.where(
        and(
          eq(memoryEdges.status, 'active'),
          sql`${memoryEdges.createdAt} > ${new Date(since as string)}`
        )
      );
    }

    const edges = await query
      .orderBy(desc(memoryEdges.createdAt))
      .limit(Number(limit));

    res.json({
      success: true,
      data: {
        edges,
        exportedAt: new Date().toISOString(),
        count: edges.length
      }
    });
  } catch (error) {
    console.error('Error exporting edges:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export edges',
      details: error.message
    });
  }
});

/**
 * Health check for federation sync
 */
router.get('/sync/health', async (req, res) => {
  try {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'knowledge-memory-sync'
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// ==========================================
// ANALYTICS & MONITORING
// ==========================================

/**
 * Get memory usage analytics
 */
router.get('/analytics/usage', requireAuth, async (req, res) => {
  try {
    const { nodeId, timeRange = '7d', limit = 100 } = req.query;

    let query = db.select().from(memoryUsageAnalytics);
    let whereConditions = [];

    if (nodeId) {
      whereConditions.push(eq(memoryUsageAnalytics.nodeId, nodeId as string));
    }

    // Add time range filter
    const timeRangeMs = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };

    const rangeMs = timeRangeMs[timeRange as string] || timeRangeMs['7d'];
    const startTime = new Date(Date.now() - rangeMs);
    
    whereConditions.push(sql`${memoryUsageAnalytics.timestamp} > ${startTime}`);

    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }

    const analytics = await query
      .orderBy(desc(memoryUsageAnalytics.timestamp))
      .limit(Number(limit));

    res.json({
      success: true,
      data: {
        analytics,
        timeRange,
        count: analytics.length
      }
    });
  } catch (error) {
    console.error('Error fetching usage analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch usage analytics',
      details: error.message
    });
  }
});

/**
 * Get search session analytics
 */
router.get('/analytics/search', requireAuth, async (req, res) => {
  try {
    const { timeRange = '7d', limit = 100 } = req.query;

    const timeRangeMs = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };

    const rangeMs = timeRangeMs[timeRange as string] || timeRangeMs['7d'];
    const startTime = new Date(Date.now() - rangeMs);

    const sessions = await db.select()
      .from(memorySearchSessions)
      .where(sql`${memorySearchSessions.timestamp} > ${startTime}`)
      .orderBy(desc(memorySearchSessions.timestamp))
      .limit(Number(limit));

    res.json({
      success: true,
      data: {
        sessions,
        timeRange,
        count: sessions.length
      }
    });
  } catch (error) {
    console.error('Error fetching search analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch search analytics',
      details: error.message
    });
  }
});

/**
 * Trigger quality score updates
 */
router.post('/maintenance/update-quality-scores', requireAuth, async (req, res) => {
  try {
    await knowledgeMemoryGraph.updateQualityScores();

    res.json({
      success: true,
      message: 'Quality score update initiated successfully'
    });
  } catch (error) {
    console.error('Error updating quality scores:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update quality scores',
      details: error.message
    });
  }
});

export default router;