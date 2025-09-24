import express from 'express';
import { db } from '../db';
import { 
  analyticsEvents, 
  userSessions, 
  deviceFingerprints,
  globalUserProfiles,
  pageAffiliateAssignments,
  affiliateClicks,
  affiliateOffers
} from '../../shared/schema';
import { eq, and, gte, lte, desc, asc, count, avg, sum, sql, or, like, between } from 'drizzle-orm';
import { z } from 'zod';

const router = express.Router();

// Empire-Grade Analytics API Routes

// POST /api/analytics/event - Track analytics events with comprehensive data
router.post('/event', async (req, res) => {
  try {
    const {
      eventType,
      sessionId,
      userId = 'anonymous',
      pageSlug,
      timestamp = new Date(),
      deviceType = 'unknown',
      geoLocation = 'unknown',
      userAgent = '',
      referrer = '',
      metadata = {},
      conversionValue = 0
    } = req.body;

    // Validate required fields
    if (!eventType || !sessionId || !pageSlug) {
      return res.status(400).json({ 
        error: 'Missing required fields: eventType, sessionId, pageSlug' 
      });
    }

    // Enrich metadata with additional tracking data
    const enrichedMetadata = {
      ...metadata,
      ip: req.ip || req.connection.remoteAddress,
      timestamp: new Date().toISOString(),
      serverProcessingTime: Date.now(),
      userAgentParsed: parseUserAgent(userAgent),
      sessionDuration: await calculateSessionDuration(sessionId),
      pageLoadTime: metadata.pageLoadTime || 0,
      scrollDepth: metadata.scrollDepth || 0,
      timeOnPage: metadata.timeOnPage || 0,
      clickCoordinates: metadata.clickCoordinates,
      viewportSize: metadata.viewportSize,
      screenResolution: metadata.screenResolution,
      connectionType: metadata.connectionType,
      documentReferrer: referrer
    };

    // Create analytics event record
    const analyticsEvent = {
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
      eventType: eventType as 'page_view' | 'click' | 'form_submit' | 'conversion' | 'affiliate_click' | 'scroll' | 'time_on_page',
      sessionId,
      globalUserId: userId === 'anonymous' ? null : parseInt(userId),
      pageSlug,
      serverTimestamp: new Date(timestamp),
      deviceType,
      ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
      customData: enrichedMetadata,
      eventValue: parseFloat(conversionValue.toString()) || 0
    };

    // Store in database
    const [newEvent] = await db
      .insert(analyticsEvents)
      .values(analyticsEvent)
      .returning();

    // Process event for real-time analytics
    await processRealTimeEvent(newEvent);

    // Update session data
    await updateSessionMetrics(sessionId, eventType, metadata);

    // Check for conversion tracking
    if (eventType === 'conversion' || conversionValue > 0) {
      await trackConversion(sessionId, userId, conversionValue, metadata);
    }

    res.json({
      success: true,
      eventId: newEvent.id,
      metadata: {
        tracked: true,
        timestamp: new Date().toISOString(),
        enriched: true
      }
    });
  } catch (error) {
    console.error('Analytics event tracking error:', error);
    res.status(500).json({ error: 'Failed to track analytics event' });
  }
});

// POST /api/analytics/batch - Batch analytics events for performance
router.post('/batch', async (req, res) => {
  try {
    const { events, sessionId } = req.body;

    if (!events || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: 'Events array is required' });
    }

    if (events.length > 100) {
      return res.status(400).json({ error: 'Maximum 100 events per batch' });
    }

    const enrichedEvents = events.map((event, index) => ({
      eventId: event.eventId || `evt_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 15)}`,
      eventType: event.eventType,
      sessionId: event.sessionId || sessionId,
      globalUserId: event.globalUserId || null,
      pageSlug: event.pageSlug,
      serverTimestamp: new Date(event.timestamp || Date.now() + index),
      deviceType: event.deviceType || 'unknown',
      ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
      customData: {
        ...event.metadata,
        batchIndex: index,
        batchSize: events.length,
        batchId: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ip: req.ip || req.connection.remoteAddress,
        serverProcessingTime: Date.now()
      },
      eventValue: event.eventValue || 0
    }));

    // Batch insert
    const insertedEvents = await db
      .insert(analyticsEvents)
      .values(enrichedEvents)
      .returning();

    // Process events asynchronously
    setImmediate(async () => {
      for (const event of insertedEvents) {
        await processRealTimeEvent(event);
      }
    });

    res.json({
      success: true,
      eventsProcessed: insertedEvents.length,
      batchId: enrichedEvents[0].metadata.batchId,
      metadata: {
        tracked: true,
        timestamp: new Date().toISOString(),
        batchProcessing: true
      }
    });
  } catch (error) {
    console.error('Analytics batch tracking error:', error);
    res.status(500).json({ error: 'Failed to track analytics batch' });
  }
});

