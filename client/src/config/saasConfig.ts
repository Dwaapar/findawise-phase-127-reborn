// SaaS-specific configuration for neuron-software-saas
export interface SaaSCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  tools: SaaSTool[];
}

export interface SaaSTool {
  id: string;
  name: string;
  description: string;
  category: string;
  pricing: {
    free: boolean;
    starter?: number;
    professional?: number;
    enterprise?: number;
  };
  features: string[];
  pros: string[];
  cons: string[];
  rating: number;
  reviews: number;
  website: string;
  affiliateUrl?: string;
  logo: string;
  screenshots: string[];
  alternatives: string[];
  integrations: string[];
  targetUsers: string[];
}

export interface SaaSStack {
  id: string;
  name: string;
  description: string;
  persona: string;
  tools: {
    category: string;
    toolId: string;
    priority: number;
  }[];
  totalCost: {
    monthly: number;
    yearly: number;
  };
}

export const saasCategories: SaaSCategory[] = [
  {
    id: "crm",
    name: "CRM & Sales",
    description: "Customer relationship management and sales automation",
    icon: "users",
    tools: []
  },
  {
    id: "project-management",
    name: "Project Management",
    description: "Task management, collaboration, and project tracking",
    icon: "briefcase",
    tools: []
  },
  {
    id: "marketing",
    name: "Marketing Automation",
    description: "Email marketing, social media, and campaign management",
    icon: "megaphone",
    tools: []
  },
  {
    id: "productivity",
    name: "Productivity Tools",
    description: "Time tracking, note-taking, and workflow optimization",
    icon: "clock",
    tools: []
  },
  {
    id: "design",
    name: "Design & Creative",
    description: "Graphic design, video editing, and creative collaboration",
    icon: "palette",
    tools: []
  },
  {
    id: "analytics",
    name: "Analytics & BI",
    description: "Data analysis, reporting, and business intelligence",
    icon: "bar-chart",
    tools: []
  },
  {
    id: "communication",
    name: "Communication",
    description: "Team chat, video conferencing, and collaboration",
    icon: "message-circle",
    tools: []
  },
  {
    id: "ai-tools",
    name: "AI & Automation",
    description: "Artificial intelligence and process automation tools",
    icon: "brain",
    tools: []
  },
  {
    id: "finance",
    name: "Finance & Accounting",
    description: "Invoicing, expense tracking, and financial management",
    icon: "dollar-sign",
    tools: []
  },
  {
    id: "hr",
    name: "HR & People",
    description: "Human resources, payroll, and team management",
    icon: "user-check",
    tools: []
  }
];

export const userPersonas = [
  {
    id: "freelancer",
    name: "Freelancer",
    description: "Independent professional managing multiple clients",
    needs: ["time-tracking", "invoicing", "client-communication", "project-management"],
    budget: { low: 0, high: 200 }
  },
  {
    id: "startup-founder",
    name: "Startup Founder",
    description: "Building and scaling a new business",
    needs: ["crm", "marketing-automation", "analytics", "team-collaboration"],
    budget: { low: 100, high: 1000 }
  },
  {
    id: "agency-owner",
    name: "Agency Owner",
    description: "Managing client projects and team operations",
    needs: ["client-management", "project-tracking", "team-communication", "reporting"],
    budget: { low: 300, high: 2000 }
  },
  {
    id: "enterprise-manager",
    name: "Enterprise Manager",
    description: "Overseeing large-scale operations and teams",
    needs: ["enterprise-crm", "advanced-analytics", "compliance", "integration"],
    budget: { low: 1000, high: 10000 }
  },
  {
    id: "marketer",
    name: "Digital Marketer",
    description: "Creating and managing marketing campaigns",
    needs: ["email-marketing", "social-media", "analytics", "automation"],
    budget: { low: 50, high: 500 }
  },
  {
    id: "developer",
    name: "Developer",
    description: "Building and maintaining software applications",
    needs: ["code-management", "deployment", "monitoring", "collaboration"],
    budget: { low: 20, high: 300 }
  }
];

export const emotionMappingSaaS = {
  trust: {
    colors: ["#1e3a8a", "#1e40af", "#3b82f6"], // Blue tones
    keywords: ["secure", "reliable", "trusted", "proven", "established"],
    useCase: "Reviews, testimonials, security features"
  },
  excitement: {
    colors: ["#dc2626", "#ef4444", "#f97316"], // Red-orange tones
    keywords: ["new", "innovative", "breakthrough", "revolutionary", "cutting-edge"],
    useCase: "Product launches, feature announcements"
  },
  urgency: {
    colors: ["#dc2626", "#b91c1c", "#991b1b"], // Deep red tones
    keywords: ["limited", "exclusive", "today only", "act now", "don't miss"],
    useCase: "Sales, discounts, limited offers"
  },
  confidence: {
    colors: ["#059669", "#10b981", "#34d399"], // Green tones
    keywords: ["guarantee", "proven", "results", "success", "winner"],
    useCase: "Success stories, ROI calculators, guarantees"
  },
  calm: {
    colors: ["#0891b2", "#06b6d4", "#22d3ee"], // Cyan tones
    keywords: ["simple", "easy", "peaceful", "streamlined", "effortless"],
    useCase: "Onboarding, tutorials, support"
  }
};