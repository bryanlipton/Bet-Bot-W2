import type { Express } from "express";
import { storage } from "./storage";
import { isAuthenticated } from "./replitAuth";
import { z } from "zod";

// Profile update schema
const updateProfileSchema = z.object({
  username: z.string().optional(),
  bio: z.string().optional(),
  profileImageUrl: z.string().optional(),
  totalPicksPublic: z.boolean().optional(),
  pendingPicksPublic: z.boolean().optional(),
  winRatePublic: z.boolean().optional(),
  winStreakPublic: z.boolean().optional(),
  profilePublic: z.boolean().optional(),
});

export function registerUserProfileRoutes(app: Express) {
  // Update user profile
  app.patch('/api/user/profile', isAuthenticated, async (req: any, res) => {
    try {
      console.log("Profile update request received");
      console.log("req.isAuthenticated():", req.isAuthenticated());
      console.log("req.user:", req.user);
      console.log("User:", req.user?.claims?.sub);
      console.log("Request body:", req.body);
      
      const userId = req.user.claims.sub;
      const updateData = updateProfileSchema.parse(req.body);
      
      console.log("Parsed update data:", updateData);
      
      // Update the user profile
      const updatedUser = await storage.updateUserProfile(userId, updateData);
      
      console.log("Profile updated successfully:", updatedUser?.id);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update profile" });
      }
    }
  });

  // Get user profile by ID (for viewing other users' profiles)
  app.get('/api/user/profile/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only return public data if profile is not public or not the owner
      const isOwner = req.user?.claims?.sub === userId;
      
      // For now, allow all profiles to be viewable for Instagram-style functionality
      // We can add privacy settings later if needed

      // Filter out sensitive data based on privacy settings
      const publicProfile = {
        id: user.id,
        username: user.username || user.firstName,
        profileImageUrl: user.profileImageUrl,
        bio: user.bio,
        followers: user.followers || 0,
        following: user.following || 0,
        createdAt: user.createdAt,
        // Include basic stats for public viewing
        stats: {
          totalPicks: user.totalPicks || 0,
          pendingPicks: user.pendingPicks || 0,
          winRate: user.winRate || 0,
          winStreak: user.winStreak || 0,
        }
      };

      res.json(publicProfile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Get user's public picks feed
  app.get('/api/user/public-feed/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Get user's public picks (those marked as showOnFeed = true)
      const picks = await storage.getUserPicksPublicFeed(userId);
      
      // Format picks for public feed
      const feedItems = picks.map(pick => ({
        id: pick.id,
        type: 'pick',
        pick: {
          selection: pick.selection,
          game: pick.game,
          market: pick.market,
          odds: pick.odds,
          units: pick.units
        },
        timestamp: pick.createdAt,
        result: pick.status === 'win' ? 'win' : pick.status === 'loss' ? 'loss' : undefined
      }));
      
      res.json(feedItems);
    } catch (error) {
      console.error("Error fetching public feed:", error);
      res.status(500).json({ message: "Failed to fetch public feed" });
    }
  });

  // Check if current user is following a specific user
  app.get('/api/user/follow-status/:userId', isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const currentUserId = req.user?.claims?.sub;
      
      if (!currentUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if current user is following the target user
      const isFollowing = await storage.isUserFollowing(currentUserId, userId);
      
      res.json({ isFollowing });
    } catch (error) {
      console.error("Error checking follow status:", error);
      res.status(500).json({ message: "Failed to check follow status" });
    }
  });
}