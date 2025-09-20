export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  try {
    const { gameId } = req.query;
    const { homeTeam, awayTeam } = req.query;
    
    if (!gameId) {
      return res.status(400).json({ error: 'Game ID is required' });
    }
    
    console.log(`Fetching live data for game ${gameId}: ${awayTeam} @ ${homeTeam}`);
    
    // MLB API endpoints to try for live data
    const mlbUrls = [
      `https://statsapi.mlb.com/api/v1.1/game/${gameId}/feed/live`,
      `https://statsapi.mlb.com/api/v1/game/${gameId}/linescore`,
      `https://statsapi.mlb.com/api/v1/game/${gameId}/feed/live?timecode=now`,
    ];
    
    for (const url of mlbUrls) {
      try {
        console.log(`Trying MLB API: ${url}`);
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Success with ${url}`);
          
          // Extract live game data from MLB API response
          const gameData = data.gameData || data;
          const liveData = data.liveData || data;
          const linescore = liveData.linescore || data.linescore || data;
          
          // Build comprehensive live game response
          const result = {
            gameId: gameId,
            status: {
              detailed: gameData.status?.detailedState || liveData.gameState || 'Unknown',
              abstract: gameData.status?.abstractGameState || 'Unknown',
              inProgress: gameData.status?.abstractGameState === 'Live' || false
            },
            score: {
              home: linescore.teams?.home?.runs || liveData.boxscore?.teams?.home?.teamStats?.batting?.runs || 0,
              away: linescore.teams?.away?.runs || liveData.boxscore?.teams?.away?.teamStats?.batting?.runs || 0
            },
            inning: {
              current: linescore.currentInning || 1,
              state: linescore.inningState || 'Top',
              half: linescore.inningHalf || 'top'
            },
            count: {
              balls: linescore.balls || 0,
              strikes: linescore.strikes || 0,
              outs: linescore.outs || 0
            },
            currentBatter: liveData.plays?.currentPlay?.matchup?.batter ? {
              id: liveData.plays.currentPlay.matchup.batter.id,
              name: liveData.plays.currentPlay.matchup.batter.fullName || 'Unknown Batter',
              team: liveData.plays.currentPlay.about?.halfInning === 'top' ? awayTeam : homeTeam
            } : {
              id: null,
              name: 'No current batter',
              team: 'N/A'
            },
            currentPitcher: liveData.plays?.currentPlay?.matchup?.pitcher ? {
              id: liveData.plays.currentPlay.matchup.pitcher.id,
              name: liveData.plays.currentPlay.matchup.pitcher.fullName || 'Unknown Pitcher',
              pitchCount: liveData.plays.currentPlay.matchup.pitcher.pitchHand?.code || 'N/A'
            } : {
              id: null,
              name: 'No current pitcher',
              pitchCount: 0
            },
            baseRunners: {
              first: linescore.offense?.first ? {
                id: linescore.offense.first.id,
                fullName: linescore.offense.first.fullName || linescore.offense.first.nameFirstLast,
                name: linescore.offense.first.fullName || linescore.offense.first.nameFirstLast
              } : null,
              second: linescore.offense?.second ? {
                id: linescore.offense.second.id,
                fullName: linescore.offense.second.fullName || linescore.offense.second.nameFirstLast,
                name: linescore.offense.second.fullName || linescore.offense.second.nameFirstLast
              } : null,
              third: linescore.offense?.third ? {
                id: linescore.offense.third.id,
                fullName: linescore.offense.third.fullName || linescore.offense.third.nameFirstLast,
                name: linescore.offense.third.fullName || linescore.offense.third.nameFirstLast
              } : null
            },
            teams: {
              home: {
                name: gameData.teams?.home?.team?.name || gameData.teams?.home?.name || homeTeam,
                abbreviation: gameData.teams?.home?.team?.abbreviation || gameData.teams?.home?.abbreviation || 'HOME'
              },
              away: {
                name: gameData.teams?.away?.team?.name || gameData.teams?.away?.name || awayTeam,
                abbreviation: gameData.teams?.away?.team?.abbreviation || gameData.teams?.away?.abbreviation || 'AWAY'
              }
            },
            lastUpdate: new Date().toISOString(),
            apiSource: url
          };
          
          console.log(`✅ Returning live data:`, JSON.stringify(result, null, 2));
          return res.status(200).json(result);
        }
      } catch (error) {
        console.log(`❌ Error with ${url}:`, error.message);
        continue;
      }
    }
    
    // Final fallback
    console.log(`❌ All MLB API calls failed, returning fallback`);
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
      note: 'Could not fetch live data from any MLB API'
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
