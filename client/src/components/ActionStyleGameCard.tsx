import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Clock,
  TrendingUp,
  Lock,
  Info
} from "lucide-react";
import { getTeamColor } from "@/utils/teamLogos";
import { OddsComparisonModal } from "./OddsComparisonModal";
import { GameDetailsModal } from "./GameDetailsModal";

interface GameCardProps {
  homeTeam: string;
  awayTeam: string;
  homeOdds?: number;
  awayOdds?: number;
  spread?: number;
  total?: number;
  startTime?: string;
  prediction?: {
    homeWinProbability: number;
    awayWinProbability: number;
    confidence: number;
    edge?: string;
  };
  isLive?: boolean;
  bookmakers?: Array<{
    name: string;
    homeOdds?: number;
    awayOdds?: number;
    spread?: number;
    total?: number;
  }>;
  gameId?: string | number;
  probablePitchers?: {
    home: string | null;
    away: string | null;
  };
  isDailyPick?: boolean;
  dailyPickTeam?: string;
  dailyPickGrade?: string;
  dailyPickId?: string;
  lockPickTeam?: string;
  lockPickGrade?: string;
  lockPickId?: string;
  isAuthenticated?: boolean;
  onClick?: () => void;
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

// SAFE DATE FORMATTING FUNCTION - NO CRASHES
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
  return time;  // Just show time for today's games
} else if (isTomorrow) {
      return `Tomorrow ${time}`;  // ← Changed from "Tmrw" to "Tomorrow"
    } else {
      // Show date for future games
      return `${date.getMonth()+1}/${date.getDate()} ${time}`;
    }
  } catch (error) {
    console.warn('Error formatting time:', error);
    return "TBD";
  }
};

