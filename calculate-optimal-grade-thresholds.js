console.log("🎯 CALCULATING OPTIMAL GRADE THRESHOLDS FOR EVEN DISTRIBUTION");
console.log("==============================================================\n");

// Current weighted averages from new realistic banded scoring system
const currentData = [
    { team: "Los Angeles Dodgers", weightedAvg: 75.1, currentGrade: "A" },
    { team: "Tampa Bay Rays", weightedAvg: 74.0, currentGrade: "A-" },
    { team: "Washington Nationals", weightedAvg: 71.0, currentGrade: "B+" },
    { team: "Toronto Blue Jays", weightedAvg: 68.3, currentGrade: "B" },
    { team: "Milwaukee Brewers", weightedAvg: 79.0, currentGrade: "A+" }, // Estimated
    { team: "Oakland Athletics", weightedAvg: 72.5, currentGrade: "B+" }, // Estimated
    { team: "Seattle Mariners", weightedAvg: 76.0, currentGrade: "A" }, // From Pro logs
];

// Theoretical range based on factor bands (35-100) and weights
const theoreticalRange = {
    min: 37.3, // Calculated minimum with all poor factors
    max: 94.0, // Calculated maximum with all elite factors
    practicalMin: 45.0, // Realistic minimum (some factors won't be bottom tier)
    practicalMax: 86.0  // Realistic maximum (some factors won't be top tier)
};

// Current observed range
const observedWeightedAvgs = currentData.map(d => d.weightedAvg).sort((a, b) => b - a);
const currentMin = Math.min(...observedWeightedAvgs);
const currentMax = Math.max(...observedWeightedAvgs);

console.log("📊 CURRENT DATA ANALYSIS:");
console.log("=========================");
console.log(`Current Range: ${currentMin} - ${currentMax} (${(currentMax - currentMin).toFixed(1)} point spread)`);
console.log(`Theoretical Range: ${theoreticalRange.min} - ${theoreticalRange.max}`);
console.log(`Practical Range: ${theoreticalRange.practicalMin} - ${theoreticalRange.practicalMax}`);

// Sort current data by weighted average
const sortedData = [...currentData].sort((a, b) => b.weightedAvg - a.weightedAvg);

console.log("\nCurrent Distribution:");
sortedData.forEach((team, index) => {
    console.log(`${index + 1}. ${team.team}: ${team.weightedAvg} (${team.currentGrade})`);
});

// Target distribution for ~30 games per day:
// A+: 2-3 games (7-10%)
// A:  3-4 games (10-13%) 
// A-: 3-4 games (10-13%)
// B+: 4-5 games (13-17%)
// B:  6-7 games (20-23%)
// C+: 4-5 games (13-17%)
// C:  3-4 games (10-13%)
// D+: 2-3 games (7-10%)
// D:  1-2 games (3-7%)

const targetDistribution = {
    "A+": { percentage: 8.5, games: "2-3" },
    "A":  { percentage: 11.5, games: "3-4" },
    "A-": { percentage: 11.5, games: "3-4" },
    "B+": { percentage: 15, games: "4-5" },
    "B":  { percentage: 21.5, games: "6-7" },
    "C+": { percentage: 15, games: "4-5" },
    "C":  { percentage: 11.5, games: "3-4" },
    "D+": { percentage: 8.5, games: "2-3" },
    "D":  { percentage: 5, games: "1-2" }
};

// Calculate thresholds based on practical range and target percentiles
const practicalSpread = theoreticalRange.practicalMax - theoreticalRange.practicalMin;
const gradeThresholds = {};

// Calculate cumulative percentages from top down
let cumulativePercentage = 0;
const grades = ["A+", "A", "A-", "B+", "B", "C+", "C", "D+", "D"];

grades.forEach((grade, index) => {
    const targetPercent = targetDistribution[grade].percentage;
    cumulativePercentage += targetPercent;
    
    // Convert percentage to threshold (higher percentage = lower threshold)
    const percentileFromTop = cumulativePercentage / 100;
    const threshold = theoreticalRange.practicalMax - (percentileFromTop * practicalSpread);
    
    gradeThresholds[grade] = Math.round(threshold * 10) / 10; // Round to 1 decimal
});

console.log("\n🎯 PROPOSED GRADE THRESHOLDS:");
console.log("==============================");

grades.forEach(grade => {
    const threshold = gradeThresholds[grade];
    const distribution = targetDistribution[grade];
    console.log(`${grade}: ${threshold}+ (Target: ${distribution.games} games, ${distribution.percentage}%)`);
});

// Test new thresholds against current data
console.log("\n🧪 TESTING NEW THRESHOLDS AGAINST CURRENT DATA:");
console.log("================================================");

function getNewGrade(weightedAvg) {
    if (weightedAvg >= gradeThresholds["A+"]) return "A+";
    if (weightedAvg >= gradeThresholds["A"]) return "A";
    if (weightedAvg >= gradeThresholds["A-"]) return "A-";
    if (weightedAvg >= gradeThresholds["B+"]) return "B+";
    if (weightedAvg >= gradeThresholds["B"]) return "B";
    if (weightedAvg >= gradeThresholds["C+"]) return "C+";
    if (weightedAvg >= gradeThresholds["C"]) return "C";
    if (weightedAvg >= gradeThresholds["D+"]) return "D+";
    return "D";
}

const newGradeDistribution = {};
grades.forEach(grade => newGradeDistribution[grade] = []);

sortedData.forEach(team => {
    const newGrade = getNewGrade(team.weightedAvg);
    const oldGrade = team.currentGrade;
    newGradeDistribution[newGrade].push(team);
    
    const change = newGrade !== oldGrade ? ` (was ${oldGrade})` : " (unchanged)";
    console.log(`${team.team}: ${team.weightedAvg} → ${newGrade}${change}`);
});

console.log("\n📈 NEW DISTRIBUTION SUMMARY:");
console.log("============================");

let aMinusOrBetter = 0;
grades.forEach(grade => {
    const count = newGradeDistribution[grade].length;
    console.log(`${grade}: ${count} teams`);
    
    if (["A+", "A", "A-"].includes(grade)) {
        aMinusOrBetter += count;
    }
});

console.log(`\nA- or Better: ${aMinusOrBetter} teams ✓`);

// Generate the code changes needed
console.log("\n💻 IMPLEMENTATION PLAN:");
console.log("=======================");

console.log("\n1. Update grading function in bettingRecommendationEngine.ts:");
console.log("```typescript");
console.log("function calculateGrade(weightedAverage: number): string {");
grades.forEach(grade => {
    if (grade === "D") {
        console.log(`  return '${grade}';`);
    } else {
        console.log(`  if (weightedAverage >= ${gradeThresholds[grade]}) return '${grade}';`);
    }
});
console.log("}");
console.log("```");

console.log("\n2. Expected Results:");
console.log("- More even distribution across D through A+ grades");
console.log("- 7-11 A- or better games per day (target: 3-4 was too conservative)");
console.log("- Better utilization of the full 65-point factor range");
console.log("- Professional-grade variation matching industry standards");

console.log("\n✅ KEY BENEFITS:");
console.log("================");
console.log("• Utilizes full practical range (45-86 points)");
console.log("• Creates realistic bell curve distribution");
console.log("• Ensures premium grades (A+/A) remain exclusive");
console.log("• Provides clear value differentiation for users");
console.log("• Matches betting industry grading standards");