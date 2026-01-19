'use client'

import { useRealtimePNL } from './useRealtimePNL'
import VIPComparison from './VIPComparison'

export default function AccountPage() {
  /**
   * ❌ 중요
   * account 영역에서는 useVIP / VIPContext / VIPRealtimeRoot
   * 절대 사용하지 않는다.
   */

  // ✅ 임시 VIP 등급 (Phase 3에서 서버/DB 값으로 대체)
  const vipLevel: 'FREE' | 'VIP1' | 'VIP2' | 'VIP3' = 'FREE'

  const myPNL = useRealtimePNL()

  // ⚠️ 실제 서비스에서는 서버 통계 or Redis 값
  const vipAvgPNL = 125.4

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-white">
          계정 요약
        </h1>
        <p className="text-sm text-zinc-400">
          현재 등급: {vipLevel}
        </p>
      </header>

      {/* 실시간 PNL */}
      <section className="rounded-2xl bg-vipCard border border-vipBorder p-5">
        <div className="text-sm text-zinc-400">
          실시간 PNL
        </div>
        <div className="text-3xl font-bold text-white">
          {myPNL.toFixed(2)} USDT
        </div>
      </section>

      {/* VIP 성과 비교 */}
      <VIPComparison
        myPNL={myPNL}
        vipAvgPNL={vipAvgPNL}
      />

      {/* FREE 유저 업셀 */}
      {vipLevel === 'FREE' && (
        <section className="rounded-2xl border border-vipBorder bg-vipCard p-6 text-center">
          <p className="text-zinc-300">
            VIP 유저들은 평균적으로 더 안정적인
            성과를 유지합니다.
          </p>
          {/* 🔒 hard navigation 유지 */}
          <a
            href="/ko/account/upgrade"
            className="inline-block mt-4 rounded-xl bg-vipAccent px-6 py-3 font-semibold text-black"
          >
            VIP 업그레이드 →
          </a>
        </section>
      )}
    </main>
  )
}
