import type { StaffAccount } from './store/types'

export type Role = StaffAccount['role']

export type Permission =
  | 'view:all'
  | 'manage:staff'
  | 'edit:medical_summary'
  | 'edit:oral_check_notes'
  | 'attach:upload'
  | 'edit:diet_status'
  | 'edit:slp_notes'
  | 'edit:dietitian_notes'
  | 'submit:spmsq'
  | 'submit:mna'
  | 'submit:swallow_screen'
  | 'submit:swallow_30s'
  | 'edit:doctor_note'

const perms = (...p: Permission[]) => p

const roleToPermissions: Record<Role, Permission[]> = {
  admin: perms(
    'view:all',
    'manage:staff',
    'edit:medical_summary',
    'edit:oral_check_notes',
    'attach:upload',
    'edit:diet_status',
    'edit:slp_notes',
    'edit:dietitian_notes',
    'submit:spmsq',
    'submit:mna',
    'submit:swallow_screen',
    'submit:swallow_30s',
    'edit:doctor_note',
  ),
  nurse: perms(
    'view:all',
    'manage:staff',
    'edit:medical_summary',
    'edit:oral_check_notes',
    'attach:upload',
    'edit:diet_status',
    'edit:slp_notes',
    'edit:dietitian_notes',
    'submit:spmsq',
    'submit:mna',
    'submit:swallow_screen',
    'submit:swallow_30s',
    'edit:doctor_note',
  ),
  caregiver: perms('view:all', 'edit:oral_check_notes', 'attach:upload', 'submit:swallow_screen'),
  slp: perms('view:all', 'edit:slp_notes', 'submit:swallow_30s'),
  dietitian: perms('view:all', 'edit:dietitian_notes', 'submit:mna'),
}

export function can(role: Role, permission: Permission): boolean {
  return roleToPermissions[role].includes(permission)
}

export function roleLabel(role: Role): string {
  switch (role) {
    case 'admin':
      return '主管/系統管理'
    case 'nurse':
      return '護理師'
    case 'dietitian':
      return '營養師'
    case 'caregiver':
      return '照服員'
    case 'slp':
      return '治療師（語言）'
    default:
      return role
  }
}
