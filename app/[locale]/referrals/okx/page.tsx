export default function OkxReferralPage() {
  return (
    <section className="space-y-8 text-[#D1D4DC]">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold">OKX</h1>
        <p className="text-[#B2B5BE]">
          파생상품 · 고급 리스크 관리 중심 글로벌 거래소
        </p>
      </header>

      <div className="bg-[#1E222D] border border-[#2A2E39] rounded-xl p-6 space-y-4">
        <p className="text-sm text-[#B2B5BE]">
          ✔ 다양한 파생상품 / ✔ 정교한 마진 시스템 / ✔ 전문 트레이더 친화 UI
        </p>

        <p className="text-sm">
          Fee Benefit{' '}
          <span className="text-emerald-400 font-medium">
            최대 50% ~ 20%
          </span>
        </p>

        <a
          href={`https://okx.com/join/${process.env.NEXT_PUBLIC_OKX_REF}`}
          target="_blank"
          className="inline-block mt-2 text-sm text-[#9AA0A6] hover:text-[#D1D4DC]"
        >
          공식 거래 환경 확인 →
        </a>
      </div>
    </section>
  )
}
