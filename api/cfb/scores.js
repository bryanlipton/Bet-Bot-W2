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
