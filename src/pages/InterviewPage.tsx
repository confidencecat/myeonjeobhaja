import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Settings, Clock, HelpCircle, Mic, Send, Volume2, X } from 'lucide-react';

// --- Mock Data ---
const mockInterviewers = [
  { id: 1, name: '김미영 입학사정관', image: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' },
  { id: 2, name: '최영수 교수', image: 'https://i.pravatar.cc/150?u=a042581f4e29026705d' },
  { id: 3, name: '박준호 입학사정관', image: 'https://i.pravatar.cc/150?u=a042581f4e29026706d' },
];

const mockChatHistory = [
  { speaker: '면접관', message: '안녕하세요, 면접에 오신 것을 환영합니다. 먼저 자기소개 부탁드립니다.' },
  { speaker: '나', message: '네, 안녕하십니까. 저는 무한한 가능성을 가진 지원자 OOO입니다.' },
  { speaker: '면접관', message: '반갑습니다. OOO님. 저희 학교에 지원하신 동기가 무엇인가요?' },
];

const mockHelperTips = [
  '답변은 두괄식으로 명확하게 전달하는 것이 좋습니다.',
  '자신감 있는 목소리와 긍정적인 태도를 유지하세요.',
  '질문의 의도를 파악하고 핵심에 맞춰 답변하세요.',
];

// --- Sub-components ---

const VoiceWaveform = () => {
  const [bars, setBars] = useState(Array(30).fill(0).map(() => Math.random() * 20 + 5));

  useEffect(() => {
    const interval = setInterval(() => {
      setBars(bars.map(() => Math.random() * 25 + 5));
    }, 150);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center gap-1 w-full h-full bg-gray-800 rounded-lg p-4">
      {bars.map((height, i) => (
        <div key={i} className="w-1 bg-green-400 rounded-full" style={{ height: `${height}px`, transition: 'height 0.1s ease-in-out' }}></div>
      ))}
    </div>
  );
};

// --- Main Component ---

export default function InterviewPage() {
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [inputType, setInputType] = useState<'text' | 'voice'>('voice');
  
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10 * 60); // 10 minutes

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [timerActive, timeLeft]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mockChatHistory]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      {/* Left Sidebar: Chat */}
      <div className={`transition-all duration-300 bg-white shadow-lg flex flex-col ${isChatOpen ? 'w-80' : 'w-0'} overflow-hidden`}>
        <div className="p-4 border-b flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-800">면접 기록</h2>
        </div>
        <div className="flex-grow p-4 overflow-y-auto">
          <div className="space-y-4">
            {mockChatHistory.map((chat, index) => (
              <div key={index} className={`flex ${chat.speaker === '나' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-3 rounded-lg max-w-xs ${chat.speaker === '나' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                  <p className="text-sm">{chat.message}</p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        </div>
      </div>

      {/* Center Content: Interviewers & Input */}
      <main className="flex-1 flex flex-col items-center justify-between p-6 relative">
        <button 
          onClick={() => setIsChatOpen(!isChatOpen)} 
          className="absolute top-1/2 -left-4 z-10 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-md border hover:bg-gray-100"
        >
          {isChatOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>

        <div className="flex justify-center gap-12">
          {mockInterviewers.map(interviewer => (
            <div key={interviewer.id} className="text-center">
              <div className="w-40 h-40 bg-gray-300 rounded-2xl mb-2 overflow-hidden shadow-md">
                <img src={interviewer.image} alt={interviewer.name} className="w-full h-full object-cover" />
              </div>
              <p className="font-semibold text-gray-700">{interviewer.name}</p>
            </div>
          ))}
        </div>
        
        <div className="w-full max-w-2xl h-24">
          {inputType === 'text' ? (
            <div className="relative w-full h-full">
              <textarea 
                className="w-full h-full p-4 pr-20 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="답변을 입력하세요..."
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700">
                <Send size={20} />
              </button>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <VoiceWaveform />
            </div>
          )}
        </div>
      </main>

      {/* Right Sidebar: Functions */}
      <div className="w-80 bg-white shadow-lg p-4 flex flex-col gap-4">
        {/* Timer Section */}
        <div className="p-4 border rounded-xl bg-gray-50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3"><Clock size={18} /> 면접 시간</h3>
          {timerActive ? (
            <div className="text-center text-4xl font-mono font-bold text-blue-600 py-2">
              {formatTime(timeLeft)}
            </div>
          ) : (
            <button 
              onClick={() => setTimerActive(true)}
              className="w-full py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              시작하기
            </button>
          )}
        </div>

        {/* Settings Section */}
        <div className="p-4 border rounded-xl bg-gray-50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3"><Settings size={18} /> 현재 설정</h3>
          <div className="space-y-2 text-sm">
            <p><span className="font-semibold w-24 inline-block">프리셋:</span> 표준</p>
            <p><span className="font-semibold w-24 inline-block">질문 깊이:</span> 심화</p>
            <div className="flex items-center">
              <label className="font-semibold w-24 inline-block">입력 방식:</label>
              <div className="flex items-center gap-1 rounded-lg p-1 bg-gray-200">
                <button onClick={() => setInputType('text')} className={`px-3 py-1 text-xs rounded-md ${inputType === 'text' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'}`}>텍스트</button>
                <button onClick={() => setInputType('voice')} className={`px-3 py-1 text-xs rounded-md ${inputType === 'voice' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'}`}>음성</button>
              </div>
            </div>
          </div>
        </div>

        {/* Helper Section */}
        <div className="p-4 border rounded-xl bg-gray-50 flex-grow flex flex-col">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3"><HelpCircle size={18} /> 실시간 도우미</h3>
          <div className="flex-grow overflow-y-auto">
            <ul className="space-y-2 text-sm text-gray-600 list-disc list-inside">
              {mockHelperTips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </div>
        </div>
        
        <button 
          onClick={() => navigate('/')}
          className="w-full py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
        >
          <X size={18} /> 나가기
        </button>
      </div>
    </div>
  );
}
