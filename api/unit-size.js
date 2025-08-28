export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    // Get unit size from localStorage (client-side storage)
    // For now, return default
    return res.status(200).json({ unitSize: 50 });
  }

  if (req.method === 'PUT' || req.method === 'POST') {
    const { unitSize } = req.body;
    
    // In a serverless function, we can't persist data
    // This is just to prevent the 404 error
    return res.status(200).json({ 
      success: true, 
      unitSize: unitSize,
      message: 'Unit size updated (client-side only)' 
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
