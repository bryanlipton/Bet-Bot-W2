console.log("🧪 TESTING NEW GRADE THRESHOLDS WITH CURRENT DATA");
console.log("=================================================\n");

// Current weighted averages from our realistic banded scoring system
const currentData = [
    { team: "Milwaukee Brewers", weightedAvg: 79.0 },
    { team: "Seattle Mariners", weightedAvg: 76.0 },
    { team: "Los Angeles Dodgers", weightedAvg: 75.1 },
    { team: "Tampa Bay Rays", weightedAvg: 74.0 },
    { team: "Washington Nationals", weightedAvg: 71.0 },
    { team: "Oakland Athletics", weightedAvg: 72.5 },
    { team: "Toronto Blue Jays", weightedAvg: 68.3 }
];

// New optimized grade thresholds from dailyPickService.ts
function calculateNewGrade(weightedSum) {
    if (weightedSum >= 78.5) return 'A+';  // Top 3-5% - exceptional (1-2 games)
    if (weightedSum >= 76.0) return 'A';   // Top 8-10% - elite (2-3 games)  
    if (weightedSum >= 73.5) return 'A-';  // Top 13-15% - very strong (2-3 games)
    if (weightedSum >= 70.0) return 'B+';  // Top 20-25% - strong (4-5 games)
    if (weightedSum >= 66.0) return 'B';   // Top 35-40% - good (6-7 games)
    if (weightedSum >= 62.0) return 'B-';  // Top 50-55% - decent (4-5 games)
    if (weightedSum >= 58.0) return 'C+';  // Top 65-70% - above average (3-4 games)
    if (weightedSum >= 54.0) return 'C';   // Average games (3-4 games)
    if (weightedSum >= 50.0) return 'C-';  // Below average (2-3 games)
    if (weightedSum >= 47.0) return 'D+';  // Poor games (1-2 games)
    if (weightedSum >= 44.0) return 'D';   // Very poor (0-1 games)
    return 'F';                            // Avoid completely
}

// Test new thresholds
console.log("📊 NEW GRADE DISTRIBUTION WITH UPDATED THRESHOLDS:");
console.log("==================================================");

const gradeDistribution = {};
let aMinusOrBetter = 0;

// Sort by weighted average (highest to lowest)
const sortedData = [...currentData].sort((a, b) => b.weightedAvg - a.weightedAvg);

sortedData.forEach((team, index) => {
    const grade = calculateNewGrade(team.weightedAvg);
    
    if (!gradeDistribution[grade]) {
        gradeDistribution[grade] = [];
    }
    gradeDistribution[grade].push(team);
    
    if (['A+', 'A', 'A-'].includes(grade)) {
        aMinusOrBetter++;
    }
    
    console.log(`${index + 1}. ${team.team}: ${team.weightedAvg} → ${grade}`);
});

console.log("\n🎯 GRADE SUMMARY:");
console.log("=================");

const grades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F'];
grades.forEach(grade => {
    const count = gradeDistribution[grade] ? gradeDistribution[grade].length : 0;
    if (count > 0) {
        const teams = gradeDistribution[grade].map(t => t.team).join(', ');
        console.log(`${grade}: ${count} team(s) - ${teams}`);
    }
});

console.log(`\n✅ A- or Better: ${aMinusOrBetter} teams (Target: 3+)`);

// Analysis of threshold effectiveness
console.log("\n📈 THRESHOLD ANALYSIS:");
console.log("======================");

if (aMinusOrBetter >= 3) {
    console.log("✅ SUCCESS: Achieved target of 3+ A- or better games");
} else {
    console.log("❌ NEEDS ADJUSTMENT: Only " + aMinusOrBetter + " A- or better games");
    
    // Suggest threshold adjustments
    console.log("\n🔧 SUGGESTED ADJUSTMENTS:");
    const thirdHighest = sortedData[2]?.weightedAvg;
    if (thirdHighest) {
        console.log(`Lower A- threshold to ${(thirdHighest - 0.1).toFixed(1)} to include top 3 teams`);
    }
}

// Expected distribution for a full 30-game slate
console.log("\n🎲 PROJECTED FULL SLATE DISTRIBUTION:");
console.log("=====================================");

const projectedDistribution = {
    "A+": "1-2 games (78.5+)",
    "A": "2-3 games (76.0-78.4)",
    "A-": "2-3 games (73.5-75.9)",
    "B+": "4-5 games (70.0-73.4)",
    "B": "6-7 games (66.0-69.9)",
    "B-": "4-5 games (62.0-65.9)",
    "C+": "3-4 games (58.0-61.9)",
    "C": "3-4 games (54.0-57.9)",
    "Others": "2-4 games (below 54.0)"
};

Object.entries(projectedDistribution).forEach(([grade, description]) => {
    console.log(`${grade}: ${description}`);
});

console.log("\n✨ KEY BENEFITS OF NEW THRESHOLDS:");
console.log("==================================");
console.log("• Creates realistic grade distribution across full spectrum");
console.log("• Ensures premium A+ grades remain exclusive (1-2 per day)");
console.log("• Provides clear value tiers for user decision making");
console.log("• Utilizes authentic weighted average range from realistic banded scoring");
console.log("• Maintains professional betting analysis standards");