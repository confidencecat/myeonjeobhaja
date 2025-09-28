import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, name: string) => Promise<{ error: any; isExistingUser: boolean; confirmationSent: boolean }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 초기 세션 상태 확인
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('AuthContext: Error getting session:', error)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Auth 상태 변화 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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

    // 시나리오 분석:
    // 1. 새로운 유저: data.user가 있고, data.session은 null (이메일 인증 필요)
    // 2. 이미 인증된 유저: data.user가 있고, data.session도 있음
    // 3. 미인증 유저가 다시 가입: data.user가 있고, data.session은 null
    
    const isExistingUser = !!data.session; // 세션이 있다는 것은 이미 인증된 사용자라는 의미
    const confirmationSent = !!data.user && !data.session; // 사용자는 생성됐지만 세션이 없다면 확인 메일이 발송된 것

    return { error: null, isExistingUser, confirmationSent };
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