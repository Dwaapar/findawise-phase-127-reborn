import { z } from "zod";
import { db } from "../../db";
import { eq, and, or, sql, desc, asc, inArray, gt, lt, isNull, isNotNull, count } from "drizzle-orm";
import {
  semanticNodes,
  semanticEdges,
  userIntentVectors,
  vectorSimilarityIndex,
  graphAnalytics,
  type SemanticNode,
  type SemanticEdge,
} from "@shared/semanticTables";
import { intentGraphEngine } from "./intentGraphEngine";

/**
 * Graph Visualization API - Billion-Dollar Empire Grade
 * Provides comprehensive graph visualization data and analytics for the semantic intelligence system.
 * Supports real-time graph exploration, intent cluster visualization, and journey path analysis.
 */

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  size: number;
  color: string;
  position?: { x: number; y: number };
  metadata: Record<string, any>;
  metrics: {
    clickThroughRate: number;
    conversionRate: number;
    engagement: number;
    connections: number;
  };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  weight: number;
  color: string;
  metadata: Record<string, any>;
  metrics: {
    traversalCount: number;
    conversionRate: number;
    averageTime: number;
  };
}

export interface GraphCluster {
  id: string;
  name: string;
  nodes: string[];
  color: string;
  centroid: { x: number; y: number };
  metrics: {
    size: number;
    density: number;
    coherence: number;
  };
}

export interface GraphLayout {
  nodes: GraphNode[];
  edges: GraphEdge[];
  clusters: GraphCluster[];
  metadata: {
    totalNodes: number;
    totalEdges: number;
    totalClusters: number;
    layout: 'force' | 'hierarchical' | 'circular' | 'grid';
    timestamp: string;
  };
}

export interface GraphAnalytics {
  overview: {
    nodeCount: number;
    edgeCount: number;
    clusterCount: number;
    avgDegree: number;
    density: number;
    components: number;
  };
  performance: {
    topPerformingNodes: Array<{ node: string; score: number; type: string }>;
    topPerformingPaths: Array<{ path: string; score: number; conversions: number }>;
    lowPerformingNodes: Array<{ node: string; issues: string[]; recommendations: string[] }>;
  };
  insights: {
    intentClusters: Array<{ cluster: string; strength: number; keywords: string[] }>;
    journeyPatterns: Array<{ pattern: string; frequency: number; success: number }>;
    optimizationOpportunities: Array<{ type: string; description: string; impact: number }>;
  };
}

export class GraphVisualizationAPI {
  private nodeColorMap = new Map<string, string>();
  private layoutCache = new Map<string, GraphLayout>();
  private analyticsCache = new Map<string, GraphAnalytics>();
  private cacheTimeout = 300000; // 5 minutes

  constructor() {
    this.initializeColorMap();
  }

  /**
   * PRIMARY GRAPH VISUALIZATION ENDPOINTS
   */
  async getFullGraphLayout(
    options: {
      layout?: 'force' | 'hierarchical' | 'circular' | 'grid';
      maxNodes?: number;
      nodeTypes?: string[];
      verticals?: string[];
      includeInactive?: boolean;
    } = {}
  ): Promise<GraphLayout> {
    try {
      const {
        layout = 'force',
        maxNodes = 500,
        nodeTypes,
        verticals,
        includeInactive = false
      } = options;

      const cacheKey = `full_${layout}_${maxNodes}_${JSON.stringify(nodeTypes)}_${JSON.stringify(verticals)}_${includeInactive}`;
      
      // Check cache
      const cached = this.layoutCache.get(cacheKey);
      if (cached && Date.now() - new Date(cached.metadata.timestamp).getTime() < this.cacheTimeout) {
        return cached;
      }

      // Get nodes
      let nodesQuery = db.select().from(semanticNodes);
      
      if (!includeInactive) {
        nodesQuery = nodesQuery.where(eq(semanticNodes.status, 'active'));
      }
      
      if (nodeTypes?.length) {
        nodesQuery = nodesQuery.where(inArray(semanticNodes.nodeType, nodeTypes));
      }
      
      if (verticals?.length) {
        nodesQuery = nodesQuery.where(inArray(semanticNodes.verticalId, verticals));
      }
      
      const nodes = await nodesQuery.limit(maxNodes);

      // Get edges for these nodes
      const nodeIds = nodes.map(n => n.id);
      const edges = await db.select()
        .from(semanticEdges)
        .where(
          and(
            inArray(semanticEdges.fromNodeId, nodeIds),
            inArray(semanticEdges.toNodeId, nodeIds),
            eq(semanticEdges.isActive, true)
          )
        );

      // Convert to graph format
      const graphNodes = await this.convertNodesToGraphNodes(nodes);
      const graphEdges = await this.convertEdgesToGraphEdges(edges);

      // Generate clusters
      const clusters = await this.generateClusters(graphNodes, graphEdges);

      // Apply layout algorithm
      const layoutData = this.applyLayout(graphNodes, graphEdges, layout);

      const result: GraphLayout = {
        nodes: layoutData.nodes,
        edges: graphEdges,
        clusters,
        metadata: {
          totalNodes: graphNodes.length,
          totalEdges: graphEdges.length,
          totalClusters: clusters.length,
          layout,
          timestamp: new Date().toISOString(),
        },
      };

      // Cache result
      this.layoutCache.set(cacheKey, result);

      return result;

    } catch (error) {
      console.error("Error generating full graph layout:", error);
      throw new Error("Failed to generate graph layout");
    }
  }

