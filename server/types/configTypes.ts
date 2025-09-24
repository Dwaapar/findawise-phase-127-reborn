import { z } from "zod";

// ==========================================
// CENTRAL CONFIG ENGINE - TYPESCRIPT TYPES
// ==========================================

// Base Configuration Schema
// ==========================================
// EMPIRE GRADE ENHANCED BASE SCHEMA
// ==========================================

export const ConfigBaseSchema = z.object({
  configId: z.string().min(1).max(255),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, "Version must follow semantic versioning"),
  
  // ===== META EXPANSION (FUTURE-PROOF) =====
  // Core Verticals
  vertical: z.enum([
    "finance", "health", "saas", "travel", "security", 
    "education", "ai-tools", "ecommerce", "entertainment",
    "real-estate", "automotive", "legal", "medical"
  ]).optional(),
  
  // Localization & Personalization
  locale: z.string().regex(/^[a-z]{2}-[A-Z]{2}$/).default("en-US"),
  userPersona: z.enum([
    "entrepreneur", "investor", "health-seeker", "tech-savvy",
    "budget-conscious", "premium-buyer", "researcher", "casual-browser",
    "decision-maker", "influencer", "early-adopter", "skeptical-buyer"
  ]).optional(),
  intentCluster: z.enum([
    "research", "compare", "purchase", "learn", "evaluate",
    "urgent-buy", "price-shop", "feature-compare", "trust-build",
    "social-proof", "expert-validation", "quick-decision"
  ]).optional(),
  
  // Advanced Layout & Experience
  layoutType: z.enum([
    "standard", "minimal", "premium", "enterprise", 
    "mobile-first", "desktop-optimized", "tablet-friendly",
    "accessibility-focused", "high-conversion", "trust-building"
  ]).default("standard"),
  
  // Enhanced Feature Flags with Metadata
  featureFlags: z.record(z.object({
    enabled: z.boolean(),
    rolloutPercentage: z.number().min(0).max(100).default(100),
    conditions: z.record(z.any()).optional(),
    expiresAt: z.date().optional(),
    description: z.string().optional()
  })).default({}),
  
  // A/B Testing Enhancement
  abTestVariant: z.string().optional(),
  abTestConfig: z.object({
    experimentId: z.string(),
    variantName: z.string(),
    trafficAllocation: z.number().min(0).max(100),
    conversionGoals: z.array(z.string()).default([]),
    startDate: z.date().optional(),
    endDate: z.date().optional()
  }).optional(),
  
  // ===== VERSIONING & MIGRATION =====
  schemaVersion: z.string().default("1.0.0"),
  migrationPath: z.string().optional(),
  compatibilityVersion: z.string().optional(),
  
  // ===== STATUS & CONTROL =====
  isActive: z.boolean().default(true),
  isLocked: z.boolean().default(false),
  deprecated: z.boolean().default(false),
  deprecationDate: z.date().optional(),
  replacementConfigId: z.string().optional(),
  
  // Environment Controls
  environments: z.array(z.enum([
    "development", "staging", "production", 
    "preview", "testing", "canary"
  ])).default(["development"]),
  
  // ===== METADATA ENHANCEMENT =====
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  tags: z.array(z.string().max(50)).max(20).default([]),
  category: z.enum([
    "page", "component", "layout", "theme", "feature",
    "integration", "automation", "analytics", "security",
    "performance", "accessibility", "seo", "conversion"
  ]).optional(),
  
  // Enhanced Change Tracking
  author: z.string().max(255).optional(),
  lastModifiedBy: z.string().max(255).optional(),
  notes: z.string().max(2000).optional(),
  changeReason: z.string().max(500).optional(),
  
  // ===== FUTURE MODULE SUPPORT =====
  // RAG Integration
  ragConfig: z.object({
    enabled: z.boolean().default(false),
    contextQueries: z.array(z.string()).default([]),
    relevanceThreshold: z.number().min(0).max(1).default(0.7),
    maxResults: z.number().min(1).max(50).default(10)
  }).optional(),
  
  // RLHF Integration
  rlhfConfig: z.object({
    enabled: z.boolean().default(false),
    feedbackTypes: z.array(z.string()).default([]),
    optimizationTargets: z.array(z.string()).default([]),
    learningRate: z.number().min(0).max(1).default(0.01)
  }).optional(),
  
  // Memory Graph Integration
  memoryGraphConfig: z.object({
    enabled: z.boolean().default(false),
    nodeTypes: z.array(z.string()).default([]),
    relationships: z.array(z.string()).default([]),
    decayRate: z.number().min(0).max(1).default(0.1)
  }).optional(),
  
  // AI Enhancement Fields
  aiEnhanced: z.boolean().default(false),
  aiGeneratedFields: z.array(z.string()).default([]),
  aiConfidenceScores: z.record(z.number().min(0).max(1)).default({}),
  
  // ===== SECURITY & COMPLIANCE =====
  securityLevel: z.enum(["public", "internal", "confidential", "restricted"]).default("internal"),
  dataClassification: z.enum(["public", "internal", "sensitive", "highly-sensitive"]).default("internal"),
  complianceFlags: z.array(z.enum([
    "gdpr", "ccpa", "hipaa", "pci-dss", "sox", "iso27001"
  ])).default([]),
  
  // Access Control
  accessControl: z.object({
    owners: z.array(z.string()).default([]),
    editors: z.array(z.string()).default([]),
    viewers: z.array(z.string()).default([]),
    restrictedFields: z.array(z.string()).default([])
  }).optional(),
  
  // ===== PERFORMANCE & OPTIMIZATION =====
  performanceHints: z.object({
    cacheable: z.boolean().default(true),
    cacheStrategy: z.enum(["memory", "redis", "cdn", "hybrid"]).default("memory"),
    cacheTtl: z.number().min(0).default(300),
    preloadPriority: z.enum(["low", "normal", "high", "critical"]).default("normal"),
    bundleGroup: z.string().optional()
  }).optional(),
  
  // Resource Management
  resourceLimits: z.object({
    maxSizeBytes: z.number().min(1024).default(1024 * 1024), // 1MB default
    maxDepth: z.number().min(1).max(20).default(10),
    maxArrayItems: z.number().min(1).max(1000).default(100)
  }).optional(),
});

