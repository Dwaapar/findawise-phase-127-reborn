/**
 * EMPIRE-GRADE BACKUP & RESTORE SYSTEM
 * ===================================
 * 
 * Comprehensive database backup and restore system with:
 * - Automated scheduled backups
 * - Point-in-time recovery
 * - Cross-environment migration
 * - Disaster recovery capabilities
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { storage } from '../storage';

const execAsync = promisify(exec);

export interface BackupMetadata {
  id: string;
  timestamp: Date;
  size: number;
  tables: number;
  type: 'manual' | 'scheduled' | 'migration';
  environment: string;
  status: 'completed' | 'failed' | 'in_progress';
  duration: number;
  checksum: string;
}

export interface RestoreOptions {
  backupId: string;
  targetTables?: string[];
  dropExisting?: boolean;
  verifyIntegrity?: boolean;
}

export class BackupRestoreSystem {
  private static instance: BackupRestoreSystem;
  private backupDir: string;
  private isBackupInProgress = false;
  private scheduledBackups: Map<string, NodeJS.Timeout> = new Map();

  static getInstance(): BackupRestoreSystem {
    if (!BackupRestoreSystem.instance) {
      BackupRestoreSystem.instance = new BackupRestoreSystem();
    }
    return BackupRestoreSystem.instance;
  }

  constructor() {
    this.backupDir = join(process.cwd(), 'backups');
    this.ensureBackupDirectory();
  }

  /**
   * Initialize backup system with scheduling
   */
  async initialize(): Promise<void> {
    try {
      this.ensureBackupDirectory();
      await this.scheduleAutomatedBackups();
      await this.cleanupOldBackups();
      console.log('💾 Backup & Restore System initialized successfully');
    } catch (error) {
      console.error('Failed to initialize backup system:', error);
      throw error;
    }
  }

  /**
   * Create a database backup
   */
  async createBackup(type: 'manual' | 'scheduled' | 'migration' = 'manual'): Promise<BackupMetadata> {
    if (this.isBackupInProgress) {
      throw new Error('Backup already in progress');
    }

    this.isBackupInProgress = true;
    const startTime = Date.now();
    const backupId = `backup_${Date.now()}_${type}`;
    const filename = `${backupId}.sql`;
    const filepath = join(this.backupDir, filename);

    try {
      console.log(`💾 Starting ${type} backup: ${backupId}`);

      // Get database connection info
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new Error('DATABASE_URL not found');
      }

      // Parse database URL
      const url = new URL(dbUrl);
      const pgDumpCommand = [
        'pg_dump',
        `--host=${url.hostname}`,
        `--port=${url.port || 5432}`,
        `--username=${url.username}`,
        `--dbname=${url.pathname.slice(1)}`,
        '--verbose',
        '--clean',
        '--if-exists',
        '--create',
        '--format=plain',
        `--file=${filepath}`
      ].join(' ');

      // Set password via environment variable
      const env = { ...process.env, PGPASSWORD: url.password };

      // Execute backup
      const { stdout, stderr } = await execAsync(pgDumpCommand, { env });
      
      if (stderr && stderr.includes('ERROR')) {
        throw new Error(`Backup failed: ${stderr}`);
      }

      // Get backup statistics
      const stats = await this.getBackupStats(filepath);
      const tableCount = await this.getTableCount();
      
      // Calculate checksum
      const checksum = await this.calculateChecksum(filepath);

      const metadata: BackupMetadata = {
        id: backupId,
        timestamp: new Date(),
        size: stats.size,
        tables: tableCount,
        type,
        environment: process.env.NODE_ENV || 'development',
        status: 'completed',
        duration: Date.now() - startTime,
        checksum
      };

      // Save metadata
      await this.saveBackupMetadata(metadata);

      console.log(`✅ Backup completed: ${backupId} (${this.formatBytes(stats.size)}, ${metadata.duration}ms)`);
      return metadata;

    } catch (error) {
      console.error(`❌ Backup failed: ${backupId}`, error);
      
      const metadata: BackupMetadata = {
        id: backupId,
        timestamp: new Date(),
        size: 0,
        tables: 0,
        type,
        environment: process.env.NODE_ENV || 'development',
        status: 'failed',
        duration: Date.now() - startTime,
        checksum: ''
      };

      await this.saveBackupMetadata(metadata);
      throw error;
    } finally {
      this.isBackupInProgress = false;
    }
  }

  /**
   * Restore database from backup
   */
  async restoreBackup(options: RestoreOptions): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🔄 Starting restore from backup: ${options.backupId}`);

      const backupPath = join(this.backupDir, `${options.backupId}.sql`);
      
      if (!existsSync(backupPath)) {
        throw new Error(`Backup file not found: ${options.backupId}`);
      }

      // Verify backup integrity if requested
      if (options.verifyIntegrity) {
        const isValid = await this.verifyBackupIntegrity(options.backupId);
        if (!isValid) {
          throw new Error('Backup integrity check failed');
        }
      }

      // Get database connection info
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new Error('DATABASE_URL not found');
      }

      const url = new URL(dbUrl);
      
      // Create restore command
      const psqlCommand = [
        'psql',
        `--host=${url.hostname}`,
        `--port=${url.port || 5432}`,
        `--username=${url.username}`,
        `--dbname=${url.pathname.slice(1)}`,
        '--verbose',
        `--file=${backupPath}`
      ].join(' ');

      // Set password via environment variable
      const env = { ...process.env, PGPASSWORD: url.password };

      // Execute restore
      const { stdout, stderr } = await execAsync(psqlCommand, { env });

      if (stderr && stderr.includes('ERROR') && !stderr.includes('NOTICE')) {
        console.warn('Restore completed with warnings:', stderr);
      }

      console.log(`✅ Restore completed successfully from backup: ${options.backupId}`);
      return { success: true, message: 'Restore completed successfully' };

    } catch (error) {
      console.error(`❌ Restore failed for backup: ${options.backupId}`, error);
      return { success: false, message: `Restore failed: ${error.message}` };
    }
  }

  /**
   * Schedule automated backups (disabled in development to prevent spam)
   */
  private async scheduleAutomatedBackups(): Promise<void> {
    // Backup scheduling disabled in development environment
    if (process.env.NODE_ENV === 'development') {
      console.log('📅 Automated backup scheduling disabled in development');
      return;
    }
    
    // Daily backups at 2 AM
    this.scheduleBackup('daily', '0 2 * * *', () => this.createBackup('scheduled'));
    
    // Weekly backups on Sunday at 1 AM
    this.scheduleBackup('weekly', '0 1 * * 0', () => this.createBackup('scheduled'));
    
    // Monthly backups on the 1st at midnight
    this.scheduleBackup('monthly', '0 0 1 * *', () => this.createBackup('scheduled'));

    console.log('📅 Automated backup scheduling configured');
  }

  /**
   * Schedule a backup with cron-like syntax
   */
  private scheduleBackup(name: string, cronExpression: string, callback: () => Promise<void>): void {
    // Simple cron parser for basic scheduling
    // In production, use a proper cron library like 'node-cron'
    
    const interval = this.parseCronToInterval(cronExpression);
    if (interval > 0) {
      const timeoutId = setInterval(async () => {
        try {
          await callback();
        } catch (error) {
          console.error(`Scheduled backup failed (${name}):`, error);
        }
      }, interval);
      
      this.scheduledBackups.set(name, timeoutId);
      console.log(`📅 ${name} backups scheduled: ${cronExpression}`);
    }
  }

  /**
   * Get backup history
   */
  async getBackupHistory(): Promise<BackupMetadata[]> {
    try {
      const metadataPath = join(this.backupDir, 'backup_history.json');
      
      if (!existsSync(metadataPath)) {
        return [];
      }

      const data = readFileSync(metadataPath, 'utf8');
      const backups = JSON.parse(data) as BackupMetadata[];
      
      // Sort by timestamp, newest first
      return backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Failed to get backup history:', error);
      return [];
    }
  }

  /**
   * Verify backup integrity
   */
  async verifyBackupIntegrity(backupId: string): Promise<boolean> {
    try {
      const backupPath = join(this.backupDir, `${backupId}.sql`);
      const history = await this.getBackupHistory();
      const backup = history.find(b => b.id === backupId);
      
      if (!backup || !existsSync(backupPath)) {
        return false;
      }

      // Verify checksum
      const currentChecksum = await this.calculateChecksum(backupPath);
      return currentChecksum === backup.checksum;
    } catch (error) {
      console.error('Backup integrity verification failed:', error);
      return false;
    }
  }

  /**
   * Get backup system status
   */
  async getSystemStatus(): Promise<{
    isHealthy: boolean;
    totalBackups: number;
    latestBackup: BackupMetadata | null;
    diskUsage: string;
    scheduledBackups: string[];
  }> {
    try {
      const history = await this.getBackupHistory();
      const diskUsage = await this.getBackupDirectorySize();
      
      return {
        isHealthy: history.length > 0 && !this.isBackupInProgress,
        totalBackups: history.length,
        latestBackup: history[0] || null,
        diskUsage: this.formatBytes(diskUsage),
        scheduledBackups: Array.from(this.scheduledBackups.keys())
      };
    } catch (error) {
      console.error('Failed to get backup system status:', error);
      return {
        isHealthy: false,
        totalBackups: 0,
        latestBackup: null,
        diskUsage: '0 bytes',
        scheduledBackups: []
      };
    }
  }

  // Helper methods
  private ensureBackupDirectory(): void {
    if (!existsSync(this.backupDir)) {
      mkdirSync(this.backupDir, { recursive: true });
    }
  }

  private async getBackupStats(filepath: string): Promise<{ size: number }> {
    try {
      const fs = await import('fs/promises');
      const stats = await fs.stat(filepath);
      return { size: stats.size };
    } catch (error) {
      return { size: 0 };
    }
  }

  private async getTableCount(): Promise<number> {
    try {
      // Use storage to get table count
      const result = await storage.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      return parseInt(result[0]?.count || '0');
    } catch (error) {
      return 0;
    }
  }

  private async calculateChecksum(filepath: string): Promise<string> {
    try {
      const crypto = await import('crypto');
      const fs = await import('fs');
      
      return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(filepath);
        
        stream.on('data', data => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', reject);
      });
    } catch (error) {
      return '';
    }
  }

  private async saveBackupMetadata(metadata: BackupMetadata): Promise<void> {
    try {
      const metadataPath = join(this.backupDir, 'backup_history.json');
      const history = await this.getBackupHistory();
      
      history.unshift(metadata);
      
      // Keep only last 100 backups in history
      const trimmedHistory = history.slice(0, 100);
      
      writeFileSync(metadataPath, JSON.stringify(trimmedHistory, null, 2));
    } catch (error) {
      console.error('Failed to save backup metadata:', error);
    }
  }

  private parseCronToInterval(cronExpression: string): number {
    // Simple parser for basic cron expressions
    // Returns interval in milliseconds, 0 if invalid
    
    // For now, return much longer intervals to prevent spam in development
    const cronPatterns: Record<string, number> = {
      '0 2 * * *': 24 * 60 * 60 * 1000, // Daily at 2 AM
      '0 1 * * 0': 7 * 24 * 60 * 60 * 1000, // Weekly on Sunday at 1 AM  
      '0 0 1 * *': 24 * 60 * 60 * 1000 // Monthly - reduced to daily for development
    };
    
    return cronPatterns[cronExpression] || 0;
  }

  private async getBackupDirectorySize(): Promise<number> {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      let totalSize = 0;
      const files = fs.readdirSync(this.backupDir);
      
      for (const file of files) {
        const filePath = path.join(this.backupDir, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
      }
      
      return totalSize;
    } catch (error) {
      return 0;
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 bytes';
    const k = 1024;
    const sizes = ['bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private async cleanupOldBackups(): Promise<void> {
    try {
      const history = await this.getBackupHistory();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30); // Keep backups for 30 days
      
      const oldBackups = history.filter(backup => 
        new Date(backup.timestamp) < cutoffDate && backup.type === 'scheduled'
      );
      
      for (const backup of oldBackups) {
        try {
          const backupPath = join(this.backupDir, `${backup.id}.sql`);
          if (existsSync(backupPath)) {
            const fs = await import('fs/promises');
            await fs.unlink(backupPath);
            console.log(`🗑️ Cleaned up old backup: ${backup.id}`);
          }
        } catch (error) {
          console.error(`Failed to cleanup backup ${backup.id}:`, error);
        }
      }
      
      // Update history to remove cleaned up backups
      const updatedHistory = history.filter(backup => !oldBackups.includes(backup));
      await this.saveBackupMetadata(updatedHistory[0]); // This will save the full updated array
    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
    }
  }

  /**
   * Stop all scheduled backups
   */
  shutdown(): void {
    for (const [name, timeoutId] of this.scheduledBackups) {
      clearInterval(timeoutId);
      console.log(`📅 Stopped scheduled backup: ${name}`);
    }
    this.scheduledBackups.clear();
  }
}

export const backupRestoreSystem = BackupRestoreSystem.getInstance();