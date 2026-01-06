export default function BitgetReferralPage() {
  return (
    <section className="space-y-8 text-[#D1D4DC]">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold">Bitget</h1>
        <p className="text-[#B2B5BE]">
          카피 트레이딩 · 보조 전략 활용 거래소
        </p>
      </header>

      <div className="bg-[#1E222D] border border-[#2A2E39] rounded-xl p-6 space-y-4">
        <p className="text-sm text-[#B2B5BE]">
          ✔ 카피 트레이딩 특화 / ✔ 전략 참고용 / ✔ 보조 포지션 운용
        </p>

        <p className="text-sm">
          Fee Benefit{' '}
          <span className="text-emerald-400 font-medium">
            최대 50% ~ 20%
          </span>
        </p>

        <a
          href={`https://share.bitget.com/u/3L0VZ5C0?clacCode=${process.env.NEXT_PUBLIC_BITGET_REF}`}
          target="_blank"
          className="inline-block mt-2 text-sm text-[#9AA0A6] hover:text-[#D1D4DC]"
        >
          공식 거래 환경 확인 →
        </a>
      </div>
    </section>
  )
}
