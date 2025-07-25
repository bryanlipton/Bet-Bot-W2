import { Express } from "express";

const MLB_API_BASE_URL = "https://statsapi.mlb.com/api/v1";

// Manual pitcher overrides for when MLB API doesn't have the information yet
const PITCHER_OVERRIDES: { [gameId: string]: { home?: string; away?: string } } = {
  // July 18, 2025 - Mets games
  "777087": { home: "Sean Manaea" }, // Cincinnati Reds @ New York Mets
  "777061": { home: "Sean Manaea" }, // Los Angeles Angels @ New York Mets
};

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
  // Get live game data with detailed real-time information
  app.get('/api/mlb/game/:gameId/live', async (req, res) => {
    try {
      const { gameId } = req.params;
      const { homeTeam, awayTeam } = req.query;
      console.log(`Fetching live data for game ${gameId}`);
      console.log(`Team names from query: home='${homeTeam}', away='${awayTeam}'`);
      
      let data;
      let isLiveFeed = false;
      
      // Try live feed first
      const liveUrl = `${MLB_API_BASE_URL}/game/${gameId}/feed/live`;
      const response = await fetch(liveUrl);
      
      if (response.ok) {
        data = await response.json();
        isLiveFeed = true;
        console.log(`Retrieved live feed data for game ${gameId}`);
      } else {
        console.log(`Live feed not available for game ${gameId} (${response.status}), trying scores API for live data`);
        
        // Try to get live data from scores API which has inning information
        try {
          const today = new Date().toISOString().split('T')[0];
          const scoresResponse = await fetch(`${MLB_API_BASE_URL}/schedule?sportId=1&date=${today}&hydrate=team,linescore`);
          if (scoresResponse.ok) {
            const scoresData = await scoresResponse.json();
            const game = scoresData.dates?.[0]?.games?.find((g: any) => g.gamePk.toString() === gameId);
            
            if (game && game.linescore) {
              // Found game with linescore data - use it for live information
              const linescore = game.linescore;
              const gameData = game;
              
              // Extract actual live player information from enhanced hydration
              const battingTeam = linescore.inningState === 'Top' ? gameData.teams.away.team : gameData.teams.home.team;
              const pitchingTeam = linescore.inningState === 'Top' ? gameData.teams.home.team : gameData.teams.away.team;
              
              // Get current batter from linescore offense data
              let currentBatter = {
                id: null,
                name: `${battingTeam.abbreviation || battingTeam.name} Batter`,
                team: battingTeam.abbreviation || battingTeam.name.split(' ').pop()?.toUpperCase() || 'N/A'
              };
              
              if (linescore.offense?.batter) {
                currentBatter = {
                  id: linescore.offense.batter.id,
                  name: linescore.offense.batter.fullName || linescore.offense.batter.nameFirstLast,
                  team: battingTeam.abbreviation || battingTeam.name.split(' ').pop()?.toUpperCase() || 'N/A'
                };
              }
              
              // Get current pitcher from linescore defense data
              let currentPitcher = {
                id: null,
                name: `${pitchingTeam.abbreviation || pitchingTeam.name} Pitcher`
              };
              
              if (linescore.defense?.pitcher) {
                currentPitcher = {
                  id: linescore.defense.pitcher.id,
                  name: linescore.defense.pitcher.fullName || linescore.defense.pitcher.nameFirstLast
                };
              }
              
              // Extract base runners if available (use fullName property to match frontend expectations)
              let baseRunners = { first: null, second: null, third: null };
              if (linescore.offense) {
                if (linescore.offense.first) {
                  baseRunners.first = {
                    id: linescore.offense.first.id,
                    fullName: linescore.offense.first.fullName || linescore.offense.first.nameFirstLast,
                    name: linescore.offense.first.fullName || linescore.offense.first.nameFirstLast
                  };
                }
                if (linescore.offense.second) {
                  baseRunners.second = {
                    id: linescore.offense.second.id,
                    fullName: linescore.offense.second.fullName || linescore.offense.second.nameFirstLast,
                    name: linescore.offense.second.fullName || linescore.offense.second.nameFirstLast
                  };
                }
                if (linescore.offense.third) {
                  baseRunners.third = {
                    id: linescore.offense.third.id,
                    fullName: linescore.offense.third.fullName || linescore.offense.third.nameFirstLast,
                    name: linescore.offense.third.fullName || linescore.offense.third.nameFirstLast
                  };
                }
              }
              

              
              const liveGameData = {
                gameId: gameId,
                status: {
                  detailed: gameData.status.detailedState,
                  abstract: gameData.status.abstractGameState,
                  inProgress: gameData.status.abstractGameState === 'Live'
                },
                score: {
                  home: linescore.teams?.home?.runs || 0,
                  away: linescore.teams?.away?.runs || 0
                },
                inning: {
                  current: linescore.currentInning || 1,
                  state: linescore.inningState || 'Top',
                  half: linescore.inningHalf || 'top'
                },
                count: {
                  balls: linescore.balls || 0,
                  strikes: linescore.strikes || 0,
                  outs: linescore.outs || 0
                },
                currentBatter,
                currentPitcher,
                baseRunners,
                recentPlays: [],
                teams: {
                  home: {
                    name: gameData.teams.home.team.name,
                    abbreviation: gameData.teams.home.team.abbreviation || gameData.teams.home.team.name.split(' ').pop()?.toUpperCase() || 'HOME'
                  },
                  away: {
                    name: gameData.teams.away.team.name,
                    abbreviation: gameData.teams.away.team.abbreviation || gameData.teams.away.team.name.split(' ').pop()?.toUpperCase() || 'AWAY'
                  }
                },
                lastUpdate: new Date().toISOString()
              };
              
              console.log(`Using scores API data for game ${gameId}:`, {
                status: liveGameData.status.detailed,
                inning: `${liveGameData.inning.state} ${liveGameData.inning.current}`,
                count: `${liveGameData.count.balls}-${liveGameData.count.strikes}`,
                outs: liveGameData.count.outs
              });
              
              res.json(liveGameData);
              return;
            }
          }
        } catch (error) {
          console.log('Could not fetch live data from scores API');
        }
        
        // Fallback - Try to get actual team names from MLB schedule API
        let actualHomeTeam = homeTeam || 'Home Team';
        let actualAwayTeam = awayTeam || 'Away Team';
        
        try {
          const today = new Date().toISOString().split('T')[0];
          const altResponse = await fetch(`${MLB_API_BASE_URL}/schedule?sportId=1&date=${today}&hydrate=team`);
          if (altResponse.ok) {
            const altData = await altResponse.json();
            const game = altData.dates?.[0]?.games?.find((g: any) => g.gamePk.toString() === gameId);
            if (game) {
              actualHomeTeam = game.teams.home.team.name;
              actualAwayTeam = game.teams.away.team.name;
            }
          }
        } catch (error) {
          console.log('Could not fetch team names from MLB API, using provided names');
        }
        
        // Return minimal data for scheduled games with actual team names
        const fallbackData = {
          gameId: gameId,
          status: {
            detailed: 'Scheduled',
            abstract: 'Preview',
            inProgress: false
          },
          score: {
            home: 0,
            away: 0
          },
          inning: {
            current: 1,
            state: 'Top',
            half: 'top'
          },
          count: {
            balls: 0,
            strikes: 0,
            outs: 0
          },
          currentBatter: {
            id: null,
            name: 'Game not started',
            team: 'N/A'
          },
          currentPitcher: {
            id: null,
            name: 'Game not started',
            pitchCount: 0
          },
          baseRunners: {
            first: null,
            second: null,
            third: null
          },
          recentPlays: [],
          teams: {
            home: {
              name: actualHomeTeam,
              abbreviation: actualHomeTeam.split(' ').pop()?.toUpperCase() || 'HOME'
            },
            away: {
              name: actualAwayTeam,
              abbreviation: actualAwayTeam.split(' ').pop()?.toUpperCase() || 'AWAY'
            }
          },
          lastUpdate: new Date().toISOString(),
          note: 'Game has not started yet'
        };
        
        res.json(fallbackData);
        return;
      }
      
      if (!isLiveFeed) {
        throw new Error('No data source available');
      }
      
      // Extract live game information
      const gameData = data.gameData;
      const liveData = data.liveData;
      
      // Current play information
      const currentPlay = liveData?.plays?.currentPlay || {};
      const linescore = liveData?.linescore || {};
      
      // Current batter and pitcher
      const currentBatter = currentPlay?.matchup?.batter || {};
      const currentPitcher = currentPlay?.matchup?.pitcher || {};
      
      // Base runners
      const runners = currentPlay?.runners || [];
      const bases = {
        first: runners.find((r: any) => r.movement?.end === '1B')?.details?.runner || null,
        second: runners.find((r: any) => r.movement?.end === '2B')?.details?.runner || null,
        third: runners.find((r: any) => r.movement?.end === '3B')?.details?.runner || null
      };
      
      // Recent plays (last 5)
      const allPlays = liveData?.plays?.allPlays || [];
      const recentPlays = allPlays.slice(-5).map((play: any) => ({
        id: play.about?.atBatIndex,
        description: play.result?.description || play.playEvents?.[play.playEvents.length - 1]?.details?.description,
        inning: play.about?.inning,
        halfInning: play.about?.halfInning,
        outs: play.count?.outs,
        result: play.result?.event
      }));
      
      // Count and situation
      const count = currentPlay?.count || {};
      const currentInning = linescore?.currentInning || 1;
      const inningState = linescore?.inningState || 'Top';
      const currentInningHalf = linescore?.inningHalf || 'top';
      
      // Scores
      const homeScore = linescore?.teams?.home?.runs || 0;
      const awayScore = linescore?.teams?.away?.runs || 0;
      
      // Game status
      const gameStatus = gameData?.status?.detailedState || 'Unknown';
      const abstractState = gameData?.status?.abstractGameState || 'Unknown';
      
      const liveGameData = {
        gameId: gameId,
        status: {
          detailed: gameStatus,
          abstract: abstractState,
          inProgress: abstractState === 'Live'
        },
        score: {
          home: homeScore,
          away: awayScore
        },
        inning: {
          current: currentInning,
          state: inningState,
          half: currentInningHalf
        },
        count: {
          balls: count.balls || 0,
          strikes: count.strikes || 0,
          outs: count.outs || 0
        },
        currentBatter: {
          id: currentBatter.id,
          name: currentBatter.fullName || 'Unknown Batter',
          team: currentPlay?.matchup?.batSide?.description || 'Unknown'
        },
        currentPitcher: {
          id: currentPitcher.id,
          name: currentPitcher.fullName || 'Unknown Pitcher'
        },
        baseRunners: bases,
        recentPlays: recentPlays,
        teams: {
          home: {
            name: gameData?.teams?.home?.name || 'Home Team',
            abbreviation: gameData?.teams?.home?.abbreviation || 'HOME'
          },
          away: {
            name: gameData?.teams?.away?.name || 'Away Team',
            abbreviation: gameData?.teams?.away?.abbreviation || 'AWAY'
          }
        },
        lastUpdate: new Date().toISOString()
      };
      
      console.log(`Live data for game ${gameId}:`, {
        status: liveGameData.status.detailed,
        inning: `${liveGameData.inning.state} ${liveGameData.inning.current}`,
        count: `${liveGameData.count.balls}-${liveGameData.count.strikes}`,
        outs: liveGameData.count.outs,
        batter: liveGameData.currentBatter.name
      });
      
      res.json(liveGameData);
    } catch (error) {
      console.error(`Error fetching live data for game ${req.params.gameId}:`, error);
      
      const { homeTeam, awayTeam } = req.query;
      
      // Try to provide fallback data for scheduled games
      try {
        // Try to get actual team names from MLB schedule API
        let actualHomeTeam = homeTeam || 'Home Team';
        let actualAwayTeam = awayTeam || 'Away Team';
        
        try {
          const today = new Date().toISOString().split('T')[0];
          const altResponse = await fetch(`${MLB_API_BASE_URL}/schedule?sportId=1&date=${today}&hydrate=team`);
          if (altResponse.ok) {
            const altData = await altResponse.json();
            const game = altData.dates?.[0]?.games?.find((g: any) => g.gamePk.toString() === req.params.gameId);
            if (game) {
              actualHomeTeam = game.teams.home.team.name;
              actualAwayTeam = game.teams.away.team.name;
            }
          }
        } catch (mlbError) {
          console.log('Could not fetch team names from MLB API in error handler, using provided names');
        }
        
        const fallbackData = {
          gameId: req.params.gameId,
          status: {
            detailed: 'Scheduled',
            abstract: 'Preview',
            inProgress: false
          },
          score: {
            home: 0,
            away: 0
          },
          inning: {
            current: 1,
            state: 'Top',
            half: 'top'
          },
          count: {
            balls: 0,
            strikes: 0,
            outs: 0
          },
          currentBatter: {
            id: null,
            name: 'Game not started',
            team: 'N/A'
          },
          currentPitcher: {
            id: null,
            name: 'Game not started',
            pitchCount: 0
          },
          baseRunners: {
            first: null,
            second: null,
            third: null
          },
          recentPlays: [],
          teams: {
            home: {
              name: actualHomeTeam,
              abbreviation: actualHomeTeam.split(' ').pop()?.toUpperCase() || 'HOME'
            },
            away: {
              name: actualAwayTeam,
              abbreviation: actualAwayTeam.split(' ').pop()?.toUpperCase() || 'AWAY'
            }
          },
          lastUpdate: new Date().toISOString(),
          note: 'Game has not started yet'
        };
        
        res.json(fallbackData);
      } catch (fallbackError) {
        res.status(500).json({ 
          error: 'Failed to fetch live game data',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  });

  // Get today's MLB schedule
  app.get('/api/mlb/schedule', async (req, res) => {
    try {
      // Get games for current day and next day only (as requested)
      const today = new Date();
      const startDate = new Date(today);
      // For current day
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 1); // Next day only
      
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
        date.games.map(game => {
          // Apply pitcher overrides for Mets games if needed
          const homePitcher = game.teams.home.probablePitcher?.fullName || PITCHER_OVERRIDES[game.gamePk]?.home || null;
          const awayPitcher = game.teams.away.probablePitcher?.fullName || PITCHER_OVERRIDES[game.gamePk]?.away || null;
          
          // Log when we use manual overrides
          if (PITCHER_OVERRIDES[game.gamePk]) {
            console.log(`Using manual pitcher override for game ${game.gamePk}: ${game.teams.away.team.name} @ ${game.teams.home.team.name}`);
            if (PITCHER_OVERRIDES[game.gamePk].home) {
              console.log(`  Home pitcher override: ${PITCHER_OVERRIDES[game.gamePk].home}`);
            }
            if (PITCHER_OVERRIDES[game.gamePk].away) {
              console.log(`  Away pitcher override: ${PITCHER_OVERRIDES[game.gamePk].away}`);
            }
          }
          
          return ({
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
            home: homePitcher,
            away: awayPitcher
          },

          bookmakers: [] // Will be filled by odds data
        });
      })
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
      
      // Try multiple endpoints to get lineup data
      const endpoints = [
        `${MLB_API_BASE_URL}/game/${gameId}/linescore`,
        `${MLB_API_BASE_URL}/game/${gameId}/boxscore`,
        `${MLB_API_BASE_URL}/game/${gameId}/content`
      ];
      
      let lineups = { home: [], away: [] };
      let dataFound = false;
      
      for (const url of endpoints) {
        try {
          console.log(`Fetching lineups for game ${gameId} from: ${url}`);
          
          const response = await fetch(url);
          
          if (!response.ok) {
            console.log(`Endpoint ${url} failed: ${response.status} ${response.statusText}`);
            continue;
          }
          
          const data = await response.json();
          
          // Try different data structures based on endpoint
          let homeLineup = [];
          let awayLineup = [];
          
          if (data.teams?.home?.batters && data.teams?.home?.players) {
            // Boxscore format - batters are player IDs, players object has full data
            const homeBatterIds = data.teams.home.batters;
            const awayBatterIds = data.teams.away.batters;
            const homePlayers = data.teams.home.players;
            const awayPlayers = data.teams.away.players;
            
            console.log(`Found boxscore data: ${homeBatterIds.length} home batters, ${awayBatterIds.length} away batters`);
            
            // Map player IDs to full player objects with actual lineup position
            homeLineup = homeBatterIds.map((playerId: any, index: number) => {
              const player = homePlayers[`ID${playerId}`] || {};
              return {
                id: playerId,
                person: player.person || {},
                position: player.position || {},
                allPositions: player.allPositions || [],
                battingOrder: index + 1, // Use actual batting order from lineup position
                stats: player.stats || {}
              };
            });
            
            awayLineup = awayBatterIds.map((playerId: any, index: number) => {
              const player = awayPlayers[`ID${playerId}`] || {};
              return {
                id: playerId,
                person: player.person || {},
                position: player.position || {},
                allPositions: player.allPositions || [],
                battingOrder: index + 1, // Use actual batting order from lineup position
                stats: player.stats || {}
              };
            });
            
            console.log(`Mapped lineup data: ${homeLineup.length} home, ${awayLineup.length} away`);
            console.log(`Sample home player:`, homeLineup[0] ? JSON.stringify(homeLineup[0], null, 2) : 'None');
          } else if (data.teams?.home?.players) {
            // Game content format - extract batters from players
            const homePlayers = data.teams.home.players;
            const awayPlayers = data.teams.away.players;
            
            homeLineup = Object.values(homePlayers).filter((player: any) => 
              player.stats?.batting && player.gameStatus?.isCurrentBatter !== undefined
            );
            awayLineup = Object.values(awayPlayers).filter((player: any) => 
              player.stats?.batting && player.gameStatus?.isCurrentBatter !== undefined
            );
            console.log(`Found lineup data in players format: ${homeLineup.length} home, ${awayLineup.length} away`);
          }
          
          if (homeLineup.length > 0 || awayLineup.length > 0) {
            console.log(`Processing lineups - home: ${homeLineup.length}, away: ${awayLineup.length}`);
            
            const processedHomeLineup = homeLineup.map((player: any, index: number) => {
              const battingOrder = player.battingOrder || 
                                  player.stats?.batting?.battingOrder || 
                                  player.positionInBattingOrder ||
                                  (index < 9 ? index + 1 : null); // Fallback for starting 9
              
              const result = {
                id: player.person?.id || player.id || `home-${index}`,
                name: player.person?.fullName || player.fullName || `Player ${index + 1}`,
                position: player.position?.abbreviation || player.primaryPosition?.abbreviation || player.position?.name || 'IF',
                battingOrder: battingOrder
              };
              
              console.log(`Home player ${index}:`, {
                name: result.name,
                position: result.position,
                battingOrder: result.battingOrder,
                rawPlayer: {
                  battingOrder: player.battingOrder,
                  statsOrder: player.stats?.batting?.battingOrder,
                  positionOrder: player.positionInBattingOrder
                }
              });
              
              return result;
            }).filter((player: any) => player.battingOrder && player.battingOrder <= 9)
              .sort((a: any, b: any) => (a.battingOrder || 0) - (b.battingOrder || 0));
            
            const processedAwayLineup = awayLineup.map((player: any, index: number) => {
              const battingOrder = player.battingOrder || 
                                  player.stats?.batting?.battingOrder || 
                                  player.positionInBattingOrder ||
                                  (index < 9 ? index + 1 : null); // Fallback for starting 9
              
              const result = {
                id: player.person?.id || player.id || `away-${index}`,
                name: player.person?.fullName || player.fullName || `Player ${index + 1}`,
                position: player.position?.abbreviation || player.primaryPosition?.abbreviation || player.position?.name || 'IF',
                battingOrder: battingOrder
              };
              
              console.log(`Away player ${index}:`, {
                name: result.name,
                position: result.position,
                battingOrder: result.battingOrder,
                rawPlayer: {
                  battingOrder: player.battingOrder,
                  statsOrder: player.stats?.batting?.battingOrder,
                  positionOrder: player.positionInBattingOrder
                }
              });
              
              return result;
            }).filter((player: any) => player.battingOrder && player.battingOrder <= 9)
              .sort((a: any, b: any) => (a.battingOrder || 0) - (b.battingOrder || 0));
            
            console.log(`Processed lineups - home: ${processedHomeLineup.length}, away: ${processedAwayLineup.length}`);
            
            // Accept lineups if we have any processed players (not requiring batting orders)
            if (processedHomeLineup.length > 0 || processedAwayLineup.length > 0) {
              lineups = {
                home: processedHomeLineup,
                away: processedAwayLineup
              };
              dataFound = true;
              break;
            }
          }
        } catch (endpointError) {
          console.log(`Error with endpoint ${url}:`, endpointError);
          continue;
        }
      }
      
      if (!dataFound) {
        console.log(`No lineup data found for game ${gameId} from any endpoint - lineups will show TBD`);
        // Return empty arrays so frontend displays "TBD" for lineups
      }
      
      console.log(`Successfully processed lineups for game ${gameId}: ${lineups.home.length} home, ${lineups.away.length} away`);
      
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
      console.log('Fetching complete schedule - USING CACHED ODDS SERVICE');
      
      // Use cached odds service instead of direct API calls (SAVES API QUOTA)
      const { oddsApiService } = await import('./services/oddsApi');
      const oddsGames = await oddsApiService.getCurrentOdds('baseball_mlb');
      
      // Fetch MLB schedule for pitcher info
      const mlbResponse = await fetch(`http://localhost:5000/api/mlb/schedule`);
      const mlbGames = mlbResponse.ok ? await mlbResponse.json() : [];
      
      console.log(`Starting with ${oddsGames.length} odds games (PRIORITY), enriching with ${mlbGames.length} MLB games`);
      
      // Start with ALL odds games (these have betting lines)
      const allGames = [...oddsGames.map(game => ({
        ...game,
        hasOdds: true,
        // Ensure consistent naming - explicitly set camelCase fields
        homeTeam: game.home_team,
        awayTeam: game.away_team
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
            bookmakers: [],
            // Ensure consistent naming for MLB games too - explicitly use existing fields
            homeTeam: mlbGame.home_team,
            awayTeam: mlbGame.away_team
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