// GET /api/analytics/dashboard - Comprehensive analytics dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const { 
      from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      to = new Date().toISOString(),
      granularity = 'day',
      segments = [],
      metrics = ['page_views', 'unique_visitors', 'sessions', 'conversions']
    } = req.query;

    const fromDate = new Date(from as string);
    const toDate = new Date(to as string);

    // Get basic metrics
    const basicMetrics = await Promise.all([
      getPageViews(fromDate, toDate),
      getUniqueVisitors(fromDate, toDate),
      getSessions(fromDate, toDate),
      getConversions(fromDate, toDate),
      getBounceRate(fromDate, toDate),
      getAverageSessionDuration(fromDate, toDate)
    ]);

    // Get time series data
    const timeSeries = await getTimeSeriesData(fromDate, toDate, granularity as string);

    // Get top pages
    const topPages = await getTopPages(fromDate, toDate);

    // Get traffic sources
    const trafficSources = await getTrafficSources(fromDate, toDate);

    // Get device breakdown
    const deviceBreakdown = await getDeviceBreakdown(fromDate, toDate);

    // Get geographic data
    const geographicData = await getGeographicData(fromDate, toDate);

    // Get conversion funnel
    const conversionFunnel = await getConversionFunnel(fromDate, toDate);

    // Get real-time data
    const realTimeData = await getRealTimeData();

    const response = {
      summary: {
        pageViews: basicMetrics[0],
        uniqueVisitors: basicMetrics[1],
        sessions: basicMetrics[2],
        conversions: basicMetrics[3],
        bounceRate: basicMetrics[4],
        averageSessionDuration: basicMetrics[5]
      },
      timeSeries,
      topPages,
      trafficSources,
      deviceBreakdown,
      geographicData,
      conversionFunnel,
      realTime: realTimeData,
      dateRange: { from: fromDate, to: toDate },
      metadata: {
        generatedAt: new Date().toISOString(),
        granularity,
        segments: Array.isArray(segments) ? segments : [segments].filter(Boolean)
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Analytics dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics dashboard' });
  }
});

