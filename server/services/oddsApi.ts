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
  link?: string;  // Event-level deep link
  sid?: string;   // Source ID for event
  markets: Market[];
}

interface Market {
  key: string;
  link?: string;   // Market-level deep link
  sid?: string;    // Source ID for market
  outcomes: Outcome[];
}

interface Outcome {
  name: string;
  price: number;
  point?: number;
  description?: string;
  link?: string;   // Outcome-level deep link (bet slip)
  sid?: string;    // Source ID for outcome
}

import { cacheService } from './cacheService';

export class OddsApiService {
  private apiKey: string;
  private baseUrl = 'https://api.the-odds-api.com/v4';
  private apiCallCount = 0;
  private lastCallTime = 0;
  private minCallInterval = 5000; // 5 seconds minimum between API calls

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

      // Check cache first (15 minute TTL for live odds to reduce API calls)
      const cacheKey = `odds_${sport}_${regions}_${markets}`;
      const cachedData = cacheService.get<Game[]>(cacheKey);
      if (cachedData) {
        console.log(`📊 Using cached odds for ${sport} (${cachedData.length} games) - Cache hit!`);
        return cachedData;
      }

      // Check daily API quota before making any call
      if (!cacheService.canMakeApiCall()) {
        console.log(`🚫 Daily API limit reached (${cacheService.getDailyApiCallCount()}/645), maintaining existing odds`);
        // Return the most recent cached data even if expired, or mock data as fallback
        const expiredData = cacheService.getExpiredOk<Game[]>(cacheKey);
        if (expiredData) {
          console.log(`📊 Using expired cached odds for ${sport} to maintain consistency`);
          return expiredData;
        }
        console.log('No cached data available, returning mock data for demo');
        return this.getMockOddsData(sport);
      }

      // Rate limiting: Enforce minimum interval between API calls
      const now = Date.now();
      const timeSinceLastCall = now - this.lastCallTime;
      if (timeSinceLastCall < this.minCallInterval) {
        const waitTime = this.minCallInterval - timeSinceLastCall;
        console.log(`⏳ Rate limiting: waiting ${waitTime}ms before API call`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      const url = `${this.baseUrl}/sports/${sport}/odds?apiKey=${this.apiKey}&regions=${regions}&markets=${markets}&oddsFormat=american&includeLinks=true&includeSids=true`;
      console.log(`🔄 Fetching fresh odds from API for ${sport}: ${url.replace(this.apiKey, 'xxx...')}`);
      
      // Track API call in both local and daily counters
      this.apiCallCount++;
      this.lastCallTime = Date.now();
      cacheService.incrementApiCallCount();
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`Odds API error: ${response.status} ${response.statusText} - ${errorText}`);
        console.log('Returning mock data for demo');
        return this.getMockOddsData(sport);
      }
      
      const data = await response.json();
      
      // Cache the fresh data for 15 minutes to reduce API calls
      cacheService.set(cacheKey, data, 15);
      console.log(`✅ Cached ${data.length} games for ${sport} for 15 minutes (API calls today: ${this.apiCallCount})`);
      
