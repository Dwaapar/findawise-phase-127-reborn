// Empire-Grade Emotion Map Configuration
// Defines color schemes and styling for different emotional contexts

export const emotionMap = {
  trust: {
    primary: '#3B82F6',      // Reliable blue
    secondary: '#1E40AF',    // Deeper blue
    background: '#EBF8FF',   // Light blue background
    text: '#1E3A8A',         // Dark blue text
    accent: '#60A5FA',       // Medium blue accent
    gradient: 'from-blue-50 to-blue-100'
  },
  urgency: {
    primary: '#EF4444',      // Alert red
    secondary: '#DC2626',    // Deeper red
    background: '#FEF2F2',   // Light red background
    text: '#991B1B',         // Dark red text
    accent: '#F87171',       // Medium red accent
    gradient: 'from-red-50 to-red-100'
  },
  excitement: {
    primary: '#F59E0B',      // Energetic orange
    secondary: '#D97706',    // Deeper orange
    background: '#FFFBEB',   // Light orange background
    text: '#92400E',         // Dark orange text
    accent: '#FBBF24',       // Medium orange accent
    gradient: 'from-amber-50 to-amber-100'
  },
  luxury: {
    primary: '#7C3AED',      // Luxurious purple
    secondary: '#5B21B6',    // Deeper purple
    background: '#FAF5FF',   // Light purple background
    text: '#581C87',         // Dark purple text
    accent: '#A78BFA',       // Medium purple accent
    gradient: 'from-violet-50 to-violet-100'
  },
  success: {
    primary: '#10B981',      // Achievement green
    secondary: '#059669',    // Deeper green
    background: '#ECFDF5',   // Light green background
    text: '#065F46',         // Dark green text
    accent: '#34D399',       // Medium green accent
    gradient: 'from-emerald-50 to-emerald-100'
  },
  curiosity: {
    primary: '#8B5CF6',      // Curious purple
    secondary: '#7C3AED',    // Deeper purple
    background: '#F5F3FF',   // Light purple background
    text: '#5B21B6',         // Dark purple text
    accent: '#A78BFA',       // Medium purple accent
    gradient: 'from-purple-50 to-purple-100'
  },
  security: {
    primary: '#6B7280',      // Secure gray
    secondary: '#4B5563',    // Deeper gray
    background: '#F9FAFB',   // Light gray background
    text: '#374151',         // Dark gray text
    accent: '#9CA3AF',       // Medium gray accent
    gradient: 'from-gray-50 to-gray-100'
  },
  universal: {
    primary: '#6366F1',      // Universal indigo
    secondary: '#4F46E5',    // Deeper indigo
    background: '#EEF2FF',   // Light indigo background
    text: '#3730A3',         // Dark indigo text
    accent: '#818CF8',       // Medium indigo accent
    gradient: 'from-indigo-50 to-indigo-100'
  },
  neutral: {
    primary: '#6B7280',      // Neutral gray
    secondary: '#4B5563',    // Deeper gray
    background: '#F9FAFB',   // Light gray background
    text: '#374151',         // Dark gray text
    accent: '#9CA3AF',       // Medium gray accent
    gradient: 'from-gray-50 to-gray-100'
  }
};

// Emotion-based personalization rules
export const emotionPersonalization = {
  trust: {
    ctaText: ['Learn More', 'Get Started', 'Discover', 'Explore'],
    microcopy: {
      beforeCta: 'Trusted by thousands',
      afterCta: 'Join our community',
      disclaimer: 'Backed by our guarantee'
    },
    keywords: ['proven', 'reliable', 'trusted', 'established', 'verified']
  },
  urgency: {
    ctaText: ['Act Now', 'Don\'t Miss Out', 'Claim Yours', 'Get It Today'],
    microcopy: {
      beforeCta: 'Limited time offer',
      afterCta: 'Only while supplies last',
      urgency: '⏰ Offer expires soon!'
    },
    keywords: ['limited', 'urgent', 'deadline', 'expires', 'last chance']
  },
  excitement: {
    ctaText: ['Discover Now', 'Unlock Access', 'Start Your Journey', 'Dive In'],
    microcopy: {
      beforeCta: 'Something amazing awaits',
      afterCta: 'Your adventure begins here'
    },
    keywords: ['amazing', 'incredible', 'breakthrough', 'revolutionary', 'game-changing']
  },
  luxury: {
    ctaText: ['Experience Premium', 'Access Elite', 'Upgrade Now', 'Indulge'],
    microcopy: {
      beforeCta: 'For the discerning individual',
      afterCta: 'Elevate your experience'
    },
    keywords: ['premium', 'exclusive', 'elite', 'luxury', 'sophisticated']
  },
  success: {
    ctaText: ['Achieve Success', 'Reach Your Goals', 'Unlock Potential', 'Start Winning'],
    microcopy: {
      beforeCta: 'Your success story starts here',
      afterCta: 'Join successful achievers'
    },
    keywords: ['success', 'achievement', 'results', 'winner', 'progress']
  },
  curiosity: {
    ctaText: ['Find Out More', 'Discover Secrets', 'Uncover Truth', 'Explore Inside'],
    microcopy: {
      beforeCta: 'The answer you\'ve been seeking',
      afterCta: 'Satisfy your curiosity'
    },
    keywords: ['secret', 'hidden', 'discover', 'reveal', 'uncover']
  },
  security: {
    ctaText: ['Secure Your Future', 'Protect Now', 'Get Peace of Mind', 'Stay Safe'],
    microcopy: {
      beforeCta: 'Protect what matters most',
      afterCta: 'Security you can trust'
    },
    keywords: ['secure', 'protected', 'safe', 'guaranteed', 'insurance']
  }
};

