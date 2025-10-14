// api/ml/get-prediction.js - ML Integration Endpoint
// Fetches real ML predictions from Digital Ocean server

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { sport, homeTeam, awayTeam, gameId } = req.method === 'GET' ? req.query : req.body;
    
    if (!homeTeam || !awayTeam) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        required: ['homeTeam', 'awayTeam']
      });
    }
    
    console.log(`🤖 Fetching ML prediction for ${awayTeam} @ ${homeTeam}`);
    
    // Get ML server URL from environment
    const mlServerUrl = process.env.ML_SERVER_URL || 'http://104.236.118.108:3001';
    
    // Call Digital Ocean ML server
    const mlResponse = await fetch(`${mlServerUrl}/api/ml-prediction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sport: sport || 'MLB',
        homeTeam,
        awayTeam,
        gameId: gameId || `${homeTeam}-${awayTeam}`,
        gameDate: new Date().toISOString()
      }),
      signal: AbortSignal.timeout(8000) // 8 second timeout
    });
    
    if (!mlResponse.ok) {
      throw new Error(`ML Server returned ${mlResponse.status}`);
    }
    
    const mlData = await mlResponse.json();
    
    // Convert ML probabilities to grades
    const confidence = mlData.confidence || mlData.homeWinProbability || 0.65;
    const grade = convertProbabilityToGrade(confidence);
    
    console.log(`✅ ML prediction received: Grade ${grade}, Confidence ${(confidence * 100).toFixed(1)}%`);
    
    return res.status(200).json({
      grade,
      confidence,
      reasoning: mlData.reasoning || 'ML analysis based on multiple factors',
      factors: mlData.factors || mlData.factorAnalysis || {},
      homeWinProbability: mlData.homeWinProbability,
      awayWinProbability: mlData.awayWinProbability,
      recommendedTeam: mlData.recommendedTeam,
      recommendedOdds: mlData.recommendedOdds,
      mlPowered: true,
      source: 'digital_ocean_ml',
      ...mlData
    });
    
  } catch (error) {
    console.error('❌ ML prediction failed:', error.message);
    
    // Return fallback grade with clear indicator
    return res.status(200).json({ 
      grade: 'B-', 
      confidence: 0.65,
      reasoning: 'Using fallback prediction - ML server unavailable',
      isFallback: true,
      mlPowered: false,
      source: 'fallback',
      error: error.message
    });
  }
}

// Convert ML confidence/probability to letter grade
function convertProbabilityToGrade(confidence) {
  // Normalize to 0-1 range if needed
  const normalizedConfidence = confidence > 1 ? confidence / 100 : confidence;
  
  if (normalizedConfidence >= 0.90) return 'A+';
  if (normalizedConfidence >= 0.85) return 'A';
  if (normalizedConfidence >= 0.80) return 'A-';
  if (normalizedConfidence >= 0.75) return 'B+';
  if (normalizedConfidence >= 0.70) return 'B';
  if (normalizedConfidence >= 0.65) return 'B-';
  if (normalizedConfidence >= 0.60) return 'C+';
  if (normalizedConfidence >= 0.55) return 'C';
  return 'C-';
}
