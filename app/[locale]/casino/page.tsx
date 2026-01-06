// ❌ 'use client' 있으면 안 됨

import WhaleBanner from './components/WhaleBanner';
import CoinCard from './components/CoinCard';
import { getCasinoSignals } from './lib/getCasinoSignals';
import type { VIPLevel } from './lib/vipProbabilityCurve';
import Link from 'next/link';

export default async function CasinoPage() {
  const signals = await getCasinoSignals();

  const resolveVipLevel = (hasPermission: boolean): VIPLevel =>
    hasPermission ? 'VIP1' : 'FREE';

  return (
    <div className="space-y-12">
      <WhaleBanner />

      <header className="space-y-3">
        <h1 className="text-3xl font-extrabold">
          AI 카지노 시그널
        </h1>
        <p className="text-sm text-neutral-400">
          고래 흐름 · AI 점수 기반 참고용 시각화
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {signals.map((signal) => (
          <CoinCard
            key={signal.symbol}
            symbol={signal.symbol}
            aiScore={signal.aiScore}
            vipLevel={resolveVipLevel(signal.hasPermission)}
          />
        ))}
      </section>

      <section className="bg-vipCard border border-vipBorder rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-white">
            VIP에서는 이 점수의 근거와 리스크 판단을 확인합니다
          </p>
          <p className="text-sm text-zinc-400 mt-1">
            고래 흐름 · 실패 확률 · 진입 제한 논리까지 제공
          </p>
        </div>

        <Link
          href="./casino/vip"
          className="px-6 py-3 rounded-full bg-vipAccent text-black font-semibold"
        >
          VIP 판단 보기 →
        </Link>
      </section>

      <footer className="text-xs text-neutral-500 pt-6">
        본 화면은 투자·베팅을 권유하지 않으며 정보 제공용입니다.
      </footer>
    </div>
  );
}
