/**
 * Empire Grade Session Manager
 * Billion-Dollar Federation Session & Personalization Engine Client
 */

import { generateFingerprint } from './utils';

export interface SessionData {
  sessionId: string;
  userId?: string;
  deviceInfo: {
    userAgent: string;
    fingerprint: string;
    screenResolution: string;
    timezone: string;
    language: string;
  };
  personalizationFlags: {
    trackingConsent: boolean;
    marketingConsent: boolean;
    analyticsConsent: boolean;
  };
  location?: {
    country?: string;
    region?: string;
    city?: string;
    timezone?: string;
  };
  segment: string;
  isActive: boolean;
  startTime: Date;
  lastActivity: Date;
  totalTimeOnSite: number;
  pageViews: number;
  interactions: number;
}

export interface BehaviorEvent {
  sessionId: string;
  eventType: string;
  eventData: any;
  pageSlug?: string;
  timestamp: Date;
  userId?: string;
}

class SessionManager {
  private currentSession: SessionData | null = null;
  private sessionTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private baseUrl: string;

  constructor(baseUrl: string = '/api/sessions') {
    this.baseUrl = baseUrl;
    this.init();
  }

  /**
   * Initialize session management
   */
  private async init(): Promise<void> {
    try {
      // Check for existing session
      const existingSessionId = this.getStoredSessionId();
      
      if (existingSessionId) {
        await this.resumeSession(existingSessionId);
      } else {
        await this.createNewSession();
      }

      // Start session heartbeat
      this.startHeartbeat();

      // Set up page unload handlers
      this.setupPageUnloadHandlers();

    } catch (error) {
      console.error('Session initialization failed:', error);
      // Fallback to creating new session
      await this.createNewSession();
    }
  }

  /**
   * Create a new session
   */
  private async createNewSession(): Promise<void> {
    try {
      const sessionData = {
        deviceInfo: this.getDeviceInfo(),
        personalizationFlags: this.getPersonalizationFlags(),
        location: await this.getLocationData(),
      };

      const response = await fetch(`${this.baseUrl}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        this.currentSession = result.data;
        this.storeSessionId(this.currentSession.sessionId);
        console.log('New session created:', this.currentSession.sessionId);
      }

    } catch (error) {
      console.error('Failed to create new session:', error);
    }
  }

  /**
   * Resume existing session
   */
  private async resumeSession(sessionId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${sessionId}`);
      
      if (!response.ok) {
        throw new Error('Session not found');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        this.currentSession = result.data;
        
        // Update last activity
        await this.updateLastActivity();
        console.log('Session resumed:', sessionId);
      } else {
        throw new Error('Invalid session data');
      }

    } catch (error) {
      console.error('Failed to resume session:', error);
      // Create new session if resume fails
      await this.createNewSession();
    }
  }

  /**
   * Track behavior event
   */
  async trackEvent(eventType: string, eventData: any, pageSlug?: string): Promise<void> {
    if (!this.currentSession) {
      console.warn('No active session for event tracking');
      return;
    }

    try {
      const event: BehaviorEvent = {
        sessionId: this.currentSession.sessionId,
        eventType,
        eventData,
        pageSlug,
        timestamp: new Date(),
        userId: this.currentSession.userId,
      };

      const response = await fetch(`${this.baseUrl}/${this.currentSession.sessionId}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        console.error('Failed to track event:', eventType);
      }

      // Update session interactions count
      this.currentSession.interactions++;
      await this.updateLastActivity();

    } catch (error) {
      console.error('Event tracking failed:', error);
    }
  }

  /**
   * Update session with new data
   */
  async updateSession(updates: Partial<SessionData>): Promise<void> {
    if (!this.currentSession) {
      console.warn('No active session to update');
      return;
    }

    try {
      const response = await fetch(`${this.baseUrl}/${this.currentSession.sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          this.currentSession = { ...this.currentSession, ...result.data };
        }
      }

    } catch (error) {
      console.error('Session update failed:', error);
    }
  }

