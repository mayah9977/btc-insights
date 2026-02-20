import { renderPdfByCloudRun } from '@/lib/pdf/cloudRunPdfClient'

export type VipLevel = 'VIP1' | 'VIP2' | 'VIP3'

export interface DailyReportInput {
  date: string
  market: string
  vipLevel: VipLevel

  newsSummary: string
  newsMidLongTerm: string

  externalOnchainSource?: string
  externalOnchainSummary?: string

  fusionTacticalBias?: string
  fusionStructuralOutlook?: string
  fusionRiskRegime?: string
  fusionPositioningPressure?: string
}

function buildVipDailyReportHtml(input: DailyReportInput): string {
  const vipColor =
    input.vipLevel === 'VIP3'
      ? 'linear-gradient(90deg,#e5e7eb,#9ca3af)'
      : input.vipLevel === 'VIP2'
      ? 'linear-gradient(90deg,#facc15,#f97316)'
      : 'linear-gradient(90deg,#94a3b8,#64748b)'

  return `
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8"/>

<style>
@page { size:A4; margin:40px; }

body{
  font-family: Arial, Helvetica, sans-serif;
  background:#05070d;
  color:#e5e7eb;
  font-size:13px;
  line-height:1.8;
}

.page-break{
  page-break-before: always;
}

.header{
  border-bottom:2px solid #1f2937;
  padding-bottom:20px;
  margin-bottom:30px;
}

.title{
  font-size:26px;
  font-weight:700;
  letter-spacing:1px;
  background:linear-gradient(90deg,#facc15,#f97316);
  -webkit-background-clip:text;
  -webkit-text-fill-color:transparent;
}

.vip-badge{
  display:inline-block;
  padding:6px 14px;
  font-size:11px;
  font-weight:700;
  border-radius:20px;
  margin-top:8px;
  background:${vipColor};
  color:#000;
}

.section{
  margin-bottom:28px;
  padding:22px;
  border-radius:14px;
  background:#0b0f17;
  border:1px solid #1f2937;
}

.section-title{
  font-size:15px;
  font-weight:700;
  margin-bottom:14px;
  color:#facc15;
}

.metric{
  margin-bottom:10px;
  white-space:pre-line;
}

.footer{
  margin-top:40px;
  font-size:11px;
  color:#6b7280;
  text-align:center;
  border-top:1px solid #1f2937;
  padding-top:14px;
}
</style>
</head>

<body>

<!-- ================= PAGE 1 ================= -->

<div class="header">
  <div class="title"> VIP전용 크립토 분석 및 전망 </div>
  <div>${input.date} · ${input.market}</div>
  <div class="vip-badge">${input.vipLevel} LEVEL ACCESS</div>
</div>

<div class="section">
  <div class="section-title">MARKET NEWS CONTEXT (최근 뉴스 및 이슈)</div>
  <div class="metric">${input.newsSummary}</div>
</div>

<div class="section">
  <div class="section-title">STRUCTURAL OUTLOOK (뉴스를 기반으로한 구조적 전망 및 분석)</div>
  <div class="metric">${input.newsMidLongTerm}</div>
</div>

${
  input.externalOnchainSummary
    ? `
<div class="section">
  <div class="section-title">ON-CHAIN INTELLIGENCE (온체인데이터 분석)</div>
  ${
    input.externalOnchainSource
      ? `<div class="metric"><strong>Source:</strong> ${input.externalOnchainSource}</div>`
      : ''
  }
  <div class="metric">${input.externalOnchainSummary}</div>
</div>
`
    : ''
}

<!-- ================= PAGE 2 (Fusion 고정) ================= -->

${
  input.fusionTacticalBias
    ? `
<div class="page-break"></div>

<div class="section">
  <div class="section-title">
    FUSION INTELLIGENCE (온체인데이터를 기반으로한 전략 및 전망)
  </div>

  <div class="metric">
    <strong>Tactical Bias (시장상황 및 전망):</strong>
    ${input.fusionTacticalBias}
  </div>

  <div class="metric">
    <strong>Structural Outlook (중기적 전망):</strong>
    ${input.fusionStructuralOutlook}
  </div>

  <div class="metric">
    <strong>Risk Regime (리스크관리):</strong>
    ${input.fusionRiskRegime}
  </div>

  <div class="metric">
    <strong>Positioning Pressure (시장에 대한 평가):</strong>
    ${input.fusionPositioningPressure}
  </div>
</div>
`
    : ''
}

<div class="footer">
  SIGNAL AI Research Engine<br/>
  Institutional Grade Intelligence · Redistribution Prohibited
</div>

</body>
</html>
`
}

export async function generateVipDailyReportPdf(
  input: DailyReportInput,
): Promise<Buffer> {
  const html = buildVipDailyReportHtml(input)
  return renderPdfByCloudRun(html)
}