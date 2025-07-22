#!/usr/bin/env node
import { db } from './server/storage.js';
import { userPicks } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function getMLBScores(dateStr) {
  try {
    const response = await fetch(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&startDate=${dateStr}&endDate=${dateStr}&hydrate=team,linescore`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.dates?.[0]?.games || [];
  } catch (error) {
    console.error(`Error fetching MLB scores for ${dateStr}:`, error);
    return [];
  }
}

function normalizeTeamName(name) {
  return name
    .replace(/^(Los Angeles|New York|San Francisco|St\.|Chicago|Tampa Bay)\s+/i, '')
    .replace(/\s+(Angels|Yankees|Mets|Giants|Cardinals|White Sox|Cubs|Rays)$/i, '$1')
    .trim();
}

async function gradePicksForDate(dateStr) {
  console.log(`\n🔍 Checking picks for ${dateStr}...`);
  
  // Get all pending picks for this date
  const pendingPicks = await db.select()
    .from(userPicks)
    .where(eq(userPicks.status, 'pending'));

  const datePicks = pendingPicks.filter(pick => {
    // Check if pick's game_date matches our target date
    return pick.gameDate === dateStr;
  });

  console.log(`Found ${datePicks.length} pending picks for ${dateStr}`);
  
  if (datePicks.length === 0) {
    return 0;
  }

  // Get MLB games for this date
  const mlbGames = await getMLBScores(dateStr);
  console.log(`Found ${mlbGames.length} MLB games for ${dateStr}`);

  let gradedCount = 0;

  for (const pick of datePicks) {
    console.log(`\n📊 Processing pick ${pick.id}: ${pick.selection} vs ${pick.homeTeam}/${pick.awayTeam}`);
    
    // Find matching game
    const matchingGame = mlbGames.find(game => {
      const gameHome = normalizeTeamName(game.teams.home.team.name);
      const gameAway = normalizeTeamName(game.teams.away.team.name);
      const pickHome = normalizeTeamName(pick.homeTeam);
      const pickAway = normalizeTeamName(pick.awayTeam);
      
      const homeMatch = gameHome.toLowerCase().includes(pickHome.toLowerCase()) || 
                       pickHome.toLowerCase().includes(gameHome.toLowerCase());
      const awayMatch = gameAway.toLowerCase().includes(pickAway.toLowerCase()) || 
                       pickAway.toLowerCase().includes(gameAway.toLowerCase());
      
      return homeMatch && awayMatch;
    });

    if (!matchingGame) {
      console.log(`❌ No matching game found for ${pick.selection}`);
      continue;
    }

    if (matchingGame.status.abstractGameState !== 'Final') {
      console.log(`⏳ Game not final yet: ${matchingGame.status.detailedState}`);
      continue;
    }

    // Determine winner
    const homeScore = matchingGame.teams.home.score;
    const awayScore = matchingGame.teams.away.score;
    const homeTeam = normalizeTeamName(matchingGame.teams.home.team.name);
    const awayTeam = normalizeTeamName(matchingGame.teams.away.team.name);
    
    let winner;
    if (homeScore > awayScore) {
      winner = homeTeam;
    } else {
      winner = awayTeam;
    }

    console.log(`🏆 Game result: ${awayTeam} ${awayScore} - ${homeScore} ${homeTeam} (Winner: ${winner})`);
    
    // Determine if pick won
    const pickSelection = normalizeTeamName(pick.selection);
    const didWin = winner.toLowerCase().includes(pickSelection.toLowerCase()) || 
                  pickSelection.toLowerCase().includes(winner.toLowerCase());
    
    console.log(`🎯 Pick: ${pick.selection} (normalized: ${pickSelection})`);
    console.log(`✅ Pick ${didWin ? 'WON' : 'LOST'}`);

    // Calculate win amount
    let winAmount = 0;
    if (didWin) {
      const odds = pick.odds;
      const units = parseFloat(pick.units);
      const betUnitAtTime = parseFloat(pick.betUnitAtTime) || 10.00;
      const wager = units * betUnitAtTime;
      
      if (odds > 0) {
        // Positive odds: +150 means win $150 on $100 bet
        winAmount = wager * (odds / 100);
      } else {
        // Negative odds: -120 means bet $120 to win $100
        winAmount = wager / (Math.abs(odds) / 100);
      }
    }

    // Update the pick
    const gameResult = `${awayTeam} ${awayScore} - ${homeScore} ${homeTeam}`;
    
    await db.update(userPicks)
      .set({
        status: didWin ? 'win' : 'loss',
        result: gameResult,
        winAmount: winAmount,
        gradedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(userPicks.id, pick.id));

    console.log(`✅ Updated pick ${pick.id}: ${didWin ? 'WIN' : 'LOSS'} (${winAmount ? `+${winAmount.toFixed(2)} units` : '0 units'})`);
    gradedCount++;
  }

  return gradedCount;
}

async function main() {
  console.log("🎯 Force grading all pending picks...\n");
  
  // Check the last 7 days for any ungraded picks
  const dates = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  let totalGraded = 0;
  
  for (const date of dates) {
    const graded = await gradePicksForDate(date);
    totalGraded += graded;
  }
  
  console.log(`\n🎉 Grading complete! Total picks graded: ${totalGraded}`);
  
  // Show remaining pending picks
  const remainingPending = await db.select()
    .from(userPicks)
    .where(eq(userPicks.status, 'pending'));
    
  console.log(`📋 Remaining pending picks: ${remainingPending.length}`);
  
  if (remainingPending.length > 0) {
    console.log("\n📄 Remaining pending picks:");
    for (const pick of remainingPending) {
      console.log(`- Pick ${pick.id}: ${pick.selection} on ${pick.gameDate} (${pick.homeTeam} vs ${pick.awayTeam})`);
    }
  }
}

main().catch(console.error);