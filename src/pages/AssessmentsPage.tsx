import { useMemo, useState } from 'react'
import { Topbar } from '../components/Topbar'
import { useResidentAssessments, useSelectedResident, useStore } from '../store/store'
import { formatDateTime } from '../utils/date'
import { computeRiskLevel, riskLabel } from '../utils/risk'
import { RiskLight } from '../components/RiskLight'
import { SPMSQForm } from './forms/SPMSQForm'
import { MNAForm } from './forms/MNAForm'
import { SwallowScreenForm } from './forms/SwallowScreenForm'
import { Swallow30sForm } from './forms/Swallow30sForm'
import type { AssessmentRecord } from '../store/types'

export default function AssessmentsPage() {
  const resident = useSelectedResident()
  const { dispatch } = useStore()
  const assessments = useResidentAssessments(resident?.id ?? null)
  const latest = assessments[0]
  const [tab, setTab] = useState<'spmsq' | 'mna' | 'screen' | '30s'>('spmsq')

  const risk = useMemo(() => computeRiskLevel(latest), [latest])

  if (!resident) {
    return (
      <div className="page">
        <Topbar />
        <div className="page__header">
          <h1>分頁 C｜評估量表</h1>
          <p className="muted">請先從上方選擇住民</p>
        </div>
      </div>
    )
  }

  type Patch = Partial<Omit<AssessmentRecord, 'id' | 'residentId' | 'createdAt' | 'monthKey'>>

  const savePatch = (patch: Patch) => {
    dispatch({ type: 'add_assessment', residentId: resident.id, patch })
  }

  return (
    <div className="page">
      <Topbar
        right={
          <div className="seg">
            <button className={tab === 'spmsq' ? 'seg__btn seg__btn--on' : 'seg__btn'} onClick={() => setTab('spmsq')}>
              1. SPMSQ（護理師）
            </button>
            <button className={tab === 'mna' ? 'seg__btn seg__btn--on' : 'seg__btn'} onClick={() => setTab('mna')}>
              2. MNA（營養師）
            </button>
            <button className={tab === 'screen' ? 'seg__btn seg__btn--on' : 'seg__btn'} onClick={() => setTab('screen')}>
              3. 吞嚥篩檢（照服員）
            </button>
            <button className={tab === '30s' ? 'seg__btn seg__btn--on' : 'seg__btn'} onClick={() => setTab('30s')}>
              4. 30 秒吞嚥（口語師）
            </button>
          </div>
        }
      />

      <div className="page__header">
        <div>
          <h1>分頁 C｜評估量表</h1>
          <p className="muted">{resident.bedNo}｜{resident.name}（最近評估：{latest ? formatDateTime(latest.createdAt) : '—'}）</p>
        </div>
        <div className="row" style={{ gap: 10 }}>
          <RiskLight level={risk} />
          <span className="muted">{riskLabel(risk)}</span>
        </div>
      </div>

      <section className="card">
        <div className="card__title">本次評估輸入</div>
        {tab === 'spmsq' ? (
          <SPMSQForm defaultErrors={latest?.spmsqErrors} onSubmit={(d) => savePatch(d)} />
        ) : tab === 'mna' ? (
          <MNAForm defaultScore={latest?.mnaScore} onSubmit={(d) => savePatch(d)} />
        ) : tab === 'screen' ? (
          <SwallowScreenForm defaultValue={latest?.swallowScreen} onSubmit={(d) => savePatch(d)} />
        ) : (
          <Swallow30sForm defaultValue={latest?.swallow30s} onSubmit={(d) => savePatch(d)} />
        )}

        <p className="muted" style={{ marginTop: 10 }}>
          PA-TA-KA 已依你的要求在原型中移除（不做硬體/語音辨識）。
        </p>
      </section>

      <section className="card">
        <div className="card__title">歷史紀錄（示意）</div>
        <div className="tablewrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 160 }}>時間</th>
                <th style={{ width: 90 }}>體重</th>
                <th style={{ width: 110 }}>SPMSQ</th>
                <th style={{ width: 90 }}>MNA</th>
                <th>備註</th>
              </tr>
            </thead>
            <tbody>
              {assessments.slice(0, 10).map((a) => (
                <tr key={a.id}>
                  <td className="muted">{formatDateTime(a.createdAt)}</td>
                  <td>{typeof a.weightKg === 'number' ? `${a.weightKg} kg` : '—'}</td>
                  <td>{typeof a.spmsqErrors === 'number' ? `${a.spmsqErrors} 錯` : '—'}</td>
                  <td>{typeof a.mnaScore === 'number' ? a.mnaScore : '—'}</td>
                  <td className="muted">{a.notes ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
