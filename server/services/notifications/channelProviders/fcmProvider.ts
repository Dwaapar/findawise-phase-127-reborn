import { logger } from "../../../utils/logger";

export interface FCMProvider {
  send(message: FCMMessage): Promise<FCMDeliveryResult>;
  validateConfig(): Promise<boolean>;
  getProviderName(): string;
}

export interface FCMMessage {
  token?: string;
  tokens?: string[];
  topic?: string;
  condition?: string;
  notification: {
    title: string;
    body: string;
    image?: string;
  };
  data?: Record<string, string>;
  android?: {
    priority?: 'normal' | 'high';
    notification?: {
      icon?: string;
      color?: string;
      sound?: string;
      tag?: string;
      click_action?: string;
    };
  };
  webpush?: {
    headers?: Record<string, string>;
    data?: Record<string, string>;
    notification?: {
      title?: string;
      body?: string;
      icon?: string;
      badge?: string;
      image?: string;
      tag?: string;
      renotify?: boolean;
      requireInteraction?: boolean;
      silent?: boolean;
      timestamp?: number;
      vibrate?: number[];
      actions?: Array<{
        action: string;
        title: string;
        icon?: string;
      }>;
    };
  };
}

export interface FCMDeliveryResult {
  success: boolean;
  messageId?: string;
  provider: string;
  errorMessage?: string;
  deliveryTime: number;
  successCount?: number;
  failureCount?: number;
  responses?: any[];
}

/**
 * Firebase Cloud Messaging Provider - Free push notifications
 */
export class FirebaseCloudMessagingProvider implements FCMProvider {
  private serviceAccountKey: any;
  private projectId: string;
  private admin: any;

  constructor(config: {
    serviceAccountKey: any;
    projectId: string;
  }) {
    this.serviceAccountKey = config.serviceAccountKey;
    this.projectId = config.projectId;
    this.initializeFirebase();
  }

