import fs from 'fs/promises';
import path from 'path';
import { DatabaseStorage } from '../../storage';
import { CodexFix, InsertCodexFix } from '../../../shared/codexTables';
import { LLMConfig } from './codexAuditEngine';

export interface PatchRequest {
  issueId: string;
  auditId: string;
  fixStrategy: 'auto' | 'manual' | 'rollback';
  targetFile?: string;
  originalCode?: string;
  proposedCode?: string;
  diffPatch?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  requiresApproval: boolean;
  estimatedRisk: number; // 0-100
  impactScope: 'local' | 'module' | 'global';
}

export interface PatchResult {
  success: boolean;
  fixId: string;
  appliedChanges: string[];
  rollbackData: any;
  warnings: string[];
  errors: string[];
}

export interface AutoFixRule {
  category: string;
  severity: string;
  pattern: RegExp;
  fixTemplate: string;
  riskScore: number;
  autoApplyThreshold: number;
}

export class SmartPatchEngine {
  private storage: DatabaseStorage;
  private autoFixRules: Map<string, AutoFixRule[]> = new Map();
  private pendingPatches: Map<string, PatchRequest> = new Map();
  private rollbackHistory: Map<string, any[]> = new Map();

  constructor(storage: DatabaseStorage) {
    this.storage = storage;
    this.initializeAutoFixRules();
  }

