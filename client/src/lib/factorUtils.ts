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

/**
 * Gets Tailwind CSS classes for factor score display
 * @param normalizedScore Score between 60-100
 * @returns Object with text and background color classes
 */
export function getFactorColorClasses(normalizedScore: number): { text: string; bg: string; border: string } {
  if (normalizedScore >= 95) {
    return { text: 'text-green-900', bg: 'bg-green-400', border: 'border-green-500' };
  }
  if (normalizedScore >= 90) {
    return { text: 'text-green-800', bg: 'bg-green-300', border: 'border-green-400' };
  }
  if (normalizedScore >= 85) {
    return { text: 'text-green-700', bg: 'bg-green-200', border: 'border-green-300' };
  }
  if (normalizedScore >= 80) {
    return { text: 'text-gray-700', bg: 'bg-gray-200', border: 'border-gray-300' };
  }
  if (normalizedScore >= 75) {
    return { text: 'text-red-700', bg: 'bg-red-200', border: 'border-red-300' };
  }
  if (normalizedScore >= 70) {
    return { text: 'text-red-800', bg: 'bg-red-300', border: 'border-red-400' };
  }
  return { text: 'text-red-900', bg: 'bg-red-400', border: 'border-red-500' };
}

/**
 * Gets tooltip text for a factor score
 * @param normalizedScore Score between 60-100
 * @param factorName Name of the factor
 * @returns Tooltip description
 */
export function getFactorTooltip(normalizedScore: number, factorName: string): string {
  const score = normalizedScore;
  
  if (score >= 95) {
    return `${score} – Elite advantage. ${factorName} shows exceptional positive signals.`;
  }
  if (score >= 90) {
    return `${score} – Strong advantage. ${factorName} indicates very favorable conditions.`;
  }
  if (score >= 85) {
    return `${score} – Moderate advantage. ${factorName} shows positive trending signals.`;
  }
  if (score >= 80) {
    return `${score} – Neutral baseline. ${factorName} shows balanced or average conditions.`;
  }
  if (score >= 75) {
    return `${score} – Mild disadvantage. ${factorName} indicates slightly unfavorable conditions.`;
  }
  if (score >= 70) {
    return `${score} – Moderate disadvantage. ${factorName} shows concerning negative signals.`;
  }
  return `${score} – Strong disadvantage. ${factorName} indicates significantly unfavorable conditions.`;
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