/**
 * Localization Initialization Utility - Billion-Dollar Empire Grade
 * 
 * Complete initialization system for localization with:
 * - Auto-detection and setup
 * - Cultural context integration
 * - Performance optimization
 * - Error handling and fallbacks
 * 
 * @version 2.0.0 - Billion-Dollar Empire Grade
 */

import { LocalizationProvider } from '../hooks/useLocalization';

// Global localization state
let isInitialized = false;
let currentLanguage = 'en';
let culturalContext = 'western-individualistic';

/**
 * Initialize the localization system
 */
export const initializeLocalization = async (): Promise<{
  success: boolean;
  language: string;
  culturalContext: string;
  error?: string;
}> => {
  if (isInitialized) {
    return {
      success: true,
      language: currentLanguage,
      culturalContext
    };
  }

  try {
    // Step 1: Auto-detect language and cultural context
    const detectionResult = await autoDetectLanguageAndCulture();
    
    if (detectionResult.success) {
      currentLanguage = detectionResult.language;
      culturalContext = detectionResult.culturalContext;
    }

    // Step 2: Initialize cultural emotion integration
    await initializeCulturalIntegration(culturalContext);

    // Step 3: Setup performance optimizations
    setupPerformanceOptimizations();

    // Step 4: Initialize analytics tracking
    initializeAnalyticsTracking();

    isInitialized = true;

    return {
      success: true,
      language: currentLanguage,
      culturalContext
    };

  } catch (error) {
    console.error('Failed to initialize localization:', error);
    
    // Return fallback configuration
    return {
      success: false,
      language: 'en',
      culturalContext: 'western-individualistic',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Auto-detect user language and cultural context
 */
const autoDetectLanguageAndCulture = async (): Promise<{
  success: boolean;
  language: string;
  culturalContext: string;
}> => {
  try {
    // Get session ID for tracking
    const sessionId = getOrCreateSessionId();

    // Prepare detection request
    const detectionRequest = {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      sessionId,
      userAgent: navigator.userAgent,
      acceptLanguage: navigator.language,
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      browserLanguages: navigator.languages
    };

    // Call API for auto-detection
    const response = await fetch('/api/enterprise/localization/auto-detect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(detectionRequest)
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        return {
          success: true,
          language: data.data.detectedLanguage,
          culturalContext: data.data.culturalContext
        };
      }
    }

    // Fallback to browser language detection
    return browserFallbackDetection();

  } catch (error) {
    console.warn('Auto-detection failed, using browser fallback:', error);
    return browserFallbackDetection();
  }
};

/**
 * Browser-based fallback detection
 */
const browserFallbackDetection = (): {
  success: boolean;
  language: string;
  culturalContext: string;
} => {
  // Get browser language
  const browserLang = navigator.language?.split('-')[0] || 'en';
  
  // Map to supported languages
  const supportedLanguages = ['en', 'es', 'fr', 'de', 'hi', 'zh', 'ja', 'pt', 'ru', 'ar'];
  const language = supportedLanguages.includes(browserLang) ? browserLang : 'en';
  
  // Determine cultural context from language
  const culturalMappings: Record<string, string> = {
    'en': 'western-individualistic',
    'es': 'mediterranean-expressive',
    'fr': 'mediterranean-expressive',
    'de': 'northern-european-analytical',
    'hi': 'south-asian-traditional',
    'zh': 'east-asian-collective',
    'ja': 'east-asian-collective',
    'pt': 'mediterranean-expressive',
    'ru': 'eastern-european-direct',
    'ar': 'middle-eastern-traditional'
  };
  
  return {
    success: true,
    language,
    culturalContext: culturalMappings[language] || 'western-individualistic'
  };
};

/**
 * Initialize cultural emotion integration
 */
const initializeCulturalIntegration = async (context: string): Promise<void> => {
  try {
    // Check if cultural emotion map is available
    const response = await fetch('/api/enterprise/cultural/auto-detect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        culturalContext: context,
        sessionId: getOrCreateSessionId()
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        // Store cultural context for later use
        sessionStorage.setItem('culturalContext', JSON.stringify(data.data));
        console.log('Cultural integration initialized successfully');
      }
    }
  } catch (error) {
    console.warn('Cultural integration failed:', error);
    // Continue without cultural integration
  }
};

/**
 * Setup performance optimizations
 */
const setupPerformanceOptimizations = (): void => {
  // Enable translation caching
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/localization-sw.js').catch(error => {
      console.warn('Service worker registration failed:', error);
    });
  }

  // Preload critical translations
  preloadCriticalTranslations();

  // Setup lazy loading for non-critical translations
  setupLazyTranslationLoading();
};

/**
 * Preload critical translations
 */
