import { DatabaseStorage } from '../../storage';
import { 
  CodexReport, 
  CodexAudit, 
  CodexIssue,
  InsertCodexReport
} from '../../../shared/codexTables';

export interface ReportConfig {
  reportType: 'summary' | 'detailed' | 'trend' | 'evolution';
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'custom';
  scope: 'global' | 'neuron' | 'module';
  startDate: Date;
  endDate: Date;
  includeMetrics: boolean;
  includeInsights: boolean;
  includeRecommendations: boolean;
  exportFormats: ('json' | 'pdf' | 'csv')[];
}

export interface ReportData {
  summary: ReportSummary;
  audits: CodexAudit[];
  issues: CodexIssue[];
  metrics: ReportMetrics;
  trends: ReportTrends;
  insights: ReportInsights;
  recommendations: ReportRecommendations;
}

export interface ReportSummary {
  totalAudits: number;
  totalIssues: number;
  criticalIssues: number;
  resolvedIssues: number;
  averageAuditScore: number;
  auditScoreImprovement: number;
  topCategories: Array<{category: string; count: number}>;
  topSeverities: Array<{severity: string; count: number}>;
}

export interface ReportMetrics {
  auditFrequency: number;
  issueDetectionRate: number;
  fixSuccessRate: number;
  autoFixRate: number;
  timeToResolution: number;
  qualityScoreTrend: number[];
  categoryDistribution: Record<string, number>;
  severityDistribution: Record<string, number>;
}

export interface ReportTrends {
  auditScoreOverTime: Array<{date: string; score: number}>;
  issueCountOverTime: Array<{date: string; count: number}>;
  resolutionTimeOverTime: Array<{date: string; avgTime: number}>;
  categoryTrends: Record<string, Array<{date: string; count: number}>>;
}

export interface ReportInsights {
  improvementAreas: string[];
  regressionAreas: string[];
  patternDetection: string[];
  qualityTrends: string[];
  performanceInsights: string[];
}

export interface ReportRecommendations {
  immediate: string[];
  shortTerm: string[];
  longTerm: string[];
  automation: string[];
  prevention: string[];
}

export class CodexReportGenerator {
  private storage: DatabaseStorage;

  constructor(storage: DatabaseStorage) {
    this.storage = storage;
  }

  /**
   * Generate comprehensive audit report
   */
  async generateReport(config: ReportConfig): Promise<CodexReport> {
    try {
      console.log(`📊 Generating ${config.reportType} report for ${config.period} period`);
      
      const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const startTime = Date.now();

      // Collect report data
      const reportData = await this.collectReportData(config);

      // Generate insights and recommendations
      const insights = await this.generateInsights(reportData, config);
      const recommendations = await this.generateRecommendations(reportData, config);

      // Create report record
      const reportRecord: InsertCodexReport = {
        reportId,
        reportType: config.reportType,
        period: config.period,
        scope: config.scope,
        startDate: config.startDate,
        endDate: config.endDate,
        reportData: {
          summary: reportData.summary,
          metrics: reportData.metrics,
          trends: reportData.trends
        },
        summary: reportData.summary,
        metrics: reportData.metrics,
        insights,
        recommendations,
        generatedBy: 'auto',
        generationTime: Date.now() - startTime,
        exportFormats: config.exportFormats
      };

      const report = await this.storage.createCodexReport(reportRecord);

      console.log(`✅ Generated report ${reportId} in ${Date.now() - startTime}ms`);
      
      return report;

    } catch (error) {
      console.error('❌ Failed to generate report:', error);
      throw error;
    }
  }

