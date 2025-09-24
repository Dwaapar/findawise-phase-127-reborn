import { db } from "../../db";
import { offerComplianceRules, offerFeed } from "@shared/offerEngineTables";
import { eq, and, or } from "drizzle-orm";

export interface ComplianceRule {
  id: number;
  name: string;
  type: 'content' | 'merchant' | 'region' | 'price' | 'category';
  conditions: any;
  action: 'block' | 'flag' | 'require_disclosure' | 'modify';
  severity: 'low' | 'medium' | 'high' | 'critical';
  isActive: boolean;
}

export interface ComplianceCheck {
  isCompliant: boolean;
  violations: ComplianceViolation[];
  requiredDisclosures: string[];
  recommendedActions: string[];
}

export interface ComplianceViolation {
  ruleId: number;
  ruleName: string;
  severity: string;
  description: string;
  suggestedFix: string;
}

export class OfferComplianceEngine {
  
  // Check offer compliance against all active rules
  async checkOfferCompliance(offerId: number): Promise<ComplianceCheck> {
    const [offer] = await db.select().from(offerFeed).where(eq(offerFeed.id, offerId));
    
    if (!offer) {
      throw new Error(`Offer not found: ${offerId}`);
    }
    
    const activeRules = await db.select()
      .from(offerComplianceRules)
      .where(eq(offerComplianceRules.isActive, true));
    
    const violations: ComplianceViolation[] = [];
    const requiredDisclosures: string[] = [];
    const recommendedActions: string[] = [];
    
    for (const rule of activeRules) {
      const violation = await this.checkRuleCompliance(offer, rule);
      if (violation) {
        violations.push(violation);
        
        if (rule.action === 'require_disclosure') {
          requiredDisclosures.push(rule.metadata?.disclosure || 'Legal disclosure required');
        }
        
        if (rule.action === 'modify') {
          recommendedActions.push(rule.metadata?.recommendation || 'Modification required');
        }
      }
    }
    
    return {
      isCompliant: violations.filter(v => v.severity === 'critical' || v.severity === 'high').length === 0,
      violations,
      requiredDisclosures,
      recommendedActions
    };
  }
  
  // Check individual rule compliance
  private async checkRuleCompliance(offer: any, rule: any): Promise<ComplianceViolation | null> {
    try {
      let violates = false;
      let description = '';
      let suggestedFix = '';
      
      switch (rule.type) {
        case 'content':
          violates = this.checkContentCompliance(offer, rule);
          break;
        case 'merchant':
          violates = this.checkMerchantCompliance(offer, rule);
          break;
        case 'region':
          violates = this.checkRegionCompliance(offer, rule);
          break;
        case 'price':
          violates = this.checkPriceCompliance(offer, rule);
          break;
        case 'category':
          violates = this.checkCategoryCompliance(offer, rule);
          break;
      }
      
      if (violates) {
        return {
          ruleId: rule.id,
          ruleName: rule.name,
          severity: rule.severity,
          description: rule.description || `${rule.type} compliance violation`,
          suggestedFix: rule.metadata?.suggestedFix || 'Manual review required'
        };
      }
      
      return null;
      
    } catch (error) {
      console.error(`Compliance check error for rule ${rule.id}:`, error);
      return null;
    }
  }
  
  // Content compliance checks
  private checkContentCompliance(offer: any, rule: any): boolean {
    const conditions = rule.conditions;
    
    // Check for prohibited keywords
    if (conditions.prohibitedKeywords) {
      const title = offer.title?.toLowerCase() || '';
      const description = offer.description?.toLowerCase() || '';
      
      for (const keyword of conditions.prohibitedKeywords) {
        if (title.includes(keyword.toLowerCase()) || description.includes(keyword.toLowerCase())) {
          return true;
        }
      }
    }
    
    // Check for required disclaimers
    if (conditions.requiresDisclaimer) {
      const hasDisclaimer = offer.meta?.hasDisclaimer || false;
      if (!hasDisclaimer) {
        return true;
      }
    }
    
    // Check title length limits
    if (conditions.maxTitleLength && offer.title?.length > conditions.maxTitleLength) {
      return true;
    }
    
    return false;
  }
  
  // Merchant compliance checks
  private checkMerchantCompliance(offer: any, rule: any): boolean {
    const conditions = rule.conditions;
    
    // Check blacklisted merchants
    if (conditions.blacklistedMerchants) {
      return conditions.blacklistedMerchants.includes(offer.merchant?.toLowerCase());
    }
    
    // Check merchant requirements
    if (conditions.requiresMerchantVerification) {
      const isVerified = offer.meta?.merchantVerified || false;
      if (!isVerified) {
        return true;
      }
    }
    
    return false;
  }
  
