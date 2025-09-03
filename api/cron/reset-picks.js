export default async function handler(req, res) {
  // Only allow Vercel Cron to trigger this
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Force cache reset
  const baseUrl = `https://${process.env.VERCEL_URL || 'bet-bot-w2.vercel.app'}`;
  await fetch(`${baseUrl}/api/daily-pick`);
  
  return res.status(200).json({ 
    reset: true, 
    time: new Date().toISOString(),
    message: 'Daily picks reset at 2 AM EST'
  });
}
