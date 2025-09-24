import { offerEngineCore } from "./offerEngineCore";
import { db } from "../../db";
import { eq, and, desc, gte, lte, sql, count, inArray } from "drizzle-orm";
import {
  offerFeed,
  offerAnalytics,
  offerPersonalizationRules,
  userSessions,
  behaviorEvents,
  semanticNodes,
  semanticEdges,
  type OfferFeed,
  type OfferPersonalizationRule,
  type InsertOfferPersonalizationRule
} from "@shared/schema";

export interface PersonalizationContext {
  sessionId: string;
  userId?: string;
  neuronId?: string;
  geoLocation?: string;
  deviceType?: string;
  userAgent?: string;
  referrer?: string;
  currentPage?: string;
  timeOfDay?: string;
  dayOfWeek?: string;
  intent?: string;
  emotion?: string;
  demographics?: {
    age?: number;
    gender?: string;
    income?: string;
    interests?: string[];
  };
  behaviorProfile?: {
    clickHistory?: string[];
    conversionHistory?: string[];
    preferences?: any;
    segment?: string;
  };
}

export interface PersonalizationRule {
  id: number;
  name: string;
  conditions: any;
  actions: any;
  priority: number;
  successRate: number;
}

export class OfferPersonalizationEngine {
  
  // ================================================
  // CORE PERSONALIZATION LOGIC
  // ================================================

  async getPersonalizedOffers(
    context: PersonalizationContext,
    limit: number = 10
  ): Promise<OfferFeed[]> {
    console.log(`🎯 Personalizing offers for session ${context.sessionId}`);
    
    // Get user behavior profile
    const behaviorProfile = await this.buildBehaviorProfile(context.sessionId);
    
    // Get personalization rules
    const rules = await this.getActivePersonalizationRules();
    
    // Apply rules to filter and rank offers
    let candidateOffers = await this.getCandidateOffers(context, behaviorProfile);
    
    // Apply personalization rules
    candidateOffers = await this.applyPersonalizationRules(candidateOffers, context, behaviorProfile, rules);
    
    // Apply semantic matching if intent is available
    if (context.intent) {
      candidateOffers = await this.applySemanticMatching(candidateOffers, context.intent);
    }
    
    // Apply emotion-based filtering
    if (context.emotion) {
      candidateOffers = this.applyEmotionFiltering(candidateOffers, context.emotion);
    }
    
    // Score and rank offers
    const scoredOffers = await this.scoreOffers(candidateOffers, context, behaviorProfile);
    
    // Return top offers
    const personalizedOffers = scoredOffers
      .sort((a, b) => b.personalizationScore - a.personalizationScore)
      .slice(0, limit);
    
    // Track personalization event
    await this.trackPersonalizationEvent(context, personalizedOffers);
    
    console.log(`✅ Returning ${personalizedOffers.length} personalized offers`);
    return personalizedOffers.map(o => o.offer);
  }

  async buildBehaviorProfile(sessionId: string): Promise<any> {
    // Get recent behavior events
    const recentEvents = await db.select()
      .from(behaviorEvents)
      .where(eq(behaviorEvents.sessionId, sessionId))
      .orderBy(desc(behaviorEvents.timestamp))
      .limit(100);
    
    // Get offer analytics for this session
    const offerEvents = await db.select()
      .from(offerAnalytics)
      .where(eq(offerAnalytics.sessionId, sessionId))
      .orderBy(desc(offerAnalytics.timestamp))
      .limit(50);
    
    // Analyze patterns
    const clickedCategories = [...new Set(offerEvents
      .filter(e => e.eventType === 'click')
      .map(e => e.metadata?.category)
      .filter(Boolean)
    )];
    
    const convertedCategories = [...new Set(offerEvents
      .filter(e => e.eventType === 'conversion')
      .map(e => e.metadata?.category)
      .filter(Boolean)
    )];
    
    const timeOfDayPreferences = this.analyzeTimePreferences(offerEvents);
    const priceRangePreferences = this.analyzePricePreferences(offerEvents);
    const emotionPreferences = this.analyzeEmotionPreferences(offerEvents);
    
    return {
      clickedCategories,
      convertedCategories,
      timeOfDayPreferences,
      priceRangePreferences,
      emotionPreferences,
      totalClicks: offerEvents.filter(e => e.eventType === 'click').length,
      totalConversions: offerEvents.filter(e => e.eventType === 'conversion').length,
      avgSessionTime: this.calculateAvgSessionTime(recentEvents),
      engagementLevel: this.calculateEngagementLevel(recentEvents, offerEvents)
    };
  }

