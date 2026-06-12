import { Outlet } from 'react-router-dom'
import { useStore } from '../store/store'

export function AppLayout() {
  const { loading } = useStore()

  if (loading) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#f8f9fa', zIndex: 9999,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 16 }}>⏳ 載入中...</div>
          <div style={{ color: '#666' }}>初始化應用數據</div>
        </div>
      </div>
    )
  }

  return <Outlet />
}
