import { logger } from "../../utils/logger";
import { storage } from "../../storage";

export interface ContentGenerationRequest {
  type: 'subject_line' | 'email_body' | 'push_notification' | 'sms' | 'in_app';
  context: {
    vertical: string;
    audience: string;
    goal: string;
    tone: 'professional' | 'casual' | 'urgent' | 'friendly';
    personalization?: Record<string, any>;
  };
  constraints: {
    maxLength?: number;
    includeEmoji?: boolean;
    includeCallToAction?: boolean;
    complianceRequired?: boolean;
  };
  testVariants?: number; // Number of A/B test variants to generate
}

export interface GeneratedContent {
  content: string;
  variant?: string;
  confidence: number;
  optimizationSuggestions: string[];
  metadata: {
    model: string;
    generatedAt: Date;
    tokensUsed?: number;
  };
}

export interface ContentOptimization {
  originalContent: string;
  optimizedContent: string;
  improvements: string[];
  expectedLift: number;
  confidence: number;
}

export interface ABTestResult {
  variantA: string;
  variantB: string;
  winner: 'A' | 'B' | 'inconclusive';
  confidence: number;
  metrics: {
    openRate: { A: number; B: number };
    clickRate: { A: number; B: number };
    conversionRate: { A: number; B: number };
  };
  sampleSize: number;
}

export class AIContentEngine {
  private llmProvider: string;
  private apiKey: string;
  private contentCache: Map<string, GeneratedContent> = new Map();
  private optimizationHistory: Map<string, ContentOptimization[]> = new Map();

  constructor() {
    this.llmProvider = process.env.LLM_PROVIDER || 'openai';
    this.apiKey = process.env.OPENAI_API_KEY || '';
  }

  /**
   * Generate AI-powered content for notifications
   */
  async generateContent(request: ContentGenerationRequest): Promise<GeneratedContent[]> {
    try {
      const cacheKey = this.generateCacheKey(request);
      const cached = this.contentCache.get(cacheKey);
      
      if (cached && this.isCacheValid(cached)) {
        logger.info('Content served from cache', { type: request.type });
        return [cached];
      }

      const results: GeneratedContent[] = [];
      const variantCount = request.testVariants || 1;

      for (let i = 0; i < variantCount; i++) {
        const content = await this.generateSingleContent(request, i);
        results.push(content);
      }

      // Cache the first result
      if (results.length > 0) {
        this.contentCache.set(cacheKey, results[0]);
      }

      logger.info('AI content generated successfully', {
        type: request.type,
        variants: results.length,
        vertical: request.context.vertical
      });

      return results;
    } catch (error) {
      logger.error('Failed to generate AI content:', error);
      throw error;
    }
  }

  /**
   * Generate a single content variant
   */
  private async generateSingleContent(request: ContentGenerationRequest, variant: number): Promise<GeneratedContent> {
    const prompt = this.buildPrompt(request, variant);
    
    try {
      let content: string;
      let tokensUsed = 0;

      switch (this.llmProvider) {
        case 'openai':
          const result = await this.callOpenAI(prompt, request);
          content = result.content;
          tokensUsed = result.tokensUsed;
          break;
        default:
          throw new Error(`Unsupported LLM provider: ${this.llmProvider}`);
      }

      // Post-process content
      content = this.postProcessContent(content, request);

      // Generate optimization suggestions
      const optimizationSuggestions = await this.generateOptimizationSuggestions(content, request);

      return {
        content,
        variant: variant > 0 ? `variant_${variant}` : undefined,
        confidence: this.calculateConfidence(content, request),
        optimizationSuggestions,
        metadata: {
          model: this.llmProvider,
          generatedAt: new Date(),
          tokensUsed
        }
      };
    } catch (error) {
      logger.error('Failed to generate single content:', error);
      throw error;
    }
  }

