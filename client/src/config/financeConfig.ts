// Financial personas and their configurations
export interface FinancePersona {
  id: string;
  name: string;
  description: string;
  primaryConcerns: string[];
  recommendedProducts: string[];
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  budgetRange: string;
  riskTolerance: 'very-low' | 'low' | 'moderate' | 'moderate-high' | 'high';
  timeHorizon: 'short-term' | 'medium-term' | 'long-term';
  educationPriority: string[];
  emotionTheme: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
}

export const financePersonas: FinancePersona[] = [
  {
    id: 'broke-student',
    name: 'Broke Student',
    description: 'College student with limited income, needs budgeting basics and student loan guidance',
    primaryConcerns: ['budgeting', 'student loans', 'part-time income', 'textbook costs'],
    recommendedProducts: ['student checking account', 'cashback credit card', 'budgeting app'],
    urgencyLevel: 'high',
    budgetRange: '$0-500',
    riskTolerance: 'low',
    timeHorizon: 'short-term',
    educationPriority: ['basic budgeting', 'student loan management', 'building credit'],
    emotionTheme: 'urgent',
    colors: {
      primary: '#ef4444',
      secondary: '#fca5a5', 
      accent: '#fef2f2',
      background: '#fef2f2'
    }
  },
  {
    id: 'young-investor',
    name: 'Young Investor',
    description: 'Early career professional starting their investment journey',
    primaryConcerns: ['retirement planning', 'emergency fund', 'first investments', 'career growth'],
    recommendedProducts: ['robo-advisor', 'high-yield savings', 'target-date funds', 'Roth IRA'],
    urgencyLevel: 'medium',
    budgetRange: '$2000-8000',
    riskTolerance: 'moderate-high',
    timeHorizon: 'long-term',
    educationPriority: ['investment basics', 'compound interest', 'retirement accounts'],
    emotionTheme: 'optimistic',
    colors: {
      primary: '#22c55e',
      secondary: '#86efac',
      accent: '#f0fdf4',
      background: '#f0fdf4'
    }
  },
  {
    id: 'fire-seeker',
    name: 'FIRE Seeker',
    description: 'Aggressive saver pursuing financial independence and early retirement',
    primaryConcerns: ['savings rate optimization', 'investment allocation', 'expense tracking', 'side hustles'],
    recommendedProducts: ['index funds', 'mega backdoor Roth', 'real estate crowdfunding', 'tax optimization'],
    urgencyLevel: 'high',
    budgetRange: '$10000+',
    riskTolerance: 'high',
    timeHorizon: 'medium-term',
    educationPriority: ['advanced investing', 'tax strategies', 'real estate', 'business income'],
    emotionTheme: 'serious',
    colors: {
      primary: '#1f2937',
      secondary: '#6b7280',
      accent: '#f9fafb',
      background: '#f9fafb'
    }
  },
  {
    id: 'anxious-debtor',
    name: 'Anxious Debtor',
    description: 'Overwhelmed by debt, needs debt payoff strategy and credit repair',
    primaryConcerns: ['debt consolidation', 'credit score improvement', 'payment strategies', 'budget control'],
    recommendedProducts: ['debt consolidation loan', 'credit monitoring', 'budgeting tools', 'debt snowball app'],
    urgencyLevel: 'critical',
    budgetRange: '$500-3000',
    riskTolerance: 'very-low',
    timeHorizon: 'short-term',
    educationPriority: ['debt management', 'credit repair', 'emergency budgeting'],
    emotionTheme: 'calm',
    colors: {
      primary: '#3b82f6',
      secondary: '#93c5fd',
      accent: '#eff6ff',
      background: '#eff6ff'
    }
  },
  {
    id: 'high-income-undisciplined',
    name: 'High-Income Undisciplined',
    description: 'High earner with poor spending habits, needs wealth building structure',
    primaryConcerns: ['lifestyle inflation', 'investment strategy', 'tax optimization', 'wealth preservation'],
    recommendedProducts: ['financial advisor', 'automated investing', 'tax-advantaged accounts', 'estate planning'],
    urgencyLevel: 'medium',
    budgetRange: '$15000+',
    riskTolerance: 'moderate',
    timeHorizon: 'long-term',
    educationPriority: ['wealth building', 'tax strategies', 'investment diversification'],
    emotionTheme: 'luxury',
    colors: {
      primary: '#a855f7',
      secondary: '#c4b5fd',
      accent: '#faf5ff',
      background: '#faf5ff'
    }
  },
  {
    id: 'retirement-planner',
    name: 'Retirement Planner',
    description: 'Pre-retiree focused on retirement readiness and income planning',
    primaryConcerns: ['retirement income', 'healthcare costs', 'social security optimization', 'estate planning'],
    recommendedProducts: ['retirement calculator', 'bond funds', 'annuities', 'long-term care insurance'],
    urgencyLevel: 'high',
    budgetRange: '$5000-20000',
    riskTolerance: 'low-moderate',
    timeHorizon: 'short-medium term',
    educationPriority: ['retirement income planning', 'medicare', 'estate planning', 'tax-efficient withdrawals'],
    emotionTheme: 'trustworthy',
    colors: {
      primary: '#0891b2',
      secondary: '#67e8f9',
      accent: '#ecfeff',
      background: '#ecfeff'
    }
  }
];

