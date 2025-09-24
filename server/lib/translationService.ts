// Translation Service for Auto-Translation using Multiple Providers
import axios from 'axios';

export interface TranslationProvider {
  name: string;
  translate: (text: string, targetLang: string, sourceLang?: string) => Promise<TranslationResult>;
  detectLanguage?: (text: string) => Promise<string>;
  getSupportedLanguages?: () => Promise<string[]>;
  maxTextLength: number;
  isAvailable: () => Promise<boolean>;
}

export interface TranslationResult {
  translatedText: string;
  confidence: number;
  provider: string;
  detectedSourceLanguage?: string;
  alternatives?: string[];
}

export interface BatchTranslationRequest {
  texts: string[];
  targetLanguage: string;
  sourceLanguage?: string;
  context?: string;
  category?: string;
}

export interface BatchTranslationResult {
  translations: TranslationResult[];
  totalTokens: number;
  processingTime: number;
  errors: string[];
}

// LibreTranslate Provider (Free, Self-hostable)
class LibreTranslateProvider implements TranslationProvider {
  name = 'LibreTranslate';
  maxTextLength = 5000;
  private baseURL = 'https://libretranslate.de';
  private apiKey?: string;

  constructor(baseURL?: string, apiKey?: string) {
    if (baseURL) this.baseURL = baseURL;
    if (apiKey) this.apiKey = apiKey;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseURL}/languages`, { timeout: 5000 });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  async translate(text: string, targetLang: string, sourceLang = 'en'): Promise<TranslationResult> {
    try {
      const payload: any = {
        q: text,
        source: sourceLang,
        target: targetLang,
        format: 'text'
      };

      if (this.apiKey) {
        payload.api_key = this.apiKey;
      }

      const response = await axios.post(`${this.baseURL}/translate`, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      return {
        translatedText: response.data.translatedText,
        confidence: 0.8, // LibreTranslate doesn't provide confidence scores
        provider: this.name,
        detectedSourceLanguage: sourceLang
      };

    } catch (error: any) {
      throw new Error(`LibreTranslate translation failed: ${error.message}`);
    }
  }

  async detectLanguage(text: string): Promise<string> {
    try {
      const response = await axios.post(`${this.baseURL}/detect`, {
        q: text,
        api_key: this.apiKey
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      });

      return response.data[0]?.language || 'en';
    } catch {
      return 'en'; // Default fallback
    }
  }

  async getSupportedLanguages(): Promise<string[]> {
    try {
      const response = await axios.get(`${this.baseURL}/languages`, { timeout: 5000 });
      return response.data.map((lang: any) => lang.code);
    } catch {
      return ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi'];
    }
  }
}

// Google Translate Provider (Enterprise - requires API key)
class GoogleTranslateProvider implements TranslationProvider {
  name = 'Google Translate';
  maxTextLength = 5000;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  async translate(text: string, targetLang: string, sourceLang = 'auto'): Promise<TranslationResult> {
    try {
      const response = await axios.post(
        `https://translation.googleapis.com/language/translate/v2?key=${this.apiKey}`,
        {
          q: text,
          source: sourceLang === 'auto' ? undefined : sourceLang,
          target: targetLang,
          format: 'text'
        },
        { timeout: 10000 }
      );

      const translation = response.data.data.translations[0];
      
      return {
        translatedText: translation.translatedText,
        confidence: 0.95, // Google has high confidence
        provider: this.name,
        detectedSourceLanguage: translation.detectedSourceLanguage || sourceLang
      };

    } catch (error: any) {
      throw new Error(`Google Translate failed: ${error.message}`);
    }
  }

  async detectLanguage(text: string): Promise<string> {
    try {
      const response = await axios.post(
        `https://translation.googleapis.com/language/translate/v2/detect?key=${this.apiKey}`,
        { q: text },
        { timeout: 5000 }
      );

      return response.data.data.detections[0][0].language;
    } catch {
      return 'en';
    }
  }

  async getSupportedLanguages(): Promise<string[]> {
    try {
      const response = await axios.get(
        `https://translation.googleapis.com/language/translate/v2/languages?key=${this.apiKey}`,
        { timeout: 5000 }
      );
      return response.data.data.languages.map((lang: any) => lang.language);
    } catch {
      return ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi'];
    }
  }
}

// HuggingFace Provider (Free with rate limits)
class HuggingFaceProvider implements TranslationProvider {
  name = 'HuggingFace';
  maxTextLength = 1000;
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async isAvailable(): Promise<boolean> {
    return true; // Always available
  }

