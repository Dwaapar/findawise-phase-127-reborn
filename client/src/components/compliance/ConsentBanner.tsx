// Advanced Consent Banner React Component
import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Settings, X, ChevronDown, ChevronUp } from 'lucide-react';

interface ConsentCategory {
  id: string;
  label: string;
  description: string;
  required: boolean;
  defaultValue: boolean;
  purposes: string[];
  dataTypes: string[];
  retentionPeriod: string;
  thirdParties: string[];
}

interface ConsentBannerConfig {
  title: string;
  message: string;
  acceptAllText: string;
  rejectAllText?: string;
  customizeText: string;
  learnMoreText: string;
  privacyPolicyUrl: string;
  position: 'top' | 'bottom' | 'modal';
  theme: 'light' | 'dark' | 'auto';
  language: string;
  categories: ConsentCategory[];
  legalFramework: string;
  country: string;
}

interface ConsentData {
  [categoryId: string]: boolean;
  timestamp?: string;
  version?: string;
}

export const ConsentBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [consentData, setConsentData] = useState<ConsentData>({});
  const [config, setConfig] = useState<ConsentBannerConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeConsentBanner();
  }, []);

  const initializeConsentBanner = async () => {
    try {
      // Check if consent already exists and is valid
      const existingConsent = localStorage.getItem('consent_data');
      if (existingConsent) {
        const data = JSON.parse(existingConsent);
        if (isConsentValid(data)) {
          setIsLoading(false);
          return; // Don't show banner
        }
      }

      // Fetch consent configuration from API
      const response = await fetch('/api/compliance/consent/config');
      const result = await response.json();
      
      if (result.success) {
        setConfig(result.data);
        
        // Initialize consent data with default values
        const initialConsent: ConsentData = {};
        result.data.categories.forEach((category: ConsentCategory) => {
          initialConsent[category.id] = category.required || category.defaultValue;
        });
        setConsentData(initialConsent);
        
        setIsVisible(true);
      }
    } catch (error) {
      console.warn('Error initializing consent banner:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isConsentValid = (data: any): boolean => {
    if (!data.timestamp) return false;
    
    const consentDate = new Date(data.timestamp);
    const now = new Date();
    const daysSinceConsent = (now.getTime() - consentDate.getTime()) / (1000 * 60 * 60 * 24);
    
    // Consent expires after 13 months (GDPR recommendation)
    return daysSinceConsent < 395;
  };

  const updateConsentCategory = (categoryId: string, value: boolean) => {
    setConsentData(prev => ({
      ...prev,
      [categoryId]: value
    }));
  };

  const acceptAll = () => {
    if (!config) return;
    
    const newConsent: ConsentData = {};
    config.categories.forEach(category => {
      newConsent[category.id] = true;
    });
    
    saveConsent(newConsent);
  };

  const rejectAll = () => {
    if (!config) return;
    
    const newConsent: ConsentData = {};
    config.categories.forEach(category => {
      newConsent[category.id] = category.required;
    });
    
    saveConsent(newConsent);
  };

  const saveCustomConsent = () => {
    saveConsent(consentData);
  };

  const saveConsent = async (consent: ConsentData) => {
    const finalConsent = {
      ...consent,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };

    // Save to localStorage
    localStorage.setItem('consent_data', JSON.stringify(finalConsent));

    // Send to server
    try {
      await fetch('/api/compliance/consent/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          consentData: finalConsent,
          fingerprint: generateFingerprint(),
          sessionId: getSessionId()
        })
      });
    } catch (error) {
      console.warn('Error recording consent on server:', error);
    }

    // Hide banner
    setIsVisible(false);

    // Trigger global consent event
    window.dispatchEvent(new CustomEvent('consentUpdated', {
      detail: finalConsent
    }));
  };

  const generateFingerprint = (): string => {
    // Simple fingerprint generation
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Fingerprint', 2, 2);
    }

    return btoa(
      navigator.userAgent +
      navigator.language +
      screen.width + 'x' + screen.height +
      new Date().getTimezoneOffset() +
      (canvas.toDataURL() || '')
    ).substring(0, 32);
  };

  const getSessionId = (): string => {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  if (isLoading || !isVisible || !config) {
    return null;
  }

  return (
    <div 
      className={`fixed z-50 left-0 right-0 bg-white border shadow-lg font-sans text-sm leading-relaxed ${
        config.position === 'top' ? 'top-0 border-b' : 'bottom-0 border-t'
      } ${config.theme === 'dark' ? 'bg-gray-900 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-200'}`}
    >
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold">{config.title}</h3>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Message */}
        <p className="mb-4 text-gray-600 dark:text-gray-300">
          {config.message}
        </p>

        {/* Customization Panel */}
        {showCustomization && (
          <div className="mb-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            {config.categories.map(category => (
              <div key={category.id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                {/* Category Header */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentData[category.id] || false}
                      disabled={category.required}
                      onChange={(e) => updateConsentCategory(category.id, e.target.checked)}
                      className="mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="font-medium">
                      {category.label}
                      {category.required && <span className="text-red-500 ml-1">*</span>}
                    </span>
                  </label>
                  
                  <button
                    onClick={() => toggleCategoryExpansion(category.id)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    aria-label="Toggle details"
                  >
                    {expandedCategories.has(category.id) ? 
                      <ChevronUp size={16} /> : 
                      <ChevronDown size={16} />
                    }
                  </button>
                </div>

                {/* Category Details */}
                {expandedCategories.has(category.id) && (
                  <div className="p-4 bg-white dark:bg-gray-900">
                    <p className="text-gray-600 dark:text-gray-400 italic mb-3">
                      {category.description}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h5 className="font-semibold mb-2">Purposes:</h5>
                        <ul className="list-disc list-inside space-y-1">
                          {category.purposes.map((purpose, idx) => (
                            <li key={idx} className="text-gray-600 dark:text-gray-400">{purpose}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h5 className="font-semibold mb-2">Data Types:</h5>
                        <ul className="list-disc list-inside space-y-1">
                          {category.dataTypes.map((dataType, idx) => (
                            <li key={idx} className="text-gray-600 dark:text-gray-400">{dataType}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h5 className="font-semibold mb-2">Retention Period:</h5>
                        <p className="text-gray-600 dark:text-gray-400">{category.retentionPeriod}</p>
                      </div>

                      {category.thirdParties.length > 0 && (
                        <div>
                          <h5 className="font-semibold mb-2">Third Parties:</h5>
                          <ul className="list-disc list-inside space-y-1">
                            {category.thirdParties.map((party, idx) => (
                              <li key={idx} className="text-gray-600 dark:text-gray-400">{party}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={acceptAll}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            <CheckCircle size={16} className="inline mr-2" />
            {config.acceptAllText}
          </button>

          {config.rejectAllText && (
            <button
              onClick={rejectAll}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors font-medium"
            >
              <X size={16} className="inline mr-2" />
              {config.rejectAllText}
            </button>
          )}

          <button
            onClick={() => {
              if (showCustomization) {
                saveCustomConsent();
              } else {
                setShowCustomization(true);
              }
            }}
            className="px-6 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors font-medium"
          >
            <Settings size={16} className="inline mr-2" />
            {showCustomization ? 'Save Preferences' : config.customizeText}
          </button>

          <a
            href={config.privacyPolicyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline text-sm"
          >
            {config.learnMoreText}
          </a>
        </div>

        {/* Legal Framework Info */}
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
            <AlertTriangle size={12} className="mr-1" />
            Legal framework: {config.legalFramework} ({config.country})
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConsentBanner;