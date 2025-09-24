import { storage } from "../../storage";

export interface SecurityAssessment {
  overallScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  vulnerabilities: SecurityVulnerability[];
  recommendations: SecurityRecommendation[];
  productStack: ProductRecommendation[];
  persona: SecurityPersona;
}

export interface SecurityVulnerability {
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: string;
  solution: string;
}

export interface SecurityRecommendation {
  priority: number;
  category: string;
  title: string;
  description: string;
  cost: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeframe: string;
  products: string[];
}

export interface ProductRecommendation {
  name: string;
  category: string;
  priority: number;
  price: string;
  features: string[];
  pros: string[];
  cons: string[];
  affiliateOffers: any[];
}

export interface SecurityPersona {
  type: string;
  description: string;
  primaryConcerns: string[];
  recommendedSolutions: string[];
  budget: string;
  techSavviness: 'low' | 'medium' | 'high';
  urgency: 'low' | 'medium' | 'high';
}

export interface HomeProfile {
  type: 'apartment' | 'house' | 'condo' | 'townhouse';
  ownership: 'rent' | 'own';
  size: 'small' | 'medium' | 'large';
  location: {
    area: 'urban' | 'suburban' | 'rural';
    crimeRate: 'low' | 'medium' | 'high';
    region: string;
  };
  residents: {
    adults: number;
    children: number;
    elderly: number;
    pets: boolean;
  };
  currentSecurity: string[];
  budget: string;
  primaryConcerns: string[];
  techComfort: 'low' | 'medium' | 'high';
}

export class HomeSecurityEngine {
  
  private securityProducts = {
    cameras: [
      { name: 'Ring Video Doorbell', category: 'doorbell', price: '$99-179', features: ['1080p HD', 'Motion Detection', 'Two-way Talk'], priority: 1 },
      { name: 'Arlo Pro 4', category: 'wireless-camera', price: '$199-249', features: ['4K Video', 'Color Night Vision', 'Wireless'], priority: 2 },
      { name: 'Nest Cam Outdoor', category: 'wired-camera', price: '$179-229', features: ['24/7 Recording', 'AI Detection', 'Google Integration'], priority: 3 }
    ],
    sensors: [
      { name: 'SimpliSafe Entry Sensor', category: 'door-window', price: '$14.99', features: ['Wireless', 'Long Battery Life', 'Instant Alerts'], priority: 1 },
      { name: 'Ring Alarm Motion Detector', category: 'motion', price: '$29.99', features: ['Pet Immune', 'Wide Detection', 'Battery Powered'], priority: 2 },
      { name: 'ADT Glass Break Sensor', category: 'glass-break', price: '$39.99', features: ['Audio Detection', '25ft Range', 'False Alarm Protection'], priority: 3 }
    ],
    smartLocks: [
      { name: 'August Smart Lock Pro', category: 'smart-lock', price: '$229-279', features: ['Auto Lock/Unlock', 'Voice Control', 'Activity Log'], priority: 1 },
      { name: 'Schlage Encode Plus', category: 'keypad-lock', price: '$299-349', features: ['Built-in WiFi', 'Keypad Entry', 'Alexa Built-in'], priority: 2 },
      { name: 'Yale Assure Lock SL', category: 'touchscreen-lock', price: '$199-249', features: ['Touchscreen', 'Key-Free', 'Auto-Relock'], priority: 3 }
    ],
    systems: [
      { name: 'Ring Alarm Pro', category: 'diy-system', price: '$269.99', features: ['Built-in WiFi 6', 'Professional Monitoring', 'Easy Setup'], priority: 1 },
      { name: 'SimpliSafe System', category: 'diy-system', price: '$244-529', features: ['No Contract', '24/7 Monitoring', 'Mobile Alerts'], priority: 2 },
      { name: 'ADT Command Panel', category: 'professional-system', price: '$45-60/month', features: ['Professional Install', '24/7 Monitoring', 'Home Automation'], priority: 3 }
    ]
  };

