// client/src/components/BetConfirmationModal.tsx
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

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
    sport?: string;
  };
}

export function BetConfirmationModal({ open, onClose, betData }: BetConfirmationModalProps) {
  const [units, setUnits] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  // Get bet unit from profile or use default
  const betUnit = profile?.unit_size || 25;
  const dollarAmount = units * betUnit;

  const handleConfirmBet = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save your picks",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Create the pick object with ONLY the fields that exist in the database
      const pickToSave = {
        // Don't include 'id' - let Supabase generate it automatically
        user_id: user.id,
        timestamp: new Date().toISOString(),
        
        // Store game info as JSONB
        game_info: {
          homeTeam: betData.homeTeam,
          awayTeam: betData.awayTeam,
          gameId: betData.gameId,
          sport: betData.sport || 'MLB',
          gameTime: betData.gameDate
        },
        
        // Store bet info as JSONB
        bet_info: {
          market: betData.market,
          selection: betData.selection,
          odds: betData.odds,
          line: betData.line || null,
          units: units
        },
        
        // Store bookmaker info as JSONB
        bookmaker: {
          key: betData.bookmaker,
          displayName: betData.bookmakerDisplayName,
          url: `https://sportsbook.${betData.bookmaker}.com`,
          odds: betData.odds
        },
        
        // Only include fields that actually exist in the database
        status: 'pending',
        bet_unit_at_time: betUnit,
        show_on_profile: true,
        show_on_feed: true,
        result: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
        
        // DO NOT include these fields - they don't exist in the database:
        // awayTeam, homeTeam, teamBet, betType, odds, line, createdAt
      };

      console.log('Attempting to save pick:', pickToSave);

      // Save to Supabase
      const { data, error } = await supabase
        .from('picks')
        .insert([pickToSave])
        .select()
        .single();

      if (error) {
        console.error('Error saving pick to Supabase:', error);
        console.error('Error details:', error.message, error.details, error.hint);
        
        // More specific error messages
        if (error.message?.includes('duplicate')) {
          toast({
            title: "Duplicate Pick",
            description: "This pick has already been saved",
            variant: "destructive"
          });
        } else if (error.message?.includes('violates')) {
          toast({
            title: "Invalid Data",
            description: "Some fields are missing or invalid. Please try again.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: error.message || "Failed to save pick. Please try again.",
            variant: "destructive"
          });
        }
        return;
      }

      console.log('Pick saved successfully:', data);

      // Also save to localStorage as backup
      const localPicks = JSON.parse(localStorage.getItem('userPicks') || '[]');
      localPicks.unshift({
        id: data?.id || pickToSave.id,
        timestamp: new Date().toISOString(),
        gameInfo: {
          homeTeam: betData.homeTeam,
          awayTeam: betData.awayTeam,
          gameId: betData.gameId,
          sport: betData.sport || 'MLB',
          gameTime: betData.gameDate
        },
        betInfo: {
          market: betData.market,
          selection: betData.selection,
          odds: betData.odds,
          line: betData.line,
          units: units
        },
        bookmaker: {
          key: betData.bookmaker,
          displayName: betData.bookmakerDisplayName,
          url: `https://sportsbook.${betData.bookmaker}.com`
        },
        status: 'pending',
        betUnitAtTime: betUnit,
        showOnProfile: true,
        showOnFeed: true
      });
      localStorage.setItem('userPicks', JSON.stringify(localPicks));

      // Invalidate queries to refresh the picks list
      queryClient.invalidateQueries({ queryKey: ['my-picks-supabase'] });
      
      setIsComplete(true);
      
      toast({
        title: "Success!",
        description: "Your pick has been saved",
      });
      
      // Auto close after 2 seconds
      setTimeout(() => {
        onClose();
        setIsComplete(false);
        setUnits(1);
      }, 2000);
    } catch (error) {
      console.error('Error confirming bet:', error);
      toast({
        title: "Error",
        description: "Failed to save bet. Please try again.",
        variant: "destructive"
      });
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
                {betData.selection} {betData.line ? `(${betData.line})` : ''} {betData.market}
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
              <span className="text-sm text-gray-600 dark:text-gray-400">
                = ${dollarAmount.toFixed(2)} bet
              </span>
            </div>
            <p className="text-xs text-gray-500 text-center">
              Unit size: ${betUnit} per unit
            </p>
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
              disabled={isSubmitting || !user}
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

          {!user && (
            <p className="text-xs text-center text-yellow-600 dark:text-yellow-400">
              Please log in to save your picks
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
