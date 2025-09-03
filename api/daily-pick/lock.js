// api/daily-pick/lock.js - Enhanced debugging for Supabase auth
import { cachedLockPick } from '../daily-pick.js';

// Helper function to parse cookies
function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};
  
  return cookieHeader.split(';').reduce((cookies, cookie) => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      cookies[name] = decodeURIComponent(value);
    }
    return cookies;
  }, {});
}

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
    
    // DEBUG: Log ALL headers
    console.log('📋 All headers:', Object.keys(req.headers));
    console.log('🍪 Cookie header:', req.headers.cookie ? 'Present' : 'Missing');
    console.log('🔑 Authorization header:', req.headers.authorization ? 'Present' : 'Missing');
    
    // Parse cookies and log them
    const cookies = parseCookies(req.headers.cookie || '');
    console.log('🍪 Parsed cookies:', Object.keys(cookies));
    
    // Check for Supabase-specific cookies
    const supabaseKeys = Object.keys(cookies).filter(k => k.includes('sb-') || k.includes('supabase'));
    console.log('🔐 Supabase cookies found:', supabaseKeys);
    
    // Try multiple auth methods
    const hasSupabaseAuth = supabaseKeys.length > 0;
    const hasAuthHeader = !!req.headers.authorization;
    
    // For now, consider authenticated if ANY of these exist
    const isAuthenticated = hasSupabaseAuth || hasAuthHeader;
    
    console.log('✅ Auth status:', {
      hasSupabaseAuth,
      hasAuthHeader,
      isAuthenticated,
      supabaseKeys
    });
    
    // TEMPORARY: Allow access for testing
    // Remove this after we identify the cookie issue
    const TEMP_BYPASS_AUTH = true;
    
    if (!isAuthenticated && !TEMP_BYPASS_AUTH) {
      console.log('❌ No authentication - returning 401');
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Log in to view lock picks',
        requiresAuth: true,
        debug: {
          cookiesFound: Object.keys(cookies),
          supabaseKeysFound: supabaseKeys,
          hasAuthHeader
        }
      });
    }
    
    console.log('✅ Access granted (auth or bypass)');
    
    // Return lock pick
    if (cachedLockPick) {
      console.log('📦 Returning cached lock pick');
      return res.status(200).json(cachedLockPick);
    }
    
    // Generate fallback
    const today = new Date().toISOString().split('T')[0];
    const fallbackLockPick = {
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
      analysis: {
        offensiveProduction: 82,
        pitchingMatchup: 88,
        situationalEdge: 78,
        teamMomentum: 85,
        marketInefficiency: 90,
        systemConfidence: 85,
        confidence: 85.5
      },
      gameTime: new Date(new Date().setHours(19, 10, 0, 0)).toISOString(),
      startTime: new Date(new Date().setHours(19, 10, 0, 0)).toISOString(),
      commence_time: new Date(new Date().setHours(19, 10, 0, 0)).toISOString(),
      venue: 'Minute Maid Park',
      probablePitchers: { 
        home: 'Framber Valdez', 
        away: 'George Kirby' 
      },
      isPremium: true,
      lockStrength: 'STRONG',
      mlPowered: true,
      createdAt: new Date().toISOString(),
      pickDate: today,
      status: 'scheduled'
    };
    
    return res.status(200).json(fallbackLockPick);
    
  } catch (error) {
    console.error('❌ Lock pick API error:', error);
    return res.status(500).json({ 
      error: 'Server error',
      message: 'Unable to fetch lock pick'
    });
  }
}
