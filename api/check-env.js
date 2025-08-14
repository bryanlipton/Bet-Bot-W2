// api/check-env.js - Check what environment variables Vercel sees
export default async function handler(req, res) {
  const mlServerUrl = process.env.ML_SERVER_URL;
  
  // Test ML connection
  let mlServerStatus = 'Not tested';
  let mlResponse = null;
  
  if (mlServerUrl) {
    try {
      const response = await fetch(`${mlServerUrl}/health`);
      if (response.ok) {
        mlServerStatus = 'Connected ✅';
        mlResponse = await response.json();
      } else {
        mlServerStatus = `Failed: ${response.status}`;
      }
    } catch (error) {
      mlServerStatus = `Error: ${error.message}`;
    }
  }
  
  return res.status(200).json({
    environment: {
      ML_SERVER_URL: mlServerUrl || 'NOT SET ❌',
      THE_ODDS_API_KEY: process.env.THE_ODDS_API_KEY ? 'SET ✅' : 'NOT SET ❌'
    },
    mlServerTest: {
      status: mlServerStatus,
      response: mlResponse
    },
    recommendation: !mlServerUrl ? 
      'Add ML_SERVER_URL = http://104.236.118.108:3001 to Vercel Environment Variables' : 
      'Environment variable is set'
  });
}
