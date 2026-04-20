import { makeId } from '../utils/ids'
import { todayISO } from '../utils/date'
import type { AppState, AssessmentRecord, Resident, StaffAccount } from '../store/types'

function monthKey(iso: string) {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

function r(
  bedNo: string,
  name: string,
  age: number,
  medicalSummary: string,
  overrides?: Partial<Resident>,
): Resident {
  return {
    id: makeId('res'),
    bedNo,
    name,
    age,
    gender: 'O',
    medicalSummary,
    oralCheckNotes: '（示意）可上傳紙本口腔檢查表或填寫簡要備註。',
    attachments: [],
    dietStatus: {
      feedingMethod: 'oral',
      dietType: 'soft',
      slpNotes: '建議：進食時注意姿勢、分次少量。',
      dietitianNotes: '建議：加強蛋白質與水分攝取。',
    },
    ...overrides,
  }
}

function a(residentId: string, iso: string, partial: Partial<AssessmentRecord>): AssessmentRecord {
  return {
    id: makeId('asm'),
    residentId,
    createdAt: iso,
    monthKey: monthKey(iso),
    ...partial,
  }
}

export function makeMockState(): AppState {
  const residents: Resident[] = [
    r('A-01', '王小明', 81, '中風病史，吞嚥反射偏慢。'),
    r('A-02', '林美華', 88, '近期體重下降，需留意營養狀態。', {
      dietStatus: {
        feedingMethod: 'oral',
        dietType: 'liquid',
        slpNotes: '建議：流質為主，觀察嗆咳。',
        dietitianNotes: '建議：高熱量補充，分次給予。',
      },
    }),
    r('A-03', '陳阿國', 79, '認知狀態波動，需他人協助餵食。', {
      dietStatus: {
        feedingMethod: 'oral',
        dietType: 'soft',
        slpNotes: '建議：軟質飲食，必要時協助餵食。',
        dietitianNotes: '建議：監測進食量與水分。',
      },
    }),
    r('B-01', '張淑芬', 84, '慢性疾病多，需定期評估。'),
    r('B-02', '李建宏', 76, '整體狀況穩定，可持續追蹤。', {
      dietStatus: {
        feedingMethod: 'oral',
        dietType: 'full',
        slpNotes: '建議：維持一般飲食，避免過快進食。',
        dietitianNotes: '建議：維持均衡飲食。',
      },
    }),
  ]

  const now = new Date()
  const mkIso = (monthsAgo: number) => {
    const d = new Date(now)
    d.setMonth(d.getMonth() - monthsAgo)
    d.setDate(12)
    d.setHours(10, 0, 0, 0)
    return d.toISOString()
  }

  const assessments: AssessmentRecord[] = []
  for (const [idx, res] of residents.entries()) {
    assessments.push(
      a(res.id, mkIso(2), {
        weightKg: 50 - idx * 1.5,
        spmsqErrors: idx % 3,
        mnaScore: 12 - idx,
        swallowScreen: {
          coughWhenDrinking: idx === 1,
          wetVoice: idx === 1,
          chokingHistory: idx === 1,
          needsAssistFeeding: idx === 2,
        },
        swallow30s: { swallows: 5 - idx, cough: idx === 1 },
        notes: '（示意）每月評估一次。',
      }),
    )
    assessments.push(
      a(res.id, mkIso(1), {
        weightKg: 49.5 - idx * 1.4,
        spmsqErrors: idx % 4,
        mnaScore: 11 - idx,
        swallowScreen: {
          coughWhenDrinking: idx <= 1,
          wetVoice: idx === 1,
          chokingHistory: idx === 1,
          needsAssistFeeding: idx === 2,
        },
        swallow30s: { swallows: 4 - idx, cough: idx === 1 },
      }),
    )
    assessments.push(
      a(res.id, todayISO(), {
        weightKg: 49 - idx * 1.3,
        spmsqErrors: idx === 2 ? 4 : idx % 3,
        mnaScore: idx === 1 ? 7 : 12 - idx,
        swallowScreen: {
          coughWhenDrinking: idx <= 1,
          wetVoice: idx === 1,
          chokingHistory: idx === 1,
          needsAssistFeeding: idx === 2,
        },
        swallow30s: { swallows: 3 - Math.min(idx, 2), cough: idx === 1 },
      }),
    )
  }

  const staff: StaffAccount[] = [
    { id: makeId('staff'), name: '管理者', role: 'admin', email: 'admin@example.com', active: true },
    { id: makeId('staff'), name: '護理師 A', role: 'nurse', email: 'nurse.a@example.com', active: true },
    { id: makeId('staff'), name: '營養師 B', role: 'dietitian', email: 'dietitian.b@example.com', active: true },
    { id: makeId('staff'), name: '照服員 C', role: 'caregiver', email: 'care.c@example.com', active: true },
    { id: makeId('staff'), name: '語言治療師 D', role: 'slp', email: 'slp.d@example.com', active: true },
  ]

  return {
    selectedResidentId: residents[0]?.id ?? null,
    residents,
    assessments,
    staff,
    feedbacks: [
      {
        id: makeId('fb'),
        createdAt: todayISO(),
        from: '護理師 A',
        message: '希望 Dashboard 的篩選可以加上「餐食類型」。',
        status: 'new',
      },
    ],
    doctorRecs: [],
  }
}
