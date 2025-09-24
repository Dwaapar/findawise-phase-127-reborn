// Empire-Grade Session Manager for Affiliate Tracking
// Production-ready session management with enhanced analytics and tracking

export interface Session {
  id: string;
  userId?: string;
  startTime: number;
  lastActivity: number;
  pageViews: number;
  totalDuration: number;
  referrer?: string;
  userAgent?: string;
  deviceFingerprint?: string;
  geoLocation?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  metadata?: Record<string, any>;
}

class SessionManager {
  private session: Session | null = null;
  private pageStartTime: number = Date.now();
  private activityTimer: number | null = null;
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private readonly ACTIVITY_UPDATE_INTERVAL = 10 * 1000; // 10 seconds

  constructor() {
    this.initializeSession();
    this.startActivityTracking();
    this.setupBeforeUnloadHandler();
  }

  private initializeSession(): void {
    try {
      // Try to restore existing session
      const storedSession = localStorage.getItem('empire_session');
      if (storedSession) {
        const parsed = JSON.parse(storedSession) as Session;
        
        // Check if session is still valid
        if (Date.now() - parsed.lastActivity < this.SESSION_TIMEOUT) {
          this.session = {
            ...parsed,
            lastActivity: Date.now(),
            pageViews: parsed.pageViews + 1
          };
          this.saveSession();
          return;
        }
      }

      // Create new session
      this.createNewSession();
    } catch (error) {
      console.warn('Session restoration failed, creating new session:', error);
      this.createNewSession();
    }
  }

  private createNewSession(): void {
    const urlParams = new URLSearchParams(window.location.search);
    
    this.session = {
      id: this.generateSessionId(),
      startTime: Date.now(),
      lastActivity: Date.now(),
      pageViews: 1,
      totalDuration: 0,
      referrer: document.referrer || undefined,
      userAgent: navigator.userAgent,
      utmSource: urlParams.get('utm_source') || undefined,
      utmMedium: urlParams.get('utm_medium') || undefined,
      utmCampaign: urlParams.get('utm_campaign') || undefined,
      metadata: {}
    };

    this.saveSession();
    this.trackSessionStart();
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private saveSession(): void {
    if (this.session) {
      try {
        localStorage.setItem('empire_session', JSON.stringify(this.session));
      } catch (error) {
        console.warn('Failed to save session:', error);
      }
    }
  }

  private startActivityTracking(): void {
    this.activityTimer = window.setInterval(() => {
      this.updateActivity();
    }, this.ACTIVITY_UPDATE_INTERVAL);
  }

  private updateActivity(): void {
    if (this.session) {
      const now = Date.now();
      this.session.lastActivity = now;
      this.session.totalDuration = now - this.session.startTime;
      this.saveSession();
    }
  }

  private setupBeforeUnloadHandler(): void {
    window.addEventListener('beforeunload', () => {
      this.trackSessionEnd();
    });

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.updateActivity();
      }
    });
  }

  private trackSessionStart(): void {
    this.trackEvent('session_start', {
      sessionId: this.session?.id,
      timestamp: Date.now(),
      referrer: this.session?.referrer,
      utmParams: {
        source: this.session?.utmSource,
        medium: this.session?.utmMedium,
        campaign: this.session?.utmCampaign
      }
    });
  }

  private trackSessionEnd(): void {
    if (this.session) {
      this.trackEvent('session_end', {
        sessionId: this.session.id,
        duration: this.session.totalDuration,
        pageViews: this.session.pageViews,
        timestamp: Date.now()
      });
    }
  }

  private trackEvent(eventType: string, data: any): void {
    try {
      // Send to analytics API
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: eventType,
          data,
          sessionId: this.session?.id,
          timestamp: Date.now()
        })
      }).catch(() => {
        // Fail silently for analytics
      });
    } catch (error) {
      console.warn('Event tracking failed:', error);
    }
  }

  // Public API methods
  public getSessionId(): string | null {
    return this.session?.id || null;
  }

  public getUserId(): string | null {
    return this.session?.userId || null;
  }

  public setUserId(userId: string): void {
    if (this.session) {
      this.session.userId = userId;
      this.saveSession();
    }
  }

  public getPageStartTime(): number {
    return this.pageStartTime;
  }

  public updatePageStartTime(): void {
    this.pageStartTime = Date.now();
    if (this.session) {
      this.session.pageViews += 1;
      this.saveSession();
    }
  }

  public setMetadata(key: string, value: any): void {
    if (this.session) {
      this.session.metadata = this.session.metadata || {};
      this.session.metadata[key] = value;
      this.saveSession();
    }
  }

  public getMetadata(key: string): any {
    return this.session?.metadata?.[key];
  }

  public getSession(): Session | null {
    return this.session;
  }

  public extendSession(): void {
    if (this.session) {
      this.session.lastActivity = Date.now();
      this.saveSession();
    }
  }

  public isActive(): boolean {
    if (!this.session) return false;
    return Date.now() - this.session.lastActivity < this.SESSION_TIMEOUT;
  }

  public destroy(): void {
    if (this.activityTimer) {
      clearInterval(this.activityTimer);
    }
    
    this.trackSessionEnd();
    
    try {
      localStorage.removeItem('empire_session');
    } catch (error) {
      console.warn('Failed to clear session:', error);
    }
    
    this.session = null;
  }

  public refresh(): void {
    this.destroy();
    this.initializeSession();
    this.startActivityTracking();
  }
}

// Global session manager instance
export const sessionManager = new SessionManager();

// Helper functions for affiliate tracking
export function trackAffiliateClick(data: any): Promise<void> {
  return fetch('/api/affiliate/track-click', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...data,
      sessionId: sessionManager.getSessionId(),
      userId: sessionManager.getUserId(),
      timestamp: Date.now()
    })
  }).then(() => {}).catch(() => {});
}

export function trackOfferView(offerId: string, data: any = {}): void {
  sessionManager.setMetadata(`offer_${offerId}_viewed`, {
    timestamp: Date.now(),
    ...data
  });
}

export function getOfferInteractions(offerId: string): any {
  return sessionManager.getMetadata(`offer_${offerId}_viewed`);
}

// Export types for use in other components
export type { Session };