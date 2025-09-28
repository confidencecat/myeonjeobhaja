# 면접하자 (MyeonjeobHaja) 🎯

AI 기반 대학 입학 면접 연습 플랫폼

![면접하자](https://img.shields.io/badge/면접하자-AI%20Interview%20Platform-blue?style=for-the-badge&logo=react)

## 📌 프로젝트 소개

**면접하자**는 대학 입학을 준비하는 학생들을 위한 AI 기반 면접 연습 플랫폼입니다. 실전과 같은 면접 환경을 제공하여 학생들이 자신감을 갖고 면접에 임할 수 있도록 도와줍니다.

### ✨ 주요 기능

- 🤖 **AI 면접관**: 다양한 성향의 전문 AI 면접관과 실전 같은 면접 연습
- 📊 **상세한 분석**: 면접 후 즉시 제공되는 맞춤형 피드백과 개선점 분석
- 🎯 **맞춤형 연습**: 전공별, 대학별 특화된 면접 질문과 시나리오
- 📹 **실시간 녹화**: 면접 과정을 녹화하여 후에 검토 가능
- 📈 **진행률 추적**: 면접 완료율과 개선 진도 추적

### 🎨 화면 구성

1. **홈페이지**: 서비스 소개 및 주요 기능 안내
2. **면접 설정**: 개인 맞춤형 면접 환경 설정
3. **면접 진행**: 실시간 AI 면접관과의 면접 진행
4. **결과 분석**: 상세한 피드백과 개선점 제시

## 🛠️ 기술 스택

- **Frontend**: React 18, TypeScript
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Build Tool**: Vite
- **State Management**: Zustand (계획)

## 🚀 시작하기

### 필요 조건

- Node.js 18+ 
- npm 또는 yarn 또는 pnpm

### 설치 및 실행

1. **저장소 클론**
   ```bash
   git clone https://github.com/your-username/myeonjeobhaja.git
   cd myeonjeobhaja
   ```

2. **의존성 설치**
   ```bash
   npm install
   ```

3. **개발 서버 실행**
   ```bash
   npm run dev
   ```

4. **브라우저에서 확인**
   ```
   http://localhost:5173
   ```

### 빌드

```bash
# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

## 📁 프로젝트 구조

```
src/
├── pages/           # 페이지 컴포넌트
│   ├── HomePage.tsx         # 홈페이지
│   ├── InterviewSetupPage.tsx   # 면접 설정
│   ├── InterviewPage.tsx    # 면접 진행
│   └── ResultPage.tsx       # 결과 분석
├── components/      # 재사용 가능한 컴포넌트 (계획)
├── hooks/          # 커스텀 훅 (계획)
├── utils/          # 유틸리티 함수 (계획)
├── types/          # TypeScript 타입 정의 (계획)
├── App.tsx         # 메인 앱 컴포넌트
├── main.tsx        # 앱 진입점
├── index.css       # 전역 스타일
└── App.css         # 컴포넌트 스타일
```

## 🎯 주요 페이지 소개

### 1. 홈페이지 (`HomePage.tsx`)
- **목적**: 서비스 소개 및 사용자 유입
- **특징**: 
  - 현대적인 그라데이션 디자인
  - 서비스 통계 및 주요 기능 소개
  - 반응형 레이아웃

### 2. 면접 설정 (`InterviewSetupPage.tsx`)
- **목적**: 개인 맞춤형 면접 환경 구성
- **설정 항목**:
  - 희망 전공 및 목표 대학
  - 면접 유형 (일반/전공/학업계획서/상황면접)
  - 면접 시간 및 난이도
  - 관심 면접 주제 선택

### 3. 면접 진행 (`InterviewPage.tsx`)
- **목적**: 실시간 AI 면접 진행
- **주요 기능**:
  - 실시간 비디오 녹화
  - AI 면접관 시뮬레이션
  - 타이머 및 진행률 표시
  - 질문별 답변 녹음

### 4. 결과 분석 (`ResultPage.tsx`)
- **목적**: 면접 결과 분석 및 피드백 제공
- **제공 정보**:
  - 종합 점수 및 세부 평가
  - AI 기반 상세 피드백
  - 개선점 및 추천사항
  - 면접 통계 정보

## 🎨 디자인 시스템

### 색상 팔레트
- **Primary**: Blue (#3b82f6) to Purple (#8b5cf6) 그라데이션
- **Success**: Green (#10b981)
- **Warning**: Yellow (#f59e0b)
- **Danger**: Red (#ef4444)

### 주요 스타일링 클래스
- `.gradient-button`: 그라데이션 버튼 스타일
- `.interview-card`: 카드 호버 효과
- `.fade-in`: 페이드인 애니메이션
- `.slide-in`: 슬라이드인 애니메이션

## 🔄 데이터 플로우

1. **면접 설정** → SessionStorage에 설정 저장
2. **면접 진행** → 실시간 상태 관리 및 답변 기록
3. **결과 생성** → AI 분석 및 점수 계산
4. **결과 표시** → 상세 피드백 및 개선점 제시

## 🚧 개발 계획

### Phase 1 (현재) - 기본 UI/UX
- ✅ 기본 페이지 구조 완성
- ✅ 라우팅 설정
- ✅ 반응형 디자인

### Phase 2 (예정) - 핵심 기능
- 🔄 실제 AI 면접관 연동
- 🔄 음성 인식 및 분석
- 🔄 실시간 피드백 시스템

### Phase 3 (예정) - 고도화
- 🔄 사용자 계정 시스템
- 🔄 면접 기록 저장
- 🔄 통계 및 진도 추적

## 🤝 기여하기

1. 이 저장소를 포크합니다
2. 새로운 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성합니다

## 📄 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 📞 연락처

- **이메일**: contact@myeonjeobhaja.com
- **GitHub Issues**: [이슈 생성하기](https://github.com/your-username/myeonjeobhaja/issues)

---

<p align="center">
  Made with ❤️ for aspiring students
</p>