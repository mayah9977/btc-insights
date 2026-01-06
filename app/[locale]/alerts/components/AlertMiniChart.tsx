'use client'

export default function AlertMiniChart() {
  return (
    <div className="mt-4 h-16 w-full overflow-hidden rounded-lg bg-black/40">
      {/* Fake TradingView-style sparkline */}
      <svg viewBox="0 0 100 40" className="h-full w-full">
        <polyline
          fill="none"
          stroke="#38BDF8"
          strokeWidth="2"
          points="
            0,30
            10,28
            20,32
            30,20
            40,24
            50,18
            60,22
            70,16
            80,18
            90,12
            100,14
          "
        />
      </svg>
    </div>
  )
}
