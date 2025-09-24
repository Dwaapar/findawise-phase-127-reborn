import { storage } from '../../storage';
import fs from 'fs/promises';
import path from 'path';

/**
 * Analytics Service - Fetches and processes analytics data for orchestration
 * 
 * This service pulls data from various sources:
 * - Database (primary source)
 * - Local files (fallback/cache)
 * - External APIs (future integration)
 */

export interface AnalyticsData {
  pages: PageAnalytics[];
  offers: OfferAnalytics[];
  emotions: EmotionAnalytics[];
  ctas: CTAAnalytics[];
  modules: ModuleAnalytics[];
  summary: AnalyticsSummary;
}

export interface PageAnalytics {
  slug: string;
  title: string;
  niche: string;
  emotion: string;
  config: any;
  metrics: {
    impressions: number;
    clicks: number;
    ctr: number;
    engagement: number;
    conversion: number;
    bounceRate: number;
    averageTimeOnPage: number;
    scrollDepth: number;
  };
  trend: 'up' | 'down' | 'stable';
  lastUpdated: Date;
}

export interface OfferAnalytics {
  id: number;
  slug: string;
  title: string;
  category: string;
  emotion: string;
  config: any;
  metrics: {
    impressions: number;
    clicks: number;
    ctr: number;
    conversions: number;
    conversionRate: number;
    revenue: number;
  };
  trend: 'up' | 'down' | 'stable';
  lastUpdated: Date;
}

export interface EmotionAnalytics {
  name: string;
  theme: any;
  pages: string[];
  metrics: {
    totalImpressions: number;
    totalClicks: number;
    averageCTR: number;
    averageEngagement: number;
    averageConversion: number;
  };
  trend: 'up' | 'down' | 'stable';
}

export interface CTAAnalytics {
  text: string;
  pages: string[];
  config: any;
  metrics: {
    impressions: number;
    clicks: number;
    ctr: number;
    conversions: number;
    conversionRate: number;
  };
  trend: 'up' | 'down' | 'stable';
}

export interface ModuleAnalytics {
  type: string;
  pages: string[];
  config: any;
  metrics: {
    impressions: number;
    interactions: number;
    completions: number;
    interactionRate: number;
    completionRate: number;
  };
  trend: 'up' | 'down' | 'stable';
}

export interface AnalyticsSummary {
  totalImpressions: number;
  totalClicks: number;
  averageCTR: number;
  averageEngagement: number;
  averageConversion: number;
  topPerformingPage: string;
  topPerformingOffer: string;
  topPerformingEmotion: string;
  dataQuality: number;
}

class AnalyticsService {
  private readonly analyticsDir = path.join(process.cwd(), 'analytics');
  private readonly cacheDir = path.join(this.analyticsDir, 'cache');

  /**
   * Fetch comprehensive analytics data
   */
  async fetchAnalytics(): Promise<AnalyticsData> {
    console.log('📊 Fetching analytics data from all sources...');
    
    const [pages, offers, emotions, ctas, modules] = await Promise.all([
      this.fetchPageAnalytics(),
      this.fetchOfferAnalytics(),
      this.fetchEmotionAnalytics(),
      this.fetchCTAAnalytics(),
      this.fetchModuleAnalytics()
    ]);

    const summary = this.calculateSummary(pages, offers, emotions, ctas, modules);
    
    // Cache the results
    await this.cacheAnalytics({ pages, offers, emotions, ctas, modules, summary });
    
    return {
      pages,
      offers,
      emotions,
      ctas,
      modules,
      summary
    };
  }

  /**
   * Fetch page analytics
   */
  private async fetchPageAnalytics(): Promise<PageAnalytics[]> {
    const pageAnalytics: PageAnalytics[] = [];
    
    // Get all pages from config
    const pagesConfigPath = path.join(process.cwd(), 'client', 'src', 'config', 'pages.json');
    const pagesConfig = JSON.parse(await fs.readFile(pagesConfigPath, 'utf-8'));
    
    for (const page of pagesConfig.pages) {
      try {
        // Get behavior events for this page
        const behaviorEvents = await storage.getBehaviorEventsByPage(page.slug);
        const sessions = await storage.getSessionsByPage(page.slug);
        const affiliateClicks = await storage.getAffiliateClicksByPage(page.slug);
        
        const metrics = await this.calculatePageMetrics(page.slug, behaviorEvents, sessions, affiliateClicks);
        const trend = await this.calculatePageTrend(page.slug);
        
        pageAnalytics.push({
          slug: page.slug,
          title: page.title,
          niche: page.niche,
          emotion: page.emotion,
          config: page,
          metrics,
          trend,
          lastUpdated: new Date()
        });
      } catch (error) {
        console.warn(`Failed to fetch analytics for page ${page.slug}:`, error);
      }
    }
    
    return pageAnalytics;
  }

