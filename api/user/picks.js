export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'POST') {
    // Mock saving the pick - in production, save to database
    const pick = req.body;
    
    console.log('Received pick to save:', pick);
    
    // Mock successful save
    return res.status(200).json({ 
      success: true, 
      message: 'Pick saved successfully',
      pickId: `pick_${Date.now()}` 
    });
  }
  
  if (req.method === 'GET') {
    // Mock returning user's picks
    return res.status(200).json([
      {
        id: 'pick_1',
        gameId: 'game_123',
        selection: 'Team A',
        odds: -110,
        units: 1,
        result: 'pending'
      }
    ]);
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}
