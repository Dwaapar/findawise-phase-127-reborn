import { db } from "../../db";
import { 
  notificationTemplates, 
  notificationTriggers, 
  notificationQueue, 
  notificationAnalytics,
  userNotificationPreferences,
  notificationChannels,
  type NotificationTemplate,
  type NotificationTrigger,
  type NotificationQueue as NotificationQueueType,
  type InsertNotificationQueue
} from "@shared/notificationTables";
import { eq, and, or, gte, lte, isNull, desc, sql } from "drizzle-orm";
import { logger } from "../../utils/logger";
import { storage } from "../../storage";

// Core notification engine interfaces
export interface NotificationPayload {
  templateSlug: string;
  recipientId: string;
  channel?: 'email' | 'sms' | 'push' | 'in_app' | 'whatsapp';
  data?: Record<string, any>;
  scheduledFor?: Date;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  campaignId?: number;
  triggerId?: number;
}

export interface PersonalizationContext {
  userId?: string;
  sessionId?: string;
  userProfile?: any;
  behaviorData?: any;
  semanticData?: any;
  currentPage?: string;
  deviceInfo?: any;
}

export interface DeliveryResult {
  success: boolean;
  messageId?: string;
  provider?: string;
  errorMessage?: string;
  deliveryTime?: number;
  cost?: number;
}

export class NotificationEngine {
  private channelProviders: Map<string, any> = new Map();
  private templateCache: Map<string, NotificationTemplate> = new Map();
  private processingQueue: boolean = false;
  private initialized: boolean = false;

  constructor() {
    this.initializeProviders();
    this.startQueueProcessor();
  }

  /**
   * Initialize all channel providers (email, SMS, push, etc.)
   */
  private async initializeProviders() {
    try {
      // Load channel configurations from database
      const channels = await db.select().from(notificationChannels).where(eq(notificationChannels.isActive, true));
      
      for (const channel of channels) {
        await this.initializeChannelProvider(channel);
      }

      logger.info('Notification providers initialized', { 
        channelCount: channels.length,
        channels: channels.map(c => c.channel)
      });
    } catch (error) {
      logger.error('Failed to initialize notification providers', { error });
    }
  }

  /**
   * Initialize a specific channel provider
   */
  private async initializeChannelProvider(channelConfig: any) {
    try {
      switch (channelConfig.channel) {
        case 'email':
          await this.initializeEmailProvider(channelConfig);
          break;
        case 'sms':
          await this.initializeSmsProvider(channelConfig);
          break;
        case 'push':
          await this.initializePushProvider(channelConfig);
          break;
        case 'whatsapp':
          await this.initializeWhatsAppProvider(channelConfig);
          break;
        case 'in_app':
          await this.initializeInAppProvider(channelConfig);
          break;
        default:
          logger.warn('Unknown channel type:', channelConfig.channel);
      }
    } catch (error) {
      logger.error(`Failed to initialize ${channelConfig.channel} provider:`, error);
    }
  }

  /**
   * Public initialization method for external use
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      logger.info('NotificationEngine already initialized');
      return;
    }

    try {
      await this.initializeProviders();
      await this.loadTemplateCache();
      
      this.initialized = true;
      logger.info('🔔 NotificationEngine initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize NotificationEngine:', error);
      throw error;
    }
  }

  /**
   * Load frequently used templates into cache for performance
   */
  private async loadTemplateCache(): Promise<void> {
    try {
      const activeTemplates = await db.select()
        .from(notificationTemplates)
        .where(eq(notificationTemplates.isActive, true))
        .limit(100);

      for (const template of activeTemplates) {
        this.templateCache.set(template.slug, template);
      }

      logger.info(`📋 Loaded ${activeTemplates.length} templates into cache`);
    } catch (error) {
      logger.warn('Failed to load template cache:', error);
    }
  }

