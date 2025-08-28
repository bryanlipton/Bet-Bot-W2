import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile } from '@/lib/supabase'
import { UnitSizeService } from '@/services/unitSizeService'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  isAuthenticated: boolean
  unitSize: number
  updateUnitSize: (size: number) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  isAuthenticated: false,
  unitSize: 25,
  updateUnitSize: async () => {}
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [unitSize, setUnitSize] = useState(50)

  // Fetch user profile from database
  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (data) {
      setProfile(data)
      // Set unit size from profile
      if (data.unit_size) {
        setUnitSize(Number(data.unit_size))
      }
    }
    return data
  }

  // Update unit size function
  const updateUnitSize = async (size: number) => {
    const result = await UnitSizeService.updateUnitSize(size)
    if (result.success) {
      setUnitSize(size)
      // Update profile state if user is logged in
      if (profile) {
        setProfile({ ...profile, unit_size: size })
      }
    }
    //return result
  }

useEffect(() => {
    console.log('Auth init - checking session...');
    
    // Load unit size from localStorage initially
    UnitSizeService.getUnitSize().then(size => {
      console.log('Initial unit size:', size);
      setUnitSize(size);
    }).catch(err => {
      console.error('Error loading unit size:', err);
      setUnitSize(50); // Fallback
    });

    // Check active session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('Session check:', { session, error });
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).then(() => {
          console.log('Profile fetched');
          // Sync unit size after profile is loaded
          UnitSizeService.syncToSupabase().catch(err => {
            console.error('Error syncing to Supabase:', err);
          });
        });
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
          // Sync unit size when user logs in
          await UnitSizeService.syncToSupabase()
          const size = await UnitSizeService.getUnitSize()
          setUnitSize(size)
        } else {
          setProfile(null)
          // Load from localStorage when logged out
          const size = await UnitSizeService.getUnitSize()
          setUnitSize(size)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://bet-bot-w2.vercel.app',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setProfile(null)
    setSession(null)
    // Keep unit size in localStorage even after logout
  }

  const value = {
    user,
    profile,
    session,
    loading,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!user,
    unitSize,
    updateUnitSize
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
