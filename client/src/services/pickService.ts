import { supabase } from '@/lib/supabase';

export interface FormattedPick {
  id: string;
  date: string;
  team: string;
  spread: number;
  odds: number;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  status: string;
}

export const fetchPicks = async (): Promise<FormattedPick[]> => {
  try {
    const { data, error } = await supabase
      .from('picks')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching picks:', error);
      return [];
    }

    // Transform JSONB data to flat structure
    return data.map(pick => ({
      id: pick.id,
      date: pick.timestamp,
      team: pick.bet_info?.team || 'Loading...',
      spread: pick.bet_info?.spread || 0,
      odds: pick.bookmaker?.odds || -110,
      sport: pick.game_info?.sport || 'NFL',
      homeTeam: pick.game_info?.home_team || 'Home Team',
      awayTeam: pick.game_info?.away_team || 'Away Team',
      status: pick.status || 'pending'
    }));
  } catch (err) {
    console.error('Failed to fetch picks:', err);
    return [];
  }
};
