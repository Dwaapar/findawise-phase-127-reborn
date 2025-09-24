import cron from 'node-cron';
import { DatabaseStorage } from '../../storage';
import { CodexAuditEngine, AuditRequest } from './codexAuditEngine';
import { CodexSchedule } from '../../../shared/codexTables';

export interface ScheduledAuditConfig {
  name: string;
  description: string;
  cronExpression: string;
  auditTypes: ('code' | 'content' | 'seo' | 'security' | 'compliance' | 'ux' | 'performance')[];
  scope: any;
  autoFixEnabled: boolean;
  maxAutoFixes: number;
  llmConfig: any;
  notificationChannels: string[];
}

export class CodexScheduler {
  private storage: DatabaseStorage;
  private auditEngine: CodexAuditEngine;
  private scheduledJobs: Map<string, cron.ScheduledTask> = new Map();
  private isInitialized: boolean = false;

  constructor(storage: DatabaseStorage, auditEngine: CodexAuditEngine) {
    this.storage = storage;
    this.auditEngine = auditEngine;
  }

  /**
   * Initialize scheduler and load existing schedules
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🔧 Initializing Codex Scheduler...');
      
      // Load existing active schedules
      const activeSchedules = await this.storage.getCodexSchedules({ isActive: true });
      
      for (const schedule of activeSchedules) {
        await this.scheduleAudit(schedule);
      }
      
      // Create default schedules if none exist
      if (activeSchedules.length === 0) {
        await this.createDefaultSchedules();
      }
      
      this.isInitialized = true;
      console.log(`✅ Codex Scheduler initialized with ${this.scheduledJobs.size} active schedules`);
      
    } catch (error) {
      console.error('❌ Failed to initialize Codex Scheduler:', error);
      throw error;
    }
  }

  /**
   * Create a new scheduled audit
   */
  async createSchedule(config: ScheduledAuditConfig): Promise<CodexSchedule> {
    try {
      // Validate cron expression
      if (!cron.validate(config.cronExpression)) {
        throw new Error(`Invalid cron expression: ${config.cronExpression}`);
      }

      const scheduleData = {
        scheduleId: `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: config.name,
        description: config.description,
        auditTypes: config.auditTypes,
        cronExpression: config.cronExpression,
        frequency: this.cronToFrequency(config.cronExpression),
        scope: config.scope,
        autoFixEnabled: config.autoFixEnabled,
        maxAutoFixes: config.maxAutoFixes,
        llmConfig: config.llmConfig,
        notificationChannels: config.notificationChannels,
        nextRun: this.calculateNextRun(config.cronExpression),
        isActive: true,
        healthStatus: 'healthy',
        consecutiveFailures: 0
      };

      const schedule = await this.storage.createCodexSchedule(scheduleData);
      
      // Start the scheduled job
      await this.scheduleAudit(schedule);
      
      console.log(`✅ Created scheduled audit: ${schedule.name} (${schedule.frequency})`);
      
      return schedule;
      
    } catch (error) {
      console.error('❌ Failed to create schedule:', error);
      throw error;
    }
  }

  /**
   * Update existing schedule
   */
  async updateSchedule(scheduleId: string, updates: Partial<ScheduledAuditConfig>): Promise<CodexSchedule> {
    try {
      const schedule = await this.storage.getCodexSchedule(scheduleId);
      if (!schedule) {
        throw new Error(`Schedule not found: ${scheduleId}`);
      }

      // Stop existing job
      if (this.scheduledJobs.has(scheduleId)) {
        this.scheduledJobs.get(scheduleId)?.stop();
        this.scheduledJobs.delete(scheduleId);
      }

      // Update schedule data
      const updateData: any = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.description) updateData.description = updates.description;
      if (updates.cronExpression) {
        if (!cron.validate(updates.cronExpression)) {
          throw new Error(`Invalid cron expression: ${updates.cronExpression}`);
        }
        updateData.cronExpression = updates.cronExpression;
        updateData.frequency = this.cronToFrequency(updates.cronExpression);
        updateData.nextRun = this.calculateNextRun(updates.cronExpression);
      }
      if (updates.auditTypes) updateData.auditTypes = updates.auditTypes;
      if (updates.scope) updateData.scope = updates.scope;
      if (updates.autoFixEnabled !== undefined) updateData.autoFixEnabled = updates.autoFixEnabled;
      if (updates.maxAutoFixes) updateData.maxAutoFixes = updates.maxAutoFixes;
      if (updates.llmConfig) updateData.llmConfig = updates.llmConfig;
      if (updates.notificationChannels) updateData.notificationChannels = updates.notificationChannels;

      const updatedSchedule = await this.storage.updateCodexSchedule(schedule.id, updateData);

      // Restart job with new configuration
      if (updatedSchedule.isActive) {
        await this.scheduleAudit(updatedSchedule);
      }

      console.log(`✅ Updated schedule: ${updatedSchedule.name}`);
      
      return updatedSchedule;
      
    } catch (error) {
      console.error('❌ Failed to update schedule:', error);
      throw error;
    }
  }

  /**
   * Enable/disable a schedule
   */
  async toggleSchedule(scheduleId: string, isActive: boolean): Promise<CodexSchedule> {
    try {
      const schedule = await this.storage.updateCodexSchedule(
        scheduleId, 
        { isActive }
      );

      if (isActive) {
        await this.scheduleAudit(schedule);
        console.log(`✅ Enabled schedule: ${schedule.name}`);
      } else {
        if (this.scheduledJobs.has(scheduleId)) {
          this.scheduledJobs.get(scheduleId)?.stop();
          this.scheduledJobs.delete(scheduleId);
        }
        console.log(`⏸️ Disabled schedule: ${schedule.name}`);
      }

      return schedule;
      
    } catch (error) {
      console.error('❌ Failed to toggle schedule:', error);
      throw error;
    }
  }

  /**
   * Delete a schedule
   */
  async deleteSchedule(scheduleId: string): Promise<void> {
    try {
      // Stop and remove job
      if (this.scheduledJobs.has(scheduleId)) {
        this.scheduledJobs.get(scheduleId)?.stop();
        this.scheduledJobs.delete(scheduleId);
      }

      // Delete from database
      await this.storage.deleteCodexSchedule(scheduleId);
      
      console.log(`🗑️ Deleted schedule: ${scheduleId}`);
      
    } catch (error) {
      console.error('❌ Failed to delete schedule:', error);
      throw error;
    }
  }

  /**
   * Get all schedules
   */
  async getSchedules(filters?: any): Promise<CodexSchedule[]> {
    return await this.storage.getCodexSchedules(filters);
  }

  /**
   * Manually trigger a scheduled audit
   */
  async triggerAudit(scheduleId: string): Promise<void> {
    try {
      const schedule = await this.storage.getCodexSchedule(scheduleId);
      if (!schedule) {
        throw new Error(`Schedule not found: ${scheduleId}`);
      }

      console.log(`🚀 Manually triggering audit: ${schedule.name}`);
      
      await this.executeScheduledAudit(schedule);
      
    } catch (error) {
      console.error(`❌ Failed to manually trigger audit ${scheduleId}:`, error);
      throw error;
    }
  }

  /**
   * Get scheduler health status
   */
  getHealthStatus(): {
    isInitialized: boolean;
    activeJobs: number;
    totalSchedules: number;
    healthySchedules: number;
    failedSchedules: number;
  } {
    return {
      isInitialized: this.isInitialized,
      activeJobs: this.scheduledJobs.size,
      totalSchedules: 0, // Would query database
      healthySchedules: 0,
      failedSchedules: 0
    };
  }

  /**
   * Private method to actually schedule a job
   */
  private async scheduleAudit(schedule: CodexSchedule): Promise<void> {
    try {
      const task = cron.schedule(
        schedule.cronExpression!,
        async () => {
          console.log(`🔄 Running scheduled audit: ${schedule.name}`);
          await this.executeScheduledAudit(schedule);
        },
        {
          scheduled: false, // Don't start immediately
          timezone: 'UTC'
        }
      );

      // Store the task
      this.scheduledJobs.set(schedule.scheduleId, task);
      
      // Start the task
      task.start();
      
      console.log(`⏰ Scheduled audit "${schedule.name}" with cron: ${schedule.cronExpression}`);
      
    } catch (error) {
      console.error(`❌ Failed to schedule audit ${schedule.name}:`, error);
      
      // Mark schedule as unhealthy
      await this.storage.updateCodexSchedule(schedule.id, {
        healthStatus: 'failed',
        consecutiveFailures: (schedule.consecutiveFailures || 0) + 1
      });
      
      throw error;
    }
  }

  /**
   * Execute a scheduled audit
   */
  private async executeScheduledAudit(schedule: CodexSchedule): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Update last run time
      await this.storage.updateCodexSchedule(schedule.id, {
        lastRun: new Date(),
        nextRun: this.calculateNextRun(schedule.cronExpression!)
      });

      // Run audits for each type in the schedule
      const auditTypes = Array.isArray(schedule.auditTypes) ? schedule.auditTypes : [];
      
      for (const auditType of auditTypes) {
        try {
          const auditRequest: AuditRequest = {
            auditType: auditType as any,
            scope: JSON.stringify(schedule.scope) || 'global',
            autoFix: schedule.autoFixEnabled || false,
            priority: 'medium',
            triggeredBy: `schedule_${schedule.name}`,
            auditConfig: schedule.auditConfig
          };

          const result = await this.auditEngine.runAudit(auditRequest);
          
          console.log(`✅ Completed ${auditType} audit for ${schedule.name}:`, {
            issues: result.summary.totalIssues,
            score: result.summary.auditScore,
            autoFixed: result.summary.autoFixedIssues
          });

          // Send notifications if enabled
          if (schedule.notifyOnCompletion) {
            await this.sendAuditNotification(schedule, result, 'completed');
          }
          
        } catch (auditError) {
          console.error(`❌ Failed ${auditType} audit in schedule ${schedule.name}:`, auditError);
          
          if (schedule.notifyOnFailure) {
            await this.sendAuditNotification(schedule, null, 'failed', auditError);
          }
        }
      }

      // Update success metrics
      await this.storage.updateCodexSchedule(schedule.id, {
        lastSuccessfulRun: new Date(),
        healthStatus: 'healthy',
        consecutiveFailures: 0
      });

      console.log(`✅ Completed scheduled audit: ${schedule.name} (${Date.now() - startTime}ms)`);
      
    } catch (error) {
      console.error(`❌ Failed to execute scheduled audit ${schedule.name}:`, error);
      
      // Update failure metrics
      const consecutiveFailures = (schedule.consecutiveFailures || 0) + 1;
      await this.storage.updateCodexSchedule(schedule.id, {
        consecutiveFailures,
        healthStatus: consecutiveFailures >= 5 ? 'critical' : 'degraded'
      });

      // Send failure notification
      if (schedule.notifyOnFailure) {
        await this.sendAuditNotification(schedule, null, 'failed', error);
      }
    }
  }

  /**
   * Send audit notifications
   */
  private async sendAuditNotification(
    schedule: CodexSchedule,
    result: any,
    status: 'completed' | 'failed',
    error?: any
  ): Promise<void> {
    try {
      const channels = Array.isArray(schedule.notificationChannels) ? schedule.notificationChannels : [];
      
      for (const channel of channels) {
        // Implementation would send to actual notification channels
        console.log(`📧 Sending ${status} notification for ${schedule.name} to ${channel}`);
      }
      
    } catch (notifyError) {
      console.error('❌ Failed to send audit notification:', notifyError);
    }
  }

  /**
   * Create default audit schedules
   */
  private async createDefaultSchedules(): Promise<void> {
    const defaultSchedules: ScheduledAuditConfig[] = [
      {
        name: 'Daily Security Audit',
        description: 'Daily security and compliance audit',
        cronExpression: '0 2 * * *', // 2 AM daily
        auditTypes: ['security', 'compliance'],
        scope: { target: 'global' },
        autoFixEnabled: true,
        maxAutoFixes: 5,
        llmConfig: { provider: 'openai', model: 'gpt-4' },
        notificationChannels: ['admin']
      },
      {
        name: 'Weekly Code Quality Audit',
        description: 'Weekly comprehensive code quality audit',
        cronExpression: '0 3 * * 1', // 3 AM every Monday
        auditTypes: ['code', 'performance'],
        scope: { target: 'all_modules' },
        autoFixEnabled: false,
        maxAutoFixes: 0,
        llmConfig: { provider: 'openai', model: 'gpt-4' },
        notificationChannels: ['admin', 'developers']
      },
      {
        name: 'SEO & Content Audit',
        description: 'Weekly SEO and content quality audit',
        cronExpression: '0 4 * * 3', // 4 AM every Wednesday
        auditTypes: ['seo', 'content', 'ux'],
        scope: { target: 'content_modules' },
        autoFixEnabled: true,
        maxAutoFixes: 10,
        llmConfig: { provider: 'openai', model: 'gpt-4' },
        notificationChannels: ['admin', 'content_team']
      }
    ];

    for (const config of defaultSchedules) {
      try {
        await this.createSchedule(config);
      } catch (error) {
        console.error(`❌ Failed to create default schedule ${config.name}:`, error);
      }
    }

    console.log('✅ Created default audit schedules');
  }

  /**
   * Helper methods
   */
  private cronToFrequency(cronExpression: string): string {
    // Parse cron expression to human-readable frequency
    const parts = cronExpression.split(' ');
    
    if (parts[2] === '*' && parts[3] === '*' && parts[4] === '*') return 'daily';
    if (parts[4] !== '*') return 'weekly';
    if (parts[3] !== '*') return 'monthly';
    if (parts[1] !== '*' || parts[0] !== '*') return 'hourly';
    
    return 'custom';
  }

  private calculateNextRun(cronExpression: string): Date {
    // Calculate next run time based on cron expression
    // For now, return current time + 1 hour as approximation
    return new Date(Date.now() + 60 * 60 * 1000);
  }

  /**
   * Cleanup method
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up Codex Scheduler...');
    
    // Stop all scheduled jobs
    for (const [scheduleId, task] of this.scheduledJobs) {
      task.stop();
      console.log(`⏹️ Stopped scheduled job: ${scheduleId}`);
    }
    
    this.scheduledJobs.clear();
    this.isInitialized = false;
    
    console.log('✅ Codex Scheduler cleanup complete');
  }
}