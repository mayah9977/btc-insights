//lib/vip/report/vipDailyReportPdf.ts

import { renderPdfByCloudRun } from '@/lib/pdf/cloudRunPdfClient'

export type VipLevel = 'VIP'

export interface DailyReportInput {
  date: string
  market: string
  vipLevel: VipLevel | string

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
   Cloud Run Safe Institutional PDF HTML
   - No Google Fonts
   - No fixed overlays
   - No pseudo full-page layers
   - No column-count
   - No heavy blur shadow
   - Content-first pagination
   - Dark Bloomberg / institutional research note tone
========================================================= */

function buildVipDailyReportHtml(input: DailyReportInput): string {
  console.log('[VIP PDF TEMPLATE] THE WHALES TERMINAL FINAL')

  const vipAccessLabel = 'THE WHALES VIP ACCESS'

  const headline = escapeHtml(firstSentence(input.newsSummary) || 'Market Update')
  const sub = escapeHtml(
    (input.newsMidLongTerm || input.newsSummary || '').trim().slice(0, 160),
  )

  const p1StoryParasRaw = [
    ...(toParas(input.newsSummary) ?? []),
    ...(toParas(input.newsMidLongTerm) ?? []),
  ].slice(0, 10)

  const p1Lead = escapeHtml(
    (p1StoryParasRaw[0] ?? input.newsSummary ?? '').slice(0, 260),
  )
  const p1BodyParas = p1StoryParasRaw.slice(1, 9)
  const p1BodyHtml = parasToHtml(p1BodyParas)

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

  return `
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8"/>

<style>
@page {
  size: A4;
  margin: 0;
}

html,
body {
  margin: 0;
  padding: 0;
}

body {
  background: #050914;
  color: #dbeafe;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 11.7px;
  line-height: 1.72;
  word-break: keep-all;
  overflow-wrap: break-word;
  -webkit-font-smoothing: antialiased;
}

.sheet {
  box-sizing: border-box;
  padding: 12mm 17mm 9mm 17mm;
  background: #050914;
  color: #dbeafe;
}

.sheet-cover {
  padding-bottom: 8mm;
}

.sheet-body {
  padding-top: 8mm;
  padding-bottom: 8mm;
}

.sheet-compact {
  padding-top: 8mm;
  padding-bottom: 8mm;
}

.page-break {
  break-before: auto;
  page-break-before: auto;
  margin-top: 10px;
}

/* =========================
   Terminal shell
========================= */

.terminal-frame {
  box-sizing: border-box;
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: #08111f;
  padding: 15px;
}

.top-bar {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: #020617;
  font-size: 8.5px;
  letter-spacing: 0.9px;
  color: rgba(226, 232, 240, 0.76);
  text-transform: uppercase;
}

.top-bar .center {
  color: #fbbf24;
  font-weight: 700;
}

.top-bar .right {
  text-align: right;
  color: #67e8f9;
}

.brand-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 12px 0 13px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.18);
}

.brand-mark {
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.22em;
  color: #f8fafc;
}

.brand-meta {
  font-size: 8.6px;
  color: rgba(148, 163, 184, 0.82);
  text-align: right;
  line-height: 1.5;
  text-transform: uppercase;
}

.main-title {
  font-size: 31px;
  font-weight: 900;
  line-height: 1.12;
  letter-spacing: -0.04em;
  margin: 9px 0 8px;
  color: #f8fafc;
}

.main-title .accent {
  color: #fbbf24;
}

.sub-title {
  max-width: 88%;
  font-size: 12px;
  line-height: 1.55;
  color: rgba(203, 213, 225, 0.76);
  margin-bottom: 14px;
}

.market-ticker {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin: 12px 0 14px;
}

.ticker-cell {
  border: 1px solid rgba(148, 163, 184, 0.20);
  background: #0f172a;
  padding: 8px 10px;
}

.ticker-label {
  font-size: 8px;
  letter-spacing: 0.11em;
  color: rgba(148, 163, 184, 0.78);
  text-transform: uppercase;
}

.ticker-value {
  margin-top: 4px;
  font-size: 13px;
  font-weight: 800;
  color: #f8fafc;
}

.ticker-value.gold {
  color: #fbbf24;
}

.ticker-value.cyan {
  color: #67e8f9;
}

.ticker-value.emerald {
  color: #6ee7b7;
}

.hr-double {
  height: 1px;
  margin: 12px 0 14px 0;
  border: 0;
  background: #fbbf24;
}

/* =========================
   Page 1
========================= */

.hero-grid {
  display: grid;
  grid-template-columns: 1.46fr 0.64fr;
  gap: 14px;
  align-items: start;
}

.hero-left {
  border: 1px solid rgba(148, 163, 184, 0.20);
  background: #0b1220;
  padding: 16px 18px 15px;
}

.hero-left h2 {
  font-size: 23px;
  font-weight: 900;
  margin: 0 0 9px 0;
  line-height: 1.25;
  letter-spacing: -0.03em;
  color: #f8fafc;
  word-break: keep-all;
}

.byline {
  display: block;
  font-weight: 700;
  font-size: 8.6px;
  letter-spacing: 0.11em;
  margin: 2px 0 11px;
  color: #fbbf24;
  text-transform: uppercase;
}

.lead {
  border-left: 3px solid #fbbf24;
  padding-left: 10px;
  font-size: 12.2px;
  font-weight: 600;
  line-height: 1.68;
  margin-bottom: 12px;
  color: rgba(241, 245, 249, 0.92);
  text-align: left;
  word-break: keep-all;
  overflow-wrap: break-word;
}

.hero-article {
  display: block;
  text-align: left;
  word-break: keep-all;
  overflow-wrap: break-word;
}

.hero-article p {
  margin: 0 0 10px;
  color: rgba(203, 213, 225, 0.82);
  line-height: 1.7;
}

.side {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.side-box {
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: #0f172a;
  padding: 9px 10px 8px;
  border-left: 2px solid #fbbf24;
}

.side-box.cyan {
  border-left-color: #06b6d4;
}

.side-box .cap {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 7.4px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 6px;
  color: rgba(148, 163, 184, 0.72);
}

.side-box .title {
  font-size: 12.5px;
  font-weight: 900;
  margin: 0 0 5px 0;
  line-height: 1.24;
  color: #f8fafc;
}

.side-box .body {
  font-size: 9.8px;
  line-height: 1.58;
  text-align: left;
  color: rgba(203, 213, 225, 0.72);
  word-break: keep-all;
  overflow-wrap: break-word;
}

.terminal-note {
  margin-top: 0;
  padding: 8px 10px;
  border: 1px solid rgba(251, 191, 36, 0.22);
  background: #17150c;
  font-size: 7.6px;
  line-height: 1.5;
  color: rgba(253, 230, 138, 0.78);
  text-transform: uppercase;
}

/* =========================
   Section pages
========================= */

.section-shell {
  border: 1px solid rgba(148, 163, 184, 0.20);
  background: #08111f;
  padding: 13px 15px;
  margin-bottom: 10px;
  break-inside: avoid;
  page-break-inside: avoid;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 7px;
}

.section-title {
  font-size: 16.5px;
  font-weight: 900;
  margin: 0;
  line-height: 1.3;
  letter-spacing: -0.02em;
  color: #f8fafc;
  word-break: keep-all;
}

.section-code {
  font-size: 8px;
  letter-spacing: 0.11em;
  color: #fbbf24;
  text-transform: uppercase;
  white-space: nowrap;
}

.section-line {
  height: 1px;
  border: 0;
  margin: 7px 0 10px;
  background: #334155;
}

.columns {
  display: block;
  max-width: 100%;
  text-align: left;
  word-break: keep-all;
  overflow-wrap: break-word;
}

.columns p {
  margin: 0 0 10px;
  color: rgba(203, 213, 225, 0.82);
  line-height: 1.7;
}

.research-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  align-items: start;
}

.research-layout .section-shell {
  margin-bottom: 0;
}

.subgrid {
  display: grid;
  grid-template-columns: 1.08fr 0.92fr;
  gap: 12px;
  align-items: start;
  margin-bottom: 8px;
}

.card {
  border: 1px solid rgba(148, 163, 184, 0.20);
  background: #0f172a;
  padding: 12px;
}

.card .card-title {
  font-size: 12.5px;
  font-weight: 900;
  margin: 0 0 8px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.20);
  padding-bottom: 7px;
  letter-spacing: -0.02em;
  line-height: 1.35;
  color: #f8fafc;
  word-break: keep-all;
}

.kv {
  margin-bottom: 8px;
  padding-bottom: 7px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
}

.kv:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.kv .k {
  font-weight: 800;
  font-size: 8.5px;
  letter-spacing: 0.11em;
  margin-bottom: 4px;
  text-transform: uppercase;
  color: #fbbf24;
}

.kv .v {
  font-size: 11px;
  line-height: 1.66;
  text-align: left;
  color: rgba(203, 213, 225, 0.82);
  word-break: keep-all;
  overflow-wrap: break-word;
}

.footer {
  border-top: 1px solid rgba(148, 163, 184, 0.20);
  margin-top: 8px;
  padding-top: 7px;
  font-size: 8.4px;
  line-height: 1.45;
  letter-spacing: 0.08em;
  text-align: center;
  color: rgba(148, 163, 184, 0.80);
  text-transform: uppercase;
}

.footer strong {
  color: #f8fafc;
  letter-spacing: 0.14em;
}

.page-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 7px;
  margin-bottom: 6px;
  font-size: 8.4px;
  letter-spacing: 0.09em;
  color: rgba(148, 163, 184, 0.72);
  text-transform: uppercase;
}

.page-meta .left {
  color: rgba(251, 191, 36, 0.76);
}
</style>
</head>

<body>

<!-- ================== PAGE 1 ================== -->
<div class="sheet sheet-cover">
  <div class="terminal-frame">

    <div class="top-bar">
      <div>EDITION VIP</div>
      <div class="center">THE WHALES TERMINAL</div>
      <div class="right">${escapeHtml(input.date)}</div>
    </div>

    <div class="brand-strip">
      <div class="brand-mark">THE WHALES</div>
      <div class="brand-meta">
        Institutional Crypto Intelligence<br/>
        AI Market Research Report
      </div>
    </div>

    <div class="main-title">
      VIP 전용 <span class="accent">크립토 분석</span>과 전망
    </div>

    <div class="sub-title">
      ${sub || 'Institutional-grade daily intelligence generated from market news, on-chain context and fusion risk analysis.'}
    </div>

    <div class="market-ticker">
      <div class="ticker-cell">
        <div class="ticker-label">Market</div>
        <div class="ticker-value gold">${escapeHtml(input.market)}</div>
      </div>
      <div class="ticker-cell">
        <div class="ticker-label">Access</div>
        <div class="ticker-value">${escapeHtml(vipAccessLabel)}</div>
      </div>
      <div class="ticker-cell">
        <div class="ticker-label">Model</div>
        <div class="ticker-value cyan">Fusion</div>
      </div>
      <div class="ticker-cell">
        <div class="ticker-label">Regime</div>
        <div class="ticker-value emerald">Live Intel</div>
      </div>
    </div>

    <div class="hr-double"></div>

    <div class="hero-grid">
      <div class="hero-left">
        <h2>"${headline}"</h2>

        <div class="byline">
          BY THE WHALES RESEARCH DESK
        </div>

        <div class="lead">
          ${p1Lead}${p1Lead.endsWith('.') ? '' : '.'}
        </div>

        <div class="hero-article">
          ${p1BodyHtml || `<p>${escapeHtml((input.newsSummary ?? '').slice(0, 520))}</p>`}
        </div>
      </div>

      <div class="side">
        <div class="side-box">
          <div class="cap">
            <span>INTEL</span>
            <span>${escapeHtml(input.market)}</span>
          </div>

          <div class="title">${escapeHtml(sideBox1Title)}</div>
          <div class="body">${sideBox1Body}</div>
        </div>

        <div class="side-box cyan">
          <div class="cap">
            <span>FUSION</span>
            <span>${escapeHtml(input.date)}</span>
          </div>

          <div class="title">${escapeHtml(sideBox2Title)}</div>
          <div class="body">${sideBox2Body}</div>
        </div>

        <div class="terminal-note">
          THIS REPORT IS GENERATED FOR VIP MARKET RESEARCH USE ONLY. SIGNALS ARE INTERPRETIVE LAYERS, NOT INVESTMENT ADVICE.
        </div>
      </div>
    </div>

  </div>

  <div class="page-meta">
    <div class="left">Institutional Cover</div>
    <div>Page 1</div>
  </div>
</div>

<div class="page-break"></div>

<!-- ================== PAGE 2 ================== -->
<div class="sheet sheet-body">

  <div class="top-bar">
    <div>THE WHALES</div>
    <div class="center">MARKET CONTEXT</div>
    <div class="right">${escapeHtml(input.date)}</div>
  </div>

  <div class="section-shell">
    <div class="section-header">
      <div class="section-title">Market News Context (최근 뉴스 및 이슈)</div>
      <div class="section-code">NEWS / MACRO</div>
    </div>

    <div class="section-line"></div>

    <div class="columns">
      ${newsHtml || `<p>${escapeHtml(input.newsSummary ?? '')}</p>`}
    </div>
  </div>

  <div class="section-shell">
    <div class="section-header">
      <div class="section-title">Structural Outlook(뉴스를 기반으로 한 구조적 전망 및 분석)</div>
      <div class="section-code">STRUCTURE</div>
    </div>

    <div class="section-line"></div>

    <div class="columns">
      ${structuralHtml || `<p>${escapeHtml(input.newsMidLongTerm ?? '')}</p>`}
    </div>
  </div>

  ${
    input.externalOnchainSummary
      ? `
      <div class="section-shell">
        <div class="section-header">
          <div class="section-title">On-Chain Intelligence (온체인 데이터 분석)</div>
          <div class="section-code">ON-CHAIN</div>
        </div>

        <div class="section-line"></div>

        <div class="columns">
          ${onchainHtml}
        </div>
      </div>
    `
      : ''
  }

  <div class="footer">
    <strong>THE WHALES</strong> · Institutional Crypto Intelligence · VIP Market Research Report
  </div>

  <div class="page-meta">
    <div class="left">Research Context</div>
    <div>Page 2</div>
  </div>
</div>

${
  input.fusionTacticalBias
    ? `
<div class="page-break"></div>

<!-- ================== PAGE 3 ================== -->
<div class="sheet sheet-compact">

  <div class="top-bar">
    <div>THE WHALES</div>
    <div class="center">FUSION INTELLIGENCE</div>
    <div class="right">${escapeHtml(input.date)}</div>
  </div>

  <div class="section-shell">
    <div class="section-header">
      <div class="section-title">Fusion Intelligence(온체인 데이터를 기반으로 한 전략 및 전망)</div>
      <div class="section-code">AI FUSION</div>
    </div>

    <div class="section-line"></div>

    <div class="subgrid">
      <div class="card">
        <div class="card-title">Tactical(시장 상황 및 전망) / Structural(중기적 전망)</div>
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
  </div>

  <div class="footer">
    <strong>THE WHALES</strong> · Institutional Crypto Intelligence · VIP Market Research Report
  </div>

  <div class="page-meta">
    <div class="left">Fusion Model</div>
    <div>Page 3</div>
  </div>
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
