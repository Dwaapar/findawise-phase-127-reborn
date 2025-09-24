import { DatabaseStorage } from "../../storage";
import { 
  revenueSplitPartners, 
  revenueSplitRules, 
  revenueSplitTransactions, 
  revenueSplitPayouts,
  revenueSplitAnalytics,
  type InsertRevenueSplitPartner,
  type InsertRevenueSplitRule,
  type InsertRevenueSplitTransaction,
  type InsertRevenueSplitPayout,
  type RevenueSplitPartner,
  type RevenueSplitRule,
  type RevenueSplitTransaction
} from "../../../shared/revenueSplitTables";
import { and, eq, gte, lte, desc, sum, count, avg } from "drizzle-orm";
import { db } from "../../db";

export interface SplitCalculationResult {
  partnerId: number;
  ruleId?: number;
  originalAmount: number;
  commissionRate: number;
  commissionAmount: number;
  bonusAmount: number;
  totalSplitAmount: number;
  processingFees: number;
  platformFees: number;
  netPayoutAmount: number;
  appliedRule?: RevenueSplitRule;
}

export interface PayoutBatch {
  batchId: string;
  partnerId: number;
  period: { start: Date; end: Date };
  totalTransactions: number;
  grossAmount: number;
  deductions: number;
  netPayoutAmount: number;
  paymentMethod: string;
  status: string;
}

export interface RevenueAnalytics {
  period: { start: Date; end: Date };
  totalRevenue: number;
  totalCommissions: number;
  totalPayouts: number;
  netProfit: number;
  transactionCount: number;
  uniquePartners: number;
  averageCommissionRate: number;
  averageOrderValue: number;
  topPartners: Array<{ partnerId: number; partnerName: string; earnings: number; }>;
  topProducts: Array<{ productId: number; productName: string; revenue: number; }>;
  growth: {
    revenueGrowth: number;
    commissionGrowth: number;
    partnerGrowth: number;
  };
}

export class RevenueSplitManager {
  private storage: DatabaseStorage;

  constructor(storage: DatabaseStorage) {
    this.storage = storage;
  }

