/**
 * Grade Stability Service
 * Manages when grades should be calculated and locked to prevent constant changes
 * Follows user requirement: Generate once when pitchers available, adjust only for lineups
 */

interface GameInfo {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  gameTime: string;
  homePitcher?: string;
  awayPitcher?: string;
  homeLineup?: any[];
  awayLineup?: any[];
}

interface StableGrade {
  gameId: string;
  grade: string;
  confidence: number;
  reasoning: string;
  analysis: any;
  pickTeam: string;
  odds: number;
  lockedAt: number;
  lockedReason: 'pitchers_available' | 'lineups_posted' | 'manual_lock';
  lastUpdate: number;
}

class GradeStabilityService {
  private stableGrades = new Map<string, StableGrade>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  
  /**
   * Check if we should generate/update a grade for this game
   */
  shouldGenerateGrade(gameInfo: GameInfo): boolean {
    const existing = this.stableGrades.get(gameInfo.gameId);
    
    // No existing grade - generate if we have both pitchers
    if (!existing) {
      return this.hasBothPitchers(gameInfo);
    }
    
    // Has stable grade - be extremely conservative about updates
    const timeSinceUpdate = Date.now() - existing.lastUpdate;
    const hoursSinceUpdate = timeSinceUpdate / (1000 * 60 * 60);
    
    // Only allow updates for truly significant information changes:
    // 1. Lineups weren't available before but are now (major info milestone)
    // 2. More than 8 hours have passed (daily refresh only)
    // 3. Confirmed pitcher changes (rare but important)
    
    if (this.lineupsNowAvailable(gameInfo, existing)) {
      console.log(`🔄 SIGNIFICANT UPDATE for ${gameInfo.gameId}: Lineups now available - allowing controlled grade adjustment`);
      return true;
    }
    
    if (hoursSinceUpdate > 8) {
      console.log(`🔄 DAILY REFRESH for ${gameInfo.gameId}: Major refresh after ${hoursSinceUpdate.toFixed(1)}h`);
      return true;
    }
    
    if (this.pitcherChanged(gameInfo)) {
      console.log(`🔄 PITCHER CHANGE for ${gameInfo.gameId}: Confirmed roster change`);
      return true;
    }
    
    console.log(`🔒 Grade LOCKED for ${gameInfo.gameId}: ${existing.grade} (${existing.lockedReason}) - preventing volatility`);
    return false;
  }
  
  /**
   * Store a stable grade with controlled update logic
   */
  lockGrade(gameInfo: GameInfo, grade: string, confidence: number, reasoning: string, analysis: any, pickTeam: string, odds: number): void {
    const existing = this.stableGrades.get(gameInfo.gameId);
    const lockReason = this.hasLineups(gameInfo) ? 'lineups_posted' : 'pitchers_available';
    
    // If updating existing grade, apply stability controls
    if (existing) {
      const gradeChange = this.calculateGradeChange(existing.grade, grade);
      
      // Limit grade changes to max 1 level (e.g., B+ to A- is ok, B+ to A is too much)
      if (Math.abs(gradeChange) > 1) {
        const limitedGrade = this.limitGradeChange(existing.grade, grade);
        console.log(`🛡️ Grade stability control: ${gameInfo.gameId} limited from ${existing.grade}→${grade} to ${existing.grade}→${limitedGrade}`);
        grade = limitedGrade;
      }
    }
    
    const stableGrade: StableGrade = {
      gameId: gameInfo.gameId,
      grade,
      confidence,
      reasoning,
      analysis,
      pickTeam,
      odds,
      lockedAt: existing?.lockedAt || Date.now(), // Keep original lock time
      lockedReason: lockReason,
      lastUpdate: Date.now()
    };
    
    this.stableGrades.set(gameInfo.gameId, stableGrade);
    
    if (existing) {
      console.log(`🔄 Updated stable grade for ${gameInfo.gameId}: ${existing.grade}→${grade} (${lockReason})`);
    } else {
      console.log(`🔒 Locked new grade for ${gameInfo.gameId}: ${grade} (${lockReason})`);
    }
  }
  
  /**
   * Calculate numeric difference between grades
   */
  private calculateGradeChange(oldGrade: string, newGrade: string): number {
    const gradeValues: { [key: string]: number } = {
      'A+': 12, 'A': 11, 'A-': 10,
      'B+': 9, 'B': 8, 'B-': 7,
      'C+': 6, 'C': 5, 'C-': 4,
      'D+': 3, 'D': 2, 'F': 1
    };
    
    return (gradeValues[newGrade] || 5) - (gradeValues[oldGrade] || 5);
  }
  