  async getIntentClusterGraph(
    clusterId?: string,
    options: {
      includeNodes?: boolean;
      includeJourneys?: boolean;
      maxNodes?: number;
    } = {}
  ): Promise<GraphLayout> {
    try {
      const { includeNodes = true, includeJourneys = true, maxNodes = 100 } = options;

      const intentClusters = intentGraphEngine.getIntentClusters();
      const graphNodes: GraphNode[] = [];
      const graphEdges: GraphEdge[] = [];
      const clusters: GraphCluster[] = [];

      // If specific cluster requested
      if (clusterId) {
        const cluster = intentClusters.get(clusterId);
        if (!cluster) {
          throw new Error(`Intent cluster ${clusterId} not found`);
        }

        // Create cluster visualization
        const clusterNode: GraphNode = {
          id: cluster.id,
          label: cluster.name,
          type: 'intent_cluster',
          size: Math.max(20, cluster.weight * 10),
          color: this.getNodeColor('intent_cluster'),
          metadata: {
            keywords: cluster.keywords,
            nodeCount: cluster.nodes.length,
            weight: cluster.weight,
          },
          metrics: {
            clickThroughRate: 0,
            conversionRate: 0,
            engagement: cluster.weight,
            connections: cluster.nodes.length,
          },
        };

        graphNodes.push(clusterNode);

        // Add connected content nodes if requested
        if (includeNodes && cluster.nodes.length > 0) {
          const nodeData = await db.select()
            .from(semanticNodes)
            .where(inArray(semanticNodes.slug, cluster.nodes.slice(0, maxNodes)));

          const contentNodes = await this.convertNodesToGraphNodes(nodeData);
          graphNodes.push(...contentNodes);

          // Add edges from cluster to content
          for (const contentNode of contentNodes) {
            graphEdges.push({
              id: `${cluster.id}_${contentNode.id}`,
              source: cluster.id,
              target: contentNode.id,
              type: 'contains',
              weight: 1.0,
              color: '#cccccc',
              metadata: { relationship: 'intent_mapping' },
              metrics: {
                traversalCount: 0,
                conversionRate: 0,
                averageTime: 0,
              },
            });
          }
        }
      } else {
        // Create overview of all clusters
        for (const [id, cluster] of intentClusters) {
          const clusterNode: GraphNode = {
            id: cluster.id,
            label: cluster.name,
            type: 'intent_cluster',
            size: Math.max(15, cluster.weight * 8),
            color: this.getNodeColor('intent_cluster'),
            metadata: {
              keywords: cluster.keywords,
              nodeCount: cluster.nodes.length,
              weight: cluster.weight,
            },
            metrics: {
              clickThroughRate: 0,
              conversionRate: 0,
              engagement: cluster.weight,
              connections: cluster.nodes.length,
            },
          };

          graphNodes.push(clusterNode);
        }

        // Add journey paths between clusters if requested
        if (includeJourneys) {
          const journeyPaths = intentGraphEngine.getJourneyPaths();
          
          for (const [pathKey, path] of journeyPaths) {
            const sourceExists = graphNodes.find(n => n.id === path.from);
            const targetExists = graphNodes.find(n => n.id === path.to);
            
            if (sourceExists && targetExists) {
              graphEdges.push({
                id: pathKey,
                source: path.from,
                target: path.to,
                type: 'journey_path',
                weight: path.weight,
                color: this.getEdgeColorByWeight(path.conversionRate),
                metadata: {
                  frequency: path.frequency,
                  conversionRate: path.conversionRate,
                  averageTime: path.averageTime,
                },
                metrics: {
                  traversalCount: path.frequency,
                  conversionRate: path.conversionRate,
                  averageTime: path.averageTime,
                },
              });
            }
          }
        }
      }

      // Apply force-directed layout for intent clusters
      const layoutData = this.applyLayout(graphNodes, graphEdges, 'force');

      return {
        nodes: layoutData.nodes,
        edges: graphEdges,
        clusters,
        metadata: {
          totalNodes: graphNodes.length,
          totalEdges: graphEdges.length,
          totalClusters: clusters.length,
          layout: 'force',
          timestamp: new Date().toISOString(),
        },
      };

    } catch (error) {
      console.error("Error generating intent cluster graph:", error);
      throw new Error("Failed to generate intent cluster graph");
    }
  }

