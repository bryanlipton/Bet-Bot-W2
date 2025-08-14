// api/mlb/game/[gameId].js
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  const { gameId } = req.query;
  
  // Return mock game data to prevent crashes
  const mockGameData = {
    id: gameId,
    homeTeam: "Home Team",
    awayTeam: "Away Team",
    homeScore: 0,
    awayScore: 0,
    status: "scheduled",
    startTime: new Date().toISOString()
  };
  
  res.status(200).json(mockGameData);
}
