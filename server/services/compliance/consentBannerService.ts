import { complianceEngine, ComplianceFramework } from './complianceEngine';

export interface ConsentBannerConfig {
  framework: string;
  country: string;
  vertical: string;
  position: 'top' | 'bottom' | 'modal';
  theme: 'light' | 'dark' | 'auto';
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  customization: boolean;
  showRejectButton: boolean;
  showSettingsButton: boolean;
  autoHide: boolean;
  autoHideDelay: number;
  language: string;
}

export interface ConsentBannerContent {
  title: string;
  message: string;
  acceptButton: string;
  rejectButton: string;
  settingsButton: string;
  learnMoreButton: string;
  privacyPolicyUrl: string;
  cookiePolicyUrl: string;
  categories: {
    essential: { title: string; description: string; required: boolean };
    analytics: { title: string; description: string; required: boolean };
    marketing: { title: string; description: string; required: boolean };
    customization: { title: string; description: string; required: boolean };
  };
}

export class ConsentBannerService {
  private bannerTemplates: Map<string, ConsentBannerContent> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates(): void {
    // GDPR Template (EU)
    this.bannerTemplates.set('GDPR', {
      title: 'Cookie Consent',
      message: 'We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.',
      acceptButton: 'Accept All',
      rejectButton: 'Reject All',
      settingsButton: 'Cookie Settings',
      learnMoreButton: 'Learn More',
      privacyPolicyUrl: '/privacy-policy',
      cookiePolicyUrl: '/cookie-policy',
      categories: {
        essential: {
          title: 'Essential Cookies',
          description: 'These cookies are necessary for the website to function and cannot be switched off.',
          required: true
        },
        analytics: {
          title: 'Analytics Cookies',
          description: 'These cookies help us understand how visitors interact with our website.',
          required: false
        },
        marketing: {
          title: 'Marketing Cookies',
          description: 'These cookies are used to deliver personalized advertisements.',
          required: false
        },
        customization: {
          title: 'Customization Cookies',
          description: 'These cookies enable the website to remember your preferences.',
          required: false
        }
      }
    });

    // CCPA Template (California)
    this.bannerTemplates.set('CCPA', {
      title: 'Privacy Notice',
      message: 'We may sell or share your personal information. You have the right to opt-out of the sale or sharing of your personal information.',
      acceptButton: 'Accept',
      rejectButton: 'Do Not Sell My Info',
      settingsButton: 'Privacy Settings',
      learnMoreButton: 'Learn More',
      privacyPolicyUrl: '/privacy-policy',
      cookiePolicyUrl: '/cookie-policy',
      categories: {
        essential: {
          title: 'Required Information',
          description: 'Information necessary to provide our services.',
          required: true
        },
        analytics: {
          title: 'Analytics Information',
          description: 'Information used to improve our services.',
          required: false
        },
        marketing: {
          title: 'Marketing Information',
          description: 'Information used for advertising and marketing.',
          required: false
        },
        customization: {
          title: 'Personalization Information',
          description: 'Information used to personalize your experience.',
          required: false
        }
      }
    });

    // LGPD Template (Brazil)
    this.bannerTemplates.set('LGPD', {
      title: 'Consentimento de Cookies',
      message: 'Utilizamos cookies para melhorar sua experiência de navegação, fornecer conteúdo personalizado e analisar nosso tráfego.',
      acceptButton: 'Aceitar Todos',
      rejectButton: 'Rejeitar Todos',
      settingsButton: 'Configurações',
      learnMoreButton: 'Saiba Mais',
      privacyPolicyUrl: '/politica-privacidade',
      cookiePolicyUrl: '/politica-cookies',
      categories: {
        essential: {
          title: 'Cookies Essenciais',
          description: 'Estes cookies são necessários para o funcionamento do site.',
          required: true
        },
        analytics: {
          title: 'Cookies de Análise',
          description: 'Estes cookies nos ajudam a entender como os visitantes interagem com nosso site.',
          required: false
        },
        marketing: {
          title: 'Cookies de Marketing',
          description: 'Estes cookies são usados para entregar anúncios personalizados.',
          required: false
        },
        customization: {
          title: 'Cookies de Personalização',
          description: 'Estes cookies permitem que o site lembre suas preferências.',
          required: false
        }
      }
    });

    // Generic Template
    this.bannerTemplates.set('GENERAL', {
      title: 'Cookie Notice',
      message: 'This website uses cookies to improve your experience. By continuing to use this site, you agree to our use of cookies.',
      acceptButton: 'Accept',
      rejectButton: 'Decline',
      settingsButton: 'Settings',
      learnMoreButton: 'Learn More',
      privacyPolicyUrl: '/privacy-policy',
      cookiePolicyUrl: '/cookie-policy',
      categories: {
        essential: {
          title: 'Necessary Cookies',
          description: 'These cookies are required for basic site functionality.',
          required: true
        },
        analytics: {
          title: 'Analytics Cookies',
          description: 'These cookies help us analyze site usage.',
          required: false
        },
        marketing: {
          title: 'Marketing Cookies',
          description: 'These cookies support advertising and marketing efforts.',
          required: false
        },
        customization: {
          title: 'Preference Cookies',
          description: 'These cookies remember your settings and preferences.',
          required: false
        }
      }
    });
  }

