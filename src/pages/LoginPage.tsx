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
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '56px 18px',
        background: 'linear-gradient(180deg, #c7e0ff, #ffffff)',
      }}
    >
      <div
        className="card"
        style={{
          width: 560,
          maxWidth: '100%',
          padding: 22,
          boxSizing: 'border-box',
          border: '1px solid rgba(148, 163, 184, 0.35)',
          boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)',
          borderRadius: 16,
          background: 'rgba(255, 255, 255, 0.96)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 36, fontWeight: 900, color: '#0b4a8b', lineHeight: 1.2 }}>口腔評估管理系統</div>
          <div className="muted" style={{ fontSize: 15, marginTop: 6 }}>
            請使用帳號與密碼登入
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div aria-hidden style={{ width: 4, height: 20, borderRadius: 999, background: 'rgba(11, 74, 139, 0.95)' }} />
          <div className="card__title" style={{ fontSize: 20, marginBottom: 0 }}>
            登入
          </div>
        </div>
        <p className="muted" style={{ marginTop: 0, fontSize: 14, lineHeight: 1.6 }}>
          首次請用已建立的主管帳號登入，再由主管在「系統管理」手動建立其他角色帳號與密碼。
        </p>

        <label className="field" style={{ marginBottom: 12 }}>
          <span className="label">帳號（Email）</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="請手動輸入帳號"
            style={{ fontSize: 16, padding: '12px 12px' }}
          />
        </label>

        <label className="field" style={{ marginBottom: 12 }}>
          <span className="label">密碼</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="輸入密碼"
            style={{ fontSize: 16, padding: '12px 12px' }}
          />
        </label>

        {err ? (
          <div className="muted" style={{ marginBottom: 10, color: '#b91c1c' }}>
            {err}
          </div>
        ) : null}

        <button
          className="btn"
          style={{ width: '100%',fontSize: 18, padding: '12px 0' }}
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
