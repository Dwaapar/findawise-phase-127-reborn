import { semanticGraphEngine } from "./semanticGraphEngine";
import { personalizationEngine } from "./personalizationEngine";
import { autoAuditEngine } from "./autoAuditEngine";
import { vectorEngine } from "./vectorEngine";
import { graphVisualizationEngine } from "./graphVisualizationEngine";
import { intentPropagationEngine } from "./intentPropagationEngine";
import { semanticAutoPopulator } from "./semanticAutoPopulator";

/**
 * Semantic System Initializer - Coordinates startup of all semantic components
 */
export class SemanticInitializer {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log("🧠 Initializing Semantic Intelligence Layer...");
    
    try {
      // Initialize components in order
      await vectorEngine.initialize();
      await semanticGraphEngine.initialize();
      await personalizationEngine.initialize();
      await autoAuditEngine.initialize();
      await graphVisualizationEngine.initialize();
      await intentPropagationEngine.initialize();

      // Check if we need to populate billion-dollar sample data
      await this.ensureBillionDollarData();

      this.initialized = true;
      console.log("✅ Semantic Intelligence Layer initialized successfully");

    } catch (error) {
      console.error("❌ Failed to initialize Semantic Intelligence Layer:", error);
      throw error;
    }
  }

  private async ensureBillionDollarData(): Promise<void> {
    try {
      // Check if we already have semantic nodes
      const existingNodes = await semanticGraphEngine.semanticSearch("test", { topK: 1 });
      
      if (existingNodes.length === 0) {
        console.log("🚀 No semantic data found - populating billion-dollar sample data...");
        
        const result = await semanticAutoPopulator.populateBillionDollarSampleData();
        
        console.log(`✅ Billion-dollar semantic system ready!`);
        console.log(`📊 ${result.nodesCreated} nodes across ${result.verticals.length} verticals`);
        console.log(`🔗 ${result.edgesCreated} high-value connections created`);
        
        // Run initial optimization
        await intentPropagationEngine.runDailyOptimization();
        
      } else {
        console.log("✅ Existing semantic data found - system ready");
      }
    } catch (error) {
      console.error("Error ensuring billion-dollar data:", error);
    }
  }

  private async seedInitialData(): Promise<void> {
    try {
      // Create sample semantic nodes for demonstration
      const sampleNodes = [
        {
          slug: "ai-tools-hub",
          nodeType: "page",
          title: "AI Tools Hub - Comprehensive Directory",
          description: "Discover the best AI tools for productivity, content creation, and business automation",
          content: "A curated collection of AI tools including ChatGPT, Midjourney, Notion AI, and hundreds more. Compare features, pricing, and user reviews.",
          verticalId: "ai-tools",
          neuronId: "neuron-ai-tools",
          metadata: {
            niche: "artificial intelligence",
            emotion: "productive",
            category: "directory"
          }
        },
        {
          slug: "productivity-quiz",
          nodeType: "quiz",
          title: "What's Your Productivity Archetype?",
          description: "Discover your unique productivity style and get personalized tool recommendations",
          content: "Take this 5-minute quiz to understand how you work best and get AI-powered recommendations for tools that match your style.",
          verticalId: "ai-tools",
          neuronId: "neuron-ai-tools",
          metadata: {
            niche: "productivity",
            emotion: "curious",
            category: "assessment"
          }
        },
        {
          slug: "notion-ai-review",
          nodeType: "blog_post",
          title: "Notion AI Review: Is It Worth the Hype?",
          description: "In-depth review of Notion AI features, pricing, and real-world performance",
          content: "After 30 days of testing Notion AI, here's our honest review covering writing assistance, summarization, and workflow automation features.",
          verticalId: "ai-tools",
          neuronId: "neuron-ai-tools",
          metadata: {
            niche: "productivity tools",
            emotion: "analytical",
            category: "review"
          }
        },
        {
          slug: "ai-writing-course-offer",
          nodeType: "offer",
          title: "Master AI Writing in 7 Days",
          description: "Transform your content creation with AI-powered writing techniques",
          content: "Learn to create compelling content 10x faster using ChatGPT, Jasper, and Copy.ai. Includes templates, prompts, and live coaching.",
          verticalId: "ai-tools",
          neuronId: "neuron-ai-tools",
          metadata: {
            niche: "ai writing",
            emotion: "aspirational",
            category: "course",
            price: "$197"
          }
        },
        {
          slug: "saas-directory-main",
          nodeType: "page",
          title: "Best SaaS Tools 2025 - Complete Directory",
          description: "Find and compare the best SaaS tools for your business needs",
          content: "Comprehensive directory of SaaS tools covering CRM, marketing, productivity, development, and more. Expert reviews and comparisons.",
          verticalId: "saas",
          neuronId: "neuron-saas",
          metadata: {
            niche: "software",
            emotion: "professional",
            category: "directory"
          }
        },
        {
          slug: "business-growth-quiz",
          nodeType: "quiz", 
          title: "What's Your Business Growth Stage?",
          description: "Identify your business stage and get tailored SaaS recommendations",
          content: "Understanding your business growth stage helps you choose the right tools. Take this quiz to get personalized SaaS recommendations.",
          verticalId: "saas",
          neuronId: "neuron-saas",
          metadata: {
            niche: "business strategy",
            emotion: "ambitious",
            category: "assessment"
          }
        },
        {
          slug: "finance-calculator-roi",
          nodeType: "tool",
          title: "ROI Calculator - Investment Returns Made Simple",
          description: "Calculate your investment returns and make smarter financial decisions",
          content: "Easy-to-use ROI calculator with visual charts, comparison features, and educational content about investment strategies.",
          verticalId: "finance",
          neuronId: "neuron-finance",
          metadata: {
            niche: "investment",
            emotion: "confident",
            category: "calculator"
          }
        },
        {
          slug: "wellness-tracker-app",
          nodeType: "page",
          title: "Health & Wellness Tracking Made Easy",
          description: "Comprehensive health tracking with AI-powered insights",
          content: "Track your fitness, nutrition, sleep, and mental health with our intelligent wellness platform. Get personalized recommendations.",
          verticalId: "health",
          neuronId: "neuron-health",
          metadata: {
            niche: "wellness",
            emotion: "motivated",
            category: "app"
          }
        },
        {
          slug: "travel-planning-guide",
          nodeType: "blog_post",
          title: "Ultimate Travel Planning Guide 2025",
          description: "Plan your perfect trip with insider tips and AI-powered recommendations",
          content: "Complete guide to travel planning including budgeting, destination research, booking strategies, and packing tips.",
          verticalId: "travel",
          neuronId: "neuron-travel",
          metadata: {
            niche: "travel planning",
            emotion: "excited",
            category: "guide"
          }
        },
        {
          slug: "learn-react-course",
          nodeType: "offer",
          title: "Master React Development in 30 Days",
          description: "Complete React course with projects, mentorship, and job placement",
          content: "Comprehensive React course covering hooks, state management, testing, and deployment. Includes 5 real-world projects.",
          verticalId: "education",
          neuronId: "neuron-education",
          metadata: {
            niche: "web development",
            emotion: "determined",
            category: "course",
            price: "$299"
          }
        },
        {
          slug: "signup-cta",
          nodeType: "cta_block",
          title: "Start Your Free Trial Today",
          description: "Join thousands of users who've transformed their productivity",
          content: "Get started with our premium features for free. No credit card required. Cancel anytime.",
          metadata: {
            niche: "conversion",
            emotion: "urgency",
            category: "signup"
          }
        },
        {
          slug: "newsletter-cta",
          nodeType: "cta_block", 
          title: "Get Weekly AI Tool Updates",
          description: "Stay ahead with the latest AI tools and productivity tips",
          content: "Join 50,000+ professionals getting weekly insights on the best new AI tools and how to use them effectively.",
          metadata: {
            niche: "newsletter",
            emotion: "informed",
            category: "email_capture"
          }
        },
        {
          slug: "entrepreneur-archetype",
          nodeType: "user_archetype",
          title: "The Ambitious Entrepreneur",
          description: "Fast-moving business owner seeking efficiency and growth",
          content: "Characterized by: High growth focus, time-conscious, tech-savvy, results-oriented, willing to invest in productivity tools.",
          metadata: {
            niche: "business",
            emotion: "driven",
            category: "archetype"
          }
        },
        {
          slug: "creative-professional-archetype", 
          nodeType: "user_archetype",
          title: "The Creative Professional",
          description: "Designer, writer, or artist focused on creative workflow optimization",
          content: "Characterized by: Creative process focus, aesthetic appreciation, collaborative mindset, quality-driven, interested in creative tools.",
          metadata: {
            niche: "creative",
            emotion: "inspired",
            category: "archetype"
          }
        },
        {
          slug: "tech-vertical",
          nodeType: "vertical",
          title: "Technology & Software",
          description: "Everything related to software, apps, and digital tools",
          content: "Comprehensive coverage of SaaS tools, AI applications, development resources, and technology trends.",
          metadata: {
            niche: "technology",
            emotion: "innovative",
            category: "vertical"
          }
        },
        {
          slug: "business-vertical",
          nodeType: "vertical", 
          title: "Business & Entrepreneurship",
          description: "Resources for business growth, strategy, and entrepreneurship",
          content: "Tools and content for business planning, growth strategies, leadership development, and entrepreneurial success.",
          metadata: {
            niche: "business",
            emotion: "strategic",
            category: "vertical"
          }
        },
        {
          slug: "productivity-tag",
          nodeType: "tag",
          title: "Productivity",
          description: "Tools and content focused on productivity and efficiency",
          content: "Everything related to getting more done, optimizing workflows, and improving personal and professional efficiency.",
          metadata: {
            niche: "productivity",
            emotion: "efficient",
            category: "tag"
          }
        },
        {
          slug: "ai-automation-tag",
          nodeType: "tag",
          title: "AI & Automation", 
          description: "Artificial intelligence and automation tools",
          content: "AI-powered tools, automation workflows, and intelligent systems for various use cases and industries.",
          metadata: {
            niche: "artificial intelligence",
            emotion: "futuristic",
            category: "tag"
          }
        },
        {
          slug: "session-profile-power-user",
          nodeType: "session_profile",
          title: "Power User Session",
          description: "High-engagement user exploring multiple tools and resources",
          content: "User showing high engagement, multiple tool comparisons, extended session time, and conversion-likely behaviors.",
          metadata: {
            niche: "user behavior",
            emotion: "engaged",
            category: "session_profile"
          }
        },
        {
          slug: "session-profile-researcher",
          nodeType: "session_profile",
          title: "Research Session",
          description: "User in information-gathering and comparison mode",
          content: "User browsing multiple resources, comparing options, reading reviews, and gathering information for decision-making.",
          metadata: {
            niche: "user behavior",
            emotion: "analytical",
            category: "session_profile"
          }
        }
      ];

      // Only seed if the table is empty
      const existingNodes = await semanticGraphEngine.semanticSearch("test", { topK: 1 });
      
      if (existingNodes.length === 0) {
        console.log("🌱 Seeding initial semantic nodes...");
        
        const createdNodes = [];
        for (const nodeData of sampleNodes) {
          try {
            const node = await semanticGraphEngine.createNode(nodeData);
            createdNodes.push(node);
          } catch (error) {
            console.error(`Error creating node ${nodeData.slug}:`, error);
          }
        }
        
        console.log(`✅ Created ${createdNodes.length} initial semantic nodes`);

        // Create some sample edges after nodes are created
        await this.createSampleEdges(createdNodes);
      }

    } catch (error) {
      console.error("Error seeding initial semantic data:", error);
    }
  }

  private async createSampleEdges(nodes: any[]): Promise<void> {
    try {
      console.log("🔗 Creating sample semantic edges...");
      
      const edgeCreations = [];

      // Find specific nodes for edge creation
      const aiToolsHub = nodes.find(n => n.slug === "ai-tools-hub");
      const productivityQuiz = nodes.find(n => n.slug === "productivity-quiz");
      const notionReview = nodes.find(n => n.slug === "notion-ai-review");
      const aiWritingOffer = nodes.find(n => n.slug === "ai-writing-course-offer");
      const saasDirectory = nodes.find(n => n.slug === "saas-directory-main");
      const businessQuiz = nodes.find(n => n.slug === "business-growth-quiz");
      const signupCTA = nodes.find(n => n.slug === "signup-cta");
      const newsletterCTA = nodes.find(n => n.slug === "newsletter-cta");

      if (aiToolsHub && productivityQuiz) {
        edgeCreations.push({
          fromNodeId: aiToolsHub.id,
          toNodeId: productivityQuiz.id,
          edgeType: "leads_to",
          weight: 0.8,
          confidence: 0.9,
          metadata: { reason: "main page leads to assessment" }
        });
      }

      if (productivityQuiz && aiWritingOffer) {
        edgeCreations.push({
          fromNodeId: productivityQuiz.id,
          toNodeId: aiWritingOffer.id,
          edgeType: "solves",
          weight: 0.7,
          confidence: 0.8,
          metadata: { reason: "quiz identifies need, offer provides solution" }
        });
      }

      if (notionReview && aiWritingOffer) {
        edgeCreations.push({
          fromNodeId: notionReview.id,
          toNodeId: aiWritingOffer.id,
          edgeType: "upsell_from",
          weight: 0.6,
          confidence: 0.7,
          metadata: { reason: "review content leads to training offer" }
        });
      }

      if (aiToolsHub && signupCTA) {
        edgeCreations.push({
          fromNodeId: aiToolsHub.id,
          toNodeId: signupCTA.id,
          edgeType: "influences",
          weight: 0.9,
          confidence: 0.95,
          metadata: { reason: "main page includes conversion CTA" }
        });
      }

      if (notionReview && newsletterCTA) {
        edgeCreations.push({
          fromNodeId: notionReview.id,
          toNodeId: newsletterCTA.id,
          edgeType: "influences",
          weight: 0.5,
          confidence: 0.6,
          metadata: { reason: "blog content includes newsletter signup" }
        });
      }

      if (saasDirectory && businessQuiz) {
        edgeCreations.push({
          fromNodeId: saasDirectory.id,
          toNodeId: businessQuiz.id,
          edgeType: "leads_to",
          weight: 0.8,
          confidence: 0.85,
          metadata: { reason: "directory leads to business assessment" }
        });
      }

      if (aiToolsHub && notionReview) {
        edgeCreations.push({
          fromNodeId: aiToolsHub.id,
          toNodeId: notionReview.id,
          edgeType: "related_to",
          weight: 0.9,
          confidence: 0.9,
          metadata: { reason: "both focus on AI tools" }
        });
      }

      // Create the edges
      for (const edgeData of edgeCreations) {
        try {
          await semanticGraphEngine.createEdge(edgeData);
        } catch (error) {
          console.error("Error creating edge:", error);
        }
      }

      console.log(`✅ Created ${edgeCreations.length} sample semantic edges`);

    } catch (error) {
      console.error("Error creating sample edges:", error);
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

// Singleton instance
export const semanticInitializer = new SemanticInitializer();