import { ResidentSelector } from './ResidentSelector'

export function Topbar({ right }: { right?: React.ReactNode }) {
  return (
    <header className="topbar">
      <div className="topbar__left">
        <ResidentSelector />
      </div>
      <div className="topbar__right">{right}</div>
    </header>
  )
}
