import { useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { roleLabel } from '../rbac'

export default function LoginPage() {
  const { user, signIn, getSeededPasswordHint, listIssuedAccounts } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as any)?.from
  const nextPath = typeof from === 'string' && from.startsWith('/') ? from : '/'

  const accounts = useMemo(() => listIssuedAccounts().filter((a) => a.active), [listIssuedAccounts])

  const [email, setEmail] = useState(accounts[0]?.email ?? '')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)

  if (user) {
    return <Navigate to="/" replace />
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
      <div className="card" style={{ width: 420, maxWidth: '100%' }}>
        <div className="card__title">登入</div>
        <p className="muted" style={{ marginTop: 0 }}>
          前端原型（localStorage）。初次預設密碼：<b>{getSeededPasswordHint()}</b>（可由主管/護理師於「系統管理」重設）。
        </p>

        <label className="field" style={{ marginBottom: 12 }}>
          <span className="label">帳號（Email）</span>
          <select value={email} onChange={(e) => setEmail(e.target.value)}>
            {accounts.map((a) => (
              <option key={a.email} value={a.email}>
                {a.email}（{a.name}｜{roleLabel(a.role)}）
              </option>
            ))}
          </select>
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
            setErr(null)
            const res = await signIn(email, password)
            if (!res.ok) {
              setErr(res.error)
              return
            }
            navigate(nextPath, { replace: true })
          }}
        >
          登入
        </button>
      </div>
    </div>
  )
}
