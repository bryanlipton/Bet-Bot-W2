import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Info, TrendingUp, Target, MapPin, Clock, Users, ChevronDown, ChevronUp, Plus, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { OddsComparisonModal } from "@/components/OddsComparisonModal";
// import { savePick } from "@/services/pickStorage"; // Unused import
import { trackPickVisit, shouldCollapsePickForUser, cleanupOldVisits, shouldHideStartedPick } from "@/lib/visitTracker";
import { getFactorColorClasses, getFactorTooltip, getGradeColorClasses, getMainGradeExplanation, getMobileReasoning } from "@/lib/factorUtils";
import { generatePickAnalysisContent } from "@/lib/pickAnalysisUtils";
import { apiRequest } from "@/lib/queryClient";
import betbotLogo from "@assets/dde5f7b9-6c02-4772-9430-78d9b96b7edb_1752677738478.png";



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
    const grade = scoreToGrade(score);
    
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



// Factor Score Component with Info
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

// Helper functions declared at module level to avoid hoisting issues
const formatOdds = (odds: number, betType?: string) => {
  const oddsText = odds > 0 ? `+${odds}` : odds.toString();
  
  // Add bet type indicator for moneyline bets
  if (betType === 'moneyline') {
    return `ML ${oddsText}`;
  }
  
  return oddsText;
};

