import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Finance User Profiles - Track financial personas and goals
export const financeProfiles = pgTable("finance_profiles", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }),
  persona: varchar("persona", { length: 100 }).notNull(), // broke-student, young-investor, fire-seeker, etc.
  goals: jsonb("goals").notNull(), // Array of financial goals
  riskTolerance: varchar("risk_tolerance", { length: 50 }).default("moderate"),
  currentIncome: decimal("current_income", { precision: 12, scale: 2 }),
  currentSavings: decimal("current_savings", { precision: 12, scale: 2 }),
  currentDebt: decimal("current_debt", { precision: 12, scale: 2 }),
  age: integer("age"),
  dependents: integer("dependents").default(0),
  financialExperience: varchar("financial_experience", { length: 50 }).default("beginner"),
  preferredProducts: jsonb("preferred_products"), // Array of preferred financial products
  lastQuizScore: integer("last_quiz_score"),
  engagementLevel: varchar("engagement_level", { length: 50 }).default("low"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Finance Quiz Results - Track quiz completion and persona mapping
export const financeQuizResults = pgTable("finance_quiz_results", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }),
  quizType: varchar("quiz_type", { length: 100 }).notNull(), // money-persona, investment-strategy, retirement-readiness
  answers: jsonb("answers").notNull(),
  calculatedPersona: varchar("calculated_persona", { length: 100 }).notNull(),
  score: integer("score").notNull(),
  recommendations: jsonb("recommendations").notNull(), // Array of personalized recommendations
  productMatches: jsonb("product_matches"), // Array of matched financial products
  completionTime: integer("completion_time"), // Time taken in seconds
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Finance Calculator Results - Track calculator usage and results
export const financeCalculatorResults = pgTable("finance_calculator_results", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }),
  calculatorType: varchar("calculator_type", { length: 100 }).notNull(), // budget, compound-interest, fire, etc.
  inputs: jsonb("inputs").notNull(), // All calculator input values
  results: jsonb("results").notNull(), // Calculated results
  recommendations: jsonb("recommendations"), // Generated recommendations based on results
  actionItems: jsonb("action_items"), // Specific next steps
  shareableLink: varchar("shareable_link", { length: 255 }),
  bookmarked: boolean("bookmarked").default(false),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Finance Product Offers - Financial products and affiliate offers
