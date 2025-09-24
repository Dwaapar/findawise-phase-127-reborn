import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Zap, Star, Users, TrendingUp, Award, Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  rating: number;
  logo: string;
  pricing: { monthly: number };
  features: string[];
  votes: number;
  strongPoints: string[];
}

interface BattleResult {
  winner: Tool;
  loser: Tool;
  winPercentage: number;
  totalVotes: number;
  reasons: string[];
}

interface BattleCardsProps {
  onVote?: (winnerId: string, loserId: string) => void;
  onBattleComplete?: (result: BattleResult) => void;
}

export default function BattleCards({ onVote, onBattleComplete }: BattleCardsProps) {
  const [tool1, setTool1] = useState<Tool | null>(null);
  const [tool2, setTool2] = useState<Tool | null>(null);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const { toast } = useToast();

  // Sample tools data - in production, this would come from API
  const sampleTools: Tool[] = [
    {
      id: "notion",
      name: "Notion",
      description: "All-in-one workspace for notes, docs, and collaboration",
      category: "productivity",
      rating: 4.7,
      logo: "/logos/notion.png",
      pricing: { monthly: 8 },
      features: ["Notes", "Databases", "Wiki", "Projects", "AI Assistant"],
      votes: 1247,
      strongPoints: ["Flexibility", "Database features", "Template ecosystem"]
    },
    {
      id: "obsidian",
      name: "Obsidian",
      description: "Powerful knowledge base that works on local Markdown files",
      category: "productivity",
      rating: 4.8,
      logo: "/logos/obsidian.png",
      pricing: { monthly: 0 },
      features: ["Graph view", "Plugins", "Local files", "Linking", "Themes"],
      votes: 892,
      strongPoints: ["Local storage", "Extensibility", "Graph connections"]
    },
    {
      id: "airtable",
      name: "Airtable",
      description: "Spreadsheet-database hybrid for organizing work",
      category: "productivity",
      rating: 4.6,
      logo: "/logos/airtable.png",
      pricing: { monthly: 20 },
      features: ["Databases", "Views", "Automation", "Forms", "API"],
      votes: 1156,
      strongPoints: ["Database power", "Collaboration", "Automation"]
    },
    {
      id: "slack",
      name: "Slack",
      description: "Team communication and collaboration platform",
      category: "communication",
      rating: 4.5,
      logo: "/logos/slack.png",
      pricing: { monthly: 7.25 },
      features: ["Channels", "DMs", "File sharing", "Integrations", "Workflows"],
      votes: 2341,
      strongPoints: ["Team communication", "Integrations", "Search"]
    },
    {
      id: "discord",
      name: "Discord",
      description: "Voice, video and text communication for communities",
      category: "communication",
      rating: 4.4,
      logo: "/logos/discord.png",
      pricing: { monthly: 0 },
      features: ["Voice chat", "Communities", "Screen sharing", "Bots", "Gaming"],
      votes: 1876,
      strongPoints: ["Voice quality", "Community features", "Free tier"]
    },
    {
      id: "figma",
      name: "Figma",
      description: "Collaborative interface design tool",
      category: "design",
      rating: 4.8,
      logo: "/logos/figma.png",
      pricing: { monthly: 12 },
      features: ["Design", "Prototyping", "Collaboration", "Components", "Auto-layout"],
      votes: 1534,
      strongPoints: ["Real-time collaboration", "Web-based", "Component system"]
    }
  ];

  useEffect(() => {
    startNewBattle();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => {
          if (time <= 1) {
            setIsTimerActive(false);
            if (!userVote) {
              // Auto-vote randomly if no user vote
              const randomTool = Math.random() < 0.5 ? tool1 : tool2;
              handleVote(randomTool!.id);
            }
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timeLeft, userVote, tool1, tool2]);

  const startNewBattle = () => {
    // Select two random tools from different categories or similar tools for comparison
    const shuffled = [...sampleTools].sort(() => 0.5 - Math.random());
    const selectedTools = shuffled.slice(0, 2);
    
    setTool1(selectedTools[0]);
    setTool2(selectedTools[1]);
    setUserVote(null);
    setShowResult(false);
    setBattleResult(null);
    setTimeLeft(30);
    setIsTimerActive(true);
  };

  const handleVote = async (toolId: string) => {
    if (userVote || !tool1 || !tool2) return;

    setUserVote(toolId);
    setIsTimerActive(false);
    setIsLoading(true);

    try {
      // Simulate API call to record vote
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const winner = toolId === tool1.id ? tool1 : tool2;
      const loser = toolId === tool1.id ? tool2 : tool1;
      
      // Simulate battle result calculation
      const winPercentage = 45 + Math.random() * 20; // 45-65%
      const totalVotes = winner.votes + loser.votes + Math.floor(Math.random() * 100);
      
      const result: BattleResult = {
        winner,
        loser,
        winPercentage,
        totalVotes,
        reasons: generateWinReasons(winner, loser)
      };
      
      setBattleResult(result);
      setShowResult(true);
      
      // Call callbacks
      onVote?.(winner.id, loser.id);
      onBattleComplete?.(result);
      
      toast({
        title: "Vote Recorded!",
        description: `You voted for ${winner.name}. See the results!`,
      });

    } catch (error) {
      toast({
        title: "Vote Failed",
        description: "There was an error recording your vote. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateWinReasons = (winner: Tool, loser: Tool): string[] => {
    const reasons = [
      `Better ${winner.strongPoints[0]?.toLowerCase() || 'features'}`,
      `Higher user rating (${winner.rating} vs ${loser.rating})`,
      `More cost-effective pricing`,
      `Superior user experience`,
      `Better integration ecosystem`
    ];
    return reasons.slice(0, 3);
  };

  if (!tool1 || !tool2) {
    return <div className="flex justify-center p-8">Loading battle...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
          <Zap className="text-yellow-500" />
          Tool Battle Arena
          <Zap className="text-yellow-500" />
        </h2>
        <p className="text-muted-foreground mb-4">
          Choose your champion in this epic SaaS showdown!
        </p>
        
        {isTimerActive && (
          <div className="flex items-center justify-center gap-2 text-red-500">
            <Timer size={20} />
            <span className="font-bold">Time left: {timeLeft}s</span>
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Tool 1 */}
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <ToolBattleCard
            tool={tool1}
            isWinner={showResult && battleResult?.winner.id === tool1.id}
            isSelected={userVote === tool1.id}
            isDisabled={!!userVote || isLoading}
            onVote={() => handleVote(tool1.id)}
          />
        </motion.div>

        {/* VS Divider */}
        <div className="flex items-center justify-center">
          <motion.div
            animate={{ 
              scale: isTimerActive ? [1, 1.1, 1] : 1,
              rotate: isTimerActive ? [0, 5, -5, 0] : 0
            }}
            transition={{ 
              duration: 1, 
              repeat: isTimerActive ? Infinity : 0 
            }}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold shadow-lg"
          >
            VS
          </motion.div>
        </div>

        {/* Tool 2 */}
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <ToolBattleCard
            tool={tool2}
            isWinner={showResult && battleResult?.winner.id === tool2.id}
            isSelected={userVote === tool2.id}
            isDisabled={!!userVote || isLoading}
            onVote={() => handleVote(tool2.id)}
          />
        </motion.div>
      </div>

      {/* Battle Result */}
      <AnimatePresence>
        {showResult && battleResult && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                  <Award className="text-yellow-500" />
                  Battle Result
                  <Award className="text-yellow-500" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-green-600 mb-2">
                    🏆 {battleResult.winner.name} Wins!
                  </h3>
                  <div className="flex justify-center items-center gap-4">
                    <Progress 
                      value={battleResult.winPercentage} 
                      className="w-48 h-3"
                    />
                    <span className="font-bold">
                      {battleResult.winPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Based on {battleResult.totalVotes.toLocaleString()} total votes
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2 text-green-600">Why {battleResult.winner.name} Won:</h4>
                    <ul className="space-y-1">
                      {battleResult.reasons.map((reason, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <Star className="text-yellow-500" size={16} />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Community Stats:</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>{battleResult.winner.name} votes:</span>
                        <span className="font-bold text-green-600">
                          {Math.round(battleResult.totalVotes * battleResult.winPercentage / 100).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>{battleResult.loser.name} votes:</span>
                        <span className="font-bold text-red-500">
                          {Math.round(battleResult.totalVotes * (100 - battleResult.winPercentage) / 100).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <Button
          onClick={startNewBattle}
          disabled={isLoading}
          size="lg"
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          <TrendingUp className="mr-2" size={20} />
          New Battle
        </Button>
        
        {showResult && (
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              // Share result functionality
              toast({
                title: "Result Shared!",
                description: "Battle result copied to clipboard",
              });
            }}
          >
            <Users className="mr-2" size={20} />
            Share Result
          </Button>
        )}
      </div>
    </div>
  );
}

interface ToolBattleCardProps {
  tool: Tool;
  isWinner: boolean;
  isSelected: boolean;
  isDisabled: boolean;
  onVote: () => void;
}

function ToolBattleCard({ tool, isWinner, isSelected, isDisabled, onVote }: ToolBattleCardProps) {
  return (
    <motion.div
      whileHover={{ scale: isDisabled ? 1 : 1.02 }}
      whileTap={{ scale: isDisabled ? 1 : 0.98 }}
    >
      <Card 
        className={`h-full cursor-pointer transition-all duration-300 ${
          isWinner ? 'ring-4 ring-yellow-400 bg-yellow-50' :
          isSelected ? 'ring-2 ring-blue-400 bg-blue-50' :
          'hover:shadow-lg hover:ring-2 hover:ring-gray-200'
        } ${isDisabled ? 'opacity-75 cursor-not-allowed' : ''}`}
        onClick={!isDisabled ? onVote : undefined}
      >
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
            <span className="text-2xl font-bold text-gray-600">
              {tool.name.charAt(0)}
            </span>
          </div>
          <CardTitle className="text-xl">{tool.name}</CardTitle>
          <div className="flex items-center justify-center gap-1">
            <Star className="text-yellow-500 fill-current" size={16} />
            <span className="font-bold">{tool.rating}</span>
            <span className="text-sm text-muted-foreground">
              ({tool.votes.toLocaleString()} votes)
            </span>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground mb-4 text-center">
            {tool.description}
          </p>
          
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-sm mb-2">Key Features:</h4>
              <div className="flex flex-wrap gap-1">
                {tool.features.slice(0, 3).map((feature, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-sm mb-2">Strong Points:</h4>
              <ul className="space-y-1">
                {tool.strongPoints.slice(0, 2).map((point, index) => (
                  <li key={index} className="text-xs flex items-center gap-1">
                    <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="text-center pt-2">
              <div className="text-lg font-bold text-blue-600">
                ${tool.pricing.monthly}/month
              </div>
              {isWinner && (
                <Badge className="mt-2 bg-yellow-500 text-yellow-900">
                  👑 Winner!
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}