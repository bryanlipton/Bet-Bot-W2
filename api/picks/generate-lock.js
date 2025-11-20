export default async function handler(req, res) {
  try {
    // Same process but for lock picks - can use different selection criteria
    const { BettingRecommendationEngine } = await import('../ml/betting-recommendation-engine.js');
    
    // Get games and generate recommendations (same as daily pick)
    const oddsResponse = await fetch(
      `https://api.the-odds-api.com/v4/sports/baseball_mlb/odds?apiKey=${process.env.THE_ODDS_API_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`
    );
    
    const games = await oddsResponse.json();
    const gamesWithOdds = games.filter(game => 
      game.bookmakers && 
      game.bookmakers.length > 0 && 
      game.bookmakers[0].markets &&
      game.bookmakers[0].markets.some(market => market.key === 'h2h')
    );
    
    if (gamesWithOdds.length === 0) {
      return res.status(200).json(null);
    }
    
    const recommendationEngine = new BettingRecommendationEngine();
    const recommendations = await recommendationEngine.generateRecommendations(gamesWithOdds);
    
    if (recommendations.length === 0) {
      return res.status(200).json(null);
    }
    
    // For lock picks, prefer higher grades or different game than daily pick
    const lockRecommendation = recommendations.find(r => 
      recommendationEngine.getGradeValue(r.grade) >= 8 // B+ or higher
    ) || recommendations[Math.min(1, recommendations.length - 1)]; // Second best if available
    
    // Try to enhance with ML prediction from Digital Ocean server
    let mlEnhancement = null;
    try {
      const mlServerUrl = process.env.ML_SERVER_URL || 'http://104.236.118.108:3001';
      console.log(`🤖 Attempting ML enhancement for lock pick from ${mlServerUrl}...`);
      
      const mlResponse = await fetch(`${mlServerUrl}/api/ml-prediction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sport: 'MLB',
          homeTeam: lockRecommendation.homeTeam,
          awayTeam: lockRecommendation.awayTeam,
          gameId: lockRecommendation.gameId,
          gameDate: lockRecommendation.gameTime
        }),
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      if (mlResponse.ok) {
        mlEnhancement = await mlResponse.json();
        console.log(`✅ ML enhancement received for lock: Confidence ${mlEnhancement.confidence}`);
      }
    } catch (error) {
      console.log(`⚠️ ML enhancement unavailable for lock: ${error.message}`);
    }
    
    const lockPick = {
      id: `lock_${new Date().toISOString().split('T')[0]}_${lockRecommendation.gameId}`,
      gameId: lockRecommendation.gameId,
      homeTeam: lockRecommendation.homeTeam,
      awayTeam: lockRecommendation.awayTeam,
      pickTeam: lockRecommendation.selection,
      pickType: "moneyline",
      odds: lockRecommendation.odds,
      grade: mlEnhancement?.grade || lockRecommendation.grade,
      confidence: mlEnhancement?.confidence ? mlEnhancement.confidence * 100 : lockRecommendation.confidence,
      reasoning: mlEnhancement?.reasoning || lockRecommendation.reasoning,
      analysis: lockRecommendation.analysis,
      gameTime: lockRecommendation.gameTime,
      venue: getVenueForTeam(lockRecommendation.homeTeam),
      probablePitchers: {
        home: 'TBD',
        away: 'TBD'
      },
      mlPowered: !!mlEnhancement,
      mlFactors: mlEnhancement?.factors,
      createdAt: new Date().toISOString(),
      pickDate: new Date().toISOString().split('T')[0],
      status: 'pending'
    };
    
    console.log(`✅ Generated lock pick: ${lockPick.pickTeam} ${lockPick.odds > 0 ? '+' : ''}${lockPick.odds} (Grade: ${lockPick.grade}) ${lockPick.mlPowered ? '[ML Enhanced]' : '[BettingEngine]'}`);
    res.status(200).json(lockPick);
    
  } catch (error) {
    console.error('❌ Lock pick generation error:', error);
    res.status(500).json({ error: 'Failed to generate lock pick' });
  }
}

function getVenueForTeam(teamName) {
  const venues = {
    'New York Yankees': 'Yankee Stadium',
    'Boston Red Sox': 'Fenway Park',
    'Los Angeles Dodgers': 'Dodger Stadium',
    'San Francisco Giants': 'Oracle Park',
    'Chicago Cubs': 'Wrigley Field',
    'Colorado Rockies': 'Coors Field'
  };
  return venues[teamName] || 'MLB Stadium';
}
