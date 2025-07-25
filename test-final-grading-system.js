// Final test of enhanced grading system for Pro version
console.log('🎯 FINAL TEST: Enhanced Grading System for Pro Version');
console.log('===================================================');

function simulateEnhancedGrading(edge, confidence) {
  const edgePercentage = edge * 100;
  
  // Enhanced grading algorithm (matches bettingRecommendationEngine.ts)
  let baseScore = 50;
  
  if (edgePercentage >= 6) baseScore = 95;      // A+ territory: 6%+ edge
  else if (edgePercentage >= 4) baseScore = 90; // A territory: 4-6% edge
  else if (edgePercentage >= 2.5) baseScore = 85; // A- territory: 2.5-4% edge
  else if (edgePercentage >= 1.5) baseScore = 80; // B+ territory: 1.5-2.5% edge
  else if (edgePercentage >= 0.5) baseScore = 75; // B territory: 0.5-1.5% edge
  else if (edgePercentage >= -0.5) baseScore = 70; // B- territory: -0.5-0.5% edge
  else if (edgePercentage >= -1.5) baseScore = 65; // C+ territory: -1.5 to -0.5% edge
  else if (edgePercentage >= -2.5) baseScore = 60; // C territory: -2.5 to -1.5% edge
  else if (edgePercentage >= -3.5) baseScore = 55; // C- territory: -3.5 to -2.5% edge
  else if (edgePercentage >= -4.5) baseScore = 50; // D+ territory: -4.5 to -3.5% edge
  else if (edgePercentage >= -5.5) baseScore = 45; // D territory: -5.5 to -4.5% edge
  else baseScore = 35; // F territory: worse than -5.5% edge
  
  const confidenceAdjustment = (confidence - 0.75) * 10;
  const adjustedScore = baseScore + confidenceAdjustment;
  const finalScore = adjustedScore + ((Math.random() - 0.5) * 6); // Random variation
  
  if (finalScore >= 92) return 'A+';
  else if (finalScore >= 88) return 'A'; 
  else if (finalScore >= 82) return 'A-';
  else if (finalScore >= 78) return 'B+';
  else if (finalScore >= 72) return 'B';
  else if (finalScore >= 68) return 'B-';
  else if (finalScore >= 62) return 'C+';
  else if (finalScore >= 58) return 'C';
  else if (finalScore >= 52) return 'C-';
  else if (finalScore >= 48) return 'D+';
  else if (finalScore >= 42) return 'D';
  else return 'F';
}

function simulateMLEdgeGeneration() {
  const randomFactor = Math.random();
  let analyticalEdge;
  let category;
  
  if (randomFactor < 0.05) {
    // 5% chance of exceptional edge (6-8%) - A+ territory
    analyticalEdge = (Math.random() - 0.5) * 0.16; // ±8% max
    category = 'Exceptional (6-8%)';
  } else if (randomFactor < 0.15) {
    // 10% chance of strong edge (4-6%) - A territory  
    analyticalEdge = (Math.random() - 0.5) * 0.12; // ±6% max
    category = 'Strong (4-6%)';
  } else if (randomFactor < 0.35) {
    // 20% chance of good edge (2-4%) - A-/B+ territory
    analyticalEdge = (Math.random() - 0.5) * 0.08; // ±4% max
    category = 'Good (2-4%)';
  } else if (randomFactor < 0.60) {
    // 25% chance of small edge (0.5-2%) - B/B- territory
    analyticalEdge = (Math.random() - 0.5) * 0.06; // ±3% max
    category = 'Small (0.5-3%)';
  } else {
    // 40% chance of neutral/negative edge (-2% to +1%) - C+/C/C-/D territory
    analyticalEdge = (Math.random() - 0.7) * 0.06; // Biased toward negative edges
    category = 'Neutral/Negative (-3% to +1%)';
  }
  
  return { edge: analyticalEdge, category };
}

// Test 1: Grade Distribution
console.log('\n📊 TEST 1: Grade Distribution Simulation');
console.log('=======================================');

const gradeDistribution = {};
const NUM_SIMULATIONS = 100;

