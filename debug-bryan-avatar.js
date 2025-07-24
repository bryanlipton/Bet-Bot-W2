#!/usr/bin/env node

/**
 * Debug script to check Bryan's avatar data
 */

import { db } from './server/db.js';
import { users, userPicks } from './shared/schema.js';
import { eq } from 'drizzle-orm';

console.log('🔍 Debugging Bryan\'s avatar issue...');

try {
  // Check Bryan's user data
  console.log('\n1. Checking Bryan\'s user data...');
  const bryanUser = await db
    .select({
      id: users.id,
      username: users.username,
      profileImageUrl: users.profileImageUrl,
      avatar: users.avatar
    })
    .from(users)
    .where(eq(users.username, 'Bryan'))
    .limit(1);

  if (bryanUser.length === 0) {
    console.log('❌ Bryan user not found in database');
  } else {
    console.log('✓ Bryan user found:', bryanUser[0]);
  }

  // Check Bryan's picks
  console.log('\n2. Checking Bryan\'s picks...');
  const bryanPicks = await db
    .select({
      id: userPicks.id,
      userId: userPicks.userId,
      game: userPicks.game,
      selection: userPicks.selection,
      createdAt: userPicks.createdAt
    })
    .from(userPicks)
    .where(eq(userPicks.userId, bryanUser[0]?.id || 'not-found'))
    .limit(5);

  console.log(`✓ Bryan has ${bryanPicks.length} picks`);
  if (bryanPicks.length > 0) {
    console.log('Latest pick:', bryanPicks[0]);
  }

  // Test the API join query
  console.log('\n3. Testing My Feed API query for Bryan...');
  const feedQuery = await db
    .select({
      id: userPicks.id,
      userId: userPicks.userId,
      username: users.username,
      userAvatar: users.profileImageUrl,
      userAvatarEmoji: users.avatar,
      game: userPicks.game,
      selection: userPicks.selection
    })
    .from(userPicks)
    .innerJoin(users, eq(userPicks.userId, users.id))
    .where(eq(userPicks.userId, bryanUser[0]?.id || 'not-found'))
    .limit(1);

  if (feedQuery.length === 0) {
    console.log('❌ No picks found in feed query for Bryan');
  } else {
    console.log('✓ Feed API would return:', feedQuery[0]);
  }

} catch (error) {
  console.error('❌ Error debugging Bryan\'s avatar:', error);
}

console.log('\n🔍 Debug complete');
process.exit(0);