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
      const userId = req.user.claims.sub;
      const updateData = updateProfileSchema.parse(req.body);
      
      // Update the user profile
      const updatedUser = await storage.updateUserProfile(userId, updateData);
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
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
      
      if (!user.profilePublic && !isOwner) {
        return res.status(403).json({ message: "Profile is private" });
      }

      // Filter out sensitive data based on privacy settings
      const publicProfile = {
        id: user.id,
        username: user.username,
        profileImageUrl: user.profileImageUrl,
        bio: user.bio,
        followers: user.followers,
        following: user.following,
        createdAt: user.createdAt,
        // Only include stats if they're public or user is the owner
        stats: {
          totalPicks: (user.totalPicksPublic || isOwner) ? user.totalPicks : null,
          pendingPicks: (user.pendingPicksPublic || isOwner) ? user.pendingPicks : null,
          winRate: (user.winRatePublic || isOwner) ? user.winRate : null,
          winStreak: (user.winStreakPublic || isOwner) ? user.winStreak : null,
        }
      };

      res.json(publicProfile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });
}