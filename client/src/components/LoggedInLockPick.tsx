import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Info, TrendingUp, Target, MapPin, Clock, Users, Lock, ChevronDown, ChevronUp } from "lucide-react";
import { OddsComparisonModal } from "@/components/OddsComparisonModal";
import { savePick } from "@/services/pickStorage";
import { trackPickVisit, shouldCollapsePickForUser, cleanupOldVisits, shouldHideStartedPick } from "@/lib/visitTracker";
import { getFactorColorClasses, getFactorTooltip, getGradeColorClasses, getMainGradeExplanation } from "@/lib/factorUtils";
import betbotLogo from "@assets/dde5f7b9-6c02-4772-9430-78d9b96b7edb_1752677738478.png";
import { useAuth } from "@/hooks/useAuth";

import { DailyPickAnalysis } from '@shared/schema';

interface DailyPick {
  id: string;
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  pickTeam: string;
  pickType: string;
  odds: number;
  grade: string;
  confidence: number;
  reasoning: string;
  analysis: DailyPickAnalysis;
  gameTime: string;
  venue: string;
  probablePitchers: {
    home: string | null;
    away: string | null;
  };
  createdAt: string;
  pickDate: string;
}

interface PickAnalysisDetails {
  overall: {
    grade: string;
    confidence: number;
    reasoning: string;
  };
  factors: {
    offensivePower: { score: number; description: string };
    pitchingEdge: { score: number; description: string };
    ballparkAdvantage: { score: number; description: string };
    recentForm: { score: number; description: string };
    weatherConditions: { score: number; description: string };
    bettingValue: { score: number; description: string };
  };
  gameDetails: {
    matchup: string;
    venue: string;
    gameTime: string;
    pickTeam: string;
    odds: string;
    probablePitchers: {
      home: string | null;
      away: string | null;
    };
  };
}

// BetBot Icon Component
function BetBotIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <img 
      src={betbotLogo} 
      alt="BetBot Logo" 
      className={`${className} object-contain`}
    />
  );
}

// Grade Badge Component
function GradeBadge({ grade }: { grade: string }) {
  const colorClasses = getGradeColorClasses(grade);
  
  return (
    <Badge 
      className={`${colorClasses.bg} ${colorClasses.text} ${colorClasses.border} font-bold px-3 py-1 text-lg cursor-pointer border`}
      onClick={(e) => e.stopPropagation()}
    >
      {grade}
    </Badge>
  );
}

// Factor Grade Conversion (No F grades)
function scoreToGrade(score: number): string {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 85) return 'B+';
  if (score >= 80) return 'B';
  if (score >= 75) return 'C+';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

