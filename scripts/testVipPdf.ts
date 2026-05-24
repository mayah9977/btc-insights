// scripts/testVipPdf.ts

import fs from 'fs/promises'
import path from 'path'

import { generateVipDailyReportPdf } from '../lib/vip/report/vipDailyReportPdf'

async function main() {
  console.log('[TEST] Generating VIP PDF preview...')

  const pdf = await generateVipDailyReportPdf({
    date: new Date().toISOString().slice(0, 10),

    market: 'BTC',

    vipLevel: 'VIP3',

    newsSummary: `
비트코인은 최근 ETF 자금 유입 증가와 함께
기관 중심의 구조적 매수 흐름이 지속되고 있습니다.

미국 CPI 둔화와 금리 인하 기대감이
리스크 자산 선호 심리를 강화시키고 있으며,
BTC는 주요 저항 구간 돌파를 시도하는 상황입니다.

단기적으로는 변동성이 확대될 수 있으나,
중장기 구조에서는 기관 수급 우위 흐름이 유지되는 상태입니다.
`,

    newsMidLongTerm: `
현재 시장은 단순 단기 반등보다는
거시 유동성 환경 변화에 따른
구조적 자금 재배치 가능성이 중요해지고 있습니다.

ETF 자금 유입은 단순 투기 수요가 아니라
장기 보유 성격의 기관 자금 흐름으로 해석되며,
이는 향후 공급 부족 구조를 더욱 강화시킬 가능성이 있습니다.

특히 고래 지갑의 거래소 유출 흐름은
매도 압력 감소와 중장기 보유 심리 강화를 시사합니다.
`,

    externalOnchainSource: 'CryptoQuant',

    externalOnchainSummary: `
거래소 BTC 보유량 감소가 지속되고 있으며,
고래 주소 순유입은 제한적인 수준입니다.

Funding Rate는 과열되지 않은 중립 수준을 유지하고 있으며,
Open Interest 증가 속도 역시 안정적입니다.

현재 구조는 과도한 레버리지 기반 상승보다는
현물 중심의 점진적 구조 강화로 해석됩니다.
`,

    fusionTacticalBias: `
단기 전술 관점에서는 변동성 확대 가능성이 존재하지만,
기관 매수 기반 구조적 우위 흐름이 유지되고 있습니다.
`,

    fusionStructuralOutlook: `
중기 구조에서는 ETF 자금 유입과
거래소 공급 감소 흐름이 지속되며,
BTC scarcity narrative가 강화되는 구간으로 판단됩니다.
`,

    fusionRiskRegime: `
현재 리스크 레짐은 중립~강세 전환 초기 단계로 평가됩니다.

다만 CPI 및 FOMC 이벤트 전후 단기 변동성 확대 가능성은
지속적으로 모니터링이 필요합니다.
`,

    fusionPositioningPressure: `
고래 포지셔닝은 공격적 추격 매수보다는
구조적 축적(accumulation) 형태에 가까운 흐름입니다.
`,
  })

  const outputPath = path.join(
    process.cwd(),
    'vip-preview.pdf',
  )

  await fs.writeFile(outputPath, pdf)

  console.log('[TEST] PDF saved:')
  console.log(outputPath)
}

main().catch(err => {
  console.error('[TEST ERROR]', err)
  process.exit(1)
})