// Financial calculator configurations
export interface CalculatorConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  inputs: CalculatorInput[];
  targetPersonas: string[];
}

export interface CalculatorInput {
  id: string;
  label: string;
  type: 'number' | 'select' | 'checkbox' | 'text';
  required: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string; label: string }[];
  helpText?: string;
}

export const financeCalculators: CalculatorConfig[] = [
  {
    id: 'budget-calculator',
    name: 'Smart Budget Calculator',
    description: 'Create a personalized budget based on your income, expenses, and financial goals',
    icon: 'calculator',
    category: 'budgeting',
    difficulty: 'beginner',
    estimatedTime: '5 minutes',
    targetPersonas: ['broke-student', 'anxious-debtor', 'young-investor'],
    inputs: [
      {
        id: 'income',
        label: 'Monthly Income (after taxes)',
        type: 'number',
        required: true,
        placeholder: '4500',
        min: 0,
        step: 100,
        helpText: 'Enter your take-home pay per month'
      },
      {
        id: 'fixedExpenses',
        label: 'Fixed Monthly Expenses',
        type: 'number',
        required: true,
        placeholder: '2800',
        min: 0,
        step: 50,
        helpText: 'Rent, utilities, insurance, loan payments, etc.'
      },
      {
        id: 'goals',
        label: 'Financial Goals',
        type: 'checkbox',
        required: true,
        options: [
          { value: 'emergency-fund', label: 'Build Emergency Fund' },
          { value: 'debt-payoff', label: 'Pay Off Debt' },
          { value: 'retirement-savings', label: 'Save for Retirement' },
          { value: 'house-down-payment', label: 'Buy a House' },
          { value: 'vacation', label: 'Plan a Vacation' },
          { value: 'investment', label: 'Start Investing' }
        ],
        helpText: 'Select all goals that apply to you'
      },
      {
        id: 'persona',
        label: 'What best describes your situation?',
        type: 'select',
        required: true,
        options: [
          { value: 'broke-student', label: 'College Student' },
          { value: 'young-investor', label: 'Early Career Professional' },
          { value: 'anxious-debtor', label: 'Dealing with Debt' },
          { value: 'high-income-undisciplined', label: 'High Earner, Poor Saver' }
        ],
        helpText: 'This helps us personalize your recommendations'
      }
    ]
  },
  {
    id: 'fire-calculator',
    name: 'FIRE Calculator',
    description: 'Calculate when you can achieve Financial Independence and Retire Early',
    icon: 'flame',
    category: 'retirement',
    difficulty: 'intermediate',
    estimatedTime: '7 minutes',
    targetPersonas: ['fire-seeker', 'young-investor', 'high-income-undisciplined'],
    inputs: [
      {
        id: 'currentAge',
        label: 'Current Age',
        type: 'number',
        required: true,
        placeholder: '28',
        min: 18,
        max: 65,
        helpText: 'Your current age in years'
      },
      {
        id: 'currentSavings',
        label: 'Current Total Savings/Investments',
        type: 'number',
        required: true,
        placeholder: '50000',
        min: 0,
        step: 1000,
        helpText: 'All investment accounts, 401k, IRA, etc.'
      },
      {
        id: 'monthlyInvestment',
        label: 'Monthly Investment Amount',
        type: 'number',
        required: true,
        placeholder: '3000',
        min: 0,
        step: 100,
        helpText: 'How much you can invest each month'
      },
      {
        id: 'targetRetirementAge',
        label: 'Target Retirement Age',
        type: 'number',
        required: true,
        placeholder: '45',
        min: 30,
        max: 70,
        helpText: 'When you want to achieve financial independence'
      },
      {
        id: 'expectedReturn',
        label: 'Expected Annual Return',
        type: 'select',
        required: true,
        options: [
          { value: '0.05', label: '5% (Conservative)' },
          { value: '0.07', label: '7% (Moderate)' },
          { value: '0.09', label: '9% (Aggressive)' },
          { value: '0.10', label: '10% (Very Aggressive)' }
        ],
        helpText: 'Historical stock market average is around 7-10%'
      }
    ]
  },
  {
    id: 'compound-interest',
    name: 'Compound Interest Calculator',
    description: 'See how your money grows with compound interest over time',
    icon: 'trending-up',
    category: 'investing',
    difficulty: 'beginner',
    estimatedTime: '3 minutes',
    targetPersonas: ['young-investor', 'broke-student', 'fire-seeker'],
    inputs: [
      {
        id: 'principal',
        label: 'Initial Investment',
        type: 'number',
        required: true,
        placeholder: '10000',
        min: 0,
        step: 100,
        helpText: 'Starting amount to invest'
      },
      {
        id: 'monthlyContribution',
        label: 'Monthly Contribution',
        type: 'number',
        required: true,
        placeholder: '500',
        min: 0,
        step: 25,
        helpText: 'Additional amount invested each month'
      },
      {
        id: 'annualRate',
        label: 'Annual Interest Rate',
        type: 'select',
        required: true,
        options: [
          { value: '0.02', label: '2% (High-Yield Savings)' },
          { value: '0.04', label: '4% (Conservative Bonds)' },
          { value: '0.07', label: '7% (Market Average)' },
          { value: '0.10', label: '10% (Growth Stocks)' }
        ],
        helpText: 'Expected annual return on your investment'
      },
      {
        id: 'years',
        label: 'Investment Period (Years)',
        type: 'number',
        required: true,
        placeholder: '20',
        min: 1,
        max: 50,
        helpText: 'How long you plan to invest'
      }
    ]
  },
  {
    id: 'debt-payoff',
    name: 'Debt Payoff Calculator',
    description: 'Create a strategy to pay off your debts faster',
    icon: 'credit-card',
    category: 'debt',
    difficulty: 'beginner',
    estimatedTime: '6 minutes',
    targetPersonas: ['anxious-debtor', 'broke-student', 'young-investor'],
    inputs: [
      {
        id: 'totalDebt',
        label: 'Total Debt Amount',
        type: 'number',
        required: true,
        placeholder: '25000',
        min: 0,
        step: 100,
        helpText: 'Sum of all your debts'
      },
      {
        id: 'averageAPR',
        label: 'Average Interest Rate (%)',
        type: 'number',
        required: true,
        placeholder: '18.5',
        min: 0,
        max: 50,
        step: 0.1,
        helpText: 'Weighted average of all debt interest rates'
      },
      {
        id: 'currentPayment',
        label: 'Current Monthly Payment',
        type: 'number',
        required: true,
        placeholder: '650',
        min: 0,
        step: 25,
        helpText: 'Total amount you currently pay monthly'
      },
      {
        id: 'strategy',
        label: 'Debt Payoff Strategy',
        type: 'select',
        required: true,
        options: [
          { value: 'snowball', label: 'Debt Snowball (Smallest First)' },
          { value: 'avalanche', label: 'Debt Avalanche (Highest Interest First)' },
          { value: 'consolidation', label: 'Debt Consolidation' }
        ],
        helpText: 'Choose your preferred debt elimination strategy'
      }
    ]
  },
  {
    id: 'emergency-fund',
    name: 'Emergency Fund Calculator',
    description: 'Determine how much you need in your emergency fund',
    icon: 'shield',
    category: 'emergency',
    difficulty: 'beginner',
    estimatedTime: '4 minutes',
    targetPersonas: ['young-investor', 'anxious-debtor', 'broke-student'],
    inputs: [
      {
        id: 'monthlyExpenses',
        label: 'Monthly Essential Expenses',
        type: 'number',
        required: true,
        placeholder: '3200',
        min: 0,
        step: 50,
        helpText: 'Rent, food, utilities, insurance, minimum debt payments'
      },
      {
        id: 'jobStability',
        label: 'Job Stability',
        type: 'select',
        required: true,
        options: [
          { value: 'very-stable', label: 'Very Stable (Government, Tenure)' },
          { value: 'stable', label: 'Stable (Large Corporation)' },
          { value: 'moderate', label: 'Moderate (Small Business, Contract)' },
          { value: 'unstable', label: 'Unstable (Freelance, Startup)' }
        ],
        helpText: 'How secure is your income source?'
      },
      {
        id: 'dependents',
        label: 'Number of Dependents',
        type: 'number',
        required: true,
        placeholder: '0',
        min: 0,
        max: 10,
        helpText: 'Children, elderly parents, etc.'
      },
      {
        id: 'healthInsurance',
        label: 'Health Insurance Coverage',
        type: 'select',
        required: true,
        options: [
          { value: 'excellent', label: 'Excellent (Low deductible)' },
          { value: 'good', label: 'Good (Moderate deductible)' },
          { value: 'fair', label: 'Fair (High deductible)' },
          { value: 'poor', label: 'Poor or No Coverage' }
        ],
        helpText: 'Quality of your health insurance'
      }
    ]
  }
];

