// ==========================================
// EMPIRE-GRADE MODULE TYPE DEFINITIONS
// Full TypeScript definitions for billion-dollar scale modules
// ==========================================

import { z } from "zod";

// ===== CORE EMPIRE INTERFACES =====

export interface EmpireModuleContext {
  userId?: string;
  sessionId: string;
  requestId: string;
  source: 'admin' | 'api' | 'auto' | 'import' | 'federation' | 'ai';
  region: string;
  locale: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'vr' | 'ar';
  userAgent: string;
  ipAddress: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

export interface EmpireValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
    code: string;
  }>;
  warnings: Array<{
    field: string;
    message: string;
    suggestion?: string;
  }>;
  score: number; // 0-100
  processingTime: number;
  validatedAt: Date;
}

export interface EmpireAuditLog {
  id: string;
  moduleType: 'page' | 'emotion' | 'blog' | 'pointer';
  action: string;
  userId?: string;
  sessionId: string;
  before?: any;
  after?: any;
  diff?: Array<{
    path: string;
    operation: 'add' | 'remove' | 'change';
    oldValue?: any;
    newValue?: any;
  }>;
  metadata: Record<string, any>;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  rollbackData?: any;
}

export interface EmpirePerformanceMetrics {
  moduleType: string;
  operation: string;
  duration: number;
  memoryUsage: number;
  cpuUsage: number;
  cacheHitRate: number;
  errorRate: number;
  throughput: number;
  latency: {
    p50: number;
    p95: number;
    p99: number;
  };
  timestamp: Date;
}

export interface EmpireSecurityContext {
  accessLevel: 'public' | 'authenticated' | 'admin' | 'system';
  permissions: string[];
  rateLimitInfo: {
    requests: number;
    windowMs: number;
    resetTime: Date;
  };
  securityHeaders: Record<string, string>;
  sanitizationLevel: 'basic' | 'strict' | 'paranoid';
  contentSecurityPolicy: string[];
}

// ===== DYNAMIC PAGE GENERATOR TYPES =====

export const ModuleTypeSchema = z.enum([
  'hero', 'features', 'testimonials', 'pricing', 'faq', 'cta', 'blog',
  'quiz', 'calculator', 'lead-magnet', 'video', 'gallery', 'contact',
  'newsletter', 'countdown', 'social-proof', 'affiliate-offers',
  'recommendations', 'analytics-tracker', 'chat-widget', 'search',
  'filter', 'comparison', 'timeline', 'map', 'calendar', 'form',
  'table', 'chart', 'embed', 'custom'
]);

export const EmotionTypeSchema = z.enum([
  'trust', 'excitement', 'urgency', 'curiosity', 'fear', 'safety',
  'prestige', 'belonging', 'achievement', 'comfort', 'adventure',
  'nostalgia', 'empowerment', 'relief', 'anticipation', 'joy',
  'surprise', 'anger', 'sadness', 'disgust', 'contempt', 'pride',
  'shame', 'guilt', 'envy', 'gratitude', 'hope', 'love', 'compassion'
]);

export const LayoutTypeSchema = z.enum([
  'single-column', 'two-column', 'three-column', 'grid', 'masonry',
  'sidebar-left', 'sidebar-right', 'fullwidth', 'boxed', 'split-screen',
  'hero-focus', 'content-first', 'media-rich', 'minimal', 'magazine',
  'landing', 'sales', 'blog', 'portfolio', 'dashboard', 'custom'
]);

