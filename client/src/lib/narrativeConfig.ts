// Configuration for generating analyst-style narratives for factor scores
// Maps statistical conditions to descriptive phrases

export interface GameContext {
  opponentHandedness?: 'RHP' | 'LHP';
  isHomeGame?: boolean;
  parkFactor?: number;
  starterERA?: number;
  last10Record?: string;
  pickPitcher?: string;
  opponentPitcher?: string;
  pickPitcherERA?: number;
  opponentPitcherERA?: number;
  pickPitcherWHIP?: number;
  opponentPitcherWHIP?: number;
  offensiveStats?: {
    xwOBA?: number;
    barrelRate?: number;
    exitVelo?: number;
  };
  pitchingStats?: {
    era?: number;
    whip?: number;
    k9?: number;
  };
  momentumStats?: {
    l10Wins?: number;
    l10Total?: number;
    streak?: number;
  };
}

export const narrativePhrases = {
  offensiveProduction: {
    elite: [
      "The lineup ranks in the top percentile for expected weighted on-base average, demonstrating elite plate discipline and contact quality.",
      "Statcast metrics reveal exceptional barrel rates and exit velocity trends that translate to consistent run production.",
      "Advanced hitting analytics show remarkable power-speed combination with elevated ISO and sprint speed metrics."
    ],
    strong: [
      "The offensive unit displays above-average contact metrics with solid barrel percentage against this pitching style.",
      "Recent plate appearances show improved selectivity and hard contact rates compared to season averages.",
      "Batting profile demonstrates strong fundamentals with consistent gap power and situational hitting ability."
    ],
    neutral: [
      "The lineup presents balanced offensive capabilities with league-average contact and power metrics.",
      "Recent performance aligns with season-long expectations, showing consistent but unremarkable production.",
      "Standard offensive profile with adequate run-scoring potential given typical game conditions."
    ],
    weak: [
      "Contact quality metrics suggest struggles against this style of pitching with below-average barrel rates.",
      "Recent plate discipline has declined with elevated chase rates and diminished exit velocity trends.",
      "The offensive approach shows concerning patterns with limited power output and situational hitting deficiencies."
    ]
  },
  
  pitchingMatchup: {
    elite: [
      "The probable starter exhibits dominant command with elite strikeout rates and exceptional opponent contact quality suppression.",
      "Recent velocity and movement data indicate peak form with limited hard contact allowed over the past month.",
      "Advanced pitching metrics demonstrate superior stuff quality with elevated whiff rates and ground ball tendencies."
    ],
    strong: [
      "Starting pitcher analytics reveal solid command fundamentals with favorable matchup history against this offensive style.",
      "Recent performance trends show consistent strike-throwing ability with reduced walk rates and quality start frequency.",
      "Pitch mix effectiveness creates advantageous conditions given the opposing lineup's contact tendencies."
    ],
    neutral: [
      "Both starting pitchers present comparable skill sets with similar peripherals and recent performance indicators.",
      "Standard matchup dynamics with neither starter holding significant advantages in stuff quality or command.",
      "Recent form suggests typical performance expectations with balanced offensive-pitching dynamics."
    ],
    weak: [
      "Starting pitcher metrics indicate vulnerability with elevated hard contact rates and declining velocity trends.",
      "Recent command issues create concern with increased walk rates and diminished swing-and-miss capability.",
      "Matchup dynamics favor the opposing offense given pitch mix limitations and historical performance patterns."
    ]
  },
  
  situationalEdge: {
    elite: [
      "Multiple situational factors converge favorably including home field advantage and optimal ballpark conditions for this offensive profile.",
      "Environmental conditions and venue characteristics create significant advantages for the preferred style of play.",
      "Travel schedules, rest patterns, and game timing all align to support peak performance execution."
    ],
    strong: [
      "Home field dynamics provide meaningful advantages with familiar conditions and supportive crowd energy.",
      "Ballpark dimensions and weather patterns favor this team's offensive approach and pitching style.",
      "Scheduling factors including rest and travel create favorable conditions for optimal performance."
    ],
    neutral: [
      "Situational factors present balanced conditions with neither team holding significant environmental advantages.",
      "Standard game conditions with typical home-road dynamics and neutral ballpark characteristics.",
      "Travel and rest patterns show normal impact with no meaningful scheduling advantages either direction."
    ],
    weak: [
      "Road conditions present challenges with unfamiliar environments and hostile crowd dynamics.",
      "Ballpark characteristics and weather patterns create disadvantageous conditions for this team's style.",
      "Travel fatigue and compressed scheduling may impact performance quality and execution consistency."
    ]
  },
  
  teamMomentum: {
    elite: [
      "Recent performance trends demonstrate exceptional form with dominant win rates significantly exceeding season expectations.",
      "Team chemistry and confidence indicators suggest peak performance levels with multiple series victories recently.",
      "Statistical momentum reveals accelerating performance with key players entering optimal form simultaneously."
    ],
    strong: [
      "Positive momentum patterns show consistent winning baseball with strong execution in close games.",
      "Recent series results indicate improved team cohesion with effective clutch performance and bullpen reliability.",
      "Performance trajectory suggests upward trend with key statistical categories showing month-over-month improvement."
    ],
    neutral: [
      "Recent form aligns with season-long performance expectations showing consistent but unremarkable execution.",
      "Team momentum appears stable with balanced wins and losses reflecting typical competitive variance.",
      "Performance indicators suggest steady state operation with no significant directional trends apparent."
    ],
    weak: [
      "Concerning momentum patterns reveal declining performance with multiple recent series losses and execution issues.",
      "Team confidence appears fragile with late-inning collapses and diminished clutch performance capability.",
      "Negative performance trajectory shows multiple statistical categories trending below season averages."
    ]
  },
  
  marketInefficiency: {
    elite: [
      "Market pricing appears significantly disconnected from analytical projections, creating substantial value opportunities.",
      "Betting line movement and market behavior suggest inefficient pricing relative to fundamental team strengths.",
      "Sharp money indicators and closing line value patterns support favorable risk-adjusted return expectations."
    ],
    strong: [
      "Current odds present meaningful value relative to projected win probability based on analytical models.",
      "Market perception appears to undervalue recent performance improvements and matchup-specific advantages.",
      "Line shopping reveals consensus pricing below fair value estimates from multiple analytical perspectives."
    ],
    neutral: [
      "Market pricing accurately reflects projected game dynamics with efficient odds relative to win probability.",
      "Betting lines appear fairly valued with minimal edge available from standard analytical approaches.",
      "Market consensus aligns closely with fundamental analysis suggesting appropriate risk-reward balance."
    ],
    weak: [
      "Current market pricing offers poor value with odds favoring the house significantly.",
      "Betting lines appear inflated relative to analytical projections creating negative expected value conditions.",
      "Market efficiency suggests limited upside with fundamentals supporting current pricing consensus."
    ]
  },
  
  systemConfidence: {
    elite: [
      "Comprehensive data availability and model consensus create high analytical certainty with minimal projection variance.",
      "Multiple independent factors align consistently supporting robust analytical foundation and reliable projections.",
      "Information quality and completeness enable confident assessment with strong historical validation patterns."
    ],
    strong: [
      "Solid data foundation supports reliable analysis with good factor consensus and manageable uncertainty levels.",
      "Most analytical components show agreement with adequate information depth for confident projections.",
      "Model inputs demonstrate good quality with reasonable factor variance and acceptable confidence intervals."
    ],
    neutral: [
      "Standard analytical confidence with typical data availability and moderate factor agreement patterns.",
      "Information quality meets baseline requirements with normal uncertainty levels for this analysis type.",
      "Model consensus shows acceptable variance with adequate data depth for standard projection reliability."
    ],
    weak: [
      "Limited data availability and conflicting factor signals create elevated uncertainty in analytical projections.",
      "Information gaps and model disagreement suggest cautious interpretation of analytical conclusions.",
      "Projection reliability concerns due to incomplete data and high variance between analytical factors."
    ]
  }
};

export function getScoreCategory(score: number): 'elite' | 'strong' | 'neutral' | 'weak' {
  if (score >= 90) return 'elite';
  if (score >= 80) return 'strong';
  if (score >= 75) return 'neutral';
  return 'weak';
}