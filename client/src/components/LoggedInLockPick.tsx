import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Info, TrendingUp, Target, MapPin, Clock, Users, Lock, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { OddsComparisonModal } from "@/components/OddsComparisonModal";
// import { savePick } from "@/services/pickStorage"; // Unused import removed
import { trackPickVisit, cleanupOldVisits } from "@/lib/visitTracker";
import { getFactorColorClasses, getLockPickFactorColorClasses, getFactorTooltip, getGradeColorClasses, getMainGradeExplanation, getMobileReasoning } from "@/lib/factorUtils";
import { generatePickAnalysisContent } from "@/lib/pickAnalysisUtils";
import betbotLogo from "@assets/dde5f7b9-6c02-4772-9430-78d9b96b7edb_1752677738478.png";

import { useAuth } from "@/hooks/useAuth";
import { queryClient } from "@/lib/queryClient";

const BetBotIcon = ({ className }: { className?: string }) => (
  <img src={betbotLogo} alt="Bet Bot" className={className} />
);

// MLB team abbreviations mapping
const TEAM_ABBREVIATIONS: Record<string, string> = {
  'Baltimore Orioles': 'BAL',
  'Boston Red Sox': 'BOS', 
  'New York Yankees': 'NYY',
  'Tampa Bay Rays': 'TB',
  'Toronto Blue Jays': 'TOR',
  'Chicago White Sox': 'CWS',
  'Cleveland Guardians': 'CLE',
  'Detroit Tigers': 'DET',
  'Kansas City Royals': 'KC',
  'Minnesota Twins': 'MIN',
  'Houston Astros': 'HOU',
  'Los Angeles Angels': 'LAA',
  'Oakland Athletics': 'OAK',
  'Seattle Mariners': 'SEA',
  'Texas Rangers': 'TEX',
  'Atlanta Braves': 'ATL',
  'Miami Marlins': 'MIA',
  'New York Mets': 'NYM',
  'Philadelphia Phillies': 'PHI',
  'Washington Nationals': 'WSH',
  'Chicago Cubs': 'CHC',
  'Cincinnati Reds': 'CIN',
  'Milwaukee Brewers': 'MIL',
  'Pittsburgh Pirates': 'PIT',
  'St. Louis Cardinals': 'STL',
  'Arizona Diamondbacks': 'ARI',
  'Colorado Rockies': 'COL',
  'Los Angeles Dodgers': 'LAD',
  'San Diego Padres': 'SD',
  'San Francisco Giants': 'SF'
};

const getTeamAbbreviation = (teamName: string): string => {
  return TEAM_ABBREVIATIONS[teamName] || teamName;
};

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
  status?: 'pending' | 'won' | 'lost';
  finalScore?: string;
  gradedAt?: string;
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



// Grade Badge Component
function GradeBadge({ grade }: { grade: string }) {
  const colorClasses = getGradeColorClasses(grade);
  
  return (
    <Badge 
      className={`${colorClasses.bg} ${colorClasses.text} ${colorClasses.border} font-bold px-2 py-0.5 text-sm md:px-3 md:py-1 md:text-lg cursor-pointer border rounded md:rounded-md`}
      onClick={(e) => e.stopPropagation()}
    >
      {grade}
    </Badge>
  );
}

// Factor Grade Conversion (No F grades)
function scoreToGrade(score: number): string {
  // ENHANCED THRESHOLDS: More A-/A/A+ grades while maintaining C grade variety
  if (score >= 75.0) return 'A+';  // Elite opportunities (2-3 games)
  if (score >= 72.0) return 'A';   // Strong opportunities (3-4 games)  
  if (score >= 69.0) return 'A-';  // Very good opportunities (4-5 games)
  if (score >= 66.0) return 'B+';  // Good opportunities (4-5 games)
  if (score >= 63.0) return 'B';   // Decent opportunities (5-6 games)
  if (score >= 60.0) return 'B-';  // Average+ opportunities (4-5 games)
  if (score >= 57.0) return 'C+';  // Above average (3-4 games)
  if (score >= 54.0) return 'C';   // Average games (3-4 games)
  if (score >= 51.0) return 'C-';  // Below average (2-3 games)
  if (score >= 48.0) return 'D+';  // Poor games (1-2 games)
  if (score >= 45.0) return 'D';   // Very poor (0-1 games)
  return 'F';                      // Avoid completely
}

