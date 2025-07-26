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
    
    // Has stable grade - only update for significant changes
    const timeSinceUpdate = Date.now() - existing.lastUpdate;
    const hoursSinceUpdate = timeSinceUpdate / (1000 * 60 * 60);
    
    // Only allow updates if:
    // 1. Lineups weren't available before but are now
    // 2. More than 4 hours have passed (for daily refresh)
    // 3. Pitcher changes detected
    
    if (this.lineupsNowAvailable(gameInfo, existing)) {
      console.log(`🔄 Updating grade for ${gameInfo.gameId}: Lineups now available`);
      return true;
    }
    
    if (hoursSinceUpdate > 4) {
      console.log(`🔄 Updating grade for ${gameInfo.gameId}: Daily refresh (${hoursSinceUpdate.toFixed(1)}h since last)`);
      return true;
    }
    
    if (this.pitcherChanged(gameInfo)) {
      console.log(`🔄 Updating grade for ${gameInfo.gameId}: Pitcher change detected`);
      return true;
    }
    
    console.log(`🔒 Grade locked for ${gameInfo.gameId}: ${existing.grade} (${existing.lockedReason})`);
    return false;
  }
  
  /**
   * Store a stable grade that won't change frequently
   */
  lockGrade(gameInfo: GameInfo, grade: string, confidence: number, reasoning: string, analysis: any, pickTeam: string, odds: number): void {
    const lockReason = this.hasLineups(gameInfo) ? 'lineups_posted' : 'pitchers_available';
    
    const stableGrade: StableGrade = {
      gameId: gameInfo.gameId,
      grade,
      confidence,
      reasoning,
      analysis,
      pickTeam,
      odds,
      lockedAt: Date.now(),
      lockedReason: lockReason,
      lastUpdate: Date.now()
    };
    
    this.stableGrades.set(gameInfo.gameId, stableGrade);
    console.log(`🔒 Locked grade for ${gameInfo.gameId}: ${grade} (${lockReason})`);
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
   * Check if game has both pitchers confirmed
   */
  private hasBothPitchers(gameInfo: GameInfo): boolean {
    return !!(gameInfo.homePitcher && 
              gameInfo.awayPitcher && 
              gameInfo.homePitcher !== 'TBD' && 
              gameInfo.awayPitcher !== 'TBD');
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