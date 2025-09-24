import { db } from "../../db";
import { eq, and, or, sql, desc, asc, inArray, gt, lt } from "drizzle-orm";
import {
  semanticNodes,
  semanticEdges,
  userIntentVectors,
  vectorSimilarityIndex,
  semanticSearchQueries,
  realtimeRecommendations,
  graphAnalytics,
  type SemanticNode,
  type InsertSemanticNode,
  type SemanticEdge,
  type InsertSemanticEdge,
  type UserIntentVector,
  type InsertUserIntentVector,
} from "@shared/semanticTables";
import { vectorEngine, type SimilarityResult } from "./vectorEngine";
import { llmIntegration } from "../ai-ml/llmIntegration";

/**
 * Semantic Graph Engine - Core intelligence layer for the Findawise Empire
 * Manages the knowledge graph, relationships, and semantic understanding
 */
export class SemanticGraphEngine {
  private initialized = false;
  private vectorCache = new Map<number, number[]>();
  private readonly cacheTimeout = 1000 * 60 * 30; // 30 minutes

  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log("🧠 Initializing Semantic Graph Engine...");
    
    // Initialize vector engine
    await vectorEngine.initialize();
    
    // Warm up vector cache with popular nodes
    await this.warmupVectorCache();
    
    this.initialized = true;
    console.log("✅ Semantic Graph Engine initialized successfully");
  }

  /**
   * CREATE OPERATIONS
   */
  async createNode(data: InsertSemanticNode): Promise<SemanticNode> {
    try {
      // Generate embedding for the node content
      const content = `${data.title} ${data.description || ''} ${data.content || ''}`;
      const embedding = await vectorEngine.generateEmbedding(content);
      
      // Generate semantic keywords using LLM
      const keywords = await this.generateSemanticKeywords(content);
      
      // Generate LLM summary
      const summary = await this.generateLLMSummary(content);
      
      // Generate intent profile tags
      const intentTags = await this.generateIntentTags(content, data.nodeType);

      const nodeData = {
        ...data,
        vectorEmbedding: embedding,
        semanticKeywords: keywords,
        llmSummary: summary,
        intentProfileTags: intentTags,
        lastOptimized: new Date(),
      };

      // Use ON CONFLICT DO UPDATE to handle duplicates gracefully
      const [node] = await db.insert(semanticNodes)
        .values(nodeData)
        .onConflictDoUpdate({
          target: semanticNodes.slug,
          set: {
            title: nodeData.title,
            description: nodeData.description,
            content: nodeData.content,
            vectorEmbedding: nodeData.vectorEmbedding,
            semanticKeywords: nodeData.semanticKeywords,
            llmSummary: nodeData.llmSummary,
            intentProfileTags: nodeData.intentProfileTags,
            lastOptimized: nodeData.lastOptimized,
          }
        })
        .returning();
      
      // Update vector cache
      this.vectorCache.set(node.id, embedding);
      
      // Auto-generate relationships
      await this.autoGenerateRelationships(node);
      
      // Update similarity index
      await this.updateSimilarityIndex(node.id, embedding);

      console.log(`🔗 Created semantic node: ${node.slug} (${node.nodeType})`);
      return node;

    } catch (error) {
      console.error("Error creating semantic node:", error);
      throw new Error("Failed to create semantic node");
    }
  }

  async createEdge(data: InsertSemanticEdge): Promise<SemanticEdge> {
    try {
      // Empire-grade upsert for semantic edges to handle duplicates gracefully
      const [edge] = await db.insert(semanticEdges)
        .values({
          ...data,
          lastTraversed: new Date(),
        })
        .onConflictDoUpdate({
          target: [semanticEdges.fromNodeId, semanticEdges.toNodeId, semanticEdges.edgeType],
          set: {
            weight: data.weight,
            metadata: data.metadata,
            lastTraversed: new Date(),
          }
        })
        .returning();

      // Update analytics
      await this.trackEdgeCreation(edge);

      console.log(`🔗 Created/Updated semantic edge: ${data.fromNodeId} → ${data.toNodeId} (${data.edgeType})`);
      return edge;

    } catch (error) {
      console.error("Error creating semantic edge:", error);
      throw new Error("Failed to create semantic edge");
    }
  }

  /**
   * SEARCH OPERATIONS
   */
  async semanticSearch(
    query: string,
    options: {
      nodeTypes?: string[];
      verticals?: string[];
      topK?: number;
      threshold?: number;
      userId?: string;
      sessionId?: string;
    } = {}
  ): Promise<Array<SemanticNode & { similarity: number }>> {
    try {
      const { nodeTypes, verticals, topK = 10, threshold = 0.5, userId, sessionId } = options;
      
      // Generate query embedding
      const queryVector = await vectorEngine.generateEmbedding(query);
      
      // Get all potential nodes
      let nodesQuery = db.select().from(semanticNodes)
        .where(eq(semanticNodes.status, 'active'));
      
      if (nodeTypes?.length) {
        nodesQuery = nodesQuery.where(inArray(semanticNodes.nodeType, nodeTypes));
      }
      
      if (verticals?.length) {
        nodesQuery = nodesQuery.where(inArray(semanticNodes.verticalId, verticals));
      }
      
      const nodes = await nodesQuery;
      
      // Calculate similarities
      const vectorDatabase = nodes.map(node => ({
        id: node.id,
        vector: node.vectorEmbedding as number[] || [],
        metadata: node
      }));
      
      const similarityResults = vectorEngine.findTopSimilar(
        queryVector,
        vectorDatabase,
        topK,
        'cosine'
      );
      
      // Filter by threshold and format results
      const results = similarityResults
        .filter(result => result.similarity >= threshold)
        .map(result => ({
          ...result.metadata,
          similarity: result.similarity
        }));
      
      // Track search query
      await this.trackSearchQuery(query, queryVector, results, userId, sessionId);
      
      return results;

    } catch (error) {
      console.error("Error in semantic search:", error);
      return [];
    }
  }

  async findSimilarNodes(nodeId: number, topK: number = 10): Promise<Array<SemanticNode & { similarity: number }>> {
    try {
      // Check similarity index first
      const indexedSimilar = await db.select({
        node: semanticNodes,
        similarity: vectorSimilarityIndex.similarity
      })
        .from(vectorSimilarityIndex)
        .innerJoin(semanticNodes, eq(vectorSimilarityIndex.similarNodeId, semanticNodes.id))
        .where(eq(vectorSimilarityIndex.nodeId, nodeId))
        .orderBy(desc(vectorSimilarityIndex.similarity))
        .limit(topK);

      if (indexedSimilar.length > 0) {
        return indexedSimilar.map(item => ({
          ...item.node,
          similarity: item.similarity
        }));
      }

      // Fallback to direct vector comparison
      const targetNode = await db.select().from(semanticNodes).where(eq(semanticNodes.id, nodeId)).limit(1);
      if (!targetNode[0] || !targetNode[0].vectorEmbedding) {
        return [];
      }

      const queryVector = targetNode[0].vectorEmbedding as number[];
      const allNodes = await db.select().from(semanticNodes)
        .where(and(
          eq(semanticNodes.status, 'active'),
          sql`${semanticNodes.id} != ${nodeId}`
        ));

      const vectorDatabase = allNodes.map(node => ({
        id: node.id,
        vector: node.vectorEmbedding as number[] || [],
        metadata: node
      }));

      const similarities = vectorEngine.findTopSimilar(queryVector, vectorDatabase, topK, 'cosine');
      
      return similarities.map(result => ({
        ...result.metadata,
        similarity: result.similarity
      }));

    } catch (error) {
      console.error("Error finding similar nodes:", error);
      return [];
    }
  }

  /**
   * GRAPH OPERATIONS
   */
  async getNodeWithRelationships(nodeId: number): Promise<{
    node: SemanticNode;
    outgoingEdges: Array<SemanticEdge & { toNode: SemanticNode }>;
    incomingEdges: Array<SemanticEdge & { fromNode: SemanticNode }>;
  } | null> {
    try {
      const node = await db.select().from(semanticNodes).where(eq(semanticNodes.id, nodeId)).limit(1);
      if (!node[0]) return null;

      const outgoingEdges = await db.select({
        edge: semanticEdges,
        toNode: semanticNodes
      })
        .from(semanticEdges)
        .innerJoin(semanticNodes, eq(semanticEdges.toNodeId, semanticNodes.id))
        .where(and(
          eq(semanticEdges.fromNodeId, nodeId),
          eq(semanticEdges.isActive, true)
        ));

      const incomingEdges = await db.select({
        edge: semanticEdges,
        fromNode: semanticNodes
      })
        .from(semanticEdges)
        .innerJoin(semanticNodes, eq(semanticEdges.fromNodeId, semanticNodes.id))
        .where(and(
          eq(semanticEdges.toNodeId, nodeId),
          eq(semanticEdges.isActive, true)
        ));

      return {
        node: node[0],
        outgoingEdges: outgoingEdges.map(item => ({ ...item.edge, toNode: item.toNode })),
        incomingEdges: incomingEdges.map(item => ({ ...item.edge, fromNode: item.fromNode }))
      };

    } catch (error) {
      console.error("Error getting node with relationships:", error);
      return null;
    }
  }

  async findShortestPath(fromNodeId: number, toNodeId: number, maxDepth: number = 5): Promise<SemanticNode[]> {
    try {
      // Simplified BFS implementation
      const visited = new Set<number>();
      const queue = [{ nodeId: fromNodeId, path: [fromNodeId] }];
      
      while (queue.length > 0) {
        const { nodeId, path } = queue.shift()!;
        
        if (nodeId === toNodeId) {
          // Return the path as nodes
          const nodes = await db.select().from(semanticNodes).where(inArray(semanticNodes.id, path));
          return path.map(id => nodes.find(n => n.id === id)!).filter(Boolean);
        }
        
        if (path.length >= maxDepth || visited.has(nodeId)) {
          continue;
        }
        
        visited.add(nodeId);
        
        // Get connected nodes
        const connections = await db.select({ toNodeId: semanticEdges.toNodeId })
          .from(semanticEdges)
          .where(and(
            eq(semanticEdges.fromNodeId, nodeId),
            eq(semanticEdges.isActive, true)
          ));
        
        for (const conn of connections) {
          if (!visited.has(conn.toNodeId)) {
            queue.push({ nodeId: conn.toNodeId, path: [...path, conn.toNodeId] });
          }
        }
      }
      
      return [];
    } catch (error) {
      console.error("Error finding shortest path:", error);
      return [];
    }
  }

  /**
   * AUTO-GENERATION AND OPTIMIZATION
   */
  private async autoGenerateRelationships(node: SemanticNode): Promise<void> {
    try {
      // Find similar nodes for potential relationships
      const similarNodes = await this.findSimilarNodes(node.id, 20);
      
      for (const similar of similarNodes) {
        if (similar.similarity > 0.7) {
          // Create strong similarity relationship
          await this.createEdge({
            fromNodeId: node.id,
            toNodeId: similar.id,
            edgeType: 'related_to',
            weight: similar.similarity,
            confidence: similar.similarity,
            createdBy: 'auto'
          });
        }
        
        // Generate intent-based relationships
        if (node.nodeType === 'quiz' && similar.nodeType === 'offer' && similar.similarity > 0.6) {
          await this.createEdge({
            fromNodeId: node.id,
            toNodeId: similar.id,
            edgeType: 'leads_to',
            weight: similar.similarity * 0.8,
            confidence: similar.similarity * 0.8,
            createdBy: 'auto'
          });
        }
        
        if (node.nodeType === 'page' && similar.nodeType === 'cta_block' && similar.similarity > 0.65) {
          await this.createEdge({
            fromNodeId: node.id,
            toNodeId: similar.id,
            edgeType: 'influences',
            weight: similar.similarity * 0.9,
            confidence: similar.similarity * 0.9,
            createdBy: 'auto'
          });
        }
      }
      
    } catch (error) {
      console.error("Error auto-generating relationships:", error);
    }
  }

  private async generateSemanticKeywords(content: string): Promise<string[]> {
    try {
      const prompt = `Extract 5-10 semantic keywords from this content that represent the core concepts and intent:\n\n${content.slice(0, 1000)}`;
      const response = await llmIntegration.generateResponse(prompt);
      
      // Parse keywords from response
      const keywords = response
        .split(/[,\n]/)
        .map(k => k.trim().toLowerCase())
        .filter(k => k.length > 2 && k.length < 30)
        .slice(0, 10);
      
      return keywords;
    } catch (error) {
      // Fallback to simple keyword extraction
      return content
        .toLowerCase()
        .match(/\b\w{4,}\b/g)
        ?.slice(0, 10) || [];
    }
  }

  private async generateLLMSummary(content: string): Promise<string> {
    try {
      const prompt = `Provide a concise 2-sentence summary of this content focusing on its main purpose and value:\n\n${content.slice(0, 1000)}`;
      return await llmIntegration.generateResponse(prompt);
    } catch (error) {
      return content.slice(0, 200) + "...";
    }
  }

  private async generateIntentTags(content: string, nodeType: string): Promise<string[]> {
    try {
      const prompt = `Based on this ${nodeType} content, identify 3-5 user intent tags (e.g., "learn", "buy", "compare", "solve", "discover"):\n\n${content.slice(0, 500)}`;
      const response = await llmIntegration.generateResponse(prompt);
      
      const tags = response
        .toLowerCase()
        .match(/\b(learn|buy|compare|solve|discover|explore|understand|improve|find|get|start|try|save|earn|optimize|automate|scale|grow|analyze|track|manage|create|build|test)\b/g) || [];
      
      return [...new Set(tags)].slice(0, 5);
    } catch (error) {
      // Fallback intent tags based on node type
      const fallbackTags: Record<string, string[]> = {
        'page': ['learn', 'explore'],
        'quiz': ['discover', 'learn'],
        'offer': ['buy', 'get'],
        'cta_block': ['try', 'start'],
        'blog_post': ['learn', 'understand'],
        'tool': ['use', 'try'],
        'neuron': ['explore', 'discover']
      };
      
      return fallbackTags[nodeType] || ['explore'];
    }
  }

  private async warmupVectorCache(): Promise<void> {
    try {
      const popularNodes = await db.select()
        .from(semanticNodes)
        .where(eq(semanticNodes.status, 'active'))
        .orderBy(desc(semanticNodes.clickThroughRate))
        .limit(100);
      
      for (const node of popularNodes) {
        if (node.vectorEmbedding) {
          this.vectorCache.set(node.id, node.vectorEmbedding as number[]);
        }
      }
      
      console.log(`🔥 Warmed up vector cache with ${this.vectorCache.size} nodes`);
    } catch (error) {
      console.error("Error warming up vector cache:", error);
    }
  }

  private async updateSimilarityIndex(nodeId: number, embedding: number[]): Promise<void> {
    try {
      // Find similar nodes and update index
      const allNodes = await db.select()
        .from(semanticNodes)
        .where(and(
          eq(semanticNodes.status, 'active'),
          sql`${semanticNodes.id} != ${nodeId}`
        ))
        .limit(1000);

      const similarities: Array<{ nodeId: number; similarNodeId: number; similarity: number }> = [];
      
      for (const node of allNodes) {
        if (node.vectorEmbedding) {
          const similarity = vectorEngine.cosineSimilarity(embedding, node.vectorEmbedding as number[]);
          if (similarity > 0.5) {
            similarities.push({
              nodeId: nodeId,
              similarNodeId: node.id,
              similarity: similarity
            });
          }
        }
      }

      // Batch insert similarities
      if (similarities.length > 0) {
        await db.insert(vectorSimilarityIndex).values(similarities);
      }

    } catch (error) {
      console.error("Error updating similarity index:", error);
    }
  }

  private async trackSearchQuery(
    query: string,
    queryVector: number[],
    results: any[],
    userId?: string,
    sessionId?: string
  ): Promise<void> {
    try {
      await db.insert(semanticSearchQueries).values({
        queryText: query,
        queryVector: queryVector,
        userId: userId,
        sessionId: sessionId,
        results: results.map(r => ({ id: r.id, similarity: r.similarity })),
        performanceMetrics: {
          resultCount: results.length,
          executionTime: Date.now() // This would be calculated properly
        }
      });
    } catch (error) {
      console.error("Error tracking search query:", error);
    }
  }

  private async trackEdgeCreation(edge: SemanticEdge): Promise<void> {
    try {
      await db.insert(graphAnalytics).values({
        edgeId: edge.id,
        metricType: 'edge_created',
        value: 1,
        timeframe: 'daily',
        date: new Date()
      });
    } catch (error) {
      console.error("Error tracking edge creation:", error);
    }
  }
}

// Singleton instance
export const semanticGraphEngine = new SemanticGraphEngine();