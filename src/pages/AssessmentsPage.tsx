import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useResidentAssessments, useSelectedResident, useStore } from '../store/store'
import { useAuth } from '../auth'
import { formatDateTime } from '../utils/date'
import { computeRiskLevel, riskLabel } from '../utils/risk'
import { RiskLight } from '../components/RiskLight'
import { SPMSQForm } from './forms/SPMSQForm'
import { MNAForm } from './forms/MNAForm'
import { EAT10Form } from './forms/EAT10Form'
import { ChewingForm } from './forms/ChewingForm'
import NursingAssessments from './forms/NursingAssessments'
import type { AssessmentRecord } from '../store/types'

export default function AssessmentsPage() {
  const resident = useSelectedResident()
  const { state, dispatch, addAssessment } = useStore()
  const { user } = useAuth()
  const location = useLocation()

  const assessments = useResidentAssessments(resident?.id ?? null)
  const latest = assessments[0]
  
  const [tab, setTab] = useState<'eat10' | 'mna' | 'chewing' | 'nursing'>('eat10')
  const [q, setQ] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)

  const risk = useMemo(() => computeRiskLevel(latest), [latest])

  type Patch = Partial<Omit<AssessmentRecord, 'id' | 'residentId' | 'createdAt' | 'monthKey'>>

  const savePatch = (patch: Patch) => {
    if (!resident) return;
    addAssessment(resident.id, patch);
    alert('量表已成功儲存！');
  }

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
                    <span style={{ color: '#3b82f6', fontSize: '13px' }}>評估 &rarr;</span>
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
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', color: '#111827', margin: '0 0 12px 0' }}>評估量表</h1>
        </div>

        {!resident ? (
          <div>
            <div style={{ padding: '48px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px dashed #d1d5db', marginBottom: '24px' }}>
              <span style={{ fontSize: '32px', display: 'block', marginBottom: '16px' }}>📋</span>
              <p style={{ color: '#4b5563', fontSize: '18px', margin: 0 }}>請先從下方清單或上方搜尋列選擇要進行評估的病人。</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {state.residents.map(r => (
                <div 
                  key={r.id} 
                  onClick={() => dispatch({ type: 'select_resident', id: r.id })}
                  style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.border = '1px solid #3b82f6'}
                  onMouseOut={(e) => e.currentTarget.style.border = '1px solid #e5e7eb'}
                >
                  <div>
                    <div style={{ fontSize: '20px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>🛏️ {r.bedNo}</div>
                    <div style={{ fontSize: '18px', color: '#4b5563' }}>{r.name}</div>
                  </div>
                  <div style={{ fontSize: '24px', color: '#3b82f6' }}>&rarr;</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* 履歷表資訊卡 */}
            <div style={{ padding: '24px 32px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                  <h2 style={{ margin: 0, fontSize: '28px', color: '#111827' }}>{resident.name}</h2>
                  <button 
                    onClick={() => dispatch({ type: 'select_resident', id: null })} 
                    style={{ padding: '6px 12px', fontSize: '14px', borderRadius: '16px', backgroundColor: '#f3f4f6', color: '#4b5563', border: '1px solid #d1d5db', cursor: 'pointer' }}
                  >
                    🔄 切換住民
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <RiskLight level={risk} />
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#4b5563' }}>{riskLabel(risk)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '24px', color: '#4b5563', fontSize: '16px' }}>
                  <span><strong>床號：</strong>{resident.bedNo}</span>
                  <span><strong>年齡：</strong>{resident.age} 歲</span>
                  <span><strong>最近評估：</strong>{latest ? formatDateTime(latest.createdAt) : '尚未評估'}</span>
                </div>
              </div>
              
              {/* 照片佔位 */}
              <div style={{ width: '90px', height: '110px', backgroundColor: '#f3f4f6', borderRadius: '8px', border: '1px dashed #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '40px' }}>👤</span>
              </div>
            </div>

            {/* 量表切換頁籤 */}
            <div style={{ display: 'flex', gap: '12px', borderBottom: '2px solid #e5e7eb', paddingBottom: '16px' }}>
              <button className={tab === 'eat10' ? 'btn' : 'btn btn--sub'} onClick={() => setTab('eat10')} style={{ padding: '8px 24px', fontSize: '16px', borderRadius: '20px' }}>
                1. EAT-10 吞嚥篩檢
              </button>
              <button className={tab === 'mna' ? 'btn' : 'btn btn--sub'} onClick={() => setTab('mna')} style={{ padding: '8px 24px', fontSize: '16px', borderRadius: '20px' }}>
                2. MNA-SF 營養篩檢
              </button>
              <button className={tab === 'chewing' ? 'btn' : 'btn btn--sub'} onClick={() => setTab('chewing')} style={{ padding: '8px 24px', fontSize: '16px', borderRadius: '20px' }}>
                3. 咀嚼能力篩檢
              </button>
              <button className={tab === 'nursing' ? 'btn' : 'btn btn--sub'} onClick={() => setTab('nursing')} style={{ padding: '8px 24px', fontSize: '16px', borderRadius: '20px' }}>
                4. 護理評估 (SPMSQ/ADL/IADL)
              </button>
            </div>

            {/* 量表內容區塊 */}
            <section className="card" key={resident.id}>
              <div className="card__title" style={{ fontSize: '20px', marginBottom: '20px' }}>本次評估輸入</div>
              
              {tab === 'eat10' ? (
                <EAT10Form defaultScore={(latest as any)?.eat10Score} onSubmit={(d) => savePatch(d)} />
              ) : tab === 'mna' ? (
                <MNAForm defaultScore={latest?.mnaScore} onSubmit={(d) => savePatch(d)} />
              ) : tab === 'chewing' ? (
                <ChewingForm defaultScore={(latest as any)?.chewingScore} onSubmit={(d) => savePatch(d)} />
              ) : (
                <NursingAssessments onSave={(d) => savePatch({ nursingData: d } as any)} />
              )}
            </section>

            {/* 歷史紀錄 */}
            <section className="card">
              <div className="card__title" style={{ fontSize: '20px', marginBottom: '16px' }}>歷史評估紀錄</div>
              <div className="tablewrap">
                <table className="table" style={{ fontSize: '16px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: 180 }}>評估時間</th>
                      <th style={{ width: 120 }}>EAT-10 分數</th>
                      <th style={{ width: 120 }}>MNA-SF 分數</th>
                      <th style={{ width: 120 }}>咀嚼障礙項</th>
                      <th style={{ width: 140 }}>護理評估紀錄</th>
                      <th style={{ minWidth: 100 }}>備註</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assessments.length === 0 && (
                      <tr><td colSpan={4} style={{ textAlign: 'center', color: '#6b7280', padding: '16px' }}>尚無歷史紀錄</td></tr>
                    )}
                    {assessments.slice(0, 10).map((a) => (
                      <tr key={a.id}>
                        <td className="muted">{formatDateTime(a.createdAt)}</td>
                        <td>{typeof (a as any).eat10Score === 'number' ? `${(a as any).eat10Score} 分` : '—'}</td>
                        <td>{typeof a.mnaScore === 'number' ? a.mnaScore : '—'}</td>
                        <td>{typeof (a as any).chewingScore === 'number' ? `${(a as any).chewingScore} 種` : '—'}</td>
                        <td>
                          {(a as any).nursingData ? (
                            <span style={{ fontSize: '14px', color: '#059669', backgroundColor: '#d1fae5', padding: '4px 8px', borderRadius: '12px' }}>
                              已完成
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="muted">{a.notes ?? '無'}</td>
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
