import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { insertSaasToolSchema, insertSaasCategorySchema, insertSaasStackSchema, insertSaasReviewSchema, insertSaasComparisonSchema, insertSaasDealSchema, insertSaasQuizResultSchema, insertSaasCalculatorResultSchema, insertSaasContentSchema } from "@shared/schema";

export const saasRouter = Router();

// SaaS Tools endpoints
saasRouter.get("/tools", async (req, res) => {
  try {
    const { category, search, featured, limit = 20, page = 1 } = req.query;
    const tools = await storage.getSaaSTools({
      category: category as string,
      search: search as string,
      featured: featured === "true",
      limit: parseInt(limit as string),
      offset: (parseInt(page as string) - 1) * parseInt(limit as string)
    });
    res.json({ success: true, data: tools });
  } catch (error) {
    console.error("Failed to get SaaS tools:", error);
    res.status(500).json({ success: false, error: "Failed to get SaaS tools" });
  }
});

saasRouter.get("/tools/featured", async (req, res) => {
  try {
    const tools = await storage.getFeaturedSaaSTools(6);
    res.json({ success: true, data: tools });
  } catch (error) {
    console.error("Failed to get featured tools:", error);
    res.status(500).json({ success: false, error: "Failed to get featured tools" });
  }
});

saasRouter.get("/tools/:id", async (req, res) => {
  try {
    const tool = await storage.getSaasToolById(parseInt(req.params.id));
    if (!tool) {
      return res.status(404).json({ success: false, error: "Tool not found" });
    }
    res.json({ success: true, data: tool });
  } catch (error) {
    console.error("Failed to get SaaS tool:", error);
    res.status(500).json({ success: false, error: "Failed to get SaaS tool" });
  }
});

saasRouter.post("/tools", async (req, res) => {
  try {
    const validatedData = insertSaasToolSchema.parse(req.body);
    const tool = await storage.createSaaSTool(validatedData);
    res.json({ success: true, data: tool });
  } catch (error) {
    console.error("Failed to create SaaS tool:", error);
    res.status(500).json({ success: false, error: "Failed to create SaaS tool" });
  }
});

// SaaS Categories endpoints
saasRouter.get("/categories", async (req, res) => {
  try {
    const categories = await storage.getSaaSCategories();
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error("Failed to get SaaS categories:", error);
    res.status(500).json({ success: false, error: "Failed to get SaaS categories" });
  }
});

saasRouter.post("/categories", async (req, res) => {
  try {
    const validatedData = insertSaasCategorySchema.parse(req.body);
    const category = await storage.createSaaSCategory(validatedData);
    res.json({ success: true, data: category });
  } catch (error) {
    console.error("Failed to create SaaS category:", error);
    res.status(500).json({ success: false, error: "Failed to create SaaS category" });
  }
});

// SaaS Stacks endpoints
saasRouter.get("/stacks", async (req, res) => {
  try {
    const { sessionId, userId, isPublic } = req.query;
    const stacks = await storage.getSaaSStacks({
      sessionId: sessionId as string,
      userId: userId as string,
      isPublic: isPublic === "true"
    });
    res.json({ success: true, data: stacks });
  } catch (error) {
    console.error("Failed to get SaaS stacks:", error);
    res.status(500).json({ success: false, error: "Failed to get SaaS stacks" });
  }
});

saasRouter.post("/stacks", async (req, res) => {
  try {
    const validatedData = insertSaasStackSchema.parse(req.body);
    const stack = await storage.createSaaSStack(validatedData);
    res.json({ success: true, data: stack });
  } catch (error) {
    console.error("Failed to create SaaS stack:", error);
    res.status(500).json({ success: false, error: "Failed to create SaaS stack" });
  }
});

saasRouter.get("/stacks/:id", async (req, res) => {
  try {
    const stack = await storage.getSaasStackById(parseInt(req.params.id));
    if (!stack) {
      return res.status(404).json({ success: false, error: "Stack not found" });
    }
    res.json({ success: true, data: stack });
  } catch (error) {
    console.error("Failed to get SaaS stack:", error);
    res.status(500).json({ success: false, error: "Failed to get SaaS stack" });
  }
});

// SaaS Reviews endpoints
saasRouter.get("/reviews", async (req, res) => {
  try {
    const { toolId, limit = 10, page = 1 } = req.query;
    const reviews = await storage.getSaaSReviews({
      toolId: toolId ? parseInt(toolId as string) : undefined,
      limit: parseInt(limit as string),
      offset: (parseInt(page as string) - 1) * parseInt(limit as string)
    });
    res.json({ success: true, data: reviews });
  } catch (error) {
    console.error("Failed to get SaaS reviews:", error);
    res.status(500).json({ success: false, error: "Failed to get SaaS reviews" });
  }
});

