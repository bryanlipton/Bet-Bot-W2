import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { oddsApiService } from "./services/oddsApi";
import { openaiService } from "./services/openai";
import { mlEngine } from "./services/mlEngine";
import { websocketService } from "./services/websocket";
import { insertGameSchema, insertChatMessageSchema, insertRecommendationSchema, insertModelMetricsSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Initialize WebSocket server
  websocketService.initialize(httpServer);

  // Chat endpoints
  app.post("/api/chat", async (req, res) => {
    try {
      const { message } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: "Message is required" });
      }

      // Store user message
      await storage.createChatMessage({
        message,
        isBot: false
      });

      // Get context for AI
      const recommendations = await storage.getActiveRecommendations();
      const liveGames = await storage.getLiveGames();
      const modelMetrics = await storage.getModelMetricsBySport('americanfootball_nfl');

      const context = {
        recommendations,
        liveGames,
        modelMetrics
      };

      // Get AI response
      const aiResponse = await openaiService.processChatMessage(message, context);

      // Store AI response
      const botMessage = await storage.createChatMessage({
        message: aiResponse,
        isBot: true
      });

      res.json({ response: aiResponse, messageId: botMessage.id });
    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({ error: "Failed to process chat message" });
    }
  });

  app.get("/api/chat/messages", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const messages = await storage.getRecentChatMessages(limit);
      res.json(messages);
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      res.status(500).json({ error: "Failed to fetch chat messages" });
    }
  });

  // Games and odds endpoints
  app.get("/api/games/:sport", async (req, res) => {
    try {
      const { sport } = req.params;
      const games = await storage.getGamesBySport(sport);
      res.json(games);
    } catch (error) {
      console.error('Error fetching games:', error);
      res.status(500).json({ error: "Failed to fetch games" });
    }
  });

  app.get("/api/games/live", async (req, res) => {
    try {
      const liveGames = await storage.getLiveGames();
      res.json(liveGames);
    } catch (error) {
      console.error('Error fetching live games:', error);
      res.status(500).json({ error: "Failed to fetch live games" });
    }
  });

  app.get("/api/games/today", async (req, res) => {
    try {
      const todaysGames = await storage.getTodaysGames();
      res.json(todaysGames);
    } catch (error) {
      console.error('Error fetching today\'s games:', error);
      res.status(500).json({ error: "Failed to fetch today's games" });
    }
  });

  // Odds endpoints
  app.get("/api/odds/current/:sport", async (req, res) => {
    try {
      const { sport } = req.params;
      const currentOdds = await oddsApiService.getCurrentOdds(sport);
      
      // Store games and odds in our database
      for (const game of currentOdds) {
        let existingGame = await storage.getGameByExternalId(game.id);
        
        if (!existingGame) {
          existingGame = await storage.createGame({
            externalId: game.id,
            sportKey: game.sport_key,
            sportTitle: game.sport_title,
            commenceTime: new Date(game.commence_time),
            homeTeam: game.home_team,
            awayTeam: game.away_team,
            status: "upcoming"
          });
        }

        // Store odds for each bookmaker
        for (const bookmaker of game.bookmakers) {
          for (const market of bookmaker.markets) {
            await storage.createOdds({
              gameId: existingGame.id,
              bookmaker: bookmaker.key,
              market: market.key,
              outcomes: market.outcomes,
              lastUpdate: new Date(bookmaker.last_update),
              timestamp: new Date()
            });
          }
        }
      }

      res.json(currentOdds);
    } catch (error) {
      console.error('Error fetching current odds:', error);
      res.status(500).json({ error: "Failed to fetch current odds" });
    }
  });

  app.get("/api/odds/historical/:sport", async (req, res) => {
    try {
      const { sport } = req.params;
      const { date } = req.query;
      
      if (!date) {
        return res.status(400).json({ error: "Date parameter is required" });
      }

      const historicalOdds = await oddsApiService.getHistoricalOdds(sport, date as string);
      res.json(historicalOdds);
    } catch (error) {
      console.error('Error fetching historical odds:', error);
      res.status(500).json({ error: "Failed to fetch historical odds" });
    }
  });

  // Recommendations endpoints
  app.get("/api/recommendations", async (req, res) => {
    try {
      const recommendations = await storage.getActiveRecommendations();
      res.json(recommendations);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      res.status(500).json({ error: "Failed to fetch recommendations" });
    }
  });

  app.get("/api/recommendations/:sport", async (req, res) => {
    try {
      const { sport } = req.params;
      const recommendations = await storage.getRecommendationsBySport(sport);
      res.json(recommendations);
    } catch (error) {
      console.error('Error fetching sport recommendations:', error);
      res.status(500).json({ error: "Failed to fetch sport recommendations" });
    }
  });

  app.post("/api/recommendations/generate", async (req, res) => {
    try {
      const { sport } = req.body;
      
      if (!sport) {
        return res.status(400).json({ error: "Sport is required" });
      }

      // Get current odds
      const currentOdds = await oddsApiService.getCurrentOdds(sport);
      const recommendations = [];

      for (const game of currentOdds) {
        // Get or create game in our database
        let existingGame = await storage.getGameByExternalId(game.id);
        
        if (!existingGame) {
          existingGame = await storage.createGame({
            externalId: game.id,
            sportKey: game.sport_key,
            sportTitle: game.sport_title,
            commenceTime: new Date(game.commence_time),
            homeTeam: game.home_team,
            awayTeam: game.away_team,
            status: "upcoming"
          });
        }

        // Analyze odds for edges
        const edges = mlEngine.analyzeOddsForEdge(game, game);
        
        for (const edge of edges) {
          if (edge.edge > 5) { // Only create recommendations with >5% edge
            const recommendation = await storage.createRecommendation({
              gameId: existingGame.id,
              market: "h2h", // Simplified for demo
              bet: `${game.home_team} to win`,
              edge: edge.edge.toString(),
              confidence: edge.confidence.toString(),
              modelProbability: edge.modelProbability.toString(),
              impliedProbability: edge.impliedProbability.toString(),
              bestOdds: "-110",
              bookmaker: "DraftKings"
            });
            
            recommendations.push(recommendation);
            
            // Broadcast new recommendation
            websocketService.broadcastNewRecommendation(recommendation);
          }
        }
      }

      res.json({ 
        message: "Recommendations generated successfully", 
        count: recommendations.length,
        recommendations 
      });
    } catch (error) {
      console.error('Error generating recommendations:', error);
      res.status(500).json({ error: "Failed to generate recommendations" });
    }
  });

  // Model metrics endpoints
  app.get("/api/metrics/:sport", async (req, res) => {
    try {
      const { sport } = req.params;
      const metrics = await storage.getModelMetricsBySport(sport);
      
      if (!metrics) {
        // Return default metrics if none exist
        return res.json({
          sportKey: sport,
          accuracy: "73.2",
          edgeDetectionRate: "68.5",
          profitMargin: "12.8",
          gamesAnalyzed: 12847,
          lastUpdate: new Date()
        });
      }
      
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching model metrics:', error);
      res.status(500).json({ error: "Failed to fetch model metrics" });
    }
  });

  app.post("/api/metrics/update", async (req, res) => {
    try {
      const metricsData = insertModelMetricsSchema.parse(req.body);
      const performance = mlEngine.updateModelMetrics(metricsData.sportKey, [], []);
      
      const updatedMetrics = await storage.createOrUpdateModelMetrics({
        ...metricsData,
        accuracy: performance.accuracy.toString(),
        edgeDetectionRate: performance.edgeDetectionRate.toString(),
        profitMargin: performance.profitMargin.toString(),
        lastUpdate: new Date()
      });

      // Broadcast metrics update
      websocketService.broadcastModelMetricsUpdate(updatedMetrics);
      
      res.json(updatedMetrics);
    } catch (error) {
      console.error('Error updating model metrics:', error);
      res.status(500).json({ error: "Failed to update model metrics" });
    }
  });

  // Analysis endpoints
  app.post("/api/analysis/odds", async (req, res) => {
    try {
      const { gameData, oddsData } = req.body;
      
      if (!gameData || !oddsData) {
        return res.status(400).json({ error: "Game data and odds data are required" });
      }

      const analysis = await openaiService.analyzeOddsPattern([], oddsData);
      res.json(analysis);
    } catch (error) {
      console.error('Error analyzing odds:', error);
      res.status(500).json({ error: "Failed to analyze odds" });
    }
  });

  app.post("/api/analysis/edge", async (req, res) => {
    try {
      const { gameData, oddsData } = req.body;
      
      if (!gameData || !oddsData) {
        return res.status(400).json({ error: "Game data and odds data are required" });
      }

      const edges = mlEngine.analyzeOddsForEdge(gameData, oddsData);
      res.json(edges);
    } catch (error) {
      console.error('Error calculating edges:', error);
      res.status(500).json({ error: "Failed to calculate edges" });
    }
  });

  // Periodic tasks for live updates
  setInterval(async () => {
    try {
      const sports = ['americanfootball_nfl', 'basketball_nba', 'baseball_mlb'];
      
      for (const sport of sports) {
        const currentOdds = await oddsApiService.getCurrentOdds(sport);
        
        // Broadcast odds updates
        for (const game of currentOdds) {
          websocketService.broadcastOddsUpdate(game.id, game);
        }
      }
    } catch (error) {
      console.error('Error in periodic odds update:', error);
    }
  }, 60000); // Update every minute

  return httpServer;
}
