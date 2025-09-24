// Localization Translation Engine - Empire Grade Auto-Translation System
import { translationService } from '../../lib/translationService.js';
import { storage as dbStorage } from '../../storage.js';

export interface CulturalEmotionMap {
  country: string;
  language: string;
  region: string;
  communicationStyle: 'direct' | 'indirect' | 'high-context' | 'low-context';
  colorPsychology: {
    primary: string;
    secondary: string;
    accent: string;
    trust: string[];
    urgency: string[];
    calm: string[];
  };
  trustIndicators: string[];
  conversionTriggers: string[];
  emotionPatterns: {
    excitement: { colors: string[]; words: string[]; intensity: number };
    urgency: { colors: string[]; words: string[]; intensity: number };
    trust: { colors: string[]; words: string[]; intensity: number };
    calm: { colors: string[]; words: string[]; intensity: number };
  };
  culturalNorms: {
    formalityLevel: 'high' | 'medium' | 'low';
    directness: 'high' | 'medium' | 'low';
    individualismCollectivism: 'individualistic' | 'collectivistic' | 'mixed';
    powerDistance: 'high' | 'medium' | 'low';
    uncertaintyAvoidance: 'high' | 'medium' | 'low';
  };
  timeOrientation: 'past' | 'present' | 'future' | 'balanced';
  decisionMaking: 'fast' | 'deliberate' | 'consensus-based';
  riskTolerance: 'high' | 'medium' | 'low';
}

export interface LocalizationState {
  currentLanguage: string;
  detectedLanguage?: string;
  culturalProfile: CulturalEmotionMap | null;
  translationCache: Map<string, any>;
  userPreferences: {
    autoTranslate: boolean;
    preferredProvider: string;
    cacheEnabled: boolean;
  };
}

export interface TranslationRequest {
  text: string;
  targetLanguage: string;
  sourceLanguage?: string;
  context?: string;
  preserveFormatting?: boolean;
  culturallyAdapt?: boolean;
}

export interface LocalizationAnalytics {
  userId?: string;
  sessionId: string;
  languageDetected: string;
  languageSelected: string;
  translationsRequested: number;
  culturalAdaptationsApplied: number;
  provider: string;
  responseTime: number;
  userAgent: string;
  country?: string;
}

class LocalizationTranslationEngine {
  private storage: any;
  private state: LocalizationState;
  private culturalProfiles: Map<string, CulturalEmotionMap>;
  private initialized = false;

