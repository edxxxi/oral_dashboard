import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import type { Permission, Role } from './rbac'
import { can as canRole } from './rbac'
import {
  getIssuedAccounts,
  getDefaultSeededPasswordHint,
  resetIssuedPassword,
  seedIssuedAccountsIfEmpty,
  setIssuedActive,
  upsertIssuedAccount,
  verifyIssuedCredentials,
} from './issuedCredentials'

export type AuthUser = {
  email: string
  name: string
  role: Role
}

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean

  signIn: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>
  signOut: () => void

  can: (permission: Permission) => boolean

  // Admin helpers (prototype)
  adminIssueAccount: (input: { email: string; name: string; role: Role; active: boolean; password?: string }) => Promise<{ password: string }>
  adminResetPassword: (email: string) => Promise<{ password: string } | null>
  adminSetActive: (email: string, active: boolean) => boolean

  getSeededPasswordHint: () => string
  listIssuedAccounts: () => { email: string; name: string; role: Role; active: boolean }[]
}

const SESSION_KEY = 'oral-dashboard-auth-session-v1'

const AuthContext = createContext<AuthContextValue | null>(null)

function safeParseSession(raw: string | null): AuthUser | null {
  if (!raw) return null
  try {
    const x = JSON.parse(raw)
    if (!x || typeof x.email !== 'string' || typeof x.role !== 'string') return null
    return {
      email: String(x.email),
      name: String(x.name ?? ''),
      role: x.role as Role,
    }
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => safeParseSession(localStorage.getItem(SESSION_KEY)))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await seedIssuedAccountsIfEmpty()
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const signIn: AuthContextValue['signIn'] = async (email, password) => {
    const e = email.trim()
    const p = password
    if (!e || !p) return { ok: false, error: '請輸入帳號與密碼' }

    const verified = await verifyIssuedCredentials(e, p)
    if (!verified) return { ok: false, error: '帳號/密碼錯誤或帳號已停用' }

    const next: AuthUser = verified
    setUser(next)
    localStorage.setItem(SESSION_KEY, JSON.stringify(next))
    return { ok: true }
  }

  const signOut = () => {
    setUser(null)
    localStorage.removeItem(SESSION_KEY)
  }

  const can = (permission: Permission) => {
    if (!user) return false
    return canRole(user.role, permission)
  }

  const adminIssueAccount: AuthContextValue['adminIssueAccount'] = async (input) => {
    if (!user || !canRole(user.role, 'manage:staff')) {
      throw new Error('permission denied')
    }
    return upsertIssuedAccount(input)
  }

  const adminResetPassword: AuthContextValue['adminResetPassword'] = async (email) => {
    if (!user || !canRole(user.role, 'manage:staff')) {
      throw new Error('permission denied')
    }
    return resetIssuedPassword(email)
  }

  const adminSetActive: AuthContextValue['adminSetActive'] = (email, active) => {
    if (!user || !canRole(user.role, 'manage:staff')) {
      return false
    }
    return setIssuedActive(email, active)
  }

  const getSeededPasswordHint = () => getDefaultSeededPasswordHint()

  const listIssuedAccounts = () =>
    getIssuedAccounts().map((a) => ({ email: a.email, name: a.name, role: a.role, active: a.active }))

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signIn,
      signOut,
      can,
      adminIssueAccount,
      adminResetPassword,
      adminSetActive,
      getSeededPasswordHint,
      listIssuedAccounts,
    }),
    [user, loading],
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
