'use client'

import { useEffect, useRef, useState } from 'react'
import type { VIPLevel } from './vipTypes'
import type { RiskLevel } from './riskTypes'

import { notifyVipUpgrade } from './vipNotifier'
import { useVipRiskHistoryStore } from './riskHistoryStore'
import { useVipJudgementStore } from './judgementStore'
import { generateRiskSentence } from './riskSentence'

export type VipRealtimeState = {
  vipLevel: VIPLevel
  riskLevel: RiskLevel
  scenarios: any[]
  isExtreme: boolean
  lastTriggeredAt: number | null
  connected: boolean
}

type VipEvent =
  | { type: 'VIP_UPDATE'; vipLevel: VIPLevel }
  | {
      type: 'RISK_UPDATE'
      riskLevel: RiskLevel
      isExtreme: boolean
      ts: number
    }
  | { type: 'VIP_KPI_UPDATE'; kpi: any }
  | { type: 'heartbeat' }

const INITIAL_STATE: VipRealtimeState = {
  vipLevel: 'FREE',
  riskLevel: 'LOW',
  scenarios: [],
  isExtreme: false,
  lastTriggeredAt: null,
  connected: false,
}

const HEARTBEAT_TIMEOUT = 15_000
const BASE_RETRY_DELAY = 3_000
const MAX_RETRY_DELAY = 30_000

export function useVipRealtime(
  userId: string,
  onKpiUpdate?: (kpi: any) => void,
) {
  const [state, setState] =
    useState<VipRealtimeState>(INITIAL_STATE)

  const esRef = useRef<EventSource | null>(null)
  const lastVipRef = useRef<VIPLevel | null>(null)

  const heartbeatTimer = useRef<NodeJS.Timeout | null>(null)
  const retryTimer = useRef<NodeJS.Timeout | null>(null)
  const retryDelay = useRef(BASE_RETRY_DELAY)

  useEffect(() => {
    if (!userId) return

    const appendRisk =
      useVipRiskHistoryStore.getState().append

    const {
      append: appendJudgement,
      setJudgement,
    } = useVipJudgementStore.getState()

    const cleanup = () => {
      esRef.current?.close()
      esRef.current = null
      heartbeatTimer.current &&
        clearTimeout(heartbeatTimer.current)
      retryTimer.current &&
        clearTimeout(retryTimer.current)
    }

    const connect = () => {
      cleanup()

      const es = new EventSource(
        `/api/vip/stream?userId=${encodeURIComponent(userId)}`,
      )
      esRef.current = es

      const resetHeartbeat = () => {
        heartbeatTimer.current &&
          clearTimeout(heartbeatTimer.current)
        heartbeatTimer.current = setTimeout(
          () => es.close(),
          HEARTBEAT_TIMEOUT,
        )
      }

      es.onopen = () => {
        retryDelay.current = BASE_RETRY_DELAY
        setState(s => ({ ...s, connected: true }))
        resetHeartbeat()
      }

      es.onmessage = (e) => {
        resetHeartbeat()

        let data: VipEvent
        try {
          data = JSON.parse(e.data)
        } catch {
          return
        }

        if (data.type === 'heartbeat') return

        if (data.type === 'VIP_KPI_UPDATE') {
          onKpiUpdate?.(data.kpi)
          return
        }

        if (data.type === 'RISK_UPDATE') {
          const sentence =
            generateRiskSentence(data.riskLevel)

          setJudgement({
            sentence,
            confidence:
              data.riskLevel === 'LOW' ? 0.9 :
              data.riskLevel === 'MEDIUM' ? 0.8 :
              data.riskLevel === 'HIGH' ? 0.75 : 0.7,
          })

          const time = new Date(data.ts).toLocaleTimeString(
            'ko-KR',
            { hour: '2-digit', minute: '2-digit' },
          )

          appendRisk({
            level: data.riskLevel,
            reason: sentence,
            time,
          })

          appendJudgement({
            time,
            state:
              data.riskLevel === 'EXTREME'
                ? '리스크 급등'
                : data.riskLevel === 'HIGH'
                ? '리스크 상승'
                : data.riskLevel === 'MEDIUM'
                ? '변동성 증가'
                : '시장 안정',
            note: sentence,
          })
        }

        setState(prev => {
          if (data.type === 'VIP_UPDATE') {
            if (data.vipLevel !== lastVipRef.current) {
              const prevLevel = lastVipRef.current
              lastVipRef.current = data.vipLevel

              if (prevLevel) {
                notifyVipUpgrade(
                  userId,
                  prevLevel,
                  data.vipLevel,
                )
              }

              return {
                ...prev,
                vipLevel: data.vipLevel,
              }
            }
            return prev
          }

          if (data.type === 'RISK_UPDATE') {
            return {
              ...prev,
              riskLevel: data.riskLevel,
              isExtreme: data.isExtreme,
              lastTriggeredAt: data.ts,
            }
          }

          return prev
        })
      }

      es.onerror = () => {
        es.close()
        setState(s => ({ ...s, connected: false }))

        const delay = retryDelay.current
        retryDelay.current = Math.min(
          delay * 2,
          MAX_RETRY_DELAY,
        )
        retryTimer.current = setTimeout(connect, delay)
      }
    }

    connect()
    return cleanup
  }, [userId, onKpiUpdate])

  return state
}
