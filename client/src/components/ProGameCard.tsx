import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getTeamColor } from "@/utils/teamLogos";
import { Clock, TrendingUp, Info, Crown } from "lucide-react";
import { OddsComparisonModal } from "./OddsComparisonModal";
import { getFactorColorClasses, getGradeColorClasses, getMainGradeExplanation } from "@/lib/factorUtils";

interface ProPickData {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  pickTeam: string;
  grade: string;
  confidence: number;
  reasoning: string;
  odds: number;
}

interface ProGameCardProps {
  homeTeam: string;
  awayTeam: string;
  homeOdds?: number;
  awayOdds?: number;
  startTime?: string;
  gameId?: string | number;
  probablePitchers?: {
    home: string | null;
    away: string | null;
  };
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

function ProGradeBadge({ grade, onClick }: { grade: string; onClick?: () => void }) {
  const colorClasses = getGradeColorClasses(grade);
  
  return (
    <div className="relative">
      <Badge 
        variant="secondary" 
        className={`${colorClasses} text-white font-bold text-sm px-3 py-1 cursor-pointer hover:opacity-80 transition-opacity`}
        onClick={onClick}
      >
        {grade}
      </Badge>
      <Crown className="absolute -top-1 -right-1 w-3 h-3 text-yellow-400 fill-current" />
    </div>
  );
}

export function ProGameCard({
  homeTeam,
  awayTeam,
  homeOdds,
  awayOdds,
  startTime,
  gameId,
  probablePitchers,
  rawBookmakers,
}: ProGameCardProps) {
  const [showOddsModal, setShowOddsModal] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

  // Fetch Pro pick data for this game
  const { data: proPick, isLoading: proPickLoading } = useQuery<ProPickData>({
    queryKey: [`/api/pro/game/${gameId}/analysis`],
    enabled: !!gameId,
    retry: false,
  });

  const formatTime = (timeString?: string) => {
    if (!timeString) return "TBD";
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "America/New_York"
      });
    } catch {
      return "TBD";
    }
  };

  const formatOdds = (odds?: number) => {
    if (!odds) return "N/A";
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  return (
    <>
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200">
        <CardContent className="p-4">
          {/* Header with Pro Crown */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">PRO ANALYSIS</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              {formatTime(startTime)}
            </div>
          </div>

          {/* Teams and Pro Pick */}
          <div className="grid grid-cols-3 gap-3 items-center mb-4">
            {/* Away Team */}
            <div className="text-center">
              <div className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                {awayTeam}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {formatOdds(awayOdds)}
              </div>
            </div>

            {/* Pro Pick Grade */}
            <div className="text-center">
              {proPickLoading ? (
                <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-12 rounded mx-auto"></div>
              ) : proPick ? (
                <ProGradeBadge 
                  grade={proPick.grade} 
                  onClick={() => setShowAnalysisModal(true)}
                />
              ) : (
                <Badge variant="outline" className="text-xs">Loading...</Badge>
              )}
            </div>

            {/* Home Team */}
            <div className="text-center">
              <div className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                {homeTeam}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {formatOdds(homeOdds)}
              </div>
            </div>
          </div>

          {/* Pro Pick Details */}
          {proPick && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-sm text-blue-900 dark:text-blue-100">
                  Pro Pick: {proPick.pickTeam}
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  {proPick.confidence}% Confidence
                </div>
              </div>
              <div className="text-xs text-blue-800 dark:text-blue-200 line-clamp-2">
                {proPick.reasoning}
              </div>
            </div>
          )}

          {/* Pitchers */}
          {probablePitchers && (
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              <div>Away: {probablePitchers.away || "TBD"}</div>
              <div>Home: {probablePitchers.home || "TBD"}</div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => setShowOddsModal(true)}
            >
              Compare Odds
            </Button>
            {proPick && (
              <Button
                variant="outline"
                size="sm"
                className="px-2"
                onClick={() => setShowAnalysisModal(true)}
              >
                <Info className="w-3 h-3" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Odds Comparison Modal */}
      {showOddsModal && (
        <OddsComparisonModal
          isOpen={showOddsModal}
          onClose={() => setShowOddsModal(false)}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          bookmakers={rawBookmakers || []}
          gameId={gameId}
        />
      )}

      {/* Pro Analysis Modal */}
      {showAnalysisModal && proPick && (
        <Dialog open={showAnalysisModal} onOpenChange={setShowAnalysisModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-400 fill-current" />
                Pro Analysis: {proPick.pickTeam}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <ProGradeBadge grade={proPick.grade} />
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {proPick.confidence}% Confidence
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-sm mb-2">Analysis Reasoning</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {proPick.reasoning}
                </p>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
                <div className="text-xs font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                  Pro Advantage
                </div>
                <div className="text-xs text-yellow-700 dark:text-yellow-300">
                  This enhanced analysis includes factor multipliers, elite bonuses, and market inefficiency detection not available in the free version.
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}