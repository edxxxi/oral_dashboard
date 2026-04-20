import { useState } from 'react'

export function SPMSQForm({
  onSubmit,
  defaultErrors,
}: {
  defaultErrors?: number
  onSubmit: (data: { spmsqErrors?: number }) => void
}) {
  const [errors, setErrors] = useState<number>(defaultErrors ?? 0)

  return (
    <div className="form">
      <p className="muted">SPMSQ（簡化示意）：以「錯誤題數」表示（0-10）。</p>

      <label className="field" style={{ maxWidth: 280 }}>
        <span className="label">錯誤題數</span>
        <input
          type="number"
          min={0}
          max={10}
          value={errors}
          onChange={(e) => setErrors(Number(e.target.value))}
        />
      </label>

      <button className="btn" onClick={() => onSubmit({ spmsqErrors: errors })}>
        儲存本次 SPMSQ
      </button>
    </div>
  )
}
