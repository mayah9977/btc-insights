export function VIPBlurGate({ children }: any) {
  return (
    <div className="relative">
      <div className="blur-sm pointer-events-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <button className="px-6 py-2 rounded-full bg-vipAccent text-black font-semibold">
          VIP에서 판단 근거 확인
        </button>
      </div>
    </div>
  )
}
