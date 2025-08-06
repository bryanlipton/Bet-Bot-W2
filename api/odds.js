// Working odds API endpoint for MLB games
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const apiKey = process.env.ODDS_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'ODDS_API_KEY not configured',
        success: false 
      });
    }

    // Fetch MLB odds from The Odds API
    const oddsUrl = `https://api.the-odds-api.com/v4/sports/baseball_mlb/odds?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`;
    
    console.log('Fetching MLB odds...');
    
    const response = await fetch(oddsUrl);

    if (!response.ok) {
      throw new Error(`Odds API responded with ${response.status}: ${response.statusText}`);
    }

    const games = await response.json();
    console.log(`Fetched ${games.length} games`);

    // Transform to match your betting bot format
    const transformedGames = games.map(game => ({
      id: game.id,
      sport_key: game.sport_key,
      sport_title: game.sport_title,
      commence_time: game.commence_time,
      home_team: game.home_team,
      away_team: game.away_team,
      homeTeam: game.home_team,
      awayTeam: game.away_team,
      bookmakers: game.bookmakers || [],
      hasOdds: game.bookmakers && game.bookmakers.length > 0
    }));

    // Filter for games with odds
    const gamesWithOdds = transformedGames.filter(game => game.hasOdds);

    return res.status(200).json({
      success: true,
      games: gamesWithOdds,
      totalGames: transformedGames.length,
      gamesWithOdds: gamesWithOdds.length,
      timestamp: new Date().toISOString(),
      source: 'The Odds API'
    });

  } catch (error) {
    console.error('Odds API error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
