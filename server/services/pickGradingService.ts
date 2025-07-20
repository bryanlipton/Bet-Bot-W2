import { db } from "../db";
import { userPicks, baseballGames } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

interface GameResult {
  gameId: string;
  homeScore: number;
  awayScore: number;
  homeTeam: string;
  awayTeam: string;
  status: 'completed' | 'final';
}

export class PickGradingService {
  
  /**
   * Fetch completed game results from MLB Stats API
   */
  async fetchCompletedGameResults(date: string): Promise<GameResult[]> {
    try {
      const response = await fetch(
        `https://statsapi.mlb.com/api/v1/schedule?sportId=1&startDate=${date}&endDate=${date}&hydrate=linescore,team`
      );
      
      if (!response.ok) {
        throw new Error(`MLB API responded with ${response.status}`);
      }
      
      const data = await response.json();
      const games: GameResult[] = [];
      
      for (const date_obj of data.dates || []) {
        for (const game of date_obj.games || []) {
          // Only process completed games
          if (game.status?.statusCode === 'F' || game.status?.detailedState === 'Final') {
            const linescore = game.linescore;
            if (linescore && linescore.teams) {
              games.push({
                gameId: `mlb_${game.gamePk}`,
                homeScore: linescore.teams.home?.runs || 0,
                awayScore: linescore.teams.away?.runs || 0,
                homeTeam: game.teams.home?.team?.name || '',
                awayTeam: game.teams.away?.team?.name || '',
                status: 'completed'
              });
            }
          }
        }
      }
      
      console.log(`Found ${games.length} completed games for ${date}`);
      return games;
    } catch (error) {
      console.error(`Error fetching completed games for ${date}:`, error);
      return [];
    }
  }

  /**
   * Grade a moneyline pick based on game result
   */
  private gradeMoneylinePick(pick: any, gameResult: GameResult): { status: string; winAmount: number } {
    const homeWon = gameResult.homeScore > gameResult.awayScore;
    const awayWon = gameResult.awayScore > gameResult.homeScore;
    const tie = gameResult.homeScore === gameResult.awayScore;
    
    // Handle tie games (rare in baseball but possible)
    if (tie) {
      return { status: 'push', winAmount: 0 };
    }
    
    let won = false;
    
    // Check if the pick was correct
    if (pick.selection === gameResult.homeTeam && homeWon) {
      won = true;
    } else if (pick.selection === gameResult.awayTeam && awayWon) {
      won = true;
    }
    
    if (won) {
      // Calculate winnings based on American odds
      const odds = pick.odds || 0;
      const units = pick.units || 1;
      const winAmount = this.calculateWinAmount(odds, units);
      return { status: 'win', winAmount };
    } else {
      const units = pick.units || 1;
      return { status: 'loss', winAmount: -units };
    }
  }

  /**
   * Grade a spread pick based on game result
   */
  private gradeSpreadPick(pick: any, gameResult: GameResult): { status: string; winAmount: number } {
    if (!pick.line) {
      return { status: 'void', winAmount: 0 };
    }
    
    const spread = parseFloat(pick.line);
    const homeScore = gameResult.homeScore;
    const awayScore = gameResult.awayScore;
    
    let adjustedHomeScore = homeScore + spread;
    let won = false;
    
    // Determine if pick won based on selection and spread
    if (pick.selection === gameResult.homeTeam) {
      // Betting on home team with spread
      won = adjustedHomeScore > awayScore;
    } else if (pick.selection === gameResult.awayTeam) {
      // Betting on away team (reverse spread)
      won = awayScore > (homeScore - spread);
    }
    
    // Check for push (exact spread)
    if (Math.abs(adjustedHomeScore - awayScore) < 0.01) {
      return { status: 'push', winAmount: 0 };
    }
    
    if (won) {
      const odds = pick.odds || -110; // Standard spread odds
      const units = pick.units || 1;
      const winAmount = this.calculateWinAmount(odds, units);
      return { status: 'win', winAmount };
    } else {
      return { status: 'loss', winAmount: -(pick.units || 1) };
    }
  }

