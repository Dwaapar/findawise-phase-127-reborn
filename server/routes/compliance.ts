// Advanced Compliance/Privacy/Consent Engine - API Routes
import express from 'express';
import { ComplianceEngine } from '../services/compliance/complianceEngine';
import { 
  insertGlobalConsentManagementSchema,
  insertPrivacyPolicyManagementSchema,
  insertUserDataControlRequestsSchema,
  insertAffiliateComplianceManagementSchema,
  insertComplianceAuditSystemSchema,
  insertGeoRestrictionManagementSchema,
  insertComplianceRbacManagementSchema
} from '@shared/complianceTables';
import { storage } from '../storage';

const router = express.Router();
const complianceEngine = new ComplianceEngine(storage);

// === CONSENT MANAGEMENT API ===

// Detect user's framework and country
router.get('/detect-framework', async (req, res) => {
  try {
    const config = await complianceEngine.getConsentConfiguration(req);
    const bannerContent = await complianceEngine.generateConsentBanner(config.framework, config.country);
    
    res.json({
      success: true,
      framework: config.framework || 'GENERAL',
      country: config.country || 'US',
      bannerContent: bannerContent || {
        title: 'Cookie Consent',
        message: 'We use cookies to enhance your browsing experience.',
        acceptButton: 'Accept All',
        rejectButton: 'Reject All',
        settingsButton: 'Cookie Settings',
        learnMoreButton: 'Learn More',
        privacyPolicyUrl: '/privacy-policy',
        cookiePolicyUrl: '/cookie-policy',
        categories: {
          essential: { title: 'Essential Cookies', description: 'Required for website function', required: true },
          analytics: { title: 'Analytics Cookies', description: 'Help us understand usage', required: false },
          marketing: { title: 'Marketing Cookies', description: 'For personalized ads', required: false },
          customization: { title: 'Customization Cookies', description: 'Remember preferences', required: false },
          affiliate: { title: 'Affiliate Tracking', description: 'Track referrals', required: false },
          email: { title: 'Email Communications', description: 'Send product updates', required: false },
          push: { title: 'Push Notifications', description: 'Send notifications', required: false }
        }
      }
    });
  } catch (error) {
    console.error('Error detecting framework:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to detect framework'
    });
  }
});

// Get user's current consent status
router.get('/consent/status', async (req, res) => {
  try {
    const userId = req.query.userId as string || 'anonymous';
    const sessionId = req.sessionID || 'anonymous';
    
    // Try to get user's most recent consent
    const consents = await storage.getGlobalConsentsByUser(userId);
    const latestConsent = consents.find(c => c.consentValue === true);
    
    if (latestConsent && latestConsent.expiresAt && new Date() < latestConsent.expiresAt) {
      // User has valid consent
      res.json({
        success: true,
        hasConsent: true,
        isExpired: false,
        consents: {
          cookiesConsent: latestConsent.cookiesConsent || 'pending',
          analyticsConsent: latestConsent.analyticsConsent || 'pending',
          marketingConsent: latestConsent.marketingConsent || 'pending',
          personalizationConsent: latestConsent.personalizationConsent || 'pending',
          affiliateConsent: latestConsent.affiliateConsent || 'pending',
          emailConsent: latestConsent.emailConsent || 'pending',
          pushConsent: latestConsent.pushConsent || 'pending'
        }
      });
    } else {
      // No valid consent found
      res.json({
        success: true,
        hasConsent: false,
        isExpired: latestConsent ? true : false,
        consents: null
      });
    }
  } catch (error) {
    console.error('Error getting consent status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get consent status'
    });
  }
});

