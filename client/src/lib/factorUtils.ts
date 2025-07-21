// Utility functions for normalizing and color-coding analysis factors
import { getFactorNarrative } from './narrativeGenerator';

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

// Grade conversion function (matching DailyPick component)
function scoreToGrade(score: number): string {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 85) return 'B+';
  if (score >= 80) return 'B';
  if (score >= 75) return 'C+';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
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
      return 'This factor measures recent team performance using official MLB data to analyze momentum trends and current form.';
    
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
  // Import the narrative generator dynamically to avoid circular dependencies
  try {
    const { generateNarrative } = require('./narrativeGenerator');
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
      if (score >= 90) return `xwOBA .340+, barrel rate 7%+, 86+ mph exit velocity`;
      if (score >= 80) return `xwOBA .310-.339, barrel rate 4.5-6.9%, solid contact`;
      if (score >= 75) return `xwOBA .300-.309, league average production`;
      return `xwOBA under .300, below-average offensive metrics`;
    
    case 'Pitching Matchup':
      if (score >= 90) return `ERA under 3.25, WHIP under 1.20, K/9 over 9.0`;
      if (score >= 80) return `ERA 3.25-4.25, WHIP 1.20-1.40, decent metrics`;
      if (score >= 75) return `ERA 4.25-4.75, league average starter`;
      return `ERA over 4.75, poor pitching metrics`;
    
    case 'Situational Edge':
      if (score >= 90) return `Home field (+12 pts) with favorable ballpark factors`;
      if (score >= 80) return `Minor situational advantages present`;
      if (score >= 75) return `Neutral situational conditions`;
      return `Road team or unfavorable conditions`;
    
    case 'Team Momentum':
      if (score >= 90) return `7-3 or better in L10 games, strong recent form`;
      if (score >= 80) return `6-4 in L10, slightly positive momentum`;
      if (score >= 75) return `5-5 in L10, neutral momentum`;
      return `4-6 or worse in L10, concerning trends`;
    
    case 'Market Inefficiency':
      if (score >= 90) return `5%+ edge over market pricing, strong value`;
      if (score >= 80) return `1-4% edge, slight value opportunity`;
      if (score >= 75) return `Fair market pricing, no significant edge`;
      return `Negative expected value, poor betting line`;
    
    case 'System Confidence':
      if (score >= 90) return `Complete data, low variance, high certainty`;
      if (score >= 80) return `Good data quality, minor gaps`;
      if (score >= 75) return `Standard data quality, normal uncertainty`;
      return `Poor data quality, high uncertainty`;
    
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
  const marketProb = odds > 0 ? (100 / (odds + 100)) * 100 : (Math.abs(odds) / (Math.abs(odds) + 100)) * 100;
  const modelProb = marketProb + ((analysis.marketInefficiency - 75) * 0.2);
  const edge = modelProb - marketProb;
  const oddsDisplay = odds > 0 ? `+${odds}` : `${odds}`;

  const factors = [
    { name: 'Offensive Production', score: analysis.offensiveProduction },
    { name: 'Pitching Matchup', score: analysis.pitchingMatchup },
    { name: 'Situational Edge', score: analysis.situationalEdge },
    { name: 'Team Momentum', score: analysis.teamMomentum },
    { name: 'Market Inefficiency', score: analysis.marketInefficiency },
    { name: 'System Confidence', score: analysis.systemConfidence }
  ];
  
  const eliteFactors = factors.filter(f => f.score >= 90).length;
  const strongFactors = factors.filter(f => f.score >= 80).length;

  let explanation = `This ${grade} grade reflects ${confidence}% model confidence in ${pickTeam}. `;
  
  explanation += `Our analysis shows the market odds of ${oddsDisplay} imply a ${marketProb.toFixed(1)}% win probability, `;
  explanation += `while our model projects ${modelProb.toFixed(1)}%, creating a ${edge.toFixed(1)}% edge. `;
  
  explanation += `The pick earned ${eliteFactors} elite scores (90+) and ${strongFactors} strong scores (80+) across our six analytical factors. `;
  
  // Add specific statistical highlights
  const highlights = [];
  if (analysis.offensiveProduction >= 90) {
    highlights.push('elite offensive metrics with xwOBA above .340');
  }
  if (analysis.pitchingMatchup >= 90) {
    highlights.push('probable starter advantage with sub-3.25 ERA');
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
    explanation += `Key strengths include ${highlights.join(', ')}. `;
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
    case 'B+':
    case 'B':
      return { text: 'text-blue-900', bg: 'bg-blue-400', border: 'border-blue-500' }; // Blue
    case 'C+':
    case 'C':
      return { text: 'text-orange-900', bg: 'bg-orange-400', border: 'border-orange-500' }; // Orange
    case 'D':
    case 'F':
      return { text: 'text-red-900', bg: 'bg-red-400', border: 'border-red-500' }; // Red
    default:
      return { text: 'text-gray-700', bg: 'bg-gray-200', border: 'border-gray-300' };
  }
}