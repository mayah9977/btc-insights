'use client'

import React from 'react'

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

export function highlightKeywords(text: string) {
  return text.split(/(\s+)/).map((word, i) => {
    const clean = word.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')

    if (KEYWORDS.some(k => clean.includes(k))) {
      return (
        <span
          key={i}
          className="text-yellow-300 font-semibold"
        >
          {word}
        </span>
      )
    }

    return <React.Fragment key={i}>{word}</React.Fragment>
  })
}
