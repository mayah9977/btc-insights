export default function VIPCompareTable() {
  return (
    <div className="mt-12 grid md:grid-cols-2 gap-6">

      {/* =========================
         FREE CARD
      ========================= */}
      <div className="
        rounded-2xl
        border border-neutral-800
        bg-neutral-900/60
        p-6
        space-y-4
      ">
        <h3 className="text-lg font-semibold text-white">
          FREE Access
        </h3>

        <p className="text-sm text-neutral-400">
          기본 시장 알림 기능 제공
        </p>

        <ul className="text-sm text-neutral-500 space-y-2">
          <li>• 실시간 기본 알림 수신</li>
          <li>• 제한된 이벤트 기록 열람</li>
          <li>• 리스크 구조 요약 정보</li>
        </ul>

        <div className="text-xs text-neutral-600 pt-4 border-t border-neutral-800">
          기본 알림 시스템 접근 권한
        </div>
      </div>

      {/* =========================
         VIP CARD
      ========================= */}
      <div className="
        rounded-2xl
        border border-yellow-500/30
        bg-gradient-to-b
        from-yellow-500/10
        to-neutral-900
        p-6
        space-y-4
        shadow-[0_0_40px_rgba(250,204,21,0.08)]
      ">
        <h3 className="text-lg font-semibold text-yellow-400">
          VIP Intelligent AI Trading OS
        </h3>

        <p className="text-sm text-neutral-300">
          전체 AI 리스크 관측 시스템 접근
        </p>

        <ul className="text-sm text-neutral-200 space-y-2">
          <li>• 🧠 AI 기반 리스크 구조 분석</li>
          <li>• 🐋 Whale Intensity 실시간 추적</li>
          <li>• 📊 중장기 시장 해석 레이어</li>
          <li>• 🔔 고급 이벤트 히스토리</li>
          <li>• 📄 VIP 리포트 다운로드</li>
          <li>• ⚡ SSE 기반 실시간 시스템</li>
        </ul>

        <div className="text-xs text-yellow-300 pt-4 border-t border-yellow-500/20">
          Full System Access
        </div>
      </div>

    </div>
  )
}
