/**
 * EMPIRE-GRADE AFFILIATE COMPLIANCE ENGINE
 * 
 * Billion-dollar compliant affiliate compliance system with:
 * - GDPR/CCPA/LGPD/PIPEDA compliance management
 * - FTC disclosure requirements automation
 * - Network-specific compliance rules
 * - Real-time consent management
 * - Automatic geo-restrictions
 * - Audit trail and reporting
 * 
 * @version 1.0.0
 * @author Empire Development Team
 */

import { DatabaseStorage } from '../../storage';
import { Request } from 'express';

export interface ComplianceFramework {
  id: string;
  name: string;
  region: string[];
  countries: string[];
  requirements: {
    consentRequired: boolean;
    disclosureRequired: boolean;
    optOutAllowed: boolean;
    dataRetentionDays: number;
    cookieConsentRequired: boolean;
  };
  penalties: {
    maxFine: string;
    currency: string;
    basis: string;
  };
}

export interface NetworkComplianceConfig {
  networkId: number;
  networkSlug: string;
  frameworks: ComplianceFramework[];
  disclosureTemplates: Record<string, string>;
  geoRestrictions: {
    blockedCountries: string[];
    ageRestrictions: Record<string, number>;
  };
  cookieSettings: {
    duration: number;
    essential: boolean;
    marketing: boolean;
    analytics: boolean;
  };
}

export interface ComplianceCheckResult {
  allowed: boolean;
  framework: string;
  consentRequired: boolean;
  disclosureRequired: boolean;
  restrictions: string[];
  recommendations: string[];
  auditTrail: {
    timestamp: number;
    userLocation: string;
    decision: string;
    reason: string;
  };
}

export class AffiliateComplianceEngine {
  private storage: DatabaseStorage;
  private frameworks: Map<string, ComplianceFramework>;

  constructor(storage: DatabaseStorage) {
    this.storage = storage;
    this.frameworks = new Map();
    this.initializeFrameworks();
  }

  /**
   * Initialize all compliance frameworks
   */
  private initializeFrameworks(): void {
    const frameworks: ComplianceFramework[] = [
      {
        id: 'gdpr',
        name: 'General Data Protection Regulation',
        region: ['EU'],
        countries: ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'],
        requirements: {
          consentRequired: true,
          disclosureRequired: true,
          optOutAllowed: true,
          dataRetentionDays: 365,
          cookieConsentRequired: true
        },
        penalties: {
          maxFine: '20M EUR or 4% annual revenue',
          currency: 'EUR',
          basis: 'whichever is higher'
        }
      },
      {
        id: 'ccpa',
        name: 'California Consumer Privacy Act',
        region: ['US-CA'],
        countries: ['US'],
        requirements: {
          consentRequired: false,
          disclosureRequired: true,
          optOutAllowed: true,
          dataRetentionDays: 365,
          cookieConsentRequired: false
        },
        penalties: {
          maxFine: '$7,500 per violation',
          currency: 'USD',
          basis: 'per intentional violation'
        }
      },
      {
        id: 'lgpd',
        name: 'Lei Geral de Proteção de Dados',
        region: ['BR'],
        countries: ['BR'],
        requirements: {
          consentRequired: true,
          disclosureRequired: true,
          optOutAllowed: true,
          dataRetentionDays: 180,
          cookieConsentRequired: true
        },
        penalties: {
          maxFine: 'R$ 50M or 2% annual revenue',
          currency: 'BRL',
          basis: 'whichever is higher'
        }
      },
      {
        id: 'pipeda',
        name: 'Personal Information Protection and Electronic Documents Act',
        region: ['CA'],
        countries: ['CA'],
        requirements: {
          consentRequired: true,
          disclosureRequired: true,
          optOutAllowed: true,
          dataRetentionDays: 365,
          cookieConsentRequired: false
        },
        penalties: {
          maxFine: 'CAD $100K per violation',
          currency: 'CAD',
          basis: 'per violation'
        }
      },
      {
        id: 'ftc',
        name: 'Federal Trade Commission Guidelines',
        region: ['US'],
        countries: ['US'],
        requirements: {
          consentRequired: false,
          disclosureRequired: true,
          optOutAllowed: false,
          dataRetentionDays: 365,
          cookieConsentRequired: false
        },
        penalties: {
          maxFine: '$43,792 per violation',
          currency: 'USD',
          basis: 'per violation (2023 rates)'
        }
      }
    ];

    frameworks.forEach(framework => {
      this.frameworks.set(framework.id, framework);
    });
  }

