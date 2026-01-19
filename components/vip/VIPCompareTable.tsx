export default function VIPCompareTable() {
  return (
    <div className="mt-10 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        FREE vs VIP 차이
      </h3>

      <div className="grid grid-cols-3 text-sm">
        <div></div>
        <div className="text-neutral-400">FREE</div>
        <div className="text-yellow-400">VIP</div>

        <div className="py-2">실시간 리스크 판단</div>
        <div className="py-2 text-neutral-500">요약</div>
        <div className="py-2 text-green-400">전체 분석</div>

        <div className="py-2">EXTREME 감지</div>
        <div className="py-2 text-neutral-500">제한</div>
        <div className="py-2 text-green-400">즉시</div>

        <div className="py-2">손실 회피 기록</div>
        <div className="py-2 text-neutral-500">없음</div>
        <div className="py-2 text-green-400">전체 제공</div>

        <div className="py-2">시나리오 근거</div>
        <div className="py-2 text-neutral-500">표시 안됨</div>
        <div className="py-2 text-green-400">타임라인 제공</div>
      </div>
    </div>
  )
}
