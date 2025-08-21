// Shared game time formatter
const formatGameTime = (startTime?: string): string => {
  try {
    if (!startTime) return "TBD";
    
    const date = new Date(startTime);
    if (isNaN(date.getTime())) return "TBD";
    
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    
    const time = date.toLocaleTimeString([], { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
    
    if (isToday) {
      return time;
    } else if (isTomorrow) {
      return `Tomorrow ${time}`;
    } else {
      return `${date.getMonth()+1}/${date.getDate()} ${time}`;
    }
  } catch (error) {
    console.warn('Error formatting time:', error);
    return "TBD";
  }
};
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

// --- DailyPick Component ---
function DailyPick({ pick, loading }: { pick: any; loading: boolean }) {
  if (loading) {
    return (
      <div className="rounded-lg p-6 border-2 border-blue-500/50 shadow-lg shadow-blue-500/20 bg-blue-950/40">
        <h3 className="text-xl font-bold mb-2 text-blue-400">Pick of the Day</h3>
        <p className="text-gray-300">Loading...</p>
      </div>
    );
  }

  if (!pick || !pick.pickTeam) {
    return (
      <div className="rounded-lg p-6 border-2 border-blue-500/50 shadow-lg shadow-blue-500/20 bg-blue-950/40">
        <h3 className="text-xl font-bold mb-2 text-blue-400">Pick of the Day</h3>
        <p className="text-gray-300">No Pick Available Today</p>
        <p className="text-sm text-gray-400 mt-2">Check back when games are available</p>
      </div>
    );
  }

  return (
    <div className="relative rounded-lg p-6 border-2 border-blue-500/50 shadow-lg shadow-blue-500/20 bg-blue-950/40">
      <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full font-bold text-xs">
        {pick.grade}
      </div>
      <h3 className="text-xl font-bold mb-2 text-blue-400">Pick of the Day</h3>
      <p className="text-sm text-gray-400 mb-3">AI-backed Data Analysis</p>
      <div className="text-xl font-bold text-yellow-300">
        {pick.pickTeam} ML {pick.odds > 0 ? "+" : ""}
        {pick.odds}
      </div>
      <div className="text-sm text-gray-300 mt-2">
        {pick.awayTeam} @ {pick.homeTeam} | {formatGameTime(pick.startTime)}
      </div>
      <div className="grid grid-cols-2 gap-3 mt-6">
        <button className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-semibold text-sm shadow-lg">
          Pick
        </button>
        <button className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-semibold text-sm shadow-lg">
          Fade
        </button>
      </div>
    </div>
  );
}

// --- LoggedInLockPick Component ---
function LoggedInLockPick({ pick, loading }: { pick: any; loading: boolean }) {
  if (loading) {
    return (
      <div className="rounded-lg p-6 border-2 border-orange-500/50 shadow-lg shadow-orange-500/20 bg-orange-950/40">
        <h3 className="text-xl font-bold mb-2 text-orange-400">Logged in Lock Pick</h3>
        <p className="text-orange-100">Loading...</p>
      </div>
    );
  }

  if (!pick || !pick.pickTeam) {
    return (
      <div className="rounded-lg p-6 border-2 border-orange-500/50 shadow-lg shadow-orange-500/20 bg-orange-950/40">
        <h3 className="text-xl font-bold mb-2 text-orange-400">Logged in Lock Pick</h3>
        <p className="text-orange-100">Log in to view another free pick</p>
        <p className="text-sm text-orange-200 mt-2">Premium picks available for authenticated users</p>
      </div>
    );
  }

  return (
    <div className="relative rounded-lg p-6 border-2 border-orange-500/50 shadow-lg shadow-orange-500/20 bg-orange-950/40">
      <div className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-1 rounded-full font-bold text-xs">
        {pick.grade}
      </div>
      <h3 className="text-xl font-bold mb-2 text-orange-400">Logged in Lock Pick</h3>
      <p className="text-sm text-orange-200 mb-3">Exclusive pick for authenticated users</p>
      <div className="text-2xl font-extrabold text-yellow-300">
        {pick.pickTeam} ML {pick.odds > 0 ? "+" : ""}
        {pick.odds}
      </div>
      <div className="text-sm text-gray-300 mt-2">
        {pick.awayTeam} @ {pick.homeTeam} | {formatGameTime(pick.startTime)}
      </div>
      <div className="grid grid-cols-2 gap-2 mt-5">
        <button className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded font-semibold text-sm shadow-lg">
          Pick
        </button>
        <button className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded font-semibold text-sm shadow-lg">
          Fade
        </button>
      </div>
    </div>
  );
}

if (loading) {
  return (
    <div className="rounded-lg p-6 border-2 border-orange-500/50 shadow-lg shadow-orange-500/20 bg-orange-950/40">
      <h3 className="text-xl font-bold mb-2 text-orange-400">Logged in Lock Pick</h3>
      <p className="text-orange-100">Loading...</p>
    </div>
  );
}

if (!pick || !pick.pickTeam) {
  return (
    <div className="rounded-lg p-6 border-2 border-orange-500/50 shadow-lg shadow-orange-500/20 bg-orange-950/40">
      <h3 className="text-xl font-bold mb-2 text-orange-400">Logged in Lock Pick</h3>
      <p className="text-orange-100">Log in to view another free pick</p>
      <p className="text-sm text-orange-200 mt-2">Premium picks available for authenticated users</p>
    </div>
  );
}

return (
  <div className="relative rounded-lg p-6 border-2 border-orange-500/50 shadow-lg shadow-orange-500/20 bg-orange-950/40">
    <div className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-1 rounded-full font-bold text-xs">
      {pick.grade}
    </div>
    <h3 className="text-xl font-bold mb-2 text-orange-400">Logged in Lock Pick</h3>
    <p className="text-sm text-orange-200 mb-3">Exclusive pick for authenticated users</p>
    <div className="text-2xl font-extrabold text-yellow-300">
      {pick.pickTeam} ML {pick.odds > 0 ? '+' : ''}{pick.odds}
    </div>
    <div className="text-sm text-gray-300 mt-2">
      {pick.awayTeam} @ {pick.homeTeam} | {formatGameTime(pick.startTime)}
    </div>
    <div className="grid grid-cols-2 gap-2 mt-5">
      <button className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded font-semibold text-sm shadow-lg">
        Pick
      </button>
      <button className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded font-semibold text-sm shadow-lg">
        Fade
      </button>
    </div>
  </div>
);


// SAFE DATE COMPARISON FUNCTION
const isGameUpcoming = (dateString: string | null | undefined): boolean => {
  try {
    if (!dateString) return false;
    
    const gameDate = new Date(dateString);
    if (isNaN(gameDate.getTime())) return false;
    
    const now = new Date();
    return gameDate > now;
  } catch (error) {
    console.warn(`Error comparing date "${dateString}":`, error);
    return false;
  }
};

export function ActionStyleDashboard() {
  const [selectedSport, setSelectedSport] = useState("baseball_mlb");

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isProUser, isLoading: proLoading } = useProStatus();
  
  // Fetch complete schedule from MLB API + Odds API
  const { data: liveOddsData, isLoading: oddsLoading, refetch: refetchOdds } = useQuery({
    queryKey: selectedSport === 'baseball_mlb' ? ['/api/mlb/complete-schedule'] : ['/api/odds/events', selectedSport],
    queryFn: async () => {
      try {
        const response = await fetch(
          selectedSport === 'baseball_mlb' 
            ? '/api/mlb/complete-schedule' 
            : `/api/odds/events?sport=${selectedSport}`
        );
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching odds data:', error);
        return []; // Return empty array on error
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });

  // Fetch recommendations
  const { data: recommendations = [] } = useQuery({
    queryKey: ['/api/recommendations', selectedSport],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/recommendations?sport=${selectedSport}`);
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        return [];
      }
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });

  // Fetch daily pick data
  const { data: dailyPick } = useQuery({
    queryKey: ['/api/daily-pick'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/daily-pick');
        if (!response.ok) return null;
        return await response.json();
      } catch (error) {
        console.error('Error fetching daily pick:', error);
        return null;
      }
    },
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });

  // Fetch lock pick data
  const { data: lockPick } = useQuery({
    queryKey: ['/api/daily-pick/lock'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/daily-pick/lock');
        if (!response.ok) return null;
        return await response.json();
      } catch (error) {
        console.error('Error fetching lock pick:', error);
        return null;
      }
    },
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });

  // Fetch user auth status
  const { data: user } = useQuery({
    queryKey: ['/api/auth/user'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/auth/user');
        if (!response.ok) return null;
        return await response.json();
      } catch (error) {
        console.error('Error fetching user data:', error);
        return null;
      }
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: false,
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
    if (!Array.isArray(oddsData)) {
      console.warn('Invalid odds data received:', oddsData);
      return [];
    }
    
    const shouldLog = Math.floor(Date.now() / 30000) % 5 === 0;
    if (shouldLog) {
      console.log(`Processing ${oddsData.length} games from API`);
    }
    
    // Filter out games that have already started - SAFE VERSION
    const upcomingGames = oddsData.filter(game => {
      if (!game || !game.commence_time) return false;
      return isGameUpcoming(game.commence_time);
    });
    
    // Sort games by commence time (chronological order) - SAFE VERSION
    const sortedGames = [...upcomingGames].sort((a, b) => {
      try {
        const dateA = new Date(a.commence_time || 0);
        const dateB = new Date(b.commence_time || 0);
        
        if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
          return 0; // Keep original order if dates are invalid
        }
        
        return dateA.getTime() - dateB.getTime();
      } catch (error) {
        console.warn('Error sorting games by date:', error);
        return 0;
      }
    });
    
    const processedGames = sortedGames.map((game, index) => {
      if (shouldLog) {
        console.log(`Processing game ${index + 1}: ${game.away_team} @ ${game.home_team} - Bookmakers: ${game.bookmakers?.length || 0}`);
      }
      
      // Safe bookmaker data extraction
      const firstBookmaker = Array.isArray(game.bookmakers) && game.bookmakers.length > 0 ? game.bookmakers[0] : null;
      const h2hMarket = firstBookmaker?.markets?.find(m => m.key === 'h2h');
      const spreadsMarket = firstBookmaker?.markets?.find(m => m.key === 'spreads');
      const totalsMarket = firstBookmaker?.markets?.find(m => m.key === 'totals');
      
      const homeOutcome = h2hMarket?.outcomes?.find(o => o.name === game.home_team);
      const awayOutcome = h2hMarket?.outcomes?.find(o => o.name === game.away_team);
      const spreadOutcome = spreadsMarket?.outcomes?.find(o => o.name === game.home_team);
      const totalOutcome = totalsMarket?.outcomes?.find(o => o.name === 'Over');

      // Extract bookmaker lines (first 3 books) - prioritize major sportsbooks
      const priorityBooks = ['FanDuel', 'DraftKings', 'BetMGM', 'Caesars', 'PointsBet'];
      const sortedBookmakers = Array.isArray(game.bookmakers) 
        ? game.bookmakers.sort((a, b) => {
            const aIndex = priorityBooks.indexOf(a.title);
            const bIndex = priorityBooks.indexOf(b.title);
            if (aIndex === -1 && bIndex === -1) return 0;
            if (aIndex === -1) return 1;
            if (bIndex === -1) return -1;
            return aIndex - bIndex;
          })
        : [];
      
      const bookmakers = sortedBookmakers.slice(0, 3).map(book => {
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
  id: game.id || `game_${index}`,
  homeTeam: game.home_team || 'Home Team',
  awayTeam: game.away_team || 'Away Team',
  homeOdds: homeOutcome?.price || null,
  awayOdds: awayOutcome?.price || null,
  spread: spreadOutcome?.point || null,
  total: totalOutcome?.point || null,
 startTime: game.commence_time,
  sportKey: game.sport_key || selectedSport,
  bookmakers,
  rawBookmakers: Array.isArray(game.bookmakers) ? game.bookmakers : [],
  gameId: game.gameId || game.id || `game_${index}`,
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
          
          {/* WORKING PICK COMPONENTS */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 sm:gap-3 md:gap-4 xl:gap-6">
           <DailyPick pick={dailyPick} loading={oddsLoading} />
<LoggedInLockPick pick={lockPick} loading={oddsLoading || authLoading} />

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
          
          {/* WORKING PICK COMPONENTS */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4 md:gap-4 xl:gap-6">
            <DailyPick />
            <LoggedInLockPick />
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