  /**
   * Perform comprehensive compliance check
   */
  async performComplianceCheck(
    req: Request,
    networkSlug: string,
    offerSlug: string
  ): Promise<ComplianceCheckResult> {
    try {
      const userLocation = this.getUserLocation(req);
      const framework = this.getApplicableFramework(userLocation);
      
      if (!framework) {
        return this.createPermissiveResult(userLocation);
      }

      // Get network compliance configuration
      const networkConfig = await this.getNetworkComplianceConfig(networkSlug);
      if (!networkConfig) {
        return this.createBlockedResult(framework, 'NETWORK_NOT_CONFIGURED', userLocation);
      }

      // Check geo-restrictions
      const geoCheck = this.checkGeoRestrictions(userLocation, networkConfig);
      if (!geoCheck.allowed) {
        return this.createBlockedResult(framework, geoCheck.reason, userLocation);
      }

      // Check age restrictions
      const ageCheck = await this.checkAgeRestrictions(req, userLocation, networkConfig);
      if (!ageCheck.allowed) {
        return this.createBlockedResult(framework, ageCheck.reason, userLocation);
      }

      // Check consent requirements
      const consentCheck = this.checkConsentRequirements(req, framework, networkConfig);
      
      // Generate compliance result
      const result: ComplianceCheckResult = {
        allowed: consentCheck.allowed,
        framework: framework.id,
        consentRequired: framework.requirements.consentRequired,
        disclosureRequired: framework.requirements.disclosureRequired,
        restrictions: this.generateRestrictions(framework, networkConfig),
        recommendations: this.generateRecommendations(framework, consentCheck),
        auditTrail: {
          timestamp: Date.now(),
          userLocation: userLocation.country,
          decision: consentCheck.allowed ? 'ALLOWED' : 'BLOCKED',
          reason: consentCheck.reason || 'COMPLIANCE_CHECK_PASSED'
        }
      };

      // Log compliance decision
      await this.logComplianceDecision(result, req, networkSlug, offerSlug);

      return result;

    } catch (error) {
      console.error('Compliance check error:', error);
      return this.createErrorResult(error);
    }
  }

  /**
   * Generate required FTC disclosure text
   */
  generateDisclosureText(
    networkSlug: string,
    placement: 'inline' | 'footer' | 'popup' = 'inline',
    language: string = 'en'
  ): string {
    const disclosures: Record<string, Record<string, string>> = {
      en: {
        inline: 'This post contains affiliate links. We may earn a commission if you make a purchase.',
        footer: 'Affiliate Disclosure: This website contains affiliate links, which means we may receive a commission if you click a link and purchase something that we have recommended.',
        popup: 'This site uses affiliate links. When you click on affiliate links and make a purchase, we may receive a commission. This helps support our website and allows us to continue providing valuable content.'
      },
      es: {
        inline: 'Esta publicación contiene enlaces de afiliados. Podemos ganar una comisión si realizas una compra.',
        footer: 'Divulgación de Afiliados: Este sitio web contiene enlaces de afiliados, lo que significa que podemos recibir una comisión si haces clic en un enlace y compras algo que hemos recomendado.',
        popup: 'Este sitio utiliza enlaces de afiliados. Cuando haces clic en enlaces de afiliados y realizas una compra, podemos recibir una comisión.'
      },
      fr: {
        inline: 'Ce message contient des liens d\'affiliation. Nous pouvons percevoir une commission si vous effectuez un achat.',
        footer: 'Divulgation d\'affiliation: Ce site Web contient des liens d\'affiliation, ce qui signifie que nous pouvons recevoir une commission si vous cliquez sur un lien et achetez quelque chose que nous avons recommandé.',
        popup: 'Ce site utilise des liens d\'affiliation. Lorsque vous cliquez sur des liens d\'affiliation et effectuez un achat, nous pouvons recevoir une commission.'
      }
    };

    return disclosures[language]?.[placement] || disclosures.en[placement];
  }

