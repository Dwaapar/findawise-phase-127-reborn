import fs from 'fs/promises';
import path from 'path';
import { OrchestrationChange } from '../services/orchestrator';

interface ChangelogEntry {
  runId: string;
  timestamp: Date;
  changes: OrchestrationChange[];
  summary: {
    totalChanges: number;
    changesByType: { [key: string]: number };
    estimatedImpact: string;
  };
}

class ChangelogGeneratorService {
  private readonly changelogDir = path.join(process.cwd(), 'orchestration', 'changelog');
  private readonly changelogFile = path.join(this.changelogDir, 'CHANGELOG.md');

  constructor() {
    this.initializeChangelog();
  }

  private async initializeChangelog(): Promise<void> {
    await fs.mkdir(this.changelogDir, { recursive: true });
    
    // Create initial changelog file if it doesn't exist
    try {
      await fs.access(this.changelogFile);
    } catch (error) {
      await this.createInitialChangelog();
    }
  }

  private async createInitialChangelog(): Promise<void> {
    const initialContent = `# Findawise Empire - AI Orchestrator Changelog

This changelog documents all optimization changes made by the AI Orchestrator system.

## Format
- **[YYYY-MM-DD]** - Run ID: \`run-id\`
  - **Type**: Description of change
  - **Impact**: Expected performance improvement

---

`;

    await fs.writeFile(this.changelogFile, initialContent);
  }

  /**
   * Generate changelog for a specific run
   */
  async generateChangelog(changes: OrchestrationChange[], runId: string): Promise<void> {
    const entry: ChangelogEntry = {
      runId,
      timestamp: new Date(),
      changes,
      summary: this.generateSummary(changes)
    };

    await this.appendToChangelog(entry);
    await this.saveRunChangelog(entry);
  }

  /**
   * Generate summary of changes
   */
  private generateSummary(changes: OrchestrationChange[]): any {
    const changesByType: { [key: string]: number } = {};
    let totalImpactScore = 0;

    for (const change of changes) {
      changesByType[change.type] = (changesByType[change.type] || 0) + 1;
      
      // Calculate impact score based on confidence and expected impact
      const impactMatch = change.expectedImpact.match(/(\d+)-(\d+)%/);
      if (impactMatch) {
        const avgImpact = (parseInt(impactMatch[1]) + parseInt(impactMatch[2])) / 2;
        totalImpactScore += avgImpact * change.confidence;
      }
    }

    const estimatedImpact = this.getImpactDescription(totalImpactScore);

    return {
      totalChanges: changes.length,
      changesByType,
      estimatedImpact
    };
  }

  /**
   * Get impact description based on score
   */
  private getImpactDescription(score: number): string {
    if (score >= 50) return 'High Impact - Significant performance improvements expected';
    if (score >= 25) return 'Medium Impact - Moderate performance improvements expected';
    if (score >= 10) return 'Low Impact - Minor performance improvements expected';
    return 'Minimal Impact - Small optimizations applied';
  }

  /**
   * Append entry to main changelog
   */
  private async appendToChangelog(entry: ChangelogEntry): Promise<void> {
    const date = entry.timestamp.toISOString().split('T')[0];
    const time = entry.timestamp.toTimeString().split(' ')[0];
    
    let changelogContent = `\n## [${date} ${time}] - Run ID: \`${entry.runId}\`\n\n`;
    changelogContent += `**Summary**: ${entry.summary.totalChanges} changes applied - ${entry.summary.estimatedImpact}\n\n`;

    // Group changes by type
    const changesByType: { [key: string]: OrchestrationChange[] } = {};
    for (const change of entry.changes) {
      if (!changesByType[change.type]) {
        changesByType[change.type] = [];
      }
      changesByType[change.type].push(change);
    }

    // Document each type of change
    for (const [type, changes] of Object.entries(changesByType)) {
      changelogContent += `### ${this.capitalizeFirst(type)} Changes (${changes.length})\n\n`;
      
      for (const change of changes) {
        changelogContent += `- **${this.capitalizeFirst(change.action)}**: ${change.target}\n`;
        changelogContent += `  - *Reason*: ${change.reason}\n`;
        changelogContent += `  - *Expected Impact*: ${change.expectedImpact}\n`;
        changelogContent += `  - *Confidence*: ${(change.confidence * 100).toFixed(0)}%\n`;
        
        if (change.metrics) {
          changelogContent += `  - *Current Metrics*: ${change.metrics.impressions} impressions, ${(change.metrics.ctr * 100).toFixed(1)}% CTR\n`;
        }
        
        changelogContent += '\n';
      }
    }

    changelogContent += '---\n';

    // Read current changelog and prepend new content
    try {
      const currentContent = await fs.readFile(this.changelogFile, 'utf-8');
      const lines = currentContent.split('\n');
      
      // Find the insertion point (after the header)
      let insertIndex = lines.findIndex(line => line === '---') + 1;
      if (insertIndex === 0) insertIndex = lines.length;
      
      lines.splice(insertIndex, 0, changelogContent);
      await fs.writeFile(this.changelogFile, lines.join('\n'));
    } catch (error) {
      console.error('Failed to append to changelog:', error);
    }
  }