  // ========================================
  // BANNER CONFIGURATION GENERATION
  // ========================================

  async generateBannerConfig(data: {
    country: string;
    vertical: string;
    language?: string;
    theme?: 'light' | 'dark' | 'auto';
    position?: 'top' | 'bottom' | 'modal';
  }): Promise<{
    config: ConsentBannerConfig;
    content: ConsentBannerContent;
    framework?: ComplianceFramework;
  }> {
    const framework = complianceEngine.getApplicableFramework(data.country);
    const frameworkName = framework?.name || 'GENERAL';

    // Generate banner configuration based on framework requirements
    const config: ConsentBannerConfig = {
      framework: frameworkName,
      country: data.country,
      vertical: data.vertical,
      position: data.position || 'bottom',
      theme: data.theme || 'auto',
      essential: true, // Always required
      analytics: framework?.requirements.consent || false,
      marketing: framework?.requirements.consent || false,
      customization: framework?.requirements.consent || false,
      showRejectButton: framework?.requirements.consent || false,
      showSettingsButton: framework?.requirements.consent || false,
      autoHide: false, // Don't auto-hide for compliance
      autoHideDelay: 0,
      language: data.language || 'en'
    };

    // Get appropriate content template
    const content = this.getContentTemplate(frameworkName, data.language);

    return {
      config,
      content,
      framework
    };
  }

  private getContentTemplate(framework: string, language?: string): ConsentBannerContent {
    const template = this.bannerTemplates.get(framework) || this.bannerTemplates.get('GENERAL')!;
    
    // Apply language localization if needed
    if (language && language !== 'en') {
      return this.localizeContent(template, language);
    }
    
    return template;
  }

  private localizeContent(template: ConsentBannerContent, language: string): ConsentBannerContent {
    // Simple localization - in production, this would use a proper i18n system
    const localizations: Record<string, Partial<ConsentBannerContent>> = {
      'pt': {
        title: 'Consentimento de Cookies',
        message: 'Utilizamos cookies para melhorar sua experiência de navegação, fornecer conteúdo personalizado e analisar nosso tráfego.',
        acceptButton: 'Aceitar Todos',
        rejectButton: 'Rejeitar Todos',
        settingsButton: 'Configurações',
        learnMoreButton: 'Saiba Mais'
      },
      'es': {
        title: 'Consentimiento de Cookies',
        message: 'Utilizamos cookies para mejorar tu experiencia de navegación, servir contenido personalizado y analizar nuestro tráfico.',
        acceptButton: 'Aceptar Todo',
        rejectButton: 'Rechazar Todo',
        settingsButton: 'Configuración',
        learnMoreButton: 'Saber Más'
      },
      'fr': {
        title: 'Consentement aux Cookies',
        message: 'Nous utilisons des cookies pour améliorer votre expérience de navigation, servir du contenu personnalisé et analyser notre trafic.',
        acceptButton: 'Accepter Tout',
        rejectButton: 'Rejeter Tout',
        settingsButton: 'Paramètres',
        learnMoreButton: 'En Savoir Plus'
      },
      'de': {
        title: 'Cookie-Einwilligung',
        message: 'Wir verwenden Cookies, um Ihr Browsererlebnis zu verbessern, personalisierte Inhalte zu liefern und unseren Traffic zu analysieren.',
        acceptButton: 'Alle Akzeptieren',
        rejectButton: 'Alle Ablehnen',
        settingsButton: 'Einstellungen',
        learnMoreButton: 'Mehr Erfahren'
      }
    };

    const localization = localizations[language];
    if (!localization) return template;

    return {
      ...template,
      ...localization
    };
  }

