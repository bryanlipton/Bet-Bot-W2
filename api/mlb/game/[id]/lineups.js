export default async function handler(req, res) {
  const { id } = req.query;
  
  try {
    const response = await fetch(
      `https://statsapi.mlb.com/api/v1/game/${id}/boxscore`
    );
    
    if (!response.ok) {
      return res.status(200).json({ home: [], away: [] });
    }
    
    const data = await response.json();
    
    const lineups = {
      home: data.teams?.home?.battingOrder?.map((playerId, index) => ({
        id: playerId,
        name: data.teams.home.players[`ID${playerId}`]?.person?.fullName || 'Unknown',
        position: data.teams.home.players[`ID${playerId}`]?.position?.abbreviation || 'DH',
        battingOrder: index + 1
      })) || [],
      away: data.teams?.away?.battingOrder?.map((playerId, index) => ({
        id: playerId,
        name: data.teams.away.players[`ID${playerId}`]?.person?.fullName || 'Unknown',
        position: data.teams.away.players[`ID${playerId}`]?.position?.abbreviation || 'DH',
        battingOrder: index + 1
      })) || []
    };
    
    res.status(200).json(lineups);
  } catch (error) {
    console.error('Error fetching lineups:', error);
    res.status(200).json({ home: [], away: [] });
  }
}