  private securityPersonas = {
    'anxious-renter': {
      type: 'Anxious Renter',
      description: 'Lives in rental property, concerned about break-ins, budget-conscious',
      primaryConcerns: ['break-ins', 'package theft', 'unauthorized entry'],
      recommendedSolutions: ['portable cameras', 'door sensors', 'smart doorbell'],
      budget: '$200-500',
      techSavviness: 'medium',
      urgency: 'high'
    },
    'busy-parent': {
      type: 'Busy Parent',
      description: 'Family with children, wants convenience and child safety features',
      primaryConcerns: ['child safety', 'monitoring', 'convenience'],
      recommendedSolutions: ['smart cameras', 'motion sensors', 'automated systems'],
      budget: '$500-1500',
      techSavviness: 'medium',
      urgency: 'medium'
    },
    'tech-savvy-buyer': {
      type: 'Tech-Savvy Buyer',
      description: 'Homeowner who loves smart home integration and latest technology',
      primaryConcerns: ['smart integration', 'automation', 'advanced features'],
      recommendedSolutions: ['smart hubs', 'AI cameras', 'integrated systems'],
      budget: '$1000-3000',
      techSavviness: 'high',
      urgency: 'low'
    },
    'elderly-safety': {
      type: 'Elderly Safety-Focused',
      description: 'Senior concerned about personal safety and ease of use',
      primaryConcerns: ['personal safety', 'medical alerts', 'simple operation'],
      recommendedSolutions: ['medical alerts', 'simple cameras', 'emergency buttons'],
      budget: '$300-800',
      techSavviness: 'low',
      urgency: 'high'
    },
    'property-investor': {
      type: 'Property Investor',
      description: 'Multiple properties, needs scalable and cost-effective solutions',
      primaryConcerns: ['property protection', 'cost efficiency', 'remote monitoring'],
      recommendedSolutions: ['wireless systems', 'bulk solutions', 'professional monitoring'],
      budget: '$500-1000 per property',
      techSavviness: 'medium',
      urgency: 'medium'
    }
  };

  // Budget Calculator Methods
  async calculateSecurityBudget(params: { homeSize: number; budget: number; securityLevel: number }) {
    const { homeSize, budget, securityLevel } = params;
    
    // Calculate base costs based on home size and security level
    const baseMultiplier = homeSize / 1000; // Base cost per 1000 sq ft
    const levelMultipliers = { 1: 0.7, 2: 1.0, 3: 1.5 };
    const multiplier = levelMultipliers[securityLevel as keyof typeof levelMultipliers] || 1.0;
    
    const budgetCategories = {
      1: { // Basic
        cameras: { min: 150, max: 400 },
        sensors: { min: 100, max: 250 },
        locks: { min: 80, max: 200 },
        systems: { min: 200, max: 400 }
      },
      2: { // Standard
        cameras: { min: 300, max: 800 },
        sensors: { min: 200, max: 500 },
        locks: { min: 150, max: 400 },
        systems: { min: 400, max: 800 }
      },
      3: { // Premium
        cameras: { min: 600, max: 1500 },
        sensors: { min: 400, max: 800 },
        locks: { min: 300, max: 600 },
        systems: { min: 800, max: 2000 }
      }
    };

    const categories = budgetCategories[securityLevel as keyof typeof budgetCategories];
    
    const breakdown = [
      {
        category: 'Security Cameras',
        items: [
          { name: 'Doorbell Camera', price: Math.round(categories.cameras.min * 0.4), priority: 'essential' as const },
          { name: 'Outdoor Cameras', price: Math.round(categories.cameras.max * 0.6), priority: 'recommended' as const }
        ]
      },
      {
        category: 'Sensors & Alarms',
        items: [
          { name: 'Door/Window Sensors', price: Math.round(categories.sensors.min * 0.6), priority: 'essential' as const },
          { name: 'Motion Detectors', price: Math.round(categories.sensors.max * 0.4), priority: 'recommended' as const }
        ]
      },
      {
        category: 'Smart Access',
        items: [
          { name: 'Smart Lock', price: Math.round(categories.locks.min), priority: 'recommended' as const },
          { name: 'Keypad Entry', price: Math.round(categories.locks.max * 0.3), priority: 'optional' as const }
        ]
      },
      {
        category: 'Security System',
        items: [
          { name: 'Control Panel', price: Math.round(categories.systems.min * 0.4), priority: 'essential' as const },
          { name: 'Professional Monitoring', price: Math.round(categories.systems.max * 0.6), priority: 'recommended' as const }
        ]
      }
    ];

    const totalCost = breakdown.reduce((sum, cat) => 
      sum + cat.items.reduce((catSum, item) => catSum + item.price, 0), 0
    );

    return {
      totalCost,
      breakdown,
      monthlyCosts: Math.round(totalCost * 0.1), // Estimate 10% monthly costs
      roi: `${Math.round((2500 / totalCost) * 100)}% loss prevention value`
    };
  }

