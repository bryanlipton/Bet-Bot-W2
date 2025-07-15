// Script to export your betting model data for Custom GPT

import fs from 'fs';

// Export betting strategies and concepts
const bettingStrategies = {
  edgeCalculation: {
    description: "Edge = (Your Probability × Decimal Odds) - 1",
    example: "If you predict 60% chance but odds imply 50%, you have a 20% edge",
    minimumEdge: "Generally need 5%+ edge to overcome variance and fees"
  },
  
  kellyCriterion: {
    description: "Optimal bet sizing formula",
    formula: "f = (bp - q) / b",
    explanation: "f=fraction to bet, b=odds received, p=probability of win, q=probability of loss"
  },
  
  bankrollManagement: {
    conservative: "1-2% of bankroll per bet",
    aggressive: "3-5% of bankroll per bet", 
    maxBet: "Never more than 10% on single bet"
  },
  
  valueIdentification: {
    lineMovement: "Look for reverse line movement (money on favorite, line moves to underdog)",
    shopOdds: "Compare multiple sportsbooks for best lines",
    timingBets: "Bet early for soft lines, late for injury news"
  }
};

// Export sample historical results (anonymized)
const sampleBacktestResults = {
  period: "2024 MLB Season Sample",
  totalBets: 2035,
  accuracy: 0.543,
  profitLoss: 2444.30,
  sharpeRatio: 0.04,
  maxDrawdown: 0.437,
  dataSource: "Real MLB API",
  keyInsights: [
    "Model performs 1-2% above breakeven threshold",
    "Higher accuracy in division games (56.7%)",
    "Strong performance on road favorites (-110 to -140)",
    "Avoid betting heavy favorites (>-200 odds)"
  ]
};

// Export MLB team analysis framework
const teamAnalysisFramework = {
  offensiveMetrics: [
    "Team batting average vs pitch type",
    "On-base percentage in different counts", 
    "Slugging percentage vs LHP/RHP",
    "Recent run scoring trends (last 10 games)"
  ],
  
  pitchingMetrics: [
    "Starter ERA and WHIP vs similar opponents",
    "Bullpen effectiveness in close games",
    "Home/away pitching splits",
    "Rest days for starting pitcher"
  ],
  
  situationalFactors: [
    "Head-to-head records last 3 years",
    "Performance in day vs night games", 
    "Weather conditions impact (wind, temperature)",
    "Motivation factors (playoff race, rivalry)"
  ]
};

// Export betting terminology
const bettingGlossary = {
  impliedProbability: "The probability suggested by betting odds. Calculate as: 1 / (decimal odds)",
  expectedValue: "Average profit/loss over many bets. Positive EV = profitable long-term",
  variance: "Statistical measure of how much results deviate from expected value",
  sharpMoney: "Bets placed by professional/sophisticated bettors",
  steam: "Rapid line movement across multiple sportsbooks, often following sharp money",
  middling: "Betting both sides of a game at different numbers to guarantee profit",
  arbitrage: "Betting all outcomes at different books to guarantee profit regardless of result"
};

// Write files for Custom GPT upload
fs.writeFileSync('betting-strategies.json', JSON.stringify(bettingStrategies, null, 2));
fs.writeFileSync('historical-results.json', JSON.stringify(sampleBacktestResults, null, 2));
fs.writeFileSync('team-analysis.json', JSON.stringify(teamAnalysisFramework, null, 2));
fs.writeFileSync('betting-glossary.json', JSON.stringify(bettingGlossary, null, 2));

console.log('Files created for Custom GPT upload:');
console.log('- betting-strategies.json');
console.log('- historical-results.json');
console.log('- team-analysis.json');
console.log('- betting-glossary.json');
console.log('\nUpload these files to your Custom GPT knowledge base.');