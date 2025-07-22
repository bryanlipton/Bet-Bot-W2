import { Express, Request, Response } from "express";
import { enhancedPickGradingService } from "./services/enhancedPickGradingService";
// Simple auth middleware for enhanced grading routes
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

export function registerEnhancedGradingRoutes(app: Express): void {
  
  // Enhanced manual grading endpoint - grades all pending picks with real-time data
  app.post('/api/enhanced-grading/grade-all', requireAuth, async (req: Request, res: Response) => {
    try {
      console.log('🎯 Enhanced grading: Manual trigger by admin');
      
      const result = await enhancedPickGradingService.gradeAllPendingPicks();
      
      res.json({
        success: true,
        message: `Enhanced grading completed`,
        gradedCount: result.graded,
        liveGamesFound: result.updated,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Enhanced grading error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Enhanced grading failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get real-time updates for user's picks
  app.get('/api/user/:userId/pick-updates', requireAuth, async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      // Ensure user can only access their own updates (or admin)
      if (req.user?.claims?.sub !== userId && !req.user?.isAdmin) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const updates = await enhancedPickGradingService.getUserPickUpdates(userId);
      
      res.json({
        success: true,
        updates,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error getting pick updates:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to get pick updates'
      });
    }
  });

  // Manually grade a specific pick (admin/testing)
  app.post('/api/enhanced-grading/grade-pick/:pickId', requireAuth, async (req: Request, res: Response) => {
    try {
      const pickId = parseInt(req.params.pickId);
      
      if (isNaN(pickId)) {
        return res.status(400).json({ error: 'Invalid pick ID' });
      }

      const result = await enhancedPickGradingService.manualGradePick(pickId);
      
      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          result: result.result,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.message
        });
      }
      
    } catch (error) {
      console.error('Manual grade error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to grade pick manually'
      });
    }
  });

  // Get game statuses for debugging
  app.get('/api/enhanced-grading/game-statuses/:date', requireAuth, async (req: Request, res: Response) => {
    try {
      const { date } = req.params;
      
      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      }

      const gameStatuses = await enhancedPickGradingService.getGameStatuses(date);
      
      res.json({
        success: true,
        date,
        gamesFound: gameStatuses.length,
        games: gameStatuses,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error getting game statuses:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to get game statuses'
      });
    }
  });

  // Test endpoint to create a mock completed game for testing grading
  app.post('/api/enhanced-grading/test-grade', requireAuth, async (req: Request, res: Response) => {
    try {
      // This endpoint can be used for testing grading with mock data
      // For now, just trigger the regular grading
      const result = await enhancedPickGradingService.gradeAllPendingPicks();
      
      res.json({
        success: true,
        message: 'Test grading completed',
        result,
        note: 'This endpoint can be enhanced for specific testing scenarios',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Test grading error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Test grading failed'
      });
    }
  });
}