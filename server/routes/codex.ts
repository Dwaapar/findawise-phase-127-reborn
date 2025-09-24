import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { 
  insertCodexAuditSchema, 
  insertCodexIssueSchema, 
  insertCodexFixSchema,
  insertCodexScheduleSchema,
  insertCodexReportSchema
} from '../../shared/codexTables';
import { CodexAuditEngine } from '../services/codex/codexAuditEngine';
import { CodexScheduler } from '../services/codex/codexScheduler';
import { CodexReportGenerator } from '../services/codex/codexReportGenerator';

const router = Router();

// Initialize Codex services
const auditEngine = new CodexAuditEngine(storage);
const scheduler = new CodexScheduler(storage, auditEngine);
const reportGenerator = new CodexReportGenerator(storage);

// Initialize scheduler on startup
scheduler.initialize().catch(console.error);

// ===========================================
// AUDIT MANAGEMENT
// ===========================================

// Get all audits
router.get('/audits', async (req, res) => {
  try {
    const audits = await storage.getCodexAudits(req.query);
    res.json({ success: true, data: audits });
  } catch (error) {
    console.error('Failed to get audits:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get specific audit
router.get('/audits/:auditId', async (req, res) => {
  try {
    const { auditId } = req.params;
    const audit = await storage.getCodexAudit(auditId);
    
    if (!audit) {
      return res.status(404).json({ success: false, error: 'Audit not found' });
    }
    
    res.json({ success: true, data: audit });
  } catch (error) {
    console.error('Failed to get audit:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Run new audit
router.post('/audits/run', async (req, res) => {
  try {
    const auditRequest = z.object({
      auditType: z.enum(['code', 'content', 'seo', 'security', 'compliance', 'ux', 'performance']),
      scope: z.string(),
      targetPath: z.string().optional(),
      llmProvider: z.string().optional(),
      autoFix: z.boolean().optional(),
      priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      auditConfig: z.any().optional(),
      triggeredBy: z.string().optional()
    }).parse(req.body);

    const result = await auditEngine.runAudit(auditRequest);
    
    res.json({ 
      success: true, 
      data: {
        audit: result.audit,
        summary: result.summary,
        issuesFound: result.issues.length,
        fixesGenerated: result.fixes.length
      }
    });
  } catch (error) {
    console.error('Failed to run audit:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Delete audit
router.delete('/audits/:auditId', async (req, res) => {
  try {
    const { auditId } = req.params;
    await storage.deleteCodexAudit(auditId);
    res.json({ success: true, message: 'Audit deleted successfully' });
  } catch (error) {
    console.error('Failed to delete audit:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// ===========================================
// ISSUE MANAGEMENT
// ===========================================

// Get all issues
router.get('/issues', async (req, res) => {
  try {
    const issues = await storage.getCodexIssues(req.query);
    res.json({ success: true, data: issues });
  } catch (error) {
    console.error('Failed to get issues:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get specific issue
router.get('/issues/:issueId', async (req, res) => {
  try {
    const { issueId } = req.params;
    const issue = await storage.getCodexIssue(issueId);
    
    if (!issue) {
      return res.status(404).json({ success: false, error: 'Issue not found' });
    }
    
    res.json({ success: true, data: issue });
  } catch (error) {
    console.error('Failed to get issue:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Update issue status
router.put('/issues/:issueId', async (req, res) => {
  try {
    const { issueId } = req.params;
    const issue = await storage.getCodexIssue(issueId);
    
    if (!issue) {
      return res.status(404).json({ success: false, error: 'Issue not found' });
    }

    const updates = z.object({
      status: z.enum(['open', 'in_progress', 'resolved', 'dismissed', 'false_positive']).optional(),
      resolution: z.enum(['auto_fixed', 'manual_fix', 'dismissed', 'ignored']).optional()
    }).parse(req.body);

    const updatedIssue = await storage.updateCodexIssue(issue.id, updates);
    
    res.json({ success: true, data: updatedIssue });
  } catch (error) {
    console.error('Failed to update issue:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// ===========================================
// FIX MANAGEMENT
// ===========================================

// Get all fixes
router.get('/fixes', async (req, res) => {
  try {
    const fixes = await storage.getCodexFixes(req.query);
    res.json({ success: true, data: fixes });
  } catch (error) {
    console.error('Failed to get fixes:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get specific fix
router.get('/fixes/:fixId', async (req, res) => {
  try {
    const { fixId } = req.params;
    const fix = await storage.getCodexFix(fixId);
    
    if (!fix) {
      return res.status(404).json({ success: false, error: 'Fix not found' });
    }
    
    res.json({ success: true, data: fix });
  } catch (error) {
    console.error('Failed to get fix:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Approve/reject fix
router.put('/fixes/:fixId/approve', async (req, res) => {
  try {
    const { fixId } = req.params;
    const { action } = req.body; // 'approve' or 'reject'
    
    const fix = await storage.getCodexFix(fixId);
    if (!fix) {
      return res.status(404).json({ success: false, error: 'Fix not found' });
    }

    const updates: any = {};
    
    if (action === 'approve') {
      updates.approvedBy = req.body.approvedBy || 'admin';
      updates.approvedAt = new Date();
      updates.status = 'approved';
    } else if (action === 'reject') {
      updates.rejectedBy = req.body.rejectedBy || 'admin';
      updates.rejectedAt = new Date();
      updates.rejectionReason = req.body.rejectionReason;
      updates.status = 'rejected';
    }

    const updatedFix = await storage.updateCodexFix(fix.id, updates);
    
    res.json({ success: true, data: updatedFix });
  } catch (error) {
    console.error('Failed to approve/reject fix:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// ===========================================
// SCHEDULED AUDITS
// ===========================================

// Get all schedules
router.get('/schedules', async (req, res) => {
  try {
    const schedules = await storage.getCodexSchedules(req.query);
    res.json({ success: true, data: schedules });
  } catch (error) {
    console.error('Failed to get schedules:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Create new schedule
router.post('/schedules', async (req, res) => {
  try {
    const scheduleConfig = z.object({
      name: z.string(),
      description: z.string().default(''),
      cronExpression: z.string(),
      auditTypes: z.array(z.enum(['code', 'content', 'seo', 'security', 'compliance', 'ux', 'performance'])),
      scope: z.any().optional(),
      autoFixEnabled: z.boolean().default(false),
      maxAutoFixes: z.number().default(10),
      llmConfig: z.any().optional(),
      notificationChannels: z.array(z.string()).default([])
    }).parse(req.body);

    const schedule = await scheduler.createSchedule({
      ...scheduleConfig,
      scope: scheduleConfig.scope || 'global'
    } as any);
    
    res.json({ success: true, data: schedule });
  } catch (error) {
    console.error('Failed to create schedule:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Update schedule
router.put('/schedules/:scheduleId', async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const updates = req.body;
    
    const schedule = await scheduler.updateSchedule(scheduleId, updates);
    
    res.json({ success: true, data: schedule });
  } catch (error) {
    console.error('Failed to update schedule:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Enable/disable schedule
router.put('/schedules/:scheduleId/toggle', async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { isActive } = req.body;
    
    const schedule = await scheduler.toggleSchedule(scheduleId, isActive);
    
    res.json({ success: true, data: schedule });
  } catch (error) {
    console.error('Failed to toggle schedule:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Trigger manual audit
router.post('/schedules/:scheduleId/trigger', async (req, res) => {
  try {
    const { scheduleId } = req.params;
    
    await scheduler.triggerAudit(scheduleId);
    
    res.json({ success: true, message: 'Audit triggered successfully' });
  } catch (error) {
    console.error('Failed to trigger audit:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Delete schedule
router.delete('/schedules/:scheduleId', async (req, res) => {
  try {
    const { scheduleId } = req.params;
    
    await scheduler.deleteSchedule(scheduleId);
    
    res.json({ success: true, message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Failed to delete schedule:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// ===========================================
// REPORTS & ANALYTICS
// ===========================================

// Get all reports
router.get('/reports', async (req, res) => {
  try {
    const reports = await storage.getCodexReports(req.query);
    res.json({ success: true, data: reports });
  } catch (error) {
    console.error('Failed to get reports:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Generate new report
router.post('/reports/generate', async (req, res) => {
  try {
    const reportConfig = z.object({
      reportType: z.enum(['summary', 'detailed', 'trend', 'evolution']),
      period: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'custom']),
      scope: z.enum(['global', 'neuron', 'module']),
      startDate: z.string().transform(str => new Date(str)),
      endDate: z.string().transform(str => new Date(str)),
      includeMetrics: z.boolean().default(true),
      includeInsights: z.boolean().default(true),
      includeRecommendations: z.boolean().default(true),
      exportFormats: z.array(z.enum(['json', 'pdf', 'csv'])).default(['json'])
    }).parse(req.body);

    const report = await reportGenerator.generateReport(reportConfig);
    
    res.json({ success: true, data: report });
  } catch (error) {
    console.error('Failed to generate report:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get report by ID
router.get('/reports/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    const report = await reportGenerator.getReportById(reportId);
    
    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }
    
    res.json({ success: true, data: report });
  } catch (error) {
    console.error('Failed to get report:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Export report
router.get('/reports/:reportId/export/:format', async (req, res) => {
  try {
    const { reportId, format } = req.params;
    
    if (!['json', 'pdf', 'csv'].includes(format)) {
      return res.status(400).json({ success: false, error: 'Invalid export format' });
    }
    
    const exportData = await reportGenerator.exportReport(reportId, format as any);
    
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="codex-report-${reportId}.json"`);
      res.send(exportData);
    } else if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="codex-report-${reportId}.csv"`);
      res.send(exportData);
    } else if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="codex-report-${reportId}.pdf"`);
      res.send(exportData);
    }
  } catch (error) {
    console.error('Failed to export report:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const timeframe = req.query.timeframe as '24h' | '7d' | '30d' | '90d' || '7d';
    const dashboardData = await reportGenerator.generateDashboardData(timeframe);
    
    res.json({ success: true, data: dashboardData });
  } catch (error) {
    console.error('Failed to get dashboard data:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// ===========================================
// LEARNING & INSIGHTS
// ===========================================

// Get learning patterns
router.get('/learning', async (req, res) => {
  try {
    const learnings = await storage.getCodexLearnings(req.query);
    res.json({ success: true, data: learnings });
  } catch (error) {
    console.error('Failed to get learnings:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// ===========================================
// SYSTEM STATUS
// ===========================================

// Get system health
router.get('/health', async (req, res) => {
  try {
    const schedulerHealth = scheduler.getHealthStatus();
    const recentAudits = await storage.getCodexAudits({ limit: 10 });
    const recentIssues = await storage.getCodexIssues({ limit: 20 });
    
    const health = {
      status: 'healthy',
      scheduler: schedulerHealth,
      recentActivity: {
        audits: recentAudits.length,
        issues: recentIssues.length,
        lastAudit: recentAudits[0]?.createdAt || null
      },
      systemInfo: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        version: '1.0.0'
      }
    };
    
    res.json({ success: true, data: health });
  } catch (error) {
    console.error('Failed to get health status:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;