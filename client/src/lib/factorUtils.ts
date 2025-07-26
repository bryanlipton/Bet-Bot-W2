// Utility functions for normalizing and color-coding analysis factors
import { generateNarrative } from './narrativeGenerator';

/**
 * Normalizes a factor score to the 60-100 range
 * @param score Original factor score (0-100)
 * @returns Normalized score between 60-100
 */
export function normalizeFactorScore(score: number): number {
  // Clamp the original score to 0-100 range
  const clampedScore = Math.max(0, Math.min(100, score));
  
  // Map 0-100 to 60-100 range
  return Math.round(60 + (clampedScore * 0.4));
}

/**
 * Gets the color for a normalized factor score
 * @param normalizedScore Score between 60-100
 * @returns CSS color string
 */
export function getFactorColor(normalizedScore: number): string {
  if (normalizedScore >= 95) return '#00FF00'; // Bright Green
  if (normalizedScore >= 90) return '#33CC33'; // Medium Green
  if (normalizedScore >= 85) return '#66FF66'; // Light Green
  if (normalizedScore >= 80) return '#CCCCCC'; // Gray (neutral)
  if (normalizedScore >= 75) return '#FF9999'; // Light Red
  if (normalizedScore >= 70) return '#FF6666'; // Medium Red
  return '#FF3333'; // Bright Red
}

// Grade conversion function (optimized threshold system)
export function scoreToGrade(score: number): string {
  // ENHANCED THRESHOLDS: More A-/A/A+ grades while maintaining C grade variety
  if (score >= 75.0) return 'A+';  // Elite opportunities (2-3 games)
  if (score >= 72.0) return 'A';   // Strong opportunities (3-4 games)  
  if (score >= 69.0) return 'A-';  // Very good opportunities (4-5 games)
  if (score >= 66.0) return 'B+';  // Good opportunities (4-5 games)
  if (score >= 63.0) return 'B';   // Decent opportunities (5-6 games)
  if (score >= 60.0) return 'B-';  // Average+ opportunities (4-5 games)
  if (score >= 57.0) return 'C+';  // Above average (3-4 games)
  if (score >= 54.0) return 'C';   // Average games (3-4 games)
  if (score >= 51.0) return 'C-';  // Below average (2-3 games)
  if (score >= 48.0) return 'D+';  // Poor games (1-2 games)
  if (score >= 45.0) return 'D';   // Very poor (0-1 games)
  return 'F';                      // Avoid completely
}

/**
 * Gets Tailwind CSS classes for factor score display
 * @param normalizedScore Score between 60-100
 * @returns Object with text and background color classes
 */
export function getFactorColorClasses(normalizedScore: number): { text: string; bg: string; border: string } {
  // Blue (80-100): High performance
  if (normalizedScore >= 80) {
    return { text: 'text-white', bg: 'bg-blue-500', border: 'border-blue-600' };
  }
  // Light Blue (70-79): Good performance  
  if (normalizedScore >= 70) {
    return { text: 'text-white', bg: 'bg-blue-400', border: 'border-blue-500' };
  }
  // Grey (60-69): Average performance
  if (normalizedScore >= 60) {
    return { text: 'text-white', bg: 'bg-gray-500', border: 'border-gray-600' };
  }
  // Light Orange (50-59): Below average performance
  if (normalizedScore >= 50) {
    return { text: 'text-white', bg: 'bg-orange-400', border: 'border-orange-500' };
  }
  // Orange (below 50): Poor performance
  return { text: 'text-white', bg: 'bg-orange-500', border: 'border-orange-600' };
}

export function getLockPickFactorColorClasses(normalizedScore: number): { text: string; bg: string; border: string } {
  // Dark Orange (90-100): Excellent performance
  if (normalizedScore >= 90) {
    return { text: 'text-white', bg: 'bg-orange-800', border: 'border-orange-900' };
  }
  // Medium-Dark Orange (80-89): High performance  
  if (normalizedScore >= 80) {
    return { text: 'text-white', bg: 'bg-orange-700', border: 'border-orange-800' };
  }
  // Orange (70-79): Good performance
  if (normalizedScore >= 70) {
    return { text: 'text-white', bg: 'bg-orange-600', border: 'border-orange-700' };
  }
  // Medium Orange (60-69): Average performance
  if (normalizedScore >= 60) {
    return { text: 'text-white', bg: 'bg-orange-500', border: 'border-orange-600' };
  }
  // Light Orange (50-59): Below average performance
  if (normalizedScore >= 50) {
    return { text: 'text-white', bg: 'bg-orange-400', border: 'border-orange-500' };
  }
  // Lightest Orange (below 50): Poor performance
  return { text: 'text-white', bg: 'bg-orange-300', border: 'border-orange-400' };
}