  /**
   * Get existing reports with filters
   */
  async getReports(filters?: {
    reportType?: string;
    period?: string;
    scope?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<CodexReport[]> {
    return await this.storage.getCodexReports(filters);
  }

  /**
   * Get detailed report data by ID
   */
  async getReportById(reportId: string): Promise<CodexReport | null> {
    return await this.storage.getCodexReport(reportId);
  }

  /**
   * Export report to different formats
   */
  async exportReport(reportId: string, format: 'json' | 'pdf' | 'csv'): Promise<Buffer | string> {
    const report = await this.storage.getCodexReport(reportId);
    if (!report) {
      throw new Error(`Report not found: ${reportId}`);
    }

    switch (format) {
      case 'json':
        return JSON.stringify(report, null, 2);
      
      case 'csv':
        return this.exportToCSV(report);
      
      case 'pdf':
        return this.exportToPDF(report);
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Generate real-time dashboard data
   */
  async generateDashboardData(timeframe: '24h' | '7d' | '30d' | '90d' = '7d'): Promise<any> {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
    }

    const config: ReportConfig = {
      reportType: 'summary',
      period: 'custom',
      scope: 'global',
      startDate,
      endDate,
      includeMetrics: true,
      includeInsights: true,
      includeRecommendations: true,
      exportFormats: ['json']
    };

    const reportData = await this.collectReportData(config);

    return {
      timeframe,
      generatedAt: new Date().toISOString(),
      summary: reportData.summary,
      metrics: reportData.metrics,
      trends: reportData.trends,
      recentAudits: reportData.audits.slice(0, 10),
      recentIssues: reportData.issues.slice(0, 20)
    };
  }

  /**
   * Collect all report data
   */
  private async collectReportData(config: ReportConfig): Promise<ReportData> {
    // Get audits in date range
    const audits = await this.storage.getCodexAudits({
      startDate: config.startDate,
      endDate: config.endDate,
      scope: config.scope
    });

    // Get issues from those audits
    const auditIds = audits.map(a => a.auditId);
    const issues = auditIds.length > 0 
      ? await this.storage.getCodexIssues({ auditIds })
      : [];

    // Generate summary
    const summary = this.generateSummary(audits, issues);

    // Calculate metrics
    const metrics = this.calculateMetrics(audits, issues, config);

    // Calculate trends
    const trends = this.calculateTrends(audits, issues, config);

    return {
      summary,
      audits,
      issues,
      metrics,
      trends,
      insights: { improvementAreas: [], regressionAreas: [], patternDetection: [], qualityTrends: [], performanceInsights: [] },
      recommendations: { immediate: [], shortTerm: [], longTerm: [], automation: [], prevention: [] }
    };
  }

  /**
   * Generate report summary
   */
  private generateSummary(audits: CodexAudit[], issues: CodexIssue[]): ReportSummary {
    const resolvedIssues = issues.filter(i => i.status === 'resolved').length;
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    
    // Calculate average audit score
    const scoresWithValues = audits.filter(a => a.auditScore !== null);
    const averageAuditScore = scoresWithValues.length > 0 
      ? scoresWithValues.reduce((sum, a) => sum + (a.auditScore || 0), 0) / scoresWithValues.length 
      : 0;

    // Top categories
    const categoryCount: Record<string, number> = {};
    issues.forEach(issue => {
      categoryCount[issue.category] = (categoryCount[issue.category] || 0) + 1;
    });

    const topCategories = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }));

    // Top severities
    const severityCount: Record<string, number> = {};
    issues.forEach(issue => {
      severityCount[issue.severity] = (severityCount[issue.severity] || 0) + 1;
    });

    const topSeverities = Object.entries(severityCount)
      .sort(([,a], [,b]) => b - a)
      .map(([severity, count]) => ({ severity, count }));

    return {
      totalAudits: audits.length,
      totalIssues: issues.length,
      criticalIssues,
      resolvedIssues,
      averageAuditScore,
      auditScoreImprovement: 0, // Would calculate vs previous period
      topCategories,
      topSeverities
    };
  }

  /**
   * Calculate report metrics
   */
  private calculateMetrics(audits: CodexAudit[], issues: CodexIssue[], config: ReportConfig): ReportMetrics {
    const resolvedIssues = issues.filter(i => i.status === 'resolved');
    const autoFixedIssues = issues.filter(i => i.resolution === 'auto_fixed');
    
    // Calculate resolution times
    const resolutionTimes = resolvedIssues
      .filter(i => i.resolvedAt && i.createdAt)
      .map(i => {
        const created = new Date(i.createdAt).getTime();
        const resolved = new Date(i.resolvedAt!).getTime();
        return (resolved - created) / (1000 * 60 * 60); // hours
      });

    const avgResolutionTime = resolutionTimes.length > 0 
      ? resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length 
      : 0;

    // Category distribution
    const categoryDistribution: Record<string, number> = {};
    issues.forEach(issue => {
      categoryDistribution[issue.category] = (categoryDistribution[issue.category] || 0) + 1;
    });

    // Severity distribution
    const severityDistribution: Record<string, number> = {};
    issues.forEach(issue => {
      severityDistribution[issue.severity] = (severityDistribution[issue.severity] || 0) + 1;
    });

    return {
      auditFrequency: audits.length / this.getDaysBetween(config.startDate, config.endDate),
      issueDetectionRate: issues.length / Math.max(audits.length, 1),
      fixSuccessRate: resolvedIssues.length / Math.max(issues.length, 1),
      autoFixRate: autoFixedIssues.length / Math.max(issues.length, 1),
      timeToResolution: avgResolutionTime,
      qualityScoreTrend: audits.map(a => a.auditScore || 0),
      categoryDistribution,
      severityDistribution
    };
  }