// Record comprehensive consent (used by ConsentBanner)
router.post('/consent', async (req, res) => {
  try {
    const {
      vertical = 'general',
      country = 'US',
      legalFramework = 'GENERAL',
      cookiesConsent = 'pending',
      analyticsConsent = 'pending',
      marketingConsent = 'pending',
      personalizationConsent = 'pending',
      affiliateConsent = 'pending',
      emailConsent = 'pending',
      pushConsent = 'pending',
      consentMethod = 'banner',
      consentVersion = '1.0'
    } = req.body;

    const userId = req.body.userId || `anonymous_${Date.now()}`;
    const sessionId = req.sessionID || 'anonymous';

    // Create comprehensive consent record
    const consentRecord = await storage.createGlobalConsent({
      userId,
      sessionId,
      fingerprint: req.body.fingerprint || '',
      ipAddress: req.ip || '',
      userAgent: req.get('User-Agent') || '',
      country,
      region: '',
      detectedRegion: '',
      legalFramework,
      languageCode: req.body.languageCode || 'en',
      cookiesConsent,
      analyticsConsent,
      personalizationConsent,
      marketingConsent,
      affiliateConsent,
      emailConsent,
      pushConsent,
      smsConsent: 'denied', // Default to denied
      consentDetails: {
        categories: {
          cookies: cookiesConsent,
          analytics: analyticsConsent,
          marketing: marketingConsent,
          personalization: personalizationConsent,
          affiliate: affiliateConsent,
          email: emailConsent,
          push: pushConsent
        }
      },
      consentMethod,
      consentVersion,
      legalBasis: legalFramework === 'GDPR' ? 'consent' : 'legitimate_interest',
      consentEvidence: {
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
        method: consentMethod,
        ip: req.ip
      },
      consentGrantedAt: new Date(),
      lastUpdatedAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      isActive: true,
      requiresReconfirmation: false,
      isMinor: false,
      parentalConsentRequired: false,
      auditTrail: [{
        action: 'consent_granted',
        timestamp: new Date().toISOString(),
        method: consentMethod,
        details: { cookiesConsent, analyticsConsent, marketingConsent }
      }],
      syncedWithExternalSystems: {},
      complianceScore: '1.00',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    res.status(201).json({
      success: true,
      data: consentRecord,
      message: 'Consent recorded successfully'
    });
  } catch (error) {
    console.error('Error recording consent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record consent'
    });
  }
});

// Get consent configuration for user's location
router.get('/consent/config', async (req, res) => {
  try {
    const config = await complianceEngine.getConsentConfiguration(req);
    
    res.json({
      success: true,
      data: config,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting consent config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get consent configuration'
    });
  }
});

// Record user consent
router.post('/consent/record', async (req, res) => {
  try {
    const validatedData = {
      userId: req.body.userId || '',
      vertical: req.body.vertical || 'general',
      country: req.body.country || 'US',
      consentType: req.body.consentType || 'cookies',
      consentValue: req.body.consentValue || false,
      ipAddress: req.ip || '',
      userAgent: req.get('User-Agent') || '',
      purpose: req.body.purpose || 'tracking',
      legalBasis: req.body.legalBasis || 'consent',
      metadata: {
        sessionId: req.body.sessionId || 'anonymous',
        fingerprint: req.body.fingerprint,
        consentData: req.body.consentData
      }
    };

    const consentRecord = await complianceEngine.recordConsent(validatedData);
    
    res.status(201).json({
      success: true,
      data: consentRecord,
      message: 'Consent recorded successfully'
    });
  } catch (error) {
    console.error('Error recording consent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record consent'
    });
  }
});

// Update existing consent
router.put('/consent/:id', async (req, res) => {
  try {
    const consentId = parseInt(req.params.id);
    const updates = req.body;
    
    const updatedConsent = await complianceEngine.updateConsent(consentId, updates);
    
    res.json({
      success: true,
      data: updatedConsent,
      message: 'Consent updated successfully'
    });
  } catch (error) {
    console.error('Error updating consent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update consent'
    });
  }
});

// Withdraw consent
router.post('/consent/:id/withdraw', async (req, res) => {
  try {
    const consentId = parseInt(req.params.id);
    const { reason, userId } = req.body;
    
    const withdrawnConsent = await complianceEngine.withdrawConsent(consentId.toString(), reason, userId);
    
    res.json({
      success: true,
      data: withdrawnConsent,
      message: 'Consent withdrawn successfully'
    });
  } catch (error) {
    console.error('Error withdrawing consent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to withdraw consent'
    });
  }
});

