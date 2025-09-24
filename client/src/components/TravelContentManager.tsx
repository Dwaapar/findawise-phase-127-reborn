import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Globe, 
  Calendar, 
  TrendingUp,
  FileText,
  Sparkles,
  Zap,
  Download
} from "lucide-react";
import { TravelArticle, TravelContentSource } from "@shared/schema";

interface ContentFilters {
  archetype?: string;
  destination?: string;
  tags?: string[];
  published?: boolean;
}

export function TravelContentManager() {
  const [activeTab, setActiveTab] = useState("articles");
  const [selectedArticle, setSelectedArticle] = useState<TravelArticle | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [filters, setFilters] = useState<ContentFilters>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch articles
  const { data: articles, isLoading: articlesLoading } = useQuery({
    queryKey: ['/api/travel/articles', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.archetype) params.append('archetype', filters.archetype);
      if (filters.destination) params.append('destination', filters.destination);
      if (filters.published !== undefined) params.append('published', filters.published.toString());
      
      const response = await fetch(`/api/travel/articles?${params}`);
      if (!response.ok) throw new Error('Failed to fetch articles');
      const data = await response.json();
      return data.data || [];
    }
  });

  // Fetch content sources
  const { data: contentSources } = useQuery({
    queryKey: ['/api/travel/content-sources'],
    queryFn: async () => {
      const response = await fetch('/api/travel/content-sources');
      if (!response.ok) throw new Error('Failed to fetch content sources');
      const data = await response.json();
      return data.data || [];
    }
  });

  // Create article mutation
  const createArticleMutation = useMutation({
    mutationFn: async (articleData: Partial<TravelArticle>) => {
      const response = await fetch('/api/travel/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(articleData)
      });
      if (!response.ok) throw new Error('Failed to create article');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/travel/articles'] });
      toast({ title: "Article created successfully!" });
      setIsEditing(false);
      setSelectedArticle(null);
    },
    onError: () => {
      toast({ title: "Failed to create article", variant: "destructive" });
    }
  });

  // Update article mutation
  const updateArticleMutation = useMutation({
    mutationFn: async ({ id, ...articleData }: Partial<TravelArticle> & { id: number }) => {
      const response = await fetch(`/api/travel/articles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(articleData)
      });
      if (!response.ok) throw new Error('Failed to update article');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/travel/articles'] });
      toast({ title: "Article updated successfully!" });
      setIsEditing(false);
    },
    onError: () => {
      toast({ title: "Failed to update article", variant: "destructive" });
    }
  });

  // Delete article mutation
  const deleteArticleMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/travel/articles/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete article');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/travel/articles'] });
      toast({ title: "Article deleted successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to delete article", variant: "destructive" });
    }
  });

  // AI Content Generation
  const generateContentMutation = useMutation({
    mutationFn: async (prompt: { topic: string; archetype: string; destination?: string }) => {
      const response = await fetch('/api/travel/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prompt)
      });
      if (!response.ok) throw new Error('Failed to generate content');
      return response.json();
    },
    onSuccess: (data) => {
      if (data.data) {
        setSelectedArticle({
          title: data.data.title,
          content: data.data.content,
          excerpt: data.data.excerpt,
          tags: data.data.tags,
          seoTitle: data.data.seoTitle,
          seoDescription: data.data.seoDescription,
          targetArchetype: data.data.archetype,
          isPublished: false
        } as TravelArticle);
        setIsEditing(true);
        toast({ title: "Content generated successfully!" });
      }
    },
    onError: () => {
      toast({ title: "Failed to generate content", variant: "destructive" });
    }
  });

  const handleSaveArticle = async (formData: FormData) => {
    const articleData = {
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      excerpt: formData.get('excerpt') as string,
      tags: (formData.get('tags') as string)?.split(',').map(tag => tag.trim()),
      targetArchetype: formData.get('archetype') as string,
      destination: formData.get('destination') as string,
      seoTitle: formData.get('seoTitle') as string,
      seoDescription: formData.get('seoDescription') as string,
      isPublished: formData.get('published') === 'true'
    };

    if (selectedArticle?.id) {
      updateArticleMutation.mutate({ id: selectedArticle.id, ...articleData });
    } else {
      createArticleMutation.mutate(articleData);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Travel Content Manager</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Create, manage, and optimize travel content with AI assistance
          </p>
        </div>
        <Button 
          onClick={() => {
            setSelectedArticle(null);
            setIsEditing(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Article
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="articles">Articles</TabsTrigger>
          <TabsTrigger value="generator">AI Generator</TabsTrigger>
          <TabsTrigger value="sources">Content Sources</TabsTrigger>
        </TabsList>

        {/* Articles Management */}
        <TabsContent value="articles" className="mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Article List */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-4 mb-6">
                <Select onValueChange={(value) => setFilters(prev => ({ ...prev, archetype: value }))}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by archetype" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Archetypes</SelectItem>
                    <SelectItem value="adventurer">Adventure Seeker</SelectItem>
                    <SelectItem value="culture-seeker">Culture Enthusiast</SelectItem>
                    <SelectItem value="relaxation-seeker">Relaxation Expert</SelectItem>
                    <SelectItem value="budget-traveler">Smart Saver</SelectItem>
                    <SelectItem value="luxury-traveler">Luxury Connoisseur</SelectItem>
                  </SelectContent>
                </Select>

                <Select onValueChange={(value) => setFilters(prev => ({ ...prev, published: value === 'true' }))}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="true">Published</SelectItem>
                    <SelectItem value="false">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                {articlesLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-4">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded mb-4"></div>
                        <div className="h-8 bg-gray-200 rounded"></div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  articles?.map((article: TravelArticle) => (
                    <Card 
                      key={article.id} 
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedArticle?.id === article.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setSelectedArticle(article)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-semibold line-clamp-2">{article.title}</h3>
                          <div className="flex items-center gap-2">
                            {article.isPublished ? (
                              <Badge className="bg-green-100 text-green-800">
                                <Eye className="h-3 w-3 mr-1" />
                                Published
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <EyeOff className="h-3 w-3 mr-1" />
                                Draft
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                          {article.excerpt}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {article.views || 0} views
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(article.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedArticle(article);
                                setIsEditing(true);
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Are you sure you want to delete this article?')) {
                                  deleteArticleMutation.mutate(article.id);
                                }
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Article Editor */}
            <div className="lg:col-span-1">
              {isEditing ? (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {selectedArticle?.id ? 'Edit Article' : 'New Article'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSaveArticle(new FormData(e.currentTarget));
                      }}
                      className="space-y-4"
                    >
                      <div>
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          name="title"
                          defaultValue={selectedArticle?.title || ''}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="excerpt">Excerpt</Label>
                        <Textarea
                          id="excerpt"
                          name="excerpt"
                          rows={3}
                          defaultValue={selectedArticle?.excerpt || ''}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="content">Content</Label>
                        <Textarea
                          id="content"
                          name="content"
                          rows={8}
                          defaultValue={selectedArticle?.content || ''}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="tags">Tags (comma-separated)</Label>
                        <Input
                          id="tags"
                          name="tags"
                          defaultValue={selectedArticle?.tags?.join(', ') || ''}
                        />
                      </div>

                      <div>
                        <Label htmlFor="archetype">Target Archetype</Label>
                        <Select name="archetype" defaultValue={selectedArticle?.targetArchetype || ''}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select archetype" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="adventurer">Adventure Seeker</SelectItem>
                            <SelectItem value="culture-seeker">Culture Enthusiast</SelectItem>
                            <SelectItem value="relaxation-seeker">Relaxation Expert</SelectItem>
                            <SelectItem value="budget-traveler">Smart Saver</SelectItem>
                            <SelectItem value="luxury-traveler">Luxury Connoisseur</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="destination">Destination</Label>
                        <Input
                          id="destination"
                          name="destination"
                          defaultValue={selectedArticle?.destination || ''}
                        />
                      </div>

                      <div>
                        <Label htmlFor="published">Status</Label>
                        <Select name="published" defaultValue={selectedArticle?.isPublished ? 'true' : 'false'}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="false">Draft</SelectItem>
                            <SelectItem value="true">Published</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex gap-2">
                        <Button type="submit" className="flex-1">
                          {selectedArticle?.id ? 'Update' : 'Create'}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => {
                            setIsEditing(false);
                            setSelectedArticle(null);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              ) : selectedArticle ? (
                <Card>
                  <CardHeader>
                    <CardTitle>{selectedArticle.title}</CardTitle>
                    <CardDescription>
                      {selectedArticle.excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        {selectedArticle.tags?.map((tag, index) => (
                          <Badge key={index} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="text-sm space-y-2">
                        <p><strong>Archetype:</strong> {selectedArticle.targetArchetype}</p>
                        <p><strong>Destination:</strong> {selectedArticle.destination || 'General'}</p>
                        <p><strong>Views:</strong> {selectedArticle.views || 0}</p>
                        <p><strong>Status:</strong> {selectedArticle.isPublished ? 'Published' : 'Draft'}</p>
                      </div>

                      <Button 
                        onClick={() => setIsEditing(true)}
                        className="w-full"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Article
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Article Selected</h3>
                    <p className="text-gray-600">
                      Select an article from the list to view or edit it.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* AI Content Generator */}
        <TabsContent value="generator" className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-purple-600" />
                AI Content Generator
              </CardTitle>
              <CardDescription>
                Generate high-quality travel content using AI based on topics and travel archetypes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  generateContentMutation.mutate({
                    topic: formData.get('topic') as string,
                    archetype: formData.get('archetype') as string,
                    destination: formData.get('destination') as string
                  });
                }}
                className="space-y-6"
              >
                <div>
                  <Label htmlFor="topic">Content Topic</Label>
                  <Input
                    id="topic"
                    name="topic"
                    placeholder="e.g., Best budget travel destinations in Asia"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="archetype">Target Archetype</Label>
                  <Select name="archetype" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select target archetype" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="adventurer">Adventure Seeker</SelectItem>
                      <SelectItem value="culture-seeker">Culture Enthusiast</SelectItem>
                      <SelectItem value="relaxation-seeker">Relaxation Expert</SelectItem>
                      <SelectItem value="budget-traveler">Smart Saver</SelectItem>
                      <SelectItem value="luxury-traveler">Luxury Connoisseur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="destination">Destination (Optional)</Label>
                  <Input
                    id="destination"
                    name="destination"
                    placeholder="e.g., Thailand, Europe, Japan"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={generateContentMutation.isPending}
                >
                  {generateContentMutation.isPending ? (
                    <>
                      <Zap className="h-4 w-4 mr-2 animate-spin" />
                      Generating Content...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Content
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Sources */}
        <TabsContent value="sources" className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contentSources?.map((source: TravelContentSource) => (
              <Card key={source.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    {source.name}
                  </CardTitle>
                  <CardDescription>{source.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Status</span>
                      <Badge className={source.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {source.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Last Scraped</span>
                      <span>{source.lastScrapedAt ? new Date(source.lastScrapedAt).toLocaleDateString() : 'Never'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Articles</span>
                      <span>{source.articlesScraped || 0}</span>
                    </div>
                    <Button size="sm" variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Scrape Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}