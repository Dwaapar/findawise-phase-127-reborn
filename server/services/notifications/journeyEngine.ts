import { db } from "../../db";
import { 
  notificationTemplates, 
  notificationTriggers, 
  notificationCampaigns,
  notificationQueue,
  notificationAnalytics,
  userNotificationPreferences,
  notificationChannels
} from "@shared/notificationTables";
import { eq, and, or, gte, lte, isNull, desc, sql } from "drizzle-orm";
import { logger } from "../../utils/logger";
import { storage } from "../../storage";
import { notificationEngine } from "./notificationEngine";

export interface JourneyNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'delay' | 'split' | 'merge';
  name: string;
  config: Record<string, any>;
  position: { x: number; y: number };
  connections: string[]; // IDs of connected nodes
}

export interface JourneyFlow {
  id: string;
  name: string;
  description: string;
  vertical: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  nodes: JourneyNode[];
  triggers: string[];
  goals: {
    primary: string;
    secondary?: string[];
    conversionEvents: string[];
  };
  targeting: {
    segments: string[];
    conditions: any[];
  };
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserJourneySession {
  userId: string;
  journeyId: string;
  currentNodeId: string;
  startedAt: Date;
  lastActiveAt: Date;
  completedNodes: string[];
  variables: Record<string, any>;
  status: 'active' | 'completed' | 'abandoned' | 'failed';
  conversionEvents: string[];
  metadata: Record<string, any>;
}

export interface JourneyAnalytics {
  journeyId: string;
  totalUsers: number;
  activeUsers: number;
  completedUsers: number;
  conversionRate: number;
  avgCompletionTime: number;
  dropOffPoints: { nodeId: string; dropOffRate: number }[];
  channelPerformance: { channel: string; deliveryRate: number; engagementRate: number }[];
  revenueGenerated: number;
}

export class JourneyEngine {
  private activeJourneys: Map<string, JourneyFlow> = new Map();
  private userSessions: Map<string, UserJourneySession[]> = new Map();
  private processingEnabled: boolean = true;

  constructor() {
    this.initialize();
  }

  async initialize(): Promise<void> {
    try {
      await this.loadActiveJourneys();
      this.startSessionProcessor();
      this.startAnalyticsProcessor();
      
      logger.info('🚀 Journey Engine initialized successfully', {
        activeJourneys: this.activeJourneys.size
      });
    } catch (error) {
      logger.error('Failed to initialize Journey Engine:', error);
      throw error;
    }
  }

  /**
   * Load all active journeys from database
   */
  private async loadActiveJourneys(): Promise<void> {
    try {
      // Load journeys from campaigns table where type is 'journey'
      const journeys = await db.select()
        .from(notificationCampaigns)
        .where(and(
          eq(notificationCampaigns.type, 'journey'),
          eq(notificationCampaigns.status, 'active')
        ));

      for (const journey of journeys) {
        const journeyFlow: JourneyFlow = {
          id: journey.id.toString(),
          name: journey.name,
          description: journey.description || '',
          vertical: 'general',
          status: journey.status as any,
          nodes: journey.metadata?.nodes || [],
          triggers: journey.metadata?.triggers || [],
          goals: journey.metadata?.goals || { primary: 'engagement', conversionEvents: [] },
          targeting: journey.metadata?.targeting || { segments: [], conditions: [] },
          metadata: journey.metadata || {},
          createdAt: journey.createdAt || new Date(),
          updatedAt: journey.updatedAt || new Date()
        };

        this.activeJourneys.set(journey.id.toString(), journeyFlow);
      }

      logger.info('Loaded active journeys', { count: journeys.length });
    } catch (error) {
      logger.error('Failed to load active journeys:', error);
    }
  }

