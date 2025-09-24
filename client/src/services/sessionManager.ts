/**
 * Client-Side Session Manager - Billion-Dollar Grade
 * Automatic session initialization, event tracking, privacy compliance
 */

import { v4 as uuidv4 } from 'uuid';

export interface SessionConfig {
  trackingConsent: boolean;
  personalizationConsent: boolean;
  analyticsConsent: boolean;
  marketingConsent: boolean;
  dataRetentionDays: number;
}

export interface PersonalizationData {
  archetype?: string;
  engagementLevel: 'low' | 'medium' | 'high';
  conversionPropensity: number;
  recommendedOffers: any[];
  personalizedContent: any[];
}

export interface SessionData {
  sessionId: string;
  userId?: string;
  startTime: Date;
  lastActivity: Date;
  pageViews: number;
  interactions: number;
  preferences: Record<string, any>;
  segment: string;
  personalizationFlags: Record<string, any>;
}

class SessionManager {
  private static instance: SessionManager;
  private sessionId: string;
  private userId?: string;
  private config: SessionConfig;
  private initialized = false;
  private eventQueue: Array<{ type: string; data: any; timestamp: Date }> = [];
  private syncTimeout?: NodeJS.Timeout;
  private personalizationData?: PersonalizationData;
  private readonly SYNC_INTERVAL = 30000; // 30 seconds
  private readonly HEARTBEAT_INTERVAL = 60000; // 1 minute

