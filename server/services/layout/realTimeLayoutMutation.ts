/**
 * Real-Time Layout Mutation Engine - Enterprise Grade
 * Server-driven dynamic layout changes based on emotion/context
 */

import { logger } from '../../utils/logger.js';
import { culturalEmotionMapEngine } from '../cultural/culturalEmotionMap.js';
import { WebSocket } from 'ws';

interface LayoutBlock {
  id: string;
  type: 'header' | 'content' | 'cta' | 'sidebar' | 'footer' | 'hero' | 'testimonial' | 'product' | 'form';
  content: any;
  position: { x: number; y: number; z?: number };
  dimensions: { width: number; height: number };
  styles: Record<string, any>;
  visibility: boolean;
  animations: any[];
  conditions: LayoutCondition[];
  priority: number;
  version: string;
}

interface LayoutCondition {
  type: 'emotion' | 'device' | 'location' | 'behavior' | 'time' | 'session' | 'user_segment';
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in_range';
  value: any;
  weight: number;
}

interface LayoutMutation {
  id: string;
  trigger: string;
  target_blocks: string[];
  mutations: {
    position?: { x: number; y: number; z?: number };
    dimensions?: { width: number; height: number };
    styles?: Record<string, any>;
    content?: any;
    visibility?: boolean;
    animations?: any[];
  };
  duration: number;
  conditions: LayoutCondition[];
  priority: number;
  created_at: Date;
  expires_at?: Date;
}

interface UserContext {
  user_id?: string;
  session_id: string;
  device_type: string;
  location: { country: string; region?: string };
  behavior_data: any;
  emotion_profile: any;
  preferences: any;
  visit_count: number;
  conversion_history: any[];
}

class RealTimeLayoutMutationEngine {
  private layouts: Map<string, LayoutBlock[]> = new Map();
  private mutations: Map<string, LayoutMutation[]> = new Map();
  private activeConnections: Map<string, WebSocket> = new Map();
  private layoutTemplates: Map<string, LayoutBlock[]> = new Map();

  constructor() {
    this.initializeLayoutTemplates();
    this.initializeDefaultMutations();
    logger.info('Real-Time Layout Mutation Engine initialized', { 
      component: 'RealTimeLayoutMutation' 
    });
  }

