// Test the local endpoint first to debug
const testLocalEndpoint = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/gpt/predict-team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ homeTeam: 'Yankees', awayTeam: 'Braves' })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Local endpoint error:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ SUCCESS: Local endpoint working');
    console.log('Yankees vs Braves prediction:');
    console.log('Home Win:', (data.prediction.homeWinProbability * 100).toFixed(1) + '%');
    console.log('Away Win:', (data.prediction.awayWinProbability * 100).toFixed(1) + '%');
    console.log('Confidence:', (data.prediction.confidence * 100).toFixed(1) + '%');
    console.log('Recommended Bet:', data.prediction.recommendedBet);
    console.log('Analysis:', data.prediction.analysis);
  } catch (error) {
    console.log('❌ Local network error:', error.message);
  }
};

testLocalEndpoint();