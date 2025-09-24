// SaaS Seed Data for neuron-software-saas
import { storage } from "../storage";

// Sample seed data for the SaaS neuron
export const saasSeedData = {
  categories: [
    { slug: "project-management", name: "Project Management", description: "Tools for managing projects and teams", icon: "FolderKanban", sortOrder: 1, isActive: true },
    { slug: "crm", name: "CRM", description: "Customer relationship management software", icon: "Users", sortOrder: 2, isActive: true },
    { slug: "email-marketing", name: "Email Marketing", description: "Email marketing and automation platforms", icon: "Mail", sortOrder: 3, isActive: true },
    { slug: "analytics", name: "Analytics", description: "Website and business analytics tools", icon: "BarChart3", sortOrder: 4, isActive: true },
    { slug: "design", name: "Design", description: "Design and creative tools", icon: "Palette", sortOrder: 5, isActive: true },
    { slug: "communication", name: "Communication", description: "Team communication and collaboration", icon: "MessageSquare", sortOrder: 6, isActive: true },
    { slug: "accounting", name: "Accounting", description: "Financial and accounting software", icon: "Calculator", sortOrder: 7, isActive: true },
    { slug: "development", name: "Development", description: "Developer tools and platforms", icon: "Code", sortOrder: 8, isActive: true },
    { slug: "ai-tools", name: "AI Tools", description: "Artificial intelligence powered tools", icon: "Brain", sortOrder: 9, isActive: true },
    { slug: "automation", name: "Automation", description: "Workflow automation platforms", icon: "Zap", sortOrder: 10, isActive: true }
  ],

  tools: [
    {
      slug: "notion",
      name: "Notion",
      description: "All-in-one workspace for notes, tasks, wikis, and databases",
      category: "project-management",
      website: "https://notion.so",
      affiliateUrl: "https://affiliate.notion.so/abc123",
      logo: "https://logo.clearbit.com/notion.so",
      pricing: {
        free: { price: 0, features: ["Personal use", "Unlimited pages", "Basic blocks"] },
        plus: { price: 8, features: ["Small teams", "Collaborative workspace", "Advanced blocks"] },
        business: { price: 15, features: ["Growing teams", "Advanced permissions", "Version history"] }
      },
      features: ["Note-taking", "Project management", "Database", "Wiki", "Templates"],
      pros: ["Flexible and customizable", "Great for teams", "Powerful database features"],
      cons: ["Learning curve", "Can be slow with large databases", "Limited offline access"],
      rating: "4.5",
      reviewCount: 1247,
      isFeatured: true,
      isActive: true,
      targetUsers: ["Teams", "Individuals", "Startups"],
      tags: ["productivity", "collaboration", "database", "notes"]
    },
    {
      slug: "airtable",
      name: "Airtable",
      description: "Cloud collaboration service with spreadsheet-database hybrid features",
      category: "project-management",
      website: "https://airtable.com",
      affiliateUrl: "https://airtable.com/invite/r/abc123",
      logo: "https://logo.clearbit.com/airtable.com",
      pricing: {
        free: { price: 0, features: ["1,200 records per base", "Unlimited bases", "Grid, calendar, kanban views"] },
        plus: { price: 10, features: ["5,000 records per base", "Custom fields", "Calendar sync"] },
        pro: { price: 20, features: ["50,000 records per base", "Advanced features", "Gantt view"] }
      },
      features: ["Database", "Spreadsheet", "Project tracking", "Collaboration", "API access"],
      pros: ["Easy to use", "Great integrations", "Flexible data structure"],
      cons: ["Limited reporting", "Can get expensive", "Performance issues with large datasets"],
      rating: "4.3",
      reviewCount: 892,
      isFeatured: true,
      isActive: true,
      targetUsers: ["Small teams", "Agencies", "Freelancers"],
      tags: ["database", "spreadsheet", "collaboration", "project-management"]
    },
    {
      slug: "hubspot",
      name: "HubSpot",
      description: "Comprehensive CRM platform with marketing, sales, and service hubs",
      category: "crm",
      website: "https://hubspot.com",
      affiliateUrl: "https://hubspot.com/partners/abc123",
      logo: "https://logo.clearbit.com/hubspot.com",
      pricing: {
        free: { price: 0, features: ["Contact management", "Deal tracking", "Email templates"] },
        starter: { price: 45, features: ["Email marketing", "Forms", "Live chat"] },
        professional: { price: 450, features: ["Marketing automation", "Custom reporting", "A/B testing"] }
      },
      features: ["CRM", "Email marketing", "Sales automation", "Analytics", "Lead generation"],
      pros: ["All-in-one platform", "Great free tier", "Excellent support"],
      cons: ["Can be complex", "Expensive at scale", "Limited customization"],
      rating: "4.4",
      reviewCount: 2156,
      isFeatured: true,
      isActive: true,
      targetUsers: ["SMBs", "Marketing teams", "Sales teams"],
      tags: ["crm", "marketing", "sales", "automation"]
    },
    {
      slug: "canva",
      name: "Canva",
      description: "Online design and publishing tool with drag-and-drop interface",
      category: "design",
      website: "https://canva.com",
      affiliateUrl: "https://canva.com/brand/join?referrer=abc123",
      logo: "https://logo.clearbit.com/canva.com",
      pricing: {
        free: { price: 0, features: ["Basic templates", "5GB storage", "Limited elements"] },
        pro: { price: 12.99, features: ["Premium templates", "100GB storage", "Brand kit"] },
        teams: { price: 14.99, features: ["Team features", "Brand controls", "Advanced workflows"] }
      },
      features: ["Graphic design", "Templates", "Brand kit", "Team collaboration", "Social media"],
      pros: ["User-friendly", "Great templates", "Good for non-designers"],
      cons: ["Limited advanced features", "Subscription required for best features", "Can be slow"],
      rating: "4.6",
      reviewCount: 3421,
      isFeatured: true,
      isActive: true,
      targetUsers: ["Small businesses", "Marketers", "Content creators"],
      tags: ["design", "graphics", "templates", "social-media"]
    },
    {
      slug: "zapier",
      name: "Zapier",
      description: "Automation platform connecting apps and services with no-code workflows",
      category: "automation",
      website: "https://zapier.com",
      affiliateUrl: "https://zapier.com/referral/abc123",
      logo: "https://logo.clearbit.com/zapier.com",
      pricing: {
        free: { price: 0, features: ["5 Zaps", "100 tasks/month", "2-app Zaps"] },
        starter: { price: 19.99, features: ["20 Zaps", "750 tasks/month", "Multi-step Zaps"] },
        professional: { price: 49, features: ["Unlimited Zaps", "2,000 tasks/month", "Premium apps"] }
      },
      features: ["Workflow automation", "App integrations", "Triggers and actions", "Webhooks", "Filters"],
      pros: ["Easy to set up", "Thousands of integrations", "No coding required"],
      cons: ["Can get expensive", "Limited error handling", "Complex workflows can be buggy"],
      rating: "4.2",
      reviewCount: 1689,
      isFeatured: true,
      isActive: true,
      targetUsers: ["SMBs", "Marketers", "Operations teams"],
      tags: ["automation", "integration", "workflow", "productivity"]
    }
  ],

  deals: [
    {
      toolId: 1, // Notion
      title: "Notion Pro - 50% Off First Year",
      description: "Get 50% off your first year of Notion Pro for new subscribers",
      dealType: "discount",
      originalPrice: "96.00",
      dealPrice: "48.00",
      discountPercent: 50,
      dealUrl: "https://notion.so/deal/abc123",
      couponCode: "SAVE50",
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      isActive: true,
      isFeatured: true
    },
    {
      toolId: 3, // HubSpot
      title: "HubSpot Starter Free for 3 Months",
      description: "Get HubSpot Starter plan free for 3 months for new users",
      dealType: "free-trial",
      originalPrice: "135.00",
      dealPrice: "0.00",
      discountPercent: 100,
      dealUrl: "https://hubspot.com/free-trial/abc123",
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      isActive: true,
      isFeatured: true
    },
    {
      toolId: 4, // Canva
      title: "Canva Pro 45-Day Free Trial",
      description: "Extended free trial of Canva Pro with all premium features",
      dealType: "free-trial",
      originalPrice: "12.99",
      dealPrice: "0.00",
      discountPercent: 100,
      dealUrl: "https://canva.com/trial/abc123",
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      isActive: true,
      isFeatured: false
    }
  ],

  content: [
    {
      slug: "best-project-management-tools-2025",
      title: "Best Project Management Tools for 2025",
      description: "Comprehensive guide to the top project management software solutions",
      category: "project-management",
      contentType: "guide",
      content: "# Best Project Management Tools for 2025\n\nProject management tools have evolved significantly...",
      isPublished: true,
      views: 1247,
      readTime: 8
    },
    {
      slug: "crm-comparison-hubspot-vs-salesforce",
      title: "HubSpot vs Salesforce: Complete CRM Comparison",
      description: "In-depth comparison of two leading CRM platforms",
      category: "crm",
      contentType: "comparison",
      content: "# HubSpot vs Salesforce: Complete CRM Comparison\n\nChoosing the right CRM is crucial for your business...",
      isPublished: true,
      views: 892,
      readTime: 12
    }
  ]
};