// ==========================================
// EMPIRE GRADE ENHANCED CONFIG SCHEMAS
// ==========================================

// Page Configuration Schema
export const PageConfigSchema = ConfigBaseSchema.extend({
  configData: z.object({
    slug: z.string().min(1),
    path: z.string().min(1),
    
    // SEO Configuration
    seo: z.object({
      title: z.string().min(1),
      description: z.string().min(1).max(160),
      keywords: z.array(z.string()).default([]),
      ogImage: z.string().url().optional(),
      canonical: z.string().url().optional(),
      noindex: z.boolean().default(false),
      nofollow: z.boolean().default(false),
      schema: z.record(z.any()).optional(), // JSON-LD schema
    }),
    
    // Content Configuration
    content: z.object({
      hero: z.object({
        headline: z.string().min(1),
        subheadline: z.string().optional(),
        backgroundImage: z.string().url().optional(),
        backgroundVideo: z.string().url().optional(),
        overlay: z.object({
          enabled: z.boolean().default(false),
          color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
          opacity: z.number().min(0).max(1).optional(),
        }).optional(),
      }),
      
      sections: z.array(z.object({
        id: z.string().min(1),
        type: z.enum(["text", "image", "video", "cta", "form", "quiz", "calculator", "testimonials", "features", "pricing"]),
        title: z.string().optional(),
        content: z.string().optional(),
        config: z.record(z.any()).default({}),
        order: z.number().min(0),
        isVisible: z.boolean().default(true),
        conditions: z.array(z.object({
          type: z.enum(["persona", "emotion", "device", "location", "time"]),
          operator: z.enum(["equals", "not_equals", "contains", "greater_than", "less_than"]),
          value: z.any(),
        })).optional(),
      })),
    }),
    
    // CTA Configuration
    cta: z.object({
      primary: z.object({
        text: z.string().min(1),
        url: z.string().url(),
        type: z.enum(["button", "link", "popup", "inline"]).default("button"),
        style: z.object({
          color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#007BFF"),
          backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
          size: z.enum(["small", "medium", "large"]).default("medium"),
          variant: z.enum(["solid", "outline", "ghost"]).default("solid"),
        }),
        tracking: z.object({
          eventName: z.string().optional(),
          eventData: z.record(z.any()).optional(),
        }).optional(),
      }),
      
      secondary: z.object({
        text: z.string().min(1),
        url: z.string().url(),
        type: z.enum(["button", "link", "popup", "inline"]).default("link"),
        style: z.object({
          color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#6C757D"),
          backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("transparent"),
          size: z.enum(["small", "medium", "large"]).default("medium"),
          variant: z.enum(["solid", "outline", "ghost"]).default("outline"),
        }),
      }).optional(),
    }),
    
    // Offers Configuration
    offers: z.array(z.object({
      id: z.string().min(1),
      slug: z.string().min(1),
      title: z.string().min(1),
      description: z.string().optional(),
      price: z.object({
        amount: z.number().min(0),
        currency: z.string().length(3),
        original: z.number().optional(),
        discount: z.number().min(0).max(100).optional(),
      }),
      features: z.array(z.string()).default([]),
      testimonials: z.array(z.object({
        name: z.string().min(1),
        text: z.string().min(1),
        avatar: z.string().url().optional(),
        rating: z.number().min(1).max(5).optional(),
      })).default([]),
      cta: z.object({
        text: z.string().min(1),
        url: z.string().url(),
      }),
      visibility: z.object({
        personas: z.array(z.string()).optional(),
        emotions: z.array(z.string()).optional(),
        conditions: z.array(z.object({
          type: z.string(),
          value: z.any(),
        })).optional(),
      }).optional(),
    })).default([]),
    
    // Analytics Configuration
    analytics: z.object({
      trackingId: z.string().optional(),
      events: z.array(z.object({
        name: z.string().min(1),
        selector: z.string().optional(),
        trigger: z.enum(["click", "view", "scroll", "form_submit", "time"]),
        conditions: z.record(z.any()).optional(),
      })).default([]),
      heatmaps: z.boolean().default(false),
      recordings: z.boolean().default(false),
    }),
    
    // A/B Testing Configuration
    experiments: z.array(z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      variants: z.array(z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        weight: z.number().min(0).max(100),
        config: z.record(z.any()),
      })),
      conditions: z.record(z.any()).optional(),
      isActive: z.boolean().default(false),
    })).default([]),
  }),
});

