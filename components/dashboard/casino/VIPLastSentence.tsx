'use client'

import { motion } from 'framer-motion'

export default function VIPLastSentence() {
  return (
    <motion.p
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="text-xs text-zinc-400"
    >
      이 판단은 <b className="text-zinc-300">나중에 설명할 수 없습니다.</b><br />
      지금 이 순간의 기록만이 근거로 남습니다.
    </motion.p>
  )
}
