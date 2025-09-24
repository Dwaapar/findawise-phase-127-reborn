import { db } from "../../db";
import { eq, and, or, sql, desc, asc, inArray, gt, lt, isNull } from "drizzle-orm";
import {
  userIntentVectors,
  realtimeRecommendations,
  semanticNodes,
  semanticEdges,
  type UserIntentVector,
  type InsertUserIntentVector,
  type RealtimeRecommendation,
  type InsertRealtimeRecommendation,
  type SemanticNode,
} from "@shared/semanticTables";
import { userSessions, behaviorEvents } from "@shared/schema";
import { vectorEngine } from "./vectorEngine";
import { semanticGraphEngine } from "./semanticGraphEngine";

/**
 * Real-Time Personalization Engine - User-aware content and experience optimization
 * Continuously learns from user behavior and adapts recommendations in real-time
 */
export class PersonalizationEngine {
  private initialized = false;
  private userVectorCache = new Map<string, { vector: number[]; lastUpdated: number }>();
  private readonly vectorDecayRate = 0.1;
  private readonly cacheTimeout = 1000 * 60 * 15; // 15 minutes

  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log("🎯 Initializing Real-Time Personalization Engine...");
    
    // Start background processes
    this.startPeriodicVectorDecay();
    this.startRecommendationCleanup();
    