saasRouter.post("/reviews", async (req, res) => {
  try {
    const validatedData = insertSaasReviewSchema.parse(req.body);
    const review = await storage.createSaaSReview(validatedData);
    res.json({ success: true, data: review });
  } catch (error) {
    console.error("Failed to create SaaS review:", error);
    res.status(500).json({ success: false, error: "Failed to create SaaS review" });
  }
});

// SaaS Comparisons endpoints
saasRouter.get("/comparisons", async (req, res) => {
  try {
    const { category, limit = 10 } = req.query;
    const comparisons = await storage.getSaaSComparisons({
      category: category as string,
      limit: parseInt(limit as string)
    });
    res.json({ success: true, data: comparisons });
  } catch (error) {
    console.error("Failed to get SaaS comparisons:", error);
    res.status(500).json({ success: false, error: "Failed to get SaaS comparisons" });
  }
});

saasRouter.get("/comparisons/:slug", async (req, res) => {
  try {
    const comparison = await storage.getSaasComparisonBySlug(req.params.slug);
    if (!comparison) {
      return res.status(404).json({ success: false, error: "Comparison not found" });
    }
    res.json({ success: true, data: comparison });
  } catch (error) {
    console.error("Failed to get SaaS comparison:", error);
    res.status(500).json({ success: false, error: "Failed to get SaaS comparison" });
  }
});

saasRouter.post("/comparisons", async (req, res) => {
  try {
    const validatedData = insertSaasComparisonSchema.parse(req.body);
    const comparison = await storage.createSaaSComparison(validatedData);
    res.json({ success: true, data: comparison });
  } catch (error) {
    console.error("Failed to create SaaS comparison:", error);
    res.status(500).json({ success: false, error: "Failed to create SaaS comparison" });
  }
});

saasRouter.post("/comparisons/:id/vote", async (req, res) => {
  try {
    const { choice } = req.body; // "A" or "B"
    const comparisonId = parseInt(req.params.id);
    
    if (!["A", "B"].includes(choice)) {
      return res.status(400).json({ success: false, error: "Invalid choice" });
    }

    const result = await storage.voteSaaSComparison(comparisonId, choice);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Failed to vote on comparison:", error);
    res.status(500).json({ success: false, error: "Failed to vote on comparison" });
  }
});

// SaaS Deals endpoints
saasRouter.get("/deals", async (req, res) => {
  try {
    const { active = true, featured, toolId, limit = 20 } = req.query;
    const deals = await storage.getSaaSDeals({
      active: active === "true",
      featured: featured === "true",
      toolId: toolId ? parseInt(toolId as string) : undefined,
      limit: parseInt(limit as string)
    });
    res.json({ success: true, data: deals });
  } catch (error) {
    console.error("Failed to get SaaS deals:", error);
    res.status(500).json({ success: false, error: "Failed to get SaaS deals" });
  }
});

saasRouter.get("/deals/active", async (req, res) => {
  try {
    const deals = await storage.getActiveSaaSDeals();
    res.json({ success: true, data: deals });
  } catch (error) {
    console.error("Failed to get active deals:", error);
    res.status(500).json({ success: false, error: "Failed to get active deals" });
  }
});

saasRouter.post("/deals", async (req, res) => {
  try {
    const validatedData = insertSaasDealSchema.parse(req.body);
    const deal = await storage.createSaaSDeal(validatedData);
    res.json({ success: true, data: deal });
  } catch (error) {
    console.error("Failed to create SaaS deal:", error);
    res.status(500).json({ success: false, error: "Failed to create SaaS deal" });
  }
});

saasRouter.post("/deals/:id/click", async (req, res) => {
  try {
    const dealId = parseInt(req.params.id);
    const { sessionId, userId, userAgent, ipAddress } = req.body;
    
    const result = await storage.trackSaaSDealClick(dealId, {
      sessionId,
      userId,
      userAgent,
      ipAddress
    });
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Failed to track deal click:", error);
    res.status(500).json({ success: false, error: "Failed to track deal click" });
  }
});

// SaaS Quiz endpoints
saasRouter.post("/quiz/results", async (req, res) => {
  try {
    const validatedData = insertSaasQuizResultSchema.parse(req.body);
    const result = await storage.saveSaaSQuizResult(validatedData);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Failed to save quiz result:", error);
    res.status(500).json({ success: false, error: "Failed to save quiz result" });
  }
});

