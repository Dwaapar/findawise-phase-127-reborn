/**
 * Admin API Routes - Translation & Cultural Management
 * Billion-Dollar Empire Grade Admin Interface Backend
 */

import { Router } from 'express';
import { eq, and, like, inArray, desc, asc, sql } from 'drizzle-orm';
import { db } from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';
import { logger } from '../../utils/logger.js';
import {
  languages,
  translationKeys,
  translations,
  userLanguagePreferences,
  localizedContentAssignments,
  localizationAnalytics
} from '../../../shared/localization.js';
import {
  culturalMappings,
  emotionProfiles,
  userEmotionTracking,
  culturalABTests,
  culturalPersonalizationRules,
  culturalAnalytics
} from '../../../shared/culturalEmotionTables.js';

const router = Router();

// =====================================================================
// TRANSLATION MANAGEMENT ROUTES
// =====================================================================

/**
 * Get all translation keys with pagination and filtering
 */
router.get('/translation-keys', requireAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      category, 
      priority, 
      search 
    } = req.query;

    let whereConditions = [];
    
    // Apply filters
    if (category && category !== 'all') {
      whereConditions.push(eq(translationKeys.category, category as string));
    }
    
    if (priority && priority !== 'all') {
      whereConditions.push(eq(translationKeys.priority, parseInt(priority as string)));
    }
    
    if (search) {
      whereConditions.push(
        sql`${translationKeys.keyPath} ILIKE ${`%${search}%`} OR ${translationKeys.defaultValue} ILIKE ${`%${search}%`}`
      );
    }

    // Build query
    let query = db.select().from(translationKeys);
    
    if (whereConditions.length > 0) {
      query = query.where(whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions));
    }

    // Add pagination
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    const result = await query.limit(parseInt(limit as string)).offset(offset);

    res.json({
      success: true,
      data: result,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: result.length
      }
    });

  } catch (error: any) {
    logger.error('Failed to get translation keys', { error, component: 'AdminAPI' });
    res.status(500).json({
      success: false,
      error: 'Failed to get translation keys'
    });
  }
});

/**
 * Get translations for a specific language
 */
router.get('/translations', requireAuth, async (req, res) => {
  try {
    const { language, status = 'all' } = req.query;

    if (!language) {
      return res.status(400).json({
        success: false,
        error: 'Language parameter is required'
      });
    }

    let whereConditions = [eq(translations.languageCode, language as string)];

    // Apply status filter
    if (status === 'verified') {
      whereConditions.push(eq(translations.isVerified, true));
    } else if (status === 'unverified') {
      whereConditions.push(eq(translations.isVerified, false));
    } else if (status === 'auto-translated') {
      whereConditions.push(eq(translations.isAutoTranslated, true));
    }

    const result = await db
      .select({
        id: translations.id,
        keyId: translations.keyId,
        languageCode: translations.languageCode,
        translatedValue: translations.translatedValue,
        isAutoTranslated: translations.isAutoTranslated,
        isVerified: translations.isVerified,
        quality: translations.quality,
        lastReviewed: translations.lastReviewed,
        reviewerId: translations.reviewerId,
        metadata: translations.metadata,
        createdAt: translations.createdAt,
        updatedAt: translations.updatedAt,
        keyPath: translationKeys.keyPath,
        defaultValue: translationKeys.defaultValue,
        category: translationKeys.category,
        priority: translationKeys.priority
      })
      .from(translations)
      .leftJoin(translationKeys, eq(translations.keyId, translationKeys.id))
      .where(whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions))
      .orderBy(desc(translations.updatedAt));

    res.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    logger.error('Failed to get translations', { error, component: 'AdminAPI' });
    res.status(500).json({
      success: false,
      error: 'Failed to get translations'
    });
  }
});

/**
 * Get missing translations for a language
 */
router.get('/missing-translations', requireAuth, async (req, res) => {
  try {
    const { language } = req.query;

    if (!language) {
      return res.status(400).json({
        success: false,
        error: 'Language parameter is required'
      });
    }

    // Find translation keys that don't have translations for this language
    const existingTranslations = await db
      .select({ keyId: translations.keyId })
      .from(translations)
      .where(eq(translations.languageCode, language as string));

    const existingKeyIds = existingTranslations.map(t => t.keyId);

    let missingKeys;
    
    if (existingKeyIds.length > 0) {
      missingKeys = await db
        .select({
          keyPath: translationKeys.keyPath,
          defaultValue: translationKeys.defaultValue,
          category: translationKeys.category,
          priority: translationKeys.priority,
          context: translationKeys.context
        })
        .from(translationKeys)
        .where(sql`${translationKeys.id} NOT IN (${existingKeyIds.join(',')})`)
        .orderBy(asc(translationKeys.priority));
    } else {
      missingKeys = await db
        .select({
          keyPath: translationKeys.keyPath,
          defaultValue: translationKeys.defaultValue,
          category: translationKeys.category,
          priority: translationKeys.priority,
          context: translationKeys.context
        })
        .from(translationKeys)
        .orderBy(asc(translationKeys.priority));
    }

    // Add cultural complexity estimation
    const missingWithComplexity = missingKeys.map(key => ({
      ...key,
      languageCode: language,
      estimatedEffort: key.defaultValue.length > 100 ? 'high' : 
                      key.defaultValue.length > 50 ? 'medium' : 'low',
      culturalComplexity: Math.min(0.9, 0.3 + ((key.priority || 1) * 0.2) + (key.defaultValue.length / 1000))
    }));

    res.json({
      success: true,
      data: missingWithComplexity
    });

  } catch (error: any) {
    logger.error('Failed to get missing translations', { error, component: 'AdminAPI' });
    res.status(500).json({
      success: false,
      error: 'Failed to get missing translations'
    });
  }
});

