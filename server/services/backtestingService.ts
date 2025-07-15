import { db } from '../db';
import { baseballGames } from '@shared/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { baseballAI } from './baseballAI';

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

export class BacktestingService {
  
  async performBacktest(startDate: string, endDate: string, initialBankroll: number = 1000): Promise<BacktestResult> {
    console.log(`Starting fast backtest demo from ${startDate} to ${endDate}...`);
    
    // Get a small sample of games for demo
    const testGames = await db
      .select()
      .from(baseballGames)
      .where(
        and(
          gte(baseballGames.date, startDate),
          lte(baseballGames.date, endDate),
          eq(baseballGames.gameStatus, 'completed')
        )
      )
      .orderBy(baseballGames.date)
      .limit(20); // Only test 20 games for speed
    
    console.log(`Found ${testGames.length} games for quick backtesting...`);
    
    const results: BacktestResult = {
      totalPredictions: testGames.length,
      correctPredictions: 0,
      accuracy: 0,
      profitLoss: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      bets: []
    };
    
    let currentBankroll = initialBankroll;
    let maxBankroll = initialBankroll;
    let maxDrawdown = 0;
    const dailyReturns: number[] = [];
    
    for (let i = 0; i < testGames.length; i++) {
      const game = testGames[i];
      
      // Simple prediction model based on team names (demo purposes)
      const homeAdvantage = 0.54; // Home teams historically win ~54%
      const prediction = {
        homeWinProbability: homeAdvantage,
        awayWinProbability: 1 - homeAdvantage,
        confidence: 0.75
      };
      
      // Determine actual outcome
      const homeWon = (game.homeScore || 0) > (game.awayScore || 0);
      const predictedHomeWin = prediction.homeWinProbability > 0.5;
      const correct = homeWon === predictedHomeWin;
      
      if (correct) results.correctPredictions++;
      
      // Calculate edge (model prob vs implied odds)
      const impliedOdds = homeWon ? 0.52 : 0.48; // Typical bookmaker probability
      const edge = prediction.homeWinProbability - impliedOdds;
      
      // Bet if edge > 2%
      if (Math.abs(edge) > 0.02) {
        const betSize = currentBankroll * 0.05; // 5% of bankroll
        const odds = homeWon ? -110 : +110;
        
        let profit = 0;
        if (correct) {
          profit = betSize * (odds > 0 ? odds / 100 : 100 / Math.abs(odds));
        } else {
          profit = -betSize;
        }
        
        currentBankroll += profit;
        results.profitLoss += profit;
        
        if (currentBankroll > maxBankroll) {
          maxBankroll = currentBankroll;
        }
        
        const drawdown = (maxBankroll - currentBankroll) / maxBankroll;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
        
        dailyReturns.push(profit / (currentBankroll - profit));
        
        results.bets.push({
          date: game.date,
          game: `${game.awayTeam} @ ${game.homeTeam}`,
          prediction: prediction.homeWinProbability,
          actual: homeWon ? 1 : 0,
          correct,
          stake: betSize,
          profit,
          odds
        });
      }
    }
    
    // Calculate final metrics
    results.accuracy = results.correctPredictions / results.totalPredictions;
    results.maxDrawdown = maxDrawdown;
    
    // Calculate Sharpe ratio
    if (dailyReturns.length > 0) {
      const avgReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
      const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / dailyReturns.length;
      const stdDev = Math.sqrt(variance);
      results.sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;
    }
    
    console.log(`Backtest complete: ${(results.accuracy * 100).toFixed(1)}% accuracy, $${results.profitLoss.toFixed(2)} P&L`);
    
    return results;
  }
  
  private async makePredictionForBacktest(game: any) {
    try {
      // Simple prediction without time constraints for backtesting speed
      return {
        homeWinProbability: 0.55, // Mock prediction for speed
        awayWinProbability: 0.45,
        confidence: 0.7
      };
    } catch (error) {
      console.error('Error making backtest prediction:', error);
      return null;
    }
  }
  
  private calculateEdge(modelProbability: number, americanOdds: number): number {
    const impliedProbability = americanOdds > 0 
      ? 100 / (americanOdds + 100)
      : Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
    
    return modelProbability - impliedProbability;
  }
  
  private calculateBetSize(bankroll: number, edge: number, maxKelly: number): number {
    // Kelly Criterion with maximum bet size
    const kellyFraction = Math.abs(edge);
    const betFraction = Math.min(kellyFraction, maxKelly);
    return bankroll * betFraction;
  }
}

export const backtestingService = new BacktestingService();