console.log("🧪 TESTING ENHANCED BANDED SCORING FOR C GRADE GENERATION");
console.log("============================================================\n");

// Simulate the enhanced banded scoring system to verify C grade generation
function calculateBandedScore(rawValue, factorType) {
    let percentileScore;
    
    // Enhanced banded scoring with wider distribution to generate C grades
    switch (factorType) {
        case 'offensive':
            // More aggressive scaling to create lower scores for average/poor performance
            if (rawValue >= 85) percentileScore = 88;        // Elite band: 86-90
            else if (rawValue >= 75) percentileScore = 78;   // Strong band: 76-80  
            else if (rawValue >= 65) percentileScore = 68;   // Good band: 66-70
            else if (rawValue >= 50) percentileScore = 58;   // Average band: 56-60
            else if (rawValue >= 35) percentileScore = 48;   // Below average: 46-50
            else if (rawValue >= 20) percentileScore = 40;   // Poor band: 38-42
            else percentileScore = 32;                       // Very poor: 30-34
            break;
            
        case 'pitching':
            // More realistic distribution based on actual matchup quality
            if (rawValue >= 85) percentileScore = 82;        // Elite matchup: 80-84
            else if (rawValue >= 70) percentileScore = 72;   // Good matchup: 70-74
            else if (rawValue >= 55) percentileScore = 62;   // Average matchup: 60-64
            else if (rawValue >= 40) percentileScore = 52;   // Poor matchup: 50-54
            else if (rawValue >= 25) percentileScore = 42;   // Very poor: 40-44
            else percentileScore = 34;                       // Terrible: 32-36
            break;
            
        case 'situational':
            // Ballpark and situational factors with realistic variance
            if (rawValue >= 80) percentileScore = 75;        // Major advantage: 73-77
            else if (rawValue >= 65) percentileScore = 68;   // Good advantage: 66-70
            else if (rawValue >= 50) percentileScore = 60;   // Slight advantage: 58-62
            else if (rawValue >= 35) percentileScore = 52;   // Neutral/slight disadvantage: 50-54
            else if (rawValue >= 20) percentileScore = 44;   // Disadvantage: 42-46
            else percentileScore = 36;                       // Major disadvantage: 34-38
            break;
            
        case 'momentum':
            // Team momentum with more realistic spread
            if (rawValue >= 85) percentileScore = 80;        // Hot streak: 78-82
            else if (rawValue >= 70) percentileScore = 70;   // Good form: 68-72
            else if (rawValue >= 55) percentileScore = 60;   // Average form: 58-62
            else if (rawValue >= 40) percentileScore = 50;   // Poor form: 48-52
            else if (rawValue >= 25) percentileScore = 42;   // Cold streak: 40-44
            else percentileScore = 34;                       // Very cold: 32-36
            break;
            
        case 'market':
            // Market inefficiency - keep high scores for real edges but lower baseline
            if (rawValue >= 6.0) percentileScore = 95;       // Exceptional edge: 93-97
            else if (rawValue >= 4.0) percentileScore = 88;  // Strong edge: 86-90
            else if (rawValue >= 2.5) percentileScore = 80;  // Good edge: 78-82
            else if (rawValue >= 1.5) percentileScore = 68;  // Decent edge: 66-70
            else if (rawValue >= 0.8) percentileScore = 58;  // Small edge: 56-60
            else if (rawValue >= 0.3) percentileScore = 48;  // Minimal edge: 46-50
            else percentileScore = 38;                       // No edge: 36-40
            break;
            
        case 'confidence':
            // System confidence with wider spread for varying data quality
            if (rawValue >= 95) percentileScore = 92;        // Perfect confidence: 90-94
            else if (rawValue >= 85) percentileScore = 82;   // High confidence: 80-84
            else if (rawValue >= 75) percentileScore = 72;   // Good confidence: 70-74
            else if (rawValue >= 65) percentileScore = 62;   // Moderate confidence: 60-64
            else if (rawValue >= 55) percentileScore = 52;   // Low confidence: 50-54
            else if (rawValue >= 45) percentileScore = 44;   // Poor confidence: 42-46
            else percentileScore = 36;                       // Very poor: 34-38
            break;
            
        default:
            percentileScore = 55; // Neutral fallback (slightly below average)
    }
    
    // Add randomization within the band (±3 points for more variation)
    const randomVariation = (Math.random() - 0.5) * 6; // -3 to +3
    const finalScore = Math.round(percentileScore + randomVariation);
    
    // Clamp to realistic range with lower floor to enable C grades
    return Math.max(30, Math.min(100, finalScore));
}

// Grade conversion function using optimized thresholds
function scoreToGrade(score) {
    if (score >= 78.5) return 'A+';  // Top 3-5% - exceptional (1-2 games)
    if (score >= 76.0) return 'A';   // Top 8-10% - elite (2-3 games)  
    if (score >= 73.5) return 'A-';  // Top 13-15% - very strong (2-3 games)
    if (score >= 70.0) return 'B+';  // Top 20-25% - strong (4-5 games)
    if (score >= 66.0) return 'B';   // Top 35-40% - good (6-7 games)
    if (score >= 62.0) return 'B-';  // Top 50-55% - decent (4-5 games)
    if (score >= 58.0) return 'C+';  // Top 65-70% - above average (3-4 games)
    if (score >= 54.0) return 'C';   // Average games (3-4 games)
    if (score >= 50.0) return 'C-';  // Below average (2-3 games)
    if (score >= 47.0) return 'D+';  // Poor games (1-2 games)
    if (score >= 44.0) return 'D';   // Very poor (0-1 games)
    return 'F';                      // Avoid completely
}

