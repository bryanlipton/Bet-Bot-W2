// Migration script to move picks from localStorage to database
async function migratePicks() {
  console.log('Starting pick migration from localStorage to database...');
  
  const storageKey = 'bet-bot-picks';
  const storedPicks = localStorage.getItem(storageKey);
  
  if (!storedPicks) {
    console.log('No picks found in localStorage to migrate');
    return;
  }
  
  try {
    const picks = JSON.parse(storedPicks);
    console.log(`Found ${picks.length} picks in localStorage`);
    
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const pick of picks) {
      try {
        console.log('Migrating pick:', pick.id);
        
        // Convert to database format
        const dbPickData = {
          gameId: pick.gameInfo?.gameId || pick.id,
          homeTeam: pick.gameInfo?.homeTeam || 'Unknown',
          awayTeam: pick.gameInfo?.awayTeam || 'Unknown', 
          selection: pick.betInfo?.selection || 'Unknown',
          market: pick.betInfo?.market || 'moneyline',
          line: pick.betInfo?.line?.toString() || null,
          units: pick.betInfo?.units || 1,
          bookmaker: pick.bookmaker?.key || 'manual',
          bookmakerDisplayName: pick.bookmaker?.displayName || pick.bookmaker?.title || 'Manual Entry',
          gameDate: pick.gameInfo?.gameTime?.split('T')[0] || new Date().toISOString().split('T')[0],
          gameTime: pick.gameInfo?.gameTime || new Date().toISOString(),
          odds: pick.betInfo?.odds?.toString() || '0',
          parlayLegs: pick.betInfo?.parlayLegs ? JSON.stringify(pick.betInfo.parlayLegs) : null
        };
        
        // Save to database via API
        const response = await fetch('/api/user/picks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(dbPickData),
          credentials: 'include'
        });
        
        if (response.ok) {
          console.log('✓ Migrated pick:', pick.id);
          migratedCount++;
        } else {
          const errorText = await response.text();
          console.error('✗ Failed to migrate pick:', pick.id, errorText);
          errorCount++;
        }
        
      } catch (error) {
        console.error('✗ Error migrating pick:', pick.id, error);
        errorCount++;
      }
    }
    
    console.log(`Migration complete: ${migratedCount} successful, ${errorCount} errors`);
    
    if (migratedCount > 0) {
      console.log('Migration successful! You can now clear localStorage picks.');
      // Don't auto-clear - let user verify first
    }
    
  } catch (error) {
    console.error('Error parsing picks from localStorage:', error);
  }
}

// Also migrate bet unit preference
async function migrateBetUnit() {
  const betUnitKey = 'bet-bot-bet-unit';
  const storedBetUnit = localStorage.getItem(betUnitKey);
  
  if (storedBetUnit) {
    try {
      const betUnit = parseFloat(storedBetUnit);
      console.log('Migrating bet unit:', betUnit);
      
      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ betUnit }),
        credentials: 'include'
      });
      
      if (response.ok) {
        console.log('✓ Bet unit migrated successfully');
      } else {
        console.error('✗ Failed to migrate bet unit');
      }
    } catch (error) {
      console.error('Error migrating bet unit:', error);
    }
  }
}

// Run migration
migratePicks().then(() => migrateBetUnit());