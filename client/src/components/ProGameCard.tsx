import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getTeamColor } from "@/utils/teamLogos";
import { Clock, Target } from "lucide-react";
import { OddsComparisonModal } from "./OddsComparisonModal";
import { getGradeColorClasses } from "@/lib/factorUtils";

interface ProPickData {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  pickTeam: string;
  grade: string;
  confidence: number;
  reasoning: string;
  odds: number;
}

interface ProGameCardProps {
  homeTeam: string;
  awayTeam: string;
  homeOdds?: number;
  awayOdds?: number;
  spread?: number;
  total?: number;
  startTime?: string;
  gameId?: string | number;
  probablePitchers?: {
    home: string | null;
    away: string | null;
  };
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

// Pro Grade Bubble - same style as ActionStyleGameCard
function ProGradeBubble({ grade }: { grade: string }) {
  const colorClasses = getGradeColorClasses(grade);
  
  return (
    <div 
      className={`${colorClasses.bg} ${colorClasses.text} ${colorClasses.border} w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer border`}
      onClick={(e) => e.stopPropagation()}
    >
      <span className="text-xs font-bold">
        {grade}
      </span>
    </div>
  );
}

export function ProGameCard({
  homeTeam,
  awayTeam,
  homeOdds,
  awayOdds,
  spread,
  total,
  startTime,
  gameId,
  probablePitchers,
  rawBookmakers,
}: ProGameCardProps) {
  const [oddsModalOpen, setOddsModalOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<{
    market: 'moneyline' | 'spread' | 'total';
    selection: string;
    line?: number;
  } | null>(null);

  // Fetch Pro pick data for this game
  const { data: proPick, isLoading: proPickLoading } = useQuery<ProPickData>({
    queryKey: [`/api/pro/game/${gameId}/analysis`],
    enabled: !!gameId,
    retry: false,
  });

  const formatOdds = (odds?: number) => {
    if (!odds) return "TBD";
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  const handleMakePick = (event: React.MouseEvent, market: 'moneyline' | 'spread' | 'total', selection: string, line?: number) => {
    event.stopPropagation();
    setSelectedBet({ market, selection, line });
    setOddsModalOpen(true);
  };

  // Determine if this team is the Pro pick
  const isProPickTeam = (teamName: string) => {
    return proPick?.pickTeam === teamName;
  };

  return (
    <>
      <Card 
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200 cursor-pointer group"
        onClick={() => {}}
      >
        <CardContent className="p-3 sm:p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                MLB
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {startTime ? new Date(startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : "TBD"}
              </span>
            </div>
          </div>

          {/* Mobile-optimized Header with Pick Column */}
          <div className="grid grid-cols-5 gap-1 sm:gap-2 mb-2 sm:mb-3 text-xs text-gray-500 dark:text-gray-400">
            <div className="col-span-2 text-xs">Teams</div>
            <div className="text-center text-xs sm:text-sm">Odds</div>
            <div className="text-center text-xs sm:text-sm">Pick</div>
            <div className="text-center text-xs">Pro Pick</div>
          </div>

          {/* Teams and Odds */}
          <div className="space-y-2 sm:space-y-3">
            {/* Away Team */}
            <div className="grid grid-cols-5 gap-1 sm:gap-2 items-center">
              <div className="col-span-2 flex items-center gap-2 sm:gap-3">
                <div 
                  className="w-3 h-3 sm:w-4 sm:h-4 rounded-full shadow-sm flex-shrink-0" 
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
                {proPickLoading ? (
                  <div className="animate-pulse bg-gray-200 dark:bg-gray-700 w-8 h-8 rounded-lg"></div>
                ) : isProPickTeam(awayTeam) ? (
                  <ProGradeBubble grade={proPick?.grade || "C+"} />
                ) : (
                  <span className="text-xs text-gray-400 dark:text-gray-500">-</span>
                )}
              </div>
            </div>

            {/* Home Team */}
            <div className="grid grid-cols-5 gap-1 sm:gap-2 items-center">
              <div className="col-span-2 flex items-center gap-2 sm:gap-3">
                <div 
                  className="w-3 h-3 sm:w-4 sm:h-4 rounded-full shadow-sm flex-shrink-0" 
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
                {proPickLoading ? (
                  <div className="animate-pulse bg-gray-200 dark:bg-gray-700 w-8 h-8 rounded-lg"></div>
                ) : isProPickTeam(homeTeam) ? (
                  <ProGradeBubble grade={proPick?.grade || "C+"} />
                ) : (
                  <span className="text-xs text-gray-400 dark:text-gray-500">-</span>
                )}
              </div>
            </div>
          </div>

          {/* Betting Lines - Same as ActionStyleGameCard */}
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
                          <div className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                            {favoredTeam} -{favoredSpread}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={(e) => handleMakePick(e, 'spread', favoredTeam, -favoredSpread)}
                              className="flex-1 text-xs px-1.5 py-1 h-6 text-white bg-green-600 hover:bg-green-700 border-0 font-semibold shadow-sm touch-manipulation"
                            >
                              -{favoredSpread}
                            </Button>
                            <Button
                              size="sm"
                              onClick={(e) => handleMakePick(e, 'spread', isFavoredHome ? awayTeam : homeTeam, favoredSpread)}
                              className="flex-1 text-xs px-1.5 py-1 h-6 text-white bg-red-600 hover:bg-red-700 border-0 font-semibold shadow-sm touch-manipulation"
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
                        className="flex-1 text-xs px-2 py-1 h-6 text-white bg-green-600 hover:bg-green-700 border-0 font-semibold shadow-sm touch-manipulation"
                      >
                        O
                      </Button>
                      <Button
                        size="sm"
                        onClick={(e) => handleMakePick(e, 'total', 'Under', total)}
                        className="flex-1 text-xs px-2 py-1 h-6 text-white bg-red-600 hover:bg-red-700 border-0 font-semibold shadow-sm touch-manipulation"
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
                    // Determine which team is favored (negative spread = favored)
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

          {/* Probable Pitchers - Same as ActionStyleGameCard */}
          {probablePitchers && (probablePitchers.home || probablePitchers.away) && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <div className="ml-6">Away: {probablePitchers.away || "TBD"}</div>
                <div className="ml-6">Home: {probablePitchers.home || "TBD"}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Odds Modal */}
      {oddsModalOpen && selectedBet && rawBookmakers && (
        <OddsComparisonModal
          open={oddsModalOpen}
          onClose={() => setOddsModalOpen(false)}
          gameInfo={{
            homeTeam,
            awayTeam,
            gameId: gameId?.toString() || "",
            sport: "baseball_mlb"
          }}
          bookmakers={rawBookmakers}
          selectedBet={selectedBet}
        />
      )}
    </>
  );
}