import { useMemo, useState } from 'react'

const questions = [
  '1. 硬豆干',
  '2. 炒花生',
  '3. 芭樂(整顆)',
  '4. 炸雞',
  '5. 水煮玉米(整枝)',
  '6. 蘋果/梨子/蓮霧/芭樂(切片)',
  '7. 烤魷魚/雞胗',
  '8. 水煮花枝/滷豬耳朵',
  '9. 柳丁(有切片)',
  '10. 竹筍/敏豆/花椰菜/切片的小黃瓜',
  '11. 煮熟的紅/白蘿蔔',
]

const options = [
  { label: '容易吃', value: 0 },
  { label: '有些吃力', value: 1 },
  { label: '沒辦法吃', value: 2 },
]

export function ChewingForm({ onSubmit }: { defaultScore?: number; onSubmit: (patch: any) => void }) {
  // 預設全選 0 (容易吃)
  const [answers, setAnswers] = useState<number[]>(Array(11).fill(0))

  // 計算「有些吃力(1)」與「沒辦法吃(2)」的總數
  const totalScore = useMemo(() => answers.filter(a => a === 1 || a === 2).length, [answers])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ backgroundColor: '#eff6ff', padding: '16px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
        <p style={{ margin: 0, color: '#1e3a8a', fontSize: '28px', fontWeight: 500, lineHeight: 1.6 }}>
          💡 說明：請評估病人 <strong>6 個月內</strong> 的咀嚼能力。
          <br />
          若「有些吃力」與「沒辦法吃」的食物 <strong>≧ 4 種</strong>，即「可能」有咀嚼障礙風險。
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {questions.map((q, i) => (
          <div key={i} style={{ padding: '24px', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <p style={{ margin: '0 0 20px 0', fontSize: '32px', fontWeight: 600, color: '#111827' }}>{q}</p>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              {options.map((opt) => (
                <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '28px' }}>
                  <input
                    type="radio"
                    name={`chew-q${i}`}
                    value={opt.value}
                    checked={answers[i] === opt.value}
                    onChange={() => {
                      const newAnswers = [...answers]
                      newAnswers[i] = opt.value
                      setAnswers(newAnswers)
                    }}
                    style={{ width: '40px', height: '40px', cursor: 'pointer' }}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        marginTop: '16px', padding: '24px', 
        backgroundColor: totalScore >= 4 ? '#fef2f2' : '#f0fdf4', 
        borderRadius: '8px', border: `2px solid ${totalScore >= 4 ? '#fecaca' : '#bbf7d0'}` 
      }}>
        <div style={{ fontSize: '40px', fontWeight: 600, color: totalScore >= 4 ? '#991b1b' : '#166534', display: 'flex', alignItems: 'center' }}>
          總計：{totalScore} 種 (吃力或無法吃)
          {totalScore >= 4 && <span style={{ marginLeft: '24px', fontSize: '28px', color: '#ef4444', backgroundColor: '#fee2e2', padding: '8px 16px', borderRadius: '20px' }}>⚠️ 具咀嚼障礙風險</span>}
        </div>
        <button className="btn" style={{ padding: '16px 40px', fontSize: '32px' }} onClick={() => onSubmit({ chewingScore: totalScore })}>
          儲存評估
        </button>
      </div>
    </div>
  )
}