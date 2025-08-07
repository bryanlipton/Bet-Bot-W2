export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  try {
    const { gameId, homeTeam, awayTeam } = req.query;
    
    if (!gameId) {
      return res.status(400).json({ error: 'Game ID is required' });
    }
    
    console.log(`Fetching live data for game ${gameId}`);
    
    // Try the MLB live feed API
    const response = await fetch(
      `https://statsapi.mlb.com/api/v1/game/${gameId}/feed/live`
    );
    
    if (response.ok) {
      const data = await response.json();
      const gameData = data.gameData;
      const liveData = data.liveData;
      const linescore = liveData?.linescore;
      
      // Format response for your modal
      const result = {
        gameId: gameId,
        status: {
          detailed: gameData?.status?.detailedState || 'Unknown',
          abstract: gameData?.status?.abstractGameState || 'Unknown',
          inProgress: gameData?.status?.abstractGameState === 'Live'
        },
        score: {
          home: linescore?.teams?.home?.runs || 0,
          away: linescore?.teams?.away?.runs || 0
        },
        inning: {
          current: linescore?.currentInning || 1,
          state: linescore?.inningState || 'Top',
          half: linescore?.inningState?.toLowerCase() || 'top'
        },
        count: {
          balls: linescore?.balls || 0,
          strikes: linescore?.strikes || 0,
          outs: linescore?.outs || 0
        },
        currentBatter: {
          id: linescore?.offense?.batter?.id || null,
          name: linescore?.offense?.batter?.fullName || 'No batter',
          team: linescore?.inningState === 'Top' ? 
            gameData?.teams?.away?.abbreviation : 
            gameData?.teams?.home?.abbreviation
        },
        currentPitcher: {
          id: linescore?.defense?.pitcher?.id || null,
          name: linescore?.defense?.pitcher?.fullName || 'No pitcher',
          pitchCount: linescore?.defense?.pitcher?.pitchCount || 0
        },
        baseRunners: {
          first: linescore?.offense?.first ? {
            id: linescore.offense.first.id,
            fullName: linescore.offense.first.fullName,
            name: linescore.offense.first.fullName
          } : null,
          second: linescore?.offense?.second ? {
            id: linescore.offense.second.id,
            fullName: linescore.offense.second.fullName,
            name: linescore.offense.second.fullName
          } : null,
          third: linescore?.offense?.third ? {
            id: linescore.offense.third.id,
            fullName: linescore.offense.third.fullName,
            name: linescore.offense.third.fullName
          } : null
        },
        teams: {
          home: {
            name: gameData?.teams?.home?.name || homeTeam,
            abbreviation: gameData?.teams?.home?.abbreviation || 'HOME'
          },
          away: {
            name: gameData?.teams?.away?.name || awayTeam,
            abbreviation: gameData?.teams?.away?.abbreviation || 'AWAY'
          }
        },
        lastUpdate: new Date().toISOString()
      };
      
      return res.status(200).json(result);
    }
    
    // Fallback for non-live games
    res.status(200).json({
      gameId: gameId,
      status: { detailed: 'Scheduled', abstract: 'Preview', inProgress: false },
      score: { home: 0, away: 0 },
      inning: { current: 1, state: 'Top', half: 'top' },
      count: { balls: 0, strikes: 0, outs: 0 },
      currentBatter: { id: null, name: 'Game not started', team: 'N/A' },
      currentPitcher: { id: null, name: 'Game not started', pitchCount: 0 },
      baseRunners: { first: null, second: null, third: null },
      teams: {
        home: { name: homeTeam || 'Home Team', abbreviation: 'HOME' },
        away: { name: awayTeam || 'Away Team', abbreviation: 'AWAY' }
      },
      lastUpdate: new Date().toISOString(),
      note: 'Game not live yet'
    });
    
  } catch (error) {
    console.error('Live game API error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch live game data',
      message: error.message,
      gameId: gameId
    });
  }
}
