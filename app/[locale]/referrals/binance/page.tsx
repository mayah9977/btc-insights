export default function BinanceReferralPage() {
  return (
    <section className="space-y-8 text-[#D1D4DC]">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold">Binance</h1>
        <p className="text-[#B2B5BE]">
          유동성 · 체결 안정성 기준 글로벌 1위 거래소
        </p>
      </header>

      <div className="bg-[#1E222D] border border-[#2A2E39] rounded-xl p-6 space-y-4">
        <p className="text-sm text-[#B2B5BE]">
          ✔ 초고유동성 / ✔ 깊은 오더북 / ✔ 기관 참여도 높음
        </p>

        <p className="text-sm">
          Fee Benefit{' '}
          <span className="text-emerald-400 font-medium">
            최대 50% ~ 20%
          </span>
        </p>

        <a
          href={`https://accounts.binance.com/register?ref=${process.env.NEXT_PUBLIC_BINANCE_REF}`}
          target="_blank"
          className="inline-block mt-2 text-sm text-[#9AA0A6] hover:text-[#D1D4DC]"
        >
          공식 거래 환경 확인 →
        </a>
      </div>
    </section>
  )
}
