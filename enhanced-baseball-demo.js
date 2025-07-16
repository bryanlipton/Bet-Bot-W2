/**
 * Enhanced Baseball Prediction System Demo
 * 
 * This file demonstrates the advanced capabilities of our enhanced baseball AI system
 * that now incorporates Baseball Savant Statcast metrics, weather data, and ballpark factors.
 */

const API_BASE = 'http://localhost:5000';

async function demonstrateEnhancedPredictions() {
  console.log('🔮 Enhanced Baseball Prediction System Demo\n');

  try {
    // 1. Enhanced Game Prediction with Advanced Analytics
    console.log('1. Enhanced Game Prediction (Yankees vs Red Sox)');
    console.log('   Features: 27 advanced analytics including Statcast, weather, ballpark factors\n');
    
    const enhancedPrediction = await fetch(`${API_BASE}/api/baseball/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        homeTeam: 'New York Yankees',
        awayTeam: 'Boston Red Sox',
        gameDate: '2025-07-16'
      })
    }).then(r => r.json());

    console.log('📊 Prediction Results:');
    console.log(`   Home Win Probability: ${(enhancedPrediction.homeWinProbability * 100).toFixed(1)}%`);
    console.log(`   Away Win Probability: ${(enhancedPrediction.awayWinProbability * 100).toFixed(1)}%`);
    console.log(`   Predicted Total: ${enhancedPrediction.predictedTotal} runs`);
    console.log(`   Confidence Score: ${(enhancedPrediction.confidence * 100).toFixed(1)}%`);
    
    if (enhancedPrediction.weatherImpact) {
      console.log('\n🌤️  Weather Analysis:');
      console.log(`   Stadium: ${enhancedPrediction.weatherImpact.stadium}`);
      console.log(`   Temperature: ${enhancedPrediction.weatherImpact.temperature}°F`);
      console.log(`   Wind: ${enhancedPrediction.weatherImpact.windSpeed} mph`);
      console.log(`   Humidity: ${enhancedPrediction.weatherImpact.humidity}%`);
    }

    // 2. Specialized Over/Under Analysis
    console.log('\n\n2. Specialized Over/Under Analysis (Rockies vs Braves at Coors Field)');
    console.log('   Features: Ballpark factors, weather impact, team offense/pitching analysis\n');
    
    const overUnderAnalysis = await fetch(`${API_BASE}/api/baseball/over-under`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        homeTeam: 'Colorado Rockies',
        awayTeam: 'Atlanta Braves',
        gameDate: '2025-07-16',
        marketTotal: 9.5,
        homeStarterERA: 4.2,
        awayStarterERA: 3.8
      })
    }).then(r => r.json());

    console.log('⚾ Over/Under Analysis:');
    console.log(`   Predicted Total: ${overUnderAnalysis.predictedTotal} runs`);
    console.log(`   Over Probability: ${(overUnderAnalysis.overProbability * 100).toFixed(1)}%`);
    console.log(`   Under Probability: ${(overUnderAnalysis.underProbability * 100).toFixed(1)}%`);
    console.log(`   Recommendation: ${overUnderAnalysis.recommendation.toUpperCase()}`);
    console.log(`   Edge: ${overUnderAnalysis.edge.toFixed(1)}%`);

    if (overUnderAnalysis.factors) {
      console.log('\n🏟️  Ballpark Factors:');
      console.log(`   Stadium: ${overUnderAnalysis.factors.ballpark.name}`);
      console.log(`   Run Factor: ${overUnderAnalysis.factors.ballpark.parkFactor}% (league avg = 100%)`);
      console.log(`   HR Factor: ${overUnderAnalysis.factors.ballpark.homeRunFactor}% (league avg = 100%)`);
      
      console.log('\n⚡ Team Offense Analysis:');
      console.log(`   Home Team Expected Runs: ${overUnderAnalysis.factors.teamOffense.homeTeamRuns.toFixed(2)}`);
      console.log(`   Away Team Expected Runs: ${overUnderAnalysis.factors.teamOffense.awayTeamRuns.toFixed(2)}`);
    }

    // 3. Team Analysis with Advanced Metrics
    console.log('\n\n3. Advanced Team Analysis (Colorado Rockies)');
    console.log('   Features: Statcast metrics, stadium weather, ballpark factors\n');
    
    const teamAnalysis = await fetch(`${API_BASE}/api/baseball/team-analysis/Colorado%20Rockies`)
      .then(r => r.json());

    console.log('🏔️  Colorado Rockies Analysis:');
    
    if (teamAnalysis.ballparkFactors) {
      console.log(`   Coors Field Run Factor: ${teamAnalysis.ballparkFactors.runFactor}% (28% above league average)`);
      console.log(`   Coors Field HR Factor: ${teamAnalysis.ballparkFactors.hrFactor}% (18% above league average)`);
    }
    
    if (teamAnalysis.homeStadiumWeather) {
      console.log(`   Current Weather: ${teamAnalysis.homeStadiumWeather.conditions}`);
      console.log(`   Temperature: ${teamAnalysis.homeStadiumWeather.temperature}°F`);
      console.log(`   Altitude Factor: Significant (5,200+ feet elevation)`);
    }

    if (teamAnalysis.statcastMetrics) {
      console.log('\n📈 Advanced Statcast Metrics:');
      console.log(`   Team xwOBA: ${teamAnalysis.statcastMetrics.batting_xwoba?.toFixed(3) || 'Loading...'}`);
      console.log(`   Barrel Rate: ${teamAnalysis.statcastMetrics.batting_barrel_percent?.toFixed(1) || 'Loading...'}%`);
      console.log(`   Hard Hit Rate: ${teamAnalysis.statcastMetrics.batting_hard_hit_percent?.toFixed(1) || 'Loading...'}%`);
    }

    console.log('\n✅ Enhanced Baseball AI System Capabilities Demonstrated:');
    console.log('   ✓ 27 advanced features including Statcast metrics');
    console.log('   ✓ Real-time weather integration');
    console.log('   ✓ Ballpark-specific environmental factors');
    console.log('   ✓ Specialized over/under prediction engine');
    console.log('   ✓ Team-level advanced analytics');
    console.log('   ✓ Confidence scoring based on data quality');

  } catch (error) {
    console.error('Demo error:', error.message);
    console.log('\n⚠️  Note: Make sure the server is running with: npm run dev');
  }
}

// Run the demonstration
demonstrateEnhancedPredictions().catch(console.error);