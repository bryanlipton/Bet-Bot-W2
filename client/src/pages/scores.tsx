import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import { LiveGameModal } from "@/components/LiveGameModal";
import FootballLiveGameModal from "@/components/FootballLiveGameModal";
import { GameDetailsModal } from "@/components/GameDetailsModal";
import { getTeamColor } from "@/utils/teamLogos";
import { 
  Calendar,
  Clock,
  Trophy,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Play,
  Radio
} from "lucide-react";

interface ScoreGame {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  status: string;
  startTime: string;
  inning?: string;
  quarter?: string;
  clock?: string;
  sportKey: string;
  liveDetails?: {
    currentInning?: number;
    inningState?: string;
    balls?: number;
    strikes?: number;
    outs?: number;
  };
}

// Helper function to get Eastern Time date
const getEasternDate = (date: Date = new Date()) => {
  const easternTime = new Date(date.toLocaleString("en-US", {timeZone: "America/New_York"}));
  return easternTime.toDateString();
};

// Helper function to format date for display
const formatDateDisplay = (date: Date) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dateStr = date.toDateString();
  const todayStr = getEasternDate();
  const yesterdayStr = getEasternDate(yesterday);
  const tomorrowStr = getEasternDate(tomorrow);

  if (dateStr === todayStr) return "Today";
  if (dateStr === yesterdayStr) return "Yesterday";
  if (dateStr === tomorrowStr) return "Tomorrow";
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    weekday: 'short'
  });
};

// Helper function to get current week for football
const getCurrentWeek = (sport: string) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-based
  
  if (sport === 'americanfootball_nfl') {
    // NFL season typically starts first week of September
    if (month < 8) return 1; // Before September
    if (month > 11) return 18; // After season
    
    const septemberStart = new Date(year, 8, 1); // September 1
    const weeksSince = Math.floor((now - septemberStart) / (7 * 24 * 60 * 60 * 1000));
    return Math.min(Math.max(weeksSince + 1, 1), 18);
  } else if (sport === 'americanfootball_ncaaf') {
    // CFB season typically starts late August
    if (month < 7) return 1; // Before August
    if (month > 11) return 15; // After season
    
    const augustStart = new Date(year, 7, 20); // August 20
    const weeksSince = Math.floor((now - augustStart) / (7 * 24 * 60 * 60 * 1000));
    return Math.min(Math.max(weeksSince + 1, 1), 15);
  }
  
  return 1;
};

