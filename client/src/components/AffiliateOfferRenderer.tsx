import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Star, Shield, TrendingUp, Zap, Gift, Clock, Award, Eye, MousePointer } from "lucide-react";
import { emotionMap } from "@/config/emotionMap";
import { sessionManager, trackAffiliateClick, getPersonalization } from "@/lib/sessionManager";
import { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";

// Empire-Grade Affiliate Offer Interface with Full Metadata Support
interface AffiliateOffer {
  id: number;
  slug: string;
  title: string;
  description: string;
  category: string;
  emotion: string;
  targetUrl: string;
  ctaText: string;
  commission: string;
  isActive: boolean;
  isFeatured?: boolean;
  priority?: number;
  merchantName?: string;
  originalPrice?: string;
  salePrice?: string;
  discountPercentage?: number;
  validUntil?: string;
  badges?: string[];
  microcopy?: {
    beforeCta?: string;
    afterCta?: string;
    disclaimer?: string;
    urgency?: string;
  };
  metadata?: {
    conversionRate?: number;
    clickCount?: number;
    lastClicked?: string;
    qualityScore?: number;
    trustScore?: number;
  };
  styles?: {
    cardColor?: string;
    ctaColor?: string;
    textColor?: string;
    borderColor?: string;
  };
}

interface OfferRendererConfig {
  maxOffers?: number;
  layout?: "grid" | "list" | "carousel" | "compact";
  showPricing?: boolean;
  showBadges?: boolean;
  showMerchant?: boolean;
  showCommission?: boolean;
  enableHover?: boolean;
  enableTracking?: boolean;
  filterByCategory?: string[];
  sortBy?: "priority" | "commission" | "conversion" | "recent";
  responsiveBreakpoints?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
}

interface AffiliateOfferRendererProps {
  pageSlug: string;
  emotion: string;
  position?: "header" | "sidebar" | "footer" | "inline" | "hero" | "popup";
  className?: string;
  userSegment?: string;
  recommendations?: any;
  config?: OfferRendererConfig;
  containerId?: string;
  forceRefresh?: boolean;
}

// Empire-Grade Offer Card Component with Full Configuration Support
function AffiliateOfferCard({ 
  offer, 
  emotion, 
  position, 
  config,
  pageSlug 
}: { 
  offer: AffiliateOffer; 
  emotion: string; 
  position?: string;
  config?: OfferRendererConfig;
  pageSlug: string;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const emotionColors = emotionMap[emotion as keyof typeof emotionMap] || emotionMap.trust;
  
  // Advanced click tracking with comprehensive analytics
  const handleAffiliateClick = async (event: React.MouseEvent) => {
    event.preventDefault();
    setIsTracking(true);
    
    try {
      // Comprehensive tracking payload
      const trackingData = {
        offerId: offer.id,
        offerSlug: offer.slug,
        pageSlug,
        position: position || 'inline',
        emotion,
        timestamp: new Date().toISOString(),
        sessionId: sessionManager.getSessionId(),
        userId: sessionManager.getUserId() || 'anonymous',
        deviceFingerprint: await getDeviceFingerprint(),
        geoLocation: await getGeoLocation(),
        metadata: {
          userAgent: navigator.userAgent,
          referrer: document.referrer,
          screenResolution: `${screen.width}x${screen.height}`,
          viewportSize: `${window.innerWidth}x${window.innerHeight}`,
          connectionType: (navigator as any).connection?.effectiveType || 'unknown',
          timeOnPage: Date.now() - (sessionManager.getPageStartTime() || Date.now()),
          scrollDepth: Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100),
          clickCoordinates: { x: event.clientX, y: event.clientY },
          offerMetadata: {
            conversionRate: offer.metadata?.conversionRate,
            clickCount: offer.metadata?.clickCount,
            qualityScore: offer.metadata?.qualityScore,
            merchantName: offer.merchantName,
            category: offer.category,
            commission: offer.commission,
            isFeatured: offer.isFeatured
          }
        }
      };

      // Track the click via multiple channels for redundancy
      await Promise.allSettled([
        trackAffiliateClick(trackingData),
        trackLocalAnalytics('affiliate_click', trackingData),
        sendAnalyticsEvent(trackingData)
      ]);

      // Generate tracking URL with UTM parameters and session info
      const trackingUrl = buildTrackingUrl(offer.slug, {
        ref: pageSlug,
        utm_source: 'findawise_empire',
        utm_medium: 'affiliate_renderer',
        utm_campaign: `${emotion}_${position}`,
        utm_content: offer.category,
        utm_term: offer.slug,
        session_id: sessionManager.getSessionId(),
        user_id: sessionManager.getUserId() || 'anonymous',
        tracking_id: generateTrackingId(),
        timestamp: Date.now()
      });

      // Enhanced navigation with accessibility and security
      const windowFeatures = 'noopener,noreferrer,scrollbars=yes,resizable=yes,width=1200,height=800';
      const newWindow = window.open(trackingUrl, '_blank', windowFeatures);
      
      if (newWindow) {
        // Track successful window opening
        trackLocalAnalytics('affiliate_window_opened', { 
          offerSlug: offer.slug, 
          success: true 
        });
      } else {
        // Fallback for popup blockers
        trackLocalAnalytics('affiliate_popup_blocked', { 
          offerSlug: offer.slug, 
          fallback: true 
        });
        window.location.href = trackingUrl;
      }
    } catch (error) {
      console.error('Affiliate click tracking failed:', error);
      // Emergency fallback with basic tracking
      trackLocalAnalytics('affiliate_tracking_error', { 
        offerSlug: offer.slug, 
        error: error.message 
      });
      window.open(`/go/${offer.slug}`, '_blank', 'noopener,noreferrer');
    } finally {
      setIsTracking(false);
    }
  };

  // Position-based icons with enhanced visual feedback
  const getPositionIcon = () => {
    const iconProps = { className: "h-4 w-4", style: { color: emotionColors.primary } };
    switch (position) {
      case "header": return <TrendingUp {...iconProps} />;
      case "sidebar": return <Star {...iconProps} />;
      case "footer": return <Shield {...iconProps} />;
      case "hero": return <Zap {...iconProps} />;
      case "popup": return <Gift {...iconProps} />;
      default: return <ExternalLink {...iconProps} />;
    }
  };

  // Dynamic badge rendering based on offer metadata
  const renderBadges = () => {
    if (!config?.showBadges) return null;
    
    const badges = [];
    
    if (offer.isFeatured) badges.push({ text: "Featured", icon: <Award className="h-3 w-3" />, color: "gold" });
    if (offer.discountPercentage && offer.discountPercentage > 20) badges.push({ text: `${offer.discountPercentage}% OFF`, icon: <Gift className="h-3 w-3" />, color: "red" });
    if (offer.validUntil) badges.push({ text: "Limited Time", icon: <Clock className="h-3 w-3" />, color: "orange" });
    if (offer.metadata?.conversionRate && offer.metadata.conversionRate > 5) badges.push({ text: "High Converting", icon: <TrendingUp className="h-3 w-3" />, color: "green" });
    if (offer.badges) {
      offer.badges.forEach(badge => badges.push({ text: badge, color: "blue" }));
    }
    
    return badges.map((badge, index) => (
      <Badge 
        key={index}
        variant="outline" 
        className={cn(
          "text-xs flex items-center gap-1 transition-all duration-200",
          isHovered && "scale-105"
        )}
        style={{ 
          borderColor: emotionColors.primary, 
          color: emotionColors.primary,
          backgroundColor: isHovered ? emotionColors.background : 'transparent'
        }}
      >
        {badge.icon}
        {badge.text}
      </Badge>
    ));
  };

  // Price display with original/sale price formatting
  const renderPricing = () => {
    if (!config?.showPricing) return null;
    
    return (
      <div className="flex items-center gap-2">
        {offer.originalPrice && offer.salePrice && (
          <>
            <span className="text-sm text-gray-500 line-through">
              {offer.originalPrice}
            </span>
            <span 
              className="text-lg font-bold"
              style={{ color: emotionColors.primary }}
            >
              {offer.salePrice}
            </span>
          </>
        )}
        {config?.showCommission && offer.commission && (
          <Badge variant="secondary" className="ml-auto">
            {offer.commission}
          </Badge>
        )}
      </div>
    );
  };

  // Enhanced card rendering with full customization
  return (
    <Card 
      className={cn(
        "transition-all duration-300 hover:shadow-xl border-l-4 cursor-pointer",
        config?.layout === 'compact' ? 'max-w-xs' : '',
        position === 'sidebar' ? 'max-w-sm' : '',
        position === 'hero' ? 'max-w-2xl' : '',
        isHovered && config?.enableHover && "transform scale-105 shadow-2xl",
        className
      )}
      style={{ 
        borderLeftColor: offer.styles?.borderColor || emotionColors.primary,
        background: offer.styles?.cardColor || `linear-gradient(135deg, ${emotionColors.background} 0%, white 100%)`,
        borderColor: isHovered ? emotionColors.primary : 'transparent'
      }}
      onMouseEnter={() => config?.enableHover && setIsHovered(true)}
      onMouseLeave={() => config?.enableHover && setIsHovered(false)}
      role="button"
      tabIndex={0}
      aria-label={`Affiliate offer: ${offer.title}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle 
            className={cn(
              "font-semibold transition-colors duration-200",
              config?.layout === 'compact' ? 'text-base' : 'text-lg'
            )}
            style={{ color: offer.styles?.textColor || emotionColors.text }}
          >
            {offer.title}
            {offer.isFeatured && <Star className="inline ml-1 h-4 w-4 fill-yellow-400 text-yellow-400" />}
          </CardTitle>
          <div className="flex items-center gap-2">
            {getPositionIcon()}
            {config?.enableTracking && (
              <div className="flex items-center text-xs text-gray-500">
                <Eye className="h-3 w-3 mr-1" />
                {offer.metadata?.clickCount || 0}
              </div>
            )}
          </div>
        </div>
        
        {config?.showMerchant && offer.merchantName && (
          <div className="text-sm text-gray-600 font-medium">
            by {offer.merchantName}
          </div>
        )}
        
        {offer.description && (
          <CardDescription className="text-sm text-gray-600 line-clamp-2">
            {offer.description}
          </CardDescription>
        )}
        
        {offer.microcopy?.urgency && (
          <div 
            className="text-xs font-semibold animate-pulse"
            style={{ color: emotionColors.primary }}
          >
            {offer.microcopy.urgency}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Badges Section */}
        <div className="flex flex-wrap gap-2">
          <Badge 
            variant="outline" 
            className="text-xs"
            style={{ borderColor: emotionColors.primary, color: emotionColors.primary }}
          >
            {offer.category}
          </Badge>
          {renderBadges()}
        </div>
        
        {/* Pricing Section */}
        {renderPricing()}
        
        {/* Microcopy Before CTA */}
        {offer.microcopy?.beforeCta && (
          <p className="text-xs text-gray-600 text-center">
            {offer.microcopy.beforeCta}
          </p>
        )}
        
        {/* Main CTA Button */}
        <Button
          onClick={handleAffiliateClick}
          disabled={isTracking}
          className={cn(
            "w-full font-medium transition-all duration-200",
            "hover:transform hover:scale-105 active:scale-95",
            "focus:ring-2 focus:ring-offset-2",
            isTracking && "opacity-70 cursor-not-allowed"
          )}
          style={{
            backgroundColor: offer.styles?.ctaColor || emotionColors.primary,
            color: 'white',
            borderColor: offer.styles?.ctaColor || emotionColors.primary,
            focusRingColor: emotionColors.primary
          }}
          rel="nofollow noopener noreferrer"
          aria-label={`Click to access ${offer.title} offer`}
        >
          {isTracking ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Loading...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <MousePointer className="h-4 w-4" />
              {offer.ctaText || 'View Offer'}
              <ExternalLink className="h-3 w-3" />
            </div>
          )}
        </Button>
        
        {/* Microcopy After CTA */}
        {offer.microcopy?.afterCta && (
          <p className="text-xs text-gray-500 text-center">
            {offer.microcopy.afterCta}
          </p>
        )}
        
        {/* Commission Display */}
        {config?.showCommission && offer.commission && !renderPricing() && (
          <div className="flex justify-center">
            <Badge variant="secondary" className="text-xs">
              Earn {offer.commission}
            </Badge>
          </div>
        )}
        
        {/* Disclaimer */}
        {offer.microcopy?.disclaimer && (
          <p className="text-xs text-gray-400 text-center leading-tight">
            {offer.microcopy.disclaimer}
          </p>
        )}
        
        {/* Metadata for debugging (development only) */}
        {process.env.NODE_ENV === 'development' && offer.metadata && (
          <details className="text-xs">
            <summary className="cursor-pointer text-gray-500">Debug Info</summary>
            <pre className="mt-1 text-gray-400 text-xs overflow-x-auto">
              {JSON.stringify(offer.metadata, null, 2)}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
}

// Helper functions for empire-grade tracking and analytics
async function getDeviceFingerprint(): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx?.fillText('Empire Analytics', 10, 10);
  const canvasFingerprint = canvas.toDataURL();
  
  const fingerprint = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    cookieEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack,
    screenResolution: `${screen.width}x${screen.height}`,
    colorDepth: screen.colorDepth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    canvas: canvasFingerprint.slice(-50), // Last 50 chars for privacy
    hardwareConcurrency: navigator.hardwareConcurrency || 1,
    connection: (navigator as any).connection?.effectiveType || 'unknown'
  };
  
  return btoa(JSON.stringify(fingerprint)).slice(0, 32);
}

async function getGeoLocation(): Promise<string> {
  try {
    const response = await fetch('https://ipapi.co/json/', { 
      signal: AbortSignal.timeout(3000) 
    });
    const data = await response.json();
    return `${data.city}, ${data.country_name}`;
  } catch {
    return 'Unknown';
  }
}

function buildTrackingUrl(slug: string, params: Record<string, any>): string {
  const baseUrl = `/go/${slug}`;
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      searchParams.append(key, String(value));
    }
  });
  
  return `${baseUrl}?${searchParams.toString()}`;
}

function generateTrackingId(): string {
  return `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Enhanced local analytics tracking
function trackLocalAnalytics(event: string, data: any): void {
  try {
    const analyticsData = {
      event,
      data,
      timestamp: Date.now(),
      sessionId: sessionManager.getSessionId(),
      userId: sessionManager.getUserId() || 'anonymous',
      pageUrl: window.location.href,
      referrer: document.referrer
    };
    
    // Store in localStorage for offline capability
    const existingData = JSON.parse(localStorage.getItem('empire_analytics') || '[]');
    existingData.push(analyticsData);
    
    // Keep only last 1000 events for performance
    if (existingData.length > 1000) {
      existingData.splice(0, existingData.length - 1000);
    }
    
    localStorage.setItem('empire_analytics', JSON.stringify(existingData));
    
    // Also send to analytics API if available
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(analyticsData)
    }).catch(() => {
      // Fail silently for analytics
    });
  } catch (error) {
    console.warn('Analytics tracking failed:', error);
  }
}

function sendAnalyticsEvent(data: any): Promise<void> {
  return fetch('/api/analytics/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(() => {}).catch(() => {});
}

// Main Affiliate Offer Renderer Component - Empire Grade
export default function AffiliateOfferRenderer({ 
  pageSlug, 
  emotion,
  position = "inline",
  className,
  userSegment,
  recommendations,
  config = {},
  containerId,
  forceRefresh = false
}: AffiliateOfferRendererProps) {
  const [visibleOffers, setVisibleOffers] = useState<AffiliateOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Default configuration with empire-grade defaults
  const defaultConfig: OfferRendererConfig = {
    maxOffers: position === 'sidebar' ? 2 : position === 'hero' ? 1 : 4,
    layout: position === 'sidebar' ? 'compact' : 'grid',
    showPricing: true,
    showBadges: true,
    showMerchant: true,
    showCommission: true,
    enableHover: true,
    enableTracking: true,
    sortBy: 'priority',
    responsiveBreakpoints: {
      mobile: 1,
      tablet: 2,
      desktop: position === 'sidebar' ? 1 : 3
    },
    ...config
  };

  // Fetch affiliate offers with comprehensive filtering and personalization
  const { data: offersResponse, isLoading: offersLoading, error: offersError } = useQuery({
    queryKey: ['/api/affiliate/offers', pageSlug, emotion, userSegment, refreshKey, forceRefresh],
    queryFn: async () => {
      const params = new URLSearchParams({
        page_slug: pageSlug,
        emotion: emotion || 'neutral',
        position: position || 'inline',
        user_segment: userSegment || 'general',
        max_offers: String(defaultConfig.maxOffers || 4),
        sort_by: defaultConfig.sortBy || 'priority',
        ...(defaultConfig.filterByCategory && { 
          categories: defaultConfig.filterByCategory.join(',') 
        })
      });
      
      const response = await fetch(`/api/affiliate/offers?${params}`);
      if (!response.ok) throw new Error('Failed to fetch offers');
      return response.json();
    },
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3
  });

  // Fetch personalization data for enhanced targeting
  const { data: personalization } = useQuery({
    queryKey: ['/api/personalization', sessionManager.getSessionId()],
    queryFn: async () => {
      const response = await fetch(`/api/personalization?session=${sessionManager.getSessionId()}`);
      return response.ok ? response.json() : null;
    },
    enabled: !!sessionManager.getSessionId(),
    staleTime: 10 * 60 * 1000 // 10 minutes
  });

  // Process and filter offers with empire-grade logic
  const processedOffers = useMemo(() => {
    if (!offersResponse?.offers) return [];
    
    let offers = offersResponse.offers as AffiliateOffer[];
    
    // Apply personalization filters
    if (personalization?.preferences) {
      offers = offers.filter(offer => {
        if (personalization.preferences.categories?.length) {
          return personalization.preferences.categories.includes(offer.category);
        }
        return true;
      });
    }
    
    // Apply emotion-based filtering
    if (emotion && emotion !== 'neutral') {
      offers = offers.filter(offer => 
        offer.emotion === emotion || offer.emotion === 'universal'
      );
    }
    
    // Apply category filters
    if (defaultConfig.filterByCategory?.length) {
      offers = offers.filter(offer => 
        defaultConfig.filterByCategory!.includes(offer.category)
      );
    }
    
    // Sort offers based on configuration
    offers.sort((a, b) => {
      switch (defaultConfig.sortBy) {
        case 'commission':
          const aCommission = parseFloat(a.commission?.replace(/[^\d.]/g, '') || '0');
          const bCommission = parseFloat(b.commission?.replace(/[^\d.]/g, '') || '0');
          return bCommission - aCommission;
        case 'conversion':
          return (b.metadata?.conversionRate || 0) - (a.metadata?.conversionRate || 0);
        case 'recent':
          return new Date(b.metadata?.lastClicked || 0).getTime() - 
                 new Date(a.metadata?.lastClicked || 0).getTime();
        default: // priority
          return (b.priority || 0) - (a.priority || 0);
      }
    });
    
    // Featured offers first
    offers.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return 0;
    });
    
    return offers.slice(0, defaultConfig.maxOffers);
  }, [offersResponse, personalization, emotion, defaultConfig]);

  // Track renderer view for analytics
  useEffect(() => {
    if (processedOffers.length > 0) {
      trackLocalAnalytics('affiliate_renderer_view', {
        pageSlug,
        emotion,
        position,
        offerCount: processedOffers.length,
        offerIds: processedOffers.map(o => o.id),
        userSegment,
        config: defaultConfig
      });
    }
  }, [processedOffers, pageSlug, emotion, position, userSegment]);

  // Handle loading states
  useEffect(() => {
    if (!offersLoading) {
      setVisibleOffers(processedOffers);
      setIsLoading(false);
      if (offersError) {
        setError(offersError.message);
      }
    }
  }, [offersLoading, processedOffers, offersError]);

  // Force refresh handler
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    setError(null);
  };

  // Loading state with sophisticated skeletons
  if (isLoading || offersLoading) {
    const skeletonCount = defaultConfig.maxOffers || 2;
    return (
      <div 
        className={cn(
          "space-y-4",
          defaultConfig.layout === 'grid' && "grid gap-4",
          defaultConfig.layout === 'grid' && position !== 'sidebar' && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
          className
        )}
        id={containerId}
      >
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-4 rounded" />
              </div>
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-10 w-full rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Error state with retry option
  if (error) {
    return (
      <div className={cn("text-center p-6 border border-red-200 rounded-lg bg-red-50", className)}>
        <p className="text-red-600 mb-3">Failed to load affiliate offers</p>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          Try Again
        </Button>
      </div>
    );
  }

  // Empty state
  if (!visibleOffers.length) {
    return process.env.NODE_ENV === 'development' ? (
      <div className={cn("text-center p-6 border border-gray-200 rounded-lg bg-gray-50", className)}>
        <p className="text-gray-500">No affiliate offers available</p>
        <p className="text-xs text-gray-400 mt-1">
          Page: {pageSlug} | Emotion: {emotion} | Position: {position}
        </p>
      </div>
    ) : null;
  }

  // Main render with layout support
  return (
    <div 
      className={cn(
        "affiliate-offer-renderer",
        defaultConfig.layout === 'list' && "space-y-4",
        defaultConfig.layout === 'grid' && "grid gap-4",
        defaultConfig.layout === 'grid' && position !== 'sidebar' && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        defaultConfig.layout === 'carousel' && "flex gap-4 overflow-x-auto pb-4",
        className
      )}
      id={containerId}
      data-position={position}
      data-emotion={emotion}
      data-offers-count={visibleOffers.length}
    >
      {visibleOffers.map((offer, index) => (
        <AffiliateOfferCard 
          key={`${offer.id}-${refreshKey}`}
          offer={offer} 
          emotion={emotion} 
          position={position}
          config={defaultConfig}
          pageSlug={pageSlug}
        />
      ))}
      
      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-400 mt-4 p-2 bg-gray-50 rounded">
          <details>
            <summary>Debug Info</summary>
            <pre className="mt-2 text-xs">
              {JSON.stringify({
                pageSlug,
                emotion,
                position,
                userSegment,
                config: defaultConfig,
                offerCount: visibleOffers.length,
                offers: visibleOffers.map(o => ({ id: o.id, title: o.title, category: o.category }))
              }, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

