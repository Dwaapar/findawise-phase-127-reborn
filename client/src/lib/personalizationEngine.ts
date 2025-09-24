/**
 * Personalization Engine Helper Functions
 * Supporting functions for dynamic content personalization
 */

import { sessionManager } from './sessionManager';

/**
 * Get personalized configuration based on current session
 */
export function getPersonalizedConfig(pageSlug: string): any {
  const session = sessionManager.getCurrentSession();
  if (!session) return {};

  const config = {
    theme: 'default',
    layout: 'standard',
    ctaStyle: 'primary',
    contentDensity: 'medium',
  };

  // Personalize based on device
  const deviceInfo = session.deviceInfo;
  if (deviceInfo?.screenResolution) {
    const screenWidth = parseInt(deviceInfo.screenResolution.split('x')[0]);
    if (screenWidth < 768) {
      config.layout = 'mobile';
      config.contentDensity = 'compact';
    }
  }

  // Personalize based on engagement
  if (session.interactions > 10) {
    config.ctaStyle = 'premium';
  }

  // Personalize based on segment
  if (session.segment === 'high_value') {
    config.theme = 'premium';
  }

  return config;
}

/**
 * Get conversion optimizations for current session
 */
export function getConversionOptimizations(): any {
  const session = sessionManager.getCurrentSession();
  if (!session) return {};

  const optimizations = {
    urgency: false,
    socialProof: false,
    discountOffer: false,
    freeTrialCta: false,
  };

  // Add urgency for engaged users
  if (session.totalTimeOnSite > 300) { // 5 minutes
    optimizations.urgency = true;
  }

  // Add social proof for new visitors
  if (session.pageViews < 3) {
    optimizations.socialProof = true;
  }

  // Add discount for returning visitors
  if (session.pageViews > 5) {
    optimizations.discountOffer = true;
  }

  // Add free trial CTA for high-engagement sessions
  if (session.interactions > 8) {
    optimizations.freeTrialCta = true;
  }

  return optimizations;
}

/**
 * Track personalization effectiveness
 */
export async function trackPersonalizationEvent(eventType: string, personalizations: any): Promise<void> {
  return sessionManager.trackEvent('personalization_applied', {
    eventType,
    personalizations,
    timestamp: new Date().toISOString(),
  });
}