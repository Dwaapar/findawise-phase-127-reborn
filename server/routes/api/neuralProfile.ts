/**
 * Neural User Profile System - API Routes
 * Empire-Grade Cross-Device Neural Profile Management
 */

import { Router, Request, Response } from 'express';
import { SessionEngineCore } from '../../services/session/sessionEngineCore';
import { logger } from '../../utils/logger';
import { z } from 'zod';

// Simple auth middleware for demo - replace with actual JWT auth in production
const authenticateJWT = (req: any, res: any, next: any) => {
  // For now, allow all requests - implement proper JWT validation here
  req.user = { id: req.headers['x-user-id'] || 'anonymous' };
  next();
};

const router = Router();
const sessionEngine = SessionEngineCore.getInstance();

// Request validation schemas
const CreateProfileSchema = z.object({
  deviceInfo: z.object({
    userAgent: z.string(),
    browser: z.string().optional(),
    os: z.string().optional(),
    screenResolution: z.string().optional(),
    fingerprint: z.string().optional()
  }),
  location: z.object({
    country: z.string().optional(),
    region: z.string().optional(),
    city: z.string().optional()
  }).optional()
});

const UpdateArchetypeSchema = z.object({
  archetype: z.string(),
  confidence: z.number().min(0).max(100),
  trigger: z.string()
});

const RecordActivitySchema = z.object({
  eventType: z.enum(['pageview', 'scroll', 'click', 'form_submit', 'quiz_complete', 'purchase', 'download', 'share']),
  eventData: z.record(z.any()),
  engagementScore: z.number().min(0).max(100),
  context: z.string(),
  neuronId: z.string().optional()
});

const RecordConversionSchema = z.object({
  eventType: z.enum(['purchase', 'signup', 'download', 'subscription', 'lead_capture']),
  value: z.number().min(0),
  currency: z.string(),
  productId: z.string().optional(),
  attribution: z.object({
    source: z.string(),
    medium: z.string(),
    campaign: z.string().optional(),
    referrer: z.string().optional(),
    landingPage: z.string(),
    touchpoints: z.array(z.any())
  })
});

/**
 * CREATE NEURAL PROFILE
 * POST /api/neural-profile/create
 */
router.post('/create', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { deviceInfo, location } = CreateProfileSchema.parse(req.body);
    const sessionId = req.headers['x-session-id'] as string || `session_${Date.now()}`;
    const userId = req.user?.id || sessionId;

    const profile = await sessionEngine.createNeuralProfile(
      { sessionId, userId },
      deviceInfo,
      location
    );

    logger.info('Neural profile created via API', { userId, sessionId });

    res.status(201).json({
      success: true,
      data: {
        userId: profile.userId,
        neuralScore: profile.neuralScore,
        primaryArchetype: profile.userArchetype.primaryArchetype,
        deviceCount: profile.deviceList.length,
        lastSeen: profile.lastSeen
      }
    });

  } catch (error) {
    logger.error('Failed to create neural profile', { error });
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Profile creation failed'
    });
  }
});

/**
 * GET NEURAL PROFILE
 * GET /api/neural-profile/:userId
 */
router.get('/:userId', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const profile = await sessionEngine.getNeuralProfile(userId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Neural profile not found'
      });
    }

    res.json({
      success: true,
      data: profile
    });

  } catch (error) {
    logger.error('Failed to get neural profile', { error, userId: req.params.userId });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve profile'
    });
  }
});

/**
 * UPDATE ARCHETYPE
 * POST /api/neural-profile/:userId/archetype
 */
router.post('/:userId/archetype', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { archetype, confidence, trigger } = UpdateArchetypeSchema.parse(req.body);

    await sessionEngine.updateArchetype(userId, archetype, confidence, trigger);

    res.json({
      success: true,
      message: 'Archetype updated successfully'
    });

  } catch (error) {
    logger.error('Failed to update archetype', { error, userId: req.params.userId });
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Archetype update failed'
    });
  }
});