// Device-specific emotion adjustments
export const deviceEmotionAdjustments = {
  mobile: {
    // On mobile, simplify emotions and use shorter text
    trust: { ...emotionMap.trust, ctaText: 'Learn More' },
    urgency: { ...emotionMap.urgency, ctaText: 'Act Now' },
    excitement: { ...emotionMap.excitement, ctaText: 'Discover' }
  },
  tablet: {
    // Tablet gets full emotion support
    ...emotionMap
  },
  desktop: {
    // Desktop gets enhanced emotion support with gradients
    ...emotionMap
  }
};

// Geographic emotion preferences (for localization)
export const geoEmotionPreferences = {
  'US': ['urgency', 'excitement', 'success'],
  'UK': ['trust', 'security', 'luxury'],
  'CA': ['trust', 'security', 'neutral'],
  'AU': ['excitement', 'curiosity', 'success'],
  'DE': ['trust', 'security', 'neutral'],
  'FR': ['luxury', 'trust', 'excitement'],
  'JP': ['trust', 'security', 'neutral'],
  'default': ['trust', 'neutral', 'universal']
};

// Time-based emotion mapping
export const timeBasedEmotions = {
  morning: ['success', 'excitement', 'curiosity'],
  afternoon: ['trust', 'neutral', 'security'],
  evening: ['luxury', 'trust', 'excitement'],
  night: ['security', 'trust', 'neutral']
};

// Category-emotion mappings
export const categoryEmotionMap = {
  finance: ['trust', 'security', 'success'],
  health: ['trust', 'security', 'urgency'],
  technology: ['excitement', 'curiosity', 'success'],
  travel: ['excitement', 'curiosity', 'luxury'],
  education: ['trust', 'curiosity', 'success'],
  business: ['success', 'trust', 'security'],
  lifestyle: ['luxury', 'excitement', 'success'],
  entertainment: ['excitement', 'curiosity', 'universal'],
  food: ['excitement', 'luxury', 'trust'],
  fashion: ['luxury', 'excitement', 'curiosity'],
  sports: ['excitement', 'success', 'urgency'],
  automotive: ['excitement', 'luxury', 'trust'],
  real_estate: ['trust', 'security', 'luxury'],
  insurance: ['security', 'trust', 'neutral'],
  investment: ['trust', 'security', 'success']
};

// Utility functions for emotion handling
export const emotionUtils = {
  getEmotionForCategory: (category: string): string => {
    const emotions = categoryEmotionMap[category as keyof typeof categoryEmotionMap];
    return emotions ? emotions[0] : 'neutral';
  },
  
  getEmotionForTime: (): string => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return timeBasedEmotions.morning[0];
    if (hour >= 12 && hour < 17) return timeBasedEmotions.afternoon[0];
    if (hour >= 17 && hour < 22) return timeBasedEmotions.evening[0];
    return timeBasedEmotions.night[0];
  },
  
  getEmotionForGeo: (countryCode: string): string => {
    const emotions = geoEmotionPreferences[countryCode as keyof typeof geoEmotionPreferences] || 
                    geoEmotionPreferences.default;
    return emotions[0];
  },
  
  getRandomEmotionForCategory: (category: string): string => {
    const emotions = categoryEmotionMap[category as keyof typeof categoryEmotionMap] || ['neutral'];
    return emotions[Math.floor(Math.random() * emotions.length)];
  },
  
  validateEmotion: (emotion: string): boolean => {
    return Object.keys(emotionMap).includes(emotion);
  },
  
  getContrastColor: (emotion: string): string => {
    const colors = emotionMap[emotion as keyof typeof emotionMap];
    return colors ? colors.text : emotionMap.neutral.text;
  },
  
  getGradientClass: (emotion: string): string => {
    const colors = emotionMap[emotion as keyof typeof emotionMap];
    return colors ? colors.gradient : emotionMap.neutral.gradient;
  }
};

export default emotionMap;