  /**
   * Fetch offer analytics
   */
  private async fetchOfferAnalytics(): Promise<OfferAnalytics[]> {
    const offerAnalytics: OfferAnalytics[] = [];
    
    // Get all offers from database
    const offers = await storage.getAllAffiliateOffers();
    
    for (const offer of offers) {
      try {
        const clicks = await storage.getAffiliateClicksByOffer(offer.id);
        const impressions = await storage.getOfferImpressions(offer.id);
        
        const metrics = {
          impressions: impressions.length,
          clicks: clicks.length,
          ctr: impressions.length > 0 ? clicks.length / impressions.length : 0,
          conversions: clicks.filter(c => c.conversionTracked).length,
          conversionRate: clicks.length > 0 ? clicks.filter(c => c.conversionTracked).length / clicks.length : 0,
          revenue: 0 // Would come from conversion tracking
        };
        
        const trend = await this.calculateOfferTrend(offer.id);
        
        offerAnalytics.push({
          id: offer.id,
          slug: offer.slug,
          title: offer.title,
          category: offer.category || 'unknown',
          emotion: offer.emotion || 'trust',
          config: offer,
          metrics,
          trend,
          lastUpdated: new Date()
        });
      } catch (error) {
        console.warn(`Failed to fetch analytics for offer ${offer.slug}:`, error);
      }
    }
    
    return offerAnalytics;
  }

  /**
   * Fetch emotion analytics
   */
  private async fetchEmotionAnalytics(): Promise<EmotionAnalytics[]> {
    const emotionAnalytics: EmotionAnalytics[] = [];
    
    // Get emotion themes from config
    const emotionMapPath = path.join(process.cwd(), 'client', 'src', 'config', 'emotionMap.ts');
    const emotionMapContent = await fs.readFile(emotionMapPath, 'utf-8');
    
    const emotions = ['trust', 'excitement', 'relief', 'confidence', 'calm'];
    
    for (const emotion of emotions) {
      try {
        const pages = await storage.getPagesByEmotion(emotion);
        const theme = await this.extractEmotionTheme(emotionMapContent, emotion);
        
        let totalImpressions = 0;
        let totalClicks = 0;
        let totalEngagement = 0;
        let totalConversions = 0;
        
        for (const page of pages) {
          const behaviorEvents = await storage.getBehaviorEventsByPage(page.slug);
          const affiliateClicks = await storage.getAffiliateClicksByPage(page.slug);
          
          const pageImpressions = behaviorEvents.filter(e => e.eventType === 'page_view').length;
          const pageEngagement = behaviorEvents.filter(e => e.eventType === 'engagement').length;
          const pageConversions = behaviorEvents.filter(e => e.eventType === 'conversion').length;
          
          totalImpressions += pageImpressions;
          totalClicks += affiliateClicks.length;
          totalEngagement += pageEngagement;
          totalConversions += pageConversions;
        }
        
        const metrics = {
          totalImpressions,
          totalClicks,
          averageCTR: totalImpressions > 0 ? totalClicks / totalImpressions : 0,
          averageEngagement: totalImpressions > 0 ? totalEngagement / totalImpressions : 0,
          averageConversion: totalImpressions > 0 ? totalConversions / totalImpressions : 0
        };
        
        const trend = await this.calculateEmotionTrend(emotion);
        
        emotionAnalytics.push({
          name: emotion,
          theme,
          pages: pages.map(p => p.slug),
          metrics,
          trend
        });
      } catch (error) {
        console.warn(`Failed to fetch analytics for emotion ${emotion}:`, error);
      }
    }
    
    return emotionAnalytics;
  }

