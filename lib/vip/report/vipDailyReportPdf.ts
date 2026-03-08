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

/* =========================================================
   Utils
========================================================= */

function firstSentence(text: string) {
  if (!text) return ''
  const t = text.trim()
  const idx = t.indexOf('. ')
  if (idx > 0) return t.slice(0, idx).trim()
  const idx2 = t.indexOf('.')
  if (idx2 > 0) return t.slice(0, idx2).trim()
  return t
}

function toParas(text: string) {
  if (!text) return []
  return text
    .replace(/\r/g, '')
    .split(/\n{2,}|\n- |\n• /g)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12)
}

function escapeHtml(s: string) {
  return (s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function parasToHtml(paras: string[]) {
  return paras.map((p) => `<p>${escapeHtml(p)}</p>`).join('\n')
}

/* =========================================================
   📰 Newspaper HTML (no fixed image, page tint, sidebar boxes)
========================================================= */

function buildVipDailyReportHtml(input: DailyReportInput): string {
  const headline = escapeHtml(firstSentence(input.newsSummary) || 'Market Update')
  const sub = escapeHtml(
    (input.newsMidLongTerm || input.newsSummary || '').trim().slice(0, 160),
  )

  // Page 1: left story expanded (summary + more body)
  const p1StoryParasRaw = [
    ...(toParas(input.newsSummary) ?? []),
    ...(toParas(input.newsMidLongTerm) ?? []),
  ].slice(0, 10)

  // Ensure "요약→본문 확장" 느낌: 첫 문단은 요약처럼, 나머지는 본문
  const p1Lead = escapeHtml(
    (p1StoryParasRaw[0] ?? input.newsSummary ?? '').slice(0, 260),
  )
  const p1BodyParas = p1StoryParasRaw.slice(1, 9)
  const p1BodyHtml = parasToHtml(p1BodyParas)

  // Page 1: small side boxes (1~2)
  const sideBox1Title = 'ON-CHAIN BRIEF'
  const sideBox1Body = escapeHtml(
    (input.externalOnchainSummary ?? '').trim().slice(0, 260) ||
      '현재 48시간 내 기관 온체인 리포트 데이터가 제한적이며, 변동성 구간에서는 단기적인 수급/포지셔닝 변화에 대한 관찰이 우선됩니다.',
  )

  const sideBox2Title = 'FUSION SNAPSHOT'
  const sideBox2Body = escapeHtml(
    (input.fusionRiskRegime ||
      input.fusionTacticalBias ||
      input.fusionStructuralOutlook ||
      input.fusionPositioningPressure ||
      '').trim().slice(0, 260) ||
      '리스크 체계가 재정렬되는 구간에서는, 방향성보다 “신호의 합의 수준(컨플루언스)”과 급변 이벤트에 대한 방어적 대응이 우선입니다.',
  )

  // Page 2/3 sections
  const newsHtml = parasToHtml(toParas(input.newsSummary))
  const structuralHtml = parasToHtml(toParas(input.newsMidLongTerm))
  const onchainHtml = input.externalOnchainSummary
    ? parasToHtml(toParas(input.externalOnchainSummary))
    : ''

  const fusionHtml = input.fusionTacticalBias
    ? `
      <div class="kv">
        <div class="k">Tactical Bias</div>
        <div class="v">${escapeHtml(input.fusionTacticalBias ?? '')}</div>
      </div>
      <div class="kv">
        <div class="k">Structural Outlook</div>
        <div class="v">${escapeHtml(input.fusionStructuralOutlook ?? '')}</div>
      </div>
      <div class="kv">
        <div class="k">Risk Regime</div>
        <div class="v">${escapeHtml(input.fusionRiskRegime ?? '')}</div>
      </div>
      <div class="kv">
        <div class="k">Positioning Pressure</div>
        <div class="v">${escapeHtml(input.fusionPositioningPressure ?? '')}</div>
      </div>
    `
    : ''

  // ✅ Key point: page surround (including margins) = newspaper tint
  // We reduce @page margin and use .sheet padding to simulate margin area with same tint.
  return `
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8"/>

<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Libre+Baskerville:wght@400;700&display=swap" rel="stylesheet">

<style>
@page { size: A4; margin: 0; }

/* ====== Whole page tint (margin included) ====== */
html, body {
  height: 100%;
}

body {
  margin: 0;
  background: #e9e3d6; /* newspaper paper */
  font-family: 'Libre Baskerville', serif;
  color: #222;
  line-height: 1.75;
  font-size: 12px;
}

/* subtle paper grain (CSS noise) */
body::before {
  content: "";
  position: fixed;
  inset: 0;
  background:
    repeating-linear-gradient(
      45deg,
      rgba(0,0,0,0.018),
      rgba(0,0,0,0.018) 1px,
      transparent 1px,
      transparent 4px
    ),
    repeating-linear-gradient(
      -45deg,
      rgba(255,255,255,0.016),
      rgba(255,255,255,0.016) 1px,
      transparent 1px,
      transparent 6px
    );
  pointer-events: none;
  z-index: 0;
}

/* sheet padding = "print margin" area, still tinted */
.sheet {
  position: relative;
  z-index: 1;
  padding: 18mm 18mm 16mm 18mm; /* emulate margin */
  box-sizing: border-box;
  min-height: 297mm;
}

/* ====== Shared ====== */
.hr-double {
  border-top: 4px solid #222;
  border-bottom: 2px solid #222;
  height: 6px;
  margin: 14px 0 18px 0;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  letter-spacing: 1px;
  margin-bottom: 10px;
}

.main-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 58px;
  font-weight: 900;
  text-align: center;
  margin: 4px 0;
}

.sub-title {
  text-align: center;
  font-size: 14px;
  letter-spacing: 2px;
  margin-bottom: 8px;
}

/* ====== Page 1 Layout ====== */
.hero-grid {
  display: grid;
  grid-template-columns: 1.25fr 0.95fr; /* more space to left story */
  gap: 22px;
  align-items: start;
}

/* Left story: 2-column article to feel "longer" */
.hero-left h2 {
  font-family: 'Montserrat', sans-serif;
  font-size: 32px;
  font-weight: 900;
  margin: 0 0 10px 0;
  line-height: 1.15;
}

.byline {
  font-weight: 800;
  font-size: 11px;
  letter-spacing: 0.4px;
  margin: 8px 0 10px;
  text-transform: uppercase;
}

.lead {
  font-size: 12px;
  margin-bottom: 10px;
}

.hero-article {
  column-count: 2;           /* ✅ 좌측 기사 2열 컬럼 확장 */
  column-gap: 18px;
  text-align: justify;
}

.hero-article p {
  margin: 0 0 10px;
}

.hero-article p:first-letter {
  float: left;
  font-size: 34px;
  font-weight: 800;
  padding-right: 6px;
  line-height: 28px;
  font-family: 'Montserrat', sans-serif;
}

/* Right sidebar boxes (1~2) */
.side {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.side-box {
  border: 1px solid rgba(34,34,34,0.65);
  background: rgba(255,255,255,0.25);
  padding: 12px 12px 10px;
}

.side-box .cap {
  display: flex;
  justify-content: space-between;
  font-size: 9.5px;
  letter-spacing: 1.1px;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.side-box .title {
  font-family: 'Montserrat', sans-serif;
  font-size: 16px;
  font-weight: 900;
  margin: 0 0 6px 0;
  line-height: 1.2;
}

.side-box .body {
  font-size: 11px;
  line-height: 1.65;
  text-align: justify;
}

/* ====== Page 2+ ====== */
.page-break { page-break-before: always; }

.section-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 20px;
  font-weight: 900;
  margin-top: 10px;
}

.section-line {
  border-top: 2px solid #222;
  margin: 8px 0 14px;
}

/* 3 columns for inside pages */
.columns {
  column-count: 3;
  column-gap: 22px;
  text-align: justify;
}

.columns p { margin: 0 0 12px; }

.columns p:first-letter {
  float: left;
  font-size: 34px;
  font-weight: 900;
  padding-right: 6px;
  line-height: 26px;
  font-family: 'Montserrat', sans-serif;
}

.subgrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.card {
  border: 1px solid rgba(34,34,34,0.55);
  background: rgba(255,255,255,0.22);
  padding: 12px;
}

.card .card-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 14px;
  font-weight: 900;
  margin: 0 0 8px;
  border-bottom: 1px solid rgba(34,34,34,0.55);
  padding-bottom: 6px;
  letter-spacing: 0.4px;
}

.kv {
  margin-bottom: 10px;
}

.kv .k {
  font-family: 'Montserrat', sans-serif;
  font-weight: 900;
  font-size: 12px;
  letter-spacing: 0.2px;
  margin-bottom: 4px;
}

.kv .v {
  font-size: 11.5px;
  line-height: 1.65;
  text-align: justify;
}

.footer {
  border-top: 1px solid #222;
  margin-top: 18px;
  padding-top: 8px;
  font-size: 10px;
  text-align: center;
}

.page-number {
  position: fixed;
  bottom: 10mm;
  right: 14mm;
  font-size: 10px;
  letter-spacing: 0.6px;
}
</style>
</head>

<body>

<!-- ================== PAGE 1 ================== -->
<div class="sheet">

  <div class="top-bar">
    <div>EDITION VIP</div>
    <div>AI DAILY REPORT</div>
    <div>${escapeHtml(input.date)}</div>
  </div>

  <div class="main-title">Daily 크립토 분석 및 전망</div>
  <div class="sub-title">Institutional Crypto Intelligence</div>

  <div class="hr-double"></div>

  <div class="hero-grid">
    <div class="hero-left">
      <h2>"${headline}"</h2>
      <div class="byline">BY AI RESEARCH DESK</div>

      <!-- ✅ 요약(리드) -->
      <div class="lead">
        ${p1Lead}${p1Lead.endsWith('.') ? '' : '.'}
      </div>

      <!-- ✅ 본문 확장 + 2열 컬럼 -->
      <div class="hero-article">
        ${p1BodyHtml || `<p>${escapeHtml((input.newsSummary ?? '').slice(0, 520))}</p>`}
      </div>
    </div>

    <!-- ✅ 1면 고정 이미지 삭제 → 사이드 기사 박스 1~2개 -->
    <div class="side">
      <div class="side-box">
        <div class="cap">
          <span>SIDEBAR</span>
          <span>${escapeHtml(input.market)} · ${escapeHtml(input.vipLevel)}</span>
        </div>
        <div class="title">${escapeHtml(sideBox1Title)}</div>
        <div class="body">${sideBox1Body}</div>
      </div>

      <div class="side-box">
        <div class="cap">
          <span>SIDEBAR</span>
          <span>${escapeHtml(input.date)}</span>
        </div>
        <div class="title">${escapeHtml(sideBox2Title)}</div>
        <div class="body">${sideBox2Body}</div>
      </div>
    </div>
  </div>

</div>

<div class="page-break"></div>

<!-- ================== PAGE 2 ================== -->
<div class="sheet">
  <div class="section-title">Market News Context (최근 뉴스 및 이슈)</div>
  <div class="section-line"></div>
  <div class="columns">
    ${newsHtml || `<p>${escapeHtml(input.newsSummary ?? '')}</p>`}
  </div>

  <div class="section-title">Structural Outlook(뉴스를 기반으로한 구조적 전망 및 분석)</div>
  <div class="section-line"></div>
  <div class="columns">
    ${structuralHtml || `<p>${escapeHtml(input.newsMidLongTerm ?? '')}</p>`}
  </div>

  ${
    input.externalOnchainSummary
      ? `
      <div class="section-title">On-Chain Intelligence (온체인데이터 분석)</div>
      <div class="section-line"></div>
      <div class="columns">
        ${onchainHtml}
      </div>
    `
      : ''
  }

  <div class="footer">
    SIGNAL AI Research Engine · Institutional Grade Intelligence · VIP Confidential
  </div>

  <div class="page-number">Page 2</div>
</div>

${
  input.fusionTacticalBias
    ? `
<div class="page-break"></div>

<!-- ================== PAGE 3 ================== -->
<div class="sheet">
  <div class="section-title">Fusion Intelligence(온체인데이터를 기반으로한 전략 및 전망)</div>
  <div class="section-line"></div>

  <div class="subgrid">
    <div class="card">
      <div class="card-title">Tactical(시장상황 및 전망) / Structural(중기적 전망)</div>
      ${fusionHtml}
    </div>

    <div class="card">
      <div class="card-title">Notes</div>
      <div class="kv">
        <div class="k">Method</div>
        <div class="v">
          뉴스 컨텍스트 · 구조적 관점 · 온체인 요약을 결합해, 신호의 합의 수준과 리스크 레짐을 우선 평가합니다.
        </div>
      </div>
      <div class="kv">
        <div class="k">Disclosure</div>
        <div class="v">
          본 문서는 정보 제공 목적이며 투자 조언이 아닙니다. 재배포 금지(VIP 전용).
        </div>
      </div>
    </div>
  </div>

  <div class="footer">
    SIGNAL AI Research Engine · Institutional Grade Intelligence · VIP Confidential
  </div>

  <div class="page-number">Page 3</div>
</div>
`
    : ''
}

</body>
</html>
`
}

/* =========================================================
   📄 PDF 생성
========================================================= */

export async function generateVipDailyReportPdf(
  input: DailyReportInput,
): Promise<Buffer> {
  const html = buildVipDailyReportHtml(input)
  return renderPdfByCloudRun(html)
}
