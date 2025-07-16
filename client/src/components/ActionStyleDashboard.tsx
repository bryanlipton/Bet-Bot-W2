import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
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
  RefreshCw,
  BookOpen,
  Newspaper
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

import { GameDetailsModal } from "./GameDetailsModal";
import { ArticleModal } from "./ArticleModal";
import DailyPick from "./DailyPick";

export function ActionStyleDashboard() {
  const [selectedSport, setSelectedSport] = useState("baseball_mlb");
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  
  // Fetch complete schedule from MLB API + Odds API
  const { data: liveOddsData, isLoading: oddsLoading, refetch: refetchOdds } = useQuery({
    queryKey: selectedSport === 'baseball_mlb' ? ['/api/mlb/complete-schedule'] : ['/api/odds/events', selectedSport],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch recommendations
  const { data: recommendations = [] } = useQuery({
    queryKey: ['/api/recommendations', selectedSport],
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch AI-generated articles
  const { data: articles = [] } = useQuery({
    queryKey: ['/api/articles'],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  // Process live odds data into game format
  const processLiveGames = (oddsData: LiveOddsGame[]): ProcessedGame[] => {
    if (!oddsData) return [];
    
    console.log(`Processing ${oddsData.length} games from API`);
    
    // Filter out games that have already started
    const now = new Date();
    const upcomingGames = oddsData.filter(game => {
      const gameTime = new Date(game.commence_time);
      return gameTime > now; // Only show games that haven't started yet
    });
    
    // Sort games by commence time (chronological order)
    const sortedGames = [...upcomingGames].sort((a, b) => 
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

      // Extract bookmaker lines (first 3 books) - prioritize major sportsbooks
      const priorityBooks = ['FanDuel', 'DraftKings', 'BetMGM', 'Caesars', 'PointsBet'];
      const sortedBookmakers = game.bookmakers?.sort((a, b) => {
        const aIndex = priorityBooks.indexOf(a.title);
        const bIndex = priorityBooks.indexOf(b.title);
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });
      
      const bookmakers = sortedBookmakers?.slice(0, 3).map(book => {
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
        homeOdds: homeOutcome?.price || null,
        awayOdds: awayOutcome?.price || null,
        spread: spreadOutcome?.point || null,
        total: totalOutcome?.point || null,
        startTime: new Date(game.commence_time).toLocaleString('en-US', { 
          month: 'short',
          day: 'numeric',
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        }),
        sportKey: game.sport_key,
        bookmakers,
        gameId: game.gameId || game.id,
        probablePitchers: game.probablePitchers,
        venue: game.venue
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
      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Live Sports Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Professional Sports Analytics Platform
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/my-picks">
            <Button variant="outline" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              My Picks
            </Button>
          </Link>
          <Link href="/articles">
            <Button variant="outline" className="flex items-center gap-2">
              <Newspaper className="w-4 h-4" />
              Articles
            </Button>
          </Link>
          <Badge className="bg-green-600 text-white px-4 py-2 text-sm">
            Live Data Feed
          </Badge>
        </div>
      </div>

      {/* Pick of the Day Section - Always visible above sports */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Pick of the Day
          </h2>
          <Badge variant="outline" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-none">
            Free Users
          </Badge>
        </div>
        <DailyPick />
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

      {/* Featured Games */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Live Games - {sports.find(s => s.key === selectedSport)?.name}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Showing {featuredGames.length} upcoming games
              {featuredGames.length < 10 && (
                <span className="ml-1">
                  • Some games may not have betting lines posted yet • Started games automatically removed
                </span>
              )}
            </p>
          </div>
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
              Showing {featuredGames.length} upcoming games in chronological order • Started games automatically removed
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
                  gameId={game.gameId}
                  probablePitchers={game.probablePitchers}
                  onClick={() => {
                    setSelectedGame(game);
                    setIsModalOpen(true);
                  }}
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

      {/* Game Details Modal */}
      {selectedGame && (
        <GameDetailsModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedGame(null);
          }}
          gameId={selectedGame.gameId}
          homeTeam={selectedGame.homeTeam}
          awayTeam={selectedGame.awayTeam}
          startTime={selectedGame.startTime}
          venue={selectedGame.venue}
          probablePitchers={selectedGame.probablePitchers}
        />
      )}

      {/* Latest Analysis Section with AI-Generated Articles */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Latest Analysis</h2>
          <Badge variant="outline" className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Auto-Updated
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {articles.slice(0, 4).map((article, index) => {
            const getTypeColor = (type: string) => {
              switch (type) {
                case 'game-preview': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
                case 'daily-roundup': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
                case 'strategy-guide': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
                case 'picks-analysis': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
                default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
              }
            };

            const formatTimeAgo = (dateString: string) => {
              const now = new Date();
              const publishTime = new Date(dateString);
              const diffInHours = Math.floor((now.getTime() - publishTime.getTime()) / (1000 * 60 * 60));
              
              if (diffInHours < 1) return 'Just now';
              if (diffInHours === 1) return '1 hour ago';
              if (diffInHours < 24) return `${diffInHours} hours ago`;
              
              const diffInDays = Math.floor(diffInHours / 24);
              if (diffInDays === 1) return '1 day ago';
              return `${diffInDays} days ago`;
            };

            return (
              <Card 
                key={article.id} 
                className="hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1"
                onClick={() => {
                  setSelectedArticle(article);
                  setIsModalOpen(true);
                }}
              >
                <CardContent className="p-0">
                  <div className="relative h-48 overflow-hidden rounded-t-lg">
                    <img 
                      src={article.thumbnail} 
                      alt={article.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement.style.background = 
                          index % 2 === 0 
                            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                            : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    {article.featured && (
                      <Badge className="absolute top-3 right-3 bg-yellow-500 text-black">
                        <Star className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <Badge className={`mb-2 ${getTypeColor(article.articleType)}`}>
                      {article.articleType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                    
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {article.title}
                    </h3>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {article.summary}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>by Bet Bot • {formatTimeAgo(article.publishedAt)}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {article.readTime} min read
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          
          {articles.length === 0 && (
            <>
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg flex items-center justify-center">
                    <div className="text-white text-center">
                      <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-80" />
                      <p className="text-sm opacity-90">Loading AI Analysis...</p>
                    </div>
                  </div>
                  <div className="p-4">
                    <Badge variant="secondary" className="mb-2">AI Generated</Badge>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                      Generating Daily Sports Analysis
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      AI-powered articles are being generated with the latest odds and insights.
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>by Bet Bot • Generating...</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Loading...
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Article Modal */}
      <ArticleModal
        article={selectedArticle}
        open={!!selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />
    </div>
  );
}