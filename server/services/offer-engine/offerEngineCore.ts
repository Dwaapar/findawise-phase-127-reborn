/**
 * Offer Engine Core - Billion Dollar Empire Grade
 * Central offer management and processing engine
 */

import { db } from "../../db";
import { offerFeed, offerSources, offerAnalytics, offerSyncHistory } from "@shared/schema";
import { eq, desc, asc, and, or, like, gte, lte, count, sql } from "drizzle-orm";
import { InsertOfferFeed, SelectOfferFeed, SelectOfferSource } from "@shared/schema";

export interface OfferFilters {
  category?: string;
  merchant?: string;
  region?: string;
  emotion?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ClickTrackingData {
  sessionId?: string;
  userId?: string;
  neuronId?: string;
  pageSlug?: string;
  deviceType?: string;
  geoLocation?: string;
  referrer?: string;
}

export interface PerformanceMetrics {
  startDate?: Date;
  endDate?: Date;
  groupBy?: string;
  category?: string;
  merchant?: string;
}

export class OfferEngineCore {
  private static instance: OfferEngineCore;
  
  static getInstance(): OfferEngineCore {
    if (!OfferEngineCore.instance) {
      OfferEngineCore.instance = new OfferEngineCore();
    }
    return OfferEngineCore.instance;
  }

