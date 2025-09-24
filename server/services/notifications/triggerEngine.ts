import { db } from "../../db";
import { 
  notificationTriggers, 
  notificationTemplates,
  notificationQueue,
  userNotificationPreferences,
  type NotificationTrigger
} from "@shared/notificationTables";
import { eq, and, or, sql } from "drizzle-orm";
import { logger } from "../../utils/logger";
import { notificationEngine } from "./notificationEngine";

export interface TriggerEvent {
  eventName: string;
  userId?: string;
  sessionId?: string;
  data?: Record<string, any>;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export interface TriggerCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'exists';
  value: any;
}

export interface TriggerRule {
  conditions: TriggerCondition[];
  logic: 'AND' | 'OR';
  segments?: string[];
  excludeSegments?: string[];
  timeConstraints?: {
    timezone?: string;
    allowedHours?: number[];
    allowedDays?: number[];
    quietHours?: { start: string; end: string; };
  };
}

class TriggerEngine {
  private eventListeners: Map<string, NotificationTrigger[]> = new Map();
  private initialized: boolean = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize trigger engine by loading all active triggers
   */
  async initialize() {
    try {
      await this.loadTriggers();
      this.initialized = true;
      logger.info('Trigger engine initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize trigger engine', { error });
    }
  }

  /**
   * Load all active triggers from database
   */
  async loadTriggers() {
    try {
      const triggers = await db.select()
        .from(notificationTriggers)
        .where(eq(notificationTriggers.isActive, true));

      this.eventListeners.clear();

      for (const trigger of triggers) {
        if (trigger.eventName) {
          if (!this.eventListeners.has(trigger.eventName)) {
            this.eventListeners.set(trigger.eventName, []);
          }
          this.eventListeners.get(trigger.eventName)!.push(trigger);
        }
      }

      logger.info('Triggers loaded', { 
        triggerCount: triggers.length,
        eventTypes: Array.from(this.eventListeners.keys())
      });
    } catch (error) {
      logger.error('Failed to load triggers', { error });
    }
  }

  /**
   * Process a trigger event
   */
  async processEvent(event: TriggerEvent) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const triggers = this.eventListeners.get(event.eventName) || [];
      
      if (triggers.length === 0) {
        return; // No triggers for this event
      }

      logger.debug('Processing trigger event', { 
        eventName: event.eventName,
        triggerCount: triggers.length,
        userId: event.userId
      });

      // Process each trigger that matches this event
      const triggerPromises = triggers.map(trigger => 
        this.processTrigger(trigger, event)
      );

