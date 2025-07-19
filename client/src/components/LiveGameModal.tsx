import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
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
    queryKey: [`/api/mlb/game/${numericGameId}/live`, homeTeam, awayTeam],
    queryFn: async () => {
      const response = await fetch(`/api/mlb/game/${numericGameId}/live?homeTeam=${encodeURIComponent(homeTeam)}&awayTeam=${encodeURIComponent(awayTeam)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    refetchInterval: autoRefresh ? 5000 : false, // Refresh every 5 seconds when auto-refresh is on
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
          <VisuallyHidden>
            <DialogDescription>
              Live game information showing current game state, score, batter, pitcher, count, and base runners for {liveData.teams.away.name} at {liveData.teams.home.name}.
            </DialogDescription>
          </VisuallyHidden>
        </DialogHeader>

        <div className="space-y-6">
          {/* Enhanced Score and Game Status */}
          <Card className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/30 dark:to-green-900/30 border-2">
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-6 items-center">
                {/* Away Team */}
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {liveData.teams.away.abbreviation}
                  </div>
                  <div className="text-4xl font-bold mb-1" style={{ color: getTeamColor(awayTeam) }}>
                    {liveData.score.away}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {liveData.teams.away.name}
                  </div>
                </div>
                
                {/* Game Status */}
                <div className="text-center">
                  <Badge variant="secondary" className="mb-3 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    {liveData.status.inProgress ? '🔴 LIVE' : liveData.status.detailed}
                  </Badge>
                  <div className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                    {formatInning(liveData.inning.current, liveData.inning.state)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {liveData.count.outs} Out{liveData.count.outs !== 1 ? 's' : ''}
                  </div>
                  
                  {/* Count Display */}
                  <div className="mt-3 inline-flex items-center gap-1 bg-white dark:bg-gray-800 px-3 py-1 rounded-full text-sm font-semibold">
                    <span className="text-blue-600 dark:text-blue-400">{liveData.count.balls}</span>
                    <span className="text-gray-400">-</span>
                    <span className="text-red-600 dark:text-red-400">{liveData.count.strikes}</span>
                  </div>
                </div>
                
                {/* Home Team */}
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {liveData.teams.home.abbreviation}
                  </div>
                  <div className="text-4xl font-bold mb-1" style={{ color: getTeamColor(homeTeam) }}>
                    {liveData.score.home}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {liveData.teams.home.name}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>



          {/* Baseball Diamond with Batter and Pitcher */}
          {liveData.status.inProgress && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-4 h-4 bg-green-600 rounded-full" />
                  <span className="font-semibold text-lg">Live Game Situation</span>
                </div>
                
                <div className="relative mx-auto w-96 h-80">
                  {/* Batter (Left side) */}
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-24">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center border-2 border-blue-200 dark:border-blue-800">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full mx-auto mb-3 w-10 h-10 flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-2">At Bat</div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                        {liveData.currentBatter.name}
                      </div>
                    </div>
                  </div>

                  {/* Pitcher (Right side) */}
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-24">
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center border-2 border-green-200 dark:border-green-800">
                      <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full mx-auto mb-3 w-10 h-10 flex items-center justify-center">
                        <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="text-xs font-semibold text-green-700 dark:text-green-400 mb-2">Pitching</div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                        {liveData.currentPitcher.name}
                      </div>
                    </div>
                  </div>
                  
                  {/* Baseball Diamond */}
                  <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40">
                    {/* Diamond background */}
                    <div className="absolute inset-0 transform rotate-45">
                      <div className="w-full h-full border-2 border-green-600 dark:border-green-500 bg-green-100 dark:bg-green-900 opacity-30 rounded"></div>
                    </div>
                    
                    {/* Home plate */}
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gray-800 dark:bg-gray-300 rounded-full border-2 border-gray-600"></div>
                    
                    {/* First base */}
                    <div className={`absolute right-2 bottom-1/2 transform translate-y-1/2 w-6 h-6 border-2 border-gray-400 rounded rotate-45 flex items-center justify-center ${hasRunnerOnBase(liveData.baseRunners.first) ? 'bg-yellow-400 border-yellow-500' : 'bg-white dark:bg-gray-800'}`}>
                      {hasRunnerOnBase(liveData.baseRunners.first) && (
                        <div className="text-xs text-black font-bold transform -rotate-45">1</div>
                      )}
                    </div>
                    
                    {/* Second base */}
                    <div className={`absolute top-2 left-1/2 transform -translate-x-1/2 w-6 h-6 border-2 border-gray-400 rounded rotate-45 flex items-center justify-center ${hasRunnerOnBase(liveData.baseRunners.second) ? 'bg-yellow-400 border-yellow-500' : 'bg-white dark:bg-gray-800'}`}>
                      {hasRunnerOnBase(liveData.baseRunners.second) && (
                        <div className="text-xs text-black font-bold transform -rotate-45">2</div>
                      )}
                    </div>
                    
                    {/* Third base */}
                    <div className={`absolute left-2 bottom-1/2 transform translate-y-1/2 w-6 h-6 border-2 border-gray-400 rounded rotate-45 flex items-center justify-center ${hasRunnerOnBase(liveData.baseRunners.third) ? 'bg-yellow-400 border-yellow-500' : 'bg-white dark:bg-gray-800'}`}>
                      {hasRunnerOnBase(liveData.baseRunners.third) && (
                        <div className="text-xs text-black font-bold transform -rotate-45">3</div>
                      )}
                    </div>
                  </div>

                  {/* Count and Game Status Display (below diamond) */}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-center">
                    <div className="bg-gray-100 dark:bg-gray-800 px-6 py-3 rounded-lg border">
                      <div className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                        {formatCount(liveData.count.balls, liveData.count.strikes)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        Balls - Strikes
                      </div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {formatInning(liveData.inning.current, liveData.inning.state)}, {liveData.count.outs} Out{liveData.count.outs !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Base Runner Names */}
                {(hasRunnerOnBase(liveData.baseRunners.first) || hasRunnerOnBase(liveData.baseRunners.second) || hasRunnerOnBase(liveData.baseRunners.third)) && (
                  <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      {hasRunnerOnBase(liveData.baseRunners.third) ? (
                        <div className="bg-yellow-100 dark:bg-yellow-900/20 p-2 rounded">
                          <span className="font-medium text-yellow-700 dark:text-yellow-400">3rd:</span>
                          <br />
                          <span className="text-gray-900 dark:text-white">{liveData.baseRunners.third.fullName}</span>
                        </div>
                      ) : (
                        <div className="text-gray-400 text-center">3rd: Empty</div>
                      )}
                    </div>
                    <div className="text-center">
                      {hasRunnerOnBase(liveData.baseRunners.second) ? (
                        <div className="bg-yellow-100 dark:bg-yellow-900/20 p-2 rounded">
                          <span className="font-medium text-yellow-700 dark:text-yellow-400">2nd:</span>
                          <br />
                          <span className="text-gray-900 dark:text-white">{liveData.baseRunners.second.fullName}</span>
                        </div>
                      ) : (
                        <div className="text-gray-400 text-center">2nd: Empty</div>
                      )}
                    </div>
                    <div className="text-center">
                      {hasRunnerOnBase(liveData.baseRunners.first) ? (
                        <div className="bg-yellow-100 dark:bg-yellow-900/20 p-2 rounded">
                          <span className="font-medium text-yellow-700 dark:text-yellow-400">1st:</span>
                          <br />
                          <span className="text-gray-900 dark:text-white">{liveData.baseRunners.first.fullName}</span>
                        </div>
                      ) : (
                        <div className="text-gray-400 text-center">1st: Empty</div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Enhanced Recent Plays */}
          {liveData.status.inProgress && liveData.recentPlays && liveData.recentPlays.length > 0 && (
            <Card className="border-purple-200 dark:border-purple-800">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-full">
                    <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-lg font-semibold text-purple-700 dark:text-purple-400">Play-by-Play</span>
                </div>
                
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {liveData.recentPlays.slice(0, 8).reverse().map((play, index) => (
                    <div key={play.id || index} className="border-l-4 border-purple-500 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-r-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                            {play.halfInning} {play.inning}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {play.outs} out{play.outs !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {play.result && (
                          <Badge variant="outline" className="text-xs bg-white dark:bg-gray-700">
                            {play.result}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-900 dark:text-white leading-relaxed">
                        {play.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Recent Plays Available */}
          {liveData.status.inProgress && (!liveData.recentPlays || liveData.recentPlays.length === 0) && (
            <Card className="border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="text-center py-4">
                  <TrendingUp className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Play-by-play data will appear here during live action
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Auto-refresh indicator */}
          <div className="flex items-center justify-center gap-3 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <Clock className="w-4 h-4" />
            <span>Live updates every 5 seconds</span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            {liveData.lastUpdate && (
              <span className="text-xs">
                Last updated: {new Date(liveData.lastUpdate).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}