  private async initializeFirebase() {
    try {
      // Dynamic import for Firebase Admin SDK
      const admin = await import('firebase-admin');
      this.admin = admin;

      // Initialize the app if it doesn't exist
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(this.serviceAccountKey),
          projectId: this.projectId,
        });
      }

      logger.info('Firebase Cloud Messaging initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Firebase:', error);
      throw error;
    }
  }

  async send(message: FCMMessage): Promise<FCMDeliveryResult> {
    const startTime = Date.now();

    try {
      let result;

      if (message.tokens && message.tokens.length > 0) {
        // Send to multiple tokens
        const multicastMessage = {
          tokens: message.tokens,
          notification: message.notification,
          data: message.data,
          android: message.android,
          webpush: message.webpush,
        };

        result = await this.admin.messaging().sendMulticast(multicastMessage);
        
        return {
          success: result.failureCount === 0,
          provider: 'firebase-cloud-messaging',
          deliveryTime: Date.now() - startTime,
          successCount: result.successCount,
          failureCount: result.failureCount,
          responses: result.responses,
          errorMessage: result.failureCount > 0 ? 'Some messages failed to send' : undefined
        };
      } else if (message.token) {
        // Send to single token
        const singleMessage = {
          token: message.token,
          notification: message.notification,
          data: message.data,
          android: message.android,
          webpush: message.webpush,
        };

        const messageId = await this.admin.messaging().send(singleMessage);
        
        return {
          success: true,
          messageId,
          provider: 'firebase-cloud-messaging',
          deliveryTime: Date.now() - startTime,
          successCount: 1,
          failureCount: 0
        };
      } else if (message.topic) {
        // Send to topic
        const topicMessage = {
          topic: message.topic,
          notification: message.notification,
          data: message.data,
          android: message.android,
          webpush: message.webpush,
        };

        const messageId = await this.admin.messaging().send(topicMessage);
        
        return {
          success: true,
          messageId,
          provider: 'firebase-cloud-messaging',
          deliveryTime: Date.now() - startTime,
          successCount: 1,
          failureCount: 0
        };
      } else if (message.condition) {
        // Send to condition
        const conditionMessage = {
          condition: message.condition,
          notification: message.notification,
          data: message.data,
          android: message.android,
          webpush: message.webpush,
        };

        const messageId = await this.admin.messaging().send(conditionMessage);
        
        return {
          success: true,
          messageId,
          provider: 'firebase-cloud-messaging',
          deliveryTime: Date.now() - startTime,
          successCount: 1,
          failureCount: 0
        };
      } else {
        throw new Error('No valid target specified (token, tokens, topic, or condition)');
      }
    } catch (error: any) {
      logger.error('FCM send error:', error);
      
      return {
        success: false,
        provider: 'firebase-cloud-messaging',
        errorMessage: error.message || 'Unknown FCM error',
        deliveryTime: Date.now() - startTime,
        successCount: 0,
        failureCount: 1
      };
    }
  }

  async validateConfig(): Promise<boolean> {
    try {
      // Try to get the Firebase app
      const app = this.admin.app();
      return !!app;
    } catch (error) {
      logger.error('FCM config validation failed:', error);
      return false;
    }
  }

  getProviderName(): string {
    return 'firebase-cloud-messaging';
  }

  /**
   * Subscribe a token to a topic
   */
  async subscribeToTopic(tokens: string | string[], topic: string): Promise<void> {
    try {
      const tokenList = Array.isArray(tokens) ? tokens : [tokens];
      await this.admin.messaging().subscribeToTopic(tokenList, topic);
      logger.info('Tokens subscribed to topic:', { topic, tokenCount: tokenList.length });
    } catch (error) {
      logger.error('Failed to subscribe to topic:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe a token from a topic
   */
  async unsubscribeFromTopic(tokens: string | string[], topic: string): Promise<void> {
    try {
      const tokenList = Array.isArray(tokens) ? tokens : [tokens];
      await this.admin.messaging().unsubscribeFromTopic(tokenList, topic);
      logger.info('Tokens unsubscribed from topic:', { topic, tokenCount: tokenList.length });
    } catch (error) {
      logger.error('Failed to unsubscribe from topic:', error);
      throw error;
    }
  }
}

/**
 * Web Push Provider (fallback for browsers without FCM SDK)
 */
export class WebPushProvider implements FCMProvider {
  private vapidKeys: {
    publicKey: string;
    privateKey: string;
  };
  private contact: string;

  constructor(config: {
    vapidKeys: {
      publicKey: string;
      privateKey: string;
    };
    contact: string;
  }) {
    this.vapidKeys = config.vapidKeys;
    this.contact = config.contact;
  }

  async send(message: FCMMessage): Promise<FCMDeliveryResult> {
    const startTime = Date.now();

    try {
      // Dynamic import for web-push library
      const webpush = await import('web-push');
      
      webpush.setVapidDetails(
        this.contact,
        this.vapidKeys.publicKey,
        this.vapidKeys.privateKey
      );

      const payload = JSON.stringify({
        title: message.notification.title,
        body: message.notification.body,
        icon: message.notification.image,
        data: message.data,
        ...message.webpush?.notification
      });

      if (message.tokens && message.tokens.length > 0) {
        // Send to multiple endpoints
        const promises = message.tokens.map(async (endpoint) => {
          try {
            await webpush.sendNotification({ endpoint }, payload);
            return { success: true };
          } catch (error) {
            return { success: false, error };
          }
        });

        const results = await Promise.all(promises);
        const successCount = results.filter(r => r.success).length;
        const failureCount = results.length - successCount;

        return {
          success: failureCount === 0,
          provider: 'web-push',
          deliveryTime: Date.now() - startTime,
          successCount,
          failureCount,
          responses: results,
          errorMessage: failureCount > 0 ? 'Some notifications failed to send' : undefined
        };
      } else if (message.token) {
        // Send to single endpoint
        await webpush.sendNotification({ endpoint: message.token }, payload);
        
        return {
          success: true,
          provider: 'web-push',
          deliveryTime: Date.now() - startTime,
          successCount: 1,
          failureCount: 0
        };
      } else {
        throw new Error('No valid endpoint specified for web push');
      }
    } catch (error: any) {
      logger.error('Web Push send error:', error);
      
      return {
        success: false,
        provider: 'web-push',
        errorMessage: error.message || 'Unknown web push error',
        deliveryTime: Date.now() - startTime,
        successCount: 0,
        failureCount: 1
      };
    }
  }

  async validateConfig(): Promise<boolean> {
    try {
      return !!(this.vapidKeys.publicKey && this.vapidKeys.privateKey && this.contact);
    } catch (error) {
      logger.error('Web Push config validation failed:', error);
      return false;
    }
  }

  getProviderName(): string {
    return 'web-push';
  }
}