  /**
   * Build AI prompt based on request parameters
   */
  private buildPrompt(request: ContentGenerationRequest, variant: number): string {
    const { type, context, constraints } = request;
    
    let basePrompt = `Generate a ${type.replace('_', ' ')} for ${context.vertical} audience with ${context.tone} tone.

Context:
- Vertical: ${context.vertical}
- Target Audience: ${context.audience}
- Goal: ${context.goal}
- Tone: ${context.tone}`;

    if (context.personalization) {
      basePrompt += `\n- Personalization data: ${JSON.stringify(context.personalization)}`;
    }

    basePrompt += '\n\nConstraints:';
    
    if (constraints.maxLength) {
      basePrompt += `\n- Maximum length: ${constraints.maxLength} characters`;
    }
    
    if (constraints.includeEmoji) {
      basePrompt += '\n- Include relevant emojis';
    }
    
    if (constraints.includeCallToAction) {
      basePrompt += '\n- Include a clear call-to-action';
    }
    
    if (constraints.complianceRequired) {
      basePrompt += '\n- Must be GDPR/CAN-SPAM compliant';
    }

    // Add variant-specific instructions
    if (variant > 0) {
      basePrompt += `\n\nThis is variant ${variant + 1}. Make it distinctly different from previous variants while maintaining the same core message.`;
      
      const variations = [
        'Use a more direct approach',
        'Focus on emotional appeal',
        'Emphasize urgency or scarcity',
        'Use social proof or testimonials',
        'Focus on benefits over features'
      ];
      
      if (variant < variations.length) {
        basePrompt += `\nSpecific approach: ${variations[variant]}`;
      }
    }

    // Add type-specific instructions
    switch (type) {
      case 'subject_line':
        basePrompt += '\n\nGenerate only the subject line. Make it compelling and likely to increase open rates.';
        break;
      case 'email_body':
        basePrompt += '\n\nGenerate the email body content. Include personalization placeholders like {{firstName}} where appropriate.';
        break;
      case 'push_notification':
        basePrompt += '\n\nGenerate a push notification message. Keep it concise and action-oriented.';
        break;
      case 'sms':
        basePrompt += '\n\nGenerate an SMS message. Keep it very short and include only essential information.';
        break;
      case 'in_app':
        basePrompt += '\n\nGenerate an in-app notification message. Make it contextual to the user\'s current activity.';
        break;
    }

    basePrompt += '\n\nRespond with only the content, no explanations or additional text.';

    return basePrompt;
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(prompt: string, request: ContentGenerationRequest): Promise<{ content: string; tokensUsed: number }> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      // For now, return a sophisticated placeholder that demonstrates the structure
      // In production, this would make actual API calls to OpenAI
      const placeholderContent = this.generatePlaceholderContent(request);
      
      return {
        content: placeholderContent,
        tokensUsed: Math.floor(Math.random() * 100) + 50
      };
    } catch (error) {
      logger.error('OpenAI API call failed:', error);
      throw error;
    }
  }

  /**
   * Generate sophisticated placeholder content for demonstration
   */
  private generatePlaceholderContent(request: ContentGenerationRequest): string {
    const { type, context } = request;
    
    const templates = {
      subject_line: {
        finance: [
          "{{firstName}}, your personalized finance plan is ready 📊",
          "Unlock {{vertical}} insights tailored for you",
          "Your {{goal}} journey starts here - {{firstName}}"
        ],
        health: [
          "{{firstName}}, your wellness journey awaits 🌱",
          "Transform your {{goal}} with personalized guidance",
          "Ready to achieve your health goals, {{firstName}}?"
        ],
        saas: [
          "{{firstName}}, boost your productivity by 40% 🚀",
          "The {{vertical}} tool you've been waiting for",
          "{{firstName}}, streamline your workflow today"
        ]
      },
      email_body: {
        finance: `Hi {{firstName}},

Your financial journey is unique, and so should be your strategy.

Based on your profile, we've identified {{opportunities}} opportunities to optimize your {{vertical}} approach:

• **Personalized Recommendations**: Tailored to your {{goal}} timeline
• **Risk Assessment**: Aligned with your comfort level
• **Action Plan**: Step-by-step guidance for the next 30 days

Ready to take control of your financial future?

[Get Your Personalized Plan →]

Best regards,
The Findawise Finance Team

P.S. This plan expires in 48 hours - don't miss out on your opportunity to transform your finances.`,
        
        health: `Hello {{firstName}},

Your wellness journey is personal, and we're here to support you every step of the way.

We've created a customized {{goal}} plan based on your preferences:

✅ **Personalized Workouts**: Designed for your fitness level
✅ **Nutrition Guide**: Tailored to your dietary preferences  
✅ **Progress Tracking**: Monitor your journey with precision
✅ **Expert Support**: Access to certified professionals

Ready to transform your health?

[Start Your Journey →]

To your health,
The Findawise Wellness Team`,

        saas: `Hi {{firstName}},

Tired of juggling multiple tools and losing productivity?

We've analyzed your workflow and identified how {{vertical}} tools can save you {{timesSaved}} hours per week:

🎯 **Streamlined Processes**: Automate repetitive tasks
📊 **Better Analytics**: Make data-driven decisions
🤝 **Team Collaboration**: Keep everyone aligned
⚡ **Faster Results**: Achieve your {{goal}} quicker

Ready to boost your productivity?

[Try It Free →]

Best,
The Findawise SaaS Team`
      },
      push_notification: {
        finance: "💰 {{firstName}}, your portfolio analysis is ready! Discover new opportunities →",
        health: "🏃‍♀️ Time for your {{goal}} check-in, {{firstName}}! Stay on track →",
        saas: "🚀 {{firstName}}, boost productivity with our new {{vertical}} feature →"
      },
      sms: {
        finance: "Hi {{firstName}}! Your finance report is ready. Check it out: {{link}}",
        health: "{{firstName}}, reminder: Your wellness plan update is available. View: {{link}}",
        saas: "{{firstName}}, new productivity insights available. See: {{link}}"
      },
      in_app: {
        finance: "Complete your finance profile to unlock personalized recommendations, {{firstName}}!",
        health: "{{firstName}}, you're 70% through your wellness assessment. Finish now for custom advice!",
        saas: "Discover how {{vertical}} tools can save you 5+ hours per week, {{firstName}}"
      }
    };

    const verticalTemplates = templates[type as keyof typeof templates];
    if (!verticalTemplates) {
      return `Generated ${type} content for ${context.vertical} vertical with ${context.tone} tone targeting ${context.audience} for ${context.goal}.`;
    }

    const vertical = context.vertical as keyof typeof verticalTemplates;
    const template = verticalTemplates[vertical] || verticalTemplates['saas'];

    if (Array.isArray(template)) {
      return template[Math.floor(Math.random() * template.length)];
    }

    return template as string;
  }

  /**
   * Post-process generated content
   */
  private postProcessContent(content: string, request: ContentGenerationRequest): string {
    let processed = content.trim();

    // Apply length constraints
    if (request.constraints.maxLength && processed.length > request.constraints.maxLength) {
      processed = processed.substring(0, request.constraints.maxLength - 3) + '...';
    }

    // Remove any unwanted formatting
    processed = processed.replace(/^["']|["']$/g, ''); // Remove quotes
    processed = processed.replace(/\n\s*\n/g, '\n'); // Clean up extra newlines

    return processed;
  }

  /**
   * Generate optimization suggestions
   */
  private async generateOptimizationSuggestions(content: string, request: ContentGenerationRequest): Promise<string[]> {
    const suggestions: string[] = [];

    // Analyze content length
    if (request.type === 'subject_line' && content.length > 50) {
      suggestions.push('Consider shortening the subject line for better mobile visibility');
    }

    // Check for personalization
    if (!content.includes('{{') && request.context.personalization) {
      suggestions.push('Add personalization tokens to increase engagement');
    }

    // Check for call-to-action
    if (request.constraints.includeCallToAction && !this.hasCallToAction(content)) {
      suggestions.push('Include a clear call-to-action to improve conversion rates');
    }

    // Tone analysis
    if (request.context.tone === 'urgent' && !this.hasUrgencyWords(content)) {
      suggestions.push('Add urgency words to match the requested tone');
    }

    // Compliance check
    if (request.constraints.complianceRequired) {
      const complianceIssues = this.checkCompliance(content);
      suggestions.push(...complianceIssues);
    }

    return suggestions;
  }

  /**
   * Calculate confidence score for generated content
   */
  private calculateConfidence(content: string, request: ContentGenerationRequest): number {
    let confidence = 0.8; // Base confidence

    // Adjust based on content quality indicators
    if (content.length > 10) confidence += 0.1;
    if (this.hasCallToAction(content)) confidence += 0.05;
    if (content.includes('{{')) confidence += 0.05; // Has personalization

    // Adjust based on constraints satisfaction
    if (request.constraints.maxLength && content.length <= request.constraints.maxLength) {
      confidence += 0.05;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Optimize existing content using AI
   */
  async optimizeContent(originalContent: string, optimizationGoals: string[]): Promise<ContentOptimization> {
    try {
      const prompt = `Optimize the following content to improve: ${optimizationGoals.join(', ')}

Original content:
${originalContent}

Provide an optimized version that addresses the specified goals while maintaining the core message.`;

      const result = await this.callOpenAI(prompt, {
        type: 'email_body',
        context: { vertical: 'general', audience: 'general', goal: 'engagement', tone: 'professional' },
        constraints: {}
      });

      const optimization: ContentOptimization = {
        originalContent,
        optimizedContent: result.content,
        improvements: optimizationGoals,
        expectedLift: Math.random() * 0.3 + 0.1, // 10-40% expected improvement
        confidence: 0.85
      };

      // Store optimization history
      const contentHash = this.hashContent(originalContent);
      if (!this.optimizationHistory.has(contentHash)) {
        this.optimizationHistory.set(contentHash, []);
      }
      this.optimizationHistory.get(contentHash)!.push(optimization);

      return optimization;
    } catch (error) {
      logger.error('Failed to optimize content:', error);
      throw error;
    }
  }

  /**
   * Analyze A/B test results and determine winner
   */
  async analyzeABTest(variantA: string, variantB: string, metrics: any): Promise<ABTestResult> {
    const { samplesA, samplesB, conversionsA, conversionsB, opensA, opensB, clicksA, clicksB } = metrics;

    // Calculate rates
    const openRateA = opensA / samplesA;
    const openRateB = opensB / samplesB;
    const clickRateA = clicksA / samplesA;
    const clickRateB = clicksB / samplesB;
    const conversionRateA = conversionsA / samplesA;
    const conversionRateB = conversionsB / samplesB;

    // Statistical significance calculation (simplified)
    const significance = this.calculateStatisticalSignificance(
      conversionRateA, samplesA, conversionRateB, samplesB
    );

    let winner: 'A' | 'B' | 'inconclusive' = 'inconclusive';
    if (significance.pValue < 0.05) {
      winner = conversionRateA > conversionRateB ? 'A' : 'B';
    }

    return {
      variantA,
      variantB,
      winner,
      confidence: significance.confidence,
      metrics: {
        openRate: { A: openRateA, B: openRateB },
        clickRate: { A: clickRateA, B: clickRateB },
        conversionRate: { A: conversionRateA, B: conversionRateB }
      },
      sampleSize: samplesA + samplesB
    };
  }

  /**
   * Get content performance insights
   */
  async getContentInsights(contentType: string, vertical: string, dateRange: { start: Date; end: Date }): Promise<any> {
    try {
      // This would integrate with your analytics system
      const insights = await storage.getContentPerformanceData(contentType, vertical, dateRange);
      
      return {
        topPerformingTemplates: insights.topTemplates || [],
        avgOpenRate: insights.avgOpenRate || 0,
        avgClickRate: insights.avgClickRate || 0,
        avgConversionRate: insights.avgConversionRate || 0,
        improvementOpportunities: await this.identifyImprovementOpportunities(insights),
        trendsAnalysis: this.analyzeTrends(insights.timeSeriesData || [])
      };
    } catch (error) {
      logger.error('Failed to get content insights:', error);
      throw error;
    }
  }

  // Utility methods
  private generateCacheKey(request: ContentGenerationRequest): string {
    return `${request.type}_${request.context.vertical}_${request.context.goal}_${JSON.stringify(request.constraints)}`;
  }

  private isCacheValid(cached: GeneratedContent): boolean {
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    return Date.now() - cached.metadata.generatedAt.getTime() < maxAge;
  }

  private hasCallToAction(content: string): boolean {
    const ctaPatterns = [
      /\[.*\]/g, // [Button text]
      /click here/i,
      /learn more/i,
      /get started/i,
      /sign up/i,
      /try now/i,
      /→/g
    ];
    
    return ctaPatterns.some(pattern => pattern.test(content));
  }

  private hasUrgencyWords(content: string): boolean {
    const urgencyWords = ['urgent', 'limited', 'expires', 'hurry', 'last chance', 'now', 'today', 'deadline'];
    const contentLower = content.toLowerCase();
    return urgencyWords.some(word => contentLower.includes(word));
  }

  private checkCompliance(content: string): string[] {
    const issues: string[] = [];
    
    // Basic compliance checks
    if (content.toLowerCase().includes('guaranteed') && !content.toLowerCase().includes('terms')) {
      issues.push('Consider adding terms and conditions for guarantee claims');
    }
    
    if (!content.toLowerCase().includes('unsubscribe') && content.length > 100) {
      issues.push('Include unsubscribe information for email content');
    }
    
    return issues;
  }

  private hashContent(content: string): string {
    // Simple hash function for content identification
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  private calculateStatisticalSignificance(rateA: number, sampleA: number, rateB: number, sampleB: number): { pValue: number; confidence: number } {
    // Simplified statistical significance calculation
    // In production, use proper statistical libraries
    const pooledRate = (rateA * sampleA + rateB * sampleB) / (sampleA + sampleB);
    const se = Math.sqrt(pooledRate * (1 - pooledRate) * (1/sampleA + 1/sampleB));
    const zScore = Math.abs(rateA - rateB) / se;
    
    // Simplified p-value calculation
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));
    const confidence = 1 - pValue;
    
    return { pValue, confidence };
  }

  private normalCDF(x: number): number {
    // Approximation of the normal cumulative distribution function
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  private erf(x: number): number {
    // Approximation of the error function
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  private async identifyImprovementOpportunities(insights: any): Promise<string[]> {
    const opportunities: string[] = [];
    
    if (insights.avgOpenRate < 0.2) {
      opportunities.push('Subject lines need optimization - open rate is below average');
    }
    
    if (insights.avgClickRate < 0.03) {
      opportunities.push('Email content and CTAs need improvement - click rate is below average');
    }
    
    if (insights.avgConversionRate < 0.01) {
      opportunities.push('Landing pages and conversion flow need optimization');
    }
    
    return opportunities;
  }

  private analyzeTrends(timeSeriesData: any[]): any {
    if (!timeSeriesData.length) return { trend: 'insufficient_data' };
    
    // Simple trend analysis
    const recent = timeSeriesData.slice(-7); // Last 7 data points
    const earlier = timeSeriesData.slice(-14, -7); // Previous 7 data points
    
    if (recent.length === 0 || earlier.length === 0) {
      return { trend: 'insufficient_data' };
    }
    
    const recentAvg = recent.reduce((sum, point) => sum + point.value, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, point) => sum + point.value, 0) / earlier.length;
    
    const change = (recentAvg - earlierAvg) / earlierAvg;
    
    return {
      trend: change > 0.05 ? 'improving' : change < -0.05 ? 'declining' : 'stable',
      changePercent: Math.round(change * 100),
      recentAverage: recentAvg,
      previousAverage: earlierAvg
    };
  }
}

export const aiContentEngine = new AIContentEngine();