'use client'

import { useVipOverviewStore } from '@/lib/vip/overviewStore'
import { MarketContextPanel } from '@/components/market/context/MarketContextPanel'

/**
 * VIP Overview Dashboard (Final Clean Version)
 *
 * Architecture:
 * - No duplicated risk narrative
 * - No structural summary layer
 * - No market pulse duplication
 * - Live state handled above (VIPClientPage)
 * - This layer = VIP status + report + context only
 */

export function VIPOverviewDashboard() {
  const { vipLevel } = useVipOverviewStore()

  const vipLevelSafe = vipLevel ?? 'FREE'
  const canDownloadReport = vipLevelSafe === 'VIP3'

  return (
    <section className="p-4 space-y-6">
      {/* =========================
         Header
      ========================= */}

      {/* =========================
         VIP Report Download
      ========================= */}
      {canDownloadReport && (
        <button
          onClick={() => {
            window.open('/api/cron/vip-report', '_blank')
          }}
          className="
            w-full
            rounded-xl
            bg-gradient-to-r
            from-yellow-400
            to-orange-500
            py-3
            text-sm
            font-bold
            text-black
            shadow-lg
            active:scale-[0.98]
          "
        >
          📄 Download today’s VIP report
        </button>
      )}

      {/* =========================
         Market Context Layer
         (Separated from Live Risk)
      ========================= */}
      <MarketContextPanel />
    </section>
  )
}
