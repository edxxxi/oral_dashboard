import { makeMockState } from './data/mock'
import type { Role } from './rbac'

export type IssuedAccount = {
  email: string
  name: string
  role: Role
  active: boolean
  salt: string
  passwordHash: string
}

const USERS_KEY = 'oral-dashboard-issued-accounts-v1'
const DEFAULT_SEEDED_PASSWORD = 'welcome123'

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function toHex(buf: ArrayBuffer) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function randomHex(bytes = 16) {
  const arr = new Uint8Array(bytes)
  crypto.getRandomValues(arr)
  return [...arr].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function sha256Hex(input: string) {
  const data = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return toHex(digest)
}

async function hashPassword(password: string, salt: string) {
  return sha256Hex(`${salt}:${password}`)
}

function safeParseUsers(raw: string | null): IssuedAccount[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((x) => x && typeof x.email === 'string')
      .map((x) => ({
        email: String(x.email),
        name: String(x.name ?? ''),
        role: x.role as Role,
        active: Boolean(x.active),
        salt: String(x.salt ?? ''),
        passwordHash: String(x.passwordHash ?? ''),
      }))
  } catch {
    return []
  }
}

export function getIssuedAccounts(): IssuedAccount[] {
  return safeParseUsers(localStorage.getItem(USERS_KEY))
}

function saveIssuedAccounts(users: IssuedAccount[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export async function seedIssuedAccountsIfEmpty(): Promise<void> {
  const existing = getIssuedAccounts()
  if (existing.length) return

  const staff = makeMockState().staff
  const seeded: IssuedAccount[] = []
  for (const s of staff) {
    const salt = randomHex(16)
    const passwordHash = await hashPassword(DEFAULT_SEEDED_PASSWORD, salt)
    seeded.push({
      email: normalizeEmail(s.email),
      name: s.name,
      role: s.role,
      active: s.active,
      salt,
      passwordHash,
    })
  }

  saveIssuedAccounts(seeded)
}

export type VerifiedUser = {
  email: string
  name: string
  role: Role
}

export async function verifyIssuedCredentials(email: string, password: string): Promise<VerifiedUser | null> {
  const users = getIssuedAccounts()
  const e = normalizeEmail(email)
  const u = users.find((x) => normalizeEmail(x.email) === e)
  if (!u || !u.active) return null
  const candidate = await hashPassword(password, u.salt)
  if (candidate !== u.passwordHash) return null
  return { email: u.email, name: u.name, role: u.role }
}

export function generatePassword(): string {
  // 12 chars, URL-safe-ish
  const bytes = new Uint8Array(9)
  crypto.getRandomValues(bytes)
  const b64 = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, 'A')
    .replace(/\//g, 'B')
    .replace(/=+$/g, '')
  return `P${b64}`.slice(0, 12)
}

export async function upsertIssuedAccount(input: {
  email: string
  name: string
  role: Role
  active: boolean
  password?: string
}): Promise<{ password: string }> {
  const users = getIssuedAccounts()
  const e = normalizeEmail(input.email)
  const password = (input.password?.trim() || generatePassword()).trim()

  const idx = users.findIndex((x) => normalizeEmail(x.email) === e)
  const salt = randomHex(16)
  const passwordHash = await hashPassword(password, salt)

  const next: IssuedAccount = {
    email: e,
    name: input.name,
    role: input.role,
    active: input.active,
    salt,
    passwordHash,
  }

  const newUsers = [...users]
  if (idx >= 0) newUsers[idx] = next
  else newUsers.push(next)

  saveIssuedAccounts(newUsers)
  return { password }
}

export async function resetIssuedPassword(email: string): Promise<{ password: string } | null> {
  const users = getIssuedAccounts()
  const e = normalizeEmail(email)
  const idx = users.findIndex((x) => normalizeEmail(x.email) === e)
  if (idx < 0) return null

  const password = generatePassword()
  const salt = randomHex(16)
  const passwordHash = await hashPassword(password, salt)

  const newUsers = [...users]
  newUsers[idx] = { ...newUsers[idx], salt, passwordHash }
  saveIssuedAccounts(newUsers)
  return { password }
}

export function setIssuedActive(email: string, active: boolean): boolean {
  const users = getIssuedAccounts()
  const e = normalizeEmail(email)
  const idx = users.findIndex((x) => normalizeEmail(x.email) === e)
  if (idx < 0) return false
  const newUsers = [...users]
  newUsers[idx] = { ...newUsers[idx], active }
  saveIssuedAccounts(newUsers)
  return true
}

export function getDefaultSeededPasswordHint() {
  return DEFAULT_SEEDED_PASSWORD
}
