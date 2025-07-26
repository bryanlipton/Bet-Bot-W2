console.log("🎯 TESTING REALISTIC BANDED SCORING SYSTEM");
console.log("==========================================\n");

// Test the banded scoring system directly
async function testBandedScoring() {
    console.log("📊 TESTING BANDED SCORING WITH SAMPLE VALUES:\n");
    
    // Test cases with different raw values for each factor type
    const testCases = [
        // Offensive Production Tests
        { factor: 'offensive', rawValue: 90, expected: 'Elite (88-92)' },
        { factor: 'offensive', rawValue: 75, expected: 'Strong (78-82)' },
        { factor: 'offensive', rawValue: 60, expected: 'Good (68-72)' },
        { factor: 'offensive', rawValue: 45, expected: 'Average (58-62)' },
        { factor: 'offensive', rawValue: 30, expected: 'Below Avg (48-52)' },
        { factor: 'offensive', rawValue: 15, expected: 'Poor (38-42)' },
        
        // Pitching Matchup Tests
        { factor: 'pitching', rawValue: 85, expected: 'Elite (83-87)' },
        { factor: 'pitching', rawValue: 70, expected: 'Good (73-77)' },
        { factor: 'pitching', rawValue: 55, expected: 'Average (63-67)' },
        { factor: 'pitching', rawValue: 40, expected: 'Poor (53-57)' },
        { factor: 'pitching', rawValue: 25, expected: 'Very Poor (43-47)' },
        
        // Market Inefficiency Tests
        { factor: 'market', rawValue: 7.0, expected: 'Exceptional (93-97)' },
        { factor: 'market', rawValue: 5.0, expected: 'Strong (86-90)' },
        { factor: 'market', rawValue: 3.0, expected: 'Good (78-82)' },
        { factor: 'market', rawValue: 2.0, expected: 'Decent (68-72)' },
        { factor: 'market', rawValue: 1.0, expected: 'Small (58-62)' },
        { factor: 'market', rawValue: 0.5, expected: 'Minimal (48-52)' },
        
        // Confidence Tests
        { factor: 'confidence', rawValue: 98, expected: 'Perfect (93-97)' },
        { factor: 'confidence', rawValue: 90, expected: 'High (86-90)' },
        { factor: 'confidence', rawValue: 80, expected: 'Good (78-82)' },
        { factor: 'confidence', rawValue: 70, expected: 'Moderate (68-72)' },
        { factor: 'confidence', rawValue: 60, expected: 'Low (58-62)' },
        { factor: 'confidence', rawValue: 50, expected: 'Poor (48-52)' }
    ];
    
    // Simulate the banded scoring logic
    function simulateBandedScore(rawValue, factorType) {
        let percentileScore;
        
        switch (factorType) {
            case 'offensive':
                if (rawValue >= 85) percentileScore = 90;        // Elite band: 88-92
                else if (rawValue >= 70) percentileScore = 80;   // Strong band: 78-82
                else if (rawValue >= 55) percentileScore = 70;   // Good band: 68-72
                else if (rawValue >= 40) percentileScore = 60;   // Average band: 58-62
                else if (rawValue >= 25) percentileScore = 50;   // Below average: 48-52
                else percentileScore = 40;                       // Poor band: 38-42
                break;
                
            case 'pitching':
                if (rawValue >= 80) percentileScore = 85;        // Elite matchup: 83-87
                else if (rawValue >= 65) percentileScore = 75;   // Good matchup: 73-77
                else if (rawValue >= 50) percentileScore = 65;   // Average matchup: 63-67
                else if (rawValue >= 35) percentileScore = 55;   // Poor matchup: 53-57
                else percentileScore = 45;                       // Very poor: 43-47
                break;
                
            case 'market':
                if (rawValue >= 6.0) percentileScore = 95;       // Exceptional edge: 93-97
                else if (rawValue >= 4.0) percentileScore = 88;  // Strong edge: 86-90
                else if (rawValue >= 2.5) percentileScore = 80;  // Good edge: 78-82
                else if (rawValue >= 1.5) percentileScore = 70;  // Decent edge: 68-72
                else if (rawValue >= 0.8) percentileScore = 60;  // Small edge: 58-62
                else percentileScore = 50;                       // Minimal edge: 48-52
                break;
                
            case 'confidence':
                if (rawValue >= 95) percentileScore = 95;        // Perfect confidence: 93-97
                else if (rawValue >= 85) percentileScore = 88;   // High confidence: 86-90
                else if (rawValue >= 75) percentileScore = 80;   // Good confidence: 78-82
                else if (rawValue >= 65) percentileScore = 70;   // Moderate confidence: 68-72
                else if (rawValue >= 55) percentileScore = 60;   // Low confidence: 58-62
                else percentileScore = 50;                       // Poor confidence: 48-52
                break;
                
            default:
                percentileScore = 60;
        }
        
        // Add randomization within the band (±2 points)
        const randomVariation = (Math.random() - 0.5) * 4; // -2 to +2
        const finalScore = Math.round(percentileScore + randomVariation);
        
        return Math.max(35, Math.min(100, finalScore));
    }
    
    // Test each case multiple times to show randomization
    testCases.forEach(testCase => {
        console.log(`🔍 ${testCase.factor.toUpperCase()} - Raw Value: ${testCase.rawValue} (Expected: ${testCase.expected})`);
        
        const scores = [];
        for (let i = 0; i < 5; i++) {
            scores.push(simulateBandedScore(testCase.rawValue, testCase.factor));
        }
        
        console.log(`   Generated Scores: [${scores.join(', ')}]`);
        console.log(`   Range: ${Math.min(...scores)}-${Math.max(...scores)}, Avg: ${(scores.reduce((a,b) => a+b) / scores.length).toFixed(1)}\n`);
    });
}

