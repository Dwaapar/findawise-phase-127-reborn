/**
 * Enterprise Validation Types
 * A+ Grade Validation System for Billion-Dollar Empire
 */

import { z } from 'zod';

// Numeric validation schemas
export const integerSchema = z.number().int();
export const positiveIntegerSchema = z.number().int().positive();
export const nonNegativeIntegerSchema = z.number().int().min(0);
export const floatSchema = z.number();
export const positiveFloatSchema = z.number().positive();
export const percentageSchema = z.number().min(0).max(100);
export const scoreSchema = z.number().min(0).max(1);

// String validation schemas
export const slugSchema = z.string().regex(/^[a-z0-9-]+$/, 'Must be lowercase alphanumeric with hyphens');
export const urlSchema = z.string().url();
export const emailSchema = z.string().email();
export const uuidSchema = z.string().uuid();
export const timestampSchema = z.string().datetime();
export const colorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be valid hex color');

// Date validation schemas
export const dateSchema = z.date();
export const futureDateSchema = z.date().refine(date => date > new Date(), 'Date must be in the future');
export const pastDateSchema = z.date().refine(date => date < new Date(), 'Date must be in the past');

// Array validation schemas
export const nonEmptyArraySchema = <T>(itemSchema: z.ZodSchema<T>) => 
  z.array(itemSchema).min(1, 'Array cannot be empty');

export const uniqueArraySchema = <T>(itemSchema: z.ZodSchema<T>) =>
  z.array(itemSchema).refine(arr => new Set(arr).size === arr.length, 'Array items must be unique');

// Object validation schemas
export const metadataSchema = z.record(z.any());
export const configSchema = z.record(z.union([z.string(), z.number(), z.boolean(), z.null()]));

// Neuron status validation
export const neuronStatusSchema = z.enum(['active', 'inactive', 'error', 'initializing', 'deploying']);
export const neuronTypeSchema = z.enum(['finance', 'health', 'saas', 'education', 'travel', 'security', 'ai-tools', 'api-only', 'empire-core']);
export const neuronHealthScoreSchema = z.number().int().min(0).max(100);

// Uptime validation (fixing the float/integer issue)
export const uptimeSchema = z.union([
  z.number().int().min(0), // Integer uptime in seconds
  z.number().min(0).transform(val => Math.floor(val)) // Convert float to integer
]);

// Analytics validation
export const conversionRateSchema = z.number().min(0).max(1);
export const engagementScoreSchema = z.number().min(0).max(100);
export const qualityScoreSchema = z.number().min(0).max(100);

// Federation validation
export const federationEventTypeSchema = z.enum([
  'neuron_registered',
  'neuron_updated', 
  'neuron_deleted',
  'config_sync',
  'analytics_sync',
  'heartbeat',
  'status_update',
  'command_execution',
  'bulk_deployment',
  'health_check'
]);

// Content validation
export const contentStatusSchema = z.enum(['draft', 'published', 'archived', 'reviewing']);
export const contentTypeSchema = z.enum(['article', 'tool', 'quiz', 'calculator', 'guide', 'template']);
export const contentLanguageSchema = z.enum(['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko']);

// AI/ML validation
export const modelTypeSchema = z.enum(['classification', 'regression', 'clustering', 'recommendation', 'nlp', 'computer_vision']);
export const modelStatusSchema = z.enum(['training', 'deployed', 'deprecated', 'failed', 'testing']);
export const confidenceScoreSchema = z.number().min(0).max(1);

// Currency and financial validation
export const currencySchema = z.enum(['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY']);
export const priceSchema = z.number().positive();
export const discountSchema = z.number().min(0).max(100);

// Geographic validation
export const countryCodeSchema = z.string().length(2).regex(/^[A-Z]{2}$/, 'Must be ISO 3166-1 alpha-2 country code');
export const timezoneSchema = z.string().regex(/^[A-Za-z_\/]+$/, 'Must be valid timezone identifier');

// Priority and severity validation
export const prioritySchema = z.enum(['low', 'medium', 'high', 'critical']);
export const severitySchema = z.enum(['info', 'warning', 'error', 'critical']);

// Compliance validation
export const complianceFrameworkSchema = z.enum(['GDPR', 'CCPA', 'LGPD', 'PIPEDA', 'PDPA']);
export const consentTypeSchema = z.enum(['necessary', 'functional', 'analytics', 'marketing', 'social_media']);
export const legalBasisSchema = z.enum(['consent', 'contract', 'legal_obligation', 'vital_interests', 'public_task', 'legitimate_interests']);

// Device and platform validation
export const deviceTypeSchema = z.enum(['desktop', 'mobile', 'tablet', 'tv', 'watch', 'unknown']);
export const platformSchema = z.enum(['web', 'ios', 'android', 'windows', 'macos', 'linux']);
export const browserSchema = z.enum(['chrome', 'firefox', 'safari', 'edge', 'opera', 'other']);

// Performance validation
export const responseTimeSchema = z.number().positive().max(30000); // Max 30 seconds
export const throughputSchema = z.number().positive().max(10000); // Max 10k requests per second
export const cpuUsageSchema = z.number().min(0).max(100);
export const memoryUsageSchema = z.number().min(0).max(100);
export const diskUsageSchema = z.number().min(0).max(100);

// Validation utilities
export function safeParseInteger(value: any): number {
  if (typeof value === 'number') {
    return Number.isInteger(value) ? value : Math.floor(value);
  }
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? 0 : parsed;
}

export function safeParseFloat(value: any): number {
  if (typeof value === 'number') {
    return value;
  }
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

export function validateAndTransform<T>(schema: z.ZodSchema<T>, data: any): T {
  return schema.parse(data);
}

export function safeValidateAndTransform<T>(schema: z.ZodSchema<T>, data: any, defaultValue: T): T {
  try {
    return schema.parse(data);
  } catch {
    return defaultValue;
  }
}

// Common validation combinations
export const neuronValidationSchema = z.object({
  name: z.string().min(1),
  type: neuronTypeSchema,
  status: neuronStatusSchema,
  healthScore: neuronHealthScoreSchema,
  uptime: uptimeSchema,
  url: urlSchema.optional(),
  version: z.string().optional(),
  niche: z.string().optional()
});

export const analyticsValidationSchema = z.object({
  sessionId: z.string().min(1),
  eventType: z.string().min(1),
  timestamp: dateSchema.optional(),
  value: z.number().optional(),
  metadata: metadataSchema.optional()
});

export const performanceValidationSchema = z.object({
  responseTime: responseTimeSchema,
  cpuUsage: cpuUsageSchema,
  memoryUsage: memoryUsageSchema,
  timestamp: dateSchema.optional()
});

// Export all validation functions
export type NeuronValidation = z.infer<typeof neuronValidationSchema>;
export type AnalyticsValidation = z.infer<typeof analyticsValidationSchema>;
export type PerformanceValidation = z.infer<typeof performanceValidationSchema>;