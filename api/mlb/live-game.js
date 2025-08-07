export default async function handler(req, res) {
  const { gameId, homeTeam, awayTeam } = req.query;

  if (!gameId) {
    return res.status(400).json({ error: 'gameId is required' });
  }

  console.log(`🔍 Live Game Request: ID=${gameId}, Home=${homeTeam}, Away=${awayTeam}`);

  try {
    // Try multiple MLB API endpoints
    const urls = [
      `https://statsapi.mlb.com/api/v1/game/${gameId}/feed/live`,
      `https://statsapi.mlb.com/api/v1/game/${gameId}/linescore`,
      `https://statsapi.mlb.com/api/v1.1/game/${gameId}/feed/live`
    ];

    for (const url of urls) {
      try {
        console.log(`🔄 Trying: ${url}`);
        const response = await fetch(url);
        
        if (!response.ok) {
          console.log(`❌ Failed ${response.status}: ${url}`);
          continue;
        }

        const data = await response.json();
        console.log(`✅ Got data from: ${url}`);

        // Check if this is live game data
        const gameData = data.gameData || data;
        const liveData = data.liveData || data;
        const linescore = liveData.linescore || data.linescore;

        if (linescore && gameData) {
          // Detect if game is actually LIVE with multiple checks
          const gameStatus = gameData.status?.abstractGameState || '';
          const detailedStatus = gameData.status?.detailedState || '';
          const statusCode = gameData.status?.statusCode || '';
          
          // Multiple ways to detect live games
          const isLive = 
            gameStatus === 'Live' ||
            gameStatus === 'In Progress' ||
            detailedStatus.includes('In Progress') ||
            detailedStatus.includes('Bottom') ||
            detailedStatus.includes('Top') ||
            detailedStatus.includes('Middle') ||
            detailedStatus.includes('End') ||
            statusCode === 'I' ||
            statusCode === 'IR' ||
            (linescore.currentInning && linescore.currentInning > 0);

          console.log(`🎯 Live Detection: Status=${gameStatus}, Detailed=${detailedStatus}, Code=${statusCode}, IsLive=${isLive}`);

          // Get scores
          const homeScore = linescore.teams?.home?.runs || 
                           gameData.teams?.home?.score || 
                           liveData.boxscore?.teams?.home?.teamStats?.batting?.runs || 0;
          
          const awayScore = linescore.teams?.away?.runs || 
                           gameData.teams?.away?.score || 
                           liveData.boxscore?.teams?.away?.teamStats?.batting?.runs || 0;

          // Get current batter info
          let currentBatter = { id: null, name: 'No batter', team: 'N/A' };
          if (liveData.plays?.currentPlay?.matchup?.batter) {
            const batter = liveData.plays.currentPlay.matchup.batter;
            currentBatter = {
              id: batter.id,
              name: batter.fullName || `${batter.firstName} ${batter.lastName}`,
              team: batter.team?.abbreviation || 'N/A'
            };
          }

          // Get current pitcher info
          let currentPitcher = { id: null, name: 'No pitcher', pitchCount: 0 };
          if (liveData.plays?.currentPlay?.matchup?.pitcher) {
            const pitcher = liveData.plays.currentPlay.matchup.pitcher;
            currentPitcher = {
              id: pitcher.id,
              name: pitcher.fullName || `${pitcher.firstName} ${pitcher.lastName}`,
              pitchCount: liveData.plays?.currentPlay?.pitchIndex || 0
            };
          }

          // Get base runners
          const baseRunners = {
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
          };

          const result = {
            gameId: gameId,
            status: {
              detailed: isLive ? 'LIVE' : detailedStatus || 'Scheduled',
              abstract: isLive ? 'Live' : gameStatus || 'Preview',
              inProgress: isLive
            },
            score: {
              home: homeScore,
              away: awayScore
            },
            inning: {
              current: linescore.currentInning || 1,
              state: linescore.inningHalf === 'top' ? 'Top' : 
                     linescore.inningHalf === 'bottom' ? 'Bottom' : 
                     linescore.inningState || 'Top',
              half: linescore.inningHalf || 'top'
            },
            count: {
              balls: linescore.balls || 0,
              strikes: linescore.strikes || 0,
              outs: linescore.outs || 0
            },
            currentBatter,
            currentPitcher,
            baseRunners,
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
          
          console.log(`✅ Returning ${isLive ? 'LIVE' : 'SCHEDULED'} data for game ${gameId}`);
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
