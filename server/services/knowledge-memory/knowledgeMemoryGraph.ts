import { db } from "../../db";
import { 
  memoryNodes, memoryEdges, promptOptimizations, memorySearchSessions,
  knowledgeGraphVersions, memoryUsageAnalytics, federationMemorySync,
  type MemoryNode, type NewMemoryNode, type MemoryEdge, type NewMemoryEdge
} from "../../../shared/knowledgeMemoryTables";
import { eq, desc, asc, and, or, sql, like, inArray } from "drizzle-orm";
import { OpenAI } from "openai";

interface SearchResult {
  node: MemoryNode;
  score: number;
  relevance: number;
}

interface MemoryContext {
  userId?: number;
  userArchetype?: string;
  sessionId?: string;
  taskType: string;
  priority?: 'low' | 'medium' | 'high';
}

/**
 * Knowledge Memory Graph - Enterprise-grade living memory system
 * Hybrid vector + relational knowledge base with intelligent retrieval
 */
export class KnowledgeMemoryGraph {
  private openai: OpenAI;
  private embeddingModel: string = "text-embedding-ada-002";
  private embeddingCache: Map<string, number[]> = new Map();

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "placeholder-key"
    });
  }

  /**
   * Add a new memory node to the graph
   */
  async addMemoryNode(nodeData: Omit<NewMemoryNode, 'id' | 'createdAt' | 'lastUpdated'>): Promise<MemoryNode> {
    try {
      // Generate embedding for content
      const embedding = await this.generateEmbedding(nodeData.content);
      
      // Extract keywords and entities
      const keywords = await this.extractKeywords(nodeData.content);
      const entities = await this.extractEntities(nodeData.content);

      const [node] = await db.insert(memoryNodes).values({
        ...nodeData,
        embedding: JSON.stringify(embedding),
        keywords: JSON.stringify(keywords),
        entities: JSON.stringify(entities),
        qualityScore: this.calculateInitialQualityScore(nodeData),
        confidenceScore: nodeData.sourceType === 'verified' ? 0.9 : 0.5
      }).returning();

      // Log the creation
      await this.logGraphVersion({
        nodeId: node.nodeId,
        changeType: 'create',
        newData: node,
        changeReason: 'New node creation',
        changeSource: nodeData.sourceType,
        changedBy: nodeData.createdBy
      });

      console.log(`🧠 Added memory node: ${node.title} (${node.nodeId})`);
      return node;
    } catch (error) {
      console.error('Error adding memory node:', error);
      throw error;
    }
  }

  /**
   * Create a relationship between two memory nodes
   */
  async createMemoryEdge(edgeData: Omit<NewMemoryEdge, 'id' | 'createdAt'>): Promise<MemoryEdge> {
    try {
      const [edge] = await db.insert(memoryEdges).values(edgeData).returning();
      
      console.log(`🔗 Created memory edge: ${edge.relationshipType} (${edge.sourceNodeId} -> ${edge.targetNodeId})`);
      return edge;
    } catch (error) {
      console.error('Error creating memory edge:', error);
      throw error;
    }
  }

  /**
   * Search memory nodes using hybrid approach (semantic + keyword + graph)
   */
  async searchMemory(
    query: string, 
    context: MemoryContext,
    options: {
      limit?: number;
      threshold?: number;
      searchType?: 'semantic' | 'keyword' | 'hybrid' | 'graph_traversal';
      filters?: any;
    } = {}
  ): Promise<SearchResult[]> {
    const { limit = 10, threshold = 0.7, searchType = 'hybrid', filters = {} } = options;
    const startTime = Date.now();

    try {
      let results: SearchResult[] = [];

      if (searchType === 'semantic' || searchType === 'hybrid') {
        results = await this.performSemanticSearch(query, context, { limit, threshold });
      }

      if (searchType === 'keyword' || searchType === 'hybrid') {
        const keywordResults = await this.performKeywordSearch(query, context, { limit });
        results = this.mergeSearchResults(results, keywordResults);
      }

      if (searchType === 'graph_traversal') {
        results = await this.performGraphTraversalSearch(query, context, { limit });
      }

      // Apply filters
      results = this.applyFilters(results, filters);

      // Sort by relevance and score
      results.sort((a, b) => (b.score + b.relevance) - (a.score + a.relevance));

      // Log the search session
      await this.logSearchSession({
        query,
        searchType,
        filters,
        resultsReturned: results.length,
        topResultIds: results.slice(0, 5).map(r => r.node.nodeId),
        searchTime: Date.now() - startTime,
        userId: context.userId,
        userArchetype: context.userArchetype,
        contextType: context.taskType
      });

      return results.slice(0, limit);
    } catch (error) {
      console.error('Error searching memory:', error);
      throw error;
    }
  }

  /**
   * Get related nodes using graph traversal
   */
  async getRelatedNodes(nodeId: string, depth: number = 2, relationshipTypes?: string[]): Promise<MemoryNode[]> {
    try {
      let whereClause = or(
        eq(memoryEdges.sourceNodeId, nodeId),
        eq(memoryEdges.targetNodeId, nodeId)
      );

      if (relationshipTypes && relationshipTypes.length > 0) {
        whereClause = and(whereClause, inArray(memoryEdges.relationshipType, relationshipTypes));
      }

      const edges = await db.select().from(memoryEdges).where(whereClause);
      
      const relatedNodeIds = new Set<string>();
      edges.forEach(edge => {
        if (edge.sourceNodeId !== nodeId) relatedNodeIds.add(edge.sourceNodeId);
        if (edge.targetNodeId !== nodeId) relatedNodeIds.add(edge.targetNodeId);
      });

      if (relatedNodeIds.size === 0) return [];

      const relatedNodes = await db.select()
        .from(memoryNodes)
        .where(inArray(memoryNodes.nodeId, Array.from(relatedNodeIds)))
        .orderBy(desc(memoryNodes.qualityScore));

      return relatedNodes;
    } catch (error) {
      console.error('Error getting related nodes:', error);
      throw error;
    }
  }

  /**
   * Update node usage analytics
   */
  async trackNodeUsage(
    nodeId: string,
    usageType: string,
    context: MemoryContext,
    metrics: {
      retrievalTime?: number;
      relevanceScore?: number;
      userEngagement?: any;
      conversionImpact?: number;
    } = {}
  ): Promise<void> {
    try {
      // Update usage count and last used
      await db.update(memoryNodes)
        .set({
          usageCount: sql`${memoryNodes.usageCount} + 1`,
          lastUsed: new Date()
        })
        .where(eq(memoryNodes.nodeId, nodeId));

      // Log usage analytics
      await db.insert(memoryUsageAnalytics).values({
        nodeId,
        usageType,
        contextId: context.sessionId,
        retrievalTime: metrics.retrievalTime,
        relevanceScore: metrics.relevanceScore,
        userEngagement: metrics.userEngagement || {},
        conversionImpact: metrics.conversionImpact,
        userId: context.userId,
        sessionId: context.sessionId
      });

    } catch (error) {
      console.error('Error tracking node usage:', error);
    }
  }

  /**
   * Generate embeddings for text content
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      if (this.embeddingCache.has(text)) {
        return this.embeddingCache.get(text)!;
      }

      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "placeholder-key") {
        // Return mock embedding for development
        return Array(1536).fill(0).map(() => Math.random() - 0.5);
      }

      const response = await this.openai.embeddings.create({
        model: this.embeddingModel,
        input: text.substring(0, 8000) // Limit input length
      });

      const embedding = response.data[0].embedding;
      this.embeddingCache.set(text, embedding);
      
      return embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      // Return mock embedding on error
      return Array(1536).fill(0).map(() => Math.random() - 0.5);
    }
  }

  /**
   * Perform semantic search using embeddings
   */
  private async performSemanticSearch(
    query: string,
    context: MemoryContext,
    options: { limit: number; threshold: number }
  ): Promise<SearchResult[]> {
    try {
      const queryEmbedding = await this.generateEmbedding(query);
      
      // For production, this would use a vector database like ChromaDB or Weaviate
      // For now, we'll use a simplified approach with PostgreSQL
      const nodes = await db.select()
        .from(memoryNodes)
        .where(eq(memoryNodes.status, 'active'))
        .orderBy(desc(memoryNodes.qualityScore))
        .limit(100); // Pre-filter for performance

      const results: SearchResult[] = [];

      for (const node of nodes) {
        if (!node.embedding) continue;

        try {
          const nodeEmbedding = JSON.parse(node.embedding as string);
          const similarity = this.cosineSimilarity(queryEmbedding, nodeEmbedding);
          
          if (similarity >= options.threshold) {
            results.push({
              node,
              score: similarity,
              relevance: this.calculateRelevance(node, context)
            });
          }
        } catch (embeddingError) {
          console.warn(`Invalid embedding for node ${node.nodeId}`);
          continue;
        }
      }

      return results.sort((a, b) => b.score - a.score).slice(0, options.limit);
    } catch (error) {
      console.error('Error in semantic search:', error);
      return [];
    }
  }

  /**
   * Perform keyword-based search
   */
  private async performKeywordSearch(
    query: string,
    context: MemoryContext,
    options: { limit: number }
  ): Promise<SearchResult[]> {
    try {
      const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
      
      const nodes = await db.select()
        .from(memoryNodes)
        .where(
          and(
            eq(memoryNodes.status, 'active'),
            or(
              like(memoryNodes.title, `%${query}%`),
              like(memoryNodes.content, `%${query}%`),
              like(memoryNodes.summary, `%${query}%`)
            )
          )
        )
        .orderBy(desc(memoryNodes.qualityScore))
        .limit(options.limit);

      return nodes.map(node => ({
        node,
        score: this.calculateKeywordScore(node, searchTerms),
        relevance: this.calculateRelevance(node, context)
      }));
    } catch (error) {
      console.error('Error in keyword search:', error);
      return [];
    }
  }

  /**
   * Perform graph traversal search
   */
  private async performGraphTraversalSearch(
    query: string,
    context: MemoryContext,
    options: { limit: number }
  ): Promise<SearchResult[]> {
    // This would implement graph-based search using relationships
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Calculate relevance score based on context
   */
  private calculateRelevance(node: MemoryNode, context: MemoryContext): number {
    let relevance = 0.5; // Base relevance

    // User archetype matching
    if (context.userArchetype && node.userArchetype === context.userArchetype) {
      relevance += 0.2;
    }

    // Recency bonus
    const daysSinceCreated = (Date.now() - new Date(node.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreated < 7) relevance += 0.1;
    else if (daysSinceCreated < 30) relevance += 0.05;

    // Quality and usage bonus
    relevance += (node.qualityScore - 0.5) * 0.2;
    relevance += Math.min(node.usageCount / 100, 0.1);

    return Math.min(Math.max(relevance, 0), 1);
  }

  /**
   * Calculate keyword matching score
   */
  private calculateKeywordScore(node: MemoryNode, searchTerms: string[]): number {
    const content = `${node.title} ${node.content} ${node.summary || ''}`.toLowerCase();
    let score = 0;

    for (const term of searchTerms) {
      const occurrences = (content.match(new RegExp(term, 'g')) || []).length;
      score += occurrences * (term.length / 100); // Longer terms get higher weight
    }

    return Math.min(score, 1);
  }

  /**
   * Merge search results from different methods
   */
  private mergeSearchResults(results1: SearchResult[], results2: SearchResult[]): SearchResult[] {
    const merged = new Map<string, SearchResult>();

    // Add results from first set
    for (const result of results1) {
      merged.set(result.node.nodeId, result);
    }

    // Merge or add results from second set
    for (const result of results2) {
      const existing = merged.get(result.node.nodeId);
      if (existing) {
        // Combine scores
        existing.score = Math.max(existing.score, result.score);
        existing.relevance = Math.max(existing.relevance, result.relevance);
      } else {
        merged.set(result.node.nodeId, result);
      }
    }

    return Array.from(merged.values());
  }

  /**
   * Apply filters to search results
   */
  private applyFilters(results: SearchResult[], filters: any): SearchResult[] {
    return results.filter(result => {
      const node = result.node;

      if (filters.nodeType && node.nodeType !== filters.nodeType) return false;
      if (filters.userArchetype && node.userArchetype !== filters.userArchetype) return false;
      if (filters.minQuality && node.qualityScore < filters.minQuality) return false;
      if (filters.dateRange) {
        const nodeDate = new Date(node.createdAt);
        if (filters.dateRange.start && nodeDate < new Date(filters.dateRange.start)) return false;
        if (filters.dateRange.end && nodeDate > new Date(filters.dateRange.end)) return false;
      }

      return true;
    });
  }

  /**
   * Extract keywords from content
   */
  private async extractKeywords(content: string): Promise<string[]> {
    // Simple keyword extraction - in production, use NLP library
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !this.isStopWord(word));

    // Count frequency and return top keywords
    const frequency: { [key: string]: number } = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Extract named entities from content
   */
  private async extractEntities(content: string): Promise<string[]> {
    // Simple entity extraction - in production, use NER model
    const entities: string[] = [];
    
    // Extract capitalized words (potential entities)
    const capitalizedWords = content.match(/\b[A-Z][a-zA-Z]+/g) || [];
    entities.push(...capitalizedWords.slice(0, 10));

    return [...new Set(entities)]; // Remove duplicates
  }

  /**
   * Check if word is a stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'
    ]);
    return stopWords.has(word.toLowerCase());
  }

  /**
   * Calculate initial quality score for new nodes
   */
  private calculateInitialQualityScore(nodeData: any): number {
    let score = 0.5; // Base score

    // Content length bonus
    if (nodeData.content && nodeData.content.length > 500) score += 0.1;
    if (nodeData.content && nodeData.content.length > 1000) score += 0.1;

    // Source type bonus
    if (nodeData.sourceType === 'verified') score += 0.2;
    else if (nodeData.sourceType === 'manual') score += 0.1;

    // Has summary bonus
    if (nodeData.summary) score += 0.1;

    return Math.min(Math.max(score, 0), 1);
  }

  /**
   * Log graph version changes
   */
  private async logGraphVersion(versionData: any): Promise<void> {
    try {
      await db.insert(knowledgeGraphVersions).values({
        nodeId: versionData.nodeId,
        changeType: versionData.changeType,
        previousData: versionData.previousData || null,
        newData: versionData.newData,
        diff: versionData.diff || {},
        changeReason: versionData.changeReason,
        changeSource: versionData.changeSource,
        changedBy: versionData.changedBy,
        approvalStatus: 'approved' // Auto-approve for now
      });
    } catch (error) {
      console.error('Error logging graph version:', error);
    }
  }

  /**
   * Log search sessions
   */
  private async logSearchSession(sessionData: any): Promise<void> {
    try {
      await db.insert(memorySearchSessions).values(sessionData);
    } catch (error) {
      console.error('Error logging search session:', error);
    }
  }

  /**
   * Update node quality scores based on usage and feedback
   */
  async updateQualityScores(): Promise<void> {
    try {
      console.log('🔍 Updating memory node quality scores...');

      const nodes = await db.select().from(memoryNodes);

      for (const node of nodes) {
        const newScore = await this.calculateUpdatedQualityScore(node);
        
        if (Math.abs(newScore - node.qualityScore) > 0.05) {
          await db.update(memoryNodes)
            .set({ qualityScore: newScore })
            .where(eq(memoryNodes.id, node.id));
        }
      }

      console.log(`✅ Updated quality scores for ${nodes.length} memory nodes`);
    } catch (error) {
      console.error('Error updating quality scores:', error);
    }
  }

  /**
   * Calculate updated quality score based on usage analytics
   */
  private async calculateUpdatedQualityScore(node: MemoryNode): Promise<number> {
    // Get usage analytics for this node
    const analytics = await db.select()
      .from(memoryUsageAnalytics)
      .where(eq(memoryUsageAnalytics.nodeId, node.nodeId))
      .orderBy(desc(memoryUsageAnalytics.timestamp))
      .limit(100);

    let score = node.qualityScore;

    // Usage frequency factor
    const recentUsage = analytics.filter(a => 
      new Date(a.timestamp).getTime() > Date.now() - (30 * 24 * 60 * 60 * 1000)
    ).length;
    
    if (recentUsage > 10) score += 0.1;
    else if (recentUsage < 2) score -= 0.05;

    // User engagement factor
    const avgEngagement = analytics.reduce((sum, a) => {
      const engagement = a.userEngagement as any;
      return sum + (engagement?.rating || 0.5);
    }, 0) / Math.max(analytics.length, 1);

    score += (avgEngagement - 0.5) * 0.2;

    // Conversion impact factor
    const avgConversion = analytics.reduce((sum, a) => 
      sum + (a.conversionImpact || 0), 0) / Math.max(analytics.length, 1);
    
    score += avgConversion * 0.3;

    // Age factor (newer content gets slight bonus)
    const daysSinceCreated = (Date.now() - new Date(node.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreated > 365) score -= 0.1;

    return Math.min(Math.max(score, 0), 1);
  }
}

export const knowledgeMemoryGraph = new KnowledgeMemoryGraph();