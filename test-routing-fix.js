import fetch from 'node-fetch';

const testRoutingFix = async () => {
  console.log('Testing if API routing is fixed...\n');
  
  try {
    // Test simple endpoint first
    const testResponse = await fetch('https://bet-bot-blipton03.replit.app/api/test-routing');
    console.log('Test endpoint status:', testResponse.status);
    console.log('Test endpoint content-type:', testResponse.headers.get('content-type'));
    
    if (testResponse.headers.get('content-type')?.includes('application/json')) {
      const testData = await testResponse.json();
      console.log('✅ Test endpoint working:', testData.status);
      
      // Now test the prediction endpoint
      console.log('\nTesting prediction endpoint...');
      const predResponse = await fetch('https://bet-bot-blipton03.replit.app/api/gpt/matchup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ homeTeam: 'Yankees', awayTeam: 'Braves' })
      });
      
      console.log('Prediction status:', predResponse.status);
      console.log('Prediction content-type:', predResponse.headers.get('content-type'));
      
      if (predResponse.headers.get('content-type')?.includes('application/json')) {
        const predData = await predResponse.json();
        console.log('✅ Prediction endpoint working!');
        console.log('Result:', predData.prediction?.analysis);
      } else {
        console.log('❌ Prediction endpoint still returning HTML');
      }
    } else {
      console.log('❌ Test endpoint still returning HTML');
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
};

testRoutingFix();