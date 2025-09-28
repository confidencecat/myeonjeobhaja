import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import { Users, CheckCircle, ArrowRight, ArrowLeft, Plus, MoreVertical, Edit, Trash2, User, GraduationCap } from 'lucide-react';
import { Interviewer } from '@/types/interview';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { interviewerService } from '@/services/database';

// Mock 기본 면접관 데이터
const defaultInterviewers: Interviewer[] = [
  // 입학사정관
  {
    id: '1',
    name: '김미영',
    role: '입학사정관',
    personality: '친근하고 격려하는',
    description: '15년 경력의 입학사정관으로 학생들의 잠재력을 발견하는 데 전문성을 가지고 있습니다.',
    system_prompt: '',
    created_at: '',
    updated_at: ''
  },
  {
    id: '2',
    name: '박준호',
    role: '입학사정관',
    personality: '체계적이고 분석적인',
    description: '논리적 사고와 체계적인 질문으로 학생의 역량을 정확히 평가합니다.',
    system_prompt: '',
    created_at: '',
    updated_at: ''
  },
  {
    id: '3',
    name: '이수진',
    role: '입학사정관',
    personality: '따뜻하고 공감하는',
    description: '학생의 입장에서 이해하고 공감하며 편안한 면접 분위기를 만듭니다.',
    system_prompt: '',
    created_at: '',
    updated_at: ''
  },
  // 교수진
  {
    id: '4',
    name: '최영수',
    role: '교수',
    personality: '엄격하고 전문적인',
    description: '컴퓨터공학과 교수로 기술적 역량과 논리적 사고를 중시합니다.',
    system_prompt: '',
    major: '컴퓨터공학과',
    created_at: '',
    updated_at: ''
  },
  {
    id: '5',
    name: '한지민',
    role: '교수',
    personality: '창의적이고 개방적인',
    description: '경영학과 교수로 창의적 사고와 리더십 역량을 평가합니다.',
    system_prompt: '',
    major: '경영학과',
    created_at: '',
    updated_at: ''
  },
  {
    id: '6',
    name: '정현우',
    role: '교수',
    personality: '꼼꼼하고 세심한',
    description: '기계공학과 교수로 문제해결 능력과 실무 적용력을 중요시합니다.',
    system_prompt: '',
    major: '기계공학과',
    created_at: '',
    updated_at: ''
  },
  {
    id: '7',
    name: '송민아',
    role: '교수',
    personality: '친근하고 격려하는',
    description: '심리학과 교수로 학생의 내면과 성장 가능성을 깊이 있게 탐구합니다.',
    system_prompt: '',
    major: '심리학과',
    created_at: '',
    updated_at: ''
  },
  {
    id: '8',
    name: '윤태호',
    role: '교수',
    personality: '논리적이고 체계적인',
    description: '수학과 교수로 논리적 사고와 문제 분석 능력을 중점적으로 평가합니다.',
    system_prompt: '',
    major: '수학과',
    created_at: '',
    updated_at: ''
  }
];

