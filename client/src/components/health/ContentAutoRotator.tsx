import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, ExternalLink, Star, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DynamicContent {
  content: any[];
  offers: any[];
  rotationId: string;
}

interface ContentAutoRotatorProps {
  archetype?: string;
  sessionId: string;
  location?: string;
  intent?: string;
}

export function ContentAutoRotator({ archetype, sessionId, location, intent }: ContentAutoRotatorProps) {
  const [dynamicContent, setDynamicContent] = useState<DynamicContent | null>(null);
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const [currentOfferIndex, setCurrentOfferIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDynamicContent = async () => {
    if (!archetype) return;
    
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        archetype,
        location: location || 'global',
        intent: intent || 'wellness'
      });

      const response = await fetch(`/api/health/dynamic-content?${params}`);
      if (response.ok) {
        const result = await response.json();
        setDynamicContent(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch dynamic content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDynamicContent();
  }, [archetype]);

  // Auto-rotate content every 30 seconds
  useEffect(() => {
    if (!dynamicContent) return;

    const contentInterval = setInterval(() => {
      setCurrentContentIndex(prev => 
        (prev + 1) % Math.max(1, dynamicContent.content.length)
      );
    }, 30000);

    const offerInterval = setInterval(() => {
      setCurrentOfferIndex(prev => 
        (prev + 1) % Math.max(1, dynamicContent.offers.length)
      );
    }, 45000);

    return () => {
      clearInterval(contentInterval);
      clearInterval(offerInterval);
    };
  }, [dynamicContent]);

  if (!archetype || !dynamicContent) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground">
            Complete archetype detection to see personalized content
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentContent = dynamicContent.content[currentContentIndex];
  const currentOffer = dynamicContent.offers[currentOfferIndex];

  return (
    <div className="space-y-6">
      {/* Dynamic Content Rotation */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Personalized for You
            </CardTitle>
            <CardDescription>
              Content curated for {archetype.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDynamicContent}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <AnimatePresence mode="wait">
            {currentContent && (
              <motion.div
                key={currentContent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{currentContent.title}</h3>
                    <p className="text-muted-foreground mb-3">{currentContent.excerpt}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{currentContent.category}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {currentContent.readingTime}min read
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Dynamic Affiliate Offers */}
      {currentOffer && (
        <Card className="border-2 border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <Star className="w-5 h-5" />
              Featured for Your Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentOffer.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-between"
              >
                <div className="flex-1">
                  <h4 className="font-semibold text-amber-900 dark:text-amber-100">
                    {currentOffer.title}
                  </h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">
                    {currentOffer.description}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-amber-900 dark:text-amber-100">
                      {currentOffer.price}
                    </span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="text-sm">{currentOffer.rating}</span>
                    </div>
                  </div>
                </div>
                <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                  View Deal
                </Button>
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>
      )}

      {/* Rotation Indicator */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <div className="flex gap-1">
          {dynamicContent.content.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentContentIndex ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
        <span>•</span>
        <span>Auto-refreshing content</span>
      </div>
    </div>
  );
}