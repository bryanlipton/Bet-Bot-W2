// Test script to verify the fixed prediction model generates realistic probabilities
import { MLEngine } from './server/services/mlEngine.ts';

async function testFixedPredictions() {
  console.log('🧪 Testing Fixed Prediction Model');
  console.log('=====================================');
  
  const engine = new MLEngine();
  
  // Test case: Kansas City Royals @ Chicago Cubs with realistic odds
  const gameData = {
    bookmakers: [{
      markets: [{
        key: 'h2h',
        outcomes: [
          { price: -240 }, // Cubs (home) - heavily favored
          { price: 194 }   // Royals (away) - underdog
        ]
      }]
    }]
  };
  
  console.log('Test Game: Kansas City Royals @ Chicago Cubs');
  console.log('Market Odds: Cubs -240, Royals +194');
  
  // Calculate market implied probabilities
  const cubsImplied = 240 / (240 + 100); // ~70.6%
  const royalsImplied = 100 / (194 + 100); // ~34.0%
  
  console.log(`Market Implied: Cubs ${(cubsImplied * 100).toFixed(1)}%, Royals ${(royalsImplied * 100).toFixed(1)}%`);
  console.log('');
  
  // Run multiple predictions to test consistency
  for (let i = 1; i <= 5; i++) {
    const prediction = engine.generateModelPredictions(gameData);
    
    const cubsPredicted = prediction.homeWinProbability * 100;
    const royalsPredicted = prediction.awayWinProbability * 100;
    const confidence = prediction.confidence;
    
    // Calculate edges
    const cubsEdge = ((prediction.homeWinProbability - cubsImplied) * 100);
    const royalsEdge = ((prediction.awayWinProbability - royalsImplied) * 100);
    
    console.log(`Test ${i}:`);
    console.log(`  AI Predictions: Cubs ${cubsPredicted.toFixed(1)}%, Royals ${royalsPredicted.toFixed(1)}%`);
    console.log(`  Confidence: ${confidence.toFixed(1)}%`);
    console.log(`  Edges: Cubs ${cubsEdge > 0 ? '+' : ''}${cubsEdge.toFixed(1)}%, Royals ${royalsEdge > 0 ? '+' : ''}${royalsEdge.toFixed(1)}%`);
    
    // Check if probabilities are realistic (not exceeding 75%)
    const isRealistic = cubsPredicted <= 75 && royalsPredicted <= 75;
    const isReasonableEdge = Math.abs(cubsEdge) <= 10 && Math.abs(royalsEdge) <= 10; // Max 10% edge
    
    console.log(`  Status: ${isRealistic && isReasonableEdge ? '✅ REALISTIC' : '❌ UNREALISTIC'}`);
    console.log('');
  }
  
  console.log('Summary:');
  console.log('- Fixed model should generate probabilities close to market (±5% edge max)');
  console.log('- No team should exceed 75% win probability');
  console.log('- Confidence should be 65-85% range');
  console.log('- Model now uses market awareness instead of random 10-90% range');
}

testFixedPredictions().catch(console.error);