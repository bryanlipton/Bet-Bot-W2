// Test script for pick rotation functionality
console.log('🧪 Testing Pick Rotation System...\n');

async function testPickRotation() {
  const baseUrl = 'http://localhost:5000';
  
  try {
    // 1. Check current pick status
    console.log('📊 Current Pick Status:');
    const statusResponse = await fetch(`${baseUrl}/api/daily-pick/status`);
    const status = await statusResponse.json();
    console.log(JSON.stringify(status, null, 2));
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 2. Get current daily pick
    console.log('🎯 Current Daily Pick:');
    const dailyResponse = await fetch(`${baseUrl}/api/daily-pick`);
    const dailyPick = await dailyResponse.json();
    if (dailyPick) {
      console.log(`Team: ${dailyPick.pickTeam}`);
      console.log(`Game: ${dailyPick.awayTeam} @ ${dailyPick.homeTeam}`);
      console.log(`Game Time: ${dailyPick.gameTime}`);
      console.log(`Grade: ${dailyPick.grade} (${dailyPick.confidence}% confidence)`);
    } else {
      console.log('No daily pick available');
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 3. Trigger manual rotation
    console.log('🔄 Triggering Manual Rotation...');
    const rotateResponse = await fetch(`${baseUrl}/api/daily-pick/rotate`, {
      method: 'POST'
    });
    const rotateResult = await rotateResponse.json();
    console.log(JSON.stringify(rotateResult, null, 2));
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 4. Check new picks after rotation
    console.log('🆕 New Daily Pick After Rotation:');
    const newDailyResponse = await fetch(`${baseUrl}/api/daily-pick`);
    const newDailyPick = await newDailyResponse.json();
    if (newDailyPick) {
      console.log(`Team: ${newDailyPick.pickTeam}`);
      console.log(`Game: ${newDailyPick.awayTeam} @ ${newDailyPick.homeTeam}`);
      console.log(`Game Time: ${newDailyPick.gameTime}`);
      console.log(`Grade: ${newDailyPick.grade} (${newDailyPick.confidence}% confidence)`);
      console.log(`Created: ${newDailyPick.createdAt}`);
    } else {
      console.log('No daily pick available');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testPickRotation();