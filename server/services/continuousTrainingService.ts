import { db } from '../db';
import { 
  baseballTrainingData, 
  baseballGames,
  baseballModelTraining,
  InsertBaseballTrainingData,
  InsertBaseballModelTraining 
} from '@shared/schema';
import { eq, desc, and, sql } from 'drizzle-orm';

interface PredictionInputs {
  gameId: number;
  predictedHomeWin: number;
  predictedAwayWin: number;
  predictedTotal: number;
  predictedOverProb: number;
  predictedUnderProb: number;
  inputFeatures: any;
  marketData: {
    homeOdds: number;
    awayOdds: number;
    totalLine: number;
    overOdds: number;
    underOdds: number;
  };
  umpireData?: {
    name: string;
    strikeZoneAccuracy: number;
    consistencyRating: number;
    runsImpact: number;
  };
}

interface GameResult {
  homeScore: number;
  awayScore: number;
  gameComplete: boolean;
}

export class ContinuousTrainingService {
  
  /**
   * Store prediction data when a prediction is made
   */
  async storePrediction(prediction: PredictionInputs): Promise<number> {
    const trainingData: InsertBaseballTrainingData = {
      gameId: prediction.gameId,
      inputFeatures: prediction.inputFeatures,
      predictedHomeWin: prediction.predictedHomeWin,
      predictedAwayWin: prediction.predictedAwayWin,
      predictedTotal: prediction.predictedTotal,
      predictedOverProb: prediction.predictedOverProb,
      predictedUnderProb: prediction.predictedUnderProb,
      marketHomeOdds: prediction.marketData.homeOdds,
      marketAwayOdds: prediction.marketData.awayOdds,
      marketTotalLine: prediction.marketData.totalLine,
      marketOverOdds: prediction.marketData.overOdds,
      marketUnderOdds: prediction.marketData.underOdds,
      umpireName: prediction.umpireData?.name,
      umpireStrikeZoneAccuracy: prediction.umpireData?.strikeZoneAccuracy,
      umpireConsistencyRating: prediction.umpireData?.consistencyRating,
      umpireRunsImpact: prediction.umpireData?.runsImpact,
    };

    const [result] = await db.insert(baseballTrainingData).values(trainingData).returning({ id: baseballTrainingData.id });
    return result.id;
  }

  /**
   * Update training data with actual game results
   */
  async updateWithGameResult(gameId: number, result: GameResult): Promise<void> {
    if (!result.gameComplete) {
      return; // Don't update with partial results
    }

    const actualTotal = result.homeScore + result.awayScore;
    const actualHomeWin = result.homeScore > result.awayScore;

    // Get all training data entries for this game
    const trainingEntries = await db
      .select()
      .from(baseballTrainingData)
      .where(eq(baseballTrainingData.gameId, gameId));

    for (const entry of trainingEntries) {
      // Calculate actual over/under based on our predicted line
      const actualOver = entry.predictedTotal ? actualTotal > entry.predictedTotal : null;

      // Calculate accuracy metrics
      const homeWinAccuracy = entry.predictedHomeWin ? 
        Math.abs(entry.predictedHomeWin - (actualHomeWin ? 1 : 0)) : null;
      
      const totalAccuracy = entry.predictedTotal ? 
        Math.abs(entry.predictedTotal - actualTotal) : null;

      // Update the training data entry
      await db
        .update(baseballTrainingData)
        .set({
          actualHomeScore: result.homeScore,
          actualAwayScore: result.awayScore,
          actualTotal,
          actualHomeWin,
          actualOver,
          homeWinAccuracy,
          totalAccuracy,
          updatedAt: new Date(),
        })
        .where(eq(baseballTrainingData.id, entry.id));
    }
  }