export const InterviewerSelection: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [allInterviewers, setAllInterviewers] = useState<Interviewer[]>([]);
  const [selectedAdmissionOfficer, setSelectedAdmissionOfficer] = useState<string | null>(null);
  const [selectedProfessors, setSelectedProfessors] = useState<string[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingInterviewer, setEditingInterviewer] = useState<Interviewer | null>(null);

  const [newInterviewer, setNewInterviewer] = useState({
    name: '',
    role: '입학사정관' as '입학사정관' | '교수',
    personality: '',
    description: '',
    major: '',
    interview_style: '',
    profile_image: ''
  });

  // 면접관 데이터 로드
  useEffect(() => {
    const loadInterviewers = async () => {
      if (!user?.id) return;

      try {
        const customInterviewers = await interviewerService.getAll(user.id);
        setAllInterviewers([...defaultInterviewers, ...customInterviewers]);
      } catch (error) {
        console.error('면접관 로드 오류:', error);
        setAllInterviewers(defaultInterviewers);
      }
    };

    loadInterviewers();
  }, [user]);

  const admissionOfficers = allInterviewers.filter(interviewer => interviewer.role === '입학사정관');
  const professors = allInterviewers.filter(interviewer => interviewer.role === '교수');

  const handleAdmissionOfficerSelect = (id: string) => {
    setSelectedAdmissionOfficer(id);
  };

  const handleProfessorSelect = (id: string) => {
    if (selectedProfessors.includes(id)) {
      setSelectedProfessors(prev => prev.filter(profId => profId !== id));
    } else if (selectedProfessors.length < 2) {
      setSelectedProfessors(prev => [...prev, id]);
    } else {
      toast({
        title: "선택 제한",
        description: "최대 2명의 교수만 선택할 수 있습니다.",
        variant: "destructive"
      });
    }
  };

  const handleCreateInterviewer = async () => {
    if (!user?.id || !newInterviewer.name || !newInterviewer.personality) {
      toast({
        title: "입력 오류",
        description: "이름과 성격을 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    if (newInterviewer.role === '교수' && !newInterviewer.major) {
      toast({
        title: "입력 오류",
        description: "교수의 전공을 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    try {
      const savedInterviewer = await interviewerService.save(user.id, {
        name: newInterviewer.name,
        role: newInterviewer.role,
        personality: newInterviewer.personality,
        description: newInterviewer.description,
        major: newInterviewer.role === '교수' ? newInterviewer.major : undefined,
        interview_style: newInterviewer.interview_style,
        profile_image: newInterviewer.profile_image,
        system_prompt: ''
      });

      setAllInterviewers(prev => [...prev, savedInterviewer]);
      
      setNewInterviewer({
        name: '',
        role: '입학사정관',
        personality: '',
        description: '',
        major: '',
        interview_style: '',
        profile_image: ''
      });
      
      setIsCreateDialogOpen(false);
      
      toast({
        title: "생성 완료",
        description: "새로운 면접관이 생성되었습니다.",
      });
    } catch (error) {
      console.error('면접관 생성 오류:', error);
      toast({
        title: "생성 오류",
        description: "면접관 생성 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  const handleEditInterviewer = async () => {
    if (!user?.id || !editingInterviewer) return;

    try {
      const updatedInterviewer = await interviewerService.update(user.id, editingInterviewer.id, {
        name: editingInterviewer.name,
        personality: editingInterviewer.personality,
        description: editingInterviewer.description,
        major: editingInterviewer.major,
        interview_style: editingInterviewer.interview_style,
        profile_image: editingInterviewer.profile_image
      });

      if (updatedInterviewer) {
        setAllInterviewers(prev => 
          prev.map(interviewer => 
            interviewer.id === editingInterviewer.id ? updatedInterviewer : interviewer
          )
        );
      }

      setEditingInterviewer(null);
      setIsEditDialogOpen(false);
      
      toast({
        title: "수정 완료",
        description: "면접관 정보가 수정되었습니다.",
      });
    } catch (error) {
      console.error('면접관 수정 오류:', error);
      toast({
        title: "수정 오류",
        description: "면접관 수정 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteInterviewer = async (interviewerId: string) => {
    if (!user?.id) return;

    try {
      await interviewerService.delete(user.id, interviewerId);
      
      setAllInterviewers(prev => prev.filter(interviewer => interviewer.id !== interviewerId));
      
      // 선택된 면접관이 삭제된 경우 선택 해제
      if (selectedAdmissionOfficer === interviewerId) {
        setSelectedAdmissionOfficer(null);
      }
      setSelectedProfessors(prev => prev.filter(id => id !== interviewerId));
      
      toast({
        title: "삭제 완료",
        description: "면접관이 삭제되었습니다.",
      });
    } catch (error) {
      console.error('면접관 삭제 오류:', error);
      toast({
        title: "삭제 오류",
        description: "면접관 삭제 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (interviewer: Interviewer) => {
    setEditingInterviewer(interviewer);
    setIsEditDialogOpen(true);
  };

  const goToInterviewSettings = () => {
    if (!selectedAdmissionOfficer) {
      toast({
        title: "선택 필요",
        description: "입학사정관을 1명 선택해주세요.",
        variant: "destructive"
      });
      return;
    }

    if (selectedProfessors.length !== 2) {
      toast({
        title: "선택 필요",
        description: "교수를 정확히 2명 선택해주세요.",
        variant: "destructive"
      });
      return;
    }

    // 선택된 면접관 정보 저장
    const selectedInterviewers = [selectedAdmissionOfficer, ...selectedProfessors];
    localStorage.setItem('selected_interviewers', JSON.stringify(selectedInterviewers));

    toast({
      title: "선택 완료",
      description: "면접관이 성공적으로 선택되었습니다.",
    });

    navigate('/interview/settings');
  };

  const goBack = () => {
    navigate('/setup');
  };

  const InterviewerCard: React.FC<{ 
    interviewer: Interviewer; 
    isSelected: boolean; 
    onClick: () => void;
  }> = ({ interviewer, isSelected, onClick }) => (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                {interviewer.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{interviewer.name}</CardTitle>
                {interviewer.is_custom && (
                  <Badge variant="secondary" className="text-xs">커스텀</Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={interviewer.role === '입학사정관' ? 'default' : 'secondary'}>
                  {interviewer.role === '입학사정관' ? (
                    <User className="h-3 w-3 mr-1" />
                  ) : (
                    <GraduationCap className="h-3 w-3 mr-1" />
                  )}
                  {interviewer.role}
                </Badge>
                {interviewer.major && (
                  <Badge variant="outline" className="text-xs">
                    {interviewer.major}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isSelected && (
              <CheckCircle className="h-6 w-6 text-blue-600" />
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  openEditDialog(interviewer);
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  편집
                </DropdownMenuItem>
                {interviewer.is_custom && (
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteInterviewer(interviewer.id);
                    }}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    삭제
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">성향:</span>
            <Badge variant="outline" className="text-xs">
              {interviewer.personality}
            </Badge>
          </div>
          <CardDescription className="text-sm leading-relaxed">
            {interviewer.description}
          </CardDescription>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">면접관 선택</h1>
            <p className="text-gray-600">
              면접을 진행할 입학사정관 1명과 교수 2명을 선택해주세요.
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            면접관 생성
          </Button>
        </div>
      </div>

      {/* 선택 현황 */}
      <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Users className="h-5 w-5" />
            선택 현황
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <span className="font-medium">입학사정관</span>
              <Badge variant={selectedAdmissionOfficer ? 'default' : 'outline'}>
                {selectedAdmissionOfficer ? '1명 선택됨' : '0/1명'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <span className="font-medium">교수</span>
              <Badge variant={selectedProfessors.length === 2 ? 'default' : 'outline'}>
                {selectedProfessors.length}/2명
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 입학사정관 선택 */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          입학사정관 선택 (1명 필수)
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {admissionOfficers.map(interviewer => (
            <InterviewerCard
              key={interviewer.id}
              interviewer={interviewer}
              isSelected={selectedAdmissionOfficer === interviewer.id}
              onClick={() => handleAdmissionOfficerSelect(interviewer.id)}
            />
          ))}
        </div>
      </div>

      {/* 교수 선택 */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          교수 선택 (2명 필수)
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {professors.map(interviewer => (
            <InterviewerCard
              key={interviewer.id}
              interviewer={interviewer}
              isSelected={selectedProfessors.includes(interviewer.id)}
              onClick={() => handleProfessorSelect(interviewer.id)}
            />
          ))}
        </div>
      </div>

      {/* 네비게이션 버튼 */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={goBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          이전으로
        </Button>
        <Button 
          onClick={goToInterviewSettings}
          className="bg-blue-600 hover:bg-blue-700"
          disabled={!selectedAdmissionOfficer || selectedProfessors.length !== 2}
        >
          면접 설정하기
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* 면접관 생성 다이얼로그 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>새 면접관 생성</DialogTitle>
            <DialogDescription>
              새로운 면접관을 생성하여 면접에 활용하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">이름 *</Label>
                <Input
                  id="name"
                  value={newInterviewer.name}
                  onChange={(e) => setNewInterviewer(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="면접관 이름"
                />
              </div>
              <div>
                <Label htmlFor="role">역할 *</Label>
                <Select 
                  value={newInterviewer.role} 
                  onValueChange={(value: '입학사정관' | '교수') => setNewInterviewer(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="입학사정관">입학사정관</SelectItem>
                    <SelectItem value="교수">교수</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="personality">성격/특징 *</Label>
              <Input
                id="personality"
                value={newInterviewer.personality}
                onChange={(e) => setNewInterviewer(prev => ({ ...prev, personality: e.target.value }))}
                placeholder="예: 친근하고 격려하는, 엄격하고 전문적인"
              />
            </div>

            {newInterviewer.role === '교수' && (
              <div>
                <Label htmlFor="major">전공 *</Label>
                <Input
                  id="major"
                  value={newInterviewer.major}
                  onChange={(e) => setNewInterviewer(prev => ({ ...prev, major: e.target.value }))}
                  placeholder="예: 컴퓨터공학과, 경영학과"
                />
              </div>
            )}

            <div>
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                value={newInterviewer.description}
                onChange={(e) => setNewInterviewer(prev => ({ ...prev, description: e.target.value }))}
                placeholder="면접관의 특징이나 배경을 설명해주세요"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="interview_style">면접 스타일</Label>
              <Input
                id="interview_style"
                value={newInterviewer.interview_style}
                onChange={(e) => setNewInterviewer(prev => ({ ...prev, interview_style: e.target.value }))}
                placeholder="예: 논리적 사고를 중시하는 스타일"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleCreateInterviewer}>
              생성하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 면접관 편집 다이얼로그 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>면접관 편집</DialogTitle>
            <DialogDescription>
              면접관의 정보를 수정하세요.
            </DialogDescription>
          </DialogHeader>
          {editingInterviewer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_name">이름 *</Label>
                  <Input
                    id="edit_name"
                    value={editingInterviewer.name}
                    onChange={(e) => setEditingInterviewer(prev => prev ? { ...prev, name: e.target.value } : null)}
                  />
                </div>
                <div>
                  <Label>역할</Label>
                  <Input value={editingInterviewer.role} disabled />
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit_personality">성격/특징 *</Label>
                <Input
                  id="edit_personality"
                  value={editingInterviewer.personality}
                  onChange={(e) => setEditingInterviewer(prev => prev ? { ...prev, personality: e.target.value } : null)}
                  placeholder="예: 친근하고 격려하는, 엄격하고 전문적인"
                />
              </div>

              {editingInterviewer.role === '교수' && (
                <div>
                  <Label htmlFor="edit_major">전공</Label>
                  <Input
                    id="edit_major"
                    value={editingInterviewer.major || ''}
                    onChange={(e) => setEditingInterviewer(prev => prev ? { ...prev, major: e.target.value } : null)}
                    placeholder="예: 컴퓨터공학과, 경영학과"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="edit_description">설명</Label>
                <Textarea
                  id="edit_description"
                  value={editingInterviewer.description}
                  onChange={(e) => setEditingInterviewer(prev => prev ? { ...prev, description: e.target.value } : null)}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="edit_interview_style">면접 스타일</Label>
                <Input
                  id="edit_interview_style"
                  value={editingInterviewer.interview_style || ''}
                  onChange={(e) => setEditingInterviewer(prev => prev ? { ...prev, interview_style: e.target.value } : null)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleEditInterviewer}>
              수정하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};