export default function ScoresPage() {
  const [selectedSport, setSelectedSport] = useState("baseball_mlb");
  
  // For football sports, use week-based navigation
  const [selectedWeek, setSelectedWeek] = useState(() => getCurrentWeek(selectedSport));
  
  // For baseball, use date-based navigation
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    return new Date(easternTime.getFullYear(), easternTime.getMonth(), easternTime.getDate());
  });
  
  const [selectedLiveGame, setSelectedLiveGame] = useState<{
    gameId: string;
    homeTeam: string;
    awayTeam: string;
    sport: string;
  } | null>(null);
  
  const [selectedScheduledGame, setSelectedScheduledGame] = useState<{
    gameId: string;
    homeTeam: string;
    awayTeam: string;
    startTime?: string;
    venue?: string;
    probablePitchers?: {
      home: string | null;
      away: string | null;
    };
  } | null>(null);

  // Update week when sport changes
  useEffect(() => {
    if (selectedSport.includes('football')) {
      setSelectedWeek(getCurrentWeek(selectedSport));
    }
  }, [selectedSport]);

  // Determine if current sport uses weeks or dates
  const isFootballSport = selectedSport.includes('football');

  // Navigation functions for date-based sports (MLB)
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    const now = new Date();
    const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    setSelectedDate(new Date(easternTime.getFullYear(), easternTime.getMonth(), easternTime.getDate()));
  };

  // Navigation functions for week-based sports (NFL/CFB)
  const goToPreviousWeek = () => {
    setSelectedWeek(Math.max(1, selectedWeek - 1));
  };

  const goToNextWeek = () => {
    const maxWeek = selectedSport === 'americanfootball_nfl' ? 18 : 15;
    setSelectedWeek(Math.min(maxWeek, selectedWeek + 1));
  };

  const goToCurrentWeek = () => {
    setSelectedWeek(getCurrentWeek(selectedSport));
  };

  // Helper function to format date for API
  function formatDateForAPI(date: Date): string {
    const easternDate = new Date(date.toLocaleString("en-US", {timeZone: "America/New_York"}));
    const year = easternDate.getFullYear();
    const month = String(easternDate.getMonth() + 1).padStart(2, '0');
    const day = String(easternDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Dynamic query based on sport type
  const { data: scoresData, isLoading, refetch } = useQuery({
    queryKey: isFootballSport 
      ? [selectedSport, 'scores', selectedWeek]
      : ['/api/mlb/scores', formatDateForAPI(selectedDate)],
    queryFn: async ({ queryKey }) => {
      let url;
      
      if (isFootballSport) {
        const sport = queryKey[0] as string;
        const week = queryKey[2] as number;
        
        if (sport === 'americanfootball_nfl') {
          url = `/api/nfl/scores?week=${week}`;
        } else if (sport === 'americanfootball_ncaaf') {
          url = `/api/cfb/scores?week=${week}`;
        } else {
          throw new Error('Unsupported football sport');
        }
      } else {
        // MLB uses date-based API
        const baseUrl = queryKey[0] as string;
        const dateParam = queryKey[1] as string;
        url = `${baseUrl}?date=${dateParam}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    },
    refetchInterval: 15000,
    enabled: isFootballSport ? !!selectedWeek : !!selectedDate,
  });

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('final') || statusLower.includes('completed') || statusLower.includes('game over')) {
      return <Badge className="bg-blue-600 text-white">Final</Badge>;
    }
    
    if (statusLower.includes('in progress') || statusLower.includes('live')) {
      return <Badge className="bg-green-600 text-white">Live</Badge>;
    }
    
    if (statusLower.includes('scheduled') || statusLower.includes('warmup') || statusLower.includes('pre-game')) {
      return <Badge className="bg-gray-600 text-white">Scheduled</Badge>;
    }
    
    return <Badge variant="outline">{status}</Badge>;
  };

  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timeString;
    }
  };

  // Sort and filter games
  const sortedGames = useMemo(() => {
    if (!scoresData) return [];

    const dayGames = scoresData.games || [];

    const processedGames: ScoreGame[] = dayGames.map((game: any) => {
      const homeScore = game.home_score ?? game.homeScore ?? game.scores?.home ?? 
                       (game.linescore && game.linescore.teams?.home?.runs) ?? undefined;
      const awayScore = game.away_score ?? game.awayScore ?? game.scores?.away ?? 
                       (game.linescore && game.linescore.teams?.away?.runs) ?? undefined;
      
      let status = game.status || 'Scheduled';
      if (game.status_type) status = game.status_type;
      if (game.abstractGameState) status = game.abstractGameState;
      if (game.detailedState) status = game.detailedState;
      
      // Handle both baseball innings and football quarters
      let inning = game.inning;
      let quarter = game.quarter;
      let clock = game.clock;
      
      if (game.linescore?.currentInning && game.linescore?.inningState) {
        inning = `${game.linescore.inningState} ${game.linescore.currentInning}`;
      }
      
      const liveDetails = game.linescore ? {
        currentInning: game.linescore.currentInning,
        inningState: game.linescore.inningState,
        balls: game.linescore.balls,
        strikes: game.linescore.strikes,
        outs: game.linescore.outs
      } : undefined;
      
      let finalHomeScore = homeScore;
      let finalAwayScore = awayScore;
      
      if (status.toLowerCase().includes('final') && status.toLowerCase().includes('tied')) {
        const scoreMatch = status.match(/(\d+)-(\d+)/);
        if (scoreMatch) {
          finalAwayScore = parseInt(scoreMatch[1]);
          finalHomeScore = parseInt(scoreMatch[2]);
        } else {
          finalHomeScore = finalAwayScore = 0;
        }
      }
      
      return {
        id: game.id || `${selectedSport}_${game.gameId}`,
        homeTeam: game.home_team || game.homeTeam,
        awayTeam: game.away_team || game.awayTeam,
        homeScore: finalHomeScore,
        awayScore: finalAwayScore,
        status: status,
        startTime: game.commence_time || game.startTime,
        inning: inning,
        quarter: quarter,
        clock: clock,
        sportKey: selectedSport,
        liveDetails: liveDetails
      };
    });

    // Categorize games
    const liveGames: ScoreGame[] = [];
    const upcomingGames: ScoreGame[] = [];
    const finalGames: ScoreGame[] = [];

    processedGames.forEach((game: ScoreGame) => {
      const status = game.status.toLowerCase();
      
      if (status.includes('final') || status.includes('completed') || status.includes('game over')) {
        finalGames.push(game);
      } 
      else if ((status.includes('in progress') || status.includes('live')) && 
               (game.homeScore !== undefined || game.awayScore !== undefined)) {
        liveGames.push(game);
      } 
      else {
        upcomingGames.push(game);
      }
    });

    liveGames.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    upcomingGames.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    finalGames.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    return [...liveGames, ...upcomingGames, ...finalGames];
  }, [scoresData, selectedDate, selectedWeek, selectedSport]);

  // Updated sport options - ADD CFB
  const sports = [
    { key: "baseball_mlb", name: "MLB", active: selectedSport === "baseball_mlb" },
    { key: "americanfootball_nfl", name: "NFL", active: selectedSport === "americanfootball_nfl" },
    { key: "basketball_nba", name: "NBA", active: selectedSport === "basketball_nba" },
    { key: "americanfootball_ncaaf", name: "CFB", active: selectedSport === "americanfootball_ncaaf" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        
        {/* Header with Title */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Scores</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {/* UPDATED NAVIGATION - Dynamic based on sport */}
        <div className="relative mb-6">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-4">
              <Button
                onClick={isFootballSport ? goToPreviousWeek : goToPreviousDay}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                {isFootballSport ? 'Previous Week' : 'Previous'}
              </Button>
              
              <div className="text-center mx-8">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {isFootballSport ? `Week ${selectedWeek}` : formatDateDisplay(selectedDate)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {isFootballSport 
                    ? `${selectedSport === 'americanfootball_nfl' ? 'NFL' : 'College Football'} Season`
                    : selectedDate.toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })
                  }
                </div>
              </div>
              
              <Button
                onClick={isFootballSport ? goToNextWeek : goToNextDay}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                {isFootballSport ? 'Next Week' : 'Next'}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Go to Current button */}
          {(isFootballSport ? selectedWeek !== getCurrentWeek(selectedSport) : selectedDate.toDateString() !== new Date().toDateString()) && (
            <div className="flex justify-center mt-3">
              <Button
                onClick={isFootballSport ? goToCurrentWeek : goToToday}
                variant="outline"
                size="sm"
                className="text-blue-600 dark:text-blue-400"
              >
                {isFootballSport ? 'Go to Current Week' : 'Go to Today'}
              </Button>
            </div>
          )}
        </div>

        {/* Sport Selection - UPDATED with CFB */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {sports.map((sport) => (
              <Button
                key={sport.key}
                variant={sport.active ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSport(sport.key)}
                className={sport.active ? "bg-blue-600 text-white" : ""}
              >
                {sport.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Empty State - UPDATED */}
        {!isLoading && sortedGames.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Games Found</h3>
            <p className="text-gray-500 dark:text-gray-400">
              No games scheduled for {isFootballSport ? `Week ${selectedWeek}` : formatDateDisplay(selectedDate)} - {sports.find(s => s.key === selectedSport)?.name || selectedSport.replace('_', ' ').toUpperCase()}.
            </p>
          </div>
        )}

        {/* Game Sections by Status */}
        <div className="space-y-6">
          {/* Live Games Section */}
          {sortedGames.filter(game => {
            const now = new Date();
            const gameStartTime = new Date(game.startTime);
            const hasStarted = now >= gameStartTime;
            
            const status = game.status.toLowerCase();
            const isFinished = status.includes('final') || status.includes('completed') || status.includes('game over');
            const showsLiveStatus = status.includes('live') || status.includes('progress') || status.includes('in progress') || 
                                   status.includes('top ') || status.includes('bot ') || status.includes('middle ') || status.includes('end ');
            return (hasStarted || showsLiveStatus) && !isFinished;
          }).length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                Live Games
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedGames.filter(game => {
                  const now = new Date();
                  const gameStartTime = new Date(game.startTime);
                  const hasStarted = now >= gameStartTime;
                  
                  const status = game.status.toLowerCase();
                  const isFinished = status.includes('final') || status.includes('completed') || status.includes('game over');
                  const showsLiveStatus = status.includes('live') || status.includes('progress') || status.includes('in progress') || 
                                         status.includes('top ') || status.includes('bot ') || status.includes('middle ') || status.includes('end ');
                  return (hasStarted || showsLiveStatus) && !isFinished;
                }).map((game) => (
                  <ScoreGameCard 
                    key={game.id} 
                    game={game} 
                    onLiveGameClick={(gameInfo) => setSelectedLiveGame({...gameInfo, sport: selectedSport})} 
                    onScheduledGameClick={setSelectedScheduledGame} 
                  />
                ))}
              </div>
            </div>
          )}

          {/* Scheduled Games Section */}
          {sortedGames.filter(game => {
            const now = new Date();
            const gameStartTime = new Date(game.startTime);
            const hasStarted = now >= gameStartTime;
            
            const status = game.status.toLowerCase();
            const isFinished = status.includes('final') || status.includes('completed') || status.includes('game over');
            const showsLiveStatus = status.includes('live') || status.includes('progress') || status.includes('in progress') || 
                                   status.includes('top ') || status.includes('bot ') || status.includes('middle ') || status.includes('end ');
            return !hasStarted && !showsLiveStatus && !isFinished;
          }).length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                Scheduled Games
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedGames.filter(game => {
                  const now = new Date();
                  const gameStartTime = new Date(game.startTime);
                  const hasStarted = now >= gameStartTime;
                  
                  const status = game.status.toLowerCase();
                  const isFinished = status.includes('final') || status.includes('completed') || status.includes('game over');
                  const showsLiveStatus = status.includes('live') || status.includes('progress') || status.includes('in progress') || 
                                         status.includes('top ') || status.includes('bot ') || status.includes('middle ') || status.includes('end ');
                  return !hasStarted && !showsLiveStatus && !isFinished;
                }).map((game) => (
                  <ScoreGameCard 
                    key={game.id} 
                    game={game} 
                    onLiveGameClick={(gameInfo) => setSelectedLiveGame({...gameInfo, sport: selectedSport})} 
                    onScheduledGameClick={setSelectedScheduledGame} 
                  />
                ))}
              </div>
            </div>
          )}

          {/* Finished Games Section */}
          {sortedGames.filter(game => {
            const status = game.status.toLowerCase();
            return status.includes('final') || status.includes('completed') || status.includes('game over');
          }).length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                Finished Games
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedGames.filter(game => {
                  const status = game.status.toLowerCase();
                  return status.includes('final') || status.includes('completed') || status.includes('game over');
                }).map((game) => (
                  <ScoreGameCard 
                    key={game.id} 
                    game={game} 
                    onLiveGameClick={(gameInfo) => setSelectedLiveGame({...gameInfo, sport: selectedSport})} 
                    onScheduledGameClick={setSelectedScheduledGame} 
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
      
      {/* UPDATED MODALS - Use different modals based on sport */}
      {selectedLiveGame && (
        <>
          {selectedLiveGame.sport.includes('football') ? (
            <FootballLiveGameModal
              gameId={selectedLiveGame.gameId}
              homeTeam={selectedLiveGame.homeTeam}
              awayTeam={selectedLiveGame.awayTeam}
              sport={selectedLiveGame.sport}
              isOpen={!!selectedLiveGame}
              onClose={() => setSelectedLiveGame(null)}
            />
          ) : (
            <LiveGameModal
              gameId={selectedLiveGame.gameId}
              homeTeam={selectedLiveGame.homeTeam}
              awayTeam={selectedLiveGame.awayTeam}
              isOpen={!!selectedLiveGame}
              onClose={() => setSelectedLiveGame(null)}
            />
          )}
        </>
      )}
      
      {/* Scheduled Game Details Modal */}
      {selectedScheduledGame && (
        <GameDetailsModal
          gameId={selectedScheduledGame.gameId}
          homeTeam={selectedScheduledGame.homeTeam}
          awayTeam={selectedScheduledGame.awayTeam}
          isOpen={!!selectedScheduledGame}
          onClose={() => setSelectedScheduledGame(null)}
        />
      )}
    </div>
  );
}

// UPDATED Score Game Card Component
function ScoreGameCard({ 
  game, 
  onLiveGameClick,
  onScheduledGameClick 
}: { 
  game: ScoreGame; 
  onLiveGameClick: (gameInfo: { gameId: string; homeTeam: string; awayTeam: string }) => void;
  onScheduledGameClick: (gameInfo: { gameId: string; homeTeam: string; awayTeam: string; startTime?: string; venue?: string; probablePitchers?: { home: string | null; away: string | null; } }) => void;
}) {
  const getStatusBadge = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('final') || lowerStatus.includes('completed') || lowerStatus.includes('game over')) {
      return <Badge className="bg-blue-600 text-white">Final</Badge>;
    }
    
    const now = new Date();
    const gameStartTime = new Date(game.startTime);
    const hasStarted = now >= gameStartTime;
    
    const showsLiveStatus = lowerStatus.includes('live') || lowerStatus.includes('progress') || lowerStatus.includes('in progress') || 
                           lowerStatus.includes('top ') || lowerStatus.includes('bot ') || lowerStatus.includes('middle ') || lowerStatus.includes('end ');
    
    if (hasStarted || showsLiveStatus) {
      return <Badge className="bg-green-600 text-white">Live</Badge>;
    } else {
      return <Badge className="bg-gray-600 text-white">Scheduled</Badge>;
    }
  };

  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timeString;
    }
  };

  const isFinished = game.status.toLowerCase().includes('final') || 
                     game.status.toLowerCase().includes('completed') || 
                     game.status.toLowerCase().includes('game over');

  const now = new Date();
  const gameStartTime = new Date(game.startTime);
  const hasStarted = now >= gameStartTime;
  
  const status = game.status.toLowerCase();
  const showsLiveStatus = status.includes('live') || status.includes('progress') || status.includes('in progress') || 
                         status.includes('top ') || status.includes('bot ') || status.includes('middle ') || status.includes('end ');
  const isLive = (hasStarted || showsLiveStatus) && !isFinished;

  const awayWon = isFinished && game.awayScore !== undefined && game.homeScore !== undefined && game.awayScore > game.homeScore;
  const homeWon = isFinished && game.awayScore !== undefined && game.homeScore !== undefined && game.homeScore > game.awayScore;
  const isTied = isFinished && game.awayScore !== undefined && game.homeScore !== undefined && game.awayScore === game.homeScore;

  const formatInning = (inning: string | undefined) => {
    if (!inning) return undefined;
    
    if (inning.includes('T') || inning.includes('B')) {
      const number = inning.replace(/[TB]/g, '');
      const half = inning.includes('T') ? 'T' : 'B';
      return `${half}${number}`;
    }
    
    if (inning.includes('E')) {
      const number = inning.replace(/E/g, '');
      return `E${number}`;
    }
    
    if (inning.includes('M')) {
      const number = inning.replace(/M/g, '');
      return `M${number}`;
    }
    
    return inning;
  };

  const handleCardClick = () => {
    if (isLive) {
      onLiveGameClick({
        gameId: game.id,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam
      });
    } else if (!isFinished) {
      onScheduledGameClick({
        gameId: game.id,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        startTime: game.startTime,
        venue: undefined,
        probablePitchers: {
          home: null,
          away: null
        }
      });
    }
  };

  // Only use live data query for MLB games
  const shouldUseLiveData = isLive && game.sportKey === 'baseball_mlb';
  
  const { data: liveData } = useQuery({
    queryKey: [`/api/mlb/game/${game.id}/live`, game.homeTeam, game.awayTeam],
    queryFn: async () => {
      const response = await fetch(`/api/mlb/game/${game.id.replace(/[^0-9]/g, '')}/live?homeTeam=${encodeURIComponent(game.homeTeam)}&awayTeam=${encodeURIComponent(game.awayTeam)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    enabled: shouldUseLiveData,
    refetchInterval: 5000,
    retry: false,
  });

  const isActuallyLive = (liveData && liveData.status && liveData.status.inProgress) || 
                         (isLive && (game.inning || game.quarter) && (game.homeScore !== undefined || game.awayScore !== undefined));

  return (
    <Card 
      className={`bg-white dark:bg-gray-800 hover:shadow-md transition-shadow ${(isLive || !isFinished) ? 'cursor-pointer' : ''}`}
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        {isActuallyLive ? (
          /* Live Game Format */
          <div className="space-y-2">
            {/* Away Team */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full shadow-sm" 
                  style={{ backgroundColor: getTeamColor(game.awayTeam) }}
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {liveData?.teams?.away?.abbreviation || game.awayTeam}
                </span>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {liveData?.score?.away || game.awayScore || 0}
              </span>
            </div>
            
            {/* Home Team */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full shadow-sm" 
                  style={{ backgroundColor: getTeamColor(game.homeTeam) }}
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {liveData?.teams?.home?.abbreviation || game.homeTeam}
                </span>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {liveData?.score?.home || game.homeScore || 0}
              </span>
            </div>

            {/* Game Status - Show inning for baseball, quarter for football */}
            <div className="flex items-center justify-between pt-1 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-red-600 font-medium">
                {game.sportKey === 'baseball_mlb' ? (
                  liveData?.inning ? `${liveData.inning.state === 'Top' ? 'Top' : 'Bot'} ${liveData.inning.current}` : 
                  game.inning ? formatInning(game.inning) : 'Live'
                ) : (
                  game.quarter ? `${game.quarter} ${game.clock || ''}` : 'Live'
                )}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {game.sportKey === 'baseball_mlb' && liveData?.count ? `${liveData.count.outs} Outs` : ''}
              </div>
            </div>
          </div>
        ) : (
          /* Regular/Scheduled Game Format */
          <div className="flex items-center justify-between">
            {/* Left side - Teams */}
            <div className="flex-1 space-y-2">
              {/* Away Team */}
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full shadow-sm" 
                  style={{ backgroundColor: getTeamColor(game.awayTeam) }}
                />
                <span className={`text-sm font-medium ${
                  isFinished && homeWon && !isTied 
                    ? "text-gray-400 dark:text-gray-500" 
                    : "text-gray-900 dark:text-white"
                }`}>
                  {game.awayTeam}
                </span>
              </div>
              
              {/* Home Team */}
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full shadow-sm" 
                  style={{ backgroundColor: getTeamColor(game.homeTeam) }}
                />
                <span className={`text-sm font-medium ${
                  isFinished && awayWon && !isTied 
                    ? "text-gray-400 dark:text-gray-500" 
                    : "text-gray-900 dark:text-white"
                }`}>
                  {game.homeTeam}
                </span>
              </div>
            </div>

            {/* Right side - Scores and Status */}
            <div className="flex items-center gap-4">
              {/* Scores */}
              <div className="text-right space-y-2">
                {/* Away Score */}
                <div className={`text-lg font-bold ${
                  isFinished && homeWon && !isTied 
                    ? "text-gray-400 dark:text-gray-500" 
                    : "text-gray-900 dark:text-white"
                }`}>
                  {game.awayScore !== undefined ? game.awayScore : '-'}
                </div>
                
                {/* Home Score */}
                <div className={`text-lg font-bold ${
                  isFinished && awayWon && !isTied 
                    ? "text-gray-400 dark:text-gray-500" 
                    : "text-gray-900 dark:text-white"
                }`}>
                  {game.homeScore !== undefined ? game.homeScore : '-'}
                </div>
              </div>

              {/* Game Status */}
              <div className="text-right space-y-1">
                {/* Status indicator */}
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {isFinished ? (
                    <span className="text-red-600 dark:text-red-400 font-bold">F</span>
                  ) : isActuallyLive && (liveData?.inning || game.inning || game.quarter) ? (
                    <div className="flex items-center gap-1">
                      <Radio className="w-3 h-3 text-green-500 animate-pulse" />
                      <span className="text-orange-600 dark:text-orange-400 font-bold">
                        {game.sportKey === 'baseball_mlb' ? (
                          liveData?.inning ? 
                            `${liveData.inning.state === 'Top' ? 'T' : 'B'}${liveData.inning.current}` : 
                            formatInning(game.inning)
                        ) : (
                          game.quarter ? `${game.quarter}` : 'Live'
                        )}
                      </span>
                    </div>
                  ) : !isFinished && !isActuallyLive ? (
                    <span className="text-gray-500 dark:text-gray-400">
                      {formatTime(game.startTime)}
                    </span>
                  ) : null}
                </div>
                
                {/* Live details */}
                {isActuallyLive && game.sportKey === 'baseball_mlb' && (liveData?.count || game.liveDetails) && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <span>
                      {liveData?.count ? 
                        `${liveData.count.balls}-${liveData.count.strikes}, ${liveData.count.outs} out${liveData.count.outs !== 1 ? 's' : ''}` :
                        game.liveDetails ? 
                          `${game.liveDetails.balls || 0}-${game.liveDetails.strikes || 0}, ${game.liveDetails.outs || 0} out${game.liveDetails.outs !== 1 ? 's' : ''}` :
                          ''
                      }
                    </span>
                  </div>
                )}
                
                {/* Click to view live indicator */}
                {isActuallyLive && (
                  <div className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <Play className="w-3 h-3" />
                    <span>Click for live</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