  async getNodeNeighborhood(
    nodeId: string,
    options: {
      depth?: number;
      maxNodes?: number;
      includeMetrics?: boolean;
    } = {}
  ): Promise<GraphLayout> {
    try {
      const { depth = 2, maxNodes = 50, includeMetrics = true } = options;

      // Get the central node
      const centralNode = await db.select()
        .from(semanticNodes)
        .where(eq(semanticNodes.id, parseInt(nodeId)))
        .limit(1);

      if (centralNode.length === 0) {
        throw new Error(`Node ${nodeId} not found`);
      }

      const allNodes = new Map<number, SemanticNode>();
      const allEdges = new Map<string, SemanticEdge>();

      // Start with central node
      allNodes.set(centralNode[0].id, centralNode[0]);

      // Expand neighborhood by depth
      let currentNodes = new Set([centralNode[0].id]);

      for (let d = 0; d < depth; d++) {
        const nextNodes = new Set<number>();

        // Get edges from current nodes
        const outgoingEdges = await db.select()
          .from(semanticEdges)
          .where(
            and(
              inArray(semanticEdges.fromNodeId, Array.from(currentNodes)),
              eq(semanticEdges.isActive, true)
            )
          );

        // Get edges to current nodes
        const incomingEdges = await db.select()
          .from(semanticEdges)
          .where(
            and(
              inArray(semanticEdges.toNodeId, Array.from(currentNodes)),
              eq(semanticEdges.isActive, true)
            )
          );

        // Process edges and collect new nodes
        for (const edge of [...outgoingEdges, ...incomingEdges]) {
          allEdges.set(`${edge.fromNodeId}_${edge.toNodeId}_${edge.edgeType}`, edge);
          
          if (!allNodes.has(edge.toNodeId)) {
            nextNodes.add(edge.toNodeId);
          }
          if (!allNodes.has(edge.fromNodeId)) {
            nextNodes.add(edge.fromNodeId);
          }
        }

        // Get node data for new nodes
        if (nextNodes.size > 0) {
          const newNodeData = await db.select()
            .from(semanticNodes)
            .where(inArray(semanticNodes.id, Array.from(nextNodes)))
            .limit(maxNodes - allNodes.size);

          for (const node of newNodeData) {
            allNodes.set(node.id, node);
          }
        }

        currentNodes = nextNodes;

        // Stop if we've reached max nodes
        if (allNodes.size >= maxNodes) break;
      }

      // Convert to graph format
      const graphNodes = await this.convertNodesToGraphNodes(Array.from(allNodes.values()));
      const graphEdges = await this.convertEdgesToGraphEdges(Array.from(allEdges.values()));

      // Generate micro-clusters for neighborhood
      const clusters = await this.generateClusters(graphNodes, graphEdges);

      // Apply layout with central node at center
      const layoutData = this.applyLayout(graphNodes, graphEdges, 'force');

      return {
        nodes: layoutData.nodes,
        edges: graphEdges,
        clusters,
        metadata: {
          totalNodes: graphNodes.length,
          totalEdges: graphEdges.length,
          totalClusters: clusters.length,
          layout: 'force',
          timestamp: new Date().toISOString(),
        },
      };

    } catch (error) {
      console.error("Error generating node neighborhood:", error);
      throw new Error("Failed to generate node neighborhood");
    }
  }