  async getCandidateOffers(context: PersonalizationContext, behaviorProfile: any): Promise<OfferFeed[]> {
    let query = db.select().from(offerFeed)
      .where(and(
        eq(offerFeed.isActive, true),
        eq(offerFeed.isExpired, false)
      ));
    
    // Filter by neuron if specified
    if (context.neuronId) {
      const neuronOffers = await offerEngineCore.getOffersByNeuron(context.neuronId);
      if (neuronOffers.length > 0) {
        const offerIds = neuronOffers.map(o => o.id);
        query = query.where(inArray(offerFeed.id, offerIds));
      }
    }
    
    // Get broader candidate set for personalization
    const candidates = await query
      .orderBy(desc(offerFeed.qualityScore), desc(offerFeed.ctr))
      .limit(100);
    
    return candidates;
  }

  async applyPersonalizationRules(
    offers: OfferFeed[],
    context: PersonalizationContext,
    behaviorProfile: any,
    rules: OfferPersonalizationRule[]
  ): Promise<OfferFeed[]> {
    let filteredOffers = [...offers];
    
    for (const rule of rules.sort((a, b) => b.priority - a.priority)) {
      try {
        filteredOffers = await this.applyRule(filteredOffers, context, behaviorProfile, rule);
      } catch (error) {
        console.error(`❌ Error applying personalization rule ${rule.name}:`, error);
      }
    }
    
    return filteredOffers;
  }

  async applyRule(
    offers: OfferFeed[],
    context: PersonalizationContext,
    behaviorProfile: any,
    rule: OfferPersonalizationRule
  ): Promise<OfferFeed[]> {
    const conditions = rule.conditions as any;
    const actions = rule.actions as any;
    
    // Check if rule conditions are met
    if (!this.evaluateConditions(conditions, context, behaviorProfile)) {
      return offers;
    }
    
    // Apply rule actions
    if (actions.boost_categories) {
      const boostCategories = actions.boost_categories as string[];
      offers = offers.map(offer => ({
        ...offer,
        priority: boostCategories.includes(offer.category) ? offer.priority + 2 : offer.priority
      }));
    }
    
    if (actions.hide_categories) {
      const hideCategories = actions.hide_categories as string[];
      offers = offers.filter(offer => !hideCategories.includes(offer.category));
    }
    
    if (actions.boost_emotions) {
      const boostEmotions = actions.boost_emotions as string[];
      offers = offers.map(offer => ({
        ...offer,
        priority: boostEmotions.includes(offer.emotion || '') ? offer.priority + 1 : offer.priority
      }));
    }
    
    if (actions.price_filter) {
      const priceFilter = actions.price_filter;
      offers = offers.filter(offer => {
        if (!offer.price) return true;
        if (priceFilter.min && offer.price < priceFilter.min) return false;
        if (priceFilter.max && offer.price > priceFilter.max) return false;
        return true;
      });
    }
    
    return offers;
  }

