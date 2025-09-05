export default async function handler(req, res) {
  const { homeTeam, awayTeam, gameId } = req.query;
  
  console.log('=== GAME RESULT API CALLED ===');
  console.log('Query params:', { homeTeam, awayTeam, gameId });
  console.log('Request origin:', req.headers.origin);
  
  try {
    const scoresUrl = `${req.headers.origin || 'https://bet-bot-w2.vercel.app'}/api/mlb/scores`;
    console.log('Fetching from:', scoresUrl);
    
    const scoresResponse = await fetch(scoresUrl);
    
    if (!scoresResponse.ok) {
      console.error('Scores API failed:', scoresResponse.status);
      return res.status(500).json({ 
        error: 'Scores API failed',
        status: 'pending'
      });
    }
    
    const scoresData = await scoresResponse.json();
    console.log('Scores data keys:', Object.keys(scoresData));
    console.log('Finished games count:', scoresData.finishedGames?.length);
    console.log('Live games count:', scoresData.liveGames?.length);
    
    // Find the matching game in finished games
    const finishedGame = scoresData.finishedGames?.find(game => {
      const homeMatch = game.homeTeam === homeTeam;
      const awayMatch = game.awayTeam === awayTeam;
      console.log(`Checking finished game: ${game.homeTeam} vs ${game.awayTeam} | Home match: ${homeMatch}, Away match: ${awayMatch}`);
      return homeMatch && awayMatch;
    });
    
    console.log('Found finished game:', finishedGame ? 'YES' : 'NO');
    
    if (finishedGame) {
      const result = {
        status: 'finished',
        homeScore: finishedGame.homeScore,
        awayScore: finishedGame.awayScore
      };
      console.log('Returning finished result:', result);
      return res.json(result);
    }
    
    // Check live games
    const liveGame = scoresData.liveGames?.find(game => {
      const homeMatch = game.homeTeam === homeTeam;
      const awayMatch = game.awayTeam === awayTeam;
      console.log(`Checking live game: ${game.homeTeam} vs ${game.awayTeam} | Home match: ${homeMatch}, Away match: ${awayMatch}`);
      return homeMatch && awayMatch;
    });
    
    console.log('Found live game:', liveGame ? 'YES' : 'NO');
    
    if (liveGame) {
      const result = {
        status: 'in-progress',
        homeScore: liveGame.homeScore || 0,
        awayScore: liveGame.awayScore || 0
      };
      console.log('Returning in-progress result:', result);
      return res.json(result);
    }
    
    console.log('No matching game found, returning pending');
    res.json({ status: 'pending' });
    
  } catch (error) {
    console.error('Detailed error:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: `Failed to fetch game result: ${error.message}`,
      status: 'pending'
    });
  }
}