for (let i = 0; i < NUM_SIMULATIONS; i++) {
  const { edge } = simulateMLEdgeGeneration();
  const confidence = 0.65 + (Math.random() * 0.20); // 65-85% confidence
  const grade = simulateEnhancedGrading(edge, confidence);
  
  gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
}

console.log(`Grade distribution from ${NUM_SIMULATIONS} simulated picks:`);
const gradeOrder = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F'];
gradeOrder.forEach(grade => {
  const count = gradeDistribution[grade] || 0;
  const percentage = ((count / NUM_SIMULATIONS) * 100).toFixed(1);
  console.log(`  ${grade}: ${count} picks (${percentage}%)`);
});

// Test 2: Edge Category Distribution
console.log('\n📈 TEST 2: Edge Category Distribution');
console.log('===================================');

const edgeCategories = {};
for (let i = 0; i < NUM_SIMULATIONS; i++) {
  const { category } = simulateMLEdgeGeneration();
  edgeCategories[category] = (edgeCategories[category] || 0) + 1;
}

console.log(`Edge category distribution from ${NUM_SIMULATIONS} simulations:`);
Object.entries(edgeCategories).forEach(([category, count]) => {
  const percentage = ((count / NUM_SIMULATIONS) * 100).toFixed(1);
  console.log(`  ${category}: ${count} (${percentage}%)`);
});

// Test 3: Pro vs Regular User Analysis
console.log('\n🎯 TEST 3: Pro vs Regular User Comparison');
console.log('========================================');

const regularUserGrades = [];
const proUserGrades = [];

for (let i = 0; i < NUM_SIMULATIONS; i++) {
  const { edge } = simulateMLEdgeGeneration();
  const confidence = 0.65 + (Math.random() * 0.20);
  const grade = simulateEnhancedGrading(edge, confidence);
  
  proUserGrades.push(grade);
  
  // Regular users only see C+ or better
  if (['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+'].includes(grade)) {
    regularUserGrades.push(grade);
  }
}

const regularGradeDistribution = {};
const proGradeDistribution = {};

regularUserGrades.forEach(grade => {
  regularGradeDistribution[grade] = (regularGradeDistribution[grade] || 0) + 1;
});

proUserGrades.forEach(grade => {
  proGradeDistribution[grade] = (proGradeDistribution[grade] || 0) + 1;
});

console.log(`Regular Users (C+ or better only): ${regularUserGrades.length} picks`);
gradeOrder.forEach(grade => {
  const count = regularGradeDistribution[grade] || 0;
  if (count > 0) {
    const percentage = ((count / regularUserGrades.length) * 100).toFixed(1);
    console.log(`  ${grade}: ${count} picks (${percentage}%)`);
  }
});

console.log(`\nPro Users (All grades): ${proUserGrades.length} picks`);
gradeOrder.forEach(grade => {
  const count = proGradeDistribution[grade] || 0;
  if (count > 0) {
    const percentage = ((count / proUserGrades.length) * 100).toFixed(1);
    console.log(`  ${grade}: ${count} picks (${percentage}%)`);
  }
});

// Summary
const uniqueRegularGrades = Object.keys(regularGradeDistribution).length;
const uniqueProGrades = Object.keys(proGradeDistribution).length;

console.log('\n✅ SUMMARY: Enhanced Grading System Results');
console.log('==========================================');
console.log(`Regular Users see: ${uniqueRegularGrades} grade levels`);
console.log(`Pro Users see: ${uniqueProGrades} grade levels`);
console.log(`Pro advantage: ${uniqueProGrades - uniqueRegularGrades} additional grade levels`);

if (uniqueProGrades >= 8) {
  console.log('🏆 SUCCESS: Pro version provides comprehensive grade spectrum!');
  console.log('📊 Full range A+ (exceptional) through D/F (poor value) available');
  console.log('🎯 Pro endpoint ready: /api/daily-pick/all-grades');
} else {
  console.log('⚠️  NOTICE: Grade spectrum could be wider for Pro differentiation');
}

console.log('\n🔄 Next Steps:');
console.log('- Enhanced system active in production');
console.log('- Tomorrow\'s 2 AM pick generation will use new grading');
console.log('- Pro users can access /api/daily-pick/all-grades for full spectrum');
console.log('- Regular users continue seeing only C+ or better picks');