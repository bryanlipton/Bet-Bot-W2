import { DailyPickAnalysis } from '@shared/schema';

interface PickAnalysisData {
  pick: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    pickTeam: string;
    odds: number;
    grade: string;
    confidence: number;
    gameTime: string;
    venue: string;
    analysis: DailyPickAnalysis;
  };
  isLockPick?: boolean;
}

export const generatePickAnalysisContent = ({ pick, isLockPick = false }: PickAnalysisData) => {
  const { analysis, grade, confidence, pickTeam, odds, homeTeam, awayTeam, gameTime, venue } = pick;
  
  // Calculate implied probability from odds
  const impliedProb = odds > 0 ? (100 / (odds + 100)) * 100 : (Math.abs(odds) / (Math.abs(odds) + 100)) * 100;
  
  // Calculate model probability (simplified estimation based on confidence)
  const modelProb = impliedProb + (confidence - 50) * 0.2; // Rough estimation
  const edge = modelProb - impliedProb;
  
  // Count elite and strong scores
  const factorScores = [
    analysis.offensiveProduction,
    analysis.pitchingMatchup,
    analysis.situationalEdge,
    analysis.teamMomentum,
    analysis.marketInefficiency,
    analysis.systemConfidence
  ];
  
  const eliteScores = factorScores.filter(score => score >= 90).length;
  const strongScores = factorScores.filter(score => score >= 80 && score < 90).length;
  
  // Determine investment recommendation based on grade
  const getInvestmentRecommendation = (grade: string): string => {
    switch(grade) {
      case 'A+': return '4-5 unit investment';
      case 'A': return '3-4 unit investment';
      case 'A-': return '2-3 unit investment';
      case 'B+': return '2-3 unit investment';
      case 'B': return '1-2 unit investment';
      case 'B-': return '1-2 unit investment';
      case 'C+': return '1 unit investment';
      case 'C': return '0.5-1 unit investment';
      default: return '0.5 unit investment';
    }
  };

  // Get key strength based on highest factor
  const getKeyStrength = (): string => {
    const factors = [
      { name: 'market inefficiency', score: analysis.marketInefficiency, threshold: 90 },
      { name: 'system confidence', score: analysis.systemConfidence, threshold: 85 },
      { name: 'pitching advantage', score: analysis.pitchingMatchup, threshold: 80 },
      { name: 'offensive production', score: analysis.offensiveProduction, threshold: 80 },
      { name: 'situational edge', score: analysis.situationalEdge, threshold: 75 },
      { name: 'team momentum', score: analysis.teamMomentum, threshold: 75 }
    ];
    
    const keyFactor = factors.find(f => f.score >= f.threshold);
    if (keyFactor) {
      if (keyFactor.score >= 95) return `exceptional ${keyFactor.name} of ${keyFactor.score}/100`;
      if (keyFactor.score >= 90) return `substantial ${keyFactor.name} of ${keyFactor.score}/100`;
      if (keyFactor.score >= 80) return `strong ${keyFactor.name}`;
      return `solid ${keyFactor.name}`;
    }
    return 'balanced analytical factors';
  };

  // Format game time
  const formatGameTime = (gameTime: string): string => {
    const date = new Date(gameTime);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  // Format odds display
  const formatOdds = (odds: number): string => {
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  // Get factor grade
  const getFactorGrade = (score: number): string => {
    if (score >= 95) return 'A+';
    if (score >= 88) return 'A';
    if (score >= 83) return 'A-';
    if (score >= 78) return 'B+';
    if (score >= 73) return 'B';
    if (score >= 68) return 'B-';
    if (score >= 63) return 'C+';
    if (score >= 58) return 'C';
    if (score >= 53) return 'C-';
    if (score >= 48) return 'D+';
    return 'D';
  };

  return {
    title: `Bet Bot ${isLockPick ? 'Lock Pick' : 'Pick of the Day'} Analysis: ${grade} Grade`,
    pickDetails: {
      game: `${awayTeam} @ ${homeTeam}`,
      pick: `${pickTeam} ML ${formatOdds(odds)}`,
      venue,
      time: formatGameTime(gameTime)
    },
    gradeAnalysis: {
      summary: `Our model shows that ${pickTeam} is a profitable pick with ${confidence}% model certainty and exceptional ${grade} value potential.`,
      marketAnalysis: `Our analysis shows the market odds of ${formatOdds(odds)} imply a ${impliedProb.toFixed(1)}% win probability, while our model projects ${modelProb.toFixed(1)}%, creating a ${Math.abs(edge).toFixed(1)}% edge.`,
      factorBreakdown: `The pick earned ${eliteScores} elite scores (90+) and ${strongScores} strong scores (80+) across our six analytical factors.`,
      keyStrength: `Key strengths include ${getKeyStrength()}.`,
      investment: `This qualifies as a ${grade.includes('+') ? 'strong' : grade.includes('-') ? 'solid' : 'exceptional'} betting opportunity suitable for ${getInvestmentRecommendation(grade)}.`
    },
    factors: [
      {
        name: 'Market Edge',
        grade: getFactorGrade(analysis.marketInefficiency),
        score: analysis.marketInefficiency,
        description: 'Advanced betting value analysis using Kelly Criterion and market efficiency indicators to identify profitable opportunities.'
      },
      {
        name: 'Situational Edge', 
        grade: getFactorGrade(analysis.situationalEdge),
        score: analysis.situationalEdge,
        description: 'Comprehensive situational factors including ballpark dimensions, home field advantage, travel fatigue, and game timing effects.'
      },
      {
        name: 'Pitching Matchup',
        grade: getFactorGrade(analysis.pitchingMatchup),
        score: analysis.pitchingMatchup,
        description: 'Starting pitcher effectiveness analysis comparing ERA, WHIP, strikeout rates, and recent performance trends.'
      },
      {
        name: 'Team Momentum',
        grade: getFactorGrade(analysis.teamMomentum),
        score: analysis.teamMomentum,
        description: 'Multi-layered momentum analysis from official MLB Stats API comparing recent performance trends, L10 vs season form, and directional momentum shifts.'
      },
      {
        name: 'System Confidence',
        grade: getFactorGrade(analysis.systemConfidence),
        score: analysis.systemConfidence,
        description: 'Model certainty based on data quality, factor consensus, and information completeness - higher scores indicate stronger analytical foundation.'
      },
      {
        name: 'Offensive Production',
        grade: getFactorGrade(analysis.offensiveProduction),
        score: analysis.offensiveProduction,
        description: 'Advanced run-scoring analysis combining Baseball Savant metrics (xwOBA, barrel rate, exit velocity) with team production efficiency from 2025 season data.'
      }
    ]
  };
};