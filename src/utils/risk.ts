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

export function riskLevelText(level: RiskLevel) {
  switch (level) {
    case 'high':
      return '高風險'
    case 'medium':
      return '中風險'
    case 'low':
      return '低風險'
  }
}

export function computeRiskLevel(a?: AssessmentRecord): RiskLevel {
  if (!a) return 'low'
  let score = 0

  // 1) EAT-10：總分 >= 3 視為未達標
  if (typeof a.eat10Score === 'number' && a.eat10Score >= 3) score += 1

  // 2) MNA-SF：總分 <= 11 視為未達標
  if (typeof a.mnaScore === 'number' && a.mnaScore <= 11) score += 1

  // 3) RSST (咀嚼能力/吞嚥次數)：次數 <= 2 視為未達標
  if (typeof a.rsstScore === 'number' && a.rsstScore <= 2) score += 1

  // 4) SPMSQ (認知功能)：錯誤數 >= 3 視為未達標
  if (typeof a.spmsqErrors === 'number' && a.spmsqErrors >= 3) score += 1

  // 5) Pataka (聲音評估)：任一指標不通過即未達標
  const pataka = a.nursingData?.pataka
  if (pataka) {
    const passed = (pataka.db60Passed ?? pataka.db50Passed) && pataka.clarityPassed
    if (!passed) score += 1
  }

  // 根據使用者要求：滿 5 分為紅燈，3 分以上為黃燈
  if (score >= 5) return 'high'
  if (score >= 3) return 'medium'
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
