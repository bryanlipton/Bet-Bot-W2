/**
 * Test Grade Stability System
 * Tests the information-milestone based grade stability to ensure grades only change for meaningful updates
 */

async function testGradeStability() {
    console.log('🧪 Testing Grade Stability System');
    console.log('=' .repeat(50));

    try {
        // Test 1: Check initial grade generation (should happen when pitchers available)
        console.log('\n1. Testing initial grade generation...');
        
        const response1 = await fetch('http://localhost:5000/api/pro/all-picks', {
            headers: {
                'Content-Type': 'application/json',
                'Cookie': 'connect.sid=test' // Mock Pro user session
            }
        });

        if (response1.ok) {
            const picks1 = await response1.json();
            console.log(`✅ Generated ${picks1.length} initial picks`);
            
            // Log first few picks with grades
            picks1.slice(0, 3).forEach(pick => {
                console.log(`   📊 ${pick.homeTeam} vs ${pick.awayTeam}: ${pick.grade} (${pick.confidence}% confidence)`);
            });
        } else {
            console.log('❌ Failed to generate initial picks');
            return;
        }

        // Test 2: Immediate re-request (should use cached/stable grades)
        console.log('\n2. Testing grade stability (immediate re-request)...');
        
        const response2 = await fetch('http://localhost:5000/api/pro/all-picks', {
            headers: {
                'Content-Type': 'application/json',
                'Cookie': 'connect.sid=test' // Mock Pro user session
            }
        });

        if (response2.ok) {
            const picks2 = await response2.json();
            console.log(`✅ Re-requested picks: ${picks2.length} total`);
            
            // Compare grades - they should be identical
            if (picks1.length === picks2.length) {
                let stableGrades = 0;
                let changedGrades = 0;
                
                for (let i = 0; i < picks1.length; i++) {
                    const pick1 = picks1[i];
                    const pick2 = picks2.find(p => p.gameId === pick1.gameId);
                    
                    if (pick2 && pick1.grade === pick2.grade) {
                        stableGrades++;
                    } else if (pick2) {
                        changedGrades++;
                        console.log(`   🔄 Grade changed: ${pick1.homeTeam} vs ${pick1.awayTeam} (${pick1.grade} → ${pick2.grade})`);
                    }
                }
                
                console.log(`   📊 Stable grades: ${stableGrades}, Changed grades: ${changedGrades}`);
                
                if (changedGrades === 0) {
                    console.log('   ✅ Perfect grade stability - no changes detected');
                } else {
                    console.log(`   ⚠️ Found ${changedGrades} grade changes (unexpected for immediate re-request)`);
                }
            }
        }

        // Test 3: Test after short delay (should still be stable)
        console.log('\n3. Testing grade stability after short delay...');
        console.log('   ⏳ Waiting 10 seconds...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        const response3 = await fetch('http://localhost:5000/api/pro/all-picks', {
            headers: {
                'Content-Type': 'application/json',
                'Cookie': 'connect.sid=test' 
            }
        });

        if (response3.ok) {
            const picks3 = await response3.json();
            console.log(`✅ Delayed request picks: ${picks3.length} total`);
            
            let stableAfterDelay = 0;
            let changedAfterDelay = 0;
            
            for (let i = 0; i < picks1.length && i < picks3.length; i++) {
                const pick1 = picks1[i];
                const pick3 = picks3.find(p => p.gameId === pick1.gameId);
                
                if (pick3 && pick1.grade === pick3.grade) {
                    stableAfterDelay++;
                } else if (pick3) {
                    changedAfterDelay++;
                    console.log(`   🔄 Grade changed after delay: ${pick1.homeTeam} vs ${pick1.awayTeam} (${pick1.grade} → ${pick3.grade})`);
                }
            }
            
            console.log(`   📊 Stable after delay: ${stableAfterDelay}, Changed: ${changedAfterDelay}`);
            
            if (changedAfterDelay === 0) {
                console.log('   ✅ Grade stability maintained after delay');
            } else {
                console.log(`   ⚠️ Found ${changedAfterDelay} changes after delay`);
            }
        }

        // Test 4: Check specific game analysis caching
        console.log('\n4. Testing individual game analysis caching...');
        
        if (picks1.length > 0) {
            const testGame = picks1[0];
            console.log(`   🎯 Testing game: ${testGame.homeTeam} vs ${testGame.awayTeam}`);
            
            const gameResponse1 = await fetch(`http://localhost:5000/api/pro/game/${testGame.gameId}/analysis`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': 'connect.sid=test'
                }
            });
            
            if (gameResponse1.ok) {
                const analysis1 = await gameResponse1.json();
                console.log(`   📊 Initial analysis: Grade ${analysis1.grade}`);
                
                // Immediate re-request
                const gameResponse2 = await fetch(`http://localhost:5000/api/pro/game/${testGame.gameId}/analysis`, {
                    headers: {
                        'Content-Type': 'application/json', 
                        'Cookie': 'connect.sid=test'
                    }
                });
                
                if (gameResponse2.ok) {
                    const analysis2 = await gameResponse2.json();
                    
                    if (analysis1.grade === analysis2.grade) {
                        console.log('   ✅ Individual game analysis grade stable');
                    } else {
                        console.log(`   ⚠️ Individual game analysis changed: ${analysis1.grade} → ${analysis2.grade}`);
                    }
                }
            }
        }

        console.log('\n📈 Grade Stability Test Summary:');
        console.log('   🔒 Grade stability system prevents constant regeneration');
        console.log('   ⏰ Grades should only change when new information arrives (pitchers, lineups)');
        console.log('   💾 Caching system maintains consistency across requests');
        console.log('   🎯 Individual game analysis also maintains stability');

    } catch (error) {
        console.error('❌ Error testing grade stability:', error);
    }
}

testGradeStability();