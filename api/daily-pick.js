// api/daily-pick.js - Simple working version
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    console.log('📅 Daily pick request received');
    
    const { date = new Date().toISOString().split('T')[0] } = req.query;
    
    // Try to call ML server first
    const mlServerUrl = process.env.ML_SERVER_URL;
    
    if (mlServerUrl) {
      try {
        console.log('🧠 Attempting to call ML server:', mlServerUrl);
        
        const mlResponse = await fetch(`${mlServerUrl}/api/generate-daily-pick`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            games: [
              {
                homeTeam: { name: 'Yankees' },
                awayTeam: { name: 'Red Sox' },
                gameTime: '7:00 PM ET',
                venue: 'Yankee Stadium',
                odds: '+120'
              }
            ],
            date: date
          }),
          timeout: 8000
        });
        
        if (mlResponse.ok) {
          const mlResult = await mlResponse.json();
          
          if (mlResult.success) {
            console.log('✅ ML server responded successfully');
            
            const dailyPick = {
              id: `daily-${date}`,
              type: 'daily',
              date: date,
              team: mlResult.pick.game?.homeTeam?.name || 'Yankees',
              opponent: mlResult.pick.game?.awayTeam?.name || 'Red Sox',
              pick: mlResult.pick.prediction?.recommendedBet || 'ML',
              confidence: mlResult.pick.prediction?.confidence || 0.75,
              grade: mlResult.pick.prediction?.grade || 'B+',
              reasoning: mlResult.pick.reasoning || 'ML analysis complete',
              odds: mlResult.pick.game?.odds || '+120',
              gameTime: mlResult.pick.game?.gameTime || '7:00 PM ET',
              venue: mlResult.pick.game?.venue || 'Yankee Stadium',
              factors: mlResult.pick.prediction?.factors || {},
              mlProcessed: true,
              timestamp: new Date().toISOString()
            };
            
            return res.status(200).json({
              success: true,
              pick: dailyPick,
              source: 'ML Server',
              timestamp: new Date().toISOString()
            });
          }
        }
        
        console.log('⚠️ ML server unavailable, using fallback');
        
      } catch (mlError) {
        console.log('⚠️ ML server error:', mlError.message);
      }
    }
    
    // Fallback pick when ML server is unavailable
    console.log('📋 Using fallback pick');
    
    const fallbackPick = {
      id: `daily-${date}`,
      type: 'daily',
      date: date,
      team: 'Yankees',
      opponent: 'Red Sox',
      pick: 'Yankees ML',
      confidence: 0.68,
      grade: 'B+',
      reasoning: 'Fallback pick - Strong recent form + home field advantage',
      odds: '+125',
      gameTime: '7:05 PM ET',
      venue: 'Yankee Stadium',
      factors: {
        pitchingMatchup: 0.7,
        recentForm: 0.8,
        homeFieldAdvantage: 0.6,
        weather: 0.5,
        injuries: 0.7,
        value: 0.6
      },
      mlProcessed: false,
      source: 'Fallback Logic',
      timestamp: new Date().toISOString()
    };
    
    return res.status(200).json({
      success: true,
      pick: fallbackPick,
      fallback: true,
      message: 'ML server unavailable - using fallback logic',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Daily pick API error:', error);
    
    // Emergency fallback
    return res.status(200).json({
      success: true,
      pick: {
        id: 'emergency-daily',
        type: 'daily',
        team: 'Yankees',
        opponent: 'Red Sox',
        pick: 'Yankees ML',
        confidence: 0.65,
        grade: 'B',
        reasoning: 'Emergency fallback pick',
        odds: '+120',
        gameTime: '7:00 PM ET',
        venue: 'Yankee Stadium',
        mlProcessed: false,
        error: true,
        timestamp: new Date().toISOString()
      },
      error: 'API error - emergency fallback active',
      timestamp: new Date().toISOString()
    });
  }
}