// Financial quiz configurations
export interface QuizQuestion {
  id: string;
  question: string;
  type: 'single-choice' | 'multiple-choice' | 'scale' | 'number';
  options?: { value: string; label: string; score?: Record<string, number> }[];
  required: boolean;
  helpText?: string;
}

export interface FinanceQuiz {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  questions: QuizQuestion[];
  resultCalculation: string;
}

export const financeQuizzes: FinanceQuiz[] = [
  {
    id: 'money-persona',
    title: "What's Your Money Persona?",
    description: 'Discover your financial personality and get personalized advice',
    estimatedTime: '3 minutes',
    resultCalculation: 'persona-scoring',
    questions: [
      {
        id: 'age',
        question: 'What is your age range?',
        type: 'single-choice',
        required: true,
        options: [
          { value: '18-24', label: '18-24', score: { 'broke-student': 3, 'young-investor': 1 } },
          { value: '25-34', label: '25-34', score: { 'young-investor': 3, 'fire-seeker': 1 } },
          { value: '35-44', label: '35-44', score: { 'fire-seeker': 2, 'high-income-undisciplined': 2 } },
          { value: '45-54', label: '45-54', score: { 'retirement-planner': 2, 'high-income-undisciplined': 1 } },
          { value: '55+', label: '55+', score: { 'retirement-planner': 3 } }
        ]
      },
      {
        id: 'income',
        question: 'What is your annual household income?',
        type: 'single-choice',
        required: true,
        options: [
          { value: 'under-30k', label: 'Under $30,000', score: { 'broke-student': 2, 'anxious-debtor': 1 } },
          { value: '30k-60k', label: '$30,000 - $60,000', score: { 'young-investor': 2, 'anxious-debtor': 1 } },
          { value: '60k-100k', label: '$60,000 - $100,000', score: { 'young-investor': 2, 'fire-seeker': 1 } },
          { value: '100k-200k', label: '$100,000 - $200,000', score: { 'fire-seeker': 2, 'high-income-undisciplined': 1 } },
          { value: 'over-200k', label: 'Over $200,000', score: { 'high-income-undisciplined': 3, 'fire-seeker': 1 } }
        ]
      },
      {
        id: 'debt-situation',
        question: 'How would you describe your current debt situation?',
        type: 'single-choice',
        required: true,
        options: [
          { value: 'no-debt', label: 'No debt', score: { 'young-investor': 2, 'fire-seeker': 2 } },
          { value: 'manageable', label: 'Some debt, but manageable', score: { 'young-investor': 1, 'fire-seeker': 1 } },
          { value: 'student-loans', label: 'Mainly student loans', score: { 'broke-student': 3, 'young-investor': 1 } },
          { value: 'overwhelming', label: 'Debt feels overwhelming', score: { 'anxious-debtor': 3 } },
          { value: 'high-income-debt', label: 'High debt but high income', score: { 'high-income-undisciplined': 2 } }
        ]
      },
      {
        id: 'savings-rate',
        question: 'What percentage of your income do you currently save?',
        type: 'single-choice',
        required: true,
        options: [
          { value: '0-5', label: '0-5%', score: { 'broke-student': 1, 'anxious-debtor': 2, 'high-income-undisciplined': 1 } },
          { value: '5-15', label: '5-15%', score: { 'young-investor': 2, 'anxious-debtor': 1 } },
          { value: '15-25', label: '15-25%', score: { 'young-investor': 2, 'fire-seeker': 1 } },
          { value: '25-50', label: '25-50%', score: { 'fire-seeker': 3 } },
          { value: 'over-50', label: 'Over 50%', score: { 'fire-seeker': 3 } }
        ]
      },
      {
        id: 'financial-goals',
        question: 'What is your primary financial goal right now?',
        type: 'single-choice',
        required: true,
        options: [
          { value: 'survive-college', label: 'Just surviving college financially', score: { 'broke-student': 3 } },
          { value: 'build-emergency', label: 'Building an emergency fund', score: { 'young-investor': 2, 'anxious-debtor': 1 } },
          { value: 'pay-off-debt', label: 'Paying off debt', score: { 'anxious-debtor': 3 } },
          { value: 'start-investing', label: 'Starting to invest for retirement', score: { 'young-investor': 3 } },
          { value: 'early-retirement', label: 'Achieving financial independence/early retirement', score: { 'fire-seeker': 3 } },
          { value: 'wealth-building', label: 'Building wealth but need structure', score: { 'high-income-undisciplined': 3 } },
          { value: 'retirement-ready', label: 'Preparing for retirement soon', score: { 'retirement-planner': 3 } }
        ]
      },
      {
        id: 'investment-knowledge',
        question: 'How would you rate your investment knowledge?',
        type: 'single-choice',
        required: true,
        options: [
          { value: 'none', label: 'Complete beginner', score: { 'broke-student': 1, 'anxious-debtor': 1, 'young-investor': 1 } },
          { value: 'basic', label: 'Basic understanding', score: { 'young-investor': 2 } },
          { value: 'intermediate', label: 'Intermediate', score: { 'fire-seeker': 1, 'young-investor': 1 } },
          { value: 'advanced', label: 'Advanced', score: { 'fire-seeker': 2, 'high-income-undisciplined': 1 } }
        ]
      },
      {
        id: 'risk-tolerance',
        question: 'How do you feel about investment risk?',
        type: 'single-choice',
        required: true,
        options: [
          { value: 'risk-averse', label: 'I prefer safe, guaranteed returns', score: { 'anxious-debtor': 2, 'retirement-planner': 1 } },
          { value: 'conservative', label: 'I accept some risk for modest returns', score: { 'young-investor': 1, 'retirement-planner': 1 } },
          { value: 'moderate', label: 'I accept moderate risk for good returns', score: { 'young-investor': 2, 'high-income-undisciplined': 1 } },
          { value: 'aggressive', label: 'I accept high risk for high returns', score: { 'fire-seeker': 2, 'young-investor': 1 } },
          { value: 'very-aggressive', label: 'Bring on the volatility!', score: { 'fire-seeker': 3 } }
        ]
      }
    ]
  }
];

// Financial content categories
export const financeContentCategories = [
  {
    id: 'budgeting',
    name: 'Budgeting & Saving',
    description: 'Master your money with smart budgeting strategies',
    icon: 'piggy-bank',
    color: 'bg-green-100 text-green-800'
  },
  {
    id: 'investing',
    name: 'Investing',
    description: 'Grow your wealth through smart investments',
    icon: 'trending-up',
    color: 'bg-blue-100 text-blue-800'
  },
  {
    id: 'debt',
    name: 'Debt Management',
    description: 'Strategies to eliminate debt and improve credit',
    icon: 'credit-card',
    color: 'bg-red-100 text-red-800'
  },
  {
    id: 'retirement',
    name: 'Retirement Planning',
    description: 'Secure your financial future',
    icon: 'calendar',
    color: 'bg-purple-100 text-purple-800'
  },
  {
    id: 'insurance',
    name: 'Insurance & Protection',
    description: 'Protect your assets and income',
    icon: 'shield',
    color: 'bg-orange-100 text-orange-800'
  },
  {
    id: 'taxes',
    name: 'Tax Planning',
    description: 'Optimize your tax strategy',
    icon: 'file-text',
    color: 'bg-yellow-100 text-yellow-800'
  }
];