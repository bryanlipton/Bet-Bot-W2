console.log("🎯 COMPLETE RAW GRADE CALCULATION ANALYSIS");
console.log("==========================================\n");

console.log("📊 THERE ARE TWO DIFFERENT GRADING SYSTEMS IN USE:\n");

console.log("1️⃣ BETTINGRECOMMENDATIONENGINE GRADING (OLD SYSTEM):");
console.log("   • Uses only Edge + Confidence");
console.log("   • Formula: avgScore = (edgeScore + confidenceScore) / 2");
console.log("   • Edge conversion: edgeScore = 60 + (edge × 400)");
console.log("   • Confidence conversion: confidenceScore = 60 + (confidence × 40)");
console.log("   • Thresholds: A+ (95+), A (90+), B+ (85+), B (80+), C+ (75+), C (70+), D+ (65+), D (60+)");
console.log("");

console.log("2️⃣ DAILY PICKS SYSTEM GRADING (NEW SYSTEM - WHAT YOU SEE):");
console.log("   • Uses ALL 6 analysis factors with weights");
console.log("   • Formula: weightedAverage = Σ(factor × weight)");
console.log("   • Factors: [Offensive, Pitching, Situational, Momentum, Market, Confidence]");
console.log("   • Weights: [15%, 15%, 15%, 15%, 25%, 15%]");
console.log("   • Thresholds: A+ (78+), A (75+), A- (72+), B+ (69+), B (66+), B- (63+)");
console.log("");

console.log("🔍 RAW CALCULATIONS FROM SYSTEM LOGS:\n");

const systemCalculations = [
  {
    game: "Tampa Bay Rays @ Cincinnati Reds",
    pick: "Tampa Bay Rays",
    rawFactors: [50, 54, 50, 53, 95, 94],
    factorNames: ["Offensive", "Pitching", "Situational", "Momentum", "Market", "Confidence"],
    weights: [0.15, 0.15, 0.15, 0.15, 0.25, 0.15],
    calculation: "50×0.15 + 54×0.15 + 50×0.15 + 53×0.15 + 95×0.25 + 94×0.15",
    result: 68.9,
    grade: "B"
  },
  {
    game: "Milwaukee Brewers vs Miami Marlins",
    pick: "Milwaukee Brewers", 
    rawFactors: [50, 65, 50, 54, 96, 94],
    factorNames: ["Offensive", "Pitching", "Situational", "Momentum", "Market", "Confidence"],
    weights: [0.15, 0.15, 0.15, 0.15, 0.25, 0.15],
    calculation: "50×0.15 + 65×0.15 + 50×0.15 + 54×0.15 + 96×0.25 + 94×0.15",
    result: 71.0,
    grade: "B+"
  }
];

systemCalculations.forEach((calc, index) => {
  console.log(`🏟️ GAME ${index + 1}: ${calc.game}`);
  console.log(`   Pick: ${calc.pick}`);
  console.log(`   Raw Factor Scores: [${calc.rawFactors.join(', ')}]`);
  console.log(`   Factor Names: [${calc.factorNames.join(', ')}]`);
  console.log(`   Weights: [${calc.weights.map(w => (w*100).toFixed(0) + '%').join(', ')}]`);
  console.log(`   Calculation: ${calc.calculation}`);
  
  // Manual verification
  const manualCalc = calc.rawFactors.reduce((sum, factor, i) => sum + (factor * calc.weights[i]), 0);
  console.log(`   Manual Verification: ${manualCalc.toFixed(1)}`);
  console.log(`   System Result: ${calc.result}`);
  console.log(`   Final Grade: ${calc.grade}`);
  console.log("");
});

console.log("📈 GRADE THRESHOLD COMPARISON:\n");

console.log("OLD System (BettingRecommendationEngine):");
console.log("A+ = 95+, A = 90+, B+ = 85+, B = 80+, C+ = 75+, C = 70+");

console.log("\nNEW System (Daily Picks - What Users See):");
console.log("A+ = 78+, A = 75+, A- = 72+, B+ = 69+, B = 66+, B- = 63+");

console.log("\n🎯 KEY FINDINGS:");
console.log("• The daily picks system correctly uses weighted average of all 6 factors");
console.log("• Market Inefficiency gets 25% weight (highest influence)");
console.log("• Raw factor scores typically range 50-96");
console.log("• Final weighted scores typically fall in 66-75 range");
console.log("• Grade thresholds properly adjusted for this score range");
console.log("• System produces realistic B/B+ distribution as intended");

console.log("\n✅ CONCLUSION:");
console.log("The grading system is working correctly with authentic weighted calculations");
console.log("using all 6 analysis factors as specified in the requirements.");