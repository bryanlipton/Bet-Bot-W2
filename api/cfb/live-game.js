export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  try {
    const { gameId } = req.query;
    
    if (!gameId) {
      return res.status(400).json({ error: 'Game ID is required' });
    }
    
    const cleanGameId = gameId.replace('cfb_', '');
    
    // Try multiple ESPN endpoints in order of preference
    const endpoints = [
      `https://site.api.espn.com/apis/site/v2/sports/football/college-football/summary?event=${cleanGameId}`,
      `https://sports.core.api.espn.com/v2/sports/football/leagues/college-football/events/${cleanGameId}`,
      `https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard`,
      `https://site.api.espn.com/apis/site/v2/sports/football/college-football/summary?event=${cleanGameId}&enable=boxscore`,
      `https://sports.core.api.espn.com/v2/sports/football/leagues/college-football/events/${cleanGameId}/competitions`
    ];
    
    let gameData = null;
    let situation = {};
    let teams = { home: null, away: null };
    
    // Try each endpoint until we find detailed data
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint}`);
        const response = await fetch(endpoint, {
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        
        if (!response.ok) continue;
        
        const data = await response.json();
        
        // Handle different data structures based on endpoint
        if (endpoint.includes('summary')) {
          if (data.header) {
            gameData = data.header;
            situation = data.header.competitions?.[0]?.situation || {};
            // Extract team info for possession mapping
            const competition = data.header.competitions?.[0];
            if (competition?.competitors) {
              teams.home = competition.competitors.find(c => c.homeAway === 'home')?.team;
              teams.away = competition.competitors.find(c => c.homeAway === 'away')?.team;
            }
            break;
          }
        } else if (endpoint.includes('scoreboard')) {
          const game = data.events?.find(event => event.id === cleanGameId);
          if (game) {
            gameData = game;
            situation = game.competitions?.[0]?.situation || {};
            // Extract team info for possession mapping
            const competition = game.competitions?.[0];
            if (competition?.competitors) {
              teams.home = competition.competitors.find(c => c.homeAway === 'home')?.team;
              teams.away = competition.competitors.find(c => c.homeAway === 'away')?.team;
            }
            break;
          }
        } else {
          // Core API endpoints
          if (data.competitions) {
            gameData = data;
            situation = data.competitions?.[0]?.situation || {};
            // Extract team info for possession mapping
            const competition = data.competitions?.[0];
            if (competition?.competitors) {
              teams.home = competition.competitors.find(c => c.homeAway === 'home')?.team;
              teams.away = competition.competitors.find(c => c.homeAway === 'away')?.team;
            }
            break;
          }
        }
      } catch (error) {
        console.log(`Endpoint failed: ${endpoint} - ${error.message}`);
        continue;
      }
    }
    
    if (!gameData) {
      throw new Error('No game data found from any endpoint');
    }
    
    // Extract down and distance - only if we have real data
    let downDistance = null;
    if (situation.shortDownDistanceText) {
      downDistance = situation.shortDownDistanceText;
    } else if (situation.downDistanceText) {
      downDistance = situation.downDistanceText;
    } else if (situation.down && situation.distance) {
      const ordinals = ['st', 'nd', 'rd', 'th'];
      const suffix = ordinals[Math.min(situation.down - 1, 3)] || 'th';
      downDistance = `${situation.down}${suffix} & ${situation.distance}`;
    }
    
    // Extract possession - map team ID to team name if possible
    let possession = null;
    if (situation.possession) {
      // If possession is a number (team ID), try to map it to team name
      if (typeof situation.possession === 'string' && !isNaN(situation.possession)) {
        const teamId = situation.possession;
        if (teams.home?.id === teamId) {
          possession = teams.home.displayName || teams.home.name;
        } else if (teams.away?.id === teamId) {
          possession = teams.away.displayName || teams.away.name;
        }
      } else if (typeof situation.possession === 'string') {
        // possession is already a team name or abbreviation
        possession = situation.possession;
      }
    }
    
    // Extract yard line - only if we have real data
    let yardLine = null;
    if (situation.possessionText) {
      yardLine = situation.possessionText;
    }
    
    const status = gameData.status || {};
    
    console.log('Extracted data:', {
      down: downDistance,
      possession: possession,
      yardLine: yardLine,
      situationRaw: situation
    });
    
    return res.status(200).json({
      gameId: cleanGameId,
      quarter: status.period ? `Q${status.period}` : null,
      clock: status.displayClock || null,
      down: downDistance,
      possession: possession,
      yardLine: yardLine,
      status: status.type?.description || 'In Progress'
    });
    
  } catch (error) {
    console.error('CFB Live Game API Error:', error.message);
    
    return res.status(500).json({ 
      error: 'Failed to fetch live game data',
      message: error.message 
    });
  }
}
