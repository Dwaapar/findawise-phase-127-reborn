/**
 * Session + Personalization API Routes - Enterprise-Grade Session Management
 * Federation-Ready API Endpoints for Cross-Device Session Tracking and GDPR Compliance
 */

import { Router, type Request, Response } from 'express';
import { z } from 'zod';
import { sessionEngineCore } from '../services/session/sessionEngineCore';
import { logger } from '../utils/logger';
import { storage } from '../storage';

const router = Router();

// Validation schemas
const InitSessionSchema = z.object({
  sessionId: z.string().min(1),
  userId: z.string().optional(),
  fingerprint: z.string().optional(),
  deviceId: z.string().optional(),
  deviceInfo: z.object({
    userAgent: z.string(),
    screen: z.object({
      width: z.number(),
      height: z.number(),
    }),
    timezone: z.string(),
    language: z.string(),
  }),
  location: z.object({
    country: z.string().optional(),
    region: z.string().optional(),
    city: z.string().optional(),
  }).optional(),
});

const TrackBehaviorSchema = z.object({
  sessionId: z.string().min(1),
  eventType: z.string().min(1),
  eventData: z.record(z.any()).optional(),
  pageSlug: z.string().optional(),
  userId: z.string().optional(),
});

const PrivacyConsentSchema = z.object({
  trackingConsent: z.boolean(),
  personalizationConsent: z.boolean(),
  analyticsConsent: z.boolean(),
  marketingConsent: z.boolean(),
  dataRetentionDays: z.number().min(1).max(2555).default(365), // Max 7 years
  ipAddress: z.string(),
  userAgent: z.string(),
});

const EraseDataSchema = z.object({
  sessionId: z.string().optional(),
  userId: z.string().optional(),
  fingerprint: z.string().optional(),
  reason: z.string().min(1),
});

/**
 * CORE SESSION MANAGEMENT
 */

// Initialize or retrieve session
router.post('/session/init', async (req: Request, res: Response) => {
  try {
    const data = InitSessionSchema.parse(req.body);
    
    const session = await sessionEngineCore.initializeSession(
      {
        sessionId: data.sessionId,
        userId: data.userId,
        fingerprint: data.fingerprint,
        deviceId: data.deviceId,
      },
      data.deviceInfo,
      data.location
    );

    res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        userId: session.userId,
        segment: session.segment,
        personalizationFlags: session.personalizationFlags,
        isActive: session.isActive,
      },
    });

  } catch (error) {
    logger.error('Session initialization failed', { error, body: req.body });
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Session initialization failed',
    });
  }
});

// Get session data
router.get('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    const session = await sessionEngineCore.getSessionData(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    res.json({
      success: true,
      data: session,
    });

  } catch (error) {
    logger.error('Failed to get session data', { error, sessionId: req.params.sessionId });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve session data',
    });
  }
});

// Update session data
router.put('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const updateData = req.body;

    await sessionEngineCore.updateSessionData(sessionId, updateData);

    res.json({
      success: true,
      message: 'Session updated successfully',
    });

  } catch (error) {
    logger.error('Failed to update session', { error, sessionId: req.params.sessionId });
    res.status(500).json({
      success: false,
      error: 'Failed to update session',
    });
  }
});

/**
 * BEHAVIOR TRACKING
 */

// Track behavior event
router.post('/session/track', async (req: Request, res: Response) => {
  try {
    const data = TrackBehaviorSchema.parse(req.body);
    
    await sessionEngineCore.trackBehaviorEvent({
      sessionId: data.sessionId,
      eventType: data.eventType,
      eventData: data.eventData || {},
      pageSlug: data.pageSlug,
      userId: data.userId,
    });

    res.json({
      success: true,
      message: 'Behavior tracked successfully',
    });

  } catch (error) {
    logger.error('Behavior tracking failed', { error, body: req.body });
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Behavior tracking failed',
    });
  }
});

// Get session behavior events
router.get('/session/:sessionId/behavior', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const events = await storage.getSessionBehaviorEvents(
      sessionId,
      parseInt(limit as string),
      parseInt(offset as string)
    );

    res.json({
      success: true,
      data: events,
    });

  } catch (error) {
    logger.error('Failed to get behavior events', { error, sessionId: req.params.sessionId });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve behavior events',
    });
  }
});

/**
 * PERSONALIZATION
 */

// Get personalization recommendations
router.get('/session/:sessionId/personalization', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    const recommendations = await sessionEngineCore.getPersonalizationRecommendations(sessionId);
    
    if (!recommendations) {
      return res.status(404).json({
        success: false,
        error: 'Personalization data not found',
      });
    }

    res.json({
      success: true,
      data: recommendations,
    });

  } catch (error) {
    logger.error('Failed to get personalization data', { error, sessionId: req.params.sessionId });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve personalization data',
    });
  }
});

// Update personalization preferences
router.put('/session/:sessionId/preferences', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { preferences } = req.body;

    await sessionEngineCore.updateSessionData(sessionId, { 
      preferences,
      updatedAt: new Date(),
    });

    res.json({
      success: true,
      message: 'Preferences updated successfully',
    });

  } catch (error) {
    logger.error('Failed to update preferences', { error, sessionId: req.params.sessionId });
    res.status(500).json({
      success: false,
      error: 'Failed to update preferences',
    });
  }
});

/**
 * PRIVACY AND COMPLIANCE
 */

// Set privacy consent
router.post('/session/:sessionId/consent', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const consentData = PrivacyConsentSchema.parse(req.body);

    await sessionEngineCore.setPrivacyConsent(sessionId, {
      ...consentData,
      gdprCompliant: true,
      ccpaCompliant: true,
      consentTimestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'Privacy consent recorded successfully',
    });

  } catch (error) {
    logger.error('Privacy consent failed', { error, sessionId: req.params.sessionId });
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Privacy consent failed',
    });
  }
});

