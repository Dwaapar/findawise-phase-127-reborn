import { AnalyticsData } from '../services/analytics/fetch';

export interface RankingElement {
  id: string;
  type: 'page' | 'emotion' | 'cta' | 'offer' | 'module';
  score: number;
  confidence: number;
  recommendation: 'promote' | 'maintain' | 'needs_improvement' | 'demote';
  trend: 'improving' | 'stable' | 'declining';
  metrics: {
    impressions: number;
    clicks: number;
    ctr: number;
    engagement: number;
    conversions?: number;
  };
  reasons: string[];
  recommendations: string[];
}

export interface RankingThresholds {
  minImpressions: number;
  minCTR: number;
  minEngagement: number;
  minConfidence?: number;
}

class RankerService {
  private readonly PERFORMANCE_WEIGHTS = {
    ctr: 0.4,
    engagement: 0.3,
    conversions: 0.2,
    impressions: 0.1
  };

  private readonly TREND_WEIGHTS = {
    improving: 1.2,
    stable: 1.0,
    declining: 0.8
  };

  /**
   * Rank all elements by performance
   */
  async rankElements(analyticsData: AnalyticsData, thresholds: RankingThresholds): Promise<RankingElement[]> {
    const elements: RankingElement[] = [];

    // Rank pages
    for (const page of analyticsData.pages) {
      const element = this.rankPage(page, thresholds);
      elements.push(element);
    }

    // Rank emotions
    for (const emotion of analyticsData.emotions) {
      const element = this.rankEmotion(emotion, thresholds);
      elements.push(element);
    }

    // Rank CTAs
    for (const cta of analyticsData.ctas) {
      const element = this.rankCTA(cta, thresholds);
      elements.push(element);
    }

    // Rank offers
    for (const offer of analyticsData.offers) {
      const element = this.rankOffer(offer, thresholds);
      elements.push(element);
    }

    // Rank modules
    for (const module of analyticsData.modules) {
      const element = this.rankModule(module, thresholds);
      elements.push(element);
    }

    // Sort by score descending
    elements.sort((a, b) => b.score - a.score);

    return elements;
  }

  /**
   * Rank individual page
   */
  private rankPage(page: any, thresholds: RankingThresholds): RankingElement {
    const metrics = {
      impressions: page.metrics.impressions,
      clicks: page.metrics.clicks,
      ctr: page.metrics.ctr,
      engagement: page.metrics.engagement,
      conversions: page.metrics.conversion
    };

    const score = this.calculatePerformanceScore(metrics, thresholds);
    const confidence = this.calculateConfidence(metrics, thresholds);
    const recommendation = this.getRecommendation(score, confidence, thresholds);
    const trend = this.getTrendFromString(page.trend);

    const reasons = this.generateReasons(metrics, thresholds, 'page');
    const recommendations = this.generateRecommendations(metrics, thresholds, 'page');

    return {
      id: page.slug,
      type: 'page',
      score,
      confidence,
      recommendation,
      trend,
      metrics,
      reasons,
      recommendations
    };
  }

  /**
   * Rank individual emotion
   */
  private rankEmotion(emotion: any, thresholds: RankingThresholds): RankingElement {
    const metrics = {
      impressions: emotion.metrics.totalImpressions,
      clicks: emotion.metrics.totalClicks,
      ctr: emotion.metrics.averageCTR,
      engagement: emotion.metrics.averageEngagement,
      conversions: emotion.metrics.averageConversion
    };

    const score = this.calculatePerformanceScore(metrics, thresholds);
    const confidence = this.calculateConfidence(metrics, thresholds);
    const recommendation = this.getRecommendation(score, confidence, thresholds);
    const trend = this.getTrendFromString(emotion.trend);

    const reasons = this.generateReasons(metrics, thresholds, 'emotion');
    const recommendations = this.generateRecommendations(metrics, thresholds, 'emotion');

    return {
      id: emotion.name,
      type: 'emotion',
      score,
      confidence,
      recommendation,
      trend,
      metrics,
      reasons,
      recommendations
    };
  }

