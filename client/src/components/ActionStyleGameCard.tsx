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
  sport?: string;
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
      return `Tomorrow ${time}`;
    } else {
      // Show date for future games
      return `${date.getMonth()+1}/${date.getDate()} ${time}`;
    }
  } catch (error) {
    console.warn('Error formatting time:', error);
    return "TBD";
  }
};
const getTeamColorBySport = (teamName: string, sport?: string): string => {
  if (sport === 'americanfootball_nfl') {
    const nflColors: Record<string, string> = {
      'Kansas City Chiefs': '#E31837',
      'Dallas Cowboys': '#041E42',
      'Green Bay Packers': '#203731',
      'Pittsburgh Steelers': '#FFB612',
      'New England Patriots': '#002244',
      'San Francisco 49ers': '#AA0000',
      'Seattle Seahawks': '#002244',
      'Buffalo Bills': '#00338D',
      'Miami Dolphins': '#008E97',
      'New York Jets': '#125740'
    };
    return nflColors[teamName] || '#6B7280';
  }
  
  if (sport === 'basketball_nba') {
    const nbaColors: Record<string, string> = {
      'Los Angeles Lakers': '#552583',
      'Boston Celtics': '#007A33',
      'Golden State Warriors': '#1D428A',
      'Chicago Bulls': '#CE1141',
      'Miami Heat': '#98002E',
      'Brooklyn Nets': '#000000',
      'Philadelphia 76ers': '#006BB6',
      'Milwaukee Bucks': '#00471B'
    };
    return nbaColors[teamName] || '#6B7280';
  }
  
  if (sport === 'americanfootball_ncaaf') {
    const cfbColors: Record<string, string> = {
      'Alabama': '#9E1B32',
      'Georgia': '#BA0C2F',
      'Michigan': '#00274C',
      'Ohio State': '#BB0000',
      'Texas': '#BF5700',
      'Oklahoma': '#841617',
      'Notre Dame': '#0C2340',
      'USC': '#990000'
    };
    return cfbColors[teamName] || '#6B7280';
  }
  
  // MLB colors (default)
  const mlbColors: Record<string, string> = {
    'Boston Red Sox': '#BD3039',
    'New York Yankees': '#132448',
    'Los Angeles Dodgers': '#005A9C',
    'San Francisco Giants': '#FD5A1E',
    'Chicago Cubs': '#0E3386',
    'St. Louis Cardinals': '#C41E3A',
    'Houston Astros': '#002D62',
    'Atlanta Braves': '#CE1141',
    'Philadelphia Phillies': '#E81828',
    'New York Mets': '#002D72'
  };
  return mlbColors[teamName] || '#6B7280';
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
  rawBookmakers,
  sport = 'baseball_mlb'
}: GameCardProps) {
  const [oddsModalOpen, setOddsModalOpen] = useState(false);
  const [gameDetailsOpen, setGameDetailsOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<{
    market: 'moneyline' | 'spread' | 'total';
    selection: string;
    line?: number;
  } | null>(null);

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
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-3 sm:p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800">
  {sport === 'americanfootball_nfl' ? 'NFL' : 
   sport === 'basketball_nba' ? 'NBA' : 
   sport === 'americanfootball_ncaaf' ? 'CFB' : 'MLB'}
</Badge>
            {isLive && (
              <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                LIVE
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
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
          <div className="text-center text-xs">Pro Pick</div>
        </div>

        <div className="space-y-2 sm:space-y-3">
          {/* Away Team */}
          <div className="grid grid-cols-5 gap-1 sm:gap-2 items-center">
            <div className="col-span-2 flex items-center gap-2 sm:gap-3">
              <div 
                className="w-3 h-3 sm:w-4 sm:h-4 rounded-full shadow-sm flex-shrink-0" 
                style={{ backgroundColor: getTeamColorBySport(awayTeam, sport) }}
              />
              <p className="font-medium text-xs sm:text-sm text-gray-900 dark:text-white truncate">{awayTeam}</p>
            </div>
            
            <div className="flex items-center justify-center">
              <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                {awayOdds ? formatOdds(awayOdds) : (
                  <span className="text-gray-400 dark:text-gray-500 text-xs sm:text-sm">TBD</span>
                )}
              </span>
            </div>

            <div className="flex items-center justify-center">
              {awayOdds && (
                <Button
                  size="sm"
                  onClick={(e) => handleMakePick(e, 'moneyline', awayTeam)}
                  className="text-xs px-2 sm:px-3 py-1 h-6 sm:h-7 text-white border-0 font-semibold shadow-sm hover:opacity-90"
                  style={{ backgroundColor: getTeamColorBySport(awayTeam, sport) }}
                >
                  Pick
                </Button>
              )}
            </div>

            <div className="flex items-center justify-center">
              <Lock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            </div>
          </div>

          {/* Home Team */}
          <div className="grid grid-cols-5 gap-1 sm:gap-2 items-center">
            <div className="col-span-2 flex items-center gap-2 sm:gap-3">
              <div 
                className="w-3 h-3 sm:w-4 sm:h-4 rounded-full shadow-sm flex-shrink-0" 
                style={{ backgroundColor: getTeamColorBySport(homeTeam, sport) }}
              />
              <p className="font-medium text-xs sm:text-sm text-gray-900 dark:text-white truncate">{homeTeam}</p>
            </div>
            
            <div className="flex items-center justify-center">
              <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                {homeOdds ? formatOdds(homeOdds) : (
                  <span className="text-gray-400 dark:text-gray-500 text-xs sm:text-sm">TBD</span>
                )}
              </span>
            </div>

            <div className="flex items-center justify-center">
              {homeOdds && (
                <Button
                  size="sm"
                  onClick={(e) => handleMakePick(e, 'moneyline', homeTeam)}
                  className="text-xs px-2 sm:px-3 py-1 h-6 sm:h-7 text-white border-0 font-semibold shadow-sm hover:opacity-90"
                  style={{ backgroundColor: getTeamColorBySport(homeTeam, sport) }}
                >
                  Pick
                </Button>
              )}
            </div>

            <div className="flex items-center justify-center">
              <Lock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            </div>
          </div>
        </div>

        {/* Betting Lines */}
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          {/* Mobile Layout: Spread and Total side by side */}
          <div className="flex sm:hidden gap-1">
            {/* Spread Section - Left Half */}
            <div className="flex-1 text-center space-y-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">Spread</p>
              {spread !== undefined && spread !== null ? (
                <>
                  {(() => {
                    const isFavoredHome = spread < 0;
                    const favoredTeam = isFavoredHome ? homeTeam : awayTeam;
                    const favoredSpread = Math.abs(spread);
                    
                    return (
                      <div className="space-y-1">
                        <div className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                          {favoredTeam} -{favoredSpread}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={(e) => handleMakePick(e, 'spread', favoredTeam, -favoredSpread)}
                            className="flex-1 text-xs px-1.5 py-1 h-6 text-white bg-green-600 hover:bg-green-700 border-0 font-semibold shadow-sm"
                          >
                            -{favoredSpread}
                          </Button>
                          <Button
                            size="sm"
                            onClick={(e) => handleMakePick(e, 'spread', isFavoredHome ? awayTeam : homeTeam, favoredSpread)}
                            className="flex-1 text-xs px-1.5 py-1 h-6 text-white bg-red-600 hover:bg-red-700 border-0 font-semibold shadow-sm"
                          >
                            +{favoredSpread}
                          </Button>
                        </div>
                      </div>
                    );
                  })()}
                </>
              ) : (
                <div className="text-xs text-gray-400 dark:text-gray-500">Spread TBD</div>
              )}
            </div>

            {/* Total Section - Right Half */}
            <div className="flex-1 text-center space-y-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">O/U</p>
              {total !== undefined && total !== null ? (
                <div className="space-y-1">
                  <div className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                    {total}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      onClick={(e) => handleMakePick(e, 'total', 'Over', total)}
                      className="flex-1 text-xs px-2 py-1 h-6 text-white bg-green-600 hover:bg-green-700 border-0 font-semibold shadow-sm"
                    >
                      O
                    </Button>
                    <Button
                      size="sm"
                      onClick={(e) => handleMakePick(e, 'total', 'Under', total)}
                      className="flex-1 text-xs px-2 py-1 h-6 text-white bg-red-600 hover:bg-red-700 border-0 font-semibold shadow-sm"
                    >
                      U
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-gray-400 dark:text-gray-500">O/U TBD</div>
              )}
            </div>
          </div>

          {/* Desktop Layout: Spread and Total separated */}
          <div className="hidden sm:block space-y-3">
            {/* Spread Section */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Spread</span>
              {spread !== undefined && spread !== null ? (
                (() => {
                  const isFavoredHome = spread < 0;
                  const favoredTeam = isFavoredHome ? homeTeam : awayTeam;
                  const favoredSpread = Math.abs(spread);
                  
                  return (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700 dark:text-gray-300 min-w-[80px]">
                        {favoredTeam} -{favoredSpread}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          onClick={(e) => handleMakePick(e, 'spread', favoredTeam, -favoredSpread)}
                          className="text-xs px-3 py-1 h-7 text-white bg-green-600 hover:bg-green-700 border-0 font-semibold shadow-sm"
                        >
                          -{favoredSpread}
                        </Button>
                        <Button
                          size="sm"
                          onClick={(e) => handleMakePick(e, 'spread', isFavoredHome ? awayTeam : homeTeam, favoredSpread)}
                          className="text-xs px-3 py-1 h-7 text-white bg-red-600 hover:bg-red-700 border-0 font-semibold shadow-sm"
                        >
                          +{favoredSpread}
                        </Button>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <span className="text-sm text-gray-400 dark:text-gray-500">Spread TBD</span>
              )}
            </div>

            {/* Total Section */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Over/Under</span>
              {total !== undefined && total !== null ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300 min-w-[40px]">
                    {total}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      onClick={(e) => handleMakePick(e, 'total', 'Over', total)}
                      className="text-xs px-3 py-1 h-7 text-white bg-green-600 hover:bg-green-700 border-0 font-semibold shadow-sm"
                    >
                      Over
                    </Button>
                    <Button
                      size="sm"
                      onClick={(e) => handleMakePick(e, 'total', 'Under', total)}
                      className="text-xs px-3 py-1 h-7 text-white bg-red-600 hover:bg-red-700 border-0 font-semibold shadow-sm"
                    >
                      Under
                    </Button>
                  </div>
                </div>
              ) : (
                <span className="text-sm text-gray-400 dark:text-gray-500">O/U TBD</span>
              )}
            </div>
          </div>
        </div>

        {/* Probable Pitchers */}
        {probablePitchers && (probablePitchers.home || probablePitchers.away) && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <div className="ml-6">Away: {probablePitchers.away || "TBD"}</div>
              <div className="ml-6">Home: {probablePitchers.home || "TBD"}</div>
            </div>
          </div>
        )}

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
            sport: sport || 'baseball_mlb',
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
