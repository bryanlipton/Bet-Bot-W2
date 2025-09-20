export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  try {
    const { gameId } = req.query;
    
    if (!gameId) {
      return res.status(400).json({ error: 'Game ID is required' });
    }

    // Clean the gameId - remove "cfb_" prefix if present
    const cleanGameId = gameId.replace('cfb_', '');
    
    console.log('Fetching ESPN data for gameId:', cleanGameId);
    
    // Try the scoreboard endpoint first (more reliable)
    const scoreboardUrl = `https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard`;
    const scoreboardResponse = await fetch(scoreboardUrl);
    const scoreboardData = await scoreboardResponse.json();
    
    // Find the specific game in the scoreboard
    const game = scoreboardData.events?.find(event => event.id === cleanGameId);
    
    if (game) {
      const competition = game.competitions[0];
      const situation = competition.situation || {};
      const status = game.status || {};
      
      // Extract down and distance
      let downDistance = 'Down & Distance';
      if (situation.shortDownDistanceText) {
        downDistance = situation.shortDownDistanceText;
      } else if (situation.downDistanceText) {
        downDistance = situation.downDistanceText;
      }
      
      console.log('Found game data:', {
        quarter: status.period,
        clock: status.displayClock,
        situation: situation
      });
      
      return res.status(200).json({
        gameId: cleanGameId,
        quarter: status.period ? `Q${status.period}` : 'Q1',
        clock: status.displayClock || '15:00',
        down: downDistance,
        possession: situation.possession || null,
        yardLine: situation.possessionText || null,
        status: status.type?.description || 'In Progress'
      });
    }
    
    // If not found in scoreboard, return current game data
    throw new Error('Game not found in scoreboard');

  } catch (error) {
    console.error('CFB Live Game API Error:', error.message);
    
    // Return error instead of fallback so we can debug
    return res.status(500).json({ 
      error: 'Failed to fetch live game data',
      message: error.message 
    });
  }
}
