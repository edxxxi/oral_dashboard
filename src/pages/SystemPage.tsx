import React, { useMemo, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useStore } from '../store/store'
import { useAuth } from '../auth'
import type { Feedback } from '../store/types'
import type { Role } from '../rbac'
import { formatDateTime } from '../utils/date'

function roleLabel(role: string) {
  switch (role) {
    case 'admin':
      return '系統管理'
    case 'nurse':
      return '護理師'
    case 'dietitian':
      return '營養師'
    case 'caregiver':
      return '照服員'
    case 'slp':
      return '口語師'
    default:
      return role
  }
}

export default function SystemPage() {
  const { state, dispatch, addFeedback, updateFeedbackStatus } = useStore()
  const {
    user,
    can: canPermission,
    signOut,
    staffAccounts,
    loadingStaffAccounts,
    adminIssueAccount,
    adminSetActive,
    adminSetPassword,
    adminDeleteAccount,
  } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const canManageStaff = canPermission('manage:staff')

  const [tab, setTab] = useState<'staff' | 'feedback'>(canManageStaff ? 'staff' : 'feedback')
  const [q, setQ] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)

  const [newStaffName, setNewStaffName] = useState('')
  const [newStaffEmail, setNewStaffEmail] = useState('')
  const [newStaffRole, setNewStaffRole] = useState<Role>('nurse')
  const [newStaffPassword, setNewStaffPassword] = useState('')
  const [staffPasswords, setStaffPasswords] = useState<Record<string, string>>({})
  const [staffErr, setStaffErr] = useState<string | null>(null)
  const [staffMsg, setStaffMsg] = useState<string | null>(null)

  const [fbFrom, setFbFrom] = useState('')
  const [fbMessage, setFbMessage] = useState('')

  const staffSorted = useMemo(
    () => [...staffAccounts].sort((a, b) => (a.active === b.active ? 0 : a.active ? -1 : 1)),
    [staffAccounts],
  )

  // 登出功能
  const handleLogout = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  // 導航選項
  const shortcuts = [
    { name: '首頁', path: '/' },
    { name: '系統管理', path: '/system' },
    { name: '住民資料', path: '/residents' },
    { name: '評估量表', path: '/assessments' },
    { name: '分析報告', path: '/reports' },
  ]

  // 搜尋功能
  const searchResults = q.trim() === '' ? [] : state.residents.filter((r) =>
    r.bedNo.toLowerCase().includes(q.toLowerCase()) ||
    r.name.toLowerCase().includes(q.toLowerCase())
  )

  const handleSearchEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchResults.length > 0) {
      dispatch({ type: 'select_resident', id: searchResults[0].id })
      navigate('/residents')
    }
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: '#f8f9fa', zIndex: 9999, overflowY: 'auto',
      fontFamily: 'sans-serif'
    }}>
      {/* 頂部導航欄 (Hugging Face 風格) */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: '64px', backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
      }}>
        
        {/* 左側：Logo與導航連結 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ fontWeight: 800, fontSize: '20px', marginRight: '16px', color: '#111827' }}>
            🦷 OralCare
          </div>
          {shortcuts.map(sc => {
            const isActive = location.pathname === sc.path
            return (
              <Link key={sc.path} to={sc.path} style={{
                textDecoration: 'none', padding: '6px 12px', borderRadius: '6px',
                color: isActive ? '#111827' : '#4b5563',
                fontWeight: isActive ? 600 : 500, fontSize: '15px',
                backgroundColor: isActive ? '#f3f4f6' : 'transparent',
                transition: 'all 0.2s'
              }} onMouseOver={(e) => !isActive && (e.currentTarget.style.color = '#111827')}
                 onMouseOut={(e) => !isActive && (e.currentTarget.style.color = '#4b5563')}>
                {sc.name}
              </Link>
            )
          })}
        </div>

        {/* 右側：搜尋框與使用者資訊 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          
          {/* 搜尋框 */}
          <div style={{ position: 'relative', width: '260px' }}>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={handleSearchEnter}
              placeholder="🔍 搜尋床號或姓名..."
              style={{
                width: '100%', padding: '8px 16px', fontSize: '14px',
                borderRadius: '20px', border: '1px solid #d1d5db',
                outline: 'none', backgroundColor: '#f9fafb', boxSizing: 'border-box'
              }}
              onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.backgroundColor = '#fff' }}
              onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; e.target.style.backgroundColor = '#f9fafb' }}
            />
            {/* 搜尋結果下拉選單 */}
            {q.trim() !== '' && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, width: '320px',
                backgroundColor: '#fff', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb', borderRadius: '8px', marginTop: '8px',
                maxHeight: '400px', overflowY: 'auto'
              }}>
                {searchResults.length > 0 ? searchResults.map(r => (
                  <div key={r.id} onClick={() => {
                    dispatch({ type: 'select_resident', id: r.id })
                    navigate('/residents')
                  }} style={{
                    padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                     onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <span style={{ fontSize: '15px', color: '#111827', fontWeight: 500 }}>{r.bedNo} - {r.name}</span>
                    <span style={{ color: '#3b82f6', fontSize: '13px' }}>前往 &rarr;</span>
                  </div>
                )) : (
                  <div style={{ padding: '16px', color: '#6b7280', textAlign: 'center', fontSize: '14px' }}>查無符合的住民</div>
                )}
              </div>
            )}
          </div>

          {/* 使用者資訊與登出 */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowUserMenu(!showUserMenu)} style={{
              width: 36, height: 36, borderRadius: '50%', backgroundColor: '#2563eb',
              color: '#fff', border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 'bold',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }} title="使用者選單">
              {user?.name?.[0] || 'U'}
            </button>

            {showUserMenu && (
              <div style={{
                position: 'absolute', top: 48, right: 0, backgroundColor: '#fff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)', borderRadius: 8, padding: '8px 0',
                width: 160, textAlign: 'center', border: '1px solid #e5e7eb'
              }}>
                <div style={{ padding: '8px 16px', borderBottom: '1px solid #f3f4f6', color: '#4b5563', fontSize: 13, fontWeight: 500 }}>
                  {user?.name || '使用者'}
                </div>
                <button onClick={handleLogout} style={{
                  display: 'block', width: '100%', padding: '12px 16px', border: 'none',
                  background: 'transparent', cursor: 'pointer', textAlign: 'center', fontSize: 14, color: '#ef4444'
                }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                   onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  登出
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 頁面主要內容 */}
      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', color: '#111827', margin: '0 0 20px 0' }}>{canManageStaff ? '系統管理' : '系統回饋'}</h1>
          
          {/* 頁籤切換 */}
          <div style={{ display: 'flex', gap: '12px' }}>
            {canManageStaff ? (
              <button className={tab === 'staff' ? 'btn' : 'btn btn--sub'} onClick={() => setTab('staff')} style={{ padding: '8px 16px', fontSize: '15px' }}>
                1. 工作人員帳號管理
              </button>
            ) : null}
            <button className={tab === 'feedback' ? 'btn' : 'btn btn--sub'} onClick={() => setTab('feedback')} style={{ padding: '8px 16px', fontSize: '15px' }}>
              {canManageStaff ? '2. 系統使用回饋' : '系統使用回饋'}
            </button>
          </div>
        </div>

        {tab === 'staff' && canManageStaff ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <section className="card">
              <div className="card__title">新增帳號</div>
              <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
                <label className="field" style={{ minWidth: 220 }}>
                  <span className="label">姓名</span>
                  <input value={newStaffName} onChange={(e) => setNewStaffName(e.target.value)} placeholder="例如：護理師 E" />
                </label>
                <label className="field" style={{ minWidth: 240 }}>
                  <span className="label">Email</span>
                  <input value={newStaffEmail} onChange={(e) => setNewStaffEmail(e.target.value)} placeholder="name@example.com" />
                </label>
                <label className="field" style={{ minWidth: 200 }}>
                  <span className="label">角色</span>
                  <select value={newStaffRole} onChange={(e) => setNewStaffRole(e.target.value as Role)}>
                    <option value="admin">系統管理</option>
                    <option value="nurse">護理師</option>
                    <option value="dietitian">營養師</option>
                    <option value="caregiver">照服員</option>
                    <option value="slp">口語師</option>
                  </select>
                </label>
                <label className="field" style={{ minWidth: 220 }}>
                  <span className="label">密碼（主管設定）</span>
                  <input
                    type="password"
                    value={newStaffPassword}
                    onChange={(e) => setNewStaffPassword(e.target.value)}
                    placeholder="至少 6 碼"
                  />
                </label>
                <button
                  className="btn"
                  onClick={async () => {
                    setStaffErr(null)
                    setStaffMsg(null)
                    const name = newStaffName.trim()
                    const email = newStaffEmail.trim()
                    const password = newStaffPassword.trim()
                    if (!name || !email || !password) {
                      setStaffErr('請完整填寫姓名、Email、密碼')
                      return
                    }
                    if (password.length < 6) {
                      setStaffErr('密碼至少 6 碼')
                      return
                    }
                    try {
                      await adminIssueAccount({ name, email, role: newStaffRole, active: true, password })
                      setStaffMsg(`已建立帳號：${email}`)
                    } catch (error) {
                      const msg = error instanceof Error ? error.message : '建立帳號失敗，請檢查資料後重試'
                      setStaffErr(`建立帳號失敗：${msg}`)
                      return
                    }
                    setNewStaffName('')
                    setNewStaffEmail('')
                    setNewStaffRole('nurse')
                    setNewStaffPassword('')
                  }}
                >
                  新增
                </button>
              </div>
              {staffErr ? <div style={{ marginTop: 10, color: '#b91c1c' }}>{staffErr}</div> : null}
              {staffMsg ? <div style={{ marginTop: 10, color: '#065f46' }}>{staffMsg}</div> : null}
            </section>

            <section className="card">
              <div className="card__title">工作人員帳號</div>
              {loadingStaffAccounts ? <div className="muted">帳號資料載入中…</div> : null}
              <div className="tablewrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>姓名</th>
                      <th>角色</th>
                      <th>Email</th>
                      <th style={{ width: 120 }}>狀態</th>
                      <th style={{ width: 330 }}>管理</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffSorted.map((s) => (
                      <tr key={s.id}>
                        <td>{s.name}</td>
                        <td>{roleLabel(s.role)}</td>
                        <td>{s.email}</td>
                        <td>
                          <span className={s.active ? 'tag tag--ok' : 'tag'}>{s.active ? '啟用' : '停用'}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <button
                              className="btn btn--sub"
                              onClick={async () => {
                                setStaffErr(null)
                                setStaffMsg(null)
                                const ok = await adminSetActive(s.id, !s.active)
                                if (!ok) {
                                  setStaffErr('無法停用最後一個主管帳號')
                                  return
                                }
                                setStaffMsg(`${s.email} 已${s.active ? '停用' : '啟用'}`)
                              }}
                            >
                              {s.active ? '停用' : '啟用'}
                            </button>
                            <input
                              type="password"
                              placeholder="新密碼"
                              value={staffPasswords[s.id] ?? ''}
                              onChange={(e) =>
                                setStaffPasswords((prev) => ({
                                  ...prev,
                                  [s.id]: e.target.value,
                                }))
                              }
                              style={{ width: 110 }}
                            />
                            <button
                              className="btn btn--sub"
                              onClick={async () => {
                                setStaffErr(null)
                                setStaffMsg(null)
                                const password = (staffPasswords[s.id] ?? '').trim()
                                if (password.length < 6) {
                                  setStaffErr('新密碼至少 6 碼')
                                  return
                                }
                                const ok = await adminSetPassword(s.id, password)
                                if (!ok) {
                                  setStaffErr('設定密碼失敗')
                                  return
                                }
                                setStaffPasswords((prev) => ({ ...prev, [s.id]: '' }))
                                setStaffMsg(`已更新 ${s.email} 的密碼`)
                              }}
                            >
                              設密碼
                            </button>
                            <button
                              className="btn btn--sub"
                              onClick={async () => {
                                setStaffErr(null)
                                setStaffMsg(null)
                                const res = await adminDeleteAccount(s.id)
                                if (!res.ok) {
                                  setStaffErr(res.error)
                                  return
                                }
                                setStaffMsg(`已刪除帳號：${s.email}`)
                              }}
                            >
                              刪除
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <section className="card">
              <div className="card__title">送出回饋</div>
              <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
                <label className="field" style={{ minWidth: 240 }}>
                  <span className="label">回饋者</span>
                  <input value={fbFrom} onChange={(e) => setFbFrom(e.target.value)} placeholder="例如：護理師 A" />
                </label>
                <label className="field" style={{ flex: 1, minWidth: 320 }}>
                  <span className="label">內容</span>
                  <input value={fbMessage} onChange={(e) => setFbMessage(e.target.value)} placeholder="希望新增… / 發現問題…" />
                </label>
                <button
                  className="btn"
                  onClick={() => {
                    const from = fbFrom.trim()
                    const message = fbMessage.trim()
                    if (!from || !message) return
                    void addFeedback({ from, message })
                    setFbFrom('')
                    setFbMessage('')
                  }}
                >
                  送出
                </button>
              </div>
            </section>

            <section className="card">
              <div className="card__title">回饋清單</div>
              <div className="tablewrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: 160 }}>時間</th>
                      <th style={{ width: 140 }}>回饋者</th>
                      <th>內容</th>
                      <th style={{ width: 120 }}>狀態</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.feedbacks.map((f) => (
                      <tr key={f.id}>
                        <td className="muted">{formatDateTime(f.createdAt)}</td>
                        <td>{f.from}</td>
                        <td>{f.message}</td>
                        <td>
                          <select
                            value={f.status}
                            onChange={(e) =>
                              void updateFeedbackStatus(f.id, e.target.value as Feedback['status'])
                            }
                          >
                            <option value="new">新</option>
                            <option value="triaged">已分類</option>
                            <option value="done">已完成</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
