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
  // 판단 요약 (실시간 확정값)
  // =========================
  judgmentSentence: string
  confidence: number

  // =========================
  // 판단 타임라인 (히스토리)
  // =========================
  timeline: JudgementTimelineItem[]

  /** 🔥 판단 문장 / 신뢰도 갱신 (RISK_UPDATE 기준) */
  setJudgement: (params: {
    sentence: string
    confidence: number
  }) => void

  /** 🔥 실시간 판단 이벤트 누적 (히스토리용) */
  append: (item: JudgementTimelineItem) => void

  /** 전체 초기화 */
  reset: () => void
}

/**
 * ⚠️ SSOT: VIP 판단 단일 소스
 * - 계산 ❌
 * - 해석 ❌
 * - UI ❌
 * - 서버 RISK_UPDATE 결과만 저장
 */
export const useVipJudgementStore =
  create<JudgementState>((set) => ({
    judgmentSentence: '',
    confidence: 0,

    timeline: [],

    setJudgement: ({ sentence, confidence }) =>
      set({
        judgmentSentence: sentence,
        confidence,
      }),

    append: (item) =>
      set((state) => ({
        timeline: [...state.timeline, item],
      })),

    reset: () =>
      set({
        judgmentSentence: '',
        confidence: 0,
        timeline: [],
      }),
  }))

