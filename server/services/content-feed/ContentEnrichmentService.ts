// Content Enrichment Service - AI-powered content enhancement
import { ContentFeed, InsertContentFeed } from '@shared/contentFeedTables';
import { logger } from '../../utils/logger';

export interface EnrichmentResult {
  seoTitle?: string;
  metaDescription?: string;
  tags?: string[];
  category?: string;
  qualityScore?: number;
  sentiment?: 'positive' | 'negative' | 'neutral';
  competitorAnalysis?: any;
  pricingInsights?: any;
}

export class ContentEnrichmentService {
  private aiProvider: string;
  private enabled: boolean;

  constructor(aiProvider: string = 'openai', enabled: boolean = true) {
    this.aiProvider = aiProvider;
    this.enabled = enabled;
  }

  // Enrich content with AI-generated metadata
  async enrichContent(content: ContentFeed): Promise<EnrichmentResult> {
    if (!this.enabled) {
      return this.basicEnrichment(content);
    }

    try {
      const enrichment: EnrichmentResult = {};

      // Generate SEO-optimized title
      enrichment.seoTitle = await this.generateSEOTitle(content.title);
      
      // Generate meta description
      enrichment.metaDescription = await this.generateMetaDescription(content.description || '');
      
      // Extract and enhance tags
      enrichment.tags = await this.generateTags(content);
      
      // Auto-categorize content
      enrichment.category = await this.categorizeContent(content);
      
      // Calculate quality score
      enrichment.qualityScore = this.calculateQualityScore(content);
      
      // Sentiment analysis
      enrichment.sentiment = await this.analyzeSentiment(content.description || content.title);
      
      // Competitive analysis for offers
      if (content.contentType === 'offer' && content.price) {
        enrichment.competitorAnalysis = await this.analyzeCompetitors(content);
      }

      logger.info(`Content enrichment completed for ${content.id}`);
      return enrichment;

    } catch (error) {
      logger.error('Content enrichment failed:', error);
      return this.basicEnrichment(content);
    }
  }

  // Basic enrichment without AI
  private basicEnrichment(content: ContentFeed): EnrichmentResult {
    return {
      seoTitle: this.optimizeTitle(content.title),
      metaDescription: this.extractDescription(content.description || ''),
      tags: this.extractBasicTags(content.title + ' ' + (content.description || '')),
      qualityScore: this.calculateBasicQualityScore(content),
      sentiment: 'neutral'
    };
  }

  // Generate AI-powered SEO title
  private async generateSEOTitle(title: string): Promise<string> {
    // In production, this would call OpenAI or another AI service
    // For now, return optimized version of original title
    return this.optimizeTitle(title);
  }

  // Generate AI-powered meta description
  private async generateMetaDescription(content: string): Promise<string> {
    // Extract or generate compelling meta description
    const cleaned = content.replace(/<[^>]*>/g, '').trim();
    const firstSentence = cleaned.split('.')[0];
    return firstSentence.length > 160 ? firstSentence.substring(0, 157) + '...' : firstSentence;
  }

  // Generate relevant tags using AI
  private async generateTags(content: ContentFeed): Promise<string[]> {
    const basicTags = this.extractBasicTags(content.title + ' ' + (content.description || ''));
    
    // Add content-type specific tags
    const typeTags = [];
    if (content.contentType === 'offer') typeTags.push('deal', 'offer');
    if (content.contentType === 'product') typeTags.push('product', 'review');
    if (content.price && content.price > 0) typeTags.push('paid');
    
    return [...new Set([...basicTags, ...typeTags])].slice(0, 15);
  }

  // AI-powered content categorization
  private async categorizeContent(content: ContentFeed): Promise<string> {
    // Simple keyword-based categorization (would use AI in production)
    const text = (content.title + ' ' + (content.description || '')).toLowerCase();
    
    const categories = [
      { name: 'technology', keywords: ['tech', 'software', 'app', 'digital', 'ai', 'ml', 'saas'] },
      { name: 'health', keywords: ['health', 'fitness', 'wellness', 'medical', 'diet', 'exercise'] },
      { name: 'finance', keywords: ['finance', 'money', 'investment', 'trading', 'bank', 'loan'] },
      { name: 'education', keywords: ['education', 'course', 'learning', 'training', 'tutorial'] },
      { name: 'lifestyle', keywords: ['lifestyle', 'fashion', 'beauty', 'travel', 'food'] },
      { name: 'business', keywords: ['business', 'marketing', 'sales', 'entrepreneur', 'startup'] }
    ];

    for (const category of categories) {
      for (const keyword of category.keywords) {
        if (text.includes(keyword)) {
          return category.name;
        }
      }
    }

    return content.category || 'general';
  }

  // Sentiment analysis
  private async analyzeSentiment(text: string): Promise<'positive' | 'negative' | 'neutral'> {
    // Simple sentiment analysis (would use AI service in production)
    const positiveWords = ['great', 'excellent', 'amazing', 'best', 'love', 'awesome', 'fantastic'];
    const negativeWords = ['bad', 'terrible', 'worst', 'hate', 'awful', 'horrible', 'poor'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  // Competitive analysis for pricing
  private async analyzeCompetitors(content: ContentFeed): Promise<any> {
    // Would integrate with price comparison APIs in production
    return {
      averagePrice: content.price,
      priceRank: 'competitive',
      recommendations: ['Monitor price changes', 'Track competitor offers']
    };
  }

  // Optimize title for SEO
  private optimizeTitle(title: string): string {
    if (title.length > 60) {
      return title.substring(0, 57) + '...';
    }
    return title;
  }

  // Extract description from content
  private extractDescription(content: string): string {
    const cleaned = content.replace(/<[^>]*>/g, '').trim();
    const sentences = cleaned.split('. ');
    const description = sentences.slice(0, 2).join('. ');
    return description.length > 160 ? description.substring(0, 157) + '...' : description;
  }

  // Extract basic tags from text
  private extractBasicTags(text: string): string[] {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did'
    ]);
    
    const words = text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word));
    
    return [...new Set(words)].slice(0, 10);
  }

  // Calculate comprehensive quality score
  private calculateQualityScore(content: ContentFeed): number {
    let score = 0;
    
    // Title quality (0-20 points)
    if (content.title) {
      if (content.title.length >= 20 && content.title.length <= 60) score += 20;
      else if (content.title.length >= 10) score += 15;
      else score += 5;
    }
    
    // Description quality (0-25 points)
    if (content.description) {
      if (content.description.length >= 100) score += 25;
      else if (content.description.length >= 50) score += 20;
      else if (content.description.length >= 20) score += 10;
    }
    
    // Image presence (0-15 points)
    if (content.imageUrl) score += 15;
    
    // Price information (0-15 points)
    if (content.price && content.price > 0) {
      score += 10;
      if (content.originalPrice && content.originalPrice > content.price) score += 5;
    }
    
    // Merchant information (0-10 points)
    if (content.merchantName) score += 10;
    
    // Category (0-5 points)
    if (content.category) score += 5;
    
    // Affiliate URL (0-10 points)
    if (content.affiliateUrl) score += 10;
    
    return Math.min(100, score);
  }

  // Basic quality score calculation
  private calculateBasicQualityScore(content: ContentFeed): number {
    let score = 50; // Base score
    
    if (content.title && content.title.length > 20) score += 10;
    if (content.description && content.description.length > 50) score += 15;
    if (content.imageUrl) score += 10;
    if (content.price && content.price > 0) score += 10;
    if (content.merchantName) score += 5;
    
    return Math.min(100, Math.max(0, score));
  }
}