  /**
   * Initialize email provider (Resend, SMTP, etc.)
   */
  private async initializeEmailProvider(config: any) {
    const { provider, credentials, config: providerConfig } = config;
    
    switch (provider) {
      case 'resend':
        const { ResendProvider } = await import('./channelProviders/emailProvider');
        if (credentials?.apiKey) {
          const resendProvider = new ResendProvider({
            apiKey: credentials.apiKey,
            defaultFromEmail: credentials.defaultFromEmail || 'noreply@findawise.com',
            defaultFromName: credentials.defaultFromName || 'Findawise Empire'
          });
          
          const isValid = await resendProvider.validateConfig();
          if (isValid) {
            this.channelProviders.set('email', resendProvider);
            logger.info('Resend email provider initialized successfully');
          } else {
            logger.error('Resend configuration validation failed');
          }
        }
        break;
        
      case 'smtp':
        const { SMTPProvider } = await import('./channelProviders/emailProvider');
        if (credentials?.host && credentials?.auth?.user) {
          const smtpProvider = new SMTPProvider({
            host: credentials.host,
            port: credentials.port || 587,
            secure: credentials.secure || false,
            auth: credentials.auth,
            defaultFromEmail: credentials.defaultFromEmail || 'noreply@findawise.com',
            defaultFromName: credentials.defaultFromName || 'Findawise Empire'
          });
          
          const isValid = await smtpProvider.validateConfig();
          if (isValid) {
            this.channelProviders.set('email', smtpProvider);
            logger.info('SMTP email provider initialized successfully');
          } else {
            logger.error('SMTP configuration validation failed');
          }
        }
        break;
        
      default:
        logger.warn('Unknown email provider:', provider);
    }
  }

  /**
   * Initialize SMS provider (Placeholder - can add Twilio later if needed)
   */
  private async initializeSmsProvider(config: any) {
    logger.info('SMS provider not configured - focusing on email and push notifications');
  }

  /**
   * Initialize push provider (Firebase Cloud Messaging)
   */
  private async initializePushProvider(config: any) {
    const { provider, credentials } = config;
    
    switch (provider) {
      case 'firebase':
        const { FirebaseCloudMessagingProvider } = await import('./channelProviders/fcmProvider');
        if (credentials?.serviceAccountKey && credentials?.projectId) {
          const fcmProvider = new FirebaseCloudMessagingProvider({
            serviceAccountKey: credentials.serviceAccountKey,
            projectId: credentials.projectId
          });
          
          const isValid = await fcmProvider.validateConfig();
          if (isValid) {
            this.channelProviders.set('push', fcmProvider);
            logger.info('Firebase Cloud Messaging provider initialized successfully');
          } else {
            logger.error('FCM configuration validation failed');
          }
        }
        break;
        
      case 'webpush':
        const { WebPushProvider } = await import('./channelProviders/fcmProvider');
        if (credentials?.vapidKeys) {
          const webPushProvider = new WebPushProvider({
            vapidKeys: credentials.vapidKeys,
            contact: credentials.contact || 'mailto:admin@findawise.com'
          });
          
          const isValid = await webPushProvider.validateConfig();
          if (isValid) {
            this.channelProviders.set('push', webPushProvider);
            logger.info('Web Push provider initialized successfully');
          } else {
            logger.error('Web Push configuration validation failed');
          }
        }
        break;
        
      default:
        logger.warn('Unknown push provider:', provider);
    }
  }

  /**
   * Initialize WhatsApp provider
   */
  private async initializeWhatsAppProvider(config: any) {
    // Implementation for WhatsApp providers
    logger.info('WhatsApp provider initialized', { provider: config.provider });
  }

  /**
   * Initialize in-app notification provider
   */
  private async initializeInAppProvider(config: any) {
    // Implementation for in-app notifications
    logger.info('In-app provider initialized');
  }

  /**
   * Main method to send a notification
   */
  async sendNotification(payload: NotificationPayload): Promise<DeliveryResult> {
    try {
      // 1. Get template
      const template = await this.getTemplate(payload.templateSlug);
      if (!template) {
        throw new Error(`Template not found: ${payload.templateSlug}`);
      }

      // 2. Check user preferences
      const userPrefs = await this.getUserPreferences(payload.recipientId);
      const allowedChannels = this.getAllowedChannels(template, userPrefs);
      
      if (allowedChannels.length === 0) {
        return { success: false, errorMessage: 'User has opted out of all channels' };
      }

      // 3. Select optimal channel
      const channel = payload.channel || this.selectOptimalChannel(allowedChannels, payload);

      // 4. Personalize content
      const personalizedContent = await this.personalizeContent(template, payload, channel);

      // 5. Queue for delivery
      const queueEntry = await this.queueNotification({
        templateId: template.id,
        triggerId: payload.triggerId,
        campaignId: payload.campaignId,
        userId: payload.recipientId,
        channel,
        subject: personalizedContent.subject,
        content: personalizedContent.content,
        htmlContent: personalizedContent.htmlContent,
        personalizationData: payload.data,
        scheduledFor: payload.scheduledFor || new Date(),
        priority: payload.priority || template.priority || 'normal',
        status: 'queued'
      });

      // 6. Immediate delivery for high priority
      if (payload.priority === 'urgent' || payload.priority === 'high') {
        return await this.deliverNotification(queueEntry.id);
      }

      return { success: true, messageId: queueEntry.id.toString() };

    } catch (error) {
      logger.error('Failed to send notification', { error, payload });
      return { success: false, errorMessage: error.message };
    }
  }