// Emotion Configuration Schema
export const EmotionConfigSchema = ConfigBaseSchema.extend({
  configData: z.object({
    emotionName: z.string().min(1),
    
    // Emotion Characteristics
    characteristics: z.object({
      urgency: z.number().min(0).max(10),
      confidence: z.number().min(0).max(10),
      engagement: z.number().min(0).max(10),
      trustLevel: z.number().min(0).max(10),
      decisionSpeed: z.enum(["slow", "medium", "fast"]),
    }),
    
    // UI Adaptations
    ui: z.object({
      colors: z.object({
        primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
        secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
        accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
        background: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
        text: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      }),
      
      typography: z.object({
        headingFont: z.string(),
        bodyFont: z.string(),
        fontSize: z.enum(["small", "medium", "large"]),
        fontWeight: z.enum(["light", "normal", "medium", "bold"]),
        lineHeight: z.number().min(1).max(3),
      }),
      
      spacing: z.object({
        padding: z.enum(["tight", "normal", "loose"]),
        margin: z.enum(["tight", "normal", "loose"]),
        borderRadius: z.number().min(0).max(50),
      }),
      
      animations: z.object({
        enabled: z.boolean().default(true),
        speed: z.enum(["slow", "normal", "fast"]),
        easing: z.enum(["ease", "ease-in", "ease-out", "ease-in-out"]),
      }),
    }),
    
    // Content Adaptations
    content: z.object({
      tone: z.enum(["professional", "friendly", "urgent", "calming", "exciting"]),
      language: z.object({
        formality: z.enum(["casual", "semi-formal", "formal"]),
        complexity: z.enum(["simple", "medium", "complex"]),
        persuasionStyle: z.enum(["logical", "emotional", "social-proof", "authority"]),
      }),
      
      messaging: z.object({
        headlines: z.array(z.string()).min(1),
        subheadlines: z.array(z.string()).default([]),
        ctaTexts: z.array(z.string()).min(1),
        urgencyPhrases: z.array(z.string()).default([]),
        trustSignals: z.array(z.string()).default([]),
      }),
    }),
    
    // Behavioral Triggers
    triggers: z.array(z.object({
      type: z.enum(["scroll", "time", "exit-intent", "interaction", "conversion"]),
      condition: z.record(z.any()),
      action: z.object({
        type: z.enum(["popup", "highlight", "animate", "redirect", "track"]),
        config: z.record(z.any()),
      }),
    })).default([]),
  }),
});

