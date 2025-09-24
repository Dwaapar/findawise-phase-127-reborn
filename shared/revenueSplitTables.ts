import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, real, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Revenue Split Partners - Partner/Affiliate management with custom split configurations
export const revenueSplitPartners = pgTable("revenue_split_partners", {
  id: serial("id").primaryKey(),
  partnerId: varchar("partner_id", { length: 255 }).notNull().unique(),
  partnerName: varchar("partner_name", { length: 255 }).notNull(),
  partnerType: varchar("partner_type", { length: 50 }).notNull(), // 'affiliate', 'influencer', 'business_partner', 'revenue_share', 'joint_venture'
  
  // Contact & Legal Information
  contactEmail: varchar("contact_email", { length: 255 }).notNull(),
  contactPhone: varchar("contact_phone", { length: 50 }),
  legalEntityName: varchar("legal_entity_name", { length: 255 }),
  taxId: varchar("tax_id", { length: 100 }),
  businessAddress: jsonb("business_address"),
  
  // Default Split Configuration
  defaultCommissionRate: decimal("default_commission_rate", { precision: 5, scale: 2 }).notNull(), // Percentage
  splitType: varchar("split_type", { length: 50 }).default("percentage"), // 'percentage', 'flat_fee', 'tiered', 'custom'
  minimumPayout: decimal("minimum_payout", { precision: 10, scale: 2 }).default("50.00"),
  payoutFrequency: varchar("payout_frequency", { length: 20 }).default("monthly"), // 'weekly', 'monthly', 'quarterly'
  
  // Payment Information
  paymentMethod: varchar("payment_method", { length: 50 }).default("bank_transfer"), // 'paypal', 'stripe', 'bank_transfer', 'wise', 'upi'
  paymentDetails: jsonb("payment_details"), // Encrypted payment info
  currency: varchar("currency", { length: 3 }).default("USD"),
  
  // Performance Metrics
  totalEarnings: decimal("total_earnings", { precision: 15, scale: 2 }).default("0"),
  pendingPayouts: decimal("pending_payouts", { precision: 15, scale: 2 }).default("0"),
  lifetimeRevenue: decimal("lifetime_revenue", { precision: 15, scale: 2 }).default("0"),
  averageConversionRate: real("average_conversion_rate").default(0),
  
  // Configuration & Status
  customSplitRules: jsonb("custom_split_rules"), // Complex split logic
  verticalAssignments: text("vertical_assignments").array(), // Which verticals they work with
  geoRestrictions: text("geo_restrictions").array(), // Geographic limitations
  contractTerms: jsonb("contract_terms"),
  
  // Status & Management
  status: varchar("status", { length: 20 }).default("active"), // 'active', 'paused', 'suspended', 'terminated'
  isVip: boolean("is_vip").default(false),
  autoPayouts: boolean("auto_payouts").default(true),
  requiresApproval: boolean("requires_approval").default(false),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastPayoutAt: timestamp("last_payout_at"),
  contractStartDate: timestamp("contract_start_date"),
  contractEndDate: timestamp("contract_end_date"),
  
  // Metadata
  metadata: jsonb("metadata"),
  notes: text("notes")
});

// Revenue Split Rules - Configurable split logic per partner/product/vertical
export const revenueSplitRules = pgTable("revenue_split_rules", {
  id: serial("id").primaryKey(),
  ruleId: varchar("rule_id", { length: 255 }).notNull().unique(),
  ruleName: varchar("rule_name", { length: 255 }).notNull(),
  
  // Rule Scope
  partnerId: integer("partner_id").references(() => revenueSplitPartners.id),
  vertical: varchar("vertical", { length: 100 }), // 'finance', 'health', 'travel', 'saas', etc.
  productCategory: varchar("product_category", { length: 100 }),
  specificProducts: integer("specific_products").array(),
  
  // Split Configuration
  splitType: varchar("split_type", { length: 50 }).notNull(), // 'flat', 'percentage', 'tiered', 'hybrid', 'custom'
  commissionStructure: jsonb("commission_structure").notNull(), // Complex commission rules
  
  // Tiered Structure Example:
  // {
  //   "type": "tiered",
  //   "tiers": [
  //     { "min": 0, "max": 1000, "rate": 10, "type": "percentage" },
  //     { "min": 1000, "max": 5000, "rate": 15, "type": "percentage" },
  //     { "min": 5000, "rate": 20, "type": "percentage" }
  //   ]
  // }
  
  // Rule Conditions
  minimumOrderValue: decimal("minimum_order_value", { precision: 10, scale: 2 }),
  maximumOrderValue: decimal("maximum_order_value", { precision: 10, scale: 2 }),
  eligibleCountries: text("eligible_countries").array(),
  eligibleCustomerTypes: text("eligible_customer_types").array(),
  timeRestrictions: jsonb("time_restrictions"), // Date ranges, hours, etc.
  
  // Performance Bonuses
  performanceBonuses: jsonb("performance_bonuses"), // Volume bonuses, conversion bonuses
  
  // Status & Timing
  priority: integer("priority").default(1), // Higher priority rules override lower ones
  isActive: boolean("is_active").default(true),
  effectiveDate: timestamp("effective_date").defaultNow(),
  expirationDate: timestamp("expiration_date"),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by", { length: 255 }),
  metadata: jsonb("metadata")
});