  // Crime Data Methods  
  async getCrimeData(zipCode: string) {
    // Simulate crime data API call - in production, integrate with real crime data APIs
    const mockCrimeRates = {
      '90210': 25, '10001': 65, '60601': 45, '94102': 55,
      '77001': 40, '33101': 50, '02101': 35, '98101': 30
    };
    
    const crimeRate = mockCrimeRates[zipCode as keyof typeof mockCrimeRates] || Math.floor(Math.random() * 60) + 20;
    
    const recentIncidents = [
      { type: 'Package Theft', date: '2025-07-15', severity: 'low' as const },
      { type: 'Break-in Attempt', date: '2025-07-10', severity: 'medium' as const },
      { type: 'Vandalism', date: '2025-07-05', severity: 'low' as const }
    ];

    const recommendations = crimeRate > 50 ? [
      'Install visible security cameras',
      'Add motion-activated lighting',
      'Consider professional monitoring',
      'Upgrade to smart locks'
    ] : [
      'Basic doorbell camera recommended',
      'Motion sensors for entry points',
      'Timer lights when away'
    ];

    return {
      location: `ZIP ${zipCode}`,
      crimeRate,
      recentIncidents,
      neighborhoodRating: crimeRate > 50 ? 'High Risk' : crimeRate > 30 ? 'Moderate Risk' : 'Low Risk',
      recommendations
    };
  }

  // Security Score Methods
  async getSecurityScore(sessionId: string) {
    // Get user's last assessment or return default
    try {
      const assessments = await storage.getUserAssessments();
      const userAssessment = assessments.find(a => a.sessionId === sessionId);
      
      if (!userAssessment) {
        return null; // No assessment available
      }

      const factors = [
        {
          category: 'Entry Points',
          score: Math.floor(Math.random() * 30) + 60,
          impact: 'Primary security vulnerability points',
          suggestions: ['Add smart locks', 'Install door sensors', 'Upgrade lighting']
        },
        {
          category: 'Monitoring Coverage',
          score: Math.floor(Math.random() * 25) + 65,
          impact: 'Visual deterrent and evidence collection',
          suggestions: ['Add outdoor cameras', 'Install doorbell camera', 'Improve camera angles']
        },
        {
          category: 'Alert Systems', 
          score: Math.floor(Math.random() * 35) + 50,
          impact: 'Early warning and response capability',
          suggestions: ['Professional monitoring', 'Mobile alerts', 'Neighbor notification']
        }
      ];

      const overallScore = Math.round(factors.reduce((sum, f) => sum + f.score, 0) / factors.length);
      
      return {
        overallScore,
        riskLevel: overallScore > 75 ? 'low' : overallScore > 50 ? 'medium' : 'high',
        factors
      };
    } catch (error) {
      return null;
    }
  }