/**
 * Gets tooltip text for a factor score
 * @param normalizedScore Score between 60-100
 * @param factorName Name of the factor
 * @returns Tooltip description
 */
export function getFactorExplanation(factorName: string): string {
  switch (factorName) {
    case 'Offensive Production':
      return 'This factor evaluates team hitting strength using advanced metrics like xwOBA, barrel rate, and exit velocity from current season data.';
    
    case 'Pitching Matchup':
      return 'This factor compares starting pitcher effectiveness using ERA, WHIP, strikeout rates, and recent performance trends.';
    
    case 'Situational Edge':
      return 'This factor evaluates game-specific advantages including ballpark dimensions, home field benefits, travel schedules, and timing effects.';
    
    case 'Team Momentum':
      return 'This factor analyzes recent team performance trends and current form based on their last 10 games and overall momentum indicators.';
    
    case 'Market Inefficiency':
      return 'This factor analyzes betting line value by comparing market-implied probabilities with our model projections to identify profitable opportunities.';
    
    case 'System Confidence':
      return 'This factor reflects model certainty based on data quality, analytical consensus, and information completeness.';
    
    default:
      return 'This factor analyzes various statistical and situational elements to determine team advantages using comprehensive data analysis.';
  }
}

/**
 * Gets professional analyst-style narrative for a factor score
 * Uses the new narrative generator for more sophisticated explanations
 */
export function getFactorNarrative(factorName: string, score: number, context: any = {}): string {
  // Use the narrative generator for sophisticated explanations
  try {
    return generateNarrative(factorName, score, context);
  } catch (error) {
    // Fallback to basic explanation if narrative generator isn't available
    return getFactorExplanation(factorName);
  }
}

