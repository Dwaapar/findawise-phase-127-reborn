// Content Enrichment Engine - AI-powered content enhancement and quality scoring
import { db } from "../../db";
import { contentFeed, type ContentFeed } from "../../../shared/contentFeedTables";
import { eq } from "drizzle-orm";
import OpenAI from "openai";

export interface EnrichmentResult {
  aiGeneratedContent: {
    seoTitle?: string;
    metaDescription?: string;
    enhancedDescription?: string;
    keyPoints?: string[];
    faq?: Array<{ question: string; answer: string }>;
    tags?: string[];
    category?: string;
    targetAudience?: string;
    competitiveAdvantages?: string[];
    useCases?: string[];
  };
  qualityScore: number;
  qualityFlags: string[];
  recommendations: string[];
}

export interface QualityMetrics {
  contentLength: number;
  titleQuality: number;
  descriptionQuality: number;
  imagePresence: number;
  priceAccuracy: number;
  categoryRelevance: number;
  freshnessScore: number;
  engagementPotential: number;
}

export class ContentEnrichmentEngine {
  private openai: OpenAI | null = null;

  constructor() {
    // Initialize OpenAI if API key is available
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  async enrichContent(contentId: number): Promise<EnrichmentResult | null> {
    try {
      console.log(`🧠 Enriching content ID: ${contentId}`);

      // Get content data
      const [content] = await db
        .select()
        .from(contentFeed)
        .where(eq(contentFeed.id, contentId))
        .limit(1);

      if (!content) {
        throw new Error(`Content with ID ${contentId} not found`);
      }

      // Calculate quality metrics
      const qualityMetrics = this.calculateQualityMetrics(content);
      
      // Calculate overall quality score
      const qualityScore = this.calculateQualityScore(qualityMetrics);
      
      // Generate quality flags and recommendations
      const { flags, recommendations } = this.generateQualityAnalysis(qualityMetrics, content);

      // Generate AI-enhanced content if OpenAI is available
      let aiGeneratedContent = {};
      
      if (this.openai && !content.aiEnriched) {
        aiGeneratedContent = await this.generateEnhancedContent(content);
      }

      const enrichmentResult: EnrichmentResult = {
        aiGeneratedContent,
        qualityScore,
        qualityFlags: flags,
        recommendations
      };

      // Update content with enrichment data
      await db
        .update(contentFeed)
        .set({
          qualityScore: qualityScore.toString(),
          aiEnriched: Object.keys(aiGeneratedContent).length > 0,
          aiGeneratedContent,
          aiQualityFlags: flags,
          updatedAt: new Date()
        })
        .where(eq(contentFeed.id, contentId));

      console.log(`✅ Content enriched with quality score: ${qualityScore}`);
      return enrichmentResult;

    } catch (error) {
      console.error('Error enriching content:', error);
      return null;
    }
  }

  private calculateQualityMetrics(content: ContentFeed): QualityMetrics {
    const metrics: QualityMetrics = {
      contentLength: 0,
      titleQuality: 0,
      descriptionQuality: 0,
      imagePresence: 0,
      priceAccuracy: 0,
      categoryRelevance: 0,
      freshnessScore: 0,
      engagementPotential: 0
    };

    // Content length score (0-100)
    const contentLength = (content.content?.length || 0) + (content.description?.length || 0);
    metrics.contentLength = Math.min(contentLength / 1000 * 100, 100);

    // Title quality (0-100)
    if (content.title) {
      const titleLength = content.title.length;
      const hasNumbers = /\d/.test(content.title);
      const hasActionWords = /\b(best|top|guide|how to|ultimate|complete|review)\b/i.test(content.title);
      
      metrics.titleQuality = Math.min(
        (titleLength >= 30 && titleLength <= 60 ? 40 : 20) +
        (hasNumbers ? 20 : 0) +
        (hasActionWords ? 40 : 0),
        100
      );
    }

    // Description quality (0-100)
    if (content.description) {
      const descLength = content.description.length;
      const hasBenefits = /\b(benefit|advantage|feature|save|improve|increase)\b/i.test(content.description);
      const hasCTA = /\b(get|buy|try|download|sign up|start)\b/i.test(content.description);
      
      metrics.descriptionQuality = Math.min(
        (descLength >= 100 && descLength <= 300 ? 50 : 25) +
        (hasBenefits ? 25 : 0) +
        (hasCTA ? 25 : 0),
        100
      );
    }

    // Image presence (0-100)
    const imageCount = (content.images as any)?.length || (content.imageUrl ? 1 : 0);
    metrics.imagePresence = Math.min(imageCount * 50, 100);

    // Price accuracy (0-100)
    if (content.contentType === 'offer' || content.contentType === 'product') {
      if (content.price && content.price > 0) {
        metrics.priceAccuracy = 60;
        if (content.originalPrice && content.originalPrice > content.price) {
          metrics.priceAccuracy = 80;
        }
        if (content.discount && content.discount > 0) {
          metrics.priceAccuracy = 100;
        }
      }
    } else {
      metrics.priceAccuracy = 100; // N/A for non-product content
    }

    // Category relevance (0-100)
    metrics.categoryRelevance = content.category ? 80 : 20;

    // Freshness score (0-100)
    const daysSinceCreated = content.createdAt 
      ? Math.floor((Date.now() - content.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      : 365;
    metrics.freshnessScore = Math.max(100 - (daysSinceCreated * 2), 0);

    // Engagement potential (0-100)
    const ctr = Number(content.ctr) || 0;
    const conversionRate = Number(content.conversionRate) || 0;
    const rating = Number(content.rating) || 0;
    
    metrics.engagementPotential = Math.min(
      (ctr * 1000) + // CTR weight
      (conversionRate * 500) + // Conversion weight
      (rating * 20), // Rating weight
      100
    );

    return metrics;
  }

  private calculateQualityScore(metrics: QualityMetrics): number {
    const weights = {
      contentLength: 0.15,
      titleQuality: 0.20,
      descriptionQuality: 0.15,
      imagePresence: 0.10,
      priceAccuracy: 0.15,
      categoryRelevance: 0.10,
      freshnessScore: 0.10,
      engagementPotential: 0.05
    };

    const weightedScore = Object.entries(weights).reduce((total, [metric, weight]) => {
      return total + (metrics[metric as keyof QualityMetrics] * weight);
    }, 0);

    return Math.round(Math.min(Math.max(weightedScore, 0), 100) * 100) / 100;
  }

  private generateQualityAnalysis(metrics: QualityMetrics, content: ContentFeed): { flags: string[], recommendations: string[] } {
    const flags: string[] = [];
    const recommendations: string[] = [];

    // Content length analysis
    if (metrics.contentLength < 30) {
      flags.push('insufficient_content');
      recommendations.push('Add more detailed content and description');
    }

    // Title quality analysis
    if (metrics.titleQuality < 50) {
      flags.push('weak_title');
      recommendations.push('Improve title with action words, numbers, or benefit-focused language');
    }

    // Description analysis
    if (metrics.descriptionQuality < 40) {
      flags.push('weak_description');
      recommendations.push('Enhance description with benefits, features, and clear call-to-action');
    }

    // Image analysis
    if (metrics.imagePresence < 50) {
      flags.push('missing_images');
      recommendations.push('Add high-quality images to improve visual appeal');
    }

    // Price analysis
    if (content.contentType === 'offer' && metrics.priceAccuracy < 60) {
      flags.push('incomplete_pricing');
      recommendations.push('Add complete pricing information including discounts');
    }

    // Category analysis
    if (!content.category) {
      flags.push('missing_category');
      recommendations.push('Assign appropriate category for better organization');
    }

    // Freshness analysis
    if (metrics.freshnessScore < 30) {
      flags.push('outdated_content');
      recommendations.push('Update content with fresh information and current data');
    }

    // Engagement analysis
    if (metrics.engagementPotential < 20) {
      flags.push('low_engagement');
      recommendations.push('Optimize for better engagement with compelling headlines and offers');
    }

    return { flags, recommendations };
  }

  private async generateEnhancedContent(content: ContentFeed): Promise<any> {
    if (!this.openai) {
      return {};
    }

    try {
      const prompt = this.buildEnrichmentPrompt(content);
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert content marketing specialist. Generate enhanced content that improves SEO, engagement, and conversion potential. Return valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      });

      const aiResponse = completion.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error('No AI response received');
      }

      // Parse JSON response
      try {
        const enhancedContent = JSON.parse(aiResponse);
        return enhancedContent;
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        return {};
      }

    } catch (error) {
      console.error('Error generating enhanced content:', error);
      return {};
    }
  }

