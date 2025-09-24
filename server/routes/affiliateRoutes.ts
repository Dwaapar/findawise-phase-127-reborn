import express from 'express';
import { db } from '../db';
import { 
  affiliateOffers, 
  affiliateClicks, 
  affiliateNetworks, 
  pageAffiliateAssignments,
  userSessions,
  analyticsEvents 
} from '../../shared/schema';
import { eq, and, gte, lte, desc, asc, count, avg, sum, sql, or, like, inArray } from 'drizzle-orm';
import { emotionMap } from '../../client/src/config/emotionMap';

const router = express.Router();

// Empire-Grade Affiliate Offer API Routes

// GET /api/affiliate/offers - Comprehensive offer retrieval with filtering and personalization
router.get('/offers', async (req, res) => {
  try {
    const { 
      page_slug,
      emotion = 'neutral',
      position = 'inline',
      max_offers = '4',
      sort_by = 'priority',
      user_segment,
      categories,
      min_commission,
      max_commission,
      featured_only,
      active_only = 'true',
      include_metadata = 'true'
    } = req.query;

    // Build query conditions
    const conditions = [];
    
    if (active_only === 'true') {
      conditions.push(eq(affiliateOffers.isActive, true));
    }

    if (featured_only === 'true') {
      conditions.push(eq(affiliateOffers.isFeatured, true));
    }

    if (emotion && emotion !== 'neutral') {
      conditions.push(
        or(
          eq(affiliateOffers.emotion, emotion as string),
          eq(affiliateOffers.emotion, 'universal')
        )
      );
    }

    if (categories) {
      const categoryList = (categories as string).split(',');
      conditions.push(inArray(affiliateOffers.category, categoryList));
    }

    if (min_commission) {
      // Parse commission value and filter
      conditions.push(
        sql`CAST(REGEXP_REPLACE(${affiliateOffers.commission}, '[^0-9.]', '') AS DECIMAL) >= ${min_commission}`
      );
    }

    if (max_commission) {
      conditions.push(
        sql`CAST(REGEXP_REPLACE(${affiliateOffers.commission}, '[^0-9.]', '') AS DECIMAL) <= ${max_commission}`
      );
    }

    // Execute main query
    let query = db
      .select({
        id: affiliateOffers.id,
        slug: affiliateOffers.slug,
        title: affiliateOffers.title,
        description: affiliateOffers.description,
        category: affiliateOffers.category,
        emotion: affiliateOffers.emotion,
        targetUrl: affiliateOffers.targetUrl,
        ctaText: affiliateOffers.ctaText,
        commission: affiliateOffers.commission,
        isActive: affiliateOffers.isActive,
        isFeatured: affiliateOffers.isFeatured,
        priority: affiliateOffers.priority,
        merchantName: affiliateOffers.merchantName,
        originalPrice: affiliateOffers.originalPrice,
        salePrice: affiliateOffers.salePrice,
        discountPercentage: affiliateOffers.discountPercentage,
        validUntil: affiliateOffers.validUntil,
        badges: affiliateOffers.badges,
        microcopy: affiliateOffers.microcopy,
        styles: affiliateOffers.styles,
        metadata: affiliateOffers.metadata,
        createdAt: affiliateOffers.createdAt,
        updatedAt: affiliateOffers.updatedAt
      })
      .from(affiliateOffers);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    switch (sort_by) {
      case 'commission':
        query = query.orderBy(
          desc(sql`CAST(REGEXP_REPLACE(${affiliateOffers.commission}, '[^0-9.]', '') AS DECIMAL)`)
        );
        break;
      case 'recent':
        query = query.orderBy(desc(affiliateOffers.updatedAt));
        break;
      case 'alphabetical':
        query = query.orderBy(asc(affiliateOffers.title));
        break;
      case 'conversion':
        // Would join with analytics for conversion rates
        query = query.orderBy(desc(affiliateOffers.priority));
        break;
      default: // priority
        query = query.orderBy(desc(affiliateOffers.priority), desc(affiliateOffers.isFeatured));
    }

    // Apply limit
    const limit = Math.min(parseInt(max_offers as string), 20); // Max 20 offers
    query = query.limit(limit);

    const offers = await query;

    // Enhance offers with performance metadata if requested
    if (include_metadata === 'true') {
      for (const offer of offers) {
        // Get click statistics
        const clickStats = await db
          .select({
            totalClicks: count(),
            conversions: sum(sql`CASE WHEN ${affiliateClicks.conversionTracked} THEN 1 ELSE 0 END`),
            revenue: sum(affiliateClicks.conversionValue)
          })
          .from(affiliateClicks)
          .where(eq(affiliateClicks.offerId, offer.id));

        const stats = clickStats[0];
        const totalClicks = stats?.totalClicks || 0;
        const conversions = Number(stats?.conversions) || 0;
        const revenue = Number(stats?.revenue) || 0;

        // Calculate performance metrics
        offer.metadata = {
          ...offer.metadata,
          clickCount: totalClicks,
          conversionRate: totalClicks > 0 ? (conversions / totalClicks) * 100 : 0,
          totalRevenue: revenue,
          qualityScore: calculateQualityScore(totalClicks, conversions, revenue),
          trustScore: calculateTrustScore(offer),
          lastClicked: await getLastClickedDate(offer.id)
        };
      }
    }

    // Apply user segment specific filtering/sorting
    if (user_segment) {
      // Implement segment-specific logic
      switch (user_segment) {
        case 'high_converter':
          // Prioritize high-value offers
          offers.sort((a, b) => {
            const aCommission = parseFloat(a.commission.replace(/[^\d.]/g, '') || '0');
            const bCommission = parseFloat(b.commission.replace(/[^\d.]/g, '') || '0');
            return bCommission - aCommission;
          });
          break;
        case 'researcher':
          // Prioritize trust-based and educational offers
          offers.sort((a, b) => {
            const aTrust = a.emotion === 'trust' ? 1 : 0;
            const bTrust = b.emotion === 'trust' ? 1 : 0;
            return bTrust - aTrust;
          });
          break;
        case 'mobile_user':
          // Filter mobile-optimized offers
          // Would check offer metadata for mobile optimization
          break;
      }
    }

    // Generate response with comprehensive data
    const response = {
      offers: offers.slice(0, limit),
      metadata: {
        totalFound: offers.length,
        filters: {
          emotion,
          position,
          categories: categories ? (categories as string).split(',') : [],
          user_segment,
          featured_only: featured_only === 'true'
        },
        sorting: sort_by,
        timestamp: new Date().toISOString()
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Affiliate offers fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch affiliate offers' });
  }
});

// POST /api/affiliate/click - Track affiliate click with comprehensive analytics
router.post('/click', async (req, res) => {
  try {
    const {
      offerId,
      offerSlug,
      sessionId,
      userId = 'anonymous',
      pageSlug,
      position = 'inline',
      emotion,
      metadata = {}
    } = req.body;

    // Validate required fields
    if (!offerId || !sessionId) {
      return res.status(400).json({ error: 'Missing required fields: offerId, sessionId' });
    }

    // Get offer details for validation
    const offer = await db
      .select()
      .from(affiliateOffers)
      .where(eq(affiliateOffers.id, offerId))
      .limit(1);

    if (!offer.length) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    const offerData = offer[0];

    // Create comprehensive click record
    const clickRecord = {
      offerId,
      sessionId,
      userId,
      sourcePage: pageSlug || 'unknown',
      userAgent: req.headers['user-agent'] || '',
      ipAddress: req.ip || req.connection.remoteAddress || '',
      clickedAt: new Date(),
      conversionTracked: false,
      conversionValue: 0,
      metadata: {
        ...metadata,
        position,
        emotion,
        offerSlug: offerData.slug,
        offerTitle: offerData.title,
        offerCategory: offerData.category,
        commission: offerData.commission,
        clickCoordinates: metadata.clickCoordinates,
        deviceType: metadata.deviceType,
        geoLocation: metadata.geoLocation,
        referrer: metadata.referrer,
        timeOnPage: metadata.timeOnPage,
        scrollDepth: metadata.scrollDepth
      }
    };

    // Store click in database
    const [newClick] = await db
      .insert(affiliateClicks)
      .values(clickRecord)
      .returning();

    // Also track as analytics event
    const analyticsEvent = {
      eventType: 'affiliate_click' as const,
      sessionId,
      userId,
      pageSlug: pageSlug || 'unknown',
      timestamp: new Date(),
      deviceType: metadata.deviceType || 'unknown',
      geoLocation: metadata.geoLocation || 'unknown',
      userAgent: req.headers['user-agent'] || '',
      referrer: metadata.referrer || '',
      metadata: {
        offerId,
        offerSlug: offerData.slug,
        position,
        emotion,
        clickId: newClick.id,
        ...metadata
      },
      conversionValue: 0
    };

    await db.insert(analyticsEvents).values(analyticsEvent);

    // Generate tracking URL with comprehensive UTM parameters
    const trackingParams = new URLSearchParams({
      ref: pageSlug || 'unknown',
      utm_source: 'findawise_empire',
      utm_medium: 'affiliate_renderer',
      utm_campaign: `${emotion}_${position}`,
      utm_content: offerData.category,
      utm_term: offerData.slug,
      session_id: sessionId,
      user_id: userId,
      click_id: newClick.id.toString(),
      timestamp: Date.now().toString()
    });

    const trackingUrl = `/go/${offerData.slug}?${trackingParams.toString()}`;

    // Update offer click statistics (for caching)
    await updateOfferStats(offerId);

    res.json({
      success: true,
      clickId: newClick.id,
      trackingUrl,
      offer: {
        id: offerData.id,
        slug: offerData.slug,
        title: offerData.title,
        targetUrl: offerData.targetUrl
      },
      metadata: {
        tracked: true,
        timestamp: new Date().toISOString(),
        analytics: true
      }
    });
  } catch (error) {
    console.error('Affiliate click tracking error:', error);
    res.status(500).json({ error: 'Failed to track affiliate click' });
  }
});

// GET /api/affiliate/redirect/:slug - Handle affiliate redirects with tracking
router.get('/redirect/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const {
      ref,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
      session_id,
      user_id,
      click_id,
      timestamp
    } = req.query;

    // Get offer by slug
    const offer = await db
      .select()
      .from(affiliateOffers)
      .where(and(
        eq(affiliateOffers.slug, slug),
        eq(affiliateOffers.isActive, true)
      ))
      .limit(1);

    if (!offer.length) {
      return res.status(404).json({ error: 'Offer not found or inactive' });
    }

    const offerData = offer[0];

    // Track redirect event
    if (click_id) {
      await db
        .update(affiliateClicks)
        .set({
          metadata: sql`${affiliateClicks.metadata} || '{"redirected": true, "redirectedAt": "' || ${new Date().toISOString()} || '"}'`
        })
        .where(eq(affiliateClicks.id, parseInt(click_id as string)));
    }

    // Build final redirect URL with all tracking parameters
    const finalUrl = new URL(offerData.targetUrl);
    
    // Preserve original query parameters
    if (ref) finalUrl.searchParams.set('ref', ref as string);
    if (utm_source) finalUrl.searchParams.set('utm_source', utm_source as string);
    if (utm_medium) finalUrl.searchParams.set('utm_medium', utm_medium as string);
    if (utm_campaign) finalUrl.searchParams.set('utm_campaign', utm_campaign as string);
    if (utm_content) finalUrl.searchParams.set('utm_content', utm_content as string);
    if (utm_term) finalUrl.searchParams.set('utm_term', utm_term as string);
    
    // Add tracking identifiers
    if (session_id) finalUrl.searchParams.set('session_id', session_id as string);
    if (user_id) finalUrl.searchParams.set('user_id', user_id as string);
    if (click_id) finalUrl.searchParams.set('click_id', click_id as string);

    // Log successful redirect for analytics
    const analyticsEvent = {
      eventType: 'affiliate_redirect' as const,
      sessionId: session_id as string || 'unknown',
      userId: user_id as string || 'anonymous',
      pageSlug: 'redirect',
      timestamp: new Date(),
      deviceType: getDeviceType(req.headers['user-agent']),
      geoLocation: 'unknown', // Would integrate with geo service
      userAgent: req.headers['user-agent'] || '',
      referrer: req.headers.referer || '',
      metadata: {
        offerId: offerData.id,
        offerSlug: slug,
        targetUrl: finalUrl.toString(),
        clickId: click_id,
        allParams: req.query
      },
      conversionValue: 0
    };

    await db.insert(analyticsEvents).values(analyticsEvent);

    // Perform redirect
    res.redirect(302, finalUrl.toString());
  } catch (error) {
    console.error('Affiliate redirect error:', error);
    res.status(500).json({ error: 'Redirect failed' });
  }
});

