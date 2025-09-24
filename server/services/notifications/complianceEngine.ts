import { db } from "../../db";
import { 
  userNotificationPreferences,
  notificationQueue,
  notificationAnalytics
} from "@shared/notificationTables";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { logger } from "../../utils/logger";

export interface ComplianceRule {
  name: string;
  description: string;
  regulation: 'GDPR' | 'CAN_SPAM' | 'CCPA' | 'CASL' | 'PECR' | 'LGPD';
  isActive: boolean;
  validator: (data: any) => Promise<ComplianceResult>;
}

export interface ComplianceResult {
  isCompliant: boolean;
  violations: string[];
  recommendations: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface OptOutRequest {
  userId: string;
  email?: string;
  phone?: string;
  reason?: string;
  channels: string[];
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface ConsentRecord {
  userId: string;
  consentType: string;
  granted: boolean;
  timestamp: Date;
  source: string;
  ipAddress?: string;
  evidence: Record<string, any>;
}

class ComplianceEngine {
  private complianceRules: ComplianceRule[] = [];
  private consentRecords: Map<string, ConsentRecord[]> = new Map();
  private optOutRequests: Map<string, OptOutRequest[]> = new Map();

  constructor() {
    this.initializeComplianceRules();
  }

  /**
   * Initialize compliance rules for different regulations
   */
  private initializeComplianceRules() {
    // GDPR Compliance Rules
    this.complianceRules.push({
      name: 'GDPR Article 7 - Consent',
      description: 'Ensure explicit consent is obtained and documented',
      regulation: 'GDPR',
      isActive: true,
      validator: async (data) => {
        const violations = [];
        const recommendations = [];
        
        if (!data.consent || !data.consent.explicit) {
          violations.push('No explicit consent documented');
          recommendations.push('Obtain and store explicit consent before sending');
        }
        
        if (!data.consent?.timestamp) {
          violations.push('Consent timestamp missing');
          recommendations.push('Record timestamp when consent was given');
        }

        if (!data.consent?.source) {
          violations.push('Consent source not documented');
          recommendations.push('Document where and how consent was obtained');
        }

        return {
          isCompliant: violations.length === 0,
          violations,
          recommendations,
          severity: violations.length > 0 ? 'high' : 'low'
        };
      }
    });

    this.complianceRules.push({
      name: 'GDPR Article 21 - Right to Object',
      description: 'Honor user objections to processing',
      regulation: 'GDPR',
      isActive: true,
      validator: async (data) => {
        const violations = [];
        const recommendations = [];
        
        // Check if user has opted out
        const optOuts = this.optOutRequests.get(data.userId) || [];
        const hasOptedOut = optOuts.some(opt => 
          opt.channels.includes(data.channel) || opt.channels.includes('all')
        );

        if (hasOptedOut) {
          violations.push('User has objected to this type of processing');
          recommendations.push('Respect user opt-out preferences');
        }

        return {
          isCompliant: violations.length === 0,
          violations,
          recommendations,
          severity: violations.length > 0 ? 'critical' : 'low'
        };
      }
    });

    // CAN-SPAM Compliance Rules
    this.complianceRules.push({
      name: 'CAN-SPAM Act - Sender Identification',
      description: 'Email must clearly identify the sender',
      regulation: 'CAN_SPAM',
      isActive: true,
      validator: async (data) => {
        const violations = [];
        const recommendations = [];
        
        if (data.channel === 'email') {
          if (!data.fromName || !data.fromEmail) {
            violations.push('Sender information missing');
            recommendations.push('Include clear sender name and email address');
          }

          if (!data.physicalAddress) {
            violations.push('Physical address missing');
            recommendations.push('Include valid physical postal address');
          }

          if (!data.unsubscribeLink) {
            violations.push('Unsubscribe mechanism missing');
            recommendations.push('Include clear and conspicuous unsubscribe link');
          }
        }

        return {
          isCompliant: violations.length === 0,
          violations,
          recommendations,
          severity: violations.length > 0 ? 'high' : 'low'
        };
      }
    });

    this.complianceRules.push({
      name: 'CAN-SPAM Act - Truthful Subject Lines',
      description: 'Subject line must accurately reflect email content',
      regulation: 'CAN_SPAM',
      isActive: true,
      validator: async (data) => {
        const violations = [];
        const recommendations = [];
        
        if (data.channel === 'email') {
          // Check for deceptive subject line patterns
          const deceptivePatterns = [
            /^re:\s/i, // Fake reply
            /^fwd:\s/i, // Fake forward
            /urgent.*action.*required/i,
            /suspended.*account/i,
            /verify.*account.*immediately/i
          ];

          const hasDeceptivePattern = deceptivePatterns.some(pattern => 
            pattern.test(data.subject || '')
          );

          if (hasDeceptivePattern) {
            violations.push('Subject line appears deceptive');
            recommendations.push('Use clear, honest subject lines that reflect email content');
          }

          if (!data.subject || data.subject.trim() === '') {
            violations.push('Subject line is missing');
            recommendations.push('Include descriptive subject line');
          }
        }

        return {
          isCompliant: violations.length === 0,
          violations,
          recommendations,
          severity: violations.length > 0 ? 'medium' : 'low'
        };
      }
    });

    // CASL (Canada) Compliance Rules
    this.complianceRules.push({
      name: 'CASL - Express Consent',
      description: 'Canadian Anti-Spam Legislation consent requirements',
      regulation: 'CASL',
      isActive: true,
      validator: async (data) => {
        const violations = [];
        const recommendations = [];
        
        // Check for Canadian recipients
        if (data.recipientCountry === 'CA' || data.recipientRegion === 'Canada') {
          if (!data.consent?.express) {
            violations.push('Express consent required for Canadian recipients');
            recommendations.push('Obtain express consent before sending to Canadian addresses');
          }

          if (!data.identifyInfo?.organization) {
            violations.push('Organization identification missing');
            recommendations.push('Clearly identify your organization');
          }

          if (!data.contactInfo?.email && !data.contactInfo?.phone) {
            violations.push('Contact information missing');
            recommendations.push('Provide valid contact information');
          }
        }

        return {
          isCompliant: violations.length === 0,
          violations,
          recommendations,
          severity: violations.length > 0 ? 'high' : 'low'
        };
      }
    });

    logger.info('Compliance rules initialized', {
      component: 'ComplianceEngine',
      ruleCount: this.complianceRules.length
    });
  }

  /**
   * Validate notification compliance before sending
   */
  async validateCompliance(notificationData: any): Promise<ComplianceResult> {
    try {
      const allViolations: string[] = [];
      const allRecommendations: string[] = [];
      let maxSeverity: 'low' | 'medium' | 'high' | 'critical' = 'low';

      // Run all applicable compliance rules
      for (const rule of this.complianceRules) {
        if (!rule.isActive) continue;

        const result = await rule.validator(notificationData);
        
        if (!result.isCompliant) {
          allViolations.push(...result.violations.map(v => `${rule.regulation}: ${v}`));
          allRecommendations.push(...result.recommendations);

          // Update max severity
          if (this.getSeverityLevel(result.severity) > this.getSeverityLevel(maxSeverity)) {
            maxSeverity = result.severity;
          }
        }
      }

      const complianceResult: ComplianceResult = {
        isCompliant: allViolations.length === 0,
        violations: allViolations,
        recommendations: allRecommendations,
        severity: maxSeverity
      };

      // Log compliance check
      logger.info('Compliance validation completed', {
        component: 'ComplianceEngine',
        isCompliant: complianceResult.isCompliant,
        violationCount: allViolations.length,
        severity: maxSeverity,
        userId: notificationData.userId
      });

      return complianceResult;
    } catch (error) {
      logger.error('Compliance validation failed', { error });
      return {
        isCompliant: false,
        violations: ['Compliance validation system error'],
        recommendations: ['Contact system administrator'],
        severity: 'critical'
      };
    }
  }

  /**
   * Record user consent
   */
  async recordConsent(consentData: ConsentRecord): Promise<void> {
    try {
      const userConsents = this.consentRecords.get(consentData.userId) || [];
      userConsents.push(consentData);
      this.consentRecords.set(consentData.userId, userConsents);

      // Store in database for persistence
      await this.storeConsentRecord(consentData);

      logger.info('User consent recorded', {
        component: 'ComplianceEngine',
        userId: consentData.userId,
        consentType: consentData.consentType,
        granted: consentData.granted
      });
    } catch (error) {
      logger.error('Failed to record consent', { error, userId: consentData.userId });
    }
  }

  /**
   * Process opt-out request
   */
  async processOptOut(optOutData: OptOutRequest): Promise<void> {
    try {
      const userOptOuts = this.optOutRequests.get(optOutData.userId) || [];
      userOptOuts.push(optOutData);
      this.optOutRequests.set(optOutData.userId, userOptOuts);

      // Update user preferences in database
      await this.updateUserPreferences(optOutData);

      // Cancel any pending notifications
      await this.cancelPendingNotifications(optOutData);

      logger.info('Opt-out request processed', {
        component: 'ComplianceEngine',
        userId: optOutData.userId,
        channels: optOutData.channels,
        reason: optOutData.reason
      });
    } catch (error) {
      logger.error('Failed to process opt-out', { error, userId: optOutData.userId });
    }
  }

  /**
   * Get user consent status
   */
  async getUserConsentStatus(userId: string): Promise<ConsentRecord[]> {
    return this.consentRecords.get(userId) || [];
  }

  /**
   * Check if user has valid consent for specific type
   */
  async hasValidConsent(userId: string, consentType: string): Promise<boolean> {
    const consents = this.consentRecords.get(userId) || [];
    const latestConsent = consents
      .filter(c => c.consentType === consentType)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    return latestConsent?.granted || false;
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(startDate: Date, endDate: Date): Promise<any> {
    try {
      const report = {
        period: { startDate, endDate },
        summary: {
          totalNotifications: 0,
          compliantNotifications: 0,
          violations: 0,
          optOuts: 0,
          consentRecords: 0
        },
        violations: [] as any[],
        trends: {} as any,
        recommendations: [] as string[]
      };

      // Get notification data from database
      const notifications = await db.select()
        .from(notificationQueue)
        .where(and(
          gte(notificationQueue.createdAt, startDate),
          lte(notificationQueue.createdAt, endDate)
        ));

      report.summary.totalNotifications = notifications.length;

      // Analyze compliance for each notification
      for (const notification of notifications) {
        const compliance = await this.validateCompliance({
          userId: notification.userId,
          channel: notification.channel,
          subject: notification.subject,
          // Add other notification data
        });

        if (compliance.isCompliant) {
          report.summary.compliantNotifications++;
        } else {
          report.summary.violations++;
          report.violations.push({
            notificationId: notification.id,
            violations: compliance.violations,
            severity: compliance.severity,
            timestamp: notification.createdAt
          });
        }
      }

      // Calculate compliance rate
      const complianceRate = report.summary.totalNotifications > 0 
        ? (report.summary.compliantNotifications / report.summary.totalNotifications) * 100 
        : 0;

      (report.summary as any).complianceRate = complianceRate;

      // Add recommendations based on findings
      if (complianceRate < 95) {
        report.recommendations.push('Improve compliance processes to achieve >95% compliance rate');
      }

      if (report.summary.violations > 0) {
        report.recommendations.push('Review and address compliance violations');
      }

      logger.info('Compliance report generated', {
        component: 'ComplianceEngine',
        period: { startDate, endDate },
        complianceRate,
        violations: report.summary.violations
      });

      return report;
    } catch (error) {
      logger.error('Failed to generate compliance report', { error });
      throw error;
    }
  }

  /**
   * Auto-remediate compliance issues
   */
  async autoRemediate(violationType: string, notificationId: number): Promise<boolean> {
    try {
      switch (violationType) {
        case 'missing_unsubscribe':
          // Add unsubscribe link to notification
          await this.addUnsubscribeLink(notificationId);
          return true;

        case 'missing_sender_info':
          // Add sender information
          await this.addSenderInfo(notificationId);
          return true;

        case 'user_opted_out':
          // Cancel notification
          await this.cancelNotification(notificationId);
          return true;

        default:
          return false;
      }
    } catch (error) {
      logger.error('Auto-remediation failed', { error, violationType, notificationId });
      return false;
    }
  }

  /**
   * Helper methods
   */
  private getSeverityLevel(severity: string): number {
    const levels = { low: 1, medium: 2, high: 3, critical: 4 };
    return levels[severity as keyof typeof levels] || 1;
  }

  private async storeConsentRecord(consent: ConsentRecord): Promise<void> {
    // Store consent in database for legal compliance
    // Implementation would depend on specific database schema
  }

  private async updateUserPreferences(optOut: OptOutRequest): Promise<void> {
    try {
      // Update user notification preferences
      const preferences = {
        userId: optOut.userId,
        emailEnabled: !optOut.channels.includes('email') && !optOut.channels.includes('all'),
        smsEnabled: !optOut.channels.includes('sms') && !optOut.channels.includes('all'),
        pushEnabled: !optOut.channels.includes('push') && !optOut.channels.includes('all'),
        inAppEnabled: !optOut.channels.includes('in_app') && !optOut.channels.includes('all'),
        unsubscribedAt: new Date()
      };

      await db.insert(userNotificationPreferences)
        .values(preferences)
        .onConflictDoUpdate({
          target: userNotificationPreferences.userId,
          set: preferences
        });
    } catch (error) {
      logger.error('Failed to update user preferences', { error });
    }
  }

  private async cancelPendingNotifications(optOut: OptOutRequest): Promise<void> {
    try {
      const channelsToCancel = optOut.channels.includes('all') 
        ? ['email', 'sms', 'push', 'in_app', 'whatsapp']
        : optOut.channels;

      await db.update(notificationQueue)
        .set({ 
          status: 'cancelled',
          metadata: sql`jsonb_set(metadata, '{cancelledAt}', to_jsonb(${new Date().toISOString()}::timestamp)) || jsonb_set(metadata, '{cancellationReason}', '"User opt-out"')`
        })
        .where(and(
          eq(notificationQueue.userId, optOut.userId),
          eq(notificationQueue.status, 'queued'),
          sql`channel = ANY(${channelsToCancel})`
        ));
    } catch (error) {
      logger.error('Failed to cancel pending notifications', { error });
    }
  }

  private async addUnsubscribeLink(notificationId: number): Promise<void> {
    // Implementation to add unsubscribe link to notification
  }

  private async addSenderInfo(notificationId: number): Promise<void> {
    // Implementation to add sender information to notification
  }

  private async cancelNotification(notificationId: number): Promise<void> {
    await db.update(notificationQueue)
      .set({ 
        status: 'cancelled',
        metadata: sql`jsonb_set(metadata, '{cancelledAt}', to_jsonb(${new Date().toISOString()}::timestamp)) || jsonb_set(metadata, '{cancellationReason}', '"Compliance violation"')`
      })
      .where(eq(notificationQueue.id, notificationId));
  }
}

// Export both class and singleton instance
export { ComplianceEngine };
export const complianceEngine = new ComplianceEngine();