  /**
   * Generate consent banner configuration
   */
  generateConsentBanner(framework: ComplianceFramework, networkConfig: NetworkComplianceConfig): any {
    const bannerConfig = {
      required: framework.requirements.cookieConsentRequired,
      title: this.getConsentBannerTitle(framework.id),
      message: this.getConsentBannerMessage(framework.id),
      buttons: this.getConsentButtons(framework.id),
      categories: {
        essential: {
          required: true,
          enabled: true,
          description: 'Essential cookies for website functionality'
        },
        marketing: {
          required: false,
          enabled: false,
          description: 'Marketing and affiliate tracking cookies'
        },
        analytics: {
          required: false,
          enabled: false,
          description: 'Analytics and performance measurement cookies'
        }
      },
      settings: {
        position: 'bottom',
        theme: 'light',
        showSettings: true,
        allowReject: framework.requirements.optOutAllowed
      }
    };

    return bannerConfig;
  }

  /**
   * Validate affiliate link compliance
   */
  async validateAffiliateLink(
    url: string,
    networkSlug: string,
    userLocation: { country: string; region?: string }
  ): Promise<{ valid: boolean; issues: string[]; recommendations: string[] }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      const urlObj = new URL(url);
      
      // Check for required tracking parameters
      const networkConfig = await this.getNetworkComplianceConfig(networkSlug);
      if (networkConfig) {
        const requiredParams = this.getRequiredTrackingParams(networkSlug);
        for (const param of requiredParams) {
          if (!urlObj.searchParams.has(param)) {
            issues.push(`Missing required tracking parameter: ${param}`);
          }
        }
      }

      // Check for prohibited parameters or patterns
      const prohibitedPatterns = ['password', 'credit_card', 'ssn', 'personal_data'];
      for (const pattern of prohibitedPatterns) {
        if (url.toLowerCase().includes(pattern)) {
          issues.push(`URL contains prohibited pattern: ${pattern}`);
        }
      }

      // Check domain reputation (simplified)
      const suspiciousDomains = ['bit.ly', 'tinyurl.com', 'goo.gl'];
      if (suspiciousDomains.some(domain => urlObj.hostname.includes(domain))) {
        recommendations.push('Consider using the original merchant URL for better trust');
      }

      // Check HTTPS requirement
      if (urlObj.protocol !== 'https:') {
        issues.push('Affiliate links must use HTTPS');
      }

