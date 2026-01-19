import { create } from 'zustand'

/**
 * 판단 타임라인 아이템
 */
export type JudgementTimelineItem = {
  time: string
  state: string
  note: string
}

export type JudgementState = {
  // =========================
  // 판단 요약 (이미 계산된 결과)
  // =========================
  judgmentSentence: string
  confidence: number

  // =========================
  // 판단 타임라인
  // =========================
  timeline: JudgementTimelineItem[]
}

/**
 * ⚠️ SSOT: VIP 판단 단일 소스
 * - 계산 ❌
 * - 해석 ❌
 * - UI ❌
 * - 이미 결정된 "판단 결과"만 보관
 */
export const useVipJudgementStore = create<JudgementState>(() => ({
  judgmentSentence:
    'Risk of entry is high due to current volatility and whale activity.',
  confidence: 0.82,

  timeline: [
    {
      time: '12:10',
      state: 'Increased volatility',
      note: 'Whale fastening increase detected',
    },
    {
      time: '12:25',
      state: 'Risk increased',
      note: 'Entry restriction judgment',
    },
  ],
}))
