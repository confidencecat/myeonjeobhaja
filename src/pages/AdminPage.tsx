import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Database,
  Edit3,
  Eye,
  LayoutDashboard,
  Loader2,
  LogOut,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import clsx from 'clsx'
import ApiKeyManager from '../components/admin/ApiKeyManager'
import { useNavigate } from 'react-router-dom'

type TableConfig = {
  name: string
  label: string
  description: string
  primaryKey: string
}

const TABLES: TableConfig[] = [
  {
    name: 'user_profiles',
    label: '사용자 프로필',
    description: '회원의 기본 정보와 권한을 관리합니다.',
    primaryKey: 'id',
  },
  {
    name: 'school_records',
    label: '생기부 기록',
    description: '학생부 활동 및 교과 세부 정보를 확인합니다.',
    primaryKey: 'id',
  },
  {
    name: 'interview_sessions',
    label: '면접 세션',
    description: '사용자가 생성한 면접 세션과 설정 정보를 관리합니다.',
    primaryKey: 'id',
  },
  {
    name: 'interview_results',
    label: '면접 결과',
    description: '면접 분석 결과와 평가 점수를 확인합니다.',
    primaryKey: 'id',
  },
  {
    name: 'interview_qa',
    label: '면접 Q&A',
    description: '각 질문과 사용자 답변, 피드백 데이터를 열람합니다.',
    primaryKey: 'id',
  },
  {
    name: 'api_keys',
    label: 'API 키',
    description: 'STT, TTS, 응답 생성을 위한 외부 API 키를 관리합니다.',
    primaryKey: 'id',
  },
]

type EditorMode = 'insert' | 'update' | null

const formatCellValue = (value: unknown) => {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'string') {
    if (value.length > 80) {
      return value.slice(0, 77) + '…'
    }
    return value
  }
  if (Array.isArray(value) || typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}

