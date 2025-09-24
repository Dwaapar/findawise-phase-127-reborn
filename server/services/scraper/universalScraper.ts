import { productHuntScraper } from './productHuntScraper';
import * as cron from 'node-cron';

export class UniversalScraper {
  private isRunning = false;
  private cronJobs: Map<string, any> = new Map();

  constructor() {
    this.setupCronJobs();
  }

  private setupCronJobs(): void {
    // Daily ProductHunt scrape at 6 AM UTC
    const dailyScrapeJob = cron.schedule('0 6 * * *', async () => {
      if (this.isRunning) {
        console.log('⚠️ Scraper already running, skipping this cycle');
        return;
      }

      this.isRunning = true;
      try {
        console.log('🕐 Starting daily tool discovery...');
        await this.runDailyDiscovery();
        console.log('✅ Daily tool discovery completed');
      } catch (error) {
        console.error('❌ Daily scrape failed:', error);
      } finally {
        this.isRunning = false;
      }
    }, {
      scheduled: false // Don't start automatically
    });

    this.cronJobs.set('dailyScrape', dailyScrapeJob);

    // Weekly deep scrape on Sundays at 3 AM UTC
    const weeklyScrapeJob = cron.schedule('0 3 * * 0', async () => {
      if (this.isRunning) {
        console.log('⚠️ Scraper already running, skipping weekly scrape');
        return;
      }

      this.isRunning = true;
      try {
        console.log('🕐 Starting weekly deep discovery...');
        await this.runWeeklyDeepScrape();
        console.log('✅ Weekly deep discovery completed');
      } catch (error) {
        console.error('❌ Weekly scrape failed:', error);
      } finally {
        this.isRunning = false;
      }
    }, {
      scheduled: false
    });

    this.cronJobs.set('weeklyScrape', weeklyScrapeJob);
  }

  async initialize(): Promise<void> {
    console.log('🚀 Initializing Universal Scraper...');
    
    // Start cron jobs
    this.cronJobs.get('dailyScrape')?.start();
    this.cronJobs.get('weeklyScrape')?.start();
    
    // Run initial scrape if no tools exist
    await this.runInitialScrapeIfNeeded();
    
    console.log('✅ Universal Scraper initialized successfully');
  }

  private async runInitialScrapeIfNeeded(): Promise<void> {
    try {
      // Check if we have any tools in the database
      const { db } = await import('../../db');
      const { saasTools } = await import('../../../shared/saasTables');
      
      const toolCount = await db.select().from(saasTools).limit(1);
      
      if (toolCount.length === 0) {
        console.log('🔄 No tools found, running initial scrape...');
        await this.runDailyDiscovery();
      } else {
        console.log(`✅ Tools already exist, skipping initial scrape`);
      }
    } catch (error) {
      console.error('❌ Error checking tool count:', error);
    }
  }

  async runDailyDiscovery(): Promise<void> {
    const scrapers = [
      {
        name: 'ProductHunt',
        scraper: productHuntScraper,
        method: 'runDailyScrape'
      }
      // Add more scrapers here as they're implemented:
      // { name: 'Capterra', scraper: capterraScraper, method: 'runDailyScrape' }
      // { name: 'G2', scraper: g2Scraper, method: 'runDailyScrape' }
    ];

    for (const { name, scraper, method } of scrapers) {
      try {
        console.log(`🔄 Running ${name} scraper...`);
        await (scraper as any)[method]();
        console.log(`✅ ${name} scraper completed`);
      } catch (error) {
        console.error(`❌ ${name} scraper failed:`, error);
      }
    }
  }

  async runWeeklyDeepScrape(): Promise<void> {
    console.log('🔍 Starting weekly deep scrape...');
    
    // Run all daily scrapers with higher limits
    await this.runDailyDiscovery();
    
    // Additional deep scraping tasks
    await this.updateToolMetadata();
    await this.validateAffiliateLinks();
    await this.updateToolRatings();
    
    console.log('✅ Weekly deep scrape completed');
  }

  private async updateToolMetadata(): Promise<void> {
    console.log('🔄 Updating tool metadata...');
    // Implementation for updating existing tools with fresh data
    // This would check for pricing changes, feature updates, etc.
  }

  private async validateAffiliateLinks(): Promise<void> {
    console.log('🔄 Validating affiliate links...');
    // Implementation for checking if affiliate links are still valid
  }

  private async updateToolRatings(): Promise<void> {
    console.log('🔄 Updating tool ratings...');
    // Implementation for updating ratings based on recent reviews
  }

  async manualScrape(source?: string): Promise<void> {
    if (this.isRunning) {
      throw new Error('Scraper is already running');
    }

    this.isRunning = true;
    try {
      if (source === 'producthunt' || !source) {
        await productHuntScraper.runDailyScrape();
      }
      
      if (!source) {
        await this.runDailyDiscovery();
      }
    } finally {
      this.isRunning = false;
    }
  }

  getStatus(): { isRunning: boolean; nextRuns: Record<string, string> } {
    const status = {
      isRunning: this.isRunning,
      nextRuns: {} as Record<string, string>
    };

    this.cronJobs.forEach((job, name) => {
      if (job.getStatus() === 'scheduled') {
        // Calculate next run time (simplified)
        status.nextRuns[name] = 'Scheduled';
      }
    });

    return status;
  }

  stop(): void {
    console.log('🛑 Stopping Universal Scraper...');
    this.cronJobs.forEach((job, name) => {
      job.stop();
      console.log(`Stopped ${name} cron job`);
    });
  }

  restart(): void {
    console.log('🔄 Restarting Universal Scraper...');
    this.stop();
    setTimeout(() => {
      this.initialize();
    }, 1000);
  }
}

export const universalScraper = new UniversalScraper();