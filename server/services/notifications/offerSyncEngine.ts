import { logger } from "../../utils/logger";
import { notificationEngine } from "./notificationEngine";
import { triggerEngine } from "./triggerEngine";

export interface OfferUpdate {
  offerId: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  category: string;
  vendor: string;
  url: string;
  imageUrl?: string;
  tags: string[];
  availability: boolean;
  expiresAt?: Date;
  isNewOffer: boolean;
  isPriceDropped: boolean;
  isBackInStock: boolean;
  relevanceScore: number;
  targetSegments: string[];
  metadata: Record<string, any>;
}

export interface NotificationTrigger {
  type: 'price_drop' | 'new_offer' | 'back_in_stock' | 'expiring_soon' | 'personalized_match';
  thresholds: {
    priceDropPercentage?: number;
    expirationHours?: number;
    relevanceScore?: number;
  };
  targetSegments: string[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  delay: number; // minutes
}

class OfferSyncEngine {
  private syncInterval: NodeJS.Timeout | null = null;
  private notificationTriggers: NotificationTrigger[] = [];
  private lastSyncTime: Date = new Date(0);
  private offerCache: Map<string, OfferUpdate> = new Map();

  constructor() {
    this.initializeNotificationTriggers();
    this.startSyncProcess();
  }

  /**
   * Initialize notification triggers for different offer events
   */
  private initializeNotificationTriggers() {
    this.notificationTriggers = [
      {
        type: 'price_drop',
        thresholds: {
          priceDropPercentage: 20 // 20% or more price drop
        },
        targetSegments: ['bargain_hunters', 'price_conscious', 'deal_seekers'],
        priority: 'high',
        delay: 5 // 5 minutes
      },
      {
        type: 'new_offer',
        thresholds: {
          relevanceScore: 0.7 // 70% relevance or higher
        },
        targetSegments: ['early_adopters', 'category_enthusiasts'],
        priority: 'normal',
        delay: 30 // 30 minutes
      },
      {
        type: 'back_in_stock',
        thresholds: {},
        targetSegments: ['waitlist_users', 'interested_users'],
        priority: 'high',
        delay: 10 // 10 minutes
      },
      {
        type: 'expiring_soon',
        thresholds: {
          expirationHours: 24 // Notify 24 hours before expiration
        },
        targetSegments: ['active_users', 'deal_seekers'],
        priority: 'urgent',
        delay: 0 // Immediate
      },
      {
        type: 'personalized_match',
        thresholds: {
          relevanceScore: 0.8 // 80% relevance or higher
        },
        targetSegments: ['personalized_users'],
        priority: 'normal',
        delay: 60 // 1 hour for better targeting
      }
    ];

    logger.info('Offer notification triggers initialized', {
      component: 'OfferSyncEngine',
      triggerCount: this.notificationTriggers.length
    });
  }

  /**
   * Start the offer sync process
   */
  private startSyncProcess() {
    // Ultra-optimized: Sync every 2 hours to reduce CPU load
    this.syncInterval = setInterval(async () => {
      try {
        await this.syncOffers();
      } catch (error) {
        logger.error('Offer sync process failed', { error });
      }
    }, 120 * 60 * 1000);

    // Initial sync
    setTimeout(() => this.syncOffers(), 5000);

    logger.info('Offer sync process started', {
      component: 'OfferSyncEngine',
      syncInterval: '2 hours'
    });
  }

  /**
   * Sync offers from external sources
   */
  async syncOffers(): Promise<void> {
    try {
      logger.info('Starting offer sync', { component: 'OfferSyncEngine' });

      // Get offers from multiple sources
      const offerSources = [
        this.fetchAmazonOffers(),
        this.fetchClickBankOffers(),
        this.fetchCommissionJunctionOffers(),
        this.fetchShareASaleOffers(),
        this.fetchCustomOffers()
      ];

      const allOfferResults = await Promise.allSettled(offerSources);
      
      let totalOffers = 0;
      let newOffers = 0;
      let updatedOffers = 0;

      for (const result of allOfferResults) {
        if (result.status === 'fulfilled') {
          const offers = result.value;
          totalOffers += offers.length;

          for (const offer of offers) {
            const processed = await this.processOfferUpdate(offer);
            if (processed.isNew) {
              newOffers++;
            } else if (processed.isUpdated) {
              updatedOffers++;
            }
          }
        } else {
          logger.error('Offer source failed', { error: result.reason });
        }
      }

      this.lastSyncTime = new Date();

      logger.info('Offer sync completed', {
        component: 'OfferSyncEngine',
        totalOffers,
        newOffers,
        updatedOffers,
        syncTime: this.lastSyncTime
      });

    } catch (error) {
      logger.error('Offer sync failed', { error });
    }
  }

