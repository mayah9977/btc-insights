// components/vip/VIPActionGateContextBar.tsx

import React from 'react'
import { ActionGateStatus } from '@/components/system/ActionGateStatus'
import { ActionGateRenderer } from '@/components/market/interpretation'
import { useActionGateState } from '@/lib/market/store/useActionGateState'

interface VIPActionGateContextBarProps {
  symbol: string
}

export const VIPActionGateContextBar: React.FC<VIPActionGateContextBarProps> = ({
  symbol,
}) => {
  const gate = useActionGateState(symbol)

  return (
    <div style={{ display: 'grid', gap: '8px' }}>
      {/* 1) 해석 가능성 상태 “표시” (읽기 전용) */}
      <ActionGateStatus state={gate} />

      {/* 2) 상태에 따라 물리적으로 다른 Risk/Judgment 트리 렌더 */}
      <ActionGateRenderer gate={gate} />
    </div>
  )
}
