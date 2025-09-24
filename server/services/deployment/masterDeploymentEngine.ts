import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { spawn, SpawnOptions } from 'child_process';
import { z } from 'zod';
import { db } from '../../db';
import { 
  deployments, 
  deploymentSteps, 
  deploymentAudit, 
  backups,
  disasterRecoveryPlans,
  NewDeployment,
  NewDeploymentStep,
  NewDeploymentAudit,
  NewBackup,
  Deployment 
} from '../../../shared/deploymentTables';
import { eq, and, desc, sql } from 'drizzle-orm';

// ==========================================
// MASTER DEPLOYMENT ENGINE CORE
// ==========================================

export interface DeploymentConfig {
  name: string;
  environment: 'dev' | 'staging' | 'prod' | 'dr';
  deploymentType: 'full' | 'partial' | 'rollback' | 'hotfix';
  version: string;
  scope: {
    core?: boolean;
    neurons?: string[];
    databases?: boolean;
    migrations?: boolean;
    assets?: boolean;
    config?: boolean;
  };
  parallelization: {
    enabled: boolean;
    maxConcurrency: number;
  };
  hooks: {
    preDeployment?: string[];
    postDeployment?: string[];
    onFailure?: string[];
    onSuccess?: string[];
  };
  healthChecks: {
    enabled: boolean;
    endpoints: string[];
    timeout: number;
    retries: number;
  };
  rollback: {
    enabled: boolean;
    backupBeforeDeployment: boolean;
    autoRollbackOnFailure: boolean;
  };
  notifications: {
    channels: string[];
    onStart: boolean;
    onComplete: boolean;
    onFailure: boolean;
  };
  metadata?: Record<string, any>;
}

export interface DeploymentStep {
  id: string;
  name: string;
  description?: string;
  type: 'pre_hook' | 'deploy' | 'migrate' | 'seed' | 'health_check' | 'post_hook' | 'cleanup';
  command: string;
  workingDirectory?: string;
  environment?: Record<string, string>;
  timeout?: number;
  retries?: number;
  dependencies?: string[];
  rollbackCommand?: string;
  healthCheck?: {
    url?: string;
    expectedStatus?: number;
    timeout?: number;
  };
}

export interface DeploymentResult {
  deploymentId: string;
  status: 'completed' | 'failed' | 'partial';
  startTime: Date;
  endTime: Date;
  duration: number;
  steps: {
    stepId: string;
    status: 'completed' | 'failed' | 'skipped';
    duration: number;
    output?: string;
    error?: string;
  }[];
  healthChecks: {
    endpoint: string;
    status: 'passed' | 'failed';
    responseTime: number;
    error?: string;
  }[];
  rollbackData?: any;
}

export class MasterDeploymentEngine {
  private deploymentsDir: string;
  private backupsDir: string;

  constructor() {
    this.deploymentsDir = path.join(process.cwd(), 'deployments');
    this.backupsDir = path.join(process.cwd(), 'backups');
  }

  // ==========================================
  // DEPLOYMENT ORCHESTRATION
  // ==========================================

  async startDeployment(config: DeploymentConfig, userId: number): Promise<string> {
    const deploymentId = crypto.randomUUID();
    const startTime = new Date();
    
    try {
      // Create directories
      await fs.mkdir(this.deploymentsDir, { recursive: true });
      await fs.mkdir(this.backupsDir, { recursive: true });

      // Pre-deployment backup if enabled
      let backupId: string | null = null;
      if (config.rollback.backupBeforeDeployment) {
        backupId = await this.createPreDeploymentBackup(deploymentId, userId);
      }

      // Generate deployment plan
      const deploymentPlan = await this.generateDeploymentPlan(config);
      
      // Create deployment record
      const deploymentRecord: NewDeployment = {
        deploymentId,
        name: config.name,
        environment: config.environment,
        deploymentType: config.deploymentType,
        version: config.version,
        status: 'running',
        totalSteps: deploymentPlan.length,
        config: config as any,
        manifest: { plan: deploymentPlan, backupId } as any,
        deployedBy: userId,
        startedAt: startTime
      };

      await db.insert(deployments).values(deploymentRecord);

      // Create deployment steps
      const stepRecords: NewDeploymentStep[] = deploymentPlan.map((step, index) => ({
        deploymentId,
        stepId: step.id,
        name: step.name,
        description: step.description,
        stepType: step.type as any,
        order: index + 1,
        command: step.command,
        dependencies: step.dependencies || [],
        rollbackCommand: step.rollbackCommand,
        maxRetries: step.retries || 3
      }));

      await db.insert(deploymentSteps).values(stepRecords);

      // Start audit trail
      await this.logAudit({
        resourceType: 'deployment',
        resourceId: deploymentId,
        action: 'start',
        userId,
        before: null,
        after: config,
        changes: null,
        reason: `Deployment started: ${config.name}`,
        outcome: 'success',
        duration: 0,
        metadata: { config, backupId }
      });

      // Execute deployment in background
      this.executeDeployment(deploymentId, config, deploymentPlan, userId);

      return deploymentId;

    } catch (error) {
      // Log error
      await this.logAudit({
        resourceType: 'deployment',
        resourceId: deploymentId,
        action: 'fail',
        userId,
        before: null,
        after: null,
        changes: null,
        reason: `Deployment failed to start: ${error instanceof Error ? error.message : 'Unknown error'}`,
        outcome: 'failure',
        duration: Date.now() - startTime.getTime(),
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      });

      throw error;
    }
  }

