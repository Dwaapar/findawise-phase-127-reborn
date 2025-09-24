import { storage } from '../storage';

export interface UserArchetype {
  id: string;
  name: string;
  description: string;
  characteristics: {
    engagement: 'high' | 'medium' | 'low';
    conversionRate: 'high' | 'medium' | 'low';
    sessionDuration: 'long' | 'medium' | 'short';
    returnVisits: 'frequent' | 'occasional' | 'rare';
    pricesensitivity: 'high' | 'medium' | 'low';
  };
  preferences: {
    emotions: string[];
    contentTypes: string[];
    ctaStyles: string[];
    offerTypes: string[];
  };
  targetingRules: {
    minSessions: number;
    minPageViews: number;
    avgSessionDuration: number;
    bounceRateThreshold: number;
    conversionThreshold: number;
  };
  recommendations: {
    emotions: string[];
    contentStrategy: string;
    ctaApproach: string;
    offerStrategy: string;
  };
}

export interface ArchetypeAssignment {
  sessionId: string;
  archetypeId: string;
  confidence: number;
  timestamp: Date;
  factors: {
    sessionBehavior: number;
    engagement: number;
    conversionHistory: number;
    deviceType: number;
    trafficSource: number;
  };
}

class ArchetypeEngineService {
  private archetypes: Map<string, UserArchetype> = new Map();

  constructor() {
    this.initializeArchetypes();
  }

  private initializeArchetypes(): void {
    // Define the core user archetypes
    const archetypes: UserArchetype[] = [
      {
        id: 'power_user',
        name: 'Power User',
        description: 'Highly engaged users who spend significant time on site and have high conversion rates',
        characteristics: {
          engagement: 'high',
          conversionRate: 'high',
          sessionDuration: 'long',
          returnVisits: 'frequent',
          pricesensitivity: 'low'
        },
        preferences: {
          emotions: ['confidence', 'excitement'],
          contentTypes: ['detailed', 'technical', 'comprehensive'],
          ctaStyles: ['direct', 'premium', 'exclusive'],
          offerTypes: ['premium', 'advanced', 'exclusive']
        },
        targetingRules: {
          minSessions: 5,
          minPageViews: 20,
          avgSessionDuration: 300, // 5 minutes
          bounceRateThreshold: 0.3,
          conversionThreshold: 0.05
        },
        recommendations: {
          emotions: ['confidence', 'excitement'],
          contentStrategy: 'Provide comprehensive, detailed content with advanced features',
          ctaApproach: 'Use premium, exclusive language with direct calls-to-action',
          offerStrategy: 'Present high-value, exclusive offers with advanced features'
        }
      },
      {
        id: 'casual_browser',
        name: 'Casual Browser',
        description: 'Users who browse casually with moderate engagement and conversion rates',
        characteristics: {
          engagement: 'medium',
          conversionRate: 'medium',
          sessionDuration: 'medium',
          returnVisits: 'occasional',
          pricesensitivity: 'medium'
        },
        preferences: {
          emotions: ['trust', 'calm'],
          contentTypes: ['scannable', 'visual', 'digestible'],
          ctaStyles: ['friendly', 'approachable', 'clear'],
          offerTypes: ['balanced', 'popular', 'recommended']
        },
        targetingRules: {
          minSessions: 2,
          minPageViews: 8,
          avgSessionDuration: 120, // 2 minutes
          bounceRateThreshold: 0.6,
          conversionThreshold: 0.02
        },
        recommendations: {
          emotions: ['trust', 'calm'],
          contentStrategy: 'Create scannable, visual content that is easy to digest',
          ctaApproach: 'Use friendly, approachable language with clear benefits',
          offerStrategy: 'Present balanced offers with clear value propositions'
        }
      },
      {
        id: 'high_intent',
        name: 'High Intent',
        description: 'Users with specific goals who show strong purchase intent but need reassurance',
        characteristics: {
          engagement: 'high',
          conversionRate: 'high',
          sessionDuration: 'medium',
          returnVisits: 'occasional',
          pricesensitivity: 'medium'
        },
        preferences: {
          emotions: ['trust', 'relief'],
          contentTypes: ['focused', 'solution-oriented', 'testimonial'],
          ctaStyles: ['urgent', 'benefit-focused', 'reassuring'],
          offerTypes: ['solution-focused', 'guaranteed', 'risk-free']
        },
        targetingRules: {
          minSessions: 1,
          minPageViews: 5,
          avgSessionDuration: 180, // 3 minutes
          bounceRateThreshold: 0.4,
          conversionThreshold: 0.08
        },
        recommendations: {
          emotions: ['trust', 'relief'],
          contentStrategy: 'Focus on solutions and benefits with social proof',
          ctaApproach: 'Use urgent, benefit-focused language with reassurance',
          offerStrategy: 'Present solution-focused offers with guarantees and risk reduction'
        }
      },
      {
        id: 'price_sensitive',
        name: 'Price Sensitive',
        description: 'Users who are highly sensitive to pricing and look for deals and discounts',
        characteristics: {
          engagement: 'medium',
          conversionRate: 'low',
          sessionDuration: 'short',
          returnVisits: 'frequent',
          pricesensitivity: 'high'
        },
        preferences: {
          emotions: ['excitement', 'relief'],
          contentTypes: ['deal-focused', 'comparison', 'value-oriented'],
          ctaStyles: ['discount-focused', 'time-sensitive', 'savings-oriented'],
          offerTypes: ['discounted', 'limited-time', 'bundle']
        },
        targetingRules: {
          minSessions: 3,
          minPageViews: 15,
          avgSessionDuration: 90, // 1.5 minutes
          bounceRateThreshold: 0.7,
          conversionThreshold: 0.01
        },
        recommendations: {
          emotions: ['excitement', 'relief'],
          contentStrategy: 'Emphasize value, savings, and price comparisons',
          ctaApproach: 'Highlight discounts, savings, and limited-time offers',
          offerStrategy: 'Present discounted, bundle, or limited-time offers'
        }
      },
      {
        id: 'skeptical_researcher',
        name: 'Skeptical Researcher',
        description: 'Users who thoroughly research before making decisions and need extensive proof',
        characteristics: {
          engagement: 'high',
          conversionRate: 'low',
          sessionDuration: 'long',
          returnVisits: 'frequent',
          pricesensitivity: 'medium'
        },
        preferences: {
          emotions: ['trust', 'confidence'],
          contentTypes: ['detailed', 'research-based', 'comparison'],
          ctaStyles: ['informative', 'no-pressure', 'educational'],
          offerTypes: ['trial', 'demonstration', 'educational']
        },
        targetingRules: {
          minSessions: 4,
          minPageViews: 25,
          avgSessionDuration: 400, // 6+ minutes
          bounceRateThreshold: 0.5,
          conversionThreshold: 0.005
        },
        recommendations: {
          emotions: ['trust', 'confidence'],
          contentStrategy: 'Provide detailed, research-backed content with comparisons',
          ctaApproach: 'Use informative, no-pressure language with educational focus',
          offerStrategy: 'Offer trials, demonstrations, and educational resources'
        }
      }
    ];

    // Initialize archetypes map
    for (const archetype of archetypes) {
      this.archetypes.set(archetype.id, archetype);
    }

    console.log(`✅ Initialized ${archetypes.length} user archetypes`);
  }

