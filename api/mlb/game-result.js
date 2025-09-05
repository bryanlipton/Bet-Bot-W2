export default async function handler(req, res) {
  const { homeTeam, awayTeam, gameId } = req.query;
  
  try {
    // First try to get from your scores endpoint
    const scoresResponse = await fetch(`${req.headers.origin}/api/mlb/scores`);
    const scoresData = await scoresResponse.json();
    
    // Find the matching game in finished games
    const finishedGame = scoresData.finishedGames?.find(game => 
      (game.homeTeam === homeTeam && game.awayTeam === awayTeam) ||
      (game.home_team === homeTeam && game.away_team === awayTeam)
    );
    
    if (finishedGame) {
      return res.json({
        status: 'finished',
        homeScore: finishedGame.homeScore || finishedGame.home_score || 0,
        awayScore: finishedGame.awayScore || finishedGame.away_score || 0
      });
    }
    
    // Check if game is live
    const liveGame = scoresData.liveGames?.find(game => 
      (game.homeTeam === homeTeam && game.awayTeam === awayTeam) ||
      (game.home_team === homeTeam && game.away_team === awayTeam)
    );
    
    if (liveGame) {
      return res.json({
        status: 'in-progress',
        homeScore: liveGame.homeScore || liveGame.home_score || 0,
        awayScore: liveGame.awayScore || liveGame.away_score || 0
      });
    }
    
    // Game not started yet
    res.json({ status: 'pending' });
    
  } catch (error) {
    console.error('Error fetching game result:', error);
    res.status(500).json({ 
      error: 'Failed to fetch game result',
      status: 'pending' // Fallback to pending state
    });
  }
}
