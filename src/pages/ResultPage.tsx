import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { 
  Trophy, BarChart3, Clock, User, CheckCircle, XCircle, 
  Star, RefreshCw, Home, Download, Share2, Target,
  TrendingUp, Award, MessageSquare 
} from 'lucide-react'

export default function ResultPage() {
  const navigate = useNavigate()
  const [resultData, setResultData] = useState<any>(null)
  const [showDetailedFeedback, setShowDetailedFeedback] = useState(false)

  const mockScores = {
    overall: 85,
    communication: 88,
    confidence: 82,
    knowledge: 87,
    attitude: 90,
    clarity: 83
  }

  const mockFeedback = {
    strengths: [
      "명확하고 논리적인 답변 구성",
      "적절한 목소리 톤과 말의 속도",
      "면접관과의 아이컨택 유지",
      "전공 관련 지식이 풍부함"
    ],
    improvements: [
      "답변 시 구체적인 사례 제시 필요",
      "긴장했을 때의 손동작 개선",
      "질문 의도 파악 후 답변 시작"
    ],
    recommendations: [
      "모의면접을 통한 반복 연습",
      "전공 관련 최신 이슈 학습",
      "스피치 트레이닝 권장"
    ]
  }

  const detailedAnalysis = [
    {
      question: "간단한 자기소개를 해주세요.",
      userAnswer: "안녕하세요. 저는 컴퓨터공학을 전공하고자 하는 김학생입니다...",
      score: 88,
      feedback: "자신감 있는 목소리로 간결하게 소개했습니다. 구체적인 경험 사례가 추가되면 더욱 좋겠습니다.",
      improvements: "프로젝트 경험이나 특별한 활동 언급"
    },
    {
      question: "우리 학교에 지원한 동기는 무엇인가요?",
      userAnswer: "귀교의 우수한 교육과정과 연구환경에 매력을 느껴...",
      score: 82,
      feedback: "학교에 대한 조사를 충분히 했음을 알 수 있습니다. 개인적 경험과 연결하면 더욱 설득력 있겠습니다.",
      improvements: "개인 경험과 학교 특성 연결"
    }
  ]

  useEffect(() => {
    const result = sessionStorage.getItem('interviewResult')
    if (result) {
      setResultData(JSON.parse(result))
    } else {
      // 데모 데이터로 대체
      setResultData({
        major: "컴퓨터공학과",
        university: "SKY 대학교",
        questionsAnswered: 5,
        totalQuestions: 5,
        timeUsed: 480,
        duration: 600
      })
    }
  }, [])

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-500"
    if (score >= 80) return "text-blue-500"
    if (score >= 70) return "text-yellow-500"
    return "text-red-500"
  }

  const getScoreBackground = (score: number) => {
    if (score >= 90) return "from-green-500 to-emerald-500"
    if (score >= 80) return "from-blue-500 to-cyan-500"
    if (score >= 70) return "from-yellow-500 to-orange-500"
    return "from-red-500 to-pink-500"
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}분 ${secs}초`
  }

  if (!resultData) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className={`w-24 h-24 rounded-full bg-gradient-to-r ${getScoreBackground(mockScores.overall)} flex items-center justify-center text-white text-3xl font-bold shadow-lg`}>
              <Trophy className="w-12 h-12" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">면접이 완료되었습니다!</h1>
          <p className="text-xl text-gray-600">
            {resultData.major} · {resultData.university}
          </p>
        </div>

        {/* 종합 점수 */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">종합 평가</h2>
            <div className="flex justify-center items-center mb-6">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    strokeDasharray={`${2.51 * mockScores.overall} 251.2`}
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-3xl font-bold ${getScoreColor(mockScores.overall)}`}>
                    {mockScores.overall}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-gray-600 text-lg">
              전체적으로 <span className="font-semibold text-blue-600">우수한</span> 면접이었습니다.
            </p>
          </div>
        </div>

        {/* 상세 점수 */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              세부 평가 항목
            </h3>
            <div className="space-y-4">
              {[
                { label: '의사소통', score: mockScores.communication },
                { label: '자신감', score: mockScores.confidence },
                { label: '전문지식', score: mockScores.knowledge },
                { label: '태도', score: mockScores.attitude },
                { label: '명확성', score: mockScores.clarity }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">{item.label}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                    <span className={`font-bold text-sm ${getScoreColor(item.score)}`}>
                      {item.score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Clock className="w-6 h-6 text-blue-600" />
              면접 통계
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">답변한 질문</span>
                <span className="font-bold">{resultData.questionsAnswered} / {resultData.totalQuestions}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">소요 시간</span>
                <span className="font-bold">{formatTime(resultData.timeUsed)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">완료율</span>
                <span className="font-bold text-green-600">
                  {Math.round((resultData.questionsAnswered / resultData.totalQuestions) * 100)}%
                </span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-600">면접 유형</span>
                <span className="font-bold">일반면접</span>
              </div>
            </div>
          </div>
        </div>

        {/* 피드백 섹션 */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-blue-600" />
              AI 면접관 피드백
            </h3>
            <button
              onClick={() => setShowDetailedFeedback(!showDetailedFeedback)}
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              {showDetailedFeedback ? '간단히 보기' : '자세히 보기'}
              <Target className="w-4 h-4" />
            </button>
          </div>

          {!showDetailedFeedback ? (
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-4 bg-green-50 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-800">잘한 점</span>
                </div>
                <ul className="space-y-2 text-sm text-green-700">
                  {mockFeedback.strengths.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-yellow-50 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-yellow-600" />
                  <span className="font-semibold text-yellow-800">개선점</span>
                </div>
                <ul className="space-y-2 text-sm text-yellow-700">
                  {mockFeedback.improvements.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-blue-50 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-blue-800">추천사항</span>
                </div>
                <ul className="space-y-2 text-sm text-blue-700">
                  {mockFeedback.recommendations.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {detailedAnalysis.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-semibold text-gray-900">질문 {index + 1}</h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(item.score)} bg-gray-50`}>
                      {item.score}점
                    </span>
                  </div>
                  <p className="text-gray-700 mb-3">{item.question}</p>
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <p className="text-sm text-gray-600 italic">{item.userAnswer}</p>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{item.feedback}</p>
                  <p className="text-sm text-blue-600">💡 개선 포인트: {item.improvements}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 액션 버튼들 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/setup')}
            className="gradient-button text-white px-8 py-4 rounded-full font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all"
          >
            <RefreshCw className="w-5 h-5" />
            다시 면접보기
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-full font-semibold hover:border-blue-400 hover:text-blue-600 transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            홈으로 돌아가기
          </button>
          
          <button className="bg-green-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-green-700 transition-all flex items-center justify-center gap-2">
            <Download className="w-5 h-5" />
            결과 다운로드
          </button>
          
          <button className="bg-purple-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-purple-700 transition-all flex items-center justify-center gap-2">
            <Share2 className="w-5 h-5" />
            결과 공유
          </button>
        </div>
      </div>
    </div>
  )
}