  /**
   * Process an individual offer update
   */
  private async processOfferUpdate(offer: OfferUpdate): Promise<{ isNew: boolean; isUpdated: boolean }> {
    try {
      const existingOffer = this.offerCache.get(offer.offerId);
      let isNew = false;
      let isUpdated = false;

      if (!existingOffer) {
        // New offer
        isNew = true;
        offer.isNewOffer = true;
        this.offerCache.set(offer.offerId, offer);
        
        await this.triggerNotifications('new_offer', offer);
      } else {
        // Check for updates
        const updates = this.detectOfferChanges(existingOffer, offer);
        
        if (updates.length > 0) {
          isUpdated = true;
          this.offerCache.set(offer.offerId, offer);

          // Trigger appropriate notifications based on changes
          for (const update of updates) {
            await this.triggerNotifications(update, offer);
          }
        }
      }

      // Check for expiring offers
      if (offer.expiresAt && this.isExpiringSoon(offer.expiresAt)) {
        await this.triggerNotifications('expiring_soon', offer);
      }

      return { isNew, isUpdated };
    } catch (error) {
      logger.error('Failed to process offer update', { 
        offerId: offer.offerId, 
        error 
      });
      return { isNew: false, isUpdated: false };
    }
  }

  /**
   * Detect changes between old and new offer
   */
  private detectOfferChanges(oldOffer: OfferUpdate, newOffer: OfferUpdate): string[] {
    const changes: string[] = [];

    // Price drop detection
    if (newOffer.price < oldOffer.price) {
      const dropPercentage = ((oldOffer.price - newOffer.price) / oldOffer.price) * 100;
      const trigger = this.notificationTriggers.find(t => t.type === 'price_drop');
      
      if (trigger && dropPercentage >= (trigger.thresholds.priceDropPercentage || 0)) {
        newOffer.isPriceDropped = true;
        changes.push('price_drop');
      }
    }

    // Back in stock detection
    if (!oldOffer.availability && newOffer.availability) {
      newOffer.isBackInStock = true;
      changes.push('back_in_stock');
    }

    return changes;
  }

  /**
   * Check if offer is expiring soon
   */
  private isExpiringSoon(expiresAt: Date): boolean {
    const hoursUntilExpiration = (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60);
    const trigger = this.notificationTriggers.find(t => t.type === 'expiring_soon');
    return hoursUntilExpiration <= (trigger?.thresholds.expirationHours || 24);
  }

  /**
   * Trigger notifications based on offer event
   */
  private async triggerNotifications(eventType: string, offer: OfferUpdate) {
    try {
      const trigger = this.notificationTriggers.find(t => t.type === eventType);
      if (!trigger) return;

      // Check relevance score threshold
      if (trigger.thresholds.relevanceScore && 
          offer.relevanceScore < trigger.thresholds.relevanceScore) {
        return;
      }

      // Get users in target segments
      const targetUsers = await this.getUsersInSegments(trigger.targetSegments);

      for (const userId of targetUsers) {
        // Check user preferences
        if (await this.shouldNotifyUser(userId, eventType, offer)) {
          await triggerEngine.processEvent({
            eventName: `offer_${eventType}`,
            userId,
            data: {
              offer: {
                id: offer.offerId,
                title: offer.title,
                price: offer.price,
                originalPrice: offer.originalPrice,
                discount: offer.discount,
                category: offer.category,
                vendor: offer.vendor,
                url: offer.url,
                imageUrl: offer.imageUrl,
                expiresAt: offer.expiresAt
              },
              eventType,
              priority: trigger.priority,
              relevanceScore: offer.relevanceScore
            },
            metadata: {
              source: 'offer_sync_engine',
              triggerType: eventType,
              offerId: offer.offerId
            }
          });
        }
      }

      logger.info('Offer notifications triggered', {
        component: 'OfferSyncEngine',
        eventType,
        offerId: offer.offerId,
        targetUsers: targetUsers.length,
        priority: trigger.priority
      });

    } catch (error) {
      logger.error('Failed to trigger offer notifications', { 
        eventType, 
        offerId: offer.offerId, 
        error 
      });
    }
  }

  /**
   * Get users in specific segments
   */
  private async getUsersInSegments(segments: string[]): Promise<string[]> {
    try {
      // This would integrate with user segmentation system
      // For now, return sample user IDs
      const sampleUsers = [
        'user_001', 'user_002', 'user_003', 'user_004', 'user_005'
      ];
      
      // Filter based on segments (simplified)
      return sampleUsers.filter(userId => {
        // In real implementation, check user's segments
        return Math.random() > 0.5; // 50% chance for demo
      });
    } catch (error) {
      logger.error('Failed to get users in segments', { segments, error });
      return [];
    }
  }

  /**
   * Check if user should be notified
   */
  private async shouldNotifyUser(userId: string, eventType: string, offer: OfferUpdate): Promise<boolean> {
    try {
      // Check user notification preferences
      // Check frequency limits
      // Check category interests
      // Check time zone and quiet hours
      
      // Simplified logic for demo
      return Math.random() > 0.3; // 70% chance for demo
    } catch (error) {
      logger.error('Failed to check user notification eligibility', { 
        userId, 
        eventType, 
        error 
      });
      return false;
    }
  }

  /**
   * Fetch offers from Amazon Associates
   */
  private async fetchAmazonOffers(): Promise<OfferUpdate[]> {
    try {
      // Amazon API integration would go here
      return this.generateSampleOffers('Amazon', 'electronics');
    } catch (error) {
      logger.error('Failed to fetch Amazon offers', { error });
      return [];
    }
  }

