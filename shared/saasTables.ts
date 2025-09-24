// SaaS-specific database tables for neuron-software-saas
import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// SaaS Tools table - comprehensive tool database
export const saasTools = pgTable("saas_tools", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  subCategory: varchar("sub_category", { length: 100 }),
  website: text("website").notNull(),
  affiliateUrl: text("affiliate_url"),
  logo: text("logo"),
  screenshots: jsonb("screenshots"), // Array of screenshot URLs
  pricing: jsonb("pricing").notNull(), // Pricing tiers object
  features: jsonb("features").notNull(), // Array of features
  pros: jsonb("pros"), // Array of pros
  cons: jsonb("cons"), // Array of cons
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").default(0),
  alternatives: jsonb("alternatives"), // Array of alternative tool IDs
  integrations: jsonb("integrations"), // Array of integration names
  targetUsers: jsonb("target_users"), // Array of target user types
  tags: jsonb("tags"), // Array of tags for filtering
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false),
  dealActive: boolean("deal_active").default(false),
  dealDescription: text("deal_description"),
  dealExpiry: timestamp("deal_expiry"),
  affiliateCommission: decimal("affiliate_commission", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// SaaS Categories table
export const saasCategories = pgTable("saas_categories", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 100 }),
  parentCategory: varchar("parent_category", { length: 100 }),
  toolCount: integer("tool_count").default(0),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// User SaaS Stacks table - saved tool combinations
export const saasStacks = pgTable("saas_stacks", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }),
  userId: varchar("user_id", { length: 255 }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  persona: varchar("persona", { length: 100 }),
  tools: jsonb("tools").notNull(), // Array of selected tools with categories
  totalCost: jsonb("total_cost"), // Monthly and yearly costs
  isPublic: boolean("is_public").default(false),
  likes: integer("likes").default(0),
  views: integer("views").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// SaaS Reviews table
export const saasReviews = pgTable("saas_reviews", {
  id: serial("id").primaryKey(),
  toolId: integer("tool_id").references(() => saasTools.id),
  sessionId: varchar("session_id", { length: 255 }),
  userId: varchar("user_id", { length: 255 }),
  rating: integer("rating").notNull(), // 1-5 stars
  title: varchar("title", { length: 255 }),
  content: text("content"),
  pros: jsonb("pros"),
  cons: jsonb("cons"),
  useCase: varchar("use_case", { length: 100 }),
  userRole: varchar("user_role", { length: 100 }),
  companySize: varchar("company_size", { length: 100 }),
  isVerified: boolean("is_verified").default(false),
  isPublished: boolean("is_published").default(false),
  helpfulVotes: integer("helpful_votes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// SaaS Comparisons table - tool vs tool battles
export const saasComparisons = pgTable("saas_comparisons", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  toolA: integer("tool_a").references(() => saasTools.id),
  toolB: integer("tool_b").references(() => saasTools.id),
  category: varchar("category", { length: 100 }),
  comparisonMatrix: jsonb("comparison_matrix"), // Feature comparison data
  verdict: text("verdict"),
  votesA: integer("votes_a").default(0),
  votesB: integer("votes_b").default(0),
  totalVotes: integer("total_votes").default(0),
  views: integer("views").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// SaaS Deals table - tracking active deals and promotions
export const saasDeals = pgTable("saas_deals", {
  id: serial("id").primaryKey(),
  toolId: integer("tool_id").references(() => saasTools.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  dealType: varchar("deal_type", { length: 100 }).notNull(), // discount, free-trial, lifetime, etc.
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
  dealPrice: decimal("deal_price", { precision: 10, scale: 2 }),
  discountPercent: integer("discount_percent"),
  dealUrl: text("deal_url").notNull(),
  couponCode: varchar("coupon_code", { length: 100 }),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quiz Results for SaaS Tool Recommendations
export const saasQuizResults = pgTable("saas_quiz_results", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }),
  quizType: varchar("quiz_type", { length: 100 }).notNull(),
  answers: jsonb("answers").notNull(),
  persona: varchar("persona", { length: 100 }),
  recommendedTools: jsonb("recommended_tools"), // Array of tool IDs with scores
  recommendedStack: jsonb("recommended_stack"), // Complete stack recommendation
  budget: jsonb("budget"), // User's budget preferences
  priorities: jsonb("priorities"), // What matters most to user
  createdAt: timestamp("created_at").defaultNow(),
});

// SaaS Calculator Results - ROI, cost savings, etc.
export const saasCalculatorResults = pgTable("saas_calculator_results", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  calculatorType: varchar("calculator_type", { length: 100 }).notNull(),
  inputs: jsonb("inputs").notNull(),
  results: jsonb("results").notNull(),
  toolsCompared: jsonb("tools_compared"),
  recommendations: jsonb("recommendations"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Content pieces for SaaS topics
export const saasContent = pgTable("saas_content", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  content: text("content").notNull(),
  contentType: varchar("content_type", { length: 100 }).notNull(), // blog, guide, comparison, review
  category: varchar("category", { length: 100 }),
  featuredTools: jsonb("featured_tools"), // Array of tool IDs mentioned
  tags: jsonb("tags"),
  metaTitle: varchar("meta_title", { length: 255 }),
  metaDescription: text("meta_description"),
  ogImage: text("og_image"),
  readTime: integer("read_time"), // Estimated reading time in minutes
  views: integer("views").default(0),
  shares: integer("shares").default(0),
  isPublished: boolean("is_published").default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertSaasToolSchema = createInsertSchema(saasTools).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSaasCategorySchema = createInsertSchema(saasCategories).omit({
  id: true,
  createdAt: true,
});

export const insertSaasStackSchema = createInsertSchema(saasStacks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSaasReviewSchema = createInsertSchema(saasReviews).omit({
  id: true,
  createdAt: true,
});

export const insertSaasComparisonSchema = createInsertSchema(saasComparisons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSaasDealSchema = createInsertSchema(saasDeals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSaasQuizResultSchema = createInsertSchema(saasQuizResults).omit({
  id: true,
  createdAt: true,
});

export const insertSaasCalculatorResultSchema = createInsertSchema(saasCalculatorResults).omit({
  id: true,
  createdAt: true,
});

export const insertSaasContentSchema = createInsertSchema(saasContent).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type SaasTool = typeof saasTools.$inferSelect;
export type InsertSaasTool = z.infer<typeof insertSaasToolSchema>;

export type SaaSCategory = typeof saasCategories.$inferSelect;
export type InsertSaaSCategory = z.infer<typeof insertSaasCategorySchema>;

export type SaaSStack = typeof saasStacks.$inferSelect;
export type InsertSaaSStack = z.infer<typeof insertSaasStackSchema>;

export type SaaSReview = typeof saasReviews.$inferSelect;
export type InsertSaaSReview = z.infer<typeof insertSaasReviewSchema>;

export type SaaSComparison = typeof saasComparisons.$inferSelect;
export type InsertSaaSComparison = z.infer<typeof insertSaasComparisonSchema>;

export type SaaSDeal = typeof saasDeals.$inferSelect;
export type InsertSaaSDeal = z.infer<typeof insertSaasDealSchema>;

export type SaaSQuizResult = typeof saasQuizResults.$inferSelect;
export type InsertSaaSQuizResult = z.infer<typeof insertSaasQuizResultSchema>;

export type SaaSCalculatorResult = typeof saasCalculatorResults.$inferSelect;
export type InsertSaaSCalculatorResult = z.infer<typeof insertSaasCalculatorResultSchema>;

export type SaaSContent = typeof saasContent.$inferSelect;
export type InsertSaaSContent = z.infer<typeof insertSaasContentSchema>;