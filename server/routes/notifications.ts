import { Router } from 'express';
import { db } from '../db';
import { notificationEngine, triggerEngine, complianceEngine, lifecycleEngine, offerSyncEngine } from '../services/notifications';
import { 
  notificationTemplates, 
  notificationTriggers, 
  notificationCampaigns,
  notificationQueue,
  notificationAnalytics,
  userNotificationPreferences,
  notificationChannels
} from '../../shared/notificationTables';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';

const router = Router();

// Templates endpoints
router.get('/templates', async (req, res) => {
  try {
    const templates = await db.select().from(notificationTemplates).orderBy(desc(notificationTemplates.createdAt));
    res.json({ success: true, data: { templates } });
  } catch (error) {
    console.error('Failed to get templates:', error);
    res.status(500).json({ success: false, error: 'Failed to get templates' });
  }
});

router.post('/templates', async (req, res) => {
  try {
    const templateData = {
      slug: req.body.slug,
      name: req.body.name,
      description: req.body.description,
      channel: req.body.channel,
      type: req.body.type,
      subject: req.body.subject,
      bodyTemplate: req.body.bodyTemplate,
      htmlTemplate: req.body.htmlTemplate,
      isActive: req.body.isActive || true,
      priority: req.body.priority || 'normal',
      metadata: req.body.metadata || {}
    };

    const template = await db.insert(notificationTemplates).values(templateData).returning();
    res.json({ success: true, data: template[0] });
  } catch (error) {
    console.error('Failed to create template:', error);
    res.status(500).json({ success: false, error: 'Failed to create template' });
  }
});

// Triggers endpoints
router.get('/triggers', async (req, res) => {
  try {
    const triggers = await db.select().from(notificationTriggers).orderBy(desc(notificationTriggers.createdAt));
    res.json({ success: true, data: { triggers } });
  } catch (error) {
    console.error('Failed to get triggers:', error);
    res.status(500).json({ success: false, error: 'Failed to get triggers' });
  }
});

router.post('/triggers', async (req, res) => {
  try {
    const triggerData = {
      slug: req.body.slug,
      name: req.body.name,
      eventName: req.body.eventName,
      triggerType: req.body.triggerType,
      conditions: req.body.conditions || { rules: [], logic: 'AND' },
      channelPriority: req.body.channelPriority || ['email'],
      delay: req.body.delay || 0,
      isActive: req.body.isActive || true,
      metadata: req.body.metadata || {}
    };

    const trigger = await db.insert(notificationTriggers).values(triggerData).returning();
    res.json({ success: true, data: trigger[0] });
  } catch (error) {
    console.error('Failed to create trigger:', error);
    res.status(500).json({ success: false, error: 'Failed to create trigger' });
  }
});

// Campaigns endpoints
router.get('/campaigns', async (req, res) => {
  try {
    const campaigns = await db.select().from(notificationCampaigns).orderBy(desc(notificationCampaigns.createdAt));
    res.json({ success: true, data: { campaigns } });
  } catch (error) {
    console.error('Failed to get campaigns:', error);
    res.status(500).json({ success: false, error: 'Failed to get campaigns' });
  }
});

router.post('/campaigns', async (req, res) => {
  try {
    const campaignData = {
      slug: req.body.slug,
      name: req.body.name,
      type: req.body.type,
      status: req.body.status || 'draft',
      estimatedReach: req.body.estimatedReach || 0,
      metadata: req.body.metadata || {}
    };

    const campaign = await db.insert(notificationCampaigns).values(campaignData).returning();
    res.json({ success: true, data: campaign[0] });
  } catch (error) {
    console.error('Failed to create campaign:', error);
    res.status(500).json({ success: false, error: 'Failed to create campaign' });
  }
});

// Queue endpoints
router.get('/queue', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const notifications = await db.select()
      .from(notificationQueue)
      .orderBy(desc(notificationQueue.createdAt))
      .limit(limit);
    
    res.json({ success: true, data: { notifications } });
  } catch (error) {
    console.error('Failed to get queue:', error);
    res.status(500).json({ success: false, error: 'Failed to get queue' });
  }
});

