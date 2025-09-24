import { db } from "../../db";
import { 
  federationMemorySync, memoryNodes, memoryEdges,
  type FederationMemorySync, type NewFederationMemorySync,
  type MemoryNode, type MemoryEdge
} from "../../../shared/knowledgeMemoryTables";
import { knowledgeMemoryGraph } from "./knowledgeMemoryGraph";
import { eq, desc, and, inArray } from "drizzle-orm";
import axios from "axios";

interface NeuronConnection {
  neuronId: string;
  baseUrl: string;
  apiKey: string;
  permissions: string[];
  lastSyncAt?: Date;
  isOnline: boolean;
}

interface SyncConfiguration {
  syncInterval: number; // minutes
  batchSize: number;
  retryAttempts: number;
  conflictResolution: 'source_wins' | 'target_wins' | 'merge' | 'manual';
  syncDirection: 'push' | 'pull' | 'bidirectional';
  filterRules: {
    nodeTypes?: string[];
    qualityThreshold?: number;
    maxAge?: number; // days
    userArchetypes?: string[];
  };
}

/**
 * Federation Memory Sync - Cross-neuron knowledge sharing and synchronization
 * Enables real-time memory sharing across the entire Findawise Empire federation
 */
export class FederationMemorySync {
  private connectedNeurons: Map<string, NeuronConnection> = new Map();
  private syncConfiguration: SyncConfiguration;
  private syncInProgress: Map<string, boolean> = new Map();
  private eventHooks: Map<string, Function[]> = new Map();

  constructor() {
    this.syncConfiguration = {
      syncInterval: 15, // 15 minutes
      batchSize: 50,
      retryAttempts: 3,
      conflictResolution: 'merge',
      syncDirection: 'bidirectional',
      filterRules: {
        qualityThreshold: 0.6,
        maxAge: 30 // 30 days
      }
    };

    this.initializeFederationSync();
  }

  /**
   * Initialize federation memory sync system
   */
  private async initializeFederationSync(): Promise<void> {
    try {
      console.log('🧠 Initializing Federation Memory Sync...');

      // Load connected neurons from configuration
      await this.loadConnectedNeurons();

      // Start periodic sync scheduler
      this.startSyncScheduler();

      // Register event hooks
      this.registerEventHooks();

      console.log(`✅ Federation Memory Sync initialized with ${this.connectedNeurons.size} connected neurons`);
    } catch (error) {
      console.error('Error initializing Federation Memory Sync:', error);
    }
  }

  /**
   * Register a new neuron for memory synchronization
   */
  async registerNeuron(neuronData: {
    neuronId: string;
    baseUrl: string;
    apiKey: string;
    permissions: string[];
    syncConfiguration?: Partial<SyncConfiguration>;
  }): Promise<void> {
    try {
      const connection: NeuronConnection = {
        neuronId: neuronData.neuronId,
        baseUrl: neuronData.baseUrl.replace(/\/$/, ''), // Remove trailing slash
        apiKey: neuronData.apiKey,
        permissions: neuronData.permissions,
        isOnline: false
      };

      // Test connection
      const isOnline = await this.testNeuronConnection(connection);
      connection.isOnline = isOnline;

      this.connectedNeurons.set(neuronData.neuronId, connection);

      // Perform initial sync if connection is successful
      if (isOnline) {
        await this.performInitialSync(neuronData.neuronId);
      }

      console.log(`🔗 Registered neuron: ${neuronData.neuronId} (online: ${isOnline})`);
    } catch (error) {
      console.error(`Error registering neuron ${neuronData.neuronId}:`, error);
      throw error;
    }
  }

