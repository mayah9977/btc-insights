// app/[locale]/casino/vip/layout.tsx
import type { ReactNode } from 'react';
import { VIPGuard } from '@/components/VIPGuard';

export default function VIPLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <VIPGuard require="VIP1">
      {children}
    </VIPGuard>
  );
}
