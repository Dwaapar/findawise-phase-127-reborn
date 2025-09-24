/**
 * Localization/Translation API Routes - Billion-Dollar Empire Grade
 * 
 * Complete API suite for localization, translation, and cultural adaptation:
 * - Auto-detection and manual language switching
 * - Real-time translation with multiple providers
 * - Cultural emotion mapping integration
 * - Admin management and analytics
 * - Performance optimization and caching
 * 
 * @version 2.0.0 - Billion-Dollar Empire Grade
 * @author Findawise Empire - Senior Development Team
 */

import { Router } from 'express';
import { logger } from '../utils/logger.js';
import { db } from '../db.js';
import { generateId, generateUUID } from '../utils/helpers.js';
import { eq, and, desc, sql, like, inArray, gte, between } from 'drizzle-orm';
import { 
  languages, 
  translations, 
  translationKeys, 
  userLanguagePreferences,
  localizedContentAssignments,
  localizationAnalytics,
  SUPPORTED_LANGUAGES 
} from '../../shared/localization.js';
import { TranslationService } from '../lib/translationService.js';
import { requireAuth } from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';

const router = Router();

// Initialize translation service
const translationService = new TranslationService();

// =====================================================================
// PUBLIC LANGUAGE INFORMATION ENDPOINTS
// =====================================================================

/**
 * Get all available languages
 */
router.get('/languages', async (req, res) => {
  try {
    const availableLanguages = await db
      .select()
      .from(languages)
      .where(eq(languages.isActive, true))
      .orderBy(languages.name);

    res.json({
      success: true,
      data: availableLanguages,
      count: availableLanguages.length,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Error fetching languages', { error, component: 'LocalizationAPI' });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch languages'
    });
  }
});

/**
 * Auto-detect user language and cultural context
 */