  // Region compliance checks
  private checkRegionCompliance(offer: any, rule: any): boolean {
    const conditions = rule.conditions;
    
    // Check restricted regions
    if (conditions.restrictedRegions) {
      return conditions.restrictedRegions.includes(offer.region);
    }
    
    // Check region-specific requirements
    if (conditions.regionRequirements) {
      const requirements = conditions.regionRequirements[offer.region];
      if (requirements) {
        // Check if offer meets regional requirements
        if (requirements.requiresLocalCurrency && offer.currency !== requirements.localCurrency) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  // Price compliance checks
  private checkPriceCompliance(offer: any, rule: any): boolean {
    const conditions = rule.conditions;
    
    // Check minimum price thresholds
    if (conditions.minPrice && offer.price < conditions.minPrice) {
      return true;
    }
    
    // Check maximum discount percentages
    if (conditions.maxDiscountPercent && offer.oldPrice) {
      const discountPercent = ((offer.oldPrice - offer.price) / offer.oldPrice) * 100;
      if (discountPercent > conditions.maxDiscountPercent) {
        return true;
      }
    }
    
    // Check price comparison requirements
    if (conditions.requiresPriceComparison) {
      const hasPriceComparison = offer.meta?.priceComparisonAvailable || false;
      if (!hasPriceComparison) {
        return true;
      }
    }
    
    return false;
  }
  
  // Category compliance checks
  private checkCategoryCompliance(offer: any, rule: any): boolean {
    const conditions = rule.conditions;
    
    // Check prohibited categories
    if (conditions.prohibitedCategories) {
      return conditions.prohibitedCategories.includes(offer.category?.toLowerCase());
    }
    
    // Check category-specific requirements
    if (conditions.categoryRequirements) {
      const requirements = conditions.categoryRequirements[offer.category];
      if (requirements) {
        // Check age verification for certain categories
        if (requirements.requiresAgeVerification) {
          const hasAgeVerification = offer.meta?.ageVerified || false;
          if (!hasAgeVerification) {
            return true;
          }
        }
      }
    }
    
    return false;
  }
  
  // Auto-fix compliance violations where possible
  async autoFixCompliance(offerId: number): Promise<{ fixed: boolean; changes: any }> {
    const complianceCheck = await this.checkOfferCompliance(offerId);
    const changes: any = {};
    let fixed = false;
    
    for (const violation of complianceCheck.violations) {
      const rule = await db.select()
        .from(offerComplianceRules)
        .where(eq(offerComplianceRules.id, violation.ruleId));
      
      if (rule[0]?.action === 'modify') {
        // Apply automatic fixes based on rule type
        const autoFix = await this.applyAutoFix(offerId, rule[0], violation);
        if (autoFix) {
          Object.assign(changes, autoFix);
          fixed = true;
        }
      }
    }
    
    if (fixed) {
      await db.update(offerFeed)
        .set({ ...changes, updatedAt: new Date() })
        .where(eq(offerFeed.id, offerId));
    }
    
    return { fixed, changes };
  }
  
  // Apply specific auto-fixes
  private async applyAutoFix(offerId: number, rule: any, violation: ComplianceViolation): Promise<any> {
    const fixes: any = {};
    
    switch (rule.type) {
      case 'content':
        if (rule.conditions.maxTitleLength) {
          const [offer] = await db.select().from(offerFeed).where(eq(offerFeed.id, offerId));
          if (offer?.title && offer.title.length > rule.conditions.maxTitleLength) {
            fixes.title = offer.title.substring(0, rule.conditions.maxTitleLength - 3) + '...';
          }
        }
        break;
        
      case 'price':
        if (rule.conditions.maxDiscountPercent) {
          const [offer] = await db.select().from(offerFeed).where(eq(offerFeed.id, offerId));
          if (offer?.oldPrice && offer.price) {
            const maxDiscount = rule.conditions.maxDiscountPercent / 100;
            const minPrice = offer.oldPrice * (1 - maxDiscount);
            if (offer.price < minPrice) {
              fixes.price = minPrice;
            }
          }
        }
        break;
    }
    
    return Object.keys(fixes).length > 0 ? fixes : null;
  }
  
  // Get compliance statistics
  async getComplianceStats(): Promise<any> {
    const totalOffers = await db.select().from(offerFeed).where(eq(offerFeed.isActive, true));
    const totalRules = await db.select().from(offerComplianceRules).where(eq(offerComplianceRules.isActive, true));
    
    let compliantOffers = 0;
    let violationsCount = 0;
    
    for (const offer of totalOffers) {
      const check = await this.checkOfferCompliance(offer.id);
      if (check.isCompliant) {
        compliantOffers++;
      }
      violationsCount += check.violations.length;
    }
    
    return {
      totalOffers: totalOffers.length,
      compliantOffers,
      complianceRate: totalOffers.length > 0 ? ((compliantOffers / totalOffers.length) * 100).toFixed(1) : 100,
      totalRules: totalRules.length,
      totalViolations: violationsCount,
      autoFixableViolations: Math.floor(violationsCount * 0.3) // Estimated 30% auto-fixable
    };
  }
  
  // Initialize default compliance rules
  async initializeDefaultRules(): Promise<void> {
    const defaultRules = [
      {
        name: "Amazon TOS Compliance",
        type: "merchant",
        description: "Ensures compliance with Amazon affiliate program terms",
        conditions: {
          requiresMerchantVerification: true,
          blacklistedKeywords: ["guaranteed", "miracle", "secret"]
        },
        action: "require_disclosure",
        severity: "high",
        isActive: true,
        metadata: {
          disclosure: "As an Amazon Associate, we earn from qualifying purchases."
        }
      },
      {
        name: "FTC Disclosure Requirements",
        type: "content",
        description: "FTC-compliant affiliate disclosures",
        conditions: {
          requiresDisclaimer: true
        },
        action: "require_disclosure",
        severity: "critical",
        isActive: true,
        metadata: {
          disclosure: "This post contains affiliate links."
        }
      },
      {
        name: "Price Accuracy Standards",
        type: "price",
        description: "Prevents unrealistic pricing claims",
        conditions: {
          maxDiscountPercent: 90
        },
        action: "modify",
        severity: "medium",
        isActive: true,
        metadata: {
          suggestedFix: "Reduce discount percentage to comply with standards"
        }
      }
    ];
    
    for (const rule of defaultRules) {
      await db.insert(offerComplianceRules).values(rule).onConflictDoNothing();
    }
    
    console.log(`✅ Initialized ${defaultRules.length} default compliance rules`);
  }
}

// Export singleton instance
export const offerComplianceEngine = new OfferComplianceEngine();