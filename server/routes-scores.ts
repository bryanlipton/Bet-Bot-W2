import { Express, Request, Response } from "express";

interface MLBScore {
  gameId: number;
  gameDate: string;
  status: {
    abstractGameState: string;
    detailedState: string;
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
      
      // Use MLB Stats API for scores
      const response = await fetch(
        `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${date}&hydrate=team,linescore`
      );
      
      if (!response.ok) {
        throw new Error(`MLB API error: ${response.status}`);
      }
      
      const data: MLBScoresResponse = await response.json();
      
      const scores = data.dates.flatMap(date => 
        date.games.map((game, index) => ({
          id: `mlb_${game.gamePk || game.gameId || `${date.date}_${index}`}`,
          gameId: game.gamePk || game.gameId || `${date.date}_${index}`,
          homeTeam: game.teams.home.team.name,
          awayTeam: game.teams.away.team.name,
          homeScore: game.teams.home.score,
          awayScore: game.teams.away.score,
          status: game.status.detailedState,
          abstractGameState: game.status.abstractGameState,
          startTime: game.gameDate,
          inning: game.linescore?.currentInning ? `${game.linescore.currentInning}${game.linescore.inningState?.charAt(0) || ''}` : undefined,
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
        const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Last 7 days
        
        const response = await fetch(
          `https://statsapi.mlb.com/api/v1/schedule?sportId=1&startDate=${startDate}&endDate=${today}&hydrate=team,linescore`
        );
        
        if (!response.ok) {
          throw new Error(`MLB API error: ${response.status}`);
        }
        
        const data: MLBScoresResponse = await response.json();
        
        const scores = data.dates.flatMap(date => 
          date.games.map(game => ({
            id: `mlb_${game.gameId}`,
            homeTeam: game.teams.home.team.name,
            awayTeam: game.teams.away.team.name,
            homeScore: game.teams.home.score,
            awayScore: game.teams.away.score,
            status: game.status.detailedState,
            startTime: game.gameDate,
            inning: game.linescore?.currentInning ? `${game.linescore.currentInning}${game.linescore.inningState?.charAt(0) || ''}` : undefined,
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
}