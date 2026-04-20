export type RiskLevel = 'low' | 'medium' | 'high'
export type DietType = 'full' | 'soft' | 'liquid'
export type FeedingMethod = 'oral' | 'ng_tube' | 'gastrostomy'

export type Resident = {
  id: string
  bedNo: string
  name: string
  age: number
  gender?: 'M' | 'F' | 'O'
  photoUrl?: string
  medicalSummary: string
  oralCheckNotes: string
  attachments: { id: string; name: string; addedAt: string }[]
  dietStatus: {
    feedingMethod: FeedingMethod
    dietType: DietType
    slpNotes: string
    dietitianNotes: string
  }
}

export type AssessmentRecord = {
  id: string
  residentId: string
  createdAt: string
  monthKey: string // yyyy-mm (monthly)
  weightKg?: number

  spmsqErrors?: number // 0-10
  mnaScore?: number // 0-14 simplified
  swallowScreen?: {
    coughWhenDrinking?: boolean
    wetVoice?: boolean
    chokingHistory?: boolean
    needsAssistFeeding?: boolean
  }
  swallow30s?: {
    swallows?: number
    cough?: boolean
  }

  notes?: string
}

export type StaffAccount = {
  id: string
  name: string
  role: 'admin' | 'nurse' | 'dietitian' | 'caregiver' | 'slp'
  email: string
  active: boolean
}

export type Feedback = {
  id: string
  createdAt: string
  from: string
  message: string
  status: 'new' | 'triaged' | 'done'
}

export type DoctorRecommendation = {
  id: string
  residentId: string
  createdAt: string
  content: string
}

export type AppState = {
  selectedResidentId: string | null
  residents: Resident[]
  assessments: AssessmentRecord[]
  staff: StaffAccount[]
  feedbacks: Feedback[]
  doctorRecs: DoctorRecommendation[]
}
