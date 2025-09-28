import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { User, BookCopy, PlusCircle, Trash2, Edit, Save, XCircle, ArrowRight } from 'lucide-react';

// 타입 정의
type SchoolRecord = {
  id: string;
  activity_type: string;
  subject_name?: string;
  grade: string;
  semester: string;
  details: string;
};

const ACTIVITY_TYPES = [
  '교과 세부능력 및 특기사항',
  '진로',
  '개인별 교과',
  '동아리',
  '행동특성 및 종합의견',
];
const GRADES = ['1학년', '2학년', '3학년'];
const SEMESTERS = ['1학기', '2학기', '학년 전체'];

export default function ProfileSetupPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [desiredMajor, setDesiredMajor] = useState('');
  const [schoolRecords, setSchoolRecords] = useState<SchoolRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 생기부 입력 폼 상태
  const [activityType, setActivityType] = useState(ACTIVITY_TYPES[0]);
  const [subjectName, setSubjectName] = useState('');
  const [grade, setGrade] = useState(GRADES[0]);
  const [semester, setSemester] = useState(SEMESTERS[0]);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 데이터 로딩
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      setError('');

      try {
        // 프로필 정보 로딩
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('name, desired_major')
          .eq('user_id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') throw profileError;
        if (profileData) {
          setName(profileData.name || '');
          setDesiredMajor(profileData.desired_major || '');
        }

        // 생기부 정보 로딩
        const { data: recordsData, error: recordsError } = await supabase
          .from('school_records')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (recordsError) throw recordsError;
        setSchoolRecords(recordsData || []);

      } catch (err: any) {
        setError('데이터를 불러오는 중 오류가 발생했습니다: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // 개인 정보 저장
  const handleProfileSave = async () => {
    if (!user) return;
    setIsSubmitting(true);
    const { error } = await supabase
      .from('user_profiles')
      .update({ name, desired_major: desiredMajor })
      .eq('user_id', user.id);
    
    if (error) setError('프로필 저장에 실패했습니다.');
    else alert('프로필이 저장되었습니다.');
    setIsSubmitting(false);
  };

  // 생기부 활동 추가
  const handleAddActivity = async () => {
    if (!user || !details.trim()) {
      setError('세부 내용을 입력해주세요.');
      return;
    }
    setIsSubmitting(true);
    setError('');

    const newRecord = {
      user_id: user.id,
      activity_type: activityType,
      subject_name: activityType === '교과 세부능력 및 특기사항' ? subjectName : null,
      grade,
      semester,
      details,
    };

    const { data, error } = await supabase
      .from('school_records')
      .insert(newRecord)
      .select()
      .single();

    if (error) {
      setError('활동 추가에 실패했습니다: ' + error.message);
    } else if (data) {
      setSchoolRecords([data, ...schoolRecords]);
      // 폼 초기화
      setActivityType(ACTIVITY_TYPES[0]);
      setSubjectName('');
      setGrade(GRADES[0]);
      setSemester(SEMESTERS[0]);
      setDetails('');
    }
    setIsSubmitting(false);
  };
  
  // 생기부 활동 삭제
  const handleDeleteActivity = async (id: string) => {
    if (!confirm('정말로 이 활동을 삭제하시겠습니까?')) return;

    const { error } = await supabase.from('school_records').delete().eq('id', id);
    if (error) {
      setError('활동 삭제에 실패했습니다.');
    } else {
      setSchoolRecords(schoolRecords.filter(rec => rec.id !== id));
    }
  };

  if (loading) {
    return <div className="container mx-auto p-8">로딩 중...</div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-8 relative pb-24">
      <h1 className="text-3xl font-bold mb-8">프로필 설정</h1>
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
      
      {/* 개인 정보 섹션 */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2"><User /> 개인 정보</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">이름</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">희망 전공</label>
            <input type="text" value={desiredMajor} onChange={(e) => setDesiredMajor(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>
        <button onClick={handleProfileSave} disabled={isSubmitting} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 flex items-center gap-2">
          <Save size={18} /> {isSubmitting ? '저장 중...' : '개인 정보 저장'}
        </button>
      </div>

      {/* 생기부 활동 추가 섹션 */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2"><BookCopy /> 생기부 활동 추가</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">활동 유형</label>
            <select value={activityType} onChange={(e) => setActivityType(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              {ACTIVITY_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          {activityType === '교과 세부능력 및 특기사항' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">교과명</label>
              <input type="text" value={subjectName} onChange={(e) => setSubjectName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">학년</label>
            <select value={grade} onChange={(e) => setGrade(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">학기</label>
            <select value={semester} onChange={(e) => setSemester(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">세부 내용</label>
          <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={5} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="여기에 활동 내용을 입력하세요..."></textarea>
        </div>
        <button onClick={handleAddActivity} disabled={isSubmitting} className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300 flex items-center gap-2">
          <PlusCircle size={18} /> {isSubmitting ? '추가 중...' : '활동 추가하기'}
        </button>
      </div>

      {/* 생기부 활동 목록 */}
      <div>
        <h2 className="text-2xl font-semibold mb-2">저장된 활동 목록</h2>
        <p className="text-sm text-gray-600 mb-4">다음 설정을 진행하려면 최소 1개 이상의 활동을 추가해야 합니다.</p>
        <div className="space-y-4">
          {schoolRecords.length > 0 ? (
            schoolRecords.map(record => (
              <div key={record.id} className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-lg">{record.activity_type}</p>
                    <p className="text-sm text-gray-600">
                      {record.grade} / {record.semester}
                      {record.subject_name && ` / ${record.subject_name}`}
                    </p>
                    <p className="mt-2 text-gray-800 whitespace-pre-wrap">{record.details}</p>
                  </div>
                  <button onClick={() => handleDeleteActivity(record.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-full">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">아직 추가된 활동이 없습니다.</p>
          )}
        </div>
      </div>

      {/* 다음 설정 버튼 */}
      <div className="fixed bottom-8 right-8">
        <button 
          onClick={() => navigate('/setup')}
          disabled={schoolRecords.length < 1}
          className="px-6 py-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-transform hover:scale-105 flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none"
        >
          다음 설정 <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