  /**
   * Assign archetype to a user session
   */
  async assignArchetype(sessionId: string): Promise<ArchetypeAssignment> {
    try {
      // Get user behavior data
      const session = await storage.getUserSession(sessionId);
      const behaviorEvents = await storage.getBehaviorEventsBySession(sessionId);
      const userProfile = await storage.getGlobalUserProfile(sessionId);

      if (!session && !userProfile) {
        throw new Error('No session or user profile found');
      }

      // Calculate archetype scores
      const scores = new Map<string, number>();
      const factors = {
        sessionBehavior: 0,
        engagement: 0,
        conversionHistory: 0,
        deviceType: 0,
        trafficSource: 0
      };

      for (const [archetypeId, archetype] of this.archetypes) {
        const score = await this.calculateArchetypeScore(
          archetype,
          session,
          behaviorEvents,
          userProfile,
          factors
        );
        scores.set(archetypeId, score);
      }

      // Find best matching archetype
      const bestMatch = Array.from(scores.entries())
        .sort((a, b) => b[1] - a[1])[0];

      if (!bestMatch) {
        throw new Error('No archetype match found');
      }

      const [bestArchetypeId, confidence] = bestMatch;

      const assignment: ArchetypeAssignment = {
        sessionId,
        archetypeId: bestArchetypeId,
        confidence,
        timestamp: new Date(),
        factors
      };

      // Store assignment in database
      await this.storeArchetypeAssignment(assignment);

      console.log(`✅ Assigned archetype ${bestArchetypeId} to session ${sessionId} (confidence: ${(confidence * 100).toFixed(1)}%)`);
      
      return assignment;
    } catch (error) {
      console.error('Failed to assign archetype:', error);
      throw error;
    }
  }

