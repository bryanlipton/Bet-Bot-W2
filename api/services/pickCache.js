// api/services/pickCache.js - Shared pick caching and management
class PickCacheService {
  constructor() {
    this.dailyPick = null;
    this.lockPick = null;
    this.lastGeneratedDate = null;
    this.lastGeneratedHour = null;
    this.yesterdaysTeams = [];
  }

  // Check if we need to regenerate picks (2 AM EST reset)
  shouldRegenerate() {
    const now = new Date();
    const estOffset = -5; // EST timezone
    const currentHourEST = (now.getUTCHours() + estOffset + 24) % 24;
    const today = now.toISOString().split('T')[0];
    
    // Generate new picks if:
    // 1. No picks exist yet
    // 2. Date changed and it's after 2 AM EST
    // 3. Same date but we haven't generated after 2 AM EST yet
    if (!this.dailyPick || !this.lastGeneratedDate) {
      return true;
    }
    
    if (this.lastGeneratedDate !== today) {
      // New day - only regenerate if it's after 2 AM EST
      return currentHourEST >= 2;
    }
    
    // Same day - check if we generated after 2 AM EST
    if (this.lastGeneratedDate === today && currentHourEST >= 2 && this.lastGeneratedHour < 2) {
      return true;
    }
    
    return false;
  }

  // Store picks with metadata
  setPicks(dailyPick, lockPick) {
    // Store yesterday's teams before updating
    if (this.dailyPick) {
      this.yesterdaysTeams = [
        this.dailyPick.pickTeam,
        this.lockPick?.pickTeam
      ].filter(Boolean);
    }
    
    const now = new Date();
    const estOffset = -5;
    const currentHourEST = (now.getUTCHours() + estOffset + 24) % 24;
    
    this.dailyPick = dailyPick;
    this.lockPick = lockPick;
    this.lastGeneratedDate = now.toISOString().split('T')[0];
    this.lastGeneratedHour = currentHourEST;
    
    console.log('✅ Picks cached for', this.lastGeneratedDate, 'at hour', currentHourEST);
  }

  // Get cached picks
  getPicks() {
    return {
      dailyPick: this.dailyPick,
      lockPick: this.lockPick,
      cached: true,
      generatedAt: `${this.lastGeneratedDate} ${this.lastGeneratedHour}:00 EST`
    };
  }

  // Check if a team was picked yesterday
  wasPickedYesterday(team) {
    return this.yesterdaysTeams.includes(team);
  }

  // Check if teams conflict (playing against each other)
  teamsConflict(pick1, pick2) {
    const team1Games = [pick1.homeTeam, pick1.awayTeam];
    const team2Games = [pick2.homeTeam, pick2.awayTeam];
    return team1Games.some(team => team2Games.includes(team));
  }

  // Validate grade meets minimum requirement
  meetsGradeRequirement(grade) {
    const gradeOrder = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F'];
    const minGradeIndex = gradeOrder.indexOf('C+');
    const pickGradeIndex = gradeOrder.indexOf(grade);
    return pickGradeIndex >= 0 && pickGradeIndex <= minGradeIndex;
  }
}

// Export singleton instance
const pickCache = new PickCacheService();
export default pickCache;
