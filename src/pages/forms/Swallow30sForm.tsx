import { useState } from 'react'
import type { AssessmentRecord } from '../../store/types'

export function Swallow30sForm({
  onSubmit,
  defaultValue,
}: {
  defaultValue?: AssessmentRecord['swallow30s']
  onSubmit: (data: { swallow30s?: AssessmentRecord['swallow30s'] }) => void
}) {
  const [swallows, setSwallows] = useState<number>(defaultValue?.swallows ?? 4)
  const [cough, setCough] = useState<boolean>(defaultValue?.cough ?? false)

  return (
    <div className="form">
      <p className="muted">30 秒吞嚥測驗（示意）：記錄吞嚥次數與是否咳嗽。</p>

      <div className="row" style={{ gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <label className="field" style={{ maxWidth: 280 }}>
          <span className="label">30 秒內吞嚥次數</span>
          <input type="number" min={0} max={20} value={swallows} onChange={(e) => setSwallows(Number(e.target.value))} />
        </label>
        <label className="check">
          <input type="checkbox" checked={cough} onChange={(e) => setCough(e.target.checked)} />
          測驗中出現咳嗽/嗆咳
        </label>
      </div>

      <button className="btn" onClick={() => onSubmit({ swallow30s: { swallows, cough } })}>
        儲存本次 30 秒吞嚥
      </button>
    </div>
  )
}