  // ========================================
  // CONSENT PROCESSING
  // ========================================

  async processConsentChoice(data: {
    userId: string;
    sessionId: string;
    country: string;
    vertical: string;
    ipAddress: string;
    userAgent: string;
    choices: {
      essential: boolean;
      analytics: boolean;
      marketing: boolean;
      customization: boolean;
    };
    action: 'accept_all' | 'reject_all' | 'custom';
  }) {
    const framework = complianceEngine.getApplicableFramework(data.country);
    
    // Record individual consent choices
    const consentRecords = [];
    
    for (const [category, granted] of Object.entries(data.choices)) {
      if (category === 'essential' || granted) {
        const consent = await complianceEngine.recordConsent({
          userId: data.userId,
          vertical: data.vertical,
          country: data.country,
          consentType: category,
          consentValue: granted,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          purpose: this.getCategoryPurpose(category),
          legalBasis: this.getLegalBasis(category, framework),
          metadata: {
            sessionId: data.sessionId,
            action: data.action,
            framework: framework?.name || 'GENERAL',
            timestamp: new Date().toISOString()
          }
        });
        
        consentRecords.push(consent);
      }
    }

    return {
      success: true,
      consents: consentRecords,
      framework: framework?.name || 'GENERAL',
      choices: data.choices
    };
  }

  private getCategoryPurpose(category: string): string {
    const purposes = {
      essential: 'Necessary for basic website functionality and security',
      analytics: 'Website performance analysis and improvement',
      marketing: 'Personalized advertising and marketing communications',
      customization: 'Remembering user preferences and settings'
    };
    
    return purposes[category as keyof typeof purposes] || 'General website functionality';
  }

  private getLegalBasis(category: string, framework?: ComplianceFramework): string {
    if (category === 'essential') {
      return 'legitimate_interest'; // Essential cookies don't require consent
    }
    
    if (framework?.name === 'GDPR') {
      return 'consent'; // GDPR requires explicit consent for non-essential cookies
    }
    
    if (framework?.name === 'CCPA') {
      return 'opt_out'; // CCPA is opt-out based
    }
    
    return 'consent'; // Default to consent
  }

  // ========================================
  // CONSENT VALIDATION AND CHECKING
  // ========================================

  async checkConsentStatus(userId: string, category: string): Promise<{
    hasConsent: boolean;
    isExpired: boolean;
    framework?: string;
    needsRefresh: boolean;
  }> {
    const status = await complianceEngine.getConsentStatus(userId, category);
    
    return {
      hasConsent: status.hasConsent,
      isExpired: status.isExpired,
      framework: status.framework?.name,
      needsRefresh: status.isExpired || !status.hasConsent
    };
  }

  async shouldShowBanner(data: {
    userId: string;
    country: string;
    vertical: string;
  }): Promise<{
    shouldShow: boolean;
    reason?: string;
    framework?: string;
    missingConsents?: string[];
  }> {
    const framework = complianceEngine.getApplicableFramework(data.country);
    
    // If no specific framework applies, show generic banner
    if (!framework) {
      return {
        shouldShow: true,
        reason: 'Generic consent required',
        framework: 'GENERAL'
      };
    }

    // Check required consents based on framework
    const requiredCategories = [];
    if (framework.requirements.consent) {
      requiredCategories.push('analytics', 'marketing', 'customization');
    }

    const missingConsents = [];
    for (const category of requiredCategories) {
      const status = await this.checkConsentStatus(data.userId, category);
      if (!status.hasConsent || status.isExpired) {
        missingConsents.push(category);
      }
    }

    return {
      shouldShow: missingConsents.length > 0,
      reason: missingConsents.length > 0 ? 'Missing or expired consents' : 'All consents valid',
      framework: framework.name,
      missingConsents: missingConsents.length > 0 ? missingConsents : undefined
    };
  }

