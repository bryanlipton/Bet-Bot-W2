import { Express, Request, Response } from "express";
import { dailyPickService } from "./services/dailyPickService";
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
      const pick = await dailyPickService.getTodaysPick();
      
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
        factors: {
          teamOffense: {
            score: pick.analysis.teamOffense,
            description: pick.analysis.teamOffense > 65 
              ? "Strong offensive metrics with above-average contact quality"
              : pick.analysis.teamOffense < 45 
              ? "Below-average offensive production and contact quality"
              : "Average offensive capabilities"
          },
          pitchingMatchup: {
            score: pick.analysis.pitchingMatchup,
            description: pick.analysis.pitchingMatchup > 60
              ? "Favorable pitching matchup with recent form advantage"
              : pick.analysis.pitchingMatchup < 40
              ? "Challenging pitching matchup against quality starter"
              : "Neutral pitching matchup"
          },
          ballparkFactor: {
            score: pick.analysis.ballparkFactor,
            description: pick.venue === 'Coors Field'
              ? "Coors Field environment favors teams that can handle offensive conditions"
              : pick.analysis.ballparkFactor > 55
              ? "Hitter-friendly ballpark environment"
              : pick.analysis.ballparkFactor < 45
              ? "Pitcher-friendly ballpark environment"
              : "Neutral ballpark environment"
          },
          weatherImpact: {
            score: pick.analysis.weatherImpact,
            description: "Weather conditions factored into analysis"
          },
          situationalEdge: {
            score: pick.analysis.situationalEdge,
            description: pick.analysis.situationalEdge > 60
              ? "Strong recent form and situational advantages"
              : pick.analysis.situationalEdge < 40
              ? "Recent struggles or situational disadvantages"
              : "Neutral recent form and situation"
          },
          valueScore: {
            score: pick.analysis.valueScore,
            description: pick.analysis.valueScore > 65
              ? "Excellent betting value - market appears to undervalue this team"
              : pick.analysis.valueScore > 55
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
  app.post("/api/daily-pick/lock/generate", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const gamesResponse = await fetch('http://localhost:5000/api/mlb/complete-schedule');
      const games = await gamesResponse.json();
      
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
}