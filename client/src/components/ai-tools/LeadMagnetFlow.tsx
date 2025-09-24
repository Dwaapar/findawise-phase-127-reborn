import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, BookOpen, FileText, Zap, Gift, Mail, CheckCircle, Star } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface LeadMagnet {
  id: string;
  title: string;
  description: string;
  type: 'ebook' | 'template' | 'toolkit' | 'course' | 'checklist';
  downloadUrl: string;
  thumbnailUrl?: string;
  features: string[];
  targetArchetypes: string[];
  downloadCount: number;
  rating: number;
}

interface LeadMagnetFlowProps {
  userArchetype?: string | null;
}

export function LeadMagnetFlow({ userArchetype }: LeadMagnetFlowProps) {
  const [email, setEmail] = useState('');
  const [selectedMagnet, setSelectedMagnet] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [downloadedItems, setDownloadedItems] = useState<Set<string>>(new Set());

  // Fetch available lead magnets
  const { data: leadMagnets = [] } = useQuery<LeadMagnet[]>({
    queryKey: ['/api/ai-tools/lead-magnets'],
  });

  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: async (data: { email: string; leadMagnet?: string; archetype?: string | null }) => {
      return apiRequest('/api/ai-tools/subscribe', {
        method: 'POST',
        body: data
      });
    },
    onSuccess: () => {
      setIsSubscribed(true);
      if (selectedMagnet) {
        setDownloadedItems(prev => new Set(prev).add(selectedMagnet));
      }
    }
  });

  // Download without subscription mutation
  const downloadMutation = useMutation({
    mutationFn: async (magnetId: string) => {
      return apiRequest(`/api/ai-tools/download/${magnetId}`, {
        method: 'POST',
        body: { email: email || undefined, archetype: userArchetype }
      });
    },
    onSuccess: (data, magnetId) => {
      setDownloadedItems(prev => new Set(prev).add(magnetId));
      // Trigger download
      if (data.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
      }
    }
  });

  const handleSubscribe = (magnetId?: string) => {
    subscribeMutation.mutate({
      email,
      leadMagnet: magnetId,
      archetype: userArchetype
    });
  };

  const handleDirectDownload = (magnetId: string) => {
    downloadMutation.mutate(magnetId);
  };

  // Filter magnets by user archetype
  const personalizedMagnets = userArchetype 
    ? leadMagnets.filter(magnet => 
        magnet.targetArchetypes.includes(userArchetype) || 
        magnet.targetArchetypes.length === 0
      )
    : leadMagnets;

  const getIconForType = (type: string) => {
    switch (type) {
      case 'ebook': return <BookOpen className="w-6 h-6" />;
      case 'template': return <FileText className="w-6 h-6" />;
      case 'toolkit': return <Zap className="w-6 h-6" />;
      case 'course': return <Star className="w-6 h-6" />;
      case 'checklist': return <CheckCircle className="w-6 h-6" />;
      default: return <Gift className="w-6 h-6" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ebook': return 'bg-blue-500';
      case 'template': return 'bg-green-500';
      case 'toolkit': return 'bg-purple-500';
      case 'course': return 'bg-yellow-500';
      case 'checklist': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (isSubscribed) {
    return (
      <div className="max-w-4xl mx-auto text-center">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-8 mb-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-2 text-green-800 dark:text-green-200">
            Welcome to the AI Tools Community!
          </h2>
          <p className="text-lg text-green-700 dark:text-green-300 mb-6">
            Check your email for download links and exclusive AI tool updates.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
              <Mail className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <h3 className="font-semibold">Weekly Newsletter</h3>
              <p className="text-sm text-gray-600">Latest AI tool discoveries</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
              <Zap className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <h3 className="font-semibold">Exclusive Deals</h3>
              <p className="text-sm text-gray-600">Early access to promotions</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
              <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <h3 className="font-semibold">Premium Resources</h3>
              <p className="text-sm text-gray-600">Subscriber-only content</p>
            </div>
          </div>
        </div>

        <Button 
          onClick={() => setIsSubscribed(false)}
          variant="outline"
        >
          Browse More Resources
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="text-center bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white rounded-xl p-8">
        <h1 className="text-4xl font-bold mb-4">
          Free AI Resources & Tools
        </h1>
        <p className="text-xl mb-6 text-blue-100">
          Curated templates, guides, and toolkits to accelerate your AI journey
        </p>
        
        {userArchetype && (
          <Badge className="bg-white/20 text-white border-white/30">
            Personalized for {userArchetype}
          </Badge>
        )}
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="ebook">eBooks</TabsTrigger>
          <TabsTrigger value="template">Templates</TabsTrigger>
          <TabsTrigger value="toolkit">Toolkits</TabsTrigger>
          <TabsTrigger value="course">Courses</TabsTrigger>
          <TabsTrigger value="checklist">Checklists</TabsTrigger>
        </TabsList>

        {['all', 'ebook', 'template', 'toolkit', 'course', 'checklist'].map((tabValue) => (
          <TabsContent key={tabValue} value={tabValue} className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {personalizedMagnets
                .filter(magnet => tabValue === 'all' || magnet.type === tabValue)
                .map((magnet) => {
                  const isDownloaded = downloadedItems.has(magnet.id);
                  const isPersonalized = userArchetype && magnet.targetArchetypes.includes(userArchetype);
                  
                  return (
                    <Card 
                      key={magnet.id}
                      className={`relative transition-all duration-300 hover:shadow-lg ${
                        isPersonalized ? 'border-purple-200 bg-purple-50 dark:bg-purple-900/10' : ''
                      }`}
                    >
                      {isPersonalized && (
                        <Badge className="absolute top-3 right-3 bg-purple-500 text-white">
                          Recommended
                        </Badge>
                      )}
                      
                      <CardHeader>
                        <div className="flex items-start gap-3">
                          <div className={`${getTypeColor(magnet.type)} text-white p-2 rounded-lg`}>
                            {getIconForType(magnet.type)}
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg mb-1">
                              {magnet.title}
                            </CardTitle>
                            <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span>{magnet.rating}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Download className="w-4 h-4 text-blue-500" />
                                <span>{magnet.downloadCount.toLocaleString()}</span>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs capitalize">
                              {magnet.type}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent>
                        <CardDescription className="mb-4 line-clamp-2">
                          {magnet.description}
                        </CardDescription>

                        {magnet.features && magnet.features.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-semibold text-sm mb-2">What's included:</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {magnet.features.slice(0, 3).map((feature, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                  <span>{feature}</span>
                                </li>
                              ))}
                              {magnet.features.length > 3 && (
                                <li className="text-xs text-gray-500">
                                  +{magnet.features.length - 3} more features
                                </li>
                              )}
                            </ul>
                          </div>
                        )}

                        <div className="space-y-3">
                          {isDownloaded ? (
                            <Button 
                              className="w-full"
                              onClick={() => window.open(magnet.downloadUrl, '_blank')}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download Again
                            </Button>
                          ) : (
                            <>
                              <Button 
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                onClick={() => {
                                  setSelectedMagnet(magnet.id);
                                  handleSubscribe(magnet.id);
                                }}
                                disabled={subscribeMutation.isPending}
                              >
                                <Mail className="w-4 h-4 mr-2" />
                                {subscribeMutation.isPending ? 'Subscribing...' : 'Get Free + Newsletter'}
                              </Button>
                              
                              <Button 
                                variant="outline"
                                className="w-full"
                                onClick={() => handleDirectDownload(magnet.id)}
                                disabled={downloadMutation.isPending}
                              >
                                <Download className="w-4 h-4 mr-2" />
                                {downloadMutation.isPending ? 'Preparing...' : 'Just Download'}
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Newsletter Signup Section */}
      {!isSubscribed && (
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">
            Get Weekly AI Tool Updates
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
            Join 50,000+ professionals who get our curated list of the best new AI tools, 
            exclusive deals, and productivity tips delivered to their inbox every week.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={() => handleSubscribe()}
              disabled={!email || subscribeMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Mail className="w-4 h-4 mr-2" />
              {subscribeMutation.isPending ? 'Subscribing...' : 'Subscribe'}
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 mt-3">
            No spam. Unsubscribe anytime. We respect your privacy.
          </p>
        </div>
      )}
    </div>
  );
}