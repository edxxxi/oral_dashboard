import { useMemo, useState } from 'react'

const questions = [
  '1. 吞嚥問題讓我的體重減輕(嚴重者需加做 MNA-SF)',
  '2. 因為吞嚥問題不能在外面用餐',
  '3. 我喝飲料/水很費力',
  '4. 我吃固體食物很費力',
  '5. 我吞藥丸很費力',
  '6. 吞嚥會感覺到痛',
  '7. 因為吞嚥問題不能享受用餐',
  '8. 吞嚥後感覺喉嚨有食物卡著(嚴重者需加做 MNA-SF)',
  '9. 當我進食的時候會咳嗽(嚴重者需加做 MNA-SF)',
  '10. 吞嚥讓我感覺緊張有壓力',
]

const options = [
  { label: '沒有 (0 分)', value: 0 },
  { label: '很少 (1 分)', value: 1 },
  { label: '偶爾 (2 分)', value: 2 },
  { label: '經常 (3 分)', value: 3 },
  { label: '嚴重 (4 分)', value: 4 },
]

export function EAT10Form({ onSubmit }: { defaultScore?: number; onSubmit: (patch: any) => void }) {
  const [answers, setAnswers] = useState<number[]>(Array(10).fill(0))

  const totalScore = useMemo(() => answers.reduce((a, b) => a + b, 0), [answers])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ backgroundColor: '#eff6ff', padding: '16px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
        <p style={{ margin: 0, color: '#1e3a8a', fontSize: '28px', fontWeight: 500, lineHeight: 1.6 }}>
          💡 說明：請詢問病人過去 <strong>3 個月內</strong> 是否有以下問題。
          <br />
          若總分 <strong>≧ 3 分</strong>，即「可能」有吞嚥障礙風險。
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
                    name={`eat10-q${i}`}
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
        backgroundColor: totalScore >= 3 ? '#fef2f2' : '#f0fdf4', 
        borderRadius: '8px', border: `2px solid ${totalScore >= 3 ? '#fecaca' : '#bbf7d0'}` 
      }}>
        <div style={{ fontSize: '40px', fontWeight: 600, color: totalScore >= 3 ? '#991b1b' : '#166534', display: 'flex', alignItems: 'center' }}>
          總分：{totalScore} 分
          {totalScore >= 3 && <span style={{ marginLeft: '24px', fontSize: '28px', color: '#ef4444', backgroundColor: '#fee2e2', padding: '8px 16px', borderRadius: '20px' }}>⚠️ 具吞嚥障礙風險</span>}
        </div>
        <button className="btn" style={{ padding: '16px 40px', fontSize: '32px' }} onClick={() => onSubmit({ eat10Score: totalScore })}>
          儲存評估
        </button>
      </div>
    </div>
  )
}