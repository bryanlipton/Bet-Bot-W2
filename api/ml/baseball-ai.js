export default async function handler(req, res) {
  try {
    // Step 1: Get today's games with odds
    const gamesResponse = await fetch(`${process.env.VERCEL_URL}/api/mlb/complete-schedule`);
    const games = await gamesResponse.json();
    
    // Step 2: Filter upcoming games with odds
    const today = new Date();
    const eligibleGames = games.filter(game => {
      const gameDate = new Date(game.commence_time);
      const daysDiff = Math.floor((gameDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff >= 0 && daysDiff <= 3 && game.bookmakers?.length > 0;
    });
    
    if (eligibleGames.length === 0) {
      return res.status(200).json(null);
    }
    
    // Step 3: Generate picks for all eligible games
    const allPicks = [];
    
    for (const game of eligibleGames) {
      try {
        // Call your ML model
        const predictionResponse = await fetch(`${process.env.VERCEL_URL}/api/ml/baseball-ai`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            homeTeam: game.home_team,
            awayTeam: game.away_team,
            gameDate: game.commence_time
          })
        });
        
        const prediction = await predictionResponse.json();
        
        // Step 4: Calculate 6-factor analysis
        const analysis = await calculate6FactorAnalysis(game, prediction);
        
        // Step 5: Convert to grade
        const confidence = calculateOverallConfidence(analysis);
        const grade = confidenceToGrade(confidence);
        
        // Step 6: Check minimum C+ grade requirement
        if (getGradeValue(grade) >= getGradeValue('C+')) {
          const pick = {
            id: `pick_${new Date().toISOString().split('T')[0]}_${game.id}`,
            gameId: game.id,
            homeTeam: game.home_team,
            awayTeam: game.away_team,
            pickTeam: prediction.homeWinProbability > 0.5 ? game.home_team : game.away_team,
            pickType: "moneyline",
            odds: getTeamOdds(game, prediction.homeWinProbability > 0.5 ? game.home_team : game.away_team),
            grade,
            confidence,
            reasoning: generateReasoning(analysis, game),
            analysis,
            gameTime: game.commence_time,
            venue: game.venue || 'TBD',
            probablePitchers: {
              home: game.probablePitchers?.home || null,
              away: game.probablePitchers?.away || null
            },
            createdAt: new Date().toISOString(),
            pickDate: new Date().toISOString().split('T')[0],
            status: 'pending'
          };
          
          allPicks.push(pick);
        }
      } catch (error) {
        console.error(`Error processing game ${game.id}:`, error);
        continue;
      }
    }
    
    // Step 7: Random selection from valid picks (exclude yesterday's teams)
    const validPicks = await filterYesterdaysTeams(allPicks);
    
    if (validPicks.length === 0) {
      return res.status(200).json(null);
    }
    
    const randomIndex = Math.floor(Math.random() * validPicks.length);
    const selectedPick = validPicks[randomIndex];
    
    res.status(200).json(selectedPick);
    
  } catch (error) {
    console.error('Pick generation error:', error);
    res.status(500).json({ error: 'Pick generation failed' });
  }
}

// Helper functions (you'll need to implement these based on your Replit code)
async function calculate6FactorAnalysis(game, prediction) {
  return {
    offensiveProduction: await analyzeOffensiveProduction(game),
    pitchingMatchup: await analyzePitchingMatchup(game),
    situationalEdge: getSituationalEdge(game),
    teamMomentum: await analyzeTeamMomentum(game),
    marketInefficiency: calculateMarketInefficiency(game),
    systemConfidence: calculateSystemConfidence(game)
  };
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
    weightedSum += analysis[key] * weights[key];
  });
  
  return Math.max(60, Math.min(100, Math.round(60 + ((weightedSum - 50) * 0.8))));
}

function confidenceToGrade(confidence) {
  if (confidence >= 78.5) return 'A+';
  if (confidence >= 76.0) return 'A';
  if (confidence >= 73.5) return 'A-';
  if (confidence >= 71.0) return 'B+';
  if (confidence >= 68.5) return 'B';
  if (confidence >= 66.0) return 'B-';
  if (confidence >= 63.5) return 'C+';
  if (confidence >= 61.0) return 'C';
  return 'C-';
}
