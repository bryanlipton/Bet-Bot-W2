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
      score?: number;
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
      score?: number;
    };
  };
  venue: {
    name: string;
  };
  linescore?: {
    currentInning?: number;
    inningState?: string;
    teams?: {
      home?: { runs?: number };
      away?: { runs?: number };
    };
    balls?: number;
    strikes?: number;
    outs?: number;
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
      // Get games from yesterday to next 3 days to show more games
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 1); // Yesterday
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 3); // Next 3 days
      
      const url = `${MLB_API_BASE_URL}/schedule?sportId=1&startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}&hydrate=team,linescore,probablePitcher`;
      
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
          abstractGameState: game.status.abstractGameState,
          homeScore: game.teams.home.score || game.linescore?.teams?.home?.runs,
          awayScore: game.teams.away.score || game.linescore?.teams?.away?.runs,
          linescore: game.linescore,
          probablePitchers: {
            home: game.teams.home.probablePitcher?.fullName || null,
            away: game.teams.away.probablePitcher?.fullName || null
          },
          bookmakers: [] // Will be filled by odds data
        }))
      );
      
      console.log(`Successfully fetched ${games.length} MLB games for date range`);
      
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

  // Get combined schedule with odds (ODDS API DATA TAKES PRIORITY)
  app.get('/api/mlb/complete-schedule', async (req, res) => {
    try {
      console.log('Fetching complete schedule - ODDS API PRIORITY');
      
      // Fetch live odds first (these are the primary games with betting lines)
      const oddsResponse = await fetch(`http://localhost:5000/api/odds/live/baseball_mlb`);
      const oddsGames = oddsResponse.ok ? await oddsResponse.json() : [];
      
      // Fetch MLB schedule for pitcher info
      const mlbResponse = await fetch(`http://localhost:5000/api/mlb/schedule`);
      const mlbGames = mlbResponse.ok ? await mlbResponse.json() : [];
      
      console.log(`Starting with ${oddsGames.length} odds games (PRIORITY), enriching with ${mlbGames.length} MLB games`);
      
      // Start with ALL odds games (these have betting lines)
      const allGames = [...oddsGames.map(game => ({
        ...game,
        hasOdds: true
      }))];
      
      // Enrich odds games with MLB pitcher data
      allGames.forEach(oddsGame => {
        const matchingMLB = mlbGames.find(mlb => {
          // Try exact match first
          if (mlb.home_team === oddsGame.home_team && mlb.away_team === oddsGame.away_team) {
            return true;
          }
          // Try partial team name matches
          const mlbHome = mlb.home_team.toLowerCase();
          const mlbAway = mlb.away_team.toLowerCase();
          const oddsHome = oddsGame.home_team.toLowerCase();
          const oddsAway = oddsGame.away_team.toLowerCase();
          
          return (mlbHome.includes(oddsHome.split(' ').pop()) || oddsHome.includes(mlbHome.split(' ').pop())) &&
                 (mlbAway.includes(oddsAway.split(' ').pop()) || oddsAway.includes(mlbAway.split(' ').pop()));
        });
        
        if (matchingMLB) {
          oddsGame.gameId = matchingMLB.gameId;
          oddsGame.venue = matchingMLB.venue;
          oddsGame.probablePitchers = matchingMLB.probablePitchers;
        }
      });
      
      // Add MLB-only games (no betting lines available)
      mlbGames.forEach(mlbGame => {
        const alreadyExists = allGames.find(game => {
          // Check if this MLB game is already represented
          return (game.home_team === mlbGame.home_team && game.away_team === mlbGame.away_team) ||
                 (game.gameId && game.gameId === mlbGame.gameId);
        });
        
        if (!alreadyExists) {
          allGames.push({
            ...mlbGame,
            hasOdds: false,
            bookmakers: []
          });
        }
      });
      
      console.log(`Final result: ${allGames.length} total games (${oddsGames.length} with odds, ${allGames.length - oddsGames.length} MLB-only)`);
      res.json(allGames);
    } catch (error) {
      console.error('Error fetching complete schedule:', error);
      res.status(500).json({ 
        error: 'Failed to fetch complete schedule',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}