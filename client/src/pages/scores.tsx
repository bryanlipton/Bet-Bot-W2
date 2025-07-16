import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar,
  Clock,
  Trophy,
  RefreshCw
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
}

export default function ScoresPage() {
  const [selectedSport, setSelectedSport] = useState("baseball_mlb");

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

  const formatGameDate = (timeString: string) => {
    try {
      const date = new Date(timeString);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      // Reset time for comparison
      const gameDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const tomorrowDate = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
      
      if (gameDate.getTime() === todayDate.getTime()) {
        return "Today";
      } else if (gameDate.getTime() === tomorrowDate.getTime()) {
        return "Tomorrow";
      } else {
        return date.toLocaleDateString([], { 
          month: 'short', 
          day: 'numeric',
          year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        });
      }
    } catch {
      return timeString;
    }
  };

  // Sport options matching the Odds tab
  const sports = [
    { key: "baseball_mlb", name: "MLB", active: selectedSport === "baseball_mlb" },
    { key: "americanfootball_nfl", name: "NFL", active: selectedSport === "americanfootball_nfl" },
    { key: "basketball_nba", name: "NBA", active: selectedSport === "basketball_nba" },
  ];

  // Convert API data to ScoreGame format
  const processScoresData = (data: any[]): ScoreGame[] => {
    if (!data) return [];
    
    return data.map((game: any) => {
      // Handle combined MLB API format (from complete-schedule endpoint)
      return {
        id: game.id || `mlb_${game.gameId}`,
        homeTeam: game.home_team || game.homeTeam,
        awayTeam: game.away_team || game.awayTeam,
        homeScore: game.home_score || game.homeScore,
        awayScore: game.away_score || game.awayScore,
        status: game.status || 'Scheduled',
        startTime: game.commence_time || game.startTime,
        inning: game.inning,
        sportKey: selectedSport
      };
    });
  };

  const scores = processScoresData(scoresData);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
          className="flex items-center gap-1"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Games */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Games & Scores
          </h2>
          <Badge variant="outline" className="ml-auto">
            {sports.find(s => s.key === selectedSport)?.name}
          </Badge>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="text-gray-600 dark:text-gray-400">Loading scores...</div>
          </div>
        ) : (
          <div className="space-y-4">
            {scores.map((game) => (
              <Card key={game.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-4">
                              <span className="font-medium text-gray-900 dark:text-white min-w-[180px]">
                                {game.awayTeam}
                              </span>
                              {game.awayScore !== undefined && (
                                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                  {game.awayScore}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="font-medium text-gray-900 dark:text-white min-w-[180px]">
                                {game.homeTeam}
                              </span>
                              {game.homeScore !== undefined && (
                                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                  {game.homeScore}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-right space-y-2">
                            {getStatusBadge(game.status)}
                            <div className="flex flex-col items-end gap-1 text-sm text-gray-500 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {formatGameDate(game.startTime)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {formatTime(game.startTime)}
                              </div>
                            </div>
                            {game.inning && game.status.toLowerCase() === 'live' && (
                              <div className="text-sm text-gray-600 dark:text-gray-300">
                                {game.inning} Inning
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Winner indicator for final games */}
                        {game.status.toLowerCase() === 'final' && game.homeScore !== undefined && game.awayScore !== undefined && (
                          <div className="flex items-center gap-2 text-sm">
                            <Trophy className="w-4 h-4 text-yellow-500" />
                            <span className="text-gray-600 dark:text-gray-400">
                              Winner: {game.homeScore > game.awayScore ? game.homeTeam : game.awayTeam}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
              </Card>
            ))}
            
            {scores.length === 0 && (
              <Card>
                <CardContent className="p-6 text-center">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No games scheduled for today
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}