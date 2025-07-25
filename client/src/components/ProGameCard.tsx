import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getTeamColor } from "@/utils/teamLogos";
import { Clock, Target, Info } from "lucide-react";
import { OddsComparisonModal } from "./OddsComparisonModal";
import { getGradeColorClasses } from "@/lib/factorUtils";

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
        <CardContent className="p-3 sm:p-4">
          {/* Header - Time and Teams */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <Clock className="w-3 h-3" />
              {formatTime(startTime)}
            </div>
          </div>

          {/* Teams Layout - Same as Free Tiles */}
          <div className="space-y-3">
            {/* Away Team */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className={`w-3 h-3 rounded-full ${getTeamColor(awayTeam)}`}
                ></div>
                <span className="font-medium text-sm text-gray-900 dark:text-white">
                  {awayTeam}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {formatOdds(awayOdds)}
              </div>
            </div>

            {/* Home Team */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className={`w-3 h-3 rounded-full ${getTeamColor(homeTeam)}`}
                ></div>
                <span className="font-medium text-sm text-gray-900 dark:text-white">
                  {homeTeam}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {formatOdds(homeOdds)}
              </div>
            </div>
          </div>

          {/* Pro Pick Section - Replaces Lock Icon */}
          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-yellow-500" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Pro Pick
                </span>
              </div>
              
              {/* Pro Pick Content */}
              {proPickLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-6 w-16 rounded"></div>
                </div>
              ) : proPick ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {proPick.pickTeam}
                  </span>
                  <Badge 
                    variant="secondary" 
                    className={`${getGradeColorClasses(proPick.grade)} text-white font-bold text-xs px-2 py-1`}
                  >
                    {proPick.grade}
                  </Badge>
                </div>
              ) : (
                <div className="text-xs text-gray-500">Loading...</div>
              )}
            </div>
          </div>

          {/* Pitchers - Same Layout as Free Tiles */}
          {probablePitchers && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <div>Away: {probablePitchers.away || "TBD"}</div>
                <div>Home: {probablePitchers.home || "TBD"}</div>
              </div>
            </div>
          )}

          {/* Action Button - Same as Free Tiles */}
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs font-medium"
              onClick={() => setShowOddsModal(true)}
            >
              <Target className="w-3 h-3 mr-1" />
              Compare Odds
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Odds Modal - Same as Free Tiles */}
      {showOddsModal && rawBookmakers && (
        <OddsComparisonModal
          open={showOddsModal}
          onClose={() => setShowOddsModal(false)}
          gameInfo={{
            homeTeam,
            awayTeam,
            gameId: gameId?.toString() || "",
            sport: "baseball_mlb"
          }}
          bookmakers={rawBookmakers}
          selectedBet={{
            market: 'moneyline',
            selection: proPick?.pickTeam || homeTeam
          }}
        />
      )}
    </>
  );
}