  /**
   * Create a new journey flow
   */
  async createJourney(journey: Omit<JourneyFlow, 'id' | 'createdAt' | 'updatedAt'>): Promise<JourneyFlow> {
    try {
      // Validate journey structure
      this.validateJourneyStructure(journey);

      // Save to database
      const [savedCampaign] = await db.insert(notificationCampaigns).values({
        slug: this.generateSlug(journey.name),
        name: journey.name,
        description: journey.description,
        type: 'journey',
        status: journey.status,
        targetAudience: journey.targeting,
        primaryGoal: journey.goals.primary,
        metadata: {
          nodes: journey.nodes,
          triggers: journey.triggers,
          goals: journey.goals,
          targeting: journey.targeting,
          ...journey.metadata
        }
      }).returning();

      const newJourney: JourneyFlow = {
        ...journey,
        id: savedCampaign.id.toString(),
        createdAt: savedCampaign.createdAt || new Date(),
        updatedAt: savedCampaign.updatedAt || new Date()
      };

      // Add to active journeys if status is active
      if (journey.status === 'active') {
        this.activeJourneys.set(newJourney.id, newJourney);
      }

      logger.info('Journey created successfully', { 
        journeyId: newJourney.id, 
        name: newJourney.name 
      });

      return newJourney;
    } catch (error) {
      logger.error('Failed to create journey:', error);
      throw error;
    }
  }

  /**
   * Update existing journey
   */
  async updateJourney(journeyId: string, updates: Partial<JourneyFlow>): Promise<JourneyFlow> {
    const journey = this.activeJourneys.get(journeyId);
    if (!journey) {
      throw new Error(`Journey not found: ${journeyId}`);
    }

    const updatedJourney = { ...journey, ...updates, updatedAt: new Date() };

    // Update in database
    await db.update(notificationCampaigns)
      .set({
        name: updatedJourney.name,
        description: updatedJourney.description,
        status: updatedJourney.status,
        metadata: {
          nodes: updatedJourney.nodes,
          triggers: updatedJourney.triggers,
          goals: updatedJourney.goals,
          targeting: updatedJourney.targeting,
          ...updatedJourney.metadata
        },
        updatedAt: new Date()
      })
      .where(eq(notificationCampaigns.id, parseInt(journeyId)));

    // Update in memory
    this.activeJourneys.set(journeyId, updatedJourney);

    logger.info('Journey updated successfully', { journeyId, updates: Object.keys(updates) });
    return updatedJourney;
  }

  /**
   * Start a user journey session
   */
  async startUserJourney(userId: string, journeyId: string, triggerEvent: string, context: Record<string, any> = {}): Promise<UserJourneySession> {
    const journey = this.activeJourneys.get(journeyId);
    if (!journey) {
      throw new Error(`Journey not found: ${journeyId}`);
    }

    // Check if user is eligible for this journey
    const isEligible = await this.checkJourneyEligibility(userId, journey);
    if (!isEligible) {
      throw new Error('User not eligible for this journey');
    }

    // Find the starting node
    const startNode = journey.nodes.find(node => 
      node.type === 'trigger' && 
      journey.triggers.includes(triggerEvent)
    );

    if (!startNode) {
      throw new Error(`No starting node found for trigger: ${triggerEvent}`);
    }

    // Create user session
    const session: UserJourneySession = {
      userId,
      journeyId,
      currentNodeId: startNode.id,
      startedAt: new Date(),
      lastActiveAt: new Date(),
      completedNodes: [],
      variables: { ...context, triggerEvent },
      status: 'active',
      conversionEvents: [],
      metadata: { startTrigger: triggerEvent }
    };

    // Store session
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, []);
    }
    this.userSessions.get(userId)!.push(session);

    // Process first node
    await this.processNode(session, startNode);

    logger.info('User journey started', { 
      userId, 
      journeyId, 
      triggerEvent,
      startNodeId: startNode.id 
    });

