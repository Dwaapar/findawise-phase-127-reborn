/**
 * ArchetypeEngine - Detects user type and adapts experience
 * AI-powered user classification and personalization system
 */

import React from 'react';
import { apiRequest } from '@/lib/queryClient';
import { analyticsClient } from '@/lib/AnalyticsClient';

export interface UserArchetype {
  id: string;
  name: string;
  description: string;
  characteristics: {
    motivation: string[];
    learningStyle: string[];
    goals: string[];
    challenges: string[];
    preferences: string[];
  };
  emotionMapping: 'empower' | 'curious' | 'disciplined' | 'inclusive';
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  recommendedContent: string[];
  recommendedTools: string[];
  typicalBehaviors: string[];
  confidence: number; // 0-1, how confident we are in this classification
}

export interface UserBehaviorData {
  sessionId: string;
  timeSpent: Record<string, number>; // page/section -> milliseconds
  clickPatterns: Array<{
    element: string;
    timestamp: number;
    context: string;
  }>;
  contentEngagement: Record<string, {
    viewed: boolean;
    completed: boolean;
    timeSpent: number;
    scrollDepth: number;
  }>;
  quizResults: Array<{
    quizId: string;
    score: number;
    category: string;
    answers: Record<string, any>;
  }>;
  toolUsage: Array<{
    toolId: string;
    frequency: number;
    lastUsed: string;
    proficiency: number; // 1-10
  }>;
  searchQueries: string[];
  deviceInfo: {
    type: 'mobile' | 'tablet' | 'desktop';
    os: string;
    browser: string;
  };
  visitTimes: string[]; // timestamps
  referralSources: string[];
  goals: string[];
  explicitPreferences: Record<string, any>;
}

export interface ArchetypeClassificationResult {
  primaryArchetype: UserArchetype;
  secondaryArchetype?: UserArchetype;
  confidence: number;
  reasoning: string[];
  recommendedActions: string[];
  personalizationSettings: {
    theme: string;
    difficulty: string;
    contentTypes: string[];
    communicationStyle: string;
  };
}

class ArchetypeEngineService {
  private archetypes: Map<string, UserArchetype> = new Map();
  private userClassifications: Map<string, ArchetypeClassificationResult> = new Map();
  private behaviorTracking: Map<string, UserBehaviorData> = new Map();
  private isInitialized = false;

  constructor() {
    this.initializeDefaultArchetypes();
  }

