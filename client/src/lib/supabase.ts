import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for your app
export interface Profile {
  id: string
  email: string
  username?: string
  display_name?: string
  avatar_url?: string
  is_pro: boolean
  total_picks: number
  successful_picks: number
  win_rate: number
  streak: number
  best_streak: number
  created_at: string
  updated_at: string
}

export interface Pick {
  id: string
  user_id: string
  game_id: string
  sport: 'MLB' | 'NFL' | 'NBA'
  pick_type: 'spread' | 'moneyline' | 'over_under' | 'prop'
  picked_team?: 'home' | 'away'
  picked_value?: number
  odds: number
  confidence: number
  is_locked: boolean
  result?: 'won' | 'lost' | 'push' | 'pending'
  payout?: number
  notes?: string
  created_at: string
  updated_at: string
}
