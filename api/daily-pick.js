// api/daily-pick.js - Complete implementation with all rules
// In-memory cache for 24-hour persistence
let cachedDailyPick = null;
let cachedLockPick = null;
let cacheDate = null;
let yesterdaysTeams = [];
let lastResetTime = null;

// Grade order for validation
const GRADE_ORDER = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F'];

// Check if grade meets minimum C+ requirement
function meetsGradeRequirement(grade) {
  const gradeIndex = GRADE_ORDER.indexOf(grade);
  const minIndex = GRADE_ORDER.indexOf('C+');
  return gradeIndex >= 0 && gradeIndex <= minIndex;
}

// Check if it's after 2 AM EST
function shouldResetPicks() {
  const now = new Date();
  const estOffset = -5; // EST timezone
  const currentEST = new Date(now.getTime() + (estOffset * 60 * 60 * 1000));
  const currentHour = currentEST.getHours();
  const today = currentEST.toISOString().split('T')[0];
  
  // Reset if: new day OR after 2 AM EST and haven't reset today yet
  if (cacheDate !== today) {
    if (currentHour >= 2) {
      return true;
    }
  }
  
  return false;
}

// Store yesterday's teams for rotation
function updateYesterdaysTeams() {
  if (cachedDailyPick && cachedLockPick) {
    yesterdaysTeams = [
      cachedDailyPick.pickTeam,
      cachedLockPick.pickTeam
    ].filter(Boolean);
    console.log('📋 Yesterday\'s teams stored for rotation:', yesterdaysTeams);
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    console.log('📅 Daily pick request received');
    
    // Check if we should generate new picks (2 AM EST reset)
    if (shouldResetPicks() || !cachedDailyPick) {
      console.log('🔄 Triggering 2 AM EST daily reset');
      
      // Store yesterday's teams before generating new picks
      updateYesterdaysTeams();
      
      const today = new Date().toISOString().split('T')[0];
      const mlServerUrl = process.env.ML_SERVER_URL || 'http://104.236.118.108:3001';
      
      // Get live MLB games
      let gamesData = [];
      try {
        const oddsResponse = await fetch(
          `https://api.the-odds-api.com/v4/sports/baseball_mlb/odds?` +
          `apiKey=${process.env.ODDS_API_KEY || process.env.THE_ODDS_API_KEY}&` +
          `regions=us&markets=h2h,spreads,totals&oddsFormat=american`
        );
        
        if (oddsResponse.ok) {
          gamesData = await oddsResponse.json();
          console.log(`Found ${gamesData.length} live games`);
        }
      } catch (error) {
        console.log('⚠️ Could not fetch live odds:', error.message);
      }
      
      // Filter games for next 3 days
      const now = new Date();
      const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
      
      const eligibleGames = gamesData.filter(game => {
        const gameTime = new Date(game.commence_time);
        return gameTime >= now && gameTime <= threeDaysFromNow;
      });
      
      console.log(`📊 ${eligibleGames.length} games eligible for next 3 days`);
      
      // Format games for ML server
      const formattedGames = eligibleGames.map(game => {
        const h2hMarket = game.bookmakers?.[0]?.markets?.find(m => m.key === 'h2h');
        const homeOdds = h2hMarket?.outcomes?.find(o => o.name === game.home_team)?.price || -110;
        const awayOdds = h2hMarket?.outcomes?.find(o => o.name === game.away_team)?.price || -110;
        
        return {
          gameId: game.id,
          homeTeam: game.home_team,
          awayTeam: game.away_team,
          venue: `${game.home_team} Stadium`,
          gameTime: game.commence_time,
          odds: {
            home: homeOdds,
            away: awayOdds
          },
          weather: {
            temperature: 72,
            wind: 5
          }
        };
      });
      
      // Get ALL picks from ML server and filter
      let validPicks = [];
      
      for (const game of formattedGames) {
        // Skip if teams were picked yesterday (rotation rule)
        if (yesterdaysTeams.includes(game.homeTeam) || yesterdaysTeams.includes(game.awayTeam)) {
          console.log(`⏭️ Skipping ${game.homeTeam} vs ${game.awayTeam} - team picked yesterday`);
          continue;
        }
        
        try {
          const mlResponse = await fetch(`${mlServerUrl}/api/generate-daily-pick`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              games: [game],
              date: today,
              type: 'daily'
            })
          });
          
          if (mlResponse.ok) {
            const mlResult = await mlResponse.json();
            
            if (mlResult.success && mlResult.pick) {
              const grade = mlResult.pick.prediction?.grade || 'B';
              
              // Check minimum grade requirement (C+ or better)
              if (meetsGradeRequirement(grade)) {
                validPicks.push({
                  ...mlResult.pick,
                  game: game,
                  grade: grade,
                  confidence: mlResult.pick.prediction?.confidence || 0.7
                });
                console.log(`✅ Valid pick found: ${game.homeTeam} vs ${game.awayTeam} - Grade: ${grade}`);
              } else {
                console.log(`❌ Grade too low: ${grade} for ${game.homeTeam} vs ${game.awayTeam}`);
              }
            }
          }
        } catch (error) {
          console.log('ML error for game:', error.message);
        }
      }
      
      // Sort by grade and confidence
      validPicks.sort((a, b) => {
        const aGradeIndex = GRADE_ORDER.indexOf(a.grade);
        const bGradeIndex = GRADE_ORDER.indexOf(b.grade);
        if (aGradeIndex !== bGradeIndex) return aGradeIndex - bGradeIndex;
        return b.confidence - a.confidence;
      });
      
      // Select best pick for daily
      if (validPicks.length > 0) {
        const bestPick = validPicks[0];
        const pickHome = bestPick.prediction?.homeTeamWinProbability > 0.5;
        const recommendedTeam = pickHome ? bestPick.game.homeTeam : bestPick.game.awayTeam;
        const odds = pickHome ? bestPick.game.odds?.home : bestPick.game.odds?.away;
        
        cachedDailyPick = {
          id: `daily-${today}`,
          gameId: bestPick.game.gameId,
          homeTeam: bestPick.game.homeTeam,
          awayTeam: bestPick.game.awayTeam,
          pickTeam: recommendedTeam,
          pickType: 'moneyline',
          odds: odds || 120,
          grade: bestPick.grade,
          confidence: bestPick.confidence * 100,
          reasoning: bestPick.reasoning || 
                    `ML model shows ${recommendedTeam} with ${(bestPick.confidence * 100).toFixed(1)}% confidence.`,
          analysis: {
            offensiveProduction: (bestPick.prediction?.factors?.offense || 0.75) * 100,
            pitchingMatchup: (bestPick.prediction?.factors?.pitchingMatchup || 0.75) * 100,
            situationalEdge: (bestPick.prediction?.factors?.homeFieldAdvantage || 0.7) * 100,
            teamMomentum: (bestPick.prediction?.factors?.recentForm || 0.72) * 100,
            marketInefficiency: (bestPick.prediction?.factors?.value || 0.78) * 100,
            systemConfidence: bestPick.confidence * 100,
            confidence: bestPick.confidence * 100
          },
          gameTime: bestPick.game.gameTime,
          venue: bestPick.game.venue,
          probablePitchers: {
            home: 'TBD',
            away: 'TBD'
          },
          mlPowered: true,
          createdAt: new Date().toISOString(),
          pickDate: today,
          status: 'scheduled',
          generatedAt: new Date().toISOString()
        };
        
        // Generate lock pick (non-conflicting)
        await generateLockPick(validPicks, today, mlServerUrl);
        
        // Update cache date
        cacheDate = today;
        lastResetTime = new Date().toISOString();
        
        console.log('✅ New daily picks generated and cached for 24 hours');
      } else {
        console.log('⚠️ No valid picks found, using fallback');
        // Use fallback if no valid picks
        cachedDailyPick = getFallbackPick(today);
      }
    } else {
      console.log('📦 Returning cached pick (24-hour persistence)');
    }
    
    return res.status(200).json(cachedDailyPick);
    
  } catch (error) {
    console.error('❌ Daily pick API error:', error);
    return res.status(200).json(getFallbackPick(new Date().toISOString().split('T')[0]));
  }
}

