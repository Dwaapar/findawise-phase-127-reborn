import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Star, Clock, DollarSign, Users, MapPin, Plane, Tag } from "lucide-react";
import { TravelOffer } from "@shared/schema";

interface TravelOfferRendererProps {
  archetype?: string;
  destination?: string;
  budgetRange?: string;
  maxOffers?: number;
}

export function TravelOfferRenderer({ 
  archetype, 
  destination, 
  budgetRange, 
  maxOffers = 6 
}: TravelOfferRendererProps) {
  const [clickedOffers, setClickedOffers] = useState<Set<number>>(new Set());

  // Fetch travel offers with filtering
  const { data: offers, isLoading } = useQuery({
    queryKey: ['/api/travel/offers', { archetype, destination, budgetRange }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (archetype) params.append('archetype', archetype);
      if (destination) params.append('destination', destination);
      if (budgetRange) params.append('budget', budgetRange);
      params.append('limit', maxOffers.toString());
      
      const response = await fetch(`/api/travel/offers?${params}`);
      if (!response.ok) throw new Error('Failed to fetch offers');
      return response.json();
    }
  });

  const handleOfferClick = async (offer: TravelOffer) => {
    try {
      // Track the click
      await fetch('/api/affiliate/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerId: offer.id,
          offerType: 'travel',
          clickSource: 'travel-home',
          metadata: {
            archetype,
            destination,
            budgetRange,
            offerTitle: offer.title
          }
        })
      });

      // Mark as clicked
      setClickedOffers(prev => new Set([...prev, offer.id]));
      
      // Open affiliate link
      window.open(offer.affiliateUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error tracking click:', error);
      // Still open the link even if tracking fails
      window.open(offer.affiliateUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const getOfferPriority = (offer: TravelOffer) => {
    let priority = 0;
    
    // Archetype matching
    if (archetype && offer.targetArchetype === archetype) priority += 3;
    
    // Budget range matching
    if (budgetRange && offer.priceRange === budgetRange) priority += 2;
    
    // Destination matching
    if (destination && offer.destination?.toLowerCase().includes(destination.toLowerCase())) priority += 2;
    
    // Trending offers get bonus
    if (offer.isTrending) priority += 1;
    
    // High commission offers get slight bonus
    if (offer.commissionRate && offer.commissionRate > 10) priority += 0.5;
    
    return priority;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-48 bg-gray-200 rounded-t-lg"></div>
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-4"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!offers || offers.length === 0) {
    return (
      <div className="text-center py-12">
        <Plane className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No travel deals found
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Try adjusting your filters or check back later for new offers.
        </p>
      </div>
    );
  }

  // Sort offers by priority and recency
  const sortedOffers = [...offers]
    .sort((a, b) => {
      const priorityDiff = getOfferPriority(b) - getOfferPriority(a);
      if (priorityDiff !== 0) return priorityDiff;
      
      // If priorities are equal, sort by creation date
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, maxOffers);

  return (
    <div className="space-y-6">
      {/* Personalization notice */}
      {(archetype || budgetRange || destination) && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Star className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Personalized for you
            </span>
          </div>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            These deals are curated based on your travel preferences
            {archetype && ` (${archetype})`}
            {budgetRange && ` and ${budgetRange} budget`}
            {destination && ` for ${destination}`}.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedOffers.map((offer: TravelOffer) => (
          <Card 
            key={offer.id} 
            className={`hover:shadow-lg transition-all border-2 group ${
              offer.isTrending ? 'border-orange-200 dark:border-orange-800' : 'border-green-200 dark:border-green-800'
            } ${clickedOffers.has(offer.id) ? 'opacity-75' : ''}`}
          >
            <div className="relative">
              {offer.imageUrl ? (
                <img 
                  src={offer.imageUrl} 
                  alt={offer.title}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-blue-400 to-purple-500 rounded-t-lg flex items-center justify-center">
                  <Plane className="h-12 w-12 text-white" />
                </div>
              )}
              
              <div className="absolute top-4 left-4 flex gap-2">
                {offer.isTrending && (
                  <Badge className="bg-orange-500 text-white">
                    🔥 Trending
                  </Badge>
                )}
                <Badge className="bg-green-500 text-white">
                  {offer.discountPercentage}% OFF
                </Badge>
              </div>

              <div className="absolute top-4 right-4">
                <Badge variant="secondary" className="bg-white/90 text-gray-800">
                  <Clock className="h-3 w-3 mr-1" />
                  {Math.ceil((new Date(offer.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                </Badge>
              </div>
            </div>

            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {offer.title}
                </CardTitle>
                {getOfferPriority(offer) > 2 && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                    Perfect Match
                  </Badge>
                )}
              </div>
              <CardDescription className="line-clamp-3">
                {offer.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="space-y-4">
                {/* Pricing */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-green-600">
                      ${offer.discountedPrice}
                    </span>
                    <span className="text-sm text-gray-500 line-through">
                      ${offer.originalPrice}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Save</div>
                    <div className="text-sm font-medium text-green-600">
                      ${offer.originalPrice - offer.discountedPrice}
                    </div>
                  </div>
                </div>

                {/* Offer details */}
                <div className="space-y-2 text-sm">
                  {offer.destination && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-3 w-3" />
                      {offer.destination}
                    </div>
                  )}
                  {offer.provider && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Tag className="h-3 w-3" />
                      {offer.provider}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="h-3 w-3" />
                    {offer.targetArchetype || 'All travelers'}
                  </div>
                </div>

                {/* Action button */}
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleOfferClick(offer)}
                  disabled={clickedOffers.has(offer.id)}
                >
                  {clickedOffers.has(offer.id) ? (
                    "Clicked ✓"
                  ) : (
                    <>
                      Claim Deal
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>

                {/* Fine print */}
                <div className="text-xs text-gray-500 text-center">
                  Valid until {new Date(offer.validUntil).toLocaleDateString()}
                  {offer.commissionRate && (
                    <div className="mt-1">
                      * We may earn a commission from this purchase
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load more section */}
      {offers.length >= maxOffers && (
        <div className="text-center py-8">
          <Button variant="outline" size="lg">
            Load More Deals
          </Button>
        </div>
      )}
    </div>
  );
}