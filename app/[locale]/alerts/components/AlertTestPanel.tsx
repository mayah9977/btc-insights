'use client'

export default function AlertTestPanel() {
  async function triggerPrice() {
    // 현재 BTC 가격을 강제로 120,000으로 트리거
    await fetch('/api/alerts/test-trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbol: 'BTCUSDT',
        price: 120000,
      }),
    })
    alert('🚨 테스트 트리거 실행됨 (120,000)')
  }

  async function pushToast() {
    // 프론트 푸시 테스트 (Toast/SSE 확인용)
    await fetch('/api/alerts/test-push', { method: 'POST' })
    alert('📣 테스트 푸시 전송')
  }

  return (
    <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4">
      <div className="text-xs font-bold tracking-widest text-yellow-400">
        TEST PANEL
      </div>

      <button
        onClick={triggerPrice}
        className="w-full rounded-xl bg-red-600 py-2 font-bold text-white hover:bg-red-500"
      >
        🚨 FORCE PRICE TRIGGER
      </button>

      <button
        onClick={pushToast}
        className="w-full rounded-xl bg-indigo-600 py-2 font-bold text-white hover:bg-indigo-500"
      >
        📣 PUSH NOTIFICATION TEST
      </button>
    </div>
  )
}
