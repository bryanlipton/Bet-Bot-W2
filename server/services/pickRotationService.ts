import { dailyPickService } from "./dailyPickService";

interface GameStatus {
  gameId: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'postponed';
  commence_time: string;
}

export class PickRotationService {
  private checkInterval: NodeJS.Timeout | null = null;
  private dailyResetInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startGameStatusMonitoring();
    this.scheduleDailyReset();
  }

  private startGameStatusMonitoring() {
    // Check game status every 30 minutes for grading completed games
    this.checkInterval = setInterval(async () => {
      await this.checkAndRotatePicks();
    }, 30 * 60 * 1000);

    console.log('🔍 Pick grading monitoring started - checking every 30 minutes for completed games');
  }

  private scheduleDailyReset() {
    // Calculate time until next 2 AM EST
    const scheduleNext2AM = () => {
      const now = new Date();
      const tomorrow2AM = new Date();
      
      // Convert to EST (UTC-5, or UTC-4 during DST)
      const estOffset = this.getESTOffset();
      tomorrow2AM.setUTCHours(2 + estOffset, 0, 0, 0);
      
      // If 2 AM today has passed, schedule for tomorrow
      if (now > tomorrow2AM) {
        tomorrow2AM.setUTCDate(tomorrow2AM.getUTCDate() + 1);
      }

      const msUntil2AM = tomorrow2AM.getTime() - now.getTime();
      
      console.log(`⏰ Next daily pick generation scheduled for: ${tomorrow2AM.toLocaleString('en-US', { timeZone: 'America/New_York' })} EST`);

      this.dailyResetInterval = setTimeout(async () => {
        await this.generateNewDailyPicks();
        scheduleNext2AM(); // Schedule the next one
      }, msUntil2AM);
    };

    scheduleNext2AM();
  }

  private getESTOffset(): number {
    // Simple DST check - EST is UTC-5, EDT is UTC-4
    const now = new Date();
    const year = now.getFullYear();
    
    // DST starts second Sunday in March, ends first Sunday in November
    const dstStart = new Date(year, 2, 8); // March 8
    dstStart.setDate(dstStart.getDate() + (7 - dstStart.getDay())); // Second Sunday
    
    const dstEnd = new Date(year, 10, 1); // November 1
    dstEnd.setDate(dstEnd.getDate() + (7 - dstEnd.getDay())); // First Sunday
    
    const isDST = now >= dstStart && now < dstEnd;
    return isDST ? 4 : 5; // EDT = UTC-4, EST = UTC-5
  }

  private async checkAndRotatePicks() {
    try {
      console.log('🔍 Checking pick status for grading and live updates...');
      
      // Get current daily pick and lock pick
      const currentDailyPick = await dailyPickService.getTodaysPick();
      const currentLockPick = await dailyPickService.getTodaysLockPick();

      // Check for games that have completed and need grading
      if (currentDailyPick) {
        const gameStatus = await this.getGameStatus(currentDailyPick.gameId);
        if (gameStatus && gameStatus.status === 'completed') {
          console.log(`✅ Daily pick game ${currentDailyPick.gameId} completed - checking for grading`);
          await this.gradeCompletedPick(currentDailyPick, 'daily');
        }
      }

      if (currentLockPick) {
        const gameStatus = await this.getGameStatus(currentLockPick.gameId);
        if (gameStatus && gameStatus.status === 'completed') {
          console.log(`✅ Lock pick game ${currentLockPick.gameId} completed - checking for grading`);
          await this.gradeCompletedPick(currentLockPick, 'lock');
        }
      }

      // Note: Picks now stay visible for full 24-hour cycle regardless of game status
      // No more automatic replacement when games go live

    } catch (error) {
      console.error('❌ Error checking pick status:', error);
    }
  }

  private async gradeCompletedPick(pick: any, pickType: 'daily' | 'lock') {
    try {
      // Get game result to grade the pick
      const gameResult = await this.getGameResult(pick.gameId);
      if (!gameResult) {
        console.log(`⚠️ Game result not available for ${pick.gameId}`);
        return;
      }

      // Determine if pick won or lost
      const pickWon = gameResult.winner === pick.pickTeam;
      const result = pickWon ? 'won' : 'lost';

      console.log(`📊 Grading ${pickType} pick: ${pick.pickTeam} ${result} (${gameResult.homeScore}-${gameResult.awayScore})`);

      // Update pick status in database and push to feed
      await dailyPickService.gradeAndPushToFeed(pick, result, gameResult);

    } catch (error) {
      console.error(`❌ Error grading ${pickType} pick:`, error);
    }
  }

  private async getGameResult(gameId: string): Promise<{
    winner: string;
    homeScore: number;
    awayScore: number;
    homeTeam: string;
    awayTeam: string;
  } | null> {
    try {
      // Get completed game data from MLB scores API
      const response = await fetch(`http://localhost:5000/api/mlb/scores/${new Date().toISOString().split('T')[0]}`);
      const games = await response.json();
      
      const game = games.find((g: any) => 
        g.gameId?.toString() === gameId || 
        g.id === gameId
      );
      
      if (!game || game.status !== 'completed') {
        return null;
      }

      const homeScore = parseInt(game.homeScore || game.home_score || '0');
      const awayScore = parseInt(game.awayScore || game.away_score || '0');
      const winner = homeScore > awayScore ? game.homeTeam || game.home_team : game.awayTeam || game.away_team;

      return {
        winner,
        homeScore,
        awayScore,
        homeTeam: game.homeTeam || game.home_team,
        awayTeam: game.awayTeam || game.away_team
      };

    } catch (error) {
      console.error(`❌ Error getting game result for ${gameId}:`, error);
      return null;
    }
  }

  private async getGameStatus(gameId: string): Promise<GameStatus | null> {
    try {
      // Get game status from MLB API or odds API
      const response = await fetch(`http://localhost:5000/api/mlb/complete-schedule`);
      const games = await response.json();
      
      const game = games.find((g: any) => g.id === gameId || g.gameId === gameId);
      if (!game) return null;

      const gameTime = new Date(game.commence_time);
      const now = new Date();
      
      let status: GameStatus['status'] = 'scheduled';
      
      // If game time has passed, consider it started
      if (now > gameTime) {
        // Check if it's been more than 4 hours (typical game length)
        const hoursSinceStart = (now.getTime() - gameTime.getTime()) / (1000 * 60 * 60);
        status = hoursSinceStart > 4 ? 'completed' : 'in_progress';
      }

      return {
        gameId: game.id || game.gameId,
        status,
        commence_time: game.commence_time
      };
    } catch (error) {
      console.error('Error fetching game status:', error);
      return null;
    }
  }

  private async generateNewDailyPicks() {
    try {
      console.log('🆕 Generating new daily picks...');
      
      // Get today's games
      const response = await fetch('http://localhost:5000/api/mlb/complete-schedule');
      const games = await response.json();
      
      // Filter for upcoming games with odds
      const now = new Date();
      const upcomingGames = games.filter((game: any) => {
        const gameDate = new Date(game.commence_time);
        const hoursDiff = (gameDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        return hoursDiff > 1 && hoursDiff <= 72 && game.hasOdds; // Games 1+ hours from now, within 3 days
      });

      if (upcomingGames.length === 0) {
        console.log('⚠️ No upcoming games with odds available for new picks');
        return;
      }

      // Generate new daily pick
      const newDailyPick = await dailyPickService.generateDailyPick(upcomingGames);
      if (newDailyPick) {
        await dailyPickService.saveDailyPick(newDailyPick);
        console.log(`✅ New daily pick generated: ${newDailyPick.pickTeam} vs ${newDailyPick.awayTeam === newDailyPick.pickTeam ? newDailyPick.homeTeam : newDailyPick.awayTeam}`);
      }

      // Generate new lock pick (exclude daily pick game and opponent teams)
      const lockGames = upcomingGames.filter((game: any) => {
        if (!newDailyPick) return true;
        
        // Exclude same game ID
        if (game.id === newDailyPick.gameId || game.gameId === newDailyPick.gameId) {
          return false;
        }
        
        // CRITICAL: Exclude games where teams are playing against each other
        const gameTeams = [game.home_team, game.away_team, game.homeTeam, game.awayTeam].filter(Boolean);
        const dailyPickTeams = [newDailyPick.homeTeam, newDailyPick.awayTeam].filter(Boolean);
        
        // Check if any team from the current game matches any team from the daily pick game
        const hasCommonTeam = gameTeams.some(team => dailyPickTeams.includes(team));
        if (hasCommonTeam) {
          console.log(`🚫 Rotation: Excluding game ${game.home_team || game.homeTeam} vs ${game.away_team || game.awayTeam} - teams playing against daily pick teams`);
          return false;
        }
        
        return true;
      });
      
      if (lockGames.length > 0) {
        const newLockPick = await dailyPickService.generateLockPick(lockGames);
        if (newLockPick) {
          await dailyPickService.saveLockPick(newLockPick);
          console.log(`✅ New lock pick generated: ${newLockPick.pickTeam} vs ${newLockPick.awayTeam === newLockPick.pickTeam ? newLockPick.homeTeam : newLockPick.awayTeam}`);
        }
      }

      // Notify WebSocket clients of new picks
      this.notifyPickRotation();

    } catch (error) {
      console.error('❌ Error generating new daily picks:', error);
    }
  }

  private notifyPickRotation() {
    // This would integrate with the WebSocket service to notify clients
    // For now, we'll add a simple log
    console.log('📡 Notifying clients of new pick rotation');
  }

  public async manualRotation(): Promise<void> {
    console.log('🔧 Manual pick rotation triggered');
    await this.generateNewDailyPicks();
  }

  public stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    if (this.dailyResetInterval) {
      clearTimeout(this.dailyResetInterval);
      this.dailyResetInterval = null;
    }
    console.log('🛑 Pick rotation service stopped');
  }
}

export const pickRotationService = new PickRotationService();