export const financeProductOffers = pgTable("finance_product_offers", {
  id: serial("id").primaryKey(),
  productType: varchar("product_type", { length: 100 }).notNull(), // credit-card, savings-account, robo-advisor, etc.
  providerName: varchar("provider_name", { length: 255 }).notNull(),
  productName: varchar("product_name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  keyFeatures: jsonb("key_features").notNull(), // Array of key features
  targetPersonas: jsonb("target_personas").notNull(), // Array of target personas
  apr: decimal("apr", { precision: 5, scale: 2 }), // For credit products
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 }), // For savings/investment
  fees: jsonb("fees"), // Object with various fee types
  minimumAmount: decimal("minimum_amount", { precision: 12, scale: 2 }),
  maximumAmount: decimal("maximum_amount", { precision: 12, scale: 2 }),
  eligibilityRequirements: jsonb("eligibility_requirements"),
  affiliateUrl: text("affiliate_url").notNull(),
  ctaText: varchar("cta_text", { length: 100 }).default("Learn More"),
  trustScore: integer("trust_score").default(85), // Out of 100
  priority: integer("priority").default(1),
  isActive: boolean("is_active").default(true),
  disclaimers: jsonb("disclaimers"), // Array of legal disclaimers
  promotionalOffer: text("promotional_offer"),
  expirationDate: timestamp("expiration_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Finance Content Library - Dynamic finance content and articles
export const financeContent = pgTable("finance_content", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  metaDescription: text("meta_description"),
  category: varchar("category", { length: 100 }).notNull(), // budgeting, investing, credit, retirement, etc.
  subcategory: varchar("subcategory", { length: 100 }),
  targetPersonas: jsonb("target_personas").notNull(), // Array of target personas
  emotionTone: varchar("emotion_tone", { length: 50 }).default("optimistic"), // calm, urgent, optimistic, serious
  contentType: varchar("content_type", { length: 50 }).default("article"), // article, guide, checklist, comparison
  content: text("content").notNull(), // Markdown content
  readingTime: integer("reading_time"), // Estimated reading time in minutes
  difficulty: varchar("difficulty", { length: 50 }).default("beginner"), // beginner, intermediate, advanced
  keyTakeaways: jsonb("key_takeaways"), // Array of key points
  actionItems: jsonb("action_items"), // Array of actionable steps
  relatedProducts: jsonb("related_products"), // Array of product IDs
  seoKeywords: jsonb("seo_keywords"), // Array of SEO keywords
  lastUpdated: timestamp("last_updated").defaultNow(),
  authorCredentials: varchar("author_credentials", { length: 255 }),
  factCheckDate: timestamp("fact_check_date"),
  viewCount: integer("view_count").default(0),
  engagementScore: decimal("engagement_score", { precision: 5, scale: 2 }).default("0.00"),
  isPublished: boolean("is_published").default(true),
  isFeatured: boolean("is_featured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Finance Gamification - Track user progress and achievements
export const financeGamification = pgTable("finance_gamification", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }),
  currentLevel: integer("current_level").default(1),
  totalXP: integer("total_xp").default(0),
  streakDays: integer("streak_days").default(0),
  lastActivityDate: timestamp("last_activity_date").defaultNow(),
  completedChallenges: jsonb("completed_challenges"), // Array of completed challenge IDs
  earnedBadges: jsonb("earned_badges"), // Array of earned badge IDs
  currentQuests: jsonb("current_quests"), // Array of active quest objects
  lifetimeStats: jsonb("lifetime_stats"), // Object with various lifetime statistics
  weeklyGoals: jsonb("weekly_goals"), // Array of weekly goal objects
  monthlyGoals: jsonb("monthly_goals"), // Array of monthly goal objects
  preferences: jsonb("preferences"), // User gamification preferences
  leaderboardScore: integer("leaderboard_score").default(0),
  isPublicProfile: boolean("is_public_profile").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Finance AI Chat Sessions - Track AI financial advisor interactions
export const financeAIChatSessions = pgTable("finance_ai_chat_sessions", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }),
  chatSessionId: varchar("chat_session_id", { length: 255 }).notNull().unique(),
  persona: varchar("persona", { length: 100 }),
  context: jsonb("context"), // User financial context for personalized responses
  messages: jsonb("messages").notNull(), // Array of chat messages
  topics: jsonb("topics"), // Array of discussed topics
  recommendations: jsonb("recommendations"), // AI-generated recommendations
  productSuggestions: jsonb("product_suggestions"), // Suggested financial products
  satisfactionRating: integer("satisfaction_rating"), // 1-5 rating
  resolvedQuery: boolean("resolved_query").default(false),
  followUpScheduled: boolean("follow_up_scheduled").default(false),
  totalMessages: integer("total_messages").default(0),
  sessionDuration: integer("session_duration"), // Duration in seconds
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Finance Lead Magnets - Track lead magnet downloads and conversions
export const financeLeadMagnets = pgTable("finance_lead_magnets", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }),
  magnetType: varchar("magnet_type", { length: 100 }).notNull(), // budget-template, investment-guide, etc.
  magnetTitle: varchar("magnet_title", { length: 255 }).notNull(),
  userEmail: varchar("user_email", { length: 255 }),
  userFirstName: varchar("user_first_name", { length: 100 }),
  userPersona: varchar("user_persona", { length: 100 }),
  downloadedAt: timestamp("downloaded_at").defaultNow(),
  downloadSource: varchar("download_source", { length: 100 }), // Page where download occurred
  followUpSequence: varchar("follow_up_sequence", { length: 100 }), // Email sequence type
  conversionTracked: boolean("conversion_tracked").default(false),
  emailOptIn: boolean("email_opt_in").default(true),
  smsOptIn: boolean("sms_opt_in").default(false),
  preferences: jsonb("preferences"), // Communication preferences
  createdAt: timestamp("created_at").defaultNow(),
});

