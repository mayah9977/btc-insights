// app/[locale]/casino/page.tsx

import { getSession } from '@/lib/auth/session'
import CasinoClientPage from './CasinoClientPage'

export default async function CasinoPage() {
  const session = await getSession()

  const isLoggedIn = !!session
  const isVIP = session?.role === 'VIP'

  return (
    <CasinoClientPage
      isLoggedIn={isLoggedIn}
      isVIP={isVIP}
    />
  )
}
