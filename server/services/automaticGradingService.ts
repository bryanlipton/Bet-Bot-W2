import { PickGradingService } from "./pickGradingService";

export class AutomaticGradingService {
  private pickGradingService: PickGradingService;
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    this.pickGradingService = new PickGradingService();
  }

  /**
   * Start automatic grading service that runs every 30 minutes
   */
  start() {
    console.log("🎯 Starting automatic pick grading service...");
    
    // Run immediately on startup
    this.runGradingCycle();
    
    // Then run every 10 minutes for more frequent checking
    this.intervalId = setInterval(() => {
      this.runGradingCycle();
    }, 10 * 60 * 1000); // 10 minutes
  }

  /**
   * Stop the automatic grading service
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("🛑 Stopped automatic pick grading service");
    }
  }

  /**
   * Run a complete grading cycle for recent dates
   */
  private async runGradingCycle() {
    try {
      console.log("🔄 Running automatic pick grading cycle...");
      
      const dates = this.getRecentDates(7); // Check last 7 days for comprehensive coverage
      let totalGraded = 0;

      for (const date of dates) {
        const gradedCount = await this.pickGradingService.gradePendingPicks(date);
        totalGraded += gradedCount;
      }

      if (totalGraded > 0) {
        console.log(`✅ Automatic grading completed: ${totalGraded} picks graded`);
      } else {
        console.log("📝 No pending picks found to grade");
      }
      
    } catch (error) {
      console.error("❌ Error in automatic grading cycle:", error);
    }
  }

  /**
   * Get array of recent date strings (YYYY-MM-DD format)
   */
  private getRecentDates(days: number): string[] {
    const dates: string[] = [];
    const today = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
  }

  /**
   * Manual trigger for grading - can be called from API endpoints
   */
  async manualGrade(dateRange: number = 1): Promise<number> {
    console.log(`🎯 Manual pick grading triggered for last ${dateRange} day(s)`);
    
    const dates = this.getRecentDates(dateRange);
    let totalGraded = 0;

    for (const date of dates) {
      const gradedCount = await this.pickGradingService.gradePendingPicks(date);
      totalGraded += gradedCount;
    }

    console.log(`✅ Manual grading completed: ${totalGraded} picks graded`);
    return totalGraded;
  }
}

// Export singleton instance
export const automaticGradingService = new AutomaticGradingService();