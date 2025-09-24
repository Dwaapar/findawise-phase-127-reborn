import { db } from "../../db";
import { 
  notificationTemplates, 
  notificationTriggers, 
  notificationCampaigns,
  notificationQueue,
  userNotificationPreferences
} from "@shared/notificationTables";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { logger } from "../../utils/logger";
import { notificationEngine } from "./notificationEngine";
import { triggerEngine } from "./triggerEngine";

export interface LifecycleStage {
  name: string;
  description: string;
  triggers: string[];
  delay: number; // minutes
  conditions?: any[];
  targetSegments?: string[];
}

export interface UserJourney {
  userId: string;
  journeyType: string;
  currentStage: string;
  startedAt: Date;
  lastStageAt: Date;
  completedStages: string[];
  metadata: Record<string, any>;
}

export interface LifecycleTemplate {
  id: string;
  name: string;
  description: string;
  journeyType: string;
  stages: LifecycleStage[];
  isActive: boolean;
}

class LifecycleEngine {
  private lifecycleTemplates: Map<string, LifecycleTemplate> = new Map();
  private userJourneys: Map<string, UserJourney> = new Map();

  constructor() {
    this.initializeLifecycleTemplates();
    this.startJourneyProcessor();
  }

  /**
   * Initialize predefined lifecycle templates
   */
  private initializeLifecycleTemplates() {
    // User Onboarding Journey
    const onboardingJourney: LifecycleTemplate = {
      id: 'user_onboarding',
      name: 'User Onboarding Journey',
      description: 'Complete user onboarding experience from signup to activation',
      journeyType: 'onboarding',
      stages: [
        {
          name: 'welcome',
          description: 'Welcome new user immediately after signup',
          triggers: ['user_signup'],
          delay: 0,
          conditions: []
        },
        {
          name: 'profile_setup',
          description: 'Encourage profile completion',
          triggers: ['profile_incomplete'],
          delay: 60, // 1 hour
          conditions: [
            { field: 'profile.completeness', operator: 'less_than', value: 50 }
          ]
        },
        {
          name: 'first_quiz',
          description: 'Guide user to take their first quiz',
          triggers: ['quiz_reminder'],
          delay: 1440, // 24 hours
          conditions: [
            { field: 'quiz.completed_count', operator: 'equals', value: 0 }
          ]
        },
        {
          name: 'feature_discovery',
          description: 'Introduce key features and tools',
          triggers: ['feature_showcase'],
          delay: 4320, // 3 days
          conditions: []
        },
        {
          name: 'engagement_check',
          description: 'Check user engagement and provide help',
          triggers: ['engagement_followup'],
          delay: 10080, // 7 days
          conditions: [
            { field: 'engagement.weekly_visits', operator: 'less_than', value: 3 }
          ]
        }
      ],
      isActive: true
    };

    // Lead Nurturing Journey
    const leadNurturingJourney: LifecycleTemplate = {
      id: 'lead_nurturing',
      name: 'Lead Nurturing Campaign',
      description: 'Convert leads through educational content and offers',
      journeyType: 'lead_nurturing',
      stages: [
        {
          name: 'lead_magnet_delivery',
          description: 'Deliver promised lead magnet content',
          triggers: ['lead_captured'],
          delay: 5, // 5 minutes
          conditions: []
        },
        {
          name: 'educational_content_1',
          description: 'First educational email in sequence',
          triggers: ['education_drip_1'],
          delay: 1440, // 1 day
          conditions: []
        },
        {
          name: 'social_proof',
          description: 'Share testimonials and case studies',
          triggers: ['social_proof_share'],
          delay: 2880, // 2 days
          conditions: []
        },
        {
          name: 'educational_content_2',
          description: 'Second educational email with tools',
          triggers: ['education_drip_2'],
          delay: 4320, // 3 days
          conditions: []
        },
        {
          name: 'soft_pitch',
          description: 'Soft introduction of premium offerings',
          triggers: ['soft_pitch_intro'],
          delay: 7200, // 5 days
          conditions: []
        },
        {
          name: 'special_offer',
          description: 'Limited time special offer',
          triggers: ['special_offer_launch'],
          delay: 10080, // 7 days
          conditions: [
            { field: 'engagement.open_rate', operator: 'greater_than', value: 0.25 }
          ]
        }
      ],
      isActive: true
    };

    // Quiz Abandonment Recovery
    const quizAbandonmentJourney: LifecycleTemplate = {
      id: 'quiz_abandonment',
      name: 'Quiz Abandonment Recovery',
      description: 'Re-engage users who started but didn\'t complete quizzes',
      journeyType: 're_engagement',
      stages: [
        {
          name: 'immediate_reminder',
          description: 'Immediate gentle reminder to complete quiz',
          triggers: ['quiz_abandoned'],
          delay: 60, // 1 hour
          conditions: []
        },
        {
          name: 'value_reminder',
          description: 'Remind of quiz benefits and personalized results',
          triggers: ['quiz_value_reminder'],
          delay: 1440, // 1 day
          conditions: [
            { field: 'quiz.completion_percentage', operator: 'greater_than', value: 25 }
          ]
        },
        {
          name: 'alternative_content',
          description: 'Offer alternative valuable content',
          triggers: ['alternative_content_offer'],
          delay: 4320, // 3 days
          conditions: []
        }
      ],
      isActive: true
    };

    // Retention & Re-engagement Journey
    const retentionJourney: LifecycleTemplate = {
      id: 'retention_reengagement',
      name: 'User Retention & Re-engagement',
      description: 'Win back inactive users and increase retention',
      journeyType: 'retention',
      stages: [
        {
          name: 'inactivity_check',
          description: 'Detect user inactivity patterns',
          triggers: ['inactivity_detected'],
          delay: 10080, // 7 days of inactivity
          conditions: [
            { field: 'last_active', operator: 'less_than', value: '7_days_ago' }
          ]
        },
        {
          name: 'we_miss_you',
          description: 'Personalized "we miss you" message',
          triggers: ['we_miss_you'],
          delay: 20160, // 14 days
          conditions: []
        },
        {
          name: 'new_features',
          description: 'Showcase new features and improvements',
          triggers: ['new_features_showcase'],
          delay: 30240, // 21 days
          conditions: []
        },
        {
          name: 'win_back_offer',
          description: 'Special win-back offer or incentive',
          triggers: ['win_back_offer'],
          delay: 43200, // 30 days
          conditions: []
        }
      ],
      isActive: true
    };

    // Premium Conversion Journey
    const conversionJourney: LifecycleTemplate = {
      id: 'premium_conversion',
      name: 'Premium Conversion Journey',
      description: 'Convert free users to premium subscribers',
      journeyType: 'conversion',
      stages: [
        {
          name: 'value_demonstration',
          description: 'Show value of premium features',
          triggers: ['premium_value_demo'],
          delay: 7200, // 5 days after signup
          conditions: [
            { field: 'engagement.session_count', operator: 'greater_than', value: 3 }
          ]
        },
        {
          name: 'limited_access',
          description: 'Show what they\'re missing with limited access',
          triggers: ['limited_access_reminder'],
          delay: 14400, // 10 days
          conditions: []
        },
        {
          name: 'trial_offer',
          description: 'Offer free trial of premium features',
          triggers: ['free_trial_offer'],
          delay: 21600, // 15 days
          conditions: [
            { field: 'premium.trial_used', operator: 'equals', value: false }
          ]
        },
        {
          name: 'urgency_create',
          description: 'Create urgency with limited time offer',
          triggers: ['urgency_offer'],
          delay: 28800, // 20 days
          conditions: []
        }
      ],
      isActive: true
    };

    // Store templates
    this.lifecycleTemplates.set('user_onboarding', onboardingJourney);
    this.lifecycleTemplates.set('lead_nurturing', leadNurturingJourney);
    this.lifecycleTemplates.set('quiz_abandonment', quizAbandonmentJourney);
    this.lifecycleTemplates.set('retention_reengagement', retentionJourney);
    this.lifecycleTemplates.set('premium_conversion', conversionJourney);

    logger.info('Lifecycle templates initialized', {
      component: 'LifecycleEngine',
      templateCount: this.lifecycleTemplates.size
    });
  }

