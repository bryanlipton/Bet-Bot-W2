// Professional factor score narrative generator
// Creates analyst-style explanations without revealing model internals

import { narrativePhrases, getScoreCategory, type GameContext } from './narrativeConfig';

/**
 * Generates professional analyst-style narrative for a factor score
 * @param factorName The analytical factor being explained
 * @param score Normalized score (60-100)
 * @param context Game and team context for personalization
 * @returns Analyst-style narrative explanation
 */
export function generateNarrative(
  factorName: string, 
  score: number, 
  context: GameContext = {}
): string {
  const category = getScoreCategory(score);
  const factorKey = getFactorKey(factorName);
  
  if (!narrativePhrases[factorKey]) {
    return generateGenericNarrative(score, category);
  }
  
  const basePhrases = narrativePhrases[factorKey][category];
  let narrative = getRandomPhrase(basePhrases);
  
  // Add contextual details based on available data
  narrative = enhanceWithContext(narrative, factorName, context, category);
  
  return narrative;
}

function getFactorKey(factorName: string): keyof typeof narrativePhrases {
  const normalized = factorName.toLowerCase().replace(/\s+/g, '');
  
  switch (normalized) {
    case 'offensiveproduction':
      return 'offensiveProduction';
    case 'pitchingmatchup':
      return 'pitchingMatchup';
    case 'situationaledge':
      return 'situationalEdge';
    case 'teammomentum':
      return 'teamMomentum';
    case 'marketinefficiency':
      return 'marketInefficiency';
    case 'systemconfidence':
      return 'systemConfidence';
    default:
      return 'offensiveProduction'; // fallback
  }
}

function getRandomPhrase(phrases: string[]): string {
  const index = Math.floor(Math.random() * phrases.length);
  return phrases[index];
}

function enhanceWithContext(
  narrative: string, 
  factorName: string, 
  context: GameContext,
  category: 'elite' | 'strong' | 'neutral' | 'weak'
): string {
  let enhanced = narrative;
  
  // Add specific contextual details based on factor type and available context
  switch (getFactorKey(factorName)) {
    case 'offensiveProduction':
      enhanced = enhanceOffensiveNarrative(enhanced, context, category);
      break;
    case 'pitchingMatchup':
      enhanced = enhancePitchingNarrative(enhanced, context, category);
      break;
    case 'situationalEdge':
      enhanced = enhanceSituationalNarrative(enhanced, context, category);
      break;
    case 'teamMomentum':
      enhanced = enhanceMomentumNarrative(enhanced, context, category);
      break;
    case 'marketInefficiency':
      enhanced = enhanceMarketNarrative(enhanced, context, category);
      break;
    case 'systemConfidence':
      enhanced = enhanceConfidenceNarrative(enhanced, context, category);
      break;
  }
  
  return enhanced;
}

function enhanceOffensiveNarrative(
  narrative: string, 
  context: GameContext, 
  category: 'elite' | 'strong' | 'neutral' | 'weak'
): string {
  let enhanced = narrative;
  
  if (context.opponentHandedness) {
    const handedness = context.opponentHandedness === 'RHP' ? 'right-handed' : 'left-handed';
    if (category === 'elite' || category === 'strong') {
      enhanced += ` The lineup shows particular effectiveness against ${handedness} pitching.`;
    }
  }
  
  if (context.parkFactor && context.parkFactor > 105) {
    if (category === 'elite' || category === 'strong') {
      enhanced += ` Ballpark conditions amplify offensive potential significantly.`;
    }
  }
  
  if (context.offensiveStats?.xwOBA && context.offensiveStats.xwOBA > 0.340) {
    if (category === 'elite') {
      enhanced += ` Expected contact quality metrics exceed 95th percentile benchmarks.`;
    }
  }
  
  return enhanced;
}

function enhancePitchingNarrative(
  narrative: string, 
  context: GameContext, 
  category: 'elite' | 'strong' | 'neutral' | 'weak'
): string {
  let enhanced = narrative;
  
  // Add specific pitcher comparison context when available
  if (context.pickPitcher && context.opponentPitcher) {
    if (category === 'elite' || category === 'strong') {
      enhanced += ` ${context.pickPitcher} holds clear statistical advantages over ${context.opponentPitcher} in 2025 season metrics.`;
    } else if (category === 'weak') {
      enhanced += ` ${context.opponentPitcher} has been significantly more effective than ${context.pickPitcher} this season.`;
    } else {
      enhanced += ` The matchup between ${context.pickPitcher} and ${context.opponentPitcher} shows fairly balanced season statistics.`;
    }
  }
  
  if (context.starterERA) {
    if (context.starterERA < 3.0 && (category === 'elite' || category === 'strong')) {
      enhanced += ` Sub-3.00 ERA demonstrates consistent quality start capability.`;
    } else if (context.starterERA > 5.0 && category === 'weak') {
      enhanced += ` Elevated ERA trends suggest vulnerability in extended outings.`;
    }
  }
  
  // Add specific ERA/WHIP comparison when available
  if (context.pickPitcherERA && context.opponentPitcherERA) {
    const eraDiff = Math.abs(context.pickPitcherERA - context.opponentPitcherERA);
    if (eraDiff > 0.5) {
      if (context.pickPitcherERA < context.opponentPitcherERA) {
        enhanced += ` ERA advantage of ${eraDiff.toFixed(2)} points strongly favors the pick.`;
      } else {
        enhanced += ` ERA disadvantage of ${eraDiff.toFixed(2)} points creates offensive pressure.`;
      }
    }
  }
  
  if (context.pitchingStats?.whip && context.pitchingStats.whip < 1.15) {
    if (category === 'elite') {
      enhanced += ` Exceptional command metrics limit baserunner frequency effectively.`;
    }
  }
  
  return enhanced;
}

