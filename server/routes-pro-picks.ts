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
      
      // Generate analysis for all games with grades
      const allPicks = await dailyPickService.generateAllGamePicks();
      
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
      
      // Get detailed analysis for specific game
      const analysis = await dailyPickService.getGameAnalysis(gameId);
      
      res.json(analysis);
    } catch (error: any) {
      console.error(`Error fetching Pro game analysis for ${req.params.gameId}:`, error);
      res.status(500).json({ error: error.message });
    }
  });
}