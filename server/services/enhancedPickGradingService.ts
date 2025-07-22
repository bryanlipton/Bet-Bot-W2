import { db } from "../db";
import { userPicks } from "@shared/schema";
import { eq, and, sql, gte, lte } from "drizzle-orm";

interface GameStatus {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: 'scheduled' | 'live' | 'completed' | 'postponed';
  inning?: string;
  lastUpdated: Date;
}

export class EnhancedPickGradingService {

  /**
   * Get real-time game statuses from MLB API
   */
  async getGameStatuses(startDate: string, endDate?: string): Promise<GameStatus[]> {
    try {
      const end = endDate || startDate;
      const response = await fetch(
        `https://statsapi.mlb.com/api/v1/schedule?sportId=1&startDate=${startDate}&endDate=${end}&hydrate=linescore,team,game(status)`
      );

      if (!response.ok) {
        console.log(`MLB API error: ${response.status}`);
        return [];
      }

      const data = await response.json();
      const gameStatuses: GameStatus[] = [];

      for (const dateObj of data.dates || []) {
        for (const game of dateObj.games || []) {
          const status = this.determineGameStatus(game);
          const linescore = game.linescore;
          
          gameStatuses.push({
            gameId: `mlb_${game.gamePk}`,
            homeTeam: game.teams.home?.team?.name || '',
            awayTeam: game.teams.away?.team?.name || '',
            homeScore: linescore?.teams?.home?.runs || 0,
            awayScore: linescore?.teams?.away?.runs || 0,
            status,
            inning: game.linescore?.currentInningOrdinal || null,
            lastUpdated: new Date()
          });
        }
      }

      return gameStatuses;
    } catch (error) {
      console.error('Error fetching game statuses:', error);
      return [];
    }
  }

  /**
   * Determine game status from MLB API response
   */
  private determineGameStatus(game: any): 'scheduled' | 'live' | 'completed' | 'postponed' {
    const status = game.status;
    
    if (!status) return 'scheduled';
    
    // Completed game statuses
    if (status.statusCode === 'F' || status.detailedState === 'Final') {
      return 'completed';
    }
    
    // Live game statuses
    if (status.statusCode === 'I' || status.detailedState?.includes('In Progress') || 
        status.detailedState?.includes('inning') || status.abstractGameState === 'Live') {
      return 'live';
    }
    
    // Postponed/delayed statuses
    if (status.detailedState?.includes('Postponed') || status.detailedState?.includes('Delayed')) {
      return 'postponed';
    }
    
    // Default to scheduled
    return 'scheduled';
  }

  /**
   * Grade a pick based on game result
   */
  private gradePick(pick: any, gameStatus: GameStatus): { status: string; winAmount: number; result: string } | null {
    // Only grade completed games
    if (gameStatus.status !== 'completed') {
      return null;
    }

    const homeWon = gameStatus.homeScore > gameStatus.awayScore;
    const tie = gameStatus.homeScore === gameStatus.awayScore;
    
    // Handle ties (rare but possible)
    if (tie) {
      return {
        status: 'push',
        winAmount: 0,
        result: `${gameStatus.awayTeam} ${gameStatus.awayScore} - ${gameStatus.homeScore} ${gameStatus.homeTeam} (Tie)`
      };
    }

    let won = false;
    
    // Check moneyline win condition
    if (pick.market.toLowerCase() === 'moneyline') {
      if ((pick.selection === gameStatus.homeTeam && homeWon) || 
          (pick.selection === gameStatus.awayTeam && !homeWon)) {
        won = true;
      }
    }
    
    const result = `${gameStatus.awayTeam} ${gameStatus.awayScore} - ${gameStatus.homeScore} ${gameStatus.homeTeam}`;
    
    if (won) {
      const odds = pick.odds || 0;
      const units = pick.units || 1;
      const winAmount = this.calculateWinAmount(odds, units);
      return { status: 'win', winAmount, result };
    } else {
      const units = pick.units || 1;
      return { status: 'loss', winAmount: -units, result };
    }
  }

  /**
   * Calculate win amount from American odds
   */
  private calculateWinAmount(americanOdds: number, units: number): number {
    if (americanOdds > 0) {
      return (americanOdds / 100) * units;
    } else {
      return (100 / Math.abs(americanOdds)) * units;
    }
  }

