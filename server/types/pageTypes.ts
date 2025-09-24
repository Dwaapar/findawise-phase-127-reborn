import { z } from "zod";

// ==========================================
// EMPIRE GRADE PAGE TYPE DEFINITIONS
// ==========================================

export type ModuleType = 
  | 'hero' 
  | 'features' 
  | 'quiz' 
  | 'calculator' 
  | 'testimonials' 
  | 'cta' 
  | 'blog' 
  | 'offers' 
  | 'lead-magnet'
  | 'video'
  | 'gallery'
  | 'contact'
  | 'faq'
  | 'pricing'
  | 'comparison';

export type EmotionType = 
  | 'trust' 
  | 'excitement' 
  | 'relief' 
  | 'confidence' 
  | 'calm' 
  | 'urgency'
  | 'curiosity'
  | 'fear'
  | 'joy'
  | 'pride';

export type LayoutType = 'landing' | 'blog' | 'sales' | 'squeeze' | 'comparison' | 'custom';

export const PageConfigSchema = z.object({
  id: z.string(),
  slug: z.string().min(1),
  title: z.string().min(1).max(100),
  description: z.string().max(300),
  layout: z.enum(['landing', 'blog', 'sales', 'squeeze', 'comparison', 'custom']),
  emotion: z.enum(['trust', 'excitement', 'relief', 'confidence', 'calm', 'urgency', 'curiosity', 'fear', 'joy', 'pride']),
  modules: z.array(z.object({
    type: z.enum(['hero', 'features', 'quiz', 'calculator', 'testimonials', 'cta', 'blog', 'offers', 'lead-magnet', 'video', 'gallery', 'contact', 'faq', 'pricing', 'comparison']),
    config: z.record(z.any()),
    order: z.number(),
    visible: z.boolean().default(true)
  })),
  meta: z.object({
    keywords: z.array(z.string()).optional(),
    author: z.string().optional(),
    canonicalUrl: z.string().optional(),
    openGraph: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      image: z.string().optional(),
      type: z.string().default('website')
    }).optional(),
    jsonLd: z.record(z.any()).optional()
  }).optional(),
  localization: z.object({
    locale: z.string().default('en-US'),
    translations: z.record(z.string()).optional()
  }).optional(),
  abTest: z.object({
    enabled: z.boolean().default(false),
    variant: z.string().optional(),
    testId: z.string().optional()
  }).optional(),
  analytics: z.object({
    trackingEnabled: z.boolean().default(true),
    customEvents: z.array(z.string()).optional()
  }).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  publishedAt: z.date().optional(),
  version: z.string().default('1.0.0')
});

export type PageConfig = z.infer<typeof PageConfigSchema>;

export const PageGenerationRequestSchema = z.object({
  config: PageConfigSchema,
  context: z.object({
    userId: z.string().optional(),
    sessionId: z.string().optional(),
    requestId: z.string(),
    source: z.enum(['admin', 'api', 'auto', 'import']),
    preview: z.boolean().default(false),
    skipValidation: z.boolean().default(false)
  }),
  options: z.object({
    enableSSR: z.boolean().default(true),
    enableSSG: z.boolean().default(false),
    cacheEnabled: z.boolean().default(true),
    minifyOutput: z.boolean().default(true)
  }).optional()
});

export type PageGenerationRequest = z.infer<typeof PageGenerationRequestSchema>;

export interface PageGenerationResponse {
  success: boolean;
  pageId: string;
  html?: string;
  metadata: {
    generatedAt: Date;
    renderTime: number;
    cacheHit: boolean;
    moduleCount: number;
    warnings: string[];
    errors: string[];
  };
  snapshot?: {
    id: string;
    config: PageConfig;
    createdAt: Date;
  };
}

export const DEFAULT_PAGE_CONFIG: Partial<PageConfig> = {
  layout: 'landing',
  emotion: 'trust',
  modules: [],
  meta: {
    openGraph: { type: 'website' }
  },
  localization: { locale: 'en-US' },
  abTest: { enabled: false },
  analytics: { trackingEnabled: true },
  version: '1.0.0'
};

export function validatePageConfig(config: any): { isValid: boolean; errors: string[]; warnings: string[] } {
  try {
    PageConfigSchema.parse(config);
    return { isValid: true, errors: [], warnings: [] };
  } catch (error: any) {
    const errors = error.errors?.map((e: any) => `${e.path.join('.')}: ${e.message}`) || ['Invalid config'];
    return { isValid: false, errors, warnings: [] };
  }
}

export function validateGenerationRequest(request: any): { isValid: boolean; errors: string[]; warnings: string[] } {
  try {
    PageGenerationRequestSchema.parse(request);
    return { isValid: true, errors: [], warnings: [] };
  } catch (error: any) {
    const errors = error.errors?.map((e: any) => `${e.path.join('.')}: ${e.message}`) || ['Invalid request'];
    return { isValid: false, errors, warnings: [] };
  }
}