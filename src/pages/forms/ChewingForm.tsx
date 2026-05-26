import { useState } from 'react'

export function RSSTForm({ defaultScore, onSubmit, onSwitchResident }: { defaultScore?: number; onSubmit: (patch: any) => void; onSwitchResident?: () => void }) {
  const [count, setCount] = useState<number | ''>(defaultScore ?? '')

  const isRisk = typeof count === 'number' && count <= 2

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ backgroundColor: '#eff6ff', padding: '16px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
        <p style={{ margin: 0, color: '#1e3a8a', fontSize: '18px', fontWeight: 500, lineHeight: 1.6 }}>
          💡 說明：重複唾液吞嚥測試 (RSST)
          <br />
          1. 請民眾正坐。<br />
          2. 濕潤口腔 (以 1 c.c.水濕潤口腔，或喝一口水，吞完後再開始)。<br />
          3. 食指放在舌下，中指放在喉結上方。<br />
          4. 計時 30 秒，計算喉結上下移動次數。<br />
          <span style={{ color: '#dc2626', fontWeight: 600 }}>注意：若次數 ≦ 2 次，即「可能」有吞嚥障礙風險。</span>
        </p>
      </div>

      <div style={{ padding: '24px', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <label style={{ fontSize: '20px', fontWeight: 600, color: '#111827' }}>
          共計：
        </label>
        <input
          type="number"
          min="0"
          value={count}
          onChange={(e) => setCount(e.target.value === '' ? '' : Number(e.target.value))}
          placeholder="次數"
          style={{ width: '150px', padding: '12px 16px', fontSize: '20px', borderRadius: '8px', border: '1px solid #d1d5db' }}
        />
        <span style={{ fontSize: '20px', fontWeight: 600, color: '#111827' }}>次</span>
      </div>

      <div style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        marginTop: '16px', padding: '24px', 
        backgroundColor: typeof count === 'number' ? (isRisk ? '#fef2f2' : '#f0fdf4') : '#f3f4f6', 
        borderRadius: '8px', border: `2px solid ${typeof count === 'number' ? (isRisk ? '#fecaca' : '#bbf7d0') : '#e5e7eb'}` 
      }}>
        <div style={{ fontSize: '24px', fontWeight: 600, color: typeof count === 'number' ? (isRisk ? '#991b1b' : '#166534') : '#6b7280', display: 'flex', alignItems: 'center' }}>
          測驗結果：{typeof count === 'number' ? `${count} 次` : '尚未輸入'}
          {isRisk && <span style={{ marginLeft: '24px', fontSize: '16px', color: '#ef4444', backgroundColor: '#fee2e2', padding: '8px 16px', borderRadius: '20px' }}>⚠️ 具吞嚥障礙風險</span>}
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button 
            className="btn" 
            disabled={count === ''}
            style={{ padding: '16px 40px', fontSize: '18px', opacity: count === '' ? 0.5 : 1, cursor: count === '' ? 'not-allowed' : 'pointer' }} 
            onClick={() => {
              if (typeof count === 'number') {
                onSubmit({ rsstScore: count })
              }
            }}
          >
            儲存評估
          </button>
          {onSwitchResident && (
            <button className="btn btn--sub" style={{ padding: '16px 24px', fontSize: '18px', backgroundColor: '#ffffff', border: '2px solid #d1d5db', color: '#4b5563' }} onClick={onSwitchResident}>
              🔄 切換住民
            </button>
          )}
        </div>
      </div>
    </div>
  )
}