  /**
   * Update last activity timestamp
   */
  private async updateLastActivity(): Promise<void> {
    if (!this.currentSession) return;

    try {
      await fetch(`${this.baseUrl}/${this.currentSession.sessionId}/activity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      this.currentSession.lastActivity = new Date();

    } catch (error) {
      console.error('Failed to update activity:', error);
    }
  }

  /**
   * End current session
   */
  async endSession(): Promise<void> {
    if (!this.currentSession) return;

    try {
      await fetch(`${this.baseUrl}/${this.currentSession.sessionId}/end`, {
        method: 'POST',
      });

      this.clearStoredSessionId();
      this.currentSession = null;

      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }

    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }

  /**
   * Get current session data
   */
  getCurrentSession(): SessionData | null {
    return this.currentSession;
  }

  /**
   * Get session ID
   */
  getSessionId(): string | null {
    return this.currentSession?.sessionId || null;
  }

  /**
   * Set user ID for current session
   */
  async setUserId(userId: string): Promise<void> {
    if (!this.currentSession) return;

    await this.updateSession({ userId });
  }

  /**
   * Update consent preferences
   */
  async updateConsent(consents: Partial<SessionData['personalizationFlags']>): Promise<void> {
    if (!this.currentSession) return;

    const updatedFlags = {
      ...this.currentSession.personalizationFlags,
      ...consents,
    };

    await this.updateSession({
      personalizationFlags: updatedFlags,
    });
  }

  /**
   * Private helper methods
   */
  private getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      fingerprint: generateFingerprint(),
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
    };
  }

  private getPersonalizationFlags() {
    // Check for stored consent preferences
    const storedConsent = localStorage.getItem('empire_session_consent');
    
    if (storedConsent) {
      try {
        return JSON.parse(storedConsent);
      } catch (error) {
        console.error('Failed to parse stored consent:', error);
      }
    }

    // Default consent values
    return {
      trackingConsent: false,
      marketingConsent: false,
      analyticsConsent: false,
    };
  }

  private async getLocationData() {
    try {
      // Use IP-based geolocation or browser API
      const response = await fetch('/api/sessions/location');
      if (response.ok) {
        const location = await response.json();
        return location.data;
      }
    } catch (error) {
      console.error('Failed to get location data:', error);
    }

    return {
      country: 'Unknown',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  private getStoredSessionId(): string | null {
    return sessionStorage.getItem('empire_session_id');
  }

  private storeSessionId(sessionId: string): void {
    sessionStorage.setItem('empire_session_id', sessionId);
  }

  private clearStoredSessionId(): void {
    sessionStorage.removeItem('empire_session_id');
  }

  private startHeartbeat(): void {
    // Send heartbeat every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      this.updateLastActivity();
    }, 30000);
  }

  private setupPageUnloadHandlers(): void {
    // End session on page unload
    window.addEventListener('beforeunload', () => {
      if (this.currentSession) {
        // Use sendBeacon for reliable session end
        navigator.sendBeacon(
          `${this.baseUrl}/${this.currentSession.sessionId}/end`,
          JSON.stringify({ timestamp: new Date().toISOString() })
        );
      }
    });

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.updateLastActivity();
      }
    });
  }
}

// Create singleton instance
export const sessionManager = new SessionManager();

// Auto-track common events
document.addEventListener('DOMContentLoaded', () => {
  sessionManager.trackEvent('page_load', {
    url: window.location.href,
    title: document.title,
    referrer: document.referrer,
  });
});

// Track page views on navigation
let currentUrl = window.location.href;
const observer = new MutationObserver(() => {
  if (window.location.href !== currentUrl) {
    currentUrl = window.location.href;
    sessionManager.trackEvent('page_view', {
      url: currentUrl,
      title: document.title,
    });
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

/**
 * Track affiliate click event
 */
export async function trackAffiliateClick(affiliateId: string, offerData: any): Promise<void> {
  return sessionManager.trackEvent('affiliate_click', {
    affiliateId,
    offerData,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track page view event
 */
export async function trackPageView(pageSlug: string, pageData: any): Promise<void> {
  return sessionManager.trackEvent('page_view', {
    pageSlug,
    pageData,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Get personalization data for current session
 */
export function getPersonalization(): any {
  const session = sessionManager.getCurrentSession();
  if (!session) return {};

  return {
    segment: session.segment,
    deviceType: session.deviceInfo?.screenResolution ? 
      (parseInt(session.deviceInfo.screenResolution.split('x')[0]) > 768 ? 'desktop' : 'mobile') : 'unknown',
    language: session.deviceInfo?.language || 'en',
    hasConsent: session.personalizationFlags?.trackingConsent || false,
    sessionDuration: session.totalTimeOnSite || 0,
  };
}

/**
 * Get recommendations based on current session
 */
export function getRecommendations(): any[] {
  const session = sessionManager.getCurrentSession();
  if (!session) return [];

  // Basic recommendations based on session data
  const recommendations = [];

  if (session.segment === 'high_value') {
    recommendations.push({
      type: 'premium_content',
      title: 'Premium Content Recommendation',
      description: 'Based on your engagement pattern',
    });
  }

  if (session.interactions > 5) {
    recommendations.push({
      type: 'newsletter_signup',
      title: 'Stay Updated',
      description: 'Get the latest insights delivered to your inbox',
    });
  }

  return recommendations;
}

export default sessionManager;