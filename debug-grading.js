// Manual grade calculation test
const factors = [
  { score: 72, weight: 0.15 }, // Offensive Production: 15%
  { score: 80, weight: 0.15 }, // Pitching Matchup: 15%  
  { score: 77, weight: 0.15 }, // Situational Edge: 15%
  { score: 75, weight: 0.15 }, // Team Momentum: 15%
  { score: 100, weight: 0.25 }, // Market Inefficiency: 25% (most important)
  { score: 94, weight: 0.15 }   // System Confidence: 15%
];

// Calculate weighted average
const weightedSum = factors.reduce((sum, factor) => sum + (factor.score * factor.weight), 0);
const overallScore = Math.round(weightedSum);

console.log('📊 Manual Grade Calculation:');
console.log(`Factor scores: ${factors.map(f => f.score).join(', ')}`);
console.log(`Weights: ${factors.map(f => f.weight).join(', ')}`);
console.log(`Weighted contributions: ${factors.map(f => (f.score * f.weight).toFixed(2)).join(', ')}`);
console.log(`Sum: ${weightedSum.toFixed(2)}`);
console.log(`Rounded: ${overallScore}`);

// Grade assignment
let grade;
if (overallScore >= 95) grade = 'A+';
else if (overallScore >= 90) grade = 'A';
else if (overallScore >= 85) grade = 'B+';
else if (overallScore >= 80) grade = 'B';
else if (overallScore >= 75) grade = 'C+';
else if (overallScore >= 70) grade = 'C';
else if (overallScore >= 60) grade = 'D';
else grade = 'F';

console.log(`Final Grade: ${grade}`);

// Expected: 72*0.15 + 80*0.15 + 77*0.15 + 75*0.15 + 100*0.25 + 94*0.15 
// = 10.8 + 12 + 11.55 + 11.25 + 25 + 14.1 = 84.7 = B+ grade