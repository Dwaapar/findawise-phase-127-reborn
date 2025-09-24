import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, real, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Digital Products table - Core product catalog
export const digitalProducts = pgTable("digital_products", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  longDescription: text("long_description"),
  productType: varchar("product_type", { length: 50 }).notNull(), // 'ebook', 'course', 'saas', 'tool', 'membership', 'template', 'webinar'
  category: varchar("category", { length: 100 }),
  tags: text("tags").array(),
  
  // Pricing and monetization
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  salePrice: decimal("sale_price", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  priceByCountry: jsonb("price_by_country"), // Country-specific pricing
  
  // Media and assets
  featuredImage: text("featured_image"),
  galleryImages: text("gallery_images").array(),
  previewUrl: text("preview_url"),
  demoUrl: text("demo_url"),
  videoUrl: text("video_url"),
  
  // Digital delivery
  downloadUrl: text("download_url"),
  accessType: varchar("access_type", { length: 50 }).default("immediate"), // 'immediate', 'drip', 'scheduled'
  dripSchedule: jsonb("drip_schedule"), // For drip content
  licenseType: varchar("license_type", { length: 50 }).default("single"), // 'single', 'multi', 'unlimited'
  maxDownloads: integer("max_downloads").default(-1), // -1 for unlimited
  expirationDays: integer("expiration_days"), // Product access expiration
  
  // SEO and marketing
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  keywords: text("keywords").array(),
  
  // Product relationships and upsells
  upsellProducts: integer("upsell_products").array(),
  crossSellProducts: integer("cross_sell_products").array(),
  bundleProducts: integer("bundle_products").array(),
  
  // Analytics and performance
  totalSales: integer("total_sales").default(0),
  totalRevenue: decimal("total_revenue", { precision: 15, scale: 2 }).default("0"),
  conversionRate: real("conversion_rate").default(0),
  averageRating: real("average_rating").default(0),
  reviewCount: integer("review_count").default(0),
  
  // AI and personalization
  personalizationTags: text("personalization_tags").array(),
  targetArchetypes: text("target_archetypes").array(),
  emotionTriggers: jsonb("emotion_triggers"),
  aiOptimizedTitle: text("ai_optimized_title"),
  aiOptimizedDescription: text("ai_optimized_description"),
  
  // Status and management
  status: varchar("status", { length: 20 }).default("draft"), // 'draft', 'active', 'paused', 'archived'
  isDigital: boolean("is_digital").default(true),
  isFeatured: boolean("is_featured").default(false),
  autoOptimize: boolean("auto_optimize").default(true),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  publishedAt: timestamp("published_at"),
});

