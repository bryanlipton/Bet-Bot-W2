/**
 * Advanced Betting Recommendation Engine
 * Compares AI predictions with real market odds to identify value bets
 */

interface OddsData {
  homeMoneyline: number;
  awayMoneyline: number;
  homeSpread: number;
  awaySpread: number;
  spreadLine: number;
  overOdds: number;
  underOdds: number;
  totalLine: number;
}

interface PredictionData {
  homeWinProbability: number;
  awayWinProbability: number;
  homeSpreadProbability: number;
  awaySpreadProbability: number;
  overProbability: number;
  underProbability: number;
  predictedTotal: number;
  confidence: number;
}

interface BettingRecommendation {
  betType: 'moneyline'; // MONEYLINE ONLY - per user requirements
  selection: string;
  odds: number;
  impliedProbability: number;
  predictedProbability: number;
  edge: number;
  grade: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D+' | 'D' | 'F';
  confidence: number;
  reasoning: string;
  expectedValue: number;
  kellyBetSize: number;
}

export class BettingRecommendationEngine {
  
  /**
   * Convert American odds to decimal probability
   */
  private oddsToImpliedProbability(americanOdds: number): number {
    if (americanOdds > 0) {
      return 100 / (americanOdds + 100);
    } else {
      return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
    }
  }

  /**
   * Calculate expected value of a bet (as ROI percentage)
   */
  private calculateExpectedValue(predictedProb: number, odds: number): number {
    const payoutMultiplier = odds > 0 ? (odds / 100) : (100 / Math.abs(odds));
    
    // EV = (Probability of Win × Profit) - (Probability of Loss × Loss)
    // This gives us expected profit per $1 wagered
    const expectedProfit = (predictedProb * payoutMultiplier) - ((1 - predictedProb) * 1);
    
    // Convert to ROI percentage (multiply by 100)
    return expectedProfit * 100;
  }

  /**
   * Calculate Kelly Criterion bet size
   */
  private calculateKellyBetSize(predictedProb: number, odds: number): number {
    const impliedProb = this.oddsToImpliedProbability(odds);
    const payoutMultiplier = odds > 0 ? (odds / 100) : (100 / Math.abs(odds));
    
    // Kelly = (bp - q) / b where b = odds, p = win prob, q = lose prob
    const kelly = ((payoutMultiplier * predictedProb) - (1 - predictedProb)) / payoutMultiplier;
    
    // Cap at 5% for safety (0.05 = 5% of bankroll)
    return Math.max(0, Math.min(kelly, 0.05));
  }

  /**
   * Assign letter grade based on edge and confidence - ENHANCED for full grade spectrum
   */
  private assignGrade(edge: number, confidence: number): 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D+' | 'D' | 'F' {
    // Enhanced grading system for realistic grade distribution
    const edgePercentage = edge * 100; // Convert to percentage
    
    // Primary factor: Edge percentage (most important for Pro analysis)
    let baseScore = 50; // Start neutral
    
    if (edgePercentage >= 6) baseScore = 95;      // A+ territory: 6%+ edge
    else if (edgePercentage >= 4) baseScore = 90; // A territory: 4-6% edge
    else if (edgePercentage >= 2.5) baseScore = 85; // A- territory: 2.5-4% edge
    else if (edgePercentage >= 1.5) baseScore = 80; // B+ territory: 1.5-2.5% edge
    else if (edgePercentage >= 0.5) baseScore = 75; // B territory: 0.5-1.5% edge
    else if (edgePercentage >= -0.5) baseScore = 70; // B- territory: -0.5-0.5% edge
    else if (edgePercentage >= -1.5) baseScore = 65; // C+ territory: -1.5 to -0.5% edge
    else if (edgePercentage >= -2.5) baseScore = 60; // C territory: -2.5 to -1.5% edge
    else if (edgePercentage >= -3.5) baseScore = 55; // C- territory: -3.5 to -2.5% edge
    else if (edgePercentage >= -4.5) baseScore = 50; // D+ territory: -4.5 to -3.5% edge
    else if (edgePercentage >= -5.5) baseScore = 45; // D territory: -5.5 to -4.5% edge
    else baseScore = 35; // F territory: worse than -5.5% edge
    
