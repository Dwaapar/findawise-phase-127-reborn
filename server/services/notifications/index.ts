import { NotificationEngine } from './notificationEngine';
import { LifecycleEngine } from './lifecycleEngine';
import { ComplianceEngine } from './complianceEngine';
import { OfferSyncEngine } from './offerSyncEngine';
import { logger } from '../../utils/logger';

/**
 * Notification System Orchestrator
 * Manages all notification services and engines
 */
export class NotificationSystem {
  private notificationEngine: NotificationEngine;
  private lifecycleEngine: LifecycleEngine;
  private complianceEngine: ComplianceEngine;
  private offerSyncEngine: OfferSyncEngine;
  private isInitialized = false;

  constructor() {
    // Initialize with placeholder configuration
    const config = {
      channels: {
        email: {
          provider: 'resend',
          credentials: {
            apiKey: process.env.RESEND_API_KEY || 'placeholder-key',
            defaultFromEmail: 'noreply@findawise.com',
            defaultFromName: 'Findawise Empire'
          }
        },
        push: {
          provider: 'firebase',
          credentials: {
            serviceAccountKey: process.env.FIREBASE_SERVICE_ACCOUNT_KEY || {},
            projectId: process.env.FIREBASE_PROJECT_ID || 'placeholder-project'
          }
        },
        sms: {
          provider: 'placeholder',
          credentials: {
            accountSid: 'placeholder',
            authToken: 'placeholder',
            phoneNumber: 'placeholder'
          }
        }
      },
      compliance: {
        gdpr: true,
        canSpam: true,
        casl: true,
        autoRemediation: true
      },
      ai: {
        enabled: true,
        provider: 'openai',
        optimizations: ['timing', 'channel', 'content', 'testing']
      }
    };

    this.notificationEngine = new NotificationEngine();
    this.lifecycleEngine = new LifecycleEngine();
    this.complianceEngine = new ComplianceEngine();
    this.offerSyncEngine = new OfferSyncEngine();
  }

  async initialize(): Promise<void> {
    try {
      // Initialize engines if they have initialize methods
      if (typeof this.notificationEngine.initialize === 'function') {
        await this.notificationEngine.initialize();
      }
      if (typeof this.lifecycleEngine.initialize === 'function') {
        await this.lifecycleEngine.initialize();
      }
      if (typeof this.complianceEngine.initialize === 'function') {
        await this.complianceEngine.initialize();
      }
      if (typeof this.offerSyncEngine.initialize === 'function') {
        await this.offerSyncEngine.initialize();
      }
      
      this.isInitialized = true;
      logger.info('🔔 Notification System initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize notification system:', error as any);
      throw error;
    }
  }

  getNotificationEngine(): NotificationEngine {
    return this.notificationEngine;
  }

  getLifecycleEngine(): LifecycleEngine {
    return this.lifecycleEngine;
  }

  getComplianceEngine(): ComplianceEngine {
    return this.complianceEngine;
  }

  getOfferSyncEngine(): OfferSyncEngine {
    return this.offerSyncEngine;
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down notification system...');
    if (typeof this.offerSyncEngine.shutdown === 'function') {
      await this.offerSyncEngine.shutdown();
    }
    this.isInitialized = false;
  }
}

// Export all engines for external use
export { notificationEngine } from './notificationEngine';
export { lifecycleEngine } from './lifecycleEngine';
export { complianceEngine } from './complianceEngine';
export { offerSyncEngine } from './offerSyncEngine';
export { triggerEngine } from './triggerEngine';

// Global notification system instance
export const notificationSystem = new NotificationSystem();