function enhanceSituationalNarrative(
  narrative: string, 
  context: GameContext, 
  category: 'elite' | 'strong' | 'neutral' | 'weak'
): string {
  let enhanced = narrative;
  
  if (context.isHomeGame !== undefined) {
    if (context.isHomeGame && (category === 'elite' || category === 'strong')) {
      enhanced += ` Home venue familiarity provides tactical and psychological advantages.`;
    } else if (!context.isHomeGame && category === 'weak') {
      enhanced += ` Road environment presents additional execution challenges.`;
    }
  }
  
  if (context.parkFactor) {
    if (context.parkFactor > 110 && category === 'elite') {
      enhanced += ` Extreme hitter-friendly conditions create explosive scoring potential.`;
    } else if (context.parkFactor < 95 && category === 'weak') {
      enhanced += ` Pitcher-friendly dimensions suppress offensive output expectations.`;
    }
  }
  
  return enhanced;
}

function enhanceMomentumNarrative(
  narrative: string, 
  context: GameContext, 
  category: 'elite' | 'strong' | 'neutral' | 'weak'
): string {
  let enhanced = narrative;
  
  if (context.last10Record) {
    const [wins, losses] = context.last10Record.split('-').map(Number);
    if (wins >= 8 && category === 'elite') {
      enhanced += ` Eight-plus wins in the last ten games demonstrates exceptional current form.`;
    } else if (wins <= 3 && category === 'weak') {
      enhanced += ` Three or fewer recent wins indicate concerning performance decline.`;
    }
  }
  
  if (context.momentumStats?.streak && Math.abs(context.momentumStats.streak) >= 4) {
    if (context.momentumStats.streak > 0 && (category === 'elite' || category === 'strong')) {
      enhanced += ` Extended winning streak builds confidence and execution consistency.`;
    } else if (context.momentumStats.streak < 0 && category === 'weak') {
      enhanced += ` Prolonged losing streak creates pressure and execution uncertainty.`;
    }
  }
  
  return enhanced;
}

function enhanceMarketNarrative(
  narrative: string, 
  context: GameContext, 
  category: 'elite' | 'strong' | 'neutral' | 'weak'
): string {
  let enhanced = narrative;
  
  if (category === 'elite') {
    enhanced += ` Public perception appears to undervalue recent analytical improvements.`;
  } else if (category === 'weak') {
    enhanced += ` Market efficiency suggests limited exploitable opportunities.`;
  }
  
  return enhanced;
}

function enhanceConfidenceNarrative(
  narrative: string, 
  context: GameContext, 
  category: 'elite' | 'strong' | 'neutral' | 'weak'
): string {
  let enhanced = narrative;
  
  if (category === 'elite') {
    enhanced += ` Cross-validation with multiple data sources confirms analytical reliability.`;
  } else if (category === 'weak') {
    enhanced += ` Missing data points require cautious interpretation of projections.`;
  }
  
  return enhanced;
}

function generateGenericNarrative(score: number, category: 'elite' | 'strong' | 'neutral' | 'weak'): string {
  switch (category) {
    case 'elite':
      return `Analytical assessment reveals exceptional performance indicators across multiple statistical categories with strong supporting fundamentals.`;
    case 'strong':
      return `Performance metrics demonstrate above-average capabilities with solid fundamentals supporting favorable expectations.`;
    case 'neutral':
      return `Balanced analytical profile with standard performance indicators suggesting typical competitive expectations.`;
    case 'weak':
      return `Statistical analysis reveals concerning trends with below-average performance indicators across key categories.`;
  }
}

/**
 * Generates context-aware narratives for multiple factors
 * @param factors Object with factor names and scores
 * @param context Shared game context
 * @returns Object with factor narratives
 */
export function generateMultipleNarratives(
  factors: Record<string, number>,
  context: GameContext = {}
): Record<string, string> {
  const narratives: Record<string, string> = {};
  
  for (const [factorName, score] of Object.entries(factors)) {
    narratives[factorName] = generateNarrative(factorName, score, context);
  }
  
  return narratives;
}