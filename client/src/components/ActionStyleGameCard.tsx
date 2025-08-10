import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Star, 
  TrendingUp, 
  DollarSign, 
  Target,
  Clock,
  Info,
  ExternalLink,
  Zap,
  Lock
} from "lucide-react";
import { getTeamColor } from "@/utils/teamLogos";
import { Clock, TrendingUp, TrendingDown, Users, Lock, Target, Info, Plus } from "lucide-react";
import { OddsComparisonModal } from "./OddsComparisonModal";
import { GameDetailsModal } from "./GameDetailsModal";
import { getFactorColorClasses, getFactorTooltip, getGradeColorClasses, getMainGradeExplanation } from "@/lib/factorUtils";
import { pickStorage } from '@/services/pickStorage';
import { databasePickStorage } from '@/services/databasePickStorage';
import { Pick } from '@/types/picks';

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

// SAFE DATE FORMATTING FUNCTIONS
const formatGameTime = (startTime?: string): string => {
  try {
    if (!startTime) return "TBD";
    const date = new Date(startTime);
    if (isNaN(date.getTime())) return "TBD";
    
    // Better mobile formatting with responsive time display
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }) + ' at ' + date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit'
      // Removed timeZoneName: 'short' - this was causing crashes
    });
  } catch {
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
  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<{
    market: 'moneyline' | 'spread' | 'total';
    selection: string;
    line?: number;
  } | null>(null);
  const [manualEntry, setManualEntry] = useState({
    market: 'moneyline' as 'moneyline' | 'spread' | 'total',
    selection: '',
    line: '',
    odds: '',
    units: 1
  });
  const [betUnit, setBetUnit] = useState(50);

  const handleMakePick = (event: React.MouseEvent, market: 'moneyline' | 'spread' | 'total', selection: string, line?: number) => {
    try {
      // Prevent the card click event from firing
      event.stopPropagation();
      event.preventDefault();
      
      if (!rawBookmakers || rawBookmakers.length === 0) {
        console.warn('No bookmakers data available for odds comparison');
        alert('No betting odds available for this game yet. Please try again later.');
        return;
      }

      // Reset modal state
      setOddsModalOpen(false);
      setSelectedBet(null);
      
      // Small delay to ensure old modal is closed before opening new one
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
    // Format as American odds
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
    <Card 
      className="hover:shadow-lg transition-shadow duration-200 border border-gray-200 dark:border-gray-700"
    >
      <CardContent className="p-3 sm:p-4">
        {/* Mobile-first header layout */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 sm:mb-3 gap-1 sm:gap-2">
          <div className="flex items-center gap-2">
            {isLive && (
              <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                LIVE
              </Badge>
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {(() => {
                try {
                  if (!startTime) return "TBD";
                  const date = new Date(startTime);
                  return !isNaN(date.getTime()) ? date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : "TBD";
                } catch {
                  return "TBD";
                }
              })()}
            </span>
          </div>
        </div>

        {/* Mobile-optimized Header with Pick Column */}
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
                  <span className="text-gray-400 dark:text-gray-500 text-xs sm:text-sm">
                    TBD
                  </span>
                )}
              </span>
            </div>

            <div className="flex items-center justify-center">
              {awayOdds && (
                <Button
                  size="sm"
                  onClick={(e) => handleMakePick(e, 'moneyline', awayTeam)}
                  className="text-xs px-2 sm:px-3 py-1 h-6 sm:h-7 text-white border-0 font-semibold shadow-sm hover:opacity-90 touch-manipulation"
                  style={{ backgroundColor: getTeamColor(awayTeam), WebkitTapHighlightColor: 'transparent' }}
                >
                  Pick
                </Button>
              )}
            </div>

            <div className="flex items-center justify-center">
              {isDailyPick && dailyPickTeam === awayTeam ? (
                <div className="relative">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center cursor-pointer border text-white">
                    <span className="text-xs font-bold">{dailyPickGrade || "A+"}</span>
                  </div>
                </div>
              ) : isAuthenticated && lockPickTeam === awayTeam ? (
                <div className="relative">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center cursor-pointer border text-white">
                    <span className="text-xs font-bold">{lockPickGrade || "A+"}</span>
                  </div>
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
                  <span className="text-gray-400 dark:text-gray-500 text-xs sm:text-sm">
                    TBD
                  </span>
                )}
              </span>
            </div>

            <div className="flex items-center justify-center">
              {homeOdds && (
                <Button
                  size="sm"
                  onClick={(e) => handleMakePick(e, 'moneyline', homeTeam)}
                  className="text-xs px-2 sm:px-3 py-1 h-6 sm:h-7 text-white border-0 font-semibold shadow-sm hover:opacity-90 touch-manipulation"
                  style={{ backgroundColor: getTeamColor(homeTeam), WebkitTapHighlightColor: 'transparent' }}
                >
                  Pick
                </Button>
              )}
            </div>

            <div className="flex items-center justify-center">
              {isDailyPick && dailyPickTeam === homeTeam ? (
                <div className="relative">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center cursor-pointer border text-white">
                    <span className="text-xs font-bold">{dailyPickGrade || "A+"}</span>
                  </div>
                </div>
              ) : isAuthenticated && lockPickTeam === homeTeam ? (
                <div className="relative">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center cursor-pointer border text-white">
                    <span className="text-xs font-bold">{lockPickGrade || "A+"}</span>
                  </div>
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
          {/* Mobile: Side-by-side Spread and Total, Desktop: Separated */}
          
          {/* Mobile Layout: Spread and Total side by side */}
          <div className="flex sm:hidden gap-1">
            {/* Spread Section - Left Half */}
            <div className="flex-1 text-center space-y-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">Spread</p>
              {spread !== undefined && spread !== null ? (
                <>
                  {(() => {
                    // Determine which team is favored (negative spread = favored)
                    const isFavoredHome = spread < 0;
                    const favoredTeam = isFavoredHome ? homeTeam : awayTeam;
                    const favoredSpread = Math.abs(spread);
                    
                    return (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-900 dark:text-white">
                          {favoredTeam} -{favoredSpread}
                        </p>
                        <div className="flex gap-1 justify-center">
                          <Button
                            size="sm"
                            onClick={(e) => handleMakePick(e, 'spread', favoredTeam, -favoredSpread)}
                            className="text-xs px-1.5 py-1 h-6 bg-green-600 hover:bg-green-700 text-white border-0 font-semibold shadow-sm touch-manipulation"
                            style={{ WebkitTapHighlightColor: 'transparent' }}
                          >
                            Pick
                          </Button>
                          <Button
                            size="sm"
                            onClick={(e) => handleMakePick(e, 'spread', isFavoredHome ? awayTeam : homeTeam, favoredSpread)}
                            className="text-xs px-1.5 py-1 h-6 bg-red-600 hover:bg-red-700 text-white border-0 font-semibold shadow-sm touch-manipulation"
                            style={{ WebkitTapHighlightColor: 'transparent' }}
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
                  <p className="text-xs font-medium text-gray-400 dark:text-gray-500">
                    Spread TBD
                  </p>
                  <div className="flex gap-1 justify-center">
                    <Button
                      size="sm"
                      disabled
                      className="text-xs px-1.5 py-1 h-6 opacity-50 cursor-not-allowed bg-gray-300 dark:bg-gray-600 text-gray-500"
                    >
                      Pick
                    </Button>
                    <Button
                      size="sm"
                      disabled
                      className="text-xs px-1.5 py-1 h-6 opacity-50 cursor-not-allowed bg-gray-300 dark:bg-gray-600 text-gray-500"
                    >
                      Fade
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Total Section - Right Half */}
            <div className="flex-1 text-center space-y-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
              {total !== undefined && total !== null ? (
                <>
                  <p className="text-xs font-medium text-gray-900 dark:text-white">
                    O/U {total}
                  </p>
                  <div className="flex gap-1 justify-center">
                    <Button
                      size="sm"
                      onClick={(e) => handleMakePick(e, 'total', 'Over', total)}
                      className="text-xs px-2 py-1 h-6 bg-green-600 hover:bg-green-700 text-white border-0 font-semibold shadow-sm"
                    >
                      O
                    </Button>
                    <Button
                      size="sm"
                      onClick={(e) => handleMakePick(e, 'total', 'Under', total)}
                      className="text-xs px-2 py-1 h-6 bg-red-600 hover:bg-red-700 text-white border-0 font-semibold shadow-sm"
                    >
                      U
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs font-medium text-gray-400 dark:text-gray-500">
                    O/U TBD
                  </p>
                  <div className="flex gap-1 justify-center">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled
                      className="text-xs px-2 py-1 h-6 opacity-50 cursor-not-allowed"
                    >
                      O
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled
                      className="text-xs px-2 py-1 h-6 opacity-50 cursor-not-allowed"
                    >
                      U
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Desktop Layout: Spread and Total separated */}
          <div className="hidden sm:flex sm:justify-between sm:items-center gap-3">
            {/* Spread Section */}
            <div className="text-center space-y-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">Spread</p>
              {spread !== undefined && spread !== null ? (
                <>
                  {(() => {
                    // Determine which team is favored (negative spread = favored)
                    const isFavoredHome = spread < 0;
                    const favoredTeam = isFavoredHome ? homeTeam : awayTeam;
                    const favoredSpread = Math.abs(spread);
                    
                    return (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {favoredTeam} -{favoredSpread}
                        </p>
                        <div className="flex gap-1 justify-center">
                          <Button
                            size="sm"
                            onClick={(e) => handleMakePick(e, 'spread', favoredTeam, -favoredSpread)}
                            className="text-xs px-2 py-1 h-6 bg-green-600 hover:bg-green-700 text-white border-0 font-semibold shadow-sm"
                          >
                            Pick
                          </Button>
                          <Button
                            size="sm"
                            onClick={(e) => handleMakePick(e, 'spread', isFavoredHome ? awayTeam : homeTeam, favoredSpread)}
                            className="text-xs px-2 py-1 h-6 bg-red-600 hover:bg-red-700 text-white border-0 font-semibold shadow-sm"
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
                  <p className="text-sm font-medium text-gray-400 dark:text-gray-500">
                    Spread TBD
                  </p>
                  <div className="flex gap-1 justify-center">
                    <Button
                      size="sm"
                      disabled
                      className="text-xs px-2 py-1 h-6 opacity-50 cursor-not-allowed bg-gray-300 dark:bg-gray-600 text-gray-500"
                    >
                      Pick
                    </Button>
                    <Button
                      size="sm"
                      disabled
                      className="text-xs px-2 py-1 h-6 opacity-50 cursor-not-allowed bg-gray-300 dark:bg-gray-600 text-gray-500"
                    >
                      Fade
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Total Section */}
            <div className="text-center space-y-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
              {total !== undefined && total !== null ? (
                <>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    O/U {total}
                  </p>
                  <div className="flex gap-1 justify-center">
                    <Button
                      size="sm"
                      onClick={(e) => handleMakePick(e, 'total', 'Over', total)}
                      className="text-xs px-2 py-1 h-6 bg-green-600 hover:bg-green-700 text-white border-0 font-semibold shadow-sm"
                    >
                      O
                    </Button>
                    <Button
                      size="sm"
                      onClick={(e) => handleMakePick(e, 'total', 'Under', total)}
                      className="text-xs px-2 py-1 h-6 bg-red-600 hover:bg-red-700 text-white border-0 font-semibold shadow-sm"
                    >
                      U
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-400 dark:text-gray-500">
                    O/U TBD
                  </p>
                  <div className="flex gap-1 justify-center">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled
                      className="text-xs px-1 py-1 h-6 opacity-50 cursor-not-allowed"
                    >
                      O
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled
                      className="text-xs px-1 py-1 h-6 opacity-50 cursor-not-allowed"
                    >
                      U
                    </Button>
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

        {/* Game Info Button - Bottom Center */}
        <div className="mt-3 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setGameDetailsOpen(true);
            }}
            className="text-xs px-2 py-1 h-6 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Info className="w-3 h-3 mr-1" />
            Game Info
          </Button>
        </div>

      </CardContent>
      
      {/* Odds Comparison Modal */}
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

      {/* Game Details Modal */}
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
