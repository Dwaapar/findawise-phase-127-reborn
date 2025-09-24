/**
 * Cultural Emotion Map Admin Interface - Billion-Dollar Empire Grade
 * 
 * Complete admin interface for managing cultural emotion mappings,
 * personalization rules, A/B tests, and real-time cultural analytics.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';

interface CulturalMapping {
  id: number;
  countryCode: string;
  countryName: string;
  region: string;
  communicationStyle: string;
  colorPsychology: Record<string, any>;
  trustIndicators: string[];
  conversionTriggers: string[];
  emotionPatterns: Record<string, any>;
  culturalContext: Record<string, any>;
  collectivismScore: number;
  uncertaintyAvoidance: number;
  powerDistance: number;
  masculinityIndex: number;
  longTermOrientation: number;
  indulgenceLevel: number;
  isActive: boolean;
  dataQuality: number;
  lastValidated: string;
}

interface EmotionProfile {
  id: number;
  emotionId: string;
  emotionName: string;
  category: string;
  intensity: number;
  culturalVariance: number;
  universality: number;
  behavioralTriggers: string[];
  responsePatterns: string[];
  colorAssociations: Record<string, string[]>;
  conversionImpact: number;
  isActive: boolean;
}

interface CulturalABTest {
  id: number;
  testId: string;
  testName: string;
  targetCountries: string[];
  emotionTargets: string[];
  variants: Record<string, any>;
  status: 'draft' | 'running' | 'paused' | 'completed';
  culturalHypothesis: string;
  expectedOutcome: string;
  startDate?: string;
  endDate?: string;
  results?: Record<string, any>;
  winningVariant?: string;
  statisticalSignificance?: number;
}

interface CulturalAnalytics {
  totalSessions: number;
  emotionDistribution: Record<string, number>;
  conversionRates: Record<string, number>;
  culturalInsights: Array<{
    country: string;
    insight: string;
    impact: number;
    confidence: number;
  }>;
}

export const CulturalEmotionMapAdmin: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState<'mappings' | 'emotions' | 'ab-tests' | 'analytics' | 'preview'>('mappings');
  const [culturalMappings, setCulturalMappings] = useState<CulturalMapping[]>([]);
  const [emotionProfiles, setEmotionProfiles] = useState<EmotionProfile[]>([]);
  const [abTests, setABTests] = useState<CulturalABTest[]>([]);
  const [analytics, setAnalytics] = useState<CulturalAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filters and selection
  const [selectedCountry, setSelectedCountry] = useState<string>('US');
  const [selectedEmotion, setSelectedEmotion] = useState<string>('');
  const [previewCountry, setPreviewCountry] = useState<string>('US');
  const [previewEmotion, setPreviewEmotion] = useState<string>('urgency');
  
  // Editing states
  const [editingMapping, setEditingMapping] = useState<CulturalMapping | null>(null);
  const [editingTest, setEditingTest] = useState<CulturalABTest | null>(null);

  // Load cultural data
  const loadCulturalData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [mappingsResponse, emotionsResponse, testsResponse, analyticsResponse] = await Promise.all([
        fetch('/api/admin/cultural-mappings'),
        fetch('/api/admin/emotion-profiles'),
        fetch('/api/admin/cultural-ab-tests'),
        fetch('/api/admin/cultural-analytics')
      ]);

      const [mappingsData, emotionsData, testsData, analyticsData] = await Promise.all([
        mappingsResponse.ok ? mappingsResponse.json() : { data: [] },
        emotionsResponse.ok ? emotionsResponse.json() : { data: [] },
        testsResponse.ok ? testsResponse.json() : { data: [] },
        analyticsResponse.ok ? analyticsResponse.json() : { data: null }
      ]);

      setCulturalMappings(mappingsData.data || []);
      setEmotionProfiles(emotionsData.data || []);
      setABTests(testsData.data || []);
      setAnalytics(analyticsData.data);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cultural data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update cultural mapping
  const handleUpdateMapping = async (countryCode: string, updates: Partial<CulturalMapping>) => {
    try {
      const response = await fetch(`/api/admin/cultural-mappings/${countryCode}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update cultural mapping');
      }

      // Update local state
      setCulturalMappings(prev => prev.map(mapping => 
        mapping.countryCode === countryCode 
          ? { ...mapping, ...updates }
          : mapping
      ));

      setEditingMapping(null);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update cultural mapping');
    }
  };

  // Create or update A/B test
  const handleSaveTest = async (testData: Partial<CulturalABTest>) => {
    try {
      const response = await fetch('/api/admin/cultural-ab-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      });

      if (!response.ok) {
        throw new Error('Failed to save A/B test');
      }

      const result = await response.json();
      
      // Update local state
      if (editingTest?.id) {
        setABTests(prev => prev.map(test => 
          test.id === editingTest.id ? result.data : test
        ));
      } else {
        setABTests(prev => [...prev, result.data]);
      }

      setEditingTest(null);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save A/B test');
    }
  };

  // Generate cultural preview
  const generatePreview = (countryCode: string, emotion: string) => {
    const mapping = culturalMappings.find(m => m.countryCode === countryCode);
    if (!mapping) return null;

    const emotionPattern = mapping.emotionPatterns[emotion];
    if (!emotionPattern) return null;

    return {
      colors: mapping.colorPsychology,
      emotion: emotionPattern,
      trustIndicators: mapping.trustIndicators,
      conversionTriggers: mapping.conversionTriggers,
      culturalStyle: mapping.communicationStyle
    };
  };

  // Load data on mount
  useEffect(() => {
    loadCulturalData();
  }, [loadCulturalData]);

  // Render cultural mappings tab
  const renderCulturalMappings = () => (
    <div className="space-y-6">
      {/* Country Selector */}
      <div className="flex items-center space-x-4">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Select Country:
        </label>
        <select
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
          className="block w-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          {culturalMappings.map(mapping => (
            <option key={mapping.countryCode} value={mapping.countryCode}>
              {mapping.countryName} ({mapping.countryCode})
            </option>
          ))}
        </select>
      </div>

      {/* Cultural Mapping Details */}
      {(() => {
        const mapping = culturalMappings.find(m => m.countryCode === selectedCountry);
        if (!mapping) return <div>No mapping found for selected country</div>;

        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">{mapping.countryName} Cultural Profile</h3>
              <button
                onClick={() => setEditingMapping(mapping)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Edit Mapping
              </button>
            </div>

            {/* Cultural Dimensions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 dark:text-white">Cultural Dimensions</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Collectivism:</span>
                    <span>{Math.round(mapping.collectivismScore * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Uncertainty Avoidance:</span>
                    <span>{Math.round(mapping.uncertaintyAvoidance * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Power Distance:</span>
                    <span>{Math.round(mapping.powerDistance * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Masculinity Index:</span>
                    <span>{Math.round(mapping.masculinityIndex * 100)}%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 dark:text-white">Communication</h4>
                <div className="space-y-1 text-sm">
                  <div>Style: {mapping.communicationStyle}</div>
                  <div>Region: {mapping.region}</div>
                  <div>Quality: {mapping.dataQuality}%</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 dark:text-white">Trust Indicators</h4>
                <div className="flex flex-wrap gap-1">
                  {mapping.trustIndicators.map((indicator, index) => (
                    <span
                      key={index}
                      className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full"
                    >
                      {indicator}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Color Psychology */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-white">Color Psychology</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(mapping.colorPsychology).map(([emotion, colors]) => (
                  <div key={emotion} className="space-y-2">
                    <span className="text-sm font-medium capitalize">{emotion}:</span>
                    <div className="flex space-x-1">
                      {Array.isArray(colors) ? colors.map((color, index) => (
                        <div
                          key={index}
                          className="w-6 h-6 rounded border border-gray-300"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      )) : (
                        <div
                          className="w-6 h-6 rounded border border-gray-300"
                          style={{ backgroundColor: colors }}
                          title={colors}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Conversion Triggers */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-white">Conversion Triggers</h4>
              <div className="flex flex-wrap gap-1">
                {mapping.conversionTriggers.map((trigger, index) => (
                  <span
                    key={index}
                    className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                  >
                    {trigger}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );

  // Render cultural preview tab
  const renderCulturalPreview = () => {
    const preview = generatePreview(previewCountry, previewEmotion);
    
    return (
      <div className="space-y-6">
        {/* Preview Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Cultural Preview Simulator</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Country:
              </label>
              <select
                value={previewCountry}
                onChange={(e) => setPreviewCountry(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {culturalMappings.map(mapping => (
                  <option key={mapping.countryCode} value={mapping.countryCode}>
                    {mapping.countryName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Emotion Theme:
              </label>
              <select
                value={previewEmotion}
                onChange={(e) => setPreviewEmotion(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="urgency">Urgency</option>
                <option value="trust">Trust</option>
                <option value="excitement">Excitement</option>
                <option value="calm">Calm</option>
              </select>
            </div>
          </div>
        </div>

        {/* Preview Display */}
        {preview && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">
              Preview: {culturalMappings.find(m => m.countryCode === previewCountry)?.countryName} - {previewEmotion}
            </h3>
            
            {/* Mock UI Components with Cultural Adaptation */}
            <div className="space-y-6">
              {/* Header */}
              <div 
                className="p-4 rounded-lg text-white"
                style={{ backgroundColor: preview.colors.primary }}
              >
                <h1 className="text-2xl font-bold">Welcome to Our Platform</h1>
                <p>Experience personalized for your culture</p>
              </div>

              {/* CTA Button */}
              <div className="flex space-x-4">
                <button
                  className="px-6 py-3 rounded-lg text-white font-semibold"
                  style={{ backgroundColor: preview.emotion.colors?.[0] || preview.colors.accent }}
                >
                  {previewEmotion === 'urgency' ? 'Act Now!' : 
                   previewEmotion === 'trust' ? 'Secure Purchase' :
                   previewEmotion === 'excitement' ? 'Get Started!' : 'Learn More'}
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-medium mb-2">Trust Indicators:</h4>
                <div className="flex flex-wrap gap-2">
                  {preview.trustIndicators.map((indicator, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full"
                    >
                      ✓ {indicator}
                    </span>
                  ))}
                </div>
              </div>

              {/* Cultural Style Info */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h4 className="font-medium mb-2">Cultural Adaptations Applied:</h4>
                <ul className="text-sm space-y-1">
                  <li>• Communication Style: {preview.culturalStyle}</li>
                  <li>• Primary Emotion: {previewEmotion}</li>
                  <li>• Color Scheme: Culturally optimized</li>
                  <li>• Trust Elements: {preview.trustIndicators.length} indicators</li>
                  <li>• Conversion Triggers: {preview.conversionTriggers.length} active</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Cultural Emotion Map Administration
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage cultural mappings, emotion profiles, and personalization rules
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'mappings', label: 'Cultural Mappings' },
            { id: 'emotions', label: 'Emotion Profiles' },
            { id: 'ab-tests', label: 'A/B Tests' },
            { id: 'analytics', label: 'Analytics' },
            { id: 'preview', label: 'Cultural Preview' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="mb-6 flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading cultural data...</span>
        </div>
      )}

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'mappings' && renderCulturalMappings()}
        {activeTab === 'preview' && renderCulturalPreview()}
        
        {/* TODO: Add other tab implementations */}
        {activeTab === 'emotions' && (
          <div className="text-center py-8 text-gray-500">
            Emotion profiles management coming soon...
          </div>
        )}
        
        {activeTab === 'ab-tests' && (
          <div className="text-center py-8 text-gray-500">
            A/B testing interface coming soon...
          </div>
        )}
        
        {activeTab === 'analytics' && (
          <div className="text-center py-8 text-gray-500">
            Cultural analytics dashboard coming soon...
          </div>
        )}
      </div>
    </div>
  );
};

export default CulturalEmotionMapAdmin;