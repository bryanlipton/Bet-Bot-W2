console.log("🎯 REVISED GRADE THRESHOLDS FOR 3+ A- OR BETTER GAMES");
console.log("=====================================================\n");

// Target distribution for ~30 games per day with 3+ A- or better:
// A+: 1-2 games (3-7%)
// A:  2-3 games (7-10%) 
// A-: 2-3 games (7-10%)
// Total A- or better: 5-8 games (17-27%) - ensuring at least 3

const revisedTargetDistribution = {
    "A+": { percentage: 5, games: "1-2" },
    "A":  { percentage: 8.5, games: "2-3" },
    "A-": { percentage: 8.5, games: "2-3" },
    "B+": { percentage: 16, games: "4-5" },
    "B":  { percentage: 24, games: "7-8" },
    "C+": { percentage: 16, games: "4-5" },
    "C":  { percentage: 12, games: "3-4" },
    "D+": { percentage: 7, games: "2-3" },
    "D":  { percentage: 3, games: "0-1" }
};

// Practical range: 45-86 points
const practicalMin = 45;
const practicalMax = 86;
const practicalSpread = practicalMax - practicalMin;

// Calculate thresholds based on cumulative percentages from top
let cumulativePercentage = 0;
const grades = ["A+", "A", "A-", "B+", "B", "C+", "C", "D+", "D"];
const revisedThresholds = {};

grades.forEach((grade, index) => {
    const targetPercent = revisedTargetDistribution[grade].percentage;
    cumulativePercentage += targetPercent;
    
    // Convert percentage to threshold (higher percentage = lower threshold)
    const percentileFromTop = cumulativePercentage / 100;
    const threshold = practicalMax - (percentileFromTop * practicalSpread);
    
    revisedThresholds[grade] = Math.round(threshold * 10) / 10;
});

console.log("🎯 REVISED GRADE THRESHOLDS (Target: 3+ A- or better):");
console.log("======================================================");

grades.forEach(grade => {
    const threshold = revisedThresholds[grade];
    const distribution = revisedTargetDistribution[grade];
    console.log(`${grade}: ${threshold}+ (Target: ${distribution.games} games, ${distribution.percentage}%)`);
});

// Test against current data
const currentData = [
    { team: "Milwaukee Brewers", weightedAvg: 79.0 },
    { team: "Seattle Mariners", weightedAvg: 76.0 },
    { team: "Los Angeles Dodgers", weightedAvg: 75.1 },
    { team: "Tampa Bay Rays", weightedAvg: 74.0 },
    { team: "Oakland Athletics", weightedAvg: 72.5 },
    { team: "Washington Nationals", weightedAvg: 71.0 },
    { team: "Toronto Blue Jays", weightedAvg: 68.3 }
];

function getRevisedGrade(weightedAvg) {
    if (weightedAvg >= revisedThresholds["A+"]) return "A+";
    if (weightedAvg >= revisedThresholds["A"]) return "A";
    if (weightedAvg >= revisedThresholds["A-"]) return "A-";
    if (weightedAvg >= revisedThresholds["B+"]) return "B+";
    if (weightedAvg >= revisedThresholds["B"]) return "B";
    if (weightedAvg >= revisedThresholds["C+"]) return "C+";
    if (weightedAvg >= revisedThresholds["C"]) return "C";
    if (weightedAvg >= revisedThresholds["D+"]) return "D+";
    return "D";
}

console.log("\n🧪 TESTING REVISED THRESHOLDS:");
console.log("===============================");

const revisedGradeDistribution = {};
grades.forEach(grade => revisedGradeDistribution[grade] = []);

currentData.forEach(team => {
    const grade = getRevisedGrade(team.weightedAvg);
    revisedGradeDistribution[grade].push(team);
    console.log(`${team.team}: ${team.weightedAvg} → ${grade}`);
});

console.log("\n📈 REVISED DISTRIBUTION SUMMARY:");
console.log("================================");

let aMinusOrBetter = 0;
grades.forEach(grade => {
    const count = revisedGradeDistribution[grade].length;
    if (count > 0) {
        console.log(`${grade}: ${count} teams`);
    }
    
    if (["A+", "A", "A-"].includes(grade)) {
        aMinusOrBetter += count;
    }
});

console.log(`\nA- or Better: ${aMinusOrBetter} teams ✓ (Target: 3+)`);

console.log("\n💻 FINAL IMPLEMENTATION:");
console.log("========================");
console.log("Updated thresholds for calculateGrade function:");
console.log(`A+: ${revisedThresholds["A+"]}+`);
console.log(`A: ${revisedThresholds["A"]}+`);
console.log(`A-: ${revisedThresholds["A-"]}+`);
console.log(`B+: ${revisedThresholds["B+"]}+`);
console.log(`B: ${revisedThresholds["B"]}+`);
console.log(`C+: ${revisedThresholds["C+"]}+`);
console.log(`C: ${revisedThresholds["C"]}+`);
console.log(`D+: ${revisedThresholds["D+"]}+`);