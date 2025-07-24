import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { registerOddsRoutes } from "./routes-odds";
import { registerMLBRoutes } from "./mlb-api";
import { registerArticleRoutes } from "./article-generator";
import { registerEnhancedGradingRoutes } from "./routes-enhanced-grading";
import { dailyScheduler } from "./daily-scheduler";
import { pickRotationService } from "./services/pickRotationService";
import { automaticGradingService } from "./services/automaticGradingService";
import { enhancedPickGradingService } from "./services/enhancedPickGradingService";
import { setupVite, serveStatic, log } from "./vite";

// API key should come from environment - no fallback
if (!process.env.THE_ODDS_API_KEY) {
  console.warn('⚠️  THE_ODDS_API_KEY not set in environment');
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

// Priority API routes - registered before any middleware to ensure external access
app.use('/api', (req, res, next) => {
  // Set CORS headers for all API routes
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Simple test endpoint to verify routing
app.get('/api/test-routing', (req, res) => {
  res.json({ status: 'API routing working', timestamp: new Date().toISOString() });
});

// Download endpoints for GPT files
app.get('/download/gpt-files', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Download GPT Files</title>
      <style>
        body { font-family: Arial; padding: 20px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        .file-link { display: block; padding: 10px; margin: 10px 0; background: #007bff; color: white; text-decoration: none; border-radius: 4px; text-align: center; }
        .file-link:hover { background: #0056b3; }
        h1 { color: #333; }
        p { color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Download GPT Files</h1>
        <p>Right-click each link and choose "Save Link As" to download:</p>
        
        <a href="/download/gpt-complete-system.json" class="file-link" download>
          📊 gpt-complete-system.json (Main Data)
        </a>
        
        <a href="/download/gpt-instructions.md" class="file-link" download>
          📋 gpt-instructions.md (Instructions)
        </a>
        
        <a href="/download/gpt-test-examples.md" class="file-link" download>
          🧪 gpt-test-examples.md (Test Examples)
        </a>
        
        <a href="/download/COMPLETE-GPT-SETUP.md" class="file-link" download>
          📖 COMPLETE-GPT-SETUP.md (Setup Guide)
        </a>
        
        <a href="/ALL-GPT-FILES.txt" class="file-link" download>
          📄 ALL-GPT-FILES.txt (All Files in One - Easy Copy/Paste)
        </a>
        
        <p><strong>Next Steps:</strong></p>
        <ol>
          <li>Download all 4 files above</li>
          <li>Go to your Custom GPT in ChatGPT</li>
          <li>Upload all files to the Knowledge section</li>
          <li>Test with: "Who will win Yankees vs Dodgers?"</li>
        </ol>
      </div>
    </body>
    </html>
  `);
});

// Individual file download endpoints
app.get('/download/gpt-complete-system.json', (req, res) => {
  res.setHeader('Content-Disposition', 'attachment; filename="gpt-complete-system.json"');
  res.setHeader('Content-Type', 'application/json');
  try {
    const fs = require('fs');
    const content = fs.readFileSync('gpt-complete-system.json', 'utf8');
    res.send(content);
  } catch (error) {
    res.status(404).send('File not found');
  }
});

app.get('/download/gpt-instructions.md', (req, res) => {
  res.setHeader('Content-Disposition', 'attachment; filename="gpt-instructions.md"');
  res.setHeader('Content-Type', 'text/markdown');
  try {
    const fs = require('fs');
    const content = fs.readFileSync('gpt-instructions.md', 'utf8');
    res.send(content);
  } catch (error) {
    res.status(404).send('File not found');
  }
});

app.get('/download/gpt-test-examples.md', (req, res) => {
  res.setHeader('Content-Disposition', 'attachment; filename="gpt-test-examples.md"');
  res.setHeader('Content-Type', 'text/markdown');
  try {
    const fs = require('fs');
    const content = fs.readFileSync('gpt-test-examples.md', 'utf8');
    res.send(content);
  } catch (error) {
    res.status(404).send('File not found');
  }
});

app.get('/download/COMPLETE-GPT-SETUP.md', (req, res) => {
  res.setHeader('Content-Disposition', 'attachment; filename="COMPLETE-GPT-SETUP.md"');
  res.setHeader('Content-Type', 'text/markdown');
  try {
    const fs = require('fs');
    const content = fs.readFileSync('COMPLETE-GPT-SETUP.md', 'utf8');
    res.send(content);
  } catch (error) {
    res.status(404).send('File not found');
  }
});

app.post('/api/gpt/matchup', async (req, res) => {
  try {
    
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
  // Register download routes first, before other middleware
  console.log('Setting up download routes...');
  
  const server = await registerRoutes(app);
  registerOddsRoutes(app);
  registerMLBRoutes(app);
  registerArticleRoutes(app);
  registerEnhancedGradingRoutes(app);

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
    
    // Start daily article generation scheduler (DISABLED)
    // dailyScheduler.start();
    
    // Start pick rotation service for automatic daily pick updates
    console.log('🔄 Starting pick rotation service...');
    // Note: pickRotationService is already initialized when imported
    
    // Start automatic grading service
    console.log('🎯 Starting automatic pick grading service...');
    automaticGradingService.start();
  });
})();
