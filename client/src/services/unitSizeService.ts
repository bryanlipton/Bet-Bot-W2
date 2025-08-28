// client/src/services/unitSizeService.ts
import { supabase } from '@/lib/supabase';

export class UnitSizeService {
  private static LOCALSTORAGE_KEY = 'betUnitSize';
  private static DEFAULT_UNIT_SIZE = 50;

  /**
   * Get the current unit size for the user
   * Tries Supabase first, falls back to localStorage
   */
  static async getUnitSize(): Promise<number> {
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Fetch from Supabase
        const { data, error } = await supabase
          .from('profiles')
          .select('unit_size')
          .eq('id', user.id)
          .single();

        if (!error && data?.unit_size) {
          // Also update localStorage for offline access
          localStorage.setItem(this.LOCALSTORAGE_KEY, data.unit_size.toString());
          return Number(data.unit_size);
        }
      }
    } catch (error) {
      console.error('Error fetching unit size from Supabase:', error);
    }

    // Fall back to localStorage
    const localUnitSize = localStorage.getItem(this.LOCALSTORAGE_KEY);
    if (localUnitSize) {
      return Number(localUnitSize);
    }

    // Return default
    return this.DEFAULT_UNIT_SIZE;
  }

  /**
   * Update the unit size for the user
   * Updates both Supabase and localStorage
   */
  static async updateUnitSize(newSize: number): Promise<{ success: boolean; error?: string }> {
    // Validate input
    if (!newSize || newSize <= 0) {
      return { success: false, error: 'Unit size must be greater than 0' };
    }

    // Always update localStorage first for immediate feedback
    localStorage.setItem(this.LOCALSTORAGE_KEY, newSize.toString());

    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Update in Supabase
        const { error } = await supabase
          .from('profiles')
          .update({ 
            unit_size: newSize,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (error) {
          console.error('Error updating unit size in Supabase:', error);
          return { 
            success: true, // Return true since localStorage was updated
            error: 'Unit size updated locally. Cloud sync failed.' 
          };
        }

        return { success: true };
      } else {
        // User not logged in, but localStorage was updated
        return { 
          success: true,
          error: 'Unit size saved locally. Sign in to sync across devices.' 
        };
      }
    } catch (error) {
      console.error('Error updating unit size:', error);
      return { 
        success: true, // localStorage was still updated
        error: 'Unit size updated locally. Cloud sync failed.' 
      };
    }
  }

  /**
   * Sync local unit size to Supabase when user logs in
   */
  static async syncToSupabase(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const localUnitSize = localStorage.getItem(this.LOCALSTORAGE_KEY);
      if (!localUnitSize) return;

      // Check if user already has a unit size in Supabase
      const { data: profile } = await supabase
        .from('profiles')
        .select('unit_size')
        .eq('id', user.id)
        .single();

      // If no unit size in Supabase, sync from localStorage
      if (profile && !profile.unit_size) {
        await supabase
          .from('profiles')
          .update({ 
            unit_size: Number(localUnitSize),
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
      }
    } catch (error) {
      console.error('Error syncing unit size to Supabase:', error);
    }
  }
}
