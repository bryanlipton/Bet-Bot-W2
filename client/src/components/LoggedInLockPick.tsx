import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Info, TrendingUp, Target, MapPin, Clock, Users, Lock } from "lucide-react";
import betbotLogo from "@assets/dde5f7b9-6c02-4772-9430-78d9b96b7edb_1752677738478.png";
import { useAuth } from "@/hooks/useAuth";

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

export default function LoggedInLockPick() {
  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  const { data: lockPick, isLoading } = useQuery<DailyPick | null>({
    queryKey: ['/api/daily-pick/lock'],
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    enabled: isAuthenticated, // Only fetch if authenticated
  });

  const { data: analysisDetails } = useQuery<PickAnalysisDetails | null>({
    queryKey: [`/api/daily-pick/${lockPick?.id}/analysis`],
    enabled: !!lockPick?.id && analysisDialogOpen && isAuthenticated,
  });

  // Don't show anything if not authenticated
  if (authLoading || !isAuthenticated) {
    return null;
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

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  return (
    <Card className="w-full bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <BetBotIcon className="w-12 h-12" />
            <Lock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                Logged in Lock of the Day
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Exclusive pick for authenticated users
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <GradeBadge grade={lockPick.grade} />
            <div className="text-right">
              <div className="text-sm text-gray-500 dark:text-gray-400">Confidence</div>
              <div className="font-bold text-lg">{lockPick.confidence}%</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span className="font-semibold text-lg">
                {lockPick.pickTeam} {lockPick.pickType}
              </span>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 dark:text-gray-400">Odds</div>
              <div className="font-bold text-xl text-green-600 dark:text-green-400">
                {formatOdds(lockPick.odds)}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{lockPick.awayTeam} @ {lockPick.homeTeam}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MapPin className="w-4 h-4" />
              <span>{lockPick.venue}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{formatGameTime(lockPick.gameTime)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Confidence Level</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">{lockPick.confidence}%</span>
            </div>
            <Progress value={lockPick.confidence} className="h-2" />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start space-x-2">
              <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Analysis
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {lockPick.reasoning}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Updated: {new Date(lockPick.createdAt).toLocaleString()}
            </div>
            <Dialog open={analysisDialogOpen} onOpenChange={setAnalysisDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center space-x-1">
                  <Info className="w-4 h-4" />
                  <span>Full Analysis</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Lock Pick Analysis Details</DialogTitle>
                </DialogHeader>
                {analysisDetails ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Overall Assessment</h4>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Grade:</span>
                            <GradeBadge grade={analysisDetails.overall.grade} />
                          </div>
                          <div className="flex justify-between">
                            <span>Confidence:</span>
                            <span className="font-semibold">{analysisDetails.overall.confidence}%</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Game Details</h4>
                        <div className="space-y-1 text-sm">
                          <div><strong>Matchup:</strong> {analysisDetails.gameDetails.matchup}</div>
                          <div><strong>Venue:</strong> {analysisDetails.gameDetails.venue}</div>
                          <div><strong>Time:</strong> {analysisDetails.gameDetails.gameTime}</div>
                          <div><strong>Pick:</strong> {analysisDetails.gameDetails.pickTeam} ({analysisDetails.gameDetails.odds})</div>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="font-semibold mb-3">Analysis Factors</h4>
                      <div className="space-y-3">
                        {Object.entries(analysisDetails.factors).map(([key, factor]) => (
                          <div key={key} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                              <span>{factor.score}/100</span>
                            </div>
                            <Progress value={factor.score} className="h-2" />
                            <p className="text-xs text-gray-600 dark:text-gray-400">{factor.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="font-semibold mb-2">Reasoning</h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{analysisDetails.overall.reasoning}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-500 dark:text-gray-400">Loading detailed analysis...</p>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}