import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Shield, Cookie, Eye, Globe, ExternalLink, X, Settings } from "lucide-react";

interface PrivacyPreferences {
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
  affiliate: boolean;
}

export function TravelPrivacyBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<PrivacyPreferences>({
    analytics: false,
    marketing: false,
    personalization: false,
    affiliate: false
  });

  useEffect(() => {
    // Check if user has already made privacy choices
    const savedPreferences = localStorage.getItem('travel-privacy-preferences');
    const bannerDismissed = localStorage.getItem('travel-privacy-banner-dismissed');
    
    if (!bannerDismissed) {
      setIsVisible(true);
    }
    
    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences));
    }
  }, []);

  const savePreferences = (newPreferences: PrivacyPreferences) => {
    setPreferences(newPreferences);
    localStorage.setItem('travel-privacy-preferences', JSON.stringify(newPreferences));
    localStorage.setItem('travel-privacy-banner-dismissed', 'true');
    
    // Trigger analytics configuration update
    window.dispatchEvent(new CustomEvent('privacy-preferences-updated', {
      detail: newPreferences
    }));
  };

  const acceptAll = () => {
    const allAccepted = {
      analytics: true,
      marketing: true,
      personalization: true,
      affiliate: true
    };
    savePreferences(allAccepted);
    setIsVisible(false);
  };

  const acceptNecessary = () => {
    const necessaryOnly = {
      analytics: false,
      marketing: false,
      personalization: false,
      affiliate: false
    };
    savePreferences(necessaryOnly);
    setIsVisible(false);
  };

  const saveCustomPreferences = () => {
    savePreferences(preferences);
    setIsVisible(false);
    setShowSettings(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-black/50 backdrop-blur-sm">
      <Card className="max-w-4xl mx-auto">
        {!showSettings ? (
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Shield className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">Your Privacy Matters</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  We use cookies and similar technologies to enhance your travel planning experience, 
                  provide personalized recommendations, and show relevant offers. Your data helps us 
                  deliver better service and support our content through affiliate partnerships.
                </p>
                
                <div className="flex flex-wrap gap-3">
                  <Button onClick={acceptAll} className="bg-blue-600 hover:bg-blue-700">
                    Accept All
                  </Button>
                  <Button onClick={acceptNecessary} variant="outline">
                    Necessary Only
                  </Button>
                  <Button 
                    onClick={() => setShowSettings(true)} 
                    variant="ghost"
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Customize Settings
                  </Button>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
                className="flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        ) : (
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg">Privacy Settings</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <Tabs defaultValue="preferences" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="preferences">Preferences</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="rights">Your Rights</TabsTrigger>
              </TabsList>

              <TabsContent value="preferences" className="mt-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label className="text-base font-medium">Analytics Cookies</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Help us understand how you use our platform to improve the experience.
                      </p>
                    </div>
                    <Switch
                      checked={preferences.analytics}
                      onCheckedChange={(checked) => 
                        setPreferences(prev => ({ ...prev, analytics: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label className="text-base font-medium">Personalization</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Customize content and recommendations based on your travel preferences.
                      </p>
                    </div>
                    <Switch
                      checked={preferences.personalization}
                      onCheckedChange={(checked) => 
                        setPreferences(prev => ({ ...prev, personalization: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label className="text-base font-medium">Marketing & Communication</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Receive travel tips, exclusive deals, and newsletter updates.
                      </p>
                    </div>
                    <Switch
                      checked={preferences.marketing}
                      onCheckedChange={(checked) => 
                        setPreferences(prev => ({ ...prev, marketing: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label className="text-base font-medium">Affiliate Partnerships</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Show personalized travel deals and offers from our partners.
                      </p>
                    </div>
                    <Switch
                      checked={preferences.affiliate}
                      onCheckedChange={(checked) => 
                        setPreferences(prev => ({ ...prev, affiliate: checked }))
                      }
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="details" className="mt-6">
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Cookie className="h-4 w-4 text-orange-600" />
                      <span className="font-medium">Essential Cookies</span>
                      <Badge variant="secondary">Always Active</Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Required for basic functionality, security, and user authentication.
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Analytics & Performance</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Track usage patterns, page views, and user interactions to improve our service.
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Third-Party Services</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Integration with booking platforms, payment processors, and affiliate partners.
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="rights" className="mt-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Your Data Rights (GDPR/CCPA)</h4>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li>• <strong>Access:</strong> Request a copy of your personal data</li>
                    <li>• <strong>Rectification:</strong> Correct inaccurate personal data</li>
                    <li>• <strong>Erasure:</strong> Request deletion of your personal data</li>
                    <li>• <strong>Portability:</strong> Receive your data in a structured format</li>
                    <li>• <strong>Object:</strong> Opt-out of certain data processing activities</li>
                    <li>• <strong>Withdraw consent:</strong> Change your privacy preferences anytime</li>
                  </ul>
                  
                  <div className="mt-4">
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <ExternalLink className="h-3 w-3" />
                      Contact Privacy Team
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex gap-3 mt-6 pt-4 border-t">
              <Button onClick={saveCustomPreferences} className="flex-1">
                Save Preferences
              </Button>
              <Button onClick={() => setShowSettings(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}