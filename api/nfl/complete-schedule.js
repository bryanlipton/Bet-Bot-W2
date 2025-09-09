// api/nfl/complete-schedule.js - NFL odds endpoint
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    const apiKey = process.env.ODDS_API_KEY || process.env.THE_ODDS_API_KEY;
    
    if (!apiKey) {
      console.log('No NFL API key found');
      return res.status(200).json([]);
    }

    console.log('Fetching NFL odds...');
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`,
      { headers: { 'Accept': 'application/json' } }
    );
    
    if (!response.ok) {
      console.error('NFL Odds API error:', response.status, response.statusText);
      return res.status(200).json([]);
    }
    
    const data = await response.json();
    console.log(`Successfully fetched ${data.length} NFL games`);
    
    res.status(200).json(data);
    
  } catch (error) {
    console.error('NFL complete schedule API error:', error);
    res.status(200).json([]);
  }
}
