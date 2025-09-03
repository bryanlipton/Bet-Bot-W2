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
      
      if (picksError || !pendingPicks)