export const PageConfigSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  layout: LayoutTypeSchema,
  emotion: EmotionTypeSchema,
  modules: z.array(z.object({
    id: z.string().uuid(),
    type: ModuleTypeSchema,
    order: z.number().min(0),
    config: z.record(z.any()),
    visible: z.boolean().default(true),
    permissions: z.array(z.string()).optional(),
    conditions: z.array(z.object({
      field: z.string(),
      operator: z.enum(['equals', 'contains', 'greater', 'less', 'regex']),
      value: z.any(),
      logic: z.enum(['and', 'or']).default('and')
    })).optional()
  })),
  meta: z.object({
    metaTitle: z.string().max(60).optional(),
    metaDescription: z.string().max(160).optional(),
    keywords: z.array(z.string()).max(20).optional(),
    canonicalUrl: z.string().url().optional(),
    robots: z.string().optional(),
    openGraph: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      image: z.string().url().optional(),
      type: z.string().default('website')
    }).optional(),
    twitter: z.object({
      card: z.enum(['summary', 'summary_large_image']).default('summary'),
      title: z.string().optional(),
      description: z.string().optional(),
      image: z.string().url().optional()
    }).optional(),
    structuredData: z.record(z.any()).optional()
  }),
  abTest: z.object({
    enabled: z.boolean().default(false),
    variantId: z.string().optional(),
    trafficSplit: z.number().min(0).max(100).default(50),
    variants: z.array(z.object({
      id: z.string(),
      name: z.string(),
      weight: z.number().min(0).max(100),
      modifications: z.record(z.any())
    })).optional()
  }).optional(),
  localization: z.object({
    defaultLocale: z.string().default('en-US'),
    supportedLocales: z.array(z.string()),
    autoDetect: z.boolean().default(true),
    fallbackContent: z.record(z.string()).optional()
  }),
  analytics: z.object({
    tracking: z.object({
      googleAnalytics: z.string().optional(),
      facebookPixel: z.string().optional(),
      customEvents: z.array(z.object({
        name: z.string(),
        trigger: z.string(),
        parameters: z.record(z.any()).optional()
      })).optional()
    }).optional(),
    conversion: z.object({
      goals: z.array(z.object({
        id: z.string(),
        name: z.string(),
        type: z.enum(['click', 'form_submit', 'time_on_page', 'scroll', 'custom']),
        selector: z.string().optional(),
        value: z.number().optional()
      })).optional()
    }).optional()
  }).optional(),
  security: z.object({
    contentSecurityPolicy: z.array(z.string()).optional(),
    accessControl: z.object({
      public: z.boolean().default(true),
      requireAuth: z.boolean().default(false),
      roles: z.array(z.string()).optional(),
      permissions: z.array(z.string()).optional()
    }),
    rateLimiting: z.object({
      enabled: z.boolean().default(true),
      requestsPerMinute: z.number().default(60),
      identifier: z.enum(['ip', 'user', 'session']).default('ip')
    }).optional()
  }),
  performance: z.object({
    caching: z.object({
      enabled: z.boolean().default(true),
      ttl: z.number().default(3600),
      varyBy: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional()
    }),
    compression: z.object({
      enabled: z.boolean().default(true),
      level: z.number().min(1).max(9).default(6),
      types: z.array(z.string()).optional()
    }).optional(),
    lazyLoading: z.object({
      enabled: z.boolean().default(true),
      threshold: z.number().default(200),
      modules: z.array(z.string()).optional()
    }).optional()
  }),
  publishedAt: z.date().optional(),
  scheduledAt: z.date().optional(),
  expiresAt: z.date().optional(),
  version: z.string().default('1.0.0'),
  status: z.enum(['draft', 'published', 'archived', 'scheduled']).default('draft'),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional()
});

export type PageConfig = z.infer<typeof PageConfigSchema>;
export type ModuleType = z.infer<typeof ModuleTypeSchema>;
export type EmotionType = z.infer<typeof EmotionTypeSchema>;
export type LayoutType = z.infer<typeof LayoutTypeSchema>;

export interface PageSnapshot {
  id: string;
  pageId: string;
  config: PageConfig;
  renderedHtml: string;
  renderedCss: string;
  renderedJs: string;
  assets: string[];
  metadata: {
    renderTime: number;
    size: number;
    seoScore: number;
    performanceScore: number;
    accessibilityScore: number;
    securityScore: number;
    moduleErrors: string[];
    warnings: string[];
  };
  createdAt: Date;
  createdBy?: string;
  description?: string;
}

export interface PageGenerationRequest {
  config: PageConfig;
  context: EmpireModuleContext;
  options: {
    preview: boolean;
    skipValidation: boolean;
    skipCache: boolean;
    includeAnalytics: boolean;
    optimizeForSpeed: boolean;
    generateSnapshot: boolean;
    customProcessors: string[];
  };
}

export interface PageGenerationResponse {
  success: boolean;
  pageId: string;
  html: string;
  css: string;
  js: string;
  assets: string[];
  metadata: {
    generationTime: number;
    cacheHit: boolean;
    modulesRendered: number;
    seoScore: number;
    performanceMetrics: EmpirePerformanceMetrics;
    validationResult: EmpireValidationResult;
    warnings: string[];
    errors: string[];
  };
  snapshotId?: string;
  auditLogId: string;
}

// ===== EMOTION MAPPING ENGINE TYPES =====

