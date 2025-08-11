export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json([{
    id: 'game-001',
    homeTeam: 'New York Yankees',
    awayTeam: 'Boston Red Sox',
    gameTime: new Date().toISOString(),
    hasOdds: true,
    commence_time: new Date().toISOString()
  }]);
}
