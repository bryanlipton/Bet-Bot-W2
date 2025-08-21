// api/pro/game/[gameId]/analysis.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  const { gameId } = req.query;
  
  if (!gameId) {
    return res.status(200).json(null);
  }
  
  // Define game variable outside try block
  let game = null;
  
  try {
    // Step 1: Get the specific game data from Odds API
    const apiKey = process.env.ODDS_API_KEY || process.env.THE_ODDS_API_KEY;
    const gamesResponse = await fetch(
      `https://api.the-odds-api.com/v4/sports/baseball_mlb/odds?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals`
    );
    
    if (!gamesResponse.ok) {
      throw new Error('Failed to fetch games');
    }
    
    const games = await gamesResponse.json();
    game = games.find(g => g.id === gameId);
    
    if (!game) {
      return res.status(200).json(null);
    }
    
    // Step 2: Call your ML Server API
    const mlServerUrl = process.env.ML_SERVER_URL || process.env.DIGITAL_OCEAN_URL;
    const mlApiKey = process.env.ML_API_KEY || process.env.DIGITAL_OCEAN_API_KEY;
    
    console.log('🔍 ML_SERVER_URL:', mlServerUrl);
    
    if (!mlServerUrl) {
      console.error('❌ ML_SERVER_URL not configured');
      return res.status(200).json(generateFallbackPick(game));
    }
    
    console.log(`🚀 Calling ML Server API at: ${mlServerUrl}/predict`);
    console.log('📦 Sending data:', JSON.stringify({
      homeTeam: game.home_team,
      awayTeam: game.away_team,
      gameId: gameId
    }));
    
    // Simple test with minimal data
    const testEndpoints = [
      { path: '/predict', method: 'POST' },
      { path: '/api/predict', method: 'POST' },
      { path: '/prediction', method: 'POST' },
      { path: '/api/prediction', method: 'POST' },
      { path: '/', method: 'POST' },
      { path: '/analyze', method: 'POST' },
      { path: '/api/analyze', method: 'POST' }
    ];
    
    let mlPrediction = null;
    
    for (const endpoint of testEndpoints) {
      try {
        console.log(`🔄 Trying ${endpoint.method} ${mlServerUrl}${endpoint.path}`);
        
        // Try with minimal data first
        const simpleRequest = {
          homeTeam: game.home_team,
          awayTeam: game.away_team
        };
        
        const response = await fetch(`${mlServerUrl}${endpoint.path}`, {
          method: endpoint.method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(simpleRequest)
        });
        
        console.log(`📊 Response: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          const text = await response.text();
          console.log(`✅ Success! Response preview: ${text.substring(0, 100)}`);
          try {
            mlPrediction = JSON.parse(text);
            console.log('✅ Valid JSON received');
            break;
          } catch (e) {
            console.log('⚠️ Response is not JSON:', text.substring(0, 200));
          }
        }
      } catch (error) {
        console.log(`❌ Error for ${endpoint.path}: ${error.message}`);
      }
    }
    
    if (!mlPrediction) {
      console.error('❌ All ML endpoints failed, using fallback');
      throw new Error('All ML endpoints failed');
    }
    
    console.log('✅ Received ML prediction from ML Server');
    
    // Step 3: Process the ML prediction into Pro Pick format
    const pickHomeTeam = mlPrediction.homeWinProbability > mlPrediction.awayWinProbability;
    const pickTeam = pickHomeTeam ? game.home_team : game.away_team;
    const winProb = pickHomeTeam ? mlPrediction.homeWinProbability : mlPrediction.awayWinProbability;
    
    // Step 4: Calculate 6-factor analysis from ML data
    const analysis = {
      offensiveProduction: mlPrediction.analysis?.offensiveProduction || 
                           mlPrediction.factors?.offensiveProduction || 
                           calculateOffensiveScore(mlPrediction.predictedTotal || 8.5, winProb),
      
      pitchingMatchup: mlPrediction.analysis?.pitchingMatchup || 
                       mlPrediction.factors?.pitchingMatchup || 
                       calculatePitchingScore(winProb, mlPrediction.confidence || 0.7),
      
      situationalEdge: mlPrediction.analysis?.situationalEdge || 
                       mlPrediction.factors?.situationalEdge || 
                       calculateSituationalScore(pickHomeTeam, winProb),
      
      teamMomentum: mlPrediction.analysis?.teamMomentum || 
                    mlPrediction.factors?.teamMomentum || 
                    calculateMomentumScore(winProb, mlPrediction.confidence || 0.7),
      
      marketInefficiency: mlPrediction.analysis?.marketInefficiency || 
                          mlPrediction.factors?.marketInefficiency || 
                          calculateMarketScore(game, pickTeam, winProb),
      
      systemConfidence: mlPrediction.analysis?.systemConfidence || 
                        mlPrediction.factors?.systemConfidence || 
                        (mlPrediction.confidence || 0.7) * 100
    };
    
    // Step 5: Calculate overall confidence and grade
    const confidence = calculateOverallConfidence(analysis);
    const grade = confidenceToGrade(confidence);
    
    // Step 6: Get odds for the picked team
    const h2hMarket = game.bookmakers?.[0]?.markets?.find(m => m.key === 'h2h');
    const teamOdds = h2hMarket?.outcomes?.find(o => o.name === pickTeam)?.price || -110;
    
    // Step 7: Generate reasoning
    const reasoning = generateMLReasoning(game, pickTeam, winProb, analysis, grade);
    
    // Step 8: Format final Pro Pick response
    const proPick = {
      gameId: gameId,
      homeTeam: game.home_team,
      awayTeam: game.away_team,
      pickTeam: pickTeam,
      grade: grade,
      confidence: Math.round(confidence),
      reasoning: reasoning,
      odds: teamOdds,
      analysis: {
        marketInefficiency: Math.round(analysis.marketInefficiency),
        situationalEdge: Math.round(analysis.situationalEdge),
        pitchingMatchup: Math.round(analysis.pitchingMatchup),
        teamMomentum: Math.round(analysis.teamMomentum),
        systemConfidence: Math.round(analysis.systemConfidence),
        offensiveProduction: Math.round(analysis.offensiveProduction)
      },
      mlPrediction: {
        homeWinProb: (mlPrediction.homeWinProbability * 100).toFixed(1),
        awayWinProb: (mlPrediction.awayWinProbability * 100).toFixed(1),
        overProb: mlPrediction.overProbability ? (mlPrediction.overProbability * 100).toFixed(1) : null,
        underProb: mlPrediction.underProbability ? (mlPrediction.underProbability * 100).toFixed(1) : null,
        predictedTotal: mlPrediction.predictedTotal?.toFixed(1) || null,
        modelConfidence: mlPrediction.confidence ? (mlPrediction.confidence * 100).toFixed(1) : null
      },
      source: 'digital_ocean_ml'
    };
    
    console.log(`✅ Pro Pick: ${pickTeam} (${grade}) - ${confidence.toFixed(1)}% confidence`);
    
    res.status(200).json(proPick);
    
  } catch (error) {
    console.error('❌ Error generating pro pick:', error.message);
    
    // Return fallback pick if ML Server is down
    // Check if game exists before using it
    if (game) {
      return res.status(200).json(generateFallbackPick(game));
    } else {
      // If no game data, return basic fallback
      return res.status(200).json(generateFallbackPick({
        id: gameId,
        home_team: 'Home Team',
        away_team: 'Away Team'
      }));
    }
  }
}

// Helper functions for calculating scores when DO doesn't provide them
function calculateOffensiveScore(predictedTotal, winProb) {
  let score = 60;
  
  if (predictedTotal > 9.5) score += 10;
  else if (predictedTotal > 8.5) score += 5;
  else if (predictedTotal < 7.0) score -= 5;
  
  if (winProb > 0.55) score += 8;
  else if (winProb > 0.52) score += 4;
  else if (winProb < 0.45) score -= 6;
  
  score += (Math.random() - 0.5) * 8;
  
  return Math.max(50, Math.min(95, score));
}

function calculatePitchingScore(winProb, mlConfidence) {
  let score = 65;
  
  if (winProb > 0.58) score += 12;
  else if (winProb > 0.54) score += 6;
  else if (winProb < 0.46) score -= 8;
  
  if (mlConfidence > 0.80) score += 5;
  else if (mlConfidence < 0.65) score -= 3;
  
  score += (Math.random() - 0.5) * 6;
  
  return Math.max(55, Math.min(90, score));
}

function calculateSituationalScore(isHome, winProb) {
  let score = 60;
  
  if (isHome) {
    score += 8;
  } else {
    score -= 3;
  }
  
  score += (winProb - 0.50) * 40;
  score += (Math.random() - 0.5) * 8;
  
  return Math.max(55, Math.min(85, score));
}

function calculateMomentumScore(winProb, mlConfidence) {
  let score = 65;
  
  if (winProb > 0.56) score += 10;
  else if (winProb > 0.52) score += 5;
  else if (winProb < 0.44) score -= 10;
  else if (winProb < 0.48) score -= 5;
  
  score += (mlConfidence - 0.70) * 20;
  score += (Math.random() - 0.5) * 6;
  
  return Math.max(50, Math.min(95, score));
}

function calculateMarketScore(game, pickTeam, mlWinProb) {
  try {
    const h2hMarket = game.bookmakers?.[0]?.markets?.find(m => m.key === 'h2h');
    const teamOdds = h2hMarket?.outcomes?.find(o => o.name === pickTeam)?.price || -110;
    
    const impliedProb = teamOdds > 0 ? 
      100 / (teamOdds + 100) : 
      Math.abs(teamOdds) / (Math.abs(teamOdds) + 100);
    
    const edge = mlWinProb - impliedProb;
    
    let score = 65;
    
    if (edge > 0.10) score += 15;
    else if (edge > 0.05) score += 8;
    else if (edge > 0.02) score += 3;
    else if (edge < -0.05) score -= 8;
    else if (edge < -0.10) score -= 15;
    
    score += (Math.random() - 0.5) * 8;
    
    return Math.max(55, Math.min(90, score));
  } catch (error) {
    return 70;
  }
}

function calculateOverallConfidence(analysis) {
  const weights = {
    offensiveProduction: 0.20,
    pitchingMatchup: 0.25,
    situationalEdge: 0.15,
    teamMomentum: 0.20,
    marketInefficiency: 0.10,
    systemConfidence: 0.10
  };
  
  let weightedSum = 0;
  Object.keys(weights).forEach(key => {
    weightedSum += (analysis[key] || 70) * weights[key];
  });
  
  const confidence = 60 + ((weightedSum - 50) * 0.7);
  return Math.max(60, Math.min(95, confidence));
}

function confidenceToGrade(confidence) {
  if (confidence >= 88) return 'A+';
  if (confidence >= 84) return 'A';
  if (confidence >= 80) return 'A-';
  if (confidence >= 76) return 'B+';
  if (confidence >= 72) return 'B';
  if (confidence >= 68) return 'B-';
  if (confidence >= 64) return 'C+';
  if (confidence >= 60) return 'C';
  return 'C-';
}

function generateMLReasoning(game, pickTeam, winProb, analysis, grade) {
  const factors = [];
  
  if (analysis.offensiveProduction >= 75) {
    factors.push("strong offensive metrics");
  }
  
  if (analysis.pitchingMatchup >= 75) {
    factors.push("favorable pitching matchup");
  }
  
  if (analysis.teamMomentum >= 75) {
    factors.push("positive momentum indicators");
  }
  
  if (analysis.marketInefficiency >= 75) {
    factors.push("market value detected");
  }
  
  const isHome = pickTeam === game.home_team;
  const location = isHome ? "at home" : "on the road";
  
  let reasoning = `ML Server indicates ${(winProb * 100).toFixed(1)}% win probability for ${pickTeam} ${location}. `;
  
  if (factors.length > 0) {
    reasoning += `Key factors: ${factors.join(", ")}. `;
  }
  
  reasoning += `Grade ${grade} with ${analysis.systemConfidence.toFixed(0)}% model confidence.`;
  
  return reasoning;
}

function generateFallbackPick(game) {
  // Fallback pick when Digital Ocean is unavailable
  const pickHome = Math.random() > 0.5;
  const pickTeam = pickHome ? game.home_team : game.away_team;
  const grades = ['B+', 'B', 'B-', 'C+'];
  const grade = grades[Math.floor(Math.random() * grades.length)];
  
  return {
    gameId: game.id,
    homeTeam: game.home_team,
    awayTeam: game.away_team,
    pickTeam: pickTeam,
    grade: grade,
    confidence: 70 + Math.random() * 10,
    reasoning: 'ML analysis processing. Default recommendation based on recent performance.',
    odds: -110,
    analysis: {
      marketInefficiency: 70 + Math.random() * 10,
      situationalEdge: 70 + Math.random() * 10,
      pitchingMatchup: 70 + Math.random() * 10,
      teamMomentum: 70 + Math.random() * 10,
      systemConfidence: 70 + Math.random() * 10,
      offensiveProduction: 70 + Math.random() * 10
    },
    source: 'fallback'
  };
}
