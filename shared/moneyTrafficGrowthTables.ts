import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ===================================================================
// MONEY/TRAFFIC GROWTH ENGINE TABLES - BILLION-DOLLAR EMPIRE GRADE
// ===================================================================

// 1. SEO OPTIMIZATION ENGINE
export const seoOptimizationTasks = pgTable("seo_optimization_tasks", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  targetKeyword: text("target_keyword").notNull(),
  title: text("title"),
  metaDescription: text("meta_description"),
  headingStructure: jsonb("heading_structure").default({}),
  keywordDensity: real("keyword_density").default(0),
  contentLength: integer("content_length").default(0),
  internalLinks: integer("internal_links").default(0),
  externalLinks: integer("external_links").default(0),
  imageAltTags: integer("image_alt_tags").default(0),
  seoScore: real("seo_score").default(0),
  status: varchar("status", { length: 50 }).default("pending"),
  recommendations: jsonb("recommendations").default([]),
  priority: integer("priority").default(1),
  lastAnalyzed: timestamp("last_analyzed").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const seoKeywordResearch = pgTable("seo_keyword_research", {
  id: serial("id").primaryKey(),
  keyword: text("keyword").notNull(),
  searchVolume: integer("search_volume").default(0),
  competitionLevel: varchar("competition_level", { length: 20 }).default("medium"),
  difficulty: real("difficulty").default(0),
  cpc: real("cpc").default(0),
  trend: varchar("trend", { length: 20 }).default("stable"),
  relatedKeywords: jsonb("related_keywords").default([]),
  contentOpportunity: text("content_opportunity"),
  vertical: varchar("vertical", { length: 50 }).notNull(),
  priority: integer("priority").default(1),
  isTargeted: boolean("is_targeted").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

export const seoSiteAudits = pgTable("seo_site_audits", {
  id: serial("id").primaryKey(),
  domain: text("domain").notNull(),
  overallScore: real("overall_score").default(0),
  technicalIssues: jsonb("technical_issues").default([]),
  contentIssues: jsonb("content_issues").default([]),
  linkingIssues: jsonb("linking_issues").default([]),
  speedScore: real("speed_score").default(0),
  mobileScore: real("mobile_score").default(0),
  accessibilityScore: real("accessibility_score").default(0),
  bestPracticesScore: real("best_practices_score").default(0),
  fixRecommendations: jsonb("fix_recommendations").default([]),
  estimatedTrafficImpact: integer("estimated_traffic_impact").default(0),
  auditDate: timestamp("audit_date").defaultNow(),
  nextAuditDue: timestamp("next_audit_due"),
  createdAt: timestamp("created_at").defaultNow()
});

// 2. VIRAL CONTENT GENERATION ENGINE
export const contentTemplates = pgTable("content_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  templateType: varchar("template_type", { length: 50 }).notNull(), // blog, social, video, infographic
  vertical: varchar("vertical", { length: 50 }).notNull(),
  viralScore: real("viral_score").default(0),
  structure: jsonb("structure").notNull(),
  hooks: jsonb("hooks").default([]),
  callToActions: jsonb("call_to_actions").default([]),
  emotionalTriggers: jsonb("emotional_triggers").default([]),
  targetAudience: jsonb("target_audience").default({}),
  avgEngagementRate: real("avg_engagement_rate").default(0),
  avgShareRate: real("avg_share_rate").default(0),
  estimatedReach: integer("estimated_reach").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const contentGeneration = pgTable("content_generation", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").references(() => contentTemplates.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  keywords: jsonb("keywords").default([]),
  contentType: varchar("content_type", { length: 50 }).notNull(),
  vertical: varchar("vertical", { length: 50 }).notNull(),
  emotionalTone: varchar("emotional_tone", { length: 50 }),
  readabilityScore: real("readability_score").default(0),
  seoScore: real("seo_score").default(0),
  viralPotential: real("viral_potential").default(0),
  status: varchar("status", { length: 50 }).default("draft"),
  publishedAt: timestamp("published_at"),
  scheduledFor: timestamp("scheduled_for"),
  performanceMetrics: jsonb("performance_metrics").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const contentPerformance = pgTable("content_performance", {
  id: serial("id").primaryKey(),
  contentId: integer("content_id").references(() => contentGeneration.id),
  platform: varchar("platform", { length: 50 }).notNull(),
  views: integer("views").default(0),
  likes: integer("likes").default(0),
  shares: integer("shares").default(0),
  comments: integer("comments").default(0),
  clickThroughRate: real("click_through_rate").default(0),
  engagementRate: real("engagement_rate").default(0),
  conversionRate: real("conversion_rate").default(0),
  revenue: real("revenue").default(0),
  trafficGenerated: integer("traffic_generated").default(0),
  backlinksEarned: integer("backlinks_earned").default(0),
  viralityScore: real("virality_score").default(0),
  trackingPeriod: varchar("tracking_period", { length: 20 }).default("7d"),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow()
});

// 3. REFERRAL SYSTEM ENGINE
export const referralPrograms = pgTable("referral_programs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  vertical: varchar("vertical", { length: 50 }).notNull(),
  rewardType: varchar("reward_type", { length: 50 }).notNull(), // percentage, fixed, points, credits
  rewardValue: real("reward_value").notNull(),
  referrerReward: real("referrer_reward").notNull(),
  refereeReward: real("referee_reward").default(0),
  minimumPurchase: real("minimum_purchase").default(0),
  cookieDuration: integer("cookie_duration").default(30), // days
  maxRewardsPerUser: integer("max_rewards_per_user").default(0), // 0 = unlimited
  isActive: boolean("is_active").default(true),
  autoApproval: boolean("auto_approval").default(true),
  trackingMethod: varchar("tracking_method", { length: 50 }).default("cookie"),
  paymentSchedule: varchar("payment_schedule", { length: 50 }).default("monthly"),
  termsAndConditions: text("terms_and_conditions"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const referralLinks = pgTable("referral_links", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").references(() => referralPrograms.id),
  referrerId: text("referrer_id").notNull(), // user ID or email
  referralCode: text("referral_code").notNull().unique(),
  customUrl: text("custom_url"),
  targetUrl: text("target_url").notNull(),
  campaignName: text("campaign_name"),
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  revenue: real("revenue").default(0),
  commissionEarned: real("commission_earned").default(0),
  lastClickAt: timestamp("last_click_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const referralTransactions = pgTable("referral_transactions", {
  id: serial("id").primaryKey(),
  linkId: integer("link_id").references(() => referralLinks.id),
  programId: integer("program_id").references(() => referralPrograms.id),
  referrerId: text("referrer_id").notNull(),
  refereeId: text("referee_id"),
  refereeEmail: text("referee_email"),
  transactionType: varchar("transaction_type", { length: 50 }).notNull(), // click, signup, purchase, commission
  transactionValue: real("transaction_value").default(0),
  commissionRate: real("commission_rate").default(0),
  commissionAmount: real("commission_amount").default(0),
  status: varchar("status", { length: 50 }).default("pending"), // pending, approved, rejected, paid
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  conversionData: jsonb("conversion_data").default({}),
  paymentDate: timestamp("payment_date"),
  createdAt: timestamp("created_at").defaultNow()
});

// 4. BACKLINK BUILDING ENGINE
export const backlinkOpportunities = pgTable("backlink_opportunities", {
  id: serial("id").primaryKey(),
  targetDomain: text("target_domain").notNull(),
  contactEmail: text("contact_email"),
  contactName: text("contact_name"),
  websiteAuthority: real("website_authority").default(0),
  domainRating: real("domain_rating").default(0),
  trafficEstimate: integer("traffic_estimate").default(0),
  vertical: varchar("vertical", { length: 50 }),
  linkType: varchar("link_type", { length: 50 }).notNull(), // guest_post, resource_page, broken_link, testimonial
  outreachStatus: varchar("outreach_status", { length: 50 }).default("not_contacted"),
  responseStatus: varchar("response_status", { length: 50 }),
  linkPlaced: boolean("link_placed").default(false),
  linkUrl: text("link_url"),
  anchorText: text("anchor_text"),
  contentUrl: text("content_url"),
  pitchTemplate: text("pitch_template"),
  followUpSchedule: jsonb("follow_up_schedule").default([]),
  expectedValue: real("expected_value").default(0),
  priority: integer("priority").default(1),
  lastContactAt: timestamp("last_contact_at"),
  nextFollowUp: timestamp("next_follow_up"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const backlinkOutreach = pgTable("backlink_outreach", {
  id: serial("id").primaryKey(),
  opportunityId: integer("opportunity_id").references(() => backlinkOpportunities.id),
  outreachType: varchar("outreach_type", { length: 50 }).notNull(), // initial, follow_up, thank_you
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  sentAt: timestamp("sent_at").defaultNow(),
  opened: boolean("opened").default(false),
  openedAt: timestamp("opened_at"),
  clicked: boolean("clicked").default(false),
  clickedAt: timestamp("clicked_at"),
  replied: boolean("replied").default(false),
  repliedAt: timestamp("replied_at"),
  replyContent: text("reply_content"),
  sentiment: varchar("sentiment", { length: 50 }), // positive, negative, neutral
  nextAction: text("next_action"),
  automationTriggered: boolean("automation_triggered").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

export const backlinkMonitoring = pgTable("backlink_monitoring", {
  id: serial("id").primaryKey(),
  sourceUrl: text("source_url").notNull(),
  targetUrl: text("target_url").notNull(),
  anchorText: text("anchor_text"),
  linkType: varchar("link_type", { length: 50 }), // dofollow, nofollow, sponsored
  sourceAuthority: real("source_authority").default(0),
  linkStatus: varchar("link_status", { length: 50 }).default("active"), // active, removed, redirected, broken
  trafficFromLink: integer("traffic_from_link").default(0),
  linkValue: real("link_value").default(0),
  discoveredAt: timestamp("discovered_at").defaultNow(),
  lastChecked: timestamp("last_checked").defaultNow(),
  alertsEnabled: boolean("alerts_enabled").default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow()
});

// 5. SOCIAL MEDIA AUTOMATION ENGINE
export const socialMediaAccounts = pgTable("social_media_accounts", {
  id: serial("id").primaryKey(),
  platform: varchar("platform", { length: 50 }).notNull(), // twitter, linkedin, facebook, instagram, tiktok
  accountName: text("account_name").notNull(),
  accountHandle: text("account_handle"),
  accountId: text("account_id"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  isActive: boolean("is_active").default(true),
  isConnected: boolean("is_connected").default(false),
  vertical: varchar("vertical", { length: 50 }),
  followerCount: integer("follower_count").default(0),
  followingCount: integer("following_count").default(0),
  postCount: integer("post_count").default(0),
  engagementRate: real("engagement_rate").default(0),
  lastSyncAt: timestamp("last_sync_at"),
  automationSettings: jsonb("automation_settings").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const socialMediaPosts = pgTable("social_media_posts", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => socialMediaAccounts.id),
  platform: varchar("platform", { length: 50 }).notNull(),
  contentId: integer("content_id").references(() => contentGeneration.id),
  postContent: text("post_content").notNull(),
  mediaUrls: jsonb("media_urls").default([]),
  hashtags: jsonb("hashtags").default([]),
  mentions: jsonb("mentions").default([]),
  postUrl: text("post_url"),
  platformPostId: text("platform_post_id"),
  status: varchar("status", { length: 50 }).default("draft"), // draft, scheduled, posted, failed
  scheduledFor: timestamp("scheduled_for"),
  postedAt: timestamp("posted_at"),
  engagementMetrics: jsonb("engagement_metrics").default({}),
  isPromoted: boolean("is_promoted").default(false),
  promotionBudget: real("promotion_budget").default(0),
  targetAudience: jsonb("target_audience").default({}),
  campaignName: text("campaign_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const socialMediaEngagement = pgTable("social_media_engagement", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => socialMediaPosts.id),
  platform: varchar("platform", { length: 50 }).notNull(),
  engagementType: varchar("engagement_type", { length: 50 }).notNull(), // like, comment, share, save, click
  userId: text("user_id"),
  username: text("username"),
  userProfileUrl: text("user_profile_url"),
  engagementContent: text("engagement_content"), // for comments
  sentimentScore: real("sentiment_score"),
  isInfluencer: boolean("is_influencer").default(false),
  followerCount: integer("follower_count").default(0),
  engagementValue: real("engagement_value").default(0),
  automatedResponse: text("automated_response"),
  responseScheduled: boolean("response_scheduled").default(false),
  engagedAt: timestamp("engaged_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow()
});

// 6. EMAIL MARKETING AUTOMATION ENGINE
export const emailCampaigns = pgTable("email_campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  campaignType: varchar("campaign_type", { length: 50 }).notNull(), // broadcast, drip, behavioral
  vertical: varchar("vertical", { length: 50 }).notNull(),
  subject: text("subject").notNull(),
  preheader: text("preheader"),
  emailContent: text("email_content").notNull(),
  template: text("template"),
  segmentId: integer("segment_id"),
  senderName: text("sender_name"),
  senderEmail: text("sender_email"),
  replyToEmail: text("reply_to_email"),
  status: varchar("status", { length: 50 }).default("draft"), // draft, scheduled, sending, sent, paused
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  totalRecipients: integer("total_recipients").default(0),
  deliveredCount: integer("delivered_count").default(0),
  openedCount: integer("opened_count").default(0),
  clickedCount: integer("clicked_count").default(0),
  unsubscribedCount: integer("unsubscribed_count").default(0),
  bouncedCount: integer("bounced_count").default(0),
  conversionCount: integer("conversion_count").default(0),
  revenue: real("revenue").default(0),
  automationTriggerId: integer("automation_trigger_id"),
  abTestVariant: varchar("ab_test_variant", { length: 10 }),
  trackingEnabled: boolean("tracking_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const emailAutomations = pgTable("email_automations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  automationType: varchar("automation_type", { length: 50 }).notNull(), // welcome, nurture, abandonment, reengagement
  triggerEvent: varchar("trigger_event", { length: 50 }).notNull(),
  triggerConditions: jsonb("trigger_conditions").default({}),
  vertical: varchar("vertical", { length: 50 }).notNull(),
  isActive: boolean("is_active").default(true),
  delayMinutes: integer("delay_minutes").default(0),
  sendTime: varchar("send_time", { length: 10 }), // specific time like "09:00"
  timeZone: varchar("time_zone", { length: 50 }).default("UTC"),
  frequency: varchar("frequency", { length: 50 }).default("once"), // once, daily, weekly, monthly
  maxExecutions: integer("max_executions").default(0), // 0 = unlimited
  currentExecutions: integer("current_executions").default(0),
  segmentFilters: jsonb("segment_filters").default({}),
  emailSequence: jsonb("email_sequence").default([]),
  performanceMetrics: jsonb("performance_metrics").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const emailSubscribers = pgTable("email_subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  status: varchar("status", { length: 50 }).default("active"), // active, unsubscribed, bounced, complained
  sourceUrl: text("source_url"),
  sourceType: varchar("source_type", { length: 50 }), // opt_in, import, api, referral
  vertical: varchar("vertical", { length: 50 }),
  segments: jsonb("segments").default([]),
  tags: jsonb("tags").default([]),
  customFields: jsonb("custom_fields").default({}),
  preferences: jsonb("preferences").default({}),
  engagementScore: real("engagement_score").default(0),
  lastOpenedAt: timestamp("last_opened_at"),
  lastClickedAt: timestamp("last_clicked_at"),
  subscribedAt: timestamp("subscribed_at").defaultNow(),
  unsubscribedAt: timestamp("unsubscribed_at"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  leadMagnetUsed: text("lead_magnet_used"),
  totalEmailsReceived: integer("total_emails_received").default(0),
  totalEmailsOpened: integer("total_emails_opened").default(0),
  totalLinksClicked: integer("total_links_clicked").default(0),
  lifetimeValue: real("lifetime_value").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// 7. CONVERSION OPTIMIZATION ENGINE
export const conversionFunnels = pgTable("conversion_funnels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  vertical: varchar("vertical", { length: 50 }).notNull(),
  funnelType: varchar("funnel_type", { length: 50 }).notNull(), // sales, lead_gen, signup, onboarding
  steps: jsonb("steps").notNull(),
  goalType: varchar("goal_type", { length: 50 }).notNull(), // revenue, leads, signups, engagement
  goalValue: real("goal_value").default(0),
  isActive: boolean("is_active").default(true),
  trafficSources: jsonb("traffic_sources").default([]),
  targetAudience: jsonb("target_audience").default({}),
  conversionStrategy: text("conversion_strategy"),
  abTestingEnabled: boolean("ab_testing_enabled").default(false),
  currentVariant: varchar("current_variant", { length: 50 }).default("control"),
  variants: jsonb("variants").default([]),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  totalVisitors: integer("total_visitors").default(0),
  conversions: integer("conversions").default(0),
  conversionRate: real("conversion_rate").default(0),
  revenue: real("revenue").default(0),
  averageOrderValue: real("average_order_value").default(0),
  lastOptimizedAt: timestamp("last_optimized_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const conversionExperiments = pgTable("conversion_experiments", {
  id: serial("id").primaryKey(),
  funnelId: integer("funnel_id").references(() => conversionFunnels.id),
  experimentName: text("experiment_name").notNull(),
  experimentType: varchar("experiment_type", { length: 50 }).notNull(), // ab_test, multivariate, split_url
  hypothesis: text("hypothesis").notNull(),
  variable: text("variable").notNull(), // what's being tested
  controlVersion: jsonb("control_version").notNull(),
  variants: jsonb("variants").notNull(),
  trafficSplit: jsonb("traffic_split").default({}),
  status: varchar("status", { length: 50 }).default("draft"), // draft, running, paused, completed
  confidenceLevel: real("confidence_level").default(95),
  statisticalSignificance: real("statistical_significance").default(0),
  minimumSampleSize: integer("minimum_sample_size").default(1000),
  currentSampleSize: integer("current_sample_size").default(0),
  expectedLift: real("expected_lift").default(0),
  actualLift: real("actual_lift").default(0),
  winningVariant: varchar("winning_variant", { length: 50 }),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  duration: integer("duration").default(14), // days
  results: jsonb("results").default({}),
  conclusion: text("conclusion"),
  implementationStatus: varchar("implementation_status", { length: 50 }).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const conversionEvents = pgTable("conversion_events", {
  id: serial("id").primaryKey(),
  funnelId: integer("funnel_id").references(() => conversionFunnels.id),
  experimentId: integer("experiment_id").references(() => conversionExperiments.id),
  sessionId: text("session_id").notNull(),
  userId: text("user_id"),
  visitorId: text("visitor_id").notNull(),
  eventType: varchar("event_type", { length: 50 }).notNull(), // page_view, click, form_submit, conversion
  stepName: text("step_name"),
  variantShown: varchar("variant_shown", { length: 50 }),
  eventValue: real("event_value").default(0),
  revenue: real("revenue").default(0),
  pageUrl: text("page_url").notNull(),
  referrerUrl: text("referrer_url"),
  trafficSource: varchar("traffic_source", { length: 50 }),
  utmCampaign: text("utm_campaign"),
  utmMedium: text("utm_medium"),
  utmSource: text("utm_source"),
  deviceType: varchar("device_type", { length: 50 }),
  browserType: varchar("browser_type", { length: 50 }),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  location: jsonb("location").default({}),
  eventMetadata: jsonb("event_metadata").default({}),
  eventTimestamp: timestamp("event_timestamp").defaultNow(),
  createdAt: timestamp("created_at").defaultNow()
});

// Insert schemas for all tables
export const insertSeoOptimizationTaskSchema = createInsertSchema(seoOptimizationTasks);
export const insertSeoKeywordResearchSchema = createInsertSchema(seoKeywordResearch);
export const insertSeoSiteAuditsSchema = createInsertSchema(seoSiteAudits);
export const insertContentTemplatesSchema = createInsertSchema(contentTemplates);
export const insertContentGenerationSchema = createInsertSchema(contentGeneration);
export const insertContentPerformanceSchema = createInsertSchema(contentPerformance);
export const insertReferralProgramsSchema = createInsertSchema(referralPrograms);
export const insertReferralLinksSchema = createInsertSchema(referralLinks);
export const insertReferralTransactionsSchema = createInsertSchema(referralTransactions);
export const insertBacklinkOpportunitiesSchema = createInsertSchema(backlinkOpportunities);
export const insertBacklinkOutreachSchema = createInsertSchema(backlinkOutreach);
export const insertBacklinkMonitoringSchema = createInsertSchema(backlinkMonitoring);
export const insertSocialMediaAccountsSchema = createInsertSchema(socialMediaAccounts);
export const insertSocialMediaPostsSchema = createInsertSchema(socialMediaPosts);
export const insertSocialMediaEngagementSchema = createInsertSchema(socialMediaEngagement);
export const insertEmailCampaignsSchema = createInsertSchema(emailCampaigns);
export const insertEmailAutomationsSchema = createInsertSchema(emailAutomations);
export const insertEmailSubscribersSchema = createInsertSchema(emailSubscribers);
export const insertConversionFunnelsSchema = createInsertSchema(conversionFunnels);
export const insertConversionExperimentsSchema = createInsertSchema(conversionExperiments);
export const insertConversionEventsSchema = createInsertSchema(conversionEvents);

// TypeScript types for all tables
export type SeoOptimizationTask = typeof seoOptimizationTasks.$inferSelect;
export type SeoKeywordResearch = typeof seoKeywordResearch.$inferSelect;
export type SeoSiteAudit = typeof seoSiteAudits.$inferSelect;
export type ContentTemplate = typeof contentTemplates.$inferSelect;
export type ContentGeneration = typeof contentGeneration.$inferSelect;
export type ContentPerformance = typeof contentPerformance.$inferSelect;
export type ReferralProgram = typeof referralPrograms.$inferSelect;
export type ReferralLink = typeof referralLinks.$inferSelect;
export type ReferralTransaction = typeof referralTransactions.$inferSelect;
export type BacklinkOpportunity = typeof backlinkOpportunities.$inferSelect;
export type BacklinkOutreach = typeof backlinkOutreach.$inferSelect;
export type BacklinkMonitoring = typeof backlinkMonitoring.$inferSelect;
export type SocialMediaAccount = typeof socialMediaAccounts.$inferSelect;
export type SocialMediaPost = typeof socialMediaPosts.$inferSelect;
export type SocialMediaEngagement = typeof socialMediaEngagement.$inferSelect;
export type EmailCampaign = typeof emailCampaigns.$inferSelect;
export type EmailAutomation = typeof emailAutomations.$inferSelect;
export type EmailSubscriber = typeof emailSubscribers.$inferSelect;
export type ConversionFunnel = typeof conversionFunnels.$inferSelect;
export type ConversionExperiment = typeof conversionExperiments.$inferSelect;
export type ConversionEvent = typeof conversionEvents.$inferSelect;