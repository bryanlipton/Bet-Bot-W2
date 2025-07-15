import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Calendar, Clock, Users, TrendingUp } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface LiveGame {
  gamePk: number;
  gameDate: string;
  status: { detailedState: string };
  teams: {
    home: {
      team: { name: string; id: number };
      probablePitcher?: { fullName: string; id: number };
    };
    away: {
      team: { name: string; id: number };
      probablePitcher?: { fullName: string; id: number };
    };
  };
  venue: { name: string };
}

interface LivePrediction {
  game: {
    homeTeam: string;
    awayTeam: string;
    gameDate: string;
    probableStarters: {
      home: string;
      away: string;
    };
  };
  prediction: {
    homeWinProbability: number;
    awayWinProbability: number;
    overProbability: number;
    underProbability: number;
    predictedTotal: number;
    confidence: number;
  };
  starterStats: {
    home: any;
    away: any;
  };
}

export function LiveMLBGames() {
  const [games, setGames] = useState<LiveGame[]>([]);
  const [predictions, setPredictions] = useState<{ [gameId: number]: LivePrediction }>({});
  const [loading, setLoading] = useState(false);
  const [updating2025Data, setUpdating2025Data] = useState(false);

  const fetchTodaysGames = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/baseball/todays-games');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setGames(data);
    } catch (error) {
      console.error('Failed to fetch today\'s games:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPrediction = async (gameId: number) => {
    try {
      const response = await fetch(`/api/baseball/live-prediction/${gameId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setPredictions(prev => ({ ...prev, [gameId]: data }));
    } catch (error) {
      console.error(`Failed to get prediction for game ${gameId}:`, error);
    }
  };

  const update2025Data = async () => {
    setUpdating2025Data(true);
    try {
      const response = await fetch('/api/baseball/update-2025-data', { method: 'POST' });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      await response.json();
      alert('2025 season data updated successfully! Model now includes current season performance.');
    } catch (error) {
      console.error('Failed to update 2025 data:', error);
      alert('Failed to update 2025 data. Please try again.');
    } finally {
      setUpdating2025Data(false);
    }
  };

  useEffect(() => {
    fetchTodaysGames();
  }, []);

  const formatGameTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today's MLB Games
          </CardTitle>
          <CardDescription>
            Live games with AI predictions and probable starters
          </CardDescription>
          <div className="flex gap-2">
            <Button onClick={fetchTodaysGames} disabled={loading} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Games
            </Button>
            <Button onClick={update2025Data} disabled={updating2025Data} variant="outline" size="sm">
              <TrendingUp className={`h-4 w-4 mr-2 ${updating2025Data ? 'animate-spin' : ''}`} />
              Update 2025 Data
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {games.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {loading ? 'Loading today\'s games...' : 'No games scheduled for today'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {games.map((game) => {
                const prediction = predictions[game.gamePk];
                
                return (
                  <Card key={game.gamePk} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {/* Game Header */}
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <h3 className="font-semibold text-lg">
                              {game.teams.away.team.name} @ {game.teams.home.team.name}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {formatGameTime(game.gameDate)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {game.venue.name}
                              </span>
                            </div>
                          </div>
                          <Badge variant={game.status.detailedState === 'Scheduled' ? 'default' : 'secondary'}>
                            {game.status.detailedState}
                          </Badge>
                        </div>

                        {/* Probable Starters */}
                        <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium">Away Starter</p>
                            <p className="text-sm text-muted-foreground">
                              {game.teams.away.probablePitcher?.fullName || 'TBD'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Home Starter</p>
                            <p className="text-sm text-muted-foreground">
                              {game.teams.home.probablePitcher?.fullName || 'TBD'}
                            </p>
                          </div>
                        </div>

                        {/* Prediction Section */}
                        {prediction ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                                  {prediction.game.awayTeam}
                                </p>
                                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                                  {(prediction.prediction.awayWinProbability * 100).toFixed(1)}%
                                </p>
                              </div>
                              <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                  {prediction.game.homeTeam}
                                </p>
                                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                  {(prediction.prediction.homeWinProbability * 100).toFixed(1)}%
                                </p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2 text-center text-sm">
                              <div>
                                <p className="text-muted-foreground">Predicted Total</p>
                                <p className="font-medium">{prediction.prediction.predictedTotal.toFixed(1)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Over</p>
                                <p className="font-medium">{(prediction.prediction.overProbability * 100).toFixed(1)}%</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Confidence</p>
                                <p className="font-medium">{(prediction.prediction.confidence * 100).toFixed(1)}%</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <Button 
                            onClick={() => getPrediction(game.gamePk)} 
                            variant="outline" 
                            size="sm"
                            className="w-full"
                          >
                            Get AI Prediction
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}