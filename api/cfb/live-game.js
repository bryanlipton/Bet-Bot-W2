export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  try {
    const { gameId } = req.query;
    
    if (!gameId) {
      return res.status(400).json({ error: 'Game ID is required' });
    }

    // Fetch from ESPN summary endpoint which has down/distance data
    const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/college-football/summary?event=${gameId}`);
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
    }

    return res.status(200).json({
      gameId: gameId,
      quarter: data.header.status?.period ? `Q${data.header.status.period}` : 'Q1',
      clock: data.header.status?.displayClock || '15:00',
      down: downDistance,
      possession: situation.possession || null,
      yardLine: situation.possessionText || null,
      status: data.header.status?.type?.description || 'In Progress'
    });

  } catch (error) {
    console.error('CFB Live Game API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch live game data' });
  }
}
