import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Travel Destinations table
export const travelDestinations = pgTable("travel_destinations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  country: text("country").notNull(),
  continent: text("continent").notNull(),
  description: text("description"),
  shortDescription: text("short_description"),
  coordinates: jsonb("coordinates"), // {lat, lng}
  featuredImage: text("featured_image"),
  gallery: jsonb("gallery"), // array of image URLs
  bestTime: text("best_time"),
  budgetRange: varchar("budget_range", { length: 50 }), // budget, mid, luxury
  travelTime: text("travel_time"), // recommended days
  tags: jsonb("tags"), // adventure, beach, culture, etc.
  visaRequirements: text("visa_requirements"),
  currency: varchar("currency", { length: 10 }),
  language: text("language"),
  timezone: varchar("timezone", { length: 50 }),
  safetyRating: integer("safety_rating").default(5), // 1-10
  popularityScore: integer("popularity_score").default(0),
  isHidden: boolean("is_hidden").default(false),
  isTrending: boolean("is_trending").default(false),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  keywords: jsonb("keywords"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Travel Articles table
export const travelArticles = pgTable("travel_articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  featuredImage: text("featured_image"),
  author: text("author").default("Travel Expert"),
  readTime: integer("read_time").default(5), // minutes
  tags: jsonb("tags"),
  destinations: jsonb("destinations"), // related destination IDs
  archetypes: jsonb("archetypes"), // target user archetypes
  isPublished: boolean("is_published").default(false),
  publishedAt: timestamp("published_at"),
  views: integer("views").default(0),
  likes: integer("likes").default(0),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  keywords: jsonb("keywords"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Travel User Archetypes table
export const travelArchetypes = pgTable("travel_archetypes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  characteristics: jsonb("characteristics"), // personality traits
  preferredDestinations: jsonb("preferred_destinations"), // destination types
  budgetRange: varchar("budget_range", { length: 50 }),
  travelStyle: varchar("travel_style", { length: 50 }),
  themeColors: jsonb("theme_colors"), // UI color scheme
  icon: text("icon"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Travel Quiz Questions table
export const travelQuizQuestions = pgTable("travel_quiz_questions", {
  id: serial("id").primaryKey(),
  quizType: varchar("quiz_type", { length: 100 }).notNull(), // destination, archetype, budget
  question: text("question").notNull(),
  options: jsonb("options").notNull(), // array of {text, value, archetype_weight}
  order: integer("order").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Travel Quiz Results table
export const travelQuizResults = pgTable("travel_quiz_results", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  quizType: varchar("quiz_type", { length: 100 }).notNull(),
  answers: jsonb("answers").notNull(), // array of {questionId, answer}
  result: jsonb("result").notNull(), // archetype or destination recommendation
  archetypeId: integer("archetype_id"),
  destinationIds: jsonb("destination_ids"), // recommended destinations
  confidence: decimal("confidence", { precision: 3, scale: 2 }).default("0.00"), // 0.00 to 1.00
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  userId: varchar("user_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Travel Offers table (Affiliate Integration)
export const travelOffers = pgTable("travel_offers", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  offerType: varchar("offer_type", { length: 50 }).notNull(), // flight, hotel, activity, package
  provider: text("provider").notNull(), // Skyscanner, Booking, etc.
  originalUrl: text("original_url").notNull(),
  affiliateUrl: text("affiliate_url").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 10 }).default("USD"),
  discount: integer("discount"), // percentage
  validFrom: timestamp("valid_from"),
  validTo: timestamp("valid_to"),
  destinationId: integer("destination_id"),
  archetypes: jsonb("archetypes"), // target archetypes
  tags: jsonb("tags"),
  image: text("image"),
  priority: integer("priority").default(0),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Travel Itineraries table
export const travelItineraries = pgTable("travel_itineraries", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  destinations: jsonb("destinations").notNull(), // array of destination objects
  duration: integer("duration").notNull(), // days
  budget: jsonb("budget"), // {min, max, currency}
  activities: jsonb("activities"), // day-by-day activities
  tips: jsonb("tips"), // travel tips
  archetypes: jsonb("archetypes"), // suitable for archetypes
  difficulty: varchar("difficulty", { length: 20 }).default("easy"), // easy, moderate, hard
  season: varchar("season", { length: 20 }), // best season
  featuredImage: text("featured_image"),
  gallery: jsonb("gallery"),
  isPublic: boolean("is_public").default(true),
  likes: integer("likes").default(0),
  saves: integer("saves").default(0),
  views: integer("views").default(0),
  authorId: varchar("author_id", { length: 255 }),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Travel Tools table
export const travelTools = pgTable("travel_tools", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  toolType: varchar("tool_type", { length: 50 }).notNull(), // budget, packing, visa, etc.
  config: jsonb("config"), // tool-specific configuration
  isActive: boolean("is_active").default(true),
  order: integer("order").default(0),
  icon: text("icon"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Travel User Sessions table
export const travelUserSessions = pgTable("travel_user_sessions", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }).notNull().unique(),
  userId: varchar("user_id", { length: 255 }),
  archetypeId: integer("archetype_id"),
  preferences: jsonb("preferences"), // travel preferences
  wishlist: jsonb("wishlist"), // saved destinations/itineraries
  searchHistory: jsonb("search_history"),
  clickedOffers: jsonb("clicked_offers"),
  quizResults: jsonb("quiz_results"),
  deviceInfo: jsonb("device_info"),
  location: jsonb("location"),
  isActive: boolean("is_active").default(true),
  lastActivity: timestamp("last_activity").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Travel Content Sources table (for scraping)
export const travelContentSources = pgTable("travel_content_sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  sourceType: varchar("source_type", { length: 50 }).notNull(), // blog, api, social
  selectors: jsonb("selectors"), // CSS selectors for scraping
  lastScraped: timestamp("last_scraped"),
  scrapingEnabled: boolean("scraping_enabled").default(true),
  priority: integer("priority").default(0),
  tags: jsonb("tags"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Travel Analytics Events table
export const travelAnalyticsEvents = pgTable("travel_analytics_events", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  eventData: jsonb("event_data"),
  destinationId: integer("destination_id"),
  offerId: integer("offer_id"),
  archetypeId: integer("archetype_id"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  userId: varchar("user_id", { length: 255 }),
  pageSlug: varchar("page_slug", { length: 255 }),
  referrer: text("referrer"),
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod schemas for validation
export const insertTravelDestinationSchema = createInsertSchema(travelDestinations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTravelArticleSchema = createInsertSchema(travelArticles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTravelArchetypeSchema = createInsertSchema(travelArchetypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTravelQuizQuestionSchema = createInsertSchema(travelQuizQuestions).omit({
  id: true,
  createdAt: true,
});

export const insertTravelQuizResultSchema = createInsertSchema(travelQuizResults).omit({
  id: true,
  createdAt: true,
});

export const insertTravelOfferSchema = createInsertSchema(travelOffers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTravelItinerarySchema = createInsertSchema(travelItineraries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTravelToolSchema = createInsertSchema(travelTools).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTravelUserSessionSchema = createInsertSchema(travelUserSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTravelContentSourceSchema = createInsertSchema(travelContentSources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTravelAnalyticsEventSchema = createInsertSchema(travelAnalyticsEvents).omit({
  id: true,
  createdAt: true,
});

// Type exports
export type TravelDestination = typeof travelDestinations.$inferSelect;
export type InsertTravelDestination = z.infer<typeof insertTravelDestinationSchema>;

export type TravelArticle = typeof travelArticles.$inferSelect;
export type InsertTravelArticle = z.infer<typeof insertTravelArticleSchema>;

export type TravelArchetype = typeof travelArchetypes.$inferSelect;
export type InsertTravelArchetype = z.infer<typeof insertTravelArchetypeSchema>;

export type TravelQuizQuestion = typeof travelQuizQuestions.$inferSelect;
export type InsertTravelQuizQuestion = z.infer<typeof insertTravelQuizQuestionSchema>;

export type TravelQuizResult = typeof travelQuizResults.$inferSelect;
export type InsertTravelQuizResult = z.infer<typeof insertTravelQuizResultSchema>;

export type TravelOffer = typeof travelOffers.$inferSelect;
export type InsertTravelOffer = z.infer<typeof insertTravelOfferSchema>;

export type TravelItinerary = typeof travelItineraries.$inferSelect;
export type InsertTravelItinerary = z.infer<typeof insertTravelItinerarySchema>;

export type TravelTool = typeof travelTools.$inferSelect;
export type InsertTravelTool = z.infer<typeof insertTravelToolSchema>;

export type TravelUserSession = typeof travelUserSessions.$inferSelect;
export type InsertTravelUserSession = z.infer<typeof insertTravelUserSessionSchema>;

export type TravelContentSource = typeof travelContentSources.$inferSelect;
export type InsertTravelContentSource = z.infer<typeof insertTravelContentSourceSchema>;

export type TravelAnalyticsEvent = typeof travelAnalyticsEvents.$inferSelect;
export type InsertTravelAnalyticsEvent = z.infer<typeof insertTravelAnalyticsEventSchema>;