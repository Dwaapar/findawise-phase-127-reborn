import { Router } from "express";
import { z } from "zod";
import type { DatabaseStorage } from "../storage";
import {
  insertTravelDestinationSchema,
  insertTravelArticleSchema,
  insertTravelArchetypeSchema,
  insertTravelQuizQuestionSchema,
  insertTravelQuizResultSchema,
  insertTravelOfferSchema,
  insertTravelItinerarySchema,
  insertTravelToolSchema,
  insertTravelUserSessionSchema,
  insertTravelContentSourceSchema,
  insertTravelAnalyticsEventSchema,
} from "@shared/schema";

export function createTravelRoutes(storage: DatabaseStorage) {
  const router = Router();

  // === DESTINATION ROUTES ===
  
  // Get all destinations with filtering
  router.get("/destinations", async (req, res) => {
    try {
      const {
        continent,
        country,
        budgetRange,
        tags,
        trending,
        limit = "50",
        offset = "0"
      } = req.query;

      const filters = {
        continent: continent as string,
        country: country as string,
        budgetRange: budgetRange as string,
        tags: tags ? (tags as string).split(",") : undefined,
        trending: trending === "true",
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };

      const destinations = await storage.getTravelDestinations(filters);
      res.json({ success: true, data: destinations });
    } catch (error) {
      console.error("Error fetching destinations:", error);
      res.status(500).json({ success: false, error: "Failed to fetch destinations" });
    }
  });

  // Get single destination by slug
  router.get("/destinations/:slug", async (req, res) => {
    try {
      const destination = await storage.getTravelDestinationBySlug(req.params.slug);
      if (!destination) {
        return res.status(404).json({ success: false, error: "Destination not found" });
      }
      res.json({ success: true, data: destination });
    } catch (error) {
      console.error("Error fetching destination:", error);
      res.status(500).json({ success: false, error: "Failed to fetch destination" });
    }
  });

  // Create new destination
  router.post("/destinations", async (req, res) => {
    try {
      const validatedData = insertTravelDestinationSchema.parse(req.body);
      const destination = await storage.createTravelDestination(validatedData);
      res.status(201).json({ success: true, data: destination });
    } catch (error) {
      console.error("Error creating destination:", error);
      res.status(500).json({ success: false, error: "Failed to create destination" });
    }
  });

  // === ARTICLE ROUTES ===
  
  // Get all articles with filtering
  router.get("/articles", async (req, res) => {
    try {
      const {
        tags,
        archetype,
        destination,
        published = "true",
        limit = "20",
        offset = "0"
      } = req.query;

      const filters = {
        tags: tags ? (tags as string).split(",") : undefined,
        archetype: archetype as string,
        destination: destination as string,
        published: published === "true",
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };

      const articles = await storage.getTravelArticles(filters);
      res.json({ success: true, data: articles });
    } catch (error) {
      console.error("Error fetching articles:", error);
      res.status(500).json({ success: false, error: "Failed to fetch articles" });
    }
  });

  // Get single article by slug
  router.get("/articles/:slug", async (req, res) => {
    try {
      const article = await storage.getTravelArticleBySlug(req.params.slug);
      if (!article) {
        return res.status(404).json({ success: false, error: "Article not found" });
      }
      
      // Increment view count
      await storage.incrementTravelArticleViews(article.id);
      
      res.json({ success: true, data: article });
    } catch (error) {
      console.error("Error fetching article:", error);
      res.status(500).json({ success: false, error: "Failed to fetch article" });
    }
  });

  // Create new article
  router.post("/articles", async (req, res) => {
    try {
      const validatedData = insertTravelArticleSchema.parse(req.body);
      const article = await storage.createTravelArticle(validatedData);
      res.status(201).json({ success: true, data: article });
    } catch (error) {
      console.error("Error creating article:", error);
      res.status(500).json({ success: false, error: "Failed to create article" });
    }
  });

  // === ARCHETYPE ROUTES ===
  
  // Get all archetypes
  router.get("/archetypes", async (req, res) => {
    try {
      const archetypes = await storage.getTravelArchetypes();
      res.json({ success: true, data: archetypes });
    } catch (error) {
      console.error("Error fetching archetypes:", error);
      res.status(500).json({ success: false, error: "Failed to fetch archetypes" });
    }
  });

  // Get archetype by slug
  router.get("/archetypes/:slug", async (req, res) => {
    try {
      const archetype = await storage.getTravelArchetypeBySlug(req.params.slug);
      if (!archetype) {
        return res.status(404).json({ success: false, error: "Archetype not found" });
      }
      res.json({ success: true, data: archetype });
    } catch (error) {
      console.error("Error fetching archetype:", error);
      res.status(500).json({ success: false, error: "Failed to fetch archetype" });
    }
  });

  // Create new archetype
  router.post("/archetypes", async (req, res) => {
    try {
      const validatedData = insertTravelArchetypeSchema.parse(req.body);
      const archetype = await storage.createTravelArchetype(validatedData);
      res.status(201).json({ success: true, data: archetype });
    } catch (error) {
      console.error("Error creating archetype:", error);
      res.status(500).json({ success: false, error: "Failed to create archetype" });
    }
  });

  // === QUIZ ROUTES ===
  
  // Get quiz questions by type
  router.get("/quiz/:type/questions", async (req, res) => {
    try {
      const questions = await storage.getTravelQuizQuestions(req.params.type);
      res.json({ success: true, data: questions });
    } catch (error) {
      console.error("Error fetching quiz questions:", error);
      res.status(500).json({ success: false, error: "Failed to fetch quiz questions" });
    }
  });

  // Submit quiz answers
  router.post("/quiz/:type/submit", async (req, res) => {
    try {
      const { sessionId, answers } = req.body;
      
      if (!sessionId || !answers) {
        return res.status(400).json({ success: false, error: "Session ID and answers required" });
      }

      // Process quiz and determine result
      const result = await storage.processTravelQuiz(req.params.type, sessionId, answers);
      
      res.json({ success: true, data: result });
    } catch (error) {
      console.error("Error processing quiz:", error);
      res.status(500).json({ success: false, error: "Failed to process quiz" });
    }
  });

  // Get quiz results for session
  router.get("/quiz/results/:sessionId", async (req, res) => {
    try {
      const results = await storage.getTravelQuizResults(req.params.sessionId);
      res.json({ success: true, data: results });
    } catch (error) {
      console.error("Error fetching quiz results:", error);
      res.status(500).json({ success: false, error: "Failed to fetch quiz results" });
    }
  });

  // === OFFER ROUTES ===
  
  // Get offers with filtering
  router.get("/offers", async (req, res) => {
    try {
      const {
        type,
        destination,
        archetype,
        priceMax,
        provider,
        active = "true",
        limit = "20",
        offset = "0"
      } = req.query;

      const filters = {
        type: type as string,
        destination: destination ? parseInt(destination as string) : undefined,
        archetype: archetype as string,
        priceMax: priceMax ? parseFloat(priceMax as string) : undefined,
        provider: provider as string,
        active: active === "true",
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };

      const offers = await storage.getTravelOffers(filters);
      res.json({ success: true, data: offers });
    } catch (error) {
      console.error("Error fetching offers:", error);
      res.status(500).json({ success: false, error: "Failed to fetch offers" });
    }
  });

  // Track offer click
  router.post("/offers/:id/click", async (req, res) => {
    try {
      const { sessionId, userId } = req.body;
      
      await storage.trackTravelOfferClick(parseInt(req.params.id), sessionId, userId);
      
      // Get the offer to return affiliate URL
      const offer = await storage.getTravelOfferById(parseInt(req.params.id));
      if (!offer) {
        return res.status(404).json({ success: false, error: "Offer not found" });
      }

      res.json({ 
        success: true, 
        data: { 
          redirectUrl: offer.affiliateUrl,
          offerId: offer.id 
        } 
      });
    } catch (error) {
      console.error("Error tracking offer click:", error);
      res.status(500).json({ success: false, error: "Failed to track offer click" });
    }
  });

  // Create new offer
  router.post("/offers", async (req, res) => {
    try {
      const validatedData = insertTravelOfferSchema.parse(req.body);
      const offer = await storage.createTravelOffer(validatedData);
      res.status(201).json({ success: true, data: offer });
    } catch (error) {
      console.error("Error creating offer:", error);
      res.status(500).json({ success: false, error: "Failed to create offer" });
    }
  });

  // === ITINERARY ROUTES ===
  
  // Get itineraries with filtering
  router.get("/itineraries", async (req, res) => {
    try {
      const {
        destination,
        duration,
        budget,
        archetype,
        difficulty,
        limit = "20",
        offset = "0"
      } = req.query;

      const filters = {
        destination: destination as string,
        duration: duration ? parseInt(duration as string) : undefined,
        budget: budget as string,
        archetype: archetype as string,
        difficulty: difficulty as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };

      const itineraries = await storage.getTravelItineraries(filters);
      res.json({ success: true, data: itineraries });
    } catch (error) {
      console.error("Error fetching itineraries:", error);
      res.status(500).json({ success: false, error: "Failed to fetch itineraries" });
    }
  });

  // Get single itinerary by slug
  router.get("/itineraries/:slug", async (req, res) => {
    try {
      const itinerary = await storage.getTravelItineraryBySlug(req.params.slug);
      if (!itinerary) {
        return res.status(404).json({ success: false, error: "Itinerary not found" });
      }
      
      // Increment view count
      await storage.incrementTravelItineraryViews(itinerary.id);
      
      res.json({ success: true, data: itinerary });
    } catch (error) {
      console.error("Error fetching itinerary:", error);
      res.status(500).json({ success: false, error: "Failed to fetch itinerary" });
    }
  });

  // Save itinerary to user wishlist
  router.post("/itineraries/:id/save", async (req, res) => {
    try {
      const { sessionId, userId } = req.body;
      
      await storage.saveTravelItinerary(parseInt(req.params.id), sessionId, userId);
      
      res.json({ success: true, message: "Itinerary saved to wishlist" });
    } catch (error) {
      console.error("Error saving itinerary:", error);
      res.status(500).json({ success: false, error: "Failed to save itinerary" });
    }
  });

  // === TOOL ROUTES ===
  
  // Get all travel tools
  router.get("/tools", async (req, res) => {
    try {
      const tools = await storage.getTravelTools();
      res.json({ success: true, data: tools });
    } catch (error) {
      console.error("Error fetching tools:", error);
      res.status(500).json({ success: false, error: "Failed to fetch tools" });
    }
  });

  // Get tool by slug
  router.get("/tools/:slug", async (req, res) => {
    try {
      const tool = await storage.getTravelToolBySlug(req.params.slug);
      if (!tool) {
        return res.status(404).json({ success: false, error: "Tool not found" });
      }
      res.json({ success: true, data: tool });
    } catch (error) {
      console.error("Error fetching tool:", error);
      res.status(500).json({ success: false, error: "Failed to fetch tool" });
    }
  });

  // === USER SESSION ROUTES ===
  
  // Get or create user session
  router.post("/session", async (req, res) => {
    try {
      const validatedData = insertTravelUserSessionSchema.parse(req.body);
      const session = await storage.getTravelUserSession(validatedData.sessionId) ||
                     await storage.createTravelUserSession(validatedData);
      res.json({ success: true, data: session });
    } catch (error) {
      console.error("Error handling user session:", error);
      res.status(500).json({ success: false, error: "Failed to handle user session" });
    }
  });

  // Update user preferences
  router.patch("/session/:sessionId/preferences", async (req, res) => {
    try {
      const { preferences } = req.body;
      
      await storage.updateTravelUserSessionPreferences(req.params.sessionId, preferences);
      
      res.json({ success: true, message: "Preferences updated" });
    } catch (error) {
      console.error("Error updating preferences:", error);
      res.status(500).json({ success: false, error: "Failed to update preferences" });
    }
  });

  // Add to wishlist
  router.post("/session/:sessionId/wishlist", async (req, res) => {
    try {
      const { itemType, itemId } = req.body;
      
      await storage.addToTravelWishlist(req.params.sessionId, itemType, itemId);
      
      res.json({ success: true, message: "Added to wishlist" });
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      res.status(500).json({ success: false, error: "Failed to add to wishlist" });
    }
  });

  // === ANALYTICS ROUTES ===
  
  // Track analytics event
  router.post("/analytics/events", async (req, res) => {
    try {
      const validatedData = insertTravelAnalyticsEventSchema.parse(req.body);
      await storage.createTravelAnalyticsEvent(validatedData);
      res.json({ success: true, message: "Event tracked" });
    } catch (error) {
      console.error("Error tracking analytics event:", error);
      res.status(500).json({ success: false, error: "Failed to track event" });
    }
  });

  // Get analytics overview
  router.get("/analytics/overview", async (req, res) => {
    try {
      const { days = "30" } = req.query;
      const overview = await storage.getTravelAnalyticsOverview(parseInt(days as string));
      res.json({ success: true, data: overview });
    } catch (error) {
      console.error("Error fetching analytics overview:", error);
      res.status(500).json({ success: false, error: "Failed to fetch analytics overview" });
    }
  });

  // Get popular destinations
  router.get("/analytics/destinations/popular", async (req, res) => {
    try {
      const { days = "30", limit = "10" } = req.query;
      const destinations = await storage.getPopularTravelDestinations(
        parseInt(days as string),
        parseInt(limit as string)
      );
      res.json({ success: true, data: destinations });
    } catch (error) {
      console.error("Error fetching popular destinations:", error);
      res.status(500).json({ success: false, error: "Failed to fetch popular destinations" });
    }
  });

  // === SEARCH ROUTES ===
  
  // Global search
  router.get("/search", async (req, res) => {
    try {
      const { q, type, limit = "20" } = req.query;
      
      if (!q) {
        return res.status(400).json({ success: false, error: "Search query required" });
      }

      const results = await storage.searchTravelContent(
        q as string,
        type as string,
        parseInt(limit as string)
      );
      
      res.json({ success: true, data: results });
    } catch (error) {
      console.error("Error searching travel content:", error);
      res.status(500).json({ success: false, error: "Failed to search content" });
    }
  });

  // === FEDERATION OS ROUTES ===
  
  // Neuron registration (called on boot)
  router.post("/neuron/register", async (req, res) => {
    try {
      const neuronData = {
        name: "neuron-travel",
        url: process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost:5000",
        type: "travel",
        features: [
          "destination-discovery",
          "ai-personalization", 
          "travel-quizzes",
          "itinerary-builder",
          "affiliate-offers",
          "content-scraping",
          "analytics-tracking"
        ],
        slug: "travel",
        apiKey: process.env.FEDERATION_API_KEY || "dev-key"
      };

      // Register with Federation OS (if endpoint exists)
      try {
        const response = await fetch(`${process.env.FEDERATION_URL || 'http://localhost:5000'}/api/neuron/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.FEDERATION_API_KEY}`
          },
          body: JSON.stringify(neuronData)
        });
        
        if (response.ok) {
          console.log("✅ Travel neuron registered with Federation OS");
        }
      } catch (error) {
        console.log("⚠️ Federation OS not available, running in standalone mode");
      }

      res.json({ success: true, data: neuronData });
    } catch (error) {
      console.error("Error registering travel neuron:", error);
      res.status(500).json({ success: false, error: "Failed to register neuron" });
    }
  });

  // Neuron status heartbeat
  router.post("/neuron/status", async (req, res) => {
    try {
      const status = {
        uptime: process.uptime(),
        analytics: {
          destinations: await storage.getTravelDestinationsCount(),
          articles: await storage.getTravelArticlesCount(),
          offers: await storage.getTravelOffersCount(),
          sessions: await storage.getTravelActiveSessionsCount()
        },
        heartbeat: new Date().toISOString(),
        meta: {
          version: "1.0.0",
          features_active: 7,
          last_scrape: new Date().toISOString()
        }
      };

      // Send status to Federation OS (if available)
      try {
        await fetch(`${process.env.FEDERATION_URL || 'http://localhost:5000'}/api/neuron/status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.FEDERATION_API_KEY}`
          },
          body: JSON.stringify({ slug: "travel", ...status })
        });
      } catch (error) {
        // Federation OS not available, continue silently
      }

      res.json({ success: true, data: status });
    } catch (error) {
      console.error("Error getting travel neuron status:", error);
      res.status(500).json({ success: false, error: "Failed to get neuron status" });
    }
  });

  return router;
}