  /**
   * Fetch CTA analytics
   */
  private async fetchCTAAnalytics(): Promise<CTAAnalytics[]> {
    const ctaAnalytics: CTAAnalytics[] = [];
    const ctaGroups = new Map<string, any>();
    
    // Get all pages and their CTAs
    const pagesConfigPath = path.join(process.cwd(), 'client', 'src', 'config', 'pages.json');
    const pagesConfig = JSON.parse(await fs.readFile(pagesConfigPath, 'utf-8'));
    
    for (const page of pagesConfig.pages) {
      if (page.cta && page.cta.text) {
        const ctaText = page.cta.text;
        
        if (!ctaGroups.has(ctaText)) {
          ctaGroups.set(ctaText, {
            text: ctaText,
            pages: [],
            config: page.cta,
            impressions: 0,
            clicks: 0,
            conversions: 0
          });
        }
        
        const ctaGroup = ctaGroups.get(ctaText);
        ctaGroup.pages.push(page.slug);
        
        // Get CTA-specific events
        const behaviorEvents = await storage.getBehaviorEventsByCTA(ctaText);
        const ctaClicks = behaviorEvents.filter(e => e.eventType === 'cta_click');
        const ctaImpressions = behaviorEvents.filter(e => e.eventType === 'cta_impression');
        const ctaConversions = behaviorEvents.filter(e => e.eventType === 'cta_conversion');
        
        ctaGroup.impressions += ctaImpressions.length;
        ctaGroup.clicks += ctaClicks.length;
        ctaGroup.conversions += ctaConversions.length;
      }
    }
    
    // Convert to analytics format
    for (const [ctaText, ctaGroup] of ctaGroups) {
      const metrics = {
        impressions: ctaGroup.impressions,
        clicks: ctaGroup.clicks,
        ctr: ctaGroup.impressions > 0 ? ctaGroup.clicks / ctaGroup.impressions : 0,
        conversions: ctaGroup.conversions,
        conversionRate: ctaGroup.clicks > 0 ? ctaGroup.conversions / ctaGroup.clicks : 0
      };
      
      const trend = await this.calculateCTATrend(ctaText);
      
      ctaAnalytics.push({
        text: ctaText,
        pages: ctaGroup.pages,
        config: ctaGroup.config,
        metrics,
        trend
      });
    }
    
    return ctaAnalytics;
  }

  /**
   * Fetch module analytics
   */
  private async fetchModuleAnalytics(): Promise<ModuleAnalytics[]> {
    const moduleAnalytics: ModuleAnalytics[] = [];
    const moduleTypes = ['quiz', 'calculator', 'comparison', 'timer'];
    
    for (const moduleType of moduleTypes) {
      try {
        const pages = await storage.getPagesByModule(moduleType);
        const behaviorEvents = await storage.getBehaviorEventsByModule(moduleType);
        
        const impressions = behaviorEvents.filter(e => e.eventType === 'module_impression').length;
        const interactions = behaviorEvents.filter(e => e.eventType === 'module_interaction').length;
        const completions = behaviorEvents.filter(e => e.eventType === 'module_completion').length;
        
        const metrics = {
          impressions,
          interactions,
          completions,
          interactionRate: impressions > 0 ? interactions / impressions : 0,
          completionRate: interactions > 0 ? completions / interactions : 0
        };
        
        const trend = await this.calculateModuleTrend(moduleType);
        
        moduleAnalytics.push({
          type: moduleType,
          pages: pages.map(p => p.slug),
          config: {}, // Module-specific config would go here
          metrics,
          trend
        });
      } catch (error) {
        console.warn(`Failed to fetch analytics for module ${moduleType}:`, error);
      }
    }
    
    return moduleAnalytics;
  }

