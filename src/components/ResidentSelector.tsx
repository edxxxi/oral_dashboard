import { useStore } from '../store/store'

export function ResidentSelector() {
  const { state, dispatch } = useStore()
  return (
    <label className="field" style={{ minWidth: 220 }}>
      <span className="label">住民</span>
      <select
        value={state.selectedResidentId ?? ''}
        onChange={(e) => dispatch({ type: 'select_resident', id: e.target.value || null })}
      >
        {state.residents.map((r) => (
          <option key={r.id} value={r.id}>
            {r.bedNo}｜{r.name}
          </option>
        ))}
      </select>
    </label>
  )
}
