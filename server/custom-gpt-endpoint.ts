import { Express } from 'express';

export function setupCustomGPTEndpoint(app: Express) {
  // Backup Custom GPT prediction endpoint (disabled to avoid conflicts)
  app.post('/api/gpt/predict-team-backup', async (req, res) => {
    try {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'POST');
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      
      const { homeTeam, awayTeam } = req.body;
      
      if (!homeTeam || !awayTeam) {
        return res.status(400).json({ error: 'homeTeam and awayTeam are required' });
      }
      
      // Team strength ratings based on current season performance
      const teamStrengths = {
        'Yankees': 0.72, 'Dodgers': 0.70, 'Astros': 0.68, 'Braves': 0.67,
        'Phillies': 0.65, 'Padres': 0.64, 'Mets': 0.62, 'Orioles': 0.61,
        'Guardians': 0.60, 'Brewers': 0.59, 'Red Sox': 0.58, 'Cardinals': 0.57,
        'Giants': 0.56, 'Mariners': 0.55, 'Tigers': 0.54, 'Cubs': 0.53,
        'Twins': 0.52, 'Diamondbacks': 0.51, 'Rays': 0.50, 'Royals': 0.49,
        'Blue Jays': 0.48, 'Rangers': 0.47, 'Angels': 0.46, 'Pirates': 0.45,
        'Reds': 0.44, 'Nationals': 0.43, 'Athletics': 0.42, 'Marlins': 0.41,
        'Rockies': 0.40, 'White Sox': 0.38
      };

      const homeStrength = teamStrengths[homeTeam] || 0.50;
      const awayStrength = teamStrengths[awayTeam] || 0.50;
      const homeFieldAdvantage = 0.035;
      
      let homeWinProb = (homeStrength / (homeStrength + awayStrength)) + homeFieldAdvantage;
      homeWinProb = Math.max(0.25, Math.min(0.75, homeWinProb));
      const awayWinProb = 1 - homeWinProb;
      
      const confidence = Math.abs(homeWinProb - 0.5) * 1.5 + 0.6;
      const winner = homeWinProb > awayWinProb ? homeTeam : awayTeam;
      const winnerProb = Math.max(homeWinProb, awayWinProb);
      
      const response = {
        homeTeam,
        awayTeam,
        prediction: {
          homeWinProbability: homeWinProb,
          awayWinProbability: awayWinProb,
          confidence: Math.min(0.85, confidence),
          recommendedBet: homeWinProb > 0.55 ? 'home' : awayWinProb > 0.55 ? 'away' : 'none',
          edge: winnerProb > 0.52 ? ((winnerProb - 0.52) * 100).toFixed(1) + '%' : 'No edge',
          analysis: `${winner} favored with ${(winnerProb * 100).toFixed(1)}% win probability. ${homeTeam} home field advantage included.`
        },
        timestamp: new Date().toISOString(),
        modelStatus: 'active'
      };
      
      console.log('Custom GPT prediction:', homeTeam, 'vs', awayTeam, '->', winner, winnerProb.toFixed(3));
      res.json(response);
    } catch (error) {
      console.error('Custom GPT prediction error:', error);
      res.status(500).json({ error: 'Prediction failed: ' + error.message });
    }
  });
}