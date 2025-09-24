import { knowledgeMemoryGraph } from "./knowledgeMemoryGraph";
import { db } from "../../db";
import { promptOptimizations, memoryNodes } from "../../../shared/knowledgeMemoryTables";
import { llmAgents } from "../../../shared/aiNativeTables";
import { eq, desc } from "drizzle-orm";

interface PromptContext {
  userId?: number;
  userArchetype?: string;
  sessionId?: string;
  taskType: string;
  originalPrompt: string;
  metadata?: any;
}

interface RAGResult {
  optimizedPrompt: string;
  injectedNodes: string[];
  injectionStrategy: string;
  retrievalScore: number;
  promptQuality: number;
  executionTime: number;
  tokensAdded: number;
}

/**
 * RAG Enhancer - Zero-Shot Prompt Optimizer with Retrieval-Augmented Generation
 * Supercharges AI responses via intelligent memory retrieval and prompt optimization
 */
export class RAGEnhancer {
  private promptTemplates: Map<string, string> = new Map();
  
  constructor() {
    this.initializePromptTemplates();
  }

  /**
   * Main entry point: Optimize prompt with RAG enhancement
   */
  async optimizePrompt(context: PromptContext): Promise<RAGResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🧠 Optimizing prompt for task: ${context.taskType}`);

      // 1. Analyze prompt to extract key concepts and intent
      const promptAnalysis = await this.analyzePrompt(context.originalPrompt, context);

      // 2. Retrieve relevant memory nodes
      const relevantMemory = await this.retrieveRelevantMemory(promptAnalysis, context);

      // 3. Select injection strategy based on content and context
      const injectionStrategy = this.selectInjectionStrategy(relevantMemory, context);

      // 4. Generate optimized prompt with memory injection
      const optimizedPrompt = await this.generateOptimizedPrompt(
        context.originalPrompt,
        relevantMemory,
        injectionStrategy,
        context
      );

      // 5. Calculate quality metrics
      const metrics = this.calculatePromptMetrics(
        context.originalPrompt,
        optimizedPrompt,
        relevantMemory
      );

      const result: RAGResult = {
        optimizedPrompt,
        injectedNodes: relevantMemory.map(node => node.node.nodeId),
        injectionStrategy,
        retrievalScore: this.calculateRetrievalScore(relevantMemory),
        promptQuality: metrics.quality,
        executionTime: Date.now() - startTime,
        tokensAdded: metrics.tokensAdded
      };

      // 6. Log the optimization for learning and analytics
      await this.logPromptOptimization(context, result);

      console.log(`✅ Prompt optimized: ${result.tokensAdded} tokens added, quality: ${result.promptQuality.toFixed(2)}`);
      return result;

    } catch (error) {
      console.error('Error optimizing prompt:', error);
      
      // Fallback to template-based optimization
      return this.fallbackOptimization(context, Date.now() - startTime);
    }
  }

  /**
   * Analyze prompt to extract intent, concepts, and requirements
   */
  private async analyzePrompt(prompt: string, context: PromptContext): Promise<{
    intent: string;
    concepts: string[];
    complexity: 'low' | 'medium' | 'high';
    domain: string;
    userPersonalization: any;
  }> {
    const words = prompt.toLowerCase().split(/\s+/);
    
    // Extract intent from prompt structure
    const intent = this.extractIntent(prompt);
    
    // Extract key concepts
    const concepts = this.extractConcepts(words);
    
    // Determine complexity
    const complexity = this.determineComplexity(prompt);
    
    // Identify domain
    const domain = this.identifyDomain(concepts, context.taskType);
    
    // Get user personalization data
    const userPersonalization = await this.getUserPersonalization(context);

    return {
      intent,
      concepts,
      complexity,
      domain,
      userPersonalization
    };
  }

  /**
   * Retrieve relevant memory nodes for prompt enhancement
   */
  private async retrieveRelevantMemory(
    analysis: any,
    context: PromptContext
  ): Promise<Array<{ node: any; score: number; relevance: number }>> {
    const searchQueries = [
      // Primary search with full context
      `${analysis.concepts.join(' ')} ${analysis.domain} ${context.taskType}`,
      // Secondary search with intent
      `${analysis.intent} ${analysis.domain}`,
      // Tertiary search with user archetype
      context.userArchetype ? `${context.userArchetype} ${analysis.domain}` : null
    ].filter(Boolean);

    const allResults = [];

    for (const query of searchQueries) {
      const results = await knowledgeMemoryGraph.searchMemory(
        query!,
        {
          userId: context.userId,
          userArchetype: context.userArchetype,
          sessionId: context.sessionId,
          taskType: context.taskType
        },
        {
          limit: 10,
          threshold: 0.6,
          searchType: 'hybrid',
          filters: {
            nodeType: this.getRelevantNodeTypes(analysis.domain, context.taskType),
            minQuality: 0.5
          }
        }
      );
      
      allResults.push(...results);
    }

    // Deduplicate and rank results
    const uniqueResults = this.deduplicateResults(allResults);
    
    // Apply context-aware ranking
    const rankedResults = await this.rankResultsByContext(uniqueResults, analysis, context);
    
    return rankedResults.slice(0, 8); // Limit to top 8 most relevant
  }

  /**
   * Select optimal injection strategy based on memory content and context
   */
  private selectInjectionStrategy(
    relevantMemory: any[],
    context: PromptContext
  ): string {
    if (relevantMemory.length === 0) return 'template_fallback';
    
    const hasHighQualityNodes = relevantMemory.some(r => r.node.qualityScore > 0.8);
    const hasUserSpecificContent = relevantMemory.some(r => 
      r.node.userArchetype === context.userArchetype
    );
    const hasRecentContent = relevantMemory.some(r => 
      new Date(r.node.createdAt).getTime() > Date.now() - (7 * 24 * 60 * 60 * 1000)
    );

    // Advanced strategies based on content quality and relevance
    if (hasHighQualityNodes && hasUserSpecificContent) {
      return 'personalized_context_injection';
    } else if (hasHighQualityNodes && hasRecentContent) {
      return 'fresh_context_injection';
    } else if (relevantMemory.length > 5) {
      return 'comprehensive_rag_injection';
    } else if (relevantMemory.length > 2) {
      return 'selective_rag_injection';
    } else {
      return 'minimal_context_injection';
    }
  }

  /**
   * Generate optimized prompt with intelligent memory injection
   */
  private async generateOptimizedPrompt(
    originalPrompt: string,
    relevantMemory: any[],
    strategy: string,
    context: PromptContext
  ): Promise<string> {
    const baseTemplate = this.getBaseTemplate(context.taskType);
    
    let optimizedPrompt = originalPrompt;

    switch (strategy) {
      case 'personalized_context_injection':
        optimizedPrompt = this.injectPersonalizedContext(originalPrompt, relevantMemory, context);
        break;
        
      case 'fresh_context_injection':
        optimizedPrompt = this.injectFreshContext(originalPrompt, relevantMemory, context);
        break;
        
      case 'comprehensive_rag_injection':
        optimizedPrompt = this.injectComprehensiveContext(originalPrompt, relevantMemory, context);
        break;
        
      case 'selective_rag_injection':
        optimizedPrompt = this.injectSelectiveContext(originalPrompt, relevantMemory, context);
        break;
        
      case 'minimal_context_injection':
        optimizedPrompt = this.injectMinimalContext(originalPrompt, relevantMemory, context);
        break;
        
      case 'template_fallback':
      default:
        optimizedPrompt = this.injectTemplateContext(originalPrompt, baseTemplate, context);
        break;
    }

    // Add empire-specific enhancements
    optimizedPrompt = this.addEmpireEnhancements(optimizedPrompt, context);
    
    // Add user archetype guidance
    if (context.userArchetype) {
      optimizedPrompt = this.addArchetypeGuidance(optimizedPrompt, context.userArchetype);
    }

    return optimizedPrompt;
  }

  /**
   * Inject personalized context based on user archetype and history
   */
  private injectPersonalizedContext(
    originalPrompt: string,
    relevantMemory: any[],
    context: PromptContext
  ): string {
    const personalizedNodes = relevantMemory.filter(r => 
      r.node.userArchetype === context.userArchetype
    ).slice(0, 3);

    const contextSections = personalizedNodes.map(r => {
      return `**Relevant Context for ${context.userArchetype}:**\n${r.node.summary || r.node.content.substring(0, 200)}...\n`;
    });

    const injectedContext = contextSections.join('\n');

    return `${injectedContext}\n**User Request:**\n${originalPrompt}\n\n**Instructions:** Consider the above context specific to ${context.userArchetype} users when providing your response. Focus on personalized recommendations and insights.`;
  }

  /**
   * Inject fresh, recent content for up-to-date responses
   */
  private injectFreshContext(
    originalPrompt: string,
    relevantMemory: any[],
    context: PromptContext
  ): string {
    const recentNodes = relevantMemory
      .filter(r => new Date(r.node.createdAt).getTime() > Date.now() - (7 * 24 * 60 * 60 * 1000))
      .slice(0, 3);

    const contextSections = recentNodes.map(r => {
      return `**Recent Update (${new Date(r.node.createdAt).toLocaleDateString()}):**\n${r.node.summary || r.node.content.substring(0, 200)}...\n`;
    });

    const injectedContext = contextSections.join('\n');

    return `${injectedContext}\n**User Request:**\n${originalPrompt}\n\n**Instructions:** Incorporate the latest information from the above recent updates to provide current and accurate responses.`;
  }

  /**
   * Inject comprehensive context for complex queries
   */
  private injectComprehensiveContext(
    originalPrompt: string,
    relevantMemory: any[],
    context: PromptContext
  ): string {
    const topNodes = relevantMemory.slice(0, 5);
    
    const contextSections = topNodes.map((r, index) => {
      return `**Context ${index + 1} (Quality: ${r.node.qualityScore.toFixed(2)}):**\nTitle: ${r.node.title}\nSummary: ${r.node.summary || r.node.content.substring(0, 150)}...\n`;
    });

    const injectedContext = contextSections.join('\n');

    return `**Knowledge Base Context:**\n${injectedContext}\n\n**User Request:**\n${originalPrompt}\n\n**Instructions:** Use the above knowledge base context to provide a comprehensive, well-informed response. Reference specific insights where relevant.`;
  }

  /**
   * Inject selective context for focused responses
   */
  private injectSelectiveContext(
    originalPrompt: string,
    relevantMemory: any[],
    context: PromptContext
  ): string {
    const bestNode = relevantMemory[0]; // Highest scoring node
    
    const contextSection = `**Relevant Knowledge:**\n${bestNode.node.title}\n${bestNode.node.summary || bestNode.node.content.substring(0, 300)}...\n`;

    return `${contextSection}\n**User Request:**\n${originalPrompt}\n\n**Instructions:** Use the above knowledge to enhance your response with specific, relevant insights.`;
  }

  /**
   * Inject minimal context for simple queries
   */
  private injectMinimalContext(
    originalPrompt: string,
    relevantMemory: any[],
    context: PromptContext
  ): string {
    if (relevantMemory.length === 0) {
      return this.injectTemplateContext(originalPrompt, this.getBaseTemplate(context.taskType), context);
    }

    const topNode = relevantMemory[0];
    const briefContext = `**Context:** ${topNode.node.summary || topNode.node.content.substring(0, 100)}...\n\n`;

    return `${briefContext}${originalPrompt}`;
  }

  /**
   * Inject template-based context as fallback
   */
  private injectTemplateContext(
    originalPrompt: string,
    template: string,
    context: PromptContext
  ): string {
    return `${template}\n\n**User Request:**\n${originalPrompt}`;
  }

  /**
   * Add empire-specific enhancements and branding
   */
  private addEmpireEnhancements(prompt: string, context: PromptContext): string {
    const empireGuidance = `\n\n**Empire Guidelines:**\n- Provide billion-dollar quality responses\n- Focus on actionable, empire-grade insights\n- Maintain professional, expert-level communication\n- Consider cross-vertical intelligence and federation opportunities`;
    
    return `${prompt}${empireGuidance}`;
  }

  /**
   * Add user archetype-specific guidance
   */
  private addArchetypeGuidance(prompt: string, archetype: string): string {
    const archetypeGuidance = this.getArchetypeGuidance(archetype);
    return `${prompt}\n\n**Archetype Guidance for ${archetype}:**\n${archetypeGuidance}`;
  }

  /**
   * Extract intent from prompt structure
   */
  private extractIntent(prompt: string): string {
    const intentPatterns = {
      'question': /\b(what|how|why|when|where|which|who)\b/i,
      'request': /\b(please|can you|could you|would you)\b/i,
      'command': /\b(create|generate|build|make|design)\b/i,
      'analysis': /\b(analyze|compare|evaluate|assess)\b/i,
      'explanation': /\b(explain|describe|tell me about)\b/i
    };

    for (const [intent, pattern] of Object.entries(intentPatterns)) {
      if (pattern.test(prompt)) return intent;
    }

    return 'general';
  }

  /**
   * Extract key concepts from prompt
   */
  private extractConcepts(words: string[]): string[] {
    // Filter out stop words and short words
    const concepts = words.filter(word => 
      word.length > 3 && !this.isStopWord(word)
    );

    // Return top concepts (could be enhanced with NLP)
    return [...new Set(concepts)].slice(0, 10);
  }

  /**
   * Determine prompt complexity
   */
  private determineComplexity(prompt: string): 'low' | 'medium' | 'high' {
    const wordCount = prompt.split(/\s+/).length;
    const hasMultipleQuestions = (prompt.match(/\?/g) || []).length > 1;
    const hasComplexWords = /\b(analyze|synthesize|integrate|optimize|strategize)\b/i.test(prompt);

    if (wordCount > 100 || hasMultipleQuestions || hasComplexWords) return 'high';
    if (wordCount > 50 || hasComplexWords) return 'medium';
    return 'low';
  }

  /**
   * Identify domain from concepts and task type
   */
  private identifyDomain(concepts: string[], taskType: string): string {
    const domainKeywords = {
      'finance': ['money', 'investment', 'budget', 'financial', 'cost', 'revenue', 'profit'],
      'health': ['health', 'fitness', 'wellness', 'medical', 'diet', 'exercise'],
      'travel': ['travel', 'destination', 'trip', 'vacation', 'flight', 'hotel'],
      'technology': ['tech', 'software', 'app', 'digital', 'ai', 'ml', 'data'],
      'business': ['business', 'strategy', 'market', 'customer', 'sales', 'growth'],
      'education': ['learn', 'study', 'education', 'course', 'skill', 'knowledge']
    };

    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      if (keywords.some(keyword => concepts.includes(keyword))) {
        return domain;
      }
    }

    // Fallback to task type
    return taskType.split('_')[0] || 'general';
  }

  /**
   * Get user personalization data
   */
  private async getUserPersonalization(context: PromptContext): Promise<any> {
    if (!context.userId) return {};

    // In production, this would fetch user preferences, history, etc.
    return {
      archetype: context.userArchetype,
      sessionId: context.sessionId,
      preferences: {} // Placeholder for user preferences
    };
  }

  /**
   * Calculate retrieval score based on memory relevance
   */
  private calculateRetrievalScore(relevantMemory: any[]): number {
    if (relevantMemory.length === 0) return 0;

    const avgScore = relevantMemory.reduce((sum, r) => sum + r.score, 0) / relevantMemory.length;
    const avgRelevance = relevantMemory.reduce((sum, r) => sum + r.relevance, 0) / relevantMemory.length;
    
    return (avgScore + avgRelevance) / 2;
  }

  /**
   * Calculate prompt quality metrics
   */
  private calculatePromptMetrics(
    originalPrompt: string,
    optimizedPrompt: string,
    relevantMemory: any[]
  ): { quality: number; tokensAdded: number } {
    const originalTokens = this.estimateTokens(originalPrompt);
    const optimizedTokens = this.estimateTokens(optimizedPrompt);
    const tokensAdded = optimizedTokens - originalTokens;

    // Quality score based on context richness and relevance
    let quality = 0.5; // Base quality
    
    // Context enhancement bonus
    if (relevantMemory.length > 0) quality += 0.2;
    if (relevantMemory.length > 3) quality += 0.1;
    
    // High-quality memory bonus
    const highQualityNodes = relevantMemory.filter(r => r.node.qualityScore > 0.8).length;
    quality += (highQualityNodes / relevantMemory.length) * 0.2;

    // Structure improvement bonus
    if (optimizedPrompt.includes('**Context')) quality += 0.1;
    if (optimizedPrompt.includes('**Instructions')) quality += 0.1;

    return {
      quality: Math.min(Math.max(quality, 0), 1),
      tokensAdded
    };
  }

  /**
   * Estimate token count (rough approximation)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4); // Rough approximation: 1 token ≈ 4 characters
  }

  /**
   * Log prompt optimization for analytics and learning
   */
  private async logPromptOptimization(context: PromptContext, result: RAGResult): Promise<void> {
    try {
      await db.insert(promptOptimizations).values({
        originalPrompt: context.originalPrompt,
        optimizedPrompt: result.optimizedPrompt,
        injectedNodes: result.injectedNodes,
        injectionStrategy: result.injectionStrategy,
        taskType: context.taskType,
        userContext: {
          userId: context.userId,
          userArchetype: context.userArchetype,
          sessionId: context.sessionId,
          metadata: context.metadata
        },
        retrievalScore: result.retrievalScore,
        promptQuality: result.promptQuality,
        executionTime: result.executionTime,
        tokensAdded: result.tokensAdded,
        agentId: null, // Will be set when agent is selected
        metadata: {
          strategy: result.injectionStrategy,
          nodeCount: result.injectedNodes.length
        }
      });

      // Track usage for injected nodes
      for (const nodeId of result.injectedNodes) {
        await knowledgeMemoryGraph.trackNodeUsage(
          nodeId,
          'prompt_injection',
          {
            userId: context.userId,
            userArchetype: context.userArchetype,
            sessionId: context.sessionId,
            taskType: context.taskType
          },
          {
            retrievalScore: result.retrievalScore,
            relevanceScore: result.promptQuality
          }
        );
      }

    } catch (error) {
      console.error('Error logging prompt optimization:', error);
    }
  }

  /**
   * Fallback optimization when main process fails
   */
  private fallbackOptimization(context: PromptContext, executionTime: number): RAGResult {
    const template = this.getBaseTemplate(context.taskType);
    const optimizedPrompt = this.injectTemplateContext(context.originalPrompt, template, context);
    
    return {
      optimizedPrompt,
      injectedNodes: [],
      injectionStrategy: 'template_fallback',
      retrievalScore: 0,
      promptQuality: 0.5,
      executionTime,
      tokensAdded: this.estimateTokens(optimizedPrompt) - this.estimateTokens(context.originalPrompt)
    };
  }

  /**
   * Initialize prompt templates for different task types
   */
  private initializePromptTemplates(): void {
    this.promptTemplates.set('content_generation', 
      'You are an expert content creator for the Findawise Empire. Create high-quality, engaging content that resonates with our audience and drives conversions.'
    );
    
    this.promptTemplates.set('analysis', 
      'You are a senior analyst for the Findawise Empire. Provide comprehensive, data-driven analysis with actionable insights and recommendations.'
    );
    
    this.promptTemplates.set('personalization', 
      'You are a personalization expert for the Findawise Empire. Tailor responses to individual user needs, preferences, and behavioral patterns.'
    );
    
    this.promptTemplates.set('optimization', 
      'You are an optimization specialist for the Findawise Empire. Focus on improving performance, efficiency, and ROI across all verticals.'
    );
    
    this.promptTemplates.set('default', 
      'You are an AI assistant for the Findawise Empire. Provide expert-level, actionable responses that align with our billion-dollar quality standards.'
    );
  }

  /**
   * Get base template for task type
   */
  private getBaseTemplate(taskType: string): string {
    return this.promptTemplates.get(taskType) || this.promptTemplates.get('default')!;
  }

  /**
   * Get relevant node types for domain and task
   */
  private getRelevantNodeTypes(domain: string, taskType: string): string[] {
    const nodeTypeMap: { [key: string]: string[] } = {
      'finance': ['blog_post', 'insight', 'product', 'experiment'],
      'health': ['blog_post', 'quiz', 'insight', 'user_journey'],
      'travel': ['blog_post', 'offer', 'insight', 'seo_data'],
      'technology': ['blog_post', 'product', 'experiment', 'insight'],
      'business': ['insight', 'experiment', 'blog_post', 'user_journey'],
      'education': ['blog_post', 'quiz', 'insight', 'user_journey']
    };

    return nodeTypeMap[domain] || ['blog_post', 'insight', 'experiment'];
  }

  /**
   * Deduplicate search results
   */
  private deduplicateResults(results: any[]): any[] {
    const seen = new Set<string>();
    return results.filter(result => {
      if (seen.has(result.node.nodeId)) return false;
      seen.add(result.node.nodeId);
      return true;
    });
  }

  /**
   * Rank results by context relevance
   */
  private async rankResultsByContext(
    results: any[],
    analysis: any,
    context: PromptContext
  ): Promise<any[]> {
    return results.sort((a, b) => {
      let scoreA = a.score + a.relevance;
      let scoreB = b.score + b.relevance;

      // Boost score for user archetype match
      if (a.node.userArchetype === context.userArchetype) scoreA += 0.2;
      if (b.node.userArchetype === context.userArchetype) scoreB += 0.2;

      // Boost score for domain relevance
      if (a.node.nodeType === analysis.domain) scoreA += 0.1;
      if (b.node.nodeType === analysis.domain) scoreB += 0.1;

      // Boost score for quality
      scoreA += (a.node.qualityScore - 0.5) * 0.3;
      scoreB += (b.node.qualityScore - 0.5) * 0.3;

      return scoreB - scoreA;
    });
  }

  /**
   * Get archetype-specific guidance
   */
  private getArchetypeGuidance(archetype: string): string {
    const archetypeGuidance: { [key: string]: string } = {
      'conservative_investor': 'Focus on low-risk, stable investment options with proven track records.',
      'aggressive_investor': 'Emphasize high-growth opportunities and advanced strategies.',
      'health_conscious': 'Prioritize evidence-based health information and preventive care.',
      'fitness_enthusiast': 'Include performance metrics and advanced training techniques.',
      'budget_traveler': 'Highlight cost-effective options and money-saving tips.',
      'luxury_traveler': 'Focus on premium experiences and high-end recommendations.',
      'tech_innovator': 'Emphasize cutting-edge technology and advanced features.',
      'security_focused': 'Prioritize safety, privacy, and risk mitigation strategies.'
    };

    return archetypeGuidance[archetype] || 'Provide personalized recommendations based on user preferences.';
  }

  /**
   * Check if word is a stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
      'can', 'may', 'might', 'must', 'shall', 'should', 'would', 'could'
    ]);
    return stopWords.has(word.toLowerCase());
  }
}

export const ragEnhancer = new RAGEnhancer();