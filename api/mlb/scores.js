export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  try {
    // Get today's date in EST/EDT (where MLB operates)
    const today = new Date();
    const easternDate = new Date(today.toLocaleString("en-US", {timeZone: "America/New_York"}));
    const dateStr = easternDate.toISOString().split('T')[0];
    
    console.log(`Fetching MLB scores for date: ${dateStr}`);
    
    const mlbUrl = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${dateStr}&hydrate=team,linescore,venue,probablePitcher,weather`;
    console.log(`MLB API URL: ${mlbUrl}`);
    
    const response = await fetch(mlbUrl);
    
    if (!response.ok) {
      console.error(`MLB API error: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({ 
        error: `MLB API error: ${response.status}`,
        date: dateStr,
        url: mlbUrl
      });
    }
    
    const data = await response.json();
    console.log(`MLB API returned data for ${data.dates?.length || 0} dates`);
    
    if (!data.dates || data.dates.length === 0) {
      console.log('No dates found in MLB API response');
      return res.status(200).json({
        games: [],
        liveGames: [],
        scheduledGames: [],
        finishedGames: [],
        message: 'No games found',
        date: dateStr,
        totalDates: 0
      });
    }
    
    // Process all games from all dates
    const allGames = data.dates.flatMap(date => 
      date.games?.map((game) => ({
        id: `mlb_${game.gamePk}`,
        gameId: game.gamePk,
        homeTeam: game.teams?.home?.team?.name || 'Unknown',
        awayTeam: game.teams?.away?.team?.name || 'Unknown', 
        homeScore: game.teams?.home?.score || 0,
        awayScore: game.teams?.away?.score || 0,
        status: game.status?.detailedState || 'Scheduled',
        abstractGameState: game.status?.abstractGameState || 'Preview',
        startTime: game.gameDate,
        venue: game.venue?.name || '',
        inning: game.linescore?.currentInning ? 
          `${game.linescore.inningState || ''} ${game.linescore.currentInning}` : undefined,
        linescore: game.linescore ? {
          currentInning: game.linescore.currentInning,
          inningState: game.linescore.inningState,
          balls: game.linescore.balls,
          strikes: game.linescore.strikes,
          outs: game.linescore.outs
        } : undefined,
        sportKey: 'baseball_mlb'
      })) || []
    );
    
    console.log(`Processed ${allGames.length} total games`);
    
    // Categorize games by status for your Scores component
    const liveGames = allGames.filter(game => {
      const status = game.status.toLowerCase();
      const state = game.abstractGameState.toLowerCase();
      return status.includes('live') || 
             status.includes('progress') ||
             status.includes('inning') ||
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
    
    console.log(`Categorized games: ${liveGames.length} live, ${scheduledGames.length} scheduled, ${finishedGames.length} finished`);
    
    // Return data in the format your Scores component expects
    res.status(200).json({
      // Categorized arrays for your Scores component
      liveGames,
      scheduledGames, 
      finishedGames,
      // Flat array for compatibility
      games: allGames,
      // Metadata
      totalGames: allGames.length,
      date: dateStr,
      success: true,
      debug: {
        totalDates: data.dates.length,
        apiUrl: mlbUrl,
        categories: {
          live: liveGames.length,
          scheduled: scheduledGames.length,
          finished: finishedGames.length
        }
      }
    });
    
  } catch (error) {
    console.error('Error in MLB scores API:', error);
    res.status(500).json({ 
      error: "Failed to fetch scores",
      message: error.message,
      date: new Date().toISOString().split('T')[0],
      success: false
    });
  }
}