  private constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.config = this.loadPrivacySettings();
  }

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * INITIALIZATION AND PRIVACY COMPLIANCE
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Check for existing consent
      const hasConsent = this.hasValidConsent();
      
      if (!hasConsent) {
        // Show privacy consent banner if needed
        this.showPrivacyConsentBanner();
        return;
      }

      // Initialize session with backend
      await this.initializeWithBackend();
      
      // Start event tracking
      this.startEventTracking();
      
      // Start sync cycle
      this.startSyncCycle();
      
      // Start heartbeat
      this.startHeartbeat();
      
      // Load personalization data
      await this.loadPersonalizationData();

      this.initialized = true;
      console.log('🎯 Session Manager initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize Session Manager:', error);
    }
  }

  private getOrCreateSessionId(): string {
    let sessionId = localStorage.getItem('findawise_session_id');
    
    if (!sessionId) {
      sessionId = uuidv4();
      localStorage.setItem('findawise_session_id', sessionId);
    }
    
    return sessionId;
  }

  private loadPrivacySettings(): SessionConfig {
    const defaultConfig: SessionConfig = {
      trackingConsent: false,
      personalizationConsent: false,
      analyticsConsent: false,
      marketingConsent: false,
      dataRetentionDays: 365,
    };

    const stored = localStorage.getItem('findawise_privacy_settings');
    return stored ? { ...defaultConfig, ...JSON.parse(stored) } : defaultConfig;
  }

  private hasValidConsent(): boolean {
    const consentDate = localStorage.getItem('findawise_consent_date');
    if (!consentDate) return false;

    const consentTime = new Date(consentDate);
    const now = new Date();
    const daysSinceConsent = (now.getTime() - consentTime.getTime()) / (1000 * 60 * 60 * 24);

    return daysSinceConsent < this.config.dataRetentionDays && this.config.trackingConsent;
  }

  private showPrivacyConsentBanner(): void {
    // This would integrate with your consent banner component
    const event = new CustomEvent('showPrivacyBanner', {
      detail: { sessionManager: this }
    });
    window.dispatchEvent(event);
  }

  /**
   * PRIVACY CONSENT MANAGEMENT
   */
  async updatePrivacyConsent(config: Partial<SessionConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    localStorage.setItem('findawise_privacy_settings', JSON.stringify(this.config));
    localStorage.setItem('findawise_consent_date', new Date().toISOString());

    // Send consent to backend
    if (this.config.trackingConsent) {
      await this.sendConsentToBackend();
      
      // Initialize session now that we have consent
      if (!this.initialized) {
        await this.initialize();
      }
    }
  }

  private async sendConsentToBackend(): Promise<void> {
    try {
      await fetch(`/api/session/${this.sessionId}/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...this.config,
          consentTimestamp: new Date().toISOString(),
          ipAddress: await this.getClientIP(),
          userAgent: navigator.userAgent,
        }),
      });
    } catch (error) {
      console.error('Failed to send consent to backend:', error);
    }
  }

  /**
   * SESSION INITIALIZATION AND MANAGEMENT
   */
  private async initializeWithBackend(): Promise<void> {
    try {
      const deviceInfo = this.getDeviceInfo();
      const location = await this.getLocationInfo();

      const response = await fetch('/api/session/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          userId: this.userId,
          deviceInfo,
          location,
          fingerprint: await this.generateDeviceFingerprint(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to initialize session with backend');
      }

      const sessionData = await response.json();
      console.log('✅ Session initialized with backend:', sessionData.data);

    } catch (error) {
      console.error('❌ Backend session initialization failed:', error);
    }
  }

  private getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
    };
  }

  private async getLocationInfo() {
    try {
      // Use IP-based geolocation service
      const response = await fetch('/api/geolocation/ip');
      return await response.json();
    } catch (error) {
      return { country: 'Unknown', region: 'Unknown', city: 'Unknown' };
    }
  }

  private async generateDeviceFingerprint(): Promise<string> {
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 'unknown',
      navigator.deviceMemory || 'unknown',
    ];

    const fingerprint = btoa(components.join('|'));
    return fingerprint.substring(0, 32); // Truncate for storage
  }

  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('/api/client-ip');
      const data = await response.json();
      return data.ip || 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * EVENT TRACKING AND ANALYTICS
   */
  private startEventTracking(): void {
    // Page view tracking
    this.trackEvent('page_view', {
      url: window.location.href,
      title: document.title,
      referrer: document.referrer,
    });

    // Page visibility tracking
    document.addEventListener('visibilitychange', () => {
      this.trackEvent('page_visibility', {
        visible: !document.hidden,
        timestamp: new Date().toISOString(),
      });
    });

    // Scroll depth tracking
    let maxScrollDepth = 0;
    window.addEventListener('scroll', () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      );
      
      if (scrollPercent > maxScrollDepth) {
        maxScrollDepth = scrollPercent;
        if (scrollPercent % 25 === 0) { // Track at 25%, 50%, 75%, 100%
          this.trackEvent('scroll_depth', { depth: scrollPercent });
        }
      }
    });

    // Click tracking
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const clickData = {
        tagName: target.tagName,
        className: target.className,
        id: target.id,
        text: target.textContent?.substring(0, 100),
        href: target.getAttribute('href'),
        x: event.clientX,
        y: event.clientY,
      };
      
      this.trackEvent('click', clickData);
    });

    // Form tracking
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      this.trackEvent('form_submit', {
        action: form.action,
        method: form.method,
        formId: form.id,
        fieldCount: form.elements.length,
      });
    });

    // Time on page tracking
    let startTime = Date.now();
    window.addEventListener('beforeunload', () => {
      const timeOnPage = Date.now() - startTime;
      this.trackEvent('time_on_page', { duration: timeOnPage });
    });
  }

  trackEvent(eventType: string, eventData: any = {}): void {
    if (!this.config.trackingConsent) return;

    const event = {
      type: eventType,
      data: {
        ...eventData,
        sessionId: this.sessionId,
        userId: this.userId,
        timestamp: new Date().toISOString(),
        url: window.location.href,
      },
      timestamp: new Date(),
    };

    this.eventQueue.push(event);
    
    // Immediate sync for important events
    const immediateEvents = ['quiz_answer', 'affiliate_click', 'cta_click', 'form_submit'];
    if (immediateEvents.includes(eventType)) {
      this.syncEvents();
    }
  }

  /**
   * DATA SYNCHRONIZATION
   */
  private startSyncCycle(): void {
    this.syncTimeout = setInterval(() => {
      this.syncEvents();
    }, this.SYNC_INTERVAL);
  }

  private async syncEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    try {
      const events = [...this.eventQueue];
      this.eventQueue = []; // Clear queue

      await fetch('/api/session/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
      });

      console.log(`📊 Synced ${events.length} events to backend`);

    } catch (error) {
      console.error('❌ Failed to sync events:', error);
      // Re-add failed events back to queue
      this.eventQueue.unshift(...this.eventQueue);
    }
  }

  private startHeartbeat(): void {
    setInterval(async () => {
      if (!this.config.trackingConsent) return;

      try {
        await fetch(`/api/session/${this.sessionId}/heartbeat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timestamp: new Date().toISOString(),
            url: window.location.href,
          }),
        });
      } catch (error) {
        console.error('❌ Heartbeat failed:', error);
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  /**
   * PERSONALIZATION AND RECOMMENDATIONS
   */
  private async loadPersonalizationData(): Promise<void> {
    try {
      const response = await fetch(`/api/session/${this.sessionId}/personalization`);
      if (response.ok) {
        this.personalizationData = await response.json();
        
        // Dispatch personalization update event
        const event = new CustomEvent('personalizationUpdate', {
          detail: this.personalizationData
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error('❌ Failed to load personalization data:', error);
    }
  }

  getPersonalizationData(): PersonalizationData | undefined {
    return this.personalizationData;
  }

  async updatePreferences(preferences: Record<string, any>): Promise<void> {
    try {
      await fetch(`/api/session/${this.sessionId}/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences }),
      });

      // Reload personalization data
      await this.loadPersonalizationData();
      
    } catch (error) {
      console.error('❌ Failed to update preferences:', error);
    }
  }

  /**
   * QUIZ AND ARCHETYPE TRACKING
   */
  trackQuizAnswer(quizId: string, questionId: string, answer: any): void {
    this.trackEvent('quiz_answer', {
      quizId,
      questionId,
      answer,
      progressTimestamp: new Date().toISOString(),
    });
  }

  trackQuizCompletion(quizId: string, results: any): void {
    this.trackEvent('quiz_completion', {
      quizId,
      results,
      completedAt: new Date().toISOString(),
    });
  }

  /**
   * AFFILIATE AND CTA TRACKING
   */
  trackAffiliateClick(offerId: string, slug: string, url: string): void {
    this.trackEvent('affiliate_click', {
      offerId,
      slug,
      url,
      timestamp: new Date().toISOString(),
    });
  }

  trackCTAClick(ctaId: string, ctaType: string, context: string): void {
    this.trackEvent('cta_click', {
      ctaId,
      ctaType,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * DATA EXPORT AND PRIVACY RIGHTS
   */
  async exportData(): Promise<any> {
    try {
      const response = await fetch(`/api/session/${this.sessionId}/export`);
      return await response.json();
    } catch (error) {
      console.error('❌ Failed to export data:', error);
      throw error;
    }
  }

  async deleteData(): Promise<void> {
    try {
      await fetch(`/api/session/${this.sessionId}/delete`, {
        method: 'DELETE',
      });

      // Clear local storage
      localStorage.removeItem('findawise_session_id');
      localStorage.removeItem('findawise_privacy_settings');
      localStorage.removeItem('findawise_consent_date');

      console.log('✅ All session data deleted successfully');
      
    } catch (error) {
      console.error('❌ Failed to delete data:', error);
      throw error;
    }
  }

  /**
   * UTILITY METHODS
   */
  getSessionId(): string {
    return this.sessionId;
  }

  getUserId(): string | undefined {
    return this.userId;
  }

  setUserId(userId: string): void {
    this.userId = userId;
    localStorage.setItem('findawise_user_id', userId);
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getConfig(): SessionConfig {
    return { ...this.config };
  }

  /**
   * CLEANUP
   */
  destroy(): void {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }
    
    // Final sync before destroying
    this.syncEvents();
    
    this.initialized = false;
    console.log('🧹 Session Manager destroyed');
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();

// Auto-initialize when loaded (respects privacy consent)
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    sessionManager.initialize();
  });
}