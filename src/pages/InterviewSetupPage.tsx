import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  Settings, Users, Edit, Trash2, Save, X, ChevronRight, User, GraduationCap, 
  Plus, Clock, BarChart3, Loader2, CheckCircle, ArrowLeft, Eye, Info, SlidersHorizontal, BrainCircuit, Mic, Smile, FileText, Video
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// --- 타입 정의 ---
type InterviewerRole = '입학사정관' | '교수';
type Interviewer = {
  id: string; name: string; role: InterviewerRole; personality: string;
  description: string; major?: string; is_custom?: boolean; user_id?: string;
};

type ScoreRange = {
  id: string;
  min: number;
  max: number;
  description: string;
  factor_id?: string;
};

type EvaluationFactor = {
  id: string;
  name: string;
  description: string;
  weight: number;
  selected: boolean;
  isDefault: boolean;
  criteria: ScoreRange[];
  user_id?: string;
};

type InterviewerModalState = {
  isOpen: boolean;
  mode: 'view' | 'create' | 'edit';
  data: Interviewer | null;
}

type FactorModalState = {
  isOpen: boolean;
  mode: 'view' | 'create' | 'edit';
  data: EvaluationFactor | null;
}

type QuestionPart = 'start' | 'record' | 'end';

type AdvancedSettings = {
  preset: string;
  question_depth: string;
  generated_question_parts: QuestionPart[];
  allow_follow_up: boolean;
  max_follow_up_depth: number;
  interviewer_interaction: boolean;
  question_order: string;
  answer_time_limit: string;
  retry_opportunity: boolean;
  hint_level: string;
  pressure_level: string;
  encouragement_frequency: string;
  non_verbal_reaction: string;
  evaluation_timing: string;
  major_question_ratio: number;
  include_current_events: boolean;
  personal_experience_ratio: number;
  detailed_recording: boolean;
  answer_analysis: boolean;
  generate_report: boolean;
};


// --- 상수 정의 ---
const DEFAULT_INTERVIEWERS: Interviewer[] = [
  { id: 'default-ao-1', name: '김미영 입학사정관', role: '입학사정관', personality: '친근하고 격려하는', description: '15년 경력의 베테랑. 학생의 잠재력을 발견하는 데 전문가입니다.' },
  { id: 'default-ao-2', name: '박준호 입학사정관', role: '입학사정관', personality: '체계적이고 분석적인', description: '논리적 사고와 체계적인 질문으로 학생의 역량을 정확히 평가합니다.' },
  { id: 'default-ao-3', name: '이수진 입학사정관', role: '입학사정관', personality: '따뜻하고 공감하는', description: '학생의 입장에서 이해하고 공감하며 편안한 면접 분위기를 만듭니다.' },
  { id: 'default-p-1', name: '최영수 교수', role: '교수', personality: '엄격하고 전문적인', description: '컴퓨터공학과 교수로 기술적 역량과 논리적 사고를 중시합니다.', major: '컴퓨터공학과' },
  { id: 'default-p-2', name: '한지민 교수', role: '교수', personality: '창의적이고 개방적인', description: '경영학과 교수로 창의적 사고와 리더십 역량을 평가합니다.', major: '경영학과' },
  { id: 'default-p-3', name: '정현우 교수', role: '교수', personality: '꼼꼼하고 세심한', description: '기계공학과 교수로 문제해결 능력과 실무 적용력을 중요시합니다.', major: '기계공학과' },
];

const DEFAULT_FACTORS: EvaluationFactor[] = [
    {
        id: 'academic', name: '학업 역량', description: '학습 능력과 학업 성취도', weight: 25, selected: true, isDefault: true,
        criteria: [
            { id: uuidv4(), min: 91, max: 100, description: '학업에 대한 깊은 이해와 탁월한 성취를 보이며, 자기주도적 학습 능력이 뛰어남.' },
            { id: uuidv4(), min: 71, max: 90, description: '학업 내용에 대한 이해도가 높고 성실한 태도를 보이나, 일부 심화 개념에 대한 이해는 부족함.' },
            { id: uuidv4(), min: 51, max: 70, description: '기본적인 학업 내용을 이해하고 있으나, 응용 및 심화 학습에 어려움을 겪음.' },
            { id: uuidv4(), min: 0, max: 50, description: '학업에 대한 관심과 이해도가 부족하며, 추가적인 노력이 필요함.' },
        ]
    },
    {
        id: 'major_suitability', name: '전공 적합성', description: '전공에 대한 관심과 이해도', weight: 25, selected: true, isDefault: true,
        criteria: [
            { id: uuidv4(), min: 91, max: 100, description: '전공에 대한 명확한 목표와 깊이 있는 탐색 경험을 바탕으로, 뛰어난 잠재력을 보여줌.' },
            { id: uuidv4(), min: 71, max: 90, description: '전공에 대한 관심과 관련 활동 경험이 있으나, 목표 의식이나 구체적인 계획이 다소 부족함.' },
            { id: uuidv4(), min: 51, max: 70, description: '전공에 대한 일반적인 수준의 관심을 보이지만, 관련 경험이나 깊이 있는 고민이 부족함.' },
            { id: uuidv4(), min: 0, max: 50, description: '전공에 대한 이해와 관심이 부족하며, 지원 동기가 불분명함.' },
        ]
    },
    {
        id: 'personality', name: '인성', description: '소통 능력, 협업 능력, 윤리 의식', weight: 25, selected: true, isDefault: true,
        criteria: [
            { id: uuidv4(), min: 91, max: 100, description: '타인에 대한 공감 능력이 뛰어나고, 공동체 발전에 기여하려는 의지가 강하며, 뚜렷한 윤리 의식을 갖춤.' },
            { id: uuidv4(), min: 71, max: 90, description: '원만한 대인 관계를 유지하고 협업에 적극적으로 참여하나, 주도적인 역할 수행 경험은 부족함.' },
            { id: uuidv4(), min: 51, max: 70, description: '기본적인 사회성은 갖추고 있으나, 갈등 상황 대처 능력이나 타인에 대한 배려가 다소 부족함.' },
            { id: uuidv4(), min: 0, max: 50, description: '공동체 의식과 타인에 대한 배려가 부족하며, 소통에 어려움을 겪는 경향이 있음.' },
        ]
    },
    {
        id: 'potential', name: '발전 가능성', description: '자기주도성, 창의적 문제 해결 능력', weight: 25, selected: true, isDefault: true,
        criteria: [
            { id: uuidv4(), min: 91, max: 100, description: '새로운 것에 대한 도전 정신이 강하고, 실패를 두려워하지 않으며, 스스로 성장하려는 의지가 뚜렷함.' },
            { id: uuidv4(), min: 71, max: 90, description: '목표를 향해 꾸준히 노력하는 모습을 보이나, 예상치 못한 문제 발생 시 대처 능력이 다소 부족함.' },
            { id: uuidv4(), min: 51, max: 70, description: '주어진 과제는 성실히 수행하지만, 스스로 새로운 목표를 설정하고 도전하는 경험이 부족함.' },
            { id: uuidv4(), min: 0, max: 50, description: '자기 성장에 대한 의지가 부족하고, 수동적인 태도를 보이는 경향이 있음.' },
        ]
    },
];

