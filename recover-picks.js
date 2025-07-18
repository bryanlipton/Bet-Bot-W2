// Script to check and recover localStorage picks for jcbaseball2003@gmail.com
console.log('Checking localStorage for existing picks...');

// Check for existing picks in localStorage
const storageKey = 'bet-bot-picks';
const storedPicks = localStorage.getItem(storageKey);

if (storedPicks) {
  try {
    const picks = JSON.parse(storedPicks);
    console.log('Found picks in localStorage:', picks.length);
    
    picks.forEach((pick, index) => {
      console.log(`Pick ${index + 1}:`, {
        id: pick.id,
        gameInfo: pick.gameInfo,
        betInfo: pick.betInfo,
        bookmaker: pick.bookmaker,
        status: pick.status,
        timestamp: new Date(pick.timestamp)
      });
    });
    
    // Look specifically for Toronto Blue Jays and parlay bets
    const bluejaysBets = picks.filter(pick => 
      pick.gameInfo?.homeTeam?.includes('Blue Jays') || 
      pick.gameInfo?.awayTeam?.includes('Blue Jays') ||
      pick.betInfo?.selection?.includes('Blue Jays')
    );
    
    const parlayBets = picks.filter(pick => 
      pick.betInfo?.market === 'parlay' ||
      pick.gameInfo?.awayTeam?.includes('Parlay')
    );
    
    console.log('Toronto Blue Jays bets found:', bluejaysBets);
    console.log('Parlay bets found:', parlayBets);
    
    if (picks.length > 0) {
      console.log('*** PICKS FOUND IN LOCALSTORAGE ***');
      console.log('These picks need to be migrated to the database!');
    }
    
  } catch (error) {
    console.error('Error parsing picks from localStorage:', error);
  }
} else {
  console.log('No picks found in localStorage');
}

// Check bet unit preference
const betUnitKey = 'bet-bot-bet-unit';
const storedBetUnit = localStorage.getItem(betUnitKey);
console.log('Bet unit in localStorage:', storedBetUnit);