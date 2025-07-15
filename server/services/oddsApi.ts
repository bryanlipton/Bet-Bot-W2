interface OddsApiResponse {
  timestamp: string;
  previous_timestamp?: string;
  next_timestamp?: string;
  data: any[];
}

interface Game {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
}

interface Bookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: Market[];
}

interface Market {
  key: string;
  outcomes: Outcome[];
}

interface Outcome {
  name: string;
  price: number;
  point?: number;
  description?: string;
}

export class OddsApiService {
  private apiKey: string;
  private baseUrl = 'https://api.the-odds-api.com/v4';

  constructor() {
    this.apiKey = process.env.ODDS_API_KEY || process.env.THE_ODDS_API_KEY || '24945c3743973fb01abda3cc2eab07b9';
    console.log(`Odds API initialized with key: ${this.apiKey ? this.apiKey.substring(0, 8) + '...' : 'none'}`);
  }

  async getCurrentOdds(sport: string, regions: string = 'us', markets: string = 'h2h,spreads,totals'): Promise<Game[]> {
    try {
      if (!this.apiKey) {
        console.log('No API key available, returning mock data for demo');
        return this.getMockOddsData(sport);
      }

      const url = `${this.baseUrl}/sports/${sport}/odds?apiKey=${this.apiKey}&regions=${regions}&markets=${markets}&oddsFormat=american`;
      console.log(`Fetching odds from: ${url.replace(this.apiKey, 'xxx...')}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`Odds API error: ${response.status} ${response.statusText} - ${errorText}`);
        console.log('Returning mock data for demo');
        return this.getMockOddsData(sport);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching current odds, returning mock data:', error);
      return this.getMockOddsData(sport);
    }
  }

  async getHistoricalOdds(sport: string, date: string, regions: string = 'us', markets: string = 'h2h,spreads,totals'): Promise<OddsApiResponse> {
    try {
      const url = `${this.baseUrl}/historical/sports/${sport}/odds?apiKey=${this.apiKey}&regions=${regions}&markets=${markets}&oddsFormat=american&date=${date}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Historical odds API error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching historical odds:', error);
      throw error;
    }
  }

  async getEventOdds(sport: string, eventId: string, regions: string = 'us', markets: string = 'h2h,spreads,totals'): Promise<Game> {
    try {
      const url = `${this.baseUrl}/sports/${sport}/events/${eventId}/odds?apiKey=${this.apiKey}&regions=${regions}&markets=${markets}&oddsFormat=american`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Event odds API error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching event odds:', error);
      throw error;
    }
  }

  async getAvailableSports(): Promise<any[]> {
    try {
      const url = `${this.baseUrl}/sports?apiKey=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Sports API error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching available sports:', error);
      throw error;
    }
  }

  convertAmericanToDecimal(americanOdds: number): number {
    if (americanOdds > 0) {
      return (americanOdds / 100) + 1;
    } else {
      return (100 / Math.abs(americanOdds)) + 1;
    }
  }

  calculateImpliedProbability(americanOdds: number): number {
    const decimal = this.convertAmericanToDecimal(americanOdds);
    return (1 / decimal) * 100;
  }

  private getMockOddsData(sport: string): Game[] {
    const now = new Date();
    const games = [];
    
    if (sport === 'americanfootball_nfl') {
      games.push({
        id: 'mock_nfl_game_1',
        sport_key: 'americanfootball_nfl',
        sport_title: 'NFL',
        commence_time: new Date(now.getTime() + 3600000).toISOString(), // 1 hour from now
        home_team: 'Kansas City Chiefs',
        away_team: 'Buffalo Bills',
        bookmakers: [{
          key: 'draftkings',
          title: 'DraftKings',
          last_update: now.toISOString(),
          markets: [{
            key: 'h2h',
            outcomes: [
              { name: 'Kansas City Chiefs', price: -165 },
              { name: 'Buffalo Bills', price: 140 }
            ]
          }, {
            key: 'spreads',
            outcomes: [
              { name: 'Kansas City Chiefs', price: -110, point: -3.5 },
              { name: 'Buffalo Bills', price: -110, point: 3.5 }
            ]
          }, {
            key: 'totals',
            outcomes: [
              { name: 'Over', price: -115, point: 47.5 },
              { name: 'Under', price: -105, point: 47.5 }
            ]
          }]
        }]
      });
      
      games.push({
        id: 'mock_nfl_game_2',
        sport_key: 'americanfootball_nfl',
        sport_title: 'NFL',
        commence_time: new Date(now.getTime() + 7200000).toISOString(), // 2 hours from now
        home_team: 'Dallas Cowboys',
        away_team: 'Philadelphia Eagles',
        bookmakers: [{
          key: 'fanduel',
          title: 'FanDuel',
          last_update: now.toISOString(),
          markets: [{
            key: 'h2h',
            outcomes: [
              { name: 'Dallas Cowboys', price: 120 },
              { name: 'Philadelphia Eagles', price: -145 }
            ]
          }, {
            key: 'spreads',
            outcomes: [
              { name: 'Dallas Cowboys', price: -110, point: 2.5 },
              { name: 'Philadelphia Eagles', price: -110, point: -2.5 }
            ]
          }, {
            key: 'totals',
            outcomes: [
              { name: 'Over', price: -110, point: 45.5 },
              { name: 'Under', price: -110, point: 45.5 }
            ]
          }]
        }]
      });
    }
    
    return games;
  }
}

export const oddsApiService = new OddsApiService();
