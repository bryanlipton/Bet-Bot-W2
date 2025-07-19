// Utility functions for normalizing and color-coding analysis factors

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
  // Blue (90-100): Excellent/Elite performance
  if (normalizedScore >= 90) {
    return { text: 'text-white', bg: 'bg-blue-500', border: 'border-blue-600' };
  }
  // Green (75-89): Good performance  
  if (normalizedScore >= 75) {
    return { text: 'text-white', bg: 'bg-green-500', border: 'border-green-600' };
  }
  // Yellow (65-74): Average/Below average performance
  if (normalizedScore >= 65) {
    return { text: 'text-black', bg: 'bg-yellow-400', border: 'border-yellow-500' };
  }
  // Red (60-64): Poor performance
  return { text: 'text-white', bg: 'bg-red-500', border: 'border-red-600' };
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
      return 'CALCULATION: Combines Baseball Savant xwOBA (expected weighted on-base average), barrel percentage (optimal launch angle + exit velocity), and average exit velocity from 2025 season data.\n\nMETRICS USED:\n• Expected wOBA (xwOBA): Quality of contact metric\n• Barrel Rate: % of batted balls with ideal launch conditions\n• Exit Velocity: Average mph off the bat\n• Team Win Percentage: 2025 season wins/total games\n• Run Production Efficiency: Runs scored per quality contact\n\nSCORING: Raw metrics compared to league percentiles, normalized to 60-100 scale using formula: 60 + (percentile × 0.4). Elite teams (top 10%) score 90+, while bottom teams score 60-70.';
    
    case 'Pitching Matchup':
      return 'CALCULATION: Analyzes probable starting pitcher performance using current season ERA, WHIP (walks + hits per inning), K/9 (strikeouts per 9 innings), and recent form.\n\nMETRICS USED:\n• ERA: Earned runs allowed per 9 innings (2025 season)\n• WHIP: Base runners allowed per inning pitched\n• Strikeout Rate: K/9 innings pitched\n• Opponent Batting Average Against\n• Recent Performance: Last 5 starts trend\n• Matchup History: Head-to-head results vs opposing team\n\nSCORING: Pitcher quality ranked against league averages. Sub-3.00 ERA + low WHIP + high K-rate = 90+ score. Poor matchups with ERA 5.00+ score 60-70.';
    
    case 'Situational Edge':
      return 'CALCULATION: Multi-factor ballpark and situational advantage analysis using verified stadium data and game conditions.\n\nFACTORS ANALYZED:\n• Home Field Advantage: +12 points (home), -8 points (away)\n• Ballpark Factors: Hitter/pitcher friendly ratings (-3 to +3)\n  - Fenway Park: +3 (hitter friendly)\n  - Petco Park: -2 (pitcher friendly)\n  - Coors Field: +3 (altitude advantage)\n• Game Timing: Day vs night game effects\n• Travel Schedule: Rest days and travel fatigue\n• Weather Conditions: Wind, temperature impact\n\nSCORING: Base 50, adjusted by situational factors. Home teams in hitter-friendly parks can reach 90+, while road teams in pitcher parks score 60-70.';
    
    case 'Team Momentum':
      return 'CALCULATION: Three-layer momentum analysis using official MLB Stats API with weighted recent performance metrics.\n\nCOMPONENTS (weighted %):\n• Recent Record (40%): Last 10 games win percentage\n• Trend Direction (30%): L5 games vs previous 5 games\n• Performance vs Season (30%): L10 rate vs overall season rate\n\nMETRICS TRACKED:\n• L10 Record: Wins-losses in last 10 completed games\n• Momentum Trend: Recent 5 vs previous 5 comparison\n• Context: Recent form relative to season expectation\n• Hot/Cold Streaks: Current win/loss streaks\n\nSCORING: Teams 9-1 or 8-2 in L10 score 90+. Teams 3-7 or worse score 60-70. Normalized using real MLB game results, not projections.';
    
    case 'Market Inefficiency':
      return 'CALCULATION: Advanced betting value analysis comparing our model probability vs market-implied probability using Kelly Criterion optimization.\n\nMETRICS CALCULATED:\n• Model Win Probability: Our projected team win chance\n• Implied Probability: Calculated from betting odds\n• Edge Percentage: Difference between model and market\n• Kelly Fraction: Optimal bet size based on edge\n• Expected Value: Long-term profit expectation\n• Market Efficiency Score: How accurate oddsmakers are\n\nFORMULA: Edge = (Model Prob × Odds) - 1\nKelly = (Edge × Model Prob - (1 - Model Prob)) / Edge\n\nSCORING: Significant positive edges (5%+) score 90+. Fair market pricing scores 75. Negative edges score 60-70.';
    
    case 'System Confidence':
      return 'CALCULATION: Data quality assessment and analytical consensus measurement across all factors with variance analysis.\n\nDATA QUALITY WEIGHTS:\n• Offensive Data Quality (20%): Availability of advanced metrics\n• Pitching Data Quality (25%): Starter information completeness\n• Situational Data (15%): Venue and contextual factors\n• Momentum Data (25%): Depth of recent performance data\n• Market Data (15%): Odds reliability and market depth\n\nCONFIDENCE FACTORS:\n• Factor Consensus: Agreement between analytical components\n• Data Variance: Lower variance = higher confidence\n• Information Completeness: Missing vs available data points\n• Historical Accuracy: Model performance in similar situations\n\nSCORING: Base 75 + weighted adjustments. Low variance with complete data = 95+. High uncertainty or missing data = 60-70.';
    
    default:
      return 'This factor analyzes various statistical and situational elements to determine team advantages using comprehensive data analysis.';
  }
}

