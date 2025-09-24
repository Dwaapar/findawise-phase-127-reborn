import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  region?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface CulturalProfile {
  countryCode: string;
  region: string;
  communicationStyle: string;
  colorPsychology: Record<string, any>;
  trustIndicators: string[];
  conversionTriggers: string[];
  emotionPatterns: Record<string, any>;
}

export interface TranslationResult {
  translatedText: string;
  confidence: number;
  provider: string;
  detectedSourceLanguage?: string;
}

export interface LocalizationContextType {
  currentLanguage: string;
  availableLanguages: Language[];
  culturalProfile: CulturalProfile | null;
  isLoading: boolean;
  setLanguage: (languageCode: string) => Promise<void>;
  translate: (text: string, targetLanguage?: string) => Promise<string>;
  detectUserLanguage: () => Promise<string>;
  getCulturalAdaptations: () => Record<string, any>;
  t: (key: string, params?: Record<string, any>) => string;
}

// Create context
const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

// Default languages
const DEFAULT_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', region: 'US', isDefault: true, isActive: true },
  { code: 'es', name: 'Spanish', nativeName: 'Español', region: 'ES', isActive: true },
  { code: 'fr', name: 'French', nativeName: 'Français', region: 'FR', isActive: true },
  { code: 'de', name: 'German', nativeName: 'Deutsch', region: 'DE', isActive: true },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', region: 'IT', isActive: true },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', region: 'BR', isActive: true },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', region: 'RU', isActive: true },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', region: 'JP', isActive: true },
  { code: 'ko', name: 'Korean', nativeName: '한국어', region: 'KR', isActive: true },
  { code: 'zh', name: 'Chinese', nativeName: '中文', region: 'CN', isActive: true },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', region: 'SA', isActive: true },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', region: 'IN', isActive: true }
];

// Hook for using localization
export function useLocalization(): LocalizationContextType {
  const context = useContext(LocalizationContext);
  if (!context) {
    // Return a default implementation if context is not available
    return useLocalizationStandalone();
  }
  return context;
}

