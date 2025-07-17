import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, TrendingUp, Crown, Clock, Zap } from "lucide-react";
import { getBookmakerUrl, getBookmakerDisplayName, affiliateLinks } from '@/config/affiliateLinks';
import { pickStorage } from '@/services/pickStorage';
import { Pick } from '@/types/picks';

interface BookmakerOdds {
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
}

interface OddsComparisonModalProps {
  open: boolean;
  onClose: () => void;
  gameInfo: {
    homeTeam: string;
    awayTeam: string;
    gameId?: string | number;
    sport?: string;
    gameTime?: string;
  };
  bookmakers: BookmakerOdds[];
  selectedBet: {
    market: 'moneyline' | 'spread' | 'total';
    selection: string;
    line?: number;
  };
}

export function OddsComparisonModal({
  open,
  onClose,
  gameInfo,
  bookmakers,
  selectedBet
}: OddsComparisonModalProps) {
  const [isPlacingBet, setIsPlacingBet] = useState(false);

  // Find odds for the selected bet across all bookmakers
  const oddsData = bookmakers.map(bookmaker => {
    const market = bookmaker.markets.find(m => {
      if (selectedBet.market === 'moneyline') return m.key === 'h2h';
      if (selectedBet.market === 'spread') return m.key === 'spreads';
      if (selectedBet.market === 'total') return m.key === 'totals';
      return false;
    });

    if (!market) return null;

    let outcome = market.outcomes.find(o => {
      if (selectedBet.market === 'moneyline') {
        return o.name === selectedBet.selection;
      }
      if (selectedBet.market === 'spread') {
        return o.name === selectedBet.selection && 
               selectedBet.line !== undefined && 
               Math.abs((o.point || 0) - selectedBet.line) < 0.1;
      }
      if (selectedBet.market === 'total') {
        return (selectedBet.selection === 'Over' && o.name === 'Over') ||
               (selectedBet.selection === 'Under' && o.name === 'Under');
      }
      return false;
    });

    if (!outcome) return null;

    // Generate deep link URL for this specific bet
    const deepLinkUrl = getBookmakerUrl(
      bookmaker.key,
      gameInfo,
      {
        market: selectedBet.market === 'total' ? 
          (selectedBet.selection === 'Over' ? 'over' : 'under') : 
          selectedBet.market,
        selection: selectedBet.selection,
        line: selectedBet.line || outcome.point
      }
    );

    return {
      bookmaker: bookmaker.key,
      displayName: getBookmakerDisplayName(bookmaker.key),
      odds: outcome.price,
      line: outcome.point,
      url: deepLinkUrl, // Use deep link instead of generic URL
      lastUpdate: bookmaker.last_update
    };
  }).filter(Boolean);

  // Sort by best odds (highest for positive odds, closest to 0 for negative)
  const sortedOdds = oddsData.sort((a, b) => {
    if (a!.odds > 0 && b!.odds > 0) return b!.odds - a!.odds; // Higher positive is better
    if (a!.odds < 0 && b!.odds < 0) return a!.odds - b!.odds; // Closer to 0 is better
    if (a!.odds > 0 && b!.odds < 0) return -1; // Positive odds are better than negative
    if (a!.odds < 0 && b!.odds > 0) return 1;
    return 0;
  });

  const bestOdds = sortedOdds[0];

  const handleMakePick = (bookmakerData: typeof sortedOdds[0]) => {
    if (!bookmakerData) return;

    setIsPlacingBet(true);

    // Save pick to localStorage
    const pickData: Omit<Pick, 'id' | 'timestamp'> = {
      gameInfo: {
        homeTeam: gameInfo.homeTeam,
        awayTeam: gameInfo.awayTeam,
        gameId: gameInfo.gameId,
        sport: gameInfo.sport || 'baseball_mlb',
        gameTime: gameInfo.gameTime
      },
      betInfo: {
        market: selectedBet.market === 'total' ? 
          (selectedBet.selection === 'Over' ? 'over' : 'under') : 
          selectedBet.market,
        selection: selectedBet.selection,
        odds: bookmakerData.odds,
        line: selectedBet.line || bookmakerData.line
      },
      bookmaker: {
        key: bookmakerData.bookmaker,
        displayName: bookmakerData.displayName,
        url: bookmakerData.url
      },
      status: 'pending'
    };

    pickStorage.savePick(pickData);

    // Open bookmaker in new tab
    window.open(bookmakerData.url, '_blank');

    // Reset state and close modal
    setTimeout(() => {
      setIsPlacingBet(false);
      onClose();
    }, 1000);
  };

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : odds.toString();
  };

  const getBetDescription = () => {
    if (selectedBet.market === 'moneyline') {
      return `${selectedBet.selection} to win`;
    }
    if (selectedBet.market === 'spread') {
      const line = selectedBet.line || 0;
      return `${selectedBet.selection} ${line > 0 ? '+' : ''}${line}`;
    }
    if (selectedBet.market === 'total') {
      return `${selectedBet.selection} ${selectedBet.line || ''}`;
    }
    return selectedBet.selection;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Compare Odds & Make Pick
          </DialogTitle>
          <DialogDescription>
            {gameInfo.awayTeam} @ {gameInfo.homeTeam} - {getBetDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Selected Bet Summary */}
          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-blue-900 dark:text-blue-100">
                    Your Selection
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {getBetDescription()}
                  </p>
                </div>
                {bestOdds && (
                  <div className="text-right">
                    <Badge className="bg-blue-600 text-white">
                      Best: {formatOdds(bestOdds.odds)}
                    </Badge>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      @ {bestOdds.displayName}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Odds Comparison */}
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900 dark:text-white">
              Available Odds ({sortedOdds.length} books)
            </h3>
            
            {sortedOdds.length === 0 ? (
              <Card>
                <CardContent className="p-4 text-center">
                  <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No odds available for this selection
                  </p>
                </CardContent>
              </Card>
            ) : (
              sortedOdds.map((odds, index) => (
                <Card 
                  key={odds!.bookmaker}
                  className={`transition-all hover:shadow-md ${
                    index === 0 ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-950' : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {index === 0 && (
                          <Crown className="w-4 h-4 text-green-600" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {odds!.displayName}
                            </h4>
                            {(() => {
                              const normalizedKey = odds!.bookmaker.toLowerCase().replace(/[^a-z]/g, '');
                              const affiliate = affiliateLinks[normalizedKey];
                              return affiliate?.deepLinkSupport ? (
                                <Zap className="w-3 h-3 text-blue-500" title="Deep Link Support - Opens specific bet" />
                              ) : null;
                            })()}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Updated: {new Date(odds!.lastUpdate).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-bold text-lg text-gray-900 dark:text-white">
                            {formatOdds(odds!.odds)}
                          </div>
                          {odds!.line && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Line: {odds!.line > 0 ? '+' : ''}{odds!.line}
                            </div>
                          )}
                        </div>
                        
                        <Button
                          onClick={() => handleMakePick(odds)}
                          disabled={isPlacingBet}
                          className={`${
                            index === 0 
                              ? 'bg-green-600 hover:bg-green-700' 
                              : 'bg-blue-600 hover:bg-blue-700'
                          } text-white`}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          {isPlacingBet ? 'Saving...' : 'Bet Now'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Click "Bet Now" to save this pick and open the sportsbook. 
              Your pick will be tracked in "My Picks".
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-blue-600 dark:text-blue-400">
              <Zap className="w-3 h-3" />
              <span>Deep Link Support: Opens specific bet page when available</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}