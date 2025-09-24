import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Users, Compass, Star, TrendingUp, Search, Filter, Heart, Eye, Calendar, DollarSign, Plane, Globe } from "lucide-react";
import { TravelDestination, TravelArchetype, TravelArticle, TravelOffer, TravelTool } from "@shared/schema";
import { TravelArchetypeQuiz } from "@/components/TravelArchetypeQuiz";
import { TravelTools } from "@/components/TravelTools";
import { TravelOfferRenderer } from "@/components/TravelOfferRenderer";
import { TravelPrivacyBanner } from "@/components/TravelPrivacyBanner";
import { TravelOfferDisclaimer } from "@/components/TravelAffiliateDisclaimer";

export function TravelHome() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArchetype, setSelectedArchetype] = useState<string>("");
  const [activeTab, setActiveTab] = useState("destinations");

  // Fetch travel data
  const { data: destinations } = useQuery({
    queryKey: ['/api/travel/destinations'],
    queryFn: () => fetch('/api/travel/destinations').then(res => res.json())
  });

  const { data: archetypes } = useQuery({
    queryKey: ['/api/travel/archetypes'],
    queryFn: () => fetch('/api/travel/archetypes').then(res => res.json())
  });

  const { data: articles } = useQuery({
    queryKey: ['/api/travel/articles'],
    queryFn: () => fetch('/api/travel/articles').then(res => res.json())
  });

  const { data: tools } = useQuery({
    queryKey: ['/api/travel/tools'],
    queryFn: () => fetch('/api/travel/tools').then(res => res.json())
  });

  const { data: offers } = useQuery({
    queryKey: ['/api/travel/offers'],
    queryFn: () => fetch('/api/travel/offers').then(res => res.json())
  });

  // Filter destinations based on search and archetype
  const filteredDestinations = destinations?.filter((dest: TravelDestination) => {
    const matchesSearch = !searchQuery || 
      dest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dest.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesArchetype = !selectedArchetype || dest.budgetRange === selectedArchetype;
    
    return matchesSearch && matchesArchetype;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Globe className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI-Powered Travel Brain
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Discover your perfect travel archetype and unlock personalized destination recommendations, 
            exclusive deals, and AI-curated itineraries tailored just for you.
          </p>
        </div>

        {/* Travel Archetype Quiz CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-8 mb-12 text-center">
          <h2 className="text-2xl font-bold mb-4">What's Your Travel Archetype?</h2>
          <p className="mb-6 opacity-90">
            Take our AI-powered quiz to discover your unique travel personality and get personalized recommendations
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            className="bg-white text-blue-600 hover:bg-gray-100"
            onClick={() => setActiveTab("quiz")}
          >
            <Compass className="mr-2 h-5 w-5" />
            Take Travel Quiz
          </Button>
        </div>

        {/* Travel Archetypes */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Users className="h-6 w-6" />
            Travel Archetypes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {archetypes?.map((archetype: TravelArchetype) => (
              <Card 
                key={archetype.id} 
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedArchetype === archetype.slug ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedArchetype(selectedArchetype === archetype.slug ? '' : archetype.slug)}
              >
                <CardHeader className="text-center pb-2">
                  <div className="text-3xl mb-2">{archetype.emoji}</div>
                  <CardTitle className="text-sm">{archetype.name}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                    {archetype.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search destinations, articles, or tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Advanced Filters
          </Button>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="destinations">Destinations</TabsTrigger>
            <TabsTrigger value="articles">Articles</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="offers">Deals</TabsTrigger>
            <TabsTrigger value="quiz">Quiz</TabsTrigger>
          </TabsList>

          {/* Destinations Tab */}
          <TabsContent value="destinations" className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDestinations?.map((destination: TravelDestination) => (
                <Card key={destination.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative h-48 bg-gradient-to-br from-blue-400 to-purple-500">
                    {destination.imageUrl && (
                      <img 
                        src={destination.imageUrl} 
                        alt={destination.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute top-4 left-4 flex gap-2">
                      {destination.isTrending && (
                        <Badge className="bg-red-500 text-white">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Trending
                        </Badge>
                      )}
                      <Badge variant="secondary">
                        {destination.budgetRange}
                      </Badge>
                    </div>
                    <div className="absolute top-4 right-4">
                      <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{destination.name}</CardTitle>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm text-gray-600">{destination.popularityScore}/100</span>
                      </div>
                    </div>
                    <CardDescription>{destination.shortDescription}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {destination.continent}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          ${destination.averageCost}/month
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="h-3 w-3" />
                        Best time: {destination.bestTimeToVisit}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {destination.tags?.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <Button className="w-full" size="sm">
                        <Plane className="h-4 w-4 mr-2" />
                        Explore Destination
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Articles Tab */}
          <TabsContent value="articles" className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles?.map((article: TravelArticle) => (
                <Card key={article.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-2">{article.title}</CardTitle>
                      <Badge variant="outline">{article.readTime} min</Badge>
                    </div>
                    <CardDescription className="line-clamp-3">{article.excerpt}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {article.views} views
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {article.likes} likes
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {article.tags?.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <Button className="w-full" size="sm" variant="outline">
                        Read Article
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tools Tab */}
          <TabsContent value="tools" className="mt-8">
            <TravelTools />
          </TabsContent>

          {/* Offers Tab */}
          <TabsContent value="offers" className="mt-8">
            <TravelOfferDisclaimer className="mb-6" />
            <TravelOfferRenderer
              archetype={selectedArchetype}
              maxOffers={12}
            />
          </TabsContent>

          {/* Quiz Tab */}
          <TabsContent value="quiz" className="mt-8">
            <div className="flex justify-center">
              <TravelArchetypeQuiz 
                onComplete={(archetype) => {
                  console.log("Archetype detected:", archetype);
                  // Could store this in user preferences or analytics
                }}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Privacy Banner */}
      <TravelPrivacyBanner />
    </div>
  );
}