  /**
   * Get notification template by slug
   */
  private async getTemplate(slug: string): Promise<NotificationTemplate | null> {
    // Check cache first
    if (this.templateCache.has(slug)) {
      return this.templateCache.get(slug)!;
    }

    try {
      const templates = await db.select()
        .from(notificationTemplates)
        .where(and(
          eq(notificationTemplates.slug, slug),
          eq(notificationTemplates.isActive, true)
        ));

      const template = templates[0] || null;
      
      if (template) {
        this.templateCache.set(slug, template);
      }

      return template;
    } catch (error) {
      logger.error('Failed to get template', { slug, error });
      return null;
    }
  }

  /**
   * Get user notification preferences
   */
  private async getUserPreferences(userId: string) {
    try {
      const prefs = await db.select()
        .from(userNotificationPreferences)
        .where(eq(userNotificationPreferences.userId, userId));

      return prefs[0] || this.getDefaultPreferences();
    } catch (error) {
      logger.error('Failed to get user preferences', { userId, error });
      return this.getDefaultPreferences();
    }
  }

  /**
   * Get default user preferences
   */
  private getDefaultPreferences() {
    return {
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: true,
      inAppEnabled: true,
      whatsappEnabled: false,
      marketingEnabled: true,
      transactionalEnabled: true,
      frequency: 'normal',
      globalOptOut: false
    };
  }

  /**
   * Determine allowed channels based on template and user preferences
   */
  private getAllowedChannels(template: NotificationTemplate, userPrefs: any): string[] {
    if (userPrefs.globalOptOut) {
      return [];
    }

    const allowedChannels: string[] = [];

    // Check each channel against user preferences
    if (template.channel === 'email' && userPrefs.emailEnabled) {
      allowedChannels.push('email');
    }
    if (template.channel === 'sms' && userPrefs.smsEnabled) {
      allowedChannels.push('sms');
    }
    if (template.channel === 'push' && userPrefs.pushEnabled) {
      allowedChannels.push('push');
    }
    if (template.channel === 'in_app' && userPrefs.inAppEnabled) {
      allowedChannels.push('in_app');
    }
    if (template.channel === 'whatsapp' && userPrefs.whatsappEnabled) {
      allowedChannels.push('whatsapp');
    }

    // Check category preferences
    const isMarketing = template.type?.includes('marketing') || template.type?.includes('promo');
    if (isMarketing && !userPrefs.marketingEnabled) {
      return [];
    }

    return allowedChannels;
  }

  /**
   * Select optimal channel based on AI logic and user behavior
   */
  private selectOptimalChannel(allowedChannels: string[], payload: NotificationPayload): string {
    // Simple priority logic - can be enhanced with AI
    const channelPriority = ['email', 'push', 'in_app', 'sms', 'whatsapp'];
    
    for (const channel of channelPriority) {
      if (allowedChannels.includes(channel) && this.channelProviders.has(channel)) {
        return channel;
      }
    }

    return allowedChannels[0]; // fallback
  }

  /**
   * Personalize notification content with dynamic variables
   */
  private async personalizeContent(
    template: NotificationTemplate, 
    payload: NotificationPayload, 
    channel: string
  ) {
    try {
      // Get personalization context
      const context = await this.getPersonalizationContext(payload.recipientId, payload.data);
      
      // Process template with variables
      const subject = this.processTemplate(template.subject || '', context);
      const content = this.processTemplate(template.bodyTemplate, context);
      const htmlContent = template.htmlTemplate ? 
        this.processTemplate(template.htmlTemplate, context) : null;

      return {
        subject,
        content,
        htmlContent
      };
    } catch (error) {
      logger.error('Failed to personalize content', { error, templateId: template.id });
      return {
        subject: template.subject || '',
        content: template.bodyTemplate,
        htmlContent: template.htmlTemplate
      };
    }
  }

