import { supabase } from '@/lib/supabase'
import type { Pick, PickStorageService } from '@/types/picks.types'

export class SupabasePickService implements PickStorageService {
  private localStorageKey = 'userPicks'
  
  // Helper to check if user is authenticated
  private async getUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  }

  // Save pick to both Supabase (if logged in) and localStorage
  async savePick(pick: Omit<Pick, 'id' | 'timestamp'>): Promise<void> {
    const newPick: Pick = {
      ...pick,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    }

    // Always save to localStorage for offline/anonymous users
    const localPicks = this.getLocalPicks()
    localPicks.push(newPick)
    localStorage.setItem(this.localStorageKey, JSON.stringify(localPicks))

    // If user is logged in, also save to Supabase
    const user = await this.getUser()
    if (user) {
      try {
        await supabase.from('picks').insert({
          id: newPick.id,
          user_id: user.id,
          timestamp: newPick.timestamp,
          game_info: newPick.gameInfo,
          bet_info: newPick.betInfo,
          bookmaker: newPick.bookmaker,
          status: newPick.status,
          bet_unit_at_time: newPick.betUnitAtTime,
          show_on_profile: newPick.showOnProfile ?? true,
          show_on_feed: newPick.showOnFeed ?? true,
          result: newPick.result || null
        })
      } catch (error) {
        console.error('Failed to save to Supabase:', error)
        // Pick is still saved locally
      }
    }
  }

  // Get picks from Supabase (if logged in) or localStorage
  async getPicks(): Promise<Pick[]> {
    const user = await this.getUser()
    
    if (user) {
      try {
        const { data, error } = await supabase
          .from('picks')
          .select('*')
          .eq('user_id', user.id)
          .order('timestamp', { ascending: false })

        if (error) throw error

        // Transform Supabase data back to Pick format
        return data.map(this.transformFromSupabase)
      } catch (error) {
        console.error('Failed to fetch from Supabase:', error)
        return this.getLocalPicks()
      }
    }
    
    return this.getLocalPicks()
  }

  // Get pick by ID
  async getPickById(id: string): Promise<Pick | undefined> {
    const picks = await this.getPicks()
    return picks.find(p => p.id === id)
  }

  // Update pick status
  async updatePickStatus(
    id: string, 
    status: Pick['status'], 
    result?: Pick['result']
  ): Promise<void> {
    // Update localStorage
    const localPicks = this.getLocalPicks()
    const pickIndex = localPicks.findIndex(p => p.id === id)
    if (pickIndex !== -1) {
      localPicks[pickIndex].status = status
      if (result) localPicks[pickIndex].result = result
      localStorage.setItem(this.localStorageKey, JSON.stringify(localPicks))
    }

    // Update Supabase if logged in
    const user = await this.getUser()
    if (user) {
      try {
        await supabase
          .from('picks')
          .update({ status, result })
          .eq('id', id)
          .eq('user_id', user.id)
      } catch (error) {
        console.error('Failed to update in Supabase:', error)
      }
    }
  }

  // Delete pick
  async deletePick(id: string): Promise<void> {
    // Delete from localStorage
    const localPicks = this.getLocalPicks()
    const filtered = localPicks.filter(p => p.id !== id)
    localStorage.setItem(this.localStorageKey, JSON.stringify(filtered))

    // Delete from Supabase if logged in
    const user = await this.getUser()
    if (user) {
      try {
        await supabase
          .from('picks')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id)
      } catch (error) {
        console.error('Failed to delete from Supabase:', error)
      }
    }
  }

  // Clear all picks
  async clearAllPicks(): Promise<void> {
    // Clear localStorage
    localStorage.removeItem(this.localStorageKey)

    // Clear from Supabase if logged in
    const user = await this.getUser()
    if (user) {
      try {
        await supabase
          .from('picks')
          .delete()
          .eq('user_id', user.id)
      } catch (error) {
        console.error('Failed to clear from Supabase:', error)
      }
    }
  }

  // Sync local picks to Supabase when user logs in
  async syncLocalPicksToSupabase(): Promise<void> {
    const user = await this.getUser()
    if (!user) return

    const localPicks = this.getLocalPicks()
    if (localPicks.length === 0) return

    try {
      // Upload all local picks to Supabase
      const picksToSync = localPicks.map(pick => ({
        id: pick.id,
        user_id: user.id,
        timestamp: pick.timestamp,
        game_info: pick.gameInfo,
        bet_info: pick.betInfo,
        bookmaker: pick.bookmaker,
        status: pick.status,
        bet_unit_at_time: pick.betUnitAtTime,
        show_on_profile: pick.showOnProfile ?? true,
        show_on_feed: pick.showOnFeed ?? true,
        result: pick.result || null
      }))

      await supabase.from('picks').upsert(picksToSync, {
        onConflict: 'id',
        ignoreDuplicates: true
      })

      console.log(`Synced ${localPicks.length} picks to Supabase`)
    } catch (error) {
      console.error('Failed to sync picks to Supabase:', error)
    }
  }

  // Helper methods
  private getLocalPicks(): Pick[] {
    const stored = localStorage.getItem(this.localStorageKey)
    return stored ? JSON.parse(stored) : []
  }

  private transformFromSupabase(data: any): Pick {
    return {
      id: data.id,
      timestamp: data.timestamp,
      gameInfo: data.game_info,
      betInfo: data.bet_info,
      bookmaker: data.bookmaker,
      status: data.status,
      betUnitAtTime: data.bet_unit_at_time,
      showOnProfile: data.show_on_p
