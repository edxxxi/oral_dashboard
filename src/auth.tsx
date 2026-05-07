/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import type { Permission, Role } from './rbac'
import { can as canRole } from './rbac'
import { isSupabaseConfigured, supabase } from './utils/supabaseClient'

export type AuthUser = {
  id: string
  email: string
  name: string
  role: Role
}

export type StaffAccountView = {
  id: string
  email: string
  name: string
  role: Role
  active: boolean
}

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  staffAccounts: StaffAccountView[]
  loadingStaffAccounts: boolean

  signIn: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>
  signOut: () => Promise<void>

  can: (permission: Permission) => boolean

  adminIssueAccount: (input: {
    email: string
    name: string
    role: Role
    active: boolean
    password: string
  }) => Promise<StaffAccountView>
  adminSetPassword: (userId: string, password: string) => Promise<boolean>
  adminSetActive: (userId: string, active: boolean) => Promise<boolean>
  adminDeleteAccount: (userId: string) => Promise<{ ok: true } | { ok: false; error: string }>
  refreshStaffAccounts: () => Promise<void>
}

type StaffRow = {
  id: string
  email: string
  name: string
  role: Role
  active: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

function mapStaffRow(row: StaffRow): StaffAccountView {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    active: row.active,
  }
}

async function loadMyStaffRow(userId: string): Promise<StaffAccountView | null> {
  const { data, error } = await supabase
    .from('staff_accounts')
    .select('id,email,name,role,active')
    .eq('id', userId)
    .maybeSingle<StaffRow>()
  if (error || !data) return null
  return mapStaffRow(data)
}