// POST /api/affiliate/conversion - Track conversion events
router.post('/conversion', async (req, res) => {
  try {
    const {
      clickId,
      sessionId,
      conversionValue = 0,
      conversionType = 'sale',
      metadata = {}
    } = req.body;

    if (!clickId && !sessionId) {
      return res.status(400).json({ error: 'Missing clickId or sessionId' });
    }

    // Find the original click
    let click;
    if (clickId) {
      const clicks = await db
        .select()
        .from(affiliateClicks)
        .where(eq(affiliateClicks.id, clickId))
        .limit(1);
      click = clicks[0];
    } else {
      // Find most recent click for session
      const clicks = await db
        .select()
        .from(affiliateClicks)
        .where(eq(affiliateClicks.sessionId, sessionId))
        .orderBy(desc(affiliateClicks.clickedAt))
        .limit(1);
      click = clicks[0];
    }

    if (!click) {
      return res.status(404).json({ error: 'Original click not found' });
    }

    // Update click with conversion data
    await db
      .update(affiliateClicks)
      .set({
        conversionTracked: true,
        conversionValue: parseFloat(conversionValue.toString()),
        metadata: {
          ...click.metadata,
          conversionType,
          conversionTrackedAt: new Date().toISOString(),
          conversionMetadata: metadata
        }
      })
      .where(eq(affiliateClicks.id, click.id));

    // Track conversion as analytics event
    const analyticsEvent = {
      eventType: 'conversion' as const,
      sessionId: click.sessionId,
      userId: click.userId,
      pageSlug: 'conversion',
      timestamp: new Date(),
      deviceType: metadata.deviceType || 'unknown',
      geoLocation: metadata.geoLocation || 'unknown',
      userAgent: metadata.userAgent || '',
      referrer: metadata.referrer || '',
      metadata: {
        offerId: click.offerId,
        clickId: click.id,
        conversionType,
        originalClickDate: click.clickedAt,
        ...metadata
      },
      conversionValue: parseFloat(conversionValue.toString())
    };

    await db.insert(analyticsEvents).values(analyticsEvent);

    // Update offer performance stats
    await updateOfferStats(click.offerId);

    res.json({
      success: true,
      conversionId: click.id,
      conversionValue: parseFloat(conversionValue.toString()),
      metadata: {
        tracked: true,
        timestamp: new Date().toISOString(),
        originalClick: click.clickedAt
      }
    });
  } catch (error) {
    console.error('Conversion tracking error:', error);
    res.status(500).json({ error: 'Failed to track conversion' });
  }
});

