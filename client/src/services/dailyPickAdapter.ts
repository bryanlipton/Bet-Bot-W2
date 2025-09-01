import { supabase } from '@/lib/supabase';

export async function fetchDailyPick() {
  try {
    const { data, error } = await supabase
      .from('picks')
      .select('*')
      .eq('status', 'pending')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      console.log('No daily pick found');
      return null;
    }

    return {
      id: data.id,
      gameId: data.game_info?.gameId || 'unknown',
      homeTeam: data.game_info?.homeTeam || 'Home Team',
      awayTeam: data.game_info?.awayTeam || 'Away Team',
      pickTeam: data.bet_info?.pickTeam || 'Unknown',
      pickType: data.bet_info?.pickType || 'moneyline',
      odds: data.bet_info?.odds || -110,
      grade: data.bet_info?.grade || 'B',
      confidence: data.bet_info?.confidence || 0.7,
      reasoning: data.bet_info?.reasoning || 'Analysis pending',
      analysis: {
        marketInefficiency: 75,
        situationalEdge: 70,
        pitchingMatchup: 80,
        teamMomentum: 72,
        systemConfidence: 78,
        offensiveProduction: 76
      },
      gameTime: data.game_info?.gameTime || data.timestamp,
      venue: data.game_info?.venue || 'Stadium',
      probablePitchers: data.game_info?.probablePitchers || {
        home: 'TBD',
        away: 'TBD'
      },
      createdAt: data.created_at,
      pickDate: data.created_at,
      status: data.status
    };
  } catch (err) {
    console.error('Error fetching daily pick:', err);
    return null;
  }
}
