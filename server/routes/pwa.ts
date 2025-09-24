import { Router } from 'express';
import { DatabaseStorage } from '../storage';
import { z } from 'zod';
import webpush from 'web-push';

const router = Router();
const storage = new DatabaseStorage();

// Validation schemas
const subscribeSchema = z.object({
  subscription: z.object({
    endpoint: z.string(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }),
  }),
  topics: z.array(z.string()).optional().default(['general']),
});

const notificationSchema = z.object({
  title: z.string(),
  body: z.string(),
  topics: z.array(z.string()).optional().default(['general']),
  icon: z.string().optional(),
  badge: z.string().optional(),
  requireInteraction: z.boolean().optional().default(false),
  actions: z.array(z.object({
    action: z.string(),
    title: z.string(),
    icon: z.string().optional(),
  })).optional().default([]),
  data: z.any().optional(),
});

const installTrackingSchema = z.object({
  platform: z.enum(['ios', 'android', 'desktop', 'unknown']),
  userAgent: z.string(),
  timestamp: z.number(),
  installSource: z.string().optional().default('unknown'),
  deviceInfo: z.any().optional(),
});

// Configure web-push with proper VAPID keys
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa40HI6DLuYKlOC6M5F1Jjqhe6o9aLBfuD7Kq8TL8dK9BUFo7j3E8BuHjME7qw',
  privateKey: process.env.VAPID_PRIVATE_KEY || 'example-private-key-placeholder-32bytes-long-string'
};

// Only initialize webpush if valid keys are provided
if (process.env.VAPID_PRIVATE_KEY && process.env.VAPID_PUBLIC_KEY) {
  try {
    webpush.setVapidDetails(
      'mailto:admin@findawise.com',
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );
    console.log('✅ Web push configured with VAPID keys');
  } catch (error) {
    console.warn('⚠️ Web push configuration failed:', error.message);
  }
} else {
  console.warn('⚠️ VAPID keys not configured - push notifications disabled');
}

