import { useState } from 'react';
import { useRoute, useRouter } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, TrendingUp, DollarSign, Target, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';

interface BetConfirmationData {
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
}

export default function BetConfirmation() {
  const [match, params] = useRoute('/bet-confirmation/:dataId');
  const router = useRouter();
  const { user } = useAuth();
  const [units, setUnits] = useState<number>(1);
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Get user's bet unit preference
  const { data: userProfile } = useQuery({
    queryKey: ['/api/user/profile'],
    enabled: !!user,
  });

  const betUnit = (userProfile as any)?.betUnit || 10;
  const dollarAmount = units * betUnit;

  // Decode bet data from URL params
  const betData: BetConfirmationData | null = params?.dataId 
    ? (() => {
        try {
          return JSON.parse(decodeURIComponent(params.dataId));
        } catch {
          return null;
        }
      })()
    : null;

  const handleConfirmBet = async () => {
    if (!betData || !user) return;

    setIsSubmitting(true);
    try {
      await apiRequest('POST', '/api/user/confirmed-bets', {
        gameId: betData.gameId,
        homeTeam: betData.homeTeam,
        awayTeam: betData.awayTeam,
        selection: betData.selection,
        market: betData.market,
        line: betData.line,
        odds: betData.odds,
        units,
        betUnitAtTime: betUnit,
        bookmaker: betData.bookmaker,
        bookmakerDisplayName: betData.bookmakerDisplayName,
        gameDate: betData.gameDate,
        isPublic
      });

      setIsComplete(true);
    } catch (error) {
      console.error('Error confirming bet:', error);
      alert('Failed to confirm bet. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : odds.toString();
  };

  const getBetDescription = () => {
    if (!betData) return '';
    
    if (betData.market === 'moneyline') {
      return `${betData.selection} to win`;
    }
    if (betData.market === 'spread') {
      const line = betData.line || '0';
      return `${betData.selection} ${line.startsWith('-') ? '' : '+'}${line}`;
    }
    if (betData.market === 'total') {
      return `${betData.selection} ${betData.line || ''}`;
    }
    return betData.selection;
  };

  const calculatePotentialWin = () => {
    if (!betData) return 0;
    if (betData.odds > 0) {
      return (dollarAmount * betData.odds) / 100;
    } else if (betData.odds < 0) {
      return (dollarAmount * 100) / Math.abs(betData.odds);
    }
    return 0;
  };

  if (!match || !betData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Bet Data</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Unable to load bet confirmation details.
            </p>
            <Button onClick={() => router[1]('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-green-900 dark:text-green-100 mb-2">
              Bet Confirmed!
            </h1>
            <p className="text-green-700 dark:text-green-300 mb-6">
              Your bet has been successfully recorded and will appear on your profile.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => router[1]('/my-picks')}>
                View My Picks
              </Button>
              <Button variant="outline" onClick={() => router[1]('/')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router[1]('/')}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Games
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Confirm Your Bet
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Did you place this bet? Enter your bet details below.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Bet Summary */}
          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-blue-900 dark:text-blue-100">
                    {betData.awayTeam} @ {betData.homeTeam}
                  </h3>
                  <Badge className="bg-blue-600 text-white">
                    {formatOdds(betData.odds)}
                  </Badge>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {getBetDescription()}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  @ {betData.bookmakerDisplayName}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Units Selection */}
          <div className="space-y-3">
            <Label htmlFor="units" className="text-base font-medium">
              How many units did you bet?
            </Label>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setUnits(Math.max(0.5, units - 0.5))}
                  disabled={units <= 0.5}
                >
                  -
                </Button>
                <Input
                  id="units"
                  type="number"
                  value={units}
                  onChange={(e) => setUnits(Math.max(0.5, parseFloat(e.target.value) || 0.5))}
                  className="w-20 text-center"
                  step="0.5"
                  min="0.5"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setUnits(units + 0.5)}
                >
                  +
                </Button>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                = ${dollarAmount.toFixed(2)} bet
              </div>
            </div>
          </div>

          {/* Payout Calculation */}
          <Card className="border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Bet Amount:</span>
                <span className="font-medium">${dollarAmount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Potential Win:</span>
                <span className="font-medium text-green-600">
                  ${calculatePotentialWin().toFixed(2)}
                </span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total Payout:</span>
                  <span className="font-bold text-lg">
                    ${(dollarAmount + calculatePotentialWin()).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Setting */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="public"
              checked={isPublic}
              onCheckedChange={(checked) => setIsPublic(checked === true)}
            />
            <Label htmlFor="public" className="text-sm">
              Show this bet on my public profile
            </Label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              onClick={handleConfirmBet}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Confirming...' : 'Yes, I Made This Bet'}
            </Button>
            <Button
              variant="outline"
              onClick={() => router[1]('/')}
              className="flex-1"
            >
              No, Skip This
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}