// Revenue Split Transactions - Individual split calculations and tracking
export const revenueSplitTransactions = pgTable("revenue_split_transactions", {
  id: serial("id").primaryKey(),
  transactionId: varchar("transaction_id", { length: 255 }).notNull().unique(),
  
  // Source Transaction Information
  orderId: varchar("order_id", { length: 255 }),
  clickId: varchar("click_id", { length: 255 }),
  affiliateCode: varchar("affiliate_code", { length: 100 }),
  
  // Partner & Rule Information
  partnerId: integer("partner_id").references(() => revenueSplitPartners.id).notNull(),
  ruleId: integer("rule_id").references(() => revenueSplitRules.id),
  
  // Transaction Details
  originalAmount: decimal("original_amount", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD"),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 6 }).default("1.000000"),
  
  // Split Calculation
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull(),
  commissionAmount: decimal("commission_amount", { precision: 15, scale: 2 }).notNull(),
  bonusAmount: decimal("bonus_amount", { precision: 15, scale: 2 }).default("0"),
  totalSplitAmount: decimal("total_split_amount", { precision: 15, scale: 2 }).notNull(),
  
  // Fee Deductions
  processingFees: decimal("processing_fees", { precision: 10, scale: 2 }).default("0"),
  platformFees: decimal("platform_fees", { precision: 10, scale: 2 }).default("0"),
  netPayoutAmount: decimal("net_payout_amount", { precision: 15, scale: 2 }).notNull(),
  
  // Product & Vertical Information
  vertical: varchar("vertical", { length: 100 }),
  productCategory: varchar("product_category", { length: 100 }),
  productId: integer("product_id"),
  productName: varchar("product_name", { length: 255 }),
  
  // Customer Information (anonymized)
  customerSegment: varchar("customer_segment", { length: 100 }),
  customerCountry: varchar("customer_country", { length: 3 }),
  isNewCustomer: boolean("is_new_customer").default(true),
  
  // Status & Processing
  status: varchar("status", { length: 50 }).default("pending"), // 'pending', 'approved', 'paid', 'disputed', 'cancelled'
  payoutBatchId: varchar("payout_batch_id", { length: 255 }),
  
  // Timestamps
  transactionDate: timestamp("transaction_date").defaultNow(),
  approvedAt: timestamp("approved_at"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
  
  // Audit & Compliance
  auditTrail: jsonb("audit_trail"),
  complianceChecks: jsonb("compliance_checks"),
  metadata: jsonb("metadata")
});

// Revenue Split Payouts - Batch payout management and tracking
export const revenueSplitPayouts = pgTable("revenue_split_payouts", {
  id: serial("id").primaryKey(),
  payoutId: varchar("payout_id", { length: 255 }).notNull().unique(),
  batchId: varchar("batch_id", { length: 255 }).notNull(),
  
  // Partner Information
  partnerId: integer("partner_id").references(() => revenueSplitPartners.id).notNull(),
  partnerName: varchar("partner_name", { length: 255 }).notNull(),
  
  // Payout Details
  payoutPeriod: jsonb("payout_period").notNull(), // { start: date, end: date }
  totalTransactions: integer("total_transactions").notNull(),
  grossAmount: decimal("gross_amount", { precision: 15, scale: 2 }).notNull(),
  deductions: decimal("deductions", { precision: 10, scale: 2 }).default("0"),
  netPayoutAmount: decimal("net_payout_amount", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD"),
  
  // Payment Processing
  paymentMethod: varchar("payment_method", { length: 50 }).notNull(),
  paymentDetails: jsonb("payment_details"), // Encrypted
  paymentProcessorId: varchar("payment_processor_id", { length: 255 }),
  paymentProcessorFee: decimal("payment_processor_fee", { precision: 10, scale: 2 }).default("0"),
  
  // Status & Tracking
  status: varchar("status", { length: 50 }).default("pending"), // 'pending', 'processing', 'completed', 'failed', 'cancelled'
  failureReason: text("failure_reason"),
  retryCount: integer("retry_count").default(0),
  maxRetries: integer("max_retries").default(3),
  
  // Timestamps
  scheduledAt: timestamp("scheduled_at").notNull(),
  processedAt: timestamp("processed_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  
  // Documentation & Compliance
  invoiceNumber: varchar("invoice_number", { length: 100 }),
  taxDocuments: jsonb("tax_documents"),
  complianceData: jsonb("compliance_data"),
  
  // Metadata
  metadata: jsonb("metadata"),
  notes: text("notes")
});

// Profit Forecast Models - ML-powered revenue prediction and scenario analysis
export const profitForecastModels = pgTable("profit_forecast_models", {
  id: serial("id").primaryKey(),
  modelId: varchar("model_id", { length: 255 }).notNull().unique(),
  modelName: varchar("model_name", { length: 255 }).notNull(),
  
  // Model Configuration
  modelType: varchar("model_type", { length: 50 }).notNull(), // 'linear_regression', 'arima', 'prophet', 'lstm', 'ensemble'
  forecastHorizon: integer("forecast_horizon").default(90), // Days to forecast
  
  // Training Data Configuration
  historicalPeriod: integer("historical_period").default(365), // Days of historical data
  dataFeatures: text("data_features").array(), // Revenue streams, seasonality, external factors
  targetMetrics: text("target_metrics").array(), // What to predict
  
  // Model Parameters
  modelParameters: jsonb("model_parameters").notNull(),
  hyperparameters: jsonb("hyperparameters"),
  
  // Performance Metrics
  accuracy: real("accuracy").default(0),
  mape: real("mape").default(100), // Mean Absolute Percentage Error
  rmse: real("rmse").default(0), // Root Mean Square Error
  r2Score: real("r2_score").default(0),
  
  // Model Status
  status: varchar("status", { length: 50 }).default("training"), // 'training', 'active', 'deprecated', 'failed'
  version: varchar("version", { length: 50 }).default("1.0"),
  isDefault: boolean("is_default").default(false),
  
  // Training & Update Schedule
  lastTrainedAt: timestamp("last_trained_at"),
  nextTrainingAt: timestamp("next_training_at"),
  trainingFrequency: varchar("training_frequency", { length: 50 }).default("weekly"),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by", { length: 255 }),
  metadata: jsonb("metadata")
});

// Profit Forecasts - Generated predictions and scenario analysis
export const profitForecasts = pgTable("profit_forecasts", {
  id: serial("id").primaryKey(),
  forecastId: varchar("forecast_id", { length: 255 }).notNull().unique(),
  
  // Model & Generation Information
  modelId: integer("model_id").references(() => profitForecastModels.id).notNull(),
  modelVersion: varchar("model_version", { length: 50 }).notNull(),
  
  // Forecast Scope
  forecastType: varchar("forecast_type", { length: 50 }).notNull(), // 'overall', 'partner', 'vertical', 'product'
  scope: jsonb("scope"), // What this forecast covers
  
  // Time Period
  forecastPeriod: jsonb("forecast_period").notNull(), // { start: date, end: date }
  generatedAt: timestamp("generated_at").defaultNow(),
  
  // Forecast Data
  predictions: jsonb("predictions").notNull(), // Time series predictions
  confidence: jsonb("confidence"), // Confidence intervals
  seasonalFactors: jsonb("seasonal_factors"),
  trendAnalysis: jsonb("trend_analysis"),
  
  // Revenue Breakdown
  totalRevenueForecast: decimal("total_revenue_forecast", { precision: 15, scale: 2 }),
  partnerSplitForecast: decimal("partner_split_forecast", { precision: 15, scale: 2 }),
  netProfitForecast: decimal("net_profit_forecast", { precision: 15, scale: 2 }),
  
  // Risk Analysis
  riskFactors: jsonb("risk_factors"),
  scenarioAnalysis: jsonb("scenario_analysis"), // Best case, worst case, most likely
  volatilityMetrics: jsonb("volatility_metrics"),
  
  // Validation & Accuracy
  actualVsPredicted: jsonb("actual_vs_predicted"), // For completed periods
  accuracyScore: real("accuracy_score"),
  
  // Status
  status: varchar("status", { length: 50 }).default("active"), // 'active', 'outdated', 'archived'
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  metadata: jsonb("metadata")
});

// Revenue Split Analytics - Aggregated analytics and reporting
export const revenueSplitAnalytics = pgTable("revenue_split_analytics", {
  id: serial("id").primaryKey(),
  analyticsId: varchar("analytics_id", { length: 255 }).notNull().unique(),
  
  // Period & Scope
  period: varchar("period", { length: 20 }).notNull(), // 'daily', 'weekly', 'monthly', 'quarterly'
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  
  // Scope Filters
  partnerId: integer("partner_id").references(() => revenueSplitPartners.id),
  vertical: varchar("vertical", { length: 100 }),
  productCategory: varchar("product_category", { length: 100 }),
  
  // Revenue Metrics
  totalRevenue: decimal("total_revenue", { precision: 15, scale: 2 }).default("0"),
  totalCommissions: decimal("total_commissions", { precision: 15, scale: 2 }).default("0"),
  totalPayouts: decimal("total_payouts", { precision: 15, scale: 2 }).default("0"),
  netProfit: decimal("net_profit", { precision: 15, scale: 2 }).default("0"),
  
  // Performance Metrics
  transactionCount: integer("transaction_count").default(0),
  uniquePartners: integer("unique_partners").default(0),
  averageCommissionRate: real("average_commission_rate").default(0),
  averageOrderValue: decimal("average_order_value", { precision: 10, scale: 2 }).default("0"),
  
  // Growth Metrics
  revenueGrowth: real("revenue_growth").default(0), // Percentage vs previous period
  commissionGrowth: real("commission_growth").default(0),
  partnerGrowth: real("partner_growth").default(0),
  
  // Top Performers
  topPartners: jsonb("top_partners"), // Array of top performing partners
  topProducts: jsonb("top_products"), // Array of top performing products
  topVerticals: jsonb("top_verticals"), // Array of top performing verticals
  
  // Efficiency Metrics
  conversionRate: real("conversion_rate").default(0),
  revenuePerPartner: decimal("revenue_per_partner", { precision: 10, scale: 2 }).default("0"),
  costPerAcquisition: decimal("cost_per_acquisition", { precision: 10, scale: 2 }).default("0"),
  
  // Timestamps
  calculatedAt: timestamp("calculated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  
  // Metadata
  metadata: jsonb("metadata")
});

// Schema exports for type safety
export const insertRevenueSplitPartnerSchema = createInsertSchema(revenueSplitPartners);
export const insertRevenueSplitRuleSchema = createInsertSchema(revenueSplitRules);
export const insertRevenueSplitTransactionSchema = createInsertSchema(revenueSplitTransactions);
export const insertRevenueSplitPayoutSchema = createInsertSchema(revenueSplitPayouts);
export const insertProfitForecastModelSchema = createInsertSchema(profitForecastModels);
export const insertProfitForecastSchema = createInsertSchema(profitForecasts);
export const insertRevenueSplitAnalyticsSchema = createInsertSchema(revenueSplitAnalytics);

// TypeScript types
export type RevenueSplitPartner = typeof revenueSplitPartners.$inferSelect;
export type InsertRevenueSplitPartner = z.infer<typeof insertRevenueSplitPartnerSchema>;
export type RevenueSplitRule = typeof revenueSplitRules.$inferSelect;
export type InsertRevenueSplitRule = z.infer<typeof insertRevenueSplitRuleSchema>;
export type RevenueSplitTransaction = typeof revenueSplitTransactions.$inferSelect;
export type InsertRevenueSplitTransaction = z.infer<typeof insertRevenueSplitTransactionSchema>;
export type RevenueSplitPayout = typeof revenueSplitPayouts.$inferSelect;
export type InsertRevenueSplitPayout = z.infer<typeof insertRevenueSplitPayoutSchema>;
export type ProfitForecastModel = typeof profitForecastModels.$inferSelect;
export type InsertProfitForecastModel = z.infer<typeof insertProfitForecastModelSchema>;
export type ProfitForecast = typeof profitForecasts.$inferSelect;
export type InsertProfitForecast = z.infer<typeof insertProfitForecastSchema>;
export type RevenueSplitAnalytics = typeof revenueSplitAnalytics.$inferSelect;
export type InsertRevenueSplitAnalytics = z.infer<typeof insertRevenueSplitAnalyticsSchema>;