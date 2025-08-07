export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  try {
    const { gameId, homeTeam, awayTeam } = req.query;
    
    if (!gameId) {
      return res.status(400).json({ error: 'Game ID is required' });
    }
    
    console.log(`🔍 Fetching live data for game ${gameId}`);
    
    // Try multiple MLB API endpoints
    const urls = [
      `https://statsapi.mlb.com/api/v1/game/${gameId}/feed/live`,
      `https://statsapi.mlb.com/api/v1/game/${gameId}/linescore`,
      `https://statsapi.mlb.com/api/v1/schedule?sportId=1&gamePk=${gameId}&hydrate=linescore,game(content(summary,media(epg))),team`
    ];
    
    for (const url of urls) {
      try {
        console.log(`🔍 Trying URL: ${url}`);
        const response = await fetch(url);
        console.log(`🔍 Response status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`🔍 Got data from ${url}`);
          
          // Try to extract live data from different API formats
          let gameData, liveData, linescore;
          
          if (data.gameData && data.liveData) {
            // Live feed format
            gameData = data.gameData;
            liveData = data.liveData;
            linescore = liveData.linescore;
          } else if (data.dates && data.dates[0] && data.dates[0].games[0]) {
            // Schedule API format
            const game = data.dates[0].games[0];
            gameData = game;
            linescore = game.linescore;
          } else if (data.teams) {
            // Direct linescore format
            linescore = data;
            gameData = data;
          }
          
          if (linescore && gameData) {
            console.log(`🔍 Processing live data...`);
            
            const result = {
              gameId: gameId,
              status: {
                detailed: gameData.status?.detailedState || 'Unknown',
                abstract: gameData.status?.abstractGameState || 'Unknown',
                inProgress: gameData.status?.abstractGameState === 'Live' || 
                           gameData.status?.detailedState?.includes('In Progress')
              },
              score: {
                home: linescore.teams?.home?.runs || gameData.teams?.home?.score || 0,
                away: linescore.teams?.away?.runs || gameData.teams?.away?.score || 0
              },
              inning: {
                current: linescore.currentInning || 1,
                state: linescore.inningState || 'Top',
                half: linescore.inningState?.toLowerCase() || 'top'
              },
              count: {
                balls: linescore.balls || 0,
                strikes: linescore.strikes || 0,
                outs: linescore.outs || 0
              },
              currentBatter: {
                id: linescore.offense?.batter?.id || null,
                name: linescore.offense?.batter?.fullName || linescore.offense?.batter?.nameFirstLast || 'Unknown batter',
                team: linescore.inningState === 'Top' ? 
                  gameData.teams?.away?.abbreviation || 'AWAY' : 
                  gameData.teams?.home?.abbreviation || 'HOME'
              },
              currentPitcher: {
                id: linescore.defense?.pitcher?.id || null,
                name: linescore.defense?.pitcher?.fullName || linescore.defense?.pitcher?.nameFirstLast || 'Unknown pitcher',
                pitchCount: linescore.defense?.pitcher?.pitchCount || 0
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