// Unified Info Button Component with Dark Background
function InfoButton({ info, title, score }: { info: string; title: string; score?: number }) {
  const getGradeExplanation = (score: number, factorTitle: string): string => {
    // Enhanced explanations based on factor type with more detail
    switch (factorTitle) {
      case 'Market Edge':
        if (score >= 90) return 'Exceptional betting value detected. Our model identifies significant market inefficiency with the bookmaker odds likely underpricing this outcome by 5-10%. This represents premium Kelly Criterion territory with strong expected value.';
        if (score >= 80) return 'Solid market edge identified. The betting line appears to undervalue our selection based on probability analysis, suggesting positive expected value of 2-5% over fair market price.';
        if (score >= 75) return 'Market appears fairly efficient with minimal edge detected. Odds roughly align with our calculated probability, indicating neutral expected value.';
        return 'Limited or negative market edge. The current line may overvalue our selection, suggesting the market has priced this outcome accurately or even unfavorably for bettors.';
        
      case 'Situational Edge':
        if (score >= 85) return 'Multiple situational factors strongly favor this selection. This includes optimal ballpark dimensions, significant home field advantage, favorable travel/rest situations, and game timing that benefits our pick.';
        if (score >= 75) return 'Situational factors provide modest advantage. Home field, ballpark effects, or scheduling create slight favorable conditions without major disadvantages.';
        if (score === 75) return 'Neutral situational context with balanced advantages and disadvantages. No significant situational edge identified.';
        return 'Situational factors may work against our selection. Adverse ballpark effects, challenging travel, or unfavorable game context could impact performance.';
        
      case 'Pitching Matchup':
        if (score >= 85) return 'Clear starting pitcher advantage based on current form and historical matchups. Our pitcher shows superior recent performance metrics (ERA, WHIP, K-rate) and favorable stylistic matchup against opposing lineup.';
        if (score >= 75) return 'Modest pitching edge detected. Starting pitcher comparison shows slight advantage in recent effectiveness or matchup-specific factors like opposing team\'s performance vs similar pitching styles.';
        if (score === 75) return 'Even pitching matchup with comparable starters. Both pitchers show similar recent form and effectiveness, creating neutral expectations.';
        return 'Potential pitching disadvantage. Opposing starter may have superior recent form, better historical performance against similar lineups, or stylistic advantage.';
        
      case 'Team Momentum':
        if (score >= 90) return 'Team displays exceptional recent momentum with hot streak significantly outpacing season averages. Last 10 games show strong performance trend with multiple quality wins indicating peak form.';
        if (score >= 80) return 'Positive momentum trajectory with recent performance exceeding season norms. Team shows consistent recent play with multiple indicators of good form and confidence.';
        if (score >= 75) return 'Neutral momentum with recent performance aligning with season averages. No significant hot or cold streaks detected.';
        return 'Concerning momentum trends with recent underperformance. Team may be struggling with confidence, injuries, or tactical issues affecting recent results.';
        
      case 'System Confidence':
        if (score >= 85) return 'High model confidence based on complete data availability and strong factor consensus. All analytical components align with minimal uncertainty or conflicting signals.';
        if (score >= 75) return 'Moderate system confidence with good data quality and reasonable factor alignment. Some minor uncertainty exists but overall model conviction remains solid.';
        if (score === 75) return 'Average confidence level with standard data completeness. Normal level of analytical uncertainty expected for typical game analysis.';
        return 'Lower system confidence due to incomplete data, conflicting analytical signals, or unusual circumstances that reduce model certainty.';
        
      case 'Offensive Production':
        if (score >= 85) return 'Elite offensive metrics from advanced Baseball Savant data. Team shows exceptional xwOBA, barrel rate, and exit velocity trends combined with strong recent run production efficiency.';
        if (score >= 75) return 'Above-average offensive indicators with solid underlying metrics. Recent production shows good quality contact and run-scoring efficiency trends.';
        if (score === 75) return 'Average offensive production with metrics aligning to league norms. No significant advantages or disadvantages detected.';
        return 'Below-average offensive metrics with concerning trends in quality contact or run production efficiency relative to opposition.';
        
      default:
        // Enhanced fallback explanations
        if (score >= 90) return 'Elite performance category indicating exceptional advantage in this analytical area.';
        if (score >= 80) return 'Strong performance showing clear competitive advantage with multiple supporting indicators.';
        if (score >= 75) return 'Neutral baseline performance with balanced factors and average expectations.';
        return 'Below-average performance indicating potential disadvantage requiring consideration.';
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="p-0 h-4 w-4 bg-black dark:bg-gray-500 hover:bg-gray-800 dark:hover:bg-gray-400 rounded-full flex items-center justify-center">
          <Info className="h-2.5 w-2.5 text-white dark:text-black" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-4 text-xs max-h-80 overflow-y-auto" side="top">
        <div className="font-medium mb-2">{title}</div>
        <div className="mb-3 text-gray-700 dark:text-gray-300 leading-relaxed">{info.split('\n\n')[0]}</div>
        {score !== undefined && score > 0 && (
          <div className="border-t pt-2 mt-2 text-xs text-gray-600 dark:text-gray-400">
            <div className="font-medium mb-1">Grade Meaning:</div>
            <div className="text-gray-800 dark:text-gray-200 leading-relaxed">{info.split('\n\n')[1] || getGradeExplanation(score, title)}</div>
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

  const colorClasses = getLockPickFactorColorClasses(value);
  
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
  const colorClasses = getLockPickFactorColorClasses(score);
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

// Helper function to determine game status
function getGameStatus(gameTime: string): 'upcoming' | 'live' | 'completed' {
  try {
    if (!gameTime) return 'upcoming';
    const now = new Date();
    const gameStart = new Date(gameTime);
    
    if (isNaN(gameStart.getTime())) return 'upcoming';
    
    const gameEnd = new Date(gameStart.getTime() + (4 * 60 * 60 * 1000)); // Assume 4-hour games
    
    if (now < gameStart) return 'upcoming';
    if (now >= gameStart && now < gameEnd) return 'live';
    return 'completed';
  } catch {
    return 'upcoming';
  }
}

// Helper functions
const formatOdds = (odds: number, betType?: string) => {
  const oddsText = odds > 0 ? `+${odds}` : odds.toString();
  
  // Add bet type indicator for moneyline bets
  if (betType === 'moneyline') {
    return `ML ${oddsText}`;
  }
  
  return oddsText;
};

const formatGameTime = (gameTime: string) => {
  try {
    if (!gameTime) return "TBD";
    const date = new Date(gameTime);
    return !isNaN(date.getTime()) ? date.toLocaleString() : "TBD";
  } catch {
    return "TBD";
  }
};

// Format inning display for live games
const formatInning = (inningData: any) => {
  if (!inningData) return 'Live';
  
  if (typeof inningData === 'string') {
    // Handle simple string format like "Top 3rd", "Bot 9th"
    return inningData;
  }
  
  if (typeof inningData === 'object' && inningData.current) {
    // Handle detailed inning object
    const { current, state } = inningData;
    const getOrdinal = (num: number) => {
      const j = num % 10;
      const k = num % 100;
      if (j === 1 && k !== 11) return `${num}st`;
      if (j === 2 && k !== 12) return `${num}nd`;
      if (j === 3 && k !== 13) return `${num}rd`;
      return `${num}th`;
    };
    
    const statePrefix = state === 'Top' ? 'T' : state === 'Bottom' ? 'B' : state?.substring(0, 1) || 'T';
    return `${statePrefix}${current}`;
  }
  
  return inningData.toString();
};

// Enhanced game status formatter
const formatGameStatus = (score: any) => {
  if (!score) return 'Live';
  
  const status = score.status?.toLowerCase() || '';
  
  // Check for finished states
  if (status.includes('final') || status.includes('completed') || status.includes('game over')) {
    return 'Finished';
  }
  
  // Check for live states with inning info
  if (score.inning) {
    return formatInning(score.inning);
  }
  
  // Check for in-progress states
  if (status.includes('progress') || status.includes('live')) {
    return 'Live';
  }
  
  return 'Live';
};

// Get all 6 factors with their info descriptions in permanent order
const getFactors = (analysis: any, probablePitchers: { home: string | null; away: string | null }) => {
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
    score: (homePitcher !== 'TBD' && awayPitcher !== 'TBD') ? (analysis.pitchingMatchup || 0) : 0,
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

export default function LoggedInLockPick() {
  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false);
  const [oddsModalOpen, setOddsModalOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<any>(null);
  const [mobileAnalysisOpen, setMobileAnalysisOpen] = useState(false);
  const [mobileReasoningExpanded, setMobileReasoningExpanded] = useState(false);
  const [lockPickMediumOpen, setLockPickMediumOpen] = useState(false); // Start collapsed for stacked layout
  const [lockPickLargeOpen, setLockPickLargeOpen] = useState(true); // Start expanded for side-by-side
  const [gameStartedCollapsed, setGameStartedCollapsed] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false); // Manual collapse state
  // Removed odds cycling functionality

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL LOGIC
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Fetch lock pick only for authenticated users
  const { data: lockPick, isLoading } = useQuery<any>({
    queryKey: ['/api/daily-pick/lock'],
    enabled: !authLoading && isAuthenticated, // Only fetch when authenticated
    staleTime: 30 * 60 * 1000, // Consider data fresh for 30 minutes
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour (renamed from cacheTime)
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    refetchInterval: false, // Disable automatic refetching to prevent pick changes
  });

  const { data: analysisDetails } = useQuery<PickAnalysisDetails | null>({
    queryKey: [`/api/daily-pick/${lockPick?.id}/analysis`],
    enabled: !!lockPick?.id && analysisDialogOpen && isAuthenticated,
  });

  const { data: gamesData } = useQuery({
    queryKey: ['/api/mlb/complete-schedule'],
    enabled: !!lockPick?.gameId,
  });

  // Fetch live odds to update pick odds dynamically
  const { data: liveOdds } = useQuery({
    queryKey: ['/api/odds/live/baseball_mlb'],
    enabled: !!lockPick?.gameId,
    refetchInterval: 60 * 1000, // Refetch every minute for odds updates
  });

  // Fetch live scores for the game
  const { data: gameScore } = useQuery({
    queryKey: ['/api/mlb/scores', lockPick?.gameTime ? new Date(lockPick.gameTime).toISOString().split('T')[0] : ''],
    enabled: !!lockPick?.gameTime,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for live updates
  });

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

  // Track visits for analytics (but don't use for collapsing)
  useEffect(() => {
    if (lockPick?.id) {
      // Clean up old visits on component mount
      cleanupOldVisits();
      
      // Track this visit for analytics
      trackPickVisit(lockPick.id);
    }
  }, [lockPick?.id]);

  // Early return only if still loading auth status
  if (authLoading) {
    return null;
  }

  // Show login prompt for non-authenticated users
  if (!isAuthenticated) {
    return (
      <Card className="w-full bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800">
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <BetBotIcon className="w-12 h-12 opacity-80" />
              <Lock className="w-6 h-6 text-amber-600 dark:text-amber-400 absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-1" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-lg text-amber-700 dark:text-amber-400">
                Log in to view another free pick
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Access your exclusive Logged In Lock pick by signing in
              </p>
            </div>
            <Button 
              className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 font-semibold"
              onClick={() => {
                // Clear auth cache before redirect to ensure fresh data after login
                queryClient.removeQueries({ queryKey: ["/api/auth/user"] });
                window.location.href = '/api/auth/login';
              }}
            >
              Log in
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Early return if no lock pick data is available
  if (!lockPick) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No lock pick available for today</p>
      </div>
    );
  }

  // Find current game score data with improved matching logic
  const liveLockGameScore = (Array.isArray(gameScore) ? gameScore : []).find((game: any) => {
    const gameIdMatch = game.gameId === parseInt(lockPick.gameId || '0') || 
                       game.gameId === lockPick.gameId;
    const teamMatch = game.homeTeam === lockPick.homeTeam && 
                     game.awayTeam === lockPick.awayTeam;
    return gameIdMatch || teamMatch;
  });

  // Check if game has actually started based on live data and timing
  const isGameStarted = (gameTime: string) => {
    // If we have live game score data, use that to determine status
    if (liveLockGameScore) {
      const status = liveLockGameScore.status?.toLowerCase() || '';
      // Only show live displays if game is actually in progress or finished
      return status.includes('progress') || status.includes('live') || 
             status.includes('final') || status.includes('completed') ||
             status.includes('game over') || liveLockGameScore.inning;
    }
    
    // Fallback to time-based check with 30-minute buffer
    // (games often start later than scheduled)
    const now = new Date();
    const game = new Date(gameTime);
    const timeDiff = now.getTime() - game.getTime();
    const thirtyMinutes = 30 * 60 * 1000;
    
    return timeDiff > thirtyMinutes;
  };

  // Get best odds from all available bookmakers
  const getBestOddsFromBookmakers = () => {
    if (!lockPick || !gamesData || !Array.isArray(gamesData)) {
      return [];
    }

    const currentGame = gamesData.find((game: any) => game.id === lockPick.gameId);
    if (!currentGame?.bookmakers || !Array.isArray(currentGame.bookmakers)) {
      return [];
    }

    const bestOdds: Array<{bookmaker: string, odds: number}> = [];

    // Extract odds for the pick team from each bookmaker
    currentGame.bookmakers.forEach((bookmaker: any) => {
      const moneylineMarket = bookmaker.markets?.find((m: any) => m.key === 'h2h');
      if (moneylineMarket?.outcomes) {
        const pickTeamOutcome = moneylineMarket.outcomes.find((o: any) => o.name === lockPick.pickTeam);
        if (pickTeamOutcome?.price) {
          bestOdds.push({
            bookmaker: bookmaker.title || bookmaker.key,
            odds: pickTeamOutcome.price
          });
        }
      }
    });

    // Sort odds: for negative odds, show closest to 0 first (-170, -172, -175)
    // For positive odds, show highest first (+150, +120, +100)
    return bestOdds.sort((a, b) => {
      // For positive odds (underdogs), higher is better
      if (a.odds > 0 && b.odds > 0) return b.odds - a.odds;
      // For negative odds (favorites), higher number appears first (-170 before -175)
      if (a.odds < 0 && b.odds < 0) return b.odds - a.odds;
      // Mixed: positive odds (underdog) is always better than negative
      if (a.odds > 0 && b.odds < 0) return -1;
      if (a.odds < 0 && b.odds > 0) return 1;
      return 0;
    });
  };

  // Use stored odds for consistency with reasoning (no live odds updates for lock picks)
  const getCurrentOdds = () => {
    // Always use the original stored odds to maintain consistency with stored reasoning
    return {
      homeOdds: lockPick?.pickTeam === lockPick?.homeTeam ? lockPick?.odds : null,
      awayOdds: lockPick?.pickTeam !== lockPick?.homeTeam ? lockPick?.odds : null,
      pickTeamOdds: lockPick?.odds || null,
      bookmaker: 'Original Pick',
      totalBooks: 1
    };
  };

  const handleMakePick = (e: React.MouseEvent, market: string, selection: string, line?: number) => {
    e.stopPropagation();
    
    if (!lockPick) return;
    
    const currentOdds = getCurrentOdds();
    
    const betInfo = {
      market,
      selection,
      line,
      odds: currentOdds.pickTeamOdds || lockPick.odds
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
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-600 dark:text-gray-400">
                {isAuthenticated ? "No Lock Pick Available Today" : "Log in to view another free pick"}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                {isAuthenticated ? "Check back when games with odds are available" : "Access your exclusive lock pick by signing in"}
              </p>
              {!isAuthenticated && (
                <Button 
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                  onClick={() => window.location.href = '/api/auth/login'}
                >
                  Log in
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Helper function definition
  const formatGameTime = (gameTime: string) => {
    try {
      if (!gameTime) return "TBD";
      const date = new Date(gameTime);
      if (isNaN(date.getTime())) return "TBD";
      
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
    } catch {
      return "TBD";
    }
  };

  // When game starts, show collapsed view by default
  const gameStarted = lockPick ? isGameStarted(lockPick.gameTime) : false;

  // Check if game is finished
  const isGameFinished = liveLockGameScore?.status === 'Final' || liveLockGameScore?.status === 'Completed';
  
  // Determine win/loss for finished games
  const getGameResult = () => {
    if (!isGameFinished || !liveLockGameScore) return null;
    
    const pickTeamScore = lockPick.pickTeam === lockPick.homeTeam 
      ? liveLockGameScore.homeScore 
      : liveLockGameScore.awayScore;
    const opponentScore = lockPick.pickTeam === lockPick.homeTeam 
      ? liveLockGameScore.awayScore 
      : liveLockGameScore.homeScore;
    
    if (pickTeamScore > opponentScore) return 'won';
    if (pickTeamScore < opponentScore) return 'lost';
    return 'tied';
  };

  const gameResult = getGameResult();

  // Format odds helper function
  const formatOdds = (odds: number, pickType: string) => {
    const sign = odds > 0 ? `+${odds}` : `${odds}`;
    const type = pickType === 'moneyline' ? 'ML' : 
                 pickType === 'spread' ? 'SP' : 
                 pickType === 'over_under' ? 'O/U' : 'ML';
    return `${type} ${sign}`;
  };

  // Show simplified view when game has started or when manually collapsed
  if (gameStarted || isCollapsed) {
    const pickOdds = getCurrentOdds()?.pickTeamOdds ?? lockPick.odds;
    const formattedOdds = pickOdds > 0 ? `+${pickOdds}` : `${pickOdds}`;
    
    return (
      <Card className="w-full relative bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
        {/* Win/Loss Badge for Finished Games */}
        {(lockPick.status === 'won' || lockPick.status === 'lost' || gameResult === 'won' || gameResult === 'lost') && (
          <div className="absolute top-3 right-3 z-10">
            <div className={`px-3 py-1 rounded-full text-sm font-bold text-white shadow-lg ${
              (lockPick.status === 'won' || gameResult === 'won') ? 'bg-green-500' : 'bg-red-500'
            }`}>
              {(lockPick.status === 'won' || gameResult === 'won') ? 'WON' : 'LOST'}
            </div>
          </div>
        )}
        
        <CardContent className="p-4 sm:p-6 lg:p-8 h-full flex flex-col justify-between min-h-[180px] sm:min-h-[200px]">
          <div className="space-y-3 sm:space-y-4 lg:space-y-6">
            {/* Header Row */}
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
                <div className="relative">
                  <BetBotIcon className="w-8 h-8 sm:w-10 h-10 lg:w-12 h-12" />
                  <Lock className="w-3 h-3 sm:w-4 h-4 lg:w-5 h-5 text-amber-600 dark:text-amber-400 absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-0.5 sm:p-1" />
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-amber-700 dark:text-amber-400">
                    Logged In Lock
                  </h3>
                  <div className="scale-75 sm:scale-90 lg:scale-100">
                    <GradeBadge grade={lockPick.grade} />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Pick Information - Main Content */}
            <div className="space-y-2 sm:space-y-3 lg:space-y-4 flex-1">
              <p className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white leading-tight">
                The lock was <span className="text-sm sm:text-base lg:text-lg text-amber-700 dark:text-amber-400">{lockPick.pickTeam} ML {formattedOdds}</span>
              </p>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                {lockPick.awayTeam} @ {lockPick.homeTeam}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500">
                {formatGameTime(lockPick.gameTime)}
              </p>
            </div>
          </div>
          
          {/* Action Buttons - Bottom */}
          <div className="flex flex-col sm:flex-row items-center justify-between w-full pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700 space-y-2 sm:space-y-0">
            <Dialog open={analysisDialogOpen} onOpenChange={setAnalysisDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 border-amber-300 dark:border-amber-600 px-4 sm:px-6 py-2 text-sm sm:text-base"
                >
                  View Analysis
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
                            {lockPick?.reasoning || 'No reasoning available'}
                          </pre>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-3">Analysis Factors</h4>
                          <div className="space-y-3">
                            {getFactors(lockPick?.analysis || {}, lockPick?.probablePitchers || {}).map(({ key, title, score, info }) => (
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
            <Link href="/scores" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto flex items-center justify-center space-x-2 sm:space-x-3 bg-amber-600 hover:bg-amber-700 text-white px-4 sm:px-6 lg:px-8 py-2 sm:py-3 rounded-lg shadow-lg font-semibold text-sm sm:text-base">
                <ExternalLink className="w-4 h-4 sm:w-5 h-5" />
                <span>Check Live Scores</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }



  // Show expanded view for live games
  if (gameStarted && !gameStartedCollapsed) {
    return (
      <Card className="w-full relative">
        {isGameFinished && gameResult && (
          <div className="absolute top-2 right-2 z-10">
            <div className={`px-2 py-1 rounded text-xs font-bold text-white ${
              gameResult === 'won' ? 'bg-green-500' : 
              gameResult === 'lost' ? 'bg-red-500' : 'bg-gray-500'
            }`}>
              {gameResult.toUpperCase()}
            </div>
          </div>
        )}
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <BetBotIcon className="w-12 h-12" />
                <Lock className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-amber-600 dark:text-amber-400">Logged In Lock</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatGameTime(lockPick.gameTime)} • {lockPick.venue}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setGameStartedCollapsed(true)}
              className="p-1"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          </div>

          {/* Enhanced Game Score Display */}
          {liveLockGameScore && (
            <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-6 border border-amber-200 dark:border-amber-700">
              <div className="grid grid-cols-3 gap-6 items-center">
                {/* Away Team */}
                <div className="text-center">
                  <div className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-2">
                    {getTeamAbbreviation(lockPick.awayTeam)}
                  </div>
                  <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
                    {liveLockGameScore.awayScore || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {lockPick.awayTeam}
                  </div>
                </div>
                
                {/* Game Status */}
                <div className="text-center">
                  <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold text-white mb-3 ${
                    isGameFinished ? 'bg-gray-600' : 'bg-red-500 animate-pulse'
                  }`}>
                    {isGameFinished ? '🏁 FINAL' : '🔴 LIVE'}
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatGameStatus(liveLockGameScore)}
                  </div>
                </div>
                
                {/* Home Team */}
                <div className="text-center">
                  <div className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-2">
                    {getTeamAbbreviation(lockPick.homeTeam)}
                  </div>
                  <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
                    {liveLockGameScore.homeScore || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {lockPick.homeTeam}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pick details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Our Pick: {lockPick.pickTeam}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Moneyline {lockPick.odds > 0 ? `+${lockPick.odds}` : lockPick.odds} • Grade {lockPick.grade}
                </p>
              </div>
              <div className="relative">
                <div className={`px-3 py-1 rounded text-sm font-bold text-black ${
                  lockPick.grade === 'A+' ? 'bg-amber-500' :
                  lockPick.grade === 'A' ? 'bg-amber-400' :
                  lockPick.grade.startsWith('B') ? 'bg-amber-300' :
                  lockPick.grade.startsWith('C') ? 'bg-gray-500' : 'bg-orange-500'
                }`}>
                  Grade {lockPick.grade}
                </div>
                {!gameStarted && (
                  <Dialog open={analysisDialogOpen} onOpenChange={setAnalysisDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="absolute -top-2 -right-2 p-1 h-4 w-4 bg-black dark:bg-gray-800 text-white hover:bg-gray-800 dark:hover:bg-gray-700 rounded-full flex items-center justify-center cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-xs font-bold">i</span>
                      </Button>
                    </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          <BetBotIcon className="w-6 h-6" />
                          <Lock className="w-5 h-5 text-amber-500" />
                        </div>
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
                            lockPick?.grade || 'C',
                            lockPick?.confidence || 50,
                            lockPick?.analysis || {},
                            lockPick?.pickTeam || '',
                            lockPick?.odds || 100
                          )}
                        </pre>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3">Analysis Factors</h4>
                        <div className="space-y-3">
                          {getFactors(lockPick?.analysis || {}, lockPick?.probablePitchers || {}).map(({ key, title, score, info }) => (
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

            <div className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Reasoning:</strong> {lockPick.reasoning}
            </div>
          </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Debug logging (remove in production)
  // if (lockPick && gameScore && gameScore.length > 0) {
  //   console.log('Lock pick game ID:', lockPick.gameId, typeof lockPick.gameId);
  //   console.log('Lock pick teams:', lockPick.awayTeam, '@', lockPick.homeTeam);
  //   console.log('Available scores data (first 2):', gameScore.slice(0, 2));
  //   console.log('Found matching score:', liveLockGameScore);
  // }



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

  return (
    <>
      {/* Mobile-first wireframe design */}
      <div className="md:hidden">
        <Card className="w-full bg-[#1a1a1a] dark:bg-[#1a1a1a] border-gray-700 relative">
          {/* Blur overlay for non-authenticated users */}
          {!isAuthenticated && (
            <div className="absolute inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
              <div className="text-center">
                <Lock className="w-10 h-10 sm:w-12 sm:h-12 text-amber-600 dark:text-amber-400 mx-auto mb-3" />
                <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-gray-100 mb-1">
                  Login to view another free pick
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Access your exclusive lock pick by signing in
                </p>
                <Button onClick={() => window.location.href = '/api/login'}>
                  Login
                </Button>
              </div>
            </div>
          )}
          
          <CardContent className={`p-4 space-y-4 ${!isAuthenticated ? 'blur-sm' : ''}`}>
            {/* Header: Title and Grade Badge */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-amber-400 font-sans">Logged In Lock</h2>
              <div className="flex items-center space-x-2">
                <div className={`${getGradeColorClasses(lockPick.grade).bg} ${getGradeColorClasses(lockPick.grade).text} px-3 py-1 rounded-md text-sm font-bold`}>
                  {lockPick.grade}
                </div>
                <Dialog open={analysisDialogOpen} onOpenChange={setAnalysisDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-0 h-4 w-4 bg-transparent hover:bg-gray-100 dark:bg-black/80 dark:hover:bg-black/90 rounded-full flex items-center justify-center"
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
                        <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                          {getMainGradeExplanation(
                            lockPick?.grade || 'C',
                            lockPick?.confidence || 50,
                            lockPick?.analysis || {},
                            lockPick?.pickTeam || '',
                            lockPick?.odds || 100
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3">Analysis Factors</h4>
                        <div className="space-y-3">
                          {getFactors(lockPick?.analysis || {}, lockPick?.probablePitchers || {}).map(({ key, title, score, info }) => (
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

            {/* Matchup Title */}
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-white font-sans">
                {(() => {
                  // Use original pregame odds instead of live odds
                  const oddsText = lockPick.odds > 0 ? `+${lockPick.odds}` : lockPick.odds;
                  const isAwayTeam = lockPick.pickTeam === lockPick.awayTeam;
                  const separator = isAwayTeam ? ' at ' : ' vs ';
                  const otherTeam = isAwayTeam ? lockPick.homeTeam : lockPick.awayTeam;
                  
                  return (
                    <>
                      <span className="text-amber-400 font-bold">
                        {lockPick.pickTeam} ML {oddsText}
                      </span>
                      {separator}
                      <span>
                        {getTeamAbbreviation(otherTeam)}
                      </span>
                    </>
                  );
                })()}
              </h3>
              
              {/* Pitchers */}
              {lockPick.probablePitchers?.away && lockPick.probablePitchers?.home && (
                <p className="text-sm text-gray-300 font-sans">
                  {lockPick.probablePitchers.away} vs {lockPick.probablePitchers.home}
                </p>
              )}
              
              {/* Game Info */}
              <p className="text-xs text-gray-400 font-sans">
                {formatGameTime(lockPick.gameTime)} • {lockPick.venue}
              </p>
            </div>

            {/* Analysis Section with Dropdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setMobileAnalysisOpen(!mobileAnalysisOpen)}>
                <span className="text-sm font-medium text-white">Analysis</span>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${mobileAnalysisOpen ? 'rotate-180' : ''}`} />
              </div>
              
              {/* Collapsible Analysis Content */}
              {mobileAnalysisOpen && (
                <div className="space-y-3 pt-2">
                  {/* Analysis Factors with Info Buttons */}
                  <div className="space-y-2 bg-gray-800/30 rounded-lg p-3">
                    {factors.map((factor) => (
                      <FactorScore 
                        key={factor.key}
                        title={factor.title}
                        score={factor.score || 0}
                        info={factor.info}
                        gameContext={lockPick}
                      />
                    ))}
                  </div>
                  
                  {/* Analysis Summary Blurb with Show More - Only for upcoming games */}
                  {(() => {
                    const gameStatus = getGameStatus(lockPick.gameTime);
                    return gameStatus === 'upcoming' ? (
                      <div className="bg-gray-800/20 rounded-lg p-3">
                        <div className="text-sm text-gray-300 font-sans leading-relaxed">
                          <p className={!mobileReasoningExpanded ? 'overflow-hidden' : ''} 
                             style={!mobileReasoningExpanded ? {
                               display: '-webkit-box',
                               WebkitLineClamp: 3,
                               WebkitBoxOrient: 'vertical'
                             } : {}}>
                            {getMobileReasoning(lockPick.grade, lockPick.analysis, lockPick.pickTeam, lockPick.odds)}
                          </p>
                          {getMobileReasoning(lockPick.grade, lockPick.analysis, lockPick.pickTeam, lockPick.odds).split(' ').length > 15 && (
                            <button
                              onClick={() => setMobileReasoningExpanded(!mobileReasoningExpanded)}
                              className="text-amber-400 hover:text-amber-300 text-xs mt-2 flex items-center gap-1"
                            >
                              {mobileReasoningExpanded ? (
                                <>Show Less <ChevronUp className="h-3 w-3" /></>
                              ) : (
                                <>Show More <ChevronDown className="h-3 w-3" /></>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </div>

            {/* Action Buttons - Always Visible */}
            <div className="flex space-x-3 pt-2">
              <button
                onClick={(e) => handleMakePick(e, 'h2h', lockPick.pickTeam)}
                className="flex-1 bg-[#10B981] hover:bg-[#059669] text-white font-semibold py-3 px-4 rounded-lg transition-colors font-sans min-h-[44px] flex items-center justify-center"
              >
                Pick
              </button>
              <button
                onClick={(e) => handleMakePick(e, 'h2h', lockPick.pickTeam === lockPick.homeTeam ? lockPick.awayTeam : lockPick.homeTeam)}
                className="flex-1 bg-[#EF4444] hover:bg-[#DC2626] text-white font-semibold py-3 px-4 rounded-lg transition-colors font-sans min-h-[44px] flex items-center justify-center"
              >
                Fade
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Desktop Layout */}
      <Card className="hidden md:block w-full bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800">
        <CardContent className="p-4 sm:p-6 relative">
          {/* Blur overlay for non-authenticated users */}
          {!isAuthenticated && (
            <div className="absolute inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
              <div className="text-center">
                <Lock className="w-10 h-10 sm:w-12 sm:h-12 text-amber-600 dark:text-amber-400 mx-auto mb-3" />
                <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-gray-100 mb-1">
                  Login to view another free pick
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Access your exclusive lock pick by signing in
                </p>
                <Button onClick={() => window.location.href = '/api/login'}>
                  Login
                </Button>
              </div>
            </div>
          )}
          
          <div className={`relative ${!isAuthenticated ? 'blur-sm' : ''}`}>


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
            <div className="flex flex-col items-end space-y-3">
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-6 w-6 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                onClick={() => setIsCollapsed(true)}
                title="Hide pick"
              >
                <ChevronUp className="h-3 w-3 text-gray-600 dark:text-gray-400" />
              </Button>
              <div className="flex items-center space-x-2 -mt-1">
                <Badge className="bg-amber-500 hover:bg-amber-500 text-white font-bold w-8 h-8 text-xs border rounded flex items-center justify-center cursor-pointer">
                  {lockPick.grade}
                </Badge>
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
                      <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {getMainGradeExplanation(
                          lockPick.grade,
                          lockPick.confidence,
                          lockPick.analysis,
                          lockPick.pickTeam,
                          lockPick.odds
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Analysis Factors</h4>
                      <div className="space-y-3">
                        {getFactors(lockPick.analysis, lockPick.probablePitchers).map(({ key, title, score, info }) => (
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
        </div>

        <div className="space-y-4">
          {/* Team matchup and odds (full width) */}
          <div className="space-y-2">
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
                    onClick={(e) => handleMakePick(e, 'h2h', lockPick.pickTeam)}
                    className="text-xs px-2 md:px-6 py-1 h-6 md:h-7 bg-green-600 hover:bg-green-700 text-white border-0 font-semibold shadow-sm"
                  >
                    Pick
                  </Button>
                )}
              </div>
            </div>
            <div className="ml-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                P: {matchup.topTeamPitcher === 'home' ? lockPick.probablePitchers.home : lockPick.probablePitchers.away || 'TBD'}
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
                    onClick={(e) => handleMakePick(e, 'h2h', matchup.bottomTeam)}
                    className="text-xs px-2 md:px-6 py-1 h-6 md:h-7 bg-red-600 hover:bg-red-700 text-white border-0 font-semibold shadow-sm"
                  >
                    Fade
                  </Button>
                )}
              </div>
            </div>
            <div className="ml-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                P: {matchup.bottomTeamPitcher === 'home' ? lockPick.probablePitchers.home : lockPick.probablePitchers.away || 'TBD'}
              </p>
            </div>
            <div className="mt-3">
              {/* Game Status Display */}
              {liveLockGameScore && (
                <div className="mb-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <div className="text-amber-600 dark:text-amber-400 font-semibold">
                        {liveLockGameScore.awayTeam}
                      </div>
                      {liveLockGameScore.status === 'Scheduled' ? (
                        <div className="text-sm text-gray-500 dark:text-gray-400">vs</div>
                      ) : (
                        <>
                          <div className="text-lg font-bold">
                            {liveLockGameScore.awayScore ?? 0}
                          </div>
                          <div className="text-gray-400">-</div>
                          <div className="text-lg font-bold">
                            {liveLockGameScore.homeScore ?? 0}
                          </div>
                        </>
                      )}
                      <div className="text-amber-600 dark:text-amber-400 font-semibold">
                        {liveLockGameScore.homeTeam}
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {liveLockGameScore.status === 'Final' ? 'Final' : 
                       liveLockGameScore.status === 'In Progress' ? 
                         (liveLockGameScore.inning ? `${liveLockGameScore.inning}` : 'Live') : 
                       liveLockGameScore.status === 'Scheduled' ? 'Scheduled' :
                       liveLockGameScore.status}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  {formatGameTime(lockPick.gameTime)} • {lockPick.venue}
                </p>
                {/* Analysis dropdown toggle for all screen sizes */}
                <button
                  className="flex items-center text-xs text-amber-600 dark:text-amber-400 ml-2"
                  onClick={() => setMobileAnalysisOpen(!mobileAnalysisOpen)}
                >
                  {mobileAnalysisOpen ? 'Hide' : 'Show'} Analysis
                  {mobileAnalysisOpen ? (
                    <ChevronUp className="w-3 h-3 ml-1" />
                  ) : (
                    <ChevronDown className="w-3 h-3 ml-1" />
                  )}
                </button>
              </div>

              {/* Analysis factors dropdown (all screen sizes) */}
              {mobileAnalysisOpen && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <h5 className="font-semibold text-sm text-amber-600 dark:text-amber-400 mb-3 text-center">
                    Analysis Factors
                  </h5>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2">
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
          </div>
        </div>
        </CardContent>
      </Card>
      
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
          bookmakers={(() => {
            const gamesArray = Array.isArray(gamesData) ? gamesData : [];
            console.log('LoggedInLockPick: Searching for gameId:', lockPick.gameId);
            console.log('LoggedInLockPick: Available game IDs:', gamesArray.map(g => g.id).slice(0, 5), '... (showing first 5)');
            
            let currentGame = gamesArray.find((game: any) => game.id === lockPick.gameId);
            let bookmakers = currentGame?.bookmakers || [];
            
            console.log('LoggedInLockPick: Found game by ID?', !!currentGame);
            
            if (!currentGame || bookmakers.length === 0) {
              // Enhanced fallback with multiple matching strategies
              console.log('LoggedInLockPick: Trying team name fallback for:', lockPick.awayTeam, '@', lockPick.homeTeam);
              
              currentGame = gamesArray.find((game: any) => {
                const gameAway = game.away_team || game.awayTeam;
                const gameHome = game.home_team || game.homeTeam;
                
                return (gameAway === lockPick.awayTeam && gameHome === lockPick.homeTeam) ||
                       (gameAway === lockPick.homeTeam && gameHome === lockPick.awayTeam);
              });
              
              if (currentGame) {
                bookmakers = currentGame.bookmakers || [];
                console.log('LoggedInLockPick: Found fallback game with', bookmakers.length, 'bookmakers');
              }
            }
            
            console.log('LoggedInLockPick: Final bookmaker count:', bookmakers.length);
            return bookmakers;
          })()}
          selectedBet={selectedBet}
        />
      )}
    </>
  );
}