  // ========================================
  // BANNER JAVASCRIPT GENERATION
  // ========================================

  generateBannerScript(config: ConsentBannerConfig, content: ConsentBannerContent): string {
    return `
<!-- Findawise Compliance Banner Script -->
<script>
(function() {
  'use strict';
  
  const CONSENT_CONFIG = ${JSON.stringify(config, null, 2)};
  const CONSENT_CONTENT = ${JSON.stringify(content, null, 2)};
  
  class ConsentBanner {
    constructor() {
      this.banner = null;
      this.overlay = null;
      this.settingsModal = null;
      this.consentData = this.loadConsentData();
      
      if (this.shouldShowBanner()) {
        this.init();
      }
    }
    
    shouldShowBanner() {
      // Check if consent has already been given
      const consent = localStorage.getItem('findawise_consent');
      if (!consent) return true;
      
      try {
        const data = JSON.parse(consent);
        const expiry = new Date(data.expires);
        return new Date() > expiry;
      } catch (e) {
        return true;
      }
    }
    
    init() {
      this.createBanner();
      this.attachEventListeners();
      this.showBanner();
    }
    
    createBanner() {
      // Create banner HTML
      const bannerHTML = \`
        <div id="findawise-consent-banner" class="findawise-consent-banner \${CONSENT_CONFIG.position} \${CONSENT_CONFIG.theme}">
          <div class="findawise-consent-content">
            <h3 class="findawise-consent-title">\${CONSENT_CONTENT.title}</h3>
            <p class="findawise-consent-message">\${CONSENT_CONTENT.message}</p>
            <div class="findawise-consent-buttons">
              <button id="findawise-accept-all" class="findawise-btn findawise-btn-accept">
                \${CONSENT_CONTENT.acceptButton}
              </button>
              \${CONSENT_CONFIG.showRejectButton ? \`
                <button id="findawise-reject-all" class="findawise-btn findawise-btn-reject">
                  \${CONSENT_CONTENT.rejectButton}
                </button>
              \` : ''}
              \${CONSENT_CONFIG.showSettingsButton ? \`
                <button id="findawise-settings" class="findawise-btn findawise-btn-settings">
                  \${CONSENT_CONTENT.settingsButton}
                </button>
              \` : ''}
              <a href="\${CONSENT_CONTENT.privacyPolicyUrl}" class="findawise-learn-more" target="_blank">
                \${CONSENT_CONTENT.learnMoreButton}
              </a>
            </div>
          </div>
        </div>
      \`;
      
      document.body.insertAdjacentHTML('beforeend', bannerHTML);
      this.banner = document.getElementById('findawise-consent-banner');
      
      // Inject CSS
      this.injectStyles();
    }
    
    attachEventListeners() {
      const acceptBtn = document.getElementById('findawise-accept-all');
      const rejectBtn = document.getElementById('findawise-reject-all');
      const settingsBtn = document.getElementById('findawise-settings');
      
      if (acceptBtn) {
        acceptBtn.addEventListener('click', () => this.acceptAll());
      }
      
      if (rejectBtn) {
        rejectBtn.addEventListener('click', () => this.rejectAll());
      }
      
      if (settingsBtn) {
        settingsBtn.addEventListener('click', () => this.showSettings());
      }
    }
    
    acceptAll() {
      const choices = {
        essential: true,
        analytics: true,
        marketing: true,
        customization: true
      };
      
      this.recordConsent(choices, 'accept_all');
      this.hideBanner();
    }
    
    rejectAll() {
      const choices = {
        essential: true,
        analytics: false,
        marketing: false,
        customization: false
      };
      
      this.recordConsent(choices, 'reject_all');
      this.hideBanner();
    }
    
    recordConsent(choices, action) {
      // Store consent locally
      const consentData = {
        choices: choices,
        action: action,
        timestamp: new Date().toISOString(),
        expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
        framework: CONSENT_CONFIG.framework
      };
      
      localStorage.setItem('findawise_consent', JSON.stringify(consentData));
      
      // Send to server
      this.sendConsentToServer(choices, action);
      
      // Trigger consent change event
      window.dispatchEvent(new CustomEvent('findawiseConsentChange', {
        detail: { choices, action }
      }));
    }
    
    async sendConsentToServer(choices, action) {
      try {
        const response = await fetch('/api/compliance/consent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            choices,
            action,
            country: CONSENT_CONFIG.country,
            vertical: CONSENT_CONFIG.vertical,
            framework: CONSENT_CONFIG.framework
          })
        });
        
        if (!response.ok) {
          console.warn('Failed to record consent on server');
        }
      } catch (error) {
        console.warn('Error recording consent:', error);
      }
    }
    
    showBanner() {
      if (this.banner) {
        this.banner.style.display = 'block';
        setTimeout(() => {
          this.banner.classList.add('findawise-consent-visible');
        }, 100);
      }
    }
    
    hideBanner() {
      if (this.banner) {
        this.banner.classList.remove('findawise-consent-visible');
        setTimeout(() => {
          this.banner.remove();
        }, 300);
      }
    }
    
    loadConsentData() {
      try {
        const data = localStorage.getItem('findawise_consent');
        return data ? JSON.parse(data) : null;
      } catch (e) {
        return null;
      }
    }
    
    injectStyles() {
      const style = document.createElement('style');
      style.textContent = \`
        .findawise-consent-banner {
          position: fixed;
          z-index: 10000;
          background: #fff;
          border: 1px solid #ddd;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          padding: 20px;
          max-width: 100%;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.3s ease;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          line-height: 1.4;
        }
        
        .findawise-consent-banner.bottom {
          bottom: 0;
          left: 0;
          right: 0;
        }
        
        .findawise-consent-banner.top {
          top: 0;
          left: 0;
          right: 0;
        }
        
        .findawise-consent-banner.findawise-consent-visible {
          opacity: 1;
          transform: translateY(0);
        }
        
        .findawise-consent-banner.dark {
          background: #333;
          color: #fff;
          border-color: #555;
        }
        
        .findawise-consent-title {
          margin: 0 0 10px 0;
          font-size: 16px;
          font-weight: 600;
        }
        
        .findawise-consent-message {
          margin: 0 0 15px 0;
          color: #666;
        }
        
        .findawise-consent-banner.dark .findawise-consent-message {
          color: #ccc;
        }
        
        .findawise-consent-buttons {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }
        
        .findawise-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.2s;
        }
        
        .findawise-btn-accept {
          background: #007cba;
          color: white;
        }
        
        .findawise-btn-accept:hover {
          background: #005a87;
        }
        
        .findawise-btn-reject {
          background: #666;
          color: white;
        }
        
        .findawise-btn-reject:hover {
          background: #444;
        }
        
        .findawise-btn-settings {
          background: transparent;
          color: #007cba;
          border: 1px solid #007cba;
        }
        
        .findawise-btn-settings:hover {
          background: #007cba;
          color: white;
        }
        
        .findawise-learn-more {
          color: #007cba;
          text-decoration: none;
          margin-left: auto;
        }
        
        .findawise-learn-more:hover {
          text-decoration: underline;
        }
        
        @media (max-width: 768px) {
          .findawise-consent-banner {
            padding: 15px;
          }
          
          .findawise-consent-buttons {
            flex-direction: column;
            align-items: stretch;
          }
          
          .findawise-btn {
            margin-bottom: 5px;
          }
          
          .findawise-learn-more {
            margin-left: 0;
            text-align: center;
          }
        }
      \`;
      
      document.head.appendChild(style);
    }
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new ConsentBanner());
  } else {
    new ConsentBanner();
  }
})();
</script>
<!-- End Findawise Compliance Banner Script -->
    `.trim();
  }
}

export const consentBannerService = new ConsentBannerService();