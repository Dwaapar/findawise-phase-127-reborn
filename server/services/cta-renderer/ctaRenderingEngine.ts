/**
 * AR/VR/3D CTA Rendering Engine - Core Service
 * Empire-Grade Cross-Platform 3D/AR/VR CTA Management System
 */

import { storage } from '../../storage';
import type { 
  InsertCtaTemplate, 
  InsertCtaInstance, 
  InsertCtaAnalytics,
  CtaTemplate,
  CtaInstance,
  CtaAsset
} from '@shared/ctaRendererTables';
import { logger } from '../../utils/logger';
import { ctaAssetManager } from './ctaAssetManager';
import { ctaPersonalizationEngine } from './ctaPersonalizationEngine';

export class CTARenderingEngine {
  private static instance: CTARenderingEngine;
  private assetManager = ctaAssetManager;
  private personalizationEngine = ctaPersonalizationEngine;
  
  private constructor() {}
  
  public static getInstance(): CTARenderingEngine {
    if (!CTARenderingEngine.instance) {
      CTARenderingEngine.instance = new CTARenderingEngine();
    }
    return CTARenderingEngine.instance;
  }

  /**
   * Initialize the CTA Rendering Engine
   */
  async initialize(): Promise<void> {
    logger.info('🎯 Initializing AR/VR/3D CTA Rendering Engine...');
    
    try {
      // Initialize sub-systems
      await this.assetManager.initialize();
      await this.personalizationEngine.initialize();
      
      logger.info('✅ AR/VR/3D CTA Rendering Engine initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize CTA Rendering Engine:', error as Record<string, any>);
      throw error;
    }
  }

  /**
   * Create a new CTA template
   */
  async createTemplate(templateData: Omit<InsertCtaTemplate, 'createdAt' | 'updatedAt'>): Promise<CtaTemplate> {
    try {
      const template = await storage.createCtaTemplate(templateData);
      logger.info(`✅ Created CTA template: ${template.name} (${template.templateId})`);
      return template;
    } catch (error) {
      logger.error('❌ Failed to create CTA template:', error as Record<string, any>);
      throw error;
    }
  }

