import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ActionStyleHeader from "@/components/ActionStyleHeader";
import Footer from "@/components/Footer";
import { getTeamColor } from "@/utils/teamLogos";
import { 
  Calendar,
  Clock,
  Trophy,
  RefreshCw,
  ChevronLeft,
  ChevronRight
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

export default function ScoresPage() {
  const [selectedSport, setSelectedSport] = useState("baseball_mlb");
  const [darkMode, setDarkMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    document.documentElement.classList.toggle('dark', newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
  };

  // Navigation functions
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
    setSelectedDate(new Date());
  };

  // Fetch real scores data based on selected sport
  const { data: scoresData, isLoading, refetch } = useQuery({
    queryKey: selectedSport === 'baseball_mlb' ? ['/api/mlb/complete-schedule'] : ['/api/scores', selectedSport],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'live':
      case 'in progress':
        return <Badge className="bg-green-600 text-white">Live</Badge>;
      case 'final':
        return <Badge className="bg-blue-600 text-white">Final</Badge>;
      case 'scheduled':
        return <Badge className="bg-gray-600 text-white">Scheduled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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

  // Sort and filter games by selected date and status
  const sortedGames = useMemo(() => {
    if (!scoresData) return [];

    const selectedDateStr = selectedDate.toDateString();
    
    // Filter games for selected date
    const dayGames = scoresData.filter((game: any) => {
      const gameDate = new Date(game.commence_time || game.startTime);
      return gameDate.toDateString() === selectedDateStr;
    });

    // Convert to ScoreGame format
    const processedGames: ScoreGame[] = dayGames.map((game: any) => {
      // Handle different score field names from different APIs
      const homeScore = game.home_score ?? game.homeScore ?? game.scores?.home ?? 
                       (game.linescore && game.linescore.teams?.home?.runs) ?? undefined;
      const awayScore = game.away_score ?? game.awayScore ?? game.scores?.away ?? 
                       (game.linescore && game.linescore.teams?.away?.runs) ?? undefined;
      
      // Enhanced status detection
      let status = game.status || 'Scheduled';
      if (game.status_type) status = game.status_type;
      if (game.abstractGameState) status = game.abstractGameState;
      if (game.detailedState) status = game.detailedState;
      
      // Enhanced inning information
      let inning = game.inning;
      if (game.linescore?.currentInning && game.linescore?.inningState) {
        inning = `${game.linescore.inningState} ${game.linescore.currentInning}`;
      }
      
      // Live game details for enhanced display
      const liveDetails = game.linescore ? {
        currentInning: game.linescore.currentInning,
        inningState: game.linescore.inningState,
        balls: game.linescore.balls,
        strikes: game.linescore.strikes,
        outs: game.linescore.outs
      } : undefined;
      
      // Handle special cases for scores
      let finalHomeScore = homeScore;
      let finalAwayScore = awayScore;
      
      // For All-Star game or special events that show "Final: Tied" etc.
      if (status.toLowerCase().includes('final') && status.toLowerCase().includes('tied')) {
        // Try to extract actual scores from the status if available
        const scoreMatch = status.match(/(\d+)-(\d+)/);
        if (scoreMatch) {
          finalAwayScore = parseInt(scoreMatch[1]);
          finalHomeScore = parseInt(scoreMatch[2]);
        } else {
          // For tied games without explicit scores, show as tied
          finalHomeScore = finalAwayScore = 0; // or could be undefined to show "Tied"
        }
      }
      
      return {
        id: game.id || `mlb_${game.gameId}`,
        homeTeam: game.home_team || game.homeTeam,
        awayTeam: game.away_team || game.awayTeam,
        homeScore: finalHomeScore,
        awayScore: finalAwayScore,
        status: status,
        startTime: game.commence_time || game.startTime,
        inning: inning,
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
      if (status.includes('live') || status.includes('progress') || game.inning) {
        liveGames.push(game);
      } else if (status === 'final' || status.includes('final')) {
        finalGames.push(game);
      } else {
        upcomingGames.push(game);
      }
    });

    // Sort each category
    // Live games: by time remaining (we'll use a simple time-based sort for now)
    liveGames.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    
    // Upcoming games: by start time (earliest first)
    upcomingGames.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    
    // Final games: by end time (oldest to most recent)
    finalGames.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    return [...liveGames, ...upcomingGames, ...finalGames];
  }, [scoresData, selectedDate]);

  // Sport options matching the Odds tab
  const sports = [
    { key: "baseball_mlb", name: "MLB", active: selectedSport === "baseball_mlb" },
    { key: "americanfootball_nfl", name: "NFL", active: selectedSport === "americanfootball_nfl" },
    { key: "basketball_nba", name: "NBA", active: selectedSport === "basketball_nba" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ActionStyleHeader darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        
        {/* Header with Title */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Live Scores</h1>
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

        {/* Date Navigation */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <Button
            onClick={goToPreviousDay}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatDateDisplay(selectedDate)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {selectedDate.toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </div>
            </div>
            
            {selectedDate.toDateString() !== new Date().toDateString() && (
              <Button
                onClick={goToToday}
                variant="outline"
                size="sm"
                className="text-blue-600 dark:text-blue-400"
              >
                Today
              </Button>
            )}
          </div>

          <Button
            onClick={goToNextDay}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Sport Selection */}
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

        {/* Empty State */}
        {!isLoading && sortedGames.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Games Found</h3>
            <p className="text-gray-500 dark:text-gray-400">
              No games scheduled for {formatDateDisplay(selectedDate)} - {selectedSport === 'baseball_mlb' ? 'MLB' : selectedSport.replace('_', ' ').toUpperCase()}.
            </p>
          </div>
        )}

        {/* Game Sections by Status */}
        <div className="space-y-6">
          {/* Live Games Section */}
          {sortedGames.filter(game => {
            const status = game.status.toLowerCase();
            return status.includes('live') || status.includes('progress') || game.inning;
          }).length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                Live Games
              </h2>
              <div className="space-y-4">
                {sortedGames.filter(game => {
                  const status = game.status.toLowerCase();
                  return status.includes('live') || status.includes('progress') || game.inning;
                }).map((game) => (
                  <ScoreGameCard key={game.id} game={game} />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Games Section */}
          {sortedGames.filter(game => {
            const status = game.status.toLowerCase();
            return !status.includes('live') && !status.includes('progress') && !game.inning && !status.includes('final');
          }).length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                Upcoming Games
              </h2>
              <div className="space-y-4">
                {sortedGames.filter(game => {
                  const status = game.status.toLowerCase();
                  return !status.includes('live') && !status.includes('progress') && !game.inning && !status.includes('final');
                }).map((game) => (
                  <ScoreGameCard key={game.id} game={game} />
                ))}
              </div>
            </div>
          )}

          {/* Final Games Section */}
          {sortedGames.filter(game => {
            const status = game.status.toLowerCase();
            return status.includes('final');
          }).length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-blue-500" />
                Final Games
              </h2>
              <div className="space-y-4">
                {sortedGames.filter(game => {
                  const status = game.status.toLowerCase();
                  return status.includes('final');
                }).map((game) => (
                  <ScoreGameCard key={game.id} game={game} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

// Score Game Card Component
function ScoreGameCard({ game }: { game: ScoreGame }) {
  const getStatusBadge = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('live') || lowerStatus.includes('progress') || game.inning) {
      return <Badge className="bg-green-600 text-white">Live</Badge>;
    } else if (lowerStatus.includes('final')) {
      return <Badge className="bg-blue-600 text-white">Final</Badge>;
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

  const isFinished = game.status.toLowerCase().includes('final');

  return (
    <Card className="bg-white dark:bg-gray-800">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 space-y-2">
            {/* Away Team */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full shadow-sm" 
                  style={{ backgroundColor: getTeamColor(game.awayTeam) }}
                />
                <span className="font-medium text-gray-900 dark:text-white">
                  {game.awayTeam}
                </span>
              </div>
              {isFinished && game.awayScore !== undefined && (
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {game.awayScore}
                </span>
              )}
            </div>
            
            {/* Home Team */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full shadow-sm" 
                  style={{ backgroundColor: getTeamColor(game.homeTeam) }}
                />
                <span className="font-medium text-gray-900 dark:text-white">
                  {game.homeTeam}
                </span>
              </div>
              {isFinished && game.homeScore !== undefined && (
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {game.homeScore}
                </span>
              )}
            </div>
            
            {/* Live scores for ongoing games */}
            {!isFinished && (game.awayScore !== undefined || game.homeScore !== undefined) && (
              <div className="space-y-3 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                {/* Current Score */}
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-500 dark:text-gray-400">{game.awayTeam}</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {game.awayScore || 0}
                    </div>
                  </div>
                  <div className="text-lg text-gray-400">-</div>
                  <div className="text-center">
                    <div className="text-sm text-gray-500 dark:text-gray-400">{game.homeTeam}</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {game.homeScore || 0}
                    </div>
                  </div>
                </div>
                
                {/* Live Game Details */}
                {game.liveDetails && (
                  <div className="flex items-center justify-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                    {game.liveDetails.currentInning && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Inning:</span>
                        <span>{game.liveDetails.inningState} {game.liveDetails.currentInning}</span>
                      </div>
                    )}
                    {game.liveDetails.outs !== undefined && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Outs:</span>
                        <span>{game.liveDetails.outs}</span>
                      </div>
                    )}
                    {(game.liveDetails.balls !== undefined || game.liveDetails.strikes !== undefined) && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Count:</span>
                        <span>{game.liveDetails.balls || 0}-{game.liveDetails.strikes || 0}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Special status for tied/special games */}
            {isFinished && game.status.toLowerCase().includes('tied') && (game.homeScore === undefined || game.awayScore === undefined) && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                  {game.status}
                </div>
              </div>
            )}
          </div>
          
          <div className="text-right space-y-2 ml-6">
            {getStatusBadge(game.status)}
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {game.inning || formatTime(game.startTime)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}