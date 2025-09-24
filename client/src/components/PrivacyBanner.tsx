import React, { useState, useEffect } from 'react';
import { X, Shield, Cookie, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Affiliate Disclaimer Component - Required by FTC Guidelines
export function AffiliateDisclaimer() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-amber-800 mb-1">Affiliate Disclosure</p>
          <p className="text-amber-700">
            This website contains affiliate links. We may earn a commission from purchases made through these links at no additional cost to you. All recommendations are based on extensive research and real-world testing by our security experts. Our editorial content is not influenced by affiliate partnerships.
          </p>
        </div>
      </div>
    </div>
  );
}

// GDPR/CCPA Compliant Privacy Banner Component
export default function PrivacyBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true, // Always required
    analytics: false,
    marketing: false,
    personalization: false
  });

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('privacy-consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const fullConsent = {
      necessary: true,
      analytics: true,
      marketing: true,
      personalization: true,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('privacy-consent', JSON.stringify(fullConsent));
    setIsVisible(false);
    
    // Initialize analytics and tracking
    initializeTracking(fullConsent);
  };

  const handleRejectAll = () => {
    const minimalConsent = {
      necessary: true,
      analytics: false,
      marketing: false,
      personalization: false,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('privacy-consent', JSON.stringify(minimalConsent));
    setIsVisible(false);
    
    // Only initialize essential functionality
    initializeTracking(minimalConsent);
  };

  const handleSavePreferences = () => {
    const customConsent = {
      ...preferences,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('privacy-consent', JSON.stringify(customConsent));
    setIsVisible(false);
    
    initializeTracking(customConsent);
  };

  const initializeTracking = (consent: any) => {
    // Initialize tracking based on consent
    if (consent.analytics) {
      // Initialize analytics tracking
      console.log('Analytics tracking enabled');
    }
    
    if (consent.marketing) {
      // Initialize marketing pixels
      console.log('Marketing tracking enabled');
    }
    
    if (consent.personalization) {
      // Initialize personalization engine
      console.log('Personalization enabled');
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t shadow-lg">
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Shield className="h-8 w-8 text-blue-600 flex-shrink-0 mt-1" />
            
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Cookie className="h-5 w-5" />
                Your Privacy Matters
              </h3>
              
              <p className="text-gray-600 mb-4">
                We use cookies and similar technologies to provide you with a personalized experience, 
                analyze site usage, and assist in our marketing efforts. We also share information about 
                your use of our site with our social media, advertising, and analytics partners.
              </p>
              
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="font-medium mb-2">Cookie Categories:</h4>
                  <div className="space-y-2 text-sm">
                    <label className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={preferences.necessary} 
                        disabled 
                        className="rounded" 
                      />
                      <span>Necessary (Required)</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={preferences.analytics} 
                        onChange={(e) => setPreferences({...preferences, analytics: e.target.checked})}
                        className="rounded" 
                      />
                      <span>Analytics & Performance</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={preferences.marketing} 
                        onChange={(e) => setPreferences({...preferences, marketing: e.target.checked})}
                        className="rounded" 
                      />
                      <span>Marketing & Advertising</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={preferences.personalization} 
                        onChange={(e) => setPreferences({...preferences, personalization: e.target.checked})}
                        className="rounded" 
                      />
                      <span>Personalization</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Your Rights:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Access your personal data</li>
                    <li>• Correct inaccurate information</li>
                    <li>• Delete your data</li>
                    <li>• Opt-out of marketing communications</li>
                    <li>• Data portability</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={handleAcceptAll}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Accept All Cookies
                </Button>
                <Button 
                  onClick={handleRejectAll}
                  variant="outline"
                  className="border-gray-300"
                >
                  Reject All
                </Button>
                <Button 
                  onClick={handleSavePreferences}
                  variant="outline"
                  className="border-gray-300"
                >
                  Save Preferences
                </Button>
              </div>
              
              <p className="text-xs text-gray-500 mt-3">
                By clicking "Accept All", you consent to our use of cookies. 
                Read our <a href="/privacy-policy" className="text-blue-600 underline">Privacy Policy</a> and 
                <a href="/cookie-policy" className="text-blue-600 underline ml-1">Cookie Policy</a> for more information.
              </p>
            </div>
            
            <button 
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}