// Module Configuration Schema
export const ModuleConfigSchema = ConfigBaseSchema.extend({
  configData: z.object({
    moduleId: z.string().min(1),
    moduleName: z.string().min(1),
    moduleType: z.enum(["widget", "service", "integration", "feature"]),
    
    // Module Settings
    settings: z.record(z.any()).default({}),
    
    // API Configuration
    apiConfig: z.object({
      endpoints: z.array(z.object({
        name: z.string().min(1),
        url: z.string().url(),
        method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
        headers: z.record(z.string()).optional(),
        timeout: z.number().min(1000).default(5000),
        retries: z.number().min(0).max(5).default(3),
      })).default([]),
      
      authentication: z.object({
        type: z.enum(["none", "api-key", "bearer", "oauth", "jwt"]),
        config: z.record(z.string()).optional(),
      }).optional(),
      
      rateLimit: z.object({
        requests: z.number().min(1),
        window: z.number().min(1000), // milliseconds
      }).optional(),
    }).optional(),
    
    // Integration Configuration
    integrations: z.array(z.object({
      id: z.string().min(1),
      type: z.string().min(1),
      config: z.record(z.any()),
      isEnabled: z.boolean().default(true),
    })).default([]),
    
    // Performance Configuration
    performance: z.object({
      lazy: z.boolean().default(false),
      priority: z.enum(["low", "normal", "high"]).default("normal"),
      caching: z.object({
        enabled: z.boolean().default(true),
        ttl: z.number().min(0).default(300), // seconds
        strategy: z.enum(["memory", "disk", "network"]).default("memory"),
      }),
    }),
    
    // Security Configuration
    security: z.object({
      permissions: z.array(z.string()).default([]),
      sanitizeInput: z.boolean().default(true),
      validateOutput: z.boolean().default(true),
      rateLimiting: z.boolean().default(true),
    }),
  }),
});

// Global Configuration Schema
export const GlobalConfigSchema = ConfigBaseSchema.extend({
  configData: z.object({
    // Site Configuration
    site: z.object({
      name: z.string().min(1),
      description: z.string().min(1),
      url: z.string().url(),
      logo: z.string().url().optional(),
      favicon: z.string().url().optional(),
      language: z.string().default("en"),
      timezone: z.string().default("UTC"),
    }),
    
    // Theme Configuration
    theme: z.object({
      name: z.string().min(1),
      colors: z.record(z.string().regex(/^#[0-9A-Fa-f]{6}$/)),
      fonts: z.record(z.string()),
      spacing: z.record(z.union([z.string(), z.number()])),
      breakpoints: z.record(z.string()),
    }),
    
    // Feature Flags
    features: z.record(z.boolean()).default({}),
    
    // Third-party Integrations
    integrations: z.object({
      analytics: z.array(z.object({
        provider: z.string().min(1),
        config: z.record(z.any()),
        isEnabled: z.boolean().default(true),
      })).default([]),
      
      marketing: z.array(z.object({
        provider: z.string().min(1),
        config: z.record(z.any()),
        isEnabled: z.boolean().default(true),
      })).default([]),
      
      payments: z.array(z.object({
        provider: z.string().min(1),
        config: z.record(z.any()),
        isEnabled: z.boolean().default(true),
      })).default([]),
    }),
    
    // Security Configuration
    security: z.object({
      cors: z.object({
        origins: z.array(z.string().url()).default([]),
        methods: z.array(z.string()).default(["GET", "POST"]),
        headers: z.array(z.string()).default([]),
      }),
      
      rateLimit: z.object({
        windowMs: z.number().min(1000).default(900000), // 15 minutes
        max: z.number().min(1).default(100),
        skipSuccessfulRequests: z.boolean().default(false),
      }),
      
      contentSecurityPolicy: z.record(z.array(z.string())).optional(),
    }),
    
    // Performance Configuration
    performance: z.object({
      caching: z.object({
        strategy: z.enum(["none", "memory", "redis", "cdn"]).default("memory"),
        ttl: z.number().min(0).default(300),
      }),
      
      compression: z.object({
        enabled: z.boolean().default(true),
        level: z.number().min(1).max(9).default(6),
      }),
      
      optimization: z.object({
        minifyCSS: z.boolean().default(true),
        minifyJS: z.boolean().default(true),
        imageOptimization: z.boolean().default(true),
        lazyLoading: z.boolean().default(true),
      }),
    }),
  }),
});

// AI/LLM Configuration Schema
export const AiConfigSchema = ConfigBaseSchema.extend({
  configData: z.object({
    // LLM Provider Configuration
    providers: z.array(z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      type: z.enum(["openai", "claude", "gemini", "ollama", "custom"]),
      config: z.object({
        apiKey: z.string().min(1).optional(),
        baseUrl: z.string().url().optional(),
        model: z.string().min(1),
        maxTokens: z.number().min(1).max(100000).default(2048),
        temperature: z.number().min(0).max(2).default(0.7),
        topP: z.number().min(0).max(1).default(1),
        frequencyPenalty: z.number().min(-2).max(2).default(0),
        presencePenalty: z.number().min(-2).max(2).default(0),
      }),
      isDefault: z.boolean().default(false),
      isEnabled: z.boolean().default(true),
    })).min(1),
    
    // Prompt Templates
    prompts: z.record(z.object({
      template: z.string().min(1),
      variables: z.array(z.string()).default([]),
      description: z.string().optional(),
      examples: z.array(z.object({
        input: z.record(z.any()),
        output: z.string(),
      })).default([]),
    })).default({}),
    
    // RAG Configuration
    rag: z.object({
      enabled: z.boolean().default(false),
      vectorStore: z.object({
        provider: z.enum(["pinecone", "weaviate", "qdrant", "memory"]).default("memory"),
        config: z.record(z.any()).default({}),
      }),
      embeddings: z.object({
        provider: z.enum(["openai", "sentence-transformers", "custom"]).default("openai"),
        model: z.string().default("text-embedding-ada-002"),
        dimensions: z.number().min(1).default(1536),
      }),
      retrieval: z.object({
        topK: z.number().min(1).max(50).default(5),
        similarityThreshold: z.number().min(0).max(1).default(0.7),
        reranking: z.boolean().default(false),
      }),
    }),
    
    // Content Generation Settings
    contentGeneration: z.object({
      enabled: z.boolean().default(true),
      autoApprove: z.boolean().default(false),
      moderationEnabled: z.boolean().default(true),
      qualityThreshold: z.number().min(0).max(1).default(0.8),
      
      types: z.record(z.object({
        enabled: z.boolean().default(true),
        provider: z.string(),
        prompt: z.string(),
        maxLength: z.number().min(1).default(1000),
        temperature: z.number().min(0).max(2).optional(),
      })).default({}),
    }),
  }),
});

