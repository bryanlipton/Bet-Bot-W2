import express from 'express';
import { db } from './db';
import { users, userPicks, insertUserPickSchema } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const router = express.Router();

// Get user preferences (including bet unit)
router.get('/preferences', async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const [user] = await db.select().from(users).where(eq(users.id, req.user.id));
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      betUnit: user.betUnit ? parseFloat(user.betUnit) : 10.00
    });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user bet unit
router.put('/bet-unit', async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const betUnitSchema = z.object({
      betUnit: z.number().min(0.01).max(10000)
    });

    const { betUnit } = betUnitSchema.parse(req.body);

    await db
      .update(users)
      .set({ 
        betUnit: betUnit.toString(),
        updatedAt: new Date()
      })
      .where(eq(users.id, req.user.id));

    res.json({ success: true, betUnit });
  } catch (error) {
    console.error('Error updating bet unit:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid bet unit value' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// NOTE: User picks routes are now handled by routes-user-picks.ts
// This file only handles user preferences (bet unit, etc.)

export default router;