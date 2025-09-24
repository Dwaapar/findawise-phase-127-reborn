// Content Feed Scheduler - Automated sync scheduling and management
import * as cron from 'node-cron';
import { ContentFeedCore } from './contentFeedCore';
import { db } from '../../db';
import { contentFeedSources } from '../../../shared/contentFeedTables';
import { eq, and, lte } from 'drizzle-orm';

export interface ScheduledJob {
  sourceId: number;
  sourceName: string;
  cronExpression: string;
  task: cron.ScheduledTask;
  lastRun?: Date;
  nextRun?: Date;
  isActive: boolean;
}

export class ContentFeedScheduler {
  private contentFeedCore: ContentFeedCore;
  private scheduledJobs: Map<number, ScheduledJob> = new Map();
  private masterTask: cron.ScheduledTask | null = null;

  constructor() {
    this.contentFeedCore = new ContentFeedCore();
  }

  async initialize(): Promise<void> {
    try {
      console.log('🔄 Initializing Content Feed Scheduler...');

      // Schedule jobs for all active sources
      await this.scheduleAllActiveSources();

      // Start master scheduler to check for overdue syncs
      this.startMasterScheduler();

      console.log(`✅ Content Feed Scheduler initialized with ${this.scheduledJobs.size} scheduled jobs`);
    } catch (error) {
      console.error('Error initializing Content Feed Scheduler:', error);
      throw error;
    }
  }

  private async scheduleAllActiveSources(): Promise<void> {
    try {
      const activeSources = await db
        .select()
        .from(contentFeedSources)
        .where(
          and(
            eq(contentFeedSources.isActive, true),
            // Only sources with valid refresh intervals
            eq(contentFeedSources.refreshInterval, contentFeedSources.refreshInterval)
          )
        );

      for (const source of activeSources) {
        await this.scheduleSource(source.id);
      }
    } catch (error) {
      console.error('Error scheduling active sources:', error);
    }
  }

  async scheduleSource(sourceId: number): Promise<boolean> {
    try {
      // Get source details
      const [source] = await db
        .select()
        .from(contentFeedSources)
        .where(eq(contentFeedSources.id, sourceId))
        .limit(1);

      if (!source || !source.isActive || !source.refreshInterval) {
        console.warn(`Cannot schedule source ${sourceId}: inactive or no refresh interval`);
        return false;
      }

      // Stop existing job if any
      await this.unscheduleSource(sourceId);

      // Convert refresh interval to cron expression
      const cronExpression = this.refreshIntervalToCron(source.refreshInterval);

      // Create scheduled task
      const task = cron.schedule(cronExpression, async () => {
        await this.executeSyncJob(sourceId);
      }, {
        scheduled: false, // Don't start immediately
        name: `content-feed-sync-${sourceId}`
      });

      // Store job info
      const scheduledJob: ScheduledJob = {
        sourceId,
        sourceName: source.name,
        cronExpression,
        task,
        isActive: true,
        nextRun: this.getNextCronRun(cronExpression)
      };

      this.scheduledJobs.set(sourceId, scheduledJob);

      // Start the task
      task.start();

      console.log(`📅 Scheduled content sync for "${source.name}" (${cronExpression})`);
      return true;

    } catch (error) {
      console.error(`Error scheduling source ${sourceId}:`, error);
      return false;
    }
  }

  async unscheduleSource(sourceId: number): Promise<boolean> {
    try {
      const existingJob = this.scheduledJobs.get(sourceId);
      
      if (existingJob) {
        existingJob.task.stop();
        existingJob.task.destroy();
        this.scheduledJobs.delete(sourceId);
        console.log(`🗑️ Unscheduled content sync for source ${sourceId}`);
      }

      return true;
    } catch (error) {
      console.error(`Error unscheduling source ${sourceId}:`, error);
      return false;
    }
  }

  private async executeSyncJob(sourceId: number): Promise<void> {
    try {
      const job = this.scheduledJobs.get(sourceId);
      if (!job) {
        console.warn(`No job found for source ${sourceId}`);
        return;
      }

      console.log(`🔄 Executing scheduled sync for "${job.sourceName}"`);
      job.lastRun = new Date();

      // Execute sync
      const syncResult = await this.contentFeedCore.syncContent({
        sourceId,
        syncType: 'incremental'
      });

      // Update next run time
      job.nextRun = this.getNextCronRun(job.cronExpression);

      console.log(`✅ Scheduled sync completed for "${job.sourceName}": ${syncResult.status}`);

    } catch (error) {
      console.error(`Error executing sync job for source ${sourceId}:`, error);
    }
  }

  private refreshIntervalToCron(intervalSeconds: number): string {
    // Convert seconds to appropriate cron expression
    
    if (intervalSeconds <= 60) {
      // Every minute (minimum)
      return '* * * * *';
    } else if (intervalSeconds <= 3600) {
      // Every N minutes
      const minutes = Math.max(1, Math.floor(intervalSeconds / 60));
      return `*/${minutes} * * * *`;
    } else if (intervalSeconds <= 86400) {
      // Every N hours
      const hours = Math.max(1, Math.floor(intervalSeconds / 3600));
      return `0 */${hours} * * *`;
    } else {
      // Every N days
      const days = Math.max(1, Math.floor(intervalSeconds / 86400));
      if (days === 1) {
        return '0 0 * * *'; // Daily at midnight
      } else {
        return `0 0 */${days} * *`; // Every N days
      }
    }
  }

