import { create } from 'zustand'

export type JudgementTimelineItem = {
  time: string
  state: string
  note: string
}

type JudgementState = {
  // 판단 요약 (이미 계산된 결과)
  judgementSentence: string
  confidence: number

  // 판단 타임라인
  timeline: JudgementTimelineItem[]
}

/**
 * ⚠️ SSOT: VIP 판단 단일 소스
 * - 계산 ❌
 * - 해석 ❌
 * - UI ❌
 * - "이미 결정된 판단 결과"만 보관
 */
export const useVipJudgementStore = create<JudgementState>(() => ({
  judgementSentence: '현재 변동성과 고래 활동으로 진입 리스크가 높습니다.',
  confidence: 0.82,

  timeline: [
    {
      time: '12:10',
      state: '변동성 확대',
      note: 'Whale 체결 증가 감지',
    },
    {
      time: '12:25',
      state: '리스크 상향',
      note: '진입 제한 판단',
    },
  ],
}))
