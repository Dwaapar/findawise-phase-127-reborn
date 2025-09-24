/**
 * AnalyticsClient - Sync all frontend and backend events to Empire analytics endpoint
 * Federation-compliant analytics with batch processing and retry logic
 */

import { apiRequest } from './queryClient';

export interface AnalyticsEvent {
  eventType: string;
  eventData: Record<string, any>;
  pageSlug?: string;
  sessionId?: string;
  userId?: string;
  timestamp?: string;
  referrerUrl?: string;
  userAgent?: string;
  ipAddress?: string;
  deviceFingerprint?: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
  customProperties?: Record<string, any>;
}

export interface BehaviorEvent {
  sessionId: string;
  eventType: 'click' | 'scroll' | 'hover' | 'focus' | 'form_submit' | 'page_view' | 'exit_intent';
  target?: string;
  value?: string | number;
  metadata?: Record<string, any>;
  timestamp?: string;
}

export interface ConversionEvent {
  sessionId: string;
  userId?: string;
  eventType: 'lead_capture' | 'purchase' | 'signup' | 'download' | 'affiliate_click';
  value?: number;
  currency?: string;
  productId?: string;
  offerId?: string;
  revenue?: number;
  metadata?: Record<string, any>;
  timestamp?: string;
}

interface AnalyticsConfig {
  batchSize: number;
  flushInterval: number;
  maxRetries: number;
  retryDelay: number;
  endpoints: {
    events: string;
    behaviors: string;
    conversions: string;
  };
  trackingEnabled: boolean;
}

class AnalyticsClientManager {
  private eventQueue: AnalyticsEvent[] = [];
  private behaviorQueue: BehaviorEvent[] = [];
  private conversionQueue: ConversionEvent[] = [];
  private config: AnalyticsConfig;
  private flushTimer: NodeJS.Timeout | null = null;
  private sessionId: string;
  private userId?: string;
  private deviceFingerprint: string;
  private isOnline = true;
  private retryCount = 0;

  constructor() {
    this.config = {
      batchSize: 10,
      flushInterval: 5000, // 5 seconds
      maxRetries: 3,
      retryDelay: 1000,
      endpoints: {
        events: '/api/analytics/events/batch',
        behaviors: '/api/analytics/behaviors',
        conversions: '/api/analytics/conversions',
      },
      trackingEnabled: true,
    };

    this.sessionId = this.generateSessionId();
    this.deviceFingerprint = this.generateDeviceFingerprint();
    
    this.init();
  }

