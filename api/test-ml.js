// api/test-ml.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  try {
    console.log('Testing ML connection...');
    
    const mlResponse = await fetch('http://104.236.118.108:3001/api/ml-prediction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameData: {
          homeTeam: "Yankees",
          awayTeam: "Red Sox",
          gameDate: "2025-01-15T20:00:00Z"
        }
      }),
      timeout: 8000
    });
    
    if (mlResponse.ok) {
      const mlData = await mlResponse.json();
      console.log('ML Server responded:', mlData);
      
      return res.status(200).json({
        status: 'success',
        source: 'digital_ocean_ml',
        mlPowered: true,
        mlData: mlData,
        message: 'ML connection working!'
      });
    } else {
      throw new Error(`ML Server returned ${mlResponse.status}`);
    }
    
  } catch (error) {
    console.log('ML connection failed:', error.message);
    
    return res.status(200).json({
      status: 'fallback',
      source: 'fallback',
      mlPowered: false,
      error: error.message,
      message: 'ML connection failed'
    });
  }
}
