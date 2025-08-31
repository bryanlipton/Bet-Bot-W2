import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Star, RefreshCw } from "lucide-react";
import MobileHeader from "@/components/MobileHeader";
import { ActionStyleGameCard } from "./ActionStyleGameCard";
import { useAuth } from "@/hooks/useAuth";
import { useProStatus } from "@/hooks/useProStatus";
import { OddsComparisonModal } from "./OddsComparisonModal";

// DailyPick component with modal functionality
function DailyPick({ liveGameData }) {
  const [pick, setPick] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOddsModal, setShowOddsModal] = useState(false);
  const [selectedBetType, setSelectedBetType] = useState(null);
  
  useEffect(() => {
    fetch('/api/daily-pick')
      .then(res => res.json())
      .then(data => {
        console.log('Daily Pick API Response:', data);
        setPick(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching daily pick:', err);
        setLoading(false);
      });
  }, []);

  const formatGameTime = (pick) => {
    const dateString = pick?.startTime || pick?.commence_time || pick?.gameTime;
    if (!dateString) return "TBD";
    
    try {
      const date = new Date(dateString);
      const options = {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      };
      return date.toLocaleString("en-US", options) + " ET";
    } catch {
      return "TBD";
    }
  };

  const getLiveOdds = () => {
    if (!pick) return null;
    if (!liveGameData) return pick.odds;
    
    if (pick.pickTeam === liveGameData.homeTeam) {
      return liveGameData.homeOdds || pick.odds;
    } else if (pick.pickTeam === liveGameData.awayTeam) {
      return liveGameData.awayOdds || pick.odds;
    }
    
    return pick.odds;
  };

  const handlePick = (e) => {
    if (!pick) return;
    setSelectedBetType('pick');
    setShowOddsModal(true);
  };

  const handleFade = (e) => {
    if (!pick) return;
    setSelectedBetType('fade');
    setShowOddsModal(true);
  };

  if (loading) {
    return (
      <div className="relative bg-blue-50/50 dark:bg-blue-950/20 border-2 border-blue-400/30 rounded-xl p-6 shadow-lg shadow-blue-500/10">
        <div className="animate-pulse">
          <div className="h-6 bg-blue-100 dark:bg-blue-900/30 rounded w-32 mb-2"></div>
          <div className="h-4 bg-blue-100 dark:bg-blue-900/30 rounded w-48 mb-3"></div>
          <div className="h-8 bg-blue-100 dark:bg-blue-900/30 rounded w-40"></div>
        </div>
      </div>
    );
  }

  if (!pick || !pick.pickTeam) {
    return (
      <div className="relative bg-blue-50/50 dark:bg-blue-950/20 border-2 border-blue-400/30 rounded-xl p-6 shadow-lg shadow-blue-500/10">
        <h3 className="text-xl font-bold mb-2 text-blue-600 dark:text-blue-400">Pick of the Day</h3>
        <p className="text-gray-700 dark:text-gray-300">No Pick Available Today</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Check back when games are available</p>
      </div>
    );
  }

  return (
    <>
      <div className="relative bg-blue-50/50 dark:bg-blue-950/20 border-2 border-blue-500/50 rounded-xl p-6 shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 hover:border-blue-500/70 transition-all duration-300">
        {pick.grade && (
          <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">
            {pick.grade}
          </div>
        )}
        
        <h3 className="text-xl font-bold mb-1 text-blue-600 dark:text-blue-400">Pick of the Day</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">AI-backed Data Analysis</p>
        
        <div className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          {pick.pickTeam} ML <span className="text-yellow-600 dark:text-yellow-400">
            {getLiveOdds() > 0 ? '+' : ''}{getLiveOdds()}
          </span>
          {liveGameData && getLiveOdds() !== pick.odds && (
            <span className="text-xs text-gray-500 ml-2">
              (opened {pick.odds > 0 ? '+' : ''}{pick.odds})
            </span>
          )}
        </div>
        
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          {pick.awayTeam} @ {pick.homeTeam}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {formatGameTime(pick)} • {pick.venue || 'Stadium TBD'}
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={handlePick}
            className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white py-3 px-4 rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 transform active:scale-95"
          >
            Pick
          </button>
          <button 
            onClick={handleFade}
            className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white py-3 px-4 rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 transform active:scale-95"
          >
            Fade
          </button>
        </div>
      </div>

      {showOddsModal && pick && (
        <OddsComparisonModal
          open={showOddsModal}
          onClose={() => setShowOddsModal(false)}
          gameInfo={{
            homeTeam: pick.homeTeam,
            awayTeam: pick.awayTeam,
            gameId: pick.gameId,
            sport: 'baseball_mlb',
            gameTime: pick.startTime || pick.gameTime || pick.commence_time
          }}
          bookmakers={liveGameData?.rawBookmakers || []}
          selectedBet={{
            market: 'moneyline',
            selection: selectedBetType === 'fade' ? 
              (pick.pickTeam === pick.homeTeam ? pick.awayTeam : pick.homeTeam) : 
              pick.pickTeam
          }}
        />
      )}
    </>
  );
}