// Get user's consent history
router.get('/consent/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const consents = await storage.getGlobalConsentsByUser(userId);
    const consentOverview = await storage.getConsentMetrics({ country: null, vertical: null, dateRange: null });
    
    res.json({
      success: true,
      data: consents,
      count: consents.length
    });
  } catch (error) {
    console.error('Error getting user consents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user consents'
    });
  }
});

// === PRIVACY POLICY MANAGEMENT ===

// Generate privacy policy
router.post('/privacy-policy/generate', async (req, res) => {
  try {
    const { vertical, country, language, affiliateNetworks, adNetworks } = req.body;
    
    const policy = await complianceEngine.generatePrivacyPolicy({
      vertical,
      country,
      language: language || 'en',
      affiliateNetworks: affiliateNetworks || [],
      adNetworks: adNetworks || []
    });
    
    res.status(201).json({
      success: true,
      data: policy,
      message: 'Privacy policy generated successfully'
    });
  } catch (error) {
    console.error('Error generating privacy policy:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate privacy policy'
    });
  }
});

// Get privacy policy by vertical/country
router.get('/privacy-policy', async (req, res) => {
  try {
    const { vertical, country, language } = req.query;
    
    const policies = await storage.getPrivacyPolicies({
      vertical: vertical as string,
      country: country as string,
      language: language as string
    });
    
    res.json({
      success: true,
      data: policies,
      count: policies.length
    });
  } catch (error) {
    console.error('Error getting privacy policies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get privacy policies'
    });
  }
});

// Get active privacy policy content
router.get('/privacy-policy/:id', async (req, res) => {
  try {
    const policyId = parseInt(req.params.id);
    const policy = await storage.getPrivacyPolicyById(policyId);
    
    if (!policy) {
      return res.status(404).json({
        success: false,
        error: 'Privacy policy not found'
      });
    }
    
    res.json({
      success: true,
      data: policy
    });
  } catch (error) {
    console.error('Error getting privacy policy:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get privacy policy'
    });
  }
});

// === USER DATA CONTROL ===

// Submit data request (access, portability, erasure, etc.)
router.post('/data-request', async (req, res) => {
  try {
    const { userId, email, requestType, description, dataCategories, verticals } = req.body;
    
    const request = await complianceEngine.submitDataRequest({
      userId,
      requestType,
      email,
      country: req.body.country || 'US',
      vertical: req.body.vertical || 'general',
      description
    });
    
    res.status(201).json({
      success: true,
      data: request,
      message: 'Data request submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting data request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit data request'
    });
  }
});

// Get data request status
router.get('/data-request/:requestId', async (req, res) => {
  try {
    const requestId = req.params.requestId;
    const request = await storage.getUserDataRequestByRequestId(requestId);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Data request not found'
      });
    }
    
    res.json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error('Error getting data request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get data request'
    });
  }
});

// Get user's data requests
router.get('/data-request/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const requests = await storage.getUserDataRequestsByUser(userId);
    
    res.json({
      success: true,
      data: requests,
      count: requests.length
    });
  } catch (error) {
    console.error('Error getting user data requests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user data requests'
    });
  }
});

// Alternative endpoint for data-requests (plural) - used by PrivacySettings
router.get('/data-requests', async (req, res) => {
  try {
    const userId = req.query.userId as string || 'user123'; // In production, get from auth
    const requests = await storage.getUserDataRequestsByUser(userId);
    
    res.json({
      success: true,
      data: requests,
      count: requests.length
    });
  } catch (error) {
    console.error('Error getting data requests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get data requests'
    });
  }
});

// Submit data requests (plural) - used by PrivacySettings
router.post('/data-requests', async (req, res) => {
  try {
    const {
      requestType,
      userId,
      email,
      description = '',
      country = 'US',
      vertical = 'general',
      legalBasis = 'gdpr_article_15'
    } = req.body;

    const request = await complianceEngine.submitDataRequest({
      userId,
      requestType,
      email,
      country,
      vertical,
      description
    });
    
    res.status(201).json({
      success: true,
      data: request,
      message: 'Data request submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting data request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit data request'
    });
  }
});