  /**
   * Fetch offers from ClickBank
   */
  private async fetchClickBankOffers(): Promise<OfferUpdate[]> {
    try {
      // ClickBank API integration would go here
      return this.generateSampleOffers('ClickBank', 'digital_products');
    } catch (error) {
      logger.error('Failed to fetch ClickBank offers', { error });
      return [];
    }
  }

  /**
   * Fetch offers from Commission Junction
   */
  private async fetchCommissionJunctionOffers(): Promise<OfferUpdate[]> {
    try {
      // CJ API integration would go here
      return this.generateSampleOffers('CJ', 'fashion');
    } catch (error) {
      logger.error('Failed to fetch CJ offers', { error });
      return [];
    }
  }

  /**
   * Fetch offers from ShareASale
   */
  private async fetchShareASaleOffers(): Promise<OfferUpdate[]> {
    try {
      // ShareASale API integration would go here
      return this.generateSampleOffers('ShareASale', 'home_garden');
    } catch (error) {
      logger.error('Failed to fetch ShareASale offers', { error });
      return [];
    }
  }

  /**
   * Fetch custom/direct offers
   */
  private async fetchCustomOffers(): Promise<OfferUpdate[]> {
    try {
      // Custom offer sources would go here
      return this.generateSampleOffers('Custom', 'courses');
    } catch (error) {
      logger.error('Failed to fetch custom offers', { error });
      return [];
    }
  }

  /**
   * Generate sample offers for demonstration
   */
  private generateSampleOffers(vendor: string, category: string): OfferUpdate[] {
    const offers: OfferUpdate[] = [];
    const offerCount = Math.floor(Math.random() * 5) + 1; // 1-5 offers

    for (let i = 0; i < offerCount; i++) {
      const offerId = `${vendor.toLowerCase()}_${category}_${Date.now()}_${i}`;
      const originalPrice = Math.floor(Math.random() * 500) + 50;
      const discountPercentage = Math.floor(Math.random() * 50) + 10;
      const price = originalPrice * (1 - discountPercentage / 100);

      offers.push({
        offerId,
        title: `${vendor} ${category} Deal ${i + 1}`,
        description: `Amazing ${category} offer from ${vendor}`,
        price: Math.round(price * 100) / 100,
        originalPrice,
        discount: discountPercentage,
        category,
        vendor,
        url: `https://${vendor.toLowerCase()}.com/offers/${offerId}`,
        imageUrl: `https://images.${vendor.toLowerCase()}.com/${offerId}.jpg`,
        tags: [category, vendor.toLowerCase(), 'deal', 'limited_time'],
        availability: Math.random() > 0.1, // 90% available
        expiresAt: new Date(Date.now() + (Math.random() * 7 * 24 * 60 * 60 * 1000)), // Random 0-7 days
        isNewOffer: false,
        isPriceDropped: false,
        isBackInStock: false,
        relevanceScore: Math.random(),
        targetSegments: ['general', category.replace('_', '_'), 'deal_seekers'],
        metadata: {
          vendor,
          category,
          syncedAt: new Date(),
          source: 'offer_sync_engine'
        }
      });
    }

    return offers;
  }

  /**
   * Get sync status
   */
  getSyncStatus(): any {
    return {
      lastSyncTime: this.lastSyncTime,
      cachedOffers: this.offerCache.size,
      activeTriggers: this.notificationTriggers.length,
      isRunning: this.syncInterval !== null
    };
  }

  /**
   * Force sync offers
   */
  async forceSyncOffers(): Promise<void> {
    logger.info('Force sync requested', { component: 'OfferSyncEngine' });
    await this.syncOffers();
  }

  /**
   * Stop sync process
   */
  stopSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      logger.info('Offer sync stopped', { component: 'OfferSyncEngine' });
    }
  }

  /**
   * Add custom notification trigger
   */
  addNotificationTrigger(trigger: NotificationTrigger): void {
    this.notificationTriggers.push(trigger);
    logger.info('Custom notification trigger added', {
      component: 'OfferSyncEngine',
      triggerType: trigger.type,
      priority: trigger.priority
    });
  }

  /**
   * Get offer by ID
   */
  getOffer(offerId: string): OfferUpdate | undefined {
    return this.offerCache.get(offerId);
  }

  /**
   * Get all cached offers
   */
  getAllOffers(): OfferUpdate[] {
    return Array.from(this.offerCache.values());
  }

  /**
   * Get offers by category
   */
  getOffersByCategory(category: string): OfferUpdate[] {
    return Array.from(this.offerCache.values())
      .filter(offer => offer.category === category);
  }

  /**
   * Get offers by vendor
   */
  getOffersByVendor(vendor: string): OfferUpdate[] {
    return Array.from(this.offerCache.values())
      .filter(offer => offer.vendor === vendor);
  }
}

// Export both class and singleton instance
export { OfferSyncEngine };
export const offerSyncEngine = new OfferSyncEngine();