// LoggedInLockPick component with modal functionality
function LoggedInLockPick({ liveGameData }) {
  const [pick, setPick] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOddsModal, setShowOddsModal] = useState(false);
  const [selectedBetType, setSelectedBetType] = useState(null);

  useEffect(() => {
    fetch('/api/daily-pick/lock')
      .then(res => res.json())
      .then(data => {
        console.log('Lock Pick API Response:', data);
        setPick(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching lock pick:', err);
        setLoading(false);
      });
  }, []);

  const formatGameTime = (pick) => {
    const dateString = pick?.startTime || pick?.commence_time || pick?.gameTime;
    if (!dateString) return "TBD";
    
    try {
      const date = new Date(dateString);
      const options = {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      };
      return date.toLocaleString("en-US", options) + " ET";
    } catch {
      return "TBD";
    }
  };

  const getLiveOdds = () => {
    if (!pick) return null;
    if (!liveGameData) return pick.odds;
    
    if (pick.pickTeam === liveGameData.homeTeam) {
      return liveGameData.homeOdds || pick.odds;
    } else if (pick.pickTeam === liveGameData.awayTeam) {
      return liveGameData.awayOdds || pick.odds;
    }
    
    return pick.odds;
  };

  const handlePick = (e) => {
    if (!pick) return;
    setSelectedBetType('pick');
    setShowOddsModal(true);
  };

  const handleFade = (e) => {
    if (!pick) return;
    setSelectedBetType('fade');
    setShowOddsModal(true);
  };

  if (loading) {
    return (
      <div className="relative bg-orange-50/40 dark:bg-orange-950/20 border-2 border-orange-400/30 rounded-xl p-6 shadow-lg shadow-orange-500/10">
        <div className="animate-pulse">
          <div className="h-6 bg-orange-100 dark:bg-orange-900/30 rounded w-40 mb-2"></div>
          <div className="h-4 bg-orange-100 dark:bg-orange-900/30 rounded w-56 mb-3"></div>
          <div className="h-8 bg-orange-100 dark:bg-orange-900/30 rounded w-40"></div>
        </div>
      </div>
    );
  }

  if (!pick || !pick.pickTeam) {
    return (
      <div className="relative bg-orange-50/40 dark:bg-orange-950/20 border-2 border-orange-400/30 rounded-xl p-6 shadow-lg shadow-orange-500/10">
        <h3 className="text-xl font-bold mb-2 text-orange-600 dark:text-orange-400">Logged in Lock Pick</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-2">Premium picks available for authenticated users</p>
        <div className="mt-6">
          <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200">
            Log in to view pick
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative bg-orange-50/40 dark:bg-orange-950/20 border-2 border-orange-500/50 rounded-xl p-6 shadow-xl shadow-orange-500/20 hover:shadow-orange-500/30 hover:border-orange-500/70 transition-all duration-300">
        {pick.grade && (
          <div className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">
            {pick.grade}
          </div>
        )}
        
        <h3 className="text-xl font-bold mb-1 text-orange-600 dark:text-orange-400">Logged in Lock Pick</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Exclusive pick for authenticated users</p>
        
        <div className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          {pick.pickTeam} ML <span className="text-yellow-600 dark:text-yellow-400">
            {getLiveOdds() > 0 ? '+' : ''}{getLiveOdds()}
          </span>
          {liveGameData && getLiveOdds() !== pick.odds && (
            <span className="text-xs text-gray-500 ml-2">
              (opened {pick.odds > 0 ? '+' : ''}{pick.odds})
            </span>
          )}
        </div>
        
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          {pick.awayTeam} @ {pick.homeTeam}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {formatGameTime(pick)} • {pick.venue || 'Stadium TBD'}
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={handlePick}
            className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white py-3 px-4 rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 transform active:scale-95"
          >
            Pick
          </button>
          <button 
            onClick={handleFade}
            className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white py-3 px-4 rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 transform active:scale-95"
          >
            Fade
          </button>
        </div>
      </div>

      {showOddsModal && pick && (
        <OddsComparisonModal
          open={showOddsModal}
          onClose={() => setShowOddsModal(false)}
          gameInfo={{
            homeTeam: pick.homeTeam,
            awayTeam: pick.awayTeam,
            gameId: pick.gameId,
            sport: 'baseball_mlb',
            gameTime: pick.startTime || pick.gameTime || pick.commence_time
          }}
          bookmakers={liveGameData?.rawBookmakers || []}
          selectedBet={{
            market: 'moneyline',
            selection: selectedBetType === 'fade' ? 
              (pick.pickTeam === pick.homeTeam ? pick.awayTeam : pick.homeTeam) : 
              pick.pickTeam
          }}
        />
      )}
    </>
  );
}

// Main ActionStyleDashboard component
function ActionStyleDashboard() {
  const [selectedSport, setSelectedSport] = useState("baseball_mlb");
  const { isAuthenticated } = useAuth();
  const { isProUser } = useProStatus();

  // Fetch odds data
  const { data: liveOddsData, isLoading: oddsLoading, refetch: refetchOdds } = useQuery({
    queryKey: ['/api/mlb/complete-schedule'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/mlb/complete-schedule');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching odds:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Process games data
  const processGames = (games) => {
    if (!Array.isArray(games)) return [];
    
    return games.map(game => ({
      id: game.id || `game_${Date.now()}`,
      homeTeam: game.home_team || 'Home',
      awayTeam: game.away_team || 'Away',
      homeOdds: game.bookmakers?.[0]?.markets?.[0]?.outcomes?.find(o => o.name === game.home_team)?.price,
      awayOdds: game.bookmakers?.[0]?.markets?.[0]?.outcomes?.find(o => o.name === game.away_team)?.price,
      startTime: game.commence_time,
      sportKey: game.sport_key,
      rawBookmakers: game.bookmakers || [] // Keep the full bookmakers data
    }));
  };

  const games = processGames(liveOddsData);

  // Sports tabs
  const sports = [
    { key: "baseball_mlb", name: "MLB" },
    { key: "americanfootball_nfl", name: "NFL" },
    { key: "basketball_nba", name: "NBA" },
  ];

  return (
    <>
      <MobileHeader />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 space-y-4 md:space-y-6 pb-20 sm:pb-6">
        
        {/* Header */}
        <div className="space-y-3 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white underline">
              Bet Bot Sports Genie AI Picks
            </h2>
            <Badge variant="outline" className={`${isProUser ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'} text-white border-none self-start sm:self-auto`}>
              {isProUser ? 'Pro Users' : 'Free Users'}
            </Badge>
          </div>
          
          {/* Pick Cards */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 sm:gap-3 md:gap-4 xl:gap-6">
            <DailyPick liveGameData={games.find(g => 
              g.homeTeam === 'Cincinnati Reds' && g.awayTeam === 'St. Louis Cardinals'
            )} />
            <LoggedInLockPick liveGameData={games.find(g => 
              g.homeTeam === 'Houston Astros' || g.awayTeam === 'Houston Astros'
            )} />
          </div>
        </div>

        {/* Sports Navigation */}
        <div className="flex items-center gap-2 sm:gap-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {sports.map((sport) => (
            <button
              key={sport.key}
              onClick={() => setSelectedSport(sport.key)}
              className={`py-3 px-2 sm:px-4 font-medium text-xs sm:text-sm border-b-2 transition-colors whitespace-nowrap ${
                selectedSport === sport.key
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              {sport.name}
            </button>
          ))}
        </div>

        {/* Games Section */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <div>
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                MLB Game Odds
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                {games.length} games available
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : games.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {games.map((game) => (
                <ActionStyleGameCard
                  key={game.id}
                  homeTeam={game.homeTeam}
                  awayTeam={game.awayTeam}
                  homeOdds={game.homeOdds}
                  awayOdds={game.awayOdds}
                  startTime={game.startTime}
                  gameId={game.id}
                  isAuthenticated={isAuthenticated}
                  rawBookmakers={game.rawBookmakers} // Pass bookmakers to game cards
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Live Games
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  No games are currently available. Check back later.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

export default ActionStyleDashboard;
