// Mock daily pick API
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Mock daily pick data - replace with real ML predictions
  const mockDailyPick = {
    id: "daily_pick_123",
    homeTeam: "New York Yankees",
    awayTeam: "Texas Rangers", 
    pickTeam: "Yankees",
    pickType: "Money Line",
    odds: -132,
    grade: "B",
    confidence: "High",
    reasoning: [
      "Yankees have won 7 of last 10 games",
      "Strong pitching matchup advantage", 
      "Rangers struggling on road (2-8 last 10)"
    ],
    gameTime: "8:05 PM EST",
    venue: "Globe Life Field"
  };

  res.status(200).json(mockDailyPick);
}
