const ML_API_URL = import.meta.env.VITE_ML_API_URL || 'http://104.236.118.108:3001';

export async function checkMLHealth() {
  // Temporarily return offline due to HTTPS/HTTP mixed content issue
  // Vercel uses HTTPS, but DigitalOcean server uses HTTP
  // Browsers block HTTP requests from HTTPS sites for security
  // Will fix after adding SSL certificate to DigitalOcean server
  console.log('ML health check: Returning offline (HTTPS/HTTP mismatch)');
  return { 
    online: false, 
    error: 'Mixed content blocked - SSL setup required on ML server' 
  };
  
  /* ORIGINAL CODE - UNCOMMENT AFTER SSL CERTIFICATE IS ADDED TO DIGITALOCEAN
  try {
    const response = await fetch(`${ML_API_URL}/health`);
    if (!response.ok) throw new Error('Health check failed');
    const data = await response.json();
    return { online: true, data };
  } catch (error) {
    console.error('ML server offline:', error);
    return { online: false, error };
  }
  */
}

export async function getMLPrediction(gameData: any) {
  console.error('ML predictions temporarily disabled - SSL setup required');
  throw new Error('ML predictions temporarily disabled - HTTPS/HTTP mixed content blocked. SSL certificate needed on ML server.');
  
  /* ORIGINAL CODE - UNCOMMENT AFTER SSL SETUP
  try {
    const response = await fetch(`${ML_API_URL}/api/ml-prediction`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ gameData })
    });
    
    if (!response.ok) throw new Error('ML prediction failed');
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('ML prediction error:', error);
    throw error;
  }
  */
}

export async function getDailyPick(games: any[], date: string) {
  console.error('Daily pick generation temporarily disabled - SSL setup required');
  throw new Error('Daily pick generation temporarily disabled - HTTPS/HTTP mixed content blocked. SSL certificate needed on ML server.');
  
  /* ORIGINAL CODE - UNCOMMENT AFTER SSL SETUP
  try {
    const response = await fetch(`${ML_API_URL}/api/generate-daily-pick`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ games, date })
    });
    
    if (!response.ok) throw new Error('Daily pick generation failed');
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Daily pick error:', error);
    throw error;
  }
  */
}