// Standalone hook for when context is not available
function useLocalizationStandalone(): LocalizationContextType {
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const [availableLanguages, setAvailableLanguages] = useState<Language[]>(DEFAULT_LANGUAGES);
  const [culturalProfile, setCulturalProfile] = useState<CulturalProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [translations, setTranslations] = useState<Record<string, string>>({});

  // Initialize language from browser/localStorage
  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        // Check localStorage first
        const savedLanguage = localStorage.getItem('user-language');
        if (savedLanguage) {
          setCurrentLanguage(savedLanguage);
          return;
        }

        // Auto-detect from browser
        const detectedLanguage = await detectUserLanguage();
        setCurrentLanguage(detectedLanguage);
        localStorage.setItem('user-language', detectedLanguage);
      } catch (error) {
        console.warn('Failed to initialize language:', error);
        setCurrentLanguage('en');
      }
    };

    initializeLanguage();
  }, []);

  // Load cultural profile when language changes
  useEffect(() => {
    const loadCulturalProfile = async () => {
      if (!currentLanguage) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/localization/cultural-profile/${currentLanguage}`);
        if (response.ok) {
          const profile = await response.json();
          setCulturalProfile(profile.data);
        }
      } catch (error) {
        console.warn('Failed to load cultural profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCulturalProfile();
  }, [currentLanguage]);

  // Set language with persistence and API sync
  const setLanguage = useCallback(async (languageCode: string): Promise<void> => {
    if (languageCode === currentLanguage) return;

    setIsLoading(true);
    try {
      // Update local state
      setCurrentLanguage(languageCode);
      localStorage.setItem('user-language', languageCode);

      // Sync with server
      await fetch('/api/localization/user-language', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          languageCode,
          source: 'manual_selection'
        })
      });

      // Trigger language change event for other components
      window.dispatchEvent(new CustomEvent('languageChange', { 
        detail: { language: languageCode } 
      }));

    } catch (error) {
      console.error('Failed to set language:', error);
      // Revert on error
      setCurrentLanguage(currentLanguage);
      localStorage.setItem('user-language', currentLanguage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [currentLanguage]);

  // Translate text
  const translate = useCallback(async (text: string, targetLanguage?: string): Promise<string> => {
    const target = targetLanguage || currentLanguage;
    
    if (target === 'en') {
      return text; // No translation needed for English
    }

    try {
      const response = await fetch('/api/localization/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          targetLanguage: target,
          sourceLanguage: 'en'
        })
      });

      if (response.ok) {
        const result = await response.json();
        return result.data.translatedText;
      }

      return text; // Fallback to original text
    } catch (error) {
      console.warn('Translation failed:', error);
      return text;
    }
  }, [currentLanguage]);

  // Detect user language
  const detectUserLanguage = useCallback(async (): Promise<string> => {
    try {
      // Try to detect from browser
      const browserLang = navigator.language.split('-')[0];
      const supportedLang = availableLanguages.find(lang => lang.code === browserLang);
      
      if (supportedLang) {
        return browserLang;
      }

      // Try API detection with user agent
      const response = await fetch('/api/localization/detect-language', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAgent: navigator.userAgent,
          acceptLanguage: navigator.language,
          browserLanguages: navigator.languages
        })
      });

      if (response.ok) {
        const result = await response.json();
        return result.data.detectedLanguage;
      }

      return 'en'; // Default fallback
    } catch (error) {
      console.warn('Language detection failed:', error);
      return 'en';
    }
  }, [availableLanguages]);

  // Get cultural adaptations
  const getCulturalAdaptations = useCallback((): Record<string, any> => {
    if (!culturalProfile) {
      return {
        colorScheme: 'default',
        communicationStyle: 'direct',
        trustIndicators: ['security_badges', 'testimonials'],
        conversionTriggers: ['urgency', 'social_proof']
      };
    }

    return {
      colorScheme: culturalProfile.colorPsychology,
      communicationStyle: culturalProfile.communicationStyle,
      trustIndicators: culturalProfile.trustIndicators,
      conversionTriggers: culturalProfile.conversionTriggers,
      emotionPatterns: culturalProfile.emotionPatterns
    };
  }, [culturalProfile]);

  // Translation function for keys (i18n style)
  const t = useCallback((key: string, params?: Record<string, any>): string => {
    let translation = translations[key] || key;

    // Simple parameter substitution
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        translation = translation.replace(`{{${paramKey}}}`, String(paramValue));
      });
    }

    return translation;
  }, [translations]);

  return {
    currentLanguage,
    availableLanguages,
    culturalProfile,
    isLoading,
    setLanguage,
    translate,
    detectUserLanguage,
    getCulturalAdaptations,
    t
  };
}

// Provider component for context
export function LocalizationProvider({ children }: { children: React.ReactNode }) {
  const localization = useLocalizationStandalone();

  return (
    <LocalizationContext.Provider value={localization}>
      {children}
    </LocalizationContext.Provider>
  );
}

// Higher-order component for localization
export function withLocalization<P extends object>(
  Component: React.ComponentType<P & { localization: LocalizationContextType }>
) {
  return function LocalizedComponent(props: P) {
    const localization = useLocalization();
    return <Component {...props} localization={localization} />;
  };
}

// Hook for cultural adaptations
export function useCulturalAdaptations() {
  const { getCulturalAdaptations, culturalProfile } = useLocalization();
  
  return {
    adaptations: getCulturalAdaptations(),
    profile: culturalProfile,
    isRTL: culturalProfile?.countryCode === 'SA' || culturalProfile?.countryCode === 'AE',
    colors: culturalProfile?.colorPsychology || {},
    communicationStyle: culturalProfile?.communicationStyle || 'direct'
  };
}

// Utility functions
export function formatCurrency(amount: number, language: string, currency: string = 'USD'): string {
  try {
    return new Intl.NumberFormat(language, {
      style: 'currency',
      currency
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

export function formatDate(date: Date, language: string): string {
  try {
    return new Intl.DateTimeFormat(language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  } catch {
    return date.toLocaleDateString();
  }
}

export function formatNumber(number: number, language: string): string {
  try {
    return new Intl.NumberFormat(language).format(number);
  } catch {
    return number.toString();
  }
}