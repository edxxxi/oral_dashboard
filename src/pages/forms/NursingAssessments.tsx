import { useState, useMemo } from 'react';

interface AssessmentProps {
  onSave: (assessmentData: any) => void;
}

export default function NursingAssessments({ onSave }: AssessmentProps) {
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
    if (education === 'primary') {
      if (errors <= 3) return { label: '心智功能完好', color: 'text-green-600 bg-green-100' };
      if (errors <= 5) return { label: '輕度智力缺損', color: 'text-yellow-700 bg-yellow-100' };
      if (errors <= 8) return { label: '中度智力缺損', color: 'text-orange-600 bg-orange-100' };
      return { label: '嚴重智力缺損', color: 'text-red-600 bg-red-100' };
    }
    if (education === 'junior') {
      if (errors <= 2) return { label: '心智功能完好', color: 'text-green-600 bg-green-100' };
      if (errors <= 4) return { label: '輕度智力缺損', color: 'text-yellow-700 bg-yellow-100' };
      if (errors <= 7) return { label: '中度智力缺損', color: 'text-orange-600 bg-orange-100' };
      return { label: '嚴重智力缺損', color: 'text-red-600 bg-red-100' };
    }
    // senior
    if (errors <= 1) return { label: '心智功能完好', color: 'text-green-600 bg-green-100' };
    if (errors <= 3) return { label: '輕度智力缺損', color: 'text-yellow-700 bg-yellow-100' };
    if (errors <= 6) return { label: '中度智力缺損', color: 'text-orange-600 bg-orange-100' };
    return { label: '嚴重智力缺損', color: 'text-red-600 bg-red-100' };
  }, [spmsqErrors.length, education]);

  // ==========================================
  // ADL 狀態與邏輯
  // ==========================================
  const [adlScores, setAdlScores] = useState<Record<string, number>>({});

  const adlQuestions = [
    { id: 'q1', title: '1. 進食', options: [{ label: '不需協助', score: 10 }, { label: '需部分協助', score: 5 }, { label: '完全依賴', score: 0 }] },
    { id: 'q2', title: '2. 移位', options: [{ label: '不需協助', score: 15 }, { label: '需些微協助', score: 10 }, { label: '需大量協助', score: 5 }, { label: '完全依賴', score: 0 }] },
    { id: 'q3', title: '3. 如廁', options: [{ label: '不需協助', score: 10 }, { label: '需部分協助', score: 5 }, { label: '完全依賴', score: 0 }] },
    { id: 'q4', title: '4. 洗澡', options: [{ label: '可自行完成', score: 5 }, { label: '需協助或監督', score: 0 }] },
    { id: 'q5', title: '5. 平地走動', options: [{ label: '不需協助 (>50m)', score: 15 }, { label: '需稍微扶持', score: 10 }, { label: '可操作輪椅', score: 5 }, { label: '完全依賴', score: 0 }] },
    { id: 'q6', title: '6. 穿脫衣褲鞋襪', options: [{ label: '不需協助', score: 10 }, { label: '需部分協助', score: 5 }, { label: '完全依賴', score: 0 }] },
    { id: 'q7', title: '7. 個人衛生', options: [{ label: '可自行完成', score: 5 }, { label: '需協助', score: 0 }] },
    { id: 'q8', title: '8. 上下樓梯', options: [{ label: '不需協助', score: 10 }, { label: '需稍微扶持', score: 5 }, { label: '完全依賴', score: 0 }] },
    { id: 'q9', title: '9. 大便控制', options: [{ label: '不會失禁', score: 10 }, { label: '偶爾失禁', score: 5 }, { label: '完全失禁', score: 0 }] },
    { id: 'q10', title: '10. 小便控制', options: [{ label: '不會失禁', score: 10 }, { label: '偶爾失禁', score: 5 }, { label: '完全失禁', score: 0 }] }
  ];

  const adlTotal = Object.values(adlScores).reduce((a, b) => a + b, 0);

  // ==========================================
  // IADL 狀態與邏輯
  // ==========================================
  const [iadlScores, setIadlScores] = useState<Record<string, number>>({});
  const [iadlNotApp, setIadlNotApp] = useState<Record<string, boolean>>({});

  const iadlQuestions = [
    { id: 'i1', title: '1. 上街購物', max: 3, failScores: [1, 0], options: [{ label: '獨立完成', score: 3 }, { label: '買日用品', score: 2 }, { label: '需人陪同', score: 1 }, { label: '完全不會', score: 0 }] },
    { id: 'i2', title: '2. 外出活動', max: 4, failScores: [1, 0], options: [{ label: '自己開車/騎車', score: 4 }, { label: '搭大眾運輸', score: 3 }, { label: '搭計程車', score: 2 }, { label: '有人陪同搭車', score: 1 }, { label: '完全不能出門', score: 0 }] },
    { id: 'i3', title: '3. 食物烹調', max: 3, failScores: [0], options: [{ label: '獨立烹煮', score: 3 }, { label: '有佐料會做', score: 2 }, { label: '只會加熱', score: 1 }, { label: '需別人煮好', score: 0 }] },
    { id: 'i4', title: '4. 家務維持', max: 4, failScores: [1, 0], options: [{ label: '繁重家事', score: 4 }, { label: '簡單家事', score: 3 }, { label: '不整潔', score: 2 }, { label: '需別人協助', score: 1 }, { label: '完全不會', score: 0 }] },
    { id: 'i5', title: '5. 洗衣服', max: 2, failScores: [0], options: [{ label: '洗所有衣物', score: 2 }, { label: '洗小件衣物', score: 1 }, { label: '完全依賴', score: 0 }] },
    { id: 'i6', title: '6. 使用電話', max: 3, failScores: [1, 0], options: [{ label: '獨立使用', score: 3 }, { label: '撥熟悉號碼', score: 2 }, { label: '只會接', score: 1 }, { label: '完全不會', score: 0 }] },
    { id: 'i7', title: '7. 服用藥物', max: 3, failScores: [1, 0], options: [{ label: '自己負責', score: 3 }, { label: '需提醒', score: 2 }, { label: '準備好可服', score: 1 }, { label: '不能自己服', score: 0 }] },
    { id: 'i8', title: '8. 處理財務', max: 2, failScores: [0], options: [{ label: '獨立處理', score: 2 }, { label: '需協助大宗買賣', score: 1 }, { label: '不能處理', score: 0 }] }
  ];

  const iadlAnalysis = useMemo(() => {
    let total = 0;
    let failCountTop5 = 0; // 前五項失能數

    iadlQuestions.forEach((q, idx) => {
      if (iadlNotApp[q.id]) {
        total += q.max; // 不適用視為滿分
      } else {
        const score = iadlScores[q.id] ?? 0;
        total += score;
        // 判斷是否失能，並且是前五項
        if (idx < 5 && q.failScores.includes(score) && iadlScores[q.id] !== undefined) {
          failCountTop5++;
        }
      }
    });

    const isMildDisabled = failCountTop5 >= 3;
    return { total, failCountTop5, isMildDisabled };
  }, [iadlScores, iadlNotApp]);

  const handleSave = () => {
    onSave({
      spmsq: { errors: spmsqErrors.length, education, result: spmsqResult.label },
      adl: { scores: adlScores, total: adlTotal },
      iadl: { scores: iadlScores, notApplicable: iadlNotApp, total: iadlAnalysis.total, isMildDisabled: iadlAnalysis.isMildDisabled }
    });
  };

  return (
    <div className="space-y-8 bg-gray-50 p-8 rounded-xl">
      
      {/* SPMSQ 區塊 */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border-2 border-gray-100">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b-2 pb-4 border-indigo-100">簡易精神狀態檢查量表 (SPMSQ)</h2>
        
        <div className="mb-8 flex items-center space-x-4">
          <span className="font-semibold text-gray-700 text-2xl">個案教育程度：</span>
          <select 
            value={education} 
            onChange={(e: any) => setEducation(e.target.value)}
            className="border-gray-300 rounded-xl shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-2xl p-3"
          >
            <option value="primary">小學</option>
            <option value="junior">一般 (國中)</option>
            <option value="senior">高中以上</option>
          </select>
        </div>

        <p className="text-2xl text-gray-500 mb-8">請詢問個案以下問題，若<span className="text-red-500 font-bold">答錯</span>請勾選：</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {spmsqQuestions.map((q, idx) => (
            <label key={idx} className={`flex items-center p-5 rounded-xl border-2 cursor-pointer transition-colors ${spmsqErrors.includes(idx) ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
              <input 
                type="checkbox" 
                className="flex-shrink-0 h-8 w-8 rounded text-red-600 focus:ring-red-500 border-gray-300" 
                checked={spmsqErrors.includes(idx)}
                onChange={() => handleSpmsqToggle(idx)}
              />
              <span className="ml-4 text-2xl text-gray-700 leading-relaxed">{q}</span>
            </label>
          ))}
        </div>

        <div className="flex items-center justify-between bg-indigo-50 p-6 rounded-2xl">
          <div className="text-indigo-900 font-medium text-3xl">錯誤題數：<span className="text-5xl font-bold ml-4">{spmsqErrors.length}</span> 題</div>
          <div className={`px-8 py-4 rounded-full font-bold text-3xl ${spmsqResult.color}`}>
            判定結果：{spmsqResult.label}
          </div>
        </div>
      </div>

      {/* ADL 區塊 */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border-2 border-gray-100">
        <div className="flex justify-between items-center mb-8 border-b-2 pb-4 border-indigo-100">
          <h2 className="text-3xl font-bold text-gray-800">基本日常生活活動能力量表 (ADL)</h2>
          <div className="text-3xl font-bold text-indigo-700">總分：{adlTotal} / 100</div>
        </div>
        
        <div className="space-y-8">
          {adlQuestions.map((q) => (
            <div key={q.id} className="border-2 border-gray-100 p-6 rounded-2xl bg-gray-50">
              <div className="font-semibold text-gray-800 mb-6 text-3xl">{q.title}</div>
              <div className="flex flex-col gap-4">
                {q.options.map(opt => (
                  <label key={opt.score} className={`flex items-center px-6 py-4 border-2 rounded-xl cursor-pointer transition-all ${adlScores[q.id] === opt.score ? 'bg-indigo-100 border-indigo-500 text-indigo-800' : 'bg-white border-gray-300 hover:bg-gray-100'}`}>
                    <input 
                      type="radio" 
                      name={q.id} 
                      className="hidden" 
                      checked={adlScores[q.id] === opt.score}
                      onChange={() => setAdlScores(prev => ({ ...prev, [q.id]: opt.score }))}
                    />
                    <span className="mr-4 font-medium text-2xl">{opt.score}分</span>
                    <span className="text-xl">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* IADL 區塊 */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border-2 border-gray-100">
        <div className="flex justify-between items-center mb-8 border-b-2 pb-4 border-indigo-100">
          <h2 className="text-3xl font-bold text-gray-800">工具性日常生活活動能力量表 (IADL)</h2>
          <div className="text-3xl font-bold text-indigo-700">總分：{iadlAnalysis.total} / 24</div>
        </div>

        <div className="space-y-8 mb-8">
          {iadlQuestions.map((q) => (
            <div key={q.id} className={`border-2 p-6 rounded-2xl ${iadlNotApp[q.id] ? 'bg-gray-200 border-gray-300 opacity-70' : 'bg-gray-50 border-gray-100'}`}>
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                <div className="font-semibold text-gray-800 text-3xl">{q.title}</div>
                <label className="flex items-center space-x-3 text-xl text-gray-600 bg-white px-5 py-3 rounded-xl border shadow-sm cursor-pointer hover:bg-gray-50">
                  <input 
                    type="checkbox" 
                    className="h-6 w-6 rounded text-indigo-600 focus:ring-indigo-500"
                    checked={!!iadlNotApp[q.id]}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIadlNotApp(prev => ({ ...prev, [q.id]: checked }));
                      if (checked) {
                        setIadlScores(prev => { const next = {...prev}; delete next[q.id]; return next; });
                      }
                    }}
                  />
                  <span>不適用 (視為滿分)</span>
                </label>
              </div>
              
              {!iadlNotApp[q.id] && (
                <div className="flex flex-col gap-4">
                  {q.options.map(opt => (
                    <label key={opt.score} className={`flex items-center px-6 py-4 border-2 rounded-xl cursor-pointer transition-all ${iadlScores[q.id] === opt.score ? (q.failScores.includes(opt.score) ? 'bg-red-100 border-red-500 text-red-800' : 'bg-indigo-100 border-indigo-500 text-indigo-800') : 'bg-white border-gray-300 hover:bg-gray-100'}`}>
                      <input 
                        type="radio" 
                        name={q.id} 
                        className="hidden" 
                        checked={iadlScores[q.id] === opt.score}
                        onChange={() => setIadlScores(prev => ({ ...prev, [q.id]: opt.score }))}
                      />
                      <span className="mr-4 font-medium text-2xl">{opt.score}分</span>
                      <span className="text-xl">{opt.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* IADL 判定結果 */}
        <div className={`p-8 rounded-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 ${iadlAnalysis.isMildDisabled ? 'bg-red-50 border-2 border-red-300' : 'bg-green-50 border-2 border-green-300'}`}>
          <div>
            <div className="font-bold text-gray-800 text-3xl mb-4">前五項失能判定</div>
            <div className="text-xl text-gray-600 leading-relaxed">上街購物、外出活動、食物烹調<br/>家務維持、洗衣服<br/>有3項以上需協助即為輕度失能</div>
          </div>
          <div className="text-right">
            <div className="text-2xl mb-4 font-medium">需協助項數：<span className="font-bold text-5xl mx-4">{iadlAnalysis.failCountTop5}</span></div>
            {iadlAnalysis.isMildDisabled ? (
              <span className="inline-block px-8 py-4 bg-red-600 text-white font-bold rounded-full text-2xl">判定：輕度失能</span>
            ) : (
              <span className="inline-block px-8 py-4 bg-green-600 text-white font-bold rounded-full text-2xl">判定：正常</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-8 border-t-2 border-gray-300">
        <button 
          onClick={handleSave}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-10 rounded-xl shadow-md transition-colors text-3xl"
        >
          儲存護理評估紀錄
        </button>
      </div>
    </div>
  );
}