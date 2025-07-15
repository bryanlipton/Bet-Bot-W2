import fetch from 'node-fetch';

interface MLBGame {
  gamePk: number;
  gameDate: string;
  teams: {
    home: {
      team: { name: string; abbreviation: string };
      score?: number;
      isWinner?: boolean;
    };
    away: {
      team: { name: string; abbreviation: string };
      score?: number;
      isWinner?: boolean;
    };
  };
  status: {
    detailedState: string;
    statusCode: string;
  };
}

interface HistoricalGameResult {
  gameId: number;
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  winner: 'home' | 'away';
  status: string;
  completed: boolean;
}

interface RealBacktestResult {
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  profitLoss: number;
  sharpeRatio: number;
  maxDrawdown: number;
  dataSource: 'REAL_MLB_API';
  period: string;
  bets: Array<{
    date: string;
    game: string;
    homeOdds: number;
    awayOdds: number;
    modelPrediction: number;
    betOn: string;
    actualWinner: string;
    correct: boolean;
    stake: number;
    profit: number;
    confidence: number;
  }>;
}

export class MLBHistoricalDataService {
  private baseUrl = 'https://statsapi.mlb.com/api/v1';

  async fetchHistoricalGames(startDate: string, endDate: string): Promise<HistoricalGameResult[]> {
    try {
      console.log(`Fetching real MLB games from ${startDate} to ${endDate}...`);
      
      const url = `${this.baseUrl}/schedule/games/?sportId=1&startDate=${startDate}&endDate=${endDate}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`MLB API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as any;
      const games: HistoricalGameResult[] = [];

      for (const dateInfo of data.dates || []) {
        for (const game of dateInfo.games || []) {
          // Only include completed games with scores
          if (game.status.statusCode === 'F' && game.teams.home.score !== undefined && game.teams.away.score !== undefined) {
            const homeScore = game.teams.home.score;
            const awayScore = game.teams.away.score;
            
            games.push({
              gameId: game.gamePk,
              date: game.gameDate.split('T')[0],
              homeTeam: game.teams.home.team.name,
              awayTeam: game.teams.away.team.name,
              homeScore,
              awayScore,
              winner: homeScore > awayScore ? 'home' : 'away',
              status: game.status.detailedState,
              completed: true
            });
          }
        }
      }

      console.log(`Retrieved ${games.length} completed MLB games with real outcomes`);
      return games;
      
    } catch (error) {
      console.error('Error fetching MLB historical data:', error);
      throw error;
    }
  }

  async performRealMLBBacktest(startDate: string, endDate: string, bankroll: number = 1000): Promise<RealBacktestResult> {
    console.log(`Starting REAL MLB backtest using official MLB API data: ${startDate} to ${endDate}`);
    
    const historicalGames = await this.fetchHistoricalGames(startDate, endDate);
    
    if (historicalGames.length === 0) {
      throw new Error(`No completed MLB games found for period ${startDate} to ${endDate}`);
    }

    console.log(`Backtesting on ${historicalGames.length} real MLB games with authentic outcomes`);

    const bets: RealBacktestResult['bets'] = [];
    let currentBankroll = bankroll;
    let maxDrawdown = 0;
    let peakBankroll = bankroll;

    for (const game of historicalGames) {
      // Simple but realistic model prediction based on team names/trends
      const modelPrediction = this.calculateModelPrediction(game.homeTeam, game.awayTeam, game.date);
      
      // Only bet if model has sufficient confidence (edge)
      const betThreshold = 0.55; // Model must predict >55% to bet
      if (modelPrediction < betThreshold && modelPrediction < (1 - betThreshold)) {
        continue; // Skip games without sufficient edge
      }

      const betOnHome = modelPrediction > 0.5;
      const betTeam = betOnHome ? game.homeTeam : game.awayTeam;
      
      // Standard -110 odds for both sides (typical sportsbook margin)
      const homeOdds = -110;
      const awayOdds = -110;
      const betOdds = betOnHome ? homeOdds : awayOdds;
      
      // Conservative Kelly Criterion bet sizing
      const impliedProb = 0.524; // Implied probability of -110 odds
      const edge = Math.abs(modelPrediction - 0.5) * 2; // Convert to edge magnitude
      const kellyFraction = Math.max(0.01, Math.min(0.03, edge * 0.1)); // Cap at 3% bankroll
      const betSize = currentBankroll * kellyFraction;
      
      // Determine actual outcome
      const actualWinner = game.winner === 'home' ? game.homeTeam : game.awayTeam;
      const won = actualWinner === betTeam;
      
      // Calculate profit/loss
      let profit = 0;
      if (won) {
        // Profit on -110 odds
        profit = betSize * (100 / 110);
      } else {
        profit = -betSize;
      }
      
      currentBankroll += profit;
      
      // Track drawdown
      if (currentBankroll > peakBankroll) {
        peakBankroll = currentBankroll;
      } else {
        const drawdown = (peakBankroll - currentBankroll) / peakBankroll;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
      }

      bets.push({
        date: game.date,
        game: `${game.awayTeam} @ ${game.homeTeam}`,
        homeOdds,
        awayOdds,
        modelPrediction: Math.round(modelPrediction * 1000) / 1000,
        betOn: betTeam,
        actualWinner,
        correct: won,
        stake: Math.round(betSize * 100) / 100,
        profit: Math.round(profit * 100) / 100,
        confidence: Math.round(edge * 100)
      });
    }

    const totalProfit = currentBankroll - bankroll;
    const accuracy = bets.length > 0 ? bets.filter(bet => bet.correct).length / bets.length : 0;
    
    // Calculate Sharpe ratio
    const avgReturn = bets.length > 0 ? totalProfit / bets.length : 0;
    const returns = bets.map(bet => bet.profit);
    const returnStdDev = this.calculateStandardDeviation(returns);
    const sharpeRatio = returnStdDev > 0 ? avgReturn / returnStdDev : 0;

    const result: RealBacktestResult = {
      totalPredictions: bets.length,
      correctPredictions: bets.filter(bet => bet.correct).length,
      accuracy: Math.round(accuracy * 1000) / 1000,
      profitLoss: Math.round(totalProfit * 100) / 100,
      sharpeRatio: Math.round(sharpeRatio * 100) / 100,
      maxDrawdown: Math.round(maxDrawdown * 1000) / 1000,
      dataSource: 'REAL_MLB_API',
      period: `${startDate} to ${endDate}`,
      bets: bets.slice(0, 20) // Return first 20 bets for display
    };

    console.log(`REAL MLB API backtest complete: ${result.totalPredictions} bets, ${(result.accuracy * 100).toFixed(1)}% accuracy, $${result.profitLoss} profit`);
    
    return result;
  }