    this.initialized = true;
    console.log("✅ Real-Time Personalization Engine initialized successfully");
  }

  /**
   * USER INTENT VECTOR MANAGEMENT
   */
  async updateUserIntentVector(
    identifier: { userId?: string; sessionId?: string; fingerprint?: string },
    behaviors: any[],
    context?: any
  ): Promise<UserIntentVector> {
    try {
      const { userId, sessionId, fingerprint } = identifier;
      
      if (!sessionId && !userId && !fingerprint) {
        throw new Error("At least one identifier is required");
      }

      // Get or create user intent vector
      let userVector = await this.getUserIntentVector(identifier);
      
      if (!userVector) {
        userVector = await this.createUserIntentVector(identifier, behaviors, context);
      } else {
        userVector = await this.updateExistingVector(userVector, behaviors, context);
      }
      
      // Update cache
      const cacheKey = this.getCacheKey(identifier);
      this.userVectorCache.set(cacheKey, {
        vector: userVector.intentVector as number[],
        lastUpdated: Date.now()
      });
      
      // Generate real-time recommendations
      await this.generateRealtimeRecommendations(userVector);
      
      return userVector;

    } catch (error) {
      console.error("Error updating user intent vector:", error);
      throw new Error("Failed to update user intent vector");
    }
  }

  async getUserIntentVector(
    identifier: { userId?: string; sessionId?: string; fingerprint?: string }
  ): Promise<UserIntentVector | null> {
    try {
      const { userId, sessionId, fingerprint } = identifier;
      
      let query = db.select().from(userIntentVectors).limit(1);
      
      if (userId) {
        query = query.where(eq(userIntentVectors.userId, userId));
      } else if (sessionId) {
        query = query.where(eq(userIntentVectors.sessionId, sessionId));
      } else if (fingerprint) {
        query = query.where(eq(userIntentVectors.fingerprint, fingerprint));
      }
      
      const result = await query;
      return result[0] || null;

    } catch (error) {
      console.error("Error getting user intent vector:", error);
      return null;
    }
  }

  private async createUserIntentVector(
    identifier: { userId?: string; sessionId?: string; fingerprint?: string },
    behaviors: any[],
    context?: any
  ): Promise<UserIntentVector> {
    const intentVector = await this.calculateIntentVector(behaviors, context);
    const intentTags = this.extractIntentTags(behaviors, context);
    const archetype = await this.determineArchetype(intentVector, behaviors);

    const vectorData: InsertUserIntentVector = {
      userId: identifier.userId,
      sessionId: identifier.sessionId,
      fingerprint: identifier.fingerprint,
      intentVector: intentVector,
      currentArchetype: archetype,
      intentTags: intentTags,
      behaviors: behaviors,
      preferences: context?.preferences || {},
      interactionHistory: behaviors.slice(-10), // Keep last 10 interactions
      strength: 1.0,
      lastActivity: new Date(),
      neuronAffinities: {},
      verticalPreferences: {}
    };

    const [userVector] = await db.insert(userIntentVectors).values(vectorData).returning();
    return userVector;
  }

  private async updateExistingVector(
    existingVector: UserIntentVector,
    newBehaviors: any[],
    context?: any
  ): Promise<UserIntentVector> {
    const currentVector = existingVector.intentVector as number[];
    const newVector = await this.calculateIntentVector(newBehaviors, context);
    
    // Blend existing and new vectors with decay
    const blendedVector = this.blendVectors(currentVector, newVector, 0.3); // 30% new, 70% existing
    
    const updatedTags = this.extractIntentTags(newBehaviors, context);
    const existingTags = existingVector.intentTags as string[] || [];
    const mergedTags = [...new Set([...existingTags, ...updatedTags])].slice(0, 10);
    
    const updatedBehaviors = [...(existingVector.behaviors as any[] || []), ...newBehaviors].slice(-50);
    const updatedHistory = [...(existingVector.interactionHistory as any[] || []), ...newBehaviors].slice(-20);
    
    // Update archetype if significant change
    const newArchetype = await this.determineArchetype(blendedVector, updatedBehaviors);

    const [updatedVector] = await db.update(userIntentVectors)
      .set({
        intentVector: blendedVector,
        currentArchetype: newArchetype,
        intentTags: mergedTags,
        behaviors: updatedBehaviors,
        interactionHistory: updatedHistory,
        lastActivity: new Date(),
        strength: Math.min(existingVector.strength + 0.1, 2.0), // Cap at 2.0
        preferences: { ...existingVector.preferences, ...context?.preferences }
      })
      .where(eq(userIntentVectors.id, existingVector.id))
      .returning();

    return updatedVector;
  }

  /**
   * REAL-TIME RECOMMENDATIONS
   */
  async generateRealtimeRecommendations(userVector: UserIntentVector): Promise<RealtimeRecommendation[]> {
    try {
      const intentVector = userVector.intentVector as number[];
      const intentTags = userVector.intentTags as string[] || [];
      
      // Get candidate nodes for recommendations
      const candidates = await this.getCandidateNodes(userVector, intentTags);
      
      // Score and rank candidates
      const scoredCandidates = await this.scoreRecommendationCandidates(intentVector, candidates, userVector);
      
      // Generate recommendations
      const recommendations: InsertRealtimeRecommendation[] = scoredCandidates
        .slice(0, 20) // Top 20 recommendations
        .map((candidate, index) => ({
          userId: userVector.userId,
          sessionId: userVector.sessionId,
          fingerprint: userVector.fingerprint,
          nodeId: candidate.node.id,
          recommendationType: this.getRecommendationType(candidate.node.nodeType),
          score: candidate.score,
          reason: candidate.reason,
          context: {
            archetype: userVector.currentArchetype,
            intentTags: intentTags,
            similarityScore: candidate.similarity,
            behaviorMatch: candidate.behaviorMatch
          },
          position: index + 1,
          expiresAt: new Date(Date.now() + 1000 * 60 * 30), // 30 minutes
        }));

      // Clear old recommendations for this user
      await this.clearExpiredRecommendations(userVector);
      
      // Insert new recommendations
      const insertedRecommendations = await db.insert(realtimeRecommendations)
        .values(recommendations)
        .returning();

      console.log(`🎯 Generated ${insertedRecommendations.length} recommendations for user ${userVector.userId || userVector.sessionId}`);
      return insertedRecommendations;

    } catch (error) {
      console.error("Error generating real-time recommendations:", error);
      return [];
    }
  }

  async getRecommendationsForUser(
    identifier: { userId?: string; sessionId?: string; fingerprint?: string },
    options: {
      type?: string;
      limit?: number;
      minScore?: number;
    } = {}
  ): Promise<Array<RealtimeRecommendation & { node: SemanticNode }>> {
    try {
      const { type, limit = 10, minScore = 0.3 } = options;
      const { userId, sessionId, fingerprint } = identifier;

      let query = db.select({
        recommendation: realtimeRecommendations,
        node: semanticNodes
      })
        .from(realtimeRecommendations)
        .innerJoin(semanticNodes, eq(realtimeRecommendations.nodeId, semanticNodes.id))
        .where(and(
          gt(realtimeRecommendations.score, minScore),
          gt(realtimeRecommendations.expiresAt, new Date()),
          eq(realtimeRecommendations.isDisplayed, false)
        ))
        .orderBy(desc(realtimeRecommendations.score))
        .limit(limit);

      // Add identifier filters
      const identifierConditions = [];
      if (userId) identifierConditions.push(eq(realtimeRecommendations.userId, userId));
      if (sessionId) identifierConditions.push(eq(realtimeRecommendations.sessionId, sessionId));
      if (fingerprint) identifierConditions.push(eq(realtimeRecommendations.fingerprint, fingerprint));
      
      if (identifierConditions.length > 0) {
        query = query.where(and(
          gt(realtimeRecommendations.score, minScore),
          gt(realtimeRecommendations.expiresAt, new Date()),
          eq(realtimeRecommendations.isDisplayed, false),
          or(...identifierConditions)
        ));
      }

      if (type) {
        query = query.where(and(
          gt(realtimeRecommendations.score, minScore),
          gt(realtimeRecommendations.expiresAt, new Date()),
          eq(realtimeRecommendations.isDisplayed, false),
          eq(realtimeRecommendations.recommendationType, type),
          ...(identifierConditions.length > 0 ? [or(...identifierConditions)] : [])
        ));
      }

      const results = await query;
      
      return results.map(item => ({
        ...item.recommendation,
        node: item.node
      }));

    } catch (error) {
      console.error("Error getting recommendations for user:", error);
      return [];
    }
  }

  async markRecommendationDisplayed(recommendationId: number): Promise<void> {
    try {
      await db.update(realtimeRecommendations)
        .set({
          isDisplayed: true,
          displayedAt: new Date()
        })
        .where(eq(realtimeRecommendations.id, recommendationId));
    } catch (error) {
      console.error("Error marking recommendation as displayed:", error);
    }
  }

  async markRecommendationClicked(recommendationId: number): Promise<void> {
    try {
      await db.update(realtimeRecommendations)
        .set({
          isClicked: true,
          clickedAt: new Date()
        })
        .where(eq(realtimeRecommendations.id, recommendationId));
    } catch (error) {
      console.error("Error marking recommendation as clicked:", error);
    }
  }

  async markRecommendationConverted(recommendationId: number): Promise<void> {
    try {
      await db.update(realtimeRecommendations)
        .set({
          isConverted: true,
          convertedAt: new Date()
        })
        .where(eq(realtimeRecommendations.id, recommendationId));
    } catch (error) {
      console.error("Error marking recommendation as converted:", error);
    }
  }

  /**
   * PRIVATE HELPER METHODS
   */
  private async calculateIntentVector(behaviors: any[], context?: any): Promise<number[]> {
    try {
      // Extract text content from behaviors and context
      const textContent = behaviors
        .map(b => `${b.eventType || ''} ${b.pageSlug || ''} ${b.content || ''} ${JSON.stringify(b.eventData || {})}`)
        .join(' ') + (context?.content || '');

      if (!textContent.trim()) {
        // Return a neutral vector if no content
        return new Array(vectorEngine.getDimensions()).fill(0);
      }

      return await vectorEngine.generateEmbedding(textContent);
    } catch (error) {
      console.error("Error calculating intent vector:", error);
      return new Array(vectorEngine.getDimensions()).fill(0);
    }
  }

  private extractIntentTags(behaviors: any[], context?: any): string[] {
    const tags = new Set<string>();
    
    behaviors.forEach(behavior => {
      const eventType = behavior.eventType?.toLowerCase();
      const pageSlug = behavior.pageSlug?.toLowerCase();
      
      // Map event types to intent tags
      if (eventType?.includes('click')) tags.add('engage');
      if (eventType?.includes('scroll')) tags.add('explore');
      if (eventType?.includes('form')) tags.add('convert');
      if (eventType?.includes('quiz')) tags.add('learn');
      if (eventType?.includes('download')) tags.add('acquire');
      
      // Map page types to intent tags
      if (pageSlug?.includes('pricing')) tags.add('buy');
      if (pageSlug?.includes('demo')) tags.add('try');
      if (pageSlug?.includes('blog')) tags.add('learn');
      if (pageSlug?.includes('about')) tags.add('research');
      if (pageSlug?.includes('contact')) tags.add('connect');
    });
    
    // Add context-based tags
    if (context?.tags) {
      context.tags.forEach((tag: string) => tags.add(tag.toLowerCase()));
    }
    
    return Array.from(tags).slice(0, 8);
  }

  private async determineArchetype(intentVector: number[], behaviors: any[]): Promise<string> {
    try {
      // Simple archetype determination based on behavior patterns
      const behaviorCounts = behaviors.reduce((acc, b) => {
        const type = b.eventType || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const totalBehaviors = behaviors.length;
      
      if (behaviorCounts['quiz_completed'] > totalBehaviors * 0.3) {
        return 'learner';
      } else if (behaviorCounts['click_affiliate'] > totalBehaviors * 0.2) {
        return 'buyer';
      } else if (behaviorCounts['page_view'] > totalBehaviors * 0.5) {
        return 'explorer';
      } else if (behaviorCounts['form_submit'] > 0) {
        return 'converter';
      } else {
        return 'visitor';
      }
    } catch (error) {
      return 'visitor';
    }
  }

  private blendVectors(existing: number[], newVector: number[], newWeight: number): number[] {
    const existingWeight = 1 - newWeight;
    return existing.map((val, index) => 
      val * existingWeight + (newVector[index] || 0) * newWeight
    );
  }

  private async getCandidateNodes(userVector: UserIntentVector, intentTags: string[]): Promise<SemanticNode[]> {
    try {
      // Get nodes that match user's archetype and intent tags
      const nodes = await db.select()
        .from(semanticNodes)
        .where(and(
          eq(semanticNodes.status, 'active'),
          or(
            sql`${semanticNodes.intentProfileTags} ?| array[${intentTags.map(() => '?').join(',')}]`,
            sql`${semanticNodes.metadata}->>'archetype' = ${userVector.currentArchetype}`
          )
        ))
        .limit(100);

      return nodes;
    } catch (error) {
      console.error("Error getting candidate nodes:", error);
      // Fallback to recent high-performing nodes
      return await db.select()
        .from(semanticNodes)
        .where(eq(semanticNodes.status, 'active'))
        .orderBy(desc(semanticNodes.clickThroughRate))
        .limit(50);
    }
  }

  private async scoreRecommendationCandidates(
    intentVector: number[],
    candidates: SemanticNode[],
    userVector: UserIntentVector
  ): Promise<Array<{
    node: SemanticNode;
    score: number;
    similarity: number;
    behaviorMatch: number;
    reason: string;
  }>> {
    const scored = [];
    
    for (const candidate of candidates) {
      if (!candidate.vectorEmbedding) continue;
      
      const nodeVector = candidate.vectorEmbedding as number[];
      const similarity = vectorEngine.cosineSimilarity(intentVector, nodeVector);
      
      // Calculate behavior match score
      const behaviorMatch = this.calculateBehaviorMatch(userVector, candidate);
      
      // Calculate engagement score
      const engagementScore = (candidate.clickThroughRate || 0) * 0.1 + 
                             (candidate.conversionRate || 0) * 0.2 +
                             (candidate.engagement || 0) * 0.1;
      
      // Calculate recency score
      const recencyScore = this.calculateRecencyScore(candidate.lastOptimized);
      
      // Final composite score
      const score = similarity * 0.4 + 
                   behaviorMatch * 0.3 + 
                   engagementScore * 0.2 + 
                   recencyScore * 0.1;
      
      if (score > 0.2) { // Minimum threshold
        scored.push({
          node: candidate,
          score,
          similarity,
          behaviorMatch,
          reason: `${Math.round(similarity * 100)}% match, ${candidate.nodeType} content`
        });
      }
    }
    
    return scored.sort((a, b) => b.score - a.score);
  }

  private calculateBehaviorMatch(userVector: UserIntentVector, node: SemanticNode): number {
    const userTags = userVector.intentTags as string[] || [];
    const nodeTags = node.intentProfileTags as string[] || [];
    
    if (userTags.length === 0 || nodeTags.length === 0) return 0;
    
    const intersection = userTags.filter(tag => nodeTags.includes(tag));
    const union = [...new Set([...userTags, ...nodeTags])];
    
    return intersection.length / union.length;
  }

  private calculateRecencyScore(lastOptimized?: Date): number {
    if (!lastOptimized) return 0.5;
    
    const daysSinceOptimization = (Date.now() - lastOptimized.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, 1 - daysSinceOptimization / 30); // Decay over 30 days
  }

  private getRecommendationType(nodeType: string): string {
    const typeMap: Record<string, string> = {
      'page': 'content',
      'blog_post': 'content',
      'offer': 'offer',
      'quiz': 'quiz',
      'cta_block': 'cta',
      'neuron': 'neuron',
      'tool': 'tool'
    };
    
    return typeMap[nodeType] || 'content';
  }

  private getCacheKey(identifier: { userId?: string; sessionId?: string; fingerprint?: string }): string {
    return identifier.userId || identifier.sessionId || identifier.fingerprint || 'anonymous';
  }

  private async clearExpiredRecommendations(userVector: UserIntentVector): Promise<void> {
    try {
      const conditions = [];
      if (userVector.userId) conditions.push(eq(realtimeRecommendations.userId, userVector.userId));
      if (userVector.sessionId) conditions.push(eq(realtimeRecommendations.sessionId, userVector.sessionId));
      if (userVector.fingerprint) conditions.push(eq(realtimeRecommendations.fingerprint, userVector.fingerprint));
      
      if (conditions.length > 0) {
        await db.delete(realtimeRecommendations)
          .where(and(
            or(...conditions),
            eq(realtimeRecommendations.isDisplayed, false)
          ));
      }
    } catch (error) {
      console.error("Error clearing expired recommendations:", error);
    }
  }

  private startPeriodicVectorDecay(): void {
    // Decay user vectors every hour
    setInterval(async () => {
      try {
        await db.update(userIntentVectors)
          .set({
            strength: sql`GREATEST(${userIntentVectors.strength} * (1 - ${this.vectorDecayRate}), 0.1)`
          })
          .where(lt(userIntentVectors.lastActivity, new Date(Date.now() - 1000 * 60 * 60))); // 1 hour ago
      } catch (error) {
        console.error("Error in periodic vector decay:", error);
      }
    }, 1000 * 60 * 60); // Every hour
  }

  private startRecommendationCleanup(): void {
    // Clean up expired recommendations every 30 minutes
    setInterval(async () => {
      try {
        await db.delete(realtimeRecommendations)
          .where(lt(realtimeRecommendations.expiresAt, new Date()));
      } catch (error) {
        console.error("Error in recommendation cleanup:", error);
      }
    }, 1000 * 60 * 30); // Every 30 minutes
  }
}

// Singleton instance
export const personalizationEngine = new PersonalizationEngine();