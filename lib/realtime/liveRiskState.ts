import { create } from 'zustand'
import type { RiskLevel } from '@/lib/vip/riskTypes'

/* =========================
 * Types
 * ========================= */

export type RiskDirection = 'UP' | 'DOWN' | 'STABLE'
export type MarketPulse = 'STABLE' | 'ACCELERATING'

export type LiveRiskState = {
  level: RiskLevel
  startedAt: number
  prevLevel: RiskLevel | null
  direction: RiskDirection
  whaleAccelerated: boolean
  whalePulse: boolean
  marketPulse: MarketPulse
  durationSec: number // ✅ 추가 (에러 해결 핵심)
}

export type LiveRiskStore = {
  state: LiveRiskState | null
  update: (input: {
    level: RiskLevel
    ts: number
    whaleAccelerated?: boolean
    preExtreme?: boolean
  }) => void
  triggerWhalePulse: () => void
  reset: () => void
}

/* =========================
 * Helpers
 * ========================= */

function compareRisk(
  prev: RiskLevel,
  next: RiskLevel,
): RiskDirection {
  const order: RiskLevel[] = [
    'LOW',
    'MEDIUM',
    'HIGH',
    'EXTREME',
  ]
  const p = order.indexOf(prev)
  const n = order.indexOf(next)

  if (n > p) return 'UP'
  if (n < p) return 'DOWN'
  return 'STABLE'
}

const VALID_RISK_LEVELS: RiskLevel[] = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'EXTREME',
]

function normalizeRiskLevel(
  level: RiskLevel | undefined | null,
): RiskLevel {
  if (level && VALID_RISK_LEVELS.includes(level)) {
    return level
  }
  return 'LOW'
}

/* =========================
 * Store
 * ========================= */

let pulseTimer: NodeJS.Timeout | null = null

export const useLiveRiskState =
  create<LiveRiskStore>((set, get) => ({
    state: null,

    update: ({ level, ts, whaleAccelerated, preExtreme }) => {
      const prev = get().state
      const safeLevel = normalizeRiskLevel(level)

      const marketPulse: MarketPulse =
        preExtreme ? 'ACCELERATING' : 'STABLE'

      const shouldPulse =
        !!whaleAccelerated ||
        !!preExtreme ||
        safeLevel === 'HIGH' ||
        safeLevel === 'EXTREME'

      const now = Date.now()

      /* =========================
       * 최초 진입
       * ========================= */
      if (!prev) {
        set({
          state: {
            level: safeLevel,
            prevLevel: null,
            direction: 'STABLE',
            startedAt: ts,
            whaleAccelerated: !!whaleAccelerated,
            whalePulse: shouldPulse,
            marketPulse,
            durationSec: 0, // ✅ 최초 진입
          },
        })

        if (shouldPulse) triggerPulse(set, get)
        return
      }

      /* =========================
       * 동일 단계
       * ========================= */
      if (prev.level === safeLevel) {
        const nextWhaleAccelerated =
          whaleAccelerated ?? prev.whaleAccelerated

        const durationSec = Math.floor(
          (now - prev.startedAt) / 1000,
        )

        if (
          nextWhaleAccelerated === prev.whaleAccelerated &&
          marketPulse === prev.marketPulse
        ) {
          // durationSec만 갱신
          set({
            state: {
              ...prev,
              durationSec,
            },
          })
          return
        }

        set({
          state: {
            ...prev,
            whaleAccelerated: nextWhaleAccelerated,
            marketPulse,
            durationSec,
          },
        })

        if (shouldPulse && !prev.whalePulse) {
          triggerPulse(set, get)
        }

        return
      }

      /* =========================
       * 단계 변경
       * ========================= */
      const direction = compareRisk(
        prev.level,
        safeLevel,
      )

      set({
        state: {
          level: safeLevel,
          prevLevel: prev.level,
          direction,
          startedAt: ts,
          whaleAccelerated: !!whaleAccelerated,
          whalePulse: shouldPulse,
          marketPulse,
          durationSec: 0, // 단계 바뀌면 리셋
        },
      })

      if (shouldPulse) triggerPulse(set, get)
    },

    triggerWhalePulse: () => {
      triggerPulse(set, get)
    },

    reset: () => {
      if (pulseTimer) {
        clearTimeout(pulseTimer)
        pulseTimer = null
      }
      set({ state: null })
    },
  }))

/* =========================
 * Pulse Helper
 * ========================= */

function triggerPulse(set: any, get: any) {
  const current = get().state
  if (!current) return

  if (current.whalePulse) return

  set({
    state: {
      ...current,
      whalePulse: true,
    },
  })

  if (pulseTimer) clearTimeout(pulseTimer)

  pulseTimer = setTimeout(() => {
    const latest = get().state
    if (!latest) return

    set({
      state: {
        ...latest,
        whalePulse: false,
      },
    })
  }, 650)
}
