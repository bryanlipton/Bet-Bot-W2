// client/src/services/myPicksAdapter.ts

import { supabase } from '@/lib/supabase';

// Fetch all picks for a user
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

// Function to update pick odds (for the edit functionality)
export async function updatePickOdds(pickId: string, newOdds: number) {
  try {
    // First, get the current pick to preserve other data
    const { data: currentPick, error: fetchError } = await supabase
      .from('picks')
      .select('*')
      .eq('id', pickId)
      .single();

    if (fetchError || !currentPick) {
      console.error('Error fetching pick:', fetchError);
      return { success: false, error: fetchError };
    }

    // Update the odds in both bet_info and bookmaker JSONB fields
    const updatedBetInfo = {
      ...currentPick.bet_info,
      odds: newOdds
    };

    const updatedBookmaker = {
      ...currentPick.bookmaker,
      odds: newOdds
    };

    // Update the pick in Supabase
    const { data, error } = await supabase
      .from('picks')
      .update({
        bet_info: updatedBetInfo,
        bookmaker: updatedBookmaker,
        odds: newOdds, // Also update the top-level odds field if it exists
        updated_at: new Date().toISOString()
      })
      .eq('id', pickId)
      .select()
      .single();

    if (error) {
      console.error('Error updating pick odds:', error);
      return { success: false, error };
    }

    console.log('Successfully updated odds for pick:', pickId);
    return { success: true, data };
  } catch (error) {
    console.error('Error in updatePickOdds:', error);
    return { success: false, error };
  }
}

// Function to delete a pick
export async function deletePickFromSupabase(pickId: string) {
  try {
    const { error } = await supabase
      .from('picks')
      .delete()
      .eq('id', pickId);

    if (error) {
      console.error('Error deleting pick:', error);
      return { success: false, error };
    }

    console.log('Successfully deleted pick:', pickId);
    return { success: true };
  } catch (error) {
    console.error('Error in deletePickFromSupabase:', error);
    return { success: false, error };
  }
}
