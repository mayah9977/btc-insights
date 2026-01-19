'use client'

type Props = {
  isVIP: boolean
  children: React.ReactNode
}

export function VIPBlurGate({ isVIP, children }: Props) {
  // VIP 유저는 그대로 렌더
  if (isVIP) {
    return <>{children}</>
  }

  return (
    <div className="relative">
      {/* Blur 된 컨텐츠 (보이되 조작 불가) */}
      <div className="blur-sm opacity-70 pointer-events-none select-none">
        {children}
      </div>

      {/* Overlay CTA */}
      <div className="absolute inset-0 z-20 flex items-center justify-center">
        <button
          onClick={() =>
            (window.location.href = '/ko/account/upgrade')
          }
          className="
            px-6 py-3
            rounded-full
            bg-vipAccent
            text-black
            font-semibold
            shadow-lg
            hover:scale-105
            transition
          "
        >
          VIP에서 판단 근거 확인
        </button>
      </div>
    </div>
  )
}