// Download user data export
router.get('/data-export/:requestId/download', async (req, res) => {
  try {
    const requestId = req.params.requestId;
    const request = await storage.getUserDataRequestByRequestId(requestId);
    
    if (!request || request.status !== 'completed') {
      return res.status(404).json({
        success: false,
        error: 'Data export not ready or not found'
      });
    }
    
    if (!request.exportUrl) {
      return res.status(404).json({
        success: false,
        error: 'Export file not available'
      });
    }
    
    // In production, this would stream the file from storage
    res.json({
      success: true,
      data: {
        downloadUrl: request.exportUrl,
        format: request.exportFormat,
        fileSize: request.exportFileSize,
        expiresAt: request.exportExpiresAt
      }
    });
  } catch (error) {
    console.error('Error downloading data export:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download data export'
    });
  }
});

// === AFFILIATE COMPLIANCE ===

// Validate affiliate offer for compliance
router.post('/affiliate/validate', async (req, res) => {
  try {
    const { networkName, offerId, country, vertical } = req.body;
    
    const validation = await complianceEngine.validateAffiliateOffer({
      networkName,
      offerId,
      country,
      vertical
    });
    
    res.json({
      success: true,
      data: validation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error validating affiliate offer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate affiliate offer'
    });
  }
});

// Get affiliate network compliance configuration
router.get('/affiliate/network/:networkName', async (req, res) => {
  try {
    const networkName = req.params.networkName;
    const config = await storage.getAffiliateComplianceByNetwork(networkName);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Affiliate network configuration not found'
      });
    }
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error getting affiliate config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get affiliate configuration'
    });
  }
});

// Create/update affiliate network compliance
router.post('/affiliate/network', async (req, res) => {
  try {
    const validatedData = insertAffiliateComplianceManagementSchema.parse(req.body);
    const config = await storage.createAffiliateCompliance(validatedData);
    
    res.status(201).json({
      success: true,
      data: config,
      message: 'Affiliate compliance configuration created'
    });
  } catch (error) {
    console.error('Error creating affiliate config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create affiliate configuration'
    });
  }
});

// === GEO-RESTRICTION MANAGEMENT ===

// Create geo-restriction rule
router.post('/geo-restriction', async (req, res) => {
  try {
    const validatedData = insertGeoRestrictionManagementSchema.parse(req.body);
    const rule = await storage.createGeoRestriction(validatedData);
    
    res.status(201).json({
      success: true,
      data: rule,
      message: 'Geo-restriction rule created'
    });
  } catch (error) {
    console.error('Error creating geo-restriction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create geo-restriction rule'
    });
  }
});

// Get active geo-restriction rules
router.get('/geo-restriction', async (req, res) => {
  try {
    const { country, vertical, contentType } = req.query;
    
    const rules = await storage.getActiveGeoRestrictions({
      country: country as string,
      vertical: vertical as string,
      contentType: contentType as string
    });
    
    res.json({
      success: true,
      data: rules,
      count: rules.length
    });
  } catch (error) {
    console.error('Error getting geo-restrictions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get geo-restrictions'
    });
  }
});

// Test content against geo-restrictions
router.post('/geo-restriction/test', async (req, res) => {
  try {
    const { country, contentType, vertical, offerId } = req.body;
    
    // Get applicable rules
    const rules = await storage.getActiveGeoRestrictions({
      country,
      vertical,
      contentType
    });
    
    const restrictions = [];
    const disclosures = [];
    
    for (const rule of rules) {
      const targetCountries = rule.targetCountries as string[] || [];
      const excludedCountries = rule.excludedCountries as string[] || [];
      
      if (excludedCountries.includes(country)) {
        restrictions.push({
          ruleId: rule.ruleId,
          action: 'block',
          reason: `Content blocked in ${country}`,
          ruleName: rule.ruleName
        });
      } else if (targetCountries.length > 0 && !targetCountries.includes(country)) {
        restrictions.push({
          ruleId: rule.ruleId,
          action: 'hide',
          reason: `Content not available in ${country}`,
          ruleName: rule.ruleName
        });
      }
    }
    
    res.json({
      success: true,
      data: {
        allowed: restrictions.length === 0,
        restrictions,
        disclosures,
        country,
        rulesChecked: rules.length
      }
    });
  } catch (error) {
    console.error('Error testing geo-restrictions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test geo-restrictions'
    });
  }
});