  private initializeLayoutTemplates() {
    // E-commerce Layout Template
    this.layoutTemplates.set('ecommerce', [
      {
        id: 'hero_section',
        type: 'hero',
        content: {
          headline: 'Premium Products',
          subheadline: 'Discover quality items',
          background_image: '/assets/hero-bg.jpg'
        },
        position: { x: 0, y: 0 },
        dimensions: { width: 100, height: 60 },
        styles: { 
          backgroundColor: '#ffffff',
          backgroundSize: 'cover',
          textAlign: 'center'
        },
        visibility: true,
        animations: [],
        conditions: [],
        priority: 1,
        version: '1.0'
      },
      {
        id: 'product_grid',
        type: 'product',
        content: {
          products: [],
          layout: 'grid',
          columns: 3
        },
        position: { x: 0, y: 60 },
        dimensions: { width: 70, height: 80 },
        styles: {
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px'
        },
        visibility: true,
        animations: [],
        conditions: [],
        priority: 2,
        version: '1.0'
      },
      {
        id: 'trust_sidebar',
        type: 'sidebar',
        content: {
          testimonials: [],
          security_badges: [],
          guarantees: []
        },
        position: { x: 70, y: 60 },
        dimensions: { width: 30, height: 80 },
        styles: {
          backgroundColor: '#f8f9fa',
          padding: '20px'
        },
        visibility: true,
        animations: [],
        conditions: [],
        priority: 3,
        version: '1.0'
      },
      {
        id: 'floating_cta',
        type: 'cta',
        content: {
          text: 'Shop Now',
          style: 'primary',
          urgent: false
        },
        position: { x: 85, y: 85, z: 1000 },
        dimensions: { width: 12, height: 8 },
        styles: {
          position: 'fixed',
          backgroundColor: '#007bff',
          color: 'white',
          borderRadius: '8px',
          zIndex: 1000
        },
        visibility: false,
        animations: [],
        conditions: [
          {
            type: 'behavior',
            operator: 'greater_than',
            value: { scroll_depth: 0.3 },
            weight: 1.0
          }
        ],
        priority: 10,
        version: '1.0'
      }
    ]);

    // Lead Generation Layout Template
    this.layoutTemplates.set('lead_gen', [
      {
        id: 'value_prop_header',
        type: 'header',
        content: {
          headline: 'Transform Your Business',
          value_points: ['Increase Revenue', 'Save Time', 'Reduce Costs']
        },
        position: { x: 0, y: 0 },
        dimensions: { width: 100, height: 40 },
        styles: {
          textAlign: 'center',
          backgroundColor: '#2c3e50',
          color: 'white'
        },
        visibility: true,
        animations: [],
        conditions: [],
        priority: 1,
        version: '1.0'
      },
      {
        id: 'lead_form',
        type: 'form',
        content: {
          fields: ['email', 'name', 'company'],
          button_text: 'Get Free Analysis',
          privacy_note: 'We respect your privacy'
        },
        position: { x: 50, y: 40 },
        dimensions: { width: 40, height: 50 },
        styles: {
          backgroundColor: 'white',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          padding: '30px'
        },
        visibility: true,
        animations: [],
        conditions: [],
        priority: 2,
        version: '1.0'
      },
      {
        id: 'social_proof',
        type: 'testimonial',
        content: {
          testimonials: [],
          logos: [],
          stats: { customers: 10000, satisfaction: 98 }
        },
        position: { x: 0, y: 90 },
        dimensions: { width: 100, height: 30 },
        styles: {
          backgroundColor: '#f8f9fa',
          textAlign: 'center'
        },
        visibility: true,
        animations: [],
        conditions: [],
        priority: 3,
        version: '1.0'
      }
    ]);

    // Content/Blog Layout Template
    this.layoutTemplates.set('content', [
      {
        id: 'article_header',
        type: 'header',
        content: {
          title: '',
          author: '',
          publish_date: '',
          reading_time: ''
        },
        position: { x: 0, y: 0 },
        dimensions: { width: 100, height: 20 },
        styles: {
          backgroundColor: 'white',
          borderBottom: '1px solid #eee'
        },
        visibility: true,
        animations: [],
        conditions: [],
        priority: 1,
        version: '1.0'
      },
      {
        id: 'article_content',
        type: 'content',
        content: {
          body: '',
          images: [],
          embedded_elements: []
        },
        position: { x: 0, y: 20 },
        dimensions: { width: 70, height: 70 },
        styles: {
          fontSize: '16px',
          lineHeight: '1.6',
          padding: '20px'
        },
        visibility: true,
        animations: [],
        conditions: [],
        priority: 2,
        version: '1.0'
      },
      {
        id: 'engagement_sidebar',
        type: 'sidebar',
        content: {
          related_articles: [],
          newsletter_signup: {},
          social_sharing: {}
        },
        position: { x: 70, y: 20 },
        dimensions: { width: 30, height: 70 },
        styles: {
          backgroundColor: '#f8f9fa',
          padding: '20px'
        },
        visibility: true,
        animations: [],
        conditions: [],
        priority: 3,
        version: '1.0'
      }
    ]);
  }