  private buildEnrichmentPrompt(content: ContentFeed): string {
    return `
Enhance this ${content.contentType} content for maximum SEO and engagement:

Title: ${content.title}
Description: ${content.description || 'N/A'}
Category: ${content.category || 'N/A'}
Content: ${content.content?.substring(0, 500) || 'N/A'}
Price: ${content.price || 'N/A'}
Merchant: ${content.merchantName || 'N/A'}

Generate enhanced content in this exact JSON format:
{
  "seoTitle": "SEO-optimized title (50-60 chars)",
  "metaDescription": "Compelling meta description (150-160 chars)",
  "enhancedDescription": "Improved description with benefits and features",
  "keyPoints": ["key benefit 1", "key benefit 2", "key benefit 3"],
  "faq": [
    {"question": "Common question 1", "answer": "Helpful answer"},
    {"question": "Common question 2", "answer": "Helpful answer"}
  ],
  "tags": ["relevant", "tag", "keywords"],
  "targetAudience": "Primary target audience description",
  "competitiveAdvantages": ["advantage 1", "advantage 2"],
  "useCases": ["use case 1", "use case 2"]
}

Focus on conversion optimization, user intent, and search visibility.
    `.trim();
  }

  async batchEnrichContent(contentIds: number[]): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = { success: 0, failed: 0, errors: [] as string[] };