  /**
   * Create a new CTA instance from template
   */
  async createInstance(
    templateId: string, 
    instanceData: Omit<InsertCtaInstance, 'createdAt' | 'updatedAt'>
  ): Promise<CtaInstance> {
    try {
      const template = await storage.getCtaTemplate(templateId);
      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }

      const instance = await storage.createCtaInstance({
        ...instanceData,
        templateId
      });

      logger.info(`✅ Created CTA instance: ${instance.name} (${instance.instanceId})`);
      return instance;
    } catch (error) {
      logger.error('❌ Failed to create CTA instance:', error as Record<string, any>);
      throw error;
    }
  }

  /**
   * Render a personalized CTA instance
   */
  async renderInstance(
    instanceId: string,
    context: any
  ): Promise<any> {
    try {
      // Get instance and template
      const instance = await storage.getCtaInstance(instanceId);
      if (!instance) {
        throw new Error(`Instance ${instanceId} not found`);
      }

      const template = await storage.getCtaTemplate(instance.templateId);
      if (!template) {
        throw new Error(`Template ${instance.templateId} not found`);
      }

      // Generate personalization
      const personalization = await this.personalizationEngine.personalizeCtaInstance(
        template,
        instance,
        context
      );

      // Select optimal assets
      const optimizedAssets = await this.getOptimizedAssets(template, context.deviceCapabilities || {});

      // Apply real-time adaptations
      const adaptedConfig = await this.personalizationEngine.adaptToRealtimeBehavior(
        personalization,
        context.behaviorUpdate || {}
      );

      // Generate final rendering configuration
      const renderConfig = {
        instance,
        template,
        personalization: adaptedConfig,
        assets: optimizedAssets,
        context,
        renderedAt: new Date(),
        renderingPipeline: this.selectRenderingPipeline(context.deviceCapabilities || {}),
        fallbackChain: this.generateFallbackChain(context.deviceCapabilities || {})
      };

      // Track analytics
      await this.trackAnalyticsEvent('impression', instanceId, context);

      logger.info(`🎨 Rendered CTA instance: ${instanceId} with ${adaptedConfig.archetype} personalization`);
      return renderConfig;
    } catch (error) {
      logger.error('❌ Failed to render CTA instance:', error as Record<string, any>);
      throw error;
    }
  }

  /**
   * Get optimized assets for device capabilities
   */
  private async getOptimizedAssets(template: CtaTemplate, deviceCapabilities: any): Promise<any> {
    const templateConfig = template.config as any || {};
    const assetIds = templateConfig.assets || [];
    
    const optimizedAssets: any = {};
    
    for (const assetId of assetIds) {
      try {
        const optimizedAsset = await this.assetManager.getOptimizedAsset(assetId, deviceCapabilities);
        optimizedAssets[assetId] = optimizedAsset;
      } catch (error) {
        logger.warn(`Failed to optimize asset ${assetId}:`, error as Record<string, any>);
      }
    }
    
    return optimizedAssets;
  }

  /**
   * Select rendering pipeline based on device capabilities
   */
  private selectRenderingPipeline(deviceCapabilities: any): string {
    const webgl = deviceCapabilities.webgl || 0;
    const webxr = deviceCapabilities.webxr || false;
    const memory = deviceCapabilities.memory || 0;
    const platform = deviceCapabilities.platform || 'desktop';

    if (webxr && webgl === 2) {
      return 'webxr_immersive';
    } else if (webgl === 2 && memory > 4096) {
      return 'webgl2_enhanced';
    } else if (webgl === 2) {
      return 'webgl2_standard';
    } else if (webgl === 1 && platform === 'mobile') {
      return 'webgl1_mobile';
    } else if (webgl === 1) {
      return 'webgl1_desktop';
    } else {
      return 'canvas_fallback';
    }
  }

  /**
   * Generate fallback rendering chain
   */
  private generateFallbackChain(deviceCapabilities: any): string[] {
    const pipeline = this.selectRenderingPipeline(deviceCapabilities);
    
    const fallbackChains: Record<string, string[]> = {
      'webxr_immersive': ['webgl2_enhanced', 'webgl2_standard', 'webgl1_desktop', 'canvas_fallback'],
      'webgl2_enhanced': ['webgl2_standard', 'webgl1_desktop', 'canvas_fallback'],
      'webgl2_standard': ['webgl1_desktop', 'canvas_fallback'],
      'webgl1_mobile': ['canvas_fallback'],
      'webgl1_desktop': ['canvas_fallback'],
      'canvas_fallback': ['static_image']
    };
    
    return fallbackChains[pipeline] || ['static_image'];
  }

  /**
   * Track analytics event
   */
  private async trackAnalyticsEvent(
    eventType: string,
    instanceId: string,
    context: any
  ): Promise<void> {
    try {
      await storage.createCtaAnalyticsEvent({
        eventId: `event_${crypto.randomUUID()}`,
        instanceId,
        eventType,
        timestamp: new Date(),
        userId: context.userId || null,
        sessionId: context.sessionId || crypto.randomUUID(),
        deviceInfo: context.deviceCapabilities || {},
        userAgent: context.userAgent || '',
        pageUrl: context.contextData?.pageUrl || '',
        dwellTime: context.dwellTime || 0,
        interactionDepth: context.interactionDepth || 0,
        completionRate: context.completionRate || 0,
        conversionValue: context.conversionValue || null,
        metadata: {
          renderingPipeline: this.selectRenderingPipeline(context.deviceCapabilities || {}),
          personalization: context.personalization || {}
        }
      });
    } catch (error) {
      logger.warn('Analytics tracking failed:', error as Record<string, any>);
    }
  }

  /**
   * Handle interaction events
   */
  async handleInteraction(
    instanceId: string,
    interactionType: string,
    interactionData: any,
    context: any
  ): Promise<any> {
    try {
      // Track interaction analytics
      await this.trackAnalyticsEvent('interaction', instanceId, {
        ...context,
        interactionType,
        interactionData
      });

      // Get current instance
      const instance = await storage.getCtaInstance(instanceId);
      if (!instance) {
        throw new Error(`Instance ${instanceId} not found`);
      }

      // Update user session
      await this.updateUserSession(instanceId, context, interactionData);

      // Check for conversion
      const isConversion = await this.checkConversion(interactionType, interactionData);
      if (isConversion) {
        await this.handleConversion(instanceId, context, interactionData);
      }

      logger.info(`🎮 Handled interaction: ${interactionType} for instance ${instanceId}`);

      return {
        success: true,
        isConversion,
        adaptations: await this.generateRealtimeAdaptations(instanceId, interactionType, interactionData, context)
      };
    } catch (error) {
      logger.error('❌ Failed to handle interaction:', error as Record<string, any>);
      throw error;
    }
  }

  /**
   * Update user session with interaction data
   */
  private async updateUserSession(instanceId: string, context: any, interactionData: any): Promise<void> {
    const sessionId = context.sessionId || crypto.randomUUID();
    
    try {
      // Try to get existing session
      let session = await storage.getCtaUserSession(sessionId, instanceId);
      
      if (session) {
        // Update existing session
        await storage.updateCtaUserSession(sessionId, instanceId, {
          interactionCount: (session.interactionCount || 0) + 1,
          lastInteraction: new Date(),
          behaviorData: {
            ...session.behaviorData,
            lastInteractionType: interactionData.type,
            totalInteractions: (session.interactionCount || 0) + 1
          },
          updatedAt: new Date()
        });
      } else {
        // Create new session
        await storage.createCtaUserSession({
          sessionId,
          instanceId,
          userId: context.userId || null,
          startTime: new Date(),
          lastInteraction: new Date(),
          interactionCount: 1,
          deviceInfo: context.deviceCapabilities || {},
          behaviorData: {
            firstInteractionType: interactionData.type,
            totalInteractions: 1
          },
          conversionData: null
        });
      }
    } catch (error) {
      logger.warn('Failed to update user session:', error as Record<string, any>);
    }
  }

  /**
   * Check if interaction constitutes a conversion
   */
  private async checkConversion(interactionType: string, interactionData: any): Promise<boolean> {
    const conversionEvents = [
      'cta_click',
      'purchase_intent',
      'form_submit',
      'download_click',
      'signup_click',
      'demo_request'
    ];
    
    return conversionEvents.includes(interactionType) || 
           (interactionData.isConversion === true) ||
           (interactionData.conversionValue && interactionData.conversionValue > 0);
  }

  /**
   * Handle conversion event
   */
  private async handleConversion(instanceId: string, context: any, interactionData: any): Promise<void> {
    try {
      // Track conversion analytics
      await this.trackAnalyticsEvent('conversion', instanceId, {
        ...context,
        conversionValue: interactionData.conversionValue || 0,
        conversionType: interactionData.conversionType || 'click'
      });

      logger.info(`🎯 Conversion tracked for instance ${instanceId}`);
    } catch (error) {
      logger.warn('Failed to handle conversion:', error as Record<string, any>);
    }
  }

  /**
   * Generate real-time adaptations based on user behavior
   */
  private async generateRealtimeAdaptations(
    instanceId: string,
    interactionType: string,
    interactionData: any,
    context: any
  ): Promise<any[]> {
    const adaptations: any[] = [];
    
    // Interaction frequency adaptations
    if (interactionData.rapidClicks > 3) {
      adaptations.push({
        type: 'reduce_sensitivity',
        reason: 'User showing rapid clicking behavior',
        implementation: 'increase_click_delay'
      });
    }
    
    // Dwell time adaptations
    if (context.dwellTime > 30000 && interactionType === 'hover') {
      adaptations.push({
        type: 'expand_details',
        reason: 'User showing high engagement',
        implementation: 'show_additional_info'
      });
    }
    
    return adaptations;
  }

  /**
   * Get instance analytics and performance metrics
   */
  async getInstanceAnalytics(instanceId: string, timeRange?: { start: Date; end: Date }): Promise<any> {
    try {
      const analytics = await storage.getCtaAnalytics(instanceId, timeRange);
      const summary = await storage.getCtaAnalyticsSummary(instanceId);
      const sessions = await storage.getCtaUserSessions({ instanceId });
      
      return {
        summary,
        analytics,
        sessions: {
          total: sessions.length,
          converted: sessions.filter(s => s.isConverted).length,
          averageSessionDuration: this.calculateAverageSessionDuration(sessions),
          averageInteractionsPerSession: this.calculateAverageInteractions(sessions)
        },
        performance: await this.calculatePerformanceMetrics(instanceId, analytics)
      };
    } catch (error) {
      logger.error('❌ Failed to get instance analytics:', error as Record<string, any>);
      throw error;
    }
  }

  /**
   * Calculate average session duration
   */
  private calculateAverageSessionDuration(sessions: any[]): number {
    if (sessions.length === 0) return 0;
    
    const totalDuration = sessions.reduce((sum, session) => {
      if (session.lastInteraction && session.startTime) {
        return sum + (session.lastInteraction.getTime() - session.startTime.getTime());
      }
      return sum;
    }, 0);
    
    return totalDuration / sessions.length;
  }

  /**
   * Calculate average interactions per session
   */
  private calculateAverageInteractions(sessions: any[]): number {
    if (sessions.length === 0) return 0;
    
    const totalInteractions = sessions.reduce((sum, session) => sum + (session.interactionCount || 0), 0);
    return totalInteractions / sessions.length;
  }

  /**
   * Calculate performance metrics
   */
  private async calculatePerformanceMetrics(instanceId: string, analytics: any[]): Promise<any> {
    const metrics = {
      loadTime: 0,
      renderTime: 0,
      interactionLatency: 0,
      errorRate: 0,
      performanceScore: 0
    };
    
    // Calculate from analytics data
    const renderEvents = analytics.filter(e => e.eventType === 'render');
    const errorEvents = analytics.filter(e => e.eventType === 'error');
    
    if (renderEvents.length > 0) {
      metrics.renderTime = renderEvents.reduce((sum, e) => sum + (e.metadata?.renderTime || 0), 0) / renderEvents.length;
    }
    
    metrics.errorRate = analytics.length > 0 ? (errorEvents.length / analytics.length) * 100 : 0;
    
    // Calculate overall performance score (0-100)
    metrics.performanceScore = Math.max(0, 100 - (metrics.renderTime / 10) - (metrics.errorRate * 5));
    
    return metrics;
  }

  /**
   * Get available rendering pipelines and their capabilities
   */
  getPipelineCapabilities(): any {
    return {
      webxr_immersive: {
        description: 'Full WebXR immersive experience with hand tracking',
        requirements: { webxr: true, webgl: 2, memory: 4096 },
        features: ['6dof', 'hand_tracking', 'spatial_audio', 'haptic_feedback'],
        performance: 'high'
      },
      webgl2_enhanced: {
        description: 'Enhanced WebGL2 with advanced effects and post-processing',
        requirements: { webgl: 2, memory: 2048 },
        features: ['shadows', 'reflections', 'post_processing', 'particle_systems'],
        performance: 'high'
      },
      webgl2_standard: {
        description: 'Standard WebGL2 rendering with basic effects',
        requirements: { webgl: 2 },
        features: ['basic_lighting', 'textures', 'simple_animations'],
        performance: 'medium'
      },
      webgl1_mobile: {
        description: 'Mobile-optimized WebGL1 rendering',
        requirements: { webgl: 1, platform: 'mobile' },
        features: ['basic_textures', 'simple_geometry', 'touch_interactions'],
        performance: 'low'
      },
      webgl1_desktop: {
        description: 'Desktop WebGL1 rendering with standard features',
        requirements: { webgl: 1 },
        features: ['basic_lighting', 'textures', 'mouse_interactions'],
        performance: 'medium'
      },
      canvas_fallback: {
        description: '2D Canvas rendering for maximum compatibility',
        requirements: {},
        features: ['2d_graphics', 'basic_animations', 'click_interactions'],
        performance: 'low'
      }
    };
  }
}

export const ctaRenderingEngine = CTARenderingEngine.getInstance();