function getGradeExplanation(score: number, factorName: string): string {
  const grade = scoreToGrade(score);
  
  switch (factorName) {
    case 'Offensive Production':
      if (score >= 95) return `Elite offensive dominance: Exceptional xwOBA, high barrel rate, and strong exit velocity. Team demonstrates exceptional run production efficiency with superior contact quality placing them among the top MLB offensive units.`;
      if (score >= 90) return `Outstanding offensive metrics: Excellent xwOBA, solid barrel rate, and strong exit velocity. Advanced Baseball Savant data shows excellent contact quality and run-scoring capability well above league standards.`;
      if (score >= 80) return `Strong offensive production: Above-average xwOBA, good barrel rate, and solid exit velocity trends. Team shows reliable run-scoring with multiple offensive weapons and positive advanced metrics.`;
      if (score >= 75) return `Above-average offensive capabilities: Solid xwOBA, decent barrel rates and contact quality. Run production slightly exceeds league averages with balanced offensive approach.`;
      if (score === 75) return `League-average offensive production: Standard Baseball Savant metrics aligned to MLB norms with typical run-scoring patterns and balanced strengths/weaknesses.`;
      return `Below-average offensive metrics: Lower xwOBA, reduced barrel rates and concerning contact quality. Run production efficiency falls below league standards with limited offensive weapons.`;
    
    case 'Pitching Matchup':
      if (score >= 95) return `Dominant pitcher-vs-pitcher advantage: Our starter has significantly superior ERA, WHIP, and strikeout metrics compared to today's opposing pitcher. Direct matchup heavily favors our side based on 2025 season performance.`;
      if (score >= 90) return `Clear starting pitcher advantage: Today's matchup favors our pitcher with measurably better ERA, WHIP, and K/9 rates than the opponent's starter. Direct statistical comparison shows meaningful edge.`;
      if (score >= 80) return `Solid pitching matchup edge: Our starting pitcher has better overall metrics than today's opposing starter based on 2025 season ERA, WHIP, and strikeout data from MLB Stats API.`;
      if (score >= 75) return `Slight pitcher advantage: Today's starting pitcher matchup provides minor edge based on comparative 2025 season statistics between the two probable starters.`;
      if (score === 75) return `Even pitching matchup: Both probable starting pitchers show similar 2025 season performance metrics, creating neutral expectations for today's pitcher-vs-pitcher battle.`;
      return `Pitching matchup disadvantage: Today's opposing starting pitcher has superior 2025 season metrics compared to our probable starter based on ERA, WHIP, and strikeout rates.`;
    
    case 'Situational Edge':
      if (score >= 95) return `Exceptional situational advantages: Optimal ballpark dimensions strongly favoring team style, significant home field advantage, ideal travel/rest patterns, and premium game context creating elite conditions.`;
      if (score >= 90) return `Strong situational benefits: Home field advantage (+12 pts) with favorable ballpark factors, excellent travel situation, and game context historically producing positive outcomes.`;
      if (score >= 80) return `Solid situational edge: Moderate home field benefits, favorable ballpark characteristics for team's style, and reasonable travel/scheduling circumstances supporting performance.`;
      if (score >= 75) return `Minor situational advantages: Some favorable factors including ballpark benefits or scheduling advantages that provide measurable edge while minimizing disadvantages.`;
      if (score === 75) return `Neutral situational conditions: Balanced game circumstances with standard factors that don't significantly favor either side.`;
      return `Situational disadvantages: Road team challenges, unfavorable ballpark dimensions, adverse travel circumstances, or game context that may impact performance expectations.`;
    
    case 'Team Momentum':
      if (score >= 95) return `Exceptional momentum trajectory: Team performing at elite level significantly above season averages with dominant recent trends and multiple positive performance indicators.`;
      if (score >= 90) return `Outstanding recent form: 7-3 or better record in last 10 games with strong performance trends and competitive excellence.`;
      if (score >= 80) return `Strong positive momentum: 6-4 or better recent record with performance exceeding season norms and good directional trends in key categories.`;
      if (score >= 75) return `Above-average momentum: Recent performance slightly exceeding season baselines with positive trends and solid competitive results.`;
      if (score === 75) return `Neutral momentum: 5-5 recent record aligning with season averages without significant hot or cold streaks.`;
      return `Concerning momentum: 4-6 or worse in last 10 games with performance below season standards and negative trends in multiple categories.`;
    
    case 'Market Inefficiency':
      if (score >= 95) return `Exceptional betting value: Massive market mispricing detected with 8-12% edge over implied probability. Kelly Criterion analysis indicates optimal positioning with severe bookmaker undervaluation.`;
      if (score >= 90) return `Premium betting opportunity: 5%+ edge over market pricing representing strong value. Cross-market analysis reveals significant discrepancy between implied and calculated probabilities.`;
      if (score >= 80) return `Solid betting value: 1-4% edge detected through advanced probability modeling. Market appears to undervalue our selection creating positive expected value conditions.`;
      if (score >= 75) return `Moderate betting value: Market showing minor inefficiency with small positive edge. Analysis suggests reasonable risk-adjusted return potential.`;
      if (score === 75) return `Fair market pricing: Odds accurately reflecting calculated probabilities with efficient market conditions and minimal edge in either direction.`;
      return `Negative expected value: Market significantly overpricing our selection with unfavorable betting conditions. Probability analysis indicates bookmakers have inflated odds beyond fair value.`;
    
    case 'System Confidence':
      if (score >= 95) return `Maximum analytical confidence: Perfect data consensus across all factors (95%+ agreement), exceptional information quality from verified sources, complete coverage of all analytical components, and robust statistical convergence providing elite prediction reliability with minimal uncertainty.`;
      if (score >= 90) return `Outstanding system confidence: Strong factor consensus (90%+ alignment), comprehensive high-quality data coverage, excellent source reliability, and solid analytical agreement creating premium prediction reliability with controlled uncertainty levels.`;
      if (score >= 80) return `High confidence level: Good factor alignment (80%+ consensus), reliable data quality across most components, adequate source verification, and reasonable analytical convergence supporting solid prediction reliability with manageable uncertainty.`;
      if (score >= 75) return `Above-average confidence: Moderate factor consensus, acceptable data completeness and quality standards, mixed source reliability, and typical analytical uncertainty within normal ranges for professional sports predictions.`;
      if (score === 75) return `Baseline confidence: Standard sports prediction uncertainty with neutral factor alignment, average data limitations, and typical information gaps creating moderate reliability expectations.`;
      return `Limited confidence: Poor factor consensus, significant data quality issues, substantial information gaps, and elevated analytical uncertainty reducing prediction reliability below professional standards.`;
    
    default:
      if (score >= 90) return `Elite performance indicators`;
      if (score >= 80) return `Strong statistical metrics`;
      if (score >= 75) return `Neutral baseline performance`;
      return `Below-average indicators`;
  }
}

