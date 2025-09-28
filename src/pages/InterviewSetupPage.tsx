import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  Settings, Users, Edit, Trash2, Save, X, ChevronRight, User, GraduationCap, 
  Plus, MoreVertical, Clock, Target, BarChart3, Loader2, CheckCircle, ArrowLeft, Eye
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
type ModalState = {
  isOpen: boolean;
  mode: 'view' | 'create' | 'edit';
  data: Interviewer | null;
}

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

  const [modalState, setModalState] = useState<ModalState>({ isOpen: false, mode: 'create', data: null });
  const [interviewerFormData, setInterviewerFormData] = useState<Partial<Interviewer>>({});

  const fetchData = useCallback(async () => {
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
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleOfficerSelect = (id: string) => setSelectedOfficer(prev => prev === id ? null : id);
  const handleProfessorSelect = (id: string) => {
    setSelectedProfessors(prev => {
      if (prev.includes(id)) return prev.filter(pId => pId !== id);
      if (prev.length < 2) return [...prev, id];
      alert('교수는 최대 2명까지 선택할 수 있습니다.');
      return prev;
    });
  };

  const handleOpenModal = (mode: 'view' | 'create' | 'edit', interviewer: Interviewer | null = null) => {
    setModalState({ isOpen: true, mode, data: interviewer });
    if (mode === 'create') {
      setInterviewerFormData({ name: '', role: '교수', personality: '', description: '', major: '' });
    } else if (interviewer) {
      setInterviewerFormData(interviewer);
    }
  };

  const handleCloseModal = () => {
    setModalState({ isOpen: false, mode: 'create', data: null });
  };

  const handleSaveInterviewer = async () => {
    if (!user) return;
    const isEditMode = modalState.mode === 'edit';
    const { id, ...formData } = interviewerFormData;
    const dataToSave = { ...formData, user_id: user.id, is_custom: true };

    const { error } = isEditMode
      ? await supabase.from('interviewers').update(dataToSave).eq('id', id)
      : await supabase.from('interviewers').insert(dataToSave);

    if (error) {
      setError(`면접관 ${isEditMode ? '수정' : '생성'} 실패: ` + error.message);
    } else {
      await fetchData();
      handleCloseModal();
    }
  };

  const handleDeleteInterviewer = async (interviewerId: string) => {
    if (!user || !confirm('정말로 이 면접관을 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('interviewers').delete().eq('id', interviewerId);
    if (error) {
      setError('면접관 삭제 실패: ' + error.message);
    } else {
      await fetchData();
    }
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
          <div className="flex justify-between items-center mb-8">
            <div className="text-center flex-grow">
              <h2 className="text-3xl font-bold">면접관 선택</h2>
              <p className="text-gray-600 mt-2">면접을 진행할 입학사정관 1명과 교수 2명을 선택해주세요.</p>
            </div>
            <button onClick={() => handleOpenModal('create')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"><Plus size={18}/> 면접관 추가</button>
          </div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">입학사정관 (1명 선택)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {allInterviewers.filter(i => i.role === '입학사정관').map(interviewer => (
              <InterviewerCard key={interviewer.id} interviewer={interviewer} isSelected={selectedOfficer === interviewer.id} onSelect={() => handleOfficerSelect(interviewer.id)} onAction={handleOpenModal} onDelete={handleDeleteInterviewer} />
            ))}
          </div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">교수 (2명 선택)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allInterviewers.filter(i => i.role === '교수').map(interviewer => (
              <InterviewerCard key={interviewer.id} interviewer={interviewer} isSelected={selectedProfessors.includes(interviewer.id)} onSelect={() => handleProfessorSelect(interviewer.id)} onAction={handleOpenModal} onDelete={handleDeleteInterviewer} />
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="grid lg:grid-cols-2 gap-8">
          {/* 상세 설정 UI */}
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

      {modalState.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">
                {modalState.mode === 'view' && '면접관 정보'}
                {modalState.mode === 'create' && '새 면접관 추가'}
                {modalState.mode === 'edit' && '면접관 수정'}
              </h3>
              <button onClick={handleCloseModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"><X size={24} /></button>
            </div>
            <div className="space-y-4">
              <input type="text" placeholder="이름" value={interviewerFormData.name || ''} onChange={e => setInterviewerFormData({...interviewerFormData, name: e.target.value})} className="w-full p-3 border rounded-lg" disabled={modalState.mode === 'view'} />
              <select value={interviewerFormData.role || '교수'} onChange={e => setInterviewerFormData({...interviewerFormData, role: e.target.value as InterviewerRole})} className="w-full p-3 border rounded-lg" disabled={modalState.mode === 'view'}>
                <option value="교수">교수</option>
                <option value="입학사정관">입학사정관</option>
              </select>
              <input type="text" placeholder="성격 (예: 친근함, 압박)" value={interviewerFormData.personality || ''} onChange={e => setInterviewerFormData({...interviewerFormData, personality: e.target.value})} className="w-full p-3 border rounded-lg" disabled={modalState.mode === 'view'} />
              {interviewerFormData.role === '교수' && <input type="text" placeholder="전공" value={interviewerFormData.major || ''} onChange={e => setInterviewerFormData({...interviewerFormData, major: e.target.value})} className="w-full p-3 border rounded-lg" disabled={modalState.mode === 'view'} />}
              <textarea placeholder="설명" value={interviewerFormData.description || ''} onChange={e => setInterviewerFormData({...interviewerFormData, description: e.target.value})} className="w-full p-3 border rounded-lg" rows={3} disabled={modalState.mode === 'view'}/>
            </div>
            <div className="mt-8 flex justify-end gap-4">
              <button onClick={handleCloseModal} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold">
                {modalState.mode === 'view' ? '닫기' : '취소'}
              </button>
              {modalState.mode !== 'view' && (
                <button onClick={handleSaveInterviewer} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-2">
                  <Save size={18} /> 저장
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const InterviewerCard = ({ interviewer, isSelected, onSelect, onAction, onDelete }: { 
  interviewer: Interviewer, isSelected: boolean, onSelect: () => void, 
  onAction: (mode: 'view' | 'edit', data: Interviewer) => void,
  onDelete: (id: string) => void
}) => (
    <div onClick={onSelect} className={`p-6 border-2 rounded-xl cursor-pointer relative transition-all duration-300 ${isSelected ? 'border-blue-500 bg-blue-50 shadow-lg' : 'border-gray-200 bg-white hover:border-blue-400 hover:shadow-md'}`}>
        <div className="absolute top-3 right-3 flex gap-1">
            <button onClick={(e) => { e.stopPropagation(); onAction('view', interviewer); }} className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full"><Eye size={16}/></button>
            {interviewer.is_custom && (
              <>
                <button onClick={(e) => { e.stopPropagation(); onAction('edit', interviewer); }} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-full"><Edit size={16}/></button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(interviewer.id); }} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full"><Trash2 size={16}/></button>
              </>
            )}
        </div>
        {isSelected && <CheckCircle className="absolute top-4 left-4 text-blue-600 h-5 w-5" />}
        <div className="flex items-center gap-4 mt-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                {interviewer.role === '입학사정관' ? <User size={32} className="text-gray-600"/> : <GraduationCap size={32} className="text-gray-600"/>}
            </div>
            <div>
                <h3 className="font-bold text-lg">{interviewer.name}</h3>
                <p className="text-sm font-medium text-gray-500">{interviewer.personality}</p>
            </div>
        </div>
        <p className="text-sm text-gray-700 mt-4">{interviewer.description}</p>
        {interviewer.is_custom && <span className="absolute bottom-3 right-3 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">사용자 생성</span>}
    </div>
);