// GET /api/analytics/real-time - Real-time analytics data
router.get('/real-time', async (req, res) => {
  try {
    const realTimeWindow = 5; // minutes
    const windowStart = new Date(Date.now() - realTimeWindow * 60 * 1000);

    // Simple real-time data with basic counts
    const recentEvents = await db
      .select()
      .from(analyticsEvents)
      .where(gte(analyticsEvents.serverTimestamp, windowStart))
      .limit(100);

    const uniqueSessions = new Set(recentEvents.map(e => e.sessionId)).size;
    const pageViewEvents = recentEvents.filter(e => e.eventType === 'page_view');

    res.json({
      activeUsers: uniqueSessions,
      recentEvents: recentEvents.length,
      pageViews: pageViewEvents.length,
      topPages: [],
      trafficSources: [],
      conversionEvents: recentEvents.filter(e => e.eventType === 'conversion'),
      windowMinutes: realTimeWindow,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Real-time analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch real-time analytics' });
  }
});

// GET /api/analytics/export - Export analytics data
router.get('/export', async (req, res) => {
  try {
    const {
      from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      to = new Date().toISOString(),
      format = 'json',
      include = ['events', 'sessions', 'conversions'],
      filters = {}
    } = req.query;

    const fromDate = new Date(from as string);
    const toDate = new Date(to as string);
    const includeArray = Array.isArray(include) ? include : [include];

    const exportData: any = {
      metadata: {
        exportedAt: new Date().toISOString(),
        dateRange: { from: fromDate, to: toDate },
        format,
        recordCount: 0
      }
    };

    // Export events
    if (includeArray.includes('events')) {
      const events = await db
        .select()
        .from(analyticsEvents)
        .where(
          and(
            gte(analyticsEvents.timestamp, fromDate),
            lte(analyticsEvents.timestamp, toDate)
          )
        )
        .orderBy(desc(analyticsEvents.timestamp))
        .limit(10000); // Limit for performance

      exportData.events = events;
      exportData.metadata.recordCount += events.length;
    }

    // Export sessions
    if (includeArray.includes('sessions')) {
      const sessions = await db
        .select()
        .from(userSessions)
        .where(
          and(
            gte(userSessions.createdAt, fromDate),
            lte(userSessions.createdAt, toDate)
          )
        )
        .orderBy(desc(userSessions.createdAt))
        .limit(5000);

      exportData.sessions = sessions;
      exportData.metadata.recordCount += sessions.length;
    }

    // Export conversions
    if (includeArray.includes('conversions')) {
      const conversions = await db
        .select()
        .from(analyticsEvents)
        .where(
          and(
            eq(analyticsEvents.eventType, 'conversion'),
            gte(analyticsEvents.timestamp, fromDate),
            lte(analyticsEvents.timestamp, toDate)
          )
        )
        .orderBy(desc(analyticsEvents.timestamp))
        .limit(5000);

      exportData.conversions = conversions;
      exportData.metadata.recordCount += conversions.length;
    }

    // Handle different export formats
    if (format === 'csv') {
      const csv = convertToCSV(exportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-export-${Date.now()}.csv"`);
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-export-${Date.now()}.json"`);
      res.json(exportData);
    }
  } catch (error) {
    console.error('Analytics export error:', error);
    res.status(500).json({ error: 'Failed to export analytics data' });
  }
});

// Helper functions
function parseUserAgent(userAgent: string): any {
  // Simplified user agent parsing
  const browser = userAgent.includes('Chrome') ? 'Chrome' :
                 userAgent.includes('Firefox') ? 'Firefox' :
                 userAgent.includes('Safari') ? 'Safari' :
                 userAgent.includes('Edge') ? 'Edge' : 'Unknown';
  
  const os = userAgent.includes('Windows') ? 'Windows' :
            userAgent.includes('Mac') ? 'macOS' :
            userAgent.includes('Linux') ? 'Linux' :
            userAgent.includes('Android') ? 'Android' :
            userAgent.includes('iOS') ? 'iOS' : 'Unknown';
  
  const device = userAgent.includes('Mobile') ? 'Mobile' :
                userAgent.includes('Tablet') ? 'Tablet' : 'Desktop';
  
  return { browser, os, device };
}

async function calculateSessionDuration(sessionId: string): Promise<number> {
  try {
    const events = await db
      .select({ serverTimestamp: analyticsEvents.serverTimestamp })
      .from(analyticsEvents)
      .where(eq(analyticsEvents.sessionId, sessionId))
      .orderBy(asc(analyticsEvents.serverTimestamp));

    if (events.length < 2) return 0;

    const firstEvent = events[0].serverTimestamp;
    const lastEvent = events[events.length - 1].serverTimestamp;
    
    return lastEvent.getTime() - firstEvent.getTime();
  } catch (error) {
    console.warn('Error calculating session duration:', error);
    return 0;
  }
}

async function processRealTimeEvent(event: any): Promise<void> {
  // Process for real-time analytics
  // This could update caches, trigger alerts, etc.
  console.log(`Processing real-time event: ${event.eventType} for session ${event.sessionId}`);
}

async function updateSessionMetrics(sessionId: string, eventType: string, metadata: any): Promise<void> {
  try {
    // Update session with latest activity
    await db
      .update(userSessions)
      .set({
        lastActiveAt: new Date(),
        metadata: sql`${userSessions.metadata} || ${JSON.stringify({ lastEventType: eventType, ...metadata })}`
      })
      .where(eq(userSessions.sessionId, sessionId));
  } catch (error) {
    console.warn('Failed to update session metrics:', error);
  }
}

async function trackConversion(sessionId: string, userId: string, value: number, metadata: any): Promise<void> {
  // Track conversion in dedicated conversion tracking
  console.log(`Conversion tracked: ${value} for user ${userId} in session ${sessionId}`);
}

// Analytics aggregation functions
async function getPageViews(from: Date, to: Date): Promise<number> {
  try {
    const result = await db
      .select({ count: count() })
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.eventType, 'page_view'),
          gte(analyticsEvents.serverTimestamp, from),
          lte(analyticsEvents.serverTimestamp, to)
        )
      );
    return result[0]?.count || 0;
  } catch (error) {
    console.warn('Error getting page views:', error);
    return 0;
  }
}

