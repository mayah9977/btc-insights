import { motion, AnimatePresence } from 'framer-motion'

type Props = {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'
}

const styleMap = {
  LOW: {
    bg: 'bg-vipSafe/20',
    text: 'text-emerald-300',
    glow: 'shadow-[0_0_24px_rgba(16,185,129,0.35)]',
  },
  MEDIUM: {
    bg: 'bg-vipAccent/20',
    text: 'text-sky-300',
    glow: 'shadow-[0_0_24px_rgba(56,189,248,0.35)]',
  },
  HIGH: {
    bg: 'bg-vipDanger/20',
    text: 'text-red-300',
    glow: 'shadow-[0_0_32px_rgba(239,68,68,0.45)]',
  },
  EXTREME: {
    bg: 'bg-vipDanger/30',
    text: 'text-red-200',
    glow: 'shadow-[0_0_48px_rgba(239,68,68,0.65)]',
  },
}

export default function VIPRiskPulse({ riskLevel }: Props) {
  const s = styleMap[riskLevel]

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={riskLevel}
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 1.05, opacity: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className={[
          'rounded-xl px-5 py-4',
          'border border-white/5',
          'backdrop-blur',
          s.bg,
          s.glow,
        ].join(' ')}
      >
        <div className={`text-sm font-semibold tracking-wide ${s.text}`}>
          RISK LEVEL
        </div>
        <div className={`mt-1 text-2xl font-extrabold ${s.text}`}>
          {riskLevel}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