export async function seedSaaSData() {
  try {
    console.log('🌱 Seeding SaaS neuron data...');
    
    // Seed categories with proper duplicate handling
    const categories = [];
    for (const categoryData of saasSeedData.categories) {
      try {
        const category = await storage.createSaaSCategory(categoryData);
        categories.push(category);
        console.log(`✅ Created SaaS category: ${categoryData.name}`);
      } catch (error) {
        if ((error as any)?.message?.includes('duplicate key') || (error as any)?.message?.includes('unique constraint')) {
          console.log(`⏭️  Category '${categoryData.name}' already exists, skipping...`);
          // Try to get existing category for relationships
          try {
            const existing = await storage.getSaaSCategories();
            const existingCategory = existing.find(cat => cat.slug === categoryData.slug);
            if (existingCategory) categories.push(existingCategory);
          } catch (e) {
            console.warn(`Could not retrieve existing category ${categoryData.name}`);
          }
        } else {
          console.warn(`⚠️ Category error for '${categoryData.name}':`, (error as any)?.message);
        }
      }
    }

    // Seed tools with proper duplicate handling
    const tools = [];
    for (const toolData of saasSeedData.tools) {
      try {
        const tool = await storage.createSaaSTool(toolData);
        tools.push(tool);
        console.log(`✅ Created SaaS tool: ${toolData.name}`);
      } catch (error) {
        if ((error as any)?.message?.includes('duplicate key') || (error as any)?.message?.includes('unique constraint')) {
          console.log(`⏭️  Tool '${toolData.name}' already exists, skipping...`);
          // Try to get existing tool for relationships
          try {
            const existing = await storage.getSaaSTools({});
            const existingTool = existing.find(tool => tool.slug === toolData.slug);
            if (existingTool) tools.push(existingTool);
          } catch (e) {
            console.warn(`Could not retrieve existing tool ${toolData.name}`);
          }
        } else {
          console.warn(`⚠️ Tool error for '${toolData.name}':`, (error as any)?.message);
        }
      }
    }

    // Seed deals (if tools were created)
    let deals: any[] = [];
    if (tools.length > 0) {
      for (const dealData of saasSeedData.deals) {
        try {
          // Map toolId to actual tool id if needed
          const actualToolId = tools[dealData.toolId - 1]?.id || dealData.toolId;
          const deal = await storage.createSaaSDeal({
            ...dealData,
            toolId: actualToolId
          });
          deals.push(deal);
        } catch (error) {
          console.warn(`Deal for tool ${dealData.toolId} may already exist, skipping...`);
        }
      }
    }

    // Seed content with duplicate check
    const content: any[] = [];
    for (const contentData of saasSeedData.content) {
      try {
        // Check if content already exists by slug
        const existingContent = await storage.getContent({ slug: contentData.slug });
        if (existingContent && existingContent.length > 0) {
          content.push(existingContent[0]);
          console.log(`Content '${contentData.title}' already exists, using existing...`);
        } else {
          const contentItem = await storage.createSaaSContent(contentData);
          content.push(contentItem);
        }
      } catch (error) {
        console.warn(`Content '${contentData.title}' may already exist, skipping...`);
        // Try to fetch existing content
        try {
          const existingContent = await storage.getContent({ slug: contentData.slug });
          if (existingContent && existingContent.length > 0) {
            content.push(existingContent[0]);
          }
        } catch (fetchError) {
          console.warn(`Could not fetch existing content: ${contentData.title}`);
        }
      }
    }

    console.log('✅ SaaS seed data prepared:');
    console.log(`    - ${categories.length} categories`);
    console.log(`    - ${tools.length} tools`);
    console.log(`    - ${deals.length} deals`);
    console.log(`    - ${content.length} content pieces`);

    return {
      categories,
      tools, 
      deals,
      content
    };

  } catch (error) {
    console.error('❌ Failed to seed SaaS data:', error);
    return {
      categories: [],
      tools: [],
      deals: [],
      content: []
    };
  }
}

// Helper function to create sample stacks
export async function createSampleStacks() {
  const sampleStacks = [
    {
      name: "Startup MVP Stack",
      description: "Essential tools for building and launching your first product",
      persona: "startup-founder",
      tools: [
        { toolId: 1, category: "project-management" },
        { toolId: 3, category: "crm" },
        { toolId: 4, category: "design" }
      ],
      totalCost: { monthly: 65.99, yearly: 593.88 },
      isPublic: true,
      sessionId: "sample-session-1"
    },
    {
      name: "Marketing Agency Stack", 
      description: "Complete solution for digital marketing agencies",
      persona: "agency-owner",
      tools: [
        { toolId: 3, category: "crm" },
        { toolId: 4, category: "design" },
        { toolId: 5, category: "automation" }
      ],
      totalCost: { monthly: 76.98, yearly: 831.48 },
      isPublic: true,
      sessionId: "sample-session-2"
    }
  ];

  for (const stackData of sampleStacks) {
    try {
      await storage.createSaaSStack(stackData);
    } catch (error) {
      console.warn(`Stack '${stackData.name}' may already exist, skipping...`);
    }
  }
}