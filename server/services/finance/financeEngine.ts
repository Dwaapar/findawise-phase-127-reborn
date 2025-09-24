import { db } from "../../db";
import { 
  financeProfiles, 
  financeQuizResults, 
  financeCalculatorResults, 
  financeProductOffers,
  financeContent,
  financeGamification,
  financeAIChatSessions,
  financeLeadMagnets,
  financePerformanceMetrics,
  type InsertFinanceProfile,
  type InsertFinanceQuizResult,
  type InsertFinanceCalculatorResult,
  type FinanceProductOffer,
  type FinanceContent
} from "@shared/financeTables";
import { eq, and, gte, lte, desc, asc } from "drizzle-orm";

export class PersonalFinanceEngine {
  
  // Financial personas and their characteristics
  private financePersonas = {
    'broke-student': {
      type: 'Broke Student',
      description: 'College student with limited income, needs budgeting basics and student loan guidance',
      primaryConcerns: ['budgeting', 'student loans', 'part-time income', 'textbook costs'],
      recommendedProducts: ['student checking account', 'cashback credit card', 'budgeting app'],
      urgencyLevel: 'high',
      budgetRange: '$0-500',
      riskTolerance: 'low',
      timeHorizon: 'short-term',
      educationPriority: ['basic budgeting', 'student loan management', 'building credit']
    },
    'young-investor': {
      type: 'Young Investor',
      description: 'Early career professional starting their investment journey',
      primaryConcerns: ['retirement planning', 'emergency fund', 'first investments', 'career growth'],
      recommendedProducts: ['robo-advisor', 'high-yield savings', 'target-date funds', 'Roth IRA'],
      urgencyLevel: 'medium',
      budgetRange: '$2000-8000',
      riskTolerance: 'moderate-high',
      timeHorizon: 'long-term',
      educationPriority: ['investment basics', 'compound interest', 'retirement accounts']
    },
    'fire-seeker': {
      type: 'FIRE Seeker',
      description: 'Aggressive saver pursuing financial independence and early retirement',
      primaryConcerns: ['savings rate optimization', 'investment allocation', 'expense tracking', 'side hustles'],
      recommendedProducts: ['index funds', 'mega backdoor Roth', 'real estate crowdfunding', 'tax optimization'],
      urgencyLevel: 'high',
      budgetRange: '$10000+',
      riskTolerance: 'high',
      timeHorizon: 'medium-term',
      educationPriority: ['advanced investing', 'tax strategies', 'real estate', 'business income']
    },
    'anxious-debtor': {
      type: 'Anxious Debtor',
      description: 'Overwhelmed by debt, needs debt payoff strategy and credit repair',
      primaryConcerns: ['debt consolidation', 'credit score improvement', 'payment strategies', 'budget control'],
      recommendedProducts: ['debt consolidation loan', 'credit monitoring', 'budgeting tools', 'debt snowball app'],
      urgencyLevel: 'critical',
      budgetRange: '$500-3000',
      riskTolerance: 'very-low',
      timeHorizon: 'short-term',
      educationPriority: ['debt management', 'credit repair', 'emergency budgeting']
    },
    'high-income-undisciplined': {
      type: 'High-Income Undisciplined',
      description: 'High earner with poor spending habits, needs wealth building structure',
      primaryConcerns: ['lifestyle inflation', 'investment strategy', 'tax optimization', 'wealth preservation'],
      recommendedProducts: ['financial advisor', 'automated investing', 'tax-advantaged accounts', 'estate planning'],
      urgencyLevel: 'medium',
      budgetRange: '$15000+',
      riskTolerance: 'moderate',
      timeHorizon: 'long-term',
      educationPriority: ['wealth building', 'tax strategies', 'investment diversification']
    },
    'retirement-planner': {
      type: 'Retirement Planner',
      description: 'Pre-retiree focused on retirement readiness and income planning',
      primaryConcerns: ['retirement income', 'healthcare costs', 'social security optimization', 'estate planning'],
      recommendedProducts: ['retirement calculator', 'bond funds', 'annuities', 'long-term care insurance'],
      urgencyLevel: 'high',
      budgetRange: '$5000-20000',
      riskTolerance: 'low-moderate',
      timeHorizon: 'short-medium term',
      educationPriority: ['retirement income planning', 'medicare', 'estate planning', 'tax-efficient withdrawals']
    }
  };