/**
 * RECORD ACTIVITY
 * POST /api/neural-profile/:userId/activity
 */
router.post('/:userId/activity', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const activity = RecordActivitySchema.parse(req.body);

    await sessionEngine.recordActivity(userId, activity);

    res.json({
      success: true,
      message: 'Activity recorded successfully'
    });

  } catch (error) {
    logger.error('Failed to record activity', { error, userId: req.params.userId });
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Activity recording failed'
    });
  }
});

/**
 * RECORD CONVERSION
 * POST /api/neural-profile/:userId/conversion
 */
router.post('/:userId/conversion', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const conversion = RecordConversionSchema.parse(req.body);

    await sessionEngine.recordConversion(userId, conversion);

    res.json({
      success: true,
      message: 'Conversion recorded successfully'
    });

  } catch (error) {
    logger.error('Failed to record conversion', { error, userId: req.params.userId });
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Conversion recording failed'
    });
  }
});

/**
 * ENABLE CROSS-DEVICE SYNC
 * POST /api/neural-profile/:userId/sync/enable
 */
router.post('/:userId/sync/enable', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    await sessionEngine.enableCrossDeviceSync(userId);

    res.json({
      success: true,
      message: 'Cross-device sync enabled'
    });

  } catch (error) {
    logger.error('Failed to enable cross-device sync', { error, userId: req.params.userId });
    res.status(500).json({
      success: false,
      error: 'Failed to enable sync'
    });
  }
});

/**
 * SYNC PROFILE ACROSS DEVICES
 * POST /api/neural-profile/:userId/sync/:deviceId
 */
router.post('/:userId/sync/:deviceId', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { userId, deviceId } = req.params;
    await sessionEngine.syncProfileAcrossDevices(userId, deviceId);

    res.json({
      success: true,
      message: 'Profile synced across devices'
    });

  } catch (error) {
    logger.error('Failed to sync profile across devices', { error, userId: req.params.userId });
    res.status(500).json({
      success: false,
      error: 'Profile sync failed'
    });
  }
});

/**
 * GET USER ANALYTICS
 * GET /api/neural-profile/:userId/analytics
 */
router.get('/:userId/analytics', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const analytics = await sessionEngine.getUserAnalytics(userId);

    if (!analytics) {
      return res.status(404).json({
        success: false,
        error: 'Analytics not found'
      });
    }

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    logger.error('Failed to get user analytics', { error, userId: req.params.userId });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve analytics'
    });
  }
});

/**
 * EXPORT USER PROFILE
 * GET /api/neural-profile/:userId/export
 */
router.get('/:userId/export', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const profile = await sessionEngine.exportUserProfile(userId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found for export'
      });
    }

    res.json({
      success: true,
      data: profile,
      exportedAt: new Date(),
      format: 'json'
    });

  } catch (error) {
    logger.error('Failed to export user profile', { error, userId: req.params.userId });
    res.status(500).json({
      success: false,
      error: 'Profile export failed'
    });
  }
});

/**
 * GET ALL NEURAL PROFILES (Admin)
 * GET /api/neural-profile/admin/profiles
 */
router.get('/admin/profiles', authenticateJWT, async (req: Request, res: Response) => {
  try {
    // Add admin check here if needed
    const profiles = await sessionEngine.getAllNeuralProfiles();
    const count = await sessionEngine.getNeuralProfilesCount();

    res.json({
      success: true,
      data: {
        profiles: profiles.slice(0, 100), // Limit to first 100 for performance
        totalCount: count,
        showing: Math.min(100, profiles.length)
      }
    });

  } catch (error) {
    logger.error('Failed to get all neural profiles', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve profiles'
    });
  }
});

/**
 * GET SYSTEM STATS (Admin)
 * GET /api/neural-profile/admin/stats
 */
router.get('/admin/stats', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const stats = await sessionEngine.getSystemStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Failed to get system stats', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve stats'
    });
  }
});

export default router;