  /**
   * ANALYTICS AND INSIGHTS
   */
  async getGraphAnalytics(
    options: {
      timeframe?: 'hour' | 'day' | 'week' | 'month';
      nodeTypes?: string[];
      verticals?: string[];
    } = {}
  ): Promise<GraphAnalytics> {
    try {
      const { timeframe = 'day', nodeTypes, verticals } = options;

      const cacheKey = `analytics_${timeframe}_${JSON.stringify(nodeTypes)}_${JSON.stringify(verticals)}`;
      
      // Check cache
      const cached = this.analyticsCache.get(cacheKey);
      if (cached) {
        return cached;
      }

      // Get overview statistics
      const overview = await this.calculateOverviewStats(nodeTypes, verticals);

      // Get performance metrics
      const performance = await this.calculatePerformanceMetrics(timeframe, nodeTypes, verticals);

      // Get insights
      const insights = await this.generateInsights(timeframe);

      const analytics: GraphAnalytics = {
        overview,
        performance,
        insights,
      };

      // Cache result
      this.analyticsCache.set(cacheKey, analytics);
      setTimeout(() => this.analyticsCache.delete(cacheKey), this.cacheTimeout);

      return analytics;

    } catch (error) {
      console.error("Error generating graph analytics:", error);
      throw new Error("Failed to generate graph analytics");
    }
  }

  /**
   * UTILITY METHODS
   */
  private async convertNodesToGraphNodes(nodes: SemanticNode[]): Promise<GraphNode[]> {
    return nodes.map(node => ({
      id: node.id.toString(),
      label: node.title,
      type: node.nodeType,
      size: Math.max(10, (node.clickThroughRate || 0) * 50 + 10),
      color: this.getNodeColor(node.nodeType),
      metadata: {
        slug: node.slug,
        description: node.description,
        verticalId: node.verticalId,
        status: node.status,
        lastOptimized: node.lastOptimized,
      },
      metrics: {
        clickThroughRate: node.clickThroughRate || 0,
        conversionRate: node.conversionRate || 0,
        engagement: node.engagement || 0,
        connections: 0, // Will be calculated later
      },
    }));
  }

  private async convertEdgesToGraphEdges(edges: SemanticEdge[]): Promise<GraphEdge[]> {
    return edges.map(edge => ({
      id: `${edge.fromNodeId}_${edge.toNodeId}_${edge.edgeType}`,
      source: edge.fromNodeId.toString(),
      target: edge.toNodeId.toString(),
      type: edge.edgeType,
      weight: edge.weight || 1.0,
      color: this.getEdgeColor(edge.edgeType),
      metadata: {
        confidence: edge.confidence,
        createdBy: edge.createdBy,
        clickCount: edge.clickCount,
        conversionCount: edge.conversionCount,
      },
      metrics: {
        traversalCount: edge.clickCount || 0,
        conversionRate: edge.conversionCount && edge.clickCount 
          ? edge.conversionCount / edge.clickCount 
          : 0,
        averageTime: 0, // Would need additional tracking
      },
    }));
  }

  private async generateClusters(nodes: GraphNode[], edges: GraphEdge[]): Promise<GraphCluster[]> {
    // Simple clustering based on node types and connections
    const clusters = new Map<string, GraphNode[]>();

    // Group nodes by type first
    for (const node of nodes) {
      if (!clusters.has(node.type)) {
        clusters.set(node.type, []);
      }
      clusters.get(node.type)!.push(node);
    }

    // Convert to cluster format
    const result: GraphCluster[] = [];
    let clusterIndex = 0;

    for (const [type, clusterNodes] of clusters) {
      if (clusterNodes.length > 1) {
        result.push({
          id: `cluster_${clusterIndex++}`,
          name: `${type.charAt(0).toUpperCase() + type.slice(1)} Cluster`,
          nodes: clusterNodes.map(n => n.id),
          color: this.getNodeColor(type),
          centroid: this.calculateClusterCentroid(clusterNodes),
          metrics: {
            size: clusterNodes.length,
            density: this.calculateClusterDensity(clusterNodes, edges),
            coherence: this.calculateClusterCoherence(clusterNodes),
          },
        });
      }
    }

    return result;
  }

  private applyLayout(
    nodes: GraphNode[], 
    edges: GraphEdge[], 
    layout: 'force' | 'hierarchical' | 'circular' | 'grid'
  ): { nodes: GraphNode[] } {
    // Simple layout algorithms (in production, would use sophisticated graph layout libraries)
    const layoutNodes = [...nodes];

    switch (layout) {
      case 'force':
        this.applyForceDirectedLayout(layoutNodes, edges);
        break;
      case 'hierarchical':
        this.applyHierarchicalLayout(layoutNodes, edges);
        break;
      case 'circular':
        this.applyCircularLayout(layoutNodes);
        break;
      case 'grid':
        this.applyGridLayout(layoutNodes);
        break;
    }

    return { nodes: layoutNodes };
  }

