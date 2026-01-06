import Link from 'next/link'

export default function VIPOnboardingPage() {
  return (
    <main className="min-h-screen bg-[#07090D] text-slate-200">
      <div className="max-w-3xl mx-auto px-6 py-24 space-y-16">

        {/* ================= Header ================= */}
        <header className="space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-white">
            VIP 판단은 다릅니다
          </h1>
          <p className="text-lg text-slate-400">
            VIP는 점수를 보지 않습니다.{' '}
            <span className="text-slate-100 font-semibold">
              결정이 만들어지는 과정
            </span>
            을 봅니다.
          </p>
        </header>

        {/* ================= Comparison ================= */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-10">

          {/* ❌ Normal */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
            <p className="text-lg font-semibold text-slate-300">
              ❌ 지금까지 보던 것
            </p>
            <ul className="space-y-2 text-slate-400 text-sm leading-relaxed">
              <li>• 하나의 점수</li>
              <li>• ENTRY 버튼</li>
              <li>• 결과는 운에 의존</li>
            </ul>
          </div>

          {/* ⭕ VIP */}
          <div className="rounded-2xl border border-emerald-400/40 bg-emerald-400/[0.05] p-6 space-y-4">
            <p className="text-lg font-semibold text-emerald-400">
              ⭕ VIP에서 보는 것
            </p>
            <ul className="space-y-2 text-slate-200 text-sm leading-relaxed">
              <li>• 왜 지금 위험한지</li>
              <li>• 언제 다시 유리해지는지</li>
              <li>• 과거 동일 구간의 실제 결과</li>
            </ul>
          </div>

        </section>

        {/* ================= Message ================= */}
        <section className="space-y-4">
          <p className="text-slate-300 leading-relaxed">
            VIP는 “지금 들어갈까?”가 아니라,
            <br />
            <span className="text-white font-semibold">
              “왜 지금은 들어가면 안 되는가”
            </span>
            를 먼저 보여줍니다.
          </p>
          <p className="text-slate-400 text-sm">
            이 판단은 단일 지표가 아니라,
            고래 흐름 · 변동성 · 실패 확률의
            시간 누적 분석으로 만들어집니다.
          </p>
        </section>

        {/* ================= CTA ================= */}
        <div className="pt-8">
          <Link
            href="/ko/casino/vip"
            className="
              inline-flex items-center gap-2
              px-8 py-4 rounded-full
              bg-emerald-400 text-black
              font-semibold text-lg
              transition-all
              hover:bg-emerald-300
              hover:scale-[1.02]
              hover:shadow-[0_0_40px_rgba(52,211,153,0.4)]
            "
          >
            VIP 판단 시작 →
          </Link>
        </div>

      </div>
    </main>
  )
}
