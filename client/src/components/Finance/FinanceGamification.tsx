import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, Target, Flame, Award, TrendingUp, Calendar, CheckCircle, Clock, Users, Zap } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';

interface FinanceGamificationProps {
  sessionId: string;
}

export default function FinanceGamification({ sessionId }: FinanceGamificationProps) {
  const [gameData, setGameData] = useState<any>(null);
  const [activeQuests, setActiveQuests] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    fetchGamificationData();
  }, [sessionId]);

  const fetchGamificationData = async () => {
    try {
      setLoading(true);
      
      // Fetch user game data
      const gameResponse = await fetch(`/api/finance/gamification/${sessionId}`);
      if (gameResponse.ok) {
        const gameResult = await gameResponse.json();
        setGameData(gameResult.data);
      }

      // Fetch active quests
      const questsResponse = await fetch(`/api/finance/quests/active/${sessionId}`);
      if (questsResponse.ok) {
        const questsResult = await questsResponse.json();
        setActiveQuests(questsResult.data || []);
      }

      // Fetch leaderboard
      const leaderboardResponse = await fetch('/api/finance/leaderboard');
      if (leaderboardResponse.ok) {
        const leaderboardResult = await leaderboardResponse.json();
        setLeaderboard(leaderboardResult.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch gamification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeQuest = async (questId: string) => {
    try {
      const response = await fetch('/api/finance/quests/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, questId })
      });

      if (response.ok) {
        const result = await response.json();
        trackEvent({
          eventType: 'quest_completed',
          eventData: { questId, xpGained: result.data.xpGained }
        });
        fetchGamificationData(); // Refresh data
      }
    } catch (error) {
      console.error('Failed to complete quest:', error);
    }
  };

  const getUserRank = () => {
    if (!gameData || !leaderboard) return null;
    const userRank = leaderboard.findIndex(user => user.sessionId === sessionId) + 1;
    return userRank > 0 ? userRank : null;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Stats Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <CardContent className="p-6 text-center">
            <Trophy className="w-8 h-8 mx-auto mb-2" />
            <div className="text-2xl font-bold">{gameData?.currentLevel || 1}</div>
            <div className="text-sm opacity-90">Level</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
          <CardContent className="p-6 text-center">
            <Star className="w-8 h-8 mx-auto mb-2" />
            <div className="text-2xl font-bold">{gameData?.totalXP || 0}</div>
            <div className="text-sm opacity-90">Total XP</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
          <CardContent className="p-6 text-center">
            <Flame className="w-8 h-8 mx-auto mb-2" />
            <div className="text-2xl font-bold">{gameData?.streakDays || 0}</div>
            <div className="text-sm opacity-90">Day Streak</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
          <CardContent className="p-6 text-center">
            <Target className="w-8 h-8 mx-auto mb-2" />
            <div className="text-2xl font-bold">{getUserRank() || 'Unranked'}</div>
            <div className="text-sm opacity-90">Global Rank</div>
          </CardContent>
        </Card>
      </div>

      {/* Level Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Level Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Level {gameData?.currentLevel || 1}</span>
              <span>Level {(gameData?.currentLevel || 1) + 1}</span>
            </div>
            <Progress 
              value={((gameData?.totalXP || 0) % 1000) / 10} 
              className="h-3"
            />
            <div className="text-center text-sm text-gray-600">
              {1000 - ((gameData?.totalXP || 0) % 1000)} XP until next level
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Active Money Quests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-600" />
              Money Quest Challenges
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeQuests.length > 0 ? activeQuests.map((quest) => (
              <div key={quest.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{quest.title}</h4>
                    <p className="text-sm text-gray-600">{quest.description}</p>
                  </div>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    {quest.xpReward} XP
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    {quest.timeLeft}
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => completeQuest(quest.id)}
                    disabled={!quest.canComplete}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {quest.canComplete ? 'Complete' : 'In Progress'}
                  </Button>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-500">
                <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No active quests. Check back daily for new challenges!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Achievements & Badges */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-600" />
              Achievements Unlocked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {gameData?.achievements?.map((achievement: any) => (
                <div key={achievement.id} className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 mx-auto mb-2 flex items-center justify-center">
                    <Award className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-xs font-medium">{achievement.name}</div>
                </div>
              )) || (
                <div className="col-span-3 text-center py-8 text-gray-500">
                  <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Complete quests to earn achievements!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Global Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            Money Mastery Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leaderboard.slice(0, 10).map((user, index) => (
              <div 
                key={user.sessionId} 
                className={`flex items-center justify-between p-3 rounded-lg ${
                  user.sessionId === sessionId ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    index < 3 ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' : 'bg-gray-200'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">
                      {user.sessionId === sessionId ? 'You' : `User ${user.sessionId.slice(-4)}`}
                    </div>
                    <div className="text-sm text-gray-600">Level {user.currentLevel}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{user.totalXP} XP</div>
                  <div className="text-sm text-gray-600">{user.streakDays} day streak</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Money Quest Funnel */}
      <Card className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white">
        <CardContent className="p-6 text-center">
          <Zap className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">Level Up Your Wallet!</h3>
          <p className="mb-4 opacity-90">
            Join the ultimate financial transformation challenge. Build better money habits, earn rewards, and achieve financial freedom!
          </p>
          <Button variant="secondary" size="lg" className="bg-white text-emerald-600 hover:bg-gray-100">
            Start Your Money Quest
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}