  /**
   * Rank individual CTA
   */
  private rankCTA(cta: any, thresholds: RankingThresholds): RankingElement {
    const metrics = {
      impressions: cta.metrics.impressions,
      clicks: cta.metrics.clicks,
      ctr: cta.metrics.ctr,
      engagement: cta.metrics.ctr, // CTAs don't have engagement, use CTR as proxy
      conversions: cta.metrics.conversions
    };

    const score = this.calculatePerformanceScore(metrics, thresholds);
    const confidence = this.calculateConfidence(metrics, thresholds);
    const recommendation = this.getRecommendation(score, confidence, thresholds);
    const trend = this.getTrendFromString(cta.trend);

    const reasons = this.generateReasons(metrics, thresholds, 'cta');
    const recommendations = this.generateRecommendations(metrics, thresholds, 'cta');

    return {
      id: cta.text,
      type: 'cta',
      score,
      confidence,
      recommendation,
      trend,
      metrics,
      reasons,
      recommendations
    };
  }

  /**
   * Rank individual offer
   */
  private rankOffer(offer: any, thresholds: RankingThresholds): RankingElement {
    const metrics = {
      impressions: offer.metrics.impressions,
      clicks: offer.metrics.clicks,
      ctr: offer.metrics.ctr,
      engagement: offer.metrics.ctr, // Offers don't have engagement, use CTR as proxy
      conversions: offer.metrics.conversions
    };

    const score = this.calculatePerformanceScore(metrics, thresholds);
    const confidence = this.calculateConfidence(metrics, thresholds);
    const recommendation = this.getRecommendation(score, confidence, thresholds);
    const trend = this.getTrendFromString(offer.trend);

    const reasons = this.generateReasons(metrics, thresholds, 'offer');
    const recommendations = this.generateRecommendations(metrics, thresholds, 'offer');

    return {
      id: offer.slug,
      type: 'offer',
      score,
      confidence,
      recommendation,
      trend,
      metrics,
      reasons,
      recommendations
    };
  }

  /**
   * Rank individual module
   */
  private rankModule(module: any, thresholds: RankingThresholds): RankingElement {
    const metrics = {
      impressions: module.metrics.impressions,
      clicks: module.metrics.interactions,
      ctr: module.metrics.interactionRate,
      engagement: module.metrics.completionRate,
      conversions: module.metrics.completions
    };

    const score = this.calculatePerformanceScore(metrics, thresholds);
    const confidence = this.calculateConfidence(metrics, thresholds);
    const recommendation = this.getRecommendation(score, confidence, thresholds);
    const trend = this.getTrendFromString(module.trend);

    const reasons = this.generateReasons(metrics, thresholds, 'module');
    const recommendations = this.generateRecommendations(metrics, thresholds, 'module');

    return {
      id: module.type,
      type: 'module',
      score,
      confidence,
      recommendation,
      trend,
      metrics,
      reasons,
      recommendations
    };
  }

  /**
   * Calculate performance score based on metrics
   */
  private calculatePerformanceScore(metrics: any, thresholds: RankingThresholds): number {
    let score = 0;

    // CTR score (normalized)
    const ctrScore = Math.min(metrics.ctr / (thresholds.minCTR * 2), 1);
    score += ctrScore * this.PERFORMANCE_WEIGHTS.ctr;

    // Engagement score (normalized)
    const engagementScore = Math.min(metrics.engagement / (thresholds.minEngagement * 2), 1);
    score += engagementScore * this.PERFORMANCE_WEIGHTS.engagement;

    // Conversion score (normalized)
    if (metrics.conversions !== undefined) {
      const conversionRate = metrics.impressions > 0 ? metrics.conversions / metrics.impressions : 0;
      const conversionScore = Math.min(conversionRate / 0.1, 1); // Normalize to 10% conversion rate
      score += conversionScore * this.PERFORMANCE_WEIGHTS.conversions;
    } else {
      // No conversions data, redistribute weight to other metrics
      const redistributedWeight = this.PERFORMANCE_WEIGHTS.conversions / 2;
      score += (ctrScore * redistributedWeight) + (engagementScore * redistributedWeight);
    }

    // Impressions score (volume bonus)
    const impressionsScore = Math.min(metrics.impressions / (thresholds.minImpressions * 3), 1);
    score += impressionsScore * this.PERFORMANCE_WEIGHTS.impressions;

    return Math.min(score, 1);
  }

