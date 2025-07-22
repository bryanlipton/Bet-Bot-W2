import { BettingRecommendationEngine } from './server/services/bettingRecommendationEngine.js';
import fetch from 'node-fetch';

async function testGenerateDailyPick() {
    console.log('🎯 Testing Daily Pick Generation with Mock Data...\n');
    
    try {
        // Get mock games data
        const response = await fetch('http://localhost:5000/api/odds/live/baseball_mlb');
        const games = await response.json();
        
        console.log(`📊 Retrieved ${games.length} games from mock data service`);
        
        // Filter games with betting odds
        const gamesWithOdds = games.filter(game => 
            game.bookmakers && 
            game.bookmakers.length > 0 && 
            game.bookmakers[0].markets &&
            game.bookmakers[0].markets.some(market => market.key === 'h2h')
        );
        
        console.log(`💰 Found ${gamesWithOdds.length} games with moneyline odds`);
        
        if (gamesWithOdds.length === 0) {
            console.log('❌ No games with odds available');
            return;
        }
        
        // Initialize recommendation engine
        const recommendationEngine = new BettingRecommendationEngine();
        
        // Generate recommendations for games with odds
        console.log('\n🤖 Generating BetBot recommendations...\n');
        
        let bestRecommendation = null;
        let bestGrade = 0;
        
        for (let i = 0; i < Math.min(5, gamesWithOdds.length); i++) {
            const game = gamesWithOdds[i];
            console.log(`\n--- Game ${i + 1}: ${game.away_team} @ ${game.home_team} ---`);
            
            try {
                const recommendations = await recommendationEngine.generateRecommendations([game]);
                
                if (recommendations.length > 0) {
                    const rec = recommendations[0];
                    console.log(`🎯 Pick: ${rec.selection} ${rec.betType}`);
                    console.log(`📊 Grade: ${rec.grade} (${rec.confidence} confidence)`);
                    console.log(`💰 Odds: ${rec.odds > 0 ? '+' : ''}${rec.odds}`);
                    console.log(`🧠 Reasoning: ${rec.reasoning.substring(0, 100)}...`);
                    
                    // Convert grade to numeric for comparison
                    const gradeValue = getGradeValue(rec.grade);
                    if (gradeValue > bestGrade) {
                        bestGrade = gradeValue;
                        bestRecommendation = {
                            game: game,
                            recommendation: rec
                        };
                    }
                } else {
                    console.log('❌ No valid recommendations generated for this game');
                }
            } catch (error) {
                console.log(`⚠️ Error generating recommendation: ${error.message}`);
            }
        }
        
        if (bestRecommendation) {
            console.log('\n🏆 === PICK OF THE DAY ===');
            console.log(`🎯 Game: ${bestRecommendation.game.away_team} @ ${bestRecommendation.game.home_team}`);
            console.log(`⚡ Pick: ${bestRecommendation.recommendation.selection} ML`);
            console.log(`🎓 Grade: ${bestRecommendation.recommendation.grade}`);
            console.log(`💰 Odds: ${bestRecommendation.recommendation.odds > 0 ? '+' : ''}${bestRecommendation.recommendation.odds}`);
            console.log(`📈 Confidence: ${bestRecommendation.recommendation.confidence}%`);
            console.log(`🧠 Analysis: ${bestRecommendation.recommendation.reasoning}`);
            
            // Show analysis factors
            const analysis = bestRecommendation.recommendation.analysis;
            console.log('\n📊 Analysis Factors:');
            console.log(`   • Offensive Production: ${analysis.offensiveProduction}/100`);
            console.log(`   • Pitching Matchup: ${analysis.pitchingMatchup}/100`);
            console.log(`   • Situational Edge: ${analysis.situationalEdge}/100`);
            console.log(`   • Team Momentum: ${analysis.teamMomentum}/100`);
            console.log(`   • Market Inefficiency: ${analysis.marketInefficiency}/100`);
            console.log(`   • System Confidence: ${analysis.systemConfidence}/100`);
            
            console.log('\n✅ Daily Pick Generation Test SUCCESSFUL with Mock Data!');
        } else {
            console.log('\n❌ No valid recommendations found');
        }
        
    } catch (error) {
        console.error('❌ Error testing daily pick generation:', error);
    }
}

function getGradeValue(grade) {
    const gradeMap = {
        'A+': 12, 'A': 11, 'A-': 10,
        'B+': 9, 'B': 8, 'B-': 7,
        'C+': 6, 'C': 5, 'C-': 4,
        'D+': 3, 'D': 2, 'F': 1
    };
    return gradeMap[grade] || 0;
}

// Run the test
testGenerateDailyPick();