import React, { useMemo, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth'
import { useStore } from '../store/store'
import { computeRiskLevel } from '../utils/risk'

export default function DashboardPage() {
  const { user, signOut } = useAuth()
  const { state, dispatch } = useStore()
  const { residents, assessments } = state
  const navigate = useNavigate()
  const location = useLocation()
  const [q, setQ] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [hoveredRisk, setHoveredRisk] = useState<'high' | 'medium' | 'low' | null>(null)

  const handleLogout = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  const navItems = [
    { name: '首頁', path: '/' },
    { name: '系統管理', path: '/system' },
    { name: '住民資料', path: '/residents' },
    { name: '評估量表', path: '/assessments' },
    { name: '分析報告', path: '/reports' },
  ]

  const shortcuts = [
    { name: '系統管理', path: '/system', icon: '⚙️' },
    { name: '住民資料', path: '/residents', icon: '📁' },
    { name: '評估量表', path: '/assessments', icon: '📋' },
    { name: '分析報告', path: '/reports', icon: '📊' },
  ]

  // 根據搜尋框輸入的字串，篩選出符合的住民（床號或姓名任一符合即可）
  const searchResults = q.trim() === '' ? [] : residents.filter((r) =>
    r.bedNo.toLowerCase().includes(q.toLowerCase()) ||
    r.name.toLowerCase().includes(q.toLowerCase())
  )

  const riskSummary = useMemo(() => {
    const latestByResident = new Map<string, (typeof assessments)[number]>()
    for (const assessment of assessments) {
      const existing = latestByResident.get(assessment.residentId)
      if (!existing || assessment.createdAt > existing.createdAt) {
        latestByResident.set(assessment.residentId, assessment)
      }
    }

    const groups = {
      high: [] as { id: string; bedNo: string; name: string; label: string }[],
      medium: [] as { id: string; bedNo: string; name: string; label: string }[],
      low: [] as { id: string; bedNo: string; name: string; label: string }[],
    }

    for (const resident of residents) {
      const risk = computeRiskLevel(latestByResident.get(resident.id))
      groups[risk].push({
        id: resident.id,
        bedNo: resident.bedNo,
        name: resident.name,
        label: `${resident.bedNo} ${resident.name}`,
      })
    }

    const sortFn = (a: { bedNo: string; name: string }, b: { bedNo: string; name: string }) =>
      a.bedNo.localeCompare(b.bedNo, undefined, { numeric: true }) || a.name.localeCompare(b.name)

    const sorted = {
      high: [...groups.high].sort(sortFn),
      medium: [...groups.medium].sort(sortFn),
      low: [...groups.low].sort(sortFn),
    }

    return {
      groups: sorted,
      counts: {
        red: sorted.high.length,
        yellow: sorted.medium.length,
        green: sorted.low.length,
      },
    }
  }, [assessments, residents])

  const handleSearchEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchResults.length > 0) {
      dispatch({ type: 'select_resident', id: searchResults[0].id })
      navigate('/residents')
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'linear-gradient(160deg, #dbeafe 0%, #ffffff 60%)',
      zIndex: 9999,
      overflowY: 'auto',
      fontFamily: 'sans-serif'
    }}>
      {/* 頂部導航欄 */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: '64px', backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ fontWeight: 800, fontSize: '20px', marginRight: '16px', color: '#111827' }}>
            🦷 OralCare
          </div>
          {navItems.map(sc => {
            const isActive = location.pathname === sc.path && (sc.path !== '/' || location.pathname === '/')
            return (
              <Link key={sc.path} to={sc.path} style={{
                textDecoration: 'none', padding: '6px 12px', borderRadius: '6px',
                color: isActive ? '#111827' : '#4b5563',
                fontWeight: isActive ? 600 : 500, fontSize: '15px',
                backgroundColor: isActive ? '#f3f4f6' : 'transparent',
                transition: 'all 0.2s'
              }}
                onMouseOver={(e) => !isActive && (e.currentTarget.style.color = '#111827')}
                onMouseOut={(e) => !isActive && (e.currentTarget.style.color = '#4b5563')}>
                {sc.name}
              </Link>
            )
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
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
            {q.trim() !== '' && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, width: '320px',
                backgroundColor: '#fff', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb', borderRadius: '8px', marginTop: '8px',
                maxHeight: '400px', overflowY: 'auto', zIndex: 10
              }}>
                {searchResults.length > 0 ? searchResults.map(r => (
                  <div key={r.id} onClick={() => {
                    dispatch({ type: 'select_resident', id: r.id })
                    navigate('/residents')
                  }} style={{
                    padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
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
                }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  登出
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 中間主要區塊 */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'flex-start',
        paddingTop: '8vh', paddingBottom: '64px'
      }}>
        
        {/* 標題 */}
        <h1 style={{ fontSize: '4.5rem', color: '#1e3a5f', marginBottom: '2.5rem', fontWeight: 500 }}>
          吞嚥功能統合儀表板
        </h1>

        {/* 快速入口 */}
        <div style={{ display: 'flex', gap: '24px', marginTop: '4rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {shortcuts.map((sc) => (
            <Link
              key={sc.path}
              to={sc.path}
              style={{
                width: 140, height: 140,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                textDecoration: 'none', color: '#202124',
                borderRadius: '8px', cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f3f4'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div style={{
                width: 64, height: 64,
                backgroundColor: '#f1f3f4',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '32px', marginBottom: '16px'
              }}>
                {sc.icon}
              </div>
              <span style={{ fontSize: '18px', fontWeight: 500 }}>{sc.name}</span>
            </Link>
          ))}
        </div>
        <div style={{
          marginTop: '24px',
          fontSize: '18px',
          fontWeight: 600,
          color: '#374151',
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <span>住民人數：{residents.length}</span>
          <span
            style={{ color: '#b91c1c', position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            onMouseEnter={() => setHoveredRisk('high')}
            onMouseLeave={() => setHoveredRisk(null)}
          >
            <span style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: '#ef4444' }} />
            紅燈：{riskSummary.counts.red}
            {hoveredRisk === 'high' && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                marginTop: '8px',
                backgroundColor: '#fff',
                color: '#111827',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 8px 16px rgba(0,0,0,0.12)',
                padding: '12px',
                minWidth: '220px',
                maxWidth: '320px',
                zIndex: 20,
              }}>
                <div style={{ fontWeight: 700, marginBottom: '8px' }}>紅燈住民</div>
                {riskSummary.groups.high.length === 0 ? (
                  <div style={{ color: '#6b7280' }}>目前無</div>
                ) : (
                  <div style={{ maxHeight: '220px', overflowY: 'auto', fontWeight: 500 }}>
                    {riskSummary.groups.high.map((r) => (
                      <div key={r.id} style={{ padding: '4px 0', borderBottom: '1px dashed #f3f4f6' }}>
                        {r.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </span>
          <span
            style={{ color: '#b45309', position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            onMouseEnter={() => setHoveredRisk('medium')}
            onMouseLeave={() => setHoveredRisk(null)}
          >
            <span style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: '#f59e0b' }} />
            黃燈：{riskSummary.counts.yellow}
            {hoveredRisk === 'medium' && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                marginTop: '8px',
                backgroundColor: '#fff',
                color: '#111827',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 8px 16px rgba(0,0,0,0.12)',
                padding: '12px',
                minWidth: '220px',
                maxWidth: '320px',
                zIndex: 20,
              }}>
                <div style={{ fontWeight: 700, marginBottom: '8px' }}>黃燈住民</div>
                {riskSummary.groups.medium.length === 0 ? (
                  <div style={{ color: '#6b7280' }}>目前無</div>
                ) : (
                  <div style={{ maxHeight: '220px', overflowY: 'auto', fontWeight: 500 }}>
                    {riskSummary.groups.medium.map((r) => (
                      <div key={r.id} style={{ padding: '4px 0', borderBottom: '1px dashed #f3f4f6' }}>
                        {r.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </span>
          <span
            style={{ color: '#15803d', position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            onMouseEnter={() => setHoveredRisk('low')}
            onMouseLeave={() => setHoveredRisk(null)}
          >
            <span style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: '#22c55e' }} />
            綠燈：{riskSummary.counts.green}
            {hoveredRisk === 'low' && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                marginTop: '8px',
                backgroundColor: '#fff',
                color: '#111827',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 8px 16px rgba(0,0,0,0.12)',
                padding: '12px',
                minWidth: '220px',
                maxWidth: '320px',
                zIndex: 20,
              }}>
                <div style={{ fontWeight: 700, marginBottom: '8px' }}>綠燈住民</div>
                {riskSummary.groups.low.length === 0 ? (
                  <div style={{ color: '#6b7280' }}>目前無</div>
                ) : (
                  <div style={{ maxHeight: '220px', overflowY: 'auto', fontWeight: 500 }}>
                    {riskSummary.groups.low.map((r) => (
                      <div key={r.id} style={{ padding: '4px 0', borderBottom: '1px dashed #f3f4f6' }}>
                        {r.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </span>
        </div>
      </div>
    </div>
  )
}