  /**
   * Calculate confidence in the ranking
   */
  private calculateConfidence(metrics: any, thresholds: RankingThresholds): number {
    let confidence = 0;

    // Confidence based on sample size
    if (metrics.impressions >= thresholds.minImpressions) {
      confidence += 0.4;
    } else {
      confidence += (metrics.impressions / thresholds.minImpressions) * 0.4;
    }

    // Confidence based on click volume
    if (metrics.clicks >= 10) {
      confidence += 0.3;
    } else {
      confidence += (metrics.clicks / 10) * 0.3;
    }

    // Confidence based on CTR stability
    if (metrics.ctr >= thresholds.minCTR) {
      confidence += 0.2;
    } else {
      confidence += (metrics.ctr / thresholds.minCTR) * 0.2;
    }

    // Confidence based on engagement level
    if (metrics.engagement >= thresholds.minEngagement) {
      confidence += 0.1;
    } else {
      confidence += (metrics.engagement / thresholds.minEngagement) * 0.1;
    }

    return Math.min(confidence, 1);
  }

  /**
   * Get recommendation based on score and confidence
   */
  private getRecommendation(score: number, confidence: number, thresholds: RankingThresholds): 'promote' | 'maintain' | 'needs_improvement' | 'demote' {
    const minConfidence = thresholds.minConfidence || 0.5;

    if (confidence < minConfidence) {
      return 'needs_improvement'; // Low confidence means we need more data
    }

    if (score >= 0.8) {
      return 'promote';
    } else if (score >= 0.6) {
      return 'maintain';
    } else if (score >= 0.3) {
      return 'needs_improvement';
    } else {
      return 'demote';
    }
  }

  /**
   * Convert trend string to standard format
   */
  private getTrendFromString(trend: string): 'improving' | 'stable' | 'declining' {
    switch (trend) {
      case 'up':
        return 'improving';
      case 'down':
        return 'declining';
      case 'stable':
      default:
        return 'stable';
    }
  }

  /**
   * Generate reasons for ranking
   */
  private generateReasons(metrics: any, thresholds: RankingThresholds, type: string): string[] {
    const reasons: string[] = [];

    if (metrics.impressions < thresholds.minImpressions) {
      reasons.push(`Low impression volume (${metrics.impressions} < ${thresholds.minImpressions})`);
    }

    if (metrics.ctr < thresholds.minCTR) {
      reasons.push(`Below average CTR (${(metrics.ctr * 100).toFixed(1)}% < ${(thresholds.minCTR * 100).toFixed(1)}%)`);
    }

    if (metrics.engagement < thresholds.minEngagement) {
      reasons.push(`Low engagement rate (${(metrics.engagement * 100).toFixed(1)}% < ${(thresholds.minEngagement * 100).toFixed(1)}%)`);
    }

    if (metrics.clicks < 5) {
      reasons.push('Insufficient click data for reliable analysis');
    }

    if (metrics.conversions !== undefined && metrics.conversions === 0) {
      reasons.push('No conversions recorded');
    }

    if (reasons.length === 0) {
      if (metrics.ctr > thresholds.minCTR * 1.5) {
        reasons.push('High CTR indicates strong performance');
      }
      if (metrics.engagement > thresholds.minEngagement * 1.3) {
        reasons.push('Above average engagement');
      }
      if (metrics.impressions > thresholds.minImpressions * 2) {
        reasons.push('High impression volume');
      }
    }

    return reasons;
  }

