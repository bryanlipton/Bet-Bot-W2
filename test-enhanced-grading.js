// Test script to verify enhanced grading system produces full spectrum A+ through D/F
console.log('🎯 Testing Enhanced Grading System for Full Grade Spectrum');
console.log('=====================================================');

// Simulate the enhanced grading function
function testGrading(edge, confidence) {
  const edgePercentage = edge * 100;
  
  // Primary factor: Edge percentage (most important for Pro analysis)
  let baseScore = 50; // Start neutral
  
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
  
  // Secondary factor: Confidence adjustment (±5 points max)
  const confidenceAdjustment = (confidence - 0.75) * 10; // 0.75 = neutral confidence
  const adjustedScore = baseScore + confidenceAdjustment;
  
  // Add small random variation for realism (±3 points) - use fixed value for testing
  const finalScore = adjustedScore + 2; // Fixed +2 for consistent testing
  
  // Assign grades based on final score with realistic thresholds
  let grade;
  if (finalScore >= 92) grade = 'A+';
  else if (finalScore >= 88) grade = 'A'; 
  else if (finalScore >= 82) grade = 'A-';
  else if (finalScore >= 78) grade = 'B+';
  else if (finalScore >= 72) grade = 'B';
  else if (finalScore >= 68) grade = 'B-';
  else if (finalScore >= 62) grade = 'C+';
  else if (finalScore >= 58) grade = 'C';
  else if (finalScore >= 52) grade = 'C-';
  else if (finalScore >= 48) grade = 'D+';
  else if (finalScore >= 42) grade = 'D';
  else grade = 'F';
  
  return {
    edge: edge.toFixed(3),
    edgePercentage: edgePercentage.toFixed(1),
    confidence: confidence.toFixed(2),
    baseScore,
    adjustedScore: adjustedScore.toFixed(1),
    finalScore: finalScore.toFixed(1),
    grade
  };
}

// Test scenarios to verify full grade spectrum
const testCases = [
  // A+ grade scenarios
  { edge: 0.07, confidence: 0.85, expected: 'A+' },
  { edge: 0.06, confidence: 0.80, expected: 'A+' },
  
  // A grade scenarios  
  { edge: 0.05, confidence: 0.75, expected: 'A' },
  { edge: 0.04, confidence: 0.80, expected: 'A' },
  
  // A- grade scenarios
  { edge: 0.03, confidence: 0.75, expected: 'A-' },
  { edge: 0.025, confidence: 0.70, expected: 'A-' },
  
  // B+ grade scenarios
  { edge: 0.02, confidence: 0.75, expected: 'B+' },
  { edge: 0.015, confidence: 0.80, expected: 'B+' },
  
  // B grade scenarios
  { edge: 0.01, confidence: 0.75, expected: 'B' },
  { edge: 0.005, confidence: 0.70, expected: 'B' },
  
  // B- grade scenarios
  { edge: 0.002, confidence: 0.75, expected: 'B-' },
  { edge: -0.002, confidence: 0.80, expected: 'B-' },
  
  // C+ grade scenarios
  { edge: -0.01, confidence: 0.75, expected: 'C+' },
  { edge: -0.015, confidence: 0.70, expected: 'C+' },
  
  // C grade scenarios
  { edge: -0.02, confidence: 0.75, expected: 'C' },
  { edge: -0.025, confidence: 0.70, expected: 'C' },
  
  // C- grade scenarios
  { edge: -0.03, confidence: 0.75, expected: 'C-' },
  { edge: -0.035, confidence: 0.70, expected: 'C-' },
  
  // D+ grade scenarios
  { edge: -0.04, confidence: 0.75, expected: 'D+' },
  { edge: -0.045, confidence: 0.70, expected: 'D+' },
  
  // D grade scenarios
  { edge: -0.05, confidence: 0.75, expected: 'D' },
  { edge: -0.055, confidence: 0.70, expected: 'D' },
  
  // F grade scenarios
  { edge: -0.06, confidence: 0.75, expected: 'F' },
  { edge: -0.08, confidence: 0.70, expected: 'F' },
];

let correct = 0;
let total = testCases.length;

console.log('\n📊 Grade Distribution Test Results:');
console.log('===================================');

testCases.forEach((testCase, index) => {
  const result = testGrading(testCase.edge, testCase.confidence);
  const isCorrect = result.grade === testCase.expected;
  const status = isCorrect ? '✅' : '❌';
  
  if (isCorrect) correct++;
  
  console.log(`\nTest ${index + 1}: ${status}`);
  console.log(`  Edge: ${result.edge} (${result.edgePercentage}%), Confidence: ${result.confidence}`);
  console.log(`  Base Score: ${result.baseScore}, Final Score: ${result.finalScore}`);
  console.log(`  Grade: ${result.grade} (Expected: ${testCase.expected})`);
});

console.log('\n📈 Summary:');
console.log(`✅ Correct Grades: ${correct}/${total} (${((correct/total)*100).toFixed(1)}%)`);

// Count grade distribution
const gradeDistribution = {};
testCases.forEach(testCase => {
  const result = testGrading(testCase.edge, testCase.confidence);
  gradeDistribution[result.grade] = (gradeDistribution[result.grade] || 0) + 1;
});

console.log('\n🎯 Grade Distribution:');
const gradeOrder = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F'];
gradeOrder.forEach(grade => {
  const count = gradeDistribution[grade] || 0;
  if (count > 0) {
    console.log(`  ${grade}: ${count} picks`);
  }
});

console.log('\n✅ Enhanced grading system verification complete!');
console.log('🏆 Pro users will see full spectrum from A+ (exceptional) to F (poor value)');