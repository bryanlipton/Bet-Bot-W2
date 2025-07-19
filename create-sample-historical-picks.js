// Script to create sample historical picks for yesterday to demonstrate the past picks functionality

const samplePicks = [
  {
    id: "pick_yesterday_1",
    userId: "41853859", // Julian's user ID from the logs
    gameId: "mlb_777001", 
    selection: "Boston Red Sox",
    game: "New York Yankees @ Boston Red Sox",
    market: "moneyline",
    line: null,
    odds: 150, // +150 odds
    units: 2,
    bookmaker: "draftkings",
    bookmakerDisplayName: "DraftKings",
    status: "win", // This will be graded as a win
    result: "New York Yankees 5 - 7 Boston Red Sox",
    winAmount: 3.0, // Won 3 units (2 units * 1.5 multiplier)
    parlayLegs: null,
    showOnProfile: true,
    showOnFeed: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
    gameDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
    gradedAt: new Date(Date.now() - 12 * 60 * 60 * 1000) // Graded 12 hours ago
  },
  {
    id: "pick_yesterday_2",
    userId: "41853859",
    gameId: "mlb_777002",
    selection: "Los Angeles Dodgers -1.5",
    game: "San Francisco Giants @ Los Angeles Dodgers", 
    market: "spread",
    line: "-1.5",
    odds: -110,
    units: 1.5,
    bookmaker: "fanduel",
    bookmakerDisplayName: "FanDuel",
    status: "loss", // This will be graded as a loss
    result: "San Francisco Giants 4 - 5 Los Angeles Dodgers", // Dodgers won by 1, didn't cover -1.5 spread
    winAmount: -1.5, // Lost 1.5 units
    parlayLegs: null,
    showOnProfile: true,
    showOnFeed: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    gameDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
    gradedAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
  },
  {
    id: "pick_yesterday_3", 
    userId: "41853859",
    gameId: "mlb_777003",
    selection: "Over 8.5",
    game: "Chicago Cubs @ Milwaukee Brewers",
    market: "total",
    line: "8.5", 
    odds: -105,
    units: 1,
    bookmaker: "betmgm",
    bookmakerDisplayName: "BetMGM",
    status: "win", // This will be graded as a win
    result: "Chicago Cubs 6 - 4 Milwaukee Brewers", // Total runs = 10, over 8.5 wins
    winAmount: 0.95, // Won 0.95 units (1 unit * 0.95 multiplier for -105 odds)
    parlayLegs: null,
    showOnProfile: true,
    showOnFeed: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    gameDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
    gradedAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
  }
];

console.log('Sample historical picks for testing past picks functionality:');
console.log(JSON.stringify(samplePicks, null, 2));

// Export for use in other scripts
module.exports = samplePicks;