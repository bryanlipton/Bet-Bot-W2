import type { Express } from "express";
import { storage } from "./storage";
import { isAuthenticated } from "./auth";
import { z } from "zod";
import { insertUserPickSchema, insertUserPreferencesSchema } from "@shared/schema";

export function registerUserPicksRoutes(app: Express) {
  // Get user picks with pagination
  app.get('/api/user/picks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const picks = await storage.getUserPicks(userId, limit, offset);
      res.json(picks);
    } catch (error) {
      console.error("Error fetching user picks:", error);
      res.status(500).json({ message: "Failed to fetch picks" });
    }
  });

  // Get user picks by status
  app.get('/api/user/picks/status/:status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { status } = req.params;
      
      const picks = await storage.getUserPicksByStatus(userId, status);
      res.json(picks);
    } catch (error) {
      console.error("Error fetching picks by status:", error);
      res.status(500).json({ message: "Failed to fetch picks" });
    }
  });

  // Create a new user pick
  app.post('/api/user/picks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      console.log('📝 NEW PICK REQUEST - User:', userId);
      console.log('📝 Received pick data:', JSON.stringify(req.body, null, 2));
      
      // Check current pick count for debugging
      const existingPicks = await storage.getUserPicks(userId);
      console.log(`📊 User ${userId} currently has ${existingPicks.length} picks`);
      
      // Transform and validate request body
      const pickData = {
        userId,
        gameId: req.body.gameId?.toString() || `mlb_${Date.now()}`, // Convert to string
        homeTeam: req.body.homeTeam,
        awayTeam: req.body.awayTeam,
        selection: req.body.selection,
        game: req.body.game,
        market: req.body.market,
        line: req.body.line?.toString() || null, // Convert to string
        odds: req.body.odds || 0,
        units: req.body.units || 1,
        betUnitAtTime: req.body.betUnitAtTime || 10,
        bookmaker: req.body.bookmaker || 'manual',
        bookmakerDisplayName: req.body.bookmakerDisplayName || 'Manual Entry',
        gameDate: req.body.gameDate ? new Date(req.body.gameDate.replace('2001', '2025')) : new Date(),
        status: 'pending'
      };
      
      console.log('📝 Transformed pick data:', JSON.stringify(pickData, null, 2));
      
      // Validate with schema
      const validatedData = insertUserPickSchema.parse(pickData);
      console.log('✅ Pick data validated successfully');
      
      const pick = await storage.createUserPick(validatedData);
      console.log('✅ Pick created successfully:', JSON.stringify(pick, null, 2));
      console.log(`🎉 User ${userId} now has ${existingPicks.length + 1} total picks`);
      
      res.json(pick);
    } catch (error) {
      console.error("❌ Error creating user pick:", error);
      if (error instanceof z.ZodError) {
        console.error("❌ Validation errors:", error.errors);
        res.status(400).json({ message: "Invalid pick data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create pick" });
      }
    }
  });

  // Update a user pick (for grading or editing odds)
  app.patch('/api/user/picks/:pickId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { pickId } = req.params;
      
      // Ensure user owns the pick by checking first
      const existingPicks = await storage.getUserPicks(userId);
      const userOwnsPick = existingPicks.some(pick => pick.id.toString() === pickId);
      
      if (!userOwnsPick) {
        return res.status(403).json({ message: "Not authorized to update this pick" });
      }
      
      const updatedPick = await storage.updateUserPick(parseInt(pickId), req.body);
      res.json(updatedPick);
    } catch (error) {
      console.error("Error updating user pick:", error);
      res.status(500).json({ message: "Failed to update pick" });
    }
  });

  // Update odds for a specific pick (for manual editing)
  app.patch('/api/user/picks/:pickId/odds', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { pickId } = req.params;
      const { odds } = req.body;
      
      if (!odds || isNaN(parseFloat(odds))) {
        return res.status(400).json({ message: "Valid odds required" });
      }
      
      // Ensure user owns the pick
      const existingPicks = await storage.getUserPicks(userId);
      const userOwnsPick = existingPicks.some(pick => pick.id.toString() === pickId);
      
      if (!userOwnsPick) {
        return res.status(403).json({ message: "Not authorized to update this pick" });
      }
      
      const updatedPick = await storage.updateUserPick(parseInt(pickId), { odds: parseInt(odds) });
      res.json(updatedPick);
    } catch (error) {
      console.error("Error updating pick odds:", error);
      res.status(500).json({ message: "Failed to update odds" });
    }
  });

  // Update units for a specific pick (for manual editing)
  app.patch('/api/user/picks/:pickId/units', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { pickId } = req.params;
      const { units } = req.body;
      
      if (!units || isNaN(parseFloat(units)) || parseFloat(units) <= 0) {
        return res.status(400).json({ message: "Valid units amount required" });
      }
      
      // Ensure user owns the pick
      const existingPicks = await storage.getUserPicks(userId);
      const userOwnsPick = existingPicks.some(pick => pick.id.toString() === pickId);
      
      if (!userOwnsPick) {
        return res.status(403).json({ message: "Not authorized to update this pick" });
      }
      
      const updatedPick = await storage.updateUserPick(parseInt(pickId), { units: parseFloat(units) });
      res.json(updatedPick);
    } catch (error) {
      console.error("Error updating pick units:", error);
      res.status(500).json({ message: "Failed to update units" });
    }
  });

  // Update pick visibility settings (single "Make Bet Public" toggle)
  app.patch('/api/user/picks/:pickId/visibility', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { pickId } = req.params;
      const { isPublic } = req.body;
      
      // Check if this is a sample pick (simple string ID) or database pick (integer or uuid-style ID)
      // Only treat very simple IDs as sample picks (like "blue_jays_ml"), not uuid-style IDs
      const isSimpleSampleId = /^[a-z_]+$/.test(pickId) && pickId.length < 20;
      
      if (isSimpleSampleId) {
        // Sample picks (like "blue_jays_ml", "orioles_mets_parlay") exist only in frontend
        console.log(`Sample pick ${pickId} visibility update - frontend only`);
        return res.json({ success: true, message: "Sample pick visibility updated (frontend only)" });
      }
      
      // Handle both database picks and sample picks that might not exist in user's picks
      try {
        // First try to update directly in case it's a valid user pick
        const actualPickId = isNaN(parseInt(pickId)) ? pickId : parseInt(pickId);
        const updatedPick = await storage.updatePickVisibility(userId, actualPickId, { 
          showOnProfile: isPublic 
        });
        
        if (updatedPick) {
          return res.json({ success: true, pick: updatedPick });
        }
        
        // If no pick was updated, treat as sample pick
        console.log(`No pick found or not owned by user ${userId}, treating as sample pick: ${pickId}`);
        return res.json({ success: true, message: "Sample pick visibility updated (frontend only)" });
      } catch (error) {
        console.error("Error updating pick visibility:", error);
        return res.json({ success: true, message: "Sample pick visibility updated (frontend only)" });
      }
    } catch (error) {
      console.error("Error updating pick visibility:", error);
      res.status(500).json({ message: "Failed to update pick visibility" });
    }
  });

  // Delete a user pick
  app.delete('/api/user/picks/:pickId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { pickId } = req.params;
      
      // Check if this is a sample pick (string ID) or database pick (integer ID)
      const isStringId = isNaN(parseInt(pickId));
      
      if (isStringId) {
        // Sample picks (like "blue_jays_ml", "orioles_mets_parlay") exist only in frontend
        console.log(`Sample pick ${pickId} delete request - frontend only`);
        return res.json({ message: "Sample pick deleted (frontend only)" });
      }
      
      // For database picks, ensure user owns the pick
      const existingPicks = await storage.getUserPicks(userId);
      const numericPickId = parseInt(pickId);
      const userOwnsPick = existingPicks.some(pick => pick.id === numericPickId);
      
      if (!userOwnsPick) {
        return res.status(403).json({ message: "Not authorized to delete this pick" });
      }
      
      await storage.deleteUserPick(userId, numericPickId);
      res.json({ message: "Pick deleted successfully" });
    } catch (error) {
      console.error("Error deleting user pick:", error);
      res.status(500).json({ message: "Failed to delete pick" });
    }
  });

  // Get user pick statistics
  app.get('/api/user/picks/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getUserPickStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching pick stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Get user preferences (including bet unit)
  app.get('/api/user/preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let preferences = await storage.getUserPreferences(userId);
      
      // Create default preferences if none exist
      if (!preferences) {
        preferences = await storage.upsertUserPreferences({
          userId,
          betUnit: 50, // Default $50 unit
          currency: 'USD',
        });
      }
      
      res.json(preferences);
    } catch (error) {
      console.error("Error fetching user preferences:", error);
      res.status(500).json({ message: "Failed to fetch preferences" });
    }
  });

  // Update user preferences
  app.put('/api/user/preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      console.log('Updating preferences for user:', userId);
      console.log('Request body:', req.body);
      
      const preferencesData = insertUserPreferencesSchema.parse({
        ...req.body,
        userId,
      });
      
      console.log('Parsed preferences data:', preferencesData);
      
      const preferences = await storage.upsertUserPreferences(preferencesData);
      console.log('Updated preferences:', preferences);
      res.json(preferences);
    } catch (error) {
      console.error("Error updating user preferences:", error);
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        res.status(400).json({ message: "Invalid preferences data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update preferences", error: error.message });
      }
    }
  });

  // Sync picks from localStorage to database
  app.post('/api/user/picks/sync', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { picks } = req.body;
      
      if (!Array.isArray(picks)) {
        return res.status(400).json({ message: "Picks must be an array" });
      }
      
      const syncedPicks = [];
      
      for (const pick of picks) {
        try {
          const pickData = insertUserPickSchema.parse({
            ...pick,
            userId,
          });
          
          const syncedPick = await storage.createUserPick(pickData);
          syncedPicks.push(syncedPick);
        } catch (error) {
          console.error("Error syncing individual pick:", error);
          // Continue with other picks even if one fails
        }
      }
      
      res.json({ 
        message: `Synced ${syncedPicks.length} picks successfully`,
        syncedPicks 
      });
    } catch (error) {
      console.error("Error syncing picks:", error);
      res.status(500).json({ message: "Failed to sync picks" });
    }
  });
}