function getGradeExplanation(score: number, factorName: string): string {
  const grade = scoreToGrade(score);
  
  switch (factorName) {
    case 'Offensive Production':
      if (score >= 95) return `A+ (${score}): Elite offensive metrics - team shows exceptional hitting power with top-tier xwOBA and barrel rates.`;
      if (score >= 90) return `A (${score}): Strong offensive advantage - above-average hitting metrics with consistent run production.`;
      if (score >= 85) return `B+ (${score}): Good offensive edge - solid hitting metrics with moderate scoring efficiency.`;
      if (score >= 80) return `B (${score}): Slight offensive advantage - batting metrics slightly above league average.`;
      if (score >= 75) return `C+ (${score}): Neutral offensive production - average hitting metrics for this level.`;
      if (score >= 70) return `C (${score}): Below-average offense - hitting metrics trailing league standards.`;
      if (score >= 60) return `D (${score}): Poor offensive production - significantly below-average hitting with low run scoring.`;
      return `F (${score}): Extremely poor offense - bottom-tier hitting metrics with minimal run production.`;
    
    case 'Pitching Matchup':
      if (score >= 95) return `A+ (${score}): Dominant pitching advantage - starter has elite ERA, WHIP, and strikeout rates vs weak opposing offense.`;
      if (score >= 90) return `A (${score}): Strong pitching edge - quality starter with favorable matchup metrics.`;
      if (score >= 85) return `B+ (${score}): Good pitching advantage - solid starter with decent matchup indicators.`;
      if (score >= 80) return `B (${score}): Slight pitching edge - starter has marginal advantage in this matchup.`;
      if (score >= 75) return `C+ (${score}): Even pitching matchup - starters are relatively comparable in quality.`;
      if (score >= 70) return `C (${score}): Slight pitching disadvantage - opposing starter has better recent metrics.`;
      if (score >= 60) return `D (${score}): Poor pitching matchup - starter faces significantly stronger opposing offense.`;
      return `F (${score}): Extremely poor pitching spot - weak starter against elite opposing offense.`;
    
    case 'Situational Edge':
      if (score >= 95) return `A+ (${score}): Maximum situational advantage - perfect ballpark fit with strong home field advantage and favorable conditions.`;
      if (score >= 90) return `A (${score}): Strong situational edge - ballpark and conditions clearly favor this team's strengths.`;
      if (score >= 85) return `B+ (${score}): Good situational advantage - stadium dimensions and conditions provide moderate edge.`;
      if (score >= 80) return `B (${score}): Slight situational edge - minor advantages from ballpark or game conditions.`;
      if (score >= 75) return `C+ (${score}): Neutral situational factors - balanced conditions with no clear advantage.`;
      if (score >= 70) return `C (${score}): Slight situational disadvantage - conditions may slightly favor opponent.`;
      if (score >= 60) return `D (${score}): Poor situational spot - ballpark and conditions work against this team.`;
      return `F (${score}): Extremely poor situational factors - all conditions heavily favor opponent.`;
    
    case 'Team Momentum':
      if (score >= 95) return `A+ (${score}): Red-hot momentum - team is 9-1 or 8-2 in L10 with strong recent performance trend.`;
      if (score >= 90) return `A (${score}): Strong momentum - team is 7-3 or better in L10 with positive trending.`;
      if (score >= 85) return `B+ (${score}): Good momentum - team has solid recent form above season average.`;
      if (score >= 80) return `B (${score}): Slight momentum edge - recent performance marginally better than season pace.`;
      if (score >= 75) return `C+ (${score}): Neutral momentum - team's L10 record matches their season performance.`;
      if (score >= 70) return `C (${score}): Slight momentum concern - recent form trailing season average.`;
      if (score >= 60) return `D (${score}): Poor momentum - team struggling with 3-7 or worse L10 record.`;
      return `F (${score}): Terrible momentum - team in freefall with 2-8 or worse recent record.`;
    
    case 'Market Inefficiency':
      if (score >= 95) return `A+ (${score}): Exceptional betting value - significant edge with Kelly Criterion suggesting strong bet sizing.`;
      if (score >= 90) return `A (${score}): Strong betting value - clear edge over market with profitable long-term expectation.`;
      if (score >= 85) return `B+ (${score}): Good betting value - moderate edge with positive expected value.`;
      if (score >= 80) return `B (${score}): Slight betting value - small edge over efficient market pricing.`;
      if (score >= 75) return `C+ (${score}): Fair market pricing - odds accurately reflect true probability.`;
      if (score >= 70) return `C (${score}): Slight market disadvantage - odds slightly favor the house.`;
      if (score >= 60) return `D (${score}): Poor betting value - market pricing significantly against our projection.`;
      return `F (${score}): Terrible betting value - odds heavily favor house with no positive expectation.`;
    
    case 'System Confidence':
      if (score >= 95) return `A+ (${score}): Maximum confidence - all data sources reliable with high factor consensus and complete information.`;
      if (score >= 90) return `A (${score}): High confidence - strong data quality with good factor agreement across metrics.`;
      if (score >= 85) return `B+ (${score}): Good confidence - reliable data with moderate consensus among analytical factors.`;
      if (score >= 80) return `B (${score}): Moderate confidence - adequate data quality with some minor uncertainties.`;
      if (score >= 75) return `C+ (${score}): Average confidence - standard data quality with typical variance levels.`;
      if (score >= 70) return `C (${score}): Below-average confidence - some data gaps or conflicting factor signals.`;
      if (score >= 60) return `D (${score}): Low confidence - significant data limitations or high factor disagreement.`;
      return `F (${score}): Very low confidence - poor data quality with unreliable or incomplete information.`;
    
    default:
      if (score >= 90) return `${grade} (${score}): Elite performance in this analytical factor.`;
      if (score >= 80) return `${grade} (${score}): Strong performance with favorable indicators.`;
      if (score >= 75) return `${grade} (${score}): Neutral baseline performance.`;
      return `${grade} (${score}): Below-average performance with concerning indicators.`;
  }
}

export function getFactorTooltip(normalizedScore: number, factorName: string): string {
  const explanation = getFactorExplanation(factorName);
  const gradeExplanation = getGradeExplanation(normalizedScore, factorName);
  
  return `${explanation}\n\n${gradeExplanation}`;
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