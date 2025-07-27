import type { Express } from "express";
import { storage } from "./storage";
import { isAuthenticated } from "./devAuth";
import { z } from "zod";

// Profile update schema
const updateProfileSchema = z.object({
  username: z.string().optional(),
  bio: z.string().optional(),
  profileImageUrl: z.string().optional(),
  avatar: z.string().optional(), // Emoji avatar selection
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

  // Get user profile by ID (for viewing other users' profiles) - PUBLIC ENDPOINT
  app.get('/api/profile/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user is authenticated and is the owner (optional authentication)
      const userIsAuthenticated = req.user && (req.user as any).claims && (req.user as any).claims.sub;
      const isOwner = userIsAuthenticated && (req.user as any)?.claims?.sub === userId;
      
      // For now, allow all profiles to be viewable for Instagram-style functionality
      // We can add privacy settings later if needed

      // Calculate actual stats from user's picks
      const stats = await storage.getUserPickStats(userId);
      
      // Calculate win rate
      const totalSettledPicks = stats.winCount + stats.lossCount + stats.pushCount;
      const winRate = totalSettledPicks > 0 ? (stats.winCount / totalSettledPicks) * 100 : 0;
      
      // Calculate win streak (we'll need the picks to determine this)
      const userPicks = await storage.getUserPicks(userId);
      const sortedPicks = userPicks
        .filter(pick => pick.status === 'win' || pick.status === 'loss')
        .sort((a, b) => new Date(b.createdAt || new Date()).getTime() - new Date(a.createdAt || new Date()).getTime());
      
      let winStreak = 0;
      for (const pick of sortedPicks) {
        if (pick.status === 'win') {
          winStreak++;
        } else {
          break;
        }
      }

      // Filter stats based on privacy settings - only show if user has enabled public display
      const filteredStats: any = {};
      
      // Only include stats if the user has made them public
      if (user.totalPicksPublic !== false) { // Default to true if not set
        filteredStats.totalPicks = stats.totalPicks;
      }
      
      if (user.pendingPicksPublic !== false) { // Default to true if not set
        filteredStats.pendingPicks = stats.pendingPicks;
      }
      
      if (user.winRatePublic !== false) { // Default to true if not set
        filteredStats.winRate = winRate;
        filteredStats.record = `${stats.winCount}-${stats.lossCount}`;
      }
      
      if (user.winStreakPublic !== false) { // Default to true if not set
        filteredStats.winStreak = winStreak;
      }

      // Filter out sensitive data based on privacy settings
      const publicProfile = {
        id: user.id,
        username: user.username || user.firstName,
        profileImageUrl: user.profileImageUrl,
        avatar: user.avatar, // Include emoji avatar
        bio: user.bio,
        followers: user.followers || 0,
        following: user.following || 0,
        createdAt: user.createdAt,
        // Include only public stats
        stats: filteredStats,
        // Privacy settings for frontend to know what's visible
        privacySettings: {
          totalPicksPublic: user.totalPicksPublic !== false,
          pendingPicksPublic: user.pendingPicksPublic !== false,
          winRatePublic: user.winRatePublic !== false,
          winStreakPublic: user.winStreakPublic !== false
        }
      };

      res.json(publicProfile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Alias for the users endpoint to match frontend expectations
  app.get('/api/users/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Calculate actual stats from user's picks
      const stats = await storage.getUserPickStats(userId);
      
      // Calculate win rate
      const totalSettledPicks = stats.winCount + stats.lossCount + stats.pushCount;
      const winRate = totalSettledPicks > 0 ? (stats.winCount / totalSettledPicks) * 100 : 0;
      
      // Calculate win streak (we'll need the picks to determine this)
      const userPicks = await storage.getUserPicks(userId);
      const sortedPicks = userPicks
        .filter(pick => pick.status === 'win' || pick.status === 'loss')
        .sort((a, b) => new Date(b.createdAt || new Date()).getTime() - new Date(a.createdAt || new Date()).getTime());
      
      let winStreak = 0;
      for (const pick of sortedPicks) {
        if (pick.status === 'win') {
          winStreak++;
        } else {
          break;
        }
      }

      // Filter stats based on privacy settings for /api/users/:userId endpoint
      const filteredUserStats: any = {};
      
      // Only include stats if the user has made them public
      if (user.totalPicksPublic !== false) { // Default to true if not set
        filteredUserStats.totalPicks = stats.totalPicks;
      }
      
      if (user.pendingPicksPublic !== false) { // Default to true if not set
        filteredUserStats.pendingPicks = stats.pendingPicks;
      }
      
      if (user.winRatePublic !== false) { // Default to true if not set
        filteredUserStats.winRate = winRate;
        filteredUserStats.record = `${stats.winCount}-${stats.lossCount}`;
      }
      
      if (user.winStreakPublic !== false) { // Default to true if not set
        filteredUserStats.winStreak = winStreak;
      }

      // Return public profile data that matches frontend expectations
      const publicProfile = {
        id: user.id,
        username: user.username || user.firstName,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        avatar: user.avatar,
        bio: user.bio,
        followers: user.followers || 0,
        following: user.following || 0,
        // Only include stats that are public
        totalPicks: filteredUserStats.totalPicks,
        winRate: filteredUserStats.winRate,
        totalUnits: stats.totalUnits || 0,
        joinDate: user.createdAt,
        // Privacy settings for frontend reference
        totalPicksPublic: user.totalPicksPublic ?? true,
        pendingPicksPublic: user.pendingPicksPublic ?? true,
        winRatePublic: user.winRatePublic ?? true,
        winStreakPublic: user.winStreakPublic ?? true,
        // Grouped stats object
        stats: filteredUserStats,
        // Privacy settings for frontend to know what's visible
        privacySettings: {
          totalPicksPublic: user.totalPicksPublic !== false,
          pendingPicksPublic: user.pendingPicksPublic !== false,
          winRatePublic: user.winRatePublic !== false,
          winStreakPublic: user.winStreakPublic !== false
        }
      };

      res.json(publicProfile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ message: 'Failed to fetch user profile' });
    }
  });

  // User feed endpoint to match frontend expectations
  app.get('/api/users/:userId/feed', async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Get user's public picks as feed items
      const publicPicks = await storage.getUserPublicPicks(userId);
      
      const feedItems = publicPicks.map((pick: any) => ({
        id: pick.id,
        type: pick.status === 'win' || pick.status === 'loss' ? pick.status : 'pick',
        pick: {
          id: pick.id,
          selection: pick.selection,
          game: pick.game,
          market: pick.market,
          odds: pick.odds,
          units: pick.units,
          result: pick.result
        },
        timestamp: pick.createdAt,
        status: pick.status,
        result: pick.status === 'win' ? 'win' : pick.status === 'loss' ? 'loss' : undefined
      }));
      
      res.json(feedItems);
    } catch (error) {
      console.error('Error fetching user feed:', error);
      res.status(500).json({ message: 'Failed to fetch user feed' });
    }
  });

  // Get user's public picks feed - PUBLIC ENDPOINT
  app.get('/api/public-feed/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Check if current user is viewing their own profile
      const isAuthenticated = req.isAuthenticated && req.isAuthenticated();
      const isOwner = isAuthenticated && (req.user as any)?.claims?.sub === userId;
      
      // Get user's picks - if owner, get ALL picks; if follower, get only public picks
      const picks = isOwner ? 
        await storage.getUserPicks(userId) : 
        await storage.getUserPicksPublicFeed(userId);
      
      // Format picks for public feed with complete structure
      const feedItems = picks.map(pick => {
        // Parse team names from the game string format "Team A @ Team B"
        let awayTeam = '';
        let homeTeam = '';
        if (pick.game && pick.game.includes(' @ ')) {
          const teams = pick.game.split(' @ ');
          awayTeam = teams[0]?.trim() || '';
          homeTeam = teams[1]?.trim() || '';
        }
        
        return {
          id: pick.id,
          type: 'pick',
          pick: {
            gameInfo: {
              awayTeam: pick.awayTeam || awayTeam,
              homeTeam: pick.homeTeam || homeTeam,
              game: pick.game || `${pick.awayTeam} @ ${pick.homeTeam}`,
              gameTime: pick.gameDate,
              sport: 'baseball_mlb'
            },
            betInfo: {
              market: pick.market,
              selection: pick.selection,
              line: pick.line,
              odds: pick.odds,
              units: pick.units,
              parlayLegs: pick.parlayLegs ? JSON.parse(pick.parlayLegs as string) : null
            },
            bookmaker: {
              key: pick.bookmaker,
              displayName: pick.bookmakerDisplayName
            },
            showOnProfile: (pick as any).showOnProfile,
            showOnFeed: (pick as any).showOnFeed,
            status: pick.status
          },
          timestamp: pick.createdAt,
          result: pick.status === 'win' ? 'win' : pick.status === 'loss' ? 'loss' : undefined
        };
      });
      
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
      const currentUserId = (req.user as any)?.claims?.sub;
      
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