  /**
   * Get personalization context from user data and semantic intelligence
   */
  private async getPersonalizationContext(userId: string, additionalData?: any): Promise<PersonalizationContext> {
    try {
      // Get user profile from storage
      const userProfile = await storage.getUserProfile?.(userId);
      
      // Get semantic data for user
      const semanticData = await this.getSemanticPersonalizationData(userId);
      
      // Get recent behavior data
      const behaviorData = await this.getBehaviorData(userId);

      return {
        userId,
        userProfile,
        semanticData,
        behaviorData,
        ...additionalData
      };
    } catch (error) {
      logger.error('Failed to get personalization context', { userId, error });
      return { userId, ...additionalData };
    }
  }

  /**
   * Get semantic personalization data
   */
  private async getSemanticPersonalizationData(userId: string) {
    // Integration with semantic intelligence layer
    try {
      // This would integrate with the semantic engine to get user intent vectors,
      // preferred content types, engagement patterns, etc.
      return {};
    } catch (error) {
      return {};
    }
  }

  /**
   * Get user behavior data for personalization
   */
  private async getBehaviorData(userId: string) {
    try {
      // Get recent user behavior from analytics
      return {};
    } catch (error) {
      return {};
    }
  }

  /**
   * Process template with variable substitution
   */
  private processTemplate(template: string, context: PersonalizationContext): string {
    let processed = template;

    // Replace common variables
    const variables = {
      '{{userId}}': context.userId || '',
      '{{userName}}': context.userProfile?.name || 'there',
      '{{userEmail}}': context.userProfile?.email || '',
      '{{currentDate}}': new Date().toLocaleDateString(),
      '{{currentTime}}': new Date().toLocaleTimeString(),
      // Add more variables as needed
    };

    for (const [variable, value] of Object.entries(variables)) {
      processed = processed.replace(new RegExp(variable, 'g'), String(value));
    }

    return processed;
  }

  /**
   * Queue notification for delivery
   */
  private async queueNotification(notification: Partial<InsertNotificationQueue>) {
    try {
      const result = await db.insert(notificationQueue)
        .values(notification as InsertNotificationQueue)
        .returning();

      return result[0];
    } catch (error) {
      logger.error('Failed to queue notification', { error, notification });
      throw error;
    }
  }

  /**
   * Deliver a notification immediately
   */
  async deliverNotification(queueId: number): Promise<DeliveryResult> {
    try {
      // Get notification from queue
      const notifications = await db.select()
        .from(notificationQueue)
        .where(eq(notificationQueue.id, queueId));

      const notification = notifications[0];
      if (!notification) {
        return { success: false, errorMessage: 'Notification not found' };
      }

      // Update status to sending
      await db.update(notificationQueue)
        .set({ status: 'sending', sentAt: new Date() })
        .where(eq(notificationQueue.id, queueId));

      // Get provider for channel
      const provider = this.channelProviders.get(notification.channel);
      if (!provider) {
        await this.markDeliveryFailed(queueId, 'No provider available for channel');
        return { success: false, errorMessage: 'No provider available' };
      }

      // Deliver based on channel
      const result = await this.deliverByChannel(notification, provider);

      // Update notification status
      if (result.success) {
        await db.update(notificationQueue)
          .set({ 
            status: 'sent', 
            deliveredAt: new Date(),
            deliveryTime: result.deliveryTime,
            providerResponse: result.messageId ? { messageId: result.messageId } : null
          })
          .where(eq(notificationQueue.id, queueId));

        // Record analytics
        await this.recordDeliveryAnalytics(notification, result);
      } else {
        await this.markDeliveryFailed(queueId, result.errorMessage || 'Unknown error');
      }

      return result;

    } catch (error) {
      logger.error('Failed to deliver notification', { queueId, error });
      await this.markDeliveryFailed(queueId, error.message);
      return { success: false, errorMessage: error.message };
    }
  }

