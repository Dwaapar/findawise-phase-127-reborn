import { pgTable, serial, varchar, text, timestamp, jsonb, boolean, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ===========================================
// CODEX AUDIT SYSTEM TABLES
// ===========================================

export const codexAudits = pgTable("codex_audits", {
  id: serial("id").primaryKey(),
  auditId: varchar("audit_id", { length: 255 }).notNull().unique(),
  
  // Audit Configuration
  auditType: varchar("audit_type", { length: 100 }).notNull(), // code, content, seo, security, compliance, ux, performance
  scope: varchar("scope", { length: 255 }).notNull(), // file_path, module, global, neuron_id
  targetPath: varchar("target_path", { length: 500 }), // specific file/module path
  
  // Audit Status
  status: varchar("status", { length: 50 }).default("pending"), // pending, running, completed, failed, cancelled
  priority: varchar("priority", { length: 20 }).default("medium"), // low, medium, high, critical
  
  // LLM Configuration
  llmProvider: varchar("llm_provider", { length: 100 }).default("openai"), // openai, claude, ollama, openrouter
  modelUsed: varchar("model_used", { length: 100 }),
  promptTemplate: text("prompt_template"),
  
  // Results
  issuesFound: integer("issues_found").default(0),
  issuesResolved: integer("issues_resolved").default(0),
  auditScore: real("audit_score"), // 0-100 quality score
  
  // Timing
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  executionTime: integer("execution_time"), // milliseconds
  
  // Metadata
  triggeredBy: varchar("triggered_by", { length: 100 }), // user, schedule, auto, webhook
  auditConfig: jsonb("audit_config"), // specific audit parameters
  metadata: jsonb("metadata"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const codexIssues = pgTable("codex_issues", {
  id: serial("id").primaryKey(),
  auditId: integer("audit_id").references(() => codexAudits.id),
  issueId: varchar("issue_id", { length: 255 }).notNull().unique(),
  
  // Issue Classification
  category: varchar("category", { length: 100 }).notNull(), // security, performance, maintainability, style, compliance
  severity: varchar("severity", { length: 20 }).notNull(), // low, medium, high, critical
  type: varchar("type", { length: 100 }).notNull(), // vulnerability, optimization, refactor, style, missing
  
  // Issue Location
  filePath: varchar("file_path", { length: 500 }),
  lineNumber: integer("line_number"),
  columnNumber: integer("column_number"),
  codeSnippet: text("code_snippet"),
  
  // Issue Details
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  recommendation: text("recommendation"),
  
  // Resolution
  status: varchar("status", { length: 50 }).default("open"), // open, in_progress, resolved, dismissed, false_positive
  resolution: varchar("resolution", { length: 50 }), // auto_fixed, manual_fix, dismissed, ignored
  
  // AI Analysis
  aiConfidence: real("ai_confidence"), // 0-1 confidence score
  aiReasoning: text("ai_reasoning"),
  
  // Fix Information
  proposedFix: text("proposed_fix"),
  fixDiff: text("fix_diff"),
  fixApplied: boolean("fix_applied").default(false),
  
  // Impact Assessment
  impactScore: real("impact_score"), // 0-10 impact rating
  riskLevel: varchar("risk_level", { length: 20 }), // low, medium, high, critical
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  resolvedAt: timestamp("resolved_at")
});

export const codexFixes = pgTable("codex_fixes", {
  id: serial("id").primaryKey(),
  issueId: integer("issue_id").references(() => codexIssues.id),
  fixId: varchar("fix_id", { length: 255 }).notNull().unique(),
  
  // Fix Details
  fixType: varchar("fix_type", { length: 100 }).notNull(), // automated, manual, hybrid
  fixCategory: varchar("fix_category", { length: 100 }), // code_change, config_update, content_edit
  
  // Change Information
  filePath: varchar("file_path", { length: 500 }).notNull(),
  originalCode: text("original_code"),
  fixedCode: text("fixed_code"),
  diffPatch: text("diff_patch"),
  
  // Execution Details
  status: varchar("status", { length: 50 }).default("pending"), // pending, applied, failed, rolled_back
  applyMethod: varchar("apply_method", { length: 100 }), // direct_edit, git_commit, api_call
  
  // Approval Workflow
  requiresApproval: boolean("requires_approval").default(true),
  approvedBy: varchar("approved_by", { length: 255 }),
  approvedAt: timestamp("approved_at"),
  rejectedBy: varchar("rejected_by", { length: 255 }),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
  
  // Version Control
  commitHash: varchar("commit_hash", { length: 100 }),
  branchName: varchar("branch_name", { length: 255 }),
  pullRequestUrl: varchar("pull_request_url", { length: 500 }),
  
  // Rollback Information
  canRollback: boolean("can_rollback").default(true),
  rollbackData: jsonb("rollback_data"),
  rolledBackAt: timestamp("rolled_back_at"),
  
  // Testing & Validation
  testsPassed: boolean("tests_passed"),
  validationResults: jsonb("validation_results"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  appliedAt: timestamp("applied_at")
});

export const codexLearning = pgTable("codex_learning", {
  id: serial("id").primaryKey(),
  learningId: varchar("learning_id", { length: 255 }).notNull().unique(),
  
  // Pattern Recognition
  patternType: varchar("pattern_type", { length: 100 }).notNull(), // recurring_issue, fix_pattern, quality_trend
  patternData: jsonb("pattern_data").notNull(),
  
  // Learning Classification
  category: varchar("category", { length: 100 }).notNull(),
  subcategory: varchar("subcategory", { length: 100 }),
  neuronScope: varchar("neuron_scope", { length: 100 }), // global, neuron_type, specific_neuron
  
  // Pattern Analysis
  occurrenceCount: integer("occurrence_count").default(1),
  successRate: real("success_rate"), // success rate of fixes for this pattern
  confidence: real("confidence"), // AI confidence in pattern recognition
  
  // Learning Outcomes
  preventionRule: jsonb("prevention_rule"), // generated lint rules, guards, templates
  improvementSuggestion: text("improvement_suggestion"),
  automationOpportunity: text("automation_opportunity"),
  
  // Impact & Priority
  impactScore: real("impact_score"),
  priorityLevel: varchar("priority_level", { length: 20 }),
  
  // Evolution Tracking
  isActive: boolean("is_active").default(true),
  lastSeen: timestamp("last_seen").defaultNow(),
  evolutionStage: varchar("evolution_stage", { length: 50 }), // identified, analyzed, actionable, implemented
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const codexSchedules = pgTable("codex_schedules", {
  id: serial("id").primaryKey(),
  scheduleId: varchar("schedule_id", { length: 255 }).notNull().unique(),
  
  // Schedule Configuration
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  auditTypes: jsonb("audit_types").notNull(), // array of audit types to run
  
  // Timing
  cronExpression: varchar("cron_expression", { length: 100 }), // for scheduled audits
  frequency: varchar("frequency", { length: 50 }), // hourly, daily, weekly, monthly
  nextRun: timestamp("next_run"),
  lastRun: timestamp("last_run"),
  
  // Scope & Filters
  scope: jsonb("scope"), // which files/modules/neurons to audit
  filters: jsonb("filters"), // include/exclude patterns
  
  // Configuration
  llmConfig: jsonb("llm_config"),
  auditConfig: jsonb("audit_config"),
  autoFixEnabled: boolean("auto_fix_enabled").default(false),
  maxAutoFixes: integer("max_auto_fixes").default(10),
  
  // Status & Health
  isActive: boolean("is_active").default(true),
  lastSuccessfulRun: timestamp("last_successful_run"),
  consecutiveFailures: integer("consecutive_failures").default(0),
  healthStatus: varchar("health_status", { length: 50 }).default("healthy"),
  
  // Notifications
  notifyOnCompletion: boolean("notify_on_completion").default(false),
  notifyOnFailure: boolean("notify_on_failure").default(true),
  notificationChannels: jsonb("notification_channels"),
  
  createdBy: varchar("created_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const codexReports = pgTable("codex_reports", {
  id: serial("id").primaryKey(),
  reportId: varchar("report_id", { length: 255 }).notNull().unique(),
  
  // Report Configuration
  reportType: varchar("report_type", { length: 100 }).notNull(), // summary, detailed, trend, evolution
  period: varchar("period", { length: 50 }), // daily, weekly, monthly, quarterly
  scope: varchar("scope", { length: 100 }), // global, neuron, module
  
  // Time Range
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  
  // Report Data
  reportData: jsonb("report_data").notNull(),
  summary: jsonb("summary"),
  metrics: jsonb("metrics"),
  insights: jsonb("insights"),
  recommendations: jsonb("recommendations"),
  
  // Report Metadata
  generatedBy: varchar("generated_by", { length: 100 }), // auto, user, schedule
  generationTime: integer("generation_time"), // milliseconds
  
  // Status
  status: varchar("status", { length: 50 }).default("generated"),
  isPublic: boolean("is_public").default(false),
  
  // Export & Distribution
  exportFormats: jsonb("export_formats"), // pdf, json, csv available
  distributionList: jsonb("distribution_list"),
  lastDistributed: timestamp("last_distributed"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// ===========================================
// DRIZZLE SCHEMAS
// ===========================================

export const insertCodexAuditSchema = createInsertSchema(codexAudits).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertCodexIssueSchema = createInsertSchema(codexIssues).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertCodexFixSchema = createInsertSchema(codexFixes).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertCodexLearningSchema = createInsertSchema(codexLearning).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertCodexScheduleSchema = createInsertSchema(codexSchedules).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertCodexReportSchema = createInsertSchema(codexReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// ===========================================
// TYPE EXPORTS
// ===========================================

export type CodexAudit = typeof codexAudits.$inferSelect;
export type CodexIssue = typeof codexIssues.$inferSelect;
export type CodexFix = typeof codexFixes.$inferSelect;
export type CodexLearning = typeof codexLearning.$inferSelect;
export type CodexSchedule = typeof codexSchedules.$inferSelect;
export type CodexReport = typeof codexReports.$inferSelect;

export type InsertCodexAudit = z.infer<typeof insertCodexAuditSchema>;
export type InsertCodexIssue = z.infer<typeof insertCodexIssueSchema>;
export type InsertCodexFix = z.infer<typeof insertCodexFixSchema>;
export type InsertCodexLearning = z.infer<typeof insertCodexLearningSchema>;
export type InsertCodexSchedule = z.infer<typeof insertCodexScheduleSchema>;
export type InsertCodexReport = z.infer<typeof insertCodexReportSchema>;