      await Promise.allSettled(triggerPromises);

    } catch (error) {
      logger.error('Failed to process trigger event', { error, event });
    }
  }

  /**
   * Process a specific trigger for an event
   */
  private async processTrigger(trigger: NotificationTrigger, event: TriggerEvent) {
    try {
      // 1. Check if trigger conditions are met
      if (!await this.evaluateConditions(trigger, event)) {
        return;
      }

      // 2. Check user preferences and segments
      if (!await this.checkUserTargeting(trigger, event)) {
        return;
      }

      // 3. Check rate limiting and cooldowns
      if (!await this.checkRateLimit(trigger, event)) {
        return;
      }

      // 4. Check timing constraints
      if (!this.checkTimeConstraints(trigger, event)) {
        return;
      }

      // 5. Find appropriate template
      const template = await this.findTemplate(trigger);
      if (!template) {
        logger.warn('No template found for trigger', { triggerId: trigger.id });
        return;
      }

      // 6. Schedule notification
      await this.scheduleNotification(trigger, template, event);

      logger.info('Trigger processed successfully', {
        triggerId: trigger.id,
        eventName: event.eventName,
        userId: event.userId
      });

    } catch (error) {
      logger.error('Failed to process trigger', { 
        triggerId: trigger.id, 
        error 
      });
    }
  }

  /**
   * Evaluate trigger conditions against event data
   */
  private async evaluateConditions(trigger: NotificationTrigger, event: TriggerEvent): Promise<boolean> {
    try {
      const conditions = trigger.conditions as any;
      
      if (!conditions || !conditions.rules || conditions.rules.length === 0) {
        return true; // No conditions means always trigger
      }

      const results = conditions.rules.map((rule: TriggerCondition) => 
        this.evaluateCondition(rule, event)
      );

      // Apply logic (AND/OR)
      const logic = conditions.logic || 'AND';
      if (logic === 'AND') {
        return results.every(result => result);
      } else {
        return results.some(result => result);
      }

    } catch (error) {
      logger.error('Failed to evaluate conditions', { triggerId: trigger.id, error });
      return false;
    }
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(condition: TriggerCondition, event: TriggerEvent): boolean {
    const eventValue = this.getEventValue(condition.field, event);
    
    switch (condition.operator) {
      case 'equals':
        return eventValue === condition.value;
      case 'not_equals':
        return eventValue !== condition.value;
      case 'greater_than':
        return Number(eventValue) > Number(condition.value);
      case 'less_than':
        return Number(eventValue) < Number(condition.value);
      case 'contains':
        return String(eventValue).includes(String(condition.value));
      case 'exists':
        return eventValue !== undefined && eventValue !== null;
      default:
        return false;
    }
  }

  /**
   * Get value from event data by field path
   */
  private getEventValue(fieldPath: string, event: TriggerEvent): any {
    if (fieldPath.includes('.')) {
      const parts = fieldPath.split('.');
      let value: any = event;
      
      for (const part of parts) {
        value = value?.[part];
        if (value === undefined) break;
      }
      
      return value;
    }
    
    return (event as any)[fieldPath];
  }

  /**
   * Check user targeting and segments
   */
  private async checkUserTargeting(trigger: NotificationTrigger, event: TriggerEvent): Promise<boolean> {
    if (!event.userId && !event.sessionId) {
      return false; // Need user identification
    }

    try {
      // Check target segments
      const targetSegments = trigger.targetSegments as string[];
      const excludeSegments = trigger.excludeSegments as string[];

      if (targetSegments && targetSegments.length > 0) {
        const userSegments = await this.getUserSegments(event.userId || event.sessionId!);
        const hasTargetSegment = targetSegments.some(segment => userSegments.includes(segment));
        if (!hasTargetSegment) {
          return false;
        }
      }

      if (excludeSegments && excludeSegments.length > 0) {
        const userSegments = await this.getUserSegments(event.userId || event.sessionId!);
        const hasExcludeSegment = excludeSegments.some(segment => userSegments.includes(segment));
        if (hasExcludeSegment) {
          return false;
        }
      }

      return true;
    } catch (error) {
      logger.error('Failed to check user targeting', { triggerId: trigger.id, error });
      return false;
    }
  }

  /**
   * Get user segments (simplified implementation)
   */
  private async getUserSegments(userIdentifier: string): Promise<string[]> {
    try {
      // Implementation would check user profile, behavior, etc.
      // For now, return default segments
      return ['general', 'active'];
    } catch (error) {
      return [];
    }
  }

  /**
   * Check rate limiting and cooldowns
   */
  private async checkRateLimit(trigger: NotificationTrigger, event: TriggerEvent): Promise<boolean> {
    if (!event.userId) {
      return true; // No rate limiting without user ID
    }

    try {
      const maxSends = trigger.maxSendsPerUser || 1;
      const cooldownMinutes = trigger.cooldownPeriod || 1440; // 24 hours default
      
      if (maxSends <= 0) {
        return true; // No limit
      }

      // Check recent sends for this trigger and user
      const cutoffTime = new Date(Date.now() - (cooldownMinutes * 60 * 1000));
      
      const recentSends = await db.select({ count: sql<number>`count(*)` })
        .from(notificationQueue)
        .where(and(
          eq(notificationQueue.triggerId, trigger.id),
          eq(notificationQueue.userId, event.userId),
          sql`created_at > ${cutoffTime}`
        ));

      const sendCount = recentSends[0]?.count || 0;
      
      return sendCount < maxSends;

    } catch (error) {
      logger.error('Failed to check rate limit', { triggerId: trigger.id, error });
      return true; // Allow on error
    }
  }

  /**
   * Check timing constraints
   */
  private checkTimeConstraints(trigger: NotificationTrigger, event: TriggerEvent): boolean {
    try {
      const timeWindow = trigger.timeWindow as any;
      
      if (!timeWindow) {
        return true; // No time constraints
      }

      const now = new Date();
      const hour = now.getHours();
      const day = now.getDay(); // 0 = Sunday

      // Check allowed hours
      if (timeWindow.allowedHours && timeWindow.allowedHours.length > 0) {
        if (!timeWindow.allowedHours.includes(hour)) {
          return false;
        }
      }

      // Check allowed days
      if (timeWindow.allowedDays && timeWindow.allowedDays.length > 0) {
        if (!timeWindow.allowedDays.includes(day)) {
          return false;
        }
      }

      // Check quiet hours
      if (timeWindow.quietHours) {
        const quietStart = this.parseTimeString(timeWindow.quietHours.start);
        const quietEnd = this.parseTimeString(timeWindow.quietHours.end);
        
        if (this.isInQuietHours(hour, quietStart, quietEnd)) {
          return false;
        }
      }

      return true;
    } catch (error) {
      logger.error('Failed to check time constraints', { triggerId: trigger.id, error });
      return true; // Allow on error
    }
  }

  /**
   * Parse time string (e.g., "22:00") to hour number
   */
  private parseTimeString(timeStr: string): number {
    const parts = timeStr.split(':');
    return parseInt(parts[0]);
  }

  /**
   * Check if current hour is in quiet hours
   */
  private isInQuietHours(currentHour: number, quietStart: number, quietEnd: number): boolean {
    if (quietStart <= quietEnd) {
      return currentHour >= quietStart && currentHour <= quietEnd;
    } else {
      // Quiet hours span midnight
      return currentHour >= quietStart || currentHour <= quietEnd;
    }
  }

  /**
   * Find appropriate template for trigger
   */
  private async findTemplate(trigger: NotificationTrigger): Promise<any> {
    try {
      // Look for templates that match the trigger type
      const templates = await db.select()
        .from(notificationTemplates)
        .where(and(
          eq(notificationTemplates.isActive, true),
          or(
            eq(notificationTemplates.type, trigger.slug),
            eq(notificationTemplates.isDefault, true)
          )
        ));

      // Prefer specific template, fallback to default
      const specificTemplate = templates.find(t => t.type === trigger.slug);
      const defaultTemplate = templates.find(t => t.isDefault);
      
      return specificTemplate || defaultTemplate || templates[0];
    } catch (error) {
      logger.error('Failed to find template', { triggerId: trigger.id, error });
      return null;
    }
  }

  /**
   * Schedule notification for delivery
   */
  private async scheduleNotification(
    trigger: NotificationTrigger, 
    template: any, 
    event: TriggerEvent
  ) {
    try {
      const scheduledFor = new Date(Date.now() + ((trigger.delay || 0) * 60 * 1000));
      
      await notificationEngine.sendNotification({
        templateSlug: template.slug,
        recipientId: event.userId || event.sessionId!,
        data: event.data,
        scheduledFor,
        priority: trigger.priority as any,
        triggerId: trigger.id
      });

    } catch (error) {
      logger.error('Failed to schedule notification', { 
        triggerId: trigger.id, 
        templateId: template.id,
        error 
      });
    }
  }

  /**
   * Register common event triggers
   */
  async registerEventTriggers() {
    const commonTriggers = [
      {
        slug: 'user_signup',
        name: 'User Signup Welcome',
        eventName: 'user_signup',
        triggerType: 'event',
        conditions: { rules: [], logic: 'AND' },
        channelPriority: ['email', 'push'],
        delay: 0,
        isActive: true
      },
      {
        slug: 'quiz_abandoned',
        name: 'Quiz Abandonment Reminder',
        eventName: 'quiz_abandoned',
        triggerType: 'event',
        conditions: { 
          rules: [
            { field: 'data.completion_percentage', operator: 'less_than', value: 100 }
          ], 
          logic: 'AND' 
        },
        channelPriority: ['email', 'push', 'in_app'],
        delay: 60, // 1 hour delay
        isActive: true
      },
      {
        slug: 'lead_capture',
        name: 'Lead Capture Follow-up',
        eventName: 'lead_captured',
        triggerType: 'event',
        conditions: { rules: [], logic: 'AND' },
        channelPriority: ['email'],
        delay: 5, // 5 minutes delay
        isActive: true
      },
      {
        slug: 'weekly_digest',
        name: 'Weekly Content Digest',
        eventName: 'weekly_digest',
        triggerType: 'schedule',
        conditions: { rules: [], logic: 'AND' },
        timeWindow: {
          allowedDays: [1], // Monday
          allowedHours: [9, 10, 11] // 9-11 AM
        },
        channelPriority: ['email'],
        isActive: true
      }
    ];

    for (const triggerData of commonTriggers) {
      try {
        await db.insert(notificationTriggers)
          .values(triggerData)
          .onConflictDoNothing();
      } catch (error) {
        logger.error('Failed to register trigger', { slug: triggerData.slug, error });
      }
    }

    await this.loadTriggers(); // Reload triggers
  }

  /**
   * Manual trigger for admin/testing
   */
  async triggerManual(triggerSlug: string, userId: string, data?: Record<string, any>) {
    const event: TriggerEvent = {
      eventName: 'manual_trigger',
      userId,
      data: { triggerSlug, ...data },
      timestamp: new Date()
    };

    await this.processEvent(event);
  }
}

// Export both class and singleton instance
export { TriggerEngine };
export const triggerEngine = new TriggerEngine();