  /**
   * Process revenue split for a transaction (integrates with existing affiliate system)
   */
  async processRevenueSplit(transactionData: {
    orderId: string;
    affiliateCode?: string;
    clickId?: string;
    originalAmount: number;
    currency?: string;
    vertical?: string;
    productCategory?: string;
    productId?: number;
    productName?: string;
    customerSegment?: string;
    customerCountry?: string;
    isNewCustomer?: boolean;
  }): Promise<SplitCalculationResult[]> {
    const results: SplitCalculationResult[] = [];

    try {
      // Find applicable partners based on affiliate code or other criteria
      const partners = await this.findApplicablePartners(transactionData);

      for (const partner of partners) {
        // Find the best matching rule for this partner/transaction
        const rule = await this.findBestMatchingRule(partner.id, transactionData);
        
        // Calculate the split
        const splitResult = await this.calculateSplit(partner, rule, transactionData);
        
        // Store the transaction record
        await this.recordSplitTransaction({
          transactionId: `split_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          orderId: transactionData.orderId,
          clickId: transactionData.clickId,
          affiliateCode: transactionData.affiliateCode,
          partnerId: partner.id,
          ruleId: rule?.id,
          originalAmount: transactionData.originalAmount.toString(),
          currency: transactionData.currency || 'USD',
          commissionRate: splitResult.commissionRate.toString(),
          commissionAmount: splitResult.commissionAmount.toString(),
          bonusAmount: splitResult.bonusAmount.toString(),
          totalSplitAmount: splitResult.totalSplitAmount.toString(),
          processingFees: splitResult.processingFees.toString(),
          platformFees: splitResult.platformFees.toString(),
          netPayoutAmount: splitResult.netPayoutAmount.toString(),
          vertical: transactionData.vertical,
          productCategory: transactionData.productCategory,
          productId: transactionData.productId,
          productName: transactionData.productName,
          customerSegment: transactionData.customerSegment,
          customerCountry: transactionData.customerCountry,
          isNewCustomer: transactionData.isNewCustomer,
          status: 'pending',
          auditTrail: JSON.stringify({
            processedAt: new Date().toISOString(),
            ruleApplied: rule?.ruleName || 'default',
            calculationMethod: rule?.splitType || 'default'
          })
        });

        results.push(splitResult);
      }

      console.log(`💰 Processed revenue split for ${transactionData.orderId}: ${results.length} partners`);
      return results;

    } catch (error) {
      console.error('❌ Error processing revenue split:', error);
      throw error;
    }
  }

  /**
   * Find applicable partners for a transaction
   */
  private async findApplicablePartners(transactionData: any): Promise<RevenueSplitPartner[]> {
    try {
      let partners: RevenueSplitPartner[] = [];

      // If affiliate code is provided, find the specific partner first
      if (transactionData.affiliateCode) {
        // Try to find existing affiliate partner by code
        const existingPartners = await db.select()
          .from(revenueSplitPartners)
          .where(and(
            eq(revenueSplitPartners.partnerId, transactionData.affiliateCode),
            eq(revenueSplitPartners.status, 'active')
          ));

        if (existingPartners.length > 0) {
          partners.push(...existingPartners);
        } else {
          // Create new partner from affiliate system if not exists
          const newPartner = await this.createPartnerFromAffiliateCode(transactionData.affiliateCode);
          if (newPartner) partners.push(newPartner);
        }
      }

      // Find partners assigned to this vertical/category
      if (transactionData.vertical || transactionData.productCategory) {
        const verticalPartners = await db.select()
          .from(revenueSplitPartners)
          .where(and(
            eq(revenueSplitPartners.status, 'active'),
            // Check if vertical is in verticalAssignments array
          ));

        // Filter partners that match vertical assignments
        for (const partner of verticalPartners) {
          if (partner.verticalAssignments && 
              (partner.verticalAssignments.includes(transactionData.vertical) ||
               partner.verticalAssignments.includes('all'))) {
            if (!partners.find(p => p.id === partner.id)) {
              partners.push(partner);
            }
          }
        }
      }

      return partners;

    } catch (error) {
      console.error('❌ Error finding applicable partners:', error);
      return [];
    }
  }

  /**
   * Create a new partner from existing affiliate system data
   */
  private async createPartnerFromAffiliateCode(affiliateCode: string): Promise<RevenueSplitPartner | null> {
    try {
      // Get affiliate data from existing affiliate system
      const affiliatePartners = await this.storage.getAffiliatePartners();
      const affiliate = affiliatePartners.find(p => p.code === affiliateCode);

      if (!affiliate) return null;

      // Create new revenue split partner
      const newPartner = await db.insert(revenueSplitPartners).values({
        partnerId: affiliateCode,
        partnerName: affiliate.name,
        partnerType: 'affiliate',
        contactEmail: affiliate.email || 'unknown@example.com',
        defaultCommissionRate: affiliate.commissionRate || '10.00',
        splitType: 'percentage',
        minimumPayout: '50.00',
        payoutFrequency: 'monthly',
        paymentMethod: 'bank_transfer',
        currency: 'USD',
        verticalAssignments: ['all'], // Assign to all verticals by default
        status: 'active',
        metadata: JSON.stringify({
          migratedFromAffiliate: true,
          originalAffiliateId: affiliate.id,
          migratedAt: new Date().toISOString()
        })
      }).returning();

      console.log(`✅ Created new revenue split partner from affiliate: ${affiliate.name}`);
      return newPartner[0];

    } catch (error) {
      console.error('❌ Error creating partner from affiliate code:', error);
      return null;
    }
  }

  /**
   * Find the best matching rule for a partner and transaction
   */
  private async findBestMatchingRule(partnerId: number, transactionData: any): Promise<RevenueSplitRule | null> {
    try {
      const rules = await db.select()
        .from(revenueSplitRules)
        .where(and(
          eq(revenueSplitRules.partnerId, partnerId),
          eq(revenueSplitRules.isActive, true)
        ))
        .orderBy(desc(revenueSplitRules.priority));

      // Find the first rule that matches all conditions
      for (const rule of rules) {
        let matches = true;

        // Check vertical match
        if (rule.vertical && rule.vertical !== transactionData.vertical) {
          matches = false;
        }

        // Check product category match
        if (rule.productCategory && rule.productCategory !== transactionData.productCategory) {
          matches = false;
        }

        // Check minimum order value
        if (rule.minimumOrderValue && 
            parseFloat(rule.minimumOrderValue) > transactionData.originalAmount) {
          matches = false;
        }

        // Check maximum order value
        if (rule.maximumOrderValue && 
            parseFloat(rule.maximumOrderValue) < transactionData.originalAmount) {
          matches = false;
        }

        // Check country eligibility
        if (rule.eligibleCountries && rule.eligibleCountries.length > 0 &&
            !rule.eligibleCountries.includes(transactionData.customerCountry)) {
          matches = false;
        }

        // Check effective/expiration dates
        const now = new Date();
        if (rule.effectiveDate && new Date(rule.effectiveDate) > now) {
          matches = false;
        }
        if (rule.expirationDate && new Date(rule.expirationDate) < now) {
          matches = false;
        }

        if (matches) {
          return rule;
        }
      }

      return null;

    } catch (error) {
      console.error('❌ Error finding matching rule:', error);
      return null;
    }
  }

  /**
   * Calculate split amount based on partner and rule
   */
  private async calculateSplit(
    partner: RevenueSplitPartner, 
    rule: RevenueSplitRule | null, 
    transactionData: any
  ): Promise<SplitCalculationResult> {
    const originalAmount = transactionData.originalAmount;
    let commissionRate = 0;
    let commissionAmount = 0;
    let bonusAmount = 0;

    try {
      if (rule && rule.commissionStructure) {
        const structure = rule.commissionStructure as any;

        switch (rule.splitType) {
          case 'flat':
            commissionAmount = parseFloat(structure.amount || '0');
            commissionRate = (commissionAmount / originalAmount) * 100;
            break;

          case 'percentage':
            commissionRate = parseFloat(structure.rate || partner.defaultCommissionRate || '10');
            commissionAmount = (originalAmount * commissionRate) / 100;
            break;

          case 'tiered':
            const tiers = structure.tiers || [];
            for (const tier of tiers) {
              if (originalAmount >= tier.min && (tier.max === undefined || originalAmount <= tier.max)) {
                if (tier.type === 'percentage') {
                  commissionRate = tier.rate;
                  commissionAmount = (originalAmount * tier.rate) / 100;
                } else {
                  commissionAmount = tier.rate;
                  commissionRate = (tier.rate / originalAmount) * 100;
                }
                break;
              }
            }
            break;

          case 'custom':
            // Handle custom split logic
            commissionRate = parseFloat(structure.customRate || partner.defaultCommissionRate || '10');
            commissionAmount = (originalAmount * commissionRate) / 100;
            break;

          default:
            commissionRate = parseFloat(partner.defaultCommissionRate || '10');
            commissionAmount = (originalAmount * commissionRate) / 100;
        }

        // Calculate performance bonuses
        if (rule.performanceBonuses) {
          const bonuses = rule.performanceBonuses as any;
          // Implement bonus logic based on performance metrics
          bonusAmount = this.calculatePerformanceBonus(bonuses, partner, transactionData);
        }

      } else {
        // Use default partner commission rate
        commissionRate = parseFloat(partner.defaultCommissionRate || '10');
        commissionAmount = (originalAmount * commissionRate) / 100;
      }

      // Calculate fees
      const processingFees = commissionAmount * 0.029; // 2.9% processing fee
      const platformFees = commissionAmount * 0.02; // 2% platform fee
      
      const totalSplitAmount = commissionAmount + bonusAmount;
      const netPayoutAmount = totalSplitAmount - processingFees - platformFees;

      return {
        partnerId: partner.id,
        ruleId: rule?.id,
        originalAmount,
        commissionRate,
        commissionAmount,
        bonusAmount,
        totalSplitAmount,
        processingFees,
        platformFees,
        netPayoutAmount,
        appliedRule: rule || undefined
      };

    } catch (error) {
      console.error('❌ Error calculating split:', error);
      // Return default calculation
      const defaultRate = parseFloat(partner.defaultCommissionRate || '10');
      const defaultAmount = (originalAmount * defaultRate) / 100;
      const defaultFees = defaultAmount * 0.029;
      const defaultPlatformFees = defaultAmount * 0.02;

      return {
        partnerId: partner.id,
        ruleId: rule?.id,
        originalAmount,
        commissionRate: defaultRate,
        commissionAmount: defaultAmount,
        bonusAmount: 0,
        totalSplitAmount: defaultAmount,
        processingFees: defaultFees,
        platformFees: defaultPlatformFees,
        netPayoutAmount: defaultAmount - defaultFees - defaultPlatformFees,
        appliedRule: rule || undefined
      };
    }
  }

  /**
   * Calculate performance bonuses
   */
  private calculatePerformanceBonus(bonuses: any, partner: RevenueSplitPartner, transactionData: any): number {
    let bonusAmount = 0;

    try {
      // Volume bonus
      if (bonuses.volumeBonus) {
        const monthlyVolume = parseFloat(partner.lifetimeRevenue || '0');
        const volumeTiers = bonuses.volumeBonus.tiers || [];
        
        for (const tier of volumeTiers) {
          if (monthlyVolume >= tier.minVolume) {
            bonusAmount += (transactionData.originalAmount * tier.bonusRate) / 100;
          }
        }
      }

      // New customer bonus
      if (bonuses.newCustomerBonus && transactionData.isNewCustomer) {
        bonusAmount += bonuses.newCustomerBonus.amount || 0;
      }

      // Conversion rate bonus
      if (bonuses.conversionBonus) {
        const conversionRate = parseFloat(partner.averageConversionRate?.toString() || '0');
        if (conversionRate >= bonuses.conversionBonus.minRate) {
          bonusAmount += bonuses.conversionBonus.amount || 0;
        }
      }

    } catch (error) {
      console.error('❌ Error calculating performance bonus:', error);
    }

    return bonusAmount;
  }

  /**
   * Record split transaction in database
   */
  private async recordSplitTransaction(transactionData: InsertRevenueSplitTransaction): Promise<void> {
    try {
      await db.insert(revenueSplitTransactions).values(transactionData);
      
      // Update partner totals
      await this.updatePartnerTotals(transactionData.partnerId, {
        totalEarnings: parseFloat(transactionData.totalSplitAmount),
        pendingPayouts: parseFloat(transactionData.netPayoutAmount),
        lifetimeRevenue: parseFloat(transactionData.originalAmount)
      });

    } catch (error) {
      console.error('❌ Error recording split transaction:', error);
      throw error;
    }
  }

  /**
   * Update partner running totals
   */
  private async updatePartnerTotals(partnerId: number, amounts: {
    totalEarnings: number;
    pendingPayouts: number;
    lifetimeRevenue: number;
  }): Promise<void> {
    try {
      const partner = await db.select()
        .from(revenueSplitPartners)
        .where(eq(revenueSplitPartners.id, partnerId))
        .limit(1);

      if (partner.length === 0) return;

      const currentPartner = partner[0];
      
      await db.update(revenueSplitPartners)
        .set({
          totalEarnings: (parseFloat(currentPartner.totalEarnings || '0') + amounts.totalEarnings).toString(),
          pendingPayouts: (parseFloat(currentPartner.pendingPayouts || '0') + amounts.pendingPayouts).toString(),
          lifetimeRevenue: (parseFloat(currentPartner.lifetimeRevenue || '0') + amounts.lifetimeRevenue).toString(),
          updatedAt: new Date()
        })
        .where(eq(revenueSplitPartners.id, partnerId));

    } catch (error) {
      console.error('❌ Error updating partner totals:', error);
    }
  }

  /**
   * Generate payout batch for a partner
   */
  async generatePayoutBatch(
    partnerId: number, 
    period: { start: Date; end: Date }
  ): Promise<PayoutBatch | null> {
    try {
      // Get all pending transactions for this partner in the period
      const transactions = await db.select()
        .from(revenueSplitTransactions)
        .where(and(
          eq(revenueSplitTransactions.partnerId, partnerId),
          eq(revenueSplitTransactions.status, 'pending'),
          gte(revenueSplitTransactions.transactionDate, period.start),
          lte(revenueSplitTransactions.transactionDate, period.end)
        ));

      if (transactions.length === 0) return null;

      const partner = await db.select()
        .from(revenueSplitPartners)
        .where(eq(revenueSplitPartners.id, partnerId))
        .limit(1);

      if (partner.length === 0) return null;

      const partnerData = partner[0];

      // Calculate totals
      const grossAmount = transactions.reduce((sum, t) => sum + parseFloat(t.totalSplitAmount), 0);
      const deductions = transactions.reduce((sum, t) => sum + parseFloat(t.processingFees) + parseFloat(t.platformFees), 0);
      const netPayoutAmount = transactions.reduce((sum, t) => sum + parseFloat(t.netPayoutAmount), 0);

      // Check minimum payout threshold
      if (netPayoutAmount < parseFloat(partnerData.minimumPayout || '50')) {
        console.log(`⏸️ Payout amount ${netPayoutAmount} below minimum threshold for partner ${partnerData.partnerName}`);
        return null;
      }

      const batchId = `batch_${Date.now()}_${partnerId}`;
      const payoutId = `payout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create payout record
      const payoutData: InsertRevenueSplitPayout = {
        payoutId,
        batchId,
        partnerId,
        partnerName: partnerData.partnerName,
        payoutPeriod: JSON.stringify({ start: period.start, end: period.end }),
        totalTransactions: transactions.length,
        grossAmount: grossAmount.toString(),
        deductions: deductions.toString(),
        netPayoutAmount: netPayoutAmount.toString(),
        currency: partnerData.currency || 'USD',
        paymentMethod: partnerData.paymentMethod || 'bank_transfer',
        paymentDetails: partnerData.paymentDetails,
        status: partnerData.requiresApproval ? 'pending' : 'processing',
        scheduledAt: new Date(),
        metadata: JSON.stringify({
          transactionIds: transactions.map(t => t.id),
          generatedAt: new Date().toISOString()
        })
      };

      await db.insert(revenueSplitPayouts).values(payoutData);

      // Update transaction statuses
      const transactionIds = transactions.map(t => t.id);
      for (const txId of transactionIds) {
        await db.update(revenueSplitTransactions)
          .set({ 
            status: 'approved',
            payoutBatchId: batchId,
            approvedAt: new Date()
          })
          .where(eq(revenueSplitTransactions.id, txId));
      }

      console.log(`💰 Generated payout batch ${batchId} for ${partnerData.partnerName}: $${netPayoutAmount.toFixed(2)}`);

      return {
        batchId,
        partnerId,
        period,
        totalTransactions: transactions.length,
        grossAmount,
        deductions,
        netPayoutAmount,
        paymentMethod: partnerData.paymentMethod || 'bank_transfer',
        status: payoutData.status || 'pending'
      };

    } catch (error) {
      console.error('❌ Error generating payout batch:', error);
      return null;
    }
  }

  /**
   * Process automatic payouts for all eligible partners
   */
  async processAutomaticPayouts(): Promise<{ processed: number; skipped: number; errors: number; }> {
    const results = { processed: 0, skipped: 0, errors: 0 };

    try {
      // Get all partners eligible for auto payouts
      const partners = await db.select()
        .from(revenueSplitPartners)
        .where(and(
          eq(revenueSplitPartners.status, 'active'),
          eq(revenueSplitPartners.autoPayouts, true)
        ));

      const now = new Date();
      
      for (const partner of partners) {
        try {
          // Determine payout period based on frequency
          let periodStart = new Date();
          
          switch (partner.payoutFrequency) {
            case 'weekly':
              periodStart.setDate(now.getDate() - 7);
              break;
            case 'monthly':
              periodStart.setMonth(now.getMonth() - 1);
              break;
            case 'quarterly':
              periodStart.setMonth(now.getMonth() - 3);
              break;
            default:
              periodStart.setMonth(now.getMonth() - 1); // Default to monthly
          }

          const batch = await this.generatePayoutBatch(partner.id, {
            start: periodStart,
            end: now
          });

          if (batch) {
            results.processed++;
            console.log(`✅ Processed automatic payout for ${partner.partnerName}`);
          } else {
            results.skipped++;
          }

        } catch (error) {
          console.error(`❌ Error processing payout for ${partner.partnerName}:`, error);
          results.errors++;
        }
      }

      console.log(`💰 Automatic payout processing complete: ${results.processed} processed, ${results.skipped} skipped, ${results.errors} errors`);
      return results;

    } catch (error) {
      console.error('❌ Error in automatic payout processing:', error);
      return results;
    }
  }

  /**
   * Get revenue analytics for a period
   */
  async getRevenueAnalytics(
    period: { start: Date; end: Date },
    filters?: {
      partnerId?: number;
      vertical?: string;
      productCategory?: string;
    }
  ): Promise<RevenueAnalytics> {
    try {
      const whereClause = [
        gte(revenueSplitTransactions.transactionDate, period.start),
        lte(revenueSplitTransactions.transactionDate, period.end)
      ];

      if (filters?.partnerId) {
        whereClause.push(eq(revenueSplitTransactions.partnerId, filters.partnerId));
      }
      if (filters?.vertical) {
        whereClause.push(eq(revenueSplitTransactions.vertical, filters.vertical));
      }
      if (filters?.productCategory) {
        whereClause.push(eq(revenueSplitTransactions.productCategory, filters.productCategory));
      }

      // Get aggregated metrics
      const [metrics] = await db.select({
        totalRevenue: sum(revenueSplitTransactions.originalAmount),
        totalCommissions: sum(revenueSplitTransactions.commissionAmount),
        totalPayouts: sum(revenueSplitTransactions.netPayoutAmount),
        transactionCount: count(revenueSplitTransactions.id),
        uniquePartners: count(revenueSplitTransactions.partnerId), // Note: This might count duplicates
        averageCommissionRate: avg(revenueSplitTransactions.commissionRate),
        averageOrderValue: avg(revenueSplitTransactions.originalAmount)
      })
      .from(revenueSplitTransactions)
      .where(and(...whereClause));

      const totalRevenue = parseFloat(metrics.totalRevenue || '0');
      const totalCommissions = parseFloat(metrics.totalCommissions || '0');
      const totalPayouts = parseFloat(metrics.totalPayouts || '0');
      const netProfit = totalRevenue - totalCommissions;

      // Get top partners
      const topPartners = await db.select({
        partnerId: revenueSplitTransactions.partnerId,
        earnings: sum(revenueSplitTransactions.totalSplitAmount)
      })
      .from(revenueSplitTransactions)
      .where(and(...whereClause))
      .groupBy(revenueSplitTransactions.partnerId)
      .orderBy(desc(sum(revenueSplitTransactions.totalSplitAmount)))
      .limit(10);

      // Get partner names
      const topPartnersWithNames = await Promise.all(
        topPartners.map(async (tp) => {
          const partner = await db.select({ partnerName: revenueSplitPartners.partnerName })
            .from(revenueSplitPartners)
            .where(eq(revenueSplitPartners.id, tp.partnerId))
            .limit(1);
          
          return {
            partnerId: tp.partnerId,
            partnerName: partner[0]?.partnerName || 'Unknown',
            earnings: parseFloat(tp.earnings || '0')
          };
        })
      );

      // Get top products
      const topProducts = await db.select({
        productId: revenueSplitTransactions.productId,
        productName: revenueSplitTransactions.productName,
        revenue: sum(revenueSplitTransactions.originalAmount)
      })
      .from(revenueSplitTransactions)
      .where(and(...whereClause, eq(revenueSplitTransactions.productId, revenueSplitTransactions.productId)))
      .groupBy(revenueSplitTransactions.productId, revenueSplitTransactions.productName)
      .orderBy(desc(sum(revenueSplitTransactions.originalAmount)))
      .limit(10);

      const topProductsFormatted = topProducts.map(tp => ({
        productId: tp.productId || 0,
        productName: tp.productName || 'Unknown',
        revenue: parseFloat(tp.revenue || '0')
      }));

      // Calculate growth (simplified - would need previous period data for accurate calculation)
      const growth = {
        revenueGrowth: 0,
        commissionGrowth: 0,
        partnerGrowth: 0
      };

      return {
        period,
        totalRevenue,
        totalCommissions,
        totalPayouts,
        netProfit,
        transactionCount: parseInt(metrics.transactionCount?.toString() || '0'),
        uniquePartners: parseInt(metrics.uniquePartners?.toString() || '0'),
        averageCommissionRate: parseFloat(metrics.averageCommissionRate?.toString() || '0'),
        averageOrderValue: parseFloat(metrics.averageOrderValue?.toString() || '0'),
        topPartners: topPartnersWithNames,
        topProducts: topProductsFormatted,
        growth
      };

    } catch (error) {
      console.error('❌ Error getting revenue analytics:', error);
      throw error;
    }
  }
}