// Helper function to get current CFB week
function getCurrentCFBWeek() {
  const now = new Date();
  const month = now.getMonth(); // 0-based (8 = September)
  const date = now.getDate();
  const dayOfWeek = now.getDay(); // 0=Sunday, 1=Monday, 2=Tuesday, etc.
  const hour = now.getHours();
  
  // September 2025 CFB week mapping (corrected)
  if (month === 8) { // September
    // Week 1: Aug 31 - Sep 2 (games Aug 31)
    if (date <= 2) return 1;
    
    // Week 2: Sep 3 - Sep 9 (games Sep 7) 
    if (date >= 3 && date <= 9) return 2;
    
    // Week 3: Sep 10 - Sep 16 (games Sep 14)
    if (date >= 10 && date <= 16) return 3;
    
    // Week 4: Sep 17 - Sep 23 (games Sep 21) - CURRENT WEEK
    if (date >= 17 && date <= 23) {
      // Stay on Week 4 until Tuesday midnight Sep 24
      if (date === 23 && dayOfWeek === 1) return 4; // Monday - stay on Week 4
      if (date === 24 && dayOfWeek === 2 && hour >= 0) return 5; // Tue midnight - advance to Week 5
      return 4;
    }
    
    // Week 5: Sep 24 - Sep 30 (games Sep 28)
    if (date >= 24 && date <= 30) return 5;
  }
  
  // October and beyond
  if (month === 9) { // October
    return Math.min(5 + Math.floor(date / 7), 15);
  }
  
  // Default fallback
  return 4;
}export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  try {
    const { week, season, seasontype, group } = req.query;
    
    // Default to current week/season
    const currentSeason = season || new Date().getFullYear();
    const currentWeek = week || getCurrentCFBWeek();
    const currentSeasonType = seasontype || '2'; // 1=preseason, 2=regular, 3=playoffs
    const currentGroup = group || '80'; // 80=FBS (Division 1)
    
    // ESPN College Football API endpoint - remove group filter to get all games
    const cfbUrl = `https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?seasontype=${currentSeasonType}&week=${currentWeek}&year=${currentSeason}&limit=200`;
    
    console.log(`Fetching CFB data from: ${cfbUrl}`);
    
    const response = await fetch(cfbUrl);
    if (!response.ok) {
      throw new Error(`ESPN CFB API failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Helper function to map ESPN status to MLB-like format
    function mapESPNStatus(espnStatus, espnState, hasScores) {
      if (!espnStatus) return { status: 'Scheduled', abstractGameState: 'Preview' };
      
      const status = espnStatus.toLowerCase();
      const state = espnState?.toLowerCase() || '';
      
      // Map to MLB-like status values that your component expects
      if (status.includes('final') || state === 'post') {
        return { status: 'Final', abstractGameState: 'Final' };
      }
      
      if (status.includes('progress') || status.includes('quarter') || status.includes('halftime') || 
          state === 'in' || (hasScores && (status.includes('1st') || status.includes('2nd') || 
          status.includes('3rd') || status.includes('4th')))) {
        return { status: 'In Progress', abstractGameState: 'Live' };
      }
      
      return { status: 'Scheduled', abstractGameState: 'Preview' };
    }
    
    // Process data similar to your MLB structure
    const allGames = data.events?.map(event => {
      const game = event;
      const homeTeam = game.competitions[0].competitors.find(c => c.homeAway === 'home');
      const awayTeam = game.competitions[0].competitors.find(c => c.homeAway === 'away');
      
      const homeScore = parseInt(homeTeam?.score || 0);
      const awayScore = parseInt(awayTeam?.score || 0);
      const hasScores = homeScore > 0 || awayScore > 0;
      
      // Map ESPN status to MLB-compatible format
      const mappedStatus = mapESPNStatus(
        game.status?.type?.description, 
        game.status?.type?.state,
        hasScores
      );
      
      return {
        id: `cfb_${game.id}`,
        gameId: game.id,
        homeTeam: homeTeam?.team?.displayName || homeTeam?.team?.name || 'Home',
        awayTeam: awayTeam?.team?.displayName || awayTeam?.team?.name || 'Away',
        homeScore: homeScore,
        awayScore: awayScore,
        
        // Use mapped status that matches MLB format
        status: mappedStatus.status,
        abstractGameState: mappedStatus.abstractGameState,
        
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
    
    // Sort all games by start time before categorizing
    allGames.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    
    // Categorize games using the same logic as MLB (but with mapped statuses)
    const liveGames = allGames.filter(game => {
      const status = game.status.toLowerCase();
      const state = game.abstractGameState.toLowerCase();
      return status.includes('progress') || 
             status.includes('live') ||
             state === 'live' ||
             game.abstractGameState === 'Live';
    });

    const scheduledGames = allGames.filter(game => {
      const status = game.status.toLowerCase();
      const state = game.abstractGameState.toLowerCase();
      return status === 'scheduled' || 
             state === 'preview' ||
             status.includes('warmup') ||
             status.includes('delayed');
    });

    const finishedGames = allGames.filter(game => {
      const status = game.status.toLowerCase();
      const state = game.abstractGameState.toLowerCase();
      return status.includes('final') ||
             state === 'final' ||
             status.includes('completed');
    });
    
    // Sort each category by start time for proper chronological display
    liveGames.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    scheduledGames.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    finishedGames.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    
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
  const now = new Date();
  const year = now.getFullYear();
  
  // CFB season typically starts first Saturday of September
  // Week boundaries: Tuesday midnight to Monday 11:59 PM
  const seasonStart = new Date(year, 8, 1); // September 1st
  
  // Find first Saturday of September (Week 1 start)
  while (seasonStart.getDay() !== 6) {
    seasonStart.setDate(seasonStart.getDate() + 1);
  }
  
  // Calculate weeks since season start, but account for Tuesday rollover
  const currentDate = new Date(now);
  
  // If it's Monday or early Tuesday (before midnight), stay on current week
  // If it's Tuesday midnight or later, advance to next week
  const dayOfWeek = currentDate.getDay(); // 0=Sunday, 1=Monday, 2=Tuesday, etc.
  const hour = currentDate.getHours();
  
  // Adjust the date for week calculation
  if (dayOfWeek === 2 && hour >= 0) {
    // Tuesday midnight or later - advance to next week
    currentDate.setDate(currentDate.getDate() + 1);
  } else if (dayOfWeek < 2) {
    // Sunday or Monday - stay on current week (don't advance)
    // No adjustment needed
  }
  
  // Calculate weeks since season start
  const daysSinceStart = Math.floor((currentDate - seasonStart) / (24 * 60 * 60 * 1000));
  const weeksSinceStart = Math.floor(daysSinceStart / 7);
  
  const calculatedWeek = Math.max(1, weeksSinceStart + 1);
  
  // Cap at Week 15 (end of regular season)
  return Math.min(calculatedWeek, 15);
}
