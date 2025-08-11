export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  // Return games for today
  const today = new Date();
  const games = [
    {
      id: 'game-001',
      game_id: 'mlb_2025_nyy_bos',
      homeTeam: 'New York Yankees',
      awayTeam: 'Boston Red Sox',
      home_team: 'New York Yankees',
      away_team: 'Boston Red Sox',
      gameTime: today.toISOString(),
      commence_time: today.toISOString(),
      hasOdds: true,
      sport_key: 'baseball_mlb',
      sport_title: 'MLB',
      bookmakers: [
        {
          key: 'draftkings',
          title: 'DraftKings',
          markets: [
            {
              key: 'h2h',
              outcomes: [
                { name: 'New York Yankees', price: -150 },
                { name: 'Boston Red Sox', price: 130 }
              ]
            }
          ]
        }
      ]
    }
  ];
  
  res.status(200).json(games);
}
