export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  try {
    const { gameId } = req.query;
    const { homeTeam, awayTeam } = req.query;
    
    console.log(`Fetching live data for game ${gameId}`);
    
    // Try the comprehensive live feed first
    let response = await fetch(
      `https://statsapi.mlb.com/api/v1/game/${gameId}/feed/live`
    );
    
    if (response.ok) {
      const liveData = await response.json();
      
      // Extract and transform the live game data
      const gameData = liveData.gameData;
      const liveData_current = liveData.liveData;
      const linescore = liveData_current?.linescore;
      
      // Build the response structure your modal expects
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
    
    // Fallback to schedule API if live feed unavailable
    const today = new Date().toISOString().split('T')[0];
    const fallbackResponse = await fetch(
      `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${today}&hydrate=team,linescore&gamePk=${gameId}`
    );
    
    if (fallbackResponse.ok) {
      const scheduleData = await fallbackResponse.json();
      const game = scheduleData.dates?.[0]?.games?.[0];
      
      if (game) {
        const result = {
          gameId: gameId,
          status: {
            detailed: game.status?.detailedState || 'Scheduled',
            abstract: game.status?.abstractGameState || 'Preview',
            inProgress: game.status?.abstractGameState === 'Live'
          },
          score: {
            home: game.teams?.home?.score || 0,
            away: game.teams?.away?.score || 0
          },
          inning: {
            current: game.linescore?.currentInning || 1,
            state: game.linescore?.inningState || 'Top',
            half: game.linescore?.inningState?.toLowerCase() || 'top'
          },
          count: {
            balls: game.linescore?.balls || 0,
            strikes: game.linescore?.strikes || 0,
            outs: game.linescore?.outs || 0
          },
          currentBatter: {
            id: null,
            name: game.status?.abstractGameState === 'Preview' ? 'Game not started' : 'Unknown batter',
            team: 'N/A'
          },
          currentPitcher: {
            id: null,
            name: game.status?.abstractGameState === 'Preview' ? 'Game not started' : 'Unknown pitcher',
            pitchCount: 0
          },
          baseRunners: {
            first: null,
            second: null,
            third: null
          },
          teams: {
            home: {
              name: game.teams?.home?.team?.name || homeTeam,
              abbreviation: game.teams?.home?.team?.abbreviation || 'HOME'
            },
            away: {
              name: game.teams?.away?.team?.name || awayTeam,
              abbreviation: game.teams?.away?.team?.abbreviation || 'AWAY'
            }
          },
          lastUpdate: new Date().toISOString()
        };
        
        return res.status(200).json(result);
      }
    }
    
    // Final fallback - return minimal data structure
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
      note: 'Live data not available'
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
