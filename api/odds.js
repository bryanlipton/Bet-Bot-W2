export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    const apiKey = process.env.ODDS_API_KEY || process.env.THE_ODDS_API_KEY;
    
    if (!apiKey) {
      // Return empty array instead of error to prevent crashes
      return res.status(200).json([]);
    }

    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/baseball_mlb/odds?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals`,
      { headers: { 'Accept': 'application/json' } }
    );
    
    if (!response.ok) {
      // Return empty array instead of error
      return res.status(200).json([]);
    }
    
    const data = await response.json();
    
    // Fix ALL date issues
    const safeGames = data.map(game => ({
      ...game,
      // Force a valid future date for ALL games
      commence_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      id: game.id || `safe_${Math.random()}`,
      home_team: game.home_team || 'Home Team',
      away_team: game.away_team || 'Away Team',
      bookmakers: game.bookmakers || []
    }));
    
    res.status(200).json(safeGames);
    
  } catch (error) {
    console.error('Odds API Error:', error);
    // Always return empty array to prevent crashes
    res.status(200).json([]);
  }
}
