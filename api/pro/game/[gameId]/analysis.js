// api/pro/game/[gameId]/analysis.js
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  const { gameId } = req.query;
  
  // Return empty analysis to prevent crashes
  const mockAnalysis = {
    gameId: gameId,
    confidence: 0,
    factors: {},
    recommendation: null
  };
  
  res.status(200).json(mockAnalysis);
}
