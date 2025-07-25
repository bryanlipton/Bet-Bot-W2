import { Express, Request, Response } from "express";

interface MLBScore {
  gamePk: number;
  gameId?: number;
  gameDate: string;
  status: {
    abstractGameState: string;
    detailedState: string;
    statusCode: string;
  };
  teams: {
    away: {
      team: {
        name: string;
      };
      score?: number;
    };
    home: {
      team: {
        name: string;
      };
      score?: number;
    };
  };
  linescore?: {
    currentInning?: number;
    inningState?: string;
    balls?: number;
    strikes?: number;
    outs?: number;
  };
  venue?: {
    name: string;
  };
}

interface MLBScoresResponse {
  dates: Array<{
    date: string;
    games: MLBScore[];
  }>;
}

export function registerScoresRoutes(app: Express) {
  console.log('Registering scores routes...');
  
  // Get scores for specific date and sport
  app.get("/api/mlb/scores/:date", async (req: Request, res: Response) => {
    try {
      const { date } = req.params;
      
      console.log(`MLB scores route called for date: ${date}`);
      
      // Set JSON response header
      res.setHeader('Content-Type', 'application/json');
      
      console.log(`Fetching MLB scores for date: ${date}`);
      
      // Use enhanced MLB Stats API for live scores with detailed hydration
      const response = await fetch(
        `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${date}&hydrate=team,linescore,venue,probablePitcher,weather`
      );
      
      if (!response.ok) {
        throw new Error(`MLB API error: ${response.status}`);
      }
      
      const data: MLBScoresResponse = await response.json();
      
      const scores = data.dates.flatMap(date => 
        date.games.map((game, index) => ({
          id: `mlb_${game.gamePk}`,
          gameId: game.gamePk,
          homeTeam: game.teams.home.team.name,
          awayTeam: game.teams.away.team.name,
          homeScore: game.teams.home.score,
          awayScore: game.teams.away.score,
          status: game.status.detailedState,
          abstractGameState: game.status.abstractGameState,
          statusCode: game.status.statusCode,
          startTime: game.gameDate,
          venue: game.venue?.name,
          inning: game.linescore?.currentInning ? `${game.linescore.inningState || ''} ${game.linescore.currentInning}` : undefined,
          linescore: game.linescore ? {
            currentInning: game.linescore.currentInning,
            inningState: game.linescore.inningState,
            balls: game.linescore.balls,
            strikes: game.linescore.strikes,
            outs: game.linescore.outs
          } : undefined,
          sportKey: 'baseball_mlb'
        }))
      );
      
      console.log(`Found ${scores.length} games for ${date}`);
      res.json(scores);
    } catch (error) {
      console.error(`Error fetching scores for ${req.params.date}:`, error);
      res.status(500).json({ error: "Failed to fetch scores" });
    }
  });

  // Get scores for different sports
  app.get("/api/scores/:sport", async (req: Request, res: Response) => {
    try {
      const { sport } = req.params;
      
      if (sport === 'baseball_mlb') {
        // Use MLB Stats API for scores
        const today = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Last 15 days for proper L10 calculation
        
        const response = await fetch(
          `https://statsapi.mlb.com/api/v1/schedule?sportId=1&startDate=${startDate}&endDate=${today}&hydrate=team,linescore,venue,probablePitcher`
        );
        
        if (!response.ok) {
          throw new Error(`MLB API error: ${response.status}`);
        }
        
        const data: MLBScoresResponse = await response.json();
        
        const scores = data.dates.flatMap(date => 
          date.games.map(game => ({
            id: `mlb_${game.gamePk}`,
            gameId: game.gamePk,
            homeTeam: game.teams.home.team.name,
            awayTeam: game.teams.away.team.name,
            homeScore: game.teams.home.score,
            awayScore: game.teams.away.score,
            status: game.status.detailedState,
            abstractGameState: game.status.abstractGameState,
            startTime: game.gameDate,
            venue: game.venue?.name,
            inning: game.linescore?.currentInning ? `${game.linescore.inningState || ''} ${game.linescore.currentInning}` : undefined,
            linescore: game.linescore ? {
              currentInning: game.linescore.currentInning,
              inningState: game.linescore.inningState,
              balls: game.linescore.balls,
              strikes: game.linescore.strikes,
              outs: game.linescore.outs
            } : undefined,
            sportKey: 'baseball_mlb'
          }))
        );
        
        res.json(scores);
      } else {
        // For other sports, return empty array for now
        // In the future, integrate with NFL/NBA APIs
        res.json([]);
      }
    } catch (error) {
      console.error(`Error fetching scores for ${req.params.sport}:`, error);
      res.status(500).json({ error: "Failed to fetch scores" });
    }
  });

  // Get live/recent scores summary
  app.get("/api/scores/summary", async (req: Request, res: Response) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's MLB games
      const response = await fetch(
        `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${today}&hydrate=team,linescore`
      );
      
      if (!response.ok) {
        throw new Error(`MLB API error: ${response.status}`);
      }
      
      const data: MLBScoresResponse = await response.json();
      
      const summary = {
        baseball_mlb: {
          total: 0,
          live: 0,
          final: 0,
          scheduled: 0
        }
      };
      
      data.dates.forEach(date => {
        date.games.forEach(game => {
          summary.baseball_mlb.total++;
          const state = game.status.abstractGameState.toLowerCase();
          if (state === 'live') {
            summary.baseball_mlb.live++;
          } else if (state === 'final') {
            summary.baseball_mlb.final++;
          } else {
            summary.baseball_mlb.scheduled++;
          }
        });
      });
      
      res.json(summary);
    } catch (error) {
      console.error("Error fetching scores summary:", error);
      res.status(500).json({ error: "Failed to fetch scores summary" });
    }
  });

  // Get historical game data for L10 calculations
  app.get("/api/mlb/historical-scores", async (req: Request, res: Response) => {
    try {
      console.log('Fetching historical MLB scores for L10 calculations');
      
      // Get last 15 days to ensure we have enough completed games for L10
      const today = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const response = await fetch(
        `https://statsapi.mlb.com/api/v1/schedule?sportId=1&startDate=${startDate}&endDate=${today}&hydrate=team,linescore`
      );
      
      if (!response.ok) {
        throw new Error(`MLB API error: ${response.status}`);
      }
      
      const data: MLBScoresResponse = await response.json();
      
      const historicalGames = data.dates.flatMap(date => 
        date.games
          .filter(game => game.status.abstractGameState === 'Final') // Only completed games
          .map((game, index) => ({
            id: `mlb_${game.gamePk || game.gameId || `${date.date}_${index}`}`,
            gameId: game.gamePk || game.gameId || `${date.date}_${index}`,
            homeTeam: game.teams.home.team.name,
            awayTeam: game.teams.away.team.name,
            homeScore: game.teams.home.score || 0,
            awayScore: game.teams.away.score || 0,
            status: game.status.detailedState,
            abstractGameState: game.status.abstractGameState,
            startTime: game.gameDate,
            gameDate: date.date,
            sportKey: 'baseball_mlb'
          }))
      );
      
      console.log(`Found ${historicalGames.length} completed historical games for L10 calculations`);
      res.json(historicalGames);
    } catch (error) {
      console.error('Error fetching historical scores:', error);
      res.status(500).json({ error: "Failed to fetch historical scores" });
    }
  });
}