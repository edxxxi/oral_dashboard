import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ResidentAvatar } from '../components/ResidentAvatar'
import { RiskLight } from '../components/RiskLight'
import { useStore } from '../store/store'
import type { RiskLevel } from '../store/types'
import { computeRiskLevel, riskLabel } from '../utils/risk'
import { formatDateTime } from '../utils/date'

export default function DashboardPage() {
  const { state, dispatch } = useStore()
  const [q, setQ] = useState('')
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all')

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase()
    return state.residents
      .map((r) => {
        const latest = [...state.assessments]
          .filter((a) => a.residentId === r.id)
          .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0]
        const risk = computeRiskLevel(latest)
        return { resident: r, latest, risk }
      })
      .filter(({ resident, risk }) => {
        if (riskFilter !== 'all' && risk !== riskFilter) return false
        if (!query) return true
        return (
          resident.bedNo.toLowerCase().includes(query) ||
          resident.name.toLowerCase().includes(query)
        )
      })
      .sort((a, b) => (a.resident.bedNo > b.resident.bedNo ? 1 : -1))
  }, [q, riskFilter, state.assessments, state.residents])

  const summary = useMemo(() => {
    const counts: Record<RiskLevel, number> = { low: 0, medium: 0, high: 0 }
    for (const r of rows) counts[r.risk] += 1
    return counts
  }, [rows])

  const chartData = useMemo(
    () => [
      { name: '綠', value: summary.low },
      { name: '黃', value: summary.medium },
      { name: '紅', value: summary.high },
    ],
    [summary],
  )

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>首頁 Dashboard｜全景監控</h1>
          <p className="muted">所有住民紅黃綠燈狀態一覽（含搜尋/篩選）</p>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1.1fr 0.9fr' }}>
        <section className="card">
          <div className="card__title">搜尋 / 篩選</div>
          <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
            <label className="field" style={{ minWidth: 260 }}>
              <span className="label">床號 / 姓名</span>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="例如：A-02 / 林" />
            </label>
            <label className="field" style={{ minWidth: 220 }}>
              <span className="label">風險等級</span>
              <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value as RiskLevel | 'all')}>
                <option value="all">全部</option>
                <option value="low">綠燈（低風險）</option>
                <option value="medium">黃燈（中風險）</option>
                <option value="high">紅燈（高風險）</option>
              </select>
            </label>
          </div>
        </section>

        <section className="card">
          <div className="card__title">風險分佈</div>
          <div style={{ height: 140 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={26}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="card">
        <div className="card__title">住民清單（點選可切換住民，並前往分頁 B/C/D）</div>
        <div className="tablewrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 84 }}>床號</th>
                <th style={{ width: 64 }}>照片</th>
                <th>姓名</th>
                <th style={{ width: 160 }}>紅黃綠燈</th>
                <th style={{ width: 160 }}>最近評估</th>
                <th style={{ width: 240 }}>快速連結</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ resident, latest, risk }) => (
                <tr key={resident.id}>
                  <td>{resident.bedNo}</td>
                  <td>
                    <ResidentAvatar resident={resident} size={28} />
                  </td>
                  <td>
                    <button
                      className="link"
                      onClick={() => dispatch({ type: 'select_resident', id: resident.id })}
                      title="切換為此住民"
                    >
                      {resident.name}
                    </button>
                  </td>
                  <td>
                    <div className="row" style={{ gap: 10 }}>
                      <RiskLight level={risk} />
                      <span className="muted">{riskLabel(risk)}</span>
                    </div>
                  </td>
                  <td>{latest ? formatDateTime(latest.createdAt) : '—'}</td>
                  <td className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
                    <Link className="pill" to="/residents">
                      分頁 B
                    </Link>
                    <Link className="pill" to="/assessments">
                      分頁 C
                    </Link>
                    <Link className="pill" to="/reports">
                      分頁 D
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="muted" style={{ marginTop: 10 }}>
        註：本原型僅示意資料呈現與儀表板互動；不含後端、controller、硬體與語音辨識。
      </p>
    </div>
  )
}
