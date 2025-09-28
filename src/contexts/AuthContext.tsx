import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, name: string) => Promise<{ error: any; isExistingUser: boolean }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true);
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    console.log('Supabase signUp 함수 호출 시작:', { email, name });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        },
      },
    });

    console.log('Supabase signUp 결과:', { data, error });
    if (error) {
      console.error('Supabase signUp 오류:', error);
      return { error, isExistingUser: false };
    }
    
    const isExistingUser = data.user?.identities?.length !== 0;
    console.log('기존 사용자인가?:', isExistingUser);

    return { error: null, isExistingUser };
  };

  const signIn = async (email: string, password: string) => {
    console.log('Supabase signIn 함수 호출 시작:', { email });
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log('Supabase signIn 결과:', { data, error });
    if (error) {
      console.error('Supabase signIn 오류:', error);
    } else {
      console.log('Supabase signIn 성공. 세션:', data.session);
    }

    if (data.session) {
      setSession(data.session);
      setUser(data.session.user);
    }
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      setSession(null);
      setUser(null);
    }
    return { error }
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}