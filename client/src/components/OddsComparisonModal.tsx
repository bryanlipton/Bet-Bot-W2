import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, TrendingUp, Crown, Clock, Zap, CheckCircle, AlertCircle } from "lucide-react";
import { Link, useLocation } from 'wouter';
import { apiRequest, queryClient } from "@/lib/queryClient";
import { BetConfirmationModal } from './BetConfirmationModal';

interface BookmakerOdds {
  key: string;
  title: string;
  link?: string;  // Event-level deep link from API
  sid?: string;   // Source ID
  markets: Array<{
    key: string;
    link?: string;   // Market-level deep link from API
    sid?: string;    // Market source ID
    outcomes: Array<{
      name: string;
      price: number;
      point?: number;
      link?: string;   // Outcome-level deep link (bet slip) from API
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

// BOOKMAKER BASE URLS - UPDATE THESE WITH YOUR AFFILIATE LINKS
const BOOKMAKER_URLS: Record<string, string> = {
  // Primary US Sportsbooks
  'draftkings': 'https://sportsbook.draftkings.com',
  'fanduel': 'https://sportsbook.fanduel.com',
  'betmgm': 'https://sports.betmgm.com',
  'caesars': 'https://sportsbook.caesars.com',
  'pointsbetus': 'https://sportsbook.pointsbet.com',
  
  // Offshore Sportsbooks
  'lowvig': 'https://www.lowvig.ag',
  'betonlineag': 'https://www.betonline.ag',
  'betus': 'https://www.betus.com.pa',
  'mybookieag': 'https://www.mybookie.ag',
  'bovada': 'https://www.bovada.lv',
  
  // Additional US Books
  'williamhill_us': 'https://www.williamhill.com',
  'wynnbet': 'https://www.wynnbet.com',
  'betrivers': 'https://www.betrivers.com',
  'superbook': 'https://www.superbook.com',
  'unibet_us': 'https://www.unibet.com',
  'betfred': 'https://www.betfred.com',
  'sugarhouse': 'https://www.playsugarhouse.com',
  'foxbet': 'https://www.foxbet.com',
  'barstool': 'https://www.barstoolsportsbook.com',
};

// Display names for bookmakers
const BOOKMAKER_DISPLAY_NAMES: Record<string, string> = {
  'lowvig': 'LowVig',
  'betonlineag': 'BetOnline',
  'betus': 'BetUS',
  'mybookieag': 'MyBookie',
  'bovada': 'Bovada',
  'draftkings': 'DraftKings',
  'fanduel': 'FanDuel',
  'betmgm': 'BetMGM',
  'caesars': 'Caesars',
  'pointsbetus': 'PointsBet',
  'williamhill_us': 'William Hill',
  'wynnbet': 'WynnBet',
  'betrivers': 'BetRivers',
  'superbook': 'SuperBook',
  'unibet_us': 'Unibet',
  'betfred': 'Betfred',
  'sugarhouse': 'SugarHouse',
  'foxbet': 'FOX Bet',
  'barstool': 'Barstool',
};

// Simple deep link builder
function buildBookmakerUrl(
  bookmakerKey: string,
  apiLinks?: { bookmakerLink?: string; marketLink?: string; outcomeLink?: string },
  gameInfo?: { sport?: string; homeTeam?: string; awayTeam?: string }
): { url: string; linkType: 'bet-slip' | 'market' | 'game' | 'homepage'; hasDeepLink: boolean } {
  
  const baseUrl = BOOKMAKER_URLS[bookmakerKey.toLowerCase()] || `https://www.${bookmakerKey}.com`;
  
  // 1. First priority: Use API-provided deep links if available
  if (apiLinks?.outcomeLink) {
    // Bet slip level - best deep link
    return { 
      url: apiLinks.outcomeLink, 
      linkType: 'bet-slip',
      hasDeepLink: true 
    };
  }
  
  if (apiLinks?.marketLink) {
    // Market level - good deep link
    return { 
      url: apiLinks.marketLink, 
      linkType: 'market',
      hasDeepLink: true 
    };
  }
  
  if (apiLinks?.bookmakerLink) {
    // Game level - basic deep link
    return { 
      url: apiLinks.bookmakerLink, 
      linkType: 'game',
      hasDeepLink: true 
    };
  }
  
  // 2. Fallback: Try manual deep link patterns for major bookmakers
  if (gameInfo?.sport === 'baseball_mlb') {
    const key = bookmakerKey.toLowerCase();
    
    // DraftKings MLB deep link pattern
    if (key === 'draftkings') {
      return {
        url: `${baseUrl}/leagues/baseball/mlb`,
        linkType: 'game',
        hasDeepLink: true
      };
    }
    
    // FanDuel MLB deep link pattern
    if (key === 'fanduel') {
      return {
        url: `${baseUrl}/navigation/mlb`,
        linkType: 'game',
        hasDeepLink: true
      };
    }
    
    // BetMGM MLB deep link pattern
    if (key === 'betmgm') {
      return {
        url: `${baseUrl}/en/sports/baseball-23/betting/usa-9/mlb-75`,
        linkType: 'game',
        hasDeepLink: true
      };
    }
  }
  
  // 3. Default: Just return the homepage
  return { 
    url: baseUrl, 
    linkType: 'homepage',
    hasDeepLink: false 
  };
}

// Helper function to get display name
function getBookmakerDisplayName(bookmakerKey: string): string {
  const key = bookmakerKey.toLowerCase();
  return BOOKMAKER_DISPLAY_NAMES[key] || bookmakerKey;
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
  const [showBetConfirmation, setShowBetConfirmation] = useState(false);
  const [confirmationBetData, setConfirmationBetData] = useState(null);
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
      if (selectedBet.market === 'moneyline' || selectedBet.market === 'h2h') {
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

    // Build URL with deep linking support
    const urlResult = buildBookmakerUrl(
      bookmaker.key,
      {
        bookmakerLink: bookmaker.link,
        marketLink: market.link,
        outcomeLink: outcome.link
      },
      gameInfo
    );

    return {
      bookmaker: bookmaker.key,
      displayName: getBookmakerDisplayName(bookmaker.key),
      odds: outcome.price,
      line: outcome.point,
      url: urlResult.url,
      hasDeepLink: urlResult.hasDeepLink,
      linkType: urlResult.linkType,
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
  
  console.log('1. handleMakePick called'); // ADD THIS

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
  
  console.log('2. Bet data created:', betConfirmationData); // ADD THIS
  
  // Try to open bookmaker
  const newWindow = window.open(bookmakerData.url, '_blank', 'noopener,noreferrer');
  
  console.log('3. Window opened?', !!newWindow); // ADD THIS
  
  // Show confirmation modal after delay
  setTimeout(() => {
    console.log('4. About to show modal'); // ADD THIS
    console.log('5. Current state before:', showBetConfirmation); // ADD THIS
    setConfirmationBetData(betConfirmationData);
    setShowBetConfirmation(true);
    console.log('6. Modal should be visible now'); // ADD THIS
    onClose(); // Close the odds comparison modal
  }, newWindow ? 3000 : 100);
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
                                    odds!.linkType === 'game' ? 'text-amber-500' :
                                    'text-gray-400'
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

            {/* Footer with deep link indicators */}
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
                <span>| Gray = Homepage</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showBetConfirmation && confirmationBetData && (
        <BetConfirmationModal
          open={showBetConfirmation}
          onClose={() => {
            setShowBetConfirmation(false);
            setConfirmationBetData(null);
          }}
          betData={confirmationBetData}
        />
      )}
    </>
  );
}
