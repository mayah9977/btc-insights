'use client'

export function InsightsShareActions() {
  const pdfUrl = '/api/vip/risk-report'

  return (
    <div className="flex gap-2">
      <a
        href={pdfUrl}
        target="_blank"
        className="
          px-3 py-1 rounded-md text-sm
          bg-white/10 hover:bg-white/20
        "
      >
        Download PDF
      </a>

      <button
        onClick={() => {
          navigator.clipboard.writeText(
            window.location.href
          )
          alert('Insights link copied')
        }}
        className="
          px-3 py-1 rounded-md text-sm
          bg-white/10 hover:bg-white/20
        "
      >
        Copy Link
      </button>
    </div>
  )
}
