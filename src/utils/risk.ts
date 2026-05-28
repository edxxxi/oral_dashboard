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
  if (!a) return 'medium'
  let score = 0

  // 1) MNA-SF：<= 11 視為未達標
  if (typeof a.mnaScore === 'number' && a.mnaScore <= 11) score += 1

  // 2) SPMSQ：錯誤數 >= 3 視為未達標
  if (typeof a.spmsqErrors === 'number' && a.spmsqErrors >= 3) score += 1

  // 3) 吞嚥篩檢：任一旗標為真即未達標
  if (a.swallowScreen) {
    const flags = [
      a.swallowScreen.coughWhenDrinking,
      a.swallowScreen.wetVoice,
      a.swallowScreen.chokingHistory,
      a.swallowScreen.needsAssistFeeding,
    ].filter(Boolean).length
    if (flags >= 1) score += 1
  }

  // 4) 30 秒吞嚥：有咳嗽或次數 < 3 視為未達標
  if (a.swallow30s) {
    const lowSwallow =
      typeof a.swallow30s.swallows === 'number' && a.swallow30s.swallows < 3
    if (a.swallow30s.cough || lowSwallow) score += 1
  }

  // 5) 體重：< 45kg 視為未達標
  if (typeof a.weightKg === 'number' && a.weightKg < 45) score += 1

  if (score > 4) return 'high'
  if (score === 3) return 'medium'
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
