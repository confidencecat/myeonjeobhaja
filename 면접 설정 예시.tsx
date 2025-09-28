import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Settings, Clock, Target, BarChart3, ArrowRight, ArrowLeft, Loader2, MoreVertical, Plus, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { evaluationCriteriaService } from '@/services/database';
import { CustomEvaluationCriteria } from '@/types/interview';

interface EvaluationCriteria {
  id: string;
  name: string;
  description: string;
  evaluation_method: string;
  portfolio_evaluation: string;
  interview_evaluation: string;
  weight: number;
  selected: boolean;
  is_custom?: boolean;
}

interface InterviewSettings {
  duration: number;
  evaluationCriteria: EvaluationCriteria[];
  focusAreas: string[];
  difficulty: '쉬움' | '보통' | '어려움';
  questionStyle: '밝은 격려형' | '밝은 친근형' | '어두운 압박형' | '어두운 분석형';
}

export const InterviewSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState<EvaluationCriteria | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [newCriteria, setNewCriteria] = useState({
    name: '',
    description: '',
    evaluation_method: '',
    portfolio_evaluation: '',
    interview_evaluation: ''
  });

  const [settings, setSettings] = useState<InterviewSettings>({
    duration: 10,
    evaluationCriteria: [
      { 
        id: 'academic', 
        name: '학업 역량', 
        description: '학습 능력과 학업 성취도',
        evaluation_method: '교과 성적, 학습 태도, 지적 호기심을 종합적으로 평가',
        portfolio_evaluation: '교과 세부능력 및 특기사항, 학업 관련 활동 기록',
        interview_evaluation: '학습 동기, 학업 계획, 전공 관련 지식 수준',
        weight: 0, 
        selected: false 
      },
      { 
        id: 'creativity', 
        name: '창의력', 
        description: '창의적 사고와 혁신적 아이디어',
        evaluation_method: '독창적 사고력, 문제 해결 접근법, 새로운 아이디어 제시 능력',
        portfolio_evaluation: '창의적 활동 기록, 발명품, 작품 활동, 아이디어 제안',
        interview_evaluation: '창의적 문제해결 과정, 독창적 사고 표현, 혁신적 아이디어',
        weight: 0, 
        selected: false 
      },
      { 
        id: 'leadership', 
        name: '리더십', 
        description: '조직을 이끄는 능력과 영향력',
        evaluation_method: '리더십 경험, 팀워크 능력, 조직 운영 및 갈등 해결 능력',
        portfolio_evaluation: '학급 임원, 동아리 회장, 프로젝트 리더 경험',
        interview_evaluation: '리더십 철학, 갈등 해결 사례, 팀 관리 경험',
        weight: 0, 
        selected: false 
      },
      { 
        id: 'communication', 
        name: '의사소통 능력', 
        description: '효과적인 소통과 표현 능력',
        evaluation_method: '언어 표현력, 경청 능력, 상황에 맞는 소통 방식',
        portfolio_evaluation: '발표 활동, 토론 참여, 글쓰기 활동, 언어 관련 수상',
        interview_evaluation: '명확한 의사표현, 질문 이해도, 논리적 답변 구성',
        weight: 0, 
        selected: false 
      },
      { 
        id: 'problem_solving', 
        name: '문제해결 능력', 
        description: '복잡한 문제를 분석하고 해결하는 능력',
        evaluation_method: '논리적 사고력, 분석력, 해결책 도출 과정',
        portfolio_evaluation: '탐구 활동, 연구 보고서, 문제 해결 프로젝트',
        interview_evaluation: '문제 분석 과정, 해결 방안 제시, 논리적 추론',
        weight: 0, 
        selected: false 
      }
    ],
    focusAreas: [],
    difficulty: '보통',
    questionStyle: '밝은 격려형'
  });

  const durationOptions = [
    { value: 3, label: '3분' },
    { value: 5, label: '5분' },
    { value: 7, label: '7분' },
    { value: 10, label: '10분' },
    { value: 15, label: '15분' },
    { value: 20, label: '20분' },
    { value: 30, label: '30분' }
  ];

  const difficultyOptions = [
    { value: '쉬움' as const, label: '쉬움', description: '기본적인 질문 위주' },
    { value: '보통' as const, label: '보통', description: '적당한 난이도의 질문' },
    { value: '어려움' as const, label: '어려움', description: '심화된 분석적 질문' }
  ];

  const questionStyleOptions = [
    { value: '밝은 격려형' as const, label: '밝은 격려형', description: '따뜻하고 격려하는 밝은 분위기' },
    { value: '밝은 친근형' as const, label: '밝은 친근형', description: '편안하고 친근한 밝은 분위기' },
    { value: '어두운 압박형' as const, label: '어두운 압박형', description: '긴장감과 압박감이 있는 어두운 분위기' },
    { value: '어두운 분석형' as const, label: '어두운 분석형', description: '냉정하고 분석적인 어두운 분위기' }
  ];

  // 사용자 커스텀 평가 요소 로드
  useEffect(() => {
    const loadCustomCriteria = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const customCriteria = await evaluationCriteriaService.getAll(user.id);
        
        // 커스텀 평가 요소를 기본 요소에 추가
        const customEvaluationCriteria = customCriteria.map(criteria => ({
          id: criteria.id,
          name: criteria.name,
          description: criteria.description,
          evaluation_method: criteria.evaluation_method,
          portfolio_evaluation: criteria.portfolio_evaluation,
          interview_evaluation: criteria.interview_evaluation,
          weight: 0,
          selected: false,
          is_custom: true
        }));

        setSettings(prev => ({
          ...prev,
          evaluationCriteria: [...prev.evaluationCriteria, ...customEvaluationCriteria]
        }));
      } catch (error) {
        console.error('커스텀 평가 요소 로드 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCustomCriteria();
  }, [user]);

  const handleCriteriaToggle = (criteriaId: string) => {
    setSettings(prev => ({
      ...prev,
      evaluationCriteria: prev.evaluationCriteria.map(criteria => 
        criteria.id === criteriaId 
          ? { ...criteria, selected: !criteria.selected, weight: criteria.selected ? 0 : 10 }
          : criteria
      )
    }));
  };

  const handleWeightChange = (criteriaId: string, weight: number) => {
    setSettings(prev => ({
      ...prev,
      evaluationCriteria: prev.evaluationCriteria.map(criteria => 
        criteria.id === criteriaId ? { ...criteria, weight } : criteria
      )
    }));
  };

  const handleCreateCriteria = async () => {
    if (!user?.id || !newCriteria.name || !newCriteria.description) {
      toast({
        title: "입력 오류",
        description: "평가 요소명과 설명을 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    try {
      const savedCriteria = await evaluationCriteriaService.save(user.id, newCriteria);
      
      const newEvaluationCriteria: EvaluationCriteria = {
        id: savedCriteria.id,
        name: savedCriteria.name,
        description: savedCriteria.description,
        evaluation_method: savedCriteria.evaluation_method,
        portfolio_evaluation: savedCriteria.portfolio_evaluation,
        interview_evaluation: savedCriteria.interview_evaluation,
        weight: 0,
        selected: false,
        is_custom: true
      };

      setSettings(prev => ({
        ...prev,
        evaluationCriteria: [...prev.evaluationCriteria, newEvaluationCriteria]
      }));

      setNewCriteria({
        name: '',
        description: '',
        evaluation_method: '',
        portfolio_evaluation: '',
        interview_evaluation: ''
      });
      
      setIsCreateDialogOpen(false);
      
      toast({
        title: "생성 완료",
        description: "새로운 평가 요소가 생성되었습니다.",
      });
    } catch (error) {
      console.error('평가 요소 생성 오류:', error);
      toast({
        title: "생성 오류",
        description: "평가 요소 생성 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  const handleEditCriteria = async () => {
    if (!user?.id || !editingCriteria) return;

    try {
      await evaluationCriteriaService.update(user.id, editingCriteria.id, {
        name: editingCriteria.name,
        description: editingCriteria.description,
        evaluation_method: editingCriteria.evaluation_method,
        portfolio_evaluation: editingCriteria.portfolio_evaluation,
        interview_evaluation: editingCriteria.interview_evaluation
      });

      setSettings(prev => ({
        ...prev,
        evaluationCriteria: prev.evaluationCriteria.map(criteria =>
          criteria.id === editingCriteria.id ? editingCriteria : criteria
        )
      }));

      setEditingCriteria(null);
      setIsEditDialogOpen(false);
      
      toast({
        title: "수정 완료",
        description: "평가 요소가 수정되었습니다.",
      });
    } catch (error) {
      console.error('평가 요소 수정 오류:', error);
      toast({
        title: "수정 오류",
        description: "평가 요소 수정 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCriteria = async (criteriaId: string) => {
    if (!user?.id) return;

    try {
      await evaluationCriteriaService.delete(user.id, criteriaId);
      
      setSettings(prev => ({
        ...prev,
        evaluationCriteria: prev.evaluationCriteria.filter(criteria => criteria.id !== criteriaId)
      }));
      
      toast({
        title: "삭제 완료",
        description: "평가 요소가 삭제되었습니다.",
      });
    } catch (error) {
      console.error('평가 요소 삭제 오류:', error);
      toast({
        title: "삭제 오류",
        description: "평가 요소 삭제 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  const getSelectedCriteria = () => settings.evaluationCriteria.filter(c => c.selected);
  const getTotalWeight = () => getSelectedCriteria().reduce((sum, c) => sum + c.weight, 0);

  const validateSettings = () => {
    const selectedCriteria = getSelectedCriteria();
    
    if (selectedCriteria.length === 0) {
      toast({
        title: "설정 오류",
        description: "최소 1개의 평가 요소를 선택해주세요.",
        variant: "destructive"
      });
      return false;
    }

    const totalWeight = getTotalWeight();
    if (Math.abs(totalWeight - 100) > 0.1) {
      toast({
        title: "설정 오류",
        description: `평가 요소의 총 비율이 ${totalWeight.toFixed(1)}%입니다. 정확히 100%가 되도록 조정해주세요.`,
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const saveSettings = async () => {
    if (!validateSettings()) return;

    try {
      setSaving(true);
      
      const settingsToSave = {
        ...settings,
        selectedInterviewers: JSON.parse(localStorage.getItem('selected_interviewers') || '[]'),
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem('interview_settings', JSON.stringify(settingsToSave));
      
      toast({
        title: "설정 저장 완료",
        description: "면접 설정이 성공적으로 저장되었습니다.",
      });

      navigate('/interview/active');
      
    } catch (error) {
      console.error('설정 저장 오류:', error);
      toast({
        title: "저장 오류",
        description: "설정을 저장하는 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const goBack = () => {
    navigate('/interview');
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">설정 페이지를 준비하는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">면접 설정</h1>
        <p className="text-gray-600">
          면접 진행 방식과 평가 기준을 설정해주세요. 모든 설정은 면접 품질에 영향을 미칩니다.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* 기본 설정 */}
        <div className="space-y-6">
          {/* 면접 시간 설정 */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                면접 시간 설정
              </CardTitle>
              <CardDescription>
                면접 진행 시간을 선택하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select 
                value={settings.duration.toString()} 
                onValueChange={(value) => setSettings(prev => ({ ...prev, duration: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map(option => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* 면접 난이도 */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-600" />
                면접 난이도
              </CardTitle>
              <CardDescription>
                질문의 난이도를 선택하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {difficultyOptions.map(option => (
                <div key={option.value} className="flex items-center space-x-3">
                  <Checkbox
                    checked={settings.difficulty === option.value}
                    onCheckedChange={() => setSettings(prev => ({ ...prev, difficulty: option.value }))}
                  />
                  <div className="flex-1">
                    <Label className="font-medium">{option.label}</Label>
                    <p className="text-sm text-gray-500">{option.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 면접 분위기 */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-purple-600" />
                면접 분위기
              </CardTitle>
              <CardDescription>
                면접관의 분위기와 톤을 선택하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {questionStyleOptions.map(option => (
                <div key={option.value} className="flex items-center space-x-3">
                  <Checkbox
                    checked={settings.questionStyle === option.value}
                    onCheckedChange={() => setSettings(prev => ({ ...prev, questionStyle: option.value }))}
                  />
                  <div className="flex-1">
                    <Label className="font-medium">{option.label}</Label>
                    <p className="text-sm text-gray-500">{option.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* 평가 요소 설정 */}
        <div className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  평가 요소 및 비율 설정
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  평가 요소 추가
                </Button>
              </CardTitle>
              <CardDescription>
                평가할 요소를 선택하고 각각의 비율을 설정하세요 (총합 100%)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {settings.evaluationCriteria.map(criteria => (
                  <div key={criteria.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-3 flex-1">
                        <Checkbox
                          checked={criteria.selected}
                          onCheckedChange={() => handleCriteriaToggle(criteria.id)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Label className="font-medium">{criteria.name}</Label>
                            {criteria.is_custom && (
                              <Badge variant="secondary" className="text-xs">커스텀</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{criteria.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {criteria.selected && (
                          <Badge variant="secondary">
                            {criteria.weight}%
                          </Badge>
                        )}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>{criteria.name} 상세 정보</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label className="font-medium">평가 방법</Label>
                                <p className="text-sm text-gray-600 mt-1">{criteria.evaluation_method}</p>
                              </div>
                              <div>
                                <Label className="font-medium">생활기록부 평가 기준</Label>
                                <p className="text-sm text-gray-600 mt-1">{criteria.portfolio_evaluation}</p>
                              </div>
                              <div>
                                <Label className="font-medium">면접 평가 기준</Label>
                                <p className="text-sm text-gray-600 mt-1">{criteria.interview_evaluation}</p>
                              </div>
                            </div>
                            <DialogFooter>
                              {criteria.is_custom && (
                                <>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setEditingCriteria(criteria);
                                      setIsEditDialogOpen(true);
                                    }}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    수정
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleDeleteCriteria(criteria.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    삭제
                                  </Button>
                                </>
                              )}
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                    
                    {criteria.selected && (
                      <div className="mt-3">
                        <div className="flex items-center space-x-3">
                          <Label className="text-sm">비율:</Label>
                          <div className="flex-1">
                            <Slider
                              value={[criteria.weight]}
                              onValueChange={(value) => handleWeightChange(criteria.id, value[0])}
                              max={100}
                              min={0}
                              step={5}
                              className="flex-1"
                            />
                          </div>
                          <Input
                            type="number"
                            value={criteria.weight}
                            onChange={(e) => handleWeightChange(criteria.id, parseInt(e.target.value) || 0)}
                            className="w-20"
                            min={0}
                            max={100}
                          />
                          <span className="text-sm">%</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {/* 총합 표시 */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">총 비율:</span>
                    <Badge 
                      variant={Math.abs(getTotalWeight() - 100) < 0.1 ? "default" : "destructive"}
                      className="text-lg px-3 py-1"
                    >
                      {getTotalWeight().toFixed(1)}%
                    </Badge>
                  </div>
                  {Math.abs(getTotalWeight() - 100) > 0.1 && (
                    <p className="text-sm text-red-600 mt-1">
                      총 비율이 100%가 되도록 조정해주세요.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 네비게이션 버튼 */}
      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={goBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          면접관 선택으로
        </Button>
        <Button 
          onClick={saveSettings}
          className="bg-blue-600 hover:bg-blue-700"
          disabled={saving || getSelectedCriteria().length === 0 || Math.abs(getTotalWeight() - 100) > 0.1}
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              설정 저장 중...
            </>
          ) : (
            <>
              면접 시작하기
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      {/* 평가 요소 생성 다이얼로그 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>새 평가 요소 생성</DialogTitle>
            <DialogDescription>
              새로운 평가 요소를 생성하여 면접에 활용하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">평가 요소명 *</Label>
              <Input
                id="name"
                value={newCriteria.name}
                onChange={(e) => setNewCriteria(prev => ({ ...prev, name: e.target.value }))}
                placeholder="예: 사회적 책임감"
              />
            </div>
            <div>
              <Label htmlFor="description">설명 *</Label>
              <Input
                id="description"
                value={newCriteria.description}
                onChange={(e) => setNewCriteria(prev => ({ ...prev, description: e.target.value }))}
                placeholder="예: 사회 문제에 대한 관심과 해결 의지"
              />
            </div>
            <div>
              <Label htmlFor="evaluation_method">평가 방법</Label>
              <Textarea
                id="evaluation_method"
                value={newCriteria.evaluation_method}
                onChange={(e) => setNewCriteria(prev => ({ ...prev, evaluation_method: e.target.value }))}
                placeholder="이 요소를 어떻게 평가할지 설명해주세요"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="portfolio_evaluation">생활기록부 평가 기준</Label>
              <Textarea
                id="portfolio_evaluation"
                value={newCriteria.portfolio_evaluation}
                onChange={(e) => setNewCriteria(prev => ({ ...prev, portfolio_evaluation: e.target.value }))}
                placeholder="생활기록부에서 어떤 활동을 통해 이 요소를 평가할지 설명해주세요"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="interview_evaluation">면접 평가 기준</Label>
              <Textarea
                id="interview_evaluation"
                value={newCriteria.interview_evaluation}
                onChange={(e) => setNewCriteria(prev => ({ ...prev, interview_evaluation: e.target.value }))}
                placeholder="면접에서 어떤 질문이나 상황을 통해 이 요소를 평가할지 설명해주세요"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleCreateCriteria}>
              생성하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 평가 요소 편집 다이얼로그 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>평가 요소 편집</DialogTitle>
            <DialogDescription>
              평가 요소의 정보를 수정하세요.
            </DialogDescription>
          </DialogHeader>
          {editingCriteria && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit_name">평가 요소명 *</Label>
                <Input
                  id="edit_name"
                  value={editingCriteria.name}
                  onChange={(e) => setEditingCriteria(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
              </div>
              <div>
                <Label htmlFor="edit_description">설명 *</Label>
                <Input
                  id="edit_description"
                  value={editingCriteria.description}
                  onChange={(e) => setEditingCriteria(prev => prev ? { ...prev, description: e.target.value } : null)}
                />
              </div>
              <div>
                <Label htmlFor="edit_evaluation_method">평가 방법</Label>
                <Textarea
                  id="edit_evaluation_method"
                  value={editingCriteria.evaluation_method}
                  onChange={(e) => setEditingCriteria(prev => prev ? { ...prev, evaluation_method: e.target.value } : null)}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="edit_portfolio_evaluation">생활기록부 평가 기준</Label>
                <Textarea
                  id="edit_portfolio_evaluation"
                  value={editingCriteria.portfolio_evaluation}
                  onChange={(e) => setEditingCriteria(prev => prev ? { ...prev, portfolio_evaluation: e.target.value } : null)}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="edit_interview_evaluation">면접 평가 기준</Label>
                <Textarea
                  id="edit_interview_evaluation"
                  value={editingCriteria.interview_evaluation}
                  onChange={(e) => setEditingCriteria(prev => prev ? { ...prev, interview_evaluation: e.target.value } : null)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleEditCriteria}>
              수정하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};