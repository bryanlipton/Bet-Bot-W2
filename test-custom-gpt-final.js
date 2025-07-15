import fetch from 'node-fetch';

// Test the final Custom GPT endpoint
const testFinalEndpoint = async () => {
  console.log('Testing Custom GPT endpoint for Yankees vs Braves...\n');
  
  try {
    const response = await fetch('https://bet-bot-blipton03.replit.app/api/gpt/predict-team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ homeTeam: 'Yankees', awayTeam: 'Braves' })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ SUCCESS: Custom GPT endpoint working perfectly!');
    console.log('🏟️  Matchup:', data.homeTeam, 'vs', data.awayTeam);
    console.log('🏠 Home Win Probability:', (data.prediction.homeWinProbability * 100).toFixed(1) + '%');
    console.log('🏃 Away Win Probability:', (data.prediction.awayWinProbability * 100).toFixed(1) + '%');
    console.log('🎯 Confidence:', (data.prediction.confidence * 100).toFixed(1) + '%');
    console.log('💰 Recommended Bet:', data.prediction.recommendedBet);
    console.log('📈 Edge:', data.prediction.edge);
    console.log('🔍 Analysis:', data.prediction.analysis);
    console.log('⏰ Timestamp:', data.timestamp);
    console.log('🤖 Model Status:', data.modelStatus);
    
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
};

testFinalEndpoint();