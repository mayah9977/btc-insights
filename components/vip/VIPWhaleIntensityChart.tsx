'use client'

import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Scatter,
  Label,
} from 'recharts'

import {
  useWhaleIntensityHistory,
  type WhaleIntensityPoint,
} from '@/lib/realtime/useWhaleIntensityHistory'

type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'

type Props = {
  symbol?: string
  showTimeAxis?: boolean
  riskLevel?: RiskLevel
}

type FlagPoint = {
  ts: number
  value: number
  kind?: string // 예: 'WHALE_WARNING'
}

/** Tooltip 커스텀: 마커 hover 시 “🚨 고래 급변 감지” 표시 */
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: any[]
  label?: any
}) {
  if (!active || !payload?.length) return null

  // Scatter(플래그) hover인지 판별
  const p0 = payload[0]?.payload as (WhaleIntensityPoint & { kind?: string }) | undefined
  const isFlag = p0?.kind === 'WHALE_WARNING'

  const timeText =
    typeof label === 'number'
      ? new Date(label).toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'Asia/Seoul',
        })
      : ''

  const value = Number(p0?.value)
  const valueText = Number.isFinite(value) ? value.toFixed(2) : '--'

  return (
    <div className="rounded-md border border-zinc-700 bg-black/80 px-2 py-1 text-xs text-zinc-100">
      {timeText && <div className="text-zinc-300">{timeText}</div>}
      {isFlag && <div className="mt-0.5 font-semibold">🚨 고래 급변 감지</div>}
      <div className="mt-0.5">
        강도: <span className="font-medium text-white">{valueText}</span>
      </div>
    </div>
  )
}

export default function VIPWhaleIntensityChart({
  symbol = 'BTCUSDT',
  showTimeAxis = false,
  riskLevel,
}: Props) {
  // ✅ 훅은 절대 조건부로 호출하면 안 됨 (항상 호출)
  const { history, flagEvents } = useWhaleIntensityHistory({
    symbol,
    limit: 30,
  })

  const now = Date.now()
  const MIN_30 = now - 30 * 60 * 1000
  const HOUR_1 = now - 60 * 60 * 1000

  const latest = history.length ? history[history.length - 1] : null
  const latestValueText =
    latest && Number.isFinite(latest.value) ? latest.value.toFixed(2) : '--'

  // ✅ EXTREME(>=0.85) 연속 구간 1개(가장 최근) 자동 탐지
  const extremeRange = useMemo(() => {
    const TH = 0.85
    if (!history.length) return null

    let start: number | null = null
    let end: number | null = null

    for (let i = history.length - 1; i >= 0; i--) {
      const p = history[i]
      if (p.value >= TH) {
        end = end ?? p.ts
        start = p.ts
      } else {
        if (end !== null) break // 최근 연속 구간 끝났으면 종료
      }
    }

    if (start === null || end === null) return null
    return { x1: start, x2: end }
  }, [history])

  // ✅ flagEvents에 kind 주입(훅 구현이 ts/value만 내려주는 경우 대비)
  const flags: FlagPoint[] = useMemo(() => {
    const raw = (flagEvents ?? []) as any[]
    return raw
      .map((p) => ({
        ts: Number(p.ts),
        value: Number(p.value),
        kind: p.kind ?? 'WHALE_WARNING',
      }))
      .filter((p) => Number.isFinite(p.ts) && Number.isFinite(p.value))
  }, [flagEvents])

  return (
    <div className="rounded-xl border border-vipBorder bg-vipCard p-4">
      {/* 헤더 + 오버레이(최신 whaleIntensity + riskLevel) */}
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-medium text-white">고래 체결 강도</div>

        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-md bg-black/30 px-2 py-1 text-zinc-200">
            강도 {latestValueText}
          </span>
          {riskLevel && (
            <span
              className={`rounded-md px-2 py-1 font-semibold ${
                riskLevel === 'EXTREME'
                  ? 'bg-red-500/20 text-red-200'
                  : riskLevel === 'HIGH'
                  ? 'bg-yellow-500/20 text-yellow-200'
                  : riskLevel === 'MEDIUM'
                  ? 'bg-blue-500/20 text-blue-200'
                  : 'bg-emerald-500/20 text-emerald-200'
              }`}
            >
              {riskLevel}
            </span>
          )}
        </div>
      </div>

      {/* ✅ 데이터 없을 때도 "return null" 하지 말고, UI로만 처리 (Hooks 순서 고정) */}
      {!history.length ? (
        <div className="h-40 rounded-lg border border-zinc-800 bg-black/30" />
      ) : (
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <XAxis
                dataKey="ts"
                hide={!showTimeAxis}
                tickFormatter={(ts) =>
                  new Date(ts).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                    timeZone: 'Asia/Seoul',
                  })
                }
              />
              <YAxis domain={[0, 1]} hide />

              {/* 최근 1시간 음영 */}
              <ReferenceArea x1={HOUR_1} x2={now} fill="rgba(255,255,255,0.04)" />

              {/* 최근 30분 강조 음영 */}
              <ReferenceArea x1={MIN_30} x2={now} fill="rgba(239,68,68,0.08)" />

              {/* EXTREME 구간 자동 음영 + 라벨 */}
              {extremeRange && (
                <ReferenceArea x1={extremeRange.x1} x2={extremeRange.x2} fill="rgba(239,68,68,0.12)">
                  <Label value="EXTREME" position="insideTopLeft" fill="rgba(239,68,68,0.9)" fontSize={11} />
                </ReferenceArea>
              )}

              <Tooltip content={<CustomTooltip />} />

              <Area
                type="monotone"
                dataKey="value"
                stroke="rgba(239,68,68,0.9)"
                fill="rgba(239,68,68,0.25)"
                strokeWidth={2}
                isAnimationActive={false}
              />

              <Line
                type="monotone"
                dataKey="value"
                stroke="rgba(239,68,68,1)"
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
              />

              {/* 🚨 고래 급변 플래그 마커 */}
              <Scatter data={flags} dataKey="value" fill="#f87171" shape="triangle" />

              {/* 기준선 */}
              <ReferenceLine y={0.7} stroke="rgba(250,204,21,0.8)" strokeDasharray="4 4" />
              <ReferenceLine y={0.85} stroke="rgba(239,68,68,0.9)" strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-2 flex justify-between text-xs text-zinc-400">
        <span>낮음</span>
        <span className="text-yellow-400">높음</span>
        <span className="text-red-400">최고조</span>
      </div>
    </div>
  )
}
