// ActionStyleGameCard.tsx - Fixed version with proper odds formatting

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Star, 
  TrendingUp, 
  DollarSign, 
  Target,
  Clock,
  Info,
  ExternalLink,
  Zap,
  Lock
} from "lucide-react";
import { getTeamColor } from "@/utils/teamLogos";

interface ActionStyleGameCardProps {
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
    edge: string;
  };
  bookmakers?: Array<{
    name: string;
    homeOdds?: number;
    awayOdds?: number;
    spread?: number;
    total?: number;
  }>;
  gameId?: string;
  probablePitchers?: any;
  isDailyPick?: boolean;
  dailyPickTeam?: string;
  dailyPickGrade?: string;
  dailyPickId?: string;
  lockPickTeam?: string;
  lockPickGrade?: string;
  lockPickId?: string;
  isAuthenticated?: boolean;
  rawBookmakers?: any[];
}

// SAFE ODDS FORMATTING FUNCTION
const formatOdds = (odds: number | undefined | null): string => {
  try {
    if (odds === undefined || odds === null || isNaN(odds)) {
      return "TBD";
    }
    
    // Convert to integer and format as American odds
    const oddsNum = Math.round(odds);
    
    if (oddsNum > 0) {
      return `+${oddsNum}`;
    } else if (oddsNum < 0) {
      return `${oddsNum}`;
    } else {
      return "TBD";
    }
  } catch (error) {
    console.warn('Error formatting odds:', error);
    return "TBD";
  }
};

// SAFE SPREAD FORMATTING
const formatSpread = (spread: number | undefined | null): string => {
  try {
    if (spread === undefined || spread === null || isNaN(spread)) {
      return "TBD";
    }
    
    const spreadNum = Number(spread);
    if (spreadNum > 0) {
      return `+${spreadNum}`;
    } else if (spreadNum < 0) {
      return `${spreadNum}`;
    } else {
      return "PK"; // Pick'em
    }
  } catch (error) {
    console.warn('Error formatting spread:', error);
    return "TBD";
  }
};

// SAFE TOTAL FORMATTING
const formatTotal = (total: number | undefined | null): string => {
  try {
    if (total === undefined || total === null || isNaN(total)) {
      return "TBD";
    }
    
    return `O/U ${Number(total)}`;
  } catch (error) {
    console.warn('Error formatting total:', error);
    return "TBD";
  }
};

// ULTRA SAFE TIME FORMATTING
const safeFormatTime = (startTime: string | undefined | null): string => {
  try {
    if (!startTime) return "TBD";
    
    const date = new Date(startTime);
    if (isNaN(date.getTime())) return "TBD";
    
    // Manual time formatting to avoid locale issues
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    
    return `${displayHours}:${displayMinutes} ${ampm}`;
  } catch (error) {
    console.warn('Error formatting time:', error);
    return "TBD";
  }
};

// SAFE GAME TIME FORMATTING FOR DISPLAY
const safeFormatGameTime = (startTime: string | undefined | null): string => {
  try {
    if (!startTime) return "TBD";
    
    const date = new Date(startTime);
    if (isNaN(date.getTime())) return "TBD";
    
    // Safe date formatting without timezone complications
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    const time = safeFormatTime(startTime);
    
    return `${month} ${day} at ${time}`;
  } catch (error) {
    console.warn('Error formatting game time:', error);
    return "TBD";
  }
};