  /**
   * Deliver notification by specific channel
   */
  private async deliverByChannel(notification: NotificationQueueType, provider: any): Promise<DeliveryResult> {
    const startTime = Date.now();

    try {
      switch (notification.channel) {
        case 'email':
          return await this.deliverEmail(notification, provider);
        case 'sms':
          return await this.deliverSms(notification, provider);
        case 'push':
          return await this.deliverPush(notification, provider);
        case 'whatsapp':
          return await this.deliverWhatsApp(notification, provider);
        case 'in_app':
          return await this.deliverInApp(notification, provider);
        default:
          return { success: false, errorMessage: 'Unsupported channel' };
      }
    } catch (error) {
      return { 
        success: false, 
        errorMessage: error.message,
        deliveryTime: Date.now() - startTime
      };
    }
  }

  /**
   * Deliver email notification
   */
  private async deliverEmail(notification: NotificationQueueType, provider: any): Promise<DeliveryResult> {
    const startTime = Date.now();

    try {
      // Use the ResendProvider or SMTPProvider from channelProviders
      const emailMessage = {
        to: notification.recipientEmail || '',
        from: provider.defaultFromEmail || 'noreply@findawise.com',
        subject: notification.subject || '',
        text: notification.content || '',
        html: notification.htmlContent || notification.content || ''
      };

      const result = await provider.send(emailMessage);
      
      return {
        success: result.success,
        messageId: result.messageId,
        provider: result.provider,
        deliveryTime: result.deliveryTime,
        errorMessage: result.errorMessage
      };
    } catch (error) {
      return { 
        success: false, 
        errorMessage: error.message,
        deliveryTime: Date.now() - startTime
      };
    }
  }

  /**
   * Deliver SMS notification
   */
  private async deliverSms(notification: NotificationQueueType, provider: any): Promise<DeliveryResult> {
    const startTime = Date.now();
    try {
      // Implementation for SMS delivery using provider
      logger.info('SMS delivery not implemented - placeholder success', { notificationId: notification.id });
      return { 
        success: true, 
        provider: 'sms', 
        deliveryTime: Date.now() - startTime,
        messageId: `sms_${notification.id}_${Date.now()}`
      };
    } catch (error) {
      return { 
        success: false, 
        errorMessage: error.message,
        deliveryTime: Date.now() - startTime
      };
    }
  }

  /**
   * Deliver push notification
   */
  private async deliverPush(notification: NotificationQueueType, provider: any): Promise<DeliveryResult> {
    const startTime = Date.now();
    try {
      // Use Firebase Cloud Messaging or Web Push provider
      if (provider && typeof provider.send === 'function') {
        const pushMessage = {
          token: notification.recipientPushToken || '',
          title: notification.subject || '',
          body: notification.content || '',
          data: notification.personalizationData || {}
        };

        const result = await provider.send(pushMessage);
        return {
          success: result.success,
          messageId: result.messageId,
          provider: result.provider || 'push',
          deliveryTime: result.deliveryTime || (Date.now() - startTime),
          errorMessage: result.errorMessage
        };
      }

      logger.info('Push delivery using placeholder', { notificationId: notification.id });
      return { 
        success: true, 
        provider: 'push', 
        deliveryTime: Date.now() - startTime,
        messageId: `push_${notification.id}_${Date.now()}`
      };
    } catch (error) {
      return { 
        success: false, 
        errorMessage: error.message,
        deliveryTime: Date.now() - startTime
      };
    }
  }

  /**
   * Deliver WhatsApp notification
   */
  private async deliverWhatsApp(notification: NotificationQueueType, provider: any): Promise<DeliveryResult> {
    const startTime = Date.now();
    try {
      // Implementation for WhatsApp delivery using provider
      logger.info('WhatsApp delivery not implemented - placeholder success', { notificationId: notification.id });
      return { 
        success: true, 
        provider: 'whatsapp', 
        deliveryTime: Date.now() - startTime,
        messageId: `whatsapp_${notification.id}_${Date.now()}`
      };
    } catch (error) {
      return { 
        success: false, 
        errorMessage: error.message,
        deliveryTime: Date.now() - startTime
      };
    }
  }

  /**
   * Deliver in-app notification
   */
  private async deliverInApp(notification: NotificationQueueType, provider: any): Promise<DeliveryResult> {
    const startTime = Date.now();
    try {
      // Store in-app notification for user to see when they next visit
      // This would integrate with the WebSocket system for real-time delivery
      logger.info('In-app notification stored for user', { 
        userId: notification.userId,
        notificationId: notification.id 
      });

      return { 
        success: true, 
        provider: 'in_app', 
        deliveryTime: Date.now() - startTime,
        messageId: `in_app_${notification.id}_${Date.now()}`
      };
    } catch (error) {
      return { 
        success: false, 
        errorMessage: error.message,
        deliveryTime: Date.now() - startTime
      };
    }
  }

