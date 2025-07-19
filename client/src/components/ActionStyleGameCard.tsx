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
import { getTeamColor } from "@/utils/teamLogos";
import { Clock, TrendingUp, TrendingDown, Users, Lock, Target, Info, Plus } from "lucide-react";
import { OddsComparisonModal } from "./OddsComparisonModal";
import { GameDetailsModal } from "./GameDetailsModal";
import { getFactorColorClasses, getFactorTooltip, getGradeColorClasses, getMainGradeExplanation } from "@/lib/factorUtils";
import { pickStorage } from '@/services/pickStorage';
import { databasePickStorage } from '@/services/databasePickStorage';
import { Pick } from '@/types/picks';

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

// Color-coded Progress Component
function ColoredProgress({ value, className }: { value: number | null; className?: string }) {
  if (value === null || value === undefined) {
    return <div className={`bg-gray-200 dark:bg-gray-700 rounded-full ${className}`}></div>;
  }

  const colorClasses = getFactorColorClasses(value);
  
  return (
    <div className={`bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${className}`}>
      <div 
        className={`h-full ${colorClasses.bg} transition-all duration-300`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

// Helper functions for analysis



// Info Button Component for Bet Bot picks - opens detailed analysis dialog
function InfoButton({ pickId, pickType }: { pickId?: string; pickType?: 'daily' | 'lock' }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const { data: analysisData } = useQuery({
    queryKey: [`/api/daily-pick/${pickId}/analysis`],
    enabled: !!pickId && !!pickType,
  });

  const { data: pickData } = useQuery({
    queryKey: pickType === 'daily' ? ['/api/daily-pick'] : ['/api/daily-pick/lock'],
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
    if (score >= 90) return 'A';
    if (score >= 85) return 'B+';
    if (score >= 80) return 'B';
    if (score >= 75) return 'C+';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  const getGradeExplanation = (score: number, factorTitle: string): string => {
    // Customized explanations based on factor type matching user specifications
    switch (factorTitle) {
      case 'Betting Value':
        if (score >= 90) return 'Exceptional edge; line is mispriced in our favor';
        if (score >= 80) return 'Solid value; odds slightly undervalue our side';
        if (score >= 75) return 'Market-efficient or neutral';
        return 'Little or no edge vs. market';
        
      case 'Field Value':
        if (score >= 85) return 'Strong field factor benefiting this team';
        if (score >= 75) return 'Slight to moderate favorable conditions';
        if (score === 75) return 'Neutral ballpark effect';
        return 'Stadium may favor opponent or suppress performance';
        
      case 'Pitching Edge':
        if (score >= 85) return 'Clear pitching advantage';
        if (score >= 75) return 'Above average edge';
        if (score === 75) return 'Even matchup or average starter';
        return 'Possible disadvantage on the mound';
        
      case 'Recent Form':
        if (score >= 90) return 'Team is red-hot';
        if (score >= 80) return 'Consistently strong recent play';
        if (score >= 75) return 'Neutral form or .500 record';
        return 'Cold streak or downward trend';
        
      case 'Weather Impact':
        if (score >= 85) return 'Conditions significantly favor our side (e.g., wind out for hitters)';
        if (score >= 75) return 'Slightly favorable weather';
        if (score === 75) return 'Neutral conditions';
        return 'Weather may hurt our team\'s strengths';
        
      case 'Offensive Edge':
        if (score >= 85) return 'Elite recent batting metrics';
        if (score >= 75) return 'Slight offensive edge';
        if (score === 75) return 'Even matchup';
        return 'Opponent may have better bats';
        
      default:
        // Fallback to generic explanation
        if (score >= 90) return 'Elite performance';
        if (score >= 80) return 'Strong performance';
        if (score >= 75) return 'Neutral baseline';
        return 'Disadvantage';
    }
  };

  const calculateOverallGrade = () => {
    if (!analysisData) return 'C+';
    
    // Use the grade from the API if available
    if (analysisData.overall?.grade) {
      return analysisData.overall.grade;
    }
    
    // Use confidence score if available
    if (analysisData.overall?.confidence) {
      return scoreToGrade(analysisData.overall.confidence);
    }
    
    // Fallback to calculating from individual factor scores
    const scores = [
      analysisData.factors?.valueScore?.score,
      analysisData.factors?.ballparkFactor?.score,
      analysisData.factors?.pitchingMatchup?.score,
      analysisData.factors?.situationalEdge?.score,
      analysisData.factors?.weatherImpact?.score,
      analysisData.factors?.offensiveEdge?.score
    ].filter(score => score !== null && score !== undefined && !isNaN(score) && score > 0);
    
    if (scores.length === 0) return 'C+';
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return scoreToGrade(average);
  };

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : odds.toString();
  };

  const formatGameTime = (startTime: string) => {
    const date = new Date(startTime);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }) + ' at ' + date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  if (!pickId || !pickType) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-0 h-4 w-4 bg-black dark:bg-gray-500 hover:bg-gray-800 dark:hover:bg-gray-400 rounded-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Info className="h-2.5 w-2.5 text-white dark:text-black" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3 text-xs" side="top">
          <div className="font-medium mb-1">Bet Bot AI Analysis</div>
          <div>Our AI analyzes 6 key factors including pitching matchups, offensive power, recent team form, ballpark effects, weather conditions, and betting value to generate grade-based recommendations for each game.</div>
        </PopoverContent>
      </Popover>
    );
  }

  if (!analysisData || !pickData) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-0 h-4 w-4 bg-black dark:bg-gray-500 hover:bg-gray-800 dark:hover:bg-gray-400 rounded-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Info className="h-2.5 w-2.5 text-white dark:text-black" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3 text-xs" side="top">
          <div className="font-medium mb-1">Loading Analysis...</div>
          <div>Loading pick analysis and details...</div>
        </PopoverContent>
      </Popover>
    );
  }

  const factors = [
    { 
      key: 'marketInefficiency', 
      score: analysisData.marketInefficiency || analysisData.factors?.marketEdge?.score,
      description: analysisData.factors?.marketEdge?.description
    },
    { 
      key: 'situationalEdge', 
      score: analysisData.situationalEdge || analysisData.factors?.situationalEdge?.score,
      description: analysisData.factors?.situationalEdge?.description
    },
    { 
      key: 'pitchingMatchup', 
      score: analysisData.pitchingMatchup || analysisData.factors?.pitchingMatchup?.score,
      description: analysisData.factors?.pitchingMatchup?.description
    },
    { 
      key: 'teamMomentum', 
      score: analysisData.teamMomentum || analysisData.factors?.teamMomentum?.score,
      description: analysisData.factors?.teamMomentum?.description
    },
    { 
      key: 'systemConfidence', 
      score: analysisData.systemConfidence || analysisData.factors?.systemConfidence?.score,
      description: analysisData.factors?.systemConfidence?.description
    },
    { 
      key: 'offensiveProduction', 
      score: analysisData.offensiveProduction || analysisData.factors?.offensiveProduction?.score,
      description: analysisData.factors?.offensiveProduction?.description
    }
  ];

  return (
    <>
      <Button 
        variant="ghost" 
        size="sm" 
        className="p-0 h-4 w-4 bg-black dark:bg-gray-500 hover:bg-gray-800 dark:hover:bg-gray-400 rounded-full flex items-center justify-center"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
      >
        <Info className="h-2.5 w-2.5 text-white dark:text-black" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pick Analysis: {calculateOverallGrade()} Grade</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Pick Details */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Pick Details</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Game:</span> {pickData.awayTeam || analysisData.gameDetails?.matchup?.split(' @ ')[0]} @ {pickData.homeTeam || analysisData.gameDetails?.matchup?.split(' @ ')[1]}</p>
                <p><span className="font-medium">Pick:</span> {pickData.pickTeam || analysisData.gameDetails?.pickTeam} ML {formatOdds(pickData.odds || analysisData.gameDetails?.odds)}</p>
                <p><span className="font-medium">Venue:</span> {pickData.venue || analysisData.gameDetails?.venue || 'TBD'}</p>
                <p><span className="font-medium">Time:</span> {pickData.gameTime ? formatGameTime(pickData.gameTime) : (analysisData.gameDetails?.gameTime ? formatGameTime(analysisData.gameDetails.gameTime) : 'TBD')}</p>
              </div>
            </div>

            {/* Grade Analysis */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Grade Analysis</h3>
              <pre className="text-sm leading-relaxed whitespace-pre-wrap font-mono">
                {getMainGradeExplanation(
                  pickData.grade || calculateOverallGrade(),
                  pickData.confidence || analysisData.overall?.confidence || 75,
                  analysisData,
                  pickData.pickTeam || analysisData.gameDetails?.pickTeam || '',
                  pickData.odds || analysisData.gameDetails?.odds || 0
                )}
              </pre>
            </div>

            {/* Analysis Factors */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Analysis Factors</h3>
              <div className="space-y-4">
                {factors.map(({ key, score, description }) => (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{getFactorTitle(key)}</span>
                      <span className="font-bold">{
                        score !== null && score !== undefined && !isNaN(score) && score > 0 
                          ? `${scoreToGrade(score)} (${score}/100)` 
                          : 'Analyzed'
                      }</span>
                    </div>
                    {score !== null && score !== undefined && !isNaN(score) && score > 0 ? (
                      <ColoredProgress value={score} className="h-2" />
                    ) : (
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    )}
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {getFactorTooltip(score || 75, getFactorTitle(key), {
                        isHomeGame: true,
                        opponentHandedness: 'RHP' as const,
                        starterERA: 4.2,
                        last10Record: '5-5',
                        offensiveStats: {
                          xwOBA: 0.320,
                          barrelRate: 6.0,
                          exitVelo: 86.8
                        }
                      }).split('\n\n')[0] || description || getFactorInfo(key)}
                    </p>
                    {score !== null && score !== undefined && !isNaN(score) && score > 0 && (
                      <div className="border-t pt-2 mt-2 text-xs text-gray-500 dark:text-gray-500">
                        <div className="font-medium mb-1">Grade Meaning:</div>
                        <div className="text-gray-700 dark:text-gray-300 mb-2">{getFactorTooltip(score, getFactorTitle(key), {
                          isHomeGame: true,
                          opponentHandedness: 'RHP' as const,
                          starterERA: 4.2,
                          last10Record: '5-5',
                          offensiveStats: {
                            xwOBA: 0.320,
                            barrelRate: 6.0,
                            exitVelo: 86.8
                          }
                        }).split('\n\n')[1] || getGradeExplanation(score, getFactorTitle(key))}</div>
                        <div className="mt-2 text-[10px] text-gray-400 dark:text-gray-400">
                          90+ = Elite | 80-89 = Strong | 75 = Neutral baseline | &lt;75 = Disadvantage
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Color-schemed grade bubble component for Bet Bot picks
function GradeBubble({ grade }: { grade: string }) {
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
      
      console.log('=== PICK BUTTON DEBUG ===');
      console.log('1. Pick button clicked:', { market, selection, line });
      console.log('2. Event target type:', event.target?.constructor?.name || 'unknown');
      console.log('3. Current URL:', window.location.href);
      console.log('4. User agent:', navigator.userAgent.substring(0, 50) + '...');
      console.log('5. rawBookmakers available:', rawBookmakers?.length || 0);
      console.log('6. Current modal state - oddsModalOpen:', oddsModalOpen);
      
      if (!rawBookmakers || rawBookmakers.length === 0) {
        console.warn('No bookmakers data available for odds comparison');
        alert('No betting odds available for this game yet. Please try again later.');
        return;
      }

      // Reset modal state with debugging
      console.log('7. Resetting modal state...');
      setOddsModalOpen(false);
      setSelectedBet(null);
      
      // Small delay to ensure old modal is closed before opening new one
      setTimeout(() => {
        try {
          console.log('8. Timeout executed - setting new modal state');
          console.log('9. Setting selectedBet to:', { market, selection, line });
          setSelectedBet({ market, selection, line });
          console.log('10. Setting oddsModalOpen to true');
          setOddsModalOpen(true);
          console.log('11. Modal state updated successfully');
        } catch (timeoutError) {
          console.error('Error in timeout function:', timeoutError);
          alert('Error in delayed modal opening. Please try again.');
        }
      }, 100);
      
      console.log('12. handleMakePick function completed without errors');
      
    } catch (error) {
      console.error('=== CRITICAL ERROR in handleMakePick ===', error);
      console.error('Error stack:', error.stack);
      alert(`Critical error opening betting options: ${error.message}. Please try again or refresh the page.`);
    }
  };

  const handleManualEntry = (gameInfo: any, selectedBet: any) => {
    // Pre-fill the manual entry form with data from the odds comparison modal
    setManualEntry({
      market: selectedBet.market,
      selection: selectedBet.selection,
      line: selectedBet.line?.toString() || '',
      odds: '',
      units: 1
    });
    setManualEntryOpen(true);
  };

  const handleManualEntrySubmit = async () => {
    if (!manualEntry.selection) {
      alert('Please enter a selection');
      return;
    }

    const pick: Pick = {
      id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      gameInfo: {
        awayTeam,
        homeTeam,
        gameTime: startTime,
        venue: 'TBD',
        sport: 'baseball_mlb'
      },
      betInfo: {
        market: manualEntry.market,
        selection: manualEntry.selection,
        line: manualEntry.line ? parseFloat(manualEntry.line) : undefined,
        odds: manualEntry.odds ? parseFloat(manualEntry.odds) : 0,
        units: manualEntry.units
      },
      bookmaker: {
        key: 'manual',
        title: 'Manual Entry',
        displayName: 'Manual Entry',
        url: '#'
      },
      status: 'pending'
    };

    try {
      await databasePickStorage.savePick({
        gameId: gameId?.toString() || `manual_${Date.now()}`,
        homeTeam,
        awayTeam,
        selection: manualEntry.selection,
        market: manualEntry.market,
        line: manualEntry.line || null,
        units: manualEntry.units,
        bookmaker: 'manual',
        bookmakerDisplayName: 'Manual Entry',
        gameDate: startTime?.split('T')[0] || new Date().toISOString().split('T')[0],
        gameTime: startTime || new Date().toISOString(),
        odds: manualEntry.odds || '0'
      });
    } catch (error) {
      console.error('Error saving manual pick to database:', error);
      pickStorage.savePick(pick);
    }

    setManualEntryOpen(false);
    setManualEntry({
      market: 'moneyline',
      selection: '',
      line: '',
      odds: '',
      units: 1
    });
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
      className="hover:shadow-lg transition-shadow duration-200 border border-gray-200 dark:border-gray-700"
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
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

        {/* Header with Pick Column */}
        <div className="grid grid-cols-5 gap-1 sm:gap-2 mb-3 text-xs text-gray-500 dark:text-gray-400">
          <div className="col-span-2 text-xs sm:text-sm">Teams</div>
          <div className="text-center text-xs sm:text-sm">Odds</div>
          <div className="text-center text-xs sm:text-sm">Pick</div>
          <div className="text-center text-xs sm:text-sm">Bet Bot Pick</div>
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
              {isDailyPick && dailyPickTeam === awayTeam ? (
                <div className="relative">
                  <GradeBubble grade={dailyPickGrade || "C+"} />
                  <div className="absolute -top-2 -right-2 p-1 cursor-pointer">
                    <InfoButton pickId={dailyPickId} pickType="daily" />
                  </div>
                </div>
              ) : isAuthenticated && lockPickTeam === awayTeam ? (
                <div className="relative">
                  <GradeBubble grade={lockPickGrade || "C+"} />
                  <div className="absolute -top-2 -right-2 p-1 cursor-pointer">
                    <InfoButton pickId={lockPickId} pickType="lock" />
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
              {isDailyPick && dailyPickTeam === homeTeam ? (
                <div className="relative">
                  <GradeBubble grade={dailyPickGrade || "C+"} />
                  <div className="absolute -top-2 -right-2 p-1 cursor-pointer">
                    <InfoButton pickId={dailyPickId} pickType="daily" />
                  </div>
                </div>
              ) : isAuthenticated && lockPickTeam === homeTeam ? (
                <div className="relative">
                  <GradeBubble grade={lockPickGrade || "C+"} />
                  <div className="absolute -top-2 -right-2 p-1 cursor-pointer">
                    <InfoButton pickId={lockPickId} pickType="lock" />
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
          onManualEntry={handleManualEntry}
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

      {/* Manual Entry Modal */}
      <Dialog open={manualEntryOpen} onOpenChange={setManualEntryOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Enter Manual Pick</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Game
              </label>
              <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                {awayTeam} @ {homeTeam}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bet Type
              </label>
              <Select value={manualEntry.market} onValueChange={(value) => setManualEntry({...manualEntry, market: value as any})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="moneyline">Moneyline</SelectItem>
                  <SelectItem value="spread">Spread</SelectItem>
                  <SelectItem value="total">Total (Over/Under)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Selection
              </label>
              <Input
                value={manualEntry.selection}
                onChange={(e) => setManualEntry({...manualEntry, selection: e.target.value})}
                placeholder={`Pre-filled: ${manualEntry.selection}`}
                className="w-full"
              />
            </div>

            {(manualEntry.market === 'spread' || manualEntry.market === 'total') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Line/Point
                </label>
                <Input
                  value={manualEntry.line}
                  onChange={(e) => setManualEntry({...manualEntry, line: e.target.value})}
                  placeholder={`Pre-filled: ${manualEntry.line}`}
                  className="w-full"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Units
              </label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setManualEntry({...manualEntry, units: Math.max(0.5, manualEntry.units - 0.5)})}
                >
                  -
                </Button>
                <Input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={manualEntry.units}
                  onChange={(e) => setManualEntry({...manualEntry, units: Math.max(0.5, parseFloat(e.target.value) || 0.5)})}
                  className="w-20 text-center"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setManualEntry({...manualEntry, units: manualEntry.units + 0.5})}
                >
                  +
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                  (${(manualEntry.units * betUnit).toFixed(0)} bet)
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Odds (adjustable)
              </label>
              <Input
                value={manualEntry.odds}
                onChange={(e) => setManualEntry({...manualEntry, odds: e.target.value})}
                placeholder="e.g., -110, +150"
                className="w-full"
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleManualEntrySubmit}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={!manualEntry.selection}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Pick
              </Button>
              <Button
                variant="outline"
                onClick={() => setManualEntryOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}