// Unified Info Button Component with Dark Background
function InfoButton({ info, title, score }: { info: string; title: string; score?: number }) {
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

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="p-0 h-4 w-4 bg-black dark:bg-gray-500 hover:bg-gray-800 dark:hover:bg-gray-400 rounded-full flex items-center justify-center">
          <Info className="h-2.5 w-2.5 text-white dark:text-black" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3 text-xs" side="top">
        <div className="font-medium mb-2">{title}</div>
        <div className="mb-3 text-gray-700 dark:text-gray-300">{info.split('\n\n')[0]}</div>
        {score !== undefined && score > 0 && (
          <div className="border-t pt-2 mt-2 text-xs text-gray-600 dark:text-gray-400">
            <div className="font-medium mb-1">Grade Meaning:</div>
            <div className="text-gray-800 dark:text-gray-200">{info.split('\n\n')[1] || getGradeExplanation(score, title)}</div>
            <div className="mt-2 text-[10px] text-gray-500 dark:text-gray-500">
              90+ = Elite | 80-89 = Strong | 75 = Neutral baseline | &lt;75 = Disadvantage
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
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

// Factor Score Component with Info Button
function FactorScore({ title, score, info, gameContext }: { title: string; score: number; info: string; gameContext?: any }) {
  const colorClasses = getFactorColorClasses(score);
  const tooltip = getFactorTooltip(score, title, gameContext);

  return (
    <div className="flex items-center py-1">
      <div className="flex items-center gap-1 flex-1 min-w-0 pr-3">
        <InfoButton info={tooltip} title={title} score={score} />
        <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">{title}</span>
      </div>
      <div className={`${colorClasses.bg} ${colorClasses.text} text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ml-auto border ${colorClasses.border}`}>
        {score !== null ? score : 'NA'}
      </div>
    </div>
  );
}

export default function LoggedInLockPick() {
  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false);
  const [oddsModalOpen, setOddsModalOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<any>(null);
  const [mobileAnalysisOpen, setMobileAnalysisOpen] = useState(false);
  const [lockPickMediumOpen, setLockPickMediumOpen] = useState(false); // Start collapsed for stacked layout
  const [lockPickLargeOpen, setLockPickLargeOpen] = useState(true); // Start expanded for side-by-side
  const [isCollapsed, setIsCollapsed] = useState(false); // New collapsed state for entire pick

  // Listen for events to collapse both when one collapses (only for large screens)
  useEffect(() => {
    const handleCollapseAnalysis = (e: any) => {
      if (e.detail?.source === 'daily') {
        console.log('LoggedInLockPick: Received collapse event from DailyPick, collapsing both');
        setLockPickLargeOpen(false);
      }
    };
    
    window.addEventListener('collapseBothAnalysis', handleCollapseAnalysis);
    return () => window.removeEventListener('collapseBothAnalysis', handleCollapseAnalysis);
  }, []);

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Fetch lock pick for authenticated users, or daily pick for non-authenticated
  const { data: lockPick, isLoading } = useQuery<DailyPick | null>({
    queryKey: isAuthenticated ? ['/api/daily-pick/lock'] : ['/api/daily-pick'],
    enabled: !authLoading, // Only fetch when auth loading is complete
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Track visits and determine if should be collapsed
  useEffect(() => {
    if (lockPick?.id) {
      // Clean up old visits on component mount
      cleanupOldVisits();
      
      // Track this visit
      trackPickVisit(lockPick.id);
      
      // Check if should be collapsed
      const shouldCollapse = shouldCollapsePickForUser(lockPick.id);
      setIsCollapsed(shouldCollapse);
    }
  }, [lockPick?.id]);

  const { data: analysisDetails } = useQuery<PickAnalysisDetails | null>({
    queryKey: [`/api/daily-pick/${lockPick?.id}/analysis`],
    enabled: !!lockPick?.id && analysisDialogOpen && isAuthenticated,
  });

  const { data: gamesData } = useQuery({
    queryKey: ['/api/mlb/complete-schedule'],
    enabled: !!lockPick?.gameId,
  });

  // Fetch live scores for the game
  const { data: gameScore } = useQuery({
    queryKey: ['/api/mlb/scores', lockPick?.gameTime ? new Date(lockPick.gameTime).toISOString().split('T')[0] : ''],
    enabled: !!lockPick?.gameTime,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for live updates
  });

  const handleMakePick = (e: React.MouseEvent, market: string, selection: string, line?: number) => {
    e.stopPropagation();
    
    if (!lockPick) return;
    
    const betInfo = {
      market,
      selection,
      line,
      odds: lockPick.odds
    };
    
    // Close any existing modal first to prevent overlap
    setOddsModalOpen(false);
    
    // Small delay to ensure old modal is closed before opening new one
    setTimeout(() => {
      setSelectedBet(betInfo);
      setOddsModalOpen(true);
    }, 50);
  };

  // Show loading state during auth check
  if (authLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!lockPick) {
    return (
      <Card className="w-full border-dashed">
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center space-y-3">
            <div className="flex items-center space-x-2">
              <BetBotIcon className="w-12 h-12 opacity-50" />
              <Lock className="w-6 h-6 text-gray-400" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-gray-600 dark:text-gray-400">
                No Lock Pick Available Today
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Check back when games with odds are available
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Hide pick if game has started and it's before 2 AM next day
  if (shouldHideStartedPick(lockPick.gameTime)) {
    return (
      <Card className="w-full border-dashed">
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center space-y-3">
            <div className="flex items-center space-x-2">
              <BetBotIcon className="w-12 h-12 opacity-50" />
              <Lock className="w-6 h-6 text-gray-400" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-gray-600 dark:text-gray-400">
                Game Already Started
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                New picks will be available at 2:00 AM EST
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatGameTime = (gameTime: string) => {
    const date = new Date(gameTime);
    const gameDate = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    const time = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      timeZoneName: 'short'
    });
    return `${gameDate} at ${time}`;
  };

  const formatOdds = (odds: number, pickType: string) => {
    const sign = odds > 0 ? `+${odds}` : `${odds}`;
    const type = pickType === 'moneyline' ? 'ML' : 
                 pickType === 'spread' ? 'SP' : 
                 pickType === 'over_under' ? 'O/U' : 'ML';
    return `${type} ${sign}`;
  };

  // Find current game score data with improved matching logic
  const currentGameScore = gameScore?.find((game: any) => {
    // Try multiple matching strategies
    const gameIdMatch = game.gameId === parseInt(lockPick?.gameId || '0') || 
                       game.gameId === lockPick?.gameId;
    const teamMatch = game.homeTeam === lockPick?.homeTeam && 
                     game.awayTeam === lockPick?.awayTeam;
    return gameIdMatch || teamMatch;
  });

  // Debug logging (remove in production)
  // if (lockPick && gameScore && gameScore.length > 0) {
  //   console.log('Lock pick game ID:', lockPick.gameId, typeof lockPick.gameId);
  //   console.log('Lock pick teams:', lockPick.awayTeam, '@', lockPick.homeTeam);
  //   console.log('Available scores data (first 2):', gameScore.slice(0, 2));
  //   console.log('Found matching score:', currentGameScore);
  // }

  // Get all 6 factors with their info descriptions in permanent order
  const getFactors = (analysis: DailyPickAnalysis, probablePitchers: { home: string | null; away: string | null }) => {
    const factorData = [
      {
        key: 'marketInefficiency',
        title: 'Market Edge',
        score: analysis.marketInefficiency,
        info: 'Advanced betting value analysis using Kelly Criterion and market efficiency indicators to identify profitable opportunities.'
      },
      {
        key: 'situationalEdge',
        title: 'Situational Edge',
        score: analysis.situationalEdge,
        info: 'Comprehensive situational factors including ballpark dimensions, home field advantage, travel fatigue, and game timing effects.'
      }
    ];

    // Always include Pitching Matchup, show NA if either pitcher is TBD
    const homePitcher = probablePitchers.home || 'TBD';
    const awayPitcher = probablePitchers.away || 'TBD';
    
    factorData.push({
      key: 'pitchingMatchup',
      title: 'Pitching Matchup', 
      score: (homePitcher !== 'TBD' && awayPitcher !== 'TBD') ? analysis.pitchingMatchup : null,
      info: 'Starting pitcher effectiveness analysis comparing ERA, WHIP, strikeout rates, and recent performance trends.'
    });

    factorData.push(
      {
        key: 'teamMomentum',
        title: 'Team Momentum',
        score: analysis.teamMomentum,
        info: 'Multi-layered momentum analysis from official MLB Stats API comparing recent performance trends, L10 vs season form, and directional momentum shifts.'
      },
      {
        key: 'systemConfidence',
        title: 'System Confidence',
        score: analysis.systemConfidence,
        info: 'Model certainty based on data quality, factor consensus, and information completeness - higher scores indicate stronger analytical foundation.'
      },
      {
        key: 'offensiveProduction',
        title: 'Offensive Production',
        score: analysis.offensiveProduction,
        info: 'Advanced run-scoring analysis combining Baseball Savant metrics (xwOBA, barrel rate, exit velocity) with team production efficiency from 2025 season data.'
      }
    );

    return factorData;
  };

  // Determine if pick team is away or home, format matchup accordingly
  const formatMatchup = (homeTeam: string, awayTeam: string, pickTeam: string) => {
    const isPickHome = pickTeam === homeTeam;
    if (isPickHome) {
      return {
        topTeam: homeTeam,
        bottomTeam: awayTeam,
        separator: 'vs.',
        topTeamPitcher: 'home',
        bottomTeamPitcher: 'away'
      };
    } else {
      return {
        topTeam: awayTeam,
        bottomTeam: homeTeam,
        separator: '@',
        topTeamPitcher: 'away',
        bottomTeamPitcher: 'home'
      };
    }
  };

  const matchup = formatMatchup(lockPick.homeTeam, lockPick.awayTeam, lockPick.pickTeam);
  const factors = getFactors(lockPick.analysis, lockPick.probablePitchers);

  // Collapsed view when user has visited 2+ times
  if (isCollapsed) {
    return (
      <Card className="w-full bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800">
        <CardContent className="p-4 relative">
          {/* Blur overlay for non-authenticated users */}
          {!isAuthenticated && (
            <div 
              className="absolute inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg cursor-pointer"
              onClick={() => window.location.href = '/api/login'}
            >
              <div className="text-center">
                <Lock className="w-8 h-8 text-amber-600 dark:text-amber-400 mx-auto mb-2" />
                <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-1">
                  Login Required
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Click to access lock pick
                </p>
              </div>
            </div>
          )}
          
          <div className={`flex items-center justify-between cursor-pointer ${!isAuthenticated ? 'blur-sm' : ''}`} onClick={() => setIsCollapsed(false)}>
            <div className="flex items-center space-x-3">
              <BetBotIcon className="w-8 h-8" />
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                  Logged in Lock Pick
                </h3>
                <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                  {lockPick.pickTeam} {formatOdds(lockPick.odds, lockPick.pickType)} • Grade {lockPick.grade}
                </p>
              </div>
            </div>
            <ChevronDown className="w-5 h-5 text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800">
      <CardContent className="p-4 sm:p-6 relative">
        {/* Blur overlay for non-authenticated users */}
        {!isAuthenticated && (
          <div 
            className="absolute inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg cursor-pointer"
            onClick={() => window.location.href = '/api/login'}
          >
            <div className="text-center">
              <Lock className="w-10 h-10 sm:w-12 sm:h-12 text-amber-600 dark:text-amber-400 mx-auto mb-3" />
              <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-gray-100 mb-1">
                Login for a Lock
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Click here to access your exclusive lock pick
              </p>
            </div>
          </div>
        )}
        
        <div className={`relative ${!isAuthenticated ? 'blur-sm' : ''}`}>
          {/* Mobile Layout */}
          <div className="md:hidden">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-3">
                <BetBotIcon className="w-10 h-10 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                    Logged in Lock of the Day
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                    Exclusive pick for authenticated users
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end space-y-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                  onClick={() => setIsCollapsed(true)}
                  title="Hide pick"
                >
                  <ChevronUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </Button>
                <div className="flex items-center space-x-2">
                  <GradeBadge grade={lockPick.grade} />
                  <Dialog open={analysisDialogOpen} onOpenChange={setAnalysisDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-0 h-4 w-4 bg-transparent hover:bg-gray-100 dark:bg-black/80 dark:hover:bg-black/90 rounded-full flex items-center justify-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Info className="h-2.5 w-2.5 text-black dark:text-white" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center space-x-2">
                        <BetBotIcon className="w-6 h-6" />
                        <span>Lock Pick Analysis: {lockPick.grade} Grade</span>
                      </DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                        <h4 className="font-semibold mb-3">Pick Details</h4>
                        <div className="space-y-2 text-sm">
                          <div><strong>Game:</strong> {lockPick.awayTeam} @ {lockPick.homeTeam}</div>
                          <div><strong>Pick:</strong> {lockPick.pickTeam} {formatOdds(lockPick.odds, lockPick.pickType)}</div>
                          <div><strong>Venue:</strong> {lockPick.venue}</div>
                          <div><strong>Time:</strong> {formatGameTime(lockPick.gameTime)}</div>
                        </div>
                      </div>
                      
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                        <h4 className="font-semibold mb-3">Grade Analysis</h4>
                        <pre className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap font-mono">
                          {getMainGradeExplanation(
                            lockPick.grade,
                            lockPick.confidence,
                            lockPick.analysis,
                            lockPick.pickTeam,
                            lockPick.odds
                          )}
                        </pre>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3">Analysis Factors</h4>
                        <div className="space-y-3">
                          {factors.map(({ key, title, score, info }) => (
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
                </div>
              </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:flex md:items-start md:justify-between mb-3 md:mb-4">
            <div className="flex items-center space-x-2 md:space-x-3">
              <BetBotIcon className="w-12 md:w-14 h-12 md:h-14 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-xl md:text-2xl text-gray-900 dark:text-gray-100">
                  Logged in Lock of the Day
                </h3>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Exclusive pick for authenticated users
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-1">
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                onClick={() => setIsCollapsed(true)}
                title="Hide pick"
              >
                <ChevronUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </Button>
              <div className="flex items-center space-x-2">
                <GradeBadge grade={lockPick.grade} />
                <Dialog open={analysisDialogOpen} onOpenChange={setAnalysisDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-0 h-5 w-5 bg-transparent hover:bg-gray-100 dark:bg-black/80 dark:hover:bg-black/90 rounded-full flex items-center justify-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Info className="h-3 w-3 text-black dark:text-white" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                      <BetBotIcon className="w-6 h-6" />
                      <span>Lock Pick Analysis: {lockPick.grade} Grade</span>
                    </DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                      <h4 className="font-semibold mb-3">Pick Details</h4>
                      <div className="space-y-2 text-sm">
                        <div><strong>Game:</strong> {lockPick.awayTeam} @ {lockPick.homeTeam}</div>
                        <div><strong>Pick:</strong> {lockPick.pickTeam} {formatOdds(lockPick.odds, lockPick.pickType)}</div>
                        <div><strong>Venue:</strong> {lockPick.venue}</div>
                        <div><strong>Time:</strong> {formatGameTime(lockPick.gameTime)}</div>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                      <h4 className="font-semibold mb-3">Grade Analysis</h4>
                      <pre className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap font-mono">
                        {getMainGradeExplanation(
                          lockPick.grade,
                          lockPick.confidence,
                          lockPick.analysis,
                          lockPick.pickTeam,
                          lockPick.odds
                        )}
                      </pre>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Analysis Factors</h4>
                      <div className="space-y-3">
                        {factors.map(({ key, title, score, info }) => (
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
              </div>
            </div>
        </div>

        <div className="flex items-start justify-between space-x-6">
          {/* Left side - Team matchup and odds (scorebug) */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <h4 className="font-bold text-sm md:text-lg text-amber-600 dark:text-amber-400 whitespace-nowrap">
                  {matchup.topTeam}
                </h4>
                <span className="font-bold text-sm md:text-lg bg-gradient-to-r from-amber-600 to-amber-700 dark:from-amber-400 dark:to-amber-500 bg-clip-text text-transparent whitespace-nowrap">
                  {formatOdds(lockPick.odds, lockPick.pickType)}
                </span>
              </div>
              <div className="flex-shrink-0 ml-4">
                {lockPick.pickType === 'moneyline' && lockPick.pickTeam === matchup.topTeam && (
                  <Button
                    size="sm"
                    onClick={(e) => handleMakePick(e, 'moneyline', lockPick.pickTeam)}
                    className="text-xs px-2 md:px-6 py-1 h-6 md:h-7 bg-green-600 hover:bg-green-700 text-white border-0 font-semibold shadow-sm"
                  >
                    Pick
                  </Button>
                )}
              </div>
            </div>
            <div className="ml-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                P: {lockPick.probablePitchers[matchup.topTeamPitcher] || 'TBD'}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 flex-1 min-w-0 text-sm md:text-base text-gray-600 dark:text-gray-400">
                <span>{matchup.separator}</span>
                <span className="block">{matchup.bottomTeam}</span>
              </div>
              <div className="flex-shrink-0 ml-4">
                {lockPick.pickType === 'moneyline' && lockPick.pickTeam !== matchup.bottomTeam && (
                  <Button
                    size="sm"
                    onClick={(e) => handleMakePick(e, 'moneyline', matchup.bottomTeam)}
                    className="text-xs px-2 md:px-6 py-1 h-6 md:h-7 bg-red-600 hover:bg-red-700 text-white border-0 font-semibold shadow-sm"
                  >
                    Fade
                  </Button>
                )}
              </div>
            </div>
            <div className="ml-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                P: {lockPick.probablePitchers[matchup.bottomTeamPitcher] || 'TBD'}
              </p>
            </div>
            <div className="mt-3">
              {/* Game Status Display */}
              {currentGameScore && (
                <div className="mb-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <div className="text-amber-600 dark:text-amber-400 font-semibold">
                        {currentGameScore.awayTeam}
                      </div>
                      {currentGameScore.status === 'Scheduled' ? (
                        <div className="text-sm text-gray-500 dark:text-gray-400">vs</div>
                      ) : (
                        <>
                          <div className="text-lg font-bold">
                            {currentGameScore.awayScore ?? 0}
                          </div>
                          <div className="text-gray-400">-</div>
                          <div className="text-lg font-bold">
                            {currentGameScore.homeScore ?? 0}
                          </div>
                        </>
                      )}
                      <div className="text-amber-600 dark:text-amber-400 font-semibold">
                        {currentGameScore.homeTeam}
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {currentGameScore.status === 'Final' ? 'Final' : 
                       currentGameScore.status === 'In Progress' ? 
                         (currentGameScore.inning ? `${currentGameScore.inning}` : 'Live') : 
                       currentGameScore.status === 'Scheduled' ? 'Scheduled' :
                       currentGameScore.status}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  {formatGameTime(lockPick.gameTime)} • {lockPick.venue}
                </p>
                {/* Mobile dropdown toggle (sm and below) */}
                <button
                  className="sm:hidden flex items-center text-xs text-amber-600 dark:text-amber-400 ml-2"
                  onClick={() => setMobileAnalysisOpen(!mobileAnalysisOpen)}
                >
                  {mobileAnalysisOpen ? 'Hide' : 'Show'} Analysis
                  {mobileAnalysisOpen ? (
                    <ChevronUp className="w-3 h-3 ml-1" />
                  ) : (
                    <ChevronDown className="w-3 h-3 ml-1" />
                  )}
                </button>
                {/* Medium size dropdown toggle (md-xl when stacked) */}
                <button
                  className="hidden sm:flex xl:hidden items-center text-xs text-amber-600 dark:text-amber-400 ml-2"
                  onClick={() => setLockPickMediumOpen(!lockPickMediumOpen)}
                >
                  {lockPickMediumOpen ? 'Hide' : 'Show'} Analysis
                  {lockPickMediumOpen ? (
                    <ChevronUp className="w-3 h-3 ml-1" />
                  ) : (
                    <ChevronDown className="w-3 h-3 ml-1" />
                  )}
                </button>
              </div>

              {/* Mobile analysis factors dropdown (sm and below) */}
              {mobileAnalysisOpen && (
                <div className="sm:hidden mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <h5 className="font-semibold text-xs text-gray-600 dark:text-gray-400 mb-2">
                    Analysis Factors
                  </h5>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    {factors.map(({ key, title, score, info }) => {
                      // Create context for narrative generation
                      const gameContext = {
                        isHomeGame: lockPick.pickTeam === lockPick.homeTeam,
                        opponentHandedness: 'LHP' as const,
                        starterERA: 3.8,
                        last10Record: '6-4',
                        offensiveStats: {
                          xwOBA: 0.325,
                          barrelRate: 7.2,
                          exitVelo: 88.5
                        }
                      };
                      return <FactorScore key={key} title={title} score={score} info={info} gameContext={gameContext} />;
                    })}
                  </div>
                </div>
              )}
              

            </div>

            {/* Medium size analysis factors dropdown (md-xl when stacked) - Below buttons */}
            {lockPickMediumOpen && (
              <div className="hidden sm:block xl:hidden mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h5 className="font-semibold text-sm text-gray-600 dark:text-gray-400 mb-3 text-center">
                  Analysis Factors
                </h5>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {factors.map(({ key, title, score, info }) => {
                    // Create context for narrative generation
                    const gameContext = {
                      isHomeGame: lockPick.pickTeam === lockPick.homeTeam,
                      opponentHandedness: 'LHP' as const,
                      starterERA: 3.8,
                      last10Record: '6-4',
                      offensiveStats: {
                        xwOBA: 0.325,
                        barrelRate: 7.2,
                        exitVelo: 88.5
                      }
                    };
                    return <FactorScore key={key} title={title} score={score} info={info} gameContext={gameContext} />;
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right side - Analysis Factors (xl screens side-by-side) */}
          {lockPickLargeOpen && (
            <div className="w-80 hidden xl:block">
              <h5 className="font-semibold text-sm text-gray-600 dark:text-gray-400 mb-2 mt-1 text-center">
                Analysis Factors
              </h5>
              
              {/* 2 columns x 3 rows grid of factor scores */}
              <div className="grid grid-cols-2 grid-rows-3 gap-x-4 gap-y-1">
                {factors.map(({ key, title, score, info }) => {
                  // Create context for narrative generation
                  const gameContext = {
                    isHomeGame: lockPick.pickTeam === lockPick.homeTeam,
                    opponentHandedness: 'LHP' as const,
                    starterERA: 3.8,
                    last10Record: '6-4',
                    offensiveStats: {
                      xwOBA: 0.325,
                      barrelRate: 7.2,
                      exitVelo: 88.5
                    }
                  };
                  return <FactorScore key={key} title={title} score={score} info={info} gameContext={gameContext} />;
                })}
              </div>
              
              {/* Hide Analysis button for large screens */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  className="flex items-center justify-center w-full text-xs text-amber-600 dark:text-amber-400 py-2"
                  onClick={() => {
                    console.log('LoggedInLockPick: Collapsing analysis, will trigger DailyPick to collapse too');
                    setLockPickLargeOpen(false);
                    // Send custom event to collapse both analysis sections
                    window.dispatchEvent(new CustomEvent('collapseBothAnalysis', { detail: { source: 'lock' } }));
                  }}
                >
                  Hide Analysis
                  <ChevronUp className="w-3 h-3 ml-1" />
                </button>
              </div>
            </div>
          )}
        </div>
        </div>
        </div>
      </CardContent>
      
      {/* Odds Comparison Modal */}
      {selectedBet && (
        <OddsComparisonModal
          open={oddsModalOpen}
          onClose={() => {
            setOddsModalOpen(false);
            setSelectedBet(null);
          }}
          gameInfo={{
            homeTeam: lockPick.homeTeam,
            awayTeam: lockPick.awayTeam,
            gameId: lockPick.gameId,
            sport: 'baseball_mlb',
            gameTime: lockPick.gameTime
          }}
          bookmakers={gamesData?.find((game: any) => game.id === lockPick.gameId)?.bookmakers || []}
          selectedBet={selectedBet}
        />
      )}
    </Card>
  );
}