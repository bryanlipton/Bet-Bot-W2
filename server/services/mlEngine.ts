export interface EdgeCalculation {
  edge: number;
  modelProbability: number;
  impliedProbability: number;
  expectedValue: number;
  confidence: number;
}

export interface ModelPrediction {
  homeWinProbability: number;
  awayWinProbability: number;
  overProbability: number;
  underProbability: number;
  homeSpreadProbability: number;
  awaySpreadProbability: number;
  confidence: number;
}

export class MLEngine {
  calculateImpliedProbability(americanOdds: number): number {
    if (americanOdds > 0) {
      return 100 / (americanOdds + 100);
    } else {
      return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
    }
  }

  calculateEdge(modelProbability: number, impliedProbability: number): number {
    return ((modelProbability - impliedProbability) / impliedProbability) * 100;
  }

  calculateExpectedValue(probability: number, odds: number, stake: number = 100): number {
    const winAmount = odds > 0 ? (odds / 100) * stake : (100 / Math.abs(odds)) * stake;
    const loseAmount = -stake;
    return (probability * winAmount) + ((1 - probability) * loseAmount);
  }

  analyzeOddsForEdge(gameData: any, oddsData: any): EdgeCalculation[] {
    const edges: EdgeCalculation[] = [];
    
    // Mock ML model predictions - in production, this would call actual ML models
    const predictions = this.generateModelPredictions(gameData);
    
    for (const bookmaker of oddsData.bookmakers || []) {
      for (const market of bookmaker.markets || []) {
        for (const outcome of market.outcomes || []) {
          const impliedProb = this.calculateImpliedProbability(outcome.price);
          let modelProb = 0.5; // Default
          
          // Map outcomes to model predictions
          if (market.key === 'h2h') {
            if (outcome.name === gameData.homeTeam) {
              modelProb = predictions.homeWinProbability;
            } else if (outcome.name === gameData.awayTeam) {
              modelProb = predictions.awayWinProbability;
            }
          } else if (market.key === 'totals') {
            if (outcome.name === 'Over') {
              modelProb = predictions.overProbability;
            } else if (outcome.name === 'Under') {
              modelProb = predictions.underProbability;
            }
          } else if (market.key === 'spreads') {
            if (outcome.name === gameData.homeTeam) {
              modelProb = predictions.homeSpreadProbability;
            } else if (outcome.name === gameData.awayTeam) {
              modelProb = predictions.awaySpreadProbability;
            }
          }
          
          const edge = this.calculateEdge(modelProb, impliedProb);
          const expectedValue = this.calculateExpectedValue(modelProb, outcome.price);
          
          edges.push({
            edge,
            modelProbability: modelProb * 100,
            impliedProbability: impliedProb * 100,
            expectedValue,
            confidence: predictions.confidence
          });
        }
      }
    }
    
    return edges.filter(edge => edge.edge > 2); // Only return edges > 2%
  }

  generateModelPredictions(gameData: any): ModelPrediction {
    // Mock ML model - in production, this would use actual trained models
    // This simulates various factors like team strength, home advantage, etc.
    
    const baseHomeWin = 0.52; // Home field advantage
    const randomFactor = (Math.random() - 0.5) * 0.3; // ±15% randomness
    
    const homeWinProb = Math.max(0.1, Math.min(0.9, baseHomeWin + randomFactor));
    const awayWinProb = 1 - homeWinProb;
    
    // Total predictions (Over/Under)
    const overProb = 0.48 + (Math.random() - 0.5) * 0.2;
    const underProb = 1 - overProb;
    
    // Spread predictions
    const homeSpreadProb = 0.5 + (Math.random() - 0.5) * 0.2;
    const awaySpreadProb = 1 - homeSpreadProb;
    
    return {
      homeWinProbability: homeWinProb,
      awayWinProbability: awayWinProb,
      overProbability: overProb,
      underProbability: underProb,
      homeSpreadProbability: homeSpreadProb,
      awaySpreadProbability: awaySpreadProb,
      confidence: 70 + Math.random() * 25 // 70-95% confidence
    };
  }

  updateModelMetrics(sportKey: string, predictions: any[], actualResults: any[]): {
    accuracy: number;
    edgeDetectionRate: number;
    profitMargin: number;
  } {
    // Mock model performance calculation
    // In production, this would analyze actual prediction vs outcome data
    
    const accuracy = 68 + Math.random() * 12; // 68-80%
    const edgeDetectionRate = 60 + Math.random() * 15; // 60-75%
    const profitMargin = 8 + Math.random() * 10; // 8-18%
    
    return {
      accuracy: parseFloat(accuracy.toFixed(1)),
      edgeDetectionRate: parseFloat(edgeDetectionRate.toFixed(1)),
      profitMargin: parseFloat(profitMargin.toFixed(1))
    };
  }

  calculateKellyBet(edge: number, odds: number, bankroll: number): {
    suggestedBet: number;
    kellyPercentage: number;
  } {
    const probability = edge / 100 + this.calculateImpliedProbability(odds);
    const b = odds > 0 ? odds / 100 : 100 / Math.abs(odds);
    
    const kellyPercentage = (probability * (b + 1) - 1) / b;
    const suggestedBet = Math.max(0, Math.min(bankroll * 0.05, bankroll * kellyPercentage)); // Cap at 5% of bankroll
    
    return {
      suggestedBet: parseFloat(suggestedBet.toFixed(2)),
      kellyPercentage: parseFloat((kellyPercentage * 100).toFixed(2))
    };
  }
}

export const mlEngine = new MLEngine();
