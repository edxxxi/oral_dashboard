import { useState } from 'react'

export function MNAForm({
  onSubmit,
  defaultScore,
}: {
  defaultScore?: number
  onSubmit: (data: { mnaScore?: number }) => void
}) {
  const [score, setScore] = useState<number>(defaultScore ?? 12)

  return (
    <div className="form">
      <p className="muted">MNA（簡化示意）：0-14 分。分數越低代表營養風險越高。</p>

      <label className="field" style={{ maxWidth: 280 }}>
        <span className="label">MNA 分數</span>
        <input type="number" min={0} max={14} value={score} onChange={(e) => setScore(Number(e.target.value))} />
      </label>

      <button className="btn" onClick={() => onSubmit({ mnaScore: score })}>
        儲存本次 MNA
      </button>
    </div>
  )
}