  private init() {
    // Start auto-flush timer
    this.startAutoFlush();
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushAll();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
    
    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flushAll(true); // Synchronous flush
    });
    
    // Track initial page view
    this.trackPageView();
    
    // Set up automatic behavior tracking
    this.setupBehaviorTracking();
  }

  private generateSessionId(): string {
    return 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  private generateDeviceFingerprint(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Fingerprint', 2, 2);
    }
    
    const fingerprint = btoa(JSON.stringify({
      userAgent: navigator.userAgent,
      language: navigator.language,
      languages: navigator.languages,
      platform: navigator.platform,
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      canvas: canvas.toDataURL(),
    }));
    
    return fingerprint.slice(0, 32);
  }

  private setupBehaviorTracking() {
    // Track clicks
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      this.trackBehavior({
        eventType: 'click',
        target: this.getElementSelector(target),
        metadata: {
          x: event.clientX,
          y: event.clientY,
          button: event.button,
        },
      });
    });

    // Track scroll
    let scrollTimer: NodeJS.Timeout;
    document.addEventListener('scroll', () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        this.trackBehavior({
          eventType: 'scroll',
          value: Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100),
          metadata: {
            scrollY: window.scrollY,
            scrollHeight: document.body.scrollHeight,
            viewportHeight: window.innerHeight,
          },
        });
      }, 250);
    });

    // Track form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      this.trackBehavior({
        eventType: 'form_submit',
        target: this.getElementSelector(form),
        metadata: {
          formId: form.id,
          formName: form.name,
          action: form.action,
        },
      });
    });

    // Track exit intent
    document.addEventListener('mouseleave', (event) => {
      if (event.clientY <= 0) {
        this.trackBehavior({
          eventType: 'exit_intent',
          metadata: {
            timeOnPage: Date.now() - this.sessionStartTime,
          },
        });
      }
    });
  }

  private sessionStartTime = Date.now();

  private getElementSelector(element: HTMLElement): string {
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }

  // Public API
  public trackEvent(event: Omit<AnalyticsEvent, 'timestamp' | 'sessionId' | 'deviceFingerprint'>): void {
    if (!this.config.trackingEnabled) return;

    const fullEvent: AnalyticsEvent = {
      ...event,
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: new Date().toISOString(),
      deviceFingerprint: this.deviceFingerprint,
      referrerUrl: document.referrer,
      userAgent: navigator.userAgent,
    };

    this.eventQueue.push(fullEvent);
    
    if (this.eventQueue.length >= this.config.batchSize) {
      this.flushEvents();
    }
  }

  public trackBehavior(behavior: Omit<BehaviorEvent, 'sessionId' | 'timestamp'>): void {
    if (!this.config.trackingEnabled) return;

    const fullBehavior: BehaviorEvent = {
      ...behavior,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
    };

    this.behaviorQueue.push(fullBehavior);
    
    if (this.behaviorQueue.length >= this.config.batchSize) {
      this.flushBehaviors();
    }
  }

  public trackConversion(conversion: Omit<ConversionEvent, 'sessionId' | 'timestamp'>): void {
    if (!this.config.trackingEnabled) return;

    const fullConversion: ConversionEvent = {
      ...conversion,
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: new Date().toISOString(),
    };

    this.conversionQueue.push(fullConversion);
    
    // Conversions are high priority, flush immediately
    this.flushConversions();
  }

  public trackPageView(pageSlug?: string): void {
    this.trackEvent({
      eventType: 'page_view',
      pageSlug: pageSlug || window.location.pathname,
      eventData: {
        url: window.location.href,
        title: document.title,
        referrer: document.referrer,
      },
    });
  }

  public trackQuizStart(quizId: string, quizSlug: string): void {
    this.trackEvent({
      eventType: 'quiz_started',
      pageSlug: `quiz-${quizSlug}`,
      eventData: {
        quizId,
        quizSlug,
      },
    });
  }

  public trackQuizComplete(quizId: string, quizSlug: string, score: number, percentage: number, xpEarned: number): void {
    this.trackEvent({
      eventType: 'quiz_completed',
      pageSlug: `quiz-${quizSlug}`,
      eventData: {
        quizId,
        quizSlug,
        score,
        percentage,
        xpEarned,
        passed: percentage >= 70, // Assuming 70% is passing
      },
    });
  }

  public trackToolUsage(toolId: string, toolSlug: string, inputs: any, outputs: any): void {
    this.trackEvent({
      eventType: 'tool_used',
      pageSlug: `tool-${toolSlug}`,
      eventData: {
        toolId,
        toolSlug,
        hasInputs: Object.keys(inputs).length > 0,
        hasOutputs: Object.keys(outputs).length > 0,
      },
    });
  }

  public trackContentView(contentId: string, contentSlug: string, timeSpent: number): void {
    this.trackEvent({
      eventType: 'content_viewed',
      pageSlug: contentSlug,
      eventData: {
        contentId,
        contentSlug,
        timeSpent,
        readingProgress: this.calculateReadingProgress(),
      },
    });
  }

  public trackAffiliateClick(offerId: string, offerSlug: string, provider: string): void {
    this.trackConversion({
      eventType: 'affiliate_click',
      productId: offerId,
      offerId,
      metadata: {
        offerSlug,
        provider,
        pageSlug: window.location.pathname,
      },
    });
  }

  public trackLeadCapture(formId: string, email: string, metadata?: Record<string, any>): void {
    this.trackConversion({
      eventType: 'lead_capture',
      metadata: {
        formId,
        email: this.hashEmail(email),
        ...metadata,
      },
    });
  }

  public trackDownload(fileId: string, fileName: string, fileType: string): void {
    this.trackConversion({
      eventType: 'download',
      productId: fileId,
      metadata: {
        fileName,
        fileType,
        pageSlug: window.location.pathname,
      },
    });
  }

  private calculateReadingProgress(): number {
    const scrolled = window.scrollY;
    const total = document.body.scrollHeight - window.innerHeight;
    return Math.round((scrolled / total) * 100);
  }

  private hashEmail(email: string): string {
    // Simple hash for privacy
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      const char = email.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  // Flush methods
  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0 || !this.isOnline) return;

    const events = this.eventQueue.splice(0, this.config.batchSize);
    
    try {
      await apiRequest(this.config.endpoints.events, {
        method: 'POST',
        body: { events },
      });
      
      this.retryCount = 0;
    } catch (error) {
      console.error('Failed to flush events:', error);
      
      // Re-add events to queue for retry
      this.eventQueue.unshift(...events);
      
      if (this.retryCount < this.config.maxRetries) {
        this.retryCount++;
        setTimeout(() => this.flushEvents(), this.config.retryDelay * this.retryCount);
      }
    }
  }

  private async flushBehaviors(): Promise<void> {
    if (this.behaviorQueue.length === 0 || !this.isOnline) return;

    const behaviors = this.behaviorQueue.splice(0, this.config.batchSize);
    
    try {
      await apiRequest(this.config.endpoints.behaviors, {
        method: 'POST',
        body: { behaviors },
      });
    } catch (error) {
      console.error('Failed to flush behaviors:', error);
      // Behaviors are less critical, don't retry
    }
  }

  private async flushConversions(): Promise<void> {
    if (this.conversionQueue.length === 0 || !this.isOnline) return;

    const conversions = this.conversionQueue.splice(0, this.config.batchSize);
    
    try {
      await apiRequest(this.config.endpoints.conversions, {
        method: 'POST',
        body: { conversions },
      });
    } catch (error) {
      console.error('Failed to flush conversions:', error);
      
      // Re-add conversions to queue for retry (high priority)
      this.conversionQueue.unshift(...conversions);
      setTimeout(() => this.flushConversions(), this.config.retryDelay);
    }
  }

  public flushAll(synchronous = false): void {
    if (synchronous) {
      // Use sendBeacon for synchronous sending on page unload
      if (navigator.sendBeacon) {
        if (this.eventQueue.length > 0) {
          navigator.sendBeacon(
            this.config.endpoints.events,
            JSON.stringify({ events: this.eventQueue })
          );
        }
        if (this.behaviorQueue.length > 0) {
          navigator.sendBeacon(
            this.config.endpoints.behaviors,
            JSON.stringify({ behaviors: this.behaviorQueue })
          );
        }
        if (this.conversionQueue.length > 0) {
          navigator.sendBeacon(
            this.config.endpoints.conversions,
            JSON.stringify({ conversions: this.conversionQueue })
          );
        }
      }
    } else {
      this.flushEvents();
      this.flushBehaviors();
      this.flushConversions();
    }
  }

  private startAutoFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flushAll();
    }, this.config.flushInterval);
  }

  // Configuration methods
  public updateConfig(newConfig: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart timer if flush interval changed
    if (newConfig.flushInterval && this.flushTimer) {
      clearInterval(this.flushTimer);
      this.startAutoFlush();
    }
  }

  public setUserId(userId: string): void {
    this.userId = userId;
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public getDeviceFingerprint(): string {
    return this.deviceFingerprint;
  }

  public enable(): void {
    this.config.trackingEnabled = true;
  }

  public disable(): void {
    this.config.trackingEnabled = false;
  }

  public isEnabled(): boolean {
    return this.config.trackingEnabled;
  }

  public destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    this.flushAll(true);
    
    this.eventQueue = [];
    this.behaviorQueue = [];
    this.conversionQueue = [];
  }
}