  /**
   * Start a user journey
   */
  async startJourney(userId: string, journeyType: string, metadata: Record<string, any> = {}) {
    try {
      const template = this.lifecycleTemplates.get(journeyType);
      if (!template || !template.isActive) {
        logger.warn('Journey template not found or inactive', { journeyType });
        return false;
      }

      // Check if user already has an active journey of this type
      const existingJourney = this.userJourneys.get(`${userId}_${journeyType}`);
      if (existingJourney) {
        logger.info('User already has active journey', { userId, journeyType });
        return false;
      }

      // Create new journey
      const journey: UserJourney = {
        userId,
        journeyType,
        currentStage: template.stages[0].name,
        startedAt: new Date(),
        lastStageAt: new Date(),
        completedStages: [],
        metadata
      };

      this.userJourneys.set(`${userId}_${journeyType}`, journey);

      // Schedule first stage
      await this.scheduleStage(journey, template.stages[0]);

      logger.info('User journey started', {
        component: 'LifecycleEngine',
        userId,
        journeyType,
        firstStage: template.stages[0].name
      });

      return true;
    } catch (error) {
      logger.error('Failed to start user journey', { userId, journeyType, error });
      return false;
    }
  }

  /**
   * Process user event and advance journeys
   */
  async processUserEvent(userId: string, eventName: string, eventData: Record<string, any> = {}) {
    try {
      // Find all active journeys for this user
      const userJourneys = Array.from(this.userJourneys.entries())
        .filter(([key, journey]) => key.startsWith(userId))
        .map(([key, journey]) => journey);

      for (const journey of userJourneys) {
        const template = this.lifecycleTemplates.get(journey.journeyType);
        if (!template) continue;

        // Check if event should advance this journey
        const currentStageIndex = template.stages.findIndex(stage => stage.name === journey.currentStage);
        if (currentStageIndex === -1) continue;

        // Check for completion events
        if (await this.shouldCompleteJourney(journey, eventName, eventData)) {
          await this.completeJourney(journey);
          continue;
        }

        // Check for stage advancement
        if (await this.shouldAdvanceStage(journey, template, eventName, eventData)) {
          await this.advanceToNextStage(journey, template);
        }
      }
    } catch (error) {
      logger.error('Failed to process user event for journeys', { userId, eventName, error });
    }
  }