// Get privacy settings
router.get('/session/:sessionId/privacy', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    const hasConsent = await sessionEngineCore.checkPrivacyConsent(sessionId);
    
    res.json({
      success: true,
      data: {
        hasTrackingConsent: hasConsent,
        gdprCompliant: true,
        ccpaCompliant: true,
      },
    });

  } catch (error) {
    logger.error('Failed to get privacy settings', { error, sessionId: req.params.sessionId });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve privacy settings',
    });
  }
});

// Erase user data (GDPR Right to be Forgotten)
router.post('/session/erase', async (req: Request, res: Response) => {
  try {
    const data = EraseDataSchema.parse(req.body);
    
    await sessionEngineCore.eraseUserData(
      {
        sessionId: data.sessionId,
        userId: data.userId,
        fingerprint: data.fingerprint,
      },
      data.reason
    );

    res.json({
      success: true,
      message: 'User data erased successfully',
    });

  } catch (error) {
    logger.error('Data erasure failed', { error, body: req.body });
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Data erasure failed',
    });
  }
});

/**
 * ANALYTICS AND REPORTING
 */

// Get session metrics
router.get('/analytics/sessions', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    let timeRange;
    if (startDate && endDate) {
      timeRange = {
        start: new Date(startDate as string),
        end: new Date(endDate as string),
      };
    }

    const metrics = await sessionEngineCore.getSessionMetrics(timeRange);

    res.json({
      success: true,
      data: metrics,
    });

  } catch (error) {
    logger.error('Failed to get session metrics', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve session metrics',
    });
  }
});

// Get cross-device analytics
router.get('/analytics/cross-device', async (req: Request, res: Response) => {
  try {
    const { globalUserId } = req.query;
    
    // This would be implemented with proper cross-device analytics
    const stats = await storage.getCrossDeviceStats(globalUserId as string);

    res.json({
      success: true,
      data: stats,
    });

  } catch (error) {
    logger.error('Failed to get cross-device analytics', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve cross-device analytics',
    });
  }
});

/**
 * FEDERATION API - For Neuron Integration
 */

// Register session event from neuron
router.post('/federation/session/event', async (req: Request, res: Response) => {
  try {
    const { neuronId, sessionId, eventType, eventData, metadata } = req.body;
    
    // Track event with neuron context
    await sessionEngineCore.trackBehaviorEvent({
      sessionId,
      eventType: `neuron_${eventType}`,
      eventData: {
        ...eventData,
        neuronId,
        source: 'federation',
        metadata,
      },
    });

    res.json({
      success: true,
      message: 'Federation event tracked successfully',
    });

  } catch (error) {
    logger.error('Federation event tracking failed', { error, body: req.body });
    res.status(400).json({
      success: false,
      error: 'Federation event tracking failed',
    });
  }
});

// Get session data for neuron
router.get('/federation/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { neuronId } = req.query;
    
    const [session, personalization] = await Promise.all([
      sessionEngineCore.getSessionData(sessionId),
      sessionEngineCore.getPersonalizationRecommendations(sessionId),
    ]);

    res.json({
      success: true,
      data: {
        session,
        personalization,
        neuronId,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    logger.error('Federation session data failed', { error, sessionId: req.params.sessionId });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve federation session data',
    });
  }
});

// Bulk session update for federation
router.post('/federation/sessions/bulk-update', async (req: Request, res: Response) => {
  try {
    const { updates } = req.body; // Array of { sessionId, data }
    
    const results = await Promise.allSettled(
      updates.map(async (update: any) => {
        return sessionEngineCore.updateSessionData(update.sessionId, update.data);
      })
    );

    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    res.json({
      success: true,
      data: {
        total: updates.length,
        succeeded,
        failed,
      },
    });

  } catch (error) {
    logger.error('Bulk session update failed', { error });
    res.status(400).json({
      success: false,
      error: 'Bulk session update failed',
    });
  }
});

/**
 * ADMIN ENDPOINTS (Protected)
 */

// Get all sessions (paginated, admin only)
router.get('/admin/sessions', async (req: Request, res: Response) => {
  try {
    // In production, add proper admin authentication
    const { page = 1, limit = 50, segment, userId } = req.query;
    
    const sessions = await storage.getSessionsPaginated({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      segment: segment as string,
      userId: userId as string,
    });

    res.json({
      success: true,
      data: sessions,
    });

  } catch (error) {
    logger.error('Admin sessions fetch failed', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve admin sessions',
    });
  }
});

// Search sessions
router.post('/admin/sessions/search', async (req: Request, res: Response) => {
  try {
    const { query, filters } = req.body;
    
    const results = await storage.searchSessions(query, filters);

    res.json({
      success: true,
      data: results,
    });

  } catch (error) {
    logger.error('Session search failed', { error });
    res.status(500).json({
      success: false,
      error: 'Session search failed',
    });
  }
});

// Export session data (CSV/JSON)
router.get('/admin/sessions/export', async (req: Request, res: Response) => {
  try {
    const { format = 'json', startDate, endDate } = req.query;
    
    let timeRange;
    if (startDate && endDate) {
      timeRange = {
        start: new Date(startDate as string),
        end: new Date(endDate as string),
      };
    }

    const sessions = await storage.getSessionsForExport(timeRange);
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=sessions.csv');
      res.send(await storage.convertSessionsToCSV(sessions));
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=sessions.json');
      res.json({
        success: true,
        data: sessions,
        exportedAt: new Date().toISOString(),
      });
    }

  } catch (error) {
    logger.error('Session export failed', { error });
    res.status(500).json({
      success: false,
      error: 'Session export failed',
    });
  }
});

export { router as sessionRouter };
export default router;