import { z } from "zod";
import { db } from "../../db";
import { eq, and, or, sql, desc, asc, inArray, gt, lt, isNull, isNotNull } from "drizzle-orm";
import {
  semanticNodes,
  semanticEdges,
  userIntentVectors,
  vectorSimilarityIndex,
  semanticSearchQueries,
  realtimeRecommendations,
  graphAnalytics,
  type SemanticNode,
  type SemanticEdge,
  type UserIntentVector,
} from "@shared/semanticTables";
import { vectorEngine } from "./vectorEngine";
import { vectorDatabaseManager } from "./vectorDatabaseAdapter";
import { llmIntegration } from "../ai-ml/llmIntegration";

/**
 * Intent Graph Engine - Advanced semantic understanding and intent mapping
 * Creates and maintains a dynamic graph of user intents, content relationships,
 * and semantic connections that evolve based on user behavior and AI analysis.
 */

export interface IntentCluster {
  id: string;
  name: string;
  centroid: number[];
  nodes: string[];
  keywords: string[];
  weight: number;
  lastUpdated: Date;
}

export interface JourneyPath {
  from: string;
  to: string;
  weight: number;
  frequency: number;
  conversionRate: number;
  averageTime: number;
  metadata: Record<string, any>;
}

export interface IntentMapping {
  userId?: string;
  sessionId?: string;
  currentIntent: string;
  intentHistory: string[];
  confidenceScores: Record<string, number>;
  nextPredictions: Array<{ intent: string; probability: number }>;
  recommendations: string[];
}

export class IntentGraphEngine {
  private initialized = false;
  private intentClusters = new Map<string, IntentCluster>();
  private journeyPaths = new Map<string, JourneyPath>();
  private intentMappings = new Map<string, IntentMapping>();
  private clusteringThreshold = 0.7;
  private pathAnalysisWindow = 86400000; // 24 hours

  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log("🎯 Initializing Intent Graph Engine...");
    