  /**
   * Generate recommendations for improvement
   */
  private generateRecommendations(metrics: any, thresholds: RankingThresholds, type: string): string[] {
    const recommendations: string[] = [];

    if (metrics.ctr < thresholds.minCTR) {
      switch (type) {
        case 'page':
          recommendations.push('Consider updating page title and meta description');
          recommendations.push('Review emotion theme for better user engagement');
          break;
        case 'emotion':
          recommendations.push('Adjust color saturation and contrast');
          recommendations.push('Update gradient for better visual appeal');
          break;
        case 'cta':
          recommendations.push('Add action verbs and urgency words');
          recommendations.push('Test different button colors and sizes');
          break;
        case 'offer':
          recommendations.push('Improve offer positioning and timing');
          recommendations.push('Enhance offer copy and value proposition');
          break;
        case 'module':
          recommendations.push('Simplify module interface');
          recommendations.push('Add progress indicators');
          break;
      }
    }

    if (metrics.engagement < thresholds.minEngagement) {
      switch (type) {
        case 'page':
          recommendations.push('Reduce content length or improve structure');
          recommendations.push('Add interactive elements');
          break;
        case 'emotion':
          recommendations.push('Test with different target audiences');
          recommendations.push('Consider emotion combination strategies');
          break;
        case 'cta':
          recommendations.push('Improve button placement');
          recommendations.push('Test different messaging approaches');
          break;
        case 'offer':
          recommendations.push('Segment offers by user behavior');
          recommendations.push('Improve offer relevance');
          break;
        case 'module':
          recommendations.push('Reduce steps required for completion');
          recommendations.push('Add gamification elements');
          break;
      }
    }

    if (metrics.impressions < thresholds.minImpressions) {
      recommendations.push('Increase visibility and promotion');
      recommendations.push('Improve SEO and discoverability');
    }

    if (metrics.conversions !== undefined && metrics.conversions === 0) {
      recommendations.push('Review conversion tracking setup');
      recommendations.push('Optimize for conversion funnel');
    }

    return recommendations;
  }

  /**
   * Get top performers by type
   */
  async getTopPerformers(analyticsData: AnalyticsData, thresholds: RankingThresholds, type?: string, limit: number = 10): Promise<RankingElement[]> {
    const allElements = await this.rankElements(analyticsData, thresholds);
    
    let filtered = allElements;
    if (type) {
      filtered = allElements.filter(e => e.type === type);
    }

    return filtered
      .filter(e => e.recommendation === 'promote' || e.score >= 0.7)
      .slice(0, limit);
  }

  /**
   * Get underperformers by type
   */
  async getUnderperformers(analyticsData: AnalyticsData, thresholds: RankingThresholds, type?: string, limit: number = 10): Promise<RankingElement[]> {
    const allElements = await this.rankElements(analyticsData, thresholds);
    
    let filtered = allElements;
    if (type) {
      filtered = allElements.filter(e => e.type === type);
    }

    return filtered
      .filter(e => e.recommendation === 'needs_improvement' || e.recommendation === 'demote')
      .slice(0, limit);
  }

  /**
   * Get performance summary
   */
  async getPerformanceSummary(analyticsData: AnalyticsData, thresholds: RankingThresholds): Promise<any> {
    const allElements = await this.rankElements(analyticsData, thresholds);
    
    const summary = {
      totalElements: allElements.length,
      averageScore: allElements.reduce((sum, e) => sum + e.score, 0) / allElements.length,
      averageConfidence: allElements.reduce((sum, e) => sum + e.confidence, 0) / allElements.length,
      recommendations: {
        promote: allElements.filter(e => e.recommendation === 'promote').length,
        maintain: allElements.filter(e => e.recommendation === 'maintain').length,
        needs_improvement: allElements.filter(e => e.recommendation === 'needs_improvement').length,
        demote: allElements.filter(e => e.recommendation === 'demote').length
      },
      trends: {
        improving: allElements.filter(e => e.trend === 'improving').length,
        stable: allElements.filter(e => e.trend === 'stable').length,
        declining: allElements.filter(e => e.trend === 'declining').length
      },
      byType: {} as any
    };

    // Group by type
    for (const element of allElements) {
      if (!summary.byType[element.type]) {
        summary.byType[element.type] = {
          count: 0,
          averageScore: 0,
          averageConfidence: 0
        };
      }
      
      summary.byType[element.type].count++;
      summary.byType[element.type].averageScore += element.score;
      summary.byType[element.type].averageConfidence += element.confidence;
    }

    // Calculate averages
    for (const type in summary.byType) {
      const typeData = summary.byType[type];
      typeData.averageScore = typeData.averageScore / typeData.count;
      typeData.averageConfidence = typeData.averageConfidence / typeData.count;
    }

    return summary;
  }
}

export const ranker = new RankerService();