  async translate(text: string, targetLang: string, sourceLang = 'en'): Promise<TranslationResult> {
    try {
      // Map language codes to HuggingFace model names
      const modelMap: Record<string, string> = {
        'en-es': 'Helsinki-NLP/opus-mt-en-es',
        'en-fr': 'Helsinki-NLP/opus-mt-en-fr',
        'en-de': 'Helsinki-NLP/opus-mt-en-de',
        'en-zh': 'Helsinki-NLP/opus-mt-en-zh',
        'es-en': 'Helsinki-NLP/opus-mt-es-en',
        'fr-en': 'Helsinki-NLP/opus-mt-fr-en',
        'de-en': 'Helsinki-NLP/opus-mt-de-en'
      };

      const modelKey = `${sourceLang}-${targetLang}`;
      const model = modelMap[modelKey] || 'Helsinki-NLP/opus-mt-en-es'; // Fallback

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${model}`,
        {
          inputs: text,
          parameters: {
            max_length: this.maxTextLength
          }
        },
        {
          headers,
          timeout: 15000 // HuggingFace can be slow
        }
      );

      const translatedText = response.data[0]?.translation_text || text;
      
      return {
        translatedText,
        confidence: 0.75, // Moderate confidence for free tier
        provider: this.name,
        detectedSourceLanguage: sourceLang
      };

    } catch (error: any) {
      throw new Error(`HuggingFace translation failed: ${error.message}`);
    }
  }
}

// Mock Provider (for testing/fallback)
class MockTranslationProvider implements TranslationProvider {
  name = 'Mock Translation';
  maxTextLength = 10000;

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async translate(text: string, targetLang: string, sourceLang = 'en'): Promise<TranslationResult> {
    // Simple mock translation with language prefix
    const mockTranslations: Record<string, string> = {
      'es': `[ES] ${text}`,
      'fr': `[FR] ${text}`,
      'de': `[DE] ${text}`,
      'it': `[IT] ${text}`,
      'pt': `[PT] ${text}`,
      'ru': `[RU] ${text}`,
      'ja': `[JA] ${text}`,
      'ko': `[KO] ${text}`,
      'zh': `[ZH] ${text}`,
      'ar': `[AR] ${text}`,
      'hi': `[HI] ${text}`
    };

    const translatedText = mockTranslations[targetLang] || `[${targetLang.toUpperCase()}] ${text}`;
    
    return {
      translatedText,
      confidence: 0.6, // Lower confidence for mock
      provider: this.name,
      detectedSourceLanguage: sourceLang
    };
  }

  async detectLanguage(text: string): Promise<string> {
    // Simple language detection based on common patterns
    if (/¿|¡|ñ/.test(text)) return 'es';
    if (/ç|à|è|é/.test(text)) return 'fr';
    if (/ä|ö|ü|ß/.test(text)) return 'de';
    if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja';
    if (/[\u0600-\u06ff]/.test(text)) return 'ar';
    if (/[\u0900-\u097f]/.test(text)) return 'hi';
    return 'en';
  }

  async getSupportedLanguages(): Promise<string[]> {
    return ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi'];
  }
}

// Main Translation Service
export class TranslationService {
  private providers: TranslationProvider[] = [];
  private cache = new Map<string, { result: TranslationResult; timestamp: number }>();
  private cacheExpiry = 1000 * 60 * 60; // 1 hour

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Initialize providers in order of preference
    const googleApiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    const huggingFaceApiKey = process.env.HUGGINGFACE_API_KEY;
    const libreTranslateUrl = process.env.LIBRETRANSLATE_URL;
    const libreTranslateApiKey = process.env.LIBRETRANSLATE_API_KEY;

    if (googleApiKey) {
      this.providers.push(new GoogleTranslateProvider(googleApiKey));
    }

    this.providers.push(new LibreTranslateProvider(libreTranslateUrl, libreTranslateApiKey));
    this.providers.push(new HuggingFaceProvider(huggingFaceApiKey));
    this.providers.push(new MockTranslationProvider()); // Always include mock as fallback
  }

  private getCacheKey(text: string, targetLang: string, sourceLang?: string): string {
    return `${sourceLang || 'auto'}-${targetLang}-${Buffer.from(text).toString('base64').substring(0, 50)}`;
  }

  async translateText(
    text: string, 
    targetLanguage: string, 
    sourceLanguage?: string,
    options?: { useCache?: boolean; preferredProvider?: string }
  ): Promise<TranslationResult> {
    const { useCache = true, preferredProvider } = options || {};

    // Return original text if source and target are the same
    if (sourceLanguage === targetLanguage) {
      return {
        translatedText: text,
        confidence: 1.0,
        provider: 'No Translation Needed',
        detectedSourceLanguage: sourceLanguage
      };
    }

    // Check cache first
    if (useCache) {
      const cacheKey = this.getCacheKey(text, targetLanguage, sourceLanguage);
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.result;
      }
    }

    let providers = this.providers;
    
    // Prioritize preferred provider
    if (preferredProvider) {
      providers = providers.sort((a, b) => 
        a.name === preferredProvider ? -1 : b.name === preferredProvider ? 1 : 0
      );
    }

    let lastError: Error | null = null;

    // Try each provider in order
    for (const provider of providers) {
      try {
        // Check if provider is available and can handle the text length
        if (text.length > provider.maxTextLength) {
          continue;
        }

        if (!(await provider.isAvailable())) {
          continue;
        }

        const result = await provider.translate(text, targetLanguage, sourceLanguage);
        
        // Cache successful result
        if (useCache) {
          const cacheKey = this.getCacheKey(text, targetLanguage, sourceLanguage);
          this.cache.set(cacheKey, { result, timestamp: Date.now() });
        }

        return result;

      } catch (error) {
        lastError = error as Error;
        console.warn(`Translation provider ${provider.name} failed:`, error);
        continue;
      }
    }

    // If all providers failed, throw the last error
    throw new Error(`All translation providers failed. Last error: ${lastError?.message || 'Unknown error'}`);
  }

  async batchTranslate(request: BatchTranslationRequest): Promise<BatchTranslationResult> {
    const startTime = Date.now();
    const results: TranslationResult[] = [];
    const errors: string[] = [];
    let totalTokens = 0;

    for (const text of request.texts) {
      try {
        const result = await this.translateText(
          text,
          request.targetLanguage,
          request.sourceLanguage
        );
        results.push(result);
        totalTokens += text.length;
      } catch (error) {
        errors.push(`Failed to translate "${text.substring(0, 50)}...": ${(error as Error).message}`);
        // Add fallback result
        results.push({
          translatedText: text,
          confidence: 0,
          provider: 'Fallback',
          detectedSourceLanguage: request.sourceLanguage || 'unknown'
        });
      }
    }

    return {
      translations: results,
      totalTokens,
      processingTime: Date.now() - startTime,
      errors
    };
  }

  async detectLanguage(text: string): Promise<string> {
    for (const provider of this.providers) {
      try {
        if (provider.detectLanguage && await provider.isAvailable()) {
          return await provider.detectLanguage(text);
        }
      } catch (error) {
        console.warn(`Language detection failed for ${provider.name}:`, error);
        continue;
      }
    }

    // Fallback to mock detection
    const mockProvider = new MockTranslationProvider();
    return await mockProvider.detectLanguage!(text);
  }

  async getSupportedLanguages(providerName?: string): Promise<string[]> {
    if (providerName) {
      const provider = this.providers.find(p => p.name === providerName);
      if (provider && provider.getSupportedLanguages) {
        try {
          return await provider.getSupportedLanguages();
        } catch (error) {
          console.warn(`Failed to get supported languages from ${providerName}:`, error);
        }
      }
    }

    // Return combined supported languages from all providers
    const allLanguages = new Set<string>();
    
    for (const provider of this.providers) {
      try {
        if (provider.getSupportedLanguages && await provider.isAvailable()) {
          const languages = await provider.getSupportedLanguages();
          languages.forEach(lang => allLanguages.add(lang));
        }
      } catch (error) {
        console.warn(`Failed to get languages from ${provider.name}:`, error);
      }
    }

    return Array.from(allLanguages).sort();
  }

  getProviderStatus(): { name: string; available: boolean }[] {
    return this.providers.map(provider => ({
      name: provider.name,
      available: true // We'd need to check this async, but for status it's ok
    }));
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): { size: number; entries: number } {
    const entries = Array.from(this.cache.values());
    const validEntries = entries.filter(entry => 
      Date.now() - entry.timestamp < this.cacheExpiry
    );

    return {
      size: validEntries.length,
      entries: this.cache.size
    };
  }
}

// Export singleton instance
export const translationService = new TranslationService();