// GET /api/affiliate/stats/:offerId - Get detailed offer performance statistics
router.get('/stats/:offerId', async (req, res) => {
  try {
    const { offerId } = req.params;
    const { 
      from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      to = new Date().toISOString()
    } = req.query;

    const fromDate = new Date(from as string);
    const toDate = new Date(to as string);

    // Get offer details
    const offer = await db
      .select()
      .from(affiliateOffers)
      .where(eq(affiliateOffers.id, parseInt(offerId)))
      .limit(1);

    if (!offer.length) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    // Get click statistics
    const clickStats = await db
      .select({
        totalClicks: count(),
        conversions: sum(sql`CASE WHEN ${affiliateClicks.conversionTracked} THEN 1 ELSE 0 END`),
        totalRevenue: sum(affiliateClicks.conversionValue)
      })
      .from(affiliateClicks)
      .where(
        and(
          eq(affiliateClicks.offerId, parseInt(offerId)),
          gte(affiliateClicks.clickedAt, fromDate),
          lte(affiliateClicks.clickedAt, toDate)
        )
      );

    const stats = clickStats[0];
    const totalClicks = stats?.totalClicks || 0;
    const conversions = Number(stats?.conversions) || 0;
    const totalRevenue = Number(stats?.totalRevenue) || 0;

    // Get daily breakdown
    const dailyStats = await db
      .select({
        date: sql<string>`DATE(${affiliateClicks.clickedAt})`,
        clicks: count(),
        conversions: sum(sql`CASE WHEN ${affiliateClicks.conversionTracked} THEN 1 ELSE 0 END`),
        revenue: sum(affiliateClicks.conversionValue)
      })
      .from(affiliateClicks)
      .where(
        and(
          eq(affiliateClicks.offerId, parseInt(offerId)),
          gte(affiliateClicks.clickedAt, fromDate),
          lte(affiliateClicks.clickedAt, toDate)
        )
      )
      .groupBy(sql`DATE(${affiliateClicks.clickedAt})`)
      .orderBy(sql`DATE(${affiliateClicks.clickedAt})`);

    const response = {
      offer: offer[0],
      stats: {
        totalClicks,
        conversions,
        conversionRate: totalClicks > 0 ? (conversions / totalClicks) * 100 : 0,
        totalRevenue,
        averageOrderValue: conversions > 0 ? totalRevenue / conversions : 0,
        qualityScore: calculateQualityScore(totalClicks, conversions, totalRevenue)
      },
      dailyStats: dailyStats.map(day => ({
        date: day.date,
        clicks: day.clicks,
        conversions: Number(day.conversions),
        revenue: Number(day.revenue),
        conversionRate: day.clicks > 0 ? (Number(day.conversions) / day.clicks) * 100 : 0
      })),
      dateRange: { from: fromDate, to: toDate }
    };

    res.json(response);
  } catch (error) {
    console.error('Offer stats error:', error);
    res.status(500).json({ error: 'Failed to fetch offer statistics' });
  }
});

