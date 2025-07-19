// Test script to analyze all MLB games and get potential Bet Bot pick grades
import fetch from 'node-fetch';

async function analyzeAllMLBGrades() {
  try {
    console.log('Fetching today\'s MLB games...\n');
    
    // Get complete schedule with odds
    const scheduleResponse = await fetch('http://localhost:5000/api/mlb/complete-schedule');
    const games = await scheduleResponse.json();
    
    // Filter games with moneyline odds
    const gamesWithOdds = games.filter(game => 
      game.odds && game.odds.moneyline && 
      game.odds.moneyline.length > 0
    );
    
    console.log(`Found ${gamesWithOdds.length} games with moneyline odds\n`);
    
    const results = [];
    
    // Analyze each game for both home and away picks
    for (const game of gamesWithOdds) {
      console.log(`\n🏟️ ${game.awayTeam} @ ${game.homeTeam}`);
      console.log(`Game Time: ${new Date(game.gameTime).toLocaleTimeString()}`);
      
      // Get moneyline odds
      const homeOdds = game.odds.moneyline.find(odd => odd.name === game.homeTeam)?.price || 0;
      const awayOdds = game.odds.moneyline.find(odd => odd.name === game.awayTeam)?.price || 0;
      
      console.log(`Home ${game.homeTeam}: ${homeOdds > 0 ? '+' : ''}${homeOdds}`);
      console.log(`Away ${game.awayTeam}: ${awayOdds > 0 ? '+' : ''}${awayOdds}`);
      
      // Simulate analysis for both teams
      try {
        // Test home team pick
        const homePickResponse = await fetch('http://localhost:5000/api/daily-pick/analyze-game', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameId: game.id,
            homeTeam: game.homeTeam,
            awayTeam: game.awayTeam,
            pickTeam: game.homeTeam,
            odds: homeOdds,
            gameTime: game.gameTime,
            venue: game.venue || 'TBD'
          })
        });
        
        if (homePickResponse.ok) {
          const homeAnalysis = await homePickResponse.json();
          results.push({
            game: `${game.awayTeam} @ ${game.homeTeam}`,
            pick: game.homeTeam,
            odds: homeOdds,
            grade: homeAnalysis.grade,
            confidence: homeAnalysis.confidence,
            analysis: homeAnalysis.analysis
          });
          console.log(`  ${game.homeTeam} Pick: Grade ${homeAnalysis.grade} (${homeAnalysis.confidence}% confidence)`);
        }
        
        // Test away team pick  
        const awayPickResponse = await fetch('http://localhost:5000/api/daily-pick/analyze-game', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameId: game.id,
            homeTeam: game.homeTeam,
            awayTeam: game.awayTeam,
            pickTeam: game.awayTeam,
            odds: awayOdds,
            gameTime: game.gameTime,
            venue: game.venue || 'TBD'
          })
        });
        
        if (awayPickResponse.ok) {
          const awayAnalysis = await awayPickResponse.json();
          results.push({
            game: `${game.awayTeam} @ ${game.homeTeam}`,
            pick: game.awayTeam,
            odds: awayOdds,
            grade: awayAnalysis.grade,
            confidence: awayAnalysis.confidence,
            analysis: awayAnalysis.analysis
          });
          console.log(`  ${game.awayTeam} Pick: Grade ${awayAnalysis.grade} (${awayAnalysis.confidence}% confidence)`);
        }
        
      } catch (error) {
        console.log(`  Error analyzing game: ${error.message}`);
      }
    }
    
    // Summary by grade
    console.log('\n\n📊 GRADE SUMMARY:');
    const gradeCount = {};
    results.forEach(result => {
      gradeCount[result.grade] = (gradeCount[result.grade] || 0) + 1;
    });
    
    const gradeOrder = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F'];
    gradeOrder.forEach(grade => {
      if (gradeCount[grade]) {
        console.log(`${grade}: ${gradeCount[grade]} picks`);
      }
    });
    
    // Best picks
    console.log('\n\n🏆 BEST PICKS (B+ and above):');
    const bestPicks = results.filter(r => ['A+', 'A', 'A-', 'B+'].includes(r.grade))
      .sort((a, b) => b.confidence - a.confidence);
    
    bestPicks.forEach(pick => {
      console.log(`${pick.pick} (${pick.game}) - Grade ${pick.grade}, ${pick.confidence}% confidence, ${pick.odds > 0 ? '+' : ''}${pick.odds} odds`);
    });
    
    if (bestPicks.length === 0) {
      console.log('No picks graded B+ or higher found today.');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Add analysis endpoint first
console.log('Setting up analysis endpoint...');
analyzeAllMLBGrades();