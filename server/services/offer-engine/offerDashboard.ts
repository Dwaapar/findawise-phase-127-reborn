/**
 * Offer Dashboard Service - Billion Dollar Empire Grade
 * Complete admin dashboard for offer management
 */

import { db } from "../../db";
import { offerFeed, offerSources, offerSyncHistory, offerAnalytics } from "@shared/schema";
import { eq, desc, count, sum, avg, and, gte, lte, sql } from "drizzle-orm";

export interface DashboardStats {
  totalOffers: number;
  activeOffers: number;
  totalSources: number;
  activeSources: number;
  totalClicks: number;
  totalRevenue: number;
  avgConversionRate: number;
  lastSync: Date | null;
}

export interface SourceStats {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
  totalOffers: number;
  lastSync: Date | null;
  errorCount: number;
  avgQualityScore: number;
  totalClicks: number;
  totalRevenue: number;
}

export interface OfferPerformance {
  id: number;
  title: string;
  merchant: string;
  category: string;
  clicks: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
  qualityScore: number;
}

export class OfferDashboardService {
  private static instance: OfferDashboardService;
  
  static getInstance(): OfferDashboardService {
    if (!OfferDashboardService.instance) {
      OfferDashboardService.instance = new OfferDashboardService();
    }
    return OfferDashboardService.instance;
  }

