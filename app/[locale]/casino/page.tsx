import WhaleBanner from "./components/WhaleBanner";
import CoinCard from "./components/CoinCard";
import { getCasinoSignals } from "./lib/getCasinoSignals";

import { WhaleTriggerProvider } from "./lib/whaleTriggerStore";
import { WhaleFrequencyProvider } from "./lib/whaleFrequencyStore";
import { DangerZoneLogProvider } from "./lib/dangerZoneLogStore";
import { WhaleHeatmapFocusProvider } from "./lib/whaleHeatmapFocusStore";

import type { VIPLevel } from "./lib/vipProbabilityCurve";

export default async function CasinoPage() {
  const signals = await getCasinoSignals();

  // 🔐 임시 VIP 레벨 결정
  const resolveVipLevel = (hasPermission: boolean): VIPLevel =>
    hasPermission ? "VIP1" : "FREE";

  return (
    <WhaleTriggerProvider>
      <WhaleFrequencyProvider>
        <DangerZoneLogProvider>
          {/* ✅ FIX: Heatmap Focus Provider 추가 */}
          <WhaleHeatmapFocusProvider>
            <main className="min-h-screen bg-black text-white p-6 space-y-6">
              <WhaleBanner />

              <header>
                <h1 className="text-3xl font-extrabold">
                  AI 카지노 시그널
                </h1>
                <p className="text-sm text-neutral-400">
                  고래 흐름 · AI 점수 기반 참고용 시각화
                </p>
              </header>

              <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {signals.map((signal) => (
                  <CoinCard
                    key={signal.symbol}
                    symbol={signal.symbol}
                    aiScore={signal.aiScore}
                    vipLevel={resolveVipLevel(signal.hasPermission)}
                  />
                ))}
              </section>

              <footer className="text-xs text-neutral-500 pt-6">
                본 화면은 투자·베팅을 권유하지 않으며 정보 제공용입니다.
              </footer>
            </main>
          </WhaleHeatmapFocusProvider>
        </DangerZoneLogProvider>
      </WhaleFrequencyProvider>
    </WhaleTriggerProvider>
  );
}