/**
 * Get translation statistics for a language
 */
router.get('/translation-stats', requireAuth, async (req, res) => {
  try {
    const { language } = req.query;

    if (!language) {
      return res.status(400).json({
        success: false,
        error: 'Language parameter is required'
      });
    }

    const [totalKeysResult, translatedKeysResult, pendingReviewsResult, autoTranslatedResult] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(translationKeys),
      db.select({ count: sql<number>`count(*)` })
        .from(translations)
        .where(eq(translations.languageCode, language as string)),
      db.select({ count: sql<number>`count(*)` })
        .from(translations)
        .where(and(
          eq(translations.languageCode, language as string),
          eq(translations.isVerified, false)
        )),
      db.select({ count: sql<number>`count(*)` })
        .from(translations)
        .where(and(
          eq(translations.languageCode, language as string),
          eq(translations.isAutoTranslated, true)
        ))
    ]);

    const totalKeys = totalKeysResult[0]?.count || 0;
    const translatedKeys = translatedKeysResult[0]?.count || 0;
    const pendingReviews = pendingReviewsResult[0]?.count || 0;
    const autoTranslatedCount = autoTranslatedResult[0]?.count || 0;

    const completionPercentage = totalKeys > 0 ? Math.round((translatedKeys / totalKeys) * 100) : 0;
    const qualityScore = translatedKeys > 0 ? Math.round(((translatedKeys - autoTranslatedCount) / translatedKeys) * 100) : 0;

    res.json({
      success: true,
      data: {
        totalKeys,
        translatedKeys,
        missingTranslations: totalKeys - translatedKeys,
        completionPercentage,
        lastUpdated: new Date().toISOString(),
        pendingReviews,
        autoTranslatedCount,
        qualityScore
      }
    });

  } catch (error: any) {
    logger.error('Failed to get translation stats', { error, component: 'AdminAPI' });
    res.status(500).json({
      success: false,
      error: 'Failed to get translation stats'
    });
  }
});

/**
 * Auto-translate missing translations
 */
router.post('/auto-translate', requireAuth, async (req, res) => {
  try {
    const { keyPaths, targetLanguage, provider = 'auto' } = req.body;

    if (!keyPaths || !Array.isArray(keyPaths) || !targetLanguage) {
      return res.status(400).json({
        success: false,
        error: 'keyPaths array and targetLanguage are required'
      });
    }

    // Get the translation keys
    const keys = await db
      .select()
      .from(translationKeys)
      .where(inArray(translationKeys.keyPath, keyPaths));

    let translatedCount = 0;

    for (const key of keys) {
      try {
        // Simple mock translation - in production, use real translation service
        const translatedValue = `[${targetLanguage.toUpperCase()}] ${key.defaultValue}`;
        
        // Check if translation already exists
        const existing = await db
          .select()
          .from(translations)
          .where(and(
            eq(translations.keyId, key.id),
            eq(translations.languageCode, targetLanguage)
          ));

        if (existing.length === 0) {
          // Insert new translation
          await db.insert(translations).values({
            keyId: key.id,
            languageCode: targetLanguage,
            translatedValue,
            isAutoTranslated: true,
            isVerified: false,
            quality: 75, // Default quality for auto-translations
            metadata: {
              provider,
              timestamp: new Date().toISOString(),
              confidence: 0.8
            }
          });

          translatedCount++;
        }

      } catch (err) {
        logger.error('Failed to translate key', { keyPath: key.keyPath, error: err });
      }
    }

    res.json({
      success: true,
      count: translatedCount,
      message: `Successfully auto-translated ${translatedCount} keys`
    });

  } catch (error: any) {
    logger.error('Failed to auto-translate', { error, component: 'AdminAPI' });
    res.status(500).json({
      success: false,
      error: 'Failed to auto-translate'
    });
  }
});

/**
 * Verify a translation
 */
router.post('/translations/:id/verify', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id || 'admin';

    await db
      .update(translations)
      .set({
        isVerified: true,
        lastReviewed: new Date(),
        reviewerId: userId,
        updatedAt: new Date()
      })
      .where(eq(translations.id, parseInt(id)));

    res.json({
      success: true,
      message: 'Translation verified successfully'
    });

  } catch (error: any) {
    logger.error('Failed to verify translation', { error, component: 'AdminAPI' });
    res.status(500).json({
      success: false,
      error: 'Failed to verify translation'
    });
  }
});