console.log("🧪 TESTING WEIGHTED GRADE CALCULATION:\n");

// Test realistic game scenarios
const gameScenarios = [
    {
        name: "Elite Pick",
        factors: [88, 85, 82, 87, 95, 94], // High scores across all factors
        weights: [0.15, 0.15, 0.15, 0.15, 0.25, 0.15]
    },
    {
        name: "Strong Pick", 
        factors: [80, 76, 72, 75, 88, 86], // Good scores
        weights: [0.15, 0.15, 0.15, 0.15, 0.25, 0.15]
    },
    {
        name: "Average Pick",
        factors: [62, 67, 60, 65, 72, 70], // Average scores
        weights: [0.15, 0.15, 0.15, 0.15, 0.25, 0.15]
    },
    {
        name: "Poor Pick",
        factors: [45, 47, 42, 48, 52, 50], // Low scores
        weights: [0.15, 0.15, 0.15, 0.15, 0.25, 0.15]
    },
    {
        name: "Mixed Quality",
        factors: [88, 47, 72, 85, 68, 75], // Varied scores
        weights: [0.15, 0.15, 0.15, 0.15, 0.25, 0.15]
    }
];

gameScenarios.forEach(scenario => {
    const weightedAvg = scenario.factors.reduce((sum, factor, i) => 
        sum + (factor * scenario.weights[i]), 0);
    
    // Grade mapping
    let grade;
    if (weightedAvg >= 78) grade = 'A+';
    else if (weightedAvg >= 75) grade = 'A';
    else if (weightedAvg >= 72) grade = 'A-';
    else if (weightedAvg >= 69) grade = 'B+';
    else if (weightedAvg >= 66) grade = 'B';
    else if (weightedAvg >= 63) grade = 'B-';
    else if (weightedAvg >= 60) grade = 'C+';
    else if (weightedAvg >= 57) grade = 'C';
    else grade = 'C-';
    
    console.log(`📊 ${scenario.name}:`);
    console.log(`   Factors: [${scenario.factors.join(', ')}]`);
    console.log(`   Weights: [${scenario.weights.map(w => (w*100).toFixed(0)+'%').join(', ')}]`);
    console.log(`   Weighted Avg: ${weightedAvg.toFixed(1)}`);
    console.log(`   Grade: ${grade}\n`);
});

console.log("✅ EXPECTED IMPROVEMENTS:");
console.log("• Factor scores now vary significantly (35-100 range)");
console.log("• Realistic banded scoring based on performance tiers");
console.log("• Randomization within bands creates natural variation");
console.log("• Market inefficiency properly weighted at 25%");
console.log("• Grade distribution should span full A+ through C- range");
console.log("• No more identical 50-54 scores across all factors");

testBandedScoring();