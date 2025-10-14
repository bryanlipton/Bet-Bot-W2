export default async function handler(req, res) {
  try {
    console.log('🎯 Starting daily pick generation with BettingRecommendationEngine...');
    
    // Import the recommendation engine
    const { BettingRecommendationEngine } = await import('../ml/betting-recommendation-engine.js');
    
    // Step 1: Get live MLB games
    const oddsResponse = await fetch(
      `https://api.the-odds-api.com/v4/sports/baseball_mlb/odds?apiKey=${process.env.THE_ODDS_API_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`
    );
    
    if (!oddsResponse.ok) {
      throw new Error(`Odds API error: ${oddsResponse.status}`);
    }
    
    const games = await oddsResponse.json();
    console.log(`✅ Fetched ${games.length} live MLB games`);
    
    // Step 2: Filter for games with betting odds
    const gamesWithOdds = games.filter(game => 
      game.bookmakers && 
      game.bookmakers.length > 0 && 
      game.bookmakers[0].markets &&
      game.bookmakers[0].markets.some(market => market.key === 'h2h')
    );
    
    console.log(`💰 Found ${gamesWithOdds.length} games with moneyline odds`);
    
    if (gamesWithOdds.length === 0) {
      return res.status(200).json(null);
    }
    
    // Step 3: Initialize recommendation engine
    const recommendationEngine = new BettingRecommendationEngine();
    
    // Step 4: Generate recommendations
    const recommendations = await recommendationEngine.generateRecommendations(gamesWithOdds);
    console.log(`🤖 Generated ${recommendations.length} valid recommendations`);
    
    if (recommendations.length === 0) {
      return res.status(200).json(null);
    }
    
    // Step 5: Select best recommendation (highest grade/confidence)
    const bestRecommendation = recommendations[0];
    
    // Step 5.5: Try to enhance with ML prediction from Digital Ocean server
    let mlEnhancement = null;
    try {
      const mlServerUrl = process.env.ML_SERVER_URL || 'http://104.236.118.108:3001';
      console.log(`🤖 Attempting ML enhancement from ${mlServerUrl}...`);
      
      const mlResponse = await fetch(`${mlServerUrl}/api/ml-prediction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sport: 'MLB',
          homeTeam: bestRecommendation.homeTeam,
          awayTeam: bestRecommendation.awayTeam,
          gameId: bestRecommendation.gameId,
          gameDate: bestRecommendation.gameTime
        }),
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      if (mlResponse.ok) {
        mlEnhancement = await mlResponse.json();
        console.log(`✅ ML enhancement received: Confidence ${mlEnhancement.confidence}`);
      }
    } catch (error) {
      console.log(`⚠️ ML enhancement unavailable: ${error.message}`);
    }
    
    // Step 6: Convert to daily pick format (enhanced with ML if available)
    const dailyPick = {
      id: `pick_${new Date().toISOString().split('T')[0]}_${bestRecommendation.gameId}`,
      gameId: bestRecommendation.gameId,
      homeTeam: bestRecommendation.homeTeam,
      awayTeam: bestRecommendation.awayTeam,
      pickTeam: bestRecommendation.selection,
      pickType: "moneyline",
      odds: bestRecommendation.odds,
      grade: mlEnhancement?.grade || bestRecommendation.grade,
      confidence: mlEnhancement?.confidence ? mlEnhancement.confidence * 100 : bestRecommendation.confidence,
      reasoning: mlEnhancement?.reasoning || bestRecommendation.reasoning,
      analysis: bestRecommendation.analysis,
      gameTime: bestRecommendation.gameTime,
      venue: getVenueForTeam(bestRecommendation.homeTeam),
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
    
    console.log(`✅ Generated daily pick: ${dailyPick.pickTeam} ${dailyPick.odds > 0 ? '+' : ''}${dailyPick.odds} (Grade: ${dailyPick.grade}) ${dailyPick.mlPowered ? '[ML Enhanced]' : '[BettingEngine]'}`);
    res.status(200).json(dailyPick);
    
  } catch (error) {
    console.error('❌ Daily pick generation error:', error);
    res.status(500).json({ error: 'Failed to generate daily pick', details: error.message });
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
