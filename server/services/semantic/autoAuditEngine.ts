import { db } from "../../db";
import { eq, and, or, sql, desc, asc, isNull, gt, lt, count } from "drizzle-orm";
import {
  semanticNodes,
  semanticEdges,
  userIntentVectors,
  vectorSimilarityIndex,
  graphAnalytics,
  graphAuditResults,
  type InsertGraphAuditResult,
} from "@shared/semanticTables";
import { llmIntegration } from "../ai-ml/llmIntegration";
import { vectorEngine } from "./vectorEngine";

/**
 * Auto-Audit Engine - Automated graph optimization and quality assurance
 * Runs periodic audits to detect issues, orphans, and optimization opportunities
 */
export class AutoAuditEngine {
  private initialized = false;
  private auditRunning = false;
  private auditHistory: Array<{ type: string; timestamp: Date; issues: number }> = [];

  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log("🔍 Initializing Auto-Audit Engine...");
    
    // Start periodic audits
    this.startPeriodicAudits();
    
    this.initialized = true;
    console.log("✅ Auto-Audit Engine initialized successfully");
  }

  /**
   * MAIN AUDIT ORCHESTRATOR
   */
  async runFullAudit(force: boolean = false): Promise<{
    summary: any;
    issues: InsertGraphAuditResult[];
    recommendations: string[];
  }> {
    if (this.auditRunning && !force) {
      throw new Error("Audit is already running. Use force=true to override.");
    }

    this.auditRunning = true;
    console.log("🔍 Starting comprehensive graph audit...");

    try {
      const issues: InsertGraphAuditResult[] = [];
      const recommendations: string[] = [];

      // Run all audit checks in parallel
      const [
        orphanNodes,
        lowPerformanceNodes,
        brokenEdges,
        vectorInconsistencies,
        unusedVectors,
        recommendationIssues,
        performanceBottlenecks
      ] = await Promise.all([
        this.detectOrphanNodes(),
        this.detectLowPerformanceNodes(),
        this.detectBrokenEdges(),
        this.detectVectorInconsistencies(),
        this.detectUnusedVectors(),
        this.auditRecommendationQuality(),
        this.detectPerformanceBottlenecks()
      ]);

      // Collect all issues
      issues.push(
        ...orphanNodes,
        ...lowPerformanceNodes,
        ...brokenEdges,
        ...vectorInconsistencies,
        ...unusedVectors,
        ...recommendationIssues,
        ...performanceBottlenecks
      );

      // Generate LLM-powered recommendations
      const llmRecommendations = await this.generateLLMRecommendations(issues);
      recommendations.push(...llmRecommendations);

      // Store audit results in database
      if (issues.length > 0) {
        await db.insert(graphAuditResults).values(issues);
      }

      // Generate summary
      const summary = this.generateAuditSummary(issues, recommendations);

      // Update audit history
      this.auditHistory.push({
        type: 'full_audit',
        timestamp: new Date(),
        issues: issues.length
      });

      console.log(`🔍 Audit completed: Found ${issues.length} issues`);
      return { summary, issues, recommendations };

    } finally {
      this.auditRunning = false;
    }
  }

  /**
   * ORPHAN DETECTION
   */
  private async detectOrphanNodes(): Promise<InsertGraphAuditResult[]> {
    try {
      // Find nodes with no incoming or outgoing edges
      const orphanNodes = await db.select({
        node: semanticNodes,
        incomingEdges: sql`(
          SELECT COUNT(*) FROM ${semanticEdges} 
          WHERE ${semanticEdges.toNodeId} = ${semanticNodes.id} 
          AND ${semanticEdges.isActive} = true
        )`,
        outgoingEdges: sql`(
          SELECT COUNT(*) FROM ${semanticEdges} 
          WHERE ${semanticEdges.fromNodeId} = ${semanticNodes.id} 
          AND ${semanticEdges.isActive} = true
        )`
      })
        .from(semanticNodes)
        .where(eq(semanticNodes.status, 'active'))
        .having(and(
          sql`incoming_edges = 0`,
          sql`outgoing_edges = 0`
        ));

      return orphanNodes.map(item => ({
        auditType: 'orphan_detection',
        nodeId: item.node.id,
        severity: 'medium' as const,
        issue: `Orphan node detected: "${item.node.title}" has no connections`,
        recommendation: `Consider creating relationships for this ${item.node.nodeType} node or reviewing its relevance`,
        autoFixAvailable: true,
        metadata: {
          nodeType: item.node.nodeType,
          title: item.node.title,
          slug: item.node.slug
        }
      }));

    } catch (error) {
      console.error("Error detecting orphan nodes:", error);
      return [];
    }
  }

  /**
   * LOW PERFORMANCE DETECTION
   */
  private async detectLowPerformanceNodes(): Promise<InsertGraphAuditResult[]> {
    try {
      // Find nodes with low CTR, engagement, or conversion rates
      const lowPerformanceNodes = await db.select()
        .from(semanticNodes)
        .where(and(
          eq(semanticNodes.status, 'active'),
          or(
            lt(semanticNodes.clickThroughRate, 0.01), // Less than 1% CTR
            lt(semanticNodes.engagement, 0.02), // Less than 2% engagement
            lt(semanticNodes.conversionRate, 0.005) // Less than 0.5% conversion
          )
        ));

      return lowPerformanceNodes.map(node => ({
        auditType: 'low_performance',
        nodeId: node.id,
        severity: this.calculatePerformanceSeverity(node),
        issue: `Low performance detected: CTR ${(node.clickThroughRate || 0) * 100}%, Engagement ${(node.engagement || 0) * 100}%`,
        recommendation: this.generatePerformanceRecommendation(node),
        autoFixAvailable: false,
        metadata: {
          ctr: node.clickThroughRate,
          engagement: node.engagement,
          conversionRate: node.conversionRate,
          lastOptimized: node.lastOptimized
        }
      }));

    } catch (error) {
      console.error("Error detecting low performance nodes:", error);
      return [];
    }
  }

  /**
   * BROKEN EDGE DETECTION
   */
  private async detectBrokenEdges(): Promise<InsertGraphAuditResult[]> {
    try {
      // Find edges pointing to non-existent or inactive nodes
      const brokenEdges = await db.select({
        edge: semanticEdges,
        fromNodeExists: sql`EXISTS(
          SELECT 1 FROM ${semanticNodes} 
          WHERE ${semanticNodes.id} = ${semanticEdges.fromNodeId} 
          AND ${semanticNodes.status} = 'active'
        )`,
        toNodeExists: sql`EXISTS(
          SELECT 1 FROM ${semanticNodes} 
          WHERE ${semanticNodes.id} = ${semanticEdges.toNodeId} 
          AND ${semanticNodes.status} = 'active'
        )`
      })
        .from(semanticEdges)
        .where(eq(semanticEdges.isActive, true))
        .having(or(
          sql`from_node_exists = false`,
          sql`to_node_exists = false`
        ));

      return brokenEdges.map(item => ({
        auditType: 'broken_edge',
        edgeId: item.edge.id,
        severity: 'high' as const,
        issue: `Broken edge detected: References inactive or non-existent node`,
        recommendation: 'Deactivate this edge or update node references',
        autoFixAvailable: true,
        metadata: {
          fromNodeId: item.edge.fromNodeId,
          toNodeId: item.edge.toNodeId,
          edgeType: item.edge.edgeType
        }
      }));

    } catch (error) {
      console.error("Error detecting broken edges:", error);
      return [];
    }
  }

  /**
   * VECTOR CONSISTENCY DETECTION
   */
  private async detectVectorInconsistencies(): Promise<InsertGraphAuditResult[]> {
    try {
      const issues: InsertGraphAuditResult[] = [];

      // Find nodes without vector embeddings
      const nodesWithoutVectors = await db.select()
        .from(semanticNodes)
        .where(and(
          eq(semanticNodes.status, 'active'),
          isNull(semanticNodes.vectorEmbedding)
        ));

      issues.push(...nodesWithoutVectors.map(node => ({
        auditType: 'vector_inconsistency',
        nodeId: node.id,
        severity: 'medium' as const,
        issue: `Missing vector embedding for "${node.title}"`,
        recommendation: 'Regenerate vector embedding for this node',
        autoFixAvailable: true,
        metadata: { nodeType: node.nodeType, title: node.title }
      })));

      // Find outdated similarity indices
      const outdatedIndices = await db.select()
        .from(vectorSimilarityIndex)
        .where(
          lt(vectorSimilarityIndex.lastCalculated, 
             sql`NOW() - INTERVAL '7 days'`
          )
        );

      if (outdatedIndices.length > 0) {
        issues.push({
          auditType: 'vector_inconsistency',
          severity: 'low' as const,
          issue: `${outdatedIndices.length} similarity indices are outdated (>7 days old)`,
          recommendation: 'Rebuild similarity indices for better search performance',
          autoFixAvailable: true,
          metadata: { outdatedCount: outdatedIndices.length }
        });
      }

      return issues;

    } catch (error) {
      console.error("Error detecting vector inconsistencies:", error);
      return [];
    }
  }

  /**
   * UNUSED VECTOR DETECTION
   */
  private async detectUnusedVectors(): Promise<InsertGraphAuditResult[]> {
    try {
      // Find user intent vectors that haven't been updated in 30 days
      const unusedVectors = await db.select()
        .from(userIntentVectors)
        .where(
          lt(userIntentVectors.lastActivity, 
             sql`NOW() - INTERVAL '30 days'`
          )
        );

      if (unusedVectors.length === 0) return [];

      return [{
        auditType: 'unused_vectors',
        severity: 'low' as const,
        issue: `${unusedVectors.length} user intent vectors haven't been updated in 30+ days`,
        recommendation: 'Consider archiving or cleaning up stale user vectors',
        autoFixAvailable: true,
        metadata: {
          unusedCount: unusedVectors.length,
          oldestVector: Math.min(...unusedVectors.map(v => v.lastActivity?.getTime() || Date.now()))
        }
      }];

    } catch (error) {
      console.error("Error detecting unused vectors:", error);
      return [];
    }
  }

  /**
   * RECOMMENDATION QUALITY AUDIT
   */
  private async auditRecommendationQuality(): Promise<InsertGraphAuditResult[]> {
    try {
      const issues: InsertGraphAuditResult[] = [];

      // Check recommendation click-through rates
      const recommendationStats = await db.select({
        total: sql`COUNT(*)`,
        clicked: sql`COUNT(*) FILTER (WHERE ${realtimeRecommendations.isClicked} = true)`,
        converted: sql`COUNT(*) FILTER (WHERE ${realtimeRecommendations.isConverted} = true)`,
        avgScore: sql`AVG(${realtimeRecommendations.score})`
      }).from(realtimeRecommendations);

      if (recommendationStats[0]) {
        const stats = recommendationStats[0];
        const totalCount = parseInt(stats.total as string) || 0;
        const clickedCount = parseInt(stats.clicked as string) || 0;
        const convertedCount = parseInt(stats.converted as string) || 0;
        const avgScore = parseFloat(stats.avgScore as string) || 0;

        const ctr = totalCount > 0 ? clickedCount / totalCount : 0;
        const conversionRate = totalCount > 0 ? convertedCount / totalCount : 0;

        if (ctr < 0.05 && totalCount > 100) { // Less than 5% CTR with significant data
          issues.push({
            auditType: 'recommendation_quality',
            severity: 'medium' as const,
            issue: `Low recommendation CTR: ${(ctr * 100).toFixed(2)}%`,
            recommendation: 'Review recommendation algorithm parameters and scoring',
            autoFixAvailable: false,
            metadata: { ctr, totalRecommendations: totalCount, avgScore }
          });
        }

        if (avgScore < 0.4) {
          issues.push({
            auditType: 'recommendation_quality',
            severity: 'medium' as const,
            issue: `Low average recommendation score: ${avgScore.toFixed(3)}`,
            recommendation: 'Increase minimum score threshold or improve vector quality',
            autoFixAvailable: false,
            metadata: { avgScore, totalRecommendations: totalCount }
          });
        }
      }

      return issues;

    } catch (error) {
      console.error("Error auditing recommendation quality:", error);
      return [];
    }
  }

  /**
   * PERFORMANCE BOTTLENECK DETECTION
   */
  private async detectPerformanceBottlenecks(): Promise<InsertGraphAuditResult[]> {
    try {
      const issues: InsertGraphAuditResult[] = [];

      // Check for nodes with too many edges (performance bottleneck)
      const nodesWithManyEdges = await db.select({
        nodeId: semanticEdges.fromNodeId,
        edgeCount: sql`COUNT(*)`
      })
        .from(semanticEdges)
        .where(eq(semanticEdges.isActive, true))
        .groupBy(semanticEdges.fromNodeId)
        .having(sql`COUNT(*) > 100`);

      for (const item of nodesWithManyEdges) {
        const node = await db.select().from(semanticNodes)
          .where(eq(semanticNodes.id, item.nodeId))
          .limit(1);

        if (node[0]) {
          issues.push({
            auditType: 'performance_bottleneck',
            nodeId: item.nodeId,
            severity: 'medium' as const,
            issue: `Node "${node[0].title}" has ${item.edgeCount} outgoing edges (potential bottleneck)`,
            recommendation: 'Consider restructuring relationships or implementing edge prioritization',
            autoFixAvailable: false,
            metadata: { edgeCount: item.edgeCount, nodeType: node[0].nodeType }
          });
        }
      }

      // Check similarity index size
      const indexSize = await db.select({ count: sql`COUNT(*)` })
        .from(vectorSimilarityIndex);
      
      const totalIndices = parseInt(indexSize[0].count as string) || 0;
      if (totalIndices > 1000000) { // 1M+ similarity pairs
        issues.push({
          auditType: 'performance_bottleneck',
          severity: 'low' as const,
          issue: `Large similarity index: ${totalIndices.toLocaleString()} entries`,
          recommendation: 'Consider implementing index pruning or caching strategies',
          autoFixAvailable: false,
          metadata: { indexSize: totalIndices }
        });
      }

      return issues;

    } catch (error) {
      console.error("Error detecting performance bottlenecks:", error);
      return [];
    }
  }

  /**
   * AUTO-FIX CAPABILITIES
   */
  async autoFixIssues(auditResultIds: number[]): Promise<{
    fixed: number;
    failed: number;
    details: Array<{ id: number; success: boolean; error?: string }>;
  }> {
    const results = { fixed: 0, failed: 0, details: [] as any[] };

    const auditResults = await db.select()
      .from(graphAuditResults)
      .where(and(
        inArray(graphAuditResults.id, auditResultIds),
        eq(graphAuditResults.autoFixAvailable, true),
        eq(graphAuditResults.isResolved, false)
      ));

    for (const audit of auditResults) {
      try {
        let success = false;

        switch (audit.auditType) {
          case 'orphan_detection':
            success = await this.fixOrphanNode(audit);
            break;
          case 'broken_edge':
            success = await this.fixBrokenEdge(audit);
            break;
          case 'vector_inconsistency':
            success = await this.fixVectorInconsistency(audit);
            break;
          case 'unused_vectors':
            success = await this.cleanupUnusedVectors(audit);
            break;
        }

        if (success) {
          await this.markAuditResolved(audit.id, 'auto_fix');
          results.fixed++;
        } else {
          results.failed++;
        }

        results.details.push({ id: audit.id, success });

      } catch (error: any) {
        console.error(`Error auto-fixing audit ${audit.id}:`, error);
        results.failed++;
        results.details.push({ 
          id: audit.id, 
          success: false, 
          error: error.message 
        });
      }
    }

    return results;
  }

  /**
   * HELPER METHODS
   */
  private async generateLLMRecommendations(issues: InsertGraphAuditResult[]): Promise<string[]> {
    if (issues.length === 0) return ["Graph is healthy! No issues detected."];

    try {
      const issuesSummary = issues.map(issue => 
        `${issue.severity.toUpperCase()}: ${issue.issue} (${issue.auditType})`
      ).join('\n');

      const prompt = `Based on these semantic graph audit results, provide 3-5 strategic recommendations for optimization:

${issuesSummary}

Focus on high-impact improvements and performance optimizations. Be specific and actionable.`;

      const response = await llmIntegration.generateResponse(prompt);
      
      return response
        .split('\n')
        .filter(line => line.trim() && (line.includes('-') || line.includes('•')))
        .map(line => line.replace(/^[-•\s]*/, '').trim())
        .filter(rec => rec.length > 10)
        .slice(0, 5);

    } catch (error) {
      console.error("Error generating LLM recommendations:", error);
      return [
        "Review and optimize low-performing nodes",
        "Fix broken relationships in the graph",
        "Update missing vector embeddings",
        "Consider graph structure optimization"
      ];
    }
  }

  private generateAuditSummary(issues: InsertGraphAuditResult[], recommendations: string[]): any {
    const severityCounts = issues.reduce((acc, issue) => {
      acc[issue.severity] = (acc[issue.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const typeCounts = issues.reduce((acc, issue) => {
      acc[issue.auditType] = (acc[issue.auditType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const autoFixableCount = issues.filter(i => i.autoFixAvailable).length;

    return {
      totalIssues: issues.length,
      severityBreakdown: severityCounts,
      typeBreakdown: typeCounts,
      autoFixable: autoFixableCount,
      manualReview: issues.length - autoFixableCount,
      recommendations: recommendations,
      auditTimestamp: new Date().toISOString(),
      healthScore: Math.max(0, 100 - (issues.length * 2)) // Simple health scoring
    };
  }

  private calculatePerformanceSeverity(node: any): 'low' | 'medium' | 'high' | 'critical' {
    const ctr = node.clickThroughRate || 0;
    const engagement = node.engagement || 0;
    const conversion = node.conversionRate || 0;

    const combinedScore = ctr + engagement + conversion;

    if (combinedScore < 0.001) return 'critical';
    if (combinedScore < 0.01) return 'high';
    if (combinedScore < 0.03) return 'medium';
    return 'low';
  }

  private generatePerformanceRecommendation(node: any): string {
    const issues = [];
    
    if ((node.clickThroughRate || 0) < 0.01) issues.push('low CTR');
    if ((node.engagement || 0) < 0.02) issues.push('low engagement');
    if ((node.conversionRate || 0) < 0.005) issues.push('low conversion');

    const suggestions = [];
    if (issues.includes('low CTR')) suggestions.push('improve title/description');
    if (issues.includes('low engagement')) suggestions.push('enhance content quality');
    if (issues.includes('low conversion')) suggestions.push('optimize CTAs');

    return `Consider: ${suggestions.join(', ')} to address ${issues.join(', ')}`;
  }

  private async fixOrphanNode(audit: InsertGraphAuditResult): Promise<boolean> {
    // Auto-generate relationships for orphan nodes
    if (!audit.nodeId) return false;

    try {
      // This would integrate with semanticGraphEngine.autoGenerateRelationships
      // For now, we'll mark it as needing manual review
      return false;
    } catch (error) {
      console.error("Error fixing orphan node:", error);
      return false;
    }
  }

  private async fixBrokenEdge(audit: InsertGraphAuditResult): Promise<boolean> {
    if (!audit.edgeId) return false;

    try {
      await db.update(semanticEdges)
        .set({ isActive: false })
        .where(eq(semanticEdges.id, audit.edgeId));

      return true;
    } catch (error) {
      console.error("Error fixing broken edge:", error);
      return false;
    }
  }

  private async fixVectorInconsistency(audit: InsertGraphAuditResult): Promise<boolean> {
    if (!audit.nodeId) return false;

    try {
      const node = await db.select().from(semanticNodes)
        .where(eq(semanticNodes.id, audit.nodeId))
        .limit(1);

      if (!node[0]) return false;

      const content = `${node[0].title} ${node[0].description || ''} ${node[0].content || ''}`;
      const embedding = await vectorEngine.generateEmbedding(content);

      await db.update(semanticNodes)
        .set({ vectorEmbedding: embedding })
        .where(eq(semanticNodes.id, audit.nodeId));

      return true;
    } catch (error) {
      console.error("Error fixing vector inconsistency:", error);
      return false;
    }
  }

  private async cleanupUnusedVectors(audit: InsertGraphAuditResult): Promise<boolean> {
    try {
      await db.delete(userIntentVectors)
        .where(
          lt(userIntentVectors.lastActivity, 
             sql`NOW() - INTERVAL '90 days'` // More conservative cleanup
          )
        );

      return true;
    } catch (error) {
      console.error("Error cleaning up unused vectors:", error);
      return false;
    }
  }

  private async markAuditResolved(auditId: number, resolvedBy: string): Promise<void> {
    await db.update(graphAuditResults)
      .set({
        isResolved: true,
        resolvedBy: resolvedBy,
        resolvedAt: new Date()
      })
      .where(eq(graphAuditResults.id, auditId));
  }

  private startPeriodicAudits(): void {
    // Run full audit every 24 hours
    setInterval(async () => {
      try {
        console.log("🔍 Running scheduled graph audit...");
        await this.runFullAudit();
      } catch (error) {
        console.error("Error in scheduled audit:", error);
      }
    }, 1000 * 60 * 60 * 24); // Every 24 hours

    // Run quick orphan check every hour
    setInterval(async () => {
      try {
        const orphans = await this.detectOrphanNodes();
        if (orphans.length > 0) {
          console.log(`⚠️ Found ${orphans.length} orphan nodes`);
          await db.insert(graphAuditResults).values(orphans);
        }
      } catch (error) {
        console.error("Error in orphan detection:", error);
      }
    }, 1000 * 60 * 60); // Every hour
  }

  getAuditHistory(): Array<{ type: string; timestamp: Date; issues: number }> {
    return [...this.auditHistory].slice(-20); // Last 20 audits
  }

  isAuditRunning(): boolean {
    return this.auditRunning;
  }
}

// Singleton instance
export const autoAuditEngine = new AutoAuditEngine();