  private evaluateConditions(conditions: any, context: PersonalizationContext, behaviorProfile: any): boolean {
    // Time-based conditions
    if (conditions.time_of_day) {
      const currentHour = new Date().getHours();
      if (!conditions.time_of_day.includes(currentHour)) return false;
    }
    
    // Geo-based conditions
    if (conditions.geo_location && context.geoLocation) {
      if (!conditions.geo_location.includes(context.geoLocation)) return false;
    }
    
    // Device-based conditions
    if (conditions.device_type && context.deviceType) {
      if (!conditions.device_type.includes(context.deviceType)) return false;
    }
    
    // Behavior-based conditions
    if (conditions.min_clicks && behaviorProfile.totalClicks < conditions.min_clicks) return false;
    if (conditions.min_conversions && behaviorProfile.totalConversions < conditions.min_conversions) return false;
    
    // Category preference conditions
    if (conditions.preferred_categories) {
      const preferredCategories = conditions.preferred_categories as string[];
      const hasPreference = preferredCategories.some(cat => 
        behaviorProfile.clickedCategories.includes(cat) || 
        behaviorProfile.convertedCategories.includes(cat)
      );
      if (!hasPreference) return false;
    }
    
    return true;
  }

  async applySemanticMatching(offers: OfferFeed[], intent: string): Promise<OfferFeed[]> {
    // Find semantic nodes matching the intent
    const semanticMatches = await db.select()
      .from(semanticNodes)
      .where(sql`${semanticNodes.content}::text ILIKE ${`%${intent}%`}`)
      .limit(10);
    
    if (semanticMatches.length === 0) return offers;
    
    // Boost offers that align with semantic intent
    const matchingCategories = [...new Set(semanticMatches
      .map(node => node.metadata?.category)
      .filter(Boolean)
    )];
    
    return offers.map(offer => ({
      ...offer,
      priority: matchingCategories.includes(offer.category) ? offer.priority + 3 : offer.priority
    }));
  }

  private applyEmotionFiltering(offers: OfferFeed[], emotion: string): OfferFeed[] {
    // Emotion mapping for better matching
    const emotionMap: Record<string, string[]> = {
      'urgent': ['urgent', 'limited', 'flash'],
      'exclusive': ['exclusive', 'premium', 'vip'],
      'trusted': ['trusted', 'reliable', 'secure'],
      'popular': ['popular', 'bestseller', 'trending']
    };
    
    const relatedEmotions = emotionMap[emotion] || [emotion];
    
    return offers.map(offer => ({
      ...offer,
      priority: relatedEmotions.includes(offer.emotion || '') ? offer.priority + 2 : offer.priority
    }));
  }