  /**
   * Grade all pending picks with real-time game data
   */
  async gradeAllPendingPicks(): Promise<{ graded: number; updated: number }> {
    try {
      console.log('🔄 Enhanced pick grading: Fetching all pending picks...');
      
      // Get all pending picks from last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const pendingPicks = await db
        .select()
        .from(userPicks)
        .where(
          and(
            eq(userPicks.status, 'pending'),
            gte(userPicks.gameDate, sevenDaysAgo)
          )
        );
      
      if (pendingPicks.length === 0) {
        console.log('No pending picks found to grade');
        return { graded: 0, updated: 0 };
      }

      console.log(`Found ${pendingPicks.length} pending picks to check`);

      // Get unique dates for API efficiency
      const uniqueDates = [...new Set(pendingPicks.map(pick => {
        const gameDate = new Date(pick.gameDate!);
        return gameDate.toISOString().split('T')[0];
      }))];

      // Fetch game statuses for all relevant dates
      let allGameStatuses: GameStatus[] = [];
      for (const date of uniqueDates) {
        const gameStatuses = await this.getGameStatuses(date);
        allGameStatuses = [...allGameStatuses, ...gameStatuses];
        
        // Small delay to be nice to MLB API
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`Fetched statuses for ${allGameStatuses.length} games`);

      let gradedCount = 0;
      let updatedCount = 0;

      // Process each pending pick
      for (const pick of pendingPicks) {
        // Find matching game status
        const gameStatus = allGameStatuses.find(game => 
          game.gameId === pick.gameId ||
          (game.homeTeam === pick.homeTeam && game.awayTeam === pick.awayTeam) ||
          (game.homeTeam === pick.game?.split(' @ ')[1] && 
           game.awayTeam === pick.game?.split(' @ ')[0])
        );

        if (gameStatus) {
          if (gameStatus.status === 'completed') {
            // Grade completed games
            const grading = this.gradePick(pick, gameStatus);
            
            if (grading) {
              await db
                .update(userPicks)
                .set({
                  status: grading.status,
                  winAmount: grading.winAmount,
                  result: grading.result,
                  gradedAt: new Date()
                })
                .where(eq(userPicks.id, pick.id));
              
              console.log(`✅ Graded pick ${pick.id}: ${pick.selection} - ${grading.status} (${grading.winAmount} units)`);
              gradedCount++;
            }
          } else if (gameStatus.status === 'live') {
            // Update live game information if needed
            console.log(`🔴 LIVE: ${pick.selection} in ${pick.game} (${gameStatus.inning || 'In Progress'})`);
            updatedCount++;
          }
        } else {
          console.log(`⚠️ No game status found for pick: ${pick.game}`);
        }
      }

      console.log(`✅ Enhanced grading complete: ${gradedCount} picks graded, ${updatedCount} live games found`);
      return { graded: gradedCount, updated: updatedCount };

    } catch (error) {
      console.error('Error in enhanced pick grading:', error);
      return { graded: 0, updated: 0 };
    }
  }

  /**
   * Get live updates for user's picks (for real-time UI updates)
   */
  async getUserPickUpdates(userId: string): Promise<{ pickId: number; status: string; liveInfo?: string }[]> {
    try {
      const pendingPicks = await db
        .select()
        .from(userPicks)
        .where(
          and(
            eq(userPicks.userId, userId),
            eq(userPicks.status, 'pending'),
            gte(userPicks.gameDate, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // Last 7 days
          )
        );

      const updates: { pickId: number; status: string; liveInfo?: string }[] = [];

      // Get today's and recent game statuses
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const gameStatuses = await this.getGameStatuses(yesterdayStr, today);

      for (const pick of pendingPicks) {
        const gameStatus = gameStatuses.find(game => 
          game.gameId === pick.gameId ||
          (game.homeTeam === pick.homeTeam && game.awayTeam === pick.awayTeam)
        );

        if (gameStatus) {
          if (gameStatus.status === 'live') {
            updates.push({
              pickId: pick.id,
              status: 'live',
              liveInfo: `${gameStatus.inning || 'In Progress'} - ${gameStatus.awayTeam} ${gameStatus.awayScore}, ${gameStatus.homeTeam} ${gameStatus.homeScore}`
            });
          } else if (gameStatus.status === 'completed') {
            updates.push({
              pickId: pick.id,
              status: 'ready_to_grade'
            });
          }
        }
      }

      return updates;

    } catch (error) {
      console.error('Error getting user pick updates:', error);
      return [];
    }
  }

  /**
   * Manual grade specific pick (for testing and admin use)
   */
  async manualGradePick(pickId: number): Promise<{ success: boolean; message: string; result?: any }> {
    try {
      const pick = await db
        .select()
        .from(userPicks)
        .where(eq(userPicks.id, pickId))
        .then(results => results[0]);

      if (!pick) {
        return { success: false, message: 'Pick not found' };
      }

      if (pick.status !== 'pending') {
        return { success: false, message: `Pick already graded: ${pick.status}` };
      }

      // Get game status
      const gameDate = new Date(pick.gameDate!).toISOString().split('T')[0];
      const gameStatuses = await this.getGameStatuses(gameDate);
      
      const gameStatus = gameStatuses.find(game => 
        game.gameId === pick.gameId ||
        (game.homeTeam === pick.homeTeam && game.awayTeam === pick.awayTeam) ||
        (game.homeTeam === pick.game?.split(' @ ')[1] && 
         game.awayTeam === pick.game?.split(' @ ')[0])
      );

      if (!gameStatus) {
        return { success: false, message: 'Game status not found' };
      }

      if (gameStatus.status !== 'completed') {
        return { success: false, message: `Game not completed yet. Status: ${gameStatus.status}` };
      }

      const grading = this.gradePick(pick, gameStatus);
      
      if (!grading) {
        return { success: false, message: 'Unable to grade pick' };
      }

      // Update the pick
      await db
        .update(userPicks)
        .set({
          status: grading.status,
          winAmount: grading.winAmount,
          result: grading.result,
          gradedAt: new Date()
        })
        .where(eq(userPicks.id, pickId));

      return { 
        success: true, 
        message: `Pick graded successfully: ${grading.status}`,
        result: grading
      };

    } catch (error) {
      console.error('Error manually grading pick:', error);
      return { success: false, message: 'Error grading pick' };
    }
  }
}

export const enhancedPickGradingService = new EnhancedPickGradingService();