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
  const [unitSize, setUnitSize] = useState(25)

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
  const initAuth = async () => {
    try {
      console.log('Auth init - getting session...');
      
      // Get session first
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('Session result:', { hasSession: !!session, error });
      
      if (error) {
        console.error('Session error:', error);
        setLoading(false);
        return;
      }
      
      if (session) {
        setSession(session);
        setUser(session.user);
        
        // Fetch profile
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          console.log('Profile data:', profileData);
          
          if (profileData) {
            setProfile(profileData);
            if (profileData.unit_size) {
              setUnitSize(Number(profileData.unit_size));
            }
          }
        } catch (profileError) {
          console.error('Profile fetch error:', profileError);
        }
      }
      
      console.log('Setting loading to false');
      setLoading(false);
      
    } catch (error) {
      console.error('Auth init error:', error);
      setLoading(false);
    }
  };
  
  // Run auth initialization
  initAuth();
  
  // Load unit size separately (non-blocking)
  const loadUnitSize = async () => {
    try {
      const savedSize = localStorage.getItem('betUnitSize');
      if (savedSize) {
        setUnitSize(Number(savedSize));
      }
    } catch (err) {
      console.error('Error loading unit size:', err);
    }
  };
  
  loadUnitSize();
  
  // Listen for auth changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (_event, session) => {
      console.log('Auth state changed:', _event);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    }
  );

  return () => subscription.unsubscribe();
}, []);

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