saasRouter.get("/quiz/recommendations", async (req, res) => {
  try {
    const { persona, budget, priorities } = req.query;
    const recommendations = await storage.getSaaSRecommendations({
      persona: persona as string,
      budget: budget ? JSON.parse(budget as string) : undefined,
      priorities: priorities ? JSON.parse(priorities as string) : undefined
    });
    res.json({ success: true, data: recommendations });
  } catch (error) {
    console.error("Failed to get recommendations:", error);
    res.status(500).json({ success: false, error: "Failed to get recommendations" });
  }
});

// SaaS Calculator endpoints
saasRouter.post("/calculator/results", async (req, res) => {
  try {
    const validatedData = insertSaasCalculatorResultSchema.parse(req.body);
    const result = await storage.saveSaaSCalculatorResult(validatedData);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Failed to save calculator result:", error);
    res.status(500).json({ success: false, error: "Failed to save calculator result" });
  }
});

saasRouter.post("/calculator/roi", async (req, res) => {
  try {
    const { currentCosts, newTools, timeframes, metrics } = req.body;
    
    // ROI calculation logic
    const roiCalculation = {
      currentMonthlyCost: currentCosts?.monthly || 0,
      newMonthlyCost: newTools?.reduce((sum: number, tool: any) => sum + (tool.pricing?.monthly || 0), 0) || 0,
      potentialSavings: 0,
      productivityGains: 0,
      roi: 0,
      paybackPeriod: 0
    };
    
    roiCalculation.potentialSavings = roiCalculation.currentMonthlyCost - roiCalculation.newMonthlyCost;
    roiCalculation.productivityGains = metrics?.productivityIncrease || 0;
    roiCalculation.roi = ((roiCalculation.potentialSavings + roiCalculation.productivityGains) / roiCalculation.newMonthlyCost) * 100;
    roiCalculation.paybackPeriod = roiCalculation.newMonthlyCost / (roiCalculation.potentialSavings + roiCalculation.productivityGains);
    
    res.json({ success: true, data: roiCalculation });
  } catch (error) {
    console.error("Failed to calculate ROI:", error);
    res.status(500).json({ success: false, error: "Failed to calculate ROI" });
  }
});

// SaaS Content endpoints
saasRouter.get("/content", async (req, res) => {
  try {
    const { contentType, category, published = true, limit = 20 } = req.query;
    const content = await storage.getSaaSContent({
      contentType: contentType as string,
      category: category as string,
      published: published === "true",
      limit: parseInt(limit as string)
    });
    res.json({ success: true, data: content });
  } catch (error) {
    console.error("Failed to get SaaS content:", error);
    res.status(500).json({ success: false, error: "Failed to get SaaS content" });
  }
});

saasRouter.get("/content/:slug", async (req, res) => {
  try {
    const content = await storage.getSaasContentBySlug(req.params.slug);
    if (!content) {
      return res.status(404).json({ success: false, error: "Content not found" });
    }
    
    // Increment view count
    await storage.incrementContentViews(content.id);
    
    res.json({ success: true, data: content });
  } catch (error) {
    console.error("Failed to get SaaS content:", error);
    res.status(500).json({ success: false, error: "Failed to get SaaS content" });
  }
});

saasRouter.post("/content", async (req, res) => {
  try {
    const validatedData = insertSaasContentSchema.parse(req.body);
    const content = await storage.createSaaSContent(validatedData);
    res.json({ success: true, data: content });
  } catch (error) {
    console.error("Failed to create SaaS content:", error);
    res.status(500).json({ success: false, error: "Failed to create SaaS content" });
  }
});

// Analytics and Stats endpoints
saasRouter.get("/stats", async (req, res) => {
  try {
    const stats = await storage.getSaaSStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error("Failed to get SaaS stats:", error);
    res.status(500).json({ success: false, error: "Failed to get SaaS stats" });
  }
});

saasRouter.get("/trending", async (req, res) => {
  try {
    const { category, timeframe = "week" } = req.query;
    const trending = await storage.getTrendingSaaSTools({
      category: category as string,
      timeframe: timeframe as string
    });
    res.json({ success: true, data: trending });
  } catch (error) {
    console.error("Failed to get trending tools:", error);
    res.status(500).json({ success: false, error: "Failed to get trending tools" });
  }
});

// Search endpoint
saasRouter.get("/search", async (req, res) => {
  try {
    const { q, type = "all", limit = 10 } = req.query;
    
    if (!q || typeof q !== "string") {
      return res.status(400).json({ success: false, error: "Search query required" });
    }
    
    const results = await storage.searchSaaS({
      query: q,
      type: type as string,
      limit: parseInt(limit as string)
    });
    
    res.json({ success: true, data: results });
  } catch (error) {
    console.error("Failed to search SaaS:", error);
    res.status(500).json({ success: false, error: "Failed to search SaaS" });
  }
});