    try {
      // Initialize vector database manager
      await vectorDatabaseManager.initialize();
      
      // Load existing intent clusters
      await this.loadIntentClusters();
      
      // Load journey patterns
      await this.loadJourneyPatterns();
      
      // Start background analysis
      this.startBackgroundAnalysis();
      
      this.initialized = true;
      console.log("✅ Intent Graph Engine initialized successfully");
      
    } catch (error) {
      console.error("❌ Intent Graph Engine initialization failed:", error);
      throw error;
    }
  }

  /**
   * INTENT ANALYSIS OPERATIONS
   */
  async analyzeUserIntent(
    identifier: { userId?: string; sessionId?: string; fingerprint?: string },
    content: string,
    context?: Record<string, any>
  ): Promise<IntentMapping> {
    try {
      const cacheKey = this.getUserCacheKey(identifier);
      
      // Generate content embedding
      const contentVector = await vectorEngine.generateEmbedding(content);
      
      // Classify intent using clustering
      const currentIntent = await this.classifyIntent(contentVector, content);
      
      // Get or create user intent mapping
      let mapping = this.intentMappings.get(cacheKey);
      if (!mapping) {
        mapping = {
          userId: identifier.userId,
          sessionId: identifier.sessionId,
          currentIntent,
          intentHistory: [currentIntent],
          confidenceScores: {},
          nextPredictions: [],
          recommendations: [],
        };
      } else {
        // Update intent history
        if (mapping.currentIntent !== currentIntent) {
          mapping.intentHistory.push(currentIntent);
          mapping.currentIntent = currentIntent;
          
          // Keep history manageable
          if (mapping.intentHistory.length > 20) {
            mapping.intentHistory = mapping.intentHistory.slice(-20);
          }
        }
      }
      
      // Calculate confidence scores
      mapping.confidenceScores = await this.calculateIntentConfidence(contentVector);
      
      // Predict next intents
      mapping.nextPredictions = await this.predictNextIntents(mapping.intentHistory);
      
      // Generate recommendations
      mapping.recommendations = await this.generateIntentRecommendations(
        mapping.currentIntent,
        mapping.intentHistory,
        context
      );
      
      // Cache the mapping
      this.intentMappings.set(cacheKey, mapping);
      
      // Update journey tracking
      await this.trackJourneyPath(mapping.intentHistory);
      
      return mapping;
      
    } catch (error) {
      console.error("Error analyzing user intent:", error);
      throw new Error("Failed to analyze user intent");
    }
  }

  async classifyIntent(contentVector: number[], content: string): Promise<string> {
    try {
      // Find the closest intent cluster
      let bestMatch = 'unknown';
      let highestSimilarity = 0;
      
      for (const [clusterId, cluster] of this.intentClusters) {
        const similarity = vectorEngine.cosineSimilarity(contentVector, cluster.centroid);
        
        if (similarity > highestSimilarity && similarity > this.clusteringThreshold) {
          highestSimilarity = similarity;
          bestMatch = clusterId;
        }
      }
      
      // If no good match found, create new cluster
      if (bestMatch === 'unknown' && highestSimilarity < this.clusteringThreshold) {
        bestMatch = await this.createNewIntentCluster(contentVector, content);
      }
      
      return bestMatch;
      
    } catch (error) {
      console.error("Error classifying intent:", error);
      return 'unknown';
    }
  }

  async createNewIntentCluster(centroid: number[], content: string): Promise<string> {
    try {
      // Generate cluster name using LLM
      const clusterName = await this.generateClusterName(content);
      const clusterId = `intent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Extract keywords
      const keywords = await this.extractKeywords(content);
      
      const cluster: IntentCluster = {
        id: clusterId,
        name: clusterName,
        centroid,
        nodes: [],
        keywords,
        weight: 1.0,
        lastUpdated: new Date(),
      };
      
      this.intentClusters.set(clusterId, cluster);
      
      // Store in vector database
      await vectorDatabaseManager.upsertVector(clusterId, centroid, {
        type: 'intent_cluster',
        name: clusterName,
        keywords,
        weight: 1.0,
      });
      
      console.log(`🎯 Created new intent cluster: ${clusterName} (${clusterId})`);
      return clusterId;
      
    } catch (error) {
      console.error("Error creating new intent cluster:", error);
      return 'unknown';
    }
  }

  async calculateIntentConfidence(contentVector: number[]): Promise<Record<string, number>> {
    const confidenceScores: Record<string, number> = {};
    
    for (const [clusterId, cluster] of this.intentClusters) {
      const similarity = vectorEngine.cosineSimilarity(contentVector, cluster.centroid);
      confidenceScores[clusterId] = Math.max(0, similarity);
    }
    
    return confidenceScores;
  }

  async predictNextIntents(intentHistory: string[]): Promise<Array<{ intent: string; probability: number }>> {
    try {
      const predictions: Array<{ intent: string; probability: number }> = [];
      
      if (intentHistory.length < 2) {
        return predictions;
      }
      
      // Analyze journey patterns to predict next likely intents
      const recentIntents = intentHistory.slice(-3); // Last 3 intents
      const pathCounts = new Map<string, number>();
      
      // Count transitions from recent intent patterns
      for (const [pathKey, path] of this.journeyPaths) {
        if (pathKey.includes(recentIntents[recentIntents.length - 1])) {
          pathCounts.set(path.to, (pathCounts.get(path.to) || 0) + path.frequency);
        }
      }
      
      // Convert to probabilities
      const totalCount = Array.from(pathCounts.values()).reduce((sum, count) => sum + count, 0);
      
      for (const [intent, count] of pathCounts) {
        predictions.push({
          intent,
          probability: count / totalCount,
        });
      }
      
      // Sort by probability
      return predictions
        .sort((a, b) => b.probability - a.probability)
        .slice(0, 5);
      
    } catch (error) {
      console.error("Error predicting next intents:", error);
      return [];
    }
  }

  async generateIntentRecommendations(
    currentIntent: string,
    intentHistory: string[],
    context?: Record<string, any>
  ): Promise<string[]> {
    try {
      const recommendations: string[] = [];
      
      // Get semantic nodes related to current intent
      const relatedNodes = await db.select()
        .from(semanticNodes)
        .where(sql`${semanticNodes.intentProfileTags}::text LIKE '%${currentIntent}%'`)
        .limit(10);
      
      // Add nodes based on successful journey patterns
      for (const node of relatedNodes) {
        const journeyKey = `${currentIntent}_to_${node.slug}`;
        const journey = this.journeyPaths.get(journeyKey);
        
        if (journey && journey.conversionRate > 0.1) { // 10% minimum conversion rate
          recommendations.push(node.slug);
        }
      }
      
      // Add personalized recommendations based on intent clusters
      const cluster = this.intentClusters.get(currentIntent);
      if (cluster) {
        recommendations.push(...cluster.nodes.slice(0, 3));
      }
      
      return [...new Set(recommendations)].slice(0, 10);
      
    } catch (error) {
      console.error("Error generating intent recommendations:", error);
      return [];
    }
  }

  /**
   * JOURNEY TRACKING OPERATIONS
   */
  async trackJourneyPath(intentHistory: string[]): Promise<void> {
    if (intentHistory.length < 2) return;
    
    try {
      // Track transitions between recent intents
      for (let i = 1; i < intentHistory.length; i++) {
        const from = intentHistory[i - 1];
        const to = intentHistory[i];
        const pathKey = `${from}_to_${to}`;
        
        let path = this.journeyPaths.get(pathKey);
        if (!path) {
          path = {
            from,
            to,
            weight: 1.0,
            frequency: 1,
            conversionRate: 0,
            averageTime: 0,
            metadata: {},
          };
        } else {
          path.frequency += 1;
          path.weight += 0.1;
        }
        
        this.journeyPaths.set(pathKey, path);
      }
      
    } catch (error) {
      console.error("Error tracking journey path:", error);
    }
  }

  async updateJourneyMetrics(
    from: string,
    to: string,
    conversionOccurred: boolean,
    timeSpent: number
  ): Promise<void> {
    try {
      const pathKey = `${from}_to_${to}`;
      const path = this.journeyPaths.get(pathKey);
      
      if (path) {
        // Update conversion rate
        const totalConversions = path.conversionRate * path.frequency;
        const newConversions = conversionOccurred ? totalConversions + 1 : totalConversions;
        path.conversionRate = newConversions / path.frequency;
        
        // Update average time
        path.averageTime = (path.averageTime + timeSpent) / 2;
        
        this.journeyPaths.set(pathKey, path);
      }
      
    } catch (error) {
      console.error("Error updating journey metrics:", error);
    }
  }

  /**
   * CLUSTER MANAGEMENT OPERATIONS
   */
  async updateIntentClusters(): Promise<void> {
    try {
      console.log("🔄 Updating intent clusters...");
      
      // Recalculate cluster centroids based on recent data
      for (const [clusterId, cluster] of this.intentClusters) {
        if (cluster.nodes.length > 0) {
          const vectors: number[][] = [];
          
          // Get vectors for all nodes in cluster
          for (const nodeSlug of cluster.nodes) {
            const vectorResult = await vectorDatabaseManager.getVector(nodeSlug);
            if (vectorResult && vectorResult.vector) {
              vectors.push(vectorResult.vector);
            }
          }
          
          // Calculate new centroid
          if (vectors.length > 0) {
            const newCentroid = this.calculateCentroid(vectors);
            cluster.centroid = newCentroid;
            cluster.lastUpdated = new Date();
            
            // Update in vector database
            await vectorDatabaseManager.upsertVector(clusterId, newCentroid, {
              type: 'intent_cluster',
              name: cluster.name,
              keywords: cluster.keywords,
              weight: cluster.weight,
            });
          }
        }
      }
      
      console.log(`✅ Updated ${this.intentClusters.size} intent clusters`);
      
    } catch (error) {
      console.error("Error updating intent clusters:", error);
    }
  }

  private calculateCentroid(vectors: number[][]): number[] {
    if (vectors.length === 0) return [];
    
    const dimensions = vectors[0].length;
    const centroid = new Array(dimensions).fill(0);
    
    for (const vector of vectors) {
      for (let i = 0; i < dimensions; i++) {
        centroid[i] += vector[i];
      }
    }
    
    // Average
    for (let i = 0; i < dimensions; i++) {
      centroid[i] /= vectors.length;
    }
    
    return centroid;
  }

  /**
   * AUTO-MAPPING OPERATIONS
   */
  async autoMapContentToIntents(): Promise<void> {
    try {
      console.log("🎯 Auto-mapping content to intents...");
      
      // Get all active semantic nodes
      const nodes = await db.select()
        .from(semanticNodes)
        .where(eq(semanticNodes.status, 'active'))
        .limit(1000);
      
      for (const node of nodes) {
        if (node.vectorEmbedding && node.vectorEmbedding.length > 0) {
          const intent = await this.classifyIntent(
            node.vectorEmbedding as number[],
            `${node.title} ${node.description || ''}`
          );
          
          // Update node's intent profile tags
          const currentTags = (node.intentProfileTags as string[]) || [];
          if (!currentTags.includes(intent)) {
            currentTags.push(intent);
            
            await db.update(semanticNodes)
              .set({
                intentProfileTags: currentTags,
                lastOptimized: new Date(),
              })
              .where(eq(semanticNodes.id, node.id));
          }
          
          // Add node to intent cluster
          const cluster = this.intentClusters.get(intent);
          if (cluster && !cluster.nodes.includes(node.slug)) {
            cluster.nodes.push(node.slug);
            this.intentClusters.set(intent, cluster);
          }
        }
      }
      
      console.log(`✅ Auto-mapped ${nodes.length} content items to intents`);
      
    } catch (error) {
      console.error("Error auto-mapping content to intents:", error);
    }
  }

  /**
   * UTILITY OPERATIONS
   */
  private async loadIntentClusters(): Promise<void> {
    try {
      // Load existing clusters from vector database
      const clusterResults = await vectorDatabaseManager.searchSimilar(
        new Array(512).fill(0), // Dummy vector for search
        1000, // Get all clusters
        0 // No threshold
      );
      
      for (const result of clusterResults) {
        if (result.metadata?.type === 'intent_cluster') {
          const cluster: IntentCluster = {
            id: result.id,
            name: result.metadata.name || result.id,
            centroid: result.vector || [],
            nodes: result.metadata.nodes || [],
            keywords: result.metadata.keywords || [],
            weight: result.metadata.weight || 1.0,
            lastUpdated: new Date(result.metadata.lastUpdated || Date.now()),
          };
          
          this.intentClusters.set(result.id, cluster);
        }
      }
      
      console.log(`📊 Loaded ${this.intentClusters.size} intent clusters`);
      
    } catch (error) {
      console.warn("Could not load existing intent clusters:", error);
    }
  }

  private async loadJourneyPatterns(): Promise<void> {
    try {
      // Load journey patterns from analytics data
      const journeyData = await db.select()
        .from(graphAnalytics)
        .where(eq(graphAnalytics.metricType, 'journey_transition'))
        .limit(10000);
      
      for (const data of journeyData) {
        const metadata = data.metadata as any;
        if (metadata?.from && metadata?.to) {
          const pathKey = `${metadata.from}_to_${metadata.to}`;
          
          const path: JourneyPath = {
            from: metadata.from,
            to: metadata.to,
            weight: data.value,
            frequency: metadata.frequency || 1,
            conversionRate: metadata.conversionRate || 0,
            averageTime: metadata.averageTime || 0,
            metadata: metadata,
          };
          
          this.journeyPaths.set(pathKey, path);
        }
      }
      
      console.log(`🛤️ Loaded ${this.journeyPaths.size} journey patterns`);
      
    } catch (error) {
      console.warn("Could not load journey patterns:", error);
    }
  }

  private startBackgroundAnalysis(): void {
    // Update clusters every 30 minutes
    setInterval(() => this.updateIntentClusters(), 1800000);
    
    // Auto-map content every hour
    setInterval(() => this.autoMapContentToIntents(), 3600000);
    
    // Clean old mappings every 6 hours
    setInterval(() => this.cleanOldMappings(), 21600000);
    
    console.log("🔄 Background intent analysis started");
  }

  private async cleanOldMappings(): Promise<void> {
    const cutoffTime = Date.now() - this.pathAnalysisWindow;
    let cleanedCount = 0;
    
    for (const [key, mapping] of this.intentMappings) {
      // Remove mappings older than analysis window
      if (!mapping.userId) { // Only clean session-based mappings
        this.intentMappings.delete(key);
        cleanedCount++;
      }
    }
    
    console.log(`🧹 Cleaned ${cleanedCount} old intent mappings`);
  }

  private getUserCacheKey(identifier: { userId?: string; sessionId?: string; fingerprint?: string }): string {
    return identifier.userId || identifier.sessionId || identifier.fingerprint || 'anonymous';
  }

  private async generateClusterName(content: string): Promise<string> {
    try {
      const response = await llmIntegration.generateCompletion(
        `Analyze this content and provide a concise 2-3 word intent label: "${content.slice(0, 200)}"`
      );
      
      return response.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_') || 'unknown_intent';
      
    } catch (error) {
      console.warn("Could not generate cluster name with LLM:", error);
      return `intent_${Date.now()}`;
    }
  }

  private async extractKeywords(content: string): Promise<string[]> {
    try {
      const response = await llmIntegration.generateCompletion(
        `Extract 5-10 key terms from this content: "${content.slice(0, 300)}"`
      );
      
      return response
        .split(/[,\n]/)
        .map(term => term.trim().toLowerCase())
        .filter(term => term.length > 2)
        .slice(0, 10);
      
    } catch (error) {
      console.warn("Could not extract keywords with LLM:", error);
      return [];
    }
  }

  /**
   * PUBLIC API
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  getIntentClusters(): Map<string, IntentCluster> {
    return this.intentClusters;
  }

  getJourneyPaths(): Map<string, JourneyPath> {
    return this.journeyPaths;
  }

  async getUserIntent(identifier: { userId?: string; sessionId?: string; fingerprint?: string }): Promise<IntentMapping | null> {
    const cacheKey = this.getUserCacheKey(identifier);
    return this.intentMappings.get(cacheKey) || null;
  }

  async getIntentClusterInfo(clusterId: string): Promise<IntentCluster | null> {
    return this.intentClusters.get(clusterId) || null;
  }

  async getSystemStats(): Promise<any> {
    return {
      initialized: this.initialized,
      intentClusters: this.intentClusters.size,
      journeyPaths: this.journeyPaths.size,
      activeMappings: this.intentMappings.size,
      clusteringThreshold: this.clusteringThreshold,
      vectorDatabase: await vectorDatabaseManager.getStatus(),
    };
  }
}

// Singleton instance
export const intentGraphEngine = new IntentGraphEngine();

// Validation schemas
export const analyzeIntentSchema = z.object({
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  fingerprint: z.string().optional(),
  content: z.string().min(1).max(5000),
  context: z.record(z.any()).optional(),
});

export const updateJourneySchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  conversionOccurred: z.boolean(),
  timeSpent: z.number().min(0),
});