/**
 * Test the Betting Recommendations System
 * This demonstrates how the system compares AI predictions against real odds
 * to identify value bets with A+ through F grades
 */

async function testBettingRecommendations() {
  console.log('🎯 Testing Enhanced Betting Recommendations System\n');

  // Test Case 1: Coors Field Over/Under (should generate OVER recommendation)
  console.log('=== TEST 1: Coors Field High Total Game ===');
  const coorsTest = {
    homeTeam: "Colorado Rockies",
    awayTeam: "Minnesota Twins", 
    gameDate: "2025-07-19T00:41:00Z",
    probablePitchers: {
      home: "Kyle Freeland",
      away: null
    },
    bookmakers: [
      {
        key: "fanduel",
        title: "FanDuel",
        markets: [
          {
            key: "h2h",
            outcomes: [
              {name: "Colorado Rockies", price: 136},
              {name: "Minnesota Twins", price: -162}
            ]
          },
          {
            key: "totals",
            outcomes: [
              {name: "Over", price: -110, point: 9.5},  // Low line vs high Coors prediction
              {name: "Under", price: -110, point: 9.5}
            ]
          }
        ]
      }
    ]
  };

  try {
    const response = await fetch('http://localhost:5000/api/baseball/betting-recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(coorsTest)
    });

    if (!response.ok) {
      console.log('❌ Request failed:', response.status, response.statusText);
      return;
    }

    const result = await response.json();
    
    console.log('🔮 AI Prediction:');
    console.log(`   Predicted Total: ${result.aiPrediction.predictedTotal} runs`);
    console.log(`   Confidence: ${(result.aiPrediction.confidence * 100).toFixed(1)}%`);
    console.log(`   Stadium: ${result.aiPrediction.weatherImpact.stadium}`);
    
    console.log('\n📊 Betting Recommendations:');
    if (result.recommendations.length === 0) {
      console.log('   ❌ No recommendations generated');
      console.log('   🔍 Debug: Let me check why...');
      
      // Manual calculation for debugging
      const predictedTotal = result.aiPrediction.predictedTotal;
      const marketLine = 9.5;
      const difference = predictedTotal - marketLine;
      
      console.log(`   📈 AI Total: ${predictedTotal}`);
      console.log(`   📉 Market Line: ${marketLine}`);
      console.log(`   ⚖️  Difference: +${difference.toFixed(1)} runs`);
      
      if (difference > 2) {
        console.log('   ✅ This should generate a strong OVER recommendation!');
      }
    } else {
      result.recommendations.forEach((rec, index) => {
        console.log(`\n   ${index + 1}. ${rec.selection} (Grade: ${rec.grade})`);
        console.log(`      Edge: ${(rec.edge * 100).toFixed(1)}%`);
        console.log(`      Expected Value: ${rec.expectedValue.toFixed(3)}`);
        console.log(`      Kelly Bet Size: ${(rec.kellyBetSize * 100).toFixed(1)}%`);
        console.log(`      Reasoning: ${rec.reasoning}`);
      });
      
      console.log(`\n📈 Summary:`);
      console.log(`   Total Recommendations: ${result.summary.totalRecommendations}`);
      console.log(`   A+ Grade Bets: ${result.summary.gradeAPlusCount}`);
      console.log(`   A Grade Bets: ${result.summary.gradeACount}`);
      console.log(`   Average Edge: ${(result.summary.averageEdge * 100).toFixed(1)}%`);
      
      if (result.summary.bestBet) {
        console.log(`   🏆 Best Bet: ${result.summary.bestBet.selection} (${result.summary.bestBet.grade})`);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }

  console.log('\n=== TEST 2: Moneyline Value Bet ===');
  // Test with underdog scenario
  const underdogTest = {
    homeTeam: "Chicago Cubs",
    awayTeam: "Boston Red Sox",
    gameDate: "2025-07-18T18:21:00Z",
    probablePitchers: {
      home: "Colin Rea",
      away: "Lucas Giolito"
    },
    bookmakers: [
      {
        key: "fanduel", 
        title: "FanDuel",
        markets: [
          {
            key: "h2h",
            outcomes: [
              {name: "Chicago Cubs", price: 300},  // High underdog odds
              {name: "Boston Red Sox", price: -400} // Heavy favorite
            ]
          }
        ]
      }
    ]
  };

  try {
    const response = await fetch('http://localhost:5000/api/baseball/betting-recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(underdogTest)
    });

    const result = await response.json();
    
    console.log('🔮 AI Prediction:');
    console.log(`   Home Win: ${(result.aiPrediction.homeWinProbability * 100).toFixed(1)}%`);
    console.log(`   Away Win: ${(result.aiPrediction.awayWinProbability * 100).toFixed(1)}%`);
    
    console.log('\n📊 Betting Recommendations:');
    if (result.recommendations.length > 0) {
      result.recommendations.forEach((rec, index) => {
        console.log(`\n   ${index + 1}. ${rec.selection} (Grade: ${rec.grade})`);
        console.log(`      Odds: ${rec.odds > 0 ? '+' : ''}${rec.odds}`);
        console.log(`      Edge: ${(rec.edge * 100).toFixed(1)}%`);
        console.log(`      AI Probability: ${(rec.predictedProbability * 100).toFixed(1)}%`);
        console.log(`      Market Probability: ${(rec.impliedProbability * 100).toFixed(1)}%`);
      });
    } else {
      console.log('   ❌ No moneyline recommendations generated');
    }

  } catch (error) {
    console.error('❌ Moneyline test failed:', error.message);
  }

  console.log('\n✅ Betting Recommendations System Test Complete');
  console.log('\n📋 System Capabilities:');
  console.log('   • Compares AI predictions vs real market odds');
  console.log('   • Identifies value bets with positive expected value');
  console.log('   • Grades recommendations A+ through F');
  console.log('   • Calculates Kelly Criterion bet sizing');
  console.log('   • Covers moneylines, spreads, and totals');
  console.log('   • Uses 27 advanced analytics features');
}

// Run the test
testBettingRecommendations().catch(console.error);