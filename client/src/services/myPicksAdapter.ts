// Add these functions to your existing client/src/services/myPicksAdapter.ts file

// Add this import at the top if not already present
import { supabase } from '@/lib/supabase';

// Your existing fetchMyPicks function should already be here
// ...existing fetchMyPicks code...

// Add these two functions to your existing file:

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