  /**
   * Calculate trends over time
   */
  private calculateTrends(audits: CodexAudit[], issues: CodexIssue[], config: ReportConfig): ReportTrends {
    // Group data by time periods
    const auditsByDate = this.groupByDate(audits, config.period);
    const issuesByDate = this.groupByDate(issues, config.period);

    // Audit score over time
    const auditScoreOverTime = Object.entries(auditsByDate).map(([date, audits]) => ({
      date,
      score: audits.reduce((sum, a) => sum + (a.auditScore || 0), 0) / Math.max(audits.length, 1)
    }));

    // Issue count over time
    const issueCountOverTime = Object.entries(issuesByDate).map(([date, issues]) => ({
      date,
      count: issues.length
    }));

    // Resolution time over time
    const resolutionTimeOverTime = Object.entries(issuesByDate).map(([date, issues]) => {
      const resolvedIssues = issues.filter(i => i.status === 'resolved' && i.resolvedAt && i.createdAt);
      const avgTime = resolvedIssues.length > 0 
        ? resolvedIssues.reduce((sum, i) => {
            const created = new Date(i.createdAt).getTime();
            const resolved = new Date(i.resolvedAt!).getTime();
            return sum + ((resolved - created) / (1000 * 60 * 60)); // hours
          }, 0) / resolvedIssues.length
        : 0;

      return { date, avgTime };
    });

    // Category trends
    const categoryTrends: Record<string, Array<{date: string; count: number}>> = {};
    const allCategories = [...new Set(issues.map(i => i.category))];
    
    for (const category of allCategories) {
      categoryTrends[category] = Object.entries(issuesByDate).map(([date, issues]) => ({
        date,
        count: issues.filter(i => i.category === category).length
      }));
    }

    return {
      auditScoreOverTime,
      issueCountOverTime,
      resolutionTimeOverTime,
      categoryTrends
    };
  }

  /**
   * Generate AI insights
   */
  private async generateInsights(reportData: ReportData, config: ReportConfig): Promise<ReportInsights> {
    const insights: ReportInsights = {
      improvementAreas: [],
      regressionAreas: [],
      patternDetection: [],
      qualityTrends: [],
      performanceInsights: []
    };

    // Analyze improvement areas
    if (reportData.summary.averageAuditScore < 70) {
      insights.improvementAreas.push('Overall audit score below 70% indicates need for immediate attention');
    }
    
    if (reportData.summary.criticalIssues > 5) {
      insights.improvementAreas.push(`${reportData.summary.criticalIssues} critical issues require immediate resolution`);
    }

    // Performance insights
    if (reportData.metrics.timeToResolution > 24) {
      insights.performanceInsights.push(`Average resolution time of ${reportData.metrics.timeToResolution.toFixed(1)} hours exceeds target`);
    }

    if (reportData.metrics.autoFixRate < 0.3) {
      insights.performanceInsights.push('Low auto-fix rate suggests need for more automation opportunities');
    }

    // Pattern detection
    const topCategory = reportData.summary.topCategories[0];
    if (topCategory && topCategory.count > reportData.summary.totalIssues * 0.4) {
      insights.patternDetection.push(`${topCategory.category} issues represent ${(topCategory.count / reportData.summary.totalIssues * 100).toFixed(1)}% of all issues`);
    }

    return insights;
  }

  /**
   * Generate recommendations
   */
  private async generateRecommendations(reportData: ReportData, config: ReportConfig): Promise<ReportRecommendations> {
    const recommendations: ReportRecommendations = {
      immediate: [],
      shortTerm: [],
      longTerm: [],
      automation: [],
      prevention: []
    };

    // Immediate recommendations
    if (reportData.summary.criticalIssues > 0) {
      recommendations.immediate.push(`Address ${reportData.summary.criticalIssues} critical security/compliance issues`);
    }

    // Short-term recommendations
    if (reportData.metrics.fixSuccessRate < 0.8) {
      recommendations.shortTerm.push('Improve issue resolution process to achieve >80% success rate');
    }

    // Long-term recommendations
    if (reportData.summary.totalAudits < 7) {
      recommendations.longTerm.push('Increase audit frequency to ensure consistent quality monitoring');
    }

    // Automation recommendations
    if (reportData.metrics.autoFixRate < 0.5) {
      recommendations.automation.push('Implement more automated fixes for common issue patterns');
    }

    // Prevention recommendations
    const topCategory = reportData.summary.topCategories[0];
    if (topCategory) {
      recommendations.prevention.push(`Implement preventive measures for ${topCategory.category} issues through lint rules or templates`);
    }

    return recommendations;
  }

  /**
   * Helper methods
   */
  private getDaysBetween(start: Date, end: Date): number {
    const timeDiff = end.getTime() - start.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  private groupByDate(items: any[], period: string): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};
    
    for (const item of items) {
      const date = new Date(item.createdAt);
      let key: string;
      
      switch (period) {
        case 'daily':
          key = date.toISOString().split('T')[0];
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }
      
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    }
    
    return grouped;
  }

  private async exportToCSV(report: CodexReport): Promise<string> {
    // Implementation would generate CSV format
    return 'CSV export implementation';
  }

  private async exportToPDF(report: CodexReport): Promise<Buffer> {
    // Implementation would generate PDF format
    return Buffer.from('PDF export implementation');
  }
}