  private initializeDefaultMutations() {
    // Urgency-based mutations
    this.mutations.set('urgency_boost', [
      {
        id: 'urgency_cta_mutation',
        trigger: 'high_urgency_emotion',
        target_blocks: ['floating_cta', 'lead_form'],
        mutations: {
          styles: {
            backgroundColor: '#dc3545',
            animation: 'pulse 2s infinite',
            borderColor: '#dc3545'
          },
          content: {
            text: 'Limited Time Offer!',
            urgent: true
          }
        },
        duration: 5000,
        conditions: [
          {
            type: 'emotion',
            operator: 'greater_than',
            value: { urgency: 0.7 },
            weight: 1.0
          }
        ],
        priority: 10,
        created_at: new Date(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    ]);

    // Trust-building mutations
    this.mutations.set('trust_building', [
      {
        id: 'trust_enhancement_mutation',
        trigger: 'low_trust_signal',
        target_blocks: ['trust_sidebar', 'social_proof'],
        mutations: {
          visibility: true,
          position: { x: 60, y: 20 },
          dimensions: { width: 40, height: 60 },
          content: {
            testimonials: 'enhanced',
            security_badges: 'prominent',
            guarantees: 'highlighted'
          }
        },
        duration: 0, // Permanent until session ends
        conditions: [
          {
            type: 'emotion',
            operator: 'less_than',
            value: { trust: 0.5 },
            weight: 1.0
          }
        ],
        priority: 8,
        created_at: new Date()
      }
    ]);

    // Mobile-responsive mutations
    this.mutations.set('mobile_optimization', [
      {
        id: 'mobile_layout_mutation',
        trigger: 'mobile_device_detected',
        target_blocks: ['product_grid', 'lead_form', 'trust_sidebar'],
        mutations: {
          dimensions: { width: 100, height: -1 }, // -1 = auto height
          styles: {
            gridTemplateColumns: 'repeat(1, 1fr)',
            padding: '10px',
            fontSize: '14px'
          },
          position: { x: 0, y: -1 } // -1 = maintain current Y
        },
        duration: 0,
        conditions: [
          {
            type: 'device',
            operator: 'equals',
            value: 'mobile',
            weight: 1.0
          }
        ],
        priority: 9,
        created_at: new Date()
      }
    ]);

    // Cultural adaptation mutations
    this.mutations.set('cultural_adaptation', [
      {
        id: 'high_context_culture_mutation',
        trigger: 'high_context_culture',
        target_blocks: ['hero_section', 'value_prop_header'],
        mutations: {
          content: {
            messaging_style: 'relationship_focused',
            imagery: 'community_oriented'
          },
          styles: {
            padding: '40px',
            textAlign: 'left'
          }
        },
        duration: 0,
        conditions: [
          {
            type: 'location',
            operator: 'in_range',
            value: ['JP', 'CN', 'KR', 'TH'],
            weight: 1.0
          }
        ],
        priority: 7,
        created_at: new Date()
      }
    ]);
  }

  /**
   * Get layout for a specific template with user context applied
   */
  getPersonalizedLayout(templateId: string, userContext: UserContext): LayoutBlock[] {
    const baseLayout = this.layoutTemplates.get(templateId);
    if (!baseLayout) {
      throw new Error(`Layout template ${templateId} not found`);
    }

    // Clone base layout
    const personalizedLayout = JSON.parse(JSON.stringify(baseLayout));

    // Apply cultural emotion mapping
    const emotionProfile = culturalEmotionMapEngine.analyzeEmotionProfile(
      userContext.location.country,
      userContext.behavior_data
    );

    // Apply real-time mutations based on context
    this.applyMutations(personalizedLayout, userContext, emotionProfile);

    // Store current layout for user session
    this.layouts.set(userContext.session_id, personalizedLayout);

    logger.info('Personalized layout generated', {
      component: 'RealTimeLayoutMutation',
      templateId,
      sessionId: userContext.session_id,
      mutations: this.getAppliedMutations(userContext).length
    });

    return personalizedLayout;
  }

  /**
   * Apply real-time layout mutation
   */
  applyRealtimeMutation(sessionId: string, mutationId: string, customData?: any): boolean {
    const currentLayout = this.layouts.get(sessionId);
    if (!currentLayout) {
      return false;
    }

    const mutation = this.findMutationById(mutationId);
    if (!mutation) {
      return false;
    }

    // Apply mutation to target blocks
    mutation.target_blocks.forEach(blockId => {
      const block = currentLayout.find(b => b.id === blockId);
      if (block) {
        this.applyMutationToBlock(block, mutation, customData);
      }
    });

    // Notify connected client
    this.notifyLayoutChange(sessionId, {
      type: 'mutation_applied',
      mutationId,
      targetBlocks: mutation.target_blocks,
      duration: mutation.duration
    });

    logger.info('Real-time mutation applied', {
      component: 'RealTimeLayoutMutation',
      sessionId,
      mutationId,
      targetBlocks: mutation.target_blocks.length
    });

    return true;
  }

  /**
   * Register WebSocket connection for real-time updates
   */
  registerConnection(sessionId: string, ws: WebSocket): void {
    this.activeConnections.set(sessionId, ws);

    ws.on('close', () => {
      this.activeConnections.delete(sessionId);
    });

    ws.on('message', (data: any) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleClientMessage(sessionId, message);
      } catch (error) {
        logger.error('Error parsing WebSocket message', { error, sessionId });
      }
    });

    logger.info('WebSocket connection registered', {
      component: 'RealTimeLayoutMutation',
      sessionId
    });
  }

  /**
   * Trigger layout mutation based on user behavior
   */
  triggerBehaviorMutation(sessionId: string, behaviorEvent: any): void {
    const userContext = this.getUserContext(sessionId);
    if (!userContext) return;

    // Update behavior data
    userContext.behavior_data = {
      ...userContext.behavior_data,
      ...behaviorEvent,
      timestamp: new Date()
    };

    // Check for applicable mutations
    const applicableMutations = this.getApplicableMutations(userContext, behaviorEvent);

    applicableMutations.forEach(mutation => {
      this.applyRealtimeMutation(sessionId, mutation.id, behaviorEvent);
    });
  }