  /**
   * Schedule a lifecycle stage
   */
  private async scheduleStage(journey: UserJourney, stage: LifecycleStage) {
    try {
      // Check stage conditions
      if (stage.conditions && !await this.evaluateStageConditions(journey, stage.conditions)) {
        logger.info('Stage conditions not met, skipping', {
          userId: journey.userId,
          stage: stage.name
        });
        return;
      }

      // Schedule notifications for this stage
      for (const triggerSlug of stage.triggers) {
        const scheduledFor = new Date(Date.now() + (stage.delay * 60 * 1000));

        await triggerEngine.processEvent({
          eventName: triggerSlug,
          userId: journey.userId,
          data: {
            journeyType: journey.journeyType,
            stage: stage.name,
            ...journey.metadata
          },
          timestamp: scheduledFor
        });
      }

      logger.info('Lifecycle stage scheduled', {
        component: 'LifecycleEngine',
        userId: journey.userId,
        stage: stage.name,
        triggerCount: stage.triggers.length,
        delay: stage.delay
      });

    } catch (error) {
      logger.error('Failed to schedule lifecycle stage', {
        userId: journey.userId,
        stage: stage.name,
        error
      });
    }
  }

  /**
   * Evaluate stage conditions
   */
  private async evaluateStageConditions(journey: UserJourney, conditions: any[]): Promise<boolean> {
    try {
      // Get user data for condition evaluation
      const userData = await this.getUserData(journey.userId);
      
      for (const condition of conditions) {
        const value = this.getNestedValue(userData, condition.field);
        
        if (!this.evaluateCondition(value, condition.operator, condition.value)) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      logger.error('Failed to evaluate stage conditions', { error });
      return false;
    }
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(value: any, operator: string, expectedValue: any): boolean {
    switch (operator) {
      case 'equals':
        return value === expectedValue;
      case 'not_equals':
        return value !== expectedValue;
      case 'greater_than':
        return Number(value) > Number(expectedValue);
      case 'less_than':
        return Number(value) < Number(expectedValue);
      case 'contains':
        return String(value).includes(String(expectedValue));
      case 'exists':
        return value !== undefined && value !== null;
      default:
        return false;
    }
  }

  /**
   * Get user data for conditions
   */
  private async getUserData(userId: string): Promise<any> {
    try {
      // This would integrate with user profile, analytics, etc.
      // For now, return basic structure
      return {
        profile: {
          completeness: 50,
        },
        quiz: {
          completed_count: 0,
          completion_percentage: 0
        },
        engagement: {
          weekly_visits: 2,
          session_count: 5,
          open_rate: 0.3
        },
        premium: {
          trial_used: false
        },
        last_active: new Date()
      };
    } catch (error) {
      return {};
    }
  }

  /**
   * Check if journey should be completed
   */
  private async shouldCompleteJourney(journey: UserJourney, eventName: string, eventData: any): Promise<boolean> {
    // Define completion events for different journey types
    const completionEvents = {
      'onboarding': ['profile_completed', 'first_quiz_completed', 'premium_signup'],
      'lead_nurturing': ['premium_signup', 'high_engagement_achieved'],
      'quiz_abandonment': ['quiz_completed', 'premium_signup'],
      'retention': ['user_reactivated', 'premium_signup'],
      'conversion': ['premium_signup', 'trial_started']
    };

    const events = completionEvents[journey.journeyType as keyof typeof completionEvents] || [];
    return events.includes(eventName);
  }

  /**
   * Check if should advance to next stage
   */
  private async shouldAdvanceStage(
    journey: UserJourney, 
    template: LifecycleTemplate, 
    eventName: string, 
    eventData: any
  ): Promise<boolean> {
    const currentStageIndex = template.stages.findIndex(stage => stage.name === journey.currentStage);
    if (currentStageIndex === -1 || currentStageIndex >= template.stages.length - 1) {
      return false;
    }

    // Check if enough time has passed since last stage
    const currentStage = template.stages[currentStageIndex];
    const timeSinceLastStage = Date.now() - journey.lastStageAt.getTime();
    const requiredDelay = currentStage.delay * 60 * 1000; // Convert to milliseconds

    return timeSinceLastStage >= requiredDelay;
  }

  /**
   * Advance journey to next stage
   */
  private async advanceToNextStage(journey: UserJourney, template: LifecycleTemplate) {
    try {
      const currentStageIndex = template.stages.findIndex(stage => stage.name === journey.currentStage);
      if (currentStageIndex >= template.stages.length - 1) {
        // Journey completed
        await this.completeJourney(journey);
        return;
      }

      const nextStage = template.stages[currentStageIndex + 1];
      
      // Update journey
      journey.completedStages.push(journey.currentStage);
      journey.currentStage = nextStage.name;
      journey.lastStageAt = new Date();

      // Schedule next stage
      await this.scheduleStage(journey, nextStage);

      logger.info('Journey advanced to next stage', {
        component: 'LifecycleEngine',
        userId: journey.userId,
        journeyType: journey.journeyType,
        newStage: nextStage.name
      });

    } catch (error) {
      logger.error('Failed to advance journey stage', {
        userId: journey.userId,
        journeyType: journey.journeyType,
        error
      });
    }
  }

  /**
   * Complete a user journey
   */
  private async completeJourney(journey: UserJourney) {
    try {
      // Mark final stage as completed
      if (!journey.completedStages.includes(journey.currentStage)) {
        journey.completedStages.push(journey.currentStage);
      }

      // Remove from active journeys
      this.userJourneys.delete(`${journey.userId}_${journey.journeyType}`);

      // Log completion
      logger.info('User journey completed', {
        component: 'LifecycleEngine',
        userId: journey.userId,
        journeyType: journey.journeyType,
        duration: Date.now() - journey.startedAt.getTime(),
        completedStages: journey.completedStages.length
      });

      // Trigger completion event
      await triggerEngine.processEvent({
        eventName: 'journey_completed',
        userId: journey.userId,
        data: {
          journeyType: journey.journeyType,
          completedStages: journey.completedStages,
          duration: Date.now() - journey.startedAt.getTime()
        }
      });

    } catch (error) {
      logger.error('Failed to complete journey', {
        userId: journey.userId,
        journeyType: journey.journeyType,
        error
      });
    }
  }

  /**
   * Start journey processor for time-based advancement
   */
  private startJourneyProcessor() {
    setInterval(async () => {
      try {
        await this.processTimeBasedAdvancements();
      } catch (error) {
        logger.error('Journey processor error', { error });
      }
    }, 300000); // Check every 5 minutes
  }

  /**
   * Process time-based journey advancements
   */
  private async processTimeBasedAdvancements() {
    const now = Date.now();

    for (const [key, journey] of this.userJourneys.entries()) {
      const template = this.lifecycleTemplates.get(journey.journeyType);
      if (!template) continue;

      const currentStageIndex = template.stages.findIndex(stage => stage.name === journey.currentStage);
      if (currentStageIndex === -1 || currentStageIndex >= template.stages.length - 1) continue;

      const currentStage = template.stages[currentStageIndex];
      const timeSinceLastStage = now - journey.lastStageAt.getTime();
      const requiredDelay = currentStage.delay * 60 * 1000;

      if (timeSinceLastStage >= requiredDelay) {
        await this.advanceToNextStage(journey, template);
      }
    }
  }

  /**
   * Get journey status for a user
   */
  async getUserJourneyStatus(userId: string): Promise<UserJourney[]> {
    return Array.from(this.userJourneys.entries())
      .filter(([key]) => key.startsWith(userId))
      .map(([key, journey]) => journey);
  }

  /**
   * Get available journey templates
   */
  getJourneyTemplates(): LifecycleTemplate[] {
    return Array.from(this.lifecycleTemplates.values());
  }

  /**
   * Pause a user journey
   */
  async pauseJourney(userId: string, journeyType: string): Promise<boolean> {
    const key = `${userId}_${journeyType}`;
    const journey = this.userJourneys.get(key);
    
    if (journey) {
      journey.metadata.paused = true;
      journey.metadata.pausedAt = new Date();
      return true;
    }
    
    return false;
  }

  /**
   * Resume a paused journey
   */
  async resumeJourney(userId: string, journeyType: string): Promise<boolean> {
    const key = `${userId}_${journeyType}`;
    const journey = this.userJourneys.get(key);
    
    if (journey && journey.metadata.paused) {
      delete journey.metadata.paused;
      delete journey.metadata.pausedAt;
      
      // Adjust timing based on pause duration
      const pauseDuration = Date.now() - new Date(journey.metadata.pausedAt).getTime();
      journey.lastStageAt = new Date(journey.lastStageAt.getTime() + pauseDuration);
      
      return true;
    }
    
    return false;
  }
}

// Export both class and singleton instance
export { LifecycleEngine };
export const lifecycleEngine = new LifecycleEngine();