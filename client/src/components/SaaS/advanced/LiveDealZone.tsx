import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Timer, Clock, Fire, TrendingUp, ExternalLink, Star, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface Deal {
  id: string;
  toolName: string;
  toolLogo: string;
  originalPrice: number;
  dealPrice: number;
  discount: number;
  dealType: 'limited_time' | 'flash_sale' | 'exclusive' | 'lifetime';
  expiresAt: Date;
  description: string;
  features: string[];
  dealUrl: string;
  popularity: number;
  rating: number;
  category: string;
  isHot: boolean;
  claimedCount: number;
  maxClaims?: number;
}

interface LiveDealZoneProps {
  onDealClick?: (dealId: string) => void;
  maxDeals?: number;
}

export default function LiveDealZone({ onDealClick, maxDeals = 6 }: LiveDealZoneProps) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'discount' | 'expiry' | 'popularity'>('discount');
  const { toast } = useToast();

  // Sample deals data - in production, this would come from API
  const sampleDeals: Deal[] = [
    {
      id: "notion-lifetime",
      toolName: "Notion Pro",
      toolLogo: "/logos/notion.png",
      originalPrice: 96,
      dealPrice: 48,
      discount: 50,
      dealType: 'limited_time',
      expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
      description: "All-in-one workspace with unlimited blocks and file uploads",
      features: ["Unlimited blocks", "Version history", "Advanced permissions", "API access"],
      dealUrl: "https://notion.so/pricing?ref=findawise",
      popularity: 95,
      rating: 4.7,
      category: "productivity",
      isHot: true,
      claimedCount: 1247,
      maxClaims: 2000
    },
    {
      id: "figma-pro-flash",
      toolName: "Figma Professional",
      toolLogo: "/logos/figma.png",
      originalPrice: 144,
      dealPrice: 72,
      discount: 50,
      dealType: 'flash_sale',
      expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours
      description: "Professional design tool with advanced prototyping",
      features: ["Unlimited projects", "Advanced prototyping", "Design systems", "Team libraries"],
      dealUrl: "https://figma.com/pricing?ref=findawise",
      popularity: 88,
      rating: 4.8,
      category: "design",
      isHot: true,
      claimedCount: 892,
      maxClaims: 1500
    },
    {
      id: "hubspot-crm",
      toolName: "HubSpot CRM Suite",
      toolLogo: "/logos/hubspot.png",
      originalPrice: 540,
      dealPrice: 324,
      discount: 40,
      dealType: 'exclusive',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      description: "Complete CRM and marketing automation platform",
      features: ["Advanced CRM", "Marketing automation", "Sales pipeline", "Custom reporting"],
      dealUrl: "https://hubspot.com/pricing?ref=findawise",
      popularity: 92,
      rating: 4.6,
      category: "crm",
      isHot: false,
      claimedCount: 543,
      maxClaims: 1000
    },
    {
      id: "canva-pro-annual",
      toolName: "Canva Pro",
      toolLogo: "/logos/canva.png",
      originalPrice: 120,
      dealPrice: 60,
      discount: 50,
      dealType: 'limited_time',
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      description: "Professional design platform with premium assets",
      features: ["Premium templates", "Brand kit", "Magic resize", "Background remover"],
      dealUrl: "https://canva.com/pricing?ref=findawise",
      popularity: 85,
      rating: 4.5,
      category: "design",
      isHot: false,
      claimedCount: 2156,
      maxClaims: 3000
    },
    {
      id: "airtable-pro",
      toolName: "Airtable Pro",
      toolLogo: "/logos/airtable.png",
      originalPrice: 240,
      dealPrice: 144,
      discount: 40,
      dealType: 'exclusive',
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
      description: "Database-spreadsheet hybrid for complex workflows",
      features: ["Gantt view", "Calendar view", "Custom fields", "Automations"],
      dealUrl: "https://airtable.com/pricing?ref=findawise",
      popularity: 78,
      rating: 4.6,
      category: "productivity",
      isHot: false,
      claimedCount: 734,
      maxClaims: 1200
    },
    {
      id: "zapier-premium",
      toolName: "Zapier Premium",
      toolLogo: "/logos/zapier.png",
      originalPrice: 239.88,
      dealPrice: 143.93,
      discount: 40,
      dealType: 'limited_time',
      expiresAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days
      description: "Advanced automation with premium integrations",
      features: ["20,000 tasks/month", "Premium apps", "Multi-step zaps", "Custom logic"],
      dealUrl: "https://zapier.com/pricing?ref=findawise",
      popularity: 82,
      rating: 4.4,
      category: "automation",
      isHot: false,
      claimedCount: 456,
      maxClaims: 800
    }
  ];

  useEffect(() => {
    setDeals(sampleDeals);
    
    // Update current time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const categories = ['all', 'productivity', 'design', 'crm', 'automation'];

  const filteredAndSortedDeals = deals
    .filter(deal => selectedCategory === 'all' || deal.category === selectedCategory)
    .filter(deal => deal.expiresAt > currentTime) // Only show active deals
    .sort((a, b) => {
      switch (sortBy) {
        case 'discount':
          return b.discount - a.discount;
        case 'expiry':
          return a.expiresAt.getTime() - b.expiresAt.getTime();
        case 'popularity':
          return b.popularity - a.popularity;
        default:
          return 0;
      }
    })
    .slice(0, maxDeals);

  const handleDealClick = (deal: Deal) => {
    onDealClick?.(deal.id);
    
    // Track click in analytics
    toast({
      title: "Redirecting to deal!",
      description: `Opening ${deal.toolName} special offer`,
    });
    
    // Open in new tab
    window.open(deal.dealUrl, '_blank');
  };

  const formatTimeLeft = (expiresAt: Date): { text: string; isUrgent: boolean; color: string } => {
    const timeDiff = expiresAt.getTime() - currentTime.getTime();
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

    if (timeDiff <= 0) {
      return { text: "Expired", isUrgent: false, color: "text-gray-500" };
    }

    if (hours < 1) {
      return {
        text: `${minutes}m ${seconds}s`,
        isUrgent: true,
        color: "text-red-500"
      };
    } else if (hours < 24) {
      return {
        text: `${hours}h ${minutes}m`,
        isUrgent: hours < 6,
        color: hours < 6 ? "text-orange-500" : "text-yellow-600"
      };
    } else {
      const days = Math.floor(hours / 24);
      return {
        text: `${days}d ${hours % 24}h`,
        isUrgent: false,
        color: "text-green-600"
      };
    }
  };

  const getDealTypeIcon = (type: Deal['dealType']) => {
    switch (type) {
      case 'flash_sale':
        return <Zap className="text-yellow-500" size={16} />;
      case 'exclusive':
        return <Star className="text-purple-500" size={16} />;
      case 'lifetime':
        return <Fire className="text-red-500" size={16} />;
      default:
        return <Timer className="text-blue-500" size={16} />;
    }
  };

  const getDealTypeBadge = (type: Deal['dealType']) => {
    const badges = {
      flash_sale: { text: "Flash Sale", color: "bg-yellow-500" },
      exclusive: { text: "Exclusive", color: "bg-purple-500" },
      lifetime: { text: "Lifetime", color: "bg-red-500" },
      limited_time: { text: "Limited Time", color: "bg-blue-500" }
    };
    
    const badge = badges[type];
    return (
      <Badge className={`${badge.color} text-white text-xs`}>
        {getDealTypeIcon(type)}
        <span className="ml-1">{badge.text}</span>
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
          <Fire className="text-red-500" />
          Live Deal Zone
          <Fire className="text-red-500" />
        </h2>
        <p className="text-muted-foreground">
          Exclusive deals updated in real-time. Don't miss out!
        </p>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Category:</span>
          <div className="flex gap-2">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="capitalize"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Sort by:</span>
          <div className="flex gap-2">
            {[
              { key: 'discount', label: 'Discount' },
              { key: 'expiry', label: 'Expiry' },
              { key: 'popularity', label: 'Popular' }
            ].map(({ key, label }) => (
              <Button
                key={key}
                variant={sortBy === key ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy(key as any)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Deals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredAndSortedDeals.map((deal, index) => {
            const timeLeft = formatTimeLeft(deal.expiresAt);
            
            return (
              <motion.div
                key={deal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="relative"
              >
                <Card 
                  className={`h-full cursor-pointer transition-all duration-300 hover:shadow-lg ${
                    deal.isHot ? 'ring-2 ring-red-400' : 'hover:ring-2 hover:ring-gray-200'
                  }`}
                  onClick={() => handleDealClick(deal)}
                >
                  {deal.isHot && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold z-10">
                      🔥 HOT
                    </div>
                  )}

                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-lg font-bold text-gray-600">
                            {deal.toolName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <CardTitle className="text-lg">{deal.toolName}</CardTitle>
                          <div className="flex items-center gap-1">
                            <Star className="text-yellow-500 fill-current" size={14} />
                            <span className="text-sm font-medium">{deal.rating}</span>
                          </div>
                        </div>
                      </div>
                      
                      {getDealTypeBadge(deal.dealType)}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Pricing */}
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-2xl font-bold text-green-600">
                          ${deal.dealPrice}
                        </span>
                        <span className="text-lg text-gray-500 line-through">
                          ${deal.originalPrice}
                        </span>
                      </div>
                      <Badge variant="destructive" className="text-sm font-bold">
                        {deal.discount}% OFF
                      </Badge>
                    </div>

                    {/* Timer */}
                    <div className={`text-center p-3 rounded-lg ${
                      timeLeft.isUrgent ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
                    }`}>
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Clock className={timeLeft.color} size={16} />
                        <span className={`font-bold ${timeLeft.color}`}>
                          {timeLeft.text}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {timeLeft.isUrgent ? 'Hurry up!' : 'Time remaining'}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground">
                      {deal.description}
                    </p>

                    {/* Features */}
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Included:</h4>
                      <div className="space-y-1">
                        {deal.features.slice(0, 3).map((feature, index) => (
                          <div key={index} className="flex items-center gap-2 text-xs">
                            <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Progress Bar for Limited Deals */}
                    {deal.maxClaims && (
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Claimed</span>
                          <span>{deal.claimedCount}/{deal.maxClaims}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(deal.claimedCount / deal.maxClaims) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* CTA Button */}
                    <Button 
                      className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDealClick(deal);
                      }}
                    >
                      <ExternalLink className="mr-2" size={16} />
                      Claim Deal
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* No deals message */}
      {filteredAndSortedDeals.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Timer className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            No active deals found
          </h3>
          <p className="text-muted-foreground">
            Check back soon for new exclusive offers!
          </p>
        </motion.div>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        <p>Deals updated every minute • All prices in USD • Limited time offers</p>
        <p className="mt-1">
          🔥 {filteredAndSortedDeals.filter(d => d.isHot).length} hot deals • 
          ⚡ {filteredAndSortedDeals.filter(d => formatTimeLeft(d.expiresAt).isUrgent).length} expiring soon
        </p>
      </div>
    </div>
  );
}