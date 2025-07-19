// Script to insert sample historical picks directly into database for testing past picks functionality

const { Pool } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-serverless');
const { userPicks } = require('./shared/schema');
const ws = require("ws");

const neonConfig = require('@neondatabase/serverless');
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema: { userPicks } });

async function insertSampleHistoricalPicks() {
  console.log('🔄 Inserting sample historical picks...');
  
  // Historical picks from yesterday (graded)
  const historicalPicks = [
    {
      id: `pick_${Date.now() - 86400000}_historical_1`,
      userId: "41853859", // Julian's user ID
      gameId: "mlb_777001", 
      selection: "Boston Red Sox",
      game: "New York Yankees @ Boston Red Sox",
      market: "moneyline",
      line: null,
      odds: 150,
      units: 2.0,
      bookmaker: "draftkings",
      bookmakerDisplayName: "DraftKings",
      status: "win",
      result: "New York Yankees 5 - 7 Boston Red Sox",
      winAmount: 3.0,
      parlayLegs: null,
      showOnProfile: true,
      showOnFeed: true,
      gameDate: new Date(Date.now() - 86400000), // Yesterday
      gradedAt: new Date(Date.now() - 43200000), // 12 hours ago
    },
    {
      id: `pick_${Date.now() - 86400000}_historical_2`,
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
      status: "loss",
      result: "San Francisco Giants 4 - 5 Los Angeles Dodgers", 
      winAmount: -1.5,
      parlayLegs: null,
      showOnProfile: true,
      showOnFeed: true,
      gameDate: new Date(Date.now() - 86400000),
      gradedAt: new Date(Date.now() - 43200000),
    },
    {
      id: `pick_${Date.now() - 86400000}_historical_3`,
      userId: "41853859",
      gameId: "mlb_777003",
      selection: "Over 8.5",
      game: "Chicago Cubs @ Milwaukee Brewers",
      market: "total",
      line: "8.5",
      odds: -105,
      units: 1.0,
      bookmaker: "betmgm", 
      bookmakerDisplayName: "BetMGM",
      status: "win",
      result: "Chicago Cubs 6 - 4 Milwaukee Brewers",
      winAmount: 0.95,
      parlayLegs: null,
      showOnProfile: true,
      showOnFeed: true,
      gameDate: new Date(Date.now() - 86400000),
      gradedAt: new Date(Date.now() - 43200000),
    },
    {
      id: `pick_${Date.now() - 86400000}_historical_4`, 
      userId: "41853859",
      gameId: "mlb_777004",
      selection: "Atlanta Braves",
      game: "Philadelphia Phillies @ Atlanta Braves",
      market: "moneyline",
      line: null,
      odds: -130,
      units: 2.5,
      bookmaker: "caesars",
      bookmakerDisplayName: "Caesars",
      status: "loss",
      result: "Philadelphia Phillies 8 - 2 Atlanta Braves",
      winAmount: -2.5,
      parlayLegs: null,
      showOnProfile: true,
      showOnFeed: true,
      gameDate: new Date(Date.now() - 86400000),
      gradedAt: new Date(Date.now() - 43200000),
    }
  ];

  try {
    // Insert all historical picks
    const insertedPicks = await db.insert(userPicks).values(historicalPicks).returning();
    
    console.log('✅ Successfully inserted historical picks:');
    insertedPicks.forEach((pick, index) => {
      console.log(`  ${index + 1}. ${pick.selection} (${pick.market}) - ${pick.status.toUpperCase()}`);
      console.log(`     Result: ${pick.result}`);
      console.log(`     Win/Loss: ${pick.winAmount > 0 ? '+' : ''}${pick.winAmount} units`);
      console.log('');
    });
    
    console.log(`🎯 Added ${insertedPicks.length} historical picks for user ${historicalPicks[0].userId}`);
    
    // Show summary stats
    const wins = insertedPicks.filter(p => p.status === 'win').length;
    const losses = insertedPicks.filter(p => p.status === 'loss').length;
    const totalUnits = insertedPicks.reduce((sum, p) => sum + (p.winAmount || 0), 0);
    
    console.log('📊 Historical Record Summary:');
    console.log(`   Wins: ${wins}`);
    console.log(`   Losses: ${losses}`);
    console.log(`   Win Rate: ${((wins / (wins + losses)) * 100).toFixed(1)}%`);
    console.log(`   Net Units: ${totalUnits > 0 ? '+' : ''}${totalUnits.toFixed(2)}`);
    
  } catch (error) {
    console.error('❌ Error inserting historical picks:', error);
    throw error;
  }
}

// Run the insertion
insertSampleHistoricalPicks()
  .then(() => {
    console.log('🏁 Historical picks insertion completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Historical picks insertion failed:', error);
    process.exit(1);
  });