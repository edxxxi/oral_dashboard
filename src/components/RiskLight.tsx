import type { RiskLevel } from '../store/types'

export function RiskLight({ level, showLabel = true }: { level: RiskLevel; showLabel?: boolean }) {
  const color =
    level === 'high' ? '#ef4444' : level === 'medium' ? '#f59e0b' : '#22c55e'
  const label = level === 'high' ? '紅' : level === 'medium' ? '黃' : '綠'

  return (
    <span
      title={level}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: showLabel ? 8 : 0,
        fontWeight: 600,
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: 999,
          background: color,
          boxShadow: `0 0 0 3px ${color}22`,
        }}
      />
      {showLabel ? label : null}
    </span>
  )
}
