import { NavLink } from 'react-router-dom'

const items = [
  { to: '/', label: 'Dashboard' },
  { to: '/system', label: '分頁 A｜系統管理' },
  { to: '/residents', label: '分頁 B｜住民基本資料' },
  { to: '/assessments', label: '分頁 C｜評估量表' },
  { to: '/reports', label: '分頁 D｜綜合分析報告' },
]

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__title">口腔功能統合儀表板</div>
        <div className="sidebar__subtitle">（前端原型｜無後端）</div>
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