router.post('/auto-detect', async (req, res) => {
  try {
    const { timezone, sessionId, userId, behaviorData } = req.body;
    const userAgent = req.headers['user-agent'];
    const acceptLanguage = req.headers['accept-language'];
    const clientIP = req.ip || req.connection.remoteAddress || '127.0.0.1';

    // Parse browser languages
    const browserLanguages = acceptLanguage 
      ? acceptLanguage.split(',').map(lang => lang.split(';')[0].trim())
      : ['en'];

    // Detect primary language
    let detectedLanguage = 'en';
    let detectionMethod = 'default';
    let confidence = 0.5;

    // Check browser preference against available languages
    const availableLanguageCodes = SUPPORTED_LANGUAGES.map(lang => lang.code);
    for (const browserLang of browserLanguages) {
      const langCode = browserLang.substring(0, 2).toLowerCase();
      if (availableLanguageCodes.includes(langCode)) {
        detectedLanguage = langCode;
        detectionMethod = 'browser';
        confidence = 0.8;
        break;
      }
    }

    // Get geo location from IP (basic implementation)
    let geoLocation = { country: 'US', region: '', city: '' };
    try {
      // In production, you would use a real IP geolocation service
      if (timezone) {
        const timezoneCountryMap: Record<string, string> = {
          'America/New_York': 'US',
          'Europe/London': 'GB',
          'Europe/Paris': 'FR',
          'Europe/Madrid': 'ES',
          'Europe/Berlin': 'DE',
          'Asia/Tokyo': 'JP',
          'Asia/Shanghai': 'CN',
          'Asia/Kolkata': 'IN',
          'Asia/Riyadh': 'SA',
          'America/Sao_Paulo': 'BR',
          'Europe/Moscow': 'RU'
        };

        const country = timezoneCountryMap[timezone] || 'US';
        geoLocation.country = country;

        // Adjust language based on geography
        const geoLanguageMap: Record<string, string> = {
          'FR': 'fr',
          'ES': 'es',
          'DE': 'de',
          'JP': 'ja',
          'CN': 'zh',
          'IN': 'hi',
          'SA': 'ar',
          'BR': 'pt',
          'RU': 'ru'
        };

        if (geoLanguageMap[country] && confidence < 0.9) {
          detectedLanguage = geoLanguageMap[country];
          detectionMethod = 'geoip';
          confidence = 0.7;
        }
      }
    } catch (geoError) {
      logger.warn('Geo detection failed', { error: geoError });
    }

    // Store user language preference
    if (sessionId) {
      try {
        await db.insert(userLanguagePreferences).values({
          sessionId,
          userId: userId || null,
          preferredLanguage: detectedLanguage,
          detectedLanguage,
          detectionMethod,
          autoDetect: true,
          browserLanguages: browserLanguages,
          geoLocation: geoLocation,
          isManualOverride: false
        }).onConflictDoUpdate({
          target: userLanguagePreferences.sessionId,
          set: {
            preferredLanguage: detectedLanguage,
            detectedLanguage,
            detectionMethod,
            browserLanguages: browserLanguages,
            geoLocation: geoLocation,
            updatedAt: sql`now()`
          }
        });
      } catch (dbError) {
        logger.warn('Failed to store language preference', { error: dbError });
      }
    }

    // Track analytics
    try {
      await db.insert(localizationAnalytics).values({
        sessionId: sessionId || generateUUID(),
        languageCode: detectedLanguage,
        eventType: 'language_auto_detect',
        fallbackUsed: detectionMethod === 'default',
        metadata: {
          detectionMethod,
          confidence,
          browserLanguages,
          timezone,
          userAgent: userAgent?.substring(0, 200),
          geoLocation
        }
      });
    } catch (analyticsError) {
      logger.warn('Failed to track auto-detection analytics', { error: analyticsError });
    }

    res.json({
      success: true,
      data: {
        detectedLanguage,
        detectionMethod,
        confidence,
        geoLocation,
        availableLanguages: SUPPORTED_LANGUAGES
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Auto-detection failed', { error, component: 'LocalizationAPI' });
    res.status(500).json({
      success: false,
      error: 'Failed to auto-detect language',
      message: error.message
    });
  }
});

// =====================================================================
// TRANSLATION ENDPOINTS
// =====================================================================

/**
 * Translate text with cultural adaptation
 */
router.post('/translate', async (req, res) => {
  try {
    const { 
      keyPath, 
      defaultValue, 
      languageCode, 
      context, 
      category, 
      interpolationVars,
      culturalAdaptation = false
    } = req.body;

    if (!keyPath || !defaultValue || !languageCode) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: keyPath, defaultValue, languageCode'
      });
    }

    // Check if translation already exists in database
    let existingTranslation = null;
    try {
      const keyRecord = await db
        .select()
        .from(translationKeys)
        .where(eq(translationKeys.keyPath, keyPath))
        .limit(1);

      if (keyRecord.length > 0) {
        const translationRecord = await db
          .select()
          .from(translations)
          .where(and(
            eq(translations.keyId, keyRecord[0].id),
            eq(translations.languageCode, languageCode)
          ))
          .limit(1);

        if (translationRecord.length > 0) {
          existingTranslation = translationRecord[0];
        }
      }
    } catch (dbError) {
      logger.warn('Database lookup failed, proceeding with live translation', { error: dbError });
    }

    let translatedText = defaultValue;
    let isFromCache = false;
    let metadata = {};

    if (existingTranslation && existingTranslation.translatedValue) {
      // Use existing translation
      translatedText = existingTranslation.translatedValue;
      isFromCache = true;
      metadata = existingTranslation.metadata || {};
    } else if (languageCode !== 'en') {
      // Get live translation
      try {
        const translationResult = await translationService.translateText(
          defaultValue,
          languageCode,
          'en',
          { useCache: true }
        );

        translatedText = translationResult.translatedText;
        metadata = {
          provider: translationResult.provider,
          confidence: translationResult.confidence,
          detectedSourceLanguage: translationResult.detectedSourceLanguage
        };

        // Store the translation in database for future use
        try {
          // Ensure translation key exists
          const keyId = await ensureTranslationKey({
            keyPath,
            category: category || 'content',
            context,
            defaultValue,
            interpolationVars
          });

          // Store translation
          await db.insert(translations).values({
            keyId,
            languageCode,
            translatedValue: translatedText,
            isAutoTranslated: true,
            isVerified: false,
            quality: Math.round((translationResult.confidence || 0.8) * 100),
            metadata: metadata
          }).onConflictDoUpdate({
            target: [translations.keyId, translations.languageCode],
            set: {
              translatedValue: translatedText,
              metadata: metadata,
              updatedAt: sql`now()`
            }
          });
        } catch (storeError) {
          logger.warn('Failed to store translation', { error: storeError });
        }

      } catch (translationError) {
        logger.warn('Translation failed, using fallback', { error: translationError });
        translatedText = defaultValue;
        metadata = { error: translationError.message, fallback: true };
      }
    }

    // Apply interpolation if variables provided
    if (interpolationVars && typeof interpolationVars === 'object') {
      Object.entries(interpolationVars).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        translatedText = translatedText.replace(regex, String(value));
      });
    }

    // Cultural adaptation if requested
    let culturalMetadata = {};
    if (culturalAdaptation) {
      try {
        // Import cultural emotion map service
        const { culturalEmotionMapEngine } = await import('../services/cultural/culturalEmotionMap.js');
        
        const culturalContext = await culturalEmotionMapEngine.getCulturalContext(languageCode);
        culturalMetadata = {
          emotionTheme: culturalContext.primaryEmotion || 'neutral',
          colorScheme: culturalContext.colors || {},
          messagingTone: culturalContext.messagingStyle || 'friendly'
        };
      } catch (culturalError) {
        logger.warn('Cultural adaptation failed', { error: culturalError });
      }
    }

    // Track analytics
    try {
      await db.insert(localizationAnalytics).values({
        sessionId: req.body.sessionId || generateUUID(),
        languageCode,
        eventType: 'translation_request',
        contentType: category || 'content',
        keyPath,
        fallbackUsed: translatedText === defaultValue && languageCode !== 'en',
        translationQuality: metadata.confidence ? Math.round(metadata.confidence * 100) : null,
        metadata: {
          isFromCache,
          culturalAdaptation,
          ...metadata,
          ...culturalMetadata
        }
      });
    } catch (analyticsError) {
      logger.warn('Failed to track translation analytics', { error: analyticsError });
    }

    res.json({
      success: true,
      data: {
        translatedText,
        metadata: {
          isFromCache,
          ...metadata,
          ...culturalMetadata
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Translation request failed', { error, component: 'LocalizationAPI' });
    res.status(500).json({
      success: false,
      error: 'Translation failed',
      message: error.message
    });
  }
});

/**
 * Translate text with full cultural adaptation
 */
router.post('/translate-cultural', async (req, res) => {
  try {
    const { 
      keyPath, 
      defaultValue, 
      languageCode, 
      context, 
      category, 
      interpolationVars 
    } = req.body;

    if (!keyPath || !defaultValue || !languageCode) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Get basic translation first
    const translationResponse = await fetch(`${req.protocol}://${req.get('host')}/api/localization/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keyPath,
        defaultValue,
        languageCode,
        context,
        category,
        interpolationVars,
        culturalAdaptation: false
      })
    });

    let translatedText = defaultValue;
    let translationMetadata = {};

    if (translationResponse.ok) {
      const translationData = await translationResponse.json();
      if (translationData.success) {
        translatedText = translationData.data.translatedText;
        translationMetadata = translationData.data.metadata;
      }
    }

    // Get full cultural adaptation
    let culturalData = {
      emotionTheme: 'neutral',
      colorScheme: {},
      messagingTone: 'friendly',
      culturalNuances: [],
      trustElements: [],
      urgencyLevel: 'medium' as const,
      socialProofType: 'testimonials'
    };

    try {
      const { culturalEmotionMapEngine } = await import('../services/cultural/culturalEmotionMap.js');
      
      const culturalContext = await culturalEmotionMapEngine.getCulturalContext(languageCode);
      const adaptedContent = await culturalEmotionMapEngine.adaptContentCulturally({
        originalText: translatedText,
        targetLanguage: languageCode,
        contentType: category || 'content',
        emotionalContext: context || 'neutral'
      });

      culturalData = {
        emotionTheme: culturalContext.primaryEmotion || 'neutral',
        colorScheme: culturalContext.colors || {},
        messagingTone: culturalContext.messagingStyle || 'friendly',
        culturalNuances: adaptedContent.culturalNuances || [],
        trustElements: adaptedContent.trustElements || [],
        urgencyLevel: adaptedContent.urgencyLevel || 'medium',
        socialProofType: adaptedContent.socialProofType || 'testimonials'
      };

      if (adaptedContent.adaptedText) {
        translatedText = adaptedContent.adaptedText;
      }

    } catch (culturalError) {
      logger.warn('Cultural adaptation failed', { error: culturalError });
    }

    res.json({
      success: true,
      data: {
        translatedText,
        ...culturalData,
        metadata: translationMetadata
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Cultural translation failed', { error, component: 'LocalizationAPI' });
    res.status(500).json({
      success: false,
      error: 'Cultural translation failed',
      message: error.message
    });
  }
});

// =====================================================================
// ADMIN MANAGEMENT ENDPOINTS
// =====================================================================

/**
 * Get all translation keys with statistics
 */
router.get('/admin/keys', requireAuth, async (req, res) => {
  try {
    const { category, search, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let query = db
      .select({
        id: translationKeys.id,
        keyPath: translationKeys.keyPath,
        category: translationKeys.category,
        context: translationKeys.context,
        defaultValue: translationKeys.defaultValue,
        priority: translationKeys.priority,
        createdAt: translationKeys.createdAt,
        translationCount: sql<number>`count(${translations.id})`,
        completedLanguages: sql<string>`array_agg(distinct ${translations.languageCode}) filter (where ${translations.languageCode} is not null)`
      })
      .from(translationKeys)
      .leftJoin(translations, eq(translations.keyId, translationKeys.id))
      .groupBy(translationKeys.id)
      .orderBy(desc(translationKeys.createdAt))
      .limit(parseInt(limit as string))
      .offset(offset);

    if (category) {
      query = query.where(eq(translationKeys.category, category as string));
    }

    if (search) {
      query = query.where(like(translationKeys.keyPath, `%${search}%`));
    }

    const keys = await query;

    // Get total count
    let countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(translationKeys);

    if (category) {
      countQuery = countQuery.where(eq(translationKeys.category, category as string));
    }

    if (search) {
      countQuery = countQuery.where(like(translationKeys.keyPath, `%${search}%`));
    }

    const [{ count }] = await countQuery;

    res.json({
      success: true,
      data: keys,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: count,
        pages: Math.ceil(count / parseInt(limit as string))
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Error fetching translation keys', { error, component: 'LocalizationAPI' });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch translation keys'
    });
  }
});

/**
 * Get missing translations report
 */
router.get('/admin/missing-translations', requireAuth, async (req, res) => {
  try {
    const { languageCode } = req.query;

    const availableLanguages = SUPPORTED_LANGUAGES.map(lang => lang.code);
    const targetLanguages = languageCode ? [languageCode as string] : availableLanguages;

    const missingTranslations = await db
      .select({
        keyPath: translationKeys.keyPath,
        category: translationKeys.category,
        defaultValue: translationKeys.defaultValue,
        priority: translationKeys.priority,
        missingLanguages: sql<string[]>`array_agg(lang.code) filter (where t.id is null)`
      })
      .from(translationKeys)
      .crossJoin(
        sql`(select unnest(array[${targetLanguages.map(lang => `'${lang}'`).join(',')}]) as code) as lang`
      )
      .leftJoin(
        translations,
        and(
          eq(translations.keyId, translationKeys.id),
          sql`${translations.languageCode} = lang.code`
        )
      )
      .groupBy(translationKeys.id, translationKeys.keyPath, translationKeys.category, translationKeys.defaultValue, translationKeys.priority)
      .having(sql`count(t.id) < ${targetLanguages.length}`)
      .orderBy(desc(translationKeys.priority), translationKeys.keyPath);

    res.json({
      success: true,
      data: missingTranslations,
      count: missingTranslations.length,
      targetLanguages,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Error generating missing translations report', { error, component: 'LocalizationAPI' });
    res.status(500).json({
      success: false,
      error: 'Failed to generate missing translations report'
    });
  }
});

/**
 * Bulk translate missing keys
 */
router.post('/admin/bulk-translate', requireAuth, async (req, res) => {
  try {
    const { languageCode, keyIds, force = false } = req.body;

    if (!languageCode || !Array.isArray(keyIds)) {
      return res.status(400).json({
        success: false,
        error: 'Language code and key IDs array are required'
      });
    }

    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [] as any[]
    };

    // Get translation keys
    const keys = await db
      .select()
      .from(translationKeys)
      .where(inArray(translationKeys.id, keyIds));

    for (const key of keys) {
      try {
        // Check if translation already exists
        if (!force) {
          const existing = await db
            .select()
            .from(translations)
            .where(and(
              eq(translations.keyId, key.id),
              eq(translations.languageCode, languageCode)
            ))
            .limit(1);

          if (existing.length > 0) {
            results.skipped++;
            continue;
          }
        }

        // Translate
        const translationResult = await translationService.translateText(
          key.defaultValue,
          languageCode,
          'en'
        );

        // Store translation
        await db.insert(translations).values({
          keyId: key.id,
          languageCode,
          translatedValue: translationResult.translatedText,
          isAutoTranslated: true,
          isVerified: false,
          quality: Math.round((translationResult.confidence || 0.8) * 100),
          metadata: {
            provider: translationResult.provider,
            confidence: translationResult.confidence,
            bulkTranslated: true
          }
        }).onConflictDoUpdate({
          target: [translations.keyId, translations.languageCode],
          set: {
            translatedValue: translationResult.translatedText,
            metadata: {
              provider: translationResult.provider,
              confidence: translationResult.confidence,
              bulkTranslated: true
            },
            updatedAt: sql`now()`
          }
        });

        results.success++;

      } catch (error: any) {
        results.failed++;
        results.errors.push({
          keyPath: key.keyPath,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Bulk translation failed', { error, component: 'LocalizationAPI' });
    res.status(500).json({
      success: false,
      error: 'Bulk translation failed'
    });
  }
});

// =====================================================================
// ANALYTICS ENDPOINTS
// =====================================================================

/**
 * Track localization analytics
 */
router.post('/analytics', async (req, res) => {
  try {
    const analytics = req.body;

    await db.insert(localizationAnalytics).values({
      sessionId: analytics.sessionId || generateUUID(),
      languageCode: analytics.languageCode,
      eventType: analytics.eventType,
      contentType: analytics.contentType,
      contentId: analytics.contentId,
      keyPath: analytics.keyPath,
      fallbackUsed: analytics.fallbackUsed || false,
      translationQuality: analytics.translationQuality,
      userFeedback: analytics.userFeedback,
      metadata: analytics.metadata || {}
    });

    res.json({
      success: true,
      message: 'Analytics tracked successfully'
    });

  } catch (error: any) {
    logger.error('Failed to track analytics', { error, component: 'LocalizationAPI' });
    res.status(500).json({
      success: false,
      error: 'Failed to track analytics'
    });
  }
});

/**
 * Get localization analytics dashboard
 */
router.get('/admin/analytics', requireAuth, async (req, res) => {
  try {
    const { dateRange = 30, languageCode } = req.query;
    const startDate = new Date(Date.now() - parseInt(dateRange as string) * 24 * 60 * 60 * 1000);

    // Language usage statistics
    let languageStatsQuery = db
      .select({
        languageCode: localizationAnalytics.languageCode,
        eventCount: sql<number>`count(*)`,
        uniqueSessions: sql<number>`count(distinct ${localizationAnalytics.sessionId})`,
        fallbackRate: sql<number>`round(avg(case when ${localizationAnalytics.fallbackUsed} then 1.0 else 0.0 end) * 100, 2)`,
        avgQuality: sql<number>`round(avg(${localizationAnalytics.translationQuality}), 2)`
      })
      .from(localizationAnalytics)
      .where(gte(localizationAnalytics.timestamp, startDate))
      .groupBy(localizationAnalytics.languageCode)
      .orderBy(desc(sql<number>`count(*)`));

    if (languageCode) {
      languageStatsQuery = languageStatsQuery.where(eq(localizationAnalytics.languageCode, languageCode as string));
    }

    const languageStats = await languageStatsQuery;

    // Event type breakdown
    const eventTypeStats = await db
      .select({
        eventType: localizationAnalytics.eventType,
        count: sql<number>`count(*)`,
        percentage: sql<number>`round(count(*) * 100.0 / sum(count(*)) over(), 2)`
      })
      .from(localizationAnalytics)
      .where(gte(localizationAnalytics.timestamp, startDate))
      .groupBy(localizationAnalytics.eventType)
      .orderBy(desc(sql<number>`count(*)`));

    // Daily trends
    const dailyTrends = await db
      .select({
        date: sql<string>`date(${localizationAnalytics.timestamp})`,
        events: sql<number>`count(*)`,
        uniqueSessions: sql<number>`count(distinct ${localizationAnalytics.sessionId})`,
        fallbacks: sql<number>`sum(case when ${localizationAnalytics.fallbackUsed} then 1 else 0 end)`
      })
      .from(localizationAnalytics)
      .where(gte(localizationAnalytics.timestamp, startDate))
      .groupBy(sql`date(${localizationAnalytics.timestamp})`)
      .orderBy(sql`date(${localizationAnalytics.timestamp})`);

    // Top content requiring translation
    const topContent = await db
      .select({
        keyPath: localizationAnalytics.keyPath,
        contentType: localizationAnalytics.contentType,
        requestCount: sql<number>`count(*)`,
        fallbackRate: sql<number>`round(avg(case when ${localizationAnalytics.fallbackUsed} then 1.0 else 0.0 end) * 100, 2)`
      })
      .from(localizationAnalytics)
      .where(and(
        gte(localizationAnalytics.timestamp, startDate),
        sql`${localizationAnalytics.keyPath} is not null`
      ))
      .groupBy(localizationAnalytics.keyPath, localizationAnalytics.contentType)
      .orderBy(desc(sql<number>`count(*)`))
      .limit(20);

    res.json({
      success: true,
      data: {
        languageStats,
        eventTypeStats,
        dailyTrends,
        topContent,
        summary: {
          totalEvents: languageStats.reduce((sum, stat) => sum + stat.eventCount, 0),
          totalSessions: Math.max(...languageStats.map(stat => stat.uniqueSessions)),
          averageFallbackRate: languageStats.reduce((sum, stat) => sum + (stat.fallbackRate || 0), 0) / languageStats.length,
          averageQuality: languageStats.reduce((sum, stat) => sum + (stat.avgQuality || 0), 0) / languageStats.length
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Error generating analytics dashboard', { error, component: 'LocalizationAPI' });
    res.status(500).json({
      success: false,
      error: 'Failed to generate analytics dashboard'
    });
  }
});

// =====================================================================
// HELPER FUNCTIONS
// =====================================================================

/**
 * Ensure translation key exists in database
 */
async function ensureTranslationKey(keyData: {
  keyPath: string;
  category: string;
  context?: string;
  defaultValue: string;
  interpolationVars?: any;
}): Promise<number> {
  // Check if key exists
  const existing = await db
    .select()
    .from(translationKeys)
    .where(eq(translationKeys.keyPath, keyData.keyPath))
    .limit(1);

  if (existing.length > 0) {
    return existing[0].id;
  }

  // Create new key
  const [newKey] = await db.insert(translationKeys).values({
    keyPath: keyData.keyPath,
    category: keyData.category,
    context: keyData.context,
    defaultValue: keyData.defaultValue,
    interpolationVars: keyData.interpolationVars,
    priority: 2 // Default priority
  }).returning({ id: translationKeys.id });

  return newKey.id;
}

export default router;