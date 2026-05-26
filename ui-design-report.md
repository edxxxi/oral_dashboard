# 介面設計報告（口腔功能統合儀表板）

本報告聚焦「架構清晰、操作流暢」的前端設計重點，並挑選能直接表達互動與資訊層級的核心程式碼段落。以下內容可作為展示介面設計思路與實作的最小但完整集合。

## 核心程式碼清單（建議附在報告中）

### 1) 路由與頁面架構（清楚的功能分區）
**檔案：** `src/App.tsx`
```tsx
import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from './auth'
import { AppLayout } from './layout/AppLayout'
import DashboardPage from './pages/DashboardPage'
import SystemPage from './pages/SystemPage'
import ResidentsBasicsPage f與rom './pages/ResidentsBasicsPage'
import AssessmentsPage from './pages/AssessmentsPage'
import ReportPage from './pages/ReportPage'
import LoginPage from './pages/LoginPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/system" element={<SystemPage />} />
        <Route path="/residents" element={<ResidentsBasicsPage />} />
        <Route path="/assessments" element={<AssessmentsPage />} />
        <Route path="/reports" element={<ReportPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
```
**設計重點：** 功能模組化路由，搭配 `AppLayout` 統一外框，讓使用者認知路徑清楚。

### 2) 應用骨架與側欄導覽（資訊階層一致）
**檔案：** `src/layout/AppLayout.tsx`, `src/components/Sidebar.tsx`
```tsx
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
```
```tsx
const allItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/system', label: '分頁 A｜系統管理 / 回饋' },
  { to: '/residents', label: '分頁 B｜住民基本資料' },
  { to: '/assessments', label: '分頁 C｜評估量表' },
  { to: '/reports', label: '分頁 D｜綜合分析報告' },
]

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__title">口腔功能統合儀表板</div>
        <div className="sidebar__subtitle">（Supabase Auth｜登入 + 權限）</div>
      </div>
      <nav className="sidebar__nav">
        {allItems.map((it) => (
          <NavLink key={it.to} to={it.to} className={({ isActive }) => (isActive ? 'navitem navitem--active' : 'navitem')} end={it.to === '/'}>
            {it.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
```
**設計重點：** 一致的導覽與頁面外框、明顯的 Active 狀態，降低學習成本。

### 3) 全域視覺系統（色彩、卡片、互動基礎）
**檔案：** `src/index.css`
```css
:root {
  --bg: #ffffff;
  --panel: #f8f9fa;
  --panel2: #f3f4f6;
  --text: #1f2937;
  --muted: #6b7280;
  --border: #e5e7eb;
  --accent: #2563eb;
}

.app { display: grid; grid-template-columns: 280px 1fr; height: 100vh; }
.sidebar { border-right: 1px solid var(--border); background: linear-gradient(180deg, rgba(248, 249, 250, 0.95), rgba(243, 244, 246, 0.95)); }
.navitem--active { color: #1f2937; background: rgba(37, 99, 235, 0.15); border-color: rgba(37, 99, 235, 0.5); }
.card { background: rgba(255, 255, 255, 0.9); border: 1px solid rgba(229, 231, 235, 0.75); border-radius: 14px; padding: 14px; }
input, select, textarea { border-radius: 10px; padding: 10px 10px; }
input:focus, select:focus, textarea:focus { border-color: rgba(37, 99, 235, 0.9); box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.18); }
```
**設計重點：** 統一色彩、卡片、輸入元件與互動焦點，維持一致的 UI 語言。

### 4) 首頁資訊總覽與捷徑（快速進入、即時統計）
**檔案：** `src/pages/DashboardPage.tsx`
```tsx
const shortcuts = [
  { name: '系統管理', path: '/system', icon: '⚙️' },
  { name: '住民資料', path: '/residents', icon: '📁' },
  { name: '評估量表', path: '/assessments', icon: '📋' },
  { name: '分析報告', path: '/reports', icon: '📊' },
]

const riskCounts = useMemo(() => {
  const latestByResident = new Map<string, (typeof assessments)[number]>()
  for (const assessment of assessments) {
    const existing = latestByResident.get(assessment.residentId)
    if (!existing || assessment.createdAt > existing.createdAt) {
      latestByResident.set(assessment.residentId, assessment)
    }
  }
  let red = 0, yellow = 0, green = 0
  for (const resident of residents) {
    const risk = computeRiskLevel(latestByResident.get(resident.id))
    if (risk === 'high') red += 1
    else if (risk === 'medium') yellow += 1
    else green += 1
  }
  return { red, yellow, green }
}, [assessments, residents])
```
```tsx
<div style={{ display: 'flex', gap: '24px', marginTop: '4rem', flexWrap: 'wrap', justifyContent: 'center' }}>
  {shortcuts.map((sc) => (
    <Link key={sc.path} to={sc.path} style={{ width: 140, height: 140, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 64, height: 64, backgroundColor: '#f1f3f4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', marginBottom: '16px' }}>
        {sc.icon}
      </div>
      <span style={{ fontSize: '18px', fontWeight: 500 }}>{sc.name}</span>
    </Link>
  ))}
</div>
<div style={{ marginTop: '24px', fontSize: '18px', fontWeight: 600, color: '#374151', display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
  <span>住民人數：{residents.length}</span>
  <span style={{ color: '#b91c1c' }}>紅燈：{riskCounts.red}</span>
  <span style={{ color: '#b45309' }}>黃燈：{riskCounts.yellow}</span>
  <span style={{ color: '#15803d' }}>綠燈：{riskCounts.green}</span>
</div>
```
**設計重點：** 首頁是「操作入口 + 即時摘要」，減少跳頁思考成本。

