// app/api/dev/test-vip-pdf/route.ts

import {
  generateVipDailyReportPdf,
  type DailyReportInput,
} from '@/lib/vip/report/vipDailyReportPdf'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function getKstDateString(): string {
  const now = new Date()
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  const kst = new Date(utc + 9 * 60 * 60000)

  return kst.toISOString().slice(0, 10)
}

export async function GET() {
  const date = getKstDateString()

  const sampleInput: DailyReportInput = {
    date,
    market: 'BTC',
    vipLevel: 'VIP',

    newsSummary:
      [
        '미국의 암호화폐 명확성 법안 논의가 다시 부각되면서 비트코인 시장은 단기 변동성과 중기 제도화 기대가 동시에 반영되는 구간에 진입했다.',
        '미국의 암호화폐 명확성 법안 논의가 다시 부각되면서 투자자들은 규제 리스크와 제도권 자금 유입 가능성을 함께 점검하고 있다.',
        '특히 비트코인 가격은 정책 발언, 현물 ETF 수급, 파생상품 포지셔닝 변화가 겹치며 단기적으로 방향성이 쉽게 흔들릴 수 있는 환경에 놓여 있다.',
        '다만 시장 참여자들은 단일 뉴스보다 법안 통과 가능성, 기관 투자자의 포지션 변화, 온체인 장기 보유자 움직임을 함께 확인해야 한다.',
        '이 문장은 일부러 길게 작성되어 PDF 생성 과정에서 문장이 중간에 잘리지 않고 완전한 문장 단위로 표시되는지 확인하기 위한 테스트 문장이다.',
      ].join('\n\n'),

    newsMidLongTerm:
      [
        '미국의 암호화폐 명확성 법안 논의가 다시 부각되면서 비트코인 시장은 단기 변동성과 중기 제도화 기대가 동시에 반영되는 구간에 진입했다.',
        '중기적으로는 규제 불확실성이 완화될 경우 기관 투자자의 시장 접근성이 높아질 수 있으나, 법안 논의가 지연되면 위험자산 전반의 심리 위축이 다시 나타날 수 있다.',
        '현재 구조에서는 가격의 단기 상승 여부보다 거래량, 미결제약정, 펀딩비, 고래 지갑 이동이 같은 방향으로 정렬되는지가 더 중요하다.',
        '따라서 VIP 투자자는 헤드라인에 즉각 반응하기보다 뉴스 컨텍스트와 온체인 흐름이 실제 수급 변화로 연결되는지 확인하는 접근이 필요하다.',
        '이 구조적 전망 문장 역시 충분히 길게 작성되어 있으며 문장 중간 절단 없이 PDF의 Executive Summary와 본문 페이지에서 어떻게 분리되어 출력되는지 검증하기 위한 목적을 가진다.',
      ].join('\n\n'),

    externalOnchainSource:
      'Institutional On-Chain Research Sample',

    externalOnchainSummary:
      [
        '최근 온체인 데이터에서는 장기 보유자 지갑의 이동은 제한적인 반면, 거래소 주변 단기 유동성 변화가 조금씩 확대되는 모습이 관찰되고 있다.',
        '고래 지갑의 순유입과 순유출은 아직 한쪽 방향으로 강하게 고정되지 않았지만, 특정 시간대에 대형 거래가 집중되는 현상은 단기 변동성 확대 가능성을 시사한다.',
        '현물 시장의 누적 매수세가 파생상품 포지션 확대와 함께 나타나는지 여부가 다음 구간의 핵심 확인 포인트다.',
      ].join('\n\n'),

    fusionTacticalBias:
      '단기적으로는 변동성 확대 가능성이 남아 있으므로, 공격적인 추격 진입보다 주요 지지·저항 구간에서의 반응을 확인하는 전략이 유리하다.',

    fusionStructuralOutlook:
      '구조적으로는 규제 명확성, 기관 수급, 온체인 장기 보유자 움직임이 동시에 개선될 때 비트코인의 중기 상승 신뢰도가 높아질 수 있다.',

    fusionRiskRegime:
      '현재 리스크 레짐은 완전한 위험 선호보다는 선택적 관망에 가깝고, 단기 뉴스 충격에 따라 빠르게 변동성이 확대될 수 있는 상태다.',

    fusionPositioningPressure:
      '포지셔닝 압력은 중립에서 소폭 상승 방향으로 기울고 있으나, 펀딩비와 미결제약정이 과열될 경우 단기 청산 리스크가 커질 수 있다.',
  }

  const pdf =
    await generateVipDailyReportPdf(
      sampleInput,
    )

  const pdfBody =
    new Uint8Array(pdf)

  return new Response(pdfBody, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition':
        `inline; filename="VIP_Test_Report_${date}.pdf"`,
      'Cache-Control':
        'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  })
}
