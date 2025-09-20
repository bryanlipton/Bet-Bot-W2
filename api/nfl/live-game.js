export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  try {
    const { gameId } = req.query;
    const { homeTeam, awayTeam } = req.query;
    
    if (!gameId) {
      return res.status(400).json({ error: 'Game ID is required' });
    }
    
    console.log(`Fetching NFL live data for game ${gameId}: ${awayTeam} @ ${homeTeam}`);
    
    // ESPN NFL API endpoints for live data
    const nflUrls = [
      `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${gameId}`,
      `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/${gameId}`,
      `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard`,
    ];
    
    for (const url of nflUrls) {
      try {
        console.log(`Trying NFL API: ${url}`);
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Success with ${url}`);
          
          // Extract live game data from ESPN NFL API response
          let gameData, competition, status, clock, scores;
          
          if (data.header) {
            // ESPN summary format
            gameData = data.header.competitions[0];
            competition = gameData;
            status = gameData.status;
            clock = status?.displayClock;
            scores = {
              home: parseInt(gameData.competitors.find(c => c.homeAway === 'home')?.score || 0),
              away: parseInt(gameData.competitors.find(c => c.homeAway === 'away')?.score || 0)
            };
          } else if (data.events && Array.isArray(data.events)) {
            // ESPN scoreboard format - find matching game
            const game = data.events.find(e => e.id === gameId);
            if (game) {
              competition = game.competitions[0];
              status = competition.status;
              clock = status?.displayClock;
              scores = {
                home: parseInt(competition.competitors.find(c => c.homeAway === 'home')?.score || 0),
                away: parseInt(competition.competitors.find(c => c.homeAway === 'away')?.score || 0)
              };
            }
          } else if (data.competitions) {
            // Direct competition format
            competition = data.competitions[0] || data;
            status = competition.status || data.status;
            clock = status?.displayClock;
            scores = {
              home: parseInt(competition.competitors?.find(c => c.homeAway === 'home')?.score || 0),
              away: parseInt(competition.competitors?.find(c => c.homeAway === 'away')?.score || 0)
            };
          }
          
          if (competition && status) {
            // Build comprehensive live game response
            const situation = competition.situation || {};
            const homeCompetitor = competition.competitors?.find(c => c.homeAway === 'home');
            const awayCompetitor = competition.competitors?.find(c => c.homeAway === 'away');
            
            const result = {
              gameId: gameId,
              status: {
                detailed: status.type?.description || 'Unknown',
                abstract: status.type?.state || 'Unknown',
                inProgress: status.type?.state === 'in' || false
              },
              score: scores,
              quarter: status.period ? `Q${status.period}` : 'Q1',
              clock: clock || '15:00',
              down: situation.shortDownDistanceText || situation.downDistanceText || null,
              possession: situation.possession || null,
              yardLine: situation.possessionText || null,
              redZone: situation.isRedZone || false,
              teams: {
                home: {
                  name: homeCompetitor?.team?.displayName || homeCompetitor?.team?.name || homeTeam,
                  abbreviation: homeCompetitor?.team?.abbreviation || 'HOME',
                  score: scores.home,
                  timeouts: homeCompetitor?.timeouts || 3
                },
                away: {
                  name: awayCompetitor?.team?.displayName || awayCompetitor?.team?.name || awayTeam,
                  abbreviation: awayCompetitor?.team?.abbreviation || 'AWAY', 
                  score: scores.away,
                  timeouts: awayCompetitor?.timeouts || 3
                }
              },
              venue: competition.venue?.fullName || 'Unknown Venue',
              weather: competition.weather ? {
                temperature: competition.weather.temperature,
                conditions: competition.weather.conditionId,
                wind: competition.weather.wind
              } : null,
              lastUpdate: new Date().toISOString(),
              apiSource: url
            };
            
            console.log(`✅ Returning NFL live data:`, JSON.stringify(result, null, 2));
            return res.status(200).json(result);
          }
        }
      } catch (error) {
        console.log(`❌ Error with ${url}:`, error.message);
        continue;
      }
    }
    
    // Final fallback
    console.log(`❌ All NFL API calls failed, returning fallback`);
    res.status(200).json({
      gameId: gameId,
      status: { detailed: 'Scheduled', abstract: 'Preview', inProgress: false },
      score: { home: 0, away: 0 },
      quarter: 'Q1',
      clock: '15:00',
      down: null,
      possession: null,
      yardLine: null,
      redZone: false,
      teams: {
        home: { name: homeTeam || 'Home Team', abbreviation: 'HOME', score: 0, timeouts: 3 },
        away: { name: awayTeam || 'Away Team', abbreviation: 'AWAY', score: 0, timeouts: 3 }
      },
      venue: 'Unknown Venue',
      weather: null,
      lastUpdate: new Date().toISOString(),
      note: 'Could not fetch live data from any NFL API'
    });
    
  } catch (error) {
    console.error('NFL Live game API error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch live game data',
      message: error.message,
      gameId: gameId
    });
  }
}
