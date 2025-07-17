import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Info, TrendingUp, Target, MapPin, Clock, Users, Lock } from "lucide-react";
import { OddsComparisonModal } from "@/components/OddsComparisonModal";
import { savePick } from "@/services/pickStorage";
import betbotLogo from "@assets/dde5f7b9-6c02-4772-9430-78d9b96b7edb_1752677738478.png";
import { useAuth } from "@/hooks/useAuth";

interface DailyPickAnalysis {
  offensivePower: number;    // 60-100 normalized scale
  pitchingEdge: number;      // 60-100 normalized scale  
  ballparkAdvantage: number; // 60-100 normalized scale
  recentForm: number;        // 60-100 normalized scale
  weatherConditions: number; // 60-100 normalized scale
  bettingValue: number;      // 60-100 normalized scale
  confidence: number;        // 60-100 normalized scale
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
    <Badge className="bg-amber-500 text-white font-bold px-3 py-1 text-lg">
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
function InfoButton({ info, title }: { info: string; title: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="p-0 h-5 w-5 bg-transparent hover:bg-gray-100 dark:bg-black/80 dark:hover:bg-black/90 rounded-full flex items-center justify-center">
          <Info className="h-3 w-3 text-black dark:text-white" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 text-xs" side="top">
        <div className="font-medium mb-1">{title}</div>
        <div>{info}</div>
      </PopoverContent>
    </Popover>
  );
}

// Factor Score Component with Info Button
function FactorScore({ title, score, info }: { title: string; score: number; info: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-1">
        <InfoButton info={info} title={title} />
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{title}</span>
      </div>
      <div className="bg-orange-400 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">
        {score !== null ? score : 'NA'}
      </div>
    </div>
  );
}

export default function LoggedInLockPick() {
  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false);
  const [oddsModalOpen, setOddsModalOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<any>(null);

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Fetch lock pick for authenticated users, or daily pick for non-authenticated
  const { data: lockPick, isLoading } = useQuery<DailyPick | null>({
    queryKey: isAuthenticated ? ['/api/daily-pick/lock'] : ['/api/daily-pick'],
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  const { data: analysisDetails } = useQuery<PickAnalysisDetails | null>({
    queryKey: [`/api/daily-pick/${lockPick?.id}/analysis`],
    enabled: !!lockPick?.id && analysisDialogOpen && isAuthenticated,
  });

  const { data: gamesData } = useQuery({
    queryKey: ['/api/mlb/complete-schedule'],
    enabled: !!lockPick?.gameId,
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
        title: 'Ballpark Advantage',
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
        info: 'Team performance over last 10 games including wins, runs scored, and momentum indicators.'
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
        info: 'Team batting strength based on wOBA, barrel rate, and exit velocity metrics from recent games.'
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

  return (
    <Card className="w-full bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800">
      <CardContent className="p-6 relative">
        {/* Blur overlay for non-authenticated users */}
        {!isAuthenticated && (
          <div 
            className="absolute inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg cursor-pointer"
            onClick={() => window.location.href = '/api/login'}
          >
            <div className="text-center">
              <Lock className="w-12 h-12 text-amber-600 dark:text-amber-400 mx-auto mb-3" />
              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-1">
                Login for a Lock
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Click here to access your exclusive lock pick
              </p>
            </div>
          </div>
        )}
        
        <div className={!isAuthenticated ? 'blur-sm' : ''}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <BetBotIcon className="w-14 h-14" />
            <div>
              <h3 className="font-bold text-2xl text-gray-900 dark:text-gray-100">
                Logged in Lock of the Day
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Exclusive pick for authenticated users
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <GradeBadge grade={lockPick.grade} />
            <Dialog open={analysisDialogOpen} onOpenChange={setAnalysisDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="p-0 h-5 w-5 bg-transparent hover:bg-gray-100 dark:bg-black/80 dark:hover:bg-black/90 rounded-full flex items-center justify-center">
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
                    <h4 className="font-semibold mb-3">Reasoning</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {lockPick.reasoning}
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

        <div className="flex items-start justify-between space-x-6">
          {/* Left side - Team matchup and odds (scorebug) */}
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-lg text-amber-600 dark:text-amber-400 truncate">
                  {matchup.topTeam}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 ml-4">
                  P: {lockPick.probablePitchers[matchup.topTeamPitcher] || 'TBD'}
                </p>
              </div>
              <div className="flex items-center space-x-3 flex-shrink-0">
                <span className="text-lg font-bold bg-gradient-to-r from-amber-600 to-amber-700 dark:from-amber-400 dark:to-amber-500 bg-clip-text text-transparent">
                  {formatOdds(lockPick.odds, lockPick.pickType)}
                </span>
                {lockPick.pickType === 'moneyline' && (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => handleMakePick(e, 'moneyline', lockPick.pickTeam)}
                      className="text-xs px-2 py-1 h-6 bg-green-50 hover:bg-green-100 dark:bg-green-900 dark:hover:bg-green-800 text-green-700 dark:text-green-300"
                    >
                      Pick
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => handleMakePick(e, 'moneyline', lockPick.pickTeam === lockPick.homeTeam ? lockPick.awayTeam : lockPick.homeTeam)}
                      className="text-xs px-2 py-1 h-6 bg-red-50 hover:bg-red-100 dark:bg-red-900 dark:hover:bg-red-800 text-red-700 dark:text-red-300"
                    >
                      Fade
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2 text-base text-gray-600 dark:text-gray-400">
              <span>{matchup.separator}</span>
              <div className="flex-1 min-w-0">
                <span className="truncate block">{matchup.bottomTeam}</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  P: {lockPick.probablePitchers[matchup.bottomTeamPitcher] || 'TBD'}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              {formatGameTime(lockPick.gameTime)} • {lockPick.venue}
            </p>
          </div>

          {/* Right side - Factor scores in 2 columns x 3 rows */}
          <div className="w-80">
            <h5 className="font-semibold text-sm text-gray-600 dark:text-gray-400 mb-3">
              Analysis Factors
            </h5>
            
            {/* 2 columns x 3 rows grid of factor scores */}
            <div className="grid grid-cols-2 grid-rows-3 gap-x-4 gap-y-2">
              {factors.map(({ key, title, score, info }) => (
                <FactorScore key={key} title={title} score={score} info={info} />
              ))}
            </div>
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