  /**
   * Calculate page metrics
   */
  private async calculatePageMetrics(pageSlug: string, behaviorEvents: any[], sessions: any[], affiliateClicks: any[]): Promise<any> {
    const impressions = behaviorEvents.filter(e => e.eventType === 'page_view').length;
    const clicks = affiliateClicks.length;
    const engagement = behaviorEvents.filter(e => e.eventType === 'engagement').length;
    const conversions = behaviorEvents.filter(e => e.eventType === 'conversion').length;
    const bounces = behaviorEvents.filter(e => e.eventType === 'bounce').length;
    
    const totalTimeOnPage = sessions.reduce((sum, s) => sum + (s.totalTimeOnSite || 0), 0);
    const averageTimeOnPage = sessions.length > 0 ? totalTimeOnPage / sessions.length : 0;
    
    const scrollEvents = behaviorEvents.filter(e => e.eventType === 'scroll' && e.eventData?.depth);
    const averageScrollDepth = scrollEvents.length > 0 ? 
      scrollEvents.reduce((sum, e) => sum + (e.eventData.depth || 0), 0) / scrollEvents.length : 0;
    
    return {
      impressions,
      clicks,
      ctr: impressions > 0 ? clicks / impressions : 0,
      engagement: impressions > 0 ? engagement / impressions : 0,
      conversion: impressions > 0 ? conversions / impressions : 0,
      bounceRate: sessions.length > 0 ? bounces / sessions.length : 0,
      averageTimeOnPage,
      scrollDepth: averageScrollDepth
    };
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(pages: PageAnalytics[], offers: OfferAnalytics[], emotions: EmotionAnalytics[], ctas: CTAAnalytics[], modules: ModuleAnalytics[]): AnalyticsSummary {
    const totalImpressions = pages.reduce((sum, p) => sum + p.metrics.impressions, 0);
    const totalClicks = pages.reduce((sum, p) => sum + p.metrics.clicks, 0);
    const averageCTR = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
    const averageEngagement = pages.reduce((sum, p) => sum + p.metrics.engagement, 0) / pages.length;
    const averageConversion = pages.reduce((sum, p) => sum + p.metrics.conversion, 0) / pages.length;
    
    const topPerformingPage = pages.sort((a, b) => b.metrics.ctr - a.metrics.ctr)[0]?.slug || '';
    const topPerformingOffer = offers.sort((a, b) => b.metrics.ctr - a.metrics.ctr)[0]?.slug || '';
    const topPerformingEmotion = emotions.sort((a, b) => b.metrics.averageCTR - a.metrics.averageCTR)[0]?.name || '';
    
    const dataQuality = this.calculateDataQuality(pages, offers, emotions, ctas, modules);
    
    return {
      totalImpressions,
      totalClicks,
      averageCTR,
      averageEngagement,
      averageConversion,
      topPerformingPage,
      topPerformingOffer,
      topPerformingEmotion,
      dataQuality
    };
  }

  /**
   * Calculate data quality score
   */
  private calculateDataQuality(pages: PageAnalytics[], offers: OfferAnalytics[], emotions: EmotionAnalytics[], ctas: CTAAnalytics[], modules: ModuleAnalytics[]): number {
    let quality = 0;
    
    // Pages with sufficient data
    const pagesWithData = pages.filter(p => p.metrics.impressions > 50).length;
    quality += (pagesWithData / pages.length) * 0.3;
    
    // Offers with sufficient data
    const offersWithData = offers.filter(o => o.metrics.impressions > 20).length;
    quality += (offersWithData / Math.max(offers.length, 1)) * 0.2;
    
    // Emotions with sufficient data
    const emotionsWithData = emotions.filter(e => e.metrics.totalImpressions > 100).length;
    quality += (emotionsWithData / emotions.length) * 0.2;
    
    // CTAs with sufficient data
    const ctasWithData = ctas.filter(c => c.metrics.impressions > 30).length;
    quality += (ctasWithData / Math.max(ctas.length, 1)) * 0.2;
    
    // Modules with sufficient data
    const modulesWithData = modules.filter(m => m.metrics.impressions > 15).length;
    quality += (modulesWithData / modules.length) * 0.1;
    
    return quality;
  }

  /**
   * Calculate trend for various elements
   */
  private async calculatePageTrend(pageSlug: string): Promise<'up' | 'down' | 'stable'> {
    const historicalData = await storage.getHistoricalMetrics(pageSlug, 'page', 7);
    return this.calculateTrendFromData(historicalData);
  }

  private async calculateOfferTrend(offerId: number): Promise<'up' | 'down' | 'stable'> {
    const historicalData = await storage.getHistoricalMetrics(offerId.toString(), 'offer', 7);
    return this.calculateTrendFromData(historicalData);
  }

  private async calculateEmotionTrend(emotion: string): Promise<'up' | 'down' | 'stable'> {
    const historicalData = await storage.getHistoricalMetrics(emotion, 'emotion', 7);
    return this.calculateTrendFromData(historicalData);
  }

  private async calculateCTATrend(ctaText: string): Promise<'up' | 'down' | 'stable'> {
    const historicalData = await storage.getHistoricalMetrics(ctaText, 'cta', 7);
    return this.calculateTrendFromData(historicalData);
  }

  private async calculateModuleTrend(moduleType: string): Promise<'up' | 'down' | 'stable'> {
    const historicalData = await storage.getHistoricalMetrics(moduleType, 'module', 7);
    return this.calculateTrendFromData(historicalData);
  }

  private calculateTrendFromData(historicalData: any[]): 'up' | 'down' | 'stable' {
    if (historicalData.length < 2) return 'stable';
    
    const recent = historicalData.slice(-3);
    const previous = historicalData.slice(-6, -3);
    
    if (recent.length === 0 || previous.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, d) => sum + d.ctr, 0) / recent.length;
    const previousAvg = previous.reduce((sum, d) => sum + d.ctr, 0) / previous.length;
    
    const changeThreshold = 0.05; // 5% change
    
    if (recentAvg > previousAvg * (1 + changeThreshold)) return 'up';
    if (recentAvg < previousAvg * (1 - changeThreshold)) return 'down';
    return 'stable';
  }

