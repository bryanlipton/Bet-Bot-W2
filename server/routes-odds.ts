import { Express } from "express";

const ODDS_API_KEY = process.env.THE_ODDS_API_KEY;
const ODDS_API_BASE_URL = "https://api.the-odds-api.com/v4";

export function registerOddsRoutes(app: Express) {
  // Get all scheduled events for a sport (regardless of odds availability)
  app.get('/api/odds/events/:sport', async (req, res) => {
    try {
      const { sport } = req.params;
      
      if (!ODDS_API_KEY) {
        return res.status(500).json({ error: 'The Odds API key not configured' });
      }

      // Get events for the next 7 days
      const dateFrom = new Date().toISOString();
      const dateTo = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const url = `${ODDS_API_BASE_URL}/sports/${sport}/events?apiKey=${ODDS_API_KEY}&dateFrom=${dateFrom}&dateTo=${dateTo}`;
      
      console.log(`Fetching scheduled events for ${sport} from: ${url.replace(ODDS_API_KEY, 'xxx...')}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`Events API error: ${response.status} ${response.statusText}`);
        return res.status(response.status).json({ 
          error: `Failed to fetch events: ${response.statusText}` 
        });
      }
      
      const events = await response.json();
      
      // Now fetch odds for these events
      const oddsUrl = `${ODDS_API_BASE_URL}/sports/${sport}/odds?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`;
      const oddsResponse = await fetch(oddsUrl);
      const oddsData = oddsResponse.ok ? await oddsResponse.json() : [];
      
      // Merge events with available odds
      const eventsWithOdds = events.map(event => {
        const gameOdds = oddsData.find(odds => odds.id === event.id);
        return {
          ...event,
          bookmakers: gameOdds?.bookmakers || []
        };
      });
      
      console.log(`Successfully fetched ${events.length} scheduled events, ${oddsData.length} with odds for ${sport}`);
      
      res.json(eventsWithOdds);
    } catch (error) {
      console.error('Error fetching scheduled events:', error);
      res.status(500).json({ 
        error: 'Failed to fetch scheduled events',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get live odds for a specific sport
  app.get('/api/odds/live/:sport', async (req, res) => {
    try {
      const { sport } = req.params;
      
      if (!ODDS_API_KEY) {
        return res.status(500).json({ error: 'The Odds API key not configured' });
      }

      const url = `${ODDS_API_BASE_URL}/sports/${sport}/odds?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`;
      
      console.log(`Fetching live odds for ${sport} from: ${url.replace(ODDS_API_KEY, 'xxx...')}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`Odds API error: ${response.status} ${response.statusText}`);
        return res.status(response.status).json({ 
          error: `Failed to fetch odds: ${response.statusText}` 
        });
      }
      
      const data = await response.json();
      
      console.log(`Successfully fetched ${data.length} games for ${sport}`);
      
      res.json(data);
    } catch (error) {
      console.error('Error fetching live odds:', error);
      res.status(500).json({ 
        error: 'Failed to fetch live odds',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get available sports
  app.get('/api/odds/sports', async (req, res) => {
    try {
      if (!ODDS_API_KEY) {
        return res.status(500).json({ error: 'The Odds API key not configured' });
      }

      const url = `${ODDS_API_BASE_URL}/sports?apiKey=${ODDS_API_KEY}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        return res.status(response.status).json({ 
          error: `Failed to fetch sports: ${response.statusText}` 
        });
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching sports:', error);
      res.status(500).json({ 
        error: 'Failed to fetch sports',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get usage information
  app.get('/api/odds/usage', async (req, res) => {
    try {
      if (!ODDS_API_KEY) {
        return res.status(500).json({ error: 'The Odds API key not configured' });
      }

      const url = `${ODDS_API_BASE_URL}/sports?apiKey=${ODDS_API_KEY}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        return res.status(response.status).json({ 
          error: `Failed to fetch usage: ${response.statusText}` 
        });
      }
      
      // The Odds API returns usage info in response headers
      const remainingRequests = response.headers.get('x-requests-remaining');
      const usedRequests = response.headers.get('x-requests-used');
      
      res.json({
        remainingRequests: remainingRequests ? parseInt(remainingRequests) : null,
        usedRequests: usedRequests ? parseInt(usedRequests) : null,
        lastChecked: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching usage:', error);
      res.status(500).json({ 
        error: 'Failed to fetch usage',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}