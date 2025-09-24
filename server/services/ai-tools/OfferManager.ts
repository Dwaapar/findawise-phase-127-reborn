import { DatabaseStorage } from '../../storage';

interface OfferConfig {
  maxDisplayed: number;
  rotationInterval: number; // in milliseconds
  ctrThreshold: number; // minimum CTR to keep showing
  priorityWeights: {
    featured: number;
    conversionRate: number;
    commission: number;
    freshness: number;
  };
}

interface OfferPerformance {
  offerId: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  revenue: number;
  lastShown: Date;
}

export class OfferManager {
  private storage: DatabaseStorage;
  private config: OfferConfig;
  private performanceCache: Map<number, OfferPerformance> = new Map();
  private rotationTimer?: NodeJS.Timeout;

  constructor(storage: DatabaseStorage) {
    this.storage = storage;
    this.config = {
      maxDisplayed: 3,
      rotationInterval: 300000, // 5 minutes
      ctrThreshold: 0.005, // 0.5%
      priorityWeights: {
        featured: 0.4,
        conversionRate: 0.3,
        commission: 0.2,
        freshness: 0.1
      }
    };
  }

  async initialize(): Promise<void> {
    console.log('🎯 Initializing Offer Manager...');
    
    // Load performance data
    await this.loadPerformanceData();
    
    // Start rotation timer
    this.startRotation();
    
    console.log('✅ Offer Manager initialized');
  }

  private async loadPerformanceData(): Promise<void> {
    try {
      const offers = await this.storage.getAiToolsOffers();
      
      for (const offer of offers) {
        this.performanceCache.set(offer.id, {
          offerId: offer.id,
          impressions: 0,
          clicks: 0,
          ctr: 0,
          conversions: 0,
          revenue: 0,
          lastShown: new Date()
        });
      }
    } catch (error) {
      console.error('Failed to load offer performance data:', error);
    }
  }

  async getPersonalizedOffers(archetype?: string, sessionId?: string): Promise<any[]> {
    try {
      const allOffers = await this.storage.getAiToolsOffers();
      
      // Filter and rank offers based on performance and personalization
      const rankedOffers = await this.rankOffers(allOffers, archetype);
      
      // Return top offers based on config
      const selectedOffers = rankedOffers.slice(0, this.config.maxDisplayed);
      
      // Track impressions
      for (const offer of selectedOffers) {
        await this.trackImpression(offer.id, sessionId);
      }
      
      return selectedOffers.map(offer => ({
        ...offer,
        cloakedUrl: this.generateCloakedUrl(offer.id, sessionId, archetype)
      }));
      
    } catch (error) {
      console.error('Failed to get personalized offers:', error);
      return [];
    }
  }

  private async rankOffers(offers: any[], archetype?: string): Promise<any[]> {
    const rankedOffers = offers.map(offer => {
      const performance = this.performanceCache.get(offer.id);
      const score = this.calculateOfferScore(offer, performance, archetype);
      return { ...offer, score };
    });

    // Sort by score (highest first)
    return rankedOffers.sort((a, b) => b.score - a.score);
  }

