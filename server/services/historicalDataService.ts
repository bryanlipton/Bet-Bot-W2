// Historical Data Service - handles historical betting data and analysis
export interface HistoricalGame {
  gameId: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  winner?: string;
  odds?: {
    home: number;
    away: number;
    total?: number;
  };
}

export interface HistoricalPickData {
  pickId: string;
  gameId: string;
  prediction: string;
  confidence: number;
  result?: 'win' | 'loss' | 'push';
  actualOdds?: number;
  profit?: number;
}

class HistoricalDataService {
  private cache = new Map<string, any>();
  private lastUpdate = 0;
  private readonly CACHE_DURATION = 1000 * 60 * 60; // 1 hour

  async getHistoricalGames(startDate: string, endDate: string): Promise<HistoricalGame[]> {
    const cacheKey = `games_${startDate}_${endDate}`;
    
    if (this.cache.has(cacheKey) && Date.now() - this.lastUpdate < this.CACHE_DURATION) {
      return this.cache.get(cacheKey);
    }

    try {
      // In a real implementation, this would fetch from your database
      // For now, return mock data to prevent build errors
      const mockGames: HistoricalGame[] = [
        {
          gameId: '1',
          date: startDate,
          homeTeam: 'Yankees',
          awayTeam: 'Red Sox',
          homeScore: 5,
          awayScore: 3,
          winner: 'Yankees',
          odds: { home: -150, away: 130 }
        }
      ];

      this.cache.set(cacheKey, mockGames);
      this.lastUpdate = Date.now();
      return mockGames;
    } catch (error) {
      console.error('Error fetching historical games:', error);
      return [];
    }
  }

  async getPickPerformance(userId?: string): Promise<HistoricalPickData[]> {
    try {
      // Mock implementation - replace with actual database queries
      const mockPicks: HistoricalPickData[] = [
        {
          pickId: '1',
          gameId: '1',
          prediction: 'Yankees',
          confidence: 0.65,
          result: 'win',
          actualOdds: -150,
          profit: 100
        }
      ];

      return mockPicks;
    } catch (error) {
      console.error('Error fetching pick performance:', error);
      return [];
    }
  }

  async calculateWinRate(userId?: string): Promise<number> {
    try {
      const picks = await this.getPickPerformance(userId);
      const wins = picks.filter(pick => pick.result === 'win').length;
      return picks.length > 0 ? wins / picks.length : 0;
    } catch (error) {
      console.error('Error calculating win rate:', error);
      return 0;
    }
  }

  async getRecentTrends(days: number = 30): Promise<any> {
    try {
      // Mock implementation for recent performance trends
      return {
        totalPicks: 50,
        wins: 32,
        losses: 18,
        winRate: 0.64,
        profit: 1250,
        roi: 0.125
      };
    } catch (error) {
      console.error('Error getting recent trends:', error);
      return null;
    }
  }
}

export const historicalDataService = new HistoricalDataService();
export default historicalDataService;
