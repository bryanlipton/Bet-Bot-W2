import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActionStyleGameCard } from "./ActionStyleGameCard";
import { getTeamColor } from "@/utils/teamLogos";
import MobileHeader from "@/components/MobileHeader";
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
  rawBookmakers?: Array<{
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
    last_update: string;
  }>;
}



import DailyPick from "./DailyPick";
import LoggedInLockPick from "./LoggedInLockPick";
import { ProGameCard } from "./ProGameCard";
import { useAuth } from "@/hooks/useAuth";
import { useProStatus } from "@/hooks/useProStatus";

export function ActionStyleDashboard() {
  const [selectedSport, setSelectedSport] = useState("baseball_mlb");

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isProUser, isLoading: proLoading } = useProStatus();
  
  // Fetch complete schedule from MLB API + Odds API
  const { data: liveOddsData, isLoading: oddsLoading, refetch: refetchOdds } = useQuery({
    queryKey: selectedSport === 'baseball_mlb' ? ['/api/mlb/complete-schedule'] : ['/api/odds/events', selectedSport],
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
    refetchInterval: false, // Disable automatic refetching
  });

  // Fetch recommendations
  const { data: recommendations = [] } = useQuery({
    queryKey: ['/api/recommendations', selectedSport],
    staleTime: 10 * 60 * 1000, // Consider data fresh for 10 minutes
    gcTime: 20 * 60 * 1000, // Keep in cache for 20 minutes
    refetchOnWindowFocus: false,
    refetchInterval: false, // Disable automatic refetching
  });



  // Fetch daily pick data
  const { data: dailyPick } = useQuery({
    queryKey: ['/api/daily-pick'],
    staleTime: 15 * 60 * 1000, // Consider data fresh for 15 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnWindowFocus: false,
    refetchInterval: false, // Disable automatic refetching
  });

  // Fetch lock pick data
  const { data: lockPick } = useQuery({
    queryKey: ['/api/daily-pick/lock'],
    staleTime: 15 * 60 * 1000, // Consider data fresh for 15 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnWindowFocus: false,
    refetchInterval: false, // Disable automatic refetching
  });

  // Fetch user auth status
  const { data: user } = useQuery({
    queryKey: ['/api/auth/user'],
    staleTime: 10 * 60 * 1000, // Consider data fresh for 10 minutes
    gcTime: 20 * 60 * 1000, // Keep in cache for 20 minutes
    refetchOnWindowFocus: false,
    refetchInterval: false, // Disable automatic refetching
  });

  // Helper function to check if a game matches the daily pick
  const isGameDailyPick = (game: any) => {
    if (!dailyPick) return false;
    return game.homeTeam === dailyPick.homeTeam && game.awayTeam === dailyPick.awayTeam;
  };

  // Helper function to check if a game matches the lock pick
  const isGameLockPick = (game: any) => {
    if (!lockPick) return false;
    return game.homeTeam === lockPick.homeTeam && game.awayTeam === lockPick.awayTeam;
  };

  // Process live odds data into game format  
  const processLiveGames = (oddsData: LiveOddsGame[]): ProcessedGame[] => {
    if (!oddsData) return [];
    
    // Only log every 5th processing to reduce console noise
    const shouldLog = Math.floor(Date.now() / 30000) % 5 === 0; // Log every 2.5 minutes
    if (shouldLog) {
      console.log(`Processing ${oddsData.length} games from API`);
    }
    
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
      if (shouldLog) {
        console.log(`Processing game ${index + 1}: ${game.away_team} @ ${game.home_team} - Bookmakers: ${game.bookmakers?.length || 0}`);
      }
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
        startTime: (() => {
          try {
            if (!game.commence_time) {
              console.log(`⚠️ Missing commence_time for ${game.away_team} @ ${game.home_team}`);
              return "TBD";
            }
            const date = new Date(game.commence_time);
            if (isNaN(date.getTime())) {
              console.log(`⚠️ Invalid commence_time "${game.commence_time}" for ${game.away_team} @ ${game.home_team}`);
              return "TBD";
            }
            return date.toLocaleString('en-US', { 
              month: 'short',
              day: 'numeric',
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            });
          } catch (error) {
            console.log(`⚠️ Error processing commence_time "${game.commence_time}" for ${game.away_team} @ ${game.home_team}:`, error);
            return "TBD";
          }
        })(),
        sportKey: game.sport_key,
        bookmakers,
        rawBookmakers: game.bookmakers, // Include raw bookmakers data for odds comparison
        gameId: game.gameId || game.id,
        probablePitchers: game.probablePitchers,
        venue: game.venue
      };
    });
    
    if (shouldLog) {
      console.log(`Processed ${processedGames.length} games successfully`);
    }
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
    <>
      <MobileHeader />
      {/* Mobile-first container with proper mobile navigation padding */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 space-y-4 md:space-y-6 pb-20 sm:pb-6">

      {/* Bet Bot Sports Genie AI Picks - Prominently positioned at top for logged in users */}
      {isAuthenticated && (
        <div className="space-y-3 mb-4 sm:mb-6 mt-2 sm:mt-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 md:gap-3">
            <div className="flex-1">
              <h2 className="text-base sm:text-lg md:text-lg lg:text-xl font-bold text-gray-900 dark:text-white underline">
                Bet Bot Sports Genie AI Picks
              </h2>
            </div>
            <Badge variant="outline" className={`${isProUser ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'} text-white border-none self-start sm:self-auto text-xs md:text-xs lg:text-sm`}>
              {isProUser ? 'Pro Users' : 'Free Users'}
            </Badge>
          </div>
          {/* Mobile-optimized responsive layout - tighter spacing for mobile prominence */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 sm:gap-3 md:gap-4 xl:gap-6">
            <DailyPick key="daily-pick-component" />
            <LoggedInLockPick key="lock-pick-component" />
          </div>
        </div>
      )}

      {/* Pick of the Day Section - For logged out users */}
      {!isAuthenticated && (
        <div className="space-y-4">
          {/* Bet Bot Sports Genie AI Picks - Always at top, no tired of guessing section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-3">
            <div className="flex-1">
              <h2 className="text-lg sm:text-xl md:text-lg lg:text-xl font-bold text-gray-900 dark:text-white underline">
                Bet Bot Sports Genie AI Picks
              </h2>
            </div>
            <Badge variant="outline" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-none self-start sm:self-auto text-xs md:text-xs lg:text-sm">
              Free Users
            </Badge>
          </div>
        {/* Mobile-first responsive layout for picks - stack vertically until xl, side-by-side at xl+ */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4 md:gap-4 xl:gap-6">
          <DailyPick key="daily-pick-component" />
          <LoggedInLockPick key="lock-pick-component" />
        </div>
        </div>
      )}

      {/* Sports Navigation */}
      <div className="flex items-center gap-2 sm:gap-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {sports.map((sport) => (
          <button
            key={sport.key}
            onClick={() => setSelectedSport(sport.key)}
            className={`py-3 px-2 sm:px-4 font-medium text-xs sm:text-sm border-b-2 transition-colors whitespace-nowrap ${
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
        {/* Mobile-optimized games header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3 sm:mb-4">
          <div className="flex-1">
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white">
              {selectedSport === 'baseball_mlb' ? 'MLB Game Odds' : 
               selectedSport === 'americanfootball_nfl' ? 'NFL Game Odds' :
               selectedSport === 'basketball_nba' ? 'NBA Game Odds' : 
               `${sports.find(s => s.key === selectedSport)?.name} Game Odds`}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1">
              {featuredGames.length} games
              {featuredGames.length < 10 && (
                <span className="hidden sm:inline ml-1">
                  • Some games may have TBD betting lines • Started games automatically removed
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchOdds()}
              disabled={oddsLoading}
              className="flex items-center gap-1 text-xs px-2 sm:px-3 h-7 sm:h-8"
            >
              <RefreshCw className={`w-3 h-3 ${oddsLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Badge variant="outline" className="flex items-center gap-1 text-xs px-1.5 sm:px-2">
              <Star className="w-3 h-3" />
              <span className="hidden sm:inline">Live</span> Odds
            </Badge>
          </div>
        </div>

        {oddsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-3 sm:p-4">
                  <div className="space-y-2 sm:space-y-3">
                    <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-5 sm:h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-5 sm:h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : featuredGames.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {/* Mobile-optimized game cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {featuredGames.map((game) => (
                isProUser ? (
                  <ProGameCard
                    key={game.id}
                    homeTeam={game.homeTeam}
                    awayTeam={game.awayTeam}
                    homeOdds={game.homeOdds}
                    awayOdds={game.awayOdds}
                    spread={game.spread}
                    total={game.total}
                    startTime={game.startTime}
                    gameId={game.gameId}
                    probablePitchers={game.probablePitchers}
                    rawBookmakers={game.rawBookmakers}
                  />
                ) : (
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
                    isDailyPick={isGameDailyPick(game)}
                    dailyPickTeam={dailyPick?.pickTeam}
                    dailyPickGrade={dailyPick?.grade}
                    dailyPickId={dailyPick?.id}
                    lockPickTeam={isGameLockPick(game) ? lockPick?.pickTeam : undefined}
                    lockPickGrade={isGameLockPick(game) ? lockPick?.grade : undefined}
                    lockPickId={isGameLockPick(game) ? lockPick?.id : undefined}
                    isAuthenticated={!!user}
                    rawBookmakers={game.rawBookmakers}
                  />
                )
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






      </div>
    </>
  );
}