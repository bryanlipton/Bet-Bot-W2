import { db } from '../db';
import { proPickGrades } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';

export interface ProPickGrade {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  pickTeam: string;
  grade: string;
  confidence: number;
  reasoning: string;
  analysis: any;
  odds?: number | null;
  gameTime: Date;
  pickDate: string;
}

export class PersistentGradeService {
  
  // Get existing grade for a game on a specific date
  async getExistingGrade(gameId: string, pickDate: string): Promise<ProPickGrade | null> {
    try {
      const existing = await db
        .select()
        .from(proPickGrades)
        .where(and(
          eq(proPickGrades.gameId, gameId),
          eq(proPickGrades.pickDate, pickDate)
        ))
        .limit(1);
      
      return existing[0] || null;
    } catch (error) {
      console.error('Error fetching existing grade:', error);
      return null;
    }
  }

  // Store a new grade or update existing one
  async storeGrade(gradeData: ProPickGrade): Promise<void> {
    try {
      // Check if grade already exists
      const existing = await this.getExistingGrade(gradeData.gameId, gradeData.pickDate);
      
      if (existing) {
        // Update existing grade
        await db
          .update(proPickGrades)
          .set({
            grade: gradeData.grade,
            confidence: gradeData.confidence,
            reasoning: gradeData.reasoning,
            analysis: gradeData.analysis,
            odds: gradeData.odds,
            updatedAt: new Date()
          })
          .where(and(
            eq(proPickGrades.gameId, gradeData.gameId),
            eq(proPickGrades.pickDate, gradeData.pickDate)
          ));
        
        console.log(`📝 Updated persistent grade for ${gradeData.pickTeam}: ${gradeData.grade}`);
      } else {
        // Insert new grade
        await db.insert(proPickGrades).values({
          gameId: gradeData.gameId,
          homeTeam: gradeData.homeTeam,
          awayTeam: gradeData.awayTeam,
          pickTeam: gradeData.pickTeam,
          grade: gradeData.grade,
          confidence: gradeData.confidence,
          reasoning: gradeData.reasoning,
          analysis: gradeData.analysis,
          odds: gradeData.odds,
          gameTime: gradeData.gameTime,
          pickDate: gradeData.pickDate
        });
        
        console.log(`💾 Stored new persistent grade for ${gradeData.pickTeam}: ${gradeData.grade}`);
      }
    } catch (error) {
      console.error('Error storing grade:', error);
      throw error;
    }
  }

  // Get all grades for a specific date
  async getGradesForDate(pickDate: string): Promise<ProPickGrade[]> {
    try {
      const grades = await db
        .select()
        .from(proPickGrades)
        .where(eq(proPickGrades.pickDate, pickDate));
      
      return grades;
    } catch (error) {
      console.error('Error fetching grades for date:', error);
      return [];
    }
  }

  // Clear all grades for a specific date (for testing/debugging)
  async clearGradesForDate(pickDate: string): Promise<void> {
    try {
      await db
        .delete(proPickGrades)
        .where(eq(proPickGrades.pickDate, pickDate));
      
      console.log(`🗑️ Cleared all persistent grades for ${pickDate}`);
    } catch (error) {
      console.error('Error clearing grades:', error);
      throw error;
    }
  }
}

export const persistentGradeService = new PersistentGradeService();