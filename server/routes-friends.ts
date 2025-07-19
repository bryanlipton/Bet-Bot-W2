import type { Express } from "express";
import { db } from "./db";
import { users, userFollows } from "@shared/schema";
import { eq, and, or, ilike, ne, sql } from "drizzle-orm";
import { isAuthenticated } from "./replitAuth";

export function registerFriendsRoutes(app: Express) {
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
}