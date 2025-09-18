export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  try {
    const { week, season, seasontype } = req.query;
    
    // Default to current week/season
    const currentSeason = season || new Date().getFullYear();
    const currentWeek = week || getCurrentNFLWeek();
    const currentSeasonType = seasontype || '2'; // 1=preseason, 2=regular, 3=playoffs
    
    // ESPN NFL API endpoint (same pattern as MLB)
    const nflUrl = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=${currentSeasonType}&week=${currentWeek}&year=${currentSeason}`;
    
    console.log(`Fetching NFL data from: ${nflUrl}`);
    
    const response = await fetch(nflUrl);
    if (!response.ok) {
      throw new Error(`ESPN NFL API failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Process data similar to your MLB structure
    const allGames = data.events?.map(event => {
      const game = event;
      const homeTeam = game.competitions[0].competitors.find(c => c.homeAway === 'home');
      const awayTeam = game.competitions[0].competitors.find(c => c.homeAway === 'away');
      
      return {
        id: `nfl_${game.id}`,
        gameId: game.id,
        homeTeam: homeTeam?.team?.displayName || homeTeam?.team?.name || 'Home',
        awayTeam: awayTeam?.team?.displayName || awayTeam?.team?.name || 'Away',
        homeScore: parseInt(homeTeam?.score || 0),
        awayScore: parseInt(awayTeam?.score || 0),
        status: game.status?.type?.description || 'Scheduled',
        abstractGameState: game.status?.type?.state || 'pre',
        startTime: game.date,
        venue: game.competitions[0]?.venue?.fullName || 'TBD',
        // Football-specific: Quarter instead of inning
        quarter: game.status?.period ? `Q${game.status.period}` : undefined,
        clock: game.status?.displayClock || undefined,
        possession: game.competitions[0]?.situation?.possession || undefined,
        down: game.competitions[0]?.situation?.shortDownDistanceText || undefined,
        linescore: game.status?.period ? {
          currentQuarter: game.status.period,
          clock: game.status.displayClock,
          possession: game.competitions[0]?.situation?.possession,
          down: game.competitions[0]?.situation?.shortDownDistanceText
        } : undefined,
        sportKey: 'americanfootball_nfl'
      };
    }) || [];
    
    console.log(`Processed ${allGames.length} NFL games`);
    
    // Categorize games by status (same logic as MLB)
    const liveGames = allGames.filter(game => {
      const status = game.status.toLowerCase();
      const state = game.abstractGameState.toLowerCase();
      return status.includes('progress') || 
             status.includes('quarter') ||
             status.includes('halftime') ||
             state === 'in' ||
             game.abstractGameState === 'in';
    });

    const scheduledGames = allGames.filter(game => {
      const status = game.status.toLowerCase();
      const state = game.abstractGameState.toLowerCase();
      return status === 'scheduled' || 
             state === 'pre' ||
             status.includes('upcoming');
    });

    const finishedGames = allGames.filter(game => {
      const status = game.status.toLowerCase();
      const state = game.abstractGameState.toLowerCase();
      return status.includes('final') ||
             state === 'post' ||
             status.includes('completed');
    });
    
    console.log(`Categorized NFL games: ${liveGames.length} live, ${scheduledGames.length} scheduled, ${finishedGames.length} finished`);
    
    // Return data in same format as your MLB scores
    res.status(200).json({
      liveGames,
      scheduledGames, 
      finishedGames,
      games: allGames,
      totalGames: allGames.length,
      week: currentWeek,
      season: currentSeason,
      seasonType: currentSeasonType,
      success: true,
      debug: {
        apiUrl: nflUrl,
        categories: {
          live: liveGames.length,
          scheduled: scheduledGames.length,
          finished: finishedGames.length
        }
      }
    });
    
  } catch (error) {
    console.error('Error in NFL scores API:', error);
    res.status(500).json({
      error: 'Failed to fetch NFL scores',
      message: error.message,
      liveGames: [],
      scheduledGames: [],
      finishedGames: [],
      games: []
    });
  }
}

// Helper function to get current NFL week
function getCurrentNFLWeek() {
  // NFL season typically starts first week of September
  // This is a simplified version - you might want more sophisticated logic
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-based
  
  // Simple logic: September = Week 1, increment weekly
  if (month < 8) return 1; // Before September
  if (month > 11) return 18; // After season
  
  // Rough estimate - you can refine this
  const septemberStart = new Date(year, 8, 1); // September 1
  const weeksSince = Math.floor((now - septemberStart) / (7 * 24 * 60 * 60 * 1000));
  return Math.min(Math.max(weeksSince + 1, 1), 18);
}