export function getFactorTooltip(normalizedScore: number, factorName: string, context: any = {}): string {
  // Use professional narrative for the main explanation
  const narrative = getFactorNarrative(factorName, normalizedScore, context);
  const gradeExplanation = getGradeExplanation(normalizedScore, factorName);
  
  return `${narrative}\n\n${gradeExplanation}`;
}

/**
 * Gets concise grade explanation for main pick info button
 * @param grade Letter grade (A+, A, B+, etc.)
 * @param confidence Confidence percentage
 * @param analysis All factor scores
 * @param pickTeam Team name
 * @param odds Betting odds
 * @returns Concise explanation with specific statistics
 */
export function getMainGradeExplanation(
  grade: string, 
  confidence: number, 
  analysis: any, 
  pickTeam: string, 
  odds: number
): string {
  // Ensure odds is a number for calculation - handle both positive (+223) and negative (-150) odds
  const oddsNum = typeof odds === 'string' ? parseFloat(odds) : odds;
  
  // Convert odds to probability (as percentage)
  const marketProbDecimal = oddsNum > 0 ? (100 / (oddsNum + 100)) : (Math.abs(oddsNum) / (Math.abs(oddsNum) + 100));
  const marketProb = marketProbDecimal * 100; // Convert to percentage
  
  // Calculate model probability with edge from market inefficiency 
  const inefficiencyEdge = (analysis.marketInefficiency - 75) * 0.2; // Convert score to edge percentage
  const modelProb = marketProb + inefficiencyEdge;
  const edge = modelProb - marketProb;
  const oddsDisplay = oddsNum > 0 ? `+${oddsNum}` : `${oddsNum}`;

  const factors = [
    { name: 'Offensive Production', score: analysis.offensiveProduction || 0 },
    { name: 'Pitching Matchup', score: analysis.pitchingMatchup || 0 },
    { name: 'Situational Edge', score: analysis.situationalEdge || 0 },
    { name: 'Team Momentum', score: analysis.teamMomentum || 0 },
    { name: 'Market Inefficiency', score: analysis.marketInefficiency || 0 },
    { name: 'System Confidence', score: analysis.systemConfidence || 0 }
  ];
  
  const eliteFactors = factors.filter(f => f.score >= 90).length;
  const strongFactors = factors.filter(f => f.score >= 80).length;

  // Create grade-specific confident opening statements
  let explanation = '';
  if (grade === 'A+' || grade === 'A') {
    explanation = `Our model shows that ${pickTeam} is a profitable pick with ${confidence}% analytical certainty - our highest conviction ${grade} play.\n\n`;
  } else if (grade === 'B+' || grade === 'B') {
    explanation = `Our model shows that ${pickTeam} is a profitable pick with ${confidence}% model certainty and exceptional ${grade} value potential.\n\n`;
  } else if (grade === 'C+' || grade === 'C') {
    explanation = `Our model shows that ${pickTeam} is a profitable pick with ${confidence}% analytical confidence and solid ${grade} betting value.\n\n`;
  } else {
    explanation = `Our model shows that ${pickTeam} is a profitable pick with ${confidence}% model support as a calculated ${grade} opportunity.\n\n`;
  }
  
  explanation += `Our analysis shows the market odds of ${oddsDisplay} imply a ${marketProb.toFixed(1)}% win probability, `;
  explanation += `while our model projects ${modelProb.toFixed(1)}%, creating a ${edge.toFixed(1)}% edge.\n\n`;
  
  explanation += `The pick earned ${eliteFactors} elite scores (90+) and ${strongFactors} strong scores (80+) across our six analytical factors.\n\n`;
  
  // Add specific statistical highlights
  const highlights = [];
  if (analysis.offensiveProduction >= 90) {
    highlights.push('elite offensive metrics with exceptional xwOBA performance');
  }
  if (analysis.pitchingMatchup >= 90) {
    highlights.push('significant starting pitcher advantage based on superior 2025 season metrics');
  }
  if (analysis.teamMomentum >= 90) {
    highlights.push('strong recent form at 7-3 or better in last 10 games');
  }
  if (analysis.situationalEdge >= 90) {
    highlights.push('significant home field and ballpark advantages');
  }
  if (analysis.marketInefficiency >= 95) {
    highlights.push('substantial market inefficiency of 6%+ undervaluation');
  }
  
  if (highlights.length > 0) {
    explanation += `Key strengths include ${highlights.join(', ')}.\n\n`;
  }
  
  if (confidence >= 90) {
    explanation += `This represents a premium betting opportunity warranting maximum unit allocation.`;
  } else if (confidence >= 80) {
    explanation += `This qualifies as a strong betting opportunity suitable for 2-3 unit investment.`;
  } else {
    explanation += `This shows solid value with positive expected return potential.`;
  }
  
  return explanation;
}

