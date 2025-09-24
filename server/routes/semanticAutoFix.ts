import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { db } from "../db";
import { eq, inArray, and } from "drizzle-orm";
import { graphAuditResults } from "@shared/semanticTables";
import { autoAuditEngine } from "../services/semantic/autoAuditEngine";

const router = Router();

// Auto-fix audit issues
router.post('/auto-fix', async (req: Request, res: Response) => {
  try {
    const { auditIds } = req.body;
    
    if (!Array.isArray(auditIds) || auditIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: "auditIds array is required and must not be empty"
      });
    }

    const result = await autoAuditEngine.autoFixIssues(auditIds);

    res.json({
      success: true,
      data: result,
      message: `Auto-fix completed: ${result.fixed} fixed, ${result.failed} failed`
    });

  } catch (error: any) {
    console.error("Error in auto-fix:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Auto-fix operation failed"
    });
  }
});

// Run full audit
router.post('/run-full-audit', async (req: Request, res: Response) => {
  try {
    const { force = false } = req.body;
    
    const auditResult = await autoAuditEngine.runFullAudit(force);

    res.json({
      success: true,
      data: auditResult,
      message: `Audit completed: Found ${auditResult.issues.length} issues`
    });

  } catch (error: any) {
    console.error("Error running full audit:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to run full audit"
    });
  }
});

// Get audit history
router.get('/history', async (req: Request, res: Response) => {
  try {
    const history = autoAuditEngine.getAuditHistory();
    
    res.json({
      success: true,
      data: history
    });

  } catch (error: any) {
    console.error("Error getting audit history:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get audit history"
    });
  }
});

// Get audit status
router.get('/status', async (req: Request, res: Response) => {
  try {
    const isRunning = autoAuditEngine.isAuditRunning();
    
    res.json({
      success: true,
      data: {
        isRunning,
        history: autoAuditEngine.getAuditHistory().slice(-5) // Last 5 audits
      }
    });

  } catch (error: any) {
    console.error("Error getting audit status:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get audit status"
    });
  }
});

export { router as semanticAutoFixRoutes };