import fetch from 'node-fetch';

// Test the local server directly
const testLocalServer = async () => {
  console.log('Testing local server endpoint...');
  
  try {
    const response = await fetch('http://localhost:5000/api/gpt/matchup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ homeTeam: 'Yankees', awayTeam: 'Braves' })
    });
    
    console.log('Local Response status:', response.status);
    console.log('Local Content-Type:', response.headers.get('content-type'));
    
    const data = await response.text();
    console.log('Local Response (first 200 chars):', data.substring(0, 200));
    
    if (response.headers.get('content-type')?.includes('application/json')) {
      const jsonData = JSON.parse(data);
      console.log('✅ Local endpoint working!');
      console.log('Prediction:', jsonData.prediction?.analysis);
    } else {
      console.log('❌ Local endpoint returning HTML instead of JSON');
    }
    
  } catch (error) {
    console.log('❌ Local test failed:', error.message);
  }
};

testLocalServer();