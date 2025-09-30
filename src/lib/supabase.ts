import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be defined in .env file')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 데이터베이스 테이블 타입 정의
export interface UserProfile {
  id: string
  user_id: string
  name: string
  major?: string
  university?: string
  phone?: string
  desired_major?: string
  role?: string
  created_at: string
  updated_at: string
}
