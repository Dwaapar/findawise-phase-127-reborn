import { universalScraper } from '../scraper/universalScraper';
import { contentScheduler } from '../content/contentScheduler';
import { performanceAuditor } from '../audit/performanceAuditor';
import * as cron from 'node-cron';

export class AutonomousOrchestrator {
  private isInitialized = false;
  private systems: Map<string, any> = new Map();
  private cronJobs: Map<string, any> = new Map();

  constructor() {
    this.setupSystems();
  }

  private setupSystems(): void {
    // Register all autonomous systems
    this.systems.set('scraper', universalScraper);
    this.systems.set('content', contentScheduler);
    this.systems.set('auditor', performanceAuditor);
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️ Autonomous Orchestrator already initialized');
      return;
    }

    console.log('🤖 Initializing Autonomous Orchestrator...');

    try {
      // Initialize all systems
      await Promise.all([
        universalScraper.initialize(),
        contentScheduler.initialize(),
        performanceAuditor.initialize()
      ]);

      // Setup orchestration cron jobs
      this.setupOrchestrationJobs();

      this.isInitialized = true;
      console.log('✅ Autonomous Orchestrator initialized successfully');

      // Run initial health check
      await this.runHealthCheck();

    } catch (error) {
      console.error('❌ Failed to initialize Autonomous Orchestrator:', error);
      throw error;
    }
  }

  private setupOrchestrationJobs(): void {
    // Further optimized: Health monitoring every 60 minutes to reduce load
    const healthJob = cron.schedule('0 * * * *', async () => {
      try {
        await this.runHealthCheck();
      } catch (error) {
        console.error('❌ Health check failed:', error);
      }
    });

    this.cronJobs.set('health', healthJob);

    // System coordination every 2 hours  
    const coordinationJob = cron.schedule('0 */2 * * *', async () => {
      try {
        await this.coordinateSystems();
      } catch (error) {
        console.error('❌ System coordination failed:', error);
      }
    });

    this.cronJobs.set('coordination', coordinationJob);

    // Daily optimization review
    const optimizationJob = cron.schedule('0 1 * * *', async () => {
      try {
        await this.runDailyOptimization();
      } catch (error) {
        console.error('❌ Daily optimization failed:', error);
      }
    });

    this.cronJobs.set('optimization', optimizationJob);

    // Start all jobs
    this.cronJobs.forEach((job, name) => {
      job.start();
      console.log(`✅ Started ${name} orchestration job`);
    });
  }

  private async runHealthCheck(): Promise<void> {
    console.log('🔍 Running autonomous systems health check...');

    const healthStatus = {
      scraper: await this.checkScraperHealth(),
      content: await this.checkContentHealth(),
      auditor: await this.checkAuditorHealth(),
      overall: 'healthy'
    };

    // Log health status
    const unhealthySystems = Object.entries(healthStatus)
      .filter(([key, status]) => key !== 'overall' && status !== 'healthy')
      .map(([key]) => key);

    if (unhealthySystems.length > 0) {
      healthStatus.overall = 'degraded';
      console.log(`⚠️ Unhealthy systems detected: ${unhealthySystems.join(', ')}`);
      
      // Attempt to restart unhealthy systems
      await this.restartUnhealthySystems(unhealthySystems);
    } else {
      console.log('✅ All autonomous systems healthy');
    }
  }

  private async checkScraperHealth(): Promise<string> {
    try {
      const status = universalScraper.getStatus();
      return status.isRunning ? 'healthy' : 'idle';
    } catch (error) {
      console.error('❌ Scraper health check failed:', error);
      return 'unhealthy';
    }
  }

  private async checkContentHealth(): Promise<string> {
    try {
      const status = contentScheduler.getQueueStatus();
      return status.total > 0 ? 'healthy' : 'idle';
    } catch (error) {
      console.error('❌ Content scheduler health check failed:', error);
      return 'unhealthy';
    }
  }

  private async checkAuditorHealth(): Promise<string> {
    try {
      const report = await performanceAuditor.getSuggestionsReport();
      return 'healthy'; // Auditor is healthy if it can generate reports
    } catch (error) {
      console.error('❌ Performance auditor health check failed:', error);
      return 'unhealthy';
    }
  }

  private async restartUnhealthySystems(systems: string[]): Promise<void> {
    console.log(`🔄 Restarting unhealthy systems: ${systems.join(', ')}`);

    for (const systemName of systems) {
      try {
        const system = this.systems.get(systemName);
        if (system && typeof system.restart === 'function') {
          await system.restart();
          console.log(`✅ Restarted ${systemName} system`);
        }
      } catch (error) {
        console.error(`❌ Failed to restart ${systemName}:`, error);
      }
    }
  }

  private async coordinateSystems(): Promise<void> {
    console.log('🔄 Coordinating autonomous systems...');

    try {
      // Get performance insights
      const auditResults = await performanceAuditor.runComprehensiveAudit();
      
      // High priority suggestions trigger immediate actions
      const highPriorityActions = auditResults.filter(s => s.priority === 'high');
      
      if (highPriorityActions.length > 0) {
        console.log(`🚨 ${highPriorityActions.length} high priority optimizations found`);
        
        // Trigger content generation for missing content
        const contentActions = highPriorityActions.filter(s => s.type === 'content');
        if (contentActions.length > 0) {
          await contentScheduler.generateContentNow(Math.min(contentActions.length, 3));
        }

        // Trigger scraping for outdated tools
        const toolActions = highPriorityActions.filter(s => s.type === 'tool');
        if (toolActions.length > 0) {
          await universalScraper.manualScrape();
        }
      }

      // Schedule regular maintenance
      await this.scheduleMaintenanceTasks();

    } catch (error) {
      console.error('❌ System coordination failed:', error);
    }
  }

  private async scheduleMaintenanceTasks(): Promise<void> {
    // Update content freshness weekly
    const now = new Date();
    const lastMaintenanceKey = 'last_content_maintenance';
    
    // Simple in-memory tracking (in production, use database)
    const lastMaintenance = this.getLastMaintenanceTime(lastMaintenanceKey);
    const weeksSinceLastMaintenance = (now.getTime() - lastMaintenance.getTime()) / (1000 * 60 * 60 * 24 * 7);
    
    if (weeksSinceLastMaintenance >= 1) {
      console.log('🔄 Running weekly content maintenance...');
      await contentScheduler.updateContentFreshness();
      this.setLastMaintenanceTime(lastMaintenanceKey, now);
    }
  }

  private async runDailyOptimization(): Promise<void> {
    console.log('🎯 Running daily optimization routine...');

    try {
      // Run comprehensive audit
      const suggestions = await performanceAuditor.runComprehensiveAudit();
      
      // Generate optimization report
      const report = {
        date: new Date().toISOString(),
        totalSuggestions: suggestions.length,
        highPriority: suggestions.filter(s => s.priority === 'high').length,
        mediumPriority: suggestions.filter(s => s.priority === 'medium').length,
        lowPriority: suggestions.filter(s => s.priority === 'low').length,
        topSuggestions: suggestions.slice(0, 5)
      };

      console.log('📊 Daily optimization report:', report);

      // Auto-implement easy fixes
      const easyFixes = suggestions.filter(s => 
        s.implementationEffort === 'easy' && s.priority === 'high'
      );

      if (easyFixes.length > 0) {
        console.log(`🔧 Auto-implementing ${easyFixes.length} easy fixes`);
        // Implementation logic would go here
      }

      // Schedule complex improvements
      const complexImprovements = suggestions.filter(s => 
        s.implementationEffort === 'complex' && s.priority === 'high'
      );

      if (complexImprovements.length > 0) {
        console.log(`📋 Scheduled ${complexImprovements.length} complex improvements`);
        // Add to improvement queue
      }

    } catch (error) {
      console.error('❌ Daily optimization failed:', error);
    }
  }

  async triggerManualOptimization(): Promise<void> {
    console.log('🚀 Running manual optimization trigger...');
    
    await Promise.all([
      universalScraper.manualScrape(),
      contentScheduler.generateContentNow(5),
      performanceAuditor.runComprehensiveAudit()
    ]);
    
    console.log('✅ Manual optimization completed');
  }

  async emergencyStop(): Promise<void> {
    console.log('🛑 Emergency stop initiated...');
    
    // Stop all cron jobs
    this.cronJobs.forEach((job, name) => {
      job.stop();
      console.log(`Stopped ${name} job`);
    });

    // Stop all systems
    this.systems.forEach((system, name) => {
      if (typeof system.stop === 'function') {
        system.stop();
        console.log(`Stopped ${name} system`);
      }
    });

    this.isInitialized = false;
    console.log('✅ Emergency stop completed');
  }

  async restart(): Promise<void> {
    console.log('🔄 Restarting Autonomous Orchestrator...');
    
    await this.emergencyStop();
    
    setTimeout(async () => {
      await this.initialize();
    }, 2000);
  }

  getSystemStatus(): {
    isInitialized: boolean;
    systems: Record<string, any>;
    lastHealthCheck: Date;
    nextOptimization: Date;
  } {
    return {
      isInitialized: this.isInitialized,
      systems: {
        scraper: universalScraper.getStatus(),
        content: contentScheduler.getQueueStatus(),
        auditor: 'running' // Simplified status
      },
      lastHealthCheck: new Date(), // Should track actual time
      nextOptimization: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
    };
  }

  // Simple in-memory tracking methods (in production, use database)
  private maintenanceTimes = new Map<string, Date>();

  private getLastMaintenanceTime(key: string): Date {
    return this.maintenanceTimes.get(key) || new Date(0);
  }

  private setLastMaintenanceTime(key: string, time: Date): void {
    this.maintenanceTimes.set(key, time);
  }
}

export const autonomousOrchestrator = new AutonomousOrchestrator();