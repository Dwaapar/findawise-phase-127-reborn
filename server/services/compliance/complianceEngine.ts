import { IStorage } from '../../storage';
import { 
  InsertGlobalConsentManagement,
  InsertPrivacyPolicyManagement,
  InsertUserDataControlRequests,
  InsertAffiliateComplianceManagement,
  InsertComplianceAuditSystem,
  InsertGeoRestrictionManagement,
  InsertComplianceRbacManagement
} from '@shared/schema';
import { randomUUID } from 'crypto';

export interface ComplianceFramework {
  name: string;
  countries: string[];
  requirements: {
    consent: boolean;
    dataPortability: boolean;
    rightToErasure: boolean;
    privacyNotice: boolean;
    dpoRequired: boolean;
    ageVerification?: number;
  };
  penalties: {
    maxFine: string;
    currency: string;
  };
}

export const COMPLIANCE_FRAMEWORKS: ComplianceFramework[] = [
  {
    name: 'GDPR',
    countries: ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'],
    requirements: {
      consent: true,
      dataPortability: true,
      rightToErasure: true,
      privacyNotice: true,
      dpoRequired: true,
      ageVerification: 16
    },
    penalties: {
      maxFine: '20M EUR or 4% of annual revenue',
      currency: 'EUR'
    }
  },
  {
    name: 'CCPA',
    countries: ['US'],
    requirements: {
      consent: true,
      dataPortability: true,
      rightToErasure: true,
      privacyNotice: true,
      dpoRequired: false,
      ageVerification: 13
    },
    penalties: {
      maxFine: '7500 USD per violation',
      currency: 'USD'
    }
  },
  {
    name: 'LGPD',
    countries: ['BR'],
    requirements: {
      consent: true,
      dataPortability: true,
      rightToErasure: true,
      privacyNotice: true,
      dpoRequired: true,
      ageVerification: 18
    },
    penalties: {
      maxFine: '50M BRL or 2% of revenue',
      currency: 'BRL'
    }
  },
  {
    name: 'PIPEDA',
    countries: ['CA'],
    requirements: {
      consent: true,
      dataPortability: false,
      rightToErasure: false,
      privacyNotice: true,
      dpoRequired: false
    },
    penalties: {
      maxFine: '100K CAD',
      currency: 'CAD'
    }
  }
];

export class ComplianceEngine {
  private initialized = false;
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
    this.initialize();
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;
    
    console.log('🔐 Initializing Compliance Engine...');
    