// Singleton instance
export const analyticsClient = new AnalyticsClientManager();

// React hook for analytics
export const useAnalytics = () => {
  return {
    trackEvent: analyticsClient.trackEvent.bind(analyticsClient),
    trackBehavior: analyticsClient.trackBehavior.bind(analyticsClient),
    trackConversion: analyticsClient.trackConversion.bind(analyticsClient),
    trackPageView: analyticsClient.trackPageView.bind(analyticsClient),
    trackQuizStart: analyticsClient.trackQuizStart.bind(analyticsClient),
    trackQuizComplete: analyticsClient.trackQuizComplete.bind(analyticsClient),
    trackToolUsage: analyticsClient.trackToolUsage.bind(analyticsClient),
    trackContentView: analyticsClient.trackContentView.bind(analyticsClient),
    trackAffiliateClick: analyticsClient.trackAffiliateClick.bind(analyticsClient),
    trackLeadCapture: analyticsClient.trackLeadCapture.bind(analyticsClient),
    trackDownload: analyticsClient.trackDownload.bind(analyticsClient),
    setUserId: analyticsClient.setUserId.bind(analyticsClient),
    getSessionId: analyticsClient.getSessionId.bind(analyticsClient),
    enable: analyticsClient.enable.bind(analyticsClient),
    disable: analyticsClient.disable.bind(analyticsClient),
    isEnabled: analyticsClient.isEnabled.bind(analyticsClient),
  };
};

export default analyticsClient;