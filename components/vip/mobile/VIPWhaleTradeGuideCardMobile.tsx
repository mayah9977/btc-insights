'use client'

type Props = {
  ratio: number
  net: number
}

export default function VIPWhaleTradeGuideCardMobile({
  ratio,
  net
}: Props) {

  const direction =
    net > 0
      ? 'Buy Pressure'
      : net < 0
      ? 'Sell Pressure'
      : 'Neutral'

  const color =
    net > 0
      ? 'text-emerald-400'
      : net < 0
      ? 'text-blue-400'
      : 'text-gray-400'

  return (

    <div
      className="
      mx-4
      rounded-xl
      border
      border-zinc-800
      bg-zinc-900
      p-4
      text-sm
      space-y-3
    "
    >

      <div className="flex justify-between">

        <div className="text-white font-semibold">
          Whale Trade Flow
        </div>

        <div className={`font-semibold ${color}`}>
          {direction}
        </div>

      </div>

      <div className="text-xs text-gray-400">
        Trade Ratio {(ratio * 100).toFixed(1)}%
      </div>

      <div className="text-xs text-gray-500">
        Net Flow {(net * 100).toFixed(1)}%
      </div>

    </div>

  )

}
