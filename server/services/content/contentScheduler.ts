import { articleGenerator } from './articleGenerator';
import { db } from '../../db';
import { saasTools, saasCategories, saasContent } from '../../../shared/saasTables';
import * as cron from 'node-cron';
import { desc, eq, lt } from 'drizzle-orm';

export interface ContentPlan {
  type: 'comparison' | 'listicle' | 'guide';
  priority: 'high' | 'medium' | 'low';
  variables: Record<string, string>;
  scheduledFor: Date;
  status: 'planned' | 'generated' | 'published' | 'failed';
}

export class ContentScheduler {
  private contentQueue: ContentPlan[] = [];
  private isGenerating = false;
  private cronJob: any;

  constructor() {
    this.setupContentGeneration();
  }

  private setupContentGeneration(): void {
    // Generate content daily at 2 AM UTC
    this.cronJob = cron.schedule('0 2 * * *', async () => {
      if (this.isGenerating) {
        console.log('⚠️ Content generation already in progress');
        return;
      }

      try {
        await this.processContentQueue();
      } catch (error) {
        console.error('❌ Content generation failed:', error);
      }
    });
  }

  async initialize(): Promise<void> {
    console.log('🚀 Initializing Content Scheduler...');
    
    // Generate initial content plan
    await this.generateContentPlan();
    
    // Start cron job
    this.cronJob.start();
    
    console.log('✅ Content Scheduler initialized successfully');
  }

  private async generateContentPlan(): Promise<void> {
    console.log('📋 Generating content plan...');
    
    // Get available categories and tools
    const categories = await db.select().from(saasCategories).where(eq(saasCategories.isActive, true));
    const tools = await db.select().from(saasTools).where(eq(saasTools.isActive, true)).orderBy(desc(saasTools.rating));
    
    // Clear existing queue
    this.contentQueue = [];
    
    // Generate comparison articles for top tools
    await this.planComparisonArticles(tools);
    
    // Generate listicle articles for each category
    await this.planListicleArticles(categories);
    
    // Generate guide articles
    await this.planGuideArticles(categories);
    
    console.log(`📋 Content plan generated: ${this.contentQueue.length} articles planned`);
  }

  private async planComparisonArticles(tools: any[]): Promise<void> {
    const topTools = tools.slice(0, 20); // Top 20 tools
    const comparisons: Array<{tool1: any, tool2: any}> = [];
    
    // Generate comparison pairs within same category
    const toolsByCategory = topTools.reduce((acc, tool) => {
      if (!acc[tool.category]) acc[tool.category] = [];
      acc[tool.category].push(tool);
      return acc;
    }, {} as Record<string, any[]>);
    
    Object.values(toolsByCategory).forEach((categoryTools: any[]) => {
      if (categoryTools && categoryTools.length >= 2) {
        for (let i = 0; i < categoryTools.length - 1; i++) {
          for (let j = i + 1; j < Math.min(i + 3, categoryTools.length); j++) {
            comparisons.push({
              tool1: categoryTools[i],
              tool2: categoryTools[j]
            });
          }
        }
      }
    });

    // Add to content queue
    comparisons.slice(0, 15).forEach((comparison, index) => {
      this.contentQueue.push({
        type: 'comparison',
        priority: index < 5 ? 'high' : 'medium',
        variables: {
          tool1: comparison.tool1.name,
          tool2: comparison.tool2.name,
          category: comparison.tool1.category,
          year: new Date().getFullYear().toString()
        },
        scheduledFor: new Date(Date.now() + (index * 24 * 60 * 60 * 1000)), // Spread over days
        status: 'planned'
      });
    });
  }

  private async planListicleArticles(categories: any[]): Promise<void> {
    const audiences = ['startups', 'small businesses', 'freelancers', 'agencies', 'enterprises'];
    
    categories.forEach((category, categoryIndex) => {
      audiences.forEach((audience, audienceIndex) => {
        const scheduleDelay = (categoryIndex * audiences.length + audienceIndex) * 24 * 60 * 60 * 1000;
        
        this.contentQueue.push({
          type: 'listicle',
          priority: categoryIndex < 3 ? 'high' : 'medium',
          variables: {
            category: category.slug,
            audience,
            count: '10',
            year: new Date().getFullYear().toString()
          },
          scheduledFor: new Date(Date.now() + scheduleDelay),
          status: 'planned'
        });
      });
    });
  }

  private async planGuideArticles(categories: any[]): Promise<void> {
    const topics = [
      'choosing the right {category} tool',
      'implementing {category} in your workflow',
      'optimizing {category} for better results',
      'migrating to new {category} tools'
    ];
    
    categories.slice(0, 5).forEach((category, categoryIndex) => {
      topics.forEach((topic, topicIndex) => {
        const scheduleDelay = ((categoryIndex * topics.length + topicIndex) + 50) * 24 * 60 * 60 * 1000;
        
        this.contentQueue.push({
          type: 'guide',
          priority: 'low',
          variables: {
            topic: topic.replace('{category}', category.name.toLowerCase()),
            category: category.slug,
            audience: 'professionals',
            year: new Date().getFullYear().toString()
          },
          scheduledFor: new Date(Date.now() + scheduleDelay),
          status: 'planned'
        });
      });
    });
  }

