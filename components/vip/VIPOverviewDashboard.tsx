//components/vip/VIPOverviewDashboard.tsx

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

  const handleTelegramConnect = () => {
    window.open('https://t.me/YOUR_TELEGRAM_BOT_USERNAME', '_blank')
  }

  return (
    <section className="p-4 space-y-6">
      {/* =========================
         Header
      ========================= */}

      {/* =========================
         VIP Telegram Report Subscription
      ========================= */}
      {canDownloadReport && (
        <div
          className="
            w-full
            rounded-xl
            bg-gradient-to-r
            from-yellow-400
            to-orange-500
            p-4
            text-black
            shadow-lg
          "
        >
          <div className="flex items-start gap-3">
            <span className="text-xl">
              📩
            </span>

            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold leading-snug">
                Telegram VIP Daily Report
              </div>

              <div className="mt-1 text-xs font-medium leading-relaxed text-black/75">
                매일 오전 7시, 오늘의 주요 뉴스 + 온체인 데이터 +
                세력 흐름 분석 리포트를 Telegram으로 자동 전송합니다.
              </div>

              <div className="mt-3 grid grid-cols-1 gap-1.5 text-[11px] font-semibold text-black/80 sm:grid-cols-3">
                <div>✔ Today’s top news summary</div>
                <div>✔ On-chain data intelligence</div>
                <div>✔ Institutional flow analysis report</div>
              </div>

              <button
                onClick={handleTelegramConnect}
                className="
                  mt-4
                  w-full
                  rounded-xl
                  bg-black/85
                  py-2.5
                  text-xs
                  font-bold
                  text-yellow-200
                  transition
                  active:scale-[0.98]
                "
              >
                Telegram Bot 연결하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================
         Market Context Layer
         (Separated from Live Risk)
      ========================= */}
      <MarketContextPanel />
    </section>
  )
}
