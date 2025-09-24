import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, real, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Education User Archetypes (Students, Career Switchers, Hobbyists)
export const educationArchetypes = pgTable("education_archetypes", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  characteristics: jsonb("characteristics"), // Learning preferences, motivation, goals
  emotionMapping: varchar("emotion_mapping", { length: 50 }), // empower, curious, disciplined, inclusive
  colorScheme: jsonb("color_scheme"), // UI theme colors for this archetype
  preferredTools: jsonb("preferred_tools"), // Array of tool slugs
  learningStyle: varchar("learning_style", { length: 50 }), // visual, auditory, kinesthetic, reading
  goalType: varchar("goal_type", { length: 50 }), // career-switch, hobby, exam-prep, skill-upgrade
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Education Courses/Content Library
export const educationContent = pgTable("education_content", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  category: varchar("category", { length: 100 }), // programming, languages, business, test-prep
  contentType: varchar("content_type", { length: 50 }), // article, tutorial, guide, video, course
  targetArchetype: varchar("target_archetype", { length: 100 }),
  difficulty: varchar("difficulty", { length: 20 }), // beginner, intermediate, advanced
  estimatedTime: integer("estimated_time").default(30), // in minutes
  xpReward: integer("xp_reward").default(10),
  prerequisites: jsonb("prerequisites"), // Array of required content slugs
  emotionTone: varchar("emotion_tone", { length: 50 }),
  readingTime: integer("reading_time").default(5),
  seoTitle: varchar("seo_title", { length: 255 }),
  seoDescription: text("seo_description"),
  tags: jsonb("tags"), // Array of tags
  sources: jsonb("sources"), // Reference sources
  isGenerated: boolean("is_generated").default(false), // AI generated vs manual
  publishedAt: timestamp("published_at"),
  isActive: boolean("is_active").default(true),
  viewCount: integer("view_count").default(0),
  completionRate: real("completion_rate").default(0.0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Education Quizzes & Assessments
export const educationQuizzes = pgTable("education_quizzes", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  quizType: varchar("quiz_type", { length: 50 }), // personality, knowledge, skill-assessment
  questions: jsonb("questions").notNull(), // Array of question objects
  scoringLogic: jsonb("scoring_logic").notNull(), // How to calculate results
  resultMappings: jsonb("result_mappings").notNull(), // Score ranges to archetypes/recommendations
  estimatedTime: integer("estimated_time").default(300), // in seconds
  xpReward: integer("xp_reward").default(25),
  retakeAllowed: boolean("retake_allowed").default(true),
  passingScore: integer("passing_score").default(70),
  isActive: boolean("is_active").default(true),
  completionCount: integer("completion_count").default(0),
  averageScore: real("average_score").default(0.0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Education Quiz Results & Progress Tracking
export const educationQuizResults = pgTable("education_quiz_results", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").references(() => educationQuizzes.id),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }),
  answers: jsonb("answers").notNull(),
  score: integer("score").notNull(),
  percentage: real("percentage").notNull(),
  archetypeResult: varchar("archetype_result", { length: 100 }),
  recommendations: jsonb("recommendations"), // Personalized next steps
  timeToComplete: integer("time_to_complete").default(0), // in seconds
  exitPoint: varchar("exit_point", { length: 50 }), // completed, abandoned, question_x
  actionTaken: varchar("action_taken", { length: 100 }), // retake, continue, share
  xpEarned: integer("xp_earned").default(0),
  isPassed: boolean("is_passed").default(false),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Education Learning Paths & Curricula
export const educationPaths = pgTable("education_paths", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  targetArchetype: varchar("target_archetype", { length: 100 }),
  difficulty: varchar("difficulty", { length: 20 }),
  estimatedHours: integer("estimated_hours").default(40),
  curriculum: jsonb("curriculum").notNull(), // Ordered array of content/quiz IDs
  prerequisites: jsonb("prerequisites"), // Required skills/courses
  outcomes: jsonb("outcomes"), // What learners will achieve
  xpTotal: integer("xp_total").default(500),
  certificateTemplate: text("certificate_template"),
  isActive: boolean("is_active").default(true),
  enrollmentCount: integer("enrollment_count").default(0),
  completionRate: real("completion_rate").default(0.0),
  rating: real("rating").default(0.0),
  reviewCount: integer("review_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User Learning Progress & Gamification
export const educationProgress = pgTable("education_progress", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }),
  pathId: integer("path_id").references(() => educationPaths.id),
  contentId: integer("content_id").references(() => educationContent.id),
  quizId: integer("quiz_id").references(() => educationQuizzes.id),
  status: varchar("status", { length: 50 }).notNull(), // not-started, in-progress, completed, paused
  progressPercentage: real("progress_percentage").default(0.0),
  timeSpent: integer("time_spent").default(0), // in minutes
  lastAccessed: timestamp("last_accessed").defaultNow(),
  xpEarned: integer("xp_earned").default(0),
  streakDays: integer("streak_days").default(0),
  completedAt: timestamp("completed_at"),
  certificateIssued: boolean("certificate_issued").default(false),
  metadata: jsonb("metadata"), // Additional progress data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Gamification System - XP, Badges, Achievements
export const educationGamification = pgTable("education_gamification", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }),
  totalXp: integer("total_xp").default(0),
  level: integer("level").default(1),
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  lastActivityDate: date("last_activity_date"),
  badges: jsonb("badges"), // Array of earned badge objects
  achievements: jsonb("achievements"), // Array of achievement objects
  leaderboardPosition: integer("leaderboard_position"),
  friendsList: jsonb("friends_list"), // Array of friend session IDs
  preferences: jsonb("preferences"), // Notification, difficulty preferences
  dailyGoal: integer("daily_goal").default(30), // minutes per day
  weeklyGoal: integer("weekly_goal").default(300), // minutes per week
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Education Tools (Calculators, Planners, Trackers)
export const educationTools = pgTable("education_tools", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }), // planning, assessment, tracking, calculator
  toolType: varchar("tool_type", { length: 50 }), // goal-planner, study-tracker, gpa-calc
  emotionMapping: varchar("emotion_mapping", { length: 50 }),
  inputFields: jsonb("input_fields"), // Schema for input form
  calculationLogic: text("calculation_logic"), // Formula or logic description
  outputFormat: jsonb("output_format"), // How to display results
  trackingEnabled: boolean("tracking_enabled").default(true),
  xpReward: integer("xp_reward").default(5),
  isActive: boolean("is_active").default(true),
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tool Usage Sessions
export const educationToolSessions = pgTable("education_tool_sessions", {
  id: serial("id").primaryKey(),
  toolId: integer("tool_id").references(() => educationTools.id),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }),
  inputs: jsonb("inputs").notNull(), // User input data
  outputs: jsonb("outputs").notNull(), // Calculated results
  archetype: varchar("archetype", { length: 100 }),
  timeSpent: integer("time_spent").default(0), // in seconds
  actionTaken: varchar("action_taken", { length: 100 }), // saved, shared, exported
  xpEarned: integer("xp_earned").default(0),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Education Affiliate Offers & Products
export const educationOffers = pgTable("education_offers", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  provider: varchar("provider", { length: 100 }), // Coursera, Udemy, Skillshare
  category: varchar("category", { length: 100 }),
  offerType: varchar("offer_type", { length: 50 }), // course, subscription, tool, book
  originalPrice: real("original_price"),
  salePrice: real("sale_price"),
  discountPercent: integer("discount_percent"),
  affiliateUrl: text("affiliate_url").notNull(),
  trackingUrl: text("tracking_url"),
  commissionRate: real("commission_rate"), // Percentage
  targetArchetype: varchar("target_archetype", { length: 100 }),
  tags: jsonb("tags"), // Array of relevant tags
  thumbnailUrl: text("thumbnail_url"),
  rating: real("rating").default(0.0),
  reviewCount: integer("review_count").default(0),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false),
  clickCount: integer("click_count").default(0),
  conversionCount: integer("conversion_count").default(0),
  conversionRate: real("conversion_rate").default(0.0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI Chat Sessions & Tutor Interactions
export const educationAIChatSessions = pgTable("education_ai_chat_sessions", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }),
  chatId: varchar("chat_id", { length: 255 }).notNull().unique(),
  subject: varchar("subject", { length: 100 }), // math, programming, languages
  archetype: varchar("archetype", { length: 100 }),
  conversationHistory: jsonb("conversation_history").notNull(), // Array of messages
  totalMessages: integer("total_messages").default(0),
  sessionDuration: integer("session_duration").default(0), // in seconds
  questionsAsked: integer("questions_asked").default(0),
  answersProvided: integer("answers_provided").default(0),
  helpfulRating: real("helpful_rating").default(0.0),
  topicsDiscussed: jsonb("topics_discussed"), // Array of topics
  recommendationsGiven: jsonb("recommendations_given"), // AI suggestions
  isActive: boolean("is_active").default(true),
  lastInteraction: timestamp("last_interaction").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Daily Brain Quests & Challenges
export const educationDailyQuests = pgTable("education_daily_quests", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  questType: varchar("quest_type", { length: 50 }), // read-articles, complete-quiz, practice-tool
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  requirements: jsonb("requirements"), // What needs to be completed
  xpReward: integer("xp_reward").default(20),
  badgeReward: varchar("badge_reward", { length: 100 }),
  difficulty: varchar("difficulty", { length: 20 }),
  category: varchar("category", { length: 100 }),
  targetArchetype: varchar("target_archetype", { length: 100 }),
  isActive: boolean("is_active").default(true),
  completionCount: integer("completion_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Quest Completions
export const educationQuestCompletions = pgTable("education_quest_completions", {
  id: serial("id").primaryKey(),
  questId: integer("quest_id").references(() => educationDailyQuests.id),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }),
  completedAt: timestamp("completed_at").defaultNow(),
  xpEarned: integer("xp_earned").default(0),
  badgeEarned: varchar("badge_earned", { length: 100 }),
  timeToComplete: integer("time_to_complete").default(0), // in minutes
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema exports for type inference
export const insertEducationArchetypeSchema = createInsertSchema(educationArchetypes).pick({
  slug: true,
  name: true,
  description: true,
  characteristics: true,
  emotionMapping: true,
  colorScheme: true,
  preferredTools: true,
  learningStyle: true,
  goalType: true,
});

export const insertEducationContentSchema = createInsertSchema(educationContent).pick({
  slug: true,
  title: true,
  excerpt: true,
  content: true,
  category: true,
  contentType: true,
  targetArchetype: true,
  difficulty: true,
  estimatedTime: true,
  xpReward: true,
  prerequisites: true,
  emotionTone: true,
  readingTime: true,
  seoTitle: true,
  seoDescription: true,
  tags: true,
  sources: true,
  isGenerated: true,
  publishedAt: true,
});

export const insertEducationQuizSchema = createInsertSchema(educationQuizzes).pick({
  slug: true,
  title: true,
  description: true,
  category: true,
  quizType: true,
  questions: true,
  scoringLogic: true,
  resultMappings: true,
  estimatedTime: true,
  xpReward: true,
  retakeAllowed: true,
  passingScore: true,
});

export const insertEducationOfferSchema = createInsertSchema(educationOffers).pick({
  slug: true,
  title: true,
  description: true,
  provider: true,
  category: true,
  offerType: true,
  originalPrice: true,
  salePrice: true,
  discountPercent: true,
  affiliateUrl: true,
  trackingUrl: true,
  commissionRate: true,
  targetArchetype: true,
  tags: true,
  thumbnailUrl: true,
  rating: true,
  reviewCount: true,
  startDate: true,
  endDate: true,
  isFeatured: true,
});

// Type exports
export type InsertEducationArchetype = z.infer<typeof insertEducationArchetypeSchema>;
export type InsertEducationContent = z.infer<typeof insertEducationContentSchema>;
export type InsertEducationQuiz = z.infer<typeof insertEducationQuizSchema>;
export type InsertEducationOffer = z.infer<typeof insertEducationOfferSchema>;

export type EducationArchetype = typeof educationArchetypes.$inferSelect;
export type EducationContent = typeof educationContent.$inferSelect;
export type EducationQuiz = typeof educationQuizzes.$inferSelect;
export type EducationOffer = typeof educationOffers.$inferSelect;
export type EducationProgress = typeof educationProgress.$inferSelect;
export type EducationGamification = typeof educationGamification.$inferSelect;