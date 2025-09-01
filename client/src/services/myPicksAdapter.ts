import { supabase } from '@/lib/supabase';

export async function fetchMyPicks(userId?: string) {
  try {
    // Get current user if no userId provided
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      userId = user.id;
    }

    const { data, error } = await supabase
      .from('picks')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (error || !data) {
      console.log('No picks found');
      return [];
    }

    // Transform each pick to match frontend expectations
    return data.map(pick => ({
      id: pick.id,
      date: pick.timestamp,
      team: pick.bet_info?.pickTeam || pick.bet_info?.team || 'Unknown Team',
      opponent: pick.game_info?.awayTeam === pick.bet_info?.pickTeam 
        ? pick.game_info?.homeTeam 
        : pick.game_info?.awayTeam || 'Unknown',
      odds: pick.bookmaker?.odds || pick.bet_info?.odds || -110,
      spread: pick.bet_info?.spread || 0,
      type: pick.bet_info?.pickType || pick.bet_info?.type || 'moneyline',
      status: pick.status || 'pending',
      result: pick.result,
      homeTeam: pick.game_info?.homeTeam || 'Home',
      awayTeam: pick.game_info?.awayTeam || 'Away',
      sport: pick.game_info?.sport || 'MLB',
      units: pick.bet_unit_at_time || 1
    }));
  } catch (err) {
    console.error('Error fetching picks:', err);
    return [];
  }
}
