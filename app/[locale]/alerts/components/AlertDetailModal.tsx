'use client'

import type { PriceAlert } from '@/lib/alerts/alertStore.client'
import AlertStatusBadge from './AlertStatusBadge'
import PerformanceMiniChart from './PerformanceMiniChart'

type Props = {
  alert: PriceAlert
  onClose: () => void
}

export default function AlertDetailModal({ alert, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-md">
      <div className="relative w-full max-w-xl rounded-3xl bg-gradient-to-b from-[#151a2b] to-[#0b0f17] border border-white/10 p-8 shadow-[0_40px_120px_rgba(0,0,0,0.9)]">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-400">{alert.symbol}</div>
            <div className="mt-1 text-3xl font-bold text-white">
              {alert.targetPrice
                ? alert.targetPrice.toLocaleString()
                : `${alert.percent}%`}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              {alert.condition.replace('_', ' ')}
            </div>
          </div>
          <AlertStatusBadge alert={alert} />
        </div>

        {/* Chart */}
        <div className="mt-6">
          <PerformanceMiniChart
            data={[
              { value: -0.4 },
              { value: 0.2 },
              { value: 0.9 },
              { value: 0.6 },
              { value: 1.4 },
            ]}
          />
        </div>

        {/* Meta */}
        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <Meta label="알림 방식" value={alert.repeatMode === 'ONCE' ? '1회' : '반복'} />
          <Meta
            label="쿨다운"
            value={
              alert.cooldownMs
                ? `${Math.round(alert.cooldownMs / 60000)}분`
                : '-'
            }
          />
          <Meta label="활성 상태" value={alert.enabled ? 'ON' : 'OFF'} />
          <Meta
            label="최근 트리거"
            value={
              alert.lastTriggeredAt
                ? new Date(alert.lastTriggeredAt).toLocaleString()
                : '-'
            }
          />
        </div>
      </div>
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-1 font-medium text-white">{value}</div>
    </div>
  )
}