async function getUniqueVisitors(from: Date, to: Date): Promise<number> {
  try {
    const result = await db
      .select({ count: sql`COUNT(DISTINCT ${analyticsEvents.globalUserId})` })
      .from(analyticsEvents)
      .where(
        and(
          gte(analyticsEvents.serverTimestamp, from),
          lte(analyticsEvents.serverTimestamp, to)
        )
      );
    return Number(result[0]?.count) || 0;
  } catch (error) {
    console.warn('Error getting unique visitors:', error);
    return 0;
  }
}

async function getSessions(from: Date, to: Date): Promise<number> {
  try {
    const result = await db
      .select({ count: sql`COUNT(DISTINCT ${analyticsEvents.sessionId})` })
      .from(analyticsEvents)
      .where(
        and(
          gte(analyticsEvents.serverTimestamp, from),
          lte(analyticsEvents.serverTimestamp, to)
        )
      );
    return Number(result[0]?.count) || 0;
  } catch (error) {
    console.warn('Error getting sessions:', error);
    return 0;
  }
}

async function getConversions(from: Date, to: Date): Promise<number> {
  try {
    const result = await db
      .select({ count: count() })
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.eventType, 'conversion'),
          gte(analyticsEvents.serverTimestamp, from),
          lte(analyticsEvents.serverTimestamp, to)
        )
      );
    return result[0]?.count || 0;
  } catch (error) {
    console.warn('Error getting conversions:', error);
    return 0;
  }
}

async function getBounceRate(from: Date, to: Date): Promise<number> {
  try {
    // Sessions with only one page view
    const singlePageSessions = await db
      .select({
        sessionId: analyticsEvents.sessionId,
        eventCount: count()
      })
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.eventType, 'page_view'),
          gte(analyticsEvents.serverTimestamp, from),
          lte(analyticsEvents.serverTimestamp, to)
        )
      )
      .groupBy(analyticsEvents.sessionId)
      .having(eq(count(), 1));

    const totalSessions = await getSessions(from, to);
    return totalSessions > 0 ? (singlePageSessions.length / totalSessions) * 100 : 0;
  } catch (error) {
    console.warn('Error getting bounce rate:', error);
    return 0;
  }
}

async function getAverageSessionDuration(from: Date, to: Date): Promise<number> {
  try {
    // Simplified calculation
    const sessions = await db
      .select({
        sessionId: analyticsEvents.sessionId,
        minTime: sql`MIN(${analyticsEvents.serverTimestamp})`,
        maxTime: sql`MAX(${analyticsEvents.serverTimestamp})`
      })
      .from(analyticsEvents)
      .where(
        and(
          gte(analyticsEvents.serverTimestamp, from),
          lte(analyticsEvents.serverTimestamp, to)
        )
      )
      .groupBy(analyticsEvents.sessionId);

    if (sessions.length === 0) return 0;

    const totalDuration = sessions.reduce((sum, session) => {
      const duration = new Date(session.maxTime).getTime() - new Date(session.minTime).getTime();
      return sum + duration;
    }, 0);

    return totalDuration / sessions.length;
  } catch (error) {
    console.warn('Error getting average session duration:', error);
    return 0;
  }
}

