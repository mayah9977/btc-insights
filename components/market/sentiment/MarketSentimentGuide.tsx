'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Props = {
  value: number
}

type Band = {
  key: string
  from: number
  to: number
  label: string
  tone: 'FEAR' | 'NEUTRAL' | 'GREED'
  mood: string
  meaning: string
  do: string[]
  dont: string[]
  checklist: string[]
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function getToneColor(tone: Band['tone']) {
  if (tone === 'FEAR') return '#ef4444'
  if (tone === 'GREED') return '#10b981'
  return '#eab308'
}

function pickBand(value: number, bands: Band[]) {
  const v = clamp(Math.round(value), 0, 100)
  return bands.find(b => v >= b.from && v <= b.to) ?? bands[2]
}

function formatRange(from: number, to: number) {
  return `${from}–${to}`
}

export default function VIPSentimentGuide({ value }: Props) {
  const [open, setOpen] = useState(false)

  const v = useMemo(() => clamp(Math.round(value), 0, 100), [value])

  const bands: Band[] = useMemo(
    () => [
      {
        key: 'extreme-fear',
        from: 0,
        to: 20,
        label: 'Extreme Fear (공포)',
        tone: 'FEAR',
        mood: '투매/불안/패닉. 손절이 연쇄적으로 발생하기 쉬운 구간',
        meaning:
          '가격이 “나쁘다”기보다, 심리가 반응하는 구간입니다. 변동성이 급증하고, 저점 근처에서 과매도 신호가 동반될 수 있습니다.',
        do: [
          '레버리지 최소화 + 분할 접근(진입/추가/손절 라인 사전 고정)',
          '현금 비중 확보 후 “확인 매수” (구조/거래량/리테스트 확인)',
          '리스크 이벤트(뉴스/청산/변동성) 체크 후 트레이드 크기 축소',
        ],
        dont: [
          '한 번에 몰빵 진입(패닉 구간에서는 저점이 “더 저점”이 될 수 있음)',
          '손절 기준 없이 “버티기” (계좌가 먼저 무너짐)',
          '반등 캔들 하나에 추격 매수',
        ],
        checklist: [
          '손절 라인은 정했나?',
          '포지션 크기가 평소 대비 줄었나?',
          '반등이 “거래량 동반”인지 확인했나?',
          '급락 원인이 단발성/구조적 이슈인지 분리했나?',
        ],
      },
      {
        key: 'fear',
        from: 21,
        to: 40,
        label: 'Fear (경계)',
        tone: 'FEAR',
        mood: '조심/불신. 반등이 와도 “의심”이 강한 구간',
        meaning:
          '추세가 아직 확정되지 않은 상태입니다. 반등이 나오더라도 상단 저항에서 되밀릴 가능성이 커 “리스크 관리형 매매”가 유리합니다.',
        do: [
          '단기 대응(짧은 목표/빠른 손절) + 추세 확인 전 과감한 레버리지 금지',
          '핵심 레벨(저항/지지) 기반으로만 진입',
          '리스크-리워드가 1:2 이상 되는 자리만 거래',
        ],
        dont: [
          '애매한 구간에서 잦은 매매(수수료/심리 소모)',
          '“이번엔 다르다” 확신으로 포지션 확대',
        ],
        checklist: [
          '진입 근거가 “레벨” 기반인가?',
          '손익비가 1:2 이상인가?',
          '추세 전환 확인 신호(고점 돌파/리테스트)가 있는가?',
        ],
      },
      {
        key: 'neutral',
        from: 41,
        to: 60,
        label: 'Neutral (중립)',
        tone: 'NEUTRAL',
        mood: '균형/대기. 방향성보다 “준비”가 중요한 구간',
        meaning:
          '시장이 균형을 잡는 구간입니다. 방향성이 약하므로 “브레이크아웃/이탈”을 대비하는 구조적 접근이 효율적입니다.',
        do: [
          '상/하단 시나리오를 나눠 대기 주문(분할) 준비',
          '변동성 축적 구간에서는 “확정된 신호”만 반응',
          '포지션을 가볍게 유지하며 정보(온체인/수급/뉴스) 동기화',
        ],
        dont: [
          '지루함 때문에 무의미한 진입(중립 구간은 흔들기 장세가 많음)',
          '근거 없는 확신으로 방향 베팅',
        ],
        checklist: [
          '상단 돌파/하단 이탈 시 액션 플랜이 있는가?',
          '손절/익절을 미리 정했는가?',
          '현재는 “관망이 수익”일 수 있음을 인정했는가?',
        ],
      },
      {
        key: 'greed',
        from: 61,
        to: 80,
        label: 'Greed (탐욕)',
        tone: 'GREED',
        mood: '낙관/추격. 수익이 늘수록 리스크가 커지는 구간',
        meaning:
          '추격 심리가 커지면서 단기 고점 형성 가능성이 높아집니다. 이 구간은 “수익 보호”가 핵심이며, 리스크를 키우기보다 관리해야 합니다.',
        do: [
          '분할 익절 + 트레일링 스탑으로 수익 보호',
          '추격 진입은 줄이고 “리테스트/눌림”에서만 제한적으로 접근',
          '포지션이 커졌다면 레버리지/증거금을 줄여 변동성 대응',
        ],
        dont: [
          '상승이 계속될 것이라는 확신으로 추격 매수',
          '익절 없이 “더 간다”만 반복',
        ],
        checklist: [
          '익절 라인이 존재하는가?',
          '리테스트 없는 급등 구간에서 진입하지 않는가?',
          '포지션이 커졌다면 리스크를 낮췄는가?',
        ],
      },
      {
        key: 'extreme-greed',
        from: 81,
        to: 100,
        label: 'Extreme Greed (과열)',
        tone: 'GREED',
        mood: '과열/FOMO. 작은 악재에도 급락(롱 청산)이 나기 쉬운 구간',
        meaning:
          '과열 구간에서는 “예상보다 더 오를” 수 있지만, 동시에 “예상보다 더 크게” 빠질 수 있습니다. 리스크 관리가 최우선입니다.',
        do: [
          '포지션 축소 + 분할 익절(수익 확보가 목적)',
          '급등 이후에는 되돌림(조정) 대비: 손절을 촘촘하게',
          '레버리지 낮추고, 신규 진입은 신중하게(기회는 다시 옴)',
        ],
        dont: [
          '고점 추격(특히 레버리지) — 과열은 청산으로 끝나는 경우가 많음',
          '손절 없는 “확신” (과열 후 변동성 폭발)',
        ],
        checklist: [
          '수익을 “현금화”했는가?',
          '청산/급락에 대비한 손절이 있는가?',
          '지금 진입이 “필수”인지, “욕심”인지 구분했는가?',
        ],
      },
    ],
    [],
  )

  const band = useMemo(() => pickBand(v, bands), [v, bands])
  const toneColor = getToneColor(band.tone)

  // 접힌 상태(요약) 문장: "현재 숫자 + 현재는 어떤 구간 + 행동 한 줄"
  const compact = useMemo(() => {
    const oneLineAction =
      band.tone === 'FEAR'
        ? '지금은 리스크를 줄이고, “확인된 자리”만 가볍게 대응하세요.'
        : band.tone === 'GREED'
        ? '지금은 수익 보호가 핵심입니다. 추격보단 분할 익절/스탑을 우선하세요.'
        : '지금은 방향 확정 전입니다. 상·하단 시나리오를 준비하고 관망 비중을 높이세요.'
    return {
      status: `${band.label}`,
      summary: `현재 지수는 ${v} 입니다. ${band.label} 구간입니다.`,
      action: oneLineAction,
    }
  }, [band, v])

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="
        relative
        mt-6
        rounded-2xl
        p-[1px]
        bg-gradient-to-r
        from-yellow-600/40
        via-neutral-700
        to-yellow-600/40
        cursor-pointer
      "
      onClick={() => setOpen(!open)}
    >
      <div className="bg-black rounded-2xl p-6 relative overflow-hidden">
        {/* subtle gold glow */}
        <motion.div
          animate={{ opacity: [0.05, 0.12, 0.05] }}
          transition={{ repeat: Infinity, duration: 4 }}
          className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-transparent to-yellow-500/10"
        />

        {/* 좌측 상단 럭셔리 라벨 */}
        <div className="relative z-10">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-neutral-400 tracking-wide">
              HOW TO USE THE MARKET SENTIMENT INDEX (시장심리지수 활용방법)
            </div>

            <motion.div
              animate={{ opacity: [0.65, 1, 0.65] }}
              transition={{ repeat: Infinity, duration: 3.4 }}
              className="text-[11px] px-2 py-1 rounded-full border"
              style={{
                borderColor: `${toneColor}55`,
                color: toneColor,
                boxShadow: `0 0 18px ${toneColor}22`,
              }}
            >
              LIVE · {v}
            </motion.div>
          </div>

          {/* ✅ 접힌 상태: 아주 간결하게 */}
          <div className="mt-3 space-y-2">
            <div className="text-sm text-neutral-300">
              <strong className="text-yellow-400">지표 범위:</strong>{' '}
              0 = Extreme Fear / 50 = Neutral / 100 = Extreme Greed
            </div>

            <div className="text-sm text-white">
              {compact.summary}
            </div>

            <div className="text-sm font-medium" style={{ color: toneColor }}>
              {compact.action}
            </div>

            <div className="text-xs text-neutral-500 mt-1">
              (클릭하면 0–100 구간별 심리·전략·행동가이드를 매우 상세하게 볼 수 있습니다)
            </div>
          </div>

          {/* ✅ 펼친 상태: “이렇게 신경썼나” 수준 */}
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.45 }}
                className="overflow-hidden mt-5"
              >
                <div className="border-t border-neutral-800 pt-5 space-y-5">
                  {/* 1) 현재 구간 상세 */}
                  <div className="space-y-2">
                    <div className="text-xs text-neutral-400">
                      CURRENT INTERPRETATION
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div
                        className="text-sm font-semibold px-3 py-1 rounded-full border"
                        style={{
                          borderColor: `${toneColor}66`,
                          color: toneColor,
                          background: `${toneColor}12`,
                        }}
                      >
                        {band.label}
                      </div>

                      <div className="text-sm text-neutral-300">
                        <span className="text-neutral-500">심리:</span>{' '}
                        {band.mood}
                      </div>
                    </div>

                    <div className="text-sm text-neutral-300 leading-relaxed">
                      {band.meaning}
                    </div>
                  </div>

                  {/* 2) 0–100 구간 맵 (클릭해도 좋고, 시각적으로 강하게) */}
                  <div className="space-y-2">
                    <div className="text-xs text-neutral-400">
                      RANGE MAP (0–100)
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                      {bands.map((b) => {
                        const active = v >= b.from && v <= b.to
                        const c = getToneColor(b.tone)
                        return (
                          <div
                            key={b.key}
                            className={`
                              rounded-xl border p-3
                              ${active ? 'bg-neutral-900' : 'bg-black'}
                            `}
                            style={{
                              borderColor: active ? `${c}88` : 'rgba(255,255,255,0.08)',
                              boxShadow: active ? `0 0 22px ${c}22` : 'none',
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="text-[11px] text-neutral-400">
                                {formatRange(b.from, b.to)}
                              </div>
                              {active && (
                                <span
                                  className="text-[11px] px-2 py-[2px] rounded-full"
                                  style={{
                                    background: `${c}22`,
                                    color: c,
                                  }}
                                >
                                  NOW
                                </span>
                              )}
                            </div>
                            <div className="text-sm font-semibold text-white mt-1">
                              {b.label}
                            </div>
                            <div className="text-xs text-neutral-400 mt-2 leading-relaxed">
                              {b.mood}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* 3) 행동 가이드 (Do / Don't) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
                      <div className="text-xs text-neutral-400 mb-3">
                        WHAT TO DO (권장 행동)
                      </div>
                      <ul className="space-y-2 text-sm text-neutral-200">
                        {band.do.map((x, i) => (
                          <li key={i} className="flex gap-2">
                            <span
                              className="mt-[6px] w-1.5 h-1.5 rounded-full"
                              style={{ background: toneColor }}
                            />
                            <span className="leading-relaxed">{x}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
                      <div className="text-xs text-neutral-400 mb-3">
                        WHAT NOT TO DO (금지 행동)
                      </div>
                      <ul className="space-y-2 text-sm text-neutral-200">
                        {band.dont.map((x, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="mt-[6px] w-1.5 h-1.5 rounded-full bg-neutral-500" />
                            <span className="leading-relaxed">{x}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* 4) 트레이더 체크리스트 */}
                  <div className="rounded-2xl border border-neutral-800 bg-black p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs text-neutral-400">
                        PRE-TRADE CHECKLIST
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        “진입 전 10초만 체크”
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                      {band.checklist.map((x, i) => (
                        <div
                          key={i}
                          className="rounded-xl border border-neutral-800 bg-neutral-900/30 px-3 py-2 text-sm text-neutral-200"
                        >
                          <span className="text-neutral-500 mr-2">✓</span>
                          {x}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 5) 하단 안내 */}
                  <div className="text-xs text-neutral-500 leading-relaxed">
                    ※ 본 지표는 “시장 심리”를 숫자로 요약한 보조 지표입니다. <br />
                    단독으로 매매를 결정하기보다, <span className="text-neutral-300">추세/레벨/변동성</span>과 함께
                    결합해 사용하세요.
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
