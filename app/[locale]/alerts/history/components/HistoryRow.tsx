type Props = {
  history: {
    symbol: string
    condition: string
    price: number
    percent?: number
    triggeredAt: number
  }
}

export default function HistoryRow({ history }: Props) {
  return (
    <div className="flex justify-between items-center rounded-xl bg-[#0f131a] border border-white/10 px-5 py-4">
      <div>
        <div className="font-medium tracking-wide">
          {history.symbol}
        </div>
        <div className="text-sm text-gray-400">
          {history.condition}
          {history.percent !== undefined && ` (${history.percent.toFixed(2)}%)`}
        </div>
      </div>

      <div className="text-right">
        <div className="font-semibold">
          {history.price.toLocaleString()}
        </div>
        <div className="text-xs text-gray-500">
          {new Date(history.triggeredAt).toLocaleString()}
        </div>
      </div>
    </div>
  )
}