/**
 * Export translations in various formats
 */
router.get('/export-translations', requireAuth, async (req, res) => {
  try {
    const { language, format = 'json' } = req.query;

    if (!language) {
      return res.status(400).json({
        success: false,
        error: 'Language parameter is required'
      });
    }

    // Get all translations for the language
    const translationData = await db
      .select({
        keyPath: translationKeys.keyPath,
        translatedValue: translations.translatedValue,
        defaultValue: translationKeys.defaultValue,
        category: translationKeys.category,
        isVerified: translations.isVerified,
        quality: translations.quality
      })
      .from(translations)
      .leftJoin(translationKeys, eq(translations.keyId, translationKeys.id))
      .where(eq(translations.languageCode, language as string));

    let output: string;
    let contentType: string;
    let fileExtension: string;

    switch (format) {
      case 'csv':
        contentType = 'text/csv';
        fileExtension = 'csv';
        output = 'keyPath,translatedValue,defaultValue,category,isVerified,quality\n';
        output += translationData.map(row => 
          `"${row.keyPath}","${row.translatedValue}","${row.defaultValue}","${row.category}",${row.isVerified},${row.quality}`
        ).join('\n');
        break;

      case 'po':
        contentType = 'text/plain';
        fileExtension = 'po';
        output = `# Translation file for ${language}\n`;
        output += `# Generated on ${new Date().toISOString()}\n\n`;
        output += translationData.map(row => 
          `msgid "${row.defaultValue}"\nmsgstr "${row.translatedValue}"\n`
        ).join('\n');
        break;

      default: // json
        contentType = 'application/json';
        fileExtension = 'json';
        const jsonData = translationData.reduce((acc, row) => {
          acc[row.keyPath] = row.translatedValue;
          return acc;
        }, {} as Record<string, string>);
        output = JSON.stringify(jsonData, null, 2);
        break;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=translations_${language}.${fileExtension}`);
    res.send(output);

  } catch (error: any) {
    logger.error('Failed to export translations', { error, component: 'AdminAPI' });
    res.status(500).json({
      success: false,
      error: 'Failed to export translations'
    });
  }
});

// =====================================================================
// CULTURAL EMOTION MAP ADMIN ROUTES
// =====================================================================

/**
 * Get all cultural mappings
 */
router.get('/cultural-mappings', requireAuth, async (req, res) => {
  try {
    const mappings = await db
      .select()
      .from(culturalMappings)
      .where(eq(culturalMappings.isActive, true))
      .orderBy(asc(culturalMappings.countryName));

    res.json({
      success: true,
      data: mappings
    });

  } catch (error: any) {
    logger.error('Failed to get cultural mappings', { error, component: 'AdminAPI' });
    res.status(500).json({
      success: false,
      error: 'Failed to get cultural mappings'
    });
  }
});

/**
 * Update cultural mapping
 */
router.put('/cultural-mappings/:countryCode', requireAuth, async (req, res) => {
  try {
    const { countryCode } = req.params;
    const updateData = req.body;

    await db
      .update(culturalMappings)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(culturalMappings.countryCode, countryCode));

    res.json({
      success: true,
      message: 'Cultural mapping updated successfully'
    });

  } catch (error: any) {
    logger.error('Failed to update cultural mapping', { error, component: 'AdminAPI' });
    res.status(500).json({
      success: false,
      error: 'Failed to update cultural mapping'
    });
  }
});

/**
 * Get cultural analytics
 */
router.get('/cultural-analytics', requireAuth, async (req, res) => {
  try {
    const { countryCode, startDate, endDate } = req.query;

    let query = db
      .select()
      .from(userEmotionTracking);

    if (countryCode) {
      query = query.where(eq(userEmotionTracking.countryCode, countryCode as string));
    }

    if (startDate && endDate) {
      query = query.where(
        and(
          sql`${userEmotionTracking.timestamp} >= ${startDate}`,
          sql`${userEmotionTracking.timestamp} <= ${endDate}`
        )
      );
    }

    const analytics = await query
      .orderBy(desc(userEmotionTracking.timestamp))
      .limit(1000);

    // Process analytics data
    const processedData = {
      totalSessions: analytics.length,
      emotionDistribution: {},
      conversionRates: {},
      culturalInsights: []
    };

    res.json({
      success: true,
      data: processedData
    });

  } catch (error: any) {
    logger.error('Failed to get cultural analytics', { error, component: 'AdminAPI' });
    res.status(500).json({
      success: false,
      error: 'Failed to get cultural analytics'
    });
  }
});

/**
 * Create or update A/B test
 */
router.post('/cultural-ab-tests', requireAuth, async (req, res) => {
  try {
    const testData = req.body;
    const userId = (req as any).user?.id || 'admin';

    const newTest = await db
      .insert(culturalABTests)
      .values({
        ...testData,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    res.json({
      success: true,
      data: newTest[0]
    });

  } catch (error: any) {
    logger.error('Failed to create A/B test', { error, component: 'AdminAPI' });
    res.status(500).json({
      success: false,
      error: 'Failed to create A/B test'
    });
  }
});

export { router as adminRouter };