import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Info, TrendingUp, Target, MapPin, Clock, Users } from "lucide-react";
import betbotLogo from "@/assets/betbot-logo.png";

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

export default function DailyPick() {
  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false);
  
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

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  return (
    <Card className="w-full bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <BetBotIcon className="w-12 h-12" />
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                Bet Bot Sports Genie AI Picks
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
                
                {analysisDetails && (
                  <div className="space-y-6">
                    {/* Game Details */}
                    <div className="space-y-3">
                      <h4 className="font-semibold flex items-center space-x-2">
                        <Target className="w-4 h-4" />
                        <span>Game Details</span>
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">{analysisDetails.gameDetails.matchup}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <span>{analysisDetails.gameDetails.venue}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span>{formatGameTime(analysisDetails.gameDetails.gameTime)}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="font-medium text-lg">
                            <span className="text-blue-600 dark:text-blue-400">
                              {analysisDetails.gameDetails.pickTeam}
                            </span>
                            <span className="text-gray-500 ml-2">
                              {analysisDetails.gameDetails.odds}
                            </span>
                          </div>
                          {analysisDetails.gameDetails.probablePitchers.home && (
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              <div>Home: {analysisDetails.gameDetails.probablePitchers.home}</div>
                              <div>Away: {analysisDetails.gameDetails.probablePitchers.away}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Overall Analysis */}
                    <div className="space-y-3">
                      <h4 className="font-semibold">Overall Assessment</h4>
                      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Confidence Level</span>
                          <span className="text-lg font-bold">{analysisDetails.overall.confidence}%</span>
                        </div>
                        <Progress value={analysisDetails.overall.confidence} className="mb-3" />
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {analysisDetails.overall.reasoning}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    {/* Factor Breakdown */}
                    <div className="space-y-4">
                      <h4 className="font-semibold">Analysis Factors</h4>
                      <div className="grid gap-4">
                        {Object.entries(analysisDetails.factors).map(([key, factor]) => (
                          <div key={key} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                              <span className="text-sm font-mono">{factor.score}/100</span>
                            </div>
                            <Progress value={factor.score} className="h-2" />
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {factor.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-semibold text-lg">
                {dailyPick.awayTeam} @ {dailyPick.homeTeam}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {formatGameTime(dailyPick.gameTime)} • {dailyPick.venue}
              </p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {dailyPick.pickTeam}
              </div>
              <div className="text-lg font-mono text-gray-700 dark:text-gray-300">
                {formatOdds(dailyPick.odds)}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Confidence
              </span>
              <span className="text-sm font-bold">{dailyPick.confidence}%</span>
            </div>
            <Progress value={dailyPick.confidence} className="mb-2" />
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {dailyPick.reasoning}
            </p>
          </div>

          {dailyPick.probablePitchers.home && (
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500">
              <span>SP: {dailyPick.probablePitchers.away}</span>
              <span>SP: {dailyPick.probablePitchers.home}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}