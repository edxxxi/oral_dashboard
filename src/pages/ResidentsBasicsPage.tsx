import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useSelectedResident, useStore } from '../store/store'
import { useAuth } from '../auth'

export default function ResidentsBasicsPage() {
  const resident = useSelectedResident()
  const { dispatch, state } = useStore()
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [q, setQ] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)

  const [view, setView] = useState<'list' | 'add'>('list')
  const [newName, setNewName] = useState('')
  const [newDob, setNewDob] = useState('')

  const [prevResidentId, setPrevResidentId] = useState<string | undefined>(undefined)

  if (resident?.id !== prevResidentId) {
    setPrevResidentId(resident?.id)
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
      setView('list')
      navigate('/residents')
    }
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: '#f8f9fa', zIndex: 9999, overflowY: 'auto',
      fontFamily: 'sans-serif'
    }}>
      {/* 頂部導航欄 (同分頁 A) */}
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
              onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.backgroundColor = '#fff' }}
              onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; e.target.style.backgroundColor = '#f9fafb' }}
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
                    setView('list')
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

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', color: '#111827', margin: '0 0 20px 0' }}>住民資料管理</h1>
          
          {/* 頁籤切換 */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className={view === 'list' ? 'btn' : 'btn btn--sub'} onClick={() => setView('list')} style={{ padding: '8px 16px', fontSize: '15px' }}>
              📋 檢視住民資料
            </button>
            <button className={view === 'add' ? 'btn' : 'btn btn--sub'} onClick={() => setView('add')} style={{ padding: '8px 16px', fontSize: '15px' }}>
              ➕ 新增住民
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* 新增病人資料 */}
          {view === 'add' && (
          <section className="card">
            <div className="card__title" style={{ fontSize: '22px', marginBottom: '16px' }}>病人建檔表單</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px' }}>
              <label className="field">
                <span className="label" style={{ fontSize: '18px', fontWeight: 600 }}>姓名</span>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="輸入病人姓名"
                  style={{ fontSize: '18px', padding: '12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                />
              </label>

              <label className="field">
                <span className="label" style={{ fontSize: '18px', fontWeight: 600 }}>出生年月日</span>
                <input
                  type="date"
                  value={newDob}
                  onChange={(e) => setNewDob(e.target.value)}
                  style={{ fontSize: '18px', padding: '12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                />
              </label>

              <div style={{ borderTop: '1px solid #e5e7eb', margin: '8px 0' }} />

              <label className="field">
                <span className="label" style={{ fontSize: '18px', fontWeight: 600 }}>上傳照片</span>
                <div style={{ backgroundColor: '#f0fdf4', padding: '12px', borderRadius: '6px', border: '1px solid #bbf7d0', marginBottom: '12px' }}>
                  <p style={{ margin: 0, color: '#166534', fontSize: '16px', fontWeight: 500 }}>
                    💡 提示：照片檔案僅限 <strong>JPG</strong> 或 <strong>PNG</strong> 格式。
                  </p>
                </div>
                <input type="file" accept=".jpg,.jpeg,.png" style={{ fontSize: '18px', cursor: 'pointer' }} />
              </label>

              <label className="field" style={{ marginTop: '12px' }}>
                <span className="label" style={{ fontSize: '18px', fontWeight: 600 }}>上傳資料 (病歷摘要 / 口腔檢查表)</span>
                <div style={{ backgroundColor: '#eff6ff', padding: '12px', borderRadius: '6px', border: '1px solid #bfdbfe', marginBottom: '12px' }}>
                  <p style={{ margin: 0, color: '#1e3a8a', fontSize: '16px', fontWeight: 500 }}>
                    💡 提示：病歷與檢查表等資料，僅限上傳 <strong>PDF</strong> 格式。
                  </p>
                </div>
                <input type="file" accept=".pdf" multiple style={{ fontSize: '18px', cursor: 'pointer' }} />
              </label>

              <button
                className="btn"
                style={{ fontSize: '18px', padding: '12px 24px', marginTop: '16px', alignSelf: 'flex-start' }}
                onClick={() => {
                  if (!newName.trim()) return alert('請輸入病人姓名');
                  
                  let age = 65; // 簡易年齡預設值計算
                  if (newDob) {
                    age = new Date().getFullYear() - new Date(newDob).getFullYear();
                  }

                  const newResId = `res-${Date.now()}`;
                  dispatch({
                    type: 'add_resident_local',
                    resident: {
                      id: newResId, bedNo: `New-${Math.floor(Math.random() * 100)}`, name: newName.trim(),
                      age, attachments: [], dietStatus: { feedingMethod: 'oral', dietType: 'full', slpNotes: '', dietitianNotes: '' }
                    } as any
                  });
                  dispatch({ type: 'select_resident', id: newResId });
                  
                  alert(`成功新增病人：${newName.trim()}！已為您自動切換。`);
                  setNewName(''); setNewDob('');
                  setView('list');
                }}
              >
                儲存新增
              </button>
            </div>
          </section>
          )}

          {/* 檢視現有病人資料 */}
          {view === 'list' && (
          <section className="card">
            <div className="card__title" style={{ fontSize: '22px', marginBottom: '16px' }}>檢視現有病人資料</div>
            
            {/* 已選擇病人的詳細資訊（藍底卡片） */}
            {resident && (
              <div style={{ marginBottom: '24px', padding: '32px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                
                {/* 上半部：履歷格式 (左資訊、右照片) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                  {/* 左側資訊 */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                      <h2 style={{ margin: 0, fontSize: '32px', color: '#111827', letterSpacing: '1px' }}>{resident.name}</h2>
                      <span style={{ fontSize: '14px', fontWeight: 500, backgroundColor: '#dcfce7', color: '#166534', padding: '4px 12px', borderRadius: '20px' }}>檢視中</span>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', color: '#4b5563', fontSize: '18px' }}>
                      <div><strong style={{ color: '#111827', display: 'inline-block', width: '120px' }}>床號：</strong>{resident.bedNo}</div>
                      <div><strong style={{ color: '#111827', display: 'inline-block', width: '120px' }}>出生年月日：</strong>{new Date().getFullYear() - resident.age}-01-01 ({resident.age} 歲)</div>
                    </div>
                  </div>
                  
                  {/* 右側照片 */}
                  <div style={{ 
                    width: '130px', height: '160px', backgroundColor: '#f3f4f6', 
                    borderRadius: '8px', border: '2px dashed #d1d5db',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {resident.attachments.some(a => a.name.toLowerCase().match(/\.(jpg|jpeg|png)$/)) 
                      ? <div style={{ fontSize: '14px', color: '#6b7280', textAlign: 'center', padding: '8px' }}>[已有照片記錄]</div>
                      : <span style={{ fontSize: '64px' }}>👤</span>
                    }
                  </div>
                </div>

                {/* 分隔線 */}
                <div style={{ borderTop: '2px solid #f3f4f6', margin: '24px 0' }} />
                
                {/* 下半部：上傳的文件清單 */}
                <div>
                  <span style={{ fontWeight: 600, fontSize: '18px', color: '#111827' }}>已上傳的文件與資料：</span>
                  {resident.attachments.length > 0 ? (
                    <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                      {resident.attachments.map(a => {
                        const isImage = a.name.toLowerCase().match(/\.(jpg|jpeg|png)$/);
                        return (
                          <div key={a.id} style={{ padding: '16px', fontSize: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center' }}>
                            <span style={{ marginRight: '12px', fontSize: '24px' }}>{isImage ? '🖼️' : '📄'}</span> 
                            <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#374151', fontWeight: 500 }}>{a.name}</span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p style={{ color: '#6b7280', margin: '16px 0', fontSize: '16px', backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', border: '1px dashed #d1d5db' }}>尚無上傳任何資料（請由上方表單建檔）。</p>
                  )}
                </div>
              </div>
            )}

            {/* 現有病人列表 */}
            <p style={{ fontSize: '18px', color: '#4b5563', marginBottom: '12px', fontWeight: 600 }}>資料庫病人清單 ({state.residents.length} 筆)</p>
            <div className="tablewrap">
              <table className="table" style={{ fontSize: '16px', width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ width: '15%' }}>床號</th>
                    <th style={{ width: '25%' }}>姓名</th>
                    <th style={{ width: '15%' }}>年齡</th>
                    <th style={{ width: '25%' }}>附件數量</th>
                    <th style={{ width: '20%' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {state.residents.map((r) => (
                    <tr key={r.id} style={{ backgroundColor: resident?.id === r.id ? '#f0fdf4' : 'transparent' }}>
                      <td>{r.bedNo}</td>
                      <td>{r.name}</td>
                      <td>{r.age} 歲</td>
                      <td>{r.attachments.length > 0 ? `${r.attachments.length} 份` : '無'}</td>
                      <td>
                        <button 
                          className={resident?.id === r.id ? "btn" : "btn btn--sub"}
                          style={{ padding: '6px 12px', fontSize: '14px' }}
                          onClick={() => {
                            dispatch({ type: 'select_resident', id: r.id })
                            // 點擊後平滑滾動回上方一點，以查看詳細資訊卡片
                            window.scrollTo({ top: 400, behavior: 'smooth' })
                          }}
                        >
                          {resident?.id === r.id ? '目前檢視' : '檢視資料'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          )}
        </div>
      </main>
    </div>
  )
}
