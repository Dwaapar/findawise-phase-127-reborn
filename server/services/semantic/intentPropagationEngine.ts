import { db } from "../../db";
import { eq, and, or, sql, desc } from "drizzle-orm";
import { semanticNodes, semanticEdges, userIntentVectors, vectorSimilarityIndex } from "@shared/semanticTables";
import { llmIntegration } from "../ai-ml/llmIntegration";
import { vectorEngine } from "./vectorEngine";

/**
 * Intent Propagation Engine - Manages real-time intent flow through the graph
 */
export class IntentPropagationEngine {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    console.log("🔗 Initializing Intent Propagation Engine...");
    this.initialized = true;
    console.log("✅ Intent Propagation Engine initialized");
  }

  /**
   * Update edge weights based on user interactions and analytics
   */
  async updateEdgeWeights(): Promise<void> {
    console.log("📊 Updating edge weights based on analytics...");

    // Update weights based on click-through and conversion data
    await db.execute(sql`
      UPDATE semantic_edges 
      SET 
        weight = CASE 
          WHEN click_count = 0 THEN weight * 0.95  -- Decay unused edges
          ELSE LEAST(1.0, LOG(click_count + 1) / 10.0 + (conversion_count::float / GREATEST(click_count, 1)) * 0.5)
        END,
        updated_at = NOW()
      WHERE is_active = true
    `);

    // Update confidence based on user behavior patterns
    await db.execute(sql`
      UPDATE semantic_edges 
      SET 
        confidence = CASE 
          WHEN click_count >= 10 THEN GREATEST(0.8, confidence)
          WHEN click_count >= 5 THEN GREATEST(0.6, confidence)
          WHEN conversion_count > 0 THEN GREATEST(0.7, confidence)
          ELSE confidence * 0.98  -- Slight decay for unused edges
        END
      WHERE is_active = true
    `);

    console.log("✅ Edge weights updated successfully");
  }

  /**
   * Auto-generate new semantic connections for a node
   */
  async autoGenerateConnections(nodeId: number): Promise<void> {
    const node = await db.select()
      .from(semanticNodes)
      .where(eq(semanticNodes.id, nodeId))
      .limit(1);

    if (!node.length) return;

    const sourceNode = node[0];
    
    // Find similar nodes by searching existing nodes
    const similarNodes = await db.select({
      id: semanticNodes.id,
      title: semanticNodes.title,
      nodeType: semanticNodes.nodeType,
      verticalId: semanticNodes.verticalId,
      similarity: sql<number>`0.75` // Default similarity score
    })
    .from(semanticNodes)
    .where(
      and(
        sql`id != ${nodeId}`,
        eq(semanticNodes.status, 'active'),
        or(
          eq(semanticNodes.verticalId, sourceNode.verticalId || ''),
          eq(semanticNodes.nodeType, sourceNode.nodeType)
        )
      )
    )
    .limit(10);

    // Generate edges based on semantic similarity
    for (const similar of similarNodes) {
      // Check if edge already exists
      const existing = await db.select()
        .from(semanticEdges)
        .where(
          and(
            eq(semanticEdges.fromNodeId, nodeId),
            eq(semanticEdges.toNodeId, similar.id)
          )
        )
        .limit(1);

      if (existing.length === 0) {
        const edgeType = this.determineEdgeType(sourceNode, similar as any);
        const confidence = (similar.similarity || 0.7) * 0.8; // Slightly reduce AI confidence

        await db.insert(semanticEdges).values({
          fromNodeId: nodeId,
          toNodeId: similar.id,
          edgeType,
          weight: similar.similarity || 0.7,
          confidence,
          createdBy: 'auto',
          metadata: {
            reason: 'semantic_similarity',
            similarity_score: similar.similarity || 0.7,
            auto_generated: true
          }
        });
      }
    }
  }

  /**
   * Propagate user intent through the graph
   */
  async propagateUserIntent(
    userId: string,
    currentNodeId: number,
    intentStrength: number = 1.0
  ): Promise<{
    recommendations: Array<{
      nodeId: number;
      title: string;
      type: string;
      score: number;
      reason: string;
    }>;
    updatedVector: any;
  }> {
    // Get user's current intent vector
    const userVector = await db.select()
      .from(userIntentVectors)
      .where(eq(userIntentVectors.userId, userId))
      .limit(1);

    // Get current node details
    const currentNode = await db.select()
      .from(semanticNodes)
      .where(eq(semanticNodes.id, currentNodeId))
      .limit(1);

    if (!currentNode.length) {
      return { recommendations: [], updatedVector: null };
    }

    // Find connected nodes with high relevance
    const connectedNodes = await db.select({
      nodeId: semanticEdges.toNodeId,
      title: semanticNodes.title,
      nodeType: semanticNodes.nodeType,
      weight: semanticEdges.weight,
      confidence: semanticEdges.confidence,
      edgeType: semanticEdges.edgeType,
      verticalId: semanticNodes.verticalId,
      engagement: semanticNodes.engagement,
      conversionRate: semanticNodes.conversionRate
    })
    .from(semanticEdges)
    .innerJoin(semanticNodes, eq(semanticEdges.toNodeId, semanticNodes.id))
    .where(
      and(
        eq(semanticEdges.fromNodeId, currentNodeId),
        eq(semanticEdges.isActive, true),
        eq(semanticNodes.status, 'active')
      )
    )
    .orderBy(desc(sql`weight * confidence`));

    // Calculate recommendation scores
    const recommendations = connectedNodes.map(node => {
      let score = (node.weight || 0.5) * (node.confidence || 0.5) * intentStrength;
      
      // Boost based on node performance
      score += (node.engagement || 0) * 0.2;
      score += (node.conversionRate || 0) * 0.3;
      
      // Edge type specific boosts
      if (node.edgeType === 'leads_to') score *= 1.2;
      if (node.edgeType === 'solves') score *= 1.15;
      if (node.edgeType === 'upsell_from') score *= 1.1;

      return {
        nodeId: node.nodeId,
        title: node.title,
        type: node.nodeType,
        score: Math.min(1.0, score),
        reason: this.getRecommendationReason(node.edgeType, node.weight, node.confidence)
      };
    });

    // Update user intent vector
    let updatedVector = null;
    if (userVector.length > 0) {
      const current = userVector[0];
      const currentIntentVector = current.intentVector as number[] || [];
      const nodeEmbedding = currentNode[0].vectorEmbedding as number[] || [];
      
      // Blend current intent with new node embedding
      const blendedVector = this.blendVectors(currentIntentVector, nodeEmbedding, 0.8);
      
      updatedVector = await db.update(userIntentVectors)
        .set({
          intentVector: blendedVector,
          lastActivity: new Date(),
          strength: Math.min(1.0, (current.strength || 1.0) + intentStrength * 0.1),
          interactionHistory: [
            ...(current.interactionHistory as any[] || []).slice(-9), // Keep last 9
            {
              nodeId: currentNodeId,
              nodeType: currentNode[0].nodeType,
              timestamp: new Date(),
              intentStrength
            }
          ]
        })
        .where(eq(userIntentVectors.userId, userId))
        .returning();
    } else {
      // Create new intent vector for user
      updatedVector = await db.insert(userIntentVectors).values({
        userId,
        intentVector: currentNode[0].vectorEmbedding || [],
        currentArchetype: 'explorer', // Default archetype
        strength: intentStrength,
        interactionHistory: [{
          nodeId: currentNodeId,
          nodeType: currentNode[0].nodeType,
          timestamp: new Date(),
          intentStrength
        }]
      }).returning();
    }

    return {
      recommendations: recommendations
        .filter(r => r.score > 0.3) // Filter low-confidence recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, 5), // Top 5 recommendations
      updatedVector: updatedVector?.[0] || null
    };
  }

  /**
   * Run daily graph optimization
   */
  async runDailyOptimization(): Promise<{
    orphansFixed: number;
    lowPerformanceUpdated: number;
    newConnectionsCreated: number;
  }> {
    console.log("🔄 Running daily graph optimization...");
    
    let orphansFixed = 0;
    let lowPerformanceUpdated = 0;
    let newConnectionsCreated = 0;

    // Find and fix orphaned nodes
    const orphans = await db.select()
      .from(semanticNodes)
      .where(
        and(
          eq(semanticNodes.status, 'active'),
          sql`NOT EXISTS (
            SELECT 1 FROM semantic_edges 
            WHERE from_node_id = semantic_nodes.id OR to_node_id = semantic_nodes.id
          )`
        )
      );

    for (const orphan of orphans) {
      await this.autoGenerateConnections(orphan.id);
      orphansFixed++;
    }

    // Update low-performance nodes
    const lowPerformance = await db.select()
      .from(semanticNodes)
      .where(
        and(
          eq(semanticNodes.status, 'active'),
          or(
            sql`click_through_rate < 0.02`,
            sql`engagement < 0.1`,
            sql`conversion_rate < 0.005`
          )
        )
      )
      .limit(20);

    for (const node of lowPerformance) {
      // Mark for optimization
      await db.update(semanticNodes)
        .set({
          metadata: {
            ...node.metadata as any,
            needsOptimization: true,
            lastOptimizationCheck: new Date()
          }
        })
        .where(eq(semanticNodes.id, node.id));
      
      lowPerformanceUpdated++;
    }

    // Update edge weights
    await this.updateEdgeWeights();

    // Generate new connections for high-performing nodes
    const highPerformers = await db.select()
      .from(semanticNodes)
      .where(
        and(
          eq(semanticNodes.status, 'active'),
          sql`(COALESCE(click_through_rate, 0) + COALESCE(engagement, 0) + COALESCE(conversion_rate, 0)) > 0.5`
        )
      )
      .limit(10);

    for (const performer of highPerformers) {
      const connectionsBefore = await db.select({ count: sql<number>`COUNT(*)` })
        .from(semanticEdges)
        .where(
          or(
            eq(semanticEdges.fromNodeId, performer.id),
            eq(semanticEdges.toNodeId, performer.id)
          )
        );

      await this.autoGenerateConnections(performer.id);

      const connectionsAfter = await db.select({ count: sql<number>`COUNT(*)` })
        .from(semanticEdges)
        .where(
          or(
            eq(semanticEdges.fromNodeId, performer.id),
            eq(semanticEdges.toNodeId, performer.id)
          )
        );

      newConnectionsCreated += Math.max(0, 
        parseInt(connectionsAfter[0].count.toString()) - parseInt(connectionsBefore[0].count.toString())
      );
    }

    console.log(`✅ Daily optimization complete: ${orphansFixed} orphans fixed, ${lowPerformanceUpdated} nodes updated, ${newConnectionsCreated} new connections`);

    return {
      orphansFixed,
      lowPerformanceUpdated,
      newConnectionsCreated
    };
  }

  private determineEdgeType(sourceNode: any, targetNode: any): string {
    // Smart edge type determination based on node types and context
    if (sourceNode.nodeType === 'quiz' && targetNode.nodeType === 'offer') {
      return 'leads_to';
    }
    if (sourceNode.nodeType === 'blog_post' && targetNode.nodeType === 'cta_block') {
      return 'influences';
    }
    if (sourceNode.nodeType === 'page' && targetNode.nodeType === 'quiz') {
      return 'leads_to';
    }
    if (sourceNode.nodeType === targetNode.nodeType) {
      return 'related_to';
    }
    if (sourceNode.verticalId === targetNode.verticalId) {
      return 'related_to';
    }
    if (targetNode.nodeType === 'offer' && sourceNode.nodeType !== 'offer') {
      return 'upsell_from';
    }
    
    return 'related_to';
  }

  private blendVectors(vector1: number[], vector2: number[], alpha: number = 0.8): number[] {
    const maxLength = Math.max(vector1.length, vector2.length);
    const result: number[] = [];
    
    for (let i = 0; i < maxLength; i++) {
      const v1 = vector1[i] || 0;
      const v2 = vector2[i] || 0;
      result[i] = v1 * alpha + v2 * (1 - alpha);
    }
    
    return result;
  }

  private getRecommendationReason(edgeType: string, weight: number, confidence: number): string {
    const score = (weight || 0.5) * (confidence || 0.5);
    
    const reasons: Record<string, string> = {
      'leads_to': 'Natural next step in your journey',
      'solves': 'Addresses your current needs',
      'related_to': 'Similar to your interests',
      'upsell_from': 'Enhanced solution for you',
      'influences': 'Highly relevant content',
      'matches_intent': 'Matches your current goals'
    };
    
    const baseReason = reasons[edgeType] || 'Recommended for you';
    
    if (score > 0.8) return `${baseReason} (High confidence)`;
    if (score > 0.6) return `${baseReason} (Good match)`;
    
    return baseReason;
  }
}

export const intentPropagationEngine = new IntentPropagationEngine();