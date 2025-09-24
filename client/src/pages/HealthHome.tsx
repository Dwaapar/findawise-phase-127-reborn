import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Heart, Brain, Activity, Moon, Target, TrendingUp, Star, Zap } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { PremiumHealthUI } from "@/components/health/PremiumHealthUI";
import { AdvancedHealthTools } from "@/components/health/AdvancedHealthTools";
import { ContentAutoRotator } from "@/components/health/ContentAutoRotator";

interface HealthArchetype {
  id: number;
  slug: string;
  name: string;
  description: string;
  emotionMapping: string;
  characteristics: any;
}

interface HealthTool {
  id: number;
  slug: string;
  name: string;
  description: string;
  category: string;
  emotionMapping: string;
}

interface HealthContent {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readingTime: number;
  targetArchetype: string;
}

interface GameStats {
  currentLevel: number;
  totalXP: number;
  streakDays: number;
  wellnessPoints: number;
}

export default function HealthHome() {
  const [detectedArchetype, setDetectedArchetype] = useState<HealthArchetype | null>(null);
  const [gameStats, setGameStats] = useState<GameStats>({
    currentLevel: 3,
    totalXP: 2850,
    streakDays: 12,
    wellnessPoints: 1250
  });

  // Generate session ID for tracking
  const sessionId = useState(() => 
    `health_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  )[0];

  // Fetch health archetypes
  const { data: archetypes } = useQuery({
    queryKey: ['/api/health/archetypes'],
    queryFn: async () => {
      const response = await fetch('/api/health/archetypes');
      if (!response.ok) throw new Error('Failed to fetch archetypes');
      const result = await response.json();
      return result.data as HealthArchetype[];
    }
  });

  // Fetch health tools
  const { data: tools } = useQuery({
    queryKey: ['/api/health/tools'],
    queryFn: async () => {
      const response = await fetch('/api/health/tools');
      if (!response.ok) throw new Error('Failed to fetch tools');
      const result = await response.json();
      return result.data as HealthTool[];
    }
  });

  // Fetch health content
  const { data: content } = useQuery({
    queryKey: ['/api/health/content'],
    queryFn: async () => {
      const response = await fetch('/api/health/content');
      if (!response.ok) throw new Error('Failed to fetch content');
      const result = await response.json();
      return result.data as HealthContent[];
    }
  });

  // Fetch gamification data
  const { data: gamification } = useQuery({
    queryKey: ['/api/health/gamification', sessionId],
    queryFn: async () => {
      const response = await fetch(`/api/health/gamification/${sessionId}`);
      if (!response.ok) throw new Error('Failed to fetch gamification');
      const result = await response.json();
      return result.data;
    }
  });

  useEffect(() => {
    if (gamification) {
      setGameStats({
        currentLevel: gamification.currentLevel || 1,
        totalXP: gamification.totalXP || 0,
        streakDays: gamification.streakDays || 0,
        wellnessPoints: gamification.wellnessPoints || 0
      });
    }
  }, [gamification]);

  // Auto-detect archetype based on behavior
  useEffect(() => {
    const detectArchetype = async () => {
      try {
        const behaviorData = {
          timeOfDay: new Date().getHours(),
          sessionStart: Date.now(),
          userAgent: navigator.userAgent
        };

        const response = await fetch('/api/health/detect-archetype', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            behaviorData,
            userId: null
          })
        });

        if (response.ok) {
          const result = await response.json();
          setDetectedArchetype(result.data.slug);
        }
      } catch (error) {
        console.error('Failed to detect archetype:', error);
      }
    };

    detectArchetype();
  }, [sessionId]);

  const getEmotionTheme = (emotion: string) => {
    const themes = {
      calm: "bg-blue-50 border-blue-200 text-blue-800",
      energetic: "bg-orange-50 border-orange-200 text-orange-800", 
      trustworthy: "bg-green-50 border-green-200 text-green-800",
      playful: "bg-purple-50 border-purple-200 text-purple-800"
    };
    return themes[emotion as keyof typeof themes] || themes.trustworthy;
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      fitness: Activity,
      nutrition: Heart,
      "mental-health": Brain,
      sleep: Moon,
      default: Target
    };
    const IconComponent = icons[category as keyof typeof icons] || icons.default;
    return <IconComponent className="h-5 w-5" />;
  };

  const addXP = async (amount: number, reason: string) => {
    try {
      const response = await fetch(`/api/health/gamification/${sessionId}/xp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, reason })
      });

      if (response.ok) {
        const result = await response.json();
        setGameStats(prev => ({
          ...prev,
          totalXP: result.data.totalXP,
          currentLevel: result.data.currentLevel,
          wellnessPoints: result.data.wellnessPoints
        }));
        
        toast({
          title: "XP Earned!",
          description: `+${amount} XP for ${reason}`,
        });
      }
    } catch (error) {
      console.error('Failed to add XP:', error);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Premium UI Hero Section */}
      <PremiumHealthUI 
        archetype={detectedArchetype}
        userProgress={{
          level: gameStats.currentLevel,
          xp: gameStats.totalXP,
          streakDays: gameStats.streakDays,
          completedQuests: 8
        }}
      />

      <div className="max-w-7xl mx-auto px-4 space-y-8">

        {/* Gamification Stats */}
        <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-6 w-6" />
              Your Wellness Journey
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{gameStats.currentLevel}</div>
                <div className="text-sm opacity-90">Level</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{gameStats.totalXP}</div>
                <div className="text-sm opacity-90">Total XP</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{gameStats.streakDays}</div>
                <div className="text-sm opacity-90">Day Streak</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{gameStats.wellnessPoints}</div>
                <div className="text-sm opacity-90">Wellness Points</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress to Level {gameStats.currentLevel + 1}</span>
                <span>{gameStats.totalXP % 100}/100 XP</span>
              </div>
              <Progress value={(gameStats.totalXP % 100)} className="bg-white/20" />
            </div>
          </CardContent>
        </Card>

        {/* Detected Archetype */}
        {detectedArchetype && (
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Brain className="h-6 w-6" />
                Your Health Archetype Detected
              </CardTitle>
              <CardDescription>
                AI-powered analysis of your wellness profile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Badge className="text-lg px-4 py-2 bg-blue-100 text-blue-800">
                {detectedArchetype.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
              <p className="mt-3 text-gray-600">
                Based on your behavior patterns, we've identified your wellness archetype. 
                This helps us personalize your experience with targeted tools and content.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Advanced Health Tools */}
        <section className="space-y-6">
          <AdvancedHealthTools 
            tools={tools || []}
            onToolUsage={(toolSlug, inputs, results) => {
              // Track tool usage analytics
              fetch('/api/health/analytics/tool-usage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  toolSlug,
                  sessionId,
                  inputs,
                  results
                })
              }).catch(console.error);
              
              // Award XP for tool usage
              addXP(25, `Used ${toolSlug.replace(/-/g, ' ')}`);
            }}
          />
        </section>

        {/* Dynamic Content Auto-Rotation */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-blue-500" />
            Personalized Content Feed
          </h2>
          <ContentAutoRotator 
            archetype={detectedArchetype?.slug}
            sessionId={sessionId}
            location="global"
            intent="wellness"
          />
        </section>

        {/* Featured Health Tools */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Zap className="h-8 w-8 text-yellow-500" />
              Health Tools
            </h2>
            <Button 
              variant="outline" 
              onClick={() => addXP(5, "exploring tools")}
            >
              Explore All Tools
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools?.slice(0, 6).map((tool) => (
              <Card 
                key={tool.id} 
                className={`hover:shadow-lg transition-all cursor-pointer ${getEmotionTheme(tool.emotionMapping)}`}
                onClick={() => addXP(3, "using health tool")}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {getCategoryIcon(tool.category)}
                    {tool.name}
                  </CardTitle>
                  <Badge variant="secondary" className="w-fit">
                    {tool.category}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">{tool.description}</p>
                  <Button size="sm" className="w-full">
                    Use Tool
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Featured Content */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-500" />
            Latest Health Insights
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {content?.slice(0, 6).map((article) => (
              <Card key={article.id} className="hover:shadow-lg transition-all cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg line-clamp-2">{article.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{article.category}</Badge>
                    <span className="text-sm text-gray-500">{article.readingTime} min read</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 line-clamp-3 mb-4">{article.excerpt}</p>
                  <Button size="sm" className="w-full" onClick={() => addXP(2, "reading article")}>
                    Read Article
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-green-100 to-emerald-100 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Target className="h-6 w-6" />
                Take Wellness Quiz
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-green-700 mb-4">
                Discover your health archetype and get personalized recommendations.
              </p>
              <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => addXP(10, "taking quiz")}>
                Start Quiz
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-100 to-cyan-100 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Activity className="h-6 w-6" />
                Daily Challenges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-700 mb-4">
                Complete daily wellness challenges to earn XP and build healthy habits.
              </p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => addXP(15, "daily challenge")}>
                View Challenges
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-100 to-pink-100 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <TrendingUp className="h-6 w-6" />
                Track Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-purple-700 mb-4">
                Monitor your wellness journey with detailed analytics and insights.
              </p>
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                View Dashboard
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}