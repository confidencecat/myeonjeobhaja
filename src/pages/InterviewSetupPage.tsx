import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  Settings, Users, Edit, Trash2, Save, X, ChevronRight, User, GraduationCap, 
  Plus, MoreVertical, Clock, Target, BarChart3, Loader2, CheckCircle, ArrowLeft 
} from 'lucide-react';

// --- 타입 정의 ---
type InterviewerRole = '입학사정관' | '교수';
type Interviewer = {
  id: string; name: string; role: InterviewerRole; personality: string;
  description: string; major?: string; is_custom?: boolean; user_id?: string;
};
type EvaluationCriteria = {
  id: string; name: string; description: string; weight: number;
  selected: boolean; is_custom?: boolean; evaluation_method?: string;
  portfolio_evaluation?: string; interview_evaluation?: string;
};

// --- 상수 정의 ---
const DEFAULT_INTERVIEWERS: Interviewer[] = [
  { id: 'default-ao-1', name: '김미영 입학사정관', role: '입학사정관', personality: '친근하고 격려하는', description: '15년 경력의 베테랑. 학생의 잠재력을 발견하는 데 전문가입니다.' },
  { id: 'default-ao-2', name: '박준호 입학사정관', role: '입학사정관', personality: '체계적이고 분석적인', description: '논리적 사고와 체계적인 질문으로 학생의 역량을 정확히 평가합니다.' },
  { id: 'default-ao-3', name: '이수진 입학사정관', role: '입학사정관', personality: '따뜻하고 공감하는', description: '학생의 입장에서 이해하고 공감하며 편안한 면접 분위기를 만듭니다.' },
  { id: 'default-p-1', name: '최영수 교수', role: '교수', personality: '엄격하고 전문적인', description: '컴퓨터공학과 교수로 기술적 역량과 논리적 사고를 중시합니다.', major: '컴퓨터공학과' },
  { id: 'default-p-2', name: '한지민 교수', role: '교수', personality: '창의적이고 개방적인', description: '경영학과 교수로 창의적 사고와 리더십 역량을 평가합니다.', major: '경영학과' },
  { id: 'default-p-3', name: '정현우 교수', role: '교수', personality: '꼼꼼하고 세심한', description: '기계공학과 교수로 문제해결 능력과 실무 적용력을 중요시합니다.', major: '기계공학과' },
  { id: 'default-p-4', name: '송민아 교수', role: '교수', personality: '친근하고 격려하는', description: '심리학과 교수로 학생의 내면과 성장 가능성을 깊이 있게 탐구합니다.', major: '심리학과' },
  { id: 'default-p-5', name: '윤태호 교수', role: '교수', personality: '논리적이고 체계적인', description: '수학과 교수로 논리적 사고와 문제 분석 능력을 중점적으로 평가합니다.', major: '수학과' },
];
const DEFAULT_CRITERIA: EvaluationCriteria[] = [
    { id: 'academic', name: '학업 역량', description: '학습 능력과 학업 성취도', weight: 25, selected: true, evaluation_method: '교과 성적, 학습 태도, 지적 호기심을 종합적으로 평가', portfolio_evaluation: '교과 세부능력 및 특기사항, 학업 관련 활동 기록', interview_evaluation: '학습 동기, 학업 계획, 전공 관련 지식 수준' },
    { id: 'major_suitability', name: '전공 적합성', description: '전공에 대한 관심과 이해도', weight: 25, selected: true, evaluation_method: '전공 관련 활동, 독서, 탐구 경험을 통해 평가', portfolio_evaluation: '전공 관련 동아리, 프로젝트, 연구 보고서', interview_evaluation: '전공 지원 동기, 전공 이해도, 관련 경험' },
    { id: 'personality', name: '인성', description: '소통 능력, 협업 능력, 윤리 의식', weight: 25, selected: true, evaluation_method: '협업 경험, 봉사 활동, 리더십 경험을 통해 평가', portfolio_evaluation: '행동특성 및 종합의견, 봉사활동, 동아리 활동', interview_evaluation: '협업 경험, 갈등 해결 사례, 가치관' },
    { id: 'potential', name: '발전 가능성', description: '자기주도성, 창의적 문제 해결 능력', weight: 25, selected: true, evaluation_method: '도전적인 과제 수행 경험, 성장 과정, 목표 의식 평가', portfolio_evaluation: '진로 활동, 자율 활동, 탐구 보고서', interview_evaluation: '목표 달성 경험, 역경 극복 사례, 장래 포부' },
];