// Finance Performance Metrics - Track neuron performance and optimization
export const financePerformanceMetrics = pgTable("finance_performance_metrics", {
  id: serial("id").primaryKey(),
  metricDate: timestamp("metric_date").defaultNow(),
  totalSessions: integer("total_sessions").default(0),
  uniqueUsers: integer("unique_users").default(0),
  quizCompletions: integer("quiz_completions").default(0),
  calculatorUsage: integer("calculator_usage").default(0),
  contentViews: integer("content_views").default(0),
  aiChatSessions: integer("ai_chat_sessions").default(0),
  leadMagnetDownloads: integer("lead_magnet_downloads").default(0),
  affiliateClicks: integer("affiliate_clicks").default(0),
  averageSessionDuration: integer("average_session_duration").default(0),
  bounceRate: decimal("bounce_rate", { precision: 5, scale: 2 }).default("0.00"),
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }).default("0.00"),
  engagementScore: decimal("engagement_score", { precision: 5, scale: 2 }).default("0.00"),
  contentPerformance: jsonb("content_performance"), // Performance data by content type
  productPerformance: jsonb("product_performance"), // Performance data by product type
  personaBreakdown: jsonb("persona_breakdown"), // User distribution by persona
  topPerformingContent: jsonb("top_performing_content"), // Array of top content
  optimizationSuggestions: jsonb("optimization_suggestions"), // AI-generated optimization suggestions
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod schemas for type safety
export const insertFinanceProfileSchema = createInsertSchema(financeProfiles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFinanceQuizResultSchema = createInsertSchema(financeQuizResults).omit({ id: true, createdAt: true });
export const insertFinanceCalculatorResultSchema = createInsertSchema(financeCalculatorResults).omit({ id: true, createdAt: true });
export const insertFinanceProductOfferSchema = createInsertSchema(financeProductOffers).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFinanceContentSchema = createInsertSchema(financeContent).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFinanceGamificationSchema = createInsertSchema(financeGamification).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFinanceAIChatSessionSchema = createInsertSchema(financeAIChatSessions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFinanceLeadMagnetSchema = createInsertSchema(financeLeadMagnets).omit({ id: true, createdAt: true });
export const insertFinancePerformanceMetricSchema = createInsertSchema(financePerformanceMetrics).omit({ id: true, createdAt: true });

// Type exports
export type InsertFinanceProfile = z.infer<typeof insertFinanceProfileSchema>;
export type InsertFinanceQuizResult = z.infer<typeof insertFinanceQuizResultSchema>;
export type InsertFinanceCalculatorResult = z.infer<typeof insertFinanceCalculatorResultSchema>;
export type InsertFinanceProductOffer = z.infer<typeof insertFinanceProductOfferSchema>;
export type InsertFinanceContent = z.infer<typeof insertFinanceContentSchema>;
export type InsertFinanceGamification = z.infer<typeof insertFinanceGamificationSchema>;
export type InsertFinanceAIChatSession = z.infer<typeof insertFinanceAIChatSessionSchema>;
export type InsertFinanceLeadMagnet = z.infer<typeof insertFinanceLeadMagnetSchema>;
export type InsertFinancePerformanceMetric = z.infer<typeof insertFinancePerformanceMetricSchema>;

export type FinanceProfile = typeof financeProfiles.$inferSelect;
export type FinanceQuizResult = typeof financeQuizResults.$inferSelect;
export type FinanceCalculatorResult = typeof financeCalculatorResults.$inferSelect;
export type FinanceProductOffer = typeof financeProductOffers.$inferSelect;
export type FinanceContent = typeof financeContent.$inferSelect;
export type FinanceGamification = typeof financeGamification.$inferSelect;
export type FinanceAIChatSession = typeof financeAIChatSessions.$inferSelect;
export type FinanceLeadMagnet = typeof financeLeadMagnets.$inferSelect;
export type FinancePerformanceMetric = typeof financePerformanceMetrics.$inferSelect;