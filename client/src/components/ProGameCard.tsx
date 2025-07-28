import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getTeamColor } from "@/utils/teamLogos";
import { Clock, Target } from "lucide-react";
import { OddsComparisonModal } from "./OddsComparisonModal";
import { getGradeColorClasses, scoreToGrade } from "@/lib/factorUtils";
import { ColoredProgress } from "@/components/ui/colored-progress";

interface ProPickData {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  pickTeam: string;
  grade: string;
  confidence: number;
  reasoning: string;
  odds: number;
  analysis?: {
    marketInefficiency?: number;
    situationalEdge?: number;
    pitchingMatchup?: number;
    teamMomentum?: number;
    systemConfidence?: number;
    offensiveProduction?: number;
  };
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

// Pro Grade Bubble with factor analysis modal
function ProGradeBubble({ grade, proPick }: { grade: string; proPick?: ProPickData }) {
  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false);
  const colorClasses = getGradeColorClasses(grade);
  
  // Extract factor scores from proPick if available
  const getFactors = () => {
    if (!proPick?.analysis) {
      // Default factors if no analysis available
      return [
        { key: 'marketInefficiency', title: 'Market Edge', score: 75, info: 'Advanced betting value analysis using Kelly Criterion and market efficiency indicators to identify profitable opportunities.' },
        { key: 'situationalEdge', title: 'Situational Edge', score: 75, info: 'Comprehensive situational factors including ballpark dimensions, home field advantage, travel fatigue, and game timing effects.' },
        { key: 'pitchingMatchup', title: 'Pitching Matchup', score: 75, info: 'Starting pitcher effectiveness analysis comparing ERA, WHIP, strikeout rates, and recent performance trends.' },
        { key: 'teamMomentum', title: 'Team Momentum', score: 75, info: 'Multi-layered momentum analysis from official MLB Stats API comparing recent performance trends, L10 vs season form, and directional momentum shifts.' },
        { key: 'systemConfidence', title: 'System Confidence', score: 75, info: 'Model certainty based on data quality, factor consensus, and information completeness - higher scores indicate stronger analytical foundation.' },
        { key: 'offensiveProduction', title: 'Offensive Production', score: 75, info: 'Advanced run-scoring analysis combining Baseball Savant metrics (xwOBA, barrel rate, exit velocity) with team production efficiency from 2025 season data.' }
      ];
    }
    
    const analysis = proPick.analysis;
    return [
      { key: 'marketInefficiency', title: 'Market Edge', score: analysis.marketInefficiency || 75, info: 'Advanced betting value analysis using Kelly Criterion and market efficiency indicators to identify profitable opportunities.' },
      { key: 'situationalEdge', title: 'Situational Edge', score: analysis.situationalEdge || 75, info: 'Comprehensive situational factors including ballpark dimensions, home field advantage, travel fatigue, and game timing effects.' },
      { key: 'pitchingMatchup', title: 'Pitching Matchup', score: analysis.pitchingMatchup || 75, info: 'Starting pitcher effectiveness analysis comparing ERA, WHIP, strikeout rates, and recent performance trends.' },
      { key: 'teamMomentum', title: 'Team Momentum', score: analysis.teamMomentum || 75, info: 'Multi-layered momentum analysis from official MLB Stats API comparing recent performance trends, L10 vs season form, and directional momentum shifts.' },
      { key: 'systemConfidence', title: 'System Confidence', score: analysis.systemConfidence || 75, info: 'Model certainty based on data quality, factor consensus, and information completeness - higher scores indicate stronger analytical foundation.' },
      { key: 'offensiveProduction', title: 'Offensive Production', score: analysis.offensiveProduction || 75, info: 'Advanced run-scoring analysis combining Baseball Savant metrics (xwOBA, barrel rate, exit velocity) with team production efficiency from 2025 season data.' }
    ];
  };
  
  return (
    <>
      <div className="relative">
        <div 
          className={`${colorClasses.bg} ${colorClasses.text} ${colorClasses.border} w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer border`}
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-xs font-bold">
            {grade}
          </span>
        </div>
        {proPick && (
          <Dialog open={analysisDialogOpen} onOpenChange={setAnalysisDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="absolute -top-1 -right-1 p-1 h-3 w-3 bg-black dark:bg-gray-800 text-white hover:bg-gray-800 dark:hover:bg-gray-700 rounded-full flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-[8px] font-bold">i</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <Target className="w-6 h-6" />
                  <span>Pro Pick Analysis: {grade} Grade</span>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3">Pick Details</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Game:</strong> {proPick.awayTeam} @ {proPick.homeTeam}</div>
                    <div><strong>Pick:</strong> {proPick.pickTeam} ML {proPick.odds > 0 ? `+${proPick.odds}` : proPick.odds}</div>
                    <div><strong>Grade:</strong> {proPick.grade}</div>
                    <div><strong>Confidence:</strong> {proPick.confidence}%</div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                  <h4 className="font-semibold mb-3">Analysis Factors</h4>
                  <div className="space-y-3">
                    {getFactors().map(({ key, title, score, info }) => (
                      <div key={key} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{title}</span>
                          <span className="font-bold">{score !== null && score > 0 ? `${scoreToGrade(score)} (${score}/100)` : 'N/A'}</span>
                        </div>
                        <ColoredProgress value={score} className="h-2" />
                        <p className="text-xs text-gray-500 dark:text-gray-400">{info}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </>
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
    staleTime: 15 * 60 * 1000, // Consider data fresh for 15 minutes (same as server cache)
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchInterval: false, // Disable automatic refetching
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
                  <ProGradeBubble grade={proPick?.grade || "C+"} proPick={proPick} />
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
                  <ProGradeBubble grade={proPick?.grade || "C+"} proPick={proPick} />
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