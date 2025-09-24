import express from 'express';
import { RevenueSplitManager } from '../services/revenueSplit/revenueSplitManager';
import { ProfitForecastEngine } from '../services/revenueSplit/profitForecastEngine';
import { DatabaseStorage } from '../storage';
import { db } from '../db';
import { 
  revenueSplitPartners, 
  revenueSplitRules, 
  revenueSplitTransactions, 
  revenueSplitPayouts,
  profitForecasts,
  type InsertRevenueSplitPartner,
  type InsertRevenueSplitRule 
} from '../../shared/revenueSplitTables';
import { and, eq, gte, lte, desc, sum, count } from 'drizzle-orm';
import { z } from 'zod';

const router = express.Router();

// Initialize services
const storage = new DatabaseStorage();
const revenueSplitManager = new RevenueSplitManager(storage);
const profitForecastEngine = new ProfitForecastEngine(storage);

// Initialize forecast engine
profitForecastEngine.initialize();

// ===========================================
// REVENUE SPLIT PARTNERS MANAGEMENT
// ===========================================

// Get all partners
router.get('/partners', async (req, res) => {
  try {
    const { status, partnerType, vertical } = req.query;
    
    let whereClause = [];
    if (status) whereClause.push(eq(revenueSplitPartners.status, status as string));
    if (partnerType) whereClause.push(eq(revenueSplitPartners.partnerType, partnerType as string));
    
    const partners = await db.select()
      .from(revenueSplitPartners)
      .where(whereClause.length > 0 ? and(...whereClause) : undefined)
      .orderBy(desc(revenueSplitPartners.totalEarnings));

    // Add performance metrics for each partner
    const partnersWithMetrics = await Promise.all(
      partners.map(async (partner) => {
        const recentTransactions = await db.select({
          count: count(),
          totalRevenue: sum(revenueSplitTransactions.originalAmount),
          totalCommissions: sum(revenueSplitTransactions.commissionAmount)
        })
        .from(revenueSplitTransactions)
        .where(and(
          eq(revenueSplitTransactions.partnerId, partner.id),
          gte(revenueSplitTransactions.transactionDate, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        ));

        const metrics = recentTransactions[0];
        
        return {
          ...partner,
          recentMetrics: {
            transactions30d: parseInt(metrics.count?.toString() || '0'),
            revenue30d: parseFloat(metrics.totalRevenue || '0'),
            commissions30d: parseFloat(metrics.totalCommissions || '0')
          }
        };
      })
    );

    res.json({
      success: true,
      data: partnersWithMetrics,
      total: partnersWithMetrics.length
    });

  } catch (error) {
    console.error('❌ Error getting partners:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get partners',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create new partner
router.post('/partners', async (req, res) => {
  try {
    const partnerSchema = z.object({
      partnerId: z.string().min(1),
      partnerName: z.string().min(1),
      partnerType: z.enum(['affiliate', 'influencer', 'business_partner', 'revenue_share', 'joint_venture']),
      contactEmail: z.string().email(),
      contactPhone: z.string().optional(),
      defaultCommissionRate: z.string(),
      splitType: z.enum(['percentage', 'flat_fee', 'tiered', 'custom']).default('percentage'),
      minimumPayout: z.string().default('50.00'),
      payoutFrequency: z.enum(['weekly', 'monthly', 'quarterly']).default('monthly'),
      paymentMethod: z.enum(['paypal', 'stripe', 'bank_transfer', 'wise', 'upi']).default('bank_transfer'),
      currency: z.string().default('USD'),
      verticalAssignments: z.array(z.string()).default([]),
      customSplitRules: z.any().optional(),
      contractTerms: z.any().optional()
    });

    const validatedData = partnerSchema.parse(req.body);
    
    const [partner] = await db.insert(revenueSplitPartners).values({
      ...validatedData,
      status: 'active',
      metadata: JSON.stringify({
        createdBy: 'admin', // Would use JWT user in production
        createdAt: new Date().toISOString()
      })
    }).returning();

    console.log(`✅ Created new revenue split partner: ${partner.partnerName}`);

    res.status(201).json({
      success: true,
      data: partner,
      message: 'Partner created successfully'
    });

  } catch (error) {
    console.error('❌ Error creating partner:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to create partner'
    });
  }
});

// Update partner
router.put('/partners/:id', async (req, res) => {
  try {
    const partnerId = parseInt(req.params.id);
    if (isNaN(partnerId)) {
      return res.status(400).json({ success: false, error: 'Invalid partner ID' });
    }

    const updates = {
      ...req.body,
      updatedAt: new Date()
    };

    const [updatedPartner] = await db.update(revenueSplitPartners)
      .set(updates)
      .where(eq(revenueSplitPartners.id, partnerId))
      .returning();

    if (!updatedPartner) {
      return res.status(404).json({ success: false, error: 'Partner not found' });
    }

    res.json({
      success: true,
      data: updatedPartner,
      message: 'Partner updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating partner:', error);
    res.status(500).json({ success: false, error: 'Failed to update partner' });
  }
});

// ===========================================
// REVENUE SPLIT RULES MANAGEMENT
// ===========================================

// Get all split rules
router.get('/rules', async (req, res) => {
  try {
    const { partnerId, vertical, isActive } = req.query;
    
    let whereClause = [];
    if (partnerId) whereClause.push(eq(revenueSplitRules.partnerId, parseInt(partnerId as string)));
    if (vertical) whereClause.push(eq(revenueSplitRules.vertical, vertical as string));
    if (isActive !== undefined) whereClause.push(eq(revenueSplitRules.isActive, isActive === 'true'));

    const rules = await db.select()
      .from(revenueSplitRules)
      .where(whereClause.length > 0 ? and(...whereClause) : undefined)
      .orderBy(desc(revenueSplitRules.priority));

    // Include partner names
    const rulesWithPartners = await Promise.all(
      rules.map(async (rule) => {
        let partnerName = null;
        if (rule.partnerId) {
          const partner = await db.select({ partnerName: revenueSplitPartners.partnerName })
            .from(revenueSplitPartners)
            .where(eq(revenueSplitPartners.id, rule.partnerId))
            .limit(1);
          partnerName = partner[0]?.partnerName || null;
        }
        
        return { ...rule, partnerName };
      })
    );

    res.json({
      success: true,
      data: rulesWithPartners,
      total: rulesWithPartners.length
    });

  } catch (error) {
    console.error('❌ Error getting split rules:', error);
    res.status(500).json({ success: false, error: 'Failed to get split rules' });
  }
});

// Create new split rule
router.post('/rules', async (req, res) => {
  try {
    const ruleSchema = z.object({
      ruleName: z.string().min(1),
      partnerId: z.number().optional(),
      vertical: z.string().optional(),
      productCategory: z.string().optional(),
      splitType: z.enum(['flat', 'percentage', 'tiered', 'hybrid', 'custom']),
      commissionStructure: z.any(),
      minimumOrderValue: z.string().optional(),
      maximumOrderValue: z.string().optional(),
      eligibleCountries: z.array(z.string()).default([]),
      performanceBonuses: z.any().optional(),
      priority: z.number().default(1),
      effectiveDate: z.string().optional(),
      expirationDate: z.string().optional()
    });

    const validatedData = ruleSchema.parse(req.body);
    
    const ruleData = {
      ...validatedData,
      ruleId: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      isActive: true,
      createdBy: 'admin', // Would use JWT user in production
      metadata: JSON.stringify({
        createdAt: new Date().toISOString()
      })
    };

    const [rule] = await db.insert(revenueSplitRules).values(ruleData).returning();

    console.log(`✅ Created new split rule: ${rule.ruleName}`);

    res.status(201).json({
      success: true,
      data: rule,
      message: 'Split rule created successfully'
    });

  } catch (error) {
    console.error('❌ Error creating split rule:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
    res.status(500).json({ success: false, error: 'Failed to create split rule' });
  }
});

// ===========================================
// REVENUE SPLIT PROCESSING
// ===========================================

// Process revenue split for a transaction
router.post('/process', async (req, res) => {
  try {
    const transactionSchema = z.object({
      orderId: z.string(),
      affiliateCode: z.string().optional(),
      clickId: z.string().optional(),
      originalAmount: z.number().positive(),
      currency: z.string().default('USD'),
      vertical: z.string().optional(),
      productCategory: z.string().optional(),
      productId: z.number().optional(),
      productName: z.string().optional(),
      customerSegment: z.string().optional(),
      customerCountry: z.string().optional(),
      isNewCustomer: z.boolean().default(true)
    });

    const transactionData = transactionSchema.parse(req.body);
    
    const splitResults = await revenueSplitManager.processRevenueSplit(transactionData);

    res.json({
      success: true,
      data: {
        transactionId: transactionData.orderId,
        splits: splitResults,
        totalSplitAmount: splitResults.reduce((sum, split) => sum + split.totalSplitAmount, 0),
        totalNetPayout: splitResults.reduce((sum, split) => sum + split.netPayoutAmount, 0)
      },
      message: `Revenue split processed for ${splitResults.length} partners`
    });

  } catch (error) {
    console.error('❌ Error processing revenue split:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
    res.status(500).json({ success: false, error: 'Failed to process revenue split' });
  }
});

// ===========================================
// PAYOUT MANAGEMENT
// ===========================================

// Generate payout batch
router.post('/payouts/generate', async (req, res) => {
  try {
    const payoutSchema = z.object({
      partnerId: z.number(),
      startDate: z.string(),
      endDate: z.string()
    });

    const { partnerId, startDate, endDate } = payoutSchema.parse(req.body);
    
    const batch = await revenueSplitManager.generatePayoutBatch(
      partnerId,
      { start: new Date(startDate), end: new Date(endDate) }
    );

    if (!batch) {
      return res.status(400).json({
        success: false,
        error: 'No eligible transactions found or minimum payout threshold not met'
      });
    }

    res.json({
      success: true,
      data: batch,
      message: 'Payout batch generated successfully'
    });

  } catch (error) {
    console.error('❌ Error generating payout batch:', error);
    res.status(500).json({ success: false, error: 'Failed to generate payout batch' });
  }
});

// Process automatic payouts
router.post('/payouts/process-automatic', async (req, res) => {
  try {
    const results = await revenueSplitManager.processAutomaticPayouts();

    res.json({
      success: true,
      data: results,
      message: `Automatic payout processing complete: ${results.processed} processed, ${results.skipped} skipped, ${results.errors} errors`
    });

  } catch (error) {
    console.error('❌ Error processing automatic payouts:', error);
    res.status(500).json({ success: false, error: 'Failed to process automatic payouts' });
  }
});

// Get all payouts
router.get('/payouts', async (req, res) => {
  try {
    const { partnerId, status, startDate, endDate } = req.query;
    
    let whereClause = [];
    if (partnerId) whereClause.push(eq(revenueSplitPayouts.partnerId, parseInt(partnerId as string)));
    if (status) whereClause.push(eq(revenueSplitPayouts.status, status as string));
    if (startDate) whereClause.push(gte(revenueSplitPayouts.scheduledAt, new Date(startDate as string)));
    if (endDate) whereClause.push(lte(revenueSplitPayouts.scheduledAt, new Date(endDate as string)));

    const payouts = await db.select()
      .from(revenueSplitPayouts)
      .where(whereClause.length > 0 ? and(...whereClause) : undefined)
      .orderBy(desc(revenueSplitPayouts.scheduledAt));

    res.json({
      success: true,
      data: payouts,
      total: payouts.length
    });

  } catch (error) {
    console.error('❌ Error getting payouts:', error);
    res.status(500).json({ success: false, error: 'Failed to get payouts' });
  }
});

// ===========================================
// REVENUE ANALYTICS
// ===========================================

// Get revenue analytics
router.get('/analytics', async (req, res) => {
  try {
    const { startDate, endDate, partnerId, vertical, productCategory } = req.query;
    
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const filters: any = {};
    if (partnerId) filters.partnerId = parseInt(partnerId as string);
    if (vertical) filters.vertical = vertical as string;
    if (productCategory) filters.productCategory = productCategory as string;

    const analytics = await revenueSplitManager.getRevenueAnalytics(
      { start, end },
      filters
    );

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('❌ Error getting revenue analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to get revenue analytics' });
  }
});

// ===========================================
// PROFIT FORECASTING
// ===========================================

// Generate profit forecast
router.post('/forecast/generate', async (req, res) => {
  try {
    const forecastSchema = z.object({
      forecastDays: z.number().min(1).max(365).default(90),
      partnerId: z.number().optional(),
      vertical: z.string().optional(),
      productCategory: z.string().optional()
    });

    const { forecastDays, ...scope } = forecastSchema.parse(req.body);
    
    const forecast = await profitForecastEngine.generateForecast(
      forecastDays,
      Object.keys(scope).length > 0 ? scope : undefined
    );

    if (!forecast) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate forecast'
      });
    }

    res.json({
      success: true,
      data: forecast,
      message: `Profit forecast generated for ${forecastDays} days`
    });

  } catch (error) {
    console.error('❌ Error generating forecast:', error);
    res.status(500).json({ success: false, error: 'Failed to generate forecast' });
  }
});

// Get existing forecast
router.get('/forecast/:forecastId', async (req, res) => {
  try {
    const forecast = await profitForecastEngine.getForecast(req.params.forecastId);

    if (!forecast) {
      return res.status(404).json({
        success: false,
        error: 'Forecast not found'
      });
    }

    res.json({
      success: true,
      data: forecast
    });

  } catch (error) {
    console.error('❌ Error getting forecast:', error);
    res.status(500).json({ success: false, error: 'Failed to get forecast' });
  }
});

// Get recent forecasts
router.get('/forecasts', async (req, res) => {
  try {
    const { days = '30' } = req.query;
    
    const forecasts = await profitForecastEngine.getRecentForecasts(
      parseInt(days as string)
    );

    res.json({
      success: true,
      data: forecasts,
      total: forecasts.length
    });

  } catch (error) {
    console.error('❌ Error getting recent forecasts:', error);
    res.status(500).json({ success: false, error: 'Failed to get recent forecasts' });
  }
});

// Simulate scenario
router.post('/forecast/simulate', async (req, res) => {
  try {
    const scenarioSchema = z.object({
      partnerChanges: z.array(z.object({
        partnerId: z.number(),
        commissionRateChange: z.number()
      })).optional(),
      offerChanges: z.array(z.object({
        category: z.string(),
        volumeChange: z.number()
      })).optional(),
      marketConditions: z.enum(['growth', 'stable', 'decline']).optional(),
      timeFrame: z.number().min(1).max(365).default(90)
    });

    const scenarioParams = scenarioSchema.parse(req.body);
    
    const simulation = await profitForecastEngine.simulateScenario(scenarioParams);

    if (!simulation) {
      return res.status(500).json({
        success: false,
        error: 'Failed to simulate scenario'
      });
    }

    res.json({
      success: true,
      data: simulation,
      message: 'Scenario simulation completed'
    });

  } catch (error) {
    console.error('❌ Error simulating scenario:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
    res.status(500).json({ success: false, error: 'Failed to simulate scenario' });
  }
});

// ===========================================
// REPORTING & EXPORT
// ===========================================

// Export revenue split data
router.get('/export', async (req, res) => {
  try {
    const { startDate, endDate, format = 'json', partnerId } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    let whereClause = [
      gte(revenueSplitTransactions.transactionDate, start),
      lte(revenueSplitTransactions.transactionDate, end)
    ];

    if (partnerId) {
      whereClause.push(eq(revenueSplitTransactions.partnerId, parseInt(partnerId as string)));
    }

    const transactions = await db.select()
      .from(revenueSplitTransactions)
      .where(and(...whereClause))
      .orderBy(desc(revenueSplitTransactions.transactionDate));

    if (format === 'csv') {
      // Convert to CSV
      const csvHeaders = [
        'Transaction ID', 'Partner ID', 'Order ID', 'Date', 'Original Amount',
        'Commission Rate', 'Commission Amount', 'Net Payout', 'Status'
      ];
      
      const csvRows = transactions.map(t => [
        t.transactionId,
        t.partnerId,
        t.orderId || '',
        t.transactionDate?.toISOString().split('T')[0] || '',
        t.originalAmount,
        t.commissionRate,
        t.commissionAmount,
        t.netPayoutAmount,
        t.status
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      res.set({
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="revenue-splits-${startDate}-${endDate}.csv"`
      });
      res.send(csvContent);

    } else {
      res.json({
        success: true,
        data: {
          transactions,
          summary: {
            totalTransactions: transactions.length,
            totalRevenue: transactions.reduce((sum, t) => sum + parseFloat(t.originalAmount), 0),
            totalCommissions: transactions.reduce((sum, t) => sum + parseFloat(t.commissionAmount), 0),
            totalPayouts: transactions.reduce((sum, t) => sum + parseFloat(t.netPayoutAmount), 0)
          }
        }
      });
    }

  } catch (error) {
    console.error('❌ Error exporting data:', error);
    res.status(500).json({ success: false, error: 'Failed to export data' });
  }
});

export default router;