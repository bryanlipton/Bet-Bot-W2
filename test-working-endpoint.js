#!/usr/bin/env node

async function testWorkingEndpoint() {
  try {
    console.log('🧪 Testing working games/today endpoint...');
    
    const response = await fetch('https://bet-bot-blipton03.replit.app/api/gpt/games/today', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ SUCCESS: Endpoint working');
    console.log('📊 Response:', JSON.stringify(data, null, 2));
    
    return true;
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    return false;
  }
}

testWorkingEndpoint();