  // Quiz and Product Methods
  getQuizQuestions() {
    return [
      { id: 1, text: 'What type of home do you live in?', type: 'multiple-choice' },
      { id: 2, text: 'What is your primary security concern?', type: 'multiple-select' },
      { id: 3, text: 'What is your budget range?', type: 'range' }
    ];
  }

  getSecurityPersonas() {
    return Object.values(this.securityPersonas);
  }

  getProductRecommendations() {
    return this.securityProducts;
  }

  async assessHomeSecurity(homeProfile: HomeProfile, sessionId: string): Promise<SecurityAssessment> {
    try {
      // Determine security persona
      const persona = this.determineSecurityPersona(homeProfile);
      
      // Calculate overall security score
      const overallScore = this.calculateSecurityScore(homeProfile);
      
      // Identify vulnerabilities
      const vulnerabilities = this.identifyVulnerabilities(homeProfile);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(homeProfile, persona, vulnerabilities);
      
      // Build product stack
      const productStack = this.buildProductStack(homeProfile, persona, recommendations);
      
      // Determine risk level
      const riskLevel = this.determineRiskLevel(overallScore, vulnerabilities);

      const assessment: SecurityAssessment = {
        overallScore,
        riskLevel,
        vulnerabilities,
        recommendations,
        productStack,
        persona
      };

      // Track assessment analytics
      await storage.trackBehaviorEvent({
        sessionId,
        eventType: 'security_assessment_completed',
        eventData: {
          score: overallScore,
          riskLevel,
          persona: persona.type,
          homeType: homeProfile.type,
          concerns: homeProfile.primaryConcerns
        },
        pageSlug: 'security-assessment',
        timestamp: new Date()
      });

      return assessment;

    } catch (error) {
      console.error('❌ Failed to assess home security:', error);
      throw error;
    }
  }

  private determineSecurityPersona(homeProfile: HomeProfile): SecurityPersona {
    let personaKey = 'anxious-renter'; // Default
    
    // Logic to determine persona based on profile
    if (homeProfile.ownership === 'rent' && homeProfile.primaryConcerns.includes('break-ins')) {
      personaKey = 'anxious-renter';
    } else if (homeProfile.residents.children > 0) {
      personaKey = 'busy-parent';
    } else if (homeProfile.techComfort === 'high' && homeProfile.ownership === 'own') {
      personaKey = 'tech-savvy-buyer';
    } else if (homeProfile.residents.elderly > 0) {
      personaKey = 'elderly-safety';
    } else if (homeProfile.type === 'house' && homeProfile.budget.includes('1000')) {
      personaKey = 'property-investor';
    }

    return this.securityPersonas[personaKey];
  }

  private calculateSecurityScore(homeProfile: HomeProfile): number {
    let score = 50; // Base score
    
    // Adjust based on current security measures
    score += homeProfile.currentSecurity.length * 8;
    
    // Adjust based on home type
    if (homeProfile.type === 'apartment') score += 15; // Generally more secure
    if (homeProfile.type === 'house') score -= 10; // More vulnerable
    
    // Adjust based on location
    if (homeProfile.location.area === 'rural') score -= 15;
    if (homeProfile.location.crimeRate === 'high') score -= 20;
    if (homeProfile.location.crimeRate === 'low') score += 15;
    
    // Adjust based on residents
    if (homeProfile.residents.children > 0) score -= 5; // More concerns
    if (homeProfile.residents.elderly > 0) score -= 10; // More vulnerable
    
    return Math.max(0, Math.min(100, score));
  }

