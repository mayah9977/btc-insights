import { create } from 'zustand'

/**
 * Judgment timeline items
 * - Log of the basis on which the strategic judgment occurred
 */
// export type JudgmentTimelineItem = {
// time: string
// state: string
// Note: string
// }

export type JudgementTimelineItem = {
  time: string
  state: string
  note: string
}

/**
 * ✅ Backward/compat alias
 * - 외부에서 JudgmentTimelineItem / Note 로 들어와도 깨지지 않도록 유지
 */
export type JudgmentTimelineItem = {
  time: string
  state: string
  Note: string
}

/**
 * ✅ 입력 정규화용 (note/Note 둘 다 허용)
 * - 서버/클라이언트 어느 쪽에서 오든 안전하게 처리
 */
type IncomingTimelineItem = {
  time: string
  state: string
  note?: string
  Note?: string

  // 🔥 [ADD] Risk 체류 시간 (초) — 전달 전용
  durationSec?: number
}

// export type JudgmentState = {
//   /**
//    * 🔥 Strategic Decision Sentence (SSOT)
//    */
//   judgmentSentence: string
//   /**
//    * 🔥 Server original confidence
//    */
//   rawConfidence: number
//   /**
//    * Judgment timeline (history)
//    */
//   timeline: JudgmentTimelineItem[]
//   /**
//    * 🔥 RISK_UPDATE Update when received
//    */
//   setJudgement: (params: {
//     sentence: string
//     rawConfidence: number
//   }) => void
//   /**
//    * 🔥 Accumulation of judgment basis (including prevention of duplication)
//    */
//   append: (item: JudgmentTimelineItem) => void
//   /** Full initialization */
//   reset: () => void
// }

/**
 * ✅ Canonical SSOT Contract (권장)
 * - timeline의 단일 계약: note (lowercase)
 * - 외부 입력은 IncomingTimelineItem 로 받고 내부 저장은 항상 note로 통일
 */
export type JudgementState = {
  /**
   * 🔥 전략형 판단 문장 (SSOT)
   */
  judgmentSentence: string

  /**
   * 🔥 서버 원본 confidence
   */
  rawConfidence: number

  /**
   * 판단 타임라인 (히스토리)
   */
  timeline: JudgementTimelineItem[]

  /**
   * 🔥 RISK_UPDATE 수신 시 갱신
   */
  setJudgement: (params: {
    sentence: string
    rawConfidence: number
  }) => void

  /**
   * 🔥 판단 근거 누적 (중복 방지 포함)
   * - note/Note 입력을 모두 허용하고 내부는 note로 저장
   */
  append: (item: IncomingTimelineItem) => void

  /**
   * 🔥 [ADD] 누적 맥락 기반 판단 문장 조회
   * - 과거 → 현재 흐름을 하나의 문맥으로 반환
   * - durationSec 기준으로 문장 톤만 선택
   * - 계산 ❌ / 저장 ❌ / 표현 전용
   */
  getContextualJudgement: (durationSec?: number) => string

  /** 전체 초기화 */
  reset: () => void
}

/**
 * ✅ Backward/compat alias
 * - JudgmentState 라는 이름으로 import 해도 동작 유지
 */
export type JudgmentState = JudgementState

function normalizeTimelineItem(
  item: IncomingTimelineItem,
): JudgementTimelineItem | null {
  if (!item || typeof item !== 'object') return null
  const time = String(item.time ?? '')
  const state = String(item.state ?? '')
  const noteValue =
    typeof item.note === 'string'
      ? item.note
      : typeof item.Note === 'string'
      ? item.Note
      : ''

  return {
    time,
    state,
    note: noteValue,
  }
}

/**
 * ⚠️ VIP Judgement SSOT
 *
 * 원칙:
 * - 계산 ❌
 * - 해석 ❌
 * - UI ❌
 *
 * 역할:
 * - 서버에서 내려온 "전략 판단 결과"를
 *   하나의 문장 + 히스토리로 보존
 */
export const useVipJudgementStore =
  // create<JudgementState>((set, get) => ({
  // judgmentSentence: '',
  // rawConfidence: 0;
  //
  // timeline: [],
  //
  // setJudgement: ({ sentence, rawConfidence }) =>
  // set({
  // judgmentSentence: sentence,
  // rawConfidence,
  // }),
  //
  // append: (item) =>
  // set((state) => {
  // const last = state.timeline[state.timeline.length - 1]
  //
  // // ✅ Duplicate prevention condition
  // if (
  // last &&
  // last.state === item.state &&
  // last.note === item.note
  // ) {
  // return state
  // }
  //
  // return {
  // timeline: [...state.timeline, item],
  // }
  // }),
  //
  // reset: () =>
  // set({
  // judgmentSentence: '',
  // rawConfidence: 0;
  // timeline: [],
  // }),
  // }))
  create<JudgementState>((set, get) => ({
    judgmentSentence: '',
    rawConfidence: 0,

    timeline: [],

    setJudgement: ({ sentence, rawConfidence }) =>
      set({
        judgmentSentence: sentence,
        rawConfidence,
      }),

    append: (item) =>
      set((state) => {
        const normalized = normalizeTimelineItem(item)
        if (!normalized) return state

        const last = state.timeline[state.timeline.length - 1]

        // ✅ 중복 방지 조건 (note 기준)
        if (
          last &&
          last.state === normalized.state &&
          last.note === normalized.note
        ) {
          return state
        }

        return {
          timeline: [...state.timeline, normalized],
        }
      }),

    /**
     * 🔥 누적 맥락 기반 판단 문장
     * - 최근 흐름 → 현재 판단을 연결
     * - durationSec 기반으로 “일시 / 지속” 톤만 분기
     */
    getContextualJudgement: (durationSec?: number) => {
      const { judgmentSentence, timeline } = get()
      if (!judgmentSentence) return ''

      let sentence = judgmentSentence

      // 🔥 체류 시간 기반 톤 분기 (계산 ❌, 표현만)
      if (typeof durationSec === 'number') {
        if (durationSec >= 300) {
          sentence = `${judgmentSentence} 이 흐름은 일정 시간 이상 지속되고 있습니다.`
        } else if (durationSec < 60) {
          sentence = `${judgmentSentence} 현재는 단기적인 변동으로 관측되고 있습니다.`
        }
      }

      if (!Array.isArray(timeline) || timeline.length < 2) {
        return sentence
      }

      const prev = timeline[timeline.length - 2]
      const curr = timeline[timeline.length - 1]

      if (!prev || !curr) {
        return sentence
      }

      if (prev.state !== curr.state) {
        return `${prev.state} 흐름 이후, ${sentence}`
      }

      return sentence
    },

    reset: () =>
      set({
        judgmentSentence: '',
        rawConfidence: 0,
        timeline: [],
      }),
  }))
