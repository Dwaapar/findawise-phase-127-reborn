import React, { useState, useEffect } from 'react';
import { X, Settings, Shield, Info } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Switch } from './ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';

interface ConsentBannerProps {
  vertical?: string;
  position?: 'top' | 'bottom' | 'modal';
  theme?: 'light' | 'dark' | 'auto';
  onConsentChange?: (consents: ConsentData) => void;
  onClose?: () => void;
}

interface ConsentData {
  cookiesConsent: 'granted' | 'denied' | 'pending';
  analyticsConsent: 'granted' | 'denied' | 'pending';
  marketingConsent: 'granted' | 'denied' | 'pending';
  personalizationConsent: 'granted' | 'denied' | 'pending';
  affiliateConsent: 'granted' | 'denied' | 'pending';
  emailConsent: 'granted' | 'denied' | 'pending';
  pushConsent: 'granted' | 'denied' | 'pending';
}

interface ConsentBannerContent {
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
    affiliate: { title: string; description: string; required: boolean };
    email: { title: string; description: string; required: boolean };
    push: { title: string; description: string; required: boolean };
  };
}

interface ComplianceFramework {
  name: string;
  countries: string[];
  requirements: {
    consent: boolean;
    optOut: boolean;
    ageVerification: boolean;
    explicitConsent: boolean;
  };
}

