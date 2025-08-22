import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  ExternalLink, 
  TrendingUp, 
  AlertCircle, 
  Zap, 
  Star, 
  Clock, 
  ChevronRight,
  Trophy,
  Target,
  DollarSign,
  CheckCircle,
  X
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "wouter";
import { cn } from "@/lib/utils";

// Import these if they exist in your project, otherwise comment out
// import { buildDeepLink } from '@/utils/deepLinkBuilder';
// import { affiliateLinks } from '@/config/affiliateLinks';
// import { savePick } from '@/services/pickStorage';
// import { storePick } from '@/services/databasePickStorage';

interface Outcome {
  name: string;
  price: number;
  point?: number;
  link?: string;
}

interface Market {
  key: string;
  last_update: string;
  outcomes: Outcome[];
  link?: string;
}

interface Bookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: Market[];
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
    commence_time?: string;
  };
  selectedBet: {
    type: 'moneyline' | 'spread' | 'totals';
    team?: string;
    line?: string;
    overUnder?: 'over' | 'under';
  };
  odds: Bookmaker[];
}

// Bookmaker configurations with colors and priority
const BOOKMAKER_CONFIG: Record<string, { 
  url: string; 
  color: string; 
  priority: number;
  displayName?: string;
}> = {
  'draftkings': { 
    url: 'https://sportsbook.draftkings.com', 
    color: 'bg-orange-600', 
    priority: 1,
    displayName: 'DraftKings'
  },
  'fanduel': { 
    url: 'https://sportsbook.fanduel.com', 
    color: 'bg-blue-600', 
    priority: 2,
    displayName: 'FanDuel'
  },
  'betmgm': { 
    url: 'https://sports.betmgm.com', 
    color: 'bg-yellow-600', 
    priority: 3,
    displayName: 'BetMGM'
  },
  'pointsbetus': { 
    url: 'https://pointsbet.com', 
    color: 'bg-red-600', 
    priority: 4,
    displayName: 'PointsBet'
  },
  'betonlineag': { 
    url: 'https://www.betonline.ag', 
    color: 'bg-green-600', 
    priority: 5,
    displayName: 'BetOnline'
  },
  'bovada': { 
    url: 'https://www.bovada.lv', 
    color: 'bg-red-700', 
    priority: 6,
    displayName: 'Bovada'
  },
  'williamhill_us': { 
    url: 'https://www.williamhill.com', 
    color: 'bg-black', 
    priority: 7,
    displayName: 'William Hill'
  },
  'mybookieag': { 
    url: 'https://www.mybookie.ag', 
    color: 'bg-orange-700', 
    priority: 8,
    displayName: 'MyBookie'
  },
  'unibet_us': { 
    url: 'https://www.unibet.com', 
    color: 'bg-green-700', 
    priority: 9,
    displayName: 'Unibet'
  },
  'betrivers': { 
    url: 'https://www.betrivers.com', 
    color: 'bg-blue-700', 
    priority: 10,
    displayName: 'BetRivers'
  },
  'betus': { 
    url: 'https://www.betus.com.pa', 
    color: 'bg-purple-600', 
    priority: 11,
    displayName: 'BetUS'
  },
  'superbook': { 
    url: 'https://www.superbook.com', 
    color: 'bg-gray-700', 
    priority: 12,
    displayName: 'SuperBook'
  },
  'foxbet': { 
    url: 'https://www.foxbet.com', 
    color: 'bg-blue-800', 
    priority: 13,
    displayName: 'FOX Bet'
  },
  'barstool': { 
    url: 'https://www.barstoolsportsbook.com', 
    color: 'bg-black', 
    priority: 14,
    displayName: 'Barstool'
  },
  'twinspires': { 
    url: 'https://www.twinspires.com', 
    color: 'bg-red-800', 
    priority: 15,
    displayName: 'TwinSpires'
  },
  'wynnbet': { 
    url: 'https://www.wynnbet.com', 
    color: 'bg-gold-600', 
    priority: 16,
    displayName: 'WynnBET'
  },
  'betfred': { 
    url: 'https://www.betfred.com', 
    color: 'bg-red-600', 
    priority: 17,
    displayName: 'Betfred'
  },
  'sugarhouse': { 
    url: 'https://www.sugarhouse.com', 
    color: 'bg-blue-500', 
    priority: 18,
    displayName: 'SugarHouse'
  },
  'caesars': { 
    url: 'https://www.caesars.com/sportsbook', 
    color: 'bg-purple-700', 
    priority: 19,
    displayName: 'Caesars'
  },
  'betparx': { 
    url: 'https://www.betparx.com', 
    color: 'bg-green-600', 
    priority: 20,
    displayName: 'betPARX'
  },
  'bet365': { 
    url: 'https://www.bet365.com', 
    color: 'bg-green-600', 
    priority: 21,
    displayName: 'bet365'
  },
  'lowvig': { 
    url: 'https://www.lowvig.ag', 
    color: 'bg-purple-600', 
    priority: 22,
    displayName: 'Lowvig.ag'
  },
  'betway': { 
    url: 'https://sports.betway.com', 
    color: 'bg-black', 
    priority: 23,
    displayName: 'Betway'
  },
  'tipico': { 
    url: 'https://www.tipico.com', 
    color: 'bg-red-600', 
    priority: 24,
    displayName: 'Tipico'
  },
  'betanysports': { 
    url: 'https://www.betanysports.eu', 
    color: 'bg-blue-600', 
    priority: 25,
    displayName: 'BetAnySports'
  }
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
  const [selectedTab, setSelectedTab] = useState<'best' | 'all'>('best');
  const [pendingBet, setPendingBet] = useState<any>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(3);

  // Handle the 3-second delayed confirmation popup
  useEffect(() => {
    if (pendingBet && !showConfirmation) {
      const countdown = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(countdown);
            setShowConfirmation(true);
            return 3; // Reset for next time
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdown);
    }
  }, [pendingBet, showConfirmation]);

  const handleBet = (bookmakerKey: string, bookmakerTitle: string, odds: number, line?: number) => {
    console.log('=== Bet Now Clicked ===');
    console.log('Bookmaker:', bookmakerTitle);
    console.log('Odds:', odds);
    console.log('Line:', line);
    
    // Prepare bet confirmation data
    const betConfirmationData = {
      gameId: game.id,
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam,
      selection: selectedBet.type === 'moneyline' 
        ? selectedBet.team 
        : selectedBet.type === 'totals' 
          ? `${selectedBet.overUnder} ${line || selectedBet.line}`
          : `${selectedBet.team} ${line || selectedBet.line}`,
      market: selectedBet.type,
      line: line?.toString() || selectedBet.line,
      odds: odds,
      bookmaker: bookmakerKey,
      bookmakerDisplayName: bookmakerTitle,
      gameDate: game.gameTime || game.commence_time || new Date().toISOString()
    };

    // Store the pending bet
    setPendingBet(betConfirmationData);
    setTimeRemaining(3);

    // Get the bookmaker URL
    const config = BOOKMAKER_CONFIG[bookmakerKey] || BOOKMAKER_CONFIG[bookmakerKey.toLowerCase()];
    const baseUrl = config?.url || '#';
    
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
      setPendingBet(null);
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

  const getRelevantOdds = () => {
    const relevantOdds: Array<{
      bookmaker: Bookmaker;
      outcome: Outcome;
      market: Market;
    }> = [];

    odds.forEach(bookmaker => {
      const market = bookmaker.markets?.find(m => {
        if (selectedBet.type === 'moneyline') return m.key === 'h2h';
        if (selectedBet.type === 'spread') return m.key === 'spreads';
        if (selectedBet.type === 'totals') return m.key === 'totals';
        return false;
      });

      if (!market) return;

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

      if (outcome) {
        relevantOdds.push({ bookmaker, outcome, market });
      }
    });

    // Sort by best odds (highest for positive, least negative for negative)
    return relevantOdds.sort((a, b) => b.outcome.price - a.outcome.price);
  };

  const relevantOdds = getRelevantOdds();
  const bestOdds = relevantOdds[0];
  const displayOdds = selectedTab === 'best' ? relevantOdds.slice(0, 5) : relevantOdds;

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : odds.toString();
  };

  const getOddsColor = (odds: number, isBest: boolean) => {
    if (isBest) return 'text-green-400';
    return odds > 0 ? 'text-blue-400' : 'text-gray-300';
  };

  const calculatePayout = (odds: number, bet: number = 100) => {
    if (odds > 0) {
      return bet + (bet * odds / 100);
    } else {
      return bet + (bet * 100 / Math.abs(odds));
    }
  };

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
              {game.awayTeam} @ {game.homeTeam}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col px-6 pb-6">
            {/* Your Selection Card */}
            <Card className="mb-4 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-700 shrink-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-400 mb-1 font-medium">Your Selection</p>
                    <p className="text-xl font-bold text-white">
                      {getBetDescription()}
                    </p>
                  </div>
                  {bestOdds && (
                    <div className="text-right">
                      <p className="text-sm text-gray-400 mb-1">Best Odds</p>
                      <p className="text-2xl font-bold text-green-400">
                        {formatOdds(bestOdds.outcome.price)}
                      </p>
                      <p className="text-xs text-gray-500">
                        @ {bestOdds.bookmaker.title}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tabs for viewing options */}
            <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as 'best' | 'all')} className="shrink-0">
              <TabsList className="grid w-full grid-cols-2 bg-gray-800">
                <TabsTrigger value="best" className="data-[state=active]:bg-blue-600">
                  <Trophy className="w-4 h-4 mr-2" />
                  Top 5 Odds
                </TabsTrigger>
                <TabsTrigger value="all" className="data-[state=active]:bg-blue-600">
                  <Target className="w-4 h-4 mr-2" />
                  All Books ({relevantOdds.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Scrollable Odds List */}
            <ScrollArea className="flex-1 mt-4">
              <div className="space-y-2 pr-2">
                {displayOdds.map((item, index) => {
                  const { bookmaker, outcome, market } = item;
                  const isBest = index === 0;
                  const config = BOOKMAKER_CONFIG[bookmaker.key] || BOOKMAKER_CONFIG[bookmaker.key.toLowerCase()];
                  
                  return (
                    <Card 
                      key={bookmaker.key}
                      className={cn(
                        "border transition-all duration-200",
                        isBest 
                          ? "bg-gradient-to-r from-green-900/20 to-green-800/10 border-green-600 shadow-lg shadow-green-600/20" 
                          : "bg-gray-800/50 border-gray-700 hover:border-gray-600 hover:bg-gray-800/70"
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {isBest && (
                              <Badge className="bg-green-600 text-white">
                                <Star className="w-3 h-3 mr-1" />
                                BEST
                              </Badge>
                            )}
                            <div>
                              <p className="font-semibold text-white text-lg">
                                {config?.displayName || bookmaker.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Clock className="w-3 h-3 text-gray-500" />
                                <p className="text-xs text-gray-500">
                                  Updated: {new Date(bookmaker.last_update).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className={cn(
                                "text-3xl font-bold",
                                getOddsColor(outcome.price, isBest)
                              )}>
                                {formatOdds(outcome.price)}
                              </p>
                              {outcome.point && (
                                <p className="text-sm text-gray-400 mt-1">
                                  Line: {outcome.point > 0 ? '+' : ''}{outcome.point}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                Payout: ${calculatePayout(outcome.price).toFixed(2)}
                              </p>
                            </div>
                            <Button
                              onClick={() => handleBet(
                                bookmaker.key, 
                                config?.displayName || bookmaker.title, 
                                outcome.price,
                                outcome.point
                              )}
                              size="lg"
                              className={cn(
                                "min-w-[120px]",
                                isBest 
                                  ? "bg-green-600 hover:bg-green-700" 
                                  : "bg-blue-600 hover:bg-blue-700"
                              )}
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
            </ScrollArea>

            {/* Bottom Info Section */}
            <div className="mt-4 space-y-2 shrink-0">
              {pendingBet && !showConfirmation && (
                <Alert className="bg-blue-900/20 border-blue-700">
                  <Clock className="w-4 h-4" />
                  <AlertDescription className="text-blue-300">
                    Confirmation will appear in {timeRemaining} seconds...
                  </AlertDescription>
                </Alert>
              )}
              
              <Alert className="bg-yellow-900/20 border-yellow-700">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription className="text-yellow-300">
                  After placing your bet, confirm it here to track in your picks
                </AlertDescription>
              </Alert>
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
              <Card className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-700">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <p className="text-sm text-blue-400 font-medium">Your Bet</p>
                      <Badge className="bg-green-600 text-white">
                        {pendingBet.odds > 0 ? '+' : ''}{pendingBet.odds}
                      </Badge>
                    </div>
                    <p className="font-bold text-lg text-white">
                      {pendingBet.selection}
                    </p>
                    <Separator className="bg-gray-700" />
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-400">
                        {pendingBet.awayTeam} @ {pendingBet.homeTeam}
                      </p>
                      <p className="text-gray-500">
                        via {pendingBet.bookmakerDisplayName}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-3">
              <Button 
                onClick={handleConfirmBet}
                className="flex-1 bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Yes, Track This Bet
              </Button>
              <Button 
                onClick={handleSkipBet}
                variant="outline"
                className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                size="lg"
              >
                <X className="w-4 h-4 mr-2" />
                No, Skip
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              Confirming will add this bet to your picks for tracking and analysis
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
