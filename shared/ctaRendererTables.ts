import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, real, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// 3D/AR/VR CTA Templates - Core template definitions
export const ctaTemplates = pgTable("cta_templates", {
  id: serial("id").primaryKey(),
  templateId: varchar("template_id", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(), // "3d_product", "ar_tryout", "vr_walkthrough", "gamified", "interactive"
  type: varchar("type", { length: 50 }).notNull(), // "three_js", "babylon_js", "aframe", "webxr"
  
  // Template Configuration
  config: jsonb("config").notNull(), // Full template configuration
  assets: jsonb("assets"), // 3D models, textures, audio files
  interactions: jsonb("interactions"), // Click handlers, gestures, triggers
  animations: jsonb("animations"), // Animation sequences and transitions
  physics: jsonb("physics"), // Physics properties if applicable
  
  // Rendering Settings
  renderSettings: jsonb("render_settings"), // Quality, shadows, lighting
  deviceCompatibility: jsonb("device_compatibility"), // Desktop, mobile, VR headsets
  fallbackOptions: jsonb("fallback_options"), // 2D fallbacks for unsupported devices
  
  // Customization Options
  customizableElements: jsonb("customizable_elements"), // What can be customized
  brandingOptions: jsonb("branding_options"), // Color schemes, logos, fonts
  
  isActive: boolean("is_active").default(true),
  isPublic: boolean("is_public").default(false),
  createdBy: varchar("created_by", { length: 100 }),
  version: varchar("version", { length: 20 }).default("1.0.0"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 3D/AR/VR CTA Instances - Deployed CTA instances
export const ctaInstances = pgTable("cta_instances", {
  id: serial("id").primaryKey(),
  instanceId: varchar("instance_id", { length: 100 }).notNull().unique(),
  templateId: varchar("template_id", { length: 100 }).notNull(),
  
  // Instance Configuration
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  customConfig: jsonb("custom_config"), // Instance-specific overrides
  
  // Targeting & Personalization
  targetingRules: jsonb("targeting_rules"), // User segments, behavior triggers
  personalizationData: jsonb("personalization_data"), // Dynamic content based on user
  contextRules: jsonb("context_rules"), // Page-specific, intent-based rules
  
  // Triggers & Activation
  triggers: jsonb("triggers"), // Scroll, click, timer, quiz result, notification
  activationConditions: jsonb("activation_conditions"), // When to show
  displayRules: jsonb("display_rules"), // Where and how to display
  
  // A/B Testing
  abTestId: varchar("ab_test_id", { length: 100 }),
  variant: varchar("variant", { length: 50 }).default("default"),
  
  // Integration Settings
  integrationHooks: jsonb("integration_hooks"), // API callbacks, webhooks
  affiliateData: jsonb("affiliate_data"), // Affiliate tracking integration
  
  // Status & Scheduling
  status: varchar("status", { length: 50 }).default("draft"), // draft, active, paused, archived
  scheduledStart: timestamp("scheduled_start"),
  scheduledEnd: timestamp("scheduled_end"),
  
  // Federation
  neuronId: varchar("neuron_id", { length: 100 }),
  federationConfig: jsonb("federation_config"),
  
  createdBy: varchar("created_by", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 3D/AR/VR CTA Analytics - Performance tracking
export const ctaAnalytics = pgTable("cta_analytics", {
  id: serial("id").primaryKey(),
  eventId: varchar("event_id", { length: 100 }).notNull().unique(),
  instanceId: varchar("instance_id", { length: 100 }).notNull(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }),
  
  // Event Data
  eventType: varchar("event_type", { length: 100 }).notNull(), // "impression", "interaction", "completion", "conversion"
  eventData: jsonb("event_data"), // Detailed event information
  
  // Engagement Metrics
  dwellTime: integer("dwell_time").default(0), // Time spent in milliseconds
  interactionDepth: integer("interaction_depth").default(0), // Number of interactions
  completionRate: real("completion_rate").default(0), // Percentage completed
  
  // 3D/AR Specific Metrics
  renderTime: integer("render_time"), // Time to render in milliseconds
  frameRate: real("frame_rate"), // Average FPS during interaction
  devicePerformance: jsonb("device_performance"), // Performance metrics
  
  // User Journey
  entryPoint: varchar("entry_point", { length: 255 }), // How user reached CTA
  exitPoint: varchar("exit_point", { length: 255 }), // Where user went after
  conversionAction: varchar("conversion_action", { length: 255 }), // What action was taken
  
  // Context
  pageUrl: text("page_url"),
  referrer: text("referrer"),
  deviceInfo: jsonb("device_info"),
  browserInfo: jsonb("browser_info"),
  geolocation: jsonb("geolocation"),
  
  timestamp: timestamp("timestamp").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// 3D/AR/VR CTA A/B Tests - Split testing management
export const ctaAbTests = pgTable("cta_ab_tests", {
  id: serial("id").primaryKey(),
  testId: varchar("test_id", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  // Test Configuration
  variants: jsonb("variants").notNull(), // Array of variant configurations
  trafficAllocation: jsonb("traffic_allocation"), // Percentage for each variant
  targetingRules: jsonb("targeting_rules"), // Who sees the test
  
  // Test Parameters
  hypothesis: text("hypothesis"),
  primaryMetric: varchar("primary_metric", { length: 100 }), // Main success metric
  secondaryMetrics: jsonb("secondary_metrics"), // Additional metrics to track
  minimumSampleSize: integer("minimum_sample_size").default(1000),
  significanceThreshold: real("significance_threshold").default(0.05),
  
  // Test Status
  status: varchar("status", { length: 50 }).default("draft"), // draft, running, completed, archived
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  plannedDuration: integer("planned_duration"), // Days
  
  // Results
  results: jsonb("results"), // Statistical results and insights
  winningVariant: varchar("winning_variant", { length: 50 }),
  confidenceLevel: real("confidence_level"),
  
  createdBy: varchar("created_by", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 3D/AR/VR Asset Library - 3D models, textures, audio management
export const ctaAssets = pgTable("cta_assets", {
  id: serial("id").primaryKey(),
  assetId: varchar("asset_id", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  // Asset Information
  type: varchar("type", { length: 50 }).notNull(), // "3d_model", "texture", "audio", "video", "animation"
  format: varchar("format", { length: 50 }).notNull(), // "glb", "gltf", "fbx", "obj", "mp3", "wav", etc.
  category: varchar("category", { length: 100 }), // "product", "environment", "ui_element", "effect"
  
  // File Information
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size"), // Bytes
  dimensions: jsonb("dimensions"), // Width, height, depth for 3D assets
  resolution: jsonb("resolution"), // For textures and videos
  
  // Optimization
  compressionLevel: varchar("compression_level", { length: 50 }), // "low", "medium", "high"
  lodLevels: jsonb("lod_levels"), // Level of detail variants
  optimizedVersions: jsonb("optimized_versions"), // Different quality versions
  
  // Metadata
  tags: jsonb("tags"), // Searchable tags
  license: varchar("license", { length: 100 }), // Usage rights
  attribution: text("attribution"), // Required attribution
  
  // Security & Compliance
  scanStatus: varchar("scan_status", { length: 50 }).default("pending"), // "pending", "clean", "flagged"
  scanResults: jsonb("scan_results"), // Malware/content scan results
  complianceFlags: jsonb("compliance_flags"), // IP, copyright, content warnings
  
  // Usage Tracking
  usageCount: integer("usage_count").default(0),
  lastUsed: timestamp("last_used"),
  
  isActive: boolean("is_active").default(true),
  isPublic: boolean("is_public").default(false),
  
  uploadedBy: varchar("uploaded_by", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 3D/AR/VR CTA User Sessions - Detailed session tracking
export const ctaUserSessions = pgTable("cta_user_sessions", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  instanceId: varchar("instance_id", { length: 100 }).notNull(),
  userId: varchar("user_id", { length: 255 }),
  
  // Session Information
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  totalDuration: integer("total_duration"), // Milliseconds
  
  // Device & Performance
  deviceCapabilities: jsonb("device_capabilities"), // WebGL, WebXR support
  performanceMetrics: jsonb("performance_metrics"), // FPS, memory usage
  browserSupport: jsonb("browser_support"), // Feature compatibility
  
  // User Interactions
  interactions: jsonb("interactions"), // Detailed interaction log
  gestureData: jsonb("gesture_data"), // Touch, mouse, controller inputs
  gazeTracking: jsonb("gaze_tracking"), // Eye tracking if available
  
  // Outcomes
  conversionEvents: jsonb("conversion_events"), // Actions taken
  exitReason: varchar("exit_reason", { length: 100 }), // Why session ended
  userFeedback: jsonb("user_feedback"), // Optional feedback
  
  // Context
  pageContext: jsonb("page_context"), // Page state when CTA launched
  userSegment: varchar("user_segment", { length: 100 }),
  personalizationApplied: jsonb("personalization_applied"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 3D/AR/VR CTA Compliance & Security - Security and compliance tracking
export const ctaCompliance = pgTable("cta_compliance", {
  id: serial("id").primaryKey(),
  complianceId: varchar("compliance_id", { length: 100 }).notNull().unique(),
  instanceId: varchar("instance_id", { length: 100 }),
  templateId: varchar("template_id", { length: 100 }),
  
  // Compliance Type
  complianceType: varchar("compliance_type", { length: 100 }).notNull(), // "accessibility", "privacy", "security", "content"
  
  // Accessibility Compliance
  wcagLevel: varchar("wcag_level", { length: 10 }), // "A", "AA", "AAA"
  accessibilityFeatures: jsonb("accessibility_features"), // Screen reader support, keyboard nav
  alternativeFormats: jsonb("alternative_formats"), // 2D fallbacks, audio descriptions
  
  // Privacy Compliance
  dataCollection: jsonb("data_collection"), // What data is collected
  consentRequired: boolean("consent_required").default(false),
  consentObtained: boolean("consent_obtained").default(false),
  privacyPolicyRef: text("privacy_policy_ref"),
  
  // Security Measures
  assetIntegrity: jsonb("asset_integrity"), // Hash verification
  contentSecurityPolicy: text("content_security_policy"),
  crossOriginPolicy: text("cross_origin_policy"),
  
  // Content Compliance
  contentRating: varchar("content_rating", { length: 50 }), // Age appropriateness
  contentWarnings: jsonb("content_warnings"), // Flashing lights, motion sickness
  culturalConsiderations: jsonb("cultural_considerations"), // Regional appropriateness
  
  // Audit Trail
  lastAuditDate: timestamp("last_audit_date"),
  auditResults: jsonb("audit_results"),
  remedialActions: jsonb("remedial_actions"),
  
  // Status
  complianceStatus: varchar("compliance_status", { length: 50 }).default("pending"), // "compliant", "non_compliant", "pending"
  expiryDate: timestamp("expiry_date"), // When compliance needs renewal
  
  createdBy: varchar("created_by", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schema exports
export const insertCtaTemplateSchema = createInsertSchema(ctaTemplates);
export const insertCtaInstanceSchema = createInsertSchema(ctaInstances);
export const insertCtaAnalyticsSchema = createInsertSchema(ctaAnalytics);
export const insertCtaAbTestSchema = createInsertSchema(ctaAbTests);
export const insertCtaAssetSchema = createInsertSchema(ctaAssets);
export const insertCtaUserSessionSchema = createInsertSchema(ctaUserSessions);
export const insertCtaComplianceSchema = createInsertSchema(ctaCompliance);

export type InsertCtaTemplate = z.infer<typeof insertCtaTemplateSchema>;
export type InsertCtaInstance = z.infer<typeof insertCtaInstanceSchema>;
export type InsertCtaAnalytics = z.infer<typeof insertCtaAnalyticsSchema>;
export type InsertCtaAbTest = z.infer<typeof insertCtaAbTestSchema>;
export type InsertCtaAsset = z.infer<typeof insertCtaAssetSchema>;
export type InsertCtaUserSession = z.infer<typeof insertCtaUserSessionSchema>;
export type InsertCtaCompliance = z.infer<typeof insertCtaComplianceSchema>;

export type CtaTemplate = typeof ctaTemplates.$inferSelect;
export type CtaInstance = typeof ctaInstances.$inferSelect;
export type CtaAnalytics = typeof ctaAnalytics.$inferSelect;
export type CtaAbTest = typeof ctaAbTests.$inferSelect;
export type CtaAsset = typeof ctaAssets.$inferSelect;
export type CtaUserSession = typeof ctaUserSessions.$inferSelect;
export type CtaCompliance = typeof ctaCompliance.$inferSelect;