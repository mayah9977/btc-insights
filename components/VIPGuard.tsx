'use client'

import { useVIP } from '@/lib/vip/vipClient'
import type { VIPLevel } from '@/lib/vip/vipTypes'
import Link from 'next/link'

type Props = {
  require: Exclude<VIPLevel, 'FREE'>
  children: React.ReactNode
}

export function VIPGuard({ require, children }: Props) {
  const { vipLevel } = useVIP()

  const order: VIPLevel[] = ['FREE', 'VIP1', 'VIP2', 'VIP3']
  const allowed =
    order.indexOf(vipLevel) >= order.indexOf(require)

  if (allowed) return <>{children}</>

  return (
    <section className="max-w-xl mx-auto mt-24 rounded-2xl border border-vipBorder bg-vipCard p-8 shadow-[0_20px_80px_rgba(0,0,0,0.7)]">
      <div className="text-center space-y-4">
        <div className="text-3xl">🔒</div>

        <h2 className="text-xl font-semibold text-white">
          VIP 전용 분석 기능
        </h2>

        <p className="text-sm text-zinc-400 leading-relaxed">
          이 기능은 <b className="text-zinc-200">{require}</b> 이상
          사용자에게 제공되는 고급 분석 기능입니다.
        </p>

        <ul className="text-sm text-zinc-400 space-y-1">
          <li>✔ 더 정교한 시장 리스크 판단</li>
          <li>✔ 실시간 고급 알림</li>
          <li>✔ VIP 전용 시나리오 분석</li>
        </ul>

        <Link
          href="/account"
          className="inline-block mt-6 rounded-xl bg-vipAccent px-6 py-3 font-semibold text-black hover:opacity-90 transition"
        >
          VIP 업그레이드 보기 →
        </Link>
      </div>
    </section>
  )
}
