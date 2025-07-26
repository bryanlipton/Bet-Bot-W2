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
   * Assign letter grade based on edge and confidence - aligned with optimized threshold system
   */
  private assignGrade(edge: number, confidence: number): 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D+' | 'D' | 'F' {
    // Convert edge and confidence to 60-100 scale to match analysis factors display
    const edgeScore = Math.min(100, 60 + (edge * 400)); // edge 0.1 = 100
    const confidenceScore = Math.min(100, 60 + (confidence * 40)); // confidence 1.0 = 100
    const avgScore = (edgeScore + confidenceScore) / 2;
    
    // OPTIMIZED THRESHOLDS: Target 3+ A- or better games per day from ~30 game slate
    if (avgScore >= 78.5) return 'A+';  // Top 3-5% - exceptional (1-2 games)
    if (avgScore >= 76.0) return 'A';   // Top 8-10% - elite (2-3 games)  
    if (avgScore >= 73.5) return 'A-';  // Top 13-15% - very strong (2-3 games)
    if (avgScore >= 70.0) return 'B+';  // Top 20-25% - strong (4-5 games)
    if (avgScore >= 66.0) return 'B';   // Top 35-40% - good (6-7 games)
    if (avgScore >= 62.0) return 'B-';  // Top 50-55% - decent (4-5 games)
    if (avgScore >= 58.0) return 'C+';  // Top 65-70% - above average (3-4 games)
    if (avgScore >= 54.0) return 'C';   // Average games (3-4 games)
    if (avgScore >= 50.0) return 'C-';  // Below average (2-3 games)
    if (avgScore >= 47.0) return 'D+';  // Poor games (1-2 games)
    if (avgScore >= 44.0) return 'D';   // Very poor (0-1 games)
    return 'F';                         // Avoid completely
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
      if (homeEdge > 0.01) { // Minimum 1% edge for quality picks
        recommendations.push({
          betType: 'moneyline',
          selection: `${homeTeam} ML`,
          odds: odds.homeMoneyline,
          impliedProbability: this.oddsToImpliedProbability(odds.homeMoneyline),
          predictedProbability: prediction.homeWinProbability,
          edge: homeEdge,
          grade: this.assignGrade(homeEdge, prediction.confidence),
          confidence: prediction.confidence,
          reasoning: `AI predicts ${homeTeam} wins ${(prediction.homeWinProbability * 100).toFixed(1)}% vs market ${(this.oddsToImpliedProbability(odds.homeMoneyline) * 100).toFixed(1)}%`,
          expectedValue: this.calculateExpectedValue(prediction.homeWinProbability, odds.homeMoneyline),
          kellyBetSize: this.calculateKellyBetSize(prediction.homeWinProbability, odds.homeMoneyline)
        });
      }

      // Away moneyline
      const awayEdge = prediction.awayWinProbability - this.oddsToImpliedProbability(odds.awayMoneyline);
      if (awayEdge > 0.01) { // Minimum 1% edge for quality picks
        recommendations.push({
          betType: 'moneyline',
          selection: `${awayTeam} ML`,
          odds: odds.awayMoneyline,
          impliedProbability: this.oddsToImpliedProbability(odds.awayMoneyline),
          predictedProbability: prediction.awayWinProbability,
          edge: awayEdge,
          grade: this.assignGrade(awayEdge, prediction.confidence),
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