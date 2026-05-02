import { Outlet } from 'react-router-dom'
import { Sidebar } from '../components/Sidebar'
import { useStore } from '../store/store'

export function AppLayout() {
  const { loading } = useStore()
  
  if (loading) {
    return (
      <div className="app">
        <Sidebar />
        <div className="content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 16 }}>⏳ 載入中...</div>
            <div style={{ color: '#666' }}>初始化應用數據</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <Sidebar />
      <div className="content">
        <Outlet />
      </div>
    </div>
  )
}
