import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { TrendingUp, Calculator, PiggyBank, Target, Shield, CreditCard, DollarSign, BookOpen, Users, Award, Zap, ArrowRight, CheckCircle, Star, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAnalytics } from '@/hooks/useAnalytics';
import { financePersonas, financeCalculators, financeContentCategories } from '@/config/financeConfig';

export default function FinanceHome() {
  const [currentHero, setCurrentHero] = useState(0);
  const [visitorPersona, setVisitorPersona] = useState<string>('new');
  const [urgencyLevel, setUrgencyLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [showVideo, setShowVideo] = useState(false);
  const { trackEvent } = useAnalytics();

  // Hero carousel for personal finance messaging
  const heroSlides = [
    {
      title: "Master Your Money in 2025",
      subtitle: "AI-powered personal finance guidance tailored to your goals",
      image: "/api/placeholder/800/400",
      cta: "Take Your Money Quiz",
      urgency: "Join 50,000+ people taking control of their finances",
      persona: "general"
    },
    {
      title: "From Broke to Building Wealth",
      subtitle: "Smart budgeting and investing strategies for every stage",
      image: "/api/placeholder/800/400", 
      cta: "Start Your Budget",
      urgency: "Free tools used by 25,000+ students and young professionals",
      persona: "young"
    },
    {
      title: "Retire Early, Live Free",
      subtitle: "FIRE strategies and advanced wealth building",
      image: "/api/placeholder/800/400",
      cta: "Calculate Your FIRE Number",
      urgency: "See if you can retire 10-20 years early",
      persona: "fire"
    },
    {
      title: "Escape the Debt Trap",
      subtitle: "Proven strategies to pay off debt fast and rebuild credit",
      image: "/api/placeholder/800/400",
      cta: "Create Your Debt Plan",
      urgency: "Average user pays off debt 40% faster",
      persona: "debt"
    }
  ];

  // Personalization based on user behavior
  useEffect(() => {
    const detectPersona = () => {
      const timeOnSite = Date.now() - (window.performance?.timing?.navigationStart || 0);
      const scrollDepth = window.scrollY / Math.max(document.body.scrollHeight, 1);
      
      if (timeOnSite > 30000 && scrollDepth > 0.3) {
        setVisitorPersona('engaged');
      } else if (timeOnSite > 60000) {
        setVisitorPersona('researching');
      }
    };

    const interval = setInterval(detectPersona, 10000);
    return () => clearInterval(interval);
  }, []);

  // Auto-advance hero carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHero((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Dynamic urgency based on time and behavior
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 18 || hour <= 6) {
      setUrgencyLevel('high'); // Evening/night = higher urgency for financial planning
    } else if (visitorPersona === 'engaged') {
      setUrgencyLevel('high');
    }
  }, [visitorPersona]);

  const getPersonalizedCTA = () => {
    switch (visitorPersona) {
      case 'engaged': return 'Get Your Personalized Finance Plan →';
      case 'researching': return 'Compare Financial Strategies →';
      default: return 'Start Your Money Journey →';
    }
  };

  const urgencyColors = {
    low: 'bg-blue-50 text-blue-700 border-blue-200',
    medium: 'bg-orange-50 text-orange-700 border-orange-200', 
    high: 'bg-red-50 text-red-700 border-red-200'
  };

  const handleHeroClick = (action: string) => {
    trackEvent({
      eventType: 'cta_click',
      eventData: { 
        source: 'hero_carousel',
        action,
        slide: currentHero,
        persona: visitorPersona 
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-100">
      {/* Hero Section with Financial Focus */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-blue-600/20"></div>
        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className={`inline-flex items-center gap-2 px-4 py-2 ${urgencyColors[urgencyLevel]}`}>
                  <Zap className="w-4 h-4" />
                  {heroSlides[currentHero].urgency}
                </Badge>
                <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
                  {heroSlides[currentHero].title}
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  {heroSlides[currentHero].subtitle}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/finance/quiz">
                  <Button 
                    size="lg" 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    onClick={() => handleHeroClick('primary_cta')}
                  >
                    <Calculator className="w-5 h-5 mr-2" />
                    {heroSlides[currentHero].cta}
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 px-8 py-4 text-lg font-semibold"
                  onClick={() => setShowVideo(true)}
                >
                  <Play className="w-5 h-5 mr-2" />
                  Watch Demo
                </Button>
              </div>

              {/* Social Proof */}
              <div className="flex items-center gap-4 pt-4">
                <div className="flex -space-x-2">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-400 to-blue-400 border-2 border-white flex items-center justify-center text-white font-semibold">
                      {i}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">4.9/5</span>
                  </div>
                  <div>50,000+ users trust our advice</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/20">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Quick Financial Health Check</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Emergency Fund</span>
                    <span className="font-semibold text-emerald-600">Build First</span>
                  </div>
                  <Progress value={25} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Debt-to-Income</span>
                    <span className="font-semibold text-orange-600">Needs Work</span>
                  </div>
                  <Progress value={65} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Retirement Savings</span>
                    <span className="font-semibold text-blue-600">On Track</span>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>
                <Link href="/finance/quiz">
                  <Button className="w-full mt-6 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700">
                    Get Your Personal Assessment
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Hero slide indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentHero ? 'bg-emerald-600 w-8' : 'bg-white/50'
              }`}
              onClick={() => setCurrentHero(index)}
            />
          ))}
        </div>
      </section>

      {/* Money Personas Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Find Your Money Personality
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get personalized financial advice based on your unique situation and goals
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {financePersonas.slice(0, 6).map((persona) => (
              <Card key={persona.id} className="hover:shadow-lg transition-all duration-300 border-l-4" style={{ borderLeftColor: persona.colors.primary }}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span style={{ color: persona.colors.primary }}>{persona.name}</span>
                    <Badge variant="secondary">{persona.budgetRange}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{persona.description}</p>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">Key Concerns:</div>
                    <div className="flex flex-wrap gap-1">
                      {persona.primaryConcerns.slice(0, 3).map((concern) => (
                        <Badge key={concern} variant="outline" className="text-xs">
                          {concern}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Link href={`/finance/persona/${persona.id}`}>
                    <Button variant="outline" className="w-full mt-4 hover:bg-gray-50">
                      Learn More <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Financial Calculators Section */}
      <section className="py-16 bg-gradient-to-r from-emerald-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Smart Financial Calculators
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Make informed financial decisions with our AI-powered calculators
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {financeCalculators.map((calculator) => (
              <Card key={calculator.id} className="hover:shadow-lg transition-all duration-300 bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-100">
                      {calculator.icon === 'calculator' && <Calculator className="w-5 h-5 text-emerald-600" />}
                      {calculator.icon === 'flame' && <Target className="w-5 h-5 text-emerald-600" />}
                      {calculator.icon === 'trending-up' && <TrendingUp className="w-5 h-5 text-emerald-600" />}
                      {calculator.icon === 'credit-card' && <CreditCard className="w-5 h-5 text-emerald-600" />}
                      {calculator.icon === 'shield' && <Shield className="w-5 h-5 text-emerald-600" />}
                    </div>
                    <div>
                      <div className="text-lg font-semibold">{calculator.name}</div>
                      <div className="text-sm text-gray-500">{calculator.estimatedTime}</div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{calculator.description}</p>
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="secondary">{calculator.difficulty}</Badge>
                    <Badge variant="outline">{calculator.category}</Badge>
                  </div>
                  <Link href={`/finance/calculator/${calculator.id}`}>
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                      Use Calculator
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Content Categories */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Master Every Aspect of Personal Finance
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Expert guides and articles to help you make informed financial decisions
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {financeContentCategories.map((category) => (
              <Card key={category.id} className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${category.color}`}>
                      {category.icon === 'piggy-bank' && <PiggyBank className="w-6 h-6" />}
                      {category.icon === 'trending-up' && <TrendingUp className="w-6 h-6" />}
                      {category.icon === 'credit-card' && <CreditCard className="w-6 h-6" />}
                      {category.icon === 'calendar' && <Target className="w-6 h-6" />}
                      {category.icon === 'shield' && <Shield className="w-6 h-6" />}
                      {category.icon === 'file-text' && <BookOpen className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="text-xl font-semibold group-hover:text-emerald-600 transition-colors">
                        {category.name}
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{category.description}</p>
                  <div className="flex items-center text-emerald-600 font-medium group-hover:text-emerald-700 transition-colors">
                    Explore Articles <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories / Gamification Preview */}
      <section className="py-16 bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Join the Money Quest
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Level up your finances with our gamified approach to wealth building
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center bg-white">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full flex items-center justify-center">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <CardTitle>Earn Badges</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Complete challenges and earn badges for hitting financial milestones</p>
              </CardContent>
            </Card>

            <Card className="text-center bg-white">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <CardTitle>Community Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Connect with others on similar financial journeys and share success stories</p>
              </CardContent>
            </Card>

            <Card className="text-center bg-white">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <CardTitle>Track Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Set goals, track progress, and celebrate wins on your wealth-building journey</p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Link href="/finance/quiz">
              <Button size="lg" className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 px-8 py-4 text-lg font-semibold">
                {getPersonalizedCTA()}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Compliance & Trust Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
              <div className="font-semibold">FINRA Compliant</div>
              <div className="text-sm text-gray-600">All recommendations follow financial industry standards</div>
            </div>
            <div className="space-y-2">
              <Shield className="w-8 h-8 text-blue-600 mx-auto" />
              <div className="font-semibold">Bank-Level Security</div>
              <div className="text-sm text-gray-600">Your financial data is encrypted and protected</div>
            </div>
            <div className="space-y-2">
              <BookOpen className="w-8 h-8 text-purple-600 mx-auto" />
              <div className="font-semibold">Educational Focus</div>
              <div className="text-sm text-gray-600">We educate, not sell financial products</div>
            </div>
            <div className="space-y-2">
              <Users className="w-8 h-8 text-orange-600 mx-auto" />
              <div className="font-semibold">Expert Reviewed</div>
              <div className="text-sm text-gray-600">Content reviewed by certified financial planners</div>
            </div>
          </div>
        </div>
      </section>

      {/* Affiliate Disclosure */}
      <div className="bg-yellow-50 border border-yellow-200 p-4 text-center text-sm text-yellow-800">
        <strong>Affiliate Disclosure:</strong> This site may contain affiliate links. We may earn a commission when you click on or make purchases via links. This doesn't affect our editorial independence or the cost to you.
      </div>
    </div>
  );
}