  private initializeDefaultArchetypes() {
    const defaultArchetypes: UserArchetype[] = [
      // Career Switcher - Focused and Goal-Oriented
      {
        id: 'career-switcher',
        name: 'The Career Switcher',
        description: 'Professionals looking to transition into new fields or advance their careers',
        characteristics: {
          motivation: ['career advancement', 'financial improvement', 'professional growth'],
          learningStyle: ['structured', 'practical', 'goal-oriented'],
          goals: ['skill certification', 'portfolio building', 'job preparation'],
          challenges: ['time constraints', 'imposter syndrome', 'balancing work and study'],
          preferences: ['concrete outcomes', 'industry-relevant content', 'mentorship']
        },
        emotionMapping: 'empower',
        colorScheme: {
          primary: '#1e40af', // Professional blue
          secondary: '#3b82f6',
          accent: '#f59e0b', // Achievement gold
          background: '#f8fafc',
          text: '#1e293b'
        },
        recommendedContent: ['career-focused courses', 'certification prep', 'industry insights'],
        recommendedTools: ['resume builder', 'skill assessments', 'job market tracker'],
        typicalBehaviors: ['focused sessions', 'goal tracking', 'practical application'],
        confidence: 0.85
      },

      // Curious Learner - Exploratory and Broad Interests
      {
        id: 'curious-learner',
        name: 'The Curious Explorer',
        description: 'Lifelong learners who enjoy exploring diverse topics and gaining knowledge',
        characteristics: {
          motivation: ['intellectual curiosity', 'personal enrichment', 'hobby development'],
          learningStyle: ['exploratory', 'visual', 'interactive'],
          goals: ['knowledge expansion', 'creative projects', 'personal satisfaction'],
          challenges: ['lack of structure', 'topic overwhelm', 'difficulty focusing'],
          preferences: ['variety', 'multimedia content', 'social learning']
        },
        emotionMapping: 'curious',
        colorScheme: {
          primary: '#7c3aed', // Curious purple
          secondary: '#a855f7',
          accent: '#06b6d4', // Exploratory cyan
          background: '#fafafa',
          text: '#374151'
        },
        recommendedContent: ['diverse topics', 'interactive content', 'creative projects'],
        recommendedTools: ['discovery tools', 'creative platforms', 'community features'],
        typicalBehaviors: ['topic jumping', 'social sharing', 'experimentation'],
        confidence: 0.80
      },

      // Student - Academic and Exam-Focused
      {
        id: 'academic-student',
        name: 'The Academic Student',
        description: 'Students preparing for exams, assignments, and academic success',
        characteristics: {
          motivation: ['academic achievement', 'exam preparation', 'grade improvement'],
          learningStyle: ['systematic', 'repetitive', 'test-oriented'],
          goals: ['pass exams', 'improve grades', 'master subjects'],
          challenges: ['test anxiety', 'time management', 'information retention'],
          preferences: ['structured content', 'practice tests', 'study schedules']
        },
        emotionMapping: 'disciplined',
        colorScheme: {
          primary: '#059669', // Academic green
          secondary: '#10b981',
          accent: '#f97316', // Focus orange
          background: '#f0fdf4',
          text: '#065f46'
        },
        recommendedContent: ['exam prep', 'study guides', 'practice materials'],
        recommendedTools: ['study planner', 'flashcards', 'progress tracker'],
        typicalBehaviors: ['regular study sessions', 'practice testing', 'progress monitoring'],
        confidence: 0.90
      },

      // Skill Builder - Professional Development
      {
        id: 'skill-builder',
        name: 'The Skill Builder',
        description: 'Working professionals enhancing specific skills for immediate application',
        characteristics: {
          motivation: ['skill improvement', 'job performance', 'professional relevance'],
          learningStyle: ['hands-on', 'project-based', 'just-in-time'],
          goals: ['master specific skills', 'apply immediately', 'solve work problems'],
          challenges: ['limited time', 'keeping up with changes', 'practical application'],
          preferences: ['relevant examples', 'quick wins', 'applicable content']
        },
        emotionMapping: 'empower',
        colorScheme: {
          primary: '#dc2626', // Skill red
          secondary: '#ef4444',
          accent: '#facc15', // Achievement yellow
          background: '#fef2f2',
          text: '#991b1b'
        },
        recommendedContent: ['skill-specific tutorials', 'project guides', 'tool mastery'],
        recommendedTools: ['skill assessments', 'project templates', 'practice environments'],
        typicalBehaviors: ['targeted learning', 'practical application', 'quick consumption'],
        confidence: 0.85
      },

      // Beginner - New to Learning
      {
        id: 'absolute-beginner',
        name: 'The Absolute Beginner',
        description: 'Complete newcomers to a subject or learning in general',
        characteristics: {
          motivation: ['basic understanding', 'confidence building', 'foundation laying'],
          learningStyle: ['step-by-step', 'guided', 'supportive'],
          goals: ['understand basics', 'build confidence', 'establish routine'],
          challenges: ['overwhelming content', 'lack of confidence', 'not knowing where to start'],
          preferences: ['simple explanations', 'encouragement', 'clear progression']
        },
        emotionMapping: 'inclusive',
        colorScheme: {
          primary: '#0891b2', // Supportive blue-green
          secondary: '#06b6d4',
          accent: '#84cc16', // Growth green
          background: '#ecfeff',
          text: '#164e63'
        },
        recommendedContent: ['beginner guides', 'fundamentals', 'confidence builders'],
        recommendedTools: ['guided tutorials', 'progress tracking', 'support community'],
        typicalBehaviors: ['cautious exploration', 'frequent help-seeking', 'gradual progression'],
        confidence: 0.75
      }
    ];

    defaultArchetypes.forEach(archetype => {
      this.archetypes.set(archetype.id, archetype);
    });
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load custom archetypes from server
      await this.loadCustomArchetypes();
      
      this.isInitialized = true;
      console.log('ArchetypeEngine initialized with', this.archetypes.size, 'archetypes');
    } catch (error) {
      console.error('Failed to initialize ArchetypeEngine:', error);
    }
  }

  // Main classification method
  public async classifyUser(sessionId: string, additionalData?: Partial<UserBehaviorData>): Promise<ArchetypeClassificationResult> {
    // Check if we already have a classification
    if (this.userClassifications.has(sessionId)) {
      const existing = this.userClassifications.get(sessionId)!;
      // Return existing if confidence is high enough
      if (existing.confidence > 0.8) {
        return existing;
      }
    }

    try {
      // Gather behavior data
      const behaviorData = await this.gatherBehaviorData(sessionId, additionalData);
      
      // Classify using multiple methods
      const results = await Promise.all([
        this.classifyByBehavior(behaviorData),
        this.classifyByContent(behaviorData),
        this.classifyByQuizResults(behaviorData),
        this.classifyByTimePatterns(behaviorData),
      ]);

      // Combine results using weighted scoring
      const finalResult = this.combineClassificationResults(results, behaviorData);
      
      // Store result
      this.userClassifications.set(sessionId, finalResult);
      
      // Track classification event
      analyticsClient.trackEvent({
        eventType: 'user_classified',
        eventData: {
          archetype: finalResult.primaryArchetype.id,
          confidence: finalResult.confidence,
          reasoning: finalResult.reasoning,
        }
      });

      return finalResult;
    } catch (error) {
      console.error('Classification error:', error);
      return this.getDefaultClassification();
    }
  }

  // Real-time adaptation based on current behavior
  public async adaptToCurrentContext(sessionId: string, context: {
    currentPage?: string;
    currentAction?: string;
    timeSpent?: number;
    difficulty?: string;
    quizScore?: number;
  }): Promise<{
    archetype: UserArchetype;
    adaptations: Record<string, any>;
  }> {
    const classification = await this.classifyUser(sessionId);
    const archetype = classification.primaryArchetype;

    const adaptations = {
      theme: archetype.colorScheme,
      emotion: archetype.emotionMapping,
      contentSuggestions: this.getContextualContent(archetype, context),
      uiAdjustments: this.getUIAdaptations(archetype, context),
      communicationStyle: this.getCommunicationStyle(archetype),
    };

    return { archetype, adaptations };
  }

  // Get personalized recommendations
  public getRecommendations(sessionId: string): {
    content: string[];
    tools: string[];
    actions: string[];
    offers: string[];
  } {
    const classification = this.userClassifications.get(sessionId);
    if (!classification) {
      return this.getDefaultRecommendations();
    }

    const archetype = classification.primaryArchetype;
    
    return {
      content: archetype.recommendedContent,
      tools: archetype.recommendedTools,
      actions: classification.recommendedActions,
      offers: this.getArchetypeOffers(archetype),
    };
  }

  // Update user behavior data
  public updateBehaviorData(sessionId: string, update: Partial<UserBehaviorData>): void {
    const existing = this.behaviorTracking.get(sessionId) || this.createEmptyBehaviorData(sessionId);
    
    // Merge update with existing data
    const updated: UserBehaviorData = {
      ...existing,
      ...update,
      timeSpent: { ...existing.timeSpent, ...update.timeSpent },
      clickPatterns: [...existing.clickPatterns, ...(update.clickPatterns || [])],
      contentEngagement: { ...existing.contentEngagement, ...update.contentEngagement },
      quizResults: [...existing.quizResults, ...(update.quizResults || [])],
      toolUsage: [...existing.toolUsage, ...(update.toolUsage || [])],
      searchQueries: [...existing.searchQueries, ...(update.searchQueries || [])],
      visitTimes: [...existing.visitTimes, ...(update.visitTimes || [])],
      referralSources: [...existing.referralSources, ...(update.referralSources || [])],
      goals: [...existing.goals, ...(update.goals || [])],
      explicitPreferences: { ...existing.explicitPreferences, ...update.explicitPreferences },
    };

    this.behaviorTracking.set(sessionId, updated);
    
    // Re-classify if we have significant new data
    if (this.shouldReclassify(sessionId, update)) {
      this.classifyUser(sessionId);
    }
  }

  // Private methods
  private async gatherBehaviorData(sessionId: string, additionalData?: Partial<UserBehaviorData>): Promise<UserBehaviorData> {
    let behaviorData = this.behaviorTracking.get(sessionId);
    
    if (!behaviorData) {
      // Fetch from server if not in memory
      try {
        const response = await apiRequest('/api/analytics/behavior-data', {
          method: 'GET',
          params: { sessionId }
        });
        
        if (response.success) {
          behaviorData = response.data;
        }
      } catch (error) {
        console.warn('Could not fetch behavior data:', error);
      }
    }

    if (!behaviorData) {
      behaviorData = this.createEmptyBehaviorData(sessionId);
    }

    // Merge additional data
    if (additionalData) {
      behaviorData = { ...behaviorData, ...additionalData };
    }

    this.behaviorTracking.set(sessionId, behaviorData);
    return behaviorData;
  }

  private createEmptyBehaviorData(sessionId: string): UserBehaviorData {
    return {
      sessionId,
      timeSpent: {},
      clickPatterns: [],
      contentEngagement: {},
      quizResults: [],
      toolUsage: [],
      searchQueries: [],
      deviceInfo: {
        type: 'desktop',
        os: 'unknown',
        browser: 'unknown'
      },
      visitTimes: [],
      referralSources: [],
      goals: [],
      explicitPreferences: {},
    };
  }

  private async classifyByBehavior(data: UserBehaviorData): Promise<{ archetypeId: string; confidence: number; reasoning: string[] }> {
    const reasoning: string[] = [];
    const scores: Record<string, number> = {};

    // Initialize scores
    this.archetypes.forEach((_, id) => {
      scores[id] = 0;
    });

    // Analyze session patterns
    const totalTimeSpent = Object.values(data.timeSpent).reduce((sum, time) => sum + time, 0);
    const avgSessionTime = totalTimeSpent / Math.max(data.visitTimes.length, 1);

    if (avgSessionTime > 30 * 60 * 1000) { // 30+ minutes
      scores['career-switcher'] += 0.3;
      scores['academic-student'] += 0.4;
      reasoning.push('Long focused sessions indicate serious learning intent');
    } else if (avgSessionTime < 10 * 60 * 1000) { // <10 minutes
      scores['curious-learner'] += 0.3;
      scores['skill-builder'] += 0.2;
      reasoning.push('Short sessions suggest quick information seeking');
    }

    // Analyze content engagement patterns
    const engagementEntries = Object.values(data.contentEngagement);
    const completionRate = engagementEntries.filter(e => e.completed).length / Math.max(engagementEntries.length, 1);

    if (completionRate > 0.8) {
      scores['academic-student'] += 0.4;
      scores['career-switcher'] += 0.3;
      reasoning.push('High completion rate suggests systematic learning approach');
    } else if (completionRate < 0.3) {
      scores['curious-learner'] += 0.4;
      reasoning.push('Low completion rate suggests exploratory browsing');
    }

    // Analyze tool usage
    const toolCategories = data.toolUsage.map(t => t.toolId);
    if (toolCategories.includes('study-planner') || toolCategories.includes('progress-tracker')) {
      scores['academic-student'] += 0.3;
      reasoning.push('Uses planning tools, indicating structured approach');
    }
    if (toolCategories.includes('skill-assessment')) {
      scores['career-switcher'] += 0.3;
      scores['skill-builder'] += 0.3;
      reasoning.push('Uses skill assessments, indicating professional focus');
    }

    // Find highest scoring archetype
    const topArchetype = Object.entries(scores).reduce((a, b) => scores[a[0]] > scores[b[0]] ? a : b);
    
    return {
      archetypeId: topArchetype[0],
      confidence: Math.min(topArchetype[1], 1.0),
      reasoning
    };
  }

  private async classifyByContent(data: UserBehaviorData): Promise<{ archetypeId: string; confidence: number; reasoning: string[] }> {
    const reasoning: string[] = [];
    const scores: Record<string, number> = {};

    this.archetypes.forEach((_, id) => {
      scores[id] = 0;
    });

    // Analyze content categories
    const contentCategories = Object.keys(data.contentEngagement);
    
    if (contentCategories.some(cat => cat.includes('career') || cat.includes('professional'))) {
      scores['career-switcher'] += 0.4;
      reasoning.push('Views career-focused content');
    }
    
    if (contentCategories.some(cat => cat.includes('exam') || cat.includes('test'))) {
      scores['academic-student'] += 0.5;
      reasoning.push('Views exam preparation content');
    }
    
    if (contentCategories.length > 5) {
      scores['curious-learner'] += 0.3;
      reasoning.push('Explores diverse content categories');
    }

    const topArchetype = Object.entries(scores).reduce((a, b) => scores[a[0]] > scores[b[0]] ? a : b);
    
    return {
      archetypeId: topArchetype[0],
      confidence: Math.min(topArchetype[1], 1.0),
      reasoning
    };
  }

  private async classifyByQuizResults(data: UserBehaviorData): Promise<{ archetypeId: string; confidence: number; reasoning: string[] }> {
    const reasoning: string[] = [];
    const scores: Record<string, number> = {};

    this.archetypes.forEach((_, id) => {
      scores[id] = 0;
    });

    if (data.quizResults.length === 0) {
      return { archetypeId: 'curious-learner', confidence: 0.2, reasoning: ['No quiz data available'] };
    }

    const avgScore = data.quizResults.reduce((sum, quiz) => sum + quiz.score, 0) / data.quizResults.length;
    const quizFrequency = data.quizResults.length;

    if (avgScore > 80) {
      scores['academic-student'] += 0.3;
      scores['skill-builder'] += 0.2;
      reasoning.push('High quiz scores indicate strong knowledge or preparation');
    } else if (avgScore < 50) {
      scores['absolute-beginner'] += 0.4;
      reasoning.push('Lower scores suggest beginner level');
    }

    if (quizFrequency > 3) {
      scores['academic-student'] += 0.3;
      reasoning.push('Frequent quiz taking suggests test-focused learning');
    }

    const topArchetype = Object.entries(scores).reduce((a, b) => scores[a[0]] > scores[b[0]] ? a : b);
    
    return {
      archetypeId: topArchetype[0],
      confidence: Math.min(topArchetype[1], 1.0),
      reasoning
    };
  }

  private async classifyByTimePatterns(data: UserBehaviorData): Promise<{ archetypeId: string; confidence: number; reasoning: string[] }> {
    const reasoning: string[] = [];
    const scores: Record<string, number> = {};

    this.archetypes.forEach((_, id) => {
      scores[id] = 0;
    });

    // Analyze visit timing
    const visitHours = data.visitTimes.map(time => new Date(time).getHours());
    const businessHours = visitHours.filter(hour => hour >= 9 && hour <= 17).length;
    const eveningHours = visitHours.filter(hour => hour >= 18 && hour <= 23).length;

    if (businessHours > eveningHours) {
      scores['curious-learner'] += 0.2;
      reasoning.push('Daytime learning suggests casual exploration');
    } else {
      scores['career-switcher'] += 0.3;
      scores['academic-student'] += 0.3;
      reasoning.push('Evening learning suggests dedicated study time');
    }

    const topArchetype = Object.entries(scores).reduce((a, b) => scores[a[0]] > scores[b[0]] ? a : b);
    
    return {
      archetypeId: topArchetype[0],
      confidence: Math.min(topArchetype[1], 1.0),
      reasoning
    };
  }

  private combineClassificationResults(
    results: Array<{ archetypeId: string; confidence: number; reasoning: string[] }>,
    data: UserBehaviorData
  ): ArchetypeClassificationResult {
    const weights = [0.4, 0.3, 0.2, 0.1]; // behavior, content, quiz, time patterns
    const combinedScores: Record<string, number> = {};
    const allReasoning: string[] = [];

    // Initialize scores
    this.archetypes.forEach((_, id) => {
      combinedScores[id] = 0;
    });

    // Combine weighted scores
    results.forEach((result, index) => {
      combinedScores[result.archetypeId] += result.confidence * weights[index];
      allReasoning.push(...result.reasoning);
    });

    // Find primary and secondary archetypes
    const sortedResults = Object.entries(combinedScores).sort(([,a], [,b]) => b - a);
    const primaryId = sortedResults[0][0];
    const primaryArchetype = this.archetypes.get(primaryId)!;
    const secondaryArchetype = sortedResults[1] ? this.archetypes.get(sortedResults[1][0]) : undefined;

    const confidence = sortedResults[0][1];
    
    return {
      primaryArchetype,
      secondaryArchetype,
      confidence,
      reasoning: allReasoning,
      recommendedActions: this.generateRecommendedActions(primaryArchetype, data),
      personalizationSettings: {
        theme: primaryArchetype.emotionMapping,
        difficulty: this.determineDifficulty(data),
        contentTypes: primaryArchetype.recommendedContent,
        communicationStyle: this.getCommunicationStyle(primaryArchetype),
      }
    };
  }

  private getDefaultClassification(): ArchetypeClassificationResult {
    const defaultArchetype = this.archetypes.get('curious-learner')!;
    
    return {
      primaryArchetype: defaultArchetype,
      confidence: 0.5,
      reasoning: ['Default classification due to insufficient data'],
      recommendedActions: ['Complete profile quiz', 'Explore different content types'],
      personalizationSettings: {
        theme: 'curious',
        difficulty: 'beginner',
        contentTypes: ['general'],
        communicationStyle: 'encouraging',
      }
    };
  }

  private async loadCustomArchetypes(): Promise<void> {
    try {
      const response = await apiRequest('/api/education/archetypes');
      if (response.success) {
        response.data.forEach((archetype: UserArchetype) => {
          this.archetypes.set(archetype.id, archetype);
        });
      }
    } catch (error) {
      console.warn('Could not load custom archetypes:', error);
    }
  }

  private getContextualContent(archetype: UserArchetype, context: any): string[] {
    // Return content suggestions based on archetype and current context
    return archetype.recommendedContent;
  }

  private getUIAdaptations(archetype: UserArchetype, context: any): Record<string, any> {
    return {
      colorScheme: archetype.colorScheme,
      emotionMapping: archetype.emotionMapping,
      layout: archetype.id === 'academic-student' ? 'structured' : 'flexible',
    };
  }

  private getCommunicationStyle(archetype: UserArchetype): string {
    switch (archetype.emotionMapping) {
      case 'empower': return 'motivational';
      case 'curious': return 'engaging';
      case 'disciplined': return 'structured';
      case 'inclusive': return 'supportive';
      default: return 'friendly';
    }
  }

  private getDefaultRecommendations() {
    return {
      content: ['beginner guides', 'popular courses'],
      tools: ['basic tools', 'progress tracker'],
      actions: ['complete profile', 'take quiz'],
      offers: ['free trials', 'beginner courses'],
    };
  }

  private getArchetypeOffers(archetype: UserArchetype): string[] {
    // Return relevant offers for this archetype
    return archetype.recommendedContent.map(content => `${content}-offers`);
  }

  private generateRecommendedActions(archetype: UserArchetype, data: UserBehaviorData): string[] {
    const actions: string[] = [];
    
    if (data.quizResults.length === 0) {
      actions.push('Take a skill assessment quiz');
    }
    
    if (Object.keys(data.contentEngagement).length < 3) {
      actions.push('Explore different content categories');
    }
    
    if (archetype.id === 'career-switcher') {
      actions.push('Build a learning portfolio', 'Set career goals');
    } else if (archetype.id === 'academic-student') {
      actions.push('Create study schedule', 'Practice with mock tests');
    }
    
    return actions;
  }

  private determineDifficulty(data: UserBehaviorData): string {
    const avgQuizScore = data.quizResults.length > 0 
      ? data.quizResults.reduce((sum, quiz) => sum + quiz.score, 0) / data.quizResults.length
      : 50;
    
    if (avgQuizScore < 40) return 'beginner';
    if (avgQuizScore < 75) return 'intermediate';
    return 'advanced';
  }

  private shouldReclassify(sessionId: string, update: Partial<UserBehaviorData>): boolean {
    // Determine if significant new data warrants reclassification
    const hasNewQuiz = (update.quizResults?.length || 0) > 0;
    const hasSignificantBehavior = Object.keys(update.contentEngagement || {}).length > 2;
    const hasNewGoals = (update.goals?.length || 0) > 0;
    
    return hasNewQuiz || hasSignificantBehavior || hasNewGoals;
  }

  // Public API methods
  public getArchetype(archetypeId: string): UserArchetype | undefined {
    return this.archetypes.get(archetypeId);
  }

  public getAllArchetypes(): UserArchetype[] {
    return Array.from(this.archetypes.values());
  }

  public getUserClassification(sessionId: string): ArchetypeClassificationResult | undefined {
    return this.userClassifications.get(sessionId);
  }

  public clearUserData(sessionId: string): void {
    this.userClassifications.delete(sessionId);
    this.behaviorTracking.delete(sessionId);
  }
}

// Singleton instance
export const archetypeEngine = new ArchetypeEngineService();

// React hook
export const useArchetype = (sessionId?: string) => {
  const [archetype, setArchetype] = React.useState<UserArchetype | null>(null);
  const [classification, setClassification] = React.useState<ArchetypeClassificationResult | null>(null);
  
  React.useEffect(() => {
    if (sessionId) {
      archetypeEngine.classifyUser(sessionId).then(result => {
        setClassification(result);
        setArchetype(result.primaryArchetype);
      });
    }
  }, [sessionId]);

  return {
    archetype,
    classification,
    classifyUser: archetypeEngine.classifyUser.bind(archetypeEngine),
    updateBehaviorData: archetypeEngine.updateBehaviorData.bind(archetypeEngine),
    getRecommendations: archetypeEngine.getRecommendations.bind(archetypeEngine),
    adaptToCurrentContext: archetypeEngine.adaptToCurrentContext.bind(archetypeEngine),
    getAllArchetypes: archetypeEngine.getAllArchetypes.bind(archetypeEngine),
  };
};

export default archetypeEngine;