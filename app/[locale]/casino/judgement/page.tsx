import Link from 'next/link'

export default function CasinoJudgementSummary() {
  return (
    <main className="min-h-screen bg-black text-slate-100">
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-10">
        <header className="space-y-3">
          <h1 className="text-3xl font-bold">
            현재 시장 판단 요약
          </h1>
          <p className="text-slate-400">
            VIP는 숫자가 아닌 <b>판단</b>을 제공합니다.
          </p>
        </header>

        <section className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 space-y-4">
          <p className="text-lg font-semibold text-slate-100">
            신규 진입은 통계적으로 불리한 구간입니다.
          </p>

          <ul className="list-disc list-inside text-slate-300 space-y-1">
            <li>고래 체결 강도 연속 증가</li>
            <li>AI 실패 확률 상승</li>
            <li>과거 유사 구간 손실 빈도 높음</li>
          </ul>
        </section>

        <section className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 space-y-3">
          <p className="text-slate-300">
            VIP에서는 다음 정보를 제공합니다:
          </p>
          <ul className="list-disc list-inside text-slate-300">
            <li>리스크 레벨 변화 타임라인</li>
            <li>실패 확률 수치화</li>
            <li>진입 제한 논리</li>
          </ul>

          <Link
            href="/ko/casino/vip"
            className="inline-block mt-4 px-6 py-3 rounded-full bg-vipAccent text-black font-semibold"
          >
            VIP 전체 판단 보기 →
          </Link>
        </section>

        <footer className="text-xs text-slate-500">
          본 페이지는 투자 판단을 돕기 위한 정보 제공용입니다.
        </footer>
      </div>
    </main>
  )
}
