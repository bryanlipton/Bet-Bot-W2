import type { Express } from "express";
import { db } from "./db";
import { users, userFollows, userPicks } from "@shared/schema";
import { eq, and, or, ilike, ne, sql, desc, inArray } from "drizzle-orm";
import { isAuthenticated } from "./auth";

export function registerFriendsRoutes(app: Express) {
  // Check username availability
  app.get('/api/users/check-username', isAuthenticated, async (req, res) => {
    try {
      const { username } = req.query;
      
      if (!username || typeof username !== 'string') {
        return res.status(400).json({ message: 'Username is required' });
      }
      
      // Check if username exists
      const existingUser = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, username))
        .limit(1);
      
      res.json({ available: existingUser.length === 0 });
    } catch (error) {
      console.error('Error checking username:', error);
      res.status(500).json({ message: 'Failed to check username availability' });
    }
  });

  // Search for users
  app.get('/api/users/search', isAuthenticated, async (req, res) => {
    try {
      const currentUserId = req.user?.claims?.sub;
      const searchQuery = req.query.q as string;
      
      if (!searchQuery || searchQuery.length < 2) {
        return res.json([]);
      }
      
      // Search users by username, firstName, or lastName
      const searchResults = await db
        .select({
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          bio: users.bio,
          followers: users.followers,
          following: users.following,
        })
        .from(users)
        .where(
          and(
            ne(users.id, currentUserId), // Exclude current user
            or(
              ilike(users.username, `%${searchQuery}%`),
              ilike(users.firstName, `%${searchQuery}%`),
              ilike(users.lastName, `%${searchQuery}%`)
            )
          )
        )
        .limit(10);
      
      res.json(searchResults);
    } catch (error) {
      console.error('Error searching users:', error);
      res.status(500).json({ message: 'Failed to search users' });
    }
  });

  // Follow a user
  app.post('/api/users/follow', isAuthenticated, async (req, res) => {
    try {
      const currentUserId = req.user?.claims?.sub;
      const { userId } = req.body;
      
      if (!userId || userId === currentUserId) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      // Check if already following
      const existingFollow = await db
        .select()
        .from(userFollows)
        .where(
          and(
            eq(userFollows.followerId, currentUserId),
            eq(userFollows.followingId, userId)
          )
        );
      
      if (existingFollow.length > 0) {
        return res.status(400).json({ message: 'Already following this user' });
      }
      
      // Create follow relationship
      await db.insert(userFollows).values({
        followerId: currentUserId,
        followingId: userId,
      });
      
      // Update follower/following counts
      await db
        .update(users)
        .set({ following: sql`following + 1` })
        .where(eq(users.id, currentUserId));
      
      await db
        .update(users)
        .set({ followers: sql`followers + 1` })
        .where(eq(users.id, userId));
      
      res.json({ message: 'Successfully followed user' });
    } catch (error) {
      console.error('Error following user:', error);
      res.status(500).json({ message: 'Failed to follow user' });
    }
  });

  // Unfollow a user
  app.delete('/api/users/follow', isAuthenticated, async (req, res) => {
    try {
      const currentUserId = req.user?.claims?.sub;
      const { userId } = req.body;
      
      if (!userId || userId === currentUserId) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      // Remove follow relationship
      const deleted = await db
        .delete(userFollows)
        .where(
          and(
            eq(userFollows.followerId, currentUserId),
            eq(userFollows.followingId, userId)
          )
        );
      
      if (deleted.count === 0) {
        return res.status(400).json({ message: 'Not following this user' });
      }
      
      // Update follower/following counts
      await db
        .update(users)
        .set({ following: sql`following - 1` })
        .where(eq(users.id, currentUserId));
      
      await db
        .update(users)
        .set({ followers: sql`followers - 1` })
        .where(eq(users.id, userId));
      
      res.json({ message: 'Successfully unfollowed user' });
    } catch (error) {
      console.error('Error unfollowing user:', error);
      res.status(500).json({ message: 'Failed to unfollow user' });
    }
  });

  // Get user's followers
  app.get('/api/users/:userId/followers', isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      
      const followers = await db
        .select({
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          bio: users.bio,
        })
        .from(userFollows)
        .innerJoin(users, eq(userFollows.followerId, users.id))
        .where(eq(userFollows.followingId, userId));
      
      res.json(followers);
    } catch (error) {
      console.error('Error fetching followers:', error);
      res.status(500).json({ message: 'Failed to fetch followers' });
    }
  });

  // Get users that a user is following
  app.get('/api/users/:userId/following', isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      
      const following = await db
        .select({
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          bio: users.bio,
        })
        .from(userFollows)
        .innerJoin(users, eq(userFollows.followingId, users.id))
        .where(eq(userFollows.followerId, userId));
      
      res.json(following);
    } catch (error) {
      console.error('Error fetching following:', error);
      res.status(500).json({ message: 'Failed to fetch following' });
    }
  });

  // Get social feed (picks from users you follow + your own picks)
  app.get('/api/users/feed', isAuthenticated, async (req, res) => {
    try {
      const currentUserId = req.user?.claims?.sub;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      
      // Get list of users the current user is following
      const followingUsers = await db
        .select({ userId: userFollows.followingId })
        .from(userFollows)
        .where(eq(userFollows.followerId, currentUserId));
      
      // Include followed users + current user
      const followingIds = followingUsers.map(f => f.userId);
      const allUserIds = [...followingIds, currentUserId];
      
      if (allUserIds.length === 0) {
        return res.json([]);
      }
      
      // Get picks from followed users + own picks (show by default unless isPublic is explicitly false)
      const feedPicks = await db
        .select({
          id: userPicks.id,
          userId: userPicks.userId,
          username: users.username,
          userAvatar: users.profileImageUrl,
          game: userPicks.game,
          selection: userPicks.selection,
          market: userPicks.market,
          line: userPicks.line,
          odds: userPicks.odds,
          units: userPicks.units,
          bookmakerDisplayName: userPicks.bookmakerDisplayName,
          status: userPicks.status,
          winAmount: userPicks.winAmount,
          createdAt: userPicks.createdAt,
          gameDate: userPicks.gameDate,
          gradedAt: userPicks.gradedAt,
        })
        .from(userPicks)
        .innerJoin(users, eq(userPicks.userId, users.id))
        .where(and(
          inArray(userPicks.userId, allUserIds),
          or(
            eq(userPicks.isPublic, true), // Show if explicitly set to true
            sql`${userPicks.isPublic} IS NULL` // Show if not set (default behavior - should appear in feed)
          )
        ))
        .orderBy(desc(userPicks.createdAt))
        .limit(limit)
        .offset(offset);
      
      res.json(feedPicks);
    } catch (error) {
      console.error('Error fetching social feed:', error);
      res.status(500).json({ message: 'Failed to fetch social feed' });
    }
  });
}