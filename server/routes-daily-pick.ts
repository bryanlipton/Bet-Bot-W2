import { Express, Request, Response } from "express";
import { dailyPickService } from "./services/dailyPickService";
import { pickRotationService } from "./services/pickRotationService";
import { isAuthenticated } from "./replitAuth";

export function registerDailyPickRoutes(app: Express) {
  // Get today's pick of the day
  app.get("/api/daily-pick", async (req: Request, res: Response) => {
    try {
      const todaysPick = await dailyPickService.getTodaysPick();
      
      if (!todaysPick) {
        // Try to generate a new pick if none exists
        // First get today's games
        const gamesResponse = await fetch('http://localhost:5000/api/mlb/complete-schedule');
        const games = await gamesResponse.json();
        
        // Filter for upcoming games with odds (today or next few days)
        const today = new Date();
        const todaysGames = games.filter((game: any) => {
          const gameDate = new Date(game.commence_time);
          const daysDiff = Math.floor((gameDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return daysDiff >= 0 && daysDiff <= 3 && game.hasOdds; // Games within next 3 days
        });

        if (todaysGames.length > 0) {
          const newPick = await dailyPickService.generateAndSaveTodaysPick(todaysGames);
          return res.json(newPick);
        } else {
          return res.json(null);
        }
      }

      res.json(todaysPick);
    } catch (error) {
      console.error("Failed to get daily pick:", error);
      res.status(500).json({ error: "Failed to get daily pick" });
    }
  });

  // Get specific pitcher stats (development endpoint)
  app.get("/api/daily-pick/pitcher-stats/:name", async (req: Request, res: Response) => {
    try {
      const pitcherName = req.params.name;
      const stats = await dailyPickService.fetchReal2025PitcherStats(pitcherName);
      
      if (stats) {
        res.json({
          pitcher: pitcherName,
          stats,
          message: `Real 2025 season stats for ${pitcherName}`
        });
      } else {
        res.status(404).json({
          pitcher: pitcherName,
          error: "No 2025 stats found for this pitcher",
          message: "Pitcher may not be active or stats not available"
        });
      }
    } catch (error) {
      console.error("Failed to fetch pitcher stats:", error);
      res.status(500).json({ error: "Failed to fetch pitcher stats" });
    }
  });

  // Analyze any specific game for pick grading
  app.post("/api/daily-pick/analyze-game", async (req: Request, res: Response) => {
    try {
      const { gameId, homeTeam, awayTeam, pickTeam, odds, gameTime, venue } = req.body;
      
      if (!homeTeam || !awayTeam || !pickTeam || !odds) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      // Generate analysis for this specific pick
      const analysis = await dailyPickService.generateGameAnalysis(
        homeTeam,
        awayTeam,
        pickTeam,
        odds,
        gameTime || new Date().toISOString(),
        venue || "TBD"
      );
      
      res.json(analysis);
    } catch (error) {
      console.error("Failed to analyze game:", error);
      res.status(500).json({ error: "Failed to analyze game" });
    }
  });

  // Test grading endpoint (development only)
  app.post("/api/daily-pick/test-new-grading", async (req: Request, res: Response) => {
    try {
      // Get today's games
      const gamesResponse = await fetch('http://localhost:5000/api/mlb/complete-schedule');
      const games = await gamesResponse.json();
      
      // Filter for upcoming games with odds
      const today = new Date();
      const todaysGames = games.filter((game: any) => {
        const gameDate = new Date(game.commence_time);
        const daysDiff = Math.floor((gameDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff >= 0 && daysDiff <= 3 && game.hasOdds;
      });

      if (todaysGames.length === 0) {
        return res.status(400).json({ error: "No games with odds available for testing" });
      }

      // Generate new picks to test grading
      const newPick = await dailyPickService.generateDailyPick(todaysGames);
      const newLockPick = await dailyPickService.generateDailyPick(todaysGames);
      
      if (newPick && newLockPick) {
        // Save both picks for testing
        await dailyPickService.saveDailyPick(newPick);
        await dailyPickService.saveLockPick(newLockPick);
        
        res.json({ 
          dailyPick: newPick, 
          lockPick: newLockPick,
          message: "New picks generated with updated grading system",
          grades: {
            daily: newPick.grade,
            lock: newLockPick.grade
          }
        });
      } else {
        res.status(400).json({ error: "Could not generate suitable picks for testing" });
      }
    } catch (error) {
      console.error("Failed to test new grading:", error);
      res.status(500).json({ error: "Failed to test new grading system" });
    }
  });

  // Generate new daily pick (admin/testing endpoint)
  app.post("/api/daily-pick/generate", async (req: Request, res: Response) => {
    try {
      // Get today's games
      const gamesResponse = await fetch('http://localhost:5000/api/mlb/complete-schedule');
      const games = await gamesResponse.json();
      
      // Filter for upcoming games with odds (today or next few days)
      const today = new Date();
      const todaysGames = games.filter((game: any) => {
        const gameDate = new Date(game.commence_time);
        const daysDiff = Math.floor((gameDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff >= 0 && daysDiff <= 3 && game.hasOdds; // Games within next 3 days
      });

      if (todaysGames.length === 0) {
        return res.status(400).json({ error: "No games with odds available for today" });
      }

      const newPick = await dailyPickService.generateDailyPick(todaysGames);
      
      if (newPick) {
        await dailyPickService.saveDailyPick(newPick);
        res.json(newPick);
      } else {
        res.status(400).json({ error: "Could not generate a suitable pick from available games" });
      }
    } catch (error) {
      console.error("Failed to generate daily pick:", error);
      res.status(500).json({ error: "Failed to generate daily pick" });
    }
  });

  // Get pick analysis breakdown (for info button)
  app.get("/api/daily-pick/:pickId/analysis", async (req: Request, res: Response) => {
    try {
      const { pickId } = req.params;
      
      // First try to find it as a daily pick
      let pick = await dailyPickService.getTodaysPick();
      
      // If not found or ID doesn't match, try lock pick
      if (!pick || pick.id !== pickId) {
        pick = await dailyPickService.getTodaysLockPick();
      }
      
      if (!pick || pick.id !== pickId) {
        return res.status(404).json({ error: "Pick not found" });
      }

      // Return detailed analysis breakdown
      const analysisBreakdown = {
        overall: {
          grade: pick.grade,
          confidence: pick.confidence,
          reasoning: pick.reasoning
        },
        // Frontend expects direct numerical properties on the analysis object
        offensiveProduction: pick.analysis.offensiveEdge || 75,
        pitchingMatchup: pick.analysis.pitchingEdge || 75, 
        situationalEdge: pick.analysis.recentForm || 75,
        teamMomentum: pick.analysis.recentForm || 75,
        marketInefficiency: pick.analysis.bettingValue || 75,
        systemConfidence: pick.analysis.confidence || 75,
        confidence: pick.analysis.confidence || 75,
        factors: {
          offensiveEdge: {
            score: pick.analysis.offensiveEdge,
            description: pick.analysis.offensiveEdge > 65 
              ? "Strong offensive edge with above-average contact quality"
              : pick.analysis.offensiveEdge < 45 
              ? "Below-average offensive production and contact quality"
              : "Average offensive capabilities"
          },
          pitchingMatchup: {
            score: pick.analysis.pitchingEdge,
            description: pick.analysis.pitchingEdge > 60
              ? "Favorable pitching matchup with recent form advantage"
              : pick.analysis.pitchingEdge < 40
              ? "Challenging pitching matchup against quality starter"
              : "Neutral pitching matchup"
          },
          ballparkFactor: {
            score: pick.analysis.ballparkAdvantage,
            description: pick.venue === 'Coors Field'
              ? "Coors Field environment favors teams that can handle offensive conditions"
              : pick.analysis.ballparkAdvantage > 55
              ? "Hitter-friendly ballpark environment"
              : pick.analysis.ballparkAdvantage < 45
              ? "Pitcher-friendly ballpark environment"
              : "Neutral ballpark environment"
          },
          weatherImpact: {
            score: pick.analysis.weatherConditions,
            description: "Weather conditions factored into analysis"
          },
          situationalEdge: {
            score: pick.analysis.recentForm,
            description: pick.analysis.recentForm > 60
              ? "Strong recent form and situational advantages"
              : pick.analysis.recentForm < 40
              ? "Recent struggles or situational disadvantages"
              : "Neutral recent form and situation"
          },
          valueScore: {
            score: pick.analysis.bettingValue,
            description: pick.analysis.bettingValue > 65
              ? "Excellent betting value - market appears to undervalue this team"
              : pick.analysis.bettingValue > 55
              ? "Good betting value identified"
              : "Fair market pricing"
          }
        },
        gameDetails: {
          matchup: `${pick.awayTeam} @ ${pick.homeTeam}`,
          venue: pick.venue,
          gameTime: pick.gameTime,
          pickTeam: pick.pickTeam,
          odds: pick.odds > 0 ? `+${pick.odds}` : `${pick.odds}`,
          probablePitchers: pick.probablePitchers
        }
      };

      res.json(analysisBreakdown);
    } catch (error) {
      console.error("Failed to get pick analysis:", error);
      res.status(500).json({ error: "Failed to get pick analysis" });
    }
  });

  // Get today's logged-in lock pick (for authenticated users)
  app.get("/api/daily-pick/lock", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const todaysLockPick = await dailyPickService.getTodaysLockPick();
      
      if (!todaysLockPick) {
        // Try to generate a new lock pick if none exists
        const gamesResponse = await fetch('http://localhost:5000/api/mlb/complete-schedule');
        const games = await gamesResponse.json();
        
        // Filter for upcoming games with odds (today or next few days)
        const today = new Date();
        const todaysGames = games.filter((game: any) => {
          const gameDate = new Date(game.commence_time);
          const daysDiff = Math.floor((gameDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return daysDiff >= 0 && daysDiff <= 3 && game.hasOdds; // Games within next 3 days
        });

        if (todaysGames.length > 0) {
          const newLockPick = await dailyPickService.generateAndSaveTodaysLockPick(todaysGames);
          return res.json(newLockPick);
        } else {
          return res.json(null);
        }
      }

      res.json(todaysLockPick);
    } catch (error) {
      console.error("Failed to get lock pick:", error);
      res.status(500).json({ error: "Failed to get lock pick" });
    }
  });



  // Generate new lock pick (admin/testing endpoint)
  app.post("/api/daily-pick/lock/test-generate", async (req: Request, res: Response) => {
    try {
      console.log('🔧 Lock pick test generation endpoint called');
      const gamesResponse = await fetch('http://localhost:5000/api/mlb/complete-schedule');
      const games = await gamesResponse.json();
      console.log(`📊 Retrieved ${games.length} games for lock pick generation`);
      
      const today = new Date();
      const todaysGames = games.filter((game: any) => {
        const gameDate = new Date(game.commence_time);
        const daysDiff = Math.floor((gameDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff >= 0 && daysDiff <= 3 && game.hasOdds; // Games within next 3 days
      });

      if (todaysGames.length === 0) {
        return res.status(400).json({ error: "No games with odds available for today" });
      }

      const newLockPick = await dailyPickService.generateAndSaveTodaysLockPick(todaysGames);
      
      if (newLockPick) {
        res.json(newLockPick);
      } else {
        res.status(400).json({ error: "Could not generate a suitable lock pick from available games" });
      }
    } catch (error) {
      console.error("Failed to generate lock pick:", error);
      res.status(500).json({ error: "Failed to generate lock pick" });
    }
  });

  // Manual rotation endpoint for testing/admin use
  app.post("/api/daily-pick/rotate", async (req: Request, res: Response) => {
    try {
      console.log('🔧 Manual pick rotation triggered via API');
      await pickRotationService.manualRotation();
      res.json({ 
        success: true, 
        message: "Pick rotation completed successfully",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Failed to rotate picks:", error);
      res.status(500).json({ error: "Failed to rotate picks" });
    }
  });

  // Get rotation status endpoint
  app.get("/api/daily-pick/status", async (req: Request, res: Response) => {
    try {
      const dailyPick = await dailyPickService.getTodaysPick();
      const lockPick = await dailyPickService.getTodaysLockPick();
      
      let dailyPickStatus = 'none';
      let lockPickStatus = 'none';
      
      if (dailyPick) {
        const gameTime = new Date(dailyPick.gameTime);
        const now = new Date();
        if (now > gameTime) {
          dailyPickStatus = 'game_started';
        } else {
          dailyPickStatus = 'active';
        }
      }
      
      if (lockPick) {
        const gameTime = new Date(lockPick.gameTime);
        const now = new Date();
        if (now > gameTime) {
          lockPickStatus = 'game_started';
        } else {
          lockPickStatus = 'active';
        }
      }
      
      res.json({
        dailyPick: {
          status: dailyPickStatus,
          gameId: dailyPick?.gameId || null,
          gameTime: dailyPick?.gameTime || null,
          pickTeam: dailyPick?.pickTeam || null
        },
        lockPick: {
          status: lockPickStatus,
          gameId: lockPick?.gameId || null,
          gameTime: lockPick?.gameTime || null,
          pickTeam: lockPick?.pickTeam || null
        },
        nextRotationCheck: "Every 5 minutes",
        next2AMRotation: "2:00 AM EST daily"
      });
    } catch (error) {
      console.error("Failed to get rotation status:", error);
      res.status(500).json({ error: "Failed to get rotation status" });
    }
  });
}