  /**
   * Extract emotion theme from emotion map file
   */
  private async extractEmotionTheme(emotionMapContent: string, emotion: string): Promise<any> {
    const emotionMatch = emotionMapContent.match(new RegExp(`${emotion}:\\s*\\{([^}]+)\\}`, 's'));
    if (!emotionMatch) return {};
    
    const theme: any = {};
    const propertyMatches = emotionMatch[1].match(/(\w+):\s*"([^"]+)"/g);
    
    if (propertyMatches) {
      for (const match of propertyMatches) {
        const [, key, value] = match.match(/(\w+):\s*"([^"]+)"/) || [];
        if (key && value) {
          theme[key] = value;
        }
      }
    }
    
    return theme;
  }

  /**
   * Cache analytics results
   */
  private async cacheAnalytics(analyticsData: AnalyticsData): Promise<void> {
    await fs.mkdir(this.cacheDir, { recursive: true });
    
    const cacheFile = path.join(this.cacheDir, `analytics-${Date.now()}.json`);
    await fs.writeFile(cacheFile, JSON.stringify(analyticsData, null, 2));
    
    // Keep only last 10 cache files
    const cacheFiles = await fs.readdir(this.cacheDir);
    const sortedFiles = cacheFiles
      .filter(f => f.startsWith('analytics-'))
      .sort()
      .slice(0, -10);
    
    for (const file of sortedFiles) {
      await fs.unlink(path.join(this.cacheDir, file));
    }
  }

  /**
   * Find similar pages for optimization
   */
  async findSimilarPages(pageSlug: string): Promise<PageAnalytics[]> {
    const allPages = await this.fetchPageAnalytics();
    const targetPage = allPages.find(p => p.slug === pageSlug);
    
    if (!targetPage) return [];
    
    // Find pages with similar characteristics
    const similarPages = allPages.filter(p => 
      p.slug !== pageSlug &&
      (p.niche === targetPage.niche || p.emotion === targetPage.emotion)
    );
    
    // Sort by performance
    return similarPages.sort((a, b) => b.metrics.ctr - a.metrics.ctr);
  }

  /**
   * Get cached analytics if available
   */
  async getCachedAnalytics(): Promise<AnalyticsData | null> {
    try {
      const cacheFiles = await fs.readdir(this.cacheDir);
      const latestFile = cacheFiles
        .filter(f => f.startsWith('analytics-'))
        .sort()
        .pop();
      
      if (!latestFile) return null;
      
      const cacheFile = path.join(this.cacheDir, latestFile);
      const content = await fs.readFile(cacheFile, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }
}

export const analyticsService = new AnalyticsService();