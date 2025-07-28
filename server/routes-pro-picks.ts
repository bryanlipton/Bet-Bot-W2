import { Application } from "express";
import { storage } from "./storage";
import { isAuthenticated } from "./devAuth";
import { DailyPickService } from "./services/dailyPickService";
import { persistentGradeService } from "./services/persistentGradeService";

// Cache for Pro picks to prevent constant regeneration
const proPicksCache = new Map();
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

// Clear cache function for debugging
function clearProCache() {
  proPicksCache.clear();
  console.log('🗑️ Pro picks cache cleared');
}

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
      
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // First check if we have persistent grades for today
      const existingGrades = await persistentGradeService.getGradesForDate(today);
      
      if (existingGrades.length > 0) {
        console.log(`📋 Returning ${existingGrades.length} persistent grades for ${today}`);
        const proPicksData = existingGrades.map(grade => ({
          gameId: grade.gameId,
          homeTeam: grade.homeTeam,
          awayTeam: grade.awayTeam,
          pickTeam: grade.pickTeam,
          grade: grade.grade,
          confidence: grade.confidence,
          reasoning: grade.reasoning,
          analysis: grade.analysis,
          odds: grade.odds
        }));
        return res.json(proPicksData);
      }
      
      // No persistent grades found, generate new ones
      console.log("No persistent grades found, generating new ones...");
      
      // Get all games first
      const { oddsApiService } = await import('./services/oddsApi.js');
      const games = await oddsApiService.getCurrentOdds('baseball_mlb');
      
      // Generate analysis for all games with grades
      const allPicks = await dailyPickService.generateAllGamePicks(games);
      
      // Store each pick as a persistent grade
      for (const pick of allPicks) {
        await persistentGradeService.storeGrade({
          gameId: pick.gameId,
          homeTeam: pick.homeTeam,
          awayTeam: pick.awayTeam,
          pickTeam: pick.pickTeam,
          grade: pick.grade,
          confidence: pick.confidence,
          reasoning: pick.reasoning,
          analysis: pick.analysis,
          odds: pick.odds,
          gameTime: new Date(pick.gameTime),
          pickDate: today
        });
      }
      
      // Return picks with enhanced grades and analysis
      const proPicksData = allPicks.map(pick => ({
        gameId: pick.gameId,
        homeTeam: pick.homeTeam,
        awayTeam: pick.awayTeam,
        pickTeam: pick.pickTeam,
        grade: pick.grade,
        confidence: pick.confidence,
        reasoning: pick.reasoning,
        analysis: pick.analysis,
        odds: pick.odds
      }));

      console.log(`💾 Generated and stored ${allPicks.length} new persistent grades for ${today}`);
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
      
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // First check if we have a persistent grade for this game
      const existingGrade = await persistentGradeService.getExistingGrade(gameId, today);
      
      if (existingGrade) {
        console.log(`📋 Returning persistent grade for game ${gameId}: ${existingGrade.grade}`);
        const gameAnalysis = {
          gameId: existingGrade.gameId,
          homeTeam: existingGrade.homeTeam,
          awayTeam: existingGrade.awayTeam,
          pickTeam: existingGrade.pickTeam,
          grade: existingGrade.grade,
          confidence: existingGrade.confidence,
          reasoning: existingGrade.reasoning,
          analysis: existingGrade.analysis,
          odds: existingGrade.odds
        };
        return res.json(gameAnalysis);
      }
      
      // Use the same system as daily picks - get all odds data and generate picks
      const { oddsApiService } = await import('./services/oddsApi.js');
      const { dailyPickService } = await import('./services/dailyPickService.js');
      
      const games = await oddsApiService.getCurrentOdds('baseball_mlb');
      
      // Generate all game picks using the enhanced system (same as daily picks)
      const allPicks = await dailyPickService.generateAllGamePicks(games);
      console.log(`🔍 Generated ${allPicks.length} picks, searching for game ${gameId}`);
      console.log(`📋 Generated picks: ${allPicks.map(p => `${p.gameId}:${p.pickTeam}(${p.grade})`).join(', ')}`);
      
      // Find the pick for this specific game using multiple matching strategies
      let gamePick = allPicks.find(pick => {
        // Check direct gameId match
        if (pick.gameId === gameId) return true;
        
        // Check if the pick's game data contains our target gameId
        const pickGameId = pick.gameId?.toString();
        const targetGameId = gameId?.toString(); 
        
        // Try various matching approaches for different ID formats
        return pickGameId === targetGameId ||
               pickGameId?.includes(targetGameId) ||
               targetGameId?.includes(pickGameId);
      });
      
      // If no direct ID match, try to match by team names from the complete schedule
      if (!gamePick) {
        console.log(`🔍 No direct ID match for ${gameId}, trying team-based matching...`);
        
        // Get the target game from complete schedule to find team names
        const scheduleResponse = await fetch('http://localhost:5000/api/mlb/complete-schedule');
        const allGames = await scheduleResponse.json();
        
        const targetGame = allGames.find((game: any) => {
          return game.gameId?.toString() === gameId.toString() ||
                 game.id === `mlb_${gameId}`;
        });
        
        if (targetGame) {
          console.log(`🎯 Found target game: ${targetGame.awayTeam} @ ${targetGame.homeTeam} (gameId: ${targetGame.gameId})`);
          
          // Find a pick that matches the teams from this game
          gamePick = allPicks.find(pick => {
            const homeMatch = pick.homeTeam === targetGame.homeTeam;
            const awayMatch = pick.awayTeam === targetGame.awayTeam;
            const exactMatch = homeMatch && awayMatch;
            const partialMatch = homeMatch || awayMatch;
            
            console.log(`🔍 Comparing pick ${pick.homeTeam} vs ${pick.awayTeam} with target ${targetGame.homeTeam} vs ${targetGame.awayTeam}: exact=${exactMatch}, partial=${partialMatch}`);
            
            return exactMatch || partialMatch;
          });
          
          if (gamePick) {
            console.log(`✅ Found team-based match: ${gamePick.pickTeam} (${gamePick.grade}) for ${gamePick.homeTeam} vs ${gamePick.awayTeam}`);
          } else {
            console.log(`❌ No team match found for ${targetGame.homeTeam} vs ${targetGame.awayTeam}`);
            console.log(`📋 Available teams in picks: ${allPicks.map(p => `${p.homeTeam} vs ${p.awayTeam}`).slice(0, 5).join(', ')}...`);
          }
        }
      }
      
      if (!gamePick) {
        console.log(`❌ No match found for game ${gameId} in ${allPicks.length} generated picks`);
        return res.status(404).json({ error: "Game analysis not found in generated picks" });
      }
      
      console.log(`✅ Found Pro pick for game ${gameId}: ${gamePick.pickTeam} (${gamePick.grade})`);
      
      // Debug: Log the analysis object to verify factor scores
      console.log(`🔍 Analysis factors for ${gamePick.pickTeam}:`, {
        offensiveProduction: gamePick.analysis?.offensiveProduction,
        pitchingMatchup: gamePick.analysis?.pitchingMatchup,
        situationalEdge: gamePick.analysis?.situationalEdge,
        teamMomentum: gamePick.analysis?.teamMomentum,
        marketInefficiency: gamePick.analysis?.marketInefficiency,
        systemConfidence: gamePick.analysis?.systemConfidence
      });
      
      // Return the Pro pick data using the enhanced grading system results
      const proPickData = {
        gameId: gameId,
        homeTeam: gamePick.homeTeam,
        awayTeam: gamePick.awayTeam,
        pickTeam: gamePick.pickTeam,
        grade: gamePick.grade,
        confidence: gamePick.confidence,
        reasoning: gamePick.reasoning,
        analysis: gamePick.analysis, // Include the full analysis object with factor scores
        odds: gamePick.odds
      };
      
      // Cache the result
      const analysisCache = `game-${gameId}`;
      proPicksCache.set(analysisCache, {
        data: proPickData,
        timestamp: Date.now()
      });
      console.log(`💾 Cached analysis for game ${gameId} for 15 minutes`);
      
      res.json(proPickData);
    } catch (error: any) {
      console.error(`Error fetching Pro game analysis for ${req.params.gameId}:`, error);
      res.status(500).json({ error: error.message });
    }
  });
}