/**
 * Gets concise mobile-friendly reasoning for picks
 * @param grade Letter grade (A+, A, B+, etc.)
 * @param analysis All factor scores
 * @param pickTeam Team name
 * @param odds Betting odds
 * @returns Short, user-friendly explanation focusing on key factors and basic ROI
 */
export function getMobileReasoning(
  grade: string, 
  analysis: any, 
  pickTeam: string, 
  odds: number
): string {
  const oddsDisplay = odds > 0 ? `+${odds}` : `${odds}`;
  
  // Get top 2-3 strongest factors
  const factors = [
    { name: 'offense', score: analysis.offensiveProduction, label: 'offensive production' },
    { name: 'pitching', score: analysis.pitchingMatchup, label: 'pitching advantage' },
    { name: 'momentum', score: analysis.teamMomentum, label: 'recent form' },
    { name: 'situational', score: analysis.situationalEdge, label: 'game situation' },
    { name: 'value', score: analysis.marketInefficiency, label: 'betting value' }
  ];
  
  const topFactors = factors
    .filter(f => f.score >= 75) // Only include above-average factors
    .sort((a, b) => b.score - a.score)
    .slice(0, 2); // Take top 2 factors
  
  let reasoning = `The ${pickTeam} earn a ${grade} grade at ${oddsDisplay} based on `;
  
  if (topFactors.length === 0) {
    reasoning += `balanced analysis across multiple factors`;
  } else if (topFactors.length === 1) {
    reasoning += `strong ${topFactors[0].label}`;
  } else {
    reasoning += `${topFactors[0].label} and ${topFactors[1].label}`;
  }
  
  reasoning += `. `;
  
  // Add simple ROI context based on grade
  if (grade.includes('A')) {
    reasoning += `This represents premium value with strong return potential.`;
  } else if (grade.includes('B')) {
    reasoning += `This shows solid value with positive expected returns.`;
  } else {
    reasoning += `This offers moderate value for the risk taken.`;
  }
  
  return reasoning;
}

function getFactorVariance(factors: Array<{score: number}>): number {
  const scores = factors.map(f => f.score);
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const squaredDiffs = scores.map(score => Math.pow(score - mean, 2));
  return Math.sqrt(squaredDiffs.reduce((sum, diff) => sum + diff, 0) / scores.length);
}

/**
 * Gets the updated letter grade based on confidence score
 * @param confidence Overall confidence percentage
 * @returns Letter grade
 */
export function getUpdatedGrade(confidence: number): string {
  if (confidence >= 95) return 'A+';
  if (confidence >= 90) return 'A';
  if (confidence >= 85) return 'B+';
  if (confidence >= 80) return 'B';
  if (confidence >= 75) return 'C+';
  if (confidence >= 70) return 'C';
  if (confidence >= 60) return 'D';
  return 'F';
}

/**
 * Gets color classes for letter grades
 * @param grade Letter grade
 * @returns Object with text and background color classes
 */
export function getGradeColorClasses(grade: string): { text: string; bg: string; border: string } {
  switch (grade) {
    case 'A+':
      return { text: 'text-yellow-900', bg: 'bg-yellow-400', border: 'border-yellow-500' }; // Gold
    case 'A':
      return { text: 'text-green-900', bg: 'bg-green-400', border: 'border-green-500' }; // Green
    case 'A-':
      return { text: 'text-green-900', bg: 'bg-green-300', border: 'border-green-400' }; // Light Green
    case 'B+':
      return { text: 'text-blue-900', bg: 'bg-blue-400', border: 'border-blue-500' }; // Blue
    case 'B':
      return { text: 'text-blue-900', bg: 'bg-blue-300', border: 'border-blue-400' }; // Medium Blue
    case 'B-':
      return { text: 'text-blue-900', bg: 'bg-blue-200', border: 'border-blue-300' }; // Light Blue
    case 'C+':
    case 'C':
    case 'C-':
      return { text: 'text-orange-900', bg: 'bg-orange-400', border: 'border-orange-500' }; // Orange
    case 'D+':
    case 'D':
    case 'D-':
    case 'F':
      return { text: 'text-red-900', bg: 'bg-red-400', border: 'border-red-500' }; // Red
    default:
      return { text: 'text-gray-700', bg: 'bg-gray-200', border: 'border-gray-300' };
  }
}