const DURATION_OPTIONS = [3, 5, 7, 10, 15, 20];

const PRESETS: { [key: string]: Partial<AdvancedSettings> } = {
  beginner: {
    preset: 'beginner',
    question_depth: 'surface',
    generated_question_parts: ['record'],
    allow_follow_up: false,
    pressure_level: 'comfortable',
    encouragement_frequency: 'frequent',
    hint_level: 'high',
  },
  standard: {
    preset: 'standard',
    question_depth: 'in-depth',
    generated_question_parts: ['start', 'record', 'end'],
    allow_follow_up: true,
    max_follow_up_depth: 2,
    pressure_level: 'standard',
    encouragement_frequency: 'standard',
    hint_level: 'standard',
  },
  advanced: {
    preset: 'advanced',
    question_depth: 'professional',
    generated_question_parts: ['start', 'record', 'end'],
    allow_follow_up: true,
    max_follow_up_depth: 4,
    pressure_level: 'tense',
    encouragement_frequency: 'rare',
    hint_level: 'low',
  },
};


const DEFAULT_ADVANCED_SETTINGS: AdvancedSettings = {
  preset: 'standard',
  question_depth: 'in-depth',
  generated_question_parts: ['start', 'record', 'end'],
  allow_follow_up: true,
  max_follow_up_depth: 2,
  interviewer_interaction: false,
  question_order: 'sequential',
  answer_time_limit: 'flexible',
  retry_opportunity: true,
  hint_level: 'standard',
  pressure_level: 'standard',
  encouragement_frequency: 'standard',
  non_verbal_reaction: 'standard',
  evaluation_timing: 'after',
  major_question_ratio: 50,
  include_current_events: true,
  personal_experience_ratio: 50,
  detailed_recording: true,
  answer_analysis: true,
  generate_report: true,
};