// Validation Configuration Schema
export const ValidationConfigSchema = z.object({
  rules: z.array(z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
    type: z.enum(["schema", "business", "security", "performance"]),
    severity: z.enum(["error", "warning", "info"]),
    condition: z.record(z.any()),
    message: z.string().min(1),
    isActive: z.boolean().default(true),
  })).default([]),
  
  enforcement: z.object({
    mode: z.enum(["strict", "warn", "disabled"]).default("warn"),
    blockOnError: z.boolean().default(false),
    logViolations: z.boolean().default(true),
  }),
});

// Federation Configuration Schema
export const FederationConfigSchema = z.object({
  sync: z.object({
    enabled: z.boolean().default(true),
    strategy: z.enum(["push", "pull", "bidirectional"]).default("push"),
    frequency: z.enum(["realtime", "hourly", "daily", "manual"]).default("realtime"),
    conflictResolution: z.enum(["latest", "manual", "merge"]).default("latest"),
  }),
  
  neurons: z.array(z.object({
    id: z.string().min(1),
    type: z.string().min(1),
    subscriptions: z.array(z.string()).default([]),
    overrides: z.record(z.any()).default({}),
    isEnabled: z.boolean().default(true),
  })).default([]),
  
  permissions: z.object({
    readAll: z.array(z.string()).default([]),
    writeAll: z.array(z.string()).default([]),
    adminAll: z.array(z.string()).default([]),
    restrictions: z.record(z.array(z.string())).default({}),
  }),
});

// Export union type for all configuration schemas
export const ConfigSchema = z.discriminatedUnion("category", [
  PageConfigSchema.extend({ category: z.literal("page") }),
  EmotionConfigSchema.extend({ category: z.literal("emotion") }),
  ModuleConfigSchema.extend({ category: z.literal("module") }),
  GlobalConfigSchema.extend({ category: z.literal("global") }),
  AiConfigSchema.extend({ category: z.literal("ai") }),
]);

// Export types
export type ConfigBase = z.infer<typeof ConfigBaseSchema>;
export type PageConfig = z.infer<typeof PageConfigSchema>;
export type EmotionConfig = z.infer<typeof EmotionConfigSchema>;
export type ModuleConfig = z.infer<typeof ModuleConfigSchema>;
export type GlobalConfig = z.infer<typeof GlobalConfigSchema>;
export type AiConfig = z.infer<typeof AiConfigSchema>;
export type ValidationConfig = z.infer<typeof ValidationConfigSchema>;
export type FederationConfig = z.infer<typeof FederationConfigSchema>;
export type AnyConfig = z.infer<typeof ConfigSchema>;