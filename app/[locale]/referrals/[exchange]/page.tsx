// app/[locale]/referrals/[exchange]/page.tsx
import { notFound } from 'next/navigation'
import ExchangeClient from './ExchangeClient'

const EXCHANGE_DETAIL = {
  binance: {
    name: 'Binance',
    tagline: '글로벌 유동성 1위 · 장기 안정성',
    marketing:
      '✔ 전 세계 최대 유동성 / ✔ 안정적인 체결 환경 / ✔ 장기 운용 최적화',
    benefit: '최대 45% 수수료 할인',
    href: `https://www.binance.com/en/register?ref=${process.env.NEXT_PUBLIC_BINANCE_REF}`,
  },
  okx: {
    name: 'OKX',
    tagline: '파생상품 · 고급 리스크 관리 중심 글로벌 거래소',
    marketing:
      '✔ 다양한 파생상품 / ✔ 정교한 마진 시스템 / ✔ 전문 트레이더 친화 UI',
    benefit: '최대 50% ~ 20%',
    href: `https://www.okx.com/join/${process.env.NEXT_PUBLIC_OKX_REF}`,
  },
  bybit: {
    name: 'Bybit',
    tagline: '단기 트레이딩 특화',
    marketing:
      '✔ 빠른 체결 속도 / ✔ 단타 최적화 환경 / ✔ 직관적인 인터페이스',
    benefit: '최대 30% 수수료 할인',
    href: `https://www.bybit.com/register?ref=${process.env.NEXT_PUBLIC_BYBIT_REF}`,
  },
  bitget: {
    name: 'Bitget',
    tagline: '카피 트레이딩 & 리스크 분산',
    marketing:
      '✔ 카피 트레이딩 지원 / ✔ 자동 분산 전략 / ✔ 초보자 친화 구조',
    benefit: '최대 50% 수수료 할인',
    href: `https://www.bitget.com/referral?code=${process.env.NEXT_PUBLIC_BITGET_REF}`,
  },
}

export default async function ExchangeDetailPage({
  params,
}: {
  params: Promise<{ exchange: string }>
}) {
  const { exchange: exchangeKey } = await params

  const exchange =
    EXCHANGE_DETAIL[exchangeKey as keyof typeof EXCHANGE_DETAIL]

  if (!exchange) notFound()

  return <ExchangeClient exchange={exchange} />
}
