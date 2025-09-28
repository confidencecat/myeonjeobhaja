# Supabase 데이터베이스 설정 가이드

## 1. 환경 변수 설정

`.env` 파일에서 실제 Supabase 프로젝트 정보를 입력하세요:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 2. 데이터베이스 테이블 생성

Supabase Dashboard의 SQL Editor에서 다음 스크립트를 실행하세요:

```sql
-- 사용자 프로필 테이블 생성
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  major TEXT,
  university TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 면접 세션 테이블 생성
CREATE TABLE interview_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  major TEXT NOT NULL,
  university TEXT NOT NULL,
  interview_type TEXT NOT NULL,
  duration INTEGER NOT NULL DEFAULT 10,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  topics TEXT[],
  questions_answered INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 5,
  time_used INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 면접 결과 테이블 생성
CREATE TABLE interview_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  overall_score INTEGER,
  communication_score INTEGER,
  confidence_score INTEGER,
  knowledge_score INTEGER,
  attitude_score INTEGER,
  clarity_score INTEGER,
  feedback_strengths TEXT[],
  feedback_improvements TEXT[],
  feedback_recommendations TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 면접 질문과 답변 테이블 생성
CREATE TABLE interview_qa (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE,
  question_order INTEGER NOT NULL,
  question TEXT NOT NULL,
  user_answer TEXT,
  answer_score INTEGER,
  feedback TEXT,
  improvements TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_qa ENABLE ROW LEVEL SECURITY;

-- user_profiles 정책
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- interview_sessions 정책
CREATE POLICY "Users can view own sessions" ON interview_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON interview_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON interview_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- interview_results 정책
CREATE POLICY "Users can view own results" ON interview_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own results" ON interview_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- interview_qa 정책
CREATE POLICY "Users can view own qa" ON interview_qa
  FOR SELECT USING (
    auth.uid() = (
      SELECT user_id FROM interview_sessions 
      WHERE id = interview_qa.session_id
    )
  );

CREATE POLICY "Users can insert own qa" ON interview_qa
  FOR INSERT WITH CHECK (
    auth.uid() = (
      SELECT user_id FROM interview_sessions 
      WHERE id = interview_qa.session_id
    )
  );

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at 트리거 생성
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_interview_sessions_updated_at
  BEFORE UPDATE ON interview_sessions
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_interview_sessions_user_id ON interview_sessions(user_id);
CREATE INDEX idx_interview_sessions_status ON interview_sessions(status);
CREATE INDEX idx_interview_results_session_id ON interview_results(session_id);
CREATE INDEX idx_interview_results_user_id ON interview_results(user_id);
CREATE INDEX idx_interview_qa_session_id ON interview_qa(session_id);
```

## 3. 인증 설정

Supabase Dashboard > Authentication > Settings에서:

1. **Email Confirmations**: 이메일 확인 활성화
2. **Redirect URLs**: `http://localhost:5173` 추가 (개발 환경)
3. **Site URL**: `http://localhost:5173` 설정

## 4. 사용자 가입 테스트

1. 애플리케이션에서 회원가입 시도
2. 가입한 이메일로 확인 메일 받기
3. 이메일 확인 후 로그인 테스트

## 5. 테이블 확인

Supabase Dashboard > Table Editor에서 생성된 테이블들을 확인할 수 있습니다:

- `user_profiles`: 사용자 프로필 정보
- `interview_sessions`: 면접 세션 정보  
- `interview_results`: 면접 결과
- `interview_qa`: 질문과 답변

## 주의사항

1. RLS (Row Level Security)가 활성화되어 있어 사용자는 본인의 데이터만 접근 가능
2. 외래 키 제약조건으로 데이터 무결성 보장
3. 자동으로 created_at, updated_at 타임스탬프 관리