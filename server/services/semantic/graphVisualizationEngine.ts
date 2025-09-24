import { db } from "../../db";
import { eq, and, or, sql, desc, count } from "drizzle-orm";
import { semanticNodes, semanticEdges, userIntentVectors } from "@shared/semanticTables";

/**
 * Graph Visualization Engine - D3.js data preparation and graph analytics
 */
export class GraphVisualizationEngine {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    console.log("📊 Initializing Graph Visualization Engine...");
    this.initialized = true;
    console.log("✅ Graph Visualization Engine initialized");
  }

  /**
   * Get graph data for D3.js/Cytoscape visualization
   */
  async getGraphVisualizationData(filters?: {
    nodeTypes?: string[];
    verticals?: string[];
    minWeight?: number;
    limit?: number;
  }): Promise<{
    nodes: Array<{
      id: string;
      label: string;
      type: string;
      vertical?: string;
      size: number;
      color: string;
      metadata: any;
      metrics: {
        ctr: number;
        conversions: number;
        engagement: number;
        connections: number;
      };
    }>;
    edges: Array<{
      id: string;
      source: string;
      target: string;
      type: string;
      weight: number;
      confidence: number;
      animated?: boolean;
    }>;
    stats: {
      totalNodes: number;
      totalEdges: number;
      avgDegree: number;
      clusters: number;
    };
  }> {
    const limit = filters?.limit || 100;
    
    // Build node query
    let nodeQuery = db.select().from(semanticNodes);
    
    if (filters?.nodeTypes?.length) {
      nodeQuery = nodeQuery.where(
        sql`node_type = ANY(${filters.nodeTypes})`
      ) as any;
    }
    
    if (filters?.verticals?.length) {
      nodeQuery = nodeQuery.where(
        sql`vertical_id = ANY(${filters.verticals})`
      ) as any;
    }

    const nodes = await nodeQuery.limit(limit);
    
    // Get edges for these nodes
    const nodeIds = nodes.map(n => n.id);
    const edges = await db.select()
      .from(semanticEdges)
      .where(
        and(
          sql`from_node_id = ANY(${nodeIds})`,
          sql`to_node_id = ANY(${nodeIds})`,
          eq(semanticEdges.isActive, true),
          filters?.minWeight ? 
            sql`weight >= ${filters.minWeight}` : 
            sql`weight > 0`
        )
      );

    // Count connections for each node
    const connectionCounts = await db.select({
      nodeId: semanticEdges.fromNodeId,
      connections: count()
    })
    .from(semanticEdges)
    .where(sql`from_node_id = ANY(${nodeIds}) OR to_node_id = ANY(${nodeIds})`)
    .groupBy(semanticEdges.fromNodeId);

    const connectionMap = new Map(connectionCounts.map(c => [c.nodeId, c.connections]));

    // Transform nodes for visualization
    const vizNodes = nodes.map(node => ({
      id: node.id.toString(),
      label: node.title,
      type: node.nodeType,
      vertical: node.verticalId || 'general',
      size: Math.max(10, (connectionMap.get(node.id) || 1) * 3),
      color: this.getNodeColor(node.nodeType),
      metadata: node.metadata,
      metrics: {
        ctr: node.clickThroughRate || 0,
        conversions: node.conversionRate || 0,
        engagement: node.engagement || 0,
        connections: connectionMap.get(node.id) || 0
      }
    }));

    // Transform edges for visualization
    const vizEdges = edges.map(edge => ({
      id: `${edge.fromNodeId}-${edge.toNodeId}-${edge.edgeType}`,
      source: edge.fromNodeId.toString(),
      target: edge.toNodeId.toString(),
      type: edge.edgeType,
      weight: edge.weight || 1,
      confidence: edge.confidence || 0.5,
      animated: edge.edgeType === 'llm_suggested_link' || (edge.weight || 0) > 0.8
    }));

    // Calculate basic stats
    const avgDegree = edges.length > 0 ? (edges.length * 2) / nodes.length : 0;
    
    return {
      nodes: vizNodes,
      edges: vizEdges,
      stats: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        avgDegree: parseFloat(avgDegree.toFixed(2)),
        clusters: await this.estimateClusterCount(nodes, edges)
      }
    };
  }

  /**
   * Get high-value paths through the graph
   */
  async getHighValuePaths(options?: {
    startNodeType?: string;
    endNodeType?: string;
    maxLength?: number;
    minConversionRate?: number;
  }): Promise<Array<{
    path: Array<{ id: number; title: string; type: string }>;
    score: number;
    conversionRate: number;
    clickThroughRate: number;
    length: number;
  }>> {
    const maxLength = options?.maxLength || 5;
    
    // This is a simplified implementation - in production, you'd want proper graph traversal algorithms
    const paths = await db.execute(sql`
      WITH RECURSIVE path_finder AS (
        -- Base case: start with all nodes
        SELECT 
          n.id as current_id,
          n.title as current_title,
          n.node_type as current_type,
          ARRAY[n.id] as path_ids,
          ARRAY[n.title] as path_titles,
          ARRAY[n.node_type] as path_types,
          1 as length,
          COALESCE(n.conversion_rate, 0) as total_conversion,
          COALESCE(n.click_through_rate, 0) as total_ctr
        FROM semantic_nodes n
        WHERE n.status = 'active'
        ${options?.startNodeType ? sql`AND n.node_type = ${options.startNodeType}` : sql``}
        
        UNION ALL
        
        -- Recursive case: extend paths
        SELECT 
          n2.id as current_id,
          n2.title as current_title,
          n2.node_type as current_type,
          pf.path_ids || n2.id as path_ids,
          pf.path_titles || n2.title as path_titles,
          pf.path_types || n2.node_type as path_types,
          pf.length + 1 as length,
          pf.total_conversion + COALESCE(n2.conversion_rate, 0) as total_conversion,
          pf.total_ctr + COALESCE(n2.click_through_rate, 0) as total_ctr
        FROM path_finder pf
        JOIN semantic_edges e ON e.from_node_id = pf.current_id
        JOIN semantic_nodes n2 ON n2.id = e.to_node_id
        WHERE 
          pf.length < ${maxLength}
          AND NOT n2.id = ANY(pf.path_ids)  -- Avoid cycles
          AND e.is_active = true
          AND e.weight > 0.3
      )
      SELECT DISTINCT
        path_ids,
        path_titles,
        path_types,
        length,
        total_conversion / length as avg_conversion,
        total_ctr / length as avg_ctr,
        (total_conversion + total_ctr) / length as score
      FROM path_finder
      WHERE 
        length >= 2
        ${options?.endNodeType ? sql`AND current_type = ${options.endNodeType}` : sql``}
        ${options?.minConversionRate ? sql`AND total_conversion / length >= ${options.minConversionRate}` : sql``}
      ORDER BY score DESC
      LIMIT 20
    `);

    return (paths as any).rows.map((row: any) => ({
      path: row.path_ids.map((id: number, index: number) => ({
        id,
        title: row.path_titles[index],
        type: row.path_types[index]
      })),
      score: parseFloat(row.score),
      conversionRate: parseFloat(row.avg_conversion),
      clickThroughRate: parseFloat(row.avg_ctr),
      length: row.length
    }));
  }

  /**
   * Get node analytics and heatmap data
   */
  async getNodeHeatmapData(): Promise<{
    performance: Array<{ id: number; title: string; score: number; type: string }>;
    connections: Array<{ id: number; title: string; connections: number; type: string }>;
    recent: Array<{ id: number; title: string; activity: number; type: string }>;
  }> {
    // Performance heatmap (conversion + engagement)
    const performance = await db.select({
      id: semanticNodes.id,
      title: semanticNodes.title,
      type: semanticNodes.nodeType,
      score: sql<number>`COALESCE(conversion_rate, 0) + COALESCE(engagement, 0) + COALESCE(click_through_rate, 0)`
    })
    .from(semanticNodes)
    .where(eq(semanticNodes.status, 'active'))
    .orderBy(desc(sql`COALESCE(conversion_rate, 0) + COALESCE(engagement, 0) + COALESCE(click_through_rate, 0)`))
    .limit(50);

    // Connection heatmap
    const connections = await db.select({
      id: semanticNodes.id,
      title: semanticNodes.title,
      type: semanticNodes.nodeType,
      connections: sql<number>`
        (SELECT COUNT(*) FROM semantic_edges WHERE from_node_id = semantic_nodes.id OR to_node_id = semantic_nodes.id)
      `
    })
    .from(semanticNodes)
    .where(eq(semanticNodes.status, 'active'))
    .orderBy(desc(sql`
      (SELECT COUNT(*) FROM semantic_edges WHERE from_node_id = semantic_nodes.id OR to_node_id = semantic_nodes.id)
    `))
    .limit(50);

    // Recent activity heatmap
    const recent = await db.select({
      id: semanticNodes.id,
      title: semanticNodes.title,
      type: semanticNodes.nodeType,
      activity: sql<number>`
        EXTRACT(EPOCH FROM NOW() - GREATEST(updated_at, last_optimized, COALESCE(last_optimized, updated_at)))
      `
    })
    .from(semanticNodes)
    .where(eq(semanticNodes.status, 'active'))
    .orderBy(sql`
      EXTRACT(EPOCH FROM NOW() - GREATEST(updated_at, last_optimized, COALESCE(last_optimized, updated_at)))
    `)
    .limit(50);

    return {
      performance: performance.map(p => ({
        id: p.id,
        title: p.title,
        score: parseFloat(p.score.toString()),
        type: p.type
      })),
      connections: connections.map(c => ({
        id: c.id,
        title: c.title,
        connections: parseInt(c.connections.toString()),
        type: c.type
      })),
      recent: recent.map(r => ({
        id: r.id,
        title: r.title,
        activity: parseFloat(r.activity.toString()),
        type: r.type
      }))
    };
  }

  /**
   * Generate auto-suggestions for new connections
   */
  async generateAutoSuggestions(nodeId: number): Promise<Array<{
    targetNodeId: number;
    targetTitle: string;
    suggestedEdgeType: string;
    confidence: number;
    reason: string;
  }>> {
    // Get the source node
    const sourceNode = await db.select()
      .from(semanticNodes)
      .where(eq(semanticNodes.id, nodeId))
      .limit(1);

    if (!sourceNode.length) return [];

    const source = sourceNode[0];
    
    // Find similar nodes by type and vertical
    const similar = await db.select({
      id: semanticNodes.id,
      title: semanticNodes.title,
      nodeType: semanticNodes.nodeType,
      verticalId: semanticNodes.verticalId,
      semanticKeywords: semanticNodes.semanticKeywords
    })
    .from(semanticNodes)
    .where(
      and(
        sql`id != ${nodeId}`,
        eq(semanticNodes.status, 'active'),
        or(
          eq(semanticNodes.verticalId, source.verticalId || ''),
          eq(semanticNodes.nodeType, source.nodeType)
        )
      )
    )
    .limit(10);

    // Generate suggestions based on patterns
    const suggestions: Array<{
      targetNodeId: number;
      targetTitle: string;
      suggestedEdgeType: string;
      confidence: number;
      reason: string;
    }> = [];

    for (const target of similar) {
      let suggestedEdgeType = 'related_to';
      let confidence = 0.5;
      let reason = 'Similar content type';

      // Logic for suggesting edge types
      if (source.nodeType === 'quiz' && target.nodeType === 'offer') {
        suggestedEdgeType = 'leads_to';
        confidence = 0.8;
        reason = 'Quiz typically leads to offer';
      } else if (source.nodeType === 'blog_post' && target.nodeType === 'cta_block') {
        suggestedEdgeType = 'influences';
        confidence = 0.7;
        reason = 'Blog content influences CTA engagement';
      } else if (source.nodeType === 'page' && target.nodeType === 'quiz') {
        suggestedEdgeType = 'leads_to';
        confidence = 0.75;
        reason = 'Page guides users to assessment';
      } else if (source.verticalId === target.verticalId) {
        suggestedEdgeType = 'related_to';
        confidence = 0.65;
        reason = `Same vertical: ${source.verticalId}`;
      }

      // Check if this connection already exists
      const existing = await db.select()
        .from(semanticEdges)
        .where(
          and(
            eq(semanticEdges.fromNodeId, nodeId),
            eq(semanticEdges.toNodeId, target.id)
          )
        )
        .limit(1);

      if (!existing.length) {
        suggestions.push({
          targetNodeId: target.id,
          targetTitle: target.title,
          suggestedEdgeType,
          confidence,
          reason
        });
      }
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  private getNodeColor(nodeType: string): string {
    const colors: Record<string, string> = {
      'page': '#3B82F6',       // Blue
      'quiz': '#10B981',       // Green
      'offer': '#F59E0B',      // Orange
      'blog_post': '#8B5CF6',  // Purple
      'cta_block': '#EF4444',  // Red
      'user_archetype': '#06B6D4', // Cyan
      'neuron': '#84CC16',     // Lime
      'tag': '#6B7280',        // Gray
      'vertical': '#EC4899',   // Pink
      'tool': '#F97316',       // Orange
      'session_profile': '#14B8A6' // Teal
    };
    
    return colors[nodeType] || '#6B7280';
  }

  private async estimateClusterCount(nodes: any[], edges: any[]): Promise<number> {
    // Simple clustering estimation based on connected components
    const nodeSet = new Set(nodes.map(n => n.id));
    const adjacency = new Map<number, Set<number>>();
    
    // Build adjacency list
    for (const node of nodes) {
      adjacency.set(node.id, new Set());
    }
    
    for (const edge of edges) {
      adjacency.get(edge.fromNodeId)?.add(edge.toNodeId);
      adjacency.get(edge.toNodeId)?.add(edge.fromNodeId);
    }
    
    // Count connected components
    const visited = new Set<number>();
    let clusters = 0;
    
    for (const nodeId of nodeSet) {
      if (!visited.has(nodeId)) {
        // BFS to mark component
        const queue = [nodeId];
        visited.add(nodeId);
        
        while (queue.length > 0) {
          const current = queue.shift()!;
          for (const neighbor of adjacency.get(current) || []) {
            if (!visited.has(neighbor)) {
              visited.add(neighbor);
              queue.push(neighbor);
            }
          }
        }
        
        clusters++;
      }
    }
    
    return clusters;
  }
}

export const graphVisualizationEngine = new GraphVisualizationEngine();