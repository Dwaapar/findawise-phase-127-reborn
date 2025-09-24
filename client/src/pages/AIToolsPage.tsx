import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, Star, ExternalLink, Zap, Sparkles } from 'lucide-react';
import { ToolDirectory } from '../components/ai-tools/ToolDirectory';
import { QuizEngine } from '../components/ai-tools/QuizEngine';
import { LeadMagnetFlow } from '../components/ai-tools/LeadMagnetFlow';

export function AIToolsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPricing, setSelectedPricing] = useState('all');
  const [showQuiz, setShowQuiz] = useState(false);
  const [userArchetype, setUserArchetype] = useState<string | null>(null);

  // Fetch AI tools data
  const { data: tools = [] } = useQuery({
    queryKey: ['/api/ai-tools/tools'],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/ai-tools/categories'],
  });

  const { data: archetypes = [] } = useQuery({
    queryKey: ['/api/ai-tools/archetypes'],
  });

  // Filter tools based on search and filters
  const filteredTools = tools.filter((tool: any) => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
      tool.categoryId === parseInt(selectedCategory);
    
    const matchesPricing = selectedPricing === 'all' || 
      tool.pricingModel === selectedPricing;

    return matchesSearch && matchesCategory && matchesPricing;
  });

  const handleQuizComplete = (results: any) => {
    setUserArchetype(results.primaryArchetype);
    setShowQuiz(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
            Discover AI Tools That Transform Your Workflow
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
            From content creation to data analysis, find the perfect AI-powered solutions 
            tailored to your needs and working style.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="bg-white text-purple-600 hover:bg-blue-50 px-8 py-3 text-lg font-semibold"
              onClick={() => setShowQuiz(true)}
            >
              <Sparkles className="mr-2" />
              Take Personalization Quiz
            </Button>
            
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white/10 px-8 py-3 text-lg"
            >
              <Zap className="mr-2" />
              Browse All Tools
            </Button>
          </div>

          {userArchetype && (
            <div className="mt-6 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-6 py-2">
              <Star className="w-5 h-5 text-yellow-300" />
              <span className="text-sm font-medium">Your Type: {userArchetype}</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <Tabs defaultValue="directory" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="directory" className="text-lg py-3">
              Tool Directory
            </TabsTrigger>
            <TabsTrigger value="quiz" className="text-lg py-3">
              Find My Tools
            </TabsTrigger>
            <TabsTrigger value="resources" className="text-lg py-3">
              Free Resources
            </TabsTrigger>
          </TabsList>

          <TabsContent value="directory" className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Search tools by name, feature, or use case..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 py-3 text-lg"
                  />
                </div>
                
                <div className="flex gap-4">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category: any) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedPricing} onValueChange={setSelectedPricing}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Pricing" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Pricing</SelectItem>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="freemium">Freemium</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="lifetime">Lifetime Deal</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {searchQuery && (
                  <Badge variant="secondary" className="px-3 py-1">
                    Search: {searchQuery}
                  </Badge>
                )}
                {selectedCategory !== 'all' && (
                  <Badge variant="secondary" className="px-3 py-1">
                    Category: {categories.find((c: any) => c.id.toString() === selectedCategory)?.name}
                  </Badge>
                )}
                {selectedPricing !== 'all' && (
                  <Badge variant="secondary" className="px-3 py-1">
                    Pricing: {selectedPricing}
                  </Badge>
                )}
              </div>
            </div>

            <ToolDirectory 
              tools={filteredTools}
              userArchetype={userArchetype}
              onToolClick={(toolId) => {
                // Track tool click analytics
                fetch('/api/analytics/events', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    event: 'tool_view',
                    data: { toolId, archetype: userArchetype }
                  })
                });
              }}
            />
          </TabsContent>

          <TabsContent value="quiz" className="space-y-6">
            <QuizEngine 
              onComplete={handleQuizComplete}
              currentArchetype={userArchetype}
            />
          </TabsContent>

          <TabsContent value="resources" className="space-y-6">
            <LeadMagnetFlow 
              userArchetype={userArchetype}
            />
          </TabsContent>
        </Tabs>

        {/* Quiz Modal */}
        {showQuiz && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Find Your AI Tool Personality</h2>
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowQuiz(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </Button>
                </div>
                <QuizEngine 
                  onComplete={handleQuizComplete}
                  currentArchetype={userArchetype}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}