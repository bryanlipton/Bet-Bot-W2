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

// Get user picks
router.get('/picks', async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const picks = await db
      .select()
      .from(userPicks)
      .where(eq(userPicks.userId, req.user.id))
      .orderBy(userPicks.createdAt);

    res.json(picks);
  } catch (error) {
    console.error('Error fetching user picks:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Save a new pick
router.post('/picks', async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const pickData = insertUserPickSchema.parse({
      ...req.body,
      userId: req.user.id
    });

    const [newPick] = await db
      .insert(userPicks)
      .values(pickData)
      .returning();

    res.status(201).json(newPick);
  } catch (error) {
    console.error('Error saving pick:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid pick data', errors: error.errors });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update pick odds
router.put('/picks/:id/odds', async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;
    const { odds } = req.body;

    if (!odds || isNaN(Number(odds))) {
      return res.status(400).json({ message: 'Invalid odds value' });
    }

    const [updatedPick] = await db
      .update(userPicks)
      .set({ 
        odds: odds.toString(),
        updatedAt: new Date()
      })
      .where(eq(userPicks.id, parseInt(id)))
      .returning();

    if (!updatedPick) {
      return res.status(404).json({ message: 'Pick not found' });
    }

    res.json(updatedPick);
  } catch (error) {
    console.error('Error updating pick odds:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete a pick
router.delete('/picks/:id', async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;

    const [deletedPick] = await db
      .delete(userPicks)
      .where(eq(userPicks.id, parseInt(id)))
      .returning();

    if (!deletedPick) {
      return res.status(404).json({ message: 'Pick not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting pick:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;