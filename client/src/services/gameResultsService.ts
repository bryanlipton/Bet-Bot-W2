// client/src/services/gameResultsService.ts
import { supabase } from '@/lib/supabase';

interface GameResult {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: 'final' | 'in_progress' | 'scheduled';
  winner: 'home' | 'away' | 'tie';
}

export class GameResultsService {
  // Fetch game results from your existing MLB/NFL/NBA scores APIs
  static async fetchGameResults(sport: string = 'MLB'): Promise<GameResult[]> {
    try {
      // Determine the API endpoint based on sport
      let endpoint = '/api/mlb/scores';
      if (sport.toUpperCase() === 'NFL') {
        endpoint = '/api/nfl/scores';
      } else if (sport.toUpperCase() === 'NBA') {
        endpoint = '/api/nba/scores';
      }
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        console.error('Failed to fetch game results');
        return [];
      }
      
      const data = await response.json();
      
      // Get all games (combining finished and live games)
      const allGames = [...(data.finishedGames || []), ...(data.liveGames || [])];
      
      // Transform your MLB API response to our GameResult format
      return allGames.map((game: any) => {
        const homeScore = parseInt(game.homeScore || 0);
        const awayScore = parseInt(game.awayScore || 0);
        const isFinished = game.status?.toLowerCase().includes('final') || 
                          game.abstractGameState?.toLowerCase() === 'final';
        
        return {
          gameId: game.gameId?.toString() || game.id,
          homeTeam: game.homeTeam,
          awayTeam: game.awayTeam,
          homeScore: homeScore,
          awayScore: awayScore,
          status: isFinished ? 'final' : 'in_progress',
          winner: isFinished ? this.determineWinner(homeScore, awayScore) : 'tie'
        };
      });
    } catch (error) {
      console.error('Error fetching game results:', error);
      return [];
    }
  }
  
  // Fetch results using The-Odds-API if you prefer
  static async fetchGameResultsFromOddsAPI(sport: string = 'baseball_mlb'): Promise<GameResult[]> {
    try {
      // Call your odds API endpoint that fetches scores
      const response = await fetch(`/api/odds-scores?sport=${sport}`);
      
      if (!response.ok) {
        console.error('Failed to fetch game results from Odds API');
        return [];
      }
      
      const data = await response.json();
      
      // Transform The-Odds-API response format
      return data.map((game: any) => {
        const homeScore = game.scores?.find((s: any) => s.name === game.home_team)?.score || 0;
        const awayScore = game.scores?.find((s: any) => s.name === game.away_team)?.score || 0;
        
        return {
          gameId: game.id,
          homeTeam: game.home_team,
          awayTeam: game.away_team,
          homeScore: parseInt(homeScore),
          awayScore: parseInt(awayScore),
          status: game.completed ? 'final' : 'in_progress',
          winner: this.determineWinner(homeScore, awayScore)
        };
      });
    } catch (error) {
      console.error('Error fetching from Odds API:', error);
      return [];
    }
  }
  
  // Determine the winner based on scores
  static determineWinner(homeScore: number, awayScore: number): 'home' | 'away' | 'tie' {
    if (homeScore > awayScore) return 'home';
    if (awayScore > homeScore) return 'away';
    return 'tie';
  }
  
  // Grade all pending picks
  static async gradeAllPendingPicks() {
    try {
      console.log('Starting pick grading process...');
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, message: 'Not authenticated' };
      
      // Fetch all pending picks for the user
      const { data: pendingPicks, error: picksError } = await supabase
        .from('picks')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending');
      
      if (picksError || !pendingPicks) {
        console.error('Error fetching pending picks:', picksError);
        return { success: false, error: picksError };
      }
      
      if (pendingPicks.length === 0) {
        console.log('No pending picks to grade');
        return { success: true, message: 'No pending picks', gradedCount: 0 };
      }
      
      console.log(`Found ${pendingPicks.length} pending picks to grade`);
      
      // Get unique sports from picks
      const sports = [...new Set(pendingPicks.map(p => p.game_info?.sport || 'MLB'))];
      
      // Fetch game results for each sport
      let allResults: GameResult[] = [];
      for (const sport of sports) {
        const results = await this.fetchGameResults(sport);
        allResults = [...allResults, ...results];
      }
      
      // Grade each pick
      let gradedCount = 0;
      for (const pick of pendingPicks) {
        const gradeResult = await this.gradeSinglePick(pick, allResults);
        if (gradeResult.graded) {
          gradedCount++;
        }
      }
      
      console.log(`Graded ${gradedCount} out of ${pendingPicks.length} picks`);
      
      // Update user stats after grading
      if (gradedCount > 0) {
        await this.updateUserStats(user.id);
      }
      
      return { 
        success: true, 
        message: `Graded ${gradedCount} picks`,
        gradedCount,
        totalPicks: pendingPicks.length 
      };
    } catch (error) {
      console.error('Error in grading process:', error);
      return { success: false, error };
    }
  }
  
  // Grade a single pick
  static async gradeSinglePick(pick: any, gameResults: GameResult[]) {
    try {
      const gameInfo = pick.game_info || {};
      const betInfo = pick.bet_info || {};
      
      // Find the game result - match by gameId or by teams
      const gameResult = gameResults.find(r => {
        // First try to match by gameId
        if (r.gameId === gameInfo.gameId || r.gameId === pick.gameId) {
          return true;
        }
        // Then try to match by teams
        return r.homeTeam === gameInfo.homeTeam && r.awayTeam === gameInfo.awayTeam;
      });
      
      if (!gameResult || gameResult.status !== 'final') {
        return { graded: false, reason: 'Game not finished' };
      }
      
      // Determine if the pick won
      let pickResult: 'won' | 'lost' | 'push' = 'lost';
      
      if (betInfo.market === 'moneyline') {
        // For moneyline bets
        const pickedTeam = betInfo.selection;
        const isHomeTeam = pickedTeam === gameInfo.homeTeam;
        
        if (gameResult.winner === 'tie') {
          pickResult = 'push';
        } else if (
          (isHomeTeam && gameResult.winner === 'home') ||
          (!isHomeTeam && gameResult.winner === 'away')
        ) {
          pickResult = 'won';
        } else {
          pickResult = 'lost';
        }
      } else if (betInfo.market === 'spread') {
        // For spread bets
        const spread = parseFloat(betInfo.line || '0');
        const pickedTeam = betInfo.selection;
        const isHomeTeam = pickedTeam === gameInfo.homeTeam;
        
        let adjustedScore;
        if (isHomeTeam) {
          adjustedScore = gameResult.homeScore + spread;
          if (adjustedScore > gameResult.awayScore) {
            pickResult = 'won';
          } else if (adjustedScore === gameResult.awayScore) {
            pickResult = 'push';
          }
        } else {
          adjustedScore = gameResult.awayScore + spread;
          if (adjustedScore > gameResult.homeScore) {
            pickResult = 'won';
          } else if (adjustedScore === gameResult.homeScore) {
            pickResult = 'push';
          }
        }
      } else if (betInfo.market === 'total' || betInfo.market === 'over' || betInfo.market === 'under') {
        // For over/under bets
        const totalLine = parseFloat(betInfo.line || '0');
        const actualTotal = gameResult.homeScore + gameResult.awayScore;
        const selection = betInfo.selection?.toLowerCase();
        
        if (actualTotal === totalLine) {
          pickResult = 'push';
        } else if (selection?.includes('over')) {
          pickResult = actualTotal > totalLine ? 'won' : 'lost';
        } else if (selection?.includes('under')) {
          pickResult = actualTotal < totalLine ? 'won' : 'lost';
        }
      }
      
      // Update the pick in the database
      const { error: updateError } = await supabase
        .from('picks')
        .update({
          status: pickResult,
          result: {
            homeScore: gameResult.homeScore,
            awayScore: gameResult.awayScore,
            gradedAt: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', pick.id);
      
      if (updateError) {
        console.error('Error updating pick:', updateError);
        return { graded: false, error: updateError };
      }
      
      console.log(`Pick ${pick.id} graded as ${pickResult}`);
      return { graded: true, result: pickResult };
    } catch (error) {
      console.error('Error grading pick:', error);
      return { graded: false, error };
    }
  }
  
  // Update user statistics after grading
  static async updateUserStats(userId: string) {
    try {
      // Fetch all user picks to calculate stats
      const { data: allPicks, error } = await supabase
        .from('picks')
        .select('*')
        .eq('user_id', userId);
      
      if (error || !allPicks) {
        console.error('Error fetching picks for stats:', error);
        return;
      }
      
      // Calculate stats
      const wonPicks = allPicks.filter(p => p.status === 'won').length;
      const lostPicks = allPicks.filter(p => p.status === 'lost').length;
      const totalCompleted = wonPicks + lostPicks;
      const winRate = totalCompleted > 0 ? (wonPicks / totalCompleted) * 100 : 0;
      
      // Update profile with new stats
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          total_picks: allPicks.length,
          successful_picks: wonPicks,
          win_rate: winRate,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (updateError) {
        console.error('Error updating user stats:', updateError);
      } else {
        console.log('User stats updated successfully');
      }
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  }
}