// Product variants for different pricing tiers
export const productVariants = pgTable("product_variants", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD"),
  features: jsonb("features"), // Variant-specific features
  maxLicenses: integer("max_licenses").default(1),
  isDefault: boolean("is_default").default(false),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Shopping cart and checkout sessions
export const shoppingCarts = pgTable("shopping_carts", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }),
  items: jsonb("items").notNull(), // Array of cart items
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).default("0"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).default("0"),
  currency: varchar("currency", { length: 3 }).default("USD"),
  promoCode: varchar("promo_code", { length: 100 }),
  abandonedAt: timestamp("abandoned_at"),
  recoveryEmailSent: boolean("recovery_email_sent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Orders and transactions
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("order_number", { length: 100 }).notNull().unique(),
  sessionId: varchar("session_id", { length: 255 }),
  userId: varchar("user_id", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  
  // Customer details
  customerInfo: jsonb("customer_info"), // Name, address, etc.
  billingAddress: jsonb("billing_address"),
  
  // Order items and pricing
  items: jsonb("items").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  shippingAmount: decimal("shipping_amount", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD"),
  
  // Payment details
  paymentMethod: varchar("payment_method", { length: 50 }),
  paymentProvider: varchar("payment_provider", { length: 50 }),
  transactionId: varchar("transaction_id", { length: 255 }),
  paymentStatus: varchar("payment_status", { length: 20 }).default("pending"), // 'pending', 'paid', 'failed', 'refunded'
  
  // Fulfillment
  fulfillmentStatus: varchar("fulfillment_status", { length: 20 }).default("pending"), // 'pending', 'processing', 'delivered', 'failed'
  deliveryMethod: varchar("delivery_method", { length: 50 }).default("digital"),
  downloadLinks: jsonb("download_links"),
  accessKeys: jsonb("access_keys"),
  
  // Promo and affiliate tracking
  promoCode: varchar("promo_code", { length: 100 }),
  affiliateId: varchar("affiliate_id", { length: 255 }),
  utmSource: varchar("utm_source", { length: 100 }),
  utmMedium: varchar("utm_medium", { length: 100 }),
  utmCampaign: varchar("utm_campaign", { length: 100 }),
  
  // Analytics and tracking
  deviceInfo: jsonb("device_info"),
  ipAddress: varchar("ip_address", { length: 45 }),
  countryCode: varchar("country_code", { length: 2 }),
  conversionSource: varchar("conversion_source", { length: 100 }),
  
  // Revenue sharing
  affiliateCommission: decimal("affiliate_commission", { precision: 10, scale: 2 }).default("0"),
  partnerRevenue: jsonb("partner_revenue"), // Multi-level revenue splits
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  paidAt: timestamp("paid_at"),
  deliveredAt: timestamp("delivered_at"),
});

// License keys and digital product access
export const productLicenses = pgTable("product_licenses", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id").notNull(),
  userId: varchar("user_id", { length: 255 }),
  licenseKey: varchar("license_key", { length: 255 }).notNull().unique(),
  
  // License details
  licenseType: varchar("license_type", { length: 50 }).notNull(),
  maxActivations: integer("max_activations").default(1),
  currentActivations: integer("current_activations").default(0),
  downloadCount: integer("download_count").default(0),
  maxDownloads: integer("max_downloads").default(-1),
  
  // Access control
  status: varchar("status", { length: 20 }).default("active"), // 'active', 'suspended', 'revoked', 'expired'
  expiresAt: timestamp("expires_at"),
  lastAccessedAt: timestamp("last_accessed_at"),
  lastDownloadAt: timestamp("last_download_at"),
  
  // Security and fraud prevention
  allowedIps: text("allowed_ips").array(),
  deviceFingerprints: jsonb("device_fingerprints"),
  suspiciousActivity: jsonb("suspicious_activity"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  activatedAt: timestamp("activated_at"),
});

// Product reviews and ratings
export const productReviews = pgTable("product_reviews", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  orderId: integer("order_id"),
  userId: varchar("user_id", { length: 255 }),
  email: varchar("email", { length: 255 }),
  
  // Review content
  rating: integer("rating").notNull(), // 1-5 stars
  title: varchar("title", { length: 255 }),
  content: text("content"),
  pros: text("pros").array(),
  cons: text("cons").array(),
  
  // Review metadata
  isVerifiedPurchase: boolean("is_verified_purchase").default(false),
  isRecommended: boolean("is_recommended"),
  helpfulVotes: integer("helpful_votes").default(0),
  totalVotes: integer("total_votes").default(0),
  
  // Moderation
  status: varchar("status", { length: 20 }).default("pending"), // 'pending', 'approved', 'rejected', 'hidden'
  moderatedBy: varchar("moderated_by", { length: 255 }),
  moderationNotes: text("moderation_notes"),
  
  // AI analysis
  sentimentScore: real("sentiment_score"),
  keyPhrases: text("key_phrases").array(),
  aiSummary: text("ai_summary"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  moderatedAt: timestamp("moderated_at"),
});

// Promotional codes and discounts
export const promoCodes = pgTable("promo_codes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  description: text("description"),
  
  // Discount configuration
  discountType: varchar("discount_type", { length: 20 }).notNull(), // 'percentage', 'fixed', 'free_shipping'
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  minOrderAmount: decimal("min_order_amount", { precision: 10, scale: 2 }),
  maxDiscountAmount: decimal("max_discount_amount", { precision: 10, scale: 2 }),
  
  // Usage limits
  maxUses: integer("max_uses").default(-1), // -1 for unlimited
  currentUses: integer("current_uses").default(0),
  maxUsesPerUser: integer("max_uses_per_user").default(1),
  
  // Product restrictions
  applicableProducts: integer("applicable_products").array(),
  excludedProducts: integer("excluded_products").array(),
  applicableCategories: text("applicable_categories").array(),
  
  // Time restrictions
  validFrom: timestamp("valid_from"),
  validUntil: timestamp("valid_until"),
  
  // Targeting
  targetCountries: varchar("target_countries", { length: 2 }).array(),
  targetUserSegments: text("target_user_segments").array(),
  firstTimeCustomersOnly: boolean("first_time_customers_only").default(false),
  
  // Status and settings
  isActive: boolean("is_active").default(true),
  isPublic: boolean("is_public").default(true),
  autoApply: boolean("auto_apply").default(false),
  
  // Analytics
  totalSavings: decimal("total_savings", { precision: 15, scale: 2 }).default("0"),
  conversionRate: real("conversion_rate").default(0),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Affiliate and partner management
export const affiliatePartners = pgTable("affiliate_partners", {
  id: serial("id").primaryKey(),
  partnerId: varchar("partner_id", { length: 100 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  company: varchar("company", { length: 255 }),
  
  // Partner details
  partnerType: varchar("partner_type", { length: 50 }).notNull(), // 'affiliate', 'reseller', 'creator', 'influencer'
  commissionRate: real("commission_rate").default(0), // Default commission percentage
  customCommissions: jsonb("custom_commissions"), // Product-specific rates
  payoutMethod: varchar("payout_method", { length: 50 }).default("paypal"),
  payoutDetails: jsonb("payout_details"),
  
  // Performance tracking
  totalEarnings: decimal("total_earnings", { precision: 15, scale: 2 }).default("0"),
  pendingEarnings: decimal("pending_earnings", { precision: 15, scale: 2 }).default("0"),
  paidEarnings: decimal("paid_earnings", { precision: 15, scale: 2 }).default("0"),
  totalSales: integer("total_sales").default(0),
  totalClicks: integer("total_clicks").default(0),
  conversionRate: real("conversion_rate").default(0),
  
  // Settings and permissions
  status: varchar("status", { length: 20 }).default("pending"), // 'pending', 'active', 'paused', 'suspended'
  tier: varchar("tier", { length: 20 }).default("standard"), // 'standard', 'premium', 'vip'
  allowedProducts: integer("allowed_products").array(),
  cookieDuration: integer("cookie_duration").default(30), // Days
  
  // Contact and verification
  phone: varchar("phone", { length: 50 }),
  website: varchar("website", { length: 255 }),
  socialProfiles: jsonb("social_profiles"),
  taxInfo: jsonb("tax_info"),
  isVerified: boolean("is_verified").default(false),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  verifiedAt: timestamp("verified_at"),
  lastActivityAt: timestamp("last_activity_at"),
});

// Affiliate tracking and commissions
export const affiliateTracking = pgTable("affiliate_tracking", {
  id: serial("id").primaryKey(),
  partnerId: varchar("partner_id", { length: 100 }).notNull(),
  orderId: integer("order_id"),
  productId: integer("product_id"),
  
  // Tracking details
  clickId: varchar("click_id", { length: 255 }).notNull().unique(),
  sessionId: varchar("session_id", { length: 255 }),
  userId: varchar("user_id", { length: 255 }),
  
  // Campaign tracking
  campaign: varchar("campaign", { length: 100 }),
  source: varchar("source", { length: 100 }),
  medium: varchar("medium", { length: 100 }),
  content: varchar("content", { length: 255 }),
  
  // Commission calculation
  saleAmount: decimal("sale_amount", { precision: 10, scale: 2 }),
  commissionRate: real("commission_rate"),
  commissionAmount: decimal("commission_amount", { precision: 10, scale: 2 }),
  commissionStatus: varchar("commission_status", { length: 20 }).default("pending"), // 'pending', 'approved', 'paid', 'rejected'
  
  // Conversion tracking
  clickedAt: timestamp("clicked_at"),
  convertedAt: timestamp("converted_at"),
  conversionType: varchar("conversion_type", { length: 50 }), // 'sale', 'lead', 'signup'
  
  // Device and location
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  countryCode: varchar("country_code", { length: 2 }),
  deviceType: varchar("device_type", { length: 20 }),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Storefront analytics - simplified for events
export const storefrontAnalytics = pgTable("storefront_analytics", {
  id: serial("id").primaryKey(),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  sessionId: varchar("session_id", { length: 255 }),
  userId: varchar("user_id", { length: 255 }),
  productId: integer("product_id"),
  metadata: jsonb("metadata"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// A/B testing for storefront optimization
export const storefrontABTests = pgTable("storefront_ab_tests", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  // Test configuration
  testType: varchar("test_type", { length: 50 }).notNull(), // 'pricing', 'copy', 'design', 'flow'
  targetElement: varchar("target_element", { length: 100 }),
  variants: jsonb("variants").notNull(), // Array of test variants
  trafficSplit: jsonb("traffic_split"), // Percentage split between variants
  
  // Test criteria
  successMetric: varchar("success_metric", { length: 50 }).notNull(),
  minimumSampleSize: integer("minimum_sample_size").default(100),
  confidenceLevel: real("confidence_level").default(0.95),
  minimumDetectableEffect: real("minimum_detectable_effect").default(0.05),
  
  // Test status and results
  status: varchar("status", { length: 20 }).default("draft"), // 'draft', 'running', 'paused', 'completed', 'failed'
  winningVariant: varchar("winning_variant", { length: 50 }),
  statisticalSignificance: real("statistical_significance"),
  results: jsonb("results"),
  
  // Targeting
  targetProducts: integer("target_products").array(),
  targetSegments: text("target_segments").array(),
  targetCountries: varchar("target_countries", { length: 2 }).array(),
  
  // Timeline
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  maxDuration: integer("max_duration"), // Days
  
  // Analytics
  totalParticipants: integer("total_participants").default(0),
  totalConversions: integer("total_conversions").default(0),
  revenueImpact: decimal("revenue_impact", { precision: 15, scale: 2 }).default("0"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Create schemas for validation
export const insertDigitalProductSchema = createInsertSchema(digitalProducts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPromoCodeSchema = createInsertSchema(promoCodes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAffiliatePartnerSchema = createInsertSchema(affiliatePartners).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Type exports
export type InsertDigitalProduct = z.infer<typeof insertDigitalProductSchema>;
export type DigitalProduct = typeof digitalProducts.$inferSelect;

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export type InsertPromoCode = z.infer<typeof insertPromoCodeSchema>;
export type PromoCode = typeof promoCodes.$inferSelect;

export type InsertAffiliatePartner = z.infer<typeof insertAffiliatePartnerSchema>;
export type AffiliatePartner = typeof affiliatePartners.$inferSelect;

export type ProductVariant = typeof productVariants.$inferSelect;
export type ShoppingCart = typeof shoppingCarts.$inferSelect;
export type ProductLicense = typeof productLicenses.$inferSelect;
export type ProductReview = typeof productReviews.$inferSelect;
export type AffiliateTracking = typeof affiliateTracking.$inferSelect;
export type StorefrontAnalytics = typeof storefrontAnalytics.$inferSelect;
export type StorefrontABTest = typeof storefrontABTests.$inferSelect;