  /**
   * Save individual run changelog
   */
  private async saveRunChangelog(entry: ChangelogEntry): Promise<void> {
    const runChangelogFile = path.join(this.changelogDir, `run-${entry.runId}.json`);
    await fs.writeFile(runChangelogFile, JSON.stringify(entry, null, 2));
  }

  /**
   * Get changelog history
   */
  async getChangelogHistory(limit: number = 50): Promise<string> {
    try {
      const content = await fs.readFile(this.changelogFile, 'utf-8');
      const lines = content.split('\n');
      
      // Find entries and limit them
      const entries: string[] = [];
      let currentEntry: string[] = [];
      let entryCount = 0;
      
      for (const line of lines) {
        if (line.startsWith('## [') && entryCount < limit) {
          if (currentEntry.length > 0) {
            entries.push(currentEntry.join('\n'));
            entryCount++;
          }
          currentEntry = [line];
        } else if (line === '---' && currentEntry.length > 0) {
          currentEntry.push(line);
          entries.push(currentEntry.join('\n'));
          entryCount++;
          currentEntry = [];
        } else if (currentEntry.length > 0) {
          currentEntry.push(line);
        }
      }
      
      return entries.join('\n\n');
    } catch (error) {
      console.error('Failed to read changelog history:', error);
      return 'No changelog history available';
    }
  }

  /**
   * Get changelog for specific run
   */
  async getRunChangelog(runId: string): Promise<ChangelogEntry | null> {
    const runChangelogFile = path.join(this.changelogDir, `run-${runId}.json`);
    
    try {
      const content = await fs.readFile(runChangelogFile, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error(`Failed to read run changelog for ${runId}:`, error);
      return null;
    }
  }

  /**
   * Generate markdown report for a run
   */
  async generateRunReport(runId: string): Promise<string> {
    const entry = await this.getRunChangelog(runId);
    if (!entry) return 'Run not found';

    const date = entry.timestamp.toISOString().split('T')[0];
    const time = entry.timestamp.toTimeString().split(' ')[0];
    
    let report = `# Orchestration Run Report\n\n`;
    report += `**Run ID**: ${runId}\n`;
    report += `**Date**: ${date} ${time}\n`;
    report += `**Total Changes**: ${entry.summary.totalChanges}\n`;
    report += `**Estimated Impact**: ${entry.summary.estimatedImpact}\n\n`;

    report += `## Changes by Type\n\n`;
    for (const [type, count] of Object.entries(entry.summary.changesByType)) {
      report += `- **${this.capitalizeFirst(type)}**: ${count} changes\n`;
    }

    report += `\n## Detailed Changes\n\n`;
    
    const changesByType: { [key: string]: OrchestrationChange[] } = {};
    for (const change of entry.changes) {
      if (!changesByType[change.type]) {
        changesByType[change.type] = [];
      }
      changesByType[change.type].push(change);
    }

    for (const [type, changes] of Object.entries(changesByType)) {
      report += `### ${this.capitalizeFirst(type)} Changes\n\n`;
      
      for (const change of changes) {
        report += `#### ${change.target}\n`;
        report += `- **Action**: ${this.capitalizeFirst(change.action)}\n`;
        report += `- **Reason**: ${change.reason}\n`;
        report += `- **Expected Impact**: ${change.expectedImpact}\n`;
        report += `- **Confidence**: ${(change.confidence * 100).toFixed(0)}%\n`;
        
        if (change.metrics) {
          report += `- **Current Performance**:\n`;
          report += `  - Impressions: ${change.metrics.impressions.toLocaleString()}\n`;
          report += `  - CTR: ${(change.metrics.ctr * 100).toFixed(1)}%\n`;
          report += `  - Engagement: ${(change.metrics.engagement * 100).toFixed(1)}%\n`;
          if (change.metrics.conversions) {
            report += `  - Conversions: ${change.metrics.conversions}\n`;
          }
        }
        
        report += '\n';
      }
    }

    return report;
  }

  /**
   * Get changelog statistics
   */
  async getChangelogStats(): Promise<any> {
    const changelogFiles = await fs.readdir(this.changelogDir);
    const runFiles = changelogFiles.filter(f => f.startsWith('run-') && f.endsWith('.json'));
    
    const stats = {
      totalRuns: runFiles.length,
      totalChanges: 0,
      changesByType: {} as { [key: string]: number },
      averageChangesPerRun: 0,
      lastRunDate: null as Date | null
    };

    for (const file of runFiles) {
      try {
        const content = await fs.readFile(path.join(this.changelogDir, file), 'utf-8');
        const entry: ChangelogEntry = JSON.parse(content);
        
        stats.totalChanges += entry.summary.totalChanges;
        
        for (const [type, count] of Object.entries(entry.summary.changesByType)) {
          stats.changesByType[type] = (stats.changesByType[type] || 0) + count;
        }
        
        if (!stats.lastRunDate || entry.timestamp > stats.lastRunDate) {
          stats.lastRunDate = entry.timestamp;
        }
      } catch (error) {
        console.warn(`Failed to read changelog stats from ${file}:`, error);
      }
    }

    stats.averageChangesPerRun = stats.totalRuns > 0 ? stats.totalChanges / stats.totalRuns : 0;
    
    return stats;
  }

  /**
   * Capitalize first letter of string
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

export const changelogGenerator = new ChangelogGeneratorService();