  /**
   * Calculate archetype score for a user
   */
  private async calculateArchetypeScore(
    archetype: UserArchetype,
    session: any,
    behaviorEvents: any[],
    userProfile: any,
    factors: any
  ): Promise<number> {
    let score = 0;
    let totalWeight = 0;

    // Session behavior scoring (30% weight)
    if (session) {
      const sessionScore = this.scoreSessionBehavior(archetype, session, behaviorEvents);
      score += sessionScore * 0.3;
      factors.sessionBehavior = sessionScore;
      totalWeight += 0.3;
    }

    // Engagement scoring (25% weight)
    if (behaviorEvents.length > 0) {
      const engagementScore = this.scoreEngagement(archetype, behaviorEvents);
      score += engagementScore * 0.25;
      factors.engagement = engagementScore;
      totalWeight += 0.25;
    }

    // Conversion history scoring (20% weight)
    if (userProfile) {
      const conversionScore = this.scoreConversionHistory(archetype, userProfile);
      score += conversionScore * 0.2;
      factors.conversionHistory = conversionScore;
      totalWeight += 0.2;
    }

    // Device type scoring (15% weight)
    if (userProfile) {
      const deviceScore = this.scoreDeviceType(archetype, userProfile);
      score += deviceScore * 0.15;
      factors.deviceType = deviceScore;
      totalWeight += 0.15;
    }

    // Traffic source scoring (10% weight)
    if (session) {
      const trafficScore = this.scoreTrafficSource(archetype, session);
      score += trafficScore * 0.1;
      factors.trafficSource = trafficScore;
      totalWeight += 0.1;
    }

    // Normalize score
    return totalWeight > 0 ? score / totalWeight : 0;
  }

  /**
   * Score session behavior against archetype
   */
  private scoreSessionBehavior(archetype: UserArchetype, session: any, behaviorEvents: any[]): number {
    let score = 0;
    let checks = 0;

    // Session duration
    const sessionDuration = session.totalTimeOnSite || 0;
    if (archetype.targetingRules.avgSessionDuration) {
      const durationMatch = this.matchDuration(
        sessionDuration,
        archetype.targetingRules.avgSessionDuration,
        archetype.characteristics.sessionDuration
      );
      score += durationMatch;
      checks++;
    }

    // Page views
    const pageViews = behaviorEvents.filter(e => e.eventType === 'page_view').length;
    if (archetype.targetingRules.minPageViews) {
      const pageViewMatch = pageViews >= archetype.targetingRules.minPageViews ? 1 : 0.5;
      score += pageViewMatch;
      checks++;
    }

    // Bounce rate
    const bounceRate = session.bounceRate || 0;
    if (archetype.targetingRules.bounceRateThreshold) {
      const bounceMatch = bounceRate <= archetype.targetingRules.bounceRateThreshold ? 1 : 0.3;
      score += bounceMatch;
      checks++;
    }

    return checks > 0 ? score / checks : 0;
  }

  /**
   * Score engagement against archetype
   */
  private scoreEngagement(archetype: UserArchetype, behaviorEvents: any[]): number {
    let score = 0;
    let checks = 0;

    // Engagement events
    const engagementEvents = behaviorEvents.filter(e => 
      e.eventType === 'engagement' || e.eventType === 'interaction'
    ).length;
    
    const totalEvents = behaviorEvents.length;
    const engagementRate = totalEvents > 0 ? engagementEvents / totalEvents : 0;

    // Match engagement level
    const targetEngagement = archetype.characteristics.engagement;
    if (targetEngagement === 'high' && engagementRate > 0.3) {
      score += 1;
    } else if (targetEngagement === 'medium' && engagementRate > 0.1) {
      score += 0.8;
    } else if (targetEngagement === 'low' && engagementRate < 0.2) {
      score += 0.6;
    } else {
      score += 0.3;
    }
    checks++;

    return checks > 0 ? score / checks : 0;
  }

  /**
   * Score conversion history against archetype
   */
  private scoreConversionHistory(archetype: UserArchetype, userProfile: any): number {
    let score = 0;
    let checks = 0;

    // Conversion rate
    const conversionRate = userProfile.conversionRate || 0;
    const targetConversion = archetype.characteristics.conversionRate;
    
    if (targetConversion === 'high' && conversionRate > 0.05) {
      score += 1;
    } else if (targetConversion === 'medium' && conversionRate > 0.02) {
      score += 0.8;
    } else if (targetConversion === 'low' && conversionRate < 0.03) {
      score += 0.6;
    } else {
      score += 0.3;
    }
    checks++;

    // Visit frequency
    const visitFrequency = userProfile.sessionCount || 0;
    const targetVisits = archetype.characteristics.returnVisits;
    
    if (targetVisits === 'frequent' && visitFrequency > 10) {
      score += 1;
    } else if (targetVisits === 'occasional' && visitFrequency > 3) {
      score += 0.8;
    } else if (targetVisits === 'rare' && visitFrequency <= 2) {
      score += 0.6;
    } else {
      score += 0.3;
    }
    checks++;

    return checks > 0 ? score / checks : 0;
  }

