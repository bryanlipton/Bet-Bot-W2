import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// Set API key from environment or direct value
if (!process.env.THE_ODDS_API_KEY) {
  process.env.THE_ODDS_API_KEY = "24945c3743973fb01abda3cc2eab07b9";
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Add direct API route for Custom GPT before other middleware
app.post('/api/gpt/matchup', async (req, res) => {
  try {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    
    console.log('[DIRECT] Custom GPT prediction request:', req.body);
    
    const { homeTeam, awayTeam } = req.body;
    
    if (!homeTeam || !awayTeam) {
      return res.status(400).json({ error: 'homeTeam and awayTeam are required' });
    }
    
    // Direct team strength calculation
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
    const homeFieldBonus = 0.035;
    
    let homeWinProb = (homeStrength / (homeStrength + awayStrength)) + homeFieldBonus;
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
        analysis: `${winner} favored with ${(winnerProb * 100).toFixed(1)}% win probability. Analytics-based prediction with home field advantage.`
      },
      timestamp: new Date().toISOString(),
      modelStatus: 'active'
    };
    
    console.log('[DIRECT] Prediction response:', homeTeam, 'vs', awayTeam, '->', winner, winnerProb.toFixed(3));
    res.json(response);
  } catch (error) {
    console.error('[DIRECT] Prediction error:', error);
    res.status(500).json({ error: 'Prediction failed: ' + error.message });
  }
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
