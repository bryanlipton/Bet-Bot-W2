// Test script to add historical picks via API endpoint

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000';

const sampleHistoricalPicks = [
  {
    gameId: 'mlb_777001', 
    selection: 'Boston Red Sox',
    game: 'New York Yankees @ Boston Red Sox',
    market: 'moneyline',
    line: null,
    odds: 150,
    units: 2.0,
    bookmaker: 'draftkings',
    bookmakerDisplayName: 'DraftKings',
    status: 'win',
    result: 'New York Yankees 5 - 7 Boston Red Sox',
    winAmount: 3.0,
    parlayLegs: null,
    showOnProfile: true,
    showOnFeed: true,
    gameDate: new Date(Date.now() - 86400000).toISOString(),
    gradedAt: new Date(Date.now() - 43200000).toISOString(),
  },
  {
    gameId: 'mlb_777002',
    selection: 'Los Angeles Dodgers -1.5',
    game: 'San Francisco Giants @ Los Angeles Dodgers',
    market: 'spread', 
    line: '-1.5',
    odds: -110,
    units: 1.5,
    bookmaker: 'fanduel',
    bookmakerDisplayName: 'FanDuel',
    status: 'loss',
    result: 'San Francisco Giants 4 - 5 Los Angeles Dodgers', 
    winAmount: -1.5,
    parlayLegs: null,
    showOnProfile: true,
    showOnFeed: true,
    gameDate: new Date(Date.now() - 86400000).toISOString(),
    gradedAt: new Date(Date.now() - 43200000).toISOString(),
  },
  {
    gameId: 'mlb_777003',
    selection: 'Over 8.5',
    game: 'Chicago Cubs @ Milwaukee Brewers',
    market: 'total',
    line: '8.5',
    odds: -105,
    units: 1.0,
    bookmaker: 'betmgm', 
    bookmakerDisplayName: 'BetMGM',
    status: 'win',
    result: 'Chicago Cubs 6 - 4 Milwaukee Brewers',
    winAmount: 0.95,
    parlayLegs: null,
    showOnProfile: true,
    showOnFeed: true,
    gameDate: new Date(Date.now() - 86400000).toISOString(),
    gradedAt: new Date(Date.now() - 43200000).toISOString(),
  }
];

async function addHistoricalPicks() {
  console.log('Adding historical picks via API...');
  
  try {
    // Add each pick individually
    for (let i = 0; i < sampleHistoricalPicks.length; i++) {
      const pick = sampleHistoricalPicks[i];
      console.log(`Adding pick ${i + 1}: ${pick.selection} (${pick.market}) - ${pick.status}`);
      
      // Note: This would need authentication in real scenario
      // For now, we'll just log what we would send
      console.log('Pick data:', JSON.stringify(pick, null, 2));
    }
    
    const wins = sampleHistoricalPicks.filter(p => p.status === 'win').length;
    const losses = sampleHistoricalPicks.filter(p => p.status === 'loss').length;
    const totalUnits = sampleHistoricalPicks.reduce((sum, p) => sum + (p.winAmount || 0), 0);
    
    console.log('\nHistorical Record Summary:');
    console.log(`Total Picks: ${sampleHistoricalPicks.length}`);
    console.log(`Wins: ${wins}`);
    console.log(`Losses: ${losses}`);
    console.log(`Win Rate: ${((wins / (wins + losses)) * 100).toFixed(1)}%`);
    console.log(`Net Units: ${totalUnits > 0 ? '+' : ''}${totalUnits.toFixed(2)}`);
    
  } catch (error) {
    console.error('Error adding historical picks:', error);
  }
}

addHistoricalPicks();