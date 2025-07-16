import fetch from 'node-fetch';

export interface StatcastBatterStats {
  player_id: number;
  player_name: string;
  team_abbrev: string;
  avg_exit_velocity: number;
  max_exit_velocity: number;
  hard_hit_percent: number;
  barrel_percent: number;
  xwoba: number;
  xba: number;
  xslg: number;
  sweet_spot_percent: number;
  avg_launch_angle: number;
  chase_rate: number;
  whiff_rate: number;
  k_percent: number;
  bb_percent: number;
}

export interface StatcastPitcherStats {
  player_id: number;
  player_name: string;
  team_abbrev: string;
  avg_exit_velocity_against: number;
  hard_hit_percent_against: number;
  barrel_percent_against: number;
  xwoba_against: number;
  xera: number;
  avg_fastball_velocity: number;
  avg_spin_rate: number;
  k_percent: number;
  bb_percent: number;
  whiff_rate: number;
  chase_rate: number;
}

export interface TeamStatcastMetrics {
  team: string;
  batting_avg_exit_velocity: number;
  batting_hard_hit_percent: number;
  batting_barrel_percent: number;
  batting_xwoba: number;
  pitching_avg_exit_velocity_against: number;
  pitching_hard_hit_percent_against: number;
  pitching_barrel_percent_against: number;
  pitching_xwoba_against: number;
  runs_per_game: number;
  runs_allowed_per_game: number;
}

class BaseballSavantService {
  private readonly baseUrl = 'https://baseballsavant.mlb.com';
  
  /**
   * Fetch current season batter leaderboard with Statcast metrics
   */
  async getBatterStatcastStats(minPAs: number = 50): Promise<StatcastBatterStats[]> {
    try {
      const url = `${this.baseUrl}/leaderboard/statcast?type=batter&year=2025&position=&team=&min=${minPAs}&sort_col=xwoba&sort_order=desc`;
      console.log('Fetching Statcast batter stats from Baseball Savant...');
      
      // This would normally be a CSV download - we'll implement a parser
      const response = await fetch(url + '&csv=true');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch Statcast batter data: ${response.statusText}`);
      }
      
      const csvData = await response.text();
      return this.parseBatterCSV(csvData);
    } catch (error) {
      console.error('Error fetching Statcast batter stats:', error);
      throw error;
    }
  }

  /**
   * Fetch current season pitcher leaderboard with Statcast metrics
   */
  async getPitcherStatcastStats(minBF: number = 50): Promise<StatcastPitcherStats[]> {
    try {
      const url = `${this.baseUrl}/leaderboard/statcast?type=pitcher&year=2025&position=&team=&min=${minBF}&sort_col=xera&sort_order=asc`;
      console.log('Fetching Statcast pitcher stats from Baseball Savant...');
      
      const response = await fetch(url + '&csv=true');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch Statcast pitcher data: ${response.statusText}`);
      }
      