  async processContentQueue(): Promise<void> {
    if (this.isGenerating) return;
    
    this.isGenerating = true;
    console.log('🔄 Processing content queue...');
    
    try {
      // Get articles due for generation
      const dueArticles = this.contentQueue.filter(
        plan => plan.scheduledFor <= new Date() && plan.status === 'planned'
      ).slice(0, 3); // Process max 3 articles per run
      
      for (const plan of dueArticles) {
        try {
          await this.generateContent(plan);
          plan.status = 'generated';
          console.log(`✅ Generated: ${plan.type} article`);
        } catch (error) {
          console.error(`❌ Failed to generate content:`, error);
          plan.status = 'failed';
        }
      }
      
      // Remove completed items from queue
      this.contentQueue = this.contentQueue.filter(
        plan => !['generated', 'failed'].includes(plan.status)
      );
      
    } finally {
      this.isGenerating = false;
    }
  }

  private async generateContent(plan: ContentPlan): Promise<void> {
    switch (plan.type) {
      case 'comparison':
        await articleGenerator.generateAndSaveComparison(
          plan.variables.tool1,
          plan.variables.tool2,
          plan.variables.category
        );
        break;
        
      case 'listicle':
        await articleGenerator.generateAndSaveListicle(
          plan.variables.category,
          plan.variables.audience,
          parseInt(plan.variables.count)
        );
        break;
        
      case 'guide':
        // Implementation for guide generation would go here
        console.log('Guide generation not yet implemented');
        break;
    }
  }

  async generateContentNow(count: number = 5): Promise<void> {
    if (this.isGenerating) {
      throw new Error('Content generation already in progress');
    }
    
    console.log(`🚀 Generating ${count} articles immediately...`);
    
    // Get high priority items or create urgent content
    const urgentPlans = this.contentQueue
      .filter(plan => plan.priority === 'high' && plan.status === 'planned')
      .slice(0, count);
    
    if (urgentPlans.length === 0) {
      // Create some urgent content if queue is empty
      await this.createUrgentContent(count);
      return;
    }
    
    this.isGenerating = true;
    try {
      for (const plan of urgentPlans) {
        await this.generateContent(plan);
        plan.status = 'generated';
      }
    } finally {
      this.isGenerating = false;
    }
  }

  private async createUrgentContent(count: number): Promise<void> {
    // Get top tools for urgent comparisons
    const topTools = await db.select()
      .from(saasTools)
      .where(eq(saasTools.isActive, true))
      .orderBy(desc(saasTools.rating))
      .limit(10);
    
    if (topTools.length >= 2) {
      for (let i = 0; i < Math.min(count, 3); i++) {
        await articleGenerator.generateAndSaveComparison(
          topTools[i * 2].name,
          topTools[i * 2 + 1].name,
          topTools[i * 2].category
        );
      }
    }
  }

  async updateContentFreshness(): Promise<void> {
    console.log('🔄 Updating content freshness...');
    
    // Find articles older than 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const oldArticles = await db.select()
      .from(saasContent)
      .where(lt(saasContent.updatedAt, sixMonthsAgo))
      .limit(5);
    
    for (const article of oldArticles) {
      // Add to queue for regeneration
      this.contentQueue.push({
        type: 'comparison', // Default type, should be determined from article
        priority: 'medium',
        variables: {
          // Extract variables from existing article
          category: article.category,
          year: new Date().getFullYear().toString()
        },
        scheduledFor: new Date(),
        status: 'planned'
      });
    }
    
    console.log(`📋 Scheduled ${oldArticles.length} articles for refresh`);
  }

  getQueueStatus(): {
    total: number;
    planned: number;
    generated: number;
    failed: number;
    nextScheduled: Date | null;
  } {
    const planned = this.contentQueue.filter(p => p.status === 'planned').length;
    const generated = this.contentQueue.filter(p => p.status === 'generated').length;
    const failed = this.contentQueue.filter(p => p.status === 'failed').length;
    
    const nextScheduled = this.contentQueue
      .filter(p => p.status === 'planned')
      .sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime())[0]?.scheduledFor || null;
    
    return {
      total: this.contentQueue.length,
      planned,
      generated,
      failed,
      nextScheduled
    };
  }

  stop(): void {
    console.log('🛑 Stopping Content Scheduler...');
    this.cronJob?.stop();
  }

  restart(): void {
    console.log('🔄 Restarting Content Scheduler...');
    this.stop();
    setTimeout(() => {
      this.initialize();
    }, 1000);
  }
}

export const contentScheduler = new ContentScheduler();