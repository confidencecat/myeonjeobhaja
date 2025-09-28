import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, User, BookOpen, Clock, Users, ChevronRight, Settings } from 'lucide-react'

export default function InterviewSetupPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    major: '',
    university: '',
    interviewType: '',
    duration: '10',
    difficulty: 'medium',
    topics: [] as string[]
  })

  const majors = [
    '컴퓨터공학과', '경영학과', '의학과', '법학과', '교육학과', 
    '심리학과', '건축학과', '기계공학과', '화학공학과', '생명과학과'
  ]

  const universities = [
    'SKY 대학교', '인서울 대학교', '지방 국립대', '사립대학교', '전문대학교'
  ]

  const interviewTypes = [
    { id: 'general', name: '일반면접', description: '기본적인 인성 및 학업 관련 질문' },
    { id: 'major', name: '전공면접', description: '희망 전공 관련 심화 질문' },
    { id: 'essay', name: '학업계획서', description: '제출 서류 기반 질문' },
    { id: 'situation', name: '상황면접', description: '상황별 대처 능력 평가' }
  ]

  const topicOptions = [
    '학업계획', '진로목표', '인성', '리더십', '봉사활동', 
    '독서경험', '시사상식', '전공지식', '창의성', '문제해결능력'
  ]

  const handleTopicToggle = (topic: string) => {
    setFormData(prev => ({
      ...prev,
      topics: prev.topics.includes(topic) 
        ? prev.topics.filter(t => t !== topic)
        : [...prev.topics, topic]
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // 데이터 검증
    if (!formData.major || !formData.university || !formData.interviewType) {
      alert('모든 필수 항목을 선택해주세요.')
      return
    }
    
    // 면접 설정을 세션 스토리지에 저장
    sessionStorage.setItem('interviewSetup', JSON.stringify(formData))
    navigate('/interview')
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">면접 설정</h1>
            <p className="text-gray-600 mt-2">맞춤형 면접을 위한 기본 정보를 입력해주세요</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 기본 정보 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              기본 정보
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  희망 전공 *
                </label>
                <select
                  value={formData.major}
                  onChange={(e) => setFormData(prev => ({ ...prev, major: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">전공을 선택하세요</option>
                  {majors.map(major => (
                    <option key={major} value={major}>{major}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  목표 대학 *
                </label>
                <select
                  value={formData.university}
                  onChange={(e) => setFormData(prev => ({ ...prev, university: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">대학을 선택하세요</option>
                  {universities.map(university => (
                    <option key={university} value={university}>{university}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 면접 유형 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              면접 유형 *
            </h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              {interviewTypes.map(type => (
                <label
                  key={type.id}
                  className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.interviewType === type.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="interviewType"
                    value={type.id}
                    checked={formData.interviewType === type.id}
                    onChange={(e) => setFormData(prev => ({ ...prev, interviewType: e.target.value }))}
                    className="sr-only"
                  />
                  <div className="font-medium text-gray-900">{type.name}</div>
                  <div className="text-sm text-gray-600 mt-1">{type.description}</div>
                </label>
              ))}
            </div>
          </div>

          {/* 면접 설정 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" />
              면접 설정
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  면접 시간
                </label>
                <select
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="5">5분 (연습용)</option>
                  <option value="10">10분 (기본)</option>
                  <option value="15">15분 (심화)</option>
                  <option value="20">20분 (완전)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-2" />
                  난이도
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="easy">쉬움 (기초 질문)</option>
                  <option value="medium">보통 (일반 질문)</option>
                  <option value="hard">어려움 (심화 질문)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 면접 주제 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              면접 주제 선택
            </h2>
            <p className="text-sm text-gray-600 mb-4">관심 있는 면접 주제를 선택하세요 (선택사항)</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {topicOptions.map(topic => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => handleTopicToggle(topic)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    formData.topics.includes(topic)
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                      : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="flex justify-center">
            <button
              type="submit"
              className="gradient-button text-white px-12 py-4 rounded-full text-lg font-semibold flex items-center gap-3 hover:shadow-2xl transition-all"
            >
              면접 시작하기
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}