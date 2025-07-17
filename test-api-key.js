// Test the new API key directly
const fetch = require('node-fetch');

const apiKey = 'bcf462d7c3a36ee7010e52baed084eae';

async function testApiKey() {
  try {
    console.log(`Testing API key: ${apiKey.substring(0, 8)}...`);
    
    const url = `https://api.the-odds-api.com/v4/sports/baseball_mlb/odds?apiKey=${apiKey}&regions=us&markets=h2h&oddsFormat=american&limit=2`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', data);
    
    if (response.ok) {
      console.log('✅ API key is working!');
      console.log('Games returned:', data.length);
    } else {
      console.log('❌ API key failed:', data.message);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testApiKey();