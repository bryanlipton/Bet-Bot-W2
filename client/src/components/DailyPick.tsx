import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Info, TrendingUp, Target, MapPin, Clock, Users } from "lucide-react";
import betbotLogo from "@assets/dde5f7b9-6c02-4772-9430-78d9b96b7edb_1752677738478.png";

interface DailyPickAnalysis {
  teamOffense: number;
  pitchingMatchup: number;
  ballparkFactor: number;
  weatherImpact: number;
  situationalEdge: number;
  valueScore: number;
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
    teamOffense: { score: number; description: string };
    pitchingMatchup: { score: number; description: string };
    ballparkFactor: { score: number; description: string };
    weatherImpact: { score: number; description: string };
    situationalEdge: { score: number; description: string };
    valueScore: { score: number; description: string };
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
  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-green-500';
    if (grade.startsWith('B')) return 'bg-blue-500';
    if (grade.startsWith('C')) return 'bg-yellow-500';
    if (grade.startsWith('D')) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <Badge className={`${getGradeColor(grade)} text-white font-bold px-3 py-1 text-lg`}>
      {grade}
    </Badge>
  );
}

// Factor Grade Conversion
function scoreToGrade(score: number): string {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 87) return 'A-';
  if (score >= 84) return 'B+';
  if (score >= 80) return 'B';
  if (score >= 77) return 'B-';
  if (score >= 74) return 'C+';
  if (score >= 70) return 'C';
  if (score >= 67) return 'C-';
  if (score >= 64) return 'D+';
  if (score >= 60) return 'D';
  if (score >= 57) return 'D-';
  return 'F';
}

// Factor Grade Component
function FactorGrade({ title, score }: { title: string; score: number }) {
  const grade = scoreToGrade(score);
  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-600 dark:text-green-400';
    if (grade.startsWith('B')) return 'text-blue-600 dark:text-blue-400';
    if (grade.startsWith('C')) return 'text-yellow-600 dark:text-yellow-400';
    if (grade.startsWith('D')) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-gray-700 dark:text-gray-300">{title}</span>
      <span className={`font-bold text-sm ${getGradeColor(grade)}`}>{grade}</span>
    </div>
  );
}

export default function DailyPick() {
  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false);
  const [showMoreFactors, setShowMoreFactors] = useState(false);
  
  const { data: dailyPick, isLoading } = useQuery<DailyPick | null>({
    queryKey: ['/api/daily-pick'],
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  const { data: analysisDetails } = useQuery<PickAnalysisDetails | null>({
    queryKey: [`/api/daily-pick/${dailyPick?.id}/analysis`],
    enabled: !!dailyPick?.id && analysisDialogOpen,
  });

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

  // Get factors sorted by score (highest to lowest)
  const getSortedFactors = (analysis: DailyPickAnalysis) => {
    const factorTitles = {
      teamOffense: 'Team Offense',
      pitchingMatchup: 'Pitching Matchup',
      ballparkFactor: 'Ballpark Factor',
      weatherImpact: 'Weather Impact',
      situationalEdge: 'Situational Edge',
      valueScore: 'Value Score',
      confidence: 'Confidence'
    };

    return Object.entries(analysis)
      .filter(([key]) => key !== 'confidence') // Exclude confidence from factors
      .map(([key, score]) => ({
        key,
        title: factorTitles[key as keyof typeof factorTitles] || key,
        score: score as number
      }))
      .sort((a, b) => b.score - a.score);
  };

  // Determine if pick team is away or home, format matchup accordingly
  const formatMatchup = (homeTeam: string, awayTeam: string, pickTeam: string) => {
    const isPickHome = pickTeam === homeTeam;
    if (isPickHome) {
      return {
        topTeam: homeTeam,
        bottomTeam: awayTeam,
        separator: 'vs.'
      };
    } else {
      return {
        topTeam: awayTeam,
        bottomTeam: homeTeam,
        separator: '@'
      };
    }
  };

  const matchup = formatMatchup(dailyPick.homeTeam, dailyPick.awayTeam, dailyPick.pickTeam);
  const sortedFactors = getSortedFactors(dailyPick.analysis);
  const topFactors = sortedFactors.slice(0, 3);
  const additionalFactors = sortedFactors.slice(3);

  return (
    <Card className="w-full bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <BetBotIcon className="w-12 h-12" />
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                Bet Bot Pick of the Day
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Free daily moneyline pick
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <GradeBadge grade={dailyPick.grade} />
            <Dialog open={analysisDialogOpen} onOpenChange={setAnalysisDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                  <Info className="w-4 h-4" />
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
                      {sortedFactors.map(({ key, title, score }) => (
                        <div key={key} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{title}</span>
                            <span className="font-bold">{scoreToGrade(score)} ({score}/100)</span>
                          </div>
                          <Progress value={score} className="h-2" />
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
          {/* Left side - Team matchup and odds */}
          <div className="flex-1">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h4 className="font-bold text-xl text-blue-600 dark:text-blue-400">
                  {matchup.topTeam}
                </h4>
                <span className="font-mono text-lg text-gray-700 dark:text-gray-300">
                  {formatOdds(dailyPick.odds, dailyPick.pickType)}
                </span>
              </div>
              <div className="text-lg text-gray-600 dark:text-gray-400">
                {matchup.separator} {matchup.bottomTeam}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                {formatGameTime(dailyPick.gameTime)} • {dailyPick.venue}
              </p>
            </div>
          </div>

          {/* Right side - Factor grades */}
          <div className="w-48 space-y-2">
            <h5 className="font-semibold text-sm text-gray-600 dark:text-gray-400 mb-2">
              Factor Grades
            </h5>
            
            {/* Top 3 factors */}
            <div className="space-y-1">
              {topFactors.map(({ key, title, score }) => (
                <FactorGrade key={key} title={title} score={score} />
              ))}
            </div>

            {/* Show more button and additional factors */}
            {additionalFactors.length > 0 && (
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMoreFactors(!showMoreFactors)}
                  className="h-6 text-xs text-gray-500 dark:text-gray-400 p-0 hover:text-blue-600"
                >
                  {showMoreFactors ? 'Show less' : `Show ${additionalFactors.length} more`}
                </Button>
                
                {showMoreFactors && (
                  <div className="space-y-1">
                    {additionalFactors.map(({ key, title, score }) => (
                      <FactorGrade key={key} title={title} score={score} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {dailyPick.probablePitchers.home && (
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <span>SP: {dailyPick.probablePitchers.away}</span>
            <span>SP: {dailyPick.probablePitchers.home}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}