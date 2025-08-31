import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, TrendingUp } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface BetConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  betData: {
    gameId: string;
    homeTeam: string;
    awayTeam: string;
    selection: string;
    market: string;
    line?: string;
    odds: number;
    bookmaker: string;
    bookmakerDisplayName: string;
    gameDate: string;
  };
}

export function BetConfirmationModal({ open, onClose, betData }: BetConfirmationModalProps) {
  const [units, setUnits] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  
  const betUnit = 10;
  const dollarAmount = units * betUnit;

  const handleConfirmBet = async () => {
    setIsSubmitting(true);
    try {
      await apiRequest('POST', '/api/user/picks', {
        gameId: betData.gameId,
        game: `${betData.awayTeam} @ ${betData.homeTeam}`,
        homeTeam: betData.homeTeam,
        awayTeam: betData.awayTeam,
        selection: betData.selection,
        market: betData.market,
        line: betData.line || null,
        odds: betData.odds,
        units: units,
        bookmaker: betData.bookmaker,
        bookmakerDisplayName: betData.bookmakerDisplayName,
        gameDate: new Date(betData.gameDate)
      });

      queryClient.invalidateQueries({ queryKey: ['/api/user/picks'] });
      setIsComplete(true);
      
      setTimeout(() => {
        onClose();
        setIsComplete(false);
        setUnits(1);
      }, 2000);
    } catch (error) {
      console.error('Error confirming bet:', error);
      alert('Failed to save bet. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : odds.toString();
  };

  const calculatePotentialWin = () => {
    if (betData.odds > 0) {
      return (dollarAmount * betData.odds) / 100;
    } else if (betData.odds < 0) {
      return (dollarAmount * 100) / Math.abs(betData.odds);
    }
    return 0;
  };

  if (isComplete) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md z-[9999]">
          <div className="text-center py-6">
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-900 dark:text-green-100">
              Bet Saved!
            </h2>
            <p className="text-green-700 dark:text-green-300 mt-2">
              Your bet has been added to My Picks
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md z-[9999]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Confirm Your Bet
          </DialogTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Did you place this bet? Enter your bet details below.
          </p>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">
                  {betData.awayTeam} @ {betData.homeTeam}
                </h3>
                <Badge className="bg-blue-600 text-white">
                  {formatOdds(betData.odds)}
                </Badge>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {betData.selection} to win
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                @ {betData.bookmakerDisplayName}
              </p>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <label className="text-sm font-medium">How many units did you bet?</label>
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
                value={units}
                onChange={(e) => setUnits(Math.max(0.5, parseFloat(e.target.value) || 0.5))}
                className="w-20 text-center border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800"
                step="0.5"
                min="0.5"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUnits(units + 0.5)}
              >
                +
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">= ${dollarAmount.toFixed(2)} bet</span>
            </div>
          </div>

          <Card className="border-gray-200 dark:border-gray-700">
            <CardContent className="p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Bet Amount:</span>
                <span className="font-medium">${dollarAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Potential Win:</span>
                <span className="font-medium text-green-600">
                  ${calculatePotentialWin().toFixed(2)}
                </span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-1 mt-1">
                <div className="flex justify-between font-bold">
                  <span>Total Payout:</span>
                  <span className="text-lg">${(dollarAmount + calculatePotentialWin()).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button
              onClick={handleConfirmBet}
              disabled={isSubmitting}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? 'Saving...' : 'Yes, I Made This Bet'}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              No, Skip This
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
