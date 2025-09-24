import { db } from "../../db";
import { semanticNodes, semanticEdges } from "@shared/semanticTables";
import { vectorEngine } from "./vectorEngine";
import { semanticGraphEngine } from "./semanticGraphEngine";

/**
 * Semantic Auto-Populator - Creates billion-dollar sample data
 */
export class SemanticAutoPopulator {
  async populateBillionDollarSampleData(): Promise<{
    nodesCreated: number;
    edgesCreated: number;
    verticals: string[];
  }> {
    console.log("🚀 Populating billion-dollar semantic graph sample data...");

    const nodes = [
      // AI Tools Vertical - Premium Content Strategy
      {
        slug: "ai-tools-ultimate-directory",
        nodeType: "page",
        title: "Ultimate AI Tools Directory 2025 - 500+ Vetted Tools",
        description: "The most comprehensive AI tools directory with expert reviews, pricing comparisons, and use case recommendations",
        content: "Discover the best AI tools for productivity, content creation, automation, and business growth. Our expert team has tested over 500 AI tools across 20+ categories. Get exclusive deals, detailed reviews, and implementation guides.",
        metadata: {
          niche: "ai tools",
          emotion: "professional",
          category: "directory",
          quality_score: 9.5,
          traffic_potential: "high",
          conversion_intent: "medium"
        },
        verticalId: "ai-tools",
        neuronId: "neuron-ai-tools"
      },
      {
        slug: "ai-productivity-archetype-quiz",
        nodeType: "quiz",
        title: "What's Your AI Productivity Archetype? (2-Min Quiz)",
        description: "Discover your unique AI productivity style and get personalized tool recommendations worth $2000+",
        content: "Are you an AI Optimizer, Creative Accelerator, or Automation Master? Take our scientifically-designed quiz to unlock personalized AI tool recommendations that match your work style.",
        metadata: {
          niche: "ai productivity",
          emotion: "curious",
          category: "assessment",
          completion_rate: 0.78,
          lead_conversion: 0.45
        },
        verticalId: "ai-tools",
        neuronId: "neuron-ai-tools"
      },
      {
        slug: "chatgpt-mastery-course-offer",
        nodeType: "offer",
        title: "ChatGPT Mastery Course - 10x Your Productivity in 30 Days",
        description: "Complete ChatGPT training with 100+ prompts, workflows, and AI automation blueprints",
        content: "Master ChatGPT with our comprehensive course featuring advanced prompting techniques, workflow automation, and AI productivity systems used by Fortune 500 companies.",
        metadata: {
          niche: "ai training",
          emotion: "aspirational",
          category: "course",
          price: "$497",
          conversion_rate: 0.08,
          avg_order_value: 497
        },
        verticalId: "ai-tools",
        neuronId: "neuron-ai-tools"
      },
      {
        slug: "ai-content-creation-guide",
        nodeType: "blog_post",
        title: "How to Create $10k Content in 2 Hours with AI (Step-by-Step)",
        description: "Professional content creator reveals the exact AI workflow that generates $10,000 worth of content in just 2 hours",
        content: "Learn the professional AI content creation workflow used by top creators earning $50k+/month. This comprehensive guide covers tools, prompts, and strategies for creating high-value content at scale.",
        metadata: {
          niche: "ai content creation",
          emotion: "motivated",
          category: "tutorial",
          read_time: 12,
          social_shares: 2847
        },
        verticalId: "ai-tools",
        neuronId: "neuron-ai-tools"
      },
      {
        slug: "free-trial-cta",
        nodeType: "cta_block",
        title: "Start Your Free 14-Day AI Tools Trial",
        description: "Access premium AI tools dashboard with no credit card required",
        content: "Get instant access to our premium AI tools dashboard, advanced prompts library, and exclusive tool deals. No credit card required.",
        metadata: {
          niche: "conversion",
          emotion: "urgency",
          category: "trial",
          click_rate: 0.15,
          conversion_rate: 0.28
        }
      },

      // Finance Vertical - Wealth Building Focus
      {
        slug: "investment-calculator-suite",
        nodeType: "tool",
        title: "Advanced Investment Calculator Suite - Compound Interest, FIRE, Portfolio",
        description: "Professional-grade investment calculators with real-time data and personalized projections",
        content: "Calculate your path to financial independence with our advanced investment calculators. Features compound interest projections, FIRE calculator, portfolio optimizer, and retirement planning tools.",
        metadata: {
          niche: "investment planning",
          emotion: "confident",
          category: "calculator",
          usage_rate: 0.65,
          tool_sessions: 1250
        },
        verticalId: "finance",
        neuronId: "neuron-finance"
      },
      {
        slug: "wealth-building-archetype-quiz",
        nodeType: "quiz",
        title: "What's Your Wealth Building Personality? (Investor Archetype Quiz)",
        description: "Discover your investor personality and get a personalized $10k wealth building blueprint",
        content: "Are you a Conservative Builder, Aggressive Grower, or Passive Income Creator? Understand your investment personality to build wealth faster with strategies tailored to your style.",
        metadata: {
          niche: "wealth building",
          emotion: "ambitious",
          category: "assessment",
          completion_rate: 0.82,
          blueprint_downloads: 1847
        },
        verticalId: "finance",
        neuronId: "neuron-finance"
      },
      {
        slug: "millionaire-blueprint-offer",
        nodeType: "offer",
        title: "The Millionaire Blueprint - Build $1M Net Worth in 10 Years",
        description: "Complete wealth building system with investment strategies, tax optimization, and passive income blueprints",
        content: "Get the exact blueprint used by our clients to build $1M+ net worth. Includes investment templates, tax strategies, passive income systems, and personal coaching.",
        metadata: {
          niche: "wealth building",
          emotion: "aspirational",
          category: "blueprint",
          price: "$1997",
          conversion_rate: 0.06,
          avg_order_value: 1997
        },
        verticalId: "finance",
        neuronId: "neuron-finance"
      },

      // Health & Wellness Vertical - Transformation Focus  
      {
        slug: "health-optimization-hub",
        nodeType: "page",
        title: "Complete Health Optimization Hub - Biohacking, Nutrition, Fitness",
        description: "Science-based health optimization with personalized protocols and expert guidance",
        content: "Transform your health with our comprehensive optimization hub. Features biohacking protocols, personalized nutrition plans, fitness blueprints, and sleep optimization strategies.",
        metadata: {
          niche: "health optimization",
          emotion: "motivated",
          category: "hub",
          engagement_time: 420,
          return_visits: 0.45
        },
        verticalId: "health",
        neuronId: "neuron-health"
      },
      {
        slug: "metabolism-boost-quiz",
        nodeType: "quiz",
        title: "Discover Your Metabolic Type - Personalized Fat Burning Blueprint",
        description: "3-minute quiz reveals your metabolic type and unlocks your personalized fat burning protocol",
        content: "Discover if you're a Fast Oxidizer, Slow Oxidizer, or Mixed Type. Get your personalized nutrition and exercise blueprint to optimize fat burning and energy levels.",
        metadata: {
          niche: "metabolism",
          emotion: "hopeful",
          category: "assessment",
          completion_rate: 0.75,
          protocol_downloads: 2156
        },
        verticalId: "health",
        neuronId: "neuron-health"
      },

      // Business/SaaS Vertical - Scale & Efficiency
      {
        slug: "saas-tools-comparison-engine",
        nodeType: "page",
        title: "SaaS Tools Comparison Engine - Find Your Perfect Stack",
        description: "AI-powered SaaS tool recommendations with pricing, features, and integration comparisons",
        content: "Find the perfect SaaS stack for your business with our AI-powered comparison engine. Compare features, pricing, integrations, and get personalized recommendations based on your needs.",
        metadata: {
          niche: "saas tools",
          emotion: "professional",
          category: "comparison",
          tool_comparisons: 500,
          recommendation_accuracy: 0.89
        },
        verticalId: "saas",
        neuronId: "neuron-saas"
      },
      {
        slug: "business-optimization-quiz",
        nodeType: "quiz",
        title: "Business Efficiency Audit - Identify Your Biggest Growth Blockers",
        description: "5-minute audit reveals your business bottlenecks and provides a custom optimization roadmap",
        content: "Identify the hidden bottlenecks slowing your business growth. Get a personalized optimization roadmap with tool recommendations and process improvements.",
        metadata: {
          niche: "business optimization",
          emotion: "analytical",
          category: "audit",
          completion_rate: 0.68,
          roadmap_effectiveness: 0.82
        },
        verticalId: "saas",
        neuronId: "neuron-saas"
      },

      // Education Vertical - Skill Mastery
      {
        slug: "skill-mastery-academy",
        nodeType: "page", 
        title: "Digital Skill Mastery Academy - Future-Proof Your Career",
        description: "Master high-demand digital skills with AI-powered learning paths and industry mentorship",
        content: "Future-proof your career with our digital skill mastery programs. Learn AI, data science, digital marketing, and emerging technologies with personalized learning paths.",
        metadata: {
          niche: "skill development",
          emotion: "determined",
          category: "academy",
          course_completion: 0.78,
          career_outcomes: 0.85
        },
        verticalId: "education",
        neuronId: "neuron-education"
      },

      // Travel Vertical - Experience & Adventure
      {
        slug: "luxury-travel-planner",
        nodeType: "page",
        title: "Luxury Travel Planning Suite - AI-Curated Experiences",
        description: "Premium travel planning with AI-curated experiences, exclusive deals, and concierge service",
        content: "Plan unforgettable luxury travel experiences with our AI-powered suite. Get personalized itineraries, exclusive hotel deals, and premium travel concierge service.",
        metadata: {
          niche: "luxury travel",
          emotion: "excited",
          category: "planner",
          booking_rate: 0.42,
          avg_trip_value: 8500
        },
        verticalId: "travel",
        neuronId: "neuron-travel"
      },

      // Security Vertical - Protection & Peace of Mind
      {
        slug: "cybersecurity-assessment-hub",
        nodeType: "page",
        title: "Complete Cybersecurity Assessment Hub - Protect Your Digital Life",
        description: "Comprehensive cybersecurity assessment with personalized protection recommendations",
        content: "Secure your digital life with our comprehensive cybersecurity assessment. Get personalized recommendations for passwords, privacy, backup, and threat protection.",
        metadata: {
          niche: "cybersecurity",
          emotion: "secure",
          category: "assessment",
          security_score_avg: 7.2,
          implementation_rate: 0.73
        },
        verticalId: "security",
        neuronId: "neuron-security"
      },

      // Cross-Vertical Content
      {
        slug: "productivity-entrepreneur-archetype",
        nodeType: "user_archetype",
        title: "The Productivity-Obsessed Entrepreneur",
        description: "High-achieving business owner focused on optimization and efficiency",
        content: "Characterized by: Data-driven decisions, efficiency focus, technology adoption, growth mindset, and continuous optimization. Seeks tools and strategies for maximum ROI.",
        metadata: {
          niche: "entrepreneur",
          emotion: "driven",
          category: "archetype",
          match_accuracy: 0.91
        }
      },
      {
        slug: "wellness-optimization-seeker",
        nodeType: "user_archetype",
        title: "The Wellness Optimization Seeker",
        description: "Health-conscious individual pursuing optimal physical and mental performance",
        content: "Characterized by: Science-based approach, biohacking interest, performance tracking, holistic wellness view, and investment in health optimization.",
        metadata: {
          niche: "wellness",
          emotion: "motivated",
          category: "archetype",
          match_accuracy: 0.88
        }
      },
      {
        slug: "tech-savvy-investor",
        nodeType: "user_archetype",
        title: "The Tech-Savvy Investor",
        description: "Modern investor leveraging technology for wealth building and portfolio optimization",
        content: "Characterized by: Tech tool usage, data-driven investing, diversified approach, long-term focus, and continuous education mindset.",
        metadata: {
          niche: "investing",
          emotion: "analytical",
          category: "archetype",
          match_accuracy: 0.93
        }
      },

      // High-Converting CTA Blocks
      {
        slug: "email-capture-ai-tools",
        nodeType: "cta_block",
        title: "Get the $2000 AI Tools Bundle FREE",
        description: "Access our premium AI tools collection, prompt libraries, and automation templates",
        content: "Join 50,000+ professionals using our premium AI tools bundle. Includes ChatGPT prompts, automation templates, and exclusive tool deals.",
        metadata: {
          niche: "ai tools",
          emotion: "valuable",
          category: "email_capture",
          conversion_rate: 0.35,
          email_open_rate: 0.28
        }
      },
      {
        slug: "consultation-booking-cta",
        nodeType: "cta_block", 
        title: "Book Your Free Strategy Session",
        description: "30-minute consultation to create your personalized growth blueprint",
        content: "Get a custom strategy session with our experts. We'll analyze your situation and create a personalized action plan for your goals.",
        metadata: {
          niche: "consultation",
          emotion: "valuable",
          category: "booking",
          booking_rate: 0.18,
          show_up_rate: 0.82
        }
      }
    ];

    console.log(`Creating ${nodes.length} billion-dollar semantic nodes...`);
    
    const createdNodes = [];
    for (const nodeData of nodes) {
      try {
        // Create the node
        const node = await semanticGraphEngine.createNode(nodeData);
        
        // Generate embeddings for the node  
        await vectorEngine.generateEmbedding(node.id.toString());
        
        createdNodes.push(node);
        console.log(`✅ Created: ${nodeData.title.substring(0, 60)}...`);
      } catch (error) {
        console.error(`❌ Error creating node ${nodeData.slug}:`, error);
      }
    }

    // Create high-value edges between related nodes
    const edges = [
      // AI Tools Flow - Quiz → Course Offer
      { from: "ai-productivity-archetype-quiz", to: "chatgpt-mastery-course-offer", type: "leads_to", weight: 0.85 },
      { from: "ai-tools-ultimate-directory", to: "ai-productivity-archetype-quiz", type: "leads_to", weight: 0.75 },
      { from: "ai-content-creation-guide", to: "chatgpt-mastery-course-offer", type: "upsell_from", weight: 0.70 },
      { from: "ai-tools-ultimate-directory", to: "free-trial-cta", type: "influences", weight: 0.90 },

      // Finance Flow - Calculator → Quiz → Blueprint
      { from: "investment-calculator-suite", to: "wealth-building-archetype-quiz", type: "leads_to", weight: 0.80 },
      { from: "wealth-building-archetype-quiz", to: "millionaire-blueprint-offer", type: "leads_to", weight: 0.88 },

      // Health Flow - Hub → Quiz → Protocols  
      { from: "health-optimization-hub", to: "metabolism-boost-quiz", type: "leads_to", weight: 0.78 },

      // Business/SaaS Flow
      { from: "saas-tools-comparison-engine", to: "business-optimization-quiz", type: "leads_to", weight: 0.72 },
      { from: "business-optimization-quiz", to: "consultation-booking-cta", type: "leads_to", weight: 0.82 },

      // Cross-vertical connections
      { from: "ai-tools-ultimate-directory", to: "saas-tools-comparison-engine", type: "related_to", weight: 0.65 },
      { from: "skill-mastery-academy", to: "ai-tools-ultimate-directory", type: "related_to", weight: 0.70 },
      { from: "productivity-entrepreneur-archetype", to: "ai-productivity-archetype-quiz", type: "matches_intent", weight: 0.92 },
      { from: "tech-savvy-investor", to: "investment-calculator-suite", type: "matches_intent", weight: 0.89 },
      { from: "wellness-optimization-seeker", to: "health-optimization-hub", type: "matches_intent", weight: 0.91 },

      // Email capture and conversion flow
      { from: "ai-content-creation-guide", to: "email-capture-ai-tools", type: "influences", weight: 0.68 },
      { from: "email-capture-ai-tools", to: "chatgpt-mastery-course-offer", type: "leads_to", weight: 0.45 },
      { from: "investment-calculator-suite", to: "consultation-booking-cta", type: "influences", weight: 0.55 },

      // High-value content relationships
      { from: "luxury-travel-planner", to: "consultation-booking-cta", type: "influences", weight: 0.60 },
      { from: "cybersecurity-assessment-hub", to: "email-capture-ai-tools", type: "related_to", weight: 0.40 },
      
      // Archetype matching patterns
      { from: "productivity-entrepreneur-archetype", to: "business-optimization-quiz", type: "solves", weight: 0.85 },
      { from: "wellness-optimization-seeker", to: "metabolism-boost-quiz", type: "solves", weight: 0.88 },
      { from: "tech-savvy-investor", to: "wealth-building-archetype-quiz", type: "solves", weight: 0.86 }
    ];

    console.log(`Creating ${edges.length} high-value semantic edges...`);
    
    let edgesCreated = 0;
    const nodeSlugToId = new Map(createdNodes.map(n => [n.slug, n.id]));

    for (const edgeData of edges) {
      try {
        const fromId = nodeSlugToId.get(edgeData.from);
        const toId = nodeSlugToId.get(edgeData.to);
        
        if (fromId && toId) {
          await semanticGraphEngine.createEdge({
            fromNodeId: fromId,
            toNodeId: toId,
            edgeType: edgeData.type,
            weight: edgeData.weight,
            confidence: edgeData.weight * 0.9, // Slightly lower confidence than weight
            metadata: {
              reason: 'billion_dollar_sample',
              created_by: 'auto_populator',
              quality: 'premium'
            }
          });
          edgesCreated++;
        }
      } catch (error) {
        console.error(`❌ Error creating edge ${edgeData.from} → ${edgeData.to}:`, error);
      }
    }

    const verticals = ['ai-tools', 'finance', 'health', 'saas', 'education', 'travel', 'security'];

    console.log(`🎉 Billion-dollar sample data created successfully!`);
    console.log(`📊 Created ${createdNodes.length} nodes and ${edgesCreated} edges across ${verticals.length} verticals`);

    return {
      nodesCreated: createdNodes.length,
      edgesCreated,
      verticals
    };
  }
}

export const semanticAutoPopulator = new SemanticAutoPopulator();