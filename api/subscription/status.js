export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  // Return pro subscription status
  res.status(200).json({
    status: 'active',
    plan: 'pro',
    isPro: true,
    isAuthenticated: true,
    features: {
      dailyPicks: true,
      lockPicks: true,
      maxPicks: 10,
      oddsRefresh: 'real-time'
    }
  });
}