// Helper functions
function getDeviceType(userAgent?: string): string {
  if (!userAgent) return 'unknown';
  
  if (/Mobile|Android|iPhone/.test(userAgent)) return 'mobile';
  if (/iPad/.test(userAgent)) return 'tablet';
  return 'desktop';
}

function calculateQualityScore(clicks: number, conversions: number, revenue: number): number {
  // Quality score algorithm (0-100)
  const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
  const avgOrderValue = conversions > 0 ? revenue / conversions : 0;
  
  // Weighted score
  const conversionWeight = Math.min(conversionRate * 2, 40); // Max 40 points
  const volumeWeight = Math.min(Math.log10(clicks + 1) * 10, 30); // Max 30 points
  const revenueWeight = Math.min(Math.log10(avgOrderValue + 1) * 3, 30); // Max 30 points
  
  return Math.round(conversionWeight + volumeWeight + revenueWeight);
}

function calculateTrustScore(offer: any): number {
  // Trust score based on offer characteristics
  let score = 50; // Base score
  
  if (offer.merchantName) score += 10;
  if (offer.description && offer.description.length > 50) score += 10;
  if (offer.badges && offer.badges.length > 0) score += 15;
  if (offer.microcopy?.disclaimer) score += 10;
  if (offer.validUntil) score += 5;
  
  return Math.min(score, 100);
}

async function getLastClickedDate(offerId: number): Promise<string | null> {
  const lastClick = await db
    .select({ clickedAt: affiliateClicks.clickedAt })
    .from(affiliateClicks)
    .where(eq(affiliateClicks.offerId, offerId))
    .orderBy(desc(affiliateClicks.clickedAt))
    .limit(1);
  
  return lastClick[0]?.clickedAt.toISOString() || null;
}

async function updateOfferStats(offerId: number): Promise<void> {
  // This would update cached statistics for the offer
  // Implementation depends on caching strategy
  try {
    // Could update a statistics table or cache
    console.log(`Updated stats for offer ${offerId}`);
  } catch (error) {
    console.warn('Failed to update offer stats:', error);
  }
}

export default router;