  private calculateModelPrediction(homeTeam: string, awayTeam: string, gameDate: string): number {
    // Simple but realistic model based on team strength indicators
    // In reality, this would use actual team stats, but this provides consistent results
    
    const teamStrengths: { [key: string]: number } = {
      // Strong teams (higher win probability)
      'Los Angeles Dodgers': 0.65, 'New York Yankees': 0.63, 'Houston Astros': 0.62,
      'Atlanta Braves': 0.61, 'Tampa Bay Rays': 0.60, 'Toronto Blue Jays': 0.59,
      'Philadelphia Phillies': 0.58, 'San Diego Padres': 0.57, 'Seattle Mariners': 0.56,
      
      // Average teams
      'Boston Red Sox': 0.52, 'New York Mets': 0.52, 'St. Louis Cardinals': 0.51,
      'Milwaukee Brewers': 0.51, 'Minnesota Twins': 0.50, 'Chicago White Sox': 0.50,
      'Cleveland Guardians': 0.50, 'San Francisco Giants': 0.49, 'Miami Marlins': 0.49,
      
      // Weaker teams (lower win probability)
      'Chicago Cubs': 0.47, 'Detroit Tigers': 0.46, 'Texas Rangers': 0.45,
      'Colorado Rockies': 0.44, 'Pittsburgh Pirates': 0.43, 'Kansas City Royals': 0.42,
      'Cincinnati Reds': 0.41, 'Baltimore Orioles': 0.40, 'Washington Nationals': 0.39,
      'Los Angeles Angels': 0.38, 'Arizona Diamondbacks': 0.37, 'Oakland Athletics': 0.35
    };

    const homeStrength = teamStrengths[homeTeam] || 0.50;
    const awayStrength = teamStrengths[awayTeam] || 0.50;
    
    // Home field advantage (~3-5%)
    const homeFieldAdvantage = 0.04;
    
    // Calculate relative strength with home field advantage
    const strengthDiff = (homeStrength + homeFieldAdvantage) - awayStrength;
    const basePrediction = 0.5 + (strengthDiff * 0.5); // Scale the difference
    
    // Add small time-based variance for consistency but not randomness
    const dateHash = gameDate.split('-').reduce((acc, val) => acc + parseInt(val), 0);
    const timeVariance = ((dateHash % 100) - 50) / 1000; // -0.05 to +0.05
    
    const finalPrediction = Math.max(0.15, Math.min(0.85, basePrediction + timeVariance));
    
    return finalPrediction;
  }

  private calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  // Test method to verify API access
  async testAPIAccess(): Promise<{ working: boolean; sampleData: any; message: string }> {
    try {
      const testDate = '2024-07-15'; // Known date with games
      const games = await this.fetchHistoricalGames(testDate, testDate);
      
      return {
        working: true,
        sampleData: games.slice(0, 3),
        message: `Successfully fetched ${games.length} real MLB games from ${testDate}`
      };
    } catch (error) {
      return {
        working: false,
        sampleData: null,
        message: `MLB API access failed: ${error}`
      };
    }
  }
}

export const mlbHistoricalDataService = new MLBHistoricalDataService();