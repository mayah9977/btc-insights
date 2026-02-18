import { renderPdfByCloudRun } from '@/lib/pdf/cloudRunPdfClient'

export type VipLevel = 'VIP1' | 'VIP2' | 'VIP3'

/* =========================================================
   FINAL SSOT TYPE
========================================================= */

export interface DailyReportInput {
  date: string
  market: string
  vipLevel: VipLevel

  /* 1️⃣ BTC Snapshot */
  btcPrice: number
  openInterest: number
  fundingRate: number
  candleChartBase64: string

  /* 2️⃣ Whale */
  whaleIntensity: number
  whaleInterpretation: string

  /* 3️⃣ Sentiment */
  sentimentIndex: number
  sentimentRegime: 'FEAR' | 'NEUTRAL' | 'GREED'
  sentimentInterpretation: string

  /* 4️⃣ News */
  newsSummary: string
  newsMidLongTerm: string
}

/* =========================================================
   PREMIUM TEMPLATE (2 PAGE FIXED)
========================================================= */

function buildVipDailyReportHtml(input: DailyReportInput): string {
  const sentimentColor =
    input.sentimentRegime === 'FEAR'
      ? '#ff4d4f'
      : input.sentimentRegime === 'NEUTRAL'
      ? '#facc15'
      : '#22c55e'

  return `
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8"/>

<!-- 🔥 Google Font 명시 -->
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;600;700&display=swap" rel="stylesheet"/>

<style>
@page {
  size: A4;
  margin: 40px;
}

body {
  font-family: 'Noto Sans KR', sans-serif;
  background: #05070d;
  color: #ffffff;
  font-size: 13px;
  line-height: 1.7;
}

.page {
  width: 100%;
  page-break-after: always;
}

.page:last-child {
  page-break-after: auto;
}

.header {
  padding-bottom: 20px;
  margin-bottom: 30px;
  border-bottom: 2px solid #1f2937;
}

.title {
  font-size: 26px;
  font-weight: 700;
  background: linear-gradient(90deg,#facc15,#ff9900);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.section {
  margin-bottom: 24px;
  padding: 20px;
  border-radius: 16px;
  background: linear-gradient(145deg,#0b0f17,#111827);
  border: 1px solid #1f2937;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 12px;
  color: #facc15;
}

.metric {
  margin-bottom: 8px;
}

.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
}

.chart {
  margin-top: 15px;
  text-align: center;
}

.footer {
  margin-top: 40px;
  font-size: 11px;
  color: #6b7280;
  text-align: center;
  border-top: 1px solid #1f2937;
  padding-top: 14px;
}
</style>
</head>

<body>

<!-- ================= PAGE 1 ================= -->
<div class="page">

<div class="header">
  <div class="title">SIGNAL · VIP INTELLIGENCE REPORT</div>
  <div>${input.date} · ${input.market}</div>
</div>

<div class="section">
  <div class="section-title">1️⃣ 비트코인 시장 스냅샷 (15분 기준)</div>

  <div class="metric">
    현재 가격: <strong>$${input.btcPrice.toLocaleString()}</strong>
  </div>

  <div class="metric">
    Open Interest: <strong>${input.openInterest.toLocaleString()}</strong>
  </div>

  <div class="metric">
    Funding Rate: <strong>${input.fundingRate.toFixed(5)}</strong>
  </div>

  <div class="chart">
    <img src="${input.candleChartBase64}" width="520"/>
  </div>
</div>

<div class="section">
  <div class="section-title">2️⃣ 고래 강도 분석</div>

  <div class="metric">
    강도 지수: <strong>${input.whaleIntensity.toFixed(2)}</strong>
  </div>

  <div class="metric">
    ${input.whaleInterpretation}
  </div>
</div>

</div>

<!-- ================= PAGE 2 ================= -->
<div class="page">

<div class="section">
  <div class="section-title">3️⃣ 시장 심리지수</div>

  <div class="metric">
    현재 지수: <strong>${input.sentimentIndex}</strong>
  </div>

  <div class="metric">
    상태:
    <span class="badge" style="background:${sentimentColor};color:#000">
      ${input.sentimentRegime}
    </span>
  </div>

  <div class="metric">
    ${input.sentimentInterpretation}
  </div>
</div>

<div class="section">
  <div class="section-title">4️⃣ 오늘의 주요 뉴스와 전망</div>

  <div class="metric">
    ${input.newsSummary}
  </div>

  <div class="metric" style="margin-top:12px;">
    ${input.newsMidLongTerm}
  </div>
</div>

<div class="footer">
  SIGNAL AI Risk Observation Engine<br/>
  VIP 전용 리포트 · 무단 배포 금지
</div>

</div>

</body>
</html>
`
}

/* =========================================================
   PDF Render
========================================================= */

export async function generateVipDailyReportPdf(
  input: DailyReportInput,
): Promise<Buffer> {
  const html = buildVipDailyReportHtml(input)
  return renderPdfByCloudRun(html)
}
