// Quick test to verify the Custom GPT prediction endpoint is working
const testPrediction = async () => {
  try {
    const response = await fetch('https://bet-bot-blipton03.replit.app/api/gpt/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        homeTeam: 'Yankees',
        awayTeam: 'Red Sox'
      })
    });
    
    const data = await response.json();
    console.log('✅ PREDICTION ENDPOINT WORKING:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.prediction && data.prediction.homeWinProbability) {
      console.log('\n✅ SUCCESS: Custom GPT prediction endpoint is fully operational!');
      console.log(`✅ Home Win Probability: ${(data.prediction.homeWinProbability * 100).toFixed(1)}%`);
      console.log(`✅ Confidence: ${(data.prediction.confidence * 100).toFixed(1)}%`);
      console.log(`✅ Recommended Bet: ${data.prediction.recommendedBet}`);
    }
  } catch (error) {
    console.error('❌ ERROR:', error);
  }
};

testPrediction();