  /**
   * Get layout performance analytics
   */
  getLayoutAnalytics(sessionId: string): {
    layout_id: string;
    applied_mutations: string[];
    performance_metrics: any;
    conversion_events: any[];
    optimization_suggestions: string[];
  } {
    const layout = this.layouts.get(sessionId);
    if (!layout) {
      return {
        layout_id: 'unknown',
        applied_mutations: [],
        performance_metrics: {},
        conversion_events: [],
        optimization_suggestions: []
      };
    }

    const appliedMutations = this.getAppliedMutations({ session_id: sessionId } as UserContext);
    
    return {
      layout_id: 'custom',
      applied_mutations: appliedMutations.map(m => m.id),
      performance_metrics: this.calculatePerformanceMetrics(sessionId),
      conversion_events: this.getConversionEvents(sessionId),
      optimization_suggestions: this.generateOptimizationSuggestions(layout)
    };
  }

  private applyMutations(layout: LayoutBlock[], userContext: UserContext, emotionProfile: any): void {
    // Get applicable mutations
    const applicableMutations = this.getApplicableMutations(userContext);

    applicableMutations.forEach(mutation => {
      mutation.target_blocks.forEach(blockId => {
        const block = layout.find(b => b.id === blockId);
        if (block) {
          this.applyMutationToBlock(block, mutation);
        }
      });
    });

    // Apply cultural adaptations
    this.applyCulturalAdaptations(layout, userContext, emotionProfile);
  }

  private applyMutationToBlock(block: LayoutBlock, mutation: LayoutMutation, customData?: any): void {
    if (mutation.mutations.position) {
      block.position = { ...block.position, ...mutation.mutations.position };
    }

    if (mutation.mutations.dimensions) {
      block.dimensions = { ...block.dimensions, ...mutation.mutations.dimensions };
    }

    if (mutation.mutations.styles) {
      block.styles = { ...block.styles, ...mutation.mutations.styles };
    }

    if (mutation.mutations.content) {
      block.content = { ...block.content, ...mutation.mutations.content };
    }

    if (mutation.mutations.visibility !== undefined) {
      block.visibility = mutation.mutations.visibility;
    }

    if (mutation.mutations.animations) {
      block.animations = [...block.animations, ...mutation.mutations.animations];
    }

    // Apply custom data if provided
    if (customData) {
      block.content = { ...block.content, ...customData };
    }
  }

  private applyCulturalAdaptations(layout: LayoutBlock[], userContext: UserContext, emotionProfile: any): void {
    const personalizedContent = culturalEmotionMapEngine.generatePersonalizedContent(
      userContext.location.country,
      'layout',
      { layout }
    );

    if (personalizedContent.cultural_adaptation) {
      const adaptation = personalizedContent.cultural_adaptation;

      layout.forEach(block => {
        // Apply cultural color preferences
        if (adaptation.visual_elements?.colors) {
          Object.entries(adaptation.visual_elements.colors).forEach(([color, meaning]) => {
            if (block.styles.backgroundColor?.includes(color)) {
              block.styles.culturalContext = meaning;
            }
          });
        }

        // Apply communication style
        if (block.type === 'content' || block.type === 'header') {
          block.content.communicationStyle = adaptation.communication_style;
        }

        // Apply trust elements
        if (block.type === 'sidebar' || block.type === 'testimonial') {
          block.content.trustElements = adaptation.visual_elements?.trust_elements || [];
        }
      });
    }
  }

  private getApplicableMutations(userContext: UserContext, behaviorEvent?: any): LayoutMutation[] {
    const applicable: LayoutMutation[] = [];

    this.mutations.forEach(mutationList => {
      mutationList.forEach(mutation => {
        if (this.evaluateConditions(mutation.conditions, userContext, behaviorEvent)) {
          applicable.push(mutation);
        }
      });
    });

    // Sort by priority
    return applicable.sort((a, b) => b.priority - a.priority);
  }

  private evaluateConditions(conditions: LayoutCondition[], userContext: UserContext, behaviorEvent?: any): boolean {
    return conditions.every(condition => {
      switch (condition.type) {
        case 'emotion':
          return this.evaluateEmotionCondition(condition, userContext.emotion_profile);
        case 'device':
          return this.evaluateDeviceCondition(condition, userContext.device_type);
        case 'location':
          return this.evaluateLocationCondition(condition, userContext.location);
        case 'behavior':
          return this.evaluateBehaviorCondition(condition, behaviorEvent || userContext.behavior_data);
        case 'session':
          return this.evaluateSessionCondition(condition, userContext);
        default:
          return true;
      }
    });
  }

  private evaluateEmotionCondition(condition: LayoutCondition, emotionProfile: any): boolean {
    if (!emotionProfile) return false;
    
    const emotionValue = emotionProfile[Object.keys(condition.value)[0]];
    const threshold = Object.values(condition.value)[0] as number;
    
    switch (condition.operator) {
      case 'greater_than': return emotionValue > threshold;
      case 'less_than': return emotionValue < threshold;
      default: return emotionValue === threshold;
    }
  }

