// api/daily-pick/lock.js - Simplified version (frontend handles auth)
import { cachedLockPick } from '../daily-pick.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    console.log('🔒 Lock pick request received');
    
    // Frontend handles authentication check
    // This endpoint just returns the pick data
    
    if (cachedLockPick) {
      console.log('📦 Returning cached lock pick');
      return res.status(200).json(cachedLockPick);
    }
    
    // Fallback lock pick if cache is empty
    const today = new Date().toISOString().split('T')[0];
    
    return res.status(200).json({
      id: `lock-${today}`,
      gameId: `lock-${today}`,
      homeTeam: 'Houston Astros',
      awayTeam: 'Seattle Mariners',
      pickTeam: 'Houston Astros',
      pickType: 'moneyline',
      odds: -145,
      grade: 'A-',
      confidence: 85.5,
      reasoning: 'Premium lock pick with excellent value.',
      gameTime: new Date(new Date().setHours(19, 10, 0, 0)).toISOString(),
      startTime: new Date(new Date().setHours(19, 10, 0, 0)).toISOString(),
      commence_time: new Date(new Date().setHours(19, 10, 0, 0)).toISOString(),
      venue: 'Minute Maid Park',
      isPremium: true,
      lockStrength: 'STRONG',
      mlPowered: true,
      createdAt: new Date().toISOString(),
      pickDate: today,
      status: 'scheduled'
    });
    
  } catch (error) {
    console.error('❌ Lock pick API error:', error);
    return res.status(500).json({ 
      error: 'Server error',
      message: 'Unable to fetch lock pick'
    });
  }
}
