import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mic, MicOff, Square, Pause, Play, User, Clock, Volume2 } from 'lucide-react'

export default function InterviewPage() {
  const navigate = useNavigate()
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [timeLeft, setTimeLeft] = useState(600) // 10분 (초)
  const [interviewData, setInterviewData] = useState<any>(null)
  const [isAIThinking, setIsAIThinking] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const questions = [
    "간단한 자기소개를 해주세요.",
    "우리 학교에 지원한 동기는 무엇인가요?",
    "본인의 장점과 단점을 말씀해주세요.",
    "앞으로의 진로계획에 대해 설명해주세요.",
    "마지막으로 하고 싶은 말씀이 있나요?"
  ]

  const interviewer = {
    name: "김면접",
    role: "입학사정관",
    personality: "친근하고 따뜻한",
    avatar: "👨‍🏫"
  }

  useEffect(() => {
    // 면접 설정 데이터 불러오기
    const setupData = sessionStorage.getItem('interviewSetup')
    if (setupData) {
      setInterviewData(JSON.parse(setupData))
      setTimeLeft(parseInt(JSON.parse(setupData).duration) * 60)
    } else {
      navigate('/setup')
      return
    }

    // 카메라 시작
    startCamera()

    return () => {
      // 컴포넌트 언마운트 시 카메라 스트림 정리
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [navigate])

  useEffect(() => {
    // 타이머
    if (!isPaused && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0) {
      handleFinishInterview()
    }
  }, [timeLeft, isPaused])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error('카메라 접근 실패:', error)
      alert('카메라와 마이크에 접근할 수 없습니다. 브라우저 설정을 확인해주세요.')
    }
  }

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true)
      setIsAIThinking(false)
    } else {
      setIsRecording(false)
      simulateAIResponse()
    }
  }

  const simulateAIResponse = () => {
    setIsAIThinking(true)
    // AI 응답 시뮬레이션 (3초 후 다음 질문)
    setTimeout(() => {
      setIsAIThinking(false)
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1)
      } else {
        handleFinishInterview()
      }
    }, 3000)
  }

  const handlePause = () => {
    setIsPaused(!isPaused)
  }

  const handleFinishInterview = () => {
    // 면접 결과 데이터 생성
    const result = {
      ...interviewData,
      questionsAnswered: currentQuestion + 1,
      totalQuestions: questions.length,
      timeUsed: (parseInt(interviewData?.duration || '10') * 60) - timeLeft,
      timestamp: new Date().toISOString()
    }
    
    sessionStorage.setItem('interviewResult', JSON.stringify(result))
    navigate('/result')
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!interviewData) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* 상단 상태바 */}
      <div className="bg-gray-800 p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
          </div>
          <div className="text-gray-400">
            질문 {currentQuestion + 1} / {questions.length}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={handlePause}
            className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
          >
            {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </button>
          <button
            onClick={handleFinishInterview}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            <Square className="w-4 h-4 inline mr-2" />
            면접 종료
          </button>
        </div>
      </div>

      <div className="flex h-screen">
        {/* 면접관 영역 */}
        <div className="w-1/2 bg-gradient-to-br from-blue-900 to-purple-900 flex flex-col">
          <div className="p-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
              <div className="text-6xl mb-4">{interviewer.avatar}</div>
              <h2 className="text-2xl font-bold mb-2">{interviewer.name}</h2>
              <p className="text-blue-200 mb-4">{interviewer.role}</p>
              <div className="text-sm text-gray-300">
                {interviewer.personality} 면접관
              </div>
            </div>
          </div>
          
          {/* 질문 영역 */}
          <div className="flex-1 p-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 h-full flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-4">
                <Volume2 className="w-5 h-5 text-yellow-400" />
                <span className="text-sm text-gray-300">면접관이 말하고 있습니다...</span>
              </div>
              
              <div className="text-xl leading-relaxed">
                {isAIThinking ? (
                  <div className="text-gray-400">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      AI가 다음 질문을 준비하고 있습니다...
                    </div>
                  </div>
                ) : (
                  questions[currentQuestion]
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 응시자 영역 */}
        <div className="w-1/2 bg-gray-800 flex flex-col">
          <div className="p-6">
            <div className="bg-gray-700 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <User className="w-5 h-5 text-green-400" />
                <span className="font-semibold">응시자</span>
                <div className={`px-2 py-1 rounded text-xs ${
                  isRecording ? 'bg-red-500' : 'bg-gray-500'
                }`}>
                  {isRecording ? '답변 중' : '대기 중'}
                </div>
              </div>
              <div className="text-sm text-gray-300">
                {interviewData.major} · {interviewData.university}
              </div>
            </div>
          </div>
          
          {/* 비디오 영역 */}
          <div className="flex-1 p-6">
            <div className="relative h-full bg-black rounded-xl overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              
              {/* 녹화 표시 */}
              {isRecording && (
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-white text-sm font-semibold">REC</span>
                </div>
              )}
            </div>
          </div>
          
          {/* 컨트롤 버튼 */}
          <div className="p-6">
            <div className="flex justify-center">
              <button
                onClick={toggleRecording}
                disabled={isAIThinking}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-blue-600 hover:bg-blue-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isRecording ? (
                  <MicOff className="w-8 h-8" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </button>
            </div>
            <div className="text-center mt-4 text-sm text-gray-400">
              {isRecording ? '답변을 완료하려면 클릭하세요' : '답변을 시작하려면 클릭하세요'}
            </div>
          </div>
        </div>
      </div>
      
      {/* 진행률 바 */}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-gray-700">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
          style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
        />
      </div>
    </div>
  )
}