    return session;
  }

  /**
   * Process a specific node in the journey
   */
  private async processNode(session: UserJourneySession, node: JourneyNode): Promise<void> {
    try {
      session.lastActiveAt = new Date();

      switch (node.type) {
        case 'trigger':
          await this.processTriggerNode(session, node);
          break;
        case 'action':
          await this.processActionNode(session, node);
          break;
        case 'condition':
          await this.processConditionNode(session, node);
          break;
        case 'delay':
          await this.processDelayNode(session, node);
          break;
        case 'split':
          await this.processSplitNode(session, node);
          break;
        default:
          logger.warn('Unknown node type', { nodeType: node.type, nodeId: node.id });
      }

      // Mark node as completed
      if (!session.completedNodes.includes(node.id)) {
        session.completedNodes.push(node.id);
      }

      // Track analytics
      await this.trackNodeCompletion(session, node);

    } catch (error) {
      logger.error('Failed to process node', { 
        userId: session.userId,
        journeyId: session.journeyId,
        nodeId: node.id,
        error 
      });

      // Mark session as failed
      session.status = 'failed';
      session.metadata.failureReason = error.message;
    }
  }

  /**
   * Process trigger node (entry point)
   */
  private async processTriggerNode(session: UserJourneySession, node: JourneyNode): Promise<void> {
    // Trigger nodes are entry points, move to next connected node
    const nextNodeIds = node.connections;
    if (nextNodeIds.length > 0) {
      const journey = this.activeJourneys.get(session.journeyId)!;
      const nextNode = journey.nodes.find(n => n.id === nextNodeIds[0]);
      if (nextNode) {
        session.currentNodeId = nextNode.id;
        await this.processNode(session, nextNode);
      }
    }
  }

  /**
   * Process action node (send notification)
   */
  private async processActionNode(session: UserJourneySession, node: JourneyNode): Promise<void> {
    const { templateSlug, channel, delay = 0, personalizeContent = true } = node.config;

    // Schedule notification
    const scheduledFor = delay > 0 ? 
      new Date(Date.now() + delay * 60 * 1000) : 
      new Date();

    // Personalize content if enabled
    let personalizationData = session.variables;
    if (personalizeContent) {
      personalizationData = await this.generatePersonalizationData(session);
    }

    // Queue notification
    await notificationEngine.queueNotification({
      templateSlug,
      recipientId: session.userId,
      channel: channel || 'email',
      data: personalizationData,
      scheduledFor,
      campaignId: parseInt(session.journeyId),
      priority: node.config.priority || 'normal'
    });

    // Move to next node
    await this.moveToNextNode(session, node);
  }

  /**
   * Process condition node (branching logic)
   */
  private async processConditionNode(session: UserJourneySession, node: JourneyNode): Promise<void> {
    const { conditions, trueNodeId, falseNodeId } = node.config;
    
    let conditionResult = true;
    
    // Evaluate conditions
    for (const condition of conditions) {
      const result = await this.evaluateCondition(session, condition);
      if (!result) {
        conditionResult = false;
        break;
      }
    }

    // Choose next node based on condition result
    const nextNodeId = conditionResult ? trueNodeId : falseNodeId;
    if (nextNodeId) {
      const journey = this.activeJourneys.get(session.journeyId)!;
      const nextNode = journey.nodes.find(n => n.id === nextNodeId);
      if (nextNode) {
        session.currentNodeId = nextNode.id;
        await this.processNode(session, nextNode);
      }
    }
  }

  /**
   * Process delay node (wait before next action)
   */
  private async processDelayNode(session: UserJourneySession, node: JourneyNode): Promise<void> {
    const { delay, unit = 'minutes' } = node.config;
    
    let delayMs = delay * 60 * 1000; // Default to minutes
    if (unit === 'hours') delayMs = delay * 60 * 60 * 1000;
    if (unit === 'days') delayMs = delay * 24 * 60 * 60 * 1000;

    // Schedule processing of next node
    setTimeout(async () => {
      await this.moveToNextNode(session, node);
    }, delayMs);
  }

  /**
   * Process split node (A/B testing)
   */
  private async processSplitNode(session: UserJourneySession, node: JourneyNode): Promise<void> {
    const { variants, splitLogic = 'random' } = node.config;
    
    let selectedVariant;
    
    if (splitLogic === 'random') {
      selectedVariant = variants[Math.floor(Math.random() * variants.length)];
    } else if (splitLogic === 'weighted') {
      selectedVariant = this.selectWeightedVariant(variants);
    }

    if (selectedVariant?.nodeId) {
      const journey = this.activeJourneys.get(session.journeyId)!;
      const nextNode = journey.nodes.find(n => n.id === selectedVariant.nodeId);
      if (nextNode) {
        session.currentNodeId = nextNode.id;
        session.variables.splitVariant = selectedVariant.name;
        await this.processNode(session, nextNode);
      }
    }
  }

  /**
   * Move to the next connected node
   */
  private async moveToNextNode(session: UserJourneySession, currentNode: JourneyNode): Promise<void> {
    const nextNodeIds = currentNode.connections;
    if (nextNodeIds.length > 0) {
      const journey = this.activeJourneys.get(session.journeyId)!;
      const nextNode = journey.nodes.find(n => n.id === nextNodeIds[0]);
      if (nextNode) {
        session.currentNodeId = nextNode.id;
        await this.processNode(session, nextNode);
      } else {
        // Journey completed
        session.status = 'completed';
        await this.trackJourneyCompletion(session);
      }
    } else {
      // Journey completed
      session.status = 'completed';
      await this.trackJourneyCompletion(session);
    }
  }

  /**
   * Generate personalization data for the user
   */
  private async generatePersonalizationData(session: UserJourneySession): Promise<Record<string, any>> {
    try {
      // Get user profile data
      const userProfile = await storage.getUserProfile(session.userId);
      
      // Get user behavior data
      const behaviorData = await storage.getUserBehaviorData(session.userId);
      
      // Combine with session variables
      return {
        ...session.variables,
        user: userProfile,
        behavior: behaviorData,
        journey: {
          name: this.activeJourneys.get(session.journeyId)?.name,
          progress: session.completedNodes.length,
          startedAt: session.startedAt
        }
      };
    } catch (error) {
      logger.error('Failed to generate personalization data:', error);
      return session.variables;
    }
  }

  /**
   * Evaluate a condition against user/session data
   */
  private async evaluateCondition(session: UserJourneySession, condition: any): Promise<boolean> {
    const { field, operator, value } = condition;
    
    // Get field value from session variables or user data
    let fieldValue = this.getNestedValue(session.variables, field);
    
    if (fieldValue === undefined) {
      // Try to get from user profile
      const userProfile = await storage.getUserProfile(session.userId);
      fieldValue = this.getNestedValue(userProfile, field);
    }

    // Evaluate condition
    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'not_equals':
        return fieldValue !== value;
      case 'greater_than':
        return fieldValue > value;
      case 'less_than':
        return fieldValue < value;
      case 'contains':
        return Array.isArray(fieldValue) ? fieldValue.includes(value) : String(fieldValue).includes(value);
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
      default:
        return false;
    }
  }

  /**
   * Check if user is eligible for a journey
   */
  private async checkJourneyEligibility(userId: string, journey: JourneyFlow): Promise<boolean> {
    try {
      // Check if user already has an active session for this journey
      const userSessions = this.userSessions.get(userId) || [];
      const hasActiveSession = userSessions.some(s => 
        s.journeyId === journey.id && s.status === 'active'
      );

      if (hasActiveSession) {
        return false; // Don't start duplicate journeys
      }

      // Check targeting conditions
      for (const condition of journey.targeting.conditions) {
        const result = await this.evaluateCondition({ 
          userId, 
          variables: {},
          journeyId: journey.id 
        } as any, condition);
        
        if (!result) {
          return false;
        }
      }

      return true;
    } catch (error) {
      logger.error('Failed to check journey eligibility:', error);
      return false;
    }
  }

  /**
   * Track node completion for analytics
   */
  private async trackNodeCompletion(session: UserJourneySession, node: JourneyNode): Promise<void> {
    try {
      await storage.trackAnalyticsEvent({
        userId: session.userId,
        event: 'journey_node_completed',
        properties: {
          journeyId: session.journeyId,
          nodeId: node.id,
          nodeType: node.type,
          sessionStartedAt: session.startedAt,
          completedNodesCount: session.completedNodes.length
        },
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Failed to track node completion:', error);
    }
  }

  /**
   * Track journey completion
   */
  private async trackJourneyCompletion(session: UserJourneySession): Promise<void> {
    try {
      const completionTime = Date.now() - session.startedAt.getTime();
      
      await storage.trackAnalyticsEvent({
        userId: session.userId,
        event: 'journey_completed',
        properties: {
          journeyId: session.journeyId,
          completionTime,
          nodesCompleted: session.completedNodes.length,
          conversionEvents: session.conversionEvents
        },
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Failed to track journey completion:', error);
    }
  }

  /**
   * Get analytics for a specific journey
   */
  async getJourneyAnalytics(journeyId: string, dateRange?: { start: Date; end: Date }): Promise<JourneyAnalytics> {
    try {
      // This would integrate with your analytics system
      // For now, returning mock data structure
      return {
        journeyId,
        totalUsers: 0,
        activeUsers: 0,
        completedUsers: 0,
        conversionRate: 0,
        avgCompletionTime: 0,
        dropOffPoints: [],
        channelPerformance: [],
        revenueGenerated: 0
      };
    } catch (error) {
      logger.error('Failed to get journey analytics:', error);
      throw error;
    }
  }

  /**
   * Start the session processor (handles delayed actions)
   */
  private startSessionProcessor(): void {
    setInterval(async () => {
      if (!this.processingEnabled) return;

      try {
        // Process any pending delayed actions
        // This would check for scheduled node processing
      } catch (error) {
        logger.error('Session processor error:', error);
      }
    }, 60000); // Process every minute
  }

  /**
   * Start analytics processor
   */
  private startAnalyticsProcessor(): void {
    setInterval(async () => {
      try {
        // Update journey analytics
        for (const [journeyId] of this.activeJourneys) {
          await this.updateJourneyAnalytics(journeyId);
        }
      } catch (error) {
        logger.error('Analytics processor error:', error);
      }
    }, 300000); // Process every 5 minutes
  }

  private async updateJourneyAnalytics(journeyId: string): Promise<void> {
    // Implementation for updating journey analytics
  }

  // Utility methods
  private validateJourneyStructure(journey: any): void {
    if (!journey.nodes || !Array.isArray(journey.nodes)) {
      throw new Error('Journey must have nodes array');
    }
    
    if (!journey.triggers || !Array.isArray(journey.triggers)) {
      throw new Error('Journey must have triggers array');
    }

    // Validate that all node connections exist
    const nodeIds = new Set(journey.nodes.map((n: any) => n.id));
    for (const node of journey.nodes) {
      for (const connectionId of node.connections || []) {
        if (!nodeIds.has(connectionId)) {
          throw new Error(`Invalid connection: ${connectionId} not found`);
        }
      }
    }
  }

  private generateSlug(name: string): string {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private selectWeightedVariant(variants: any[]): any {
    const totalWeight = variants.reduce((sum, v) => sum + (v.weight || 1), 0);
    let random = Math.random() * totalWeight;
    
    for (const variant of variants) {
      random -= variant.weight || 1;
      if (random <= 0) {
        return variant;
      }
    }
    
    return variants[0]; // Fallback
  }

  // Public API methods
  getActiveJourneys(): JourneyFlow[] {
    return Array.from(this.activeJourneys.values());
  }

  getJourney(journeyId: string): JourneyFlow | undefined {
    return this.activeJourneys.get(journeyId);
  }

  getUserSessions(userId: string): UserJourneySession[] {
    return this.userSessions.get(userId) || [];
  }

  async pauseJourney(journeyId: string): Promise<void> {
    const journey = this.activeJourneys.get(journeyId);
    if (journey) {
      await this.updateJourney(journeyId, { status: 'paused' });
    }
  }

  async resumeJourney(journeyId: string): Promise<void> {
    const journey = this.activeJourneys.get(journeyId);
    if (journey) {
      await this.updateJourney(journeyId, { status: 'active' });
    }
  }
}

export const journeyEngine = new JourneyEngine();