      return data;
    } catch (error) {
      console.error('Error fetching current odds, returning mock data:', error);
      return this.getMockOddsData(sport);
    }
  }

  async getHistoricalOdds(sport: string, date: string, regions: string = 'us', markets: string = 'h2h,spreads,totals'): Promise<OddsApiResponse> {
    try {
      // Check cache first (historical data can be cached longer - 30 minutes)
      const cacheKey = `historical_${sport}_${date}_${regions}_${markets}`;
      const cachedData = cacheService.get<OddsApiResponse>(cacheKey);
      if (cachedData) {
        console.log(`📊 Using cached historical odds for ${sport} on ${date}`);
        return cachedData;
      }

      const url = `${this.baseUrl}/historical/sports/${sport}/odds?apiKey=${this.apiKey}&regions=${regions}&markets=${markets}&oddsFormat=american&date=${date}`;
      console.log(`🔄 Fetching historical odds from API: ${url.replace(this.apiKey, 'xxx...')}`);
      
      // Track API call in both local and daily counters
      this.apiCallCount++;
      cacheService.incrementApiCallCount();
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Historical odds API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Cache historical data for 30 minutes
      cacheService.set(cacheKey, data, 30);
      console.log(`✅ Cached historical odds for ${sport} on ${date} (API calls today: ${this.apiCallCount})`);
      
      return data;
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

  getApiStats(): { callCount: number; cacheStats: any } {
    return {
      callCount: this.apiCallCount,
      cacheStats: cacheService.getStats()
    };
  }

  resetCallCount(): void {
    this.apiCallCount = 0;
  }

  private getMockOddsData(sport: string): Game[] {
    const now = new Date();
    const games = [];
    
    if (sport === 'baseball_mlb') {
      // Generate realistic MLB mock data
      const mlbTeams = [
        ['New York Yankees', 'Boston Red Sox'],
        ['Los Angeles Dodgers', 'San Francisco Giants'],
        ['Atlanta Braves', 'Philadelphia Phillies'],
        ['Houston Astros', 'Seattle Mariners'],
        ['Chicago Cubs', 'Milwaukee Brewers'],
        ['Baltimore Orioles', 'Tampa Bay Rays'],
        ['Toronto Blue Jays', 'Detroit Tigers'],
        ['Cleveland Guardians', 'Kansas City Royals'],
        ['Minnesota Twins', 'Chicago White Sox'],
        ['Texas Rangers', 'Los Angeles Angels'],
        ['Miami Marlins', 'Washington Nationals'],
        ['Pittsburgh Pirates', 'Cincinnati Reds'],
        ['St. Louis Cardinals', 'Colorado Rockies'],
        ['San Diego Padres', 'Arizona Diamondbacks'],
        ['New York Mets', 'Oakland Athletics']
      ];
      
      for (let i = 0; i < Math.min(mlbTeams.length, 15); i++) {
        const [homeTeam, awayTeam] = mlbTeams[i];
        const gameTime = new Date(now.getTime() + (i * 3600000) + Math.random() * 86400000); // Random games over next day
        
        // Generate realistic MLB odds
        const homeOdds = -150 + Math.random() * 300; // -150 to +150
        const awayOdds = homeOdds > 0 ? -(100 + Math.random() * 50) : 100 + Math.random() * 200;
        const spread = (Math.random() - 0.5) * 3; // -1.5 to +1.5
        const total = 8 + Math.random() * 4; // 8 to 12 runs
        
        games.push({
          id: `mock_mlb_game_${i + 1}`,
          sport_key: 'baseball_mlb',
          sport_title: 'MLB',
          commence_time: gameTime.toISOString(),
          home_team: homeTeam,
          away_team: awayTeam,
          bookmakers: [{
            key: 'draftkings',
            title: 'DraftKings',
            last_update: now.toISOString(),
            markets: [{
              key: 'h2h',
              outcomes: [
                { name: homeTeam, price: Math.round(homeOdds) },
                { name: awayTeam, price: Math.round(awayOdds) }
              ]
            }, {
              key: 'spreads',
              outcomes: [
                { name: homeTeam, price: -110, point: Math.round(spread * 2) / 2 },
                { name: awayTeam, price: -110, point: Math.round(-spread * 2) / 2 }
              ]
            }, {
              key: 'totals',
              outcomes: [
                { name: 'Over', price: -110, point: Math.round(total * 2) / 2 },
                { name: 'Under', price: -110, point: Math.round(total * 2) / 2 }
              ]
            }]
          }, {
            key: 'fanduel',
            title: 'FanDuel',
            last_update: now.toISOString(),
            markets: [{
              key: 'h2h',
              outcomes: [
                { name: homeTeam, price: Math.round(homeOdds + (Math.random() - 0.5) * 20) },
                { name: awayTeam, price: Math.round(awayOdds + (Math.random() - 0.5) * 20) }
              ]
            }, {
              key: 'spreads',
              outcomes: [
                { name: homeTeam, price: -105, point: Math.round(spread * 2) / 2 },
                { name: awayTeam, price: -115, point: Math.round(-spread * 2) / 2 }
              ]
            }, {
              key: 'totals',
              outcomes: [
                { name: 'Over', price: -105, point: Math.round(total * 2) / 2 },
                { name: 'Under', price: -115, point: Math.round(total * 2) / 2 }
              ]
            }]
          }]
        });
      }
    } else if (sport === 'americanfootball_nfl') {
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