  /**
   * Calculate model performance metrics
   */
  async calculateModelPerformance(
    dateFrom?: Date, 
    dateTo?: Date
  ): Promise<{
    totalGames: number;
    homeWinAccuracy: number;
    totalPredictionAccuracy: number;
    averageEdge: number;
    profitability: number;
    overUnderAccuracy: number;
  }> {
    let query = db
      .select({
        homeWinAccuracy: baseballTrainingData.homeWinAccuracy,
        totalAccuracy: baseballTrainingData.totalAccuracy,
        actualOver: baseballTrainingData.actualOver,
        predictedOverProb: baseballTrainingData.predictedOverProb,
        predictedUnderProb: baseballTrainingData.predictedUnderProb,
        marketOverOdds: baseballTrainingData.marketOverOdds,
        marketUnderOdds: baseballTrainingData.marketUnderOdds,
      })
      .from(baseballTrainingData)
      .where(
        and(
          sql`${baseballTrainingData.actualHomeScore} IS NOT NULL`,
          sql`${baseballTrainingData.actualAwayScore} IS NOT NULL`
        )
      );

    if (dateFrom) {
      query = query.where(sql`${baseballTrainingData.createdAt} >= ${dateFrom}`);
    }
    if (dateTo) {
      query = query.where(sql`${baseballTrainingData.createdAt} <= ${dateTo}`);
    }

    const results = await query;

    if (results.length === 0) {
      return {
        totalGames: 0,
        homeWinAccuracy: 0,
        totalPredictionAccuracy: 0,
        averageEdge: 0,
        profitability: 0,
        overUnderAccuracy: 0,
      };
    }

    // Calculate metrics
    const totalGames = results.length;
    
    // Home win accuracy (how close our win probability was)
    const validHomeWinAccuracies = results
      .filter(r => r.homeWinAccuracy !== null)
      .map(r => r.homeWinAccuracy!);
    const homeWinAccuracy = validHomeWinAccuracies.length > 0 
      ? 1 - (validHomeWinAccuracies.reduce((a, b) => a + b, 0) / validHomeWinAccuracies.length)
      : 0;

    // Total prediction accuracy (how close our total was)
    const validTotalAccuracies = results
      .filter(r => r.totalAccuracy !== null)
      .map(r => r.totalAccuracy!);
    const totalPredictionAccuracy = validTotalAccuracies.length > 0
      ? Math.max(0, 1 - (validTotalAccuracies.reduce((a, b) => a + b, 0) / validTotalAccuracies.length) / 10) // Normalize by 10 runs
      : 0;

    // Over/Under accuracy
    const overUnderPredictions = results.filter(r => 
      r.actualOver !== null && 
      r.predictedOverProb !== null && 
      r.predictedUnderProb !== null
    );
    
    let correctOverUnder = 0;
    for (const pred of overUnderPredictions) {
      const predictedOver = pred.predictedOverProb! > pred.predictedUnderProb!;
      if (predictedOver === pred.actualOver) {
        correctOverUnder++;
      }
    }
    
    const overUnderAccuracy = overUnderPredictions.length > 0 
      ? correctOverUnder / overUnderPredictions.length 
      : 0;

    // Calculate profitability (simplified simulation)
    let totalProfit = 0;
    let betsPlaced = 0;
    
    for (const result of overUnderPredictions) {
      const { predictedOverProb, predictedUnderProb, actualOver, marketOverOdds, marketUnderOdds } = result;
      
      if (!predictedOverProb || !predictedUnderProb || !marketOverOdds || !marketUnderOdds) continue;

      // Calculate implied probabilities from market odds
      const impliedOverProb = 1 / (marketOverOdds / 100 + 1);
      const impliedUnderProb = 1 / (marketUnderOdds / 100 + 1);

      // Check for edge (our probability vs market probability)
      const overEdge = predictedOverProb - impliedOverProb;
      const underEdge = predictedUnderProb - impliedUnderProb;

      // Place bet if we have significant edge (>5%)
      if (overEdge > 0.05) {
        betsPlaced++;
        if (actualOver) {
          totalProfit += marketOverOdds / 100; // Win
        } else {
          totalProfit -= 1; // Loss
        }
      } else if (underEdge > 0.05) {
        betsPlaced++;
        if (!actualOver) {
          totalProfit += marketUnderOdds / 100; // Win
        } else {
          totalProfit -= 1; // Loss
        }
      }
    }

    const profitability = betsPlaced > 0 ? totalProfit / betsPlaced : 0;
    const averageEdge = this.calculateAverageEdge(results);

    return {
      totalGames,
      homeWinAccuracy: Math.round(homeWinAccuracy * 10000) / 100, // Percentage
      totalPredictionAccuracy: Math.round(totalPredictionAccuracy * 10000) / 100,
      averageEdge: Math.round(averageEdge * 10000) / 100,
      profitability: Math.round(profitability * 10000) / 100,
      overUnderAccuracy: Math.round(overUnderAccuracy * 10000) / 100,
    };
  }