    try {
      // Initialize compliance frameworks
      for (const framework of COMPLIANCE_FRAMEWORKS) {
        console.log(`📋 Loaded framework: ${framework.name} (${framework.countries.length} countries)`);
      }
      
      this.initialized = true;
      console.log('✅ Compliance Engine initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Compliance Engine:', error);
    }
  }

  // ========================================
  // CONSENT MANAGEMENT  
  // ========================================

  async recordConsent(data: {
    userId: string;
    vertical: string;
    country: string;
    consentType: string;
    consentValue: boolean;
    ipAddress: string;
    userAgent: string;
    purpose: string;
    legalBasis: string;
    metadata?: any;
  }) {
    const framework = this.getApplicableFramework(data.country);
    
    const consentRecord: InsertGlobalConsentManagement = {
      userId: data.userId,
      vertical: data.vertical,
      country: data.country,
      consentType: data.consentType,
      consentValue: data.consentValue,
      consentTimestamp: new Date(),
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      purpose: data.purpose,
      legalBasis: data.legalBasis,
      legalFramework: framework?.name || 'GENERAL',
      expirationDate: this.calculateConsentExpiration(framework),
      metadata: data.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return await this.storage.createGlobalConsent(consentRecord);
  }

  async withdrawConsent(consentId: string, reason?: string, userId?: string) {
    const id = parseInt(consentId);
    if (isNaN(id)) {
      throw new Error('Invalid consent ID');
    }

    return await this.storage.updateGlobalConsent(id, {
      withdrawalReason: reason,
      consentWithdrawnAt: new Date(),
      updatedAt: new Date()
    });
  }

  async getConsentStatus(userId: string, consentType: string): Promise<{
    hasConsent: boolean;
    consentRecord?: any;
    isExpired: boolean;
    framework?: ComplianceFramework;
  }> {
    const consents = await this.storage.getGlobalConsentsByUser(userId);
    const activeConsent = consents.find(c => 
      c.consentType === consentType && 
      c.consentValue
    );

    if (!activeConsent) {
      return { hasConsent: false, isExpired: false };
    }

    const isExpired = activeConsent.expirationDate ? 
      new Date() > activeConsent.expirationDate : false;

    const framework = this.getApplicableFramework(activeConsent.country);

    return {
      hasConsent: !isExpired,
      consentRecord: activeConsent,
      isExpired,
      framework
    };
  }

  // Consent Configuration
  async getConsentConfiguration(req: any) {
    const userCountry = this.detectUserCountry(req);
    const framework = this.getApplicableFramework(userCountry);
    
    return {
      country: userCountry,
      framework: framework?.name || 'GENERAL',
      requirements: framework?.requirements || {
        consent: true,
        dataPortability: false,
        rightToErasure: false,
        privacyNotice: true,
        dpoRequired: false
      },
      bannerConfig: this.generateConsentBanner(framework, userCountry),
      categories: [
        { id: 'necessary', name: 'Necessary', required: true },
        { id: 'analytics', name: 'Analytics', required: false },
        { id: 'marketing', name: 'Marketing', required: false },
        { id: 'personalization', name: 'Personalization', required: false }
      ]
    };
  }

  // Update Consent
  async updateConsent(consentId: number, updates: any) {
    return await this.storage.updateGlobalConsent(consentId, {
      ...updates,
      updatedAt: new Date()
    });
  }

  // Generate Privacy Policy
  async generatePrivacyPolicy(vertical: string, country: string) {
    const framework = this.getApplicableFramework(country);
    const template = this.getPrivacyPolicyTemplate(framework, vertical);
    
    const policy: InsertPrivacyPolicyManagement = {
      vertical,
      country,
      legalFramework: framework?.name || 'GENERAL',
      policyVersion: '1.0',
      effectiveDate: new Date(),
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      policyContent: template,
      isActive: true,
      approvedBy: 'system',
      metadata: { autoGenerated: true },
      language: 'en',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return await this.storage.createPrivacyPolicy(policy);
  }

  // Submit Data Request
  async submitDataRequest(data: {
    userId: string;
    requestType: string;
    email: string;
    country: string;
    vertical: string;
    description?: string;
  }) {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const framework = this.getApplicableFramework(data.country);
    
    const request: InsertUserDataControlRequests = {
      requestId,
      userId: data.userId,
      email: data.email,
      requestType: data.requestType,
      country: data.country,
      vertical: data.vertical,
      description: data.description || '',
      legalBasis: framework?.name || 'GENERAL',
      status: 'pending',
      requestDate: new Date(),
      estimatedCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      metadata: { framework: framework?.name },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return await this.storage.createUserDataRequest(request);
  }

  // Validate Affiliate Offer
  async validateAffiliateOffer(data: {
    networkName: string;
    offerId: string;
    country: string;
    vertical: string;
  }) {
    const compliance = await this.storage.getAffiliateComplianceByNetwork(data.networkName);
    const framework = this.getApplicableFramework(data.country);
    
    return {
      isValid: true,
      networkName: data.networkName,
      country: data.country,
      framework: framework?.name || 'GENERAL',
      requiredDisclosures: this.getRequiredDisclosures(data.networkName, data.country),
      restrictions: [],
      recommendations: [
        'Include appropriate affiliate disclosure',
        'Verify geo-targeting compliance',
        'Check age verification requirements'
      ]
    };
  }

  // Helper Methods
  private getApplicableFramework(country: string): ComplianceFramework | undefined {
    return COMPLIANCE_FRAMEWORKS.find(f => f.countries.includes(country.toUpperCase()));
  }

  private detectUserCountry(req: any): string {
    // In production, use IP geolocation service
    return req.headers['cf-ipcountry'] || req.headers['x-country'] || 'US';
  }

  private calculateConsentExpiration(framework?: ComplianceFramework): Date {
    // Default 2 years, can be customized per framework
    const months = framework?.name === 'GDPR' ? 24 : 24;
    return new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000);
  }

  generateConsentBanner(framework?: ComplianceFramework, country: string = 'US'): any {
    const frameworkName = framework?.name || 'GENERAL';
    
    return {
      title: frameworkName === 'GDPR' ? 'Cookie Consent' : 
             frameworkName === 'CCPA' ? 'Privacy Notice' :
             frameworkName === 'LGPD' ? 'Consentimento de Cookies' : 'Cookie Consent',
      message: this.getConsentMessage(framework, country),
      acceptButton: frameworkName === 'GDPR' ? 'Accept All' :
                   frameworkName === 'CCPA' ? 'Accept' :
                   frameworkName === 'LGPD' ? 'Aceitar Todos' : 'Accept All',
      rejectButton: frameworkName === 'GDPR' ? 'Reject All' :
                   frameworkName === 'CCPA' ? 'Do Not Sell My Info' :
                   frameworkName === 'LGPD' ? 'Rejeitar Todos' : 'Reject All',
      settingsButton: frameworkName === 'GDPR' ? 'Cookie Settings' :
                     frameworkName === 'CCPA' ? 'Privacy Settings' :
                     frameworkName === 'LGPD' ? 'Configurações' : 'Cookie Settings',
      learnMoreButton: frameworkName === 'LGPD' ? 'Saiba Mais' : 'Learn More',
      privacyPolicyUrl: frameworkName === 'LGPD' ? '/politica-privacidade' : '/privacy-policy',
      cookiePolicyUrl: frameworkName === 'LGPD' ? '/politica-cookies' : '/cookie-policy',
      type: framework?.requirements.consent ? 'opt-in' : 'opt-out',
      categories: {
        essential: {
          title: frameworkName === 'LGPD' ? 'Cookies Essenciais' : 'Essential Cookies',
          description: frameworkName === 'LGPD' ? 'Necessários para o funcionamento' : 'Required for website function',
          required: true
        },
        analytics: {
          title: frameworkName === 'LGPD' ? 'Cookies de Análise' : 'Analytics Cookies',
          description: frameworkName === 'LGPD' ? 'Ajudam a entender o uso' : 'Help us understand usage',
          required: false
        },
        marketing: {
          title: frameworkName === 'LGPD' ? 'Cookies de Marketing' : 'Marketing Cookies',
          description: frameworkName === 'LGPD' ? 'Para anúncios personalizados' : 'For personalized ads',
          required: false
        },
        customization: {
          title: frameworkName === 'LGPD' ? 'Cookies de Personalização' : 'Customization Cookies',
          description: frameworkName === 'LGPD' ? 'Lembram suas preferências' : 'Remember preferences',
          required: false
        },
        affiliate: {
          title: frameworkName === 'LGPD' ? 'Rastreamento de Afiliados' : 'Affiliate Tracking',
          description: frameworkName === 'LGPD' ? 'Rastreiam indicações' : 'Track referrals',
          required: false
        },
        email: {
          title: frameworkName === 'LGPD' ? 'Comunicações por Email' : 'Email Communications',
          description: frameworkName === 'LGPD' ? 'Enviam atualizações' : 'Send product updates',
          required: false
        },
        push: {
          title: frameworkName === 'LGPD' ? 'Notificações Push' : 'Push Notifications',
          description: frameworkName === 'LGPD' ? 'Enviam notificações' : 'Send notifications',
          required: false
        }
      }
    };
  }

  private getConsentMessage(framework?: ComplianceFramework, country: string = 'US'): string {
    if (framework?.name === 'GDPR') {
      return 'We use cookies and similar technologies to provide, protect and improve our products and services. By clicking "Accept All", you consent to the storing of cookies on your device for the purposes described in our Cookie Policy.';
    }
    if (framework?.name === 'CCPA') {
      return 'We collect personal information to provide better services. You have the right to opt-out of the sale of your personal information.';
    }
    return 'We use cookies to enhance your experience and provide personalized content.';
  }

  private getPrivacyPolicyTemplate(framework?: ComplianceFramework, vertical: string = 'general'): string {
    return `Privacy Policy for ${vertical}

This privacy policy describes how we collect, use, and protect your personal information in accordance with ${framework?.name || 'applicable'} privacy laws.

1. Information We Collect
2. How We Use Your Information  
3. Data Sharing and Disclosure
4. Data Security
5. Your Rights
6. Contact Information

Last updated: ${new Date().toISOString().split('T')[0]}`;
  }

  private getRequiredDisclosures(networkName: string, country: string): string[] {
    const disclosures = [
      'This post contains affiliate links',
      'We may earn a commission from purchases made through these links'
    ];
    
    if (networkName.toLowerCase().includes('amazon')) {
      disclosures.push('As an Amazon Associate, we earn from qualifying purchases');
    }
    
    return disclosures;
  }
}