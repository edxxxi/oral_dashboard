/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import { supabase } from '../utils/supabaseClient'
import { makeId } from '../utils/ids'
import { todayISO } from '../utils/date'
import { makeMockState } from '../data/mock'
import type { AppState, AssessmentRecord, Feedback, Resident, StaffAccount } from './types'

// 初始狀態
const initialState: AppState = {
  selectedResidentId: null,
  residents: [],
  assessments: [],
  staff: [],
  feedbacks: [],
  doctorRecs: []
}

// 定義動作類型
type Action =
  | { type: 'set_initial_data'; state: AppState }
  | { type: 'select_resident'; id: string | null }
  | { type: 'update_resident_local'; id: string; patch: Partial<Resident> }
  | { type: 'add_resident_local'; resident: Resident }
  | { type: 'add_assessment_local'; record: AssessmentRecord }
  | { type: 'add_attachment'; residentId: string; name: string }
  | { type: 'add_staff'; staff: StaffAccount }
  | { type: 'toggle_staff'; id: string }
  | { type: 'add_feedback'; feedback: Omit<Feedback, 'id' | 'createdAt' | 'status'> }
  | { type: 'update_feedback_status'; id: string; status: Feedback['status'] }

// Reducer 處理本地狀態更新
function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'set_initial_data':
      return { ...action.state }
    case 'select_resident':
      return { ...state, selectedResidentId: action.id }
    case 'update_resident_local':
      return {
        ...state,
        residents: state.residents.map((r) => (r.id === action.id ? { ...r, ...action.patch } : r)),
      }
    case 'add_resident_local':
      return {
        ...state,
        residents: [action.resident, ...state.residents],
      }
    case 'add_assessment_local':
      return { 
        ...state, 
        assessments: [action.record, ...state.assessments] 
      }
    case 'add_attachment':
      return {
        ...state,
        residents: state.residents.map((r) =>
          r.id === action.residentId
            ? {
                ...r,
                attachments: [
                  ...r.attachments,
                  { id: makeId('att'), name: action.name, addedAt: todayISO() },
                ],
              }
            : r
        ),
      }
    case 'add_staff':
      return {
        ...state,
        staff: [...state.staff, action.staff],
      }
    case 'toggle_staff':
      return {
        ...state,
        staff: state.staff.map((s) =>
          s.id === action.id ? { ...s, active: !s.active } : s
        ),
      }
    case 'add_feedback':
      return {
        ...state,
        feedbacks: [
          {
            id: makeId('fb'),
            createdAt: todayISO(),
            ...action.feedback,
            status: 'new' as const,
          },
          ...state.feedbacks,
        ],
      }
    case 'update_feedback_status':
      return {
        ...state,
        feedbacks: state.feedbacks.map((f) =>
          f.id === action.id ? { ...f, status: action.status } : f
        ),
      }
    default:
      return state
  }
}

