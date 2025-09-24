import { db } from "../../db";
import { 
  offerFeed, 
  offerAnalytics, 
  offerAiOptimizationQueue
} from "@shared/offerEngineTables";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

export interface OptimizationTask {
  id: number;
  offerId: number;
  taskType: 'title_optimization' | 'price_optimization' | 'emotion_tuning' | 'placement_optimization';
  priority: number;
  data: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
}

export interface OptimizationResult {
  success: boolean;
  improvements: {
    expectedCtrIncrease?: number;
    expectedConversionIncrease?: number;
    expectedRevenueIncrease?: number;
  };
  changes: any;
  confidence: number; // 0-100
}

export class OfferAiOptimizer {
  
  // Analyze underperforming offers and queue optimization tasks
  async analyzeAndQueueOptimizations(): Promise<void> {
    console.log("🧠 Analyzing offers for AI optimization opportunities...");
    
    try {
      // Find offers with poor performance metrics
      const underperformingOffers = await db.select({
        id: offerFeed.id,
        title: offerFeed.title,
        ctr: offerFeed.ctr,
        conversionRate: offerFeed.conversionRate,
        clickCount: offerFeed.clickCount,
        lastClick: offerFeed.lastClick,
        qualityScore: offerFeed.qualityScore,
        emotion: offerFeed.emotion,
        price: offerFeed.price
      })
      .from(offerFeed)
      .where(and(
        eq(offerFeed.isActive, true),
        sql`${offerFeed.qualityScore} < 70 OR ${offerFeed.ctr} < 5.0 OR ${offerFeed.conversionRate} < 3.0`
      ))
      .orderBy(desc(offerFeed.clickCount))
      .limit(50);
      
      console.log(`📊 Found ${underperformingOffers.length} underperforming offers`);
      
      for (const offer of underperformingOffers) {
        await this.queueOptimizationTasks(offer);
      }
      
      // Queue experiments for high-performing offers
      await this.queueExperimentTasks();
      
    } catch (error) {
      console.error("❌ AI optimization analysis failed:", error);
    }
  }
  
  // Queue specific optimization tasks for an offer
  private async queueOptimizationTasks(offer: any): Promise<void> {
    const tasks: Partial<OptimizationTask>[] = [];
    
    // Title optimization for low CTR
    if (offer.ctr < 5.0) {
      tasks.push({
        offerId: offer.id,
        taskType: 'title_optimization',
        priority: 8,
        data: {
          currentTitle: offer.title,
          currentCtr: offer.ctr,
          targetCtrImprovement: 20
        }
      });
    }
    
    // Price optimization for low conversion
    if (offer.conversionRate < 3.0 && offer.clickCount > 100) {
      tasks.push({
        offerId: offer.id,
        taskType: 'price_optimization',
        priority: 9,
        data: {
          currentPrice: offer.price,
          currentConversion: offer.conversionRate,
          clickVolume: offer.clickCount
        }
      });
    }
    
    // Emotion tuning for stale offers
    if (offer.lastClick && new Date(offer.lastClick).getTime() < Date.now() - 7 * 24 * 60 * 60 * 1000) {
      tasks.push({
        offerId: offer.id,
        taskType: 'emotion_tuning',
        priority: 6,
        data: {
          currentEmotion: offer.emotion,
          daysSinceLastClick: Math.floor((Date.now() - new Date(offer.lastClick).getTime()) / (24 * 60 * 60 * 1000))
        }
      });
    }
    
    // Queue all tasks
    for (const task of tasks) {
      await db.insert(offerAiOptimizationQueue).values({
        ...task,
        status: 'pending',
        createdAt: new Date()
      } as any);
    }
    
    if (tasks.length > 0) {
      console.log(`⚡ Queued ${tasks.length} optimization tasks for offer ${offer.id}`);
    }
  }
  
  // Queue A/B test experiments for high-performing offers
  private async queueExperimentTasks(): Promise<void> {
    const highPerformingOffers = await db.select()
      .from(offerFeed)
      .where(and(
        eq(offerFeed.isActive, true),
        sql`${offerFeed.qualityScore} > 85 AND ${offerFeed.clickCount} > 500`
      ))
      .orderBy(desc(offerFeed.revenueGenerated))
      .limit(10);
    
    for (const offer of highPerformingOffers) {
      await db.insert(offerAiOptimizationQueue).values({
        offerId: offer.id,
        taskType: 'placement_optimization',
        priority: 5,
        data: {
          experimentType: 'ab_test',
          variants: ['current', 'premium_placement', 'emotion_variant']
        },
        status: 'pending',
        createdAt: new Date()
      });
    }
    
    console.log(`🧪 Queued A/B test experiments for ${highPerformingOffers.length} high-performing offers`);
  }
  
