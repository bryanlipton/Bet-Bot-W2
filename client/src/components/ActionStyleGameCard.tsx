import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTeamLogo } from "@/utils/teamLogos";
import { Clock, TrendingUp, TrendingDown, Users } from "lucide-react";

interface GameCardProps {
  homeTeam: string;
  awayTeam: string;
  homeOdds?: number;
  awayOdds?: number;
  spread?: number;
  total?: number;
  startTime?: string;
  prediction?: {
    homeWinProbability: number;
    awayWinProbability: number;
    confidence: number;
    edge?: string;
  };
  isLive?: boolean;
  bookmakers?: Array<{
    name: string;
    homeOdds?: number;
    awayOdds?: number;
    spread?: number;
    total?: number;
  }>;
  gameId?: string | number;
  probablePitchers?: {
    home: string | null;
    away: string | null;
  };
  onClick?: () => void;
}

export function ActionStyleGameCard({
  homeTeam,
  awayTeam,
  homeOdds,
  awayOdds,
  spread,
  total,
  startTime,
  prediction,
  isLive = false,
  bookmakers,
  gameId,
  probablePitchers,
  onClick
}: GameCardProps) {
  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : `${odds}`;
  };



  const getBetRecommendation = () => {
    if (!prediction) return null;
    
    const homeProb = prediction.homeWinProbability;
    const awayProb = prediction.awayWinProbability;
    
    if (homeProb > 0.55) return { team: homeTeam, type: "home", prob: homeProb };
    if (awayProb > 0.55) return { team: awayTeam, type: "away", prob: awayProb };
    return null;
  };

  const recommendation = getBetRecommendation();

  return (
    <Card 
      className="hover:shadow-lg transition-shadow duration-200 border border-gray-200 dark:border-gray-700 cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isLive && (
              <Badge variant="destructive" className="text-xs px-2">
                LIVE
              </Badge>
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {startTime || "TBD"}
            </span>
          </div>
          

        </div>

        {/* Teams and Odds */}
        <div className="space-y-3">
          {/* Away Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center">
                {getTeamLogo(awayTeam) ? (
                  <img 
                    src={getTeamLogo(awayTeam)!} 
                    alt={`${awayTeam} logo`}
                    className="w-8 h-8 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      {awayTeam.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{awayTeam}</p>

              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm font-bold text-gray-900 dark:text-white">
                {awayOdds ? formatOdds(awayOdds) : (
                  <span className="text-gray-400 dark:text-gray-500 text-xs">
                    Lines not posted
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Home Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center">
                {getTeamLogo(homeTeam) ? (
                  <img 
                    src={getTeamLogo(homeTeam)!} 
                    alt={`${homeTeam} logo`}
                    className="w-8 h-8 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      {homeTeam.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{homeTeam}</p>

              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm font-bold text-gray-900 dark:text-white">
                {homeOdds ? formatOdds(homeOdds) : (
                  <span className="text-gray-400 dark:text-gray-500 text-xs">
                    Lines not posted
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Betting Lines */}
        {(spread !== undefined || total !== undefined) && (
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            {spread !== undefined && (
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">Spread</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {spread > 0 ? `+${spread}` : spread}
                </p>
              </div>
            )}
            
            {total !== undefined && (
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  O/U {total}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Recommendation */}
        {recommendation && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Bet: {recommendation.team}
                </span>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">Edge</p>
                <p className="text-sm font-bold text-green-600 dark:text-green-400">
                  {prediction?.edge || "No edge"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Multiple Sportsbooks */}
        {bookmakers && bookmakers.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Other Books</p>
            <div className="space-y-1">
              {bookmakers.slice(1, 3).map((book, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-300 font-medium">
                    {book.name}
                  </span>
                  <div className="flex gap-2">
                    {book.homeOdds && (
                      <span className="text-gray-700 dark:text-gray-200">
                        {book.homeOdds > 0 ? `+${book.homeOdds}` : book.homeOdds}
                      </span>
                    )}
                    {book.awayOdds && (
                      <span className="text-gray-700 dark:text-gray-200">
                        {book.awayOdds > 0 ? `+${book.awayOdds}` : book.awayOdds}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}