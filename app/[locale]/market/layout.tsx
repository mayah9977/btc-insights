import type { ReactNode } from 'react'

/* 🔐 VIP (Server) */
import { getUserVIPLevel } from '@/lib/vip/vipServer'
import type { VIPLevel } from '@/lib/vip/vipTypes'

/* 🧩 Client Wrapper */
import CasinoClientRoot from './CasinoClientRoot'

export default async function CasinoLayout({
  children,
}: {
  children: ReactNode
}) {
  const userId = 'dev-user'
  const vipLevel: VIPLevel = await getUserVIPLevel(userId)

  return (
    <CasinoClientRoot initialLevel={vipLevel}>
      {children}
    </CasinoClientRoot>
  )
}
