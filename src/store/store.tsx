/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { makeMockState } from '../data/mock'
import { makeId } from '../utils/ids'
import { todayISO } from '../utils/date'
import type { AppState, AssessmentRecord, Feedback, Resident, StaffAccount } from './types'

const STORAGE_KEY = 'oral-dashboard-state-v1'

type Action =
  | { type: 'select_resident'; id: string | null }
  | { type: 'update_resident'; id: string; patch: Partial<Resident> }
  | { type: 'add_attachment'; residentId: string; name: string }
  | {
      type: 'add_assessment'
      residentId: string
      patch: Partial<Omit<AssessmentRecord, 'id' | 'residentId' | 'createdAt' | 'monthKey'>>
    }
  | { type: 'add_staff'; staff: StaffAccount }
  | { type: 'toggle_staff'; id: string }
  | { type: 'add_feedback'; feedback: Omit<Feedback, 'id' | 'createdAt' | 'status'> }
  | { type: 'update_feedback_status'; id: string; status: Feedback['status'] }

function safeParse(json: string | null): AppState | null {
  if (!json) return null
  try {
    return JSON.parse(json) as AppState
  } catch {
    return null
  }
}

function loadInitialState(): AppState {
  const persisted = safeParse(localStorage.getItem(STORAGE_KEY))
  if (!persisted) return makeMockState()

  // Merge with mock in case schema changed.
  const base = makeMockState()
  return {
    ...base,
    ...persisted,
    residents: persisted.residents?.length ? persisted.residents : base.residents,
    assessments: persisted.assessments?.length ? persisted.assessments : base.assessments,
    staff: persisted.staff?.length ? persisted.staff : base.staff,
    feedbacks: persisted.feedbacks?.length ? persisted.feedbacks : base.feedbacks,
  }
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'select_resident':
      return { ...state, selectedResidentId: action.id }
    case 'update_resident':
      return {
        ...state,
        residents: state.residents.map((r) => (r.id === action.id ? { ...r, ...action.patch } : r)),
      }
    case 'add_attachment':
      return {
        ...state,
        residents: state.residents.map((r) =>
          r.id === action.residentId
            ? {
                ...r,
                attachments: [
                  { id: makeId('att'), name: action.name, addedAt: todayISO() },
                  ...r.attachments,
                ],
              }
            : r,
        ),
      }
    case 'add_assessment': {
      const createdAt = todayISO()
      const d = new Date(createdAt)
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const existing = state.assessments.find(
        (a) => a.residentId === action.residentId && a.monthKey === monthKey,
      )
      if (existing) {
        return {
          ...state,
          assessments: state.assessments.map((a) =>
            a.id === existing.id ? { ...a, ...action.patch, createdAt } : a,
          ),
        }
      }
      const rec: AssessmentRecord = {
        id: makeId('asm'),
        residentId: action.residentId,
        createdAt,
        monthKey,
        ...action.patch,
      }
      return { ...state, assessments: [rec, ...state.assessments] }
    }
    case 'add_staff':
      return { ...state, staff: [action.staff, ...state.staff] }
    case 'toggle_staff':
      return {
        ...state,
        staff: state.staff.map((s) => (s.id === action.id ? { ...s, active: !s.active } : s)),
      }
    case 'add_feedback': {
      const next: Feedback = {
        id: makeId('fb'),
        createdAt: todayISO(),
        status: 'new',
        ...action.feedback,
      }
      return { ...state, feedbacks: [next, ...state.feedbacks] }
    }
    case 'update_feedback_status':
      return {
        ...state,
        feedbacks: state.feedbacks.map((f) => (f.id === action.id ? { ...f, status: action.status } : f)),
      }
  }
}

type Store = {
  state: AppState
  dispatch: React.Dispatch<Action>
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState)

  useEffect(() => {
    const handle = window.setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }, 200)
    return () => window.clearTimeout(handle)
  }, [state])

  const value = useMemo(() => ({ state, dispatch }), [state])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('StoreProvider missing')
  return ctx
}

export function useSelectedResident() {
  const {
    state: { selectedResidentId, residents },
  } = useStore()
  return residents.find((r) => r.id === selectedResidentId) ?? null
}

export function useResidentAssessments(residentId: string | null) {
  const {
    state: { assessments },
  } = useStore()
  return useMemo(() => {
    if (!residentId) return []
    return [...assessments]
      .filter((a) => a.residentId === residentId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  }, [assessments, residentId])
}
