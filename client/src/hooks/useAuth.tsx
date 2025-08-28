import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile } from '@/lib/supabase'

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

  const updateUnitSize = async (size: number) => {
    setUnitSize(size);
    localStorage.setItem('betUnitSize', size.toString());
    
    if (user) {
      try {
        await supabase
          .from('profiles')
          .update({ unit_size: size })
          .eq('id', user.id);
        
        if (profile) {
          setProfile({ ...profile, unit_size: size });
        }
      } catch (error) {
        console.error('Error updating unit size:', error);
      }
    }
  }

  useEffect(() => {
    let mounted = true;
    
    const initAuth = async () => {
      try {
        console.log('Starting auth initialization...');
        
        // Get session without any blocking operations
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        console.log('Session check complete:', { 
          hasSession: !!session, 
          userId: session?.user?.id,
          error 
        });
        
        if (session?.user) {
          setSession(session);
          setUser(session.user);
          
          // Try to fetch profile but don't block on it
          supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
            .then(({ data }) => {
              if (mounted && data) {
                console.log('Profile loaded:', data.email);
                setProfile(data);
                if (data.unit_size) {
                  setUnitSize(Number(data.unit_size));
                }
              }
            })
            .catch(err => console.error('Profile fetch error:', err));
        } else {
          setSession(null);
          setUser(null);
        }
        
        // Always set loading to false
        if (mounted) {
          console.log('Auth init complete, setting loading to false');
          setLoading(false);
        }
        
      } catch (error) {
        console.error('Fatal auth error:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    // Start initialization
    initAuth();
    
    // Load unit size from localStorage separately
    const savedSize = localStorage.getItem('betUnitSize');
    if (savedSize) {
      setUnitSize(Number(savedSize));
    }
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log('Auth state changed:', _event);
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    // Timeout fallback - ensure loading is set to false
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Auth timeout - forcing loading to false');
        setLoading(false);
      }
    }, 3000); // 3 seconds

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
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
