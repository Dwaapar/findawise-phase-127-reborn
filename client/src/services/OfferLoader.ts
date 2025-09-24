/**
 * OfferLoader - Pulls dynamic affiliate deals via API or local config
 * Handles offer rotation, tracking, and contextual matching
 */

import { apiRequest } from '@/lib/queryClient';

export interface EducationOffer {
  id: number;
  slug: string;
  title: string;
  description: string;
  provider: string;
  category: string;
  offerType: 'course' | 'subscription' | 'tool' | 'book' | 'certification';
  originalPrice?: number;
  salePrice?: number;
  discountPercent?: number;
  affiliateUrl: string;
  trackingUrl?: string;
  commissionRate?: number;
  targetArchetype?: string;
  tags: string[];
  thumbnailUrl?: string;
  rating: number;
  reviewCount: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  isFeatured: boolean;
  clickCount: number;
  conversionCount: number;
  conversionRate: number;
}

export interface OfferDisplayRule {
  maxOffersPerPage: number;
  contextualMatching: boolean;
  archetypeTargeting: boolean;
  categoryFiltering: boolean;
  priceRangeFiltering: boolean;
  ratingThreshold: number;
}

export interface OfferRotationConfig {
  enabled: boolean;
  interval: number; // minutes
  strategy: 'random' | 'performance' | 'newest' | 'highest_commission';
  performanceMetric: 'ctr' | 'conversion_rate' | 'revenue';
}

export interface OfferContext {
  pageSlug?: string;
  contentCategory?: string;
  userArchetype?: string;
  quizResults?: Record<string, any>;
  searchTerms?: string[];
  currentTopic?: string;
  userLevel?: 'beginner' | 'intermediate' | 'advanced';
  previousInteractions?: string[];
}

class OfferLoaderService {
  private cache: Map<string, EducationOffer[]> = new Map();
  private rotationTimer: NodeJS.Timeout | null = null;
  private config: OfferRotationConfig;
  private displayRules: OfferDisplayRule;
  private isInitialized = false;