async function getTimeSeriesData(from: Date, to: Date, granularity: string): Promise<any[]> {
  const granularityMap: { [key: string]: string } = {
    hour: 'YYYY-MM-DD HH24:00:00',
    day: 'YYYY-MM-DD',
    week: 'YYYY-"W"WW',
    month: 'YYYY-MM'
  };

  const formatString = granularityMap[granularity] || granularityMap.day;

  const result = await db
    .select({
      period: sql`TO_CHAR(${analyticsEvents.timestamp}, '${formatString}')`,
      pageViews: count(),
      uniqueVisitors: sql`COUNT(DISTINCT ${analyticsEvents.userId})`,
      sessions: sql`COUNT(DISTINCT ${analyticsEvents.sessionId})`
    })
    .from(analyticsEvents)
    .where(
      and(
        gte(analyticsEvents.timestamp, from),
        lte(analyticsEvents.timestamp, to)
      )
    )
    .groupBy(sql`TO_CHAR(${analyticsEvents.timestamp}, '${formatString}')`)
    .orderBy(sql`TO_CHAR(${analyticsEvents.timestamp}, '${formatString}')`);

  return result.map(row => ({
    period: row.period,
    pageViews: row.pageViews,
    uniqueVisitors: Number(row.uniqueVisitors),
    sessions: Number(row.sessions)
  }));
}

async function getTopPages(from: Date, to: Date): Promise<any[]> {
  const result = await db
    .select({
      pageSlug: analyticsEvents.pageSlug,
      views: count(),
      uniqueVisitors: sql`COUNT(DISTINCT ${analyticsEvents.userId})`
    })
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.eventType, 'page_view'),
        gte(analyticsEvents.timestamp, from),
        lte(analyticsEvents.timestamp, to)
      )
    )
    .groupBy(analyticsEvents.pageSlug)
    .orderBy(desc(count()))
    .limit(10);

  return result.map(row => ({
    page: row.pageSlug,
    views: row.views,
    uniqueVisitors: Number(row.uniqueVisitors)
  }));
}

async function getTrafficSources(from: Date, to: Date): Promise<any[]> {
  const result = await db
    .select({
      source: analyticsEvents.referrer,
      visitors: sql`COUNT(DISTINCT ${analyticsEvents.userId})`,
      sessions: sql`COUNT(DISTINCT ${analyticsEvents.sessionId})`
    })
    .from(analyticsEvents)
    .where(
      and(
        gte(analyticsEvents.timestamp, from),
        lte(analyticsEvents.timestamp, to)
      )
    )
    .groupBy(analyticsEvents.referrer)
    .orderBy(desc(sql`COUNT(DISTINCT ${analyticsEvents.userId})`))
    .limit(10);

  return result.map(row => ({
    source: row.source || 'Direct',
    visitors: Number(row.visitors),
    sessions: Number(row.sessions)
  }));
}

async function getDeviceBreakdown(from: Date, to: Date): Promise<any[]> {
  const result = await db
    .select({
      deviceType: analyticsEvents.deviceType,
      count: sql`COUNT(DISTINCT ${analyticsEvents.userId})`
    })
    .from(analyticsEvents)
    .where(
      and(
        gte(analyticsEvents.timestamp, from),
        lte(analyticsEvents.timestamp, to)
      )
    )
    .groupBy(analyticsEvents.deviceType)
    .orderBy(desc(sql`COUNT(DISTINCT ${analyticsEvents.userId})`));

  return result.map(row => ({
    device: row.deviceType,
    users: Number(row.count)
  }));
}

async function getGeographicData(from: Date, to: Date): Promise<any[]> {
  const result = await db
    .select({
      location: analyticsEvents.geoLocation,
      users: sql`COUNT(DISTINCT ${analyticsEvents.userId})`,
      sessions: sql`COUNT(DISTINCT ${analyticsEvents.sessionId})`
    })
    .from(analyticsEvents)
    .where(
      and(
        gte(analyticsEvents.timestamp, from),
        lte(analyticsEvents.timestamp, to)
      )
    )
    .groupBy(analyticsEvents.geoLocation)
    .orderBy(desc(sql`COUNT(DISTINCT ${analyticsEvents.userId})`))
    .limit(20);

  return result.map(row => ({
    location: row.location,
    users: Number(row.users),
    sessions: Number(row.sessions)
  }));
}

