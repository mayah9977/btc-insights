import { getUserVIPState } from '@/lib/vip/vipDB'
import { recoverVIPFromStripe } from './recoverFromStripe'

export async function safeLoadVIP(userId: string) {
  const state = await getUserVIPState(userId)

  if (!state) {
    await recoverVIPFromStripe(userId)
    return
  }

  if (state.expiredAt < Date.now()) {
    await recoverVIPFromStripe(userId)
  }
}
