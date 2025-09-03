// client/src/services/myPicksAdapter.ts
import { supabase } from '@/lib/supabase';

// Fetch all picks for a user
export async function fetchMyPicks(userId?: string) {
  try {
    // Get current user if no userId provided
    let userIdToUse = userId;
    
    if (!userIdToUse) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found');
        return [];
      }
      userIdToUse = user.id; // Use the ID string, not the user object
    }
    
    console.log('Fetching picks for user ID:', userIdToUse);
    
    const { data, error } = await supabase
      .from('picks')
      .select('*')
      .eq('user_id', userIdToUse) // Make sure this is a string, not an object
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching picks:', error);
      return [];
    }
    
    if (!data || data.length === 0) {
      console.log('No picks found for user');
      return [];
    }
    
    console.log(`Found ${data.length} picks`);
    
    // Transform each pick to match what my-picks-fixed.tsx expects
    return data.map(pick => {
      // Extract data from JSONB fields
      const gameInfo = pick.game_info || {};
      const betInfo = pick.bet_info || {};
      const bookmakerInfo = pick.bookmaker || {};
      
      return {
        id: pick.id,
        user_id: pick.user_id,
        
        // Game information - these field names match what my-picks-fixed expects
        homeTeam: gameInfo.homeTeam || pick.homeTeam || 'Unknown',
        awayTeam: gameInfo.awayTeam || pick.awayTeam || 'Unknown',
        gameId: gameInfo.gameId || pick.gameId,
        sport: gameInfo.sport || 'MLB',
        
        // Bet information - matching the component's expectations
        teamBet: betInfo.selection || betInfo.pickTeam || betInfo.team || 'Unknown',
        betType: betInfo.market || betInfo.type || betInfo.pickType || 'moneyline',
        market: betInfo.market || betInfo.type || 'moneyline',
        selection: betInfo.selection || betInfo.pickTeam || betInfo.team || 'Unknown',
        odds: betInfo.odds || bookmakerInfo.odds || pick.odds || 0,
        line: betInfo.line || betInfo.spread || null,
        units: betInfo.units || pick.bet_unit_at_time || 1,
        
        // Bookmaker information
        bookmaker: bookmakerInfo.key || pick.bookmaker || 'manual',
        bookmakerDisplayName: bookmakerInfo.displayName || bookmakerInfo.key || 'Manual Entry',
        
        // Status and dates
        status: pick.status || 'pending',
        createdAt: pick.created_at || pick.timestamp,
        updatedAt: pick.updated_at,
        
        // Additional fields
        bet_unit_at_time: pick.bet_unit_at_time,
        show_on_profile: pick.show_on_profile !== false,
        show_on_feed: pick.show_on_feed !== false,
        result: pick.result,
        
        // Keep original JSONB fields for reference
        game_info: gameInfo,
        bet_info: betInfo,
        bookmaker_info: bookmakerInfo
      };
    });
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