// === COMPLIANCE AUDIT ===

// Run compliance audit
router.post('/audit/run', async (req, res) => {
  try {
    const { auditType, vertical, country, criteria } = req.body;
    
    const auditId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const audit = await storage.createComplianceAudit({
      auditId,
      auditType,
      vertical,
      country,
      auditCriteria: criteria,
      status: 'scheduled',
      automatedScan: true,
      executedBy: 'system'
    });
    
    res.status(201).json({
      success: true,
      data: audit,
      message: 'Compliance audit scheduled'
    });
  } catch (error) {
    console.error('Error running compliance audit:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run compliance audit'
    });
  }
});

// Get audit results
router.get('/audit/:auditId', async (req, res) => {
  try {
    const auditId = req.params.auditId;
    const audit = await storage.getComplianceAuditByAuditId(auditId);
    
    if (!audit) {
      return res.status(404).json({
        success: false,
        error: 'Audit not found'
      });
    }
    
    res.json({
      success: true,
      data: audit
    });
  } catch (error) {
    console.error('Error getting audit:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get audit'
    });
  }
});

// Get recent audits
router.get('/audit', async (req, res) => {
  try {
    const { auditType, vertical, country, limit } = req.query;
    
    const audits = await storage.getComplianceAudits({
      auditType: auditType as string,
      vertical: vertical as string,
      country: country as string,
      limit: limit ? parseInt(limit as string) : 50
    });
    
    res.json({
      success: true,
      data: audits,
      count: audits.length
    });
  } catch (error) {
    console.error('Error getting audits:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get audits'
    });
  }
});

// === RBAC & ADMIN ACCESS ===

// Grant compliance access
router.post('/rbac/grant', async (req, res) => {
  try {
    const validatedData = insertComplianceRbacManagementSchema.parse(req.body);
    const access = await storage.createComplianceRbac(validatedData);
    
    res.status(201).json({
      success: true,
      data: access,
      message: 'Compliance access granted'
    });
  } catch (error) {
    console.error('Error granting compliance access:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to grant compliance access'
    });
  }
});

// Get user's compliance permissions
router.get('/rbac/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const permissions = await storage.getComplianceRbacByUser(userId);
    
    res.json({
      success: true,
      data: permissions,
      count: permissions.length
    });
  } catch (error) {
    console.error('Error getting compliance permissions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get compliance permissions'
    });
  }
});

// === HEALTH CHECK ===

router.get('/health', async (req, res) => {
  try {
    const health = await complianceEngine.healthCheck();
    
    res.json({
      success: true,
      data: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting compliance health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get compliance health'
    });
  }
});

// === COMPLIANCE REPORTING ===

// Generate compliance report
router.get('/report', async (req, res) => {
  try {
    const { type, vertical, country, dateRange } = req.query;
    
    // Get compliance metrics
    const totalConsents = await storage.getConsentMetrics({
      country: country as string,
      vertical: vertical as string,
      dateRange: dateRange as string
    });
    
    const dataRequests = await storage.getDataRequestMetrics({
      country: country as string,
      dateRange: dateRange as string
    });
    
    const auditSummary = await storage.getAuditSummary({
      vertical: vertical as string,
      country: country as string,
      dateRange: dateRange as string
    });
    
    res.json({
      success: true,
      data: {
        reportType: type,
        vertical,
        country,
        dateRange,
        metrics: {
          totalConsents,
          dataRequests,
          auditSummary
        },
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error generating compliance report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate compliance report'
    });
  }
});

export default router;