// Send notification endpoint
router.post('/send', async (req, res) => {
  try {
    const result = await notificationEngine.sendNotification({
      templateSlug: req.body.templateSlug,
      recipientId: req.body.recipientId,
      channel: req.body.channel,
      data: req.body.data || {},
      priority: req.body.priority || 'normal',
      scheduledFor: req.body.scheduledFor ? new Date(req.body.scheduledFor) : undefined
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Failed to send notification:', error);
    res.status(500).json({ success: false, error: 'Failed to send notification' });
  }
});

// Trigger event endpoint
router.post('/trigger-event', async (req, res) => {
  try {
    await triggerEngine.processEvent({
      eventName: req.body.eventName,
      userId: req.body.userId,
      data: req.body.data || {},
      metadata: req.body.metadata || {}
    });

    res.json({ success: true, message: 'Event processed successfully' });
  } catch (error) {
    console.error('Failed to trigger event:', error);
    res.status(500).json({ success: false, error: 'Failed to trigger event' });
  }
});

// Analytics endpoints
router.get('/analytics/summary', async (req, res) => {
  try {
    const analytics = await notificationEngine.getAnalytics({});
    res.json({ success: true, data: analytics });
  } catch (error) {
    console.error('Failed to get analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to get analytics' });
  }
});

router.get('/analytics', async (req, res) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    
    const analytics = await notificationEngine.getAnalytics({
      startDate,
      endDate,
      channel: req.query.channel as string,
      templateSlug: req.query.templateSlug as string
    });
    
    res.json({ success: true, data: analytics });
  } catch (error) {
    console.error('Failed to get detailed analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to get analytics' });
  }
});

// Channels endpoints
router.get('/channels', async (req, res) => {
  try {
    const channels = await db.select().from(notificationChannels).orderBy(notificationChannels.channel);
    res.json({ success: true, data: { channels } });
  } catch (error) {
    console.error('Failed to get channels:', error);
    res.status(500).json({ success: false, error: 'Failed to get channels' });
  }
});

// User preferences endpoints
router.get('/preferences/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const preferences = await db.select()
      .from(userNotificationPreferences)
      .where(eq(userNotificationPreferences.userId, userId));
    
    res.json({ success: true, data: preferences[0] || null });
  } catch (error) {
    console.error('Failed to get user preferences:', error);
    res.status(500).json({ success: false, error: 'Failed to get preferences' });
  }
});

router.put('/preferences/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const preferences = {
      userId,
      emailEnabled: req.body.emailEnabled ?? true,
      smsEnabled: req.body.smsEnabled ?? true,
      pushEnabled: req.body.pushEnabled ?? true,
      inAppEnabled: req.body.inAppEnabled ?? true,
      metadata: req.body.metadata || {}
    };

    const result = await db.insert(userNotificationPreferences)
      .values(preferences)
      .onConflictDoUpdate({
        target: userNotificationPreferences.userId,
        set: preferences
      })
      .returning();

    res.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Failed to update preferences:', error);
    res.status(500).json({ success: false, error: 'Failed to update preferences' });
  }
});

// Opt-out endpoint
router.post('/opt-out', async (req, res) => {
  try {
    await complianceEngine.processOptOut({
      userId: req.body.userId,
      email: req.body.email,
      phone: req.body.phone,
      reason: req.body.reason,
      channels: req.body.channels || ['all'],
      timestamp: new Date(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({ success: true, message: 'Opt-out processed successfully' });
  } catch (error) {
    console.error('Failed to process opt-out:', error);
    res.status(500).json({ success: false, error: 'Failed to process opt-out' });
  }
});

// Consent endpoint
router.post('/consent', async (req, res) => {
  try {
    await complianceEngine.recordConsent({
      userId: req.body.userId,
      consentType: req.body.consentType,
      granted: req.body.granted,
      timestamp: new Date(),
      source: req.body.source,
      ipAddress: req.ip,
      evidence: req.body.evidence || {}
    });

    res.json({ success: true, message: 'Consent recorded successfully' });
  } catch (error) {
    console.error('Failed to record consent:', error);
    res.status(500).json({ success: false, error: 'Failed to record consent' });
  }
});

// Lifecycle journey endpoints
router.post('/journey/start', async (req, res) => {
  try {
    const result = await lifecycleEngine.startJourney(
      req.body.userId,
      req.body.journeyType,
      req.body.metadata || {}
    );

    res.json({ success: true, data: { started: result } });
  } catch (error) {
    console.error('Failed to start journey:', error);
    res.status(500).json({ success: false, error: 'Failed to start journey' });
  }
});

router.get('/journey/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const journeys = await lifecycleEngine.getUserJourneyStatus(userId);
    res.json({ success: true, data: { journeys } });
  } catch (error) {
    console.error('Failed to get journey status:', error);
    res.status(500).json({ success: false, error: 'Failed to get journey status' });
  }
});

// Offer sync endpoints
router.get('/offers/sync-status', async (req, res) => {
  try {
    const status = offerSyncEngine.getSyncStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    console.error('Failed to get sync status:', error);
    res.status(500).json({ success: false, error: 'Failed to get sync status' });
  }
});

router.post('/offers/force-sync', async (req, res) => {
  try {
    await offerSyncEngine.forceSyncOffers();
    res.json({ success: true, message: 'Sync initiated successfully' });
  } catch (error) {
    console.error('Failed to force sync:', error);
    res.status(500).json({ success: false, error: 'Failed to force sync' });
  }
});

export { router as notificationRoutes };