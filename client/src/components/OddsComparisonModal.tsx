// Fixed OddsComparisonModal.tsx with 3-Second Delayed Bet Tracking
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLink, TrendingUp, AlertCircle, Zap, CheckCircle, DollarSign } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "wouter";

interface Bookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: Array<{
    key: string;
    last_update: string;
    outcomes: Array<{
      name: string;
      price: number;
      point?: number;
      link?: string;
    }>;
    link?: string;
  }>;
  link?: string;
}

interface OddsComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    gameTime?: string;
    sport?: string;
  };
  selectedBet: {
    type: 'moneyline' | 'spread' | 'totals';
    team?: string;
    line?: string;
    overUnder?: 'over' | 'under';
  };
  odds: Bookmaker[];
}

// Bookmaker URLs - UPDATE THESE WITH YOUR AFFILIATE LINKS
const BOOKMAKER_URLS: Record<string, string> = {
  'draftkings': 'https://sportsbook.draftkings.com',
  'fanduel': 'https://sportsbook.fanduel.com',
  'betmgm': 'https://sports.betmgm.com',
  'pointsbetus': 'https://pointsbet.com',
  'betonlineag': 'https://www.betonline.ag',
  'bovada': 'https://www.bovada.lv',
  'williamhill_us': 'https://www.williamhill.com',
  'mybookieag': 'https://www.mybookie.ag',
  'unibet_us': 'https://www.unibet.com',
  'betrivers': 'https://www.betrivers.com',
  'betus': 'https://www.betus.com.pa',
  'superbook': 'https://www.superbook.com',
  'foxbet': 'https://www.foxbet.com',
  'barstool': 'https://www.barstoolsportsbook.com',
  'twinspires': 'https://www.twinspires.com',
  'wynnbet': 'https://www.wynnbet.com',
  'betfred': 'https://www.betfred.com',
  'sugarhouse': 'https://www.sugarhouse.com',
  'caesars': 'https://www.caesars.com/sportsbook',
  'betparx': 'https://www.betparx.com',
  'bet365': 'https://www.bet365.com',
  'lowvig': 'https://www.lowvig.ag',
  'betway': 'https://sports.betway.com',
  'tipico': 'https://www.tipico.com',
  'betanysports': 'https://www.betanysports.eu'
};

