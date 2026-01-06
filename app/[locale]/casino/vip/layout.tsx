import type { ReactNode } from 'react'
import { VIPGuard } from '@/components/VIPGuard'

export default function VIPLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <VIPGuard require="VIP1">
      {/* ❗ 배경/높이 제거 — RootLayout 단일 책임 */}
      <div className="relative">
        <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
          {children}
        </div>
      </div>
    </VIPGuard>
  )
}
