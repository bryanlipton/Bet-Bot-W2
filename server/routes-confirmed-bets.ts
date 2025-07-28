import express from 'express';
import { eq, and, desc } from 'drizzle-orm';
import { db } from './db';
import { confirmedBets, type InsertConfirmedBet } from '@shared/schema';
import { insertConfirmedBetSchema } from '@shared/schema';

const router = express.Router();

// Get all confirmed bets for a user
router.get('/api/user/confirmed-bets', async (req, res) => {
  try {
    const userId = (req.session as any)?.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userConfirmedBets = await db
      .select()
      .from(confirmedBets)
      .where(eq(confirmedBets.userId, userId))
      .orderBy(desc(confirmedBets.confirmedAt));

    res.json(userConfirmedBets);
  } catch (error) {
    console.error('Error fetching confirmed bets:', error);
    res.status(500).json({ error: 'Failed to fetch confirmed bets' });
  }
});

// Get public confirmed bets for a user (for profile display)
router.get('/api/users/:userId/confirmed-bets/public', async (req, res) => {
  try {
    const { userId } = req.params;

    const publicConfirmedBets = await db
      .select()
      .from(confirmedBets)
      .where(
        and(
          eq(confirmedBets.userId, userId),
          eq(confirmedBets.isPublic, true)
        )
      )
      .orderBy(desc(confirmedBets.confirmedAt));

    res.json(publicConfirmedBets);
  } catch (error) {
    console.error('Error fetching public confirmed bets:', error);
    res.status(500).json({ error: 'Failed to fetch public confirmed bets' });
  }
});

// Create a new confirmed bet
router.post('/api/user/confirmed-bets', async (req, res) => {
  try {
    const userId = (req.session as any)?.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Validate request body
    const validatedData = insertConfirmedBetSchema.parse({
      ...req.body,
      userId
    });

    // Calculate dollar amount
    const dollarAmount = validatedData.units * validatedData.betUnitAtTime;

    const confirmedBet = await db
      .insert(confirmedBets)
      .values({
        ...validatedData,
        dollarAmount: dollarAmount.toString()
      })
      .returning();

    res.json(confirmedBet[0]);
  } catch (error) {
    console.error('Error creating confirmed bet:', error);
    res.status(500).json({ error: 'Failed to create confirmed bet' });
  }
});

// Update confirmed bet visibility
router.patch('/api/user/confirmed-bets/:id/visibility', async (req, res) => {
  try {
    const userId = (req.session as any)?.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;
    const { isPublic } = req.body;

    const updatedBet = await db
      .update(confirmedBets)
      .set({ isPublic })
      .where(
        and(
          eq(confirmedBets.id, parseInt(id)),
          eq(confirmedBets.userId, userId)
        )
      )
      .returning();

    if (updatedBet.length === 0) {
      return res.status(404).json({ error: 'Confirmed bet not found' });
    }

    res.json(updatedBet[0]);
  } catch (error) {
    console.error('Error updating confirmed bet visibility:', error);
    res.status(500).json({ error: 'Failed to update confirmed bet visibility' });
  }
});

// Delete confirmed bet
router.delete('/api/user/confirmed-bets/:id', async (req, res) => {
  try {
    const userId = (req.session as any)?.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;

    const deletedBet = await db
      .delete(confirmedBets)
      .where(
        and(
          eq(confirmedBets.id, parseInt(id)),
          eq(confirmedBets.userId, userId)
        )
      )
      .returning();

    if (deletedBet.length === 0) {
      return res.status(404).json({ error: 'Confirmed bet not found' });
    }

    res.json({ message: 'Confirmed bet deleted successfully' });
  } catch (error) {
    console.error('Error deleting confirmed bet:', error);
    res.status(500).json({ error: 'Failed to delete confirmed bet' });
  }
});

export default router;