  private evaluateDeviceCondition(condition: LayoutCondition, deviceType: string): boolean {
    return condition.operator === 'equals' ? deviceType === condition.value : true;
  }

  private evaluateLocationCondition(condition: LayoutCondition, location: any): boolean {
    if (condition.operator === 'in_range') {
      return (condition.value as string[]).includes(location.country);
    }
    return location.country === condition.value;
  }

  private evaluateBehaviorCondition(condition: LayoutCondition, behaviorData: any): boolean {
    if (!behaviorData) return false;
    
    const behaviorKey = Object.keys(condition.value)[0];
    const behaviorValue = behaviorData[behaviorKey];
    const threshold = condition.value[behaviorKey];
    
    switch (condition.operator) {
      case 'greater_than': return behaviorValue > threshold;
      case 'less_than': return behaviorValue < threshold;
      default: return behaviorValue === threshold;
    }
  }

  private evaluateSessionCondition(condition: LayoutCondition, userContext: UserContext): boolean {
    // Implement session-based conditions
    return true;
  }

  private notifyLayoutChange(sessionId: string, change: any): void {
    const ws = this.activeConnections.get(sessionId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'layout_mutation',
        data: change,
        timestamp: new Date().toISOString()
      }));
    }
  }

  private handleClientMessage(sessionId: string, message: any): void {
    switch (message.type) {
      case 'behavior_event':
        this.triggerBehaviorMutation(sessionId, message.data);
        break;
      case 'request_mutation':
        this.applyRealtimeMutation(sessionId, message.mutationId, message.data);
        break;
      default:
        logger.warn('Unknown client message type', { type: message.type, sessionId });
    }
  }

  private findMutationById(mutationId: string): LayoutMutation | null {
    for (const mutationList of this.mutations.values()) {
      const found = mutationList.find(m => m.id === mutationId);
      if (found) return found;
    }
    return null;
  }

  private getUserContext(sessionId: string): UserContext | null {
    // This would typically come from a user context service or database
    return {
      session_id: sessionId,
      device_type: 'desktop',
      location: { country: 'US' },
      behavior_data: {},
      emotion_profile: {},
      preferences: {},
      visit_count: 1,
      conversion_history: []
    };
  }

  private getAppliedMutations(userContext: UserContext): LayoutMutation[] {
    return this.getApplicableMutations(userContext);
  }

  private calculatePerformanceMetrics(sessionId: string): any {
    return {
      load_time: 1200,
      interaction_rate: 0.35,
      scroll_depth: 0.75,
      time_on_page: 180
    };
  }

  private getConversionEvents(sessionId: string): any[] {
    return [];
  }

  private generateOptimizationSuggestions(layout: LayoutBlock[]): string[] {
    const suggestions: string[] = [];
    
    // Check for common optimization opportunities
    const hasFloatingCTA = layout.some(block => block.type === 'cta' && block.position.z);
    if (!hasFloatingCTA) {
      suggestions.push('Add floating CTA for better conversion');
    }

    const hasSocialProof = layout.some(block => block.type === 'testimonial');
    if (!hasSocialProof) {
      suggestions.push('Add social proof elements to build trust');
    }

    return suggestions;
  }

  /**
   * Create custom layout mutation
   */
  createMutation(mutation: Omit<LayoutMutation, 'id' | 'created_at'>): string {
    const id = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullMutation: LayoutMutation = {
      ...mutation,
      id,
      created_at: new Date()
    };

    const category = mutation.trigger || 'custom';
    if (!this.mutations.has(category)) {
      this.mutations.set(category, []);
    }
    
    this.mutations.get(category)!.push(fullMutation);

    logger.info('Custom mutation created', {
      component: 'RealTimeLayoutMutation',
      mutationId: id,
      trigger: mutation.trigger
    });

    return id;
  }

  /**
   * Get all available layout templates
   */
  getAvailableTemplates(): string[] {
    return Array.from(this.layoutTemplates.keys());
  }

  /**
   * Add new layout template
   */
  addLayoutTemplate(templateId: string, layout: LayoutBlock[]): void {
    this.layoutTemplates.set(templateId, layout);
    logger.info('Layout template added', {
      component: 'RealTimeLayoutMutation',
      templateId,
      blockCount: layout.length
    });
  }
}

export const realTimeLayoutMutationEngine = new RealTimeLayoutMutationEngine();
export { RealTimeLayoutMutationEngine, LayoutBlock, LayoutMutation, UserContext };