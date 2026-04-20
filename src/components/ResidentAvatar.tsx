import type { Resident } from '../store/types'

export function ResidentAvatar({ resident, size = 32 }: { resident: Resident; size?: number }) {
  if (resident.photoUrl) {
    return (
      <img
        src={resident.photoUrl}
        alt={resident.name}
        style={{ width: size, height: size, borderRadius: 999, objectFit: 'cover' }}
      />
    )
  }

  const initial = resident.name.slice(0, 1)
  const bg = hashColor(resident.id)

  return (
    <span
      aria-label={resident.name}
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        background: bg,
        color: 'white',
      }}
    >
      {initial}
    </span>
  )
}

function hashColor(input: string) {
  let h = 0
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0
  const hue = h % 360
  return `hsl(${hue} 70% 45%)`
}
