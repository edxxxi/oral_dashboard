import type { AssessmentRecord, DietType, RiskLevel } from '../store/types'

export function riskLabel(level: RiskLevel) {
  switch (level) {
    case 'high':
      return '紅燈（高風險）'
    case 'medium':
      return '黃燈（中風險）'
    case 'low':
      return '綠燈（低風險）'
  }
}

export function computeRiskLevel(a?: AssessmentRecord): RiskLevel {
  if (!a) return 'medium'
  let score = 0

  if (typeof a.mnaScore === 'number') {
    if (a.mnaScore <= 7) score += 2
    else if (a.mnaScore <= 11) score += 1
  }

  if (typeof a.spmsqErrors === 'number') {
    if (a.spmsqErrors >= 5) score += 2
    else if (a.spmsqErrors >= 3) score += 1
  }

  if (a.swallowScreen) {
    const flags = [
      a.swallowScreen.coughWhenDrinking,
      a.swallowScreen.wetVoice,
      a.swallowScreen.chokingHistory,
      a.swallowScreen.needsAssistFeeding,
    ].filter(Boolean).length
    if (flags >= 3) score += 2
    else if (flags >= 1) score += 1
  }

  if (a.swallow30s) {
    if (a.swallow30s.cough) score += 2
    if (typeof a.swallow30s.swallows === 'number' && a.swallow30s.swallows < 3) score += 1
  }

  if (typeof a.weightKg === 'number' && a.weightKg < 45) score += 1

  if (score >= 5) return 'high'
  if (score >= 2) return 'medium'
  return 'low'
}

export function recommendDiet(level: RiskLevel): DietType {
  switch (level) {
    case 'high':
      return 'liquid'
    case 'medium':
      return 'soft'
    case 'low':
      return 'full'
  }
}

export function dietLabel(diet: DietType) {
  switch (diet) {
    case 'full':
      return '普通飲食（Full Diet）'
    case 'soft':
      return '軟質飲食（Soft Diet）'
    case 'liquid':
      return '流質飲食（Liquid diet）'
  }
}
