import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, UserProfile } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profileLoading: boolean;
  profileLoaded: boolean;
  profile: UserProfile | null;
  isAdmin: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any; isExistingUser: boolean; confirmationSent: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const loadProfile = useCallback(async (user: User | null) => {
    if (!user) {
      setProfile(null);
      setIsAdmin(false);
      setProfileLoading(false);
      setProfileLoaded(true);
      return;
    }

    try {
      setProfileLoading(true);
      setProfileLoaded(false);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, user_id, name, major, university, phone, desired_major, role, created_at, updated_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      const loadedProfile = (data as UserProfile) ?? null;
      setProfile(loadedProfile);
      const normalizedRole = (loadedProfile?.role ?? '').toLowerCase();
      setIsAdmin(normalizedRole === 'admin');
    } catch (error) {
      console.error('AuthContext: Error loading profile:', error);
      setProfile(null);
      setIsAdmin(false);
    } finally {
      setProfileLoading(false);
      setProfileLoaded(true);
    }
  }, []);

  const handleSessionChange = useCallback((nextSession: Session | null) => {
    setSession(nextSession ?? null);
    setUser(nextSession?.user ?? null);

    if (nextSession?.user) {
      void loadProfile(nextSession.user);
    } else {
      void loadProfile(null);
    }

    setAuthReady(true);
  }, [loadProfile]);

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        handleSessionChange(session);
      } catch (error) {
        console.error('AuthContext: Error getting session:', error);
        handleSessionChange(null);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSessionChange(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [handleSessionChange]);

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        },
      },
    });

    if (error) {
      return { error, isExistingUser: false, confirmationSent: false };
    }
    
    const isExistingUser = !!data.session;
    const confirmationSent = !!data.user && !data.session;

    return { error: null, isExistingUser, confirmationSent };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      handleSessionChange(null);
    }
    return { error };
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user);
    }
  };

  const value = {
    user,
    session,
    loading: !authReady,
    profileLoading,
    profileLoaded,
    profile,
    isAdmin,
    signUp,
    signIn,
    signOut,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