  constructor(storage: any) {
    this.storage = storage;
    this.state = {
      currentLanguage: 'en',
      culturalProfile: null,
      translationCache: new Map(),
      userPreferences: {
        autoTranslate: true,
        preferredProvider: 'Mock Translation',
        cacheEnabled: true
      }
    };
    this.culturalProfiles = new Map();
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load cultural profiles from database or initialize defaults
      await this.loadCulturalProfiles();
      this.initialized = true;
      console.log('✅ LocalizationTranslationEngine initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize LocalizationTranslationEngine:', error);
      // Initialize with defaults to prevent blocking
      this.initializeDefaultProfiles();
      this.initialized = true;
    }
  }

  private async loadCulturalProfiles(): Promise<void> {
    // Initialize with defaults for now - database integration coming soon
    this.initializeDefaultProfiles();
  }

  private initializeDefaultProfiles(): void {
    const defaultProfiles: CulturalEmotionMap[] = [
      {
        country: 'US',
        language: 'en',
        region: 'North America',
        communicationStyle: 'direct',
        colorPsychology: {
          primary: '#007bff',
          secondary: '#6c757d',
          accent: '#28a745',
          trust: ['#007bff', '#28a745', '#ffffff'],
          urgency: ['#dc3545', '#ff6b35', '#ff4757'],
          calm: ['#17a2b8', '#007bff', '#6c5ce7']
        },
        trustIndicators: ['security_badges', 'testimonials', 'guarantees', 'certifications'],
        conversionTriggers: ['urgency', 'social_proof', 'scarcity', 'authority'],
        emotionPatterns: {
          excitement: { colors: ['#ff4757', '#ff6b35'], words: ['amazing', 'incredible', 'fantastic'], intensity: 8 },
          urgency: { colors: ['#dc3545', '#ff4757'], words: ['limited', 'now', 'hurry'], intensity: 9 },
          trust: { colors: ['#007bff', '#28a745'], words: ['secure', 'guaranteed', 'trusted'], intensity: 7 },
          calm: { colors: ['#17a2b8', '#6c5ce7'], words: ['peaceful', 'relaxing', 'gentle'], intensity: 5 }
        },
        culturalNorms: {
          formalityLevel: 'medium',
          directness: 'high',
          individualismCollectivism: 'individualistic',
          powerDistance: 'medium',
          uncertaintyAvoidance: 'medium'
        },
        timeOrientation: 'future',
        decisionMaking: 'fast',
        riskTolerance: 'medium'
      },
      {
        country: 'ES',
        language: 'es',
        region: 'Europe',
        communicationStyle: 'high-context',
        colorPsychology: {
          primary: '#dc3545',
          secondary: '#fd7e14',
          accent: '#28a745',
          trust: ['#007bff', '#28a745', '#ffffff'],
          urgency: ['#dc3545', '#fd7e14', '#ff4757'],
          calm: ['#17a2b8', '#6c5ce7', '#95a5a6']
        },
        trustIndicators: ['family_testimonials', 'local_certifications', 'community_approval'],
        conversionTriggers: ['family_benefits', 'community_value', 'tradition', 'relationship'],
        emotionPatterns: {
          excitement: { colors: ['#dc3545', '#fd7e14'], words: ['increíble', 'fantástico', 'maravilloso'], intensity: 9 },
          urgency: { colors: ['#dc3545', '#ff4757'], words: ['limitado', 'ahora', 'urgente'], intensity: 8 },
          trust: { colors: ['#007bff', '#28a745'], words: ['seguro', 'confiable', 'garantizado'], intensity: 8 },
          calm: { colors: ['#17a2b8', '#95a5a6'], words: ['tranquilo', 'relajante', 'pacífico'], intensity: 6 }
        },
        culturalNorms: {
          formalityLevel: 'high',
          directness: 'medium',
          individualismCollectivism: 'mixed',
          powerDistance: 'medium',
          uncertaintyAvoidance: 'high'
        },
        timeOrientation: 'present',
        decisionMaking: 'deliberate',
        riskTolerance: 'low'
      },
      {
        country: 'FR',
        language: 'fr',
        region: 'Europe',
        communicationStyle: 'high-context',
        colorPsychology: {
          primary: '#007bff',
          secondary: '#6c757d',
          accent: '#dc3545',
          trust: ['#007bff', '#ffffff', '#dc3545'],
          urgency: ['#dc3545', '#fd7e14', '#ff4757'],
          calm: ['#17a2b8', '#6c5ce7', '#ddd']
        },
        trustIndicators: ['artisan_quality', 'heritage', 'luxury_appeal', 'sophistication'],
        conversionTriggers: ['exclusivity', 'sophistication', 'heritage', 'craftsmanship'],
        emotionPatterns: {
          excitement: { colors: ['#dc3545', '#007bff'], words: ['magnifique', 'extraordinaire', 'formidable'], intensity: 7 },
          urgency: { colors: ['#dc3545', '#fd7e14'], words: ['limité', 'maintenant', 'urgent'], intensity: 7 },
          trust: { colors: ['#007bff', '#6c757d'], words: ['sécurisé', 'garanti', 'authentique'], intensity: 8 },
          calm: { colors: ['#17a2b8', '#ddd'], words: ['paisible', 'élégant', 'raffiné'], intensity: 6 }
        },
        culturalNorms: {
          formalityLevel: 'high',
          directness: 'low',
          individualismCollectivism: 'individualistic',
          powerDistance: 'medium',
          uncertaintyAvoidance: 'high'
        },
        timeOrientation: 'past',
        decisionMaking: 'deliberate',
        riskTolerance: 'low'
      },
      {
        country: 'DE',
        language: 'de',
        region: 'Europe',
        communicationStyle: 'direct',
        colorPsychology: {
          primary: '#000000',
          secondary: '#dc3545',
          accent: '#ffc107',
          trust: ['#000000', '#ffffff', '#007bff'],
          urgency: ['#dc3545', '#fd7e14', '#ff4757'],
          calm: ['#6c757d', '#17a2b8', '#95a5a6']
        },
        trustIndicators: ['technical_specifications', 'certifications', 'precision', 'engineering'],
        conversionTriggers: ['quality', 'precision', 'efficiency', 'reliability'],
        emotionPatterns: {
          excitement: { colors: ['#ffc107', '#dc3545'], words: ['außergewöhnlich', 'fantastisch', 'hervorragend'], intensity: 6 },
          urgency: { colors: ['#dc3545', '#fd7e14'], words: ['begrenzt', 'jetzt', 'dringend'], intensity: 7 },
          trust: { colors: ['#000000', '#007bff'], words: ['sicher', 'zertifiziert', 'präzise'], intensity: 9 },
          calm: { colors: ['#6c757d', '#95a5a6'], words: ['ruhig', 'zuverlässig', 'stabil'], intensity: 7 }
        },
        culturalNorms: {
          formalityLevel: 'high',
          directness: 'high',
          individualismCollectivism: 'individualistic',
          powerDistance: 'low',
          uncertaintyAvoidance: 'high'
        },
        timeOrientation: 'future',
        decisionMaking: 'deliberate',
        riskTolerance: 'low'
      },
      {
        country: 'JP',
        language: 'ja',
        region: 'Asia',
        communicationStyle: 'high-context',
        colorPsychology: {
          primary: '#dc3545',
          secondary: '#ffffff',
          accent: '#007bff',
          trust: ['#ffffff', '#000000', '#dc3545'],
          urgency: ['#dc3545', '#ff4757', '#fd7e14'],
          calm: ['#6c5ce7', '#95a5a6', '#17a2b8']
        },
        trustIndicators: ['group_consensus', 'tradition', 'harmony', 'respect'],
        conversionTriggers: ['group_benefits', 'harmony', 'respect', 'long_term_value'],
        emotionPatterns: {
          excitement: { colors: ['#dc3545', '#007bff'], words: ['素晴らしい', '驚くべき', '素敵'], intensity: 5 },
          urgency: { colors: ['#dc3545', '#ff4757'], words: ['限定', '今', '急いで'], intensity: 6 },
          trust: { colors: ['#ffffff', '#000000'], words: ['安全', '信頼', '保証'], intensity: 8 },
          calm: { colors: ['#6c5ce7', '#95a5a6'], words: ['平和', 'リラックス', '静か'], intensity: 7 }
        },
        culturalNorms: {
          formalityLevel: 'high',
          directness: 'low',
          individualismCollectivism: 'collectivistic',
          powerDistance: 'high',
          uncertaintyAvoidance: 'high'
        },
        timeOrientation: 'past',
        decisionMaking: 'consensus-based',
        riskTolerance: 'low'
      },
      {
        country: 'CN',
        language: 'zh',
        region: 'Asia',
        communicationStyle: 'high-context',
        colorPsychology: {
          primary: '#dc3545',
          secondary: '#ffc107',
          accent: '#007bff',
          trust: ['#dc3545', '#ffc107', '#ffffff'],
          urgency: ['#dc3545', '#ff4757', '#fd7e14'],
          calm: ['#28a745', '#17a2b8', '#6c5ce7']
        },
        trustIndicators: ['social_status', 'group_approval', 'face_saving', 'prosperity'],
        conversionTriggers: ['status', 'prosperity', 'group_value', 'success'],
        emotionPatterns: {
          excitement: { colors: ['#dc3545', '#ffc107'], words: ['惊人', '美妙', '极好'], intensity: 7 },
          urgency: { colors: ['#dc3545', '#ff4757'], words: ['限时', '现在', '紧急'], intensity: 8 },
          trust: { colors: ['#dc3545', '#ffc107'], words: ['安全', '可信', '保证'], intensity: 8 },
          calm: { colors: ['#28a745', '#6c5ce7'], words: ['平静', '放松', '和谐'], intensity: 6 }
        },
        culturalNorms: {
          formalityLevel: 'high',
          directness: 'low',
          individualismCollectivism: 'collectivistic',
          powerDistance: 'high',
          uncertaintyAvoidance: 'medium'
        },
        timeOrientation: 'future',
        decisionMaking: 'consensus-based',
        riskTolerance: 'medium'
      }
    ];

    defaultProfiles.forEach(profile => {
      this.culturalProfiles.set(profile.language, profile);
    });
  }

  async detectLanguage(userAgent: string, acceptLanguage: string, ipCountry?: string): Promise<string> {
    try {
      // 1. Parse Accept-Language header
      const browserLanguages = acceptLanguage
        .split(',')
        .map(lang => lang.split(';')[0].trim().split('-')[0])
        .filter(lang => this.culturalProfiles.has(lang));

      if (browserLanguages.length > 0) {
        return browserLanguages[0];
      }

      // 2. Try IP-based detection if available
      if (ipCountry) {
        const countryToLanguage: Record<string, string> = {
          'US': 'en', 'GB': 'en', 'CA': 'en', 'AU': 'en',
          'ES': 'es', 'MX': 'es', 'AR': 'es', 'CO': 'es',
          'FR': 'fr', 'BE': 'fr', 'CH': 'fr',
          'DE': 'de', 'AT': 'de',
          'IT': 'it',
          'PT': 'pt', 'BR': 'pt',
          'RU': 'ru',
          'JP': 'ja',
          'KR': 'ko',
          'CN': 'zh', 'TW': 'zh', 'HK': 'zh',
          'SA': 'ar', 'AE': 'ar', 'EG': 'ar',
          'IN': 'hi'
        };

        const detected = countryToLanguage[ipCountry];
        if (detected && this.culturalProfiles.has(detected)) {
          return detected;
        }
      }

      // 3. Use translation service detection as fallback
      const detected = await translationService.detectLanguage(acceptLanguage);
      return this.culturalProfiles.has(detected) ? detected : 'en';

    } catch (error) {
      console.warn('Language detection failed:', error);
      return 'en';
    }
  }

  async setLanguage(languageCode: string, userId?: string): Promise<void> {
    if (!this.culturalProfiles.has(languageCode)) {
      throw new Error(`Unsupported language: ${languageCode}`);
    }

    this.state.currentLanguage = languageCode;
    this.state.culturalProfile = this.culturalProfiles.get(languageCode) || null;

    // Persist user language preference (placeholder for future database integration)
    if (userId) {
      console.log(`Language preference set for user ${userId}: ${languageCode}`);
    }
  }

  async translateText(request: TranslationRequest): Promise<any> {
    const { text, targetLanguage, sourceLanguage = 'en', context, culturallyAdapt = true } = request;

    try {
      // Check cache first
      const cacheKey = `${sourceLanguage}-${targetLanguage}-${text}`;
      if (this.state.userPreferences.cacheEnabled && this.state.translationCache.has(cacheKey)) {
        return this.state.translationCache.get(cacheKey);
      }

      // Perform translation
      const result = await translationService.translateText(
        text,
        targetLanguage,
        sourceLanguage,
        {
          useCache: this.state.userPreferences.cacheEnabled,
          preferredProvider: this.state.userPreferences.preferredProvider
        }
      );

      // Apply cultural adaptations if requested
      if (culturallyAdapt && this.state.culturalProfile) {
        (result as any).culturalAdaptations = this.applyCulturalAdaptations(text, this.state.culturalProfile);
      }

      // Cache the result
      if (this.state.userPreferences.cacheEnabled) {
        this.state.translationCache.set(cacheKey, result);
      }

      return result;

    } catch (error) {
      console.error('Translation failed:', error);
      throw error;
    }
  }

  private applyCulturalAdaptations(text: string, profile: CulturalEmotionMap): any {
    return {
      communicationStyle: profile.communicationStyle,
      suggestedColors: profile.colorPsychology,
      trustIndicators: profile.trustIndicators,
      conversionTriggers: profile.conversionTriggers,
      culturalNorms: profile.culturalNorms,
      emotionPatterns: profile.emotionPatterns
    };
  }

  getCulturalProfile(languageCode?: string): CulturalEmotionMap | null {
    const lang = languageCode || this.state.currentLanguage;
    return this.culturalProfiles.get(lang) || null;
  }

  async trackAnalytics(analytics: LocalizationAnalytics): Promise<void> {
    // Track analytics (placeholder for future database integration)
    console.log('Localization analytics:', analytics);
  }

  getAvailableLanguages(): { code: string; name: string; nativeName: string }[] {
    const languages = [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'es', name: 'Spanish', nativeName: 'Español' },
      { code: 'fr', name: 'French', nativeName: 'Français' },
      { code: 'de', name: 'German', nativeName: 'Deutsch' },
      { code: 'it', name: 'Italian', nativeName: 'Italiano' },
      { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
      { code: 'ru', name: 'Russian', nativeName: 'Русский' },
      { code: 'ja', name: 'Japanese', nativeName: '日本語' },
      { code: 'ko', name: 'Korean', nativeName: '한국어' },
      { code: 'zh', name: 'Chinese', nativeName: '中文' },
      { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
      { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' }
    ];

    return languages.filter(lang => this.culturalProfiles.has(lang.code));
  }

  getCurrentState(): LocalizationState {
    return { ...this.state };
  }

  clearCache(): void {
    this.state.translationCache.clear();
  }

  updatePreferences(preferences: Partial<LocalizationState['userPreferences']>): void {
    this.state.userPreferences = { ...this.state.userPreferences, ...preferences };
  }
}

// Export singleton instance
let localizationEngineInstance: LocalizationTranslationEngine | null = null;

export function getLocalizationEngine(storage: any = dbStorage): LocalizationTranslationEngine {
  if (!localizationEngineInstance) {
    localizationEngineInstance = new LocalizationTranslationEngine(storage);
  }
  return localizationEngineInstance;
}

export { LocalizationTranslationEngine };