export interface EmotionProfile {
  userId: string;
  sessionId: string;
  emotions: Record<string, {
    intensity: number; // 0-1
    confidence: number; // 0-1
    lastDetected: Date;
    source: 'explicit' | 'text' | 'behavior' | 'ml' | 'survey';
    triggers: string[];
    context: Record<string, any>;
  }>;
  dominantEmotion: {
    name: string;
    intensity: number;
    stability: number; // How consistent this emotion is
    duration: number; // How long it's been dominant (ms)
  };
  culturalContext: {
    locale: string;
    region: string;
    culturalDimensions: Record<string, number>;
    communicationStyle: 'direct' | 'indirect' | 'formal' | 'casual' | 'mixed';
  };
  personalityTraits: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
    confidence: number;
  };
  preferences: {
    contentTone: string[];
    visualStyle: string[];
    interactionPatterns: string[];
    communicationFrequency: 'low' | 'medium' | 'high';
    privacyLevel: 'minimal' | 'balanced' | 'strict';
  };
  behaviorPatterns: {
    sessionDuration: number;
    clickPatterns: Record<string, number>;
    scrollBehavior: Record<string, number>;
    conversionTriggers: string[];
    engagementMetrics: Record<string, number>;
  };
  history: Array<{
    timestamp: Date;
    emotion: string;
    intensity: number;
    trigger: string;
    context: Record<string, any>;
    accuracy: number;
  }>;
  mlFeatures: number[];
  lastUpdated: Date;
  version: string;
}

export interface EmotionAnalysisResult {
  sessionId: string;
  emotions: Array<{
    name: string;
    intensity: number;
    confidence: number;
    indicators: Array<{
      type: 'text' | 'behavior' | 'context' | 'ml';
      value: string;
      weight: number;
      source: string;
    }>;
    culturalFactors: Array<{
      factor: string;
      impact: number;
      explanation: string;
    }>;
  }>;
  dominantEmotion: {
    name: string;
    intensity: number;
    confidence: number;
    reasoning: string[];
  };
  sentiment: {
    polarity: number; // -1 to 1
    subjectivity: number; // 0-1
    arousal: number; // 0-1 (calm to excited)
    valence: number; // -1 to 1 (negative to positive)
  };
  recommendations: {
    contentAdjustments: Array<{
      type: 'tone' | 'visual' | 'structure' | 'timing';
      adjustment: string;
      confidence: number;
      expectedImpact: number;
    }>;
    engagementStrategies: Array<{
      strategy: string;
      description: string;
      implementation: string;
      priority: number;
    }>;
    personalizationRules: Array<{
      condition: string;
      action: string;
      weight: number;
    }>;
  };
  metadata: {
    processingTime: number;
    algorithmsUsed: string[];
    dataQuality: number;
    limitations: string[];
    nextAnalysisRecommended: Date;
  };
}