    console.log(`🔄 Starting batch enrichment for ${contentIds.length} items`);

    for (const contentId of contentIds) {
      try {
        await this.enrichContent(contentId);
        results.success++;
        
        // Add small delay to avoid API rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        results.failed++;
        results.errors.push(`Content ${contentId}: ${(error as Error).message}`);
        console.error(`Error enriching content ${contentId}:`, error);
      }
    }

    console.log(`✅ Batch enrichment complete: ${results.success} success, ${results.failed} failed`);
    return results;
  }

  async getQualityReport(contentIds?: number[]): Promise<{
    avgQualityScore: number;
    distributionByScore: { range: string; count: number }[];
    commonFlags: { flag: string; count: number }[];
    topRecommendations: { recommendation: string; count: number }[];
  }> {
    try {
      let query = db.select().from(contentFeed);
      
      if (contentIds?.length) {
        query = query.where(eq(contentFeed.id, contentIds[0])); // Simplified for example
      }

      const contents = await query.limit(1000);

      const qualityScores = contents
        .map(c => Number(c.qualityScore) || 0)
        .filter(score => score > 0);

      const avgQualityScore = qualityScores.length > 0 
        ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length 
        : 0;

      // Distribution by score ranges
      const distributionByScore = [
        { range: '90-100', count: qualityScores.filter(s => s >= 90).length },
        { range: '80-89', count: qualityScores.filter(s => s >= 80 && s < 90).length },
        { range: '70-79', count: qualityScores.filter(s => s >= 70 && s < 80).length },
        { range: '60-69', count: qualityScores.filter(s => s >= 60 && s < 70).length },
        { range: '0-59', count: qualityScores.filter(s => s < 60).length }
      ];

      // Common flags analysis
      const flagCounts = new Map<string, number>();
      contents.forEach(content => {
        const flags = content.aiQualityFlags as string[] || [];
        flags.forEach(flag => {
          flagCounts.set(flag, (flagCounts.get(flag) || 0) + 1);
        });
      });

      const commonFlags = Array.from(flagCounts.entries())
        .map(([flag, count]) => ({ flag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Mock recommendations for now
      const topRecommendations = [
        { recommendation: 'Add more detailed content and description', count: flagCounts.get('insufficient_content') || 0 },
        { recommendation: 'Improve title with action words and benefits', count: flagCounts.get('weak_title') || 0 },
        { recommendation: 'Add high-quality images', count: flagCounts.get('missing_images') || 0 }
      ].filter(r => r.count > 0);

      return {
        avgQualityScore: Math.round(avgQualityScore * 100) / 100,
        distributionByScore,
        commonFlags,
        topRecommendations
      };

    } catch (error) {
      console.error('Error generating quality report:', error);
      return {
        avgQualityScore: 0,
        distributionByScore: [],
        commonFlags: [],
        topRecommendations: []
      };
    }
  }
}