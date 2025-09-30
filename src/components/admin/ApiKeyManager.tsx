import { FormEvent, useEffect, useMemo, useState } from 'react'
import { KeyRound, Loader2, Lock, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const ENCRYPTION_SECRET = import.meta.env.VITE_API_KEY_ENCRYPTION_SECRET ?? ''

const SERVICE_OPTIONS = [
  { value: 'openai', label: 'OpenAI (GPT & TTS)', placeholder: 'sk-로 시작하는 키' },
  { value: 'google-stt', label: 'Google Speech-to-Text', placeholder: 'Google Cloud API 키' },
  { value: 'azure-cognitive', label: 'Azure Cognitive Services', placeholder: 'Azure Cognitive API 키' },
  { value: 'custom', label: '직접 입력', placeholder: '예: my-service' },
]

type ApiKeyManagerProps = {
  onSuccess?: () => void | Promise<void>
  onError?: (message: string) => void
}

type EncryptionResult = {
  encrypted: string
  iv: string
}

const textEncoder = new TextEncoder()

const SALT = 'myeonjeobhaja-admin-salt'
const ITERATIONS = 120_000

function isServiceNameValid(serviceName: string) {
  return /^[a-z0-9-_]{3,60}$/i.test(serviceName)
}

function validateKeyFormat(service: string, key: string) {
  const trimmed = key.trim()
  if (!trimmed) return false

  switch (service) {
    case 'openai':
      return trimmed.startsWith('sk-') && trimmed.length >= 40
    case 'google-stt':
    case 'azure-cognitive':
      return trimmed.length >= 30
    default:
      return trimmed.length >= 10
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
}

async function deriveAesKey(): Promise<CryptoKey> {
  if (!ENCRYPTION_SECRET) {
    throw new Error('VITE_API_KEY_ENCRYPTION_SECRET 환경 변수가 설정되어 있지 않습니다.')
  }

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(ENCRYPTION_SECRET),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: textEncoder.encode(SALT),
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt']
  )
}

async function encryptSecret(plainText: string): Promise<EncryptionResult> {
  const key = await deriveAesKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const cipherBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    textEncoder.encode(plainText.trim())
  )

  return {
    encrypted: arrayBufferToBase64(cipherBuffer),
    iv: arrayBufferToBase64(iv.buffer),
  }
}

export default function ApiKeyManager({ onSuccess, onError }: ApiKeyManagerProps) {
  const { user } = useAuth()
  const [service, setService] = useState('openai')
  const [customService, setCustomService] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showKey, setShowKey] = useState(false)

  const resolvedServiceName = useMemo(() => {
    if (service !== 'custom') return service
    return customService.trim().toLowerCase()
  }, [service, customService])

  useEffect(() => {
    if (!success) return
    const timer = setTimeout(() => setSuccess(''), 4000)
    return () => clearTimeout(timer)
  }, [success])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!resolvedServiceName) {
      setError('서비스 이름을 입력해주세요.')
      return
    }

    if (service === 'custom' && !isServiceNameValid(resolvedServiceName)) {
      setError('서비스 이름은 3~60자의 영문/숫자/-/_ 조합이어야 합니다.')
      return
    }

    if (!validateKeyFormat(resolvedServiceName, apiKey)) {
      setError('API 키 형식이 올바르지 않습니다. 서비스별 요구사항을 확인하세요.')
      return
    }

    if (!user) {
      setError('로그인 세션을 확인할 수 없습니다.')
      return
    }

    if (!ENCRYPTION_SECRET) {
      setError('환경 변수 VITE_API_KEY_ENCRYPTION_SECRET가 설정되어 있지 않아 저장할 수 없습니다.')
      return
    }

    try {
      setSubmitting(true)
      const { encrypted, iv } = await encryptSecret(apiKey)

      const { data: existing, error: fetchError, status } = await supabase
        .from('api_keys')
        .select('id')
        .eq('service_name', resolvedServiceName)
        .maybeSingle()

      if (fetchError && status !== 406) {
        throw fetchError
      }

      if (existing) {
        const confirmOverride = window.confirm('이미 등록된 서비스입니다. 기존 키를 덮어쓸까요?')
        if (!confirmOverride) {
          return
        }

        const { error: updateError } = await supabase
          .from('api_keys')
          .update({ encrypted_key: encrypted, iv })
          .eq('id', existing.id)

        if (updateError) {
          throw updateError
        }
      } else {
        const { error: insertError } = await supabase
          .from('api_keys')
          .insert({
            service_name: resolvedServiceName,
            encrypted_key: encrypted,
            iv,
          })

        if (insertError) {
          throw insertError
        }
      }

      setSuccess('API 키가 안전하게 저장되었습니다.')
      setApiKey('')
      setCustomService('')
      setShowKey(false)
      await onSuccess?.()
    } catch (err: any) {
      console.error('ApiKeyManager: API 키 저장 실패', err)
      const message = err?.message ?? 'API 키 저장 중 오류가 발생했습니다.'
      setError(message)
      onError?.(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-center gap-3 text-blue-300">
        <KeyRound className="w-5 h-5" />
        <div>
          <h3 className="text-lg font-semibold text-white">외부 API 키 등록</h3>
          <p className="text-sm text-slate-400">
            API 키는 AES-GCM으로 암호화되어 Supabase에 저장됩니다. 노출 위험을 줄이기 위해 필요 시에만 키를 발급받아 입력하세요.
          </p>
        </div>
      </div>

      {!ENCRYPTION_SECRET && (
        <div className="mt-4 rounded-xl border border-amber-500/60 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <Lock className="inline-block w-4 h-4 mr-2" />
          <span>환경 변수 VITE_API_KEY_ENCRYPTION_SECRET가 설정되어 있지 않습니다. 이 값을 .env 파일에 추가한 후 애플리케이션을 다시 실행하세요.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs uppercase tracking-[0.3em] text-slate-500 mb-2">서비스</label>
            <select
              value={service}
              onChange={(event) => setService(event.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/60"
            >
              {SERVICE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-[0.3em] text-slate-500 mb-2">실제 서비스 이름</label>
            <input
              type="text"
              value={service === 'custom' ? customService : SERVICE_OPTIONS.find((option) => option.value === service)?.label ?? ''}
              onChange={(event) => setCustomService(event.target.value)}
              placeholder={SERVICE_OPTIONS.find((option) => option.value === service)?.placeholder}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/60"
              readOnly={service !== 'custom'}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-[0.3em] text-slate-500 mb-2">API KEY</label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder={SERVICE_OPTIONS.find((option) => option.value === service)?.placeholder}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/60 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowKey((prev) => !prev)}
              className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-white"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-emerald-500/60 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !ENCRYPTION_SECRET}
          className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />} API 키 저장
        </button>
      </form>
    </div>
  )
}