export default function OddsComparisonModal({ 
  isOpen, 
  onClose, 
  game, 
  selectedBet, 
  odds 
}: OddsComparisonModalProps) {
  const { toast } = useToast();
  const [, setLocation] = useRouter();
  const [pendingBet, setPendingBet] = useState<any>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Handle the 3-second delayed confirmation popup
  useEffect(() => {
    if (pendingBet) {
      const timer = setTimeout(() => {
        setShowConfirmation(true);
      }, 3000); // 3 seconds delay

      return () => clearTimeout(timer);
    }
  }, [pendingBet]);

  const handleBet = (bookmakerKey: string, bookmakerTitle: string, odds: number) => {
    console.log('=== Bet Now Clicked ===');
    console.log('Bookmaker:', bookmakerTitle);
    console.log('Odds:', odds);
    
    // Prepare bet confirmation data
    const betConfirmationData = {
      gameId: game.id,
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam,
      selection: selectedBet.type === 'moneyline' 
        ? selectedBet.team 
        : selectedBet.type === 'totals' 
          ? `${selectedBet.overUnder} ${selectedBet.line}`
          : `${selectedBet.team} ${selectedBet.line}`,
      market: selectedBet.type,
      line: selectedBet.line,
      odds: odds,
      bookmaker: bookmakerKey,
      bookmakerDisplayName: bookmakerTitle,
      gameDate: game.gameTime || new Date().toISOString()
    };

    // Store the pending bet
    setPendingBet(betConfirmationData);

    // Get the bookmaker URL
    const baseUrl = BOOKMAKER_URLS[bookmakerKey] || BOOKMAKER_URLS[bookmakerKey.toLowerCase()] || '#';
    
    // Open bookmaker site in new tab
    const newWindow = window.open(baseUrl, '_blank');
    
    if (!newWindow) {
      // If popup was blocked, show a message
      toast({
        title: "Popup Blocked",
        description: "Please allow popups to visit the sportsbook",
        variant: "destructive",
      });
    }
  };

  const handleConfirmBet = () => {
    if (pendingBet) {
      // Encode the bet data and navigate to confirmation page
      const encodedData = encodeURIComponent(JSON.stringify(pendingBet));
      
      // Close the modals
      setShowConfirmation(false);
      onClose();
      
      // Navigate to bet confirmation page
      setLocation(`/bet-confirmation/${encodedData}`);
    }
  };

  const handleSkipBet = () => {
    setShowConfirmation(false);
    setPendingBet(null);
    toast({
      title: "Bet Skipped",
      description: "No bet was recorded",
    });
  };

  const getBetDescription = () => {
    if (selectedBet.type === 'moneyline') {
      return `${selectedBet.team} to win`;
    }
    if (selectedBet.type === 'spread') {
      return `${selectedBet.team} ${selectedBet.line}`;
    }
    if (selectedBet.type === 'totals') {
      return `${selectedBet.overUnder} ${selectedBet.line}`;
    }
    return '';
  };

  const sortedBookmakers = [...odds].sort((a, b) => {
    const getOdds = (bookmaker: Bookmaker) => {
      const market = bookmaker.markets?.find(m => {
        if (selectedBet.type === 'moneyline') return m.key === 'h2h';
        if (selectedBet.type === 'spread') return m.key === 'spreads';
        if (selectedBet.type === 'totals') return m.key === 'totals';
        return false;
      });

      if (!market) return -999999;

      const outcome = market.outcomes?.find(o => {
        if (selectedBet.type === 'moneyline') {
          return o.name === selectedBet.team;
        }
        if (selectedBet.type === 'spread') {
          return o.name === selectedBet.team;
        }
        if (selectedBet.type === 'totals') {
          const isOver = selectedBet.overUnder === 'over';
          return o.name === (isOver ? 'Over' : 'Under');
        }
        return false;
      });

      return outcome?.price || -999999;
    };

    return getOdds(b) - getOdds(a);
  });

  return (
    <>
      {/* Main Odds Comparison Modal */}
      <Dialog open={isOpen && !showConfirmation} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col bg-gray-900 text-white border-gray-800">
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-blue-400" />
              Compare Odds & Make Your Bet
            </DialogTitle>
            <DialogDescription className="text-gray-400 mt-2">
              {game.awayTeam} @ {game.homeTeam} - {getBetDescription()}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col px-6 pb-6">
            {/* Your Selection */}
            <Card className="mb-4 bg-blue-900/20 border-blue-800 shrink-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-400 mb-1">Your Selection</p>
                    <p className="text-lg font-semibold text-white">
                      {getBetDescription()}
                    </p>
                  </div>
                  <Badge className="bg-blue-600 text-white text-lg px-3 py-1">
                    Best: {sortedBookmakers[0] && 
                      (() => {
                        const market = sortedBookmakers[0].markets?.find(m => {
                          if (selectedBet.type === 'moneyline') return m.key === 'h2h';
                          if (selectedBet.type === 'spread') return m.key === 'spreads';
                          if (selectedBet.type === 'totals') return m.key === 'totals';
                          return false;
                        });
                        const outcome = market?.outcomes?.find(o => {
                          if (selectedBet.type === 'moneyline') return o.name === selectedBet.team;
                          if (selectedBet.type === 'spread') return o.name === selectedBet.team;
                          if (selectedBet.type === 'totals') {
                            const isOver = selectedBet.overUnder === 'over';
                            return o.name === (isOver ? 'Over' : 'Under');
                          }
                          return false;
                        });
                        const odds = outcome?.price || 0;
                        return odds > 0 ? `+${odds}` : odds;
                      })()
                    }
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Available Odds Header */}
            <h3 className="text-lg font-semibold mb-3 text-gray-200 shrink-0">
              Available Odds ({sortedBookmakers.length} books)
            </h3>

            {/* Scrollable Bookmakers List */}
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-2 pr-2">
                {sortedBookmakers.map((bookmaker, index) => {
                  const market = bookmaker.markets?.find(m => {
                    if (selectedBet.type === 'moneyline') return m.key === 'h2h';
                    if (selectedBet.type === 'spread') return m.key === 'spreads';
                    if (selectedBet.type === 'totals') return m.key === 'totals';
                    return false;
                  });

                  const outcome = market?.outcomes?.find(o => {
                    if (selectedBet.type === 'moneyline') {
                      return o.name === selectedBet.team;
                    }
                    if (selectedBet.type === 'spread') {
                      return o.name === selectedBet.team;
                    }
                    if (selectedBet.type === 'totals') {
                      const isOver = selectedBet.overUnder === 'over';
                      return o.name === (isOver ? 'Over' : 'Under');
                    }
                    return false;
                  });

                  if (!market || !outcome) return null;

                  const odds = outcome.price;
                  const isPositive = odds > 0;
                  const isBestOdds = index === 0;
                  const line = outcome.point || selectedBet.line;

                  return (
                    <Card 
                      key={bookmaker.key} 
                      className={`
                        bg-gray-800/50 border transition-all duration-200
                        ${isBestOdds 
                          ? 'border-green-600 bg-green-900/20 shadow-lg shadow-green-600/20' 
                          : 'border-gray-700 hover:border-gray-600'
                        }
                      `}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {isBestOdds && (
                              <Badge className="bg-green-600 text-white">
                                <Zap className="w-3 h-3 mr-1" />
                                BEST
                              </Badge>
                            )}
                            <div>
                              <p className="font-semibold text-white">
                                {bookmaker.title}
                              </p>
                              <p className="text-xs text-gray-400">
                                Updated: {new Date(bookmaker.last_update).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className={`text-2xl font-bold ${isPositive ? 'text-green-400' : 'text-white'}`}>
                                {isPositive ? '+' : ''}{odds}
                              </p>
                              {line && selectedBet.type !== 'moneyline' && (
                                <p className="text-sm text-gray-400">
                                  Line: {line}
                                </p>
                              )}
                            </div>
                            <Button
                              onClick={() => handleBet(bookmaker.key, bookmaker.title, odds)}
                              className={`
                                ${isBestOdds 
                                  ? 'bg-green-600 hover:bg-green-700' 
                                  : 'bg-blue-600 hover:bg-blue-700'
                                }
                              `}
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Bet Now
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Info Message */}
            <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg shrink-0">
              <p className="text-sm text-yellow-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                After placing your bet, confirm it here to track your picks
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bet Confirmation Popup (appears after 3 seconds) */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="max-w-md bg-gray-900 text-white border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              Did You Place This Bet?
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {pendingBet && (
              <Card className="bg-blue-900/20 border-blue-800">
                <CardContent className="p-4">
                  <p className="text-sm text-blue-400 mb-1">Your Bet</p>
                  <p className="font-semibold text-white">
                    {pendingBet.selection}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {pendingBet.awayTeam} @ {pendingBet.homeTeam}
                  </p>
                  <Badge className="mt-2 bg-green-600 text-white">
                    {pendingBet.odds > 0 ? '+' : ''}{pendingBet.odds} @ {pendingBet.bookmakerDisplayName}
                  </Badge>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-3">
              <Button 
                onClick={handleConfirmBet}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Yes, Track This Bet
              </Button>
              <Button 
                onClick={handleSkipBet}
                variant="outline"
                className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                No, Skip
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              Confirming will add this bet to your picks for tracking
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