  /**
   * Get offers with filtering and pagination
   */
  async getOffers(filters: OfferFilters = {}): Promise<SelectOfferFeed[]> {
    try {
      let query = db.select().from(offerFeed);

      // Apply filters
      const conditions = [];
      
      if (filters.category) {
        conditions.push(eq(offerFeed.category, filters.category));
      }
      
      if (filters.merchant) {
        conditions.push(eq(offerFeed.merchant, filters.merchant));
      }
      
      if (filters.region && filters.region !== 'global') {
        conditions.push(eq(offerFeed.region, filters.region));
      }
      
      if (filters.emotion) {
        conditions.push(eq(offerFeed.emotion, filters.emotion));
      }
      
      if (filters.isActive !== undefined) {
        conditions.push(eq(offerFeed.isActive, filters.isActive));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Apply sorting
      const sortBy = filters.sortBy || 'priority';
      const sortOrder = filters.sortOrder || 'desc';
      
      if (sortOrder === 'desc') {
        query = query.orderBy(desc((offerFeed as any)[sortBy] || offerFeed.priority));
      } else {
        query = query.orderBy(asc((offerFeed as any)[sortBy] || offerFeed.priority));
      }

      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      
      if (filters.offset) {
        query = query.offset(filters.offset);
      }

      return await query;
    } catch (error) {
      console.error('Failed to get offers:', error);
      return [];
    }
  }

  /**
   * Get total count of offers matching filters
   */
  async getOffersCount(filters: OfferFilters = {}): Promise<number> {
    try {
      let query = db.select({ count: count() }).from(offerFeed);

      // Apply same filters as getOffers
      const conditions = [];
      
      if (filters.category) {
        conditions.push(eq(offerFeed.category, filters.category));
      }
      
      if (filters.merchant) {
        conditions.push(eq(offerFeed.merchant, filters.merchant));
      }
      
      if (filters.region && filters.region !== 'global') {
        conditions.push(eq(offerFeed.region, filters.region));
      }
      
      if (filters.emotion) {
        conditions.push(eq(offerFeed.emotion, filters.emotion));
      }
      
      if (filters.isActive !== undefined) {
        conditions.push(eq(offerFeed.isActive, filters.isActive));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const [result] = await query;
      return result.count;
    } catch (error) {
      console.error('Failed to get offers count:', error);
      return 0;
    }
  }

  /**
   * Get single offer by ID
   */
  async getOfferById(id: number): Promise<SelectOfferFeed | null> {
    try {
      const [offer] = await db.select()
        .from(offerFeed)
        .where(eq(offerFeed.id, id));
      
      return offer || null;
    } catch (error) {
      console.error('Failed to get offer by ID:', error);
      return null;
    }
  }

  /**
   * Search offers by title or description
   */
  async searchOffers(query: string, limit: number = 20): Promise<SelectOfferFeed[]> {
    try {
      const searchPattern = `%${query}%`;
      
      return await db.select()
        .from(offerFeed)
        .where(
          and(
            eq(offerFeed.isActive, true),
            or(
              like(offerFeed.title, searchPattern),
              like(offerFeed.description, searchPattern),
              like(offerFeed.merchant, searchPattern),
              like(offerFeed.category, searchPattern)
            )
          )
        )
        .orderBy(desc(offerFeed.priority))
        .limit(limit);
    } catch (error) {
      console.error('Failed to search offers:', error);
      return [];
    }
  }

  /**
   * Get featured offers (high priority, active)
   */
  async getFeaturedOffers(limit: number = 10): Promise<SelectOfferFeed[]> {
    try {
      return await db.select()
        .from(offerFeed)
        .where(
          and(
            eq(offerFeed.isActive, true),
            gte(offerFeed.priority, 7)
          )
        )
        .orderBy(desc(offerFeed.priority))
        .limit(limit);
    } catch (error) {
      console.error('Failed to get featured offers:', error);
      return [];
    }
  }

  /**
   * Get distinct offer categories
   */
  async getOfferCategories(): Promise<Array<{ category: string; count: number }>> {
    try {
      const categories = await db.select({
        category: offerFeed.category,
        count: count()
      })
      .from(offerFeed)
      .where(eq(offerFeed.isActive, true))
      .groupBy(offerFeed.category)
      .orderBy(desc(count()));

      return categories.map(cat => ({
        category: cat.category,
        count: cat.count
      }));
    } catch (error) {
      console.error('Failed to get offer categories:', error);
      return [];
    }
  }

  /**
   * Track offer click
   */
  async trackOfferClick(offerId: number, trackingData: ClickTrackingData): Promise<void> {
    try {
      // Insert analytics event
      await db.insert(offerAnalytics).values({
        offerId,
        eventType: 'click',
        sessionId: trackingData.sessionId,
        userId: trackingData.userId,
        neuronId: trackingData.neuronId,
        pageSlug: trackingData.pageSlug,
        deviceInfo: {
          userAgent: trackingData.deviceType,
          geoLocation: trackingData.geoLocation,
          referrer: trackingData.referrer
        },
        timestamp: new Date()
      });

      // Update offer click count
      await db.update(offerFeed)
        .set({
          clickCount: sql`COALESCE(click_count, 0) + 1`,
          updatedAt: new Date()
        })
        .where(eq(offerFeed.id, offerId));

    } catch (error) {
      console.error('Failed to track offer click:', error);
      throw error;
    }
  }

  /**
   * Get offer sources
   */
  async getOfferSources(): Promise<SelectOfferSource[]> {
    try {
      return await db.select()
        .from(offerSources)
        .orderBy(desc(offerSources.isActive), asc(offerSources.name));
    } catch (error) {
      console.error('Failed to get offer sources:', error);
      return [];
    }
  }

  /**
   * Get sync history
   */
  async getSyncHistory(options: { limit?: number; offset?: number } = {}): Promise<any[]> {
    try {
      const { limit = 50, offset = 0 } = options;
      
      return await db.select({
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
      .limit(limit)
      .offset(offset);
    } catch (error) {
      console.error('Failed to get sync history:', error);
      return [];
    }
  }

  /**
   * Get offer analytics dashboard data
   */
  async getOfferAnalyticsDashboard(): Promise<{
    totalOffers: number;
    activeOffers: number;
    totalClicks: number;
    totalConversions: number;
    topCategories: Array<{ category: string; clicks: number }>;
    topMerchants: Array<{ merchant: string; revenue: number }>;
    recentActivity: any[];
  }> {
    try {
      // Get basic counts
      const [totalOffersResult] = await db.select({ count: count() }).from(offerFeed);
      const [activeOffersResult] = await db.select({ count: count() })
        .from(offerFeed)
        .where(eq(offerFeed.isActive, true));

      // Get analytics aggregates
      const [clicksResult] = await db.select({
        totalClicks: count()
      })
      .from(offerAnalytics)
      .where(eq(offerAnalytics.eventType, 'click'));

      const [conversionsResult] = await db.select({
        totalConversions: count()
      })
      .from(offerAnalytics)
      .where(eq(offerAnalytics.eventType, 'conversion'));

      // Get top categories by clicks
      const topCategories = await db.select({
        category: offerFeed.category,
        clicks: sql`COALESCE(SUM(click_count), 0)`.as('clicks')
      })
      .from(offerFeed)
      .where(eq(offerFeed.isActive, true))
      .groupBy(offerFeed.category)
      .orderBy(sql`clicks DESC`)
      .limit(5);

      // Get top merchants by revenue
      const topMerchants = await db.select({
        merchant: offerFeed.merchant,
        revenue: sql`COALESCE(SUM(revenue_generated), 0)`.as('revenue')
      })
      .from(offerFeed)
      .where(eq(offerFeed.isActive, true))
      .groupBy(offerFeed.merchant)
      .orderBy(sql`revenue DESC`)
      .limit(5);

      // Get recent activity
      const recentActivity = await db.select({
        eventType: offerAnalytics.eventType,
        offerTitle: offerFeed.title,
        timestamp: offerAnalytics.timestamp
      })
      .from(offerAnalytics)
      .leftJoin(offerFeed, eq(offerAnalytics.offerId, offerFeed.id))
      .orderBy(desc(offerAnalytics.timestamp))
      .limit(10);

      return {
        totalOffers: totalOffersResult.count,
        activeOffers: activeOffersResult.count,
        totalClicks: clicksResult.totalClicks,
        totalConversions: conversionsResult.totalConversions,
        topCategories: topCategories.map(cat => ({
          category: cat.category,
          clicks: Number(cat.clicks) || 0
        })),
        topMerchants: topMerchants.map(merchant => ({
          merchant: merchant.merchant,
          revenue: Number(merchant.revenue) || 0
        })),
        recentActivity
      };
    } catch (error) {
      console.error('Failed to get analytics dashboard:', error);
      return {
        totalOffers: 0,
        activeOffers: 0,
        totalClicks: 0,
        totalConversions: 0,
        topCategories: [],
        topMerchants: [],
        recentActivity: []
      };
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(options: PerformanceMetrics = {}): Promise<any[]> {
    try {
      const {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        endDate = new Date(),
        groupBy = 'day',
        category,
        merchant
      } = options;

      let query = db.select({
        date: sql`DATE(timestamp)`.as('date'),
        clicks: sql`COUNT(CASE WHEN event_type = 'click' THEN 1 END)`.as('clicks'),
        conversions: sql`COUNT(CASE WHEN event_type = 'conversion' THEN 1 END)`.as('conversions'),
        revenue: sql`SUM(COALESCE(conversion_value, 0))`.as('revenue')
      })
      .from(offerAnalytics)
      .where(
        and(
          gte(offerAnalytics.timestamp, startDate),
          lte(offerAnalytics.timestamp, endDate)
        )
      );

      // Add filters if specified
      if (category || merchant) {
        query = query.leftJoin(offerFeed, eq(offerAnalytics.offerId, offerFeed.id));
        
        const conditions = [
          gte(offerAnalytics.timestamp, startDate),
          lte(offerAnalytics.timestamp, endDate)
        ];
        
        if (category) {
          conditions.push(eq(offerFeed.category, category));
        }
        
        if (merchant) {
          conditions.push(eq(offerFeed.merchant, merchant));
        }
        
        query = query.where(and(...conditions));
      }

      const results = await query.groupBy(sql`DATE(timestamp)`)
        .orderBy(sql`DATE(timestamp)`);

      return results.map(result => ({
        date: result.date,
        clicks: Number(result.clicks) || 0,
        conversions: Number(result.conversions) || 0,
        revenue: Number(result.revenue) || 0
      }));
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      return [];
    }
  }

  /**
   * Bulk insert or update offers
   */
  async bulkUpsertOffers(offers: InsertOfferFeed[]): Promise<{
    inserted: number;
    updated: number;
    errors: number;
  }> {
    let inserted = 0;
    let updated = 0;
    let errors = 0;

    for (const offer of offers) {
      try {
        // Check if offer exists by slug
        const [existing] = await db.select()
          .from(offerFeed)
          .where(eq(offerFeed.slug, offer.slug));

        if (existing) {
          // Update existing offer
          await db.update(offerFeed)
            .set({
              ...offer,
              updatedAt: new Date()
            })
            .where(eq(offerFeed.id, existing.id));
          updated++;
        } else {
          // Insert new offer
          await db.insert(offerFeed).values(offer);
          inserted++;
        }
      } catch (error) {
        console.error(`Failed to upsert offer ${offer.slug}:`, error);
        errors++;
      }
    }

    return { inserted, updated, errors };
  }
}

// Export singleton instance
export const offerEngineCore = OfferEngineCore.getInstance();