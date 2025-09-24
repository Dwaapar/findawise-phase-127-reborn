import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  Star, 
  Target, 
  Flame, 
  Award, 
  TrendingUp, 
  Calendar,
  Users,
  Book,
  Clock,
  Zap,
  Crown,
  Gift
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAnalytics } from '@/lib/AnalyticsClient';
import { useToast } from '@/hooks/use-toast';

interface UserStats {
  totalXp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  badges: Badge[];
  achievements: Achievement[];
  dailyGoal: number;
  weeklyGoal: number;
  todayProgress: number;
  weekProgress: number;
  leaderboardPosition?: number;
  friendsCount: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt: string;
  progress?: number;
  maxProgress?: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  xpReward: number;
  isCompleted: boolean;
  progress: number;
  maxProgress: number;
  completedAt?: string;
}

interface DailyQuest {
  id: number;
  title: string;
  description: string;
  category: string;
  xpReward: number;
  progress: number;
  maxProgress: number;
  isCompleted: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLeft: string;
}

interface LeaderboardEntry {
  position: number;
  username: string;
  avatar?: string;
  xp: number;
  level: number;
  streak: number;
  badge?: string;
}

interface GamificationSystemProps {
  sessionId: string;
  userId?: string;
  compact?: boolean;
}

export const GamificationSystem: React.FC<GamificationSystemProps> = ({
  sessionId,
  userId,
  compact = false
}) => {
  const [selectedTab, setSelectedTab] = useState('overview');
  const { toast } = useToast();
  const { trackEvent } = useAnalytics();
  const queryClient = useQueryClient();

  // Fetch user gamification data
  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/education/gamification', sessionId],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch daily quests
  const { data: dailyQuests, isLoading: questsLoading } = useQuery({
    queryKey: ['/api/education/daily-quests', sessionId],
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch leaderboard
  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery({
    queryKey: ['/api/education/leaderboard'],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  // Update goals mutation
  const updateGoalsMutation = useMutation({
    mutationFn: async (goals: { daily?: number; weekly?: number }) => {
      return apiRequest('/api/education/gamification/goals', {
        method: 'PATCH',
        body: { sessionId, ...goals }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/education/gamification'] });
      toast({ title: "Goals updated!", description: "Your learning goals have been saved." });
    }
  });

  // Claim achievement mutation
  const claimAchievementMutation = useMutation({
    mutationFn: async (achievementId: string) => {
      return apiRequest('/api/education/gamification/claim-achievement', {
        method: 'POST',
        body: { sessionId, achievementId }
      });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['/api/education/gamification'] });
      toast({
        title: "Achievement Unlocked!",
        description: `You earned ${response.data.xpReward} XP!`,
      });
      
      trackEvent({
        eventType: 'achievement_claimed',
        eventData: {
          achievementId: response.data.id,
          xpEarned: response.data.xpReward,
        }
      });
    }
  });

  const calculateLevelProgress = (xp: number, level: number): number => {
    const baseXp = level * 1000;
    const nextLevelXp = (level + 1) * 1000;
    const currentLevelXp = xp - baseXp;
    const xpNeededForNextLevel = nextLevelXp - baseXp;
    return Math.min((currentLevelXp / xpNeededForNextLevel) * 100, 100);
  };

  const getRarityColor = (rarity: string): string => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 border-gray-300';
      case 'rare': return 'bg-blue-100 border-blue-300';
      case 'epic': return 'bg-purple-100 border-purple-300';
      case 'legendary': return 'bg-yellow-100 border-yellow-300';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (statsLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats: UserStats = userStats?.data || {
    totalXp: 0,
    level: 1,
    currentStreak: 0,
    longestStreak: 0,
    badges: [],
    achievements: [],
    dailyGoal: 30,
    weeklyGoal: 300,
    todayProgress: 0,
    weekProgress: 0,
    friendsCount: 0,
  };

  const levelProgress = calculateLevelProgress(stats.totalXp, stats.level);

  if (compact) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Crown className="w-4 h-4 text-yellow-600" />
                <span className="font-semibold">Level {stats.level}</span>
              </div>
              <Badge variant="secondary">{stats.totalXp.toLocaleString()} XP</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium">{stats.currentStreak} day streak</span>
            </div>
          </div>
          
          <Progress value={levelProgress} className="mb-2" />
          <div className="text-xs text-gray-600 text-center">
            {Math.round((100 - levelProgress) / 100 * ((stats.level + 1) * 1000 - stats.level * 1000))} XP to next level
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Crown className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-yellow-600">{stats.level}</div>
            <div className="text-sm text-gray-600">Level</div>
            <Progress value={levelProgress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Star className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">{stats.totalXp.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total XP</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Flame className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-orange-500">{stats.currentStreak}</div>
            <div className="text-sm text-gray-600">Day Streak</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-600">{stats.badges.length}</div>
            <div className="text-sm text-gray-600">Badges</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="quests">Daily Quests</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Progress Goals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Learning Goals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Daily Goal</span>
                  <span className="text-sm text-gray-600">{stats.todayProgress}/{stats.dailyGoal} minutes</span>
                </div>
                <Progress value={(stats.todayProgress / stats.dailyGoal) * 100} />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Weekly Goal</span>
                  <span className="text-sm text-gray-600">{stats.weekProgress}/{stats.weeklyGoal} minutes</span>
                </div>
                <Progress value={(stats.weekProgress / stats.weeklyGoal) * 100} />
              </div>
            </CardContent>
          </Card>

          {/* Recent Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Recent Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.achievements.filter(a => a.isCompleted).slice(0, 3).map((achievement) => (
                  <div key={achievement.id} className="flex items-center gap-3 p-2 bg-green-50 dark:bg-green-950 rounded-lg">
                    <Trophy className="w-6 h-6 text-green-600" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{achievement.title}</div>
                      <div className="text-xs text-gray-600">{achievement.description}</div>
                    </div>
                    <Badge variant="secondary">+{achievement.xpReward} XP</Badge>
                  </div>
                ))}
                
                {stats.achievements.filter(a => a.isCompleted).length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <Trophy className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No achievements yet. Start learning to unlock them!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Today's Quests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {questsLoading ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {(dailyQuests?.data || []).map((quest: DailyQuest) => (
                    <div key={quest.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{quest.title}</h4>
                            <Badge className={getDifficultyColor(quest.difficulty)}>
                              {quest.difficulty}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{quest.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              {quest.xpReward} XP
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {quest.timeLeft}
                            </span>
                          </div>
                        </div>
                        {quest.isCompleted && (
                          <Badge variant="default" className="bg-green-600">
                            <Trophy className="w-3 h-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{quest.progress}/{quest.maxProgress}</span>
                        </div>
                        <Progress value={(quest.progress / quest.maxProgress) * 100} />
                      </div>
                    </div>
                  ))}
                  
                  {(!dailyQuests?.data || dailyQuests.data.length === 0) && (
                    <div className="text-center text-gray-500 py-8">
                      <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No quests available today. Check back tomorrow!</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.achievements.map((achievement) => (
              <Card key={achievement.id} className={achievement.isCompleted ? 'border-green-200 bg-green-50 dark:bg-green-950' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      achievement.isCompleted ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <Trophy className="w-6 h-6" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{achievement.title}</h4>
                          <p className="text-sm text-gray-600">{achievement.description}</p>
                        </div>
                        {achievement.isCompleted ? (
                          <Badge variant="default" className="bg-green-600">
                            <Trophy className="w-3 h-3 mr-1" />
                            Unlocked
                          </Badge>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={achievement.progress < achievement.maxProgress}
                            onClick={() => claimAchievementMutation.mutate(achievement.id)}
                          >
                            <Gift className="w-3 h-3 mr-1" />
                            Claim
                          </Button>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{achievement.progress}/{achievement.maxProgress}</span>
                        </div>
                        <Progress value={(achievement.progress / achievement.maxProgress) * 100} />
                      </div>
                      
                      {achievement.isCompleted && achievement.completedAt && (
                        <div className="text-xs text-gray-500 mt-2">
                          Completed {new Date(achievement.completedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="badges" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {stats.badges.map((badge) => (
              <Card key={badge.id} className={`text-center ${getRarityColor(badge.rarity)}`}>
                <CardContent className="p-4">
                  <div className="w-16 h-16 mx-auto mb-2 rounded-lg bg-white flex items-center justify-center">
                    <Award className="w-8 h-8 text-gray-600" />
                  </div>
                  <h4 className="font-medium text-sm mb-1">{badge.name}</h4>
                  <p className="text-xs text-gray-600 mb-2">{badge.description}</p>
                  <Badge variant="secondary" className="text-xs">
                    {badge.rarity}
                  </Badge>
                  {badge.unlockedAt && (
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(badge.unlockedAt).toLocaleDateString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            
            {stats.badges.length === 0 && (
              <div className="col-span-full text-center text-gray-500 py-8">
                <Award className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No badges earned yet. Complete achievements to unlock badges!</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Global Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              {leaderboardLoading ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-12 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {(leaderboard?.data || []).map((entry: LeaderboardEntry, index) => (
                    <div key={entry.position} className={`flex items-center gap-3 p-3 rounded-lg ${
                      entry.position <= 3 ? 'bg-yellow-50 dark:bg-yellow-950' : 'bg-gray-50 dark:bg-gray-900'
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        entry.position === 1 ? 'bg-yellow-500 text-white' :
                        entry.position === 2 ? 'bg-gray-400 text-white' :
                        entry.position === 3 ? 'bg-amber-600 text-white' :
                        'bg-gray-200 text-gray-600'
                      }`}>
                        {entry.position <= 3 ? (
                          <Crown className="w-4 h-4" />
                        ) : (
                          entry.position
                        )}
                      </div>
                      
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={entry.avatar} />
                        <AvatarFallback>{entry.username.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="font-medium">{entry.username}</div>
                        <div className="text-sm text-gray-600">Level {entry.level}</div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-medium">{entry.xp.toLocaleString()} XP</div>
                        <div className="text-sm text-gray-600 flex items-center gap-1">
                          <Flame className="w-3 h-3" />
                          {entry.streak}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};