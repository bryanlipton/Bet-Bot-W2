// Check localStorage directly in browser console
console.log('=== CHECKING LOCALSTORAGE FOR PICKS ===');

// Check the bet-bot-picks key
const picksKey = 'bet-bot-picks';
const storedPicks = localStorage.getItem(picksKey);
console.log('Raw localStorage data:', storedPicks);

if (storedPicks) {
  try {
    const picks = JSON.parse(storedPicks);
    console.log('Parsed picks:', picks.length, 'picks found');
    
    picks.forEach((pick, index) => {
      console.log(`Pick ${index + 1}:`, {
        id: pick.id,
        selection: pick.betInfo?.selection,
        game: `${pick.gameInfo?.awayTeam} @ ${pick.gameInfo?.homeTeam}`,
        market: pick.betInfo?.market,
        odds: pick.betInfo?.odds,
        bookmaker: pick.bookmaker?.displayName || pick.bookmaker?.title,
        timestamp: new Date(pick.timestamp || pick.gameInfo?.gameTime)
      });
    });
  } catch (error) {
    console.error('Error parsing picks:', error);
  }
} else {
  console.log('No picks found in localStorage');
}

// Check bet unit
const betUnitKey = 'bet-bot-bet-unit'; 
const storedBetUnit = localStorage.getItem(betUnitKey);
console.log('Bet unit in localStorage:', storedBetUnit);

// Check all localStorage keys for bet-bot related items
console.log('All localStorage keys:');
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key?.includes('bet') || key?.includes('pick')) {
    console.log(`- ${key}: ${localStorage.getItem(key)?.substring(0, 100)}...`);
  }
}