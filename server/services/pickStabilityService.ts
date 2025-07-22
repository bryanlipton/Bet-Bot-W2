/**
 * Pick Stability Service - Prevents picks from changing unexpectedly
 * Ensures UI stability and consistent user experience
 */

import { db } from '../db';
import { dailyPicks, loggedInLockPicks } from '../../shared/schema';
import { eq, gte, desc } from 'drizzle-orm';

export interface PickStabilityConfig {
  minTimeBeforeChange: number; // Minimum time before pick can change (minutes)
  gameStartBufferTime: number; // Buffer before game starts to lock pick (minutes)
  maxChangesPerDay: number; // Maximum pick changes allowed per day
  requireConfidenceImprovement: number; // Minimum confidence improvement to justify change
}

export class PickStabilityService {
  private config: PickStabilityConfig = {
    minTimeBeforeChange: 60, // 1 hour minimum between changes
    gameStartBufferTime: 30, // Lock pick 30 minutes before game
    maxChangesPerDay: 2, // Maximum 2 changes per day
    requireConfidenceImprovement: 10 // Need 10+ point confidence improvement
  };

  /**
   * Check if daily pick can be safely updated
   */
  async canUpdateDailyPick(newPick: any): Promise<{ canUpdate: boolean; reason?: string }> {
    try {
      // Get current daily pick
      const today = new Date().toISOString().split('T')[0];
      const currentPicks = await db
        .select()
        .from(dailyPicks)
        .where(eq(dailyPicks.pickDate, new Date(today)))
        .orderBy(desc(dailyPicks.createdAt))
        .limit(1);

      if (currentPicks.length === 0) {
        return { canUpdate: true }; // No existing pick, safe to create
      }

      const currentPick = currentPicks[0];
      
      // Check if game is starting soon
      const gameTime = new Date(currentPick.gameTime);
      const now = new Date();
      const minutesUntilGame = (gameTime.getTime() - now.getTime()) / (1000 * 60);

      if (minutesUntilGame <= this.config.gameStartBufferTime) {
        return { 
          canUpdate: false, 
          reason: `Pick locked - game starts in ${Math.round(minutesUntilGame)} minutes` 
        };
      }

      // Check minimum time between changes
      const lastUpdate = new Date(currentPick.createdAt);
      const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);

      if (minutesSinceUpdate < this.config.minTimeBeforeChange) {
        return { 
          canUpdate: false, 
          reason: `Pick was updated ${Math.round(minutesSinceUpdate)} minutes ago. Wait ${Math.round(this.config.minTimeBeforeChange - minutesSinceUpdate)} more minutes.` 
        };
      }

      // Check daily change limit
      const todayChanges = await this.getDailyChangeCount(today, 'daily');
      if (todayChanges >= this.config.maxChangesPerDay) {
        return { 
          canUpdate: false, 
          reason: `Daily limit reached - ${todayChanges} changes already made today` 
        };
      }

      // Check confidence improvement requirement
      if (newPick.confidence && currentPick.confidence) {
        const confidenceImprovement = newPick.confidence - currentPick.confidence;
        if (confidenceImprovement < this.config.requireConfidenceImprovement) {
          return { 
            canUpdate: false, 
            reason: `Insufficient confidence improvement - need +${this.config.requireConfidenceImprovement}, got +${Math.round(confidenceImprovement)}` 
          };
        }
      }

      return { canUpdate: true };

    } catch (error) {
      console.error('❌ Error checking daily pick stability:', error);
      return { canUpdate: false, reason: 'Stability check failed' };
    }
  }

  /**
   * Check if lock pick can be safely updated
   */
  async canUpdateLockPick(newPick: any): Promise<{ canUpdate: boolean; reason?: string }> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const currentPicks = await db
        .select()
        .from(loggedInLockPicks)
        .where(eq(loggedInLockPicks.pickDate, today))
        .orderBy(desc(loggedInLockPicks.createdAt))
        .limit(1);

      if (currentPicks.length === 0) {
        return { canUpdate: true };
      }

      const currentPick = currentPicks[0];

      // Apply same stability checks as daily pick
      const gameTime = new Date(currentPick.gameTime);
      const now = new Date();
      const minutesUntilGame = (gameTime.getTime() - now.getTime()) / (1000 * 60);

      if (minutesUntilGame <= this.config.gameStartBufferTime) {
        return { 
          canUpdate: false, 
          reason: `Lock pick secured - game starts in ${Math.round(minutesUntilGame)} minutes` 
        };
      }

      const lastUpdate = new Date(currentPick.createdAt);
      const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);

      if (minutesSinceUpdate < this.config.minTimeBeforeChange) {
        return { 
          canUpdate: false, 
          reason: `Lock pick updated ${Math.round(minutesSinceUpdate)} minutes ago. Locked for ${Math.round(this.config.minTimeBeforeChange - minutesSinceUpdate)} more minutes.` 
        };
      }

      const todayChanges = await this.getDailyChangeCount(today, 'lock');
      if (todayChanges >= this.config.maxChangesPerDay) {
        return { 
          canUpdate: false, 
          reason: `Lock pick limit reached - ${todayChanges} changes today` 
        };
      }

      return { canUpdate: true };

    } catch (error) {
      console.error('❌ Error checking lock pick stability:', error);
      return { canUpdate: false, reason: 'Stability check failed' };
    }
  }

  /**
   * Get number of changes made today for a pick type
   */
  private async getDailyChangeCount(date: string, pickType: 'daily' | 'lock'): Promise<number> {
    try {
      if (pickType === 'daily') {
        const picks = await db
          .select()
          .from(dailyPicks)
          .where(eq(dailyPicks.pickDate, date));
        return Math.max(0, picks.length - 1); // Subtract 1 for initial creation
      } else {
        const picks = await db
          .select()
          .from(loggedInLockPicks)
          .where(eq(loggedInLockPicks.pickDate, date));
        return Math.max(0, picks.length - 1);
      }
    } catch (error) {
      console.error('❌ Error counting daily changes:', error);
      return 0;
    }
  }

  /**
   * Log pick change for audit trail
   */
  async logPickChange(pickType: 'daily' | 'lock', oldPick: any, newPick: any, reason: string): Promise<void> {
    try {
      const changeLog = {
        timestamp: new Date().toISOString(),
        pickType,
        oldTeam: oldPick?.pickTeam,
        newTeam: newPick?.pickTeam,
        oldConfidence: oldPick?.confidence,
        newConfidence: newPick?.confidence,
        reason,
        approved: true
      };

      console.log(`📝 Pick Change Log:`, changeLog);
      // Could store in database if needed for audit trail

    } catch (error) {
      console.error('❌ Error logging pick change:', error);
    }
  }

  /**
   * Check if it's safe to refetch pick data
   */
  shouldAllowPickRefetch(pickType: 'daily' | 'lock', lastFetch?: Date): boolean {
    if (!lastFetch) return true;

    const now = new Date();
    const minutesSinceLastFetch = (now.getTime() - lastFetch.getTime()) / (1000 * 60);

    // Allow refetch only every 30 minutes to prevent UI instability
    const minRefetchInterval = 30;
    
    if (minutesSinceLastFetch < minRefetchInterval) {
      console.log(`🚫 ${pickType} pick refetch blocked - last fetch ${Math.round(minutesSinceLastFetch)} minutes ago`);
      return false;
    }

    return true;
  }

  /**
   * Generate stability report
   */
  async generateStabilityReport(): Promise<{
    dailyPickStability: string;
    lockPickStability: string;
    recommendations: string[];
  }> {
    const today = new Date().toISOString().split('T')[0];
    const dailyChanges = await this.getDailyChangeCount(today, 'daily');
    const lockChanges = await this.getDailyChangeCount(today, 'lock');

    const recommendations: string[] = [];

    if (dailyChanges > 1) {
      recommendations.push('Daily pick changed multiple times - consider increasing confidence thresholds');
    }

    if (lockChanges > 1) {
      recommendations.push('Lock pick changed multiple times - review stability settings');
    }

    return {
      dailyPickStability: `${dailyChanges} changes today (max: ${this.config.maxChangesPerDay})`,
      lockPickStability: `${lockChanges} changes today (max: ${this.config.maxChangesPerDay})`,
      recommendations
    };
  }
}

export const pickStabilityService = new PickStabilityService();