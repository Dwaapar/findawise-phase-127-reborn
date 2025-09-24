/**
 * Analytics Utilities - Empire Grade
 * Essential tracking functions for personalization and analytics
 */

/**
 * Track affiliate click events
 */
export function trackAffiliateClick(url: string, offerId?: string): void {
  try {
    // Send to analytics engine
    if ((window as any).analyticsSync) {
      (window as any).analyticsSync.track('affiliate_click', {
        url,
        offerId,
        timestamp: Date.now(),
        page: window.location.pathname,
        referrer: document.referrer
      });
    }

    // Send to server
    fetch('/api/analytics/affiliate-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        offerId,
        timestamp: Date.now(),
        page: window.location.pathname,
        referrer: document.referrer,
        userAgent: navigator.userAgent
      })
    }).catch(error => {
      console.warn('Failed to track affiliate click:', error);
    });
  } catch (error) {
    console.warn('Analytics tracking failed:', error);
  }
}

/**
 * Track page views
 */
export function trackPageView(page: string, properties?: Record<string, any>): void {
  try {
    if ((window as any).analyticsSync) {
      (window as any).analyticsSync.track('page_view', {
        page,
        timestamp: Date.now(),
        referrer: document.referrer,
        userAgent: navigator.userAgent,
        ...properties
      });
    }

    fetch('/api/analytics/page-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page,
        timestamp: Date.now(),
        referrer: document.referrer,
        userAgent: navigator.userAgent,
        ...properties
      })
    }).catch(error => {
      console.warn('Failed to track page view:', error);
    });
  } catch (error) {
    console.warn('Page view tracking failed:', error);
  }
}

/**
 * Get personalization data for current user
 */
export async function getPersonalization(context?: string): Promise<any> {
  try {
    const response = await fetch('/api/personalization/get', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context,
        fingerprint: generateFingerprint(),
        timestamp: Date.now()
      })
    });

    if (response.ok) {
      const data = await response.json();
      return data.success ? data.data : {};
    }
  } catch (error) {
    console.warn('Failed to get personalization:', error);
  }
  
  return {};
}

/**
 * Simple fingerprint generation
 */
function generateFingerprint(): string {
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset()
  ].join('|');
  
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return Math.abs(hash).toString(36);
}