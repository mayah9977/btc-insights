// components/vip/VIP3Only.tsx
'use client';

import { ReactNode } from 'react';
import { useVIP } from '@/lib/vip/vipClient';

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

export function VIP3Only({ children, fallback = null }: Props) {
  const { vipLevel } = useVIP();

  if (vipLevel !== 'VIP3') {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
