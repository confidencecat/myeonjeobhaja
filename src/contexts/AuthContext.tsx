import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, UserProfile } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  profile: UserProfile | null
  isAdmin: boolean
  signUp: (email: string, password: string, name: string) => Promise<{ error: any; isExistingUser: boolean; confirmationSent: boolean }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const PROFILE_FETCH_TIMEOUT_MS = 8000

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  const loadProfile = async (currentSession: Session | null) => {
    if (!currentSession?.user) {
      setProfile(null)
      setIsAdmin(false)
      return
    }

    try {
      const abortController = new AbortController()
      const timeoutId = setTimeout(() => abortController.abort(), PROFILE_FETCH_TIMEOUT_MS)

      try {
        const query = supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', currentSession.user.id)
          .abortSignal(abortController.signal)

        const { data, error, status } = await query.maybeSingle()

        if (error && status !== 406) {
          throw error
        }

        const loadedProfile = (data as UserProfile) ?? null
        setProfile(loadedProfile)
        setIsAdmin((loadedProfile?.role ?? '').toLowerCase() === 'admin')
      } finally {
        clearTimeout(timeoutId)
      }

    } catch (error: any) {
      if (error?.name === 'AbortError') {
        console.warn('AuthContext: 프로필 로딩이 시간 초과되었습니다.', error)
      } else {
        console.error('AuthContext: Error loading profile:', error)
      }
      setProfile(null)
      setIsAdmin(false)
    }
  }

  useEffect(() => {
    // 초기 세션 상태 확인
    const getSession = async () => {
      setLoading(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)
        await loadProfile(session)
      } catch (error) {
        console.error('AuthContext: Error getting session:', error)
        setProfile(null)
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Auth 상태 변화 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const skipProfileLoad = event === 'TOKEN_REFRESHED'

      if (!skipProfileLoad) {
        setLoading(true)
      }

      setSession(session)
      setUser(session?.user ?? null)

      try {
        if (skipProfileLoad) {
          if (!session?.user) {
            setProfile(null)
            setIsAdmin(false)
          }
        } else {
          await loadProfile(session)
        }
      } catch (error) {
        console.error('AuthContext: Error reacting to auth state change:', error)
        if (!session?.user) {
          setProfile(null)
          setIsAdmin(false)
        }
      } finally {
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

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
      setSession(null)
      setUser(null)
      setProfile(null)
      setIsAdmin(false)
    }
    return { error }
  }

  const refreshProfile = async () => {
    await loadProfile(session)
  }

  const value = {
    user,
    session,
    loading,
    profile,
    isAdmin,
    signUp,
    signIn,
    signOut,
    refreshProfile,
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