async function invokeAdminStaff<T = unknown>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('admin-staff', { body })
  if (error) throw new Error(error.message)
  return data as T
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [staffAccounts, setStaffAccounts] = useState<StaffAccountView[]>([])
  const [loadingStaffAccounts, setLoadingStaffAccounts] = useState(false)

  const loadStaffAccountsForRole = useCallback(async (role: Role) => {
    if (!canRole(role, 'manage:staff')) {
      setStaffAccounts([])
      return
    }
    setLoadingStaffAccounts(true)
    try {
      const rows = await invokeAdminStaff<StaffRow[]>({ action: 'list' })
      setStaffAccounts(rows.map(mapStaffRow))
    } finally {
      setLoadingStaffAccounts(false)
    }
  }, [])

  const refreshStaffAccounts = useCallback(async () => {
    if (!user) {
      setStaffAccounts([])
      return
    }
    await loadStaffAccountsForRole(user.role)
  }, [user, loadStaffAccountsForRole])

  useEffect(() => {
    let cancelled = false

    async function syncUserFromSession() {
      if (!isSupabaseConfigured) {
        if (!cancelled) setLoading(false)
        return
      }

      const { data } = await supabase.auth.getSession()
      const sessionUser = data.session?.user
      if (!sessionUser) {
        if (!cancelled) {
          setUser(null)
          setStaffAccounts([])
          setLoading(false)
        }
        return
      }

      const staffRow = await loadMyStaffRow(sessionUser.id)
      if (!staffRow || !staffRow.active) {
        await supabase.auth.signOut()
        if (!cancelled) {
          setUser(null)
          setStaffAccounts([])
          setLoading(false)
        }
        return
      }

      if (!cancelled) {
        setUser({
          id: staffRow.id,
          email: staffRow.email,
          name: staffRow.name,
          role: staffRow.role,
        })
        void loadStaffAccountsForRole(staffRow.role)
        setLoading(false)
      }
    }

    syncUserFromSession()
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        setUser(null)
        setStaffAccounts([])
        return
      }

      const staffRow = await loadMyStaffRow(session.user.id)
      if (!staffRow || !staffRow.active) {
        await supabase.auth.signOut()
        setUser(null)
        setStaffAccounts([])
        return
      }

      setUser({
        id: staffRow.id,
        email: staffRow.email,
        name: staffRow.name,
        role: staffRow.role,
      })
      void loadStaffAccountsForRole(staffRow.role)
    })

    return () => {
      cancelled = true
      authListener.subscription.unsubscribe()
    }
  }, [loadStaffAccountsForRole])

  const signIn = useCallback<AuthContextValue['signIn']>(async (email, password) => {
    try {
      if (!isSupabaseConfigured) {
        return { ok: false, error: 'Supabase 尚未設定，請先配置 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY' }
      }
      const e = email.trim()
      const p = password
      if (!e || !p) return { ok: false, error: '請輸入帳號與密碼' }

      const { data, error } = await supabase.auth.signInWithPassword({ email: e, password: p })
      if (error || !data.user) {
        const detail = error?.message?.trim()
        if (detail) {
          return { ok: false, error: `登入失敗：${detail}` }
        }
        return { ok: false, error: '帳號/密碼錯誤，或帳號尚未由主管建立' }
      }

      const { data: staffData, error: staffError, status: staffStatus } = await supabase
        .from('staff_accounts')
        .select('id,email,name,role,active')
        .eq('id', data.user.id)
        .maybeSingle<StaffRow>()

      if (staffError) {
        await supabase.auth.signOut()
        return {
          ok: false,
          error: `讀取 staff_accounts 失敗：${staffError.message}（HTTP ${staffStatus ?? 'unknown'}）`,
        }
      }

      const staffRow = staffData ? mapStaffRow(staffData) : null
      if (!staffRow) {
        const { data: emailMatchedRow } = await supabase
          .from('staff_accounts')
          .select('id,email,name,role,active')
          .eq('email', e.toLowerCase())
          .maybeSingle<StaffRow>()

        await supabase.auth.signOut()
        if (emailMatchedRow) {
          return {
            ok: false,
            error: `帳號資料 id 不一致：auth.users.id=${data.user.id}，staff_accounts.id=${emailMatchedRow.id}。請用 auth.users 的 id 重建 staff_accounts。`,
          }
        }
        return { ok: false, error: `找不到 staff_accounts 對應資料（auth.users.id=${data.user.id}）` }
      }

      if (!staffRow.active) {
        await supabase.auth.signOut()
        return { ok: false, error: '此帳號尚未啟用，請聯絡主管' }
      }

      setUser({
        id: staffRow.id,
        email: staffRow.email,
        name: staffRow.name,
        role: staffRow.role,
      })
      return { ok: true }
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'unknown error'
      return { ok: false, error: `登入失敗：${detail}` }
    }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setStaffAccounts([])
  }, [])

  const can = useCallback(
    (permission: Permission) => {
      if (!user) return false
      return canRole(user.role, permission)
    },
    [user],
  )

  const adminIssueAccount = useCallback<AuthContextValue['adminIssueAccount']>(
    async (input) => {
      if (!user || !canRole(user.role, 'manage:staff')) throw new Error('permission denied')
      const row = await invokeAdminStaff<StaffRow>({
        action: 'create',
        email: input.email,
        password: input.password,
        name: input.name,
        role: input.role,
        active: input.active,
      })
      const next = mapStaffRow(row)
      setStaffAccounts((prev) => {
        const idx = prev.findIndex((x) => x.id === next.id)
        if (idx >= 0) {
          const copy = [...prev]
          copy[idx] = next
          return copy
        }
        return [next, ...prev]
      })
      return next
    },
    [user],
  )

  const adminSetPassword = useCallback<AuthContextValue['adminSetPassword']>(
    async (userId, password) => {
      if (!user || !canRole(user.role, 'manage:staff')) throw new Error('permission denied')
      try {
        await invokeAdminStaff({ action: 'set_password', userId, password })
        return true
      } catch {
        return false
      }
    },
    [user],
  )

  const adminSetActive = useCallback<AuthContextValue['adminSetActive']>(
    async (userId, active) => {
      if (!user || !canRole(user.role, 'manage:staff')) return false
      try {
        const row = await invokeAdminStaff<StaffRow>({ action: 'set_active', userId, active })
        const next = mapStaffRow(row)
        setStaffAccounts((prev) => prev.map((x) => (x.id === next.id ? next : x)))
        return true
      } catch {
        return false
      }
    },
    [user],
  )

  const adminDeleteAccount = useCallback<AuthContextValue['adminDeleteAccount']>(
    async (userId) => {
      if (!user || !canRole(user.role, 'manage:staff')) return { ok: false, error: '權限不足' }
      if (userId === user.id) return { ok: false, error: '不可刪除目前登入中的帳號' }
      try {
        await invokeAdminStaff({ action: 'delete', userId })
        setStaffAccounts((prev) => prev.filter((x) => x.id !== userId))
        return { ok: true }
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : '刪除失敗' }
      }
    },
    [user],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      staffAccounts,
      loadingStaffAccounts,
      signIn,
      signOut,
      can,
      adminIssueAccount,
      adminSetPassword,
      adminSetActive,
      adminDeleteAccount,
      refreshStaffAccounts,
    }),
    [
      user,
      loading,
      staffAccounts,
      loadingStaffAccounts,
      signIn,
      signOut,
      can,
      adminIssueAccount,
      adminSetPassword,
      adminSetActive,
      adminDeleteAccount,
      refreshStaffAccounts,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('AuthProvider missing')
  return ctx
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="muted">初始化登入資訊…</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}

export function RequirePermission({
  permission,
  children,
  fallbackTo = '/',
}: {
  permission: Permission
  children: React.ReactNode
  fallbackTo?: string
}) {
  const { can } = useAuth()
  if (!can(permission)) return <Navigate to={fallbackTo} replace />
  return <>{children}</>
}