  private identifyVulnerabilities(homeProfile: HomeProfile): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];
    
    // Check for common vulnerabilities
    if (!homeProfile.currentSecurity.includes('doorbell-camera')) {
      vulnerabilities.push({
        category: 'Entry Points',
        severity: 'medium',
        description: 'No video doorbell for front door monitoring',
        impact: 'Cannot identify visitors or package deliveries',
        solution: 'Install a smart video doorbell with motion detection'
      });
    }
    
    if (!homeProfile.currentSecurity.includes('motion-sensors')) {
      vulnerabilities.push({
        category: 'Interior Protection',
        severity: 'high',
        description: 'No motion detection inside the home',
        impact: 'Cannot detect intruders once inside',
        solution: 'Install motion sensors in key areas like hallways and living spaces'
      });
    }
    
    if (homeProfile.location.crimeRate === 'high' && !homeProfile.currentSecurity.includes('professional-monitoring')) {
      vulnerabilities.push({
        category: 'Response Time',
        severity: 'critical',
        description: 'No professional monitoring in high-crime area',
        impact: 'Delayed response to security incidents',
        solution: 'Subscribe to 24/7 professional monitoring service'
      });
    }
    
    if (homeProfile.type === 'house' && !homeProfile.currentSecurity.includes('window-sensors')) {
      vulnerabilities.push({
        category: 'Perimeter Security',
        severity: 'medium',
        description: 'Ground floor windows not monitored',
        impact: 'Vulnerable to break-ins through windows',
        solution: 'Install window sensors on accessible windows'
      });
    }
    
    return vulnerabilities;
  }

  private generateRecommendations(homeProfile: HomeProfile, persona: SecurityPersona, vulnerabilities: SecurityVulnerability[]): SecurityRecommendation[] {
    const recommendations: SecurityRecommendation[] = [];
    
    // Priority 1: Address critical vulnerabilities
    const criticalVulns = vulnerabilities.filter(v => v.severity === 'critical');
    criticalVulns.forEach((vuln, index) => {
      recommendations.push({
        priority: index + 1,
        category: vuln.category,
        title: `Address ${vuln.category} Issue`,
        description: vuln.solution,
        cost: this.estimateCost(vuln.category),
        difficulty: 'medium',
        timeframe: '1-2 weeks',
        products: this.getRelevantProducts(vuln.category)
      });
    });
    
    // Priority 2: Persona-specific recommendations
    persona.recommendedSolutions.forEach((solution, index) => {
      if (!recommendations.some(r => r.description.toLowerCase().includes(solution))) {
        recommendations.push({
          priority: criticalVulns.length + index + 1,
          category: 'Persona Match',
          title: `${solution.charAt(0).toUpperCase() + solution.slice(1)} Solution`,
          description: `Based on your profile as a ${persona.type}, we recommend ${solution}`,
          cost: this.estimateCost(solution),
          difficulty: persona.techSavviness === 'high' ? 'easy' : 'medium',
          timeframe: '1 week',
          products: this.getRelevantProducts(solution)
        });
      }
    });
    
    return recommendations.slice(0, 6); // Top 6 recommendations
  }

  private buildProductStack(homeProfile: HomeProfile, persona: SecurityPersona, recommendations: SecurityRecommendation[]): ProductRecommendation[] {
    const productStack: ProductRecommendation[] = [];
    
    // Get relevant products based on recommendations
    recommendations.forEach(rec => {
      rec.products.forEach(productName => {
        const product = this.findProduct(productName);
        if (product && !productStack.some(p => p.name === product.name)) {
          productStack.push({
            name: product.name,
            category: product.category,
            priority: product.priority,
            price: product.price,
            features: product.features,
            pros: this.generatePros(product, homeProfile),
            cons: this.generateCons(product, homeProfile),
            affiliateOffers: [] // Will be populated with actual affiliate offers
          });
        }
      });
    });
    
    // Sort by priority and limit to top products
    return productStack.sort((a, b) => a.priority - b.priority).slice(0, 8);
  }

  private determineRiskLevel(score: number, vulnerabilities: SecurityVulnerability[]): 'low' | 'medium' | 'high' | 'critical' {
    const criticalVulns = vulnerabilities.filter(v => v.severity === 'critical').length;
    const highVulns = vulnerabilities.filter(v => v.severity === 'high').length;
    
    if (criticalVulns > 0 || score < 30) return 'critical';
    if (highVulns > 1 || score < 50) return 'high';
    if (score < 70) return 'medium';
    return 'low';
  }

  private estimateCost(category: string): string {
    const costMap: { [key: string]: string } = {
      'Entry Points': '$99-299',
      'Interior Protection': '$149-399',
      'Response Time': '$15-45/month',
      'Perimeter Security': '$199-499',
      'doorbell camera': '$99-179',
      'motion sensors': '$29-59 each',
      'professional monitoring': '$15-45/month',
      'smart cameras': '$199-349',
      'window sensors': '$14-29 each'
    };
    
    return costMap[category] || '$50-200';
  }

  private getRelevantProducts(category: string): string[] {
    const productMap: { [key: string]: string[] } = {
      'Entry Points': ['Ring Video Doorbell', 'August Smart Lock Pro'],
      'Interior Protection': ['Ring Alarm Motion Detector', 'SimpliSafe Entry Sensor'],
      'Response Time': ['Ring Alarm Pro', 'SimpliSafe System'],
      'Perimeter Security': ['SimpliSafe Entry Sensor', 'Arlo Pro 4'],
      'doorbell camera': ['Ring Video Doorbell', 'Nest Cam Outdoor'],
      'motion sensors': ['Ring Alarm Motion Detector'],
      'smart cameras': ['Arlo Pro 4', 'Nest Cam Outdoor']
    };
    
    return productMap[category] || [];
  }

  private findProduct(productName: string): any {
    for (const category of Object.values(this.securityProducts)) {
      const product = category.find(p => p.name === productName);
      if (product) return product;
    }
    return null;
  }

  private generatePros(product: any, homeProfile: HomeProfile): string[] {
    const basePros = ['Easy installation', 'Reliable performance', 'Good value'];
    
    // Customize based on home profile
    if (homeProfile.techComfort === 'high') {
      basePros.push('Advanced features', 'Smart home integration');
    }
    
    if (homeProfile.ownership === 'rent') {
      basePros.push('Renter-friendly', 'No drilling required');
    }
    
    return basePros.slice(0, 3);
  }

  private generateCons(product: any, homeProfile: HomeProfile): string[] {
    const baseCons = ['Monthly subscription fees', 'Requires WiFi'];
    
    // Customize based on home profile
    if (homeProfile.techComfort === 'low') {
      baseCons.push('Setup complexity');
    }
    
    if (homeProfile.budget.includes('200')) {
      baseCons.push('Higher upfront cost');
    }
    
    return baseCons.slice(0, 2);
  }

  async getCrimeData(zipCode: string): Promise<any> {
    // Placeholder for crime data integration
    // In production, this would integrate with crime data APIs
    return {
      crimeRate: 'medium',
      recentIncidents: ['package theft', 'break-in attempt'],
      riskScore: 65,
      neighborhood: 'Generally safe with some property crime'
    };
  }

  async generateSecurityTips(persona: SecurityPersona): Promise<string[]> {
    const tips: { [key: string]: string[] } = {
      'Anxious Renter': [
        'Use portable security devices that don\'t require permanent installation',
        'Focus on entry point monitoring with door sensors and cameras',
        'Consider renter\'s insurance for additional protection'
      ],
      'Busy Parent': [
        'Set up automated notifications for when kids arrive home',
        'Use smart locks to eliminate key management',
        'Install cameras in common areas for family monitoring'
      ],
      'Tech-Savvy Buyer': [
        'Integrate security system with existing smart home devices',
        'Use AI-powered cameras for advanced threat detection',
        'Set up custom automation rules for different scenarios'
      ]
    };
    
    return tips[persona.type] || tips['Anxious Renter'];
  }
}

export const securityEngine = new HomeSecurityEngine();