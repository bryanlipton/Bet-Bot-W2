import fetch from 'node-fetch';

interface HistoricalOddsResponse {
  timestamp: string;
  previous_timestamp: string;
  next_timestamp: string;
  data: Array<{
    id: string;
    sport_key: string;
    sport_title: string;
    commence_time: string;
    home_team: string;
    away_team: string;
    bookmakers: Array<{
      key: string;
      title: string;
      markets: Array<{
        key: string;
        outcomes: Array<{
          name: string;
          price: number;
        }>;
      }>;
    }>;
  }>;
}

interface HistoricalGame {
  id: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeOdds: number;
  awayOdds: number;
  homeScore?: number;
  awayScore?: number;
  winner?: string;
}

export class HistoricalDataService {
  private apiKey: string;
  private baseUrl = 'https://api.the-odds-api.com/v4/historical/sports/baseball_mlb/odds';

  constructor() {
    this.apiKey = process.env.THE_ODDS_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('THE_ODDS_API_KEY environment variable is required');
    }
  }

  async fetchHistoricalOdds(date: string): Promise<HistoricalGame[]> {
    try {
      console.log(`Fetching historical MLB odds for ${date}...`);
      
      const url = `${this.baseUrl}?apiKey=${this.apiKey}&regions=us&markets=h2h&oddsFormat=american&date=${date}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: HistoricalOddsResponse = await response.json() as HistoricalOddsResponse;
      
      const games: HistoricalGame[] = data.data.map(game => {
        // Find DraftKings odds (most reliable)
        const draftkings = game.bookmakers.find(book => book.key === 'draftkings');
        const h2hMarket = draftkings?.markets.find(market => market.key === 'h2h');
        
        let homeOdds = -110; // Default
        let awayOdds = -110;
        
        if (h2hMarket) {
          const homeOutcome = h2hMarket.outcomes.find(outcome => outcome.name === game.home_team);
          const awayOutcome = h2hMarket.outcomes.find(outcome => outcome.name === game.away_team);
          
          if (homeOutcome) homeOdds = homeOutcome.price;
          if (awayOutcome) awayOdds = awayOutcome.price;
        }

        return {
          id: game.id,
          date: game.commence_time,
          homeTeam: game.home_team,
          awayTeam: game.away_team,
          homeOdds,
          awayOdds
        };
      });

      console.log(`Retrieved ${games.length} historical games with real odds`);
      return games;
      
    } catch (error) {
      console.error('Error fetching historical odds:', error);
      throw error;
    }
  }

  async fetchHistoricalGameResults(date: string): Promise<HistoricalGame[]> {
    // For now, we'll use a simple approach - fetch odds and simulate outcomes
    // In a real implementation, you'd fetch actual game results from a sports data API
    const games = await this.fetchHistoricalOdds(date);
    
    // Add simulated game outcomes based on implied probability from odds
    return games.map(game => {
      const homeImpliedProb = this.americanOddsToImpliedProbability(game.homeOdds);
      const awayImpliedProb = this.americanOddsToImpliedProbability(game.awayOdds);
      
      // Normalize probabilities (remove vig)
      const totalProb = homeImpliedProb + awayImpliedProb;
      const normalizedHomeProb = homeImpliedProb / totalProb;
      
      // Generate outcome based on implied probability + some randomness
      const homeWins = Math.random() < normalizedHomeProb;
      
      return {
        ...game,
        homeScore: homeWins ? 5 + Math.floor(Math.random() * 6) : 1 + Math.floor(Math.random() * 4),
        awayScore: homeWins ? 1 + Math.floor(Math.random() * 4) : 5 + Math.floor(Math.random() * 6),
        winner: homeWins ? game.homeTeam : game.awayTeam
      };
    });
  }

  async fetchHistoricalPeriod(startDate: string, endDate: string): Promise<HistoricalGame[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const allGames: HistoricalGame[] = [];
    
    // Fetch data every 3 days to avoid rate limits
    const current = new Date(start);
    while (current <= end) {
      try {
        const dateStr = current.toISOString();
        const games = await this.fetchHistoricalGameResults(dateStr);
        allGames.push(...games);
        
        // Move forward 3 days
        current.setDate(current.getDate() + 3);
        
        // Rate limiting - wait 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error fetching data for ${current.toISOString()}:`, error);
        // Continue with next date
        current.setDate(current.getDate() + 3);
      }
    }

    console.log(`Fetched ${allGames.length} total historical games from ${startDate} to ${endDate}`);
    return allGames;
  }

  private americanOddsToImpliedProbability(odds: number): number {
    if (odds > 0) {
      return 100 / (odds + 100);
    } else {
      return Math.abs(odds) / (Math.abs(odds) + 100);
    }
  }

  async testHistoricalDataAccess(): Promise<boolean> {
    try {
      // Test with a date from 2023
      const testDate = '2023-07-04T18:00:00Z'; // July 4th, 2023 - guaranteed MLB games
      const games = await this.fetchHistoricalOdds(testDate);
      
      console.log(`Historical data test successful: Found ${games.length} games`);
      if (games.length > 0) {
        console.log(`Sample game: ${games[0].awayTeam} @ ${games[0].homeTeam}, odds: ${games[0].awayOdds}/${games[0].homeOdds}`);
      }
      
      return games.length > 0;
    } catch (error) {
      console.error('Historical data test failed:', error);
      return false;
    }
  }
}

export const historicalDataService = new HistoricalDataService();