import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

interface ConfigBackup {
  id: string;
  runId: string;
  timestamp: Date;
  description: string;
  files: {
    [filePath: string]: string;
  };
}

class ConfigManagerService {
  private readonly backupDir = path.join(process.cwd(), 'config-history');
  private readonly configDir = path.join(process.cwd(), 'client', 'src', 'config');
  private readonly lockedConfigs = new Set<string>();

  constructor() {
    this.initializeConfigManager();
  }

  private async initializeConfigManager(): Promise<void> {
    await fs.mkdir(this.backupDir, { recursive: true });
    await fs.mkdir(this.configDir, { recursive: true });
  }

  /**
   * Create a backup of current configuration
   */
  async createBackup(runId: string, description: string): Promise<string> {
    const backupId = `backup-${Date.now()}-${randomUUID().substring(0, 8)}`;
    const files: { [filePath: string]: string } = {};

    // Key config files to backup
    const configFiles = [
      'pages.json',
      'emotionMap.ts',
      'modules.json'
    ];

    for (const file of configFiles) {
      const filePath = path.join(this.configDir, file);
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        files[file] = content;
      } catch (error) {
        console.warn(`Could not backup ${file}:`, error);
      }
    }

    const backup: ConfigBackup = {
      id: backupId,
      runId,
      timestamp: new Date(),
      description,
      files
    };

    const backupFile = path.join(this.backupDir, `${backupId}.json`);
    await fs.writeFile(backupFile, JSON.stringify(backup, null, 2));

