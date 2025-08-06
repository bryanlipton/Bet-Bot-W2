// Simple test endpoint to verify Vercel functions work
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const apiKey = process.env.ODDS_API_KEY;
  
  res.status(200).json({
    message: 'API function is working!',
    timestamp: new Date().toISOString(),
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey ? apiKey.length : 0,
    method: req.method,
    url: req.url
  });
}