  async scoreOffers(
    offers: OfferFeed[],
    context: PersonalizationContext,
    behaviorProfile: any
  ): Promise<Array<{ offer: OfferFeed; personalizationScore: number }>> {
    return offers.map(offer => {
      let score = 0;
      
      // Base quality score
      score += offer.qualityScore || 0;
      
      // Performance metrics
      score += (offer.ctr || 0) * 10; // CTR weight
      score += (offer.conversionRate || 0) * 15; // Conversion weight
      score += offer.priority * 5; // Priority weight
      
      // Personalization factors
      if (behaviorProfile.clickedCategories.includes(offer.category)) score += 20;
      if (behaviorProfile.convertedCategories.includes(offer.category)) score += 30;
      
      // Price preference matching
      if (offer.price && behaviorProfile.priceRangePreferences) {
        const priceRange = this.getPriceRange(offer.price);
        if (behaviorProfile.priceRangePreferences.includes(priceRange)) score += 15;
      }
      
      // Emotion matching
      if (context.emotion === offer.emotion) score += 25;
      
      // Time-based relevance
      if (offer.validTill && offer.validTill > new Date()) {
        const daysLeft = Math.ceil((offer.validTill.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        score += Math.max(0, 10 - daysLeft); // Urgency boost
      }
      
      // Recency factor
      const daysOld = Math.ceil((Date.now() - offer.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      score += Math.max(0, 5 - daysOld); // Freshness boost
      
      return { offer, personalizationScore: score };
    });
  }

  // ================================================
  // PERSONALIZATION RULES MANAGEMENT
  // ================================================

  async createPersonalizationRule(rule: InsertOfferPersonalizationRule): Promise<OfferPersonalizationRule> {
    const [newRule] = await db.insert(offerPersonalizationRules).values(rule).returning();
    console.log(`✅ Created personalization rule: ${newRule.name}`);
    return newRule;
  }

  async getActivePersonalizationRules(): Promise<OfferPersonalizationRule[]> {
    return await db.select().from(offerPersonalizationRules)
      .where(eq(offerPersonalizationRules.isActive, true))
      .orderBy(desc(offerPersonalizationRules.priority));
  }

  async updatePersonalizationRule(id: number, rule: Partial<InsertOfferPersonalizationRule>): Promise<OfferPersonalizationRule> {
    const [updated] = await db.update(offerPersonalizationRules)
      .set({ ...rule, updatedAt: new Date() })
      .where(eq(offerPersonalizationRules.id, id))
      .returning();
    return updated;
  }

  // ================================================
  // ANALYTICS & HELPER METHODS
  // ================================================

  private analyzeTimePreferences(events: any[]): string[] {
    const hourCounts: Record<number, number> = {};
    
    events.forEach(event => {
      const hour = new Date(event.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    // Return hours with above-average activity
    const avgActivity = Object.values(hourCounts).reduce((a, b) => a + b, 0) / 24;
    return Object.entries(hourCounts)
      .filter(([_, count]) => count > avgActivity)
      .map(([hour, _]) => hour);
  }

  private analyzePricePreferences(events: any[]): string[] {
    const prices = events
      .filter(e => e.metadata?.price)
      .map(e => parseFloat(e.metadata.price))
      .filter(p => !isNaN(p));
    
    const ranges: string[] = [];
    prices.forEach(price => {
      ranges.push(this.getPriceRange(price));
    });
    
    return [...new Set(ranges)];
  }

  private analyzeEmotionPreferences(events: any[]): string[] {
    const emotions = events
      .filter(e => e.metadata?.emotion)
      .map(e => e.metadata.emotion);
    
    return [...new Set(emotions)];
  }

  private getPriceRange(price: number): string {
    if (price < 25) return 'budget';
    if (price < 100) return 'affordable';
    if (price < 500) return 'premium';
    return 'luxury';
  }

  private calculateAvgSessionTime(events: any[]): number {
    if (events.length < 2) return 0;
    
    const firstEvent = events[events.length - 1];
    const lastEvent = events[0];
    const sessionTime = new Date(lastEvent.timestamp).getTime() - new Date(firstEvent.timestamp).getTime();
    
    return sessionTime / (1000 * 60); // Return in minutes
  }

  private calculateEngagementLevel(behaviorEvents: any[], offerEvents: any[]): string {
    const totalEvents = behaviorEvents.length + offerEvents.length;
    const clicks = offerEvents.filter(e => e.eventType === 'click').length;
    const conversions = offerEvents.filter(e => e.eventType === 'conversion').length;
    
    if (conversions > 0) return 'high';
    if (clicks > 3 || totalEvents > 20) return 'medium';
    return 'low';
  }

  private async trackPersonalizationEvent(context: PersonalizationContext, offers: any[]): Promise<void> {
    try {
      await offerEngineCore.trackOfferAnalytics({
        sessionId: context.sessionId,
        userId: context.userId,
        neuronId: context.neuronId,
        eventType: 'personalization',
        deviceType: context.deviceType,
        geoLocation: context.geoLocation,
        userAgent: context.userAgent,
        referrer: context.referrer,
        metadata: {
          offersReturned: offers.length,
          personalizationContext: context,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('❌ Failed to track personalization event:', error);
    }
  }
}

// Export singleton instance
export const offerPersonalizationEngine = new OfferPersonalizationEngine();