  /**
   * Score device type against archetype
   */
  private scoreDeviceType(archetype: UserArchetype, userProfile: any): number {
    // Simple device type scoring (can be enhanced)
    const deviceType = userProfile.deviceType || 'desktop';
    
    // Power users tend to use desktop/laptop
    if (archetype.id === 'power_user' && deviceType === 'desktop') {
      return 1;
    }
    
    // Casual browsers often use mobile
    if (archetype.id === 'casual_browser' && deviceType === 'mobile') {
      return 1;
    }
    
    return 0.5; // Neutral score
  }

  /**
   * Score traffic source against archetype
   */
  private scoreTrafficSource(archetype: UserArchetype, session: any): number {
    const trafficSource = session.trafficSource || 'direct';
    
    // High intent users often come from search
    if (archetype.id === 'high_intent' && trafficSource === 'search') {
      return 1;
    }
    
    // Price sensitive users often come from deal sites
    if (archetype.id === 'price_sensitive' && trafficSource === 'referral') {
      return 1;
    }
    
    return 0.5; // Neutral score
  }

  /**
   * Match duration against archetype expectations
   */
  private matchDuration(actual: number, expected: number, characteristic: string): number {
    const ratio = actual / expected;
    
    if (characteristic === 'long') {
      return ratio >= 1 ? 1 : ratio * 0.8;
    } else if (characteristic === 'short') {
      return ratio <= 0.5 ? 1 : (1 - ratio) * 0.8;
    } else {
      return ratio >= 0.5 && ratio <= 1.5 ? 1 : 0.6;
    }
  }

  /**
   * Store archetype assignment
   */
  private async storeArchetypeAssignment(assignment: ArchetypeAssignment): Promise<void> {
    try {
      // Store in behavior events table for now
      await storage.trackBehaviorEvent({
        sessionId: assignment.sessionId,
        eventType: 'archetype_assignment',
        eventData: {
          archetypeId: assignment.archetypeId,
          confidence: assignment.confidence,
          factors: assignment.factors
        },
        timestamp: assignment.timestamp
      });
    } catch (error) {
      console.error('Failed to store archetype assignment:', error);
    }
  }

  /**
   * Get archetype recommendations for a user
   */
  async getArchetypeRecommendations(archetypeId: string): Promise<any> {
    const archetype = this.archetypes.get(archetypeId);
    if (!archetype) {
      throw new Error(`Archetype ${archetypeId} not found`);
    }

    return {
      archetype: archetype.name,
      recommendations: archetype.recommendations,
      preferences: archetype.preferences,
      characteristics: archetype.characteristics
    };
  }

  /**
   * Get all archetypes
   */
  getArchetypes(): UserArchetype[] {
    return Array.from(this.archetypes.values());
  }

  /**
   * Get specific archetype
   */
  getArchetype(id: string): UserArchetype | undefined {
    return this.archetypes.get(id);
  }

  /**
   * Get archetype distribution
   */
  async getArchetypeDistribution(): Promise<any> {
    try {
      // Get all archetype assignments from behavior events
      const assignments = await storage.getBehaviorEventsByType('archetype_assignment');
      
      const distribution: { [key: string]: number } = {};
      const confidenceScores: { [key: string]: number[] } = {};
      
      for (const assignment of assignments) {
        const archetypeId = assignment.eventData?.archetypeId;
        const confidence = assignment.eventData?.confidence || 0;
        
        if (archetypeId) {
          distribution[archetypeId] = (distribution[archetypeId] || 0) + 1;
          if (!confidenceScores[archetypeId]) {
            confidenceScores[archetypeId] = [];
          }
          confidenceScores[archetypeId].push(confidence);
        }
      }

      // Calculate averages
      const result: any = {};
      for (const [archetypeId, count] of Object.entries(distribution)) {
        const archetype = this.archetypes.get(archetypeId);
        const confidences = confidenceScores[archetypeId] || [];
        const avgConfidence = confidences.length > 0 ? 
          confidences.reduce((sum, c) => sum + c, 0) / confidences.length : 0;

        result[archetypeId] = {
          name: archetype?.name || archetypeId,
          count,
          percentage: (count / assignments.length) * 100,
          averageConfidence: avgConfidence
        };
      }

      return result;
    } catch (error) {
      console.error('Failed to get archetype distribution:', error);
      return {};
    }
  }
}

export const archetypeEngine = new ArchetypeEngineService();