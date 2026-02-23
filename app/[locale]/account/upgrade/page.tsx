// app/[locale]/account/upgrade/page.tsx

export default function UpgradePage() {
  return (
    <main className="max-w-4xl mx-auto py-20 space-y-16">

      {/* 헤더 */}
      <section className="space-y-6 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-white">
          VIP 리스크 관측시스템 접근 안내
        </h1>

        <p className="text-neutral-400 max-w-2xl mx-auto">
          본 시스템은 매수/매도 신호가 아닌 데이터를 기반으로 위험구간을 알려 사용자의 손실을 줄이는것을 목적으로 설계되었습니다.
          
        </p>
      </section>

      {/* 시스템 설명 */}
      <section className="rounded-2xl border border-zinc-800 bg-neutral-900/60 p-8 space-y-6">
        <h2 className="text-lg font-semibold text-yellow-400">
          ACCESS LEVEL : VIP ONLY
        </h2>

        <p className="text-neutral-300">
          AI기반 실시간 고래 체결 강도, Open Interest, Funding rate, 변동성, 추세, 구조 등을 종합하여 시장의 위험 구간을 감지하는 리스크 관측 시스템입니다.
        </p>

        <ul className="text-neutral-400 space-y-2 text-sm">
          <li>• 실시간 구조 위험 감지</li>
          <li>• 고위험 구간 분류 브리핑</li>
          <li>• 내부 시나리오 판단 요약</li>
        </ul>
      </section>

      {/* CTA */}
      <section className="text-center space-y-6">
        <a
          href="/ko/casino/vip"
          className="
            inline-block
            px-8 py-4
            rounded-xl
            bg-gradient-to-r
            from-yellow-500
            to-orange-500
            text-black
            font-semibold
            shadow-[0_0_40px_rgba(250,204,21,0.3)]
            hover:scale-105
            transition-all
          "
        >
          VIP ONLY 시스템 입장 →
        </a>

        <p className="text-xs text-neutral-500">
          본 시스템은 수익을 보장하지 않습니다.
          AI 구조 분석 기반 브리핑 제공 목적입니다.
        </p>
      </section>

    </main>
  )
}