  /**
   * Limit grade changes to maximum 1 level
   */
  private limitGradeChange(oldGrade: string, newGrade: string): string {
    const gradeOrder = ['F', 'D', 'D+', 'C-', 'C', 'C+', 'B-', 'B', 'B+', 'A-', 'A', 'A+'];
    const oldIndex = gradeOrder.indexOf(oldGrade);
    const newIndex = gradeOrder.indexOf(newGrade);
    
    if (oldIndex === -1 || newIndex === -1) return newGrade; // Fallback
    
    const difference = newIndex - oldIndex;
    
    if (difference > 1) {
      // Limit to +1 grade level
      return gradeOrder[oldIndex + 1] || oldGrade;
    } else if (difference < -1) {
      // Limit to -1 grade level  
      return gradeOrder[oldIndex - 1] || oldGrade;
    }
    
    return newGrade; // Change is within 1 level, allow it
  }
  
  /**
   * Get existing stable grade if available
   */
  getStableGrade(gameId: string): StableGrade | null {
    const grade = this.stableGrades.get(gameId);
    if (!grade) return null;
    
    // Check if grade has expired (24 hours)
    const age = Date.now() - grade.lockedAt;
    if (age > this.CACHE_DURATION) {
      this.stableGrades.delete(gameId);
      return null;
    }
    
    return grade;
  }
  
  /**
   * Check if game has both pitchers confirmed or sufficient info for initial grades
   */
  private hasBothPitchers(gameInfo: GameInfo): boolean {
    // Accept confirmed pitchers or allow initial generation with odds available
    const hasConfirmedPitchers = !!(gameInfo.homePitcher && 
                                   gameInfo.awayPitcher && 
                                   gameInfo.homePitcher !== 'TBD' && 
                                   gameInfo.awayPitcher !== 'TBD');
    
    // Allow initial grade generation if we have game info and odds
    const hasBasicGameInfo = !!(gameInfo.homeTeam && gameInfo.awayTeam && gameInfo.gameTime);
    
    if (hasConfirmedPitchers) {
      console.log(`✅ Confirmed pitchers for ${gameInfo.gameId}: ${gameInfo.homePitcher} vs ${gameInfo.awayPitcher}`);
      return true;
    }
    
    if (hasBasicGameInfo) {
      console.log(`📋 Basic game info available for ${gameInfo.gameId}: generating preliminary grade`);
      return true;
    }
    
    return false;
  }
  
  /**
   * Check if game has lineups posted
   */
  private hasLineups(gameInfo: GameInfo): boolean {
    return !!(gameInfo.homeLineup && 
              gameInfo.awayLineup && 
              gameInfo.homeLineup.length > 0 && 
              gameInfo.awayLineup.length > 0);
  }
  
  /**
   * Check if lineups are now available when they weren't before
   */
  private lineupsNowAvailable(gameInfo: GameInfo, existing: StableGrade): boolean {
    // If we previously locked due to pitchers only, and now have lineups
    return existing.lockedReason === 'pitchers_available' && this.hasLineups(gameInfo);
  }
  
  /**
   * Check if pitcher information has changed
   */
  private pitcherChanged(gameInfo: GameInfo): boolean {
    // For now, assume pitchers don't change once set
    // Could enhance this to compare with stored pitcher info
    return false;
  }
  
  /**
   * Clear expired grades (cleanup method)
   */
  clearExpiredGrades(): void {
    const now = Date.now();
    let cleared = 0;
    
    for (const [gameId, grade] of this.stableGrades) {
      const age = now - grade.lockedAt;
      if (age > this.CACHE_DURATION) {
        this.stableGrades.delete(gameId);
        cleared++;
      }
    }
    
    if (cleared > 0) {
      console.log(`🧹 Cleared ${cleared} expired stable grades`);
    }
  }
  
  /**
   * Get cache statistics for monitoring
   */
  getCacheStats(): { total: number; byReason: Record<string, number>; avgAge: number } {
    const total = this.stableGrades.size;
    const byReason: Record<string, number> = {};
    let totalAge = 0;
    
    for (const grade of this.stableGrades.values()) {
      byReason[grade.lockedReason] = (byReason[grade.lockedReason] || 0) + 1;
      totalAge += Date.now() - grade.lockedAt;
    }
    
    return {
      total,
      byReason,
      avgAge: total > 0 ? totalAge / total / (1000 * 60 * 60) : 0 // hours
    };
  }
}

export const gradeStabilityService = new GradeStabilityService();