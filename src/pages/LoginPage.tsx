import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'

export default function LoginPage() {
  const { user, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as { from?: string } | null)?.from
  const nextPath = typeof from === 'string' && from.startsWith('/') ? from : '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined

  if (user) {
    return <Navigate to="/" replace />
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
      <div className="card" style={{ width: 420, maxWidth: '100%' }}>
        <div className="card__title">登入</div>
        <p className="muted" style={{ marginTop: 0 }}>
          正式環境採用 Supabase 帳號。首次請用已建立的主管帳號登入，再由主管在「系統管理」手動建立其他角色帳號與密碼。
        </p>

        <label className="field" style={{ marginBottom: 12 }}>
          <span className="label">帳號（Email）</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="請手動輸入帳號" />
        </label>

        <label className="field" style={{ marginBottom: 12 }}>
          <span className="label">密碼</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="輸入密碼" />
        </label>

        {err ? (
          <div className="muted" style={{ marginBottom: 10, color: '#b91c1c' }}>
            {err}
          </div>
        ) : null}

        <button
          className="btn"
          style={{ width: '100%' }}
          onClick={async () => {
            if (submitting) return
            setSubmitting(true)
            setErr(null)
            try {
              const res = await signIn(email, password)
              if (!res.ok) {
                setErr(res.error)
                return
              }
              navigate(nextPath, { replace: true })
            } catch (error) {
              const msg = error instanceof Error ? error.message : 'unknown error'
              setErr(`登入失敗：${msg}`)
            } finally {
              setSubmitting(false)
            }
          }}
          disabled={submitting}
        >
          {submitting ? '登入中…' : '登入'}
        </button>
        {import.meta.env.DEV ? (
          <div className="muted" style={{ marginTop: 10, fontSize: 12 }}>
            Supabase URL: {supabaseUrl || '(missing)'}
          </div>
        ) : null}
      </div>
    </div>
  )
}