  // Financial product database
  private financeProducts = {
    'credit-cards': [
      {
        providerName: 'Chase',
        productName: 'Chase Sapphire Preferred',
        category: 'rewards-credit-card',
        apr: '21.49% - 28.49%',
        features: ['60k points bonus', '2x dining/travel', 'No foreign transaction fees'],
        targetPersonas: ['young-investor', 'high-income-undisciplined'],
        affiliateUrl: 'https://creditcards.chase.com/rewards-credit-cards/sapphire/preferred',
        ctaText: 'Apply Now - Limited Time Bonus',
        trustScore: 95,
        priority: 1
      },
      {
        providerName: 'Capital One',
        productName: 'Capital One Venture X',
        category: 'travel-credit-card',
        apr: '19.49% - 29.49%',
        features: ['75k miles bonus', '2x miles all purchases', '$300 travel credit'],
        targetPersonas: ['young-investor', 'fire-seeker'],
        affiliateUrl: 'https://www.capitalone.com/credit-cards/venture-x/',
        ctaText: 'Get 75k Miles Bonus',
        trustScore: 92,
        priority: 2
      },
      {
        providerName: 'Discover',
        productName: 'Discover it Student',
        category: 'student-credit-card',
        apr: '17.49% - 26.49%',
        features: ['Cashback match', '5% rotating categories', 'No annual fee'],
        targetPersonas: ['broke-student'],
        affiliateUrl: 'https://www.discover.com/credit-cards/student/',
        ctaText: 'Build Credit as a Student',
        trustScore: 88,
        priority: 1
      }
    ],
    'savings-accounts': [
      {
        providerName: 'Marcus by Goldman Sachs',
        productName: 'High Yield Online Savings',
        category: 'high-yield-savings',
        interestRate: '4.50%',
        features: ['No minimum balance', 'No fees', 'FDIC insured'],
        targetPersonas: ['young-investor', 'fire-seeker', 'anxious-debtor'],
        affiliateUrl: 'https://www.marcus.com/us/en/savings/high-yield-online-savings-account',
        ctaText: 'Start Earning 4.50% APY',
        trustScore: 96,
        priority: 1
      },
      {
        providerName: 'Ally Bank',
        productName: 'Online Savings Account',
        category: 'high-yield-savings',
        interestRate: '4.25%',
        features: ['No minimum balance', 'Mobile app', '24/7 customer service'],
        targetPersonas: ['broke-student', 'young-investor'],
        affiliateUrl: 'https://www.ally.com/bank/online-savings-account/',
        ctaText: 'Open Your Ally Account',
        trustScore: 94,
        priority: 2
      }
    ],
    'investment-platforms': [
      {
        providerName: 'Betterment',
        productName: 'Digital Investment Platform',
        category: 'robo-advisor',
        fees: '0.25% - 0.40% annually',
        features: ['Auto-rebalancing', 'Tax-loss harvesting', 'Goal-based investing'],
        targetPersonas: ['young-investor', 'high-income-undisciplined'],
        affiliateUrl: 'https://www.betterment.com/',
        ctaText: 'Start Investing with $0 Minimum',
        trustScore: 91,
        priority: 1
      },
      {
        providerName: 'Fidelity',
        productName: 'Fidelity Go',
        category: 'robo-advisor',
        fees: '0.35% annually',
        features: ['No minimum investment', 'Professional management', 'Tax-smart strategies'],
        targetPersonas: ['young-investor', 'fire-seeker'],
        affiliateUrl: 'https://www.fidelity.com/managed-accounts/fidelity-go/overview',
        ctaText: 'Get Started with Fidelity Go',
        trustScore: 93,
        priority: 2
      },
      {
        providerName: 'Vanguard',
        productName: 'Personal Advisor Services',
        category: 'hybrid-advisor',
        fees: '0.30% annually',
        features: ['Human + digital advice', 'Low-cost funds', '$25k minimum'],
        targetPersonas: ['fire-seeker', 'retirement-planner'],
        affiliateUrl: 'https://investor.vanguard.com/advice/personal-advisor',
        ctaText: 'Get Professional Guidance',
        trustScore: 97,
        priority: 1
      }
    ],
    'budgeting-tools': [
      {
        providerName: 'YNAB',
        productName: 'You Need A Budget',
        category: 'budgeting-software',
        fees: '$14.99/month',
        features: ['Zero-based budgeting', 'Goal tracking', 'Bank sync'],
        targetPersonas: ['broke-student', 'anxious-debtor', 'fire-seeker'],
        affiliateUrl: 'https://www.youneedabudget.com/',
        ctaText: 'Try YNAB Free for 34 Days',
        trustScore: 89,
        priority: 1
      },
      {
        providerName: 'Mint',
        productName: 'Mint Budget Tracker',
        category: 'free-budgeting-app',
        fees: 'Free',
        features: ['Automatic categorization', 'Bill reminders', 'Credit score tracking'],
        targetPersonas: ['broke-student', 'young-investor'],
        affiliateUrl: 'https://mint.intuit.com/',
        ctaText: 'Start Budgeting for Free',
        trustScore: 85,
        priority: 2
      }
    ]
  };

