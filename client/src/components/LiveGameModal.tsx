import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  RefreshCw, 
  Clock, 
  User, 
  Target,
  TrendingUp,
  X
} from "lucide-react";
import { getTeamColor } from "@/utils/teamLogos";

interface LiveGameData {
  gameId: string;
  status: {
    detailed: string;
    abstract: string;
    inProgress: boolean;
  };
  score: {
    home: number;
    away: number;
  };
  inning: {
    current: number;
    state: string;
    half: string;
  };
  count: {
    balls: number;
    strikes: number;
    outs: number;
  };
  currentBatter: {
    id: number;
    name: string;
    team: string;
  };
  currentPitcher: {
    id: number;
    name: string;
    pitchCount: number;
  };
  baseRunners: {
    first: any;
    second: any;
    third: any;
  };
  recentPlays: Array<{
    id: number;
    description: string;
    inning: number;
    halfInning: string;
    outs: number;
    result: string;
  }>;
  teams: {
    home: {
      name: string;
      abbreviation: string;
    };
    away: {
      name: string;
      abbreviation: string;
    };
  };
  lastUpdate: string;
}

interface LiveGameModalProps {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  isOpen: boolean;
  onClose: () => void;
}

export function LiveGameModal({ gameId, homeTeam, awayTeam, isOpen, onClose }: LiveGameModalProps) {
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Extract numeric game ID from the full ID if needed
  const numericGameId = gameId.replace(/[^0-9]/g, '');

  const { data: liveData, isLoading, error, refetch } = useQuery({
    queryKey: [`/api/mlb/game/${numericGameId}/live`],
    refetchInterval: autoRefresh ? 30000 : false, // Refresh every 30 seconds when auto-refresh is on
    enabled: isOpen && numericGameId !== '',
    retry: 2
  });

  // Format count display
  const formatCount = (balls: number, strikes: number) => {
    return `${balls}-${strikes}`;
  };

  // Format inning display
  const formatInning = (current: number, state: string) => {
    const inningState = state === 'Top' ? 'T' : 'B';
    return `${inningState}${current}`;
  };

  // Determine if bases have runners
  const hasRunnerOnBase = (base: any) => {
    return base && base.fullName;
  };

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            <span>Loading live game data...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !liveData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="text-center p-8">
            <h3 className="text-lg font-semibold mb-2">Unable to Load Live Data</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Live game information is not available for this game.
            </p>
            <Button onClick={() => refetch()} variant="outline">
              Try Again
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">
              {liveData.teams.away.name} @ {liveData.teams.home.name}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={autoRefresh ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : ""}
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${autoRefresh ? 'animate-spin' : ''}`} />
                Auto
              </Button>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Score and Game Status */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-4 items-center">
                <div className="text-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400">{liveData.teams.away.abbreviation}</div>
                  <div className="text-3xl font-bold" style={{ color: getTeamColor(awayTeam) }}>
                    {liveData.score.away}
                  </div>
                </div>
                
                <div className="text-center">
                  <Badge variant="secondary" className="mb-2">
                    {liveData.status.inProgress ? 'LIVE' : liveData.status.detailed}
                  </Badge>
                  <div className="text-lg font-semibold">
                    {formatInning(liveData.inning.current, liveData.inning.state)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {liveData.count.outs} Out{liveData.count.outs !== 1 ? 's' : ''}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400">{liveData.teams.home.abbreviation}</div>
                  <div className="text-3xl font-bold" style={{ color: getTeamColor(homeTeam) }}>
                    {liveData.score.home}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current At-Bat */}
          {liveData.status.inProgress && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-4 h-4" />
                    <span className="font-semibold">Current Batter</span>
                  </div>
                  <div className="text-lg font-bold">{liveData.currentBatter.name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Count: {formatCount(liveData.count.balls, liveData.count.strikes)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-4 h-4" />
                    <span className="font-semibold">Current Pitcher</span>
                  </div>
                  <div className="text-lg font-bold">{liveData.currentPitcher.name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Pitches: {liveData.currentPitcher.pitchCount}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Base Runners */}
          {liveData.status.inProgress && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-4 h-4 bg-yellow-600 rounded-full" />
                  <span className="font-semibold">Base Runners</span>
                </div>
                
                <div className="relative mx-auto w-48 h-48">
                  {/* Baseball diamond */}
                  <div className="absolute inset-0 transform rotate-45">
                    <div className="w-full h-full border-2 border-gray-400 dark:border-gray-600 bg-green-100 dark:bg-green-900 opacity-30"></div>
                  </div>
                  
                  {/* Home plate */}
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white dark:bg-gray-800 border border-gray-400 rounded-full"></div>
                  
                  {/* First base */}
                  <div className={`absolute right-2 bottom-1/2 transform translate-y-1/2 w-6 h-6 border border-gray-400 rounded ${hasRunnerOnBase(liveData.baseRunners.first) ? 'bg-blue-500' : 'bg-white dark:bg-gray-800'}`}>
                    {hasRunnerOnBase(liveData.baseRunners.first) && (
                      <div className="text-[8px] text-white text-center leading-6 font-bold">1B</div>
                    )}
                  </div>
                  
                  {/* Second base */}
                  <div className={`absolute top-2 left-1/2 transform -translate-x-1/2 w-6 h-6 border border-gray-400 rounded ${hasRunnerOnBase(liveData.baseRunners.second) ? 'bg-blue-500' : 'bg-white dark:bg-gray-800'}`}>
                    {hasRunnerOnBase(liveData.baseRunners.second) && (
                      <div className="text-[8px] text-white text-center leading-6 font-bold">2B</div>
                    )}
                  </div>
                  
                  {/* Third base */}
                  <div className={`absolute left-2 bottom-1/2 transform translate-y-1/2 w-6 h-6 border border-gray-400 rounded ${hasRunnerOnBase(liveData.baseRunners.third) ? 'bg-blue-500' : 'bg-white dark:bg-gray-800'}`}>
                    {hasRunnerOnBase(liveData.baseRunners.third) && (
                      <div className="text-[8px] text-white text-center leading-6 font-bold">3B</div>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-1 text-sm">
                  {hasRunnerOnBase(liveData.baseRunners.first) && (
                    <div>1B: {liveData.baseRunners.first.fullName}</div>
                  )}
                  {hasRunnerOnBase(liveData.baseRunners.second) && (
                    <div>2B: {liveData.baseRunners.second.fullName}</div>
                  )}
                  {hasRunnerOnBase(liveData.baseRunners.third) && (
                    <div>3B: {liveData.baseRunners.third.fullName}</div>
                  )}
                  {!hasRunnerOnBase(liveData.baseRunners.first) && 
                   !hasRunnerOnBase(liveData.baseRunners.second) && 
                   !hasRunnerOnBase(liveData.baseRunners.third) && (
                    <div className="text-gray-600 dark:text-gray-400">No runners on base</div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Plays */}
          {liveData.status.inProgress && liveData.recentPlays && liveData.recentPlays.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-semibold">Recent Plays</span>
                </div>
                
                <div className="space-y-2">
                  {liveData.recentPlays.slice().reverse().map((play, index) => (
                    <div key={play.id || index} className="flex justify-between items-start p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{play.description}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {play.halfInning} {play.inning}, {play.outs} out{play.outs !== 1 ? 's' : ''}
                        </div>
                      </div>
                      {play.result && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          {play.result}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Last Updated */}
          <div className="text-center text-xs text-gray-500 dark:text-gray-400">
            <Clock className="w-3 h-3 inline mr-1" />
            Last updated: {new Date(liveData.lastUpdate).toLocaleTimeString()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}