/**
 * Production Entry Point - Bypasses Vite dependencies
 * 
 * This is a production-specific entry point that avoids importing
 * Vite-specific modules that cause deployment issues.
 */

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
import path from "path";

// API key should come from environment - no fallback
if (!process.env.THE_ODDS_API_KEY) {
  console.warn('⚠️  THE_ODDS_API_KEY not set in environment');
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Simple logger for production (replacing Vite logger)
function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

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

// Enhanced health check endpoint for deployment monitoring
app.get('/api/health', (req, res) => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 5000,
    memory: process.memoryUsage(),
    version: '1.0.0'
  };
  
  res.json(healthCheck);
});

// Register all API route modules
registerRoutes(app);
registerOddsRoutes(app);
registerMLBRoutes(app);
registerArticleRoutes(app);
registerEnhancedGradingRoutes(app);

// Production static file serving (replaces Vite middleware)
if (process.env.NODE_ENV === 'production') {
  // Serve static files from dist/public
  const publicPath = path.resolve(process.cwd(), 'dist/public');
  app.use(express.static(publicPath));
  
  // Catch-all handler for SPA (fallback to index.html)
  app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}

// Start the server
const PORT = parseInt(process.env.PORT || "5000");

async function startServer() {
  const server = app.listen(PORT, "0.0.0.0", () => {
    log(`✅ Production server running on port ${PORT}`);
    log(`🏥 Health check: http://localhost:${PORT}/api/health`);
    log(`🔗 API endpoints: http://localhost:${PORT}/api/*`);
  });

  // Initialize services in production
  log("🔧 Initializing services...");
  
  try {
    // Initialize daily scheduler
    dailyScheduler.initialize();
    log("✅ Daily scheduler initialized");
    
    // Initialize pick rotation service
    pickRotationService.initialize();
    log("✅ Pick rotation service initialized");
    
    // Initialize grading services
    automaticGradingService.initialize();
    enhancedPickGradingService.initialize();
    log("✅ Grading services initialized");
    
    log("🚀 All services initialized successfully");
  } catch (error) {
    log(`❌ Service initialization error: ${error.message}`);
  }

  // Graceful shutdown handling
  process.on('SIGTERM', () => {
    log('🛑 Received SIGTERM, shutting down gracefully...');
    server.close(() => {
      log('🏁 Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    log('🛑 Received SIGINT, shutting down gracefully...');
    server.close(() => {
      log('🏁 Server closed');
      process.exit(0);
    });
  });

  return server;
}

startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});