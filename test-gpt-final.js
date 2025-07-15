import fetch from 'node-fetch';

const testCustomGPTEndpoint = async () => {
  console.log('Testing the exact endpoint your Custom GPT should be calling...\n');
  
  try {
    const response = await fetch('https://bet-bot-blipton03.replit.app/api/gpt/matchup', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'Custom-GPT/1.0'
      },
      body: JSON.stringify({ 
        homeTeam: 'Yankees', 
        awayTeam: 'Braves' 
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    const responseText = await response.text();
    console.log('Raw response:', responseText.substring(0, 200));
    
    try {
      const data = JSON.parse(responseText);
      console.log('\n✅ SUCCESS: Prediction endpoint working!');
      console.log('Home Team:', data.homeTeam);
      console.log('Away Team:', data.awayTeam);
      console.log('Home Win:', (data.prediction.homeWinProbability * 100).toFixed(1) + '%');
      console.log('Away Win:', (data.prediction.awayWinProbability * 100).toFixed(1) + '%');
      console.log('Analysis:', data.prediction.analysis);
    } catch (parseError) {
      console.log('❌ JSON parse error:', parseError.message);
    }
    
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }
};

testCustomGPTEndpoint();