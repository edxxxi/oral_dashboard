import { useState, useMemo } from 'react';
import React from 'react';

interface AssessmentProps {
  onSave: (assessmentData: any) => void;
  onSwitchResident?: () => void;
}

export default function NursingAssessments({ onSave, onSwitchResident }: AssessmentProps) {
  // ==========================================
  // SPMSQ 狀態與邏輯
  // ==========================================
  const [spmsqErrors, setSpmsqErrors] = useState<number[]>([]);
  const [education, setEducation] = useState<'primary' | 'junior' | 'senior'>('junior');

  const spmsqQuestions = [
    '1. 今天是幾年幾月幾日？',
    '2. 今天是星期幾？',
    '3. 這裡是什麼地方？',
    '4. 你的電話號碼是幾號？ (或 4A. 你住在什麼地方？)',
    '5. 你幾歲了？',
    '6. 你的生日是哪一天？',
    '7. 現任總統是誰？',
    '8. 前任總統是誰？',
    '9. 你媽媽叫什麼名字？',
    '10. 從 20 減 3 開始算，一直減下去。'
  ];

  const handleSpmsqToggle = (index: number) => {
    setSpmsqErrors(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const spmsqResult = useMemo(() => {
    const errors = spmsqErrors.length;

    const results = {
      normal: { label: '心智功能完好', styles: { color: '#16a34a', backgroundColor: '#dcfce7' } },
      mild: { label: '輕度智力缺損', styles: { color: '#b45309', backgroundColor: '#fef3c7' } },
      moderate: { label: '中度智力缺損', styles: { color: '#ea580c', backgroundColor: '#ffedd5' } },
      severe: { label: '嚴重智力缺損', styles: { color: '#dc2626', backgroundColor: '#fee2e2' } }
    };

    if (education === 'primary') {
      if (errors <= 3) return results.normal;
      if (errors <= 5) return results.mild;
      if (errors <= 8) return results.moderate;
      return results.severe;
    }
    if (education === 'junior') {
      if (errors <= 2) return results.normal;
      if (errors <= 4) return results.mild;
      if (errors <= 7) return results.moderate;
      return results.severe;
    }
    // senior
    if (errors <= 1) return results.normal;
    if (errors <= 3) return results.mild;
    if (errors <= 6) return results.moderate;
    return results.severe;
  }, [spmsqErrors.length, education]);

  const [notes, setNotes] = useState('');

  const handleSave = () => {
    onSave({
      spmsq: { errors: spmsqErrors.length, education, result: spmsqResult.label },
      notes
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', backgroundColor: '#f9fafb', padding: '32px', borderRadius: '12px' }}>
      
      {/* SPMSQ 區塊 */}
      <div style={{ backgroundColor: '#ffffff', padding: '32px', borderRadius: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: '2px solid #f3f4f6' }}>
        <h2 style={{ fontSize: '31px', fontWeight: 700, color: '#1f2937', marginBottom: '24px', borderBottom: '2px solid #e0e7ff', paddingBottom: '16px', marginTop: 0 }}>
          簡易精神狀態檢查量表 (SPMSQ)
        </h2>
        
        <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontWeight: 600, color: '#374151', fontSize: '26px' }}>個案教育程度：</span>
          <select 
            value={education} 
            onChange={(e: any) => setEducation(e.target.value)}
            style={{ border: '1px solid #d1d5db', borderRadius: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', fontSize: '26px', padding: '12px', outline: 'none', cursor: 'pointer' }}
          >
            <option value="primary">小學</option>
            <option value="junior">一般 (國中)</option>
            <option value="senior">高中以上</option>
          </select>
        </div>

        <p style={{ fontSize: '26px', color: '#6b7280', marginBottom: '32px', marginTop: 0 }}>
          請詢問個案以下問題，若<span style={{ color: '#ef4444', fontWeight: 700 }}>答錯</span>請勾選：
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          {spmsqQuestions.map((q, idx) => {
            const isError = spmsqErrors.includes(idx);
            return (
              <label 
                key={idx} 
                style={{ 
                  display: 'flex', alignItems: 'center', padding: '20px', borderRadius: '12px', 
                  cursor: 'pointer', transition: 'all 0.2s',
                  backgroundColor: isError ? '#fef2f2' : '#f9fafb',
                  border: isError ? '2px solid #fca5a5' : '2px solid #e5e7eb'
                }}
              >
                <input 
                  type="checkbox" 
                  style={{ flexShrink: 0, height: '32px', width: '32px', cursor: 'pointer' }}
                  checked={isError}
                  onChange={() => handleSpmsqToggle(idx)}
                />
                <span style={{ marginLeft: '16px', fontSize: '26px', color: '#374151', lineHeight: 1.6 }}>{q}</span>
              </label>
            )
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#eef2ff', padding: '24px', borderRadius: '16px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ color: '#312e81', fontWeight: 500, fontSize: '31px' }}>
            錯誤題數：<span style={{ fontSize: '44px', fontWeight: 700, marginLeft: '16px' }}>{spmsqErrors.length}</span> 題
          </div>
          <div style={{ padding: '16px 32px', borderRadius: '9999px', fontWeight: 700, fontSize: '31px', ...spmsqResult.styles }}>
            判定結果：{spmsqResult.label}
          </div>
        </div>
      </div>

      {/* 備註區塊 */}
      <div style={{ backgroundColor: '#ffffff', padding: '32px', borderRadius: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: '2px solid #f3f4f6' }}>
        <h2 style={{ fontSize: '31px', fontWeight: 700, color: '#1f2937', marginBottom: '24px', borderBottom: '2px solid #e0e7ff', paddingBottom: '16px', marginTop: 0 }}>
          評估備註
        </h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={{ width: '100%', border: '2px solid #d1d5db', borderRadius: '12px', padding: '16px', fontSize: '26px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
          rows={4}
          placeholder="請輸入本次評估的相關備註事項..."
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', paddingTop: '32px', borderTop: '2px solid #d1d5db' }}>
        <button 
          onClick={handleSave}
          style={{ backgroundColor: '#4f46e5', color: '#ffffff', fontWeight: 700, padding: '16px 40px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: '31px', cursor: 'pointer', border: 'none' }}
        >
          儲存認知功能評估紀錄
        </button>
        {onSwitchResident && (
          <button 
            onClick={onSwitchResident}
            style={{ backgroundColor: '#ffffff', color: '#4b5563', fontWeight: 700, padding: '16px 32px', borderRadius: '12px', border: '2px solid #d1d5db', fontSize: '31px', cursor: 'pointer' }}
          >
            🔄 切換住民
          </button>
        )}
      </div>
    </div>
  );
}