  /**
   * Sync memory with all connected neurons
   */
  async syncWithAllNeurons(): Promise<void> {
    console.log('🔄 Starting federation-wide memory sync...');

    const syncPromises = Array.from(this.connectedNeurons.keys()).map(neuronId =>
      this.syncWithNeuron(neuronId).catch(error => {
        console.error(`Sync failed for neuron ${neuronId}:`, error);
        return { neuronId, error: error.message };
      })
    );

    const results = await Promise.allSettled(syncPromises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.length - successful;

    console.log(`✅ Federation sync complete: ${successful} successful, ${failed} failed`);
  }

  /**
   * Sync memory with a specific neuron
   */
  async syncWithNeuron(neuronId: string): Promise<FederationMemorySync> {
    if (this.syncInProgress.get(neuronId)) {
      throw new Error(`Sync already in progress for neuron ${neuronId}`);
    }

    this.syncInProgress.set(neuronId, true);

    try {
      const connection = this.connectedNeurons.get(neuronId);
      if (!connection) {
        throw new Error(`Neuron ${neuronId} not found in connected neurons`);
      }

      // Test connection before sync
      const isOnline = await this.testNeuronConnection(connection);
      if (!isOnline) {
        throw new Error(`Neuron ${neuronId} is offline`);
      }

      const startTime = new Date();
      let syncRecord: FederationMemorySync;

      try {
        // Create sync record
        const [record] = await db.insert(federationMemorySync).values({
          sourceNeuron: 'findawise-empire-core',
          targetNeuron: neuronId,
          syncType: this.syncConfiguration.syncDirection,
          syncStatus: 'in_progress',
          triggeredBy: 'scheduler'
        }).returning();

        syncRecord = record;

        let successCount = 0;
        let failureCount = 0;
        const errors: string[] = [];
        const nodesSynced: string[] = [];
        const edgesSynced: string[] = [];

        // Perform bidirectional sync
        if (this.syncConfiguration.syncDirection === 'push' || this.syncConfiguration.syncDirection === 'bidirectional') {
          const pushResult = await this.pushMemoryToNeuron(connection);
          successCount += pushResult.successCount;
          failureCount += pushResult.failureCount;
          errors.push(...pushResult.errors);
          nodesSynced.push(...pushResult.nodesSynced);
          edgesSynced.push(...pushResult.edgesSynced);
        }

        if (this.syncConfiguration.syncDirection === 'pull' || this.syncConfiguration.syncDirection === 'bidirectional') {
          const pullResult = await this.pullMemoryFromNeuron(connection);
          successCount += pullResult.successCount;
          failureCount += pullResult.failureCount;
          errors.push(...pullResult.errors);
          nodesSynced.push(...pullResult.nodesSynced);
          edgesSynced.push(...pullResult.edgesSynced);
        }

        // Update sync record
        await db.update(federationMemorySync)
          .set({
            syncStatus: 'completed',
            successCount,
            failureCount,
            errors: errors.slice(0, 10), // Limit error array size
            nodesSynced,
            edgesSynced,
            endTime: new Date(),
            totalTime: Date.now() - startTime.getTime()
          })
          .where(eq(federationMemorySync.id, record.id));

        // Update last sync time for neuron
        connection.lastSyncAt = new Date();

        console.log(`✅ Sync completed for ${neuronId}: ${successCount} successful, ${failureCount} failed`);
        return record;

      } catch (syncError) {
        // Update sync record with failure
        if (syncRecord!) {
          await db.update(federationMemorySync)
            .set({
              syncStatus: 'failed',
              errors: [syncError.message],
              endTime: new Date(),
              totalTime: Date.now() - startTime.getTime()
            })
            .where(eq(federationMemorySync.id, syncRecord.id));
        }
        throw syncError;
      }

    } finally {
      this.syncInProgress.set(neuronId, false);
    }
  }

  /**
   * Push memory nodes to target neuron
   */
  private async pushMemoryToNeuron(connection: NeuronConnection): Promise<{
    successCount: number;
    failureCount: number;
    errors: string[];
    nodesSynced: string[];
    edgesSynced: string[];
  }> {
    const result = {
      successCount: 0,
      failureCount: 0,
      errors: [] as string[],
      nodesSynced: [] as string[],
      edgesSynced: [] as string[]
    };

    try {
      // Get eligible nodes for sync
      const eligibleNodes = await this.getEligibleNodesForSync(connection.lastSyncAt);
      
      // Sync nodes in batches
      for (let i = 0; i < eligibleNodes.length; i += this.syncConfiguration.batchSize) {
        const batch = eligibleNodes.slice(i, i + this.syncConfiguration.batchSize);
        
        try {
          const response = await axios.post(
            `${connection.baseUrl}/api/memory/sync/receive-nodes`,
            {
              nodes: batch,
              sourceNeuron: 'findawise-empire-core'
            },
            {
              headers: {
                'Authorization': `Bearer ${connection.apiKey}`,
                'Content-Type': 'application/json'
              },
              timeout: 30000 // 30 second timeout
            }
          );

          if (response.data.success) {
            result.successCount += batch.length;
            result.nodesSynced.push(...batch.map(node => node.nodeId));
          } else {
            result.failureCount += batch.length;
            result.errors.push(`Batch sync failed: ${response.data.error || 'Unknown error'}`);
          }

        } catch (batchError) {
          result.failureCount += batch.length;
          result.errors.push(`Batch sync error: ${batchError.message}`);
        }
      }

      // Sync edges
      const eligibleEdges = await this.getEligibleEdgesForSync(connection.lastSyncAt);
      
      if (eligibleEdges.length > 0) {
        try {
          const response = await axios.post(
            `${connection.baseUrl}/api/memory/sync/receive-edges`,
            {
              edges: eligibleEdges,
              sourceNeuron: 'findawise-empire-core'
            },
            {
              headers: {
                'Authorization': `Bearer ${connection.apiKey}`,
                'Content-Type': 'application/json'
              },
              timeout: 30000
            }
          );

          if (response.data.success) {
            result.edgesSynced.push(...eligibleEdges.map(edge => edge.edgeId));
          } else {
            result.errors.push(`Edge sync failed: ${response.data.error || 'Unknown error'}`);
          }

        } catch (edgeError) {
          result.errors.push(`Edge sync error: ${edgeError.message}`);
        }
      }

    } catch (error) {
      result.errors.push(`Push operation failed: ${error.message}`);
    }

    return result;
  }

  /**
   * Pull memory nodes from target neuron
   */
  private async pullMemoryFromNeuron(connection: NeuronConnection): Promise<{
    successCount: number;
    failureCount: number;
    errors: string[];
    nodesSynced: string[];
    edgesSynced: string[];
  }> {
    const result = {
      successCount: 0,
      failureCount: 0,
      errors: [] as string[],
      nodesSynced: [] as string[],
      edgesSynced: [] as string[]
    };

    try {
      // Request nodes from target neuron
      const response = await axios.get(
        `${connection.baseUrl}/api/memory/sync/export-nodes`,
        {
          headers: {
            'Authorization': `Bearer ${connection.apiKey}`
          },
          params: {
            since: connection.lastSyncAt?.toISOString(),
            limit: this.syncConfiguration.batchSize
          },
          timeout: 30000
        }
      );

      if (response.data.success && response.data.nodes) {
        const incomingNodes = response.data.nodes;

        for (const nodeData of incomingNodes) {
          try {
            // Check for conflicts and resolve
            const existingNode = await this.findExistingNode(nodeData);
            
            if (existingNode) {
              await this.resolveNodeConflict(existingNode, nodeData, connection.neuronId);
            } else {
              await this.importNode(nodeData, connection.neuronId);
            }

            result.successCount++;
            result.nodesSynced.push(nodeData.nodeId);

          } catch (nodeError) {
            result.failureCount++;
            result.errors.push(`Node import error: ${nodeError.message}`);
          }
        }
      }

      // Pull edges
      const edgeResponse = await axios.get(
        `${connection.baseUrl}/api/memory/sync/export-edges`,
        {
          headers: {
            'Authorization': `Bearer ${connection.apiKey}`
          },
          params: {
            since: connection.lastSyncAt?.toISOString()
          },
          timeout: 30000
        }
      );

      if (edgeResponse.data.success && edgeResponse.data.edges) {
        const incomingEdges = edgeResponse.data.edges;

        for (const edgeData of incomingEdges) {
          try {
            await this.importEdge(edgeData, connection.neuronId);
            result.edgesSynced.push(edgeData.edgeId);
          } catch (edgeError) {
            result.errors.push(`Edge import error: ${edgeError.message}`);
          }
        }
      }

    } catch (error) {
      result.errors.push(`Pull operation failed: ${error.message}`);
    }

    return result;
  }

  /**
   * Test connection to a neuron
   */
  private async testNeuronConnection(connection: NeuronConnection): Promise<boolean> {
    try {
      const response = await axios.get(
        `${connection.baseUrl}/api/memory/sync/health`,
        {
          headers: {
            'Authorization': `Bearer ${connection.apiKey}`
          },
          timeout: 10000 // 10 second timeout
        }
      );

      return response.status === 200 && response.data.status === 'healthy';
    } catch (error) {
      console.warn(`Connection test failed for ${connection.neuronId}:`, error.message);
      return false;
    }
  }

  /**
   * Get eligible nodes for synchronization
   */
  private async getEligibleNodesForSync(lastSyncAt?: Date): Promise<MemoryNode[]> {
    let whereClause = eq(memoryNodes.status, 'active');

    if (lastSyncAt) {
      whereClause = and(whereClause, sql`${memoryNodes.lastUpdated} > ${lastSyncAt}`);
    }

    // Apply filter rules
    if (this.syncConfiguration.filterRules.qualityThreshold) {
      whereClause = and(whereClause, sql`${memoryNodes.qualityScore} >= ${this.syncConfiguration.filterRules.qualityThreshold}`);
    }

    if (this.syncConfiguration.filterRules.nodeTypes) {
      whereClause = and(whereClause, inArray(memoryNodes.nodeType, this.syncConfiguration.filterRules.nodeTypes));
    }

    const nodes = await db.select()
      .from(memoryNodes)
      .where(whereClause)
      .orderBy(desc(memoryNodes.lastUpdated))
      .limit(this.syncConfiguration.batchSize * 2); // Get more than batch size for selection

    return nodes;
  }

  /**
   * Get eligible edges for synchronization
   */
  private async getEligibleEdgesForSync(lastSyncAt?: Date): Promise<MemoryEdge[]> {
    let whereClause = eq(memoryEdges.status, 'active');

    if (lastSyncAt) {
      whereClause = and(whereClause, sql`${memoryEdges.createdAt} > ${lastSyncAt}`);
    }

    const edges = await db.select()
      .from(memoryEdges)
      .where(whereClause)
      .orderBy(desc(memoryEdges.createdAt))
      .limit(100); // Limit edges per sync

    return edges;
  }

  /**
   * Find existing node by slug or nodeId
   */
  private async findExistingNode(nodeData: any): Promise<MemoryNode | null> {
    const nodes = await db.select()
      .from(memoryNodes)
      .where(eq(memoryNodes.slug, nodeData.slug))
      .limit(1);

    return nodes.length > 0 ? nodes[0] : null;
  }

  /**
   * Resolve node conflicts using configured strategy
   */
  private async resolveNodeConflict(
    existingNode: MemoryNode,
    incomingNode: any,
    sourceNeuron: string
  ): Promise<void> {
    switch (this.syncConfiguration.conflictResolution) {
      case 'source_wins':
        // Keep existing node, ignore incoming
        break;

      case 'target_wins':
        // Update with incoming node data
        await this.updateExistingNode(existingNode, incomingNode, sourceNeuron);
        break;

      case 'merge':
        // Merge node data intelligently
        await this.mergeNodes(existingNode, incomingNode, sourceNeuron);
        break;

      case 'manual':
        // Flag for manual review
        await this.flagForManualReview(existingNode, incomingNode, sourceNeuron);
        break;
    }
  }

  /**
   * Import new node from external neuron
   */
  private async importNode(nodeData: any, sourceNeuron: string): Promise<void> {
    await knowledgeMemoryGraph.addMemoryNode({
      ...nodeData,
      sourceType: 'federation_sync',
      sourceId: nodeData.nodeId,
      createdBy: 1, // System user
      metadata: {
        ...nodeData.metadata,
        federationSource: sourceNeuron,
        originalCreatedAt: nodeData.createdAt
      }
    });
  }

  /**
   * Import edge from external neuron
   */
  private async importEdge(edgeData: any, sourceNeuron: string): Promise<void> {
    await knowledgeMemoryGraph.createMemoryEdge({
      ...edgeData,
      createdBy: 1, // System user
      metadata: {
        ...edgeData.metadata,
        federationSource: sourceNeuron
      }
    });
  }

  /**
   * Update existing node with incoming data
   */
  private async updateExistingNode(
    existingNode: MemoryNode,
    incomingNode: any,
    sourceNeuron: string
  ): Promise<void> {
    // Update only if incoming node is newer or has higher quality
    const shouldUpdate = 
      new Date(incomingNode.lastUpdated) > new Date(existingNode.lastUpdated) ||
      incomingNode.qualityScore > existingNode.qualityScore;

    if (shouldUpdate) {
      await db.update(memoryNodes)
        .set({
          content: incomingNode.content,
          summary: incomingNode.summary,
          qualityScore: Math.max(existingNode.qualityScore, incomingNode.qualityScore),
          lastUpdated: new Date(),
          metadata: {
            ...existingNode.metadata,
            federationUpdatedBy: sourceNeuron,
            federationUpdatedAt: new Date().toISOString()
          }
        })
        .where(eq(memoryNodes.id, existingNode.id));
    }
  }

  /**
   * Merge two nodes intelligently
   */
  private async mergeNodes(
    existingNode: MemoryNode,
    incomingNode: any,
    sourceNeuron: string
  ): Promise<void> {
    // Combine content if different
    const mergedContent = existingNode.content !== incomingNode.content
      ? `${existingNode.content}\n\n--- Federation Update ---\n${incomingNode.content}`
      : existingNode.content;

    // Use better summary
    const mergedSummary = incomingNode.summary && incomingNode.summary.length > (existingNode.summary?.length || 0)
      ? incomingNode.summary
      : existingNode.summary;

    // Merge keywords and entities
    const existingKeywords = existingNode.keywords as string[] || [];
    const incomingKeywords = incomingNode.keywords as string[] || [];
    const mergedKeywords = [...new Set([...existingKeywords, ...incomingKeywords])];

    await db.update(memoryNodes)
      .set({
        content: mergedContent,
        summary: mergedSummary,
        keywords: mergedKeywords,
        qualityScore: Math.max(existingNode.qualityScore, incomingNode.qualityScore),
        lastUpdated: new Date(),
        metadata: {
          ...existingNode.metadata,
          federationMergedWith: sourceNeuron,
          federationMergedAt: new Date().toISOString()
        }
      })
      .where(eq(memoryNodes.id, existingNode.id));
  }

  /**
   * Flag node conflict for manual review
   */
  private async flagForManualReview(
    existingNode: MemoryNode,
    incomingNode: any,
    sourceNeuron: string
  ): Promise<void> {
    // Add to manual review queue (implementation would depend on admin interface)
    console.log(`🚩 Node conflict flagged for manual review: ${existingNode.slug} vs ${sourceNeuron}:${incomingNode.slug}`);
  }

  /**
   * Load connected neurons from configuration
   */
  private async loadConnectedNeurons(): Promise<void> {
    // In production, this would load from database or configuration
    // For now, initialize with empty set
    console.log('📡 Loading connected neurons from configuration...');
  }

  /**
   * Start periodic sync scheduler
   */
  private startSyncScheduler(): void {
    setInterval(async () => {
      try {
        await this.syncWithAllNeurons();
      } catch (error) {
        console.error('Scheduled sync failed:', error);
      }
    }, this.syncConfiguration.syncInterval * 60 * 1000); // Convert minutes to milliseconds

    console.log(`⏰ Sync scheduler started: every ${this.syncConfiguration.syncInterval} minutes`);
  }

  /**
   * Register event hooks for real-time sync
   */
  private registerEventHooks(): void {
    // Register hooks for memory changes
    this.on('memory.node.created', this.handleNodeCreated.bind(this));
    this.on('memory.node.updated', this.handleNodeUpdated.bind(this));
    this.on('memory.edge.created', this.handleEdgeCreated.bind(this));

    console.log('🔗 Event hooks registered for real-time sync');
  }

  /**
   * Handle new node creation
   */
  private async handleNodeCreated(nodeData: MemoryNode): Promise<void> {
    // Broadcast to all connected neurons
    const promises = Array.from(this.connectedNeurons.values()).map(async connection => {
      if (connection.isOnline && connection.permissions.includes('receive_nodes')) {
        try {
          await axios.post(
            `${connection.baseUrl}/api/memory/sync/receive-nodes`,
            {
              nodes: [nodeData],
              sourceNeuron: 'findawise-empire-core',
              eventType: 'real-time'
            },
            {
              headers: { 'Authorization': `Bearer ${connection.apiKey}` },
              timeout: 10000
            }
          );
        } catch (error) {
          console.warn(`Real-time sync failed for ${connection.neuronId}:`, error.message);
        }
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Handle node updates
   */
  private async handleNodeUpdated(nodeData: MemoryNode): Promise<void> {
    // Similar to handleNodeCreated but for updates
    await this.handleNodeCreated(nodeData);
  }

  /**
   * Handle new edge creation
   */
  private async handleEdgeCreated(edgeData: MemoryEdge): Promise<void> {
    // Broadcast edge creation to connected neurons
    const promises = Array.from(this.connectedNeurons.values()).map(async connection => {
      if (connection.isOnline && connection.permissions.includes('receive_edges')) {
        try {
          await axios.post(
            `${connection.baseUrl}/api/memory/sync/receive-edges`,
            {
              edges: [edgeData],
              sourceNeuron: 'findawise-empire-core',
              eventType: 'real-time'
            },
            {
              headers: { 'Authorization': `Bearer ${connection.apiKey}` },
              timeout: 10000
            }
          );
        } catch (error) {
          console.warn(`Real-time edge sync failed for ${connection.neuronId}:`, error.message);
        }
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Event emitter methods
   */
  on(event: string, handler: Function): void {
    if (!this.eventHooks.has(event)) {
      this.eventHooks.set(event, []);
    }
    this.eventHooks.get(event)!.push(handler);
  }

  emit(event: string, data: any): void {
    const handlers = this.eventHooks.get(event) || [];
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Event handler error for ${event}:`, error);
      }
    });
  }

  /**
   * Get sync statistics
   */
  async getSyncStatistics(): Promise<any> {
    const recentSyncs = await db.select()
      .from(federationMemorySync)
      .orderBy(desc(federationMemorySync.startTime))
      .limit(100);

    const stats = {
      totalSyncs: recentSyncs.length,
      successfulSyncs: recentSyncs.filter(s => s.syncStatus === 'completed').length,
      failedSyncs: recentSyncs.filter(s => s.syncStatus === 'failed').length,
      averageSyncTime: recentSyncs.reduce((sum, s) => sum + (s.totalTime || 0), 0) / recentSyncs.length,
      totalNodesSynced: recentSyncs.reduce((sum, s) => sum + s.successCount, 0),
      connectedNeurons: this.connectedNeurons.size,
      onlineNeurons: Array.from(this.connectedNeurons.values()).filter(n => n.isOnline).length
    };

    return stats;
  }

  /**
   * Perform initial sync with a newly registered neuron
   */
  private async performInitialSync(neuronId: string): Promise<void> {
    try {
      console.log(`🔄 Performing initial sync with ${neuronId}...`);
      await this.syncWithNeuron(neuronId);
      console.log(`✅ Initial sync completed for ${neuronId}`);
    } catch (error) {
      console.error(`Initial sync failed for ${neuronId}:`, error);
    }
  }
}

export const federationMemorySync = new FederationMemorySync();