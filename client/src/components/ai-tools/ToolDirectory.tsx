import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, ExternalLink, Heart, Share2, Bookmark, TrendingUp, Zap, DollarSign } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface Tool {
  id: number;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  website: string;
  logo: string;
  categoryId: number;
  pricingModel: string;
  priceFrom: number;
  priceTo: number;
  features: string[];
  useCase: string[];
  platforms: string[];
  rating: number;
  totalReviews: number;
  trustScore: number;
  isFeatured: boolean;
  tags: string[];
}

interface ToolDirectoryProps {
  tools: Tool[];
  userArchetype: string | null;
  onToolClick: (toolId: number) => void;
}

export function ToolDirectory({ tools, userArchetype, onToolClick }: ToolDirectoryProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('featured');
  const queryClient = useQueryClient();

  // Fetch user's saved tools
  const { data: savedTools = [] } = useQuery({
    queryKey: ['/api/ai-tools/saved'],
    enabled: !!userArchetype,
  });

  // Save/unsave tool mutation
  const saveToolMutation = useMutation({
    mutationFn: async ({ toolId, action }: { toolId: number; action: 'save' | 'unsave' }) => {
      return apiRequest(`/api/ai-tools/save`, {
        method: 'POST',
        body: { toolId, action }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai-tools/saved'] });
    }
  });

  // Sort tools based on user preference and archetype
  const sortedTools = [...tools].sort((a, b) => {
    switch (sortBy) {
      case 'featured':
        if (a.isFeatured !== b.isFeatured) {
          return b.isFeatured ? 1 : -1;
        }
        return b.trustScore - a.trustScore;
      case 'rating':
        return b.rating - a.rating;
      case 'price_low':
        return (a.priceFrom || 0) - (b.priceFrom || 0);
      case 'price_high':
        return (b.priceFrom || 0) - (a.priceFrom || 0);
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      default:
        return 0;
    }
  });

  const handleToolClick = (tool: Tool) => {
    onToolClick(tool.id);
    // Track tool view
    fetch('/api/analytics/events/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        events: [{
          event: 'tool_view',
          data: { 
            toolId: tool.id, 
            toolName: tool.name,
            archetype: userArchetype,
            source: 'directory'
          }
        }]
      })
    });
  };

  const handleSaveTool = (toolId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const isSaved = savedTools.includes(toolId);
    saveToolMutation.mutate({ 
      toolId, 
      action: isSaved ? 'unsave' : 'save' 
    });
  };

  const getPricingDisplay = (tool: Tool) => {
    if (tool.pricingModel === 'free') return 'Free';
    if (tool.pricingModel === 'freemium') return 'Freemium';
    if (tool.priceFrom === null) return 'Contact for pricing';
    if (tool.priceFrom === tool.priceTo) return `$${tool.priceFrom}`;
    return `$${tool.priceFrom} - $${tool.priceTo}`;
  };

  const getArchetypeRecommendation = (tool: Tool) => {
    if (!userArchetype) return null;
    
    // Simple archetype matching logic (can be enhanced with ML)
    const archetypeMatches: Record<string, string[]> = {
      'Explorer': ['discovery', 'research', 'experimentation'],
      'Engineer': ['development', 'technical', 'programming'],
      'Creator': ['design', 'content', 'creative'],
      'Growth Hacker': ['marketing', 'analytics', 'optimization'],
      'Researcher': ['analysis', 'data', 'research']
    };

    const userKeywords = archetypeMatches[userArchetype] || [];
    const toolKeywords = [...(tool.features || []), ...(tool.useCase || []), ...(tool.tags || [])];
    
    const matchCount = userKeywords.filter(keyword => 
      toolKeywords.some(toolKeyword => 
        toolKeyword.toLowerCase().includes(keyword.toLowerCase())
      )
    ).length;

    if (matchCount >= 2) return 'Perfect match';
    if (matchCount === 1) return 'Good fit';
    return null;
  };

  if (sortedTools.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold mb-2">No tools found</h3>
        <p className="text-gray-600">Try adjusting your filters or search terms</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {sortedTools.length} tools found
          </span>
          {userArchetype && (
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              Personalized for {userArchetype}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value="featured">Featured</option>
            <option value="rating">Highest Rated</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="newest">Newest</option>
          </select>
          
          <div className="border rounded-md flex">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 text-sm ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-600'}`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-sm ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-600'}`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Tools Grid/List */}
      <div className={viewMode === 'grid' ? 
        'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 
        'space-y-4'
      }>
        {sortedTools.map((tool) => {
          const isSaved = savedTools.includes(tool.id);
          const recommendation = getArchetypeRecommendation(tool);
          
          return (
            <Card
              key={tool.id}
              className={`cursor-pointer transition-all duration-300 hover:shadow-lg border-2 
                ${recommendation === 'Perfect match' ? 'border-green-200 bg-green-50' :
                  recommendation === 'Good fit' ? 'border-blue-200 bg-blue-50' :
                  'border-gray-200 hover:border-gray-300'
                } ${viewMode === 'list' ? 'flex' : ''}`}
              onClick={() => handleToolClick(tool)}
            >
              <div className={viewMode === 'list' ? 'flex-shrink-0 w-24 h-24 p-4' : 'p-0'}>
                {tool.logo ? (
                  <img 
                    src={tool.logo} 
                    alt={`${tool.name} logo`}
                    className={`${viewMode === 'list' ? 'w-full h-full' : 'w-full h-48'} object-cover rounded-t-lg`}
                  />
                ) : (
                  <div className={`${viewMode === 'list' ? 'w-full h-full' : 'w-full h-48'} bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold rounded-t-lg`}>
                    {tool.name.charAt(0)}
                  </div>
                )}
              </div>

              <div className="flex-1">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1 flex items-center gap-2">
                        {tool.name}
                        {tool.isFeatured && <Badge className="bg-yellow-500 text-yellow-900">Featured</Badge>}
                        {recommendation && (
                          <Badge variant="outline" className={
                            recommendation === 'Perfect match' ? 'border-green-500 text-green-700' :
                            'border-blue-500 text-blue-700'
                          }>
                            {recommendation}
                          </Badge>
                        )}
                      </CardTitle>
                      
                      <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>{tool.rating}</span>
                          <span>({tool.totalReviews})</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          <span>Trust: {tool.trustScore}%</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleSaveTool(tool.id, e)}
                      className={`${isSaved ? 'text-red-500' : 'text-gray-400'} hover:text-red-500`}
                    >
                      <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <CardDescription className="text-sm mb-4 line-clamp-2">
                    {tool.shortDescription || tool.description}
                  </CardDescription>

                  {/* Features */}
                  {tool.features && tool.features.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1 mb-2">
                        {tool.features.slice(0, 3).map((feature, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {tool.features.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{tool.features.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Pricing and CTA */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      <span className="font-semibold text-green-600">
                        {getPricingDisplay(tool)}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Share2 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View Tool
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Load More */}
      {sortedTools.length >= 12 && (
        <div className="text-center pt-8">
          <Button variant="outline" size="lg">
            Load More Tools
          </Button>
        </div>
      )}
    </div>
  );
}