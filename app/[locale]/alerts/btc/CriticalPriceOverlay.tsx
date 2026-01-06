'use client'

import clsx from 'clsx'

type Props = {
  price: number | null
  onConfirm: () => void
}

const CRITICAL_PRICE = 98_000

export default function CriticalPriceOverlay({
  price,
  onConfirm,
}: Props) {
  if (price === null || price > CRITICAL_PRICE) return null

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 backdrop-blur">
      {/* 🔴 RED FLASH */}
      <div className="absolute inset-0 animate-[pulse_1s_ease-in-out_infinite] bg-red-600/20" />

      <div
        className={clsx(
          'relative mx-6 w-full max-w-[420px] rounded-3xl p-8 text-center',
          'bg-gradient-to-b from-[#1a0505] to-[#0b0202]',
          'border-4 border-red-600 shadow-[0_0_120px_rgba(239,68,68,0.95)]',
          'animate-[shake_0.6s_ease-in-out]',
        )}
      >
        <div className="text-xs font-extrabold tracking-widest text-red-400">
          SYSTEM CRITICAL
        </div>

        <div className="mt-4 text-4xl font-black text-red-500">
          BTC {CRITICAL_PRICE.toLocaleString()}
        </div>

        <div className="mt-2 text-lg font-bold text-red-300">
          CRITICAL PRICE ZONE HIT
        </div>

        <p className="mt-4 text-sm text-red-200/80">
          강력한 변동성 구간 진입
          <br />
          포지션 및 리스크 즉시 점검 필요
        </p>

        <button
          type="button"
          onClick={onConfirm}
          className="mt-8 h-12 w-full rounded-xl bg-red-600 font-extrabold text-white transition hover:bg-red-500 active:scale-[0.97]"
        >
          위험 인지 완료
        </button>
      </div>
    </div>
  )
}