// PWA Installation tracking
router.post('/install', async (req, res) => {
  try {
    const data = installTrackingSchema.parse(req.body);
    
    await storage.trackPWAInstall({
      sessionId: req.sessionID,
      platform: data.platform,
      userAgent: data.userAgent,
      installSource: data.installSource,
      deviceInfo: data.deviceInfo,
      installedAt: new Date(data.timestamp),
    });

    res.json({ 
      success: true, 
      message: 'Installation tracked successfully' 
    });
  } catch (error) {
    console.error('PWA install tracking error:', error);
    res.status(400).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Push subscription management
router.post('/subscribe', async (req, res) => {
  try {
    const { subscription, topics } = subscribeSchema.parse(req.body);
    
    const subscriptionData = {
      sessionId: req.sessionID,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      topics: topics || ['general'],
      isActive: true,
    };

    await storage.savePushSubscription(subscriptionData);

    res.json({ 
      success: true, 
      message: 'Subscription saved successfully',
      topics: topics 
    });
  } catch (error) {
    console.error('Push subscription error:', error);
    res.status(400).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Unsubscribe from push notifications
router.post('/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;
    
    if (!endpoint) {
      return res.status(400).json({ 
        success: false, 
        error: 'Endpoint is required' 
      });
    }

    await storage.removePushSubscription(endpoint);

    res.json({ 
      success: true, 
      message: 'Unsubscribed successfully' 
    });
  } catch (error) {
    console.error('Push unsubscribe error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Send push notification
router.post('/notify', async (req, res) => {
  try {
    const notificationData = notificationSchema.parse(req.body);
    
    // Get subscriptions for the specified topics
    const subscriptions = await storage.getPushSubscriptions(notificationData.topics);
    
    if (subscriptions.length === 0) {
      return res.json({ 
        success: true, 
        message: 'No subscriptions found for specified topics',
        delivered: 0 
      });
    }

    // Create notification campaign record
    const campaign = await storage.createNotificationCampaign({
      title: notificationData.title,
      body: notificationData.body,
      topics: notificationData.topics,
      targetedUsers: subscriptions.length,
      status: 'sending',
      metadata: {
        icon: notificationData.icon,
        badge: notificationData.badge,
        requireInteraction: notificationData.requireInteraction,
        actions: notificationData.actions,
        data: notificationData.data,
      },
    });

    // Send notifications
    let deliveredCount = 0;
    let clickedCount = 0;

    const notificationPromises = subscriptions.map(async (subscription) => {
      try {
        const payload = JSON.stringify({
          title: notificationData.title,
          body: notificationData.body,
          icon: notificationData.icon || '/icons/icon-192x192.png',
          badge: notificationData.badge || '/icons/badge-72x72.png',
          requireInteraction: notificationData.requireInteraction,
          actions: notificationData.actions,
          data: notificationData.data,
          tag: `campaign-${campaign.id}`,
        });

        await webpush.sendNotification({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        }, payload);

        deliveredCount++;
        return { success: true, subscription: subscription.id };
      } catch (error) {
        console.error('Failed to send notification:', error);
        
        // Remove invalid subscriptions
        if (error.statusCode === 410 || error.statusCode === 404) {
          await storage.removePushSubscription(subscription.endpoint);
        }
        
        return { success: false, subscription: subscription.id, error };
      }
    });

    await Promise.all(notificationPromises);

    // Update campaign status
    await storage.updateNotificationCampaign(campaign.id, {
      deliveredCount,
      clickedCount,
      status: 'completed',
      completedAt: new Date(),
    });

    res.json({ 
      success: true, 
      message: 'Notifications sent',
      campaignId: campaign.id,
      targeted: subscriptions.length,
      delivered: deliveredCount 
    });
  } catch (error) {
    console.error('Push notification error:', error);
    res.status(400).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Get VAPID public key
router.get('/vapid-key', (req, res) => {
  res.json({ 
    publicKey: vapidKeys.publicKey 
  });
});

// PWA configuration
router.get('/config', async (req, res) => {
  try {
    const config = await storage.getPWAConfig();
    
    const defaultConfig = {
      notificationTopics: ['general', 'offers', 'security', 'updates'],
      cacheStrategy: 'networkFirst',
      offlinePages: [
        '/',
        '/finance',
        '/health',
        '/saas',
        '/travel',
        '/offline.html'
      ],
      installPromptConfig: {
        deferDays: 3,
        maxPrompts: 3,
        requireEngagement: true,
        engagementThreshold: 5
      },
      features: {
        backgroundSync: true,
        pushNotifications: true,
        offlineSupport: true,
        installPrompt: true,
        shareTarget: true,
        shortcuts: true
      }
    };

    res.json({ 
      success: true, 
      config: config || defaultConfig 
    });
  } catch (error) {
    console.error('PWA config error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Update PWA configuration
router.put('/config', async (req, res) => {
  try {
    const config = req.body;
    
    await storage.updatePWAConfig(config);
    
    res.json({ 
      success: true, 
      message: 'PWA configuration updated' 
    });
  } catch (error) {
    console.error('PWA config update error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// PWA usage analytics
router.post('/analytics', async (req, res) => {
  try {
    const analyticsData = {
      sessionId: req.sessionID,
      isStandalone: req.body.isStandalone || false,
      isOffline: req.body.isOffline || false,
      pageViews: req.body.pageViews || 0,
      sessionDuration: req.body.sessionDuration || 0,
      featuresUsed: req.body.featuresUsed || [],
      errors: req.body.errors || [],
      performance: req.body.performance || {},
      metadata: req.body.metadata || {},
    };

    await storage.trackPWAUsage(analyticsData);

    res.json({ 
      success: true, 
      message: 'Analytics data recorded' 
    });
  } catch (error) {
    console.error('PWA analytics error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Get PWA statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await storage.getPWAStatistics();
    
    res.json({ 
      success: true, 
      stats 
    });
  } catch (error) {
    console.error('PWA stats error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Offline queue management
router.post('/queue', async (req, res) => {
  try {
    const queueData = {
      sessionId: req.sessionID,
      action: req.body.action,
      endpoint: req.body.endpoint,
      method: req.body.method || 'POST',
      data: req.body.data,
      status: 'pending',
      retryCount: 0,
      maxRetries: req.body.maxRetries || 3,
      metadata: req.body.metadata || {},
    };

    const queueItem = await storage.addToOfflineQueue(queueData);

    res.json({ 
      success: true, 
      message: 'Added to offline queue',
      queueId: queueItem.id 
    });
  } catch (error) {
    console.error('Offline queue error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Process offline queue
router.post('/queue/process', async (req, res) => {
  try {
    const pendingItems = await storage.getPendingOfflineQueue();
    let processedCount = 0;
    let failedCount = 0;

    for (const item of pendingItems) {
      try {
        // Attempt to process the queued item
        const response = await fetch(item.endpoint, {
          method: item.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(item.data),
        });

        if (response.ok) {
          await storage.updateOfflineQueueItem(item.id, {
            status: 'completed',
            processedAt: new Date(),
          });
          processedCount++;
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        const retryCount = item.retryCount + 1;
        
        if (retryCount >= item.maxRetries) {
          await storage.updateOfflineQueueItem(item.id, {
            status: 'failed',
            retryCount,
            processedAt: new Date(),
          });
          failedCount++;
        } else {
          await storage.updateOfflineQueueItem(item.id, {
            status: 'pending',
            retryCount,
          });
        }
      }
    }

    res.json({ 
      success: true, 
      processed: processedCount,
      failed: failedCount,
      total: pendingItems.length 
    });
  } catch (error) {
    console.error('Queue processing error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Share target handler
router.get('/share', (req, res) => {
  const { title, text, url } = req.query;
  
  // Handle shared content
  const shareData = {
    title: title as string,
    text: text as string,
    url: url as string,
  };
  
  // Redirect to the main app with share data
  const params = new URLSearchParams();
  if (shareData.title) params.set('shared_title', shareData.title);
  if (shareData.text) params.set('shared_text', shareData.text);
  if (shareData.url) params.set('shared_url', shareData.url);
  
  res.redirect(`/?${params.toString()}`);
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    features: {
      pushNotifications: !!process.env.VAPID_PRIVATE_KEY,
      webPush: true,
      offlineSupport: true,
      backgroundSync: true,
    }
  });
});

export default router;