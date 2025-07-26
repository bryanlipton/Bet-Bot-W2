// Extract grade calculation data from current console logs
console.log("🎯 RAW GRADE CALCULATION DATA ANALYSIS");
console.log("=====================================\n");

// From the workflow console logs, I can see recent calculations:
console.log("📊 RECENT GRADE CALCULATIONS FROM SYSTEM LOGS:\n");

const recentCalculations = [
  {
    team: "Tampa Bay Rays",
    opponent: "Cincinnati Reds", 
    factors: [50, 54, 50, 53, 95, 94],
    weightedAverage: 68.9,
    grade: "B",
    details: "Market Edge: 95.4 (8.0% edge), System Confidence: 94"
  },
  {
    team: "Milwaukee Brewers", 
    opponent: "Miami Marlins",
    factors: [50, 65, 50, 54, 96, 93],
    weightedAverage: 70.8,
    grade: "B+",
    details: "Market Edge: 95.6 (8.0% edge), System Confidence: 93"
  },
  {
    team: "Milwaukee Brewers", 
    opponent: "Miami Marlins (Updated)",
    factors: [50, 65, 50, 54, 96, 94],
    weightedAverage: 71.0,
    grade: "B+", 
    details: "Market Edge: 95.6 (8.0% edge), System Confidence: 94"
  }
];

// Grade thresholds in use
const gradeThresholds = {
  'A+': 78, 'A': 75, 'A-': 72, 'B+': 69, 'B': 66, 'B-': 63,
  'C+': 60, 'C': 57, 'C-': 54, 'D+': 51, 'D': 48, 'D-': 45
};

// Weights used in calculation
const factorWeights = {
  'Offensive Production': 0.15,  // 15%
  'Pitching Matchup': 0.15,     // 15%  
  'Situational Edge': 0.15,     // 15%
  'Team Momentum': 0.15,        // 15%
  'Market Inefficiency': 0.25,  // 25%
  'System Confidence': 0.15     // 15%
};

console.log("📊 DETAILED BREAKDOWN:\n");

recentCalculations.forEach((calc, index) => {
  console.log(`🏟️ GAME ${index + 1}: ${calc.team} vs ${calc.opponent}`);
  console.log(`   Grade: ${calc.grade} (Weighted Average: ${calc.weightedAverage})`);
  console.log(`   Raw Factors: [${calc.factors.join(', ')}]`);
  console.log(`   ${calc.details}\n`);
  
  // Manual verification of weighted calculation
  const weights = [0.15, 0.15, 0.15, 0.15, 0.25, 0.15];
  const manualCalc = calc.factors.reduce((sum, factor, i) => sum + (factor * weights[i]), 0);
  console.log(`   ✅ Manual Verification: ${manualCalc.toFixed(1)} (matches: ${Math.abs(manualCalc - calc.weightedAverage) < 0.1})`);
  
  // Show which threshold applies
  const applicableGrades = Object.entries(gradeThresholds)
    .filter(([grade, threshold]) => calc.weightedAverage >= threshold)
    .sort(([,a], [,b]) => b - a);
  
  if (applicableGrades.length > 0) {
    console.log(`   📈 Threshold Analysis: Score ${calc.weightedAverage} qualifies for ${applicableGrades[0][0]} (needs ${applicableGrades[0][1]}+)`);
  }
  
  console.log("   " + "-".repeat(60) + "\n");
});

console.log("🧮 CALCULATION METHOD SUMMARY:");
console.log("=====================================");
console.log("Factor Order: [Offensive, Pitching, Situational, Momentum, Market, Confidence]");
console.log("Weights:      [15%, 15%, 15%, 15%, 25%, 15%]");
console.log("");

console.log("📊 GRADE THRESHOLDS:");
Object.entries(gradeThresholds)
  .sort(([,a], [,b]) => b - a)
  .forEach(([grade, threshold]) => {
    console.log(`   ${grade}: ${threshold}+ points`);
  });

console.log("\n🎯 KEY OBSERVATIONS:");
console.log("• Most weighted averages fall in 68-71 range");
console.log("• Market Inefficiency (25% weight) heavily influences grades");
console.log("• High market scores (95+) can elevate lower factor scores");
console.log("• Current threshold of B+ (69+) captures these weighted averages");
console.log("• System generates realistic grade distribution in B/B+ range");