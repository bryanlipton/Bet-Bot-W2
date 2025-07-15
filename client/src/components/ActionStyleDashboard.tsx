import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActionStyleGameCard } from "./ActionStyleGameCard";
import { 
  TrendingUp, 
  DollarSign, 
  Target, 
  BarChart3,
  Users,
  Clock,
  Star,
  Zap
} from "lucide-react";

interface Game {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeOdds?: number;
  awayOdds?: number;
  spread?: number;
  total?: number;
  startTime?: string;
  sportKey: string;
}

export function ActionStyleDashboard() {
  const [selectedSport, setSelectedSport] = useState("baseball_mlb");
  
  // Fetch live games
  const { data: liveGames = [] } = useQuery({
    queryKey: ['/api/games/live'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch recommendations
  const { data: recommendations = [] } = useQuery({
    queryKey: ['/api/recommendations', selectedSport],
    refetchInterval: 60000, // Refresh every minute
  });

  // Mock prediction function (replace with actual API call)
  const getPrediction = (homeTeam: string, awayTeam: string) => {
    // Simplified team strengths for demo
    const teamStrengths: Record<string, number> = {
      'Yankees': 0.72, 'Dodgers': 0.70, 'Astros': 0.68, 'Braves': 0.67,
      'Phillies': 0.65, 'Padres': 0.64, 'Mets': 0.62, 'Orioles': 0.61,
      'Guardians': 0.60, 'Brewers': 0.59, 'Red Sox': 0.58, 'Cardinals': 0.57
    };

    const homeStrength = teamStrengths[homeTeam] || 0.50;
    const awayStrength = teamStrengths[awayTeam] || 0.50;
    const homeFieldBonus = 0.035;
    
    let homeWinProb = (homeStrength / (homeStrength + awayStrength)) + homeFieldBonus;
    homeWinProb = Math.max(0.25, Math.min(0.75, homeWinProb));
    const awayWinProb = 1 - homeWinProb;
    
    const confidence = Math.abs(homeWinProb - 0.5) * 1.5 + 0.6;
    const winnerProb = Math.max(homeWinProb, awayWinProb);
    const edge = winnerProb > 0.52 ? ((winnerProb - 0.52) * 100).toFixed(1) + '%' : 'No edge';

    return {
      homeWinProbability: homeWinProb,
      awayWinProbability: awayWinProb,
      confidence: Math.min(0.85, confidence),
      edge
    };
  };

  // Sports tabs
  const sports = [
    { key: "baseball_mlb", name: "MLB", active: true },
    { key: "americanfootball_nfl", name: "NFL", active: false },
    { key: "basketball_nba", name: "NBA", active: false },
  ];

  // Mock featured games for demo
  const featuredGames = [
    {
      id: "1",
      homeTeam: "Dodgers",
      awayTeam: "Yankees", 
      homeOdds: -140,
      awayOdds: +120,
      spread: -1.5,
      total: 8.5,
      startTime: "7:10 PM ET",
      sportKey: "baseball_mlb"
    },
    {
      id: "2", 
      homeTeam: "Astros",
      awayTeam: "Red Sox",
      homeOdds: -180,
      awayOdds: +155,
      spread: -2.5,
      total: 9.0,
      startTime: "8:15 PM ET",
      sportKey: "baseball_mlb"
    },
    {
      id: "3",
      homeTeam: "Braves", 
      awayTeam: "Phillies",
      homeOdds: +105,
      awayOdds: -125,
      spread: +1.5,
      total: 8.0,
      startTime: "7:45 PM ET", 
      sportKey: "baseball_mlb"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Today's Best Bets</h1>
            <p className="text-blue-100">AI-powered predictions with real-time odds analysis</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">87%</div>
            <div className="text-sm text-blue-100">Win Rate</div>
          </div>
        </div>
      </div>

      {/* Sports Navigation */}
      <div className="flex items-center gap-4 border-b border-gray-200 dark:border-gray-700">
        {sports.map((sport) => (
          <button
            key={sport.key}
            onClick={() => setSelectedSport(sport.key)}
            className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors ${
              selectedSport === sport.key
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            {sport.name}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">+$2,847</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">73%</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Hit Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">24</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Active Bets</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Zap className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">8</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">High Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Featured Games */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Featured Games</h2>
          <Badge variant="outline" className="flex items-center gap-1">
            <Star className="w-3 h-3" />
            Top Picks
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {featuredGames.map((game) => (
            <ActionStyleGameCard
              key={game.id}
              homeTeam={game.homeTeam}
              awayTeam={game.awayTeam}
              homeOdds={game.homeOdds}
              awayOdds={game.awayOdds}
              spread={game.spread}
              total={game.total}
              startTime={game.startTime}
              prediction={getPrediction(game.homeTeam, game.awayTeam)}
            />
          ))}
        </div>
      </div>

      {/* Recent Articles Section (Action Network Style) */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Latest Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg"></div>
              <div className="p-4">
                <Badge variant="secondary" className="mb-2">MLB</Badge>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                  All-Star Game Best Bets: 3 Picks for Midsummer Classic
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Our experts break down the top betting opportunities for tonight's All-Star Game.
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Bet Bot AI • 2 hours ago</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    3 min read
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <div className="h-48 bg-gradient-to-r from-green-500 to-blue-600 rounded-t-lg"></div>
              <div className="p-4">
                <Badge variant="secondary" className="mb-2">Analysis</Badge>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                  MLB Second Half Trends: Teams to Watch
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Key statistical insights and betting opportunities for the MLB second half.
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Bet Bot Analytics • 4 hours ago</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    5 min read
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}