  // Calculate budget recommendations based on income and goals
  async calculatePersonalizedBudget(income: number, fixedExpenses: number, goals: string[], persona: string) {
    const basePersona = this.financePersonas[persona as keyof typeof this.financePersonas];
    const discretionaryIncome = income - fixedExpenses;
    
    let budgetAllocation = {
      emergency: 0.10,
      retirement: 0.15,
      investments: 0.05,
      debtPayment: 0.10,
      entertainment: 0.10,
      miscellaneous: 0.05
    };

    // Adjust allocation based on persona
    switch (persona) {
      case 'broke-student':
        budgetAllocation = { emergency: 0.05, retirement: 0.05, investments: 0.02, debtPayment: 0.15, entertainment: 0.08, miscellaneous: 0.10 };
        break;
      case 'fire-seeker':
        budgetAllocation = { emergency: 0.05, retirement: 0.25, investments: 0.20, debtPayment: 0.05, entertainment: 0.05, miscellaneous: 0.03 };
        break;
      case 'anxious-debtor':
        budgetAllocation = { emergency: 0.08, retirement: 0.08, investments: 0.02, debtPayment: 0.30, entertainment: 0.05, miscellaneous: 0.05 };
        break;
      case 'high-income-undisciplined':
        budgetAllocation = { emergency: 0.10, retirement: 0.20, investments: 0.15, debtPayment: 0.10, entertainment: 0.15, miscellaneous: 0.08 };
        break;
    }

    const recommendations = {
      monthlyEmergency: Math.round(discretionaryIncome * budgetAllocation.emergency),
      monthlyRetirement: Math.round(discretionaryIncome * budgetAllocation.retirement),
      monthlyInvestments: Math.round(discretionaryIncome * budgetAllocation.investments),
      monthlyDebtPayment: Math.round(discretionaryIncome * budgetAllocation.debtPayment),
      monthlyEntertainment: Math.round(discretionaryIncome * budgetAllocation.entertainment),
      monthlyMiscellaneous: Math.round(discretionaryIncome * budgetAllocation.miscellaneous),
      emergencyFundGoal: Math.round(fixedExpenses * (persona === 'broke-student' ? 3 : persona === 'fire-seeker' ? 12 : 6)),
      persona: basePersona,
      actionItems: this.generateBudgetActionItems(persona, income, discretionaryIncome)
    };

    return recommendations;
  }

  // Generate FIRE (Financial Independence Retire Early) calculations
  async calculateFIRENumbers(currentAge: number, currentSavings: number, monthlyInvestment: number, targetRetirementAge: number, expectedReturn: number = 0.07) {
    const yearsToRetirement = targetRetirementAge - currentAge;
    const monthsToRetirement = yearsToRetirement * 12;
    const monthlyReturn = expectedReturn / 12;
    
    // Calculate future value of current savings
    const futureValueCurrentSavings = currentSavings * Math.pow(1 + expectedReturn, yearsToRetirement);
    
    // Calculate future value of monthly investments
    const futureValueMonthlyInvestments = monthlyInvestment * 
      (Math.pow(1 + monthlyReturn, monthsToRetirement) - 1) / monthlyReturn;
    
    const totalFutureValue = futureValueCurrentSavings + futureValueMonthlyInvestments;
    
    // FIRE number (25x annual expenses rule)
    const safeWithdrawalRate = 0.04;
    const fireNumber = totalFutureValue;
    const annualWithdrawalCapacity = fireNumber * safeWithdrawalRate;
    const monthlyWithdrawalCapacity = annualWithdrawalCapacity / 12;
    
    return {
      fireNumber: Math.round(totalFutureValue),
      monthlyWithdrawalCapacity: Math.round(monthlyWithdrawalCapacity),
      annualWithdrawalCapacity: Math.round(annualWithdrawalCapacity),
      yearsToFI: yearsToRetirement,
      currentTrajectory: totalFutureValue > 1000000 ? 'on-track' : 'needs-improvement',
      recommendations: this.generateFIRERecommendations(totalFutureValue, monthlyInvestment, currentAge),
      milestones: [
        { age: currentAge + 5, projected: Math.round(currentSavings * Math.pow(1.07, 5) + monthlyInvestment * 60 * 1.4) },
        { age: currentAge + 10, projected: Math.round(currentSavings * Math.pow(1.07, 10) + monthlyInvestment * 120 * 1.8) },
        { age: currentAge + 15, projected: Math.round(totalFutureValue * 0.6) }
      ]
    };
  }

