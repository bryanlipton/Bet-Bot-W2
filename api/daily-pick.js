// api/daily-pick.js - Corrected to use proper ML server endpoints
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    console.log('📅 Daily pick request received');
    
    const { date = new Date().toISOString().split('T')[0] } = req.query;
    const mlServerUrl = process.env.ML_SERVER_URL || 'http://104.236.118.108:3001';
    
    // Step 1: Get live MLB games from The Odds API
    let gamesData = [];
    
    try {
      const oddsResponse = await fetch(
        `https://api.the-odds-api.com/v4/sports/baseball_mlb/odds?` +
        `apiKey=${process.env.THE_ODDS_API_KEY}&` +
        `regions=us&markets=h2h,spreads,totals&oddsFormat=american`
      );
      
      if (oddsResponse.ok) {
        gamesData = await oddsResponse.json();
        console.log(`Found ${gamesData.length} live games`);
      }
    } catch (error) {
      console.log('⚠️ Could not fetch live odds:', error.message);
    }
    
    // Step 2: Format games for ML server
    const formattedGames = gamesData.slice(0, 5).map(game => {
      const h2hMarket = game.bookmakers?.[0]?.markets?.find(m => m.key === 'h2h');
      const homeOdds = h2hMarket?.outcomes?.find(o => o.name === game.home_team)?.price || -110;
      const awayOdds = h2hMarket?.outcomes?.find(o => o.name === game.away_team)?.price || -110;
      
      return {
        homeTeam: game.home_team,
        awayTeam: game.away_team,
        venue: `${game.home_team} Stadium`,
        gameTime: game.commence_time,
        odds: {
          home: homeOdds,
          away: awayOdds
        },
        weather: {
          temperature: 72,
          wind: 5
        }
      };
    });
    
    // Step 3: Call ML server's generate-daily-pick endpoint
    let mlPick = null;
    
    if (mlServerUrl && formattedGames.length > 0) {
      try {
        console.log(`🧠 Calling ML server at ${mlServerUrl}/api/generate-daily-pick`);
        
        const mlResponse = await fetch(`${mlServerUrl}/api/generate-daily-pick`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            games: formattedGames,
            date: date
          })
        });
        
        if (mlResponse.ok) {
          const mlResult = await mlResponse.json();
          
          if (mlResult.success && mlResult.pick) {
            mlPick = mlResult.pick;
            console.log('✅ ML server provided pick:', mlPick.prediction?.recommendedBet);
          }
        } else {
          console.log('⚠️ ML server response not ok:', mlResponse.status);
        }
      } catch (error) {
        console.log('⚠️ ML server error:', error.message);
      }
    }
    
    // Step 4: Build response in expected format
    let pickData;
    
    if (mlPick && mlPick.game) {
      // Extract team and odds from ML pick
      const recommendedTeam = mlPick.prediction?.recommendedBet?.replace(' ML', '') || 
                            mlPick.game.homeTeam;
      const isHome = recommendedTeam === mlPick.game.homeTeam;
      const odds = isHome ? mlPick.game.odds?.home : mlPick.game.odds?.away;
      
      pickData = {
        id: `daily-${date}`,
        gameId: `game-${date}-001`,
        homeTeam: mlPick.game.homeTeam,
        awayTeam: mlPick.game.awayTeam,
        pickTeam: recommendedTeam,
        pickType: 'moneyline',
        odds: odds || 120,
        grade: mlPick.prediction?.grade || 'B+',
        confidence: (mlPick.prediction?.confidence || 0.75) * 100,
        reasoning: mlPick.reasoning || 
                  `ML model shows ${recommendedTeam} with high confidence based on advanced metrics.`,
        analysis: {
          offensiveProduction: (mlPick.prediction?.factors?.pitchingMatchup || 0.75) * 100,
          pitchingMatchup: (mlPick.prediction?.factors?.pitchingMatchup || 0.75) * 100,
          situationalEdge: (mlPick.prediction?.factors?.homeFieldAdvantage || 0.7) * 100,
          teamMomentum: (mlPick.prediction?.factors?.recentForm || 0.72) * 100,
          marketInefficiency: (mlPick.prediction?.factors?.value || 0.78) * 100,
          systemConfidence: (mlPick.prediction?.confidence || 0.75) * 100,
          confidence: (mlPick.prediction?.confidence || 0.75) * 100
        },
        gameTime: mlPick.game.gameTime || new Date().toISOString(),
        venue: mlPick.game.venue || 'Stadium',
        probablePitchers: {
          home: 'TBD',
          away: 'TBD'
        },
        mlPowered: true,
        createdAt: new Date().toISOString(),
        pickDate: date,
        status: 'pending'
      };
    } else {
      // Fallback pick
      pickData = {
        id: `daily-${date}`,
        gameId: `game-${date}-001`,
        homeTeam: 'New York Yankees',
        awayTeam: 'Boston Red Sox',
        pickTeam: 'New York Yankees',
        pickType: 'moneyline',
        odds: 120,
        grade: 'B+',
        confidence: 75.22,
        reasoning: 'High confidence pick based on strong pitching matchup and home field advantage',
        analysis: {
          offensiveProduction: 76,
          pitchingMatchup: 82,
          situationalEdge: 71,
          teamMomentum: 74,
          marketInefficiency: 79,
          systemConfidence: 75,
          confidence: 75.22
        },
        gameTime: '2025-08-11T23:00:00.000Z',
        venue: 'Yankee Stadium',
        probablePitchers: {
          home: 'Gerrit Cole',
          away: 'Chris Sale'
        },
        mlPowered: false,
        createdAt: new Date().toISOString(),
        pickDate: date,
        status: 'pending'
      };
    }
    
    console.log('📤 Returning pick:', pickData.pickTeam, pickData.grade, `ML: ${pickData.mlPowered}`);
    return res.status(200).json(pickData);
    
  } catch (error) {
    console.error('❌ Daily pick API error:', error);
    
    // Emergency fallback
    return res.status(200).json({
      id: 'daily-fallback',
      gameId: 'game-fallback',
      homeTeam: 'New York Yankees',
      awayTeam: 'Boston Red Sox',
      pickTeam: 'New York Yankees',
      pickType: 'moneyline',
      odds: 120,
      grade: 'B',
      confidence: 65,
      reasoning: 'System fallback pick',
      analysis: {
        offensiveProduction: 65,
        pitchingMatchup: 65,
        situationalEdge: 65,
        teamMomentum: 65,
        marketInefficiency: 65,
        systemConfidence: 65,
        confidence: 65
      },
      gameTime: new Date().toISOString(),
      venue: 'Yankee Stadium',
      probablePitchers: {
        home: 'TBD',
        away: 'TBD'
      },
      createdAt: new Date().toISOString(),
      pickDate: new Date().toISOString().split('T')[0],
      status: 'pending'
    });
  }
}
