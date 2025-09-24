/**
 * Session Utility Functions - Client-Side Session Management Helpers
 * Billion-Dollar Grade Session Management Utilities
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Session tracking utilities
export function trackAffiliateClick(offerId: string, slug: string, url: string) {
  if (typeof window !== 'undefined' && window.sessionManager) {
    window.sessionManager.trackAffiliateClick(offerId, slug, url);
  }
}

export function trackPageView(pageSlug: string, title: string) {
  if (typeof window !== 'undefined' && window.sessionManager) {
    window.sessionManager.trackEvent('page_view', {
      pageSlug,
      title,
      url: window.location.href
    });
  }
}

export function trackCTAClick(ctaId: string, ctaType: string, context: string) {
  if (typeof window !== 'undefined' && window.sessionManager) {
    window.sessionManager.trackCTAClick(ctaId, ctaType, context);
  }
}

export function getPersonalization() {
  if (typeof window !== 'undefined' && window.sessionManager) {
    return window.sessionManager.getPersonalizationData();
  }
  return null;
}

// Extend window type to include sessionManager
declare global {
  interface Window {
    sessionManager?: {
      trackEvent: (eventType: string, data: any) => void;
      trackAffiliateClick: (offerId: string, slug: string, url: string) => void;
      trackCTAClick: (ctaId: string, ctaType: string, context: string) => void;
      getPersonalizationData: () => any;
    };
  }
}