// --- 메인 컴포넌트 ---
export default function InterviewSetupPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Step 1 State
  const [allInterviewers, setAllInterviewers] = useState<Interviewer[]>(DEFAULT_INTERVIEWERS);
  const [selectedOfficer, setSelectedOfficer] = useState<string | null>(null);
  const [selectedProfessors, setSelectedProfessors] = useState<string[]>([]);
  const [professorSelectionWarning, setProfessorSelectionWarning] = useState('');
  
  // Step 2 State
  const [duration, setDuration] = useState(10);
  const [evaluationFactors, setEvaluationFactors] = useState<EvaluationFactor[]>(DEFAULT_FACTORS);
  const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettings>(DEFAULT_ADVANCED_SETTINGS);

  // Modals State
  const [interviewerModal, setInterviewerModal] = useState<InterviewerModalState>({ isOpen: false, mode: 'create', data: null });
  const [interviewerFormData, setInterviewerFormData] = useState<Partial<Interviewer>>({});
  const [factorModal, setFactorModal] = useState<FactorModalState>({ isOpen: false, mode: 'create', data: null });

  const handleAdvancedSettingChange = (key: keyof AdvancedSettings, value: any) => {
    setAdvancedSettings(prev => {
      const newState = { ...prev, [key]: value, preset: 'custom' };
      if (key === 'major_question_ratio') {
        newState.personal_experience_ratio = 100 - value;
      }
      if (key === 'personal_experience_ratio') {
        newState.major_question_ratio = 100 - value;
      }
      return newState;
    });
  };

  const handleQuestionPartChange = (part: QuestionPart) => {
    const currentParts = advancedSettings.generated_question_parts;
    const newParts = currentParts.includes(part)
      ? currentParts.filter(p => p !== part)
      : [...currentParts, part];

    let maxParts = 3;
    if (duration === 3) maxParts = 1;
    else if (duration === 5) maxParts = 2;

    if (newParts.length > maxParts) {
      // Optionally, provide feedback to the user
      console.log(`면접 시간이 ${duration}분일 경우 최대 ${maxParts}개의 파트만 선택할 수 있습니다.`);
      return;
    }
    
    handleAdvancedSettingChange('generated_question_parts', newParts);
  };

  useEffect(() => {
    let maxParts = 3;
    if (duration === 3) maxParts = 1;
    else if (duration === 5) maxParts = 2;

    setAdvancedSettings(prev => {
      if (prev.generated_question_parts.length > maxParts) {
        return {
          ...prev,
          generated_question_parts: prev.generated_question_parts.slice(0, maxParts),
          preset: 'custom'
        };
      }
      return prev;
    });
  }, [duration]);

  const handlePresetChange = (presetName: string) => {
    setAdvancedSettings(prev => ({
      ...prev,
      ...PRESETS[presetName],
    }));
  };

  const fetchData = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    setError('');
    try {
      const [{ data: customInterviewers }, { data: customFactors }, { data: setup }] = await Promise.all([
        supabase.from('interviewers').select('*').eq('user_id', user.id),
        supabase.from('evaluation_factors').select('*, criteria:evaluation_criteria(*)').eq('user_id', user.id),
        supabase.from('interview_setups').select('*').eq('user_id', user.id).maybeSingle()
      ]);

      const mappedInterviewers = customInterviewers?.map(i => ({ ...i, id: i.id.toString(), is_custom: true, role: i.role as InterviewerRole })) || [];
      setAllInterviewers([...DEFAULT_INTERVIEWERS, ...mappedInterviewers]);

      const mappedFactors = customFactors?.map(f => ({ ...f, id: f.id.toString(), isDefault: false, weight: 0, selected: false, criteria: (f.criteria || []).map((c: any) => ({...c, id: c.id.toString()})) })) || [];
      setEvaluationFactors([...DEFAULT_FACTORS, ...mappedFactors]);

      if (setup) {
        setSelectedOfficer(setup.selected_interviewer_ids?.[0] || null);
        setSelectedProfessors(setup.selected_interviewer_ids?.slice(1) || []);
        setDuration(setup.duration || 10);
        setAdvancedSettings({ 
          ...DEFAULT_ADVANCED_SETTINGS, 
          ...setup,
          generated_question_parts: setup.generated_question_parts ?? DEFAULT_ADVANCED_SETTINGS.generated_question_parts,
        });
      }
    } catch (err: any) {
      setError('데이터 로딩 실패: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- 면접관 핸들러 ---
  const handleOfficerSelect = (id: string) => setSelectedOfficer(prev => prev === id ? null : id);
  const handleProfessorSelect = (id: string) => {
    setSelectedProfessors(prev => {
      if (prev.includes(id)) {
        return prev.filter(pId => pId !== id);
      }
      if (prev.length < 2) {
        return [...prev, id];
      }
      setProfessorSelectionWarning('교수는 최대 2명까지 선택할 수 있습니다.');
      setTimeout(() => setProfessorSelectionWarning(''), 5000);
      return prev;
    });
  };

  const handleOpenInterviewerModal = (mode: 'view' | 'create' | 'edit', interviewer: Interviewer | null = null) => {
    setInterviewerModal({ isOpen: true, mode, data: interviewer });
    if (mode === 'create') {
      setInterviewerFormData({ name: '', role: '교수', personality: '', description: '', major: '' });
    } else if (interviewer) {
      setInterviewerFormData(interviewer);
    }
  };
  const handleCloseInterviewerModal = () => setInterviewerModal({ isOpen: false, mode: 'create', data: null });

  const handleSaveInterviewer = async () => {
    if (!user) return;
    const isEditMode = interviewerModal.mode === 'edit';
    const { id, ...formData } = interviewerFormData;
    const dataToSave = { ...formData, user_id: user.id, is_custom: true };

    const { error } = isEditMode
      ? await supabase.from('interviewers').update(dataToSave).eq('id', id)
      : await supabase.from('interviewers').insert(dataToSave);

    if (error) setError(`면접관 ${isEditMode ? '수정' : '생성'} 실패: ` + error.message);
    else {
      await fetchData();
      handleCloseInterviewerModal();
    }
  };

  const handleDeleteInterviewer = async (interviewerId: string) => {
    if (!user || !confirm('정말로 이 면접관을 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('interviewers').delete().eq('id', interviewerId);
    if (error) setError('면접관 삭제 실패: ' + error.message);
    else await fetchData();
  };

  // --- 평가 요소 핸들러 ---
  const handleFactorToggle = (id: string) => {
    setEvaluationFactors(prev => prev.map(f => f.id === id ? { ...f, selected: !f.selected, weight: f.selected ? 0 : 10 } : f));
  };

  const handleWeightChange = (id: string, newWeight: number) => {
    setEvaluationFactors(prev => prev.map(f => f.id === id ? { ...f, weight: newWeight } : f));
  };

  const handleOpenFactorModal = (mode: 'view' | 'create' | 'edit', data: EvaluationFactor | null) => {
    setFactorModal({ isOpen: true, mode, data });
  };

  const handleSaveFactor = async (factorData: EvaluationFactor) => {
    if (!user) return;
    setError('');
    try {
      const { criteria, ...factorInfo } = factorData;
      const { id, name, description } = factorInfo;
      const factorToSave = { id, name, description, user_id: user.id };
      
      const { data: savedFactor, error: factorError } = await supabase.from('evaluation_factors').upsert(factorToSave).select().single();
      if (factorError) throw factorError;

      const criteriaToSave = criteria.map(({id, min, max, description}) => ({ id, min, max, description, factor_id: savedFactor.id, user_id: user.id }));
      const { error: criteriaError } = await supabase.from('evaluation_criteria').upsert(criteriaToSave);
      if (criteriaError) throw criteriaError;

      await fetchData();
    } catch (err: any) {
      setError('평가 요소 저장 실패: ' + err.message);
    }
  };

  const handleDeleteFactor = async (id: string) => {
    if (!user || !confirm('정말로 이 평가 요소를 삭제하시겠습니까? 연관된 채점 기준도 모두 삭제됩니다.')) return;
    setError('');
    try {
      const { error } = await supabase.from('evaluation_factors').delete().eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (err: any) {
      setError('평가 요소 삭제 실패: ' + err.message);
    }
  };

  const getTotalWeight = () => evaluationFactors.filter(c => c.selected).reduce((sum, c) => sum + c.weight, 0);

  const handleStartInterview = async () => {
    if (!user) return;
    setSaving(true);
    setError('');
    const selectedFactors = evaluationFactors.filter(f => f.selected);
    const setupData = {
      id: user.id,
      user_id: user.id,
      selected_interviewer_ids: [selectedOfficer, ...selectedProfessors],
      duration,
      evaluation_factors: selectedFactors.map(({ id, weight }) => ({ id, weight })),
      ...advancedSettings
    };

    try {
      const { error: setupError } = await supabase.from('interview_setups').upsert(setupData);
      if (setupError) throw setupError;
      navigate('/interview');
    } catch (err: any) {
      setError('설정 저장 실패: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>;

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
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
            <button onClick={() => handleOpenInterviewerModal('create')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"><Plus size={18}/> 면접관 추가</button>
          </div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">입학사정관 (1명 선택)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {allInterviewers.filter(i => i.role === '입학사정관').map(interviewer => (
              <InterviewerCard key={interviewer.id} interviewer={interviewer} isSelected={selectedOfficer === interviewer.id} onSelect={() => handleOfficerSelect(interviewer.id)} onAction={handleOpenInterviewerModal} onDelete={handleDeleteInterviewer} />
            ))}
          </div>
          <div className="flex items-center mb-4">
            <h3 className="text-2xl font-semibold text-gray-800">교수 (최대 2명 선택)</h3>
            {professorSelectionWarning && (
              <p className="ml-4 text-sm font-bold text-red-500 transition-opacity duration-300 ease-in-out">
                {professorSelectionWarning}
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allInterviewers.filter(i => i.role === '교수').map(interviewer => (
              <InterviewerCard key={interviewer.id} interviewer={interviewer} isSelected={selectedProfessors.includes(interviewer.id)} onSelect={() => handleProfessorSelect(interviewer.id)} onAction={handleOpenInterviewerModal} onDelete={handleDeleteInterviewer} />
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              <div className="p-6 border rounded-xl bg-white shadow-sm">
                <h3 className="font-bold text-lg flex items-center gap-2"><SlidersHorizontal size={20} className="text-blue-600"/>면접 프리셋</h3>
                <div className="flex items-center gap-2 rounded-lg p-1 bg-gray-100 mt-4">
                  <button onClick={() => handlePresetChange('beginner')} className={`flex-1 px-3 py-1 text-sm rounded-md transition-colors ${advancedSettings.preset === 'beginner' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}>초보자용</button>
                  <button onClick={() => handlePresetChange('standard')} className={`flex-1 px-3 py-1 text-sm rounded-md transition-colors ${advancedSettings.preset === 'standard' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}>표준</button>
                  <button onClick={() => handlePresetChange('advanced')} className={`flex-1 px-3 py-1 text-sm rounded-md transition-colors ${advancedSettings.preset === 'advanced' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}>고급</button>
                  <button onClick={() => handleAdvancedSettingChange('preset', 'custom')} className={`flex-1 px-3 py-1 text-sm rounded-md transition-colors ${advancedSettings.preset === 'custom' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}>커스텀</button>
                </div>
                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                  {advancedSettings.preset === 'beginner' && '면접이 처음이신 분들을 위한 설정입니다. 편안한 분위기에서 기본적인 질문들로 진행됩니다.'}
                  {advancedSettings.preset === 'standard' && '가장 일반적인 면접 환경을 시뮬레이션합니다. 적절한 심층 질문과 후속 질문이 포함됩니다.'}
                  {advancedSettings.preset === 'advanced' && '실제 면접과 유사한 높은 난이도의 설정입니다. 전문적이고 압박감이 있는 질문을 통해 실력을 점검합니다.'}
                  {advancedSettings.preset === 'custom' && '아래의 상세 설정을 자유롭게 변경하여 자신만의 면접 환경을 만들 수 있습니다.'}
                </div>
              </div>
              <div className="p-6 border rounded-xl bg-white shadow-sm">
                <h3 className="font-bold text-lg flex items-center gap-2"><BrainCircuit size={20} className="text-purple-600"/>질문 스타일 설정</h3>
                <div className="space-y-4 mt-4">
                  <div>
                    <SettingRadioGroup
                      label="질문 깊이"
                      value={advancedSettings.question_depth}
                      onChange={(e) => handleAdvancedSettingChange('question_depth', e.target.value)}
                      options={[
                        { value: 'surface', label: '표면적' },
                        { value: 'in-depth', label: '심화' },
                        { value: 'professional', label: '전문적' },
                      ]}
                    />
                    <p className="text-xs text-gray-500 mt-1 pl-2">
                      {advancedSettings.question_depth === 'surface' && '단답형으로 답할 수 있는 기본적인 질문을 합니다.'}
                      {advancedSettings.question_depth === 'in-depth' && '답변에 대한 구체적인 근거나 사례를 요구하는 질문을 합니다.'}
                      {advancedSettings.question_depth === 'professional' && '전공 분야에 대한 깊이 있는 이해와 통찰력을 요구하는 질문을 합니다.'}
                    </p>
                  </div>
                  <div>
                    <SettingCheckboxGroup
                      label="생성 질문 파트"
                      duration={duration}
                      value={advancedSettings.generated_question_parts}
                      onChange={handleQuestionPartChange}
                      options={[
                        { value: 'start', label: '시작' },
                        { value: 'record', label: '생기부' },
                        { value: 'end', label: '종료' },
                      ]}
                    />
                     <p className="text-xs text-gray-500 mt-1 pl-2">
                      면접 시간에 따라 선택 가능한 파트 수가 제한됩니다. (3분: 1개, 5분: 2개, 7분 이상: 3개)
                    </p>
                  </div>
                  <div>
                    <SettingToggle
                      label="후속 질문 허용"
                      checked={advancedSettings.allow_follow_up}
                      onChange={(e) => handleAdvancedSettingChange('allow_follow_up', e.target.checked)}
                    />
                    <p className="text-xs text-gray-500 mt-1 pl-2">답변 내용에 따라 추가적인 질문을 할지 여부를 결정합니다.</p>
                  </div>
                  {advancedSettings.allow_follow_up && (
                    <div>
                      <SettingSlider
                        label="최대 후속 질문 깊이"
                        value={advancedSettings.max_follow_up_depth}
                        onChange={(e) => handleAdvancedSettingChange('max_follow_up_depth', parseInt(e.target.value))}
                        min={1} max={5} step={1}
                        displayValue={`${advancedSettings.max_follow_up_depth}단계`}
                      />
                      <p className="text-xs text-gray-500 mt-1 pl-2">하나의 질문에서 파생되는 후속 질문의 최대 단계를 설정합니다.</p>
                    </div>
                  )}
                </div>
              </div>
               <div className="p-6 border rounded-xl bg-white shadow-sm">
                <h3 className="font-bold text-lg flex items-center gap-2"><Mic size={20} className="text-teal-600"/>면접 진행 방식</h3>
                <div className="space-y-4 mt-4">
                    <div>
                      <SettingToggle
                        label="면접관 상호작용 허용"
                        checked={advancedSettings.interviewer_interaction}
                        onChange={(e) => handleAdvancedSettingChange('interviewer_interaction', e.target.checked)}
                      />
                      <p className="text-xs text-gray-500 mt-1 pl-2">여러 면접관이 대화하듯 자연스럽게 질문을 주고받을 수 있습니다.</p>
                    </div>
                    <div>
                      <SettingRadioGroup
                        label="질문 순서"
                        value={advancedSettings.question_order}
                        onChange={(e) => handleAdvancedSettingChange('question_order', e.target.value)}
                        options={[
                          { value: 'sequential', label: '순차적' },
                          { value: 'adaptive', label: '적응형' },
                        ]}
                      />
                      <p className="text-xs text-gray-500 mt-1 pl-2">
                        {advancedSettings.question_order === 'sequential' && '미리 정해진 순서에 따라 질문합니다.'}
                        {advancedSettings.question_order === 'adaptive' && '답변 내용과 수준에 맞춰 다음 질문의 난이도와 유형을 조절합니다.'}
                      </p>
                    </div>
                  </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-1 space-y-6">
              <div className="p-6 border rounded-xl bg-white shadow-sm">
                <h3 className="font-bold text-lg flex items-center gap-2"><Clock size={20} className="text-blue-600"/>면접 시간 설정</h3>
                <p className="text-sm text-gray-500 mb-4">면접 진행 시간을 선택하세요.</p>
                <select value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full p-3 border rounded-lg">
                  {DURATION_OPTIONS.map(time => <option key={time} value={time}>{time}분</option>)}
                </select>
              </div>
              <div className="p-6 border rounded-xl bg-white shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-lg flex items-center gap-2"><BarChart3 size={20} className="text-green-600"/>평가 요소</h3>
                  <button onClick={() => handleOpenFactorModal('create', null)} className="px-3 py-1.5 text-sm bg-gray-100 rounded-md flex items-center gap-1 hover:bg-gray-200"><Plus size={16}/>요소 추가</button>
                </div>
                <p className="text-sm text-gray-500 mb-4">총합 100%가 되도록 비율을 설정하세요.</p>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {evaluationFactors.map(factor => (
                    <EvaluationFactorItem 
                      key={factor.id}
                      factor={factor}
                      onToggle={handleFactorToggle}
                      onWeightChange={handleWeightChange}
                      onViewDetails={() => handleOpenFactorModal('view', factor)}
                      onEdit={() => handleOpenFactorModal('edit', factor)}
                      onDelete={handleDeleteFactor}
                    />
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span>총 비율:</span>
                    <span className={getTotalWeight() === 100 ? 'text-green-600' : 'text-red-500'}>{getTotalWeight()}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
             <div className="p-6 border rounded-xl bg-white shadow-sm">
                <h3 className="font-bold text-lg flex items-center gap-2"><Smile size={20} className="text-yellow-600"/>면접 분위기</h3>
                <div className="space-y-4 mt-4">
                    <div>
                      <SettingRadioGroup
                        label="압박 수준"
                        value={advancedSettings.pressure_level}
                        onChange={(e) => handleAdvancedSettingChange('pressure_level', e.target.value)}
                        options={[
                          { value: 'comfortable', label: '편안함' },
                          { value: 'standard', label: '적당함' },
                          { value: 'tense', label: '긴장감' },
                        ]}
                      />
                      <p className="text-xs text-gray-500 mt-1 pl-2">
                        {advancedSettings.pressure_level === 'comfortable' && '응시자가 편안함을 느끼도록 긍정적인 분위기를 조성합니다.'}
                        {advancedSettings.pressure_level === 'standard' && '일반적인 면접과 같이 적당한 긴장감을 유지합니다.'}
                        {advancedSettings.pressure_level === 'tense' && '답변하기 어려운 질문이나 반박을 통해 스트레스 상황 대처 능력을 평가합니다.'}
                      </p>
                    </div>
                    <div>
                      <SettingRadioGroup
                        label="격려 빈도"
                        value={advancedSettings.encouragement_frequency}
                        onChange={(e) => handleAdvancedSettingChange('encouragement_frequency', e.target.value)}
                        options={[
                          { value: 'frequent', label: '자주' },
                          { value: 'standard', label: '보통' },
                          { value: 'rare', label: '드물게' },
                        ]}
                      />
                      <p className="text-xs text-gray-500 mt-1 pl-2">
                        {advancedSettings.encouragement_frequency === 'frequent' && '답변에 대해 자주 긍정적인 피드백을 주며 자신감을 북돋아줍니다.'}
                        {advancedSettings.encouragement_frequency === 'standard' && '필요할 때 적절한 격려와 반응을 보여줍니다.'}
                        {advancedSettings.encouragement_frequency === 'rare' && '특별한 칭찬이나 격려 없이 중립적인 태도를 유지합니다.'}
                      </p>
                    </div>
                  </div>
              </div>
              <div className="p-6 border rounded-xl bg-white shadow-sm">
                <h3 className="font-bold text-lg flex items-center gap-2"><FileText size={20} className="text-indigo-600"/>면접 컨텍스트</h3>
                <div className="space-y-4 mt-4">
                    <div>
                      <SettingSlider
                        label="전공 질문 비율"
                        value={advancedSettings.major_question_ratio}
                        onChange={(e) => handleAdvancedSettingChange('major_question_ratio', parseInt(e.target.value))}
                        min={0} max={100} step={10}
                        displayValue={`${advancedSettings.major_question_ratio}%`}
                      />
                      <p className="text-xs text-gray-500 mt-1 pl-2">전체 질문 중 전공 관련 지식을 묻는 질문의 비율을 설정합니다.</p>
                    </div>
                    <div>
                      <SettingSlider
                        label="개인 경험 질문 비율"
                        value={advancedSettings.personal_experience_ratio}
                        onChange={(e) => handleAdvancedSettingChange('personal_experience_ratio', parseInt(e.target.value))}
                        min={0} max={100} step={10}
                        displayValue={`${advancedSettings.personal_experience_ratio}%`}
                      />
                      <p className="text-xs text-gray-500 mt-1 pl-2">생활기록부 기반 활동이나 경험에 대한 질문의 비율을 설정합니다.</p>
                    </div>
                    <div>
                      <SettingToggle
                        label="시사/상식 질문 포함"
                        checked={advancedSettings.include_current_events}
                        onChange={(e) => handleAdvancedSettingChange('include_current_events', e.target.checked)}
                      />
                      <p className="text-xs text-gray-500 mt-1 pl-2">최근 사회적 이슈나 기본적인 상식에 대한 질문을 포함할지 여부를 결정합니다.</p>
                    </div>
                  </div>
              </div>
              <div className="p-6 border rounded-xl bg-white shadow-sm">
                <h3 className="font-bold text-lg flex items-center gap-2"><Video size={20} className="text-red-600"/>면접 기록 및 분석</h3>
                <div className="space-y-4 mt-4">
                    <div>
                      <SettingToggle
                        label="면접 과정 상세 기록"
                        checked={advancedSettings.detailed_recording}
                        onChange={(e) => handleAdvancedSettingChange('detailed_recording', e.target.checked)}
                      />
                      <p className="text-xs text-gray-500 mt-1 pl-2">질문, 답변, 면접관의 반응 등 모든 과정을 텍스트로 기록합니다.</p>
                    </div>
                    <div>
                      <SettingToggle
                        label="답변 분석 및 개선점 제시"
                        checked={advancedSettings.answer_analysis}
                        onChange={(e) => handleAdvancedSettingChange('answer_analysis', e.target.checked)}
                      />
                      <p className="text-xs text-gray-500 mt-1 pl-2">각 답변의 논리성, 표현력 등을 분석하고 구체적인 개선 방향을 제안합니다.</p>
                    </div>
                    <div>
                      <SettingToggle
                        label="면접 후 상세 리포트 생성"
                        checked={advancedSettings.generate_report}
                        onChange={(e) => handleAdvancedSettingChange('generate_report', e.target.checked)}
                      />
                      <p className="text-xs text-gray-500 mt-1 pl-2">종합 평가, 강점/약점 분석, 예상 점수 등을 포함한 리포트를 생성합니다.</p>
                    </div>
                  </div>
              </div>
          </div>
        </div>
      )}

      <div className="mt-12 flex justify-between">
        <button onClick={() => step === 1 ? navigate('/') : setStep(1)} className="px-6 py-3 bg-gray-200 rounded-lg font-semibold flex items-center gap-2 hover:bg-gray-300"><ArrowLeft size={20}/> 이전</button>
        {step === 1 ? (
          <button onClick={() => setStep(2)} disabled={!selectedOfficer || selectedProfessors.length === 0} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold disabled:bg-gray-400 flex items-center gap-2 hover:bg-blue-700">다음 설정 <ChevronRight size={20}/></button>
        ) : (
          <button onClick={handleStartInterview} disabled={saving || getTotalWeight() !== 100} className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold disabled:bg-gray-400 flex items-center gap-2 hover:bg-green-700">
            {saving ? <Loader2 className="animate-spin" /> : '면접 시작하기'}
          </button>
        )}
      </div>

      {interviewerModal.isOpen && <InterviewerModal modalState={interviewerModal} onClose={handleCloseInterviewerModal} formData={interviewerFormData} setFormData={setInterviewerFormData} onSave={handleSaveInterviewer} />}
      {factorModal.isOpen && <FactorDetailModal modalState={factorModal} onClose={() => setFactorModal({isOpen: false, mode: 'view', data: null})} onSave={handleSaveFactor} />}
    </div>
  );
}

// --- 하위 컴포넌트들 ---

const SettingCheckboxGroup = ({ label, duration, value, onChange, options }) => {
  let maxParts = 3;
  if (duration === 3) maxParts = 1;
  else if (duration === 5) maxParts = 2;
  
  const isDisabled = (part: QuestionPart) => {
    return value.length >= maxParts && !value.includes(part);
  };

  return (
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-2 rounded-lg p-1 bg-gray-100">
        {options.map(option => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            disabled={isDisabled(option.value)}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${value.includes(option.value) ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-200'} ${isDisabled(option.value) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const SettingRadioGroup = ({ label, value, onChange, options }) => (
  <div className="flex items-center justify-between">
    <label className="text-sm font-medium text-gray-700">{label}</label>
    <div className="flex items-center gap-2 rounded-lg p-1 bg-gray-100">
      {options.map(option => (
        <button
          key={option.value}
          onClick={() => onChange({ target: { value: option.value } })}
          className={`px-3 py-1 text-sm rounded-md transition-colors ${value === option.value ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  </div>
);

const SettingToggle = ({ label, checked, onChange }) => (
  <div className="flex items-center justify-between">
    <label className="text-sm font-medium text-gray-700">{label}</label>
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
    </label>
  </div>
);

const SettingSlider = ({ label, value, onChange, min, max, step, displayValue }) => (
  <div className="flex items-center justify-between">
    <label className="text-sm font-medium text-gray-700">{label}</label>
    <div className="flex items-center gap-3 w-1/2">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
      <span className="text-sm font-semibold text-blue-600 w-12 text-center">{displayValue}</span>
    </div>
  </div>
);


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

const InterviewerModal = ({ modalState, onClose, formData, setFormData, onSave }: {
  modalState: InterviewerModalState,
  onClose: () => void,
  formData: Partial<Interviewer>,
  setFormData: React.Dispatch<React.SetStateAction<Partial<Interviewer>>>,
  onSave: () => void
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold">
          {modalState.mode === 'view' && '면접관 정보'}
          {modalState.mode === 'create' && '새 면접관 추가'}
          {modalState.mode === 'edit' && '면접관 수정'}
        </h3>
        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"><X size={24} /></button>
      </div>
      <div className="space-y-4">
        <input type="text" placeholder="이름" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 border rounded-lg" disabled={modalState.mode === 'view'} />
        <select value={formData.role || '교수'} onChange={e => setFormData({...formData, role: e.target.value as InterviewerRole})} className="w-full p-3 border rounded-lg" disabled={modalState.mode === 'view'}>
          <option value="교수">교수</option>
          <option value="입학사정관">입학사정관</option>
        </select>
        <input type="text" placeholder="성격 (예: 친근함, 압박)" value={formData.personality || ''} onChange={e => setFormData({...formData, personality: e.target.value})} className="w-full p-3 border rounded-lg" disabled={modalState.mode === 'view'} />
        {formData.role === '교수' && <input type="text" placeholder="전공" value={formData.major || ''} onChange={e => setFormData({...formData, major: e.target.value})} className="w-full p-3 border rounded-lg" disabled={modalState.mode === 'view'} />}
        <textarea placeholder="설명" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-3 border rounded-lg" rows={3} disabled={modalState.mode === 'view'}/>
      </div>
      <div className="mt-8 flex justify-end gap-4">
        <button onClick={onClose} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold">
          {modalState.mode === 'view' ? '닫기' : '취소'}
        </button>
        {modalState.mode !== 'view' && (
          <button onClick={onSave} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-2">
            <Save size={18} /> 저장
          </button>
        )}
      </div>
    </div>
  </div>
);

const EvaluationFactorItem = ({ factor, onToggle, onWeightChange, onViewDetails, onEdit, onDelete }: {
  factor: EvaluationFactor,
  onToggle: (id: string) => void,
  onWeightChange: (id: string, weight: number) => void,
  onViewDetails: () => void,
  onEdit: () => void,
  onDelete: (id: string) => void
}) => (
  <div className="border rounded-lg p-4 transition-all bg-white">
    <div className="flex items-start justify-between">
      <div className="flex items-start space-x-3 flex-1">
        <input type="checkbox" checked={factor.selected} onChange={() => onToggle(factor.id)} className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <label className="font-bold text-gray-800">{factor.name}</label>
            {!factor.isDefault && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">사용자 생성</span>}
          </div>
          <p className="text-sm text-gray-500">{factor.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {factor.selected && <span className="font-bold text-blue-600">{factor.weight}%</span>}
        <button onClick={onViewDetails} className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full"><Info size={16}/></button>
        {!factor.isDefault && (
          <>
            <button onClick={onEdit} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-full"><Edit size={16}/></button>
            <button onClick={() => onDelete(factor.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full"><Trash2 size={16}/></button>
          </>
        )}
      </div>
    </div>
    {factor.selected && (
      <div className="mt-3 flex items-center gap-3">
        <input type="range" min="0" max="100" step="5" value={factor.weight} onChange={e => onWeightChange(factor.id, Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
      </div>
    )}
  </div>
);

const FactorDetailModal = ({ modalState, onClose, onSave }: {
  modalState: FactorModalState,
  onClose: () => void,
  onSave: (factor: EvaluationFactor) => void
}) => {
  const isEditable = modalState.mode !== 'view' && !modalState.data?.isDefault;
  const [factor, setFactor] = useState<EvaluationFactor>(
    modalState.data || { id: uuidv4(), name: '', description: '', weight: 0, selected: true, isDefault: false, criteria: [{id: uuidv4(), min: 0, max: 100, description: ''}] }
  );

  const handleCriteriaChange = (id: string, field: keyof ScoreRange, value: string | number) => {
    setFactor(prev => ({
      ...prev,
      criteria: prev.criteria.map(c => c.id === id ? { ...c, [field]: value } : c)
    }));
  };

  const addCriteria = () => {
    setFactor(prev => ({ ...prev, criteria: [...prev.criteria, { id: uuidv4(), min: 0, max: 0, description: '' }] }));
  };

  const removeCriteria = (id: string) => {
    setFactor(prev => ({ ...prev, criteria: prev.criteria.filter(c => c.id !== id) }));
  };

  const validateAndSave = () => {
    // TODO: Add validation for score ranges (0-100, no gaps, no overlaps)
    onSave(factor);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold">
            {modalState.mode === 'create' && '새 평가 요소 생성'}
            {modalState.mode === 'edit' && '평가 요소 편집'}
            {modalState.mode === 'view' && '평가 요소 상세'}
          </h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"><X size={24} /></button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="font-semibold">요소 이름</label>
            <input type="text" value={factor.name} onChange={e => setFactor(f => ({...f, name: e.target.value}))} disabled={!isEditable} className="w-full p-2 border rounded-md mt-1 bg-gray-50 disabled:bg-gray-200" />
          </div>
          <div>
            <label className="font-semibold">한 줄 설명</label>
            <input type="text" value={factor.description} onChange={e => setFactor(f => ({...f, description: e.target.value}))} disabled={!isEditable} className="w-full p-2 border rounded-md mt-1 bg-gray-50 disabled:bg-gray-200" />
          </div>
        </div>

        <div className="mt-6 pt-4 border-t">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-lg font-bold">채점 기준 (점수 범위)</h4>
            {isEditable && <button onClick={addCriteria} className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-md flex items-center gap-1 hover:bg-blue-200"><Plus size={16}/>범위 추가</button>}
          </div>
          <div className="space-y-3">
            {factor.criteria.sort((a, b) => b.max - a.max).map(c => (
              <div key={c.id} className="flex items-start gap-2">
                <div className="flex items-center gap-1">
                  <input type="number" value={c.min} onChange={e => handleCriteriaChange(c.id, 'min', Number(e.target.value))} disabled={!isEditable} className="w-16 p-2 border rounded-md disabled:bg-gray-200" />
                  <span>~</span>
                  <input type="number" value={c.max} onChange={e => handleCriteriaChange(c.id, 'max', Number(e.target.value))} disabled={!isEditable} className="w-16 p-2 border rounded-md disabled:bg-gray-200" />
                </div>
                <textarea value={c.description} onChange={e => handleCriteriaChange(c.id, 'description', e.target.value)} disabled={!isEditable} rows={2} className="flex-1 p-2 border rounded-md disabled:bg-gray-200" />
                {isEditable && <button onClick={() => removeCriteria(c.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-full mt-1"><Trash2 size={18}/></button>}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-4">
          <button onClick={onClose} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold">
            {isEditable ? '취소' : '닫기'}
          </button>
          {isEditable && (
            <button onClick={validateAndSave} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-2">
              <Save size={18} /> 저장
            </button>
          )}
        </div>
      </div>
    </div>
  );
};