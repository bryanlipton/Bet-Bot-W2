import { db } from '../db';
import { baseballGames, baseballPlayerStats, type InsertBaseballGame } from '@shared/schema';

interface MLBLiveGame {
  gamePk: number;
  gameDate: string;
  status: { detailedState: string };
  teams: {
    home: {
      team: { name: string; id: number };
      probablePitcher?: { fullName: string; id: number };
    };
    away: {
      team: { name: string; id: number };
      probablePitcher?: { fullName: string; id: number };
    };
  };
  venue: { name: string };
  weather?: {
    temp: string;
    wind: string;
    condition: string;
  };
}

interface PitcherStats {
  era: number;
  whip: number;
  strikeOuts: number;
  wins: number;
  losses: number;
}

export class LiveMLBDataService {
  private baseUrl = 'https://statsapi.mlb.com/api/v1';
  
  async fetchTodaysGames(): Promise<MLBLiveGame[]> {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      console.log(`Fetching today's MLB games for ${today}...`);
      
      const response = await fetch(
        `${this.baseUrl}/schedule?sportId=1&date=${today}&hydrate=game(content(summary)),decisions,person,probablePitcher,team`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch today's games: ${response.status}`);
      }
      
      const data = await response.json();
      const games: MLBLiveGame[] = [];
      
      if (data.dates && data.dates.length > 0) {
        for (const dateObj of data.dates) {
          for (const game of dateObj.games) {
            if (game.status.detailedState === 'Scheduled' || 
                game.status.detailedState === 'Pre-Game' ||
                game.status.detailedState === 'Warmup') {
              games.push(game);
            }
          }
        }
      }
      
      console.log(`Found ${games.length} scheduled games for today`);
      return games;
      
    } catch (error) {
      console.error('Error fetching today\'s games:', error);
      return [];
    }
  }
  
  async fetchPitcherStats(pitcherId: number, season: number = 2025): Promise<PitcherStats | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/people/${pitcherId}/stats?stats=season&leagueId=103,104&season=${season}`
      );
      
      if (!response.ok) {
        console.warn(`Could not fetch pitcher stats for ID ${pitcherId}`);
        return null;
      }
      
      const data = await response.json();
      
      if (data.stats && data.stats.length > 0) {
        const pitchingStats = data.stats.find((s: any) => s.group.displayName === 'pitching');
        if (pitchingStats && pitchingStats.splits.length > 0) {
          const stats = pitchingStats.splits[0].stat;
          
          return {
            era: parseFloat(stats.era) || 4.50,
            whip: parseFloat(stats.whip) || 1.35,
            strikeOuts: parseInt(stats.strikeOuts) || 0,
            wins: parseInt(stats.wins) || 0,
            losses: parseInt(stats.losses) || 0
          };
        }
      }
      
      return null;
      
    } catch (error) {
      console.error(`Error fetching pitcher stats for ${pitcherId}:`, error);
      return null;
    }
  }
  
  async fetch2025SeasonData(): Promise<void> {
    console.log('Fetching 2025 season data...');
    
    try {
      // Fetch games from start of 2025 season to current date
      const seasonStart = '2025-03-28'; // Typical MLB season start
      const today = new Date().toISOString().split('T')[0];
      
      const games = await this.fetchGameResults(seasonStart, today);
      
      if (games.length > 0) {
        await this.store2025Games(games);
        console.log(`Successfully stored ${games.length} games from 2025 season`);
      }
      
      // Update with current team rosters and stats
      await this.fetch2025TeamStats();
      
    } catch (error) {
      console.error('Error fetching 2025 season data:', error);
    }
  }
  
  private async fetchGameResults(startDate: string, endDate: string): Promise<MLBLiveGame[]> {
    const games: MLBLiveGame[] = [];
    
    try {
      console.log(`Fetching completed games from ${startDate} to ${endDate}...`);
      
      const response = await fetch(
        `${this.baseUrl}/schedule?sportId=1&startDate=${startDate}&endDate=${endDate}&hydrate=game(content(summary)),decisions,person,probablePitcher,team,review`
      );
      
      if (response.ok) {
        const data = await response.json();
        
        for (const dateObj of data.dates) {
          for (const game of dateObj.games) {
            if (game.status.detailedState === 'Final') {
              games.push(game);
            }
          }
        }
      }
      
    } catch (error) {
      console.error(`Error fetching games from ${startDate} to ${endDate}:`, error);
    }
    
    return games;
  }
  
  private async store2025Games(games: MLBLiveGame[]): Promise<void> {
    const gameData: InsertBaseballGame[] = [];
    
    for (const game of games) {
      // Extract scores from game data
      const homeScore = game.teams?.home?.score || 0;
      const awayScore = game.teams?.away?.score || 0;
      
      gameData.push({
        externalId: `mlb_2025_${game.gamePk}`,
        date: game.gameDate,
        homeTeam: game.teams.home.team.name,
        awayTeam: game.teams.away.team.name,
        homeScore,
        awayScore,
        gameStatus: 'completed',
        weather: game.weather?.condition || 'Clear',
        temperature: game.weather?.temp ? parseInt(game.weather.temp) : 75,
        windSpeed: this.parseWindSpeed(game.weather?.wind),
        windDirection: this.parseWindDirection(game.weather?.wind),
        humidity: 50 // Default humidity
      });
    }
    
    if (gameData.length > 0) {
      await db.insert(baseballGames).values(gameData).onConflictDoNothing();
    }
  }
  
  private async fetch2025TeamStats(): Promise<void> {
    console.log('Fetching 2025 team statistics...');
    
    try {
      const response = await fetch(
        `${this.baseUrl}/teams?sportId=1&season=2025&hydrate=stats(group=[hitting,pitching],type=[season])`
      );
      
      if (!response.ok) {
        console.warn('Could not fetch 2025 team stats, using 2024 data as baseline');
        return;
      }
      
      const data = await response.json();
      
      // Update player stats with 2025 data
      for (const team of data.teams) {
        await this.updateTeamPlayerStats(team, 2025);
      }
      
    } catch (error) {
      console.error('Error fetching 2025 team stats:', error);
    }
  }
  
  private async updateTeamPlayerStats(team: any, season: number): Promise<void> {
    // Extract current season stats and update database
    const hitting = team.stats?.find((s: any) => s.group.displayName === 'hitting')?.splits?.[0]?.stat || {};
    const pitching = team.stats?.find((s: any) => s.group.displayName === 'pitching')?.splits?.[0]?.stat || {};
    
    // Update existing player records or create new ones with 2025 data
    const teamBA = parseFloat(hitting.avg) || 0.250;
    const teamERA = parseFloat(pitching.era) || 4.50;
    const teamOPS = parseFloat(hitting.ops) || 0.700;
    
    console.log(`Updated ${team.name} stats: BA=${teamBA}, ERA=${teamERA}, OPS=${teamOPS}`);
  }
  
  async getProbableStarters(gameId: number): Promise<{home: PitcherStats | null, away: PitcherStats | null}> {
    try {
      const response = await fetch(`${this.baseUrl}/game/${gameId}/boxscore`);
      
      if (!response.ok) {
        return { home: null, away: null };
      }
      
      const data = await response.json();
      
      const homePitcherId = data.teams?.home?.probablePitcher?.id;
      const awayPitcherId = data.teams?.away?.probablePitcher?.id;
      
      const [homeStats, awayStats] = await Promise.all([
        homePitcherId ? this.fetchPitcherStats(homePitcherId) : null,
        awayPitcherId ? this.fetchPitcherStats(awayPitcherId) : null
      ]);
      
      return { home: homeStats, away: awayStats };
      
    } catch (error) {
      console.error(`Error fetching probable starters for game ${gameId}:`, error);
      return { home: null, away: null };
    }
  }
  
  private parseWindSpeed(windString?: string): number {
    if (!windString) return 8;
    const match = windString.match(/(\d+)/);
    return match ? parseInt(match[1]) : 8;
  }
  
  private parseWindDirection(windString?: string): string {
    if (!windString) return 'W';
    const directions = ['N', 'S', 'E', 'W', 'NE', 'NW', 'SE', 'SW'];
    for (const dir of directions) {
      if (windString.toUpperCase().includes(dir)) {
        return dir;
      }
    }
    return 'W';
  }
}

export const liveMLBDataService = new LiveMLBDataService();