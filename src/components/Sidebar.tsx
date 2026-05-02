import { NavLink } from 'react-router-dom'
import { useAuth } from '../auth'
import { roleLabel } from '../rbac'

const allItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/system', label: '分頁 A｜系統管理', permission: 'manage:staff' as const },
  { to: '/residents', label: '分頁 B｜住民基本資料' },
  { to: '/assessments', label: '分頁 C｜評估量表' },
  { to: '/reports', label: '分頁 D｜綜合分析報告' },
]

export function Sidebar() {
  const { user, signOut, can } = useAuth()

  const items = allItems.filter((it) => (it as any).permission ? can((it as any).permission) : true)

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__title">口腔功能統合儀表板</div>
        <div className="sidebar__subtitle">（前端原型｜登入 + 權限）</div>
      </div>

      <div style={{ padding: '0 10px 10px' }}>
        <div style={{ fontWeight: 700 }}>{user?.name}</div>
        <div className="muted" style={{ fontSize: 12 }}>
          {user ? `${user.email}｜${roleLabel(user.role)}` : ''}
        </div>
        <div style={{ marginTop: 10 }}>
          <button className="btn btn--sub" style={{ width: '100%' }} onClick={signOut}>
            登出
          </button>
        </div>
      </div>

      <nav className="sidebar__nav">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }) => (isActive ? 'navitem navitem--active' : 'navitem')}
            end={it.to === '/'}
          >
            {it.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