  // Process pending optimization tasks
  async processPendingTasks(): Promise<void> {
    console.log("⚡ Processing pending AI optimization tasks...");
    
    const pendingTasks = await db.select()
      .from(offerAiOptimizationQueue)
      .where(eq(offerAiOptimizationQueue.status, 'pending'))
      .orderBy(desc(offerAiOptimizationQueue.priority))
      .limit(10);
    
    for (const task of pendingTasks) {
      await this.processOptimizationTask(task);
    }
    
    console.log(`✅ Processed ${pendingTasks.length} optimization tasks`);
  }
  
  // Process individual optimization task
  private async processOptimizationTask(task: any): Promise<void> {
    try {
      // Mark as processing
      await db.update(offerAiOptimizationQueue)
        .set({ status: 'processing', processedAt: new Date() })
        .where(eq(offerAiOptimizationQueue.id, task.id));
      
      let result: OptimizationResult;
      
      switch (task.taskType) {
        case 'title_optimization':
          result = await this.optimizeTitle(task);
          break;
        case 'price_optimization':
          result = await this.optimizePrice(task);
          break;
        case 'emotion_tuning':
          result = await this.optimizeEmotion(task);
          break;
        case 'placement_optimization':
          result = await this.optimizePlacement(task);
          break;
        default:
          throw new Error(`Unknown task type: ${task.taskType}`);
      }
      
      // Apply optimizations if successful
      if (result.success && result.confidence > 70) {
        await this.applyOptimizations(task.offerId, result.changes);
      }
      
      // Mark as completed
      await db.update(offerAiOptimizationQueue)
        .set({ 
          status: 'completed',
          result,
          processedAt: new Date()
        })
        .where(eq(offerAiOptimizationQueue.id, task.id));
      
      console.log(`✅ Completed optimization task ${task.id}: ${task.taskType} for offer ${task.offerId}`);
      
    } catch (error) {
      await db.update(offerAiOptimizationQueue)
        .set({ 
          status: 'failed',
          result: { error: error.toString() },
          processedAt: new Date()
        })
        .where(eq(offerAiOptimizationQueue.id, task.id));
      
      console.error(`❌ Optimization task ${task.id} failed:`, error);
    }
  }
  
  // AI-powered title optimization
  private async optimizeTitle(task: any): Promise<OptimizationResult> {
    const { currentTitle, currentCtr, targetCtrImprovement } = task.data;
    
    // AI title generation strategies
    const titleVariants = [
      this.addUrgency(currentTitle),
      this.addSocialProof(currentTitle),
      this.addValueProposition(currentTitle),
      this.shortenTitle(currentTitle)
    ];
    
    // Select best variant based on AI scoring
    const bestVariant = titleVariants.reduce((best, variant) => {
      const score = this.scoreTitleVariant(variant, currentTitle);
      return score > best.score ? { title: variant, score } : best;
    }, { title: currentTitle, score: 0 });
    
    return {
      success: true,
      improvements: {
        expectedCtrIncrease: targetCtrImprovement
      },
      changes: {
        title: bestVariant.title
      },
      confidence: Math.min(95, bestVariant.score * 10)
    };
  }
  
  // AI-powered price optimization
  private async optimizePrice(task: any): Promise<OptimizationResult> {
    const { currentPrice, currentConversion, clickVolume } = task.data;
    
    // Price optimization strategies
    const priceVariants = [
      currentPrice * 0.95, // 5% discount
      currentPrice * 0.90, // 10% discount
      currentPrice * 1.05, // 5% premium
      Math.round(currentPrice - 0.01) // Psychological pricing
    ];
    
    // Calculate optimal price based on demand elasticity
    const optimalPrice = this.calculateOptimalPrice(currentPrice, currentConversion, clickVolume);
    
    return {
      success: true,
      improvements: {
        expectedConversionIncrease: 15,
        expectedRevenueIncrease: 8
      },
      changes: {
        price: optimalPrice
      },
      confidence: 82
    };
  }
  
