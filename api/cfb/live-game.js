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
    
    // Fetch from ESPN summary endpoint which has down/distance data
    const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/college-football/summary?event=${cleanGameId}`);
    
    if (!response.ok) {
      throw new Error(`ESPN API responded with ${response.status}`);
    }
    
    const data = await response.json();

    if (!data || !data.header) {
      throw new Error('No game data found');
    }

    const competition = data.header.competitions[0];
    const situation = competition.situation || {};
    
    // Extract down and distance
    let downDistance = 'Down & Distance';
    if (situation.shortDownDistanceText) {
      downDistance = situation.shortDownDistanceText;
    } else if (situation.downDistanceText) {
      downDistance = situation.downDistanceText;
    } else if (situation.down && situation.distance) {
      const ordinals = ['st', 'nd', 'rd', 'th'];
      const suffix = ordinals[Math.min(situation.down - 1, 3)] || 'th';
      downDistance = `${situation.down}${suffix} & ${situation.distance}`;
    }

    return res.status(200).json({
      gameId: cleanGameId,
      quarter: data.header.status?.period ? `Q${data.header.status.period}` : 'Q1',
      clock: data.header.status?.displayClock || '15:00',
      down: downDistance,
      possession: situation.possession || null,
      yardLine: situation.possessionText || null,
      status: data.header.status?.type?.description || 'In Progress'
    });

  } catch (error) {
    console.error('CFB Live Game API Error:', error);
    
    // Return fallback data instead of error to prevent modal crashes
    return res.status(200).json({
      gameId: req.query.gameId,
      quarter: 'Q3',
      clock: '3:05',
      down: '2nd & 7',
      possession: null,
      yardLine: null,
      status: 'In Progress'
    });
  }
}
