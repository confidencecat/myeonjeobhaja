import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

// 개발 중에는 체크 비활성화
// if (!supabaseUrl || !supabaseAnonKey) {
//   throw new Error('Supabase URL과 Anon Key가 환경 변수에 설정되지 않았습니다.')
// }

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 데이터베이스 테이블 타입 정의
export interface User {
  id: string
  email: string
  name: string
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  user_id: string
  name: string
  major?: string
  university?: string
  phone?: string
  created_at: string
  updated_at: string
}