// ===== BLOG/CONTENT ENGINE TYPES =====

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  content: string;
  excerpt: string;
  featuredImage?: {
    url: string;
    alt: string;
    caption?: string;
    credits?: string;
  };
  author: {
    id: string;
    name: string;
    avatar?: string;
    bio?: string;
    socialLinks?: Record<string, string>;
  };
  coAuthors?: Array<{
    id: string;
    name: string;
    role: string;
    contribution: string;
  }>;
  status: 'draft' | 'review' | 'scheduled' | 'published' | 'archived' | 'deleted';
  visibility: 'public' | 'private' | 'password' | 'members_only';
  publishedAt?: Date;
  scheduledAt?: Date;
  updatedAt: Date;
  createdAt: Date;
  tags: Array<{
    name: string;
    slug: string;
    color?: string;
  }>;
  categories: Array<{
    name: string;
    slug: string;
    description?: string;
    parent?: string;
  }>;
  contentBlocks: Array<{
    id: string;
    type: 'paragraph' | 'heading' | 'image' | 'video' | 'code' | 'quote' | 'list' | 'table' | 'embed' | 'cta' | 'affiliate' | 'quiz' | 'calculator' | 'custom';
    order: number;
    content: any;
    config: Record<string, any>;
    visible: boolean;
    permissions?: string[];
    conditions?: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
  }>;
  metadata: {
    readingTime: number;
    wordCount: number;
    characterCount: number;
    seoScore: number;
    readabilityScore: number;
    grammarScore: number;
    originalityScore: number;
    aiGenerated: boolean;
    aiAssisted: boolean;
    contentQuality: {
      accuracy: number;
      relevance: number;
      engagement: number;
      comprehensiveness: number;
    };
    version: string;
    revisions: number;
    lastSeoCheck: Date;
    nextSeoCheck: Date;
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    focusKeyword?: string;
    keywords: string[];
    canonicalUrl?: string;
    robots: string;
    openGraph: {
      title: string;
      description: string;
      image?: string;
      type: string;
      locale: string;
    };
    twitter: {
      card: 'summary' | 'summary_large_image';
      title: string;
      description: string;
      image?: string;
      creator?: string;
    };
    structuredData: {
      type: string;
      data: Record<string, any>;
    };
    breadcrumbs: Array<{
      name: string;
      url: string;
    }>;
  };
  localization: {
    defaultLocale: string;
    translations: Record<string, {
      title: string;
      content: string;
      excerpt: string;
      slug: string;
      status: 'draft' | 'published' | 'outdated';
      lastSync: Date;
    }>;
    autoTranslate: boolean;
    translationStatus: 'none' | 'partial' | 'complete' | 'outdated';
  };
  analytics: {
    views: number;
    uniqueViews: number;
    shares: Record<string, number>;
    comments: number;
    reactions: Record<string, number>;
    avgTimeOnPage: number;
    bounceRate: number;
    exitRate: number;
    conversionRate: number;
    searchImpressions: number;
    searchClicks: number;
    avgPosition: number;
    backlinks: number;
    socialEngagement: Record<string, number>;
    performanceMetrics: {
      loadTime: number;
      interactiveTime: number;
      cumLayoutShift: number;
      firstContentfulPaint: number;
    };
  };
  monetization: {
    affiliateLinks: Array<{
      id: string;
      url: string;
      anchor: string;
      product: string;
      commission: number;
      clicks: number;
      conversions: number;
      revenue: number;
    }>;
    sponsoredContent: {
      isSponsored: boolean;
      sponsor?: string;
      disclosureText?: string;
      amount?: number;
    };
    premiumContent: {
      isPremium: boolean;
      tier?: string;
      unlockConditions?: string[];
    };
  };
  engagement: {
    commentsEnabled: boolean;
    reactionsEnabled: boolean;
    sharingEnabled: boolean;
    printEnabled: boolean;
    downloadEnabled: boolean;
    emailRequired: boolean;
    moderationLevel: 'none' | 'basic' | 'strict';
  };
  workflow: {
    assignedTo?: string;
    reviewers: string[];
    approvers: string[];
    feedback: Array<{
      id: string;
      reviewer: string;
      type: 'comment' | 'suggestion' | 'approval' | 'rejection';
      content: string;
      resolved: boolean;
      createdAt: Date;
    }>;
    revisionHistory: Array<{
      id: string;
      version: string;
      changes: string;
      author: string;
      timestamp: Date;
      approved: boolean;
    }>;
  };
  security: {
    passwordProtected: boolean;
    password?: string;
    accessLog: Array<{
      userId?: string;
      ip: string;
      timestamp: Date;
      action: string;
    }>;
    contentHash: string;
    digitalSignature?: string;
  };
}

// ===== CONTENT POINTER LOGIC TYPES =====