  private calculateOfferScore(offer: any, performance?: OfferPerformance, archetype?: string): number {
    let score = 0;

    // Featured weight
    score += offer.isFeatured ? this.config.priorityWeights.featured * 100 : 0;

    // Performance weight
    if (performance) {
      score += performance.ctr * this.config.priorityWeights.conversionRate * 1000;
    }

    // Commission weight
    score += (offer.commission || 0) * this.config.priorityWeights.commission;

    // Freshness weight (newer offers get higher score)
    const daysSinceCreated = (Date.now() - new Date(offer.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    const freshnessScore = Math.max(0, 30 - daysSinceCreated); // Max 30 days freshness
    score += freshnessScore * this.config.priorityWeights.freshness;

    // Archetype-specific bonuses
    if (archetype && offer.targetArchetypes?.includes(archetype)) {
      score += 20; // Bonus for targeted offers
    }

    return score;
  }

  private generateCloakedUrl(offerId: number, sessionId?: string, archetype?: string): string {
    const baseUrl = process.env.REPLIT_DOMAINS 
      ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
      : 'http://localhost:5000';
    
    const params = new URLSearchParams({
      offer: offerId.toString(),
      ...(sessionId && { session: sessionId }),
      ...(archetype && { archetype })
    });

    return `${baseUrl}/redirect?${params.toString()}`;
  }

  async trackClick(offerId: number, sessionId?: string, archetype?: string): Promise<void> {
    try {
      // Track in database
      await this.storage.trackOfferClick(offerId, sessionId || 'anonymous', archetype);
      
      // Update performance cache
      const performance = this.performanceCache.get(offerId);
      if (performance) {
        performance.clicks++;
        performance.ctr = performance.clicks / Math.max(performance.impressions, 1);
        this.performanceCache.set(offerId, performance);
      }

      // Check if offer performance is below threshold
      await this.checkOfferPerformance(offerId);
      
    } catch (error) {
      console.error('Failed to track offer click:', error);
    }
  }

  private async trackImpression(offerId: number, sessionId?: string): Promise<void> {
    try {
      const performance = this.performanceCache.get(offerId);
      if (performance) {
        performance.impressions++;
        performance.lastShown = new Date();
        performance.ctr = performance.clicks / Math.max(performance.impressions, 1);
        this.performanceCache.set(offerId, performance);
      }
    } catch (error) {
      console.error('Failed to track impression:', error);
    }
  }

  private async checkOfferPerformance(offerId: number): Promise<void> {
    const performance = this.performanceCache.get(offerId);
    
    if (performance && performance.impressions > 100) { // Only check after 100+ impressions
      if (performance.ctr < this.config.ctrThreshold) {
        console.log(`⚠️ Offer ${offerId} underperforming (CTR: ${performance.ctr})`);
        
        // Trigger self-healing: reduce priority or pause offer
        await this.handleUnderperformingOffer(offerId, performance);
      }
    }
  }

  private async handleUnderperformingOffer(offerId: number, performance: OfferPerformance): Promise<void> {
    try {
      // Option 1: Reduce offer priority
      // Option 2: Pause offer temporarily
      // Option 3: Remove from rotation
      
      console.log(`🔧 Self-healing: Pausing underperforming offer ${offerId}`);
      
      // For now, we'll just log the event
      // In a full implementation, this would update the offer status in the database
      
    } catch (error) {
      console.error('Failed to handle underperforming offer:', error);
    }
  }

  private startRotation(): void {
    this.rotationTimer = setInterval(async () => {
      await this.rotateOffers();
    }, this.config.rotationInterval);
  }

  private async rotateOffers(): Promise<void> {
    try {
      console.log('🔄 Rotating offers...');
      
      // Clear performance cache periodically to allow fresh opportunities
      const now = Date.now();
      for (const [offerId, performance] of this.performanceCache.entries()) {
        const hoursSinceLastShown = (now - performance.lastShown.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceLastShown > 24) {
          // Reset performance metrics for stale offers
          performance.impressions = 0;
          performance.clicks = 0;
          performance.ctr = 0;
          this.performanceCache.set(offerId, performance);
        }
      }
      
    } catch (error) {
      console.error('Failed to rotate offers:', error);
    }
  }

  async updateConfig(newConfig: Partial<OfferConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    
    // Restart rotation with new interval if changed
    if (newConfig.rotationInterval && this.rotationTimer) {
      clearInterval(this.rotationTimer);
      this.startRotation();
    }
  }

  getPerformanceMetrics(): Record<number, OfferPerformance> {
    return Object.fromEntries(this.performanceCache);
  }

  stop(): void {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
      this.rotationTimer = undefined;
    }
  }
}

export default OfferManager;