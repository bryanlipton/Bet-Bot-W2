export default async function handler(req, res) {
  try {
    // Call your real pick generation service
    const pickResponse = await fetch(`${process.env.VERCEL_URL}/api/picks/generate-daily`);
    const dailyPick = await pickResponse.json();
    
    res.status(200).json(dailyPick);
    
  } catch (error) {
    console.error('Daily pick error:', error);
    res.status(500).json({ error: 'Failed to get daily pick' });
  }
}
