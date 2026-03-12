'use client'

/*
=================================
VIP NO ENTRY REASON BANNER DISABLED
(legacy component - kept for reference)
=================================
*/

import { motion } from 'framer-motion'
import { useLiveRiskState } from '@/lib/realtime/liveRiskState'
import type { RiskLevel } from '@/lib/vip/riskTypes'

type Props = {
  summary?: string | null
  reason?: string | null
}

export default function VIPNoEntryReasonBanner({
  summary,
  reason,
}: Props) {

  /* Legacy banner disabled */

  return null

}
