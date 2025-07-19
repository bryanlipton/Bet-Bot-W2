import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Info, TrendingUp, Target, MapPin, Clock, Users, ChevronDown, ChevronUp } from "lucide-react";
import { OddsComparisonModal } from "@/components/OddsComparisonModal";
import { savePick } from "@/services/pickStorage";
import { trackPickVisit, shouldCollapsePickForUser, cleanupOldVisits, shouldHideStartedPick } from "@/lib/visitTracker";
import betbotLogo from "@assets/dde5f7b9-6c02-4772-9430-78d9b96b7edb_1752677738478.png";

interface DailyPickAnalysis {
  offensivePower: number;    // 60-100 normalized scale
  pitchingEdge: number;      // 60-100 normalized scale  
  ballparkAdvantage: number; // 60-100 normalized scale
  recentForm: number;        // 60-100 normalized scale
  weatherConditions: number; // 60-100 normalized scale
  bettingValue: number;      // 60-100 normalized scale
  confidence: number;
}

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
  return (
    <Badge 
      className="bg-blue-500 text-white font-bold px-3 py-1 text-lg cursor-pointer" 
      onClick={(e) => e.stopPropagation()}
    >
      {grade}
    </Badge>
  );
}

// Factor Grade Conversion (No F grades)
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

// Unified Info Button Component with Dark Background
function InfoButton({ info, title, score }: { info: string; title: string; score?: number }) {
  const getGradeExplanation = (score: number, factorTitle: string): string => {
    const grade = scoreToGrade(score);
    
    // Customized explanations based on factor type
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
      <PopoverContent className="w-64 p-3 text-xs" side="top">
        <div className="font-medium mb-1">{title}</div>
        <div className="mb-2">{info}</div>
        {score !== undefined && score > 0 && (
          <div className="border-t pt-2 mt-2 text-xs text-gray-600 dark:text-gray-400">
            <div className="font-medium mb-1">Grade Meaning:</div>
            <div>{getGradeExplanation(score, title)}</div>
            <div className="mt-2 text-[10px] text-gray-500 dark:text-gray-500">
              90+ = Elite | 80-89 = Strong | 75 = Neutral baseline | &lt;75 = Disadvantage
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// Factor Score Component with Info
function FactorScore({ title, score, info }: { title: string; score: number; info: string }) {
  return (
    <div className="flex items-center py-1">
      <div className="flex items-center gap-1 flex-1 min-w-0 pr-3">
        <InfoButton info={info} title={title} score={score} />
        <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">{title}</span>
      </div>
      <div className="bg-blue-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ml-auto">
        {score !== null ? score : 'NA'}
      </div>
    </div>
  );
}

export default function DailyPick() {
  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false);
  const [oddsModalOpen, setOddsModalOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<any>(null);
  const [mobileAnalysisOpen, setMobileAnalysisOpen] = useState(false);
  const [dailyPickMediumOpen, setDailyPickMediumOpen] = useState(false); // Start collapsed for stacked layout
  const [dailyPickLargeOpen, setDailyPickLargeOpen] = useState(true); // Start expanded for side-by-side
  const [isCollapsed, setIsCollapsed] = useState(false); // New collapsed state for entire pick

  // Listen for events to collapse both when one collapses (only for large screens)
  useEffect(() => {
    const handleCollapseAnalysis = (e: any) => {
      if (e.detail?.source === 'lock') {
        console.log('DailyPick: Received collapse event from LoggedInLockPick, collapsing both');
        setDailyPickLargeOpen(false);
      }
    };
    
    window.addEventListener('collapseBothAnalysis', handleCollapseAnalysis);
    return () => window.removeEventListener('collapseBothAnalysis', handleCollapseAnalysis);
  }, []);
  
  const { data: dailyPick, isLoading } = useQuery<DailyPick | null>({
    queryKey: ['/api/daily-pick'],
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Track visits and determine if should be collapsed
  useEffect(() => {
    if (dailyPick?.id) {
      // Clean up old visits on component mount
      cleanupOldVisits();
      
      // Track this visit
      trackPickVisit(dailyPick.id);
      
      // Check if should be collapsed
      const shouldCollapse = shouldCollapsePickForUser(dailyPick.id);
      setIsCollapsed(shouldCollapse);
    }
  }, [dailyPick?.id]);

  const { data: analysisDetails } = useQuery<PickAnalysisDetails | null>({
    queryKey: [`/api/daily-pick/${dailyPick?.id}/analysis`],
    enabled: !!dailyPick?.id && analysisDialogOpen,
  });

  const { data: gamesData } = useQuery({
    queryKey: ['/api/mlb/complete-schedule'],
    enabled: !!dailyPick?.gameId,
  });

  // Get current pitcher information from the latest game data
  const getCurrentPitchers = () => {
    if (!dailyPick || !gamesData) {
      return dailyPick?.probablePitchers || { home: null, away: null };
    }
    
    // Find the current game in the latest games data
    const currentGame = gamesData.find((game: any) => game.id === dailyPick.gameId);
    if (currentGame && currentGame.probablePitchers) {
      return currentGame.probablePitchers;
    }
    
    // Fallback to stored pitcher data if game not found
    return dailyPick.probablePitchers;
  };

  const handleMakePick = (e: React.MouseEvent, market: string, selection: string, line?: number) => {
    e.stopPropagation();
    
    if (!dailyPick) return;
    
    const betInfo = {
      market,
      selection,
      line,
      odds: dailyPick.odds
    };
    
    // Close any existing modal first to prevent overlap
    setOddsModalOpen(false);
    
    // Small delay to ensure old modal is closed before opening new one
    setTimeout(() => {
      setSelectedBet(betInfo);
      setOddsModalOpen(true);
    }, 50);
  };

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

  if (!dailyPick) {
    return (
      <Card className="w-full border-dashed">
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center space-y-3">
            <BetBotIcon className="w-12 h-12 opacity-50" />
            <div className="space-y-1">
              <h3 className="font-semibold text-gray-600 dark:text-gray-400">
                No Pick Available Today
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
  if (shouldHideStartedPick(dailyPick.gameTime)) {
    return (
      <Card className="w-full border-dashed">
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center space-y-3">
            <BetBotIcon className="w-12 h-12 opacity-50" />
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

  // Get all 6 factors with their info descriptions in permanent order
  const getFactors = (analysis: DailyPickAnalysis, probablePitchers: { home: string | null; away: string | null }) => {
    const factorData = [
      {
        key: 'bettingValue',
        title: 'Betting Value',
        score: analysis.bettingValue,
        info: 'Analysis of odds value comparing our probability model to available betting lines and market efficiency.'
      },
      {
        key: 'ballparkAdvantage',
        title: 'Field Value',
        score: analysis.ballparkAdvantage,
        info: 'Stadium factors including dimensions, homefield advantage, and how the stadium favors hitters and pitchers.'
      }
    ];

    // Always include Pitching Edge, show NA if either pitcher is TBD
    const homePitcher = probablePitchers.home || 'TBD';
    const awayPitcher = probablePitchers.away || 'TBD';
    
    factorData.push({
      key: 'pitchingEdge',
      title: 'Pitching Edge', 
      score: (homePitcher !== 'TBD' && awayPitcher !== 'TBD') ? analysis.pitchingEdge : null,
      info: 'Probable pitcher analysis comparing ERA, strikeout rates, and recent form between starters.'
    });

    factorData.push(
      {
        key: 'recentForm',
        title: 'Recent Form',
        score: analysis.recentForm,
        info: 'Real team momentum from official MLB Stats API showing actual wins/losses in last 10 completed games, recent scoring trends, and competitive performance.'
      },
      {
        key: 'weatherConditions',
        title: 'Weather Impact',
        score: analysis.weatherConditions,
        info: 'Wind speed/direction, temperature, and humidity effects on ball flight and overall scoring.'
      },
      {
        key: 'offensiveEdge',
        title: 'Offensive Edge',
        score: analysis.offensiveEdge,
        info: 'Team batting performance including recent run production, lineup depth, and offensive momentum trends from official MLB statistics.'
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

  const currentPitchers = getCurrentPitchers();
  const matchup = formatMatchup(dailyPick.homeTeam, dailyPick.awayTeam, dailyPick.pickTeam);
  const factors = getFactors(dailyPick.analysis, currentPitchers);

  // Collapsed view when user has visited 2+ times
  if (isCollapsed) {
    return (
      <Card className="w-full bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsCollapsed(false)}>
            <div className="flex items-center space-x-3">
              <BetBotIcon className="w-8 h-8" />
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                  Pick of the Day
                </h3>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  {dailyPick.pickTeam} {formatOdds(dailyPick.odds, dailyPick.pickType)} • Grade {dailyPick.grade}
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
    <Card className="w-full bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
      <CardContent className="p-4 sm:p-6">
        <div className="relative">
          {/* Mobile Layout */}
          <div className="md:hidden">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-3">
                <BetBotIcon className="w-10 h-10 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                    Pick of the Day
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                    AI-based Data Analysis
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <GradeBadge grade={dailyPick.grade} />
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
                        <span>Pick Analysis: {dailyPick.grade} Grade</span>
                      </DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                        <h4 className="font-semibold mb-3">Pick Details</h4>
                        <div className="space-y-2 text-sm">
                          <div><strong>Game:</strong> {dailyPick.awayTeam} @ {dailyPick.homeTeam}</div>
                          <div><strong>Pick:</strong> {dailyPick.pickTeam} {formatOdds(dailyPick.odds, dailyPick.pickType)}</div>
                          <div><strong>Venue:</strong> {dailyPick.venue}</div>
                          <div><strong>Time:</strong> {formatGameTime(dailyPick.gameTime)}</div>
                        </div>
                      </div>
                      
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                        <h4 className="font-semibold mb-3">Reasoning</h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                          {dailyPick.reasoning}
                        </p>
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
                              <Progress value={score} className="h-2" />
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
          <div className="hidden md:flex md:items-center md:justify-between mb-3 md:mb-4">
            <div className="flex items-center space-x-2 md:space-x-4">
              <BetBotIcon className="w-12 md:w-14 h-12 md:h-14 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-xl md:text-2xl text-gray-900 dark:text-gray-100">
                  Pick of the Day
                </h3>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium">
                  AI-based Data Analysis
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <GradeBadge grade={dailyPick.grade} />
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
                      <span>Pick Analysis: {dailyPick.grade} Grade</span>
                    </DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                      <h4 className="font-semibold mb-3">Pick Details</h4>
                      <div className="space-y-2 text-sm">
                        <div><strong>Game:</strong> {dailyPick.awayTeam} @ {dailyPick.homeTeam}</div>
                        <div><strong>Pick:</strong> {dailyPick.pickTeam} {formatOdds(dailyPick.odds, dailyPick.pickType)}</div>
                        <div><strong>Venue:</strong> {dailyPick.venue}</div>
                        <div><strong>Time:</strong> {formatGameTime(dailyPick.gameTime)}</div>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                      <h4 className="font-semibold mb-3">Reasoning</h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {dailyPick.reasoning}
                      </p>
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
                            <Progress value={score} className="h-2" />
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
                <h4 className="font-bold text-sm md:text-lg text-blue-600 dark:text-blue-400 whitespace-nowrap">
                  {matchup.topTeam}
                </h4>
                <span className="font-bold text-sm md:text-lg bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent whitespace-nowrap">
                  {formatOdds(dailyPick.odds, dailyPick.pickType)}
                </span>
              </div>
              <div className="flex-shrink-0 ml-4">
                {dailyPick.pickType === 'moneyline' && dailyPick.pickTeam === matchup.topTeam && (
                  <Button
                    size="sm"
                    onClick={(e) => handleMakePick(e, 'moneyline', dailyPick.pickTeam)}
                    className="text-xs px-2 md:px-6 py-1 h-6 md:h-7 bg-green-600 hover:bg-green-700 text-white border-0 font-semibold shadow-sm"
                  >
                    Pick
                  </Button>
                )}
              </div>
            </div>
            <div className="ml-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                P: {currentPitchers[matchup.topTeamPitcher] || 'TBD'}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 flex-1 min-w-0 text-sm md:text-base text-gray-600 dark:text-gray-400">
                <span>{matchup.separator}</span>
                <span className="block">{matchup.bottomTeam}</span>
              </div>
              <div className="flex-shrink-0 ml-4">
                {dailyPick.pickType === 'moneyline' && dailyPick.pickTeam !== matchup.bottomTeam && (
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
                P: {currentPitchers[matchup.bottomTeamPitcher] || 'TBD'}
              </p>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  {formatGameTime(dailyPick.gameTime)} • {dailyPick.venue}
                </p>
                {/* Mobile dropdown toggle (sm and below) */}
                <button
                  className="sm:hidden flex items-center text-xs text-blue-600 dark:text-blue-400 ml-2"
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
                  className="hidden sm:flex xl:hidden items-center text-xs text-blue-600 dark:text-blue-400 ml-2"
                  onClick={() => setDailyPickMediumOpen(!dailyPickMediumOpen)}
                >
                  {dailyPickMediumOpen ? 'Hide' : 'Show'} Analysis
                  {dailyPickMediumOpen ? (
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
                    {factors.map(({ key, title, score, info }) => (
                      <FactorScore key={key} title={title} score={score} info={info} />
                    ))}
                  </div>
                </div>
              )}
              

            </div>

            {/* Medium size analysis factors dropdown (md-xl when stacked) - Below buttons */}
            {dailyPickMediumOpen && (
              <div className="hidden sm:block xl:hidden mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h5 className="font-semibold text-sm text-gray-600 dark:text-gray-400 mb-3 text-center">
                  Analysis Factors
                </h5>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {factors.map(({ key, title, score, info }) => (
                    <FactorScore key={key} title={title} score={score} info={info} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right side - Analysis Factors (xl screens side-by-side) */}
          {dailyPickLargeOpen && (
            <div className="w-80 hidden xl:block">
              <h5 className="font-semibold text-sm text-gray-600 dark:text-gray-400 mb-2 mt-1 text-center">
                Analysis Factors
              </h5>
              
              {/* 2 columns x 3 rows grid of factor scores */}
              <div className="grid grid-cols-2 grid-rows-3 gap-x-4 gap-y-1">
                {factors.map(({ key, title, score, info }) => (
                  <FactorScore key={key} title={title} score={score} info={info} />
                ))}
              </div>
              
              {/* Hide Analysis button for large screens */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  className="flex items-center justify-center w-full text-xs text-blue-600 dark:text-blue-400 py-2"
                  onClick={() => {
                    console.log('DailyPick: Collapsing analysis, will trigger LoggedInLockPick to collapse too');
                    setDailyPickLargeOpen(false);
                    // Send custom event to collapse both analysis sections
                    window.dispatchEvent(new CustomEvent('collapseBothAnalysis', { detail: { source: 'daily' } }));
                  }}
                >
                  Hide Analysis
                  <ChevronUp className="w-3 h-3 ml-1" />
                </button>
              </div>
            </div>
          )}




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
            homeTeam: dailyPick.homeTeam,
            awayTeam: dailyPick.awayTeam,
            gameId: dailyPick.gameId,
            sport: 'baseball_mlb',
            gameTime: dailyPick.gameTime
          }}
          bookmakers={gamesData?.find((game: any) => game.id === dailyPick.gameId)?.bookmakers || []}
          selectedBet={selectedBet}
        />
      )}
    </Card>
  );
}