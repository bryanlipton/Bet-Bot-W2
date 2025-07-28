import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, TrendingUp, Crown, Clock, Zap, CheckCircle, AlertCircle } from "lucide-react";
import { Link, useLocation } from 'wouter';
import { getBookmakerUrl, getBookmakerDisplayName, affiliateLinks } from '@/config/affiliateLinks';
import { buildDeepLink } from '@/utils/deepLinkBuilder';
import { pickStorage } from '@/services/pickStorage';
import { databasePickStorage } from '@/services/databasePickStorage';
import { Pick } from '@/types/picks';
import { apiRequest, queryClient } from "@/lib/queryClient";

interface BookmakerOdds {
  key: string;
  title: string;
  link?: string;  // Event-level deep link
  sid?: string;   // Source ID
  markets: Array<{
    key: string;
    link?: string;   // Market-level deep link
    sid?: string;    // Market source ID
    outcomes: Array<{
      name: string;
      price: number;
      point?: number;
      link?: string;   // Outcome-level deep link (bet slip)
      sid?: string;    // Outcome source ID
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
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] = useState<{
    bookmaker: string;
    odds: number;
    url: string;
  } | null>(null);
  const [units, setUnits] = useState<number>(1);
  const [, navigate] = useLocation();

  // Reset state when modal opens/closes
  const handleClose = () => {
    setShowConfirmation(false);
    setConfirmationData(null);
    setUnits(1);
    onClose();
  };



  // Find odds for the selected bet across all bookmakers
  const oddsData = bookmakers.map(bookmaker => {
    const market = bookmaker.markets.find(m => {
      if (selectedBet.market === 'moneyline' || selectedBet.market === 'h2h') return m.key === 'h2h';
      if (selectedBet.market === 'spread') return m.key === 'spreads';
      if (selectedBet.market === 'total') return m.key === 'totals';
      return false;
    });

    if (!market) return null;

    let outcome = market.outcomes.find(o => {
      if (selectedBet.market === 'moneyline') {
        return o.name === selectedBet.selection;
      }
      if (selectedBet.market === 'h2h' || selectedBet.market === 'moneyline') {
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

    // Build the best possible deep link using Odds API data + manual patterns
    const deepLinkResult = buildDeepLink(
      bookmaker.key,
      gameInfo,
      {
        market: selectedBet.market === 'total' ? 
          (selectedBet.selection === 'Over' ? 'over' : 'under') : 
          selectedBet.market,
        selection: selectedBet.selection,
        line: selectedBet.line || outcome.point
      },
      {
        bookmakerLink: bookmaker.link,
        marketLink: market.link,
        outcomeLink: outcome.link
      }
    );

    return {
      bookmaker: bookmaker.key,
      displayName: getBookmakerDisplayName(bookmaker.key),
      odds: outcome.price,
      line: outcome.point,
      url: deepLinkResult.url,
      hasDeepLink: deepLinkResult.hasDeepLink,
      linkType: deepLinkResult.linkType, // 'bet-slip', 'market', 'game', or 'manual'
      lastUpdate: bookmaker.last_update
    };
  }).filter(Boolean);

  // Sort odds: for negative odds, show closest to 0 first (-170, -172, -175)
  // For positive odds, show highest first (+150, +120, +100)
  const sortedOdds = oddsData.sort((a, b) => {
    if (a!.odds > 0 && b!.odds > 0) return b!.odds - a!.odds; // Higher positive is better
    if (a!.odds < 0 && b!.odds < 0) return b!.odds - a!.odds; // Higher negative number appears first (-170 before -175)
    if (a!.odds > 0 && b!.odds < 0) return -1; // Positive odds are better than negative
    if (a!.odds < 0 && b!.odds > 0) return 1;
    return 0;
  });

  const bestOdds = sortedOdds[0];

  const handleMakePick = (bookmakerData: typeof sortedOdds[0]) => {
    if (!bookmakerData) return;

    // Create bet confirmation data
    const betConfirmationData = {
      gameId: gameInfo.gameId || `mlb_${Date.now()}`,
      homeTeam: gameInfo.homeTeam,
      awayTeam: gameInfo.awayTeam,
      selection: selectedBet.selection,
      market: selectedBet.market,
      line: selectedBet.line?.toString(),
      odds: bookmakerData.odds,
      bookmaker: bookmakerData.bookmaker,
      bookmakerDisplayName: bookmakerData.displayName,
      gameDate: gameInfo.gameTime || new Date().toISOString()
    };
    
    // Open bookmaker in new tab
    window.open(bookmakerData.url, '_blank');
    
    // Navigate to bet confirmation page after delay
    setTimeout(() => {
      const encodedData = encodeURIComponent(JSON.stringify(betConfirmationData));
      navigate(`/bet-confirmation/${encodedData}`);
      onClose(); // Close the modal
    }, 3000); // 3 second delay
  };

  const handleSaveBet = async () => {
    if (!confirmationData) return;

    try {
      console.log('=== SAVING PICK ===');
      const pickData = {
        gameId: gameInfo.gameId || `mlb_${Date.now()}`,
        game: `${gameInfo.awayTeam} @ ${gameInfo.homeTeam}`,
        homeTeam: gameInfo.homeTeam,
        awayTeam: gameInfo.awayTeam,
        selection: selectedBet.selection,
        market: selectedBet.market === 'total' ? 
          (selectedBet.selection === 'Over' ? 'over' : 'under') : 
          selectedBet.market,
        line: selectedBet.line?.toString() || null,
        odds: confirmationData.odds,
        units: units,
        bookmaker: 'confirmed',
        bookmakerDisplayName: confirmationData.bookmaker,
        gameDate: gameInfo.gameTime ? new Date(gameInfo.gameTime) : new Date()
      };

      console.log('Pick data to save:', pickData);
      console.log('About to make API request to /api/user/picks...');
      
      const response = await apiRequest('POST', '/api/user/picks', pickData);
      console.log('Raw API response received:', response);
      
      if (response.ok) {
        console.log('✅ Pick saved successfully!');
        // Invalidate cache to refresh My Picks page
        queryClient.invalidateQueries({ queryKey: ['/api/user/picks'] });
        queryClient.invalidateQueries({ queryKey: ['/api/user/picks/stats'] });
        console.log('Cache invalidated.');
      } else {
        const errorText = await response.text();
        console.error('❌ Server returned error:', response.status, errorText);
      }
      
      handleClose();
    } catch (error) {
      console.error('❌ Error saving pick:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : 'Unknown'
      });
      // Still close the modal even if save fails
      handleClose();
    }
  };

  const handleSkip = () => {
    handleClose();
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
    <>
      <Dialog open={open && !showConfirmation} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto touch-pan-y" style={{ WebkitOverflowScrolling: 'touch' }}>
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
                            {odds!.hasDeepLink && (
                              <Zap 
                                className={`w-3 h-3 ${
                                  odds!.linkType === 'bet-slip' ? 'text-green-600' :
                                  odds!.linkType === 'market' ? 'text-blue-500' :
                                  'text-amber-500'
                                }`}
                              />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Updated: {(() => {
                              try {
                                const date = new Date(odds!.lastUpdate);
                                return !isNaN(date.getTime()) ? date.toLocaleTimeString() : 'Unknown';
                              } catch {
                                return 'Unknown';
                              }
                            })()}
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
                          className={`${
                            index === 0 
                              ? 'bg-green-600 hover:bg-green-700' 
                              : 'bg-blue-600 hover:bg-blue-700'
                          } text-white`}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Bet Now
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
              Click "Bet Now" to open the sportsbook and place your bet.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-green-600" />
                <span>Bet slip</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-blue-500" />
                <span>Market</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-500" />
                <span>Game</span>
              </div>
              <span>| Others = Login page</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Confirmation Modal */}
    <Dialog open={showConfirmation} onOpenChange={() => setShowConfirmation(false)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Did you place this bet?
          </DialogTitle>
          <DialogDescription>
            Save your bet to track its performance in My Picks
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Bet Details */}
          <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="font-medium text-green-900 dark:text-green-100">
                  {gameInfo.awayTeam} @ {gameInfo.homeTeam}
                </div>
                <div className="text-sm text-green-700 dark:text-green-300">
                  {getBetDescription()}
                </div>
                <div className="text-sm">
                  <span className="text-green-600 dark:text-green-400">Odds:</span> {confirmationData ? formatOdds(confirmationData.odds) : ''}
                </div>
                <div className="text-sm">
                  <span className="text-green-600 dark:text-green-400">Bookmaker:</span> {confirmationData?.bookmaker}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Units Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Unit Size
            </label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUnits(Math.max(0.5, units - 0.5))}
                disabled={units <= 0.5}
              >
                -
              </Button>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={units}
                onChange={(e) => setUnits(Math.max(0.5, parseFloat(e.target.value) || 0.5))}
                className="w-20 text-center border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUnits(units + 0.5)}
              >
                +
              </Button>
              <span className="text-sm text-gray-500">units</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleSaveBet}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              Save
            </Button>
            <Button
              onClick={handleSkip}
              variant="outline"
              className="flex-1"
            >
              Skip
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </>
  );
}