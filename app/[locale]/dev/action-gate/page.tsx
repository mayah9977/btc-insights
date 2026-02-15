// app/[locale]/dev/action-gate/page.tsx

import React from 'react'
import type { ActionGateState } from '@/components/system/ActionGateStatus'
import { ActionGateStatus } from '@/components/system/ActionGateStatus'
import { ActionGateRenderer } from '@/components/market/interpretation'

function normalizeGate(v: unknown): ActionGateState {
  if (v === 'OBSERVE' || v === 'CAUTION' || v === 'IGNORE') return v
  return 'OBSERVE'
}

export default function DevActionGatePage({
  searchParams,
}: {
  searchParams: { gate?: string }
}) {
  const gate = normalizeGate(searchParams.gate)

  return (
    <div style={{ padding: 16, display: 'grid', gap: 8 }}>
      <ActionGateStatus state={gate} />
      <ActionGateRenderer gate={gate} />
    </div>
  )
}
