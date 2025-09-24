import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, real, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Health & Wellness User Archetypes
export const healthArchetypes = pgTable("health_archetypes", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  characteristics: jsonb("characteristics"), // Personality traits, preferences
  emotionMapping: varchar("emotion_mapping", { length: 50 }), // calm, energetic, trustworthy, playful
  colorScheme: jsonb("color_scheme"), // Theme colors for this archetype
  preferredTools: jsonb("preferred_tools"), // Array of tool slugs
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Health Tools (BMI, BMR, Sleep Calculator, etc.)
export const healthTools = pgTable("health_tools", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }), // fitness, nutrition, sleep, mental-health
  emotionMapping: varchar("emotion_mapping", { length: 50 }), // trust, calm, action
  inputFields: jsonb("input_fields"), // Schema for input form
  calculationLogic: text("calculation_logic"), // Formula or logic description
  outputFormat: jsonb("output_format"), // How to display results
  trackingEnabled: boolean("tracking_enabled").default(true),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Health Tool Sessions (track individual uses)
export const healthToolSessions = pgTable("health_tool_sessions", {
  id: serial("id").primaryKey(),
  toolId: integer("tool_id").references(() => healthTools.id),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }),
  inputs: jsonb("inputs").notNull(), // User input data
  outputs: jsonb("outputs").notNull(), // Calculated results
  archetype: varchar("archetype", { length: 100 }),
  timeSpent: integer("time_spent").default(0), // in seconds
  actionTaken: varchar("action_taken", { length: 100 }), // shared, saved, clicked_cta, etc.
  metadata: jsonb("metadata"), // Additional tracking data
  createdAt: timestamp("created_at").defaultNow(),
});