  constructor() {
    this.config = {
      enabled: true,
      interval: 60, // 1 hour
      strategy: 'performance',
      performanceMetric: 'conversion_rate',
    };

    this.displayRules = {
      maxOffersPerPage: 3,
      contextualMatching: true,
      archetypeTargeting: true,
      categoryFiltering: true,
      priceRangeFiltering: false,
      ratingThreshold: 3.5,
    };
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load initial offers
      await this.loadAllOffers();
      
      // Start rotation if enabled
      if (this.config.enabled) {
        this.startRotation();
      }
      
      this.isInitialized = true;
      console.log('OfferLoader initialized');
    } catch (error) {
      console.error('Failed to initialize OfferLoader:', error);
    }
  }

  // Main offer loading method
  public async getOffers(context: OfferContext = {}): Promise<EducationOffer[]> {
    const cacheKey = this.generateCacheKey(context);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cachedOffers = this.cache.get(cacheKey)!;
      if (this.isCacheValid(cacheKey)) {
        return this.shuffleOffers(cachedOffers.slice(0, this.displayRules.maxOffersPerPage));
      }
    }

    try {
      const offers = await this.fetchOffers(context);
      const filteredOffers = this.filterOffers(offers, context);
      const rankedOffers = this.rankOffers(filteredOffers, context);
      
      // Cache the results
      this.cache.set(cacheKey, rankedOffers);
      
      return rankedOffers.slice(0, this.displayRules.maxOffersPerPage);
    } catch (error) {
      console.error('Failed to get offers:', error);
      return this.getFallbackOffers(context);
    }
  }

  // Get featured offers
  public async getFeaturedOffers(limit = 6): Promise<EducationOffer[]> {
    try {
      const response = await apiRequest('/api/education/offers/featured', {
        method: 'GET',
        params: { limit: limit.toString() }
      });

      return response.success ? response.data : [];
    } catch (error) {
      console.error('Failed to get featured offers:', error);
      return [];
    }
  }

  // Get offers by category
  public async getOffersByCategory(category: string, limit = 10): Promise<EducationOffer[]> {
    try {
      const response = await apiRequest('/api/education/offers/category', {
        method: 'GET',
        params: { category, limit: limit.toString() }
      });

      return response.success ? response.data : [];
    } catch (error) {
      console.error(`Failed to get offers for category ${category}:`, error);
      return [];
    }
  }

  // Get personalized offers for user archetype
  public async getPersonalizedOffers(archetype: string, context: OfferContext = {}): Promise<EducationOffer[]> {
    const enhancedContext = {
      ...context,
      userArchetype: archetype,
    };

    return this.getOffers(enhancedContext);
  }

  // Get offers related to specific content
  public async getRelatedOffers(contentId: string, contentCategory: string): Promise<EducationOffer[]> {
    const context: OfferContext = {
      contentCategory,
      pageSlug: `content-${contentId}`,
    };

    return this.getOffers(context);
  }

  // Get offers based on quiz results
  public async getQuizRecommendedOffers(quizResults: Record<string, any>): Promise<EducationOffer[]> {
    const context: OfferContext = {
      quizResults,
      userArchetype: quizResults.archetype,
      currentTopic: quizResults.category,
      userLevel: this.determineUserLevel(quizResults),
    };

    return this.getOffers(context);
  }

  // Track offer interactions
  public async trackOfferClick(offerId: number, context: OfferContext = {}): Promise<void> {
    try {
      await apiRequest('/api/education/offers/track-click', {
        method: 'POST',
        body: {
          offerId,
          context,
          timestamp: new Date().toISOString(),
        }
      });

      // Update local cache if needed
      this.updateOfferStats(offerId, 'click');
    } catch (error) {
      console.error('Failed to track offer click:', error);
    }
  }

  public async trackOfferConversion(offerId: number, value?: number): Promise<void> {
    try {
      await apiRequest('/api/education/offers/track-conversion', {
        method: 'POST',
        body: {
          offerId,
          value,
          timestamp: new Date().toISOString(),
        }
      });

      this.updateOfferStats(offerId, 'conversion');
    } catch (error) {
      console.error('Failed to track offer conversion:', error);
    }
  }

  // Generate cloaked affiliate links
  public generateCloakedLink(offer: EducationOffer, context: OfferContext = {}): string {
    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      offer: offer.slug,
      ref: context.pageSlug || 'direct',
      utm_source: 'neuron-education',
      utm_medium: 'affiliate',
      utm_campaign: context.contentCategory || 'general',
    });

    return `${baseUrl}/redirect?${params.toString()}`;
  }

  // Private methods
  private async fetchOffers(context: OfferContext): Promise<EducationOffer[]> {
    const response = await apiRequest('/api/education/offers', {
      method: 'POST',
      body: {
        context,
        displayRules: this.displayRules,
        rotationConfig: this.config,
      }
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch offers');
    }

    return response.data;
  }

  private filterOffers(offers: EducationOffer[], context: OfferContext): EducationOffer[] {
    let filtered = offers.filter(offer => {
      // Basic filters
      if (!offer.isActive) return false;
      if (offer.rating < this.displayRules.ratingThreshold) return false;
      
      // Date range filter
      if (offer.endDate && new Date(offer.endDate) < new Date()) return false;
      
      return true;
    });

    // Category filtering
    if (this.displayRules.categoryFiltering && context.contentCategory) {
      filtered = filtered.filter(offer => 
        offer.category === context.contentCategory || 
        offer.tags.includes(context.contentCategory)
      );
    }

    // Archetype targeting
    if (this.displayRules.archetypeTargeting && context.userArchetype) {
      const archetypeOffers = filtered.filter(offer => 
        offer.targetArchetype === context.userArchetype
      );
      
      if (archetypeOffers.length > 0) {
        filtered = archetypeOffers;
      }
    }

    // Contextual matching
    if (this.displayRules.contextualMatching && context.currentTopic) {
      const contextualOffers = filtered.filter(offer =>
        offer.title.toLowerCase().includes(context.currentTopic!.toLowerCase()) ||
        offer.tags.some(tag => tag.toLowerCase().includes(context.currentTopic!.toLowerCase()))
      );
      
      if (contextualOffers.length > 0) {
        filtered = contextualOffers;
      }
    }

    return filtered;
  }

  private rankOffers(offers: EducationOffer[], context: OfferContext): EducationOffer[] {
    return offers.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      // Performance-based ranking
      switch (this.config.strategy) {
        case 'performance':
          switch (this.config.performanceMetric) {
            case 'ctr':
              scoreA = a.clickCount / Math.max(a.reviewCount, 1);
              scoreB = b.clickCount / Math.max(b.reviewCount, 1);
              break;
            case 'conversion_rate':
              scoreA = a.conversionRate;
              scoreB = b.conversionRate;
              break;
            case 'revenue':
              scoreA = (a.commissionRate || 0) * (a.salePrice || a.originalPrice || 0);
              scoreB = (b.commissionRate || 0) * (b.salePrice || b.originalPrice || 0);
              break;
          }
          break;
          
        case 'newest':
          scoreA = new Date(a.startDate || 0).getTime();
          scoreB = new Date(b.startDate || 0).getTime();
          break;
          
        case 'highest_commission':
          scoreA = a.commissionRate || 0;
          scoreB = b.commissionRate || 0;
          break;
          
        case 'random':
          return Math.random() - 0.5;
      }

      // Boost featured offers
      if (a.isFeatured) scoreA += 1000;
      if (b.isFeatured) scoreB += 1000;

      // Boost highly rated offers
      scoreA += a.rating * 100;
      scoreB += b.rating * 100;

      return scoreB - scoreA;
    });
  }

  private shuffleOffers(offers: EducationOffer[]): EducationOffer[] {
    const shuffled = [...offers];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private generateCacheKey(context: OfferContext): string {
    const key = {
      category: context.contentCategory || 'all',
      archetype: context.userArchetype || 'general',
      topic: context.currentTopic || 'general',
      level: context.userLevel || 'all',
    };
    
    return JSON.stringify(key);
  }

  private isCacheValid(cacheKey: string): boolean {
    // Simple time-based cache validation
    // In practice, this would be more sophisticated
    return this.cache.has(cacheKey);
  }

  private async loadAllOffers(): Promise<void> {
    try {
      const response = await apiRequest('/api/education/offers/all');
      if (response.success) {
        // Pre-populate cache with common contexts
        const offers = response.data;
        
        // Cache by category
        const categories = [...new Set(offers.map((o: EducationOffer) => o.category))];
        categories.forEach(category => {
          const categoryOffers = offers.filter((o: EducationOffer) => o.category === category);
          this.cache.set(JSON.stringify({ category, archetype: 'general', topic: 'general', level: 'all' }), categoryOffers);
        });
      }
    } catch (error) {
      console.error('Failed to load all offers:', error);
    }
  }

  private getFallbackOffers(context: OfferContext): EducationOffer[] {
    // Return cached offers or empty array as fallback
    const fallbackKey = JSON.stringify({ category: 'all', archetype: 'general', topic: 'general', level: 'all' });
    return this.cache.get(fallbackKey)?.slice(0, this.displayRules.maxOffersPerPage) || [];
  }

  private determineUserLevel(quizResults: Record<string, any>): 'beginner' | 'intermediate' | 'advanced' {
    const percentage = quizResults.percentage || 0;
    if (percentage < 50) return 'beginner';
    if (percentage < 80) return 'intermediate';
    return 'advanced';
  }

  private updateOfferStats(offerId: number, action: 'click' | 'conversion'): void {
    // Update cached offer stats
    this.cache.forEach((offers, key) => {
      const offerIndex = offers.findIndex(o => o.id === offerId);
      if (offerIndex > -1) {
        if (action === 'click') {
          offers[offerIndex].clickCount++;
        } else if (action === 'conversion') {
          offers[offerIndex].conversionCount++;
          offers[offerIndex].conversionRate = offers[offerIndex].conversionCount / Math.max(offers[offerIndex].clickCount, 1);
        }
      }
    });
  }

  private startRotation(): void {
    if (this.rotationTimer) return;

    this.rotationTimer = setInterval(() => {
      // Clear cache to force fresh data
      this.cache.clear();
      this.loadAllOffers();
    }, this.config.interval * 60 * 1000);
  }

  private stopRotation(): void {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
      this.rotationTimer = null;
    }
  }

  // Configuration methods
  public updateConfig(newConfig: Partial<OfferRotationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.enabled !== undefined) {
      if (newConfig.enabled) {
        this.startRotation();
      } else {
        this.stopRotation();
      }
    }
    
    if (newConfig.interval && this.rotationTimer) {
      this.stopRotation();
      this.startRotation();
    }
  }

  public updateDisplayRules(newRules: Partial<OfferDisplayRule>): void {
    this.displayRules = { ...this.displayRules, ...newRules };
    // Clear cache to apply new rules
    this.cache.clear();
  }

  public clearCache(): void {
    this.cache.clear();
  }

  public getConfig(): OfferRotationConfig {
    return { ...this.config };
  }

  public getDisplayRules(): OfferDisplayRule {
    return { ...this.displayRules };
  }

  public destroy(): void {
    this.stopRotation();
    this.cache.clear();
    this.isInitialized = false;
  }
}

// Singleton instance
export const offerLoader = new OfferLoaderService();

// React hook
export const useOffers = () => {
  return {
    getOffers: offerLoader.getOffers.bind(offerLoader),
    getFeaturedOffers: offerLoader.getFeaturedOffers.bind(offerLoader),
    getOffersByCategory: offerLoader.getOffersByCategory.bind(offerLoader),
    getPersonalizedOffers: offerLoader.getPersonalizedOffers.bind(offerLoader),
    getRelatedOffers: offerLoader.getRelatedOffers.bind(offerLoader),
    getQuizRecommendedOffers: offerLoader.getQuizRecommendedOffers.bind(offerLoader),
    trackOfferClick: offerLoader.trackOfferClick.bind(offerLoader),
    trackOfferConversion: offerLoader.trackOfferConversion.bind(offerLoader),
    generateCloakedLink: offerLoader.generateCloakedLink.bind(offerLoader),
    updateConfig: offerLoader.updateConfig.bind(offerLoader),
    updateDisplayRules: offerLoader.updateDisplayRules.bind(offerLoader),
    clearCache: offerLoader.clearCache.bind(offerLoader),
  };
};

export default offerLoader;