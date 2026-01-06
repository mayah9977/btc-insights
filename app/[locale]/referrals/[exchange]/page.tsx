import { notFound } from 'next/navigation'
import Link from 'next/link'

const EXCHANGE_DETAIL = {
  binance: {
    name: 'Binance',
    tagline: '글로벌 유동성 1위 · 장기 안정성',
    reason: [
      '전 세계 최대 거래량으로 슬리피지 최소화',
      'VIP 구간에서 수수료 체감 효과 가장 큼',
      '시장 급변 시에도 체결 안정성 우수',
    ],
    bestFor: '중·장기 포지션 / 대규모 자금',
    href: `https://www.binance.com/en/register?ref=${process.env.NEXT_PUBLIC_BINANCE_REF}`,
    accent: 'from-yellow-400 to-yellow-600',
  },
  okx: {
    name: 'OKX',
    tagline: '고급 파생상품 · 전략적 트레이딩',
    reason: [
      '옵션/선물 UI 완성도 높음',
      '고급 주문 유형과 리스크 관리 기능',
      '변동성 장세에서 전략 구현에 유리',
    ],
    bestFor: '전략 기반 파생상품 트레이더',
    href: `https://www.okx.com/join/${process.env.NEXT_PUBLIC_OKX_REF}`,
    accent: 'from-sky-400 to-sky-600',
  },
  bybit: {
    name: 'Bybit',
    tagline: '단기 트레이딩 특화',
    reason: [
      '체결 반응 속도 빠름',
      '스캘핑/데이 트레이딩에 최적화',
      'UI 직관적 · 학습 곡선 낮음',
    ],
    bestFor: '단타 · 고빈도 트레이딩',
    href: `https://www.bybit.com/register?ref=${process.env.NEXT_PUBLIC_BYBIT_REF}`,
    accent: 'from-orange-400 to-orange-600',
  },
  bitget: {
    name: 'Bitget',
    tagline: '카피 트레이딩 & 리스크 분산',
    reason: [
      '검증된 트레이더 카피 가능',
      '초보자 리스크 관리에 유리',
      '자동 분산 전략에 적합',
    ],
    bestFor: '초·중급 / 분산 전략',
    href: `https://www.bitget.com/referral?code=${process.env.NEXT_PUBLIC_BITGET_REF}`,
    accent: 'from-emerald-400 to-emerald-600',
  },
}

export default function ExchangeDetailPage({
  params,
}: {
  params: { exchange: string }
}) {
  const exchange =
    EXCHANGE_DETAIL[params.exchange as keyof typeof EXCHANGE_DETAIL]

  if (!exchange) notFound()

  return (
    <main className="min-h-screen bg-vipBg text-slate-100">
      <div className="max-w-4xl mx-auto px-6 py-20 space-y-12">
        <header>
          <h1 className="text-4xl font-extrabold">{exchange.name}</h1>
          <p className="text-slate-400 mt-2">{exchange.tagline}</p>
        </header>

        <section className="bg-vipCard border border-vipBorder rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4">추천 이유</h2>
          <ul className="list-disc list-inside text-slate-300 space-y-2">
            {exchange.reason.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </section>

        <section className="bg-vipCard border border-vipBorder rounded-2xl p-6">
          <p className="text-slate-400">가장 적합한 사용자</p>
          <p className="text-lg font-semibold">{exchange.bestFor}</p>
        </section>

        <Link
          href={exchange.href}
          target="_blank"
          className={`inline-block px-8 py-4 rounded-full bg-gradient-to-r ${exchange.accent} text-black font-bold`}
        >
          수수료 할인 받고 가입 →
        </Link>
      </div>
    </main>
  )
}
