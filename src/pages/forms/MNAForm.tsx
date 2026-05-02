import { useMemo, useState } from 'react'

const questions = [
  {
    title: '1. 三個月內有沒有因為食慾不振、消化問題、咀嚼或吞嚥困難而減少食量',
    options: [
      { label: '食量嚴重減少 (0 分)', value: 0 },
      { label: '食量中度減少 (1 分)', value: 1 },
      { label: '食量沒有改變 (2 分)', value: 2 },
    ]
  },
  {
    title: '2. 三個月內體重下降的情況',
    options: [
      { label: '體重下降超過 3 公斤 (0 分)', value: 0 },
      { label: '不知道 (1 分)', value: 1 },
      { label: '體重下降 1―3 公斤 (2 分)', value: 2 },
      { label: '體重沒有下降 (3 分)', value: 3 },
    ]
  },
  {
    title: '3. 活動能力',
    options: [
      { label: '需長期臥床或坐輪椅 (0 分)', value: 0 },
      { label: '可以下床或離開輪椅，但不能外出 (1 分)', value: 1 },
      { label: '可以外出 (2 分)', value: 2 },
    ]
  },
  {
    title: '4. 三個月內有沒有受到心理創傷或患上急性疾病',
    options: [
      { label: '有 (0 分)', value: 0 },
      { label: '沒有 (2 分)', value: 2 },
    ]
  },
  {
    title: '5. 精神心理問題',
    options: [
      { label: '嚴重癡呆或抑鬱 (0 分)', value: 0 },
      { label: '輕度癡呆 (1 分)', value: 1 },
      { label: '沒有精神心理問題 (2 分)', value: 2 },
    ]
  },
  {
    title: '6. 身體質量指數 (BMI) (kg/m²)',
    options: [
      { label: 'BMI 低於 19 (0 分)', value: 0 },
      { label: 'BMI 19 至低於 21 (1 分)', value: 1 },
      { label: 'BMI 21 至低於 23 (2 分)', value: 2 },
      { label: 'BMI 相等或大於 23 (3 分)', value: 3 },
    ]
  }
]

export function MNAForm({
  onSubmit,
  disabled,
}: {
  defaultScore?: number
  disabled?: boolean
  onSubmit: (data: { mnaScore?: number }) => void
}) {
  // 初始化 6 題的答案皆為 0 分
  const [answers, setAnswers] = useState<number[]>(Array(6).fill(0))

  const totalScore = useMemo(() => answers.reduce((a, b) => a + b, 0), [answers])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ backgroundColor: '#eff6ff', padding: '16px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
        <p style={{ margin: 0, color: '#1e3a8a', fontSize: '28px', fontWeight: 500, lineHeight: 1.6 }}>
          💡 說明：簡易營養篩檢表 (MNA-SF)。滿分 14 分。
          <br />
          若總分 <strong>≦ 11 分</strong>，即「可能」有營養不良風險。
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {questions.map((q, i) => (
          <div key={i} style={{ padding: '24px', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <p style={{ margin: '0 0 20px 0', fontSize: '32px', fontWeight: 600, color: '#111827' }}>{q.title}</p>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              {q.options.map((opt) => (
                <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '28px' }}>
                  <input
                    type="radio"
                    name={`mna-q${i}`}
                    value={opt.value}
                    checked={answers[i] === opt.value}
                    disabled={disabled}
                    onChange={() => {
                      const newAnswers = [...answers]
                      newAnswers[i] = opt.value
                      setAnswers(newAnswers)
                    }}
                    style={{ width: '40px', height: '40px', cursor: disabled ? 'not-allowed' : 'pointer' }}
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
        backgroundColor: totalScore <= 11 ? '#fef2f2' : '#f0fdf4', 
        borderRadius: '8px', border: `2px solid ${totalScore <= 11 ? '#fecaca' : '#bbf7d0'}` 
      }}>
        <div style={{ fontSize: '40px', fontWeight: 600, color: totalScore <= 11 ? '#991b1b' : '#166534', display: 'flex', alignItems: 'center' }}>
          總分：{totalScore} 分
          {totalScore <= 11 && <span style={{ marginLeft: '24px', fontSize: '28px', color: '#ef4444', backgroundColor: '#fee2e2', padding: '8px 16px', borderRadius: '20px' }}>⚠️ 具營養不良風險</span>}
        </div>
        <button className="btn" disabled={disabled} style={{ padding: '16px 40px', fontSize: '32px' }} onClick={() => onSubmit({ mnaScore: totalScore })}>
          儲存評估
        </button>
      </div>
    </div>
  )
}
