import { useMemo, useState } from 'react'
import { Topbar } from '../components/Topbar'
import { useStore } from '../store/store'
import type { Feedback, StaffAccount } from '../store/types'
import { makeId } from '../utils/ids'
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
  const { state, dispatch } = useStore()
  const [tab, setTab] = useState<'staff' | 'feedback'>('staff')

  const [newStaffName, setNewStaffName] = useState('')
  const [newStaffEmail, setNewStaffEmail] = useState('')
  const [newStaffRole, setNewStaffRole] = useState<StaffAccount['role']>('nurse')

  const [fbFrom, setFbFrom] = useState('')
  const [fbMessage, setFbMessage] = useState('')

  const staffSorted = useMemo(
    () => [...state.staff].sort((a, b) => (a.active === b.active ? 0 : a.active ? -1 : 1)),
    [state.staff],
  )

  return (
    <div className="page">
      <Topbar
        right={
          <div className="seg">
            <button className={tab === 'staff' ? 'seg__btn seg__btn--on' : 'seg__btn'} onClick={() => setTab('staff')}>
              1. 工作人員帳號管理
            </button>
            <button
              className={tab === 'feedback' ? 'seg__btn seg__btn--on' : 'seg__btn'}
              onClick={() => setTab('feedback')}
            >
              2. 系統使用回饋（工程師）
            </button>
          </div>
        }
      />

      <div className="page__header">
        <div>
          <h1>分頁 A｜系統管理</h1>
          <p className="muted">前端原型：可新增/停用帳號、回饋單（資料存於 localStorage）</p>
        </div>
      </div>

      {tab === 'staff' ? (
        <>
          <section className="card">
            <div className="card__title">新增帳號（示意）</div>
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
                <select value={newStaffRole} onChange={(e) => setNewStaffRole(e.target.value as StaffAccount['role'])}>
                  <option value="admin">系統管理</option>
                  <option value="nurse">護理師</option>
                  <option value="dietitian">營養師</option>
                  <option value="caregiver">照服員</option>
                  <option value="slp">口語師</option>
                </select>
              </label>
              <button
                className="btn"
                onClick={() => {
                  const name = newStaffName.trim()
                  const email = newStaffEmail.trim()
                  if (!name || !email) return
                  dispatch({
                    type: 'add_staff',
                    staff: {
                      id: makeId('staff'),
                      name,
                      email,
                      role: newStaffRole,
                      active: true,
                    },
                  })
                  setNewStaffName('')
                  setNewStaffEmail('')
                  setNewStaffRole('nurse')
                }}
              >
                新增
              </button>
            </div>
          </section>

          <section className="card">
            <div className="card__title">工作人員帳號</div>
            <div className="tablewrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>姓名</th>
                    <th>角色</th>
                    <th>Email</th>
                    <th style={{ width: 120 }}>狀態</th>
                    <th style={{ width: 120 }}></th>
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
                        <button className="btn btn--sub" onClick={() => dispatch({ type: 'toggle_staff', id: s.id })}>
                          {s.active ? '停用' : '啟用'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <>
          <section className="card">
            <div className="card__title">送出回饋（示意）</div>
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
                  dispatch({ type: 'add_feedback', feedback: { from, message } })
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
                            dispatch({
                              type: 'update_feedback_status',
                              id: f.id,
                              status: e.target.value as Feedback['status'],
                            })
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
        </>
      )}
    </div>
  )
}
