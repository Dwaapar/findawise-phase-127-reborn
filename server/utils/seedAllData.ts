import { storage } from "../storage";
import { localizationStorage } from "../lib/localizationStorage";
import { initialTranslationKeys } from "../../client/src/data/initialTranslations";

export async function seedAllSystemData() {
  console.log('🌱 Starting comprehensive system data seeding...');
  
  try {
    // 1. Seed Languages
    console.log('📚 Seeding languages...');
    const languages = [
      { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr', region: 'US', isDefault: true, isActive: true, fallbackLanguage: 'en', completeness: 100 },
      { code: 'es', name: 'Spanish', nativeName: 'Español', direction: 'ltr', region: 'ES', isDefault: false, isActive: true, fallbackLanguage: 'en', completeness: 85 },
      { code: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr', region: 'FR', isDefault: false, isActive: true, fallbackLanguage: 'en', completeness: 70 },
      { code: 'de', name: 'German', nativeName: 'Deutsch', direction: 'ltr', region: 'DE', isDefault: false, isActive: true, fallbackLanguage: 'en', completeness: 65 },
      { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', direction: 'ltr', region: 'IN', isDefault: false, isActive: true, fallbackLanguage: 'en', completeness: 45 }
    ];
    
    for (const lang of languages) {
      try {
        await localizationStorage.createLanguage(lang);
      } catch (error) {
        console.log(`Language ${lang.code} may already exist, continuing...`);
      }
    }

    // 2. Seed Translation Keys
    console.log('🔑 Seeding translation keys...');
    for (const key of initialTranslationKeys) {
      try {
        await localizationStorage.createTranslationKey(key);
      } catch (error) {
        console.log(`Translation key ${key.keyPath} may already exist, continuing...`);
      }
    }

    // 3. Seed Experiments
    console.log('🧪 Seeding A/B testing experiments...');
    const experiments = [
      {
        slug: 'hero-cta-test',
        name: 'Hero CTA Button Test',
        description: 'Testing different CTA button colors and text',
        type: 'cta',
        targetEntity: 'homepage',
        trafficAllocation: 100,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        createdBy: 'admin',
        metadata: { priority: 'high' }
      },
      {
        slug: 'pricing-page-test',
        name: 'Pricing Page Layout Test',
        description: 'Testing different pricing layouts',
        type: 'page',
        targetEntity: 'pricing',
        trafficAllocation: 50,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        createdBy: 'admin',
        metadata: { priority: 'medium' }
      }
    ];

    for (const exp of experiments) {
      try {
        const experiment = await storage.createExperiment(exp);
        
        // Create variants for each experiment
        if (exp.slug === 'hero-cta-test') {
          await storage.createExperimentVariant({
            experimentId: experiment.id,
            slug: 'control',
            name: 'Control (Green Button)',
            description: 'Original green CTA button',
            trafficPercentage: 50,
            configuration: { buttonColor: '#22c55e', ctaText: 'Get Started Now' },
            isControl: true
          });
          
          await storage.createExperimentVariant({
            experimentId: experiment.id,
            slug: 'variant-a',
            name: 'Variant A (Red Button)',
            description: 'Red CTA button with urgency',
            trafficPercentage: 50,
            configuration: { buttonColor: '#ef4444', ctaText: 'Start Building Wealth Today' },
            isControl: false
          });
        } else if (exp.slug === 'pricing-page-test') {
          await storage.createExperimentVariant({
            experimentId: experiment.id,
            slug: 'control',
            name: 'Control (3 Column)',
            description: 'Standard 3-column pricing layout',
            trafficPercentage: 50,
            configuration: { layout: 'three-column', highlight: 'middle' },
            isControl: true
          });
          
          await storage.createExperimentVariant({
            experimentId: experiment.id,
            slug: 'variant-a',
            name: 'Variant A (2 Column)',
            description: 'Simplified 2-column pricing',
            trafficPercentage: 50,
            configuration: { layout: 'two-column', highlight: 'premium' },
            isControl: false
          });
        }
      } catch (error) {
        console.log(`Experiment ${exp.slug} may already exist, continuing...`);
      }
    }

    // 4. Seed Lead Magnets
    console.log('🧲 Seeding lead magnets...');
    const leadMagnets = [
      {
        slug: 'wealth-guide',
        name: 'Ultimate Wealth Building Guide',
        description: 'A comprehensive PDF guide to building sustainable wealth',
        type: 'pdf',
        category: 'wealth',
        emotion: 'confidence',
        fileUrl: '/assets/wealth-building-guide.pdf',
        downloadName: 'wealth-building-guide.pdf',
        leadScore: 50,
        metadata: { pages: 25, fileSize: '2.1MB' }
      },
      {
        slug: 'health-checklist',
        name: '30-Day Health Transformation Checklist',
        description: 'Daily checklist for transforming your health in 30 days',
        type: 'checklist',
        category: 'health',
        emotion: 'relief',
        fileUrl: '/assets/health-checklist.pdf',
        downloadName: 'health-transformation-checklist.pdf',
        leadScore: 35,
        metadata: { days: 30, habits: 15 }
      },
      {
        slug: 'productivity-toolkit',
        name: 'Productivity Mastery Toolkit',
        description: 'Templates and tools for maximum productivity',
        type: 'toolkit',
        category: 'productivity',
        emotion: 'excitement',
        fileUrl: '/assets/productivity-toolkit.zip',
        downloadName: 'productivity-toolkit.zip',
        leadScore: 45,
        metadata: { templates: 12, tools: 8 }
      }
    ];

    for (const magnet of leadMagnets) {
      try {
        await storage.createLeadMagnet(magnet);
      } catch (error) {
        console.log(`Lead magnet ${magnet.slug} may already exist, continuing...`);
      }
    }

    // 5. Seed Lead Forms
    console.log('📝 Seeding lead forms...');
    const leadForms = [
      {
        slug: 'newsletter-signup',
        name: 'Newsletter Signup',
        description: 'Subscribe to our weekly insights',
        type: 'email-only',
        position: 'inline',
        isActive: true,
        fields: [
          { name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'Enter your email...' }
        ],
        settings: {
          submitText: 'Get Weekly Insights',
          successMessage: 'Thanks! Check your email for confirmation.',
          redirectUrl: '/thank-you'
        },
        antiSpam: {
          honeypot: true,
          rateLimit: 5,
          requireDoubleOptin: true
        }
      },
      {
        slug: 'wealth-guide-form',
        name: 'Wealth Guide Download Form',
        description: 'Get the Ultimate Wealth Building Guide',
        type: 'lead-magnet',
        position: 'popup',
        isActive: true,
        fields: [
          { name: 'firstName', label: 'First Name', type: 'text', required: true, placeholder: 'Your first name...' },
          { name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'Your email address...' }
        ],
        settings: {
          submitText: 'Download Free Guide',
          successMessage: 'Your guide is being sent to your email!',
          redirectUrl: '/download/wealth-guide'
        },
        antiSpam: {
          honeypot: true,
          rateLimit: 3,
          requireDoubleOptin: false
        }
      }
    ];

    for (const form of leadForms) {
      try {
        await storage.createLeadForm(form);
      } catch (error) {
        console.log(`Lead form ${form.slug} may already exist, continuing...`);
      }
    }

    // 6. Seed User Sessions with Analytics Data
    console.log('👥 Seeding user sessions and analytics...');
    const sessions = [];
    for (let i = 0; i < 50; i++) {
      const sessionId = `session_${Date.now()}_${i}`;
      const session = {
        sessionId,
        userId: `user_${i}`,
        startTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Last 7 days
        lastActivity: new Date(),
        totalTimeOnSite: Math.floor(Math.random() * 300000), // 0-5 minutes
        pageViews: Math.floor(Math.random() * 10) + 1,
        interactions: Math.floor(Math.random() * 15),
        deviceInfo: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          screen: '1920x1080',
          mobile: Math.random() > 0.7
        },
        location: {
          country: ['US', 'CA', 'UK', 'DE', 'FR'][Math.floor(Math.random() * 5)],
          region: 'Unknown'
        },
        preferences: {},
        segment: ['new_visitor', 'returning_visitor', 'high_value'][Math.floor(Math.random() * 3)],
        personalizationFlags: {}
      };
      
      try {
        await storage.createUserSession(session);
        sessions.push(session);
      } catch (error) {
        console.log(`Session ${sessionId} may already exist, continuing...`);
      }
    }

    // 7. Seed Behavior Events
    console.log('📊 Seeding behavior events...');
    const eventTypes = ['page_view', 'click', 'scroll', 'form_submit', 'download', 'exit'];
    const pages = ['homepage', 'wealth-building', 'health-wellness', 'productivity', 'about'];
    
    for (let i = 0; i < 200; i++) {
      const session = sessions[Math.floor(Math.random() * sessions.length)];
      if (!session) continue;
      
      const event = {
        sessionId: session.sessionId,
        eventType: eventTypes[Math.floor(Math.random() * eventTypes.length)],
        eventData: {
          value: Math.random() * 100,
          metadata: { source: 'organic' }
        },
        pageSlug: pages[Math.floor(Math.random() * pages.length)],
        userId: session.userId
      };
      
      try {
        await storage.trackBehaviorEvent(event);
      } catch (error) {
        console.log('Behavior event creation failed, continuing...');
      }
    }

    // 8. Generate Sample Affiliate Clicks
    console.log('🖱️ Seeding affiliate clicks...');
    const offers = await storage.getAffiliateOffers();
    
    for (let i = 0; i < 100; i++) {
      const offer = offers[Math.floor(Math.random() * offers.length)];
      if (!offer) continue;
      
      const session = sessions[Math.floor(Math.random() * sessions.length)];
      if (!session) continue;
      
      const click = {
        offerId: offer.id,
        sessionId: session.sessionId,
        userAgent: session.deviceInfo?.userAgent || 'Unknown',
        ipAddress: '192.168.1.' + Math.floor(Math.random() * 254),
        referrerUrl: 'https://google.com',
        sourcePage: pages[Math.floor(Math.random() * pages.length)],
        conversionTracked: Math.random() > 0.8,
        metadata: { campaign: 'organic' }
      };
      
      try {
        await storage.trackAffiliateClick(click);
      } catch (error) {
        console.log('Affiliate click tracking failed, continuing...');
      }
    }

    // 9. Seed Federation System Data
    console.log('🧠 Seeding Empire Brain Federation System...');
    
    // Create sample neurons
    const neurons = [
      {
        neuronId: 'findawise-core',
        name: 'Findawise Core - Central Config',
        type: 'page-generator',
        url: 'http://localhost:5000',
        status: 'active',
        version: '1.0.0',
        supportedFeatures: ['dynamic-pages', 'emotion-theming', 'interactive-modules', 'seo-optimization'],
        healthScore: 95,
        uptime: 86400,
        apiKey: 'fw-core-' + Math.random().toString(36).substring(2, 15),
        metadata: {
          location: 'primary-server',
          maintainer: 'findawise-team',
          criticality: 'high'
        }
      },
      {
        neuronId: 'affiliate-engine',
        name: 'Affiliate Management Engine',
        type: 'affiliate',
        url: 'http://localhost:5000/affiliate',
        status: 'active',
        version: '2.1.0',
        supportedFeatures: ['click-tracking', 'conversion-analytics', 'multi-network-support'],
        healthScore: 88,
        uptime: 82800,
        apiKey: 'aff-eng-' + Math.random().toString(36).substring(2, 15),
        metadata: {
          location: 'affiliate-cluster',
          maintainer: 'affiliate-team',
          criticality: 'high'
        }
      },
      {
        neuronId: 'analytics-brain',
        name: 'Analytics Intelligence Brain',
        type: 'analytics',
        url: 'http://localhost:5000/analytics',
        status: 'active',
        version: '3.0.0',
        supportedFeatures: ['cross-device-tracking', 'behavioral-analysis', 'predictive-insights'],
        healthScore: 92,
        uptime: 85200,
        apiKey: 'ana-brain-' + Math.random().toString(36).substring(2, 15),
        metadata: {
          location: 'analytics-cluster',
          maintainer: 'data-team',
          criticality: 'critical'
        }
      },
      {
        neuronId: 'localization-hub',
        name: 'Multi-Language Localization Hub',
        type: 'localization',
        url: 'http://localhost:5000/localization',
        status: 'active',
        version: '1.5.0',
        supportedFeatures: ['multi-language', 'auto-translation', 'cultural-adaptation'],
        healthScore: 90,
        uptime: 79200,
        apiKey: 'loc-hub-' + Math.random().toString(36).substring(2, 15),
        metadata: {
          location: 'content-cluster',
          maintainer: 'localization-team',
          criticality: 'medium'
        }
      },
      {
        neuronId: 'ab-testing-lab',
        name: 'A/B Testing Laboratory',
        type: 'experimentation',
        url: 'http://localhost:5000/experiments',
        status: 'active',
        version: '1.3.0',
        supportedFeatures: ['ab-testing', 'multivariate-testing', 'statistical-analysis'],
        healthScore: 85,
        uptime: 76800,
        apiKey: 'ab-lab-' + Math.random().toString(36).substring(2, 15),
        metadata: {
          location: 'testing-cluster',
          maintainer: 'growth-team',
          criticality: 'medium'
        }
      }
    ];

    for (const neuron of neurons) {
      try {
        const registeredNeuron = await storage.registerNeuron(neuron);
        
        // Create initial config for each neuron
        await storage.createNeuronConfig({
          neuronId: registeredNeuron.neuronId,
          configVersion: '1.0.0',
          configData: {
            settings: {
              maxConcurrentRequests: 100,
              timeoutMs: 30000,
              retryAttempts: 3
            },
            features: neuron.supportedFeatures,
            environment: 'production'
          },
          isActive: true,
          deployedBy: 'system',
          deployedAt: new Date(),
          notes: 'Initial configuration deployment'
        });

        // Generate sample analytics for each neuron
        const dates = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          return date;
        });

        for (const date of dates) {
          await storage.updateNeuronAnalytics({
            neuronId: registeredNeuron.neuronId,
            date,
            pageViews: Math.floor(Math.random() * 1000) + 500,
            uniqueVisitors: Math.floor(Math.random() * 300) + 150,
            conversions: Math.floor(Math.random() * 50) + 10,
            revenue: (Math.random() * 500 + 100).toFixed(2),
            uptime: Math.floor(Math.random() * 3600) + 82800, // 23+ hours
            errorCount: Math.floor(Math.random() * 5),
            averageResponseTime: Math.floor(Math.random() * 100) + 50
          });
        }

        // Create recent status updates
        await storage.updateNeuronStatus({
          neuronId: registeredNeuron.neuronId,
          status: 'active',
          healthScore: neuron.healthScore,
          uptime: neuron.uptime,
          stats: {
            memoryUsage: Math.floor(Math.random() * 30) + 40, // 40-70%
            cpuUsage: Math.floor(Math.random() * 20) + 10, // 10-30%
            diskUsage: Math.floor(Math.random() * 15) + 15, // 15-30%
            activeConnections: Math.floor(Math.random() * 50) + 20
          },
          metadata: {
            lastHeartbeat: new Date(),
            version: neuron.version
          }
        });

      } catch (error) {
        console.log(`Error seeding neuron ${neuron.neuronId}:`, error);
      }
    }

    // Create empire configuration
    const empireConfigs = [
      {
        configKey: 'federation.heartbeat.interval',
        configValue: 30000, // 30 seconds
        description: 'Interval for neuron heartbeat updates in milliseconds',
        category: 'federation',
        version: '1.0',
        updatedBy: 'system'
      },
      {
        configKey: 'federation.health.threshold.warning',
        configValue: 70,
        description: 'Health score threshold for warning alerts',
        category: 'federation',
        version: '1.0',
        updatedBy: 'system'
      },
      {
        configKey: 'federation.health.threshold.critical',
        configValue: 50,
        description: 'Health score threshold for critical alerts',
        category: 'federation',
        version: '1.0',
        updatedBy: 'system'
      },
      {
        configKey: 'analytics.retention.days',
        configValue: 90,
        description: 'Number of days to retain detailed analytics data',
        category: 'analytics',
        version: '1.0',
        updatedBy: 'system'
      },
      {
        configKey: 'security.api.rate.limit',
        configValue: 1000,
        description: 'API rate limit per hour per neuron',
        category: 'security',
        version: '1.0',
        updatedBy: 'system'
      }
    ];

    for (const config of empireConfigs) {
      try {
        await storage.setEmpireConfig(config);
      } catch (error) {
        console.log(`Error setting empire config ${config.configKey}:`, error);
      }
    }

    console.log('✅ Comprehensive system data seeding completed successfully!');
    
    return {
      success: true,
      seeded: {
        languages: languages.length,
        translationKeys: initialTranslationKeys.length,
        experiments: experiments.length,
        leadMagnets: leadMagnets.length,
        leadForms: leadForms.length,
        userSessions: sessions.length,
        behaviorEvents: 200,
        affiliateClicks: 100,
        neurons: neurons.length,
        neuronConfigs: neurons.length,
        neuronAnalytics: neurons.length * 7, // 7 days per neuron
        empireConfigs: empireConfigs.length
      }
    };
    
  } catch (error) {
    console.error('❌ Error seeding system data:', error);
    throw error;
  }
}