  private getNextCronRun(cronExpression: string): Date {
    try {
      // Simple next run calculation - in production, use a proper cron library
      const now = new Date();
      
      // For demonstration, add a basic calculation
      if (cronExpression.includes('*/')) {
        const intervalMatch = cronExpression.match(/\*\/(\d+)/);
        if (intervalMatch) {
          const interval = parseInt(intervalMatch[1]);
          if (cronExpression.includes('* * * *')) {
            // Minutes
            return new Date(now.getTime() + interval * 60 * 1000);
          } else if (cronExpression.includes('* * *')) {
            // Hours
            return new Date(now.getTime() + interval * 60 * 60 * 1000);
          } else {
            // Days
            return new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);
          }
        }
      }
      
      // Default: next hour
      return new Date(now.getTime() + 60 * 60 * 1000);
    } catch (error) {
      return new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    }
  }

  private startMasterScheduler(): Promise<void> {
    return new Promise((resolve) => {
      // Master scheduler runs every 5 minutes to check for overdue syncs
      this.masterTask = cron.schedule('*/5 * * * *', async () => {
        await this.checkOverdueSyncs();
      }, {
        scheduled: true,
        name: 'content-feed-master-scheduler'
      });

      console.log('🎯 Master content feed scheduler started (checks every 5 minutes)');
      resolve();
    });
  }

  private async checkOverdueSyncs(): Promise<void> {
    try {
      const now = new Date();

      // Find sources that should have synced by now
      const overdueSources = await db
        .select()
        .from(contentFeedSources)
        .where(
          and(
            eq(contentFeedSources.isActive, true),
            lte(contentFeedSources.nextSyncAt, now)
          )
        );

      for (const source of overdueSources) {
        // Check if job is still scheduled
        const job = this.scheduledJobs.get(source.id);
        
        if (!job) {
          console.log(`🔄 Rescheduling missing job for source: ${source.name}`);
          await this.scheduleSource(source.id);
        } else if (!job.isActive) {
          console.log(`🔄 Reactivating inactive job for source: ${source.name}`);
          job.task.start();
          job.isActive = true;
        }

        // Manual sync for significantly overdue sources (more than 2x interval)
        const overdueThreshold = (source.refreshInterval || 3600) * 2 * 1000;
        if (source.nextSyncAt && (now.getTime() - source.nextSyncAt.getTime()) > overdueThreshold) {
          console.log(`⚠️ Manually triggering overdue sync for: ${source.name}`);
          await this.executeSyncJob(source.id);
        }
      }

    } catch (error) {
      console.error('Error checking overdue syncs:', error);
    }
  }

  // Public methods for external control

  async pauseSource(sourceId: number): Promise<boolean> {
    try {
      const job = this.scheduledJobs.get(sourceId);
      if (job && job.isActive) {
        job.task.stop();
        job.isActive = false;
        console.log(`⏸️ Paused content sync for source ${sourceId}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error pausing source ${sourceId}:`, error);
      return false;
    }
  }

  async resumeSource(sourceId: number): Promise<boolean> {
    try {
      const job = this.scheduledJobs.get(sourceId);
      if (job && !job.isActive) {
        job.task.start();
        job.isActive = true;
        console.log(`▶️ Resumed content sync for source ${sourceId}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error resuming source ${sourceId}:`, error);
      return false;
    }
  }

  async triggerManualSync(sourceId: number): Promise<boolean> {
    try {
      console.log(`🔄 Manually triggering sync for source ${sourceId}`);
      await this.executeSyncJob(sourceId);
      return true;
    } catch (error) {
      console.error(`Error manually triggering sync for source ${sourceId}:`, error);
      return false;
    }
  }

  getScheduledJobs(): ScheduledJob[] {
    return Array.from(this.scheduledJobs.values()).map(job => ({
      ...job,
      task: undefined as any // Don't expose the task object
    }));
  }

  getJobStatus(sourceId: number): ScheduledJob | null {
    const job = this.scheduledJobs.get(sourceId);
    if (!job) return null;

    return {
      ...job,
      task: undefined as any // Don't expose the task object
    };
  }

  async updateSourceSchedule(sourceId: number): Promise<boolean> {
    try {
      // Reschedule source with updated settings
      await this.unscheduleSource(sourceId);
      return await this.scheduleSource(sourceId);
    } catch (error) {
      console.error(`Error updating schedule for source ${sourceId}:`, error);
      return false;
    }
  }

  async shutdown(): Promise<void> {
    try {
      console.log('🛑 Shutting down Content Feed Scheduler...');

      // Stop all scheduled jobs
      for (const job of this.scheduledJobs.values()) {
        job.task.stop();
        job.task.destroy();
      }

      // Stop master scheduler
      if (this.masterTask) {
        this.masterTask.stop();
        this.masterTask.destroy();
      }

      this.scheduledJobs.clear();
      console.log('✅ Content Feed Scheduler shutdown complete');

    } catch (error) {
      console.error('Error shutting down Content Feed Scheduler:', error);
    }
  }

  // Statistics and monitoring
  getSchedulerStats(): {
    totalJobs: number;
    activeJobs: number;
    pausedJobs: number;
    upcomingSyncs: Array<{ sourceId: number; sourceName: string; nextRun: Date }>;
  } {
    const jobs = Array.from(this.scheduledJobs.values());
    const activeJobs = jobs.filter(job => job.isActive);
    const pausedJobs = jobs.filter(job => !job.isActive);

    const upcomingSyncs = jobs
      .filter(job => job.nextRun && job.isActive)
      .sort((a, b) => a.nextRun!.getTime() - b.nextRun!.getTime())
      .slice(0, 10)
      .map(job => ({
        sourceId: job.sourceId,
        sourceName: job.sourceName,
        nextRun: job.nextRun!
      }));

    return {
      totalJobs: jobs.length,
      activeJobs: activeJobs.length,
      pausedJobs: pausedJobs.length,
      upcomingSyncs
    };
  }
}