// Generate lock pick ensuring no conflicts
async function generateLockPick(validPicks, today, mlServerUrl) {
  const dailyTeams = [cachedDailyPick.homeTeam, cachedDailyPick.awayTeam];
  
  // Find best non-conflicting pick
  for (const pick of validPicks.slice(1)) { // Skip first (already used for daily)
    const pickTeams = [pick.game.homeTeam, pick.game.awayTeam];
    
    // Check for conflicts
    const hasConflict = pickTeams.some(team => dailyTeams.includes(team));
    
    if (!hasConflict) {
      const pickHome = pick.prediction?.homeTeamWinProbability > 0.5;
      const recommendedTeam = pickHome ? pick.game.homeTeam : pick.game.awayTeam;
      const odds = pickHome ? pick.game.odds?.home : pick.game.odds?.away;
      
      cachedLockPick = {
        id: `lock-${today}`,
        gameId: pick.game.gameId,
        homeTeam: pick.game.homeTeam,
        awayTeam: pick.game.awayTeam,
        pickTeam: recommendedTeam,
        pickType: 'moneyline',
        odds: odds || 110,
        grade: pick.grade,
        confidence: pick.confidence * 100,
        reasoning: `🔒 LOCK: ${recommendedTeam} with ${(pick.confidence * 100).toFixed(1)}% confidence.`,
        analysis: {
          offensiveProduction: (pick.prediction?.factors?.offense || 0.82) * 100,
          pitchingMatchup: (pick.prediction?.factors?.pitchingMatchup || 0.88) * 100,
          situationalEdge: (pick.prediction?.factors?.homeFieldAdvantage || 0.78) * 100,
          teamMomentum: (pick.prediction?.factors?.recentForm || 0.85) * 100,
          marketInefficiency: (pick.prediction?.factors?.value || 0.90) * 100,
          systemConfidence: pick.confidence * 100,
          confidence: pick.confidence * 100
        },
        gameTime: pick.game.gameTime,
        venue: pick.game.venue,
        probablePitchers: {
          home: 'TBD',
          away: 'TBD'
        },
        isPremium: true,
        lockStrength: pick.confidence >= 0.9 ? 'MAXIMUM' : pick.confidence >= 0.85 ? 'STRONG' : 'MODERATE',
        mlPowered: true,
        createdAt: new Date().toISOString(),
        pickDate: today,
        status: 'scheduled'
      };
      
      console.log(`🔒 Lock pick set: ${recommendedTeam} (no conflict with daily pick)`);
      return;
    }
  }
  
  // If no non-conflicting pick found, use fallback
  cachedLockPick = getFallbackLockPick(today);
}

