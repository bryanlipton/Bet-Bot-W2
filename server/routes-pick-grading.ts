import type { Express } from "express";
import { isAuthenticated } from "./auth";
import { pickGradingService } from "./services/pickGradingService";
import { automaticGradingService } from "./services/automaticGradingService";

export function registerPickGradingRoutes(app: Express) {
  // Manually grade picks for a specific date (admin/testing)
  app.post('/api/admin/grade-picks/:date', async (req, res) => {
    try {
      const { date } = req.params;
      
      // Validate date format (YYYY-MM-DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD" });
      }
      
      const gradedCount = await pickGradingService.gradePendingPicks(date);
      
      res.json({ 
        message: `Graded ${gradedCount} picks for ${date}`,
        gradedCount,
        date 
      });
      
    } catch (error) {
      console.error("Error grading picks:", error);
      res.status(500).json({ message: "Failed to grade picks" });
    }
  });

  // Auto-grade yesterday's picks
  app.post('/api/admin/auto-grade-yesterday', async (req, res) => {
    try {
      const gradedCount = await pickGradingService.autoGradeYesterdaysPicks();
      
      res.json({ 
        message: `Auto-graded ${gradedCount} picks from yesterday`,
        gradedCount 
      });
      
    } catch (error) {
      console.error("Error auto-grading yesterday's picks:", error);
      res.status(500).json({ message: "Failed to auto-grade picks" });
    }
  });

  // Grade picks for a date range (useful for backfilling)
  app.post('/api/admin/grade-picks-range', async (req, res) => {
    try {
      const { startDate, endDate } = req.body;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "startDate and endDate are required" });
      }
      
      // Validate date formats
      if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD" });
      }
      
      const totalGraded = await pickGradingService.gradePicksForDateRange(startDate, endDate);
      
      res.json({ 
        message: `Graded ${totalGraded} picks from ${startDate} to ${endDate}`,
        totalGraded,
        startDate,
        endDate
      });
      
    } catch (error) {
      console.error("Error grading picks for date range:", error);
      res.status(500).json({ message: "Failed to grade picks for date range" });
    }
  });

  // Manual trigger for automatic grading (for testing or immediate processing)
  app.post('/api/admin/manual-grade', async (req, res) => {
    try {
      const { days = 1 } = req.body;
      
      const gradedCount = await automaticGradingService.manualGrade(days);
      
      res.json({ 
        message: `Manual grading completed: ${gradedCount} picks graded`,
        gradedCount,
        daysProcessed: days
      });
      
    } catch (error) {
      console.error("Error in manual grading:", error);
      res.status(500).json({ message: "Failed to run manual grading" });
    }
  });

  // Get grading status/stats
  app.get('/api/admin/grading-stats', async (req, res) => {
    try {
      // This could be expanded to show more detailed stats
      res.json({ 
        message: "Pick grading service is operational",
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error("Error getting grading stats:", error);
      res.status(500).json({ message: "Failed to get grading stats" });
    }
  });

  // Insert sample historical picks for testing
  app.post('/api/admin/insert-sample-historical-picks/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const { storage } = await import('./storage');
      
      const sampleHistoricalPicks = [
        {
          userId: userId,
          gameId: 'mlb_777001', 
          selection: 'Boston Red Sox',
          game: 'New York Yankees @ Boston Red Sox',
          market: 'moneyline',
          line: null,
          odds: 150,
          units: 2.0,
          bookmaker: 'draftkings',
          bookmakerDisplayName: 'DraftKings',
          status: 'win',
          result: 'New York Yankees 5 - 7 Boston Red Sox',
          winAmount: 3.0,
          parlayLegs: null,
          showOnProfile: true,
          showOnFeed: true,
          gameDate: new Date(Date.now() - 86400000), // Yesterday
          gradedAt: new Date(Date.now() - 43200000), // 12 hours ago
        },
        {
          userId: userId,
          gameId: 'mlb_777002',
          selection: 'Los Angeles Dodgers -1.5',
          game: 'San Francisco Giants @ Los Angeles Dodgers',
          market: 'spread', 
          line: '-1.5',
          odds: -110,
          units: 1.5,
          bookmaker: 'fanduel',
          bookmakerDisplayName: 'FanDuel',
          status: 'loss',
          result: 'San Francisco Giants 4 - 5 Los Angeles Dodgers', 
          winAmount: -1.5,
          parlayLegs: null,
          showOnProfile: true,
          showOnFeed: true,
          gameDate: new Date(Date.now() - 86400000),
          gradedAt: new Date(Date.now() - 43200000),
        },
        {
          userId: userId,
          gameId: 'mlb_777003',
          selection: 'Over 8.5',
          game: 'Chicago Cubs @ Milwaukee Brewers',
          market: 'total',
          line: '8.5',
          odds: -105,
          units: 1.0,
          bookmaker: 'betmgm', 
          bookmakerDisplayName: 'BetMGM',
          status: 'win',
          result: 'Chicago Cubs 6 - 4 Milwaukee Brewers',
          winAmount: 0.95,
          parlayLegs: null,
          showOnProfile: true,
          showOnFeed: true,
          gameDate: new Date(Date.now() - 86400000),
          gradedAt: new Date(Date.now() - 43200000),
        }
      ];

      // Insert each pick without id (let auto-increment handle it)
      const insertedPicks = [];
      for (const pickData of sampleHistoricalPicks) {
        const pick = await storage.createUserPick(pickData);
        insertedPicks.push(pick);
      }

      const wins = insertedPicks.filter(p => p.status === 'win').length;
      const losses = insertedPicks.filter(p => p.status === 'loss').length;
      const totalUnits = insertedPicks.reduce((sum, p) => sum + (p.winAmount || 0), 0);
      
      res.json({
        message: `Successfully inserted ${insertedPicks.length} historical picks for user ${userId}`,
        picks: insertedPicks.length,
        record: `${wins}-${losses}`,
        winRate: ((wins / (wins + losses)) * 100).toFixed(1) + '%',
        totalUnits: totalUnits.toFixed(2),
        insertedPicks
      });
      
    } catch (error) {
      console.error("Error inserting sample historical picks:", error);
      res.status(500).json({ message: "Failed to insert sample historical picks" });
    }
  });
}