type VIPCardProps = {
  title?: string
  children: React.ReactNode
  accent?: 'default' | 'safe' | 'danger'
}

export default function VIPCard({
  title,
  children,
  accent = 'default',
}: VIPCardProps) {
  const accentBorder =
    accent === 'safe'
      ? 'border-vipSafe/40'
      : accent === 'danger'
      ? 'border-vipDanger/40'
      : 'border-vipBorder'

  const accentGlow =
    accent === 'safe'
      ? 'shadow-[0_0_0_1px_rgba(16,185,129,0.15),0_20px_60px_rgba(0,0,0,0.6)]'
      : accent === 'danger'
      ? 'shadow-[0_0_0_1px_rgba(239,68,68,0.2),0_20px_60px_rgba(0,0,0,0.7)]'
      : 'shadow-[0_20px_60px_rgba(0,0,0,0.6)]'

  return (
    <section
      className={[
        'relative rounded-2xl border p-6',
        'bg-gradient-to-b from-vipCard/95 to-vipCard',
        'transition-all',
        accentBorder,
        accentGlow,
      ].join(' ')}
    >
      {title && (
        <header className="mb-4 text-xs font-semibold tracking-widest text-zinc-400 uppercase">
          {title}
        </header>
      )}

      <div className="text-zinc-200 leading-relaxed">
        {children}
      </div>
    </section>
  )
}
