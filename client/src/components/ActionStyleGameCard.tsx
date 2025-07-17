import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { getTeamColor } from "@/utils/teamLogos";
import { Clock, TrendingUp, TrendingDown, Users, Lock, Target, Info } from "lucide-react";
import { OddsComparisonModal } from "./OddsComparisonModal";

// Analysis interfaces (simplified for ActionStyleGameCard)

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
  // Raw bookmakers data for odds comparison
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

// Helper functions for analysis

function scoreToGrade(score: number): string {
  if (score >= 95) return 'A+';
  if (score >= 88) return 'A';
  if (score >= 83) return 'B+';
  if (score >= 78) return 'B';
  if (score >= 73) return 'C+';
  if (score >= 68) return 'C';
  if (score >= 63) return 'D+';
  return 'D';
}

// Info Button Component for Bet Bot picks - opens detailed analysis dialog
function InfoButton({ pickId, pickType }: { pickId?: string; pickType?: 'daily' | 'lock' }) {
  const { data: analysisData } = useQuery({
    queryKey: [`/api/daily-pick/${pickId}/analysis`],
    enabled: !!pickId && !!pickType,
  });

  // Factor information mapping
  const getFactorInfo = (key: string): string => {
    const factorDescriptions: Record<string, string> = {
      bettingValue: "Analysis of odds value comparing our probability model to available betting lines and market efficiency.",
      fieldValue: "Stadium factors including dimensions, homefield advantage, and how the stadium favors hitters and pitchers.",
      pitchingEdge: "Probable pitcher analysis comparing ERA, strikeout rates, and recent form between starters.",
      recentForm: "Team performance over last 10 games including wins, runs scored, and momentum indicators.",
      weatherImpact: "Wind speed/direction, temperature, and humidity effects on ball flight and overall scoring.",
      offensiveEdge: "Team batting strength based on wOBA, barrel rate, and exit velocity metrics from recent games."
    };
    return factorDescriptions[key] || "Analysis factor description not available.";
  };

  const getFactorTitle = (key: string): string => {
    const factorTitles: Record<string, string> = {
      bettingValue: "Betting Value",
      fieldValue: "Field Value",
      pitchingEdge: "Pitching Edge",
      recentForm: "Recent Form",
      weatherImpact: "Weather Impact",
      offensiveEdge: "Offensive Edge"
    };
    return factorTitles[key] || key;
  };

  const scoreToGrade = (score: number): string => {
    if (score >= 95) return 'A+';
    if (score >= 88) return 'A';
    if (score >= 83) return 'B+';
    if (score >= 78) return 'B';
    if (score >= 73) return 'C+';
    if (score >= 68) return 'C';
    if (score >= 63) return 'D+';
    return 'D';
  };

  if (!pickId || !pickType || !analysisData) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="p-0 h-5 w-5 bg-transparent hover:bg-gray-100 dark:bg-black/80 dark:hover:bg-black/90 rounded-full flex items-center justify-center">
            <Info className="h-3 w-3 text-black dark:text-white" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3 text-xs" side="top">
          <div className="font-medium mb-1">Bet Bot AI Analysis</div>
          <div>Our AI analyzes 6 key factors including pitching matchups, offensive power, recent team form, ballpark effects, weather conditions, and betting value to generate grade-based recommendations for each game.</div>
        </PopoverContent>
      </Popover>
    );
  }

  const factors = [
    { key: 'bettingValue', score: analysisData.bettingValue },
    { key: 'fieldValue', score: analysisData.fieldValue },
    { key: 'pitchingEdge', score: analysisData.pitchingEdge },
    { key: 'recentForm', score: analysisData.recentForm },
    { key: 'weatherImpact', score: analysisData.weatherImpact },
    { key: 'offensiveEdge', score: analysisData.offensiveEdge }
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="p-0 h-5 w-5 bg-transparent hover:bg-gray-100 dark:bg-black/80 dark:hover:bg-black/90 rounded-full flex items-center justify-center">
          <Info className="h-3 w-3 text-black dark:text-white" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 text-xs" side="top">
        <div className="font-medium mb-3">Analysis Factors</div>
        <div className="space-y-3">
          {factors.map(({ key, score }) => (
            <div key={key} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium">{getFactorTitle(key)}</span>
                <span className="font-bold">{score !== null && score > 0 ? `${scoreToGrade(score)} (${score}/100)` : 'N/A'}</span>
              </div>
              <Progress value={score} className="h-1" />
              <p className="text-xs text-gray-500 dark:text-gray-400">{getFactorInfo(key)}</p>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Color-schemed grade bubble component for Bet Bot picks
function GradeBubble({ grade }: { grade: string }) {
  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-green-500';
    if (grade.startsWith('B')) return 'bg-blue-500';
    if (grade.startsWith('C')) return 'bg-yellow-500';
    if (grade.startsWith('D')) return 'bg-orange-500';
    return 'bg-gray-500';
  };

  return (
    <div className={`${getGradeColor(grade)} w-8 h-8 rounded-lg flex items-center justify-center`}>
      <span className="text-white text-xs font-bold">
        {grade}
      </span>
    </div>
  );
}

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
  const [selectedBet, setSelectedBet] = useState<{
    market: 'moneyline' | 'spread' | 'total';
    selection: string;
    line?: number;
  } | null>(null);

  const handleMakePick = (event: React.MouseEvent, market: 'moneyline' | 'spread' | 'total', selection: string, line?: number) => {
    // Prevent the card click event from firing
    event.stopPropagation();
    
    if (!rawBookmakers || rawBookmakers.length === 0) {
      console.warn('No bookmakers data available for odds comparison');
      return;
    }

    // Close any existing modal first to prevent overlap
    setOddsModalOpen(false);
    
    // Small delay to ensure old modal is closed before opening new one
    setTimeout(() => {
      setSelectedBet({ market, selection, line });
      setOddsModalOpen(true);
    }, 50);
  };

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : `${odds}`;
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
      className="hover:shadow-lg transition-shadow duration-200 border border-gray-200 dark:border-gray-700 cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isLive && (
              <Badge variant="destructive" className="text-xs px-2">
                LIVE
              </Badge>
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {startTime || "TBD"}
            </span>
          </div>
          

        </div>

        {/* Header with Bet Bot Pick Column */}
        <div className="grid grid-cols-4 gap-2 mb-3 text-xs text-gray-500 dark:text-gray-400">
          <div className="col-span-2">Teams</div>
          <div className="text-center">Odds</div>
          <div className="text-center">Bet Bot Pick</div>
        </div>

        {/* Teams and Odds */}
        <div className="space-y-3">
          {/* Away Team */}
          <div className="grid grid-cols-4 gap-2 items-center">
            <div className="col-span-2 flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded-full shadow-sm" 
                style={{ backgroundColor: getTeamColor(awayTeam) }}
              />
              <p className="font-medium text-gray-900 dark:text-white">{awayTeam}</p>
            </div>
            
            <div className="text-center">
              <div className="text-sm font-bold text-gray-900 dark:text-white flex items-center justify-between">
                <span className="flex-1">{awayOdds ? formatOdds(awayOdds) : (
                  <span className="text-gray-400 dark:text-gray-500 text-xs">
                    Lines not posted
                  </span>
                )}</span>
                <div className="w-16 flex justify-end">
                  {awayOdds && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => handleMakePick(e, 'moneyline', awayTeam)}
                      className="text-xs px-2 py-1 h-6"
                    >
                      <Target className="w-3 h-3 mr-1" />
                      Pick
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="text-center">
              {isDailyPick && dailyPickTeam === awayTeam ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-8 flex justify-center">
                    <GradeBubble grade={dailyPickGrade || "C+"} />
                  </div>
                  <InfoButton pickId={dailyPickId} pickType="daily" />
                </div>
              ) : isAuthenticated && lockPickTeam === awayTeam ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-8 flex justify-center">
                    <GradeBubble grade={lockPickGrade || "C+"} />
                  </div>
                  <InfoButton pickId={lockPickId} pickType="lock" />
                </div>
              ) : isDailyPick || (isAuthenticated && lockPickTeam) ? (
                <span className="text-xs text-gray-400 dark:text-gray-500">-</span>
              ) : (
                <div className="flex items-center justify-center">
                  <Lock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                </div>
              )}
            </div>
          </div>

          {/* Home Team */}
          <div className="grid grid-cols-4 gap-2 items-center">
            <div className="col-span-2 flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded-full shadow-sm" 
                style={{ backgroundColor: getTeamColor(homeTeam) }}
              />
              <p className="font-medium text-gray-900 dark:text-white">{homeTeam}</p>
            </div>
            
            <div className="text-center">
              <div className="text-sm font-bold text-gray-900 dark:text-white flex items-center justify-between">
                <span className="flex-1">{homeOdds ? formatOdds(homeOdds) : (
                  <span className="text-gray-400 dark:text-gray-500 text-xs">
                    Lines not posted
                  </span>
                )}</span>
                <div className="w-16 flex justify-end">
                  {homeOdds && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => handleMakePick(e, 'moneyline', homeTeam)}
                      className="text-xs px-2 py-1 h-6"
                    >
                      <Target className="w-3 h-3 mr-1" />
                      Pick
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="text-center">
              {isDailyPick && dailyPickTeam === homeTeam ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-8 flex justify-center">
                    <GradeBubble grade={dailyPickGrade || "C+"} />
                  </div>
                  <InfoButton pickId={dailyPickId} pickType="daily" />
                </div>
              ) : isAuthenticated && lockPickTeam === homeTeam ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-8 flex justify-center">
                    <GradeBubble grade={lockPickGrade || "C+"} />
                  </div>
                  <InfoButton pickId={lockPickId} pickType="lock" />
                </div>
              ) : isDailyPick || (isAuthenticated && lockPickTeam) ? (
                <span className="text-xs text-gray-400 dark:text-gray-500">-</span>
              ) : (
                <div className="flex items-center justify-center">
                  <Lock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Betting Lines */}
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
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
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => handleMakePick(e, 'spread', favoredTeam, -favoredSpread)}
                          className="text-xs px-2 py-1 h-6 bg-green-50 hover:bg-green-100 dark:bg-green-900 dark:hover:bg-green-800 text-green-700 dark:text-green-300"
                        >
                          Pick
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => handleMakePick(e, 'spread', isFavoredHome ? awayTeam : homeTeam, favoredSpread)}
                          className="text-xs px-2 py-1 h-6 bg-red-50 hover:bg-red-100 dark:bg-red-900 dark:hover:bg-red-800 text-red-700 dark:text-red-300"
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
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled
                    className="text-xs px-2 py-1 h-6 opacity-50 cursor-not-allowed"
                  >
                    Pick
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled
                    className="text-xs px-2 py-1 h-6 opacity-50 cursor-not-allowed"
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
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => handleMakePick(e, 'total', 'Over', total)}
                    className="text-xs px-1 py-1 h-6"
                  >
                    O
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => handleMakePick(e, 'total', 'Under', total)}
                    className="text-xs px-1 py-1 h-6"
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
                <div className="flex gap-1">
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
    </Card>
  );
}