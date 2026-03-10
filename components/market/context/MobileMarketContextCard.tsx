'use client'

interface Props {
  headlines: string[]
  summary: string
  outlook: string
  updated: string
}

export default function MobileMarketContextCard({
  headlines,
  summary,
  outlook,
  updated
}: Props) {

  return (

    <div
      className="
      mx-4
      rounded-xl
      border
      border-yellow-700/30
      bg-zinc-900
      p-4
      space-y-4
      shadow-lg
      "
    >

      {/* Header */}

      <div className="flex items-center justify-between">

        <div className="text-yellow-400 font-semibold">
          📰 Market Intelligence
        </div>

        <div className="text-xs text-gray-400">
          Updated {updated}
        </div>

      </div>

      {/* Headlines */}

      <div className="space-y-2">

        <div className="text-blue-400 text-sm">
          🔹 Latest Headlines
        </div>

        <ul className="text-sm text-gray-300 space-y-1">

          {headlines.map((h,i)=>(
            <li key={i}>
              • {h}
            </li>
          ))}

        </ul>

      </div>

      {/* Summary */}

      <div className="space-y-1">

        <div className="text-yellow-400 text-sm">
          🧠 Market Summary
        </div>

        <p className="text-gray-300 text-sm">
          {summary}
        </p>

      </div>

      {/* Outlook */}

      <div className="space-y-1">

        <div className="text-yellow-400 text-sm">
          📊 Institutional View
        </div>

        <p className="text-gray-300 text-sm">
          {outlook}
        </p>

      </div>

    </div>

  )
}
