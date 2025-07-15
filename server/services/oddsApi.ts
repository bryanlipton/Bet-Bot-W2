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
    this.apiKey = process.env.ODDS_API_KEY || process.env.THE_ODDS_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Odds API key not found. Please set ODDS_API_KEY or THE_ODDS_API_KEY environment variable.');
    }
  }

  async getCurrentOdds(sport: string, regions: string = 'us', markets: string = 'h2h,spreads,totals'): Promise<Game[]> {
    try {
      const url = `${this.baseUrl}/sports/${sport}/odds?apiKey=${this.apiKey}&regions=${regions}&markets=${markets}&oddsFormat=american`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Odds API error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching current odds:', error);
      throw error;
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
}

export const oddsApiService = new OddsApiService();