export default function AdminPage() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const [selectedTable, setSelectedTable] = useState<TableConfig>(TABLES[0])
  const [rows, setRows] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRow, setSelectedRow] = useState<any | null>(null)
  const [editorMode, setEditorMode] = useState<EditorMode>(null)
  const [editorContent, setEditorContent] = useState('')
  const [editorError, setEditorError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const isApiKeyTable = selectedTable.name === 'api_keys'

  const fetchTableData = useCallback(
    async (tableName: string) => {
      setIsLoading(true)
      setError(null)
      setSelectedRow(null)
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(200)

        if (error) {
          throw error
        }

        setRows(data ?? [])
      } catch (err: any) {
        console.error('AdminPage: 테이블 조회 실패', err)
        setRows([])
        setError(err?.message ?? '데이터를 불러오는 중 문제가 발생했습니다.')
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    fetchTableData(selectedTable.name)
  }, [selectedTable.name, fetchTableData])

  useEffect(() => {
    if (!feedback) return
    const timer = setTimeout(() => setFeedback(null), 4000)
    return () => clearTimeout(timer)
  }, [feedback])

  const columns = useMemo(() => {
    const keySet = new Set<string>()
    rows.forEach((row) => {
      Object.keys(row ?? {}).forEach((key) => keySet.add(key))
    })
    if (keySet.size === 0) {
      return []
    }
    const keys = Array.from(keySet)
    const primary = selectedTable.primaryKey
    if (primary && keys.includes(primary)) {
      const filtered = keys.filter((k) => k !== primary)
      return [primary, ...filtered]
    }
    return keys
  }, [rows, selectedTable.primaryKey])

  const openInsertEditor = () => {
    setEditorMode('insert')
    setEditorContent('{}')
    setEditorError('')
  }

  const openUpdateEditor = (row: any) => {
    setSelectedRow(row)
    setEditorMode('update')
    setEditorContent(JSON.stringify(row, null, 2))
    setEditorError('')
  }

  const closeEditor = () => {
    setEditorMode(null)
    setEditorContent('')
    setEditorError('')
  }

  const handleDeleteRow = async (row: any) => {
    const pk = selectedTable.primaryKey
    const pkValue = row?.[pk]

    if (pkValue === undefined) {
      alert('선택한 행에서 기본 키 값을 찾을 수 없습니다.')
      return
    }

    if (!confirm('정말로 이 행을 삭제하시겠습니까?')) {
      return
    }

    try {
      setIsSaving(true)
      const { error } = await supabase
        .from(selectedTable.name)
        .delete()
        .eq(pk, pkValue)

      if (error) {
        throw error
      }

      setFeedback('레코드가 삭제되었습니다.')
      await fetchTableData(selectedTable.name)
    } catch (err: any) {
      console.error('AdminPage: 행 삭제 실패', err)
      alert(`삭제 중 오류가 발생했습니다: ${err?.message ?? err}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveEditor = async () => {
    setEditorError('')
    let parsed: any

    try {
      parsed = JSON.parse(editorContent)
    } catch (err) {
      setEditorError('유효한 JSON 형식이 아닙니다. 다시 확인해주세요.')
      return
    }

    const payload = Array.isArray(parsed) ? parsed : [parsed]

    try {
      setIsSaving(true)
      if (editorMode === 'insert') {
        const { error } = await supabase
          .from(selectedTable.name)
          .insert(payload)

        if (error) {
          throw error
        }

        setFeedback('새 레코드가 추가되었습니다.')
      } else if (editorMode === 'update') {
        if (!selectedRow) {
          setEditorError('수정할 행이 선택되지 않았습니다.')
          return
        }

        if (payload.length !== 1) {
          setEditorError('행 수정은 단일 객체만 지원합니다.')
          return
        }

        const pk = selectedTable.primaryKey
        const pkValue = selectedRow[pk]

        if (pkValue === undefined) {
          setEditorError('선택한 행에서 기본 키 값을 찾을 수 없습니다.')
          return
        }

        const { error } = await supabase
          .from(selectedTable.name)
          .update(payload[0])
          .eq(pk, pkValue)

        if (error) {
          throw error
        }

        setFeedback('레코드가 수정되었습니다.')
      }

      closeEditor()
      await fetchTableData(selectedTable.name)
    } catch (err: any) {
      console.error('AdminPage: 저장 실패', err)
      setEditorError(err?.message ?? '저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSignOut = useCallback(async () => {
    setError(null)
    setFeedback(null)
    setIsSigningOut(true)
    try {
      const { error } = await signOut()
      if (error) {
        throw error
      }
      navigate('/login', { replace: true })
    } catch (err: any) {
      console.error('AdminPage: 로그아웃 실패', err)
      setError('로그아웃 처리 중 문제가 발생했습니다. 잠시 후 다시 시도하세요.')
    } finally {
      setIsSigningOut(false)
    }
  }, [navigate, signOut])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="border-b border-slate-800 bg-slate-900">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3 text-blue-400">
              <ShieldCheck className="w-7 h-7" />
              <span className="uppercase tracking-[0.3em] text-xs font-semibold">Admin Control Center</span>
            </div>
            <h1 className="mt-2 text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
              <LayoutDashboard className="w-8 h-8 text-blue-400" /> 데이터 관리 콘솔
            </h1>
            <p className="mt-3 text-slate-300 max-w-2xl">
              모든 주요 테이블을 한 곳에서 확인하고 관리하세요. 중요한 변경 사항은 신중하게 수행하고, 필요 시 바로 데이터를 되돌릴 수 있도록 백업을 유지하세요.
            </p>
          </div>
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl px-5 py-4 shadow-lg">
            <p className="text-sm text-slate-400">현재 로그인</p>
            <p className="mt-1 text-lg font-semibold text-white">{profile?.name || user?.email}</p>
            <p className="text-sm text-slate-400">역할: {profile?.role ?? '—'}</p>
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:border-red-400 hover:text-red-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSigningOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              <span>로그아웃</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3 h-fit">
          <div className="flex items-center justify-between text-slate-400 text-sm uppercase tracking-widest">
            <span>데이터 소스</span>
            <Database className="w-4 h-4" />
          </div>
          <div className="space-y-2">
            {TABLES.map((table) => (
              <button
                key={table.name}
                onClick={() => {
                  setSelectedTable(table)
                  setSelectedRow(null)
                  setEditorMode(null)
                }}
                className={clsx(
                  'w-full text-left px-4 py-3 rounded-xl border transition-all duration-200',
                  selectedTable.name === table.name
                    ? 'border-blue-500/70 bg-blue-500/10 text-white shadow-[0_0_30px_rgba(37,99,235,0.12)]'
                    : 'border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800/40'
                )}
              >
                <p className="font-semibold tracking-tight">{table.label}</p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{table.description}</p>
              </button>
            ))}
          </div>
        </aside>

        <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.4em] text-slate-500">{selectedTable.name}</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">{selectedTable.label}</h2>
              <p className="text-slate-400 text-sm mt-1">{selectedTable.description}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => fetchTableData(selectedTable.name)}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition disabled:opacity-50"
              >
                <RefreshCw className={clsx('w-4 h-4', { 'animate-spin': isLoading })} />
                새로고침
              </button>
              <button
                onClick={openInsertEditor}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition"
              >
                <Plus className="w-4 h-4" /> 새 레코드 추가
              </button>
            </div>
          </div>

          {feedback && (
            <div className="mt-6 flex items-center gap-3 rounded-xl border border-blue-500/60 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">
              <ShieldCheck className="w-4 h-4" />
              <span>{feedback}</span>
            </div>
          )}

          {error && (
            <div className="mt-6 flex items-center gap-3 rounded-xl border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {isApiKeyTable && (
            <div className="mt-8">
              <ApiKeyManager
                onSuccess={async () => {
                  await fetchTableData('api_keys')
                  setFeedback('API 키가 저장되었습니다.')
                }}
                onError={(message) => setError(message)}
              />
            </div>
          )}

          <div className="mt-8">
            {isLoading ? (
              <div className="flex items-center justify-center py-16 text-slate-300">
                <Loader2 className="w-6 h-6 animate-spin mr-3" /> 데이터를 불러오는 중입니다...
              </div>
            ) : rows.length === 0 ? (
              <div className="py-16 text-center text-slate-400 border border-dashed border-slate-700 rounded-2xl">
                현재 표시할 데이터가 없습니다.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-slate-800">
                      {columns.map((column) => (
                        <th key={column} className="px-4 py-3 font-medium uppercase tracking-wide text-xs">
                          {column}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-right text-xs uppercase text-slate-500">작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => {
                      const rowKey = row[selectedTable.primaryKey] ?? `${selectedTable.name}-${index}`
                      return (
                        <tr
                          key={rowKey}
                          className="border-b border-slate-800/70 hover:bg-slate-800/40 transition"
                        >
                          {columns.map((column) => (
                            <td key={column} className="px-4 py-3 align-top text-slate-200/90">
                              {formatCellValue(row[column])}
                            </td>
                          ))}
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setSelectedRow(row)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-slate-700 text-slate-300 hover:border-slate-500"
                              >
                                <Eye className="w-3.5 h-3.5" /> 보기
                              </button>
                              <button
                                onClick={() => openUpdateEditor(row)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-blue-500/60 text-blue-100 hover:bg-blue-500/10"
                              >
                                <Edit3 className="w-3.5 h-3.5" /> 수정
                              </button>
                              <button
                                onClick={() => handleDeleteRow(row)}
                                disabled={isSaving}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-red-500/60 text-red-200 hover:bg-red-500/10 disabled:opacity-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> 삭제
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {selectedRow && (
            <div className="mt-10">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">선택된 행 상세 보기</h3>
                <button
                  onClick={() => setSelectedRow(null)}
                  className="text-sm text-slate-400 hover:text-white"
                >
                  닫기
                </button>
              </div>
              <pre className="mt-4 bg-slate-950/70 border border-slate-800 rounded-2xl p-5 text-xs text-slate-200 overflow-x-auto whitespace-pre-wrap">
{JSON.stringify(selectedRow, null, 2)}
              </pre>
            </div>
          )}

          {editorMode && (
            <div className="mt-10 border border-slate-800 rounded-2xl p-6 bg-slate-950/60">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {editorMode === 'insert' ? '새 레코드 추가' : '선택한 레코드 수정'}
                  </h3>
                  <p className="text-slate-400 text-sm mt-1">
                    {editorMode === 'insert'
                      ? 'JSON 객체를 입력해 새로운 데이터를 추가하세요. 여러 건을 추가하려면 배열로 전달할 수 있습니다.'
                      : '필요한 필드만 포함해 업데이트할 수 있습니다. 기본 키 값은 자동으로 선택된 행을 기준으로 합니다.'}
                  </p>
                </div>
                <button
                  onClick={closeEditor}
                  className="text-sm text-slate-400 hover:text-white"
                >
                  닫기
                </button>
              </div>

              <textarea
                value={editorContent}
                onChange={(event) => setEditorContent(event.target.value)}
                className="mt-4 w-full h-64 bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 font-mono text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                spellCheck={false}
              />

              {editorError && (
                <p className="mt-3 text-sm text-red-300">{editorError}</p>
              )}

              <div className="mt-5 flex gap-3 justify-end">
                <button
                  onClick={closeEditor}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveEditor}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />} 저장하기
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
