import { useMemo, useState } from 'react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Topbar } from '../components/Topbar'
import { RiskLight } from '../components/RiskLight'
import { useResidentAssessments, useSelectedResident, useStore } from '../store/store'
import { dietLabel, computeRiskLevel, recommendDiet, riskLabel } from '../utils/risk'
import { formatDateTime } from '../utils/date'

export default function ReportPage() {
  const resident = useSelectedResident()
  const { dispatch } = useStore()
  const assessments = useResidentAssessments(resident?.id ?? null)
  const latest = assessments[0]

  const risk = useMemo(() => computeRiskLevel(latest), [latest])
  const recommended = useMemo(() => dietLabel(recommendDiet(risk)), [risk])

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
      }))
  }, [assessments])

  const [prevResidentId, setPrevResidentId] = useState<string | undefined>(undefined)
  const [doctorNote, setDoctorNote] = useState('')

  if (resident?.id !== prevResidentId) {
    setPrevResidentId(resident?.id)
    setDoctorNote('')
  }

  if (!resident) {
    return (
      <div className="page">
        <Topbar />
        <div className="page__header">
          <h1>分頁 D｜綜合分析報告</h1>
          <p className="muted">請先從上方選擇住民</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <Topbar />

      <div className="page__header">
        <div>
          <h1>分頁 D｜綜合分析報告</h1>
          <p className="muted">{resident.bedNo}｜{resident.name}（最近評估：{latest ? formatDateTime(latest.createdAt) : '—'}）</p>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <section className="card">
          <div className="card__title">1. AI 風險判定（紅黃綠燈）</div>
          <div className="row" style={{ gap: 12, alignItems: 'center' }}>
            <div style={{ fontSize: 20 }}>
              <RiskLight level={risk} />
            </div>
            <div className="muted">{riskLabel(risk)}</div>
          </div>
          <div className="hint" style={{ marginTop: 12 }}>
            <div className="hint__title">說明</div>
            <div className="hint__body">
              本原型以「認知（SPMSQ）/營養（MNA）/吞嚥篩檢/30秒吞嚥/體重」做簡化加權，示意紅黃綠燈分級。
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card__title">2. 餐食建議</div>
          <div className="row" style={{ gap: 10, alignItems: 'center' }}>
            <span className="tag tag--ok">建議</span>
            <div style={{ fontWeight: 700 }}>{recommended}</div>
          </div>
          <p className="muted" style={{ marginTop: 8 }}>
            a. 普通飲食（Full Diet）／b. 軟質飲食（Soft Diet）／c. 流質飲食（Liquid diet）
          </p>
        </section>
      </div>

      <section className="card">
        <div className="card__title">3. 歷史趨勢圖（每月評估一次）</div>
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" domain={['auto', 'auto']} />
              <YAxis yAxisId="right" orientation="right" domain={[1, 3]} ticks={[1, 2, 3]} />
              <Tooltip />
              <Line yAxisId="left" type="monotone" dataKey="weight" name="體重(kg)" stroke="#2563eb" strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="step" dataKey="risk" name="風險(1綠/2黃/3紅)" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="card">
        <div className="card__title">4. 醫師建議 / 轉介（示意）</div>
        <label className="field">
          <span className="label">建議內容</span>
          <textarea value={doctorNote} onChange={(e) => setDoctorNote(e.target.value)} rows={4} placeholder="例如：建議進一步吞嚥攝影檢查…" />
        </label>
        <button
          className="btn"
          onClick={() => {
            const content = doctorNote.trim()
            if (!content) return
            // Simplified: save as a feedback to keep store small.
            dispatch({
              type: 'add_feedback',
              feedback: { from: '醫師/轉介', message: `【${resident.bedNo} ${resident.name}】${content}` },
            })
            setDoctorNote('')
          }}
        >
          儲存（示意）
        </button>
        <p className="muted" style={{ marginTop: 8 }}>
          註：本原型未做後端，因此此處暫以「回饋清單」形式保存示意。
        </p>
      </section>
    </div>
  )
}