async function getConversionFunnel(from: Date, to: Date): Promise<any[]> {
  // Simplified funnel analysis
  const funnelSteps = [
    { name: 'Page View', eventType: 'page_view' },
    { name: 'Click', eventType: 'click' },
    { name: 'Form Submit', eventType: 'form_submit' },
    { name: 'Conversion', eventType: 'conversion' }
  ];

  const funnelData = await Promise.all(
    funnelSteps.map(async step => {
      const result = await db
        .select({ count: sql`COUNT(DISTINCT ${analyticsEvents.userId})` })
        .from(analyticsEvents)
        .where(
          and(
            eq(analyticsEvents.eventType, step.eventType as any),
            gte(analyticsEvents.timestamp, from),
            lte(analyticsEvents.timestamp, to)
          )
        );

      return {
        step: step.name,
        users: Number(result[0]?.count) || 0
      };
    })
  );

  return funnelData;
}

async function getRealTimeData(): Promise<any> {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const [activeUsers, recentEvents] = await Promise.all([
    getActiveUsers(fiveMinutesAgo),
    getRecentEvents(fiveMinutesAgo)
  ]);

  return {
    activeUsers,
    recentEventCount: recentEvents.length,
    timestamp: new Date().toISOString()
  };
}

async function getActiveUsers(since: Date): Promise<number> {
  try {
    const result = await db
      .select({ count: sql`COUNT(DISTINCT ${analyticsEvents.globalUserId})` })
      .from(analyticsEvents)
      .where(gte(analyticsEvents.serverTimestamp, since));

    return Number(result[0]?.count) || 0;
  } catch (error) {
    console.warn('Error getting active users:', error);
    return 0;
  }
}

async function getRecentEvents(since: Date): Promise<any[]> {
  try {
    return await db
      .select()
      .from(analyticsEvents)
      .where(gte(analyticsEvents.serverTimestamp, since))
      .orderBy(desc(analyticsEvents.serverTimestamp))
      .limit(100);
  } catch (error) {
    console.warn('Error getting recent events:', error);
    return [];
  }
}

async function getTopPagesRealTime(since: Date): Promise<any[]> {
  const result = await db
    .select({
      pageSlug: analyticsEvents.pageSlug,
      views: count()
    })
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.eventType, 'page_view'),
        gte(analyticsEvents.timestamp, since)
      )
    )
    .groupBy(analyticsEvents.pageSlug)
    .orderBy(desc(count()))
    .limit(5);

  return result.map(row => ({
    page: row.pageSlug,
    views: row.views
  }));
}

async function getTrafficSourcesRealTime(since: Date): Promise<any[]> {
  const result = await db
    .select({
      source: analyticsEvents.referrer,
      sessions: sql`COUNT(DISTINCT ${analyticsEvents.sessionId})`
    })
    .from(analyticsEvents)
    .where(gte(analyticsEvents.timestamp, since))
    .groupBy(analyticsEvents.referrer)
    .orderBy(desc(sql`COUNT(DISTINCT ${analyticsEvents.sessionId})`))
    .limit(5);

  return result.map(row => ({
    source: row.source || 'Direct',
    sessions: Number(row.sessions)
  }));
}

async function getRecentConversions(since: Date): Promise<any[]> {
  try {
    return await db
      .select()
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.eventType, 'conversion'),
          gte(analyticsEvents.serverTimestamp, since)
        )
      )
      .orderBy(desc(analyticsEvents.serverTimestamp))
      .limit(10);
  } catch (error) {
    console.warn('Error getting recent conversions:', error);
    return [];
  }
}

function convertToCSV(data: any): string {
  // Simple CSV conversion - would need more robust implementation
  const events = data.events || [];
  if (events.length === 0) return 'No data';

  const headers = Object.keys(events[0]).join(',');
  const rows = events.map((event: any) => 
    Object.values(event).map(value => 
      typeof value === 'object' ? JSON.stringify(value) : value
    ).join(',')
  );

  return [headers, ...rows].join('\n');
}

export default router;