const preloadCriticalTranslations = async (): Promise<void> => {
  const criticalKeys = [
    'common.loading',
    'common.error',
    'common.success',
    'navigation.home',
    'navigation.menu',
    'buttons.save',
    'buttons.cancel',
    'buttons.confirm'
  ];

  try {
    const batchRequest = criticalKeys.map(key => ({
      keyPath: key,
      defaultValue: key.split('.')[1] || key,
      languageCode: currentLanguage,
      category: 'critical'
    }));

    await fetch('/api/enterprise/localization/batch-translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requests: batchRequest })
    });

  } catch (error) {
    console.warn('Failed to preload critical translations:', error);
  }
};

/**
 * Setup lazy loading for translations
 */
const setupLazyTranslationLoading = (): void => {
  // Create intersection observer for lazy loading
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const element = entry.target as HTMLElement;
        const translationKey = element.dataset.translationKey;
        const defaultValue = element.dataset.defaultValue;
        
        if (translationKey && defaultValue) {
          loadTranslation(translationKey, defaultValue, element);
          observer.unobserve(element);
        }
      }
    });
  }, {
    rootMargin: '50px'
  });

  // Observe elements with translation keys
  document.addEventListener('DOMContentLoaded', () => {
    const elementsToTranslate = document.querySelectorAll('[data-translation-key]');
    elementsToTranslate.forEach(element => observer.observe(element));
  });
};

/**
 * Load translation for a specific element
 */
const loadTranslation = async (
  key: string, 
  defaultValue: string, 
  element: HTMLElement
): Promise<void> => {
  try {
    const response = await fetch('/api/enterprise/localization/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        keyPath: key,
        defaultValue,
        languageCode: currentLanguage
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        element.textContent = data.data.translatedText;
      }
    }
  } catch (error) {
    console.warn('Failed to load translation:', error);
    element.textContent = defaultValue;
  }
};

/**
 * Initialize analytics tracking
 */
const initializeAnalyticsTracking = (): void => {
  // Track page views with language context
  const trackPageView = () => {
    fetch('/api/enterprise/localization/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId: getOrCreateSessionId(),
        languageCode: currentLanguage,
        eventType: 'page_view',
        contentType: 'web_page',
        contentId: window.location.pathname,
        fallbackUsed: false,
        metadata: {
          url: window.location.href,
          referrer: document.referrer,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      })
    }).catch(error => console.warn('Analytics tracking failed:', error));
  };

  // Track initial page view
  trackPageView();

  // Track navigation changes
  let currentPath = window.location.pathname;
  const checkPathChange = () => {
    if (window.location.pathname !== currentPath) {
      currentPath = window.location.pathname;
      trackPageView();
    }
  };

  // Monitor for path changes (for SPAs)
  setInterval(checkPathChange, 1000);
  
  // Also track on popstate events
  window.addEventListener('popstate', trackPageView);
};

/**
 * Get or create session ID
 */
const getOrCreateSessionId = (): string => {
  let sessionId = sessionStorage.getItem('localizationSessionId');
  if (!sessionId) {
    sessionId = `loc_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    sessionStorage.setItem('localizationSessionId', sessionId);
  }
  return sessionId;
};

/**
 * Change language dynamically
 */
export const changeLanguage = async (languageCode: string): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    // Update current language
    currentLanguage = languageCode;
    
    // Store preference
    localStorage.setItem('preferredLanguage', languageCode);
    
    // Clear cached translations
    clearTranslationCache();
    
    // Reload critical translations
    await preloadCriticalTranslations();
    
    // Track language change
    await fetch('/api/enterprise/localization/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId: getOrCreateSessionId(),
        languageCode,
        eventType: 'language_switch',
        fallbackUsed: false,
        metadata: {
          userTriggered: true,
          timestamp: new Date().toISOString()
        }
      })
    }).catch(error => console.warn('Analytics tracking failed:', error));
    
    // Trigger page refresh for immediate updates
    window.location.reload();
    
    return { success: true };
    
  } catch (error) {
    console.error('Failed to change language:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Clear translation cache
 */
const clearTranslationCache = (): void => {
  if ('caches' in window) {
    caches.delete('translations-cache').catch(error => {
      console.warn('Failed to clear translation cache:', error);
    });
  }
};

/**
 * Get current localization state
 */
export const getLocalizationState = (): {
  initialized: boolean;
  language: string;
  culturalContext: string;
} => ({
  initialized: isInitialized,
  language: currentLanguage,
  culturalContext
});

/**
 * Format value for current locale
 */
export const formatForCurrentLocale = async (
  value: any, 
  type: 'currency' | 'date' | 'number',
  options?: any
): Promise<string> => {
  try {
    const response = await fetch('/api/enterprise/localization/format', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        value,
        type,
        languageCode: currentLanguage,
        options
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        return data.data.formattedValue;
      }
    }

    // Fallback formatting
    return String(value);

  } catch (error) {
    console.warn('Formatting failed:', error);
    return String(value);
  }
};

/**
 * Export default initialization function
 */
export default initializeLocalization;