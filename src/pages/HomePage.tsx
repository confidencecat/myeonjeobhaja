import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Play, Users, BarChart3, ChevronRight, BookOpen, Target, Zap, LogOut, UserCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function HomePage() {
  const navigate = useNavigate()
  const { user, signOut, loading } = useAuth()
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null)

  console.log('HomePage: 렌더링 중...', { user: !!user, loading })

  const handleSignOut = async () => {
    const { error } = await signOut()
    if (error) {
      console.error('Error signing out:', error)
    } else {
      navigate('/')
    }
  }

  // 로딩 상태일 때 로딩 화면 표시
  if (loading) {
    console.log('HomePage: 로딩 상태 표시')
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="flex flex-col items-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
          <p className="mt-4 text-lg text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  console.log('HomePage: 메인 컨텐츠 렌더링')

  const features = [
    {
      icon: <Users className="w-8 h-8" />,
      title: "AI 면접관",
      description: "다양한 성향의 전문 AI 면접관과 실전 같은 면접 연습",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "상세한 분석",
      description: "면접 후 즉시 제공되는 맞춤형 피드백과 개선점 분석",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "맞춤형 연습",
      description: "전공별, 대학별 특화된 면접 질문과 시나리오",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: "학습 자료",
      description: "면접 팁, 예상 질문, 모범 답안 등 풍부한 학습 콘텐츠",
      color: "from-orange-500 to-red-500"
    }
  ]

  return (
    <div className="min-h-screen">
      {/* 네비게이션 */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  면접하자
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {loading ? (
                <div className="flex items-center gap-4 animate-pulse">
                  <div className="w-24 h-8 bg-gray-200 rounded-md"></div>
                  <div className="w-32 h-10 bg-gray-200 rounded-full"></div>
                </div>
              ) : user ? (
                <>
                  <div className="flex items-center gap-2">
                    <UserCircle className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700 hidden sm:block">
                      {user.email}
                    </span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>로그아웃</span>
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    로그인
                  </Link>
                  <Link 
                    to="/signup" 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full hover:shadow-lg transition-all duration-300 flex items-center gap-2"
                  >
                    시작하기 <ChevronRight className="w-4 h-4" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 히어로 섹션 */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="fade-in">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
              AI와 함께하는
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                완벽한 면접 준비
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              대학 입학 면접을 위한 AI 기반 연습 플랫폼으로
              <br />
              실전 같은 환경에서 자신감을 키우세요
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/profile')}
                className="gradient-button text-white px-8 py-4 rounded-full text-lg font-semibold flex items-center justify-center gap-3 hover:shadow-2xl"
              >
                <Play className="w-5 h-5" />
                지금 시작하기
              </button>
              <button className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-full text-lg font-semibold hover:border-purple-400 hover:text-purple-600 transition-all">
                데모 보기
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 기능 소개 */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              왜 <span className="text-blue-600">면접하자</span>인가요?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              최첨단 AI 기술과 검증된 면접 노하우가 만나 완벽한 면접 준비 환경을 제공합니다
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`interview-card p-8 bg-white rounded-2xl shadow-lg border border-gray-100 cursor-pointer ${
                  hoveredFeature === index ? 'scale-105' : ''
                }`}
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center text-white mb-6 mx-auto`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              <Zap className="w-10 h-10" />
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            면접 준비, 혼자 하지 마세요
          </h2>
          <p className="text-xl mb-10 opacity-90">
            AI 기술로 구현된 실전 면접 환경에서 자신감을 키우고 꿈의 대학에 한 걸음 더 다가가세요
          </p>
          <button
            onClick={() => navigate('/signup')}
            className="bg-white text-blue-600 px-10 py-4 rounded-full text-lg font-semibold hover:shadow-2xl transition-all duration-300 hover:scale-105"
          >
            무료로 시작하기
          </button>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="bg-gray-900 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <h3 className="text-2xl font-bold mb-4">면접하자</h3>
              <p className="text-gray-400 mb-6">
                AI 기반 면접 연습 플랫폼으로 대학 입학의 꿈을 현실로 만들어보세요.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">서비스</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">AI 면접 연습</a></li>
                <li><a href="#" className="hover:text-white transition-colors">피드백 분석</a></li>
                <li><a href="#" className="hover:text-white transition-colors">학습 자료</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">지원</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">도움말</a></li>
                <li><a href="#" className="hover:text-white transition-colors">문의하기</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 면접하자. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}