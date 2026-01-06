import clsx from 'clsx'

type RiskLevel = 'SAFE' | 'WARNING' | 'CRITICAL'

export default function SystemRiskBadge({
  level,
}: {
  level: RiskLevel
}) {
  const styles: Record<RiskLevel, string> = {
    SAFE: 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.8)]',
    WARNING: 'bg-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.9)] animate-pulse',
    CRITICAL:
      'bg-red-600 shadow-[0_0_40px_rgba(239,68,68,1)] animate-glow',
  }

  return (
    <div
      className={clsx(
        'px-4 py-1 rounded-full text-xs font-extrabold text-black',
        styles[level]
      )}
    >
      SYSTEM RISK · {level}
    </div>
  )
}
