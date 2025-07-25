// Quick test of our new market inefficiency calculation

console.log('🧪 Testing market inefficiency calculation...');

// Test the calculation directly with known values
function testMarketInefficiency(odds, modelProb) {
  // Mirror the calculation from dailyPickService.ts
  const bookmakerProb = odds > 0 ? 100 / (odds + 100) : Math.abs(odds) / (Math.abs(odds) + 100);
  let edge = modelProb - bookmakerProb;
  
  // REALISTIC CONSTRAINT: Cap edges at ±10% maximum for professional sports betting
  edge = Math.max(-0.10, Math.min(0.10, edge));
  
  const kellyValue = edge / bookmakerProb;
  const edgePercentage = Math.abs(edge * 100);
  
  let finalScore;
  if (edgePercentage <= 0.5) {
    // Very small or no edge: 60-75 range
    finalScore = 60 + (edgePercentage * 30); // 0% = 60, 0.5% = 75
  } else if (edgePercentage >= 10) {
    // Maximum realistic edge (10%): 99 score - extremely rare but possible
    finalScore = 99;
  } else if (edgePercentage >= 6) {
    // Exceptional inefficiency: 92-98 range
    finalScore = 92 + ((edgePercentage - 6) / 4 * 6); // 6% = 92, 10% = 98
  } else if (edgePercentage >= 3) {
    // Strong inefficiency: 85-91 range
    finalScore = 85 + ((edgePercentage - 3) / 3 * 6); // 3% = 85, 6% = 91
  } else if (edgePercentage >= 1) {
    // Good inefficiency: Linear scaling 1% = 76, 3% = 84
    finalScore = 76 + ((edgePercentage - 1) * (8 / 2));
  } else {
    // Small edge: 0.5-1%: 75-76 range
    finalScore = 75 + (edgePercentage - 0.5) * 2;
  }
  
  // Add small Kelly criterion bonus/penalty
  const kellyBonus = Math.min(Math.max(kellyValue * 2, -2), 2);
  finalScore += kellyBonus;
  
  // Clamp to 60-100 range
  finalScore = Math.max(60, Math.min(100, finalScore));
  
  return {
    odds,
    modelProb: modelProb.toFixed(3),
    bookmakerProb: bookmakerProb.toFixed(3),
    edge: edge.toFixed(3),
    edgePercentage: edgePercentage.toFixed(1),
    kellyValue: kellyValue.toFixed(3),
    finalScore: Math.round(finalScore)
  };
}

// Test scenarios
console.log('\n📊 Market Inefficiency Test Results:');
console.log('=====================================');

// Test with typical scenarios (now with 10% edge cap)
const tests = [
  { odds: -110, modelProb: 0.55 }, // 55% model vs 52.4% market = 2.6% edge
  { odds: -120, modelProb: 0.60 }, // 60% model vs 54.5% market = 5.5% edge
  { odds: +150, modelProb: 0.45 }, // 45% model vs 40% market = 5% edge
  { odds: -200, modelProb: 0.70 }, // 70% model vs 66.7% market = 3.3% edge
  { odds: +100, modelProb: 0.52 }, // 52% model vs 50% market = 2% edge
  { odds: +200, modelProb: 0.45 }, // 45% model vs 33.3% market = 11.7% edge (capped at 10%)
  { odds: -150, modelProb: 0.68 }, // 68% model vs 60% market = 8% edge
  { odds: +300, modelProb: 0.35 }, // 35% model vs 25% market = 10% edge (exactly at cap)
  { odds: -300, modelProb: 0.80 }, // 80% model vs 75% market = 5% edge
];

tests.forEach((test, i) => {
  const result = testMarketInefficiency(test.odds, test.modelProb);
  console.log(`\nTest ${i + 1}:`);
  console.log(`  Odds: ${result.odds}, Model: ${result.modelProb}, Market: ${result.bookmakerProb}`);
  console.log(`  Edge: ${result.edge} (${result.edgePercentage}%), Kelly: ${result.kellyValue}`);
  console.log(`  Market Inefficiency Score: ${result.finalScore}`);
});

console.log('\n✅ Test completed - check if scores are realistic (60-95 range, not always 100)');