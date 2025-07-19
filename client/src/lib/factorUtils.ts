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
      return 'Combines advanced hitting metrics (xwOBA, barrel rate, exit velocity) with team run-scoring efficiency from 2025 season data. Evaluates batting lineup strength relative to league averages and recent offensive trends.';
    
    case 'Pitching Matchup':
      return 'Analyzes starting pitcher effectiveness using ERA, WHIP, strikeout rates, and recent performance trends. Compares pitcher strength against opposing team\'s offensive capabilities and historical matchup data.';
    
    case 'Situational Edge':
      return 'Evaluates ballpark dimensions, home field advantage, travel fatigue, and game timing effects. Includes stadium-specific run environments and how conditions favor each team\'s style of play.';
    
    case 'Team Momentum':
      return 'Multi-layered analysis using official MLB Stats API comparing recent performance (L10 games) vs season form, directional trends, and momentum shifts. Tracks wins/losses in last 10 completed games.';
    
    case 'Market Inefficiency':
      return 'Advanced betting value analysis using Kelly Criterion and market efficiency indicators. Identifies profitable opportunities by comparing our projected win probability against implied odds probability.';
    
    case 'System Confidence':
      return 'Model certainty based on data quality, factor consensus, and information completeness. Higher scores indicate stronger analytical foundation with reliable data from all sources.';
    
    default:
      return 'This factor analyzes various statistical and situational elements to determine team advantages.';
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