const formatGameTime = (gameTime: string) => {
  return new Date(gameTime).toLocaleString();
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

export default function DailyPick() {
  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false);
  const [oddsModalOpen, setOddsModalOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<any>(null);
  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const [manualEntry, setManualEntry] = useState({
    market: 'moneyline' as 'moneyline' | 'spread' | 'total',
    selection: '',
    line: '',
    odds: '',
    units: 1
  });
  const [mobileAnalysisOpen, setMobileAnalysisOpen] = useState(false);
  const [mobileReasoningExpanded, setMobileReasoningExpanded] = useState(false);
  const [dailyPickMediumOpen, setDailyPickMediumOpen] = useState(false); // Start collapsed for stacked layout
  const [dailyPickLargeOpen, setDailyPickLargeOpen] = useState(true); // Start expanded for side-by-side
  const [isCollapsed, setIsCollapsed] = useState(false); // New collapsed state for entire pick
  const [gameStartedCollapsed, setGameStartedCollapsed] = useState(true);
  // Removed odds cycling functionality

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
      score: (homePitcher !== 'TBD' && awayPitcher !== 'TBD') ? (analysis.pitchingMatchup ?? 0) : 0,
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

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL LOGIC
  const { data: dailyPick, isLoading } = useQuery<DailyPick | null>({
    queryKey: ['/api/daily-pick'],
    staleTime: 30 * 60 * 1000, // Consider data fresh for 30 minutes
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour (formerly cacheTime)
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    refetchInterval: false, // Disable automatic refetching to prevent pick changes
  });

  const { data: analysisDetails } = useQuery<PickAnalysisDetails | null>({
    queryKey: [`/api/daily-pick/${dailyPick?.id}/analysis`],
    enabled: !!dailyPick?.id && analysisDialogOpen,
  });

  const { data: gamesData } = useQuery({
    queryKey: ['/api/mlb/complete-schedule'],
    enabled: !!dailyPick?.gameId,
  });

  // Fetch live odds to update pick odds dynamically
  const { data: liveOdds } = useQuery({
    queryKey: ['/api/odds/live/baseball_mlb'],
    enabled: !!dailyPick?.gameId,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
    refetchInterval: false, // Disable automatic refetching
  });

  // Fetch live scores for the game
  const { data: gameScore } = useQuery({
    queryKey: ['/api/mlb/scores', dailyPick?.gameTime ? new Date(dailyPick.gameTime).toISOString().split('T')[0] : ''],
    enabled: !!dailyPick?.gameTime,
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false,
    refetchInterval: false, // Disable automatic refetching
  });

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

  // Find current game score data
  const liveGameScore = (Array.isArray(gameScore) ? gameScore : []).find((game: any) => {
    if (!dailyPick) return false;
    const gameIdMatch = game.gameId === parseInt(dailyPick.gameId || '0') || 
                       game.gameId === dailyPick.gameId;
    const teamMatch = game.homeTeam === dailyPick.homeTeam && 
                     game.awayTeam === dailyPick.awayTeam;
    return gameIdMatch || teamMatch;
  });

  // Check if game has actually started based on live data and timing
  const isGameStarted = (gameTime: string) => {
    // If we have live game score data, use that to determine status
    if (liveGameScore) {
      const status = liveGameScore.status?.toLowerCase() || '';
      // Only show live displays if game is actually in progress or finished
      return status.includes('progress') || status.includes('live') || 
             status.includes('final') || status.includes('completed') ||
             status.includes('game over') || liveGameScore.inning;
    }
    
    // Fallback to time-based check with 30-minute buffer
    // (games often start later than scheduled)
    const now = new Date();
    const game = new Date(gameTime);
    const timeDiff = now.getTime() - game.getTime();
    const thirtyMinutes = 30 * 60 * 1000;
    
    return timeDiff > thirtyMinutes;
  };

  // Get current pitcher information from the latest game data
  const getCurrentPitchers = () => {
    if (!dailyPick || !gamesData || !Array.isArray(gamesData)) {
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

  // Get best odds from all available bookmakers
  const getBestOddsFromBookmakers = () => {
    if (!dailyPick || !gamesData || !Array.isArray(gamesData)) {
      return [];
    }

    const currentGame = gamesData.find((game: any) => game.id === dailyPick.gameId);
    if (!currentGame?.bookmakers || !Array.isArray(currentGame.bookmakers)) {
      return [];
    }

    const bestOdds: Array<{bookmaker: string, odds: number}> = [];

    // Extract odds for the pick team from each bookmaker
    currentGame.bookmakers.forEach((bookmaker: any) => {
      const moneylineMarket = bookmaker.markets?.find((m: any) => m.key === 'h2h');
      if (moneylineMarket?.outcomes) {
        const pickTeamOutcome = moneylineMarket.outcomes.find((o: any) => o.name === dailyPick.pickTeam);
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

  // Get best odds (no cycling, just display the best)
  const getCurrentOdds = () => {
    const bestOdds = getBestOddsFromBookmakers();
    
    if (bestOdds.length > 0) {
      const bestOdds_first = bestOdds[0]; // Always use the best odds
      return {
        homeOdds: dailyPick?.pickTeam === dailyPick?.homeTeam ? bestOdds_first.odds : null,
        awayOdds: dailyPick?.pickTeam !== dailyPick?.homeTeam ? bestOdds_first.odds : null,
        pickTeamOdds: bestOdds_first.odds,
        bookmaker: bestOdds_first.bookmaker,
        totalBooks: bestOdds.length
      };
    }

    // Fallback to stored odds
    return {
      homeOdds: dailyPick?.odds || null,
      awayOdds: dailyPick?.odds || null,
      pickTeamOdds: dailyPick?.odds || null,
      bookmaker: 'Stored',
      totalBooks: 0
    };
  };

  const handleMakePick = (e: React.MouseEvent, market: string, selection: string, line?: number) => {
    e.stopPropagation();
    
    if (!dailyPick) return;
    
    const currentOdds = getCurrentOdds();
    
    const betInfo = {
      market,
      selection,
      line,
      odds: currentOdds.pickTeamOdds || dailyPick.odds
    };
    
    // Close any existing modal first to prevent overlap
    setOddsModalOpen(false);
    
    // Small delay to ensure old modal is closed before opening new one
    setTimeout(() => {
      setSelectedBet(betInfo);
      setOddsModalOpen(true);
    }, 50);
  };

  // Handle manual entry from odds comparison modal
  const handleManualEntry = (gameInfo: any, selectedBet: any) => {
    // Pre-fill the manual entry form with data from the odds comparison modal
    setManualEntry({
      market: selectedBet.market,
      selection: selectedBet.selection,
      line: selectedBet.line?.toString() || '',
      odds: selectedBet.odds?.toString() || '',
      units: 1
    });
    setManualEntryOpen(true);
  };

  // Handle manual entry submission
  const handleManualEntrySubmit = async () => {
    if (!manualEntry.selection || !dailyPick) {
      alert('Please enter a selection');
      return;
    }

    try {
      // Save pick to database via API
      const pickData = {
        game: `${dailyPick.awayTeam} @ ${dailyPick.homeTeam}`,
        homeTeam: dailyPick.homeTeam,
        awayTeam: dailyPick.awayTeam,
        teamBet: manualEntry.selection,
        market: manualEntry.market === 'total' ? 
          (manualEntry.selection === 'Over' ? 'over' : 'under') : 
          manualEntry.market,
        line: manualEntry.line || null,
        odds: manualEntry.odds ? parseFloat(manualEntry.odds) : 0,
        units: manualEntry.units || 1,
        bookmaker: 'manual',
        bookmakerDisplayName: 'Manual Entry',
        gameDate: new Date(dailyPick.gameTime)
      };

      // Save to database
      await apiRequest('POST', '/api/user/picks', pickData);

      // Close modal and reset form
      setManualEntryOpen(false);
      setManualEntry({
        market: 'moneyline',
        selection: '',
        line: '',
        odds: '',
        units: 1
      });

    } catch (error) {
      console.error('Error saving manual pick:', error);
      alert('Error saving pick. Please try again.');
    }
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
  const gameStarted = dailyPick ? isGameStarted(dailyPick.gameTime) : false;

  // Check if game is finished
  const isGameFinished = liveGameScore?.status === 'Final' || liveGameScore?.status === 'Completed';
  
  // Determine win/loss for finished games
  const getGameResult = () => {
    if (!isGameFinished || !liveGameScore) return null;
    
    const pickTeamScore = dailyPick.pickTeam === dailyPick.homeTeam 
      ? liveGameScore.homeScore 
      : liveGameScore.awayScore;
    const opponentScore = dailyPick.pickTeam === dailyPick.homeTeam 
      ? liveGameScore.awayScore 
      : liveGameScore.homeScore;
    
    if (pickTeamScore > opponentScore) return 'won';
    if (pickTeamScore < opponentScore) return 'lost';
    return 'tied';
  };

  const gameResult = getGameResult();

  // Show simplified view when game has started
  if (gameStarted) {
    const pickOdds = getCurrentOdds()?.pickTeamOdds ?? dailyPick.odds;
    const formattedOdds = pickOdds > 0 ? `+${pickOdds}` : `${pickOdds}`;
    
    return (
      <Card className="w-full relative bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
        {/* Win/Loss Badge for Finished Games */}
        {(dailyPick.status === 'won' || dailyPick.status === 'lost' || gameResult === 'won' || gameResult === 'lost') && (
          <div className="absolute top-3 right-3 z-10">
            <div className={`px-3 py-1 rounded-full text-sm font-bold text-white shadow-lg ${
              (dailyPick.status === 'won' || gameResult === 'won') ? 'bg-green-500' : 'bg-red-500'
            }`}>
              {(dailyPick.status === 'won' || gameResult === 'won') ? 'WON' : 'LOST'}
            </div>
          </div>
        )}
        
        <CardContent className="p-4 sm:p-6 lg:p-8 h-full flex flex-col justify-between min-h-[180px] sm:min-h-[200px]">
          <div className="space-y-3 sm:space-y-4 lg:space-y-6">
            {/* Header Row */}
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
                <BetBotIcon className="w-8 h-8 sm:w-10 h-10 lg:w-12 h-12" />
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-700 dark:text-blue-400">
                    Pick of the Day
                  </h3>
                  <div className="scale-75 sm:scale-90 lg:scale-100">
                    <GradeBadge grade={dailyPick.grade} />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Pick Information - Main Content */}
            <div className="space-y-2 sm:space-y-3 lg:space-y-4 flex-1">
              <p className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white leading-tight">
                The pick was <span className="text-sm sm:text-base lg:text-lg text-blue-700 dark:text-blue-400">{dailyPick.pickTeam} ML {formattedOdds}</span>
              </p>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                {dailyPick.awayTeam} @ {dailyPick.homeTeam}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500">
                {formatGameTime(dailyPick.gameTime)}
              </p>
            </div>
          </div>
          
          {/* Action Buttons - Bottom */}
          <div className="flex flex-col sm:flex-row items-center justify-between w-full pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700 space-y-2 sm:space-y-0">
            <Dialog open={analysisDialogOpen} onOpenChange={setAnalysisDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-blue-300 dark:border-blue-600 px-4 sm:px-6 py-2 text-sm sm:text-base"
                >
                  View Analysis
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
                          <h4 className="font-semibold mb-3">Grade Analysis</h4>
                          <pre className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap font-mono">
                            {getMainGradeExplanation(
                              dailyPick.grade,
                              dailyPick.confidence,
                              dailyPick.analysis,
                              dailyPick.pickTeam,
                              dailyPick.odds
                            )}
                          </pre>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-3">Analysis Factors</h4>
                          <div className="space-y-3">
                            {getFactors(dailyPick.analysis, dailyPick.probablePitchers).map(({ key, title, score, info }) => (
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
              <Button className="w-full sm:w-auto flex items-center justify-center space-x-2 sm:space-x-3 bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 lg:px-8 py-2 sm:py-3 rounded-lg shadow-lg font-semibold text-sm sm:text-base">
                <ExternalLink className="w-4 h-4 sm:w-5 h-5" />
                <span>Check Live Scores</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }



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

  // Find current game score data with improved matching logic
  const currentGameScore = (gameScore && Array.isArray(gameScore)) ? gameScore.find((game: any) => {
    // Try multiple matching strategies
    const gameIdMatch = game.gameId === parseInt(dailyPick?.gameId || '0') || 
                       game.gameId === dailyPick?.gameId;
    const teamMatch = game.homeTeam === dailyPick?.homeTeam && 
                     game.awayTeam === dailyPick?.awayTeam;
    return gameIdMatch || teamMatch;
  }) : null;

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
                  {dailyPick.pickTeam} {formatOdds(getCurrentOdds().pickTeamOdds || dailyPick.odds, dailyPick.pickType)} • Grade {dailyPick.grade}
                </p>
                {/* Show live score when game has started */}
                {currentGameScore && isGameStarted(dailyPick.gameTime) && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {dailyPick.awayTeam} {currentGameScore.awayScore || 0} - {currentGameScore.homeScore || 0} {dailyPick.homeTeam}
                    {currentGameScore.status === 'Final' ? ' (Final)' : 
                     currentGameScore.status === 'In Progress' ? ` (${currentGameScore.inning || 'Live'})` : ' (Live)'}
                  </p>
                )}
              </div>
            </div>
            <ChevronDown className="w-5 h-5 text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Mobile-first wireframe design */}
      <div className="md:hidden">
        <Card className="w-full bg-[#1a1a1a] dark:bg-[#1a1a1a] border-gray-700">
          <CardContent className="p-4 space-y-4">
            {/* Header: Title and Grade Badge */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-blue-400 font-sans">Pick of the Day</h2>
              <div className={`${getGradeColorClasses(dailyPick.grade).bg} ${getGradeColorClasses(dailyPick.grade).text} px-3 py-1 rounded-md text-sm font-bold`}>
                {dailyPick.grade}
              </div>
            </div>

            {/* Matchup Title */}
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-white font-sans">
                {(() => {
                  // Use original pregame odds instead of live odds
                  const oddsText = dailyPick.odds > 0 ? `+${dailyPick.odds}` : dailyPick.odds;
                  const isAwayTeam = dailyPick.pickTeam === dailyPick.awayTeam;
                  const separator = isAwayTeam ? ' at ' : ' vs ';
                  const otherTeam = isAwayTeam ? dailyPick.homeTeam : dailyPick.awayTeam;
                  
                  return (
                    <>
                      <span className="text-blue-400 font-bold">
                        {dailyPick.pickTeam} ML {oddsText}
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
              {currentPitchers.away && currentPitchers.home && (
                <p className="text-sm text-gray-300 font-sans">
                  {currentPitchers.away} vs {currentPitchers.home}
                </p>
              )}
              
              {/* Game Info */}
              <p className="text-xs text-gray-400 font-sans">
                {formatGameTime(dailyPick.gameTime)} • {dailyPick.venue}
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
                    {getFactors(dailyPick.analysis, dailyPick.probablePitchers).map((factor) => (
                      <FactorScore 
                        key={factor.key}
                        title={factor.title}
                        score={factor.score || 0}
                        info={factor.info}
                        gameContext={dailyPick}
                      />
                    ))}
                  </div>
                  
                  {/* Analysis Summary Blurb with Show More */}
                  <div className="bg-gray-800/20 rounded-lg p-3">
                    <div className="text-sm text-gray-300 font-sans leading-relaxed">
                      <p className={!mobileReasoningExpanded ? 'overflow-hidden' : ''} 
                         style={!mobileReasoningExpanded ? {
                           display: '-webkit-box',
                           WebkitLineClamp: 3,
                           WebkitBoxOrient: 'vertical'
                         } : {}}>
                        {getMobileReasoning(dailyPick.grade, dailyPick.analysis, dailyPick.pickTeam, dailyPick.odds)}
                      </p>
                      {getMobileReasoning(dailyPick.grade, dailyPick.analysis, dailyPick.pickTeam, dailyPick.odds).split(' ').length > 15 && (
                        <button
                          onClick={() => setMobileReasoningExpanded(!mobileReasoningExpanded)}
                          className="text-blue-400 hover:text-blue-300 text-xs mt-2 flex items-center gap-1"
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
                </div>
              )}
            </div>

            {/* Action Buttons - Always Visible */}
            <div className="flex space-x-3 pt-2">
              <button
                onClick={(e) => handleMakePick(e, 'h2h', dailyPick.pickTeam)}
                className="flex-1 bg-[#10B981] hover:bg-[#059669] text-white font-semibold py-3 px-4 rounded-lg transition-colors font-sans min-h-[44px] flex items-center justify-center"
              >
                Pick
              </button>
              <button
                onClick={(e) => handleMakePick(e, 'h2h', dailyPick.pickTeam === dailyPick.homeTeam ? dailyPick.awayTeam : dailyPick.homeTeam)}
                className="flex-1 bg-[#EF4444] hover:bg-[#DC2626] text-white font-semibold py-3 px-4 rounded-lg transition-colors font-sans min-h-[44px] flex items-center justify-center"
              >
                Fade
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Desktop Layout */}
      <Card className="hidden md:block w-full bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4 sm:p-6">
          <div className="relative">
            {/* Desktop Header */}
            <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="flex items-center space-x-2 md:space-x-4">
              <BetBotIcon className="w-12 md:w-14 h-12 md:h-14 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-xl md:text-2xl text-gray-900 dark:text-gray-100">
                  Pick of the Day
                </h3>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium">
                  AI-backed Data Analysis
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
              <div className="flex items-start space-x-2">
                <div className="relative flex items-center">
                  <Badge className="bg-blue-500 hover:bg-blue-500 text-white font-bold w-8 h-8 text-xs border rounded flex items-center justify-center cursor-pointer">
                    {dailyPick.grade}
                  </Badge>
                  <Dialog open={analysisDialogOpen} onOpenChange={setAnalysisDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-0 h-4 w-4 bg-transparent hover:bg-gray-100 dark:bg-black/80 dark:hover:bg-black/90 rounded-full flex items-center justify-center ml-1"
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
                      <h4 className="font-semibold mb-3">Grade Analysis</h4>
                      <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {getMainGradeExplanation(
                          dailyPick.grade,
                          dailyPick.confidence,
                          dailyPick.analysis,
                          dailyPick.pickTeam,
                          dailyPick.odds
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Analysis Factors</h4>
                      <div className="space-y-3">
                        {getFactors(dailyPick.analysis, dailyPick.probablePitchers).map(({ key, title, score, info }) => (
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
        </div>

        <div className="space-y-4">
          {/* Team matchup and odds (full width) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <h4 className="font-bold text-sm md:text-lg text-blue-600 dark:text-blue-400 whitespace-nowrap">
                  {matchup.topTeam}
                </h4>
                <span className="font-bold text-sm md:text-lg bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent whitespace-nowrap">
                  {formatOdds(getCurrentOdds().pickTeamOdds || dailyPick.odds, dailyPick.pickType)}
                </span>
              </div>
              <div className="flex flex-col items-end space-y-1 flex-shrink-0 ml-4">
                {/* Main Pick button - moneyline picks only */}
                <Button
                  size="sm"
                  onClick={(e) => handleMakePick(e, 'h2h', dailyPick.pickTeam)}
                  className="text-xs px-2 md:px-6 py-1 h-6 md:h-7 bg-green-600 hover:bg-green-700 text-white border-0 font-semibold shadow-sm"
                >
                  Pick
                </Button>
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
              <div className="flex flex-col items-end space-y-1 flex-shrink-0 ml-4">
                {/* Fade button - moneyline picks only */}
                <Button
                  size="sm"
                  onClick={(e) => handleMakePick(e, 'h2h', matchup.bottomTeam)}
                  className="text-xs px-2 md:px-6 py-1 h-6 md:h-7 bg-red-600 hover:bg-red-700 text-white border-0 font-semibold shadow-sm"
                >
                  Fade
                </Button>
              </div>

            </div>
            <div className="ml-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                P: {currentPitchers[matchup.bottomTeamPitcher] || 'TBD'}
              </p>
            </div>


            <div className="mt-3">
              {/* Game Status Display */}
              {currentGameScore && (
                <div className="mb-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <div className="text-blue-600 dark:text-blue-400 font-semibold">
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
                      <div className="text-blue-600 dark:text-blue-400 font-semibold">
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
                  {formatGameTime(dailyPick.gameTime)} • {dailyPick.venue}
                </p>
                {/* Analysis dropdown toggle for all screen sizes */}
                <button
                  className="flex items-center text-xs text-blue-600 dark:text-blue-400 ml-2"
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
                  <h5 className="font-semibold text-sm text-blue-600 dark:text-blue-400 mb-3 text-center">
                    Analysis Factors
                  </h5>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2">
                    {getFactors(dailyPick.analysis, dailyPick.probablePitchers).map(({ key, title, score, info }) => {
                      // Create context for narrative generation
                      const gameContext = {
                        isHomeGame: dailyPick.pickTeam === dailyPick.homeTeam,
                        opponentHandedness: 'RHP' as const, // Could be enhanced with real data
                        starterERA: 4.0, // Could be enhanced with real pitcher data
                        last10Record: '7-3', // Could be enhanced with real team data
                        offensiveStats: {
                          xwOBA: 0.330,
                          barrelRate: 6.5,
                          exitVelo: 87.2
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
            homeTeam: dailyPick.homeTeam,
            awayTeam: dailyPick.awayTeam,
            gameId: dailyPick.gameId,
            sport: 'baseball_mlb',
            gameTime: dailyPick.gameTime
          }}
          bookmakers={(() => {
            const gamesArray = Array.isArray(gamesData) ? gamesData : [];
            console.log('DailyPick: Searching for gameId:', dailyPick.gameId);
            console.log('DailyPick: Available game IDs:', gamesArray.map(g => g.id).slice(0, 5), '... (showing first 5)');
            
            let currentGame = gamesArray.find((game: any) => game.id === dailyPick.gameId);
            let bookmakers = currentGame?.bookmakers || [];
            
            console.log('DailyPick: Found game by ID?', !!currentGame);
            
            if (!currentGame || bookmakers.length === 0) {
              // Enhanced fallback with multiple matching strategies
              console.log('DailyPick: Trying team name fallback for:', dailyPick.awayTeam, '@', dailyPick.homeTeam);
              
              currentGame = gamesArray.find((game: any) => {
                const gameAway = game.away_team || game.awayTeam;
                const gameHome = game.home_team || game.homeTeam;
                
                return (gameAway === dailyPick.awayTeam && gameHome === dailyPick.homeTeam) ||
                       (gameAway === dailyPick.homeTeam && gameHome === dailyPick.awayTeam);
              });
              
              if (currentGame) {
                bookmakers = currentGame.bookmakers || [];
                console.log('DailyPick: Found fallback game with', bookmakers.length, 'bookmakers');
              }
            }
            
            console.log('DailyPick: Final bookmaker count:', bookmakers.length);
            return bookmakers;
          })()}
          selectedBet={selectedBet}

        />
      )}

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
                {dailyPick?.awayTeam} @ {dailyPick?.homeTeam}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bet Type
              </label>
              <select
                value={manualEntry.market}
                onChange={(e) => setManualEntry({
                  ...manualEntry, 
                  market: e.target.value as 'moneyline' | 'spread' | 'total',
                  selection: '' // Reset selection when market changes
                })}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
              >
                <option value="moneyline">Moneyline</option>
                <option value="spread">Spread</option>
                <option value="total">Total (Over/Under)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Selection
              </label>
              {manualEntry.market === 'moneyline' ? (
                <select
                  value={manualEntry.selection}
                  onChange={(e) => setManualEntry({...manualEntry, selection: e.target.value})}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                >
                  <option value="">Choose team...</option>
                  <option value={dailyPick?.awayTeam}>{dailyPick?.awayTeam}</option>
                  <option value={dailyPick?.homeTeam}>{dailyPick?.homeTeam}</option>
                </select>
              ) : manualEntry.market === 'total' ? (
                <select
                  value={manualEntry.selection}
                  onChange={(e) => setManualEntry({...manualEntry, selection: e.target.value})}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                >
                  <option value="">Choose...</option>
                  <option value="Over">Over</option>
                  <option value="Under">Under</option>
                </select>
              ) : (
                <select
                  value={manualEntry.selection}
                  onChange={(e) => setManualEntry({...manualEntry, selection: e.target.value})}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                >
                  <option value="">Choose team...</option>
                  <option value={dailyPick?.awayTeam}>{dailyPick?.awayTeam}</option>
                  <option value={dailyPick?.homeTeam}>{dailyPick?.homeTeam}</option>
                </select>
              )}
            </div>

            {(manualEntry.market === 'spread' || manualEntry.market === 'total') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Line
                </label>
                <Input
                  value={manualEntry.line}
                  onChange={(e) => setManualEntry({...manualEntry, line: e.target.value})}
                  placeholder="e.g., -1.5, 8.5"
                  className="w-full"
                />
              </div>
            )}

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

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Units
              </label>
              <Input
                type="number"
                min="0.1"
                step="0.1"
                value={manualEntry.units}
                onChange={(e) => setManualEntry({...manualEntry, units: parseFloat(e.target.value) || 1})}
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
    </>
  );
}