export function ActionStyleGameCard({
  homeTeam,
  awayTeam,
  homeOdds,
  awayOdds,
  spread,
  total,
  startTime,
  prediction,
  isLive = false,
  bookmakers,
  gameId,
  probablePitchers,
  isDailyPick = false,
  dailyPickTeam,
  dailyPickGrade,
  dailyPickId,
  lockPickTeam,
  lockPickGrade,
  lockPickId,
  isAuthenticated = false,
  onClick,
  rawBookmakers
}: GameCardProps) {
  const [oddsModalOpen, setOddsModalOpen] = useState(false);
  const [gameDetailsOpen, setGameDetailsOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<{
    market: 'moneyline' | 'spread' | 'total';
    selection: string;
    line?: number;
  } | null>(null);

  // Debug logging
  console.log('GameCard received startTime:', startTime, 'for', homeTeam, 'vs', awayTeam);

  const handleMakePick = (event: React.MouseEvent, market: 'moneyline' | 'spread' | 'total', selection: string, line?: number) => {
    try {
      event.stopPropagation();
      event.preventDefault();
      
      if (!rawBookmakers || rawBookmakers.length === 0) {
        console.warn('No bookmakers data available for odds comparison');
        alert('No betting odds available for this game yet. Please try again later.');
        return;
      }

      setOddsModalOpen(false);
      setSelectedBet(null);
      
      setTimeout(() => {
        try {
          setSelectedBet({ market, selection, line });
          setOddsModalOpen(true);
        } catch (timeoutError) {
          console.error('Error in timeout function:', timeoutError);
          alert('Error in delayed modal opening. Please try again.');
        }
      }, 100);
      
    } catch (error) {
      console.error('Error in handleMakePick:', error);
      alert(`Critical error opening betting options: ${error.message}. Please try again or refresh the page.`);
    }
  };

  const formatOdds = (odds: number) => {
    if (odds > 0) {
      return `+${Math.round(odds)}`;
    } else {
      return `${Math.round(odds)}`;
    }
  };

  const getBetRecommendation = () => {
    if (!prediction) return null;
    
    const homeProb = prediction.homeWinProbability;
    const awayProb = prediction.awayWinProbability;
    
    if (homeProb > 0.55) return { team: homeTeam, type: "home", prob: homeProb };
    if (awayProb > 0.55) return { team: awayTeam, type: "away", prob: awayProb };
    return null;
  };

  const recommendation = getBetRecommendation();

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 border border-gray-200 dark:border-gray-700">
      <CardContent className="p-3 sm:p-4">
        {/* Header with time display */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 sm:mb-3 gap-1 sm:gap-2">
          <div className="flex items-center gap-2">
            {isLive && (
              <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                LIVE
              </Badge>
            )}
            {/* TIME DISPLAY - THIS REPLACES TBD */}
            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatGameTime(startTime)}
            </span>
          </div>
        </div>

        {/* Column Headers */}
        <div className="grid grid-cols-5 gap-1 sm:gap-2 mb-2 sm:mb-3 text-xs text-gray-500 dark:text-gray-400">
          <div className="col-span-2 text-xs">Teams</div>
          <div className="text-center text-xs sm:text-sm">Odds</div>
          <div className="text-center text-xs sm:text-sm">Pick</div>
          <div className="text-center text-xs">AI Pick</div>
        </div>

        <div className="space-y-2 sm:space-y-3">
          {/* Away Team */}
          <div className="grid grid-cols-5 gap-1 sm:gap-2 items-center">
            <div className="col-span-2 flex items-center gap-2 sm:gap-3">
              <div 
                className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0" 
                style={{ backgroundColor: getTeamColor(awayTeam) }}
              />
              <p className="font-medium text-xs sm:text-sm text-gray-900 dark:text-white truncate">{awayTeam}</p>
            </div>
            
            <div className="flex items-center justify-center">
              <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                {awayOdds ? formatOdds(awayOdds) : (
                  <span className="text-gray-400 dark:text-gray-500 text-xs sm:text-sm">--</span>
                )}
              </span>
            </div>

            <div className="flex items-center justify-center">
              {awayOdds && (
                <Button
                  size="sm"
                  onClick={(e) => handleMakePick(e, 'moneyline', awayTeam)}
                  className="text-xs px-2 sm:px-3 py-1 h-6 sm:h-7 text-white border-0 font-semibold shadow-sm hover:opacity-90"
                  style={{ backgroundColor: getTeamColor(awayTeam) }}
                >
                  Pick
                </Button>
              )}
            </div>

            <div className="flex items-center justify-center">
              {isDailyPick && dailyPickTeam === awayTeam ? (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center text-white">
                  <span className="text-xs font-bold">{dailyPickGrade || "A+"}</span>
                </div>
              ) : isAuthenticated && lockPickTeam === awayTeam ? (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white">
                  <span className="text-xs font-bold">{lockPickGrade || "A+"}</span>
                </div>
              ) : isDailyPick || (isAuthenticated && lockPickTeam) ? (
                <span className="text-xs text-gray-400 dark:text-gray-500">-</span>
              ) : (
                <Lock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              )}
            </div>
          </div>

          {/* Home Team */}
          <div className="grid grid-cols-5 gap-1 sm:gap-2 items-center">
            <div className="col-span-2 flex items-center gap-2 sm:gap-3">
              <div 
                className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0" 
                style={{ backgroundColor: getTeamColor(homeTeam) }}
              />
              <p className="font-medium text-xs sm:text-sm text-gray-900 dark:text-white truncate">{homeTeam}</p>
            </div>
            
            <div className="flex items-center justify-center">
              <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                {homeOdds ? formatOdds(homeOdds) : (
                  <span className="text-gray-400 dark:text-gray-500 text-xs sm:text-sm">--</span>
                )}
              </span>
            </div>

            <div className="flex items-center justify-center">
              {homeOdds && (
                <Button
                  size="sm"
                  onClick={(e) => handleMakePick(e, 'moneyline', homeTeam)}
                  className="text-xs px-2 sm:px-3 py-1 h-6 sm:h-7 text-white border-0 font-semibold shadow-sm hover:opacity-90"
                  style={{ backgroundColor: getTeamColor(homeTeam) }}
                >
                  Pick
                </Button>
              )}
            </div>

            <div className="flex items-center justify-center">
              {isDailyPick && dailyPickTeam === homeTeam ? (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center text-white">
                  <span className="text-xs font-bold">{dailyPickGrade || "A+"}</span>
                </div>
              ) : isAuthenticated && lockPickTeam === homeTeam ? (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white">
                  <span className="text-xs font-bold">{lockPickGrade || "A+"}</span>
                </div>
              ) : isDailyPick || (isAuthenticated && lockPickTeam) ? (
                <span className="text-xs text-gray-400 dark:text-gray-500">-</span>
              ) : (
                <Lock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              )}
            </div>
          </div>
        </div>

        {/* Betting Lines */}
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex gap-4 justify-center">
            {/* Spread Section */}
            <div className="text-center space-y-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">Spread</p>
              {spread !== undefined && spread !== null ? (
                <>
                  {(() => {
                    const isFavoredHome = spread < 0;
                    const favoredTeam = isFavoredHome ? homeTeam : awayTeam;
                    const favoredSpread = Math.abs(spread);
                    
                    return (
                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                          {favoredTeam} -{favoredSpread}
                        </p>
                        <div className="flex gap-1 justify-center">
                          <Button
                            size="sm"
                            onClick={(e) => handleMakePick(e, 'spread', favoredTeam, -favoredSpread)}
                            className="text-xs px-2 py-1 h-6 bg-green-600 hover:bg-green-700 text-white"
                          >
                            Pick
                          </Button>
                          <Button
                            size="sm"
                            onClick={(e) => handleMakePick(e, 'spread', isFavoredHome ? awayTeam : homeTeam, favoredSpread)}
                            className="text-xs px-2 py-1 h-6 bg-red-600 hover:bg-red-700 text-white"
                          >
                            Fade
                          </Button>
                        </div>
                      </div>
                    );
                  })()}
                </>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-400 dark:text-gray-500">--</p>
                  <div className="flex gap-1 justify-center">
                    <Button size="sm" disabled className="text-xs px-2 py-1 h-6 opacity-50">Pick</Button>
                    <Button size="sm" disabled className="text-xs px-2 py-1 h-6 opacity-50">Fade</Button>
                  </div>
                </div>
              )}
            </div>

            {/* Total Section */}
            <div className="text-center space-y-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
              {total !== undefined && total !== null ? (
                <>
                  <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                    O/U {total}
                  </p>
                  <div className="flex gap-1 justify-center">
                    <Button
                      size="sm"
                      onClick={(e) => handleMakePick(e, 'total', 'Over', total)}
                      className="text-xs px-2 py-1 h-6 bg-green-600 hover:bg-green-700 text-white"
                    >
                      O
                    </Button>
                    <Button
                      size="sm"
                      onClick={(e) => handleMakePick(e, 'total', 'Under', total)}
                      className="text-xs px-2 py-1 h-6 bg-red-600 hover:bg-red-700 text-white"
                    >
                      U
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs sm:text-sm font-medium text-gray-400 dark:text-gray-500">--</p>
                  <div className="flex gap-1 justify-center">
                    <Button size="sm" disabled className="text-xs px-2 py-1 h-6 opacity-50">O</Button>
                    <Button size="sm" disabled className="text-xs px-2 py-1 h-6 opacity-50">U</Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Recommendation */}
        {recommendation && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Bet: {recommendation.team}
                </span>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">Edge</p>
                <p className="text-sm font-bold text-green-600 dark:text-green-400">
                  {prediction?.edge || "No edge"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Game Info Button */}
        <div className="mt-3 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setGameDetailsOpen(true);
            }}
            className="text-xs px-2 py-1 h-6 text-gray-500 dark:text-gray-400"
          >
            <Info className="w-3 h-3 mr-1" />
            Game Info
          </Button>
        </div>
      </CardContent>
      
      {/* Modals */}
      {selectedBet && rawBookmakers && (
        <OddsComparisonModal
          open={oddsModalOpen}
          onClose={() => {
            setOddsModalOpen(false);
            setSelectedBet(null);
          }}
          gameInfo={{
            homeTeam,
            awayTeam,
            gameId,
            sport: 'baseball_mlb',
            gameTime: startTime
          }}
          bookmakers={rawBookmakers}
          selectedBet={selectedBet}
        />
      )}

      <GameDetailsModal
        isOpen={gameDetailsOpen}
        onClose={() => setGameDetailsOpen(false)}
        gameId={gameId || ''}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        startTime={startTime}
        probablePitchers={probablePitchers}
      />
    </Card>
  );
}
