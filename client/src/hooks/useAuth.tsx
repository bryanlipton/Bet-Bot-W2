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
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) {
        console.error('Profile fetch error:', error)
        return null
      }
      
      if (data) {
        setProfile(data)
        // Set unit size from profile
        if (data.unit_size) {
          setUnitSize(Number(data.unit_size))
        }
      }
      return data
    } catch (err) {
      console.error('Profile fetch exception:', err)
      return null
    }
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
        console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
        
        // Add timeout to session check
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 2500)
        );
        
        try {
          const result = await Promise.race([sessionPromise, timeoutPromise]) as any;
          
          if (!mounted) return;
          
          const session = result?.data?.session || null;
          const error = result?.error || null;
          
          console.log('Session check complete:', { 
            hasSession: !!session, 
            userId: session?.user?.id,
            error: error?.message 
          });
          
          if (session?.user) {
            setSession(session);
            setUser(session.user);
            
            // Fetch profile non-blocking
            fetchProfile(session.user.id).then(profileData => {
              if (profileData) {
                console.log('Profile loaded for user:', profileData.email);
              }
            });
          } else {
            console.log('No session found - user not logged in');
            setSession(null);
            setUser(null);
          }
        } catch (timeoutError) {
          console.error('Session check timed out:', timeoutError);
          // Continue anyway - user is not logged in
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
    
    // Load unit size from localStorage
    const savedSize = localStorage.getItem('betUnitSize');
    if (savedSize) {
      setUnitSize(Number(savedSize));
    }
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log('Auth state changed:', _event, 'Session:', !!session);
        
        if (_event === 'SIGNED_IN') {
          console.log('User signed in successfully');
          if (mounted) {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false); // Ensure loading is false after sign in
            if (session?.user) {
              fetchProfile(session.user.id);
            }
          }
        } else if (_event === 'SIGNED_OUT') {
          console.log('User signed out');
          if (mounted) {
            setSession(null);
            setUser(null);
            setProfile(null);
          }
        } else if (_event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed');
          if (mounted && session) {
            setSession(session);
            setUser(session.user);
          }
        } else if (_event === 'INITIAL_SESSION') {
          console.log('Initial session detected');
          if (mounted && session) {
            setSession(session);
            setUser(session.user);
            fetchProfile(session.user.id);
          }
        }
      }
    );

    // Cleanup
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      console.log('Initiating Google sign in...');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin, // Use current origin for flexibility
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })
      
      if (error) {
        console.error('Google sign in error:', error);
        throw error;
      }
      
      console.log('Google sign in initiated:', data);
    } catch (err) {
      console.error('Sign in failed:', err);
      throw err;
    }
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