### 5) 住民資料導覽與表單（清楚的流程分段）
**檔案：** `src/pages/ResidentsBasicsPage.tsx`
```tsx
const [view, setView] = useState<'list' | 'add'>('list')

<div style={{ display: 'flex', gap: '12px' }}>
  <button className={view === 'list' ? 'btn' : 'btn btn--sub'} onClick={() => setView('list')}>
    📋 檢視住民資料
  </button>
  <button className={view === 'add' ? 'btn' : 'btn btn--sub'} onClick={() => setView('add')}>
    ➕ 新增住民
  </button>
</div>
```
```tsx
{view === 'add' && (
  <section className="card">
    <div className="card__title" style={{ fontSize: '22px', marginBottom: '16px' }}>病人建檔表單</div>
    <label className="field">
      <span className="label" style={{ fontSize: '18px', fontWeight: 600 }}>姓名</span>
      <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} />
    </label>
  </section>
)}
```
**設計重點：** 以「檢視/新增」雙視角切換，避免資訊過載；表單採卡片式區塊清晰分段。

### 6) 評估量表的多分頁操作（連續工作流）
**檔案：** `src/pages/AssessmentsPage.tsx`
```tsx
const [tab, setTab] = useState<'eat10' | 'mna' | 'rsst' | 'nursing' | 'pataka'>('eat10')

<div style={{ display: 'flex', gap: '12px', borderBottom: '2px solid #e5e7eb', paddingBottom: '16px' }}>
  <button className={tab === 'eat10' ? 'btn' : 'btn btn--sub'} onClick={() => setTab('eat10')}>1. EAT-10 吞嚥篩檢</button>
  <button className={tab === 'mna' ? 'btn' : 'btn btn--sub'} onClick={() => setTab('mna')}>2. MNA-SF 營養篩檢</button>
  <button className={tab === 'rsst' ? 'btn' : 'btn btn--sub'} onClick={() => setTab('rsst')}>3. RSST 唾液吞嚥測試</button>
  <button className={tab === 'nursing' ? 'btn' : 'btn btn--sub'} onClick={() => setTab('nursing')}>4. 認知功能評估 (SPMSQ)</button>
  <button className={tab === 'pataka' ? 'btn' : 'btn btn--sub'} onClick={() => setTab('pataka')}>5. 聲音評估 (Pataka)</button>
</div>
```
**設計重點：** 一次只聚焦一張量表，切換明確、輸入流暢。

### 7) AI 風險與報告視覺化（清楚層級 + 圖表支援）
**檔案：** `src/pages/ReportPage.tsx`
```tsx
<section style={{ backgroundColor: '#ffffff', padding: '32px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
  <div style={{ fontSize: '18px', fontWeight: 600, color: '#6b7280', marginBottom: '16px' }}>AI 綜合風險判定</div>
  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
    <div style={{ transform: 'scale(1.5)' }}><RiskLight level={risk} showLabel={false} /></div>
    <div style={{ fontSize: '36px', fontWeight: 800, color: risk === 'high' ? '#b91c1c' : risk === 'medium' ? '#b45309' : '#15803d' }}>
      {riskText}
    </div>
  </div>
</section>
```
```tsx
<LineChart data={trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
  <XAxis dataKey="month" stroke="#6b7280" tick={{ fill: '#4b5563' }} tickMargin={12} />
  <YAxis yAxisId="left" domain={['auto', 'auto']} stroke="#3b82f6" />
  <YAxis yAxisId="right" orientation="right" domain={[0.5, 3.5]} ticks={[1, 2, 3]} stroke="#ef4444" tickFormatter={(val) => val === 1 ? '低' : val === 2 ? '中' : '高'} />
  <Line yAxisId="left" type="monotone" dataKey="weight" name="體重 (kg)" stroke="#3b82f6" strokeWidth={3} />
  <Line yAxisId="right" type="linear" dataKey="risk" name="AI 風險 (低/中/高)" stroke="#ef4444" strokeWidth={3} />
</LineChart>
```
**設計重點：** 以「風險卡片 + 趨勢圖」建立閱讀節奏，風險層級明確、視覺對比高。

### 8) 風險燈號元件（設計一致性）
**檔案：** `src/components/RiskLight.tsx`
```tsx
export function RiskLight({ level, showLabel = true }: { level: RiskLevel; showLabel?: boolean }) {
  const color = level === 'high' ? '#ef4444' : level === 'medium' ? '#f59e0b' : '#22c55e'
  const label = level === 'high' ? '紅' : level === 'medium' ? '黃' : '綠'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: showLabel ? 8 : 0, fontWeight: 600 }}>
      <span style={{ width: 10, height: 10, borderRadius: 999, background: color, boxShadow: `0 0 0 3px ${color}22` }} />
      {showLabel ? label : null}
    </span>
  )
}
```
**設計重點：** 用可重用元件維持色彩與語意一致，避免視覺噪音。

## 總結：為何這些片段能代表介面設計
1. **架構清晰**：路由 + Layout + Sidebar 明確分區。  
2. **操作流暢**：首頁捷徑、搜尋列、頁籤切換與報告卡片都降低操作摩擦。  
3. **視覺一致**：全域 CSS token + 卡片/按鈕樣式 + 風險燈號元件確保一致語言。  

若需要加強圖示與視覺說明，可再補上首頁與報告頁的截圖。