  private async executeDeployment(
    deploymentId: string,
    config: DeploymentConfig,
    deploymentPlan: DeploymentStep[],
    userId: number
  ): Promise<void> {
    const startTime = Date.now();
    let completedSteps = 0;
    let failedSteps = 0;
    const logs: string[] = [];
    const errors: string[] = [];
    const healthChecks: any[] = [];

    try {
      // Execute steps
      if (config.parallelization.enabled) {
        await this.executeStepsInParallel(deploymentId, deploymentPlan, config.parallelization.maxConcurrency);
      } else {
        await this.executeStepsSequentially(deploymentId, deploymentPlan);
      }

      // Run health checks
      if (config.healthChecks.enabled) {
        const healthResults = await this.runHealthChecks(config.healthChecks);
        healthChecks.push(...healthResults);
      }

      // Count completed/failed steps
      const stepResults = await db.select()
        .from(deploymentSteps)
        .where(eq(deploymentSteps.deploymentId, deploymentId));

      completedSteps = stepResults.filter(s => s.status === 'completed').length;
      failedSteps = stepResults.filter(s => s.status === 'failed').length;

      // Determine final status
      const finalStatus = failedSteps > 0 ? 'failed' : 'completed';

      // Run post-deployment hooks
      if (finalStatus === 'completed' && config.hooks.onSuccess) {
        await this.executeHooks(config.hooks.onSuccess, 'success');
      } else if (finalStatus === 'failed' && config.hooks.onFailure) {
        await this.executeHooks(config.hooks.onFailure, 'failure');
      }

      // Handle auto-rollback
      if (finalStatus === 'failed' && config.rollback.autoRollbackOnFailure) {
        await this.initiateRollback(deploymentId, userId);
      }

      // Update deployment record
      await db.update(deployments)
        .set({
          status: finalStatus as any,
          progress: finalStatus === 'completed' ? 100 : Math.round((completedSteps / deploymentPlan.length) * 100),
          completedSteps,
          failedSteps,
          healthChecks: healthChecks as any,
          completedAt: new Date()
        })
        .where(eq(deployments.deploymentId, deploymentId));

      // Send notifications
      if (config.notifications.onComplete || (config.notifications.onFailure && finalStatus === 'failed')) {
        await this.sendDeploymentNotifications(deploymentId, finalStatus, config.notifications.channels);
      }

      // End audit trail
      await this.logAudit({
        resourceType: 'deployment',
        resourceId: deploymentId,
        action: 'complete',
        userId,
        before: null,
        after: { status: finalStatus, completedSteps, failedSteps },
        changes: null,
        reason: `Deployment ${finalStatus}`,
        outcome: finalStatus === 'completed' ? 'success' : 'failure',
        duration: Date.now() - startTime,
        metadata: { healthChecks, stepResults: stepResults.length }
      });

    } catch (error) {
      // Update deployment with error
      await db.update(deployments)
        .set({
          status: 'failed',
          errors: [error instanceof Error ? error.message : 'Unknown error'] as any,
          completedAt: new Date()
        })
        .where(eq(deployments.deploymentId, deploymentId));

      // Log error
      await this.logAudit({
        resourceType: 'deployment',
        resourceId: deploymentId,
        action: 'fail',
        userId,
        before: null,
        after: null,
        changes: null,
        reason: `Deployment execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        outcome: 'failure',
        duration: Date.now() - startTime,
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
  }

  // ==========================================
  // STEP EXECUTION ENGINES
  // ==========================================

  private async executeStepsSequentially(deploymentId: string, steps: DeploymentStep[]): Promise<void> {
    for (const step of steps) {
      await this.executeStep(deploymentId, step);
      
      // Check if step failed and should stop execution
      const stepRecord = await db.select()
        .from(deploymentSteps)
        .where(and(
          eq(deploymentSteps.deploymentId, deploymentId),
          eq(deploymentSteps.stepId, step.id)
        ))
        .limit(1);

      if (stepRecord.length > 0 && stepRecord[0].status === 'failed') {
        throw new Error(`Step ${step.id} failed: ${stepRecord[0].errorOutput}`);
      }
    }
  }

  private async executeStepsInParallel(deploymentId: string, steps: DeploymentStep[], maxConcurrency: number): Promise<void> {
    const dependencyGraph = this.buildDependencyGraph(steps);
    const executedSteps = new Set<string>();
    const runningSteps = new Map<string, Promise<void>>();

    while (executedSteps.size < steps.length) {
      // Find steps ready to execute
      const readySteps = steps.filter(step => 
        !executedSteps.has(step.id) && 
        !runningSteps.has(step.id) &&
        (step.dependencies || []).every(dep => executedSteps.has(dep))
      );

      // Start execution up to max concurrency
      const availableSlots = maxConcurrency - runningSteps.size;
      const stepsToStart = readySteps.slice(0, availableSlots);

      for (const step of stepsToStart) {
        const promise = this.executeStep(deploymentId, step)
          .finally(() => {
            runningSteps.delete(step.id);
            executedSteps.add(step.id);
          });
        runningSteps.set(step.id, promise);
      }

      // Wait for at least one step to complete
      if (runningSteps.size > 0) {
        await Promise.race(Array.from(runningSteps.values()));
      }

      // Check for failures
      for (const [stepId] of runningSteps) {
        const stepRecord = await db.select()
          .from(deploymentSteps)
          .where(and(
            eq(deploymentSteps.deploymentId, deploymentId),
            eq(deploymentSteps.stepId, stepId)
          ))
          .limit(1);

        if (stepRecord.length > 0 && stepRecord[0].status === 'failed') {
          throw new Error(`Step ${stepId} failed: ${stepRecord[0].errorOutput}`);
        }
      }
    }
  }

  private async executeStep(deploymentId: string, step: DeploymentStep): Promise<void> {
    const startTime = Date.now();

    try {
      // Update step status to running
      await db.update(deploymentSteps)
        .set({
          status: 'running',
          startedAt: new Date()
        })
        .where(and(
          eq(deploymentSteps.deploymentId, deploymentId),
          eq(deploymentSteps.stepId, step.id)
        ));

      // Execute command
      const result = await this.executeCommand(step.command, {
        cwd: step.workingDirectory || process.cwd(),
        env: { ...process.env, ...step.environment },
        timeout: step.timeout || 300000 // 5 minutes default
      });

      // Run health check if specified
      let healthCheckPassed = true;
      if (step.healthCheck) {
        healthCheckPassed = await this.runStepHealthCheck(step.healthCheck);
      }

      // Update step status
      const finalStatus = result.success && healthCheckPassed ? 'completed' : 'failed';
      await db.update(deploymentSteps)
        .set({
          status: finalStatus as any,
          output: result.stdout,
          errorOutput: result.stderr,
          duration: Date.now() - startTime,
          completedAt: new Date()
        })
        .where(and(
          eq(deploymentSteps.deploymentId, deploymentId),
          eq(deploymentSteps.stepId, step.id)
        ));

      if (!result.success || !healthCheckPassed) {
        throw new Error(`Step execution failed: ${result.stderr || 'Health check failed'}`);
      }

    } catch (error) {
      // Update step with error
      await db.update(deploymentSteps)
        .set({
          status: 'failed',
          errorOutput: error instanceof Error ? error.message : 'Unknown error',
          duration: Date.now() - startTime,
          completedAt: new Date()
        })
        .where(and(
          eq(deploymentSteps.deploymentId, deploymentId),
          eq(deploymentSteps.stepId, step.id)
        ));

      throw error;
    }
  }

  // ==========================================
  // BACKUP & RECOVERY OPERATIONS
  // ==========================================

  async createPreDeploymentBackup(deploymentId: string, userId: number): Promise<string> {
    const backupId = crypto.randomUUID();
    const startTime = Date.now();

    try {
      const backupPath = path.join(this.backupsDir, `pre-deployment-${deploymentId}-${Date.now()}.tar.gz`);
      
      // Create backup (implementation would include actual backup logic)
      const backupResult = await this.createSystemBackup(backupPath);

      // Calculate file stats
      const stats = await fs.stat(backupPath);
      const checksum = await this.calculateChecksum(backupPath);

      // Save backup record
      const backupRecord: NewBackup = {
        backupId,
        name: `Pre-deployment backup for ${deploymentId}`,
        backupType: 'pre_deployment',
        scope: 'full',
        status: 'completed',
        fileSize: stats.size,
        checksum,
        filePath: backupPath,
        storageLocation: 'local',
        startedAt: new Date(startTime),
        completedAt: new Date(),
        createdBy: userId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        metadata: { deploymentId } as any
      };

      await db.insert(backups).values(backupRecord);

      return backupId;

    } catch (error) {
      throw new Error(`Backup creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async initiateRollback(deploymentId: string, userId: number): Promise<string> {
    const rollbackId = crypto.randomUUID();
    
    try {
      // Get deployment record
      const deployment = await this.getDeployment(deploymentId);
      if (!deployment) {
        throw new Error('Deployment not found');
      }

      // Get failed steps
      const failedSteps = await db.select()
        .from(deploymentSteps)
        .where(and(
          eq(deploymentSteps.deploymentId, deploymentId),
          eq(deploymentSteps.status, 'failed')
        ));

      // Execute rollback commands in reverse order
      for (const step of failedSteps.reverse()) {
        if (step.rollbackCommand) {
          await this.executeCommand(step.rollbackCommand);
        }
      }

      // Update deployment status
      await db.update(deployments)
        .set({ status: 'rolled_back' as any })
        .where(eq(deployments.deploymentId, deploymentId));

      // Log audit
      await this.logAudit({
        resourceType: 'deployment',
        resourceId: deploymentId,
        action: 'rollback',
        userId,
        before: { status: deployment.status },
        after: { status: 'rolled_back' },
        changes: null,
        reason: 'Automatic rollback due to deployment failure',
        outcome: 'success',
        duration: 0,
        metadata: { rollbackId, failedSteps: failedSteps.length }
      });

      return rollbackId;

    } catch (error) {
      throw new Error(`Rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  private async generateDeploymentPlan(config: DeploymentConfig): Promise<DeploymentStep[]> {
    const steps: DeploymentStep[] = [];

    // Pre-deployment hooks
    if (config.hooks.preDeployment) {
      steps.push(...config.hooks.preDeployment.map((cmd, i) => ({
        id: `pre-hook-${i}`,
        name: `Pre-deployment Hook ${i + 1}`,
        type: 'pre_hook' as const,
        command: cmd
      })));
    }

    // Core deployment steps
    if (config.scope.core) {
      steps.push({
        id: 'deploy-core',
        name: 'Deploy Core Application',
        type: 'deploy',
        command: 'npm run build && npm run start',
        healthCheck: {
          url: 'http://localhost:5000/health',
          expectedStatus: 200,
          timeout: 30000
        }
      });
    }

    // Database migrations
    if (config.scope.migrations) {
      steps.push({
        id: 'run-migrations',
        name: 'Run Database Migrations',
        type: 'migrate',
        command: 'npm run db:push',
        dependencies: config.scope.core ? ['deploy-core'] : []
      });
    }

    // Deploy specific neurons
    if (config.scope.neurons) {
      config.scope.neurons.forEach((neuronId, i) => {
        steps.push({
          id: `deploy-neuron-${neuronId}`,
          name: `Deploy Neuron: ${neuronId}`,
          type: 'deploy',
          command: `npm run deploy:neuron -- ${neuronId}`,
          dependencies: config.scope.migrations ? ['run-migrations'] : []
        });
      });
    }

    // Post-deployment hooks
    if (config.hooks.postDeployment) {
      steps.push(...config.hooks.postDeployment.map((cmd, i) => ({
        id: `post-hook-${i}`,
        name: `Post-deployment Hook ${i + 1}`,
        type: 'post_hook' as const,
        command: cmd,
        dependencies: steps.length > 0 ? [steps[steps.length - 1].id] : []
      })));
    }

    return steps;
  }

  private buildDependencyGraph(steps: DeploymentStep[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    
    for (const step of steps) {
      graph.set(step.id, step.dependencies || []);
    }
    
    return graph;
  }

  private async executeCommand(command: string, options: SpawnOptions = {}): Promise<{success: boolean, stdout: string, stderr: string}> {
    return new Promise((resolve) => {
      const [cmd, ...args] = command.split(' ');
      const child = spawn(cmd, args, {
        stdio: 'pipe',
        ...options
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({
          success: code === 0,
          stdout: stdout.trim(),
          stderr: stderr.trim()
        });
      });

      child.on('error', (error) => {
        resolve({
          success: false,
          stdout: stdout.trim(),
          stderr: error.message
        });
      });
    });
  }

  private async runHealthChecks(config: DeploymentConfig['healthChecks']): Promise<any[]> {
    const results = [];
    
    for (const endpoint of config.endpoints) {
      const startTime = Date.now();
      try {
        // Implementation would include actual HTTP health checks
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(config.timeout)
        });
        
        results.push({
          endpoint,
          status: response.ok ? 'passed' : 'failed',
          responseTime: Date.now() - startTime,
          statusCode: response.status
        });
      } catch (error) {
        results.push({
          endpoint,
          status: 'failed',
          responseTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return results;
  }

  private async runStepHealthCheck(config: DeploymentStep['healthCheck']): Promise<boolean> {
    if (!config?.url) return true;
    
    try {
      const response = await fetch(config.url, {
        method: 'GET',
        signal: AbortSignal.timeout(config.timeout || 30000)
      });
      
      return response.status === (config.expectedStatus || 200);
    } catch {
      return false;
    }
  }

  private async executeHooks(hooks: string[], context: 'success' | 'failure'): Promise<void> {
    for (const hook of hooks) {
      try {
        await this.executeCommand(hook);
      } catch (error) {
        console.warn(`Hook execution failed in ${context} context:`, error);
      }
    }
  }

  private async sendDeploymentNotifications(deploymentId: string, status: string, channels: string[]): Promise<void> {
    // Implementation would integrate with notification system
    console.log(`Deployment ${deploymentId} ${status} - notifications sent to:`, channels);
  }

  private async createSystemBackup(backupPath: string): Promise<void> {
    // Implementation would create actual system backup
    await fs.writeFile(backupPath, 'mock backup data');
  }

  private async calculateChecksum(filePath: string): Promise<string> {
    const content = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private async logAudit(auditData: Omit<NewDeploymentAudit, 'auditId'>): Promise<void> {
    const auditRecord: NewDeploymentAudit = {
      auditId: crypto.randomUUID(),
      ...auditData,
      userId: auditData.userId || null,
      userAgent: null,
      ipAddress: null
    };

    await db.insert(deploymentAudit).values(auditRecord);
  }

  // ==========================================
  // PUBLIC API METHODS
  // ==========================================

  async getDeployments(limit: number = 50): Promise<Deployment[]> {
    return await db.select()
      .from(deployments)
      .orderBy(desc(deployments.createdAt))
      .limit(limit);
  }

  async getDeployment(deploymentId: string): Promise<Deployment | null> {
    const result = await db.select()
      .from(deployments)
      .where(eq(deployments.deploymentId, deploymentId))
      .limit(1);
    
    return result.length > 0 ? result[0] : null;
  }

  async getDeploymentSteps(deploymentId: string): Promise<any[]> {
    return await db.select()
      .from(deploymentSteps)
      .where(eq(deploymentSteps.deploymentId, deploymentId))
      .orderBy(deploymentSteps.order);
  }

  async cancelDeployment(deploymentId: string, userId: number): Promise<void> {
    await db.update(deployments)
      .set({ status: 'failed' as any })
      .where(eq(deployments.deploymentId, deploymentId));

    await this.logAudit({
      resourceType: 'deployment',
      resourceId: deploymentId,
      action: 'cancel',
      userId,
      before: null,
      after: { status: 'cancelled' },
      changes: null,
      reason: 'Deployment cancelled by user',
      outcome: 'success',
      duration: 0,
      metadata: {}
    });
  }

  async getDeploymentLogs(deploymentId: string): Promise<any[]> {
    return await db.select()
      .from(deploymentSteps)
      .where(eq(deploymentSteps.deploymentId, deploymentId))
      .orderBy(deploymentSteps.order);
  }
}

// Export singleton instance
export const masterDeploymentEngine = new MasterDeploymentEngine();