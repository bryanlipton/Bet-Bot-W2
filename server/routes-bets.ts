import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import { isAuthenticated } from "./auth";
import { insertUserBetSchema, type UserBet } from "@shared/schema";
import { z } from "zod";

// Extended bet request for creation
const createBetSchema = insertUserBetSchema.extend({
  // Add any additional validation rules here
});

// ROI calculation helpers
function calculateROI(bets: UserBet[], timeRange: string): {
  totalWagered: number;
  totalProfit: number;
  roi: number;
  winRate: number;
  totalBets: number;
} {
  const now = new Date();
  let startDate: Date;
  
  // Calculate start date based on time range
  switch (timeRange) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    case 'ytd':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(0); // All time
  }
  
  // Filter bets by date range
  const filteredBets = bets.filter(bet => 
    new Date(bet.gameDate) >= startDate && bet.status !== 'pending'
  );
  
  const totalWagered = filteredBets.reduce((sum, bet) => sum + Number(bet.stake), 0);
  const totalProfit = filteredBets.reduce((sum, bet) => sum + Number(bet.profitLoss), 0);
  const roi = totalWagered > 0 ? (totalProfit / totalWagered) * 100 : 0;
  const winCount = filteredBets.filter(bet => bet.result === 'win').length;
  const winRate = filteredBets.length > 0 ? (winCount / filteredBets.length) * 100 : 0;
  
  return {
    totalWagered,
    totalProfit,
    roi,
    winRate,
    totalBets: filteredBets.length
  };
}

export function registerBetRoutes(app: Express) {
  // Create a new bet
  app.post("/api/bets", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.claims.sub;
      const betData = createBetSchema.parse({
        ...req.body,
        userId
      });
      
      const bet = await storage.createUserBet(betData);
      res.json(bet);
    } catch (error) {
      console.error("Error creating bet:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid bet data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create bet" });
      }
    }
  });

  // Get user's bets with pagination
  app.get("/api/bets", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const bets = await storage.getUserBets(userId, limit, offset);
      res.json(bets);
    } catch (error) {
      console.error("Error fetching bets:", error);
      res.status(500).json({ error: "Failed to fetch bets" });
    }
  });

  // Get bets by team
  app.get("/api/bets/team/:teamName", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.claims.sub;
      const { teamName } = req.params;
      
      const bets = await storage.getUserBetsByTeam(userId, teamName);
      
      // Calculate team-specific statistics
      const totalBets = bets.length;
      const totalWagered = bets.reduce((sum, bet) => sum + Number(bet.stake), 0);
      const totalProfit = bets.reduce((sum, bet) => sum + Number(bet.profitLoss), 0);
      const winCount = bets.filter(bet => bet.result === 'win').length;
      const lossCount = bets.filter(bet => bet.result === 'loss').length;
      const roi = totalWagered > 0 ? (totalProfit / totalWagered) * 100 : 0;
      const winRate = totalBets > 0 ? (winCount / totalBets) * 100 : 0;
      
      res.json({
        teamName,
        bets,
        stats: {
          totalBets,
          totalWagered,
          totalProfit,
          winCount,
          lossCount,
          roi,
          winRate,
          record: `${winCount}-${lossCount}`
        }
      });
    } catch (error) {
      console.error("Error fetching team bets:", error);
      res.status(500).json({ error: "Failed to fetch team bets" });
    }
  });

  // Get pending (active) bets
  app.get("/api/bets/pending", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.claims.sub;
      const pendingBets = await storage.getUserBetsByStatus(userId, "pending");
      res.json(pendingBets);
    } catch (error) {
      console.error("Error fetching pending bets:", error);
      res.status(500).json({ error: "Failed to fetch pending bets" });
    }
  });

  // Get ROI statistics
  app.get("/api/bets/roi", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.claims.sub;
      const allBets = await storage.getUserBets(userId, 1000); // Get all bets
      
      const stats = {
        thisWeek: calculateROI(allBets, 'week'),
        thisMonth: calculateROI(allBets, 'month'),
        thisYear: calculateROI(allBets, 'year'),
        ytd: calculateROI(allBets, 'ytd'),
        allTime: calculateROI(allBets, 'all')
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error calculating ROI:", error);
      res.status(500).json({ error: "Failed to calculate ROI" });
    }
  });

  // Update bet (settle result)
  app.patch("/api/bets/:betId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.claims.sub;
      const betId = parseInt(req.params.betId);
      const updates = req.body;
      
      // Verify the bet belongs to the user
      const existingBets = await storage.getUserBets(userId, 1000);
      const betExists = existingBets.some(bet => bet.id === betId);
      
      if (!betExists) {
        return res.status(404).json({ error: "Bet not found" });
      }
      
      const updatedBet = await storage.updateUserBet(betId, updates);
      res.json(updatedBet);
    } catch (error) {
      console.error("Error updating bet:", error);
      res.status(500).json({ error: "Failed to update bet" });
    }
  });

  // Get bet statistics summary
  app.get("/api/bets/stats", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.claims.sub;
      const stats = await storage.getUserBetStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching bet stats:", error);
      res.status(500).json({ error: "Failed to fetch bet statistics" });
    }
  });

  // Search bets by date range
  app.get("/api/bets/search", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.claims.sub;
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "Start date and end date are required" });
      }
      
      const bets = await storage.getUserBetsByDateRange(
        userId,
        new Date(startDate as string),
        new Date(endDate as string)
      );
      
      res.json(bets);
    } catch (error) {
      console.error("Error searching bets:", error);
      res.status(500).json({ error: "Failed to search bets" });
    }
  });
}