  /**
   * Identify areas where the model needs improvement
   */
  async identifyModelWeaknesses(): Promise<{
    weaknesses: string[];
    recommendations: string[];
    dataNeeds: string[];
  }> {
    const performance = await this.calculateModelPerformance();
    const weaknesses: string[] = [];
    const recommendations: string[] = [];
    const dataNeeds: string[] = [];

    // Analyze performance metrics
    if (performance.homeWinAccuracy < 60) {
      weaknesses.push('Low win probability accuracy');
      recommendations.push('Improve team strength modeling');
      dataNeeds.push('More detailed team form data');
    }

    if (performance.totalPredictionAccuracy < 70) {
      weaknesses.push('Poor total runs prediction');
      recommendations.push('Enhance scoring prediction algorithms');
      dataNeeds.push('Better offensive/defensive metrics');
    }

    if (performance.overUnderAccuracy < 55) {
      weaknesses.push('Over/Under predictions below random chance');
      recommendations.push('Recalibrate total prediction model');
      dataNeeds.push('Weather and ballpark factor improvements');
    }

    if (performance.profitability < 0) {
      weaknesses.push('Model losing money vs market odds');
      recommendations.push('Tighten edge detection criteria');
      dataNeeds.push('Real-time odds movement tracking');
    }

    if (performance.totalGames < 50) {
      weaknesses.push('Insufficient training data');
      recommendations.push('Collect more historical game data');
      dataNeeds.push('Expand data collection timeframe');
    }

    return { weaknesses, recommendations, dataNeeds };
  }

  /**
   * Store model training session results
   */
  async storeModelTrainingSession(
    modelVersion: string,
    trainingResults: {
      trainingDataSize: number;
      accuracy: number;
      precision: number;
      recall: number;
      f1Score: number;
      features: string[];
      hyperparameters: any;
    }
  ): Promise<void> {
    const trainingData: InsertBaseballModelTraining = {
      modelVersion,
      trainingDataSize: trainingResults.trainingDataSize,
      accuracy: trainingResults.accuracy,
      precision: trainingResults.precision,
      recall: trainingResults.recall,
      f1Score: trainingResults.f1Score,
      features: trainingResults.features,
      hyperparameters: JSON.stringify(trainingResults.hyperparameters),
    };

    await db.insert(baseballModelTraining).values(trainingData);
  }

  /**
   * Get model improvement trends over time
   */
  async getModelTrends(): Promise<{
    accuracy: Array<{ date: string; value: number }>;
    profitability: Array<{ date: string; value: number }>;
    totalGames: number;
  }> {
    // Get training sessions over time
    const trainingSessions = await db
      .select()
      .from(baseballModelTraining)
      .orderBy(desc(baseballModelTraining.trainedAt))
      .limit(10);

    const accuracy = trainingSessions.map(session => ({
      date: session.trainedAt?.toISOString().split('T')[0] || '',
      value: Math.round(session.accuracy * 100)
    }));

    // Calculate profitability trend by week
    const weeklyPerformance = await this.getWeeklyPerformance();
    
    return {
      accuracy,
      profitability: weeklyPerformance,
      totalGames: (await this.calculateModelPerformance()).totalGames
    };
  }

  /**
   * Calculate average edge from results
   */
  private calculateAverageEdge(results: any[]): number {
    let totalEdge = 0;
    let validEdges = 0;

    for (const result of results) {
      if (result.predictedOverProb && result.marketOverOdds) {
        const impliedProb = 1 / (result.marketOverOdds / 100 + 1);
        const edge = Math.abs(result.predictedOverProb - impliedProb);
        totalEdge += edge;
        validEdges++;
      }
    }

    return validEdges > 0 ? totalEdge / validEdges : 0;
  }

  /**
   * Get weekly performance trends
   */
  private async getWeeklyPerformance(): Promise<Array<{ date: string; value: number }>> {
    // This would calculate weekly profitability
    // For now, return mock data structure
    const weeks = [];
    const today = new Date();
    
    for (let i = 4; i >= 0; i--) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - (i * 7));
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const performance = await this.calculateModelPerformance(weekStart, weekEnd);
      
      weeks.push({
        date: weekStart.toISOString().split('T')[0],
        value: performance.profitability
      });
    }
    
    return weeks;
  }

  /**
   * Auto-retrain model when sufficient new data is available
   */
  async checkForAutoRetrain(): Promise<boolean> {
    // Get latest training session
    const [latestTraining] = await db
      .select()
      .from(baseballModelTraining)
      .orderBy(desc(baseballModelTraining.trainedAt))
      .limit(1);

    if (!latestTraining) {
      return true; // Need initial training
    }

    // Count new training data since last training session
    const newDataCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(baseballTrainingData)
      .where(
        and(
          sql`${baseballTrainingData.actualHomeScore} IS NOT NULL`,
          sql`${baseballTrainingData.createdAt} > ${latestTraining.trainedAt}`
        )
      );

    const count = newDataCount[0]?.count || 0;
    
    // Retrain if we have 50+ new completed games
    return count >= 50;
  }
}

export const continuousTrainingService = new ContinuousTrainingService();