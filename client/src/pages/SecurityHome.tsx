import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Shield, Camera, Lock, Bell, Zap, Star, ArrowRight, PlayCircle, Users, Award, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

// Modern 2025 UI/UX Design with AI-powered personalization
export default function SecurityHome() {
  const [currentHero, setCurrentHero] = useState(0);
  const [visitorPersona, setVisitorPersona] = useState<string>('new');
  const [urgencyLevel, setUrgencyLevel] = useState<'low' | 'medium' | 'high'>('medium');

  // Hero carousel for modern 2025 design trends
  const heroSlides = [
    {
      title: "Smart Home Security That Actually Works",
      subtitle: "AI-powered protection with zero false alarms",
      image: "/api/placeholder/800/400",
      cta: "Get Your Free Assessment",
      urgency: "96% of break-ins are preventable with proper security"
    },
    {
      title: "Your Family Deserves Better Security",
      subtitle: "Professional-grade systems, DIY installation",
      image: "/api/placeholder/800/400", 
      cta: "Protect Your Loved Ones",
      urgency: "Crime rates up 23% in 2025 - don't wait"
    },
    {
      title: "Stop Worrying About Home Security",
      subtitle: "Complete peace of mind for $50/month",
      image: "/api/placeholder/800/400",
      cta: "Start Your Protection",
      urgency: "Limited time: Free installation worth $299"
    }
  ];

  // Personalization based on user behavior
  useEffect(() => {
    const detectPersona = () => {
      const timeOnSite = Date.now() - (window.performance?.timing?.navigationStart || 0);
      const scrollDepth = window.scrollY / document.body.scrollHeight;
      
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
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Dynamic urgency based on time and behavior
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 18 || hour <= 6) {
      setUrgencyLevel('high'); // Evening/night = higher urgency
    } else if (visitorPersona === 'engaged') {
      setUrgencyLevel('high');
    }
  }, [visitorPersona]);

  const getPersonalizedCTA = () => {
    switch (visitorPersona) {
      case 'engaged': return 'Get Your Custom Security Plan →';
      case 'researching': return 'Compare Top Security Systems →';
      default: return 'Find the Perfect Security Solution →';
    }
  };

  const urgencyColors = {
    low: 'bg-blue-50 text-blue-700 border-blue-200',
    medium: 'bg-orange-50 text-orange-700 border-orange-200', 
    high: 'bg-red-50 text-red-700 border-red-200'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section with 2025 Design Trends */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-indigo-900/90 z-10" />
        <div className="absolute inset-0 bg-[url('/api/placeholder/1920/1080')] bg-cover bg-center" />
        
        <div className="relative z-20 container mx-auto px-4 py-24 lg:py-32">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentHero}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6 }}
              className="text-center text-white"
            >
              <Badge className={`mb-6 px-4 py-2 text-sm font-semibold border ${urgencyColors[urgencyLevel]}`}>
                🚨 {heroSlides[currentHero].urgency}
              </Badge>
              
              <h1 className="text-4xl lg:text-6xl font-bold mb-6 tracking-tight">
                {heroSlides[currentHero].title}
              </h1>
              
              <p className="text-xl lg:text-2xl mb-8 text-blue-100 max-w-2xl mx-auto">
                {heroSlides[currentHero].subtitle}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/security-quiz">
                  <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-lg">
                    {heroSlides[currentHero].cta} <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-white text-white hover:bg-white hover:text-blue-900 px-8 py-4 text-lg"
                >
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Watch 2-Min Demo
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Hero Navigation Dots */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30 flex space-x-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentHero(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentHero ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Trust Indicators - 2025 Social Proof Design */}
      <section className="py-8 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500 fill-current" />
              <span className="text-sm font-medium">4.9/5 on Google Reviews</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium">500,000+ Homes Protected</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium">2025 Security Choice Award</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <span className="text-sm font-medium">99.9% Uptime Guarantee</span>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Agitation - Emotion-Based Design */}
      <section className="py-16 bg-gradient-to-r from-red-50 to-orange-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-8">
              Every 12 Seconds, Someone's Home is Broken Into
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-white shadow-lg border-l-4 border-red-500">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-red-600 mb-2">2.5M+</div>
                  <p className="text-gray-700">Home break-ins annually</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white shadow-lg border-l-4 border-orange-500">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-orange-600 mb-2">$2,661</div>
                  <p className="text-gray-700">Average loss per burglary</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white shadow-lg border-l-4 border-yellow-500">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-yellow-600 mb-2">28%</div>
                  <p className="text-gray-700">Occur when someone's home</p>
                </CardContent>
              </Card>
            </div>
            
            <p className="text-lg text-gray-600 mb-8">
              Don't become a statistic. Most break-ins are preventable with the right security system.
            </p>
            
            <Link href="/security-quiz">
              <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white px-8 py-4">
                Protect My Family Now <Shield className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Solution Overview - Modern Card Design */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Complete Home Security Made Simple
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Professional-grade protection with smart technology that learns your lifestyle
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Camera className="h-8 w-8" />,
                title: "4K Smart Cameras",
                description: "Crystal clear footage with AI person detection",
                color: "bg-blue-100 text-blue-600"
              },
              {
                icon: <Lock className="h-8 w-8" />,
                title: "Smart Door Locks", 
                description: "Keyless entry with temporary guest codes",
                color: "bg-green-100 text-green-600"
              },
              {
                icon: <Bell className="h-8 w-8" />,
                title: "24/7 Monitoring",
                description: "Professional response in under 30 seconds",
                color: "bg-purple-100 text-purple-600"
              },
              {
                icon: <Zap className="h-8 w-8" />,
                title: "Smart Integration",
                description: "Works with Alexa, Google, and Apple HomeKit",
                color: "bg-orange-100 text-orange-600"
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-6 text-center">
                    <div className={`w-16 h-16 rounded-full ${feature.color} flex items-center justify-center mx-auto mb-4`}>
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Security Quiz CTA - Personalized */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Get Your Personalized Security Recommendation
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Take our 2-minute quiz to discover the perfect security system for your home, budget, and lifestyle.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/security-quiz">
                <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-lg">
                  {getPersonalizedCTA()}
                </Button>
              </Link>
              <Link href="/security-tools">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-white text-white hover:bg-white hover:text-blue-700 px-8 py-4 text-lg"
                >
                  Explore Security Tools
                </Button>
              </Link>
            </div>
            
            <p className="text-sm text-blue-200 mt-4">
              ✓ No spam, ever ✓ Instant results ✓ Free consultation included
            </p>
          </motion.div>
        </div>
      </section>

      {/* Product Showcase - Modern 2025 Design */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              2025's Most Advanced Security Systems
            </h2>
            <p className="text-xl text-gray-600">
              Compare top-rated systems chosen by security experts
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {[
              {
                name: "SimpliSafe Pro",
                price: "$299",
                monthly: "$24.99/mo",
                features: ["8 Sensors Included", "HD Camera", "Professional Monitoring", "Mobile App Control"],
                badge: "Most Popular",
                badgeColor: "bg-blue-500"
              },
              {
                name: "Ring Alarm Pro", 
                price: "$379",
                monthly: "$20/mo",
                features: ["10 Sensors Included", "4K Doorbell Camera", "Alexa Integration", "Cloud Storage"],
                badge: "Best Value",
                badgeColor: "bg-green-500"
              },
              {
                name: "ADT Command",
                price: "$599", 
                monthly: "$45.99/mo",
                features: ["Professional Install", "24/7 Monitoring", "Smart Home Hub", "Lifetime Warranty"],
                badge: "Premium Choice",
                badgeColor: "bg-purple-500"
              }
            ].map((system, index) => (
              <Card key={system.name} className="relative overflow-hidden hover:shadow-xl transition-shadow duration-300">
                {system.badge && (
                  <div className={`absolute top-4 right-4 ${system.badgeColor} text-white px-3 py-1 rounded-full text-sm font-semibold`}>
                    {system.badge}
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="text-2xl font-bold mb-2">{system.name}</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-900">{system.price}</span>
                    <span className="text-gray-600 ml-2">+ {system.monthly}</span>
                  </div>
                  
                  <ul className="space-y-2 mb-6">
                    {system.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    Get Free Quote <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Security Tips & Content Hub */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Expert Security Insights
            </h2>
            <p className="text-xl text-gray-600">
              Stay informed with the latest home security tips and trends
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Top 10 Home Security Mistakes to Avoid",
                excerpt: "Don't make these common errors that leave your home vulnerable to break-ins.",
                readTime: "8 min read",
                href: "/security-guides/top-10-mistakes"
              },
              {
                title: "Best Camera Placement for Maximum Coverage",
                excerpt: "Professional installation secrets for optimal security camera positioning.",
                readTime: "12 min read", 
                href: "/security-guides/camera-placement"
              },
              {
                title: "Complete Security Guide for Renters",
                excerpt: "Protect your apartment without violating lease agreements.",
                readTime: "15 min read",
                href: "/security-guides/renters-guide"
              }
            ].map((article) => (
              <Link key={article.title} href={article.href}>
                <Card className="h-full hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-32"></div>
                  <CardContent className="p-6">
                    <Badge className="mb-3 bg-blue-100 text-blue-700">{article.readTime}</Badge>
                    <h3 className="text-xl font-semibold mb-3 line-clamp-2">{article.title}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">{article.excerpt}</p>
                    <div className="flex items-center text-blue-600 font-medium">
                      Read More <ArrowRight className="ml-1 h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA - Urgency Based on Time */}
      <section className="py-16 bg-gradient-to-r from-gray-900 to-blue-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            {urgencyLevel === 'high' 
              ? "Don't Wait Until It's Too Late" 
              : "Secure Your Home Today"}
          </h2>
          <p className="text-xl mb-8 text-gray-300 max-w-2xl mx-auto">
            Join thousands of families who sleep better knowing their homes are protected by professional-grade security.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/security-quiz">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-lg">
                Get Your Free Security Assessment
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg" 
              className="border-white text-white hover:bg-white hover:text-gray-900 px-8 py-4 text-lg"
            >
              Call (555) 123-SAFE
            </Button>
          </div>
          
          <div className="flex justify-center items-center gap-8 mt-8 text-sm text-gray-400">
            <span>✓ Free consultation</span>
            <span>✓ No obligation</span>
            <span>✓ Same-day quotes</span>
          </div>
        </div>
      </section>

      {/* Affiliate Disclaimer */}
      <footer className="py-8 bg-gray-100 text-center text-sm text-gray-600">
        <div className="container mx-auto px-4">
          <p>
            <strong>Affiliate Disclosure:</strong> This website contains affiliate links. We may earn a commission 
            from purchases made through these links at no additional cost to you. All recommendations are based 
            on extensive research and real-world testing by our security experts.
          </p>
        </div>
      </footer>
    </div>
  );
}