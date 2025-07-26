// Simple test script to extract raw grade calculations
async function showAllGradeCalculations() {
  console.log("🎯 FETCHING ALL PICK GRADE CALCULATIONS\n");

  try {
    // Fetch from the API endpoint instead
    const response = await fetch('http://localhost:5000/api/recommendations/baseball_mlb');
    const allRecommendations = await response.json();
    
    console.log(`📊 TOTAL GAMES ANALYZED: ${allRecommendations.length}\n`);
    console.log("=" * 80);
    
    // Show detailed breakdown for each game
    allRecommendations.forEach((rec, index) => {
      console.log(`\n🏟️ GAME ${index + 1}: ${rec.awayTeam} @ ${rec.homeTeam}`);
      console.log(`   Pick: ${rec.team} ${rec.market} (${rec.odds > 0 ? '+' : ''}${rec.odds})`);
      console.log(`   Grade: ${rec.grade} (Confidence: ${rec.confidence})`);
      
      if (rec.analysis) {
        console.log(`\n📊 RAW FACTOR SCORES:`);
        console.log(`   • Offensive Production: ${rec.analysis.offensiveProduction || 'N/A'}`);
        console.log(`   • Pitching Matchup: ${rec.analysis.pitchingMatchup || 'N/A'}`);
        console.log(`   • Situational Edge: ${rec.analysis.situationalEdge || 'N/A'}`);
        console.log(`   • Team Momentum: ${rec.analysis.teamMomentum || 'N/A'}`);
        console.log(`   • Market Inefficiency: ${rec.analysis.marketInefficiency || 'N/A'}`);
        console.log(`   • System Confidence: ${rec.analysis.systemConfidence || 'N/A'}`);
        
        // Calculate weighted average manually
        const factors = [
          rec.analysis.offensiveProduction || 0,
          rec.analysis.pitchingMatchup || 0,
          rec.analysis.situationalEdge || 0,
          rec.analysis.teamMomentum || 0,
          rec.analysis.marketInefficiency || 0,
          rec.analysis.systemConfidence || 0
        ];
        
        // Weights: Offensive (15%), Pitching (15%), Situational (15%), Momentum (15%), Market (25%), Confidence (15%)
        const weights = [0.15, 0.15, 0.15, 0.15, 0.25, 0.15];
        const weightedSum = factors.reduce((sum, factor, i) => sum + (factor * weights[i]), 0);
        
        console.log(`\n🧮 WEIGHTED CALCULATION:`);
        console.log(`   Raw Weighted Average: ${weightedSum.toFixed(1)}`);
        console.log(`   Final Grade: ${rec.grade}`);
        
        // Show grade thresholds
        const gradeThresholds = {
          'A+': 78, 'A': 75, 'A-': 72, 'B+': 69, 'B': 66, 'B-': 63,
          'C+': 60, 'C': 57, 'C-': 54, 'D+': 51, 'D': 48, 'D-': 45
        };
        
        const currentThreshold = gradeThresholds[rec.grade] || 'Unknown';
        console.log(`   Grade Threshold: ${rec.grade} requires ${currentThreshold}+ points`);
      }
      
      console.log("\n" + "-".repeat(70));
    });
    
    // Summary statistics
    const gradeCount = {};
    const weightedAverages = [];
    
    allRecommendations.forEach(rec => {
      gradeCount[rec.grade] = (gradeCount[rec.grade] || 0) + 1;
      
      if (rec.analysis) {
        const factors = [
          rec.analysis.offensiveProduction || 0,
          rec.analysis.pitchingMatchup || 0,
          rec.analysis.situationalEdge || 0,
          rec.analysis.teamMomentum || 0,
          rec.analysis.marketInefficiency || 0,
          rec.analysis.systemConfidence || 0
        ];
        const weights = [0.15, 0.15, 0.15, 0.15, 0.25, 0.15];
        const weightedSum = factors.reduce((sum, factor, i) => sum + (factor * weights[i]), 0);
        weightedAverages.push(weightedSum);
      }
    });
    
    console.log(`\n📈 GRADE DISTRIBUTION SUMMARY:`);
    Object.entries(gradeCount)
      .sort(([a], [b]) => {
        const grades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'];
        return grades.indexOf(a) - grades.indexOf(b);
      })
      .forEach(([grade, count]) => {
        console.log(`   ${grade}: ${count} picks`);
      });
    
    if (weightedAverages.length > 0) {
      const avgScore = weightedAverages.reduce((a, b) => a + b, 0) / weightedAverages.length;
      const minScore = Math.min(...weightedAverages);
      const maxScore = Math.max(...weightedAverages);
      
      console.log(`\n📊 WEIGHTED SCORE STATISTICS:`);
      console.log(`   Average: ${avgScore.toFixed(1)}`);
      console.log(`   Range: ${minScore.toFixed(1)} - ${maxScore.toFixed(1)}`);
      console.log(`   Total Games: ${weightedAverages.length}`);
    }
    
  } catch (error) {
    console.error("❌ Error fetching grade calculations:", error.message);
  }
}

showAllGradeCalculations();