// Fallback picks when ML unavailable
function getFallbackPick(date) {
  return {
    id: `daily-${date}`,
    gameId: `game-${date}-001`,
    homeTeam: 'New York Yankees',
    awayTeam: 'Boston Red Sox',
    pickTeam: 'New York Yankees',
    pickType: 'moneyline',
    odds: 120,
    grade: 'C+',
    confidence: 65,
    reasoning: 'System fallback pick - ML server unavailable',
    analysis: {
      offensiveProduction: 65,
      pitchingMatchup: 65,
      situationalEdge: 65,
      teamMomentum: 65,
      marketInefficiency: 65,
      systemConfidence: 65,
      confidence: 65
    },
    gameTime: new Date().toISOString(),
    venue: 'Yankee Stadium',
    probablePitchers: { home: 'TBD', away: 'TBD' },
    mlPowered: false,
    createdAt: new Date().toISOString(),
    pickDate: date,
    status: 'scheduled'
  };
}

function getFallbackLockPick(date) {
  return {
    id: `lock-${date}`,
    gameId: `game-${date}-lock`,
    homeTeam: 'Los Angeles Dodgers',
    awayTeam: 'San Francisco Giants',
    pickTeam: 'Los Angeles Dodgers',
    pickType: 'moneyline',
    odds: -150,
    grade: 'C+',
    confidence: 70,
    reasoning: 'System fallback lock pick',
    analysis: {
      offensiveProduction: 70,
      pitchingMatchup: 70,
      situationalEdge: 70,
      teamMomentum: 70,
      marketInefficiency: 70,
      systemConfidence: 70,
      confidence: 70
    },
    gameTime: new Date().toISOString(),
    venue: 'Dodger Stadium',
    probablePitchers: { home: 'TBD', away: 'TBD' },
    isPremium: true,
    lockStrength: 'MODERATE',
    mlPowered: false,
    createdAt: new Date().toISOString(),
    pickDate: date,
    status: 'scheduled'
  };
}

// Export cache for lock pick to access
export { cachedLockPick };
