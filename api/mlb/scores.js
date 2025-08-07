export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  try {
    // Always use today's date
    const today = new Date().toISOString().split('T')[0];
    
    const response = await fetch(
      `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${today}&hydrate=team,linescore,venue,probablePitcher,weather`
    );
    
    if (!response.ok) {
      throw new Error(`MLB API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    const scores = data.dates.flatMap(date => 
      date.games.map((game) => ({
        id: `mlb_${game.gamePk}`,
        gameId: game.gamePk,
        homeTeam: game.teams.home.team.name,
        awayTeam: game.teams.away.team.name,
        homeScore: game.teams.home.score || 0,
        awayScore: game.teams.away.score || 0,
        status: game.status.detailedState || 'Scheduled',
        startTime: game.gameDate,
        venue: game.venue?.name || '',
        sportKey: 'baseball_mlb'
      }))
    );
    
    res.status(200).json(scores);
    
  } catch (error) {
    console.error('Error fetching MLB scores:', error);
    res.status(500).json({ error: "Failed to fetch scores" });
  }
}
