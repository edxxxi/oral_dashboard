import type { RiskLevel } from '../store/types'

export function RiskLight({ level }: { level: RiskLevel }) {
  const color =
    level === 'high' ? '#ef4444' : level === 'medium' ? '#f59e0b' : '#22c55e'
  const label = level === 'high' ? '紅' : level === 'medium' ? '黃' : '綠'

  return (
    <span
      title={level}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
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
      {label}
    </span>
  )
}