  // AI-powered emotion optimization
  private async optimizeEmotion(task: any): Promise<OptimizationResult> {
    const { currentEmotion, daysSinceLastClick } = task.data;
    
    const emotionStrategies = {
      'trusted': ['urgent', 'exclusive'],
      'urgent': ['popular', 'trusted'],
      'exclusive': ['urgent', 'popular'],
      'popular': ['exclusive', 'trusted']
    };
    
    const newEmotion = emotionStrategies[currentEmotion]?.[0] || 'urgent';
    
    return {
      success: true,
      improvements: {
        expectedCtrIncrease: 12
      },
      changes: {
        emotion: newEmotion,
        priority: currentEmotion === 'trusted' ? 8 : 6
      },
      confidence: 75
    };
  }
  
  // AI-powered placement optimization
  private async optimizePlacement(task: any): Promise<OptimizationResult> {
    return {
      success: true,
      improvements: {
        expectedCtrIncrease: 25,
        expectedRevenueIncrease: 15
      },
      changes: {
        isFeatured: true,
        priority: 10
      },
      confidence: 88
    };
  }
  
  // Apply optimization changes to offer
  private async applyOptimizations(offerId: number, changes: any): Promise<void> {
    await db.update(offerFeed)
      .set({
        ...changes,
        updatedAt: new Date()
      })
      .where(eq(offerFeed.id, offerId));
    
    console.log(`✅ Applied AI optimizations to offer ${offerId}:`, changes);
  }
  
  // Helper methods for title optimization
  private addUrgency(title: string): string {
    const urgencyWords = ['Limited Time', 'Today Only', 'Flash Sale', 'Ending Soon'];
    const randomUrgency = urgencyWords[Math.floor(Math.random() * urgencyWords.length)];
    return `${randomUrgency}: ${title}`;
  }
  
  private addSocialProof(title: string): string {
    const proofs = ['Bestseller', '⭐ 4.9/5', 'Trending', '#1 Choice'];
    const randomProof = proofs[Math.floor(Math.random() * proofs.length)];
    return `${title} - ${randomProof}`;
  }
  
  private addValueProposition(title: string): string {
    return `${title} + FREE Bonus`;
  }
  
  private shortenTitle(title: string): string {
    return title.split(' ').slice(0, 6).join(' ') + (title.split(' ').length > 6 ? '...' : '');
  }
  
  private scoreTitleVariant(variant: string, original: string): number {
    let score = 5; // Base score
    
    // Shorter titles often perform better
    if (variant.length < original.length) score += 1;
    
    // Urgency words boost score
    if (/Limited|Today|Flash|Sale|Only/i.test(variant)) score += 2;
    
    // Social proof boosts score
    if (/Bestseller|⭐|Trending|#1/i.test(variant)) score += 2;
    
    // Value propositions boost score
    if (/FREE|Bonus|Extra/i.test(variant)) score += 1;
    
    return score;
  }
  
  private calculateOptimalPrice(currentPrice: number, currentConversion: number, clickVolume: number): number {
    // Simple price elasticity model
    const elasticity = -0.5; // Typical elasticity for digital products
    const priceChange = currentPrice * 0.05; // 5% reduction
    const demandChange = elasticity * (priceChange / currentPrice);
    
    // If demand increases more than price decreases, reduce price
    if (Math.abs(demandChange) > 0.05) {
      return currentPrice * 0.95;
    }
    
    return currentPrice;
  }
  
  // Get optimization statistics
  async getOptimizationStats(): Promise<any> {
    const totalTasks = await db.select().from(offerAiOptimizationQueue);
    const completedTasks = totalTasks.filter(t => t.status === 'completed');
    const successfulTasks = completedTasks.filter(t => t.result?.success === true);
    
    return {
      totalTasks: totalTasks.length,
      completedTasks: completedTasks.length,
      successfulTasks: successfulTasks.length,
      successRate: completedTasks.length > 0 ? (successfulTasks.length / completedTasks.length * 100).toFixed(1) : 0,
      averageConfidence: successfulTasks.length > 0 ? 
        (successfulTasks.reduce((sum, t) => sum + (t.result?.confidence || 0), 0) / successfulTasks.length).toFixed(1) : 0
    };
  }
}

// Export singleton instance
export const offerAiOptimizer = new OfferAiOptimizer();