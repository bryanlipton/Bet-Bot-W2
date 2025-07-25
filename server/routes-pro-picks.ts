import { Application } from "express";
import { storage } from "./storage";
import { isAuthenticated } from "./replitAuth";
import { DailyPickService } from "./services/dailyPickService";

export function setupProPicksRoutes(app: Application) {
  const dailyPickService = new DailyPickService();

  // Get all picks with grades for Pro users
  app.get("/api/pro/all-picks", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      
      // Check if user has active Pro subscription
      if (!user || user.subscriptionStatus !== 'active' || user.subscriptionPlan === 'free') {
        return res.status(403).json({ error: "Pro subscription required" });
      }

      console.log("Pro user requesting all picks with grades");
      
      // Get all games first
      const { oddsApiService } = await import('./services/oddsApi.js');
      const games = await oddsApiService.getCurrentOdds('baseball_mlb');
      
      // Generate analysis for all games with grades
      const allPicks = await dailyPickService.generateAllGamePicks(games);
      
      // Return picks with enhanced grades and analysis
      const proPicksData = allPicks.map(pick => ({
        gameId: pick.gameId,
        homeTeam: pick.gameDetails?.homeTeam,
        awayTeam: pick.gameDetails?.awayTeam,
        pickTeam: pick.gameDetails?.pickTeam,
        grade: pick.grade,
        confidence: pick.overall?.confidence,
        reasoning: pick.overall?.reasoning,
        analysis: pick.analysis,
        odds: pick.gameDetails?.odds
      }));

      res.json(proPicksData);
    } catch (error: any) {
      console.error("Error fetching Pro all picks:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get detailed analysis for specific game (Pro users)
  app.get("/api/pro/game/:gameId/analysis", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      
      // Check if user has active Pro subscription
      if (!user || user.subscriptionStatus !== 'active' || user.subscriptionPlan === 'free') {
        return res.status(403).json({ error: "Pro subscription required" });
      }

      const { gameId } = req.params;
      console.log(`Pro user requesting detailed analysis for game: ${gameId}`);
      
      // Get all games first
      const { oddsApiService } = await import('./services/oddsApi.js');
      const games = await oddsApiService.getCurrentOdds('baseball_mlb');
      
      // Get all picks and find the one for this game
      const allPicks = await dailyPickService.generateAllGamePicks(games);
      const gamePick = allPicks.find(pick => 
        pick.gameId === gameId || 
        pick.gameId.toString() === gameId ||
        pick.gameDetails?.gameId === gameId ||
        pick.gameDetails?.gameId?.toString() === gameId
      );
      
      if (!gamePick) {
        return res.status(404).json({ error: "Game analysis not found" });
      }
      
      // Return the Pro pick data
      const proPickData = {
        gameId: gamePick.gameId,
        homeTeam: gamePick.gameDetails?.homeTeam,
        awayTeam: gamePick.gameDetails?.awayTeam,
        pickTeam: gamePick.gameDetails?.pickTeam,
        grade: gamePick.grade,
        confidence: gamePick.overall?.confidence || 75,
        reasoning: gamePick.overall?.reasoning || "AI analysis indicates value in this selection",
        odds: gamePick.gameDetails?.odds || -110
      };
      
      res.json(proPickData);
    } catch (error: any) {
      console.error(`Error fetching Pro game analysis for ${req.params.gameId}:`, error);
      res.status(500).json({ error: error.message });
    }
  });
}