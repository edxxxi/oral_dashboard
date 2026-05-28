/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import { supabase } from '../utils/supabaseClient'
import { makeId } from '../utils/ids'
import { todayISO } from '../utils/date'
import { makeMockState } from '../data/mock'
import type { AppState, AssessmentRecord, Feedback, Resident, StaffAccount } from './types'

const PATAKA_BUCKET = 'pataka-audio'
const RESIDENT_ATTACHMENTS_BUCKET = 'resident-attachments'
const RESIDENT_ATTACHMENT_URL_TTL = 60 * 60

type PatakaAudioUploadResult = {
  audioPath: string
  audioFileName: string
  uploadedAt: string
  uploadedBy: string
}

type ResidentAttachment = Resident['attachments'][number]

async function tryCreateResidentAttachmentUrl(path: string): Promise<string | null> {
  await supabase.auth.getSession()
  const { data, error } = await (supabase.storage.from(RESIDENT_ATTACHMENTS_BUCKET) as any).createSignedUrl(
    path,
    RESIDENT_ATTACHMENT_URL_TTL,
  )
  if (error || !data?.signedUrl) return null
  return data.signedUrl
}

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
  | { type: 'set_assessments_local'; assessments: AssessmentRecord[] }
  | { type: 'select_resident'; id: string | null }
  | { type: 'update_resident_local'; id: string; patch: Partial<Resident> }
  | { type: 'add_resident_local'; resident: Resident }
  | { type: 'delete_resident_local'; id: string }
  | { type: 'add_assessment_local'; record: AssessmentRecord }
  | { type: 'update_assessment_local'; id: string; patch: Partial<AssessmentRecord> }
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
    case 'set_assessments_local':
      return { ...state, assessments: action.assessments }
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
    case 'delete_resident_local': {
      const nextSelected = state.selectedResidentId === action.id ? null : state.selectedResidentId
      return {
        ...state,
        selectedResidentId: nextSelected,
        residents: state.residents.filter((r) => r.id !== action.id),
        assessments: state.assessments.filter((a) => a.residentId !== action.id),
      }
    }
    case 'add_assessment_local':
      return { 
        ...state, 
        assessments: [action.record, ...state.assessments] 
      }
    case 'update_assessment_local':
      return {
        ...state,
        assessments: state.assessments.map((a) => (a.id === action.id ? { ...a, ...action.patch } : a)),
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
  addAssessment: (residentId: string, patch: Partial<AssessmentRecord>) => Promise<AssessmentRecord | null>
  updateAssessment: (assessmentId: string, patch: Partial<AssessmentRecord>) => Promise<void>
  // 新增：將住民寫入雲端資料庫
  addResident: (resident: Partial<Resident>, attachmentFiles?: File[]) => Promise<void>
  deleteResident: (residentId: string) => Promise<void>
  uploadPatakaAudio: (residentId: string, file: File, uploadedBy: string) => Promise<PatakaAudioUploadResult>
  getPatakaAudioDownloadUrl: (audioPath: string) => Promise<string>
  getResidentAttachmentUrl: (path: string) => Promise<string>
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [loading, setLoading] = useState(true)
  const normalizeAttachments = (raw: unknown): Resident['attachments'] => {
    if (!raw) return []
    let value: unknown = raw
    if (typeof raw === 'string') {
      try {
        value = JSON.parse(raw)
      } catch {
        return []
      }
    }
    if (!Array.isArray(value)) return []

    return value
      .map((item) => {
        if (typeof item === 'string') {
          return { id: makeId('att'), name: item, addedAt: todayISO() }
        }
        if (item && typeof item === 'object') {
          const record = item as Record<string, unknown>
          const name = typeof record.name === 'string' ? record.name : null
          if (!name) return null
          const path =
            typeof record.path === 'string'
              ? record.path
              : typeof record.storagePath === 'string'
                ? record.storagePath
                : undefined
          const mimeType = typeof record.mimeType === 'string' ? record.mimeType : undefined
          const size = typeof record.size === 'number' ? record.size : undefined
          const url = typeof record.url === 'string' ? record.url : undefined
          return {
            id: typeof record.id === 'string' ? record.id : makeId('att'),
            name,
            addedAt: typeof record.addedAt === 'string' ? record.addedAt : todayISO(),
            path,
            mimeType,
            size,
            url,
          }
        }
        return null
      })
      .filter((item): item is Resident['attachments'][number] => Boolean(item))
  }

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

        await supabase.auth.getSession()

        const mapResidentRow = (r: any): Resident => ({
          ...r,
          bedNo: r.bed_no,
          medicalSummary: r.medical_summary,
          oralCheckNotes: r.oral_check_notes,
          dietStatus: r.diet_status,
          attachments: normalizeAttachments((r as { attachments?: unknown }).attachments),
        })
        const mapAssessmentRow = (a: any): AssessmentRecord => ({
          ...a,
          residentId: a.resident_id,
          monthKey: a.month_key,
          weightKg: a.weight_kg,
          spmsqErrors: a.spmsq_errors,
          mnaScore: a.mna_score,
          swallowScreen: a.swallow_screen,
          swallow30s: a.swallow_30s,
          eat10Score: a.eat10_score,
          rsstScore: a.rsst_score ?? a.chewing_score,
          chewingScore: a.chewing_score,
          nursingData: a.nursing_data
        } as any)

        // 先載入住民資料，避免登入後主畫面卡在大筆 assessment 查詢
        const resResidents = await (supabase.from('residents') as any).select('*')
        if (resResidents.error) throw resResidents.error

        const residentsRaw = (resResidents.data || []).map(mapResidentRow)
        const residents = await Promise.all(
          residentsRaw.map(async (r: Resident) => {
            const attachments = await Promise.all(
              r.attachments.map(async (a: ResidentAttachment) => {
                if (!a.path || a.url) return a
                const url = await tryCreateResidentAttachmentUrl(a.path)
                return url ? { ...a, url } : a
              }),
            )
            return { ...r, attachments }
          }),
        )

        dispatch({
          type: 'set_initial_data',
          state: {
            ...initialState,
            residents,
            assessments: [],
          }
        })

        setLoading(false)

        // 評估資料改為背景載入，載完再補進 state
        ;(async () => {
          const resAssessments = await (supabase.from('assessment_records') as any)
            .select('*')
            .order('created_at', { ascending: false })
          if (resAssessments.error) {
            console.warn('⚠️  載入 assessment_records 較慢或失敗:', resAssessments.error.message)
            return
          }
          dispatch({
            type: 'set_assessments_local',
            assessments: (resAssessments.data || []).map(mapAssessmentRow),
          })
        })()
        return
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
      rsst_score: patch.rsstScore,
      chewing_score: patch.chewingScore ?? patch.rsstScore,
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
      return newRecord
    } else if (data && data[0]) {
      // 將資料庫回傳的結果（含自動生成的 ID）轉回前端格式
      const newRecord: AssessmentRecord = {
        ...patch,
        id: data[0].id,
        residentId: data[0].resident_id,
        createdAt: data[0].created_at,
        monthKey: data[0].month_key,
        rsstScore: data[0].rsst_score ?? data[0].chewing_score
      } as AssessmentRecord
      
      dispatch({ type: 'add_assessment_local', record: newRecord });
      return newRecord
    }
    return null
  }, [dispatch])

  const updateAssessment = useCallback(async (assessmentId: string, patch: Partial<AssessmentRecord>) => {
    const dbPatch: Record<string, unknown> = {}
    if (patch.weightKg !== undefined) dbPatch.weight_kg = patch.weightKg
    if (patch.spmsqErrors !== undefined) dbPatch.spmsq_errors = patch.spmsqErrors
    if (patch.mnaScore !== undefined) dbPatch.mna_score = patch.mnaScore
    if (patch.swallowScreen !== undefined) dbPatch.swallow_screen = patch.swallowScreen
    if (patch.swallow30s !== undefined) dbPatch.swallow_30s = patch.swallow30s
    if ((patch as { eat10Score?: number }).eat10Score !== undefined) dbPatch.eat10_score = (patch as { eat10Score?: number }).eat10Score
    if (patch.rsstScore !== undefined) {
      dbPatch.rsst_score = patch.rsstScore
      if (patch.chewingScore === undefined) {
        dbPatch.chewing_score = patch.rsstScore
      }
    }
    if (patch.chewingScore !== undefined) dbPatch.chewing_score = patch.chewingScore
    if ((patch as { nursingData?: AssessmentRecord['nursingData'] }).nursingData !== undefined) {
      dbPatch.nursing_data = (patch as { nursingData?: AssessmentRecord['nursingData'] }).nursingData
    }
    if (patch.notes !== undefined) dbPatch.notes = patch.notes

    if (Object.keys(dbPatch).length === 0) return

    const { error } = await (supabase.from('assessment_records') as any)
      .update(dbPatch)
      .eq('id', assessmentId)

    if (error) {
      console.warn('雲端更新評估失敗，改用本地更新: ' + error.message)
      dispatch({ type: 'update_assessment_local', id: assessmentId, patch })
      return
    }

    dispatch({ type: 'update_assessment_local', id: assessmentId, patch })
  }, [dispatch])

  const uploadResidentAttachments = useCallback(async (residentId: string, files: File[]) => {
    const uploaded: ResidentAttachment[] = []
    for (const file of files) {
      const fileName = file.name.trim() || 'resident-attachment'
      const safeFileName = fileName.replace(/[^\w.-]+/g, '_')
      const objectPath = `${residentId}/${Date.now()}-${safeFileName}`
      const { error } = await (supabase.storage.from(RESIDENT_ATTACHMENTS_BUCKET) as any).upload(objectPath, file, {
        upsert: false,
        contentType: file.type || undefined,
        cacheControl: '3600',
      })
      if (error) {
        throw new Error(`附件上傳失敗：${error.message}`)
      }
      uploaded.push({
        id: makeId('att'),
        name: fileName,
        addedAt: todayISO(),
        path: objectPath,
        mimeType: file.type || undefined,
        size: file.size,
      })
    }
    return uploaded
  }, [])

  // 4. 新增住民並同步到雲端
  const addResident = useCallback(async (resident: Partial<Resident>, attachmentFiles: File[] = []) => {
    // 準備要傳給資料庫的格式（將小駝峰命名轉回資料庫底線命名）
    const dbRecord: any = { ...resident };
    const fallbackAttachments = resident.attachments
    if (resident.bedNo) dbRecord.bed_no = resident.bedNo;
    if (resident.medicalSummary) dbRecord.medical_summary = resident.medicalSummary;
    if (resident.oralCheckNotes) dbRecord.oral_check_notes = resident.oralCheckNotes;
    if (resident.dietStatus) dbRecord.diet_status = resident.dietStatus;

    // 刪除前端專用的名稱以免資料庫報錯
    delete dbRecord.bedNo;
    delete dbRecord.medicalSummary;
    delete dbRecord.oralCheckNotes;
    delete dbRecord.dietStatus;
    delete dbRecord.attachments;
    delete dbRecord.id; // 確保由 Supabase 資料庫自動產生 ID (UUID/遞增 ID)
    if (attachmentFiles.length === 0 && Array.isArray(fallbackAttachments) && fallbackAttachments.length > 0) {
      dbRecord.attachments = fallbackAttachments
    }

    const { data, error } = await (supabase.from('residents') as any)
      .insert([dbRecord])
      .select()

    if (error) {
      alert('新增住民失敗: ' + error.message);
      throw error;
    }
    if (!data || !data[0]) return

    let uploadedAttachments: ResidentAttachment[] = []
    if (attachmentFiles.length > 0) {
      try {
        uploadedAttachments = await uploadResidentAttachments(data[0].id, attachmentFiles)
        const { error: updateError } = await (supabase.from('residents') as any)
          .update({ attachments: uploadedAttachments })
          .eq('id', data[0].id)
        if (updateError) {
          alert('更新附件失敗: ' + updateError.message)
        }
      } catch (uploadError) {
        const detail = uploadError instanceof Error ? uploadError.message : '附件上傳失敗'
        alert(detail)
      }
    }

    // 將資料庫回傳的結果（含資料庫產生的真實 ID）轉回前端格式
    const normalizedAttachments = normalizeAttachments(
      uploadedAttachments.length > 0
        ? uploadedAttachments
        : (data[0] as { attachments?: unknown }).attachments ?? resident.attachments ?? []
    )
    const attachmentsWithUrls = await Promise.all(
      normalizedAttachments.map(async (a) => {
        if (!a.path || a.url) return a
        const url = await tryCreateResidentAttachmentUrl(a.path)
        return url ? { ...a, url } : a
      }),
    )

    const newResident: Resident = {
      ...data[0],
      bedNo: data[0].bed_no,
      medicalSummary: data[0].medical_summary,
      oralCheckNotes: data[0].oral_check_notes,
      dietStatus: data[0].diet_status,
      attachments: attachmentsWithUrls,
    } as Resident;
    dispatch({ type: 'add_resident_local', resident: newResident });
  }, [dispatch, uploadResidentAttachments])

  const deleteResident = useCallback(async (residentId: string) => {
    const { error: assessmentsError } = await (supabase.from('assessment_records') as any)
      .delete()
      .eq('resident_id', residentId)
    if (assessmentsError) {
      alert('刪除住民評估紀錄失敗: ' + assessmentsError.message)
      return
    }

    const { error } = await (supabase.from('residents') as any)
      .delete()
      .eq('id', residentId)

    if (error) {
      alert('刪除住民失敗: ' + error.message)
      return
    }

    dispatch({ type: 'delete_resident_local', id: residentId })
  }, [dispatch])

  const uploadPatakaAudio = useCallback(async (residentId: string, file: File, uploadedBy: string) => {
    const fileName = file.name.trim() || 'pataka-audio'
    const safeFileName = fileName.replace(/[^\w.-]+/g, '_')
    const objectPath = `${residentId}/${Date.now()}-${safeFileName}`

    const { error } = await (supabase.storage.from(PATAKA_BUCKET) as any).upload(objectPath, file, {
      upsert: false,
      contentType: file.type || undefined,
      cacheControl: '3600',
    })

    if (error) {
      throw new Error(`音檔上傳失敗：${error.message}`)
    }

    return {
      audioPath: objectPath,
      audioFileName: fileName,
      uploadedAt: new Date().toISOString(),
      uploadedBy,
    }
  }, [])

  const getPatakaAudioDownloadUrl = useCallback(async (audioPath: string) => {
    const { data, error } = await (supabase.storage.from(PATAKA_BUCKET) as any).createSignedUrl(audioPath, 60 * 10)
    if (error || !data?.signedUrl) {
      throw new Error(`取得下載連結失敗：${error?.message ?? '未知錯誤'}`)
    }
    return data.signedUrl
  }, [])

  const getResidentAttachmentUrl = useCallback(async (path: string) => {
    await supabase.auth.getSession()
    const { data, error } = await (supabase.storage.from(RESIDENT_ATTACHMENTS_BUCKET) as any).createSignedUrl(path, RESIDENT_ATTACHMENT_URL_TTL)
    if (error || !data?.signedUrl) {
      throw new Error(`取得附件連結失敗：${error?.message ?? '未知錯誤'}`)
    }
    return data.signedUrl
  }, [])

  const value = useMemo(() => ({ 
    state, 
    dispatch, 
    loading, 
    updateResident, 
    addAssessment,
    updateAssessment,
    addResident,
    deleteResident,
    uploadPatakaAudio,
    getPatakaAudioDownloadUrl,
    getResidentAttachmentUrl
  }), [state, loading, updateResident, addAssessment, updateAssessment, addResident, deleteResident, uploadPatakaAudio, getPatakaAudioDownloadUrl, getResidentAttachmentUrl])

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
