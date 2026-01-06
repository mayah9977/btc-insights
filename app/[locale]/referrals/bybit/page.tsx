export default function BybitReferralPage() {
  return (
    <section className="space-y-8 text-[#D1D4DC]">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold">Bybit</h1>
        <p className="text-[#B2B5BE]">
          단기 트레이딩 · 빠른 체결 반응성 중심 거래소
        </p>
      </header>

      <div className="bg-[#1E222D] border border-[#2A2E39] rounded-xl p-6 space-y-4">
        <p className="text-sm text-[#B2B5BE]">
          ✔ 빠른 주문 반응 / ✔ 스캘핑 친화 / ✔ 직관적인 파생 UI
        </p>

        <p className="text-sm">
          Fee Benefit{' '}
          <span className="text-emerald-400 font-medium">
            최대 50% ~ 20%
          </span>
        </p>

        <a
          href={`https://www.bybit.com/en/invite/?ref=${process.env.NEXT_PUBLIC_BYBIT_REF}`}
          target="_blank"
          className="inline-block mt-2 text-sm text-[#9AA0A6] hover:text-[#D1D4DC]"
        >
          공식 거래 환경 확인 →
        </a>
      </div>
    </section>
  )
}