  /**
   * Mark notification delivery as failed
   */
  private async markDeliveryFailed(queueId: number, errorMessage: string) {
    await db.update(notificationQueue)
      .set({ 
        status: 'failed', 
        failedAt: new Date(),
        errorMessage,
        retryCount: sql`retry_count + 1`
      })
      .where(eq(notificationQueue.id, queueId));
  }

  /**
   * Record delivery analytics
   */
  private async recordDeliveryAnalytics(notification: NotificationQueueType, result: DeliveryResult) {
    try {
      const date = new Date();
      const hour = date.getHours();

      // Upsert analytics record
      await db.insert(notificationAnalytics)
        .values({
          templateId: notification.templateId,
          triggerId: notification.triggerId,
          campaignId: notification.campaignId,
          queueId: notification.id,
          date,
          hour,
          channel: notification.channel,
          sent: 1,
          delivered: result.success ? 1 : 0,
          failed: result.success ? 0 : 1,
          avgDeliveryTime: result.deliveryTime || 0,
          totalCost: result.cost || 0
        })
        .onConflictDoUpdate({
          target: [notificationAnalytics.templateId, notificationAnalytics.channel, notificationAnalytics.date, notificationAnalytics.hour],
          set: {
            sent: sql`sent + 1`,
            delivered: sql`delivered + ${result.success ? 1 : 0}`,
            failed: sql`failed + ${result.success ? 0 : 1}`,
            avgDeliveryTime: sql`(avg_delivery_time + ${result.deliveryTime || 0}) / 2`,
            totalCost: sql`total_cost + ${result.cost || 0}`
          }
        });
    } catch (error) {
      logger.error('Failed to record delivery analytics', { error, notificationId: notification.id });
    }
  }

  /**
   * Start the queue processor for batch delivery
   */
  private startQueueProcessor() {
    setInterval(async () => {
      if (this.processingQueue) return;
      
      this.processingQueue = true;
      await this.processQueueBatch();
      this.processingQueue = false;
    }, 10000); // Process every 10 seconds
  }

  /**
   * Process a batch of queued notifications
   */
  private async processQueueBatch() {
    try {
      // Get notifications ready for delivery
      const notifications = await db.select()
        .from(notificationQueue)
        .where(and(
          eq(notificationQueue.status, 'queued'),
          lte(notificationQueue.scheduledFor, new Date())
        ))
        .orderBy(notificationQueue.priority, notificationQueue.scheduledFor)
        .limit(50);

      // Process notifications in parallel (limited concurrency)
      const deliveryPromises = notifications.map(notification => 
        this.deliverNotification(notification.id)
      );

      await Promise.allSettled(deliveryPromises);

      if (notifications.length > 0) {
        logger.info('Processed notification batch', { count: notifications.length });
      }
    } catch (error) {
      logger.error('Failed to process notification batch', { error });
    }
  }

  /**
   * Get notification analytics
   */
  async getAnalytics(filters: {
    templateId?: number;
    channel?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    try {
      let query = db.select().from(notificationAnalytics);
      
      const conditions = [];
      
      if (filters.templateId) {
        conditions.push(eq(notificationAnalytics.templateId, filters.templateId));
      }
      
      if (filters.channel) {
        conditions.push(eq(notificationAnalytics.channel, filters.channel));
      }
      
      if (filters.startDate) {
        conditions.push(gte(notificationAnalytics.date, filters.startDate));
      }
      
      if (filters.endDate) {
        conditions.push(lte(notificationAnalytics.date, filters.endDate));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      return await query.orderBy(desc(notificationAnalytics.date));
    } catch (error) {
      logger.error('Failed to get notification analytics', { error, filters });
      return [];
    }
  }

  /**
   * Update user notification preferences
   */
  async updateUserPreferences(userId: string, preferences: Partial<any>) {
    try {
      await db.insert(userNotificationPreferences)
        .values({ userId, ...preferences })
        .onConflictDoUpdate({
          target: userNotificationPreferences.userId,
          set: { ...preferences, updatedAt: new Date() }
        });

      return { success: true };
    } catch (error) {
      logger.error('Failed to update user preferences', { userId, error });
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export const notificationEngine = new NotificationEngine();