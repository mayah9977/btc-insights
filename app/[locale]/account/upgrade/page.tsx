import VIPValueSummary from '@/components/vip/VIPValueSummary'

export default function UpgradePage() {
  return (
    <main className="max-w-5xl mx-auto py-16 space-y-10">
      <section className="space-y-4">
        <h1 className="text-3xl font-bold text-white">
          VIP가 되면 이런 판단을 받게 됩니다
        </h1>
        <p className="text-neutral-400">
          실제 수익이 아닌, 시나리오 기준 판단 요약입니다.
        </p>
      </section>

      {/* ✅ VIP 미리보기 */}
      <VIPValueSummary
        btcPrice={62338}
        avoidedExtremeCount={12}
        avoidedLossUSD={1840}
      />

      {/* 결제 버튼 */}
      {/* <CheckoutButton /> */}
    </main>
  )
}
