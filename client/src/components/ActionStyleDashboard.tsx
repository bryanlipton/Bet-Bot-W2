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
  Zap,
  RefreshCw
} from "lucide-react";

interface LiveOddsGame {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Array<{
    key: string;
    title: string;
    markets: Array<{
      key: string;
      outcomes: Array<{
        name: string;
        price: number;
        point?: number;
      }>;
    }>;
  }>;
}

interface ProcessedGame {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeOdds?: number;
  awayOdds?: number;
  spread?: number;
  total?: number;
  startTime?: string;
  sportKey: string;
  bookmakers?: Array<{
    name: string;
    homeOdds?: number;
    awayOdds?: number;
    spread?: number;
    total?: number;
  }>;
}

export function ActionStyleDashboard() {
  const [selectedSport, setSelectedSport] = useState("baseball_mlb");
  
  // Fetch live odds from The Odds API
  const { data: liveOddsData, isLoading: oddsLoading, refetch: refetchOdds } = useQuery({
    queryKey: ['/api/odds/live', selectedSport],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch recommendations
  const { data: recommendations = [] } = useQuery({
    queryKey: ['/api/recommendations', selectedSport],
    refetchInterval: 60000, // Refresh every minute
  });

  // Process live odds data into game format
  const processLiveGames = (oddsData: LiveOddsGame[]): ProcessedGame[] => {
    if (!oddsData) return [];
    
    console.log(`Processing ${oddsData.length} games from API`);
    
    // Sort games by commence time (chronological order)
    const sortedGames = [...oddsData].sort((a, b) => 
      new Date(a.commence_time).getTime() - new Date(b.commence_time).getTime()
    );
    
    const processedGames = sortedGames.map((game, index) => {
      console.log(`Processing game ${index + 1}: ${game.away_team} @ ${game.home_team} - Bookmakers: ${game.bookmakers?.length || 0}`);
      const h2hMarket = game.bookmakers?.[0]?.markets?.find(m => m.key === 'h2h');
      const spreadsMarket = game.bookmakers?.[0]?.markets?.find(m => m.key === 'spreads');
      const totalsMarket = game.bookmakers?.[0]?.markets?.find(m => m.key === 'totals');
      
      const homeOutcome = h2hMarket?.outcomes?.find(o => o.name === game.home_team);
      const awayOutcome = h2hMarket?.outcomes?.find(o => o.name === game.away_team);
      const spreadOutcome = spreadsMarket?.outcomes?.find(o => o.name === game.home_team);
      const totalOutcome = totalsMarket?.outcomes?.find(o => o.name === 'Over');

      // Extract bookmaker lines (first 3 books)
      const bookmakers = game.bookmakers?.slice(0, 3).map(book => {
        const bookH2h = book.markets?.find(m => m.key === 'h2h');
        const bookSpreads = book.markets?.find(m => m.key === 'spreads');
        const bookTotals = book.markets?.find(m => m.key === 'totals');
        
        const bookHomeOdds = bookH2h?.outcomes?.find(o => o.name === game.home_team)?.price;
        const bookAwayOdds = bookH2h?.outcomes?.find(o => o.name === game.away_team)?.price;
        const bookSpread = bookSpreads?.outcomes?.find(o => o.name === game.home_team)?.point;
        const bookTotal = bookTotals?.outcomes?.find(o => o.name === 'Over')?.point;

        return {
          name: book.title,
          homeOdds: bookHomeOdds,
          awayOdds: bookAwayOdds,
          spread: bookSpread,
          total: bookTotal
        };
      });

      return {
        id: game.id,
        homeTeam: game.home_team,
        awayTeam: game.away_team,
        homeOdds: homeOutcome?.price,
        awayOdds: awayOutcome?.price,
        spread: spreadOutcome?.point,
        total: totalOutcome?.point,
        startTime: new Date(game.commence_time).toLocaleString('en-US', { 
          month: 'short',
          day: 'numeric',
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        }),
        sportKey: game.sport_key,
        bookmakers
      };
    });
    
    console.log(`Processed ${processedGames.length} games successfully`);
    return processedGames;
  };

  const featuredGames = processLiveGames(liveOddsData || []);

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
    { key: "baseball_mlb", name: "MLB", active: selectedSport === "baseball_mlb" },
    { key: "americanfootball_nfl", name: "NFL", active: selectedSport === "americanfootball_nfl" },
    { key: "basketball_nba", name: "NBA", active: selectedSport === "basketball_nba" },
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
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Live Games - {sports.find(s => s.key === selectedSport)?.name}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchOdds()}
              disabled={oddsLoading}
              className="flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${oddsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Badge variant="outline" className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              Live Odds
            </Badge>
          </div>
        </div>

        {oddsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : featuredGames.length > 0 ? (
          <div className="space-y-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Showing {featuredGames.length} games in chronological order
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
                  bookmakers={game.bookmakers}
                />
              ))}
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Live Games
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                No games are currently available for {sports.find(s => s.key === selectedSport)?.name}. 
                Check back later or try a different sport.
              </p>
            </CardContent>
          </Card>
        )}
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