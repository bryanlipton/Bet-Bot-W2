import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, BarChart3, Target, DollarSign } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface BacktestResult {
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  profitLoss: number;
  sharpeRatio: number;
  maxDrawdown: number;
  bets: Array<{
    date: string;
    game: string;
    prediction: number;
    actual: number;
    correct: boolean;
    stake: number;
    profit: number;
    odds: number;
  }>;
}

export function BacktestResults() {
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('2024-05-01');
  const [endDate, setEndDate] = useState('2024-09-30');
  const [bankroll, setBankroll] = useState(1000);

  const runBacktest = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/baseball/backtest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ startDate, endDate, bankroll })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Backtest failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Baseball Model Backtesting
          </CardTitle>
          <CardDescription>
            Test the model's performance on historical 2024 MLB data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="bankroll">Initial Bankroll ($)</Label>
              <Input
                id="bankroll"
                type="number"
                value={bankroll}
                onChange={(e) => setBankroll(Number(e.target.value))}
              />
            </div>
          </div>
          <Button onClick={runBacktest} disabled={loading} className="w-full">
            {loading ? 'Running Backtest...' : 'Run Backtest'}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Accuracy</p>
                  <p className="text-2xl font-bold">{(result.accuracy * 100).toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">
                    {result.correctPredictions} / {result.totalPredictions} correct
                  </p>
                </div>
                <Target className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Profit/Loss</p>
                  <p className={`text-2xl font-bold ${result.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${result.profitLoss.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {((result.profitLoss / bankroll) * 100).toFixed(1)}% ROI
                  </p>
                </div>
                <DollarSign className={`h-8 w-8 ${result.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sharpe Ratio</p>
                  <p className="text-2xl font-bold">{result.sharpeRatio.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">
                    Risk-adjusted return
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Max Drawdown</p>
                  <p className="text-2xl font-bold text-red-600">
                    {(result.maxDrawdown * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Worst losing streak
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {result && result.bets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Betting History</CardTitle>
            <CardDescription>
              Top 10 bets from backtest period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {result.bets.slice(0, 10).map((bet, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{bet.game}</p>
                    <p className="text-sm text-muted-foreground">{bet.date}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm">Prediction: {(bet.prediction * 100).toFixed(1)}%</p>
                    <p className="text-sm">Stake: ${bet.stake.toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <Badge variant={bet.correct ? "default" : "destructive"}>
                      {bet.correct ? 'WIN' : 'LOSS'}
                    </Badge>
                    <p className={`text-sm font-medium ${bet.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${bet.profit.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}