export function ActionStyleGameCard({
  homeTeam,
  awayTeam,
  homeOdds,
  awayOdds,
  spread,
  total,
  startTime,
  prediction,
  bookmakers = [],
  gameId,
  probablePitchers,
  isDailyPick = false,
  dailyPickTeam,
  dailyPickGrade,
  dailyPickId,
  lockPickTeam,
  lockPickGrade,
  lockPickId,
  isAuthenticated = false,
  rawBookmakers = []
}: ActionStyleGameCardProps) {
  const [selectedBet, setSelectedBet] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Safe team color helpers
  const getHomeColor = () => {
    try {
      return getTeamColor(homeTeam);
    } catch {
      return 'bg-blue-500';
    }
  };

  const getAwayColor = () => {
    try {
      return getTeamColor(awayTeam);
    } catch {
      return 'bg-red-500';
    }
  };

  // Safe prediction values with fallbacks
  const safeHomeProb = prediction?.homeWinProbability ?? 0.5;
  const safeAwayProb = prediction?.awayWinProbability ?? 0.5;
  const safeConfidence = prediction?.confidence ?? 0.5;
  const safeEdge = prediction?.edge ?? 'No edge';

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
      <CardContent className="p-3 sm:p-4">
        {/* Header with time and special badges */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
              {safeFormatTime(startTime)}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            {isDailyPick && (
              <Badge variant="outline" className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-none text-xs px-2 py-0.5">
                <Star className="w-3 h-3 mr-1" />
                Pick of Day
              </Badge>
            )}
            
            {lockPickTeam && (
              <Badge variant="outline" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none text-xs px-2 py-0.5">
                <Lock className="w-3 h-3 mr-1" />
                Lock Pick
              </Badge>
            )}
          </div>
        </div>

        {/* Teams and Odds */}
        <div className="space-y-2 mb-4">
          {/* Away Team */}
          <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getAwayColor()}`}></div>
              <span className="font-medium text-sm">{awayTeam}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono font-bold">
                {formatOdds(awayOdds)}
              </span>
              <Button 
                size="sm" 
                variant="outline"
                className="h-6 px-2 text-xs"
                onClick={() => setSelectedBet(`${awayTeam} ML`)}
              >
                Pick
              </Button>
            </div>
          </div>

          {/* Home Team */}
          <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getHomeColor()}`}></div>
              <span className="font-medium text-sm">{homeTeam}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono font-bold">
                {formatOdds(homeOdds)}
              </span>
              <Button 
                size="sm" 
                variant="outline"
                className="h-6 px-2 text-xs"
                onClick={() => setSelectedBet(`${homeTeam} ML`)}
              >
                Pick
              </Button>
            </div>
          </div>
        </div>

        {/* Spread and Total */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
            <div className="text-xs text-gray-500 mb-1">Spread</div>
            <div className="font-mono text-sm font-bold">
              {formatSpread(spread)}
            </div>
            <div className="flex gap-1 mt-1">
              <Button size="sm" variant="outline" className="h-5 px-1 text-xs flex-1">
                Pick
              </Button>
              <Button size="sm" variant="outline" className="h-5 px-1 text-xs flex-1">
                Fade
              </Button>
            </div>
          </div>
          
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
            <div className="text-xs text-gray-500 mb-1">Total</div>
            <div className="font-mono text-sm font-bold">
              {formatTotal(total)}
            </div>
            <div className="flex gap-1 mt-1">
              <Button size="sm" variant="outline" className="h-5 px-1 text-xs flex-1">
                O
              </Button>
              <Button size="sm" variant="outline" className="h-5 px-1 text-xs flex-1">
                U
              </Button>
            </div>
          </div>
        </div>

        {/* Prediction Section */}
        {prediction && (
          <div className="border-t pt-3 mt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                AI Prediction
              </span>
              <Badge variant="outline" className="text-xs">
                {Math.round(safeConfidence * 100)}% confident
              </Badge>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>{awayTeam}</span>
                <span className="font-mono">{Math.round(safeAwayProb * 100)}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>{homeTeam}</span>
                <span className="font-mono">{Math.round(safeHomeProb * 100)}%</span>
              </div>
              <div className="text-xs text-center text-gray-600 dark:text-gray-400 mt-1">
                Edge: {safeEdge}
              </div>
            </div>
          </div>
        )}

        {/* Game Info Button */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full mt-3 h-7 text-xs"
            >
              <Info className="w-3 h-3 mr-1" />
              Game Info
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base">
                {awayTeam} @ {homeTeam}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium mb-1">Game Time</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {safeFormatGameTime(startTime)}
                </p>
              </div>
              
              {bookmakers.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Best Odds</h4>
                  <div className="space-y-1">
                    {bookmakers.slice(0, 3).map((book, index) => (
                      <div key={index} className="flex justify-between text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <span>{book.name}</span>
                        <span className="font-mono">
                          {formatOdds(book.awayOdds)} / {formatOdds(book.homeOdds)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
