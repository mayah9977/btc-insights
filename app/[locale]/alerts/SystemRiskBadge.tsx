// app/[locale]/alerts/SystemRiskBadge.tsx

import clsx from 'clsx'

type RiskLevel = 'SAFE' | 'WARNING' | 'CRITICAL'

export default function SystemRiskBadge({
  level,
}: {
  level: RiskLevel
}) {
  const styles: Record<RiskLevel, string> = {
    SAFE: `
      bg-emerald-400
      shadow-[0_0_30px_rgba(16,185,129,0.9)]
    `,
    WARNING: `
      bg-amber-400
      shadow-[0_0_50px_rgba(245,158,11,1)]
      animate-pulse
    `,
    CRITICAL: `
      bg-red-500
      shadow-[0_0_60px_rgba(239,68,68,1)]
      animate-glow
    `,
  }

  return (
    <div
      className={clsx(
        `
        inline-flex items-center justify-center
        
        /* 📱 Mobile: 더 크게 강조 */
        px-6 py-2 text-sm
        
        /* 💻 Desktop: 약간 줄이기 */
        md:px-5 md:py-1.5 md:text-xs
        
        rounded-full
        font-extrabold
        tracking-wide
        text-black
        
        transition-all duration-200
        hover:scale-105
        `,
        styles[level],
      )}
    >
      BTC price 알람 / 인디케이터 알람시스템 
    </div>
  )
}
