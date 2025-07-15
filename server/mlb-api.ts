import { Express } from "express";

const MLB_API_BASE_URL = "https://statsapi.mlb.com/api/v1";

interface MLBGame {
  gamePk: number;
  gameDate: string;
  status: {
    abstractGameState: string;
    detailedState: string;
  };
  teams: {
    away: {
      team: {
        id: number;
        name: string;
      };
      probablePitcher?: {
        id: number;
        fullName: string;
      };
    };
    home: {
      team: {
        id: number;
        name: string;
      };
      probablePitcher?: {
        id: number;
        fullName: string;
      };
    };
  };
  venue: {
    name: string;
  };
}

interface MLBScheduleResponse {
  dates: Array<{
    date: string;
    games: MLBGame[];
  }>;
}

export function registerMLBRoutes(app: Express) {
  // Get today's MLB schedule
  app.get('/api/mlb/schedule', async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const url = `${MLB_API_BASE_URL}/schedule?sportId=1&date=${today}&hydrate=team,linescore,probablePitcher`;
      
      console.log(`Fetching MLB schedule from: ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`MLB API error: ${response.status} ${response.statusText}`);
        return res.status(response.status).json({ 
          error: `Failed to fetch MLB schedule: ${response.statusText}` 
        });
      }
      
      const data: MLBScheduleResponse = await response.json();
      
      const games = data.dates.flatMap(date => 
        date.games.map(game => ({
          id: `mlb_${game.gamePk}`,
          gameId: game.gamePk,
          sport_key: "baseball_mlb",
          sport_title: "MLB",
          commence_time: game.gameDate,
          home_team: game.teams.home.team.name,
          away_team: game.teams.away.team.name,
          venue: game.venue.name,
          status: game.status.detailedState,
          probablePitchers: {
            home: game.teams.home.probablePitcher?.fullName || null,
            away: game.teams.away.probablePitcher?.fullName || null
          },
          bookmakers: [] // Will be filled by odds data
        }))
      );
      
      console.log(`Successfully fetched ${games.length} MLB games for ${today}`);
      
      res.json(games);
    } catch (error) {
      console.error('Error fetching MLB schedule:', error);
      res.status(500).json({ 
        error: 'Failed to fetch MLB schedule',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get lineups for a specific game
  app.get('/api/mlb/game/:gameId/lineups', async (req, res) => {
    try {
      const { gameId } = req.params;
      const url = `${MLB_API_BASE_URL}/game/${gameId}/boxscore`;
      
      console.log(`Fetching lineups for game ${gameId} from: ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`MLB Lineups API error: ${response.status} ${response.statusText}`);
        return res.status(response.status).json({ 
          error: `Failed to fetch lineups: ${response.statusText}` 
        });
      }
      
      const data = await response.json();
      
      const homeLineup = data.teams?.home?.batters || [];
      const awayLineup = data.teams?.away?.batters || [];
      
      const lineups = {
        home: homeLineup.map((player: any) => ({
          id: player.person?.id,
          name: player.person?.fullName || 'TBD',
          position: player.position?.abbreviation || '',
          battingOrder: player.battingOrder || null
        })).filter((player: any) => player.battingOrder).sort((a: any, b: any) => (a.battingOrder || 0) - (b.battingOrder || 0)),
        away: awayLineup.map((player: any) => ({
          id: player.person?.id,
          name: player.person?.fullName || 'TBD',
          position: player.position?.abbreviation || '',
          battingOrder: player.battingOrder || null
        })).filter((player: any) => player.battingOrder).sort((a: any, b: any) => (a.battingOrder || 0) - (b.battingOrder || 0))
      };
      
      console.log(`Successfully fetched lineups for game ${gameId}`);
      
      res.json(lineups);
    } catch (error) {
      console.error('Error fetching game lineups:', error);
      res.status(500).json({ 
        error: 'Failed to fetch game lineups',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get combined schedule with odds
  app.get('/api/mlb/complete-schedule', async (req, res) => {
    try {
      // Fetch MLB schedule
      const mlbResponse = await fetch(`http://localhost:5000/api/mlb/schedule`);
      const mlbGames = mlbResponse.ok ? await mlbResponse.json() : [];
      
      // Fetch odds data
      const oddsResponse = await fetch(`http://localhost:5000/api/odds/live/baseball_mlb`);
      const oddsGames = oddsResponse.ok ? await oddsResponse.json() : [];
      
      // Create a map of odds by team names for easier matching
      const oddsMap = new Map();
      oddsGames.forEach((game: any) => {
        const key = `${game.away_team}_${game.home_team}`;
        oddsMap.set(key, game);
      });
      
      // Merge MLB games with odds data
      const completeGames = mlbGames.map((mlbGame: any) => {
        const oddsKey = `${mlbGame.away_team}_${mlbGame.home_team}`;
        const oddsData = oddsMap.get(oddsKey);
        
        return {
          ...mlbGame,
          bookmakers: oddsData?.bookmakers || [],
          hasOdds: !!oddsData
        };
      });
      
      console.log(`Combined ${mlbGames.length} MLB games with ${oddsGames.length} odds games`);
      
      res.json(completeGames);
    } catch (error) {
      console.error('Error fetching complete schedule:', error);
      res.status(500).json({ 
        error: 'Failed to fetch complete schedule',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}