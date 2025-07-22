const fetch = require('node-fetch');

async function testGradingCalculation() {
  try {
    // Test with the current pick factors: [70, 80, 77, 83, 100, 94]
    const factors = [70, 80, 77, 83, 100, 94];
    
    // Manual calculation
    const weightedSum = (70*0.15) + (80*0.15) + (77*0.15) + (83*0.15) + (100*0.25) + (94*0.15);
    const expected = Math.round(weightedSum);
    
    console.log(`\n📊 MANUAL GRADING TEST`);
    console.log(`Factors: ${factors.join(', ')}`);
    console.log(`Weighted Sum: ${weightedSum.toFixed(2)}`);
    console.log(`Expected Grade Score: ${expected}`);
    console.log(`Expected Grade: ${expected >= 95 ? 'A+' : expected >= 90 ? 'A' : expected >= 85 ? 'B+' : 'B'}`);
    
    // Check current pick's actual grade
    const response = await fetch('http://localhost:5000/api/daily-pick');
    const pick = await response.json();
    
    console.log(`\n🎯 CURRENT DAILY PICK`);
    console.log(`Team: ${pick.pickTeam}`);
    console.log(`Current Grade: ${pick.grade}`);
    console.log(`Factor Scores: ${Object.values(pick.analysis).slice(0, 6).join(', ')}`);
    
    console.log(`\n❌ ISSUE: Expected B+ (${expected}) but getting ${pick.grade}`);
    
  } catch (error) {
    console.error('Error testing grading:', error);
  }
}

testGradingCalculation();