// Store Context 包含狀態與操作方法
type Store = {
  state: AppState
  dispatch: React.Dispatch<Action>
  loading: boolean
  // 新增：直接操作資料庫的異步方法
  updateResident: (id: string, patch: Partial<Resident>) => Promise<void>
  addAssessment: (residentId: string, patch: Partial<AssessmentRecord>) => Promise<void>
  // 新增：將住民寫入雲端資料庫
  addResident: (resident: Partial<Resident>) => Promise<void>
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [loading, setLoading] = useState(true)

  // 1. 初始化：從 Supabase 抓取所有資料，失敗時使用模擬數據
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        // 檢查是否有 Supabase 環境變數
        const url = import.meta.env.VITE_SUPABASE_URL
        const key = import.meta.env.VITE_SUPABASE_ANON_KEY
        
        if (!url || !key) {
          console.warn('⚠️  Supabase 環境變數未設置，使用模擬數據')
          dispatch({
            type: 'set_initial_data',
            state: makeMockState()
          })
          setLoading(false)
          return
        }

        const [resResidents, resAssessments] = await Promise.all([
          (supabase.from('residents') as any).select('*'),
          (supabase.from('assessment_records') as any).select('*').order('created_at', { ascending: false })
        ])

        if (resResidents.error) throw resResidents.error
        if (resAssessments.error) throw resAssessments.error

        dispatch({
          type: 'set_initial_data',
          state: {
            ...initialState,
            residents: (resResidents.data || []).map((r: any) => ({
              ...r,
              bedNo: r.bed_no,
              medicalSummary: r.medical_summary,
              oralCheckNotes: r.oral_check_notes,
              dietStatus: r.diet_status
            })),
            assessments: (resAssessments.data || []).map((a: any) => ({
              ...a,
              residentId: a.resident_id,
              monthKey: a.month_key,
              weightKg: a.weight_kg,
              spmsqErrors: a.spmsq_errors,
              mnaScore: a.mna_score,
              swallowScreen: a.swallow_screen,
              swallow30s: a.swallow_30s,
              eat10Score: a.eat10_score,
              chewingScore: a.chewing_score,
              nursingData: a.nursing_data
            } as any)),
          }
        })
      } catch (error) {
        console.error('❌ 載入雲端資料失敗:', error)
        console.warn('📦 改用模擬數據進行本地測試')
        // 失敗時使用模擬數據
        dispatch({
          type: 'set_initial_data',
          state: makeMockState()
        })
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // 2. 異步更新住民資料並同步到雲端
  const updateResident = useCallback(async (id: string, patch: Partial<Resident>) => {
    // 準備要傳給資料庫的格式（轉回下底線）
    const dbPatch: any = { ...patch };
    if (patch.bedNo) dbPatch.bed_no = patch.bedNo;
    if (patch.medicalSummary) dbPatch.medical_summary = patch.medicalSummary;
    if (patch.oralCheckNotes) dbPatch.oral_check_notes = patch.oralCheckNotes;
    
    // 刪除前端專用的名稱以免資料庫報錯
    delete dbPatch.bedNo;
    delete dbPatch.medicalSummary;
    delete dbPatch.oralCheckNotes;

    const { error } = await (supabase.from('residents') as any).update(dbPatch).eq('id', id);
    
    if (error) {
      alert('雲端更新失敗: ' + error.message);
    } else {
      dispatch({ type: 'update_resident_local', id, patch });
    }
  }, [dispatch])

  // 3. 新增評估紀錄並同步到雲端
  const addAssessment = useCallback(async (residentId: string, patch: Partial<AssessmentRecord>) => {
    const createdAt = todayISO()
    const d = new Date(createdAt)
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

    const dbRecord = {
      resident_id: residentId,
      month_key: monthKey,
      weight_kg: patch.weightKg,
      spmsq_errors: patch.spmsqErrors,
      mna_score: patch.mnaScore,
      swallow_screen: patch.swallowScreen,
      swallow_30s: patch.swallow30s,
      eat10_score: (patch as any).eat10Score,
      chewing_score: (patch as any).chewingScore,
      nursing_data: (patch as any).nursingData,
      notes: patch.notes
    }

    const { data, error } = await (supabase.from('assessment_records') as any)
      .insert([dbRecord])
      .select()

    if (error) {
      console.warn('雲端儲存失敗，轉為本地原型儲存: ' + error.message);
      const newRecord: AssessmentRecord = {
        ...patch,
        id: `local-ass-${Date.now()}`,
        residentId: residentId,
        createdAt: createdAt,
        monthKey: monthKey
      } as AssessmentRecord
      dispatch({ type: 'add_assessment_local', record: newRecord });
    } else if (data && data[0]) {
      // 將資料庫回傳的結果（含自動生成的 ID）轉回前端格式
      const newRecord: AssessmentRecord = {
        ...patch,
        id: data[0].id,
        residentId: data[0].resident_id,
        createdAt: data[0].created_at,
        monthKey: data[0].month_key
      } as AssessmentRecord
      
      dispatch({ type: 'add_assessment_local', record: newRecord });
    }
  }, [dispatch])

  // 4. 新增住民並同步到雲端
  const addResident = useCallback(async (resident: Partial<Resident>) => {
    // 準備要傳給資料庫的格式（將小駝峰命名轉回資料庫底線命名）
    const dbRecord: any = { ...resident };
    if (resident.bedNo) dbRecord.bed_no = resident.bedNo;
    if (resident.medicalSummary) dbRecord.medical_summary = resident.medicalSummary;
    if (resident.oralCheckNotes) dbRecord.oral_check_notes = resident.oralCheckNotes;
    if (resident.dietStatus) dbRecord.diet_status = resident.dietStatus;

    // 刪除前端專用的名稱以免資料庫報錯
    delete dbRecord.bedNo;
    delete dbRecord.medicalSummary;
    delete dbRecord.oralCheckNotes;
    delete dbRecord.dietStatus;
    delete dbRecord.id; // 確保由 Supabase 資料庫自動產生 ID (UUID/遞增 ID)

    const { data, error } = await (supabase.from('residents') as any)
      .insert([dbRecord])
      .select()

    if (error) {
      console.warn('雲端新增住民失敗，轉為本地儲存:', error.message);
      // 失敗時退回本地儲存，使用生成的 ID（與 addAssessment 相同策略）
      const newResident: Resident = {
        ...resident,
        id: makeId('res'),
        attachments: resident.attachments || [],
        medicalSummary: resident.medicalSummary || '',
        oralCheckNotes: resident.oralCheckNotes || '',
      } as Resident;
      dispatch({ type: 'add_resident_local', resident: newResident });
    } else if (data && data[0]) {
      // 將資料庫回傳的結果（含資料庫產生的真實 ID）轉回前端格式
      const newResident: Resident = {
        ...data[0],
        bedNo: data[0].bed_no,
        medicalSummary: data[0].medical_summary,
        oralCheckNotes: data[0].oral_check_notes,
        dietStatus: data[0].diet_status
      } as Resident;
      dispatch({ type: 'add_resident_local', resident: newResident });
    }
  }, [dispatch])

  const value = useMemo(() => ({ 
    state, 
    dispatch, 
    loading, 
    updateResident, 
    addAssessment,
    addResident
  }), [state, loading, updateResident, addAssessment, addResident])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

// 供其他組件使用的 Hooks
export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('StoreProvider missing')
  return ctx
}

export function useSelectedResident() {
  const { state: { selectedResidentId, residents } } = useStore()
  return residents.find((r) => r.id === selectedResidentId) ?? null
}

export function useResidentAssessments(residentId: string | null) {
  const { state: { assessments } } = useStore()
  return useMemo(() => {
    if (!residentId) return []
    return [...assessments]
      .filter((a) => a.residentId === residentId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  }, [assessments, residentId])
}