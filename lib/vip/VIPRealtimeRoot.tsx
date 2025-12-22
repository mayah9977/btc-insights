'use client';

import React, { useState } from 'react';
import { VIPProvider } from './vipClient';
import { useVipRealtime } from './useVipRealtime';
import { VIPLevel } from './vipTypes';

export function VIPRealtimeRoot({
  initialLevel,
  children,
}: {
  initialLevel: VIPLevel;
  children: React.ReactNode;
}) {
  const [vip, setVip] = useState<VIPLevel>(initialLevel);

  useVipRealtime(setVip);

  return <VIPProvider vipLevel={vip}>{children}</VIPProvider>;
}