  private applyForceDirectedLayout(nodes: GraphNode[], edges: GraphEdge[]): void {
    // Simplified force-directed layout
    const width = 800;
    const height = 600;

    nodes.forEach((node, index) => {
      const angle = (index / nodes.length) * 2 * Math.PI;
      const radius = Math.min(width, height) / 3;
      
      node.position = {
        x: width / 2 + Math.cos(angle) * radius + (Math.random() - 0.5) * 100,
        y: height / 2 + Math.sin(angle) * radius + (Math.random() - 0.5) * 100,
      };
    });
  }

  private applyHierarchicalLayout(nodes: GraphNode[], edges: GraphEdge[]): void {
    // Simple hierarchical layout
    const levels = new Map<string, number>();
    
    // Assign levels based on node types
    const typeLevels: Record<string, number> = {
      'page': 0,
      'quiz': 1,
      'offer': 2,
      'cta': 3,
      'user_archetype': 4,
    };

    nodes.forEach((node, index) => {
      const level = typeLevels[node.type] || 0;
      const x = (index % 10) * 80 + 50;
      const y = level * 100 + 50;
      
      node.position = { x, y };
    });
  }

  private applyCircularLayout(nodes: GraphNode[]): void {
    const centerX = 400;
    const centerY = 300;
    const radius = 200;

    nodes.forEach((node, index) => {
      const angle = (index / nodes.length) * 2 * Math.PI;
      node.position = {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      };
    });
  }

  private applyGridLayout(nodes: GraphNode[]): void {
    const cols = Math.ceil(Math.sqrt(nodes.length));
    
    nodes.forEach((node, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      node.position = {
        x: col * 100 + 50,
        y: row * 100 + 50,
      };
    });
  }

  private async calculateOverviewStats(
    nodeTypes?: string[], 
    verticals?: string[]
  ): Promise<GraphAnalytics['overview']> {
    let nodeQuery = db.select({ count: count() }).from(semanticNodes);
    let edgeQuery = db.select({ count: count() }).from(semanticEdges);

    if (nodeTypes?.length) {
      nodeQuery = nodeQuery.where(inArray(semanticNodes.nodeType, nodeTypes));
    }
    if (verticals?.length) {
      nodeQuery = nodeQuery.where(inArray(semanticNodes.verticalId, verticals));
    }

    const [nodeCount, edgeCount] = await Promise.all([
      nodeQuery,
      edgeQuery
    ]);

    const intentClusters = intentGraphEngine.getIntentClusters();

    return {
      nodeCount: nodeCount[0].count,
      edgeCount: edgeCount[0].count,
      clusterCount: intentClusters.size,
      avgDegree: edgeCount[0].count > 0 ? (edgeCount[0].count * 2) / nodeCount[0].count : 0,
      density: nodeCount[0].count > 1 
        ? edgeCount[0].count / (nodeCount[0].count * (nodeCount[0].count - 1) / 2) 
        : 0,
      components: 1, // Simplified
    };
  }

  private async calculatePerformanceMetrics(
    timeframe: string,
    nodeTypes?: string[],
    verticals?: string[]
  ): Promise<GraphAnalytics['performance']> {
    // Get top performing nodes
    let topNodesQuery = db.select()
      .from(semanticNodes)
      .orderBy(desc(semanticNodes.clickThroughRate))
      .limit(10);

    if (nodeTypes?.length) {
      topNodesQuery = topNodesQuery.where(inArray(semanticNodes.nodeType, nodeTypes));
    }

    const topNodes = await topNodesQuery;

    // Get analytics data for performance metrics
    const performanceData = await db.select()
      .from(graphAnalytics)
      .where(eq(graphAnalytics.timeframe, timeframe))
      .orderBy(desc(graphAnalytics.value))
      .limit(100);

    return {
      topPerformingNodes: topNodes.map(node => ({
        node: node.slug,
        score: (node.clickThroughRate || 0) * (node.conversionRate || 0),
        type: node.nodeType,
      })),
      topPerformingPaths: [], // Would be calculated from journey data
      lowPerformingNodes: [], // Would identify nodes with issues
    };
  }

