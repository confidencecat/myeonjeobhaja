# Supabase 연결 가이드

## 🚀 빠른 시작

### 1단계: Supabase 프로젝트 생성

1. https://supabase.com 접속
2. "Start your project" 클릭
3. GitHub로 로그인 (또는 계정 생성)
4. "New project" 클릭
5. 프로젝트 정보 입력:
   - **Name**: `myeonjeobhaja` 
   - **Database Password**: 강력한 비밀번호 설정
   - **Region**: `Northeast Asia (Seoul)` 선택
6. "Create new project" 클릭

### 2단계: 환경 변수 획득

프로젝트 생성 후:
1. 왼쪽 메뉴에서 "Settings" → "API" 클릭
2. 다음 정보를 복사:
   - **Project URL** (예: `https://abcdefgh.supabase.co`)
   - **anon public** key

### 3단계: .env 파일 수정

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

위의 값을 실제 값으로 교체하세요.

### 4단계: 인증 설정

Supabase Dashboard에서:
1. "Authentication" → "Settings" 클릭  
2. "Site URL"을 `http://localhost:5173`으로 설정
3. "Redirect URLs"에 `http://localhost:5173`과 `http://localhost:5173/**` 추가

### 5단계: 데이터베이스 테이블 생성

"SQL Editor"에서 아래 스크립트 실행:

```sql
-- 사용자 프로필 테이블
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  major TEXT,
  university TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles  
  FOR UPDATE USING (auth.uid() = user_id);
```

## ⚠️ 중요 사항

- 실제 프로덕션에서는 `.env` 파일을 `.gitignore`에 추가하세요
- Supabase 대시보드에서 이메일 확인을 비활성화하거나 SMTP를 설정하세요
- 개발 환경에서만 사용할 것을 권장합니다

## 🔧 문제 해결

**문제**: 회원가입 후 이메일 확인이 필요하다는 메시지
**해결**: Authentication → Settings → "Enable email confirmations" 체크 해제

**문제**: CORS 오류 발생  
**해결**: Site URL과 Redirect URLs가 올바르게 설정되어 있는지 확인

---

위 단계를 완료한 후, 실제 Supabase 연결이 준비됩니다!