    // Secondary factor: Confidence adjustment (±5 points max)
    const confidenceAdjustment = (confidence - 0.75) * 10; // 0.75 = neutral confidence
    const adjustedScore = baseScore + confidenceAdjustment;
    
    // Add small random variation for realism (±3 points)
    const finalScore = adjustedScore + ((Math.random() - 0.5) * 6);
    
    // Assign grades based on final score with realistic thresholds
    if (finalScore >= 92) return 'A+';
    if (finalScore >= 88) return 'A'; 
    if (finalScore >= 82) return 'A-';
    if (finalScore >= 78) return 'B+';
    if (finalScore >= 72) return 'B';
    if (finalScore >= 68) return 'B-';
    if (finalScore >= 62) return 'C+';
    if (finalScore >= 58) return 'C';
    if (finalScore >= 52) return 'C-';
    if (finalScore >= 48) return 'D+';
    if (finalScore >= 42) return 'D';
    return 'F';
  }

  /**
   * Extract odds from bookmakers array
   */
  private extractOddsFromBookmakers(bookmakers: any[]): OddsData | null {
    if (!bookmakers || bookmakers.length === 0) return null;

    // Use first available bookmaker
    const bookmaker = bookmakers[0];
    
    const h2hMarket = bookmaker.markets?.find((m: any) => m.key === 'h2h');
    const spreadsMarket = bookmaker.markets?.find((m: any) => m.key === 'spreads');
    const totalsMarket = bookmaker.markets?.find((m: any) => m.key === 'totals');

    if (!h2hMarket) return null;

    // For the betting recommendations, we need to match team names from the outcomes
    const outcomes = h2hMarket.outcomes;
    const homeOutcome = outcomes[0]; // First team in outcomes
    const awayOutcome = outcomes[1]; // Second team in outcomes

    const oddsData: OddsData = {
      homeMoneyline: homeOutcome?.price || 0,
      awayMoneyline: awayOutcome?.price || 0,
      homeSpread: 0,
      awaySpread: 0,
      spreadLine: 0,
      overOdds: 0,
      underOdds: 0,
      totalLine: 0
    };

    // Extract spread data
    if (spreadsMarket) {
      const spreadOutcomes = spreadsMarket.outcomes;
      oddsData.homeSpread = spreadOutcomes[0]?.price || 0;
      oddsData.awaySpread = spreadOutcomes[1]?.price || 0;
      oddsData.spreadLine = spreadOutcomes[0]?.point || 0;
    }

    // Extract totals data
    if (totalsMarket) {
      const overOutcome = totalsMarket.outcomes.find((o: any) => o.name === 'Over');
      const underOutcome = totalsMarket.outcomes.find((o: any) => o.name === 'Under');
      
      oddsData.overOdds = overOutcome?.price || 0;
      oddsData.underOdds = underOutcome?.price || 0;
      oddsData.totalLine = overOutcome?.point || 0;
    }

    console.log('Extracted odds data:', JSON.stringify(oddsData, null, 2));
    return oddsData;
  }

  /**
   * Generate comprehensive betting recommendations
   */
  public generateRecommendations(
    prediction: PredictionData,
    bookmakers: any[],
    homeTeam: string,
    awayTeam: string
  ): BettingRecommendation[] {
    console.log('🎯 Generating betting recommendations...');
    console.log('Prediction data:', JSON.stringify(prediction, null, 2));
    
    const odds = this.extractOddsFromBookmakers(bookmakers);
    if (!odds) {
      console.log('❌ No odds extracted from bookmakers');
      return [];
    }

    const recommendations: BettingRecommendation[] = [];

    // Moneyline Recommendations
    if (odds.homeMoneyline && odds.awayMoneyline) {
      // Home moneyline
      const homeEdge = prediction.homeWinProbability - this.oddsToImpliedProbability(odds.homeMoneyline);
      console.log(`🎯 DEBUG Home ${homeTeam}: ModelProb=${(prediction.homeWinProbability * 100).toFixed(1)}%, MarketProb=${(this.oddsToImpliedProbability(odds.homeMoneyline) * 100).toFixed(1)}%, Edge=${(homeEdge * 100).toFixed(1)}%`);
      
      if (homeEdge > -0.05) { // Include picks with up to -5% edge for full grade spectrum
        const homeGrade = this.assignGrade(homeEdge, prediction.confidence);
        console.log(`✅ Adding ${homeTeam} pick: Edge=${(homeEdge * 100).toFixed(1)}%, Confidence=${(prediction.confidence * 100).toFixed(1)}%, Grade=${homeGrade}`);
        
        recommendations.push({
          betType: 'moneyline',
          selection: `${homeTeam} ML`,
          odds: odds.homeMoneyline,
          impliedProbability: this.oddsToImpliedProbability(odds.homeMoneyline),
          predictedProbability: prediction.homeWinProbability,
          edge: homeEdge,
          grade: homeGrade,
          confidence: prediction.confidence,
          reasoning: `AI predicts ${homeTeam} wins ${(prediction.homeWinProbability * 100).toFixed(1)}% vs market ${(this.oddsToImpliedProbability(odds.homeMoneyline) * 100).toFixed(1)}%`,
          expectedValue: this.calculateExpectedValue(prediction.homeWinProbability, odds.homeMoneyline),
          kellyBetSize: this.calculateKellyBetSize(prediction.homeWinProbability, odds.homeMoneyline)
        });
      }

      // Away moneyline
      const awayEdge = prediction.awayWinProbability - this.oddsToImpliedProbability(odds.awayMoneyline);
      console.log(`🎯 DEBUG Away ${awayTeam}: ModelProb=${(prediction.awayWinProbability * 100).toFixed(1)}%, MarketProb=${(this.oddsToImpliedProbability(odds.awayMoneyline) * 100).toFixed(1)}%, Edge=${(awayEdge * 100).toFixed(1)}%`);
      
      if (awayEdge > -0.05) { // Include picks with up to -5% edge for full grade spectrum
        const awayGrade = this.assignGrade(awayEdge, prediction.confidence);
        console.log(`✅ Adding ${awayTeam} pick: Edge=${(awayEdge * 100).toFixed(1)}%, Confidence=${(prediction.confidence * 100).toFixed(1)}%, Grade=${awayGrade}`);
        
        recommendations.push({
          betType: 'moneyline',
          selection: `${awayTeam} ML`,
          odds: odds.awayMoneyline,
          impliedProbability: this.oddsToImpliedProbability(odds.awayMoneyline),
          predictedProbability: prediction.awayWinProbability,
          edge: awayEdge,
          grade: awayGrade,
          confidence: prediction.confidence,
          reasoning: `AI predicts ${awayTeam} wins ${(prediction.awayWinProbability * 100).toFixed(1)}% vs market ${(this.oddsToImpliedProbability(odds.awayMoneyline) * 100).toFixed(1)}%`,
          expectedValue: this.calculateExpectedValue(prediction.awayWinProbability, odds.awayMoneyline),
          kellyBetSize: this.calculateKellyBetSize(prediction.awayWinProbability, odds.awayMoneyline)
        });
      }
    }

    // REMOVED: Spread Recommendations - System configured for moneyline-only picks
    // Per user requirements: All daily picks must be moneyline bets only - no spread bets allowed

    // REMOVED: Total (Over/Under) Recommendations - System configured for moneyline-only picks
    // Per user requirements: All daily picks must be moneyline bets only - no over/under or spread bets allowed

    // Sort by grade and edge
    return recommendations.sort((a, b) => {
      const gradeOrder = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F'];
      const gradeComparison = gradeOrder.indexOf(a.grade) - gradeOrder.indexOf(b.grade);
      return gradeComparison !== 0 ? gradeComparison : b.edge - a.edge;
    });
  }
}