    console.log(`✅ Configuration backup created: ${backupId}`);
    return backupId;
  }

  /**
   * Get all available backups
   */
  async getAvailableBackups(): Promise<ConfigBackup[]> {
    const backups: ConfigBackup[] = [];
    
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files.filter(f => f.startsWith('backup-') && f.endsWith('.json'));
      
      for (const file of backupFiles) {
        try {
          const content = await fs.readFile(path.join(this.backupDir, file), 'utf-8');
          const backup = JSON.parse(content);
          backups.push(backup);
        } catch (error) {
          console.warn(`Could not read backup ${file}:`, error);
        }
      }
    } catch (error) {
      console.warn('Could not read backup directory:', error);
    }

    return backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Rollback to a specific backup
   */
  async rollbackToBackup(backupId: string): Promise<void> {
    const backupFile = path.join(this.backupDir, `${backupId}.json`);
    
    try {
      const content = await fs.readFile(backupFile, 'utf-8');
      const backup: ConfigBackup = JSON.parse(content);
      
      // Create a backup of current state before rollback
      await this.createBackup(`rollback-${Date.now()}`, `Pre-rollback backup before restoring ${backupId}`);
      
      // Restore files from backup
      for (const [filename, fileContent] of Object.entries(backup.files)) {
        const filePath = path.join(this.configDir, filename);
        await fs.writeFile(filePath, fileContent);
      }
      
      console.log(`✅ Configuration rolled back to backup ${backupId}`);
    } catch (error) {
      console.error(`❌ Failed to rollback to backup ${backupId}:`, error);
      throw error;
    }
  }

  /**
   * Update page configuration
   */
  async updatePageConfig(pageSlug: string, newConfig: any): Promise<void> {
    if (this.lockedConfigs.has('pages')) {
      throw new Error('Pages configuration is locked');
    }

    const pagesFile = path.join(this.configDir, 'pages.json');
    
    try {
      const content = await fs.readFile(pagesFile, 'utf-8');
      const pagesConfig = JSON.parse(content);
      
      const pageIndex = pagesConfig.pages.findIndex((p: any) => p.slug === pageSlug);
      if (pageIndex === -1) {
        throw new Error(`Page ${pageSlug} not found`);
      }
      
      pagesConfig.pages[pageIndex] = { ...pagesConfig.pages[pageIndex], ...newConfig };
      
      await fs.writeFile(pagesFile, JSON.stringify(pagesConfig, null, 2));
      console.log(`✅ Updated page config for ${pageSlug}`);
    } catch (error) {
      console.error(`❌ Failed to update page config for ${pageSlug}:`, error);
      throw error;
    }
  }

  /**
   * Update emotion configuration
   */
  async updateEmotionConfig(emotionName: string, newConfig: any): Promise<void> {
    if (this.lockedConfigs.has('emotions')) {
      throw new Error('Emotions configuration is locked');
    }

    const emotionFile = path.join(this.configDir, 'emotionMap.ts');
    
    try {
      const content = await fs.readFile(emotionFile, 'utf-8');
      
      // Simple regex-based update (in production, use a proper TypeScript parser)
      const emotionRegex = new RegExp(`(${emotionName}:\\s*\\{[^}]*)(\\})`, 'g');
      
      const updatedContent = content.replace(emotionRegex, (match, start, end) => {
        // Extract current config and merge with new config
        const configStr = Object.entries(newConfig)
          .map(([key, value]) => `    ${key}: "${value}"`)
          .join(',\n');
        
        return `${emotionName}: {\n${configStr}\n  }`;
      });
      
      await fs.writeFile(emotionFile, updatedContent);
      console.log(`✅ Updated emotion config for ${emotionName}`);
    } catch (error) {
      console.error(`❌ Failed to update emotion config for ${emotionName}:`, error);
      throw error;
    }
  }

  /**
   * Update CTA configuration
   */
  async updateCTAConfig(ctaText: string, newConfig: any): Promise<void> {
    if (this.lockedConfigs.has('ctas')) {
      throw new Error('CTA configuration is locked');
    }

    // CTAs are embedded in pages, so we need to update them there
    const pagesFile = path.join(this.configDir, 'pages.json');
    
    try {
      const content = await fs.readFile(pagesFile, 'utf-8');
      const pagesConfig = JSON.parse(content);
      
      let updated = false;
      for (const page of pagesConfig.pages) {
        if (page.cta && page.cta.text === ctaText) {
          page.cta = { ...page.cta, ...newConfig };
          updated = true;
        }
      }
      
      if (updated) {
        await fs.writeFile(pagesFile, JSON.stringify(pagesConfig, null, 2));
        console.log(`✅ Updated CTA config for "${ctaText}"`);
      } else {
        console.warn(`⚠️ CTA "${ctaText}" not found in any page`);
      }
    } catch (error) {
      console.error(`❌ Failed to update CTA config for "${ctaText}":`, error);
      throw error;
    }
  }

  /**
   * Update offer configuration
   */
  async updateOfferConfig(offerSlug: string, newConfig: any): Promise<void> {
    if (this.lockedConfigs.has('offers')) {
      throw new Error('Offer configuration is locked');
    }

    // Offers are typically managed via database, but we can update page assignments
    const pagesFile = path.join(this.configDir, 'pages.json');
    
    try {
      const content = await fs.readFile(pagesFile, 'utf-8');
      const pagesConfig = JSON.parse(content);
      
      let updated = false;
      for (const page of pagesConfig.pages) {
        if (page.offers && page.offers.some((offer: any) => offer.slug === offerSlug)) {
          const offerIndex = page.offers.findIndex((offer: any) => offer.slug === offerSlug);
          if (offerIndex !== -1) {
            page.offers[offerIndex] = { ...page.offers[offerIndex], ...newConfig };
            updated = true;
          }
        }
      }
      
      if (updated) {
        await fs.writeFile(pagesFile, JSON.stringify(pagesConfig, null, 2));
        console.log(`✅ Updated offer config for ${offerSlug}`);
      } else {
        console.warn(`⚠️ Offer ${offerSlug} not found in any page`);
      }
    } catch (error) {
      console.error(`❌ Failed to update offer config for ${offerSlug}:`, error);
      throw error;
    }
  }

  /**
   * Lock configuration to prevent changes
   */
  lockConfig(configId: string): void {
    this.lockedConfigs.add(configId);
    console.log(`🔒 Configuration ${configId} locked`);
  }

  /**
   * Unlock configuration
   */
  unlockConfig(configId: string): void {
    this.lockedConfigs.delete(configId);
    console.log(`🔓 Configuration ${configId} unlocked`);
  }

  /**
   * Get locked configurations
   */
  getLockedConfigs(): string[] {
    return Array.from(this.lockedConfigs);
  }

  /**
   * Validate configuration integrity
   */
  async validateConfiguration(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check pages.json
    try {
      const pagesFile = path.join(this.configDir, 'pages.json');
      const content = await fs.readFile(pagesFile, 'utf-8');
      const pagesConfig = JSON.parse(content);
      
      if (!pagesConfig.pages || !Array.isArray(pagesConfig.pages)) {
        errors.push('pages.json: Invalid structure - missing pages array');
      }
      
      for (const page of pagesConfig.pages || []) {
        if (!page.slug || !page.title) {
          errors.push(`pages.json: Page missing required fields (slug, title)`);
        }
      }
    } catch (error) {
      errors.push(`pages.json: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Check emotionMap.ts
    try {
      const emotionFile = path.join(this.configDir, 'emotionMap.ts');
      const content = await fs.readFile(emotionFile, 'utf-8');
      
      if (!content.includes('export const emotionMap')) {
        errors.push('emotionMap.ts: Missing export statement');
      }
    } catch (error) {
      errors.push(`emotionMap.ts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get configuration summary
   */
  async getConfigurationSummary(): Promise<any> {
    const summary: any = {
      lastBackup: null,
      totalBackups: 0,
      lockedConfigs: Array.from(this.lockedConfigs),
      configFiles: {},
      validation: await this.validateConfiguration()
    };

    // Get backup info
    const backups = await this.getAvailableBackups();
    summary.totalBackups = backups.length;
    summary.lastBackup = backups[0] || null;

    // Get config file info
    const configFiles = ['pages.json', 'emotionMap.ts', 'modules.json'];
    for (const file of configFiles) {
      const filePath = path.join(this.configDir, file);
      try {
        const stats = await fs.stat(filePath);
        summary.configFiles[file] = {
          exists: true,
          size: stats.size,
          lastModified: stats.mtime
        };
      } catch (error) {
        summary.configFiles[file] = {
          exists: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    return summary;
  }
}

export const configManager = new ConfigManagerService();