// Calculate weighted average with actual factor weights
function calculateWeightedAverage(factors) {
    const weights = {
        offensive: 0.15,
        pitching: 0.15,
        situational: 0.15,
        momentum: 0.15,
        market: 0.25,      // Market inefficiency weighted higher
        confidence: 0.15
    };
    
    return (factors.offensive * weights.offensive +
            factors.pitching * weights.pitching +
            factors.situational * weights.situational +
            factors.momentum * weights.momentum +
            factors.market * weights.market +
            factors.confidence * weights.confidence);
}

console.log("📊 TESTING VARIOUS RAW VALUE COMBINATIONS:");
console.log("==========================================");

// Test scenarios designed to generate different grade ranges
const testScenarios = [
    {
        name: "Elite Team (High Edge)",
        raw: { offensive: 85, pitching: 80, situational: 75, momentum: 80, market: 8.0, confidence: 90 }
    },
    {
        name: "Strong Team (Good Edge)", 
        raw: { offensive: 75, pitching: 70, situational: 65, momentum: 70, market: 4.0, confidence: 80 }
    },
    {
        name: "Above Average Team",
        raw: { offensive: 65, pitching: 60, situational: 55, momentum: 60, market: 2.0, confidence: 70 }
    },
    {
        name: "Average Team (Should be C range)",
        raw: { offensive: 50, pitching: 45, situational: 40, momentum: 45, market: 1.0, confidence: 60 }
    },
    {
        name: "Below Average Team (Should be C- range)",
        raw: { offensive: 40, pitching: 35, situational: 30, momentum: 35, market: 0.5, confidence: 50 }
    },
    {
        name: "Poor Team (Should be D range)",
        raw: { offensive: 25, pitching: 20, situational: 25, momentum: 20, market: 0.2, confidence: 40 }
    },
    {
        name: "Terrible Team (Should be F)",
        raw: { offensive: 15, pitching: 10, situational: 15, momentum: 10, market: 0.1, confidence: 30 }
    }
];

const gradeDistribution = {};
const allGrades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F'];
allGrades.forEach(grade => gradeDistribution[grade] = 0);

testScenarios.forEach((scenario, index) => {
    console.log(`\n${index + 1}. ${scenario.name}:`);
    
    // Convert raw values to banded scores for each factor
    const factors = {
        offensive: calculateBandedScore(scenario.raw.offensive, 'offensive'),
        pitching: calculateBandedScore(scenario.raw.pitching, 'pitching'),
        situational: calculateBandedScore(scenario.raw.situational, 'situational'),
        momentum: calculateBandedScore(scenario.raw.momentum, 'momentum'),
        market: calculateBandedScore(scenario.raw.market, 'market'),
        confidence: calculateBandedScore(scenario.raw.confidence, 'confidence')
    };
    
    const weightedAverage = calculateWeightedAverage(factors);
    const grade = scoreToGrade(weightedAverage);
    gradeDistribution[grade]++;
    
    console.log(`   Raw inputs: [${Object.values(scenario.raw).join(', ')}]`);
    console.log(`   Banded scores: [${Object.values(factors).join(', ')}]`);
    console.log(`   Weighted Average: ${weightedAverage.toFixed(1)}`);
    console.log(`   Final Grade: ${grade}`);
});

console.log(`\n📈 GRADE DISTRIBUTION FROM TEST SCENARIOS:`);
console.log(`=========================================`);

let cGradeCount = 0;
allGrades.forEach(grade => {
    if (gradeDistribution[grade] > 0) {
        console.log(`${grade}: ${gradeDistribution[grade]} scenarios`);
        if (['C+', 'C', 'C-'].includes(grade)) {
            cGradeCount += gradeDistribution[grade];
        }
    }
});

console.log(`\n✅ C GRADE GENERATION VERIFICATION:`);
console.log(`==================================`);
console.log(`Total C grades (C+, C, C-): ${cGradeCount}/${testScenarios.length}`);

if (cGradeCount >= 2) {
    console.log(`✅ SUCCESS: Enhanced banded scoring generates C grades for realistic scenarios`);
} else {
    console.log(`⚠️  NEEDS ADJUSTMENT: Only ${cGradeCount} C grades generated - may need lower thresholds`);
}

console.log(`\n🎯 ENHANCED SCORING BENEFITS:`);
console.log(`============================`);
console.log(`• ✅ More aggressive scaling for average/poor raw values`);
console.log(`• ✅ Lower baseline scores (30-100 range vs 35-100)`);
console.log(`• ✅ Wider randomization (±3 vs ±2) for more variation`);
console.log(`• ✅ Realistic distribution targeting C grades for average teams`);
console.log(`• ✅ Maintains high scores for elite market edges and confidence`);