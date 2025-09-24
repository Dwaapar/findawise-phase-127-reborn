import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { Heart, Brain, Activity, Zap, TrendingUp, Star, Award, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface HealthArchetype {
  id: number;
  slug: string;
  name: string;
  description: string;
  emotionMapping: string;
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

interface PremiumHealthUIProps {
  archetype?: HealthArchetype;
  userProgress?: {
    level: number;
    xp: number;
    streakDays: number;
    completedQuests: number;
  };
}

export function PremiumHealthUI({ archetype, userProgress }: PremiumHealthUIProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.6, 1, 0.6]);

  // Dynamic theme based on archetype
  const getThemeColors = () => {
    if (!archetype) return { primary: '#3B82F6', secondary: '#93C5FD', accent: '#1E40AF' };
    return archetype.colorScheme;
  };

  const colors = getThemeColors();

  // Animated metrics
  const [animatedStats, setAnimatedStats] = useState({
    level: 0,
    xp: 0,
    streak: 0,
    quests: 0
  });

  useEffect(() => {
    if (userProgress) {
      const timer = setTimeout(() => {
        setAnimatedStats(userProgress);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [userProgress]);

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      {/* Hero Section with Parallax */}
      <motion.div 
        style={{ y, opacity }}
        className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background/95 to-background/90"
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full opacity-20"
              style={{ 
                background: colors.primary,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.2, 0.5, 0.2],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Main Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-foreground via-foreground/80 to-foreground/60 bg-clip-text text-transparent mb-6">
              Health & Wellness
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              AI-powered personalization meets cutting-edge wellness science
            </p>
            
            {archetype && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="inline-flex items-center gap-3 bg-card/80 backdrop-blur-md rounded-full px-6 py-3 border"
                style={{ borderColor: colors.accent }}
              >
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: colors.primary }}
                />
                <span className="text-lg font-medium">{archetype.name}</span>
              </motion.div>
            )}
          </motion.div>

          {/* Progress Cards */}
          {userProgress && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12"
            >
              <ProgressCard
                icon={<TrendingUp className="w-6 h-6" />}
                label="Level"
                value={animatedStats.level}
                color={colors.primary}
                delay={0}
              />
              <ProgressCard
                icon={<Zap className="w-6 h-6" />}
                label="XP Points"
                value={animatedStats.xp}
                color={colors.secondary}
                delay={0.1}
              />
              <ProgressCard
                icon={<Activity className="w-6 h-6" />}
                label="Day Streak"
                value={animatedStats.streak}
                color={colors.accent}
                delay={0.2}
              />
              <ProgressCard
                icon={<Target className="w-6 h-6" />}
                label="Quests Done"
                value={animatedStats.quests}
                color={colors.primary}
                delay={0.3}
              />
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Feature Showcase */}
      <FeatureShowcase colors={colors} />

      {/* Interactive Tools Preview */}
      <ToolsPreview colors={colors} />

      {/* Gamification Elements */}
      <GamificationShowcase colors={colors} userProgress={userProgress} />
    </div>
  );
}

function ProgressCard({ 
  icon, 
  label, 
  value, 
  color, 
  delay 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: number; 
  color: string; 
  delay: number; 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.05 }}
      className="bg-card/60 backdrop-blur-md rounded-xl p-4 border border-border/50"
    >
      <div className="flex items-center gap-2 mb-2" style={{ color }}>
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: delay + 0.3, type: "spring" }}
        className="text-2xl font-bold"
      >
        {value}
      </motion.div>
    </motion.div>
  );
}

function FeatureShowcase({ colors }: { colors: any }) {
  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "AI Archetype Detection",
      description: "Advanced behavioral analysis identifies your unique health persona",
      gradient: `linear-gradient(135deg, ${colors.primary}20, ${colors.accent}20)`
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Personalized Wellness",
      description: "Custom recommendations based on your lifestyle and goals",
      gradient: `linear-gradient(135deg, ${colors.secondary}20, ${colors.primary}20)`
    },
    {
      icon: <Activity className="w-8 h-8" />,
      title: "Real-time Tracking",
      description: "Advanced analytics and progress monitoring",
      gradient: `linear-gradient(135deg, ${colors.accent}20, ${colors.secondary}20)`
    }
  ];

  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-5xl font-bold text-center mb-16"
        >
          Revolutionary Health Platform
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              whileHover={{ y: -10 }}
              className="relative group"
            >
              <Card className="h-full overflow-hidden border-0 shadow-lg">
                <div 
                  className="absolute inset-0 opacity-50"
                  style={{ background: feature.gradient }}
                />
                <CardContent className="relative z-10 p-8 text-center">
                  <div 
                    className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6"
                    style={{ backgroundColor: colors.primary + '20', color: colors.primary }}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ToolsPreview({ colors }: { colors: any }) {
  const tools = [
    { name: "BMI Calculator", usage: "2.1k", trend: "+12%" },
    { name: "Sleep Tracker", usage: "1.8k", trend: "+8%" },
    { name: "Calorie Counter", usage: "3.2k", trend: "+15%" },
    { name: "Stress Assessment", usage: "1.5k", trend: "+22%" }
  ];

  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-center mb-16"
        >
          Interactive Health Tools
        </motion.h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tools.map((tool, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="bg-card rounded-xl p-6 shadow-md hover:shadow-lg transition-all"
            >
              <h3 className="font-semibold mb-2">{tool.name}</h3>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold" style={{ color: colors.primary }}>
                  {tool.usage}
                </span>
                <Badge 
                  variant="secondary" 
                  className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                >
                  {tool.trend}
                </Badge>
              </div>
              <div className="mt-3">
                <Progress value={Math.random() * 100} className="h-2" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function GamificationShowcase({ colors, userProgress }: { colors: any; userProgress?: any }) {
  const achievements = [
    { name: "First Steps", icon: <Star className="w-5 h-5" />, earned: true },
    { name: "Week Warrior", icon: <Award className="w-5 h-5" />, earned: true },
    { name: "Consistency King", icon: <Target className="w-5 h-5" />, earned: false },
    { name: "Health Hero", icon: <Heart className="w-5 h-5" />, earned: false }
  ];

  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-center mb-16"
        >
          Gamified Wellness Journey
        </motion.h2>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Achievement Grid */}
          <div>
            <h3 className="text-2xl font-bold mb-6">Achievements</h3>
            <div className="grid grid-cols-2 gap-4">
              {achievements.map((achievement, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    achievement.earned 
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                      : 'border-gray-300 bg-gray-50 dark:bg-gray-800/50'
                  }`}
                >
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full mb-3 ${
                    achievement.earned ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {achievement.icon}
                  </div>
                  <h4 className="font-semibold text-sm">{achievement.name}</h4>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Progress Visualization */}
          <div>
            <h3 className="text-2xl font-bold mb-6">Your Progress</h3>
            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Level Progress</span>
                      <span className="text-sm text-muted-foreground">
                        {userProgress?.xp || 750}/1000 XP
                      </span>
                    </div>
                    <Progress value={(userProgress?.xp || 750) / 10} className="h-3" />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Weekly Goals</span>
                      <span className="text-sm text-muted-foreground">4/7 days</span>
                    </div>
                    <Progress value={57} className="h-3" />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Health Score</span>
                      <span className="text-sm text-muted-foreground">85/100</span>
                    </div>
                    <Progress value={85} className="h-3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}