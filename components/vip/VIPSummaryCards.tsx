'use client'

/*
=================================
VIP SUMMARY CARDS DISABLED
(legacy component - kept for reference)
=================================
*/

type Summary = {
  period: '7d' | '30d'
  avoidedLossUSD: number
  avoidedExtremeCount: number
}

export default function VIPSummaryCards({
  weekly,
  monthly,
}: {
  weekly: Summary
  monthly: Summary
}) {

  return null

}