// Health Quizzes
export const healthQuizzes = pgTable("health_quizzes", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  questions: jsonb("questions").notNull(), // Array of question objects
  scoringLogic: jsonb("scoring_logic").notNull(), // How to calculate results
  resultMappings: jsonb("result_mappings").notNull(), // Score ranges to archetypes/results
  estimatedTime: integer("estimated_time").default(300), // in seconds
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Health Quiz Results
export const healthQuizResults = pgTable("health_quiz_results", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").references(() => healthQuizzes.id),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }),
  answers: jsonb("answers").notNull(),
  score: integer("score").notNull(),
  archetypeResult: varchar("archetype_result", { length: 100 }),
  confidenceScore: real("confidence_score").default(0.8), // AI confidence in result
  recommendations: jsonb("recommendations"), // Personalized recommendations
  timeToComplete: integer("time_to_complete").default(0), // in seconds
  exitPoint: varchar("exit_point", { length: 50 }), // completed, abandoned, question_x
  actionTaken: varchar("action_taken", { length: 100 }), // shared, saved, started_plan
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Health Content Library
export const healthContent = pgTable("health_content", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  category: varchar("category", { length: 100 }), // diet, sleep, mental-health, fitness
  contentType: varchar("content_type", { length: 50 }), // article, guide, checklist, plan
  targetArchetype: varchar("target_archetype", { length: 100 }),
  emotionTone: varchar("emotion_tone", { length: 50 }),
  readingTime: integer("reading_time").default(5), // in minutes
  seoTitle: varchar("seo_title", { length: 255 }),
  seoDescription: text("seo_description"),
  tags: jsonb("tags"), // Array of tags
  sources: jsonb("sources"), // Reference sources
  isGenerated: boolean("is_generated").default(false), // AI generated vs manually created
  publishedAt: timestamp("published_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Health Lead Magnets
export const healthLeadMagnets = pgTable("health_lead_magnets", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  magnetType: varchar("magnet_type", { length: 50 }), // tracker, ebook, plan, checklist
  category: varchar("category", { length: 100 }),
  targetArchetype: varchar("target_archetype", { length: 100 }),
  deliveryMethod: varchar("delivery_method", { length: 50 }), // email, download, view
  fileUrl: text("file_url"),
  emailSequence: jsonb("email_sequence"), // Follow-up emails
  downloadCount: integer("download_count").default(0),
  conversionRate: real("conversion_rate").default(0.0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Health Gamification System
export const healthGamification = pgTable("health_gamification", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }),
  currentLevel: integer("current_level").default(1),
  totalXP: integer("total_xp").default(0),
  streakDays: integer("streak_days").default(0),
  lastActivity: date("last_activity"),
  achievedBadges: jsonb("achieved_badges"), // Array of badge slugs
  currentQuests: jsonb("current_quests"), // Array of active quest objects
  wellnessPoints: integer("wellness_points").default(0),
  preferences: jsonb("preferences"), // Notification settings, privacy
  shareSettings: jsonb("share_settings"), // What they're willing to share
  leaderboardOptIn: boolean("leaderboard_opt_in").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Health Daily Quests
export const healthDailyQuests = pgTable("health_daily_quests", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }), // hydration, movement, mindfulness, sleep
  xpReward: integer("xp_reward").default(10),
  difficultyLevel: varchar("difficulty_level", { length: 20 }).default("easy"), // easy, medium, hard
  completionCriteria: jsonb("completion_criteria"), // What constitutes completion
  isDaily: boolean("is_daily").default(true),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Health Quest Completions
export const healthQuestCompletions = pgTable("health_quest_completions", {
  id: serial("id").primaryKey(),
  questId: integer("quest_id").references(() => healthDailyQuests.id),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }),
  completedAt: timestamp("completed_at").defaultNow(),
  completionData: jsonb("completion_data"), // Evidence of completion
  xpEarned: integer("xp_earned").default(0),
  streakContribution: boolean("streak_contribution").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Health Content Performance
export const healthContentPerformance = pgTable("health_content_performance", {
  id: serial("id").primaryKey(),
  contentId: integer("content_id").references(() => healthContent.id),
  date: date("date").notNull(),
  views: integer("views").default(0),
  uniqueViews: integer("unique_views").default(0),
  averageTimeOnPage: integer("average_time_on_page").default(0), // in seconds
  bounceRate: real("bounce_rate").default(0.0),
  ctaClicks: integer("cta_clicks").default(0),
  leadCaptures: integer("lead_captures").default(0),
  socialShares: integer("social_shares").default(0),
  archetype: varchar("archetype", { length: 100 }),
  trafficSource: varchar("traffic_source", { length: 100 }),
  deviceType: varchar("device_type", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Create insert schemas for all tables
export const insertHealthArchetypeSchema = createInsertSchema(healthArchetypes);
export const insertHealthToolSchema = createInsertSchema(healthTools);
export const insertHealthToolSessionSchema = createInsertSchema(healthToolSessions);
export const insertHealthQuizSchema = createInsertSchema(healthQuizzes);
export const insertHealthQuizResultSchema = createInsertSchema(healthQuizResults);
export const insertHealthContentSchema = createInsertSchema(healthContent);
export const insertHealthLeadMagnetSchema = createInsertSchema(healthLeadMagnets);
export const insertHealthGamificationSchema = createInsertSchema(healthGamification);
export const insertHealthDailyQuestSchema = createInsertSchema(healthDailyQuests);
export const insertHealthQuestCompletionSchema = createInsertSchema(healthQuestCompletions);
export const insertHealthContentPerformanceSchema = createInsertSchema(healthContentPerformance);

// Type exports
export type HealthArchetype = typeof healthArchetypes.$inferSelect;
export type InsertHealthArchetype = z.infer<typeof insertHealthArchetypeSchema>;
export type HealthTool = typeof healthTools.$inferSelect;
export type InsertHealthTool = z.infer<typeof insertHealthToolSchema>;
export type HealthToolSession = typeof healthToolSessions.$inferSelect;
export type InsertHealthToolSession = z.infer<typeof insertHealthToolSessionSchema>;
export type HealthQuiz = typeof healthQuizzes.$inferSelect;
export type InsertHealthQuiz = z.infer<typeof insertHealthQuizSchema>;
export type HealthQuizResult = typeof healthQuizResults.$inferSelect;
export type InsertHealthQuizResult = z.infer<typeof insertHealthQuizResultSchema>;
export type HealthContent = typeof healthContent.$inferSelect;
export type InsertHealthContent = z.infer<typeof insertHealthContentSchema>;
export type HealthLeadMagnet = typeof healthLeadMagnets.$inferSelect;
export type InsertHealthLeadMagnet = z.infer<typeof insertHealthLeadMagnetSchema>;
export type HealthGamification = typeof healthGamification.$inferSelect;
export type InsertHealthGamification = z.infer<typeof insertHealthGamificationSchema>;
export type HealthDailyQuest = typeof healthDailyQuests.$inferSelect;
export type InsertHealthDailyQuest = z.infer<typeof insertHealthDailyQuestSchema>;
export type HealthQuestCompletion = typeof healthQuestCompletions.$inferSelect;
export type InsertHealthQuestCompletion = z.infer<typeof insertHealthQuestCompletionSchema>;
export type HealthContentPerformance = typeof healthContentPerformance.$inferSelect;
export type InsertHealthContentPerformance = z.infer<typeof insertHealthContentPerformanceSchema>;