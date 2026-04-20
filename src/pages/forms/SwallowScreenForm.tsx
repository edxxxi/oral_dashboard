import { useState } from 'react'
import type { AssessmentRecord } from '../../store/types'

export function SwallowScreenForm({
  onSubmit,
  defaultValue,
}: {
  defaultValue?: AssessmentRecord['swallowScreen']
  onSubmit: (data: { swallowScreen?: AssessmentRecord['swallowScreen'] }) => void
}) {
  const [v, setV] = useState({
    coughWhenDrinking: defaultValue?.coughWhenDrinking ?? false,
    wetVoice: defaultValue?.wetVoice ?? false,
    chokingHistory: defaultValue?.chokingHistory ?? false,
    needsAssistFeeding: defaultValue?.needsAssistFeeding ?? false,
  })

  return (
    <div className="form">
      <p className="muted">吞嚥能力篩檢（示意）：勾選可能風險徵象。</p>

      <div className="checkgrid">
        <label className="check">
          <input
            type="checkbox"
            checked={v.coughWhenDrinking}
            onChange={(e) => setV((p) => ({ ...p, coughWhenDrinking: e.target.checked }))}
          />
          喝水/進食易咳嗽
        </label>
        <label className="check">
          <input type="checkbox" checked={v.wetVoice} onChange={(e) => setV((p) => ({ ...p, wetVoice: e.target.checked }))} />
          濕濁聲/聲音改變
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={v.chokingHistory}
            onChange={(e) => setV((p) => ({ ...p, chokingHistory: e.target.checked }))}
          />
          近期有嗆咳史
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={v.needsAssistFeeding}
            onChange={(e) => setV((p) => ({ ...p, needsAssistFeeding: e.target.checked }))}
          />
          需要他人協助餵食
        </label>
      </div>

      <button className="btn" onClick={() => onSubmit({ swallowScreen: v })}>
        儲存本次吞嚥篩檢
      </button>
    </div>
  )
}
