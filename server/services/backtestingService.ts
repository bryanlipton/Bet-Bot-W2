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
    console.log(`Starting backtest from ${startDate} to ${endDate}...`);
    
    // Get games in chronological order for time-series backtesting
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
      .orderBy(baseballGames.date);
    
    console.log(`Found ${testGames.length} games for backtesting`);
    
    const results: BacktestResult = {
      totalPredictions: 0,
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
    
    // Only use games where we have sufficient prior data (after May 1)
    const backtestGames = testGames.filter(game => 
      new Date(game.date) >= new Date('2024-05-01')
    );
    
    for (const game of backtestGames) {
      try {
        // Make prediction using only data available before this game
        const prediction = await this.makePredictionForBacktest(game);
        
        if (!prediction) continue;
        
        // Determine actual outcome
        const homeWon = (game.homeScore || 0) > (game.awayScore || 0);
        const predictedHomeWin = prediction.homeWinProbability > 0.5;
        const correct = homeWon === predictedHomeWin;
        
        // Calculate edge and betting decision
        const edge = this.calculateEdge(prediction.homeWinProbability, homeWon ? -110 : -110);
        
        // Only bet if we have significant edge (>5%)
        if (Math.abs(edge) > 0.05) {
          const betSize = this.calculateBetSize(currentBankroll, edge, 0.25); // 25% max Kelly
          const odds = homeWon ? -110 : -110; // Simplified odds
          
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
        
        results.totalPredictions++;
        if (correct) results.correctPredictions++;
        
      } catch (error) {
        console.error(`Error in backtest for game ${game.externalId}:`, error);
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
    
    console.log(`Backtest complete: ${results.accuracy * 100}% accuracy, $${results.profitLoss.toFixed(2)} P&L`);
    
    return results;
  }
  
  private async makePredictionForBacktest(game: any) {
    try {
      // Ensure we only use data available before this game date
      const gameDate = new Date(game.date);
      const cutoffDate = new Date(gameDate.getTime() - 24 * 60 * 60 * 1000); // 1 day before
      
      return await baseballAI.predict(
        game.homeTeam, 
        game.awayTeam, 
        cutoffDate.toISOString().split('T')[0]
      );
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