export default function ConsentBanner({
  vertical = 'general',
  position = 'bottom',
  theme = 'auto',
  onConsentChange,
  onClose
}: ConsentBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [framework, setFramework] = useState<string>('GENERAL');
  const [country, setCountry] = useState<string>('US');
  const [bannerContent, setBannerContent] = useState<ConsentBannerContent | null>(null);
  const [consents, setConsents] = useState<ConsentData>({
    cookiesConsent: 'pending',
    analyticsConsent: 'pending',
    marketingConsent: 'pending',
    personalizationConsent: 'pending',
    affiliateConsent: 'pending',
    emailConsent: 'pending',
    pushConsent: 'pending'
  });
  const [loading, setLoading] = useState(true);

  // Check if user has already given consent
  useEffect(() => {
    const checkExistingConsent = async () => {
      try {
        // Check local storage first
        const savedConsent = localStorage.getItem('findawise-consent');
        if (savedConsent) {
          const parsed = JSON.parse(savedConsent);
          if (parsed.timestamp && Date.now() - parsed.timestamp < 365 * 24 * 60 * 60 * 1000) {
            // Consent is still valid (within 1 year)
            setConsents(parsed.consents);
            setLoading(false);
            return;
          }
        }

        // Fetch user's current consent status from API
        const response = await fetch('/api/compliance/consent/status', {
          method: 'GET',
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          if (data.hasConsent && !data.isExpired) {
            setConsents(data.consents);
            setIsVisible(false);
          } else {
            setIsVisible(true);
          }
        } else {
          setIsVisible(true);
        }
      } catch (error) {
        console.error('Error checking consent status:', error);
        setIsVisible(true);
      }
      setLoading(false);
    };

    checkExistingConsent();
  }, []);

  // Detect user's location and applicable framework
  useEffect(() => {
    const detectFramework = async () => {
      try {
        const response = await fetch('/api/compliance/detect-framework', {
          method: 'GET',
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          setFramework(data.framework);
          setCountry(data.country);
          setBannerContent(data.bannerContent);
        }
      } catch (error) {
        console.error('Error detecting framework:', error);
        // Fallback to default
        setFramework('GENERAL');
        setCountry('US');
        setBannerContent(getDefaultBannerContent());
      }
    };

    detectFramework();
  }, []);

  const getDefaultBannerContent = (): ConsentBannerContent => ({
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
      },
      affiliate: {
        title: 'Affiliate Tracking',
        description: 'These cookies track affiliate referrals and commissions.',
        required: false
      },
      email: {
        title: 'Email Communications',
        description: 'Permission to send you emails about products and services.',
        required: false
      },
      push: {
        title: 'Push Notifications',
        description: 'Permission to send you push notifications.',
        required: false
      }
    }
  });

  const handleAcceptAll = async () => {
    const newConsents: ConsentData = {
      cookiesConsent: 'granted',
      analyticsConsent: 'granted',
      marketingConsent: 'granted',
      personalizationConsent: 'granted',
      affiliateConsent: 'granted',
      emailConsent: 'granted',
      pushConsent: 'granted'
    };

    await saveConsent(newConsents);
  };

  const handleRejectAll = async () => {
    const newConsents: ConsentData = {
      cookiesConsent: 'denied',
      analyticsConsent: 'denied',
      marketingConsent: 'denied',
      personalizationConsent: 'denied',
      affiliateConsent: 'denied',
      emailConsent: 'denied',
      pushConsent: 'denied'
    };

    await saveConsent(newConsents);
  };

  const handleSaveSettings = async () => {
    await saveConsent(consents);
    setShowSettings(false);
  };

  const saveConsent = async (consentData: ConsentData) => {
    try {
      // Save to API
      const response = await fetch('/api/compliance/consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          vertical,
          country,
          legalFramework: framework,
          ...consentData,
          consentMethod: 'banner',
          consentVersion: '1.0'
        })
      });

      if (response.ok) {
        // Save to local storage for faster subsequent checks
        localStorage.setItem('findawise-consent', JSON.stringify({
          consents: consentData,
          timestamp: Date.now(),
          framework,
          country
        }));

        setConsents(consentData);
        setIsVisible(false);
        
        if (onConsentChange) {
          onConsentChange(consentData);
        }
        
        if (onClose) {
          onClose();
        }

        // Reload page to apply consent settings
        window.location.reload();
      } else {
        console.error('Failed to save consent');
      }
    } catch (error) {
      console.error('Error saving consent:', error);
    }
  };

  const toggleConsent = (type: keyof ConsentData) => {
    if (type === 'cookiesConsent') return; // Essential cookies cannot be toggled
    
    setConsents(prev => ({
      ...prev,
      [type]: prev[type] === 'granted' ? 'denied' : 'granted'
    }));
  };

  if (loading || !isVisible || !bannerContent) {
    return null;
  }

  const bannerClasses = `
    fixed z-50 left-0 right-0 bg-white dark:bg-gray-900 border shadow-lg
    ${position === 'top' ? 'top-0 border-b' : 'bottom-0 border-t'}
    ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}
  `;

  if (position === 'modal') {
    return (
      <Dialog open={isVisible} onOpenChange={() => {}}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {bannerContent.title}
            </DialogTitle>
          </DialogHeader>
          <ConsentBannerContent />
        </DialogContent>
      </Dialog>
    );
  }

  const ConsentBannerContent = () => (
    <div className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-lg">{bannerContent?.title}</h3>
            <Badge variant="outline" className="text-xs">
              {framework}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            {bannerContent?.message}
          </p>
          
          <div className="flex flex-wrap gap-2 items-center">
            <Button onClick={handleAcceptAll} className="bg-blue-600 hover:bg-blue-700">
              {bannerContent?.acceptButton}
            </Button>
            <Button variant="outline" onClick={handleRejectAll}>
              {bannerContent?.rejectButton}
            </Button>
            <Button variant="ghost" onClick={() => setShowSettings(true)}>
              <Settings className="h-4 w-4 mr-2" />
              {bannerContent?.settingsButton}
            </Button>
            <a 
              href={bannerContent?.privacyPolicyUrl} 
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Info className="h-3 w-3" />
              {bannerContent?.learnMoreButton}
            </a>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsVisible(false)}
          className="shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Settings Modal */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Cookie & Privacy Settings
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Manage your consent preferences for different types of cookies and data processing.
            </div>

            {/* Essential Cookies */}
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{bannerContent?.categories.essential.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">{bannerContent?.categories.essential.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">Required</Badge>
                  <Switch checked={true} disabled={true} />
                </div>
              </div>
            </Card>

            {/* Analytics Cookies */}
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{bannerContent?.categories.analytics.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">{bannerContent?.categories.analytics.description}</p>
                </div>
                <Switch 
                  checked={consents.analyticsConsent === 'granted'} 
                  onCheckedChange={() => toggleConsent('analyticsConsent')}
                />
              </div>
            </Card>

            {/* Marketing Cookies */}
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{bannerContent?.categories.marketing.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">{bannerContent?.categories.marketing.description}</p>
                </div>
                <Switch 
                  checked={consents.marketingConsent === 'granted'} 
                  onCheckedChange={() => toggleConsent('marketingConsent')}
                />
              </div>
            </Card>

            {/* Customization Cookies */}
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{bannerContent?.categories.customization.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">{bannerContent?.categories.customization.description}</p>
                </div>
                <Switch 
                  checked={consents.personalizationConsent === 'granted'} 
                  onCheckedChange={() => toggleConsent('personalizationConsent')}
                />
              </div>
            </Card>

            {/* Affiliate Tracking */}
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{bannerContent?.categories.affiliate.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">{bannerContent?.categories.affiliate.description}</p>
                </div>
                <Switch 
                  checked={consents.affiliateConsent === 'granted'} 
                  onCheckedChange={() => toggleConsent('affiliateConsent')}
                />
              </div>
            </Card>

            {/* Email Communications */}
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{bannerContent?.categories.email.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">{bannerContent?.categories.email.description}</p>
                </div>
                <Switch 
                  checked={consents.emailConsent === 'granted'} 
                  onCheckedChange={() => toggleConsent('emailConsent')}
                />
              </div>
            </Card>

            {/* Push Notifications */}
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{bannerContent?.categories.push.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">{bannerContent?.categories.push.description}</p>
                </div>
                <Switch 
                  checked={consents.pushConsent === 'granted'} 
                  onCheckedChange={() => toggleConsent('pushConsent')}
                />
              </div>
            </Card>

            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={handleSaveSettings} className="flex-1">
                Save Preferences
              </Button>
              <Button variant="outline" onClick={() => setShowSettings(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  return (
    <div className={bannerClasses}>
      <ConsentBannerContent />
    </div>
  );
}