      const csvData = await response.text();
      return this.parsePitcherCSV(csvData);
    } catch (error) {
      console.error('Error fetching Statcast pitcher stats:', error);
      throw error;
    }
  }

  /**
   * Get team-level aggregated Statcast metrics
   */
  async getTeamStatcastMetrics(): Promise<TeamStatcastMetrics[]> {
    try {
      console.log('Calculating team-level Statcast metrics...');
      
      const [batters, pitchers] = await Promise.all([
        this.getBatterStatcastStats(25),
        this.getPitcherStatcastStats(25)
      ]);

      // Aggregate by team
      const teamMetrics: Map<string, TeamStatcastMetrics> = new Map();
      
      // Initialize teams
      const allTeams = [...new Set([...batters.map(b => b.team_abbrev), ...pitchers.map(p => p.team_abbrev)])];
      
      for (const team of allTeams) {
        const teamBatters = batters.filter(b => b.team_abbrev === team);
        const teamPitchers = pitchers.filter(p => p.team_abbrev === team);
        
        if (teamBatters.length === 0 || teamPitchers.length === 0) continue;
        
        teamMetrics.set(team, {
          team,
          batting_avg_exit_velocity: this.average(teamBatters.map(b => b.avg_exit_velocity)),
          batting_hard_hit_percent: this.average(teamBatters.map(b => b.hard_hit_percent)),
          batting_barrel_percent: this.average(teamBatters.map(b => b.barrel_percent)),
          batting_xwoba: this.average(teamBatters.map(b => b.xwoba)),
          pitching_avg_exit_velocity_against: this.average(teamPitchers.map(p => p.avg_exit_velocity_against)),
          pitching_hard_hit_percent_against: this.average(teamPitchers.map(p => p.hard_hit_percent_against)),
          pitching_barrel_percent_against: this.average(teamPitchers.map(p => p.barrel_percent_against)),
          pitching_xwoba_against: this.average(teamPitchers.map(p => p.xwoba_against)),
          runs_per_game: 0, // Will be filled from game data
          runs_allowed_per_game: 0 // Will be filled from game data
        });
      }
      
      return Array.from(teamMetrics.values());
    } catch (error) {
      console.error('Error calculating team Statcast metrics:', error);
      throw error;
    }
  }

  /**
   * Get player Statcast data for specific players (for probable pitchers)
   */
  async getPlayerStatcast(playerId: number, type: 'batter' | 'pitcher'): Promise<StatcastBatterStats | StatcastPitcherStats | null> {
    try {
      const stats = type === 'batter' 
        ? await this.getBatterStatcastStats(1)
        : await this.getPitcherStatcastStats(1);
      
      return stats.find(s => s.player_id === playerId) || null;
    } catch (error) {
      console.error(`Error fetching player ${playerId} Statcast data:`, error);
      return null;
    }
  }

  private parseBatterCSV(csvData: string): StatcastBatterStats[] {
    const lines = csvData.split('\n');
    const headers = lines[0].split(',');
    const data: StatcastBatterStats[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length < headers.length) continue;
      
      try {
        data.push({
          player_id: parseInt(values[0]) || 0,
          player_name: values[1] || '',
          team_abbrev: values[2] || '',
          avg_exit_velocity: parseFloat(values[3]) || 0,
          max_exit_velocity: parseFloat(values[4]) || 0,
          hard_hit_percent: parseFloat(values[5]) || 0,
          barrel_percent: parseFloat(values[6]) || 0,
          xwoba: parseFloat(values[7]) || 0,
          xba: parseFloat(values[8]) || 0,
          xslg: parseFloat(values[9]) || 0,
          sweet_spot_percent: parseFloat(values[10]) || 0,
          avg_launch_angle: parseFloat(values[11]) || 0,
          chase_rate: parseFloat(values[12]) || 0,
          whiff_rate: parseFloat(values[13]) || 0,
          k_percent: parseFloat(values[14]) || 0,
          bb_percent: parseFloat(values[15]) || 0,
        });
      } catch (error) {
        console.warn(`Error parsing batter row ${i}:`, error);
      }
    }
    
    return data;
  }

  private parsePitcherCSV(csvData: string): StatcastPitcherStats[] {
    const lines = csvData.split('\n');
    const headers = lines[0].split(',');
    const data: StatcastPitcherStats[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length < headers.length) continue;
      
      try {
        data.push({
          player_id: parseInt(values[0]) || 0,
          player_name: values[1] || '',
          team_abbrev: values[2] || '',
          avg_exit_velocity_against: parseFloat(values[3]) || 0,
          hard_hit_percent_against: parseFloat(values[4]) || 0,
          barrel_percent_against: parseFloat(values[5]) || 0,
          xwoba_against: parseFloat(values[6]) || 0,
          xera: parseFloat(values[7]) || 0,
          avg_fastball_velocity: parseFloat(values[8]) || 0,
          avg_spin_rate: parseFloat(values[9]) || 0,
          k_percent: parseFloat(values[10]) || 0,
          bb_percent: parseFloat(values[11]) || 0,
          whiff_rate: parseFloat(values[12]) || 0,
          chase_rate: parseFloat(values[13]) || 0,
        });
      } catch (error) {
        console.warn(`Error parsing pitcher row ${i}:`, error);
      }
    }
    
    return data;
  }

  private average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }
}

export const baseballSavantService = new BaseballSavantService();