  /**
   * Initialize common auto-fix rules for different categories
   */
  private initializeAutoFixRules(): void {
    // Code quality auto-fix rules
    this.autoFixRules.set('code', [
      {
        category: 'code',
        severity: 'low',
        pattern: /console\.log\(/g,
        fixTemplate: '// console.log(',
        riskScore: 5,
        autoApplyThreshold: 10
      },
      {
        category: 'code',
        severity: 'medium',
        pattern: /var\s+(\w+)\s*=/g,
        fixTemplate: 'const $1 =',
        riskScore: 15,
        autoApplyThreshold: 20
      },
      {
        category: 'code',
        severity: 'low',
        pattern: /==\s*true/g,
        fixTemplate: '',
        riskScore: 8,
        autoApplyThreshold: 15
      }
    ]);

    // Security auto-fix rules
    this.autoFixRules.set('security', [
      {
        category: 'security',
        severity: 'high',
        pattern: /password\s*:\s*['"].*['"]/g,
        fixTemplate: 'password: process.env.PASSWORD || ""',
        riskScore: 25,
        autoApplyThreshold: 30
      },
      {
        category: 'security',
        severity: 'medium',
        pattern: /http:\/\//g,
        fixTemplate: 'https://',
        riskScore: 20,
        autoApplyThreshold: 25
      }
    ]);

    // Content/SEO auto-fix rules
    this.autoFixRules.set('seo', [
      {
        category: 'seo',
        severity: 'low',
        pattern: /<img\s+src="[^"]*"\s*>/g,
        fixTemplate: '<img src="$1" alt="Image description" loading="lazy">',
        riskScore: 5,
        autoApplyThreshold: 10
      }
    ]);
  }

  /**
   * Generate intelligent fix for detected issue
   */
  async generateFix(issueId: string, issueData: any, llmConfig?: LLMConfig): Promise<PatchRequest | null> {
    try {
      const issue = await this.storage.getCodexIssueById(parseInt(issueId));
      if (!issue) {
        throw new Error(`Issue ${issueId} not found`);
      }

      // First try auto-fix rules
      const autoFix = await this.tryAutoFix(issue);
      if (autoFix) {
        return autoFix;
      }

      // If auto-fix not available, generate LLM-powered fix
      if (llmConfig) {
        return await this.generateLLMFix(issue, llmConfig);
      }

      return null;

    } catch (error) {
      console.error('Error generating fix:', error);
      return null;
    }
  }

  /**
   * Try to apply auto-fix rules
   */
  private async tryAutoFix(issue: any): Promise<PatchRequest | null> {
    const rules = this.autoFixRules.get(issue.category) || [];
    
    for (const rule of rules) {
      if (issue.severity === rule.severity && issue.description.match(rule.pattern)) {
        const riskScore = this.calculateRiskScore(issue, rule);
        
        return {
          issueId: issue.issueId,
          auditId: issue.auditId.toString(),
          fixStrategy: 'auto',
          targetFile: issue.filePath,
          originalCode: issue.codeSnippet,
          proposedCode: this.applyFixTemplate(issue.codeSnippet, rule),
          diffPatch: await this.generateDiff(issue.codeSnippet, rule),
          priority: issue.severity,
          requiresApproval: riskScore > rule.autoApplyThreshold,
          estimatedRisk: riskScore,
          impactScope: this.determineImpactScope(issue.filePath)
        };
      }
    }

    return null;
  }

  /**
   * Generate LLM-powered fix
   */
  private async generateLLMFix(issue: any, llmConfig: LLMConfig): Promise<PatchRequest | null> {
    try {
      const prompt = this.buildLLMFixPrompt(issue);
      const response = await this.callLLM(prompt, llmConfig);
      
      if (response && response.fix) {
        const riskScore = this.calculateLLMRiskScore(issue, response);
        
        return {
          issueId: issue.issueId,
          auditId: issue.auditId.toString(),
          fixStrategy: 'manual',
          targetFile: issue.filePath,
          originalCode: issue.codeSnippet,
          proposedCode: response.fix.code,
          diffPatch: response.fix.diff,
          priority: issue.severity,
          requiresApproval: riskScore > 20,
          estimatedRisk: riskScore,
          impactScope: response.fix.impact || 'local'
        };
      }

      return null;

    } catch (error) {
      console.error('Error generating LLM fix:', error);
      return null;
    }
  }

  /**
   * Apply patch to file system
   */
  async applyPatch(patchRequest: PatchRequest): Promise<PatchResult> {
    const fixId = `fix_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Create rollback data before applying changes
      const rollbackData = await this.createRollbackData(patchRequest);
      
      // Apply the actual changes
      const appliedChanges: string[] = [];
      
      if (patchRequest.targetFile && patchRequest.proposedCode) {
        // Read current file content
        const filePath = path.join(process.cwd(), patchRequest.targetFile);
        const currentContent = await fs.readFile(filePath, 'utf8');
        
        // Apply the fix
        const newContent = patchRequest.proposedCode;
        await fs.writeFile(filePath, newContent, 'utf8');
        
        appliedChanges.push(`Modified ${patchRequest.targetFile}`);
        
        // Store rollback data
        this.rollbackHistory.set(fixId, [rollbackData]);
      }

      // Record the fix in database
      const fixData: InsertCodexFix = {
        fixId: fixId,
        issueId: parseInt(patchRequest.issueId),
        auditId: parseInt(patchRequest.auditId),
        fixType: patchRequest.fixStrategy,
        originalCode: patchRequest.originalCode,
        fixedCode: patchRequest.proposedCode,
        diffPatch: patchRequest.diffPatch,
        status: 'applied',
        confidence: 100 - patchRequest.estimatedRisk,
        estimatedRisk: patchRequest.estimatedRisk,
        appliedAt: new Date(),
        rollbackData: JSON.stringify(rollbackData)
      };

      await this.storage.createCodexFix(fixData);

      return {
        success: true,
        fixId: fixId,
        appliedChanges: appliedChanges,
        rollbackData: rollbackData,
        warnings: [],
        errors: []
      };

    } catch (error) {
      console.error('Error applying patch:', error);
      
      return {
        success: false,
        fixId: fixId,
        appliedChanges: [],
        rollbackData: {},
        warnings: [],
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Rollback a previously applied fix
   */
  async rollbackFix(fixId: string): Promise<boolean> {
    try {
      const fix = await this.storage.getCodexFix(fixId);
      if (!fix || !fix.rollbackData) {
        throw new Error(`Fix ${fixId} not found or no rollback data available`);
      }

      const rollbackData = JSON.parse(fix.rollbackData);
      
      // Restore original files
      if (rollbackData.originalFiles) {
        for (const [filePath, content] of Object.entries(rollbackData.originalFiles)) {
          const fullPath = path.join(process.cwd(), filePath as string);
          await fs.writeFile(fullPath, content as string, 'utf8');
        }
      }

      // Update fix status
      await this.storage.updateCodexFix(fixId, {
        status: 'rolled_back',
        rolledBackAt: new Date()
      });

      return true;

    } catch (error) {
      console.error('Error rolling back fix:', error);
      return false;
    }
  }

  /**
   * Get pending fixes requiring approval
   */
  async getPendingApprovals(): Promise<CodexFix[]> {
    try {
      return await this.storage.getCodexFixes({ status: 'pending_approval' });
    } catch (error) {
      console.error('Error getting pending approvals:', error);
      return [];
    }
  }

  /**
   * Approve or deny a pending fix
   */
  async reviewFix(fixId: string, approved: boolean, reviewerId: string): Promise<boolean> {
    try {
      const status = approved ? 'approved' : 'denied';
      await this.storage.updateCodexFix(fixId, {
        status: status,
        reviewerId: reviewerId,
        reviewedAt: new Date()
      });

      // If approved, apply the fix
      if (approved) {
        const fix = await this.storage.getCodexFix(fixId);
        if (fix) {
          // Convert fix back to PatchRequest and apply
          const patchRequest: PatchRequest = {
            issueId: fix.issueId.toString(),
            auditId: fix.auditId.toString(),
            fixStrategy: fix.fixType as any,
            originalCode: fix.originalCode,
            proposedCode: fix.fixedCode,
            diffPatch: fix.diffPatch,
            priority: 'medium',
            requiresApproval: false,
            estimatedRisk: fix.estimatedRisk || 0,
            impactScope: 'local'
          };

          await this.applyPatch(patchRequest);
        }
      }

      return true;

    } catch (error) {
      console.error('Error reviewing fix:', error);
      return false;
    }
  }

  // Private helper methods
  private calculateRiskScore(issue: any, rule: AutoFixRule): number {
    let risk = rule.riskScore;
    
    // Adjust based on file criticality
    if (issue.filePath?.includes('server/')) risk += 10;
    if (issue.filePath?.includes('database') || issue.filePath?.includes('auth')) risk += 15;
    if (issue.filePath?.includes('payment') || issue.filePath?.includes('security')) risk += 20;
    
    // Adjust based on severity
    switch (issue.severity) {
      case 'critical': risk += 25; break;
      case 'high': risk += 15; break;
      case 'medium': risk += 5; break;
      case 'low': risk += 0; break;
    }

    return Math.min(risk, 100);
  }

  private calculateLLMRiskScore(issue: any, response: any): number {
    // Base risk from LLM confidence
    let risk = 100 - (response.confidence || 50);
    
    // Adjust based on change complexity
    if (response.fix?.linesChanged > 10) risk += 20;
    if (response.fix?.filesAffected > 1) risk += 15;
    
    return Math.min(risk, 100);
  }

  private applyFixTemplate(originalCode: string, rule: AutoFixRule): string {
    return originalCode.replace(rule.pattern, rule.fixTemplate);
  }

  private async generateDiff(originalCode: string, rule: AutoFixRule): Promise<string> {
    const fixedCode = this.applyFixTemplate(originalCode, rule);
    return `--- Original\n+++ Fixed\n${originalCode}\n---\n${fixedCode}`;
  }

  private determineImpactScope(filePath?: string): 'local' | 'module' | 'global' {
    if (!filePath) return 'local';
    
    if (filePath.includes('shared/') || filePath.includes('config/')) return 'global';
    if (filePath.includes('services/') || filePath.includes('routes/')) return 'module';
    return 'local';
  }

  private buildLLMFixPrompt(issue: any): string {
    return `
Please analyze this code issue and provide a fix:

Issue: ${issue.title}
Description: ${issue.description}
Severity: ${issue.severity}
File: ${issue.filePath}
Line: ${issue.lineNumber}

Code snippet:
\`\`\`
${issue.codeSnippet}
\`\`\`

Please provide:
1. A fixed version of the code
2. Explanation of the fix
3. Risk assessment (1-100)
4. Impact scope (local/module/global)

Response format:
{
  "fix": {
    "code": "fixed code here",
    "diff": "diff patch",
    "impact": "local|module|global"
  },
  "explanation": "why this fix works",
  "confidence": 85,
  "riskFactors": ["list", "of", "risks"]
}
`;
  }

  private async callLLM(prompt: string, llmConfig: LLMConfig): Promise<any> {
    // Mock LLM response for now - in production, implement actual LLM calls
    return {
      fix: {
        code: "// Fixed code would be here",
        diff: "// Diff would be here",
        impact: "local"
      },
      explanation: "Mock fix explanation",
      confidence: 85,
      riskFactors: ["low risk change"]
    };
  }

  private async createRollbackData(patchRequest: PatchRequest): Promise<any> {
    const rollbackData: any = {
      originalFiles: {},
      timestamp: new Date().toISOString(),
      patchRequest: patchRequest
    };

    if (patchRequest.targetFile) {
      try {
        const filePath = path.join(process.cwd(), patchRequest.targetFile);
        const content = await fs.readFile(filePath, 'utf8');
        rollbackData.originalFiles[patchRequest.targetFile] = content;
      } catch (error) {
        console.warn(`Could not read file for rollback: ${patchRequest.targetFile}`);
      }
    }

    return rollbackData;
  }
}