  // Calculate compound interest projections
  async calculateCompoundInterest(principal: number, monthlyContribution: number, annualRate: number, years: number) {
    const monthlyRate = annualRate / 12;
    const totalMonths = years * 12;
    
    // Future value of principal
    const futureValuePrincipal = principal * Math.pow(1 + annualRate, years);
    
    // Future value of monthly contributions
    const futureValueContributions = monthlyContribution * 
      (Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate;
    
    const totalFutureValue = futureValuePrincipal + futureValueContributions;
    const totalContributions = principal + (monthlyContribution * totalMonths);
    const totalInterestEarned = totalFutureValue - totalContributions;
    
    // Generate year-by-year breakdown
    const yearlyBreakdown = [];
    for (let year = 1; year <= years; year++) {
      const months = year * 12;
      const principalGrowth = principal * Math.pow(1 + annualRate, year);
      const contributionGrowth = monthlyContribution * 
        (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate;
      
      yearlyBreakdown.push({
        year,
        totalValue: Math.round(principalGrowth + contributionGrowth),
        totalContributions: principal + (monthlyContribution * months),
        interestEarned: Math.round((principalGrowth + contributionGrowth) - (principal + monthlyContribution * months))
      });
    }
    
    return {
      totalFutureValue: Math.round(totalFutureValue),
      totalContributions: Math.round(totalContributions),
      totalInterestEarned: Math.round(totalInterestEarned),
      yearlyBreakdown,
      recommendations: this.generateCompoundInterestRecommendations(totalFutureValue, monthlyContribution, annualRate)
    };
  }

  // Assess financial persona based on quiz responses
  async assessFinancialPersona(answers: Record<string, any>) {
    let scores = {
      'broke-student': 0,
      'young-investor': 0,
      'fire-seeker': 0,
      'anxious-debtor': 0,
      'high-income-undisciplined': 0,
      'retirement-planner': 0
    };

    // Age scoring
    if (answers.age && answers.age <= 25) scores['broke-student'] += 3;
    if (answers.age && answers.age >= 25 && answers.age <= 35) scores['young-investor'] += 3;
    if (answers.age && answers.age >= 30 && answers.age <= 45) scores['fire-seeker'] += 2;
    if (answers.age && answers.age >= 50) scores['retirement-planner'] += 3;

    // Income scoring
    if (answers.income && answers.income < 30000) {
      scores['broke-student'] += 2;
      scores['anxious-debtor'] += 1;
    }
    if (answers.income && answers.income > 100000) {
      scores['high-income-undisciplined'] += 2;
      scores['fire-seeker'] += 1;
    }

    // Debt scoring
    if (answers.debt && answers.debt > answers.income * 0.5) {
      scores['anxious-debtor'] += 3;
    }

    // Goals scoring
    if (answers.goals) {
      if (answers.goals.includes('early-retirement')) scores['fire-seeker'] += 3;
      if (answers.goals.includes('debt-payoff')) scores['anxious-debtor'] += 2;
      if (answers.goals.includes('college-savings')) scores['broke-student'] += 2;
      if (answers.goals.includes('retirement-planning')) scores['retirement-planner'] += 2;
    }

    // Risk tolerance scoring
    if (answers.riskTolerance === 'high') {
      scores['fire-seeker'] += 2;
      scores['young-investor'] += 1;
    }
    if (answers.riskTolerance === 'low') {
      scores['anxious-debtor'] += 2;
      scores['retirement-planner'] += 1;
    }

    // Find the persona with highest score
    const topPersona = Object.entries(scores).reduce((a, b) => scores[a[0] as keyof typeof scores] > scores[b[0] as keyof typeof scores] ? a : b)[0];
    
    return {
      persona: topPersona,
      confidence: Math.round((scores[topPersona as keyof typeof scores] / 15) * 100),
      personaDetails: this.financePersonas[topPersona as keyof typeof this.financePersonas],
      recommendations: this.generatePersonaRecommendations(topPersona),
      matchedProducts: this.getProductsForPersona(topPersona)
    };
  }

  // Generate personalized product recommendations
  private getProductsForPersona(persona: string): any[] {
    const allProducts = [
      ...this.financeProducts['credit-cards'],
      ...this.financeProducts['savings-accounts'],
      ...this.financeProducts['investment-platforms'],
      ...this.financeProducts['budgeting-tools']
    ];

    return allProducts
      .filter(product => product.targetPersonas.includes(persona))
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      .slice(0, 6); // Top 6 recommendations
  }

  // Generate budget action items based on persona
  private generateBudgetActionItems(persona: string, income: number, discretionaryIncome: number): string[] {
    const baseItems = [
      'Track all expenses for one month to establish baseline',
      'Set up automatic transfers to savings account',
      'Review and optimize recurring subscriptions'
    ];

    const personaSpecificItems: Record<string, string[]> = {
      'broke-student': [
        'Apply for student-specific bank accounts with no fees',
        'Look into work-study programs for additional income',
        'Use student discounts for all major purchases'
      ],
      'fire-seeker': [
        'Maximize all tax-advantaged accounts (401k, IRA, HSA)',
        'Consider house hacking or real estate investment',
        'Track net worth monthly and optimize savings rate'
      ],
      'anxious-debtor': [
        'List all debts with balances and interest rates',
        'Negotiate with creditors for lower interest rates',
        'Consider debt consolidation if it lowers total payments'
      ],
      'high-income-undisciplined': [
        'Automate investing to prevent lifestyle inflation',
        'Hire a fee-only financial advisor for comprehensive planning',
        'Set up separate accounts for different financial goals'
      ]
    };

    return [...baseItems, ...(personaSpecificItems[persona] || [])];
  }

  // Generate FIRE-specific recommendations
  private generateFIRERecommendations(projectedValue: number, monthlyInvestment: number, currentAge: number): string[] {
    const recommendations = [];
    
    if (projectedValue < 1000000) {
      recommendations.push('Increase monthly investment amount by 20-30%');
      recommendations.push('Consider side hustle to boost income');
    }
    
    if (currentAge < 30) {
      recommendations.push('Take advantage of long time horizon with aggressive growth investments');
      recommendations.push('Maximize Roth IRA contributions for tax-free retirement income');
    }
    
    if (monthlyInvestment < 2000) {
      recommendations.push('Focus on increasing income before optimizing investment strategy');
    }
    
    recommendations.push('Maintain 6-month emergency fund separate from FIRE investments');
    recommendations.push('Consider geographic arbitrage to reduce living expenses');
    
    return recommendations;
  }

  // Generate compound interest recommendations
  private generateCompoundInterestRecommendations(futureValue: number, monthlyContribution: number, rate: number): string[] {
    const recommendations = [];
    
    if (rate < 0.06) {
      recommendations.push('Consider diversified index funds for higher expected returns');
    }
    
    if (monthlyContribution < 500) {
      recommendations.push('Gradually increase monthly contributions by 1% each year');
    }
    
    recommendations.push('Start investing as early as possible to maximize compound growth');
    recommendations.push('Automate investments to ensure consistency');
    recommendations.push('Review and rebalance portfolio annually');
    
    return recommendations;
  }

  // Generate persona-specific recommendations
  private generatePersonaRecommendations(persona: string): string[] {
    const recommendations: Record<string, string[]> = {
      'broke-student': [
        'Open a student checking account with no fees',
        'Build credit with a student credit card used responsibly',
        'Apply for grants and scholarships to reduce debt',
        'Consider a work-study job for steady income'
      ],
      'young-investor': [
        'Start with target-date funds in your 401(k)',
        'Open a Roth IRA for tax-free retirement growth',
        'Build 3-6 month emergency fund in high-yield savings',
        'Increase 401(k) contribution by 1% annually'
      ],
      'fire-seeker': [
        'Maintain 50%+ savings rate if possible',
        'Invest in low-cost index funds',
        'Consider real estate for diversification',
        'Track expenses meticulously and optimize regularly'
      ],
      'anxious-debtor': [
        'Use debt avalanche method for highest interest debt first',
        'Consider debt consolidation to simplify payments',
        'Build small emergency fund ($1000) before aggressive debt payoff',
        'Negotiate with creditors for payment plans'
      ],
      'high-income-undisciplined': [
        'Automate all savings and investments',
        'Use percentage-based budgeting instead of fixed amounts',
        'Work with fee-only financial advisor',
        'Set up separate accounts for different goals'
      ],
      'retirement-planner': [
        'Calculate required retirement income using 4% rule',
        'Optimize Social Security claiming strategy',
        'Consider Roth conversions in lower-income years',
        'Plan for healthcare costs in retirement'
      ]
    };

    return recommendations[persona] || [];
  }

  // Store user financial profile
  async saveFinanceProfile(profileData: InsertFinanceProfile) {
    try {
      const [profile] = await db.insert(financeProfiles).values(profileData).returning();
      return profile;
    } catch (error) {
      console.error('Error saving finance profile:', error);
      throw error;
    }
  }

  // Store quiz results
  async saveQuizResult(quizData: InsertFinanceQuizResult) {
    try {
      const [result] = await db.insert(financeQuizResults).values(quizData).returning();
      return result;
    } catch (error) {
      console.error('Error saving quiz result:', error);
      throw error;
    }
  }

  // Store calculator results
  async saveCalculatorResult(calculatorData: InsertFinanceCalculatorResult) {
    try {
      const [result] = await db.insert(financeCalculatorResults).values(calculatorData).returning();
      return result;
    } catch (error) {
      console.error('Error saving calculator result:', error);
      throw error;
    }
  }

  // Get financial content by category and persona
  async getPersonalizedContent(persona: string, category?: string, limit: number = 10) {
    try {
      let query = db.select().from(financeContent).where(eq(financeContent.isPublished, true));
      
      if (category) {
        query = query.where(eq(financeContent.category, category));
      }
      
      const content = await query
        .orderBy(desc(financeContent.engagementScore))
        .limit(limit);
      
      // Filter content that matches the persona
      return content.filter(article => 
        article.targetPersonas && 
        (article.targetPersonas as string[]).includes(persona)
      );
    } catch (error) {
      console.error('Error fetching personalized content:', error);
      throw error;
    }
  }

  // Get product offers for persona
  async getProductOffersForPersona(persona: string, productType?: string) {
    try {
      let query = db.select().from(financeProductOffers).where(eq(financeProductOffers.isActive, true));
      
      if (productType) {
        query = query.where(eq(financeProductOffers.productType, productType));
      }
      
      const offers = await query.orderBy(desc(financeProductOffers.priority));
      
      return offers.filter(offer => 
        offer.targetPersonas && 
        (offer.targetPersonas as string[]).includes(persona)
      );
    } catch (error) {
      console.error('Error fetching product offers:', error);
      throw error;
    }
  }

  // Initialize sample data for finance neuron
  async initializeSampleData() {
    try {
      // Check if data already exists
      const existingOffers = await db.select().from(financeProductOffers).limit(1);
      if (existingOffers.length > 0) {
        console.log('✅ Finance sample data already exists');
        return;
      }

      console.log('🔄 Initializing finance sample data...');

      // Insert product offers
      const productOffers = [
        ...this.financeProducts['credit-cards'].map(product => ({
          productType: 'credit-card',
          providerName: product.providerName,
          productName: product.productName,
          description: `${product.features.join(', ')}`,
          keyFeatures: product.features,
          targetPersonas: product.targetPersonas,
          affiliateUrl: product.affiliateUrl,
          ctaText: product.ctaText,
          trustScore: product.trustScore,
          priority: product.priority,
          apr: parseFloat(product.apr.split('%')[0]) || null
        })),
        ...this.financeProducts['savings-accounts'].map(product => ({
          productType: 'savings-account',
          providerName: product.providerName,
          productName: product.productName,
          description: `${product.features.join(', ')}`,
          keyFeatures: product.features,
          targetPersonas: product.targetPersonas,
          affiliateUrl: product.affiliateUrl,
          ctaText: product.ctaText,
          trustScore: product.trustScore,
          priority: product.priority,
          interestRate: parseFloat(product.interestRate.replace('%', '')) || null
        }))
      ];

      for (const offer of productOffers) {
        await db.insert(financeProductOffers).values(offer);
      }

      console.log('✅ Finance sample data initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing finance sample data:', error);
      throw error;
    }
  }
}