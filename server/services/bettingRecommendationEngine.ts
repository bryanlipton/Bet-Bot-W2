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
  betType: 'moneyline' | 'spread' | 'total';
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
   * Calculate expected value of a bet
   */
  private calculateExpectedValue(predictedProb: number, odds: number): number {
    const impliedProb = this.oddsToImpliedProbability(odds);
    const payoutMultiplier = odds > 0 ? (odds / 100) : (100 / Math.abs(odds));
    
    // EV = (Probability of Win × Payout) - (Probability of Loss × Stake)
    return (predictedProb * payoutMultiplier) - ((1 - predictedProb) * 1);
  }

  /**
   * Calculate Kelly Criterion bet size
   */
  private calculateKellyBetSize(predictedProb: number, odds: number): number {
    const impliedProb = this.oddsToImpliedProbability(odds);
    const payoutMultiplier = odds > 0 ? (odds / 100) : (100 / Math.abs(odds));
    
    // Kelly = (bp - q) / b where b = odds, p = win prob, q = lose prob
    const kelly = ((payoutMultiplier * predictedProb) - (1 - predictedProb)) / payoutMultiplier;
    
    // Cap at 10% for safety
    return Math.max(0, Math.min(kelly, 0.1));
  }

  /**
   * Assign letter grade based on edge and confidence - aligned with analysis factors scale
   */
  private assignGrade(edge: number, confidence: number): 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D+' | 'D' | 'F' {
    // Convert edge and confidence to 60-100 scale to match analysis factors display
    const edgeScore = Math.min(100, 60 + (edge * 400)); // edge 0.1 = 100
    const confidenceScore = Math.min(100, 60 + (confidence * 40)); // confidence 1.0 = 100
    const avgScore = (edgeScore + confidenceScore) / 2;
    
    // Grade based on average score to match analysis factors logic
    if (avgScore >= 95) return 'A+';
    if (avgScore >= 90) return 'A'; 
    if (avgScore >= 85) return 'B+';
    if (avgScore >= 80) return 'B';
    if (avgScore >= 75) return 'C+';
    if (avgScore >= 70) return 'C';
    if (avgScore >= 65) return 'D+';
    if (avgScore >= 60) return 'D';
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
      if (homeEdge > 0.01) { // Minimum 1% edge
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
      if (awayEdge > 0.01) {
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

    // Spread Recommendations
    if (odds.homeSpread && odds.awaySpread && odds.spreadLine) {
      // Home spread
      const homeSpreadEdge = prediction.homeSpreadProbability - this.oddsToImpliedProbability(odds.homeSpread);
      if (homeSpreadEdge > 0.01) {
        recommendations.push({
          betType: 'spread',
          selection: `${homeTeam} ${odds.spreadLine > 0 ? '+' : ''}${odds.spreadLine}`,
          odds: odds.homeSpread,
          impliedProbability: this.oddsToImpliedProbability(odds.homeSpread),
          predictedProbability: prediction.homeSpreadProbability,
          edge: homeSpreadEdge,
          grade: this.assignGrade(homeSpreadEdge, prediction.confidence),
          confidence: prediction.confidence,
          reasoning: `AI predicts ${homeTeam} covers ${(prediction.homeSpreadProbability * 100).toFixed(1)}% vs market ${(this.oddsToImpliedProbability(odds.homeSpread) * 100).toFixed(1)}%`,
          expectedValue: this.calculateExpectedValue(prediction.homeSpreadProbability, odds.homeSpread),
          kellyBetSize: this.calculateKellyBetSize(prediction.homeSpreadProbability, odds.homeSpread)
        });
      }

      // Away spread
      const awaySpreadEdge = prediction.awaySpreadProbability - this.oddsToImpliedProbability(odds.awaySpread);
      if (awaySpreadEdge > 0.01) {
        recommendations.push({
          betType: 'spread',
          selection: `${awayTeam} ${-odds.spreadLine > 0 ? '+' : ''}${-odds.spreadLine}`,
          odds: odds.awaySpread,
          impliedProbability: this.oddsToImpliedProbability(odds.awaySpread),
          predictedProbability: prediction.awaySpreadProbability,
          edge: awaySpreadEdge,
          grade: this.assignGrade(awaySpreadEdge, prediction.confidence),
          confidence: prediction.confidence,
          reasoning: `AI predicts ${awayTeam} covers ${(prediction.awaySpreadProbability * 100).toFixed(1)}% vs market ${(this.oddsToImpliedProbability(odds.awaySpread) * 100).toFixed(1)}%`,
          expectedValue: this.calculateExpectedValue(prediction.awaySpreadProbability, odds.awaySpread),
          kellyBetSize: this.calculateKellyBetSize(prediction.awaySpreadProbability, odds.awaySpread)
        });
      }
    }

    // Total (Over/Under) Recommendations
    if (odds.overOdds && odds.underOdds && odds.totalLine) {
      console.log(`📊 Analyzing totals: AI predicts ${prediction.predictedTotal} vs line ${odds.totalLine}`);
      
      // Calculate actual over/under probabilities based on predicted total vs line
      const difference = prediction.predictedTotal - odds.totalLine;
      const actualOverProbability = prediction.predictedTotal > odds.totalLine ? 
        0.5 + Math.min(0.45, Math.abs(difference) * 0.08) : 
        0.5 - Math.min(0.45, Math.abs(difference) * 0.08);
      
      const actualUnderProbability = 1 - actualOverProbability;
      
      console.log(`📈 Over probability: ${(actualOverProbability * 100).toFixed(1)}%`);
      console.log(`📉 Under probability: ${(actualUnderProbability * 100).toFixed(1)}%`);
      
      // Over recommendation
      const overImpliedProb = this.oddsToImpliedProbability(odds.overOdds);
      const overEdge = actualOverProbability - overImpliedProb;
      console.log(`🎯 Over edge: ${(overEdge * 100).toFixed(1)}% (AI: ${(actualOverProbability * 100).toFixed(1)}% vs Market: ${(overImpliedProb * 100).toFixed(1)}%)`);
      
      if (overEdge > 0.01) {
        const overRec = {
          betType: 'total' as const,
          selection: `Over ${odds.totalLine}`,
          odds: odds.overOdds,
          impliedProbability: overImpliedProb,
          predictedProbability: actualOverProbability,
          edge: overEdge,
          grade: this.assignGrade(overEdge, prediction.confidence),
          confidence: prediction.confidence,
          reasoning: `AI predicts ${prediction.predictedTotal.toFixed(1)} runs vs line ${odds.totalLine}. Over probability ${(actualOverProbability * 100).toFixed(1)}% vs market ${(overImpliedProb * 100).toFixed(1)}%`,
          expectedValue: this.calculateExpectedValue(actualOverProbability, odds.overOdds),
          kellyBetSize: this.calculateKellyBetSize(actualOverProbability, odds.overOdds)
        };
        console.log(`✅ Adding OVER recommendation with grade ${overRec.grade}`);
        recommendations.push(overRec);
      }

      // Under recommendation
      const underImpliedProb = this.oddsToImpliedProbability(odds.underOdds);
      const underEdge = actualUnderProbability - underImpliedProb;
      console.log(`🎯 Under edge: ${(underEdge * 100).toFixed(1)}% (AI: ${(actualUnderProbability * 100).toFixed(1)}% vs Market: ${(underImpliedProb * 100).toFixed(1)}%)`);
      
      if (underEdge > 0.01) {
        const underRec = {
          betType: 'total' as const,
          selection: `Under ${odds.totalLine}`,
          odds: odds.underOdds,
          impliedProbability: underImpliedProb,
          predictedProbability: actualUnderProbability,
          edge: underEdge,
          grade: this.assignGrade(underEdge, prediction.confidence),
          confidence: prediction.confidence,
          reasoning: `AI predicts ${prediction.predictedTotal.toFixed(1)} runs vs line ${odds.totalLine}. Under probability ${(actualUnderProbability * 100).toFixed(1)}% vs market ${(underImpliedProb * 100).toFixed(1)}%`,
          expectedValue: this.calculateExpectedValue(actualUnderProbability, odds.underOdds),
          kellyBetSize: this.calculateKellyBetSize(actualUnderProbability, odds.underOdds)
        };
        console.log(`✅ Adding UNDER recommendation with grade ${underRec.grade}`);
        recommendations.push(underRec);
      }
    }

    // Sort by grade and edge
    return recommendations.sort((a, b) => {
      const gradeOrder = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F'];
      const gradeComparison = gradeOrder.indexOf(a.grade) - gradeOrder.indexOf(b.grade);
      return gradeComparison !== 0 ? gradeComparison : b.edge - a.edge;
    });
  }
}