//app/[locale]/market/layout.tsx

import type { ReactNode } from 'react'

/* 🔐 VIP (Server) */
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getUserVIPLevel } from '@/lib/vip/vipServer'
import type { VIPLevel } from '@/lib/vip/vipTypes'

/* 🎨 Client Wrapper */
import CasinoClientRoot from './CasinoClientRoot'

export default async function CasinoLayout({
  children,
}: {
  children: ReactNode
}) {
  const user = await getCurrentUser()

  const vipLevel: VIPLevel = user
    ? await getUserVIPLevel(user.id)
    : 'FREE'

  return (
    <CasinoClientRoot initialLevel={vipLevel}>
      {children}
    </CasinoClientRoot>
  )
}
