import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import { RiskLight } from '../components/RiskLight'
import { useResidentAssessments, useSelectedResident, useStore } from '../store/store'
import { useAuth } from '../auth'
import { dietLabel, computeRiskLevel, recommendDiet, riskLabel } from '../utils/risk'
import { formatDateTime } from '../utils/date'

export default function ReportPage() {
  const resident = useSelectedResident()
  const { state, dispatch } = useStore()
  const { user } = useAuth()
  const location = useLocation()

  const assessments = useResidentAssessments(resident?.id ?? null)
  const latest = assessments[0]

  const risk = useMemo(() => computeRiskLevel(latest), [latest])
  const riskText = riskLabel(risk)
  const recommended = useMemo(() => dietLabel(recommendDiet(risk)), [risk])

  const dietDescription = useMemo(() => {
    if (recommended.includes('普通')) return '適合咀嚼與吞嚥功能正常者，提供一般均衡營養的常規餐點，食物無需特別處理。';
    if (recommended.includes('軟質')) return '適合咀嚼能力較弱或輕微吞嚥困難者，食物質地需較軟嫩、易切斷與消化，如碎肉、煮爛的蔬菜等。';
    if (recommended.includes('流質') || recommended.includes('糊狀')) return '適合有明顯吞嚥障礙或無法咀嚼者，食物需打碎呈泥狀或流質糊狀，以降低嗆咳風險。';
    return '請依據臨床醫師或營養師、語言治療師的專業評估為準。';
  }, [recommended])

  const trend = useMemo(() => {
    const byMonth = new Map<string, typeof latest>()
    for (const a of [...assessments].reverse()) {
      byMonth.set(a.monthKey, a)
    }
    return [...byMonth.entries()]
      .sort((a, b) => (a[0] > b[0] ? 1 : -1))
      .map(([monthKey, a]) => ({
        month: monthKey,
        weight: typeof a.weightKg === 'number' ? a.weightKg : null,
        risk: computeRiskLevel(a) === 'high' ? 3 : computeRiskLevel(a) === 'medium' ? 2 : 1,
        adl: (a as any)?.nursingData?.adl?.total ?? null,
      }))
  }, [assessments])

  const nursingData = (latest as any)?.nursingData

  const [q, setQ] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)

  // 登出功能
  const handleLogout = () => {
    localStorage.clear()
    window.location.href = '/login'
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
    }
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: '#f8f9fa', zIndex: 9999, overflowY: 'auto',
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
            />
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
                    setQ('')
                  }} style={{
                    padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '15px', color: '#111827', fontWeight: 500 }}>{r.bedNo} - {r.name}</span>
                    <span style={{ color: '#3b82f6', fontSize: '13px' }}>看報告 &rarr;</span>
                  </div>
                )) : (
                  <div style={{ padding: '16px', color: '#6b7280', textAlign: 'center', fontSize: '14px' }}>查無符合的病人</div>
                )}
              </div>
            )}
          </div>

          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowUserMenu(!showUserMenu)} style={{
              width: 36, height: 36, borderRadius: '50%', backgroundColor: '#2563eb',
              color: '#fff', border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 'bold'
            }}>
              {user?.name?.[0] || 'U'}
            </button>
            {showUserMenu && (
              <div style={{
                position: 'absolute', top: 48, right: 0, backgroundColor: '#fff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)', borderRadius: 8, padding: '8px 0', width: 160
              }}>
                <button onClick={handleLogout} style={{ width: '100%', padding: '12px', border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}>登出</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: '28px', color: '#111827', margin: '0 0 8px 0' }}>綜合分析報告</h1>
            {resident && (
              <div style={{ color: '#4b5563', fontSize: '16px' }}>
                <span><strong>{resident.bedNo}</strong> ｜ {resident.name}</span>
                <span style={{ margin: '0 12px', color: '#d1d5db' }}>|</span>
                <span>最近評估：{latest ? formatDateTime(latest.createdAt) : '尚未評估'}</span>
              </div>
            )}
          </div>
        </div>

        {!resident ? (
          <div style={{ padding: '48px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px dashed #d1d5db' }}>
            <span style={{ fontSize: '32px', display: 'block', marginBottom: '16px' }}>📊</span>
            <p style={{ color: '#4b5563', fontSize: '18px', margin: 0 }}>請先從上方搜尋列選擇要查看報告的病人。</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* 1. 放大版：風險與餐食 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <section style={{ backgroundColor: '#ffffff', padding: '32px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#6b7280', marginBottom: '16px' }}>AI 綜合風險判定</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ transform: 'scale(1.5)' }}><RiskLight level={risk} /></div>
                  <div style={{ fontSize: '36px', fontWeight: 800, color: risk === 'high' ? '#b91c1c' : risk === 'medium' ? '#b45309' : '#15803d' }}>
                    {riskText}
                  </div>
                </div>
              </section>

              <section style={{ backgroundColor: '#ffffff', padding: '32px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#6b7280', marginBottom: '16px' }}>系統餐食建議</div>
                <div style={{ fontSize: '36px', fontWeight: 800, color: '#1e40af', backgroundColor: '#eff6ff', padding: '8px 24px', borderRadius: '12px' }}>
                  {recommended}
                </div>
                <div style={{ marginTop: '16px', fontSize: '15px', color: '#4b5563', lineHeight: '1.6', maxWidth: '85%' }}>
                  {dietDescription}
                </div>
              </section>
            </div>

            {/* 2. 護理評估結果 (如果有資料) */}
            {nursingData && (
              <section style={{ backgroundColor: '#ffffff', padding: '24px 32px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '20px', borderBottom: '2px solid #f3f4f6', paddingBottom: '12px' }}>最新護理評估指標</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                  <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', border: '1px solid #f3f4f6' }}>
                    <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>SPMSQ 心智功能</div>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: '#4338ca' }}>{nursingData.spmsq?.result || '—'}</div>
                  </div>
                  <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', border: '1px solid #f3f4f6' }}>
                    <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>ADL 日常生活功能</div>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: '#047857' }}>{nursingData.adl?.total ?? '—'} <span style={{ fontSize: '16px', fontWeight: 500, color: '#6b7280' }}>/ 100 分</span></div>
                  </div>
                  <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', border: '1px solid #f3f4f6' }}>
                    <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>IADL 工具性日常生活</div>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: nursingData.iadl?.isMildDisabled ? '#b91c1c' : '#047857' }}>
                      {nursingData.iadl?.isMildDisabled ? '輕度失能' : '正常'} 
                      <span style={{ fontSize: '16px', fontWeight: 500, color: '#6b7280', marginLeft: '8px' }}>({nursingData.iadl?.total ?? '—'} / 24 分)</span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* 3. 趨勢圖 (點狀折線圖) */}
            <section style={{ backgroundColor: '#ffffff', padding: '24px 32px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '24px' }}>歷史趨勢變化</div>
              <div style={{ height: 320, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" tick={{ fill: '#4b5563' }} tickMargin={12} />
                    <YAxis yAxisId="left" domain={['auto', 'auto']} stroke="#3b82f6" tick={{ fill: '#3b82f6' }} />
                    <YAxis yAxisId="right" orientation="right" domain={[0.5, 3.5]} ticks={[1, 2, 3]} stroke="#ef4444" tick={{ fill: '#ef4444' }} tickFormatter={(val) => val === 1 ? '低' : val === 2 ? '中' : '高'} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                    <Legend verticalAlign="top" height={36} />
                    {/* 加入顯眼的資料點 dot */}
                    <Line yAxisId="left" type="monotone" dataKey="weight" name="體重 (kg)" stroke="#3b82f6" strokeWidth={3} dot={{ r: 6, fill: '#ffffff', strokeWidth: 2 }} activeDot={{ r: 8, fill: '#3b82f6' }} />
                    <Line yAxisId="left" type="monotone" dataKey="adl" name="ADL 總分" stroke="#10b981" strokeWidth={3} dot={{ r: 6, fill: '#ffffff', strokeWidth: 2 }} activeDot={{ r: 8, fill: '#10b981' }} />
                    <Line yAxisId="right" type="linear" dataKey="risk" name="AI 風險 (低/中/高)" stroke="#ef4444" strokeWidth={3} dot={{ r: 6, fill: '#ffffff', strokeWidth: 2 }} activeDot={{ r: 8, fill: '#ef4444' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

          </div>
        )}
      </main>
    </div>
  )
}