  private async generateInsights(timeframe: string): Promise<GraphAnalytics['insights']> {
    const intentClusters = intentGraphEngine.getIntentClusters();
    const journeyPaths = intentGraphEngine.getJourneyPaths();

    return {
      intentClusters: Array.from(intentClusters.values()).map(cluster => ({
        cluster: cluster.name,
        strength: cluster.weight,
        keywords: cluster.keywords,
      })),
      journeyPatterns: Array.from(journeyPaths.values())
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 10)
        .map(path => ({
          pattern: `${path.from} → ${path.to}`,
          frequency: path.frequency,
          success: path.conversionRate,
        })),
      optimizationOpportunities: [
        {
          type: 'orphan_nodes',
          description: 'Nodes with no incoming edges',
          impact: 0.7,
        },
        {
          type: 'low_conversion_paths',
          description: 'High-traffic paths with low conversion',
          impact: 0.8,
        },
      ],
    };
  }

  private initializeColorMap(): void {
    this.nodeColorMap.set('page', '#3498db');
    this.nodeColorMap.set('quiz', '#e74c3c');
    this.nodeColorMap.set('offer', '#2ecc71');
    this.nodeColorMap.set('cta', '#f39c12');
    this.nodeColorMap.set('user_archetype', '#9b59b6');
    this.nodeColorMap.set('neuron', '#1abc9c');
    this.nodeColorMap.set('blog_post', '#34495e');
    this.nodeColorMap.set('intent_cluster', '#e67e22');
    this.nodeColorMap.set('default', '#95a5a6');
  }

  private getNodeColor(nodeType: string): string {
    return this.nodeColorMap.get(nodeType) || this.nodeColorMap.get('default')!;
  }

  private getEdgeColor(edgeType: string): string {
    const edgeColors: Record<string, string> = {
      'related_to': '#bdc3c7',
      'solves': '#27ae60',
      'leads_to': '#3498db',
      'matches_intent': '#e74c3c',
      'triggered_by': '#f39c12',
      'journey_path': '#9b59b6',
    };
    
    return edgeColors[edgeType] || '#95a5a6';
  }

  private getEdgeColorByWeight(weight: number): string {
    if (weight > 0.8) return '#27ae60'; // Green for high performance
    if (weight > 0.5) return '#f39c12'; // Orange for medium performance
    return '#e74c3c'; // Red for low performance
  }

  private calculateClusterCentroid(nodes: GraphNode[]): { x: number; y: number } {
    if (nodes.length === 0) return { x: 0, y: 0 };
    
    const totalX = nodes.reduce((sum, node) => sum + (node.position?.x || 0), 0);
    const totalY = nodes.reduce((sum, node) => sum + (node.position?.y || 0), 0);
    
    return {
      x: totalX / nodes.length,
      y: totalY / nodes.length,
    };
  }

  private calculateClusterDensity(nodes: GraphNode[], edges: GraphEdge[]): number {
    if (nodes.length < 2) return 0;
    
    const nodeIds = new Set(nodes.map(n => n.id));
    const internalEdges = edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));
    
    const maxPossibleEdges = nodes.length * (nodes.length - 1) / 2;
    return maxPossibleEdges > 0 ? internalEdges.length / maxPossibleEdges : 0;
  }

  private calculateClusterCoherence(nodes: GraphNode[]): number {
    // Simplified coherence calculation based on node metrics
    if (nodes.length === 0) return 0;
    
    const avgEngagement = nodes.reduce((sum, node) => sum + node.metrics.engagement, 0) / nodes.length;
    return Math.min(1, avgEngagement);
  }
}

// Singleton instance
export const graphVisualizationAPI = new GraphVisualizationAPI();

// Validation schemas
export const graphLayoutRequestSchema = z.object({
  layout: z.enum(['force', 'hierarchical', 'circular', 'grid']).default('force'),
  maxNodes: z.number().min(10).max(1000).default(500),
  nodeTypes: z.array(z.string()).optional(),
  verticals: z.array(z.string()).optional(),
  includeInactive: z.boolean().default(false),
});

export const neighborhoodRequestSchema = z.object({
  nodeId: z.string().min(1),
  depth: z.number().min(1).max(5).default(2),
  maxNodes: z.number().min(5).max(200).default(50),
  includeMetrics: z.boolean().default(true),
});

export const analyticsRequestSchema = z.object({
  timeframe: z.enum(['hour', 'day', 'week', 'month']).default('day'),
  nodeTypes: z.array(z.string()).optional(),
  verticals: z.array(z.string()).optional(),
});