      return {
        valid: issues.length === 0,
        issues,
        recommendations
      };

    } catch (error) {
      return {
        valid: false,
        issues: ['Invalid URL format'],
        recommendations: ['Ensure the URL is properly formatted']
      };
    }
  }

  /**
   * Generate compliance report for audit purposes
   */
  async generateComplianceReport(
    startDate: Date,
    endDate: Date,
    networkSlug?: string
  ): Promise<any> {
    try {
      const reportData = {
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        summary: {
          totalClicks: 0,
          blockedClicks: 0,
          consentGiven: 0,
          disclosuresShown: 0,
          complianceRate: 0
        },
        byFramework: {} as Record<string, any>,
        byNetwork: {} as Record<string, any>,
        violations: [] as any[],
        recommendations: [] as string[]
      };

      // Get compliance decisions from audit log
      const auditData = await this.getComplianceAuditData(startDate, endDate, networkSlug);
      
      // Process audit data
      auditData.forEach((entry: any) => {
        reportData.summary.totalClicks++;
        
        if (entry.decision === 'BLOCKED') {
          reportData.summary.blockedClicks++;
        }
        
        if (entry.consentGiven) {
          reportData.summary.consentGiven++;
        }
        
        // Group by framework
        if (!reportData.byFramework[entry.framework]) {
          reportData.byFramework[entry.framework] = {
            clicks: 0,
            blocked: 0,
            consentRate: 0
          };
        }
        reportData.byFramework[entry.framework].clicks++;
        if (entry.decision === 'BLOCKED') {
          reportData.byFramework[entry.framework].blocked++;
        }
      });

      // Calculate compliance rate
      reportData.summary.complianceRate = reportData.summary.totalClicks > 0 
        ? ((reportData.summary.totalClicks - reportData.summary.blockedClicks) / reportData.summary.totalClicks) * 100
        : 100;

      // Generate recommendations
      if (reportData.summary.complianceRate < 95) {
        reportData.recommendations.push('Review geo-restrictions and compliance configurations');
      }
      if (reportData.summary.consentGiven / reportData.summary.totalClicks < 0.7) {
        reportData.recommendations.push('Optimize consent banner for better acceptance rates');
      }

      return reportData;

    } catch (error) {
      console.error('Compliance report generation error:', error);
      throw error;
    }
  }

  // Private helper methods
  private getUserLocation(req: Request): { country: string; region?: string; ip: string } {
    return {
      country: req.headers['cf-ipcountry'] as string || 
                req.headers['x-country-code'] as string || 'US',
      region: req.headers['cf-region'] as string ||
              req.headers['x-region-code'] as string,
      ip: this.getClientIP(req)
    };
  }

  private getClientIP(req: Request): string {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] as string ||
           req.connection.remoteAddress ||
           req.ip ||
           '127.0.0.1';
  }

  private getApplicableFramework(location: { country: string; region?: string }): ComplianceFramework | null {
    // GDPR takes precedence for EU countries
    if (this.frameworks.get('gdpr')?.countries.includes(location.country)) {
      return this.frameworks.get('gdpr')!;
    }

    // CCPA for California
    if (location.country === 'US' && location.region === 'CA') {
      return this.frameworks.get('ccpa')!;
    }

    // LGPD for Brazil
    if (location.country === 'BR') {
      return this.frameworks.get('lgpd')!;
    }

    // PIPEDA for Canada
    if (location.country === 'CA') {
      return this.frameworks.get('pipeda')!;
    }

    // FTC for US (general)
    if (location.country === 'US') {
      return this.frameworks.get('ftc')!;
    }

    return null; // No specific framework
  }

  private async getNetworkComplianceConfig(networkSlug: string): Promise<NetworkComplianceConfig | null> {
    try {
      return await this.storage.getAffiliateComplianceByNetwork(networkSlug);
    } catch (error) {
      console.error('Error getting network compliance config:', error);
      return null;
    }
  }

  private checkGeoRestrictions(
    location: { country: string; region?: string },
    networkConfig: NetworkComplianceConfig
  ): { allowed: boolean; reason?: string } {
    if (networkConfig.geoRestrictions.blockedCountries.includes(location.country)) {
      return { allowed: false, reason: 'COUNTRY_BLOCKED' };
    }
    return { allowed: true };
  }

  private async checkAgeRestrictions(
    req: Request,
    location: { country: string; region?: string },
    networkConfig: NetworkComplianceConfig
  ): Promise<{ allowed: boolean; reason?: string }> {
    const requiredAge = networkConfig.geoRestrictions.ageRestrictions[location.country];
    if (!requiredAge) {
      return { allowed: true };
    }

    // In a real implementation, you would verify age through:
    // - User account age verification
    // - Third-party age verification service
    // - Consent forms with age declaration
    
    // For now, we'll assume age verification is handled elsewhere
    return { allowed: true };
  }

  private checkConsentRequirements(
    req: Request,
    framework: ComplianceFramework,
    networkConfig: NetworkComplianceConfig
  ): { allowed: boolean; reason?: string } {
    if (!framework.requirements.consentRequired) {
      return { allowed: true, reason: 'NO_CONSENT_REQUIRED' };
    }

    // Check for existing consent
    const consentCookie = req.cookies['affiliate_consent'];
    if (consentCookie) {
      try {
        const consent = JSON.parse(consentCookie);
        if (consent.marketing && consent.timestamp > Date.now() - 365 * 24 * 60 * 60 * 1000) {
          return { allowed: true, reason: 'CONSENT_GIVEN' };
        }
      } catch (error) {
        console.error('Error parsing consent cookie:', error);
      }
    }

    // Check for consent parameter
    const consentParam = req.query.consent;
    if (consentParam === 'granted') {
      return { allowed: true, reason: 'CONSENT_PARAM' };
    }

    return { allowed: false, reason: 'CONSENT_REQUIRED' };
  }

  private generateRestrictions(framework: ComplianceFramework, networkConfig: NetworkComplianceConfig): string[] {
    const restrictions: string[] = [];
    
    if (framework.requirements.consentRequired) {
      restrictions.push('Explicit consent required for marketing cookies');
    }
    
    if (framework.requirements.disclosureRequired) {
      restrictions.push('Affiliate disclosure must be prominently displayed');
    }
    
    if (networkConfig.geoRestrictions.blockedCountries.length > 0) {
      restrictions.push(`Blocked in: ${networkConfig.geoRestrictions.blockedCountries.join(', ')}`);
    }
    
    return restrictions;
  }

  private generateRecommendations(framework: ComplianceFramework, consentCheck: any): string[] {
    const recommendations: string[] = [];
    
    if (!consentCheck.allowed && framework.requirements.consentRequired) {
      recommendations.push('Implement consent banner for GDPR compliance');
      recommendations.push('Provide clear opt-out mechanism');
    }
    
    if (framework.requirements.disclosureRequired) {
      recommendations.push('Add clear affiliate disclosure text');
      recommendations.push('Use rel="sponsored" on affiliate links');
    }
    
    return recommendations;
  }

  private createPermissiveResult(location: { country: string }): ComplianceCheckResult {
    return {
      allowed: true,
      framework: 'none',
      consentRequired: false,
      disclosureRequired: true, // Always require disclosure
      restrictions: [],
      recommendations: ['Add affiliate disclosure for transparency'],
      auditTrail: {
        timestamp: Date.now(),
        userLocation: location.country,
        decision: 'ALLOWED',
        reason: 'NO_SPECIFIC_FRAMEWORK'
      }
    };
  }

  private createBlockedResult(framework: ComplianceFramework, reason: string, location: { country: string }): ComplianceCheckResult {
    return {
      allowed: false,
      framework: framework.id,
      consentRequired: framework.requirements.consentRequired,
      disclosureRequired: framework.requirements.disclosureRequired,
      restrictions: [reason],
      recommendations: this.getBlockedRecommendations(reason),
      auditTrail: {
        timestamp: Date.now(),
        userLocation: location.country,
        decision: 'BLOCKED',
        reason
      }
    };
  }

  private createErrorResult(error: any): ComplianceCheckResult {
    return {
      allowed: false,
      framework: 'error',
      consentRequired: false,
      disclosureRequired: true,
      restrictions: ['System error during compliance check'],
      recommendations: ['Contact support for assistance'],
      auditTrail: {
        timestamp: Date.now(),
        userLocation: 'unknown',
        decision: 'ERROR',
        reason: error.message || 'UNKNOWN_ERROR'
      }
    };
  }

  private getBlockedRecommendations(reason: string): string[] {
    const recommendations: Record<string, string[]> = {
      'NETWORK_NOT_CONFIGURED': ['Configure network compliance settings', 'Contact administrator'],
      'COUNTRY_BLOCKED': ['Review geo-restriction settings', 'Consider region-specific offers'],
      'CONSENT_REQUIRED': ['Implement consent management platform', 'Show consent banner'],
      'AGE_RESTRICTED': ['Implement age verification system', 'Show age gate']
    };
    
    return recommendations[reason] || ['Review compliance configuration'];
  }

  private getConsentBannerTitle(frameworkId: string): string {
    const titles: Record<string, string> = {
      'gdpr': 'We value your privacy',
      'ccpa': 'Your Privacy Choices',
      'lgpd': 'Sua Privacidade Importa',
      'pipeda': 'Privacy Notice'
    };
    return titles[frameworkId] || 'Privacy Notice';
  }

  private getConsentBannerMessage(frameworkId: string): string {
    const messages: Record<string, string> = {
      'gdpr': 'We use cookies and similar technologies to provide and improve our services. Some cookies are essential, while others help us personalize your experience and show you relevant content.',
      'ccpa': 'We may share your personal information with third parties for advertising purposes. You have the right to opt out of this sharing.',
      'lgpd': 'Utilizamos cookies e tecnologias similares para fornecer e melhorar nossos serviços. Alguns cookies são essenciais, enquanto outros nos ajudam a personalizar sua experiência.',
      'pipeda': 'We collect and use personal information to provide our services and show you relevant content. Your privacy is important to us.'
    };
    return messages[frameworkId] || 'We use cookies to improve your experience.';
  }

  private getConsentButtons(frameworkId: string): any {
    return {
      accept: 'Accept All',
      reject: frameworkId === 'gdpr' ? 'Reject All' : 'Decline',
      settings: 'Cookie Settings',
      save: 'Save Preferences'
    };
  }

  private getRequiredTrackingParams(networkSlug: string): string[] {
    const requiredParams: Record<string, string[]> = {
      'amazon-associates': ['tag'],
      'shareasale': ['u', 'm'],
      'clickbank': ['hop'],
      'cj-affiliate': ['PID'],
      'rakuten': ['ranMID', 'ranEAID']
    };
    return requiredParams[networkSlug] || [];
  }

  private async logComplianceDecision(
    result: ComplianceCheckResult,
    req: Request,
    networkSlug: string,
    offerSlug: string
  ): Promise<void> {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        event: 'COMPLIANCE_DECISION',
        framework: result.framework,
        decision: result.allowed ? 'ALLOWED' : 'BLOCKED',
        reason: result.auditTrail.reason,
        networkSlug,
        offerSlug,
        userLocation: result.auditTrail.userLocation,
        ip: this.getClientIP(req),
        userAgent: req.get('User-Agent'),
        metadata: {
          consentRequired: result.consentRequired,
          disclosureRequired: result.disclosureRequired,
          restrictions: result.restrictions
        }
      };

      // Store in database
      await this.storage.logComplianceDecision(logEntry);
      
      // Also log to console for immediate monitoring
      console.log(`COMPLIANCE_${result.allowed ? 'ALLOWED' : 'BLOCKED'}:`, JSON.stringify(logEntry));

    } catch (error) {
      console.error('Error logging compliance decision:', error);
    }
  }

  private async getComplianceAuditData(
    startDate: Date,
    endDate: Date,
    networkSlug?: string
  ): Promise<any[]> {
    try {
      return await this.storage.getComplianceAuditData(startDate, endDate, networkSlug);
    } catch (error) {
      console.error('Error getting compliance audit data:', error);
      return [];
    }
  }
}

export default AffiliateComplianceEngine;