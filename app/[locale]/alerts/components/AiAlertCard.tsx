'use client'

export default function AiAlertCard({
  suggestion,
  onAccept,
}: {
  suggestion: any
  onAccept: () => void
}) {
  if (!suggestion) return null

  return (
    <div className="border border-indigo-300 bg-indigo-50 rounded-xl p-4">
      <div className="font-semibold text-indigo-700">
        🤖 AI 알림 추천
      </div>

      <div className="text-sm mt-1">
        {suggestion.memo} (±{suggestion.percent}% 변동)
      </div>

      <button
        onClick={onAccept}
        className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg"
      >
        알림 추가
      </button>
    </div>
  )
}
