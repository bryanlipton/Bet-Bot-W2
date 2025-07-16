import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar,
  Clock,
  Trophy
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
  const [location] = useLocation();

  // Navigation tabs
  const navigationTabs = [
    { path: "/", name: "Odds", active: location === "/" },
    { path: "/scores", name: "Scores", active: location === "/scores" },
    { path: "/my-picks", name: "My Picks", active: location === "/my-picks" },
  ];

  // Fetch scores data (you can extend this to use real API)
  const { data: scoresData, isLoading } = useQuery({
    queryKey: ['/api/mlb/scores'],
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

  // Mock scores data for demonstration
  const mockScores: ScoreGame[] = [
    {
      id: "1",
      homeTeam: "Chicago Cubs",
      awayTeam: "Boston Red Sox",
      homeScore: 4,
      awayScore: 7,
      status: "Final",
      startTime: "2025-07-16T19:20:00Z",
      inning: "9th",
      sportKey: "baseball_mlb"
    },
    {
      id: "2",
      homeTeam: "New York Mets",
      awayTeam: "Cincinnati Reds",
      homeScore: 2,
      awayScore: 1,
      status: "Live",
      startTime: "2025-07-16T23:10:00Z",
      inning: "7th",
      sportKey: "baseball_mlb"
    },
    {
      id: "3",
      homeTeam: "Miami Marlins",
      awayTeam: "Kansas City Royals",
      homeScore: 0,
      awayScore: 0,
      status: "Scheduled",
      startTime: "2025-07-17T00:10:00Z",
      sportKey: "baseball_mlb"
    }
  ];

  const scores = scoresData || mockScores;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Top Navigation Bar */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Scores
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Live scores and game results
            </p>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex items-center px-6">
          {navigationTabs.map((tab) => (
            <Link key={tab.path} href={tab.path}>
              <button
                className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors ${
                  tab.active
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {tab.name}
              </button>
            </Link>
          ))}
        </div>
      </div>

      <div className="px-6 space-y-6">
        {/* Today's Games */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Today's Games
            </h2>
            <Badge variant="outline" className="ml-auto">
              MLB
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
                            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                              <Clock className="w-4 h-4" />
                              {formatTime(game.startTime)}
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
    </div>
  );
}