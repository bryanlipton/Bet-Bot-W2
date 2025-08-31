import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, RefreshCw, TrendingUp, User, Info } from "lucide-react";
import { ActionStyleGameCard } from "./ActionStyleGameCard";
import { ProGameCard } from "./ProGameCard";
import MobileHeader from "./MobileHeader";

// Inline DailyPick Component
const DailyPick = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [pickStatus, setPickStatus] = useState<string | null>(null);
  const [fadeStatus, setFadeStatus] = useState<string | null>(null);

  // Fetch daily pick data
  const { data: dailyPick, isLoading, error } = useQuery({
    queryKey: ['daily-pick'],
    queryFn: async () => {
      const response = await fetch('/api/daily-pick');
      if (!response.ok) throw new Error('Failed to fetch daily pick');
      return response.json();
    },
  });

  const handlePick = () => {
    if (!dailyPick) return;
    
    const pickData = {
      type: 'daily-pick',
      team: dailyPick.team,
      odds: dailyPick.odds,
      grade: dailyPick.grade,
      confidence: dailyPick.confidence,
      timestamp: new Date().toISOString(),
    };
    
    const existingPicks = JSON.parse(localStorage.getItem('userPicks') || '[]');
    existingPicks.push(pickData);
    localStorage.setItem('userPicks', JSON.stringify(existingPicks));
    
    setPickStatus('✓ Picked!');
    setFadeStatus(null);
    setTimeout(() => setPickStatus(null), 2000);
    console.log('✅ Pick saved:', pickData);
  };

  const handleFade = () => {
    if (!dailyPick) return;
    
    const fadeData = {
      type: 'daily-pick-fade',
      team: dailyPick.opponent,
      odds: dailyPick.opponentOdds,
      grade: dailyPick.grade,
      confidence: dailyPick.confidence,
      timestamp: new Date().toISOString(),
    };
    
    const existingPicks = JSON.parse(localStorage.getItem('userPicks') || '[]');
    existingPicks.push(fadeData);
    localStorage.setItem('userPicks', JSON.stringify(existingPicks));
    
    setFadeStatus('✓ Faded!');
    setPickStatus(null);
    setTimeout(() => setFadeStatus(null), 2000);
    console.log('✅ Fade saved:', fadeData);
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-r from-blue-900/20 to-blue-800/10 border-blue-500/30">
        <CardContent className="p-6">
          <div className="text-gray-300">Loading daily pick...</div>
        </CardContent>
      </Card>
    );
  }

  if (error || !dailyPick) {
    return (
      <Card className="bg-gradient-to-r from-blue-900/20 to-blue-800/10 border-blue-500/30">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold mb-2">Pick of the Day</h3>
          <p className="text-gray-300">No Pick Available Today</p>
          <p className="text-sm text-gray-400 mt-2">Check back when games are available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-blue-900/20 to-blue-800/10 border-blue-500/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Pick of the Day</CardTitle>
            <Badge className={`bg-${dailyPick.gradeColor || 'blue'}-600`}>
              {dailyPick.grade}
            </Badge>
          </div>
          <span className="text-sm text-gray-400">
            {dailyPick.confidence}% confidence
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-white">{dailyPick.team} ML</p>
            <p className="text-sm text-gray-400">{dailyPick.matchup}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg text-green-400">{dailyPick.odds}</p>
            <p className="text-xs text-gray-400">{dailyPick.time}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={handlePick}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            disabled={!!pickStatus || !!fadeStatus}
          >
            {pickStatus || 'Pick'}
          </Button>
          <Button 
            onClick={handleFade}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            disabled={!!pickStatus || !!fadeStatus}
          >
            {fadeStatus || 'Fade'}
          </Button>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-gray-400 hover:text-white"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Hide' : 'Show'} Analysis
          <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </Button>
        
        {isExpanded && dailyPick.analysis && (
          <div className="pt-3 border-t border-gray-700">
            <p className="text-sm text-gray-300">{dailyPick.analysis}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Inline LoggedInLockPick Component
const LoggedInLockPick = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [pickStatus, setPickStatus] = useState<string | null>(null);
  const [fadeStatus, setFadeStatus] = useState<string | null>(null);

  // Check authentication
  const { data: user } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const response = await fetch('/api/auth/user');
      if (!response.ok) return null;
      return response.json();
    },
  });

  // Fetch lock pick data
  const { data: lockPick, isLoading, error } = useQuery({
    queryKey: ['lock-pick'],
    queryFn: async () => {
      const response = await fetch('/api/daily-pick/lock');
      if (!response.ok) throw new Error('Failed to fetch lock pick');
      return response.json();
    },
    enabled: !!user, // Only fetch if user is authenticated
  });

  const handlePick = () => {
    if (!lockPick) return;
    
    const pickData = {
      type: 'lock-pick',
      team: lockPick.team,
      odds: lockPick.odds,
      grade: lockPick.grade,
      confidence: lockPick.confidence,
      timestamp: new Date().toISOString(),
    };
    
    const existingPicks = JSON.parse(localStorage.getItem('userPicks') || '[]');
    existingPicks.push(pickData);
    localStorage.setItem('userPicks', JSON.stringify(existingPicks));
    
    setPickStatus('✓ Picked!');
    setFadeStatus(null);
    setTimeout(() => setPickStatus(null), 2000);
    console.log('✅ Lock pick saved:', pickData);
  };

  const handleFade = () => {
    if (!lockPick) return;
    
    const fadeData = {
      type: 'lock-pick-fade',
      team: lockPick.opponent,
      odds: lockPick.opponentOdds,
      grade: lockPick.grade,
      confidence: lockPick.confidence,
      timestamp: new Date().toISOString(),
    };
    
    const existingPicks = JSON.parse(localStorage.getItem('userPicks') || '[]');
    existingPicks.push(fadeData);
    localStorage.setItem('userPicks', JSON.stringify(existingPicks));
    
    setFadeStatus('✓ Faded!');
    setPickStatus(null);
    setTimeout(() => setFadeStatus(null), 2000);
    console.log('✅ Lock fade saved:', fadeData);
  };

  if (!user) {
    return (
      <Card className="bg-gradient-to-r from-orange-900/20 to-orange-800/10 border-orange-500/30">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold mb-2">Logged in Lock Pick</h3>
          <p className="text-gray-300">Log in to view another free pick</p>
          <p className="text-sm text-gray-400 mt-2">Premium picks available for authenticated users</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-r from-orange-900/20 to-orange-800/10 border-orange-500/30">
        <CardContent className="p-6">
          <div className="text-gray-300">Loading lock pick...</div>
        </CardContent>
      </Card>
    );
  }

  if (error || !lockPick) {
    return (
      <Card className="bg-gradient-to-r from-orange-900/20 to-orange-800/10 border-orange-500/30">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold mb-2">Logged in Lock Pick</h3>
          <p className="text-gray-300">No Lock Pick Available Today</p>
          <p className="text-sm text-gray-400 mt-2">Check back when games are available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-orange-900/20 to-orange-800/10 border-orange-500/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Logged in Lock</CardTitle>
            <Badge className={`bg-${lockPick.gradeColor || 'orange'}-600`}>
              {lockPick.grade}
            </Badge>
          </div>
          <span className="text-sm text-gray-400">
            {lockPick.confidence}% confidence
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-white">{lockPick.team} ML</p>
            <p className="text-sm text-gray-400">{lockPick.matchup}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg text-green-400">{lockPick.odds}</p>
            <p className="text-xs text-gray-400">{lockPick.time}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={handlePick}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            disabled={!!pickStatus || !!fadeStatus}
          >
            {pickStatus || 'Pick'}
          </Button>
          <Button 
            onClick={handleFade}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            disabled={!!pickStatus || !!fadeStatus}
          >
            {fadeStatus || 'Fade'}
          </Button>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-gray-400 hover:text-white"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Hide' : 'Show'} Analysis
          <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </Button>
        
        {isExpanded && lockPick.analysis && (
          <div className="pt-3 border-t border-gray-700">
            <p className="text-sm text-gray-300">{lockPick.analysis}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export function ActionStyleDashboard() {
  const [isProUser, setIsProUser] = useState(false);
  const [selectedSport, setSelectedSport] = useState('MLB');
  const [pickedGames, setPickedGames] = useState<Set<string>>(new Set());
  const [fadedGames, setFadedGames] = useState<Set<string>>(new Set());

  // Fetch user data to check pro status
  const { data: user } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const response = await fetch('/api/auth/user');
      if (!response.ok) return null;
      return response.json();
    },
  });

  // Fetch MLB games
  const { data: games = [], isLoading: oddsLoading, refetch: refetchOdds } = useQuery({
    queryKey: ['mlb-odds'],
    queryFn: async () => {
      const response = await fetch('/api/mlb/complete-schedule');
      if (!response.ok) return [];
      const data = await response.json();
      return data || [];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch recommendations
  const { data: recommendations = [] } = useQuery({
    queryKey: ['recommendations'],
    queryFn: async () => {
      const response = await fetch('/api/recommendations');
      if (!response.ok) return [];
      return response.json();
    },
  });

  // Fetch live odds events
  const { data: liveOddsData = [] } = useQuery({
    queryKey: ['live-odds'],
    queryFn: async () => {
      const response = await fetch('/api/odds/events');
      if (!response.ok) return [];
      return response.json();
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  useEffect(() => {
    if (user?.isPro) {
      setIsProUser(true);
    }
  }, [user]);

  const handlePick = (gameId: string, team: string, odds: string) => {
    const pickData = {
      gameId,
      team,
      odds,
      timestamp: new Date().toISOString(),
      sport: selectedSport,
    };
    
    // Save to localStorage
    const existingPicks = JSON.parse(localStorage.getItem('userPicks') || '[]');
    existingPicks.push(pickData);
    localStorage.setItem('userPicks', JSON.stringify(existingPicks));
    
    // Update UI
    setPickedGames(prev => new Set([...prev, `${gameId}-${team}`]));
    console.log('✅ Pick saved:', pickData);
  };

  const handleFade = (gameId: string, team: string, odds: string) => {
    const fadeData = {
      gameId,
      team,
      odds,
      timestamp: new Date().toISOString(),
      sport: selectedSport,
      type: 'fade',
    };
    
    // Save to localStorage
    const existingPicks = JSON.parse(localStorage.getItem('userPicks') || '[]');
    existingPicks.push(fadeData);
    localStorage.setItem('userPicks', JSON.stringify(existingPicks));
    
    // Update UI
    setFadedGames(prev => new Set([...prev, `${gameId}-${team}`]));
    console.log('✅ Fade saved:', fadeData);
  };

  const handleRefresh = () => {
    refetchOdds();
    console.log('🔄 Refreshing odds...');
  };

  const GameCardComponent = isProUser ? ProGameCard : ActionStyleGameCard;

  const upcomingGames = games.filter((game: any) => 
    !liveOddsData.some((liveGame: any) => liveGame.id === game.id)
  );

  const liveGames = liveOddsData || [];

  return (
    <>
      <MobileHeader />
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white underline">
            Bet Bot Sports Genie AI Picks
          </h1>
        </div>

        {/* Pick Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <DailyPick />
          <LoggedInLockPick />
        </div>

        {/* Sports Tabs */}
        <div className="border-b border-gray-700 mb-6">
          <nav className="flex space-x-8">
            <button 
              onClick={() => setSelectedSport('MLB')}
              className={`py-2 px-1 ${
                selectedSport === 'MLB' 
                  ? 'border-b-2 border-blue-500 text-blue-400' 
                  : 'text-gray-400'
              }`}
            >
              MLB
            </button>
            <button 
              onClick={() => setSelectedSport('NFL')}
              className={`py-2 px-1 ${
                selectedSport === 'NFL' 
                  ? 'border-b-2 border-blue-500 text-blue-400' 
                  : 'text-gray-400'
              }`}
            >
              NFL
            </button>
            <button 
              onClick={() => setSelectedSport('NBA')}
              className={`py-2 px-1 ${
                selectedSport === 'NBA' 
                  ? 'border-b-2 border-blue-500 text-blue-400' 
                  : 'text-gray-400'
              }`}
            >
              NBA
            </button>
          </nav>
        </div>

        {/* Live Games Section */}
        {liveGames.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <h2 className="text-xl font-bold text-white">
                Live Games ({liveGames.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveGames.map((game: any, index: number) => (
                <GameCardComponent
                  key={`live-${game.id || index}`}
                  game={game}
                  onPick={handlePick}
                  onFade={handleFade}
                  isPicked={pickedGames.has(`${game.id}-${game.home_team}`) || 
                           pickedGames.has(`${game.id}-${game.away_team}`)}
                  isFaded={fadedGames.has(`${game.id}-${game.home_team}`) || 
                          fadedGames.has(`${game.id}-${game.away_team}`)}
                  recommendation={recommendations.find((r: any) => r.gameId === game.id)}
                  isLive={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Games Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">
              {selectedSport} Game Odds ({upcomingGames.length} games)
            </h2>
            <div className="flex gap-2">
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Link href="/odds/live">
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Live Odds
                </Button>
              </Link>
            </div>
          </div>
          
          {oddsLoading ? (
            <div className="text-white">Loading games...</div>
          ) : upcomingGames.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingGames.slice(0, 9).map((game: any, index: number) => (
                <GameCardComponent
                  key={game.id || index}
                  game={game}
                  onPick={handlePick}
                  onFade={handleFade}
                  isPicked={pickedGames.has(`${game.id}-${game.home_team}`) || 
                           pickedGames.has(`${game.id}-${game.away_team}`)}
                  isFaded={fadedGames.has(`${game.id}-${game.home_team}`) || 
                          fadedGames.has(`${game.id}-${game.away_team}`)}
                  recommendation={recommendations.find((r: any) => r.gameId === game.id)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8 text-center">
              <p className="text-gray-400">No {selectedSport} games available</p>
              <p className="text-sm text-gray-500 mt-2">Check back later for upcoming games</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default ActionStyleDashboard;
