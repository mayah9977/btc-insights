'use client'

import React from 'react'

/* ======================================================
   Premium Keyword Highlight
   - 금융 대시보드 스타일
   - Gold / Red / Green 구분
   - Glow + Pulse
====================================================== */

const KEYWORDS = [
  '과열',
  '공포',
  '매집',
  '청산',
  '하락',
  '상승',
  '변동성',
  'Funding',
  'OI',
  'Short',
  'Long',
]

/* 위험 키워드 */

const DANGER = [
  '과열',
  '공포',
  '청산',
  '하락',
]

/* 기회 키워드 */

const OPPORTUNITY = [
  '매집',
  '상승',
]

export function highlightKeywords(text: string) {

  return text.split(/(\s+)/).map((word, i) => {

    const clean = word.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')

    const matched = KEYWORDS.find(k => clean.includes(k))

    if (!matched)
      return <React.Fragment key={i}>{word}</React.Fragment>

    /* =========================
       색상 결정
    ========================= */

    let color =
      'text-yellow-300'

    let glow =
      'drop-shadow-[0_0_6px_rgba(250,204,21,0.6)]'

    if (DANGER.some(k => clean.includes(k))) {
      color = 'text-red-400'
      glow =
        'drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]'
    }

    if (OPPORTUNITY.some(k => clean.includes(k))) {
      color = 'text-emerald-400'
      glow =
        'drop-shadow-[0_0_8px_rgba(16,185,129,0.7)]'
    }

    return (
      <span
        key={i}
        className={`
          relative
          font-semibold
          tracking-wide
          ${color}
          ${glow}
        `}
      >
        {word}
      </span>
    )
  })
}