// --- 메인 컴포넌트 ---
export default function InterviewSetupPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [allInterviewers, setAllInterviewers] = useState<Interviewer[]>(DEFAULT_INTERVIEWERS);
  const [selectedOfficer, setSelectedOfficer] = useState<string | null>(null);
  const [selectedProfessors, setSelectedProfessors] = useState<string[]>([]);
  
  const [duration, setDuration] = useState(10);
  const [difficulty, setDifficulty] = useState('보통');
  const [questionStyle, setQuestionStyle] = useState('밝은 격려형');
  const [evaluationCriteria, setEvaluationCriteria] = useState<EvaluationCriteria[]>(DEFAULT_CRITERIA);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) { setLoading(false); return; }
      setLoading(true);
      try {
        const [{ data: customInterviewers }, { data: customCriteria }, { data: setup }] = await Promise.all([
          supabase.from('interviewers').select('*').eq('user_id', user.id),
          supabase.from('custom_evaluation_criteria').select('*').eq('user_id', user.id),
          supabase.from('interview_setups').select('*').eq('user_id', user.id).maybeSingle()
        ]);

        const mappedInterviewers = customInterviewers?.map(i => ({ ...i, id: i.id.toString(), is_custom: true, role: i.role as InterviewerRole })) || [];
        setAllInterviewers([...DEFAULT_INTERVIEWERS, ...mappedInterviewers]);

        const mappedCriteria = customCriteria?.map(c => ({ ...c, id: c.id.toString(), is_custom: true, weight: 0, selected: false })) || [];
        setEvaluationCriteria([...DEFAULT_CRITERIA, ...mappedCriteria]);

        if (setup) {
          setSelectedOfficer(setup.selected_interviewer_ids?.[0] || null);
          setSelectedProfessors(setup.selected_interviewer_ids?.slice(1) || []);
          setDuration(setup.duration || 10);
          setDifficulty(setup.difficulty || '보통');
          setQuestionStyle(setup.question_style || '밝은 격려형');
        }
      } catch (err: any) {
        setError('데이터 로딩 실패: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleOfficerSelect = (id: string) => setSelectedOfficer(prev => prev === id ? null : id);
  const handleProfessorSelect = (id: string) => {
    setSelectedProfessors(prev => {
      if (prev.includes(id)) return prev.filter(pId => pId !== id);
      if (prev.length < 2) return [...prev, id];
      alert('교수는 최대 2명까지 선택할 수 있습니다.');
      return prev;
    });
  };

  const handleSave = async () => { /* ... */ };
  const getTotalWeight = () => evaluationCriteria.filter(c => c.selected).reduce((sum, c) => sum + c.weight, 0);

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>;

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex justify-center items-center mb-12">
        <div className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${step === 1 ? 'bg-blue-600' : 'bg-gray-300'}`}>1</div>
          <span className="ml-3 font-semibold text-lg">면접관 선택</span>
        </div>
        <div className="w-24 h-1 bg-gray-300 mx-4"></div>
        <div className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${step === 2 ? 'bg-blue-600' : 'bg-gray-300'}`}>2</div>
          <span className="ml-3 font-semibold text-lg">상세 설정</span>
        </div>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6">{error}</div>}

      {step === 1 && (
        <div>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold">면접관 선택</h2>
            <p className="text-gray-600 mt-2">면접을 진행할 입학사정관 1명과 교수 2명을 선택해주세요.</p>
          </div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">입학사정관 (1명 선택)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {allInterviewers.filter(i => i.role === '입학사정관').map(interviewer => (
              <InterviewerCard key={interviewer.id} interviewer={interviewer} isSelected={selectedOfficer === interviewer.id} onSelect={() => handleOfficerSelect(interviewer.id)} />
            ))}
          </div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">교수 (2명 선택)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allInterviewers.filter(i => i.role === '교수').map(interviewer => (
              <InterviewerCard key={interviewer.id} interviewer={interviewer} isSelected={selectedProfessors.includes(interviewer.id)} onSelect={() => handleProfessorSelect(interviewer.id)} />
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold">면접 상세 설정</h2>
            <p className="text-gray-600 mt-2">면접 진행 방식과 평가 기준을 설정해주세요.</p>
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            {/* 기본 설정 (시간, 난이도, 분위기) */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="font-bold flex items-center gap-2 mb-3"><Clock size={20}/> 면접 시간</h3>
                <select value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full p-2 border rounded-md">
                  {[5, 10, 15, 20, 30].map(t => <option key={t} value={t}>{t}분</option>)}
                </select>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="font-bold flex items-center gap-2 mb-3"><Target size={20}/> 면접 난이도</h3>
                <div className="space-y-2">
                  {['쉬움', '보통', '어려움'].map(d => (
                    <label key={d} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50">
                      <input type="radio" name="difficulty" value={d} checked={difficulty === d} onChange={e => setDifficulty(e.target.value)} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"/>
                      <span>{d}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="font-bold flex items-center gap-2 mb-3"><Settings size={20}/> 면접 분위기</h3>
                <div className="space-y-2">
                  {['밝은 격려형', '밝은 친근형', '어두운 압박형', '어두운 분석형'].map(s => (
                    <label key={s} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50">
                      <input type="radio" name="style" value={s} checked={questionStyle === s} onChange={e => setQuestionStyle(e.target.value)} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"/>
                      <span>{s}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            {/* 평가 요소 설정 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold flex items-center gap-2"><BarChart3 size={20}/> 평가 요소 및 비율</h3>
                <button className="text-sm text-blue-600 font-semibold hover:underline">요소 추가</button>
              </div>
              <div className="space-y-4">
                {evaluationCriteria.map((c, index) => (
                  <div key={c.id} className="border-t pt-4">
                    <label className="flex items-center gap-3 font-medium">
                      <input type="checkbox" checked={c.selected} onChange={() => {
                        const newCriteria = [...evaluationCriteria];
                        newCriteria[index].selected = !newCriteria[index].selected;
                        if (!newCriteria[index].selected) newCriteria[index].weight = 0;
                        setEvaluationCriteria(newCriteria);
                      }} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"/>
                      {c.name}
                    </label>
                    {c.selected && (
                      <div className="flex items-center gap-3 mt-2 pl-7">
                        <input type="range" min="0" max="100" step="5" value={c.weight} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" onChange={e => {
                          const newCriteria = [...evaluationCriteria];
                          newCriteria[index].weight = Number(e.target.value);
                          setEvaluationCriteria(newCriteria);
                        }}/>
                        <span className="font-semibold w-12 text-right">{c.weight}%</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-6 border-t pt-4">
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>총합</span>
                  <span className={getTotalWeight() === 100 ? 'text-green-600' : 'text-red-600'}>{getTotalWeight()}%</span>
                </div>
                {getTotalWeight() !== 100 && <p className="text-red-600 text-sm text-right mt-1">총합이 100%가 되어야 합니다.</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-12 flex justify-between">
        <button onClick={() => step === 1 ? navigate('/profile') : setStep(1)} className="px-6 py-3 bg-gray-200 rounded-lg font-semibold flex items-center gap-2"><ArrowLeft size={20}/> 이전</button>
        {step === 1 ? (
          <button onClick={() => setStep(2)} disabled={!selectedOfficer || selectedProfessors.length !== 2} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold disabled:bg-gray-400 flex items-center gap-2">다음 설정 <ChevronRight size={20}/></button>
        ) : (
          <button onClick={handleSave} disabled={saving || Math.abs(getTotalWeight() - 100) > 0.1} className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold disabled:bg-gray-400">
            {saving ? <Loader2 className="animate-spin" /> : '면접 시작하기'}
          </button>
        )}
      </div>
    </div>
  );
}

const InterviewerCard = ({ interviewer, isSelected, onSelect }: { interviewer: Interviewer, isSelected: boolean, onSelect: () => void }) => (
    <div onClick={onSelect} className={`p-6 border-2 rounded-xl cursor-pointer relative transition-all duration-300 ${isSelected ? 'border-blue-500 bg-blue-50 shadow-lg' : 'border-gray-200 bg-white hover:border-blue-400 hover:shadow-md'}`}>
        {isSelected && <CheckCircle className="absolute top-4 right-4 text-blue-600 h-6 w-6" />}
        <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                {interviewer.role === '입학사정관' ? <User size={32} className="text-gray-600"/> : <GraduationCap size={32} className="text-gray-600"/>}
            </div>
            <div>
                <h3 className="font-bold text-lg">{interviewer.name}</h3>
                <p className="text-sm font-medium text-gray-500">{interviewer.personality}</p>
            </div>
        </div>
        <p className="text-sm text-gray-700 mt-4">{interviewer.description}</p>
        {interviewer.is_custom && <span className="absolute bottom-3 left-4 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">사용자 생성</span>}
    </div>
);