  /**
   * Get comprehensive dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Get offer counts
      const [totalOffersResult] = await db.select({ count: count() }).from(offerFeed);
      const [activeOffersResult] = await db.select({ count: count() })
        .from(offerFeed)
        .where(eq(offerFeed.isActive, true));

      // Get source counts
      const [totalSourcesResult] = await db.select({ count: count() }).from(offerSources);
      const [activeSourcesResult] = await db.select({ count: count() })
        .from(offerSources)
        .where(eq(offerSources.isActive, true));

      // Get analytics aggregates
      const [analyticsResult] = await db.select({
        totalClicks: sum(sql`CASE WHEN event_type = 'click' THEN 1 ELSE 0 END`),
        totalRevenue: sum(offerAnalytics.conversionValue),
        totalConversions: sum(sql`CASE WHEN event_type = 'conversion' THEN 1 ELSE 0 END`)
      }).from(offerAnalytics);

      // Get last sync time
      const [lastSyncResult] = await db.select({ lastSync: offerSources.lastSync })
        .from(offerSources)
        .where(eq(offerSources.isActive, true))
        .orderBy(desc(offerSources.lastSync))
        .limit(1);

      const totalClicks = Number(analyticsResult.totalClicks) || 0;
      const totalConversions = Number(analyticsResult.totalConversions) || 0;

      return {
        totalOffers: totalOffersResult.count,
        activeOffers: activeOffersResult.count,
        totalSources: totalSourcesResult.count,
        activeSources: activeSourcesResult.count,
        totalClicks,
        totalRevenue: Number(analyticsResult.totalRevenue) || 0,
        avgConversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
        lastSync: lastSyncResult?.lastSync || null
      };
    } catch (error) {
      console.error('Failed to get dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get detailed source statistics
   */
  async getSourceStats(): Promise<SourceStats[]> {
    try {
      const sources = await db.select({
        id: offerSources.id,
        name: offerSources.name,
        slug: offerSources.slug,
        isActive: offerSources.isActive,
        lastSync: offerSources.lastSync,
        errorCount: offerSources.errorCount
      }).from(offerSources);

      const sourceStats: SourceStats[] = [];

      for (const source of sources) {
        // Get offer count for this source
        const [offerCountResult] = await db.select({ count: count() })
          .from(offerFeed)
          .where(eq(offerFeed.sourceId, source.id));

        // Get average quality score
        const [qualityResult] = await db.select({ 
          avgQuality: avg(offerFeed.qualityScore) 
        })
        .from(offerFeed)
        .where(eq(offerFeed.sourceId, source.id));

        // Get analytics for this source's offers
        const [analyticsResult] = await db.select({
          totalClicks: sum(sql`CASE WHEN event_type = 'click' THEN 1 ELSE 0 END`),
          totalRevenue: sum(offerAnalytics.conversionValue)
        })
        .from(offerAnalytics)
        .innerJoin(offerFeed, eq(offerAnalytics.offerId, offerFeed.id))
        .where(eq(offerFeed.sourceId, source.id));

        sourceStats.push({
          id: source.id,
          name: source.name,
          slug: source.slug,
          isActive: source.isActive,
          totalOffers: offerCountResult.count,
          lastSync: source.lastSync,
          errorCount: source.errorCount,
          avgQualityScore: Number(qualityResult.avgQuality) || 0,
          totalClicks: Number(analyticsResult.totalClicks) || 0,
          totalRevenue: Number(analyticsResult.totalRevenue) || 0
        });
      }

      return sourceStats.sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0));
    } catch (error) {
      console.error('Failed to get source stats:', error);
      throw error;
    }
  }

  /**
   * Get top performing offers
   */
  async getTopPerformingOffers(limit: number = 20): Promise<OfferPerformance[]> {
    try {
      const topOffers = await db.select({
        id: offerFeed.id,
        title: offerFeed.title,
        merchant: offerFeed.merchant,
        category: offerFeed.category,
        qualityScore: offerFeed.qualityScore,
        clickCount: offerFeed.clickCount,
        conversionRate: offerFeed.conversionRate,
        revenueGenerated: offerFeed.revenueGenerated
      })
      .from(offerFeed)
      .where(eq(offerFeed.isActive, true))
      .orderBy(desc(offerFeed.revenueGenerated))
      .limit(limit);

      return topOffers.map(offer => ({
        id: offer.id,
        title: offer.title,
        merchant: offer.merchant,
        category: offer.category,
        clicks: offer.clickCount || 0,
        conversions: Math.round((offer.clickCount || 0) * (offer.conversionRate || 0) / 100),
        revenue: offer.revenueGenerated || 0,
        conversionRate: offer.conversionRate || 0,
        qualityScore: offer.qualityScore || 0
      }));
    } catch (error) {
      console.error('Failed to get top performing offers:', error);
      throw error;
    }
  }

  /**
   * Get recent sync history
   */
  async getRecentSyncHistory(limit: number = 50): Promise<any[]> {
    try {
      const history = await db.select({
        id: offerSyncHistory.id,
        sourceName: offerSources.name,
        batchId: offerSyncHistory.batchId,
        syncType: offerSyncHistory.syncType,
        status: offerSyncHistory.status,
        offersProcessed: offerSyncHistory.offersProcessed,
        offersAdded: offerSyncHistory.offersAdded,
        offersUpdated: offerSyncHistory.offersUpdated,
        startedAt: offerSyncHistory.startedAt,
        completedAt: offerSyncHistory.completedAt,
        errorMessage: offerSyncHistory.errorMessage
      })
      .from(offerSyncHistory)
      .leftJoin(offerSources, eq(offerSyncHistory.sourceId, offerSources.id))
      .orderBy(desc(offerSyncHistory.startedAt))
      .limit(limit);

      return history;
    } catch (error) {
      console.error('Failed to get sync history:', error);
      throw error;
    }
  }

  /**
   * Get offer categories with counts
   */
  async getOfferCategoriesWithCounts(): Promise<Array<{ category: string; count: number; activeCount: number }>> {
    try {
      const categories = await db.select({
        category: offerFeed.category,
        totalCount: count(),
        activeCount: sum(sql`CASE WHEN is_active = true THEN 1 ELSE 0 END`)
      })
      .from(offerFeed)
      .groupBy(offerFeed.category)
      .orderBy(desc(count()));

      return categories.map(cat => ({
        category: cat.category,
        count: cat.totalCount,
        activeCount: Number(cat.activeCount) || 0
      }));
    } catch (error) {
      console.error('Failed to get categories with counts:', error);
      throw error;
    }
  }

  /**
   * Get performance metrics over time
   */
  async getPerformanceMetrics(days: number = 30): Promise<{
    daily: Array<{
      date: string;
      clicks: number;
      conversions: number;
      revenue: number;
    }>;
    summary: {
      totalClicks: number;
      totalConversions: number;
      totalRevenue: number;
      avgConversionRate: number;
    };
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get daily metrics
      const dailyMetrics = await db.select({
        date: sql`DATE(timestamp)`.as('date'),
        clicks: sum(sql`CASE WHEN event_type = 'click' THEN 1 ELSE 0 END`),
        conversions: sum(sql`CASE WHEN event_type = 'conversion' THEN 1 ELSE 0 END`),
        revenue: sum(offerAnalytics.conversionValue)
      })
      .from(offerAnalytics)
      .where(gte(offerAnalytics.timestamp, startDate))
      .groupBy(sql`DATE(timestamp)`)
      .orderBy(sql`DATE(timestamp)`);

      // Get summary metrics
      const [summaryResult] = await db.select({
        totalClicks: sum(sql`CASE WHEN event_type = 'click' THEN 1 ELSE 0 END`),
        totalConversions: sum(sql`CASE WHEN event_type = 'conversion' THEN 1 ELSE 0 END`),
        totalRevenue: sum(offerAnalytics.conversionValue)
      })
      .from(offerAnalytics)
      .where(gte(offerAnalytics.timestamp, startDate));

      const totalClicks = Number(summaryResult.totalClicks) || 0;
      const totalConversions = Number(summaryResult.totalConversions) || 0;

      return {
        daily: dailyMetrics.map(metric => ({
          date: metric.date as string,
          clicks: Number(metric.clicks) || 0,
          conversions: Number(metric.conversions) || 0,
          revenue: Number(metric.revenue) || 0
        })),
        summary: {
          totalClicks,
          totalConversions,
          totalRevenue: Number(summaryResult.totalRevenue) || 0,
          avgConversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0
        }
      };
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      throw error;
    }
  }

  /**
   * Get health status of all systems
   */
  async getSystemHealth(): Promise<{
    overall: 'healthy' | 'degraded' | 'unhealthy';
    components: Array<{
      name: string;
      status: 'healthy' | 'degraded' | 'unhealthy';
      lastCheck: Date;
      details?: string;
    }>;
  }> {
    try {
      const components = [];

      // Check database connectivity
      try {
        await db.select({ count: count() }).from(offerFeed).limit(1);
        components.push({
          name: 'Database',
          status: 'healthy' as const,
          lastCheck: new Date()
        });
      } catch (error) {
        components.push({
          name: 'Database',
          status: 'unhealthy' as const,
          lastCheck: new Date(),
          details: 'Database connection failed'
        });
      }

      // Check sync status
      const [lastSyncResult] = await db.select({ lastSync: offerSources.lastSync })
        .from(offerSources)
        .where(eq(offerSources.isActive, true))
        .orderBy(desc(offerSources.lastSync))
        .limit(1);

      const lastSync = lastSyncResult?.lastSync;
      const hoursSinceLastSync = lastSync ? 
        (new Date().getTime() - lastSync.getTime()) / (1000 * 60 * 60) : Infinity;

      if (hoursSinceLastSync < 2) {
        components.push({
          name: 'Sync System',
          status: 'healthy' as const,
          lastCheck: new Date()
        });
      } else if (hoursSinceLastSync < 24) {
        components.push({
          name: 'Sync System',
          status: 'degraded' as const,
          lastCheck: new Date(),
          details: `Last sync was ${Math.round(hoursSinceLastSync)} hours ago`
        });
      } else {
        components.push({
          name: 'Sync System',
          status: 'unhealthy' as const,
          lastCheck: new Date(),
          details: 'No sync in over 24 hours'
        });
      }

      // Check active sources
      const [activeSourcesResult] = await db.select({ count: count() })
        .from(offerSources)
        .where(eq(offerSources.isActive, true));

      if (activeSourcesResult.count > 0) {
        components.push({
          name: 'Offer Sources',
          status: 'healthy' as const,
          lastCheck: new Date()
        });
      } else {
        components.push({
          name: 'Offer Sources',
          status: 'unhealthy' as const,
          lastCheck: new Date(),
          details: 'No active offer sources'
        });
      }

      // Determine overall health
      const unhealthyCount = components.filter(c => c.status === 'unhealthy').length;
      const degradedCount = components.filter(c => c.status === 'degraded').length;

      let overall: 'healthy' | 'degraded' | 'unhealthy';
      if (unhealthyCount > 0) {
        overall = 'unhealthy';
      } else if (degradedCount > 0) {
        overall = 'degraded';
      } else {
        overall = 'healthy';
      }

      return {
        overall,
        components
      };
    } catch (error) {
      console.error('Failed to get system health:', error);
      return {
        overall: 'unhealthy',
        components: [{
          name: 'System Check',
          status: 'unhealthy',
          lastCheck: new Date(),
          details: 'Health check failed'
        }]
      };
    }
  }
}

// Export singleton instance
export const offerDashboard = OfferDashboardService.getInstance();