  /**
   * Grade a total (over/under) pick based on game result
   */
  private gradeTotalPick(pick: any, gameResult: GameResult): { status: string; winAmount: number } {
    if (!pick.line) {
      return { status: 'void', winAmount: 0 };
    }
    
    const totalLine = parseFloat(pick.line);
    const actualTotal = gameResult.homeScore + gameResult.awayScore;
    
    let won = false;
    
    if (pick.selection.toLowerCase().includes('over')) {
      won = actualTotal > totalLine;
    } else if (pick.selection.toLowerCase().includes('under')) {
      won = actualTotal < totalLine;
    }
    
    // Check for push (exact total)
    if (Math.abs(actualTotal - totalLine) < 0.01) {
      return { status: 'push', winAmount: 0 };
    }
    
    if (won) {
      const odds = pick.odds || -110; // Standard total odds
      const units = pick.units || 1;
      const winAmount = this.calculateWinAmount(odds, units);
      return { status: 'win', winAmount };
    } else {
      return { status: 'loss', winAmount: -(pick.units || 1) };
    }
  }

  /**
   * Calculate win amount based on American odds and units
   */
  private calculateWinAmount(americanOdds: number, units: number): number {
    if (americanOdds > 0) {
      // Positive odds: +150 means win $150 on $100 bet
      return (americanOdds / 100) * units;
    } else {
      // Negative odds: -150 means bet $150 to win $100
      return (100 / Math.abs(americanOdds)) * units;
    }
  }

  /**
   * Grade a single pick against game result
   */
  gradePick(pick: any, gameResult: GameResult): { status: string; winAmount: number; result: string } {
    let grading;
    
    switch (pick.market.toLowerCase()) {
      case 'moneyline':
        grading = this.gradeMoneylinePick(pick, gameResult);
        break;
      case 'spread':
        grading = this.gradeSpreadPick(pick, gameResult);
        break;
      case 'total':
      case 'over':
      case 'under':
        grading = this.gradeTotalPick(pick, gameResult);
        break;
      default:
        console.warn(`Unknown market type for grading: ${pick.market}`);
        return { status: 'void', winAmount: 0, result: 'Unknown market type' };
    }
    
    const result = `${gameResult.awayTeam} ${gameResult.awayScore} - ${gameResult.homeScore} ${gameResult.homeTeam}`;
    
    return {
      ...grading,
      result
    };
  }

  /**
   * Grade all pending picks for completed games on a given date
   */
  async gradePendingPicks(date: string): Promise<number> {
    try {
      console.log(`Starting pick grading for date: ${date}`);
      
      // Fetch completed game results
      const completedGames = await this.fetchCompletedGameResults(date);
      
      if (completedGames.length === 0) {
        console.log(`No completed games found for ${date}`);
        return 0;
      }
      
      // Get all pending picks that match completed games
      const pendingPicks = await db
        .select()
        .from(userPicks)
        .where(
          and(
            eq(userPicks.status, 'pending'),
            sql`DATE(game_date) = ${date}`
          )
        );
      
      console.log(`Found ${pendingPicks.length} pending picks to grade`);
      
      let gradedCount = 0;
      
      for (const pick of pendingPicks) {
        // Find matching game result - handle both string and numeric game IDs
        const gameResult = completedGames.find(game => 
          game.gameId.toString() === pick.gameId ||
          game.gameId.toString() === pick.gameId?.replace('mlb_', '') ||
          (game.homeTeam === pick.homeTeam && game.awayTeam === pick.awayTeam) ||
          (game.homeTeam === pick.game?.split(' @ ')[1] && 
           game.awayTeam === pick.game?.split(' @ ')[0])
        );
        
        if (gameResult) {
          console.log(`Grading pick: ${pick.selection} on ${pick.game}`);
          
          // Grade the pick
          const grading = this.gradePick(pick, gameResult);
          
          // Update pick in database
          await db
            .update(userPicks)
            .set({
              status: grading.status,
              winAmount: grading.winAmount,
              result: grading.result,
              gradedAt: new Date()
            })
            .where(eq(userPicks.id, pick.id));
          
          console.log(`Pick graded: ${grading.status} (${grading.winAmount} units)`);
          gradedCount++;
        }
      }
      
      console.log(`Graded ${gradedCount} picks for ${date}`);
      return gradedCount;
      
    } catch (error) {
      console.error(`Error grading picks for ${date}:`, error);
      return 0;
    }
  }

  /**
   * Auto-grade picks for yesterday's completed games
   */
  async autoGradeYesterdaysPicks(): Promise<number> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    
    return this.gradePendingPicks(dateStr);
  }

  /**
   * Grade picks for multiple days (useful for backfilling)
   */
  async gradePicksForDateRange(startDate: string, endDate: string): Promise<number> {
    let totalGraded = 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      const graded = await this.gradePendingPicks(dateStr);
      totalGraded += graded;
      
      // Add small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return totalGraded;
  }
}

// Export singleton instance
export const pickGradingService = new PickGradingService();