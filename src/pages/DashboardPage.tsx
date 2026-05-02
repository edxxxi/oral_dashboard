import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { useStore } from '../store/store'

export default function DashboardPage() {
  const { user } = useAuth()
  const { state, dispatch } = useStore()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleLogout = () => {
    // 清除前端 prototype 暫存的登入狀態並重整/導向登入頁
    localStorage.clear()
    window.location.href = '/login'
  }

  // 原有的 5 個分頁功能
  const shortcuts = [
    { name: '系統管理', path: '/system', icon: '⚙️' },
    { name: '住民資料', path: '/residents', icon: '📁' },
    { name: '評估量表', path: '/assessments', icon: '📋' },
    { name: '分析報告', path: '/reports', icon: '📊' },
  ]

  // 根據搜尋框輸入的字串，篩選出符合的住民（床號或姓名任一符合即可）
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
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: '#ffffff',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'sans-serif'
    }}>
      {/* 右上角：使用者資訊與登出選單 */}
      <div style={{ position: 'absolute', top: 16, right: 24 }}>
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          style={{
            width: 40, height: 40, borderRadius: '50%',
            backgroundColor: '#2563eb', color: '#fff',
            border: 'none', cursor: 'pointer', fontSize: 18, fontWeight: 'bold',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          title="使用者選單"
        >
          {user?.name?.[0] || 'U'}
        </button>

        {showUserMenu && (
          <div style={{
            position: 'absolute', top: 50, right: 0,
            backgroundColor: '#fff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            borderRadius: 8, padding: '8px 0',
            width: 160, textAlign: 'center'
          }}>
            <div style={{ padding: '8px 16px', borderBottom: '1px solid #eee', color: '#666', fontSize: 14 }}>
              {user?.name || '使用者'}
            </div>
            <button
              onClick={handleLogout}
              style={{
                display: 'block', width: '100%', padding: '12px 16px',
                border: 'none', background: 'transparent', cursor: 'pointer',
                textAlign: 'center', fontSize: 14, color: '#333'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              切換使用者
            </button>
            <button
              onClick={handleLogout}
              style={{
                display: 'block', width: '100%', padding: '12px 16px',
                border: 'none', background: 'transparent', cursor: 'pointer',
                textAlign: 'center', fontSize: 14, color: '#333'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              登出
            </button>
          </div>
        )}
      </div>

      {/* 中間主要區塊 */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'flex-start',
        paddingTop: '8vh', paddingBottom: '64px'
        }}>
        
        {/* 標題 */}
        <h1 style={{ fontSize: '4.5rem', color: '#202124', marginBottom: '2.5rem', fontWeight: 500 }}>
          口腔護理保健
        </h1>

        {/* 搜尋列 */}
        <div style={{ width: '100%', maxWidth: '584px', position: 'relative' }}>
          <label className="field">
            <span className="label" style={{ fontSize: '16px' }}>搜尋床號 / 姓名</span>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={handleSearchEnter}
              placeholder="例如：A-02 / 林"
              style={{ width: '100%' }}
            />
          </label>

          {/* 搜尋結果下拉選單 */}
          {q.trim() !== '' && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              backgroundColor: '#fff',
              boxShadow: '0 4px 12px rgba(32,33,36,.15)',
              border: '1px solid #dfe1e5',
              borderRadius: '8px',
              marginTop: '4px',
              zIndex: 10,
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              {searchResults.length > 0 ? searchResults.map(r => (
                <div
                  key={r.id}
                  onClick={() => {
                    dispatch({ type: 'select_resident', id: r.id })
                    navigate('/residents') // 跳轉到住民基本資料
                  }}
                  style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f1f3f4', display: 'flex', justifyContent: 'space-between' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <span style={{ fontSize: '16px', color: '#202124' }}>{r.bedNo} - {r.name}</span>
                  <span style={{ color: '#1a73e8', fontSize: '14px' }}>前往資料 &rarr;</span>
                </div>
              )) : (
                <div style={{ padding: '16px', color: '#5f6368', textAlign: 'center' }}>查無符合的住民</div>
              )}
            </div>
          )}
        </div>

        {/* 5個選項（原先側邊欄功能） */}
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
      </div>
    </div>
  )
}
