import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Brain, Zap, Target, Sparkles, Search, Filter, Star, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { saasCategories, userPersonas, emotionMappingSaaS } from "@/config/saasConfig";
import BattleCards from "@/components/SaaS/advanced/BattleCards";
import LiveDealZone from "@/components/SaaS/advanced/LiveDealZone";

interface SaaSHomeProps {
  emotion?: keyof typeof emotionMappingSaaS;
}

export default function SaaSHome({ emotion = "excitement" }: SaaSHomeProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPersona, setSelectedPersona] = useState("");

  const emotionTheme = emotionMappingSaaS[emotion];

  // Fetch featured tools and deals
  const { data: featuredTools, isLoading } = useQuery({
    queryKey: ["/api/saas/tools/featured"],
    enabled: true,
  });

  const { data: activeDeals } = useQuery({
    queryKey: ["/api/saas/deals/active"],
    enabled: true,
  });

  const { data: toolStats } = useQuery({
    queryKey: ["/api/saas/stats"],
    enabled: true,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 py-20 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 dark:from-blue-500/10 dark:to-purple-500/10" />
        
        <div className="relative mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="text-blue-600 dark:text-blue-400"
              >
                <Brain className="h-12 w-12" />
              </motion.div>
              <h1 className="text-5xl lg:text-7xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                SaaS Intelligence
              </h1>
            </div>
            
            <p className="text-xl lg:text-2xl text-slate-600 dark:text-slate-300 mb-8 max-w-4xl mx-auto leading-relaxed">
              Discover your perfect software stack with AI-powered recommendations, 
              comprehensive reviews, and real-time pricing insights for 1000+ tools
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
              <Badge variant="secondary" className="text-lg py-2 px-4">
                <Zap className="h-4 w-4 mr-2" />
                AI-Powered Matching
              </Badge>
              <Badge variant="secondary" className="text-lg py-2 px-4">
                <Target className="h-4 w-4 mr-2" />
                ROI Optimization
              </Badge>
              <Badge variant="secondary" className="text-lg py-2 px-4">
                <Sparkles className="h-4 w-4 mr-2" />
                Live Deal Tracking
              </Badge>
            </div>

            {/* Search and Filter Bar */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                  <Input
                    placeholder="Search tools, features, or use cases..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12 text-lg"
                  />
                </div>
                
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="h-12 px-4 text-lg rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                >
                  <option value="all">All Categories</option>
                  {saasCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                
                <select
                  value={selectedPersona}
                  onChange={(e) => setSelectedPersona(e.target.value)}
                  className="h-12 px-4 text-lg rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                >
                  <option value="">Select Your Role</option>
                  {userPersonas.map((persona) => (
                    <option key={persona.id} value={persona.id}>
                      {persona.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex flex-wrap gap-3 mt-6">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Find My Perfect Stack
                </Button>
                <Button size="lg" variant="outline">
                  Take SaaS Quiz
                </Button>
                <Button size="lg" variant="outline">
                  ROI Calculator
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: "SaaS Tools", value: toolStats?.totalTools || "1000+", icon: Brain },
              { label: "Categories", value: saasCategories.length, icon: Filter },
              { label: "Active Deals", value: activeDeals?.length || "50+", icon: TrendingUp },
              { label: "Avg. Rating", value: "4.7/5", icon: Star },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <stat.icon className="h-8 w-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                    <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                      {stat.value}
                    </div>
                    <div className="text-slate-600 dark:text-slate-400">
                      {stat.label}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="px-6 py-16 bg-white/50 dark:bg-slate-800/50">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Explore by Category
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              Find the perfect tools for every aspect of your business
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {saasCategories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <CardHeader className="text-center p-6">
                    <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">
                      {/* Icon would be rendered here based on category.icon */}
                      🚀
                    </div>
                    <CardTitle className="text-lg font-semibold mb-2">
                      {category.name}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {category.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Tools */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                Featured Tools
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-400">
                Top-rated tools recommended by our AI
              </p>
            </div>
            <Button variant="outline" size="lg">
              View All Tools
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="h-64 animate-pulse">
                  <CardContent className="p-6">
                    <div className="bg-slate-200 dark:bg-slate-700 rounded h-16 mb-4" />
                    <div className="bg-slate-200 dark:bg-slate-700 rounded h-4 mb-2" />
                    <div className="bg-slate-200 dark:bg-slate-700 rounded h-4 w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Featured tools will be rendered here once data is available */}
              {[...Array(6)].map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="group hover:shadow-xl transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                          T
                        </div>
                        <div>
                          <CardTitle className="text-lg">Tool Name</CardTitle>
                          <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            4.8 (1,234 reviews)
                          </div>
                        </div>
                      </div>
                      <CardDescription>
                        Professional tool description that highlights key features and benefits.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          Starting from <span className="font-semibold text-slate-900 dark:text-slate-100">$29/mo</span>
                        </div>
                        <Button size="sm" className="group-hover:bg-blue-600">
                          Learn More
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Advanced Gamification Section */}
      <section className="px-6 py-20 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-900">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">Interactive SaaS Discovery</h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              Engage with our AI-powered tools to find your perfect software match
            </p>
          </motion.div>

          {/* Battle Cards Component */}
          <div className="mb-16">
            <BattleCards 
              onVote={(winnerId, loserId) => {
                console.log(`Vote recorded: ${winnerId} beat ${loserId}`);
                // Track analytics for battle votes
              }}
              onBattleComplete={(result) => {
                console.log('Battle completed:', result);
                // Track battle completion metrics
              }}
            />
          </div>

          {/* Live Deal Zone Component */}
          <div className="mb-16">
            <LiveDealZone 
              onDealClick={(dealId) => {
                console.log(`Deal clicked: ${dealId}`);
                // Track deal engagement analytics
              }}
              maxDeals={6}
            />
          </div>
        </div>
      </section>
    </div>
  );
}