export interface ContentPointer {
  id: string;
  sourceId: string;
  sourceType: 'page' | 'blog' | 'module' | 'asset' | 'external';
  targetId: string;
  targetType: 'page' | 'blog' | 'module' | 'asset' | 'external' | 'api' | 'dynamic';
  pointerType: 'slug' | 'url' | 'id' | 'api' | 'file' | 'dynamic' | 'conditional';
  relationshipType: 'related' | 'prerequisite' | 'follow_up' | 'alternative' | 'complement' | 'upgrade' | 'embedded' | 'parent' | 'child' | 'sibling';
  validationStatus: 'valid' | 'broken' | 'pending' | 'expired' | 'redirected' | 'unauthorized' | 'timeout';
  validationDetails: {
    lastChecked: Date;
    nextCheck: Date;
    checkFrequency: number; // hours
    errorCount: number;
    consecutiveErrors: number;
    lastError?: {
      type: string;
      message: string;
      code?: number;
      timestamp: Date;
    };
    responseTime: number;
    statusCode?: number;
  };
  confidenceScore: number; // 0-1
  priority: number; // 1-10
  weight: number; // For weighted relationships
  conditions: Array<{
    field: string;
    operator: 'equals' | 'contains' | 'matches' | 'greater' | 'less' | 'exists';
    value: any;
    logic: 'and' | 'or';
  }>;
  ttl: number; // Time to live in seconds
  caching: {
    enabled: boolean;
    key: string;
    ttl: number;
    tags: string[];
    lastCached?: Date;
    hitCount: number;
    missCount: number;
  };
  security: {
    accessLevel: 'public' | 'authenticated' | 'admin' | 'system';
    permissions: string[];
    whitelist?: string[];
    blacklist?: string[];
    rateLimiting: {
      enabled: boolean;
      requestsPerMinute: number;
      burstLimit: number;
    };
  };
  metadata: {
    title?: string;
    description?: string;
    tags: string[];
    context: string;
    userBehaviorFactor: number;
    aiRelevanceScore: number;
    semanticSimilarity: number;
    domain?: string;
    contentType: string;
    language: string;
    qualityScore: number;
    trustScore: number;
    originalUrl?: string;
    canonicalUrl?: string;
  };
  fallbackOptions: Array<{
    type: 'content' | 'redirect' | 'error' | 'placeholder';
    priority: number;
    data: any;
  }>;
  analytics: {
    clicks: number;
    uniqueClicks: number;
    conversions: number;
    conversionRate: number;
    bounceRate: number;
    avgTimeOnTarget: number;
    referrers: Record<string, number>;
    devices: Record<string, number>;
    locations: Record<string, number>;
    hourlyStats: Record<string, number>;
    dailyStats: Record<string, number>;
  };
  aiInsights: {
    relevanceScore: number;
    qualityScore: number;
    engagementPrediction: number;
    optimizationSuggestions: Array<{
      type: string;
      suggestion: string;
      confidence: number;
      expectedImpact: number;
    }>;
    semanticEmbeddings: number[];
    topicCategories: string[];
    sentimentScore: number;
  };
  federation: {
    syncEnabled: boolean;
    lastSync?: Date;
    syncErrors: number;
    federationId?: string;
    crossNeuronReferences: Array<{
      neuronId: string;
      pointerId: string;
      relationship: string;
      strength: number;
    }>;
  };
  lifecycle: {
    createdAt: Date;
    updatedAt: Date;
    lastAccessed?: Date;
    accessCount: number;
    createdBy?: string;
    updatedBy?: string;
    scheduledUpdate?: Date;
    autoUpdate: boolean;
    deprecationDate?: Date;
    migrationPath?: string;
  };
  version: string;
}

export interface ContentValidationRule {
  id: string;
  name: string;
  description: string;
  category: 'security' | 'quality' | 'seo' | 'accessibility' | 'performance' | 'compliance';
  severity: 'error' | 'warning' | 'info';
  enabled: boolean;
  conditions: Array<{
    field: string;
    operator: string;
    value: any;
    weight: number;
  }>;
  action: 'block' | 'warn' | 'log' | 'auto_fix';
  autoFixScript?: string;
  customValidator?: string;
  metadata: {
    version: string;
    author: string;
    lastUpdated: Date;
    usage: number;
    successRate: number;
  };
}

export interface BulkOperationRequest {
  operation: 'create' | 'update' | 'delete' | 'validate' | 'migrate';
  items: any[];
  options: {
    batchSize: number;
    parallel: boolean;
    failFast: boolean;
    skipValidation: boolean;
    dryRun: boolean;
    rollbackOnError: boolean;
  };
  context: EmpireModuleContext;
}

export interface BulkOperationResponse {
  success: boolean;
  totalItems: number;
  processedItems: number;
  successfulItems: number;
  failedItems: number;
  results: Array<{
    id: string;
    success: boolean;
    result?: any;
    error?: string;
    warnings?: string[];
  }>;
  metadata: {
    processingTime: number;
    rollbackId?: string;
    auditLogId: string;
  };
}

// ===== EXPORT ALL TYPES =====

export default {
  // Core Types
  EmpireModuleContext,
  EmpireValidationResult,
  EmpireAuditLog,
  EmpirePerformanceMetrics,
  EmpireSecurityContext,
  
  // Page Generator Types
  PageConfig,
  PageSnapshot,
  PageGenerationRequest,
  PageGenerationResponse,
  ModuleType,
  EmotionType,
  LayoutType,
  
  // Emotion Mapping Types
  EmotionProfile,
  EmotionAnalysisResult,
  
  // Blog/Content Types
  BlogPost,
  
  // Content Pointer Types
  ContentPointer,
  ContentValidationRule,
  
  // Bulk Operations
  BulkOperationRequest,
  BulkOperationResponse,
  
  // Schemas
  PageConfigSchema,
  ModuleTypeSchema,
  EmotionTypeSchema,
  LayoutTypeSchema
};