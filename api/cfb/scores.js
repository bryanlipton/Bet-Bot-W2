export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  try {
    const { week, season, seasontype, group } = req.query;
    
    // Default to current week/season
    const currentSeason = season || new Date().getFullYear();
    const currentWeek = week || getCurrentCFBWeek();
    const currentSeasonType = seasontype || '2'; // 1=preseason, 2=regular, 3=playoffs
    const currentGroup = group || '80'; // 80=FBS (Division 1)
    
    // ESPN College Football API endpoint
    const cfbUrl = `https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?seasontype=${currentSeasonType}&week=${currentWeek}&year=${currentSeason}&group=${currentGroup}`;
    
    console.log(`Fetching CFB data from: ${cfbUrl}`);
    
    const response = await fetch(cfbUrl);
    if (!response.ok) {
      throw new Error(`ESPN CFB API failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Process data similar to your MLB structure
    const allGames = data.events?.map(event => {
      const game = event;
      const homeTeam = game.competitions[0].competitors.find(c => c.homeAway === 'home');
      const awayTeam = game.competitions[0].competitors.find(c => c.homeAway === 'away');
      
      return {
        id: `cfb_${game.id}`,
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
        // College-specific info
        conference: {
          home: homeTeam?.team?.conferenceId || null,
          away: awayTeam?.team?.conferenceId || null
        },
        ranking: {
          home: homeTeam?.curatedRank?.current || null,
          away: awayTeam?.curatedRank?.current || null
        },
        linescore: game.status?.period ? {
          currentQuarter: game.status.period,
          clock: game.status.displayClock,
          possession: game.competitions[0]?.situation?.possession,
          down: game.competitions[0]?.situation?.shortDownDistanceText
        } : undefined,
        sportKey: 'americanfootball_ncaaf'
      };
    }) || [];
    
    console.log(`Processed ${allGames.length} CFB games`);
    
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
    
    console.log(`Categorized CFB games: ${liveGames.length} live, ${scheduledGames.length} scheduled, ${finishedGames.length} finished`);
    
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
      group: currentGroup,
      success: true,
      debug: {
        apiUrl: cfbUrl,
        categories: {
          live: liveGames.length,
          scheduled: scheduledGames.length,
          finished: finishedGames.length
        }
      }
    });
    
  } catch (error) {
    console.error('Error in CFB scores API:', error);
    res.status(500).json({
      error: 'Failed to fetch CFB scores',
      message: error.message,
      liveGames: [],
      scheduledGames: [],
      finishedGames: [],
      games: []
    });
  }
}

// Helper function to get current CFB week
function getCurrentCFBWeek() {
  // College football season typically starts late August/early September
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-based
  
  // Simple logic: August/September = Week 1, increment weekly
  if (month < 7) return 1; // Before August
  if (month > 11) return 15; // After season
  
  // Rough estimate - you can refine this
  const augustStart = new Date(year, 7, 20); // August 20
  const weeksSince = Math.floor((now - augustStart) / (7 * 24 * 60 * 60 * 1000));
  return Math.min(Math.max(weeksSince + 1, 1), 15);
}
