'use client'

export default function VIPReportDownloadCard() {

  const handleDownload = () => {
    window.open('/api/cron/vip-report', '_blank')
  }

  return (
    <div className="px-4">

      <button
        onClick={handleDownload}
        className="
        w-full
        rounded-xl
        border
        border-yellow-700/30
        bg-gradient-to-r
        from-yellow-400
        to-orange-500
        text-black
        py-3
        px-4
        flex
        items-center
        justify-center
        gap-2
        font-semibold
        shadow-lg
        active:scale-[0.97]
        transition
        "
      >

        <span className="text-lg">
          📄
        </span>

        <span>
          Download 오늘의뉴스
        </span>

      </button>

    </div>
  )
}
